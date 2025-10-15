import { useEffect, useRef } from 'react';

/**
 * Context Menu Component for Canvas
 * Shows layer operations and other actions on right-click
 */
function ContextMenu({ 
  x, 
  y, 
  visible, 
  onClose, 
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  hasSelection
}) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!visible) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible || !hasSelection) return null;

  const menuItems = [
    { 
      label: 'Bring to Front', 
      action: onBringToFront,
      icon: '⬆️',
      shortcut: 'Ctrl+Shift+]'
    },
    { 
      label: 'Bring Forward', 
      action: onBringForward,
      icon: '↗️',
      shortcut: 'Ctrl+]'
    },
    { 
      label: 'Send Backward', 
      action: onSendBackward,
      icon: '↘️',
      shortcut: 'Ctrl+['
    },
    { 
      label: 'Send to Back', 
      action: onSendToBack,
      icon: '⬇️',
      shortcut: 'Ctrl+Shift+['
    },
    { type: 'separator' },
    { 
      label: 'Duplicate', 
      action: onDuplicate,
      icon: '📋',
      shortcut: 'Ctrl+D'
    },
    { 
      label: 'Delete', 
      action: onDelete,
      icon: '🗑️',
      shortcut: 'Del',
      danger: true
    }
  ];

  function handleMenuItemClick(action) {
    if (action) {
      action();
    }
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 10000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div key={`separator-${index}`} className="context-menu-separator" />
          );
        }

        return (
          <button
            key={item.label}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => handleMenuItemClick(item.action)}
          >
            <span className="context-menu-icon">{item.icon}</span>
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ContextMenu;

