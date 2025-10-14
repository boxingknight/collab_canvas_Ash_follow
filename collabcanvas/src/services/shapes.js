import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const SHAPES_COLLECTION = 'shapes';

/**
 * Add a new shape to Firestore
 * @param {Object} shapeData - Shape data (x, y, width, height, color)
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
