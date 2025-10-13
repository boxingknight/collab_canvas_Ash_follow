# CollabCanvas MVP - Development Task List

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── SignUp.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── Shape.jsx
│   │   │   └── RemoteCursor.jsx
│   │   ├── Presence/
│   │   │   └── UserList.jsx
│   │   └── Layout/
│   │       └── AppLayout.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useShapes.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── shapes.js
│   │   ├── cursors.js
│   │   └── presence.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── .env.local
├── .gitignore
├── package.json
├── vite.config.js (or webpack config)
└── README.md
```

---

## PR #1: Project Setup & Infrastructure ⚙️

**Branch:** `feat/project-setup`

**Goal:** Initialize React app, configure Firebase, set up deployment pipeline

### Tasks:
- [x] Initialize React project with Vite
  - **Files:** `package.json`, `vite.config.js`, `index.html`
  - **Action:** Run `npm create vite@latest collabcanvas -- --template react`
  
- [x] Install core dependencies
  - **Files:** `package.json`
  - **Action:** Install react, react-dom, react-konva, konva, firebase
  
- [x] Create Firebase project in console
  - **Action:** Create project, enable Firestore, enable Authentication
  
- [x] Configure Firebase in app
  - **Files:** `src/services/firebase.js`, `.env.local`, `.gitignore`
  - **Action:** Add Firebase config, initialize Firebase app
  
- [x] Set up basic project structure
  - **Files:** Create all directories listed in file structure
  - **Action:** Create empty folders and placeholder files
  
- [x] Create constants file
  - **Files:** `src/utils/constants.js`
  - **Action:** Define canvas dimensions, colors, performance targets
  
- [x] Initialize Git repository
  - **Files:** `.gitignore`, `README.md`
  - **Action:** Create repo, add .env to gitignore, write basic README
  
- [x] Set up Vercel deployment
  - **Action:** Connect GitHub repo to Vercel, configure build settings
  
- [x] Test deployment pipeline
  - **Action:** Push to main, verify app deploys successfully

**Acceptance Criteria:**
- ✅ App loads on localhost
- ✅ Firebase connection successful (no errors in console)
- ✅ App deploys to public URL
- ✅ Environment variables work in production

---

## PR #2: Authentication System 🔐

**Branch:** `feat/authentication`

**Goal:** Implement user login/signup with Firebase Auth

### Tasks:
- [ ] Set up Firebase Authentication service
  - **Files:** `src/services/auth.js`
  - **Action:** Create login, signup, logout, getCurrentUser functions
  
- [ ] Create authentication hook
  - **Files:** `src/hooks/useAuth.js`
  - **Action:** Hook to manage auth state, listen to auth changes
  
- [ ] Build Login component
  - **Files:** `src/components/Auth/Login.jsx`
  - **Action:** Email/password form, error handling, loading states
  
- [ ] Build SignUp component
  - **Files:** `src/components/Auth/SignUp.jsx`
  - **Action:** Registration form with display name, validation
  
- [ ] Create protected route logic
  - **Files:** `src/App.jsx`
  - **Action:** Redirect unauthenticated users to login
  
- [ ] Add auth state persistence
  - **Files:** `src/services/firebase.js`
  - **Action:** Configure Firebase persistence settings
  
- [ ] Style auth components
  - **Files:** `src/index.css`, `Login.jsx`, `SignUp.jsx`
  - **Action:** Basic styling for forms, center layout
  
- [ ] Test authentication flow
  - **Action:** Create account, logout, login, refresh page

**Acceptance Criteria:**
- ✅ Users can create accounts with email/password + display name
- ✅ Users can login with credentials
- ✅ Users can logout
- ✅ Auth state persists across page refreshes
- ✅ Unauthenticated users redirected to login

---

## PR #3: Basic Canvas with Pan/Zoom 🎨

**Branch:** `feat/canvas-foundation`

**Goal:** Create working Konva canvas with smooth pan and zoom

### Tasks:
- [ ] Create Canvas component structure
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Set up Konva Stage and Layer components
  
- [ ] Implement pan functionality
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Handle drag on stage for panning
  
- [ ] Implement zoom functionality
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Handle wheel event for zoom, constrain zoom limits
  
- [ ] Create canvas hook for state management
  - **Files:** `src/hooks/useCanvas.js`
  - **Action:** Manage viewport state (position, scale)
  
- [ ] Set up canvas dimensions and workspace
  - **Files:** `src/utils/constants.js`, `src/components/Canvas/Canvas.jsx`
  - **Action:** Define large canvas size (e.g., 5000x5000)
  
- [ ] Add canvas styling and layout
  - **Files:** `src/components/Layout/AppLayout.jsx`, `src/index.css`
  - **Action:** Full-screen canvas, remove default margins
  
- [ ] Implement FPS monitoring (dev mode)
  - **Files:** `src/utils/helpers.js`, `src/components/Canvas/Canvas.jsx`
  - **Action:** Add FPS counter to verify 60fps performance
  
- [ ] Test performance
  - **Action:** Test pan/zoom smoothness, verify 60fps

**Acceptance Criteria:**
- ✅ Canvas fills viewport
- ✅ Can pan by dragging
- ✅ Can zoom with mouse wheel
- ✅ Maintains 60 FPS during interactions
- ✅ Zoom constrained to reasonable limits (e.g., 0.1x to 5x)

---

## PR #4: Shape Creation & Local Manipulation 🔲

**Branch:** `feat/shape-creation`

**Goal:** Create and move rectangles locally (no sync yet)

### Tasks:
- [ ] Create Shape component
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Konva Rect component with props for position, size, color
  
- [ ] Implement shape creation on canvas
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Click-and-drag to create rectangle with size
  
- [ ] Add local shape state management
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** useState to manage array of shapes with IDs
  
- [ ] Implement shape selection
  - **Files:** `src/components/Canvas/Shape.jsx`, `src/hooks/useShapes.js`
  - **Action:** Click to select, visual indicator (border/highlight)
  
- [ ] Implement shape dragging
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Drag selected shape to move, update position
  
- [ ] Add shape ID generation
  - **Files:** `src/utils/helpers.js`
  - **Action:** UUID or timestamp-based unique IDs
  
- [ ] Handle deselection
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Click on empty canvas to deselect
  
- [ ] Test shape interactions
  - **Action:** Create multiple shapes, select, move, deselect

**Acceptance Criteria:**
- ✅ Can create rectangles by click-dragging
- ✅ Shapes have unique IDs
- ✅ Can select shapes by clicking
- ✅ Can move selected shapes by dragging
- ✅ Visual feedback for selected state
- ✅ Can deselect by clicking empty space

---

## PR #5: Firestore Schema & Shape Persistence 💾

**Branch:** `feat/shape-persistence`

**Goal:** Save shapes to Firestore and load on mount

### Tasks:
- [ ] Design Firestore schema for shapes
  - **Files:** `README.md` (document schema)
  - **Action:** Define structure: shapes collection with id, x, y, width, height, color, createdBy, createdAt
  
- [ ] Create shapes service
  - **Files:** `src/services/shapes.js`
  - **Action:** Functions for addShape, updateShape, deleteShape, subscribeToShapes
  
- [ ] Set up Firestore security rules
  - **Action:** In Firebase Console, set read/write rules for authenticated users
  
- [ ] Integrate shape creation with Firestore
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** On local shape creation, write to Firestore
  
- [ ] Integrate shape updates with Firestore
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** On shape move, update Firestore document
  
- [ ] Load existing shapes on mount
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Query Firestore on component mount, load into state
  
- [ ] Add timestamp to shapes
  - **Files:** `src/services/shapes.js`
  - **Action:** Use Firebase serverTimestamp for conflict resolution
  
- [ ] Test persistence
  - **Action:** Create shapes, refresh page, verify shapes persist

**Acceptance Criteria:**
- ✅ Shapes saved to Firestore when created
- ✅ Shape positions updated in Firestore when moved
- ✅ Shapes load from Firestore on page load
- ✅ State persists after page refresh
- ✅ Security rules prevent unauthorized access

---

## PR #6: Real-Time Shape Synchronization 🔄

**Branch:** `feat/realtime-sync`

**Goal:** Shapes sync in real-time across multiple users

### Tasks:
- [ ] Set up Firestore real-time listener
  - **Files:** `src/services/shapes.js`
  - **Action:** Use onSnapshot to listen for collection changes
  
- [ ] Integrate listener with shapes hook
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Subscribe to shape changes, update local state
  
- [ ] Handle shape addition from other users
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Add new shapes to local state when Firestore changes
  
- [ ] Handle shape updates from other users
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Update existing shapes when Firestore changes
  
- [ ] Handle shape deletion from other users
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Remove shapes when deleted in Firestore
  
- [ ] Prevent feedback loops
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Don't update Firestore on listener callbacks
  
- [ ] Implement "last write wins" conflict resolution
  - **Files:** `src/services/shapes.js`
  - **Action:** Use Firestore timestamps to resolve conflicts
  
- [ ] Add cleanup on unmount
  - **Files:** `src/hooks/useShapes.js`
  - **Action:** Unsubscribe from listener when component unmounts
  
- [ ] Test with multiple browsers
  - **Action:** Open 2+ browser windows, create/move shapes, verify sync

**Acceptance Criteria:**
- ✅ Shape created in Browser A appears in Browser B immediately
- ✅ Shape moved in Browser A updates in Browser B within 100ms
- ✅ Multiple users can create shapes simultaneously without conflicts
- ✅ No duplicate shapes or ghost objects
- ✅ Sync works reliably with 3+ users

---

## PR #7: Multiplayer Cursors 👆

**Branch:** `feat/multiplayer-cursors`

**Goal:** Show real-time cursor positions for all users

### Tasks:
- [ ] Design Firestore schema for cursors
  - **Files:** `README.md` (document schema)
  - **Action:** Define structure: cursors collection with userId, x, y, userName, timestamp
  
- [ ] Create cursors service
  - **Files:** `src/services/cursors.js`
  - **Action:** Functions for updateCursorPosition, subscribeToCursors
  
- [ ] Create RemoteCursor component
  - **Files:** `src/components/Canvas/RemoteCursor.jsx`
  - **Action:** Render cursor icon with user name label
  
- [ ] Create cursors hook
  - **Files:** `src/hooks/useCursors.js`
  - **Action:** Manage cursor state, throttle updates
  
- [ ] Track local mouse position
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Listen to mousemove, convert to canvas coordinates
  
- [ ] Throttle cursor updates
  - **Files:** `src/hooks/useCursors.js`, `src/utils/helpers.js`
  - **Action:** Throttle updates to every 50ms
  
- [ ] Send cursor position to Firestore
  - **Files:** `src/hooks/useCursors.js`
  - **Action:** Update Firestore document with current position
  
- [ ] Subscribe to other users' cursors
  - **Files:** `src/hooks/useCursors.js`
  - **Action:** Listen to cursors collection, filter out own cursor
  
- [ ] Render remote cursors on canvas
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Map over cursors, render RemoteCursor components
  
- [ ] Style cursor labels
  - **Files:** `src/components/Canvas/RemoteCursor.jsx`
  - **Action:** Position name label near cursor, add background
  
- [ ] Handle cursor cleanup
  - **Files:** `src/hooks/useCursors.js`
  - **Action:** Remove cursor from Firestore on user disconnect
  
- [ ] Test cursor sync
  - **Action:** Move mouse in one browser, verify appears in another

**Acceptance Criteria:**
- ✅ Can see other users' cursors moving in real-time
- ✅ User names displayed next to cursors
- ✅ Cursor updates within 50ms
- ✅ Own cursor not duplicated
- ✅ Cursors removed when users disconnect
- ✅ Smooth cursor movement (no stuttering)

---

## PR #8: Presence System 👥

**Branch:** `feat/presence-system`

**Goal:** Show list of currently online users

### Tasks:
- [ ] Design Firestore schema for presence
  - **Files:** `README.md` (document schema)
  - **Action:** Define structure: presence collection with userId, userName, status, lastSeen
  
- [ ] Create presence service
  - **Files:** `src/services/presence.js`
  - **Action:** Functions for setOnline, setOffline, subscribeToPresence
  
- [ ] Create UserList component
  - **Files:** `src/components/Presence/UserList.jsx`
  - **Action:** Display list of online users with status indicators
  
- [ ] Create presence hook
  - **Files:** `src/hooks/usePresence.js`
  - **Action:** Manage online users state
  
- [ ] Set user online on mount
  - **Files:** `src/hooks/usePresence.js`
  - **Action:** Write to presence collection when user logs in
  
- [ ] Use Firebase onDisconnect
  - **Files:** `src/services/presence.js`
  - **Action:** Automatically set offline when user disconnects
  
- [ ] Subscribe to presence updates
  - **Files:** `src/hooks/usePresence.js`
  - **Action:** Listen to presence collection changes
  
- [ ] Handle user join events
  - **Files:** `src/hooks/usePresence.js`
  - **Action:** Add users to online list when they join
  
- [ ] Handle user leave events
  - **Files:** `src/hooks/usePresence.js`
  - **Action:** Remove users from online list when they leave
  
- [ ] Add UserList to layout
  - **Files:** `src/components/Layout/AppLayout.jsx`
  - **Action:** Position UserList in corner or sidebar
  
- [ ] Style presence UI
  - **Files:** `src/components/Presence/UserList.jsx`, `src/index.css`
  - **Action:** Style user list, add online indicators (green dot)
  
- [ ] Test presence system
  - **Action:** Open multiple browsers, verify users appear/disappear

**Acceptance Criteria:**
- ✅ List shows all currently connected users
- ✅ Users appear immediately when they join
- ✅ Users removed immediately when they disconnect
- ✅ Own user shown in list
- ✅ Clean UI that doesn't obstruct canvas

---

## PR #9: Performance Optimization & Testing ⚡

**Branch:** `feat/performance-polish`

**Goal:** Optimize for 60 FPS and stress test with multiple users

### Tasks:
- [ ] Implement Konva layer caching
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Cache static layers to improve render performance
  
- [ ] Optimize shape rendering
  - **Files:** `src/components/Canvas/Shape.jsx`
  - **Action:** Use React.memo to prevent unnecessary re-renders
  
- [ ] Add debouncing to Firestore writes
  - **Files:** `src/hooks/useShapes.js`, `src/utils/helpers.js`
  - **Action:** Debounce shape position updates during drag
  
- [ ] Optimize cursor update throttling
  - **Files:** `src/hooks/useCursors.js`
  - **Action:** Fine-tune throttle interval for best balance
  
- [ ] Test with 100+ shapes
  - **Action:** Create many shapes, verify FPS stays at 60
  
- [ ] Test with 5+ concurrent users
  - **Action:** Open 5 browsers, interact simultaneously
  
- [ ] Load test Firestore queries
  - **Action:** Verify read/write limits not exceeded
  
- [ ] Add error boundaries
  - **Files:** `src/App.jsx`, `src/components/ErrorBoundary.jsx`
  - **Action:** Catch React errors, display fallback UI
  
- [ ] Add loading states
  - **Files:** `src/components/Canvas/Canvas.jsx`
  - **Action:** Show spinner while shapes load
  
- [ ] Test disconnection scenarios
  - **Action:** Test with network throttling, verify reconnection
  
- [ ] Measure sync latency
  - **Action:** Use timestamps to verify <100ms object sync
  
- [ ] Cross-browser testing
  - **Action:** Test in Chrome, Firefox, Safari

**Acceptance Criteria:**
- ✅ 60 FPS maintained during all interactions
- ✅ Works smoothly with 500+ shapes
- ✅ 5+ users can collaborate without degradation
- ✅ Object sync under 100ms
- ✅ Cursor sync under 50ms
- ✅ Graceful error handling
- ✅ Works in multiple browsers

---

## PR #10: Final Polish & Deployment 🚀

**Branch:** `feat/final-polish`

**Goal:** UI polish, documentation, final deployment

### Tasks:
- [ ] Add logout button
  - **Files:** `src/components/Layout/AppLayout.jsx`
  - **Action:** Button in header/corner to logout
  
- [ ] Improve auth form styling
  - **Files:** `src/components/Auth/Login.jsx`, `src/components/Auth/SignUp.jsx`
  - **Action:** Better spacing, colors, error messages
  
- [ ] Add keyboard shortcuts documentation
  - **Files:** `README.md`
  - **Action:** Document pan/zoom controls
  
- [ ] Write comprehensive README
  - **Files:** `README.md`
  - **Action:** Setup instructions, architecture overview, deployment link
  
- [ ] Add environment variables documentation
  - **Files:** `README.md`, `.env.example`
  - **Action:** Document required Firebase config
  
- [ ] Clean up console logs
  - **Files:** All component files
  - **Action:** Remove debug logs, keep only critical errors
  
- [ ] Add proper error messages
  - **Files:** All service files
  - **Action:** User-friendly error messages for common issues
  
- [ ] Final Firestore security rules review
  - **Action:** Verify all operations properly secured
  
- [ ] Production deployment
  - **Action:** Push to main, verify Vercel deployment
  
- [ ] Smoke test production
  - **Action:** Full test of all features on production URL
  
- [ ] Share deployment link
  - **Action:** Ensure public URL is accessible

**Acceptance Criteria:**
- ✅ Clean, polished UI
- ✅ Comprehensive README with setup instructions
- ✅ All features working in production
- ✅ No console errors in production
- ✅ Public URL accessible to anyone
- ✅ 5+ users can connect and collaborate

---

## Testing Checklist (Run Before Final Submission)

### Multi-User Testing:
- [ ] Open app in 3+ different browsers (Chrome, Firefox, Safari)
- [ ] Login with different accounts
- [ ] Each user creates multiple shapes
- [ ] Each user moves shapes simultaneously
- [ ] Verify all users see same state

### Persistence Testing:
- [ ] Create several shapes
- [ ] Close all browser windows
- [ ] Reopen app
- [ ] Verify all shapes still present

### Performance Testing:
- [ ] Create 100+ shapes
- [ ] Pan and zoom rapidly
- [ ] Verify 60 FPS maintained (check FPS counter)
- [ ] Move shapes quickly
- [ ] Verify no lag or stuttering

### Stress Testing:
- [ ] 5 users online simultaneously
- [ ] All users creating and moving shapes
- [ ] Verify sync stays under 100ms
- [ ] Check for memory leaks (long session)

### Edge Cases:
- [ ] User refreshes mid-drag
- [ ] Multiple users move same shape
- [ ] User disconnects suddenly
- [ ] Very slow network connection
- [ ] User creates 1000+ shapes

---
