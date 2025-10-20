import { useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import AIHeader from './AIHeader';
import AIHistory from './AIHistory';
import AIFeedback from './AIFeedback';
import AICommandInput from './AICommandInput';

/**
 * AIChat Component
 * 
 * Main AI chat interface - bottom-right collapsible panel.
 * 
 * Features:
 * - Collapsible panel (expand/collapse)
 * - Message history display
 * - Command input field
 * - Loading and error feedback
 * - Keyboard shortcuts (Cmd+K, /)
 * - Real-time sync via Canvas API
 * 
 * @param {string|null} canvasId - Current canvas ID (null if not on a canvas)
 */
export default function AIChat({ canvasId }) {
  const {
    messages,
    isProcessing,
    error,
    isExpanded,
    toggleExpanded,
    sendCommand,
    clearHistory
  } = useAI(canvasId);
  
  const chatRef = useRef(null);
  const inputFocusedRef = useRef(false);
  
  // Track if user is typing in the input
  useEffect(() => {
    function handleFocus(e) {
      if (e.target.classList.contains('ai-input')) {
        inputFocusedRef.current = true;
      }
    }
    
    function handleBlur(e) {
      if (e.target.classList.contains('ai-input')) {
        inputFocusedRef.current = false;
      }
    }
    
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    function handleShortcut(e) {
      // Don't trigger shortcuts if user is typing in text input
      const isTypingInInput = 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable;
      
      // Cmd+K or Ctrl+K - Always works (even overrides browser)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleExpanded();
        return;
      }
      
      // / key - Only if not typing
      if (e.key === '/' && !isTypingInInput) {
        e.preventDefault();
        if (!isExpanded) {
          toggleExpanded();
        }
      }
    }
    
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleExpanded, isExpanded]);
  
  return (
    <div 
      ref={chatRef}
      className={`ai-chat ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      <AIHeader 
        isExpanded={isExpanded}
        onToggle={toggleExpanded}
        onClear={clearHistory}
      />
      
      {isExpanded && (
        <>
          <AIHistory messages={messages} />
          <AIFeedback 
            isProcessing={isProcessing}
            error={error}
          />
          <AICommandInput 
            onSubmit={sendCommand}
            disabled={isProcessing}
          />
        </>
      )}
    </div>
  );
}

