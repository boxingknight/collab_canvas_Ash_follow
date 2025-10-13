// TODO: Implement canvas hook for viewport state management

function useCanvas() {
  // Canvas state (pan, zoom) will go here
  return {
    position: { x: 0, y: 0 },
    scale: 1,
    setPosition: () => {},
    setScale: () => {}
  };
}

export default useCanvas;

