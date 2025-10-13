import { useState, useCallback } from 'react';
import { MIN_ZOOM, MAX_ZOOM } from '../utils/constants';

/**
 * Custom hook to manage canvas viewport state (pan and zoom)
 * @returns {Object} Canvas state and methods
 */
function useCanvas() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
   * Reset canvas to default position and scale
   */
  const resetCanvas = useCallback(() => {
    setPosition({ x: 0, y: 0 });
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
