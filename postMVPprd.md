CollabCanvas Post-MVP - Product Requirements Document
Project Overview
Enhance CollabCanvas from a basic multiplayer prototype to a polished, production-ready collaborative design tool with rich shape manipulation, beautiful UI, and professional-grade features.
Timeline: Post-MVP iteration (4-7 days recommended)
Success Criteria: Feature-complete collaborative canvas with professional UX matching industry standards

Design Inspiration
Primary References:

Figma: Toolbar organization, property panels, layer management
Miro: Shape library, color pickers, contextual menus
Canva: User-friendly controls, visual hierarchy
Excalidraw: Minimalist UI, hand-drawn aesthetic (optional inspiration)

Key Design Principles:

Discoverability: Features are easy to find without training
Contextual: Right tools appear at the right time
Non-intrusive: UI stays out of the way during creation
Consistent: Similar actions work the same way everywhere
Responsive: Immediate visual feedback for all actions


User Stories
Power User (Designer)

As a designer, I want to create circles, lines, and text in addition to rectangles so I can build complete designs
As a designer, I want to resize shapes by dragging corners so I can adjust proportions visually
As a designer, I want to rotate shapes so I can create dynamic layouts
As a designer, I want to select multiple shapes at once so I can move them together
As a designer, I want to drag-select multiple objects so I can quickly group selections
As a designer, I want to delete shapes I no longer need so I can clean up my canvas
As a designer, I want to duplicate shapes so I can quickly create variations
As a designer, I want to change shape colors so I can match my design system
As a designer, I want a layer panel so I can manage object stacking order
As a designer, I want to bring shapes forward/backward so I can control visual hierarchy
As a designer, I want keyboard shortcuts so I can work efficiently
As a designer, I want to undo/redo my actions so I can experiment freely

Collaborator (Team Member)

As a collaborator, I want to see what shapes are selected by other users so I avoid editing conflicts
As a collaborator, I want visual indicators when someone else is editing so I know what's being worked on
As a collaborator, I want locked objects to prevent accidental changes to finalized work

Text-Focused User

As a user, I want to add text layers with custom content so I can label my designs
As a user, I want to change font size so text is readable
As a user, I want to change font weight (bold) so I can emphasize important text
As a user, I want to change text color so it matches my design
As a user, I want to edit text inline so I can make quick changes


Key Features for Post-MVP
1. Extended Shape Library
Must Have:

Circle/ellipse creation and manipulation
Line creation with start/end points
Text layers with editable content
All shapes support fill color
Lines support stroke width

Visual Design:

Shape toolbar with icons (rectangle, circle, line, text)
Single-click tool selection with visual active state
Tool cursor changes to indicate mode
Shape preview while drawing

Acceptance Criteria:

All four shape types can be created
Each shape type has appropriate creation UX
Tools are clearly labeled and easy to discover
Creating shapes feels natural and immediate

2. Object Transformations
Must Have:

Resize: Drag corner/edge handles to resize shapes
Rotate: Rotation handle above selection or rotate gesture
Aspect Ratio: Hold Shift to constrain proportions during resize
Uniform Scale: Scale from center with Alt/Option key
Transform Indicators: Visual handles for resize/rotate

Visual Design:

8 resize handles (corners + edges) for rectangles/text
4 resize handles (cardinal directions) for circles
Rotation handle above selection box
Live transform feedback (dimensions tooltip)
Smooth handle appearance/animation

Acceptance Criteria:

Shapes can be resized by dragging handles
Shapes can be rotated smoothly
Shift key constrains aspect ratio
Transform handles are visible and intuitive
Transformations sync across users in real-time

3. Advanced Selection
Must Have:

Multi-select: Shift+click to add/remove from selection
Drag-select: Click-drag on empty canvas to create selection box
Select All: Cmd/Ctrl+A to select all shapes
Deselect: Click empty space or Escape key
Selection Bounds: Bounding box around all selected items
Group Transform: Move/resize/rotate multiple items together

Visual Design:

Selection box with dashed outline during drag
Selected shapes have blue bounding box
Multi-selection shows combined bounds
Selection count indicator (e.g., "3 objects selected")
Different color for own selection vs. others' selections

Acceptance Criteria:

Can select multiple shapes with Shift+click
Drag-select creates visual selection box
Multi-selected shapes move together
Clear visual feedback for selection state
Other users see selection indicators (different color)

4. Layer Management Panel
Must Have:

Sidebar panel showing all objects in hierarchical list
Object names (auto-generated or custom)
Visibility toggle (eye icon) per layer
Lock/unlock toggle per layer
Reorder layers by drag-drop
Bring Forward/Send Backward actions
Bring to Front/Send to Back actions

Visual Design:

Right sidebar (collapsible)
Figma-style layer list with indentation
Mini preview thumbnails for each layer
Layer type icons (rectangle, circle, text, line)
Hover actions (visibility, lock, delete)
Search/filter layers by name

Acceptance Criteria:

All shapes appear in layer panel
Layer order matches visual stacking on canvas
Can reorder layers and see instant canvas update
Lock prevents selection/editing
Hide makes layer invisible but preserved
Layer panel syncs across all users

5. Properties Panel
Must Have:

Position: X, Y coordinates (editable)
Size: Width, Height (editable)
Rotation: Angle in degrees (editable)
Fill Color: Color picker for shapes
Stroke Color: Color picker for lines
Stroke Width: Slider for line thickness
Text Properties: Font size, weight, color
Opacity: Transparency slider (0-100%)

Visual Design:

Left sidebar (collapsible)
Sections: Transform, Appearance, Text (conditional)
Color picker with presets + custom colors
Numeric inputs with up/down arrows
Sliders for continuous values
Live preview of changes

Acceptance Criteria:

Properties update when selection changes
Editing properties updates shape immediately
Color picker is intuitive and fast
Multi-selection shows mixed values appropriately
Property changes sync across users

6. Core Operations
Must Have:

Delete: Backspace/Delete key or button
Duplicate: Cmd/Ctrl+D or right-click menu
Copy/Paste: Cmd/Ctrl+C, Cmd/Ctrl+V
Cut: Cmd/Ctrl+X
Undo/Redo: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
Select All: Cmd/Ctrl+A

Visual Design:

Context menu on right-click (Cut, Copy, Paste, Delete, Duplicate)
Toolbar buttons for common actions
Keyboard shortcuts displayed in tooltips
Toast notifications for successful operations

Acceptance Criteria:

All operations work reliably
Keyboard shortcuts follow platform conventions
Operations sync across users immediately
Undo/redo works for all operations
Context menu appears on right-click

7. Text Editing
Must Have:

Double-click text to edit inline
Click outside or press Escape to finish editing
Font size selection (dropdown)
Bold toggle
Text color picker
Auto-resize text box based on content
Multi-line text support

Visual Design:

Inline editing with visible cursor
Text toolbar appears when editing (floating or top bar)
Font size dropdown (12, 14, 16, 18, 24, 32, 48, 64, 96)
Bold button with visual toggle state
Text color picker

Acceptance Criteria:

Double-click enters edit mode
Can type and see changes immediately
Text formatting applied instantly
Text edits sync to other users
Text box resizes to fit content

8. Collaborative Awareness
Must Have:

Show other users' selections with different colors
Display who is editing each object (name label)
Lock indicator when someone else is editing
Hover avatars on layers panel
Real-time selection sync

Visual Design:

Color-coded selection boxes (each user gets unique color)
Small avatar + name label near active selection
Subtle animation when others select objects
Layer panel shows mini avatars next to active layers

Acceptance Criteria:

Can see what other users have selected
Can see who is editing each object
Cannot edit objects being edited by others (optional soft lock)
Selection colors are distinct and visible


UI/UX Design System
Layout Structure
┌─────────────────────────────────────────────────┐
│  [Logo] [Tools] [Undo] [Redo]    [Share] [•••] │ ← Top Toolbar
├──────────┬───────────────────────────┬──────────┤
│          │                           │          │
│Properties│        Canvas             │  Layers  │
│  Panel   │      (pan/zoom)           │  Panel   │
│          │                           │          │
│ [X Y W H]│      🖱️ cursors           │ □ Rect 1 │
│ [Color]  │      📦 shapes            │ ○ Circle │
│ [Opacity]│                           │ ━ Line 1 │
│          │                           │ T Text   │
├──────────┴───────────────────────────┴──────────┤
│  [Users Online: 👤 Alice, 👤 Bob]                │ ← Bottom Status Bar
└─────────────────────────────────────────────────┘
Color Palette
Primary Actions: #0066FF (blue)
Success: #00C851 (green)
Danger: #FF4444 (red)
Warning: #FFBB33 (orange)
Background: #F8F9FA (light gray)
Panels: #FFFFFF (white)
Borders: #E1E4E8 (light gray)
Text: #24292E (dark gray)
Disabled: #959DA5 (medium gray)
Typography
Primary Font: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI"
Headers: 600 weight
Body: 400 weight
Labels: 500 weight
Size Scale: 12px (small), 14px (body), 16px (headers)
Interactions
Hover States: Lighten background by 5%
Active States: Primary color with 10% opacity background
Focus States: 2px primary color outline
Transitions: 150ms ease-in-out for all interactions
Tooltips: 300ms delay, dark background, white text

Technical Architecture Enhancements
Data Model Updates
Enhanced Shape Schema:
javascript{
  id: string,
  type: 'rectangle' | 'circle' | 'line' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number, // NEW
  fill: string, // hex color
  stroke: string, // for lines
  strokeWidth: number, // for lines
  opacity: number, // 0-1 // NEW
  locked: boolean, // NEW
  visible: boolean, // NEW
  zIndex: number, // NEW
  
  // Text-specific
  text?: string,
  fontSize?: number,
  fontWeight?: 'normal' | 'bold',
  
  // Metadata
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  updatedBy: string
}
Selection Tracking Schema:
javascript{
  userId: string,
  userName: string,
  selectedIds: string[], // array of shape IDs
  color: string, // user's selection color
  timestamp: timestamp
}
Undo/Redo History Schema:
javascript{
  userId: string,
  actions: [
    {
      type: 'create' | 'update' | 'delete',
      shapeId: string,
      before: object, // previous state
      after: object, // new state
      timestamp: timestamp
    }
  ]
}
New Services & Hooks
New Files:

src/services/selection.js - Selection sync service
src/services/history.js - Undo/redo management
src/hooks/useSelection.js - Selection state management
src/hooks/useTransform.js - Resize/rotate logic
src/hooks/useKeyboard.js - Keyboard shortcuts
src/hooks/useHistory.js - Undo/redo hooks
src/components/Toolbar/Toolbar.jsx - Main toolbar
src/components/Toolbar/ShapeTools.jsx - Shape creation tools
src/components/Panels/PropertiesPanel.jsx - Right sidebar
src/components/Panels/LayersPanel.jsx - Left sidebar
src/components/Canvas/TransformHandles.jsx - Resize/rotate handles
src/components/Canvas/SelectionBox.jsx - Multi-select box
src/components/UI/ColorPicker.jsx - Color picker component
src/components/UI/ContextMenu.jsx - Right-click menu


Performance Considerations
Optimization Targets

Shape Count: Support 1000+ shapes without FPS drop
Concurrent Users: 10+ users editing simultaneously
Undo History: 50+ actions per user without memory issues
Layer Panel: Virtualized list for 500+ layers
Color Picker: Debounced color updates (100ms)
Transform: Throttled transform updates during drag (16ms)

Implementation Strategies

Use Konva caching for static layers
Implement virtual scrolling for layer panel
Debounce property panel inputs
Throttle transform handle updates
Use React.memo for expensive components
Implement lazy loading for color picker


Out of Scope (Future Phases)
Not Building Yet:

❌ Groups/components (nested objects)
❌ Images/media uploads
❌ Drawing/pen tools
❌ Comments and annotations
❌ Version history
❌ Export to PNG/SVG
❌ Templates library
❌ Collaboration permissions (editor/viewer roles)
❌ Real-time voice/video chat
❌ Plugins or extensions
❌ Custom fonts
❌ Gradients or patterns
❌ Shadows and effects
❌ Alignment guides and snapping
❌ Grid and rulers


Success Metrics
Feature Completeness

 4 shape types fully functional (rectangle, circle, line, text)
 All transformations working (move, resize, rotate)
 Multi-select with drag-select box
 Layer panel with full management
 Properties panel with all controls
 Undo/redo for all operations
 Delete and duplicate operations
 Text editing with formatting

UX Quality

 Interactions feel instant (<100ms perceived latency)
 UI is discoverable (first-time users can use without training)
 No confusing error states
 Keyboard shortcuts work consistently
 Color picker is fast and intuitive
 Panels can be collapsed/expanded

Collaborative Features

 Selection sync shows who's editing what
 No editing conflicts during multi-user sessions
 Layer changes sync instantly
 All operations sync within 100ms

Visual Polish

 Consistent design system across all UI
 Smooth animations and transitions
 Professional-looking panels and toolbars
 Clear visual hierarchy
 Accessible color contrast


Technical Risks & Mitigation
Risk 1: Transform Sync Complexity
Risk: Rotation and resize are harder to sync than simple position
Mitigation:

Use transform origin point consistently
Send complete transform state (not deltas)
Test with simultaneous transforms
Add transform throttling

Risk 2: Undo/Redo with Multiplayer
Risk: Undo needs to work per-user but affects shared state
Mitigation:

Implement per-user undo stack
Only undo own actions
Don't undo if someone else modified the object
Clear undo stack for objects edited by others

Risk 3: Text Editing Conflicts
Risk: Two users editing same text simultaneously
Mitigation:

Lock text objects when being edited
Show "User X is editing" indicator
Prevent simultaneous edits
Or use operational transform (advanced)

Risk 4: Performance with Complex Shapes
Risk: Many shapes with text/rotation may slow down
Mitigation:

Profile with 500+ shapes early
Implement layer caching
Use Konva's performance features
Consider virtual rendering for off-screen shapes

Risk 5: Z-Index Management
Risk: Layer order can conflict when multiple users reorder
Mitigation:

Use fractional z-index values (allows insertion)
Periodically normalize z-index values
Last-write-wins for layer order
Or use conflict-free replicated data type (CRDT)


Open Questions for Decision

Undo/Redo Scope: Should undo work across all users (like Google Docs) or per-user only?

Recommendation: Per-user only (simpler, less confusing)


Text Editing Lock: Hard lock (prevent edit) or soft lock (warn but allow)?

Recommendation: Hard lock for MVP, prevents conflicts


Default Colors: Should shapes have random colors or fixed default?

Recommendation: Fixed default with quick color picker


Panel Visibility: Should panels start expanded or collapsed?

Recommendation: Expanded by default, collapsible for more space


Selection Color Assignment: How to assign colors to users?

Recommendation: Hash user ID to HSL color for consistency


Context Menu Placement: Fixed position or follow cursor?

Recommendation: Follow cursor (better UX)


Transform Handle Appearance: Always visible or only on selection?

Recommendation: Only on selection (less clutter)




Next Steps

Review this PRD and confirm feature priority
Validate UI/UX design approach
Create detailed task list with PR breakdown
Design component architecture
Build feature-by-feature incrementally
Continuous testing with real users