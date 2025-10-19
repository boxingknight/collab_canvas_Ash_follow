// MultiSelectTypography.jsx - Typography editing for multi-select text shapes
import { useMemo } from 'react';
import { detectMixedValue, detectMixedBoolean } from '../utils/mixedValues';
import { batchUpdateShapes } from '../utils/batchUpdate';
import NumberInput from '../inputs/NumberInput';

function MultiSelectTypography({ shapes, onUpdate }) {
  // Filter only text shapes
  const textShapes = useMemo(() => {
    return shapes.filter(s => s.type === 'text');
  }, [shapes]);

  // Detect mixed values for typography properties (MUST be called before early return)
  const fontSizeMixed = useMemo(() => detectMixedValue(textShapes, 'fontSize'), [textShapes]);
  const boldMixed = useMemo(() => detectMixedBoolean(textShapes, 'fontWeight', 'bold'), [textShapes]);
  const italicMixed = useMemo(() => detectMixedBoolean(textShapes, 'fontStyle', 'italic'), [textShapes]);
  const underlineMixed = useMemo(() => detectMixedBoolean(textShapes, 'textDecoration', 'underline'), [textShapes]);
  const alignLeftMixed = useMemo(() => detectMixedBoolean(textShapes, 'align', 'left'), [textShapes]);
  const alignCenterMixed = useMemo(() => detectMixedBoolean(textShapes, 'align', 'center'), [textShapes]);
  const alignRightMixed = useMemo(() => detectMixedBoolean(textShapes, 'align', 'right'), [textShapes]);

  // Don't render if no text shapes selected (early return AFTER all hooks)
  if (textShapes.length === 0) {
    return null;
  }

  /**
   * Handle batch update for a property
   * @param {string} property - Property to update
   * @param {any} value - New value
   */
  const handleBatchUpdate = async (property, value) => {
    if (!textShapes || textShapes.length === 0) return;

    const shapeIds = textShapes.map(s => s.id);
    
    try {
      const result = await batchUpdateShapes(shapeIds, property, value);
      
      if (!result.success) {
        console.error('Typography batch update failed:', result.error);
      }
    } catch (error) {
      console.error('Error in typography batch update:', error);
    }
  };

  /**
   * Toggle a boolean property (bold, italic, etc.)
   * @param {string} property - Property to toggle
   * @param {any} activeValue - Value when active
   * @param {any} inactiveValue - Value when inactive
   * @param {boolean} isCurrentlyActive - Current state
   */
  const handleToggle = async (property, activeValue, inactiveValue, isCurrentlyActive) => {
    const newValue = isCurrentlyActive ? inactiveValue : activeValue;
    await handleBatchUpdate(property, newValue);
  };

  return (
    <div className="properties-section">
      <span className="properties-section-title">
        Typography ({textShapes.length} text {textShapes.length === 1 ? 'shape' : 'shapes'})
      </span>
      
      {/* Font Size */}
      <NumberInput
        label="Size"
        value={fontSizeMixed.isMixed ? "" : (fontSizeMixed.commonValue || 16)}
        onChange={(val) => handleBatchUpdate('fontSize', val)}
        isMixed={fontSizeMixed.isMixed}
        placeholder="Mixed"
        suffix="px"
        min={8}
        max={200}
        step={1}
      />

      {/* Format Buttons Row 1: Bold, Italic, Underline */}
      <div className="typography-row">
        <span className="typography-label">Format</span>
        <div className="format-buttons">
          <button
            className={`format-button ${boldMixed.isMixed ? 'mixed' : boldMixed.isActive ? 'active' : ''}`}
            onClick={() => handleToggle('fontWeight', 'bold', 'normal', boldMixed.isActive)}
            title="Bold"
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            className={`format-button ${italicMixed.isMixed ? 'mixed' : italicMixed.isActive ? 'active' : ''}`}
            onClick={() => handleToggle('fontStyle', 'italic', 'normal', italicMixed.isActive)}
            title="Italic"
            type="button"
          >
            <em>I</em>
          </button>
          <button
            className={`format-button ${underlineMixed.isMixed ? 'mixed' : underlineMixed.isActive ? 'active' : ''}`}
            onClick={() => handleToggle('textDecoration', 'underline', 'none', underlineMixed.isActive)}
            title="Underline"
            type="button"
          >
            <u>U</u>
          </button>
        </div>
      </div>

      {/* Format Buttons Row 2: Text Alignment */}
      <div className="typography-row">
        <span className="typography-label">Align</span>
        <div className="format-buttons">
          <button
            className={`format-button ${alignLeftMixed.isMixed ? 'mixed' : alignLeftMixed.isActive ? 'active' : ''}`}
            onClick={() => handleBatchUpdate('align', 'left')}
            title="Align Left"
            type="button"
          >
            ←
          </button>
          <button
            className={`format-button ${alignCenterMixed.isMixed ? 'mixed' : alignCenterMixed.isActive ? 'active' : ''}`}
            onClick={() => handleBatchUpdate('align', 'center')}
            title="Align Center"
            type="button"
          >
            ↔
          </button>
          <button
            className={`format-button ${alignRightMixed.isMixed ? 'mixed' : alignRightMixed.isActive ? 'active' : ''}`}
            onClick={() => handleBatchUpdate('align', 'right')}
            title="Align Right"
            type="button"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiSelectTypography;

