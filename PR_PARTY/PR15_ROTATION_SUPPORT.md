# PR #15: Rotation Support 🔄

**Branch**: `feat/rotation`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: HIGH (Required Transformation)  
**Estimated Time**: 2 hours  
**Risk Level**: LOW  

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Cross-Platform Considerations](#cross-platform-considerations)
4. [Locking Mechanism Integration](#locking-mechanism-integration)
5. [Future-Proofing](#future-proofing)
6. [Implementation Details](#implementation-details)
7. [Testing Strategy](#testing-strategy)
8. [Rollout Plan](#rollout-plan)
9. [Success Criteria](#success-criteria)
10. [Risk Assessment](#risk-assessment)
11. [Bug Tracking](#bug-tracking)

---

## Overview

### Goal
Add rotation transformation to all shapes, enabling users to rotate individual shapes or groups using the Transformer rotation handle or programmatic controls.

### Why This Matters
- **Required for final submission**: Rotation is a mandatory transformation alongside move and resize
- **Complete transformation suite**: Users need move ✅, resize ✅, rotate ❌
- **Multi-select integration**: Group rotation around combined center
- **AI readiness**: AI needs rotation for commands like "rotate the text 45 degrees"
- **Professional UX**: All modern design tools support rotation

### Key Features
- ✅ Add `rotation` field to shape schema (0-359 degrees)
- ✅ Apply rotation transform to all shape types (rect, circle, line, text)
- ✅ Enable Transformer rotation handle
- ✅ Capture rotation value on transform end
- ✅ Real-time sync of rotation across users
- ✅ Group rotation for multi-select (rotate around combined bounding box center)
- ✅ Keyboard shortcuts for rotation (Cmd+], Cmd+[ for 90° increments)
- ✅ Preserve rotation during move and resize
- ✅ Locking mechanism integration

---

## Architecture & Design Decisions

### 1. Rotation Data Model

**Decision**: Store rotation as **degrees** (0-359) in shape document

**Schema Update**:
```javascript
// Firestore shapes collection
{
  id: string,
  type: 'rectangle' | 'circle' | 'line' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,  // NEW: 0-359 degrees, default 0
  color: string,
  // ... other fields
}
```

**Rationale:**
- ✅ Konva uses degrees (matches native API)
- ✅ User-friendly (90° is clearer than 1.57 radians)
- ✅ Easy to validate and normalize (0-359)
- ✅ Consistent with Figma/Sketch conventions

**Alternative Considered**: Radians
- ❌ Less intuitive for users
- ❌ Requires conversion for UI display
- ✅ Only benefit: Math.cos/sin use radians (but conversion is trivial)

### 2. Rotation Origin Point

**Decision**: Rotate around shape **center** for all types

**Implementation**:
```javascript
// For rectangles and text (top-left anchored)
offsetX={shape.width / 2}
offsetY={shape.height / 2}
x={shape.x + shape.width / 2}
y={shape.y + shape.height / 2}
rotation={shape.rotation}

// For circles (already center-anchored)
x={shape.x}
y={shape.y}
rotation={shape.rotation}

// For lines (requires special handling)
// Store rotation separately, apply to group wrapper
```

**Rationale:**
- ✅ Intuitive UX (shapes rotate around their center)
- ✅ Matches Figma/Sketch/Illustrator behavior
- ✅ Works well with Transformer handles
- ✅ Simplifies group rotation calculations

**Edge Case: Lines**
- Lines don't have a "center" in the traditional sense
- Rotation should be around line midpoint
- Store start/end points + rotation value
- Apply rotation transform to Line component

### 3. Konva Transform Application

**Decision**: Use Konva's built-in `rotation` prop + offset props

**Pattern**:
```javascript
// Shape.jsx - Rectangle example
<Rect
  x={shape.x + shape.width / 2}
  y={shape.y + shape.height / 2}
  width={shape.width}
  height={shape.height}
  offsetX={shape.width / 2}
  offsetY={shape.height / 2}
  rotation={shape.rotation || 0}
  fill={shape.color}
  // ... other props
/>
```

**How It Works**:
1. `x`, `y` = Center position of shape
2. `offsetX`, `offsetY` = Draw shape relative to this offset
3. `rotation` = Degrees to rotate around (x, y)

**Result**: Shape draws at top-left corner (x - width/2, y - height/2), rotates around center (x, y)

**Rationale:**
- ✅ Native Konva pattern (well-tested)
- ✅ Works with Transformer automatically
- ✅ GPU-accelerated transforms
- ✅ No manual matrix calculations needed

### 4. Group Rotation

**Decision**: Rotate multi-selected shapes around combined bounding box center

**Algorithm**:
```javascript
function rotateShapesAroundCenter(shapeIds, deltaRotation) {
  // 1. Calculate combined bounding box
  const bbox = calculateBoundingBox(shapes.filter(s => shapeIds.includes(s.id)));
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  // 2. For each shape:
  shapeIds.forEach(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    
    // a) Increase individual rotation
    const newRotation = (shape.rotation + deltaRotation) % 360;
    
    // b) Rotate position around group center
    const dx = shape.x - centerX;
    const dy = shape.y - centerY;
    const angle = deltaRotation * Math.PI / 180;
    const newX = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
    const newY = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // c) Update Firestore
    updateShape(shapeId, {
      x: newX,
      y: newY,
      rotation: newRotation
    });
  });
}
```

**Rationale:**
- ✅ Matches Figma/Illustrator behavior (industry standard)
- ✅ Each shape maintains individual rotation + group rotation
- ✅ Shapes maintain relative positions
- ✅ Works with multi-select Transformer

**Edge Case**: Lines in group rotation
- Lines need special handling (rotate points, not center)
- Defer complex line rotation for now (mark as known limitation)

### 5. Transformer Integration

**Decision**: Enable `rotateEnabled={true}` on Transformer

**Current Code (Single Selection)**:
```javascript
<Transformer
  ref={transformerRef}
  rotateEnabled={false}  // Currently disabled
  boundBoxFunc={(oldBox, newBox) => {
    // Validation logic
  }}
/>
```

**New Code**:
```javascript
<Transformer
  ref={transformerRef}
  rotateEnabled={true}  // ✅ Enable rotation
  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}  // Snap to 45° increments
  boundBoxFunc={(oldBox, newBox) => {
    // Existing validation logic
  }}
/>
```

**Rationale:**
- ✅ Konva Transformer has built-in rotation UI
- ✅ Shows rotation handle above bounding box
- ✅ Supports snap-to-angle (hold Shift for 45° increments)
- ✅ No custom UI needed

### 6. Keyboard Shortcuts

**Decision**: Add rotation shortcuts for power users

**Shortcuts**:
- `Cmd/Ctrl + ]` - Rotate clockwise 90°
- `Cmd/Ctrl + [` - Rotate counter-clockwise 90°
- `Shift + Drag` on rotation handle - Snap to 15° increments (Konva built-in)

**Implementation**:
```javascript
// In Canvas.jsx or useKeyboard.js
useEffect(() => {
  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
      e.preventDefault();
      rotateSelection(90); // Clockwise
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      rotateSelection(-90); // Counter-clockwise
    }
  }
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedShapeIds]);
```

**Rationale:**
- ✅ Matches industry standards (Figma uses Cmd+Shift+R for rotation mode)
- ✅ Fast for power users
- ✅ Common 90° rotations (portrait → landscape)

---

## Cross-Platform Considerations

### Desktop Browsers (Primary Target)
- ✅ Chrome, Firefox, Safari, Edge - All support Konva rotation
- ✅ GPU-accelerated CSS transforms (smooth 60 FPS)
- ✅ Transformer rotation handle works with mouse

### Mobile/Tablet (Future)
- ⚠️ Touch rotation requires two-finger gesture
- ⚠️ Transformer rotation handle is small for touch
- 📝 Defer mobile optimization for now (document as known limitation)
- 💡 Future: Add pinch-to-rotate gesture

### Performance
- ✅ Rotation is a CSS transform (very cheap)
- ✅ No re-rendering on rotation (Konva layer handles it)
- ✅ Debounced Firestore writes during rotation (same as move/resize)

---

## Locking Mechanism Integration

### Single Shape Rotation

**Pattern**:
```javascript
// When Transformer starts rotating
function onTransformStart() {
  const shape = selectedShape;
  
  // Check if shape is locked by another user
  if (shape.lockedBy && shape.lockedBy !== currentUser.uid) {
    console.warn('Shape is locked by another user');
    return; // Cancel transform
  }
  
  // Lock shape for this user
  lockShape(shape.id, currentUser.uid);
}

// When Transformer ends rotating
function onTransformEnd() {
  const shape = selectedShape;
  const node = shapeRef.current;
  
  // Read rotation from Konva node
  const newRotation = node.rotation();
  
  // Update Firestore
  updateShape(shape.id, {
    rotation: newRotation % 360,
    updatedAt: serverTimestamp()
  });
  
  // Unlock shape
  unlockShape(shape.id);
}
```

### Group Rotation

**Pattern**: Same as group move (PR #13 established this)
```javascript
function onGroupRotateStart() {
  // Lock all shapes optimistically (fire-and-forget)
  selectedShapeIds.forEach(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape.lockedBy || shape.lockedBy === currentUser.uid) {
      lockShape(shapeId, currentUser.uid); // Don't await
    }
  });
}

function onGroupRotateEnd() {
  // Update all rotations + positions (orbital rotation)
  const updates = calculateGroupRotation(selectedShapeIds, deltaRotation);
  
  // Batch update Firestore
  Promise.all(
    updates.map(({ shapeId, x, y, rotation }) =>
      updateShape(shapeId, { x, y, rotation })
    )
  );
  
  // Unlock all shapes
  selectedShapeIds.forEach(shapeId => unlockShape(shapeId));
}
```

### Visual Feedback
- ✅ Locked shapes show lock icon (existing)
- ✅ Can't rotate locked shapes
- ✅ Console warning if attempt to rotate locked shape

---

## Future-Proofing

### AI Integration Readiness

**API Method**:
```javascript
// In canvasAPI.js (to be created in PR #18)
export async function rotateShape(shapeId, degrees) {
  const shape = shapes.find(s => s.id === shapeId);
  if (!shape) throw new Error('Shape not found');
  
  const newRotation = (shape.rotation + degrees) % 360;
  await updateShape(shapeId, { rotation: newRotation });
  
  return { success: true, shapeId, rotation: newRotation };
}

export async function setShapeRotation(shapeId, degrees) {
  const shape = shapes.find(s => s.id === shapeId);
  if (!shape) throw new Error('Shape not found');
  
  await updateShape(shapeId, { rotation: degrees % 360 });
  
  return { success: true, shapeId, rotation: degrees % 360 };
}
```

**AI Commands**:
- "Rotate the blue rectangle 45 degrees"
- "Set the text rotation to 90 degrees"
- "Rotate all selected shapes clockwise"

### Extensibility

**Properties Panel (Future PR)**:
```javascript
// Rotation input field
<input
  type="number"
  value={shape.rotation}
  onChange={(e) => updateShape(shape.id, { rotation: e.target.value })}
  min="0"
  max="359"
  step="1"
/>

// Or rotation slider
<input
  type="range"
  value={shape.rotation}
  onChange={(e) => updateShape(shape.id, { rotation: e.target.value })}
  min="0"
  max="359"
/>
```

**Undo/Redo Support (Future PR)**:
```javascript
// Store rotation in history
{
  action: 'rotate',
  shapeId: 'shape-123',
  before: { rotation: 0 },
  after: { rotation: 45 }
}
```

---

## Implementation Details

### Files to Modify

#### 1. `src/utils/constants.js`
```javascript
// Add default rotation
export const SHAPE_DEFAULTS = {
  rectangle: {
    width: 100,
    height: 100,
    rotation: 0  // NEW
  },
  circle: {
    radius: 50,
    rotation: 0  // NEW
  },
  line: {
    strokeWidth: 2,
    rotation: 0  // NEW
  },
  text: {
    fontSize: 16,
    fontWeight: 'normal',
    rotation: 0  // NEW
  }
};
```

#### 2. `src/services/shapes.js`
**No changes needed** - rotation is just another property, existing functions handle it

#### 3. `src/hooks/useShapes.js`
**Minor updates**:
```javascript
// Ensure rotation is included when creating shapes
function createShape(shapeData) {
  const shape = {
    ...shapeData,
    rotation: shapeData.rotation || 0,  // Default to 0
    createdAt: serverTimestamp(),
    // ...
  };
  return addShapeToFirestore(shape);
}
```

#### 4. `src/components/Canvas/Shape.jsx`
**MAJOR UPDATES** - Apply rotation to all shape types

**Before (Rectangle)**:
```javascript
case 'rectangle':
  return (
    <Rect
      ref={shapeRef}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.color}
      stroke={isSelected ? SELECTION_COLOR : undefined}
      strokeWidth={isSelected ? SELECTION_STROKE_WIDTH : 0}
      onClick={onSelect}
      onTap={onSelect}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
```

**After (Rectangle with Rotation)**:
```javascript
case 'rectangle':
  return (
    <Rect
      ref={shapeRef}
      x={shape.x + shape.width / 2}        // NEW: Center position
      y={shape.y + shape.height / 2}      // NEW: Center position
      width={shape.width}
      height={shape.height}
      offsetX={shape.width / 2}           // NEW: Draw offset
      offsetY={shape.height / 2}          // NEW: Draw offset
      rotation={shape.rotation || 0}      // NEW: Apply rotation
      fill={shape.color}
      stroke={isSelected ? SELECTION_COLOR : undefined}
      strokeWidth={isSelected ? SELECTION_STROKE_WIDTH : 0}
      onClick={onSelect}
      onTap={onSelect}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        // Update to use offsetX/offsetY coords
        const x = e.target.x() - shape.width / 2;
        const y = e.target.y() - shape.height / 2;
        onDragEnd(e, x, y);
      }}
    />
  );
```

**Circle (Special Case - Already Center-Anchored)**:
```javascript
case 'circle':
  return (
    <Circle
      ref={shapeRef}
      x={shape.x}  // Already center
      y={shape.y}  // Already center
      radius={shape.width / 2}
      rotation={shape.rotation || 0}  // NEW: Add rotation
      fill={shape.color}
      // ... other props same
    />
  );
```

**Text**:
```javascript
case 'text':
  return (
    <Text
      ref={shapeRef}
      x={shape.x + shape.width / 2}      // NEW: Center position
      y={shape.y + shape.height / 2}    // NEW: Center position
      text={shape.text}
      fontSize={shape.fontSize}
      fontStyle={shape.fontWeight === 'bold' ? 'bold' : 'normal'}
      fill={shape.color}
      offsetX={shape.width / 2}         // NEW: Draw offset
      offsetY={shape.height / 2}        // NEW: Draw offset
      rotation={shape.rotation || 0}    // NEW: Apply rotation
      // ... other props
    />
  );
```

**Line (Requires Thought)**:
```javascript
case 'line':
  // Lines are tricky - they don't have offsetX/offsetY
  // Solution: Wrap in Group, rotate the group
  return (
    <Group
      ref={shapeRef}
      x={(shape.x1 + shape.x2) / 2}     // Midpoint X
      y={(shape.y1 + shape.y2) / 2}     // Midpoint Y
      rotation={shape.rotation || 0}    // Rotate group
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Line
        points={[
          shape.x1 - (shape.x1 + shape.x2) / 2,  // Relative to group
          shape.y1 - (shape.y1 + shape.y2) / 2,
          shape.x2 - (shape.x1 + shape.x2) / 2,
          shape.y2 - (shape.y1 + shape.y2) / 2
        ]}
        stroke={shape.color}
        strokeWidth={shape.strokeWidth || 2}
        hitStrokeWidth={20}
      />
      {/* Render selection border, anchors if needed */}
    </Group>
  );
```

#### 5. `src/components/Canvas/Canvas.jsx`

**Enable Transformer Rotation**:
```javascript
<Transformer
  ref={transformerRef}
  rotateEnabled={true}  // Changed from false
  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
  boundBoxFunc={(oldBox, newBox) => {
    // Existing validation
    if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
      return oldBox;
    }
    return newBox;
  }}
/>
```

**Add Transform End Handler**:
```javascript
useEffect(() => {
  if (!transformerRef.current) return;
  
  const transformer = transformerRef.current;
  
  transformer.on('transformend', () => {
    const nodes = transformer.nodes();
    if (nodes.length === 0) return;
    
    nodes.forEach(node => {
      const shapeId = node.id();
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) return;
      
      // Read transformed values
      const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation() % 360,  // NEW: Capture rotation
        updatedAt: serverTimestamp()
      };
      
      // Handle width/height if resized
      if (shape.type === 'rectangle' || shape.type === 'text') {
        updates.width = node.width() * node.scaleX();
        updates.height = node.height() * node.scaleY();
      }
      
      // Update Firestore
      updateShape(shapeId, updates);
      
      // Reset scale (we stored width/height)
      node.scaleX(1);
      node.scaleY(1);
    });
    
    // Unlock shapes
    if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => unlockShape(id));
    }
  });
  
  return () => {
    transformer.off('transformend');
  };
}, [shapes, selectedShapeIds, updateShape, unlockShape]);
```

**Add Keyboard Shortcuts**:
```javascript
// In Canvas.jsx or new useKeyboard hook
useEffect(() => {
  function handleKeyDown(e) {
    // ... existing shortcuts (V, M, D, Escape, Delete)
    
    // NEW: Rotation shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
      e.preventDefault();
      rotateSelection(90);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      rotateSelection(-90);
    }
  }
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedShapeIds, shapes]);

function rotateSelection(deltaDegrees) {
  if (selectedShapeIds.length === 0) return;
  
  selectedShapeIds.forEach(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const newRotation = (shape.rotation + deltaDegrees) % 360;
    updateShape(shapeId, { rotation: newRotation });
  });
}
```

---

## Testing Strategy

### Manual Testing Checklist

#### Single Shape Rotation
- [ ] Click rectangle → Transformer appears with rotation handle
- [ ] Drag rotation handle → Shape rotates smoothly
- [ ] Release → Rotation persists and syncs to other users
- [ ] Repeat for circle, line, text
- [ ] Check rotation handle position (should be above bounding box)
- [ ] Verify 60 FPS during rotation

#### Keyboard Shortcuts
- [ ] Select shape → Press Cmd+] → Rotates 90° clockwise
- [ ] Press Cmd+[ → Rotates 90° counter-clockwise
- [ ] Verify multiple presses accumulate rotation
- [ ] Test on both Mac (Cmd) and Windows (Ctrl)

#### Group Rotation
- [ ] Select 2+ shapes → Transformer shows combined bounding box
- [ ] Drag rotation handle → All shapes rotate around group center
- [ ] Verify shapes maintain relative positions
- [ ] Verify each shape's individual rotation updates
- [ ] Test with 5+ shapes

#### Rotation Snapping
- [ ] Hold Shift while rotating → Snaps to 45° increments
- [ ] Release Shift → Free rotation
- [ ] Verify snap indicators appear

#### Locking Integration
- [ ] User A selects shape → User B tries to rotate → Should fail
- [ ] User A rotates shape → Lock acquired → Lock released on end
- [ ] User A rotates group → All shapes locked during rotation

#### Real-Time Sync
- [ ] Open 2 browser windows
- [ ] User A rotates shape → User B sees rotation in <100ms
- [ ] User B refreshes page → Rotation persists
- [ ] Verify no visual glitches during sync

#### Edge Cases
- [ ] Rotate shape multiple times → Rotation wraps at 360° (becomes 0°)
- [ ] Rotate shape to exactly 360° → Stored as 0°
- [ ] Rotate while zoomed in/out → Rotation handle scales correctly
- [ ] Rotate very small shape → Handle still usable
- [ ] Rotate locked shape → Shows warning, no rotation

#### Shape-Specific Testing
- [ ] **Rectangle**: Rotates around center, stays rectangular
- [ ] **Circle**: Rotates (visually no change, but value updates)
- [ ] **Line**: Rotates around midpoint, endpoints move correctly
- [ ] **Text**: Rotates around text center, stays readable

#### Performance Testing
- [ ] Rotate shape with 100+ other shapes on canvas → 60 FPS
- [ ] Rotate group of 10+ shapes → 60 FPS
- [ ] Continuous rotation (hold and drag) → Smooth, no jitter

#### Cross-Browser Testing
- [ ] Chrome: Rotation works smoothly
- [ ] Firefox: Rotation works smoothly
- [ ] Safari: Rotation works smoothly
- [ ] Edge: Rotation works smoothly

---

## Rollout Plan

### Phase 1: Schema & Data Model (30 min)
```bash
git checkout -b feat/rotation
```

**Tasks**:
1. Update `constants.js` with rotation defaults
2. Update `useShapes.js` to include rotation in create/update
3. Test: Create new shape → rotation defaults to 0
4. Commit: `feat: add rotation field to shape schema`

### Phase 2: Single Shape Rotation UI (45 min)

**Tasks**:
1. Update `Shape.jsx`:
   - Add offsetX/offsetY for rectangles and text
   - Add rotation prop for all types
   - Handle line rotation with Group wrapper
2. Update `Canvas.jsx`:
   - Enable `rotateEnabled={true}` on Transformer
   - Add `rotationSnaps` array
3. Test: Manual rotation with Transformer
4. Commit: `feat: enable rotation for all shape types`

### Phase 3: Rotation Persistence (15 min)

**Tasks**:
1. Add `transformend` handler in `Canvas.jsx`
2. Capture `node.rotation()` value
3. Write to Firestore
4. Test: Rotation persists and syncs
5. Commit: `feat: persist and sync rotation to Firestore`

### Phase 4: Keyboard Shortcuts (15 min)

**Tasks**:
1. Add keyboard listeners in `Canvas.jsx`
2. Implement `rotateSelection()` function
3. Test: Cmd+] and Cmd+[ rotate shapes
4. Commit: `feat: add keyboard shortcuts for rotation`

### Phase 5: Locking Integration (10 min)

**Tasks**:
1. Verify locking works with rotation (should work automatically)
2. Test: Locked shapes can't be rotated
3. Add console warning if attempted
4. Commit: `fix: integrate rotation with locking mechanism`

### Phase 6: Testing & Bug Fixes (30 min)

**Tasks**:
1. Run through full manual testing checklist
2. Test with 2 users in different browsers
3. Fix any bugs discovered
4. Performance test with 100+ shapes
5. Commit: `test: verify rotation works across all scenarios`

### Phase 7: Documentation & Cleanup (15 min)

**Tasks**:
1. Update README with rotation shortcuts
2. Add JSDoc comments to new functions
3. Clean up console logs
4. Final commit: `docs: document rotation feature`

### Phase 8: Merge & Deploy (10 min)

```bash
git push origin feat/rotation
# Create PR, review, merge to main
git checkout main
git pull origin main
npm run build
firebase deploy
```

**Total Estimated Time**: 2 hours 30 minutes

---

## Success Criteria

### Must Have (Required) ✅
- [ ] Rotation field added to shape schema
- [ ] All 4 shape types support rotation
- [ ] Transformer rotation handle enabled and working
- [ ] Rotation persists to Firestore
- [ ] Real-time sync of rotation across users
- [ ] Group rotation works with multi-select
- [ ] Keyboard shortcuts (Cmd+], Cmd+[) work
- [ ] Locking mechanism prevents rotation of locked shapes
- [ ] 60 FPS maintained during rotation
- [ ] No visual glitches or jitter
- [ ] Cross-browser compatible (Chrome, Firefox, Safari, Edge)

### Nice to Have (Optional) 🎁
- [ ] Rotation snapping to 45° increments (Shift+drag)
- [ ] Rotation angle display during transform
- [ ] Rotation input field in properties panel (future PR)
- [ ] Undo/redo support for rotation (future PR)
- [ ] Mobile touch rotation (two-finger gesture) (future PR)

### Out of Scope ❌
- Advanced rotation features (3D rotation, perspective)
- Rotation animation/easing
- Rotation around custom pivot points
- Rotation with physics/momentum

---

## Risk Assessment

### Technical Risks

**Risk 1: Coordinate System Confusion** 🟡 MEDIUM
- **Issue**: Shapes anchored at top-left, rotation around center requires offset math
- **Impact**: Shapes might jump position when rotation applied
- **Mitigation**: 
  - Use offsetX/offsetY pattern (proven in Konva docs)
  - Test thoroughly with all shape types
  - Handle circles separately (already center-anchored)
- **Contingency**: If bugs arise, create helper function to calculate offsets

**Risk 2: Line Rotation Complexity** 🟡 MEDIUM
- **Issue**: Lines don't have traditional center, use points not width/height
- **Impact**: Rotation might not work intuitively
- **Mitigation**:
  - Wrap line in Group, rotate group
  - Calculate midpoint as rotation center
  - Test with various line angles
- **Contingency**: Defer line rotation to future PR if too complex

**Risk 3: Group Rotation Orbital Math** 🟡 MEDIUM
- **Issue**: Rotating multiple shapes requires orbital position updates + individual rotation
- **Impact**: Complex trigonometry, potential for bugs
- **Mitigation**:
  - Use proven rotation matrix formulas
  - Test with simple 2-shape case first
  - Add extensive logging
- **Contingency**: Start with individual rotation only, defer group rotation

**Risk 4: Performance Degradation** 🟢 LOW
- **Issue**: Rotation calculations might slow down canvas
- **Impact**: FPS drops below 60
- **Mitigation**:
  - Rotation is CSS transform (GPU-accelerated)
  - Debounce Firestore writes (existing pattern)
  - Test with 100+ shapes
- **Contingency**: Optimize by reducing Firestore write frequency

**Risk 5: Real-Time Sync Issues** 🟢 LOW
- **Issue**: Rotation updates might cause visual jumps on other clients
- **Impact**: Jarring UX during collaboration
- **Mitigation**:
  - Use same debouncing as move/resize (proven to work)
  - Test with 2 users rotating simultaneously
- **Contingency**: Increase debounce interval for rotation

### Project Risks

**Risk 1: Scope Creep** 🟢 LOW
- **Issue**: Temptation to add rotation animations, advanced features
- **Impact**: Time overrun, delays AI integration
- **Mitigation**:
  - Stick to success criteria
  - Document nice-to-haves as future work
  - 2-hour time box
- **Contingency**: Skip keyboard shortcuts if behind schedule

**Risk 2: Testing Time** 🟢 LOW
- **Issue**: Thorough testing might take longer than estimated
- **Impact**: Schedule slip
- **Mitigation**:
  - Automated checklist
  - Focus on critical paths first
  - Defer mobile testing
- **Contingency**: Do basic testing now, comprehensive testing in PR #24

---

## Bug Tracking

### Anticipated Bugs (Based on PR #11, #12, #13 Experience)

**Potential Bug #1: Shape Position Jump on First Rotation**
- **Symptom**: Shape jumps to wrong position when rotation applied
- **Likely Cause**: Offset calculations incorrect
- **Prevention**: Test with simple rectangle first, verify math
- **Debugging**: Log x, y, offsetX, offsetY values before/after

**Potential Bug #2: Circle Rotation Not Updating**
- **Symptom**: Circle rotation value changes but visual doesn't change
- **Likely Cause**: Circle looks same at any rotation (expected!)
- **Prevention**: Remember this is cosmetic only, value still updates
- **Solution**: Not a bug, document as expected behavior

**Potential Bug #3: Transformer Handle Position Wrong**
- **Symptom**: Rotation handle appears in wrong place
- **Likely Cause**: Bounding box calculation off due to offset
- **Prevention**: Ensure Transformer updates after shape position changes
- **Debugging**: Call `transformer.forceUpdate()` if needed

**Potential Bug #4: Group Rotation Shapes Drift Apart**
- **Symptom**: Shapes don't maintain relative positions during group rotation
- **Likely Cause**: Orbital rotation math error
- **Prevention**: Test formula with known inputs (90° rotation of simple positions)
- **Debugging**: Add visualization of rotation center point

**Potential Bug #5: Sync Causes Rotation Jitter**
- **Symptom**: Shapes jitter during rotation when other user watches
- **Likely Cause**: Too frequent Firestore updates conflicting with local transform
- **Prevention**: Increase debounce interval for rotation specifically
- **Solution**: Write immediately on transformend, skip during transform

### Bug Documentation Template

When bugs are encountered, document in `PR15_BUG_ANALYSIS.md`:

```markdown
## Bug #X: [Name]

**Severity**: CRITICAL | HIGH | MEDIUM | LOW
**Discovery**: [When/how found]
**Symptoms**: [What user saw]
**Root Cause**: [Technical explanation]
**Failed Attempts**: [What didn't work]
**Solution**: [What worked]
**Prevention**: [How to avoid in future]
**Files Modified**: [List]
**Time to Fix**: [Duration]
```

---

## Notes & Learnings

### Design Decisions Log

**Decision**: Use offsetX/offsetY pattern for rotation
- **Date**: [To be filled]
- **Rationale**: Native Konva pattern, GPU-accelerated, well-documented
- **Alternatives Considered**: Manual matrix transforms (too complex)
- **Outcome**: [To be filled after implementation]

**Decision**: Rotate around shape center
- **Date**: [To be filled]
- **Rationale**: Industry standard (Figma, Sketch, Illustrator)
- **Alternatives Considered**: Rotate around top-left (confusing UX)
- **Outcome**: [To be filled after implementation]

### Implementation Insights

[To be filled during implementation]

---

## Related PRs

**Depends On**:
- ✅ PR #13: Multi-Select (provides group rotation foundation)

**Blocks**:
- PR #17: Layer Management (rotation should work with z-index)
- PR #18+: AI Integration (AI needs rotation API)

**Related**:
- PR #15: Duplicate (should preserve rotation)
- PR #16: Properties Panel (rotation input field)

---

**Status**: 📋 Planning Complete - Ready for Implementation  
**Next Step**: Begin Phase 1 (Schema & Data Model)  
**Estimated Completion**: 2 hours from start  
**Risk Level**: 🟢 LOW (straightforward feature, proven patterns)

