/**
 * Dashboard Page
 * 
 * Main canvas management interface
 * Shows all canvases in a grid with sidebar navigation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCanvases from '../../hooks/useCanvases';
import Sidebar from '../../components/Dashboard/Sidebar';
import CanvasCard from '../../components/Dashboard/CanvasCard';
import '../../components/Dashboard/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    workspace,
    canvases,
    loading,
    error,
    currentView,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    restoreCanvas,
    toggleStar,
    search,
    changeView
  } = useCanvases();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Handle create canvas
  async function handleCreateCanvas() {
    setIsCreating(true);
    try {
      const newCanvas = await createCanvas('Untitled Canvas', '');
      if (newCanvas) {
        // Navigate to the new canvas
        navigate(`/canvas/${newCanvas.id}`);
      }
    } catch (err) {
      console.error('Error creating canvas:', err);
      alert('Failed to create canvas. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  // Handle search
  function handleSearch(e) {
    const term = e.target.value;
    setSearchTerm(term);
    search(term);
  }

  // Handle rename canvas
  async function handleRenameCanvas(canvasId, newName) {
    try {
      await updateCanvas(canvasId, { name: newName });
    } catch (err) {
      console.error('Error renaming canvas:', err);
      alert('Failed to rename canvas. Please try again.');
    }
  }

  // Calculate canvas counts for sidebar
  const canvasCounts = {
    all: canvases.filter(c => !c.deletedAt).length,
    starred: canvases.filter(c => c.isStarred && !c.deletedAt).length,
    trash: canvases.filter(c => c.deletedAt).length
  };

  // Get view title
  function getViewTitle() {
    switch (currentView) {
      case 'starred': return 'Starred Canvases';
      case 'trash': return 'Trash';
      default: return 'All Canvases';
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-logo">
            <span className="logo-icon">🎨</span>
            CollabCanvas
          </h1>
          
          {/* Search */}
          <div className="dashboard-search">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search canvases..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        <div className="dashboard-header-right">
          {/* User Menu */}
          <div className="user-menu">
            <span className="user-name">{user?.displayName || user?.email}</span>
            <button 
              className="btn btn-ghost"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <Sidebar 
          currentView={currentView}
          onChangeView={changeView}
          canvasCounts={canvasCounts}
        />

        {/* Canvas Grid */}
        <main className="dashboard-main">
          <div className="dashboard-main-header">
            <h2 className="view-title">{getViewTitle()}</h2>
            
            {currentView === 'all' && (
              <button 
                className="btn btn-primary"
                onClick={handleCreateCanvas}
                disabled={isCreating}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {isCreating ? 'Creating...' : 'New Canvas'}
              </button>
            )}
          </div>

          {/* Canvas Grid */}
          {canvases.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6v6H9z"/>
              </svg>
              <h3>
                {currentView === 'trash' 
                  ? 'No canvases in trash' 
                  : currentView === 'starred'
                  ? 'No starred canvases'
                  : 'No canvases yet'}
              </h3>
              <p>
                {currentView === 'all' 
                  ? 'Create your first canvas to get started!'
                  : currentView === 'starred'
                  ? 'Star canvases to find them quickly'
                  : 'Deleted canvases will appear here'}
              </p>
              {currentView === 'all' && (
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateCanvas}
                  disabled={isCreating}
                >
                  Create Canvas
                </button>
              )}
            </div>
          ) : (
            <div className="canvas-grid">
              {canvases.map(canvas => (
                <CanvasCard
                  key={canvas.id}
                  canvas={canvas}
                  onDelete={currentView === 'trash' ? restoreCanvas : deleteCanvas}
                  onRename={handleRenameCanvas}
                  onToggleStar={toggleStar}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

