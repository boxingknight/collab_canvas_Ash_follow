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
    console.log('Adding shape to Firestore:', { shapeData, userId });
    
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
    
    console.log('✅ Shape added to Firestore successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding shape:', error.code, error.message);
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
    
    console.log('Shape updated in Firestore:', shapeId);
  } catch (error) {
    console.error('Error updating shape:', error);
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
    
    console.log('Shape deleted from Firestore:', shapeId);
  } catch (error) {
    console.error('Error deleting shape:', error);
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
    console.log('📡 Attempting to subscribe to shapes collection...');
    console.log('📡 Database instance:', db);
    console.log('📡 Collection name:', SHAPES_COLLECTION);
    
    // Query all shapes (no orderBy to avoid index requirement)
    // Shapes will be ordered by document ID by default
    const shapesCollection = collection(db, SHAPES_COLLECTION);
    console.log('📡 Collection reference created:', shapesCollection);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      shapesCollection, 
      {
        // Add includeMetadataChanges to get more details
        includeMetadataChanges: false
      },
      (snapshot) => {
        console.log('✅ onSnapshot SUCCESS! Received snapshot with', snapshot.size, 'documents');
        console.log('✅ Snapshot metadata:', snapshot.metadata);
        
        const shapes = [];
        
        snapshot.forEach((doc) => {
          console.log('📄 Document:', doc.id, doc.data());
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
        
        console.log('Shapes updated from Firestore:', shapes.length);
        callback(shapes);
      }, 
      (error) => {
        console.error('❌ onSnapshot ERROR!');
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error name:', error.name);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        console.error('❌ Error stack:', error.stack);
        
        // Call callback with empty array on error
        callback([]);
      }
    );
    
    console.log('📡 Subscription established, unsubscribe function created');
    return unsubscribe;
  } catch (error) {
    console.error('❌ EXCEPTION in subscribeToShapes:');
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
}
