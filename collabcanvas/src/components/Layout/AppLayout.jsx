function AppLayout({ children, user, onLogout }) {
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
      </main>
    </div>
  );
}

export default AppLayout;
