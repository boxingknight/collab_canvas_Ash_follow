import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const PRESENCE_COLLECTION = 'presence';

/**
 * Set user as online in Firestore
 * @param {string} userId - User ID from Firebase Auth
 * @param {string} userName - User's display name
 * @param {string} userEmail - User's email
 * @returns {Promise<void>}
 */
export async function setOnline(userId, userName, userEmail) {
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    await setDoc(presenceRef, {
      userId,
      userName,
      userEmail,
      status: 'online',
      lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp()
    });
    
    console.log('✅ User set to online:', userName);
  } catch (error) {
    console.error('❌ Error setting user online:', error);
    throw error;
  }
}

/**
 * Set user as offline (remove from presence)
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<void>}
 */
export async function setOffline(userId) {
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    await deleteDoc(presenceRef);
    
    console.log('✅ User set to offline:', userId);
  } catch (error) {
    console.error('❌ Error setting user offline:', error);
    // Don't throw - offline should fail silently
  }
}

/**
 * Update user's lastSeen timestamp (heartbeat)
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<void>}
 */
export async function updateHeartbeat(userId) {
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    await setDoc(presenceRef, {
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('❌ Error updating heartbeat:', error);
    // Don't throw - heartbeat should fail silently
  }
}

/**
 * Subscribe to presence updates for all users
 * @param {Function} callback - Called with array of online users on each update
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToPresence(callback) {
  try {
    console.log('👥 Subscribing to presence collection...');
    
    const presenceCollection = collection(db, PRESENCE_COLLECTION);
    
    const unsubscribe = onSnapshot(
      presenceCollection,
      (snapshot) => {
        const onlineUsers = [];
        
        snapshot.forEach((doc) => {
          const user = doc.data();
          onlineUsers.push({
            id: doc.id,
            ...user
          });
        });
        
        // Sort by joinedAt (earliest first)
        onlineUsers.sort((a, b) => {
          if (!a.joinedAt || !b.joinedAt) return 0;
          return a.joinedAt.toMillis() - b.joinedAt.toMillis();
        });
        
        console.log('👥 Online users updated:', onlineUsers.length);
        callback(onlineUsers);
      },
      (error) => {
        console.error('❌ Error subscribing to presence:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Exception in subscribeToPresence:', error);
    throw error;
  }
}
