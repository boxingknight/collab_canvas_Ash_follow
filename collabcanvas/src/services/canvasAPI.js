// src/services/canvasAPI.js
import { addShape, updateShape, deleteShape as deleteShapeFromDB, getAllShapes } from './shapes';
import { CANVAS_CONFIG } from '../utils/constants';
import { getCurrentUser } from './auth';
import { getCurrentSelection, getFirstSelectedId, updateSelection } from './selectionBridge';

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
  const validTypes = ['rectangle', 'circle', 'line', 'text'];
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Get bounding box for any shape type
 * Handles rectangles, circles, lines, and text
 * @param {Object} shape - Shape object with type and position data
 * @returns {Object} Bounding box with left, right, top, bottom
 */
function getShapeBounds(shape) {
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        left: shape.x,
        right: shape.x + shape.width,
        top: shape.y,
        bottom: shape.y + shape.height
      };
    
    case 'circle':
      // Circles store center as x, y but in storage they use top-left
      // So we need to handle both cases
      const radius = shape.width / 2; // width is diameter
      return {
        left: shape.x,
        right: shape.x + shape.width,
        top: shape.y,
        bottom: shape.y + shape.height
      };
    
    case 'line':
      const minX = Math.min(shape.x, shape.endX);
      const maxX = Math.max(shape.x, shape.endX);
      const minY = Math.min(shape.y, shape.endY);
      const maxY = Math.max(shape.y, shape.endY);
      return {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY
      };
    
    default:
      return { left: 0, right: 0, top: 0, bottom: 0 };
  }
}

/**
 * Check if shape overlaps with region (AABB intersection)
 * Note: Uses axis-aligned bounding box, which may include rotated shapes
 * that visually appear outside the region. This is acceptable for MVP.
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
  const shapeBounds = getShapeBounds(shape);
  
  // AABB intersection test (any overlap counts)
  return !(
    shapeBounds.right < x ||
    shapeBounds.left > regionRight ||
    shapeBounds.bottom < y ||
    shapeBounds.top > regionBottom
  );
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
   * Select all shapes of a specific type
   * @param {string} type - 'rectangle', 'circle', 'line', or 'text'
   * @returns {Promise<{success: boolean, selectedCount: number, selectedIds: array, message: string}>}
   */
  async selectShapesByType(type) {
    // Validate type parameter
    const typeValidation = validateShapeType(type);
    if (!typeValidation.valid) {
      return { 
        success: false, 
        error: 'INVALID_TYPE', 
        userMessage: typeValidation.error 
      };
    }

    try {
      // Get all shapes from Firestore
      const shapes = await getAllShapes();
      
      // Filter by type
      const matchingShapes = shapes.filter(s => s.type === type);
      const matchingIds = matchingShapes.map(s => s.id);
      
      // Update selection via bridge
      updateSelection(matchingIds);
      
      return {
        success: true,
        selectedCount: matchingIds.length,
        selectedIds: matchingIds,
        message: `Selected ${matchingIds.length} ${type}(s)`
      };
    } catch (error) {
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
  }
};

