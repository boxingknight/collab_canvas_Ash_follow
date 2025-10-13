import { Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

function Shape({ shape, isSelected, onSelect, onDragEnd, onDragStart, onDragMove }) {
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
    // Stop event propagation to prevent stage click
    e.cancelBubble = true;
    onSelect();
  }

  function handleDragStart(e) {
    // Stop event propagation to prevent stage dragging
    e.cancelBubble = true;
    if (onDragStart) onDragStart();
  }

  function handleDragMove(e) {
    // Stop event propagation during drag
    e.cancelBubble = true;
    if (onDragMove) onDragMove();
  }

  function handleDragEnd(e) {
    // Stop event propagation
    e.cancelBubble = true;
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
        draggable
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        stroke={isSelected ? '#646cff' : undefined}
        strokeWidth={isSelected ? 3 : 0}
        shadowColor={isSelected ? '#646cff' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
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
}

export default Shape;
