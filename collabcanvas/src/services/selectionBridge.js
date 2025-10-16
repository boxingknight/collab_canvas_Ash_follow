/**
 * Selection Bridge
 * 
 * Provides bidirectional communication between AI service and React selection state:
 * - AI can READ selection via getCurrentSelection()
 * - AI can WRITE selection via updateSelection() 
 * - React syncs selection to bridge via setCurrentSelection()
 * - React registers its setSelection function for AI to call
 * 
 * This enables AI selection commands like:
 * - "Select all rectangles"
 * - "Select all blue shapes"
 * - "Select shapes in top-left"
 */

// Global selection state (read by AI)
let currentSelection = {
  selectedShapeIds: [],
  shapes: [] // Full shape objects
};

// Global setter function (registered by React)
let currentSetSelection = null;

/**
 * Register the React setSelection function (called by Canvas component on mount)
 * This allows AI to programmatically update the selection
 * @param {Function} setSelectionFn - The setSelection function from useSelection hook
 */
export function registerSetSelection(setSelectionFn) {
  currentSetSelection = setSelectionFn;
  console.log('[SelectionBridge] setSelection function registered:', !!setSelectionFn);
}

/**
 * Update selection programmatically (called by AI)
 * This triggers React to update the visual selection on canvas
 * @param {Array} shapeIds - Array of shape IDs to select
 */
export function updateSelection(shapeIds) {
  if (currentSetSelection) {
    console.log('[SelectionBridge] Updating selection via AI:', shapeIds);
    currentSetSelection(shapeIds);
  } else {
    console.warn('[SelectionBridge] Cannot update selection: setSelection not registered!');
  }
}

/**
 * Set the current selection (called by React components)
 * This syncs React's selection state to the bridge for AI to read
 * @param {Array} shapeIds - Array of selected shape IDs
 * @param {Array} shapes - Array of full shape objects
 */
export function setCurrentSelection(shapeIds, shapes) {
  currentSelection = {
    selectedShapeIds: shapeIds,
    shapes: shapes
  };
  
  console.log('[SelectionBridge] Selection synced from React:', shapeIds.length, 'shapes');
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
 * Clear the selection programmatically
 * Updates both internal state and React state
 */
export function clearSelection() {
  if (currentSetSelection) {
    currentSetSelection([]);
  }
  currentSelection = {
    selectedShapeIds: [],
    shapes: []
  };
}

