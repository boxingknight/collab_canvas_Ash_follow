import { useEffect, useRef } from 'react';

/**
 * AIHistory Component
 * 
 * Displays scrollable message history.
 * Shows example commands when empty.
 * Auto-scrolls to bottom on new messages.
 */
export default function AIHistory({ messages }) {
  const historyRef = useRef(null);
  
  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Show examples if no messages
  if (messages.length === 0) {
    return (
      <div className="ai-history empty">
        <AIExamples />
      </div>
    );
  }
  
  return (
    <div ref={historyRef} className="ai-history">
      {messages.map(message => (
        <AIMessage 
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}

/**
 * AIMessage Component
 * 
 * Individual message in the chat history.
 * Handles different message types:
 * - text: Simple text message
 * - function: Single function execution
 * - function_chain: Multiple function executions
 * - error: Error message
 */
function AIMessage({ message }) {
  const { role, content, timestamp, type, executionCount, totalCalls, results } = message;
  
  // Multi-function chain - show natural, conversational message
  if (type === 'function_chain' && results && results.length > 1) {
    // Check if any operations failed
    const hasErrors = results.some(r => !r.result.success);
    
    return (
      <div className={`ai-message ${role}`}>
        <div className="ai-message-content">
          {content}
          {hasErrors && (
            <div className="ai-error-note">
              (Note: Some operations encountered errors)
            </div>
          )}
        </div>
        <div className="ai-message-timestamp">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  }
  
  // Single function - show natural message
  if ((type === 'function' || message.functionCalled) && results && results.length === 1) {
    return (
      <div className={`ai-message ${role}`}>
        <div className="ai-message-content">
          {content}
        </div>
        <div className="ai-message-timestamp">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  }
  
  // Text message (default)
  return (
    <div className={`ai-message ${role}`}>
      <div className="ai-message-content">
        {content}
      </div>
      <div className="ai-message-timestamp">
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}

/**
 * AIExamples Component
 * 
 * Shows example commands when chat is empty.
 * Helps users understand what AI can do.
 */
function AIExamples() {
  const examples = [
    "Create a blue rectangle at the center",
    "Make a red circle at position 1000, 1000",
    "Create a login form",
    "Arrange selected shapes in a horizontal row",
    "Change the selected shape to green",
    "Delete all circles"
  ];
  
  return (
    <div className="ai-examples">
      <p className="ai-examples-title">Try asking me to:</p>
      <ul className="ai-examples-list">
        {examples.slice(0, 4).map((example, i) => (
          <li key={i} className="ai-example-item">
            &ldquo;{example}&rdquo;
          </li>
        ))}
      </ul>
      <p className="ai-examples-hint">
        Tip: Press <kbd>Cmd+K</kbd> or <kbd>/</kbd> to focus input
      </p>
    </div>
  );
}

