import { useState, useCallback, useRef } from 'react';
import { restoreOperation } from '../utils/historyOperations';

/**
 * useHistory Hook
 * Manages undo/redo history stack for canvas operations
 * 
 * Features:
 * - Tracks past operations in a stack
 * - Maintains future operations for redo
 * - Limits history size to prevent memory issues
 * - Provides undo/redo with Firebase sync
 */
export function useHistory(canvasAPI) {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  
  // Maximum number of operations to keep in history
  const MAX_HISTORY_SIZE = 50;
  
  // Flag to prevent recording operations during undo/redo
  const isRestoringRef = useRef(false);
  
  /**
   * Record an operation in history
   * @param {Object} operation - The operation to record
   */
  const recordOperation = useCallback((operation) => {
    // Don't record operations that happen during undo/redo
    if (isRestoringRef.current) {
      return;
    }
    
    // Add to past stack (limit size)
    setPast(prevPast => {
      const newPast = [...prevPast, operation];
      
      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        // Optional: Show warning once
        if (newPast.length === MAX_HISTORY_SIZE + 1) {
          console.info('History limit reached (50 operations), oldest operation removed');
        }
        return newPast.slice(-MAX_HISTORY_SIZE);
      }
      
      return newPast;
    });
    
    // Clear future stack (can't redo after new operation)
    setFuture([]);
  }, []);
  
  /**
   * Undo the last operation
   * @returns {Promise<boolean>} True if undo was successful
   */
  const undo = useCallback(async () => {
    if (past.length === 0) {
      console.log('Nothing to undo');
      return false;
    }
    
    // Get last operation
    const operation = past[past.length - 1];
    
    // Set restoring flag to prevent recording
    isRestoringRef.current = true;
    
    try {
      // Restore operation (undo direction)
      const result = await restoreOperation(operation, 'undo', canvasAPI);
      
      if (result.success) {
        // Move operation from past to future
        setPast(prevPast => prevPast.slice(0, -1));
        setFuture(prevFuture => [operation, ...prevFuture]);
        
        console.log('Undo successful:', operation.type);
        return true;
      } else {
        console.warn('Undo failed:', result.reason);
        // Still remove from past even if restore failed (shape might be gone)
        setPast(prevPast => prevPast.slice(0, -1));
        return false;
      }
    } catch (error) {
      console.error('Undo error:', error);
      return false;
    } finally {
      // Reset restoring flag
      isRestoringRef.current = false;
    }
  }, [past, canvasAPI]);
  
  /**
   * Redo the last undone operation
   * @returns {Promise<boolean>} True if redo was successful
   */
  const redo = useCallback(async () => {
    if (future.length === 0) {
      console.log('Nothing to redo');
      return false;
    }
    
    // Get next operation
    const operation = future[0];
    
    // Set restoring flag to prevent recording
    isRestoringRef.current = true;
    
    try {
      // Restore operation (redo direction)
      const result = await restoreOperation(operation, 'redo', canvasAPI);
      
      if (result.success) {
        // Move operation from future to past
        setFuture(prevFuture => prevFuture.slice(1));
        setPast(prevPast => [...prevPast, operation]);
        
        console.log('Redo successful:', operation.type);
        return true;
      } else {
        console.warn('Redo failed:', result.reason);
        // Still remove from future even if restore failed
        setFuture(prevFuture => prevFuture.slice(1));
        return false;
      }
    } catch (error) {
      console.error('Redo error:', error);
      return false;
    } finally {
      // Reset restoring flag
      isRestoringRef.current = false;
    }
  }, [future, canvasAPI]);
  
  /**
   * Check if undo is available
   * @returns {boolean} True if there are operations to undo
   */
  const canUndo = past.length > 0;
  
  /**
   * Check if redo is available
   * @returns {boolean} True if there are operations to redo
   */
  const canRedo = future.length > 0;
  
  /**
   * Get current history size
   * @returns {number} Number of operations in history
   */
  const historySize = past.length;
  
  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);
  
  return {
    recordOperation,
    undo,
    redo,
    canUndo,
    canRedo,
    historySize,
    clearHistory,
    isRestoring: isRestoringRef.current
  };
}

