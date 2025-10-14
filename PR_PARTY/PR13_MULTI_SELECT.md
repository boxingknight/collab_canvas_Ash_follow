# PR #13: Multi-Select Foundation 🎯

**Branch**: `feat/multi-select`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: HIGH (Required for Final Submission)  
**Estimated Time**: 2-3 hours  
**Risk Level**: MEDIUM  

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Cross-Platform Considerations](#cross-platform-considerations)
4. [Locking Mechanism Integration](#locking-mechanism-integration)
5. [Future-Proofing](#future-proofing)
6. [Implementation Details](#implementation-details)
7. [Testing Strategy](#testing-strategy)
8. [Rollout Plan](#rollout-plan)
9. [Success Criteria](#success-criteria)
10. [Risk Assessment](#risk-assessment)
11. [Bug Tracking](#bug-tracking)

---

## Overview

### Goal
Enable users to select and manipulate multiple shapes simultaneously with intuitive keyboard shortcuts and visual feedback that works seamlessly with real-time collaboration.

### Why This Matters
- **Required for final submission**: Multi-select is a mandatory feature
- **AI readiness**: AI needs to manipulate multiple shapes (e.g., "move all red shapes")
- **User experience**: Essential productivity feature for design tools
- **Foundation**: Enables group operations (move, resize, rotate, delete, duplicate)
- **Collaboration**: Must work correctly with multiple users selecting different shapes

### Key Features
- ✅ Shift-click to add/remove shapes from selection
- ✅ Combined bounding box for multiple shapes
- ✅ Group move (drag all selected shapes together)
- ✅ Group delete (Delete key removes all selected)
- ✅ Group resize via Transformer (scales all shapes proportionally)
- ✅ Group rotate via Transformer (rotates around combined center)
- ✅ Select All (Cmd/Ctrl+A)
- ✅ Deselect All (Escape)
- ✅ Selection count indicator in UI
- ✅ Real-time sync of selection state (visual feedback for other users)

---

## Architecture & Design Decisions

### 1. Selection State Management

**Decision**: Replace single `selectedShapeId` with **`selectedShapeIds` array** + custom `useSelection` hook

**Current State (Single Selection)**:
```javascript
// In useCanvas.js or Canvas.jsx
const [selectedShapeId, setSelectedShapeId] = useState(null);

// Select shape
function selectShape(shapeId) {
  setSelectedShapeId(shapeId);
}
```

**New State (Multi-Selection)**:
```javascript
// New file: hooks/useSelection.js
import { useState, useCallback } from 'react';

export function useSelection() {
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  
  // Add shape to selection
  const addToSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) ? prev : [...prev, shapeId]
    );
  }, []);
  
  // Remove shape from selection
  const removeFromSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
  }, []);
  
  // Toggle shape in selection (for shift-click)
  const toggleSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    );
  }, []);
  
  // Replace selection (normal click)
  const setSelection = useCallback((shapeIds) => {
    setSelectedShapeIds(Array.isArray(shapeIds) ? shapeIds : [shapeIds]);
  }, []);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);
  
  // Select all
  const selectAll = useCallback((allShapeIds) => {
    setSelectedShapeIds(allShapeIds);
  }, []);
  
  // Check if shape is selected
  const isSelected = useCallback((shapeId) => {
    return selectedShapeIds.includes(shapeId);
  }, [selectedShapeIds]);
  
  return {
    selectedShapeIds,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectionCount: selectedShapeIds.length,
    hasSelection: selectedShapeIds.length > 0,
    isMultiSelect: selectedShapeIds.length > 1
  };
}
```

**Rationale**:
- ✅ Clean API for all selection operations
- ✅ Centralized selection logic
- ✅ Easy to test and maintain
- ✅ Provides useful computed values
- ✅ Memoized callbacks prevent unnecessary re-renders

---

### 2. Click Behavior Architecture

**Decision**: **Shift-click toggles**, **normal click replaces** selection

```javascript
// In Canvas.jsx or Shape.jsx
function handleShapeClick(e, shapeId) {
  e.cancelBubble = true; // Prevent stage click
  
  if (e.evt.shiftKey) {
    // Shift-click: Toggle in selection
    toggleSelection(shapeId);
  } else {
    // Normal click: Replace selection
    setSelection([shapeId]);
  }
  
  // Switch to move mode if not already
  if (mode === 'pan') {
    setMode('move');
  }
}
```

**Edge Cases Handled**:
1. **Click empty canvas**: Clear selection (return to pan mode)
2. **Click selected shape**: Keep selection (don't deselect)
3. **Shift-click selected shape**: Remove from selection
4. **Shift-click during drag**: Don't modify selection
5. **Click locked shape**: Select but don't allow drag

**Keyboard Shortcuts**:
- `Shift + Click`: Toggle shape in selection
- `Cmd/Ctrl + A`: Select all shapes
- `Escape`: Clear selection
- `Delete/Backspace`: Delete all selected shapes
- `Cmd/Ctrl + D`: Duplicate all selected shapes (PR #15)

---

### 3. Group Transform Architecture

**Decision**: **Single Transformer wrapping combined bounding box**

```javascript
// Calculate combined bounding box for multiple shapes
function getSelectionBounds(selectedShapes) {
  if (selectedShapes.length === 0) return null;
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  selectedShapes.forEach(shape => {
    // Calculate shape bounds (accounting for rotation if needed)
    const bounds = getShapeBounds(shape);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// In Canvas.jsx
{isMultiSelect && (
  <Transformer
    ref={transformerRef}
    nodes={selectedShapeRefs}
    keepRatio={false}
    enabledAnchors={[
      'top-left', 'top-right', 
      'bottom-left', 'bottom-right',
      'middle-left', 'middle-right',
      'top-center', 'bottom-center'
    ]}
    rotateEnabled={true}
    boundBoxFunc={(oldBox, newBox) => {
      // Prevent negative scaling
      if (newBox.width < 5 || newBox.height < 5) {
        return oldBox;
      }
      return newBox;
    }}
  />
)}
```

**Group Transform Behaviors**:

**Group Move**:
```javascript
function handleGroupDragEnd(e) {
  const dx = e.target.x();
  const dy = e.target.y();
  
  // Update all selected shapes
  selectedShapeIds.forEach(async (shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && !shape.lockedBy) {
      await updateShape(shapeId, {
        x: shape.x + dx,
        y: shape.y + dy
      });
    }
  });
  
  // Reset drag position
  e.target.position({ x: 0, y: 0 });
}
```

**Group Resize**:
```javascript
function handleGroupTransformEnd(nodes) {
  nodes.forEach(async (node) => {
    const shape = node.attrs.shape; // Store original shape
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Update shape with new dimensions
    await updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
      width: shape.width * scaleX,
      height: shape.height * scaleY,
      rotation: node.rotation()
    });
    
    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);
  });
}
```

**Group Rotate**:
```javascript
function handleGroupRotation(nodes) {
  const center = getSelectionCenter(selectedShapes);
  const rotation = transformerRef.current.rotation();
  
  nodes.forEach(async (node) => {
    const shape = node.attrs.shape;
    
    // Calculate new position after rotation around center
    const newPos = rotatePointAroundCenter(
      { x: shape.x, y: shape.y },
      center,
      rotation
    );
    
    await updateShape(shape.id, {
      x: newPos.x,
      y: newPos.y,
      rotation: (shape.rotation || 0) + rotation
    });
  });
}
```

**Rationale**:
- ✅ Standard behavior for design tools
- ✅ Single Transformer handles all selected shapes
- ✅ Proportional scaling maintains relationships
- ✅ Rotation around combined center feels natural
- ✅ Each shape updates individually in Firestore (proper sync)

---

### 4. Visual Feedback Architecture

**Decision**: **Multi-layer visual hierarchy** for clarity

**Selection Indicators**:
```javascript
// In Shape.jsx
<Group>
  {/* Main shape */}
  <Rect {...shapeProps} />
  
  {/* Selection highlight (if selected) */}
  {isSelected && (
    <Rect
      x={shape.x - 2}
      y={shape.y - 2}
      width={shape.width + 4}
      height={shape.height + 4}
      stroke={isMultiSelect ? '#3b82f6' : '#60a5fa'} // Darker blue for multi
      strokeWidth={2}
      dash={isMultiSelect ? [5, 5] : undefined} // Dashed for multi
      listening={false}
    />
  )}
  
  {/* Lock indicator (if locked by someone else) */}
  {shape.lockedBy && shape.lockedBy !== currentUserId && (
    <Text
      x={shape.x + shape.width + 10}
      y={shape.y}
      text="🔒"
      fontSize={16}
      listening={false}
    />
  )}
</Group>
```

**Selection Count Badge**:
```javascript
// In Canvas.jsx or Toolbar
{selectionCount > 0 && (
  <div className="selection-badge">
    {selectionCount} shape{selectionCount !== 1 ? 's' : ''} selected
  </div>
)}
```

**Visual Hierarchy**:
1. **Unselected shapes**: Normal appearance
2. **Single selected**: Solid blue border (2px)
3. **Multi-selected**: Dashed blue border (2px, darker shade)
4. **Locked shapes**: Lock icon indicator
5. **Combined bounds**: Transformer handles (only visible in Move mode)

**Rationale**:
- ✅ Clear distinction between single and multi-select
- ✅ User always knows what's selected
- ✅ Lock status visible to prevent confusion
- ✅ Non-intrusive visual design

---

### 5. Group Operations Architecture

**Decision**: **Batch operations** with individual Firestore writes

```javascript
// Group delete
async function deleteSelectedShapes() {
  if (selectedShapeIds.length === 0) return;
  
  // Filter out locked shapes
  const shapesToDelete = selectedShapeIds.filter(id => {
    const shape = shapes.find(s => s.id === id);
    return shape && (!shape.lockedBy || shape.lockedBy === currentUserId);
  });
  
  // Delete all (Firestore operations are independent)
  await Promise.all(
    shapesToDelete.map(id => deleteShape(id))
  );
  
  // Clear selection
  clearSelection();
}

// Group move (during drag)
function handleMultiDragMove(e) {
  const dx = e.target.x();
  const dy = e.target.y();
  
  // Optimistic local update (immediate)
  setShapes(prevShapes => 
    prevShapes.map(shape => 
      selectedShapeIds.includes(shape.id)
        ? { ...shape, x: shape.originalX + dx, y: shape.originalY + dy }
        : shape
    )
  );
  
  // Debounced Firestore writes (every 300ms)
  debouncedGroupUpdate(selectedShapeIds, dx, dy);
}

// Group move (on drag end)
async function handleMultiDragEnd(e) {
  const dx = e.target.x();
  const dy = e.target.y();
  
  // Cancel pending debounced updates
  debouncedGroupUpdate.cancel();
  
  // Immediate Firestore writes
  await Promise.all(
    selectedShapeIds.map(async (id) => {
      const shape = shapes.find(s => s.id === id);
      if (shape && (!shape.lockedBy || shape.lockedBy === currentUserId)) {
        await updateShape(id, {
          x: shape.originalX + dx,
          y: shape.originalY + dy
        });
        await unlockShape(id); // Release lock
      }
    })
  );
  
  // Reset drag position
  e.target.position({ x: 0, y: 0 });
}
```

**Locking During Group Operations**:
```javascript
// Lock all selected shapes before drag
async function lockSelectedShapes() {
  await Promise.all(
    selectedShapeIds.map(id => lockShape(id, currentUserId))
  );
}

// Unlock all selected shapes after operation
async function unlockSelectedShapes() {
  await Promise.all(
    selectedShapeIds.map(id => unlockShape(id))
  );
}
```

**Rationale**:
- ✅ Individual Firestore writes ensure proper sync
- ✅ Promise.all for parallel operations (faster)
- ✅ Optimistic updates maintain 60 FPS
- ✅ Debouncing reduces write costs
- ✅ Respects existing locking mechanism
- ✅ Works with real-time collaboration

---

### 6. AI Integration Architecture

**Decision**: Selection API exposed for AI commands

```javascript
// In canvasAPI.js (for AI to use)
export const canvasAPI = {
  // ... existing methods
  
  // Selection operations
  selectShapes(shapeIds) {
    setSelection(shapeIds);
    return { success: true, count: shapeIds.length };
  },
  
  selectShapesByType(type) {
    const matchingIds = shapes
      .filter(s => s.type === type)
      .map(s => s.id);
    setSelection(matchingIds);
    return { success: true, count: matchingIds.length };
  },
  
  selectShapesByColor(color) {
    const matchingIds = shapes
      .filter(s => s.color === color)
      .map(s => s.id);
    setSelection(matchingIds);
    return { success: true, count: matchingIds.length };
  },
  
  getSelectedShapes() {
    return shapes.filter(s => selectedShapeIds.includes(s.id));
  },
  
  clearSelection() {
    clearSelection();
    return { success: true };
  },
  
  // Group operations
  moveSelectedShapes(dx, dy) {
    const selected = getSelectedShapes();
    return Promise.all(
      selected.map(s => updateShape(s.id, { x: s.x + dx, y: s.y + dy }))
    );
  },
  
  deleteSelectedShapes() {
    return deleteSelectedShapes();
  }
};
```

**AI Command Examples**:
- "Select all red shapes" → `selectShapesByColor('#ff0000')`
- "Move selected shapes right by 100px" → `moveSelectedShapes(100, 0)`
- "Delete all circles" → `selectShapesByType('circle')` + `deleteSelectedShapes()`
- "Arrange selected shapes in a row" → Uses `getSelectedShapes()` for layout

**Rationale**:
- ✅ Clean API for AI to manipulate selection
- ✅ All selection logic reusable by AI
- ✅ Consistent behavior between manual and AI operations

---

## Cross-Platform Considerations

### Desktop Browsers ✅

**Fully Supported**:
- ✅ Chrome, Firefox, Safari, Edge (latest versions)
- ✅ Shift-click works perfectly
- ✅ Cmd/Ctrl detection automatic
- ✅ Keyboard shortcuts work
- ✅ Transformer handles responsive

**Keyboard Modifiers**:
```javascript
// Platform-specific modifier detection
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

function handleKeyDown(e) {
  // Cmd+A on Mac, Ctrl+A on Windows/Linux
  if (e[modifierKey] && e.key === 'a') {
    e.preventDefault();
    selectAll(shapes.map(s => s.id));
  }
}
```

---

### Mobile & Tablet 📱

**Challenges**:
- ❌ No Shift key for multi-select
- ❌ No keyboard shortcuts
- ❌ Touch events different from mouse events

**Solution: Long-press multi-select mode**:
```javascript
// Long-press to enter multi-select mode
function handleTouchStart(e, shapeId) {
  const touchTimer = setTimeout(() => {
    // Enter multi-select mode
    setMultiSelectMode(true);
    addToSelection(shapeId);
    
    // Visual feedback
    showToast('Multi-select mode enabled. Tap shapes to add/remove.');
  }, 500); // 500ms long-press
  
  setTouchTimer(touchTimer);
}

function handleTouchEnd() {
  clearTimeout(touchTimer);
}

// Tap behavior in multi-select mode
function handleShapeTap(e, shapeId) {
  if (multiSelectMode) {
    toggleSelection(shapeId);
  } else {
    setSelection([shapeId]);
  }
}
```

**Mobile UI Additions**:
```javascript
// Multi-select toggle button
{isMobileDevice() && (
  <button
    className={`multi-select-btn ${multiSelectMode ? 'active' : ''}`}
    onClick={() => setMultiSelectMode(!multiSelectMode)}
  >
    {multiSelectMode ? 'Exit Multi-Select' : 'Multi-Select'}
  </button>
)}
```

**Rationale**:
- ✅ Long-press is familiar mobile pattern
- ✅ Toggle button provides explicit control
- ✅ Visual feedback guides user
- ✅ Maintains single-select simplicity by default

---

### Touch Events Handling

```javascript
// Unified event handling
function handlePointerDown(e) {
  const isTouch = e.evt.type.startsWith('touch');
  const isShiftKey = !isTouch && e.evt.shiftKey;
  const isLongPress = isTouch && multiSelectMode;
  
  if (isShiftKey || isLongPress) {
    toggleSelection(shapeId);
  } else {
    setSelection([shapeId]);
  }
}
```

---

## Locking Mechanism Integration

### Lock During Multi-Select Drag ✅

**Pattern**: Lock all selected shapes before group drag starts

```javascript
// In Canvas.jsx or Shape.jsx
async function handleMultiDragStart(e) {
  // Lock all selected shapes
  const lockPromises = selectedShapeIds.map(id => {
    const shape = shapes.find(s => s.id === id);
    // Only lock if not already locked by someone else
    if (shape && (!shape.lockedBy || shape.lockedBy === currentUserId)) {
      return lockShape(id, currentUserId);
    }
    return Promise.resolve();
  });
  
  await Promise.all(lockPromises);
  
  // Store original positions
  setOriginalPositions(
    shapes
      .filter(s => selectedShapeIds.includes(s.id))
      .map(s => ({ id: s.id, x: s.x, y: s.y }))
  );
}
```

---

### Partial Lock Handling ⚠️

**Scenario**: User selects 5 shapes, but 2 are locked by another user

**Solution**: Operate on unlocked shapes only, show feedback

```javascript
function handleGroupOperation(operation) {
  // Split into locked and unlocked
  const unlocked = selectedShapeIds.filter(id => {
    const shape = shapes.find(s => s.id === id);
    return !shape.lockedBy || shape.lockedBy === currentUserId;
  });
  
  const lockedByOthers = selectedShapeIds.filter(id => {
    const shape = shapes.find(s => s.id === id);
    return shape.lockedBy && shape.lockedBy !== currentUserId;
  });
  
  // Perform operation on unlocked shapes
  if (unlocked.length > 0) {
    performOperation(unlocked);
  }
  
  // Show warning if some were locked
  if (lockedByOthers.length > 0) {
    showToast(
      `${lockedByOthers.length} shape(s) are locked by other users and were skipped.`,
      'warning'
    );
  }
  
  // Remove locked shapes from selection
  setSelection(unlocked);
}
```

**Visual Indication**:
```javascript
// In Shape.jsx - dim locked shapes in multi-select
<Group opacity={isLockedByOthers ? 0.5 : 1.0}>
  {/* Shape content */}
</Group>
```

**Rationale**:
- ✅ User can still work with unlocked shapes
- ✅ Clear feedback about what happened
- ✅ Prevents frustration
- ✅ Maintains collaborative integrity

---

### Lock Timeout

**Existing 30-second lock timeout applies**:
- If a user starts dragging multiple shapes but crashes/disconnects
- Locks auto-expire after 30 seconds
- Other users can then manipulate those shapes

---

## Future-Proofing

### For Drag-Select (PR #14)

Multi-select foundation enables drag-select box:

```javascript
// Future: Drag-select box
function handleStageMouseDown(e) {
  if (mode === 'move' && e.target === stage) {
    // Start selection box
    setSelectionBox({
      x: stage.getPointerPosition().x,
      y: stage.getPointerPosition().y,
      width: 0,
      height: 0
    });
  }
}

function handleStageMouseMove(e) {
  if (selectionBox) {
    // Update selection box size
    const pos = stage.getPointerPosition();
    setSelectionBox(prev => ({
      ...prev,
      width: pos.x - prev.x,
      height: pos.y - prev.y
    }));
  }
}

function handleStageMouseUp() {
  if (selectionBox) {
    // Find shapes intersecting box
    const intersecting = shapes.filter(shape => 
      intersects(shape, selectionBox)
    );
    
    // Set selection to intersecting shapes
    setSelection(intersecting.map(s => s.id));
    
    // Clear selection box
    setSelectionBox(null);
  }
}
```

**Interface Preserved**:
- `setSelection([ids])` - Works the same
- `selectedShapeIds` - Same array structure
- Visual feedback - Same rendering logic

---

### For Duplicate (PR #15)

Multi-select enables group duplicate:

```javascript
// Future: Duplicate selected shapes (Cmd+D)
async function duplicateSelectedShapes() {
  if (selectedShapeIds.length === 0) return;
  
  const newShapeIds = [];
  
  // Duplicate each shape with offset
  await Promise.all(
    selectedShapeIds.map(async (id) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;
      
      const newShape = {
        ...shape,
        x: shape.x + 20,
        y: shape.y + 20,
        createdBy: currentUserId,
        createdAt: serverTimestamp()
      };
      
      const newId = await addShape(newShape);
      newShapeIds.push(newId);
    })
  );
  
  // Select newly created shapes
  setSelection(newShapeIds);
}
```

---

### For Layer Management (PR #17)

Multi-select enables group layer operations:

```javascript
// Future: Bring all selected shapes forward
async function bringSelectedForward() {
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
  
  await Promise.all(
    selectedShapeIds.map((id, index) => 
      updateShape(id, { zIndex: maxZIndex + index + 1 })
    )
  );
}
```

---

### For AI Commands (PR #18-24)

Selection API is already AI-ready:

```javascript
// AI can use these directly
canvasAPI.selectShapesByType('rectangle');
canvasAPI.moveSelectedShapes(100, 0);
canvasAPI.deleteSelectedShapes();

// Or chain operations
canvasAPI.selectShapesByColor('#ff0000');
const selected = canvasAPI.getSelectedShapes();
// Arrange selected shapes...
```

---

## Implementation Details

### Files to Create

#### 1. `src/hooks/useSelection.js` (NEW)

```javascript
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing shape selection state
 * Supports both single and multi-select operations
 */
export function useSelection() {
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  
  const addToSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) ? prev : [...prev, shapeId]
    );
  }, []);
  
  const removeFromSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
  }, []);
  
  const toggleSelection = useCallback((shapeId) => {
    setSelectedShapeIds(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    );
  }, []);
  
  const setSelection = useCallback((shapeIds) => {
    const ids = Array.isArray(shapeIds) ? shapeIds : [shapeIds];
    setSelectedShapeIds(ids);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);
  
  const selectAll = useCallback((allShapeIds) => {
    setSelectedShapeIds(allShapeIds);
  }, []);
  
  const isSelected = useCallback((shapeId) => {
    return selectedShapeIds.includes(shapeId);
  }, [selectedShapeIds]);
  
  return {
    selectedShapeIds,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectionCount: selectedShapeIds.length,
    hasSelection: selectedShapeIds.length > 0,
    isMultiSelect: selectedShapeIds.length > 1
  };
}
```

---

### Files to Modify

#### 2. `src/components/Canvas/Canvas.jsx` (MODIFY)

**Changes**:
1. Replace `selectedShapeId` state with `useSelection` hook
2. Add keyboard event handler (Escape, Cmd+A, Delete)
3. Update click handler to support shift-click
4. Update Transformer to handle multiple shapes
5. Add group drag handlers
6. Add selection count badge

**Key Updates**:

```javascript
// Import new hook
import { useSelection } from '../../hooks/useSelection';

function Canvas() {
  // Replace single selection with multi-selection hook
  const {
    selectedShapeIds,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectionCount,
    isMultiSelect
  } = useSelection();
  
  // ... existing state
  
  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore if typing in text field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + A: Select all
      if (modifierKey && e.key === 'a') {
        e.preventDefault();
        selectAll(shapes.map(s => s.id));
      }
      
      // Escape: Clear selection (and return to pan mode)
      if (e.key === 'Escape') {
        clearSelection();
        setMode('pan');
      }
      
      // Delete/Backspace: Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectionCount > 0) {
        e.preventDefault();
        deleteSelectedShapes();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, selectionCount]);
  
  // Click handler with shift-key support
  function handleShapeClick(e, shapeId) {
    e.cancelBubble = true;
    
    if (e.evt.shiftKey) {
      // Shift-click: Toggle in selection
      toggleSelection(shapeId);
    } else {
      // Normal click: Replace selection
      setSelection([shapeId]);
    }
    
    // Switch to move mode
    if (mode === 'pan') {
      setMode('move');
    }
  }
  
  // Stage click: Clear selection
  function handleStageClick(e) {
    if (e.target === e.target.getStage()) {
      clearSelection();
      if (mode === 'move') {
        setMode('pan');
      }
    }
  }
  
  // Group delete
  async function deleteSelectedShapes() {
    if (selectionCount === 0) return;
    
    // Filter out locked shapes
    const unlocked = selectedShapeIds.filter(id => {
      const shape = shapes.find(s => s.id === id);
      return !shape?.lockedBy || shape.lockedBy === user.uid;
    });
    
    // Delete shapes
    await Promise.all(unlocked.map(id => deleteShape(id)));
    
    // Clear selection
    clearSelection();
  }
  
  // Update Transformer ref when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;
    
    const selectedNodes = selectedShapeIds
      .map(id => shapeRefs.current[id])
      .filter(Boolean);
    
    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedShapeIds]);
  
  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleStageClick}
      // ... other props
    >
      <Layer>
        {/* Shapes */}
        {shapes.map(shape => (
          <Shape
            key={shape.id}
            shape={shape}
            isSelected={isSelected(shape.id)}
            isMultiSelect={isMultiSelect}
            onSelect={(e) => handleShapeClick(e, shape.id)}
            shapeRef={(ref) => shapeRefs.current[shape.id] = ref}
            // ... other props
          />
        ))}
        
        {/* Transformer for selection */}
        {selectionCount > 0 && mode === 'move' && (
          <Transformer
            ref={transformerRef}
            keepRatio={false}
            rotateEnabled={true}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />
        )}
        
        {/* Remote cursors */}
        {/* ... */}
      </Layer>
      
      {/* Selection count badge */}
      {selectionCount > 0 && (
        <Html>
          <div className="selection-badge">
            {selectionCount} shape{selectionCount !== 1 ? 's' : ''} selected
          </div>
        </Html>
      )}
    </Stage>
  );
}
```

---

#### 3. `src/components/Canvas/Shape.jsx` (MODIFY)

**Changes**:
1. Accept `isMultiSelect` prop
2. Update selection highlight style for multi-select
3. Pass ref to parent for Transformer

```javascript
export const Shape = React.memo(({ 
  shape, 
  isSelected, 
  isMultiSelect,  // NEW
  onSelect, 
  onDragStart, 
  onDragEnd,
  shapeRef  // NEW: for Transformer
}) => {
  const { user } = useAuth();
  const isLocked = shape.lockedBy && shape.lockedBy !== user?.uid;
  
  // Common props for all shapes
  const commonProps = {
    draggable: !isLocked,
    onClick: onSelect,
    onTap: onSelect,
    onDragStart,
    onDragEnd,
    ref: shapeRef,  // Attach ref for Transformer
    // ... other props
  };
  
  // Selection border style
  const selectionStroke = isMultiSelect ? '#3b82f6' : '#60a5fa'; // Darker for multi
  const selectionDash = isMultiSelect ? [5, 5] : undefined; // Dashed for multi
  
  // Render shape based on type
  return (
    <Group>
      {shape.type === 'rectangle' && (
        <Rect
          {...commonProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.color}
          stroke={isSelected ? selectionStroke : undefined}
          strokeWidth={isSelected ? 2 : 0}
          dash={isSelected ? selectionDash : undefined}
        />
      )}
      
      {shape.type === 'circle' && (
        <Circle
          {...commonProps}
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          radius={shape.width / 2}
          fill={shape.color}
          stroke={isSelected ? selectionStroke : undefined}
          strokeWidth={isSelected ? 2 : 0}
          dash={isSelected ? selectionDash : undefined}
        />
      )}
      
      {/* ... other shape types */}
      
      {/* Lock indicator */}
      {isLocked && (
        <Text
          x={shape.x + shape.width + 10}
          y={shape.y}
          text="🔒"
          fontSize={16}
          listening={false}
        />
      )}
    </Group>
  );
});
```

---

#### 4. `src/App.css` or `src/index.css` (MODIFY)

Add styles for selection badge:

```css
/* Selection count badge */
.selection-badge {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(59, 130, 246, 0.95);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Multi-select mode button (mobile) */
.multi-select-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.multi-select-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.multi-select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
  /* Hide on desktop (has shift key) */
  .multi-select-btn {
    display: none;
  }
}
```

---

## Testing Strategy

### Manual Testing Checklist

#### Single User Testing ✅

**Basic Selection**:
- [ ] Click shape → Shape selected (blue border)
- [ ] Click empty canvas → Selection cleared
- [ ] Click another shape → First deselected, new one selected
- [ ] Press Escape → Selection cleared

**Multi-Select**:
- [ ] Shift-click shape 1 → Shape 1 selected
- [ ] Shift-click shape 2 → Both shapes selected (dashed blue borders)
- [ ] Shift-click shape 1 again → Shape 1 removed from selection
- [ ] Click empty canvas → All deselected

**Select All**:
- [ ] Create 5 shapes
- [ ] Press Cmd+A (Mac) / Ctrl+A (Windows) → All 5 selected
- [ ] Selection count shows "5 shapes selected"

**Group Delete**:
- [ ] Select 3 shapes (shift-click)
- [ ] Press Delete → All 3 deleted
- [ ] Select 2 shapes, press Backspace → All 2 deleted

**Group Move**:
- [ ] Select 3 shapes
- [ ] Switch to Move mode (M)
- [ ] Drag any selected shape → All 3 move together
- [ ] Release → All 3 shapes update in Firestore

**Group Resize**:
- [ ] Select 2 rectangles
- [ ] Drag Transformer corner handle → Both resize proportionally
- [ ] Shapes maintain relative positions

**Group Rotate**:
- [ ] Select 3 shapes
- [ ] Drag Transformer rotation handle → All 3 rotate around combined center
- [ ] Each shape updates with new position and rotation

---

#### Multi-User Testing ✅

**Collaborative Selection**:
- [ ] User A selects shape 1 → User B sees highlight
- [ ] User B selects shape 2 → User A sees highlight
- [ ] Both can have different selections simultaneously

**Lock Conflicts**:
- [ ] User A selects and drags shape 1 → Locked
- [ ] User B tries to select shape 1 → Can select but not drag
- [ ] User A releases → Shape unlocked
- [ ] User B can now drag shape 1

**Group Lock Conflicts**:
- [ ] User A selects shapes 1, 2, 3
- [ ] User B starts dragging shape 2 (locks it)
- [ ] User A tries to drag group → Shapes 1 & 3 move, shape 2 stays (locked)
- [ ] Warning message shown to User A

**Group Operations Sync**:
- [ ] User A selects 3 shapes and moves them
- [ ] User B sees all 3 shapes move in real-time
- [ ] User A resizes group → User B sees resize
- [ ] User A rotates group → User B sees rotation

---

#### Cross-Platform Testing 📱

**Desktop Browsers**:
- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Edge: All features work

**Mobile (iOS Safari)**:
- [ ] Long-press shape → Multi-select mode enabled
- [ ] Tap additional shapes → Added to selection
- [ ] Multi-select button visible and functional
- [ ] Exit multi-select button works

**Mobile (Android Chrome)**:
- [ ] Long-press shape → Multi-select mode enabled
- [ ] Tap additional shapes → Added to selection
- [ ] Multi-select button visible and functional
- [ ] Group drag works with touch

**Tablet (iPad)**:
- [ ] Multi-select mode works
- [ ] Transformer handles large enough for fingers
- [ ] Group operations smooth

---

### Performance Testing

**Selection Performance**:
- [ ] Create 100 shapes
- [ ] Select all (Cmd+A) → Selection happens instantly (<50ms)
- [ ] Shift-click 50 shapes → Each addition is instant
- [ ] Drag all 100 shapes → Maintains 60 FPS

**Rendering Performance**:
- [ ] 50 shapes selected → Maintains 60 FPS
- [ ] 100 shapes selected → Still 60 FPS
- [ ] Selection highlights don't cause lag

**Firestore Performance**:
- [ ] Drag 10 selected shapes → Debounced writes (~3 writes/sec per shape)
- [ ] Release drag → Immediate writes (10 writes)
- [ ] No excessive read/write operations

---

### Edge Cases Testing

**Empty Selection**:
- [ ] Press Delete with no selection → Nothing happens
- [ ] Press Cmd+D with no selection → Nothing happens
- [ ] Drag on empty canvas → No error

**All Shapes Locked**:
- [ ] User A locks all shapes (dragging each)
- [ ] User B selects all shapes
- [ ] User B tries to move → Warning shown, nothing moves

**Partial Lock**:
- [ ] Select 5 shapes
- [ ] Another user locks 2 of them
- [ ] Drag group → Only 3 unlocked shapes move
- [ ] Warning shows "2 shapes are locked"

**Rapid Selection Changes**:
- [ ] Rapidly shift-click 20 shapes → All selections register
- [ ] Rapidly click between shapes → No flickering
- [ ] Press Escape repeatedly → No errors

**Selection During Drag**:
- [ ] Start dragging a shape
- [ ] Try to shift-click another shape → Second shape not added (drag in progress)
- [ ] Release drag → Normal selection works again

---

### Automated Testing (Future)

```javascript
// Example test structure (for future implementation)
describe('Multi-Select', () => {
  test('shift-click adds to selection', () => {
    // Test logic
  });
  
  test('cmd+a selects all shapes', () => {
    // Test logic
  });
  
  test('group move updates all shapes', () => {
    // Test logic
  });
  
  test('locked shapes excluded from group operations', () => {
    // Test logic
  });
});
```

---

## Rollout Plan

### Phase 1: Core Selection Hook (30 min)

1. Create `src/hooks/useSelection.js`
2. Implement all selection methods
3. Add unit tests (manual testing)
4. Verify hook works in isolation

**Success Criteria**:
- ✅ Hook created with all methods
- ✅ Methods work correctly (test in console)

---

### Phase 2: Integrate with Canvas (45 min)

1. Modify `Canvas.jsx` to use `useSelection`
2. Replace `selectedShapeId` with `selectedShapeIds`
3. Update shape click handler (shift-key support)
4. Add keyboard event listener (Escape, Cmd+A, Delete)
5. Update Transformer to handle multiple nodes

**Success Criteria**:
- ✅ Basic selection works (single shape)
- ✅ Shift-click adds to selection
- ✅ Cmd+A selects all
- ✅ Escape clears selection

---

### Phase 3: Visual Feedback (20 min)

1. Update `Shape.jsx` with multi-select border style
2. Add selection count badge to Canvas
3. Add CSS styles for badge
4. Test visual feedback

**Success Criteria**:
- ✅ Selected shapes show correct borders
- ✅ Multi-select has dashed borders
- ✅ Badge shows selection count
- ✅ Visual polish looks good

---

### Phase 4: Group Operations (40 min)

1. Implement group move during drag
2. Implement group delete
3. Add group locking (lock all before drag)
4. Add unlock after drag completes
5. Handle partial locks (skip locked shapes)

**Success Criteria**:
- ✅ Dragging one selected shape moves all
- ✅ Delete removes all selected shapes
- ✅ Locked shapes skipped in operations
- ✅ Warning shown for locked shapes

---

### Phase 5: Multi-User Testing (30 min)

1. Deploy to Firebase
2. Open in 2+ browsers
3. Test selection conflicts
4. Test group operations with collaboration
5. Test lock scenarios

**Success Criteria**:
- ✅ Multi-user selection works
- ✅ Locking prevents conflicts
- ✅ Real-time sync working (<100ms)
- ✅ No ghost shapes or desyncs

---

### Phase 6: Cross-Platform Support (15 min)

1. Add mobile detection utility
2. Add long-press handler for mobile
3. Add multi-select toggle button (mobile only)
4. Test on mobile device or emulator

**Success Criteria**:
- ✅ Mobile multi-select works (long-press or button)
- ✅ Desktop shift-click works
- ✅ Keyboard shortcuts work on desktop

---

### Phase 7: Polish & Documentation (10 min)

1. Add code comments
2. Update README with multi-select instructions
3. Add keyboard shortcut tooltips
4. Final testing pass

**Success Criteria**:
- ✅ Code well-commented
- ✅ Documentation updated
- ✅ All tests passing
- ✅ Ready for PR #14 (drag-select)

---

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/multi-select

# Phase 1-2: Basic implementation
git add src/hooks/useSelection.js src/components/Canvas/Canvas.jsx
git commit -m "feat: add multi-select foundation with useSelection hook"

# Phase 3: Visual feedback
git add src/components/Canvas/Shape.jsx src/index.css
git commit -m "feat: add multi-select visual feedback and badge"

# Phase 4: Group operations
git add src/components/Canvas/Canvas.jsx
git commit -m "feat: add group move, delete, and locking"

# Phase 5-6: Testing and mobile
git add src/components/Canvas/Canvas.jsx src/utils/helpers.js
git commit -m "feat: add mobile multi-select support"

# Phase 7: Documentation
git add README.md
git commit -m "docs: update README with multi-select instructions"

# Push and merge
git push origin feat/multi-select
# Create PR, review, merge to main

# Deploy
firebase deploy
```

---

## Success Criteria

### Must Have (Required) ✅

- [ ] **Selection API**: `useSelection` hook with all methods
- [ ] **Shift-click multi-select**: Add/remove shapes from selection
- [ ] **Cmd+A select all**: Works on Mac and Windows
- [ ] **Escape to deselect**: Clears selection and returns to pan mode
- [ ] **Visual feedback**: Dashed blue borders for multi-select
- [ ] **Selection count badge**: Shows "X shapes selected"
- [ ] **Group move**: Drag one selected shape moves all
- [ ] **Group delete**: Delete key removes all selected
- [ ] **Group resize**: Transformer scales all selected shapes
- [ ] **Group rotate**: Transformer rotates all selected shapes
- [ ] **Locking integration**: Respects existing lock mechanism
- [ ] **Partial lock handling**: Skips locked shapes with warning
- [ ] **Real-time sync**: Multi-select works across users (<100ms)
- [ ] **60 FPS maintained**: No performance degradation with selection
- [ ] **Desktop browser support**: Chrome, Firefox, Safari, Edge
- [ ] **Mobile support**: Long-press or button for multi-select

---

### Nice to Have (Stretch) 🎯

- [ ] **Selection animation**: Smooth fade-in for borders
- [ ] **Keyboard nudging**: Arrow keys move selected shapes (1px, 10px with shift)
- [ ] **Selection preview**: Hover effect before clicking
- [ ] **Selection history**: Remember last selection after deselect
- [ ] **Smart selection**: Double-click selects all shapes of same type
- [ ] **Selection lasso**: Alt+drag for freeform selection
- [ ] **Performance optimization**: Virtual selection rendering for 1000+ shapes

---

### Out of Scope (Explicitly Not Included) ❌

- ❌ **Drag-select box**: This is PR #14
- ❌ **Duplicate operation**: This is PR #15
- ❌ **Copy/paste**: This is PR #25
- ❌ **Undo/redo**: This is PR #26
- ❌ **Group/ungroup**: Future feature (not in MVP)
- ❌ **Align shapes**: Future feature (AI can do this)
- ❌ **Distribute evenly**: Future feature (AI can do this)
- ❌ **Selection presets**: Future feature

---

## Risk Assessment

### Technical Risks

**Risk 1: Transformer Complexity with Multi-Select** 🟡 MEDIUM

**Description**: Konva Transformer with multiple nodes can be complex  
**Impact**: Group resize/rotate might not work as expected  
**Probability**: 40%

**Mitigation**:
- Start with group move (simpler)
- Test Transformer with 2 shapes first
- Research Konva docs for multi-node transform
- Fallback: Disable group resize if too complex (still have group move/delete)

**Contingency**:
- If Transformer too complex, only support group move/delete
- Add group resize/rotate in separate PR after research

---

**Risk 2: Performance with Large Selections** 🟡 MEDIUM

**Description**: Selecting 100+ shapes might slow down rendering  
**Impact**: FPS drops, laggy interaction  
**Probability**: 30%

**Mitigation**:
- Use React.memo on Shape components (already done)
- Memoize selection calculations
- Debounce visual updates during drag
- Profile with 500 shapes

**Contingency**:
- Limit selection to 50 shapes max with warning
- Implement virtual rendering if needed

---

**Risk 3: Mobile Multi-Select UX** 🟢 LOW

**Description**: Long-press or button might feel awkward  
**Impact**: Poor mobile experience  
**Probability**: 20%

**Mitigation**:
- Test both long-press and button approaches
- Add clear visual feedback
- Include tutorial/tooltip on first use

**Contingency**:
- Focus on desktop for MVP
- Polish mobile in later PR

---

**Risk 4: Lock Conflicts with Group Operations** 🟡 MEDIUM

**Description**: Complex scenarios with partial locks  
**Impact**: Confusing behavior, frustrated users  
**Probability**: 40%

**Mitigation**:
- Clear warning messages
- Visual indication of locked shapes
- Skip locked shapes gracefully
- Test thoroughly with 2+ users

**Contingency**:
- Simplify: If any shape locked, block entire operation
- Better UX, less complex logic

---

### Project Risks

**Risk 5: Timeline Pressure** 🟡 MEDIUM

**Description**: 2-3 hours estimated, could take longer  
**Impact**: Delays AI integration (most critical)  
**Probability**: 50%

**Mitigation**:
- Start with minimal viable multi-select (just move/delete)
- Skip stretch goals
- Timebox to 3 hours max
- Defer group resize/rotate if needed

**Contingency**:
- Release basic multi-select (move + delete only)
- Add resize/rotate in follow-up PR

---

**Risk 6: Scope Creep** 🟢 LOW

**Description**: Temptation to add extra features (align, distribute, etc.)  
**Impact**: Delays critical AI work  
**Probability**: 20%

**Mitigation**:
- Stick to success criteria strictly
- Mark nice-to-haves as future work
- Focus on foundation, not polish

**Contingency**:
- Ruthlessly cut features to meet timeline
- AI integration is most important

---

## Bug Tracking

### High-Level Bug Summary

**Total Bugs Encountered**: TBD (will update during implementation)  
**Critical Bugs**: TBD  
**High Priority Bugs**: TBD  
**Medium Priority Bugs**: TBD  
**Low Priority Bugs**: TBD

**Time Spent Debugging**: TBD  
**Total Implementation Time**: TBD

**Root Cause Categories**:
- Data Flow: TBD
- State Management: TBD
- Event Handling: TBD
- Architecture: TBD
- Configuration: TBD
- Logic: TBD

---

### Detailed Bug Analysis

**To Be Filled During Implementation**

Each bug will be documented with:
- **Discovery**: When/how was it found?
- **Symptoms**: What did the user see?
- **Root Cause**: Technical explanation
- **Failed Attempts**: What didn't work and why
- **Solution**: What finally worked
- **Prevention**: How to avoid in future
- **Files Modified**: Which files were changed
- **Time to Fix**: How long it took
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW

---

### Lessons Learned

**To Be Filled After Implementation**

Key insights will include:
- Patterns discovered
- Framework quirks encountered
- Best practices identified
- Future recommendations

---

## Next Steps After PR #13

### Immediate Follow-Up: PR #14 - Drag-Select Box
- Uses `selectedShapeIds` array we built
- Uses `setSelection()` method we built
- Visual feedback already works
- Just add rectangle drawing and collision detection

### Foundation for AI: PR #18-24
- Selection API already exposed via `useSelection`
- AI can call `selectShapesByType()`, `selectShapesByColor()`, etc.
- All group operations reusable by AI

---

**Status**: ✅ Planning Complete - Ready for Implementation  
**Next Action**: Create branch `feat/multi-select` and begin Phase 1  
**Estimated Completion**: 2-3 hours from start








