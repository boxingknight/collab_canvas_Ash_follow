# Product Context

## Why This Project Exists

CollabCanvas is an **educational project** designed to teach real-time collaboration and AI integration patterns. It mirrors what modern AI startups are building: tools where humans and AI co-create in real-time.

### Inspiration
- **Figma**: Real-time collaboration, multiplayer cursors, smooth interactions
- **Miro**: Collaborative whiteboard, shape library
- **Cursor/Copilot**: AI agents that understand context and execute commands

### The Core Problem
Traditional design tools are either:
1. Single-player (no collaboration) OR
2. Multi-player (but no AI assistance)

**CollabCanvas combines both**: Real-time collaboration + AI agent that can manipulate the canvas through natural language.

## User Experience Goals

### For Manual Users (Already Achieved in MVP)
A designer should be able to:
1. Log in and immediately see a shared canvas
2. Create shapes with simple click-and-drag
3. Move and manipulate shapes smoothly (60 FPS)
4. See other users' cursors and changes in real-time (<100ms)
5. Know who's online and where they're working
6. Have their work persist across sessions

### For AI-Assisted Users (Primary Goal)
A user should be able to:
1. Type natural language commands like "Create a login form"
2. See the AI execute commands in real-time
3. Watch shapes appear and arrange themselves
4. Have other collaborators see AI changes simultaneously
5. Mix manual edits with AI commands seamlessly
6. Get helpful feedback when commands are ambiguous

### Expected User Flows

**Flow 1: Manual Collaboration**
```
User A: Creates rectangle → User B sees it appear (<100ms)
User B: Moves rectangle → User A sees movement in real-time
User A: Changes color → User B sees color change
Both: Continue collaborating without conflicts
```

**Flow 2: AI-Assisted Creation**
```
User: Types "Create a blue rectangle at the center"
AI: Calls createRectangle(2500, 2500, 200, 150, '#0000FF')
Canvas: Rectangle appears at center
All Users: See the new rectangle via real-time sync
AI: Responds "I created a blue rectangle at the center"
```

**Flow 3: Complex AI Operation**
```
User: Types "Create a login form"
AI: Plans multi-step operation:
  1. Create "Username:" label
  2. Create username input field
  3. Create "Password:" label  
  4. Create password input field
  5. Create "Login" button
  6. Arrange vertically with spacing
Canvas: Shapes appear one by one
All Users: See the form being constructed
AI: Responds "I created a login form with username, password, and submit button"
```

## Core Value Propositions

### For Learning
1. **Understand real-time collaboration patterns**
   - Operational transforms vs last-write-wins
   - Cursor tracking and presence
   - Conflict resolution strategies

2. **Learn AI function calling**
   - How to design AI-callable APIs
   - Parameter validation and error handling
   - Multi-step operation planning

3. **Experience performance challenges**
   - Maintaining 60 FPS with hundreds of shapes
   - Optimizing Firestore reads/writes
   - Throttling and debouncing strategies

### For Demonstration
1. **Show technical competence**
   - Real-time systems
   - AI integration
   - Full-stack development

2. **Demonstrate design thinking**
   - AI-first architecture
   - User experience for collaborative tools
   - Progressive enhancement

## How It Should Work

### Session Lifecycle
1. **User joins**: Authentication → Canvas loads → Presence registered
2. **Initial sync**: All existing shapes load (<3 seconds)
3. **Active session**: Real-time updates via Firestore listeners
4. **AI interaction**: Natural language → Function calls → Canvas updates
5. **User leaves**: Presence updated, cursor removed, work persists

### Data Flow
```
Manual Edit: 
User Input → React State → Firestore → All Clients → React State → Canvas Render

AI Edit:
User Message → AI Service → Function Call → Canvas API → Firestore → All Clients → Canvas Render
```

### Collaboration Model
- **Single global canvas**: All users share one workspace (MVP simplification)
- **No permissions**: All users can edit everything (trust-based)
- **Real-time sync**: Every change broadcasts immediately
- **Visual awareness**: Cursors and presence show who's where
- **Conflict resolution**: Last-write-wins with locking during drags

## Design Principles

### 1. AI-First Architecture
Every canvas operation must be:
- **Programmable**: Callable as a function with clear parameters
- **Queryable**: AI can ask "what's on the canvas?"
- **Composable**: Simple operations combine into complex ones
- **Synchronous**: AI sees immediate results, no async confusion

### 2. Collaboration is Non-Negotiable
- All operations sync in real-time
- No special cases for AI vs manual operations
- Both use the same underlying Canvas API
- Same Firestore infrastructure for all changes

### 3. Performance Over Features
- 60 FPS is mandatory
- <100ms sync is mandatory
- <2s AI response for simple commands is mandatory
- Better to have fewer features that work perfectly

### 4. Progressive Enhancement
- MVP: Basic shapes + real-time sync ✅
- Phase 2: Extended shapes + transformations ⏳
- Phase 3: AI agent with basic commands ⏳
- Phase 4: AI agent with complex commands ⏳
- Phase 5: Polish and stretch goals (if time)

## User Interface Philosophy

### Canvas Interaction Modes
1. **Pan Mode (V)**: Navigate the canvas
   - Click-drag to pan
   - Scroll to zoom
   - Clicking shapes auto-switches to Move mode

2. **Move Mode (M)**: Select and transform
   - Click to select (selection-first pattern)
   - Drag to move selected shapes
   - Transformer handles for resize/rotate

3. **Draw Mode (D)**: Create new shapes
   - Choose shape type (rectangle, circle, line, text)
   - Click-drag to create
   - Random colors assigned automatically

### AI Interface
- **Bottom-right collapsible panel**: Chat-style interface
- **Input field**: Type natural language commands
- **History**: Conversation display (user messages, AI responses)
- **Feedback**: Loading states, success/error messages
- **Examples**: Show sample commands when empty
- **Keyboard shortcut**: Cmd+K or / to focus input

### Visual Feedback
- **Multiplayer cursors**: Colored cursors with user names
- **Selection highlights**: Blue border for selected shapes
- **Transform handles**: Corner/edge handles for resize, rotation handle
- **AI operation highlights**: Pulse/glow when AI is creating/modifying
- **Loading states**: Spinner while AI processes
- **Toast notifications**: Success/error messages

## Success Metrics

### Technical Success
- ✅ 60 FPS maintained with 500+ shapes
- ✅ <100ms sync latency
- ✅ 5+ concurrent users without issues
- ⏳ <2s AI response for simple commands
- ⏳ <5s AI response for complex commands
- ⏳ 95%+ AI success rate on valid commands

### User Experience Success
- ✅ Smooth, intuitive shape creation
- ✅ No visible lag during collaboration
- ✅ Clear visual feedback for all actions
- ⏳ AI commands feel natural and powerful
- ⏳ Error messages are helpful
- ⏳ First-time users can use AI without training

### Project Success
- ✅ MVP deployed and functional
- ⏳ All required shape types implemented
- ⏳ AI agent fully functional with 6+ command types
- ⏳ Demo video showcasing AI capabilities
- ⏳ AI Development Log documenting process
- ⏳ Final deployment stable and accessible

## What Makes This Special

Unlike typical collaborative canvases, CollabCanvas is **AI-native**:

1. **Canvas API as Interface**: Every operation is designed to be AI-callable
2. **Natural Language Control**: Users can describe what they want instead of clicking
3. **Multi-Step Operations**: AI can plan and execute complex layouts
4. **Real-Time AI Sync**: AI changes broadcast to all users like manual changes
5. **Mixed Interaction**: Users can manually edit AI-generated content seamlessly

This represents the future of creative tools: **human-AI co-creation in real-time**.

