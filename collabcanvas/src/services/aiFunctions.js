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
    description: 'Moves shape(s) to a new position. If shapeId is OMITTED, moves ALL currently selected shapes (multi-select support). If shapeId is PROVIDED, moves only that specific shape. User should select shape(s) first. Supports both absolute and relative positioning.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of a specific shape to move. OMIT THIS ENTIRELY to move ALL currently selected shapes. Only provide this when targeting a single specific shape.'
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
    description: 'Resizes shape(s) to new dimensions. If shapeId is OMITTED, resizes ALL currently selected shapes (multi-select support). If shapeId is PROVIDED, resizes only that specific shape. User should select shape(s) first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of a specific shape to resize. OMIT THIS ENTIRELY to resize ALL currently selected shapes. Only provide this when targeting a single specific shape.'
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
    description: 'Rotates shape(s). If shapeId is OMITTED, rotates ALL currently selected shapes (multi-select support). If shapeId is PROVIDED, rotates only that specific shape. IMPORTANT: Use relative=true for "rotate BY X degrees" (adds to current rotation) and relative=false for "rotate TO X degrees" (sets absolute rotation). User should select shape(s) first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of a specific shape to rotate. OMIT THIS ENTIRELY to rotate ALL currently selected shapes. Only provide this when targeting a single specific shape.'
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
    description: 'Changes the color of shape(s). If shapeId is OMITTED, changes color of ALL currently selected shapes (multi-select support). If shapeId is PROVIDED, changes color of only that specific shape. User should select shape(s) first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of a specific shape to recolor. OMIT THIS ENTIRELY to change color of ALL currently selected shapes. Only provide this when targeting a single specific shape.'
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
    description: 'Deletes shape(s) from the canvas. If shapeId is OMITTED, deletes ALL currently selected shapes (multi-select support). If shapeId is PROVIDED, deletes only that specific shape. User should select shape(s) first.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'OPTIONAL: The ID of a specific shape to delete. OMIT THIS ENTIRELY to delete ALL currently selected shapes. Only provide this when targeting a single specific shape.'
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
    description: 'Gets currently selected shapes. Returns: {success: true, result: [{id: "abc", ...}, {id: "def", ...}], count: 2}. NOTE: Layout commands (arrangeHorizontal, arrangeVertical, etc.) automatically use selection when shapeIds is empty [], so you rarely need to call this explicitly.',
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
  },

  // ===== SELECTION FUNCTIONS =====
  {
    name: 'selectAllShapes',
    description: 'Selects ALL shapes on the canvas, regardless of type. Use this for "select all shapes", "select everything", "select all".',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'selectShapesByType',
    description: 'Selects all shapes of a specific type on the canvas. Use this for "select all rectangles", "select all circles", etc. Accepts both singular and plural forms.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The type of shapes to select: rectangle/rectangles, circle/circles, line/lines, text/texts (singular or plural both work)'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'selectShapesByColor',
    description: 'Selects all shapes with a specific color. Use this for "select all red shapes", "select all blue circles" (combine with type filtering if needed).',
    parameters: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'Hex color code including # (e.g., "#FF0000" for red, "#0000FF" for blue)'
        }
      },
      required: ['color']
    }
  },
  {
    name: 'selectShapesInRegion',
    description: 'Selects all shapes within a rectangular region on the canvas. Useful for "select shapes in top-left", "select everything in the center", etc.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of region top-left corner (0-5000)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of region top-left corner (0-5000)'
        },
        width: {
          type: 'number',
          description: 'Width of selection region in pixels'
        },
        height: {
          type: 'number',
          description: 'Height of selection region in pixels'
        }
      },
      required: ['x', 'y', 'width', 'height']
    }
  },
  {
    name: 'selectShapes',
    description: 'Selects specific shapes by their IDs. Use this when you have shape IDs from getCanvasState() and want to select specific ones.',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to select'
        }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'deselectAll',
    description: 'Clears all shape selections. Use for "clear selection", "deselect all", "unselect everything".',
    parameters: {
      type: 'object',
      properties: {}
    }
  },

  // ===== LAYOUT COMMANDS (PR #22) =====
  {
    name: 'arrangeHorizontal',
    description: 'Arranges shapes in a horizontal row with specified spacing. Shapes are aligned by their vertical centers. Works with rotated shapes (uses bounding boxes). TIP: Pass empty array [] for shapeIds to automatically use currently selected shapes!',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange. Use empty array [] to auto-use current selection (recommended for "arrange these" commands).'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in pixels. Default is 20. Use 10-50 for compact layouts, 50-100 for loose layouts.'
        }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'arrangeVertical',
    description: 'Arranges shapes in a vertical column with specified spacing. Shapes are aligned by their horizontal centers. Works with rotated shapes (uses bounding boxes). TIP: Pass empty array [] for shapeIds to automatically use currently selected shapes!',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange. Use empty array [] to auto-use current selection (recommended for "arrange these" commands).'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in pixels. Default is 20. Use 10-50 for compact layouts, 50-100 for loose layouts.'
        }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'arrangeGrid',
    description: 'Arranges shapes in a grid pattern (rows × columns) with specified spacing. Shapes are centered in cells. Validates that grid fits on canvas (5000x5000). TIP: Pass empty array [] for shapeIds to automatically use currently selected shapes!',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange in grid. Use empty array [] to auto-use current selection (recommended). Number of shapes must be ≤ rows × cols.'
        },
        rows: {
          type: 'number',
          description: 'Number of rows in grid. Must be positive integer. For 9 shapes, try 3x3.'
        },
        cols: {
          type: 'number',
          description: 'Number of columns in grid. Must be positive integer. For 12 shapes, try 3x4 or 4x3.'
        },
        spacingX: {
          type: 'number',
          description: 'Horizontal spacing between cells in pixels. Default is 20. Use 20-50 for most layouts.'
        },
        spacingY: {
          type: 'number',
          description: 'Vertical spacing between cells in pixels. Default is 20. Use 20-50 for most layouts.'
        }
      },
      required: ['shapeIds', 'rows', 'cols']
    }
  },
  {
    name: 'distributeEvenly',
    description: 'Distributes shapes evenly along horizontal or vertical axis. First and last shapes stay fixed, intermediate shapes are spaced evenly between them. Uses precision-safe calculation. TIP: Pass empty array [] for shapeIds to automatically use currently selected shapes!',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to distribute. Use empty array [] to auto-use current selection (recommended). Minimum 2 shapes required (preferably 3+ for visible effect).'
        },
        direction: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Direction to distribute: "horizontal" spaces shapes left-to-right, "vertical" spaces shapes top-to-bottom. Default is "horizontal".'
        }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'centerShape',
    description: 'Centers a single shape at the canvas center (2500, 2500). Works with all shape types including rotated shapes.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of shape to center on canvas. Can be rectangle, circle, line, or text.'
        }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'centerShapes',
    description: 'Centers a group of shapes at the canvas center while preserving their relative positions (moves as a unit). Useful for centering layouts. TIP: Pass empty array [] for shapeIds to automatically use currently selected shapes!',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to center as a group. Use empty array [] to auto-use current selection (recommended). Relative positions between shapes are preserved.'
        }
      },
      required: ['shapeIds']
    }
  },

  // ===== COMPLEX OPERATIONS (PR #23) =====
  {
    name: 'createLoginForm',
    description: `Creates a complete login form UI with title header, background container, username field, password field, and submit button. Creates 9 shapes (or 11 with Remember Me option) professionally laid out with proper spacing and alignment.

DEFAULT BEHAVIOR: If no position is specified, creates at canvas center (2500, 2500).

Position extraction:
- "create a login form" → x: 2500, y: 2500 (DEFAULT CENTER)
- "create a signup form" → x: 2500, y: 2500 (DEFAULT CENTER)
- "at the center" → x: 2500, y: 2500
- "at the top" → x: 2500, y: 100  
- "at 1000, 1000" → x: 1000, y: 1000

Examples:
- "Create a login form" → Use defaults: x: 2500, y: 2500
- "Create a signup form" → Use defaults: x: 2500, y: 2500, options: {buttonText: "Sign Up"}
- "Add a login form at 500, 500" → x: 500, y: 500
- "Make a login form with remember me" → x: 2500, y: 2500, options: {includeRememberMe: true}`,
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified. Canvas center is 2500.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified. Canvas center is 2500.'
        },
        options: {
          type: 'object',
          properties: {
            includeRememberMe: {
              type: 'boolean',
              description: 'If true, adds a "Remember Me" checkbox. Default: false. Use when user mentions "remember me" or "keep me logged in".'
            },
            buttonText: {
              type: 'string',
              description: 'Text for the submit button. Default: "Login". Can be "Sign In", "Sign Up", "Submit", etc. Match user\'s terminology. Max 15 characters.'
            },
            theme: {
              type: 'string',
              enum: ['default', 'dark'],
              description: 'Color theme. Use "dark" if user mentions dark theme/mode. Default: "default".'
            }
          }
        }
      },
      required: []
    }
  },

  // Navigation Bar
  {
    name: 'createNavigationBar',
    description: `Creates a horizontal navigation bar with multiple menu items. Creates 1 background bar + n text items.

DEFAULT BEHAVIOR: If no position is specified, creates at canvas top (2500, 100).

Position extraction:
- "create a navigation bar" → x: 2500, y: 100 (DEFAULT TOP CENTER)
- "create a nav bar" → x: 2500, y: 100 (DEFAULT TOP CENTER)
- "at the top" → x: 2500, y: 100
- "at 500, 500" → x: 500, y: 500

Menu item extraction:
- "with Home, About, Services, Contact" → menuItems: ["Home", "About", "Services", "Contact"]
- "with Products, Pricing, FAQ" → menuItems: ["Products", "Pricing", "FAQ"]
- Default: ["Home", "About", "Services", "Contact"] if not specified

Examples:
- "Create a navigation bar" → x: 2500, y: 100, menuItems: ["Home", "About", "Services", "Contact"]
- "Add a nav bar with Home, About, Contact" → x: 2500, y: 100, menuItems: ["Home", "About", "Contact"]
- "Make a navigation bar at 1000, 500 with Products, Pricing" → x: 1000, y: 500, menuItems: ["Products", "Pricing"]`,
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of top-left corner (0-5000). DEFAULT: 2500 (center X) if not specified.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of top-left corner (0-5000). DEFAULT: 100 (top) if not specified.'
        },
        menuItems: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array of menu item labels. DEFAULT: ["Home", "About", "Services", "Contact"]. Extract from user prompt: "Home, About, Contact" → ["Home", "About", "Contact"]. Each item should be a short string (max 20 chars).'
        },
        options: {
          type: 'object',
          properties: {
            height: {
              type: 'number',
              description: 'Nav bar height in pixels. Default: 60. Use 80-100 for larger bars.'
            },
            spacing: {
              type: 'number',
              description: 'Space between menu items in pixels. Default: 40.'
            },
            background: {
              type: 'string',
              description: 'Background color as hex code. Default: "#ffffff". Use dark colors like "#2d2d3f" for dark themes.'
            },
            textColor: {
              type: 'string',
              description: 'Text color as hex code. Default: "#1a1a1a". Use "#ffffff" for dark backgrounds.'
            },
            theme: {
              type: 'string',
              enum: ['default', 'dark'],
              description: 'Color theme. Use "dark" if user mentions dark theme/mode. Default: "default".'
            }
          }
        }
      },
      required: []
    }
  },

  // Card Layout
  {
    name: 'createCardLayout',
    description: `Creates a card-style layout with optional image placeholder, title, and description. Creates 4-5 shapes with professional spacing.

DEFAULT BEHAVIOR: If no position is specified, creates at canvas center (2500, 2500).

Position extraction:
- "create a card" → x: 2500, y: 2500 (DEFAULT CENTER)
- "add a product card" → x: 2500, y: 2500 (DEFAULT CENTER)
- "at the center" → x: 2500, y: 2500
- "at 1000, 1000" → x: 1000, y: 1000

Title/Description extraction:
- "with title 'Product'" → title: "Product"
- "called 'Feature Card'" → title: "Feature Card"
- "with description 'This is amazing'" → description: "This is amazing"
- Default title: "Card Title"
- Default description: "Card description with details"

Examples:
- "Create a card" → x: 2500, y: 2500, title: "Card Title", description: "Card description"
- "Add a product card with title 'Premium Plan'" → title: "Premium Plan"
- "Make a card without image called 'About Us' with description 'Learn about our company'" → includeImage: false
- "Create a card at 1000, 1000 with title 'Service' and description 'Our best service'" → custom position and content`,
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified.'
        },
        title: {
          type: 'string',
          description: 'Card title text. DEFAULT: "Card Title". Extract from: "with title X", "called X", etc. Max 40 chars.'
        },
        description: {
          type: 'string',
          description: 'Card description text. DEFAULT: "Card description with details". Extract from: "with description X", "about X", etc. Max 200 chars.'
        },
        options: {
          type: 'object',
          properties: {
            width: {
              type: 'number',
              description: 'Card width in pixels. Default: 300.'
            },
            height: {
              type: 'number',
              description: 'Card height in pixels. Default: 400.'
            },
            includeImage: {
              type: 'boolean',
              description: 'If true, adds an image placeholder at top. Default: true. Set false if user says "without image".'
            },
            backgroundColor: {
              type: 'string',
              description: 'Background color as hex code. Default: "#ffffff".'
            },
            theme: {
              type: 'string',
              enum: ['default', 'dark'],
              description: 'Color theme. Use "dark" if user mentions dark theme/mode. Default: "default".'
            }
          }
        }
      },
      required: []
    }
  },

  // Button Group
  {
    name: 'createButtonGroup',
    description: `Creates a group of buttons arranged horizontally or vertically. Creates n×2 shapes (n backgrounds + n labels).

DEFAULT BEHAVIOR: If no position is specified, creates at canvas center (2500, 2500).

Position extraction:
- "create buttons" → x: 2500, y: 2500 (DEFAULT CENTER)
- "add a button group" → x: 2500, y: 2500 (DEFAULT CENTER)
- "at the center" → x: 2500, y: 2500
- "at 1000, 1000" → x: 1000, y: 1000

Buttons extraction:
- "for Cancel, Save, Submit" → buttons: [{label: "Cancel"}, {label: "Save"}, {label: "Submit"}]
- "with OK and Cancel" → buttons: [{label: "OK"}, {label: "Cancel"}]
- "with Yes, No, Maybe" → buttons: [{label: "Yes"}, {label: "No"}, {label: "Maybe"}]
- Default: [{label: "Button 1"}, {label: "Button 2"}, {label: "Button 3"}]

Orientation extraction:
- "vertical button group" → orientation: "vertical"
- "horizontal buttons" → orientation: "horizontal"
- Default: "horizontal"

Examples:
- "Create buttons" → x: 2500, y: 2500, buttons: default 3 buttons, horizontal
- "Add buttons for Cancel, Save, Submit" → extract labels
- "Make a vertical button group with Yes, No, Maybe" → vertical orientation
- "Create buttons at 1000, 1000 for OK and Cancel" → custom position and labels`,
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified.'
        },
        y: {
          type: 'number',
          description: 'Y coordinate of top-left corner (0-5000). DEFAULT: 2500 (center) if not specified.'
        },
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: {
                type: 'string',
                description: 'Button label text'
              },
              color: {
                type: 'string',
                description: 'Optional button color as hex code (e.g., "#646cff")'
              }
            },
            required: ['label']
          },
          description: 'Array of button objects with label (required) and optional color. DEFAULT: [{label: "Button 1"}, {label: "Button 2"}, {label: "Button 3"}]. Extract from user prompt: "Cancel, Save, Submit" → [{label: "Cancel"}, {label: "Save"}, {label: "Submit"}]'
        },
        options: {
          type: 'object',
          properties: {
            orientation: {
              type: 'string',
              enum: ['horizontal', 'vertical'],
              description: 'Button arrangement. Default: "horizontal". Use "vertical" if user says "vertical buttons" or "stacked".'
            },
            spacing: {
              type: 'number',
              description: 'Space between buttons in pixels. Default: 10.'
            },
            buttonWidth: {
              type: 'number',
              description: 'Width of each button in pixels. Default: 120.'
            },
            buttonHeight: {
              type: 'number',
              description: 'Height of each button in pixels. Default: 40.'
            },
            theme: {
              type: 'string',
              enum: ['default', 'dark'],
              description: 'Color theme. Use "dark" if user mentions dark theme/mode. Default: "default".'
            }
          }
        }
      },
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
  'getCanvasCenter': canvasAPI.getCanvasCenter,

  // Selection
  'selectAllShapes': canvasAPI.selectAllShapes,
  'selectShapesByType': canvasAPI.selectShapesByType,
  'selectShapesByColor': canvasAPI.selectShapesByColor,
  'selectShapesInRegion': canvasAPI.selectShapesInRegion,
  'selectShapes': canvasAPI.selectShapes,
  'deselectAll': canvasAPI.deselectAll,

  // Layout (PR #22)
  'arrangeHorizontal': canvasAPI.arrangeHorizontal,
  'arrangeVertical': canvasAPI.arrangeVertical,
  'arrangeGrid': canvasAPI.arrangeGrid,
  'distributeEvenly': canvasAPI.distributeEvenly,
  'centerShape': canvasAPI.centerShape,
  'centerShapes': canvasAPI.centerShapes,

  // Complex Operations (PR #23)
  'createLoginForm': canvasAPI.createLoginForm,
  'createNavigationBar': canvasAPI.createNavigationBar,
  'createCardLayout': canvasAPI.createCardLayout,
  'createButtonGroup': canvasAPI.createButtonGroup
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
      
      // Selection functions
      case 'selectAllShapes':
        result = await functionRegistry[functionName]();
        break;
      
      case 'selectShapesByType':
        result = await functionRegistry[functionName](
          parameters.type
        );
        break;
      
      case 'selectShapesByColor':
        result = await functionRegistry[functionName](
          parameters.color
        );
        break;
      
      case 'selectShapesInRegion':
        result = await functionRegistry[functionName](
          parameters.x,
          parameters.y,
          parameters.width,
          parameters.height
        );
        break;
      
      case 'selectShapes':
        result = await functionRegistry[functionName](
          parameters.shapeIds
        );
        break;
      
      case 'deselectAll':
        result = await functionRegistry[functionName]();
        break;
      
      // Layout functions (PR #22)
      case 'arrangeHorizontal':
        result = await functionRegistry[functionName](
          parameters.shapeIds,
          parameters.spacing
        );
        break;
      
      case 'arrangeVertical':
        result = await functionRegistry[functionName](
          parameters.shapeIds,
          parameters.spacing
        );
        break;
      
      case 'arrangeGrid':
        result = await functionRegistry[functionName](
          parameters.shapeIds,
          parameters.rows,
          parameters.cols,
          parameters.spacingX,
          parameters.spacingY
        );
        break;
      
      case 'distributeEvenly':
        result = await functionRegistry[functionName](
          parameters.shapeIds,
          parameters.direction
        );
        break;
      
      case 'centerShape':
        result = await functionRegistry[functionName](
          parameters.shapeId
        );
        break;
      
      case 'centerShapes':
        result = await functionRegistry[functionName](
          parameters.shapeIds
        );
        break;
      
      // Complex Operations (PR #23)
      case 'createLoginForm':
        result = await functionRegistry[functionName](
          parameters.x !== undefined ? parameters.x : 2500, // Default to center
          parameters.y !== undefined ? parameters.y : 2500, // Default to center
          parameters.options || {},
          parameters.userId
        );
        break;

      case 'createNavigationBar':
        result = await functionRegistry[functionName](
          parameters.x !== undefined ? parameters.x : 2500, // Default to center X
          parameters.y !== undefined ? parameters.y : 100, // Default to top
          parameters.menuItems || ['Home', 'About', 'Services', 'Contact'], // Default menu items
          parameters.options || {},
          parameters.userId
        );
        break;

      case 'createCardLayout':
        result = await functionRegistry[functionName](
          parameters.x !== undefined ? parameters.x : 2500, // Default to center
          parameters.y !== undefined ? parameters.y : 2500, // Default to center
          parameters.title || 'Card Title', // Default title
          parameters.description || 'Card description with details', // Default description
          parameters.options || {},
          parameters.userId
        );
        break;

      case 'createButtonGroup':
        result = await functionRegistry[functionName](
          parameters.x !== undefined ? parameters.x : 2500, // Default to center
          parameters.y !== undefined ? parameters.y : 2500, // Default to center
          parameters.buttons || [{label: 'Button 1'}, {label: 'Button 2'}, {label: 'Button 3'}], // Default buttons
          parameters.options || {},
          parameters.userId
        );
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

