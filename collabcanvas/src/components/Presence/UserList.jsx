import { useState } from 'react';

/**
 * UserList component - displays list of online users
 * @param {Array} users - Array of online user objects
 * @param {Object} currentUser - Current logged-in user
 */
function UserList({ users, currentUser }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to get user color (same logic as RemoteCursor)
  function getUserColor(userId) {
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

  // Helper to format user name
  function formatUserName(user) {
    if (user.userId === currentUser?.uid) {
      return `${user.userName} (You)`;
    }
    return user.userName;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.85)',
      borderRadius: '12px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      minWidth: '220px',
      maxWidth: '300px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 16px',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>👥</span>
          <span style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Online Users
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            background: '#4ade80',
            color: '#000',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {users.length}
          </span>
          <span style={{
            color: '#888',
            fontSize: '12px',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* User List */}
      {isExpanded && (
        <div style={{
          padding: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {users.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#888',
              fontSize: '13px'
            }}>
              No users online
            </div>
          ) : (
            users.map((user) => {
              const isCurrentUser = user.userId === currentUser?.uid;
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
                    background: isCurrentUser ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
                    border: isCurrentUser ? '1px solid rgba(100, 108, 255, 0.3)' : '1px solid transparent',
                    marginBottom: '4px',
                    transition: 'all 0.2s'
                  }}
                >
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
                  
                  {/* User info */}
                  <div style={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    <div style={{
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: isCurrentUser ? 'bold' : 'normal',
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
                </div>
              );
            })
          )}
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
