// src/services/canvasAPI.js
import { addShape, updateShape, deleteShape, getAllShapes } from './shapes';
import { CANVAS_CONFIG } from '../utils/constants';

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
 * Canvas API - Unified interface for all canvas operations
 * Used by both manual interactions and AI agent
 */
export const canvasAPI = {
  /**
   * Create a rectangle
   */
  async createRectangle(x, y, width, height, color, userId = 'ai-agent') {
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
  async createCircle(x, y, radius, color, userId = 'ai-agent') {
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
  async createLine(x1, y1, x2, y2, strokeWidth, color, userId = 'ai-agent') {
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
  async createText(text, x, y, fontSize = 16, fontWeight = 'normal', color = '#000000', userId = 'ai-agent') {
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
   * Move a shape
   */
  async moveShape(shapeId, x, y) {
    const posValidation = validatePosition(x, y);
    if (!posValidation.valid) {
      return { success: false, error: 'INVALID_POSITION', userMessage: posValidation.error };
    }

    try {
      await updateShape(shapeId, { x, y });
      return { success: true, result: { shapeId, x, y } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to move shape. Please try again.'
      };
    }
  },

  /**
   * Resize a shape
   */
  async resizeShape(shapeId, width, height) {
    const sizeValidation = validateSize(width, height);
    if (!sizeValidation.valid) {
      return { success: false, error: 'INVALID_SIZE', userMessage: sizeValidation.error };
    }

    try {
      await updateShape(shapeId, { width, height });
      return { success: true, result: { shapeId, width, height } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to resize shape. Please try again.'
      };
    }
  },

  /**
   * Rotate a shape
   */
  async rotateShape(shapeId, degrees) {
    if (typeof degrees !== 'number') {
      return { success: false, error: 'INVALID_ROTATION', userMessage: 'Rotation must be a number' };
    }

    // Normalize to 0-359
    const normalizedRotation = ((degrees % 360) + 360) % 360;

    try {
      await updateShape(shapeId, { rotation: normalizedRotation });
      return { success: true, result: { shapeId, rotation: normalizedRotation } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to rotate shape. Please try again.'
      };
    }
  },

  /**
   * Change shape color
   */
  async changeShapeColor(shapeId, color) {
    const colorValidation = validateColor(color);
    if (!colorValidation.valid) {
      return { success: false, error: 'INVALID_COLOR', userMessage: colorValidation.error };
    }

    try {
      await updateShape(shapeId, { color });
      return { success: true, result: { shapeId, color } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to change color. Please try again.'
      };
    }
  },

  /**
   * Delete a shape
   */
  async deleteShape(shapeId) {
    if (!shapeId || typeof shapeId !== 'string') {
      return { success: false, error: 'INVALID_SHAPE_ID', userMessage: 'Invalid shape ID' };
    }

    try {
      await deleteShape(shapeId);
      return { success: true, result: { shapeId } };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        userMessage: 'Failed to delete shape. Please try again.'
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
   * Note: This will need to be connected to selection state in PR #21
   */
  async getSelectedShapes() {
    // TODO: Connect to useSelection hook in PR #21
    return {
      success: true,
      result: [],
      note: 'Selection query will be implemented in PR #21'
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
  }
};

