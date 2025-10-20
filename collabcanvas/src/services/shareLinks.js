/**
 * Share Links Service
 * 
 * Manages shareable links for canvases with permission control
 */

import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

const SHARE_LINKS_COLLECTION = 'shareLinks';

/**
 * Create a new share link for a canvas
 * @param {string} canvasId - Canvas to share
 * @param {string} permission - 'viewer' or 'editor'
 * @param {string} userId - User creating the link
 * @returns {Promise<Object>} Created share link object
 */
export async function createShareLink(canvasId, permission, userId) {
  try {
    const linkId = nanoid(12); // Generate short unique ID
    const shareLink = {
      linkId,
      canvasId,
      createdBy: userId,
      permission, // 'viewer' or 'editor'
      password: null, // Optional: can add password protection later
      expiresAt: null, // Optional: can add expiration later
      createdAt: serverTimestamp(),
      accessCount: 0,
      isActive: true
    };

    const linkRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
    await setDoc(linkRef, shareLink);

    return { ...shareLink, id: linkId };
  } catch (error) {
    console.error('Error creating share link:', error);
    throw new Error(`Failed to create share link: ${error.message}`);
  }
}

/**
 * Get a share link by ID
 * @param {string} linkId - Share link ID
 * @returns {Promise<Object|null>} Share link object or null
 */
export async function getShareLink(linkId) {
  try {
    const linkRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
    const linkSnap = await getDoc(linkRef);

    if (!linkSnap.exists()) {
      return null;
    }

    return { id: linkSnap.id, ...linkSnap.data() };
  } catch (error) {
    console.error('Error getting share link:', error);
    throw new Error(`Failed to get share link: ${error.message}`);
  }
}

/**
 * Validate a share link (check if exists, active, not expired)
 * @param {string} linkId - Share link ID
 * @returns {Promise<Object>} { valid: boolean, shareLink: Object|null, reason: string }
 */
export async function validateShareLink(linkId) {
  try {
    const shareLink = await getShareLink(linkId);

    if (!shareLink) {
      return { valid: false, shareLink: null, reason: 'Link not found' };
    }

    if (!shareLink.isActive) {
      return { valid: false, shareLink, reason: 'Link has been deactivated' };
    }

    // Check expiration (if expiresAt is set)
    if (shareLink.expiresAt) {
      const now = new Date();
      const expiresAt = shareLink.expiresAt.toDate();
      if (now > expiresAt) {
        return { valid: false, shareLink, reason: 'Link has expired' };
      }
    }

    return { valid: true, shareLink, reason: null };
  } catch (error) {
    console.error('Error validating share link:', error);
    return { valid: false, shareLink: null, reason: error.message };
  }
}

/**
 * Delete a share link
 * @param {string} linkId - Share link ID
 * @returns {Promise<void>}
 */
export async function deleteShareLink(linkId) {
  try {
    const linkRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
    await deleteDoc(linkRef);
  } catch (error) {
    console.error('Error deleting share link:', error);
    throw new Error(`Failed to delete share link: ${error.message}`);
  }
}

/**
 * Get all share links for a canvas
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Array>} Array of share link objects
 */
export async function getCanvasShareLinks(canvasId) {
  try {
    const q = query(
      collection(db, SHARE_LINKS_COLLECTION),
      where('canvasId', '==', canvasId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const links = [];

    querySnapshot.forEach((doc) => {
      links.push({ id: doc.id, ...doc.data() });
    });

    return links;
  } catch (error) {
    console.error('Error getting canvas share links:', error);
    throw new Error(`Failed to get canvas share links: ${error.message}`);
  }
}

/**
 * Grant access to a user via share link
 * Updates the canvas permissions to include the user
 * @param {string} linkId - Share link ID
 * @param {string} userId - User to grant access to
 * @returns {Promise<Object>} { canvasId: string, permission: string }
 */
export async function grantAccessFromShareLink(linkId, userId) {
  try {
    console.log('🔗 [STEP 1/6] Starting grant access - LinkId:', linkId, 'UserId:', userId);
    
    // Validate the share link
    console.log('🔗 [STEP 2/6] Validating share link...');
    const validation = await validateShareLink(linkId);
    if (!validation.valid) {
      console.error('❌ [STEP 2/6 FAILED] Share link validation failed:', validation.reason);
      throw new Error(validation.reason);
    }

    const { shareLink } = validation;
    const { canvasId, permission } = shareLink;
    
    console.log('✅ [STEP 2/6 SUCCESS] Share link valid');
    console.log('   → Canvas ID:', canvasId);
    console.log('   → Permission:', permission);
    console.log('   → Created by:', shareLink.createdBy);

    // Get current canvas to check if it exists
    console.log('🔗 [STEP 3/6] Fetching canvas data...');
    const { getCanvas } = await import('./canvases');
    const canvas = await getCanvas(canvasId);
    if (!canvas) {
      console.error('❌ [STEP 3/6 FAILED] Canvas not found:', canvasId);
      throw new Error('Canvas not found');
    }
    
    console.log('✅ [STEP 3/6 SUCCESS] Canvas found');
    console.log('   → Canvas name:', canvas.name);
    console.log('   → Canvas owner:', canvas.ownerId);
    console.log('   → Current permissions:', JSON.stringify(canvas.permissions || {}, null, 2));

    // Check if user already has access
    console.log('🔗 [STEP 4/6] Checking existing access...');
    if (canvas.permissions && canvas.permissions[userId]) {
      console.log('ℹ️ User already has access:', canvas.permissions[userId]);
      // Update if new permission is higher (editor > viewer)
      if (canvas.permissions[userId] === 'viewer' && permission === 'editor') {
        console.log('⬆️ Upgrading permission from viewer to editor');
      } else {
        console.log('✅ [STEP 4/6] User already has sufficient access - returning early');
        return { canvasId, permission: canvas.permissions[userId] };
      }
    } else {
      console.log('✅ [STEP 4/6] User does not have access yet - granting new access');
    }

    // Add user to permissions map - DIRECT Firestore update
    const updatedPermissions = {
      ...(canvas.permissions || {}),
      [userId]: permission // 'viewer' or 'editor'
    };
    
    console.log('🔗 [STEP 5/6] Updating canvas permissions...');
    console.log('   → Old permissions:', JSON.stringify(canvas.permissions || {}, null, 2));
    console.log('   → New permissions:', JSON.stringify(updatedPermissions, null, 2));

    // Direct Firestore update (bypass canvases service to avoid auth checks)
    const canvasRef = doc(db, 'canvases', canvasId);
    await updateDoc(canvasRef, {
      permissions: updatedPermissions,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ [STEP 5/6 SUCCESS] Canvas permissions updated successfully');

    // Increment access count
    console.log('🔗 [STEP 6/6] Incrementing share link access count...');
    const linkRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
    await updateDoc(linkRef, {
      accessCount: (shareLink.accessCount || 0) + 1
    });
    
    console.log('✅ [STEP 6/6 SUCCESS] Access count incremented');
    console.log('🎉 ========================================');
    console.log('🎉 ACCESS GRANTED SUCCESSFULLY!');
    console.log('🎉 Canvas:', canvasId);
    console.log('🎉 Permission:', permission);
    console.log('🎉 User:', userId);
    console.log('🎉 ========================================');

    return { canvasId, permission };
  } catch (error) {
    console.error('💥 ========================================');
    console.error('💥 ERROR GRANTING ACCESS');
    console.error('💥 Error:', error.message);
    console.error('💥 Stack:', error.stack);
    console.error('💥 ========================================');
    throw new Error(`Failed to grant access: ${error.message}`);
  }
}

/**
 * Deactivate a share link (soft delete)
 * @param {string} linkId - Share link ID
 * @returns {Promise<void>}
 */
export async function deactivateShareLink(linkId) {
  try {
    const linkRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
    await updateDoc(linkRef, {
      isActive: false
    });
  } catch (error) {
    console.error('Error deactivating share link:', error);
    throw new Error(`Failed to deactivate share link: ${error.message}`);
  }
}

