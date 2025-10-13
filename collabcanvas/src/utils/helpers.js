// Generate unique ID for shapes
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Throttle function for cursor updates
export function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

// Debounce function for shape updates
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// FPS counter for development
export function createFPSCounter() {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;

  return function updateFPS() {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
    }
    
    return fps;
  };
}

// Get random color from SHAPE_COLORS
export function getRandomColor(colors) {
  return colors[Math.floor(Math.random() * colors.length)];
}

