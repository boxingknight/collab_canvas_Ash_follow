# Shape Locking Feature

## Overview

Implemented a robust shape locking mechanism to prevent conflicts when multiple users try to manipulate the same shape simultaneously. The first user to grab a shape gets priority, and other users see a visual indicator that the shape is in use.

## Features

### 1. **Automatic Locking**
- When a user starts dragging a shape, it's automatically locked to that user
- Lock is stored in Firestore with `lockedBy` (user UID) and `lockedAt` (timestamp)
- Other users cannot interact with locked shapes

### 2. **Visual Feedback**
- Locked shapes display a red lock icon (🔒) floating above them
- Locked shapes have reduced opacity (0.6) and a red border
- The lock icon is positioned centered above the shape for clear visibility

### 3. **Automatic Unlocking**
- Shape is unlocked when the user finishes dragging
- Cleanup on component unmount to prevent stale locks
- Automatic stale lock cleanup every 30 seconds

### 4. **Stale Lock Prevention**
- Locks older than 30 seconds are automatically cleaned up
- Handles cases where users disconnect while dragging
- Runs periodically and on component mount

## Implementation Details

### Modified Files

#### 1. **services/shapes.js**
Added three new functions:
- `lockShape(shapeId, userId)` - Locks a shape for a specific user
- `unlockShape(shapeId, userId)` - Releases a lock on a shape
- `cleanupStaleLocks()` - Removes stale locks older than 30 seconds

#### 2. **hooks/useShapes.js**
- Integrated lock/unlock functions from the service
- Added automatic stale lock cleanup on mount and every 30 seconds
- Exported `lockShape` and `unlockShape` methods

#### 3. **components/Canvas/Canvas.jsx**
- Modified `handleShapeDragStart` to lock shapes when dragging begins
- Modified `handleShapeDragEnd` to unlock shapes when dragging ends
- Added cleanup effect to unlock shapes on component unmount
- Track active drag state with `activeDragRef`
- Pass `isLockedByOther` prop to Shape components

#### 4. **components/Canvas/Shape.jsx**
- Added `isLockedByOther` prop to determine if shape is locked by another user
- Display lock icon (red badge with 🔒 emoji) when locked by others
- Disable dragging and interaction for locked shapes
- Visual styling changes (red border, reduced opacity) for locked shapes
- Updated memo comparison to include `lockedBy` field

#### 5. **FIRESTORE_SCHEMA.md**
- Updated schema documentation to include `lockedBy` and `lockedAt` fields
- Added "Locking a Shape" data flow section
- Removed lock feature from future roadmap (now implemented)

## Database Schema Changes

### New Fields in `shapes` Collection

```typescript
{
  lockedBy: string | null;      // User UID currently manipulating this shape
  lockedAt: Timestamp | null;   // Timestamp when lock was acquired
}
```

## User Experience

### For the User Manipulating a Shape:
1. Click and drag a shape normally
2. Shape is locked automatically (transparent to the user)
3. Release to unlock the shape

### For Other Users:
1. See a red lock icon (🔒) appear above shapes being manipulated by others
2. Cannot click, select, or drag locked shapes
3. Visual feedback with red border and reduced opacity
4. Lock disappears when the other user finishes

## Technical Considerations

### Performance
- Lock/unlock operations use Firestore `updateDoc()` for minimal overhead
- Real-time updates via existing shape subscription (no additional listeners)
- Stale lock cleanup runs periodically without blocking UI

### Edge Cases Handled
1. **User disconnects while dragging**: Stale lock cleanup removes locks after 30 seconds
2. **Component unmount during drag**: Cleanup effect unlocks active shapes
3. **Multiple rapid locks**: Lock state managed through Firestore ensures consistency
4. **Network latency**: Optimistic UI updates for smooth user experience

## Future Enhancements

### Potential Improvements
1. **Show who is locking**: Display the user's name/avatar on the lock icon
2. **Lock timeout notification**: Warn users before cleanup
3. **Lock transfer**: Allow another user to request lock ownership
4. **Real-time collaboration cursor**: Show dragging user's cursor on locked shapes
5. **Batch operations**: Lock multiple shapes for multi-select operations

## Testing Recommendations

### Manual Testing Scenarios
1. **Basic locking**: Two users try to drag the same shape simultaneously
2. **Rapid succession**: User A releases, User B immediately grabs the same shape
3. **Network disconnect**: User drags shape, then loses connection
4. **Multiple shapes**: Each user can simultaneously drag different shapes
5. **Stale lock cleanup**: Verify locks are cleaned up after 30+ seconds
6. **Component unmount**: Verify locks are released when leaving the canvas

## Security Considerations

- Lock enforcement is client-side for performance
- Consider adding Firestore security rules to enforce lock validation
- Future: Server-side lock validation for critical operations

