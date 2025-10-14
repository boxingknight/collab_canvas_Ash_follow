import { Rect, Circle, Line, Transformer, Group, Text } from 'react-konva';
import { useRef, useEffect, memo } from 'react';
import { SHAPE_TYPES, DEFAULT_STROKE_WIDTH, DEFAULT_LINE_HIT_WIDTH, DEFAULT_FONT_SIZE, DEFAULT_FONT_WEIGHT } from '../../utils/constants';

// Memoized Shape component to prevent unnecessary re-renders
const Shape = memo(function Shape({ shape, isSelected, onSelect, onDragEnd, onDragStart, onDragMove, onTextEdit, isEditing = false, isDraggable = true, isInteractive = true, isLockedByOther = false, currentUserId }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const lineRef = useRef(null);  // For direct line manipulation (used only for line shapes)
  const doubleClickTimerRef = useRef(null);  // Track double-click to prevent drag

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

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
    
    onSelect();
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
    if (onDragMove) onDragMove();
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

  function handleTransformEnd(e) {
    // Handle transform (resize) for text shapes
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    const updates = {
      id: shape.id,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY)
    };

    if (onDragEnd) {
      onDragEnd(updates);
    }
  }

  // Determine if this shape is actually draggable (not locked by another user)
  // IMPORTANT: Only allow dragging if shape is SELECTED (prevents accidental drags on click)
  const canDrag = isDraggable && isSelected && !isLockedByOther;
  const canInteract = isInteractive && !isLockedByOther;

  // Determine shape type (default to rectangle for backward compatibility)
  const shapeType = shape.type || SHAPE_TYPES.RECTANGLE;
  const isCircle = shapeType === SHAPE_TYPES.CIRCLE;
  const isLine = shapeType === SHAPE_TYPES.LINE;
  const isText = shapeType === SHAPE_TYPES.TEXT;

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
          ref={shapeRef}
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
            shadowColor={isSelected ? '#646cff' : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowOpacity={isSelected ? 0.8 : 0}
            opacity={isLockedByOther ? 0.6 : 1}
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
        {isSelected && !isLockedByOther && (
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
            ref={shapeRef}
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
            onTransformEnd={handleTransformEnd}
            // Selection styling
            shadowColor={isSelected ? '#646cff' : undefined}
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
    ref: shapeRef,
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
    stroke: isSelected ? '#646cff' : isLockedByOther ? '#ef4444' : undefined,
    strokeWidth: isSelected ? 3 : isLockedByOther ? 2 : 0,
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
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isInteractive === nextProps.isInteractive &&
    prevProps.isLockedByOther === nextProps.isLockedByOther
  );
});

export default Shape;
