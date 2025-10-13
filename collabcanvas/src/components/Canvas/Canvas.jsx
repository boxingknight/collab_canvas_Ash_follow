import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle } from 'react-konva';
import useCanvas from '../../hooks/useCanvas';
import useShapes from '../../hooks/useShapes';
import Shape from './Shape';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SHAPE_COLORS } from '../../utils/constants';
import { createFPSCounter, getRandomColor } from '../../utils/helpers';

function Canvas() {
  const stageRef = useRef(null);
  const { position, scale, updatePosition, updateScale } = useCanvas();
  const { shapes, selectedShapeId, addShape, updateShape, selectShape, deselectShape } = useShapes();
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [fps, setFps] = useState(60);
  const fpsCounterRef = useRef(null);
  
  // Canvas mode: 'pan', 'move', or 'draw'
  const [mode, setMode] = useState('pan');
  
  // Shape creation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState(null);
  
  // Shape dragging state
  const [isDraggingShape, setIsDraggingShape] = useState(false);

  // Generate grid lines
  const gridSize = 100; // Grid cell size
  const gridLines = [];
  
  // Vertical lines
  for (let i = 0; i <= CANVAS_WIDTH / gridSize; i++) {
    const x = i * gridSize;
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, CANVAS_HEIGHT]}
        stroke={i % 5 === 0 ? '#444' : '#2a2a2a'}
        strokeWidth={i % 5 === 0 ? 2 : 1}
        listening={false}
      />
    );
  }
  
  // Horizontal lines
  for (let i = 0; i <= CANVAS_HEIGHT / gridSize; i++) {
    const y = i * gridSize;
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, CANVAS_WIDTH, y]}
        stroke={i % 5 === 0 ? '#444' : '#2a2a2a'}
        strokeWidth={i % 5 === 0 ? 2 : 1}
        listening={false}
      />
    );
  }

  // Initialize FPS counter in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      fpsCounterRef.current = createFPSCounter();
      
      const updateFPS = () => {
        if (fpsCounterRef.current) {
          const currentFps = fpsCounterRef.current();
          setFps(currentFps);
        }
        requestAnimationFrame(updateFPS);
      };
      
      const animationId = requestAnimationFrame(updateFPS);
      return () => cancelAnimationFrame(animationId);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e) {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case 'v':
          setMode('pan');
          break;
        case 'm':
          setMode('move');
          break;
        case 'd':
          setMode('draw');
          break;
        case 'escape':
          setMode('pan');
          deselectShape();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [deselectShape]);

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle pan (drag)
  function handleDragStart(e) {
    // CRITICAL: Only allow Stage drag in pan mode
    if (mode !== 'pan') {
      e.target.stopDrag();
      return;
    }
  }

  function handleDragEnd(e) {
    // CRITICAL: Only update position in pan mode
    if (mode !== 'pan') {
      return;
    }
    updatePosition({
      x: e.target.x(),
      y: e.target.y()
    });
  }

  // Handle zoom (wheel)
  function handleWheel(e) {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate zoom direction and factor
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1.1;
    const newScale = direction > 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

    // Calculate new position to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    };

    updateScale(newScale);
    updatePosition(newPos);
  }

  // Handle shape creation - mouse down
  function handleMouseDown(e) {
    // Only create shapes in 'draw' mode and when clicking on the stage (empty canvas)
    if (mode === 'draw' && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      const pos = stage.getRelativePointerPosition();
      
      setIsDrawing(true);
      setNewShape({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color: getRandomColor(SHAPE_COLORS)
      });
      
      // Deselect any selected shape
      deselectShape();
    }
  }

  // Handle shape creation - mouse move
  function handleMouseMove(e) {
    if (!isDrawing || !newShape) return;

    const stage = stageRef.current;
    const pos = stage.getRelativePointerPosition();
    
    setNewShape({
      ...newShape,
      width: pos.x - newShape.x,
      height: pos.y - newShape.y
    });
  }

  // Handle shape creation - mouse up
  function handleMouseUp() {
    if (!isDrawing || !newShape) return;

    // Only add shape if it has meaningful size
    if (Math.abs(newShape.width) > 5 && Math.abs(newShape.height) > 5) {
      // Normalize negative dimensions
      const normalizedShape = {
        x: newShape.width < 0 ? newShape.x + newShape.width : newShape.x,
        y: newShape.height < 0 ? newShape.y + newShape.height : newShape.y,
        width: Math.abs(newShape.width),
        height: Math.abs(newShape.height),
        color: newShape.color
      };
      
      addShape(normalizedShape);
    }

    setIsDrawing(false);
    setNewShape(null);
  }

  // Handle shape selection
  function handleShapeSelect(shapeId) {
    selectShape(shapeId);
    // Auto-switch to move mode when clicking a shape
    if (mode !== 'move') {
      setMode('move');
    }
  }

  // Handle shape drag start
  function handleShapeDragStart() {
    setIsDraggingShape(true);
  }

  // Handle shape drag move
  function handleShapeDragMove() {
    // Keep flag set during dragging
  }

  // Handle shape drag end
  function handleShapeDragEnd(data) {
    updateShape(data.id, { x: data.x, y: data.y });
    setIsDraggingShape(false);
  }

  // Handle stage click (deselect)
  function handleStageClick(e) {
    if (e.target === e.target.getStage()) {
      deselectShape();
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        draggable={mode === 'pan'}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        style={{ 
          cursor: isDrawing ? 'crosshair' 
                : mode === 'draw' ? 'crosshair'
                : mode === 'move' ? 'move'
                : isDraggingShape ? 'grabbing'
                : 'grab' 
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#1a1a1a"
            listening={false}
          />
          
          {/* Grid lines */}
          {gridLines}
          
          {/* Origin marker (0, 0) */}
          <Circle
            x={0}
            y={0}
            radius={10}
            fill="#646cff"
            listening={false}
          />
          <Text
            x={15}
            y={-8}
            text="Origin (0, 0)"
            fontSize={16}
            fill="#646cff"
            listening={false}
          />
          
          {/* Canvas bounds markers */}
          <Circle
            x={CANVAS_WIDTH}
            y={0}
            radius={8}
            fill="#4ade80"
            listening={false}
          />
          <Text
            x={CANVAS_WIDTH - 120}
            y={-8}
            text={`(${CANVAS_WIDTH}, 0)`}
            fontSize={14}
            fill="#4ade80"
            listening={false}
          />
          
          <Circle
            x={0}
            y={CANVAS_HEIGHT}
            radius={8}
            fill="#fbbf24"
            listening={false}
          />
          <Text
            x={15}
            y={CANVAS_HEIGHT - 8}
            text={`(0, ${CANVAS_HEIGHT})`}
            fontSize={14}
            fill="#fbbf24"
            listening={false}
          />
          
          <Circle
            x={CANVAS_WIDTH}
            y={CANVAS_HEIGHT}
            radius={8}
            fill="#f87171"
            listening={false}
          />
          <Text
            x={CANVAS_WIDTH - 150}
            y={CANVAS_HEIGHT - 8}
            text={`(${CANVAS_WIDTH}, ${CANVAS_HEIGHT})`}
            fontSize={14}
            fill="#f87171"
            listening={false}
          />
          
          {/* Center marker */}
          <Circle
            x={CANVAS_WIDTH / 2}
            y={CANVAS_HEIGHT / 2}
            radius={12}
            fill="#a78bfa"
            listening={false}
          />
          <Text
            x={CANVAS_WIDTH / 2 + 20}
            y={CANVAS_HEIGHT / 2 - 10}
            text="Center"
            fontSize={18}
            fill="#a78bfa"
            fontStyle="bold"
            listening={false}
          />
          
          {/* Render existing shapes */}
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedShapeId}
              onSelect={() => handleShapeSelect(shape.id)}
              onDragStart={handleShapeDragStart}
              onDragMove={handleShapeDragMove}
              onDragEnd={handleShapeDragEnd}
              isDraggable={mode === 'move'}
              isInteractive={mode !== 'draw'}
            />
          ))}
          
          {/* Render shape being drawn */}
          {isDrawing && newShape && (
            <Rect
              x={newShape.x}
              y={newShape.y}
              width={newShape.width}
              height={newShape.height}
              fill={newShape.color}
              opacity={0.6}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Mode Toggle */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setMode('pan')}
          title="Pan Mode (V) - Drag canvas to pan, click shapes to select"
          style={{
            padding: '10px 16px',
            background: mode === 'pan' ? 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: mode === 'pan' ? '2px solid #646cff' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: mode === 'pan' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: mode === 'pan' ? '0 4px 12px rgba(100, 108, 255, 0.4)' : 'none'
          }}
        >
          <span style={{ fontSize: '18px' }}>✋</span>
          <span>Pan (V)</span>
        </button>
        
        <button
          onClick={() => setMode('move')}
          title="Move Mode (M) - Drag shapes to move them"
          style={{
            padding: '10px 16px',
            background: mode === 'move' ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: mode === 'move' ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: mode === 'move' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: mode === 'move' ? '0 4px 12px rgba(74, 222, 128, 0.4)' : 'none'
          }}
        >
          <span style={{ fontSize: '18px' }}>🔄</span>
          <span>Move (M)</span>
        </button>
        
        <button
          onClick={() => setMode('draw')}
          title="Draw Mode (D) - Click and drag to create rectangles"
          style={{
            padding: '10px 16px',
            background: mode === 'draw' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: mode === 'draw' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: mode === 'draw' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: mode === 'draw' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
          }}
        >
          <span style={{ fontSize: '18px' }}>🔲</span>
          <span>Draw (D)</span>
        </button>
      </div>

      {/* Position and Zoom Indicator */}
      <div style={{
        position: 'absolute',
        top: '65px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 1000,
        lineHeight: '1.5'
      }}>
        <div>X: <span style={{ color: '#4ade80' }}>{Math.round(position.x)}</span></div>
        <div>Y: <span style={{ color: '#fbbf24' }}>{Math.round(position.y)}</span></div>
        <div>Zoom: <span style={{ color: '#646cff' }}>{(scale * 100).toFixed(0)}%</span></div>
      </div>

      {/* FPS Counter (dev mode only) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1000
        }}>
          FPS: {fps}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '14px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        border: '2px solid ' + (mode === 'pan' ? '#646cff' : mode === 'move' ? '#4ade80' : '#f59e0b'),
        zIndex: 1000,
        textAlign: 'center',
        maxWidth: '550px'
      }}>
        <strong style={{ fontSize: '16px' }}>
          {mode === 'pan' ? '✋ Pan Mode' : mode === 'move' ? '🔄 Move Mode' : '🔲 Draw Mode'}
        </strong>
        <br />
        <span style={{ fontSize: '13px', opacity: 0.95, lineHeight: '1.6' }}>
          {mode === 'pan' 
            ? 'Drag canvas to pan • Click shapes to select (auto-switches to Move) • Scroll to zoom'
            : mode === 'move'
            ? 'Drag selected shapes to move • Click other shapes to select • Canvas will NOT pan'
            : 'Click & drag on empty space to create rectangles • Canvas will NOT pan'}
        </span>
        <br />
        <span style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px', display: 'block' }}>
          Shapes: {shapes.length} {selectedShapeId ? '• 1 selected' : ''} • Keyboard: V (Pan) • M (Move) • D (Draw) • Esc (Pan + Deselect)
        </span>
      </div>
    </div>
  );
}

export default Canvas;
