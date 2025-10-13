import { useState, useCallback } from 'react';
import { generateId } from '../utils/helpers';

/**
 * Custom hook to manage shape state
 * @returns {Object} Shape state and methods
 */
function useShapes() {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  /**
   * Add a new shape
   * @param {Object} shape - Shape object without ID
   */
  const addShape = useCallback((shape) => {
    const newShape = {
      ...shape,
      id: generateId()
    };
    setShapes((prev) => [...prev, newShape]);
    return newShape;
  }, []);

  /**
   * Update an existing shape
   * @param {string} id - Shape ID
   * @param {Object} updates - Properties to update
   */
  const updateShape = useCallback((id, updates) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );
  }, []);

  /**
   * Delete a shape
   * @param {string} id - Shape ID
   */
  const deleteShape = useCallback((id) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

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
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape
  };
}

export default useShapes;
