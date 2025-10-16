# PR#16: Testing Checklist

**Status**: Implementation Complete - Ready for Testing  
**Branch**: `feat/duplicate-shortcuts`  
**Commit**: Phase 1-3 Complete

---

## ✅ Implementation Complete

### What Was Built
1. **duplicateShapes function** in useShapes hook
   - Handles single and multi-select
   - Offsets by 20px diagonal
   - Preserves all properties (color, rotation, text, strokeWidth)
   - Uses batch operations for performance
   - Special handling for lines (offsets endpoints too)

2. **useKeyboard hook** for centralized shortcuts
   - Platform detection (Mac vs Windows)
   - Context awareness (isTextEditing flag)
   - Memoized platform info
   - Clean event listener management

3. **Canvas integration**
   - handleDuplicate: Duplicates and auto-selects new shapes
   - handleNudge: Moves shapes with arrow keys (respects locks, bounds)
   - handleToolChange: Switches tools and modes
   - handleDeselect: Cancels marquee or clears selection
   - handleSelectAll: Selects all shapes

---

## 📋 Manual Testing Checklist

### 1. Duplicate Functionality

#### Single Shape Duplicate
- [ ] Create a rectangle
- [ ] Select it (click)
- [ ] Press Cmd+D (Mac) or Ctrl+D (Windows)
- [ ] **Expected**: New rectangle appears 20px offset (down-right)
- [ ] **Expected**: New rectangle is selected (old one deselected)
- [ ] **Expected**: Original rectangle still there

#### Multi-Select Duplicate
- [ ] Select 3 shapes (shift-click)
- [ ] Press Cmd+D
- [ ] **Expected**: 3 new shapes appear, all offset by 20px
- [ ] **Expected**: All 3 new shapes are selected
- [ ] **Expected**: Originals remain

#### Property Preservation
- [ ] **Rotation**: Duplicate a rotated shape
  - Create rectangle, rotate it 45°, duplicate
  - **Expected**: Duplicate also rotated 45°
  
- [ ] **Color**: Duplicate a colored shape
  - **Expected**: Duplicate has same color

- [ ] **Text**: Duplicate a text shape
  - Type some text, duplicate
  - **Expected**: Text content preserved

- [ ] **Line**: Duplicate a line
  - Create line, duplicate
  - **Expected**: Line direction/length preserved

#### No Selection Duplicate
- [ ] Click empty canvas (deselect all)
- [ ] Press Cmd+D
- [ ] **Expected**: Nothing happens (no error)
- [ ] **Expected**: Console: "No shapes selected to duplicate"

### 2. Keyboard Shortcuts

#### Platform Detection
- [ ] **Mac**: Cmd+D works, Ctrl+D doesn't
- [ ] **Windows**: Ctrl+D works, Cmd+D doesn't

#### Tool Shortcuts
- [ ] Press **V** → Pan mode activated
- [ ] Press **M** → Move mode activated
- [ ] Press **D** → Draw mode activated
- [ ] Press **R** → Draw mode + Rectangle selected in toolbar
- [ ] Press **C** → Draw mode + Circle selected in toolbar
- [ ] Press **L** → Draw mode + Line selected in toolbar
- [ ] Press **T** → Draw mode + Text selected in toolbar

#### Arrow Key Nudging
- [ ] Select a shape
- [ ] Press **Arrow Up** → Shape moves up 1px
- [ ] Press **Arrow Down** → Shape moves down 1px
- [ ] Press **Arrow Left** → Shape moves left 1px
- [ ] Press **Arrow Right** → Shape moves right 1px
- [ ] Press **Shift+Arrow Up** → Shape moves up 10px
- [ ] Press **Shift+Arrow Down** → Shape moves down 10px

#### Multi-Select Nudging
- [ ] Select 3 shapes
- [ ] Press Arrow Right
- [ ] **Expected**: All 3 shapes move right 1px together
- [ ] Press Shift+Arrow Up
- [ ] **Expected**: All 3 shapes move up 10px together

#### Existing Shortcuts Still Work
- [ ] **Escape** → Deselects shapes and returns to pan mode
- [ ] **Delete/Backspace** → Deletes selected shapes
- [ ] **Cmd/Ctrl+A** → Selects all shapes

### 3. Text Editing Context Awareness

- [ ] Double-click a text shape (enters edit mode)
- [ ] Type "d"
- [ ] **Expected**: Letter "d" appears in text (does NOT trigger draw mode)
- [ ] Type "v"
- [ ] **Expected**: Letter "v" appears in text (does NOT switch to pan mode)
- [ ] Press Arrow Right
- [ ] **Expected**: Cursor moves in text (does NOT nudge shape)
- [ ] Press **Escape** → Exits text edit mode
- [ ] Now press "d"
- [ ] **Expected**: NOW switches to draw mode

### 4. Edge Cases

#### Duplicate Near Canvas Edge
- [ ] Move shape to near right edge (x ~4900)
- [ ] Duplicate it
- [ ] **Expected**: Duplicate stays within canvas bounds (x < 5000)

#### Nudge to Canvas Bounds
- [ ] Move shape to top-left corner
- [ ] Press Arrow Up repeatedly
- [ ] **Expected**: Shape stops at y=0 (doesn't go negative)
- [ ] Press Arrow Left repeatedly
- [ ] **Expected**: Shape stops at x=0 (doesn't go negative)

#### Rapid Duplicates
- [ ] Select shape
- [ ] Press D, D, D, D rapidly (Cmd+D four times fast)
- [ ] **Expected**: 4 new shapes created in staggered diagonal
- [ ] **Expected**: No crashes, all shapes appear

#### Locked Shape Nudge
- [ ] Open 2 browsers
- [ ] User A: Select and drag shape (holds it)
- [ ] User B: Try to nudge same shape with arrow keys
- [ ] **Expected**: Shape doesn't move for User B
- [ ] **Expected**: Console log: "Shape is locked by another user"

### 5. Real-Time Sync

#### Duplicate Sync
- [ ] Open 2 browsers (User A and User B)
- [ ] User A: Select shape and press Cmd+D
- [ ] **Expected**: User B sees duplicate appear immediately
- [ ] **Expected**: Both users see same offset position

#### Nudge Sync
- [ ] User A: Select shape and press Arrow Right 5 times
- [ ] **Expected**: User B sees shape move smoothly
- [ ] **Expected**: No lag or jitter

### 6. Performance

#### Duplicate Performance
- [ ] Create 50 shapes
- [ ] Select all (Cmd+A)
- [ ] Duplicate (Cmd+D)
- [ ] **Expected**: Completes in < 2 seconds
- [ ] **Expected**: All 50 duplicates appear

#### Nudge Performance
- [ ] Select 50 shapes
- [ ] Hold Arrow Right for 2 seconds
- [ ] **Expected**: Smooth movement at 60 FPS
- [ ] **Expected**: No lag or stutter

### 7. Browser Compatibility

#### Chrome
- [ ] All shortcuts work
- [ ] Platform detection correct

#### Firefox
- [ ] All shortcuts work
- [ ] Platform detection correct

#### Safari
- [ ] All shortcuts work
- [ ] Platform detection correct

---

## 🐛 Issues Found

_(Document any bugs discovered during testing)_

### Bug #1: [Title]
- **Severity**: 
- **Steps to Reproduce**: 
- **Expected**: 
- **Actual**: 
- **Root Cause**: 
- **Fix**: 

---

## ✅ Test Results Summary

**Duplicate Functionality**: ☐ Pass / ☐ Fail  
**Keyboard Shortcuts**: ☐ Pass / ☐ Fail  
**Arrow Key Nudging**: ☐ Pass / ☐ Fail  
**Text Editing Context**: ☐ Pass / ☐ Fail  
**Edge Cases**: ☐ Pass / ☐ Fail  
**Real-Time Sync**: ☐ Pass / ☐ Fail  
**Performance**: ☐ Pass / ☐ Fail  

**Overall Status**: ☐ Ready to Merge / ☐ Needs Fixes

---

## 🚀 Next Steps

1. **After Testing Passes**:
   - Push branch to GitHub
   - Merge to main
   - Deploy to Firebase
   - Test deployed version
   - Update memory bank
   - Start PR#17 (Layer Management) OR move to AI integration

2. **If Issues Found**:
   - Document bugs in this file
   - Fix issues
   - Re-test
   - Commit fixes

---

**Dev Server**: `npm run dev` (localhost:5173)  
**Test With**: Multiple browser windows/tabs  
**Platform**: Test on Mac (Cmd) and Windows (Ctrl) if available


