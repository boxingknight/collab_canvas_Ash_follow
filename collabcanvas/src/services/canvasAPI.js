// src/services/canvasAPI.js
import { addShape, updateShape, deleteShape as deleteShapeFromDB, getAllShapes } from './shapes';
import { CANVAS_CONFIG } from '../utils/constants';
import { getCurrentUser } from './auth';
import { getCurrentSelection, getFirstSelectedId, updateSelection } from './selectionBridge';
import { 
  getShapeBounds,
  calculateBoundingBox,
  calculateHorizontalLayout,
  calculateVerticalLayout,
  calculateGridLayout,
  calculateEvenDistribution,
  calculateCenterPosition,
  calculateGroupCenterOffset,
  validateLayoutSize
} from '../utils/geometry';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Validate common parameters
 */
function validatePosition(x, y) {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }
  if (x < 0 || x > CANVAS_CONFIG.width || y < 0 || y > CANVAS_CONFIG.height) {
    return {
      valid: false,
      error: `Coordinates must be within canvas bounds (0-${CANVAS_CONFIG.width}, 0-${CANVAS_CONFIG.height})`
    };
  }
  return { valid: true };
}

function validateSize(width, height, min = 10) {
  if (typeof width !== 'number' || typeof height !== 'number') {
    return { valid: false, error: 'Size must be numbers' };
  }
  if (width < min || height < min) {
    return { valid: false, error: `Size must be at least ${min}px` };
  }
  return { valid: true };
}

function validateColor(color) {
  if (typeof color !== 'string') {
    return { valid: false, error: 'Color must be a string' };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { valid: false, error: 'Color must be a hex code (e.g., #FF0000)' };
  }
  return { valid: true };
}

/**
 * Get current user ID or throw error
 */
function getCurrentUserId() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated. Please log in first.');
  }
  return user.uid;
}

/**
 * Validate shape type parameter
 */
function validateShapeType(type) {
  // Map both singular and plural forms to singular
  const typeMap = {
    'rectangle': 'rectangle',
    'rectangles': 'rectangle',
    'circle': 'circle',
    'circles': 'circle',
    'line': 'line',
    'lines': 'line',
    'text': 'text',
    'texts': 'text'
  };
  
  const normalized = typeMap[type?.toLowerCase()];
  
  if (!normalized) {
    return {
      valid: false,
      error: `Invalid type "${type}". Must be one of: rectangle, circle, line, text (singular or plural)`
    };
  }
  
  return { 
    valid: true, 
    normalizedType: normalized 
  };
}

/**
 * Check if shape overlaps with region (AABB intersection)
 * Uses geometry.js getShapeBounds which correctly handles rotation
 * @param {Object} shape - Shape object
 * @param {number} x - Region top-left X
 * @param {number} y - Region top-left Y
 * @param {number} width - Region width
 * @param {number} height - Region height
 * @returns {boolean} True if shape overlaps with region
 */
function isShapeInRegion(shape, x, y, width, height) {
  const regionRight = x + width;
  const regionBottom = y + height;
  const shapeBounds = getShapeBounds(shape); // From geometry.js - handles rotation
  const shapeRight = shapeBounds.x + shapeBounds.width;
  const shapeBottom = shapeBounds.y + shapeBounds.height;
  
  // AABB intersection test (any overlap counts)
  return !(
    shapeRight < x ||
    shapeBounds.x > regionRight ||
    shapeBottom < y ||
    shapeBounds.y > regionBottom
  );
}

/**
 * ===== COMPLEX OPERATIONS INFRASTRUCTURE =====
 * PR #23: Layout constants and helpers for complex operations
 */

/**
 * Layout constants for complex operations
 * Defines consistent spacing, sizing, and styling for UI components
 */
const LAYOUT_CONSTANTS = {
  loginForm: {
    WIDTH: 350,
    INPUT_HEIGHT: 40,
    BUTTON_HEIGHT: 50,
    BUTTON_WIDTH: 120,
    LABEL_HEIGHT: 20,
    SPACING: 20,           // Vertical spacing between components
    LABEL_OFFSET: 8,       // Gap between label and input
    SECTION_GAP: 30        // Gap between sections (e.g., before button)
  },
  navigationBar: {
    HEIGHT: 60,
    ITEM_SPACING: 40,
    PADDING: 20,
    MIN_ITEM_WIDTH: 80
  },
  card: {
    WIDTH: 300,
    HEIGHT: 400,
    IMAGE_HEIGHT: 200,
    PADDING: 20,
    TITLE_HEIGHT: 30,
    DESCRIPTION_OFFSET: 15
  },
  buttonGroup: {
    BUTTON_WIDTH: 120,
    BUTTON_HEIGHT: 40,
    SPACING: 10
  },
  landingPage: {
    WIDTH: 1200,
    NAV_HEIGHT: 60,
    HERO_HEIGHT: 300,
    SECTION_SPACING: 40,
    CONTENT_PADDING: 30,
    FEATURE_CARD_WIDTH: 350,
    FEATURE_CARD_HEIGHT: 200,
    FOOTER_HEIGHT: 80
  }
};

/**
 * Color themes for complex operations
 */
const COLOR_THEMES = {
  default: {
    primary: '#646cff',       // Primary action color
    secondary: '#535bf2',     // Secondary color
    background: '#ffffff',    // Input/component background
    text: '#1a1a1a',          // Dark text
    textLight: '#666666',     // Light text for labels
    border: '#d0d0d0',        // Border color
    buttonText: '#ffffff'     // Button text color
  },
  dark: {
    primary: '#646cff',
    secondary: '#535bf2',
    background: '#2d2d3f',
    text: '#ffffff',
    textLight: '#cccccc',
    border: '#404040',
    buttonText: '#ffffff'
  }
};

/**
 * Constrain position and size to canvas bounds
 * Prevents complex operations from creating shapes outside visible canvas
 * @param {number} x - Desired X position
 * @param {number} y - Desired Y position
 * @param {number} width - Component width
 * @param {number} height - Component height
 * @returns {{x: number, y: number, adjusted: boolean}} - Constrained position
 */
function constrainToCanvas(x, y, width, height) {
  const MARGIN = 50; // Safe margin from edge
  const maxX = CANVAS_CONFIG.width - width - MARGIN;
  const maxY = CANVAS_CONFIG.height - height - MARGIN;
  
  const constrainedX = Math.max(MARGIN, Math.min(x, maxX));
  const constrainedY = Math.max(MARGIN, Math.min(y, maxY));
  
  const adjusted = (constrainedX !== x || constrainedY !== y);
  
  if (adjusted) {
    console.warn(`⚠️ Position adjusted to fit canvas: (${x}, ${y}) → (${constrainedX}, ${constrainedY})`);
  }
  
  return {
    x: constrainedX,
    y: constrainedY,
    adjusted
  };
}

/**
 * Truncate text that's too long
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * ===== LAYOUT COMMANDS =====
 * PR #22: AI Layout Commands with bug fixes
 * These functions must be defined BEFORE canvasAPI object
 */

/**
 * Helper: Resolve shape IDs (fallback to selection if invalid)
 * FIX: Auto-use current selection when AI forgets to call getSelectedShapes()
 * @param {Array<string>} shapeIds - Shape IDs (might be invalid/fake)
 * @returns {Array<string>} Valid shape IDs from selection
 */
function resolveShapeIds(shapeIds) {
  // Check if shapeIds are likely fake (AI invented them)
  const areFakeIds = shapeIds && shapeIds.length > 0 && 
    (shapeIds[0] === 'shape1' || 
     shapeIds[0] === 'shape2' ||
     shapeIds.some(id => typeof id === 'string' && id.startsWith('shape')));
  
  // If no IDs, empty array, or fake IDs, use current selection
  if (!shapeIds || shapeIds.length === 0 || areFakeIds) {
    const selection = getCurrentSelection();
    console.log('[Layout] Using current selection:', selection.selectedShapeIds.length, 'shapes');
    return selection.selectedShapeIds;
  }
  
  return shapeIds;
}

/**
 * Batch update shape positions atomically
 * FIX: Bug #4 - Uses Firestore batch writes for atomic operations
 * @param {Array} updates - Array of {id, x, y, ...} objects
 * @returns {Promise<Object>} Success result
 */
async function batchUpdateShapePositions(updates) {
  if (!updates || updates.length === 0) {
    return { success: true, count: 0 };
  }
  
  try {
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Handle > 500 shapes by chunking
    if (updates.length > BATCH_SIZE) {
      const chunks = [];
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        chunks.push(updates.slice(i, i + BATCH_SIZE));
      }
      
      // Process each chunk atomically
      for (const chunk of chunks) {
        await batchUpdateChunk(chunk);
      }
      
      return { success: true, count: updates.length };
    }
    
    // Single batch (most common case)
    await batchUpdateChunk(updates);
    return { success: true, count: updates.length };
    
  } catch (error) {
    console.error('Batch update failed:', error);
    throw new Error(`Failed to update ${updates.length} shapes: ${error.message}`);
  }
}

/**
 * Update a single chunk of shapes atomically
 * @param {Array} updates - Array of updates (max 500)
 * @returns {Promise}
 */
async function batchUpdateChunk(updates) {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, ...data }) => {
    const shapeRef = doc(db, 'shapes', id);
    batch.update(shapeRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
}

/**
 * Arrange shapes in horizontal row
 * @param {Array<string>} shapeIds - Array of shape IDs to arrange
 * @param {number} spacing - Space between shapes in pixels (default: 20)
 * @returns {Promise<Object>} Success result
 */
async function arrangeHorizontal(shapeIds, spacing = 20) {
  try {
    // Resolve shape IDs (fallback to selection if needed)
    shapeIds = resolveShapeIds(shapeIds);
    
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('No shapes to arrange. Please select shapes first.');
    }
    if (typeof spacing !== 'number' || spacing < 0) {
      throw new Error('spacing must be a non-negative number');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateHorizontalLayout(shapes, spacing);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update (atomic)
    await batchUpdateShapePositions(updates);
    
      return {
      success: true,
      message: `Arranged ${shapes.length} shapes horizontally with ${spacing}px spacing`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('arrangeHorizontal error:', error);
    throw new Error(`Failed to arrange shapes horizontally: ${error.message}`);
  }
}

/**
 * Arrange shapes in vertical column
 * @param {Array<string>} shapeIds - Array of shape IDs to arrange
 * @param {number} spacing - Space between shapes in pixels (default: 20)
 * @returns {Promise<Object>} Success result
 */
async function arrangeVertical(shapeIds, spacing = 20) {
  try {
    // Resolve shape IDs (fallback to selection if needed)
    shapeIds = resolveShapeIds(shapeIds);
    
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('No shapes to arrange. Please select shapes first.');
    }
    if (typeof spacing !== 'number' || spacing < 0) {
      throw new Error('spacing must be a non-negative number');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateVerticalLayout(shapes, spacing);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update (atomic)
    await batchUpdateShapePositions(updates);
    
      return {
      success: true,
      message: `Arranged ${shapes.length} shapes vertically with ${spacing}px spacing`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('arrangeVertical error:', error);
    throw new Error(`Failed to arrange shapes vertically: ${error.message}`);
  }
}

/**
 * Arrange shapes in grid pattern
 * FIX: Bug #5 - Pre-validates layout size before execution
 * @param {Array<string>} shapeIds - Array of shape IDs to arrange
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} spacingX - Horizontal spacing (default: 20)
 * @param {number} spacingY - Vertical spacing (default: 20)
 * @returns {Promise<Object>} Success result
 */
async function arrangeGrid(shapeIds, rows, cols, spacingX = 20, spacingY = 20) {
  try {
    // Resolve shape IDs (fallback to selection if needed)
    shapeIds = resolveShapeIds(shapeIds);
    
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('No shapes to arrange. Please select shapes first.');
    }
    if (typeof rows !== 'number' || rows < 1) {
      throw new Error('rows must be a positive number');
    }
    if (typeof cols !== 'number' || cols < 1) {
      throw new Error('cols must be a positive number');
    }
    if (rows * cols < shapeIds.length) {
      throw new Error(
        `Grid too small: ${rows}x${cols} grid has ${rows*cols} cells but you have ${shapeIds.length} shapes. ` +
        `Use at least ${Math.ceil(shapeIds.length / cols)}x${cols} or ${rows}x${Math.ceil(shapeIds.length / rows)}.`
      );
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // FIX: Bug #5 - Pre-validate layout size
    const bounds = shapes.map(getShapeBounds);
    const maxWidth = Math.max(...bounds.map(b => b.width), 10);
    const maxHeight = Math.max(...bounds.map(b => b.height), 10);
    
    const gridWidth = (cols * maxWidth) + ((cols - 1) * spacingX);
    const gridHeight = (rows * maxHeight) + ((rows - 1) * spacingY);
    
    validateLayoutSize(gridWidth, gridHeight, {
      rows,
      cols,
      spacingX,
      spacingY,
      cellWidth: maxWidth,
      cellHeight: maxHeight
    });
    
    // Calculate new positions
    const newPositions = calculateGridLayout(shapes, rows, cols, spacingX, spacingY);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update (atomic)
    await batchUpdateShapePositions(updates);
    
      return {
      success: true,
      message: `Arranged ${shapes.length} shapes in ${rows}x${cols} grid`,
      count: shapes.length,
      rows,
      cols
    };
    
  } catch (error) {
    console.error('arrangeGrid error:', error);
    throw new Error(`Failed to arrange shapes in grid: ${error.message}`);
  }
}

/**
 * Distribute shapes evenly along an axis
 * FIX: Bug #2 - Uses precision-safe calculation from origin
 * @param {Array<string>} shapeIds - Array of shape IDs to distribute
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {Promise<Object>} Success result
 */
async function distributeEvenly(shapeIds, direction = 'horizontal') {
  try {
    // Resolve shape IDs (fallback to selection if needed)
    shapeIds = resolveShapeIds(shapeIds);
    
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('No shapes to distribute. Please select shapes first.');
    }
    if (shapeIds.length < 2) {
      throw new Error('Need at least 2 shapes to distribute');
    }
    if (direction !== 'horizontal' && direction !== 'vertical') {
      throw new Error('direction must be "horizontal" or "vertical"');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateEvenDistribution(shapes, direction);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update (atomic)
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Distributed ${shapes.length} shapes evenly ${direction}`,
      count: shapes.length,
      direction
    };
    
  } catch (error) {
    console.error('distributeEvenly error:', error);
    throw new Error(`Failed to distribute shapes: ${error.message}`);
  }
}

/**
 * Center single shape on canvas
 * @param {string} shapeId - Shape ID to center
 * @returns {Promise<Object>} Success result
 */
async function centerShape(shapeId) {
  try {
    // Validation
    if (!shapeId) {
      throw new Error('shapeId is required');
    }
    
    // Get shape
    const allShapes = await getAllShapes();
    const shape = allShapes.find(s => s.id === shapeId);
    
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }
    
    // Calculate center position
    const newPosition = calculateCenterPosition(shape);
    
    // Update shape
    await updateShape(shapeId, {
      ...newPosition,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Centered ${shape.type} at canvas center`,
      shapeId
    };
    
  } catch (error) {
    console.error('centerShape error:', error);
    throw new Error(`Failed to center shape: ${error.message}`);
  }
}

/**
 * Center group of shapes on canvas (preserves relative positions)
 * @param {Array<string>} shapeIds - Array of shape IDs to center as group
 * @returns {Promise<Object>} Success result
 */
async function centerShapes(shapeIds) {
  try {
    // Resolve shape IDs (fallback to selection if needed)
    shapeIds = resolveShapeIds(shapeIds);
    
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('No shapes to center. Please select shapes first.');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate offset to center group
    const { offsetX, offsetY } = calculateGroupCenterOffset(shapes);
    
    // Build update array (move all shapes by offset)
    const updates = shapes.map(shape => {
      const newPosition = {
        x: Math.round(shape.x + offsetX),
        y: Math.round(shape.y + offsetY)
      };
      
      // For lines, offset both endpoints
      if (shape.type === 'line') {
        newPosition.x1 = Math.round(shape.x1 + offsetX);
        newPosition.y1 = Math.round(shape.y1 + offsetY);
        newPosition.x2 = Math.round(shape.x2 + offsetX);
        newPosition.y2 = Math.round(shape.y2 + offsetY);
        delete newPosition.x;
        delete newPosition.y;
      }
      
      return {
        id: shape.id,
        ...newPosition
      };
    });
    
    // Batch update (atomic)
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Centered group of ${shapes.length} shapes at canvas center`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('centerShapes error:', error);
    throw new Error(`Failed to center shapes: ${error.message}`);
  }
}

/**
 * ===== COMPLEX OPERATIONS (PR #23) =====
 * Smart templates for common UI patterns
 * These functions must be defined BEFORE canvasAPI object
 */

/**
 * Create a login form with username, password, and submit button
 * @param {number} x - Top-left X position
 * @param {number} y - Top-left Y position
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeRememberMe - Add "Remember Me" checkbox (default: false)
 * @param {string} options.buttonText - Submit button text (default: "Login")
 * @param {string} options.theme - Color theme: 'default' or 'dark' (default: 'default')
 * @param {string} userId - User ID (optional, will be fetched if not provided)
 * @returns {Promise<Object>} Success result with created shape IDs
 */
async function createLoginForm(x, y, options = {}, userId = null) {
  // Get current user if not provided
  if (!userId) {
    try {
      userId = getCurrentUserId();
    } catch (error) {
      return {
        success: false,
        error: 'NOT_AUTHENTICATED',
        userMessage: 'You must be logged in to create shapes.'
      };
    }
  }

  // Validate position
  const posValidation = validatePosition(x, y);
  if (!posValidation.valid) {
    return { 
      success: false, 
      error: 'INVALID_POSITION', 
      userMessage: posValidation.error 
    };
  }

  // Extract options with defaults
  const {
    includeRememberMe = false,
    buttonText = 'Login',
    theme = 'default'
  } = options;

  // Get layout constants and color theme
  const layout = LAYOUT_CONSTANTS.loginForm;
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.default;

  // Calculate total height for boundary check
  const FORM_PADDING = 30; // Padding around form content
  const TITLE_HEIGHT = 32; // Form title height
  const contentHeight = 
    TITLE_HEIGHT + layout.SPACING +              // Title + spacing
    layout.LABEL_HEIGHT + layout.LABEL_OFFSET +  // Username label
    layout.INPUT_HEIGHT + layout.SPACING +        // Username input
    layout.LABEL_HEIGHT + layout.LABEL_OFFSET +  // Password label
    layout.INPUT_HEIGHT +                         // Password input
    (includeRememberMe ? layout.SPACING + layout.LABEL_HEIGHT : 0) + // Optional checkbox
    layout.SECTION_GAP +                          // Gap before button
    layout.BUTTON_HEIGHT;                         // Button
  
  const totalHeight = contentHeight + (FORM_PADDING * 2);
  const totalWidth = layout.WIDTH + (FORM_PADDING * 2);

  // Constrain to canvas bounds
  const constrained = constrainToCanvas(x, y, totalWidth, totalHeight);
  const formBackgroundX = constrained.x;
  const formBackgroundY = constrained.y;
  const startX = formBackgroundX + FORM_PADDING; // Content starts after padding
  let currentY = formBackgroundY + FORM_PADDING;

  // Track created shape IDs for cleanup on error
  const shapeIds = [];

  try {
    // PHASE 1: Create all backgrounds/rectangles first (z-index: backgrounds before text)
    
    // Form background container (created FIRST - appears at back)
    const formBackgroundColor = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
    const formBackgroundId = await addShape({
      type: 'rectangle',
      x: formBackgroundX,
      y: formBackgroundY,
      width: totalWidth,
      height: totalHeight,
      color: formBackgroundColor,
      rotation: 0
    }, userId);
    shapeIds.push(formBackgroundId);
    
    // Calculate Y positions for each element
    let elementY = currentY;
    
    // Skip space for title (we'll add text later)
    const titleY = elementY;
    elementY += 32 + layout.SPACING; // Title height + spacing
    
    // Username label and input
    const usernameLabelY = elementY;
    const usernameInputY = usernameLabelY + layout.LABEL_HEIGHT + layout.LABEL_OFFSET;
    elementY = usernameInputY + layout.INPUT_HEIGHT + layout.SPACING;
    
    // Password label and input
    const passwordLabelY = elementY;
    const passwordInputY = passwordLabelY + layout.LABEL_HEIGHT + layout.LABEL_OFFSET;
    elementY = passwordInputY + layout.INPUT_HEIGHT;
    
    // Remember Me checkbox (optional)
    let checkboxY, rememberMeTextY;
    if (includeRememberMe) {
      elementY += layout.SPACING;
      checkboxY = elementY;
      rememberMeTextY = elementY;
      elementY += layout.LABEL_HEIGHT;
    }
    
    // Submit button
    elementY += layout.SECTION_GAP;
    const buttonY = elementY;
    const buttonX = startX + (layout.WIDTH - layout.BUTTON_WIDTH) / 2; // Center button
    
    // Create all input rectangles
    const usernameInputId = await addShape({
      type: 'rectangle',
      x: startX,
      y: usernameInputY,
      width: layout.WIDTH,
      height: layout.INPUT_HEIGHT,
      color: colors.background,
      rotation: 0
    }, userId);
    shapeIds.push(usernameInputId);

    const passwordInputId = await addShape({
      type: 'rectangle',
      x: startX,
      y: passwordInputY,
      width: layout.WIDTH,
      height: layout.INPUT_HEIGHT,
      color: colors.background,
      rotation: 0
    }, userId);
    shapeIds.push(passwordInputId);

    // Remember Me checkbox (optional)
    if (includeRememberMe) {
      const checkboxId = await addShape({
        type: 'rectangle',
        x: startX,
        y: checkboxY,
        width: 20,
        height: 20,
        color: colors.background,
        rotation: 0
      }, userId);
      shapeIds.push(checkboxId);
    }

    // Submit button background
    const buttonBgId = await addShape({
      type: 'rectangle',
      x: buttonX,
      y: buttonY,
      width: layout.BUTTON_WIDTH,
      height: layout.BUTTON_HEIGHT,
      color: colors.primary,
      rotation: 0
    }, userId);
    shapeIds.push(buttonBgId);

    // PHASE 2: Create all text elements (z-index: text appears on top)

    // Form title
    const formTitle = buttonText === 'Sign Up' ? 'Sign Up' : 'Login';
    const formTitleId = await addShape({
      type: 'text',
      x: startX,
      y: titleY,
      width: layout.WIDTH,
      height: 32,
      text: formTitle,
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      rotation: 0
    }, userId);
    shapeIds.push(formTitleId);

    // Username label
    const usernameLabelId = await addShape({
      type: 'text',
      x: startX,
      y: usernameLabelY,
      width: 200,
      height: layout.LABEL_HEIGHT,
      text: 'Username',
      fontSize: 14,
      fontWeight: 'normal',
      color: colors.textLight,
      rotation: 0
    }, userId);
    shapeIds.push(usernameLabelId);

    // Password label
    const passwordLabelId = await addShape({
      type: 'text',
      x: startX,
      y: passwordLabelY,
      width: 200,
      height: layout.LABEL_HEIGHT,
      text: 'Password',
      fontSize: 14,
      fontWeight: 'normal',
      color: colors.textLight,
      rotation: 0
    }, userId);
    shapeIds.push(passwordLabelId);

    // Remember Me text (optional)
    if (includeRememberMe) {
      const rememberMeTextId = await addShape({
        type: 'text',
        x: startX + 30, // Offset from checkbox
        y: rememberMeTextY,
        width: 200,
        height: layout.LABEL_HEIGHT,
        text: 'Remember Me',
        fontSize: 14,
        fontWeight: 'normal',
        color: colors.text,
        rotation: 0
      }, userId);
      shapeIds.push(rememberMeTextId);
    }

    // Button text (centered in button)
    const truncatedButtonText = truncateText(buttonText, 15);
    const buttonTextId = await addShape({
      type: 'text',
      x: buttonX + 10, // Padding from button edge
      y: buttonY + (layout.BUTTON_HEIGHT - 20) / 2, // Vertically center
      width: layout.BUTTON_WIDTH - 20,
      height: 20,
      text: truncatedButtonText,
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.buttonText,
      rotation: 0
    }, userId);
    shapeIds.push(buttonTextId);

    // Success!
    const message = constrained.adjusted 
      ? `Created "${formTitle}" form with header and background (position adjusted to fit canvas) - ${shapeIds.length} shapes`
      : `Created "${formTitle}" form with header and background - ${shapeIds.length} shapes`;

    return {
      success: true,
      result: {
        shapeIds,
        count: shapeIds.length,
        includesRememberMe: includeRememberMe,
        buttonText: truncatedButtonText,
        formTitle: formTitle,
        hasBackground: true,
        hasHeader: true
      },
      userMessage: message
    };

  } catch (error) {
    // CLEANUP: If any shape creation failed, attempt to delete created shapes
    console.error('❌ Login form creation failed:', error);
    
    // Best-effort cleanup
    for (const id of shapeIds) {
      try {
        await deleteShapeFromDB(id);
      } catch (cleanupError) {
        console.warn(`Failed to clean up shape ${id}:`, cleanupError);
      }
    }

    return {
      success: false,
      error: error.code || 'CREATE_FAILED',
      userMessage: 'Failed to create login form. Please try again.',
      partialShapeIds: shapeIds // For manual cleanup if needed
    };
  }
}

/**
 * ===== COMPLEX OPERATION: NAVIGATION BAR =====
 * Creates a horizontal navigation bar with menu items
 * PR #23
 */
async function createNavigationBar(x, y, menuItems = [], options = {}, userId = null) {
  console.log('📐 Creating navigation bar...', { x, y, menuItems, options });

  // Get or validate userId
  if (!userId) {
    try {
      userId = getCurrentUserId();
    } catch (error) {
      return { 
        success: false, 
        error: 'AUTH_REQUIRED', 
        userMessage: error.message 
      };
    }
  }

  // Validate position
  const posValidation = validatePosition(x, y);
  if (!posValidation.valid) {
    return { 
      success: false, 
      error: 'INVALID_POSITION', 
      userMessage: posValidation.error 
    };
  }

  // Validate menu items
  if (!Array.isArray(menuItems) || menuItems.length === 0) {
    return {
      success: false,
      error: 'INVALID_MENU_ITEMS',
      userMessage: 'Menu items must be a non-empty array of strings'
    };
  }

  // Validate all menu items are strings
  const invalidItems = menuItems.filter(item => typeof item !== 'string' || item.trim().length === 0);
  if (invalidItems.length > 0) {
    return {
      success: false,
      error: 'INVALID_MENU_ITEMS',
      userMessage: 'All menu items must be non-empty strings'
    };
  }

  // Extract options with defaults
  const {
    height = LAYOUT_CONSTANTS.navigationBar.HEIGHT,
    spacing = LAYOUT_CONSTANTS.navigationBar.ITEM_SPACING,
    background = COLOR_THEMES.default.background,
    textColor = COLOR_THEMES.default.text,
    theme = 'default'
  } = options;

  // Get theme colors
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.default;
  const bgColor = background || colors.background;
  const itemColor = textColor || colors.text;

  // Calculate nav bar dimensions
  const layout = LAYOUT_CONSTANTS.navigationBar;
  const truncatedItems = menuItems.map(item => truncateText(item, 20));
  const itemWidth = layout.MIN_ITEM_WIDTH;
  const totalWidth = (layout.PADDING * 2) + (truncatedItems.length * itemWidth) + ((truncatedItems.length - 1) * spacing);

  // Constrain to canvas bounds
  const constrained = constrainToCanvas(x, y, totalWidth, height);
  const startX = constrained.x;
  const startY = constrained.y;

  const shapeIds = [];

  try {
    // 1. Create background bar
    const barId = await addShape({
      type: 'rectangle',
      x: startX,
      y: startY,
      width: totalWidth,
      height: height,
      color: bgColor,
      rotation: 0
    }, userId);
    shapeIds.push(barId);

    // 2. Create menu items (text elements)
    // IMPORTANT: Text elements need explicit width/height to render properly
    // Figma/Canva pattern: Text has a bounding box, centered alignment for nav items
    let currentX = startX + layout.PADDING;
    const textY = startY + (height / 2); // Vertical center of nav bar

    for (const item of truncatedItems) {
      // Calculate text dimensions
      // Use itemWidth for horizontal space, height for vertical
      const textHeight = 30; // Sufficient height for font size 16
      
      // Position text at top-left corner of its bounding box
      // The text will be centered within the box by Shape.jsx rendering
      const textX = currentX;
      const textYPos = textY - (textHeight / 2); // Center vertically

      const itemTextId = await addShape({
        type: 'text',
        x: textX,
        y: textYPos,
        width: itemWidth,           // ← FIX: Explicit width for text bounding box
        height: textHeight,         // ← FIX: Explicit height for text bounding box
        text: item,
        fontSize: 16,
        color: itemColor,
        align: 'center',            // ← Figma/Canva pattern: Center-aligned nav text
        verticalAlign: 'middle',    // ← Vertical centering
        rotation: 0
      }, userId);
      shapeIds.push(itemTextId);

      // Move to next item position
      currentX += itemWidth + spacing;
    }

    // Success!
    const message = constrained.adjusted 
      ? `Created navigation bar with ${truncatedItems.length} items (position adjusted to fit canvas) - ${shapeIds.length} shapes`
      : `Created navigation bar with ${truncatedItems.length} items - ${shapeIds.length} shapes`;

    return {
      success: true,
      result: {
        shapeIds,
        count: shapeIds.length,
        menuItems: truncatedItems,
        width: totalWidth,
        height: height
      },
      userMessage: message
    };

  } catch (error) {
    // CLEANUP: If any shape creation failed, attempt to delete created shapes
    console.error('❌ Navigation bar creation failed:', error);
    
    // Best-effort cleanup
    for (const id of shapeIds) {
      try {
        await deleteShapeFromDB(id);
      } catch (cleanupError) {
        console.warn(`Failed to clean up shape ${id}:`, cleanupError);
      }
    }

    return {
      success: false,
      error: error.code || 'CREATE_FAILED',
      userMessage: 'Failed to create navigation bar. Please try again.',
      partialShapeIds: shapeIds
    };
  }
}

/**
 * ===== COMPLEX OPERATION: CARD LAYOUT =====
 * Creates a card-style layout with title, image placeholder, and description
 * PR #23
 */
async function createCardLayout(x, y, title = '', description = '', options = {}, userId = null) {
  console.log('🃏 Creating card layout...', { x, y, title, description, options });

  // Get or validate userId
  if (!userId) {
    try {
      userId = getCurrentUserId();
    } catch (error) {
      return { 
        success: false, 
        error: 'AUTH_REQUIRED', 
        userMessage: error.message 
      };
    }
  }

  // Validate position
  const posValidation = validatePosition(x, y);
  if (!posValidation.valid) {
    return { 
      success: false, 
      error: 'INVALID_POSITION', 
      userMessage: posValidation.error 
    };
  }

  // Validate title and description
  if (typeof title !== 'string' || title.trim().length === 0) {
    return {
      success: false,
      error: 'INVALID_TITLE',
      userMessage: 'Card title must be a non-empty string'
    };
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    return {
      success: false,
      error: 'INVALID_DESCRIPTION',
      userMessage: 'Card description must be a non-empty string'
    };
  }

  // Extract options with defaults
  const {
    width = LAYOUT_CONSTANTS.card.WIDTH,
    height = LAYOUT_CONSTANTS.card.HEIGHT,
    includeImage = true,
    backgroundColor = COLOR_THEMES.default.background,
    theme = 'default'
  } = options;

  // Get theme colors
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.default;
  const layout = LAYOUT_CONSTANTS.card;

  // Truncate text if too long
  const truncatedTitle = truncateText(title, 40);
  const truncatedDescription = truncateText(description, 200);

  // Constrain to canvas bounds
  const constrained = constrainToCanvas(x, y, width, height);
  const startX = constrained.x;
  const startY = constrained.y;

  const shapeIds = [];

  try {
    // 1. Create card background
    const cardBgId = await addShape({
      type: 'rectangle',
      x: startX,
      y: startY,
      width: width,
      height: height,
      color: backgroundColor || colors.background,
      rotation: 0
    }, userId);
    shapeIds.push(cardBgId);

    let currentY = startY + layout.PADDING;

    // 2. Create image placeholder (optional)
    if (includeImage) {
      const imageHeight = layout.IMAGE_HEIGHT;
      const imageId = await addShape({
        type: 'rectangle',
        x: startX + layout.PADDING,
        y: currentY,
        width: width - (layout.PADDING * 2),
        height: imageHeight,
        color: colors.border,
        rotation: 0
      }, userId);
      shapeIds.push(imageId);

      // Add "Image" placeholder text centered in the image area
      const imageTextId = await addShape({
        type: 'text',
        x: startX + layout.PADDING,
        y: currentY + (imageHeight / 2) - 15,
        width: width - (layout.PADDING * 2),
        height: 30,
        text: '📷 Image',
        fontSize: 18,
        color: colors.textLight,
        align: 'center',
        verticalAlign: 'middle',
        rotation: 0
      }, userId);
      shapeIds.push(imageTextId);

      currentY += imageHeight + layout.DESCRIPTION_OFFSET;
    }

    // 3. Create title text
    const titleId = await addShape({
      type: 'text',
      x: startX + layout.PADDING,
      y: currentY,
      width: width - (layout.PADDING * 2),
      height: layout.TITLE_HEIGHT,
      text: truncatedTitle,
      fontSize: 20,
      color: colors.text,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(titleId);

    currentY += layout.TITLE_HEIGHT + layout.DESCRIPTION_OFFSET;

    // 4. Create description text
    // Calculate remaining space for description
    const descriptionHeight = startY + height - currentY - layout.PADDING;
    
    const descriptionId = await addShape({
      type: 'text',
      x: startX + layout.PADDING,
      y: currentY,
      width: width - (layout.PADDING * 2),
      height: descriptionHeight,
      text: truncatedDescription,
      fontSize: 14,
      color: colors.textLight,
      align: 'left',
      verticalAlign: 'top',
      rotation: 0
    }, userId);
    shapeIds.push(descriptionId);

    // Success!
    const message = constrained.adjusted 
      ? `Created card "${truncatedTitle}" ${includeImage ? 'with image' : 'without image'} (position adjusted to fit canvas) - ${shapeIds.length} shapes`
      : `Created card "${truncatedTitle}" ${includeImage ? 'with image' : 'without image'} - ${shapeIds.length} shapes`;

    return {
      success: true,
      result: {
        shapeIds,
        count: shapeIds.length,
        title: truncatedTitle,
        description: truncatedDescription,
        includesImage: includeImage,
        width: width,
        height: height
      },
      userMessage: message
    };

  } catch (error) {
    // CLEANUP: If any shape creation failed, attempt to delete created shapes
    console.error('❌ Card layout creation failed:', error);
    
    // Best-effort cleanup
    for (const id of shapeIds) {
      try {
        await deleteShapeFromDB(id);
      } catch (cleanupError) {
        console.warn(`Failed to clean up shape ${id}:`, cleanupError);
      }
    }

    return {
      success: false,
      error: error.code || 'CREATE_FAILED',
      userMessage: 'Failed to create card layout. Please try again.',
      partialShapeIds: shapeIds
    };
  }
}

/**
 * ===== COMPLEX OPERATION: BUTTON GROUP =====
 * Creates a group of buttons arranged horizontally or vertically
 * PR #23
 */
async function createButtonGroup(x, y, buttons = [], options = {}, userId = null) {
  console.log('🔘 Creating button group...', { x, y, buttons, options });

  // Get or validate userId
  if (!userId) {
    try {
      userId = getCurrentUserId();
    } catch (error) {
      return { 
        success: false, 
        error: 'AUTH_REQUIRED', 
        userMessage: error.message 
      };
    }
  }

  // Validate position
  const posValidation = validatePosition(x, y);
  if (!posValidation.valid) {
    return { 
      success: false, 
      error: 'INVALID_POSITION', 
      userMessage: posValidation.error 
    };
  }

  // Validate buttons array
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return {
      success: false,
      error: 'INVALID_BUTTONS',
      userMessage: 'Buttons must be a non-empty array'
    };
  }

  // Validate button structure
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    if (!btn || typeof btn !== 'object') {
      return {
        success: false,
        error: 'INVALID_BUTTON_CONFIG',
        userMessage: `Button at index ${i} must be an object with 'label' property`
      };
    }
    if (typeof btn.label !== 'string' || btn.label.trim().length === 0) {
      return {
        success: false,
        error: 'INVALID_BUTTON_LABEL',
        userMessage: `Button at index ${i} must have a non-empty label`
      };
    }
  }

  // Extract options with defaults
  const {
    orientation = 'horizontal',
    spacing = LAYOUT_CONSTANTS.buttonGroup.SPACING,
    buttonWidth = LAYOUT_CONSTANTS.buttonGroup.BUTTON_WIDTH,
    buttonHeight = LAYOUT_CONSTANTS.buttonGroup.BUTTON_HEIGHT,
    theme = 'default'
  } = options;

  // Validate orientation
  if (orientation !== 'horizontal' && orientation !== 'vertical') {
    return {
      success: false,
      error: 'INVALID_ORIENTATION',
      userMessage: 'Orientation must be "horizontal" or "vertical"'
    };
  }

  // Get theme colors
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.default;

  // Calculate total dimensions
  let totalWidth, totalHeight;
  if (orientation === 'horizontal') {
    totalWidth = (buttons.length * buttonWidth) + ((buttons.length - 1) * spacing);
    totalHeight = buttonHeight;
  } else {
    totalWidth = buttonWidth;
    totalHeight = (buttons.length * buttonHeight) + ((buttons.length - 1) * spacing);
  }

  // Constrain to canvas bounds
  const constrained = constrainToCanvas(x, y, totalWidth, totalHeight);
  const startX = constrained.x;
  const startY = constrained.y;

  const shapeIds = [];

  try {
    let currentX = startX;
    let currentY = startY;

    // Create each button (background rectangle + text label)
    for (const button of buttons) {
      const truncatedLabel = truncateText(button.label, 20);
      const buttonColor = button.color || colors.primary;

      // 1. Create button background
      const buttonBgId = await addShape({
        type: 'rectangle',
        x: currentX,
        y: currentY,
        width: buttonWidth,
        height: buttonHeight,
        color: buttonColor,
        rotation: 0
      }, userId);
      shapeIds.push(buttonBgId);

      // 2. Create button label (centered text)
      const labelId = await addShape({
        type: 'text',
        x: currentX,
        y: currentY,
        width: buttonWidth,
        height: buttonHeight,
        text: truncatedLabel,
        fontSize: 14,
        color: colors.buttonText,
        align: 'center',
        verticalAlign: 'middle',
        rotation: 0
      }, userId);
      shapeIds.push(labelId);

      // Move to next button position
      if (orientation === 'horizontal') {
        currentX += buttonWidth + spacing;
      } else {
        currentY += buttonHeight + spacing;
      }
    }

    // Success!
    const message = constrained.adjusted 
      ? `Created ${orientation} button group with ${buttons.length} buttons (position adjusted to fit canvas) - ${shapeIds.length} shapes`
      : `Created ${orientation} button group with ${buttons.length} buttons - ${shapeIds.length} shapes`;

    return {
      success: true,
      result: {
        shapeIds,
        count: shapeIds.length,
        buttonCount: buttons.length,
        orientation: orientation,
        totalWidth: totalWidth,
        totalHeight: totalHeight
      },
      userMessage: message
    };

  } catch (error) {
    // CLEANUP: If any shape creation failed, attempt to delete created shapes
    console.error('❌ Button group creation failed:', error);
    
    // Best-effort cleanup
    for (const id of shapeIds) {
      try {
        await deleteShapeFromDB(id);
      } catch (cleanupError) {
        console.warn(`Failed to clean up shape ${id}:`, cleanupError);
      }
    }

    return {
      success: false,
      error: error.code || 'CREATE_FAILED',
      userMessage: 'Failed to create button group. Please try again.',
      partialShapeIds: shapeIds
    };
  }
}

/**
 * ===== COMPLEX OPERATION: LANDING PAGE =====
 * Creates a complete landing page mockup with navigation, hero, features, and footer
 * PR #23 - BONUS OPERATION
 */
async function createLandingPage(x, y, options = {}, userId = null) {
  console.log('🌐 Creating landing page...', { x, y, options });

  // Get or validate userId
  if (!userId) {
    try {
      userId = getCurrentUserId();
    } catch (error) {
      return { 
        success: false, 
        error: 'AUTH_REQUIRED', 
        userMessage: error.message 
      };
    }
  }

  // Validate position
  const posValidation = validatePosition(x, y);
  if (!posValidation.valid) {
    return { 
      success: false, 
      error: 'INVALID_POSITION', 
      userMessage: posValidation.error 
    };
  }

  // Extract options with defaults
  const {
    siteName = 'Your Brand',
    headline = 'Welcome to Our Platform',
    subheadline = 'The best solution for your needs',
    ctaText = 'Get Started',
    theme = 'default'
  } = options;

  // Get theme colors and layout
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.default;
  const layout = LAYOUT_CONSTANTS.landingPage;

  // Calculate total height
  const totalHeight = 
    layout.NAV_HEIGHT + 
    layout.SECTION_SPACING + 
    layout.HERO_HEIGHT + 
    layout.SECTION_SPACING + 
    200 + // Email signup section
    layout.SECTION_SPACING + 
    layout.FEATURE_CARD_HEIGHT + 
    layout.SECTION_SPACING + 
    layout.FOOTER_HEIGHT;

  // Constrain to canvas bounds
  const constrained = constrainToCanvas(x, y, layout.WIDTH, totalHeight);
  const startX = constrained.x;
  const startY = constrained.y;

  const shapeIds = [];
  let currentY = startY;

  try {
    // ===== 1. NAVIGATION BAR =====
    // Background
    const navBgId = await addShape({
      type: 'rectangle',
      x: startX,
      y: currentY,
      width: layout.WIDTH,
      height: layout.NAV_HEIGHT,
      color: colors.primary,
      rotation: 0
    }, userId);
    shapeIds.push(navBgId);

    // Logo/Brand name
    const brandId = await addShape({
      type: 'text',
      x: startX + layout.CONTENT_PADDING,
      y: currentY,
      width: 200,
      height: layout.NAV_HEIGHT,
      text: truncateText(siteName, 20),
      fontSize: 20,
      color: colors.buttonText,
      align: 'left',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(brandId);

    // Nav menu items
    const menuItems = ['Home', 'Features', 'Pricing', 'Contact'];
    let menuX = startX + layout.WIDTH - layout.CONTENT_PADDING - (menuItems.length * 100);
    
    for (const item of menuItems) {
      const menuItemId = await addShape({
        type: 'text',
        x: menuX,
        y: currentY,
        width: 80,
        height: layout.NAV_HEIGHT,
        text: item,
        fontSize: 14,
        color: colors.buttonText,
        align: 'center',
        verticalAlign: 'middle',
        rotation: 0
      }, userId);
      shapeIds.push(menuItemId);
      menuX += 100;
    }

    currentY += layout.NAV_HEIGHT + layout.SECTION_SPACING;

    // ===== 2. HERO SECTION =====
    // Hero background
    const heroBgId = await addShape({
      type: 'rectangle',
      x: startX,
      y: currentY,
      width: layout.WIDTH,
      height: layout.HERO_HEIGHT,
      color: colors.background,
      rotation: 0
    }, userId);
    shapeIds.push(heroBgId);

    // Headline
    const headlineId = await addShape({
      type: 'text',
      x: startX + layout.CONTENT_PADDING,
      y: currentY + 60,
      width: layout.WIDTH - (layout.CONTENT_PADDING * 2),
      height: 50,
      text: truncateText(headline, 60),
      fontSize: 36,
      color: colors.text,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(headlineId);

    // Subheadline
    const subheadlineId = await addShape({
      type: 'text',
      x: startX + layout.CONTENT_PADDING,
      y: currentY + 120,
      width: layout.WIDTH - (layout.CONTENT_PADDING * 2),
      height: 40,
      text: truncateText(subheadline, 80),
      fontSize: 18,
      color: colors.textLight,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(subheadlineId);

    // CTA Button
    const ctaX = startX + (layout.WIDTH / 2) - 75;
    const ctaBgId = await addShape({
      type: 'rectangle',
      x: ctaX,
      y: currentY + 200,
      width: 150,
      height: 50,
      color: colors.primary,
      rotation: 0
    }, userId);
    shapeIds.push(ctaBgId);

    const ctaTextId = await addShape({
      type: 'text',
      x: ctaX,
      y: currentY + 200,
      width: 150,
      height: 50,
      text: truncateText(ctaText, 15),
      fontSize: 16,
      color: colors.buttonText,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(ctaTextId);

    currentY += layout.HERO_HEIGHT + layout.SECTION_SPACING;

    // ===== 3. EMAIL SIGNUP SECTION =====
    const emailSectionHeight = 200;
    
    // Section background
    const emailBgId = await addShape({
      type: 'rectangle',
      x: startX,
      y: currentY,
      width: layout.WIDTH,
      height: emailSectionHeight,
      color: '#f9fafb',
      rotation: 0
    }, userId);
    shapeIds.push(emailBgId);

    // Section title
    const emailTitleId = await addShape({
      type: 'text',
      x: startX + layout.CONTENT_PADDING,
      y: currentY + 30,
      width: layout.WIDTH - (layout.CONTENT_PADDING * 2),
      height: 40,
      text: 'Join Our Newsletter',
      fontSize: 24,
      color: colors.text,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(emailTitleId);

    // Email input field
    const emailInputX = startX + (layout.WIDTH / 2) - 200;
    const emailInputId = await addShape({
      type: 'rectangle',
      x: emailInputX,
      y: currentY + 90,
      width: 300,
      height: 45,
      color: '#ffffff',
      rotation: 0
    }, userId);
    shapeIds.push(emailInputId);

    const emailPlaceholderId = await addShape({
      type: 'text',
      x: emailInputX,
      y: currentY + 90,
      width: 300,
      height: 45,
      text: 'Enter your email',
      fontSize: 14,
      color: colors.textLight,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(emailPlaceholderId);

    // Subscribe button
    const subscribeBtnId = await addShape({
      type: 'rectangle',
      x: emailInputX + 310,
      y: currentY + 90,
      width: 100,
      height: 45,
      color: colors.primary,
      rotation: 0
    }, userId);
    shapeIds.push(subscribeBtnId);

    const subscribeTxtId = await addShape({
      type: 'text',
      x: emailInputX + 310,
      y: currentY + 90,
      width: 100,
      height: 45,
      text: 'Subscribe',
      fontSize: 14,
      color: colors.buttonText,
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(subscribeTxtId);

    currentY += emailSectionHeight + layout.SECTION_SPACING;

    // ===== 4. FEATURE CARDS (3 cards in a row) =====
    const features = [
      { title: 'Fast & Reliable', desc: 'Lightning-fast performance you can count on' },
      { title: 'Secure', desc: 'Enterprise-grade security for your data' },
      { title: 'Easy to Use', desc: 'Intuitive interface anyone can master' }
    ];

    const cardSpacing = 25;
    const totalCardsWidth = (layout.FEATURE_CARD_WIDTH * 3) + (cardSpacing * 2);
    let featureX = startX + (layout.WIDTH - totalCardsWidth) / 2;

    for (const feature of features) {
      // Card background
      const cardBgId = await addShape({
        type: 'rectangle',
        x: featureX,
        y: currentY,
        width: layout.FEATURE_CARD_WIDTH,
        height: layout.FEATURE_CARD_HEIGHT,
        color: colors.background,
        rotation: 0
      }, userId);
      shapeIds.push(cardBgId);

      // Card title
      const cardTitleId = await addShape({
        type: 'text',
        x: featureX + 20,
        y: currentY + 40,
        width: layout.FEATURE_CARD_WIDTH - 40,
        height: 40,
        text: truncateText(feature.title, 30),
        fontSize: 20,
        color: colors.text,
        align: 'center',
        verticalAlign: 'middle',
        rotation: 0
      }, userId);
      shapeIds.push(cardTitleId);

      // Card description
      const cardDescId = await addShape({
        type: 'text',
        x: featureX + 20,
        y: currentY + 90,
        width: layout.FEATURE_CARD_WIDTH - 40,
        height: 80,
        text: truncateText(feature.desc, 80),
        fontSize: 14,
        color: colors.textLight,
        align: 'center',
        verticalAlign: 'top',
        rotation: 0
      }, userId);
      shapeIds.push(cardDescId);

      featureX += layout.FEATURE_CARD_WIDTH + cardSpacing;
    }

    currentY += layout.FEATURE_CARD_HEIGHT + layout.SECTION_SPACING;

    // ===== 5. FOOTER =====
    const footerBgId = await addShape({
      type: 'rectangle',
      x: startX,
      y: currentY,
      width: layout.WIDTH,
      height: layout.FOOTER_HEIGHT,
      color: '#1a1a1a',
      rotation: 0
    }, userId);
    shapeIds.push(footerBgId);

    // Footer text
    const footerTextId = await addShape({
      type: 'text',
      x: startX + layout.CONTENT_PADDING,
      y: currentY,
      width: layout.WIDTH - (layout.CONTENT_PADDING * 2),
      height: layout.FOOTER_HEIGHT,
      text: `© 2024 ${truncateText(siteName, 20)}. All rights reserved.`,
      fontSize: 14,
      color: '#ffffff',
      align: 'center',
      verticalAlign: 'middle',
      rotation: 0
    }, userId);
    shapeIds.push(footerTextId);

    // Success!
    const message = constrained.adjusted 
      ? `Created complete landing page "${siteName}" (position adjusted to fit canvas) - ${shapeIds.length} shapes`
      : `Created complete landing page "${siteName}" - ${shapeIds.length} shapes`;

    return {
      success: true,
      result: {
        shapeIds,
        count: shapeIds.length,
        siteName: siteName,
        sections: ['navigation', 'hero', 'email-signup', 'features', 'footer'],
        width: layout.WIDTH,
        height: totalHeight
      },
      userMessage: message
    };

  } catch (error) {
    // CLEANUP: If any shape creation failed, attempt to delete created shapes
    console.error('❌ Landing page creation failed:', error);
    
    // Best-effort cleanup
    for (const id of shapeIds) {
      try {
        await deleteShapeFromDB(id);
      } catch (cleanupError) {
        console.warn(`Failed to clean up shape ${id}:`, cleanupError);
      }
    }

    return {
      success: false,
      error: error.code || 'CREATE_FAILED',
      userMessage: 'Failed to create landing page. Please try again.',
      partialShapeIds: shapeIds
    };
  }
}

/**
 * Canvas API - Unified interface for all canvas operations
 * Used by both manual interactions and AI agent
 */
export const canvasAPI = {
  /**
   * Create a rectangle
   */
  async createRectangle(x, y, width, height, color, userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }
    // Validate parameters
    const posValidation = validatePosition(x, y);
    if (!posValidation.valid) {
      return { success: false, error: 'INVALID_POSITION', userMessage: posValidation.error };
    }

    const sizeValidation = validateSize(width, height);
    if (!sizeValidation.valid) {
      return { success: false, error: 'INVALID_SIZE', userMessage: sizeValidation.error };
    }

    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    // Create shape
    try {
      const shape = {
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color,
        rotation: 0
      };

      const shapeId = await addShape(shape, userId);
      return { success: true, result: { shapeId, ...shape } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to create rectangle. Please try again.'
      };
    }
  },

  /**
   * Create a circle
   */
  async createCircle(x, y, radius, color, userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }
    // Validate parameters
    const posValidation = validatePosition(x, y);
    if (!posValidation.valid) {
      return { success: false, error: 'INVALID_POSITION', userMessage: posValidation.error };
    }

    if (typeof radius !== 'number' || radius < 5) {
      return { success: false, error: 'INVALID_RADIUS', userMessage: 'Radius must be at least 5px' };
    }

    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    // Create shape (convert center to top-left for storage)
    try {
      const shape = {
        type: 'circle',
        x: x - radius, // Store as top-left
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
        color,
        rotation: 0
      };

      const shapeId = await addShape(shape, userId);
      return { success: true, result: { shapeId, ...shape } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to create circle. Please try again.'
      };
    }
  },

  /**
   * Create a line
   */
  async createLine(x1, y1, x2, y2, strokeWidth, color, userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }
    // Validate parameters
    const pos1Validation = validatePosition(x1, y1);
    if (!pos1Validation.valid) {
      return { success: false, error: 'INVALID_START', userMessage: `Start point: ${pos1Validation.error}` };
    }

    const pos2Validation = validatePosition(x2, y2);
    if (!pos2Validation.valid) {
      return { success: false, error: 'INVALID_END', userMessage: `End point: ${pos2Validation.error}` };
    }

    if (typeof strokeWidth !== 'number' || strokeWidth < 1 || strokeWidth > 50) {
      return { success: false, error: 'INVALID_STROKE', userMessage: 'Stroke width must be between 1-50px' };
    }

    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    // Create shape
    try {
      const shape = {
        type: 'line',
        x: x1,
        y: y1,
        endX: x2,
        endY: y2,
        strokeWidth,
        color,
        rotation: 0
      };

      const shapeId = await addShape(shape, userId);
      return { success: true, result: { shapeId, ...shape } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to create line. Please try again.'
      };
    }
  },

  /**
   * Create a text layer
   */
  async createText(text, x, y, fontSize = 16, fontWeight = 'normal', color = '#000000', userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }
    // Validate parameters
    if (typeof text !== 'string' || text.length === 0) {
      return { success: false, error: 'INVALID_TEXT', userMessage: 'Text cannot be empty' };
    }

    const posValidation = validatePosition(x, y);
    if (!posValidation.valid) {
      return { success: false, error: 'INVALID_POSITION', userMessage: posValidation.error };
    }

    if (typeof fontSize !== 'number' || fontSize < 8 || fontSize > 200) {
      return { success: false, error: 'INVALID_FONTSIZE', userMessage: 'Font size must be between 8-200' };
    }

    if (!['normal', 'bold'].includes(fontWeight)) {
      return { success: false, error: 'INVALID_FONTWEIGHT', userMessage: 'Font weight must be "normal" or "bold"' };
    }

    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    // Create shape
    try {
      const shape = {
        type: 'text',
        x,
        y,
        width: 200, // Default width, will auto-resize
        height: fontSize * 1.2,
        text,
        fontSize,
        fontWeight,
        color,
        rotation: 0
      };

      const shapeId = await addShape(shape, userId);
      return { success: true, result: { shapeId, ...shape } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to create text. Please try again.'
      };
    }
  },

  /**
   * Move a shape (or multiple selected shapes)
   */
  async moveShape(shapeId, x, y, relative = false) {
    // If no shapeId provided, use ALL selected shapes
    if (!shapeId) {
      const selection = getCurrentSelection();
      if (!selection.selectedShapeIds || selection.selectedShapeIds.length === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          userMessage: 'Please select a shape first before using move command.'
        };
      }
      
      // Handle multiple selected shapes
      if (selection.selectedShapeIds.length > 1) {
        const results = [];
        const errors = [];
        
        for (const selectedId of selection.selectedShapeIds) {
          const result = await canvasAPI.moveShape(selectedId, x, y, relative);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ shapeId: selectedId, error: result.userMessage });
          }
        }
        
        return {
          success: true,
          result: {
            moved: results,
            movedCount: results.length,
            errors: errors,
            errorCount: errors.length,
            totalAttempted: selection.selectedShapeIds.length
          },
          userMessage: errors.length > 0
            ? `Moved ${results.length} shape(s), ${errors.length} failed.`
            : `Successfully moved ${results.length} shape(s)!`
        };
      }
      
      // Single selection
      shapeId = selection.selectedShapeIds[0];
    }
    
    // If relative is true, fetch current position and add offsets
    let finalX = x;
    let finalY = y;
    
    if (relative) {
      try {
        const shapes = await getAllShapes();
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            error: 'SHAPE_NOT_FOUND',
            userMessage: 'Could not find the shape to move.'
          };
        }
        
        // Add relative offsets to current position
        // If x or y is null/undefined, keep current position on that axis
        finalX = (x !== null && x !== undefined) ? shape.x + x : shape.x;
        finalY = (y !== null && y !== undefined) ? shape.y + y : shape.y;
      } catch (error) {
        return {
          success: false,
          error: 'FETCH_ERROR',
          userMessage: 'Could not fetch current shape position.'
        };
      }
    }
    
    const posValidation = validatePosition(finalX, finalY);
    if (!posValidation.valid) {
      return { success: false, error: 'INVALID_POSITION', userMessage: posValidation.error };
    }

    try {
      await updateShape(shapeId, { x: finalX, y: finalY });
      return { success: true, result: { shapeId, x: finalX, y: finalY } };
    } catch (error) {
      // If shape not found, try using selected shape as fallback
      if (error.code === 'not-found') {
        const fallbackId = getFirstSelectedId();
        if (fallbackId && fallbackId !== shapeId) {
          try {
            await updateShape(fallbackId, { x: finalX, y: finalY });
            return { success: true, result: { shapeId: fallbackId, x: finalX, y: finalY } };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError.code,
              userMessage: 'Failed to move shape. Please select a shape first.'
            };
          }
        }
      }
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to move shape. Please select a shape first.'
      };
    }
  },

  /**
   * Resize a shape (or multiple selected shapes)
   */
  async resizeShape(shapeId, width, height) {
    // If no shapeId provided, use ALL selected shapes
    if (!shapeId) {
      const selection = getCurrentSelection();
      if (!selection.selectedShapeIds || selection.selectedShapeIds.length === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          userMessage: 'Please select a shape first before using resize command.'
        };
      }
      
      // Handle multiple selected shapes
      if (selection.selectedShapeIds.length > 1) {
        const results = [];
        const errors = [];
        
        for (const selectedId of selection.selectedShapeIds) {
          const result = await canvasAPI.resizeShape(selectedId, width, height);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ shapeId: selectedId, error: result.userMessage });
          }
        }
        
        return {
          success: true,
          result: {
            resized: results,
            resizedCount: results.length,
            errors: errors,
            errorCount: errors.length,
            totalAttempted: selection.selectedShapeIds.length
          },
          userMessage: errors.length > 0
            ? `Resized ${results.length} shape(s), ${errors.length} failed.`
            : `Successfully resized ${results.length} shape(s)!`
        };
      }
      
      // Single selection
      shapeId = selection.selectedShapeIds[0];
    }
    
    const sizeValidation = validateSize(width, height);
    if (!sizeValidation.valid) {
      return { success: false, error: 'INVALID_SIZE', userMessage: sizeValidation.error };
    }

    try {
      await updateShape(shapeId, { width, height });
      return { success: true, result: { shapeId, width, height } };
    } catch (error) {
      // If shape not found, try using selected shape as fallback
      if (error.code === 'not-found') {
        const fallbackId = getFirstSelectedId();
        if (fallbackId && fallbackId !== shapeId) {
          try {
            await updateShape(fallbackId, { width, height });
            return { success: true, result: { shapeId: fallbackId, width, height } };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError.code,
              userMessage: 'Failed to resize shape. Please select a shape first.'
            };
          }
        }
      }
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to resize shape. Please select a shape first.'
      };
    }
  },

  /**
   * Rotate a shape (or multiple selected shapes)
   * @param {string} shapeId - Optional shape ID (uses selected if omitted)
   * @param {number} degrees - Rotation amount in degrees
   * @param {boolean} relative - If true, adds to current rotation; if false, sets absolute rotation
   */
  async rotateShape(shapeId, degrees, relative = false) {
    console.log('[canvasAPI] rotateShape called:', { shapeId, degrees, relative });
    
    // If no shapeId provided, use ALL selected shapes
    if (!shapeId) {
      const selection = getCurrentSelection();
      console.log('[canvasAPI] rotateShape selection:', selection);
      
      if (!selection.selectedShapeIds || selection.selectedShapeIds.length === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          userMessage: 'Please select a shape first before using rotate command.'
        };
      }
      
      // Handle multiple selected shapes
      if (selection.selectedShapeIds.length > 1) {
        console.log(`[canvasAPI] Rotating ${selection.selectedShapeIds.length} shapes`);
        const results = [];
        const errors = [];
        
        for (const selectedId of selection.selectedShapeIds) {
          console.log(`[canvasAPI] Rotating shape ${selectedId}`);
          const result = await canvasAPI.rotateShape(selectedId, degrees, relative);
          console.log(`[canvasAPI] Rotate result for ${selectedId}:`, result);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ shapeId: selectedId, error: result.userMessage });
          }
        }
        
        console.log('[canvasAPI] Batch rotate complete:', { results, errors });
        return {
          success: true,
          result: {
            rotated: results,
            rotatedCount: results.length,
            errors: errors,
            errorCount: errors.length,
            totalAttempted: selection.selectedShapeIds.length
          },
          userMessage: errors.length > 0
            ? `Rotated ${results.length} shape(s), ${errors.length} failed.`
            : `Successfully rotated ${results.length} shape(s)!`
        };
      }
      
      // Single selection
      shapeId = selection.selectedShapeIds[0];
      console.log(`[canvasAPI] Single selection: ${shapeId}`);
    }
    
    if (typeof degrees !== 'number') {
      return { success: false, error: 'INVALID_ROTATION', userMessage: 'Rotation must be a number' };
    }

    try {
      let finalRotation = degrees;
      
      // If relative rotation, get current rotation and add to it
      if (relative) {
        const shapes = await getAllShapes();
        const currentShape = shapes.find(s => s.id === shapeId);
        if (currentShape) {
          const currentRotation = currentShape.rotation || 0;
          finalRotation = currentRotation + degrees;
        }
      }
      
      // Normalize to 0-359
      const normalizedRotation = ((finalRotation % 360) + 360) % 360;

      await updateShape(shapeId, { rotation: normalizedRotation });
      return { 
        success: true, 
        result: { 
          shapeId, 
          rotation: normalizedRotation,
          wasRelative: relative 
        } 
      };
    } catch (error) {
      // If shape not found, try using selected shape as fallback
      if (error.code === 'not-found') {
        const fallbackId = getFirstSelectedId();
        if (fallbackId && fallbackId !== shapeId) {
          try {
            let finalRotation = degrees;
            
            if (relative) {
              const shapes = await getAllShapes();
              const currentShape = shapes.find(s => s.id === fallbackId);
              if (currentShape) {
                const currentRotation = currentShape.rotation || 0;
                finalRotation = currentRotation + degrees;
              }
            }
            
            const normalizedRotation = ((finalRotation % 360) + 360) % 360;
            await updateShape(fallbackId, { rotation: normalizedRotation });
            return { success: true, result: { shapeId: fallbackId, rotation: normalizedRotation } };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError.code,
              userMessage: 'Failed to rotate shape. Please select a shape first.'
            };
          }
        }
      }
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to rotate shape. Please select a shape first.'
      };
    }
  },

  /**
   * Change shape color (or multiple selected shapes)
   */
  async changeShapeColor(shapeId, color) {
    // If no shapeId provided, use ALL selected shapes
    if (!shapeId) {
      const selection = getCurrentSelection();
      if (!selection.selectedShapeIds || selection.selectedShapeIds.length === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          userMessage: 'Please select a shape first before using color change command.'
        };
      }
      
      // Handle multiple selected shapes
      if (selection.selectedShapeIds.length > 1) {
        const results = [];
        const errors = [];
        
        for (const selectedId of selection.selectedShapeIds) {
          const result = await canvasAPI.changeShapeColor(selectedId, color);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ shapeId: selectedId, error: result.userMessage });
          }
        }
        
        return {
          success: true,
          result: {
            colorChanged: results,
            colorChangedCount: results.length,
            errors: errors,
            errorCount: errors.length,
            totalAttempted: selection.selectedShapeIds.length
          },
          userMessage: errors.length > 0
            ? `Changed color of ${results.length} shape(s), ${errors.length} failed.`
            : `Successfully changed color of ${results.length} shape(s)!`
        };
      }
      
      // Single selection
      shapeId = selection.selectedShapeIds[0];
    }
    
    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    try {
      await updateShape(shapeId, { color });
      return { success: true, result: { shapeId, color } };
    } catch (error) {
      // If shape not found, try using selected shape as fallback
      if (error.code === 'not-found') {
        const fallbackId = getFirstSelectedId();
        if (fallbackId && fallbackId !== shapeId) {
          try {
            await updateShape(fallbackId, { color });
            return { success: true, result: { shapeId: fallbackId, color } };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError.code,
              userMessage: 'Failed to change color. Please select a shape first.'
            };
          }
        }
      }
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to change color. Please select a shape first.'
      };
    }
  },

  /**
   * Delete a shape (or multiple selected shapes)
   */
  async deleteShape(shapeId) {
    console.log('[canvasAPI] deleteShape called:', { shapeId });
    
    // If no shapeId provided, use ALL selected shapes
    if (!shapeId) {
      const selection = getCurrentSelection();
      console.log('[canvasAPI] deleteShape selection:', selection);
      
      if (!selection.selectedShapeIds || selection.selectedShapeIds.length === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          userMessage: 'Please select a shape first before using delete command.'
        };
      }
      
      // Handle multiple selected shapes
      if (selection.selectedShapeIds.length > 1) {
        console.log(`[canvasAPI] Deleting ${selection.selectedShapeIds.length} shapes`);
        const results = [];
        const errors = [];
        
        for (const selectedId of selection.selectedShapeIds) {
          console.log(`[canvasAPI] Deleting shape ${selectedId}`);
          const result = await canvasAPI.deleteShape(selectedId);
          console.log(`[canvasAPI] Delete result for ${selectedId}:`, result);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ shapeId: selectedId, error: result.userMessage });
          }
        }
        
        console.log('[canvasAPI] Batch delete complete:', { results, errors });
        return {
          success: true,
          result: {
            deleted: results,
            deletedCount: results.length,
            errors: errors,
            errorCount: errors.length,
            totalAttempted: selection.selectedShapeIds.length
          },
          userMessage: errors.length > 0
            ? `Deleted ${results.length} shape(s), ${errors.length} failed.`
            : `Successfully deleted ${results.length} shape(s)!`
        };
      }
      
      // Single selection
      shapeId = selection.selectedShapeIds[0];
      console.log(`[canvasAPI] Single selection: ${shapeId}`);
    }
    
    if (typeof shapeId !== 'string') {
      console.log('[canvasAPI] Invalid shapeId type:', typeof shapeId);
      return { success: false, error: 'INVALID_SHAPE_ID', userMessage: 'Invalid shape ID' };
    }

    try {
      console.log(`[canvasAPI] Calling deleteShapeFromDB for ${shapeId}`);
      await deleteShapeFromDB(shapeId);
      console.log(`[canvasAPI] Successfully deleted ${shapeId}`);
      return { success: true, result: { shapeId } };
    } catch (error) {
      console.log(`[canvasAPI] Delete error for ${shapeId}:`, error);
      // If shape not found, try using selected shape as fallback
      if (error.code === 'not-found') {
        const fallbackId = getFirstSelectedId();
        if (fallbackId && fallbackId !== shapeId) {
          console.log(`[canvasAPI] Trying fallback ID: ${fallbackId}`);
          try {
            await deleteShapeFromDB(fallbackId);
            return { success: true, result: { shapeId: fallbackId } };
          } catch (fallbackError) {
            console.log('[canvasAPI] Fallback also failed:', fallbackError);
            return {
              success: false,
              error: fallbackError.code,
              userMessage: 'Failed to delete shape. Please select a shape first.'
            };
          }
        }
      }
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to delete shape. Please select a shape first.'
      };
    }
  },

  /**
   * Get all shapes on canvas
   */
  async getCanvasState() {
    try {
      const shapes = await getAllShapes();
      return { success: true, result: shapes };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to get canvas state.'
      };
    }
  },

  /**
   * Get currently selected shapes
   */
  async getSelectedShapes() {
    const selection = getCurrentSelection();
    return {
      success: true,
      result: selection.shapes,
      count: selection.selectedShapeIds.length
    };
  },

  /**
   * Get canvas center coordinates
   */
  async getCanvasCenter() {
    return {
      success: true,
      result: {
        x: CANVAS_CONFIG.centerX,
        y: CANVAS_CONFIG.centerY
      }
    };
  },

  /**
   * Generate multiple shapes programmatically (pattern-based)
   * @param {Object} config - Generation configuration
   * Supports: count, type, pattern (random, grid, row, column, circle-pattern)
   */
  async generateShapes(config, userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }

    const {
      count = 10,
      type = 'circle',
      pattern = 'random',
      startX = 500,
      startY = 500,
      width = 100,
      height = 100,
      radius = 50,
      color = '#3b82f6',
      spacing = 150,
      columns = 10
    } = config;

    // Limit to 1000 shapes max
    const shapeCount = Math.min(count, 1000);
    const shapes = [];

    // Generate shapes based on pattern
    for (let i = 0; i < shapeCount; i++) {
      let x, y;

      switch (pattern) {
        case 'random':
          // Random placement across canvas
          x = Math.random() * (CANVAS_CONFIG.width - 200) + 100;
          y = Math.random() * (CANVAS_CONFIG.height - 200) + 100;
          break;

        case 'grid':
          // Grid pattern
          const col = i % columns;
          const row = Math.floor(i / columns);
          x = startX + (col * spacing);
          y = startY + (row * spacing);
          break;

        case 'row':
          // Horizontal row
          x = startX + (i * spacing);
          y = startY;
          break;

        case 'column':
          // Vertical column
          x = startX;
          y = startY + (i * spacing);
          break;

        case 'circle-pattern':
          // Circular arrangement
          const angle = (i / shapeCount) * 2 * Math.PI;
          const patternRadius = Math.min(CANVAS_CONFIG.width, CANVAS_CONFIG.height) / 3;
          x = CANVAS_CONFIG.centerX + patternRadius * Math.cos(angle);
          y = CANVAS_CONFIG.centerY + patternRadius * Math.sin(angle);
          break;

        case 'spiral':
          // Spiral pattern
          const spiralAngle = i * 0.5;
          const spiralRadius = i * 10;
          x = CANVAS_CONFIG.centerX + spiralRadius * Math.cos(spiralAngle);
          y = CANVAS_CONFIG.centerY + spiralRadius * Math.sin(spiralAngle);
          break;

        default:
          // Default to random
          x = Math.random() * (CANVAS_CONFIG.width - 200) + 100;
          y = Math.random() * (CANVAS_CONFIG.height - 200) + 100;
      }

      // Add shape definition
      shapes.push({
        type,
        x,
        y,
        width: type === 'rectangle' ? width : undefined,
        height: type === 'rectangle' ? height : undefined,
        radius: type === 'circle' ? radius : undefined,
        color
      });
    }

    // Use existing batch creation
    return this.createShapesBatch(shapes, userId);
  },

  /**
   * Create multiple shapes at once (batch operation)
   * @param {Array} shapes - Array of shape definitions
   * Each shape should have: { type, x, y, ...other params }
   * Supported types: 'rectangle', 'circle', 'line', 'text'
   */
  async createShapesBatch(shapes, userId = null) {
    // Get current user if not provided
    if (!userId) {
      try {
        userId = getCurrentUserId();
      } catch (error) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          userMessage: 'You must be logged in to create shapes.'
        };
      }
    }

    if (!Array.isArray(shapes) || shapes.length === 0) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        userMessage: 'Shapes must be a non-empty array.'
      };
    }

    const results = [];
    const errors = [];

    // Create all shapes
    for (const shape of shapes) {
      try {
        let result;

        switch (shape.type) {
          case 'rectangle':
            result = await this.createRectangle(
              shape.x,
              shape.y,
              shape.width || 200,
              shape.height || 150,
              shape.color || '#3b82f6',
              userId
            );
            break;

          case 'circle':
            result = await this.createCircle(
              shape.x,
              shape.y,
              shape.radius || 75,
              shape.color || '#3b82f6',
              userId
            );
            break;

          case 'line':
            result = await this.createLine(
              shape.x || shape.x1,
              shape.y || shape.y1,
              shape.endX || shape.x2,
              shape.endY || shape.y2,
              shape.strokeWidth || 2,
              shape.color || '#3b82f6',
              userId
            );
            break;

          case 'text':
            result = await this.createText(
              shape.text || 'Text',
              shape.x,
              shape.y,
              shape.fontSize || 16,
              shape.fontWeight || 'normal',
              shape.color || '#000000',
              userId
            );
            break;

          default:
            errors.push({
              shape: shape,
              error: `Unknown shape type: ${shape.type}`
            });
            continue;
        }

        if (result.success) {
          results.push(result.result);
        } else {
          errors.push({
            shape: shape,
            error: result.userMessage
          });
        }
      } catch (error) {
        errors.push({
          shape: shape,
          error: error.message
        });
      }
    }

    return {
      success: true,
      result: {
        created: results,
        createdCount: results.length,
        errors: errors,
        errorCount: errors.length,
        totalAttempted: shapes.length
      },
      userMessage: errors.length > 0
        ? `Created ${results.length} shape(s), ${errors.length} failed.`
        : `Successfully created ${results.length} shape(s)!`
    };
  },

  // ===== SELECTION COMMANDS =====

  /**
   * Select ALL shapes on the canvas (regardless of type)
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectAllShapes() {
    try {
      // Get all shapes from Firestore
      const shapes = await getAllShapes();
      const allIds = shapes.map(s => s.id);
      
      // Update selection via bridge
      updateSelection(allIds);
      
      return {
        success: true,
        selectedCount: allIds.length,
        selectedIds: allIds,
        userMessage: `Selected all ${allIds.length} shape(s)`,
        result: { count: allIds.length, ids: allIds }
      };
    } catch (error) {
      console.error('[canvasAPI] selectAllShapes error:', error);
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to select all shapes. Please try again.'
      };
    }
  },

  /**
   * Select all shapes of a specific type
   * @param {string} type - 'rectangle', 'circle', 'line', or 'text' (accepts singular or plural)
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectShapesByType(type) {
    // Validate type parameter (now handles singular/plural)
    const typeValidation = validateShapeType(type);
    if (!typeValidation.valid) {
      return { 
        success: false, 
        error: 'INVALID_TYPE', 
        userMessage: typeValidation.error 
      };
    }

    // Use normalized type (singular form)
    const normalizedType = typeValidation.normalizedType;

    try {
      // Get all shapes from Firestore
      const shapes = await getAllShapes();
      
      // Filter by type (using normalized type)
      const matchingShapes = shapes.filter(s => s.type === normalizedType);
      const matchingIds = matchingShapes.map(s => s.id);
      
      // Update selection via bridge
      updateSelection(matchingIds);
      
      return {
        success: true,
        selectedCount: matchingIds.length,
        selectedIds: matchingIds,
        userMessage: `Selected ${matchingIds.length} ${normalizedType}(s)`,
        result: { count: matchingIds.length, type: normalizedType, ids: matchingIds }
      };
    } catch (error) {
      console.error('[canvasAPI] selectShapesByType error:', error);
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to select shapes by type. Please try again.'
      };
    }
  },

  /**
   * Select all shapes with a specific color
   * @param {string} color - Hex color code (e.g., '#FF0000')
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectShapesByColor(color) {
    // Validate color parameter
    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { 
        success: false, 
        error: 'INVALID_COLOR', 
        userMessage: colorValidation.error 
      };
    }

    try {
      // Get all shapes from Firestore
      const shapes = await getAllShapes();
      
      // Filter by color (case-insensitive hex match)
      const matchingShapes = shapes.filter(s => 
        s.color && s.color.toLowerCase() === color.toLowerCase()
      );
      const matchingIds = matchingShapes.map(s => s.id);
      
      // Update selection via bridge
      updateSelection(matchingIds);
      
      return {
        success: true,
        selectedCount: matchingIds.length,
        selectedIds: matchingIds,
        message: `Selected ${matchingIds.length} ${color} shape(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to select shapes by color. Please try again.'
      };
    }
  },

  /**
   * Select all shapes within a rectangular region
   * @param {number} x - Region top-left X
   * @param {number} y - Region top-left Y
   * @param {number} width - Region width
   * @param {number} height - Region height
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectShapesInRegion(x, y, width, height) {
    // Validate region parameters
    const posValidation = validatePosition(x, y);
    if (!posValidation.valid) {
      return { 
        success: false, 
        error: 'INVALID_POSITION', 
        userMessage: posValidation.error 
      };
    }

    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      return {
        success: false,
        error: 'INVALID_SIZE',
        userMessage: 'Region width and height must be positive numbers'
      };
    }

    try {
      // Get all shapes from Firestore
      const shapes = await getAllShapes();
      
      // Filter shapes that intersect with region
      const matchingShapes = shapes.filter(s => isShapeInRegion(s, x, y, width, height));
      const matchingIds = matchingShapes.map(s => s.id);
      
      // Update selection via bridge
      updateSelection(matchingIds);
      
      return {
        success: true,
        selectedCount: matchingIds.length,
        selectedIds: matchingIds,
        message: `Selected ${matchingIds.length} shape(s) in region`
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to select shapes in region. Please try again.'
      };
    }
  },

  /**
   * Select specific shapes by their IDs
   * @param {string[]} shapeIds - Array of shape IDs to select
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectShapes(shapeIds) {
    // Validate input
    if (!Array.isArray(shapeIds)) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        userMessage: 'Shape IDs must be provided as an array'
      };
    }

    if (shapeIds.length === 0) {
      return {
        success: false,
        error: 'EMPTY_SELECTION',
        userMessage: 'No shape IDs provided'
      };
    }

    try {
      // Get all shapes to verify IDs exist
      const shapes = await getAllShapes();
      const existingIds = shapes.map(s => s.id);
      
      // Filter to only include IDs that actually exist
      const validIds = shapeIds.filter(id => existingIds.includes(id));
      
      // Update selection via bridge
      updateSelection(validIds);
      
      const skippedCount = shapeIds.length - validIds.length;
      
      return {
        success: true,
        selectedCount: validIds.length,
        selectedIds: validIds,
        message: skippedCount > 0
          ? `Selected ${validIds.length} shape(s), ${skippedCount} not found`
          : `Selected ${validIds.length} shape(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to select shapes. Please try again.'
      };
    }
  },

  /**
   * Clear all selections
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deselectAll() {
    try {
      // Clear selection via bridge
      updateSelection([]);
      
      return {
        success: true,
        message: 'Selection cleared'
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to clear selection. Please try again.'
      };
    }
  },

  /**
   * ===== LAYOUT COMMANDS (PR #22) =====
   */

  /**
   * Arrange shapes in horizontal row
   */
  arrangeHorizontal,

  /**
   * Arrange shapes in vertical column
   */
  arrangeVertical,

  /**
   * Arrange shapes in grid pattern
   */
  arrangeGrid,

  /**
   * Distribute shapes evenly along an axis
   */
  distributeEvenly,

  /**
   * Center single shape on canvas
   */
  centerShape,

  /**
   * Center group of shapes on canvas
   */
  centerShapes,

  /**
   * ===== VISUAL ALIGNMENT TOOLS (PR #25) =====
   * For Properties Panel alignment buttons
   */

  /**
   * Align shapes to the left edge of the leftmost shape
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignLeft(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Find leftmost X
      const leftmostX = Math.min(...selectedShapes.map(s => {
        const bounds = getShapeBounds(s);
        return bounds.x;
      }));

      // Update all shapes to align left
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const shapeRef = doc(db, 'shapes', shape.id);
        const bounds = getShapeBounds(shape);
        const newX = leftmostX + (shape.x - bounds.x); // Maintain offset for rotated shapes
        batch.update(shapeRef, { x: newX, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) left` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Align shapes to horizontal center
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignCenterHorizontal(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Calculate center of bounding box of all selected shapes
      const allBounds = selectedShapes.map(s => getShapeBounds(s));
      const minX = Math.min(...allBounds.map(b => b.x));
      const maxX = Math.max(...allBounds.map(b => b.x + b.width));
      const centerX = (minX + maxX) / 2;

      // Update all shapes to align to this center
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const bounds = getShapeBounds(shape);
        const shapeCenterOffset = bounds.width / 2;
        const newX = centerX - shapeCenterOffset + (shape.x - bounds.x);
        const shapeRef = doc(db, 'shapes', shape.id);
        batch.update(shapeRef, { x: newX, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) center horizontal` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Align shapes to the right edge of the rightmost shape
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignRight(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Find rightmost edge
      const rightmostX = Math.max(...selectedShapes.map(s => {
        const bounds = getShapeBounds(s);
        return bounds.x + bounds.width;
      }));

      // Update all shapes to align right
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const bounds = getShapeBounds(shape);
        const newX = rightmostX - bounds.width + (shape.x - bounds.x);
        const shapeRef = doc(db, 'shapes', shape.id);
        batch.update(shapeRef, { x: newX, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) right` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Align shapes to the top edge of the topmost shape
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignTop(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Find topmost Y
      const topmostY = Math.min(...selectedShapes.map(s => {
        const bounds = getShapeBounds(s);
        return bounds.y;
      }));

      // Update all shapes to align top
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const bounds = getShapeBounds(shape);
        const newY = topmostY + (shape.y - bounds.y);
        const shapeRef = doc(db, 'shapes', shape.id);
        batch.update(shapeRef, { y: newY, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) top` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Align shapes to vertical middle
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignMiddleVertical(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Calculate vertical center of bounding box
      const allBounds = selectedShapes.map(s => getShapeBounds(s));
      const minY = Math.min(...allBounds.map(b => b.y));
      const maxY = Math.max(...allBounds.map(b => b.y + b.height));
      const centerY = (minY + maxY) / 2;

      // Update all shapes to align to this center
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const bounds = getShapeBounds(shape);
        const shapeCenterOffset = bounds.height / 2;
        const newY = centerY - shapeCenterOffset + (shape.y - bounds.y);
        const shapeRef = doc(db, 'shapes', shape.id);
        batch.update(shapeRef, { y: newY, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) middle vertical` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Align shapes to the bottom edge of the bottommost shape
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async alignBottom(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      const shapes = await getAllShapes();
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      
      if (selectedShapes.length === 0) {
        return { success: false, message: 'No valid shapes found' };
      }

      // Find bottommost edge
      const bottommostY = Math.max(...selectedShapes.map(s => {
        const bounds = getShapeBounds(s);
        return bounds.y + bounds.height;
      }));

      // Update all shapes to align bottom
      const batch = writeBatch(db);
      for (const shape of selectedShapes) {
        const bounds = getShapeBounds(shape);
        const newY = bottommostY - bounds.height + (shape.y - bounds.y);
        const shapeRef = doc(db, 'shapes', shape.id);
        batch.update(shapeRef, { y: newY, updatedAt: serverTimestamp() });
      }
      await batch.commit();

      return { success: true, message: `Aligned ${selectedShapes.length} shape(s) bottom` };
    } catch (error) {
      return { success: false, message: 'Failed to align shapes' };
    }
  },

  /**
   * Distribute shapes evenly horizontally (visual alignment version)
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async distributeHorizontally(shapeIds) {
    if (!shapeIds || shapeIds.length < 3) {
      return { success: false, message: 'Need at least 3 shapes to distribute' };
    }

    try {
      // Reuse existing distributeEvenly with 'horizontal' direction
      return await this.distributeEvenly(shapeIds, 'horizontal');
    } catch (error) {
      return { success: false, message: 'Failed to distribute shapes' };
    }
  },

  /**
   * Distribute shapes evenly vertically (visual alignment version)
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async distributeVertically(shapeIds) {
    if (!shapeIds || shapeIds.length < 3) {
      return { success: false, message: 'Need at least 3 shapes to distribute' };
    }

    try {
      // Reuse existing distributeEvenly with 'vertical' direction
      return await this.distributeEvenly(shapeIds, 'vertical');
    } catch (error) {
      return { success: false, message: 'Failed to distribute shapes' };
    }
  },

  /**
   * Center shapes on canvas (visual alignment version)
   * @param {string[]} shapeIds - Array of shape IDs
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async centerOnCanvas(shapeIds) {
    if (!shapeIds || shapeIds.length === 0) {
      return { success: false, message: 'No shapes provided' };
    }

    try {
      if (shapeIds.length === 1) {
        // Single shape - use centerShape
        return await this.centerShape(shapeIds[0]);
      } else {
        // Multiple shapes - use centerShapes
        return await this.centerShapes(shapeIds);
      }
    } catch (error) {
      return { success: false, message: 'Failed to center shapes' };
    }
  },

  /**
   * ===== COMPLEX OPERATIONS (PR #23) =====
   */

  /**
   * Create a login form with username, password, and submit button
   */
  createLoginForm,

  /**
   * Create a horizontal navigation bar with menu items
   */
  createNavigationBar,

  /**
   * Create a card layout with title, image placeholder, and description
   */
  createCardLayout,

  /**
   * Create a button group arranged horizontally or vertically
   */
  createButtonGroup,

  /**
   * Create a complete landing page with navigation, hero, email signup, features, and footer
   */
  createLandingPage
};
