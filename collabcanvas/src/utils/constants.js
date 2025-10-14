// Canvas dimensions
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Canvas viewport
export const VIEWPORT_WIDTH = window.innerWidth;
export const VIEWPORT_HEIGHT = window.innerHeight;

// Zoom limits
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

// Performance targets
export const TARGET_FPS = 60;

// Colors
export const SHAPE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
];

// Shape defaults
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_SHAPE_COLOR = SHAPE_COLORS[0];

// Line defaults
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_LINE_HIT_WIDTH = 20;

// Shape types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
};

// Cursor update throttle (ms)
export const CURSOR_UPDATE_THROTTLE = 50;

// Firestore collections
export const COLLECTIONS = {
  SHAPES: 'shapes',
  CURSORS: 'cursors',
  PRESENCE: 'presence',
};

