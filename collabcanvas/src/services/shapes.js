import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_WEIGHT, DEFAULT_TEXT, MIN_TEXT_WIDTH, MIN_TEXT_HEIGHT, DEFAULT_STROKE_WIDTH } from '../utils/constants';

const SHAPES_COLLECTION = 'shapes';

/**
 * Add a new shape to Firestore
 * @param {Object} shapeData - Shape data (x, y, width, height, color, type) or (x, y, endX, endY, color, strokeWidth, type) for lines
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<string>} Document ID of the created shape
 */
export async function addShape(shapeData, userId) {
  try {
    // Base document fields (common to all shapes)
    const baseDoc = {
      x: shapeData.x,
      y: shapeData.y,
      color: shapeData.color,
      type: shapeData.type || 'rectangle', // Default to rectangle for backward compatibility
      rotation: shapeData.rotation || 0, // Rotation in degrees (0-359)
      zIndex: shapeData.zIndex ?? 0, // Layer order (default: 0)
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add type-specific fields
    if (shapeData.type === 'line') {
      // Lines use endX, endY, strokeWidth
      baseDoc.endX = shapeData.endX;
      baseDoc.endY = shapeData.endY;
      baseDoc.strokeWidth = shapeData.strokeWidth || DEFAULT_STROKE_WIDTH;
    } else if (shapeData.type === 'text') {
      // Text uses text, fontSize, fontWeight, width, height
      baseDoc.text = shapeData.text || DEFAULT_TEXT;
      baseDoc.fontSize = shapeData.fontSize || DEFAULT_FONT_SIZE;
      baseDoc.fontWeight = shapeData.fontWeight || DEFAULT_FONT_WEIGHT;
      baseDoc.width = shapeData.width || MIN_TEXT_WIDTH;
      baseDoc.height = shapeData.height || MIN_TEXT_HEIGHT;
    } else {
      // Rectangles and Circles use width, height
      baseDoc.width = shapeData.width;
      baseDoc.height = shapeData.height;
    }
    
    const docRef = await addDoc(collection(db, SHAPES_COLLECTION), baseDoc);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding shape:', error.message);
    throw error;
  }
}

/**
 * Add multiple shapes to Firestore in batches
 * Firestore batch writes support up to 500 operations per batch
 * @param {Array<Object>} shapesData - Array of shape data objects
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<Array<string>>} Array of document IDs for the created shapes
 */
export async function addShapesBatch(shapesData, userId) {
  try {
    const BATCH_SIZE = 500; // Firestore max batch size
    const results = [];
    
    // Split into batches if needed
    for (let i = 0; i < shapesData.length; i += BATCH_SIZE) {
      const batchShapes = shapesData.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      const batchIds = [];
      
      batchShapes.forEach((shapeData) => {
        const newDocRef = doc(collection(db, SHAPES_COLLECTION));
        
        // Base document fields
        const baseDoc = {
          x: shapeData.x,
          y: shapeData.y,
          color: shapeData.color,
          type: shapeData.type || 'rectangle',
          rotation: shapeData.rotation || 0, // Rotation in degrees (0-359)
          zIndex: shapeData.zIndex ?? 0, // Layer order (default: 0)
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Add type-specific fields
        if (shapeData.type === 'line') {
          baseDoc.endX = shapeData.endX;
          baseDoc.endY = shapeData.endY;
          baseDoc.strokeWidth = shapeData.strokeWidth || DEFAULT_STROKE_WIDTH;
        } else if (shapeData.type === 'text') {
          baseDoc.text = shapeData.text || DEFAULT_TEXT;
          baseDoc.fontSize = shapeData.fontSize || DEFAULT_FONT_SIZE;
          baseDoc.fontWeight = shapeData.fontWeight || DEFAULT_FONT_WEIGHT;
          baseDoc.width = shapeData.width || MIN_TEXT_WIDTH;
          baseDoc.height = shapeData.height || MIN_TEXT_HEIGHT;
        } else {
          baseDoc.width = shapeData.width;
          baseDoc.height = shapeData.height;
        }
        
        batch.set(newDocRef, baseDoc);
        batchIds.push(newDocRef.id);
      });
      
      await batch.commit();
      results.push(...batchIds);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < shapesData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding shapes in batch:', error.message);
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

/**
 * Get all shapes (for AI queries)
 * @returns {Promise<Array>} Array of all shapes
 */
export async function getAllShapes() {
  try {
    const shapesCollection = collection(db, SHAPES_COLLECTION);
    const querySnapshot = await getDocs(shapesCollection);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all shapes:', error.message);
    throw error;
  }
}
