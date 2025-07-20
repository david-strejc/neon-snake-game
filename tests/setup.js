// Mock DOM environment for Phaser
global.window = global;
global.document = {
  createElement: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: [] })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: [] })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      arc: jest.fn(),
      arcTo: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      isPointInPath: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      strokeText: jest.fn(),
      fillText: jest.fn(),
      strokeRect: jest.fn(),
    })),
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    width: 800,
    height: 600
  })),
  getElementById: jest.fn((id) => {
    if (id === 'score-value') {
      return { textContent: '0' };
    }
    if (id === 'game-over') {
      return { style: { display: 'none' } };
    }
    if (id === 'game-container') {
      return { appendChild: jest.fn() };
    }
    return null;
  }),
  body: {
    appendChild: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.Image = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

global.HTMLCanvasElement = jest.fn();
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: [] }))
}));

// Mock WebGL
global.WebGLRenderingContext = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock Audio
global.Audio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn()
}));

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};