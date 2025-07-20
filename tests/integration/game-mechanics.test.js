const { NeonSnakeGame, config } = require('../../js/game-refactored');

describe('NeonSnakeGame - Integration Tests', () => {
    let game;
    let scene;

    beforeEach(() => {
        // Create a more complete mock Phaser environment
        global.Phaser = {
            AUTO: 'AUTO',
            Game: jest.fn(function(config) {
                this.config = config;
                this.scene = {
                    getScene: jest.fn(() => scene)
                };
                this.events = {
                    on: jest.fn()
                };
                this.loop = {
                    actualFps: 60
                };
            }),
            Scene: jest.fn(),
            BlendModes: {
                ADD: 'ADD'
            }
        };

        // Create scene instance
        scene = new NeonSnakeGame();
        
        // Mock all necessary Phaser methods
        scene.game = { 
            config: { 
                width: 800, 
                height: 600, 
                debug: false 
            },
            loop: {
                actualFps: 60
            }
        };
        
        scene.add = {
            graphics: jest.fn(() => ({
                clear: jest.fn(),
                fillStyle: jest.fn(),
                fillRect: jest.fn(),
                fillCircle: jest.fn(),
                lineStyle: jest.fn(),
                strokeRect: jest.fn(),
                strokeCircle: jest.fn(),
                strokePath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                setData: jest.fn(),
                getData: jest.fn(function(key) {
                    return this._data && this._data[key];
                }),
                destroy: jest.fn(),
                setBlendMode: jest.fn(),
                setScale: jest.fn(),
                _data: {},
                x: 0,
                y: 0,
                angle: 0,
                alpha: 1
            })),
            text: jest.fn(() => ({
                setText: jest.fn(),
                setScrollFactor: jest.fn(),
                setDepth: jest.fn(),
                destroy: jest.fn()
            })),
            particles: jest.fn(() => ({
                stop: jest.fn(),
                emitParticleAt: jest.fn()
            }))
        };
        
        scene.time = {
            addEvent: jest.fn((config) => {
                if (config.loop && config.callback) {
                    // Simulate timer
                    return { destroy: jest.fn() };
                }
                return {};
            }),
            delayedCall: jest.fn((delay, callback) => {
                // Store callbacks for testing
                scene._delayedCallbacks = scene._delayedCallbacks || [];
                scene._delayedCallbacks.push({ delay, callback });
                return { destroy: jest.fn() };
            }),
            removeAllEvents: jest.fn()
        };
        
        scene.input = {
            keyboard: {
                on: jest.fn((event, handler) => {
                    scene._keyHandlers = scene._keyHandlers || {};
                    scene._keyHandlers[event] = handler;
                })
            }
        };
        
        scene.cameras = {
            main: {
                flash: jest.fn(),
                shake: jest.fn()
            }
        };
        
        scene.events = {
            emit: jest.fn()
        };
        
        scene.load = {
            setBaseURL: jest.fn(),
            image: jest.fn()
        };

        // Initialize the scene
        scene.create();
    });

    describe('full game flow', () => {
        test('should complete a full game cycle', () => {
            // Start game
            expect(scene.gameOver).toBe(false);
            expect(scene.snake.length).toBe(4);
            
            // Move snake
            scene.update(1000, 16);
            expect(scene.lastMoveTime).toBe(1000);
            
            // Simulate eating food
            scene.food._data = { gridX: 11, gridY: 10 };
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.score).toBe(10);
            expect(scene.speed).toBe(98);
            
            // Simulate hitting wall
            scene.snake[0] = { x: 19, y: 10 };
            scene.moveSnake();
            
            expect(scene.gameOver).toBe(true);
        });

        test('should handle multiple food collections', () => {
            const initialLength = scene.snake.length;
            
            // Eat 5 pieces of food
            for (let i = 0; i < 5; i++) {
                scene.food._data = { 
                    gridX: scene.snake[0].x + 1, 
                    gridY: scene.snake[0].y 
                };
                scene.direction = 'right';
                scene.moveSnake();
            }
            
            expect(scene.snake.length).toBe(initialLength + 5);
            expect(scene.score).toBe(50); // 5 * 10
            expect(scene.speed).toBe(90); // 100 - (5 * 2)
        });
    });

    describe('power-up integration', () => {
        test('should handle shield power-up collection and expiration', () => {
            // Create a shield power-up
            const powerUp = scene.add.graphics();
            powerUp._data = { 
                gridX: 11, 
                gridY: 10, 
                type: 'shield' 
            };
            scene.powerUps.push(powerUp);
            
            // Move snake to collect it
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.invulnerable).toBe(true);
            expect(scene.score).toBe(50);
            expect(scene.powerUps.length).toBe(0);
            
            // Simulate timer expiration
            const shieldCallback = scene._delayedCallbacks.find(
                cb => cb.delay === 5000
            );
            shieldCallback.callback();
            
            expect(scene.invulnerable).toBe(false);
        });

        test('should handle speed boost power-up', () => {
            // Create a speed power-up
            const powerUp = scene.add.graphics();
            powerUp._data = { 
                gridX: 11, 
                gridY: 10, 
                type: 'speed' 
            };
            scene.powerUps.push(powerUp);
            
            // Move snake to collect it
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.speedBoost).toBe(true);
            
            // Test effective speed in update
            scene.speed = 100;
            scene.lastMoveTime = 0;
            scene.update(150, 16); // Should move at speed/2 = 50ms
            
            expect(scene.lastMoveTime).toBe(150);
        });
    });

    describe('laser collision with shield', () => {
        test('should survive laser collision with shield active', () => {
            // Create laser
            const laser = scene.add.graphics();
            laser._data = { 
                gridX: 11, 
                gridY: 10, 
                type: 'horizontal', 
                length: 3 
            };
            scene.lasers.push(laser);
            
            // Activate shield
            scene.invulnerable = true;
            
            // Move into laser
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.gameOver).toBe(false);
        });

        test('should die from laser collision without shield', () => {
            // Create laser
            const laser = scene.add.graphics();
            laser._data = { 
                gridX: 11, 
                gridY: 10, 
                type: 'horizontal', 
                length: 3 
            };
            scene.lasers.push(laser);
            
            // Move into laser without shield
            scene.invulnerable = false;
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.gameOver).toBe(true);
        });
    });

    describe('keyboard input integration', () => {
        test('should handle direction changes correctly', () => {
            const keyHandler = scene._keyHandlers['keydown'];
            
            // Valid direction change
            scene.direction = 'right';
            keyHandler({ code: 'ArrowUp' });
            expect(scene.nextDirection).toBe('up');
            
            // Invalid direction change (opposite)
            scene.direction = 'up';
            keyHandler({ code: 'ArrowDown' });
            expect(scene.nextDirection).toBe('up'); // Should not change
            
            // Space to restart when game over
            scene.gameOver = true;
            const resetSpy = jest.spyOn(scene, 'resetGame');
            keyHandler({ code: 'Space' });
            expect(resetSpy).toHaveBeenCalled();
        });
    });

    describe('scoring system', () => {
        test('should calculate correct scores for different actions', () => {
            // Food collection
            scene.eatFood();
            expect(scene.score).toBe(10);
            
            // Shield power-up collection
            const shieldPowerUp = scene.add.graphics();
            shieldPowerUp._data = { type: 'shield' };
            scene.collectPowerUp(shieldPowerUp);
            expect(scene.score).toBe(60); // 10 + 50
            
            // Speed power-up collection
            const speedPowerUp = scene.add.graphics();
            speedPowerUp._data = { type: 'speed' };
            scene.collectPowerUp(speedPowerUp);
            expect(scene.score).toBe(110); // 60 + 50
        });
    });

    describe('game reset integration', () => {
        test('should properly reset all game state', () => {
            // Modify game state
            scene.score = 100;
            scene.speed = 50;
            scene.invulnerable = true;
            scene.speedBoost = true;
            scene.gameOver = true;
            scene.snake = [{ x: 15, y: 15 }];
            scene.powerUps = [scene.add.graphics(), scene.add.graphics()];
            scene.lasers = [scene.add.graphics()];
            
            // Reset game
            scene.resetGame();
            
            // Verify state reset
            expect(scene.score).toBe(0);
            expect(scene.speed).toBe(100);
            expect(scene.invulnerable).toBe(false);
            expect(scene.speedBoost).toBe(false);
            expect(scene.gameOver).toBe(false);
            expect(scene.snake.length).toBe(4);
            expect(scene.powerUps.length).toBe(0);
            expect(scene.lasers.length).toBe(4); // Recreated
            
            // Verify events emitted
            expect(scene.events.emit).toHaveBeenCalledWith('scoreChanged', 0);
            expect(scene.events.emit).toHaveBeenCalledWith('gameOverChanged', false);
        });
    });

    describe('particle effects', () => {
        test('should emit particles on food collection', () => {
            scene.food._data = { gridX: 11, gridY: 10 };
            scene.food.x = 11 * 40 + 20;
            scene.food.y = 10 * 40 + 20;
            
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.foodParticles.emitParticleAt).toHaveBeenCalledWith(
                scene.food.x,
                scene.food.y,
                10
            );
        });

        test('should emit particle trail while moving', () => {
            scene.moveSnake();
            
            const tail = scene.snake[scene.snake.length - 1];
            expect(scene.particles.emitParticleAt).toHaveBeenCalledWith(
                tail.x * 40 + 20,
                tail.y * 40 + 20,
                1
            );
        });
    });

    describe('difficulty progression', () => {
        test('should increase difficulty as game progresses', () => {
            const initialSpeed = scene.speed;
            
            // Eat 20 pieces of food
            for (let i = 0; i < 20; i++) {
                scene.eatFood();
            }
            
            expect(scene.speed).toBe(60); // 100 - (20 * 2)
            expect(scene.score).toBe(200); // 20 * 10
            
            // Speed should not go below minimum
            for (let i = 0; i < 20; i++) {
                scene.eatFood();
            }
            
            expect(scene.speed).toBe(40); // MIN_SPEED
        });
    });
});