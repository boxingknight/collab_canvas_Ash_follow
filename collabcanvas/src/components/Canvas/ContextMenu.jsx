import { useEffect, useRef } from 'react';

/**
 * Context Menu Component for Canvas
 * Shows layer operations, copy/paste, undo/redo, and other actions on right-click
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
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  hasSelection,
  hasClipboard,
  canUndo,
  canRedo
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

  if (!visible) return null;

  // Build menu items dynamically based on context
  const menuItems = [];
  
  // Copy/Paste section (always visible)
  if (hasSelection) {
    menuItems.push({ 
      label: 'Copy', 
      action: onCopy,
      icon: '📄',
      shortcut: '⌘C'
    });
  } else {
    menuItems.push({ 
      label: 'Copy', 
      action: null,
      icon: '📄',
      shortcut: '⌘C',
      disabled: true
    });
  }
  
  if (hasClipboard) {
    menuItems.push({ 
      label: 'Paste', 
      action: onPaste,
      icon: '📋',
      shortcut: '⌘V'
    });
  } else {
    menuItems.push({ 
      label: 'Paste', 
      action: null,
      icon: '📋',
      shortcut: '⌘V',
      disabled: true
    });
  }
  
  // Undo/Redo section
  menuItems.push({ type: 'separator' });
  
  if (canUndo) {
    menuItems.push({ 
      label: 'Undo', 
      action: onUndo,
      icon: '↩️',
      shortcut: '⌘Z'
    });
  } else {
    menuItems.push({ 
      label: 'Undo', 
      action: null,
      icon: '↩️',
      shortcut: '⌘Z',
      disabled: true
    });
  }
  
  if (canRedo) {
    menuItems.push({ 
      label: 'Redo', 
      action: onRedo,
      icon: '↪️',
      shortcut: '⌘⇧Z'
    });
  } else {
    menuItems.push({ 
      label: 'Redo', 
      action: null,
      icon: '↪️',
      shortcut: '⌘⇧Z',
      disabled: true
    });
  }
  
  // Selection-specific actions (only show if something is selected)
  if (hasSelection) {
    menuItems.push({ type: 'separator' });
    
    menuItems.push({ 
      label: 'Duplicate', 
      action: onDuplicate,
      icon: '📑',
      shortcut: '⌘D'
    });
    
    menuItems.push({ type: 'separator' });
    
    menuItems.push({ 
      label: 'Bring to Front', 
      action: onBringToFront,
      icon: '⬆️',
      shortcut: '⌘⇧]'
    });
    
    menuItems.push({ 
      label: 'Bring Forward', 
      action: onBringForward,
      icon: '↗️',
      shortcut: '⌘]'
    });
    
    menuItems.push({ 
      label: 'Send Backward', 
      action: onSendBackward,
      icon: '↘️',
      shortcut: '⌘['
    });
    
    menuItems.push({ 
      label: 'Send to Back', 
      action: onSendToBack,
      icon: '⬇️',
      shortcut: '⌘⇧['
    });
    
    menuItems.push({ type: 'separator' });
    
    menuItems.push({ 
      label: 'Delete', 
      action: onDelete,
      icon: '🗑️',
      shortcut: 'Del',
      danger: true
    });
  }

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
            className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => handleMenuItemClick(item.action)}
            disabled={item.disabled}
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

