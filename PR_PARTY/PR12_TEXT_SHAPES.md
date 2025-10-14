# PR #12: Text Shape Support 📝

**Branch**: `feat/text-shapes`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: HIGH (Core Shape Completion)  
**Estimated Time**: 4-5 hours  
**Risk Level**: MEDIUM

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

---

## Overview

### Goal
Add text shape type with inline editing, font customization, and robust cross-platform support that enables AI programmatic control.

### Why This Matters
- **Required for final submission**: 4 shape types needed (rectangle ✅, circle ✅, line ✅, text ⏳)
- **AI readiness**: Text must be programmable via `createText(text, x, y, fontSize, fontWeight, color)`
- **User experience**: Essential for labels, annotations, and content creation
- **Foundation**: Establishes patterns for rich text editing and content management

### Key Features
- ✅ Click-to-place text creation (no drag needed)
- ✅ Double-click inline editing (textarea overlay)
- ✅ Font size, weight, color customization
- ✅ Auto-resize text box based on content
- ✅ Multi-line support with proper wrapping
- ✅ Edit locking (prevent simultaneous edits)
- ✅ Full locking mechanism (prevents user conflicts)
- ✅ Real-time sync across all users (<100ms)
- ✅ Cross-platform support (desktop + mobile)

---

## Architecture & Design Decisions

### 1. Text Creation Pattern

**Decision**: **Click-to-place** (not click-drag like other shapes)

```javascript
// Text creation flow
function handleMouseDown(e) {
  if (mode === 'draw' && shapeType === 'text' && e.target === e.target.getStage()) {
    const pos = stage.getRelativePointerPosition();
    
    // Create text immediately at click position
    await addShape({
      x: pos.x,
      y: pos.y,
      text: 'Text',  // Default text
      fontSize: 16,
      fontWeight: 'normal',
      color: getRandomColor(SHAPE_COLORS),
      type: 'text'
    });
  }
}
```

**Rationale**:
- ✅ More intuitive for text (users expect immediate placement)
- ✅ Consistent with design tools (Figma, Sketch, etc.)
- ✅ No preview needed (text is lightweight)
- ✅ Faster workflow for text-heavy content

**Alternative Considered**: Click-drag for text box sizing
- ❌ Rejected: Text should auto-size to content, not fixed dimensions

---

### 2. Inline Editing Architecture

**Decision**: **Overlay textarea** for editing (not Konva Text editing)

```javascript
// Text editing state
const [editingTextId, setEditingTextId] = useState(null);
const [editingText, setEditingText] = useState('');

// Double-click handler
function handleTextDoubleClick(shapeId, currentText) {
  setEditingTextId(shapeId);
  setEditingText(currentText);
  // Show textarea overlay
}

// Save handler
async function handleTextSave() {
  if (editingTextId) {
    await updateShape(editingTextId, { text: editingText });
    setEditingTextId(null);
    setEditingText('');
  }
}
```

**Why Overlay Approach?**
- ✅ Native text editing (cursor, selection, copy/paste)
- ✅ Better mobile support (virtual keyboard)
- ✅ Familiar editing experience
- ✅ No Konva text editing complexity
- ✅ Easy to implement undo/redo

**Alternative Considered**: Konva Text with `editable={true}`
- ❌ Rejected: Limited functionality, mobile issues, complex event handling

---

### 3. Text Sizing Strategy

**Decision**: **Auto-size to content** with manual override

```javascript
// Text sizing logic
function calculateTextSize(text, fontSize, fontWeight) {
  // Create temporary canvas to measure text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fontSize}px Arial`;
  
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const height = lines.length * fontSize * 1.2; // Line height factor
  
  return {
    width: Math.max(maxWidth + 20, 50),  // Min 50px width
    height: Math.max(height + 20, fontSize + 10)  // Min height
  };
}
```

**Benefits**:
- ✅ Text box fits content perfectly
- ✅ No wasted space
- ✅ Easy to read and edit
- ✅ Consistent with design tools

**Future Enhancement**: Manual resize handles (not in PR #12)

---

### 4. Multi-Line Support

**Decision**: **Automatic wrapping** with manual line breaks

```javascript
// Text rendering with line breaks
<Text
  text={shape.text}
  fontSize={shape.fontSize}
  fontFamily="Arial"
  fontStyle={shape.fontWeight}
  fill={shape.color}
  width={shape.width}
  height={shape.height}
  align="left"
  verticalAlign="top"
  wrap="word"  // Konva auto-wrapping
  lineHeight={1.2}
/>
```

**Features**:
- ✅ Enter key creates new lines
- ✅ Auto-wrap long words
- ✅ Preserve manual line breaks
- ✅ Consistent line height

---

## Cross-Platform Considerations

### Desktop Support

**Platforms**: Windows, macOS, Linux  
**Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Considerations**:
- **Text selection**: Native browser text selection in textarea
- **Keyboard shortcuts**: Ctrl+A, Ctrl+C, Ctrl+V work natively
- **Font rendering**: Consistent across browsers
- **Copy/paste**: Native clipboard integration

**Testing**: 
- Chrome (primary)
- Firefox (font rendering differences)
- Safari (WebKit text handling)

---

### Mobile/Tablet Support

**Platforms**: iOS, Android  
**Input**: Touch events + virtual keyboard

**Challenges**:
1. **Virtual keyboard**: Must not interfere with textarea
2. **Touch selection**: Text selection with finger
3. **Zoom behavior**: Prevent page zoom during text editing
4. **Input focus**: Reliable focus management

**Solutions**:
```javascript
// Mobile-optimized textarea
<textarea
  value={editingText}
  onChange={handleTextChange}
  onBlur={handleTextSave}
  onKeyDown={handleKeyDown}
  style={{
    position: 'absolute',
    left: textPosition.x,
    top: textPosition.y,
    width: textPosition.width,
    height: textPosition.height,
    fontSize: shape.fontSize,
    fontFamily: 'Arial',
    fontWeight: shape.fontWeight,
    color: shape.color,
    background: 'transparent',
    border: '2px solid #646cff',
    borderRadius: '4px',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    // Mobile optimizations
    touchAction: 'manipulation',  // Prevent zoom
    inputMode: 'text',           // Show text keyboard
    autoComplete: 'off',          // Disable autocomplete
    spellCheck: false            // Disable spell check
  }}
  autoFocus
/>
```

**Testing**:
- Chrome DevTools mobile emulation
- Real device testing (iOS Safari, Android Chrome)
- Virtual keyboard behavior
- Text selection with touch

---

### Browser-Specific Issues

| Issue | Browser | Mitigation |
|-------|---------|------------|
| **Font rendering** | Firefox | Use web-safe fonts, test font metrics |
| **Text selection** | Safari | Explicit touch event handling |
| **Virtual keyboard** | Mobile Safari | Prevent zoom, manage viewport |
| **Copy/paste** | All | Native browser APIs, no custom handling |
| **Text metrics** | All | Canvas-based measurement for consistency |

---

## Locking Mechanism Integration

### Existing Infrastructure (Reuse ✅)

**Good news**: Text shapes use the **exact same locking system** as other shapes

**How it works**:
```javascript
// 1. User starts editing text
handleTextDoubleClick(textId) → lockShape(textId, userId)

// 2. Firestore updates
{
  lockedBy: 'user-abc-123',
  lockedAt: Timestamp.now()
}

// 3. Other users see locked state
isLockedByOther = (shape.lockedBy !== currentUserId)

// 4. Other users cannot edit (visual feedback)
- Text rendered with reduced opacity (0.6)
- Lock icon 🔒 displayed above text
- Double-click disabled

// 5. User finishes editing
handleTextSave() → unlockShape(textId, userId)

// 6. Firestore updates
{
  lockedBy: null,
  lockedAt: null
}
```

**Zero changes needed to locking system** ✅

---

### Lock Visual Feedback for Text

**Challenge**: Where to position the lock icon for text?

**Solution**: Position at text **top-left corner**

```javascript
// In Shape.jsx
{isLockedByOther && isText && (
  <Group
    x={shape.x - 15}  // Left of text
    y={shape.y - 35}  // Above text
    listening={false}
  >
    {/* Background */}
    <Rect
      x={0}
      y={0}
      width={30}
      height={30}
      fill="#ef4444"
      cornerRadius={6}
      shadowColor="black"
      shadowBlur={4}
      shadowOpacity={0.5}
    />
    
    {/* Lock emoji */}
    <Text
      x={0}
      y={0}
      width={30}
      height={30}
      text="🔒"
      fontSize={18}
      align="center"
      verticalAlign="middle"
    />
  </Group>
)}
```

**Visual**:
```
🔒  ← Lock icon at top-left
Text content here...
```

---

### Edit Locking (Text-Specific)

**Challenge**: Prevent multiple users from editing the same text simultaneously

**Solution**: **Edit-level locking** in addition to shape locking

```javascript
// Text editing state
const [editingTextId, setEditingTextId] = useState(null);

// Double-click handler with edit lock
function handleTextDoubleClick(shapeId, currentText) {
  // Check if already being edited
  if (editingTextId === shapeId) return;
  
  // Check if locked by another user
  if (shape.lockedBy && shape.lockedBy !== currentUserId) {
    alert('This text is being edited by another user');
    return;
  }
  
  // Acquire edit lock
  setEditingTextId(shapeId);
  setEditingText(currentText);
  
  // Show textarea overlay
  showTextEditor(shapeId, currentText);
}

// Save handler with edit unlock
async function handleTextSave() {
  if (editingTextId) {
    await updateShape(editingTextId, { text: editingText });
    setEditingTextId(null);  // Release edit lock
    hideTextEditor();
  }
}
```

**Benefits**:
- ✅ Prevents simultaneous edits
- ✅ Clear visual feedback
- ✅ Graceful conflict resolution
- ✅ No data loss

---

## Future-Proofing

### Extensibility for Future Text Features

**Architecture designed to support** (not implemented in PR #12):

```javascript
// PR #12 (now)
{
  type: 'text',
  x, y, width, height,
  text: 'Hello World',
  fontSize: 16,
  fontWeight: 'normal',
  color: '#000000'
}

// Future: Rich text formatting (PR #25+)
{
  // ... base fields ...
  fontFamily: 'Arial',        // Font selection
  textAlign: 'left',          // left | center | right
  verticalAlign: 'top',       // top | middle | bottom
  lineHeight: 1.2,           // Line spacing
  letterSpacing: 0,           // Character spacing
  textDecoration: 'none'      // none | underline | strikethrough
}

// Future: Text styles (PR #26+)
{
  // ... base fields ...
  backgroundColor: '#ffffff', // Text background
  borderColor: '#cccccc',     // Text border
  borderWidth: 1,             // Border thickness
  borderRadius: 4,            // Rounded corners
  padding: 8,                 // Internal spacing
  shadowColor: '#000000',     // Text shadow
  shadowBlur: 2,              // Shadow blur
  shadowOffsetX: 1,           // Shadow X offset
  shadowOffsetY: 1            // Shadow Y offset
}

// Future: Advanced text (PR #27+)
{
  // ... base fields ...
  maxWidth: 300,              // Text wrapping width
  maxHeight: 200,              // Text clipping height
  overflow: 'hidden',         // hidden | visible | scroll
  whiteSpace: 'normal',       // normal | nowrap | pre
  wordBreak: 'break-word'     // break-word | break-all
}
```

**Design Benefits**:
- ✅ Additive changes only (backward compatible)
- ✅ Missing fields = default values
- ✅ No breaking changes to existing text
- ✅ Easy to test new features independently

---

### AI Integration Readiness

**Basic AI Function** (PR #20):
```typescript
createText(text, x, y, fontSize, fontWeight, color)

// Example
createText('Hello World', 100, 100, 24, 'bold', '#FF0000')
// Creates bold red 24px text at (100,100)
```

**Advanced AI Functions** (PR #21-23):
```typescript
// Text manipulation
updateText(shapeId, newText)           // Change text content
changeTextStyle(shapeId, fontSize, fontWeight, color)  // Style changes
resizeText(shapeId, width, height)    // Manual sizing

// Text queries
getTextContent(shapeId)                // Get current text
getTextMetrics(shapeId)                // Get size, font info
findTextByContent(searchText)          // Search text content
findTextByStyle(fontSize, color)       // Find by styling

// Text layout
alignText(shapeIds, direction)         // Align multiple text blocks
createTextBlock(text, x, y, width)     // Wrapped text block
createTextList(items, x, y, style)     // Bulleted/numbered list
```

**AI Query Support**:
```typescript
getTextLength(shapeId)         // Character count
getTextLines(shapeId)          // Line count
getTextBounds(shapeId)         // Bounding box
getTextFont(shapeId)           // Font information
```

**Data Structure Benefits for AI**:
- ✅ Text content is human-readable
- ✅ Font properties are intuitive
- ✅ Position and size are clear
- ✅ Easy to search and manipulate

---

### Rotation Support (PR #16 Compatibility)

**Challenge**: Text rotation needs special handling

**Current Behavior** (PR #12):
```javascript
// Text angle is 0 (no rotation field yet)
const angle = 0;
// Text renders normally
```

**Future Behavior** (PR #16):
```javascript
// When rotation field is added:
{
  x, y, width, height,
  text, fontSize, fontWeight, color,
  rotation: 0  // ADDITIONAL rotation
}

// Text rotation in Konva
<Text
  rotation={rotation}
  offsetX={width / 2}   // Rotate around center
  offsetY={height / 2}
  // ... other props
/>
```

**Why this approach?**
- ✅ Backward compatible (no rotation = 0)
- ✅ Most text won't need rotation
- ✅ Rotation field allows "tilting" text
- ✅ Consistent with other shape rotation

**Decision for PR #12**: 
- Don't add rotation field yet
- Wait for PR #16 to add it to all shapes uniformly
- Text created in PR #12 will work perfectly with PR #16

---

## Implementation Details

### Files Modified

1. ✅ `src/utils/constants.js` - Add text constants
2. ✅ `src/services/shapes.js` - Add text field support
3. ✅ `src/components/Canvas/Shape.jsx` - Add text rendering
4. ✅ `src/components/Canvas/Canvas.jsx` - Add text creation
5. ✅ `src/components/Canvas/TextEditor.jsx` - NEW: Inline text editor
6. ✅ `FIRESTORE_SCHEMA.md` - Document text structure

---

### File 1: `src/utils/constants.js`

**Changes**: Add text type and defaults

```javascript
// Shape types (EXTEND existing)
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text',  // NEW
};

// Text defaults (NEW)
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT_WEIGHT = 'normal';
export const DEFAULT_TEXT = 'Text';
export const MIN_TEXT_WIDTH = 50;
export const MIN_TEXT_HEIGHT = 20;
```

**Impact**: 
- +4 lines of code
- No breaking changes
- Backward compatible

---

### File 2: `src/services/shapes.js`

**Changes**: Extend `addShape` and `addShapesBatch` for text fields

```javascript
export async function addShape(shapeData, userId) {
  try {
    // Base document (all shapes)
    const baseDoc = {
      x: shapeData.x,
      y: shapeData.y,
      color: shapeData.color,
      type: shapeData.type || 'rectangle',
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Type-specific fields
    if (shapeData.type === 'text') {
      // Text uses text, fontSize, fontWeight
      baseDoc.text = shapeData.text || DEFAULT_TEXT;
      baseDoc.fontSize = shapeData.fontSize || DEFAULT_FONT_SIZE;
      baseDoc.fontWeight = shapeData.fontWeight || DEFAULT_FONT_WEIGHT;
      baseDoc.width = shapeData.width || MIN_TEXT_WIDTH;
      baseDoc.height = shapeData.height || MIN_TEXT_HEIGHT;
    } else if (shapeData.type === 'line') {
      // Lines use endX, endY, strokeWidth
      baseDoc.endX = shapeData.endX;
      baseDoc.endY = shapeData.endY;
      baseDoc.strokeWidth = shapeData.strokeWidth || DEFAULT_STROKE_WIDTH;
    } else {
      // Rectangles/Circles use width, height
      baseDoc.width = shapeData.width;
      baseDoc.height = shapeData.height;
    }
    
    const docRef = await addDoc(collection(db, SHAPES_COLLECTION), baseDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error adding shape:', error.message);
    throw error;
  }
}
```

**Also update `addShapesBatch`** with same logic.

**Impact**:
- ~30 lines modified
- Maintains backward compatibility
- All existing shapes continue to work

---

### File 3: `src/components/Canvas/Shape.jsx`

**Major Changes**: Add text rendering and interaction

```javascript
import { Rect, Circle, Line, Transformer, Group, Text } from 'react-konva';
// Text already imported

function Shape({ shape, isSelected, onSelect, onDragEnd, onDragStart, onDragMove, ... }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  
  // Determine shape type
  const shapeType = shape.type || SHAPE_TYPES.RECTANGLE;
  const isCircle = shapeType === SHAPE_TYPES.CIRCLE;
  const isLine = shapeType === SHAPE_TYPES.LINE;
  const isText = shapeType === SHAPE_TYPES.TEXT;  // NEW
  
  // Handle double-click for text editing
  function handleDoubleClick(e) {
    if (isText && canInteract) {
      e.cancelBubble = true;
      if (e.evt) e.evt.stopPropagation();
      onTextEdit(shape.id, shape.text);
    }
  }
  
  // Render text
  if (isText) {
    return (
      <>
        <Group>
          <Text
            ref={shapeRef}
            id={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            text={shape.text}
            fontSize={shape.fontSize || DEFAULT_FONT_SIZE}
            fontFamily="Arial"
            fontStyle={shape.fontWeight || DEFAULT_FONT_WEIGHT}
            fill={shape.color}
            align="left"
            verticalAlign="top"
            wrap="word"
            lineHeight={1.2}
            draggable={canDrag}
            dragDistance={3}
            listening={canInteract}
            onClick={canInteract ? handleClick : undefined}
            onTap={canInteract ? handleClick : undefined}
            onDblClick={canInteract ? handleDoubleClick : undefined}
            onDblTap={canInteract ? handleDoubleClick : undefined}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            // Selection styling
            shadowColor={isSelected ? '#646cff' : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowOpacity={isSelected ? 0.8 : 0}
            opacity={isLockedByOther ? 0.6 : 1}
            // Performance
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
          
          {/* Lock icon at top-left */}
          {isLockedByOther && (
            <Group
              x={shape.x - 15}
              y={shape.y - 35}
              listening={false}
            >
              <Rect
                x={0} y={0}
                width={30} height={30}
                fill="#ef4444"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.5}
              />
              <Text
                x={0} y={0}
                width={30} height={30}
                text="🔒"
                fontSize={18}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          )}
        </Group>
        
        {/* Transformer for selected text */}
        {isSelected && !isLockedByOther && (
          <Transformer
            ref={transformerRef}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={false}  // No rotation for now
            borderStroke="#646cff"
            borderStrokeWidth={2}
          />
        )}
      </>
    );
  }
  
  // Existing rectangle/circle/line rendering...
}

// Update React.memo comparison
export default memo(Shape, (prevProps, nextProps) => {
  // Text-specific comparison
  if (prevProps.shape.type === 'text' && nextProps.shape.type === 'text') {
    return (
      prevProps.shape.id === nextProps.shape.id &&
      prevProps.shape.x === nextProps.shape.x &&
      prevProps.shape.y === nextProps.shape.y &&
      prevProps.shape.width === nextProps.shape.width &&
      prevProps.shape.height === nextProps.shape.height &&
      prevProps.shape.text === nextProps.shape.text &&
      prevProps.shape.fontSize === nextProps.shape.fontSize &&
      prevProps.shape.fontWeight === nextProps.shape.fontWeight &&
      prevProps.shape.color === nextProps.shape.color &&
      prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isLockedByOther === nextProps.isLockedByOther
    );
  }
  
  // Existing comparisons for rectangle/circle/line...
});
```

**Impact**:
- ~120 lines added
- Clean separation of text logic
- No changes to existing shape code

---

### File 4: `src/components/Canvas/Canvas.jsx`

**Changes**: Add text creation mode and text editing

```javascript
import { SHAPE_TYPES, DEFAULT_FONT_SIZE, DEFAULT_FONT_WEIGHT, DEFAULT_TEXT } from '../../utils/constants';

function Canvas() {
  // ... existing state ...
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Text creation in handleMouseDown
  function handleMouseDown(e) {
    if (mode === 'draw' && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      const pos = stage.getRelativePointerPosition();
      
      if (shapeType === SHAPE_TYPES.TEXT) {
        // Create text immediately at click position
        try {
          await addShape({
            x: pos.x,
            y: pos.y,
            text: DEFAULT_TEXT,
            fontSize: DEFAULT_FONT_SIZE,
            fontWeight: DEFAULT_FONT_WEIGHT,
            color: getRandomColor(SHAPE_COLORS),
            width: MIN_TEXT_WIDTH,
            height: MIN_TEXT_HEIGHT,
            type: 'text'
          });
        } catch (error) {
          console.error('Failed to add text:', error.message);
          alert(`Failed to create text: ${error.message}`);
        }
      } else {
        // Existing rectangle/circle/line creation...
      }
      
      deselectShape();
    }
  }
  
  // Text editing handlers
  function handleTextEdit(shapeId, currentText) {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Calculate text editor position
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    
    setTextEditorPosition({
      x: stageBox.left + (shape.x * scale),
      y: stageBox.top + (shape.y * scale),
      width: shape.width * scale,
      height: shape.height * scale
    });
    
    setEditingTextId(shapeId);
    setEditingText(currentText);
  }
  
  function handleTextSave() {
    if (editingTextId) {
      updateShape(editingTextId, { text: editingText });
      setEditingTextId(null);
      setEditingText('');
    }
  }
  
  function handleTextCancel() {
    setEditingTextId(null);
    setEditingText('');
  }
  
  function handleTextChange(e) {
    setEditingText(e.target.value);
  }
  
  function handleTextKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
  }
  
  return (
    <div>
      <Stage {...stageProps}>
        <Layer>
          {/* Existing shapes... */}
          
          {/* Text shapes */}
          {shapes.map(shape => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={selectedShapeId === shape.id}
              onSelect={() => selectShape(shape.id)}
              onDragEnd={handleShapeDragEnd}
              onDragStart={handleShapeDragStart}
              onDragMove={handleShapeDragMove}
              onTextEdit={handleTextEdit}  // NEW
              isDraggable={!isDraggingShape}
              isInteractive={true}
              isLockedByOther={shape.lockedBy && shape.lockedBy !== user?.uid}
              currentUserId={user?.uid}
            />
          ))}
        </Layer>
      </Stage>
      
      {/* Text editor overlay */}
      {editingTextId && (
        <textarea
          value={editingText}
          onChange={handleTextChange}
          onBlur={handleTextSave}
          onKeyDown={handleTextKeyDown}
          style={{
            position: 'fixed',
            left: textEditorPosition.x,
            top: textEditorPosition.y,
            width: textEditorPosition.width,
            height: textEditorPosition.height,
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#000000',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #646cff',
            borderRadius: '4px',
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            zIndex: 1000,
            padding: '4px',
            lineHeight: '1.2',
            // Mobile optimizations
            touchAction: 'manipulation',
            inputMode: 'text',
            autoComplete: 'off',
            spellCheck: false
          }}
          autoFocus
        />
      )}
      
      {/* Add text button to shape type selector */}
      {mode === 'draw' && (
        <div className="shape-type-buttons">
          {/* Existing rectangle/circle/line buttons... */}
          
          <button
            onClick={() => setShapeType(SHAPE_TYPES.TEXT)}
            title="Add Text"
            className={shapeType === SHAPE_TYPES.TEXT ? 'active' : ''}
          >
            <span>📝</span>
            <span>Text</span>
          </button>
        </div>
      )}
      
      {/* Update instructions */}
      <div className="instructions">
        {mode === 'draw' && (
          <span>
            Click to create {
              shapeType === SHAPE_TYPES.TEXT ? 'text' :
              shapeType === SHAPE_TYPES.LINE ? 'lines' :
              shapeType === SHAPE_TYPES.CIRCLE ? 'circles' :
              'rectangles'
            }
          </span>
        )}
      </div>
    </div>
  );
}
```

**Impact**:
- ~80 lines added/modified
- Clean integration with existing shape creation flow
- UI includes new text button

---

### File 5: `FIRESTORE_SCHEMA.md`

**Changes**: Document text schema

```markdown
### Text Shape

Text shapes are created by clicking on the canvas and can be edited by double-clicking.

**Firestore Document Structure:**
```json
{
  "id": "auto-generated-id",
  "type": "text",
  
  "x": 100,              // X position
  "y": 100,              // Y position
  "width": 150,           // Text box width
  "height": 40,           // Text box height
  
  "text": "Hello World",  // Text content
  "fontSize": 16,         // Font size in pixels
  "fontWeight": "normal", // Font weight: 'normal' | 'bold'
  "color": "#000000",     // Text color (hex)
  
  "createdBy": "user-id",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  
  "lockedBy": null,      // User ID if currently being edited
  "lockedAt": null       // Timestamp of lock acquisition
}
```

**Field Notes:**
- Text content can include line breaks (\n)
- Font size affects both text size and text box height
- Text box auto-sizes to content but has minimum dimensions
- Double-click editing shows overlay textarea
- Locking prevents simultaneous edits

**Calculations:**
```javascript
// Text box sizing
const textMetrics = measureText(text, fontSize, fontWeight);
const width = Math.max(textMetrics.width + 20, MIN_TEXT_WIDTH);
const height = Math.max(textMetrics.height + 20, MIN_TEXT_HEIGHT);

// Line count
const lineCount = text.split('\n').length;

// Character count
const charCount = text.length;
```
```

**Impact**:
- +40 lines documentation
- Clear reference for future development
- Helps with AI function implementation

---

## Testing Strategy

### Manual Testing Checklist

**Basic Functionality**:
- [ ] Create text by clicking in draw mode
- [ ] Text appears with default content "Text"
- [ ] Text has correct font size and color
- [ ] Text box auto-sizes to content
- [ ] Double-click text to edit
- [ ] Textarea overlay appears with current text
- [ ] Enter key saves text
- [ ] Escape key cancels editing
- [ ] Click outside textarea saves text

**Selection & Interaction**:
- [ ] Click on text selects it
- [ ] Selected text shows blue glow/shadow
- [ ] Click elsewhere deselects text
- [ ] Drag selected text moves it
- [ ] Text maintains position and content when moved
- [ ] Delete key removes selected text
- [ ] Transformer handles work for resizing

**Multi-User Testing**:
- [ ] User A creates text → User B sees it (<100ms)
- [ ] User B creates text → User A sees it (<100ms)
- [ ] User A starts editing text → User B sees 🔒 lock icon
- [ ] User B cannot edit locked text
- [ ] User A finishes editing → lock clears, User B can now edit
- [ ] User A disconnects during edit → lock auto-clears after 30s

**Text Editing**:
- [ ] Multi-line text works (Enter key creates new lines)
- [ ] Long text wraps properly
- [ ] Copy/paste works in textarea
- [ ] Text selection works with mouse
- [ ] Backspace/Delete work in textarea
- [ ] Undo/Redo work in textarea (browser native)

**Performance Testing**:
- [ ] Create 100 text shapes → FPS stays at 60
- [ ] Create 500 text shapes → FPS stays at 55+
- [ ] Edit text with 500+ shapes → smooth, no lag
- [ ] Pan/zoom with 500+ text shapes → smooth, no lag

**Cross-Browser Testing**:
- [ ] Chrome: All features work
- [ ] Firefox: All features work, font rendering consistent
- [ ] Safari: All features work, text selection works
- [ ] Edge: All features work (should match Chrome)

**Mobile Testing** (Chrome DevTools + Real Device):
- [ ] Text creation works with touch
- [ ] Double-tap to edit works
- [ ] Virtual keyboard appears and works
- [ ] Text selection works with finger
- [ ] No zoom conflicts during editing
- [ ] Textarea positioning correct on mobile

---

### Automated Test Scenarios

**Test 1: Text Creation**
```javascript
// Setup
const position = { x: 100, y: 100 };
const textContent = 'Hello World';

// Action
createText(position, textContent);

// Assert
const texts = await getShapesByType('text');
expect(texts).toHaveLength(1);
expect(texts[0].text).toBe('Hello World');
expect(texts[0].x).toBe(100);
expect(texts[0].y).toBe(100);
```

**Test 2: Text Editing**
```javascript
// Setup
const text = await createText({ x: 0, y: 0 }, 'Original');
const newContent = 'Updated text';

// Action
updateText(text.id, newContent);

// Assert
const updatedText = await getShape(text.id);
expect(updatedText.text).toBe('Updated text');
```

**Test 3: Text Locking**
```javascript
// Setup
const text = await createText({ x: 0, y: 0 }, 'Test');
const user1 = 'user-abc';
const user2 = 'user-xyz';

// User 1 starts editing
await lockShape(text.id, user1);

// User 2 tries to edit (should fail)
const result = await startTextEdit(text.id, user2);
expect(result).toBe(false);

// Verify lock state
const textData = await getShape(text.id);
expect(textData.lockedBy).toBe(user1);
```

---

### Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Text creation time | <50ms | `console.time('createText')` |
| Render 100 text shapes | 60 FPS | Chrome DevTools Performance |
| Render 500 text shapes | 55+ FPS | Chrome DevTools Performance |
| Text editing response | <100ms | User interaction timing |
| Sync latency | <100ms | Network tab + timestamps |
| Lock acquisition | <50ms | Firestore latency |

**How to measure**:
1. Chrome DevTools > Performance tab
2. Record while performing action
3. Check FPS graph (should stay above 55 FPS)
4. Check scripting time (should be <16ms per frame)

---

## Rollout Plan

### Phase 1: Development
**Duration**: 4-5 hours  
**Status**: Ready to start

**Tasks**:
1. ✅ Create branch `feat/text-shapes`
2. ⏳ Update `constants.js` (5 min)
3. ⏳ Update `shapes.js` service (30 min)
4. ⏳ Update `Shape.jsx` component (90 min)
5. ⏳ Update `Canvas.jsx` (60 min)
6. ⏳ Update `FIRESTORE_SCHEMA.md` (10 min)
7. ⏳ Local testing with 2 browser windows (60 min)

**Git Workflow**:
```bash
# Create branch
git checkout -b feat/text-shapes

# Make changes, commit frequently
git add src/utils/constants.js
git commit -m "feat(text): add text constants and types"

git add src/services/shapes.js
git commit -m "feat(text): add text field support in shapes service"

git add src/components/Canvas/Shape.jsx
git commit -m "feat(text): add text rendering and interaction"

git add src/components/Canvas/Canvas.jsx
git commit -m "feat(text): add text creation and editing"

git add FIRESTORE_SCHEMA.md
git commit -m "docs(text): document text shape schema"

# Push to remote
git push origin feat/text-shapes
```

---

### Phase 2: Testing
**Duration**: 1.5 hours  
**Dependencies**: Phase 1 complete

**Tasks**:
1. ⏳ Multi-browser testing (30 min)
   - Chrome (primary)
   - Firefox
   - Safari
2. ⏳ Multi-user testing (30 min)
   - 2 browsers simultaneously
   - Test text editing conflicts
   - Test sync
3. ⏳ Performance testing (30 min)
   - Create 100 text shapes
   - Create 500 text shapes
   - Check FPS
4. ⏳ Mobile testing (30 min)
   - Chrome DevTools mobile emulation
   - Real device testing

**Testing Environment**:
- Local dev server (`npm run dev`)
- 2-3 browser windows
- Chrome DevTools Performance tab
- Network throttling: Fast 3G

---

### Phase 3: Refinement
**Duration**: 1 hour  
**Dependencies**: Phase 2 complete, issues identified

**Potential Issues & Fixes**:
- **Issue**: Textarea positioning incorrect
  - **Fix**: Adjust position calculation for different screen sizes
- **Issue**: Text editing conflicts
  - **Fix**: Improve edit locking logic
- **Issue**: Performance lag with many text shapes
  - **Fix**: Optimize text rendering, add text culling
- **Issue**: Mobile keyboard issues
  - **Fix**: Adjust viewport handling, prevent zoom

**Commit Refinements**:
```bash
git add .
git commit -m "fix(text): improve textarea positioning and mobile support"
```

---

### Phase 4: Deployment
**Duration**: 30 min  
**Dependencies**: Phase 3 complete, all tests passing

**Tasks**:
1. ⏳ Final commit and push
2. ⏳ Create pull request
3. ⏳ Deploy to staging/production
4. ⏳ Test on deployed environment
5. ⏳ Merge to main

**Deployment**:
```bash
# Final push
git push origin feat/text-shapes

# Merge to main (after review)
git checkout main
git merge feat/text-shapes

# Build and deploy
npm run build
firebase deploy
```

---

### Phase 5: Documentation & Handoff
**Duration**: 15 min  
**Dependencies**: Deployed to production

**Tasks**:
1. ⏳ Update README if needed
2. ⏳ Update progress.md (mark PR #12 complete)
3. ⏳ Update activeContext.md (note completion)
4. ⏳ Verify PR #13 can proceed

**Update Progress Tracker**:
```markdown
### ✅ Text Shape (PR #12)
**Status**: Complete  
**Deployed**: [date]

Features:
- Click-to-place text creation
- Double-click inline editing
- Font size, weight, color customization
- Auto-resize text box
- Multi-line support
- Edit locking
- Full locking support
- Real-time sync
- Cross-platform support

Known Issues: None

Next: PR #13 - Multi-Select Foundation
```

---

## Success Criteria

### Must Have ✅

**Core Functionality**:
- [ ] Text can be created by clicking in draw mode
- [ ] Text renders with correct content and styling
- [ ] Text has configurable font size, weight, and color
- [ ] Text can be selected by clicking
- [ ] Selected text shows visual feedback (blue glow)
- [ ] Text can be moved by dragging
- [ ] Text maintains content and position when moved
- [ ] Text can be deleted with Delete/Backspace key
- [ ] Double-click text opens inline editor
- [ ] Text editor saves changes on Enter or blur
- [ ] Text editor cancels changes on Escape

**Multi-User**:
- [ ] Text syncs across users in real-time (<100ms)
- [ ] Text editing locking works (prevents conflicts)
- [ ] Lock indicator (🔒) displays correctly
- [ ] Stale locks auto-cleanup after 30s

**Performance**:
- [ ] 60 FPS maintained with 100+ text shapes
- [ ] No lag during text creation
- [ ] No lag during text editing
- [ ] Canvas remains responsive with 500+ shapes

**Cross-Platform**:
- [ ] Works in Chrome 90+
- [ ] Works in Firefox 88+
- [ ] Works in Safari 14+
- [ ] Text editing works on desktop
- [ ] Touch events work on mobile (Chrome DevTools)

---

### Nice to Have 🎯

**User Experience**:
- [ ] Text editor positioning is perfect
- [ ] Visual feedback is clear and immediate
- [ ] Text editing is smooth and responsive
- [ ] Mobile text editing works on real device (iOS/Android)

**Performance**:
- [ ] 60 FPS maintained with 500+ text shapes
- [ ] Bulk create 100 text shapes completes in <3s
- [ ] Sync latency consistently <50ms

---

### Out of Scope ⛔

These are **not** part of PR #12:
- ❌ Rich text formatting (bold, italic, underline)
- ❌ Font family selection
- ❌ Text alignment options
- ❌ Text rotation (wait for PR #16)
- ❌ Text shadows or effects
- ❌ Text background colors
- ❌ Text borders
- ❌ Text overflow handling
- ❌ Text search functionality
- ❌ Text export options

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Severity | Mitigation |
|------|-------------|--------|----------|------------|
| **Textarea positioning** | Medium | High | 🟡 Medium | Test on multiple screen sizes, use fixed positioning |
| **Edit conflicts** | Medium | High | 🟡 Medium | Robust edit locking, clear user feedback |
| **Mobile keyboard** | High | Medium | 🟡 Medium | Test on real devices, prevent zoom conflicts |
| **Performance with many texts** | Low | High | 🟢 Low | Text rendering is lightweight, should be fine |
| **Cross-browser text rendering** | Low | Medium | 🟢 Low | Use web-safe fonts, test on all browsers |
| **Locking conflicts** | Very Low | High | 🟢 Low | Reusing proven system from existing shapes |

**Overall Risk Level**: **MEDIUM** 🟡

---

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Timeline delay** | Medium | Medium | Well-defined scope, 5-hour estimate has buffer |
| **Blocks PR #13** | Low | High | Text is independent, unlikely to block multi-select |
| **Breaking changes** | Very Low | Critical | All changes additive, existing shapes unaffected |
| **User confusion** | Low | Low | Text editing is intuitive, follows standard patterns |

---

## Post-Implementation

### Immediate Next Steps

1. **PR #13: Multi-Select Foundation** (Next Priority)
   - Builds on text shapes
   - Enables group operations
   - Foundation for advanced features
   
2. **Update Memory Bank**
   - Mark PR #12 complete in progress.md
   - Update activeContext.md with current status
   - Note any learnings or issues encountered

3. **Performance Monitoring**
   - Monitor Firestore usage (should be minimal increase)
   - Check for any user-reported issues
   - Verify sync latency remains <100ms

---

### Future Enhancements

**Phase 1** (After MVP):
- Rich text formatting (bold, italic, underline)
- Font family selection
- Text alignment options
- Text background colors

**Phase 2** (Post-MVP):
- Text shadows and effects
- Text borders and styling
- Text overflow handling
- Text search functionality

**Phase 3** (Advanced):
- Text animations
- Text templates
- Text import/export
- Advanced typography

**AI Features** (PR #20-23):
- `createText()` function
- `updateText()` function
- `findTextByContent()` function
- Text formatting and styling commands

---

## Appendix

### Konva Text API Reference

```javascript
<Text
  // Position
  x={100}
  y={100}
  width={200}
  height={100}
  
  // Content
  text="Hello World"
  
  // Styling
  fontSize={16}
  fontFamily="Arial"
  fontStyle="normal"        // normal | bold | italic
  fill="#000000"           // Text color
  align="left"             // left | center | right
  verticalAlign="top"      // top | middle | bottom
  
  // Layout
  wrap="word"              // word | char | none
  lineHeight={1.2}         // Line spacing multiplier
  
  // Interaction
  draggable={true}
  onClick={handler}
  onDblClick={handler}
  onTap={handler}
  onDblTap={handler}
  
  // Performance
  perfectDrawEnabled={false}
  shadowForStrokeEnabled={false}
  
  // Shadow (selection feedback)
  shadowColor="#646cff"
  shadowBlur={10}
  shadowOpacity={0.8}
/>
```

---

### Text Measurement Utilities

```javascript
// Measure text dimensions
function measureText(text, fontSize, fontWeight, fontFamily = 'Arial') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const height = lines.length * fontSize * 1.2; // Line height factor
  
  return {
    width: maxWidth,
    height: height,
    lineCount: lines.length
  };
}

// Calculate text box size
function calculateTextBoxSize(text, fontSize, fontWeight) {
  const metrics = measureText(text, fontSize, fontWeight);
  return {
    width: Math.max(metrics.width + 20, MIN_TEXT_WIDTH),
    height: Math.max(metrics.height + 20, MIN_TEXT_HEIGHT)
  };
}

// Check if text fits in box
function textFitsInBox(text, fontSize, fontWeight, boxWidth, boxHeight) {
  const metrics = measureText(text, fontSize, fontWeight);
  return metrics.width <= boxWidth && metrics.height <= boxHeight;
}
```

---

### Git Commit Message Convention

```
feat(text): add text shape creation
feat(text): add text rendering in Shape component
feat(text): add text creation and editing in Canvas
feat(text): add inline text editor overlay
fix(text): improve textarea positioning
docs(text): document text schema in Firestore
test(text): add text editing tests
perf(text): optimize text rendering
```

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `perf`: Performance
- `refactor`: Code restructure
- `style`: Code style (formatting)
- `chore`: Maintenance

---

## Implementation Checklist

### Pre-Implementation
- [x] Plan reviewed and approved
- [x] Architecture decisions documented
- [x] Success criteria defined
- [x] Testing strategy defined

### Development
- [ ] Create branch `feat/text-shapes`
- [ ] Update `constants.js`
- [ ] Update `shapes.js`
- [ ] Update `Shape.jsx`
- [ ] Update `Canvas.jsx`
- [ ] Update `FIRESTORE_SCHEMA.md`
- [ ] Local testing (2 windows)

### Testing
- [ ] Multi-browser testing (Chrome, Firefox, Safari)
- [ ] Multi-user testing (2+ users)
- [ ] Performance testing (100+ text shapes, 60 FPS)
- [ ] Mobile testing (Chrome DevTools)

### Deployment
- [ ] All tests passing
- [ ] Code committed and pushed
- [ ] Pull request created
- [ ] Deployed to production
- [ ] Verified on deployed site

### Documentation
- [ ] README updated (if needed)
- [ ] progress.md updated
- [ ] activeContext.md updated
- [ ] PR #12 marked complete

---

## Conclusion

PR #12 implements text shapes with:
- ✅ **Solid architecture** (click-to-place, overlay editing)
- ✅ **Excellent UX** (intuitive editing, clear feedback)
- ✅ **Proven locking** (reuses existing infrastructure)
- ✅ **Cross-platform** (desktop + mobile support)
- ✅ **Future-proof** (extensible for rich text features)
- ✅ **AI-ready** (intuitive data structure for AI functions)
- ✅ **Medium risk** (text editing complexity, but well-defined scope)

**Total Implementation Time**: 4-5 hours  
**Confidence Level**: HIGH ✅  
**Ready to Implement**: YES 🚀

---

**Last Updated**: December 2024  
**Author**: Cursor AI + Human Collaboration  
**Status**: Planning Complete → Ready for Implementation
