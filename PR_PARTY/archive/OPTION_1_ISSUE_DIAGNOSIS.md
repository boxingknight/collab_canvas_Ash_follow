# Option 1 Issue - Drag End Click Event

## What We're Seeing

From the console logs:
```
[DRAG END] UI lock released immediately  ← Option 1 working
[CANVAS] Updating shape: xwlnmd7jOPnVzkUcxf4v {...}
[SelectionBridge] Selection updated: ► []  ← Selection cleared!
[SelectionBridge] Selection updated: ► []  ← Multiple times!
[SelectionBridge] Selection updated: ► []
```

## Root Cause

**Classic Konva Timing Issue**: When a drag ends, Konva can fire BOTH `dragend` AND `click` events.

**Event Sequence**:
```
User releases mouse after drag
  ↓
Konva fires: onDragEnd
  ↓
handleShapeDragEnd() executes
  ↓
setIsDraggingShape(false)  ← IMMEDIATE reset (our Option 1 fix)
  ↓
Shape's dragEnd handler: e.cancelBubble = true  ← Tries to stop propagation
  ↓
BUT: Konva internally fires a click event after dragEnd
  ↓
Click bubbles to Stage (Canvas background)
  ↓
handleStageClick() executes
  ↓
Checks: if (isDraggingShape) → FALSE! (we just reset it)
  ↓
clearSelection() called
  ↓
Selection cleared repeatedly (React re-renders)
```

## Why Option 1 Created This Problem

**Before Option 1**:
- `isDraggingShape` stayed `true` until AFTER all async operations
- This acted as a protection window (100-1000ms)
- Click events after drag were blocked during this window

**After Option 1**:
- `isDraggingShape` resets immediately
- Protection window removed
- Click events can now clear selection

## The Solution: Timing Guard

Figma and other design tools use a **"just finished drag" guard** with a short timeout.

### Pattern: Post-Drag Click Guard

```javascript
const justFinishedDragRef = useRef(false);

async function handleShapeDragEnd(data) {
  setIsDraggingShape(false);  // Unlock UI immediately
  
  // Set guard to prevent immediate clicks from clearing selection
  justFinishedDragRef.current = true;
  setTimeout(() => {
    justFinishedDragRef.current = false;
  }, 100); // 100ms protection window
  
  // ... rest of drag end logic
}

function handleStageClick(e) {
  if (justFinishedMarqueeRef.current) return;
  if (isDraggingShape) return;
  
  // NEW: Also check if we just finished a drag
  if (justFinishedDragRef.current) {
    console.log('[STAGE CLICK] Blocked - just finished drag');
    return;
  }
  
  if (e.target === e.target.getStage()) {
    clearSelection();
  }
}
```

### Why 100ms?

- Long enough to absorb Konva's post-drag click event
- Short enough to feel instant to users
- Standard timing for event debouncing in design tools

## Implementation

This is a simple addition to Option 1, not a replacement.

**Benefits**:
- ✅ Keeps immediate UI unlock from Option 1
- ✅ Prevents post-drag click from clearing selection
- ✅ Minimal code change
- ✅ Standard pattern used by Figma

**Trade-offs**:
- User must wait 100ms after drag to click background to deselect
- This is actually GOOD UX (prevents accidental deselection)

## Why We Have This Pattern Already

Looking at the code, we ALREADY have `justFinishedMarqueeRef` for the same issue with marquee selection!

```javascript
// In handleStageClick
if (justFinishedMarqueeRef.current) {
  return;  // Don't clear right after marquee
}
```

We just need to add the same pattern for drag!

