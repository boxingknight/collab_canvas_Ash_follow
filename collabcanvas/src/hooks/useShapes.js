import { useState, useCallback, useEffect } from 'react';
import { 
  addShape as addShapeToDatabase, 
  updateShape as updateShapeInDatabase,
  deleteShape as deleteShapeFromDatabase,
  subscribeToShapes 
} from '../services/realtimedb';

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

    console.log('📡 Subscribing to Realtime Database shapes...');
    
    // Set up real-time listener
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      console.log('✅ Shapes received from Realtime Database:', updatedShapes.length);
      setShapes(updatedShapes);
      setIsLoading(false);
    });

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      console.log('Unsubscribing from Realtime Database shapes');
      unsubscribe();
    };
  }, [user]);

  /**
   * Add a new shape (local + Realtime Database)
   * @param {Object} shape - Shape object without ID
   */
  const addShape = useCallback(async (shape) => {
    if (!user) {
      console.error('Cannot add shape: user not authenticated');
      return null;
    }

    try {
      // Add to Realtime Database (real-time listener will update local state)
      const shapeKey = await addShapeToDatabase(shape);
      
      console.log('Shape added, Realtime DB key:', shapeKey);
      
      // Return shape with key for immediate UI feedback if needed
      return {
        ...shape,
        id: shapeKey,
        createdBy: user.uid
      };
    } catch (error) {
      console.error('Failed to add shape:', error);
      return null;
    }
  }, [user]);

  /**
   * Update an existing shape (local + Realtime Database)
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

      // Update in Realtime Database (real-time listener will sync if there are conflicts)
      await updateShapeInDatabase(id, updates);
    } catch (error) {
      console.error('Failed to update shape:', error);
      // Real-time listener will revert to database state if update fails
    }
  }, [user]);

  /**
   * Delete a shape (local + Realtime Database)
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

      // Delete from Realtime Database
      await deleteShapeFromDatabase(id);
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
