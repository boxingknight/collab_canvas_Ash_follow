import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  addShape as addShapeToFirestore, 
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeFromFirestore,
  subscribeToShapes,
  lockShape as lockShapeInFirestore,
  unlockShape as unlockShapeInFirestore,
  cleanupStaleLocks
} from '../services/shapes';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { debounce } from '../utils/helpers';

/**
 * Custom hook to manage shape state with Firestore persistence
 * @param {Object} user - Current user object from useAuth
 * @returns {Object} Shape state and methods
 */
function useShapes(user) {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debounced Firestore update to reduce write operations during drag
  const debouncedFirestoreUpdateRef = useRef(null);

  // Subscribe to Firestore shapes on mount
  useEffect(() => {
    if (!user) {
      setShapes([]);
      setIsLoading(false);
      return;
    }

    // Clean up any stale locks on mount
    cleanupStaleLocks();

    const unsubscribe = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setIsLoading(false);
    });

    // Periodically clean up stale locks every 30 seconds
    const cleanupInterval = setInterval(() => {
      cleanupStaleLocks();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
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
      
      // Return shape with Firestore ID for immediate UI feedback if needed
      return {
        ...shape,
        id: firestoreId,
        createdBy: user.uid
      };
    } catch (error) {
      console.error('Failed to add shape:', error.message);
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
      // Optimistic update: update local state immediately for responsive UI
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      );

      // Debounce Firestore writes to reduce write operations during dragging
      // This prevents excessive writes while maintaining eventual consistency
      if (!debouncedFirestoreUpdateRef.current) {
        debouncedFirestoreUpdateRef.current = debounce(
          async (shapeId, shapeUpdates) => {
            await updateShapeInFirestore(shapeId, shapeUpdates);
          },
          300 // Wait 300ms after last update before writing to Firestore
        );
      }
      
      debouncedFirestoreUpdateRef.current(id, updates);
    } catch (error) {
      console.error('Failed to update shape:', error.message);
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
      console.error('Failed to delete shape:', error.message);
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

  /**
   * Lock a shape for editing
   * @param {string} id - Shape ID
   * @returns {Promise<boolean>} True if lock was acquired
   */
  const lockShape = useCallback(async (id) => {
    if (!user) {
      console.error('Cannot lock shape: user not authenticated');
      return false;
    }

    try {
      const success = await lockShapeInFirestore(id, user.uid);
      return success;
    } catch (error) {
      console.error('Failed to lock shape:', error.message);
      return false;
    }
  }, [user]);

  /**
   * Unlock a shape
   * @param {string} id - Shape ID
   */
  const unlockShape = useCallback(async (id) => {
    if (!user) {
      console.error('Cannot unlock shape: user not authenticated');
      return;
    }

    try {
      await unlockShapeInFirestore(id, user.uid);
    } catch (error) {
      console.error('Failed to unlock shape:', error.message);
    }
  }, [user]);

  return {
    shapes,
    selectedShapeId,
    isLoading,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    lockShape,
    unlockShape
  };
}

export default useShapes;
