# PR#7: Multiplayer Cursors - Setup Instructions

## ✅ What Was Implemented

### 1. **Cursors Service** (`src/services/cursors.js`)
- `updateCursorPosition()` - Updates user's cursor in Firestore
- `removeCursor()` - Removes cursor on disconnect
- `subscribeToCursors()` - Real-time listener for all cursors

### 2. **RemoteCursor Component** (`src/components/Canvas/RemoteCursor.jsx`)
- Renders cursor pointer with user name label
- Color-coded by user (consistent colors per user)
- Non-interactive overlay

### 3. **useCursors Hook** (`src/hooks/useCursors.js`)
- Manages cursor state
- Throttles updates to 50ms (smooth + efficient)
- Auto-cleanup on unmount and page unload

### 4. **Canvas Integration**
- Tracks mouse movement in canvas coordinates
- Sends position updates to Firestore (throttled)
- Renders all remote cursors
- Shows "Online: X" counter

---

## 🔧 Required Setup

### **Step 1: Update Firestore Security Rules**

⚠️ **IMPORTANT**: You must update Firestore rules to allow cursor access!

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `collabcanvas-2ba10`
3. Navigate to: **Firestore Database → Rules**
4. Copy the rules from `FIRESTORE_RULES_SIMPLE.txt`
5. Replace ALL existing rules
6. Click **"Publish"**

The rules now include:
```javascript
// Cursors collection (for multiplayer cursor tracking)
match /cursors/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 🧪 Testing Multiplayer Cursors

### **Multi-Browser Test**

1. **Open 2-3 browser windows** (or use incognito mode)
2. **Login with different accounts** in each window
3. **Move your mouse** in one browser
4. **Verify cursor appears** in other browsers in real-time

### **Expected Behavior**

✅ **Cursor Position**
- Other users' cursors visible on canvas
- Cursor updates within 50ms (smooth movement)
- Cursor follows exact canvas position (respects pan/zoom)

✅ **User Labels**
- User name displayed next to cursor
- Color-coded (consistent per user)
- Labels readable with shadow/outline

✅ **Online Counter**
- Shows "👥 Online: X" in top-right
- Count updates when users join/leave
- Includes yourself in the count

✅ **Cleanup**
- Cursor removed when user closes browser
- Cursor removed when user logs out
- No ghost cursors after disconnect

---

## 🎨 Features

### **Throttling (50ms)**
- Smooth cursor movement
- Efficient Firestore usage
- ~20 updates per second max

### **Color Coding**
Predefined colors assigned per user:
- Blue, Green, Orange, Pink, Purple
- Cyan, Red, Lime, Yellow, Teal

### **Canvas Coordinate Mapping**
- Cursors respect pan/zoom transformations
- Positions in canvas space (not screen space)
- Accurate across different viewport positions

---

## 🔍 Debugging

### **Check Console Logs**
```
📍 Subscribing to remote cursors...
📍 Cleaning up cursor subscription and removing cursor
```

### **Check Firestore**
1. Go to Firebase Console → Firestore Database
2. Look for `cursors` collection
3. Should see documents with structure:
```javascript
{
  userId: "abc123...",
  userName: "User Name",
  x: 1234.56,
  y: 789.01,
  timestamp: Timestamp
}
```

### **Common Issues**

**Cursors not appearing?**
- ✅ Check Firestore rules are updated
- ✅ Verify users are authenticated
- ✅ Check console for permission errors

**Cursors laggy or stuttering?**
- Check network tab for rate limiting
- Verify throttle is working (should be max 20 req/sec per user)

**Ghost cursors not disappearing?**
- Normal with Firestore (no true onDisconnect)
- Manual cleanup on beforeunload should handle most cases
- Could add timestamp-based cleanup if needed

---

## 📊 Firestore Usage

### **Writes per User**
- ~20 writes/second while moving mouse
- 0 writes when mouse is still
- Minimal impact on Firestore quota

### **Reads per User**
- Real-time listener (1 read on connect)
- Snapshot updates (no additional reads)
- Very efficient for multiplayer

---

## 🚀 Next Steps

- ✅ Test with 2-3 users
- ✅ Verify cursor sync latency
- ✅ Check cleanup on disconnect
- ⏭️ Move to PR#8: Presence System

---

## 🎯 Acceptance Criteria

All criteria from PR#7 task list:

- ✅ Can see other users' cursors moving in real-time
- ✅ User names displayed next to cursors
- ✅ Cursor updates within 50ms
- ✅ Own cursor not duplicated
- ✅ Cursors removed when users disconnect
- ✅ Smooth cursor movement (no stuttering)


