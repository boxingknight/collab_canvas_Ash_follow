# Multi-Select Manual Drag Fix - Summary

## Problem Statement

When manually dragging multiple selected shapes:
1. **Intermittent behavior**: Sometimes only 1 shape moves from the start, then subsequent drags work for all 3
2. **Mid-drag breakage**: Sometimes all shapes start moving together but some stop mid-drag

---

## Root Causes Identified

### Bug A: Click-Before-Drag Race Condition

**Event Order Issue**:
```
User clicks Shape A (already selected in [A, B, C])
  ↓
Konva fires onClick FIRST
  ↓
handleShapeSelect() executes
  ↓
isDraggingShape is FALSE (drag hasn't started yet!)
  ↓
setSelection([A]) → Clears multi-select to just [A]
  ↓
React schedules re-render (async)
  ↓
Konva fires onDragStart SECOND
  ↓
handleShapeDragStart() executes
  ↓
Checks isMultiSelect → RACE CONDITION
  - If re-render completed: isMultiSelect = false → Single drag
  - If re-render pending: isMultiSelect = true → Multi drag
```

**Why PR19's Guard Didn't Work**:
- PR19 Bug #3 added `if (isDraggingShape) return;` guard
- BUT: This guard only prevents changes DURING drag
- onClick fires BEFORE `isDraggingShape` is set to true
- The guard never activates!

---

### Bug B: Reactive State During Drag Initialization

**Code Location**: `Canvas.jsx` line 785 (before fix)

```javascript
selectedShapeIds.forEach(id => {  // ❌ Uses reactive state!
  const shape = shapes.find(s => s.id === id);
  // ...
});
```

**Why This Broke**:
1. Drag starts with selection [A, B, C]
2. `handleShapeDragStart` begins executing
3. onClick from Bug A clears selection to [A]
4. React re-renders **during** `handleShapeDragStart` execution
5. Line 785 reads the NEW state: `selectedShapeIds = [A]`
6. Only Shape A is added to `initialPositionsRef.current`
7. `handleShapeDragMove` only finds Shape A → other shapes stop moving

**Pattern Violation**:
- PR19 Bug #4 introduced the snapshot pattern
- BUT missed this reactive state usage at line 785

---

## Solution Implemented

### Fix 1: Prevent onClick from Clearing Multi-Select

**Location**: `Canvas.jsx` lines 480-486

**Change**:
```javascript
} else {
  // FIX: If clicking an already-selected shape in a multi-select,
  // DON'T clear the selection (user might be about to drag)
  // This prevents the onClick-before-onDragStart race condition
  if (isMultiSelect && isSelected(shapeId)) {
    console.log('[MULTI-SELECT FIX] Preserving multi-select on click of selected shape:', shapeId);
    return; // Preserve multi-select
  }
  // Normal click: Replace selection with this shape
  setSelection([shapeId]);
}
```

**Effect**:
- Clicking an already-selected shape no longer clears the multi-selection
- Matches Figma's behavior
- Eliminates the race condition at the source

---

### Fix 2: Snapshot Pattern for Selection State

**Location**: `Canvas.jsx` lines 763-802

**Change**:
```javascript
function handleShapeDragStart(shapeId) {
  setIsDraggingShape(true);
  
  // FIX: SNAPSHOT PATTERN - Capture selection state IMMEDIATELY
  const selectionSnapshot = [...selectedShapeIds];
  const isMultiSelectSnapshot = selectionSnapshot.length > 1;
  const isShapeSelectedSnapshot = selectionSnapshot.includes(shapeId);
  
  console.log('[DRAG START] Snapshot captured:', {
    shapeId,
    selectionSnapshot,
    isMultiSelectSnapshot,
    isShapeSelectedSnapshot
  });
  
  // USE SNAPSHOT throughout, never reactive state
  if (isMultiSelectSnapshot && isShapeSelectedSnapshot) {
    // ...
    Promise.all(selectionSnapshot.map(id => lockShape(id)))  // ✅ Snapshot
    // ...
    selectionSnapshot.forEach(id => {  // ✅ Snapshot
      // ...
    });
  }
}
```

**Effect**:
- Selection state is captured immediately at drag start
- Immune to React re-renders during execution
- Completes the snapshot pattern from PR19 Bug #4

---

## Behavior Changes

### Before Fix
- Clicking an already-selected shape → clears multi-select → single selection
- Race condition: sometimes multi-drag works, sometimes doesn't
- Mid-drag breakage when React re-renders

### After Fix
- Clicking an already-selected shape → **preserves multi-select** (Figma behavior)
- Multi-drag works consistently (no race condition)
- No mid-drag breakage (snapshot is immune to re-renders)

---

## Technical Details

### Why This Matches Figma

Figma's pattern for multi-select drag:
1. ✅ Click on selected shape doesn't deselect others
2. ✅ Selection is "locked" during drag intent
3. ✅ Uses snapshot of selection state (not reactive)
4. ✅ Consistent behavior (no race conditions)

### Why Snapshot Pattern Works

```javascript
// ❌ BAD: Reads from reactive state during multi-frame operation
selectedShapeIds.forEach(id => { ... })

// ✅ GOOD: Snapshot at start, use throughout
const snapshot = [...selectedShapeIds];
snapshot.forEach(id => { ... })
```

React can re-render at any time:
- During drag initialization
- Between drag move events  
- During drag end cleanup

Snapshots ensure consistency across the entire operation.

---

## Files Modified

### Canvas.jsx
1. **Lines 480-486**: Added multi-select preservation check in `handleShapeSelect`
2. **Lines 763-802**: Added snapshot pattern to `handleShapeDragStart`

**Total Changes**: 2 functions, ~30 lines modified/added

---

## Testing

See `MANUAL_DRAG_FIX_TESTING.md` for comprehensive test cases.

**Key Tests**:
1. Click-to-drag already-selected shape (Bug A fix)
2. Sustained multi-drag (Bug B fix)
3. Normal single selection still works
4. Mixed shape types
5. Edge cases (rapid click-drag, marquee select, etc.)

---

## Console Logging

**Debug logs added**:
1. `[MULTI-SELECT FIX] Preserving multi-select on click` → Confirms Fix 1 is working
2. `[DRAG START] Snapshot captured` → Confirms Fix 2 is working, shows snapshot contents

**These can be removed** after testing confirms the fix, or kept for diagnostics.

---

## Performance Impact

**Minimal**:
- Fix 1: Single `if` check (O(1))
- Fix 2: Array spread operator for snapshot (O(n) where n = selection count)
- For typical selections (< 100 shapes), overhead is negligible

**Benefits**:
- Eliminates unnecessary re-renders from selection changes
- Prevents mid-drag state corruption
- More predictable React scheduling

---

## Relationship to Previous Fixes

### PR13: Multi-Select
- Fixed shift-click, drag latency, coordinate systems
- This fix: Completes the drag reliability

### PR19 Bug #3: Drag Interruption
- Added `isDraggingShape` guard to prevent selection changes **during** drag
- This fix: Prevents selection changes **before** drag (during onClick)

### PR19 Bug #4: Reactive State
- Introduced snapshot pattern for `activeDragRef` and `initialPositionsRef`
- This fix: Completes the pattern by snapshotting the **source** selection state

---

## Known Limitations

### Behavior Change: Click Doesn't Deselect

**Old Behavior**:
- Click selected shape → deselect others → single selection

**New Behavior**:
- Click selected shape → preserve multi-select
- To deselect: Click canvas background, then click shape

**Rationale**:
- Matches Figma/Miro behavior
- Prevents accidental deselection before drag
- More intuitive for users (selection is "sticky")

**If users complain**, we can add:
- Double-click to isolate selection
- Modifier key (Cmd/Ctrl) to force deselect
- Settings toggle for old behavior

---

## Future Improvements

1. **Remove debug logging** after testing confirms fix
2. **Add unit tests** for edge cases
3. **Performance monitoring** for large selections (100+ shapes)
4. **Gesture detection** to distinguish click vs drag intent earlier
5. **Selection history** for undo/redo

---

## Summary

**Problem**: Race condition between onClick and onDragStart + reactive state during drag init  
**Solution**: Preserve multi-select on click + snapshot pattern for selection state  
**Result**: Consistent, reliable multi-select drag matching Figma's behavior  
**Risk**: Low (minimal code changes, defensive programming)  
**Testing**: Comprehensive test suite in `MANUAL_DRAG_FIX_TESTING.md`  

✅ **Ready for testing!**

