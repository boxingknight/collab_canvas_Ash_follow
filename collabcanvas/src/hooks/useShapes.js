import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  addShape as addShapeToFirestore,
  addShapesBatch as addShapesBatchToFirestore,
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
  
  // Track pending updates to prevent Firestore listener from overwriting optimistic updates
  // Key: shapeId, Value: timestamp of when the update was made
  const pendingUpdatesRef = useRef(new Map());

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
      // Merge incoming shapes with local optimistic updates
      // If a shape has a pending update less than 500ms old, keep the local version
      const now = Date.now();
      setShapes((prevShapes) => {
        return updatedShapes.map((incomingShape) => {
          const pendingTimestamp = pendingUpdatesRef.current.get(incomingShape.id);
          
          // If there's a recent pending update (< 500ms), keep the local version
          if (pendingTimestamp && (now - pendingTimestamp) < 500) {
            const localShape = prevShapes.find(s => s.id === incomingShape.id);
            return localShape || incomingShape;
          }
          
          // Otherwise, use the incoming shape from Firestore
          // Clear any stale pending update
          pendingUpdatesRef.current.delete(incomingShape.id);
          return incomingShape;
        });
      });
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
   * Add multiple shapes at once using batch writes (more efficient for bulk operations)
   * @param {Array<Object>} shapesArray - Array of shape objects without IDs
   * @returns {Promise<Array<string>>} Array of created shape IDs
   */
  const addShapesBatch = useCallback(async (shapesArray) => {
    if (!user) {
      console.error('Cannot add shapes: user not authenticated');
      return [];
    }

    try {
      console.log(`Adding ${shapesArray.length} shapes in batch...`);
      const firestoreIds = await addShapesBatchToFirestore(shapesArray, user.uid);
      console.log(`Successfully added ${firestoreIds.length} shapes`);
      return firestoreIds;
    } catch (error) {
      console.error('Failed to add shapes in batch:', error.message);
      return [];
    }
  }, [user]);

  /**
   * Update an existing shape (local + Firestore) with debouncing
   * Use this for continuous updates like dragging
   * @param {string} id - Shape ID
   * @param {Object} updates - Properties to update
   */
  const updateShape = useCallback(async (id, updates) => {
    if (!user) {
      console.error('Cannot update shape: user not authenticated');
      return;
    }

    try {
      // Mark this shape as having a pending update
      pendingUpdatesRef.current.set(id, Date.now());

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
            // Clear pending update after Firestore write completes
            pendingUpdatesRef.current.delete(shapeId);
          },
          300 // Wait 300ms after last update before writing to Firestore
        );
      }
      
      debouncedFirestoreUpdateRef.current(id, updates);
    } catch (error) {
      console.error('Failed to update shape:', error.message);
      pendingUpdatesRef.current.delete(id);
      // Real-time listener will revert to Firestore state if update fails
    }
  }, [user]);

  /**
   * Update an existing shape IMMEDIATELY (no debouncing)
   * Use this for final updates like drag end
   * @param {string} id - Shape ID
   * @param {Object} updates - Properties to update
   */
  const updateShapeImmediate = useCallback(async (id, updates) => {
    if (!user) {
      console.error('Cannot update shape: user not authenticated');
      return;
    }

    try {
      // Mark this shape as having a pending update
      pendingUpdatesRef.current.set(id, Date.now());

      // Optimistic update: update local state immediately for responsive UI
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      );

      // Write to Firestore immediately without debouncing
      await updateShapeInFirestore(id, updates);
      
      // Clear pending update after a short delay to ensure Firestore propagation
      setTimeout(() => {
        pendingUpdatesRef.current.delete(id);
      }, 100);
    } catch (error) {
      console.error('Failed to update shape immediately:', error.message);
      pendingUpdatesRef.current.delete(id);
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

  /**
   * Duplicate selected shapes with offset
   * Creates copies of shapes offset by 20px diagonal (x+20, y+20)
   * @param {Array<string>} shapeIds - Array of shape IDs to duplicate
   * @returns {Promise<Array<string>>} Array of new shape IDs
   */
  const duplicateShapes = useCallback(async (shapeIds) => {
    if (!user) {
      console.error('Cannot duplicate shapes: user not authenticated');
      return [];
    }

    if (!shapeIds || shapeIds.length === 0) {
      console.log('No shapes selected to duplicate');
      return [];
    }

    try {
      // Find shapes to duplicate
      const shapesToDuplicate = shapes.filter(shape => shapeIds.includes(shape.id));
      
      if (shapesToDuplicate.length === 0) {
        console.log('No shapes found to duplicate');
        return [];
      }

      // Create copies with offset and clean fields
      const newShapes = shapesToDuplicate.map(shape => {
        // Remove Firestore-specific fields
        const { id, createdAt, updatedAt, createdBy, lockedBy, lockedAt, ...shapeData } = shape;
        
        // Offset position by 20px diagonal
        return {
          ...shapeData,
          x: shape.x + 20,
          y: shape.y + 20,
          // For lines, also offset endpoints
          ...(shape.type === 'line' && {
            endX: shape.endX + 20,
            endY: shape.endY + 20
          })
        };
      });

      console.log(`Duplicating ${newShapes.length} shapes...`);
      
      // Use batch operation for performance
      const newShapeIds = await addShapesBatch(newShapes);
      
      console.log(`Successfully duplicated ${newShapeIds.length} shapes`);
      return newShapeIds;
    } catch (error) {
      console.error('Failed to duplicate shapes:', error.message);
      return [];
    }
  }, [user, shapes, addShapesBatch]);

  /**
   * Bring selected shapes forward by one layer (increment zIndex by 1)
   * @param {Array<string>} shapeIds - Array of shape IDs to bring forward
   */
  const bringForward = useCallback(async (shapeIds) => {
    if (!user) {
      console.error('Cannot bring forward: user not authenticated');
      return;
    }

    if (!shapeIds || shapeIds.length === 0) {
      console.log('No shapes selected to bring forward');
      return;
    }

    try {
      const updates = shapeIds.map(id => {
        const shape = shapes.find(s => s.id === id);
        if (!shape) return null;
        return { id, zIndex: (shape.zIndex ?? 0) + 1 };
      }).filter(Boolean);

      // Batch update all shapes
      await Promise.all(
        updates.map(({ id, zIndex }) =>
          updateShapeInFirestore(id, { zIndex })
        )
      );
      
      console.log(`Brought ${updates.length} shape(s) forward`);
    } catch (error) {
      console.error('Failed to bring forward:', error);
    }
  }, [user, shapes]);

  /**
   * Send selected shapes backward by one layer (decrement zIndex by 1)
   * @param {Array<string>} shapeIds - Array of shape IDs to send backward
   */
  const sendBackward = useCallback(async (shapeIds) => {
    if (!user) {
      console.error('Cannot send backward: user not authenticated');
      return;
    }

    if (!shapeIds || shapeIds.length === 0) {
      console.log('No shapes selected to send backward');
      return;
    }

    try {
      const updates = shapeIds.map(id => {
        const shape = shapes.find(s => s.id === id);
        if (!shape) return null;
        // Allow negative zIndex - no minimum constraint
        return { id, zIndex: (shape.zIndex ?? 0) - 1 };
      }).filter(Boolean);

      // Batch update all shapes
      await Promise.all(
        updates.map(({ id, zIndex }) =>
          updateShapeInFirestore(id, { zIndex })
        )
      );
      
      console.log(`Sent ${updates.length} shape(s) backward`);
    } catch (error) {
      console.error('Failed to send backward:', error);
    }
  }, [user, shapes]);

  /**
   * Bring selected shapes to the front (set zIndex to max + 1)
   * @param {Array<string>} shapeIds - Array of shape IDs to bring to front
   */
  const bringToFront = useCallback(async (shapeIds) => {
    if (!user) {
      console.error('Cannot bring to front: user not authenticated');
      return;
    }

    if (!shapeIds || shapeIds.length === 0) {
      console.log('No shapes selected to bring to front');
      return;
    }

    try {
      const maxZ = Math.max(...shapes.map(s => s.zIndex ?? 0));
      const targetZ = maxZ + 1;

      // Update all selected shapes to the same z-index (on top)
      await Promise.all(
        shapeIds.map(id =>
          updateShapeInFirestore(id, { zIndex: targetZ })
        )
      );
      
      console.log(`Brought ${shapeIds.length} shape(s) to front (zIndex: ${targetZ})`);
    } catch (error) {
      console.error('Failed to bring to front:', error);
    }
  }, [user, shapes]);

  /**
   * Send selected shapes to the back (set zIndex to min - 1)
   * @param {Array<string>} shapeIds - Array of shape IDs to send to back
   */
  const sendToBack = useCallback(async (shapeIds) => {
    if (!user) {
      console.error('Cannot send to back: user not authenticated');
      return;
    }

    if (!shapeIds || shapeIds.length === 0) {
      console.log('No shapes selected to send to back');
      return;
    }

    try {
      const minZ = Math.min(...shapes.map(s => s.zIndex ?? 0));
      // Allow negative zIndex - no minimum constraint
      const targetZ = minZ - 1;

      // Update all selected shapes to the same z-index (on bottom)
      await Promise.all(
        shapeIds.map(id =>
          updateShapeInFirestore(id, { zIndex: targetZ })
        )
      );
      
      console.log(`Sent ${shapeIds.length} shape(s) to back (zIndex: ${targetZ})`);
    } catch (error) {
      console.error('Failed to send to back:', error);
    }
  }, [user, shapes]);

  return {
    shapes,
    selectedShapeId,
    isLoading,
    addShape,
    addShapesBatch,
    updateShape,
    updateShapeImmediate,
    deleteShape,
    selectShape,
    deselectShape,
    lockShape,
    unlockShape,
    duplicateShapes,
    // Layer management operations (PR #17)
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack
  };
}

export default useShapes;
