# CollabCanvas - Project Brief

## Core Mission

Build a **real-time collaborative design tool with AI agent integration** that allows multiple users to create and manipulate shapes on a canvas while an AI agent can understand natural language commands to perform canvas operations.

## Project Scope (From Course Requirements)

This is a **one-week sprint project** with three deadlines:
- **MVP**: Tuesday (24 hours) - COMPLETED ✅
- **Early Submission**: Friday (4 days)
- **Final**: Sunday (7 days)

### Required Features (Must Have)

#### Collaborative Canvas (MVP - DONE)
- ✅ Basic canvas with pan/zoom
- ✅ Multiple shape types (rectangles, circles)
- ✅ Real-time sync between 2+ users
- ✅ Multiplayer cursors with name labels
- ✅ Presence awareness (who's online)
- ✅ User authentication (email/password + Google OAuth)
- ✅ Deployed and publicly accessible

#### Extended Canvas Features (Post-MVP - MOSTLY COMPLETE)
- ✅ Lines with solid colors and stroke width control (PR #11)
- ✅ Text layers with basic formatting (font size, weight, color) (PR #12)
- ⏳ Rotation transformation for all shapes (PR #16 - pending)
- ⏳ Multi-select (shift-click to add/remove)
- ⏳ Drag-select (selection box)
- ⏳ Layer management (bring forward/back, z-index control)
- ⏳ Duplicate operation
- ⏳ Delete operation (already working)

#### AI Canvas Agent (CRITICAL - NOT STARTED)
**This is the key differentiator and most important feature.**

Must support at least **6 distinct command types**:

1. **Creation Commands** (4 types)
   - Create rectangle, circle, line, text with specific attributes
   
2. **Manipulation Commands** (5 types)
   - Move, resize, rotate, change color, delete shapes

3. **Selection Commands** (5 types)
   - Select by type, color, region, ID, deselect all

4. **Layout Commands** (6 types)
   - Arrange horizontal/vertical, create grids, distribute evenly, center shapes

5. **Query Commands** (3 types)
   - Get canvas state, get selected shapes, get canvas center

6. **Complex Commands** (4 types - multi-step operations)
   - Create login form, navigation bar, card layout, button groups

**AI Requirements:**
- Natural language command interface
- Function calling integration (OpenAI GPT-4 or Anthropic Claude)
- Real-time sync of AI changes across all users
- <2 second response for simple commands
- <5 second response for complex commands
- Multi-step operation planning and execution
- 95%+ success rate on valid commands

### Performance Targets

**Canvas Performance:**
- 60 FPS during all interactions
- Support 500+ shapes without degradation
- 5+ concurrent users without lag
- <100ms sync latency for shape operations
- <50ms sync latency for cursor positions

**AI Performance:**
- <2 seconds for single-step commands
- <5 seconds for multi-step operations
- 95%+ success rate on valid commands
- Graceful error handling

## Out of Scope

Explicitly **not building** in this iteration:
- ❌ Images/media uploads
- ❌ Drawing/pen tools
- ❌ Advanced styling (gradients, shadows, patterns)
- ❌ Alignment guides and snapping
- ❌ Export functionality (PNG/SVG)
- ❌ Version history beyond undo/redo
- ❌ Comments and annotations
- ❌ Permissions/roles
- ❌ Templates library
- ❌ Custom fonts
- ❌ Groups/components (nested objects)

## Success Criteria for Final Submission

### Must Complete (Required)
1. All 4 shape types working (rectangle, circle, line, text)
2. All transformations working (move, resize, rotate)
3. Multi-select with shift-click and drag-select
4. Layer management with z-order control
5. Duplicate operation
6. **AI agent supporting 6+ command types**
7. **AI commands sync across all users in real-time**
8. AI responds within performance targets
9. 60 FPS maintained with 500+ shapes
10. **Demo video showing AI commands (3-5 minutes)**
11. **AI Development Log completed (1 page)**
12. Deployed and publicly accessible

### Stretch Goals (Nice to Have)
- Copy/paste
- Undo/redo
- Properties panel
- Context menu
- Enhanced toolbar
- Visual polish

## Key Constraints

1. **Timeline**: 7 days total (MVP done, ~5 days remaining)
2. **Technology**: Must use React + Firebase + Konva for canvas
3. **AI Integration**: Must use OpenAI or Anthropic with function calling
4. **Deployment**: Must be publicly accessible
5. **Collaboration**: Must support 5+ concurrent users
6. **Performance**: 60 FPS, <100ms sync

## Project Philosophy

> "A simple, solid, multiplayer canvas with a working AI agent beats any feature-rich app with broken collaboration."

The AI agent is the differentiator. **Focus on:**
1. Rock-solid collaborative infrastructure (done in MVP)
2. Complete shape support with transformations
3. **Fully functional AI agent** (most important)
4. Polish only if time permits

## Current Phase

**Phase**: Post-MVP Implementation  
**Focus**: Completing core shape features before AI integration  
**Timeline**: Days 2-7 of 7-day sprint

**Immediate Priorities:**
1. Lines and text shapes
2. Rotation support
3. Multi-select and layer management
4. **AI service integration**
5. **AI command implementation**
6. Testing and documentation

