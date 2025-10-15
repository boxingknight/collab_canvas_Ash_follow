# PR #17: Layer Management & Z-Index Control 📚

**Branch**: `feat/layer-management`  
**Status**: 📝 Planning Complete - Ready for Implementation  
**Priority**: MEDIUM  
**Estimated Time**: 2-3 hours  
**Risk Level**: LOW

## 📋 Overview

### Goal
Implement layer management system with z-index control, allowing users to control the stacking order of shapes on the canvas.

### Why This Matters
- **Fundamental design tool feature** - Every design tool has layer controls
- **Visual hierarchy** - Users need to control what appears on top
- **Workflow efficiency** - Quick reordering without manual recreation
- **Professional polish** - Expected feature in any canvas tool
- **AI readiness** - AI will need to control layers programmatically

### Key Features
1. **Z-Index Field**
   - Add zIndex property to shape schema
   - Default zIndex = 0
   - Higher numbers render on top

2. **Layer Operations**
   - Bring Forward (increment zIndex by 1)
   - Send Backward (decrement zIndex by 1)
   - Bring to Front (set to max+1)
   - Send to Back (set to min-1)

3. **Keyboard Shortcuts**
   - Cmd/Ctrl+] - Bring Forward
   - Cmd/Ctrl+[ - Send Backward
   - Cmd/Ctrl+Shift+] - Bring to Front
   - Cmd/Ctrl+Shift+[ - Send to Back

4. **Visual Layer List** (Optional - Stretch)
   - Left sidebar showing all shapes
   - Click to select shape
   - Drag to reorder
   - Show shape type icons
   - Highlight selected shapes

## 🎯 Success Criteria

### Must Have (Required)
- ✅ zIndex field added to shape schema (default: 0)
- ✅ Shapes render in correct z-order (sorted by zIndex)
- ✅ Bring Forward operation working
- ✅ Send Backward operation working
- ✅ Bring to Front operation working
- ✅ Send to Back operation working
- ✅ Keyboard shortcuts working (Cmd+], Cmd+[, etc.)
- ✅ Works with single selection
- ✅ Works with multi-selection (all selected shapes move together)
- ✅ Real-time sync across all users
- ✅ Backward compatible (existing shapes default to zIndex 0)

### Nice to Have (Optional)
- ⭐ Visual layer list sidebar
- ⭐ Context menu for layer operations (right-click)
- ⭐ Tooltip showing current z-index on hover
- ⭐ Visual indicator when shapes overlap
- ⭐ Layer name/description field

### Out of Scope (Explicit)
- ❌ Layer groups/folders (too complex)
- ❌ Layer locking (we have shape locking already)
- ❌ Layer visibility toggle (future enhancement)
- ❌ Layer blending modes (advanced feature)
- ❌ Layer effects (shadows, glows, etc.)

## 🏗️ Architecture & Design Decisions

### 1. Z-Index Data Model

**Decision**: Add simple numeric zIndex field to shape schema

**Schema Update:**
```javascript
// Firestore shapes collection
{
  id: string,
  type: 'rectangle' | 'circle' | 'line' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rotation: number,           // Added in PR #15
  zIndex: number,             // NEW - PR #17 (default: 0)
  
  // ... other fields
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lockedBy: string | null,
  lockedAt: Timestamp | null
}
```

**Rationale:**
- Simple numeric index is easy to understand and implement
- No need for complex fractional z-index (Figma pattern)
- Ties and overlaps resolve naturally (render order)
- Easy for AI to manipulate programmatically

**Default Value**: 0 (all existing shapes will have zIndex: 0)

### 2. Rendering Order Strategy

**Decision**: Sort shapes by zIndex before rendering

**Implementation:**
```javascript
// In Canvas.jsx
const sortedShapes = useMemo(() => {
  return [...shapes].sort((a, b) => {
    // Primary sort by zIndex
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    // Secondary sort by creation time (stable sort)
    return a.createdAt - b.createdAt;
  });
}, [shapes]);

// Render sorted shapes
{sortedShapes.map(shape => (
  <Shape key={shape.id} shape={shape} ... />
))}
```

**Rationale:**
- Sort once per render (memoized for performance)
- Stable secondary sort (creation time) for predictability
- No need to change Shape component
- Works with all existing features

### 3. Layer Operation Logic

**Decision**: Create layer operations in useShapes hook

**Four Operations:**
```javascript
// In useShapes.js

// 1. Bring Forward (increment by 1)
async function bringForward(shapeIds) {
  const updates = shapeIds.map(id => {
    const shape = shapes.find(s => s.id === id);
    return { id, zIndex: shape.zIndex + 1 };
  });
  await batchUpdateShapes(updates);
}

// 2. Send Backward (decrement by 1)
async function sendBackward(shapeIds) {
  const updates = shapeIds.map(id => {
    const shape = shapes.find(s => s.id === id);
    return { id, zIndex: Math.max(0, shape.zIndex - 1) }; // Don't go negative
  });
  await batchUpdateShapes(updates);
}

// 3. Bring to Front (set to max + 1)
async function bringToFront(shapeIds) {
  const maxZ = Math.max(...shapes.map(s => s.zIndex));
  const updates = shapeIds.map(id => ({
    id,
    zIndex: maxZ + 1
  }));
  await batchUpdateShapes(updates);
}

// 4. Send to Back (set to min - 1, or 0)
async function sendToBack(shapeIds) {
  const minZ = Math.min(...shapes.map(s => s.zIndex));
  const targetZ = Math.max(0, minZ - 1);
  const updates = shapeIds.map(id => ({
    id,
    zIndex: targetZ
  }));
  await batchUpdateShapes(updates);
}
```

**Rationale:**
- Simple increment/decrement logic
- Batch updates for multi-select performance
- Never go below 0 (keep it simple)
- All operations work with multi-select

### 4. Keyboard Shortcuts Integration

**Decision**: Extend useKeyboard hook (created in PR #16)

**New Shortcuts:**
```javascript
// In useKeyboard.js

// Add to existing keyboard handler
if (isModKey && key === ']') {
  if (e.shiftKey) {
    // Cmd/Ctrl+Shift+] - Bring to Front
    bringToFront(selectedShapeIds);
  } else {
    // Cmd/Ctrl+] - Bring Forward
    bringForward(selectedShapeIds);
  }
  e.preventDefault();
}

if (isModKey && key === '[') {
  if (e.shiftKey) {
    // Cmd/Ctrl+Shift+[ - Send to Back
    sendToBack(selectedShapeIds);
  } else {
    // Cmd/Ctrl+[ - Send Backward
    sendBackward(selectedShapeIds);
  }
  e.preventDefault();
}
```

**Rationale:**
- Matches industry standard (Figma, Sketch, Illustrator)
- Uses existing useKeyboard infrastructure
- Shift key for "extreme" operations (front/back)
- Works naturally with multi-select

### 5. Backward Compatibility

**Decision**: Default zIndex to 0 for all existing shapes

**Implementation:**
```javascript
// In shapes.js service
export async function migrateShapesAddZIndex() {
  const shapesRef = collection(db, 'shapes');
  const snapshot = await getDocs(shapesRef);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    if (doc.data().zIndex === undefined) {
      batch.update(doc.ref, { zIndex: 0 });
    }
  });
  
  await batch.commit();
}

// In Canvas.jsx useEffect (run once on mount)
useEffect(() => {
  migrateShapesAddZIndex().catch(console.error);
}, []);
```

**Rationale:**
- All existing shapes get zIndex: 0
- No visual change (same render order)
- One-time migration, runs automatically
- Future shapes get zIndex: 0 as default

**Alternative (Simpler)**:
- Just set default in shape creation code
- Treat undefined as 0 in sort function
- No migration needed

```javascript
// In sort function
const sortedShapes = [...shapes].sort((a, b) => {
  const aZ = a.zIndex ?? 0;
  const bZ = b.zIndex ?? 0;
  if (aZ !== bZ) return aZ - bZ;
  return a.createdAt - b.createdAt;
});
```

**Recommendation**: Use simpler alternative (treat undefined as 0)

## 🔧 Implementation Details

### Phase 1: Data Model (20 minutes)

**Files to Modify:**
- `src/services/shapes.js`
- `src/hooks/useShapes.js`

**Changes:**

1. **Update shape creation to include zIndex**:
```javascript
// In shapes.js - addShapeToFirestore
export async function addShapeToFirestore(shapeData) {
  const shapeWithDefaults = {
    ...shapeData,
    zIndex: shapeData.zIndex ?? 0, // Default to 0
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null
  };
  
  const docRef = await addDoc(collection(db, 'shapes'), shapeWithDefaults);
  return docRef.id;
}
```

2. **Update constants** (optional):
```javascript
// In utils/constants.js
export const DEFAULT_SHAPE_PROPERTIES = {
  zIndex: 0,
  rotation: 0,
  lockedBy: null,
  lockedAt: null
};
```

### Phase 2: Rendering Order (30 minutes)

**Files to Modify:**
- `src/components/Canvas/Canvas.jsx`

**Changes:**

1. **Add sorted shapes memo**:
```javascript
// In Canvas.jsx, after shapes are loaded
const sortedShapes = useMemo(() => {
  return [...shapes].sort((a, b) => {
    const aZ = a.zIndex ?? 0;
    const bZ = b.zIndex ?? 0;
    if (aZ !== bZ) return aZ - bZ;
    // Stable sort by creation time
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
}, [shapes]);
```

2. **Update rendering to use sortedShapes**:
```javascript
// Replace shapes.map with sortedShapes.map
{sortedShapes.map((shape) => (
  <Shape
    key={shape.id}
    shape={shape}
    isSelected={selectedShapeIds.includes(shape.id)}
    onSelect={handleShapeSelect}
    onDragEnd={handleShapeDragEnd}
    // ... other props
  />
))}
```

3. **Test**: Create shapes, verify they render in creation order (all zIndex=0)

### Phase 3: Layer Operations (45 minutes)

**Files to Modify:**
- `src/hooks/useShapes.js`

**Changes:**

1. **Add layer operation functions**:
```javascript
// In useShapes.js

const bringForward = useCallback(async (shapeIds) => {
  if (!shapeIds || shapeIds.length === 0) return;
  
  try {
    const updates = shapeIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return null;
      return { id, zIndex: (shape.zIndex ?? 0) + 1 };
    }).filter(Boolean);
    
    // Batch update
    await Promise.all(
      updates.map(({ id, zIndex }) =>
        updateShapeInFirestore(id, { zIndex })
      )
    );
  } catch (error) {
    console.error('Failed to bring forward:', error);
  }
}, [shapes]);

const sendBackward = useCallback(async (shapeIds) => {
  if (!shapeIds || shapeIds.length === 0) return;
  
  try {
    const updates = shapeIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return null;
      return { id, zIndex: Math.max(0, (shape.zIndex ?? 0) - 1) };
    }).filter(Boolean);
    
    await Promise.all(
      updates.map(({ id, zIndex }) =>
        updateShapeInFirestore(id, { zIndex })
      )
    );
  } catch (error) {
    console.error('Failed to send backward:', error);
  }
}, [shapes]);

const bringToFront = useCallback(async (shapeIds) => {
  if (!shapeIds || shapeIds.length === 0) return;
  
  try {
    const maxZ = Math.max(...shapes.map(s => s.zIndex ?? 0));
    const targetZ = maxZ + 1;
    
    await Promise.all(
      shapeIds.map(id =>
        updateShapeInFirestore(id, { zIndex: targetZ })
      )
    );
  } catch (error) {
    console.error('Failed to bring to front:', error);
  }
}, [shapes]);

const sendToBack = useCallback(async (shapeIds) => {
  if (!shapeIds || shapeIds.length === 0) return;
  
  try {
    const minZ = Math.min(...shapes.map(s => s.zIndex ?? 0));
    const targetZ = Math.max(0, minZ - 1);
    
    await Promise.all(
      shapeIds.map(id =>
        updateShapeInFirestore(id, { zIndex: targetZ })
      )
    );
  } catch (error) {
    console.error('Failed to send to back:', error);
  }
}, [shapes]);
```

2. **Export new functions**:
```javascript
return {
  shapes,
  addShape,
  updateShape,
  deleteShape,
  deleteShapes, // Added in PR #13
  duplicateShapes, // Added in PR #16
  lockShape,
  unlockShape,
  // NEW in PR #17
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack
};
```

3. **Test**: Manually call functions in console, verify z-order changes

### Phase 4: Keyboard Shortcuts (30 minutes)

**Files to Modify:**
- `src/hooks/useKeyboard.js`
- `src/components/Canvas/Canvas.jsx`

**Changes:**

1. **Update useKeyboard to accept layer operations**:
```javascript
// In useKeyboard.js function signature
export function useKeyboard({
  // ... existing params
  selectedShapeIds,
  // NEW: Layer operations
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack
}) {
  // ... existing code
  
  // Add layer shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // ... existing keyboard handlers
      
      // Layer Management Shortcuts
      const isModKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (isModKey && e.key === ']') {
        if (selectedShapeIds.length === 0) return;
        
        if (e.shiftKey) {
          // Cmd/Ctrl+Shift+] - Bring to Front
          bringToFront(selectedShapeIds);
        } else {
          // Cmd/Ctrl+] - Bring Forward
          bringForward(selectedShapeIds);
        }
        e.preventDefault();
      }
      
      if (isModKey && e.key === '[') {
        if (selectedShapeIds.length === 0) return;
        
        if (e.shiftKey) {
          // Cmd/Ctrl+Shift+[ - Send to Back
          sendToBack(selectedShapeIds);
        } else {
          // Cmd/Ctrl+[ - Send Backward
          sendBackward(selectedShapeIds);
        }
        e.preventDefault();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    // ... existing dependencies
    selectedShapeIds,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack
  ]);
}
```

2. **Update Canvas.jsx to pass layer operations to useKeyboard**:
```javascript
// In Canvas.jsx
useKeyboard({
  // ... existing props
  selectedShapeIds,
  // NEW: Layer operations from useShapes
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack
});
```

3. **Test**: Use keyboard shortcuts, verify shapes change z-order

### Phase 5: Testing & Polish (30 minutes)

**Manual Testing Checklist:**

1. **Basic Operations**:
   - ✅ Create 3 shapes (red rectangle, blue circle, green rectangle)
   - ✅ Select blue circle, press Cmd+]
   - ✅ Verify circle moves forward (on top of one shape)
   - ✅ Press Cmd+] again, verify it's on top of all shapes
   - ✅ Press Cmd+[, verify it moves backward
   - ✅ Press Cmd+Shift+], verify it jumps to front
   - ✅ Press Cmd+Shift+[, verify it jumps to back

2. **Multi-Select**:
   - ✅ Create 5 shapes overlapping
   - ✅ Select 2 shapes (shift-click)
   - ✅ Press Cmd+], verify both move forward together
   - ✅ Press Cmd+Shift+], verify both jump to front

3. **Real-Time Sync**:
   - ✅ Open 2 browser windows
   - ✅ Create overlapping shapes in window 1
   - ✅ Change z-order in window 1
   - ✅ Verify window 2 sees z-order change in real-time

4. **Edge Cases**:
   - ✅ Press Cmd+] with no selection (should do nothing gracefully)
   - ✅ Send shape to back multiple times (should stay at 0, not negative)
   - ✅ Create new shape, verify it has zIndex: 0
   - ✅ Duplicate shape, verify duplicate keeps same zIndex

5. **Backward Compatibility**:
   - ✅ Load existing canvas with old shapes (no zIndex field)
   - ✅ Verify shapes still render correctly
   - ✅ Apply layer operation to old shape, verify it works

6. **Performance**:
   - ✅ Create 100 shapes
   - ✅ Change z-order of shapes
   - ✅ Verify 60 FPS maintained

**Polish Items:**
- Add console.log for debugging layer operations
- Ensure no errors in console
- Clean up any unused imports
- Verify TypeScript-style JSDoc comments

## 🧪 Testing Strategy

### Manual Test Matrix

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Basic Forward | Create 2 shapes, select bottom, Cmd+] | Shape moves on top |
| Basic Backward | Create 2 shapes, select top, Cmd+[ | Shape moves below |
| To Front | Create 3 shapes, select bottom, Cmd+Shift+] | Shape jumps to top |
| To Back | Create 3 shapes, select top, Cmd+Shift+[ | Shape jumps to bottom |
| Multi-Select Forward | Create 3 shapes, select 2, Cmd+] | Both shapes move forward |
| Multi-Select To Front | Create 5 shapes, select 3, Cmd+Shift+] | All 3 jump to front |
| No Selection | Deselect all, press Cmd+] | No error, nothing happens |
| Edge - Multiple Back | Select shape, press Cmd+[ 10 times | zIndex stays at 0 |
| Real-Time Sync | 2 windows, change z-order in one | Other window updates immediately |
| New Shape | Create new shape | Has zIndex: 0 by default |
| Duplicate | Duplicate shape with zIndex 5 | Duplicate has zIndex 5 |
| Backward Compat | Load old shapes without zIndex | Renders correctly, can be reordered |

### Performance Testing

**Target**: Maintain 60 FPS with 500+ shapes during layer operations

**Test**:
1. Create 500 shapes using bulk creation
2. Select 50 shapes
3. Press Cmd+] repeatedly
4. Monitor FPS in Chrome DevTools

**Success Criteria**: FPS stays above 58

### Cross-Platform Testing

| Platform | Browser | Shortcut | Status |
|----------|---------|----------|--------|
| macOS | Chrome | Cmd+] | ✅ |
| macOS | Safari | Cmd+] | ✅ |
| Windows | Chrome | Ctrl+] | ✅ |
| Windows | Firefox | Ctrl+] | ✅ |

## 📦 Rollout Plan

### Pre-Implementation (5 minutes)
1. ✅ Read through this document completely
2. ✅ Review existing useShapes and useKeyboard hooks
3. ✅ Create branch: `git checkout -b feat/layer-management`

### Phase 1: Data Model (20 minutes)
1. Update shapes.js to include zIndex default
2. Test shape creation includes zIndex: 0
3. Commit: "feat: add zIndex field to shape schema"

### Phase 2: Rendering (30 minutes)
1. Add sortedShapes memo in Canvas.jsx
2. Replace shapes with sortedShapes in render
3. Test shapes render in correct order
4. Commit: "feat: sort shapes by zIndex for rendering"

### Phase 3: Operations (45 minutes)
1. Add four layer operations to useShapes
2. Export new functions
3. Test operations manually in console
4. Commit: "feat: add layer management operations"

### Phase 4: Shortcuts (30 minutes)
1. Update useKeyboard with layer shortcuts
2. Pass operations from Canvas to useKeyboard
3. Test all keyboard shortcuts
4. Commit: "feat: add layer management keyboard shortcuts"

### Phase 5: Testing (30 minutes)
1. Run through full test matrix
2. Test with 2 browser windows
3. Test with 100+ shapes
4. Fix any bugs found
5. Commit: "test: verify layer management works across all scenarios"

### Post-Implementation (10 minutes)
1. Update progress.md - mark PR #17 complete
2. Update activeContext.md - document completion
3. Push branch: `git push origin feat/layer-management`
4. Merge to main
5. Deploy to Firebase

**Total Estimated Time**: 2 hours 50 minutes

## 🎨 UI/UX Considerations

### Visual Feedback

**Current**: No visual indication of z-order

**Future Enhancement** (out of scope for this PR):
- Tooltip showing "Layer 5 of 12" on hover
- Context menu showing layer operations
- Layer list sidebar

**For This PR**: Rely on keyboard shortcuts only (minimal UI)

### User Mental Model

**Expected Behavior**:
- Cmd+] moves shape "up" one layer (closer to user)
- Cmd+[ moves shape "down" one layer (away from user)
- Shift modifier = extreme operation (all the way)
- Matches Figma/Sketch/Illustrator conventions

**Actual Behavior**: Matches expectations ✅

## 🚨 Risk Assessment

### Technical Risks

**Risk 1: Sort Performance with Many Shapes** - 🟢 LOW
- **Mitigation**: useMemo ensures sort only runs when shapes change
- **Testing**: Verify 60 FPS with 500+ shapes

**Risk 2: Firestore Write Conflicts** - 🟢 LOW
- **Mitigation**: Use existing locking mechanism (shapes lock during operations)
- **Testing**: Two users change z-order simultaneously

**Risk 3: Z-Index Number Overflow** - 🟢 LOW
- **Mitigation**: JavaScript numbers are 64-bit (max: 2^53), extremely unlikely to overflow
- **Prevention**: If concerned, add z-index compaction function (future)

**Risk 4: Backward Compatibility** - 🟢 LOW
- **Mitigation**: Treat undefined as 0 in sort function
- **Testing**: Load old canvas, verify shapes still work

### Project Risks

**Risk 1: Time Overrun** - 🟡 MEDIUM
- **Estimate**: 2-3 hours
- **Mitigation**: Simple implementation, well-defined scope
- **Impact**: Delays AI work by 2-3 hours

**Risk 2: Scope Creep** - 🟢 LOW
- **Mitigation**: Clearly defined "out of scope" items
- **Prevention**: No layer list sidebar in this PR (stretch goal)

### Mitigation Strategy

1. **Time-box implementation**: If exceeds 3 hours, defer layer list sidebar
2. **Focus on keyboard shortcuts**: Skip UI elements if needed
3. **Leverage existing patterns**: Use useShapes and useKeyboard patterns
4. **Test as you go**: Catch issues early

## ✅ Definition of Done

**Code Complete When**:
- ✅ All four layer operations implemented
- ✅ Keyboard shortcuts working
- ✅ Real-time sync working
- ✅ Multi-select working
- ✅ No console errors
- ✅ 60 FPS maintained

**Testing Complete When**:
- ✅ All manual test cases pass
- ✅ Cross-platform shortcuts tested
- ✅ 2-window real-time sync verified
- ✅ 100+ shapes performance verified

**Documentation Complete When**:
- ✅ progress.md updated
- ✅ activeContext.md updated
- ✅ Code comments added
- ✅ This PR document updated with results

**PR Complete When**:
- ✅ Code committed to branch
- ✅ Merged to main
- ✅ Deployed to Firebase
- ✅ Tested in production

## 🎓 Lessons from Previous PRs

### From PR #13 (Multi-Select)
- ✅ Use optimistic updates for instant feedback
- ✅ Batch operations for performance
- ✅ Test with multi-select from the start

### From PR #15 (Rotation)
- ✅ Simple additive approach (add field, use field)
- ✅ Don't overthink coordinate systems
- ✅ Test backward compatibility early

### From PR #16 (Duplicate)
- ✅ Extend existing hooks (useKeyboard pattern)
- ✅ Clear success criteria prevent scope creep
- ✅ ZERO bugs is achievable with good planning

### Apply to PR #17
- ✅ Keep it simple (just numeric zIndex)
- ✅ Leverage existing patterns (useShapes, useKeyboard)
- ✅ Test backward compatibility immediately
- ✅ Focus on core functionality, defer UI

## 📝 Implementation Notes

### Key Files to Touch
1. `src/services/shapes.js` - Add zIndex default
2. `src/components/Canvas/Canvas.jsx` - Add sortedShapes memo
3. `src/hooks/useShapes.js` - Add 4 layer operations
4. `src/hooks/useKeyboard.js` - Add layer shortcuts

### Key Files NOT to Touch
- `src/components/Canvas/Shape.jsx` - No changes needed
- `src/components/Canvas/RemoteCursor.jsx` - No changes needed
- `src/hooks/useSelection.js` - No changes needed
- Firestore rules - No changes needed

### Estimated Lines of Code
- shapes.js: +5 lines
- Canvas.jsx: +15 lines
- useShapes.js: +80 lines (4 functions)
- useKeyboard.js: +30 lines
- **Total**: ~130 lines of new code

## 🎯 AI Readiness

### Canvas API for AI (Future)

When AI integration begins (PR #18+), these functions will be exposed:

```javascript
// canvasAPI.js (future)
export const canvasAPI = {
  // ... existing operations
  
  // Layer operations (added in PR #17)
  bringForward: (shapeIds) => layerOps.bringForward(shapeIds),
  sendBackward: (shapeIds) => layerOps.sendBackward(shapeIds),
  bringToFront: (shapeIds) => layerOps.bringToFront(shapeIds),
  sendToBack: (shapeIds) => layerOps.sendToBack(shapeIds),
  setZIndex: (shapeId, zIndex) => updateShape(shapeId, { zIndex })
};
```

**AI Function Schemas**:
```javascript
{
  name: 'bringToFront',
  description: 'Brings specified shapes to the top layer',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to bring to front'
      }
    },
    required: ['shapeIds']
  }
}
```

**Example AI Command**:
- "Bring the blue rectangle to the front"
- AI: selectShapesByColor('#0000FF') → bringToFront(resultIds)

**Benefit**: Layer management is now programmable for AI!

## 📊 Success Metrics

### Functional Metrics
- ✅ All 4 layer operations working (100%)
- ✅ Keyboard shortcuts working (100%)
- ✅ Multi-select compatibility (100%)
- ✅ Real-time sync working (100%)

### Performance Metrics
- ✅ 60 FPS maintained with 500+ shapes
- ✅ Z-order sort < 10ms (memoized)
- ✅ Layer operation latency < 100ms

### Quality Metrics
- ✅ Zero console errors
- ✅ Backward compatible (old shapes work)
- ✅ Cross-platform shortcuts working
- ✅ No regression in existing features

### Time Metrics
- ⏱️ **Target**: 2-3 hours
- ⏱️ **Actual**: [To be filled after completion]
- ⏱️ **Bug Count**: [To be filled after completion]

## 🎬 Ready to Start?

**Pre-flight Checklist**:
- ✅ This document reviewed
- ✅ Existing hooks reviewed (useShapes, useKeyboard)
- ✅ Branch created: feat/layer-management
- ✅ Clear on scope (no layer sidebar in this PR)
- ✅ Clear on time limit (3 hours max)

**Start with Phase 1** and work through sequentially.

Test after each phase, commit after each phase.

**Let's build it!** 🚀

---

**Document Version**: 1.0  
**Created**: PR #17 Planning  
**Status**: Ready for Implementation  
**Next PR**: PR #18 - AI Service Integration (CRITICAL)

