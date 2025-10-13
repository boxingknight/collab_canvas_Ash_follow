import { db } from './firebase';

// TODO: Implement cursors service functions

export async function updateCursorPosition(userId, x, y, userName) {
  // Update cursor position in Firestore
}

export function subscribeToCursors(callback) {
  // Subscribe to cursor changes in Firestore
  // Return unsubscribe function
}

export async function removeCursor(userId) {
  // Remove cursor from Firestore on disconnect
}

