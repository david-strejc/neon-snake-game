# Neon Snake Game Test Suite

Comprehensive test suite for the Neon Snake Phaser 3 game including unit tests, integration tests, performance tests, and visual regression tests.

## Test Structure

```
tests/
├── unit/               # Unit tests for game logic
│   └── game-logic.test.js
├── integration/        # Integration tests for game mechanics
│   └── game-mechanics.test.js
├── performance/        # Performance and FPS tests
│   └── fps.test.js
├── visual/            # Visual regression tests
│   ├── regression.test.js
│   ├── baseline/      # Baseline images
│   ├── output/        # Current test output
│   └── diff/          # Difference images
├── __mocks__/         # Mock files
├── setup.js           # Test environment setup
└── README.md          # This file
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration

# Performance tests
npm run test:performance

# Visual regression tests
npm run test:visual

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Test Types

### 1. Unit Tests (`tests/unit/game-logic.test.js`)

Tests individual functions and game logic in isolation:
- Snake movement mechanics
- Collision detection (walls, self, lasers, food)
- Direction change validation
- Power-up activation
- Score calculation
- Position validation
- Game state management

### 2. Integration Tests (`tests/integration/game-mechanics.test.js`)

Tests how different game systems work together:
- Full game cycle (start → play → game over → reset)
- Food collection and snake growth
- Power-up collection and effects
- Laser collision with shield protection
- Keyboard input handling
- Scoring system integration
- Particle effects
- Difficulty progression

### 3. Performance Tests (`tests/performance/fps.test.js`)

Uses Puppeteer to test real browser performance:
- **FPS Monitoring**: Ensures 60 FPS during normal gameplay
- **Stress Testing**: Handles maximum snake length
- **Particle Performance**: Multiple simultaneous effects
- **Memory Leaks**: Detects memory growth over multiple games
- **Draw Call Efficiency**: Monitors rendering performance
- **Input Latency**: Measures response time

Requirements:
- Average FPS ≥ 50
- Minimum FPS ≥ 30
- Memory growth < 20% over 5 games
- Input latency < 33ms (2 frames)

### 4. Visual Regression Tests (`tests/visual/regression.test.js`)

Captures and compares screenshots to detect visual regressions:
- Initial game state
- Game over screen
- Snake in different directions
- Long snake rendering
- Power-ups (shield and speed)
- Invulnerable snake effect
- Laser rendering
- Food rendering
- Grid background
- Debug console
- Animations (lasers and power-ups)

Visual tests use:
- **pixelmatch**: For image comparison
- **Threshold**: 2% difference allowed
- **Deterministic random**: Ensures consistent tests

## Test Coverage Goals

The test suite aims for:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Current coverage can be viewed by running:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Failed Unit/Integration Tests
1. Run specific test file: `npm test -- tests/unit/game-logic.test.js`
2. Use `--verbose` flag for detailed output
3. Add `console.log` statements in test code

### Failed Performance Tests
1. Run with headed browser: Modify `headless: false` in test
2. Increase timeouts for slow systems
3. Check browser console for errors

### Failed Visual Tests
1. Check diff images in `tests/visual/diff/`
2. Update baselines if changes are intentional:
   ```bash
   rm tests/visual/baseline/*.png
   npm run test:visual
   ```
3. Adjust threshold if needed (currently 0.1)

## Continuous Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: visual-regression-diffs
          path: tests/visual/diff/
```

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use descriptive names**: Test names should explain what they test
3. **Test edge cases**: Include boundary conditions
4. **Mock external dependencies**: Keep tests fast and reliable
5. **Update visual baselines carefully**: Review all changes
6. **Monitor performance metrics**: Track FPS and memory over time

## Troubleshooting

### Common Issues

1. **Canvas/WebGL errors**: Ensure jest-canvas-mock is installed
2. **Puppeteer issues**: May need `--no-sandbox` flag
3. **Visual test failures**: Check if Phaser assets loaded correctly
4. **Performance variations**: Run on consistent hardware/environment

### Test Environment

The test setup mocks:
- DOM environment
- Canvas/WebGL context
- RequestAnimationFrame
- Local storage
- Audio context
- Phaser framework components

See `tests/setup.js` for complete mock configuration.