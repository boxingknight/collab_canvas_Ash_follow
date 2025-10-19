# PR #24: Bug Analysis - Copy/Paste & Undo/Redo

**Date**: 2025-10-18
**Status**: Pre-Implementation Analysis
**Risk Level**: MEDIUM

---

## 🐛 IDENTIFIED POTENTIAL BUGS (12 Total)

### CRITICAL PRIORITY (Must Fix Before Merge)

#### Bug #1: Memory Leak from Clipboard References
**Severity**: HIGH
**Component**: `useClipboard` hook

**Description**:
Clipboard stores full shape objects in memory indefinitely. If user copies 100 shapes repeatedly, memory usage grows unconstrained.

**Reproduction**:
1. Copy 100 shapes
2. Delete all shapes
3. Copy 100 more shapes
4. Repeat 10 times
5. Check memory usage → Growing continuously

**Root Cause**:
```javascript
// Problem: Clipboard never clears
clipboardRef.current = shapes.map(shape => ({...shape}))
// shapes stay in memory forever
```

**Solution**:
```javascript
// Add clipboard size limit
const MAX_CLIPBOARD_SIZE = 10

const copy = (shapes) => {
  if (shapes.length > MAX_CLIPBOARD_SIZE) {
    // Option 1: Truncate
    clipboardRef.current = shapes.slice(0, MAX_CLIPBOARD_SIZE)
    
    // Option 2: Reject
    return { success: false, reason: 'too_many_shapes' }
  }
  clipboardRef.current = shapes.map(shape => ({...shape}))
}

// Clear clipboard on canvas unmount
useEffect(() => {
  return () => {
    clipboardRef.current = []
  }
}, [])
```

**Testing**:
- Copy 100 shapes → Should limit to 10 or show error
- Check memory after 100 copy operations → Should be stable
- Unmount canvas → Clipboard cleared

---

#### Bug #2: Undo Stack Memory Explosion
**Severity**: HIGH
**Component**: `useHistory` hook

**Description**:
History stores full shape data for each operation. With 50 operations of large shapes (complex text, many properties), memory usage can reach 10-50MB+.

**Reproduction**:
1. Create 50 shapes with long text (1000 chars each)
2. Move each shape (50 operations)
3. Check memory → 50 × (before + after state) = massive data

**Root Cause**:
```javascript
// Problem: Storing entire shape object
const operation = {
  before: {id: 'xyz', type: 'text', text: '1000 chars...', ...},
  after: {id: 'xyz', type: 'text', text: '1000 chars...', ...}
}
// 50 operations × 2 states × large objects = huge memory
```

**Solution**:
```javascript
// Solution 1: Store only changed properties
const createMoveOperation = (shapeId, beforePos, afterPos) => {
  return {
    type: 'move',
    shapeId,
    before: { x: beforePos.x, y: beforePos.y },  // Only position
    after: { x: afterPos.x, y: afterPos.y }
  }
}

// Solution 2: Compress operation data
const compressOperation = (operation) => {
  return {
    type: operation.type,
    shapeId: operation.metadata.shapeId,
    delta: getDelta(operation.before, operation.after)  // Only diff
  }
}

// Solution 3: Lower history limit
const maxHistorySize = 25  // Instead of 50
```

**Testing**:
- Create 25 operations with large shapes → Memory usage <5MB
- Move 100px → Only position stored, not full shape
- Check operation size → Should be <1KB each

---

#### Bug #3: Undo/Redo Race Condition with Firebase
**Severity**: HIGH
**Component**: `restoreOperation` function

**Description**:
When User A undos a delete, they recreate a shape in Firebase. If User B simultaneously creates a shape with the same ID (unlikely but possible with collision), Firebase throws an error or overwrites.

**Reproduction**:
1. User A creates shape with ID "xyz"
2. User B deletes shape "xyz"
3. User A undos delete (tries to recreate "xyz")
4. User B simultaneously creates new shape, ID collision
5. Firebase error or state corruption

**Root Cause**:
```javascript
// Problem: No transaction, no ID check
const undo = async () => {
  await createShape(operation.before)  // What if ID already exists?
}
```

**Solution**:
```javascript
// Solution: Use Firebase transaction or check existence
const restoreDeletedShape = async (shape) => {
  const exists = await getDoc(doc(db, 'shapes', shape.id))
  
  if (exists.exists()) {
    // Shape already recreated by another user
    console.warn('Shape already exists, skipping restore')
    return { success: false, reason: 'already_exists' }
  }
  
  // Safe to recreate
  await setDoc(doc(db, 'shapes', shape.id), shape)
  return { success: true }
}

// Or use Firebase transaction for atomicity
const restoreWithTransaction = async (shape) => {
  await runTransaction(db, async (transaction) => {
    const shapeRef = doc(db, 'shapes', shape.id)
    const shapeDoc = await transaction.get(shapeRef)
    
    if (shapeDoc.exists()) {
      throw new Error('Shape already exists')
    }
    
    transaction.set(shapeRef, shape)
  })
}
```

**Testing**:
- Two users undo delete of same shape → Only one succeeds
- Undo delete of recreated shape → Graceful failure
- Check Firebase logs → No duplicate ID errors

---

### HIGH PRIORITY

#### Bug #4: Paste Position Offscreen
**Severity**: MEDIUM
**Component**: `paste` function in `useClipboard`

**Description**:
Pasting shapes near canvas boundary causes them to render offscreen. User can't see or select pasted shapes.

**Reproduction**:
1. Create shape at (CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10)
2. Copy shape
3. Paste → New shape at (CANVAS_WIDTH + 10, CANVAS_HEIGHT + 10)
4. Shape is offscreen and inaccessible

**Root Cause**:
```javascript
// Problem: No boundary checking
const paste = (offsetX = 20, offsetY = 20) => {
  return clipboardRef.current.map(shape => ({
    ...shape,
    x: shape.x + offsetX,  // Can exceed canvas width
    y: shape.y + offsetY   // Can exceed canvas height
  }))
}
```

**Solution**:
```javascript
const paste = (offsetX = 20, offsetY = 20) => {
  return clipboardRef.current.map(shape => {
    const newX = Math.min(
      shape.x + offsetX, 
      CANVAS_WIDTH - shape.width - 50  // Keep 50px padding
    )
    const newY = Math.min(
      shape.y + offsetY,
      CANVAS_HEIGHT - shape.height - 50
    )
    
    return {
      ...shape,
      x: Math.max(50, newX),  // Minimum 50px from edge
      y: Math.max(50, newY),
      id: generateId()
    }
  })
}
```

**Testing**:
- Copy shape at (3900, 2900), paste → Clamped to canvas
- Copy near right edge → Paste appears visible
- Copy multi-select near boundary → All shapes clamped

---

#### Bug #5: Undo During Active Drag
**Severity**: MEDIUM
**Component**: Drag handlers + `useHistory`

**Description**:
User A drags a shape. During the drag, User B undos a move on the same shape. The shape teleports under User A's cursor, causing confusion.

**Reproduction**:
1. User A starts dragging shape "xyz" from (100, 100)
2. User B undos a previous move on shape "xyz" → Sets position to (500, 500)
3. Shape teleports under User A's cursor mid-drag
4. User A releases → Shape position is unpredictable

**Root Cause**:
```javascript
// Problem: No check for active drag before undo
const undo = async () => {
  await updateShapePosition(shapeId, beforeX, beforeY)
  // Doesn't check if shape is being dragged
}
```

**Solution**:
```javascript
// Solution 1: Don't record move until drag end
const onDragEnd = (e, shapeId) => {
  const finalPos = { x: e.target.x(), y: e.target.y() }
  
  // Only now record the operation
  recordOperation(createMoveOperation(
    shapeId,
    dragStartPos,  // Captured at drag start
    finalPos
  ))
}

// Solution 2: Lock shape during drag
const activeDrags = new Set()

const onDragStart = (e, shapeId) => {
  activeDrags.add(shapeId)
}

const onDragEnd = (e, shapeId) => {
  activeDrags.delete(shapeId)
}

// In undo
const restoreMoveOperation = async (operation) => {
  if (activeDrags.has(operation.shapeId)) {
    return { success: false, reason: 'shape_being_dragged' }
  }
  await updateShapePosition(...)
}
```

**Testing**:
- Drag shape, another user undos → Undo fails or drag continues
- Release drag → Move recorded, can now undo
- Rapid drag and undo → No teleporting or corruption

---

#### Bug #6: Multiple Paste Offset Stacking
**Severity**: LOW
**Component**: `paste` function

**Description**:
Paste, paste, paste → All shapes stack at exact same offset (+20, +20). Shapes overlap completely, looks like only one was pasted.

**Reproduction**:
1. Copy a rectangle
2. Paste 3 times
3. Observe: All 3 rectangles at exact same position (offset +20, +20 from original)
4. Looks like only 1 shape was pasted

**Root Cause**:
```javascript
// Problem: Offset always the same
const paste = () => {
  return clipboardRef.current.map(shape => ({
    ...shape,
    x: shape.x + 20,  // Always +20
    y: shape.y + 20   // Always +20
  }))
}
```

**Solution**:
```javascript
// Solution: Increment offset on multiple pastes
let pasteCount = 0

const copy = (shapes) => {
  clipboardRef.current = shapes
  pasteCount = 0  // Reset on new copy
}

const paste = () => {
  pasteCount++
  const offset = 20 * pasteCount  // 20, 40, 60, 80...
  
  return clipboardRef.current.map(shape => ({
    ...shape,
    x: shape.x + offset,
    y: shape.y + offset,
    id: generateId()
  }))
}
```

**Testing**:
- Paste 5 times → Shapes cascade diagonally
- Copy new shape, paste → Offset resets to 20
- Paste with offset (0, 0) → Uses last pasted position

---

### MEDIUM PRIORITY

#### Bug #7: Undo AI Batch Operations
**Severity**: MEDIUM
**Component**: AI complex operations + `useHistory`

**Description**:
AI creates a login form (9 shapes). User wants to undo the entire form. Instead, they have to undo 9 times individually.

**Reproduction**:
1. Ask AI "create a login form"
2. AI creates 9 shapes (background, title, labels, inputs, button)
3. User presses Cmd+Z
4. Only the last shape (button) is removed
5. User has to press Cmd+Z 8 more times

**Root Cause**:
```javascript
// Problem: Each shape creation is separate operation
async function createLoginForm() {
  await addShape(background)  // Operation 1
  await addShape(title)       // Operation 2
  await addShape(label1)      // Operation 3
  // ... 6 more operations
}
```

**Solution**:
```javascript
// Solution: Batch operations
const OperationType = {
  BATCH: 'batch'
}

async function createLoginForm() {
  const shapeIds = []
  
  // Create all shapes
  shapeIds.push(await addShapeWithoutHistory(background))
  shapeIds.push(await addShapeWithoutHistory(title))
  // ... all shapes
  
  // Record as single batch operation
  recordOperation({
    type: OperationType.BATCH,
    before: null,
    after: { shapeIds, operation: 'createLoginForm' }
  })
}

// In undo
case OperationType.BATCH:
  if (isUndo) {
    // Delete all shapes in batch
    await Promise.all(
      operation.after.shapeIds.map(id => deleteShape(id))
    )
  }
  break
```

**Testing**:
- AI creates login form, undo once → All 9 shapes removed
- AI creates navigation bar, undo → All shapes removed
- Undo batch, redo → All shapes recreated

---

#### Bug #8: Copy Text Shape Loses Formatting
**Severity**: MEDIUM
**Component**: `copy` function in `useClipboard`

**Description**:
Copy a text shape with specific fontSize, fontFamily, alignment. Paste → Text reverts to default formatting.

**Reproduction**:
1. Create text shape with fontSize: 48, fontFamily: 'Georgia', align: 'center'
2. Copy text shape
3. Paste
4. Pasted text has fontSize: 16 (default), fontFamily: 'Arial' (default)

**Root Cause**:
```javascript
// Problem: Shallow copy or missing properties
const copy = (shapes) => {
  clipboardRef.current = shapes.map(shape => ({...shape}))
  // If shape has nested objects, they're not deep copied
}
```

**Solution**:
```javascript
// Solution: Deep clone with all properties
const copy = (shapes) => {
  clipboardRef.current = shapes.map(shape => {
    // Use structured clone for deep copy
    return JSON.parse(JSON.stringify(shape))
    
    // Or manually ensure all properties
    return {
      ...shape,
      // Explicitly include text properties
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      align: shape.align,
      verticalAlign: shape.verticalAlign,
      // Any other custom properties
      ...
    }
  })
}
```

**Testing**:
- Copy text with fontSize 48 → Paste has fontSize 48
- Copy rotated text → Paste preserves rotation
- Copy all shape types → All properties preserved

---

#### Bug #9: Undo Delete of Shape Modified by Another User
**Severity**: MEDIUM
**Component**: `restoreOperation` DELETE case

**Description**:
User A creates a blue rectangle. User B changes it to red. User B deletes it. User A undos their creation (expecting to delete). But the shape is already gone, and undo tries to delete non-existent shape.

Alternatively: User A deletes shape. User B modifies the shape before Firebase sync. User A undos delete → Recreates old version, overwriting User B's changes.

**Reproduction**:
1. User A creates blue rectangle (id: "xyz")
2. User B changes color to red
3. User B deletes rectangle
4. User A presses undo (tries to undo their creation)
5. Expected: No-op (shape already deleted by B)
6. Actual: Error or attempts to delete non-existent shape

**Root Cause**:
```javascript
// Problem: No version checking or state validation
const undo = async () => {
  const operation = past.pop()
  if (operation.type === 'create') {
    await deleteShape(operation.after.id)  // Shape might not exist
  }
}
```

**Solution**:
```javascript
// Solution: Check existence and version before restore
const restoreOperation = async (operation, direction) => {
  try {
    if (operation.type === 'create' && direction === 'undo') {
      // Undo create = delete shape
      const exists = await shapeExists(operation.after.id)
      if (!exists) {
        console.warn('Shape already deleted, skipping undo')
        return { success: false, reason: 'already_deleted' }
      }
      await deleteShape(operation.after.id)
    }
    
    if (operation.type === 'delete' && direction === 'undo') {
      // Undo delete = recreate shape
      const exists = await shapeExists(operation.before.id)
      if (exists) {
        console.warn('Shape already recreated, skipping undo')
        return { success: false, reason: 'already_exists' }
      }
      await createShape(operation.before)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Restore failed:', error)
    return { success: false, reason: error.message }
  }
}

// Helper function
async function shapeExists(shapeId) {
  const shapeRef = doc(db, 'shapes', shapeId)
  const shapeDoc = await getDoc(shapeRef)
  return shapeDoc.exists()
}
```

**Testing**:
- User A creates, User B deletes, User A undos → Graceful no-op
- User A deletes, User B already deleted, User A undos → Detects and skips
- Check Firebase for orphaned operations → None

---

### LOW PRIORITY

#### Bug #10: Keyboard Shortcut Conflicts with Browser
**Severity**: LOW
**Component**: `useKeyboard` hook

**Description**:
Cmd+C on Mac opens "View Source" in some browsers. Cmd+V might trigger browser paste. Need to prevent default for our shortcuts.

**Reproduction**:
1. Select shapes
2. Press Cmd+C
3. Browser "View Source" opens instead of copying shapes

**Root Cause**:
```javascript
// Problem: Not preventing default
if (e.metaKey && e.key === 'c') {
  copy(selectedShapes)  // Browser also handles Cmd+C
}
```

**Solution**:
```javascript
// Solution: Prevent default for our shortcuts
if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
  e.preventDefault()  // Stop browser action
  e.stopPropagation() // Stop event bubbling
  copy(selectedShapes)
}
```

**Testing**:
- Cmd+C with shapes selected → Copies, doesn't open browser menu
- Cmd+V → Pastes shapes, doesn't trigger browser paste
- Cmd+Z → Undos, doesn't navigate back in browser history

---

#### Bug #11: Empty Clipboard Paste Shows No Feedback
**Severity**: LOW
**Component**: `paste` function + UX

**Description**:
User presses Cmd+V with empty clipboard. Nothing happens. No feedback. User is confused.

**Reproduction**:
1. Open canvas (clipboard empty)
2. Press Cmd+V
3. Nothing happens, no message, no feedback

**Root Cause**:
```javascript
// Problem: Silent failure
if (clipboardRef.current.length === 0) {
  return  // User doesn't know why paste didn't work
}
```

**Solution**:
```javascript
// Solution: Show toast notification
const paste = () => {
  if (clipboardRef.current.length === 0) {
    showToast('Clipboard is empty. Copy shapes first.', 'info')
    return []
  }
  
  const newShapes = ...
  showToast(`Pasted ${newShapes.length} shape(s)`, 'success')
  return newShapes
}
```

**Testing**:
- Paste with empty clipboard → Shows "Clipboard is empty" message
- Paste successfully → Shows "Pasted 3 shapes" message
- Copy → Shows "Copied 3 shapes" message

---

#### Bug #12: History Limit Reached No Warning
**Severity**: LOW
**Component**: `useHistory` hook

**Description**:
History reaches 50 operations. Oldest operations are silently dropped. User might expect to undo 51+ times but can't.

**Reproduction**:
1. Perform 100 operations
2. Try to undo 51 times
3. After 50 undos, no more undo available
4. User doesn't know history was limited

**Root Cause**:
```javascript
// Problem: Silent truncation
const newPast = [...past, operation].slice(-50)  // Drops oldest
```

**Solution**:
```javascript
// Solution: Warn when limit reached (optional)
const recordOperation = (operation) => {
  if (past.length >= maxHistorySize) {
    console.info('History limit reached, oldest operation removed')
    // Optional: Show toast once
    if (!historyLimitWarningShown) {
      showToast('History limit reached (50 operations)', 'info')
      historyLimitWarningShown = true
    }
  }
  
  const newPast = [...past, operation].slice(-maxHistorySize)
  setPast(newPast)
  setFuture([])
}
```

**Testing**:
- Perform 50 operations → No warning
- Perform 51st operation → Warning shown once
- Undo 50 times → Works
- Try 51st undo → Can't undo (oldest dropped)

---

## 🎯 BUG PRIORITY MATRIX

| Bug | Severity | Likelihood | Priority | Fix Time |
|-----|----------|------------|----------|----------|
| #1: Clipboard Memory Leak | HIGH | MEDIUM | CRITICAL | 30 min |
| #2: History Memory | HIGH | HIGH | CRITICAL | 1 hour |
| #3: Undo/Redo Race Condition | HIGH | LOW | CRITICAL | 1 hour |
| #4: Paste Offscreen | MEDIUM | HIGH | HIGH | 30 min |
| #5: Undo During Drag | MEDIUM | MEDIUM | HIGH | 45 min |
| #6: Paste Offset Stacking | LOW | HIGH | MEDIUM | 20 min |
| #7: Undo AI Batch | MEDIUM | MEDIUM | MEDIUM | 1 hour |
| #8: Copy Text Formatting | MEDIUM | MEDIUM | MEDIUM | 20 min |
| #9: Undo Modified Shape | MEDIUM | MEDIUM | MEDIUM | 45 min |
| #10: Keyboard Conflicts | LOW | LOW | LOW | 10 min |
| #11: Empty Clipboard Feedback | LOW | HIGH | LOW | 15 min |
| #12: History Limit Warning | LOW | LOW | LOW | 15 min |

---

## ✅ TESTING STRATEGY PER BUG

### Automated Tests
- **Bug #1**: Test clipboard size limit
- **Bug #2**: Test operation data size
- **Bug #4**: Test paste boundary clamping
- **Bug #6**: Test multiple paste offsets
- **Bug #8**: Test property preservation

### Integration Tests
- **Bug #3**: Test concurrent undo operations
- **Bug #5**: Test undo during drag
- **Bug #7**: Test batch operation undo
- **Bug #9**: Test undo conflict resolution

### Manual Tests
- **Bug #10**: Test keyboard shortcuts in different browsers
- **Bug #11**: Test user feedback messages
- **Bug #12**: Test history limit behavior

---

## 🔧 MITIGATION STRATEGY

### Pre-Implementation
- ✅ Review all potential bugs
- ✅ Plan solutions before coding
- ✅ Design with edge cases in mind

### During Implementation
- 🔄 Fix critical bugs immediately (before moving to next feature)
- 🔄 Add defensive checks (existence, bounds, conflicts)
- 🔄 Add comprehensive error handling

### Post-Implementation
- 🔄 Run full test suite (50+ tests)
- 🔄 Test all edge cases manually
- 🔄 Multi-user testing for conflicts
- 🔄 Performance testing for memory issues

---

## 📋 BUG FIX CHECKLIST

**Before Implementation**:
- [ ] Read this bug analysis
- [ ] Plan solutions for critical bugs
- [ ] Design with edge cases in mind

**During Implementation**:
- [ ] Fix Bug #1 (clipboard memory)
- [ ] Fix Bug #2 (history memory)
- [ ] Fix Bug #3 (race condition)
- [ ] Fix Bug #4 (paste offscreen)
- [ ] Fix Bug #5 (undo during drag)
- [ ] Fix Bug #6 (paste offset)
- [ ] Fix Bug #8 (text formatting)
- [ ] Fix Bug #10 (keyboard conflicts)

**Optional Enhancements**:
- [ ] Fix Bug #7 (batch undo) - if time permits
- [ ] Fix Bug #9 (conflict detection) - if time permits
- [ ] Fix Bug #11 (feedback messages) - nice to have
- [ ] Fix Bug #12 (history warning) - nice to have

**Before Merge**:
- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed
- [ ] No console errors or warnings
- [ ] Multi-user testing passed
- [ ] Performance testing passed

---

**Status**: Ready for Implementation with Bug Awareness 🐛

