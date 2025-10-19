// AlignmentTools.jsx - Visual alignment buttons
import * as canvasAPI from '../../../services/canvasAPI';

function AlignmentTools({ selectedShapeIds }) {
  if (!selectedShapeIds || selectedShapeIds.length === 0) {
    return null;
  }

  const handleAlign = async (operation) => {
    try {
      let result;
      switch (operation) {
        case 'left':
          result = await canvasAPI.alignLeft(selectedShapeIds);
          break;
        case 'center-h':
          result = await canvasAPI.alignCenterHorizontal(selectedShapeIds);
          break;
        case 'right':
          result = await canvasAPI.alignRight(selectedShapeIds);
          break;
        case 'top':
          result = await canvasAPI.alignTop(selectedShapeIds);
          break;
        case 'middle-v':
          result = await canvasAPI.alignMiddleVertical(selectedShapeIds);
          break;
        case 'bottom':
          result = await canvasAPI.alignBottom(selectedShapeIds);
          break;
        case 'distribute-h':
          result = await canvasAPI.distributeHorizontally(selectedShapeIds);
          break;
        case 'distribute-v':
          result = await canvasAPI.distributeVertically(selectedShapeIds);
          break;
        case 'center-canvas':
          result = await canvasAPI.centerOnCanvas(selectedShapeIds);
          break;
        default:
          console.warn('Unknown alignment operation:', operation);
      }

      if (result && !result.success) {
        console.error('Alignment failed:', result.message);
      }
    } catch (error) {
      console.error('Alignment error:', error);
    }
  };

  const distributeDisabled = selectedShapeIds.length < 3;

  return (
    <div className="properties-section">
      <h4 className="properties-section-title">ALIGNMENT</h4>
      
      {/* Horizontal Alignment */}
      <div className="alignment-group">
        <label className="alignment-label">Horizontal</label>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={() => handleAlign('left')}
            title="Align Left"
            type="button"
          >
            ◀
          </button>
          <button
            className="alignment-button"
            onClick={() => handleAlign('center-h')}
            title="Align Center Horizontal"
            type="button"
          >
            ▬
          </button>
          <button
            className="alignment-button"
            onClick={() => handleAlign('right')}
            title="Align Right"
            type="button"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div className="alignment-group">
        <label className="alignment-label">Vertical</label>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={() => handleAlign('top')}
            title="Align Top"
            type="button"
          >
            ▲
          </button>
          <button
            className="alignment-button"
            onClick={() => handleAlign('middle-v')}
            title="Align Middle Vertical"
            type="button"
          >
            ▬
          </button>
          <button
            className="alignment-button"
            onClick={() => handleAlign('bottom')}
            title="Align Bottom"
            type="button"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Distribute */}
      <div className="alignment-group">
        <label className="alignment-label">Distribute</label>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={() => handleAlign('distribute-h')}
            disabled={distributeDisabled}
            title={distributeDisabled ? 'Select 3+ shapes' : 'Distribute Horizontally'}
            type="button"
          >
            ↔
          </button>
          <button
            className="alignment-button"
            onClick={() => handleAlign('distribute-v')}
            disabled={distributeDisabled}
            title={distributeDisabled ? 'Select 3+ shapes' : 'Distribute Vertically'}
            type="button"
          >
            ↕
          </button>
        </div>
      </div>

      {/* Center on Canvas */}
      <div className="alignment-group">
        <button
          className="alignment-button full-width"
          onClick={() => handleAlign('center-canvas')}
          title="Center on Canvas"
          type="button"
        >
          ⊕ Center on Canvas
        </button>
      </div>
    </div>
  );
}

export default AlignmentTools;

