// ColorPicker.jsx - Color picker with hex input, swatches, recent colors, and mixed value support
import { useState, useEffect, useRef } from 'react';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
  '#6C5CE7', '#00B894', '#FDCB6E', '#E17055', '#74B9FF',
  '#A29BFE'
];

const MAX_RECENT_COLORS = 8;
const RECENT_COLORS_KEY = 'collabcanvas_recent_colors';

function ColorPicker({ value, onChange, label = 'Color', showMixedIndicator = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hex, setHex] = useState(value || '#000000');
  const [recentColors, setRecentColors] = useState([]);
  const pickerRef = useRef(null);

  // Load recent colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent colors:', e);
      }
    }
  }, []);

  // Sync with prop value
  useEffect(() => {
    if (value && value !== hex) {
      setHex(value);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const saveRecentColor = (color) => {
    const filtered = recentColors.filter(c => c !== color);
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    setRecentColors(updated);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  };

  const handleHexChange = (e) => {
    let newHex = e.target.value;
    
    // Add # if missing
    if (!newHex.startsWith('#')) {
      newHex = '#' + newHex;
    }

    setHex(newHex);

    // Validate and apply if valid
    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      onChange(newHex);
      saveRecentColor(newHex);
    }
  };

  const handleSwatchClick = (color) => {
    setHex(color);
    onChange(color);
    saveRecentColor(color);
    setIsOpen(false);
  };

  return (
    <div className="color-picker-container" ref={pickerRef}>
      <label className="color-picker-label">{label}</label>
      
      {/* Current Color Swatch (clickable) */}
      <button
        className={`color-swatch-button ${showMixedIndicator ? 'mixed' : ''}`}
        style={showMixedIndicator ? {} : { backgroundColor: hex }}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {showMixedIndicator ? (
          <div className="mixed-color-indicator">
            <div className="mixed-color-pattern"></div>
            <span className="color-swatch-hex">Mixed</span>
          </div>
        ) : (
          <span className="color-swatch-hex">{hex}</span>
        )}
      </button>

      {/* Color Picker Modal */}
      {isOpen && (
        <div className="color-picker-modal">
          {/* Hex Input */}
          <div className="color-picker-section">
            <label className="color-picker-section-title">Hex</label>
            <input
              type="text"
              className="color-picker-hex-input"
              value={hex}
              onChange={handleHexChange}
              placeholder="#000000"
              maxLength={7}
            />
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="color-picker-section">
              <label className="color-picker-section-title">Recent</label>
              <div className="color-swatches-grid">
                {recentColors.map((color, index) => (
                  <button
                    key={`recent-${index}`}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => handleSwatchClick(color)}
                    title={color}
                    type="button"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset Colors */}
          <div className="color-picker-section">
            <label className="color-picker-section-title">Presets</label>
            <div className="color-swatches-grid">
              {PRESET_COLORS.map((color, index) => (
                <button
                  key={`preset-${index}`}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => handleSwatchClick(color)}
                  title={color}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;

