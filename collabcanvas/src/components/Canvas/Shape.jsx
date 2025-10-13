import { Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

function Shape({ shape, isSelected, onSelect, onDragEnd }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  function handleDragEnd(e) {
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
        onClick={onSelect}
        onTap={onSelect}
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
