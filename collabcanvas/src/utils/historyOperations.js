/**
 * History Operations for Undo/Redo System
 * 
 * Defines operation types, factory functions, and restore logic
 * for tracking and reversing canvas operations.
 */

/**
 * Operation Types
 * Represents different types of canvas operations that can be undone/redone
 */
export const OperationType = {
  CREATE: 'create',
  DELETE: 'delete',
  MOVE: 'move',
  RESIZE: 'resize',
  MODIFY: 'modify',
  BATCH: 'batch',  // Multiple operations together
  BATCH_MODIFY: 'batch_modify'  // Batch property modification for multi-select
};

/**
 * Create a history operation object
 * @param {string} type - Operation type from OperationType
 * @param {Object} before - State before the operation
 * @param {Object} after - State after the operation
 * @param {Object} metadata - Additional information (shapeId, userId, etc.)
 * @returns {Object} Operation object
 */
export function createOperation(type, before, after, metadata = {}) {
  return {
    type,
    timestamp: Date.now(),
    before,
    after,
    metadata
  };
}

/**
 * Create a CREATE operation (for shape creation)
 * @param {Object} shapeData - The created shape data
 * @param {string} userId - User who created the shape
 * @returns {Object} CREATE operation
 */
export function createCreateOperation(shapeData, userId) {
  return createOperation(
    OperationType.CREATE,
    null,  // No before state for creation
    shapeData,
    { shapeId: shapeData.id, userId }
  );
}

/**
 * Create a DELETE operation (for shape deletion)
 * @param {Object} shapeData - The deleted shape data
 * @param {string} userId - User who deleted the shape
 * @returns {Object} DELETE operation
 */
export function createDeleteOperation(shapeData, userId) {
  return createOperation(
    OperationType.DELETE,
    shapeData,
    null,  // No after state for deletion
    { shapeId: shapeData.id, userId }
  );
}

/**
 * Create a MOVE operation (for position changes)
 * @param {string} shapeId - ID of the moved shape
 * @param {Object} beforePos - {x, y} before move
 * @param {Object} afterPos - {x, y} after move
 * @param {string} userId - User who moved the shape
 * @returns {Object} MOVE operation
 */
export function createMoveOperation(shapeId, beforePos, afterPos, userId) {
  return createOperation(
    OperationType.MOVE,
    { x: beforePos.x, y: beforePos.y },  // Only store position
    { x: afterPos.x, y: afterPos.y },
    { shapeId, userId }
  );
}

/**
 * Create a RESIZE operation (for size changes)
 * @param {string} shapeId - ID of the resized shape
 * @param {Object} beforeSize - {width, height} before resize
 * @param {Object} afterSize - {width, height} after resize
 * @param {string} userId - User who resized the shape
 * @returns {Object} RESIZE operation
 */
export function createResizeOperation(shapeId, beforeSize, afterSize, userId) {
  return createOperation(
    OperationType.RESIZE,
    { width: beforeSize.width, height: beforeSize.height },
    { width: afterSize.width, height: afterSize.height },
    { shapeId, userId }
  );
}

/**
 * Create a MODIFY operation (for property changes like color, text, rotation)
 * @param {string} shapeId - ID of the modified shape
 * @param {Object} beforeProps - Properties before modification
 * @param {Object} afterProps - Properties after modification
 * @param {string} userId - User who modified the shape
 * @returns {Object} MODIFY operation
 */
export function createModifyOperation(shapeId, beforeProps, afterProps, userId) {
  return createOperation(
    OperationType.MODIFY,
    beforeProps,
    afterProps,
    { shapeId, userId }
  );
}

/**
 * Create a BATCH operation (multiple operations together)
 * @param {Array} operations - Array of operations to batch
 * @param {string} operationName - Name of the batch operation (e.g., "createLoginForm")
 * @param {string} userId - User who performed the batch
 * @returns {Object} BATCH operation
 */
export function createBatchOperation(operations, operationName, userId) {
  return createOperation(
    OperationType.BATCH,
    null,
    { operations, operationName },
    { userId }
  );
}

/**
 * Create a BATCH_MODIFY operation (for multi-select property changes)
 * @param {Array<string>} shapeIds - IDs of shapes being modified
 * @param {string} property - Property being changed (e.g., 'color', 'x', 'fontSize')
 * @param {Object} oldValues - Map of shapeId -> old value
 * @param {any} newValue - New value applied to all shapes
 * @param {string} userId - User who performed the modification
 * @returns {Object} BATCH_MODIFY operation
 */
export function createBatchModifyOperation(shapeIds, property, oldValues, newValue, userId) {
  return createOperation(
    OperationType.BATCH_MODIFY,
    { shapeIds, property, values: oldValues },  // Old state
    { shapeIds, property, value: newValue },     // New state
    { userId, property, shapeCount: shapeIds.length }
  );
}

/**
 * Restore an operation (for undo/redo)
 * @param {Object} operation - The operation to restore
 * @param {string} direction - 'undo' or 'redo'
 * @param {Object} canvasAPI - Canvas API functions (getShape, updateShape, deleteShape, etc.)
 * @returns {Promise<Object>} Result with success status
 */
export async function restoreOperation(operation, direction, canvasAPI) {
  const isUndo = direction === 'undo';
  
  try {
    switch (operation.type) {
      case OperationType.CREATE:
        if (isUndo) {
          // Undo create = delete the shape
          const exists = await canvasAPI.shapeExists(operation.after.id);
          if (!exists) {
            console.warn('Shape already deleted, skipping undo');
            return { success: false, reason: 'already_deleted' };
          }
          await canvasAPI.deleteShape(operation.after.id);
        } else {
          // Redo create = recreate the shape
          const exists = await canvasAPI.shapeExists(operation.after.id);
          if (exists) {
            console.warn('Shape already exists, skipping redo');
            return { success: false, reason: 'already_exists' };
          }
          await canvasAPI.createShape(operation.after);
        }
        break;
        
      case OperationType.DELETE:
        if (isUndo) {
          // Undo delete = recreate the shape
          const exists = await canvasAPI.shapeExists(operation.before.id);
          if (exists) {
            console.warn('Shape already recreated, skipping undo');
            return { success: false, reason: 'already_exists' };
          }
          await canvasAPI.createShape(operation.before);
        } else {
          // Redo delete = delete again
          const exists = await canvasAPI.shapeExists(operation.before.id);
          if (!exists) {
            console.warn('Shape already deleted, skipping redo');
            return { success: false, reason: 'already_deleted' };
          }
          await canvasAPI.deleteShape(operation.before.id);
        }
        break;
        
      case OperationType.MOVE:
        {
          const pos = isUndo ? operation.before : operation.after;
          const exists = await canvasAPI.shapeExists(operation.metadata.shapeId);
          if (!exists) {
            console.warn('Shape no longer exists, skipping move restore');
            return { success: false, reason: 'shape_not_found' };
          }
          await canvasAPI.updateShapePosition(
            operation.metadata.shapeId,
            pos.x,
            pos.y
          );
        }
        break;
        
      case OperationType.RESIZE:
        {
          const size = isUndo ? operation.before : operation.after;
          const exists = await canvasAPI.shapeExists(operation.metadata.shapeId);
          if (!exists) {
            console.warn('Shape no longer exists, skipping resize restore');
            return { success: false, reason: 'shape_not_found' };
          }
          await canvasAPI.updateShapeSize(
            operation.metadata.shapeId,
            size.width,
            size.height
          );
        }
        break;
        
      case OperationType.MODIFY:
        {
          const props = isUndo ? operation.before : operation.after;
          const exists = await canvasAPI.shapeExists(operation.metadata.shapeId);
          if (!exists) {
            console.warn('Shape no longer exists, skipping modify restore');
            return { success: false, reason: 'shape_not_found' };
          }
          await canvasAPI.updateShapeProperties(
            operation.metadata.shapeId,
            props
          );
        }
        break;
        
      case OperationType.BATCH:
        // For batch operations, restore all operations in reverse order for undo
        if (isUndo) {
          const operations = operation.after.operations;
          for (let i = operations.length - 1; i >= 0; i--) {
            await restoreOperation(operations[i], 'undo', canvasAPI);
          }
        } else {
          const operations = operation.after.operations;
          for (let i = 0; i < operations.length; i++) {
            await restoreOperation(operations[i], 'redo', canvasAPI);
          }
        }
        break;
        
      case OperationType.BATCH_MODIFY:
        // For batch modify operations (multi-select editing)
        {
          const property = operation.metadata.property;
          
          if (isUndo) {
            // Undo: Restore old values for each shape
            const { shapeIds, values: oldValues } = operation.before;
            for (const shapeId of shapeIds) {
              const exists = await canvasAPI.shapeExists(shapeId);
              if (!exists) {
                console.warn(`Shape ${shapeId} no longer exists, skipping`);
                continue;
              }
              const oldValue = oldValues[shapeId];
              await canvasAPI.updateShapeProperties(shapeId, { [property]: oldValue });
            }
          } else {
            // Redo: Apply new value to all shapes
            const { shapeIds, value: newValue } = operation.after;
            for (const shapeId of shapeIds) {
              const exists = await canvasAPI.shapeExists(shapeId);
              if (!exists) {
                console.warn(`Shape ${shapeId} no longer exists, skipping`);
                continue;
              }
              await canvasAPI.updateShapeProperties(shapeId, { [property]: newValue });
            }
          }
        }
        break;
        
      default:
        console.warn('Unknown operation type:', operation.type);
        return { success: false, reason: 'unknown_operation_type' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Restore operation failed:', error);
    return { success: false, reason: error.message };
  }
}

