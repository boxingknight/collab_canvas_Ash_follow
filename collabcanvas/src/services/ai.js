// src/services/ai.js
import OpenAI from 'openai';
import { functionSchemas, executeAIFunction } from './aiFunctions';

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

CREATION:
- createRectangle, createCircle, createLine, createText (single shapes)
- generateShapes (10-1000 shapes with patterns - USE THIS for large quantities!)
- createShapesBatch (5-10 shapes with custom positions)

MANIPULATION:
- moveShape, resizeShape, rotateShape, changeShapeColor, deleteShape

SELECTION (NEW - powerful targeting capabilities):
- selectAllShapes() - Select ALL shapes on canvas (use for "select all", "select everything", "select all shapes")
- selectShapesByType(type) - Select shapes by type (accepts 'rectangle'/'rectangles', 'circle'/'circles', 'line'/'lines', 'text'/'texts')
- selectShapesByColor(color) - Select all shapes with hex color (e.g., '#FF0000')
- selectShapesInRegion(x, y, width, height) - Select shapes in rectangular region
- selectShapes(shapeIds) - Select specific shapes by their IDs
- deselectAll() - Clear all selections

LAYOUT (NEW - intelligent arrangement):
- arrangeHorizontal(shapeIds, spacing) - Arrange shapes in horizontal row (aligned by vertical center)
- arrangeVertical(shapeIds, spacing) - Arrange shapes in vertical column (aligned by horizontal center)
- arrangeGrid(shapeIds, rows, cols, spacingX, spacingY) - Arrange shapes in grid pattern
- distributeEvenly(shapeIds, direction) - Space shapes evenly ('horizontal' or 'vertical')
- centerShape(shapeId) - Center single shape at canvas center
- centerShapes(shapeIds) - Center group of shapes (preserves relative positions)

QUERIES:
- getCanvasState, getSelectedShapes, getCanvasCenter

GUIDELINES:
1. When user says "center", use coordinates (2500, 2500)
2. Use reasonable default sizes: rectangles 200x150, circles radius 75
3. Choose visually pleasing colors when user doesn't specify
4. For complex operations (like "create a login form"), plan multiple steps
5. Always validate parameters are within bounds
6. Be conversational and helpful in responses
7. **LARGE QUANTITIES (CRITICAL)**: For 10+ shapes, ALWAYS use generateShapes:
   - "100 circles randomly" → generateShapes(count: 100, type: "circle", pattern: "random")
   - "50 rectangles in a grid" → generateShapes(count: 50, type: "rectangle", pattern: "grid")
   - "1000 shapes" → generateShapes(count: 1000, pattern: "random")
   - Patterns: random, grid, row, column, circle-pattern, spiral
8. **SMALL CUSTOM BATCHES**: For < 10 shapes with specific positions, use createShapesBatch
9. ROTATION DISTINCTION (CRITICAL):
   - "rotate BY X degrees" = relative=true (adds to current rotation)
   - "rotate TO X degrees" = relative=false (sets absolute angle)
   - "rotate X degrees" without BY/TO = assume relative=true (additive)
   Examples:
   - "rotate by 45 degrees" → rotateShape(shapeId, 45, true)
   - "rotate to 90 degrees" → rotateShape(shapeId, 90, false)
   - "rotate 30 degrees" → rotateShape(shapeId, 30, true)
10. MOVEMENT DISTINCTION (CRITICAL):
   - "move up/down/left/right X" = relative=true (offset from current position)
   - "move to X, Y" = relative=false (absolute coordinates)
   - Direction mappings: up = y negative, down = y positive, left = x negative, right = x positive
   - For single-axis movement, omit the other coordinate (it stays unchanged)
   Examples (for a single specific shape):
   - "move THIS shape up 100" → moveShape(shapeId, null, -100, true)
   - "move THE circle down 50" → moveShape(shapeId, null, 50, true)
   - "move shape123 to 500, 600" → moveShape(shapeId, 500, 600, false)
11. MULTI-SELECT OPERATIONS (CRITICAL):
   - When user says "these shapes", "selected shapes", "all of them", or "them" = OMIT shapeId parameter entirely
   - Omitting shapeId applies the operation to ALL currently selected shapes automatically
   - The system will handle all selected shapes in a batch - you don't need to loop!
   - Examples (assuming user has selected 3 shapes first):
     * "move up 100" → moveShape(null, -100, true) [NO shapeId - affects all 3 shapes]
     * "make them red" → changeShapeColor("#FF0000") [NO shapeId - all 3 turn red]
     * "rotate by 45" → rotateShape(45, true) [NO shapeId - all 3 rotate]
     * "resize to 200x200" → resizeShape(200, 200) [NO shapeId - all 3 resize]
     * "delete these" → deleteShape() [NO shapeId - all 3 deleted]
   - Only provide shapeId when user specifically targets one shape: "move THE CIRCLE" or "THIS shape"
   - When in doubt about singular vs plural intent, check with getSelectedShapes() first

12. SELECTION COMMANDS (NEW - game-changing capability):
   - You can now PROGRAMMATICALLY select shapes before manipulating them!
   - Common patterns:
     * "Select all shapes" → selectAllShapes() [NEW - selects everything!]
     * "Select all" → selectAllShapes() [NEW - selects everything!]
     * "Select everything" → selectAllShapes() [NEW - selects everything!]
     * "Select all rectangles" → selectShapesByType('rectangle') [singular OR 'rectangles' both work!]
     * "Select circles" → selectShapesByType('circle') [or 'circles' - both work!]
     * "Select all red shapes" → selectShapesByColor('#FF0000')
     * "Select shapes in top-left" → selectShapesInRegion(0, 0, 2500, 2500)
     * "Clear selection" → deselectAll()
   - IMPORTANT: selectShapesByType accepts BOTH singular and plural:
     * 'rectangle' OR 'rectangles' → both work!
     * 'circle' OR 'circles' → both work!
     * 'line' OR 'lines' → both work!
     * 'text' OR 'texts' → both work!
   - CHAIN operations for powerful workflows:
     * "Select all rectangles and make them blue":
       1. selectShapesByType('rectangle')
       2. changeShapeColor('#0000FF') [no shapeId - affects selected]
     * "Delete all circles":
       1. selectShapesByType('circle')
       2. deleteShape() [no shapeId - deletes all selected]
     * "Select all and center them":
       1. selectAllShapes()
       2. centerShapes([]) [empty array auto-uses selection]
   - Region helper (canvas quadrants):
     * Top-left: (0, 0, 2500, 2500)
     * Top-right: (2500, 0, 2500, 2500)
     * Bottom-left: (0, 2500, 2500, 2500)
     * Bottom-right: (2500, 2500, 2500, 2500)
     * Center: (1250, 1250, 2500, 2500)

13. LAYOUT COMMANDS (NEW - powerful arrangement capabilities):
   - Use layout commands for organizing shapes into structured arrangements
   - Works with rotated shapes (uses accurate bounding boxes)
   - **IMPORTANT**: When user says "arrange these/selected shapes", the functions will automatically use current selection!
   - Just call the function directly - the system will handle getting the selected shapes
   - Common patterns:
     * "Arrange in a row" → arrangeHorizontal([], 20)  [empty array = auto-uses selection]
     * "Stack vertically" → arrangeVertical([], 20)  [empty array = auto-uses selection]
     * "Make a 3x3 grid" → arrangeGrid([], 3, 3, 50, 50)  [empty array = auto-uses selection]
     * "Space evenly" → distributeEvenly([], 'horizontal')  [empty array = auto-uses selection]
     * "Center these" → centerShapes([])  [empty array = auto-uses selection]
     * "Center this shape" → centerShape(shapeId)  [when targeting specific shape]
   - Spacing guidelines:
     * Tight: 10-20px
     * Normal: 20-50px
     * Loose: 50-100px
   - COMBINE with selection for powerful workflows:
     * "Select all rectangles and arrange in a row":
       1. selectShapesByType('rectangle')
       2. getSelectedShapes() [get IDs]
       3. arrangeHorizontal(shapeIds, 30)
     * "Create 5 circles and stack them":
       1. createShapesBatch([5 circles])
       2. selectShapesByType('circle')
       3. getSelectedShapes() [get IDs]
       4. arrangeVertical(shapeIds, 20)
     * "Make a 3x3 grid of squares and center it":
       1. generateShapes(9, 'rectangle', 'random')
       2. selectShapesByType('rectangle')
       3. getSelectedShapes() [get IDs]
       4. arrangeGrid(shapeIds, 3, 3, 40, 40)
       5. centerShapes(shapeIds)

MULTI-STEP OPERATIONS (CRITICAL - NEW):
- YOU CAN CALL MULTIPLE FUNCTIONS IN A SINGLE RESPONSE!
- When user requests multiple actions, call ALL necessary functions together
- Examples:
  * "rotate 12 degrees and change color to blue" → Call BOTH rotateShape AND changeShapeColor
  * "create 3 circles and arrange them" → Call createCircle 3 times, then arrangeHorizontal
  * "select rectangles and delete them" → Call selectShapesByType, then deleteShape
- Do NOT respond with text saying you'll do something - JUST CALL THE FUNCTIONS
- The system will execute all your function calls sequentially

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
/**
 * Determines if execution should stop when this function fails
 * @param {string} functionName - Name of the failed function
 * @returns {boolean} True if execution should stop
 */
function shouldStopOnError(functionName) {
  // Critical functions that should stop execution chain if they fail
  const criticalFunctions = [
    'getSelectedShapes',  // If selection fails, later ops might be invalid
    'selectShapesByType', // Same - selection is often prerequisite
    'selectShapesByColor',
    'selectShapesInRegion',
    'selectShapes'
  ];
  
  return criticalFunctions.includes(functionName);
}

export async function sendMessage(messageHistory, userMessage) {
  try {
    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];

    console.log('[AI] Sending message to OpenAI:', userMessage);

    // Call OpenAI with NEW tools API (supports multi-tool calling)
    // Using gpt-4-turbo for robust multi-tool calling support
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      tools: functionSchemas.map(schema => ({
        type: 'function',
        function: schema
      })),
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 1000,
      parallel_tool_calls: true // Explicitly enable parallel/multi-tool calling
    });

    const responseMessage = response.choices[0].message;

    // Check if AI wants to call function(s) - NEW: handles multiple tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;
      console.log(`[AI] ${toolCalls.length} function call(s) requested`);
      
      const results = [];
      let stoppedEarly = false;
      
      // Execute each tool call sequentially
      for (let i = 0; i < toolCalls.length; i++) {
        const toolCall = toolCalls[i];
        const functionName = toolCall.function.name;
        
        let functionArgs;
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error('[AI] Failed to parse function arguments:', parseError);
          results.push({
            functionName,
            functionArgs: {},
            result: { 
              success: false, 
              error: 'INVALID_ARGUMENTS',
              userMessage: 'Failed to parse function arguments'
            }
          });
          continue; // Skip this function, continue with others
        }
        
        console.log(`[AI] Executing function ${i + 1}/${toolCalls.length}:`, functionName);
        
        // Execute the function
        const functionResult = await executeAIFunction(functionName, functionArgs);
        
        results.push({
          functionName,
          functionArgs,
          result: functionResult
        });
        
        // Stop execution if critical function fails
        if (!functionResult.success && shouldStopOnError(functionName)) {
          console.warn('[AI] Critical function failed, stopping execution chain');
          stoppedEarly = true;
          break;
        }
      }
      
      // Check if ALL functions failed
      const anySuccess = results.some(r => r.result.success);
      if (!anySuccess) {
        return {
          success: false,
          message: results[0].result.userMessage || 'All operations failed',
          error: results[0].result.error,
          type: 'error',
          executionCount: results.length,
          totalCalls: toolCalls.length,
          results
        };
      }
      
      // Build natural, conversational summary message
      const successCount = results.filter(r => r.result.success).length;
      let summaryMessage;
      
      if (results.length === 1) {
        // Single function - use its natural message
        summaryMessage = results[0].result.userMessage || 'Done!';
      } else {
        // Multi-function - combine the user messages naturally
        const messages = results
          .filter(r => r.result.success && r.result.userMessage)
          .map(r => r.result.userMessage);
        
        if (messages.length === 0) {
          summaryMessage = stoppedEarly 
            ? 'Completed some operations, but encountered an error'
            : 'Done!';
        } else if (messages.length === 1) {
          summaryMessage = messages[0];
        } else {
          // Combine messages with "and"
          const lastMessage = messages.pop();
          summaryMessage = messages.join(', ') + ' and ' + lastMessage.toLowerCase();
        }
      }
      
      // Return multi-tool result
      return {
        success: true,
        message: summaryMessage,
        type: results.length > 1 ? 'function_chain' : 'function',
        executionCount: results.length,
        totalCalls: toolCalls.length,
        results,
        // Backwards compatibility for single function
        functionCalled: results.length === 1 ? results[0].functionName : undefined,
        functionResult: results.length === 1 ? results[0].result.result : undefined
      };
    }

    // No function call, just return AI's message
    return {
      success: true,
      message: responseMessage.content,
      type: 'text'
    };

  } catch (error) {
    console.error('[AI] Error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('API key')) {
      return {
        success: false,
        message: 'AI service is not configured. Please check your OpenAI API key.',
        error: 'INVALID_API_KEY',
        type: 'error'
      };
    }
    
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return {
        success: false,
        message: 'OpenAI quota exceeded. Please check your billing settings.',
        error: 'QUOTA_EXCEEDED',
        type: 'error'
      };
    }
    
    if (error.message.includes('rate_limit')) {
      return {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        error: 'RATE_LIMIT',
        type: 'error'
      };
    }
    
    return {
      success: false,
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message,
      type: 'error'
    };
  }
}

/**
 * Test AI connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    console.log('[AI] Testing connection to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });
    
    const success = response.choices.length > 0;
    console.log('[AI] Connection test:', success ? 'SUCCESS' : 'FAILED');
    
    return success;
  } catch (error) {
    console.error('[AI] Connection test failed:', error.message);
    return false;
  }
}

