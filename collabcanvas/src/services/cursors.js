import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const CURSORS_COLLECTION = 'cursors';

/**
 * Update user's cursor position in Firestore
 * @param {string} userId - User ID from Firebase Auth
 * @param {string} userName - User's display name
 * @param {number} x - Canvas X position
 * @param {number} y - Canvas Y position
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(userId, userName, x, y) {
  try {
    // Use userId as document ID for easy updates
    const cursorRef = doc(db, CURSORS_COLLECTION, userId);
    await setDoc(cursorRef, {
      userId,
      userName,
      x,
      y,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating cursor position:', error);
    // Don't throw - cursor updates should fail silently
  }
}

/**
 * Remove user's cursor from Firestore (on disconnect)
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<void>}
 */
export async function removeCursor(userId) {
  try {
    const cursorRef = doc(db, CURSORS_COLLECTION, userId);
    await deleteDoc(cursorRef);
    console.log('Cursor removed for user:', userId);
  } catch (error) {
    console.error('Error removing cursor:', error);
  }
}

/**
 * Subscribe to real-time cursor updates from all users
 * @param {string} currentUserId - Current user's ID (to filter out own cursor)
 * @param {Function} callback - Called with array of cursors on each update
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToCursors(currentUserId, callback) {
  try {
    const cursorsCollection = collection(db, CURSORS_COLLECTION);
    
    const unsubscribe = onSnapshot(
      cursorsCollection,
      (snapshot) => {
        const cursors = [];
        
        snapshot.forEach((doc) => {
          const cursor = doc.data();
          
          // Filter out current user's cursor
          if (cursor.userId !== currentUserId) {
            cursors.push({
              id: doc.id,
              ...cursor
            });
          }
        });
        
        callback(cursors);
      },
      (error) => {
        console.error('Error subscribing to cursors:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Exception in subscribeToCursors:', error);
    throw error;
  }
}
