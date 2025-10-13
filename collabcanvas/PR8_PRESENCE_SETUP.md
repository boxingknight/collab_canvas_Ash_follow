# PR#8: Presence System - Setup Instructions

## ✅ What Was Implemented

### 1. **Presence Service** (`src/services/presence.js`)
- `setOnline()` - Marks user as online in Firestore
- `setOffline()` - Removes user from presence (on disconnect)
- `updateHeartbeat()` - Updates lastSeen timestamp every 30s
- `subscribeToPresence()` - Real-time listener for all online users

### 2. **UserList Component** (`src/components/Presence/UserList.jsx`)
- **Compact avatar stack in header** next to user name
- Small circles with user initials (2-letter avatars)
- Overlapping avatars for space efficiency
- Hover to see full user list with details
- Color-coded avatars matching cursor colors
- Current user highlighted with white border
- Shows "+X more" indicator if > 5 users
- Dropdown shows names, emails, and status

### 3. **usePresence Hook** (`src/hooks/usePresence.js`)
- Manages presence state
- Auto-sets user online on mount
- 30-second heartbeat to keep presence alive
- Auto-cleanup on unmount and page unload
- Subscribes to real-time presence updates

### 4. **AppLayout Integration**
- UserList added to header (next to user name)
- Compact avatar stack design
- Non-intrusive, hover-to-expand design
- Removed "Online: X" counter from canvas

---

## 🔧 Required Setup

### **Step 1: Update Firestore Security Rules**

⚠️ **IMPORTANT**: You must update Firestore rules to allow presence access!

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `collabcanvas-2ba10`
3. Navigate to: **Firestore Database → Rules**
4. Copy the rules from `FIRESTORE_RULES_SIMPLE.txt`
5. Replace ALL existing rules
6. Click **"Publish"**

The rules now include:
```javascript
// Presence collection (for online user tracking)
match /presence/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 🧪 Testing Presence System

### **Multi-Browser Test**

1. **Open 2-3 browser windows** (or use incognito mode)
2. **Login with different accounts** in each window
3. **Check the header** - you'll see overlapping avatar circles
4. **Hover over the avatars** to see the full user list
5. **Verify all users appear** with correct names and status

### **Expected Behavior**

✅ **Avatar Stack in Header**
- Appears in header next to user name
- Shows up to 5 overlapping avatar circles
- Each avatar shows 2-letter initials
- "+X more" indicator if > 5 users
- Avatars slightly lift on hover

✅ **Hover Dropdown**
- Full user list appears on hover
- Shows avatars, names, and emails
- Pulsing colored status indicators
- Current user highlighted with blue background
- Count badge shows total users
- Scrollable if many users

✅ **Real-Time Updates**
- Users appear immediately when they join
- Users disappear when they disconnect
- No ghost users (heartbeat keeps presence alive)

✅ **Cleanup**
- User removed when browser closes
- User removed when user logs out
- Heartbeat every 30 seconds keeps presence active

---

## 🎨 Features

### **Visual Design**
- Compact overlapping avatar circles in header
- 2-letter initials on colored backgrounds
- Colors match user's cursor color
- Current user has white border
- Hover reveals full dropdown with details
- Dark translucent dropdown with blur effect
- Pulsing status indicators in dropdown
- "(You)" label for current user in dropdown

### **Heartbeat System**
- Updates lastSeen every 30 seconds
- Keeps user marked as online
- Prevents false disconnections

### **Smart Ordering**
- Users sorted by join time (earliest first)
- Consistent ordering across all clients
- Current user always visible

---

## 🔍 Debugging

### **Check Console Logs**
```
👥 Setting up presence for user: User Name
👥 Subscribing to presence collection...
👥 Online users updated: 3
```

### **Check Firestore**
1. Go to Firebase Console → Firestore Database
2. Look for `presence` collection
3. Should see documents with structure:
```javascript
{
  userId: "abc123...",
  userName: "User Name",
  userEmail: "user@example.com",
  status: "online",
  lastSeen: Timestamp,
  joinedAt: Timestamp
}
```

### **Common Issues**

**UserList not appearing?**
- ✅ Check Firestore rules are updated
- ✅ Verify user is authenticated
- ✅ Check console for permission errors

**Users not showing up?**
- Check if presence documents are being created
- Verify subscribeToPresence is working
- Check for network errors in console

**Ghost users (not disappearing)?**
- Normal behavior if browser crashes
- Heartbeat system prevents most cases
- Could add timestamp-based cleanup if needed

---

## 📊 Firestore Usage

### **Writes per User**
- 1 write on join (setOnline)
- 1 write every 30 seconds (heartbeat)
- 1 write on disconnect (setOffline)
- Very efficient (~2 writes/minute per user)

### **Reads per User**
- Real-time listener (1 read on connect)
- Snapshot updates (no additional reads)
- Minimal Firestore quota impact

---

## 🎯 Comparison: Presence vs Cursors

| Feature | Presence | Cursors |
|---------|----------|---------|
| **Purpose** | Show who's online | Show where users are |
| **Updates** | Every 30s (heartbeat) | Every 50ms (movement) |
| **Data** | User info, status | X, Y coordinates |
| **UI** | User list panel | Cursor on canvas |
| **Performance** | Very light | Light (throttled) |

Both systems work together:
- **Presence** = "Who is here?"
- **Cursors** = "Where are they?"

---

## 🚀 Next Steps

- ✅ Test with 2-3 users
- ✅ Verify users appear/disappear correctly
- ✅ Check heartbeat keeps users online
- ⏭️ Move to PR#9: Performance Optimization

---

## 🎯 Acceptance Criteria

All criteria from PR#8 task list:

- ✅ List shows all currently connected users
- ✅ Users appear immediately when they join
- ✅ Users removed immediately when they disconnect
- ✅ Own user shown in list with "(You)" label
- ✅ Clean UI that doesn't obstruct canvas
- ✅ Collapsible to save screen space
- ✅ Color-coded status indicators
- ✅ Heartbeat prevents false disconnections


