/**
 * Dashboard Sidebar Component
 * 
 * Navigation sidebar for dashboard views
 */

import './Dashboard.css';

function Sidebar({ currentView, onChangeView, canvasCounts }) {
  const views = [
    {
      id: 'all',
      label: 'All Canvases',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
          <rect x="14" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
          <rect x="3" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
          <rect x="14" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
        </svg>
      )
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-heading">Workspace</h3>
        <nav className="sidebar-nav">
          {views.map(view => (
            <button
              key={view.id}
              className={`sidebar-item ${currentView === view.id ? 'active' : ''}`}
              onClick={() => onChangeView(view.id)}
            >
              <span className="sidebar-icon">{view.icon}</span>
              <span className="sidebar-label">{view.label}</span>
              {canvasCounts[view.id] !== undefined && (
                <span className="sidebar-count">{canvasCounts[view.id]}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Future: Organizations, Settings, etc. */}
      <div className="sidebar-section sidebar-footer">
        <button className="sidebar-item" onClick={() => alert('Settings coming soon!')}>
          <span className="sidebar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="sidebar-label">Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

