# Multi-Select AI Movement - Testing Guide

**Date**: October 16, 2025  
**Branch**: `feat/pr21-ai-selection-v2`  
**Bug Fixed**: AI not moving multiple selected shapes  

---

## What Was Fixed

### The Problem
When you selected multiple shapes and asked the AI to move them, only ONE shape moved (the first selected shape).

### The Root Cause
The AI was **always providing a shapeId** parameter because:
1. Function schema descriptions said "the currently selected shape" (singular)
2. System prompt examples all showed `moveShape(shapeId, ...)` 
3. No examples showed omitting the shapeId for multi-select
4. The AI learned it MUST provide a shapeId from the examples

### The Solution
Updated 3 things:
1. ✅ **Function schemas** (5 manipulation functions) - Now explicitly mention multi-select
2. ✅ **System prompt** - Added new section #11: MULTI-SELECT OPERATIONS with clear examples
3. ✅ **Examples** - Show omitting shapeId parameter for multi-select operations

---

## Files Modified

1. `/collabcanvas/src/services/aiFunctions.js`
   - Updated descriptions for: `moveShape`, `resizeShape`, `rotateShape`, `changeShapeColor`, `deleteShape`
   - All now say: "If shapeId is OMITTED, affects ALL currently selected shapes"

2. `/collabcanvas/src/services/ai.js`
   - Added guideline #11: MULTI-SELECT OPERATIONS
   - Updated movement examples to distinguish single vs multi-select
   - Added 5 clear multi-select examples

---

## Testing Checklist

### Setup
1. ✅ Start dev server: `npm run dev`
2. ✅ Open http://localhost:5174
3. ✅ Log in to your account
4. ✅ Open AI chat panel (bottom-right corner)

---

## Test Suite

### Test 1: Multi-Select Move ⭐ PRIMARY TEST

**Steps:**
1. Create 5 shapes using AI: "create 5 random circles"
2. Manually select 3 of them (shift-click each one)
3. Tell AI: "move these up 100 pixels"

**Expected Result:**
- ✅ ALL 3 selected shapes move up 100 pixels
- ✅ AI confirms: "Moved 3 shape(s)"
- ✅ Shapes stay selected after move
- ✅ Console shows: `[AI] Parameters: { x: null, y: -100, relative: true }` (NO shapeId!)

**If this fails:**
- Check console for: `[AI] Parameters: { shapeId: "..." }`
- If you see a shapeId, the AI is still passing one (bug not fixed)

---

### Test 2: Multi-Select Move (Various Directions)

**Steps:**
1. Select 3-5 shapes
2. Test each direction:
   - "move them down 50"
   - "move them left 200"
   - "move them right 100"
   - "move them up 75"

**Expected Result:**
- ✅ All selected shapes move in the correct direction
- ✅ Each command affects ALL selected shapes

---

### Test 3: Multi-Select Resize

**Steps:**
1. Create 4 rectangles: "create 4 rectangles"
2. Select all 4 (Cmd/Ctrl+A or shift-click each)
3. Tell AI: "resize these to 150x150"

**Expected Result:**
- ✅ All 4 rectangles resize to 150x150
- ✅ AI confirms: "Resized 4 shape(s)"

---

### Test 4: Multi-Select Rotate

**Steps:**
1. Select 3+ shapes
2. Tell AI: "rotate them by 45 degrees"

**Expected Result:**
- ✅ All selected shapes rotate 45°
- ✅ Each shape rotates around its own center (not as a group)

---

### Test 5: Multi-Select Color Change

**Steps:**
1. Select 5+ shapes of different colors
2. Tell AI: "make them all red"

**Expected Result:**
- ✅ All 5+ shapes turn red (#FF0000 or similar)
- ✅ AI confirms: "Changed color of 5 shape(s)"

---

### Test 6: Multi-Select Delete

**Steps:**
1. Create 10 shapes: "create 10 random shapes"
2. Select 3 of them
3. Tell AI: "delete these shapes"

**Expected Result:**
- ✅ Only the 3 selected shapes are deleted
- ✅ The other 7 remain
- ✅ AI confirms: "Deleted 3 shape(s)"

---

### Test 7: Single Shape Commands (Should Still Work)

**Steps:**
1. Create 5 shapes
2. Select only 1 shape
3. Tell AI: "move this up 50"

**Expected Result:**
- ✅ Only the selected shape moves
- ✅ AI should still omit shapeId (selection has 1 shape)
- ✅ Or AI can provide shapeId (both work)

---

### Test 8: Natural Language Variations

Test these phrases (select 3+ shapes first):

**Move Commands:**
- "move these shapes up 100"
- "move them down 50"
- "shift these to the right"
- "push them left"

**Color Commands:**
- "make these red"
- "change their color to blue"
- "paint them green"

**Rotate Commands:**
- "rotate these by 90 degrees"
- "spin them 45 degrees"

**Resize Commands:**
- "make these bigger"
- "resize them to 200x200"

**Delete Commands:**
- "delete these"
- "remove them"
- "get rid of these shapes"

**Expected Result:**
- ✅ All commands should affect ALL selected shapes
- ✅ AI understands "these", "them", "their" = multi-select

---

### Test 9: Mixed Operations

**Steps:**
1. Create 10 shapes: "create 10 random circles"
2. Select 3 of them
3. Tell AI: "move them up 100, rotate by 45, and make them blue"

**Expected Result:**
- ✅ AI performs multiple operations
- ✅ All 3 shapes are moved, rotated, AND recolored
- ✅ Might execute as separate function calls or ask for confirmation

---

### Test 10: Edge Cases

#### Test 10a: No Selection
**Steps:**
1. Deselect all (click empty canvas)
2. Tell AI: "move these up 100"

**Expected Result:**
- ✅ AI responds with error: "Please select a shape first"
- ✅ No shapes move

#### Test 10b: Single vs Plural Ambiguity
**Steps:**
1. Select 1 shape
2. Tell AI: "move this up 100"

**Expected Result:**
- ✅ Works correctly (1 shape moves)

#### Test 10c: Large Multi-Select (Stress Test)
**Steps:**
1. Create 50 shapes: "create 50 random circles"
2. Select all (Cmd/Ctrl+A)
3. Tell AI: "move them up 200"

**Expected Result:**
- ✅ All 50 shapes move
- ✅ Operation completes in < 5 seconds
- ✅ Canvas maintains 60 FPS

---

## Console Debugging

### What to Look For

When you send a multi-select command, check the browser console for:

```javascript
[AI] Executing moveShape with params: {
  shapeId: undefined,    // ← Should be undefined or missing!
  x: null,
  y: -100,
  relative: true
}

[SelectionBridge] Selection updated: ["id1", "id2", "id3"]

[moveShape] Called with: {
  shapeId: undefined,    // ← Confirms no shapeId passed
  x: null,
  y: -100,
  relative: true
}

[moveShape] Current selection: {
  selectedShapeIds: ["id1", "id2", "id3"],    // ← Shows 3 shapes selected
  shapes: [...]
}
```

### Red Flags 🚩

**If you see this, the bug is NOT fixed:**
```javascript
[AI] Executing moveShape with params: {
  shapeId: "some-id-here",    // ❌ Should be undefined!
  x: null,
  y: -100,
  relative: true
}
```

**This means the AI is still passing a shapeId and only one shape will move.**

---

## Expected Console Output (Success)

### For Multi-Select Move:
```
[AI] Sending message to OpenAI: move these up 100
[AI] Function call requested: moveShape { x: null, y: -100, relative: true }
[AI] Executing moveShape with params: { x: null, y: -100, relative: true }
[moveShape] Called with: { shapeId: undefined, x: null, y: -100, relative: true }
[moveShape] Current selection: { selectedShapeIds: [3 items], shapes: [3 items] }
[moveShape] Multi-select detected: 3 shapes
[moveShape] Moving shape 1/3...
[moveShape] Moving shape 2/3...
[moveShape] Moving shape 3/3...
[AI] moveShape result: { success: true, result: { movedCount: 3, ... } }
[AI] Getting follow-up response after function execution
```

---

## Performance Benchmarks

| Operation | Shapes | Expected Time |
|-----------|--------|---------------|
| Move | 3 shapes | < 1 second |
| Move | 10 shapes | < 2 seconds |
| Move | 50 shapes | < 5 seconds |
| Color Change | 10 shapes | < 1 second |
| Rotate | 5 shapes | < 1 second |
| Delete | 20 shapes | < 2 seconds |

---

## Common Issues & Solutions

### Issue 1: "Only one shape moves"
**Cause:** AI is still passing a shapeId  
**Check:** Console logs for `shapeId: "..."`  
**Fix:** Verify the files were saved and dev server restarted

### Issue 2: "No shapes move"
**Cause:** Selection bridge not working  
**Check:** Console for `[SelectionBridge] Selection updated:`  
**Fix:** Make sure shapes are actually selected (blue highlight)

### Issue 3: "AI says 'I can't do that'"
**Cause:** API key or OpenAI connection issue  
**Check:** Browser console for API errors  
**Fix:** Check `.env.local` has valid `VITE_OPENAI_API_KEY`

### Issue 4: "Shapes move wrong direction"
**Cause:** Coordinate system confusion  
**Note:** This is a different bug, not related to multi-select  
**Check:** Up should be negative Y, down positive Y

---

## Quick Test (1 Minute)

**Minimal test to confirm the fix works:**

1. Create 3 circles: "create 3 circles"
2. Select all 3 (Cmd/Ctrl+A)
3. Tell AI: "move up 100"
4. **Result:** All 3 circles should move up

If all 3 move → ✅ Bug is FIXED!  
If only 1 moves → ❌ Bug still exists

---

## Test Results Template

Copy this and fill it out:

```
Date Tested: ___________
Tester: ___________

Test 1 (Multi-Select Move): PASS / FAIL
Test 2 (All Directions): PASS / FAIL
Test 3 (Resize): PASS / FAIL
Test 4 (Rotate): PASS / FAIL
Test 5 (Color): PASS / FAIL
Test 6 (Delete): PASS / FAIL
Test 7 (Single Shape): PASS / FAIL
Test 8 (Natural Language): PASS / FAIL
Test 9 (Mixed Ops): PASS / FAIL
Test 10 (Edge Cases): PASS / FAIL

Overall Status: PASS / FAIL

Notes:
_______________________________
_______________________________
```

---

## Success Criteria

The fix is successful if:
- ✅ Multi-select move affects ALL selected shapes
- ✅ All 5 manipulation operations support multi-select
- ✅ Console shows `shapeId: undefined` for multi-select commands
- ✅ Single shape commands still work
- ✅ Natural language variations work ("these", "them", etc.)
- ✅ No performance degradation

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Commit the changes
2. Update progress.md with bug fix
3. Consider this bug RESOLVED
4. Continue with PR #21 implementation

### If Tests Fail ❌
1. Check console output (see "Console Debugging" section)
2. Verify files were saved and server restarted
3. Check if `.env.local` has valid OpenAI API key
4. Report specific failing test case for debugging

---

**Last Updated**: October 16, 2025  
**Author**: Cursor AI Assistant  
**Related PR**: PR #21 (AI Selection Commands)  
**Bug Report**: "Move function only works for one shape at a time"

