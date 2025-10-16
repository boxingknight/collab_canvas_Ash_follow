# Multi-Select Drag Root Cause Analysis

## Symptoms
1. **Intermittent Behavior**: Sometimes only 1 shape moves from drag start, then subsequent moves affect all 3
2. **Mid-Drag Breakage**: Sometimes all shapes start moving together but some stop mid-drag

## Root Causes

### Bug A: Click-Before-Drag Race Condition

**Location**: `Canvas.jsx` lines 466-482 (handleShapeSelect) and 757 (handleShapeDragStart)

**The Problem**:
When a user clicks on an already-selected shape to drag it, Konva fires events in this order:

1. **onClick** fires → `handleClick` in Shape.jsx (line 163)
2. **onDragStart** fires → `handleDragStart` in Shape.jsx (line 182)

**Event Flow**:
```
User clicks Shape A (already selected in multi-select of A, B, C)
  ↓
Shape.jsx onClick (line 163)
  ↓
handleClick → onSelect(e)
  ↓
Canvas.handleShapeSelect(shape.id, e) (line 466)
  ↓
Check: if (isDraggingShape) → FALSE (drag hasn't started yet!)
  ↓
Check: isShiftPressed → FALSE (normal click)
  ↓
setSelection([shapeId]) → CLEARS MULTI-SELECT TO JUST [A]!
  ↓
React schedules re-render (async)
  ↓
User continues mouse movement
  ↓
Shape.jsx onDragStart (line 182)
  ↓
Canvas.handleShapeDragStart(shape.id) (line 753)
  ↓
Check: if (isMultiSelect && isSelected(shapeId)) (line 757)
  ↓
RACE CONDITION:
  - If React re-render completed: isMultiSelect = false → SINGLE DRAG
  - If React re-render pending: isMultiSelect = true → MULTI DRAG
```

**Why the Guard Doesn't Work**:
- PR19 Bug #3 added `if (isDraggingShape)` guard at line 469
- BUT: This guard only prevents selection changes DURING drag
- The onClick event fires BEFORE drag starts, so `isDraggingShape` is still `false`
- The guard never activates!

**This Explains Symptom #1**: The "sometimes" behavior is due to React re-render timing variance. Depends on:
- System load
- React scheduler state
- Number of components re-rendering
- Whether React batched other updates

---

### Bug B: Using Reactive State During Drag Initialization

**Location**: `Canvas.jsx` line 778

**The Problem**:
```javascript
// Line 778 - Uses reactive state, not snapshot!
selectedShapeIds.forEach(id => {
  const shape = shapes.find(s => s.id === id);
  // ...
});
```

**Why This Breaks**:
1. `selectedShapeIds` is a reactive state variable
2. If React re-renders during `handleShapeDragStart` execution, `selectedShapeIds` can change
3. The snapshot pattern (using refs) is only applied AFTER this forEach completes
4. Result: `initialPositionsRef.current` is built from the WRONG selection state

**Pattern Violation**:
PR19 Bug #4 introduced the "snapshot at drag start" pattern to avoid reactive state:
- ✅ `activeDragRef.current` (line 758) - uses ref
- ✅ `initialPositionsRef.current` (line 777) - uses ref
- ❌ `selectedShapeIds.forEach` (line 778) - uses reactive state!

**This Explains Symptom #2**: Shapes stop moving mid-drag because:
1. Drag starts with selection [A, B, C]
2. `handleShapeDragStart` begins executing
3. The onClick event from Bug A clears selection to [A]
4. React re-renders
5. Line 778 executes with NEW state: `selectedShapeIds = [A]`
6. Only Shape A is added to `initialPositionsRef.current`
7. `handleShapeDragMove` (line 859) iterates over `initialPositionsRef.current`
8. Only Shape A is found → only Shape A moves

---

## Code Evidence

### Canvas.jsx Event Handlers

**handleShapeSelect (lines 466-489)**:
```javascript
function handleShapeSelect(shapeId, event) {
  // Don't allow selection changes during drag
  // (Matches Figma behavior: selection is locked during drag)
  if (isDraggingShape) {  // ← This is FALSE when onClick fires!
    return;
  }
  
  // In Konva, the native DOM event is in event.evt
  const isShiftPressed = event?.evt?.shiftKey;
  
  if (isShiftPressed) {
    // Shift-click: Toggle shape in selection
    toggleSelection(shapeId);
  } else {
    // Normal click: Replace selection with this shape
    setSelection([shapeId]);  // ← CLEARS MULTI-SELECT!
  }
  
  // Auto-switch to move mode when clicking a shape (for convenience)
  if (mode !== 'move') {
    setMode('move');
  }
}
```

**handleShapeDragStart (lines 753-838)**:
```javascript
function handleShapeDragStart(shapeId) {
  setIsDraggingShape(true);  // ← Set AFTER onClick already cleared selection!
  
  // If this shape is part of a multi-select, lock all selected shapes
  if (isMultiSelect && isSelected(shapeId)) {  // ← Race condition!
    activeDragRef.current = 'multi-select'; // ✅ Ref (good)
    
    // ...
    
    // Store initial positions from shape data (source of truth)
    initialPositionsRef.current = {};  // ✅ Ref (good)
    selectedShapeIds.forEach(id => {  // ❌ Reactive state (bad!)
      const shape = shapes.find(s => s.id === id);
      const node = shapeNodesRef.current[id];
      
      if (shape) {
        initialPositionsRef.current[id] = {
          x: shape.x,
          y: shape.y,
          // ...
        };
        // ...
      }
    });
    // ...
  }
}
```

### Shape.jsx Event Ordering

**Lines 163-197**:
```javascript
function handleClick(e) {
  // ...
  onSelect(e);  // ← Fires FIRST
}

function handleDragStart(e) {
  // ...
  if (onDragStart) onDragStart();  // ← Fires SECOND
}
```

---

## Why This Wasn't Caught in PR19

PR19 Bug #4 introduced the snapshot pattern to fix reactive state issues during drag:
- Fixed `handleShapeDragMove` to use `activeDragRef.current` instead of `isMultiSelect`
- Fixed `handleShapeDragEnd` to use `initialPositionsRef.current` instead of `selectedShapeIds`
- **BUT**: Missed the reactive state usage in `handleShapeDragStart` at line 778

PR19 Bug #3 added the `isDraggingShape` guard to prevent selection changes during drag:
- **BUT**: The guard only works AFTER drag starts
- The onClick event fires BEFORE drag starts, so the guard never activates

---

## How Figma Handles This

Based on PR13 and PR14 analysis, Figma uses:

1. **Intent Detection**: Distinguish between "click to select" vs "click to drag"
   - Uses `dragDistance` threshold (we have this: 3px at Shape.jsx line 633)
   - Only commits selection changes AFTER drag intent is determined

2. **Event Ordering Guards**:
   - Prevents onClick from changing selection if mouse is moving
   - Uses event timing to detect drag intent within the onClick handler

3. **Snapshot Pattern**:
   - Captures ALL state at the moment of click (not drag start)
   - Uses only snapshots throughout the entire interaction

4. **Single Source of Truth**:
   - Selection state is captured in a ref at click time
   - Never consults reactive state after interaction begins

---

## Solution Options

### Option 1: Prevent onClick Selection Clear (Minimal Fix)
**What**: Add check in `handleShapeSelect` to NOT clear selection if clicking an already-selected shape
**Pros**: 
- Small change
- Preserves multi-select during drag initiation
- Matches Figma behavior
**Cons**: 
- Doesn't fix reactive state usage at line 778
- Partial solution

**Code**:
```javascript
function handleShapeSelect(shapeId, event) {
  if (isDraggingShape) return;
  
  const isShiftPressed = event?.evt?.shiftKey;
  
  if (isShiftPressed) {
    toggleSelection(shapeId);
  } else {
    // If clicking an already-selected shape in a multi-select,
    // DON'T clear the selection (user might be about to drag)
    if (isMultiSelect && isSelected(shapeId)) {
      return; // Preserve multi-select
    }
    setSelection([shapeId]);
  }
  
  if (mode !== 'move') {
    setMode('move');
  }
}
```

---

### Option 2: Capture Selection Snapshot on Click (Figma Pattern)
**What**: Create selection snapshot on onClick, use it throughout drag
**Pros**: 
- Eliminates race condition completely
- Follows Figma's pattern
- Fixes reactive state issue
**Cons**: 
- Requires ref management for selection state
- More complex

**Code**:
```javascript
// Add new ref
const clickSelectionSnapshotRef = useRef(null);

function handleShapeSelect(shapeId, event) {
  if (isDraggingShape) return;
  
  const isShiftPressed = event?.evt?.shiftKey;
  
  // Take snapshot of current selection BEFORE any changes
  clickSelectionSnapshotRef.current = [...selectedShapeIds];
  
  if (isShiftPressed) {
    toggleSelection(shapeId);
  } else {
    if (isMultiSelect && isSelected(shapeId)) {
      // Preserve selection but still have snapshot
      return;
    }
    setSelection([shapeId]);
  }
  
  if (mode !== 'move') {
    setMode('move');
  }
}

function handleShapeDragStart(shapeId) {
  setIsDraggingShape(true);
  
  // Use the snapshot from onClick, not current reactive state
  const selectionAtClick = clickSelectionSnapshotRef.current || [];
  const isMultiSelectAtClick = selectionAtClick.length > 1;
  const isShapeSelectedAtClick = selectionAtClick.includes(shapeId);
  
  if (isMultiSelectAtClick && isShapeSelectedAtClick) {
    activeDragRef.current = 'multi-select';
    
    // CRITICAL: Use snapshot, not reactive state
    initialPositionsRef.current = {};
    selectionAtClick.forEach(id => {  // ✅ Uses snapshot!
      const shape = shapes.find(s => s.id === id);
      // ...
    });
  }
  
  // Clear snapshot after use
  clickSelectionSnapshotRef.current = null;
}
```

---

### Option 3: Defer Selection Changes Until Drag Intent Clear (Best)
**What**: Don't commit selection changes until we know if user is clicking or dragging
**Pros**: 
- Most Figma-like behavior
- Eliminates all timing issues
- Clean separation of concerns
**Cons**: 
- Most complex to implement
- Requires tracking "pending" selection state

**Pattern**:
1. onClick: Store "pending" selection change
2. Wait for either:
   - Mouse up without drag → commit pending selection
   - Drag starts → cancel pending selection, use original
3. Use only refs during drag

**Code**: (Pseudocode - more complex)
```javascript
const pendingSelectionRef = useRef(null);

function handleShapeSelect(shapeId, event) {
  if (isDraggingShape) return;
  
  // Store pending change, don't commit yet
  pendingSelectionRef.current = {
    shapeId,
    isShift: event?.evt?.shiftKey,
    timestamp: Date.now()
  };
}

function handleShapeDragStart(shapeId) {
  // Cancel pending selection change
  pendingSelectionRef.current = null;
  
  // Use current selection (before pending change)
  // ... rest of drag logic using snapshots
}

function handleStageMouseUp() {
  // Commit pending selection if no drag happened
  if (pendingSelectionRef.current && !isDraggingShape) {
    // ... commit the pending selection change
  }
  pendingSelectionRef.current = null;
}
```

---

### Option 4: Fix Reactive State Usage (Line 778)
**What**: Replace `selectedShapeIds.forEach` with snapshot-based iteration
**Pros**: 
- Fixes Symptom #2 directly
- Aligns with PR19's snapshot pattern
- Can be combined with Option 1
**Cons**: 
- Doesn't fix Bug A (race condition)
- Still depends on `isMultiSelect` check

**Code**:
```javascript
function handleShapeDragStart(shapeId) {
  setIsDraggingShape(true);
  
  // SNAPSHOT: Capture selection state BEFORE any checks
  const selectionSnapshot = [...selectedShapeIds];
  const isMultiSelectSnapshot = selectionSnapshot.length > 1;
  const isSelectedSnapshot = selectionSnapshot.includes(shapeId);
  
  if (isMultiSelectSnapshot && isSelectedSnapshot) {
    activeDragRef.current = 'multi-select';
    
    initialPositionsRef.current = {};
    selectionSnapshot.forEach(id => {  // ✅ Uses snapshot!
      const shape = shapes.find(s => s.id === id);
      // ...
    });
  }
}
```

---

## Recommended Solution

**Combination: Option 1 + Option 4**

1. **Prevent onClick from clearing multi-select** (Option 1)
   - Simple, immediate fix
   - Matches Figma behavior
   - Low risk

2. **Fix reactive state usage** (Option 4)
   - Completes the snapshot pattern from PR19
   - Defensive programming
   - Prevents mid-drag state corruption

**Why not Option 2 or 3?**
- More complex
- Higher risk of introducing new bugs
- Option 1+4 combination is sufficient for the issue

**Implementation Order**:
1. Apply Option 4 first (fix reactive state)
2. Test manually
3. Apply Option 1 (prevent onClick clear)
4. Test manually
5. Add console logging to verify behavior

---

## Testing Plan

**Test Case 1**: Click-to-drag already-selected shape in multi-select
1. Select shapes A, B, C (shift-click)
2. Click shape A (don't move yet)
3. Drag shape A
4. **Expected**: All 3 shapes move together
5. **Current**: Sometimes only A moves

**Test Case 2**: Sustained multi-drag
1. Select shapes A, B, C
2. Click and drag shape B
3. Continue dragging for 3+ seconds
4. **Expected**: All 3 shapes stay together entire time
5. **Current**: Sometimes shapes stop following mid-drag

**Test Case 3**: Normal single selection still works
1. Have shapes A, B, C selected
2. Click shape D (not selected)
3. **Expected**: Only D is selected
4. Should still work after fix

**Console Verification**:
Add logging to track:
- Selection state at onClick time
- Selection state at onDragStart time
- Contents of `initialPositionsRef.current` after setup
- Which shapes are being updated in `handleShapeDragMove`

