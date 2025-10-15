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

    console.log('[AI] Sending message to OpenAI:', userMessage);

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

      console.log('[AI] Function call requested:', functionName, functionArgs);

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

      console.log('[AI] Getting follow-up response after function execution');

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
    console.error('[AI] Error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('API key')) {
      return {
        success: false,
        message: 'AI service is not configured. Please check your OpenAI API key.',
        error: 'INVALID_API_KEY'
      };
    }
    
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return {
        success: false,
        message: 'OpenAI quota exceeded. Please check your billing settings.',
        error: 'QUOTA_EXCEEDED'
      };
    }
    
    if (error.message.includes('rate_limit')) {
      return {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        error: 'RATE_LIMIT'
      };
    }
    
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

