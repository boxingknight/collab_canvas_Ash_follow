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

  // ===== BATCH/PATTERN GENERATION FUNCTIONS =====
  {
    name: 'generateShapes',
    description: 'Generate many shapes programmatically (up to 1000) using patterns. USE THIS for large quantities like "100 circles", "500 random shapes", "grid of 1000". Much more efficient than createShapesBatch for quantities > 10. Supports patterns: random, grid, row, column, circle-pattern, spiral.',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of shapes to generate (1-1000). For "100 circles" use count: 100'
        },
        type: {
          type: 'string',
          description: 'Shape type: "rectangle" or "circle"',
          enum: ['rectangle', 'circle']
        },
        pattern: {
          type: 'string',
          description: 'Layout pattern: "random" (scattered), "grid" (rows/columns), "row" (horizontal line), "column" (vertical line), "circle-pattern" (arranged in circle), "spiral"',
          enum: ['random', 'grid', 'row', 'column', 'circle-pattern', 'spiral']
        },
        startX: {
          type: 'number',
          description: 'Starting X coordinate (default 500)'
        },
        startY: {
          type: 'number',
          description: 'Starting Y coordinate (default 500)'
        },
        width: {
          type: 'number',
          description: 'Width for rectangles (default 100)'
        },
        height: {
          type: 'number',
          description: 'Height for rectangles (default 100)'
        },
        radius: {
          type: 'number',
          description: 'Radius for circles (default 50)'
        },
        color: {
          type: 'string',
          description: 'Hex color (default "#3b82f6")'
        },
        spacing: {
          type: 'number',
          description: 'Spacing between shapes for grid/row/column patterns (default 150)'
        },
        columns: {
          type: 'number',
          description: 'Number of columns for grid pattern (default 10)'
        }
      },
      required: ['count']
    }
  },
  {
    name: 'createShapesBatch',
    description: 'Creates multiple specific shapes at once (for small quantities < 10 with custom positions). Use generateShapes for large quantities instead.',
    parameters: {
      type: 'object',
      properties: {
        shapes: {
          type: 'array',
          description: 'Array of shape definitions to create',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'Shape type: "rectangle", "circle", "line", or "text"',
                enum: ['rectangle', 'circle', 'line', 'text']
              },
              x: {
                type: 'number',
                description: 'X coordinate (0-5000). For circle, this is center. For others, top-left.'
              },
              y: {
                type: 'number',
                description: 'Y coordinate (0-5000). For circle, this is center. For others, top-left.'
              },
              width: {
                type: 'number',
                description: 'Width (for rectangles, default 200)'
              },
              height: {
                type: 'number',
                description: 'Height (for rectangles, default 150)'
              },
              radius: {
                type: 'number',
                description: 'Radius (for circles, default 75)'
              },
              endX: {
                type: 'number',
                description: 'End X coordinate (for lines)'
              },
              endY: {
                type: 'number',
                description: 'End Y coordinate (for lines)'
              },
              x1: {
                type: 'number',
                description: 'Start X (alternative for lines)'
              },
              y1: {
                type: 'number',
                description: 'Start Y (alternative for lines)'
              },
              x2: {
                type: 'number',
                description: 'End X (alternative for lines)'
              },
              y2: {
                type: 'number',
                description: 'End Y (alternative for lines)'
              },
              strokeWidth: {
                type: 'number',
                description: 'Stroke width (for lines, default 2)'
              },
              text: {
                type: 'string',
                description: 'Text content (for text shapes)'
              },
              fontSize: {
                type: 'number',
                description: 'Font size (for text, default 16)'
              },
              fontWeight: {
                type: 'string',
                description: 'Font weight (for text: "normal" or "bold")'
              },
              color: {
                type: 'string',
                description: 'Hex color code (e.g., "#FF0000"). Default varies by shape.'
              }
            },
            required: ['type', 'x', 'y']
          }
        }
      },
      required: ['shapes']
    }
  },

  // ===== MANIPULATION FUNCTIONS =====
  {
    name: 'moveShape',
    description: 'Moves an existing shape to a new position. If no shapeId is provided, uses the currently selected shape. User should select a shape first. Supports both absolute and relative positioning.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of the shape to move. Omit this to use the currently selected shape.'
        },
        x: {
          type: 'number',
          description: 'X coordinate or X offset. If relative=true, this is added to current X. If relative=false, this is the new absolute X. Can be null to keep current X.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate or Y offset. If relative=true, this is added to current Y. If relative=false, this is the new absolute Y. Can be null to keep current Y.'
        },
        relative: {
          type: 'boolean',
          description: 'If true, x and y are offsets added to current position (e.g., "move up 50" = y:-50, relative:true). If false, x and y are absolute coordinates. Default: true for phrases like "move up/down/left/right", false for "move to X, Y".'
        }
      },
      required: []
    }
  },
  {
    name: 'resizeShape',
    description: 'Resizes an existing shape to new dimensions. If no shapeId is provided, uses the currently selected shape. User should select a shape first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of the shape to resize. Omit this to use the currently selected shape.'
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
      required: ['width', 'height']
    }
  },
  {
    name: 'rotateShape',
    description: 'Rotates an existing shape. If no shapeId is provided, uses the currently selected shape. IMPORTANT: Use relative=true for "rotate BY X degrees" (adds to current rotation) and relative=false for "rotate TO X degrees" (sets absolute rotation). User should select a shape first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of the shape to rotate. Omit this to use the currently selected shape.'
        },
        degrees: {
          type: 'number',
          description: 'Rotation amount in degrees. Meaning depends on relative parameter.'
        },
        relative: {
          type: 'boolean',
          description: 'If true, ADDS degrees to current rotation (e.g., "rotate BY 45 degrees"). If false, SETS to absolute angle (e.g., "rotate TO 45 degrees"). Default: false.'
        }
      },
      required: ['degrees']
    }
  },
  {
    name: 'changeShapeColor',
    description: 'Changes the color of an existing shape. If no shapeId is provided, uses the currently selected shape. User should select a shape first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of the shape to recolor. Omit this to use the currently selected shape.'
        },
        color: {
          type: 'string',
          description: 'New hex color code including # (e.g., "#FF00FF")'
        }
      },
      required: ['color']
    }
  },
  {
    name: 'deleteShape',
    description: 'Deletes an existing shape from the canvas. If no shapeId is provided, uses the currently selected shape. User should select a shape first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of the shape to delete. Omit this to use the currently selected shape.'
        }
      },
      required: []
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
  'createShapesBatch': canvasAPI.createShapesBatch,
  'generateShapes': canvasAPI.generateShapes,

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
    
    // Call function with named parameters
    // Each function will extract what it needs from the parameters object
    let result;
    
    switch (functionName) {
      // Creation functions
      case 'createRectangle':
        result = await functionRegistry[functionName](
          parameters.x,
          parameters.y,
          parameters.width,
          parameters.height,
          parameters.color,
          parameters.userId
        );
        break;
      
      case 'createCircle':
        result = await functionRegistry[functionName](
          parameters.x,
          parameters.y,
          parameters.radius,
          parameters.color,
          parameters.userId
        );
        break;
      
      case 'createLine':
        result = await functionRegistry[functionName](
          parameters.x1,
          parameters.y1,
          parameters.x2,
          parameters.y2,
          parameters.strokeWidth,
          parameters.color,
          parameters.userId
        );
        break;
      
      case 'createText':
        result = await functionRegistry[functionName](
          parameters.text,
          parameters.x,
          parameters.y,
          parameters.fontSize,
          parameters.fontWeight,
          parameters.color,
          parameters.userId
        );
        break;
      
      case 'createShapesBatch':
        result = await functionRegistry[functionName](
          parameters.shapes,
          parameters.userId
        );
        break;
      
      case 'generateShapes':
        result = await functionRegistry[functionName](
          parameters,
          parameters.userId
        );
        break;
      
      // Manipulation functions
      case 'moveShape':
        result = await functionRegistry[functionName](
          parameters.shapeId,
          parameters.x,
          parameters.y,
          parameters.relative !== undefined ? parameters.relative : true  // Default to relative
        );
        break;
      
      case 'resizeShape':
        result = await functionRegistry[functionName](
          parameters.shapeId,
          parameters.width,
          parameters.height
        );
        break;
      
      case 'rotateShape':
        result = await functionRegistry[functionName](
          parameters.shapeId,
          parameters.degrees,
          parameters.relative || false
        );
        break;
      
      case 'changeShapeColor':
        result = await functionRegistry[functionName](
          parameters.shapeId,
          parameters.color
        );
        break;
      
      case 'deleteShape':
        result = await functionRegistry[functionName](
          parameters.shapeId
        );
        break;
      
      // Query functions
      case 'getCanvasState':
      case 'getSelectedShapes':
      case 'getCanvasCenter':
        result = await functionRegistry[functionName]();
        break;
      
      default:
        return {
          success: false,
          error: 'UNKNOWN_FUNCTION',
          userMessage: `Function ${functionName} is not properly configured.`
        };
    }
    
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

