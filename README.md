# 🐍 Neon Snake - Cyberpunk Edition

A modern take on the classic Snake game built with Phaser 3, featuring neon aesthetics, laser obstacles, power-ups, and a comprehensive test suite.

![Tests](https://github.com/david-strejc/neon-snake-game/workflows/Neon%20Snake%20Game%20Tests/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Phaser](https://img.shields.io/badge/Phaser-3.70.0-purple.svg)

## 🎮 Play Online

[Play Neon Snake](https://david-strejc.github.io/neon-snake-game/) (GitHub Pages deployment coming soon)

## ✨ Features

- **Neon Cyberpunk Aesthetics**: Glowing snake, particle effects, and retro grid
- **Laser Obstacles**: Dynamic laser barriers that must be avoided
- **Power-ups**: 
  - 🛡️ Shield (5 seconds of invulnerability)
  - ⚡ Speed Boost (double movement speed)
- **Progressive Difficulty**: Game speeds up as you collect food
- **Visual Effects**: Camera shake, flash effects, particle explosions
- **Debug Mode**: Real-time performance and game state monitoring

## 🎯 Game Controls

- **Arrow Keys**: Control snake direction
- **Space**: Restart game after game over

## 🏗️ Architecture

The game is built with two versions:

1. **`js/game.js`**: Original implementation
2. **`js/game-refactored.js`**: Refactored version with improved structure, testability, and bug fixes

### Key Improvements in Refactored Version:
- Class-based architecture extending Phaser.Scene
- Eliminated global state
- Fixed self-collision detection bug
- Prevented infinite loops in spawn functions
- Better separation of concerns
- Event-driven UI updates
- Improved memory management

## 🧪 Test Suite

Comprehensive test coverage including:

### Unit Tests
- Movement mechanics
- Collision detection
- Power-up functionality
- Score calculation
- Game state management

### Integration Tests
- Full game flow
- Multi-system interactions
- Input handling
- Difficulty progression

### Performance Tests
- 60 FPS validation
- Memory leak detection
- Draw call optimization
- Input latency measurement

### Visual Regression Tests
- Screenshot comparison
- Animation verification
- UI state validation
- Cross-browser consistency

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/david-strejc/neon-snake-game.git
cd neon-snake-game

# Install dependencies
npm install

# Run locally
npx http-server . -p 8080
# Open http://localhost:8080 in your browser
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- tests/unit
npm test -- tests/integration
npm run test:performance
npm run test:visual

# Generate coverage report
npm run test:coverage
```

## 📊 Performance Requirements

- **Target FPS**: 60
- **Minimum FPS**: 30
- **Memory Growth**: < 20% over 5 games
- **Input Latency**: < 33ms (2 frames)

## 🎨 Visual Design

- **Grid**: 20x20 cells
- **Resolution**: 800x600 pixels
- **Color Scheme**:
  - Snake Head: `#FF00FF` (Magenta)
  - Snake Body: `#00FF00` (Green)
  - Shield Mode: `#FFFF00` (Yellow)
  - Lasers: `#FF0000` (Red)
  - Food: `#FFFF00` (Yellow)
  - Grid: `#00FFFF` (Cyan)

## 🐛 Known Issues

- Visual regression tests require baseline images to be generated on first run
- Performance tests may vary based on system hardware
- Chrome/Chromium required for Puppeteer tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Maintain test coverage above 80%
- Update visual regression baselines when making UI changes
- Run performance tests before submitting PRs
- Follow existing code style and patterns

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Phaser.js team for the excellent game framework
- Classic Snake game for the inspiration
- Cyberpunk aesthetic for the visual design

## 📈 Future Enhancements

- [ ] Multiplayer mode
- [ ] Leaderboard system
- [ ] More power-up types
- [ ] Sound effects and music
- [ ] Mobile touch controls
- [ ] Progressive Web App support
- [ ] Different difficulty levels
- [ ] Custom level editor

---

Made with 💜 by [David Strejc](https://github.com/david-strejc)