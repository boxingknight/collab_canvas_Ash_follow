import { getDatabase, ref, push, set, onValue, remove, update } from 'firebase/database';
import { auth } from './firebase';

// Get Realtime Database instance
const database = getDatabase();

/**
 * Add a new shape to Realtime Database
 * @param {Object} shapeData - Shape data (x, y, width, height, color)
 * @returns {Promise<string>} Key of the created shape
 */
export async function addShape(shapeData) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    console.log('Adding shape to Realtime Database:', shapeData);
    
    // Create a new reference with auto-generated key
    const shapesRef = ref(database, 'shapes');
    const newShapeRef = push(shapesRef);
    
    const shapeWithMetadata = {
      ...shapeData,
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await set(newShapeRef, shapeWithMetadata);
    
    console.log('✅ Shape added to Realtime Database:', newShapeRef.key);
    return newShapeRef.key;
  } catch (error) {
    console.error('❌ Error adding shape:', error);
    throw error;
  }
}

/**
 * Update an existing shape in Realtime Database
 * @param {string} shapeId - Shape key
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateShape(shapeId, updates) {
  try {
    const shapeRef = ref(database, `shapes/${shapeId}`);
    await update(shapeRef, {
      ...updates,
      updatedAt: Date.now()
    });
    
    console.log('✅ Shape updated in Realtime Database:', shapeId);
  } catch (error) {
    console.error('❌ Error updating shape:', error);
    throw error;
  }
}

/**
 * Delete a shape from Realtime Database
 * @param {string} shapeId - Shape key
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  try {
    const shapeRef = ref(database, `shapes/${shapeId}`);
    await remove(shapeRef);
    
    console.log('✅ Shape deleted from Realtime Database:', shapeId);
  } catch (error) {
    console.error('❌ Error deleting shape:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates of all shapes
 * @param {Function} callback - Called with array of shapes on each update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapes(callback) {
  try {
    console.log('📡 Subscribing to Realtime Database shapes...');
    
    const shapesRef = ref(database, 'shapes');
    
    const unsubscribe = onValue(shapesRef, (snapshot) => {
      const shapes = [];
      const data = snapshot.val();
      
      console.log('✅ Realtime Database snapshot received:', data);
      
      if (data) {
        // Convert object to array
        Object.keys(data).forEach((key) => {
          shapes.push({
            id: key,
            ...data[key]
          });
        });
        
        // Sort by createdAt
        shapes.sort((a, b) => a.createdAt - b.createdAt);
      }
      
      console.log('Shapes updated from Realtime Database:', shapes.length);
      callback(shapes);
    }, (error) => {
      console.error('❌ Realtime Database error:');
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      callback([]);
    });
    
    console.log('📡 Realtime Database subscription established');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to Realtime Database:', error);
    throw error;
  }
}

