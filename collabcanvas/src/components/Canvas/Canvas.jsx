import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle } from 'react-konva';
import useCanvas from '../../hooks/useCanvas';
import useShapes from '../../hooks/useShapes';
import useCursors from '../../hooks/useCursors';
import useAuth from '../../hooks/useAuth';
import Shape from './Shape';
import RemoteCursor from './RemoteCursor';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SHAPE_COLORS, SHAPE_TYPES, DEFAULT_STROKE_WIDTH } from '../../utils/constants';
import { createFPSCounter, getRandomColor } from '../../utils/helpers';

function Canvas() {
  const stageRef = useRef(null);
  const staticLayerRef = useRef(null); // For caching static grid/background
  const { user } = useAuth();
  const { position, scale, updatePosition, updateScale } = useCanvas();
  const { shapes, selectedShapeId, isLoading, addShape, addShapesBatch, updateShape, updateShapeImmediate, deleteShape, selectShape, deselectShape, lockShape, unlockShape } = useShapes(user);
  const { remoteCursors, updateMyCursor } = useCursors(user);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [fps, setFps] = useState(60);
  const fpsCounterRef = useRef(null);
  
  // Track shapes currently being dragged by this user
  const activeDragRef = useRef(null);
  
  // Canvas mode: 'pan', 'move', or 'draw'
  const [mode, setMode] = useState('pan');
  
  // Shape type: 'rectangle' or 'circle'
  const [shapeType, setShapeType] = useState(SHAPE_TYPES.RECTANGLE);
  
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

  // Enable caching on static layer for performance
  // Grid and background don't change, so we can cache them
  useEffect(() => {
    if (staticLayerRef.current) {
      staticLayerRef.current.cache();
      staticLayerRef.current.getLayer().batchDraw();
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
        case 'delete':
        case 'backspace':
          // Delete selected shape
          if (selectedShapeId) {
            e.preventDefault(); // Prevent browser back navigation on Backspace
            deleteShape(selectedShapeId);
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [deselectShape, selectedShapeId, deleteShape]);

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
      
      if (shapeType === SHAPE_TYPES.LINE) {
        // Line creation starts with single point
        setIsDrawing(true);
        setNewShape({
          x: pos.x,
          y: pos.y,
          endX: pos.x,  // Initially same as start
          endY: pos.y,
          color: getRandomColor(SHAPE_COLORS),
          type: 'line',
          strokeWidth: DEFAULT_STROKE_WIDTH
        });
      } else {
        // Rectangle/Circle creation
        setIsDrawing(true);
        setNewShape({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: getRandomColor(SHAPE_COLORS),
          type: shapeType
        });
      }
      
      // Deselect any selected shape
      deselectShape();
    }
  }

  // Handle shape creation - mouse move
  function handleMouseMove(e) {
    const stage = stageRef.current;
    const pos = stage.getRelativePointerPosition();
    
    // Always update cursor position for multiplayer cursors
    if (pos && user) {
      updateMyCursor(pos.x, pos.y);
    }
    
    // Handle shape drawing
    if (!isDrawing || !newShape) return;
    
    if (newShape.type === 'line') {
      // Update end point as mouse moves
      setNewShape({
        ...newShape,
        endX: pos.x,
        endY: pos.y
      });
    } else {
      // Rectangle/Circle - update width/height
      setNewShape({
        ...newShape,
        width: pos.x - newShape.x,
        height: pos.y - newShape.y
      });
    }
  }

  // Handle shape creation - mouse up
  async function handleMouseUp() {
    if (!isDrawing || !newShape) return;

    if (newShape.type === 'line') {
      // Calculate line length
      const length = Math.sqrt(
        Math.pow(newShape.endX - newShape.x, 2) +
        Math.pow(newShape.endY - newShape.y, 2)
      );
      
      // Only add line if it has meaningful length (>5px)
      if (length > 5) {
        try {
          await addShape({
            x: newShape.x,
            y: newShape.y,
            endX: newShape.endX,
            endY: newShape.endY,
            color: newShape.color,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            type: 'line'
          });
        } catch (error) {
          console.error('Failed to add line:', error.message);
          alert(`Failed to create line: ${error.message}`);
        }
      }
    } else {
      // Only add shape if it has meaningful size
      if (Math.abs(newShape.width) > 5 && Math.abs(newShape.height) > 5) {
        // Normalize negative dimensions
        const normalizedShape = {
          x: newShape.width < 0 ? newShape.x + newShape.width : newShape.x,
          y: newShape.height < 0 ? newShape.y + newShape.height : newShape.y,
          width: Math.abs(newShape.width),
          height: Math.abs(newShape.height),
          color: newShape.color,
          type: newShape.type
        };
        
        try {
          await addShape(normalizedShape);
        } catch (error) {
          console.error('Failed to add shape:', error.message);
          alert(`Failed to create shape: ${error.message}`);
        }
      }
    }

    setIsDrawing(false);
    setNewShape(null);
  }

  // Handle shape selection
  function handleShapeSelect(shapeId) {
    selectShape(shapeId);
    // Auto-switch to move mode when clicking a shape (for convenience)
    // This allows users to click a shape in pan mode and immediately interact with it
    if (mode !== 'move') {
      setMode('move');
    }
  }

  // Handle shape drag start
  async function handleShapeDragStart(shapeId) {
    setIsDraggingShape(true);
    
    // Lock the shape so other users can't manipulate it
    const locked = await lockShape(shapeId);
    if (locked) {
      activeDragRef.current = shapeId;
    }
  }

  // Handle shape drag move
  function handleShapeDragMove() {
    // Keep flag set during dragging
  }

  // Handle shape drag end
  async function handleShapeDragEnd(data) {
    // Use immediate update (no debounce) to prevent ghost teleport effect
    // IMPORTANT: For lines, data includes endX and endY; for rectangles/circles, just x and y
    const updates = { x: data.x, y: data.y };
    
    // If this is a line shape, include endpoint coordinates
    if (data.endX !== undefined && data.endY !== undefined) {
      updates.endX = data.endX;
      updates.endY = data.endY;
      console.log('[CANVAS] Updating line with endpoint:', updates);
    }
    
    await updateShapeImmediate(data.id, updates);
    setIsDraggingShape(false);
    
    // Unlock the shape so others can use it
    if (activeDragRef.current === data.id) {
      await unlockShape(data.id);
      activeDragRef.current = null;
    }
    
    // Keep shape selected after dragging so user can continue interacting
    // (User can click elsewhere or press Esc to deselect)
  }
  
  // Clean up any locks on unmount
  useEffect(() => {
    return () => {
      if (activeDragRef.current) {
        unlockShape(activeDragRef.current);
      }
    };
  }, [unlockShape]);

  // Handle stage click (deselect)
  function handleStageClick(e) {
    if (e.target === e.target.getStage()) {
      deselectShape();
    }
  }

  // Helper function to create multiple shapes at once (for testing/development)
  async function handleBulkCreateShapes(count) {
    const shapesToCreate = [];
    const colors = Object.values(SHAPE_COLORS);
    const shapeTypes = Object.values(SHAPE_TYPES);
    
    // Generate shapes in a grid pattern for visibility
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 150;
    const startX = 100;
    const startY = 100;
    
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      shapesToCreate.push({
        x: startX + (col * spacing),
        y: startY + (row * spacing),
        width: 80 + Math.random() * 40,
        height: 80 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)]
      });
    }
    
    try {
      console.time(`Create ${count} shapes`);
      await addShapesBatch(shapesToCreate);
      console.timeEnd(`Create ${count} shapes`);
      alert(`Successfully created ${count} shapes using batch writes!`);
    } catch (error) {
      console.error('Batch creation failed:', error);
      alert(`Failed to create shapes: ${error.message}`);
    }
  }

  // Show loading indicator while shapes are loading from Firestore
  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
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
        {/* Static Layer - Background, grid, markers (cached for performance) */}
        <Layer ref={staticLayerRef} listening={false}>
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
        </Layer>

        {/* Dynamic Layer - Shapes, cursors, and interactive elements */}
        <Layer>
          {/* Render existing shapes */}
          {shapes.map((shape) => {
            const isLockedByOther = shape.lockedBy && shape.lockedBy !== user?.uid;
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                onSelect={() => handleShapeSelect(shape.id)}
                onDragStart={() => handleShapeDragStart(shape.id)}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                isDraggable={mode === 'move'}
                isInteractive={mode !== 'draw'}
                isLockedByOther={isLockedByOther}
                currentUserId={user?.uid}
              />
            );
          })}
          
          {/* Render shape being drawn */}
          {isDrawing && newShape && (
            newShape.type === SHAPE_TYPES.LINE ? (
              <Line
                points={[newShape.x, newShape.y, newShape.endX, newShape.endY]}
                stroke={newShape.color}
                strokeWidth={DEFAULT_STROKE_WIDTH}
                opacity={0.6}
                listening={false}
              />
            ) : newShape.type === SHAPE_TYPES.CIRCLE ? (
              <Circle
                x={newShape.x + newShape.width / 2}
                y={newShape.y + newShape.height / 2}
                radius={Math.min(Math.abs(newShape.width), Math.abs(newShape.height)) / 2}
                fill={newShape.color}
                opacity={0.6}
                listening={false}
              />
            ) : (
              <Rect
                x={newShape.x}
                y={newShape.y}
                width={newShape.width}
                height={newShape.height}
                fill={newShape.color}
                opacity={0.6}
                listening={false}
              />
            )
          )}
          
          {/* Render remote cursors from other users */}
          {remoteCursors.map((cursor) => (
            <RemoteCursor
              key={cursor.id}
              cursor={cursor}
            />
          ))}
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
            border: mode === 'move' ? '2px solid #4ade80' : '1px solid rgba(255, 255, 0.2)',
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
          title="Draw Mode (D) - Click and drag to create shapes"
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
          <span style={{ fontSize: '18px' }}>
            {shapeType === SHAPE_TYPES.RECTANGLE ? '🔲' : '⚪'}
          </span>
          <span>Draw (D)</span>
        </button>
      </div>

      {/* Shape Type Toggle - Only visible in draw mode */}
      {mode === 'draw' && (
        <div style={{
          position: 'absolute',
          top: '65px',
          left: '10px',
          display: 'flex',
          gap: '8px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setShapeType(SHAPE_TYPES.RECTANGLE)}
            title="Draw Rectangles"
            style={{
              padding: '8px 14px',
              background: shapeType === SHAPE_TYPES.RECTANGLE ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: shapeType === SHAPE_TYPES.RECTANGLE ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: shapeType === SHAPE_TYPES.RECTANGLE ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: shapeType === SHAPE_TYPES.RECTANGLE ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>🔲</span>
            <span>Rectangle</span>
          </button>
          
          <button
            onClick={() => setShapeType(SHAPE_TYPES.CIRCLE)}
            title="Draw Circles"
            style={{
              padding: '8px 14px',
              background: shapeType === SHAPE_TYPES.CIRCLE ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: shapeType === SHAPE_TYPES.CIRCLE ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: shapeType === SHAPE_TYPES.CIRCLE ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: shapeType === SHAPE_TYPES.CIRCLE ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>⚪</span>
            <span>Circle</span>
          </button>
          
          <button
            onClick={() => setShapeType(SHAPE_TYPES.LINE)}
            title="Draw Lines"
            style={{
              padding: '8px 14px',
              background: shapeType === SHAPE_TYPES.LINE ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: shapeType === SHAPE_TYPES.LINE ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: shapeType === SHAPE_TYPES.LINE ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: shapeType === SHAPE_TYPES.LINE ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>📏</span>
            <span>Line</span>
          </button>
        </div>
      )}

      {/* Unified Stats Panel */}
      <div style={{
        position: 'absolute',
        top: mode === 'draw' ? '120px' : '65px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 1000,
        lineHeight: '1.8',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          color: '#a78bfa',
          letterSpacing: '0.5px'
        }}>
          📊 CANVAS STATS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ opacity: 0.7 }}>X:</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{Math.round(position.x)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ opacity: 0.7 }}>Y:</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{Math.round(position.y)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ opacity: 0.7 }}>Zoom:</span>
          <span style={{ color: '#646cff', fontWeight: 'bold' }}>{(scale * 100).toFixed(0)}%</span>
        </div>
        <div style={{ 
          height: '1px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          margin: '8px 0' 
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ opacity: 0.7 }}>Shapes:</span>
          <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{shapes.length}</span>
        </div>
        {import.meta.env.DEV && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ opacity: 0.7 }}>FPS:</span>
            <span style={{ 
              color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {fps}
            </span>
          </div>
        )}
      </div>

      {/* Bulk Shape Creation Panel (Development Only) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            color: '#f59e0b',
            letterSpacing: '0.5px'
          }}>
            🧪 BULK CREATE (DEV)
          </div>
          <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
            <button
              onClick={() => handleBulkCreateShapes(100)}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              + 100 Shapes
            </button>
            <button
              onClick={() => handleBulkCreateShapes(500)}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              + 500 Shapes
            </button>
            <button
              onClick={() => handleBulkCreateShapes(1000)}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              + 1000 Shapes
            </button>
          </div>
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
          {mode === 'pan' ? '✋ Pan Mode' : mode === 'move' ? '🔄 Move Mode' : (
            shapeType === SHAPE_TYPES.LINE ? '📏 Draw Mode' :
            shapeType === SHAPE_TYPES.CIRCLE ? '⚪ Draw Mode' :
            '🔲 Draw Mode'
          )}
        </strong>
        <br />
        <span style={{ fontSize: '13px', opacity: 0.95, lineHeight: '1.6' }}>
          {mode === 'pan' 
            ? 'Drag canvas to pan • Click shapes to select (auto-switches to Move) • Scroll to zoom'
            : mode === 'move'
            ? 'Click to select • Drag selected shapes to move or resize • Click elsewhere to deselect'
            : `Click & drag on empty space to create ${
                shapeType === SHAPE_TYPES.LINE ? 'lines' :
                shapeType === SHAPE_TYPES.CIRCLE ? 'circles' :
                'rectangles'
              } • Canvas will NOT pan`}
        </span>
        <br />
        <span style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px', display: 'block' }}>
          Shapes: {shapes.length} {selectedShapeId ? '• 1 selected' : ''} • Keyboard: V (Pan) • M (Move) • D (Draw) • Esc (Pan + Deselect) • Del/Backspace (Delete)
        </span>
      </div>
    </div>
  );
}

export default Canvas;
