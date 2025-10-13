import { useState, useCallback, useEffect } from 'react';
import { 
  addShape as addShapeToFirestore, 
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeFromFirestore,
  subscribeToShapes 
} from '../services/shapes';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom hook to manage shape state with Firestore persistence
 * @param {Object} user - Current user object from useAuth
 * @returns {Object} Shape state and methods
 */
function useShapes(user) {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Firestore shapes on mount
  useEffect(() => {
    if (!user) {
      setShapes([]);
      setIsLoading(false);
      return;
    }

    console.log('Subscribing to Firestore shapes...');
    
    // CRITICAL TEST: Try a simple one-time read first
    async function testFirestoreAccess() {
      try {
        console.log('🧪 TESTING: Attempting simple getDocs() call...');
        console.log('🧪 Current URL:', window.location.href);
        console.log('🧪 Current hostname:', window.location.hostname);
        console.log('🧪 User authenticated?', !!user);
        console.log('🧪 User UID:', user?.uid);
        console.log('🧪 User email:', user?.email);
        
        const shapesCollection = collection(db, 'shapes');
        console.log('🧪 Collection reference created');
        
        const querySnapshot = await getDocs(shapesCollection);
        console.log('🧪 ✅ TEST SUCCESS! getDocs returned', querySnapshot.size, 'documents');
        
        querySnapshot.forEach((doc) => {
          console.log('🧪 Document ID:', doc.id, 'Data:', doc.data());
        });
      } catch (error) {
        console.error('🧪 ❌ TEST FAILED! getDocs error:');
        console.error('🧪 Error code:', error.code);
        console.error('🧪 Error message:', error.message);
        console.error('🧪 Error name:', error.name);
        console.error('🧪 Error details:', {
          code: error.code,
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Check authentication specifically
        if (error.code === 'permission-denied') {
          console.error('🧪 PERMISSION DENIED! Possible causes:');
          console.error('🧪 1. Domain not in Firebase Authorized domains');
          console.error('🧪 2. Firestore rules blocking access');
          console.error('🧪 3. User not properly authenticated');
          console.error('🧪 Current domain:', window.location.hostname);
        }
      }
    }
    
    // Run the test
    testFirestoreAccess();
    
    // Set up real-time listener
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      console.log('Shapes received from Firestore:', updatedShapes.length);
      setShapes(updatedShapes);
      setIsLoading(false);
    });

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      console.log('Unsubscribing from Firestore shapes');
      unsubscribe();
    };
  }, [user]);

  /**
   * Add a new shape (local + Firestore)
   * @param {Object} shape - Shape object without ID
   */
  const addShape = useCallback(async (shape) => {
    if (!user) {
      console.error('Cannot add shape: user not authenticated');
      return null;
    }

    try {
      // Add to Firestore (real-time listener will update local state)
      const firestoreId = await addShapeToFirestore(shape, user.uid);
      
      console.log('Shape added, Firestore ID:', firestoreId);
      
      // Return shape with Firestore ID for immediate UI feedback if needed
      return {
        ...shape,
        id: firestoreId,
        createdBy: user.uid
      };
    } catch (error) {
      console.error('Failed to add shape:', error);
      return null;
    }
  }, [user]);

  /**
   * Update an existing shape (local + Firestore)
   * @param {string} id - Shape ID
   * @param {Object} updates - Properties to update
   */
  const updateShape = useCallback(async (id, updates) => {
    if (!user) {
      console.error('Cannot update shape: user not authenticated');
      return;
    }

    try {
      // Optimistic update: update local state immediately
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      );

      // Update in Firestore (real-time listener will sync if there are conflicts)
      await updateShapeInFirestore(id, updates);
    } catch (error) {
      console.error('Failed to update shape:', error);
      // Real-time listener will revert to Firestore state if update fails
    }
  }, [user]);

  /**
   * Delete a shape (local + Firestore)
   * @param {string} id - Shape ID
   */
  const deleteShape = useCallback(async (id) => {
    if (!user) {
      console.error('Cannot delete shape: user not authenticated');
      return;
    }

    try {
      // Optimistic update: remove from local state immediately
      setShapes((prev) => prev.filter((shape) => shape.id !== id));
      if (selectedShapeId === id) {
        setSelectedShapeId(null);
      }

      // Delete from Firestore
      await deleteShapeFromFirestore(id);
    } catch (error) {
      console.error('Failed to delete shape:', error);
      // Real-time listener will restore shape if delete fails
    }
  }, [user, selectedShapeId]);

  /**
   * Select a shape
   * @param {string} id - Shape ID
   */
  const selectShape = useCallback((id) => {
    setSelectedShapeId(id);
  }, []);

  /**
   * Deselect current shape
   */
  const deselectShape = useCallback(() => {
    setSelectedShapeId(null);
  }, []);

  return {
    shapes,
    selectedShapeId,
    isLoading,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape
  };
}

export default useShapes;
