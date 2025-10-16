import { useEffect, useMemo } from 'react';

/**
 * Custom hook for centralized keyboard shortcuts management
 * Handles platform detection (Mac vs Windows) and context awareness
 * 
 * @param {Object} handlers - Object containing callback functions for shortcuts
 * @param {Function} handlers.onDuplicate - Called when Cmd/Ctrl+D is pressed
 * @param {Function} handlers.onDelete - Called when Delete/Backspace is pressed
 * @param {Function} handlers.onSelectAll - Called when Cmd/Ctrl+A is pressed
 * @param {Function} handlers.onDeselect - Called when Escape is pressed
 * @param {Function} handlers.onNudge - Called when arrow keys are pressed (direction, delta)
 * @param {Function} handlers.onToolChange - Called when tool shortcut is pressed (toolName)
 * @param {Function} handlers.onBringForward - Called when Cmd/Ctrl+] is pressed
 * @param {Function} handlers.onSendBackward - Called when Cmd/Ctrl+[ is pressed
 * @param {Function} handlers.onBringToFront - Called when Cmd/Ctrl+Shift+] is pressed
 * @param {Function} handlers.onSendToBack - Called when Cmd/Ctrl+Shift+[ is pressed
 * @param {boolean} isTextEditing - If true, most shortcuts are disabled (text input mode)
 * @returns {Object} Platform information (isMac, modKey)
 */
export default function useKeyboard({
  onDuplicate,
  onDelete,
  onSelectAll,
  onDeselect,
  onNudge,
  onToolChange,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  isTextEditing = false
}) {
  // Platform detection - do once on mount
  const platformInfo = useMemo(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? 'metaKey' : 'ctrlKey';
    return { isMac, modKey };
  }, []);

  useEffect(() => {
    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyDown(e) {
      // Don't trigger shortcuts if user is typing in any input/textarea
      // (including AI chat, search boxes, etc.)
      const target = e.target;
      const isTypingInInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('.ai-input'); // Specifically check for AI chat input
      
      if (isTypingInInput) {
        // Allow all native input behavior (typing, delete, arrows, etc.)
        // Don't prevent any keys when user is in an input field
        return;
      }

      // During text editing on canvas, only allow Escape to exit
      if (isTextEditing) {
        if (e.key === 'Escape' && onDeselect) {
          onDeselect();
        }
        return; // Block all other shortcuts during text editing
      }

      const { modKey } = platformInfo;

      // ========== MODIFIER KEY SHORTCUTS ==========
      if (e[modKey]) {
        // Cmd/Ctrl+D: Duplicate
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (onDuplicate) {
            onDuplicate();
          }
          return;
        }

        // Cmd/Ctrl+A: Select All
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          if (onSelectAll) {
            onSelectAll();
          }
          return;
        }

        // Layer Management Shortcuts - DISABLED due to browser conflicts
        // The Cmd/Ctrl+[ and Cmd/Ctrl+Shift+[ shortcuts conflict with browser tab navigation
        // Use the right-click context menu instead for layer operations
        // 
        // if (e.key === ']') {
        //   e.preventDefault();
        //   if (e.shiftKey && onBringToFront) {
        //     onBringToFront();
        //   } else if (onBringForward) {
        //     onBringForward();
        //   }
        //   return;
        // }
        //
        // if (e.key === '[') {
        //   e.preventDefault();
        //   if (e.shiftKey && onSendToBack) {
        //     onSendToBack();
        //   } else if (onSendBackward) {
        //     onSendBackward();
        //   }
        //   return;
        // }
      }

      // ========== ARROW KEYS (with Shift modifier) ==========
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (onNudge) {
          const delta = e.shiftKey ? 10 : 1; // Shift+Arrow = 10px, Arrow = 1px
          const direction = e.key.replace('Arrow', '').toLowerCase(); // 'up', 'down', 'left', 'right'
          onNudge(direction, delta);
        }
        return;
      }

      // ========== ESCAPE KEY ==========
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onDeselect) {
          onDeselect();
        }
        return;
      }

      // ========== DELETE KEYS ==========
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (onDelete) {
          onDelete();
        }
        return;
      }

      // ========== TOOL SHORTCUTS (no modifiers) ==========
      // Only trigger if no modifier keys are pressed
      if (!e[modKey] && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const toolMap = {
          'v': 'pan',      // V: Pan mode
          'V': 'pan',
          'm': 'move',     // M: Move mode
          'M': 'move',
          'd': 'draw',     // D: Draw mode (generic)
          'D': 'draw',
          'r': 'rectangle', // R: Rectangle
          'R': 'rectangle',
          'c': 'circle',   // C: Circle
          'C': 'circle',
          'l': 'line',     // L: Line
          'L': 'line',
          't': 'text',     // T: Text
          'T': 'text'
        };

        if (toolMap[e.key]) {
          e.preventDefault();
          if (onToolChange) {
            onToolChange(toolMap[e.key]);
          }
          return;
        }
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    platformInfo,
    isTextEditing,
    onDuplicate,
    onDelete,
    onSelectAll,
    onDeselect,
    onNudge,
    onToolChange,
    onBringForward,
    onSendBackward,
    onBringToFront,
    onSendToBack
  ]);

  return platformInfo;
}

