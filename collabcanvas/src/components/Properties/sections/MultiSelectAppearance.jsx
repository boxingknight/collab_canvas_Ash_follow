// MultiSelectAppearance.jsx - Appearance editing for multi-select
import { useMemo, useState, useEffect } from 'react';
import { detectMixedValue } from '../utils/mixedValues';
import { batchUpdateShapes } from '../utils/batchUpdate';
import ColorPicker from '../inputs/ColorPicker';

function MultiSelectAppearance({ shapes, onUpdate }) {
  // Detect mixed color values
  const colorMixed = useMemo(() => detectMixedValue(shapes, 'color'), [shapes]);
  
  // Local state for color
  const [isMixed, setIsMixed] = useState(false);
  const [commonColor, setCommonColor] = useState(null);
  
  // Update local state when shapes change
  useEffect(() => {
    setIsMixed(colorMixed.isMixed);
    setCommonColor(colorMixed.commonValue);
  }, [colorMixed]);

  /**
   * Handle color change for multiple shapes
   * @param {string} newColor - New color hex value
   */
  const handleColorChange = async (newColor) => {
    if (!shapes || shapes.length === 0) return;

    const shapeIds = shapes.map(s => s.id);
    
    try {
      const result = await batchUpdateShapes(shapeIds, 'color', newColor);
      
      if (result.success) {
        // Update local state immediately
        setIsMixed(false);
        setCommonColor(newColor);
      } else {
        console.error('Color batch update failed:', result.error);
      }
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  return (
    <div className="properties-section">
      <span className="properties-section-title">Appearance</span>
      
      <ColorPicker
        label="Fill"
        value={commonColor || '#000000'}
        onChange={handleColorChange}
        showMixedIndicator={isMixed}
      />
    </div>
  );
}

export default MultiSelectAppearance;

