// MultiSelectPositionSize.jsx - Position and size editing for multi-select
import { useMemo } from 'react';
import { detectMixedValue } from '../utils/mixedValues';
import { batchUpdateShapes } from '../utils/batchUpdate';
import NumberInput from '../inputs/NumberInput';

function MultiSelectPositionSize({ shapes, onUpdate }) {
  // Detect mixed values for each property
  const xMixed = useMemo(() => detectMixedValue(shapes, 'x'), [shapes]);
  const yMixed = useMemo(() => detectMixedValue(shapes, 'y'), [shapes]);
  const widthMixed = useMemo(() => detectMixedValue(shapes, 'width'), [shapes]);
  const heightMixed = useMemo(() => detectMixedValue(shapes, 'height'), [shapes]);
  const rotationMixed = useMemo(() => detectMixedValue(shapes, 'rotation'), [shapes]);

  // Check if all selected shapes are circles (for special radius display)
  const allCircles = useMemo(() => {
    return shapes.length > 0 && shapes.every(s => s.type === 'circle');
  }, [shapes]);

  /**
   * Handle batch update for a property
   * @param {string} property - Property to update
   * @param {number} value - New value
   */
  const handleBatchUpdate = async (property, value) => {
    if (!shapes || shapes.length === 0) return;

    const shapeIds = shapes.map(s => s.id);
    
    try {
      const result = await batchUpdateShapes(shapeIds, property, value);
      
      if (!result.success) {
        console.error('Batch update failed:', result.error);
      }
    } catch (error) {
      console.error('Error in batch update:', error);
    }
  };

  /**
   * Handle circle radius update (updates both width and height)
   * @param {number} radius - New radius value
   */
  const handleRadiusUpdate = async (radius) => {
    if (!shapes || shapes.length === 0) return;

    const diameter = radius * 2;
    const shapeIds = shapes.map(s => s.id);

    try {
      // Update both width and height for circles
      for (const shapeId of shapeIds) {
        await onUpdate(shapeId, { width: diameter, height: diameter });
      }
    } catch (error) {
      console.error('Error updating circle radius:', error);
    }
  };

  return (
    <div className="properties-section">
      <span className="properties-section-title">Position & Size</span>
      
      {/* Position: X, Y */}
      <div className="properties-grid">
        <NumberInput
          label="X"
          value={xMixed.isMixed ? "" : (xMixed.commonValue || 0)}
          onChange={(val) => handleBatchUpdate('x', val)}
          isMixed={xMixed.isMixed}
          placeholder="Mixed"
          suffix="px"
          min={-10000}
          max={10000}
          step={1}
        />
        <NumberInput
          label="Y"
          value={yMixed.isMixed ? "" : (yMixed.commonValue || 0)}
          onChange={(val) => handleBatchUpdate('y', val)}
          isMixed={yMixed.isMixed}
          placeholder="Mixed"
          suffix="px"
          min={-10000}
          max={10000}
          step={1}
        />
      </div>

      {/* Size: W, H or Radius for circles */}
      {allCircles ? (
        // For circles, show radius instead of W/H
        <NumberInput
          label="Radius"
          value={widthMixed.isMixed ? "" : Math.round((widthMixed.commonValue || 100) / 2)}
          onChange={handleRadiusUpdate}
          isMixed={widthMixed.isMixed}
          placeholder="Mixed"
          suffix="px"
          min={5}
          max={2500}
          step={1}
        />
      ) : (
        // For other shapes, show W and H
        <div className="properties-grid">
          <NumberInput
            label="W"
            value={widthMixed.isMixed ? "" : (widthMixed.commonValue || 100)}
            onChange={(val) => handleBatchUpdate('width', val)}
            isMixed={widthMixed.isMixed}
            placeholder="Mixed"
            suffix="px"
            min={1}
            max={5000}
            step={1}
          />
          <NumberInput
            label="H"
            value={heightMixed.isMixed ? "" : (heightMixed.commonValue || 100)}
            onChange={(val) => handleBatchUpdate('height', val)}
            isMixed={heightMixed.isMixed}
            placeholder="Mixed"
            suffix="px"
            min={1}
            max={5000}
            step={1}
          />
        </div>
      )}

      {/* Rotation */}
      <NumberInput
        label="Rotation"
        value={rotationMixed.isMixed ? "" : (rotationMixed.commonValue || 0)}
        onChange={(val) => handleBatchUpdate('rotation', val % 360)}
        isMixed={rotationMixed.isMixed}
        placeholder="Mixed"
        suffix="°"
        min={0}
        max={359}
        step={1}
      />
    </div>
  );
}

export default MultiSelectPositionSize;

