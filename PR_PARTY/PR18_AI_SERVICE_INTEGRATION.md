# PR #18: AI Service Integration 🤖

**Branch**: `feat/ai-service-integration`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: CRITICAL (Key Differentiator)  
**Estimated Time**: 4-5 hours  
**Risk Level**: MEDIUM (New external dependency, API integration)

---

## Overview

### Goal
Establish the foundational AI infrastructure that will enable natural language canvas manipulation. This PR creates the service layer, Canvas API wrapper, function calling schemas, and registry that all subsequent AI features will build upon.

**This is the most critical PR in the entire project** - the AI agent is what makes CollabCanvas unique and differentiates it from basic collaborative canvases.

### Key Features
1. AI service layer with OpenAI GPT-4 integration
2. Canvas API wrapper (unified interface for manual and AI operations)
3. Function calling schemas (OpenAI function format)
4. Function registry (maps function names to implementations)
5. Error handling and validation framework
6. Basic connection testing

### Why This Matters
- **Enables AI agent**: Foundation for all AI commands (PRs #19-24)
- **Ensures consistency**: Manual and AI operations use same code path
- **Simplifies maintenance**: Single source of truth for canvas operations
- **Improves testability**: Centralized validation and error handling
- **Future-proofs architecture**: Easy to extend with new AI commands

---

## Architecture & Design Decisions

### 1. AI Provider Choice

**Decision**: Use OpenAI GPT-4 (not Claude)

**Rationale:**
- Most mature function calling implementation
- Excellent documentation and examples
- Reliable performance and uptime
- Well-tested in production environments
- Large developer community for troubleshooting

**Configuration:**
```javascript
Model: gpt-4 (or gpt-4-turbo for better performance/cost)
Temperature: 0.1 (low for deterministic responses)
Max Tokens: 1000 (sufficient for function calls)
```

**Trade-offs:**
- ✅ Pros: Mature, reliable, well-documented
- ❌ Cons: Cost per request (~$0.03 per 1K tokens), requires API key
- ⚠️ Alternative: Could switch to Anthropic Claude later if needed

---

### 2. Layer Architecture

**Three-Layer Design:**

```
┌─────────────────────────────────────────────────┐
│           AI Service Layer (ai.js)              │
│   - OpenAI client initialization                │
│   - Message history management                  │
│   - Function call parsing                       │
│   - Error handling                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        Function Layer (aiFunctions.js)          │
│   - Function schemas (OpenAI format)            │
│   - Function registry (name → implementation)   │
│   - Parameter validation                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      Canvas API Layer (canvasAPI.js)            │
│   - Unified interface for all operations        │
│   - Used by both manual and AI                  │
│   - Single source of truth                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Existing Services Layer               │
│   - shapes.js (Firestore operations)            │
│   - Already implemented and working             │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Clear separation of concerns
- Easy to test each layer independently
- AI and manual operations converge at Canvas API
- Function registry makes adding commands trivial

---

### 3. Canvas API Pattern

**Decision**: Create unified Canvas API that both manual and AI operations use

**Core Principle**: AI-first design - every operation must be callable programmatically

**API Design:**
```javascript
// canvasAPI.js exports an object with all canvas operations
export const canvasAPI = {
  // Creation functions
  async createRectangle(x, y, width, height, color) { /* ... */ },
  async createCircle(x, y, radius, color) { /* ... */ },
  async createLine(x1, y1, x2, y2, strokeWidth, color) { /* ... */ },
  async createText(text, x, y, fontSize, fontWeight, color) { /* ... */ },
  
  // Manipulation functions
  async moveShape(shapeId, x, y) { /* ... */ },
  async resizeShape(shapeId, width, height) { /* ... */ },
  async rotateShape(shapeId, degrees) { /* ... */ },
  async changeShapeColor(shapeId, color) { /* ... */ },
  async deleteShape(shapeId) { /* ... */ },
  
  // Query functions
  async getCanvasState() { /* ... */ },
  async getSelectedShapes() { /* ... */ },
  async getCanvasCenter() { /* ... */ }
};
```

**Usage Pattern:**
```javascript
// Manual interaction (in Canvas.jsx)
const handleCreateShape = async () => {
  await canvasAPI.createRectangle(x, y, w, h, color);
};

// AI interaction (in ai.js)
const result = await functionRegistry[functionName](...args);
// Both use the same canvasAPI.createRectangle()
```

**Benefits:**
- Single source of truth for all operations
- Consistent validation and error handling
- Easy to test (mock the API)
- Easy to extend (add new functions)
- AI and manual guaranteed to behave identically

---

### 4. Function Calling Schema

**Decision**: Use OpenAI's function calling format (not deprecated "functions" parameter)

**Schema Structure:**
```javascript
{
  name: "createRectangle",
  description: "Creates a rectangle shape on the canvas with specified position, size, and color",
  parameters: {
    type: "object",
    properties: {
      x: {
        type: "number",
        description: "X coordinate of top-left corner (0-5000)"
      },
      y: {
        type: "number", 
        description: "Y coordinate of top-left corner (0-5000)"
      },
      width: {
        type: "number",
        description: "Width in pixels (minimum 10)"
      },
      height: {
        type: "number",
        description: "Height in pixels (minimum 10)"
      },
      color: {
        type: "string",
        description: "Hex color code (e.g., '#FF0000' for red)"
      }
    },
    required: ["x", "y", "width", "height", "color"]
  }
}
```

**Why Detailed Descriptions Matter:**
- AI uses descriptions to understand when to call each function
- Clear parameter descriptions improve AI accuracy
- Validation rules (min/max) help AI make valid requests
- Examples in descriptions improve success rate

---

### 5. Function Registry Pattern

**Decision**: Map function names to implementations using a registry object

```javascript
// aiFunctions.js
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
```

**Execution Pattern:**
```javascript
// In ai.js
if (response.function_call) {
  const functionName = response.function_call.name;
  const args = JSON.parse(response.function_call.arguments);
  
  // Validate function exists
  if (!functionRegistry[functionName]) {
    throw new Error(`Unknown function: ${functionName}`);
  }
  
  // Execute
  const result = await functionRegistry[functionName](...Object.values(args));
  return result;
}
```

**Benefits:**
- Easy to add new functions (add to registry)
- Easy to disable functions (remove from registry)
- Easy to test (mock registry)
- Clear mapping between AI requests and implementations

---

### 6. Error Handling Strategy

**Three-Tier Error Handling:**

**Tier 1: Parameter Validation** (in Canvas API)
```javascript
async createRectangle(x, y, width, height, color) {
  // Validate parameters
  if (x < 0 || x > 5000) {
    return {
      success: false,
      error: 'INVALID_X',
      userMessage: 'X coordinate must be between 0 and 5000'
    };
  }
  
  if (width < 10) {
    return {
      success: false,
      error: 'WIDTH_TOO_SMALL',
      userMessage: 'Width must be at least 10 pixels'
    };
  }
  
  // ... more validation
  
  // Execute operation
  try {
    const result = await addShapeToFirestore({ /* ... */ });
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      userMessage: 'Failed to create rectangle. Please try again.'
    };
  }
}
```

**Tier 2: Function Registry Validation** (in aiFunctions.js)
```javascript
export async function executeAIFunction(functionName, parameters) {
  // Check function exists
  if (!functionRegistry[functionName]) {
    return {
      success: false,
      error: 'UNKNOWN_FUNCTION',
      userMessage: `I don't know how to ${functionName}. Try a different command.`
    };
  }
  
  // Execute and return result
  try {
    const result = await functionRegistry[functionName](...Object.values(parameters));
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      userMessage: 'Operation failed. Please try again.'
    };
  }
}
```

**Tier 3: AI Service Error Handling** (in ai.js)
```javascript
export async function sendMessage(userMessage) {
  try {
    const response = await openai.chat.completions.create({ /* ... */ });
    
    if (response.function_call) {
      const result = await executeAIFunction(
        response.function_call.name,
        JSON.parse(response.function_call.arguments)
      );
      
      if (!result.success) {
        // AI understands the error and can explain to user
        return {
          success: false,
          error: result.error,
          message: result.userMessage
        };
      }
      
      return {
        success: true,
        message: response.message,
        result: result.result
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'AI_ERROR',
      message: 'Sorry, I encountered an error. Please try again.'
    };
  }
}
```

**Error Response Format:**
```javascript
{
  success: boolean,
  error?: string,          // Error code (for logging/debugging)
  userMessage?: string,    // User-friendly message
  result?: any            // Result if success
}
```

**Benefits:**
- User always gets helpful feedback
- Errors caught at appropriate layer
- AI can understand errors and explain to user
- Easy to log and debug
- Consistent format across all operations

---

### 7. Message History Management

**Decision**: Store conversation history in React state (not Firestore)

**Rationale:**
- History is per-user (not shared)
- Ephemeral (doesn't need persistence)
- Faster access (no network round-trip)
- Lower Firestore costs

**History Structure:**
```javascript
const [messages, setMessages] = useState([
  {
    role: 'system',
    content: systemPrompt
  },
  {
    role: 'user',
    content: 'Create a blue rectangle at the center',
    timestamp: Date.now()
  },
  {
    role: 'assistant',
    content: 'I created a blue rectangle at the center of the canvas.',
    timestamp: Date.now()
  },
  {
    role: 'function',
    name: 'createRectangle',
    content: JSON.stringify({ success: true, shapeId: 'xyz' })
  }
]);
```

**History Limits:**
- Keep last 20 messages (rolling window)
- Prune old messages to save tokens
- Clear history button for user

---

### 8. System Prompt Design

**Decision**: Detailed system prompt that teaches AI about the canvas

```javascript
export const SYSTEM_PROMPT = `You are an AI assistant for CollabCanvas, a collaborative design tool.

CANVAS INFORMATION:
- Canvas size: 5000x5000 pixels
- Canvas center: (2500, 2500)
- Coordinate system: Top-left is (0,0), bottom-right is (5000, 5000)

AVAILABLE SHAPES:
- Rectangle: Has x, y, width, height, color, rotation
- Circle: Has x, y (center), radius, color, rotation
- Line: Has x1, y1, x2, y2, strokeWidth, color
- Text: Has x, y, text, fontSize, fontWeight, color, rotation

AVAILABLE FUNCTIONS:
You can call these functions to manipulate the canvas:
- createRectangle, createCircle, createLine, createText
- moveShape, resizeShape, rotateShape, changeShapeColor, deleteShape
- getCanvasState, getSelectedShapes, getCanvasCenter

GUIDELINES:
1. When user says "center", use coordinates (2500, 2500)
2. Use reasonable default sizes: rectangles 200x150, circles radius 75
3. Choose visually pleasing colors when user doesn't specify
4. For complex operations (like "create a login form"), plan multiple steps
5. Always validate parameters are within bounds
6. Be conversational and helpful in responses

RESPONSE STYLE:
- Confirm what you created/changed
- If you can't do something, explain why
- If user request is ambiguous, ask for clarification
`;
```

**Why Detailed Prompts Work:**
- AI understands canvas constraints
- AI makes better default choices
- Reduces errors and invalid requests
- Improves user experience

---

## Implementation Details

### File Structure

**New Files to Create:**

```
src/services/
├── ai.js                    # AI service (OpenAI integration)
├── canvasAPI.js            # Canvas API wrapper
└── aiFunctions.js          # Function schemas and registry

src/hooks/
└── useAI.js                # React hook for AI state (PR #19)

src/components/AI/
├── AIChat.jsx              # Chat interface (PR #19)
├── AICommandInput.jsx      # Input field (PR #19)
├── AIHistory.jsx           # Message history (PR #19)
└── AIFeedback.jsx          # Loading/error states (PR #19)
```

**Note**: Only creating services in PR #18, components in PR #19

---

### 1. AI Service (ai.js)

**Full Implementation:**

```javascript
// src/services/ai.js
import OpenAI from 'openai';
import { functionSchemas } from './aiFunctions';
import { executeAIFunction } from './aiFunctions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For MVP, client-side calls
});

// System prompt
export const SYSTEM_PROMPT = `You are an AI assistant for CollabCanvas, a collaborative design tool.

CANVAS INFORMATION:
- Canvas size: 5000x5000 pixels
- Canvas center: (2500, 2500)
- Coordinate system: Top-left is (0,0), bottom-right is (5000, 5000)

AVAILABLE SHAPES:
- Rectangle: Has x, y, width, height, color, rotation
- Circle: Has x, y (center), radius, color, rotation  
- Line: Has x1, y1, x2, y2, strokeWidth, color
- Text: Has x, y, text, fontSize, fontWeight, color, rotation

AVAILABLE FUNCTIONS:
You can call these functions to manipulate the canvas:
- createRectangle, createCircle, createLine, createText
- moveShape, resizeShape, rotateShape, changeShapeColor, deleteShape
- getCanvasState, getSelectedShapes, getCanvasCenter

GUIDELINES:
1. When user says "center", use coordinates (2500, 2500)
2. Use reasonable default sizes: rectangles 200x150, circles radius 75
3. Choose visually pleasing colors when user doesn't specify
4. For complex operations (like "create a login form"), plan multiple steps
5. Always validate parameters are within bounds
6. Be conversational and helpful in responses

RESPONSE STYLE:
- Confirm what you created/changed
- If you can't do something, explain why
- If user request is ambiguous, ask for clarification
`;

/**
 * Send a message to the AI and execute any function calls
 * @param {Array} messageHistory - Previous messages in conversation
 * @param {string} userMessage - New message from user
 * @returns {Promise<Object>} Response with success status and message
 */
export async function sendMessage(messageHistory, userMessage) {
  try {
    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      functions: functionSchemas,
      function_call: 'auto',
      temperature: 0.1,
      max_tokens: 1000
    });

    const responseMessage = response.choices[0].message;

    // Check if AI wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      console.log('AI calling function:', functionName, functionArgs);

      // Execute the function
      const functionResult = await executeAIFunction(functionName, functionArgs);

      // If function failed, return error
      if (!functionResult.success) {
        return {
          success: false,
          message: functionResult.userMessage,
          error: functionResult.error
        };
      }

      // Get AI's final response after function execution
      const followUpMessages = [
        ...messages,
        responseMessage,
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ];

      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: followUpMessages,
        temperature: 0.1,
        max_tokens: 500
      });

      return {
        success: true,
        message: finalResponse.choices[0].message.content,
        functionCalled: functionName,
        functionResult: functionResult.result
      };
    }

    // No function call, just return AI's message
    return {
      success: true,
      message: responseMessage.content
    };

  } catch (error) {
    console.error('AI Error:', error);
    return {
      success: false,
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message
    };
  }
}

/**
 * Test AI connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });
    return response.choices.length > 0;
  } catch (error) {
    console.error('AI Connection Test Failed:', error);
    return false;
  }
}
```

---

### 2. Canvas API (canvasAPI.js)

**Full Implementation:**

```javascript
// src/services/canvasAPI.js
import {
  addShapeToFirestore,
  updateShapeInFirestore,
  deleteShapeFromFirestore,
  getAllShapes
} from './shapes';
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
  async createRectangle(x, y, width, height, color) {
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

      const result = await addShapeToFirestore(shape);
      return { success: true, result: { shapeId: result.id, ...shape } };
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
  async createCircle(x, y, radius, color) {
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

      const result = await addShapeToFirestore(shape);
      return { success: true, result: { shapeId: result.id, ...shape } };
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
  async createLine(x1, y1, x2, y2, strokeWidth, color) {
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
        width: x2 - x1,
        height: y2 - y1,
        strokeWidth,
        color,
        rotation: 0
      };

      const result = await addShapeToFirestore(shape);
      return { success: true, result: { shapeId: result.id, ...shape } };
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
  async createText(text, x, y, fontSize = 16, fontWeight = 'normal', color = '#000000') {
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

      const result = await addShapeToFirestore(shape);
      return { success: true, result: { shapeId: result.id, ...shape } };
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
      await updateShapeInFirestore(shapeId, { x, y });
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
      await updateShapeInFirestore(shapeId, { width, height });
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
      await updateShapeInFirestore(shapeId, { rotation: normalizedRotation });
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
      await updateShapeInFirestore(shapeId, { color });
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
      await deleteShapeFromFirestore(shapeId);
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
        x: CANVAS_CONFIG.width / 2,
        y: CANVAS_CONFIG.height / 2
      }
    };
  }
};
```

---

### 3. AI Functions (aiFunctions.js)

**Full Implementation:**

```javascript
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
    console.log(`Executing ${functionName} with params:`, parameters);
    const result = await functionRegistry[functionName](...Object.values(parameters));
    console.log(`${functionName} result:`, result);
    return result;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      success: false,
      error: error.message,
      userMessage: 'Operation failed. Please try again.'
    };
  }
}
```

---

### 4. Update shapes.js

**Need to add `getAllShapes` function:**

```javascript
// Add to src/services/shapes.js

/**
 * Get all shapes (for AI queries)
 * @returns {Promise<Array>} Array of all shapes
 */
export async function getAllShapes() {
  const shapesCollection = collection(db, 'shapes');
  const querySnapshot = await getDocs(shapesCollection);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

### 5. Environment Variables

**Add to `.env.local`:**

```env
# Existing Firebase keys...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.

# NEW: OpenAI API Key
VITE_OPENAI_API_KEY=sk-...your-key-here
```

**Security Note:**
- For MVP, client-side API calls are acceptable
- API key will be visible in browser (not ideal but functional)
- For production, move to backend proxy (Cloud Functions)
- Document this as a known security gap

---

### 6. Package.json Updates

**Add OpenAI dependency:**

```bash
npm install openai
```

**Updated dependencies:**
```json
{
  "dependencies": {
    "firebase": "^12.4.0",
    "konva": "^10.0.2",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-konva": "^19.0.10",
    "openai": "^4.0.0"  // NEW
  }
}
```

---

## Testing Strategy

### Phase 1: Service Layer Testing (Isolated)

**Test AI Service (ai.js):**

```javascript
// Create test file: src/services/__tests__/ai.test.js
import { sendMessage, testConnection } from '../ai';

// Manual test in browser console:
// 1. Test connection
await testConnection(); // Should return true

// 2. Test simple message (no function call)
const result = await sendMessage([], 'Hello');
console.log(result); // Should have success: true, message: "..."

// 3. Test function call
const result2 = await sendMessage([], 'Create a blue rectangle at the center');
console.log(result2);
// Should have success: true, functionCalled: "createRectangle"
```

**Test Canvas API (canvasAPI.js):**

```javascript
// Browser console tests:
import { canvasAPI } from './services/canvasAPI';

// Test validation (should fail)
await canvasAPI.createRectangle(-100, 2500, 200, 150, '#FF0000');
// Should return { success: false, error: 'INVALID_POSITION', ... }

// Test valid creation
await canvasAPI.createRectangle(2500, 2500, 200, 150, '#0066FF');
// Should return { success: true, result: { shapeId: '...', ... }}

// Verify shape appears on canvas via Firestore
```

**Test Function Registry:**

```javascript
import { executeAIFunction } from './services/aiFunctions';

// Test unknown function
await executeAIFunction('invalidFunction', {});
// Should return { success: false, error: 'UNKNOWN_FUNCTION', ... }

// Test valid function
await executeAIFunction('createRectangle', {
  x: 2400,
  y: 2400,
  width: 200,
  height: 150,
  color: '#FF0000'
});
// Should return { success: true, result: { ... }}
```

---

### Phase 2: Integration Testing

**Test End-to-End AI Flow:**

1. **Setup:**
   - Ensure `.env.local` has valid `VITE_OPENAI_API_KEY`
   - Start dev server: `npm run dev`
   - Open browser console

2. **Test Basic Command:**
   ```javascript
   import { sendMessage } from './services/ai';
   
   const result = await sendMessage(
     [], 
     'Create a blue rectangle at position 2400, 2400 with size 200x150'
   );
   console.log(result);
   ```
   
   **Expected:**
   - `result.success === true`
   - `result.functionCalled === 'createRectangle'`
   - `result.message` contains confirmation
   - Rectangle appears on canvas
   - All users see the rectangle in real-time

3. **Test Query Command:**
   ```javascript
   const result2 = await sendMessage([], 'What shapes are on the canvas?');
   console.log(result2);
   ```
   
   **Expected:**
   - `result2.success === true`
   - `result2.functionCalled === 'getCanvasState'`
   - `result2.message` describes current shapes

4. **Test Error Handling:**
   ```javascript
   const result3 = await sendMessage([], 'Create a rectangle at -1000, -1000');
   console.log(result3);
   ```
   
   **Expected:**
   - `result3.success === false`
   - `result3.userMessage` explains the error

5. **Test Multi-User Sync:**
   - Open two browser windows
   - In Window 1 console: Execute AI command to create shape
   - In Window 2: Verify shape appears in real-time (<100ms)

---

### Phase 3: Performance Testing

**Measure AI Response Times:**

```javascript
async function measureAIPerformance() {
  const start = performance.now();
  
  const result = await sendMessage([], 'Create a red circle at the center');
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`AI Response Time: ${duration}ms`);
  console.log(`Target: <2000ms for simple commands`);
  console.log(`Result:`, result);
}

await measureAIPerformance();
```

**Expected Performance:**
- Simple commands (single function call): <2 seconds
- Query commands: <1 second
- Error responses: <500ms

**If Too Slow:**
- Check network latency
- Consider using `gpt-4-turbo` instead of `gpt-4`
- Reduce `max_tokens` parameter
- Optimize function schemas (shorter descriptions)

---

### Phase 4: Real-World Testing

**Test Actual User Commands:**

1. "Create a blue rectangle at the center"
2. "Add a red circle above it"
3. "Create a line from 100,100 to 400,400"
4. "Add text that says 'Hello World' at 2500, 2300"
5. "What shapes are on the canvas?"
6. "Change the rectangle's color to green"
7. "Delete the circle"

**Success Criteria:**
- ✅ All commands execute successfully
- ✅ Shapes appear on canvas as expected
- ✅ Real-time sync works across users
- ✅ Error messages are helpful
- ✅ Response times meet targets
- ✅ No console errors

---

## Rollout Plan

### Phase 1: Environment Setup (30 minutes)

**Step 1.1: Get OpenAI API Key**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy key (starts with `sk-`)
4. Add to `.env.local`:
   ```env
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

**Step 1.2: Install Dependencies**
```bash
cd collabcanvas
npm install openai
```

**Step 1.3: Test API Key**
```bash
# Test in browser console after starting dev server
# (Will do this after creating files)
```

---

### Phase 2: Create Service Files (2 hours)

**Step 2.1: Create Canvas API** (30 min)
- Create `src/services/canvasAPI.js`
- Implement all 12 functions
- Add validation helpers
- Add JSDoc comments

**Step 2.2: Update shapes.js** (10 min)
- Add `getAllShapes` function
- Export function

**Step 2.3: Create AI Functions** (30 min)
- Create `src/services/aiFunctions.js`
- Define all 12 function schemas
- Create function registry
- Implement `executeAIFunction`

**Step 2.4: Create AI Service** (50 min)
- Create `src/services/ai.js`
- Implement `sendMessage` function
- Implement `testConnection` function
- Add system prompt
- Add error handling

---

### Phase 3: Testing & Validation (1.5 hours)

**Step 3.1: Unit Tests** (30 min)
- Test Canvas API validation
- Test each function in isolation
- Test error cases

**Step 3.2: Integration Tests** (30 min)
- Test AI service connection
- Test function execution
- Test end-to-end flow

**Step 3.3: Multi-User Tests** (30 min)
- Test shape creation syncs
- Test multiple users using AI
- Verify real-time updates

---

### Phase 4: Documentation & Commit (30 minutes)

**Step 4.1: Update Memory Bank**
- Update `activeContext.md` with PR #18 completion
- Update `progress.md` with completed features

**Step 4.2: Git Workflow**
```bash
# Create branch
git checkout -b feat/ai-service-integration

# Add files
git add src/services/ai.js
git add src/services/canvasAPI.js
git add src/services/aiFunctions.js
git add src/services/shapes.js
git add collabcanvas/package.json
git add collabcanvas/package-lock.json
git add .env.local

# Commit
git commit -m "feat: Add AI service integration (PR #18)

- Add OpenAI GPT-4 integration
- Create Canvas API wrapper (12 functions)
- Define function calling schemas
- Implement function registry
- Add comprehensive error handling
- Add validation for all parameters
- Support for 4 shape types (rectangle, circle, line, text)
- Support for 5 manipulation operations
- Support for 3 query operations

Estimated time: 4-5 hours
Risk level: MEDIUM"

# Push
git push origin feat/ai-service-integration

# Merge to main (after testing)
git checkout main
git merge feat/ai-service-integration
git push origin main
```

---

## Success Criteria

### Must Have (Required)

- ✅ **AI Service Functional**: Can connect to OpenAI and send messages
- ✅ **Canvas API Complete**: All 12 functions implemented and tested
- ✅ **Function Registry Working**: AI can call all registered functions
- ✅ **Validation Working**: Invalid parameters are caught and reported
- ✅ **Error Handling Working**: Errors are user-friendly and helpful
- ✅ **Real-Time Sync Working**: AI-created shapes sync across users
- ✅ **Performance Target Met**: Simple commands respond in <2 seconds
- ✅ **All 12 Functions Tested**: Each function works in isolation
- ✅ **End-to-End Flow Tested**: Complete AI → function → canvas → sync flow works
- ✅ **Multi-User Tested**: Two users can see AI changes simultaneously

### Nice to Have (Optional)

- ⭐ Token usage tracking (log to console)
- ⭐ Rate limiting on client side (prevent spam)
- ⭐ Conversation history persistence (localStorage)
- ⭐ More detailed logging for debugging
- ⭐ AI performance metrics dashboard

### Out of Scope (Future PRs)

- ❌ AI Chat UI (PR #19)
- ❌ Selection commands (PR #21)
- ❌ Layout commands (PR #22)
- ❌ Complex operations (PR #23)
- ❌ Backend proxy for API calls (production security)
- ❌ Advanced AI features (code interpretation, vision, etc.)

---

## Risk Assessment

### Risk 1: OpenAI API Reliability ⚠️ MEDIUM

**Issue**: OpenAI API could be slow, rate-limited, or temporarily unavailable

**Impact**: AI commands fail or are slow

**Likelihood**: Low (OpenAI is generally reliable)

**Mitigation:**
- Add retry logic for transient errors
- Show helpful error messages to user
- Consider fallback to cached responses for common commands
- Monitor API status (https://status.openai.com/)

**Contingency:**
- If OpenAI is down, show "AI is temporarily unavailable" message
- Consider adding Anthropic Claude as backup provider

---

### Risk 2: API Key Security 🔴 HIGH

**Issue**: API key is exposed in client-side code (browser)

**Impact**: Anyone can inspect code and steal API key

**Likelihood**: Certain (client-side code is always visible)

**Mitigation:**
- Document this as a known security gap
- Add spending limits on OpenAI account
- Plan to move to backend proxy for production
- Monitor API usage for abuse

**Contingency:**
- If key is abused, rotate key immediately
- Implement backend proxy (Cloud Functions)
- Add request signing for authentication

---

### Risk 3: Function Calling Complexity ⚠️ MEDIUM

**Issue**: AI might misunderstand commands and call wrong functions

**Impact**: Unexpected shapes created, wrong operations executed

**Likelihood**: Medium (AI is usually accurate but not perfect)

**Mitigation:**
- Detailed function descriptions in schemas
- Clear parameter descriptions with examples
- Well-designed system prompt
- Thorough testing with various commands
- Validation catches invalid parameters

**Contingency:**
- If AI frequently misunderstands, improve system prompt
- Add examples to function descriptions
- Consider showing "Did you mean...?" suggestions

---

### Risk 4: Performance Issues ⚠️ MEDIUM

**Issue**: AI responses could be slow (>2 seconds)

**Impact**: Poor user experience, feels laggy

**Likelihood**: Medium (depends on OpenAI load, network latency)

**Mitigation:**
- Use `gpt-4-turbo` for better performance
- Keep function schemas concise
- Limit message history to recent messages
- Show loading indicator immediately
- Set reasonable timeout (5 seconds)

**Contingency:**
- If too slow, switch to `gpt-3.5-turbo` for faster responses
- Implement request queuing for multiple commands
- Add caching for common queries

---

### Risk 5: Cost Management 🟡 LOW

**Issue**: OpenAI API costs money per token

**Impact**: Unexpected costs if heavily used

**Likelihood**: Low (MVP usage will be minimal)

**Mitigation:**
- Set spending limits on OpenAI account
- Monitor usage via OpenAI dashboard
- Optimize prompts to use fewer tokens
- Limit message history to reduce context size

**Contingency:**
- If costs are too high, implement rate limiting
- Move to backend with request throttling
- Consider cheaper models for simple commands

---

## Known Limitations

### Technical Limitations

1. **Client-Side API Calls**: API key is exposed in browser
   - **Impact**: Security risk
   - **Workaround**: Document as known gap, plan backend proxy

2. **No Request Queuing**: Multiple simultaneous AI commands may conflict
   - **Impact**: Race conditions possible
   - **Workaround**: User should wait for command to complete

3. **No Undo for AI Commands**: AI operations are not tracked in undo history
   - **Impact**: Can't undo AI changes
   - **Workaround**: User can manually delete shapes

4. **No Context Persistence**: AI doesn't remember across page refreshes
   - **Impact**: AI starts fresh each session
   - **Workaround**: Acceptable for MVP

### Functional Limitations

1. **Basic Commands Only**: PR #18 only supports single-step operations
   - **Impact**: No complex operations like "create login form"
   - **Workaround**: Complex operations in PR #23

2. **No Selection Integration**: Can't operate on selected shapes yet
   - **Impact**: Can't say "change selected shapes to red"
   - **Workaround**: Selection commands in PR #21

3. **No Layout Operations**: Can't arrange shapes in patterns
   - **Impact**: Can't say "arrange these in a row"
   - **Workaround**: Layout commands in PR #22

4. **No Multi-Step Planning**: Can't break complex tasks into steps
   - **Impact**: Complex operations fail
   - **Workaround**: PR #23 will add multi-step engine

### Performance Limitations

1. **2-Second Target**: Simple commands should respond in <2s
   - **Current**: Depends on OpenAI API latency
   - **Acceptable**: 2-3 seconds for MVP

2. **No Batch Operations**: Each shape created individually
   - **Impact**: Creating 10 shapes = 10 API calls
   - **Workaround**: Batch operations in PR #22

---

## Future Enhancements (Not in This PR)

### Post-PR #18 Improvements

1. **Backend Proxy** (Production Security)
   - Move OpenAI API calls to Cloud Functions
   - Secure API key on server
   - Add rate limiting and authentication

2. **Conversation Persistence** (Nice UX)
   - Save message history to localStorage
   - Restore conversation on page refresh
   - Export conversation as text

3. **Advanced AI Features** (Stretch Goals)
   - Multi-step operation planning
   - Batch operations for efficiency
   - Context awareness (remember user preferences)
   - Vision API for image-based commands

4. **AI Performance Optimization** (If Needed)
   - Request queuing for concurrent commands
   - Response caching for common queries
   - Streaming responses for immediate feedback
   - Parallel function calls

5. **Enhanced Error Handling** (Polish)
   - Retry logic for transient errors
   - Graceful degradation when AI unavailable
   - Detailed error logging
   - Error analytics

---

## Dependencies & Blockers

### Dependencies (Must Complete First)

- ✅ PR #11: Line shapes (DONE)
- ✅ PR #12: Text shapes (DONE)
- ✅ PR #15: Rotation support (DONE)
- ✅ PR #16: Duplicate operation (DONE)
- ✅ PR #17: Layer management (DONE)

**All dependencies complete!** Ready to start.

### Blockers (Must Resolve Before Starting)

**None!** No blockers.

### Enables (Unlocked by This PR)

- ✅ PR #19: AI Chat Interface (needs AI service)
- ✅ PR #20: AI Basic Commands (needs Canvas API)
- ✅ PR #21: AI Selection Commands (needs function registry)
- ✅ PR #22: AI Layout Commands (needs Canvas API)
- ✅ PR #23: AI Complex Operations (needs all of above)
- ✅ PR #24: AI Testing & Documentation (needs working AI)

**This PR is CRITICAL** - all remaining work depends on it!

---

## Lessons from Previous PRs

### What Worked Well (Apply Here)

1. **Comprehensive Planning**: PR_PARTY docs helped avoid surprises
   - **Action**: This document follows same pattern

2. **Incremental Testing**: Test after each change, not at end
   - **Action**: Test each service file as we create it

3. **Clear Success Criteria**: Knew exactly when PR was "done"
   - **Action**: Defined clear must-have criteria above

4. **Performance Focus**: Measured FPS, maintained 60 FPS
   - **Action**: Measure AI response times, target <2s

### What to Improve (Learn From)

1. **Bug Prevention**: PR #15 had 3 bugs discovered late
   - **Action**: Test validation thoroughly before integration

2. **Time Estimates**: Some PRs took longer than estimated
   - **Action**: Budget extra time for testing and debugging

3. **Documentation**: Some decisions weren't documented
   - **Action**: Document all design decisions in this file

---

## Post-Implementation Checklist

After completing PR #18, verify:

- [ ] All 12 Canvas API functions implemented
- [ ] All 12 function schemas defined
- [ ] Function registry maps all names to implementations
- [ ] AI service can connect to OpenAI
- [ ] AI service can parse function calls
- [ ] AI service can execute functions via registry
- [ ] Error handling catches all error cases
- [ ] Validation catches invalid parameters
- [ ] Response format is consistent (success/error/userMessage)
- [ ] Real-time sync works for AI-created shapes
- [ ] Multi-user testing passed (2+ users see AI changes)
- [ ] Performance target met (<2s for simple commands)
- [ ] All test commands work successfully
- [ ] No console errors during testing
- [ ] Code is clean and well-commented
- [ ] Memory bank updated (activeContext.md, progress.md)
- [ ] Git committed and pushed
- [ ] Ready for PR #19 (AI Chat UI)

---

## Time Breakdown (Estimated)

**Total: 4-5 hours**

- Environment Setup: 30 minutes
- Canvas API Implementation: 60 minutes
- AI Functions Implementation: 45 minutes
- AI Service Implementation: 60 minutes
- Testing (Unit): 30 minutes
- Testing (Integration): 30 minutes
- Testing (Multi-User): 20 minutes
- Documentation & Commit: 20 minutes
- Buffer for Issues: 30 minutes

---

## Ready to Implement! 🚀

This PR establishes the foundation for all AI features. Once complete:
- PRs #19-24 can proceed rapidly
- All AI commands will use this infrastructure
- Manual and AI operations will be guaranteed consistent
- Testing will be straightforward

**Let's build the future of collaborative AI design tools!**

---

**Next Steps:**
1. Get user approval to proceed
2. Set up OpenAI API key
3. Create service files
4. Test thoroughly
5. Move to PR #19 (AI Chat UI)

