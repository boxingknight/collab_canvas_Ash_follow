# PR #19 - Rotate & Delete Multi-Select Bug Fixes

**Status**: 🔧 DEBUGGING  
**Date**: October 15, 2025  
**Priority**: 🔴 CRITICAL  
**Category**: Bug Fix / Multi-Select  
**Impact**: Rotate & Delete Functions  

---

## Problem

After implementing multi-select support for manipulation functions:

✅ **Move** - Works for both single and multi-select  
✅ **Resize** - Works for both single and multi-select  
✅ **Color** - Works for both single and multi-select  
❌ **Rotate** - Does NOT work for multi-select (single works)  
❌ **Delete** - Does NOT work at all (neither single nor multi-select)  

### User Report
> "looks like we successfully got 3/5 correct. rotating does not work as a group. and delete does not work for both alone and a group."

---

## Issues Identified

### Issue 1: Delete Function Naming Conflict

**Problem:**
```javascript
// We import deleteShape from shapes service
import { deleteShape } from './shapes';

// But also define it as a method in canvasAPI
canvasAPI.deleteShape = async function(shapeId) {
  // When we call deleteShape() here, which one is it calling?
  await deleteShape(shapeId);  // ⚠️ AMBIGUOUS!
}
```

**Root Cause:**
JavaScript has a naming conflict. When we call `deleteShape(shapeId)` inside the method, it's calling the imported function directly, not the method itself. This breaks the recursive call pattern needed for multi-select.

**Fix:**
```javascript
// Rename the import to avoid conflict
import { deleteShape as deleteShapeFromDB } from './shapes';

// Now the method name is unique
canvasAPI.deleteShape = async function(shapeId) {
  // Explicitly call the database function
  await deleteShapeFromDB(shapeId);  // ✅ CLEAR!
}
```

---

### Issue 2: Rotate Function - Unknown

**Hypothesis 1: Silent Failure**
The multi-select loop might be failing silently without proper error logging.

**Hypothesis 2: Recursive Call Issue**
The `this.rotateShape()` call inside the loop might not be binding correctly.

**Hypothesis 3: Relative Rotation Logic**
When rotating multiple shapes with `relative=true`, the rotation calculation might be failing for subsequent shapes.

---

## Fixes Applied

### 1. Delete Function - Naming Conflict Resolution

**Changed:**
```javascript
// Before
import { addShape, updateShape, deleteShape, getAllShapes } from './shapes';

// After
import { addShape, updateShape, deleteShape as deleteShapeFromDB, getAllShapes } from './shapes';
```

**Updated all references:**
```javascript
// Before
await deleteShape(shapeId);
await deleteShape(fallbackId);

// After
await deleteShapeFromDB(shapeId);
await deleteShapeFromDB(fallbackId);
```

---

### 2. Debug Logging - Both Functions

Added comprehensive console logging to trace execution:

**Rotate Function:**
```javascript
async rotateShape(shapeId, degrees, relative = false) {
  console.log('[canvasAPI] rotateShape called:', { shapeId, degrees, relative });
  
  if (!shapeId) {
    const selection = getCurrentSelection();
    console.log('[canvasAPI] rotateShape selection:', selection);
    
    if (selection.selectedShapeIds.length > 1) {
      console.log(`[canvasAPI] Rotating ${selection.selectedShapeIds.length} shapes`);
      
      for (const selectedId of selection.selectedShapeIds) {
        console.log(`[canvasAPI] Rotating shape ${selectedId}`);
        const result = await this.rotateShape(selectedId, degrees, relative);
        console.log(`[canvasAPI] Rotate result for ${selectedId}:`, result);
        // ...
      }
      
      console.log('[canvasAPI] Batch rotate complete:', { results, errors });
    }
  }
}
```

**Delete Function:**
```javascript
async deleteShape(shapeId) {
  console.log('[canvasAPI] deleteShape called:', { shapeId });
  
  if (!shapeId) {
    const selection = getCurrentSelection();
    console.log('[canvasAPI] deleteShape selection:', selection);
    
    if (selection.selectedShapeIds.length > 1) {
      console.log(`[canvasAPI] Deleting ${selection.selectedShapeIds.length} shapes`);
      
      for (const selectedId of selection.selectedShapeIds) {
        console.log(`[canvasAPI] Deleting shape ${selectedId}`);
        const result = await this.deleteShape(selectedId);
        console.log(`[canvasAPI] Delete result for ${selectedId}:`, result);
        // ...
      }
      
      console.log('[canvasAPI] Batch delete complete:', { results, errors });
    }
  }
  
  // At the database call level
  console.log(`[canvasAPI] Calling deleteShapeFromDB for ${shapeId}`);
  await deleteShapeFromDB(shapeId);
  console.log(`[canvasAPI] Successfully deleted ${shapeId}`);
}
```

---

## Testing Instructions

### Test Delete Function

**Single Shape:**
1. Create a shape: "create a blue circle"
2. Select it (click on it)
3. Say "delete selected shape"
4. Check console for logs:
   ```
   [canvasAPI] deleteShape called: {shapeId: undefined}
   [canvasAPI] deleteShape selection: {selectedShapeIds: [...], shapes: [...]}
   [canvasAPI] Single selection: <shapeId>
   [canvasAPI] Calling deleteShapeFromDB for <shapeId>
   [canvasAPI] Successfully deleted <shapeId>
   ```
5. Shape should disappear ✅

**Multiple Shapes:**
1. Create shapes: "create 5 circles in a row"
2. Select all (drag-select or shift-click)
3. Say "delete selected shapes"
4. Check console for logs:
   ```
   [canvasAPI] deleteShape called: {shapeId: undefined}
   [canvasAPI] deleteShape selection: {selectedShapeIds: [...5 IDs...], shapes: [...]}
   [canvasAPI] Deleting 5 shapes
   [canvasAPI] Deleting shape <id1>
   [canvasAPI] Calling deleteShapeFromDB for <id1>
   [canvasAPI] Successfully deleted <id1>
   [canvasAPI] Delete result for <id1>: {success: true, ...}
   ... (repeat for all 5)
   [canvasAPI] Batch delete complete: {results: [...], errors: []}
   ```
5. All 5 shapes should disappear ✅

---

### Test Rotate Function

**Single Shape:**
1. Create a shape: "create a rectangle"
2. Select it
3. Say "rotate 45 degrees"
4. Check console for logs:
   ```
   [canvasAPI] rotateShape called: {shapeId: undefined, degrees: 45, relative: true}
   [canvasAPI] rotateShape selection: {selectedShapeIds: [...], shapes: [...]}
   [canvasAPI] Single selection: <shapeId>
   ```
5. Shape should rotate 45° ✅

**Multiple Shapes:**
1. Create shapes: "create 5 rectangles in a row"
2. Select all
3. Say "rotate 45 degrees"
4. Check console for logs:
   ```
   [canvasAPI] rotateShape called: {shapeId: undefined, degrees: 45, relative: true}
   [canvasAPI] rotateShape selection: {selectedShapeIds: [...5 IDs...], shapes: [...]}
   [canvasAPI] Rotating 5 shapes
   [canvasAPI] Rotating shape <id1>
   [canvasAPI] rotateShape called: {shapeId: <id1>, degrees: 45, relative: true}
   [canvasAPI] Rotate result for <id1>: {success: true, ...}
   ... (repeat for all 5)
   [canvasAPI] Batch rotate complete: {results: [...], errors: []}
   ```
5. All 5 shapes should rotate 45° ✅

---

## Expected Console Output

### Delete - Working Correctly

```
[canvasAPI] deleteShape called: { shapeId: undefined }
[canvasAPI] deleteShape selection: { selectedShapeIds: ['abc123', 'def456', 'ghi789'], shapes: [...] }
[canvasAPI] Deleting 3 shapes
[canvasAPI] Deleting shape abc123
[canvasAPI] deleteShape called: { shapeId: 'abc123' }
[canvasAPI] Calling deleteShapeFromDB for abc123
[canvasAPI] Successfully deleted abc123
[canvasAPI] Delete result for abc123: { success: true, result: { shapeId: 'abc123' } }
[canvasAPI] Deleting shape def456
[canvasAPI] deleteShape called: { shapeId: 'def456' }
[canvasAPI] Calling deleteShapeFromDB for def456
[canvasAPI] Successfully deleted def456
[canvasAPI] Delete result for def456: { success: true, result: { shapeId: 'def456' } }
[canvasAPI] Deleting shape ghi789
[canvasAPI] deleteShape called: { shapeId: 'ghi789' }
[canvasAPI] Calling deleteShapeFromDB for ghi789
[canvasAPI] Successfully deleted ghi789
[canvasAPI] Delete result for ghi789: { success: true, result: { shapeId: 'ghi789' } }
[canvasAPI] Batch delete complete: { results: [3 items], errors: [] }
```

### Rotate - Working Correctly

```
[canvasAPI] rotateShape called: { shapeId: undefined, degrees: 45, relative: true }
[canvasAPI] rotateShape selection: { selectedShapeIds: ['abc123', 'def456'], shapes: [...] }
[canvasAPI] Rotating 2 shapes
[canvasAPI] Rotating shape abc123
[canvasAPI] rotateShape called: { shapeId: 'abc123', degrees: 45, relative: true }
[canvasAPI] Rotate result for abc123: { success: true, result: { shapeId: 'abc123', rotation: 45 } }
[canvasAPI] Rotating shape def456
[canvasAPI] rotateShape called: { shapeId: 'def456', degrees: 45, relative: true }
[canvasAPI] Rotate result for def456: { success: true, result: { shapeId: 'def456', rotation: 45 } }
[canvasAPI] Batch rotate complete: { results: [2 items], errors: [] }
```

---

## Potential Issues to Watch For

### Issue A: Recursive Call Not Working

If you see:
```
[canvasAPI] Rotating shape abc123
// No second "rotateShape called" log
```

**Diagnosis:** The `this.rotateShape()` recursive call is failing.

**Solution:** The canvasAPI object might not have proper `this` binding. Need to use `canvasAPI.rotateShape()` instead of `this.rotateShape()`.

---

### Issue B: Silent Failures

If you see:
```
[canvasAPI] Rotating shape abc123
[canvasAPI] Rotate result for abc123: { success: false, error: '...' }
```

**Diagnosis:** The individual rotation is failing for some reason.

**Solution:** Check the error message to see what's failing (validation, database, etc.).

---

### Issue C: Selection Bridge Not Working

If you see:
```
[canvasAPI] deleteShape called: { shapeId: undefined }
[canvasAPI] deleteShape selection: { selectedShapeIds: [], shapes: [] }
```

**Diagnosis:** The selection bridge is not returning the selected shapes.

**Solution:** Need to verify that `Canvas.jsx` is calling `setCurrentSelection()` when shapes are selected.

---

## Files Modified

- **`collabcanvas/src/services/canvasAPI.js`**
  - Fixed `deleteShape` naming conflict (renamed import to `deleteShapeFromDB`)
  - Added comprehensive debug logging to `rotateShape`
  - Added comprehensive debug logging to `deleteShape`

---

## Next Steps

1. **Test both functions** (single and multi-select)
2. **Check console logs** to identify where the failure occurs
3. **Report findings** with specific console output
4. **Apply targeted fix** based on the root cause identified by logs

---

**Status**: 🔧 **DEBUGGING IN PROGRESS**

Please test the delete and rotate functions now, and share the console output so we can identify the exact failure point!

