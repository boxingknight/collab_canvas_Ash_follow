# CollabCanvas Revised Task List - AI-First Implementation

## Overview

**Priority Order:**
1. Core Shape Types (Lines, Text, Rotation)
2. Multi-Select & Layer Management
3. AI Canvas Agent (CRITICAL)
4. Stretch Goals (time permitting)

**Total PRs:** 24 core + 4 stretch = 28 PRs
**Estimated Timeline:** 8-10 days

---

## File Structure Updates

```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── AI/                    // NEW: AI components
│   │   │   ├── AIChat.jsx
│   │   │   ├── AICommandInput.jsx
│   │   │   ├── AIHistory.jsx
│   │   │   └── AIFeedback.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx         // EXISTING
│   │   │   ├── Shape.jsx          // EXISTING (extend for line/text)
│   │   │   └── RemoteCursor.jsx   // EXISTING
│   │   ├── Toolbar/               // NEW (stretch goal)
│   │   │   └── Toolbar.jsx
│   │   ├── Panels/                // NEW (stretch goal)
│   │   │   ├── PropertiesPanel.jsx
│   │   │   └── LayersPanel.jsx
│   ├── hooks/
│   │   ├── useShapes.js           // EXISTING (extend)
│   │   ├── useSelection.js        // NEW: multi-select
│   │   ├── useAI.js               // NEW: AI chat state
│   │   ├── useKeyboard.js         // NEW: keyboard shortcuts
│   │   └── useClipboard.js        // NEW (stretch goal)
│   ├── services/
│   │   ├── shapes.js              // EXISTING (extend)
│   │   ├── ai.js                  // NEW: AI service
│   │   ├── canvasAPI.js           // NEW: Unified canvas operations
│   │   ├── aiFunctions.js         // NEW: Function calling registry
│   │   └── aiCommands.js          // NEW: Complex AI commands
│   ├── utils/
│   │   ├── constants.js           // EXISTING (extend)
│   │   ├── helpers.js             // EXISTING (extend)
│   │   ├── colors.js              // NEW: Color utilities
│   │   └── geometry.js            // NEW: Layout calculations
│   └── styles/
│       └── design-system.css      // NEW (stretch goal)
```

---

# PHASE 1: CORE SHAPE COMPLETION

## PR #11: Line Shape Support 📏

**Branch:** `feat/line-shapes`  
**Goal:** Add line shape type with proper rendering and interaction  
**AI Readiness:** Enable AI to create lines programmatically

### Tasks:

- [ ] Update constants
  - **Files:** `src/utils/constants.js`
  - **Action:** Add `LINE: 'line'` to `SHAPE_TYPES`, add `DEFAULT_STROKE_WIDTH = 2`
  
- [ ] Extend Shape component for lines
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Add Line rendering logic (Konva Line component)
  - **Details:** 
    - Line renders from `[x, y, x+width, y+height]` points
    - Use `stroke` prop instead of `fill`
    - Apply `strokeWidth` property
    - Line selection needs wider hit area
  
- [ ] Update shape service
  - **Files:** `src/services/shapes.js`
  - **Action:** Add `strokeWidth` field to addShape, support line type validation
  
- [ ] Add line creation mode
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Add line tool button, handle line creation on drag
  - **Details:** Click-drag creates line from start point to end point
  
- [ ] Improve line selection hit detection
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Increase hitStrokeWidth to 10px for easier clicking
  
- [ ] Update Firestore schema
  - **Files:** `FIRESTORE_SCHEMA.md`
  - **Action:** Document line shape structure with strokeWidth
  
- [ ] Test line sync
  - **Action:** Create lines in one browser, verify in another

### Acceptance Criteria:
- ✅ Lines can be created by dragging
- ✅ Lines render with configurable stroke width
- ✅ Lines can be selected (with reasonable hit area)
- ✅ Lines can be moved by dragging
- ✅ Lines sync across users in real-time
- ✅ Lines stored correctly in Firestore

### AI Integration Notes:
```typescript
// AI will call:
createLine(startX, startY, endX, endY, strokeWidth, color)
// Example: createLine(100, 100, 300, 200, 3, '#FF0000')
// Creates red 3px line from (100,100) to (300,200)

// AI can query lines:
getCanvasState() // returns all shapes including lines
selectShapesByType('line') // selects all lines
```

---

## PR #12: Text Shape Support 📝

**Branch:** `feat/text-shapes`  
**Goal:** Add editable text layers with basic formatting  
**AI Readiness:** Enable AI to create and modify text programmatically

### Tasks:

- [ ] Update constants
  - **Files:** `src/utils/constants.js`
  - **Action:** Add `TEXT: 'text'` to `SHAPE_TYPES`, add font sizes array `[12, 16, 24, 32, 48, 64, 96]`
  
- [ ] Extend Shape component for text
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Add Text rendering logic (Konva Text component)
  - **Details:**
    - Text renders at x,y with specified font size and weight
    - Auto-calculate bounding box from text metrics
    - Show edit cursor when hovering text
  
- [ ] Add text creation mode
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Click to place text with default content "Double-click to edit"
  
- [ ] Implement inline text editing
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Double-click shows textarea overlay for editing
  - **Details:**
    - Position textarea at shape location
    - Match font size and style
    - Update shape on blur or Enter key
    - Set `editingBy` field during edit
  
- [ ] Add text editing lock
  - **Files:** `src/services/shapes.js`
  - **Action:** Set `editingBy: userId` when editing starts, clear on finish
  - **Details:** Reuse existing lock cleanup mechanism (30s timeout)
  
- [ ] Add text properties
  - **Files:** `src/components/Canvas/Canvas.jsx`, `src/components/Canvas/Shape.jsx`
  - **Action:** Font size selector, bold toggle, color picker
  - **Details:** Simple dropdown/buttons in toolbar when text selected
  
- [ ] Update shape service
  - **Files:** `src/services/shapes.js`
  - **Action:** Add text, fontSize, fontWeight fields
  
- [ ] Auto-resize text box
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Calculate width/height from text content using Konva text metrics
  
- [ ] Test text sync
  - **Action:** Edit text in one browser, verify updates in another

### Acceptance Criteria:
- ✅ Text can be created by clicking canvas
- ✅ Double-click enters edit mode
- ✅ Text content syncs in real-time
- ✅ Font size can be changed (12-96)
- ✅ Bold toggle works
- ✅ Text color can be changed
- ✅ Multi-line text supported (line breaks)
- ✅ Edit lock prevents simultaneous editing
- ✅ Stale locks auto-cleanup after 30s

### AI Integration Notes:
```typescript
// AI will call:
createText(content, x, y, fontSize, fontWeight, color)
// Example: createText('Hello World', 100, 100, 24, 'bold', '#000000')

updateText(shapeId, newContent)
// Example: updateText('shape123', 'Updated text')

changeTextSize(shapeId, fontSize)
// Example: changeTextSize('shape123', 32)

changeTextStyle(shapeId, fontWeight)
// Example: changeTextStyle('shape123', 'bold')

// AI can query text:
getShapesByType('text') // returns all text shapes
```

---

# PHASE 2: SELECTION & INTERACTION

## PR #13: Multi-Select Foundation 🔲

**Branch:** `feat/multi-select`  
**Goal:** Enable selecting multiple shapes with shift-click  
**AI Readiness:** Allow AI to operate on multiple shapes at once

### Tasks:

- [ ] Create selection hook
  - **Files:** `src/hooks/useSelection.js`
  - **Action:** Manage `selectedShapeIds` array instead of single ID
  - **Methods:**
    - `selectShape(id)` - replace selection with single shape
    - `addToSelection(id)` - add shape to selection (shift-click)
    - `removeFromSelection(id)` - remove shape from selection
    - `toggleInSelection(id)` - add if not present, remove if present
    - `selectAll()` - select all shapes
    - `deselectAll()` - clear selection
    - `selectMultiple(ids)` - set selection to array of IDs
  
- [ ] Update useShapes hook
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Replace `selectedShapeId` with `selectedShapeIds` array
  
- [ ] Update Shape component
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Accept `isSelected` prop based on ID being in array
  
- [ ] Implement shift-click multi-select
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Detect shift key on shape click, add/remove from selection
  
- [ ] Show combined bounding box
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** When multiple shapes selected, show single transformer around all
  - **Details:** Calculate bounding box that encompasses all selected shapes
  
- [ ] Implement group move
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** When dragging with multiple selected, move all shapes together
  - **Details:** Apply same delta x,y to all selected shapes
  
- [ ] Add Select All (Cmd+A)
  - **Files:** `src/hooks/useKeyboard.js` (create if needed)
  - **Action:** Cmd/Ctrl+A selects all shapes
  
- [ ] Add Deselect (Escape)
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Escape key clears selection
  
- [ ] Show selection count
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Display "X shapes selected" when multiple selected
  
- [ ] Test multi-select sync
  - **Action:** Select multiple shapes, verify operations work

### Acceptance Criteria:
- ✅ Shift+click adds/removes shapes from selection
- ✅ Multiple shapes show combined bounding box
- ✅ Dragging moves all selected shapes together
- ✅ Cmd+A selects all shapes
- ✅ Escape deselects all
- ✅ Selection count displayed
- ✅ Delete works on all selected shapes
- ✅ Selection state managed correctly

### AI Integration Notes:
```typescript
// AI will call:
selectShapes([id1, id2, id3])
// Example: selectShapes(['shape1', 'shape2', 'shape3'])

selectAll()
deselectAll()

// Selection by criteria (for layout operations):
selectShapesByType('rectangle')
selectShapesByColor('#FF0000')
selectShapesInRegion(x, y, width, height)

// AI can then perform operations on selection:
moveSelected(deltaX, deltaY)
resizeSelected(scaleX, scaleY)
rotateSelected(degrees)
deleteSelected()
```

---

## PR #14: Drag-Select Box

**Branch:** `feat/drag-select`  
**Goal:** Enable drag-to-select multiple shapes with selection box  
**AI Readiness:** Not directly used by AI, but enables better manual selection for AI to query

### Tasks:

- [ ] Create SelectionBox component
  - **Files:** `src/components/Canvas/SelectionBox.jsx`
  - **Action:** Render dashed rectangle during drag
  - **Details:** Blue dashed border, semi-transparent fill
  
- [ ] Add selection box state
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Track `isSelecting`, `selectionBox: {x, y, width, height}`
  
- [ ] Implement drag-select logic
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** In Move mode, click-drag on empty canvas creates selection box
  - **Details:** Only activate if drag distance > 5px (prevent accidental selection)
  
- [ ] Add collision detection utility
  - **Files:** `src/utils/geometry.js` (create new file)
  - **Action:** Function to check if shapes intersect with selection box
  - **Details:** `doBoxesIntersect(box1, box2)` checks AABB collision
  
- [ ] Select shapes on drag end
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** On mouse up, select all shapes intersecting selection box
  
- [ ] Style selection box
  - **Files:** `src/components/Canvas/SelectionBox.jsx`
  - **Action:** Dashed blue border (#646cff), 10% opacity fill
  
- [ ] Test drag-select
  - **Action:** Drag selection box, verify correct shapes selected

### Acceptance Criteria:
- ✅ Click-drag on empty canvas creates selection box
- ✅ Selection box shows dashed border
- ✅ Shapes intersecting box are selected on release
- ✅ Works with shift-click (adds to existing selection)
- ✅ Only works in Move mode
- ✅ Doesn't interfere with shape dragging

### AI Integration Notes:
```typescript
// AI uses programmatic selection, not drag-select
// But AI can select by region:
selectShapesInRegion(x, y, width, height)
// Example: selectShapesInRegion(0, 0, 500, 500)
// Selects all shapes in top-left quadrant
```

---

## PR #15: Duplicate & Keyboard Shortcuts ⌨️

**Branch:** `feat/duplicate-shortcuts`  
**Goal:** Add duplicate operation and comprehensive keyboard shortcuts  
**AI Readiness:** Enable AI to duplicate shapes programmatically

### Tasks:

- [ ] Create keyboard shortcuts hook
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Central keyboard event handler
  - **Methods:**
    - Detect Cmd/Ctrl (platform-specific)
    - Handle key combinations
    - Disable during text editing
  
- [ ] Implement duplicate functionality
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** `duplicateShapes(ids, offsetX, offsetY)`
  - **Details:**
    - Create copies of selected shapes
    - Offset by 20px both x and y (default)
    - Preserve all properties
    - Select newly created shapes
  
- [ ] Add Duplicate shortcut (Cmd+D)
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Cmd/Ctrl+D duplicates selection with 20px offset
  
- [ ] Add tool shortcuts
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** 
    - V - Pan mode
    - M - Move mode
    - D - Draw mode
    - R - Select rectangle tool (when in Draw mode)
    - C - Select circle tool (when in Draw mode)
    - L - Select line tool (when in Draw mode)
    - T - Select text tool (when in Draw mode)
  
- [ ] Add arrow key nudging
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Arrow keys move selection by 1px (10px with Shift)
  - **Details:** Only when shapes are selected, not during text edit
  
- [ ] Update duplicate to work with multi-select
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Duplicate all selected shapes, maintain relative positions
  
- [ ] Add keyboard shortcuts to tooltips
  - **Files:** All toolbar buttons
  - **Action:** Show shortcuts in tooltips (e.g., "Delete (Del)")
  
- [ ] Disable shortcuts during text editing
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Check if any shape has `editingBy` set, disable shortcuts
  
- [ ] Test shortcuts
  - **Action:** Verify all shortcuts work correctly

### Acceptance Criteria:
- ✅ Cmd+D duplicates selected shapes
- ✅ Duplicates appear offset by 20px
- ✅ Works with single and multi-select
- ✅ Tool shortcuts (V, M, D, R, C, L, T) work
- ✅ Arrow keys nudge shapes (1px, 10px with Shift)
- ✅ Shortcuts disabled during text editing
- ✅ Tooltips show keyboard shortcuts
- ✅ Platform-specific key detection (Cmd on Mac, Ctrl on Windows)

### AI Integration Notes:
```typescript
// AI will call:
duplicateShape(shapeId, offsetX, offsetY)
// Example: duplicateShape('shape123', 30, 30)

duplicateShapes([id1, id2], offsetX, offsetY)
// Example: duplicateShapes(['shape1', 'shape2'], 0, 50)
// Duplicates multiple shapes with offset

// Useful for pattern creation:
// "Duplicate this rectangle 5 times horizontally"
for (let i = 1; i <= 5; i++) {
  duplicateShape(originalId, i * 100, 0);
}
```

---

# PHASE 3: ROTATION & LAYERS

## PR #16: Rotation Support 🔄

**Branch:** `feat/rotation`  
**Goal:** Add rotation capability to all shapes  
**AI Readiness:** Enable AI to rotate shapes programmatically

### Tasks:

- [ ] Add rotation field to shape schema
  - **Files:** `src/services/shapes.js`
  - **Action:** Add `rotation: 0` (degrees) to addShape
  
- [ ] Update Shape component for rotation
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Pass `rotation` prop to Konva shapes
  - **Details:** Konva natively supports rotation prop
  
- [ ] Enable rotation handles on Transformer
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Transformer already supports rotation, just ensure enabled
  
- [ ] Handle rotation during transform
  - **Files:** `src/components/Canvas/Canvas.jsx` or `src/hooks/useShapes.js`
  - **Action:** Capture rotation value from Transformer, update Firestore
  
- [ ] Add rotation to transform end callback
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** On transform end, get rotation from node and pass to update
  
- [ ] Implement group rotation
  - **Files:** `src/hooks/useSelection.js` (or `useShapes.js`)
  - **Action:** When multiple shapes selected, rotate all around combined center
  - **Details:**
    - Calculate combined bounding box center
    - For each shape, rotate around that center point
    - Update both position (x,y) and rotation angle
  
- [ ] Update memo comparison
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Add `rotation` to React.memo comparison
  
- [ ] Test rotation sync
  - **Action:** Rotate shapes, verify sync across browsers

### Acceptance Criteria:
- ✅ All shapes can be rotated via Transformer handles
- ✅ Rotation persists to Firestore
- ✅ Rotation syncs across users
- ✅ Group rotation works (multiple selected shapes)
- ✅ Rotation angle stored in degrees (0-359)
- ✅ Text remains readable when rotated
- ✅ Lines rotate correctly

### AI Integration Notes:
```typescript
// AI will call:
rotateShape(shapeId, degrees)
// Example: rotateShape('shape123', 45)
// Rotates shape 45 degrees clockwise

rotateShape(shapeId, -30)
// Rotates 30 degrees counter-clockwise

// Group rotation:
rotateShapes([id1, id2, id3], 90)
// Rotates all shapes 90 degrees around their combined center

// Useful for AI layout commands:
// "Rotate the text 45 degrees"
// "Create a star pattern by rotating copies"
```

---

## PR #17: Layer Management 📚

**Branch:** `feat/layer-management`  
**Goal:** Add z-index management and basic layers list  
**AI Readiness:** Enable AI to control shape layering programmatically

### Tasks:

- [ ] Add zIndex field to shape schema
  - **Files:** `src/services/shapes.js`
  - **Action:** Add `zIndex: Date.now()` (use timestamp as initial value)
  - **Details:** Higher zIndex renders on top
  
- [ ] Sort shapes by zIndex in rendering
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Sort shapes array by zIndex before mapping to Shape components
  
- [ ] Create simple layers list component
  - **Files:** `src/components/Layers/LayersList.jsx` (create new)
  - **Action:** Left sidebar showing all shapes sorted by zIndex
  - **Details:**
    - Shape type icon
    - Shape ID or auto-generated name
    - Click to select shape
  
- [ ] Add layer operations
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** 
    - `bringShapeForward(id)` - increment zIndex by 1
    - `sendShapeBackward(id)` - decrement zIndex by 1
    - `bringShapeToFront(id)` - set zIndex to max + 1
    - `sendShapeToBack(id)` - set zIndex to min - 1
  
- [ ] Add layer buttons to UI
  - **Files:** `src/components/Canvas/Canvas.jsx` or toolbar
  - **Action:** Buttons for Forward/Backward/Front/Back operations
  - **Details:** Only enabled when shape(s) selected
  
- [ ] Add keyboard shortcuts for layers
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:**
    - Cmd+] - Bring Forward
    - Cmd+[ - Send Backward
    - Cmd+Shift+] - Bring to Front
    - Cmd+Shift+[ - Send to Back
  
- [ ] Handle zIndex normalization
  - **Files:** `src/services/shapes.js`
  - **Action:** Optional periodic cleanup to normalize zIndex values
  - **Details:** If gaps get too large, renumber sequentially (not critical for MVP)
  
- [ ] Test layer operations
  - **Action:** Reorder shapes, verify visual stacking and sync

### Acceptance Criteria:
- ✅ Shapes have zIndex field
- ✅ Shapes render in correct z-order
- ✅ Layers list shows all shapes
- ✅ Clicking layer selects shape
- ✅ Bring Forward/Backward operations work
- ✅ Bring to Front/Back operations work
- ✅ Keyboard shortcuts work
- ✅ Layer order syncs across users
- ✅ Works with multi-select (operates on all selected)

### AI Integration Notes:
```typescript
// AI will call:
bringShapeToFront(shapeId)
sendShapeToBack(shapeId)
bringShapeForward(shapeId)
sendShapeBackward(shapeId)

// Example use cases:
// "Bring the red rectangle to the front"
// "Send all circles to the back"
// "Layer the title text above the background"

// AI can query layer order:
getCanvasState() // returns shapes sorted by zIndex
// AI can then reason about which shapes are on top
```

---

# PHASE 4: AI AGENT FOUNDATION

## PR #18: AI Service Integration 🤖

**Branch:** `feat/ai-service`  
**Goal:** Set up AI service with function calling  
**AI Readiness:** Core infrastructure for AI agent

### Tasks:

- [ ] Choose AI provider
  - **Action:** Decide between OpenAI GPT-4 or Anthropic Claude
  - **Recommendation:** OpenAI GPT-4 for function calling maturity
  
- [ ] Set up API credentials
  - **Files:** `.env.local`
  - **Action:** Add `VITE_OPENAI_API_KEY` or `VITE_ANTHROPIC_API_KEY`
  
- [ ] Create AI service
  - **Files:** `src/services/ai.js`
  - **Action:** Initialize AI client, create chat completion function
  - **Methods:**
    - `sendMessage(userMessage, conversationHistory)`
    - `parseFunctionCall(aiResponse)`
    - `executeFunction(functionName, parameters)`
  
- [ ] Create Canvas API wrapper
  - **Files:** `src/services/canvasAPI.js`
  - **Action:** Unified interface for all canvas operations
  - **Purpose:** 
    - Both manual interactions and AI use same functions
    - Consistent parameter validation
    - Centralized error handling
  - **Methods:** Will be comprehensive list of all canvas operations (see next PR)
  
- [ ] Define function calling schema
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define OpenAI function schemas for tool use
  - **Details:** Start with basic shape creation functions
  
- [ ] Create function registry
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Map function names to actual implementations
  - **Structure:**
    ```javascript
    const functionRegistry = {
      'createRectangle': canvasAPI.createRectangle,
      'createCircle': canvasAPI.createCircle,
      // ... etc
    }
    ```
  
- [ ] Add API error handling
  - **Files:** `src/services/ai.js`
  - **Action:** Handle rate limits, network errors, invalid responses
  
- [ ] Add loading states
  - **Files:** `src/hooks/useAI.js` (create new)
  - **Action:** Track `isProcessing`, `error`, `lastResponse`
  
- [ ] Test AI connection
  - **Action:** Send test message, verify response

### Acceptance Criteria:
- ✅ AI service initialized with API key
- ✅ Can send messages and receive responses
- ✅ Function calling schema defined
- ✅ Canvas API wrapper created
- ✅ Function registry maps AI calls to canvas operations
- ✅ Error handling for API failures
- ✅ Loading states managed
- ✅ Rate limiting handled gracefully

### AI Integration Notes:
```typescript
// This PR creates the foundation:
// canvasAPI.js - all canvas operations in one place
// ai.js - AI service for sending/receiving messages
// aiFunctions.js - function schemas and registry

// Example flow:
// User: "Create a red rectangle"
// → AI service sends to OpenAI with function schemas
// → OpenAI returns function call: createRectangle(100, 100, 150, 100, '#FF0000')
// → Function registry executes: canvasAPI.createRectangle(...)
// → Shape appears on canvas
// → All users see it via Firestore sync
```

---

## PR #19: AI Chat Interface 💬

**Branch:** `feat/ai-chat-ui`  
**Goal:** Create user interface for AI interaction  
**AI Readiness:** Enable users to send natural language commands

### Tasks:

- [ ] Create AIChat component
  - **Files:** `src/components/AI/AIChat.jsx`
  - **Action:** Main container for AI chat interface
  - **Structure:**
    - Collapsible panel (bottom-right corner)
    - Chat history display
    - Command input field
    - Toggle button to show/hide
  
- [ ] Create AICommandInput component
  - **Files:** `src/components/AI/AICommandInput.jsx`
  - **Action:** Text input for commands
  - **Features:**
    - Enter to send
    - Disabled during processing
    - Placeholder text with examples
  
- [ ] Create AIHistory component
  - **Files:** `src/components/AI/AIHistory.jsx`
  - **Action:** Display conversation history
  - **Structure:**
    - User messages (right-aligned, blue)
    - AI responses (left-aligned, gray)
    - Error messages (red)
    - Scrollable with auto-scroll to bottom
  
- [ ] Create AIFeedback component
  - **Files:** `src/components/AI/AIFeedback.jsx`
  - **Action:** Visual feedback during AI operations
  - **Features:**
    - Loading spinner when processing
    - Success indicators
    - Error messages
    - "AI is thinking..." indicator
  
- [ ] Create useAI hook
  - **Files:** `src/hooks/useAI.js`
  - **Action:** Manage AI chat state
  - **State:**
    - `messages: []` - conversation history
    - `isProcessing: boolean`
    - `error: string | null`
  - **Methods:**
    - `sendCommand(message)`
    - `clearHistory()`
    - `retryLastCommand()`
  
- [ ] Integrate AI service
  - **Files:** `src/hooks/useAI.js`
  - **Action:** Call AI service on command submission
  - **Flow:**
    1. User submits command
    2. Add to messages as "user"
    3. Set isProcessing = true
    4. Call AI service
    5. Execute function calls
    6. Add AI response to messages
    7. Set isProcessing = false
  
- [ ] Add visual feedback for AI actions
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Highlight shapes being created/modified by AI
  - **Details:** Pulse animation or glow effect during AI operations
  
- [ ] Style AI chat interface
  - **Files:** `src/components/AI/AIChat.jsx`, CSS
  - **Action:** Modern chat interface design
  - **Design:**
    - Dark theme to match canvas
    - Clean typography
    - Smooth animations
    - Responsive sizing
  
- [ ] Add keyboard shortcuts
  - **Files:** `src/hooks/useKeyboard.js`
  - **Action:** Cmd+K or / to focus AI input
  
- [ ] Add example commands
  - **Files:** `src/components/AI/AIChat.jsx`
  - **Action:** Show example commands when chat is empty
  - **Examples:**
    - "Create a blue rectangle at 100, 200"
    - "Arrange these shapes in a grid"
    - "Create a login form"
  
- [ ] Test chat interface
  - **Action:** Send commands, verify UI updates correctly

### Acceptance Criteria:
- ✅ Chat interface visible and functional
- ✅ Can send text commands
- ✅ Conversation history displays correctly
- ✅ Loading state shows during processing
- ✅ Error messages display clearly
- ✅ Interface can be collapsed/expanded
- ✅ Keyboard shortcut to focus input
- ✅ Example commands shown to guide users
- ✅ Smooth animations and transitions

### AI Integration Notes:
```typescript
// This PR creates the user-facing interface
// Users can now interact with AI via chat

// Example user flow:
// 1. User clicks AI chat button (bottom-right)
// 2. Chat panel expands
// 3. User types: "Create a red circle at the center"
// 4. Presses Enter
// 5. "AI is thinking..." appears
// 6. Circle appears on canvas
// 7. AI responds: "I created a red circle at the center of the canvas."
// 8. All users see the new circle via real-time sync
```

---

# PHASE 5: AI COMMANDS - BASIC

## PR #20: AI Creation & Manipulation Commands 🎨

**Branch:** `feat/ai-basic-commands`  
**Goal:** Implement basic AI commands for creating and manipulating shapes  
**AI Readiness:** Enable core AI functionality

### Tasks:

- [ ] Implement shape creation functions in Canvas API
  - **Files:** `src/services/canvasAPI.js`
  - **Functions:**
    ```typescript
    createRectangle(x, y, width, height, color)
    createCircle(x, y, radius, color)
    createLine(x1, y1, x2, y2, strokeWidth, color)
    createText(text, x, y, fontSize, fontWeight, color)
    ```
  
- [ ] Implement shape manipulation functions
  - **Files:** `src/services/canvasAPI.js`
  - **Functions:**
    ```typescript
    moveShape(shapeId, x, y)
    resizeShape(shapeId, width, height)
    rotateShape(shapeId, degrees)
    changeShapeColor(shapeId, color)
    deleteShape(shapeId)
    ```
  
- [ ] Implement canvas query functions
  - **Files:** `src/services/canvasAPI.js`
  - **Functions:**
    ```typescript
    getCanvasState() // returns all shapes
    getCanvasCenter() // returns viewport center coords
    getShapeById(shapeId)
    ```
  
- [ ] Add function schemas for creation commands
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define OpenAI function schemas for creation commands
  - **Details:** Each schema includes name, description, parameters with types
  
- [ ] Add function schemas for manipulation commands
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define schemas for move, resize, rotate, changeColor, delete
  
- [ ] Add function schemas for query commands
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define schemas for getCanvasState, getCanvasCenter
  
- [ ] Update function registry
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Map all function names to implementations
  
- [ ] Add parameter validation
  - **Files:** `src/services/canvasAPI.js`
  - **Action:** Validate all parameters before execution
  - **Validations:**
    - x, y, width, height are numbers
    - colors are valid hex codes
    - shapeIds exist
    - fontSize in valid range (12-96)
  
- [ ] Add helpful error messages
  - **Files:** `src/services/canvasAPI.js`
  - **Action:** Return descriptive errors for AI to understand
  - **Examples:**
    - "Shape with ID 'abc123' not found on canvas"
    - "Invalid color format. Please use hex codes like '#FF0000'"
  
- [ ] Add AI prompt engineering
  - **Files:** `src/services/ai.js`
  - **Action:** Create system prompt to guide AI behavior
  - **Prompt should include:**
    - AI's role as canvas assistant
    - Canvas dimensions (5000x5000)
    - Available functions and their purposes
    - Best practices (e.g., "use getCanvasState() to see current shapes")
  
- [ ] Test creation commands
  - **Test commands:**
    - "Create a red rectangle at 100, 200"
    - "Add a blue circle at the center"
    - "Draw a line from 50,50 to 200,200"
    - "Add text 'Hello World' at 100,100"
  
- [ ] Test manipulation commands
  - **Test commands:**
    - "Move the red rectangle to 300, 400"
    - "Resize the circle to be bigger"
    - "Rotate the text 45 degrees"
    - "Change the rectangle color to green"
    - "Delete the blue circle"
  
- [ ] Test query commands
  - **Test commands:**
    - "What shapes are on the canvas?"
    - "Where is the center of the canvas?"

### Acceptance Criteria:
- ✅ All 4 shape creation commands work
- ✅ All 5 manipulation commands work
- ✅ All 3 query commands work
- ✅ AI can create shapes programmatically
- ✅ AI can modify existing shapes
- ✅ AI can query canvas state
- ✅ Parameter validation prevents errors
- ✅ Error messages are clear and helpful
- ✅ AI-created shapes sync to all users
- ✅ Response time <2 seconds for simple commands

### AI Integration Notes:
```typescript
// Example conversations:

// USER: "Create a red rectangle at 100, 200 with size 150 by 100"
// AI: calls createRectangle(100, 200, 150, 100, '#FF0000')
// AI: "I created a red rectangle at position (100, 200) with dimensions 150x100."

// USER: "Make the rectangle bigger"
// AI: calls getCanvasState() to find rectangles
// AI: calls resizeShape(rectangleId, 200, 150)
// AI: "I resized the rectangle to 200x150."

// USER: "What's on the canvas?"
// AI: calls getCanvasState()
// AI: "There are 3 shapes on the canvas: 1 red rectangle, 1 blue circle, and 1 text layer that says 'Hello World'."
```

---

## PR #21: AI Selection Commands 🎯

**Branch:** `feat/ai-selection`  
**Goal:** Enable AI to select shapes by various criteria  
**AI Readiness:** Allow AI to target specific shapes for operations

### Tasks:

- [ ] Implement selection by type
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `selectShapesByType(type)` where type is 'rectangle', 'circle', 'line', 'text'
  - **Action:** Select all shapes matching type
  
- [ ] Implement selection by color
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `selectShapesByColor(color)` where color is hex code
  - **Action:** Select all shapes matching color
  
- [ ] Implement selection by region
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `selectShapesInRegion(x, y, width, height)`
  - **Action:** Select all shapes whose bounding boxes intersect region
  
- [ ] Implement selection by ID
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `selectShapes(shapeIds)` where shapeIds is array
  - **Action:** Select specific shapes by their IDs
  
- [ ] Implement deselect
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `deselectAll()`
  - **Action:** Clear current selection
  
- [ ] Implement get selected shapes
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `getSelectedShapes()`
  - **Action:** Return array of currently selected shape objects
  
- [ ] Add function schemas for selection
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define schemas for all selection commands
  
- [ ] Add to function registry
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Map selection functions to implementations
  
- [ ] Update AI prompt
  - **Files:** `src/services/ai.js`
  - **Action:** Add guidance about selection commands
  - **Guidance:** "Use selection commands before manipulation to target specific shapes"
  
- [ ] Test selection commands
  - **Test commands:**
    - "Select all rectangles"
    - "Select all red shapes"
    - "Select shapes in the top-left area"
    - "Select the blue circle and red rectangle"
    - "What shapes are selected?"

### Acceptance Criteria:
- ✅ AI can select shapes by type
- ✅ AI can select shapes by color
- ✅ AI can select shapes in a region
- ✅ AI can select specific shapes by ID
- ✅ AI can deselect all shapes
- ✅ AI can query current selection
- ✅ Selection commands integrate with multi-select
- ✅ AI can chain selection + manipulation commands

### AI Integration Notes:
```typescript
// Example conversations:

// USER: "Select all circles and make them red"
// AI: calls selectShapesByType('circle')
// AI: calls getSelectedShapes() to get IDs
// AI: for each circle, calls changeShapeColor(id, '#FF0000')
// AI: "I selected all 3 circles and changed their color to red."

// USER: "Delete all shapes in the top-left corner"
// AI: calls selectShapesInRegion(0, 0, 500, 500)
// AI: calls deleteSelected()
// AI: "I deleted 5 shapes from the top-left area."

// USER: "Change all red rectangles to blue"
// AI: calls selectShapesByType('rectangle')
// AI: filters by color (checks each shape)
// AI: calls changeShapeColor() for matching shapes
// AI: "I changed 2 red rectangles to blue."
```

---

# PHASE 6: AI COMMANDS - ADVANCED

## PR #22: AI Layout Commands 📐

**Branch:** `feat/ai-layout`  
**Goal:** Enable AI to arrange shapes in patterns  
**AI Readiness:** Complex spatial operations

### Tasks:

- [ ] Create geometry utilities
  - **Files:** `src/utils/geometry.js`
  - **Functions:**
    - `calculateBoundingBox(shapes)` - get combined bounds
    - `getCenter(shape)` - get shape center point
    - `distributeHorizontal(shapes, spacing)`
    - `distributeVertical(shapes, spacing)`
    - `calculateGridPositions(count, rows, cols, spacing)`
  
- [ ] Implement arrange horizontal
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `arrangeHorizontal(shapeIds, spacing)`
  - **Logic:**
    1. Get selected shapes
    2. Sort by current x position
    3. Position first shape at current x
    4. Position subsequent shapes with spacing
    5. Update all shapes in Firestore
  
- [ ] Implement arrange vertical
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `arrangeVertical(shapeIds, spacing)`
  - **Logic:** Similar to horizontal but along y-axis
  
- [ ] Implement arrange grid
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `arrangeGrid(shapeIds, rows, cols, spacingX, spacingY)`
  - **Logic:**
    1. Calculate grid positions
    2. Assign shapes to grid cells
    3. Center shapes in cells
    4. Update positions
  
- [ ] Implement distribute evenly
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `distributeEvenly(shapeIds, direction)`
  - **Logic:**
    1. Find leftmost and rightmost shapes (or top/bottom)
    2. Calculate equal spacing between
    3. Reposition intermediate shapes
  
- [ ] Implement center shape
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `centerShape(shapeId)`
  - **Logic:** Move shape to canvas center (2500, 2500)
  
- [ ] Implement center shapes (group)
  - **Files:** `src/services/canvasAPI.js`
  - **Function:** `centerShapes(shapeIds)`
  - **Logic:** Center the group's bounding box at canvas center
  
- [ ] Add batch update optimization
  - **Files:** `src/services/shapes.js`
  - **Action:** Add batch update function to update multiple shapes efficiently
  - **Purpose:** Layout operations modify many shapes at once
  
- [ ] Add function schemas
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define schemas for all layout commands
  
- [ ] Update function registry
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Map layout functions to implementations
  
- [ ] Test layout commands
  - **Test commands:**
    - "Arrange these shapes in a horizontal row"
    - "Create a 3x3 grid with these shapes"
    - "Distribute these shapes evenly"
    - "Center the blue rectangle"
    - "Stack these shapes vertically with 20px spacing"

### Acceptance Criteria:
- ✅ AI can arrange shapes horizontally with spacing
- ✅ AI can arrange shapes vertically with spacing
- ✅ AI can create grid layouts
- ✅ AI can distribute shapes evenly
- ✅ AI can center individual shapes
- ✅ AI can center groups of shapes
- ✅ Layout operations use batch updates for performance
- ✅ All layout changes sync to other users
- ✅ Response time <5 seconds for layout operations

### AI Integration Notes:
```typescript
// Example conversations:

// USER: "Create 5 rectangles and arrange them in a horizontal row"
// AI: creates 5 rectangles
// AI: calls arrangeHorizontal([id1, id2, id3, id4, id5], 20)
// AI: "I created 5 rectangles and arranged them horizontally with 20px spacing."

// USER: "Make a 3x3 grid of circles"
// AI: creates 9 circles
// AI: calls arrangeGrid([...circleIds], 3, 3, 50, 50)
// AI: "I created a 3x3 grid of circles with 50px spacing."

// USER: "These shapes are messy, space them out evenly"
// AI: calls getSelectedShapes() or prompts for selection
// AI: calls distributeEvenly(selectedIds, 'horizontal')
// AI: "I distributed 6 shapes evenly with equal spacing."
```

---

## PR #23: AI Complex Operations 🏗️

**Branch:** `feat/ai-complex-commands`  
**Goal:** Implement multi-step AI operations  
**AI Readiness:** Enable high-level design commands

### Tasks:

- [ ] Create complex commands service
  - **Files:** `src/services/aiCommands.js`
  - **Purpose:** Implement multi-step operations as composable functions
  
- [ ] Implement createLoginForm
  - **Files:** `src/services/aiCommands.js`
  - **Function:** `createLoginForm(x, y)`
  - **Steps:**
    1. Create "Username:" text label
    2. Create username input field (rectangle)
    3. Create "Password:" text label
    4. Create password input field (rectangle)
    5. Create "Login" button (rectangle with text)
    6. Arrange vertically with proper spacing
  - **Result:** 5 shapes arranged in login form layout
  
- [ ] Implement createNavigationBar
  - **Files:** `src/services/aiCommands.js`
  - **Function:** `createNavigationBar(x, y, itemCount, itemWidth)`
  - **Steps:**
    1. Create background rectangle
    2. For each item:
       - Create button rectangle
       - Create label text "Nav Item N"
    3. Arrange horizontally inside background
  - **Result:** 1 background + itemCount buttons with labels
  
- [ ] Implement createCardLayout
  - **Files:** `src/services/aiCommands.js`
  - **Function:** `createCardLayout(x, y, width, height, title, content)`
  - **Steps:**
    1. Create border rectangle (card background)
    2. Create title text at top
    3. Create content text below title
    4. Optional: Create image placeholder rectangle
    5. Position all within card bounds
  - **Result:** Card with title, content, optional image
  
- [ ] Implement createButtonGroup
  - **Files:** `src/services/aiCommands.js`
  - **Function:** `createButtonGroup(x, y, buttonCount, orientation)`
  - **Steps:**
    1. Create buttonCount rectangles
    2. Add text labels to each
    3. Arrange in specified orientation (horizontal/vertical)
  - **Result:** Group of labeled buttons
  
- [ ] Add multi-step execution engine
  - **Files:** `src/services/ai.js`
  - **Action:** Handle operations that call multiple functions
  - **Features:**
    - Execute steps sequentially
    - Report progress
    - Roll back on error (optional)
  
- [ ] Add function schemas for complex operations
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Define schemas for all complex commands
  
- [ ] Update function registry
  - **Files:** `src/services/aiFunctions.js`
  - **Action:** Map complex commands to implementations
  
- [ ] Add visual progress feedback
  - **Files:** `src/components/AI/AIFeedback.jsx`
  - **Action:** Show progress for multi-step operations
  - **Example:** "Creating login form... (step 3/5)"
  
- [ ] Optimize batch operations
  - **Files:** `src/services/shapes.js`
  - **Action:** Use addShapesBatch for creating multiple shapes
  - **Purpose:** Reduce Firestore writes for complex operations
  
- [ ] Test complex commands
  - **Test commands:**
    - "Create a login form"
    - "Build a navigation bar with 5 items"
    - "Make a card layout"
    - "Create a button group with 4 buttons"

### Acceptance Criteria:
- ✅ createLoginForm works (5 shapes arranged properly)
- ✅ createNavigationBar works (customizable item count)
- ✅ createCardLayout works (title + content)
- ✅ createButtonGroup works (flexible orientation)
- ✅ Multi-step operations execute sequentially
- ✅ Progress feedback during execution
- ✅ Batch operations used for performance
- ✅ All shapes sync to other users
- ✅ Response time <5 seconds for complex commands
- ✅ Error handling for partial failures

### AI Integration Notes:
```typescript
// Example conversations:

// USER: "Create a login form at 100, 100"
// AI: calls createLoginForm(100, 100)
// Steps executed:
//   1. Creates "Username:" text
//   2. Creates username field rectangle
//   3. Creates "Password:" text
//   4. Creates password field rectangle
//   5. Creates "Login" button
//   6. Arranges all vertically
// AI: "I created a login form with username field, password field, and login button."

// USER: "Build a navigation bar with 4 menu items"
// AI: calls createNavigationBar(100, 50, 4, 150)
// Creates: 1 background + 4 buttons with labels
// AI: "I created a navigation bar with 4 menu items: Nav Item 1, Nav Item 2, Nav Item 3, Nav Item 4."

// USER: "Create a card layout with title 'Welcome'"
// AI: calls createCardLayout(200, 200, 300, 400, 'Welcome', 'This is a card')
// Creates: border, title, content text
// AI: "I created a card layout with the title 'Welcome'."
```

---

# PHASE 7: TESTING & DOCUMENTATION

## PR #24: AI Testing & Documentation 📚

**Branch:** `feat/ai-documentation`  
**Goal:** Comprehensive testing and documentation for AI agent  
**AI Readiness:** Production-ready AI system

### Tasks:

- [ ] Create AI command reference
  - **Files:** `docs/AI_COMMANDS.md`
  - **Content:** Complete list of all AI commands with examples
  - **Structure:**
    - Command category
    - Function name
    - Parameters
    - Example natural language commands
    - Expected results
  
- [ ] Create AI Development Log
  - **Files:** `AI_DEVELOPMENT_LOG.md`
  - **Content:** 1-page document covering:
    - Tools & Workflow (AI coding tools used)
    - Prompting Strategies (3-5 effective prompts)
    - Code Analysis (% AI-generated vs hand-written)
    - Strengths & Limitations
    - Key Learnings
  
- [ ] Test all creation commands
  - **Action:** Systematically test each shape creation command
  - **Verify:** Shape appears with correct attributes
  
- [ ] Test all manipulation commands
  - **Action:** Test move, resize, rotate, color change, delete
  - **Verify:** Operations execute correctly
  
- [ ] Test all selection commands
  - **Action:** Test selection by type, color, region, ID
  - **Verify:** Correct shapes selected
  
- [ ] Test all layout commands
  - **Action:** Test horizontal, vertical, grid, distribute, center
  - **Verify:** Shapes arranged correctly with proper spacing
  
- [ ] Test all complex commands
  - **Action:** Test login form, nav bar, card, button group
  - **Verify:** All sub-shapes created and arranged correctly
  
- [ ] Test multi-user AI scenario
  - **Action:** Two users, both use AI simultaneously
  - **Verify:** All changes sync correctly, no conflicts
  
- [ ] Test error handling
  - **Test cases:**
    - Invalid parameters
    - Non-existent shape IDs
    - Ambiguous commands
    - Empty selection
  - **Verify:** Clear error messages, no crashes
  
- [ ] Test performance targets
  - **Measure:** Response time for simple commands (<2s)
  - **Measure:** Response time for complex commands (<5s)
  - **Verify:** 95%+ success rate on valid commands
  
- [ ] Create demo video script
  - **Content:**
    - Introduction (30s)
    - Real-time collaboration demo (1 min)
    - AI command demonstrations (2 min)
    - Architecture explanation (1 min)
    - Conclusion (30s)
  
- [ ] Record demo video
  - **Action:** Record 3-5 minute demo
  - **Include:**
    - Two users collaborating manually
    - AI creating shapes
    - AI arranging layouts
    - AI complex operations
    - Show real-time sync
  
- [ ] Update README
  - **Files:** `README.md`
  - **Add:**
    - AI features section
    - How to use AI commands
    - Example commands
    - Link to AI command reference
  
- [ ] Add JSDoc comments
  - **Files:** All AI service files
  - **Action:** Document all functions with parameters and return types
  
- [ ] Create troubleshooting guide
  - **Files:** `docs/TROUBLESHOOTING.md`
  - **Content:**
    - Common AI errors and solutions
    - API rate limit issues
    - Invalid command formats
    - Performance issues
  
- [ ] Final testing checklist
  - **Action:** Run through comprehensive test scenarios
  - **Verify:** All features working in production deployment

### Acceptance Criteria:
- ✅ All AI commands tested and documented
- ✅ AI Development Log completed (1 page)
- ✅ Demo video recorded (3-5 minutes)
- ✅ README updated with AI features
- ✅ AI command reference complete
- ✅ Troubleshooting guide available
- ✅ All code documented with JSDoc
- ✅ Multi-user AI testing successful
- ✅ Performance targets met
- ✅ Production deployment stable

### AI Integration Notes:
```
This PR completes the AI agent implementation.

Final AI Capabilities:
✅ 4 shape creation commands
✅ 5 manipulation commands
✅ 5 selection commands
✅ 6 layout commands
✅ 4 complex multi-step operations
✅ 3 query commands

Total: 27 AI-callable functions

Performance achieved:
✅ <2s response for simple commands
✅ <5s response for complex commands
✅ 95%+ success rate
✅ Real-time sync to all users
✅ Graceful error handling

The AI agent is production-ready!
```

---

# PHASE 8: STRETCH GOALS (TIME PERMITTING)

## PR #25: Copy/Paste Operations 📋

**Branch:** `feat/copy-paste` (STRETCH GOAL)  
**Goal:** Add clipboard operations

### Tasks:
- [ ] Create clipboard hook
- [ ] Implement copy (Cmd+C)
- [ ] Implement cut (Cmd+X)
- [ ] Implement paste (Cmd+V)
- [ ] Works with multi-select
- [ ] Paste at cursor or viewport center

### AI Integration:
```typescript
// AI could use:
copyShapes(shapeIds)
pasteShapes(x, y)
```

---

## PR #26: Undo/Redo System ↩️

**Branch:** `feat/undo-redo` (STRETCH GOAL)  
**Goal:** Add undo/redo functionality

### Tasks:
- [ ] Create local history stack (React state only)
- [ ] Track operations (create, update, delete)
- [ ] Implement undo (Cmd+Z)
- [ ] Implement redo (Cmd+Shift+Z)
- [ ] Limit to 20-50 actions
- [ ] Per-user undo (don't undo others' changes)

### AI Integration:
```typescript
// AI operations would be undoable like manual operations
// Each AI function call creates history entry
```

---

## PR #27: Properties Panel 📋

**Branch:** `feat/properties-panel` (STRETCH GOAL)  
**Goal:** Add detailed properties sidebar

### Tasks:
- [ ] Create PropertiesPanel component (right sidebar)
- [ ] Transform section (X, Y, Width, Height, Rotation)
- [ ] Appearance section (Color, Opacity)
- [ ] Text section (conditional: fontSize, fontWeight)
- [ ] Line section (conditional: strokeWidth)
- [ ] Number inputs with validation
- [ ] Color picker component
- [ ] Opacity slider
- [ ] Updates shape immediately
- [ ] Debounced Firestore writes

### AI Integration:
```typescript
// Properties panel shows AI-created shapes
// Users can manually adjust after AI creates
// AI could set opacity: changeShapeOpacity(id, 0.5)
```

---

## PR #28: Visual Polish & Animations ✨

**Branch:** `feat-visual-polish` (STRETCH GOAL)  
**Goal:** Add polish and animations

### Tasks:
- [ ] Smooth transitions (150ms ease-in-out)
- [ ] Button hover effects
- [ ] Panel collapse/expand animations
- [ ] Selection fade-in
- [ ] Toast notifications
- [ ] Loading skeletons
- [ ] Shape creation preview
- [ ] Improved cursor feedback
- [ ] AI operation highlights (pulse effect)

### AI Integration:
```typescript
// Visual feedback during AI operations
// Highlight shapes as AI creates/modifies them
// Smooth animations for AI-generated layouts
```

---

## Success Metrics Checklist

### Required Features (Must Complete)
- [ ] Lines with stroke width
- [ ] Text with formatting (fontSize, fontWeight, color)
- [ ] Rotation for all shapes
- [ ] Multi-select (shift-click + drag-select)
- [ ] Layer management (zIndex, bring forward/back)
- [ ] Duplicate operation
- [ ] Keyboard shortcuts
- [ ] AI Chat Interface
- [ ] AI Creation Commands (4 types)
- [ ] AI Manipulation Commands (5 types)
- [ ] AI Selection Commands (5 types)
- [ ] AI Layout Commands (6 types)
- [ ] AI Complex Operations (4 multi-step)
- [ ] AI Query Commands (3 types)
- [ ] Real-time sync of all AI changes
- [ ] AI response <2s for simple, <5s for complex
- [ ] 60 FPS with 500+ shapes
- [ ] Demo video (3-5 min)
- [ ] AI Development Log (1 page)
- [ ] Deployed and publicly accessible

### Stretch Goals (If Time Permits)
- [ ] Copy/Paste
- [ ] Undo/Redo
- [ ] Properties Panel
- [ ] Advanced Layers Panel
- [ ] Context Menu
- [ ] Enhanced Toolbar
- [ ] Visual Polish
- [ ] Selection Sync UI

---

## Estimated Timeline

| Phase | PRs | Days | Priority |
|-------|-----|------|----------|
| Phase 1: Shapes | 2 | 1-1.5 | REQUIRED |
| Phase 2: Selection | 3 | 1-1.5 | REQUIRED |
| Phase 3: Rotation & Layers | 2 | 1 | REQUIRED |
| Phase 4: AI Foundation | 2 | 1.5 | **CRITICAL** |
| Phase 5: AI Basic | 2 | 1.5 | **CRITICAL** |
| Phase 6: AI Advanced | 2 | 2 | **CRITICAL** |
| Phase 7: AI Testing | 1 | 1 | **CRITICAL** |
| **TOTAL REQUIRED** | **14** | **8-10 days** | |
| Phase 8: Stretch Goals | 4 | 2-3 | OPTIONAL |
| **GRAND TOTAL** | **18** | **10-13 days** | |

---

## Development Best Practices

### AI-First Design
1. Build Canvas API wrapper early (PR #18)
2. All operations should be programmable
3. Think: "How will AI use this?"
4. Document function parameters clearly
5. Return useful data for AI context

### Code Organization
1. Keep AI layer separate from canvas logic
2. Canvas API is the bridge between AI and canvas
3. Function registry maps AI calls to implementations
4. Error messages should help AI understand what went wrong

### Testing Strategy
1. Test each AI command manually first
2. Verify real-time sync with 2+ browsers
3. Test edge cases (empty selection, invalid params)
4. Measure performance (response times)
5. Test multi-user AI scenarios

### Performance
1. Use batch operations for multi-shape creation
2. Debounce Firestore writes
3. Optimize layout calculations
4. Cache canvas state queries
5. Throttle AI requests if needed

---

## Next Steps

1. ✅ Review revised PRD and task list
2. ✅ Get approval on priorities
3. Begin PR #11: Line Shape Support
4. Build sequentially through phases
5. Keep AI integration in mind for all features
6. Complete core features before AI implementation
7. Test thoroughly with multiple users
8. Create demo video
9. Write AI Development Log
10. Deploy to production

---

**Remember:** The AI agent is the key differentiator. Prioritize stability and AI readiness over UI polish.

