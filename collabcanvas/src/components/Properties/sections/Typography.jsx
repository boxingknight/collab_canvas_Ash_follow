// Typography.jsx - Text formatting controls
function Typography({ shape, onUpdate }) {
  if (!shape || shape.type !== 'text') {
    return null;
  }

  const isBold = shape.fontWeight === 'bold' || shape.fontWeight === 'bolder';
  const fontSize = shape.fontSize || 16;
  const textAlign = shape.align || 'left';

  const toggleFormat = (property, onValue, offValue) => {
    const currentValue = shape[property];
    const newValue = currentValue === onValue ? offValue : onValue;
    onUpdate(shape.id, { [property]: newValue });
  };

  return (
    <div className="properties-section">
      <h4 className="properties-section-title">TYPOGRAPHY</h4>
      
      {/* Font Size */}
      <div className="typography-row">
        <label>Size</label>
        <select
          className="typography-select"
          value={fontSize}
          onChange={(e) => onUpdate(shape.id, { fontSize: parseInt(e.target.value) })}
        >
          {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      </div>

      {/* Format Buttons */}
      <div className="typography-row">
        <label>Format</label>
        <div className="format-buttons">
          <button
            className={`format-button ${isBold ? 'active' : ''}`}
            onClick={() => toggleFormat('fontWeight', 'bold', 'normal')}
            title="Bold"
            type="button"
          >
            <strong>B</strong>
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="typography-row">
        <label>Align</label>
        <div className="format-buttons">
          <button
            className={`format-button ${textAlign === 'left' ? 'active' : ''}`}
            onClick={() => onUpdate(shape.id, { align: 'left' })}
            title="Align Left"
            type="button"
          >
            ◀
          </button>
          <button
            className={`format-button ${textAlign === 'center' ? 'active' : ''}`}
            onClick={() => onUpdate(shape.id, { align: 'center' })}
            title="Align Center"
            type="button"
          >
            ▬
          </button>
          <button
            className={`format-button ${textAlign === 'right' ? 'active' : ''}`}
            onClick={() => onUpdate(shape.id, { align: 'right' })}
            title="Align Right"
            type="button"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default Typography;

