import { Rect, Circle, Line, Transformer, Group, Text } from 'react-konva';
import { useRef, useEffect, memo } from 'react';
import { SHAPE_TYPES, DEFAULT_STROKE_WIDTH, DEFAULT_LINE_HIT_WIDTH } from '../../utils/constants';

// Memoized Shape component to prevent unnecessary re-renders
const Shape = memo(function Shape({ shape, isSelected, onSelect, onDragEnd, onDragStart, onDragMove, isDraggable = true, isInteractive = true, isLockedByOther = false, currentUserId }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);

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
    onSelect();
  }

  function handleDragStart(e) {
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
      // For lines with absolute points, dragging applies an offset
      // e.target.x() and e.target.y() give the drag offset
      const offsetX = e.target.x();
      const offsetY = e.target.y();
      
      console.log('[LINE DRAG END] Offset:', offsetX, offsetY);
      console.log('[LINE DRAG END] Old coords:', shape.x, shape.y, shape.endX, shape.endY);
      
      // Calculate new absolute coordinates
      const newX = shape.x + offsetX;
      const newY = shape.y + offsetY;
      const newEndX = shape.endX + offsetX;
      const newEndY = shape.endY + offsetY;
      
      console.log('[LINE DRAG END] New coords:', newX, newY, newEndX, newEndY);
      
      // Apply offset to all coordinates (both start and end points)
      onDragEnd({
        id: shape.id,
        x: newX,
        y: newY,
        endX: newEndX,
        endY: newEndY
      });
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
  const shapeType = shape.type || SHAPE_TYPES.RECTANGLE;
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
    // SIMPLIFIED APPROACH: Just make the Line itself draggable
    // Store absolute coordinates, handle drag offset properly
    const points = [shape.x, shape.y, shape.endX, shape.endY];
    
    // Calculate midpoint for lock icon
    const centerX = (shape.x + shape.endX) / 2;
    const centerY = (shape.y + shape.endY) / 2;
    
    return (
      <>
        {/* Main line - draggable */}
        <Line
          ref={shapeRef}
          id={shape.id}
          points={points}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth || DEFAULT_STROKE_WIDTH}
          hitStrokeWidth={DEFAULT_LINE_HIT_WIDTH}
          draggable={canDrag}
          dragDistance={3}
          listening={canInteract}
          onClick={canInteract ? handleClick : undefined}
          onTap={canInteract ? handleClick : undefined}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
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
        
        {/* Endpoint anchor circles for line adjustment - NO TRANSFORMER */}
        {isSelected && !isLockedByOther && (
          <>
            {/* Start point anchor */}
            <Circle
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
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newX = e.target.x();
                const newY = e.target.y();
                
                console.log('[START ANCHOR] Drag ended. New pos:', newX, newY);
                console.log('[START ANCHOR] Keeping end at:', shape.endX, shape.endY);
                
                // Update line start point, keep end fixed
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
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newEndX = e.target.x();
                const newEndY = e.target.y();
                
                console.log('[END ANCHOR] Drag ended. New pos:', newEndX, newEndY);
                console.log('[END ANCHOR] Keeping start at:', shape.x, shape.y);
                
                // Update line end point, keep start fixed
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
