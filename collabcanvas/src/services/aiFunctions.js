// src/services/aiFunctions.js
import { canvasAPI } from './canvasAPI';

/**
 * Function schemas for OpenAI function calling
 * These tell the AI what functions are available and how to use them
 */
export const functionSchemas = [
  // ===== CREATION FUNCTIONS =====
  {
    name: 'createRectangle',
    description: 'Creates a rectangle shape on the canvas with specified position, size, and color',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of top-left corner in pixels (0-5000). Canvas center is at 2500.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of top-left corner in pixels (0-5000). Canvas center is at 2500.'
        },
        width: {
          type: 'number',
          description: 'Width in pixels (minimum 10, recommended 100-300)'
        },
        height: {
          type: 'number',
          description: 'Height in pixels (minimum 10, recommended 75-200)'
        },
        color: {
          type: 'string',
          description: 'Hex color code including # (e.g., "#FF0000" for red, "#0066FF" for blue)'
        }
      },
      required: ['x', 'y', 'width', 'height', 'color']
    }
  },
  {
    name: 'createCircle',
    description: 'Creates a circle shape on the canvas with specified center position, radius, and color',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of circle CENTER in pixels (0-5000). Canvas center is at 2500.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of circle CENTER in pixels (0-5000). Canvas center is at 2500.'
        },
        radius: {
          type: 'number',
          description: 'Radius in pixels (minimum 5, recommended 50-100)'
        },
        color: {
          type: 'string',
          description: 'Hex color code including # (e.g., "#00FF00" for green)'
        }
      },
      required: ['x', 'y', 'radius', 'color']
    }
  },
  {
    name: 'createLine',
    description: 'Creates a line from start point to end point with specified stroke width and color',
    parameters: {
      type: 'object',
      properties: {
        x1: {
          type: 'number',
          description: 'X coordinate of line start point (0-5000)'
        },
        y1: {
          type: 'number',
          description: 'Y coordinate of line start point (0-5000)'
        },
        x2: {
          type: 'number',
          description: 'X coordinate of line end point (0-5000)'
        },
        y2: {
          type: 'number',
          description: 'Y coordinate of line end point (0-5000)'
        },
        strokeWidth: {
          type: 'number',
          description: 'Line thickness in pixels (1-50, recommended 2-5)'
        },
        color: {
          type: 'string',
          description: 'Hex color code including # (e.g., "#000000" for black)'
        }
      },
      required: ['x1', 'y1', 'x2', 'y2', 'strokeWidth', 'color']
    }
  },
  {
    name: 'createText',
    description: 'Creates a text layer on the canvas with specified content, position, and formatting',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content to display'
        },
        x: {
          type: 'number',
          description: 'X coordinate of text top-left (0-5000)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of text top-left (0-5000)'
        },
        fontSize: {
          type: 'number',
          description: 'Font size in pixels (8-200, default 16, recommended 14-48)'
        },
        fontWeight: {
          type: 'string',
          description: 'Font weight: "normal" or "bold" (default "normal")',
          enum: ['normal', 'bold']
        },
        color: {
          type: 'string',
          description: 'Text color as hex code (default "#000000")'
        }
      },
      required: ['text', 'x', 'y']
    }
  },

  // ===== MANIPULATION FUNCTIONS =====
  {
    name: 'moveShape',
    description: 'Moves an existing shape to a new position',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'The ID of the shape to move'
        },
        x: {
          type: 'number',
          description: 'New X coordinate (0-5000)'
        },
        y: {
          type: 'number',
          description: 'New Y coordinate (0-5000)'
        }
      },
      required: ['shapeId', 'x', 'y']
    }
  },
  {
    name: 'resizeShape',
    description: 'Resizes an existing shape to new dimensions',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'The ID of the shape to resize'
        },
        width: {
          type: 'number',
          description: 'New width in pixels (minimum 10)'
        },
        height: {
          type: 'number',
          description: 'New height in pixels (minimum 10)'
        }
      },
      required: ['shapeId', 'width', 'height']
    }
  },
  {
    name: 'rotateShape',
    description: 'Rotates an existing shape to a specified angle',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'The ID of the shape to rotate'
        },
        degrees: {
          type: 'number',
          description: 'Rotation angle in degrees (0-359, 0 is horizontal)'
        }
      },
      required: ['shapeId', 'degrees']
    }
  },
  {
    name: 'changeShapeColor',
    description: 'Changes the color of an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'The ID of the shape to recolor'
        },
        color: {
          type: 'string',
          description: 'New hex color code including # (e.g., "#FF00FF")'
        }
      },
      required: ['shapeId', 'color']
    }
  },
  {
    name: 'deleteShape',
    description: 'Deletes an existing shape from the canvas',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'The ID of the shape to delete'
        }
      },
      required: ['shapeId']
    }
  },

  // ===== QUERY FUNCTIONS =====
  {
    name: 'getCanvasState',
    description: 'Gets all shapes currently on the canvas. Use this to see what exists before making changes.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getSelectedShapes',
    description: 'Gets the currently selected shapes. Useful for operations on selected items.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getCanvasCenter',
    description: 'Gets the coordinates of the canvas center. Useful when user says "center" or "middle".',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

/**
 * Function registry - Maps function names to implementations
 */
export const functionRegistry = {
  // Creation
  'createRectangle': canvasAPI.createRectangle,
  'createCircle': canvasAPI.createCircle,
  'createLine': canvasAPI.createLine,
  'createText': canvasAPI.createText,

  // Manipulation
  'moveShape': canvasAPI.moveShape,
  'resizeShape': canvasAPI.resizeShape,
  'rotateShape': canvasAPI.rotateShape,
  'changeShapeColor': canvasAPI.changeShapeColor,
  'deleteShape': canvasAPI.deleteShape,

  // Queries
  'getCanvasState': canvasAPI.getCanvasState,
  'getSelectedShapes': canvasAPI.getSelectedShapes,
  'getCanvasCenter': canvasAPI.getCanvasCenter
};

/**
 * Execute an AI function call
 * @param {string} functionName - Name of function to execute
 * @param {Object} parameters - Function parameters
 * @returns {Promise<Object>} Result with success status
 */
export async function executeAIFunction(functionName, parameters) {
  // Validate function exists
  if (!functionRegistry[functionName]) {
    return {
      success: false,
      error: 'UNKNOWN_FUNCTION',
      userMessage: `I don't know how to ${functionName}. Try a different command.`
    };
  }

  // Execute function
  try {
    console.log(`[AI] Executing ${functionName} with params:`, parameters);
    const result = await functionRegistry[functionName](...Object.values(parameters));
    console.log(`[AI] ${functionName} result:`, result);
    return result;
  } catch (error) {
    console.error(`[AI] Error executing ${functionName}:`, error);
    return {
      success: false,
      error: error.message,
      userMessage: 'Operation failed. Please try again.'
    };
  }
}

