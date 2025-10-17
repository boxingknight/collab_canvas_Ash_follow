# PR #22: AI Layout Commands 📐

**Branch**: `feat/ai-layout-commands`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 4-5 hours  
**Risk Level**: MEDIUM  

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
Implement 6 AI-callable layout commands that enable intelligent arrangement of shapes, transforming the AI from a simple shape creator into a sophisticated layout engine that can organize shapes into rows, columns, grids, and centered positions.

### What We're Building
6 new AI functions that use geometry calculations to position shapes intelligently:

**Core Layout Functions:**
1. `arrangeHorizontal` - Arrange shapes in a horizontal row with spacing
2. `arrangeVertical` - Arrange shapes in a vertical column with spacing
3. `arrangeGrid` - Arrange shapes in grid pattern (rows × columns)
4. `distributeEvenly` - Space shapes evenly along an axis
5. `centerShape` - Center a single shape on canvas
6. `centerShapes` - Center a group of shapes as a unit

### Key Features
- **Intelligent Positioning**: Calculate optimal positions based on shape sizes
- **Batch Updates**: Efficiently move multiple shapes at once
- **Canvas-Aware**: Keep shapes within canvas bounds (0-5000)
- **Natural Language**: Understands "arrange in a row", "make a grid", "center everything"
- **Real-Time Sync**: All layout changes broadcast to all users
- **Multi-Select Compatible**: Works with programmatic and manual selections

### Time Breakdown
- Planning & architecture: 30 minutes ✅ (this document)
- Geometry utilities: 1 hour
- Core layout functions (arrange, distribute): 2 hours
- Center functions: 30 minutes
- AI integration (schemas, registry): 30 minutes
- Testing: 1 hour
- Documentation: 30 minutes
- **Total: 5.5-6 hours**

---

## Why This Matters

### Current Limitation

Right now, AI can:
- ✅ Create individual shapes
- ✅ Create batches of shapes (2-10)
- ✅ Generate patterns (1000+ shapes in grid/random/etc.)
- ✅ Move individual shapes
- ✅ Select shapes by criteria

AI **cannot**:
- ❌ Arrange existing shapes into layouts
- ❌ Take user-created shapes and organize them
- ❌ Center shapes or groups
- ❌ Space things evenly
- ❌ Create and arrange in one command

### What This Enables

**Example 1: Arrange Existing Shapes**
```
User creates 5 rectangles manually
User: "Arrange these in a horizontal row"
AI:
  1. getSelectedShapes() → [shape1, shape2, ...]
  2. arrangeHorizontal([shape1.id, shape2.id, ...], 20)
  3. Shapes now in perfect row with 20px spacing
```

**Example 2: Create + Arrange Workflow**
```
User: "Create 5 blue circles and arrange them vertically"
AI:
  1. createShapesBatch([circle1, circle2, circle3, circle4, circle5])
  2. selectShapesByColor('#0000FF')
  3. arrangeVertical([ids], 30)
```

**Example 3: Grid Layout**
```
User: "Make a 3x3 grid of squares"
AI:
  1. generateShapes(9, 'rectangle', 'custom', ...)
  2. selectShapesByType('rectangle')
  3. arrangeGrid([ids], 3, 3, 50, 50)
```

**Example 4: Center Group**
```
User: "Center all selected shapes"
AI:
  1. getSelectedShapes() → [shapes]
  2. centerShapes([shape.id for shape in shapes])
  3. Group moves to canvas center as unit
```

**Example 5: Distribute Evenly**
```
User: "Space these shapes evenly horizontally"
AI:
  1. getSelectedShapes()
  2. distributeEvenly([ids], 'horizontal')
  3. Shapes spaced perfectly between first and last
```

### User Value

**For Designers:**
- **Faster layouts**: "Arrange in a row" vs manually positioning each
- **Perfect spacing**: AI calculates exact positions
- **Iteration speed**: "Make the spacing bigger" → instantly adjusts

**For AI Capability:**
- **Demonstrates intelligence**: Not just creating, but organizing
- **Enables complex commands**: "Create nav bar" = create + arrange
- **Natural workflows**: Matches how designers think

**For Project Requirements:**
- **Required feature**: Project brief explicitly asks for layout commands
- **Differentiator**: Shows AI understands spatial relationships
- **Demo impact**: "Watch AI organize 50 shapes into a grid" is impressive

---

## Architecture & Design Decisions

### 1. Geometry Utilities Layer

**Decision**: Create `geometry.js` utility module with reusable functions

**Rationale:**
- Layout commands share common geometry operations
- Separation of concerns (calculation vs execution)
- Easier to test geometry logic independently
- Reusable for future features

**Core Utilities:**

```javascript
// src/utils/geometry.js

/**
 * Calculate bounding box of multiple shapes
 * Returns: { minX, minY, maxX, maxY, width, height, centerX, centerY }
 */
export function calculateBoundingBox(shapes) {
  // Find min/max X and Y across all shapes
  // Account for different shape types (rect vs circle coordinate systems)
  // Calculate center point
}

/**
 * Calculate evenly distributed positions along an axis
 * Returns: Array of positions for each shape
 */
export function calculateEvenDistribution(shapes, direction) {
  // Find first and last shape positions
  // Calculate total available space
  // Divide space evenly
  // Return new positions for each shape
}

/**
 * Calculate grid positions for shapes
 * Returns: Array of {x, y} positions for each shape
 */
export function calculateGridPositions(shapes, rows, cols, spacingX, spacingY, startX, startY) {
  // Calculate cell size based on largest shape
  // Position shapes in row-major order (left-to-right, top-to-bottom)
  // Apply spacing between cells
  // Return positions
}

/**
 * Get shape bounds (handles different shape types)
 * Returns: { x, y, width, height, centerX, centerY }
 */
export function getShapeBounds(shape) {
  // Rectangle: x, y, width, height
  // Circle: convert center + radius to bounds
  // Line: calculate bounds from endpoints
  // Text: use x, y, width, height
}

/**
 * Constrain position to canvas bounds
 * Returns: { x, y } clamped to canvas
 */
export function constrainToCanvas(x, y, width, height) {
  // Ensure shape stays within 0-5000 canvas
  // Account for shape size
}
```

**Benefits:**
- Pure functions (easy to test)
- No Firebase dependencies
- Reusable across different commands
- Clear, documented API

---

### 2. Batch Update Strategy

**Decision**: Use batch updates for moving multiple shapes (not individual updates)

**Rationale:**
- Performance: Update 10 shapes = 1 batch operation, not 10 individual
- Consistency: All shapes move together atomically
- Firestore efficiency: Fewer write operations = lower cost
- User experience: All shapes appear in new positions simultaneously

**Implementation Pattern:**

```javascript
async function layoutShapes(shapeIds, newPositions) {
  // Get all shapes
  const shapes = await getAllShapes();
  
  // Build updates array
  const updates = shapeIds.map((id, index) => ({
    id,
    updates: {
      x: newPositions[index].x,
      y: newPositions[index].y,
      updatedAt: serverTimestamp()
    }
  }));
  
  // Batch update (all in one operation)
  await batchUpdateShapes(updates);
  
  return { success: true, count: updates.length };
}
```

**Benefits:**
- Faster execution (<100ms for 50 shapes)
- Lower Firestore costs
- Better real-time sync (one update event, not many)
- Atomic operations (all succeed or all fail)

---

### 3. Coordinate System Handling

**Decision**: Handle different shape coordinate systems consistently

**Challenge**: 
- Rectangles: x, y = top-left corner
- Circles: x, y = center point
- Lines: x1, y1, x2, y2 = endpoints
- Text: x, y = top-left corner

**Solution**: `getShapeBounds()` utility normalizes all to bounding box

```javascript
function getShapeBounds(shape) {
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2
      };
      
    case 'circle':
      const radius = shape.radius;
      return {
        x: shape.x - radius,  // Convert center to top-left
        y: shape.y - radius,
        width: radius * 2,
        height: radius * 2,
        centerX: shape.x,     // Already center
        centerY: shape.y
      };
      
    case 'line':
      const minX = Math.min(shape.x1, shape.x2);
      const maxX = Math.max(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxY = Math.max(shape.y1, shape.y2);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
  }
}
```

**Benefits:**
- Consistent interface for all layout functions
- Handles all shape types correctly
- Easy to add new shape types

---

### 4. Layout Algorithms

#### Algorithm A: Horizontal Arrangement

```javascript
arrangeHorizontal(shapeIds, spacing = 20)

Steps:
1. Fetch all shapes by IDs
2. Calculate current bounding box of group
3. Sort shapes by current X position (maintain order)
4. Position shapes left-to-right:
   - First shape at group's original leftmost position
   - Each subsequent shape: previous.x + previous.width + spacing
   - Preserve Y positions (align by current vertical position) OR center vertically
5. Batch update all positions
```

**Alignment Strategy**: Align shapes by their vertical centers (not top edges)

```javascript
const groupCenterY = calculateBoundingBox(shapes).centerY;

shapes.forEach((shape, i) => {
  const shapeBounds = getShapeBounds(shape);
  newPositions[i] = {
    x: currentX,
    y: groupCenterY - shapeBounds.height / 2  // Center vertically
  };
  currentX += shapeBounds.width + spacing;
});
```

**Benefits:**
- Maintains relative order
- Clean horizontal lines
- Works with different shape sizes

---

#### Algorithm B: Vertical Arrangement

```javascript
arrangeVertical(shapeIds, spacing = 20)

Steps:
1. Fetch all shapes by IDs
2. Calculate current bounding box
3. Sort shapes by current Y position (maintain order)
4. Position shapes top-to-bottom:
   - First shape at group's original topmost position
   - Each subsequent shape: previous.y + previous.height + spacing
   - Preserve X positions (align by current horizontal position) OR center horizontally
5. Batch update all positions
```

**Alignment Strategy**: Align shapes by their horizontal centers

```javascript
const groupCenterX = calculateBoundingBox(shapes).centerX;

shapes.forEach((shape, i) => {
  const shapeBounds = getShapeBounds(shape);
  newPositions[i] = {
    x: groupCenterX - shapeBounds.width / 2,  // Center horizontally
    y: currentY
  };
  currentY += shapeBounds.height + spacing;
});
```

---

#### Algorithm C: Grid Arrangement

```javascript
arrangeGrid(shapeIds, rows, cols, spacingX = 20, spacingY = 20)

Steps:
1. Validate: shapeIds.length <= rows * cols
2. Fetch all shapes
3. Find largest shape dimensions (sets cell size)
4. Calculate starting position (top-left of current bounding box OR canvas center)
5. Position shapes in row-major order:
   - Row 0: shapes[0] to shapes[cols-1]
   - Row 1: shapes[cols] to shapes[2*cols-1]
   - etc.
6. Each cell position:
   - cellX = startX + (col * (cellWidth + spacingX))
   - cellY = startY + (row * (cellHeight + spacingY))
   - Center shape within cell
7. Batch update all positions
```

**Cell Size Calculation:**

```javascript
// Find largest shape in set
const maxWidth = Math.max(...shapes.map(s => getShapeBounds(s).width));
const maxHeight = Math.max(...shapes.map(s => getShapeBounds(s).height));

const cellWidth = maxWidth;
const cellHeight = maxHeight;

// Position each shape centered in its cell
for (let i = 0; i < shapeIds.length; i++) {
  const row = Math.floor(i / cols);
  const col = i % cols;
  
  const cellX = startX + (col * (cellWidth + spacingX));
  const cellY = startY + (row * (cellHeight + spacingY));
  
  const shapeBounds = getShapeBounds(shapes[i]);
  
  newPositions[i] = {
    x: cellX + (cellWidth - shapeBounds.width) / 2,   // Center in cell
    y: cellY + (cellHeight - shapeBounds.height) / 2
  };
}
```

**Benefits:**
- Clean grid layout
- Centers shapes in cells
- Handles different shape sizes
- Configurable spacing

---

#### Algorithm D: Even Distribution

```javascript
distributeEvenly(shapeIds, direction = 'horizontal')

Steps:
1. Fetch all shapes
2. Sort shapes by position along axis (left-to-right or top-to-bottom)
3. Keep first and last shape positions fixed (anchor points)
4. Calculate available space:
   - Total distance = last.position - first.position
   - Space for shapes = sum of shape widths/heights
   - Available gap space = Total distance - space for shapes
   - Gap size = Available gap space / (count - 1)
5. Position intermediate shapes:
   - Start at first shape's end position
   - Each shape: previous position + gap size
6. Batch update positions
```

**Horizontal Distribution:**

```javascript
const sorted = shapes.sort((a, b) => getShapeBounds(a).x - getShapeBounds(b).x);
const first = getShapeBounds(sorted[0]);
const last = getShapeBounds(sorted[sorted.length - 1]);

const totalDistance = last.x - (first.x + first.width);
const shapeSpace = sorted.slice(1, -1).reduce((sum, s) => sum + getShapeBounds(s).width, 0);
const gapSpace = totalDistance - shapeSpace;
const gapSize = gapSpace / (sorted.length - 1);

let currentX = first.x + first.width + gapSize;
for (let i = 1; i < sorted.length - 1; i++) {
  const shapeBounds = getShapeBounds(sorted[i]);
  newPositions[i] = {
    x: currentX,
    y: sorted[i].y  // Maintain vertical position
  };
  currentX += shapeBounds.width + gapSize;
}
```

**Benefits:**
- Professional even spacing
- Anchors first and last shapes
- Natural distribution
- Works with any number of shapes

---

#### Algorithm E: Center Single Shape

```javascript
centerShape(shapeId)

Steps:
1. Fetch shape
2. Get shape bounds
3. Calculate canvas center: (2500, 2500)
4. Calculate new position:
   - For rectangle/text: x = 2500 - width/2, y = 2500 - height/2
   - For circle: x = 2500, y = 2500 (already center-based)
   - For line: Calculate center offset, move both endpoints
5. Update shape position
```

**Shape Type Handling:**

```javascript
const canvasCenterX = 2500;
const canvasCenterY = 2500;

switch (shape.type) {
  case 'rectangle':
  case 'text':
    newX = canvasCenterX - shape.width / 2;
    newY = canvasCenterY - shape.height / 2;
    break;
    
  case 'circle':
    newX = canvasCenterX;
    newY = canvasCenterY;
    break;
    
  case 'line':
    const currentCenterX = (shape.x1 + shape.x2) / 2;
    const currentCenterY = (shape.y1 + shape.y2) / 2;
    const offsetX = canvasCenterX - currentCenterX;
    const offsetY = canvasCenterY - currentCenterY;
    // Move both endpoints by offset
    break;
}
```

---

#### Algorithm F: Center Group

```javascript
centerShapes(shapeIds)

Steps:
1. Fetch all shapes
2. Calculate group bounding box
3. Calculate group center offset:
   - groupCenterX = (boundingBox.minX + boundingBox.maxX) / 2
   - groupCenterY = (boundingBox.minY + boundingBox.maxY) / 2
   - offsetX = 2500 - groupCenterX
   - offsetY = 2500 - groupCenterY
4. Move each shape by offset (preserves relative positions)
5. Batch update all positions
```

**Preserving Group Structure:**

```javascript
const bbox = calculateBoundingBox(shapes);
const groupCenterX = (bbox.minX + bbox.maxX) / 2;
const groupCenterY = (bbox.minY + bbox.maxY) / 2;

const offsetX = 2500 - groupCenterX;
const offsetY = 2500 - groupCenterY;

shapes.forEach((shape, i) => {
  // Move shape by offset (relative movement)
  newPositions[i] = {
    x: shape.x + offsetX,
    y: shape.y + offsetY
  };
});
```

**Benefits:**
- Maintains group structure
- Moves as a unit
- Works for any number of shapes
- Preserves relative spacing

---

### 5. Error Handling Strategy

**Validation Layers:**

**Layer 1: Parameter Validation**
```javascript
// Validate shapeIds array
if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
  throw new Error('shapeIds must be a non-empty array');
}

// Validate spacing
if (typeof spacing !== 'number' || spacing < 0) {
  throw new Error('spacing must be a non-negative number');
}

// Validate rows/cols for grid
if (rows * cols < shapeIds.length) {
  throw new Error(`Grid too small: ${rows}x${cols} = ${rows*cols} cells for ${shapeIds.length} shapes`);
}
```

**Layer 2: Shape Existence**
```javascript
const shapes = await getAllShapes();
const existingShapeIds = shapes.map(s => s.id);
const notFound = shapeIds.filter(id => !existingShapeIds.includes(id));

if (notFound.length > 0) {
  throw new Error(`Shapes not found: ${notFound.join(', ')}`);
}
```

**Layer 3: Canvas Bounds**
```javascript
// Check if layout will fit on canvas
const layoutWidth = (cols * cellWidth) + ((cols - 1) * spacingX);
const layoutHeight = (rows * cellHeight) + ((rows - 1) * spacingY);

if (layoutWidth > 5000 || layoutHeight > 5000) {
  throw new Error(`Layout too large: ${layoutWidth}x${layoutHeight} exceeds canvas (5000x5000)`);
}
```

**User-Friendly Error Messages:**
```javascript
// Bad: "Invalid parameter"
// Good: "Cannot arrange 10 shapes in a 2x3 grid (only 6 cells available). Use at least 2x5 or 3x4."

// Bad: "Bounds error"
// Good: "Grid would be 6000px wide but canvas is only 5000px. Try smaller spacing or fewer columns."
```

---

### 6. AI System Prompt Updates

**Add to System Prompt:**

```javascript
const systemPrompt = `
... existing prompt ...

LAYOUT COMMANDS:
You can arrange shapes into organized layouts:

1. arrangeHorizontal(shapeIds, spacing) - Arrange in horizontal row
   - Aligns shapes by vertical center
   - Example: "Arrange selected shapes in a row with 30px spacing"

2. arrangeVertical(shapeIds, spacing) - Arrange in vertical column
   - Aligns shapes by horizontal center
   - Example: "Stack these shapes vertically"

3. arrangeGrid(shapeIds, rows, cols, spacingX, spacingY) - Arrange in grid
   - Rows x Cols must be >= number of shapes
   - Example: "Arrange 9 shapes in a 3x3 grid"

4. distributeEvenly(shapeIds, direction) - Space evenly along axis
   - Direction: 'horizontal' or 'vertical'
   - Anchors first and last shape
   - Example: "Space these shapes evenly horizontally"

5. centerShape(shapeId) - Center single shape on canvas
   - Example: "Center this rectangle"

6. centerShapes(shapeIds) - Center group while preserving structure
   - Example: "Center all selected shapes"

LAYOUT WORKFLOWS:
- "Create 5 circles and arrange in a row" → createShapesBatch + arrangeHorizontal
- "Make a 3x3 grid of squares" → generateShapes + arrangeGrid
- "Select all rectangles and stack vertically" → selectShapesByType + arrangeVertical
- "Space these evenly" → getSelectedShapes + distributeEvenly
`;
```

---

## Implementation Details

### Files to Create

#### 1. `src/utils/geometry.js` (NEW)

```javascript
// src/utils/geometry.js
import { CANVAS_CONFIG } from './constants';

/**
 * Get bounding box for a single shape (handles all types)
 */
export function getShapeBounds(shape) {
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2
      };
      
    case 'circle':
      const radius = shape.radius || (shape.width / 2); // Handle both formats
      return {
        x: shape.x - radius,
        y: shape.y - radius,
        width: radius * 2,
        height: radius * 2,
        centerX: shape.x,
        centerY: shape.y
      };
      
    case 'line':
      const minX = Math.min(shape.x1, shape.x2);
      const maxX = Math.max(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxY = Math.max(shape.y1, shape.y2);
      const width = maxX - minX;
      const height = maxY - minY;
      return {
        x: minX,
        y: minY,
        width: width > 0 ? width : shape.strokeWidth || 2,
        height: height > 0 ? height : shape.strokeWidth || 2,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
      
    default:
      throw new Error(`Unknown shape type: ${shape.type}`);
  }
}

/**
 * Calculate bounding box for multiple shapes
 */
export function calculateBoundingBox(shapes) {
  if (!shapes || shapes.length === 0) {
    throw new Error('Cannot calculate bounding box for empty array');
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  const minX = Math.min(...bounds.map(b => b.x));
  const minY = Math.min(...bounds.map(b => b.y));
  const maxX = Math.max(...bounds.map(b => b.x + b.width));
  const maxY = Math.max(...bounds.map(b => b.y + b.height));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * Constrain position to canvas bounds
 */
export function constrainToCanvas(x, y, width = 0, height = 0) {
  const clampedX = Math.max(0, Math.min(x, CANVAS_CONFIG.width - width));
  const clampedY = Math.max(0, Math.min(y, CANVAS_CONFIG.height - height));
  
  return { x: clampedX, y: clampedY };
}

/**
 * Calculate positions for horizontal arrangement
 */
export function calculateHorizontalLayout(shapes, spacing = 20) {
  if (shapes.length === 0) return [];
  
  const bounds = shapes.map(getShapeBounds);
  const groupBounds = calculateBoundingBox(shapes);
  
  // Sort by current X position to maintain order
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => a.bounds.x - b.bounds.x);
  
  // Calculate vertical center for alignment
  const alignY = groupBounds.centerY;
  
  // Position shapes left-to-right
  let currentX = groupBounds.minX;
  const positions = new Array(shapes.length);
  
  sorted.forEach(({ shape, bounds, originalIndex }) => {
    const newY = alignY - bounds.height / 2;
    
    positions[originalIndex] = constrainToCanvas(currentX, newY, bounds.width, bounds.height);
    currentX += bounds.width + spacing;
  });
  
  return positions;
}

/**
 * Calculate positions for vertical arrangement
 */
export function calculateVerticalLayout(shapes, spacing = 20) {
  if (shapes.length === 0) return [];
  
  const bounds = shapes.map(getShapeBounds);
  const groupBounds = calculateBoundingBox(shapes);
  
  // Sort by current Y position to maintain order
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => a.bounds.y - b.bounds.y);
  
  // Calculate horizontal center for alignment
  const alignX = groupBounds.centerX;
  
  // Position shapes top-to-bottom
  let currentY = groupBounds.minY;
  const positions = new Array(shapes.length);
  
  sorted.forEach(({ shape, bounds, originalIndex }) => {
    const newX = alignX - bounds.width / 2;
    
    positions[originalIndex] = constrainToCanvas(newX, currentY, bounds.width, bounds.height);
    currentY += bounds.height + spacing;
  });
  
  return positions;
}

/**
 * Calculate positions for grid arrangement
 */
export function calculateGridLayout(shapes, rows, cols, spacingX = 20, spacingY = 20, startX = null, startY = null) {
  if (shapes.length === 0) return [];
  if (rows * cols < shapes.length) {
    throw new Error(`Grid too small: ${rows}x${cols} = ${rows*cols} cells for ${shapes.length} shapes`);
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  // Find max dimensions for cell size
  const maxWidth = Math.max(...bounds.map(b => b.width));
  const maxHeight = Math.max(...bounds.map(b => b.height));
  
  // Calculate starting position
  const groupBounds = calculateBoundingBox(shapes);
  const gridStartX = startX !== null ? startX : groupBounds.minX;
  const gridStartY = startY !== null ? startY : groupBounds.minY;
  
  // Position each shape in grid
  const positions = shapes.map((shape, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const cellX = gridStartX + (col * (maxWidth + spacingX));
    const cellY = gridStartY + (row * (maxHeight + spacingY));
    
    const shapeBounds = bounds[index];
    
    // Center shape in cell
    const x = cellX + (maxWidth - shapeBounds.width) / 2;
    const y = cellY + (maxHeight - shapeBounds.height) / 2;
    
    return constrainToCanvas(x, y, shapeBounds.width, shapeBounds.height);
  });
  
  return positions;
}

/**
 * Calculate positions for even distribution
 */
export function calculateEvenDistribution(shapes, direction = 'horizontal') {
  if (shapes.length < 2) {
    return shapes.map(s => ({ x: s.x, y: s.y }));
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  // Sort by position along axis
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => {
      if (direction === 'horizontal') {
        return a.bounds.x - b.bounds.x;
      } else {
        return a.bounds.y - b.bounds.y;
      }
    });
  
  const positions = new Array(shapes.length);
  
  // Keep first and last positions fixed
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  positions[first.originalIndex] = { x: first.shape.x, y: first.shape.y };
  positions[last.originalIndex] = { x: last.shape.x, y: last.shape.y };
  
  if (shapes.length === 2) {
    return positions;
  }
  
  if (direction === 'horizontal') {
    // Calculate horizontal distribution
    const totalDistance = last.bounds.x - (first.bounds.x + first.bounds.width);
    const shapeSpace = sorted.slice(1, -1).reduce((sum, s) => sum + s.bounds.width, 0);
    const gapSpace = totalDistance - shapeSpace;
    const gapSize = gapSpace / (sorted.length - 1);
    
    let currentX = first.bounds.x + first.bounds.width + gapSize;
    
    for (let i = 1; i < sorted.length - 1; i++) {
      const { originalIndex, shape, bounds } = sorted[i];
      positions[originalIndex] = constrainToCanvas(currentX, shape.y, bounds.width, bounds.height);
      currentX += bounds.width + gapSize;
    }
  } else {
    // Calculate vertical distribution
    const totalDistance = last.bounds.y - (first.bounds.y + first.bounds.height);
    const shapeSpace = sorted.slice(1, -1).reduce((sum, s) => sum + s.bounds.height, 0);
    const gapSpace = totalDistance - shapeSpace;
    const gapSize = gapSpace / (sorted.length - 1);
    
    let currentY = first.bounds.y + first.bounds.height + gapSize;
    
    for (let i = 1; i < sorted.length - 1; i++) {
      const { originalIndex, shape, bounds } = sorted[i];
      positions[originalIndex] = constrainToCanvas(shape.x, currentY, bounds.width, bounds.height);
      currentY += bounds.height + gapSize;
    }
  }
  
  return positions;
}

/**
 * Calculate center position for single shape
 */
export function calculateCenterPosition(shape) {
  const bounds = getShapeBounds(shape);
  const canvasCenterX = CANVAS_CONFIG.width / 2;
  const canvasCenterY = CANVAS_CONFIG.height / 2;
  
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        x: canvasCenterX - bounds.width / 2,
        y: canvasCenterY - bounds.height / 2
      };
      
    case 'circle':
      return {
        x: canvasCenterX,
        y: canvasCenterY
      };
      
    case 'line':
      const currentCenterX = (shape.x1 + shape.x2) / 2;
      const currentCenterY = (shape.y1 + shape.y2) / 2;
      const offsetX = canvasCenterX - currentCenterX;
      const offsetY = canvasCenterY - currentCenterY;
      return {
        x1: shape.x1 + offsetX,
        y1: shape.y1 + offsetY,
        x2: shape.x2 + offsetX,
        y2: shape.y2 + offsetY
      };
      
    default:
      throw new Error(`Unknown shape type: ${shape.type}`);
  }
}

/**
 * Calculate center offset for group of shapes
 */
export function calculateGroupCenterOffset(shapes) {
  const bbox = calculateBoundingBox(shapes);
  const canvasCenterX = CANVAS_CONFIG.width / 2;
  const canvasCenterY = CANVAS_CONFIG.height / 2;
  
  return {
    offsetX: canvasCenterX - bbox.centerX,
    offsetY: canvasCenterY - bbox.centerY
  };
}
```

---

#### 2. `src/services/canvasAPI.js` (ADD FUNCTIONS)

```javascript
// Add to existing canvasAPI.js

import {
  calculateHorizontalLayout,
  calculateVerticalLayout,
  calculateGridLayout,
  calculateEvenDistribution,
  calculateCenterPosition,
  calculateGroupCenterOffset,
  getShapeBounds
} from '../utils/geometry';

// ... existing functions ...

/**
 * Batch update multiple shapes (helper function)
 */
async function batchUpdateShapePositions(updates) {
  // updates = [{ id, x, y }, ...]
  const promises = updates.map(({ id, ...position }) => 
    updateShape(id, { ...position, updatedAt: serverTimestamp() })
  );
  
  await Promise.all(promises);
  return { success: true, count: updates.length };
}

/**
 * Arrange shapes in horizontal row
 */
export async function arrangeHorizontal(shapeIds, spacing = 20) {
  try {
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('shapeIds must be a non-empty array');
    }
    if (typeof spacing !== 'number' || spacing < 0) {
      throw new Error('spacing must be a non-negative number');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateHorizontalLayout(shapes, spacing);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Arranged ${shapes.length} shapes horizontally with ${spacing}px spacing`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('arrangeHorizontal error:', error);
    throw new Error(`Failed to arrange shapes horizontally: ${error.message}`);
  }
}

/**
 * Arrange shapes in vertical column
 */
export async function arrangeVertical(shapeIds, spacing = 20) {
  try {
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('shapeIds must be a non-empty array');
    }
    if (typeof spacing !== 'number' || spacing < 0) {
      throw new Error('spacing must be a non-negative number');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateVerticalLayout(shapes, spacing);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Arranged ${shapes.length} shapes vertically with ${spacing}px spacing`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('arrangeVertical error:', error);
    throw new Error(`Failed to arrange shapes vertically: ${error.message}`);
  }
}

/**
 * Arrange shapes in grid pattern
 */
export async function arrangeGrid(shapeIds, rows, cols, spacingX = 20, spacingY = 20) {
  try {
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('shapeIds must be a non-empty array');
    }
    if (typeof rows !== 'number' || rows < 1) {
      throw new Error('rows must be a positive number');
    }
    if (typeof cols !== 'number' || cols < 1) {
      throw new Error('cols must be a positive number');
    }
    if (rows * cols < shapeIds.length) {
      throw new Error(
        `Grid too small: ${rows}x${cols} grid has ${rows*cols} cells but you have ${shapeIds.length} shapes. ` +
        `Use at least ${Math.ceil(shapeIds.length / cols)}x${cols} or ${rows}x${Math.ceil(shapeIds.length / rows)}.`
      );
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateGridLayout(shapes, rows, cols, spacingX, spacingY);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Arranged ${shapes.length} shapes in ${rows}x${cols} grid`,
      count: shapes.length,
      rows,
      cols
    };
    
  } catch (error) {
    console.error('arrangeGrid error:', error);
    throw new Error(`Failed to arrange shapes in grid: ${error.message}`);
  }
}

/**
 * Distribute shapes evenly along an axis
 */
export async function distributeEvenly(shapeIds, direction = 'horizontal') {
  try {
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('shapeIds must be a non-empty array');
    }
    if (shapeIds.length < 2) {
      throw new Error('Need at least 2 shapes to distribute');
    }
    if (direction !== 'horizontal' && direction !== 'vertical') {
      throw new Error('direction must be "horizontal" or "vertical"');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate new positions
    const newPositions = calculateEvenDistribution(shapes, direction);
    
    // Build update array
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      ...newPositions[i]
    }));
    
    // Batch update
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Distributed ${shapes.length} shapes evenly ${direction}`,
      count: shapes.length,
      direction
    };
    
  } catch (error) {
    console.error('distributeEvenly error:', error);
    throw new Error(`Failed to distribute shapes: ${error.message}`);
  }
}

/**
 * Center single shape on canvas
 */
export async function centerShape(shapeId) {
  try {
    // Validation
    if (!shapeId) {
      throw new Error('shapeId is required');
    }
    
    // Get shape
    const allShapes = await getAllShapes();
    const shape = allShapes.find(s => s.id === shapeId);
    
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }
    
    // Calculate center position
    const newPosition = calculateCenterPosition(shape);
    
    // Update shape
    await updateShape(shapeId, {
      ...newPosition,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Centered ${shape.type} at canvas center`,
      shapeId
    };
    
  } catch (error) {
    console.error('centerShape error:', error);
    throw new Error(`Failed to center shape: ${error.message}`);
  }
}

/**
 * Center group of shapes on canvas (preserves relative positions)
 */
export async function centerShapes(shapeIds) {
  try {
    // Validation
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('shapeIds must be a non-empty array');
    }
    
    // Get shapes
    const allShapes = await getAllShapes();
    const shapes = shapeIds.map(id => allShapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found');
    }
    if (shapes.length !== shapeIds.length) {
      throw new Error(`Some shapes not found: ${shapeIds.length - shapes.length} missing`);
    }
    
    // Calculate offset to center group
    const { offsetX, offsetY } = calculateGroupCenterOffset(shapes);
    
    // Build update array (move all shapes by offset)
    const updates = shapes.map(shape => {
      const newPosition = {
        x: shape.x + offsetX,
        y: shape.y + offsetY
      };
      
      // For lines, offset both endpoints
      if (shape.type === 'line') {
        newPosition.x1 = shape.x1 + offsetX;
        newPosition.y1 = shape.y1 + offsetY;
        newPosition.x2 = shape.x2 + offsetX;
        newPosition.y2 = shape.y2 + offsetY;
        delete newPosition.x;
        delete newPosition.y;
      }
      
      return {
        id: shape.id,
        ...newPosition
      };
    });
    
    // Batch update
    await batchUpdateShapePositions(updates);
    
    return {
      success: true,
      message: `Centered group of ${shapes.length} shapes at canvas center`,
      count: shapes.length
    };
    
  } catch (error) {
    console.error('centerShapes error:', error);
    throw new Error(`Failed to center shapes: ${error.message}`);
  }
}

// Update exports
export const canvasAPI = {
  // ... existing exports ...
  arrangeHorizontal,
  arrangeVertical,
  arrangeGrid,
  distributeEvenly,
  centerShape,
  centerShapes
};
```

---

#### 3. `src/services/aiFunctions.js` (ADD SCHEMAS)

```javascript
// Add to existing aiFunctions.js functionSchemas array

{
  name: 'arrangeHorizontal',
  description: 'Arranges shapes in a horizontal row with specified spacing. Shapes are aligned by their vertical centers.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to arrange. Get from getSelectedShapes() or selectShapesByType(). Minimum 2 shapes.'
      },
      spacing: {
        type: 'number',
        description: 'Space between shapes in pixels. Default is 20. Use 10-50 for compact, 50-100 for loose.'
      }
    },
    required: ['shapeIds']
  }
},
{
  name: 'arrangeVertical',
  description: 'Arranges shapes in a vertical column with specified spacing. Shapes are aligned by their horizontal centers.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to arrange. Get from getSelectedShapes() or selectShapesByType(). Minimum 2 shapes.'
      },
      spacing: {
        type: 'number',
        description: 'Space between shapes in pixels. Default is 20. Use 10-50 for compact, 50-100 for loose.'
      }
    },
    required: ['shapeIds']
  }
},
{
  name: 'arrangeGrid',
  description: 'Arranges shapes in a grid pattern (rows × columns) with specified spacing. Shapes are centered in cells.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to arrange in grid. Number of shapes must be ≤ rows × cols.'
      },
      rows: {
        type: 'number',
        description: 'Number of rows in grid. Must be positive integer.'
      },
      cols: {
        type: 'number',
        description: 'Number of columns in grid. Must be positive integer.'
      },
      spacingX: {
        type: 'number',
        description: 'Horizontal spacing between cells in pixels. Default is 20.'
      },
      spacingY: {
        type: 'number',
        description: 'Vertical spacing between cells in pixels. Default is 20.'
      }
    },
    required: ['shapeIds', 'rows', 'cols']
  }
},
{
  name: 'distributeEvenly',
  description: 'Distributes shapes evenly along horizontal or vertical axis. First and last shapes stay fixed, intermediate shapes are spaced evenly between them.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to distribute. Minimum 2 shapes required.'
      },
      direction: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        description: 'Direction to distribute: "horizontal" spaces shapes left-to-right, "vertical" spaces shapes top-to-bottom. Default is "horizontal".'
      }
    },
    required: ['shapeIds']
  }
},
{
  name: 'centerShape',
  description: 'Centers a single shape at the canvas center (2500, 2500).',
  parameters: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: 'ID of shape to center on canvas.'
      }
    },
    required: ['shapeId']
  }
},
{
  name: 'centerShapes',
  description: 'Centers a group of shapes at the canvas center while preserving their relative positions (moves as a unit).',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of shape IDs to center as a group. Relative positions between shapes are preserved.'
      }
    },
    required: ['shapeIds']
  }
}
```

```javascript
// Add to function registry

export const functionRegistry = {
  // ... existing functions ...
  arrangeHorizontal: canvasAPI.arrangeHorizontal,
  arrangeVertical: canvasAPI.arrangeVertical,
  arrangeGrid: canvasAPI.arrangeGrid,
  distributeEvenly: canvasAPI.distributeEvenly,
  centerShape: canvasAPI.centerShape,
  centerShapes: canvasAPI.centerShapes
};
```

```javascript
// Update executeFunction to handle new functions

export async function executeFunction(functionName, parameters) {
  console.log(`Executing function: ${functionName}`, parameters);
  
  try {
    // Validate function exists
    if (!functionRegistry[functionName]) {
      throw new Error(`Unknown function: ${functionName}`);
    }
    
    // Execute function
    const result = await functionRegistry[functionName](parameters);
    
    console.log(`Function ${functionName} executed successfully:`, result);
    return result;
    
  } catch (error) {
    console.error(`Function ${functionName} failed:`, error);
    throw error;
  }
}
```

---

#### 4. `src/services/ai.js` (UPDATE SYSTEM PROMPT)

```javascript
// Update system prompt to include layout commands

const SYSTEM_PROMPT = `
You are an AI assistant that helps users create and manipulate shapes on a 5000x5000 pixel canvas.
The canvas center is at (2500, 2500).

... existing prompt content ...

LAYOUT COMMANDS (NEW):

1. arrangeHorizontal(shapeIds, spacing) - Arrange shapes in horizontal row
   - Aligns by vertical center
   - Example: "Arrange selected shapes in a row"
   - Typical spacing: 20-50px

2. arrangeVertical(shapeIds, spacing) - Arrange shapes in vertical column
   - Aligns by horizontal center
   - Example: "Stack these shapes vertically"
   - Typical spacing: 20-50px

3. arrangeGrid(shapeIds, rows, cols, spacingX, spacingY) - Arrange in grid
   - rows × cols must be ≥ number of shapes
   - Example: "Arrange 9 shapes in a 3x3 grid"
   - Typical spacing: 20-50px

4. distributeEvenly(shapeIds, direction) - Space evenly along axis
   - Direction: 'horizontal' or 'vertical'
   - Anchors first and last shape
   - Example: "Space these shapes evenly"

5. centerShape(shapeId) - Center single shape on canvas
   - Example: "Center this rectangle"

6. centerShapes(shapeIds) - Center group (preserves structure)
   - Example: "Center all selected shapes"

LAYOUT WORKFLOWS:

Example 1: "Create 5 circles and arrange in a row"
  1. createShapesBatch([5 circles])
  2. selectShapesByType('circle')
  3. arrangeHorizontal(selectedIds, 30)

Example 2: "Make a 3x3 grid of squares"
  1. generateShapes(9, 'rectangle', 'grid', ...)
  2. selectShapesByType('rectangle')
  3. arrangeGrid(selectedIds, 3, 3, 50, 50)

Example 3: "Select all rectangles and stack them"
  1. selectShapesByType('rectangle')
  2. arrangeVertical(selectedIds, 20)

Example 4: "Center all blue shapes"
  1. selectShapesByColor('#0000FF')
  2. centerShapes(selectedIds)

Always use layout commands when user asks to:
- "arrange", "organize", "layout", "line up", "stack"
- "make a row", "make a column", "make a grid"
- "space evenly", "distribute"
- "center" (single or group)

`;
```

---

### Files to Modify

1. ✅ `src/utils/geometry.js` - CREATE (new file)
2. ✅ `src/services/canvasAPI.js` - ADD 6 functions + batch helper
3. ✅ `src/services/aiFunctions.js` - ADD 6 schemas + registry entries
4. ✅ `src/services/ai.js` - UPDATE system prompt

---

## Integration with Existing Systems

### Integration Point 1: Selection Bridge

**How Layout Works with Selection:**

```javascript
// User: "Arrange selected shapes in a row"

// 1. AI calls getSelectedShapes() via existing selection bridge
const selectedShapes = await canvasAPI.getSelectedShapes();

// 2. Extract IDs
const shapeIds = selectedShapes.map(s => s.id);

// 3. Call layout function
await canvasAPI.arrangeHorizontal(shapeIds, 20);

// 4. Layout function updates positions in Firestore
// 5. Real-time sync broadcasts to all users
// 6. Selection remains intact (IDs don't change)
```

**Benefits:**
- Works seamlessly with manual selection
- Works with programmatic selection (selectShapesByType, etc.)
- No special integration needed

---

### Integration Point 2: Real-Time Sync

**How Layout Updates Sync:**

```javascript
// Layout function updates Firestore
await batchUpdateShapePositions([
  { id: 'shape1', x: 100, y: 200 },
  { id: 'shape2', x: 150, y: 200 },
  // ...
]);

// Existing Firestore listener catches updates
onSnapshot(collection(db, 'shapes'), (snapshot) => {
  // All users receive position updates
  // React state updates
  // Konva canvas re-renders
  // Shapes move to new positions
});
```

**Benefits:**
- Uses existing real-time infrastructure
- No new sync logic needed
- All users see layout changes instantly

---

### Integration Point 3: Multi-Step Operations

**Chaining Commands:**

```javascript
// User: "Create 5 blue circles and arrange them in a grid"

// AI plans multi-step operation:
1. createShapesBatch([
     { type: 'circle', radius: 50, color: '#0000FF', ... },
     { type: 'circle', radius: 50, color: '#0000FF', ... },
     // ... 5 total
   ])
   
2. selectShapesByColor('#0000FF')
   
3. arrangeGrid(selectedIds, 2, 3, 50, 50)
```

**Benefits:**
- Layout commands integrate naturally with creation/selection
- Enables complex workflows
- Shows AI intelligence

---

### Integration Point 4: Error Handling

**Layout Errors:**

```javascript
// Example: Grid too small
try {
  await canvasAPI.arrangeGrid(shapeIds, 2, 2, 20, 20);
} catch (error) {
  // Error: "Grid too small: 2x2 grid has 4 cells but you have 10 shapes..."
  // AI sees this error and explains to user
  // AI might suggest: "Let me use a 3x4 grid instead"
}
```

**Benefits:**
- User-friendly error messages
- AI can recover and suggest alternatives
- Clear validation feedback

---

## Testing Strategy

### Unit Tests (Manual - No Automated Tests Yet)

#### Test 1: Geometry Utilities

**Test `getShapeBounds`:**
```javascript
const rect = { type: 'rectangle', x: 100, y: 200, width: 50, height: 30 };
const bounds = getShapeBounds(rect);
// Expected: { x: 100, y: 200, width: 50, height: 30, centerX: 125, centerY: 215 }

const circle = { type: 'circle', x: 500, y: 500, radius: 50 };
const bounds = getShapeBounds(circle);
// Expected: { x: 450, y: 450, width: 100, height: 100, centerX: 500, centerY: 500 }
```

**Test `calculateBoundingBox`:**
```javascript
const shapes = [
  { type: 'rectangle', x: 100, y: 100, width: 50, height: 50 },
  { type: 'rectangle', x: 200, y: 150, width: 50, height: 50 }
];
const bbox = calculateBoundingBox(shapes);
// Expected: { minX: 100, minY: 100, maxX: 250, maxY: 200, width: 150, height: 100, ... }
```

**Test `calculateHorizontalLayout`:**
```javascript
const shapes = [
  { type: 'rectangle', x: 100, y: 100, width: 50, height: 50 },
  { type: 'rectangle', x: 200, y: 100, width: 50, height: 50 }
];
const positions = calculateHorizontalLayout(shapes, 20);
// Expected: [{ x: 100, y: 100 }, { x: 170, y: 100 }]  // 50 + 20 spacing
```

---

#### Test 2: Layout Functions (Via AI Commands)

**Test arrangeHorizontal:**
```
Setup: Create 3 rectangles manually at random positions
Command: "Arrange these shapes in a horizontal row"
Expected:
  - Shapes aligned horizontally
  - Equal spacing between shapes (20px default)
  - Vertically centered relative to each other
  - Success message displayed
```

**Test arrangeVertical:**
```
Setup: Create 4 circles manually
Command: "Stack these shapes vertically with 30px spacing"
Expected:
  - Shapes aligned vertically
  - 30px spacing between shapes
  - Horizontally centered
  - Success message
```

**Test arrangeGrid:**
```
Setup: Create 6 shapes manually
Command: "Arrange these shapes in a 2x3 grid"
Expected:
  - 2 rows, 3 columns
  - Shapes centered in cells
  - Equal spacing
  - Grid starts at current group position
  - Success message
```

**Test distributeEvenly:**
```
Setup: Create 5 shapes manually in rough horizontal line
Command: "Space these shapes evenly horizontally"
Expected:
  - First and last shapes stay in place
  - Middle 3 shapes distributed evenly between them
  - Perfect equal spacing
  - Success message
```

**Test centerShape:**
```
Setup: Create 1 rectangle anywhere
Command: "Center this rectangle"
Expected:
  - Shape moves to canvas center (2500, 2500)
  - Shape centered (not top-left at center)
  - Success message
```

**Test centerShapes:**
```
Setup: Create 3 shapes in a group (e.g., row)
Command: "Center all selected shapes"
Expected:
  - Group moves to canvas center as unit
  - Relative positions preserved
  - Group structure maintained
  - Success message
```

---

#### Test 3: Error Handling

**Test: Grid too small**
```
Setup: Create 10 shapes
Command: "Arrange in a 2x2 grid"
Expected:
  - Error: "Grid too small: 2x2 = 4 cells for 10 shapes"
  - Suggest: "Use at least 2x5 or 3x4"
  - No shapes moved
```

**Test: Invalid direction**
```
Setup: Create 3 shapes
Command: "Distribute evenly diagonally"
Expected:
  - Error: "direction must be 'horizontal' or 'vertical'"
  - Shapes not moved
```

**Test: No shapes**
```
Command: "Arrange in a row"
Expected:
  - Error: "No shapes selected"
  - Helpful message
```

**Test: Too few shapes for distribution**
```
Setup: Create 1 shape
Command: "Distribute evenly"
Expected:
  - Error: "Need at least 2 shapes to distribute"
```

---

#### Test 4: Edge Cases

**Test: Mixed shape types**
```
Setup: Create rectangle (100x50), circle (radius 50), line (100px long)
Command: "Arrange in a row"
Expected:
  - All shapes arranged correctly
  - Different sizes handled properly
  - Aligned by vertical center
```

**Test: Very large spacing**
```
Setup: Create 5 shapes
Command: "Arrange in a row with 500px spacing"
Expected:
  - Large spacing applied
  - May extend beyond visible area
  - Works correctly
```

**Test: Zero spacing**
```
Setup: Create 3 shapes
Command: "Arrange in a row with no spacing"
Expected:
  - Shapes touch each other (0px gap)
  - No overlap
```

**Test: Many shapes (performance)**
```
Setup: Generate 50 shapes
Command: "Arrange in a 10x5 grid"
Expected:
  - All 50 shapes arranged
  - <1 second execution
  - 60 FPS maintained
  - Real-time sync works
```

---

#### Test 5: Real-Time Sync (Multi-User)

**Test: Simultaneous users**
```
Setup: 2 browser windows, User A and User B
User A creates 5 shapes
User A: "Arrange in a row"
Expected:
  - User A sees shapes arrange
  - User B sees shapes arrange (real-time sync)
  - <100ms latency
  - No conflicts
```

**Test: Layout during manipulation**
```
Setup: 2 users, User A selecting shapes, User B triggers layout
User B: "Arrange selected shapes in a grid"
Expected:
  - Layout executes
  - User A sees changes
  - Selection preserved for User A
  - No crashes
```

---

#### Test 6: Integration with Other Commands

**Test: Create + Arrange workflow**
```
Command: "Create 5 blue circles and arrange them in a row"
Expected:
  - 5 circles created
  - Circles arranged horizontally
  - All blue (#0000FF or similar)
  - Smooth execution
```

**Test: Select + Arrange workflow**
```
Setup: Create 10 mixed shapes (5 red, 5 blue)
Command: "Select all red shapes and stack them vertically"
Expected:
  - Only red shapes selected
  - Red shapes stacked vertically
  - Blue shapes untouched
```

**Test: Arrange + Manipulate workflow**
```
Setup: Create 3 shapes
Command: "Arrange in a row, then make them all bigger"
Expected:
  - Shapes arranged first
  - Then resized
  - Order matters
```

---

### Testing Checklist

**Phase 1: Geometry Utilities**
- [ ] Test `getShapeBounds` with all shape types
- [ ] Test `calculateBoundingBox` with 2, 5, 10 shapes
- [ ] Test `calculateHorizontalLayout`
- [ ] Test `calculateVerticalLayout`
- [ ] Test `calculateGridLayout`
- [ ] Test `calculateEvenDistribution`
- [ ] Test `calculateCenterPosition`
- [ ] Test `calculateGroupCenterOffset`
- [ ] Test `constrainToCanvas`

**Phase 2: Layout Functions (AI Commands)**
- [ ] Test `arrangeHorizontal` with default spacing
- [ ] Test `arrangeHorizontal` with custom spacing
- [ ] Test `arrangeVertical` with default spacing
- [ ] Test `arrangeVertical` with custom spacing
- [ ] Test `arrangeGrid` with 2x2, 3x3, 5x5 grids
- [ ] Test `arrangeGrid` with custom spacing
- [ ] Test `distributeEvenly` horizontally
- [ ] Test `distributeEvenly` vertically
- [ ] Test `centerShape` with each shape type
- [ ] Test `centerShapes` with 2, 5, 10 shapes

**Phase 3: Error Handling**
- [ ] Test grid too small error
- [ ] Test invalid direction error
- [ ] Test no shapes error
- [ ] Test too few shapes for distribution
- [ ] Test shapes not found error
- [ ] Test invalid parameters (negative spacing, etc.)

**Phase 4: Edge Cases**
- [ ] Test with mixed shape types
- [ ] Test with very large spacing (>1000px)
- [ ] Test with zero spacing
- [ ] Test with 50+ shapes
- [ ] Test with shapes near canvas edges
- [ ] Test with rotated shapes
- [ ] Test with tiny shapes (10x10px)
- [ ] Test with huge shapes (500x500px)

**Phase 5: Real-Time Sync**
- [ ] Test layout with 2 users
- [ ] Test layout with 5+ users
- [ ] Test simultaneous layouts
- [ ] Test sync latency (<100ms)

**Phase 6: Integration**
- [ ] Test create → arrange workflow
- [ ] Test select → arrange workflow
- [ ] Test arrange → manipulate workflow
- [ ] Test complex multi-step operations
- [ ] Test chained layout commands

**Phase 7: Performance**
- [ ] Measure layout time for 10 shapes (<100ms)
- [ ] Measure layout time for 50 shapes (<500ms)
- [ ] Test 60 FPS maintained during layout
- [ ] Test Firestore write count (batch = 1 write per shape)

---

## Rollout Plan

### Phase 1: Geometry Utilities (1 hour)

**Tasks:**
1. Create `src/utils/geometry.js`
2. Implement all geometry functions
3. Test each function manually (console.log outputs)
4. Verify calculations with known inputs

**Success Criteria:**
- All geometry functions working
- Correct outputs for sample inputs
- No errors in console

---

### Phase 2: Core Layout Functions (2 hours)

**Tasks:**
1. Add `arrangeHorizontal` to `canvasAPI.js`
2. Add `arrangeVertical` to `canvasAPI.js`
3. Add `arrangeGrid` to `canvasAPI.js`
4. Add `distributeEvenly` to `canvasAPI.js`
5. Test each function directly (not via AI yet)

**Testing:**
```javascript
// Test in browser console
const shapes = await canvasAPI.getCanvasState();
const shapeIds = shapes.slice(0, 5).map(s => s.id);
await canvasAPI.arrangeHorizontal(shapeIds, 30);
```

**Success Criteria:**
- All 4 core functions working
- Shapes move to correct positions
- No errors
- Real-time sync working

---

### Phase 3: Center Functions (30 minutes)

**Tasks:**
1. Add `centerShape` to `canvasAPI.js`
2. Add `centerShapes` to `canvasAPI.js`
3. Test both functions

**Success Criteria:**
- Both functions working
- Shapes center correctly
- Group structure preserved

---

### Phase 4: AI Integration (30 minutes)

**Tasks:**
1. Add 6 function schemas to `aiFunctions.js`
2. Add 6 function entries to registry
3. Update system prompt in `ai.js`

**Testing:**
```javascript
// Test via AI chat
"Create 5 shapes"
"Arrange them in a row"
```

**Success Criteria:**
- AI recognizes layout commands
- AI calls correct functions
- Parameters passed correctly
- Success messages displayed

---

### Phase 5: Comprehensive Testing (1 hour)

**Tasks:**
1. Test all 6 layout functions via AI
2. Test error handling
3. Test edge cases
4. Test multi-user sync
5. Test integration workflows

**Success Criteria:**
- All test cases passing
- No critical bugs
- Performance targets met

---

### Phase 6: Documentation & Cleanup (30 minutes)

**Tasks:**
1. Add JSDoc comments to all functions
2. Update PR document with learnings
3. Create bug tracking document (if needed)
4. Update memory bank

**Success Criteria:**
- Code well-documented
- PR document complete
- Ready for submission

---

### Git Workflow

```bash
# Create branch
git checkout -b feat/ai-layout-commands

# Phase 1: Geometry utilities
git add src/utils/geometry.js
git commit -m "feat: add geometry utilities for layout commands"

# Phase 2-3: Canvas API functions
git add src/services/canvasAPI.js
git commit -m "feat: add 6 layout functions to Canvas API"

# Phase 4: AI integration
git add src/services/aiFunctions.js src/services/ai.js
git commit -m "feat: integrate layout commands with AI service"

# Push
git push origin feat/ai-layout-commands

# Deploy
firebase deploy
```

---

## Success Criteria

### Must Have (Required)

**Functionality:**
- [ ] All 6 layout functions implemented
- [ ] All functions callable via AI
- [ ] All functions work via direct API calls
- [ ] Real-time sync working (<100ms)
- [ ] Error handling for all edge cases
- [ ] User-friendly error messages

**Performance:**
- [ ] Layout executes <500ms for 10 shapes
- [ ] Layout executes <1s for 50 shapes
- [ ] 60 FPS maintained during layout
- [ ] Batch updates (1 Firestore operation per shape, not per pixel)

**Integration:**
- [ ] Works with manual selection
- [ ] Works with programmatic selection
- [ ] Chains with creation commands
- [ ] Chains with manipulation commands

**Testing:**
- [ ] All test cases passing
- [ ] Multi-user sync tested
- [ ] Edge cases handled

---

### Nice to Have (Optional)

**Features:**
- [ ] Layout preview (show before committing)
- [ ] Undo layout operation
- [ ] Save layout presets
- [ ] Align to grid option

**Performance:**
- [ ] Layout animation (smooth transition to new positions)
- [ ] Optimistic local preview

**UX:**
- [ ] Visual feedback during layout (loading state)
- [ ] Toast notifications for layout operations
- [ ] Layout command suggestions in chat

---

### Out of Scope

**Not implementing in this PR:**
- ❌ Layout templates (save/load)
- ❌ Custom alignment options (align top/bottom/left/right)
- ❌ Smart spacing (auto-calculate based on shape sizes)
- ❌ Layout constraints (min/max spacing)
- ❌ Layout groups (treat multiple shapes as one unit)
- ❌ Nested layouts
- ❌ Layout undo/redo (separate feature)

---

## Risk Assessment

### Technical Risks

**Risk 1: Geometry Calculations**
- **Severity**: MEDIUM
- **Impact**: Incorrect positions, shapes overlapping or misaligned
- **Likelihood**: MEDIUM
- **Mitigation**: 
  - Test geometry utilities thoroughly
  - Use known correct examples
  - Add validation checks
  - Console.log outputs during development
- **Contingency**: Add extra validation, simplify algorithms if needed

**Risk 2: Coordinate System Complexity**
- **Severity**: MEDIUM
- **Impact**: Shapes positioned incorrectly (especially circles and lines)
- **Likelihood**: MEDIUM
- **Mitigation**:
  - `getShapeBounds` utility normalizes all coordinate systems
  - Test with all shape types
  - Special handling for circles (center-based) and lines (endpoints)
- **Contingency**: Add coordinate conversion utilities, extensive testing per shape type

**Risk 3: Canvas Bounds**
- **Severity**: LOW
- **Impact**: Shapes positioned outside canvas
- **Likelihood**: LOW
- **Mitigation**:
  - `constrainToCanvas` utility
  - Validate final positions before update
  - Warn user if layout would exceed bounds
- **Contingency**: Adjust spacing or starting position to fit

**Risk 4: Performance with Many Shapes**
- **Severity**: MEDIUM
- **Impact**: Slow layout execution, FPS drops
- **Likelihood**: LOW
- **Mitigation**:
  - Use batch updates (not individual updates)
  - Geometry calculations are fast (pure functions, no async)
  - Test with 50+ shapes early
- **Contingency**: Limit max shapes per layout, optimize algorithms

**Risk 5: Real-Time Sync Conflicts**
- **Severity**: LOW
- **Impact**: Multiple users trigger layouts simultaneously
- **Likelihood**: LOW
- **Mitigation**:
  - Batch updates are atomic
  - Existing locking mechanism prevents most conflicts
  - Last-write-wins is acceptable for layouts
- **Contingency**: Document behavior, add user feedback

---

### Project Risks

**Risk 6: Time Estimation**
- **Severity**: MEDIUM
- **Impact**: Takes longer than 4-5 hours
- **Likelihood**: MEDIUM
- **Estimated**: 5.5-6 hours realistically
- **Mitigation**:
  - PR document is comprehensive (reduces surprises)
  - Geometry utilities are straightforward
  - Patterns similar to existing selection commands
- **Contingency**: Implement core functions first (arrange, grid), defer center functions if needed

**Risk 7: Complex Workflows**
- **Severity**: LOW
- **Impact**: AI struggles to chain layout commands
- **Likelihood**: LOW
- **Mitigation**:
  - System prompt has clear examples
  - Layout functions are simple (one operation each)
  - AI has proven ability to chain commands (selection + manipulation working)
- **Contingency**: Add more examples to system prompt

---

### Mitigation Summary

| Risk | Mitigation Strategy |
|------|---------------------|
| Geometry calculations | Thorough testing, validation checks |
| Coordinate systems | Normalization utility, per-shape testing |
| Canvas bounds | Constraint utility, validation |
| Performance | Batch updates, early testing with 50+ shapes |
| Sync conflicts | Atomic updates, existing locking |
| Time estimation | Comprehensive planning, prioritize core functions |
| Complex workflows | Clear system prompt, proven AI capability |

---

## Future Enhancements

### Post-PR Improvements

**Enhancement 1: Alignment Options**
```javascript
arrangeHorizontal(shapeIds, spacing, { align: 'top' | 'center' | 'bottom' })
```
- Currently aligns by vertical center
- Could add options for top or bottom alignment

**Enhancement 2: Smart Spacing**
```javascript
arrangeHorizontal(shapeIds, 'auto')
```
- Calculate optimal spacing based on shape sizes
- Example: Larger shapes get more space

**Enhancement 3: Layout Presets**
```javascript
saveLayoutPreset(name, layoutConfig)
applyLayoutPreset(name, shapeIds)
```
- Save custom layouts
- Reuse across different shape sets

**Enhancement 4: Layout Animation**
```javascript
arrangeHorizontal(shapeIds, spacing, { animated: true, duration: 300 })
```
- Smooth transition to new positions
- Konva tween for animation

**Enhancement 5: Constrain to Region**
```javascript
arrangeGrid(shapeIds, rows, cols, spacing, { region: { x, y, width, height } })
```
- Layout within specific canvas region
- Useful for organizing specific areas

**Enhancement 6: Auto-Grid**
```javascript
autoGrid(shapeIds, spacing)
```
- Automatically calculate optimal rows/cols
- Based on shape count and canvas space

---

### Complex Operations (PR #23 Integration)

Layout commands enable complex operations:

**createLoginForm:**
```javascript
async function createLoginForm(x, y) {
  // 1. Create shapes
  const shapes = await createShapesBatch([...]);
  
  // 2. Use arrangeVertical
  await arrangeVertical(shapes.map(s => s.id), 20);
  
  // 3. Move group to desired position
  const offset = { x: x - currentX, y: y - currentY };
  // ... move shapes
}
```

**createNavigationBar:**
```javascript
async function createNavigationBar(x, y, itemCount) {
  // 1. Create buttons
  const buttons = await createShapesBatch([...]);
  
  // 2. Use arrangeHorizontal
  await arrangeHorizontal(buttons.map(b => b.id), 10);
  
  // 3. Position at desired location
  // ...
}
```

---

## Conclusion

### Summary

PR #22 implements 6 layout commands that transform the AI from a shape creator into an intelligent layout engine. Users can now ask the AI to arrange shapes into rows, columns, grids, and centered positions with natural language.

### Key Deliverables

1. **Geometry Utilities** - Pure functions for layout calculations
2. **6 Layout Functions** - Complete Canvas API implementations
3. **AI Integration** - Function schemas and system prompt updates
4. **Comprehensive Testing** - Test strategy for all functions
5. **Documentation** - This complete planning document

### Expected Impact

**For Users:**
- Faster layouts ("arrange in a row" vs manual positioning)
- Perfect spacing and alignment
- Natural language control

**For AI Capability:**
- Demonstrates spatial intelligence
- Enables complex multi-step workflows
- Shows understanding of design concepts

**For Project:**
- Required feature (project brief)
- Key differentiator
- Impressive demo material

### Next Steps

1. ✅ Review this PR document
2. ⏳ Implement Phase 1 (Geometry utilities)
3. ⏳ Implement Phase 2-3 (Layout functions)
4. ⏳ Implement Phase 4 (AI integration)
5. ⏳ Test comprehensively
6. ⏳ Deploy to production
7. ⏳ Move to PR #23 (Complex operations)

---

**Document Status**: ✅ Planning Complete - Ready for Implementation  
**Estimated Total Time**: 5.5-6 hours  
**Priority**: 🔴 CRITICAL  
**Last Updated**: October 16, 2025

---


