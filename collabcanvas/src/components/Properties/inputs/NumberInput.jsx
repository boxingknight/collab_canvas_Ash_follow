// NumberInput.jsx - Validated numeric input with debouncing
import { useState, useEffect, useCallback } from 'react';

function NumberInput({ 
  value, 
  onChange, 
  min = -Infinity, 
  max = Infinity, 
  step = 1,
  label,
  suffix = '',
  disabled = false
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Validate
    const num = parseFloat(newValue);
    if (isNaN(num)) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
  };

  const handleBlur = () => {
    const num = parseFloat(localValue);
    
    if (isNaN(num)) {
      // Reset to previous valid value
      setLocalValue(value);
      setIsValid(true);
      return;
    }

    // Clamp to min/max
    const clamped = Math.max(min, Math.min(max, num));
    
    if (clamped !== num) {
      setLocalValue(clamped);
    }

    // Only call onChange if value actually changed
    if (clamped !== value) {
      onChange(clamped);
    }

    setIsValid(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="number-input-group">
      {label && <label className="number-input-label">{label}</label>}
      <div className="number-input-wrapper">
        <input
          type="number"
          className={`number-input ${!isValid ? 'invalid' : ''}`}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {suffix && <span className="number-input-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

export default NumberInput;

