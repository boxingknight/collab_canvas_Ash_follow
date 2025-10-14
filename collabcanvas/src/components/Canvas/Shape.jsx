import { Rect, Transformer } from 'react-konva';
import { useRef, useEffect, memo } from 'react';

// Memoized Shape component to prevent unnecessary re-renders
const Shape = memo(function Shape({ shape, isSelected, onSelect, onDragEnd, onDragStart, onDragMove, isDraggable = true, isInteractive = true }) {
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

  return (
    <>
      <Rect
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.color}
        draggable={isDraggable}
        listening={isInteractive}
        onClick={isInteractive ? handleClick : undefined}
        onTap={isInteractive ? handleClick : undefined}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        stroke={isSelected ? '#646cff' : undefined}
        strokeWidth={isSelected ? 3 : 0}
        shadowColor={isSelected ? '#646cff' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
        opacity={isInteractive ? 1 : 0.7}
      />
      {isSelected && (
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
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isInteractive === nextProps.isInteractive
  );
});

export default Shape;
