# CollabCanvas Revised PRD - AI-First Collaborative Canvas

## Project Overview

**Goal**: Build a production-ready collaborative canvas with AI agent integration that can manipulate the canvas through natural language commands.

**Timeline**: Post-MVP iteration (4-7 days recommended)

**Success Criteria**: 
1. Complete collaborative canvas with required shape types and transformations
2. Fully functional AI agent supporting 6+ command types
3. Real-time sync of all AI-generated changes across users
4. Professional UX with 60 FPS performance

---

## Scope Alignment with Project Requirements

### ✅ **MUST HAVE (Required for Final Submission)**

These features are **explicitly required** by the project scope:

#### Core Canvas Features
- ✅ Lines with solid colors (stroke width control)
- ✅ Text layers with basic formatting (font size, weight, color)
- ✅ Rotation transformation for all shapes
- ✅ Multi-select (shift-click to add/remove)
- ✅ Drag-select (click-drag selection box)
- ✅ Layer management (bring forward/back, reorder)
- ✅ Duplicate operation
- ✅ Delete operation (already implemented)

#### AI Canvas Agent (CRITICAL REQUIREMENT)
- ✅ Natural language command interface
- ✅ Function calling integration (OpenAI GPT-4 or Anthropic Claude)
- ✅ Minimum 6 distinct command types:
  - **Creation Commands**: Create shapes with specific attributes
  - **Manipulation Commands**: Move, resize, rotate existing shapes
  - **Layout Commands**: Arrange shapes in patterns (grid, row, column)
  - **Selection Commands**: Select shapes by criteria
  - **Complex Commands**: Multi-step operations (login form, nav bar, etc.)
- ✅ Real-time sync of AI changes across all users
- ✅ <2 second response for simple commands
- ✅ Multi-step operation planning and execution

### 🎯 **STRETCH GOALS (Bonus Targets - Time Permitting)**

These features improve UX but are **not required** for submission:

- ⭐ Copy/Paste operations
- ⭐ Undo/Redo system
- ⭐ Properties Panel (right sidebar with detailed controls)
- ⭐ Advanced Layers Panel (with visibility toggles, thumbnails)
- ⭐ Context Menu (right-click actions)
- ⭐ Enhanced Toolbar (with tool icons and visual feedback)
- ⭐ Visual Polish (animations, transitions, micro-interactions)
- ⭐ Selection Sync UI (show other users' selections with colored borders)
- ⭐ Performance optimization beyond 500 shapes (virtualization, caching)

---

## Design Philosophy: AI-First Architecture

**Key Principle**: Every feature should be designed with AI integration in mind.

### AI Interaction Model

The AI agent needs to:
1. **Query canvas state** - Get current shapes, positions, selections
2. **Create shapes** - Add rectangles, circles, lines, text with specific attributes
3. **Modify shapes** - Move, resize, rotate, change colors
4. **Select shapes** - Select by ID, type, color, position, or other criteria
5. **Arrange shapes** - Layout operations (grid, row, distribute)
6. **Execute complex operations** - Multi-step sequences (forms, layouts)

### Function Calling Schema Design

All canvas operations should be exposed as callable functions:

```typescript
// Shape Creation
createRectangle(x, y, width, height, color)
createCircle(x, y, radius, color)
createLine(x1, y1, x2, y2, strokeWidth, color)
createText(text, x, y, fontSize, fontWeight, color)

// Shape Manipulation
moveShape(shapeId, x, y)
resizeShape(shapeId, width, height)
rotateShape(shapeId, degrees)
changeShapeColor(shapeId, color)
deleteShape(shapeId)
duplicateShape(shapeId, offsetX, offsetY)

// Selection
selectShape(shapeId)
selectShapesByType(type) // 'rectangle', 'circle', 'line', 'text'
selectShapesByColor(color)
selectShapesInRegion(x, y, width, height)
deselectAll()

// Layout Operations
arrangeHorizontal(shapeIds, spacing)
arrangeVertical(shapeIds, spacing)
arrangeGrid(shapeIds, rows, cols, spacingX, spacingY)
distributeEvenly(shapeIds, direction) // 'horizontal' or 'vertical'
centerShape(shapeId)
centerShapes(shapeIds)

// Canvas State Queries
getCanvasState() // returns all shapes
getSelectedShapes() // returns currently selected shapes
getShapesByType(type) // returns all shapes of type
getCanvasCenter() // returns viewport center coordinates

// Complex Operations (Multi-step)
createLoginForm(x, y) // creates username field, password field, submit button
createNavigationBar(x, y, itemCount, itemWidth)
createCardLayout(x, y, width, height, title, content)
createButtonGroup(x, y, buttonCount, orientation)
```

---

## User Stories (Revised Priorities)

### Priority 1: Core Shape Types (Required)

**As a designer:**
- I want to create **lines** so I can draw connections and borders
- I want to create **text layers** so I can add labels and content
- I want to **rotate shapes** so I can create dynamic layouts
- I want to **duplicate shapes** so I can quickly create variations

**As an AI agent:**
- I need to create all shape types programmatically
- I need to specify precise positions, sizes, and properties
- I need to rotate shapes to create layouts
- I need to duplicate shapes to create patterns

### Priority 2: Multi-Select & Layer Management (Required)

**As a designer:**
- I want to **select multiple shapes** (shift-click) so I can operate on groups
- I want to **drag-select** multiple shapes so I can quickly group selections
- I want to **bring shapes forward/backward** so I can control visual hierarchy
- I want to **see layers in a list** so I can manage complex designs

**As an AI agent:**
- I need to select multiple shapes to perform layout operations
- I need to control z-order for proper visual layering
- I need to query which shapes exist and their order

### Priority 3: AI Canvas Agent (CRITICAL)

**As a user:**
- I want to tell the AI "create a blue rectangle at the center" and see it appear
- I want to say "arrange these shapes in a row" and have the AI do it
- I want to request "create a login form" and get a complete layout
- I want other users to see the AI's changes in real-time
- I want the AI to respond quickly (<2 seconds for simple commands)

**As a developer:**
- I need a clear function calling interface
- I need the AI to understand canvas state
- I need multi-step operations to execute sequentially
- I need error handling for invalid commands
- I need visual feedback during AI operations

### Priority 4: Polish Features (Stretch Goals)

**As a power user:**
- I want copy/paste so I can reuse elements
- I want undo/redo so I can experiment freely
- I want a properties panel so I can fine-tune attributes
- I want a polished UI with smooth animations

---

## Required Features - Detailed Specifications

### 1. Line Shape Support

**Must Have:**
- Line creation by dragging from start to end point
- Storage: `{x, y, width, height}` where line goes from (x,y) to (x+width, y+height)
- Properties: `strokeWidth` (default 2px), `color`
- Selection: Wider hit area (10px) for easier clicking
- Transform: Drag endpoints to reposition, rotate to change angle

**AI Integration:**
```typescript
// AI can create lines programmatically
createLine(100, 100, 300, 200, 3, '#FF0000')
// Creates a red line from (100,100) to (300,200) with 3px width
```

**Data Schema:**
```javascript
{
  type: 'line',
  x: 100,           // Start X
  y: 100,           // Start Y
  width: 200,       // Delta X (end X = x + width)
  height: 100,      // Delta Y (end Y = y + height)
  strokeWidth: 2,
  color: '#000000',
  rotation: 0       // Can be rotated like other shapes
}
```

### 2. Text Shape Support

**Must Have:**
- Click-to-place text creation
- Double-click to edit (textarea overlay)
- Properties: `text`, `fontSize` (12-96), `fontWeight` ('normal'|'bold'), `color`
- Auto-resize bounding box based on content
- Multi-line support (line breaks)
- Edit lock: `editingBy` field prevents simultaneous edits

**AI Integration:**
```typescript
// AI can create and modify text
createText('Hello World', 100, 100, 24, 'bold', '#000000')
updateText(shapeId, 'Updated text')
changeTextSize(shapeId, 32)
```

**Data Schema:**
```javascript
{
  type: 'text',
  x: 100,
  y: 100,
  width: 150,        // Auto-calculated from content
  height: 30,        // Auto-calculated from content
  text: 'Hello World',
  fontSize: 24,
  fontWeight: 'normal', // 'normal' or 'bold'
  color: '#000000',
  rotation: 0,
  editingBy: null    // userId when being edited
}
```

### 3. Rotation Support

**Must Have:**
- `rotation` field added to all shapes (degrees, 0-359)
- Konva Transformer already supports rotation handles
- Rotation applied to shape rendering
- Group rotation: rotate multiple shapes around combined center

**AI Integration:**
```typescript
// AI can rotate shapes precisely
rotateShape(shapeId, 45)  // Rotate 45 degrees clockwise
rotateShape(shapeId, -30) // Rotate 30 degrees counter-clockwise
```

**Implementation:**
- Add `rotation` to shape schema
- Konva shapes accept `rotation` prop natively
- Update Shape.jsx to pass rotation to Konva components

### 4. Multi-Select

**Must Have:**
- Shift+click to add/remove shapes from selection
- `selectedShapeIds` array (replaces single `selectedShapeId`)
- Visual: Combined bounding box with transformer handles
- Operations apply to all selected shapes
- Cmd/Ctrl+A to select all

**AI Integration:**
```typescript
// AI can select multiple shapes for operations
selectShapes([id1, id2, id3])
selectShapesByType('rectangle')
selectShapesByColor('#FF0000')

// Then perform operations on selection
moveSelected(50, 50)        // Move all by offset
arrangeSelectedHorizontal(20) // Arrange with 20px spacing
```

### 5. Drag-Select

**Must Have:**
- Click-drag on empty canvas creates selection box
- Visual: Dashed blue rectangle during drag
- Selects all shapes whose bounding boxes intersect the selection box
- Works in Move mode only

**AI Integration:**
- AI uses programmatic selection, not drag-select
- But AI can select by region: `selectShapesInRegion(x, y, width, height)`

### 6. Layer Management

**Must Have:**
- Add `zIndex` field to shapes (integer)
- Display layers list (sorted by zIndex)
- Click layer to select shape
- Bring Forward: increment zIndex
- Send Backward: decrement zIndex
- Bring to Front: set to max zIndex + 1
- Send to Back: set to min zIndex - 1

**AI Integration:**
```typescript
// AI can manage z-order
bringShapeToFront(shapeId)
sendShapeToBack(shapeId)
bringShapeForward(shapeId)
sendShapeBackward(shapeId)
```

**Data Schema:**
```javascript
{
  // ... existing fields
  zIndex: 5  // Higher values render on top
}
```

### 7. Duplicate Operation

**Must Have:**
- Cmd/Ctrl+D duplicates selected shape(s)
- Duplicates appear offset by 20px (both x and y)
- Works with multi-select
- Preserves all properties (color, size, rotation, etc.)

**AI Integration:**
```typescript
// AI can duplicate shapes programmatically
duplicateShape(shapeId, 30, 30) // Offset 30px right and down
duplicateShapes([id1, id2], 0, 50) // Duplicate multiple with offset
```

---

## AI Canvas Agent - Detailed Specification

### Architecture

```
User Input → AI Service → Function Calling → Canvas Operations → Firestore → Real-time Sync
                                                     ↓
                                              Visual Feedback
```

### Components

1. **AI Chat Interface**
   - Input field for natural language commands
   - Command history display
   - Loading indicator during execution
   - Success/error feedback

2. **AI Service Layer** (`src/services/ai.js`)
   - OpenAI API integration OR Anthropic Claude
   - Function calling schema definition
   - Command parsing and validation
   - Multi-step operation orchestration

3. **Canvas API Layer** (`src/services/canvasAPI.js`)
   - Wrapper functions for all canvas operations
   - Used by both AI and manual interactions
   - Consistent interface for shape manipulation

4. **Function Registry** (`src/services/aiFunctions.js`)
   - Maps AI function calls to canvas operations
   - Parameter validation
   - Error handling
   - Returns execution results to AI

### Required AI Commands (6+ Types)

#### Type 1: Shape Creation (4 commands)
```typescript
createRectangle(x: number, y: number, width: number, height: number, color: string)
createCircle(x: number, y: number, radius: number, color: string)
createLine(x1: number, y1: number, x2: number, y2: number, strokeWidth: number, color: string)
createText(text: string, x: number, y: number, fontSize: number, color: string)
```

**Example Commands:**
- "Create a blue rectangle at 100, 200 with size 150 by 100"
- "Add a red circle at the center with radius 50"
- "Draw a black line from 50,50 to 200,150"
- "Add text 'Hello World' at 100,100 in size 24"

#### Type 2: Shape Manipulation (4 commands)
```typescript
moveShape(shapeId: string, x: number, y: number)
resizeShape(shapeId: string, width: number, height: number)
rotateShape(shapeId: string, degrees: number)
changeShapeColor(shapeId: string, color: string)
```

**Example Commands:**
- "Move the blue rectangle to 300, 400"
- "Resize the circle to be twice as big"
- "Rotate the text 45 degrees"
- "Change the rectangle color to red"

#### Type 3: Selection Commands (3 commands)
```typescript
selectShapesByType(type: 'rectangle' | 'circle' | 'line' | 'text')
selectShapesByColor(color: string)
selectShapesInRegion(x: number, y: number, width: number, height: number)
```

**Example Commands:**
- "Select all rectangles"
- "Select all red shapes"
- "Select shapes in the top-left corner"

#### Type 4: Layout Commands (4 commands)
```typescript
arrangeHorizontal(shapeIds: string[], spacing: number)
arrangeVertical(shapeIds: string[], spacing: number)
arrangeGrid(shapeIds: string[], rows: number, cols: number, spacing: number)
centerShape(shapeId: string)
```

**Example Commands:**
- "Arrange these shapes in a horizontal row with 20px spacing"
- "Create a 3x3 grid of squares"
- "Space these elements evenly"
- "Center the rectangle on the canvas"

#### Type 5: Query Commands (3 commands)
```typescript
getCanvasState() → returns all shapes
getSelectedShapes() → returns currently selected shapes
getCanvasCenter() → returns viewport center coordinates
```

**Example Commands:**
- "What shapes are on the canvas?"
- "Tell me about the selected shapes"
- "Where is the center of the canvas?"

#### Type 6: Complex Commands (3 multi-step operations)
```typescript
createLoginForm(x: number, y: number)
// Creates: username text, username field, password text, password field, submit button
// Arranged vertically with proper spacing

createNavigationBar(x: number, y: number, itemCount: number)
// Creates: itemCount rectangles arranged horizontally
// Each with text label (Nav Item 1, Nav Item 2, etc.)

createCardLayout(x: number, y: number, width: number, height: number, title: string)
// Creates: rectangle border, title text, content placeholder text
// Arranged in card format
```

**Example Commands:**
- "Create a login form at 100, 100"
- "Build a navigation bar with 5 items"
- "Make a card layout with title 'Welcome'"

### AI Performance Requirements

- **Latency**: <2 seconds for simple commands (creation, movement)
- **Latency**: <5 seconds for complex commands (login form, grid)
- **Reliability**: 95%+ success rate on valid commands
- **Error Handling**: Clear error messages for invalid commands
- **Feedback**: Visual indicator when AI is processing
- **Real-time Sync**: All AI changes visible to other users within 100ms

### AI UX Design

**Chat Interface Placement:**
- Bottom-right corner (collapsible panel)
- Or: Top bar with dropdown
- Or: Floating button that opens modal

**Visual Feedback:**
- Typing indicator when AI is thinking
- Highlight shapes being created/modified by AI
- Show command in chat history
- Success/error messages

**Error Handling:**
- "I couldn't find a blue rectangle on the canvas"
- "Please specify x and y coordinates for the shape"
- "That operation requires at least 2 selected shapes"

---

## Implementation Phases

### Phase 1: Core Shape Completion (2 PRs, ~1.5 days)
- PR #11: Line Shape Support
- PR #12: Text Shape Support

### Phase 2: Selection & Interaction (3 PRs, ~1.5 days)
- PR #13: Multi-Select (shift-click, select all)
- PR #14: Drag-Select Box
- PR #15: Duplicate + Keyboard Shortcuts

### Phase 3: Rotation & Layers (2 PRs, ~1 day)
- PR #16: Rotation Support (all shapes)
- PR #17: Layer Management (zIndex, bring forward/back)

### Phase 4: AI Agent Foundation (2 PRs, ~1.5 days)
- PR #18: AI Service Integration
  - OpenAI/Claude API setup
  - Function calling schema
  - Canvas API wrapper layer
- PR #19: AI Chat Interface
  - Chat UI component
  - Command input and history
  - Visual feedback system

### Phase 5: AI Commands - Basic (2 PRs, ~1.5 days)
- PR #20: AI Creation & Manipulation Commands
  - Shape creation (4 commands)
  - Shape manipulation (4 commands)
  - Query commands (3 commands)
- PR #21: AI Selection Commands
  - Select by type, color, region
  - Integration with multi-select

### Phase 6: AI Commands - Advanced (2 PRs, ~2 days)
- PR #22: AI Layout Commands
  - Arrange horizontal/vertical
  - Grid layout
  - Center shapes
  - Distribute evenly
- PR #23: AI Complex Operations
  - Login form builder
  - Navigation bar builder
  - Card layout builder
  - Multi-step execution engine

### Phase 7: Testing & Polish (1 PR, ~1 day)
- PR #24: AI Testing & Documentation
  - Multi-user AI testing
  - Command validation
  - Error handling improvements
  - AI Development Log
  - Demo video preparation

### Phase 8: Stretch Goals (Time Permitting)
- PR #25: Copy/Paste
- PR #26: Undo/Redo
- PR #27: Properties Panel
- PR #28: Visual Polish

---

## Technical Architecture Updates

### Data Schema Changes

```javascript
// Updated Shape Schema
{
  id: string,
  type: 'rectangle' | 'circle' | 'line' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,        // NEW: 0-359 degrees
  color: string,           // fill for shapes, stroke for lines
  opacity: number,         // 0-1 (optional, default 1)
  zIndex: number,          // NEW: for layering
  
  // Line-specific
  strokeWidth?: number,    // NEW: for lines
  
  // Text-specific
  text?: string,           // NEW: text content
  fontSize?: number,       // NEW: 12-96
  fontWeight?: 'normal' | 'bold', // NEW
  
  // Metadata
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  lockedBy: string | null,
  lockedAt: timestamp | null,
  editingBy: string | null  // NEW: for text editing
}
```

### New Services

```
src/services/
  ├── ai.js              // NEW: AI service (OpenAI/Claude)
  ├── canvasAPI.js       // NEW: Canvas operations wrapper
  ├── aiFunctions.js     // NEW: Function calling registry
  └── aiCommands.js      // NEW: Complex command implementations
```

### New Components

```
src/components/
  └── AI/
      ├── AIChat.jsx           // NEW: Chat interface
      ├── AICommandInput.jsx   // NEW: Input field
      ├── AIHistory.jsx        // NEW: Command history
      └── AIFeedback.jsx       // NEW: Visual feedback
```

---

## Performance Targets

### Canvas Performance
- 60 FPS during all interactions
- Support 500+ shapes without degradation
- 5+ concurrent users without lag
- <100ms sync latency for shape operations
- <50ms sync latency for cursor positions

### AI Performance
- <2 seconds response for simple commands (single shape operations)
- <5 seconds response for complex commands (multi-step operations)
- <100ms sync of AI-generated changes to other users
- 95%+ success rate on valid commands
- Graceful error handling for invalid commands

---

## Success Metrics

### Required for Submission (Must Have All)
- ✅ 4 shape types working (rectangle, circle, line, text)
- ✅ All transformations working (move, resize, rotate)
- ✅ Multi-select with shift-click and drag-select
- ✅ Layer management with z-order control
- ✅ Duplicate operation
- ✅ AI agent supporting 6+ command types
- ✅ AI commands sync across all users in real-time
- ✅ AI responds within performance targets (<2s simple, <5s complex)
- ✅ 60 FPS maintained with 500+ shapes
- ✅ Demo video showing AI commands
- ✅ AI Development Log completed

### Stretch Goals (Nice to Have)
- ⭐ Copy/paste working
- ⭐ Undo/redo working
- ⭐ Properties panel with all controls
- ⭐ Context menu
- ⭐ Enhanced toolbar
- ⭐ Visual polish (animations, transitions)
- ⭐ Selection sync UI

---

## Risk Mitigation

### Risk 1: AI API Rate Limits
**Mitigation:**
- Implement request queuing
- Add rate limit monitoring
- Provide clear feedback to users
- Consider caching common operations

### Risk 2: AI Command Parsing Errors
**Mitigation:**
- Extensive prompt engineering
- Clear function calling schema
- Validation layer before execution
- Helpful error messages to guide users

### Risk 3: AI-Generated Changes Conflict with Manual Edits
**Mitigation:**
- Use existing locking mechanism
- AI respects shape locks
- Clear visual feedback when AI is acting
- Conflict resolution: last-write-wins

### Risk 4: Complex Commands Too Slow
**Mitigation:**
- Show progress indicator for multi-step operations
- Break into smaller sub-operations
- Optimize batch Firestore writes
- Consider operation cancellation

### Risk 5: AI Integration Delays Other Features
**Mitigation:**
- Build canvas API wrapper early (reusable)
- Keep AI layer separate from core canvas
- Implement core features first (stable foundation)
- AI as final integration step

---

## Development Guidelines

### AI-First Design Principles

1. **All operations should be programmable**
   - Every manual action should have a function equivalent
   - Clear, consistent parameter naming
   - Return values for chaining operations

2. **Canvas state should be queryable**
   - AI needs to "see" current canvas state
   - Efficient getters for shapes, selections, viewport
   - Filter and search capabilities

3. **Operations should be atomic or composable**
   - Single-step operations are simple functions
   - Complex operations compose simple operations
   - Clear success/failure states

4. **Real-time sync is non-negotiable**
   - AI-generated changes sync like manual changes
   - No special cases for AI operations
   - Use existing Firestore infrastructure

5. **Error handling is critical**
   - Validate AI inputs before execution
   - Clear error messages for users
   - Graceful failure (don't crash canvas)

---

## Out of Scope

### Explicitly NOT Building

- ❌ Images/media uploads
- ❌ Drawing/pen tools
- ❌ Advanced styling (gradients, shadows, patterns)
- ❌ Alignment guides and snapping
- ❌ Export functionality (PNG/SVG)
- ❌ Version history
- ❌ Comments and annotations
- ❌ Permissions/roles
- ❌ Templates library
- ❌ Plugins or extensions
- ❌ Custom fonts
- ❌ Grid and rulers
- ❌ Groups/components (nested objects)

---

## Submission Requirements

### Final Deliverables

1. **GitHub Repository**
   - Clean, organized code
   - Comprehensive README
   - Setup instructions
   - Architecture documentation

2. **Demo Video (3-5 minutes)**
   - Show real-time collaboration (2 users)
   - Demonstrate all shape types
   - Show AI commands in action
   - Explain architecture briefly

3. **AI Development Log (1 page)**
   - Tools & Workflow used
   - Prompting strategies (3-5 examples)
   - AI-generated vs hand-written code percentage
   - Strengths & Limitations
   - Key learnings

4. **Deployed Application**
   - Publicly accessible URL
   - Supports 5+ concurrent users
   - All features working in production
   - No critical console errors

---

## Next Steps

1. Review and approve this revised PRD
2. Implement revised task list with new priorities
3. Begin Phase 1: Core Shape Completion
4. Build canvas API wrapper early (for AI integration)
5. Complete core features before AI implementation
6. Implement AI agent (Phases 4-6)
7. Test extensively with multiple users and AI commands
8. Create demo video and documentation
9. Tackle stretch goals if time permits

---

**Remember**: A fully functional AI agent with basic canvas features beats a feature-rich canvas without AI. The AI agent is the differentiator for this project.

