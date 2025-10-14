import { useState, useCallback } from 'react';
import { MIN_ZOOM, MAX_ZOOM, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

/**
 * Calculate initial centered position for canvas
 * Centers the canvas so users start at the middle of the canvas
 */
function getInitialCenteredPosition() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: (viewportWidth / 2) - (CANVAS_WIDTH / 2),
    y: (viewportHeight / 2) - (CANVAS_HEIGHT / 2)
  };
}

/**
 * Custom hook to manage canvas viewport state (pan and zoom)
 * @returns {Object} Canvas state and methods
 */
function useCanvas() {
  const [position, setPosition] = useState(getInitialCenteredPosition());
  const [scale, setScale] = useState(1);

  /**
   * Update canvas position (pan)
   * @param {Object} newPosition - New position {x, y}
   */
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);
  }, []);

  /**
   * Update canvas scale (zoom)
   * @param {number} newScale - New scale value
   */
  const updateScale = useCallback((newScale) => {
    // Constrain zoom within limits
    const constrainedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);
    setScale(constrainedScale);
  }, []);

  /**
   * Reset canvas to default centered position and scale
   */
  const resetCanvas = useCallback(() => {
    setPosition(getInitialCenteredPosition());
    setScale(1);
  }, []);

  return {
    position,
    scale,
    updatePosition,
    updateScale,
    resetCanvas
  };
}

export default useCanvas;
