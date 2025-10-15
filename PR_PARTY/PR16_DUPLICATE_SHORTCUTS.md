# PR#16: Duplicate Operation & Keyboard Shortcuts

**Branch**: `feat/duplicate-shortcuts`  
**Status**: 📋 Planning Complete - Ready for Implementation  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Risk Level**: LOW

## 📋 Overview

### Goal
Implement duplicate functionality for shapes and establish a comprehensive keyboard shortcuts system to accelerate user workflows.

### Why This Matters
- **Duplicate** is a fundamental operation for rapid design iteration
- **Keyboard shortcuts** dramatically improve productivity
- Both features are expected in modern design tools
- Sets foundation for future shortcuts (undo/redo, copy/paste)
- Essential for demonstrating polish in final submission

### Key Features
1. **Duplicate Operation**
   - Duplicate selected shapes with Cmd/Ctrl+D
   - Offset duplicates by 20px (x+20, y+20)
   - Works with single and multiple selections
   - Preserve all properties (color, size, rotation, text, etc.)
   - Auto-select newly created duplicates

2. **Keyboard Shortcuts System**
   - Create `useKeyboard` hook for centralized shortcut management
   - Platform detection (Cmd on Mac, Ctrl on Windows/Linux)
   - Tool shortcuts (R, C, L, T for shape creation modes)
   - Arrow key nudging (1px normal, 10px with Shift)
   - Context awareness (disable during text editing)
   - Tooltips showing keyboard shortcuts

## 🎯 Success Criteria

### Must Have (Required)
- ✅ Cmd+D / Ctrl+D duplicates selected shapes
- ✅ Duplicated shapes offset by 20px diagonal
- ✅ Duplicate works with multi-select
- ✅ All shape properties preserved (color, rotation, text, etc.)
- ✅ Newly duplicated shapes are selected
- ✅ Real-time sync (all users see duplicates)
- ✅ Arrow keys nudge selected shapes (1px)
- ✅ Shift+Arrow nudges 10px
- ✅ Shortcuts disabled during text editing
- ✅ Platform detection (Mac vs Windows/Linux)

### Nice to Have (Optional)
- ⭐ Tooltip showing "Cmd+D to Duplicate"
- ⭐ Visual feedback when duplicating (flash/pulse)
- ⭐ Duplicate multiple times quickly (Cmd+D, D, D, D...)
- ⭐ Settings panel to customize shortcuts
- ⭐ Help panel listing all shortcuts (?)

### Out of Scope (Explicit)
- ❌ Copy/paste (clipboard operations - future PR)
- ❌ Undo/redo (separate PR)
- ❌ Duplicate with alt+drag (future enhancement)
- ❌ Custom shortcut remapping

## 🏗️ Architecture & Design Decisions

### 1. Duplicate Implementation Strategy

**Decision**: Implement duplicate as a Canvas API function (future-proofing for AI)

**Rationale:**
- AI will need to duplicate shapes programmatically
- Consistent with multi-select pattern (useSelection hook)
- Single source of truth for duplicate logic
- Easy to test and maintain

**Implementation:**
```javascript
// In Canvas.jsx or useShapes.js
async function duplicateShapes(shapeIds) {
  const shapesToDuplicate = shapes.filter(s => shapeIds.includes(s.id));
  
  const newShapes = shapesToDuplicate.map(shape => ({
    ...shape,
    x: shape.x + 20,
    y: shape.y + 20,
    id: undefined, // Let Firestore generate new ID
    lockedBy: null,
    lockedAt: null,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp()
  }));
  
  // Batch create for performance
  const newShapeIds = await addShapesBatch(newShapes);
  
  // Select the newly created shapes
  setSelectedShapeIds(newShapeIds);
  
  return newShapeIds;
}
```

### 2. Keyboard Shortcuts Architecture

**Decision**: Create centralized `useKeyboard` hook

**Rationale:**
- Single place to manage all keyboard shortcuts
- Easy to add new shortcuts
- Context awareness (disable during text editing)
- Platform detection in one place
- Prevents duplicate event listeners

**Hook Structure:**
```javascript
// hooks/useKeyboard.js
export function useKeyboard({
  onDuplicate,
  onDelete,
  onNudge,
  onSelectAll,
  onDeselect,
  onToolChange,
  isTextEditing // Context flag
}) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'metaKey' : 'ctrlKey';
  
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger shortcuts during text editing
      if (isTextEditing) return;
      
      // Modifier+key shortcuts
      if (e[modKey]) {
        if (e.key === 'd') {
          e.preventDefault();
          onDuplicate?.();
        }
        if (e.key === 'a') {
          e.preventDefault();
          onSelectAll?.();
        }
      }
      
      // Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const direction = e.key.replace('Arrow', '').toLowerCase();
        onNudge?.(direction, delta);
      }
      
      // Tool shortcuts (no modifier)
      if (!e[modKey] && !e.shiftKey && !e.altKey) {
        const toolMap = {
          'v': 'pan',
          'm': 'move',
          'd': 'draw',
          'r': 'rectangle',
          'c': 'circle',
          'l': 'line',
          't': 'text'
        };
        if (toolMap[e.key]) {
          e.preventDefault();
          onToolChange?.(toolMap[e.key]);
        }
      }
      
      // Escape
      if (e.key === 'Escape') {
        onDeselect?.();
      }
      
      // Delete
      if (['Delete', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        onDelete?.();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modKey, isTextEditing, onDuplicate, onDelete, /* ... */]);
  
  return { isMac, modKey };
}
```

### 3. Text Editing Context Awareness

**Decision**: Pass `isTextEditing` flag from Canvas to useKeyboard

**Rationale:**
- Prevents shortcuts from firing while editing text
- User can type "d" in text without triggering draw mode
- Clean separation of concerns

**Implementation:**
```javascript
// In Canvas.jsx
const [isTextEditing, setIsTextEditing] = useState(false);

// Pass to useKeyboard
useKeyboard({
  onDuplicate: handleDuplicate,
  onNudge: handleNudge,
  isTextEditing, // Context flag
  // ... other handlers
});

// Shape.jsx sets this via callback
onTextEditStart={() => setIsTextEditing(true)}
onTextEditEnd={() => setIsTextEditing(false)}
```

### 4. Nudge Implementation

**Decision**: Implement nudge as position updates with optimistic locking

**Rationale:**
- Reuse existing shape update mechanism
- Works with multi-select automatically
- Smooth UX (no await)
- Real-time sync

**Implementation:**
```javascript
function handleNudge(direction, delta) {
  if (selectedShapeIds.length === 0) return;
  
  const updates = {};
  selectedShapeIds.forEach(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    let newX = shape.x;
    let newY = shape.y;
    
    switch(direction) {
      case 'up': newY -= delta; break;
      case 'down': newY += delta; break;
      case 'left': newX -= delta; break;
      case 'right': newX += delta; break;
    }
    
    updates[shapeId] = { x: newX, y: newY };
  });
  
  // Batch update (optimistic)
  Object.entries(updates).forEach(([shapeId, data]) => {
    updateShape(shapeId, data);
  });
}
```

## 📝 Implementation Plan

### Phase 1: Duplicate Functionality (45 minutes)

**Step 1: Add duplicateShapes function to useShapes hook**
- [ ] Create duplicateShapes function
- [ ] Handle single and multiple selections
- [ ] Offset by 20px diagonal
- [ ] Preserve all properties
- [ ] Use addShapesBatch for performance
- [ ] Return new shape IDs

**Step 2: Wire up Cmd+D shortcut**
- [ ] Add temporary keyboard listener in Canvas.jsx
- [ ] Test Cmd+D on Mac, Ctrl+D on Windows
- [ ] Call duplicateShapes with selectedShapeIds
- [ ] Auto-select newly created shapes

**Step 3: Test duplicate functionality**
- [ ] Duplicate single rectangle
- [ ] Duplicate multiple shapes
- [ ] Duplicate text (preserve content)
- [ ] Duplicate rotated shapes (preserve rotation)
- [ ] Duplicate then immediately move
- [ ] Verify real-time sync (2 browsers)

### Phase 2: Keyboard Shortcuts Hook (60 minutes)

**Step 4: Create useKeyboard hook**
- [ ] Create `hooks/useKeyboard.js`
- [ ] Implement platform detection (isMac)
- [ ] Add event listener for keydown
- [ ] Implement callback pattern
- [ ] Clean up listener on unmount
- [ ] Add JSDoc documentation

**Step 5: Implement shortcut handlers**
- [ ] Cmd/Ctrl+D → onDuplicate
- [ ] Cmd/Ctrl+A → onSelectAll
- [ ] Escape → onDeselect
- [ ] Delete/Backspace → onDelete
- [ ] Arrow keys → onNudge (with direction, delta)
- [ ] Tool shortcuts (v, m, d, r, c, l, t) → onToolChange

**Step 6: Add context awareness**
- [ ] Add `isTextEditing` parameter
- [ ] Add early return if isTextEditing
- [ ] Pass from Canvas.jsx
- [ ] Test: can type "d" in text without triggering draw mode

**Step 7: Integrate useKeyboard in Canvas.jsx**
- [ ] Import useKeyboard
- [ ] Pass all handlers (onDuplicate, onNudge, etc.)
- [ ] Remove existing keyboard listeners (consolidate)
- [ ] Pass isTextEditing flag
- [ ] Test all shortcuts work

### Phase 3: Arrow Key Nudging (30 minutes)

**Step 8: Implement handleNudge function**
- [ ] Create handleNudge in Canvas.jsx
- [ ] Accept direction (up/down/left/right) and delta
- [ ] Update x/y based on direction
- [ ] Support multi-select (nudge all selected)
- [ ] Use existing updateShape function
- [ ] Batch updates for performance

**Step 9: Test nudging**
- [ ] Arrow keys move 1px
- [ ] Shift+Arrow moves 10px
- [ ] Works with single selection
- [ ] Works with multi-select
- [ ] Nudge outside bounds stops at edge
- [ ] Real-time sync works

### Phase 4: Polish & Testing (15 minutes)

**Step 10: Visual feedback (optional)**
- [ ] Add tooltip "Cmd+D to Duplicate" on hover
- [ ] Flash/pulse animation when duplicating (optional)
- [ ] Status message "Duplicated 3 shapes" (optional)

**Step 11: Comprehensive testing**
- [ ] Test all shortcuts on Mac
- [ ] Test all shortcuts on Windows (if available)
- [ ] Test with text editing (shortcuts disabled)
- [ ] Test with no selection (graceful no-op)
- [ ] Test rapid duplicates (D, D, D, D)
- [ ] Test nudge + duplicate combinations
- [ ] Multi-browser testing (real-time sync)

**Step 12: Documentation**
- [ ] Update README with keyboard shortcuts list
- [ ] Add JSDoc to all new functions
- [ ] Update memory bank (activeContext, progress)
- [ ] Update PR document with actual time taken

## 🧪 Testing Strategy

### Manual Testing Checklist

#### Duplicate Operation
- [ ] **Single Shape Duplicate**
  - Create rectangle
  - Select it
  - Press Cmd+D (Mac) or Ctrl+D (Windows)
  - New rectangle appears 20px offset
  - New rectangle is selected
  - Original remains

- [ ] **Multi-Select Duplicate**
  - Select 3 shapes
  - Press Cmd+D
  - 3 new shapes appear, all offset by 20px
  - All 3 new shapes selected
  - Originals remain

- [ ] **Property Preservation**
  - Duplicate rotated shape → rotation preserved
  - Duplicate text → content preserved
  - Duplicate colored shape → color preserved
  - Duplicate line → strokeWidth preserved

- [ ] **Real-Time Sync**
  - Open 2 browsers
  - User A duplicates shape
  - User B sees duplicate appear immediately
  - Both see same offset position

#### Keyboard Shortcuts
- [ ] **Platform Detection**
  - Mac: Cmd+D works, Ctrl+D doesn't
  - Windows: Ctrl+D works, Cmd+D doesn't

- [ ] **Tool Shortcuts**
  - V → Pan mode
  - M → Move mode
  - D → Draw mode (no shape selected)
  - R → Draw mode (rectangle selected in toolbar)
  - C → Draw mode (circle selected in toolbar)
  - L → Draw mode (line selected in toolbar)
  - T → Draw mode (text selected in toolbar)

- [ ] **Arrow Key Nudging**
  - Select shape
  - Arrow Up → moves up 1px
  - Arrow Down → moves down 1px
  - Arrow Left → moves left 1px
  - Arrow Right → moves right 1px
  - Shift+Arrow → moves 10px
  - Multi-select → all shapes move together

- [ ] **Text Editing Context**
  - Double-click text shape (edit mode)
  - Type "d" → inserts "d" in text (doesn't trigger draw mode)
  - Press Escape → exits edit mode
  - Now "d" triggers draw mode

- [ ] **Existing Shortcuts Still Work**
  - Escape → deselect
  - Delete/Backspace → delete selected
  - Cmd/Ctrl+A → select all

### Edge Cases
- [ ] Duplicate with no selection → no-op, no error
- [ ] Nudge with no selection → no-op
- [ ] Duplicate near canvas edge → stays within bounds
- [ ] Rapid duplicates → all shapes created correctly
- [ ] Nudge locked shape → ignored gracefully
- [ ] Shortcuts during pan/zoom → don't interfere

### Performance Testing
- [ ] Duplicate 50 shapes at once → < 2 seconds
- [ ] Rapid arrow key nudging → 60 FPS maintained
- [ ] Duplicate + immediately drag → smooth, no lag

### Multi-User Testing
- [ ] User A duplicates → User B sees immediately
- [ ] User A nudges → User B sees smooth movement
- [ ] Both users duplicate simultaneously → no conflicts

## 🔧 Files to Modify

### New Files
```
hooks/useKeyboard.js (NEW) - Centralized keyboard shortcuts hook
```

### Modified Files
```
hooks/useShapes.js
  - Add duplicateShapes function
  - Export duplicateShapes

components/Canvas/Canvas.jsx
  - Import useKeyboard hook
  - Add handleDuplicate function
  - Add handleNudge function
  - Add isTextEditing state
  - Pass isTextEditing to Shape components
  - Replace existing keyboard listeners with useKeyboard
  - Wire up all handlers

components/Canvas/Shape.jsx (optional)
  - Add onTextEditStart / onTextEditEnd callbacks (if not already present)
  - Call these when text editing starts/stops

utils/constants.js (optional)
  - Add KEYBOARD_SHORTCUTS constant for reference
```

## 🚨 Risk Assessment

### Technical Risks

**Risk 1: Keyboard Event Conflicts** 🟡 MEDIUM
- **Issue**: Multiple event listeners could fire for same key
- **Mitigation**: Remove old listeners when adding useKeyboard
- **Status**: Manageable with careful refactoring

**Risk 2: Platform Detection Edge Cases** 🟢 LOW
- **Issue**: navigator.platform might be unreliable
- **Mitigation**: Test on Mac, Windows, Linux if possible
- **Status**: Low risk, well-established pattern

**Risk 3: Text Editing Context** 🟡 MEDIUM
- **Issue**: Determining when text is being edited
- **Mitigation**: Use clear isTextEditing flag
- **Status**: Requires careful state management

**Risk 4: Duplicate Performance** 🟢 LOW
- **Issue**: Duplicating many shapes could be slow
- **Mitigation**: Use addShapesBatch (already optimized)
- **Status**: Low risk, existing pattern

### Project Risks

**Risk 5: Time Pressure** 🟡 MEDIUM
- **Issue**: 4-5 days left, AI integration not started
- **Mitigation**: Keep this PR focused, 2-3 hours max
- **Status**: Stay disciplined, don't gold-plate

**Risk 6: Scope Creep** 🟡 MEDIUM
- **Issue**: Temptation to add more shortcuts
- **Mitigation**: Stick to must-haves only
- **Status**: Use success criteria as gatekeeper

## 📦 Dependencies

### Existing Code
- **useShapes hook**: Provides shapes, addShapesBatch, updateShape
- **useSelection hook**: Provides selectedShapeIds, setSelectedShapeIds
- **Canvas interaction modes**: Pan, Move, Draw (mode state)
- **Shape locking**: Respect existing lock mechanism

### No New Dependencies
- Uses native browser APIs (keyboard events, platform detection)
- No npm packages required

## 🎨 User Experience Considerations

### Visual Feedback
1. **Duplicate Operation**
   - Selected shapes briefly flash or pulse (optional)
   - Status message "Duplicated 3 shapes" (optional)
   - Newly created shapes are selected (clear visual feedback)

2. **Nudge Operation**
   - Shapes move smoothly (optimistic updates)
   - No lag or jitter
   - Works at 60 FPS

3. **Keyboard Shortcuts**
   - Tooltips show shortcuts on hover (e.g. "Duplicate (Cmd+D)")
   - Help panel lists all shortcuts (future enhancement)

### Accessibility
- Keyboard shortcuts are essential for accessibility
- Screen reader users can navigate without mouse
- Consider adding aria-labels for shortcut actions

## 🔄 Integration with Existing Features

### Multi-Select (PR#13)
- **Duplicate**: Works seamlessly with multi-select
- **Nudge**: Works seamlessly with multi-select
- **Selection API**: Reuse setSelectedShapeIds for auto-selecting duplicates

### Rotation (PR#15)
- **Duplicate**: Preserve rotation property
- **Nudge**: Rotation unaffected (only x/y change)

### Shape Locking
- **Duplicate**: Locked shapes can be duplicated (creates unlocked copies)
- **Nudge**: Locked shapes cannot be nudged (respect lock)

### Text Editing (PR#12)
- **Context Awareness**: Shortcuts disabled during text edit
- **Seamless Integration**: Text edit mode sets isTextEditing flag

## 🚀 Rollout Plan

### Step-by-Step Implementation

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/duplicate-shortcuts
   ```

2. **Phase 1: Duplicate (45 min)**
   - Implement duplicateShapes
   - Add temporary Cmd+D listener
   - Test thoroughly
   - Commit: "feat: add duplicate functionality"

3. **Phase 2: useKeyboard Hook (60 min)**
   - Create hooks/useKeyboard.js
   - Implement all shortcuts
   - Add context awareness
   - Integrate in Canvas.jsx
   - Remove old listeners
   - Commit: "feat: add centralized keyboard shortcuts hook"

4. **Phase 3: Nudging (30 min)**
   - Implement handleNudge
   - Test arrow keys
   - Test with multi-select
   - Commit: "feat: add arrow key nudging"

5. **Phase 4: Polish & Testing (15 min)**
   - Add tooltips (optional)
   - Comprehensive testing
   - Fix any bugs
   - Commit: "polish: add tooltips and final testing"

6. **Documentation & Merge**
   - Update README
   - Update memory bank
   - Update PR document
   - Push to GitHub
   - Test deployed version
   - Merge to main

### Deployment
- No Firestore schema changes
- No environment variables
- No security rules updates
- **Safe to deploy immediately**

## 🎓 Lessons from Previous PRs

### From PR#13 (Multi-Select)
- **Lesson**: Optimistic updates feel instant
- **Application**: Use optimistic updates for nudge operations

### From PR#15 (Rotation)
- **Lesson**: Preserve all properties when duplicating
- **Application**: Spread operator to copy all shape properties

### From PR#12 (Text)
- **Lesson**: Context awareness is critical
- **Application**: Disable shortcuts during text editing

## 🔮 Future Enhancements (Out of Scope)

1. **Copy/Paste (Clipboard)**
   - Cmd+C, Cmd+V for clipboard operations
   - Paste across different canvas sessions
   - Requires clipboard API

2. **Alt+Drag to Duplicate**
   - Hold Alt while dragging to duplicate
   - More intuitive for some users
   - Requires mouse event handling

3. **Custom Shortcut Remapping**
   - User settings panel
   - Customize shortcuts
   - Save preferences to Firestore

4. **Keyboard Shortcuts Help Panel**
   - Press "?" to show all shortcuts
   - Searchable, organized by category
   - Animated examples

5. **Smart Duplicate**
   - Detect patterns (grids, rows)
   - Duplicate with spacing
   - Array duplicate (1 → 10 copies)

## 📊 Success Metrics

### Functional Metrics
- ✅ All 10 keyboard shortcuts working
- ✅ Duplicate works for all 4 shape types
- ✅ Nudge works in all 4 directions
- ✅ Context awareness (text editing) working
- ✅ Platform detection working (Mac vs Windows)

### Performance Metrics
- ✅ Duplicate 50 shapes < 2 seconds
- ✅ Nudge at 60 FPS
- ✅ Keyboard response < 50ms

### Quality Metrics
- ✅ No regressions (existing shortcuts still work)
- ✅ Real-time sync working
- ✅ Zero critical bugs
- ✅ Code is clean and documented

## 🎯 Acceptance Criteria

### Must Complete
- [x] Cmd+D / Ctrl+D duplicates selected shapes
- [x] Duplicates offset by 20px diagonal
- [x] All properties preserved
- [x] Arrow keys nudge 1px
- [x] Shift+Arrow nudges 10px
- [x] Works with multi-select
- [x] Shortcuts disabled during text edit
- [x] Real-time sync working
- [x] Zero breaking changes
- [x] Deployed and tested

### Stretch Goals
- [ ] Tooltips showing shortcuts
- [ ] Visual feedback on duplicate
- [ ] Help panel (?) showing all shortcuts

---

## 📝 Implementation Notes (To Be Filled During Development)

### Actual Time Taken
- Phase 1: ___ minutes
- Phase 2: ___ minutes
- Phase 3: ___ minutes
- Phase 4: ___ minutes
- **Total**: ___ hours

### Bugs Encountered
_(To be documented if significant issues arise)_

### Deviations from Plan
_(Note any changes to the original plan)_

### Key Learnings
_(Insights gained during implementation)_

---

**Status**: Ready for Implementation  
**Next Steps**: Create feature branch and begin Phase 1  
**Estimated Completion**: 2-3 hours from start


