import { Link, useLocation } from 'react-router-dom';
import AIChat from '../AI/AIChat';

function AppLayout({ children, user, onLogout }) {
  const location = useLocation();
  const isOnCanvas = location.pathname.startsWith('/canvas/');

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {isOnCanvas && (
              <Link to="/dashboard" className="btn-back">
                ← Dashboard
              </Link>
            )}
            <Link to="/dashboard" className="app-title-link">
              <h1 className="app-title">🎨 CollabCanvas</h1>
            </Link>
          </div>
          <div className="user-info">
            <span className="user-name">👤 {user?.displayName || user?.email}</span>
            {/* User presence moved to Canvas component (canvas-scoped) */}
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
      <AIChat />
    </div>
  );
}

export default AppLayout;
