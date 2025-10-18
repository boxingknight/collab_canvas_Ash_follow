# PR #24: Testing Guide - Copy/Paste & Undo/Redo

**Date**: 2025-10-18
**Features**: Copy/Paste, Undo/Redo
**Total Test Cases**: 60+

---

## 🎯 TESTING OBJECTIVES

1. **Functionality**: All operations work as expected
2. **Edge Cases**: Boundary conditions handled gracefully
3. **Performance**: Operations complete in <100ms
4. **Collaboration**: Multi-user scenarios work correctly
5. **User Experience**: Intuitive behavior, good feedback

---

## ✅ TEST MATRIX

| Feature | Unit Tests | Integration Tests | Manual Tests | Total |
|---------|-----------|-------------------|--------------|-------|
| Copy/Paste | 12 | 10 | 8 | 30 |
| Undo/Redo | 15 | 12 | 10 | 37 |
| **Total** | **27** | **22** | **18** | **67** |

---

## 📋 COPY/PASTE TEST CASES

### Unit Tests (12)

#### CP-U-01: Copy Single Shape
**Description**: Copy a single rectangle to clipboard
```javascript
test('copy single shape stores in clipboard', () => {
  const shape = { id: '1', type: 'rectangle', x: 100, y: 100 }
  const { copy, hasClipboard } = useClipboard()
  
  copy([shape])
  
  expect(hasClipboard()).toBe(true)
  expect(clipboard.length).toBe(1)
  expect(clipboard[0].type).toBe('rectangle')
})
```
**Expected**: Clipboard has 1 shape ✅

---

#### CP-U-02: Copy Multiple Shapes
**Description**: Copy 5 shapes to clipboard
```javascript
test('copy multiple shapes stores all shapes', () => {
  const shapes = [
    { id: '1', type: 'rectangle' },
    { id: '2', type: 'circle' },
    { id: '3', type: 'text' }
  ]
  const { copy } = useClipboard()
  
  copy(shapes)
  
  expect(clipboard.length).toBe(3)
})
```
**Expected**: Clipboard has 3 shapes ✅

---

#### CP-U-03: Copy with Empty Selection
**Description**: Attempt to copy with no shapes selected
```javascript
test('copy empty selection does not modify clipboard', () => {
  const { copy } = useClipboard()
  const before = clipboard.length
  
  copy([])
  
  expect(clipboard.length).toBe(before)
})
```
**Expected**: Clipboard unchanged ✅

---

#### CP-U-04: Copy Replaces Previous Clipboard
**Description**: Second copy replaces first copy
```javascript
test('second copy replaces clipboard content', () => {
  const { copy } = useClipboard()
  
  copy([{ id: '1', type: 'rectangle' }])
  expect(clipboard[0].type).toBe('rectangle')
  
  copy([{ id: '2', type: 'circle' }])
  expect(clipboard[0].type).toBe('circle')
  expect(clipboard.length).toBe(1)
})
```
**Expected**: Clipboard has only second shape ✅

---

#### CP-U-05: Paste from Empty Clipboard
**Description**: Attempt to paste with empty clipboard
```javascript
test('paste from empty clipboard returns empty array', () => {
  const { paste } = useClipboard()
  clipboard.current = []
  
  const result = paste()
  
  expect(result).toEqual([])
})
```
**Expected**: No shapes created ✅

---

#### CP-U-06: Paste Creates New IDs
**Description**: Pasted shapes have new IDs
```javascript
test('paste generates new IDs for shapes', () => {
  const { copy, paste } = useClipboard()
  const original = { id: 'original-1', type: 'rectangle' }
  
  copy([original])
  const pasted = paste()
  
  expect(pasted[0].id).not.toBe('original-1')
  expect(pasted[0].type).toBe('rectangle')
})
```
**Expected**: New ID, same properties ✅

---

#### CP-U-07: Paste Applies Offset
**Description**: Pasted shapes offset by 20px
```javascript
test('paste offsets position by 20px', () => {
  const { copy, paste } = useClipboard()
  copy([{ id: '1', x: 100, y: 200 }])
  
  const pasted = paste()
  
  expect(pasted[0].x).toBe(120)
  expect(pasted[0].y).toBe(220)
})
```
**Expected**: Position increased by 20 ✅

---

#### CP-U-08: Paste Multiple Times
**Description**: Paste 3 times from same copy
```javascript
test('paste multiple times creates multiple shapes', () => {
  const { copy, paste } = useClipboard()
  copy([{ id: '1', type: 'rectangle' }])
  
  const paste1 = paste()
  const paste2 = paste()
  const paste3 = paste()
  
  expect(paste1.length + paste2.length + paste3.length).toBe(3)
})
```
**Expected**: 3 shapes created ✅

---

#### CP-U-09: Copy Preserves All Properties
**Description**: All shape properties preserved in clipboard
```javascript
test('copy preserves all shape properties', () => {
  const shape = {
    id: '1',
    type: 'text',
    text: 'Hello',
    fontSize: 48,
    fontFamily: 'Georgia',
    color: '#FF0000',
    rotation: 45
  }
  const { copy } = useClipboard()
  
  copy([shape])
  
  expect(clipboard[0].text).toBe('Hello')
  expect(clipboard[0].fontSize).toBe(48)
  expect(clipboard[0].fontFamily).toBe('Georgia')
  expect(clipboard[0].color).toBe('#FF0000')
  expect(clipboard[0].rotation).toBe(45)
})
```
**Expected**: All properties preserved ✅

---

#### CP-U-10: Paste Clamps to Boundary
**Description**: Paste near edge clamps to canvas
```javascript
test('paste near boundary clamps to canvas', () => {
  const { copy, paste } = useClipboard()
  copy([{ id: '1', x: CANVAS_WIDTH - 10, y: 100, width: 100 }])
  
  const pasted = paste()
  
  expect(pasted[0].x).toBeLessThanOrEqual(CANVAS_WIDTH - 100)
})
```
**Expected**: Position clamped ✅

---

#### CP-U-11: Copy Multi-Select Preserves Relative Positions
**Description**: Multiple shapes maintain relative positions
```javascript
test('paste multi-select preserves relative positions', () => {
  const shapes = [
    { id: '1', x: 100, y: 100 },
    { id: '2', x: 200, y: 100 }  // 100px to the right
  ]
  const { copy, paste } = useClipboard()
  
  copy(shapes)
  const pasted = paste()
  
  const distance = pasted[1].x - pasted[0].x
  expect(distance).toBe(100)  // Relative position maintained
})
```
**Expected**: 100px apart ✅

---

#### CP-U-12: Clipboard Size Limit
**Description**: Clipboard limits to 10 shapes
```javascript
test('clipboard limits to 10 shapes', () => {
  const shapes = Array.from({ length: 20 }, (_, i) => ({ id: `${i}` }))
  const { copy } = useClipboard()
  
  copy(shapes)
  
  expect(clipboard.length).toBe(10)
})
```
**Expected**: Only 10 shapes in clipboard ✅

---

### Integration Tests (10)

#### CP-I-01: Copy and Paste Creates Shapes on Canvas
**Description**: End-to-end copy/paste flow
```javascript
test('copy and paste workflow', async () => {
  // Setup
  const shape = await createShape({ type: 'rectangle', x: 100, y: 100 })
  selectShape(shape.id)
  
  // Copy
  await copySelectedShapes()
  
  // Paste
  await pasteShapes()
  
  // Verify
  const allShapes = await getShapes()
  expect(allShapes.length).toBe(2)
})
```
**Expected**: 2 shapes on canvas ✅

---

#### CP-I-02: Paste Syncs to Firebase
**Description**: Pasted shapes appear in Firebase
```javascript
test('paste syncs to Firebase', async () => {
  copy([{ id: '1', type: 'rectangle' }])
  
  await paste()
  
  const firebaseShapes = await getShapesFromFirebase()
  expect(firebaseShapes.length).toBe(1)
})
```
**Expected**: Shape in Firebase ✅

---

#### CP-I-03: Paste Selects New Shapes
**Description**: After paste, new shapes are selected
```javascript
test('paste selects newly created shapes', async () => {
  copy([{ id: '1', type: 'rectangle' }])
  
  await paste()
  
  expect(selectedShapes.length).toBe(1)
  expect(selectedShapes[0].id).not.toBe('1')  // New ID
})
```
**Expected**: New shape selected ✅

---

#### CP-I-04: Copy After Move Preserves New Position
**Description**: Copy after moving shape uses current position
```javascript
test('copy uses current position, not original', async () => {
  const shape = await createShape({ x: 100, y: 100 })
  
  // Move shape
  await updateShape(shape.id, { x: 200, y: 200 })
  
  // Copy
  copy([await getShape(shape.id)])
  
  // Paste
  const pasted = paste()
  
  expect(pasted[0].x).toBe(220)  // 200 + 20 offset
})
```
**Expected**: Uses updated position ✅

---

#### CP-I-05: Multi-User Paste Sync
**Description**: User A pastes, User B sees new shapes
```javascript
test('paste syncs to other users', async () => {
  // User A
  await userA.copy([{ id: '1', type: 'rectangle' }])
  await userA.paste()
  
  // Wait for sync
  await wait(100)
  
  // User B
  const userBShapes = await userB.getShapes()
  expect(userBShapes.length).toBe(1)
})
```
**Expected**: User B sees pasted shape ✅

---

#### CP-I-06: Paste All Shape Types
**Description**: Copy/paste works for all shape types
```javascript
test('paste works for all shape types', async () => {
  const shapes = [
    { type: 'rectangle' },
    { type: 'circle' },
    { type: 'line' },
    { type: 'text', text: 'Hello' }
  ]
  
  for (const shape of shapes) {
    copy([shape])
    const pasted = paste()
    expect(pasted[0].type).toBe(shape.type)
  }
})
```
**Expected**: All types paste correctly ✅

---

#### CP-I-07: Copy/Paste with Rotation
**Description**: Rotated shapes paste with same rotation
```javascript
test('paste preserves rotation', async () => {
  const shape = { id: '1', rotation: 45 }
  copy([shape])
  
  const pasted = paste()
  
  expect(pasted[0].rotation).toBe(45)
})
```
**Expected**: Rotation preserved ✅

---

#### CP-I-08: Copy/Paste Text Shape
**Description**: Text shapes paste with full formatting
```javascript
test('paste text shape preserves formatting', async () => {
  const text = {
    type: 'text',
    text: 'Hello World',
    fontSize: 48,
    fontFamily: 'Georgia',
    align: 'center'
  }
  copy([text])
  
  const pasted = paste()
  
  expect(pasted[0].text).toBe('Hello World')
  expect(pasted[0].fontSize).toBe(48)
  expect(pasted[0].align).toBe('center')
})
```
**Expected**: All text properties preserved ✅

---

#### CP-I-09: Copy/Paste Near Canvas Boundary
**Description**: Paste near edge doesn't go offscreen
```javascript
test('paste near boundary stays visible', async () => {
  const shape = { 
    id: '1', 
    x: CANVAS_WIDTH - 50, 
    y: CANVAS_HEIGHT - 50,
    width: 100,
    height: 100
  }
  copy([shape])
  
  const pasted = paste()
  
  expect(pasted[0].x).toBeLessThanOrEqual(CANVAS_WIDTH - 100)
  expect(pasted[0].y).toBeLessThanOrEqual(CANVAS_HEIGHT - 100)
})
```
**Expected**: Shape clamped to visible area ✅

---

#### CP-I-10: Copy/Paste Incremental Offset
**Description**: Multiple pastes create cascade effect
```javascript
test('multiple pastes increment offset', async () => {
  copy([{ id: '1', x: 100, y: 100 }])
  
  const paste1 = paste()
  const paste2 = paste()
  const paste3 = paste()
  
  expect(paste1[0].x).toBe(120)  // +20
  expect(paste2[0].x).toBe(140)  // +40
  expect(paste3[0].x).toBe(160)  // +60
})
```
**Expected**: Incremental offset ✅

---

### Manual Tests (8)

#### CP-M-01: Keyboard Shortcut Cmd+C
**Steps**:
1. Select a rectangle
2. Press Cmd+C (Mac) or Ctrl+C (Windows)
3. Check console or feedback message
**Expected**: "Copied 1 shape" message ✅

---

#### CP-M-02: Keyboard Shortcut Cmd+V
**Steps**:
1. Copy a shape (Cmd+C)
2. Press Cmd+V
3. Observe canvas
**Expected**: New shape appears 20px offset ✅

---

#### CP-M-03: Multi-Select Copy
**Steps**:
1. Select 3 shapes (Shift+Click)
2. Cmd+C
3. Cmd+V
**Expected**: All 3 shapes pasted together ✅

---

#### CP-M-04: Paste 5 Times
**Steps**:
1. Copy 1 shape
2. Paste 5 times (Cmd+V × 5)
**Expected**: 5 shapes cascade diagonally ✅

---

#### CP-M-05: Copy/Paste Across Browser Tabs
**Steps**:
1. Open canvas in Tab A
2. Copy shape in Tab A
3. Switch to Tab B (same canvas)
4. Paste in Tab B
**Expected**: Clipboard works (same session) ✅

---

#### CP-M-06: Copy/Paste with AI Shapes
**Steps**:
1. AI creates login form (9 shapes)
2. Select all shapes
3. Copy and paste
**Expected**: Entire form duplicated ✅

---

#### CP-M-07: Empty Clipboard Paste
**Steps**:
1. Fresh page load
2. Press Cmd+V (no copy)
**Expected**: "Clipboard is empty" message ✅

---

#### CP-M-08: Copy Large Shape Near Boundary
**Steps**:
1. Create 400×400 rectangle at (3700, 2700)
2. Copy and paste
**Expected**: Pasted shape clamped to canvas ✅

---

## 🔄 UNDO/REDO TEST CASES

### Unit Tests (15)

#### UR-U-01: Record Create Operation
**Description**: Create shape records in history
```javascript
test('create shape records operation', () => {
  const { recordOperation, historySize } = useHistory()
  const before = historySize
  
  recordOperation({
    type: 'create',
    after: { id: '1', type: 'rectangle' }
  })
  
  expect(historySize).toBe(before + 1)
})
```
**Expected**: History size increases ✅

---

#### UR-U-02: Undo Create Deletes Shape
**Description**: Undo create removes shape
```javascript
test('undo create operation deletes shape', async () => {
  const shape = await createShape({ type: 'rectangle' })
  // Operation recorded automatically
  
  await undo()
  
  const shapes = await getShapes()
  expect(shapes.find(s => s.id === shape.id)).toBeUndefined()
})
```
**Expected**: Shape deleted ✅

---

#### UR-U-03: Redo Create Restores Shape
**Description**: Redo after undo create recreates shape
```javascript
test('redo create operation restores shape', async () => {
  const shape = await createShape({ type: 'rectangle' })
  await undo()  // Delete
  
  await redo()  // Recreate
  
  const shapes = await getShapes()
  expect(shapes.find(s => s.id === shape.id)).toBeDefined()
})
```
**Expected**: Shape recreated ✅

---

#### UR-U-04: Undo with Empty History
**Description**: Undo with no operations is no-op
```javascript
test('undo with empty history returns false', async () => {
  const { undo, canUndo } = useHistory()
  
  expect(canUndo).toBe(false)
  const result = await undo()
  expect(result).toBe(false)
})
```
**Expected**: No action, returns false ✅

---

#### UR-U-05: Redo with Empty Future
**Description**: Redo with no undone operations is no-op
```javascript
test('redo with empty future returns false', async () => {
  const { redo, canRedo } = useHistory()
  
  expect(canRedo).toBe(false)
  const result = await redo()
  expect(result).toBe(false)
})
```
**Expected**: No action, returns false ✅

---

#### UR-U-06: New Operation Clears Future
**Description**: After undo, new operation clears redo stack
```javascript
test('new operation clears future stack', async () => {
  await createShape({ type: 'rectangle' })
  await undo()
  expect(canRedo).toBe(true)
  
  await createShape({ type: 'circle' })  // New operation
  
  expect(canRedo).toBe(false)
})
```
**Expected**: Can't redo after new operation ✅

---

#### UR-U-07: History Size Limit
**Description**: History limited to 50 operations
```javascript
test('history limits to 50 operations', async () => {
  const { recordOperation, historySize } = useHistory()
  
  for (let i = 0; i < 100; i++) {
    recordOperation({ type: 'create', after: { id: `${i}` } })
  }
  
  expect(historySize).toBe(50)
})
```
**Expected**: Only 50 operations stored ✅

---

#### UR-U-08: Undo Delete Recreates Shape
**Description**: Undo delete restores shape
```javascript
test('undo delete operation recreates shape', async () => {
  const shape = await createShape({ type: 'rectangle' })
  await deleteShape(shape.id)
  
  await undo()  // Undo delete
  
  const shapes = await getShapes()
  expect(shapes.find(s => s.id === shape.id)).toBeDefined()
})
```
**Expected**: Shape restored ✅

---

#### UR-U-09: Undo Move Restores Position
**Description**: Undo move returns shape to original position
```javascript
test('undo move restores original position', async () => {
  const shape = await createShape({ x: 100, y: 100 })
  await updateShapePosition(shape.id, 200, 200)
  
  await undo()
  
  const updated = await getShape(shape.id)
  expect(updated.x).toBe(100)
  expect(updated.y).toBe(100)
})
```
**Expected**: Original position restored ✅

---

#### UR-U-10: Undo Modify Restores Property
**Description**: Undo color change restores original color
```javascript
test('undo modify restores original property', async () => {
  const shape = await createShape({ color: '#FF0000' })
  await updateShape(shape.id, { color: '#0000FF' })
  
  await undo()
  
  const updated = await getShape(shape.id)
  expect(updated.color).toBe('#FF0000')
})
```
**Expected**: Original color restored ✅

---

#### UR-U-11: Multiple Undos
**Description**: Multiple undo operations work sequentially
```javascript
test('multiple undos work in sequence', async () => {
  await createShape({ id: '1' })
  await createShape({ id: '2' })
  await createShape({ id: '3' })
  
  await undo()  // Remove #3
  await undo()  // Remove #2
  await undo()  // Remove #1
  
  const shapes = await getShapes()
  expect(shapes.length).toBe(0)
})
```
**Expected**: All shapes removed ✅

---

#### UR-U-12: Multiple Redos
**Description**: Multiple redo operations work sequentially
```javascript
test('multiple redos restore in order', async () => {
  await createShape({ id: '1' })
  await createShape({ id: '2' })
  await undo()
  await undo()
  
  await redo()  // Restore #1
  await redo()  // Restore #2
  
  const shapes = await getShapes()
  expect(shapes.length).toBe(2)
})
```
**Expected**: All shapes restored ✅

---

#### UR-U-13: Undo/Redo Cycle
**Description**: Undo then redo returns to same state
```javascript
test('undo then redo returns to original state', async () => {
  const original = await createShape({ x: 100, y: 100, color: '#FF0000' })
  await updateShape(original.id, { color: '#0000FF' })
  
  await undo()  // Back to red
  await redo()  // Forward to blue
  
  const final = await getShape(original.id)
  expect(final.color).toBe('#0000FF')
})
```
**Expected**: Final state matches before undo ✅

---

#### UR-U-14: Operation Memory Size
**Description**: Each operation uses minimal memory
```javascript
test('operation stores only changed properties', () => {
  const operation = createMoveOperation('shape-1', 
    { x: 100, y: 100 }, 
    { x: 200, y: 200 }
  )
  
  expect(operation.before).toEqual({ x: 100, y: 100 })
  expect(operation.after).toEqual({ x: 200, y: 200 })
  expect(operation.before).not.toHaveProperty('type')  // Full shape not stored
})
```
**Expected**: Only position stored, not full shape ✅

---

#### UR-U-15: canUndo and canRedo Flags
**Description**: Flags correctly reflect state
```javascript
test('canUndo and canRedo flags update correctly', async () => {
  const { canUndo, canRedo } = useHistory()
  
  expect(canUndo).toBe(false)
  expect(canRedo).toBe(false)
  
  await createShape({ id: '1' })
  expect(canUndo).toBe(true)
  
  await undo()
  expect(canUndo).toBe(false)
  expect(canRedo).toBe(true)
  
  await redo()
  expect(canUndo).toBe(true)
  expect(canRedo).toBe(false)
})
```
**Expected**: Flags match history state ✅

---

### Integration Tests (12)

#### UR-I-01: Undo Syncs to Firebase
**Description**: Undo operations sync to other users
```javascript
test('undo syncs to Firebase', async () => {
  const shape = await createShape({ type: 'rectangle' })
  await undo()
  
  const firebaseShapes = await getShapesFromFirebase()
  expect(firebaseShapes.find(s => s.id === shape.id)).toBeUndefined()
})
```
**Expected**: Shape removed from Firebase ✅

---

#### UR-I-02: Multi-User Undo
**Description**: User A undos, User B sees change
```javascript
test('undo syncs to other users', async () => {
  // User A creates shape
  const shape = await userA.createShape({ type: 'rectangle' })
  await wait(100)
  
  // User B sees it
  expect(await userB.getShapes()).toHaveLength(1)
  
  // User A undos
  await userA.undo()
  await wait(100)
  
  // User B sees deletion
  expect(await userB.getShapes()).toHaveLength(0)
})
```
**Expected**: User B sees undo result ✅

---

#### UR-I-03: Undo Create, Redo, Undo Again
**Description**: Full cycle works correctly
```javascript
test('undo-redo-undo cycle', async () => {
  const shape = await createShape({ type: 'rectangle' })
  
  await undo()  // Delete
  expect(await getShapes()).toHaveLength(0)
  
  await redo()  // Recreate
  expect(await getShapes()).toHaveLength(1)
  
  await undo()  // Delete again
  expect(await getShapes()).toHaveLength(0)
})
```
**Expected**: Consistent behavior across cycles ✅

---

#### UR-I-04: Undo Different Operation Types
**Description**: All operation types can be undone
```javascript
test('undo works for all operation types', async () => {
  // Create
  const shape = await createShape({ x: 100, y: 100, color: '#FF0000' })
  await undo()
  expect(await getShapes()).toHaveLength(0)
  
  await redo()
  
  // Move
  await updateShapePosition(shape.id, 200, 200)
  await undo()
  expect((await getShape(shape.id)).x).toBe(100)
  
  // Modify
  await updateShape(shape.id, { color: '#0000FF' })
  await undo()
  expect((await getShape(shape.id)).color).toBe('#FF0000')
  
  // Delete
  await deleteShape(shape.id)
  await undo()
  expect(await getShapes()).toHaveLength(1)
})
```
**Expected**: All operation types undo correctly ✅

---

#### UR-I-05: Undo After Paste
**Description**: Undo paste removes pasted shapes
```javascript
test('undo after paste removes pasted shapes', async () => {
  const shape = await createShape({ type: 'rectangle' })
  await copy([shape])
  await paste()
  
  await undo()  // Undo paste (which is a create)
  
  const shapes = await getShapes()
  expect(shapes.length).toBe(1)  // Only original
})
```
**Expected**: Pasted shape removed ✅

---

#### UR-I-06: Undo Doesn't Affect Other Users' History
**Description**: Each user has independent history
```javascript
test('user A undo does not affect user B history', async () => {
  await userA.createShape({ id: 'A1' })
  await userB.createShape({ id: 'B1' })
  
  await userA.undo()  // User A undos their shape
  
  // User A can't undo more
  expect(userA.canUndo).toBe(false)
  
  // User B can still undo
  expect(userB.canUndo).toBe(true)
  await userB.undo()
  expect(await getShapes()).toHaveLength(0)
})
```
**Expected**: Independent history stacks ✅

---

#### UR-I-07: Undo AI Complex Operation
**Description**: Undo AI-created login form (if batch implemented)
```javascript
test('undo AI batch operation removes all shapes', async () => {
  await createLoginForm({ x: 500, y: 500 })  // Creates 9 shapes
  
  await undo()  // Undo batch
  
  // All 9 shapes removed
  expect(await getShapes()).toHaveLength(0)
})
```
**Expected**: All shapes removed together ✅

---

#### UR-I-08: History Persists During Session
**Description**: History maintained during session
```javascript
test('history persists during session', async () => {
  await createShape({ id: '1' })
  await createShape({ id: '2' })
  
  // Simulate canvas remount (without page refresh)
  remountCanvas()
  
  expect(canUndo).toBe(true)
  await undo()
  expect(await getShapes()).toHaveLength(1)
})
```
**Expected**: History survives remount ✅

---

#### UR-I-09: Undo Shape Modified by Another User
**Description**: Gracefully handles conflicts
```javascript
test('undo handles concurrent modifications', async () => {
  const shape = await userA.createShape({ color: '#FF0000' })
  
  // User B modifies
  await userB.updateShape(shape.id, { color: '#0000FF' })
  
  // User A undos their creation
  await userA.undo()
  
  // Shape deleted (last operation wins)
  expect(await getShapes()).toHaveLength(0)
})
```
**Expected**: Handles conflict gracefully ✅

---

#### UR-I-10: Undo Performance with Large History
**Description**: Performance doesn't degrade with full history
```javascript
test('undo performance with 50 operations', async () => {
  for (let i = 0; i < 50; i++) {
    await createShape({ id: `${i}` })
  }
  
  const start = performance.now()
  await undo()
  const duration = performance.now() - start
  
  expect(duration).toBeLessThan(100)  // < 100ms
})
```
**Expected**: Undo completes in <100ms ✅

---

#### UR-I-11: Redo Performance
**Description**: Redo also performs well
```javascript
test('redo performance', async () => {
  await createShape({ id: '1' })
  await undo()
  
  const start = performance.now()
  await redo()
  const duration = performance.now() - start
  
  expect(duration).toBeLessThan(100)
})
```
**Expected**: Redo completes in <100ms ✅

---

#### UR-I-12: History Memory Usage
**Description**: History doesn't consume excessive memory
```javascript
test('history memory usage reasonable', async () => {
  const memBefore = performance.memory?.usedJSHeapSize || 0
  
  for (let i = 0; i < 50; i++) {
    await createShape({ id: `${i}`, text: 'Short text' })
  }
  
  const memAfter = performance.memory?.usedJSHeapSize || 0
  const memUsed = (memAfter - memBefore) / (1024 * 1024)  // MB
  
  expect(memUsed).toBeLessThan(5)  // < 5MB
})
```
**Expected**: Memory usage <5MB ✅

---

### Manual Tests (10)

#### UR-M-01: Keyboard Shortcut Cmd+Z
**Steps**:
1. Create a rectangle
2. Press Cmd+Z (Mac) or Ctrl+Z (Windows)
**Expected**: Rectangle disappears ✅

---

#### UR-M-02: Keyboard Shortcut Cmd+Shift+Z
**Steps**:
1. Create rectangle
2. Undo (Cmd+Z)
3. Press Cmd+Shift+Z
**Expected**: Rectangle reappears ✅

---

#### UR-M-03: Undo 10 Times
**Steps**:
1. Create 10 shapes
2. Press Cmd+Z 10 times
**Expected**: All shapes removed, canvas empty ✅

---

#### UR-M-04: Undo, Undo, Redo, Redo
**Steps**:
1. Create 5 shapes
2. Undo twice (3 shapes remain)
3. Redo twice (5 shapes back)
**Expected**: Final state matches initial ✅

---

#### UR-M-05: Undo Move Operation
**Steps**:
1. Create rectangle at (100, 100)
2. Drag to (500, 500)
3. Press Cmd+Z
**Expected**: Rectangle jumps back to (100, 100) ✅

---

#### UR-M-06: Undo Color Change
**Steps**:
1. Create red rectangle
2. Change color to blue
3. Press Cmd+Z
**Expected**: Rectangle turns red again ✅

---

#### UR-M-07: Undo After AI Command
**Steps**:
1. Ask AI "create a login form"
2. Press Cmd+Z
**Expected**: Last shape removed (or all if batch) ✅

---

#### UR-M-08: Undo in Multi-User Session
**Steps**:
1. Open canvas in two browsers (User A, User B)
2. User A creates shape
3. User A presses Cmd+Z
4. Check User B's screen
**Expected**: User B sees shape disappear ✅

---

#### UR-M-09: Try Undo with Empty History
**Steps**:
1. Fresh page load
2. Press Cmd+Z
**Expected**: Nothing happens, no errors ✅

---

#### UR-M-10: History Limit Behavior
**Steps**:
1. Create 60 shapes (one by one)
2. Try to undo 60 times
**Expected**: Only 50 undos work, then stops ✅

---

## 🎯 PERFORMANCE BENCHMARKS

| Operation | Target | Test Method |
|-----------|--------|-------------|
| Copy 10 shapes | <10ms | Unit test |
| Paste 10 shapes | <100ms | Integration test |
| Undo operation | <100ms | Integration test |
| Redo operation | <100ms | Integration test |
| Record operation | <5ms | Unit test |
| History size (50 ops) | <5MB | Memory test |
| Clipboard size (10 shapes) | <1MB | Memory test |

---

## ✅ ACCEPTANCE CRITERIA

### Copy/Paste
- [ ] All 12 unit tests pass
- [ ] All 10 integration tests pass
- [ ] All 8 manual tests pass
- [ ] Works with all shape types
- [ ] Multi-select copy/paste works
- [ ] Boundary clamping works
- [ ] No console errors

### Undo/Redo
- [ ] All 15 unit tests pass
- [ ] All 12 integration tests pass
- [ ] All 10 manual tests pass
- [ ] All operation types can be undone
- [ ] Multi-user undo syncs correctly
- [ ] Performance targets met
- [ ] No memory leaks

### Overall
- [ ] 60+ test cases pass
- [ ] No critical bugs
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on Mac and Windows
- [ ] User feedback messages work
- [ ] Documentation updated

---

**Status**: Ready for Implementation Testing 🧪

