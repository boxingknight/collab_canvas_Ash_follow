import { useState, useCallback } from 'react';
import { sendMessage } from '../services/ai';

/**
 * Custom hook for managing AI chat state and interactions
 * 
 * Provides centralized state management for:
 * - Message history (user, assistant, system messages)
 * - Processing state (loading indicator)
 * - Error handling
 * - Panel expand/collapse state
 * 
 * @returns {Object} AI state and control methods
 */
export function useAI() {
  const [messages, setMessages] = useState([]);
  const [aiMessageHistory, setAIMessageHistory] = useState([]); // For AI service (role + content only)
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  /**
   * Toggle chat panel expanded/collapsed state
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  /**
   * Send command to AI service and handle response
   * 
   * Flow:
   * 1. Add user message to UI history
   * 2. Send to AI service with message history (calls Canvas API functions)
   * 3. Add AI response to UI history
   * 4. Handle errors gracefully
   * 
   * @param {string} text - User's natural language command
   */
  const sendCommand = useCallback(async (text) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Add user message to UI history
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to AI service with message history
      // AI service will automatically call Canvas API functions
      // which will update Firestore and sync to all users
      const response = await sendMessage(aiMessageHistory, text);
      
      // Check if the response was successful
      if (response.success === false) {
        throw new Error(response.message || response.error || 'Failed to process command');
      }
      
      // Update AI message history (for next conversation turn)
      setAIMessageHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: response.message }
      ]);
      
      // Add AI response to UI history - NEW: handle different response types
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        type: response.type || 'text' // 'text', 'function', 'function_chain', or 'error'
      };
      
      // Add multi-function chain data if present
      if (response.type === 'function_chain') {
        aiMessage.executionCount = response.executionCount;
        aiMessage.totalCalls = response.totalCalls;
        aiMessage.results = response.results; // Array of {functionName, functionArgs, result}
      }
      
      // Add single function data if present (backwards compatible)
      if (response.type === 'function' || response.functionCalled) {
        aiMessage.functionCalled = response.functionCalled;
        aiMessage.functionResult = response.functionResult;
        // Also include results array for consistency
        if (response.results) {
          aiMessage.results = response.results;
        }
      }
      
      setMessages(prev => [...prev, aiMessage]);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('AI command error:', err);
      
      // Add error message to UI history
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message || 'Failed to process command. Please try again.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setError(err.message || 'An error occurred');
      setIsProcessing(false);
    }
  }, [aiMessageHistory]);
  
  /**
   * Clear message history and reset AI conversation
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setAIMessageHistory([]);
    setError(null);
  }, []);
  
  return {
    // State
    messages,
    isProcessing,
    error,
    isExpanded,
    
    // Actions
    toggleExpanded,
    sendCommand,
    clearHistory
  };
}

