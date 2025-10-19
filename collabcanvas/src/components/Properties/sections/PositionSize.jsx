// PositionSize.jsx - Position and size controls
import NumberInput from '../inputs/NumberInput';

function PositionSize({ shape, onUpdate }) {
  if (!shape) return null;

  const handleUpdate = (property, value) => {
    onUpdate(shape.id, { [property]: value });
  };

  // Different layouts for different shape types
  const isCircle = shape.type === 'circle';
  const isLine = shape.type === 'line';
  const isText = shape.type === 'text';
  const isRectangle = shape.type === 'rectangle';

  if (isLine) {
    // Lines handled separately in LineProperties
    return null;
  }

  return (
    <div className="properties-section">
      <h4 className="properties-section-title">POSITION & SIZE</h4>
      
      <div className="properties-grid">
        {/* Position */}
        <NumberInput
          label="X"
          value={Math.round(shape.x || 0)}
          onChange={(val) => handleUpdate('x', val)}
          min={0}
          max={5000}
          step={1}
        />
        
        <NumberInput
          label="Y"
          value={Math.round(shape.y || 0)}
          onChange={(val) => handleUpdate('y', val)}
          min={0}
          max={5000}
          step={1}
        />
      </div>

      {/* Size - different for circle vs rectangle */}
      <div className="properties-grid">
        {isCircle ? (
          <NumberInput
            label="R"
            value={Math.round(shape.radius || 50)}
            onChange={(val) => handleUpdate('radius', val)}
            min={5}
            max={2500}
            step={1}
            suffix="px"
          />
        ) : (
          <>
            <NumberInput
              label="W"
              value={Math.round(shape.width || 0)}
              onChange={(val) => handleUpdate('width', val)}
              min={10}
              max={5000}
              step={1}
            />
            
            <NumberInput
              label="H"
              value={Math.round(shape.height || 0)}
              onChange={(val) => handleUpdate('height', val)}
              min={10}
              max={5000}
              step={1}
            />
          </>
        )}
      </div>

      {/* Rotation */}
      <div className="properties-grid">
        <NumberInput
          label="R"
          value={Math.round((shape.rotation || 0) % 360)}
          onChange={(val) => handleUpdate('rotation', val % 360)}
          min={0}
          max={359}
          step={1}
          suffix="°"
        />
      </div>
    </div>
  );
}

export default PositionSize;

