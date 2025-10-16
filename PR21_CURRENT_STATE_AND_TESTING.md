# PR #21: Current State & Testing Guide

**Branch**: `feat/pr21-ai-selection-v2`  
**Base**: `feat/ai-chat-interface` (PR #19 complete)  
**Date**: October 16, 2025  
**Status**: Ready for PR21 implementation

---

## 📊 What's Currently Working (PR #18 + PR #19)

### ✅ **14 AI Functions Fully Implemented**

#### **Creation Commands (6 functions)**
1. ✅ `createRectangle(x, y, width, height, color)` - Create rectangle
2. ✅ `createCircle(x, y, radius, color)` - Create circle  
3. ✅ `createLine(x1, y1, x2, y2, strokeWidth, color)` - Create line
4. ✅ `createText(text, x, y, fontSize, fontWeight, color)` - Create text
5. ✅ `createShapesBatch(shapes, userId)` - Create 2-10 custom shapes
6. ✅ `generateShapes(config, userId)` - Generate up to 1000 shapes with patterns

#### **Manipulation Commands (5 functions)**
7. ✅ `moveShape(shapeId, x, y, relative)` - Move shape (absolute or relative)
8. ✅ `resizeShape(shapeId, width, height)` - Resize shape
9. ✅ `rotateShape(shapeId, degrees, relative)` - Rotate shape
10. ✅ `changeShapeColor(shapeId, color)` - Change shape color
11. ✅ `deleteShape(shapeId)` - Delete shape

**⭐ BONUS: Multi-Select Manipulation** - All 5 manipulation functions support multiple selected shapes!

#### **Query Commands (3 functions)**
12. ✅ `getCanvasState()` - Get all shapes on canvas
13. ✅ `getSelectedShapes()` - Get currently selected shapes
14. ✅ `getCanvasCenter()` - Get canvas center coordinates (2500, 2500)

---

## 🧪 **Test Procedures for Current Functions**

### **Setup**
1. Open http://localhost:5174 (dev server running)
2. Log in to the app
3. Open AI chat panel (bottom-right corner)

---

### **Test 1: Basic Shape Creation** ✅

**Commands to Try:**
```
Create a red rectangle at the center
Create 3 blue circles
Create a line from 1000,1000 to 2000,2000
Add text that says "Hello World"
```

**Expected Results:**
- ✅ Shapes appear on canvas instantly
- ✅ AI responds with confirmation
- ✅ Console logs show function calls
- ✅ Real-time sync (other users see shapes)

**Success Criteria:**
- All 4 shape types can be created
- Positions and colors are correct
- No errors in console

---

### **Test 2: Batch Creation** ✅

**Commands to Try:**
```
Create a login form
Create 5 random shapes
Make a navigation bar with 4 menu items
```

**Expected Results:**
- ✅ Multiple shapes created at once
- ✅ Shapes positioned logically
- ✅ AI confirms how many shapes created
- ✅ Works for 2-10 shapes

**Success Criteria:**
- Batch creation completes successfully
- All shapes appear correctly
- Response time < 2 seconds

---

### **Test 3: Pattern Generation** ✅

**Commands to Try:**
```
Generate 100 circles randomly
Create a 10x10 grid of squares
Make 50 circles in a spiral pattern
Generate 20 shapes in a row
```

**Expected Results:**
- ✅ AI calls `generateShapes()`
- ✅ Up to 1000 shapes supported
- ✅ 6 patterns: random, grid, row, column, circle-pattern, spiral
- ✅ Maintains 60 FPS even with 1000 shapes

**Success Criteria:**
- Patterns render correctly
- Performance remains smooth
- AI responds < 5 seconds for 1000 shapes

---

### **Test 4: Manual Selection + AI Manipulation** ✅

**Procedure:**
1. Manually select 3-5 shapes (shift-click or drag-select)
2. Use AI manipulation commands

**Commands to Try:**
```
Move up 100 pixels
Rotate 45 degrees
Make them all red
Resize to 200x200
Delete selected shapes
```

**Expected Results:**
- ✅ AI automatically detects selection
- ✅ Applies operation to ALL selected shapes
- ✅ AI confirms count: "Moved 5 shape(s)"
- ✅ Handles errors gracefully

**Success Criteria:**
- Multi-select manipulation works
- All selected shapes affected
- No shapes left behind

---

### **Test 5: Query Commands** ✅

**Commands to Try:**
```
How many shapes are on the canvas?
What shapes are selected?
Where is the center of the canvas?
```

**Expected Results:**
- ✅ `getCanvasState()` returns all shapes with details
- ✅ `getSelectedShapes()` returns current selection
- ✅ `getCanvasCenter()` returns {x: 2500, y: 2500}
- ✅ AI uses this data to answer questions

**Success Criteria:**
- Query functions return accurate data
- AI interprets data correctly
- Response time < 1 second

---

### **Test 6: Complex Multi-Step Operations** ✅

**Commands to Try:**
```
Create 10 circles, arrange them in a row, then make them all blue
Generate 20 shapes randomly, then delete all the rectangles
Create a form with 3 text fields and a button
```

**Expected Results:**
- ✅ AI plans multi-step operations
- ✅ Executes steps sequentially
- ✅ Uses query + manipulation commands
- ✅ Handles complex requests

**Success Criteria:**
- Complex operations complete successfully
- All steps execute in correct order
- Final result matches intent

---

### **Test 7: Edge Cases & Error Handling** ✅

**Commands to Try:**
```
Move shape (with nothing selected)
Resize to -100x-100
Create shape at position 10000,10000
Change color to "red" (not hex code)
```

**Expected Results:**
- ✅ Clear error messages
- ✅ AI explains what went wrong
- ✅ Validation prevents invalid operations
- ✅ App doesn't crash

**Success Criteria:**
- All errors handled gracefully
- User-friendly error messages
- No console errors

---

### **Test 8: Real-Time Collaboration** ✅

**Procedure:**
1. Open app in 2 browser windows
2. Log in as different users
3. User A: Use AI to create shapes
4. User B: Watch shapes appear

**Expected Results:**
- ✅ User B sees shapes appear instantly (<100ms)
- ✅ AI operations sync across all users
- ✅ Selections are per-user (isolated)
- ✅ No conflicts or corruption

**Success Criteria:**
- Real-time sync works for AI operations
- Multi-user AI usage doesn't conflict
- Both users can use AI simultaneously

---

## ❌ **What's NOT Yet Implemented (PR #21 Scope)**

### **Selection Commands (5 functions) - TO BE ADDED**

#### **Missing Functions:**
1. ❌ `selectShapesByType(type)` - Select all shapes of a type
2. ❌ `selectShapesByColor(color)` - Select all shapes with color
3. ❌ `selectShapesInRegion(x, y, width, height)` - Select shapes in region
4. ❌ `selectShapes(shapeIds)` - Select specific shapes by IDs
5. ❌ `deselectAll()` - Clear all selections

#### **Current Workaround:**
- ✅ Manual selection works (shift-click, drag-select)
- ✅ Then use AI manipulation commands on selection
- ❌ AI cannot programmatically select shapes yet

---

## 🎯 **What PR #21 Will Enable**

### **New Capabilities After PR #21:**

**1. Programmatic Selection**
```
Select all circles
Select all red shapes
Select shapes in the top-left quadrant
Clear selection
```

**2. Selection + Manipulation Chains**
```
Select all rectangles and make them blue
Select all shapes in the center and delete them
Select red shapes and move them 100 pixels right
```

**3. Complex Selection Queries**
```
How many circles are there? (select by type, count)
Select all blue shapes and resize them
Find shapes in region and change their color
```

---

## 📋 **Implementation Checklist for PR #21**

### **Phase 1: Backend (canvasAPI.js)**
- [ ] Add helper functions:
  - [ ] `getShapeBounds(shape)` - Get bounding box
  - [ ] `isShapeInRegion(shape, x, y, w, h)` - AABB intersection
  - [ ] `validateShapeType(type)` - Type validation
- [ ] Add 5 selection functions
- [ ] Enhance selectionBridge with `updateSelection()`

### **Phase 2: AI Integration (aiFunctions.js)**
- [ ] Add 5 function schemas
- [ ] Update function registry
- [ ] Update system prompt

### **Phase 3: React Integration (Canvas.jsx)**
- [ ] Register selection bridge on mount
- [ ] Keep bridge in sync with selection state

### **Phase 4: Testing**
- [ ] Test all 5 selection functions individually
- [ ] Test chaining (select → manipulate)
- [ ] Test multi-user scenarios
- [ ] Test performance with large selections

---

## 🚀 **Quick Test Script for Current Functionality**

### **5-Minute Test Suite:**

```javascript
// Test 1: Create shapes (30 seconds)
"Create 3 red circles and 2 blue rectangles"

// Test 2: Batch creation (30 seconds)
"Create a login form with username and password"

// Test 3: Generate pattern (30 seconds)
"Generate 50 circles in a grid pattern"

// Test 4: Manual select + AI (1 minute)
// Manually select 3 shapes, then:
"Make them all green"
"Rotate 90 degrees"
"Move right 100 pixels"

// Test 5: Queries (30 seconds)
"How many shapes are on the canvas?"
"What's selected?"

// Test 6: Complex operation (1 minute)
"Create 20 random shapes, then delete all the circles"

// Test 7: Multi-user (1 minute)
// Open 2 windows, user A creates shapes via AI
// Verify user B sees them instantly
```

**Expected Duration:** 5 minutes  
**Expected Result:** All tests pass ✅

---

## 📊 **Current vs. After PR #21**

| Feature | Current (PR19) | After PR21 |
|---------|---------------|------------|
| AI Shape Creation | ✅ Yes (6 types) | ✅ Same |
| AI Shape Manipulation | ✅ Yes (5 ops) | ✅ Same |
| Multi-Select Manipulation | ✅ Manual select only | ✅ AI + Manual |
| Pattern Generation | ✅ 1000 shapes, 6 patterns | ✅ Same |
| Query Commands | ✅ 3 queries | ✅ Same |
| **Programmatic Selection** | ❌ **No** | ✅ **Yes (5 types)** |
| **Selection Chains** | ❌ **No** | ✅ **Yes** |
| Total AI Functions | 14 | **19** |

---

## 🎓 **Key Differences**

### **Before PR #21 (Current):**
```
User: "Make all circles red"
AI: ❌ "I can't select shapes programmatically. 
     Please manually select the circles first, 
     then I can change their color."
```

### **After PR #21:**
```
User: "Make all circles red"
AI: ✅ Step 1: selectShapesByType('circle')
    ✅ Step 2: changeShapeColor(each, '#FF0000')
    ✅ "I changed 8 circles to red!"
```

---

## 🎯 **Summary**

### **Working Now:**
- ✅ 14 AI functions fully operational
- ✅ Create, manipulate, query shapes via natural language
- ✅ Multi-select manipulation (manual select + AI manipulate)
- ✅ Batch creation (2-10 shapes)
- ✅ Pattern generation (up to 1000 shapes)
- ✅ Real-time collaboration
- ✅ <2s response times
- ✅ 60 FPS with 1000+ shapes

### **Missing (PR #21 Scope):**
- ❌ AI cannot select shapes programmatically
- ❌ Cannot chain selection + manipulation in single command
- ❌ Cannot filter shapes by criteria via AI

### **Estimated Time to Complete PR #21:**
- Implementation: 30-45 minutes
- Testing: 15-20 minutes
- Documentation: 10 minutes
- **Total: ~1 hour**

---

**Last Updated**: October 16, 2025  
**Branch**: `feat/pr21-ai-selection-v2`  
**Status**: Planning complete, ready for implementation

