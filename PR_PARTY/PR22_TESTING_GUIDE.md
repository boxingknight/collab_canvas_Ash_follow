# PR #22: AI Layout Commands - Testing Guide

## Overview
This guide will help you test all 6 new layout commands with edge cases to ensure Figma-level quality.

## Quick Start Testing

### 1. Start Development Server
```bash
cd collabcanvas
npm run dev
```

### 2. Open AI Chat Panel
- Log in to the app
- Open the AI chat panel (bottom-right)

## Test Cases by Feature

### ✅ Feature 1: arrangeHorizontal

**Test 1.1: Basic Horizontal Arrangement**
```
AI: Create 5 random rectangles
AI: Select all rectangles and arrange them in a horizontal row
```
**Expected**: Rectangles arranged left-to-right, vertically centered, 20px spacing

**Test 1.2: Custom Spacing**
```
AI: Arrange these rectangles horizontally with 50px spacing
```
**Expected**: Same alignment but 50px between shapes

**Test 1.3: With Rotated Shapes**
```
AI: Create 3 rectangles
AI: Rotate the first one to 45 degrees
AI: Arrange them horizontally
```
**Expected**: Uses rotated bounding boxes (larger AABB), still aligns properly

**Test 1.4: Mixed Shape Types**
```
AI: Create 2 rectangles, 2 circles, and 1 text
AI: Select all and arrange horizontally
```
**Expected**: All shape types handled, vertically centered by their bounding boxes

---

### ✅ Feature 2: arrangeVertical

**Test 2.1: Basic Vertical Arrangement**
```
AI: Create 4 circles
AI: Select all circles and stack them vertically
```
**Expected**: Circles stacked top-to-bottom, horizontally centered, 20px spacing

**Test 2.2: Custom Spacing**
```
AI: Stack these shapes vertically with 10px spacing
```
**Expected**: Tight vertical stack

**Test 2.3: With Rotated Shapes**
```
AI: Create 3 text shapes saying "Hello", "World", "Test"
AI: Rotate the middle one by 30 degrees
AI: Arrange them vertically
```
**Expected**: Handles rotated text correctly using AABB

---

### ✅ Feature 3: arrangeGrid

**Test 3.1: Perfect Square Grid (3x3)**
```
AI: Create 9 random shapes
AI: Select all and arrange in a 3x3 grid
```
**Expected**: Perfect 3x3 grid with 20px spacing, shapes centered in cells

**Test 3.2: Non-Square Grid (4x3)**
```
AI: Create 12 circles
AI: Select all circles and arrange in 4 rows and 3 columns
```
**Expected**: 4 rows × 3 columns = 12 shapes, all positioned correctly

**Test 3.3: Grid Validation (Too Small)**
```
AI: Create 10 rectangles
AI: Arrange them in a 2x2 grid
```
**Expected**: Error message: "Grid too small: 2x2 grid has 4 cells but you have 10 shapes. Use at least 5x2 or 2x5."

**Test 3.4: Canvas Overflow Prevention**
```
AI: Create 100 large rectangles (200x200)
AI: Arrange in 10x10 grid with 100px spacing
```
**Expected**: Error message about layout being too large for canvas with spacing suggestions

**Test 3.5: Custom Spacing**
```
AI: Create 6 shapes
AI: Arrange in 2x3 grid with 50px horizontal spacing and 30px vertical spacing
```
**Expected**: Grid with asymmetric spacing (50px X, 30px Y)

---

### ✅ Feature 4: distributeEvenly

**Test 4.1: Horizontal Distribution**
```
AI: Create 5 rectangles at positions (100, 100), (500, 150), (1000, 200), (1500, 100), (2000, 150)
AI: Select all and distribute evenly horizontally
```
**Expected**: First and last stay fixed, middle 3 spaced evenly between them, Y unchanged

**Test 4.2: Vertical Distribution**
```
AI: Create 4 circles at Y positions 100, 400, 800, 1200
AI: Select all and distribute evenly vertically
```
**Expected**: Top and bottom fixed, middle 2 spaced evenly, X unchanged

**Test 4.3: Minimum Shapes (2)**
```
AI: Create 2 shapes
AI: Distribute evenly
```
**Expected**: No change (first and last stay fixed)

**Test 4.4: Precision Test (Floating Point)**
```
AI: Create 7 shapes in a row
AI: Distribute evenly horizontally
```
**Expected**: No floating point drift - all positions are whole pixels (Math.round)

**Test 4.5: Too Few Shapes**
```
AI: Create 1 rectangle
AI: Distribute it evenly
```
**Expected**: Error message: "Need at least 2 shapes to distribute"

---

### ✅ Feature 5: centerShape

**Test 5.1: Center Rectangle**
```
AI: Create a rectangle at (100, 100)
AI: Center this shape
```
**Expected**: Rectangle centered at canvas center (2500, 2500), using top-left anchor

**Test 5.2: Center Circle**
```
AI: Create a circle at (200, 200)
AI: Center this circle
```
**Expected**: Circle centered at canvas center (2500, 2500), using center anchor

**Test 5.3: Center Rotated Shape**
```
AI: Create a rectangle
AI: Rotate it to 45 degrees
AI: Center this shape
```
**Expected**: Uses rotated bounding box, visual center is at (2500, 2500)

**Test 5.4: Center Line**
```
AI: Create a line from (100, 100) to (300, 400)
AI: Center this line
```
**Expected**: Line's midpoint moves to canvas center, both endpoints offset equally

**Test 5.5: Center Text**
```
AI: Create text "Hello World" at (100, 100)
AI: Center this text
```
**Expected**: Text centered at canvas center

---

### ✅ Feature 6: centerShapes

**Test 6.1: Center Group (Preserves Relative Positions)**
```
AI: Create 3 rectangles at (100, 100), (200, 100), (300, 100)
AI: Select all and center them as a group
```
**Expected**: Group's bounding box centered at (2500, 2500), relative positions preserved (100px apart)

**Test 6.2: Center Complex Layout**
```
AI: Create 5 shapes in a row
AI: Arrange them horizontally with 50px spacing
AI: Center this layout
```
**Expected**: Entire horizontal row moves to canvas center as a unit

**Test 6.3: Center Scattered Shapes**
```
AI: Create 10 random shapes across the canvas
AI: Select all and center them
```
**Expected**: All shapes move by same offset, relative positions unchanged, group centered

---

## Advanced Integration Tests

### 🔗 Test 7: Chained Operations

**Test 7.1: Select → Arrange → Center**
```
AI: Create 20 random circles
AI: Select all circles and arrange in a 4x5 grid
AI: Center this grid
```
**Expected**: 
1. 20 circles created
2. Arranged in 4 rows × 5 columns
3. Entire grid centered at canvas center

**Test 7.2: Create → Arrange → Manipulate**
```
AI: Create 6 rectangles
AI: Arrange them horizontally
AI: Make them all red
AI: Rotate them all by 15 degrees
```
**Expected**:
1. 6 rectangles created
2. Arranged in horizontal row
3. All turn red
4. All rotate by 15 degrees

**Test 7.3: Filter → Layout**
```
AI: Create 5 red rectangles and 5 blue circles
AI: Select all rectangles
AI: Stack them vertically
AI: Select all circles
AI: Arrange them horizontally
```
**Expected**: 
1. Rectangles in vertical stack
2. Circles in horizontal row
3. Two separate layouts

---

## Edge Cases & Error Handling

### 🛡️ Test 8: Boundary Conditions

**Test 8.1: Empty Selection**
```
AI: Arrange shapes horizontally
```
(No shapes selected)
**Expected**: Error: "No shapes selected" or similar

**Test 8.2: Single Shape (Arrange)**
```
AI: Create 1 rectangle
AI: Arrange it horizontally
```
**Expected**: Works but no visible change (only 1 shape)

**Test 8.3: Invalid Grid Dimensions**
```
AI: Create 5 shapes
AI: Arrange in 0x0 grid
```
**Expected**: Error: "rows must be a positive number"

**Test 8.4: Negative Spacing**
```
AI: Create 3 shapes
AI: Arrange horizontally with -10px spacing
```
**Expected**: Error: "spacing must be a non-negative number"

**Test 8.5: Shape Not Found**
```
AI: Arrange these shapes horizontally
```
(User deleted shapes after AI got their IDs)
**Expected**: Error: "Some shapes not found: X missing"

---

## Real-Time Sync Tests

### 🔄 Test 9: Multiplayer Layout

**Setup**: Open app in 2 browser windows, logged in as different users

**Test 9.1: Simultaneous Layout (User A)**
```
User A: Create 5 rectangles
User A: Arrange them in a grid 2x3
```
**Expected**: User B sees shapes appear AND sees grid arrangement in real-time

**Test 9.2: Batch Update Atomicity**
```
User A: Create 10 shapes
User A: Arrange them horizontally
```
**Expected**: 
- User B sees all 10 shapes move simultaneously (batch update)
- No "flickering" or shapes moving one-by-one

**Test 9.3: Layout During Manipulation**
```
User A: Creates 5 shapes
User B: Manually drags one shape
User A: Arrange all shapes in a row
```
**Expected**: User B's manual drag is overridden by User A's layout (last write wins)

---

## Performance Tests

### ⚡ Test 10: Large-Scale Layouts

**Test 10.1: 100 Shapes in Grid**
```
AI: Create 100 small rectangles
AI: Arrange them in a 10x10 grid
```
**Expected**: 
- Completes in < 2 seconds
- Smooth animation
- No jank

**Test 10.2: 500 Shapes (Batch Limit)**
```
AI: Create 500 tiny shapes
AI: Distribute them evenly horizontally
```
**Expected**: 
- Uses Firestore batch writes (500 = batch limit)
- Completes successfully
- All shapes update atomically

**Test 10.3: 1000 Shapes (Multi-Batch)**
```
AI: Create 1000 shapes
AI: Center them all as a group
```
**Expected**:
- Uses multiple batch writes (2 batches: 500 + 500)
- Completes successfully
- Real-time sync works

---

## Bug Validation Tests

### 🐛 Test 11: Specific Bug Fixes

**Test 11.1: Rotated Bounds (Bug #1)**
```
AI: Create a 200x100 rectangle
AI: Rotate it to 45 degrees
AI: Create another rectangle next to it
AI: Arrange both horizontally
```
**Expected**: Uses rotated AABB (not original 200x100), so shapes don't overlap

**Test 11.2: Floating Point Precision (Bug #2)**
```
AI: Create 10 shapes
AI: Distribute them evenly 5 times in a row
```
**Expected**: No drift or accumulation of floating point errors (uses origin-based calculation)

**Test 11.3: Zero-Width Lines (Bug #3)**
```
AI: Create a vertical line (same X for both endpoints)
AI: Create a horizontal line
AI: Arrange both horizontally
```
**Expected**: Vertical line treated as having width = strokeWidth (not 0)

**Test 11.4: Atomic Batch Updates (Bug #4)**
```
AI: Create 50 shapes
AI: Arrange in 5x10 grid
```
(Refresh browser mid-operation)
**Expected**: Either all shapes in grid OR none (atomic), never partial state

**Test 11.5: Canvas Overflow (Bug #5)**
```
AI: Create 20 large rectangles (500x500)
AI: Arrange in 10x10 grid with 100px spacing
```
**Expected**: Error BEFORE attempting layout: "Layout too large...Try spacing ≤ Xpx"

**Test 11.6: Sort Stability (Bug #6)**
```
AI: Create 5 rectangles all at X=100 (same position)
AI: Arrange them horizontally
```
**Expected**: Maintains original creation order (stable sort)

---

## AI Prompt Understanding

### 🤖 Test 12: Natural Language

**Test 12.1: Casual Language**
```
AI: Make me some shapes and put them in a line
```
**Expected**: Creates shapes, arranges horizontally

**Test 12.2: Implicit Spacing**
```
AI: Arrange these shapes in a tight row
```
**Expected**: Uses small spacing (10-20px)

**Test 12.3: Explicit Numbers**
```
AI: Create a 4 by 3 grid of circles
```
**Expected**: Creates 12 circles in 4×3 grid

**Test 12.4: Ambiguous Intent**
```
AI: Organize these shapes
```
**Expected**: AI asks for clarification (horizontal, vertical, grid?)

**Test 12.5: Multi-Step Complex**
```
AI: Create a login form
```
**Expected**: 
1. Creates username field (text/rectangle)
2. Creates password field (text/rectangle)
3. Creates submit button (rectangle)
4. Arranges them vertically with proper spacing
5. Centers the form

---

## Success Criteria

### ✅ All tests must pass with:
1. **Correctness**: Shapes positioned exactly as expected
2. **Performance**: < 2 seconds for single-step commands
3. **Real-time Sync**: All users see updates instantly
4. **Error Handling**: Clear, helpful error messages
5. **Edge Cases**: No crashes or undefined behavior
6. **Rotation Support**: Handles rotated shapes correctly
7. **Precision**: No floating point drift or pixel misalignment
8. **Atomicity**: Batch operations all-or-nothing

---

## Deployment Checklist

Before deploying PR #22:

- [ ] All 11 test categories pass
- [ ] No console errors
- [ ] No linter errors
- [ ] Build completes successfully
- [ ] Real-time sync verified with 2+ users
- [ ] Performance acceptable on deployed app
- [ ] AI understands natural language commands
- [ ] Error messages are user-friendly

---

## Quick Test Commands

Copy-paste these into AI chat for rapid testing:

```
# Test Suite 1: Basic Layouts
Create 5 rectangles and arrange them horizontally
Create 4 circles and stack them vertically
Create 9 shapes and arrange in a 3x3 grid
Create 6 shapes and distribute them evenly
Create a rectangle and center it
Create 5 shapes and center them as a group

# Test Suite 2: Edge Cases
Create 100 shapes and arrange in 10x10 grid
Create 3 shapes, rotate the first by 45 degrees, and arrange horizontally
Create 10 shapes and distribute evenly 3 times

# Test Suite 3: Complex Workflows
Create 20 red circles, arrange in 5x4 grid, and center the grid
Create 8 rectangles, arrange horizontally, make them blue, rotate by 30 degrees
```

---

## Expected Output

After all tests pass, you should see:
- ✅ 6 new layout commands working perfectly
- ✅ Real-time collaboration maintained
- ✅ Figma-level quality (no bugs from the analysis)
- ✅ < 2 second response times
- ✅ Clear, helpful error messages
- ✅ Natural language understanding
- ✅ Support for 500+ shapes without issues

---

## Troubleshooting

**If shapes don't arrange:**
1. Check console for errors
2. Verify shapes are selected
3. Check AI response (did function call execute?)

**If real-time sync fails:**
1. Check Firestore rules
2. Verify batch writes are atomic
3. Check network tab for failed requests

**If performance is slow:**
1. Check shape count (> 1000?)
2. Monitor Firestore read/write counts
3. Check for unnecessary re-renders

**If errors are unclear:**
1. Read error message from AI
2. Check canvasAPI.js console.error logs
3. Verify function parameters

---

## Success! 🎉

Once all tests pass, you have production-ready AI Layout Commands with:
- Figma-level quality
- Bulletproof error handling
- Real-time collaboration
- Support for rotated shapes
- Atomic batch updates
- Precision-safe calculations
- Canvas overflow prevention

**Ready for PR #23: Complex Operations!**

