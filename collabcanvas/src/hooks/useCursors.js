import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  updateCursorPosition, 
  removeCursor,
  subscribeToCursors 
} from '../services/cursors';
import { throttle } from '../utils/helpers';

/**
 * Custom hook to manage cursor state and synchronization
 * @param {Object} user - Current user object from useAuth
 * @returns {Object} Cursor state and methods
 */
function useCursors(user) {
  const [remoteCursors, setRemoteCursors] = useState([]);
  
  // Keep track of throttled update function
  const throttledUpdateRef = useRef(null);

  // Initialize throttled update function (50ms throttle for smooth but efficient updates)
  useEffect(() => {
    if (user) {
      throttledUpdateRef.current = throttle(
        async (x, y) => {
          await updateCursorPosition(
            user.uid, 
            user.displayName || user.email || 'Anonymous',
            x, 
            y
          );
        },
        50 // Update every 50ms max
      );
    }
  }, [user]);

  // Subscribe to other users' cursors
  useEffect(() => {
    if (!user) {
      setRemoteCursors([]);
      return;
    }

    console.log('📍 Subscribing to remote cursors...');
    
    const unsubscribe = subscribeToCursors(user.uid, (cursors) => {
      setRemoteCursors(cursors);
    });

    // Cleanup: remove own cursor on unmount
    return () => {
      console.log('📍 Cleaning up cursor subscription and removing cursor');
      unsubscribe();
      removeCursor(user.uid);
    };
  }, [user]);

  // Cleanup cursor on page unload/refresh
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable delivery during unload
      // Note: This is a best-effort approach; onDisconnect in presence is more reliable
      removeCursor(user.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  /**
   * Update current user's cursor position (throttled)
   * @param {number} x - Canvas X position
   * @param {number} y - Canvas Y position
   */
  const updateMyCursor = useCallback((x, y) => {
    if (!user || !throttledUpdateRef.current) return;
    throttledUpdateRef.current(x, y);
  }, [user]);

  return {
    remoteCursors,
    updateMyCursor
  };
}

export default useCursors;
