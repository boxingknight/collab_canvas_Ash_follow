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
      // FIX #1: With relative points + absolute positioning, dragging is simple
      // The Line's x, y position is now its absolute start point
      const newX = e.target.x();
      const newY = e.target.y();
      
      // Calculate the relative offset (length and direction of line)
      const deltaX = shape.endX - shape.x;
      const deltaY = shape.endY - shape.y;
      
      // Apply the same relative offset to the new position
      onDragEnd({
        id: shape.id,
        x: newX,
        y: newY,
        endX: newX + deltaX,  // Maintain the same relative endpoint
        endY: newY + deltaY
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
    // FIX #1: Use RELATIVE points with ABSOLUTE positioning
    // This prevents lines from changing length/angle when dragged
    const points = [
      0,                       // Start at origin (relative to x, y)
      0,
      shape.endX - shape.x,    // Relative endpoint
      shape.endY - shape.y
    ];
    
    // Calculate midpoint for lock icon (relative to line position)
    const midX = (shape.endX - shape.x) / 2;
    const midY = (shape.endY - shape.y) / 2;
    
    return (
      <>
        <Group>
          <Line
            ref={shapeRef}
            id={shape.id}
            x={shape.x}              // Position absolutely
            y={shape.y}              // Position absolutely
            points={points}          // Points are relative to x, y
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
          
          {/* Lock icon at midpoint (relative to line position) */}
          {isLockedByOther && (
            <Group
              x={shape.x + midX - 15}
              y={shape.y + midY - 35}
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
        
        {/* FIX #2: Add endpoint anchor circles for line adjustment */}
        {isSelected && !isLockedByOther && (
          <>
            {/* Transformer (no anchors, just visual border) */}
            <Transformer
              ref={transformerRef}
              enabledAnchors={[]}
              rotateEnabled={false}
              borderStroke="#646cff"
              borderStrokeWidth={2}
            />
            
            {/* Start point anchor */}
            <Circle
              x={shape.x}
              y={shape.y}
              radius={6}
              fill="white"
              stroke="#646cff"
              strokeWidth={2}
              draggable={true}
              dragDistance={0}
              onDragMove={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newX = e.target.x();
                const newY = e.target.y();
                
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
              radius={6}
              fill="white"
              stroke="#646cff"
              strokeWidth={2}
              draggable={true}
              dragDistance={0}
              onDragMove={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                
                const newEndX = e.target.x();
                const newEndY = e.target.y();
                
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
