import usePresence from '../../hooks/usePresence';
import UserList from '../Presence/UserList';

function AppLayout({ children, user, onLogout }) {
  const { onlineUsers } = usePresence(user);
  
  // Safety check for undefined onlineUsers
  const safeOnlineUsers = onlineUsers || [];
  console.log('👥 AppLayout onlineUsers:', safeOnlineUsers.length, safeOnlineUsers);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🎨 CollabCanvas</h1>
          <div className="user-info">
            <span className="user-name">👤 {user?.displayName || user?.email}</span>
            {/* User presence avatars */}
            <UserList users={safeOnlineUsers} currentUser={user} />
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
