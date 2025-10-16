# Selection Bug Analysis - "Cannot Select Different Shape"

## Problem Statement

After implementing the multi-select drag fix, a new bug appeared:
**"Sometimes when trying to select a different shape it will not select no matter how many times I click."**

This is a NEW bug that didn't exist before our recent changes.

---

## Root Causes Identified

### Root Cause #1: Async Timing on `isDraggingShape` Reset ⚠️

**Location**: `Canvas.jsx` line 1027

**The Issue**:
```javascript
async function handleShapeDragEnd(data) {
  // Multi-select drag
  if (activeDragRef.current === 'multi-select' && initialPositionsRef.current) {
    // ... (lines 947-977)
    await updateShapeImmediate(id, updates);  // ← Firebase write (async)
    // ...
    await unlockShape(id);  // ← More async operations
    // ...
  } else {
    // Single shape drag
    await updateShapeImmediate(data.id, updates);  // ← Firebase write (async)
    await unlockShape(data.id);  // ← More async operations
  }
  
  setIsDraggingShape(false);  // ← ONLY set AFTER all async completes!
}
```

**Timing Flow**:
```
User finishes dragging shapes A, B, C
  ↓
Releases mouse → handleShapeDragEnd()
  ↓
Firebase writes start (100-500ms depending on network)
  ↓
User quickly clicks shape D
  ↓
handleShapeSelect(D) executes
  ↓
Check: if (isDraggingShape) return;  // ← STILL TRUE!
  ↓
Function returns early, shape D is NOT selected
  ↓
(Meanwhile, Firebase writes complete)
  ↓
setIsDraggingShape(false) finally executes
  ↓
Too late - user's click was already ignored
```

**Network Latency Impact**:
- Good connection: 50-100ms delay
- Average connection: 100-300ms delay
- Slow connection: 300-1000ms delay
- Offline/poor connection: Can hang indefinitely

**This Explains**: "Sometimes" behavior - depends on network speed and how quickly user clicks

---

### Root Cause #2: Missing "Click vs Drag" Intent Detection ⚠️

**Location**: `Canvas.jsx` lines 483-486

**The Issue**:
Our new fix preserves multi-select when clicking a selected shape, but doesn't distinguish between:
1. **Click with intent to drag** → Should preserve multi-select ✅
2. **Click with intent to isolate** → Should select only that shape ❌

**Current Code**:
```javascript
if (isMultiSelect && isSelected(shapeId)) {
  console.log('[MULTI-SELECT FIX] Preserving multi-select on click of selected shape:', shapeId);
  return; // ← Preserves multi-select ALWAYS, even for pure clicks!
}
```

**Problem Scenario**:
```
User has shapes A, B, C selected
User clicks shape A (but doesn't drag - just a click)
  ↓
Our code: Preserves multi-select [A, B, C]
Figma behavior: Would isolate to [A] after determining no drag intent
  ↓
User now wants to select shape D
User clicks shape D
  ↓
Check: if (isMultiSelect && isSelected(D)) → FALSE
Should work! But...
  ↓
If isDraggingShape is still TRUE from previous operation → Click blocked!
```

**This Creates a "Stuck" State**:
- User clicks a selected shape (preserves multi-select)
- Doesn't drag
- Now can't select anything else because clicks are being blocked

---

### Root Cause #3: No Escape Hatch for Locked State ⚠️

**The Issue**: If `isDraggingShape` gets stuck `true` (due to error, race condition, etc.), there's no way to recover without refreshing.

**Potential Stuck Scenarios**:
1. Error during `handleShapeDragEnd` → never reaches `setIsDraggingShape(false)`
2. Network failure during Firebase write → `await` hangs → flag never reset
3. React unmount during drag → cleanup never runs

---

## How Figma Handles This

### 1. Intent Detection (Primary Pattern)

**Figma's Approach**:
```
User clicks selected shape in multi-select
  ↓
onClick fires
  ↓
Figma WAITS (doesn't commit selection change yet)
  ↓
After ~100ms OR dragDistance threshold (3px):
  ├─ If drag detected → Preserve multi-select
  └─ If no drag (pure click) → Isolate to single shape
```

**Key Insight**: Figma **defers** the selection decision until intent is clear.

**Implementation Pattern**:
```javascript
// Pseudo-code of Figma's pattern
let pendingSelectionChange = null;
let clickTimer = null;

function onShapeClick(shapeId) {
  if (isMultiSelect && isSelected(shapeId)) {
    // Don't commit change yet - wait for intent
    pendingSelectionChange = { type: 'isolate', shapeId };
    clickTimer = setTimeout(() => {
      // If we get here, no drag happened → commit isolation
      setSelection([shapeId]);
      pendingSelectionChange = null;
    }, 100);
  }
}

function onDragStart(shapeId) {
  // Drag detected - cancel pending isolation
  if (clickTimer) {
    clearTimeout(clickTimer);
    pendingSelectionChange = null;
  }
  // Multi-select is preserved (do nothing)
}
```

---

### 2. Immediate Flag Reset (Secondary Pattern)

**Figma's Approach**:
```javascript
async function handleShapeDragEnd(data) {
  // ✅ Set flag IMMEDIATELY (synchronous)
  setIsDraggingShape(false);
  
  // Then do async operations
  await updateShape(data);
  await unlockShape(data.id);
}
```

**Benefits**:
- User can immediately interact after releasing mouse
- No latency-dependent blocking
- Async operations run in background without blocking UI

**Trade-off**:
- User could theoretically start another drag before previous one finishes saving
- Need to handle overlapping operations gracefully

---

### 3. Drag Distance Threshold (Already Implemented)

**Pattern**: Don't consider it a "drag" unless mouse moves > 3px

**Our Code** (Shape.jsx line 633):
```javascript
dragDistance: 3, // ✅ Already have this!
```

**How It Works**:
- User clicks shape → onClick fires
- Mouse moves < 3px → No drag event fires → Just a click
- Mouse moves > 3px → onDragStart fires → It's a drag

**This helps**, but doesn't solve the timing issue alone.

---

### 4. Error Recovery & Escape Hatches

**Figma's Patterns**:
1. **Escape Key**: Always cancels current operation and resets state
2. **Timeout Guards**: If drag state > 5 seconds, auto-reset (likely a bug)
3. **Error Boundaries**: Catch errors and reset UI state
4. **Ref-based Flags**: Use refs for synchronous flag access

---

## Solution Options

### Option 1: Immediate Flag Reset ⭐ RECOMMENDED

**What**: Move `setIsDraggingShape(false)` to TOP of `handleShapeDragEnd`, before async operations

**Pros**:
- ✅ Fixes the blocking issue immediately
- ✅ Simple, one-line move
- ✅ Minimal risk
- ✅ Matches Figma pattern
- ✅ User can immediately interact after releasing mouse

**Cons**:
- ⚠️ User could theoretically start another drag before previous finishes saving
- ⚠️ Need to ensure overlapping drags don't corrupt state

**Code**:
```javascript
async function handleShapeDragEnd(data) {
  // ✅ IMMEDIATE: Set flag synchronously FIRST
  setIsDraggingShape(false);
  
  // Check if this was a multi-select drag
  if (activeDragRef.current === 'multi-select' && initialPositionsRef.current) {
    // ... async operations (Firebase writes, unlocking)
  } else {
    // ... async operations
  }
  
  // Flag already false - user can interact immediately
}
```

**Why This Is Safe**:
- We already use `activeDragRef.current` to track which operation is in progress
- `activeDragRef` is only cleared AFTER async operations complete
- This prevents overlapping drags from corrupting state
- `isDraggingShape` is just a UI lock - doesn't need to wait for persistence

---

### Option 2: Intent Detection with Timeout ⭐ RECOMMENDED (with Option 1)

**What**: Defer selection isolation when clicking selected shape, cancel if drag detected

**Pros**:
- ✅ Matches Figma's exact behavior
- ✅ Best UX (smart intent detection)
- ✅ Solves "stuck in multi-select" problem

**Cons**:
- ⚠️ More complex implementation
- ⚠️ Requires timeout management
- ⚠️ Need cleanup on unmount

**Code**:
```javascript
// Add new ref for pending selection
const pendingSelectionRef = useRef(null);

function handleShapeSelect(shapeId, event) {
  if (isDraggingShape) return;
  
  const isShiftPressed = event?.evt?.shiftKey;
  
  if (isShiftPressed) {
    toggleSelection(shapeId);
  } else {
    // If clicking an already-selected shape in multi-select
    if (isMultiSelect && isSelected(shapeId)) {
      // DEFER the isolation - wait to see if user drags
      pendingSelectionRef.current = setTimeout(() => {
        // If we get here, no drag happened → isolate
        setSelection([shapeId]);
        pendingSelectionRef.current = null;
      }, 150); // 150ms window to detect drag intent
      return;
    }
    // Normal case: different shape clicked
    setSelection([shapeId]);
  }
  
  if (mode !== 'move') {
    setMode('move');
  }
}

function handleShapeDragStart(shapeId) {
  // Cancel pending selection isolation (drag intent detected!)
  if (pendingSelectionRef.current) {
    clearTimeout(pendingSelectionRef.current);
    pendingSelectionRef.current = null;
  }
  
  setIsDraggingShape(true);
  
  // ... rest of drag start logic
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (pendingSelectionRef.current) {
      clearTimeout(pendingSelectionRef.current);
    }
  };
}, []);
```

**Timing**:
- 150ms window is standard (matches browser double-click detection)
- Balances responsiveness vs drag detection

---

### Option 3: Add Escape Key Reset

**What**: Allow user to press Escape to force-reset all drag/selection state

**Pros**:
- ✅ User escape hatch for stuck states
- ✅ Matches all design tools
- ✅ Simple fallback

**Cons**:
- ❌ Doesn't fix the root cause
- ❌ Users shouldn't need to use this often

**Code**:
```javascript
// In keyboard handler
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    // Force reset all interaction state
    setIsDraggingShape(false);
    activeDragRef.current = null;
    initialPositionsRef.current = null;
    if (pendingSelectionRef.current) {
      clearTimeout(pendingSelectionRef.current);
      pendingSelectionRef.current = null;
    }
    console.log('[ESCAPE] Force reset all drag state');
  }
  // ... other keyboard shortcuts
}
```

---

### Option 4: Sync Flag + Ref Pattern

**What**: Use a ref for synchronous checks, useState for re-renders

**Pros**:
- ✅ Synchronous access (no timing issues)
- ✅ Still triggers re-renders when needed

**Cons**:
- ⚠️ More complex state management
- ⚠️ Two sources of truth to keep in sync

**Code**:
```javascript
const [isDraggingShape, setIsDraggingShape] = useState(false);
const isDraggingShapeRef = useRef(false);

function setDragging(value) {
  isDraggingShapeRef.current = value;  // ✅ Synchronous
  setIsDraggingShape(value);           // ✅ Triggers re-render
}

function handleShapeSelect(shapeId, event) {
  // Use ref for immediate check
  if (isDraggingShapeRef.current) return;  // ✅ No timing issues
  // ...
}
```

---

## Recommended Solution: **Combination of Options 1 + 2 + 3**

### Phase 1: Immediate Fix (Option 1)
1. Move `setIsDraggingShape(false)` to top of `handleShapeDragEnd`
2. Test that clicks work immediately after drag

### Phase 2: Intent Detection (Option 2)
1. Add timeout-based intent detection
2. Preserve multi-select only if drag actually happens
3. Isolate selection if no drag within 150ms

### Phase 3: Safety Net (Option 3)
1. Add Escape key handler for force reset
2. Add error boundary to reset state on crashes

---

## Testing Strategy

### Test Case 1: Quick Click After Drag
1. Drag shapes A, B, C
2. Release mouse
3. **IMMEDIATELY** click shape D (< 100ms)
4. **Expected**: Shape D should be selected
5. **Current**: Blocked if Firebase write hasn't completed

### Test Case 2: Click Selected Shape (No Drag)
1. Select shapes A, B, C
2. Click shape A
3. Don't move mouse (pure click)
4. Wait 200ms
5. **Expected**: After timeout, only A should be selected (Figma behavior)
6. **Current**: Multi-select preserved forever

### Test Case 3: Click Selected Shape (With Drag)
1. Select shapes A, B, C
2. Click shape A
3. Drag within 150ms
4. **Expected**: All 3 shapes move together
5. **Current**: Works (our fix is correct for this case!)

### Test Case 4: Escape Key Recovery
1. Get into stuck state (simulate by not resetting flag)
2. Press Escape
3. **Expected**: All state resets, canvas is interactive again
4. **Current**: No escape hatch

### Test Case 5: Network Latency Simulation
1. Throttle network to "Slow 3G" in Chrome DevTools
2. Drag shapes
3. Release mouse
4. Quickly try to select another shape
5. **Expected**: Should work immediately (Option 1 fixes this)
6. **Current**: Blocked for 1-2 seconds

---

## Best Practices from Figma

### 1. Separate UI State from Persistence State
- **UI Lock** (`isDraggingShape`): Controls what user can interact with → Reset immediately
- **Operation State** (`activeDragRef`): Tracks ongoing async operations → Reset after completion

### 2. Intent Detection Over Immediate Action
- Don't commit changes on first event
- Wait for additional context (timing, movement, modifiers)
- Provide 100-150ms window for intent clarification

### 3. Synchronous Flags for Synchronous Checks
- Use refs for immediate, synchronous checks
- Use state for re-renders
- Keep them in sync

### 4. Always Provide Escape Hatches
- Escape key resets state
- Click background resets state
- Timeouts for auto-recovery

### 5. Graceful Degradation
- If async operation fails, UI should still work
- Network issues shouldn't block user interaction
- Background operations shouldn't lock UI

---

## Implementation Priority

**Critical (Do First)**:
1. ✅ Option 1: Immediate flag reset
2. ✅ Option 3: Escape key handler

**Important (Do Next)**:
1. ⭐ Option 2: Intent detection

**Nice to Have**:
1. Option 4: Ref pattern (only if timing issues persist)

---

## Summary

**Root Cause**: `isDraggingShape` flag is reset AFTER async operations, blocking user interaction for 100-1000ms  
**Primary Fix**: Move flag reset to TOP of `handleShapeDragEnd` (synchronous)  
**Secondary Fix**: Add intent detection to distinguish click vs drag  
**Safety Net**: Add Escape key handler for stuck states  
**Result**: Responsive UI that matches Figma's behavior  

The key insight: **UI state (what user can click) must be separate from persistence state (what's being saved)**

