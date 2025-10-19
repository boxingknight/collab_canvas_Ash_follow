import { useState, useEffect } from 'react';
import { 
  setOnline, 
  setOffline,
  updateHeartbeat,
  subscribeToPresence 
} from '../services/presence';

/**
 * Custom hook to manage user presence (canvas-scoped)
 * @param {string} canvasId - Canvas ID
 * @param {Object} user - Current user object from useAuth
 * @returns {Object} Online users array
 */
function usePresence(canvasId, user) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Set user online and subscribe to presence updates
  useEffect(() => {
    if (!user || !canvasId) {
      setOnlineUsers([]);
      return;
    }

    console.log('👥 Setting up presence for user:', user.displayName || user.email, 'on canvas:', canvasId);

    // Set user as online
    setOnline(
      canvasId,
      user.uid, 
      user.displayName || user.email || 'Anonymous',
      user.email
    ).catch(error => {
      console.error('Failed to set user online:', error);
    });

    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence(canvasId, (users) => {
      // Only log when user count changes
      setOnlineUsers(prevUsers => {
        if (prevUsers.length !== users.length) {
          console.log('👥 Users on canvas:', users.length);
        }
        return users;
      });
    });

    // Set up heartbeat to keep presence alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      updateHeartbeat(canvasId, user.uid);
    }, 30000); // 30 seconds

    // Cleanup on unmount or user change
    return () => {
      console.log('👥 Cleaning up presence');
      clearInterval(heartbeatInterval);
      unsubscribe();
      setOffline(canvasId, user.uid);
    };
  }, [user, canvasId]);

  // Handle page unload/refresh
  useEffect(() => {
    if (!user || !canvasId) return;

    const handleBeforeUnload = () => {
      // Best-effort cleanup on page unload
      setOffline(canvasId, user.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, canvasId]);

  return {
    onlineUsers
  };
}

export default usePresence;
