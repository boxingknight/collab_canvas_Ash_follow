# PR #21: AI Selection Commands 🎯

**Branch**: `feat/ai-selection-commands`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Risk Level**: LOW  

---

## Table of Contents

1. [Overview](#overview)
2. [Why This Matters](#why-this-matters)
3. [Architecture & Design Decisions](#architecture--design-decisions)
4. [Implementation Details](#implementation-details)
5. [Integration with Existing Systems](#integration-with-existing-systems)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)
8. [Success Criteria](#success-criteria)
9. [Risk Assessment](#risk-assessment)
10. [Future Enhancements](#future-enhancements)

---

## Overview

### Goal
Add 5 AI-callable selection commands that enable the AI to programmatically select shapes based on various criteria (type, color, region, IDs), making it possible to chain selection + manipulation operations.

### What We're Building
5 new AI functions that integrate with our existing `useSelection` hook, allowing natural language commands like:
- "Select all rectangles"
- "Select all blue shapes"
- "Select shapes in the top-left quadrant"
- "Clear the selection"

### Key Features
- **5 Selection Commands**: Type, color, region, IDs, deselect all
- **Integration**: Uses existing useSelection hook (no new patterns needed)
- **Chainable**: AI can select → then manipulate in sequence
- **Natural Language**: Understands "all circles", "blue shapes", "top-left area"
- **Multi-User Safe**: Selection changes broadcast via selectionBridge

### Time Breakdown
- Planning & architecture: 30 minutes ✅ (this document)
- Implementation: 1.5-2 hours
- Testing: 30 minutes
- Documentation: 15 minutes
- **Total: 2.5-3 hours**

---

## Why This Matters

### Current Limitation
Right now, AI can only manipulate:
1. **All shapes** via batch operations
2. **Shapes user manually selected** via getSelectedShapes()

AI **cannot programmatically select** shapes based on criteria.

### What This Enables

**Example 1: Select Then Manipulate**
```
User: "Select all rectangles and make them red"
AI: 
  1. selectShapesByType('rectangle')
  2. For each selected shape: changeShapeColor(id, '#FF0000')
```

**Example 2: Select by Color**
```
User: "Delete all blue shapes"
AI:
  1. selectShapesByColor('#0000FF')
  2. For each selected shape: deleteShape(id)
```

**Example 3: Select by Region**
```
User: "Move all shapes in the top-left to the center"
AI:
  1. selectShapesInRegion(0, 0, 2500, 2500)
  2. For each selected shape: moveShape(id, centerX, centerY)
```

**Example 4: Complex Operations**
```
User: "Make all circles in the left half bigger and blue"
AI:
  1. selectShapesInRegion(0, 0, 2500, 5000) 
  2. Filter for circles only
  3. For each: resizeShape(id, width*2, height*2)
  4. For each: changeShapeColor(id, '#0000FF')
```

### User Value
- **More powerful AI**: Can target specific shapes intelligently
- **Natural commands**: "Select all X" is intuitive
- **Complex workflows**: Chain multiple operations
- **Efficiency**: Manipulate groups without manual selection

---

## Architecture & Design Decisions

### Decision 1: Integration Pattern

**Choice**: Use existing `selectionBridge` to communicate with `useSelection` hook

**Rationale:**
- ✅ Already proven pattern from PR #18 and #19
- ✅ No new infrastructure needed
- ✅ Multi-user safe (selection is per-user)
- ✅ Real-time updates work automatically

**Implementation:**
```javascript
// selectionBridge.js (extend existing)
export function updateSelection(shapeIds) {
  if (currentSetSelection) {
    currentSetSelection(shapeIds);
  }
}

// New selection functions in canvasAPI.js
export async function selectShapesByType(type, userId) {
  const shapes = await getAllShapes();
  const matchingIds = shapes
    .filter(s => s.type === type)
    .map(s => s.id);
  
  updateSelection(matchingIds); // Use bridge
  return { 
    success: true, 
    selectedCount: matchingIds.length,
    message: `Selected ${matchingIds.length} ${type}(s)`
  };
}
```

### Decision 2: Selection Commands Design

**5 Commands Chosen:**

1. **selectShapesByType(type)** - Select all shapes of a type
2. **selectShapesByColor(color)** - Select all shapes with matching color
3. **selectShapesInRegion(x, y, width, height)** - Select shapes in bounding box
4. **selectShapes(shapeIds)** - Select specific IDs (explicit selection)
5. **deselectAll()** - Clear selection

**Why These 5:**
- ✅ Cover most common selection patterns
- ✅ Chainable with existing manipulation commands
- ✅ Natural language friendly
- ✅ Efficient to implement (use existing getAllShapes + filter)

### Decision 3: Return Format

**Choice**: Consistent return format with success + selectedCount + message

**Format:**
```javascript
{
  success: true,
  selectedCount: 5,
  selectedIds: ['id1', 'id2', ...],
  message: 'Selected 5 rectangle(s)'
}
```

**Rationale:**
- ✅ AI gets feedback on what was selected
- ✅ Can use count for follow-up operations
- ✅ Message helps with natural responses
- ✅ selectedIds allows chaining in multi-step operations

### Decision 4: Region Selection Algorithm

**Choice**: AABB (Axis-Aligned Bounding Box) intersection, any overlap counts

**Algorithm:**
```javascript
function isShapeInRegion(shape, x, y, width, height) {
  const regionRight = x + width;
  const regionBottom = y + height;
  
  // Calculate shape bounds based on type
  const shapeBounds = getShapeBounds(shape);
  
  // Check if any overlap exists
  return !(
    shapeBounds.right < x ||
    shapeBounds.left > regionRight ||
    shapeBounds.bottom < y ||
    shapeBounds.top > regionBottom
  );
}
```

**Why AABB:**
- ✅ Simple and fast
- ✅ Works for all shape types
- ✅ Matches user expectation (any overlap = selected)
- ✅ Same algorithm as marquee selection (consistency)

### Decision 5: Color Matching

**Choice**: Exact hex match (case-insensitive)

**Implementation:**
```javascript
function colorsMatch(color1, color2) {
  return color1.toLowerCase() === color2.toLowerCase();
}
```

**Why Exact Match:**
- ✅ Predictable behavior
- ✅ Fast comparison
- ✅ No ambiguity
- ⚠️ Future: Could add "similar color" matching

---

## Implementation Details

### Files to Modify

#### 1. `/src/services/canvasAPI.js` (+150 lines)

**Add 5 new functions:**

```javascript
/**
 * Select all shapes of a specific type
 * @param {string} type - 'rectangle', 'circle', 'line', or 'text'
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, selectedCount: number, message: string}>}
 */
export async function selectShapesByType(type, userId) {
  // Implementation
}

/**
 * Select all shapes with a specific color
 * @param {string} color - Hex color code (e.g., '#FF0000')
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, selectedCount: number, message: string}>}
 */
export async function selectShapesByColor(color, userId) {
  // Implementation
}

/**
 * Select all shapes within a rectangular region
 * @param {number} x - Region top-left X
 * @param {number} y - Region top-left Y
 * @param {number} width - Region width
 * @param {number} height - Region height
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, selectedCount: number, message: string}>}
 */
export async function selectShapesInRegion(x, y, width, height, userId) {
  // Implementation
}

/**
 * Select specific shapes by their IDs
 * @param {string[]} shapeIds - Array of shape IDs to select
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, selectedCount: number, message: string}>}
 */
export async function selectShapes(shapeIds, userId) {
  // Implementation
}

/**
 * Clear all selections
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deselectAll(userId) {
  // Implementation
}
```

**Helper Functions to Add:**

```javascript
/**
 * Get bounding box for any shape type
 * Handles rectangles, circles, lines, and text
 */
function getShapeBounds(shape) {
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        left: shape.x,
        right: shape.x + shape.width,
        top: shape.y,
        bottom: shape.y + shape.height
      };
    
    case 'circle':
      return {
        left: shape.x - shape.width / 2,
        right: shape.x + shape.width / 2,
        top: shape.y - shape.height / 2,
        bottom: shape.y + shape.height / 2
      };
    
    case 'line':
      const minX = Math.min(shape.x1, shape.x2);
      const maxX = Math.max(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxY = Math.max(shape.y1, shape.y2);
      return {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY
      };
    
    default:
      return { left: 0, right: 0, top: 0, bottom: 0 };
  }
}

/**
 * Check if shape overlaps with region (AABB intersection)
 */
function isShapeInRegion(shape, x, y, width, height) {
  const regionRight = x + width;
  const regionBottom = y + height;
  const shapeBounds = getShapeBounds(shape);
  
  return !(
    shapeBounds.right < x ||
    shapeBounds.left > regionRight ||
    shapeBounds.bottom < y ||
    shapeBounds.top > regionBottom
  );
}

/**
 * Validate shape type parameter
 */
function validateShapeType(type) {
  const validTypes = ['rectangle', 'circle', 'line', 'text'];
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
    };
  }
  return { valid: true };
}
```

#### 2. `/src/services/aiFunctions.js` (+150 lines)

**Add 5 function schemas:**

```javascript
{
  name: 'selectShapesByType',
  description: 'Selects all shapes of a specific type on the canvas',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['rectangle', 'circle', 'line', 'text'],
        description: 'The type of shapes to select'
      }
    },
    required: ['type']
  }
},
{
  name: 'selectShapesByColor',
  description: 'Selects all shapes with a specific color',
  parameters: {
    type: 'object',
    properties: {
      color: {
        type: 'string',
        description: 'Hex color code including # (e.g., "#FF0000" for red)'
      }
    },
    required: ['color']
  }
},
{
  name: 'selectShapesInRegion',
  description: 'Selects all shapes within a rectangular region on the canvas',
  parameters: {
    type: 'object',
    properties: {
      x: {
        type: 'number',
        description: 'X coordinate of region top-left corner (0-5000)'
      },
      y: {
        type: 'number',
        description: 'Y coordinate of region top-left corner (0-5000)'
      },
      width: {
        type: 'number',
        description: 'Width of selection region in pixels'
      },
      height: {
        type: 'number',
        description: 'Height of selection region in pixels'
      }
    },
    required: ['x', 'y', 'width', 'height']
  }
},
{
  name: 'selectShapes',
  description: 'Selects specific shapes by their IDs',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to select'
      }
    },
    required: ['shapeIds']
  }
},
{
  name: 'deselectAll',
  description: 'Clears all shape selections',
  parameters: {
    type: 'object',
    properties: {}
  }
}
```

**Update Function Registry:**

```javascript
export const functionRegistry = {
  // ... existing functions ...
  
  // Selection functions (NEW)
  selectShapesByType: canvasAPI.selectShapesByType,
  selectShapesByColor: canvasAPI.selectShapesByColor,
  selectShapesInRegion: canvasAPI.selectShapesInRegion,
  selectShapes: canvasAPI.selectShapes,
  deselectAll: canvasAPI.deselectAll,
};
```

#### 3. `/src/services/ai.js` (+20 lines)

**Update System Prompt:**

```javascript
const systemPrompt = `You are an AI assistant...

Available Commands:
...

SELECTION COMMANDS (NEW):
- selectShapesByType(type): Select all shapes of a type ('rectangle', 'circle', 'line', 'text')
- selectShapesByColor(color): Select all shapes with hex color (e.g., '#FF0000')
- selectShapesInRegion(x, y, width, height): Select shapes in rectangular region
- selectShapes(shapeIds): Select specific shapes by their IDs
- deselectAll(): Clear all selections

Common Patterns:
- "Select all circles" → selectShapesByType('circle')
- "Select all red shapes" → selectShapesByColor('#FF0000')
- "Select shapes in top-left" → selectShapesInRegion(0, 0, 2500, 2500)
- "Clear selection" → deselectAll()

You can chain selection + manipulation:
1. First select shapes with selection command
2. Then manipulate with moveShape, resizeShape, etc.
`;
```

---

## Integration with Existing Systems

### 1. Selection Bridge (No Changes Needed!)

The existing `selectionBridge.js` already has everything we need:

```javascript
// Already exists in selectionBridge.js
export function updateSelection(shapeIds) {
  if (currentSetSelection) {
    currentSetSelection(shapeIds);
  }
}
```

We just call this from our new selection functions!

### 2. useSelection Hook (No Changes Needed!)

The hook already provides:
- `setSelection(ids)` - What we'll call via bridge
- `selectedShapeIds` - Current selection state
- All selection logic - Works automatically

### 3. AI Service (Minor Update)

Just need to add the 5 function schemas to the system prompt so AI knows they exist.

### 4. Canvas Component (No Changes Needed!)

Selection state updates will automatically trigger:
- Visual selection indicators
- Selection count badge
- Transform handles (if needed)

---

## Testing Strategy

### Manual Testing Checklist

#### Test 1: Select by Type
- [ ] "Select all rectangles" → Only rectangles selected
- [ ] "Select all circles" → Only circles selected
- [ ] "Select all text" → Only text shapes selected
- [ ] "Select all lines" → Only lines selected
- [ ] Verify selection count is correct
- [ ] Verify visual feedback shows all selected shapes

#### Test 2: Select by Color
- [ ] Create shapes with various colors
- [ ] "Select all red shapes" → Only red shapes selected
- [ ] "Select all blue shapes" → Only blue shapes selected
- [ ] Case-insensitive: "#FF0000" = "#ff0000"
- [ ] Verify count matches actual red shapes
- [ ] Test with no matching shapes (empty selection)

#### Test 3: Select by Region
- [ ] Create shapes in different canvas quadrants
- [ ] "Select shapes in top-left" → selectShapesInRegion(0, 0, 2500, 2500)
- [ ] "Select shapes in center" → Region around canvas center
- [ ] Verify shapes partially overlapping region ARE selected
- [ ] Verify shapes outside region NOT selected
- [ ] Test with empty region (no shapes)

#### Test 4: Select by IDs
- [ ] Get shape IDs from getCanvasState()
- [ ] selectShapes(['id1', 'id2', 'id3']) → Only those 3 selected
- [ ] Test with non-existent IDs (should still work, just skip missing)
- [ ] Test with empty array (should select nothing)

#### Test 5: Deselect All
- [ ] Select multiple shapes
- [ ] "Clear selection" → deselectAll()
- [ ] Verify no shapes selected
- [ ] Verify selection count badge disappears
- [ ] Call again when nothing selected (should be no-op)

#### Test 6: Chaining Operations
- [ ] "Select all rectangles and make them blue"
  1. selectShapesByType('rectangle')
  2. For each: changeShapeColor(id, '#0000FF')
- [ ] "Delete all circles"
  1. selectShapesByType('circle')
  2. For each: deleteShape(id)
- [ ] "Move all shapes in top-left to center"
  1. selectShapesInRegion(0, 0, 2500, 2500)
  2. For each: moveShape(id, 2500, 2500)

#### Test 7: Multi-User Scenarios
- [ ] User A selects shapes via AI
- [ ] User B sees NO change (selection is per-user)
- [ ] Both users can have different selections simultaneously
- [ ] AI commands only affect the user who issued them

#### Test 8: Error Handling
- [ ] Invalid type: selectShapesByType('invalid') → Error
- [ ] Invalid color: selectShapesByColor('red') → Error (not hex)
- [ ] Invalid region: selectShapesInRegion(-100, -100, 50, 50) → Error
- [ ] AI displays helpful error message

#### Test 9: Performance
- [ ] Create 500 shapes
- [ ] "Select all rectangles" → Should complete in <500ms
- [ ] "Select shapes in region" → Should complete in <500ms
- [ ] No FPS drop during selection

#### Test 10: Natural Language
- [ ] "Select all the red circles" → AI figures out multi-step
- [ ] "Pick all rectangles" → AI understands "pick" = select
- [ ] "Highlight blue shapes" → AI understands "highlight" = select
- [ ] "Clear selection" / "Deselect all" / "Unselect everything"

---

## Rollout Plan

### Phase 1: Implement Selection Functions (1 hour)

**Step 1.1: Add helper functions to canvasAPI.js**
- Add `getShapeBounds(shape)` helper
- Add `isShapeInRegion(shape, x, y, w, h)` helper
- Add `validateShapeType(type)` helper
- Test helpers with console.log

**Step 1.2: Implement selectShapesByType**
- Get all shapes from Firestore
- Filter by type
- Call selectionBridge.updateSelection()
- Return formatted result
- Test: "Select all rectangles"

**Step 1.3: Implement selectShapesByColor**
- Get all shapes
- Filter by color (case-insensitive)
- Update selection
- Return result
- Test: "Select all red shapes"

**Step 1.4: Implement selectShapesInRegion**
- Get all shapes
- Filter using isShapeInRegion helper
- Update selection
- Return result
- Test: "Select shapes in top-left"

**Step 1.5: Implement selectShapes (by IDs)**
- Validate IDs exist
- Filter valid IDs
- Update selection
- Return result
- Test with specific IDs

**Step 1.6: Implement deselectAll**
- Call selectionBridge.updateSelection([])
- Return success
- Test: "Clear selection"

### Phase 2: Add AI Integration (30 minutes)

**Step 2.1: Add function schemas to aiFunctions.js**
- Create 5 schemas following existing pattern
- Add detailed descriptions and examples
- Specify parameter types and constraints

**Step 2.2: Update function registry**
- Add 5 new functions to registry
- Verify naming matches schemas

**Step 2.3: Update system prompt in ai.js**
- Add selection commands section
- Add usage examples
- Add chaining patterns

**Step 2.4: Test AI understanding**
- "Select all circles" → Should call selectShapesByType
- "Select red shapes" → Should call selectShapesByColor
- "Clear selection" → Should call deselectAll

### Phase 3: Testing & Refinement (30 minutes)

**Step 3.1: Manual testing**
- Run through all test scenarios
- Fix any bugs found
- Verify performance is acceptable

**Step 3.2: Multi-user testing**
- Test with 2 browsers
- Verify selections are isolated per user
- Verify no sync issues

**Step 3.3: Natural language testing**
- Try various phrasings
- Ensure AI interprets correctly
- Adjust system prompt if needed

### Phase 4: Documentation (15 minutes)

**Step 4.1: Update README**
- Add selection commands to AI commands list
- Add chaining examples

**Step 4.2: Update activeContext.md**
- Mark PR #21 complete
- Document any learnings

**Step 4.3: Update progress.md**
- Mark features complete
- Update completion percentage

---

## Success Criteria

### Must Have ✅

1. **All 5 functions implemented and working**
   - selectShapesByType
   - selectShapesByColor
   - selectShapesInRegion
   - selectShapes
   - deselectAll

2. **AI integration complete**
   - Function schemas in aiFunctions.js
   - Functions in registry
   - System prompt updated

3. **Natural language works**
   - "Select all circles" → Works
   - "Select red shapes" → Works
   - "Clear selection" → Works

4. **Chaining works**
   - Select → Manipulate sequences work
   - AI can plan multi-step operations

5. **Multi-user safe**
   - Selections isolated per user
   - No sync issues

6. **Performance acceptable**
   - Selections complete in <500ms
   - No FPS impact
   - Works with 500+ shapes

### Nice to Have ⭐

1. Advanced region selections (quadrants, center, edges)
2. "Select similar" (similar size, similar position)
3. Select by multiple criteria ("red rectangles")
4. Select nth shape (first, last, random)
5. Invert selection

### Out of Scope ❌

1. Visual region preview (just select, no UI)
2. Selection history/undo
3. Named selections (save/load selections)
4. Fuzzy color matching
5. Select by proximity to point

---

## Risk Assessment

### Technical Risks

**Risk 1: Selection Bridge Compatibility** 🟢 LOW
- **Issue**: Selection bridge might not support programmatic updates
- **Mitigation**: Already tested in PR #19, known to work
- **Impact**: None expected

**Risk 2: Performance with Large Selections** 🟢 LOW
- **Issue**: Selecting 500+ shapes might be slow
- **Mitigation**: Simple filter operations, very fast
- **Impact**: Unlikely, but can optimize if needed

**Risk 3: AABB Region Calculation** 🟢 LOW
- **Issue**: Bounding box calculations might be wrong for rotated shapes
- **Mitigation**: Use simple AABB (ignore rotation for MVP)
- **Impact**: Minor edge case, acceptable

**Risk 4: AI Understanding Natural Language** 🟡 MEDIUM
- **Issue**: AI might not interpret selection commands correctly
- **Mitigation**: Clear system prompt with examples
- **Impact**: Can refine prompt during testing

### Project Risks

**Risk 1: Timeline** 🟢 LOW
- **Estimated**: 2-3 hours
- **Complexity**: Low (simple filtering + existing integration)
- **Impact**: Very unlikely to exceed estimate

**Risk 2: Testing Time** 🟢 LOW
- **Issue**: Comprehensive testing might take longer
- **Mitigation**: Well-defined test cases
- **Impact**: Extra 30 minutes max

### Mitigation Strategies

1. **Start with simplest function** (selectShapesByType) to validate pattern
2. **Test each function individually** before moving to next
3. **Use existing patterns** from PR #18/19 (proven approach)
4. **Keep functions simple** (no complex logic, just filtering)

---

## Future Enhancements

### Post-PR #21 Ideas

**Enhancement 1: Advanced Region Selection**
```javascript
// Predefined regions
selectShapesInQuadrant('top-left')  // Quarter of canvas
selectShapesNear(x, y, radius)      // Circular region
selectShapesOnEdge('left', margin)  // Shapes near edge
```

**Enhancement 2: Multi-Criteria Selection**
```javascript
// Combine filters
selectShapes({ 
  type: 'rectangle', 
  color: '#FF0000', 
  minWidth: 100 
})
```

**Enhancement 3: Relative Selection**
```javascript
selectLargestShape()      // Biggest by area
selectSmallestShape()     // Smallest by area
selectRandomShapes(5)     // Random sample
selectTopNShapes(10)      // Top 10 by zIndex
```

**Enhancement 4: Fuzzy Color Matching**
```javascript
// Select similar colors
selectShapesByColor('#FF0000', tolerance: 20)  // +/- 20 in RGB
```

**Enhancement 5: Named Selections**
```javascript
saveSelection('my-selection')    // Save current selection
loadSelection('my-selection')    // Restore saved selection
```

---

## Notes & Considerations

### Why This PR is Important

This PR transforms the AI from a **shape creator** to a **shape manager**. Users can now:
1. Target specific subsets of shapes
2. Build complex workflows (select → manipulate)
3. Use natural language for precise operations
4. Avoid manual selection for batch operations

### Learning from Previous PRs

**From PR #18** (AI Service):
- ✅ Canvas API pattern works well
- ✅ Function schemas are straightforward
- ✅ Validation at every level prevents errors

**From PR #19** (AI Chat):
- ✅ Selection bridge pattern is solid
- ✅ Multi-user isolation works correctly
- ✅ Natural language needs good examples in system prompt

### Key Principles

1. **Simplicity**: Keep functions focused and simple
2. **Consistency**: Follow existing patterns exactly
3. **Clarity**: Return clear feedback for AI interpretation
4. **Performance**: Optimize filter operations if needed
5. **Safety**: Validate all inputs, handle errors gracefully

---

## Appendix: Code Examples

### Example AI Conversations

**Example 1: Simple Selection**
```
User: "Select all rectangles"
AI: selectShapesByType('rectangle')
Response: "I selected 5 rectangles on the canvas."
```

**Example 2: Chained Operations**
```
User: "Select all circles and make them red"
AI: 
  Step 1: selectShapesByType('circle')
  Step 2: For each selected: changeShapeColor(id, '#FF0000')
Response: "I selected 8 circles and changed them all to red."
```

**Example 3: Region Selection**
```
User: "Delete everything in the top half of the canvas"
AI:
  Step 1: selectShapesInRegion(0, 0, 5000, 2500)
  Step 2: For each selected: deleteShape(id)
Response: "I deleted 12 shapes from the top half of the canvas."
```

**Example 4: Complex Query**
```
User: "How many blue rectangles are there?"
AI:
  Step 1: selectShapesByColor('#0000FF')
  Step 2: Filter for rectangles only
Response: "There are 3 blue rectangles on the canvas."
```

---

## Summary

PR #21 adds programmatic selection capabilities to the AI, enabling:
- 5 new selection commands
- Natural language selection
- Chained select → manipulate operations
- Complete integration with existing systems

**Estimated time**: 2-3 hours  
**Risk level**: LOW  
**Value**: HIGH (major AI capability boost)

**Next PR**: PR #22 (Layout Commands) - arrangeHorizontal, arrangeGrid, distributeEvenly, etc.

---

**Status**: Documentation complete, ready for implementation  
**Last Updated**: October 16, 2025

