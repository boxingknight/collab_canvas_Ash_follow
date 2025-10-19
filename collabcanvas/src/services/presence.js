import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Set user as online in Firestore (canvas-scoped)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID from Firebase Auth
 * @param {string} userName - User's display name
 * @param {string} userEmail - User's email
 * @returns {Promise<void>}
 */
export async function setOnline(canvasId, userId, userName, userEmail) {
  try {
    // Canvas-scoped presence: presence/{canvasId}/users/{userId}
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    await setDoc(presenceRef, {
      userId,
      userName,
      userEmail,
      status: 'online',
      lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error setting user online:', error.message);
    throw error;
  }
}

/**
 * Set user as offline (remove from presence)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<void>}
 */
export async function setOffline(canvasId, userId) {
  try {
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    await deleteDoc(presenceRef);
  } catch (error) {
    console.error('Error setting user offline:', error.message);
    // Don't throw - offline should fail silently
  }
}

/**
 * Update user's lastSeen timestamp (heartbeat)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<void>}
 */
export async function updateHeartbeat(canvasId, userId) {
  try {
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    await setDoc(presenceRef, {
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error.message);
    // Don't throw - heartbeat should fail silently
  }
}

/**
 * Subscribe to presence updates for all users on a specific canvas
 * @param {string} canvasId - Canvas ID
 * @param {Function} callback - Called with array of online users on each update
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToPresence(canvasId, callback) {
  try {
    // Canvas-scoped presence: presence/{canvasId}/users
    const presenceCollection = collection(db, 'presence', canvasId, 'users');
    
    const unsubscribe = onSnapshot(
      presenceCollection,
      (snapshot) => {
        const onlineUsers = [];
        const now = Date.now();
        const SIX_HOURS_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        
        snapshot.forEach((doc) => {
          const user = doc.data();
          
          // Check if user has a lastSeen timestamp
          if (user.lastSeen && user.lastSeen.toMillis) {
            const lastSeenTime = user.lastSeen.toMillis();
            const timeSinceLastSeen = now - lastSeenTime;
            
            // Only include users who were seen within the last 6 hours
            if (timeSinceLastSeen <= SIX_HOURS_MS) {
              onlineUsers.push({
                id: doc.id,
                ...user
              });
            } else {
              console.log(`👥 Filtering out ${user.userName} - last seen ${Math.round(timeSinceLastSeen / (60 * 60 * 1000))} hours ago`);
            }
          } else {
            // If no timestamp, include them (just came online)
            onlineUsers.push({
              id: doc.id,
              ...user
            });
          }
        });
        
        // Sort by joinedAt (earliest first)
        onlineUsers.sort((a, b) => {
          if (!a.joinedAt || !b.joinedAt) return 0;
          return a.joinedAt.toMillis() - b.joinedAt.toMillis();
        });
        
        callback(onlineUsers);
      },
      (error) => {
        console.error('Error subscribing to presence:', error.message);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Exception in subscribeToPresence:', error.message);
    throw error;
  }
}
