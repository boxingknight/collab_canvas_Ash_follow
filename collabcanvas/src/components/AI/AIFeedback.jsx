/**
 * AIFeedback Component
 * 
 * Displays loading indicator while AI is processing
 * and error messages when commands fail.
 */
export default function AIFeedback({ isProcessing, error }) {
  // Don't render if no feedback to show
  if (!isProcessing && !error) return null;
  
  return (
    <div className="ai-feedback">
      {isProcessing && (
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          <span>AI is thinking...</span>
        </div>
      )}
      
      {error && (
        <div className="ai-error">
          <span className="ai-error-icon">⚠️</span>
          <span className="ai-error-message">{error}</span>
        </div>
      )}
    </div>
  );
}

