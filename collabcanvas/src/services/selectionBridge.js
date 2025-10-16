/**
 * Selection Bridge
 * 
 * Provides a way for the AI service (outside React) to access 
 * the current selection state (inside React).
 * 
 * This is a simple global state manager that connects:
 * - useSelection hook (React state)
 * - canvasAPI (AI service)
 */

// Global selection state
let currentSelection = {
  selectedShapeIds: [],
  shapes: [] // Full shape objects
};

/**
 * Set the current selection (called by React components)
 * @param {Array} shapeIds - Array of selected shape IDs
 * @param {Array} shapes - Array of full shape objects
 */
export function setCurrentSelection(shapeIds, shapes) {
  currentSelection = {
    selectedShapeIds: shapeIds,
    shapes: shapes
  };
  
  console.log('[SelectionBridge] Selection updated:', shapeIds);
}

/**
 * Get the current selection (called by AI service)
 * @returns {Object} Current selection state
 */
export function getCurrentSelection() {
  return {
    ...currentSelection
  };
}

/**
 * Check if any shapes are selected
 * @returns {boolean}
 */
export function hasSelection() {
  return currentSelection.selectedShapeIds.length > 0;
}

/**
 * Get the first selected shape ID (for single-selection commands)
 * @returns {string|null}
 */
export function getFirstSelectedId() {
  return currentSelection.selectedShapeIds[0] || null;
}

/**
 * Clear the selection
 */
export function clearSelection() {
  currentSelection = {
    selectedShapeIds: [],
    shapes: []
  };
}

