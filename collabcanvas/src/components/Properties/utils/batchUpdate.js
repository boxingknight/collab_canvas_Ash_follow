// batchUpdate.js - Utility functions for batch updating multiple shapes

import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Apply a property update to multiple shapes using Firestore batch write
 * @param {Array<String>} shapeIds - Array of shape IDs to update
 * @param {String} property - Property to update (e.g., 'x', 'color')
 * @param {any} value - New value to apply
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} { success: boolean, batchId: string, error?: string }
 */
export async function batchUpdateShapes(shapeIds, property, value, options = {}) {
  if (!shapeIds || shapeIds.length === 0) {
    return { success: false, error: 'No shapes provided' };
  }

  try {
    const batch = writeBatch(db);
    const batchId = uuidv4(); // Track batch operations

    // Prepare batch updates
    for (const shapeId of shapeIds) {
      const shapeRef = doc(db, 'shapes', shapeId);
      batch.update(shapeRef, {
        [property]: value,
        updatedAt: serverTimestamp(),
        batchId: batchId // For coordinating real-time updates
      });
    }

    // Execute atomic batch write
    await batch.commit();

    return { 
      success: true, 
      batchId,
      message: `Updated ${property} for ${shapeIds.length} shape(s)`
    };

  } catch (error) {
    console.error('Batch update failed:', error);
    return { 
      success: false, 
      error: error.message || 'Batch update failed'
    };
  }
}

/**
 * Apply multiple property updates to multiple shapes in a single batch
 * @param {Array<String>} shapeIds - Array of shape IDs
 * @param {Object} updates - Object with property-value pairs (e.g., { x: 100, y: 200 })
 * @returns {Promise<Object>} { success: boolean, batchId: string }
 */
export async function batchUpdateMultipleProperties(shapeIds, updates) {
  if (!shapeIds || shapeIds.length === 0) {
    return { success: false, error: 'No shapes provided' };
  }

  if (!updates || Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  try {
    const batch = writeBatch(db);
    const batchId = uuidv4();

    for (const shapeId of shapeIds) {
      const shapeRef = doc(db, 'shapes', shapeId);
      batch.update(shapeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        batchId: batchId
      });
    }

    await batch.commit();

    return { 
      success: true, 
      batchId,
      message: `Updated ${Object.keys(updates).length} properties for ${shapeIds.length} shape(s)`
    };

  } catch (error) {
    console.error('Batch multi-property update failed:', error);
    return { 
      success: false, 
      error: error.message || 'Batch update failed'
    };
  }
}

/**
 * Apply relative update to shapes (e.g., "+50" adds 50 to current value)
 * @param {Array<Object>} shapes - Array of shape objects (not just IDs)
 * @param {String} property - Property to update
 * @param {String} relativeValue - Relative change (e.g., "+50", "-20", "×2")
 * @returns {Promise<Object>} { success: boolean }
 */
export async function applyRelativeUpdate(shapes, property, relativeValue) {
  if (!shapes || shapes.length === 0) {
    return { success: false, error: 'No shapes provided' };
  }

  try {
    const batch = writeBatch(db);
    const batchId = uuidv4();

    for (const shape of shapes) {
      const currentValue = shape[property];
      const newValue = calculateRelativeValue(currentValue, relativeValue);
      
      const shapeRef = doc(db, 'shapes', shape.id);
      batch.update(shapeRef, {
        [property]: newValue,
        updatedAt: serverTimestamp(),
        batchId: batchId
      });
    }

    await batch.commit();

    return { 
      success: true, 
      batchId,
      message: `Applied relative update (${relativeValue}) to ${property} for ${shapes.length} shape(s)`
    };

  } catch (error) {
    console.error('Relative update failed:', error);
    return { 
      success: false, 
      error: error.message || 'Relative update failed'
    };
  }
}

/**
 * Calculate new value from relative expression
 * @param {Number} current - Current value
 * @param {String} relative - Relative expression ("+50", "-20", "×2", "÷2")
 * @returns {Number} New calculated value
 */
function calculateRelativeValue(current, relative) {
  if (typeof relative === 'number') {
    return relative; // Absolute value
  }

  const str = String(relative).trim();
  
  // Addition: "+50"
  if (str.startsWith('+')) {
    const delta = parseFloat(str.slice(1));
    return current + delta;
  }
  
  // Subtraction: "-20"
  if (str.startsWith('-') && str.length > 1) {
    const delta = parseFloat(str.slice(1));
    return current - delta;
  }
  
  // Multiplication: "×2" or "*2"
  if (str.startsWith('×') || str.startsWith('*')) {
    const factor = parseFloat(str.slice(1));
    return current * factor;
  }
  
  // Division: "÷2" or "/2"
  if (str.startsWith('÷') || str.startsWith('/')) {
    const divisor = parseFloat(str.slice(1));
    return divisor !== 0 ? current / divisor : current;
  }
  
  // Default: parse as absolute value
  return parseFloat(str) || current;
}

/**
 * Chunked batch update for large selections (50+ shapes)
 * @param {Array<String>} shapeIds - Array of shape IDs
 * @param {String} property - Property to update
 * @param {any} value - New value
 * @param {Function} onProgress - Progress callback (percentage: 0-1)
 * @returns {Promise<Object>} { success: boolean }
 */
export async function batchUpdateChunked(shapeIds, property, value, onProgress = null) {
  const CHUNK_SIZE = 25; // Firestore batch limit is 500, we use 25 for safety
  
  if (!shapeIds || shapeIds.length === 0) {
    return { success: false, error: 'No shapes provided' };
  }

  try {
    const chunks = [];
    for (let i = 0; i < shapeIds.length; i += CHUNK_SIZE) {
      chunks.push(shapeIds.slice(i, i + CHUNK_SIZE));
    }

    const batchId = uuidv4(); // Same batch ID for all chunks

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const batch = writeBatch(db);

      for (const shapeId of chunk) {
        const shapeRef = doc(db, 'shapes', shapeId);
        batch.update(shapeRef, {
          [property]: value,
          updatedAt: serverTimestamp(),
          batchId: batchId
        });
      }

      await batch.commit();
      
      // Report progress
      if (onProgress) {
        const progress = (i + 1) / chunks.length;
        onProgress(progress);
      }
    }

    return { 
      success: true, 
      batchId,
      message: `Updated ${property} for ${shapeIds.length} shape(s) in ${chunks.length} chunks`
    };

  } catch (error) {
    console.error('Chunked batch update failed:', error);
    return { 
      success: false, 
      error: error.message || 'Chunked batch update failed'
    };
  }
}

/**
 * Validate property value before batch update
 * @param {String} property - Property name
 * @param {any} value - Value to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePropertyValue(property, value) {
  // Position/Size validation
  if (['x', 'y', 'width', 'height'].includes(property)) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: `${property} must be a number` };
    }
    if (property === 'width' || property === 'height') {
      if (num <= 0) {
        return { valid: false, error: `${property} must be positive` };
      }
    }
  }

  // Rotation validation
  if (property === 'rotation') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Rotation must be a number' };
    }
  }

  // Color validation
  if (property === 'color') {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Color must be a string' };
    }
    // Basic hex color validation
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      return { valid: false, error: 'Color must be a valid hex code (e.g., #FF0000)' };
    }
  }

  // Font size validation
  if (property === 'fontSize') {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: 'Font size must be a positive number' };
    }
  }

  return { valid: true };
}

