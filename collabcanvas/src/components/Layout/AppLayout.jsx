import usePresence from '../../hooks/usePresence';
import UserList from '../Presence/UserList';

function AppLayout({ children, user, onLogout }) {
  const { onlineUsers } = usePresence(user);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🎨 CollabCanvas</h1>
          <div className="user-info">
            <span className="user-name">👤 {user?.displayName || user?.email}</span>
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {children}
        {/* User presence list */}
        <UserList users={onlineUsers} currentUser={user} />
      </main>
    </div>
  );
}

export default AppLayout;
