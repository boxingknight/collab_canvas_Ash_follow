# PR #26: Testing Guide - Multi-Select Editing

**Status**: 📋 Pre-Implementation  
**Test Coverage Target**: 90%+  
**Total Test Cases**: 85  

---

## 🎯 **Testing Strategy**

This PR requires extensive testing due to complex state management, batch operations, and real-time synchronization. We'll test at multiple levels:

1. **Unit Tests** - Utility functions (mixedValues.js, batchUpdate.js)
2. **Component Tests** - React components with mocked data
3. **Integration Tests** - End-to-end multi-select workflows
4. **Performance Tests** - Large selections (50+ shapes)
5. **Real-Time Tests** - Multi-user batch editing

---

## 🧪 **Test Cases**

### **Category 1: Mixed Value Detection** (15 tests)

#### **TC-1.1: Detect Mixed Values for Position**
```javascript
Test: Select 3 shapes with different X positions
Shapes: [{ x: 100 }, { x: 200 }, { x: 300 }]
Expected: detectMixedValue(shapes, 'x') → { isMixed: true, commonValue: undefined }
Priority: P0
```

#### **TC-1.2: Detect Same Values for Position**
```javascript
Test: Select 3 shapes with same X position
Shapes: [{ x: 100 }, { x: 100 }, { x: 100 }]
Expected: detectMixedValue(shapes, 'x') → { isMixed: false, commonValue: 100 }
Priority: P0
```

#### **TC-1.3: Handle Null Values**
```javascript
Test: Select shapes with null/undefined properties
Shapes: [{ x: 100 }, { x: null }, { x: undefined }]
Expected: detectMixedValue(shapes, 'x') → { isMixed: true }
Priority: P1
```

#### **TC-1.4: Handle Missing Properties**
```javascript
Test: Select shapes where property doesn't exist
Shapes: [{ y: 100 }, { y: 200 }] // No 'x' property
Expected: detectMixedValue(shapes, 'x') → { isMixed: false, commonValue: undefined }
Priority: P1
```

#### **TC-1.5: Detect Mixed Colors (Hex)**
```javascript
Test: Select shapes with different colors
Shapes: [{ color: '#ff0000' }, { color: '#00ff00' }, { color: '#0000ff' }]
Expected: { isMixed: true }
Priority: P0
```

#### **TC-1.6: Detect Same Colors**
```javascript
Test: Select shapes with same color
Shapes: [{ color: '#ff0000' }, { color: '#ff0000' }]
Expected: { isMixed: false, commonValue: '#ff0000' }
Priority: P0
```

#### **TC-1.7: Normalize Rotation Values**
```javascript
Test: Select shapes with equivalent rotations
Shapes: [{ rotation: 0 }, { rotation: 360 }, { rotation: 720 }]
Expected: { isMixed: false, commonValue: 0 } // All normalize to 0°
Priority: P2
```

#### **TC-1.8: Detect Mixed Rotation**
```javascript
Test: Select shapes with different rotations
Shapes: [{ rotation: 0 }, { rotation: 45 }, { rotation: 90 }]
Expected: { isMixed: true }
Priority: P0
```

#### **TC-1.9: Detect Mixed Font Size**
```javascript
Test: Select text shapes with different font sizes
Shapes: [{ type: 'text', fontSize: 12 }, { type: 'text', fontSize: 24 }]
Expected: { isMixed: true }
Priority: P1
```

#### **TC-1.10: Handle Single Shape**
```javascript
Test: Single shape should never be "mixed"
Shapes: [{ x: 100, y: 200 }]
Expected: detectMixedValue(shapes, 'x') → { isMixed: false, commonValue: 100 }
Priority: P0
```

#### **TC-1.11: Handle Empty Array**
```javascript
Test: Empty shape array
Shapes: []
Expected: detectMixedValue(shapes, 'x') → { isMixed: false, commonValue: undefined }
Priority: P1
```

#### **TC-1.12: Detect Mixed Width/Height**
```javascript
Test: Select shapes with different sizes
Shapes: [{ width: 100, height: 100 }, { width: 200, height: 200 }]
Expected: Width: { isMixed: true }, Height: { isMixed: true }
Priority: P0
```

#### **TC-1.13: Detect Mixed Text Alignment**
```javascript
Test: Select text shapes with different alignments
Shapes: [{ align: 'left' }, { align: 'center' }, { align: 'right' }]
Expected: { isMixed: true }
Priority: P1
```

#### **TC-1.14: Detect Mixed Bold/Italic**
```javascript
Test: Select text shapes with different font weights
Shapes: [{ fontWeight: 'normal' }, { fontWeight: 'bold' }]
Expected: { isMixed: true }
Priority: P1
```

#### **TC-1.15: Handle Boolean Properties**
```javascript
Test: Detect mixed boolean values
Shapes: [{ locked: true }, { locked: false }, { locked: true }]
Expected: { isMixed: true }
Priority: P2
```

---

### **Category 2: Batch Position Updates** (10 tests)

#### **TC-2.1: Batch Update X Position**
```javascript
Test: Select 3 shapes, change X to 500
Initial: [{ x: 100 }, { x: 200 }, { x: 300 }]
Action: batchUpdateShapes(shapeIds, 'x', 500)
Expected: All shapes have x: 500
Priority: P0
```

#### **TC-2.2: Batch Update Y Position**
```javascript
Test: Select 5 shapes, change Y to 250
Initial: [{ y: 50 }, { y: 100 }, { y: 150 }, { y: 200 }, { y: 250 }]
Action: batchUpdateShapes(shapeIds, 'y', 250)
Expected: All shapes have y: 250
Priority: P0
```

#### **TC-2.3: Batch Update with Negative Values**
```javascript
Test: Move shapes to negative coordinates
Initial: [{ x: 100 }, { x: 200 }]
Action: batchUpdateShapes(shapeIds, 'x', -50)
Expected: All shapes have x: -50 (within canvas bounds)
Priority: P1
```

#### **TC-2.4: Batch Update Width**
```javascript
Test: Resize all shapes to width 300
Initial: [{ width: 100 }, { width: 200 }, { width: 150 }]
Action: batchUpdateShapes(shapeIds, 'width', 300)
Expected: All shapes have width: 300
Priority: P0
```

#### **TC-2.5: Batch Update Height**
```javascript
Test: Resize all shapes to height 200
Initial: [{ height: 100 }, { height: 300 }]
Action: batchUpdateShapes(shapeIds, 'height', 200)
Expected: All shapes have height: 200
Priority: P0
```

#### **TC-2.6: Batch Update Rotation**
```javascript
Test: Rotate all shapes to 45°
Initial: [{ rotation: 0 }, { rotation: 90 }, { rotation: 180 }]
Action: batchUpdateShapes(shapeIds, 'rotation', 45)
Expected: All shapes have rotation: 45
Priority: P0
```

#### **TC-2.7: Batch Update Maintains Other Properties**
```javascript
Test: Changing X doesn't affect Y or color
Initial: [{ x: 100, y: 200, color: '#ff0000' }]
Action: batchUpdateShapes([shapeId], 'x', 500)
Expected: { x: 500, y: 200, color: '#ff0000' } // Y and color unchanged
Priority: P1
```

#### **TC-2.8: Batch Update with Invalid Value**
```javascript
Test: Handle invalid numeric input
Initial: [{ x: 100 }]
Action: batchUpdateShapes([shapeId], 'x', 'invalid')
Expected: Error handled gracefully, shapes unchanged
Priority: P1
```

#### **TC-2.9: Batch Update with Decimal Values**
```javascript
Test: Support decimal positions
Initial: [{ x: 100 }]
Action: batchUpdateShapes([shapeId], 'x', 123.45)
Expected: { x: 123 } // Rounded to integer
Priority: P2
```

#### **TC-2.10: Batch Update Updates Timestamp**
```javascript
Test: Verify updatedAt timestamp is set
Initial: [{ x: 100, updatedAt: oldTimestamp }]
Action: batchUpdateShapes([shapeId], 'x', 200)
Expected: updatedAt > oldTimestamp
Priority: P1
```

---

### **Category 3: Batch Appearance Updates** (8 tests)

#### **TC-3.1: Batch Update Color (All Same Type)**
```javascript
Test: Change color for 3 rectangles
Initial: [{ color: '#ff0000' }, { color: '#00ff00' }, { color: '#0000ff' }]
Action: batchUpdateShapes(shapeIds, 'color', '#ffff00')
Expected: All shapes have color: '#ffff00'
Priority: P0
```

#### **TC-3.2: Batch Update Color (Mixed Types)**
```javascript
Test: Change color for Rectangle + Circle + Text
Initial: [
  { type: 'rectangle', color: '#ff0000' },
  { type: 'circle', color: '#00ff00' },
  { type: 'text', color: '#0000ff' }
]
Action: batchUpdateShapes(shapeIds, 'color', '#000000')
Expected: All shapes have color: '#000000'
Priority: P0
```

#### **TC-3.3: Batch Update with Hex Color**
```javascript
Test: Support various color formats
Formats: ['#ff0000', '#f00', 'rgb(255, 0, 0)', 'red']
Expected: All valid formats accepted and normalized
Priority: P2
```

#### **TC-3.4: Batch Update with Invalid Color**
```javascript
Test: Handle invalid color input
Initial: [{ color: '#ff0000' }]
Action: batchUpdateShapes([shapeId], 'color', 'invalid-color')
Expected: Error handled, shape color unchanged
Priority: P1
```

#### **TC-3.5: Color Picker Mixed State Display**
```javascript
Test: Color picker shows mixed indicator
Shapes: [{ color: '#ff0000' }, { color: '#00ff00' }]
Expected: Color picker displays multi-color swatch
Priority: P1
```

#### **TC-3.6: Color Picker Updates After Batch Change**
```javascript
Test: Color picker updates from "Mixed" to solid color
Initial: [{ color: '#ff0000' }, { color: '#00ff00' }] // Mixed
Action: Change to '#0000ff'
Expected: Color picker shows solid blue swatch
Priority: P1
```

#### **TC-3.7: Opacity Batch Update (Future)**
```javascript
Test: Batch update opacity (if implemented)
Initial: [{ opacity: 1 }, { opacity: 0.5 }]
Action: batchUpdateShapes(shapeIds, 'opacity', 0.7)
Expected: All shapes have opacity: 0.7
Priority: P3 (future feature)
```

#### **TC-3.8: Recent Colors Track Batch Updates**
```javascript
Test: Recent colors list updates after batch color change
Action: Change 5 shapes to '#ff00ff'
Expected: '#ff00ff' appears in recent colors list
Priority: P2
```

---

### **Category 4: Batch Typography Updates** (10 tests)

#### **TC-4.1: Batch Update Font Size (Text Only)**
```javascript
Test: Change font size for 3 text shapes
Initial: [
  { type: 'text', fontSize: 12 },
  { type: 'text', fontSize: 16 },
  { type: 'text', fontSize: 24 }
]
Action: batchUpdateShapes(textShapeIds, 'fontSize', 20)
Expected: All text shapes have fontSize: 20
Priority: P0
```

#### **TC-4.2: Batch Update Font Size (Mixed Types)**
```javascript
Test: Font size only applies to text shapes
Shapes: [
  { type: 'text', fontSize: 12 },
  { type: 'rectangle', color: '#ff0000' }
]
Action: Select both, change font size to 20
Expected: Only text shape updated, rectangle unchanged
Priority: P0
```

#### **TC-4.3: Batch Toggle Bold**
```javascript
Test: Toggle bold for multiple text shapes
Initial: [{ fontWeight: 'normal' }, { fontWeight: 'normal' }]
Action: Click bold button
Expected: All have fontWeight: 'bold'
Action: Click again
Expected: All have fontWeight: 'normal'
Priority: P1
```

#### **TC-4.4: Batch Toggle Bold (Mixed State)**
```javascript
Test: Toggle bold when some are already bold
Initial: [{ fontWeight: 'normal' }, { fontWeight: 'bold' }]
Action: Click bold button
Expected: All have fontWeight: 'bold' (all become bold)
Priority: P1
```

#### **TC-4.5: Batch Toggle Italic**
```javascript
Test: Toggle italic for multiple text shapes
Initial: [{ fontStyle: 'normal' }, { fontStyle: 'normal' }]
Action: Click italic button
Expected: All have fontStyle: 'italic'
Priority: P1
```

#### **TC-4.6: Batch Toggle Underline**
```javascript
Test: Toggle underline for multiple text shapes
Initial: [{ textDecoration: 'none' }, { textDecoration: 'none' }]
Action: Click underline button
Expected: All have textDecoration: 'underline'
Priority: P2
```

#### **TC-4.7: Batch Align Left**
```javascript
Test: Align multiple text shapes left
Initial: [{ align: 'center' }, { align: 'right' }]
Action: Click align left button
Expected: All have align: 'left'
Priority: P1
```

#### **TC-4.8: Batch Align Center**
```javascript
Test: Align multiple text shapes center
Initial: [{ align: 'left' }, { align: 'right' }]
Action: Click align center button
Expected: All have align: 'center'
Priority: P1
```

#### **TC-4.9: Batch Align Right**
```javascript
Test: Align multiple text shapes right
Initial: [{ align: 'left' }, { align: 'center' }]
Action: Click align right button
Expected: All have align: 'right'
Priority: P1
```

#### **TC-4.10: Typography Section Hidden for Non-Text**
```javascript
Test: Typography section only shows if text selected
Shapes: [{ type: 'rectangle' }, { type: 'circle' }]
Expected: Typography section not rendered
Priority: P1
```

---

### **Category 5: UI Component Behavior** (12 tests)

#### **TC-5.1: Number Input Shows "Mixed" Placeholder**
```javascript
Test: Input displays "Mixed" when values differ
Shapes: [{ x: 100 }, { x: 200 }]
Expected: X input shows placeholder "Mixed"
Priority: P0
```

#### **TC-5.2: Number Input Shows Value When Same**
```javascript
Test: Input displays common value
Shapes: [{ x: 100 }, { x: 100 }]
Expected: X input shows value "100"
Priority: P0
```

#### **TC-5.3: Number Input Clears "Mixed" on Type**
```javascript
Test: Typing in mixed input clears placeholder
Initial: X shows "Mixed"
Action: Click input, type "50"
Expected: Input shows "50", applies to all shapes on blur
Priority: P1
```

#### **TC-5.4: Number Input Loses Focus Handled**
```javascript
Test: Batch update doesn't cause input blur
Action: Select 3 shapes, click X input, type "500"
Expected: Input remains focused, can complete typing
Priority: P1 (Bug #7)
```

#### **TC-5.5: Color Picker Shows Mixed Indicator**
```javascript
Test: Color picker displays multi-color swatch
Shapes: [{ color: '#ff0000' }, { color: '#00ff00' }]
Expected: Swatch shows gradient or striped pattern
Priority: P1
```

#### **TC-5.6: Color Picker Opens Modal**
```javascript
Test: Clicking color swatch opens picker modal
Action: Click color swatch
Expected: Color picker modal appears
Priority: P1
```

#### **TC-5.7: Color Picker Closes on Outside Click**
```javascript
Test: Clicking outside closes picker
Action: Open color picker, click elsewhere
Expected: Picker closes
Priority: P2
```

#### **TC-5.8: Color Picker Positioned Correctly**
```javascript
Test: Picker doesn't open off-screen
Action: Open picker near bottom of Properties Panel
Expected: Picker opens above button if no space below
Priority: P2 (Bug #12)
```

#### **TC-5.9: Format Buttons Show Active State**
```javascript
Test: Bold button shows active when all shapes are bold
Shapes: [{ fontWeight: 'bold' }, { fontWeight: 'bold' }]
Expected: Bold button has 'active' class
Priority: P1
```

#### **TC-5.10: Format Buttons Show Mixed State**
```javascript
Test: Bold button shows mixed when some are bold
Shapes: [{ fontWeight: 'normal' }, { fontWeight: 'bold' }]
Expected: Bold button has 'mixed' class (semi-opaque)
Priority: P1
```

#### **TC-5.11: Multi-Select Header Shows Count**
```javascript
Test: Header displays correct shape count
Shapes: Select 5 shapes
Expected: "5 shapes selected"
Priority: P1
```

#### **TC-5.12: Section Headers Show Shape Type Counts**
```javascript
Test: Typography section shows text shape count
Shapes: [{ type: 'text' }, { type: 'text' }, { type: 'rectangle' }]
Expected: "Typography (2 text shapes)"
Priority: P2
```

---

### **Category 6: Performance Tests** (8 tests)

#### **TC-6.1: Batch Update 10 Shapes in <1 Second**
```javascript
Test: Measure batch update performance
Shapes: 10 shapes
Action: Change X position
Expected: Update completes in <1000ms
Priority: P0
```

#### **TC-6.2: Batch Update 50 Shapes in <3 Seconds**
```javascript
Test: Measure performance with large selection
Shapes: 50 shapes
Action: Change color
Expected: Update completes in <3000ms
Priority: P1
```

#### **TC-6.3: Batch Update 100 Shapes with Chunking**
```javascript
Test: Large batches use chunked processing
Shapes: 100 shapes
Action: Change Y position
Expected: Updates processed in chunks of 25, progress indicator shown
Priority: P2
```

#### **TC-6.4: Mixed Value Detection for 100 Shapes**
```javascript
Test: Measure detectMixedValue performance
Shapes: 100 shapes with different X values
Action: Select all
Expected: Mixed detection completes in <100ms
Priority: P1
```

#### **TC-6.5: No Memory Leaks on Repeated Batch Updates**
```javascript
Test: Repeated batch operations don't leak memory
Action: 50 batch updates in succession
Expected: Memory usage remains stable
Priority: P2
```

#### **TC-6.6: Debounced Input Reduces Firestore Writes**
```javascript
Test: Typing in input doesn't trigger write for every keystroke
Action: Type "12345" quickly in X input
Expected: Only 1-2 Firestore writes (debounced)
Priority: P1
```

#### **TC-6.7: UI Remains Responsive During Batch Update**
```javascript
Test: Canvas doesn't freeze during batch operation
Action: Batch update 50 shapes, try to pan canvas
Expected: Canvas remains interactive
Priority: P2
```

#### **TC-6.8: Batch Update Doesn't Block Other Users**
```javascript
Test: One user's batch update doesn't block others
Setup: User A selects 50 shapes, starts batch color change
Action: User B creates new shape
Expected: User B's action completes immediately
Priority: P2
```

---

### **Category 7: Undo/Redo Integration** (8 tests)

#### **TC-7.1: Undo Batch Position Update**
```javascript
Test: Undo reverts all shapes in one operation
Initial: [{ x: 100 }, { x: 200 }, { x: 300 }]
Action: Batch update X to 500
Action: Press Undo
Expected: All shapes revert to original X values (100, 200, 300)
Priority: P0 (Bug #4)
```

#### **TC-7.2: Redo Batch Position Update**
```javascript
Test: Redo re-applies batch update
Action: Undo from TC-7.1
Action: Press Redo
Expected: All shapes have X: 500 again
Priority: P0
```

#### **TC-7.3: Undo Batch Color Update**
```javascript
Test: Undo reverts color change
Initial: [{ color: '#ff0000' }, { color: '#00ff00' }]
Action: Batch update to '#0000ff'
Action: Press Undo
Expected: Colors revert to original (red, green)
Priority: P0
```

#### **TC-7.4: Undo Batch Typography Update**
```javascript
Test: Undo reverts font size change
Initial: [{ fontSize: 12 }, { fontSize: 16 }]
Action: Batch update to 20
Action: Press Undo
Expected: Font sizes revert to original (12, 16)
Priority: P1
```

#### **TC-7.5: Multiple Undo for Sequential Batch Updates**
```javascript
Test: Undo chain of batch operations
Action 1: Batch update X to 100
Action 2: Batch update Y to 200
Action 3: Batch update color to red
Action: Press Undo 3 times
Expected: All changes reverted in reverse order
Priority: P1
```

#### **TC-7.6: Undo/Redo Keyboard Shortcuts Work**
```javascript
Test: Cmd+Z and Cmd+Shift+Z work for batch operations
Action: Batch update, press Cmd+Z
Expected: Batch update undone
Action: Press Cmd+Shift+Z
Expected: Batch update redone
Priority: P1
```

#### **TC-7.7: History Shows Batch Operation Description**
```javascript
Test: History entry describes batch operation
Action: Batch update 5 shapes' color
Expected: History shows "Modified color for 5 shapes"
Priority: P2
```

#### **TC-7.8: Undo Handles Deleted Shapes Gracefully**
```javascript
Test: Undo batch update after some shapes deleted
Initial: [{ id: '1' }, { id: '2' }, { id: '3' }]
Action: Batch update color
Action: Delete shape '2'
Action: Press Undo
Expected: Shapes '1' and '3' revert, no error for deleted '2'
Priority: P1
```

---

### **Category 8: Real-Time Synchronization** (8 tests)

#### **TC-8.1: User A's Batch Update Syncs to User B**
```javascript
Test: Multi-user batch updates sync correctly
Setup: User A and User B view same canvas
Action: User A batch updates 5 shapes' color to red
Expected: User B sees all 5 shapes turn red
Priority: P0
```

#### **TC-8.2: User B Sees Smooth Transition (No Flickering)**
```javascript
Test: Batch updates don't cause flickering for remote users
Setup: User A batch updates 10 shapes
Expected: User B sees smooth color transition, not individual flickers
Priority: P1 (Bug #11)
```

#### **TC-8.3: Concurrent Batch Updates Don't Conflict**
```javascript
Test: Two users batch-updating different properties
Setup: User A changes X position, User B changes color (same shapes)
Expected: Both updates apply, no conflicts
Priority: P1
```

#### **TC-8.4: Batch Update Timestamp Syncs Correctly**
```javascript
Test: updatedAt timestamp consistent across users
Action: User A batch updates
Expected: User B sees same updatedAt timestamp
Priority: P2
```

#### **TC-8.5: User B Can Undo User A's Batch Update**
```javascript
Test: Undo works across users
Setup: User A batch updates color
Action: User B presses Undo
Expected: User A's batch update is undone for both users
Priority: P2 (depends on shared undo implementation)
```

#### **TC-8.6: Network Failure During Batch Update**
```javascript
Test: Batch update fails gracefully on network error
Action: User A starts batch update, network drops
Expected: Optimistic update shows, then rolls back with error message
Priority: P1 (Bug #8)
```

#### **TC-8.7: Batch Update Doesn't Overwrite Other User's Edit**
```javascript
Test: Last-write-wins with batch operations
Setup: User A batch updates shape X, User B manually edits same shape Y
Expected: Final state has both X and Y updates
Priority: P1
```

#### **TC-8.8: Batch Metadata Visible in Network Tab**
```javascript
Test: Firestore writes include batch metadata
Action: Batch update 5 shapes
Expected: Network tab shows batchId in each Firestore write
Priority: P2
```

---

### **Category 9: Edge Cases** (6 tests)

#### **TC-9.1: Batch Update Single Shape**
```javascript
Test: Batch operations work with single shape
Shapes: [{ x: 100 }]
Action: Change X to 200 via Properties Panel
Expected: Shape updates to x: 200
Priority: P1
```

#### **TC-9.2: Select All Shapes (Large Selection)**
```javascript
Test: Select all shapes on canvas (100+)
Action: Cmd+A (select all), change color
Expected: All shapes update without error
Priority: P2
```

#### **TC-9.3: Mixed Shape Types with Incompatible Properties**
```javascript
Test: Circle + Text selected (circle has no fontSize)
Action: Change font size
Expected: Only text shape updated, circle unchanged
Priority: P1
```

#### **TC-9.4: Rapid Property Changes (Stress Test)**
```javascript
Test: Change property 10 times rapidly
Action: Click X input, enter 100, 200, 300, ... 1000 quickly
Expected: Only final value (1000) applies due to debouncing
Priority: P2
```

#### **TC-9.5: Empty Multi-Select State**
```javascript
Test: Deselect all shapes while in multi-select mode
Action: Select 3 shapes, then Escape to deselect
Expected: Properties Panel shows "No Selection" state
Priority: P1
```

#### **TC-9.6: Multi-Select with Locked Shapes**
```javascript
Test: Batch update skips locked shapes (if implemented)
Shapes: [{ locked: false }, { locked: true }]
Action: Batch update color
Expected: Only unlocked shape updates
Priority: P3 (future feature)
```

---

## 📊 **Test Priority Breakdown**

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 24 | Critical - Must pass before merge |
| **P1** | 38 | High - Should pass before merge |
| **P2** | 18 | Medium - Nice to have |
| **P3** | 5 | Low - Future features |

**Total**: 85 test cases

---

## 🛠️ **Testing Tools**

### **Unit Tests**
```bash
# Run Jest tests for utility functions
npm run test:unit

# Test files:
# - src/components/Properties/utils/mixedValues.test.js
# - src/components/Properties/utils/batchUpdate.test.js
```

### **Component Tests**
```bash
# Run React Testing Library tests
npm run test:components

# Test files:
# - src/components/Properties/MultiSelectPositionSize.test.jsx
# - src/components/Properties/MultiSelectAppearance.test.jsx
# - src/components/Properties/MultiSelectTypography.test.jsx
```

### **Integration Tests**
```bash
# Run Playwright/Cypress end-to-end tests
npm run test:e2e

# Test scenarios:
# - Complete multi-select workflow
# - Batch updates with undo/redo
# - Real-time multi-user sync
```

### **Performance Tests**
```bash
# Run performance benchmarks
npm run test:perf

# Measures:
# - Batch update latency (10, 50, 100 shapes)
# - Mixed value detection speed
# - Memory usage during batch operations
```

---

## ✅ **Acceptance Criteria**

Before merging PR #26:

### **Functional**
- [ ] All P0 tests pass (24/24)
- [ ] 90%+ of P1 tests pass (34+/38)
- [ ] No critical bugs in production

### **Performance**
- [ ] Batch update 10 shapes: <1 second ✅
- [ ] Batch update 50 shapes: <3 seconds ✅
- [ ] Mixed value detection: <100ms for 100 shapes ✅

### **User Experience**
- [ ] "Mixed" state clearly visible
- [ ] Batch updates feel instant (<100ms perceived)
- [ ] No input focus loss during typing
- [ ] No flickering for remote users

### **Code Quality**
- [ ] 80%+ test coverage
- [ ] All components have prop validation
- [ ] No console errors or warnings
- [ ] Passes linter checks

---

## 🧪 **Manual Testing Checklist**

### **Multi-Select Editing Flow**
1. [ ] Create 5 shapes with different colors
2. [ ] Select all 5 (Shift+Click or Marquee)
3. [ ] Properties Panel shows "5 shapes selected"
4. [ ] Position section shows "Mixed" for X, Y, W, H
5. [ ] Change X to 500 → All shapes move to x: 500
6. [ ] Change color to blue → All shapes turn blue
7. [ ] Press Undo → All shapes revert
8. [ ] Press Redo → All shapes turn blue again

### **Typography Multi-Select**
1. [ ] Create 3 text shapes with different font sizes
2. [ ] Select all 3
3. [ ] Typography section shows "Mixed" for font size
4. [ ] Change font size to 24 → All text updates
5. [ ] Click Bold → All text becomes bold
6. [ ] Click Align Center → All text centers

### **Mixed Shape Types**
1. [ ] Select 2 rectangles + 1 circle + 1 text
2. [ ] Position/Size section visible
3. [ ] Appearance section visible
4. [ ] Typography section visible (only affects text)
5. [ ] Alignment tools visible
6. [ ] Layer controls visible

### **Performance**
1. [ ] Create 50 shapes (use AI command)
2. [ ] Select all (Cmd+A)
3. [ ] Change color → Should complete in <3 seconds
4. [ ] Canvas remains responsive during update

### **Real-Time Sync**
1. [ ] Open canvas in 2 browser windows (User A & B)
2. [ ] User A: Select 5 shapes, change color to red
3. [ ] User B: Should see all 5 turn red smoothly
4. [ ] User B: Change same shapes to blue
5. [ ] User A: Should see color update

---

## 📚 **Test Documentation**

Each test should include:
- **Test ID**: TC-X.Y format
- **Description**: Clear explanation
- **Priority**: P0-P3
- **Setup**: Initial state
- **Action**: Steps to perform
- **Expected**: Expected outcome
- **Actual**: Actual outcome (during testing)
- **Status**: Pass/Fail

**Example Test Report**:
```
TC-2.1: Batch Update X Position
Priority: P0
Status: ✅ PASS
Duration: 450ms
Notes: All 3 shapes updated correctly, Firestore batch write worked
```

---

## 🎯 **Success Metrics**

### **Coverage Targets**
- Unit tests: 95%+ coverage
- Component tests: 85%+ coverage
- Integration tests: 70%+ coverage
- Overall: 80%+ coverage

### **Quality Targets**
- 0 critical bugs (P0)
- <3 major bugs (P1)
- <10 minor bugs (P2)

### **Performance Targets**
- Batch update 10 shapes: <1s
- Batch update 50 shapes: <3s
- Mixed detection: <100ms
- Zero UI blocking

---

**Document Version**: 1.0  
**Last Updated**: October 19, 2025  
**Next Review**: During PR #26 implementation

