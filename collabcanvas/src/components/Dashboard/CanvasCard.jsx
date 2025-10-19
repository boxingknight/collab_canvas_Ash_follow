/**
 * Canvas Card Component
 * 
 * Displays a single canvas as a card with thumbnail, name, and actions
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function CanvasCard({ canvas, onDelete, onRename, onToggleStar }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(canvas.name);
  const inputRef = useRef(null);

  // Format last edited time
  function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Handle card click - open canvas
  function handleClick() {
    navigate(`/canvas/${canvas.id}`);
  }

  // Handle delete with confirmation
  function handleDelete(e) {
    e.stopPropagation(); // Don't trigger card click
    
    if (window.confirm(`Delete "${canvas.name}"? It will be moved to trash.`)) {
      onDelete(canvas.id);
    }
  }

  // Handle star toggle
  function handleToggleStar(e) {
    e.stopPropagation();
    onToggleStar(canvas.id);
  }

  // Start editing
  function handleStartEdit(e) {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(canvas.name);
  }

  // Save edit
  function handleSaveEdit() {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== canvas.name) {
      onRename(canvas.id, trimmedName);
    }
    setIsEditing(false);
  }

  // Cancel edit
  function handleCancelEdit() {
    setIsEditing(false);
    setEditedName(canvas.name);
  }

  // Handle key press in input
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="canvas-card" onClick={handleClick}>
      {/* Thumbnail */}
      <div className="canvas-card-thumbnail">
        {canvas.thumbnailUrl ? (
          <img src={canvas.thumbnailUrl} alt={canvas.name} />
        ) : (
          <div className="canvas-card-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <path d="M9 9h6v6H9z" strokeWidth="2"/>
            </svg>
          </div>
        )}
        
        {/* Star button */}
        <button 
          className={`canvas-star-btn ${canvas.isStarred ? 'starred' : ''}`}
          onClick={handleToggleStar}
          aria-label={canvas.isStarred ? 'Unstar' : 'Star'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={canvas.isStarred ? 'currentColor' : 'none'} stroke="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="canvas-card-info">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="canvas-card-name-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            maxLength={50}
          />
        ) : (
          <h3 
            className="canvas-card-name" 
            onDoubleClick={handleStartEdit}
            title="Double-click to rename"
          >
            {canvas.name}
          </h3>
        )}
        <p className="canvas-card-time">
          Edited {formatTime(canvas.lastEditedAt || canvas.updatedAt)}
        </p>
        
        {canvas.description && (
          <p className="canvas-card-description">{canvas.description}</p>
        )}
      </div>

      {/* Actions (hover) */}
      <div className="canvas-card-actions">
        <button 
          className="canvas-action-btn"
          onClick={handleStartEdit}
          title="Rename"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="canvas-action-btn"
          onClick={handleDelete}
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default CanvasCard;

