# PR #21 Testing Guide 🧪

**Feature**: AI Selection Commands  
**Branch**: `feat/ai-selection-commands`  
**Status**: Ready for Testing  
**Date**: October 16, 2025

---

## 🎯 What to Test

We've implemented **5 new AI selection commands** that enable the AI to programmatically select shapes. This is a **game-changing feature** that allows powerful workflows like:

- "Select all rectangles and make them blue"
- "Delete all circles"
- "Move all shapes in top-left to center"

---

## 🚀 Quick Start

1. **Dev server should be running** at `http://localhost:5173`
2. **Log in** to the canvas
3. **Create some test shapes** (rectangles, circles, different colors)
4. **Open AI chat** (bottom-right panel)
5. **Try the test commands below!**

---

## ✅ Test Cases

### Test 1: Select by Type ⭐ ESSENTIAL

**Setup:**
- Create 3 rectangles
- Create 2 circles
- Create 1 line

**Test Commands:**
```
"Select all rectangles"
```

**Expected Result:**
- All 3 rectangles should be visually selected (blue dashed border)
- Circles and line should NOT be selected
- Selection count badge should show "3"
- AI should respond: "I selected 3 rectangle(s)"

**Variations to Test:**
```
"Select all circles"
"Select all lines"
"Select all text"
```

---

### Test 2: Select by Color ⭐ ESSENTIAL

**Setup:**
- Create 3 red shapes (#FF0000)
- Create 2 blue shapes (#0000FF)
- Create 1 green shape (#00FF00)

**Test Commands:**
```
"Select all red shapes"
```

**Expected Result:**
- All 3 red shapes selected
- Blue and green shapes NOT selected
- Selection count: 3
- AI responds: "I selected 3 #FF0000 shape(s)"

**Variations:**
```
"Select all blue shapes"
"Select all shapes with color #00FF00"
```

---

### Test 3: Select by Region ⭐ ESSENTIAL

**Setup:**
- Create shapes in different areas of canvas
- Some in top-left (0-2500, 0-2500)
- Some in bottom-right (2500-5000, 2500-5000)

**Test Commands:**
```
"Select shapes in top-left"
```

**Expected Result:**
- Only shapes in top-left quadrant selected
- Other shapes NOT selected
- AI should use: `selectShapesInRegion(0, 0, 2500, 2500)`

**Variations:**
```
"Select shapes in the center"
"Select everything in the bottom half"
"Select shapes in top-right quadrant"
```

---

### Test 4: Deselect All ⭐ ESSENTIAL

**Setup:**
- Manually select 3 shapes (Shift+click)

**Test Command:**
```
"Clear selection"
```

**Expected Result:**
- All shapes should be deselected
- No blue borders
- Selection count badge disappears
- AI responds: "Selection cleared"

**Variations:**
```
"Deselect all"
"Unselect everything"
"Clear the selection"
```

---

### Test 5: Chained Operations 🔥 CRITICAL

**This is the KILLER FEATURE - selection + manipulation!**

#### Test 5a: Select + Color Change
**Setup:** Create 5 rectangles of any color

**Test Command:**
```
"Select all rectangles and make them blue"
```

**Expected Result:**
1. AI calls `selectShapesByType('rectangle')`
2. AI calls `changeShapeColor('#0000FF')` (without shapeId)
3. All 5 rectangles turn blue
4. All 5 rectangles stay selected

**Why This is Amazing:** Before PR #21, this was IMPOSSIBLE. Now it's one command!

---

#### Test 5b: Select + Delete
**Setup:** Create 3 circles + 3 rectangles

**Test Command:**
```
"Delete all circles"
```

**Expected Result:**
1. AI selects all circles
2. AI deletes all selected shapes
3. Only rectangles remain
4. Circles are gone

**This demonstrates:** AI can target and remove specific shape types!

---

#### Test 5c: Select + Move
**Setup:** Create multiple shapes in top-left

**Test Command:**
```
"Move all shapes in top-left to the center"
```

**Expected Result:**
1. AI selects shapes in region (0, 0, 2500, 2500)
2. AI moves all selected to center (2500, 2500)
3. Shapes appear at center
4. Other shapes unaffected

---

#### Test 5d: Complex Chaining
**Setup:** Create mix of shapes with various colors

**Test Command:**
```
"Select all red rectangles, make them bigger, and rotate them 45 degrees"
```

**Expected Result:**
1. AI selects by type (rectangles)
2. AI filters by color (or uses color selection first)
3. AI resizes them
4. AI rotates them
5. All operations work on selected set

---

### Test 6: Multi-User Scenarios 👥

**Setup:** Open canvas in 2 different browsers (or incognito)

**User A:**
```
"Select all rectangles"
```

**Expected:**
- User A sees rectangles selected
- **User B sees NO change** (selections are per-user!)

**User B:**
```
"Select all circles"
```

**Expected:**
- User B sees circles selected
- User A still sees rectangles selected
- Each user has independent selection

**This is CORRECT behavior!** Selections are client-side.

---

### Test 7: Error Handling 🛡️

#### Test 7a: Invalid Type
```
"Select all triangles"
```

**Expected:**
- AI responds with error
- Message: "Invalid type. Must be one of: rectangle, circle, line, text"

---

#### Test 7b: Invalid Color
```
"Select all shapes with color red"
```

**Expected:**
- AI might interpret as #FF0000 OR
- Error: "Color must be a hex code"

---

#### Test 7c: Empty Selection
```
"Select all triangles and delete them"
```

**Expected:**
- First command fails (no triangles exist)
- No shapes deleted
- Helpful error message

---

### Test 8: Edge Cases 🔍

#### Test 8a: No Matching Shapes
**Setup:** Canvas has only rectangles

**Test:**
```
"Select all circles"
```

**Expected:**
- AI responds: "I selected 0 circle(s)"
- No shapes selected
- No error

---

#### Test 8b: Select Already Selected
**Setup:** Manually select 3 rectangles

**Test:**
```
"Select all rectangles"
```

**Expected:**
- AI still selects all rectangles
- Replaces current selection
- Works correctly

---

#### Test 8c: Select in Empty Region
```
"Select shapes in top-left"
```

**When top-left is empty:**

**Expected:**
- AI responds: "I selected 0 shape(s) in region"
- No error
- Works correctly

---

## 🎨 Visual Checklist

When testing, verify these visual cues:

- [ ] Selected shapes have **blue dashed border**
- [ ] Multi-select shows **dashed borders** (not solid)
- [ ] Selection count badge appears (bottom-right)
- [ ] Transform handles appear for single selection
- [ ] No transform handles for multi-select
- [ ] Selection changes are **instant** (< 100ms)
- [ ] No flickering or lag

---

## 🐛 Known Limitations (Acceptable for MVP)

1. **Rotation + Region Selection:**
   - Rotated shapes use AABB (axis-aligned bounding box)
   - A rotated rectangle might be included when it visually appears outside
   - **This is acceptable and documented**

2. **Color Matching:**
   - Only exact hex matches work
   - Similar colors don't match
   - **Future enhancement: fuzzy color matching**

3. **No Visual Selection Preview:**
   - When AI selects, shapes just become selected
   - No animated selection effect
   - **Could add in future for polish**

---

## 🎯 Success Criteria

PR #21 is successful if:

- [ ] All 5 selection commands work
- [ ] Chained operations work (select + manipulate)
- [ ] Visual feedback is correct
- [ ] No console errors
- [ ] Multi-user selections are isolated
- [ ] AI understands natural language variations
- [ ] Error handling is graceful

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] selectShapesByType works
- [ ] selectShapesByColor works
- [ ] selectShapesInRegion works
- [ ] selectShapes (by IDs) works
- [ ] deselectAll works

### Chained Operations
- [ ] Select + Color Change
- [ ] Select + Delete
- [ ] Select + Move
- [ ] Select + Resize
- [ ] Select + Rotate

### Edge Cases
- [ ] Empty selection (0 matches)
- [ ] Invalid parameters
- [ ] Large selections (100+ shapes)
- [ ] Rapid successive selections

### Multi-User
- [ ] Selections are per-user
- [ ] No interference between users
- [ ] Real-time sync still works

### Performance
- [ ] Selection is fast (< 500ms)
- [ ] No FPS drops
- [ ] Works with 100+ shapes
- [ ] AI response < 2s

---

## 🚨 If Something Doesn't Work

### Check Console Logs

Look for these messages:
```
[SelectionBridge] setSelection function registered: true
[SelectionBridge] Updating selection via AI: [array of IDs]
[SelectionBridge] Selection synced from React: N shapes
```

### Common Issues

**Issue: Selection doesn't appear visually**
- Check: Is `registerSetSelection` being called?
- Check: Are there console errors?
- Solution: Refresh page, check registration

**Issue: AI says "I don't know how to..."**
- Check: Are function schemas loaded?
- Check: Is system prompt updated?
- Solution: Check aiFunctions.js and ai.js

**Issue: Selection works but manipulation doesn't**
- Check: Is shapeId being omitted correctly?
- Check: Are shapes actually selected?
- Solution: Test manipulation functions separately

---

## 🎉 What Success Looks Like

After successful testing, you should be able to:

1. **Type:** "Select all rectangles and make them blue"
2. **See:** All rectangles turn blue instantly
3. **Think:** "WOW, that's powerful!"

This is the difference PR #21 makes. Before: impossible. After: one command.

---

## 📝 Report Template

After testing, report findings:

```
PR #21 Test Results
-------------------
✅ selectShapesByType: Working
✅ selectShapesByColor: Working  
✅ selectShapesInRegion: Working
✅ selectShapes: Working
✅ deselectAll: Working

✅ Chained operations: Working
✅ Visual feedback: Correct
✅ Performance: Good
✅ Error handling: Graceful

Issues Found: [None / List any issues]
```

---

**Ready to test!** 🚀

Open `http://localhost:5173` and start testing!

