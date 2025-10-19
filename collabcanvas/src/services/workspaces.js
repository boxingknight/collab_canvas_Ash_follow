/**
 * Workspaces Service
 * 
 * Handles all Firestore operations related to workspaces.
 * Each user has at least one workspace to organize their canvases.
 * 
 * @module services/workspaces
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new workspace
 * 
 * @param {string} userId - Owner's user ID
 * @param {string} name - Workspace name
 * @param {Object} options - Additional options
 * @param {string} [options.description] - Workspace description
 * @param {string} [options.color] - Workspace color (hex)
 * @param {string} [options.icon] - Workspace icon (emoji)
 * @returns {Promise<Object>} Created workspace with ID
 */
export async function createWorkspace(userId, name, options = {}) {
  try {
    const workspace = {
      name: name || 'My Workspace',
      ownerId: userId,
      orgId: null,  // Future: organization support
      visibility: 'private',
      description: options.description || null,
      color: options.color || '#3b82f6',
      icon: options.icon || '🎨',
      canvasCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'workspaces'), workspace);

    return {
      id: docRef.id,
      ...workspace
    };
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw new Error(`Failed to create workspace: ${error.message}`);
  }
}

/**
 * Get all workspaces for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of workspaces
 */
export async function getUserWorkspaces(userId) {
  try {
    const q = query(
      collection(db, 'workspaces'),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    throw new Error(`Failed to fetch workspaces: ${error.message}`);
  }
}

/**
 * Get a single workspace by ID
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object|null>} Workspace data or null if not found
 */
export async function getWorkspace(workspaceId) {
  try {
    const docRef = doc(db, 'workspaces', workspaceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error fetching workspace:', error);
    throw new Error(`Failed to fetch workspace: ${error.message}`);
  }
}

/**
 * Update workspace properties
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateWorkspace(workspaceId, updates) {
  try {
    const docRef = doc(db, 'workspaces', workspaceId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    throw new Error(`Failed to update workspace: ${error.message}`);
  }
}

/**
 * Delete a workspace
 * 
 * NOTE: This permanently deletes the workspace.
 * You should delete or move all canvases in the workspace first.
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<void>}
 */
export async function deleteWorkspace(workspaceId) {
  try {
    const docRef = doc(db, 'workspaces', workspaceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting workspace:', error);
    throw new Error(`Failed to delete workspace: ${error.message}`);
  }
}

/**
 * Increment canvas count for a workspace
 * 
 * @param {string} workspaceId - Workspace ID
 * @param {number} delta - Amount to increment (can be negative for decrement)
 * @returns {Promise<void>}
 */
export async function updateCanvasCount(workspaceId, delta = 1) {
  try {
    const workspace = await getWorkspace(workspaceId);
    
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const newCount = Math.max(0, (workspace.canvasCount || 0) + delta);

    await updateWorkspace(workspaceId, {
      canvasCount: newCount
    });
  } catch (error) {
    console.error('Error updating canvas count:', error);
    throw new Error(`Failed to update canvas count: ${error.message}`);
  }
}

/**
 * Get or create default workspace for user
 * 
 * If user has no workspaces, creates a default one.
 * If user has workspaces, returns the default or first one.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Default workspace
 */
export async function getOrCreateDefaultWorkspace(userId) {
  try {
    const workspaces = await getUserWorkspaces(userId);

    if (workspaces.length === 0) {
      // No workspaces exist, create default
      return await createWorkspace(userId, 'My Workspace', {
        description: 'Your personal workspace',
        color: '#3b82f6',
        icon: '🎨'
      });
    }

    // Return first workspace (sorted by updatedAt desc)
    return workspaces[0];
  } catch (error) {
    console.error('Error getting or creating default workspace:', error);
    throw new Error(`Failed to get default workspace: ${error.message}`);
  }
}

