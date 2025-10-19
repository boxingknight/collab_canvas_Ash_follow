# PR #26: Bug Analysis - Multi-Select Editing

**Status**: 📋 Pre-Implementation  
**Date**: October 19, 2025  
**Severity Levels**: 🔴 Critical | 🟡 Major | 🟢 Minor  

---

## 🐛 **Potential Bugs & Prevention Strategies**

This document identifies potential bugs in the multi-select editing implementation and provides solutions to prevent them.

---

## **Bug #1: Race Conditions in Batch Firestore Writes** 🔴

### **Description**
When updating multiple shapes simultaneously, concurrent Firestore writes could result in:
- Lost updates (one write overwrites another)
- Inconsistent state across users
- "updatedAt" timestamps out of sync

### **Reproduction Steps**
1. Select 10 shapes
2. Rapidly change X position multiple times in quick succession
3. Check if all updates applied correctly

### **Root Cause**
```javascript
// BAD: Sequential writes without coordination
for (const shapeId of shapeIds) {
  await updateShape(shapeId, { x: newX }); // ❌ Each is a separate transaction
}
```

### **Solution**
Use Firestore `writeBatch` for atomic multi-document updates:

```javascript
// GOOD: Atomic batch write
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';

async function batchUpdateShapes(shapeIds, property, value) {
  const batch = writeBatch(db);
  
  for (const shapeId of shapeIds) {
    const shapeRef = doc(db, 'shapes', shapeId);
    batch.update(shapeRef, {
      [property]: value,
      updatedAt: serverTimestamp() // Same timestamp for all
    });
  }
  
  await batch.commit(); // Single atomic operation
}
```

### **Prevention**
- Always use `writeBatch` for multi-shape updates
- Add retry logic for batch failures
- Implement optimistic UI updates with rollback on error

---

## **Bug #2: Mixed Value Detection Breaks with Null/Undefined** 🟡

### **Description**
When shapes have `null`, `undefined`, or missing properties, mixed value detection fails:

```javascript
shapes = [
  { x: 100, y: 200 },
  { x: 100, y: null },    // ❌ null
  { x: 100 }               // ❌ undefined
]

detectMixedValue(shapes, 'y') // Should return { isMixed: true }
```

### **Root Cause**
```javascript
// BAD: Doesn't handle null/undefined
const allSame = shapes.every(s => s[property] === firstValue);
// null === undefined is false, but both are "missing"
```

### **Solution**
```javascript
// GOOD: Normalize null/undefined before comparison
export function detectMixedValue(shapes, property) {
  if (!shapes || shapes.length === 0) {
    return { isMixed: false, commonValue: undefined };
  }
  
  // Normalize: treat null/undefined as the same
  const normalize = (val) => (val === null || val === undefined) ? undefined : val;
  
  const firstValue = normalize(shapes[0][property]);
  const allSame = shapes.every(s => normalize(s[property]) === firstValue);
  
  return {
    isMixed: !allSame,
    commonValue: allSame ? firstValue : undefined
  };
}
```

### **Prevention**
- Always normalize null/undefined in comparisons
- Set default values when creating shapes
- Add validation for required properties

---

## **Bug #3: Performance Degradation with 50+ Shapes** 🟡

### **Description**
Batch operations on large selections (50+ shapes) cause:
- UI freezing during updates
- Slow Firestore write operations
- Poor user experience

### **Reproduction Steps**
1. Select 100 shapes
2. Change color via Properties Panel
3. Observe lag and UI blocking

### **Root Cause**
```javascript
// BAD: Processes all shapes synchronously
for (const shapeId of shapeIds) {
  await updateShape(shapeId, updates); // Blocks UI thread
}
```

### **Solution**
Implement chunked batch updates with progress indicator:

```javascript
// GOOD: Chunked batch processing
async function batchUpdateShapesChunked(shapeIds, property, value, onProgress) {
  const CHUNK_SIZE = 25; // Firestore batch limit is 500
  const chunks = [];
  
  // Split into chunks
  for (let i = 0; i < shapeIds.length; i += CHUNK_SIZE) {
    chunks.push(shapeIds.slice(i, i + CHUNK_SIZE));
  }
  
  // Process chunks sequentially
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const batch = writeBatch(db);
    
    for (const shapeId of chunk) {
      const shapeRef = doc(db, 'shapes', shapeId);
      batch.update(shapeRef, {
        [property]: value,
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    onProgress?.((i + 1) / chunks.length); // Update progress bar
  }
}
```

### **Prevention**
- Chunk operations for 25+ shapes
- Show progress indicator for large batches
- Use `requestIdleCallback` for non-urgent updates
- Debounce rapid property changes

---

## **Bug #4: Undo/Redo Doesn't Group Batch Operations** 🟡

### **Description**
When batch-updating 5 shapes, pressing Undo should revert all 5 shapes, not one at a time.

**Current Behavior** (Bug):
```
1. Batch update 5 shapes' color to red
2. Press Undo
3. Only 1 shape reverts to original color ❌
4. Need to press Undo 5 more times ❌
```

**Expected Behavior**:
```
1. Batch update 5 shapes' color to red
2. Press Undo
3. All 5 shapes revert to original colors ✅
```

### **Root Cause**
`useHistory.js` records individual shape updates, not grouped operations:

```javascript
// BAD: Records each shape separately
for (const shapeId of shapeIds) {
  recordOperation(createModifyOperation(shapeId, oldValue, newValue));
}
// Result: 5 separate history entries
```

### **Solution**
Add `BATCH_MODIFY` operation type to group batch operations:

```javascript
// historyOperations.js
export const OPERATION_TYPES = {
  CREATE: 'CREATE',
  DELETE: 'DELETE',
  MOVE: 'MOVE',
  MODIFY: 'MODIFY',
  BATCH_MODIFY: 'BATCH_MODIFY' // NEW
};

export function createBatchModifyOperation(shapeIds, property, oldValues, newValue) {
  return {
    type: OPERATION_TYPES.BATCH_MODIFY,
    shapeIds,
    property,
    oldValues, // Map of shapeId -> oldValue
    newValue,
    timestamp: Date.now()
  };
}
```

```javascript
// useHistory.js - Handle BATCH_MODIFY in restoreOperation
case OPERATION_TYPES.BATCH_MODIFY: {
  if (forward) {
    // Redo: Apply newValue to all shapes
    for (const shapeId of operation.shapeIds) {
      await canvasAPI.update(shapeId, { [operation.property]: operation.newValue });
    }
  } else {
    // Undo: Restore oldValues for each shape
    for (const shapeId of operation.shapeIds) {
      const oldValue = operation.oldValues[shapeId];
      await canvasAPI.update(shapeId, { [operation.property]: oldValue });
    }
  }
  break;
}
```

### **Prevention**
- Always use `BATCH_MODIFY` for multi-select edits
- Capture old values before batch update
- Test undo/redo with multi-select in every PR

---

## **Bug #5: Text Alignment Breaks with Mixed Shape Types** 🟢

### **Description**
When selecting Rectangle + Text, text alignment buttons appear in Properties Panel. Clicking them tries to apply `align` property to rectangles, causing errors.

### **Reproduction Steps**
1. Select 1 Rectangle + 1 Text
2. Properties Panel shows Typography section
3. Click "Align Center" button
4. Error: Cannot set `align` property on Rectangle

### **Root Cause**
```javascript
// BAD: Applies text properties to all shapes
function MultiSelectTypography({ shapes, onUpdate }) {
  const handleAlign = (alignment) => {
    for (const shape of shapes) {
      onUpdate(shape.id, { align: alignment }); // ❌ Rectangles don't have 'align'
    }
  };
}
```

### **Solution**
Filter shapes by type before applying type-specific properties:

```javascript
// GOOD: Filter by shape type
function MultiSelectTypography({ shapes, onUpdate }) {
  // Only show typography if at least 1 text shape
  const textShapes = shapes.filter(s => s.type === 'text');
  
  if (textShapes.length === 0) return null;
  
  const handleAlign = (alignment) => {
    // Only update text shapes
    for (const shape of textShapes) {
      onUpdate(shape.id, { align: alignment }); // ✅ Only text shapes
    }
  };
  
  return (
    <div className="properties-section">
      <span className="properties-section-title">
        Typography ({textShapes.length} text {textShapes.length === 1 ? 'shape' : 'shapes'})
      </span>
      {/* ... alignment buttons */}
    </div>
  );
}
```

### **Prevention**
- Always filter by `shape.type` before type-specific operations
- Show shape type count in section headers
- Add prop validation (TypeScript interfaces)

---

## **Bug #6: Color Picker Mixed State Doesn't Update** 🟢

### **Description**
When shapes have different colors (Mixed state), changing the color via picker doesn't visually update the swatch until re-selection.

### **Reproduction Steps**
1. Select 2 shapes with different colors (Red, Blue)
2. Color picker shows "Mixed" indicator
3. Change color to Green
4. Color picker still shows "Mixed" instead of Green ❌

### **Root Cause**
```javascript
// BAD: Doesn't re-detect after update
const colorMixed = detectMixedValue(shapes, 'color');
// This only runs on initial render, not after updates
```

### **Solution**
Use `useEffect` to re-calculate mixed state when shapes change:

```javascript
// GOOD: Recalculate on shape updates
function MultiSelectAppearance({ shapes, onUpdate }) {
  const [isMixed, setIsMixed] = useState(false);
  const [commonColor, setCommonColor] = useState(null);
  
  useEffect(() => {
    const { isMixed: mixed, commonValue } = detectMixedValue(shapes, 'color');
    setIsMixed(mixed);
    setCommonColor(commonValue);
  }, [shapes]); // Re-run when shapes change
  
  return (
    <ColorPicker
      value={commonColor}
      showMixedIndicator={isMixed}
      onChange={handleColorChange}
    />
  );
}
```

### **Prevention**
- Use `useEffect` for derived state from props
- Re-calculate mixed values on shape updates
- Add visual feedback during batch operations

---

## **Bug #7: NumberInput Loses Focus During Batch Update** 🟢

### **Description**
When typing in the X position input, the batch update causes the input to lose focus, interrupting typing.

**Scenario**:
```
1. Select 3 shapes
2. Click X input field
3. Type "50" → Input loses focus after "5" ❌
4. Cannot complete typing "50"
```

### **Root Cause**
```javascript
// BAD: Updates immediately on every keystroke
<NumberInput
  value={xValue}
  onChange={(val) => batchUpdate('x', val)} // ❌ Triggers re-render on every key
/>
```

Firestore update causes parent component re-render, unmounting/remounting input.

### **Solution**
Use local state with debounced Firestore write:

```javascript
// GOOD: Local state + debounced updates
function MultiSelectPositionSize({ shapes, onUpdate }) {
  const [localX, setLocalX] = useState(getDisplayValue(shapes, 'x'));
  
  // Debounced Firestore write
  const debouncedUpdate = useMemo(
    () => debounce((property, value) => {
      batchUpdateShapes(shapes.map(s => s.id), property, value, onUpdate);
    }, 300),
    [shapes, onUpdate]
  );
  
  const handleXChange = (val) => {
    setLocalX(val); // Immediate local update
    debouncedUpdate('x', val); // Debounced Firestore write
  };
  
  return (
    <NumberInput
      value={localX}
      onChange={handleXChange}
    />
  );
}
```

### **Prevention**
- Use controlled inputs with local state
- Debounce Firestore writes (300ms minimum)
- Use `onBlur` for final sync instead of `onChange`

---

## **Bug #8: Batch Update Fails Silently on Network Error** 🟡

### **Description**
If Firestore batch write fails due to network error, user sees no error message. Shapes appear updated locally but revert on refresh.

### **Reproduction Steps**
1. Disconnect network
2. Select 5 shapes
3. Change color via Properties Panel
4. No error shown ❌
5. Refresh page → color reverts ❌

### **Root Cause**
```javascript
// BAD: No error handling
async function batchUpdate(shapeIds, property, value) {
  const batch = writeBatch(db);
  // ... setup batch
  await batch.commit(); // ❌ No try/catch
}
```

### **Solution**
Add comprehensive error handling with user feedback:

```javascript
// GOOD: Error handling + user feedback
async function batchUpdateShapes(shapeIds, property, value, onUpdate) {
  try {
    // Optimistic update (immediate local change)
    const oldValues = {};
    for (const shapeId of shapeIds) {
      const shape = shapes.find(s => s.id === shapeId);
      oldValues[shapeId] = shape[property];
      onUpdate(shapeId, { [property]: value }, { local: true }); // Local-only
    }
    
    // Firestore batch write
    const batch = writeBatch(db);
    for (const shapeId of shapeIds) {
      const shapeRef = doc(db, 'shapes', shapeId);
      batch.update(shapeRef, {
        [property]: value,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
    
    return { success: true };
    
  } catch (error) {
    console.error('Batch update failed:', error);
    
    // Rollback optimistic updates
    for (const [shapeId, oldValue] of Object.entries(oldValues)) {
      onUpdate(shapeId, { [property]: oldValue }, { local: true });
    }
    
    // Show user-friendly error
    showToast('Failed to update shapes. Please check your connection.', 'error');
    
    return { success: false, error: error.message };
  }
}
```

### **Prevention**
- Always use try/catch for Firestore operations
- Implement optimistic updates with rollback
- Show toast notifications for errors
- Add retry logic for transient failures

---

## **Bug #9: Mixed Rotation Displays Incorrectly** 🟢

### **Description**
Rotations like 0°, 90°, 180°, 270° display as "Mixed" even though they're all multiples of 90° and could be considered "aligned".

**Scenario**:
```
shapes = [
  { rotation: 0 },
  { rotation: 360 }, // Same as 0°
  { rotation: 720 }  // Same as 0°
]

Display: "Mixed" ❌
Should: 0° ✅ (all normalized to same angle)
```

### **Root Cause**
```javascript
// BAD: Doesn't normalize rotation values
const allSame = shapes.every(s => s.rotation === firstValue);
// 0 !== 360 !== 720 (but they're all the same angle)
```

### **Solution**
Normalize rotation to 0-359° range before comparison:

```javascript
// GOOD: Normalize rotation before comparison
function detectMixedValue(shapes, property) {
  if (property === 'rotation') {
    const normalize = (deg) => ((deg % 360) + 360) % 360; // Handle negatives
    const firstValue = normalize(shapes[0].rotation || 0);
    const allSame = shapes.every(s => normalize(s.rotation || 0) === firstValue);
    
    return {
      isMixed: !allSame,
      commonValue: allSame ? firstValue : undefined
    };
  }
  
  // ... other properties
}
```

### **Prevention**
- Always normalize angles to 0-359° range
- Use modulo operator for circular values
- Consider "close enough" threshold (e.g., ±1°)

---

## **Bug #10: Infinite Loop in Mixed Value Detection** 🔴

### **Description**
If `detectMixedValue` is called inside a component's render (not memoized), it triggers infinite re-renders when shapes update.

### **Reproduction Steps**
1. Select 2 shapes with different X values
2. Component renders, calls `detectMixedValue(shapes, 'x')`
3. Shapes update from Firestore listener
4. Component re-renders, calls `detectMixedValue` again
5. Infinite loop ❌

### **Root Cause**
```javascript
// BAD: Called in render without memoization
function MultiSelectPositionSize({ shapes }) {
  const xMixed = detectMixedValue(shapes, 'x'); // ❌ Runs on every render
  // If this causes a state update, infinite loop
}
```

### **Solution**
Use `useMemo` to memoize expensive calculations:

```javascript
// GOOD: Memoized calculation
function MultiSelectPositionSize({ shapes }) {
  const xMixed = useMemo(
    () => detectMixedValue(shapes, 'x'),
    [shapes] // Only recalculate when shapes change
  );
  
  const yMixed = useMemo(
    () => detectMixedValue(shapes, 'y'),
    [shapes]
  );
  
  // ... use xMixed, yMixed
}
```

### **Prevention**
- Always use `useMemo` for expensive calculations
- Avoid calling functions directly in JSX
- Use React DevTools Profiler to detect unnecessary renders

---

## **Bug #11: Batch Updates Conflict with Real-Time Sync** 🟡

### **Description**
When User A batch-updates shapes, User B sees flickering as individual shape updates stream in from Firestore.

**Scenario**:
```
User A: Batch update 10 shapes' color to red
User B's View:
  - Shape 1 turns red
  - 50ms delay
  - Shape 2 turns red
  - 50ms delay
  - ... (flickering effect ❌)
```

### **Root Cause**
Firestore batch writes don't guarantee atomic delivery to real-time listeners.

### **Solution**
Add batch metadata to track group operations:

```javascript
// Store batch ID in each shape update
const batchId = uuidv4();
const batch = writeBatch(db);

for (const shapeId of shapeIds) {
  const shapeRef = doc(db, 'shapes', shapeId);
  batch.update(shapeRef, {
    [property]: value,
    updatedAt: serverTimestamp(),
    batchId: batchId // NEW: Track batch operations
  });
}

await batch.commit();
```

```javascript
// On receiving side, debounce updates with same batchId
const [pendingBatchUpdates, setPendingBatchUpdates] = useState({});

useEffect(() => {
  const unsubscribe = onSnapshot(shapesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const shape = change.doc.data();
      
      if (shape.batchId) {
        // Debounce batch updates
        setPendingBatchUpdates(prev => ({
          ...prev,
          [shape.batchId]: [...(prev[shape.batchId] || []), shape]
        }));
        
        // Apply all updates from batch after 100ms
        setTimeout(() => {
          applyBatchUpdates(shape.batchId);
        }, 100);
      } else {
        // Apply individual updates immediately
        updateShape(shape);
      }
    });
  });
}, []);
```

### **Prevention**
- Add batch metadata to coordinated operations
- Debounce real-time updates for batch operations
- Consider using Firestore transactions for critical updates

---

## **Bug #12: Color Picker Opens Off-Screen for Bottom Shapes** 🟢

### **Description**
When editing shapes near the bottom of the Properties Panel, the color picker modal opens off-screen (below viewport).

### **Reproduction Steps**
1. Scroll Properties Panel to bottom
2. Click color picker for Appearance section
3. Color picker modal appears below viewport ❌
4. User cannot see/select colors

### **Root Cause**
```javascript
// BAD: Fixed positioning without viewport checks
.color-picker-modal {
  position: absolute;
  top: 40px; // Always opens below button
  left: 0;
}
```

### **Solution**
Dynamically position modal based on available space:

```javascript
// GOOD: Smart positioning
function ColorPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 40, left: 0 });
  const buttonRef = useRef(null);
  
  const togglePicker = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If not enough space below, open above
      if (spaceBelow < 300 && spaceAbove > 300) {
        setPosition({ bottom: 40, left: 0 });
      } else {
        setPosition({ top: 40, left: 0 });
      }
    }
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="color-picker-container" ref={buttonRef}>
      <button onClick={togglePicker}>...</button>
      {isOpen && (
        <div className="color-picker-modal" style={position}>
          {/* ... */}
        </div>
      )}
    </div>
  );
}
```

### **Prevention**
- Always check viewport bounds for modals/popovers
- Use smart positioning logic
- Consider using library like Popper.js for complex positioning

---

## 📊 **Bug Priority Matrix**

| Bug # | Severity | Likelihood | Priority | Fix Time |
|-------|----------|------------|----------|----------|
| #1 | 🔴 Critical | High | **P0** | 2h |
| #4 | 🟡 Major | High | **P0** | 3h |
| #8 | 🟡 Major | Medium | **P1** | 2h |
| #2 | 🟡 Major | Low | **P1** | 1h |
| #3 | 🟡 Major | Medium | **P1** | 2h |
| #11 | 🟡 Major | Medium | **P2** | 3h |
| #5 | 🟢 Minor | Low | **P2** | 1h |
| #6 | 🟢 Minor | Medium | **P2** | 1h |
| #7 | 🟢 Minor | High | **P2** | 1h |
| #9 | 🟢 Minor | Low | **P3** | 30m |
| #10 | 🔴 Critical | Low | **P3** | 30m |
| #12 | 🟢 Minor | Low | **P3** | 1h |

**Total Prevention Time**: ~18 hours  
**Critical Bugs to Address First**: #1, #4, #8  

---

## ✅ **Quality Gates**

Before merging PR #26, ensure:
- [ ] All P0 bugs prevented (writeBatch, grouped undo)
- [ ] All P1 bugs prevented (error handling, mixed values)
- [ ] Comprehensive test coverage (see Testing Guide)
- [ ] Performance benchmarks met (<1s for 10 shapes)
- [ ] Cross-browser testing completed
- [ ] Real-time multi-user testing completed

---

**Document Updated**: October 19, 2025  
**Next Review**: During PR #26 implementation

