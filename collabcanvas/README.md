# 🎨 CollabCanvas - Real-Time Collaborative Canvas

CollabCanvas is a real-time collaborative drawing application that allows multiple users to create, move, and interact with shapes on an infinite canvas. Built with React, Konva, and Firebase, it features real-time synchronization, multiplayer cursors, and presence awareness.

## ✨ Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Infinite Canvas**: Large 5000x5000px workspace with smooth pan and zoom
- **Complete Shape Library**: Rectangles, circles, lines, and text shapes
- **Advanced Selection**: Single-select, multi-select (shift-click), and marquee selection (drag-to-select)
- **Shape Transformations**: Move, resize, rotate, and delete shapes with intuitive controls
- **Text Editing**: Double-click to edit text inline with auto-resize and formatting
- **Line Tools**: Draggable endpoint anchors for precise line positioning
- **Selection-First Interaction**: Professional click-to-select, then drag-to-move pattern (like Figma/Sketch)
- **Multiplayer Cursors**: See other users' cursor positions in real-time with names
- **User Presence**: View list of currently online collaborators with avatars

### Performance
- **60 FPS**: Maintains smooth performance with 500+ shapes
- **Optimized Rendering**: Layer caching and React.memo optimizations
- **Debounced Writes**: Efficient Firestore usage with debounced updates
- **Throttled Cursors**: 50ms throttle for smooth cursor movement

### User Experience
- **Three Interaction Modes**:
  - **Pan Mode (V)**: Drag canvas to navigate, scroll to zoom
  - **Move Mode (M)**: Select, move, resize, and rotate shapes
  - **Draw Mode (D)**: Create rectangles, circles, lines, or text shapes
- **Rich Keyboard Shortcuts**: Mode switching, selection, deletion, and more
- **Visual Feedback**: Multi-colored selection borders, transformer handles with rotation, snap guides, and selection counts
- **Smart Drag Detection**: 3px threshold prevents accidental drags on click
- **Group Operations**: Move and delete multiple shapes simultaneously
- **Rotation Snapping**: Shapes snap to 45° increments for precise alignment
- **Dark Theme**: Eye-friendly dark interface

## 🚀 Live Demo

**Production URL**: [Your Vercel URL here]

Test with multiple browser windows to see real-time collaboration in action!

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Canvas**: Konva.js + React-Konva
- **Backend**: Firebase (Firestore + Authentication)
- **Deployment**: Vercel
- **Styling**: CSS3 with modern dark theme

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account ([Create one here](https://console.firebase.google.com/))
- Vercel account for deployment (optional)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd collabcanvas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Enable **Email/Password Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
4. Create **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in **test mode** (we'll add rules later)
   - Choose a region close to your users

#### Get Firebase Credentials
1. In Firebase Console, go to Project Settings > General
2. Scroll to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register your app (nickname: "CollabCanvas")
5. Copy the Firebase configuration object

#### Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

#### Set Up Firestore Security Rules

1. Go to Firestore Database > Rules
2. Copy the rules from `FIRESTORE_RULES_SIMPLE.txt` or `FIRESTORE_RULES.txt`
3. Paste into the Firebase Console and publish

**Important**: The rules ensure:
- Only authenticated users can read/write
- Users can only modify their own cursors and presence
- All users can modify shapes (collaborative editing)

#### Configure Authorized Domains

1. Go to Authentication > Settings > Authorized domains
2. Add your development domain: `localhost`
3. Add your production domain: `your-app.vercel.app`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Test Multi-User Collaboration

1. Open the app in multiple browser windows (or incognito mode)
2. Create different accounts in each window
3. Create and move shapes - you'll see real-time synchronization!

## 🎮 How to Use

### Getting Started
1. **Sign Up**: Create an account with email, password, and display name
2. **Login**: Sign in with your credentials
3. **Start Drawing**: Use the mode buttons or keyboard shortcuts

### Interaction Modes

#### Pan Mode (Press V)
- **Drag canvas**: Click and drag anywhere to pan
- **Zoom**: Use mouse wheel to zoom in/out
- **Click shapes**: Selects shape and auto-switches to Move Mode

#### Move Mode (Press M)
- **Select shapes**: Click on a shape to select it (shows blue border and transformer handles)
- **Multi-select**: Shift+click to add/remove shapes, or drag a marquee box to select multiple
- **Drag shapes**: Click and drag selected shapes to move them (groups move together)
- **Resize shapes**: Drag transformer corner handles to resize
- **Rotate shapes**: Drag rotation handle at top (snaps to 45° increments)
- **Edit text**: Double-click text shapes to edit inline
- **Edit lines**: Drag colored circle endpoints to adjust line position
- Selection-first pattern: must select before dragging (prevents accidental moves)
- Canvas does NOT pan in this mode

#### Draw Mode (Press D)
- **Choose shape type**: Select from rectangle 🔲, circle ⚪, line ➖, or text 📝
- **Create shapes**: Click and drag on empty space to create shapes
- **Rectangle**: Drag to create rectangular shapes with any aspect ratio
- **Circle**: Drag to create perfect circular shapes
- **Line**: Click-drag from start point to end point, edit endpoints after creation
- **Text**: Click to place, type text, double-click to edit later
- Random colors assigned automatically
- Canvas does NOT pan in this mode

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Switch to Pan Mode |
| `M` | Switch to Move Mode |
| `D` | Switch to Draw Mode |
| `Esc` | Return to Pan Mode + Deselect all shapes |
| `Delete` / `Backspace` | Delete selected shape(s) |
| `Shift + Click` | Add/remove shapes from selection |
| `Cmd/Ctrl + A` | Select all shapes |
| Double-click text | Edit text inline |

### Multiplayer Features

- **See Other Cursors**: Colored cursors show where other users are pointing
- **User Names**: Each cursor displays the user's name
- **Online List**: Click the user list in bottom-right to see who's online
- **Shape Counter**: Top-right shows total number of shapes

## 🚢 Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Connect to Vercel**:
   - Push code to GitHub
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Add Environment Variables**:
   - In Vercel project settings > Environment Variables
   - Add all `VITE_FIREBASE_*` variables from your `.env.local`
   - Apply to Production, Preview, and Development

4. **Deploy**:
   ```bash
   git push origin main
   ```
   Vercel will automatically deploy on each push to main branch

5. **Update Firebase Authorized Domains**:
   - Add your `*.vercel.app` domain to Firebase Authentication > Authorized domains

### Manual Deployment

```bash
npm run build
vercel --prod
```

## 📁 Project Structure

```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Auth/              # Login and SignUp forms
│   │   ├── Canvas/            # Main canvas component and shapes
│   │   ├── Presence/          # Online users list
│   │   └── Layout/            # App layout with header
│   ├── hooks/
│   │   ├── useAuth.js         # Authentication state management
│   │   ├── useCanvas.js       # Canvas viewport (pan/zoom)
│   │   ├── useShapes.js       # Shape CRUD operations
│   │   ├── useCursors.js      # Multiplayer cursors
│   │   └── usePresence.js     # User presence tracking
│   ├── services/
│   │   ├── firebase.js        # Firebase initialization
│   │   ├── auth.js            # Authentication service
│   │   ├── shapes.js          # Firestore shapes operations
│   │   ├── cursors.js         # Firestore cursors operations
│   │   └── presence.js        # Firestore presence operations
│   ├── utils/
│   │   ├── constants.js       # App constants (canvas size, colors)
│   │   └── helpers.js         # Utility functions (throttle, debounce, FPS)
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── .env.example               # Environment variables template
├── .env.local                 # Your local environment variables (gitignored)
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── README.md                  # This file
```

## 🏗️ Architecture

### State Management
- **Local State**: React hooks (useState, useRef)
- **Custom Hooks**: Encapsulate Firebase operations and business logic
- **Real-time Sync**: Firestore listeners update React state automatically

### Data Flow
1. User action → Custom hook → Service function → Firestore
2. Firestore listener → Custom hook → React state → UI update
3. Optimistic updates for immediate UI feedback
4. Debounced writes to reduce Firestore operations

### Performance Optimizations
- **Layer Caching**: Static grid cached, only dynamic content re-renders
- **React.memo**: Shape components memoized to prevent unnecessary renders
- **Debounced Writes**: Shape updates debounced by 300ms during drag
- **Throttled Cursors**: Cursor updates throttled to 50ms intervals
- **Optimistic Updates**: Immediate UI feedback before Firestore confirmation

## 🔒 Security

- **Authentication Required**: All Firestore operations require valid Firebase Auth
- **Security Rules**: Firestore rules enforce read/write permissions
- **Environment Variables**: Sensitive config stored in environment variables
- **No API Keys in Code**: Firebase config loaded from `.env.local`

## 🐛 Troubleshooting

### "Permission denied" errors
- Verify Firestore rules are published
- Check user is authenticated (console should show user object)
- Verify domain is in Firebase Authorized domains

### Shapes not syncing
- Check browser console for Firestore errors
- Verify Firebase configuration in `.env.local`
- Check network tab for failed Firestore requests

### App not loading
- Clear browser cache and reload
- Check console for JavaScript errors
- Verify all dependencies installed (`npm install`)

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version (`node -v` should be 18+)

## 📊 Firestore Collections

### shapes
```javascript
{
  id: "auto-generated",
  x: 100,              // X position (top-left for rect/text/circle bounding box)
  y: 200,              // Y position (top-left for rect/text/circle bounding box)
  width: 150,          // Width in pixels (rect/circle/text)
  height: 100,         // Height in pixels (rect/circle/text)
  color: "#646cff",    // Fill color or stroke color
  type: "rectangle",   // Shape type: "rectangle", "circle", "line", or "text"
  rotation: 45,        // Rotation in degrees (0-359), defaults to 0
  
  // Line-specific fields
  endX: 300,           // Line end X coordinate (only for lines)
  endY: 400,           // Line end Y coordinate (only for lines)
  strokeWidth: 2,      // Line thickness (only for lines)
  
  // Text-specific fields
  text: "Hello",       // Text content (only for text)
  fontSize: 24,        // Font size in pixels (only for text)
  fontWeight: "normal",// Font weight: "normal" or "bold" (only for text)
  
  // Metadata
  createdBy: "userId", // Creator's Firebase Auth UID
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lockedBy: "userId",  // User currently editing (prevents conflicts)
  lockedAt: Timestamp  // Lock timestamp (auto-expires after 30s)
}
```

**Coordinate System Note**: 
- **Rectangles & Text**: `{x, y}` is top-left corner
- **Circles**: `{x, y}` is top-left of bounding box (rendered from center)
- **Lines**: `{x, y}` is start point, `{endX, endY}` is end point
- **Rotation**: All shapes rotate around their center point

### cursors
```javascript
{
  id: "userId",        // Same as Firebase Auth UID
  userId: "userId",
  userName: "Display Name",
  x: 500,              // Canvas X coordinate
  y: 300,              // Canvas Y coordinate
  updatedAt: Timestamp
}
```

### presence
```javascript
{
  id: "userId",        // Same as Firebase Auth UID
  userId: "userId",
  userName: "Display Name",
  userEmail: "user@example.com",
  status: "online",    // "online" or "offline"
  lastSeen: Timestamp,
  joinedAt: Timestamp
}
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Create rectangles by dragging in Draw Mode
- [ ] Create circles by selecting circle type and dragging
- [ ] Click to select shapes (shows transformer handles)
- [ ] Drag selected shapes in Move Mode (no accidental drags)
- [ ] Resize shapes using transformer corner handles
- [ ] Delete shapes with Delete key
- [ ] Pan canvas in Pan Mode
- [ ] Zoom in/out with mouse wheel

### Multi-User
- [ ] Open 2+ browser windows
- [ ] Create shapes in one window, see in others
- [ ] Move shapes simultaneously
- [ ] See other users' cursors
- [ ] See online users list
- [ ] Verify shapes sync within 100ms

### Performance
- [ ] Create 100+ shapes
- [ ] Verify FPS stays at 60 (dev mode)
- [ ] Pan and zoom smoothly
- [ ] No lag when dragging shapes

## 📝 Development Notes

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

### Adding Features

1. **New Shape Types**: Extend `Shape.jsx` with different Konva shapes (triangles, stars, polygons, etc.)
   - Add new type to `SHAPE_TYPES` constant
   - Add rendering logic in `Shape.jsx`
   - Update shape type selector UI
2. **Color Picker**: Add color selection UI in canvas toolbar
3. **Undo/Redo**: Implement action history with timestamps
4. **Export**: Add canvas export to PNG/SVG
5. **Rooms**: Add URL-based rooms for separate canvas instances
6. **AI Integration**: Add AI agent for natural language shape creation and manipulation

### Recent Updates

#### PR #15: Rotation Support (Latest)
- ✅ All shape types support rotation (rectangles, circles, text)
- ✅ Rotation handle appears on selected shapes
- ✅ Rotation snaps to 45° increments for precision
- ✅ Real-time multiplayer sync (<100ms)
- ✅ Rotation persists to Firebase and survives refresh
- ✅ No position drift on rotation
- ✅ Text shapes now rotatable

#### PR #14: Marquee Selection
- ✅ Drag-to-select rectangle in Move mode
- ✅ AABB collision detection for all shape types
- ✅ Shift+marquee for additive selection
- ✅ Scale-independent rendering

#### PR #13: Multi-Select Foundation
- ✅ Shift-click to add/remove shapes from selection
- ✅ Cmd/Ctrl+A to select all shapes
- ✅ Group move with zero latency (optimistic locking)
- ✅ Group delete with batch operations
- ✅ 20x performance improvement on drag operations

#### PR #12: Text Shape Support
- ✅ Click-to-place text creation
- ✅ Double-click inline editing with textarea overlay
- ✅ Font size, weight, color customization
- ✅ Auto-resize text box and multi-line support
- ✅ Edit locking prevents simultaneous edits

#### PR #11: Line Shape Support  
- ✅ Click-drag line creation from start to end point
- ✅ Draggable endpoint anchors for precise editing
- ✅ Enhanced hit detection (20px hit area)
- ✅ Real-time sync and full locking mechanism

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Canvas rendering by [Konva.js](https://konvajs.org/)
- Backend by [Firebase](https://firebase.google.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📧 Support

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Review Firebase Console for errors
3. Check browser console for JavaScript errors
4. Open an issue on GitHub

---

**Made with ❤️ for collaborative creativity** 🎨
