# Multi-Select Drag Diagnostic Guide

## Quick Diagnostic (5 minutes)

### Test 1: Is Selection Clearing?

**Steps:**
1. Select 3 shapes (shift-click each)
2. Verify all 3 have dashed blue borders
3. Click one of the selected shapes (don't drag yet)
4. Check: Are all 3 still selected or did it clear to just 1?

**Result:**
- ✅ If all 3 stay selected → Selection guard is working
- ❌ If cleared to 1 → **BUG: Solution 1 needed** (handleShapeSelect clearing)

---

### Test 2: Do They Start Moving Together?

**Steps:**
1. Select 3 shapes
2. Start dragging one of them
3. Watch the FIRST moment of drag (first 100ms)

**Result:**
- ✅ If all 3 start moving immediately → Selection is preserved
- ❌ If only 1 moves from start → **BUG: Selection cleared before drag**
- ⚠️ If all 3 start moving but some stop mid-drag → **BUG: Reactive state issue**

---

### Test 3: Console Check

**Add temporary logging:**

In Canvas.jsx, add these console.logs:

```javascript
function handleShapeSelect(shapeId, event) {
  console.log('[SELECT] Clicked shape:', shapeId);
  console.log('[SELECT] Currently selected:', selectedShapeIds);
  console.log('[SELECT] Is selected?:', isSelected(shapeId));
  console.log('[SELECT] Shift key?:', event?.evt?.shiftKey);
  
  // ... rest of function
}

function handleShapeDragStart(shapeId) {
  console.log('[DRAG START] Shape:', shapeId);
  console.log('[DRAG START] Selected shapes:', selectedShapeIds);
  console.log('[DRAG START] Is multi-select?:', isMultiSelect);
  
  // ... rest of function
}

function handleShapeDragMove(data) {
  console.log('[DRAG MOVE] activeDragRef:', activeDragRef.current);
  console.log('[DRAG MOVE] isMultiSelect (reactive):', isMultiSelect);
  
  // ... rest of function
}
```

**Then:**
1. Select 3 shapes
2. Click and drag one
3. Read the console output

**Look for:**
- ❌ `[SELECT]` fires with selected count changing from 3 → 1
- ❌ `[DRAG START]` shows only 1 shape selected
- ❌ `[DRAG MOVE]` shows `isMultiSelect: false` when it should be true
- ❌ `activeDragRef` is NOT `'multi-select'`

---

## Root Cause Identification

| Symptom | Root Cause | Solution # |
|---------|-----------|------------|
| Selection clears on click | handleShapeSelect clearing multi-select | Solution 1 |
| Only 1 shape moves from start | Selection cleared before drag | Solution 1 |
| All start, some stop mid-drag | Reactive state during drag | Solution 2 |
| Shapes snap to wrong positions | Coordinate system bug | Check PR19 fix |
| Console shows state changing | React re-renders breaking drag | Solution 2 |

---

## Expected Console Output (Working)

```
[SELECT] Clicked shape: shape-1
[SELECT] Currently selected: ["shape-1", "shape-2", "shape-3"]
[SELECT] Is selected?: true
[SELECT] Shift key?: false
// Selection preserved because shape already selected

[DRAG START] Shape: shape-1
[DRAG START] Selected shapes: ["shape-1", "shape-2", "shape-3"]
[DRAG START] Is multi-select?: true

[DRAG MOVE] activeDragRef: "multi-select"
[DRAG MOVE] isMultiSelect (reactive): true
// (Note: Should NOT be reading isMultiSelect in drag move!)
```

---

## Actual Buggy Output (Example)

```
[SELECT] Clicked shape: shape-1
[SELECT] Currently selected: ["shape-1", "shape-2", "shape-3"]
[SELECT] Is selected?: true
[SELECT] Shift key?: false
// ❌ BUG: Selection about to be cleared because no guard

[SELECT] After logic: ["shape-1"]  // ← SELECTION CLEARED!

[DRAG START] Shape: shape-1
[DRAG START] Selected shapes: ["shape-1"]  // ← Only 1 shape now!
[DRAG START] Is multi-select?: false  // ← Not multi-select anymore!

[DRAG MOVE] activeDragRef: "shape-1"  // ← Single drag, not multi
// Only shape-1 moves
```

---

## Quick Fix Verification

After applying Solution 1:

```javascript
// In handleShapeSelect, add this:
} else {
  if (!isSelected(shapeId)) {  // ← NEW CHECK
    setSelection([shapeId]);
  }
  // If already selected, do nothing (preserve multi-select)
}
```

**Test again and console should show:**
```
[SELECT] Clicked shape: shape-1
[SELECT] Is selected?: true
// ✅ Selection preserved (no clearing)

[DRAG START] Selected shapes: ["shape-1", "shape-2", "shape-3"]
// ✅ All 3 shapes still selected!
```

---

## Advanced Diagnostic: Reactive State Check

Add this to `handleShapeDragMove`:

```javascript
function handleShapeDragMove(data) {
  console.warn('⚠️ Reading reactive state during drag!');
  console.warn('  isMultiSelect:', isMultiSelect);
  console.warn('  selectedShapeIds.length:', selectedShapeIds.length);
  console.warn('  activeDragRef:', activeDragRef.current);
  
  // If isMultiSelect changes during drag → BUG!
  // Should use activeDragRef only
}
```

**Watch for**:
- Values changing mid-drag
- `isMultiSelect` flipping from true to false
- `selectedShapeIds` array length changing

If these change → **Solution 2 needed** (use refs/snapshots only)

---

**Run these diagnostics and report what you see!**

