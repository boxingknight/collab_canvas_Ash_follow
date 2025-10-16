import { useState, useRef, useEffect } from 'react';

/**
 * AICommandInput Component
 * 
 * Text input field for entering AI commands.
 * Features:
 * - Submit on Enter key
 * - Auto-clear after submit
 * - Auto-focus after response
 * - Disabled during processing
 */
export default function AICommandInput({ onSubmit, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  }
  
  function handleKeyDown(e) {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
  
  // Auto-focus when enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  return (
    <form className="ai-command-input" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        className="ai-input"
        placeholder="Ask AI to create or modify shapes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        className="ai-submit-btn"
        disabled={disabled || !value.trim()}
        aria-label="Send command"
      >
        {disabled ? '⏳' : '→'}
      </button>
    </form>
  );
}

