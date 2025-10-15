import { Rect, Circle, Line, Transformer, Group, Text } from 'react-konva';
import { useRef, useEffect, useLayoutEffect, memo, useCallback } from 'react';
import { SHAPE_TYPES, DEFAULT_STROKE_WIDTH, DEFAULT_LINE_HIT_WIDTH, DEFAULT_FONT_SIZE, DEFAULT_FONT_WEIGHT } from '../../utils/constants';

// Memoized Shape component to prevent unnecessary re-renders
const Shape = memo(function Shape({ shape, isSelected, isMultiSelect = false, onSelect, onDragEnd, onDragStart, onDragMove, onTextEdit, isEditing = false, isDraggable = true, isInteractive = true, isLockedByOther = false, currentUserId, onNodeRef }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const lineRef = useRef(null);  // For direct line manipulation (used only for line shapes)
  const doubleClickTimerRef = useRef(null);  // Track double-click to prevent drag
  
  // Store latest onNodeRef in ref to avoid stale closures
  // CRITICAL: Use useLayoutEffect (not useEffect) to run BEFORE paint
  // This ensures onNodeRefRef is updated before any event handlers run
  // Also call registration here as backup (redundancy is fine)
  const onNodeRefRef = useRef(onNodeRef);
  useLayoutEffect(() => {
    onNodeRefRef.current = onNodeRef;
    // Also register here as backup (in case callback ref wasn't called yet)
    if (onNodeRef && shapeRef.current) {
      onNodeRef(shapeRef.current);
    }
  }, [onNodeRef]);

  // Determine shape type early (needed for useEffect)
  const shapeType = shape.type || SHAPE_TYPES.RECTANGLE;
  const isText = shapeType === SHAPE_TYPES.TEXT;
  
  // CRITICAL: Use callback ref for SYNCHRONOUS registration
  // Empty deps array ensures callback is stable (never recreates)
  // Store onNodeRef in ref to avoid stale closures
  // Pattern used by Figma, Excalidraw, and React Three Fiber
  const handleShapeRef = useCallback((node) => {
    shapeRef.current = node;
    // Call latest onNodeRef via ref (avoids stale closure)
    onNodeRefRef.current?.(node); // Immediate, synchronous registration
  }, []); // ← Empty deps! Callback is stable for component lifetime

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
      
      // For text shapes, listen to transform end on the node itself
      const node = shapeRef.current;
      if (node && isText) {
        const handleTransform = () => {
          console.log('[TEXT TRANSFORM] Transform event fired');
          
          // Get transform properties
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          // Use the average of scaleX and scaleY for font scaling
          // This gives more natural results than just using one axis
          const avgScale = (scaleX + scaleY) / 2;
          
          console.log('[TEXT TRANSFORM] Current scale:', scaleX, scaleY, 'avg:', avgScale);
          console.log('[TEXT TRANSFORM] Current dimensions:', node.width(), node.height());
          console.log('[TEXT TRANSFORM] Current fontSize:', node.fontSize());

          // Calculate new dimensions and font size
          const newWidth = Math.max(5, node.width() * scaleX);
          const newHeight = Math.max(5, node.height() * scaleY);
          const newFontSize = Math.max(8, Math.round(node.fontSize() * avgScale));

          // Reset scale to 1 (Konva best practice)
          node.scaleX(1);
          node.scaleY(1);
          
          // Update the node's fontSize immediately for visual feedback
          node.fontSize(newFontSize);

          const updates = {
            id: shape.id,
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            fontSize: newFontSize,
            rotation: node.rotation() % 360
          };
          
          console.log('[TEXT TRANSFORM] Sending updates:', updates);

          if (onDragEnd) {
            onDragEnd(updates);
          } else {
            console.log('[TEXT TRANSFORM] No onDragEnd handler!');
          }
        };
        
        node.on('transformend', handleTransform);
        
        // Cleanup
        return () => {
          node.off('transformend', handleTransform);
        };
      } else if (node && !isText && !isLine) {
        // For non-text, non-line shapes (rectangles and circles)
        const handleTransform = () => {
          console.log('[SHAPE TRANSFORM] Transform event fired for', shape.type);
          
          // Get current transform properties
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation() % 360;
          
          console.log('[SHAPE TRANSFORM] Scale:', scaleX, scaleY, 'Rotation:', rotation);
          
          // Calculate new dimensions
          const newWidth = Math.max(5, node.width() * scaleX);
          const newHeight = Math.max(5, node.height() * scaleY);
          
          // Reset scale to 1 (Konva best practice)
          node.scaleX(1);
          node.scaleY(1);
          
          const updates = {
            id: shape.id,
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: rotation
          };
          
          console.log('[SHAPE TRANSFORM] Sending updates:', updates);
          
          if (onDragEnd) {
            onDragEnd(updates);
          } else {
            console.log('[SHAPE TRANSFORM] No onDragEnd handler!');
          }
        };
        
        node.on('transformend', handleTransform);
        
        // Cleanup
        return () => {
          node.off('transformend', handleTransform);
        };
      }
    }
  }, [isSelected, isText, shape.id, onDragEnd]);

  function handleClick(e) {
    // CRITICAL: Stop ALL event propagation
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }
    
    // For text shapes, set a timer to detect potential double-click
    if (isText) {
      doubleClickTimerRef.current = true;
      setTimeout(() => {
        doubleClickTimerRef.current = false;
      }, 300); // 300ms window for double-click detection
    }
    
    // Pass the event to parent for shift-click detection
    onSelect(e);
  }

  function handleDragStart(e) {
    // For text shapes, prevent drag if we're in double-click window
    if (isText && doubleClickTimerRef.current) {
      e.target.stopDrag();
      return;
    }
    
    // CRITICAL: Stop ALL event propagation to prevent stage dragging
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    if (onDragStart) onDragStart();
  }

  function handleDragMove(e) {
    // CRITICAL: Stop event propagation during drag
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }
    
    if (onDragMove) {
      // Pass current position data for multi-select visual updates
      if (isLine) {
        // For lines, pass the group offset
        const offsetX = e.target.x();
        const offsetY = e.target.y();
        onDragMove({
          id: shape.id,
          x: shape.x + offsetX,
          y: shape.y + offsetY,
          endX: shape.endX + offsetX,
          endY: shape.endY + offsetY
        });
      } else {
        // For rectangles/circles/text, pass current position
        let newX = e.target.x();
        let newY = e.target.y();
        
        // For circles, convert center to top-left
        if (isCircle) {
          newX = newX - shape.width / 2;
          newY = newY - shape.height / 2;
        }
        
        onDragMove({
          id: shape.id,
          x: newX,
          y: newY
        });
      }
    }
  }

  function handleDragEnd(e) {
    // CRITICAL: Stop event propagation
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }
    
    if (isLine) {
      // For lines wrapped in a Group, dragging the Group applies an offset
      // e.target.x() and e.target.y() give us the Group's offset from origin
      const offsetX = e.target.x();
      const offsetY = e.target.y();
      
      console.log('[LINE GROUP DRAG END] Group offset:', offsetX, offsetY);
      console.log('[LINE GROUP DRAG END] Old coords:', shape.x, shape.y, shape.endX, shape.endY);
      
      // Apply offset to both start and end points
      const newX = shape.x + offsetX;
      const newY = shape.y + offsetY;
      const newEndX = shape.endX + offsetX;
      const newEndY = shape.endY + offsetY;
      
      console.log('[LINE GROUP DRAG END] New coords:', newX, newY, newEndX, newEndY);
      
      // Update both start and end points
      onDragEnd({
        id: shape.id,
        x: newX,
        y: newY,
        endX: newEndX,
        endY: newEndY
      });
      
      // Reset Group position to origin for next drag
      e.target.position({ x: 0, y: 0 });
    } else {
      // Get the current position from the dragged element
      let newX = e.target.x();
      let newY = e.target.y();
      
      // For circles, e.target.x/y returns the CENTER position
      // We need to convert it back to top-left corner for consistent storage
      if (isCircle) {
        newX = newX - shape.width / 2;
        newY = newY - shape.height / 2;
      }
      
      onDragEnd({
        id: shape.id,
        x: newX,
        y: newY
      });
    }
  }


  // Determine if this shape is actually draggable (not locked by another user)
  // IMPORTANT: Only allow dragging if shape is SELECTED (prevents accidental drags on click)
  const canDrag = isDraggable && isSelected && !isLockedByOther;
  const canInteract = isInteractive && !isLockedByOther;

  // Determine shape type (default to rectangle for backward compatibility)
  const isCircle = shapeType === SHAPE_TYPES.CIRCLE;
  const isLine = shapeType === SHAPE_TYPES.LINE;

  /**
   * COORDINATE SYSTEM NOTES:
   * - Storage: ALL shapes store {x, y} as TOP-LEFT corner for consistency
   * - Rendering:
   *   - Rectangles: x, y = top-left (matches storage)
   *   - Circles: x, y = center (requires conversion: centerX = x + width/2)
   * - Dragging: Circles report center position, must convert back to top-left on save
   */

  // Render line shapes
  if (isLine) {
    // CORRECT KONVA PATTERN (from Konva examples):
    // - Line uses ABSOLUTE points [x1, y1, x2, y2]
    // - Line is NOT draggable itself
    // - Anchors ARE draggable and update line points in real-time
    // - To move the whole line, wrap in a draggable Group
    const points = [shape.x, shape.y, shape.endX, shape.endY];
    
    // Calculate midpoint for lock icon
    const centerX = (shape.x + shape.endX) / 2;
    const centerY = (shape.y + shape.endY) / 2;
    
    return (
      <>
        {/* Wrapper Group - draggable to move the whole line */}
        <Group
          ref={handleShapeRef}
          draggable={canDrag}  // Always draggable when canDrag is true
          dragDistance={3}
          listening={canInteract}
          onClick={canInteract ? handleClick : undefined}
          onTap={canInteract ? handleClick : undefined}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* Main line - NOT draggable, just visual */}
          <Line
            ref={lineRef}
            id={shape.id}
            points={points}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth || DEFAULT_STROKE_WIDTH}
            hitStrokeWidth={DEFAULT_LINE_HIT_WIDTH}
            shadowColor={isSelected ? (isMultiSelect ? '#3b82f6' : '#646cff') : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowOpacity={isSelected ? 0.8 : 0}
            opacity={isLockedByOther ? 0.6 : 1}
            dash={isSelected && isMultiSelect ? [10, 5] : undefined}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
          
          {/* Lock icon at midpoint */}
          {isLockedByOther && (
            <Group
              x={centerX - 15}
              y={centerY - 35}
              listening={false}
            >
              <Rect
                x={0}
                y={0}
                width={30}
                height={30}
                fill="#ef4444"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.5}
              />
              <Text
                x={0}
                y={0}
                width={30}
                height={30}
                text="🔒"
                fontSize={18}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          )}
        </Group>
        
        {/* Endpoint anchor circles - OUTSIDE the Group, update line in real-time */}
        {/* Only show anchors for single-select (not multi-select) - Figma pattern */}
        {isSelected && !isMultiSelect && !isLockedByOther && (
          <>
            {/* Start point anchor */}
            <Circle
              key={`start-${shape.id}-${shape.x}-${shape.y}`}
              x={shape.x}
              y={shape.y}
              radius={8}
              fill="white"
              stroke="#646cff"
              strokeWidth={2}
              draggable={true}
              listening={true}
              onDragStart={(e) => {
                e.cancelBubble = true;
                if (e.evt) {
                  e.evt.stopPropagation();
                  e.evt.preventDefault();
                }
                console.log('[START ANCHOR] Drag started');
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                // Update line in real-time as anchor moves
                const newX = e.target.x();
                const newY = e.target.y();
                if (lineRef.current) {
                  lineRef.current.points([newX, newY, shape.endX, shape.endY]);
                }
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newX = e.target.x();
                const newY = e.target.y();
                
                console.log('[START ANCHOR] Drag ended. New pos:', newX, newY);
                console.log('[START ANCHOR] Keeping end at:', shape.endX, shape.endY);
                console.log('[START ANCHOR] Old start was:', shape.x, shape.y);
                
                // Update line one more time before saving
                if (lineRef.current) {
                  lineRef.current.points([newX, newY, shape.endX, shape.endY]);
                }
                
                // Save to Firestore - this will trigger re-render with new coordinates
                onDragEnd({
                  id: shape.id,
                  x: newX,
                  y: newY,
                  endX: shape.endX,
                  endY: shape.endY
                });
              }}
            />
            
            {/* End point anchor */}
            <Circle
              key={`end-${shape.id}-${shape.endX}-${shape.endY}`}
              x={shape.endX}
              y={shape.endY}
              radius={8}
              fill="white"
              stroke="#646cff"
              strokeWidth={2}
              draggable={true}
              listening={true}
              onDragStart={(e) => {
                e.cancelBubble = true;
                if (e.evt) {
                  e.evt.stopPropagation();
                  e.evt.preventDefault();
                }
                console.log('[END ANCHOR] Drag started');
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                // Update line in real-time as anchor moves
                const newEndX = e.target.x();
                const newEndY = e.target.y();
                if (lineRef.current) {
                  lineRef.current.points([shape.x, shape.y, newEndX, newEndY]);
                }
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newEndX = e.target.x();
                const newEndY = e.target.y();
                
                console.log('[END ANCHOR] Drag ended. New pos:', newEndX, newEndY);
                console.log('[END ANCHOR] Keeping start at:', shape.x, shape.y);
                console.log('[END ANCHOR] Old end was:', shape.endX, shape.endY);
                
                // Update line one more time before saving
                if (lineRef.current) {
                  lineRef.current.points([shape.x, shape.y, newEndX, newEndY]);
                }
                
                // Save to Firestore - this will trigger re-render with new coordinates
                onDragEnd({
                  id: shape.id,
                  x: shape.x,
                  y: shape.y,
                  endX: newEndX,
                  endY: newEndY
                });
              }}
            />
          </>
        )}
      </>
    );
  }
  
  // Handle double-click for text editing
  function handleDoubleClick(e) {
    if (isText && canInteract) {
      // Clear the double-click timer immediately
      doubleClickTimerRef.current = false;
      
      e.cancelBubble = true;
      if (e.evt) {
        e.evt.stopPropagation();
        e.evt.preventDefault();
      }
      
      // Stop any drag that might have started
      if (e.target && e.target.stopDrag) {
        e.target.stopDrag();
      }
      
      // Call parent's text edit handler
      if (onTextEdit) {
        onTextEdit(shape.id, shape.text);
      }
    }
  }
  
  // Render text shapes
  if (isText) {
    return (
      <>
        <Group>
          <Text
            ref={handleShapeRef}
            id={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            text={shape.text}
            fontSize={shape.fontSize || DEFAULT_FONT_SIZE}
            fontFamily="Arial"
            fontStyle={shape.fontWeight || DEFAULT_FONT_WEIGHT}
            fill={shape.color}
            align="left"
            verticalAlign="top"
            wrap="word"
            lineHeight={1.2}
            draggable={canDrag && !isEditing}
            dragDistance={3}
            listening={canInteract && !isEditing}
            onClick={canInteract && !isEditing ? handleClick : undefined}
            onTap={canInteract && !isEditing ? handleClick : undefined}
            onDblClick={canInteract && !isEditing ? handleDoubleClick : undefined}
            onDblTap={canInteract && !isEditing ? handleDoubleClick : undefined}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            // Selection styling (darker for multi-select)
            shadowColor={isSelected ? (isMultiSelect ? '#3b82f6' : '#646cff') : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowOpacity={isSelected ? 0.8 : 0}
            opacity={isEditing ? 0 : isLockedByOther ? 0.6 : 1}
            // Performance
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
          
          {/* Lock icon at top-left */}
          {isLockedByOther && (
            <Group
              x={shape.x - 15}
              y={shape.y - 35}
              listening={false}
            >
              <Rect
                x={0}
                y={0}
                width={30}
                height={30}
                fill="#ef4444"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.5}
              />
              <Text
                x={0}
                y={0}
                width={30}
                height={30}
                text="🔒"
                fontSize={18}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          )}
        </Group>
        
        {/* Transformer for selected text (hide during editing) */}
        {isSelected && !isLockedByOther && !isEditing && (
          <Transformer
            ref={transformerRef}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={false}  // No rotation for now
            borderStroke="#646cff"
            borderStrokeWidth={2}
          />
        )}
      </>
    );
  }
  
  // Common shape props for rectangles and circles
  const commonProps = {
    ref: handleShapeRef,
    id: shape.id,
    fill: shape.color,
    draggable: canDrag,
    dragDistance: 3, // Require 3px movement before starting drag (prevents accidental drags on click)
    listening: canInteract,
    onClick: canInteract ? handleClick : undefined,
    onTap: canInteract ? handleClick : undefined,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    // Multi-select: darker blue with dashed border
    stroke: isSelected ? (isMultiSelect ? '#3b82f6' : '#646cff') : isLockedByOther ? '#ef4444' : undefined,
    strokeWidth: isSelected ? 3 : isLockedByOther ? 2 : 0,
    dash: isSelected && isMultiSelect ? [10, 5] : undefined,
    shadowColor: isSelected ? '#646cff' : undefined,
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.5 : 0,
    opacity: isLockedByOther ? 0.6 : isInteractive ? 1 : 0.7,
  };

  return (
    <>
      <Group>
        {isCircle ? (
          <Circle
            {...commonProps}
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
            radius={Math.min(shape.width, shape.height) / 2}
          />
        ) : (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
          />
        )}
        
        {/* Lock icon when locked by another user */}
        {isLockedByOther && (
          <Group
            x={shape.x + shape.width / 2 - 15}
            y={shape.y - 35}
            listening={false}
          >
            {/* Lock background */}
            <Rect
              x={0}
              y={0}
              width={30}
              height={30}
              fill="#ef4444"
              cornerRadius={6}
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.5}
            />
            {/* Lock icon (🔒) */}
            <Text
              x={0}
              y={0}
              width={30}
              height={30}
              text="🔒"
              fontSize={18}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}
      </Group>
      
      {isSelected && !isLockedByOther && (
        <Transformer
          ref={transformerRef}
          borderStroke="#646cff"
          borderStrokeWidth={2}
          anchorStroke="#646cff"
          anchorFill="white"
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Line-specific comparison
  if (prevProps.shape.type === 'line' && nextProps.shape.type === 'line') {
    return (
      prevProps.shape.id === nextProps.shape.id &&
      prevProps.shape.x === nextProps.shape.x &&
      prevProps.shape.y === nextProps.shape.y &&
      prevProps.shape.endX === nextProps.shape.endX &&
      prevProps.shape.endY === nextProps.shape.endY &&
      prevProps.shape.color === nextProps.shape.color &&
      prevProps.shape.strokeWidth === nextProps.shape.strokeWidth &&
      prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isMultiSelect === nextProps.isMultiSelect &&
      prevProps.isDraggable === nextProps.isDraggable &&
      prevProps.isInteractive === nextProps.isInteractive &&
      prevProps.isLockedByOther === nextProps.isLockedByOther
    );
  }
  
  // Text-specific comparison
  if (prevProps.shape.type === 'text' && nextProps.shape.type === 'text') {
    return (
      prevProps.shape.id === nextProps.shape.id &&
      prevProps.shape.x === nextProps.shape.x &&
      prevProps.shape.y === nextProps.shape.y &&
      prevProps.shape.width === nextProps.shape.width &&
      prevProps.shape.height === nextProps.shape.height &&
      prevProps.shape.text === nextProps.shape.text &&
      prevProps.shape.fontSize === nextProps.shape.fontSize &&
      prevProps.shape.fontWeight === nextProps.shape.fontWeight &&
      prevProps.shape.color === nextProps.shape.color &&
      prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isMultiSelect === nextProps.isMultiSelect &&
      prevProps.isDraggable === nextProps.isDraggable &&
      prevProps.isInteractive === nextProps.isInteractive &&
      prevProps.isLockedByOther === nextProps.isLockedByOther
    );
  }
  
  // Rectangle/Circle comparison
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.color === nextProps.shape.color &&
    prevProps.shape.type === nextProps.shape.type &&
    prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMultiSelect === nextProps.isMultiSelect &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isInteractive === nextProps.isInteractive &&
    prevProps.isLockedByOther === nextProps.isLockedByOther
  );
});

export default Shape;
