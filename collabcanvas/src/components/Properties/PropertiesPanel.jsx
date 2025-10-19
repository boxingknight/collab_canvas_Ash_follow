// PropertiesPanel.jsx - Main properties panel container
import { useMemo } from 'react';
import NoSelection from './sections/NoSelection';
import PositionSize from './sections/PositionSize';
import Appearance from './sections/Appearance';
import AlignmentTools from './sections/AlignmentTools';
import './PropertiesPanel.css';

function PropertiesPanel({ selectedShapes = [], onUpdateShape }) {
  // Determine what to show
  const selectionCount = selectedShapes.length;
  const shape = selectionCount === 1 ? selectedShapes[0] : null;
  const isMultiSelect = selectionCount > 1;

  // Memoize shape type for performance
  const shapeType = useMemo(() => {
    if (!shape) return null;
    return shape.type;
  }, [shape?.type]);

  return (
    <div className="properties-panel">
      <div className="properties-panel-header">
        <h3 className="properties-panel-title">PROPERTIES</h3>
      </div>

      <div className="properties-panel-content">
        {selectionCount === 0 && (
          <NoSelection />
        )}

        {selectionCount === 1 && (
          <>
            {/* Shape type indicator */}
            <div className="shape-type-indicator">
              <span className="shape-type-icon">
                {shapeType === 'rectangle' && '▭'}
                {shapeType === 'circle' && '○'}
                {shapeType === 'line' && '╱'}
                {shapeType === 'text' && 'T'}
              </span>
              <span className="shape-type-name">
                {shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1)}
              </span>
            </div>

            {/* Position & Size */}
            <PositionSize
              shape={shape}
              onUpdate={onUpdateShape}
            />

            {/* Appearance (Color) */}
            <Appearance
              shape={shape}
              onUpdate={onUpdateShape}
            />

            {/* Alignment Tools */}
            <AlignmentTools
              selectedShapeIds={selectedShapes.map(s => s.id)}
            />

            {/* More sections will be added in subsequent phases */}
          </>
        )}

        {isMultiSelect && (
          <div className="multi-select-state">
            <div className="multi-select-icon">⚡</div>
            <h3 className="multi-select-title">{selectionCount} shapes selected</h3>
            <p className="multi-select-text">Multi-select editing coming in Phase 7</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;

