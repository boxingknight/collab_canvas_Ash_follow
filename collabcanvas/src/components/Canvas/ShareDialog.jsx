/**
 * ShareDialog Component
 * 
 * Modal dialog for managing canvas share links
 * - Generate new share links with permission control
 * - View active share links
 * - Copy links to clipboard
 * - Delete share links
 */

import { useState, useEffect } from 'react';
import { 
  createShareLink, 
  getCanvasShareLinks, 
  deleteShareLink 
} from '../../services/shareLinks';
import './ShareDialog.css';

function ShareDialog({ canvasId, userId, onClose }) {
  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('editor');
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Load existing share links
  useEffect(() => {
    loadShareLinks();
  }, [canvasId]);

  async function loadShareLinks() {
    try {
      setLoading(true);
      const links = await getCanvasShareLinks(canvasId);
      setShareLinks(links);
    } catch (error) {
      console.error('Error loading share links:', error);
      alert('Failed to load share links');
    } finally {
      setLoading(false);
    }
  }

  // Generate new share link
  async function handleGenerateLink() {
    try {
      setCreating(true);
      const newLink = await createShareLink(canvasId, selectedPermission, userId);
      setShareLinks(prev => [newLink, ...prev]);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setCreating(false);
    }
  }

  // Copy link to clipboard
  async function handleCopyLink(linkId) {
    const shareUrl = `${window.location.origin}/share/${linkId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000); // Reset after 2s
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy link');
    }
  }

  // Delete share link
  async function handleDeleteLink(linkId) {
    if (!window.confirm('Delete this share link? Users with this link will lose access.')) {
      return;
    }

    try {
      await deleteShareLink(linkId);
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (error) {
      console.error('Error deleting share link:', error);
      alert('Failed to delete share link');
    }
  }

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-dialog-header">
          <h2>Share Canvas</h2>
          <button 
            className="share-dialog-close" 
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Generate Link Section */}
        <div className="share-dialog-section">
          <h3>Generate Share Link</h3>
          <div className="share-generate-form">
            <label htmlFor="permission-select">Permission:</label>
            <select 
              id="permission-select"
              value={selectedPermission} 
              onChange={(e) => setSelectedPermission(e.target.value)}
              className="share-permission-select"
            >
              <option value="editor">Editor (can edit)</option>
              <option value="viewer">Viewer (read-only)</option>
            </select>
            <button 
              onClick={handleGenerateLink} 
              disabled={creating}
              className="btn-generate-link"
            >
              {creating ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        </div>

        {/* Active Links Section */}
        <div className="share-dialog-section">
          <h3>Active Links ({shareLinks.length})</h3>
          
          {loading ? (
            <p className="share-loading">Loading links...</p>
          ) : shareLinks.length === 0 ? (
            <p className="share-empty">No share links yet. Generate one above!</p>
          ) : (
            <div className="share-links-list">
              {shareLinks.map((link) => (
                <div key={link.id} className="share-link-item">
                  <div className="share-link-info">
                    <div className="share-link-permission">
                      {link.permission === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                    </div>
                    <div className="share-link-url">
                      {`${window.location.origin}/share/${link.id}`}
                    </div>
                    <div className="share-link-meta">
                      Created {new Date(link.createdAt?.toDate?.() || link.createdAt).toLocaleDateString()}
                      {link.accessCount > 0 && ` • ${link.accessCount} access${link.accessCount !== 1 ? 'es' : ''}`}
                    </div>
                  </div>
                  <div className="share-link-actions">
                    <button 
                      onClick={() => handleCopyLink(link.id)}
                      className="btn-copy-link"
                      title="Copy link"
                    >
                      {copiedLinkId === link.id ? '✓ Copied' : 'Copy'}
                    </button>
                    <button 
                      onClick={() => handleDeleteLink(link.id)}
                      className="btn-delete-link"
                      title="Delete link"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;

