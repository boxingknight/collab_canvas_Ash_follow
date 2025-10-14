# System Patterns & Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     UI       │  │   Canvas     │  │   AI Chat    │  │
│  │  Components  │  │   (Konva)    │  │  Interface   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Custom Hooks Layer                     │  │
│  │  useShapes │ useCursors │ usePresence │ useAI   │  │
│  └──────────────────────────────────────────────────┘  │
│         │                  │                  │          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Services Layer                         │  │
│  │  shapes │ cursors │ presence │ ai │ canvasAPI   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Firebase Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Firestore  │  │   Realtime   │  │    Auth      │  │
│  │   (shapes)   │  │   Database   │  │ (users)      │  │
│  │              │  │   (cursors)  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              External AI Service                         │
│            (OpenAI GPT-4 or Anthropic)                  │
└─────────────────────────────────────────────────────────┘
```

## Core Design Patterns

### 1. Layer Separation Pattern

**Components → Hooks → Services → Firebase**

- **Components**: Pure UI, minimal logic, receive data via props/hooks
- **Hooks**: State management, side effects, business logic
- **Services**: Firebase operations, API calls, data transformations
- **Firebase**: Backend persistence and real-time sync

**Benefits:**
- Clear separation of concerns
- Easier testing (mock services layer)
- Reusable business logic
- AI and manual operations use same services

### 2. Real-Time Sync Pattern

**Firestore onSnapshot Listeners**

```javascript
// In service layer
export function subscribeToShapes(canvasId, callback) {
  return onSnapshot(
    collection(db, 'shapes'),
    (snapshot) => {
      const shapes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(shapes);
    }
  );
}

// In hook layer
useEffect(() => {
  const unsubscribe = subscribeToShapes('global-canvas-v1', (shapes) => {
    setShapes(shapes);
  });
  return unsubscribe; // Cleanup on unmount
}, []);
```

**Key Decisions:**
- Use Firestore for shapes (persistent, queryable)
- Use Realtime Database for cursors (lower latency, ephemeral)
- Listeners auto-update React state
- Cleanup listeners on component unmount

### 3. Optimistic Updates Pattern

**Immediate UI Update + Background Persistence**

```javascript
// Pattern: Update local state immediately, then persist
async function moveShape(shapeId, newX, newY) {
  // 1. Optimistic update
  setShapes(prevShapes => 
    prevShapes.map(s => 
      s.id === shapeId ? {...s, x: newX, y: newY} : s
    )
  );
  
  // 2. Background persistence (debounced)
  debouncedFirestoreWrite(shapeId, { x: newX, y: newY });
}
```

**Benefits:**
- Instant UI feedback (60 FPS maintained)
- Reduced Firestore writes (cost savings)
- Smooth user experience
- Handles temporary network issues

### 4. Locking Pattern for Conflict Resolution

**First-to-Drag Wins**

```javascript
// When user starts dragging
async function lockShape(shapeId, userId) {
  await updateDoc(doc(db, 'shapes', shapeId), {
    lockedBy: userId,
    lockedAt: serverTimestamp()
  });
}

// Auto-release after drag completes or 30s timeout
async function unlockShape(shapeId) {
  await updateDoc(doc(db, 'shapes', shapeId), {
    lockedBy: null,
    lockedAt: null
  });
}
```

**Rules:**
- User can only drag unlocked shapes or shapes they locked
- Locks auto-expire after 30 seconds (cleanup stale locks)
- Visual indicator shows who has locked a shape
- Prevents simultaneous edits and conflicts

### 5. Canvas API Wrapper Pattern (For AI)

**Unified Interface for All Operations**

```javascript
// canvasAPI.js - Single source of truth
export const canvasAPI = {
  // Creation
  async createRectangle(x, y, width, height, color) {
    const shape = {
      type: 'rectangle',
      x, y, width, height, color,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    };
    return await addDoc(collection(db, 'shapes'), shape);
  },
  
  // Manipulation
  async moveShape(shapeId, x, y) { /* ... */ },
  async resizeShape(shapeId, width, height) { /* ... */ },
  
  // Queries
  async getCanvasState() {
    const snapshot = await getDocs(collection(db, 'shapes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Used by both manual interactions and AI
// Manual: User drags → Hook calls canvasAPI.moveShape()
// AI: AI decides → Function calls canvasAPI.moveShape()
```

**Benefits:**
- Both manual and AI use same code path
- Consistent validation and error handling
- Easy to test and mock
- Single place to add features

### 6. AI Function Calling Pattern

**Schema → Registry → Execution**

```javascript
// 1. Define schema for OpenAI
const functionSchemas = [
  {
    name: 'createRectangle',
    description: 'Creates a rectangle on the canvas',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X position' },
        y: { type: 'number', description: 'Y position' },
        width: { type: 'number', description: 'Width in pixels' },
        height: { type: 'number', description: 'Height in pixels' },
        color: { type: 'string', description: 'Hex color code' }
      },
      required: ['x', 'y', 'width', 'height', 'color']
    }
  }
];

// 2. Registry maps function names to implementations
const functionRegistry = {
  'createRectangle': canvasAPI.createRectangle,
  'moveShape': canvasAPI.moveShape,
  // ... etc
};

// 3. Execution flow
async function handleAIMessage(userMessage) {
  // Send to OpenAI with function schemas
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: userMessage }],
    functions: functionSchemas
  });
  
  // Execute function call
  if (response.function_call) {
    const functionName = response.function_call.name;
    const args = JSON.parse(response.function_call.arguments);
    const result = await functionRegistry[functionName](...Object.values(args));
    return result;
  }
}
```

### 7. Component Memoization Pattern

**Prevent Unnecessary Re-renders**

```javascript
// Shape component with React.memo
export const Shape = React.memo(({ shape, isSelected, onSelect, onDragEnd }) => {
  return (
    <Rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.color}
      // ... other props
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these change
  return (
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.color === nextProps.shape.color &&
    prevProps.isSelected === nextProps.isSelected
  );
});
```

**Benefits:**
- Maintains 60 FPS with hundreds of shapes
- Only re-renders shapes that actually changed
- Prevents cascade re-renders

### 8. Debouncing Pattern for Firestore Writes

**Batch Rapid Updates**

```javascript
// Debounce Firestore writes during drag
const debouncedUpdate = useCallback(
  debounce((shapeId, updates) => {
    updateDoc(doc(db, 'shapes', shapeId), updates);
  }, 300),
  []
);

// During drag: update local state every frame
function onDragMove(e) {
  const newX = e.target.x();
  const newY = e.target.y();
  
  // Optimistic local update (immediate)
  setShapes(prev => /* ... */);
  
  // Debounced Firestore write (every 300ms max)
  debouncedUpdate(shapeId, { x: newX, y: newY });
}

// On drag end: immediate write
function onDragEnd(e) {
  debouncedUpdate.cancel(); // Cancel pending
  updateDoc(doc(db, 'shapes', shapeId), { 
    x: e.target.x(), 
    y: e.target.y() 
  }); // Immediate write
}
```

**Benefits:**
- Reduces Firestore writes from 60/sec to ~3/sec during drag
- Saves costs
- Still feels instant to user
- Immediate write on drag end ensures consistency

## Key Technical Decisions

### Decision 1: Firestore + Realtime Database Hybrid

**Why:**
- Firestore: Better for persistent data (shapes), queryable, structured
- Realtime Database: Lower latency for ephemeral data (cursors, presence)

**Trade-offs:**
- Added complexity (two databases)
- But better performance where it matters

### Decision 2: Single Global Canvas (MVP)

**Why:**
- Simpler to build and test
- Focus on collaboration, not project management
- Easier to demonstrate

**Trade-offs:**
- Not scalable to production (everyone shares one canvas)
- Future: Add multi-project support

### Decision 3: Last-Write-Wins + Locking

**Why:**
- CRDTs and OT are too complex for 7-day sprint
- Locking prevents most conflicts
- Last-write-wins is acceptable for remaining cases

**Trade-offs:**
- Occasional data loss if multiple users edit simultaneously
- But good enough for MVP

### Decision 4: React + Konva for Canvas

**Why:**
- Konva provides high-performance 2D canvas rendering
- Integrates well with React
- Built-in transformer handles
- Better than raw HTML5 Canvas for interactive shapes

**Trade-offs:**
- Extra dependency
- Learning curve
- But worth it for features and performance

### Decision 5: AI-First Design

**Why:**
- AI agent is the key differentiator
- Designing Canvas API early ensures consistency
- Both manual and AI use same code paths

**Trade-offs:**
- More upfront design work
- But pays off in maintainability and AI integration

## Component Relationships

### Data Flow Diagram

```
User Action (Click/Drag)
  ↓
Canvas Component (Konva event)
  ↓
Custom Hook (useShapes)
  ↓
Service Function (shapes.updateShape)
  ↓
Firestore (updateDoc)
  ↓
Firestore Listener (onSnapshot)
  ↓
Custom Hook (updates state)
  ↓
Canvas Component (re-renders)
  ↓
All connected clients see update
```

### Hook Dependencies

- `useAuth` - Auth state, no dependencies
- `useCanvas` - Pan/zoom state, no dependencies
- `useShapes` - Depends on `useAuth` (needs user ID)
- `useCursors` - Depends on `useAuth` (needs user ID)
- `usePresence` - Depends on `useAuth` (needs user ID)
- `useAI` - Depends on `useShapes` (needs canvas state)

## Performance Optimizations

### Current Optimizations (Implemented)
1. **React.memo on Shape components** - Prevent unnecessary re-renders
2. **Debounced Firestore writes** - Reduce write operations during drag
3. **Throttled cursor updates** - Cursor position updates at 50ms intervals
4. **Layer caching** - Konva layer caching for static content
5. **Optimistic updates** - Immediate UI, background persistence

### Future Optimizations (If Needed)
1. **Virtualization** - Only render shapes in viewport
2. **Shape batching** - Batch Firestore reads/writes
3. **Web Workers** - Offload calculations
4. **IndexedDB caching** - Cache shapes locally
5. **Firestore composite indexes** - Optimize queries

## Error Handling Patterns

### Service Layer Errors

```javascript
export async function updateShape(shapeId, updates) {
  try {
    await updateDoc(doc(db, 'shapes', shapeId), updates);
    return { success: true };
  } catch (error) {
    console.error('Failed to update shape:', error);
    return { 
      success: false, 
      error: error.message,
      userMessage: 'Failed to update shape. Please try again.'
    };
  }
}
```

### AI Function Call Errors

```javascript
export async function executeFunction(functionName, parameters) {
  // Validate function exists
  if (!functionRegistry[functionName]) {
    return {
      success: false,
      error: `Unknown function: ${functionName}`,
      userMessage: `I don't know how to ${functionName}. Try a different command.`
    };
  }
  
  // Validate parameters
  const validation = validateParameters(functionName, parameters);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      userMessage: `Invalid parameters: ${validation.userMessage}`
    };
  }
  
  // Execute
  try {
    const result = await functionRegistry[functionName](parameters);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      userMessage: 'Operation failed. Please try again.'
    };
  }
}
```

## Security Patterns

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Shapes: Authenticated users can read/write
    match /shapes/{shapeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Future: Add per-shape ownership if needed
  }
}
```

### Environment Variables

All sensitive keys stored in `.env.local`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_OPENAI_API_KEY` (for AI)

Never committed to git, loaded via Vite at build time.

## Testing Strategy

### Manual Testing (Primary for MVP)
1. Open 2+ browser windows
2. Create, move, delete shapes
3. Verify real-time sync
4. Test with network throttling
5. Test with 5+ concurrent users

### AI Testing
1. Test all 6+ command types
2. Verify real-time sync of AI changes
3. Measure response times
4. Test error handling
5. Test multi-step operations

### Performance Testing
1. Create 500+ shapes
2. Measure FPS during pan/zoom/drag
3. Measure sync latency
4. Test with 10+ concurrent users
5. Monitor Firestore usage

## Deployment Architecture

```
GitHub Repository
  ↓ (push to main)
Firebase Hosting (auto-deploy)
  ↓
Production URL: collabcanvas-xxxxx.web.app
  ↓
Users access via browser
  ↓
Connect to Firebase (Firestore, Auth)
  ↓
AI calls routed through backend (or client-side with API key)
```

**Current Setup:**
- Firebase Hosting for static files
- Firestore for data
- Firebase Auth for users
- Client-side AI calls (API key in env)

**Production Considerations:**
- Move AI API calls to backend (security)
- Add rate limiting
- Monitor costs
- Add error tracking (Sentry, etc.)

