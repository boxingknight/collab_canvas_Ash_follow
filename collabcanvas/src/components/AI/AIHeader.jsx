/**
 * AIHeader Component
 * 
 * Collapsible header for AI chat panel.
 * Includes:
 * - AI icon and title
 * - Clear history button (when expanded)
 * - Expand/collapse button
 */
export default function AIHeader({ isExpanded, onToggle, onClear }) {
  return (
    <div className="ai-header" onClick={onToggle}>
      <div className="ai-header-left">
        <div className="ai-icon">🤖</div>
        <h3 className="ai-title">AI Assistant</h3>
      </div>
      
      <div className="ai-header-actions" onClick={(e) => e.stopPropagation()}>
        {isExpanded && (
          <button 
            className="ai-clear-btn"
            onClick={onClear}
            title="Clear history"
            aria-label="Clear history"
          >
            🗑️
          </button>
        )}
        <button 
          className="ai-toggle-btn"
          onClick={onToggle}
          aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
    </div>
  );
}

