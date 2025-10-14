# Technical Context

## Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **Vite 7.1.7** - Build tool and dev server
- **Konva 10.0.2** - 2D canvas library for shape rendering
- **React-Konva 19.0.10** - React bindings for Konva
- **JavaScript (ES6+)** - Primary language (no TypeScript in this project)

### Backend / Services
- **Firebase 12.4.0** - Backend as a Service
  - **Firestore** - Document database for shapes (persistent data)
  - **Realtime Database** - For cursors and presence (ephemeral, low-latency)
  - **Firebase Authentication** - User auth (email/password + Google OAuth)
  - **Firebase Hosting** - Deployment platform

### AI Integration (To Be Added)
- **OpenAI GPT-4** (recommended) OR **Anthropic Claude** - AI service
- **Function Calling API** - For structured AI-to-canvas communication

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control
- **npm** - Package manager

### Deployment
- **Firebase Hosting** - Primary deployment (collabcanvas-xxxxx.web.app)
- **Vercel** - Alternative option (not currently used)

## Project Structure

```
collabcanvas/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx             # Login form
│   │   │   └── SignUp.jsx            # Registration form
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx            # Main canvas component (Konva Stage/Layer)
│   │   │   ├── Shape.jsx             # Individual shape renderer (Rect, Circle, etc.)
│   │   │   └── RemoteCursor.jsx      # Other users' cursors
│   │   ├── Presence/
│   │   │   └── UserList.jsx          # Online users list
│   │   ├── Layout/
│   │   │   └── AppLayout.jsx         # Main app layout with navbar
│   │   └── ErrorBoundary.jsx         # Error boundary for graceful failures
│   ├── hooks/
│   │   ├── useAuth.js                # Authentication state management
│   │   ├── useCanvas.js              # Canvas pan/zoom state
│   │   ├── useShapes.js              # Shapes CRUD + subscriptions
│   │   ├── useCursors.js             # Cursor position tracking
│   │   └── usePresence.js            # User presence (online/offline)
│   ├── services/
│   │   ├── firebase.js               # Firebase initialization
│   │   ├── auth.js                   # Auth operations (signup, login, logout)
│   │   ├── shapes.js                 # Firestore operations for shapes
│   │   ├── cursors.js                # Realtime DB operations for cursors
│   │   └── presence.js               # Realtime DB operations for presence
│   ├── utils/
│   │   ├── constants.js              # App constants (canvas size, colors, etc.)
│   │   └── helpers.js                # Utility functions (debounce, throttle, etc.)
│   ├── App.jsx                       # Root component
│   ├── App.css                       # App styles
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
├── .env.local                        # Environment variables (gitignored)
├── .gitignore
├── package.json
├── vite.config.js                    # Vite configuration
├── eslint.config.js                  # ESLint configuration
├── firebase.json                     # Firebase hosting configuration
├── firestore.indexes.json            # Firestore indexes
├── .firebaserc                       # Firebase project config
└── README.md
```

## Key Files Deep Dive

### Canvas.jsx - Main Canvas Component
- Renders Konva Stage (canvas container)
- Handles pan/zoom with camera offset
- Manages interaction modes (Pan, Move, Draw)
- Renders all shapes via Shape components
- Handles shape creation (click-drag)
- Renders remote cursors
- Manages Transformer for selected shapes

### Shape.jsx - Individual Shape Renderer
- Receives shape data as props
- Renders appropriate Konva component (Rect, Circle, etc.)
- Handles selection (click)
- Handles drag (move)
- Applies React.memo for performance
- Shows transformer handles when selected

### useShapes.js - Core Business Logic
- Subscribes to Firestore shapes collection
- Manages shapes state (array of shape objects)
- Provides CRUD operations:
  - `addShape(shapeData)`
  - `updateShape(shapeId, updates)`
  - `deleteShape(shapeId)`
  - `lockShape(shapeId, userId)`
  - `unlockShape(shapeId)`
- Implements debounced Firestore writes
- Handles shape locking for conflict resolution

### shapes.js - Firestore Service
- Direct Firestore operations
- `subscribeToShapes(callback)` - Real-time listener
- `addShapeToFirestore(shapeData)` - Create shape
- `updateShapeInFirestore(shapeId, updates)` - Update shape
- `deleteShapeFromFirestore(shapeId)` - Delete shape
- Uses Firestore SDK methods (addDoc, updateDoc, deleteDoc, onSnapshot)

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account with project created
- Git

### Environment Variables (.env.local)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# TO BE ADDED for AI integration
VITE_OPENAI_API_KEY=sk-...
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### Installation Commands
```bash
cd collabcanvas
npm install                 # Install dependencies
npm run dev                 # Start dev server (localhost:5173)
npm run build              # Production build
npm run preview            # Preview production build locally
npm run lint               # Run ESLint
```

### Firebase Configuration
1. Create Firebase project at console.firebase.google.com
2. Enable Firestore Database (test mode initially)
3. Enable Realtime Database (test mode initially)
4. Enable Authentication (Email/Password + Google)
5. Add web app to project
6. Copy config to .env.local
7. Deploy security rules (from FIRESTORE_RULES.txt)
8. Add authorized domains (localhost, production URL)

## Data Models

### Shape Document (Firestore: `shapes` collection)
```javascript
{
  id: string,                    // Firestore auto-generated
  type: 'rectangle' | 'circle',  // Shape type (will add 'line', 'text')
  x: number,                     // X position (top-left)
  y: number,                     // Y position (top-left)
  width: number,                 // Width in pixels
  height: number,                // Height in pixels (for circle, width=height=diameter)
  color: string,                 // Hex color (#RRGGBB)
  rotation: number,              // Degrees (0-359) - TO BE ADDED
  zIndex: number,                // Layer order - TO BE ADDED
  
  // Text-specific (TO BE ADDED)
  text: string,
  fontSize: number,
  fontWeight: 'normal' | 'bold',
  
  // Line-specific (TO BE ADDED)
  strokeWidth: number,
  
  // Metadata
  createdBy: string,             // User UID
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Locking for conflict resolution
  lockedBy: string | null,       // User UID or null
  lockedAt: Timestamp | null
}
```

### Cursor Document (Realtime DB: `/sessions/global-canvas-v1/{userId}`)
```javascript
{
  userId: string,
  userName: string,
  x: number,                     // Canvas X coordinate
  y: number,                     // Canvas Y coordinate  
  color: string,                 // Hex color for cursor
  updatedAt: number              // Timestamp (millis)
}
```

### Presence Document (Realtime DB: `/sessions/global-canvas-v1/{userId}`)
```javascript
{
  userId: string,
  userName: string,
  userEmail: string,
  status: 'online' | 'offline',
  lastSeen: number,              // Timestamp (millis)
  joinedAt: number               // Timestamp (millis)
}
```

Note: Cursors and presence are combined in the same Realtime DB path for efficiency.

## Performance Characteristics

### Current Performance
- **FPS**: Consistent 60 FPS with 100+ shapes
- **Shape limit tested**: 500 shapes without degradation
- **Sync latency**: <100ms for shape operations
- **Cursor latency**: <50ms (throttled to 50ms updates)
- **Initial load**: <3 seconds for empty canvas

### Firestore Usage
- **Reads**: ~1 per shape on initial load + real-time updates
- **Writes**: ~1 per shape create + debounced updates during drag
- **Cost optimization**: Debouncing reduces writes by ~95% during drag

### Realtime Database Usage
- **Cursor updates**: ~20 per second per user (throttled)
- **Presence updates**: On connect/disconnect only
- **Cost**: Minimal (ephemeral data, no persistence needed)

## Known Technical Constraints

### Current Limitations
1. **Single global canvas**: All users share one canvas (not scalable)
2. **No multi-project support**: Only one workspace exists
3. **Basic conflict resolution**: Last-write-wins + locking (not CRDT/OT)
4. **Client-side AI calls**: API keys exposed (need backend proxy for prod)
5. **No user permissions**: All users can edit everything
6. **Limited undo/redo**: Not implemented yet (stretch goal)

### Firebase Free Tier Limits
- **Firestore**: 50K reads, 20K writes per day
- **Realtime DB**: 10GB bandwidth per month
- **Hosting**: 10GB storage, 360MB/day bandwidth
- **Authentication**: Unlimited

Good enough for development and demo, may need upgrade for production.

### Browser Compatibility
- **Tested**: Chrome, Firefox, Safari (macOS)
- **Required**: Modern browser with Canvas API support
- **Mobile**: Works but not optimized (touch events need work)

## Development Workflow

### Typical Feature Development
1. **Create branch**: `git checkout -b feat/feature-name`
2. **Develop feature**: Edit code, test locally with multiple browser windows
3. **Test real-time sync**: Open 2+ browser windows, verify changes sync
4. **Test performance**: Create 100+ shapes, check FPS (dev tools)
5. **Commit**: `git commit -m "feat: description"`
6. **Push**: `git push origin feat/feature-name`
7. **Deploy**: `firebase deploy` (or merge to main for auto-deploy)

### Testing Approach
- **Manual testing**: Primary method (no automated tests yet)
- **Multi-window testing**: Always test with 2+ browsers
- **Performance profiling**: Use React DevTools, Chrome DevTools Performance tab
- **Network throttling**: Test with slow 3G to simulate real-world conditions

### Common Commands
```bash
# Development
npm run dev                      # Start dev server

# Testing multi-user
# Open localhost:5173 in multiple browser windows/profiles

# Building
npm run build                    # Create production build in dist/
npm run preview                  # Preview production build locally

# Deployment
firebase deploy                  # Deploy to Firebase Hosting
firebase deploy --only hosting   # Deploy only hosting (skip functions, rules)

# Debugging
npm run lint                     # Check for linting errors
```

## Future Technical Additions

### To Be Implemented (Next PRs)
1. **AI Service** (`src/services/ai.js`)
   - OpenAI/Anthropic integration
   - Function calling setup
   - Message history management

2. **Canvas API** (`src/services/canvasAPI.js`)
   - Unified interface for all canvas operations
   - Used by both manual and AI interactions
   - Parameter validation and error handling

3. **AI Functions** (`src/services/aiFunctions.js`)
   - Function schemas for AI
   - Function registry mapping names to implementations
   - Complex multi-step operations

4. **AI Components** (`src/components/AI/`)
   - `AIChat.jsx` - Chat interface
   - `AICommandInput.jsx` - Input field
   - `AIHistory.jsx` - Message history
   - `AIFeedback.jsx` - Loading/error states

5. **AI Hook** (`src/hooks/useAI.js`)
   - Chat state management
   - Send/receive messages
   - Execute AI function calls

### Stretch Goals (If Time)
- Properties panel (right sidebar)
- Layers panel (left sidebar)
- Copy/paste operations
- Undo/redo system
- Context menu (right-click)
- Enhanced toolbar

## Dependencies Explanation

### Core Dependencies
- **react, react-dom**: UI framework
- **firebase**: Backend services (auth, database, storage)
- **konva, react-konva**: Canvas rendering library
  - Chosen over raw Canvas API for built-in features (transformers, layers, etc.)
  - High performance with large object counts
  - Easy event handling

### Dev Dependencies
- **vite**: Fast build tool, hot module replacement
- **eslint**: Code quality and consistency
- **@vitejs/plugin-react**: Vite plugin for React support

### Why These Choices
- **React**: Most popular, easy to find help, component-based
- **Firebase**: Fastest way to set up real-time backend
- **Konva**: Best balance of performance and features for interactive canvas
- **Vite**: Much faster than Create React App, modern tooling

## Security Considerations

### Current Security
- **Firebase Auth**: Handles user authentication securely
- **Firestore Rules**: Require authentication for all operations
- **Environment Variables**: Sensitive keys not committed to git

### Security Gaps (Known)
- **API keys in client**: Firebase keys visible (acceptable for Firebase)
- **AI API keys**: Will be in client-side code (need backend proxy for prod)
- **No rate limiting**: Users could spam operations
- **No input sanitization**: Need to sanitize text input for XSS
- **No CORS restrictions**: API accessible from any origin

### Production Recommendations
1. Move AI API calls to backend (Cloud Functions)
2. Add rate limiting (Firebase App Check)
3. Sanitize user inputs
4. Add CORS restrictions
5. Implement user permissions
6. Add error tracking (Sentry)
7. Monitor usage and costs

## Debugging Tips

### Common Issues
1. **Shapes not syncing**: Check Firestore rules, verify authentication
2. **Cursor lag**: Check throttle settings (should be ~50ms)
3. **Performance issues**: Profile with React DevTools, check React.memo usage
4. **Firestore permission denied**: User not authenticated or rules incorrect
5. **Build errors**: Check Node version (need 18+), clear node_modules and reinstall

### Debugging Tools
- **React DevTools**: Component hierarchy, props, state
- **Chrome DevTools Performance**: FPS, render times
- **Chrome DevTools Network**: Firestore requests, API calls
- **Firebase Console**: View Firestore data, check usage, view logs
- **Console logs**: Extensive logging in dev mode

### Performance Debugging
```javascript
// Add to helpers.js
export function measureFPS() {
  let lastTime = performance.now();
  let frames = 0;
  
  function loop() {
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
      console.log(`FPS: ${frames}`);
      frames = 0;
      lastTime = currentTime;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// Call in Canvas component during development
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    measureFPS();
  }
}, []);
```

