const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

describe('NeonSnakeGame - Visual Regression Tests', () => {
    let browser;
    let page;
    const baselineDir = path.join(__dirname, 'baseline');
    const outputDir = path.join(__dirname, 'output');
    const diffDir = path.join(__dirname, 'diff');

    beforeAll(async () => {
        // Create directories if they don't exist
        await fs.mkdir(baselineDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(diffDir, { recursive: true });

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });
        
        // Inject deterministic random for consistent tests
        await page.evaluateOnNewDocument(() => {
            let seed = 42;
            Math.random = function() {
                seed = (seed * 16807) % 2147483647;
                return (seed - 1) / 2147483646;
            };
        });
        
        const filePath = path.join(__dirname, '../../index.html');
        await page.goto(`file://${filePath}`);
        
        // Wait for game to load
        await page.waitForFunction(() => {
            return window.game && window.game.scene;
        }, { timeout: 5000 });
    });

    afterAll(async () => {
        await browser.close();
    });

    async function compareScreenshots(name) {
        const baselinePath = path.join(baselineDir, `${name}.png`);
        const outputPath = path.join(outputDir, `${name}.png`);
        const diffPath = path.join(diffDir, `${name}-diff.png`);

        // Take screenshot
        const screenshot = await page.screenshot({ 
            clip: { x: 0, y: 0, width: 800, height: 600 } 
        });
        await fs.writeFile(outputPath, screenshot);

        // Check if baseline exists
        try {
            await fs.access(baselinePath);
        } catch (error) {
            // No baseline, save current as baseline
            await fs.writeFile(baselinePath, screenshot);
            console.log(`Created baseline for ${name}`);
            return { match: true, diff: 0 };
        }

        // Compare with baseline
        const baseline = PNG.sync.read(await fs.readFile(baselinePath));
        const current = PNG.sync.read(screenshot);
        const { width, height } = baseline;
        const diff = new PNG({ width, height });

        const numDiffPixels = pixelmatch(
            baseline.data,
            current.data,
            diff.data,
            width,
            height,
            { threshold: 0.1 }
        );

        // Save diff image if there are differences
        if (numDiffPixels > 0) {
            await fs.writeFile(diffPath, PNG.sync.write(diff));
        }

        const diffPercentage = (numDiffPixels / (width * height)) * 100;
        return { match: diffPercentage < 2, diff: diffPercentage };
    }

    describe('Game States', () => {
        test('should render initial game state correctly', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                }
            });

            await page.waitForTimeout(100);
            
            const result = await compareScreenshots('initial-state');
            expect(result.match).toBe(true);
        });

        test('should render game over state correctly', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.endGame();
                }
            });

            await page.waitForTimeout(1100); // Wait for flash effect

            const result = await compareScreenshots('game-over');
            expect(result.match).toBe(true);
        });
    });

    describe('Snake Rendering', () => {
        test('should render snake moving right', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    scene.direction = 'right';
                    scene.nextDirection = 'right';
                    for (let i = 0; i < 3; i++) {
                        scene.moveSnake();
                    }
                }
            });

            const result = await compareScreenshots('snake-right');
            expect(result.match).toBe(true);
        });

        test('should render snake moving up', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    scene.direction = 'up';
                    scene.nextDirection = 'up';
                    for (let i = 0; i < 3; i++) {
                        scene.moveSnake();
                    }
                }
            });

            const result = await compareScreenshots('snake-up');
            expect(result.match).toBe(true);
        });

        test('should render long snake correctly', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    // Add segments to make snake longer
                    for (let i = 0; i < 10; i++) {
                        scene.snake.push({ 
                            x: scene.snake[scene.snake.length - 1].x - 1, 
                            y: scene.snake[scene.snake.length - 1].y 
                        });
                        scene.snakeGraphics.push(scene.add.graphics());
                    }
                    scene.drawSnake();
                }
            });

            const result = await compareScreenshots('snake-long');
            expect(result.match).toBe(true);
        });
    });

    describe('Power-ups and Effects', () => {
        test('should render shield power-up', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    const position = { x: 5, y: 5 };
                    const powerUp = scene.createPowerUpGraphics(position, 'shield');
                    scene.powerUps.push(powerUp);
                }
            });

            const result = await compareScreenshots('power-up-shield');
            expect(result.match).toBe(true);
        });

        test('should render speed power-up', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    const position = { x: 15, y: 15 };
                    const powerUp = scene.createPowerUpGraphics(position, 'speed');
                    scene.powerUps.push(powerUp);
                }
            });

            const result = await compareScreenshots('power-up-speed');
            expect(result.match).toBe(true);
        });

        test('should render invulnerable snake (yellow)', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    scene.invulnerable = true;
                    scene.drawSnake();
                }
            });

            const result = await compareScreenshots('snake-invulnerable');
            expect(result.match).toBe(true);
        });
    });

    describe('Environment', () => {
        test('should render lasers correctly', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                }
            });

            const result = await compareScreenshots('lasers');
            expect(result.match).toBe(true);
        });

        test('should render food correctly', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    // Ensure food is at a visible position
                    if (scene.food) {
                        scene.food.destroy();
                    }
                    scene.food = scene.add.graphics();
                    scene.food.setData('gridX', 15);
                    scene.food.setData('gridY', 5);
                    scene.drawFood({ x: 15, y: 5 });
                }
            });

            const result = await compareScreenshots('food');
            expect(result.match).toBe(true);
        });

        test('should render grid background', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    // Clear everything except background
                    scene.snake = [];
                    scene.snakeGraphics.forEach(g => g.clear());
                    if (scene.food) scene.food.clear();
                    scene.powerUps.forEach(p => p.clear());
                }
            });

            const result = await compareScreenshots('background-grid');
            expect(result.match).toBe(true);
        });
    });

    describe('Debug Mode', () => {
        test('should render debug console', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.game.config.debug = true;
                    scene.createDebugConsole();
                    scene.updateDebugInfo(1000, 16.67);
                }
            });

            const result = await compareScreenshots('debug-console');
            expect(result.match).toBe(true);
        });
    });

    describe('Animations', () => {
        test('should capture laser animation states', async () => {
            const frames = [];
            
            for (let i = 0; i < 5; i++) {
                await page.evaluate((time) => {
                    const scene = window.game.scene.getScene('NeonSnakeGame');
                    if (scene) {
                        scene.updateLasers(time);
                    }
                }, i * 1000);
                
                const screenshot = await page.screenshot({ 
                    clip: { x: 0, y: 0, width: 800, height: 600 } 
                });
                frames.push(screenshot);
                
                await page.waitForTimeout(100);
            }
            
            // Verify that frames are different (animation is working)
            const frame1 = PNG.sync.read(frames[0]);
            const frame2 = PNG.sync.read(frames[4]);
            const diff = new PNG({ width: 800, height: 600 });
            
            const numDiffPixels = pixelmatch(
                frame1.data,
                frame2.data,
                diff.data,
                800,
                600,
                { threshold: 0.1 }
            );
            
            // There should be some difference due to animation
            expect(numDiffPixels).toBeGreaterThan(0);
        });

        test('should capture power-up rotation animation', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    scene.resetGame();
                    const position = { x: 10, y: 10 };
                    const powerUp = scene.createPowerUpGraphics(position, 'shield');
                    scene.powerUps.push(powerUp);
                }
            });
            
            const frames = [];
            
            for (let i = 0; i < 5; i++) {
                await page.evaluate((time) => {
                    const scene = window.game.scene.getScene('NeonSnakeGame');
                    if (scene) {
                        scene.updatePowerUps(time);
                    }
                }, i * 1000);
                
                const screenshot = await page.screenshot({ 
                    clip: { x: 380, y: 380, width: 40, height: 40 } // Power-up area
                });
                frames.push(screenshot);
                
                await page.waitForTimeout(100);
            }
            
            // Verify animation
            const frame1 = PNG.sync.read(frames[0]);
            const frame2 = PNG.sync.read(frames[4]);
            const diff = new PNG({ width: 40, height: 40 });
            
            const numDiffPixels = pixelmatch(
                frame1.data,
                frame2.data,
                diff.data,
                40,
                40,
                { threshold: 0.1 }
            );
            
            expect(numDiffPixels).toBeGreaterThan(0);
        });
    });
});