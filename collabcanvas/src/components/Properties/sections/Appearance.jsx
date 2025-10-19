// Appearance.jsx - Color and appearance controls
import ColorPicker from '../inputs/ColorPicker';

function Appearance({ shape, onUpdate }) {
  if (!shape) return null;

  const handleColorChange = (color) => {
    onUpdate(shape.id, { color });
  };

  // Different label for lines (stroke) vs shapes (fill)
  const colorLabel = shape.type === 'line' ? 'Stroke' : 'Fill';

  return (
    <div className="properties-section">
      <h4 className="properties-section-title">APPEARANCE</h4>
      
      <ColorPicker
        label={colorLabel}
        value={shape.color || '#000000'}
        onChange={handleColorChange}
      />
    </div>
  );
}

export default Appearance;

