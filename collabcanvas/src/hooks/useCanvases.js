/**
 * useCanvases Hook
 * 
 * Manages canvas CRUD operations and state
 * Integrates with workspaces and canvases services
 */

import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { getOrCreateDefaultWorkspace } from '../services/workspaces';
import { 
  createCanvas, 
  getCanvases, 
  updateCanvas,
  deleteCanvas,
  restoreCanvas,
  searchCanvases,
  getStarredCanvases,
  getDeletedCanvases,
  toggleStarCanvas
} from '../services/canvases';

export default function useCanvases() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('all'); // 'all', 'starred', 'trash'

  // Initialize workspace and load canvases
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function initialize() {
      try {
        setLoading(true);
        
        // Get or create default workspace
        const ws = await getOrCreateDefaultWorkspace(user.uid);
        setWorkspace(ws);
        
        // Load canvases
        await loadCanvases(ws.id, currentView);
        
      } catch (err) {
        console.error('Error initializing canvases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [user, currentView]);

  // Load canvases based on current view
  async function loadCanvases(workspaceId, view = 'all') {
    try {
      let fetchedCanvases;
      
      if (view === 'starred') {
        fetchedCanvases = await getStarredCanvases(workspaceId);
      } else if (view === 'trash') {
        fetchedCanvases = await getDeletedCanvases(workspaceId);
      } else {
        fetchedCanvases = await getCanvases(workspaceId);
      }
      
      setCanvases(fetchedCanvases);
    } catch (err) {
      console.error('Error loading canvases:', err);
      setError(err.message);
    }
  }

  // Create new canvas
  async function handleCreateCanvas(name = 'Untitled Canvas', description = '') {
    if (!workspace) return null;

    try {
      const newCanvas = await createCanvas({
        workspaceId: workspace.id,
        ownerId: user.uid,
        name,
        description
      });

      // Add to local state
      setCanvases(prev => [newCanvas, ...prev]);
      
      return newCanvas;
    } catch (err) {
      console.error('Error creating canvas:', err);
      setError(err.message);
      return null;
    }
  }

  // Update canvas (rename, change description, etc.)
  async function handleUpdateCanvas(canvasId, updates) {
    try {
      await updateCanvas(canvasId, updates, user.uid);
      
      // Update local state
      setCanvases(prev => prev.map(canvas => 
        canvas.id === canvasId 
          ? { ...canvas, ...updates }
          : canvas
      ));
    } catch (err) {
      console.error('Error updating canvas:', err);
      setError(err.message);
    }
  }

  // Delete canvas (soft delete - move to trash)
  async function handleDeleteCanvas(canvasId) {
    try {
      await deleteCanvas(canvasId);
      
      // Remove from local state if not in trash view
      if (currentView !== 'trash') {
        setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
      }
    } catch (err) {
      console.error('Error deleting canvas:', err);
      setError(err.message);
    }
  }

  // Restore canvas from trash
  async function handleRestoreCanvas(canvasId) {
    try {
      await restoreCanvas(canvasId);
      
      // Remove from trash view
      if (currentView === 'trash') {
        setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
      }
    } catch (err) {
      console.error('Error restoring canvas:', err);
      setError(err.message);
    }
  }

  // Toggle star status
  async function handleToggleStar(canvasId) {
    try {
      const canvas = canvases.find(c => c.id === canvasId);
      if (!canvas) return;

      const newStarStatus = !canvas.isStarred;
      await toggleStarCanvas(canvasId, newStarStatus);
      
      // Update local state
      setCanvases(prev => prev.map(c => 
        c.id === canvasId 
          ? { ...c, isStarred: newStarStatus }
          : c
      ));
    } catch (err) {
      console.error('Error toggling star:', err);
      setError(err.message);
    }
  }

  // Search canvases
  async function handleSearch(searchTerm) {
    if (!workspace) return;

    try {
      if (!searchTerm.trim()) {
        // If empty search, reload all canvases
        await loadCanvases(workspace.id, currentView);
        return;
      }

      const results = await searchCanvases(workspace.id, searchTerm);
      setCanvases(results);
    } catch (err) {
      console.error('Error searching canvases:', err);
      setError(err.message);
    }
  }

  // Change view
  function changeView(view) {
    setCurrentView(view);
  }

  return {
    workspace,
    canvases,
    loading,
    error,
    currentView,
    createCanvas: handleCreateCanvas,
    updateCanvas: handleUpdateCanvas,
    deleteCanvas: handleDeleteCanvas,
    restoreCanvas: handleRestoreCanvas,
    toggleStar: handleToggleStar,
    search: handleSearch,
    changeView
  };
}

