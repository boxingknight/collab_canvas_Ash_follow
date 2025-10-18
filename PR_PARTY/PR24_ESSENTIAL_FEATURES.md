# PR #24: Essential Tier 1 Features - Copy/Paste & Undo/Redo

**Status**: 📋 Planning
**Branch**: `feature/pr24-essential-features`
**Priority**: HIGH
**Estimated Effort**: 3-5 hours
**Points Impact**: +4 points (8/15 → 12/15)

---

## 🎯 OBJECTIVE

Implement two critical Tier 1 features that are expected in any professional design tool:
1. **Copy/Paste** functionality with clipboard support
2. **Undo/Redo** with full operation history

These features will:
- Move Section 3 score from 8/15 (Satisfactory) to 12/15 (Good)
- Improve overall grade from 92.7% (A-) to 96.4% (A)
- Add essential UX patterns users expect
- Provide foundation for future history-based features

---

## 📊 CURRENT STATE ANALYSIS

### What We Have
- ✅ Duplicate functionality (Cmd/Ctrl+D)
- ✅ Keyboard event handling (useKeyboard.js)
- ✅ Selection management (useSelection.js)
- ✅ Shape creation/deletion (canvasAPI.js)
- ✅ Multi-select support
- ✅ Firebase real-time sync

### What We're Missing
- ❌ Copy to clipboard (Cmd/Ctrl+C)
- ❌ Paste from clipboard (Cmd/Ctrl+V)
- ❌ Undo operation (Cmd/Ctrl+Z)
- ❌ Redo operation (Cmd/Ctrl+Shift+Z)
- ❌ Operation history tracking
- ❌ State management for history

### Gap Analysis
Our duplicate feature already handles the hard part (cloning shapes with offsets). We just need to:
1. Add clipboard storage between copy and paste
2. Track operations in a history stack
3. Add keyboard shortcuts for undo/redo
4. Implement state restoration from history

---

## 🏗️ FEATURE 1: COPY/PASTE

### User Stories
```
As a designer,
I want to copy selected shapes to clipboard,
So that I can paste them elsewhere on the canvas or even across sessions.

As a designer,
I want to paste shapes multiple times,
So that I can quickly duplicate elements without reselecting.

As a designer,
I want copy/paste to work with multi-select,
So that I can duplicate groups of shapes efficiently.
```

### Technical Design

#### Architecture
```javascript
// Clipboard State (in-memory)
{
  shapes: Shape[],      // Array of copied shapes
  timestamp: Date,      // When copied
  source: 'copy' | 'cut' // Type of operation
}
```

#### Component Changes

**1. Create `useClipboard` Hook**
```javascript
// hooks/useClipboard.js
const useClipboard = () => {
  const clipboardRef = useRef([])
  
  const copy = (shapes) => {
    // Store shapes in clipboard
    clipboardRef.current = shapes.map(shape => ({...shape}))
    return clipboardRef.current.length
  }
  
  const paste = (offsetX = 20, offsetY = 20) => {
    // Create new shapes with offset
    return clipboardRef.current.map(shape => ({
      ...shape,
      x: shape.x + offsetX,
      y: shape.y + offsetY,
      id: generateId()
    }))
  }
  
  const hasClipboard = () => clipboardRef.current.length > 0
  
  return { copy, paste, hasClipboard }
}
```

**2. Update `useKeyboard` Hook**
```javascript
// Add to useKeyboard.js
import { useClipboard } from './useClipboard'

// In keyboard handler
const { copy, paste, hasClipboard } = useClipboard()

// Cmd/Ctrl + C
if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
  if (selectedShapes.length > 0) {
    const count = copy(selectedShapes)
    // Optional: Show toast "Copied X shapes"
  }
}

// Cmd/Ctrl + V
if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
  if (hasClipboard()) {
    const newShapes = paste()
    await createShapes(newShapes)
    // Select newly pasted shapes
    setSelectedIds(newShapes.map(s => s.id))
  }
}
```

#### Implementation Details

**Copy Operation**:
1. User selects shapes
2. User presses Cmd/Ctrl+C
3. System stores shape data in clipboard ref
4. System preserves all properties (type, position, size, color, etc.)
5. Optional: Show feedback toast

**Paste Operation**:
1. User presses Cmd/Ctrl+V
2. System checks if clipboard has data
3. System creates new shapes with:
   - New IDs
   - Offset position (+20px x, +20px y)
   - All other properties preserved
4. System syncs new shapes to Firebase
5. System selects newly pasted shapes
6. User can paste multiple times

**Edge Cases**:
- Empty selection on copy → No action
- Empty clipboard on paste → No action
- Paste near canvas boundary → Clamp positions
- Multiple paste operations → Incremental offset
- Canvas session ends → Clipboard persists (in-memory only)

---

## 🏗️ FEATURE 2: UNDO/REDO

### User Stories
```
As a designer,
I want to undo my last action,
So that I can recover from mistakes without manual reversal.

As a designer,
I want to redo an undone action,
So that I can restore work I undid by accident.

As a designer,
I want undo/redo to work across all operations,
So that I have consistent recovery across create/move/delete/modify actions.
```

### Technical Design

#### Architecture

**History Stack Pattern**
```javascript
{
  past: [                    // Stack of previous states
    {
      operation: 'create',
      timestamp: Date,
      before: null,
      after: {shapeId: 'xyz', data: {...}}
    },
    {
      operation: 'move',
      timestamp: Date,
      before: {x: 100, y: 100},
      after: {x: 150, y: 150}
    }
  ],
  future: [                  // Stack of undone states (for redo)
    {...}
  ],
  current: {...}            // Current state
}
```

#### Trackable Operations

**HIGH PRIORITY** (implement in PR24):
1. **Create Shape** - Track shape creation
2. **Delete Shape** - Track shape deletion
3. **Move Shape** - Track position changes (on drag end)
4. **Resize Shape** - Track size changes
5. **Modify Properties** - Track color, text, rotation changes

**MEDIUM PRIORITY** (future PR):
6. Multi-select operations
7. Z-index changes
8. Bulk operations (arrange, distribute)

**NOT TRACKED** (intentional):
- Cursor movements (real-time, too frequent)
- Selection changes (not data-modifying)
- Canvas pan/zoom (viewport, not data)
- AI chat interactions (already tracked in AI history)

#### Component Changes

**1. Create `useHistory` Hook**
```javascript
// hooks/useHistory.js
const useHistory = (shapes) => {
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const maxHistorySize = 50  // Limit memory usage
  
  // Record an operation
  const recordOperation = (operation) => {
    const newPast = [...past, operation].slice(-maxHistorySize)
    setPast(newPast)
    setFuture([])  // Clear redo stack
  }
  
  // Undo operation
  const undo = async () => {
    if (past.length === 0) return false
    
    const operation = past[past.length - 1]
    
    // Restore previous state
    await restoreOperation(operation, 'undo')
    
    // Update stacks
    setPast(past.slice(0, -1))
    setFuture([operation, ...future])
    
    return true
  }
  
  // Redo operation
  const redo = async () => {
    if (future.length === 0) return false
    
    const operation = future[0]
    
    // Restore next state
    await restoreOperation(operation, 'redo')
    
    // Update stacks
    setPast([...past, operation])
    setFuture(future.slice(1))
    
    return true
  }
  
  const canUndo = past.length > 0
  const canRedo = future.length > 0
  
  return { 
    recordOperation, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    historySize: past.length 
  }
}
```

**2. Define Operation Types**
```javascript
// utils/historyOperations.js

export const OperationType = {
  CREATE: 'create',
  DELETE: 'delete',
  MOVE: 'move',
  RESIZE: 'resize',
  MODIFY: 'modify',
  BATCH: 'batch'  // Multiple operations together
}

export function createOperation(type, before, after, metadata = {}) {
  return {
    type,
    timestamp: Date.now(),
    before,
    after,
    metadata  // {shapeId, userId, etc.}
  }
}
```

**3. Update Canvas Operations**

**In `canvasAPI.js`**:
```javascript
// Add to each operation
export async function addShape(shapeData, userId) {
  const newShape = { ...shapeData, id: generateId() }
  
  // Create shape in Firebase
  await createShapeInFirebase(newShape)
  
  // Record for undo
  recordOperation(createOperation(
    OperationType.CREATE,
    null,
    newShape,
    { shapeId: newShape.id, userId }
  ))
  
  return newShape.id
}

export async function deleteShape(shapeId, userId) {
  // Get shape before deletion
  const shape = getShapeById(shapeId)
  
  // Delete from Firebase
  await deleteShapeInFirebase(shapeId)
  
  // Record for undo
  recordOperation(createOperation(
    OperationType.DELETE,
    shape,
    null,
    { shapeId, userId }
  ))
}
```

**4. Implement Restore Logic**
```javascript
// utils/historyOperations.js

export async function restoreOperation(operation, direction) {
  const isUndo = direction === 'undo'
  
  switch (operation.type) {
    case OperationType.CREATE:
      if (isUndo) {
        // Undo create = delete the shape
        await deleteShape(operation.after.id)
      } else {
        // Redo create = recreate the shape
        await createShape(operation.after)
      }
      break
      
    case OperationType.DELETE:
      if (isUndo) {
        // Undo delete = recreate the shape
        await createShape(operation.before)
      } else {
        // Redo delete = delete again
        await deleteShape(operation.before.id)
      }
      break
      
    case OperationType.MOVE:
      if (isUndo) {
        await updateShapePosition(
          operation.metadata.shapeId, 
          operation.before.x, 
          operation.before.y
        )
      } else {
        await updateShapePosition(
          operation.metadata.shapeId,
          operation.after.x,
          operation.after.y
        )
      }
      break
      
    // ... handle other types
  }
}
```

**5. Update `useKeyboard` Hook**
```javascript
// Add to useKeyboard.js
import { useHistory } from './useHistory'

const { undo, redo, canUndo, canRedo } = useHistory(shapes)

// Cmd/Ctrl + Z (Undo)
if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
  e.preventDefault()
  if (canUndo) {
    await undo()
    // Optional: Show toast "Undone"
  }
}

// Cmd/Ctrl + Shift + Z (Redo)
if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
  e.preventDefault()
  if (canRedo) {
    await redo()
    // Optional: Show toast "Redone"
  }
}
```

#### Implementation Details

**Recording Operations**:
1. Every canvas operation calls `recordOperation`
2. Operation includes type, before/after state, metadata
3. Operation added to past stack
4. Future stack cleared (can't redo after new operation)
5. History limited to 50 operations (memory management)

**Undo Flow**:
1. User presses Cmd/Ctrl+Z
2. System checks if past stack has operations
3. System pops last operation from past
4. System restores "before" state based on operation type
5. System pushes operation to future stack
6. Firebase syncs the restored state
7. Canvas rerenders with previous state

**Redo Flow**:
1. User presses Cmd/Ctrl+Shift+Z
2. System checks if future stack has operations
3. System pops first operation from future
4. System restores "after" state based on operation type
5. System pushes operation to past stack
6. Firebase syncs the restored state
7. Canvas rerenders with next state

**Edge Cases**:
- Empty past stack → Can't undo
- Empty future stack → Can't redo
- History limit reached → Remove oldest operation
- Undo deleted shape → Shape reappears with original properties
- Multiple users undoing → Each user has own local history
- Session refresh → History lost (acceptable for MVP)

---

## 🔄 COLLABORATIVE BEHAVIOR

### Copy/Paste
- **Local Operation**: Clipboard is per-user (in-memory)
- **Sync**: Only paste creates new shapes → synced to all users
- **Conflict**: None (each paste creates new IDs)
- **Best Practice**: Clipboard doesn't sync across users

### Undo/Redo
- **Local Operation**: History is per-user (local state)
- **Sync**: Undo/redo operations modify Firebase → synced to all users
- **Conflict Handling**:
  - User A undoes their creation → Shape disappears for all users
  - User B sees shape disappear in real-time
  - User A can redo → Shape reappears for all users
- **Edge Case**: 
  - User A creates shape
  - User B deletes it
  - User A tries to undo creation → Operation fails gracefully (shape already gone)
  - Solution: Check shape exists before restoring

### Conflict Resolution Strategy
```javascript
// In restoreOperation
async function restoreOperation(operation, direction) {
  try {
    // Check if shape exists when needed
    if (operation.type === OperationType.DELETE && direction === 'undo') {
      const exists = await shapeExists(operation.before.id)
      if (exists) {
        // Someone else already restored it
        return { success: false, reason: 'already_exists' }
      }
    }
    
    // Proceed with restoration
    await performRestore(operation, direction)
    return { success: true }
    
  } catch (error) {
    console.error('Restore failed:', error)
    return { success: false, reason: error.message }
  }
}
```

---

## 🧪 TESTING STRATEGY

### Copy/Paste Tests

**Unit Tests**:
1. ✅ Copy single shape → Clipboard has 1 shape
2. ✅ Copy multiple shapes → Clipboard has all shapes
3. ✅ Copy with no selection → Clipboard unchanged
4. ✅ Paste from empty clipboard → No shapes created
5. ✅ Paste from clipboard → New shapes created with offset
6. ✅ Paste multiple times → Each paste creates new shapes
7. ✅ Paste preserves all properties (color, size, text, etc.)

**Integration Tests**:
1. ✅ Copy shape, paste → New shape appears on canvas
2. ✅ Copy shape, move original, paste → Paste uses copied position
3. ✅ Copy multi-select → All shapes pasted together
4. ✅ Paste syncs to Firebase → Other users see pasted shapes
5. ✅ Paste near boundary → Shapes clamped to canvas
6. ✅ Paste selects new shapes → User can immediately move them

**Manual Tests**:
1. Copy shape with Cmd+C, paste with Cmd+V
2. Copy 5 shapes, paste 3 times → 15 new shapes
3. Copy text, paste → Text preserved
4. Copy rotated shape → Rotation preserved
5. Copy, delete original, paste → Original restored

### Undo/Redo Tests

**Unit Tests**:
1. ✅ Create shape → Operation recorded in history
2. ✅ Undo create → Shape removed
3. ✅ Redo create → Shape restored
4. ✅ Undo with empty history → No action
5. ✅ Redo with empty future → No action
6. ✅ New operation after undo → Future cleared
7. ✅ History limit → Oldest removed after 50 operations

**Integration Tests**:
1. ✅ Create shape, undo → Shape disappears from Firebase
2. ✅ Move shape, undo → Shape returns to original position
3. ✅ Delete shape, undo → Shape reappears
4. ✅ Modify color, undo → Original color restored
5. ✅ Undo syncs to other users → All users see change
6. ✅ Multiple undos → Stack processed correctly
7. ✅ Undo, undo, redo → Correct state restored

**Manual Tests**:
1. Create 5 shapes, undo all → Canvas empty
2. Undo all, redo all → All shapes back
3. Create, modify, delete, undo 3 times → Original state
4. Move shape, undo → Shape jumps back
5. Two users: A creates, A undos → B sees it disappear

**Conflict Tests**:
1. User A creates, User B deletes, User A undos → Handles gracefully
2. User A moves, User B moves same shape → Last write wins
3. User A undos delete, shape exists → Skip operation

**Performance Tests**:
1. 50 operations in history → No lag
2. Rapid undo/redo 20 times → Responsive
3. Undo with 100 shapes on canvas → <100ms
4. History memory usage → <5MB for 50 operations

---

## 🎯 SUCCESS CRITERIA

### Copy/Paste
- ✅ Cmd/Ctrl+C copies selected shapes
- ✅ Cmd/Ctrl+V pastes shapes with 20px offset
- ✅ Paste works multiple times from same copy
- ✅ Multi-select copy/paste preserves relative positions
- ✅ All shape properties preserved (type, color, text, rotation, size)
- ✅ Pasted shapes sync to all users
- ✅ Empty selection/clipboard handled gracefully
- ✅ Works with all shape types (rectangle, circle, line, text)

### Undo/Redo
- ✅ Cmd/Ctrl+Z undoes last operation
- ✅ Cmd/Ctrl+Shift+Z redoes last undo
- ✅ Supports create, delete, move, resize, modify operations
- ✅ History limited to 50 operations
- ✅ Undo/redo syncs across all users
- ✅ Future stack clears on new operation
- ✅ Empty stack handled gracefully (no errors)
- ✅ Operations restore exact previous state
- ✅ Conflict resolution handles deleted/modified shapes
- ✅ Performance: <100ms per undo/redo operation

### User Experience
- ✅ Standard keyboard shortcuts work as expected
- ✅ No unexpected behavior or errors
- ✅ Smooth animations/transitions
- ✅ Optional: Toast feedback for copy/paste/undo/redo
- ✅ Optional: Visual indicator when undo/redo unavailable

---

## 🐛 POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Clipboard Memory Leak
**Problem**: Large clipboard data retained indefinitely
**Solution**: 
- Limit clipboard to 10 shapes max
- Clear clipboard on canvas change/logout
- Use WeakRef for shape references

### Issue 2: Undo Sync Conflicts
**Problem**: User A undos while User B modifies same shape
**Solution**:
- Check shape exists before restore
- Use Firebase transactions for atomic updates
- Show warning if operation can't be undone

### Issue 3: History Memory Usage
**Problem**: 50 operations × large shapes = high memory
**Solution**:
- Store only changed properties, not full shapes
- Implement operation compression
- Clear history on canvas change

### Issue 4: Paste Position Overflow
**Problem**: Pasting near canvas boundary goes offscreen
**Solution**:
```javascript
const clampedX = Math.min(pasteX, CANVAS_WIDTH - shapeWidth)
const clampedY = Math.min(pasteY, CANVAS_HEIGHT - shapeHeight)
```

### Issue 5: Undo Move During Drag
**Problem**: User drags shape, another user undos, shape teleports
**Solution**:
- Don't record move until drag end
- Lock shape during active drag
- Or: Warn "Shape being moved by another user"

### Issue 6: Redo After Delete
**Problem**: User A creates, User B deletes, User A tries to redo
**Solution**:
```javascript
if (operation.type === 'create' && direction === 'redo') {
  const exists = await shapeExists(operation.after.id)
  if (exists) {
    // Already exists, skip
    return { success: false, reason: 'already_exists' }
  }
}
```

### Issue 7: Multiple Paste Offset
**Problem**: Paste, paste, paste → All shapes stack at same offset
**Solution**: 
- Track paste count
- Increment offset: (20 * pasteCount)px
- Reset on new copy

### Issue 8: History Persistence
**Problem**: Refresh page → History lost
**Solution** (optional, future PR):
- Store history in localStorage
- Restore on page load
- Or: Accept as limitation for MVP

### Issue 9: Batch Operations
**Problem**: AI creates 10 shapes → 10 history entries
**Solution**:
- Implement batch operation type
- Single undo removes all 10 shapes
- Store operations array in batch

### Issue 10: Text Shape Copy
**Problem**: Text shape copied without proper text property
**Solution**:
- Ensure all properties cloned deeply
- Test specifically with text shapes
- Validate required properties before paste

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Copy/Paste (1-2 hours)
- [ ] Create `useClipboard` hook
- [ ] Add copy logic (Cmd/Ctrl+C)
- [ ] Add paste logic (Cmd/Ctrl+V)
- [ ] Handle multi-select copy
- [ ] Handle paste offset calculation
- [ ] Handle boundary clamping
- [ ] Update `useKeyboard` hook
- [ ] Test with all shape types
- [ ] Test multi-paste
- [ ] Test sync to Firebase
- [ ] Add optional toast feedback

### Phase 2: Undo/Redo Foundation (1-2 hours)
- [ ] Create `useHistory` hook
- [ ] Define operation types
- [ ] Create operation factory functions
- [ ] Implement past/future stacks
- [ ] Implement undo logic
- [ ] Implement redo logic
- [ ] Add keyboard shortcuts
- [ ] Test basic undo/redo flow

### Phase 3: Operation Tracking (1 hour)
- [ ] Update `addShape` to record CREATE
- [ ] Update `deleteShape` to record DELETE
- [ ] Update `updateShape` to record MODIFY
- [ ] Update drag handler to record MOVE
- [ ] Update resize handler to record RESIZE
- [ ] Test each operation type
- [ ] Test operation chaining

### Phase 4: Restore Logic (30 min - 1 hour)
- [ ] Implement `restoreOperation` function
- [ ] Handle CREATE restore (undo = delete)
- [ ] Handle DELETE restore (undo = create)
- [ ] Handle MOVE restore (undo = move back)
- [ ] Handle RESIZE restore (undo = resize back)
- [ ] Handle MODIFY restore (undo = revert property)
- [ ] Test all restore paths

### Phase 5: Conflict Resolution (30 min)
- [ ] Add existence checks before restore
- [ ] Handle shape deleted by another user
- [ ] Handle shape modified by another user
- [ ] Add error handling and logging
- [ ] Test multi-user scenarios

### Phase 6: Polish & Testing (1 hour)
- [ ] Add toast notifications (optional)
- [ ] Add visual feedback for undo/redo state
- [ ] Test all 50+ test cases
- [ ] Test performance with large history
- [ ] Test memory usage
- [ ] Test boundary conditions
- [ ] Update documentation
- [ ] Update README

### Phase 7: Deployment
- [ ] Merge to main
- [ ] Deploy to Firebase
- [ ] Test on production
- [ ] Update grading documentation

---

## 📈 METRICS & IMPACT

### Before PR #24
- **Section 3 Score**: 8/15 (Satisfactory)
- **Overall Score**: 102/110 (92.7% - A-)
- **Tier 1 Features**: 1/6 (Keyboard shortcuts only)
- **User Friction**: High (no undo for mistakes)

### After PR #24
- **Section 3 Score**: 12/15 (Good) 
- **Overall Score**: 106/110 (96.4% - A)
- **Tier 1 Features**: 3/6 (+Copy/Paste +Undo/Redo)
- **User Friction**: Low (mistakes easily reversible)

### User Impact
- **Error Recovery**: Users can undo mistakes → reduces frustration
- **Workflow Speed**: Copy/paste faster than manual duplication
- **Confidence**: Users experiment more with undo safety net
- **Professional Feel**: Standard shortcuts work as expected

---

## 🚀 FUTURE ENHANCEMENTS (Post-PR24)

### Near-Term (PR #25)
- **Color Picker** (Tier 1, +2 points) → 14/15 (Excellent)
- **Visual History Panel** (see undo/redo stack)
- **Keyboard Shortcuts Panel** (show all shortcuts)

### Mid-Term
- **History Persistence** (survive page refresh)
- **Batch Undo** (undo all AI operations together)
- **Named History Points** (bookmark states)

### Long-Term
- **Collaborative Undo** (see other users' undo actions)
- **Time-Travel Debugging** (jump to any point in history)
- **Undo Branching** (tree instead of linear stack)

---

## 📚 REFERENCES

### Design Patterns
- **Command Pattern**: Encapsulate operations as objects
- **Memento Pattern**: Save and restore state
- **Strategy Pattern**: Different restore logic per operation type

### Similar Implementations
- **Figma**: Linear undo/redo, per-user history
- **Canva**: Linear undo/redo, 50-operation limit
- **Photoshop**: History panel with thumbnails
- **Sketch**: Linear undo/redo, unlimited history

### Technical Resources
- [React Hooks Patterns](https://reactjs.org/docs/hooks-reference.html)
- [Command Pattern](https://refactoring.guru/design-patterns/command)
- [Memento Pattern](https://refactoring.guru/design-patterns/memento)
- [Firebase Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)

---

## ✅ DEFINITION OF DONE

- [ ] All checklist items completed
- [ ] All tests passing (50+ test cases)
- [ ] No console errors or warnings
- [ ] Performance targets met (<100ms operations)
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on both Mac (Cmd) and Windows (Ctrl)
- [ ] Documented in README
- [ ] Deployed to production
- [ ] Grading rubric updated
- [ ] PR documentation complete

---

## 📝 NOTES

### Design Decisions
1. **Local Clipboard**: Don't sync clipboard across users (standard behavior)
2. **Local History**: Each user has own undo/redo stack
3. **Sync Operations**: Undo/redo changes sync to Firebase
4. **History Limit**: 50 operations (memory vs functionality tradeoff)
5. **Graceful Conflicts**: Failed operations log but don't error

### Known Limitations
1. History doesn't persist across page refresh (acceptable for MVP)
2. Can't undo other users' actions (each user has own history)
3. Batch operations create multiple history entries (future enhancement)
4. No visual history panel (keyboard only)

### Why These Features?
- **Copy/Paste**: Expected by 100% of users, easy to implement, high ROI
- **Undo/Redo**: Essential for any creative tool, prevents user frustration
- **Together**: 4 points for 3-5 hours work = excellent ROI

---

**Created**: 2025-10-18
**Last Updated**: 2025-10-18
**Author**: CollabCanvas Team
**Status**: Ready for Implementation 🚀

