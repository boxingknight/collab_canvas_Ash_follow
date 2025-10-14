import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const SHAPES_COLLECTION = 'shapes';

/**
 * Add a new shape to Firestore
 * @param {Object} shapeData - Shape data (x, y, width, height, color, type)
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<string>} Document ID of the created shape
 */
export async function addShape(shapeData, userId) {
  try {
    const docRef = await addDoc(collection(db, SHAPES_COLLECTION), {
      x: shapeData.x,
      y: shapeData.y,
      width: shapeData.width,
      height: shapeData.height,
      color: shapeData.color,
      type: shapeData.type || 'rectangle', // Default to rectangle for backward compatibility
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding shape:', error.message);
    throw error;
  }
}

/**
 * Update an existing shape in Firestore
 * @param {string} shapeId - Firestore document ID
 * @param {Object} updates - Fields to update (e.g., { x: 100, y: 200 })
 * @returns {Promise<void>}
 */
export async function updateShape(shapeId, updates) {
  try {
    const shapeRef = doc(db, SHAPES_COLLECTION, shapeId);
    await updateDoc(shapeRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating shape:', error.message);
    throw error;
  }
}

/**
 * Lock a shape for editing by a specific user
 * @param {string} shapeId - Firestore document ID
 * @param {string} userId - User ID acquiring the lock
 * @returns {Promise<boolean>} True if lock was acquired, false if already locked
 */
export async function lockShape(shapeId, userId) {
  try {
    const shapeRef = doc(db, SHAPES_COLLECTION, shapeId);
    await updateDoc(shapeRef, {
      lockedBy: userId,
      lockedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error locking shape:', error.message);
    return false;
  }
}

/**
 * Unlock a shape
 * @param {string} shapeId - Firestore document ID
 * @param {string} userId - User ID releasing the lock (for verification)
 * @returns {Promise<void>}
 */
export async function unlockShape(shapeId, userId) {
  try {
    const shapeRef = doc(db, SHAPES_COLLECTION, shapeId);
    await updateDoc(shapeRef, {
      lockedBy: null,
      lockedAt: null
    });
  } catch (error) {
    console.error('Error unlocking shape:', error.message);
    throw error;
  }
}

/**
 * Check for and clean up stale locks (locks older than 30 seconds)
 * This helps handle cases where a user disconnects while dragging
 * @returns {Promise<number>} Number of stale locks cleaned up
 */
export async function cleanupStaleLocks() {
  try {
    const shapesCollection = collection(db, SHAPES_COLLECTION);
    const snapshot = await getDocs(shapesCollection);
    
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    let cleanedCount = 0;
    
    const cleanupPromises = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      // Check if shape is locked and lock is stale
      if (data.lockedBy && data.lockedAt) {
        const lockAge = now - data.lockedAt.toMillis();
        
        if (lockAge > staleThreshold) {
          const shapeRef = doc(db, SHAPES_COLLECTION, docSnapshot.id);
          cleanupPromises.push(
            updateDoc(shapeRef, {
              lockedBy: null,
              lockedAt: null
            }).then(() => {
              console.log(`Cleaned up stale lock on shape ${docSnapshot.id}`);
              cleanedCount++;
            })
          );
        }
      }
    });
    
    await Promise.all(cleanupPromises);
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up stale locks:', error.message);
    return 0;
  }
}

/**
 * Delete a shape from Firestore
 * @param {string} shapeId - Firestore document ID
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  try {
    const shapeRef = doc(db, SHAPES_COLLECTION, shapeId);
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Error deleting shape:', error.message);
    throw error;
  }
}

/**
 * Subscribe to real-time updates of all shapes
 * @param {Function} callback - Called with array of shapes on each update
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToShapes(callback) {
  try {
    const shapesCollection = collection(db, SHAPES_COLLECTION);
    
    const unsubscribe = onSnapshot(
      shapesCollection,
      (snapshot) => {
        const shapes = [];
        
        snapshot.forEach((doc) => {
          shapes.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort by createdAt client-side if available
        shapes.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        });
        
        callback(shapes);
      }, 
      (error) => {
        console.error('Firestore subscription error:', error.message);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to shapes:', error.message);
    throw error;
  }
}
