// NoSelection.jsx - Empty state when nothing is selected
function NoSelection() {
  return (
    <div className="no-selection">
      <div className="no-selection-icon">👆</div>
      <h3 className="no-selection-title">No Selection</h3>
      <p className="no-selection-text">Click a shape to edit its properties</p>
      
      <div className="no-selection-shortcuts">
        <h4>Shortcuts:</h4>
        <ul>
          <li><kbd>V</kbd> Pan mode</li>
          <li><kbd>M</kbd> Move mode</li>
          <li><kbd>D</kbd> Draw mode</li>
          <li><kbd>⌘C</kbd> Copy</li>
          <li><kbd>⌘V</kbd> Paste</li>
          <li><kbd>⌘Z</kbd> Undo</li>
        </ul>
      </div>
    </div>
  );
}

export default NoSelection;

