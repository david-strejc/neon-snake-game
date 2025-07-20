const puppeteer = require('puppeteer');
const path = require('path');

describe('NeonSnakeGame - Performance Tests', () => {
    let browser;
    let page;
    let performanceData = [];

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        
        // Enable performance monitoring
        await page.evaluateOnNewDocument(() => {
            window.performanceData = [];
            window.frameCount = 0;
            window.lastTime = performance.now();
            
            // Override requestAnimationFrame to measure FPS
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(callback) {
                return originalRAF.call(window, (timestamp) => {
                    window.frameCount++;
                    const currentTime = performance.now();
                    const delta = currentTime - window.lastTime;
                    
                    if (delta >= 1000) {
                        const fps = (window.frameCount / delta) * 1000;
                        window.performanceData.push({
                            timestamp: currentTime,
                            fps: fps,
                            frameCount: window.frameCount,
                            memoryUsage: performance.memory ? {
                                usedJSHeapSize: performance.memory.usedJSHeapSize,
                                totalJSHeapSize: performance.memory.totalJSHeapSize,
                                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                            } : null
                        });
                        window.frameCount = 0;
                        window.lastTime = currentTime;
                    }
                    
                    callback(timestamp);
                });
            };
        });
        
        // Start local server or use file protocol
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

    describe('FPS Performance', () => {
        test('should maintain 60 FPS during normal gameplay', async () => {
            // Run game for 30 seconds
            await page.evaluate(() => {
                window.performanceData = [];
                window.frameCount = 0;
                window.lastTime = performance.now();
            });
            
            // Simulate gameplay
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    // Start moving the snake
                    setInterval(() => {
                        const directions = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
                        const randomDir = directions[Math.floor(Math.random() * directions.length)];
                        
                        window.dispatchEvent(new KeyboardEvent('keydown', {
                            code: randomDir
                        }));
                    }, 2000);
                }
            });
            
            // Wait for 30 seconds of gameplay
            await page.waitForTimeout(30000);
            
            // Collect performance data
            performanceData = await page.evaluate(() => window.performanceData);
            
            // Analyze FPS
            const avgFPS = performanceData.reduce((sum, data) => sum + data.fps, 0) / performanceData.length;
            const minFPS = Math.min(...performanceData.map(d => d.fps));
            const maxFPS = Math.max(...performanceData.map(d => d.fps));
            
            console.log(`Average FPS: ${avgFPS.toFixed(2)}`);
            console.log(`Min FPS: ${minFPS.toFixed(2)}`);
            console.log(`Max FPS: ${maxFPS.toFixed(2)}`);
            
            // Assert performance requirements
            expect(avgFPS).toBeGreaterThanOrEqual(50); // Average should be at least 50 FPS
            expect(minFPS).toBeGreaterThanOrEqual(30); // Minimum should never drop below 30 FPS
        });

        test('should handle maximum snake length without performance degradation', async () => {
            // Fill most of the grid with snake
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    // Hack to grow snake quickly
                    for (let i = 0; i < 300; i++) {
                        scene.snake.push({ x: i % 20, y: Math.floor(i / 20) });
                        scene.snakeGraphics.push(scene.add.graphics());
                    }
                    scene.drawSnake();
                }
                
                window.performanceData = [];
                window.frameCount = 0;
                window.lastTime = performance.now();
            });
            
            // Measure performance with long snake
            await page.waitForTimeout(10000);
            
            performanceData = await page.evaluate(() => window.performanceData);
            
            const avgFPS = performanceData.reduce((sum, data) => sum + data.fps, 0) / performanceData.length;
            
            console.log(`Average FPS with max snake: ${avgFPS.toFixed(2)}`);
            
            expect(avgFPS).toBeGreaterThanOrEqual(45); // Should maintain at least 45 FPS
        });

        test('should handle multiple particle effects', async () => {
            await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                if (scene) {
                    // Trigger multiple particle effects
                    setInterval(() => {
                        const x = Math.random() * 800;
                        const y = Math.random() * 600;
                        scene.particles.emitParticleAt(x, y, 20);
                        scene.foodParticles.emitParticleAt(x, y, 10);
                    }, 100);
                }
                
                window.performanceData = [];
                window.frameCount = 0;
                window.lastTime = performance.now();
            });
            
            await page.waitForTimeout(10000);
            
            performanceData = await page.evaluate(() => window.performanceData);
            
            const avgFPS = performanceData.reduce((sum, data) => sum + data.fps, 0) / performanceData.length;
            
            console.log(`Average FPS with particles: ${avgFPS.toFixed(2)}`);
            
            expect(avgFPS).toBeGreaterThanOrEqual(45);
        });
    });

    describe('Memory Performance', () => {
        test('should not have memory leaks during gameplay', async () => {
            const initialMemory = await page.evaluate(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            // Play multiple rounds
            for (let round = 0; round < 5; round++) {
                await page.evaluate(() => {
                    const scene = window.game.scene.getScene('NeonSnakeGame');
                    if (scene) {
                        // Reset and play
                        scene.resetGame();
                        
                        // Simulate gameplay
                        for (let i = 0; i < 50; i++) {
                            scene.moveSnake();
                        }
                        
                        // End game
                        scene.endGame();
                    }
                });
                
                await page.waitForTimeout(2000);
            }
            
            // Force garbage collection if available
            await page.evaluate(() => {
                if (window.gc) {
                    window.gc();
                }
            });
            
            await page.waitForTimeout(2000);
            
            const finalMemory = await page.evaluate(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            const memoryGrowth = finalMemory - initialMemory;
            const growthPercentage = (memoryGrowth / initialMemory) * 100;
            
            console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB (${growthPercentage.toFixed(2)}%)`);
            
            // Memory should not grow more than 20%
            expect(growthPercentage).toBeLessThan(20);
        });
    });

    describe('Rendering Performance', () => {
        test('should efficiently batch draw calls', async () => {
            const drawCalls = await page.evaluate(() => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                let callCount = 0;
                
                if (scene) {
                    // Hook into graphics calls to count them
                    const originalGraphics = scene.add.graphics;
                    scene.add.graphics = function() {
                        const graphics = originalGraphics.call(this);
                        const originalClear = graphics.clear;
                        const originalFillRect = graphics.fillRect;
                        
                        graphics.clear = function() {
                            callCount++;
                            return originalClear.call(this);
                        };
                        
                        graphics.fillRect = function() {
                            callCount++;
                            return originalFillRect.apply(this, arguments);
                        };
                        
                        return graphics;
                    };
                    
                    // Run one frame
                    scene.drawSnake();
                }
                
                return callCount;
            });
            
            console.log(`Draw calls per frame: ${drawCalls}`);
            
            // Should have reasonable number of draw calls
            // Each snake segment = 1 clear + 1-2 fillRect calls
            expect(drawCalls).toBeLessThan(100); // Assuming max ~30 segments
        });
    });

    describe('Input Latency', () => {
        test('should respond to input within one frame', async () => {
            const latency = await page.evaluate(async () => {
                const scene = window.game.scene.getScene('NeonSnakeGame');
                
                return new Promise((resolve) => {
                    if (scene) {
                        const startDirection = scene.direction;
                        const inputTime = performance.now();
                        
                        // Send input
                        window.dispatchEvent(new KeyboardEvent('keydown', {
                            code: startDirection === 'right' ? 'ArrowUp' : 'ArrowRight'
                        }));
                        
                        // Wait for direction change
                        const checkDirection = () => {
                            if (scene.nextDirection !== startDirection) {
                                const responseTime = performance.now() - inputTime;
                                resolve(responseTime);
                            } else {
                                requestAnimationFrame(checkDirection);
                            }
                        };
                        
                        requestAnimationFrame(checkDirection);
                    } else {
                        resolve(-1);
                    }
                });
            });
            
            console.log(`Input latency: ${latency.toFixed(2)}ms`);
            
            // Should respond within 2 frames (33ms at 60 FPS)
            expect(latency).toBeLessThan(33);
        });
    });
});