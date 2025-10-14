import { useState } from 'react';

/**
 * UserList component - displays avatars of online users in header
 * @param {Array} users - Array of online user objects
 * @param {Object} currentUser - Current logged-in user
 */
function UserList({ users = [], currentUser }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Safety check - ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  // Helper to get user color (same logic as RemoteCursor)
  function getUserColor(userId) {
    // Safety check for undefined userId
    if (!userId || typeof userId !== 'string') {
      console.warn('getUserColor called with invalid userId:', userId);
      return '#646cff'; // Return default color
    }
    
    const colors = [
      '#646cff', '#4ade80', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f43f5e', '#84cc16', '#eab308', '#14b8a6'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Helper to get user initials
  function getUserInitials(userName) {
    if (!userName) return '?';
    const parts = userName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  }

  // Helper to format user name
  function formatUserName(user) {
    if (user.userId === currentUser?.uid) {
      return `${user.userName} (You)`;
    }
    return user.userName;
  }

  // Debug logging
  console.log('👥 UserList render:', {
    usersCount: safeUsers.length,
    users: safeUsers.map(u => ({ userId: u.userId, userName: u.userName })),
    currentUserId: currentUser?.uid,
    currentUserName: currentUser?.displayName || currentUser?.email
  });

  // Always include current user plus all online users from presence
  const allUsers = [];
  
  // Add current user first if we have one
  if (currentUser) {
    // Check if current user is already in the presence list
    const currentUserInPresence = safeUsers.find(u => u.userId === currentUser.uid);
    
    if (currentUserInPresence) {
      // Use the presence data for current user
      allUsers.push(currentUserInPresence);
    } else {
      // Add current user manually if not in presence yet
      allUsers.push({
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'You',
        userEmail: currentUser.email,
        status: 'online'
      });
    }
  }
  
  // Add all other users from presence (excluding current user to avoid duplicates)
  safeUsers.forEach(user => {
    // Only add valid users with required fields
    if (user && user.userId && user.userId !== currentUser?.uid) {
      allUsers.push(user);
    } else if (!user || !user.userId) {
      console.warn('Skipping invalid user object:', user);
    }
  });
  
  console.log('👥 UserList allUsers after processing:', allUsers.length, allUsers.map(u => u?.userName || 'unknown'));

  // Don't render anything if no current user (not logged in yet)
  if (!currentUser) {
    console.log('👥 UserList: No current user, not rendering');
    return null;
  }

  // Don't render if no users to show
  if (allUsers.length === 0) {
    console.log('👥 UserList: No users to display, not rendering');
    return null;
  }

  return (
    <div 
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        marginLeft: '16px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Stack */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingRight: '8px'
      }}>
        {allUsers.slice(0, 5).filter(user => user && user.userId).map((user, index) => {
          const userColor = getUserColor(user.userId);
          const isCurrentUser = user.userId === currentUser?.uid;
          
          return (
            <div
              key={user.userId}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: userColor,
                border: isCurrentUser ? '2px solid #fff' : '2px solid #1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff',
                marginLeft: index > 0 ? '-12px' : '0',
                position: 'relative',
                zIndex: allUsers.length - index,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.2s',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
              }}
              title={formatUserName(user)}
            >
              {getUserInitials(user.userName)}
            </div>
          );
        })}
        
        {/* Show "+X more" indicator if there are more than 5 users */}
        {allUsers.length > 5 && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#333',
              border: '2px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#fff',
              marginLeft: '-12px',
              position: 'relative',
              zIndex: 0,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            +{allUsers.length - 5}
          </div>
        )}
      </div>

      {/* Hover Dropdown - Full User List */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          background: 'rgba(0, 0, 0, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '240px',
          maxWidth: '320px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>👥</span>
              <span style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Online Users
              </span>
            </div>
            <span style={{
              background: '#4ade80',
              color: '#000',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {allUsers.length}
            </span>
          </div>

          {/* User List */}
          <div style={{
            padding: '8px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {allUsers.filter(user => user && user.userId).map((user) => {
              const isCurrentUserInList = user.userId === currentUser?.uid;
              const userColor = getUserColor(user.userId);
              
              return (
                <div
                  key={user.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isCurrentUserInList ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
                    border: isCurrentUserInList ? '1px solid rgba(100, 108, 255, 0.3)' : '1px solid transparent',
                    marginBottom: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: userColor,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {getUserInitials(user.userName)}
                  </div>
                  
                  {/* User info */}
                  <div style={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    <div style={{
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: isCurrentUserInList ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatUserName(user)}
                    </div>
                    {user.userEmail && (
                      <div style={{
                        color: '#888',
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user.userEmail}
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: userColor,
                    boxShadow: `0 0 8px ${userColor}`,
                    flexShrink: 0,
                    animation: 'pulse 2s infinite'
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default UserList;
