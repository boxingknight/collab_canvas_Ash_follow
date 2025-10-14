import { Rect, Transformer, Group, Text } from 'react-konva';
import { useRef, useEffect, memo } from 'react';

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
    onDragEnd({
      id: shape.id,
      x: e.target.x(),
      y: e.target.y()
    });
  }

  // Determine if this shape is actually draggable (not locked by another user)
  const canDrag = isDraggable && !isLockedByOther;
  const canInteract = isInteractive && !isLockedByOther;

  return (
    <>
      <Group>
        <Rect
          ref={shapeRef}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.color}
          draggable={canDrag}
          listening={canInteract}
          onClick={canInteract ? handleClick : undefined}
          onTap={canInteract ? handleClick : undefined}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          stroke={isSelected ? '#646cff' : isLockedByOther ? '#ef4444' : undefined}
          strokeWidth={isSelected ? 3 : isLockedByOther ? 2 : 0}
          shadowColor={isSelected ? '#646cff' : undefined}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={isSelected ? 0.5 : 0}
          opacity={isLockedByOther ? 0.6 : isInteractive ? 1 : 0.7}
        />
        
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
  // Only re-render if these props change
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.color === nextProps.shape.color &&
    prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isInteractive === nextProps.isInteractive &&
    prevProps.isLockedByOther === nextProps.isLockedByOther
  );
});

export default Shape;
