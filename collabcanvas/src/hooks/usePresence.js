import { useState, useEffect } from 'react';
import { 
  setOnline, 
  setOffline,
  updateHeartbeat,
  subscribeToPresence 
} from '../services/presence';

/**
 * Custom hook to manage user presence
 * @param {Object} user - Current user object from useAuth
 * @returns {Object} Online users array
 */
function usePresence(user) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Set user online and subscribe to presence updates
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    console.log('👥 Setting up presence for user:', user.displayName || user.email);

    // Set user as online
    setOnline(
      user.uid, 
      user.displayName || user.email || 'Anonymous',
      user.email
    ).catch(error => {
      console.error('Failed to set user online:', error);
    });

    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence((users) => {
      console.log('👥 usePresence received users:', users.length, users.map(u => u.userName));
      setOnlineUsers(users);
    });

    // Set up heartbeat to keep presence alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      updateHeartbeat(user.uid);
    }, 30000); // 30 seconds

    // Cleanup on unmount or user change
    return () => {
      console.log('👥 Cleaning up presence');
      clearInterval(heartbeatInterval);
      unsubscribe();
      setOffline(user.uid);
    };
  }, [user]);

  // Handle page unload/refresh
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Best-effort cleanup on page unload
      setOffline(user.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  return {
    onlineUsers
  };
}

export default usePresence;
