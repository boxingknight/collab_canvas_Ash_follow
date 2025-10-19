import { useRef, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'

/**
 * useClipboard Hook
 * Manages clipboard state for copy/paste operations
 * 
 * Features:
 * - Copy shapes to in-memory clipboard
 * - Paste shapes with incremental offset
 * - Boundary clamping to keep shapes visible
 * - Size limit (10 shapes) to prevent memory issues
 */
export function useClipboard() {
  const clipboardRef = useRef([])
  const pasteCountRef = useRef(0)
  
  // Maximum shapes that can be copied at once
  const MAX_CLIPBOARD_SIZE = 10
  
  /**
   * Copy shapes to clipboard
   * @param {Array} shapes - Array of shape objects to copy
   * @returns {Object} Result with success status and count
   */
  const copy = useCallback((shapes) => {
    if (!shapes || shapes.length === 0) {
      return { success: false, reason: 'no_shapes_selected' }
    }
    
    // Limit clipboard size to prevent memory issues
    if (shapes.length > MAX_CLIPBOARD_SIZE) {
      // Truncate to first 10 shapes
      clipboardRef.current = shapes.slice(0, MAX_CLIPBOARD_SIZE).map(shape => 
        JSON.parse(JSON.stringify(shape)) // Deep clone
      )
      
      return { 
        success: true, 
        count: MAX_CLIPBOARD_SIZE, 
        truncated: true,
        message: `Copied ${MAX_CLIPBOARD_SIZE} shapes (limit reached)`
      }
    }
    
    // Deep clone all shapes to preserve all properties
    clipboardRef.current = shapes.map(shape => 
      JSON.parse(JSON.stringify(shape))
    )
    
    // Reset paste count on new copy
    pasteCountRef.current = 0
    
    return { 
      success: true, 
      count: shapes.length,
      message: `Copied ${shapes.length} shape${shapes.length === 1 ? '' : 's'}`
    }
  }, [])
  
  /**
   * Paste shapes from clipboard with offset
   * @param {number} baseOffsetX - Base X offset (default 20)
   * @param {number} baseOffsetY - Base Y offset (default 20)
   * @returns {Array} Array of new shape objects (without IDs - will be assigned by canvasAPI)
   */
  const paste = useCallback((baseOffsetX = 20, baseOffsetY = 20) => {
    if (clipboardRef.current.length === 0) {
      return { success: false, reason: 'clipboard_empty', shapes: [] }
    }
    
    // Increment paste count for cascading effect
    pasteCountRef.current++
    const multiplier = pasteCountRef.current
    
    const offsetX = baseOffsetX * multiplier
    const offsetY = baseOffsetY * multiplier
    
    // Create new shapes with offset and boundary clamping
    const newShapes = clipboardRef.current.map(shape => {
      const newShape = {
        ...shape,
        // ID will be assigned by canvasAPI.addShape
        // Calculate new position with offset
        x: shape.x + offsetX,
        y: shape.y + offsetY
      }
      
      // Clamp to canvas boundaries (keep 50px padding)
      const shapeWidth = shape.width || 100
      const shapeHeight = shape.height || 100
      const padding = 50
      
      // Ensure shape stays within bounds
      newShape.x = Math.max(padding, Math.min(
        newShape.x,
        CANVAS_WIDTH - shapeWidth - padding
      ))
      
      newShape.y = Math.max(padding, Math.min(
        newShape.y,
        CANVAS_HEIGHT - shapeHeight - padding
      ))
      
      return newShape
    })
    
    return { 
      success: true, 
      shapes: newShapes, 
      count: newShapes.length,
      message: `Pasted ${newShapes.length} shape${newShapes.length === 1 ? '' : 's'}`
    }
  }, [])
  
  /**
   * Check if clipboard has content
   * @returns {boolean} True if clipboard has shapes
   */
  const hasClipboard = useCallback(() => {
    return clipboardRef.current.length > 0
  }, [])
  
  /**
   * Clear clipboard
   */
  const clearClipboard = useCallback(() => {
    clipboardRef.current = []
    pasteCountRef.current = 0
  }, [])
  
  /**
   * Get clipboard size
   * @returns {number} Number of shapes in clipboard
   */
  const getClipboardSize = useCallback(() => {
    return clipboardRef.current.length
  }, [])
  
  return {
    copy,
    paste,
    hasClipboard,
    clearClipboard,
    getClipboardSize
  }
}

