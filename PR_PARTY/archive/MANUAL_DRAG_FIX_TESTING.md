# Multi-Select Manual Drag Fix - Testing Guide

## What Was Fixed

### Bug A: Click-Before-Drag Race Condition
**Issue**: Clicking an already-selected shape would clear the multi-selection before drag started
**Fix**: Added check in `handleShapeSelect` to preserve multi-select when clicking an already-selected shape
**Location**: `Canvas.jsx` lines 483-486

### Bug B: Reactive State During Drag Initialization  
**Issue**: Using `selectedShapeIds` (reactive state) instead of snapshot during drag start caused shapes to stop moving mid-drag
**Fix**: Created selection snapshot at start of `handleShapeDragStart` and used it throughout
**Location**: `Canvas.jsx` lines 766-802

---

## Testing Instructions

### Test 1: Click-to-Drag Already-Selected Shape (Bug A Fix)

**Setup**:
1. Open the app
2. Create 3 rectangles (A, B, C)
3. Shift-click to select all 3 shapes

**Test Steps**:
1. Click on shape A (without moving mouse yet)
2. **Check console**: Should see `[MULTI-SELECT FIX] Preserving multi-select on click of selected shape: <id>`
3. Now drag shape A
4. **Expected**: All 3 shapes move together
5. **Previously**: Sometimes only shape A would move

**Repeat 5 times** to verify consistent behavior (no more race condition)

---

### Test 2: Sustained Multi-Drag (Bug B Fix)

**Setup**:
1. Create 3 circles (A, B, C)
2. Shift-click to select all 3

**Test Steps**:
1. Click and hold on shape B
2. Drag for 3-5 seconds in a complex pattern (circles, zigzags)
3. **Check console**: Should see `[DRAG START] Snapshot captured:` with correct selection
4. **Expected**: All 3 shapes stay together entire time
5. **Previously**: Some shapes would stop following mid-drag

**Repeat 5 times** across different shapes

---

### Test 3: Normal Single Selection Still Works

**Setup**:
1. Have shapes A, B, C selected (multi-select)

**Test Steps**:
1. Click on shape D (not currently selected)
2. **Expected**: Only D is selected, A/B/C are deselected
3. **Check**: This should still work normally

---

### Test 4: Shift-Click Multi-Select Still Works

**Test Steps**:
1. Click shape A (select)
2. Shift-click shape B (add to selection)
3. Shift-click shape C (add to selection)
4. **Expected**: All 3 selected
5. Drag any of them
6. **Expected**: All move together

---

### Test 5: Mixed Shape Types

**Setup**:
1. Create 1 rectangle, 1 circle, 1 line, 1 text
2. Shift-click to select all 4

**Test Steps**:
1. Click on the rectangle
2. Drag it around
3. **Expected**: All 4 shapes (different types) move together
4. **Check console**: Snapshot should include all 4 IDs

---

### Test 6: Click Already-Selected Shape to Deselect Others

**Setup**:
1. Select shapes A, B, C (multi-select)

**Test Steps**:
1. Click shape A (already selected)
2. **Expected**: Multi-select is preserved (A, B, C still selected)
3. Now click on the canvas background
4. Click shape A again
5. **Expected**: Only A is selected

**Note**: This is a **behavior change** from before! This now matches Figma's behavior where clicking a selected shape doesn't deselect others (prevents accidental deselection before drag).

---

## Console Verification

### Expected Console Output During Multi-Select Drag

```
[MULTI-SELECT FIX] Preserving multi-select on click of selected shape: shape-123
[DRAG START] Snapshot captured: {
  shapeId: "shape-123",
  selectionSnapshot: ["shape-123", "shape-456", "shape-789"],
  isMultiSelectSnapshot: true,
  isShapeSelectedSnapshot: true
}
[MULTI-SELECT] Registered nodes: ["shape-123", "shape-456", "shape-789"]
[CANVAS] Group drag end. Offset: 150, 75
[CANVAS] Updating shape in group: shape-123 {...}
[CANVAS] Updating shape in group: shape-456 {...}
[CANVAS] Updating shape in group: shape-789 {...}
```

### What to Look For

✅ **Good Signs**:
- "Preserving multi-select" message appears on click
- Snapshot includes all selected shapes
- All shapes are in "Registered nodes"
- All shapes are updated at drag end

❌ **Bad Signs**:
- No "Preserving multi-select" message (Fix 1 not working)
- Snapshot has fewer shapes than expected (Fix 2 not working)
- "Missing node refs" warnings
- Only 1 shape updated at drag end

---

## Edge Cases to Test

### Edge Case 1: Rapid Click-Drag
1. Select 3 shapes
2. Very quickly click and drag (minimize time between click and drag)
3. **Expected**: Should work reliably now (no race condition)

### Edge Case 2: Click Different Selected Shape Mid-Drag
1. Select shapes A, B, C
2. Start dragging shape A
3. While dragging, try to click shape B
4. **Expected**: Click is ignored during drag (guard still works)

### Edge Case 3: Marquee Select Then Drag
1. Drag-select (marquee) 3 shapes
2. Click one of them to drag
3. **Expected**: All move together

### Edge Case 4: Select All Then Drag
1. Press Cmd/Ctrl+A to select all shapes
2. Click any shape to drag
3. **Expected**: All shapes move together

---

## Performance Check

While dragging multiple shapes:
- Canvas should maintain **60 FPS** (smooth visual movement)
- No stuttering or lag
- No memory leaks (check Chrome DevTools Performance tab)

**How to Check FPS**:
1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Perform multi-drag
5. Stop recording
6. Check FPS graph (should stay near 60)

---

## If Issues Persist

### Debugging Steps

1. **Check Console for Errors**:
   - Open browser console (F12)
   - Look for React errors or warnings

2. **Verify Snapshot Contents**:
   - Check `[DRAG START] Snapshot captured:` output
   - Confirm `selectionSnapshot` array matches expected selection

3. **Check Node Registration**:
   - Look for `[MULTI-SELECT] Missing node refs` warnings
   - If present, some shapes aren't registering their Konva nodes

4. **Verify Selection State**:
   - Add temporary logging: `console.log('Selection:', selectedShapeIds)`
   - Check if selection is being cleared unexpectedly

### Report Template

If you find an issue, please provide:
- Test case that reproduces the issue
- Console output (entire log from click to drag end)
- Video/GIF of the behavior
- Number of shapes involved
- Shape types (rectangle, circle, line, text)

---

## Success Criteria

✅ All test cases pass consistently (no intermittent failures)  
✅ Console shows correct snapshot and multi-select preservation  
✅ No "Missing node refs" warnings  
✅ Performance stays at 60 FPS  
✅ Behavior matches Figma (clicking selected shape preserves multi-select)  

---

## Next Steps After Testing

If all tests pass:
1. Test AI multi-select commands (from previous fix)
2. Test combination of manual + AI manipulation
3. Update PR documentation
4. Consider removing debug console.log statements (or keep for diagnostics)

