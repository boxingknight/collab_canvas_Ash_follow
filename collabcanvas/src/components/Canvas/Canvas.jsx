import { useRef, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle } from 'react-konva';
import useCanvas from '../../hooks/useCanvas';
import useShapes from '../../hooks/useShapes';
import useCursors from '../../hooks/useCursors';
import useAuth from '../../hooks/useAuth';
import useSelection from '../../hooks/useSelection';
import useKeyboard from '../../hooks/useKeyboard';
import { setCurrentSelection as updateSelectionBridge } from '../../services/selectionBridge';
import Shape from './Shape';
import RemoteCursor from './RemoteCursor';
import ContextMenu from './ContextMenu';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SHAPE_COLORS, SHAPE_TYPES, DEFAULT_STROKE_WIDTH, DEFAULT_FONT_SIZE, DEFAULT_FONT_WEIGHT, DEFAULT_TEXT, MIN_TEXT_WIDTH, MIN_TEXT_HEIGHT } from '../../utils/constants';
import { createFPSCounter, getRandomColor } from '../../utils/helpers';

function Canvas() {
  const stageRef = useRef(null);
  const staticLayerRef = useRef(null); // For caching static grid/background
  const { user } = useAuth();
  const { position, scale, updatePosition, updateScale } = useCanvas();
  const { shapes, isLoading, addShape, addShapesBatch, updateShape, updateShapeImmediate, deleteShape, lockShape, unlockShape, duplicateShapes, bringForward, sendBackward, bringToFront, sendToBack } = useShapes(user);
  const { remoteCursors, updateMyCursor } = useCursors(user);
  const { 
    selectedShapeIds, 
    toggleSelection, 
    setSelection, 
    clearSelection, 
    selectAll, 
    isSelected,
    selectionCount,
    hasSelection,
    isMultiSelect,
    selectedShapeId // For backward compatibility
  } = useSelection();
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [fps, setFps] = useState(60);
  const fpsCounterRef = useRef(null);
  
  // Sort shapes by zIndex for proper rendering order
  // Shapes with higher zIndex render on top (appear in front)
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => {
      const aZ = a.zIndex ?? 0;
      const bZ = b.zIndex ?? 0;
      if (aZ !== bZ) return aZ - bZ;
      // Stable sort by creation time for shapes with same zIndex
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return aTime - bTime;
    });
  }, [shapes]);

  // Sync selection to selection bridge (for AI access)
  useEffect(() => {
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    updateSelectionBridge(selectedShapeIds, selectedShapes);
  }, [selectedShapeIds, shapes]);
  
  // Track shapes currently being dragged by this user
  const activeDragRef = useRef(null);
  
  // Track initial positions of all shapes during multi-select drag
  const initialPositionsRef = useRef(null);
  
  // Store refs to all shape Konva nodes for direct manipulation during drag
  const shapeNodesRef = useRef({});
  
  // Canvas mode: 'pan', 'move', or 'draw'
  const [mode, setMode] = useState('pan');
  
  // Marquee selection state (drag-to-select multiple shapes)
  const marqueeStartRef = useRef(null);
  const marqueeCurrentRef = useRef(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const justFinishedMarqueeRef = useRef(false); // Prevent stage click from clearing selection after marquee
  const justFinishedDragRef = useRef(false); // Prevent stage click from clearing selection after shape drag
  
  // Shape type: 'rectangle' or 'circle'
  const [shapeType, setShapeType] = useState(SHAPE_TYPES.RECTANGLE);
  
  // Shape creation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState(null);
  
  // Shape dragging state
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const isDraggingShapeRef = useRef(false); // Ref for synchronous access (avoids React state timing issues)
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const textareaRef = useRef(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });

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

  // Helper: Check if a shape intersects with marquee selection rectangle
  function isShapeInMarquee(shape, marqueeBox) {
    // Calculate shape bounding box based on type
    let shapeBox;
    
    if (shape.type === 'line') {
      // For lines, create bounding box from start and end points
      const minX = Math.min(shape.x, shape.endX);
      const minY = Math.min(shape.y, shape.endY);
      const maxX = Math.max(shape.x, shape.endX);
      const maxY = Math.max(shape.y, shape.endY);
      shapeBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    } else {
      // For rectangles, circles, and text: use x, y, width, height
      shapeBox = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
    
    // AABB (Axis-Aligned Bounding Box) intersection test
    return !(
      marqueeBox.x > shapeBox.x + shapeBox.width ||
      marqueeBox.x + marqueeBox.width < shapeBox.x ||
      marqueeBox.y > shapeBox.y + shapeBox.height ||
      marqueeBox.y + marqueeBox.height < shapeBox.y
    );
  }
  
  // Handle pan (drag)
  function handleDragStart(e) {
    // CRITICAL: Only allow Stage drag in pan mode (and not during marquee)
    if (mode !== 'pan' || isMarqueeActive) {
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
    const isClickingStage = e.target === e.target.getStage();
    
    // MARQUEE SELECTION: Only in 'move' mode (not pan mode - that's for panning canvas)
    if (isClickingStage && mode === 'move' && !isDrawing) {
      const stage = stageRef.current;
      const pos = stage.getRelativePointerPosition();
      
      // Store start position
      marqueeStartRef.current = { x: pos.x, y: pos.y };
      marqueeCurrentRef.current = { x: pos.x, y: pos.y };
      setIsMarqueeActive(true);
      
      // Clear selection if not holding Shift (Shift = add to selection)
      if (!e.evt.shiftKey) {
        clearSelection();
      }
      
      // Prevent stage drag during marquee
      e.target.stopDrag();
      return;
    }
    
    // SHAPE CREATION: Only in 'draw' mode and when clicking on the stage (empty canvas)
    if (mode === 'draw' && isClickingStage) {
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
        // Rectangle/Circle/Text creation - click and drag to size
        const initialState = {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: getRandomColor(SHAPE_COLORS),
          type: shapeType
        };
        
        // Add text-specific properties
        if (shapeType === SHAPE_TYPES.TEXT) {
          initialState.text = DEFAULT_TEXT;
          initialState.fontSize = DEFAULT_FONT_SIZE;
          initialState.fontWeight = DEFAULT_FONT_WEIGHT;
        }
        
        setIsDrawing(true);
        setNewShape(initialState);
      }
      
      // Deselect any selected shapes
      clearSelection();
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
    
    // MARQUEE SELECTION: Update rectangle and detect intersections
    if (isMarqueeActive && marqueeStartRef.current) {
      marqueeCurrentRef.current = { x: pos.x, y: pos.y };
      
      // Calculate marquee bounding box (normalized for negative drags)
      const marqueeBox = {
        x: Math.min(marqueeStartRef.current.x, pos.x),
        y: Math.min(marqueeStartRef.current.y, pos.y),
        width: Math.abs(pos.x - marqueeStartRef.current.x),
        height: Math.abs(pos.y - marqueeStartRef.current.y)
      };
      
      // Find all shapes that intersect with marquee
      const intersectingShapeIds = shapes
        .filter(shape => isShapeInMarquee(shape, marqueeBox))
        .map(shape => shape.id);
      
      // Update selection (merge with existing if Shift was held)
      if (e.evt.shiftKey && hasSelection) {
        // Add to existing selection
        const newSelection = [...new Set([...selectedShapeIds, ...intersectingShapeIds])];
        setSelection(newSelection);
      } else {
        // Replace selection
        setSelection(intersectingShapeIds);
      }
      
      // Force re-render to show marquee rectangle
      // (The setSelection above triggers re-render, but we also need to update marquee visual)
      return;
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
    // MARQUEE SELECTION: Finalize selection
    if (isMarqueeActive) {
      setIsMarqueeActive(false);
      marqueeStartRef.current = null;
      marqueeCurrentRef.current = null;
      
      // Flag that we just finished a marquee to prevent stage click from clearing selection
      justFinishedMarqueeRef.current = true;
      // Reset flag after a short delay (click event will fire before this)
      setTimeout(() => {
        justFinishedMarqueeRef.current = false;
      }, 50);
      
      // Selection is already updated in handleMouseMove
      return;
    }
    
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
            type: 'line',
            rotation: 0
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
          type: newShape.type,
          rotation: 0
        };
        
        // Add text-specific properties if this is a text shape
        if (newShape.type === SHAPE_TYPES.TEXT) {
          normalizedShape.text = newShape.text;
          normalizedShape.fontSize = newShape.fontSize;
          normalizedShape.fontWeight = newShape.fontWeight;
        }
        
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

  // Register shape node ref for direct manipulation
  function registerShapeNode(shapeId, node) {
    if (node) {
      shapeNodesRef.current[shapeId] = node;
    } else {
      delete shapeNodesRef.current[shapeId];
    }
  }

  // Handle shape selection (supports shift-click for multi-select)
  function handleShapeSelect(shapeId, event) {
    // Don't allow selection changes during drag
    // Use REF for synchronous check (avoids React state timing issues)
    // (Matches Figma behavior: selection is locked during drag)
    if (isDraggingShapeRef.current) {
      return;
    }
    
    // In Konva, the native DOM event is in event.evt
    const isShiftPressed = event?.evt?.shiftKey;
    
    if (isShiftPressed) {
      // Shift-click: Toggle shape in selection
      toggleSelection(shapeId);
    } else {
      // FIX: If clicking an already-selected shape in a multi-select,
      // DON'T clear the selection (user might be about to drag)
      // This prevents the onClick-before-onDragStart race condition
      if (isMultiSelect && isSelected(shapeId)) {
        console.log('[MULTI-SELECT FIX] Preserving multi-select on click of selected shape:', shapeId);
        return; // Preserve multi-select
      }
      // Normal click: Replace selection with this shape
      setSelection([shapeId]);
    }
    
    // Auto-switch to move mode when clicking a shape (for convenience)
    // This allows users to click a shape in pan mode and immediately interact with it
    if (mode !== 'move') {
      setMode('move');
    }
  }

  // Handle right-click on shape to show context menu
  function handleShapeContextMenu(shapeId, event) {
    event.evt.preventDefault(); // Prevent default browser context menu
    
    // If shape is not selected, select it
    if (!isSelected(shapeId)) {
      setSelection([shapeId]);
    }
    
    // Get the pointer position relative to the viewport
    const stage = event.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Convert to screen coordinates
    const container = stage.container();
    const rect = container.getBoundingClientRect();
    
    setContextMenu({
      visible: true,
      x: rect.left + pointerPosition.x,
      y: rect.top + pointerPosition.y
    });
  }

  // Close context menu
  function closeContextMenu() {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }

  // Context menu handlers
  function handleContextBringForward() {
    if (selectedShapeIds.length > 0) {
      bringForward(selectedShapeIds);
    }
  }

  function handleContextSendBackward() {
    if (selectedShapeIds.length > 0) {
      sendBackward(selectedShapeIds);
    }
  }

  function handleContextBringToFront() {
    if (selectedShapeIds.length > 0) {
      bringToFront(selectedShapeIds);
    }
  }

  function handleContextSendToBack() {
    if (selectedShapeIds.length > 0) {
      sendToBack(selectedShapeIds);
    }
  }
  
  // Delete all selected shapes
  async function deleteSelectedShapes() {
    if (selectionCount === 0) return;
    
    // Filter out shapes that are locked by other users
    const shapesToDelete = selectedShapeIds.filter(id => {
      const shape = shapes.find(s => s.id === id);
      return shape && (!shape.lockedBy || shape.lockedBy === user?.uid);
    });
    
    const lockedCount = selectionCount - shapesToDelete.length;
    
    // Delete all unlocked shapes
    await Promise.all(shapesToDelete.map(id => deleteShape(id)));
    
    // Show warning if some shapes were locked
    if (lockedCount > 0) {
      console.warn(`${lockedCount} shape(s) were locked by other users and were not deleted.`);
    }
    
    // Clear selection
    clearSelection();
  }

  // Duplicate selected shapes
  async function handleDuplicate() {
    if (selectionCount === 0) {
      console.log('No shapes selected to duplicate');
      return;
    }

    try {
      console.log(`Duplicating ${selectionCount} shape(s)...`);
      const newShapeIds = await duplicateShapes(selectedShapeIds);
      
      if (newShapeIds.length > 0) {
        // Select the newly created shapes
        setSelection(newShapeIds);
        console.log(`Successfully duplicated ${newShapeIds.length} shape(s)`);
      }
    } catch (error) {
      console.error('Failed to duplicate shapes:', error);
    }
  }

  // Nudge selected shapes with arrow keys
  async function handleNudge(direction, delta) {
    if (selectionCount === 0) return;

    // Calculate new positions based on direction
    selectedShapeIds.forEach(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) return;

      // Skip locked shapes
      if (shape.lockedBy && shape.lockedBy !== user?.uid) {
        console.log(`Shape ${shapeId} is locked by another user`);
        return;
      }

      let newX = shape.x;
      let newY = shape.y;

      switch (direction) {
        case 'up':
          newY -= delta;
          break;
        case 'down':
          newY += delta;
          break;
        case 'left':
          newX -= delta;
          break;
        case 'right':
          newX += delta;
          break;
        default:
          return;
      }

      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(CANVAS_WIDTH - (shape.width || 0), newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - (shape.height || 0), newY));

      // Update shape position
      updateShape(shapeId, { x: newX, y: newY });
    });
  }

  // Handle tool change from keyboard shortcuts
  function handleToolChange(toolName) {
    switch (toolName) {
      case 'pan':
        setMode('pan');
        break;
      case 'move':
        setMode('move');
        break;
      case 'draw':
        setMode('draw');
        break;
      case 'rectangle':
        setMode('draw');
        setShapeType(SHAPE_TYPES.RECTANGLE);
        break;
      case 'circle':
        setMode('draw');
        setShapeType(SHAPE_TYPES.CIRCLE);
        break;
      case 'line':
        setMode('draw');
        setShapeType(SHAPE_TYPES.LINE);
        break;
      case 'text':
        setMode('draw');
        setShapeType(SHAPE_TYPES.TEXT);
        break;
      default:
        break;
    }
  }

  // Handle deselect from keyboard (Escape key)
  function handleDeselect() {
    // Cancel marquee selection if active
    if (isMarqueeActive) {
      setIsMarqueeActive(false);
      marqueeStartRef.current = null;
      marqueeCurrentRef.current = null;
      clearSelection();
    } else {
      setMode('pan');
      clearSelection();
    }
  }

  // Handle select all from keyboard (Cmd/Ctrl+A)
  function handleSelectAll() {
    selectAll(sortedShapes.map(s => s.id));
  }

  // Integrate keyboard shortcuts
  const isTextEditing = editingTextId !== null;
  useKeyboard({
    onDuplicate: handleDuplicate,
    onDelete: deleteSelectedShapes,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselect,
    onNudge: handleNudge,
    onToolChange: handleToolChange,
    // Layer management operations
    onBringForward: () => {
      if (selectedShapeIds.length > 0) {
        bringForward(selectedShapeIds);
      }
    },
    onSendBackward: () => {
      if (selectedShapeIds.length > 0) {
        sendBackward(selectedShapeIds);
      }
    },
    onBringToFront: () => {
      if (selectedShapeIds.length > 0) {
        bringToFront(selectedShapeIds);
      }
    },
    onSendToBack: () => {
      if (selectedShapeIds.length > 0) {
        sendToBack(selectedShapeIds);
      }
    },
    isTextEditing
  });

  /**
   * COORDINATE SYSTEM REFERENCE (CRITICAL - READ BEFORE MODIFYING):
   * 
   * STORAGE (Firestore): ALL shapes use TOP-LEFT (x, y) as origin
   * 
   * KONVA RENDERING (after PR#15 rotation fix):
   * - Circle: CENTER position (x + width/2, y + height/2) with radius
   * - Rectangle: CENTER position (x + width/2, y + height/2) with offsetX/offsetY
   * - Text: CENTER position (x + width/2, y + height/2) with offsetX/offsetY  
   * - Line: Special (Group wrapper at origin with relative points)
   * 
   * WHY: Shapes with offsetX/offsetY rotate around their visual center.
   * Without offset, they'd rotate around top-left corner (bad UX).
   * 
   * CONVERSION RULES:
   * - Storage → Konva: Add width/2 and height/2 (for center-based shapes)
   * - Konva → Storage: Subtract width/2 and height/2 (for center-based shapes)
   * - Lines: Store absolute coords, render with relative points in Group
   * 
   * WHEN TO CONVERT:
   * - handleDragEnd: Konva node position → Firestore (convert center to top-left)
   * - handleShapeDragStart: Firestore → Konva node (convert top-left to center)
   * - handleShapeDragMove: Apply offsets in correct coordinate system
   * - handleTransform: Konva transform → Firestore (convert center to top-left)
   * 
   * IF YOU CHANGE HOW SHAPES RENDER:
   * 1. Update Shape.jsx rendering logic
   * 2. Update ALL drag handlers (start, move, end)
   * 3. Update transform handlers
   * 4. Update this documentation
   * 5. Test multi-select drag thoroughly!
   */
  
  // Handle shape drag start
  function handleShapeDragStart(shapeId) {
    setIsDraggingShape(true);
    isDraggingShapeRef.current = true; // Synchronous update (no React delay)
    
    // FIX: SNAPSHOT PATTERN - Capture selection state IMMEDIATELY at drag start
    // This prevents reactive state from being read mid-execution if React re-renders
    // (Completes the snapshot pattern introduced in PR19 Bug #4)
    const selectionSnapshot = [...selectedShapeIds];
    const isMultiSelectSnapshot = selectionSnapshot.length > 1;
    const isShapeSelectedSnapshot = selectionSnapshot.includes(shapeId);
    
    console.log('[DRAG START] Snapshot captured:', {
      shapeId,
      selectionSnapshot,
      isMultiSelectSnapshot,
      isShapeSelectedSnapshot
    });
    
    // If this shape is part of a multi-select, lock all selected shapes
    if (isMultiSelectSnapshot && isShapeSelectedSnapshot) {
      activeDragRef.current = 'multi-select'; // Mark as multi-select drag immediately
      
      // OPTIMISTIC LOCKING: Lock in background (don't await)
      // This eliminates latency - Figma/Miro use this pattern
      // USE SNAPSHOT, not reactive state
      Promise.all(selectionSnapshot.map(id => lockShape(id))).catch(err => {
        console.error('Failed to lock shapes:', err);
      });
      
      // Debug: Check which nodes are registered
      // USE SNAPSHOT, not reactive state
      const registeredNodes = selectionSnapshot.filter(id => shapeNodesRef.current[id]);
      const missingNodes = selectionSnapshot.filter(id => !shapeNodesRef.current[id]);
      if (missingNodes.length > 0) {
        console.warn('[MULTI-SELECT] Missing node refs at drag start:', missingNodes);
        console.log('[MULTI-SELECT] Registered nodes:', registeredNodes);
        console.log('[MULTI-SELECT] All refs:', Object.keys(shapeNodesRef.current));
      }
      
      // Store initial positions from shape data (source of truth)
      // AND reset Konva node positions to ensure clean state
      // CRITICAL: USE SNAPSHOT, not reactive state
      initialPositionsRef.current = {};
      selectionSnapshot.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        const node = shapeNodesRef.current[id];
        
        if (shape) {
          initialPositionsRef.current[id] = {
            x: shape.x,
            y: shape.y,
            endX: shape.endX || undefined,
            endY: shape.endY || undefined,
            type: shape.type,
            width: shape.width,
            height: shape.height
          };
          
          // Reset node position to match data (ensures clean starting state)
          if (node && id !== shapeId) { // Don't reset the shape being dragged
            if (shape.type === 'line') {
              // Lines: Reset Line points to initial absolute coordinates
              // Also ensure Group is at origin
              node.position({ x: 0, y: 0 });
              const lineNode = node.findOne('Line');
              if (lineNode) {
                lineNode.points([shape.x, shape.y, shape.endX, shape.endY]);
              }
            } else if (shape.type === 'circle' || shape.type === 'rectangle' || shape.type === 'text') {
              // Circles, rectangles, and text: positioned at CENTER (with offsetX/offsetY)
              // This matches how they render after rotation fix
              node.position({ 
                x: shape.x + shape.width / 2, 
                y: shape.y + shape.height / 2 
              });
            } else {
              // Other shapes (if any) positioned at top-left
              node.position({ x: shape.x, y: shape.y });
            }
          }
        }
      });
      
      // Use requestAnimationFrame for smooth redraw (non-blocking)
      requestAnimationFrame(() => {
        // Get any shape from the drag (use snapshot, not reactive state)
        const firstShapeId = Object.keys(initialPositionsRef.current)[0];
        const firstNode = shapeNodesRef.current[firstShapeId];
        if (firstNode) {
          const layer = firstNode.getLayer();
          if (layer) {
            layer.batchDraw();
          }
        }
      });
    } else {
      // Single shape drag - also use optimistic locking
      activeDragRef.current = shapeId;
      lockShape(shapeId).catch(err => {
        console.error('Failed to lock shape:', err);
      });
      initialPositionsRef.current = null;
    }
  }

  // Handle shape drag move
  function handleShapeDragMove(data) {
    // If this is a multi-select drag, directly update Konva node positions
    // IMPORTANT: ALL shape types must be handled here for real-time visual movement!
    // NOTE: We check activeDragRef (set at drag start) NOT isMultiSelect (reactive state)
    // This prevents race conditions where React state updates mid-drag break the multi-select
    if (activeDragRef.current === 'multi-select' && initialPositionsRef.current) {
      const initialPos = initialPositionsRef.current[data.id];
      if (!initialPos) {
        console.warn('[MULTI-SELECT] No initial position for shape:', data.id);
        return;
      }
      
      // Calculate offset from initial position of the dragged shape
      const dx = data.x - initialPos.x;
      const dy = data.y - initialPos.y;
      
      // Directly update Konva nodes for all selected shapes (except the one being dragged)
      // Use initialPositionsRef (snapshot at drag start) NOT selectedShapeIds (reactive state)
      Object.keys(initialPositionsRef.current).forEach(shapeId => {
        if (shapeId === data.id) return; // Skip the dragged shape (it's already moving)
        
        const node = shapeNodesRef.current[shapeId];
        const shapeInitial = initialPositionsRef.current[shapeId];
        
        if (!node) {
          console.warn('[MULTI-SELECT] Missing node ref for shape:', shapeId);
          return;
        }
        if (!shapeInitial) {
          console.warn('[MULTI-SELECT] Missing initial position for shape:', shapeId);
          return;
        }
        
        if (node && shapeInitial) {
          // CRITICAL: Handle ALL shape types for real-time movement
          // When adding new shape types, add their coordinate handling here!
          if (shapeInitial.type === 'line') {
            // For lines, update the Line element's points directly (not Group position)
            // This makes anchors follow automatically since they're positioned at the points
            const lineNode = node.findOne('Line'); // Find Line element inside Group
            if (lineNode && shapeInitial.endX !== undefined && shapeInitial.endY !== undefined) {
              const newPoints = [
                shapeInitial.x + dx,
                shapeInitial.y + dy,
                shapeInitial.endX + dx,
                shapeInitial.endY + dy
              ];
              lineNode.points(newPoints);
            }
          } else if (shapeInitial.type === 'circle' || shapeInitial.type === 'rectangle' || shapeInitial.type === 'text') {
            // For circles, rectangles, and text: Konva positions at CENTER (with offsetX/offsetY)
            // We store as TOP-LEFT, so convert to center position
            // This matches how they render after rotation fix (PR#15)
            const centerX = shapeInitial.x + shapeInitial.width / 2 + dx;
            const centerY = shapeInitial.y + shapeInitial.height / 2 + dy;
            node.position({ x: centerX, y: centerY });
          } else {
            // For other shapes (if any), position is top-left (matches our storage)
            const newX = shapeInitial.x + dx;
            const newY = shapeInitial.y + dy;
            node.position({ x: newX, y: newY });
          }
        }
      });
      
      // Use requestAnimationFrame for smooth, non-blocking redraw
      // This matches the 60 FPS performance target
      requestAnimationFrame(() => {
        const layer = shapeNodesRef.current[data.id]?.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      });
    }
  }

  // Handle shape drag end
  async function handleShapeDragEnd(data) {
    // FIX Option 1: Reset UI lock IMMEDIATELY (synchronous)
    // This allows user to interact with canvas right away, without waiting for async operations
    // Background operations (Firebase writes, unlocking) continue without blocking UI
    // We still use activeDragRef to prevent overlapping operations
    setIsDraggingShape(false);
    isDraggingShapeRef.current = false; // Synchronous update (no React delay)
    
    // Post-drag click guard: Prevent Konva's post-drag click event from clearing selection
    // Konva can fire multiple click events after dragEnd at varying times
    // Extended to 200ms to catch late events on slow devices/heavy load
    justFinishedDragRef.current = true;
    setTimeout(() => {
      justFinishedDragRef.current = false;
    }, 200);
    
    console.log('[DRAG END] UI lock released immediately, 200ms click guard active');
    
    // Check if this was a multi-select drag
    // Use activeDragRef (snapshot at start) NOT isMultiSelect (reactive state)
    if (activeDragRef.current === 'multi-select' && initialPositionsRef.current) {
      // Calculate the offset from the dragged shape
      const draggedShape = shapes.find(s => s.id === data.id);
      if (!draggedShape) return;
      
      const dx = data.x - draggedShape.x;
      const dy = data.y - draggedShape.y;
      
      console.log('[CANVAS] Group drag end. Offset:', dx, dy);
      
      // Update all shapes that were selected at drag start
      // Use initialPositionsRef (snapshot) NOT selectedShapeIds (reactive state)
      const shapesInDrag = Object.keys(initialPositionsRef.current);
      const updatePromises = shapesInDrag.map(async (id) => {
        const shape = shapes.find(s => s.id === id);
        if (!shape) return;
        
        const updates = {
          x: shape.x + dx,
          y: shape.y + dy
        };
        
        // For lines, also update endpoints
        if (shape.endX !== undefined && shape.endY !== undefined) {
          updates.endX = shape.endX + dx;
          updates.endY = shape.endY + dy;
        }
        
        console.log('[CANVAS] Updating shape in group:', id, updates);
        await updateShapeImmediate(id, updates);
      });
      
      await Promise.all(updatePromises);
      
      // Unlock all shapes that were in the drag
      const unlockPromises = shapesInDrag.map(id => unlockShape(id));
      await Promise.all(unlockPromises);
      
      activeDragRef.current = null;
      initialPositionsRef.current = null; // Clean up
    } else {
      // Single shape drag
      // Use immediate update (no debounce) to prevent ghost teleport effect
      // IMPORTANT: For lines, data includes endX and endY; for text, may include width/height
      const updates = { x: data.x, y: data.y };
      
      // If this is a line shape, include endpoint coordinates
      if (data.endX !== undefined && data.endY !== undefined) {
        updates.endX = data.endX;
        updates.endY = data.endY;
        console.log('[CANVAS] Updating line with endpoint:', updates);
      }
      
      // If width and height are provided (from transform), include them
      if (data.width !== undefined) {
        updates.width = data.width;
      }
      if (data.height !== undefined) {
        updates.height = data.height;
      }
      
      // If fontSize is provided (from text transform), include it
      if (data.fontSize !== undefined) {
        updates.fontSize = data.fontSize;
      }
      
      // If rotation is provided (from transform), include it
      if (data.rotation !== undefined) {
        updates.rotation = data.rotation;
      }
      
      console.log('[CANVAS] Updating shape:', data.id, updates);
      
      await updateShapeImmediate(data.id, updates);
      
      // Unlock the shape so others can use it
      if (activeDragRef.current === data.id) {
        await unlockShape(data.id);
        activeDragRef.current = null;
      }
    }
    
    // Note: setIsDraggingShape(false) is now at TOP of function for immediate UI unlock
    // Keep shape selected after dragging so user can continue interacting
    // (User can click elsewhere or press Esc to deselect)
  }
  
  // Text editing handlers
  async function handleTextEdit(shapeId, currentText) {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Lock the shape to prevent others from editing
    await lockShape(shapeId);
    
    // Calculate text editor position (positioned over the text shape)
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.position();
    
    setTextEditorPosition({
      x: stageBox.left + (shape.x * scale) + stagePos.x,
      y: stageBox.top + (shape.y * scale) + stagePos.y,
      width: shape.width * scale,
      height: shape.height * scale,
      fontSize: (shape.fontSize || 16) * scale
    });
    
    setEditingTextId(shapeId);
    setEditingText(currentText);
  }
  
  async function handleTextSave() {
    if (editingTextId) {
      await updateShape(editingTextId, { text: editingText });
      await unlockShape(editingTextId);
      setEditingTextId(null);
      setEditingText('');
    }
  }
  
  async function handleTextCancel() {
    if (editingTextId) {
      await unlockShape(editingTextId);
    }
    setEditingTextId(null);
    setEditingText('');
  }
  
  function handleTextChange(e) {
    setEditingText(e.target.value);
  }
  
  function handleTextKeyDown(e) {
    // Allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
    // Stop propagation to prevent other keyboard shortcuts
    e.stopPropagation();
  }

  // Focus and select text when editing starts
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]); // Only run when editingTextId changes (editing starts)

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
    // Don't clear selection if we just finished a marquee selection
    if (justFinishedMarqueeRef.current) {
      return;
    }
    
    // Don't clear selection during any drag operation
    // Use REF for synchronous check (avoids React state timing issues)
    // This prevents selection from being cleared mid-drag if a click event fires
    // (Matches Figma behavior: selection is locked during drag)
    if (isDraggingShapeRef.current) {
      console.log('[STAGE CLICK] Blocked - drag in progress (ref check)');
      return;
    }
    
    // Don't clear selection if we just finished a drag (within 200ms)
    // This prevents Konva's post-drag click event from clearing selection
    // Extended timeout catches late events on slow devices
    if (justFinishedDragRef.current) {
      console.log('[STAGE CLICK] Blocked - just finished drag');
      return;
    }
    
    if (e.target === e.target.getStage()) {
      clearSelection();
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
        draggable={mode === 'pan' && !editingTextId}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onWheel={editingTextId ? undefined : handleWheel}
        onMouseDown={editingTextId ? undefined : handleMouseDown}
        onMouseMove={editingTextId ? undefined : handleMouseMove}
        onMouseUp={editingTextId ? undefined : handleMouseUp}
        onClick={editingTextId ? undefined : handleStageClick}
        style={{ 
          cursor: isMarqueeActive ? 'crosshair'
                : isDrawing ? 'crosshair' 
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
          {sortedShapes.map((shape) => {
            const isLockedByOther = shape.lockedBy && shape.lockedBy !== user?.uid;
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={isSelected(shape.id)}
                isMultiSelect={isMultiSelect}
                onSelect={(e) => handleShapeSelect(shape.id, e)}
                onContextMenu={(e) => handleShapeContextMenu(shape.id, e)}
                onDragStart={() => handleShapeDragStart(shape.id)}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                onTextEdit={handleTextEdit}
                isEditing={shape.id === editingTextId}
                isDraggable={mode === 'move'}
                isInteractive={mode !== 'draw'}
                isLockedByOther={isLockedByOther}
                currentUserId={user?.uid}
                onNodeRef={(node) => registerShapeNode(shape.id, node)}
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
            ) : newShape.type === SHAPE_TYPES.TEXT ? (
              <Text
                x={newShape.x}
                y={newShape.y}
                width={Math.abs(newShape.width)}
                height={Math.abs(newShape.height)}
                text={newShape.text}
                fontSize={newShape.fontSize}
                fontFamily="Arial"
                fontStyle={newShape.fontWeight}
                fill={newShape.color}
                align="left"
                verticalAlign="top"
                wrap="word"
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
          
          {/* Render marquee selection rectangle */}
          {isMarqueeActive && marqueeStartRef.current && marqueeCurrentRef.current && (
            <Rect
              x={Math.min(marqueeStartRef.current.x, marqueeCurrentRef.current.x)}
              y={Math.min(marqueeStartRef.current.y, marqueeCurrentRef.current.y)}
              width={Math.abs(marqueeCurrentRef.current.x - marqueeStartRef.current.x)}
              height={Math.abs(marqueeCurrentRef.current.y - marqueeStartRef.current.y)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1.5 / scale}
              dash={[5 / scale, 5 / scale]}
              listening={false}
            />
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
          
          <button
            onClick={() => setShapeType(SHAPE_TYPES.TEXT)}
            title="Add Text"
            style={{
              padding: '8px 14px',
              background: shapeType === SHAPE_TYPES.TEXT ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: shapeType === SHAPE_TYPES.TEXT ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: shapeType === SHAPE_TYPES.TEXT ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: shapeType === SHAPE_TYPES.TEXT ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>📝</span>
            <span>Text</span>
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
            shapeType === SHAPE_TYPES.TEXT ? '📝 Text Mode' :
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
            : shapeType === SHAPE_TYPES.TEXT
            ? 'Click on empty space to add text • Double-click text to edit • Canvas will NOT pan'
            : `Click & drag on empty space to create ${
                shapeType === SHAPE_TYPES.LINE ? 'lines' :
                shapeType === SHAPE_TYPES.CIRCLE ? 'circles' :
                'rectangles'
              } • Canvas will NOT pan`}
        </span>
        <br />
        <span style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px', display: 'block' }}>
          Shapes: {shapes.length} {selectionCount > 0 ? `• ${selectionCount} selected` : ''} • Keyboard: V (Pan) • M (Move) • D (Draw) • Cmd/Ctrl+A (Select All) • Esc (Deselect) • Del/Backspace (Delete)
        </span>
      </div>

      {/* Inline Text Editor with overlay to prevent canvas interaction */}
      {editingTextId && (
        <>
          {/* Overlay to prevent canvas interaction while editing */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1999,
              background: 'transparent',
              cursor: 'default'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Clicking outside the textarea saves the text
              handleTextSave();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* Textarea positioned over the text shape - styled to edit in place */}
          <textarea
            ref={textareaRef}
            value={editingText}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextSave}
            onMouseDown={(e) => {
              // Prevent event from reaching canvas
              e.stopPropagation();
            }}
            onClick={(e) => {
              // Prevent event from reaching canvas
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              left: `${textEditorPosition.x}px`,
              top: `${textEditorPosition.y}px`,
              width: `${Math.max(textEditorPosition.width, 100)}px`,
              minHeight: `${Math.max(textEditorPosition.height, 30)}px`,
              padding: '0',
              margin: '0',
              border: 'none',
              borderRadius: '0',
              fontSize: `${textEditorPosition.fontSize || 16}px`,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'normal',
              resize: 'none',
              outline: 'none',
              background: 'transparent',
              color: editingTextId ? (shapes.find(s => s.id === editingTextId)?.color || '#FFA07A') : '#FFA07A',
              caretColor: 'auto',
              zIndex: 2000,
              overflow: 'hidden',
              lineHeight: '1.2',
              boxShadow: 'none',
              cursor: 'text',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              textShadow: '0 0 1px rgba(0,0,0,0.5)'
            }}
            placeholder="Type your text..."
          />
        </>
      )}

      {/* Selection count badge */}
      {selectionCount > 0 && (
        <div className="selection-badge">
          {selectionCount} shape{selectionCount !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        hasSelection={selectionCount > 0}
        onBringForward={handleContextBringForward}
        onSendBackward={handleContextSendBackward}
        onBringToFront={handleContextBringToFront}
        onSendToBack={handleContextSendToBack}
        onDuplicate={handleDuplicate}
        onDelete={deleteSelectedShapes}
      />
    </div>
  );
}

export default Canvas;
