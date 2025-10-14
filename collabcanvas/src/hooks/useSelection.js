import { useState, useCallback } from 'react';

/**
 * Custom hook for managing shape selection state
 * Supports both single and multi-select operations
 * 
 * @returns {Object} Selection state and methods
 */
export default function useSelection() {
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  
  /**
   * Add a shape to the current selection
   * @param {string} shapeId - ID of shape to add
   */
  const addToSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) ? prev : [...prev, shapeId]
    );
  }, []);
  
  /**
   * Remove a shape from the current selection
   * @param {string} shapeId - ID of shape to remove
   */
  const removeFromSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
  }, []);
  
  /**
   * Toggle a shape in the selection (add if not present, remove if present)
   * Used for shift-click multi-select
   * @param {string} shapeId - ID of shape to toggle
   */
  const toggleSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    );
  }, []);
  
  /**
   * Replace the current selection with new shape(s)
   * Used for normal click (non-shift)
   * @param {string|string[]} shapeIds - Single ID or array of IDs
   */
  const setSelection = useCallback((shapeIds) => {
    const ids = Array.isArray(shapeIds) ? shapeIds : [shapeIds];
    setSelectedShapeIds(ids);
  }, []);
  
  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);
  
  /**
   * Select all shapes
   * @param {string[]} allShapeIds - Array of all shape IDs on canvas
   */
  const selectAll = useCallback((allShapeIds) => {
    setSelectedShapeIds(allShapeIds);
  }, []);
  
  /**
   * Check if a shape is currently selected
   * @param {string} shapeId - ID of shape to check
   * @returns {boolean} True if shape is selected
   */
  const isSelected = useCallback((shapeId) => {
    return selectedShapeIds.includes(shapeId);
  }, [selectedShapeIds]);
  
  return {
    // State
    selectedShapeIds,
    
    // Methods
    addToSelection,
    removeFromSelection,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    isSelected,
    
    // Computed values
    selectionCount: selectedShapeIds.length,
    hasSelection: selectedShapeIds.length > 0,
    isMultiSelect: selectedShapeIds.length > 1,
    
    // Alias for backward compatibility (first selected shape)
    selectedShapeId: selectedShapeIds.length > 0 ? selectedShapeIds[0] : null
  };
}

