// src/utils/geometry.js
// Geometry utilities for AI layout commands
// Includes fixes for rotated shapes, floating point precision, and edge cases

import { CANVAS_CONFIG } from './constants';

/**
 * Calculate rotated bounding box (AABB) for rotated shapes
 * FIX: Bug #1 - Handles rotated rectangles correctly (Figma approach)
 * @param {Object} shape - Shape object with x, y, width, height, rotation
 * @param {number} rotationDegrees - Rotation in degrees
 * @returns {Object} Bounding box with x, y, width, height, centerX, centerY
 */
function calculateRotatedBounds(shape, rotationDegrees) {
  const rad = rotationDegrees * Math.PI / 180;
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  
  // Get unrotated corners
  const corners = [
    { x: shape.x, y: shape.y },                           // top-left
    { x: shape.x + shape.width, y: shape.y },             // top-right
    { x: shape.x + shape.width, y: shape.y + shape.height }, // bottom-right
    { x: shape.x, y: shape.y + shape.height }              // bottom-left
  ];
  
  // Rotate corners around center
  const rotatedCorners = corners.map(corner => ({
    x: centerX + (corner.x - centerX) * Math.cos(rad) - (corner.y - centerY) * Math.sin(rad),
    y: centerY + (corner.x - centerX) * Math.sin(rad) + (corner.y - centerY) * Math.cos(rad)
  }));
  
  // Calculate AABB from rotated corners
  const minX = Math.min(...rotatedCorners.map(c => c.x));
  const minY = Math.min(...rotatedCorners.map(c => c.y));
  const maxX = Math.max(...rotatedCorners.map(c => c.x));
  const maxY = Math.max(...rotatedCorners.map(c => c.y));
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    rotation: rotationDegrees
  };
}

/**
 * Get bounding box for a single shape (handles all types and rotation)
 * FIX: Bug #1 - Accounts for shape rotation
 * FIX: Bug #3 - Handles zero-width/height lines correctly
 * @param {Object} shape - Shape object
 * @returns {Object} Bounding box with x, y, width, height, centerX, centerY
 */
export function getShapeBounds(shape) {
  const rotation = shape.rotation || 0;
  
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      if (rotation === 0) {
        // Fast path: no rotation
        return {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          centerX: shape.x + shape.width / 2,
          centerY: shape.y + shape.height / 2
        };
      }
      
      // Calculate rotated AABB
      return calculateRotatedBounds(shape, rotation);
      
    case 'circle':
      // Circles are stored like rectangles (x,y = top-left, width/height = diameter)
      // Circles look the same when rotated (optimization)
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2
      };
      
    case 'line':
      // Lines already account for rotation via endpoints
      // FIX: Bug #3 - Use strokeWidth as minimum dimension
      const minX = Math.min(shape.x1, shape.x2);
      const maxX = Math.max(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxY = Math.max(shape.y1, shape.y2);
      const width = maxX - minX;
      const height = maxY - minY;
      const strokeWidth = shape.strokeWidth || 2;
      
      return {
        x: minX,
        y: minY,
        width: width > 0 ? width : strokeWidth,
        height: height > 0 ? height : strokeWidth,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
      
    default:
      throw new Error(`Unknown shape type: ${shape.type}`);
  }
}

/**
 * Calculate bounding box for multiple shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {Object} Bounding box containing all shapes
 */
export function calculateBoundingBox(shapes) {
  if (!shapes || shapes.length === 0) {
    throw new Error('Cannot calculate bounding box for empty array');
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  const minX = Math.min(...bounds.map(b => b.x));
  const minY = Math.min(...bounds.map(b => b.y));
  const maxX = Math.max(...bounds.map(b => b.x + b.width));
  const maxY = Math.max(...bounds.map(b => b.y + b.height));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * Constrain position to canvas bounds
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Shape width
 * @param {number} height - Shape height
 * @returns {Object} Clamped position {x, y}
 */
export function constrainToCanvas(x, y, width = 0, height = 0) {
  const clampedX = Math.max(0, Math.min(x, CANVAS_CONFIG.width - width));
  const clampedY = Math.max(0, Math.min(y, CANVAS_CONFIG.height - height));
  
  return { x: clampedX, y: clampedY };
}

/**
 * Calculate positions for horizontal arrangement
 * FIX: Bug #6 - Uses stable sort
 * @param {Array} shapes - Array of shape objects
 * @param {number} spacing - Space between shapes in pixels
 * @returns {Array} Array of positions {x, y}
 */
export function calculateHorizontalLayout(shapes, spacing = 20) {
  if (shapes.length === 0) return [];
  
  const bounds = shapes.map(getShapeBounds);
  const groupBounds = calculateBoundingBox(shapes);
  
  // FIX: Bug #6 - Stable sort with secondary key
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => {
      const xDiff = a.bounds.x - b.bounds.x;
      if (xDiff !== 0) return xDiff;
      // If X is same, maintain original order (stable sort)
      return a.originalIndex - b.originalIndex;
    });
  
  // Calculate vertical center for alignment
  const alignY = groupBounds.centerY;
  
  // Position shapes left-to-right
  let currentX = groupBounds.minX;
  const positions = new Array(shapes.length);
  
  sorted.forEach(({ shape, bounds, originalIndex }) => {
    const newY = alignY - bounds.height / 2;
    
    positions[originalIndex] = constrainToCanvas(
      Math.round(currentX),
      Math.round(newY),
      bounds.width,
      bounds.height
    );
    currentX += bounds.width + spacing;
  });
  
  return positions;
}

/**
 * Calculate positions for vertical arrangement
 * FIX: Bug #6 - Uses stable sort
 * @param {Array} shapes - Array of shape objects
 * @param {number} spacing - Space between shapes in pixels
 * @returns {Array} Array of positions {x, y}
 */
export function calculateVerticalLayout(shapes, spacing = 20) {
  if (shapes.length === 0) return [];
  
  const bounds = shapes.map(getShapeBounds);
  const groupBounds = calculateBoundingBox(shapes);
  
  // FIX: Bug #6 - Stable sort with secondary key
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => {
      const yDiff = a.bounds.y - b.bounds.y;
      if (yDiff !== 0) return yDiff;
      // If Y is same, maintain original order (stable sort)
      return a.originalIndex - b.originalIndex;
    });
  
  // Calculate horizontal center for alignment
  const alignX = groupBounds.centerX;
  
  // Position shapes top-to-bottom
  let currentY = groupBounds.minY;
  const positions = new Array(shapes.length);
  
  sorted.forEach(({ shape, bounds, originalIndex }) => {
    const newX = alignX - bounds.width / 2;
    
    positions[originalIndex] = constrainToCanvas(
      Math.round(newX),
      Math.round(currentY),
      bounds.width,
      bounds.height
    );
    currentY += bounds.height + spacing;
  });
  
  return positions;
}

/**
 * Calculate positions for grid arrangement
 * @param {Array} shapes - Array of shape objects
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} spacingX - Horizontal spacing
 * @param {number} spacingY - Vertical spacing
 * @param {number} startX - Starting X position (optional)
 * @param {number} startY - Starting Y position (optional)
 * @returns {Array} Array of positions {x, y}
 */
export function calculateGridLayout(shapes, rows, cols, spacingX = 20, spacingY = 20, startX = null, startY = null) {
  if (shapes.length === 0) return [];
  if (rows * cols < shapes.length) {
    throw new Error(`Grid too small: ${rows}x${cols} = ${rows*cols} cells for ${shapes.length} shapes`);
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  // Find max dimensions for cell size (with safety minimum)
  const maxWidth = Math.max(...bounds.map(b => b.width), 10);
  const maxHeight = Math.max(...bounds.map(b => b.height), 10);
  
  // Calculate starting position
  const groupBounds = calculateBoundingBox(shapes);
  const gridStartX = startX !== null ? startX : groupBounds.minX;
  const gridStartY = startY !== null ? startY : groupBounds.minY;
  
  // Position each shape in grid
  const positions = shapes.map((shape, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const cellX = gridStartX + (col * (maxWidth + spacingX));
    const cellY = gridStartY + (row * (maxHeight + spacingY));
    
    const shapeBounds = bounds[index];
    
    // Center shape in cell
    const x = cellX + (maxWidth - shapeBounds.width) / 2;
    const y = cellY + (maxHeight - shapeBounds.height) / 2;
    
    return constrainToCanvas(
      Math.round(x),
      Math.round(y),
      shapeBounds.width,
      shapeBounds.height
    );
  });
  
  return positions;
}

/**
 * Calculate positions for even distribution
 * FIX: Bug #2 - Calculates from origin to avoid floating point accumulation
 * FIX: Bug #6 - Uses stable sort
 * @param {Array} shapes - Array of shape objects
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {Array} Array of positions {x, y}
 */
export function calculateEvenDistribution(shapes, direction = 'horizontal') {
  if (shapes.length < 2) {
    return shapes.map(s => ({ x: s.x, y: s.y }));
  }
  
  const bounds = shapes.map(getShapeBounds);
  
  // FIX: Bug #6 - Stable sort
  const sorted = shapes
    .map((shape, index) => ({ shape, bounds: bounds[index], originalIndex: index }))
    .sort((a, b) => {
      if (direction === 'horizontal') {
        const xDiff = a.bounds.x - b.bounds.x;
        if (xDiff !== 0) return xDiff;
        return a.originalIndex - b.originalIndex;
      } else {
        const yDiff = a.bounds.y - b.bounds.y;
        if (yDiff !== 0) return yDiff;
        return a.originalIndex - b.originalIndex;
      }
    });
  
  const positions = new Array(shapes.length);
  
  // Keep first and last positions fixed
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  positions[first.originalIndex] = { x: first.shape.x, y: first.shape.y };
  positions[last.originalIndex] = { x: last.shape.x, y: last.shape.y };
  
  if (shapes.length === 2) {
    return positions;
  }
  
  if (direction === 'horizontal') {
    // FIX: Bug #2 - Calculate from origin, not incrementally
    const totalDistance = last.bounds.x + last.bounds.width - first.bounds.x;
    const totalShapeWidth = sorted.reduce((sum, s) => sum + s.bounds.width, 0);
    const totalGapSpace = totalDistance - totalShapeWidth;
    const gapSize = totalGapSpace / (sorted.length - 1);
    
    // Calculate each position from origin (no accumulation)
    for (let i = 1; i < sorted.length - 1; i++) {
      const { originalIndex, shape, bounds } = sorted[i];
      
      // Calculate width of all shapes before this one
      const widthBefore = sorted.slice(0, i).reduce((sum, s) => sum + s.bounds.width, 0);
      const gapsBefore = i;
      
      // Calculate position from fixed origin
      const x = first.bounds.x + widthBefore + (gapSize * gapsBefore);
      
      // Round to whole pixels (Figma standard)
      positions[originalIndex] = {
        x: Math.round(x),
        y: shape.y
      };
    }
  } else {
    // Vertical - same logic but with Y axis
    const totalDistance = last.bounds.y + last.bounds.height - first.bounds.y;
    const totalShapeHeight = sorted.reduce((sum, s) => sum + s.bounds.height, 0);
    const totalGapSpace = totalDistance - totalShapeHeight;
    const gapSize = totalGapSpace / (sorted.length - 1);
    
    for (let i = 1; i < sorted.length - 1; i++) {
      const { originalIndex, shape, bounds } = sorted[i];
      const heightBefore = sorted.slice(0, i).reduce((sum, s) => sum + s.bounds.height, 0);
      const gapsBefore = i;
      
      const y = first.bounds.y + heightBefore + (gapSize * gapsBefore);
      
      positions[originalIndex] = {
        x: shape.x,
        y: Math.round(y)
      };
    }
  }
  
  return positions;
}

/**
 * Calculate center position for single shape
 * @param {Object} shape - Shape object
 * @returns {Object} New position (format depends on shape type)
 */
export function calculateCenterPosition(shape) {
  const bounds = getShapeBounds(shape);
  const canvasCenterX = CANVAS_CONFIG.width / 2;
  const canvasCenterY = CANVAS_CONFIG.height / 2;
  
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return {
        x: Math.round(canvasCenterX - bounds.width / 2),
        y: Math.round(canvasCenterY - bounds.height / 2)
      };
      
    case 'circle':
      // Circles stored as top-left like rectangles
      return {
        x: Math.round(canvasCenterX - bounds.width / 2),
        y: Math.round(canvasCenterY - bounds.height / 2)
      };
      
    case 'line':
      const currentCenterX = (shape.x1 + shape.x2) / 2;
      const currentCenterY = (shape.y1 + shape.y2) / 2;
      const offsetX = canvasCenterX - currentCenterX;
      const offsetY = canvasCenterY - currentCenterY;
      return {
        x1: Math.round(shape.x1 + offsetX),
        y1: Math.round(shape.y1 + offsetY),
        x2: Math.round(shape.x2 + offsetX),
        y2: Math.round(shape.y2 + offsetY)
      };
      
    default:
      throw new Error(`Unknown shape type: ${shape.type}`);
  }
}

/**
 * Calculate center offset for group of shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {Object} Offset {offsetX, offsetY}
 */
export function calculateGroupCenterOffset(shapes) {
  const bbox = calculateBoundingBox(shapes);
  const canvasCenterX = CANVAS_CONFIG.width / 2;
  const canvasCenterY = CANVAS_CONFIG.height / 2;
  
  return {
    offsetX: canvasCenterX - bbox.centerX,
    offsetY: canvasCenterY - bbox.centerY
  };
}

/**
 * Validate that layout will fit on canvas
 * FIX: Bug #5 - Pre-validation to prevent overflow
 * @param {number} width - Total layout width
 * @param {number} height - Total layout height
 * @param {Object} params - Layout parameters for error message
 * @throws {Error} If layout exceeds canvas bounds
 */
export function validateLayoutSize(width, height, params = {}) {
  if (width > CANVAS_CONFIG.width || height > CANVAS_CONFIG.height) {
    const message = `Layout too large: ${Math.round(width)}x${Math.round(height)}px exceeds canvas (${CANVAS_CONFIG.width}x${CANVAS_CONFIG.height}px).`;
    
    // Add helpful suggestions based on parameters
    if (params.rows && params.cols && params.spacingX !== undefined) {
      const maxSpacingX = Math.floor((CANVAS_CONFIG.width - (params.cols * params.cellWidth)) / (params.cols - 1));
      const maxSpacingY = Math.floor((CANVAS_CONFIG.height - (params.rows * params.cellHeight)) / (params.rows - 1));
      throw new Error(
        `${message} Try spacing ≤ ${Math.max(0, Math.min(maxSpacingX, maxSpacingY))}px or fewer rows/columns.`
      );
    }
    
    throw new Error(`${message} Try smaller spacing or fewer shapes.`);
  }
}

