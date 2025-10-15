# Rotation Analysis - Root Cause & Solution

## Current State (Main Branch)

### What's Working
- ✅ Rectangles and circles CAN be rotated visually (Konva Transformer defaults to `rotateEnabled: true`)
- ✅ Text shapes have a `transformend` handler that captures scale/size changes
- ✅ Rotation handle appears for rect/circle shapes

### What's Broken
- ❌ **Rectangle/Circle shapes**: No `transformend` event handler, so rotation changes are NEVER captured or saved to Firebase
- ❌ **Text shapes**: `rotateEnabled={false}` on line 554, so rotation is explicitly disabled
- ❌ **All shapes**: Even if rotation were captured, the values aren't being sent to Firebase because the handler doesn't include `rotation` in the updates object
- ❌ **Shapes service**: `addShape()` and `addShapesBatch()` don't include rotation in the Firestore document
- ❌ **Shape rendering**: Shapes don't apply the stored rotation value when rendering from database

## How Modern Canvas Apps Handle Rotation

Based on research of Figma and canvas best practices:

### 1. **Coordinate System**
Modern design tools use **center-based coordinates** for rotation:
- Store: `x`, `y` (center point), `width`, `height`, `rotation` (degrees 0-359)
- Rotation always happens around the shape's center point
- This avoids position drift when rotating

### 2. **Transform Tracking**
```javascript
// On transformend event:
{
  id: shapeId,
  x: node.x(),
  y: node.y(), 
  width: node.width() * node.scaleX(),
  height: node.height() * node.scaleY(),
  rotation: node.rotation() % 360,  // ← KEY: Capture rotation!
  // Reset scales after applying to dimensions
  scaleX: 1,
  scaleY: 1
}
```

### 3. **Database Schema**
```javascript
{
  id: string,
  type: 'rectangle' | 'circle' | 'text' | 'line',
  x: number,        // center x (or top-left, but be consistent)
  y: number,        // center y (or top-left, but be consistent)
  width: number,
  height: number,
  rotation: number, // 0-359 degrees
  color: string,
  // ... other props
}
```

### 4. **Rendering**
```javascript
<Rect
  x={shape.x}
  y={shape.y}
  width={shape.width}
  height={shape.height}
  rotation={shape.rotation || 0}  // ← Apply stored rotation
  // ...
/>
```

## The Fix (Proper Approach)

### Step 1: Add rotation field to all shapes in Firestore
```javascript
// services/shapes.js - addShape()
const baseDoc = {
  x: shapeData.x,
  y: shapeData.y,
  color: shapeData.color,
  type: shapeData.type || 'rectangle',
  rotation: shapeData.rotation || 0,  // ← ADD THIS
  createdBy: userId,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

### Step 2: Add transformend handler for rect/circle shapes
```javascript
// Shape.jsx - After the text handler
} else if (node && !isText && !isLine) {
  const handleTransform = () => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    const updates = {
      id: shape.id,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation() % 360  // ← CAPTURE ROTATION
    };
    
    node.scaleX(1);
    node.scaleY(1);
    
    if (onDragEnd) onDragEnd(updates);
  };
  
  node.on('transformend', handleTransform);
  return () => node.off('transformend', handleTransform);
}
```

### Step 3: Update text handler to capture rotation
```javascript
// Shape.jsx - Text handler (line 75)
const updates = {
  id: shape.id,
  x: node.x(),
  y: node.y(),
  width: newWidth,
  height: newHeight,
  fontSize: newFontSize,
  rotation: node.rotation() % 360  // ← ADD THIS
};
```

### Step 4: Enable rotation for text shapes
```javascript
// Shape.jsx - Text Transformer (line 554)
<Transformer
  ref={transformerRef}
  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
  rotateEnabled={true}  // ← CHANGE FROM FALSE
  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}  // Snap every 45°
  borderStroke="#646cff"
  borderStrokeWidth={2}
/>
```

### Step 5: Apply rotation when rendering shapes
```javascript
// Shape.jsx - Add rotation to all shape components
<Rect
  {...commonProps}
  x={shape.x}
  y={shape.y}
  width={shape.width}
  height={shape.height}
  rotation={shape.rotation || 0}  // ← ADD THIS
  cornerRadius={shape.type === 'rectangle' ? 8 : 0}
/>

<Circle
  {...commonProps}
  x={shape.x}
  y={shape.y}
  radius={Math.min(shape.width, shape.height) / 2}
  rotation={shape.rotation || 0}  // ← ADD THIS
/>

<Text
  {...textCommonProps}
  rotation={shape.rotation || 0}  // ← ADD THIS
  // ... other props
/>
```

### Step 6: Add rotation to React.memo comparisons
```javascript
// Shape.jsx - All comparison functions
prevProps.shape.rotation === nextProps.shape.rotation
```

## Key Insights

1. **The user was right**: Rotation already "worked" visually because Konva Transformer enables it by default for rect/circle
2. **The problem**: No event handler to capture the rotation changes and persist them
3. **Simple fix**: Add the `transformend` handler for rect/circle shapes, just like text already has
4. **Complete fix**: Include `rotation` in the updates object for ALL shape types

## Why PR#15 Attempts Failed

### Attempt #1
- Changed coordinate system to center-based with offsetX/offsetY
- This broke drag positioning because drag handlers expected top-left coords
- Too many changes at once

### Attempt #2  
- Fixed services to include rotation
- But still missed the core issue: NO transformend handler for rect/circle shapes
- Text handler still didn't capture rotation

## Next Steps

The fix should be done in this order:
1. ✅ Add rotation to shapes service (for new shapes)
2. ✅ Add transformend handler for rect/circle shapes
3. ✅ Update text transformend handler to include rotation
4. ✅ Enable rotateEnabled for text shapes
5. ✅ Apply rotation prop when rendering
6. ✅ Add rotation to memo comparisons
7. ✅ Test persistence

This is a minimal, focused fix that doesn't touch the coordinate system.

