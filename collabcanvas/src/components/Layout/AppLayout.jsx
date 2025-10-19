import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AIChat from '../AI/AIChat';
import ShareDialog from '../Canvas/ShareDialog';

function AppLayout({ children, user, onLogout }) {
  const location = useLocation();
  const isOnCanvas = location.pathname.startsWith('/canvas/');
  const canvasId = isOnCanvas ? location.pathname.split('/canvas/')[1] : null;
  
  // Canvas name state
  const [canvasName, setCanvasName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef(null);
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Fetch canvas name when on canvas page
  useEffect(() => {
    if (!canvasId) {
      setCanvasName('');
      return;
    }
    
    async function fetchCanvasName() {
      try {
        const { getCanvas } = await import('../../services/canvases');
        const canvas = await getCanvas(canvasId);
        if (canvas) {
          setCanvasName(canvas.name || 'Untitled Canvas');
        }
      } catch (error) {
        console.error('Error fetching canvas name:', error);
        setCanvasName('Untitled Canvas');
      }
    }
    
    fetchCanvasName();
  }, [canvasId]);
  
  // Handle canvas name editing
  function handleStartEdit() {
    setIsEditingName(true);
    setEditedName(canvasName);
  }
  
  async function handleSaveName() {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== canvasName) {
      try {
        const { updateCanvas } = await import('../../services/canvases');
        await updateCanvas(canvasId, { name: trimmedName }, user?.uid);
        setCanvasName(trimmedName);
      } catch (error) {
        console.error('Error updating canvas name:', error);
      }
    }
    setIsEditingName(false);
  }
  
  function handleCancelEdit() {
    setIsEditingName(false);
    setEditedName(canvasName);
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {isOnCanvas && (
              <Link to="/dashboard" className="btn-back">
                ← Dashboard
              </Link>
            )}
            
            {isOnCanvas ? (
              // Show emoji + canvas name + share button when on canvas page
              <>
                <div className="header-title-wrapper">
                  <span className="app-logo">🎨</span>
                  {isEditingName ? (
                    <input
                      ref={inputRef}
                      type="text"
                      className="canvas-name-input"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={handleKeyDown}
                      maxLength={50}
                      placeholder="Untitled Canvas"
                    />
                  ) : (
                    <h1 
                      className="app-title canvas-title-editable" 
                      onClick={handleStartEdit}
                      title="Click to rename canvas"
                    >
                      {canvasName || 'Untitled Canvas'}
                    </h1>
                  )}
                </div>
                <button 
                  className="btn-share"
                  onClick={() => setShowShareDialog(true)}
                  title="Share canvas"
                >
                  🔗 Share
                </button>
              </>
            ) : (
              // Show app title (linked to dashboard) when not on canvas
              <Link to="/dashboard" className="app-title-link">
                <h1 className="app-title">🎨 CollabCanvas</h1>
              </Link>
            )}
          </div>
          <div className="user-info">
            <span className="user-name">👤 {user?.displayName || user?.email}</span>
            {/* User presence moved to Canvas component (canvas-scoped) */}
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
      <AIChat />
      
      {/* Share Dialog */}
      {showShareDialog && canvasId && user && (
        <ShareDialog
          canvasId={canvasId}
          userId={user.uid}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}

export default AppLayout;
