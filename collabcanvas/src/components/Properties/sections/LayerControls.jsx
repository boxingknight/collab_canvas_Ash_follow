// LayerControls.jsx - Z-index management buttons
function LayerControls({ selectedShapeIds, onLayerChange }) {
  if (!selectedShapeIds || selectedShapeIds.length === 0) {
    return null;
  }

  const handleLayer = (operation) => {
    if (onLayerChange) {
      selectedShapeIds.forEach(id => {
        onLayerChange(operation, id);
      });
    }
  };

  return (
    <div className="properties-section">
      <h4 className="properties-section-title">LAYER</h4>
      
      <div className="layer-controls-grid">
        <button
          className="layer-button"
          onClick={() => handleLayer('forward')}
          title="Bring Forward"
          type="button"
        >
          <span>↑</span>
          <span className="layer-button-label">Forward</span>
        </button>
        
        <button
          className="layer-button"
          onClick={() => handleLayer('backward')}
          title="Send Backward"
          type="button"
        >
          <span>↓</span>
          <span className="layer-button-label">Backward</span>
        </button>
        
        <button
          className="layer-button"
          onClick={() => handleLayer('front')}
          title="Bring to Front"
          type="button"
        >
          <span>⇈</span>
          <span className="layer-button-label">To Front</span>
        </button>
        
        <button
          className="layer-button"
          onClick={() => handleLayer('back')}
          title="Send to Back"
          type="button"
        >
          <span>⇊</span>
          <span className="layer-button-label">To Back</span>
        </button>
      </div>
    </div>
  );
}

export default LayerControls;

