# Quick Test Commands - Multi-Select AI Fix

**Copy/paste these commands directly into the AI chat to test!**

---

## Setup (Run Once)
```
create 5 random circles
```
Then manually select 3 of them (shift-click each one).

---

## Test 1: Move Up ⭐ PRIMARY TEST
```
move these up 100
```
**Expected:** All 3 selected shapes move up 100 pixels

---

## Test 2: Move Down
```
move them down 50
```
**Expected:** All 3 shapes move down 50 pixels

---

## Test 3: Move Left
```
move these left 200
```
**Expected:** All 3 shapes move left 200 pixels

---

## Test 4: Move Right
```
shift them right 100
```
**Expected:** All 3 shapes move right 100 pixels

---

## Test 5: Color Change
```
make them all red
```
**Expected:** All 3 shapes turn red

---

## Test 6: Rotate
```
rotate these by 45 degrees
```
**Expected:** All 3 shapes rotate 45°

---

## Test 7: Resize
```
resize these to 200x200
```
**Expected:** All 3 shapes resize to 200x200

---

## Test 8: Delete
```
delete these shapes
```
**Expected:** All 3 shapes are deleted

---

## Test 9: Natural Language Variations

Select 3+ shapes, then try:
```
move them up a bit
```
```
make these blue
```
```
rotate them
```
```
push these to the left
```

**Expected:** All work correctly with selected shapes

---

## Test 10: Single Shape (Should Still Work)

Select only 1 shape, then:
```
move this up 50
```
**Expected:** Single shape moves correctly

---

## Success Check ✅

**The fix works if:**
- ✅ ALL selected shapes move together
- ✅ No shapes left behind
- ✅ AI confirms the count: "Moved 3 shape(s)"

**The fix FAILED if:**
- ❌ Only one shape moves
- ❌ Console shows `shapeId: "some-id"` in parameters
- ❌ AI says it can't do multi-select

---

## Console Output to Check

After running "move these up 100", check browser console:

**Good (Fixed):**
```javascript
[AI] Parameters: { x: null, y: -100, relative: true }
// NO shapeId property at all!
```

**Bad (Not Fixed):**
```javascript
[AI] Parameters: { shapeId: "abc123", x: null, y: -100, relative: true }
// Has a shapeId - only one shape will move
```

---

## Minimal Test (30 seconds)

1. `create 3 circles`
2. Select all 3 (Cmd/Ctrl+A or shift-click)
3. `move up 100`
4. Do all 3 move? YES = ✅ Fixed | NO = ❌ Still broken

---

**If the fix works, you're done! 🎉**
**If it doesn't work, check the console output and report what you see.**

