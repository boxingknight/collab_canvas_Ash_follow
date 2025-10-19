/**
 * Canvases Service
 * 
 * Handles all Firestore operations related to canvases.
 * Includes CRUD operations, sharing, permissions, and soft delete (trash).
 * 
 * @module services/canvases
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { nanoid } from 'nanoid';  // For generating share tokens
import { updateCanvasCount } from './workspaces';

/**
 * Create a new canvas
 * 
 * @param {Object} params - Canvas parameters
 * @param {string} params.workspaceId - Workspace ID
 * @param {string} params.ownerId - Owner's user ID
 * @param {string} [params.name] - Canvas name
 * @param {string} [params.description] - Canvas description
 * @param {string[]} [params.tags] - Tags for organization
 * @returns {Promise<Object>} Created canvas with ID
 */
export async function createCanvas({ workspaceId, ownerId, name, description, tags = [] }) {
  try {
    const canvas = {
      name: name || 'Untitled Canvas',
      workspaceId,
      ownerId,
      orgId: null,  // Future: organization support
      
      // Permissions (map of userId -> role)
      permissions: {
        [ownerId]: 'editor'  // Owner gets editor permission
      },
      
      // Visibility & Sharing
      visibility: 'private',
      shareToken: null,
      sharePassword: null,
      shareExpiresAt: null,
      sharePermission: 'view',
      
      // Metadata
      description: description || null,
      tags: tags || [],
      category: null,
      
      // Thumbnail
      thumbnailUrl: null,
      thumbnailGeneratedAt: null,
      
      // Stats
      shapeCount: 0,
      viewCount: 0,
      forkCount: 0,
      
      // Soft Delete
      deletedAt: null,
      
      // State
      isStarred: false,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEditedAt: serverTimestamp(),
      lastEditedBy: ownerId
    };

    const docRef = await addDoc(collection(db, 'canvases'), canvas);

    // Increment workspace canvas count
    await updateCanvasCount(workspaceId, 1);

    return {
      id: docRef.id,
      ...canvas
    };
  } catch (error) {
    console.error('Error creating canvas:', error);
    throw new Error(`Failed to create canvas: ${error.message}`);
  }
}

/**
 * Get all canvases in a workspace (excluding deleted)
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {Object} options - Query options
 * @param {boolean} [options.includeDeleted=false] - Include soft-deleted canvases
 * @param {number} [options.limitCount] - Limit number of results
 * @returns {Promise<Array>} Array of canvases
 */
export async function getCanvases(workspaceId, options = {}) {
  try {
    const { includeDeleted = false, limitCount } = options;

    let q = query(
      collection(db, 'canvases'),
      where('workspaceId', '==', workspaceId)
    );

    // Exclude deleted canvases by default
    if (!includeDeleted) {
      q = query(q, where('deletedAt', '==', null));
    }

    // Sort by last edited (most recent first)
    q = query(q, orderBy('lastEditedAt', 'desc'));

    // Apply limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching canvases:', error);
    throw new Error(`Failed to fetch canvases: ${error.message}`);
  }
}

/**
 * Get canvases owned by a user (across all workspaces)
 * 
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} [options.includeDeleted=false] - Include soft-deleted canvases
 * @returns {Promise<Array>} Array of canvases
 */
export async function getUserCanvases(userId, options = {}) {
  try {
    const { includeDeleted = false } = options;

    let q = query(
      collection(db, 'canvases'),
      where('ownerId', '==', userId)
    );

    if (!includeDeleted) {
      q = query(q, where('deletedAt', '==', null));
    }

    q = query(q, orderBy('lastEditedAt', 'desc'));

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user canvases:', error);
    throw new Error(`Failed to fetch user canvases: ${error.message}`);
  }
}

/**
 * Get a single canvas by ID
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object|null>} Canvas data or null if not found
 */
export async function getCanvas(canvasId) {
  try {
    const docRef = doc(db, 'canvases', canvasId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error fetching canvas:', error);
    throw new Error(`Failed to fetch canvas: ${error.message}`);
  }
}

/**
 * Update canvas properties
 * 
 * @param {string} canvasId - Canvas ID
 * @param {Object} updates - Fields to update
 * @param {string} [userId] - User ID making the update (for lastEditedBy)
 * @returns {Promise<void>}
 */
export async function updateCanvas(canvasId, updates, userId = null) {
  try {
    const docRef = doc(db, 'canvases', canvasId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      lastEditedAt: serverTimestamp()
    };

    if (userId) {
      updateData.lastEditedBy = userId;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating canvas:', error);
    throw new Error(`Failed to update canvas: ${error.message}`);
  }
}

/**
 * Soft delete a canvas (move to trash)
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<void>}
 */
export async function deleteCanvas(canvasId) {
  try {
    await updateCanvas(canvasId, {
      deletedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting canvas:', error);
    throw new Error(`Failed to delete canvas: ${error.message}`);
  }
}

/**
 * Restore a soft-deleted canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<void>}
 */
export async function restoreCanvas(canvasId) {
  try {
    await updateCanvas(canvasId, {
      deletedAt: null
    });
  } catch (error) {
    console.error('Error restoring canvas:', error);
    throw new Error(`Failed to restore canvas: ${error.message}`);
  }
}

/**
 * Permanently delete a canvas
 * 
 * WARNING: This is irreversible!
 * You should also delete all shapes in the canvas.
 * 
 * @param {string} canvasId - Canvas ID
 * @param {string} workspaceId - Workspace ID (for updating count)
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteCanvas(canvasId, workspaceId) {
  try {
    const docRef = doc(db, 'canvases', canvasId);
    await deleteDoc(docRef);

    // Decrement workspace canvas count
    await updateCanvasCount(workspaceId, -1);
  } catch (error) {
    console.error('Error permanently deleting canvas:', error);
    throw new Error(`Failed to permanently delete canvas: ${error.message}`);
  }
}

/**
 * Get deleted canvases (trash)
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Array>} Array of deleted canvases
 */
export async function getDeletedCanvases(workspaceId) {
  try {
    const q = query(
      collection(db, 'canvases'),
      where('workspaceId', '==', workspaceId),
      where('deletedAt', '!=', null),
      orderBy('deletedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching deleted canvases:', error);
    throw new Error(`Failed to fetch deleted canvases: ${error.message}`);
  }
}

/**
 * Toggle star status on a canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @param {boolean} isStarred - New star status
 * @returns {Promise<void>}
 */
export async function toggleStarCanvas(canvasId, isStarred) {
  try {
    await updateCanvas(canvasId, {
      isStarred
    });
  } catch (error) {
    console.error('Error toggling star:', error);
    throw new Error(`Failed to toggle star: ${error.message}`);
  }
}

/**
 * Get starred canvases
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Array>} Array of starred canvases
 */
export async function getStarredCanvases(workspaceId) {
  try {
    const q = query(
      collection(db, 'canvases'),
      where('workspaceId', '==', workspaceId),
      where('deletedAt', '==', null),
      where('isStarred', '==', true),
      orderBy('lastEditedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching starred canvases:', error);
    throw new Error(`Failed to fetch starred canvases: ${error.message}`);
  }
}

/**
 * Generate a share link for a canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @param {Object} options - Share options
 * @param {string} [options.permission='view'] - 'view' or 'edit'
 * @param {string} [options.password] - Optional password (will be hashed)
 * @param {Date} [options.expiresAt] - Optional expiration date
 * @returns {Promise<string>} Share token
 */
export async function generateShareLink(canvasId, options = {}) {
  try {
    const {
      permission = 'view',
      password = null,
      expiresAt = null
    } = options;

    // Generate unique token
    const shareToken = nanoid(16);  // e.g., "abc123xyz4567890"

    // Update canvas with share info
    await updateCanvas(canvasId, {
      shareToken,
      sharePassword: password,  // TODO: Hash password in production
      shareExpiresAt: expiresAt,
      sharePermission: permission,
      visibility: 'shared'
    });

    return shareToken;
  } catch (error) {
    console.error('Error generating share link:', error);
    throw new Error(`Failed to generate share link: ${error.message}`);
  }
}

/**
 * Revoke share link for a canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<void>}
 */
export async function revokeShareLink(canvasId) {
  try {
    await updateCanvas(canvasId, {
      shareToken: null,
      sharePassword: null,
      shareExpiresAt: null,
      visibility: 'private'
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    throw new Error(`Failed to revoke share link: ${error.message}`);
  }
}

/**
 * Get canvas by share token
 * 
 * @param {string} token - Share token
 * @returns {Promise<Object|null>} Canvas data or null if not found/expired
 */
export async function getCanvasByShareToken(token) {
  try {
    const q = query(
      collection(db, 'canvases'),
      where('shareToken', '==', token),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const canvas = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };

    // Check if share link is expired
    if (canvas.shareExpiresAt && canvas.shareExpiresAt.toDate() < new Date()) {
      return null;
    }

    return canvas;
  } catch (error) {
    console.error('Error fetching canvas by share token:', error);
    throw new Error(`Failed to fetch canvas by share token: ${error.message}`);
  }
}

/**
 * Duplicate a canvas (create a copy)
 * 
 * @param {string} canvasId - Canvas ID to duplicate
 * @param {string} userId - User ID creating the duplicate
 * @param {string} workspaceId - Workspace ID for the new canvas
 * @returns {Promise<Object>} New canvas data
 */
export async function duplicateCanvas(canvasId, userId, workspaceId) {
  try {
    const originalCanvas = await getCanvas(canvasId);

    if (!originalCanvas) {
      throw new Error('Canvas not found');
    }

    // Create new canvas with same properties
    const newCanvas = await createCanvas({
      workspaceId,
      ownerId: userId,
      name: `${originalCanvas.name} (Copy)`,
      description: originalCanvas.description,
      tags: originalCanvas.tags
    });

    // TODO: Also copy all shapes from original canvas
    // This will be implemented when we update the shapes service

    return newCanvas;
  } catch (error) {
    console.error('Error duplicating canvas:', error);
    throw new Error(`Failed to duplicate canvas: ${error.message}`);
  }
}

/**
 * Search canvases by name
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching canvases
 */
export async function searchCanvases(workspaceId, searchTerm) {
  try {
    // Get all non-deleted canvases in workspace
    const allCanvases = await getCanvases(workspaceId);

    // Client-side filtering (Firestore doesn't support full-text search)
    const searchLower = searchTerm.toLowerCase();
    
    return allCanvases.filter(canvas => {
      const nameMatch = canvas.name.toLowerCase().includes(searchLower);
      const descMatch = canvas.description?.toLowerCase().includes(searchLower);
      const tagMatch = canvas.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      
      return nameMatch || descMatch || tagMatch;
    });
  } catch (error) {
    console.error('Error searching canvases:', error);
    throw new Error(`Failed to search canvases: ${error.message}`);
  }
}

/**
 * Update canvas shape count
 * 
 * @param {string} canvasId - Canvas ID
 * @param {number} delta - Amount to increment (can be negative)
 * @returns {Promise<void>}
 */
export async function updateShapeCount(canvasId, delta = 1) {
  try {
    const canvas = await getCanvas(canvasId);
    
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    const newCount = Math.max(0, (canvas.shapeCount || 0) + delta);

    await updateCanvas(canvasId, {
      shapeCount: newCount
    });
  } catch (error) {
    console.error('Error updating shape count:', error);
    // Don't throw - this is a non-critical update
    console.warn('Failed to update shape count, continuing...');
  }
}

