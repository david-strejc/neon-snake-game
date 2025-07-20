const { NeonSnakeGame } = require('../../js/game-refactored');

describe('NeonSnakeGame - Core Logic', () => {
    let game;
    let scene;

    beforeEach(() => {
        // Mock Phaser scene
        scene = new NeonSnakeGame();
        scene.game = { config: { width: 800, height: 600, debug: false } };
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
                getData: jest.fn(),
                destroy: jest.fn(),
                setBlendMode: jest.fn(),
                setScale: jest.fn(),
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
            addEvent: jest.fn(),
            delayedCall: jest.fn(),
            removeAllEvents: jest.fn()
        };
        scene.input = {
            keyboard: {
                on: jest.fn()
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
        
        scene.cellSize = 40; // 800 / 20
    });

    describe('initialization', () => {
        test('should initialize with correct default state', () => {
            scene.resetState();
            
            expect(scene.snake).toEqual([]);
            expect(scene.direction).toBe('right');
            expect(scene.nextDirection).toBe('right');
            expect(scene.score).toBe(0);
            expect(scene.gameOver).toBe(false);
            expect(scene.speed).toBe(100);
            expect(scene.invulnerable).toBe(false);
            expect(scene.speedBoost).toBe(false);
        });

        test('should create snake with 4 segments at center', () => {
            scene.initializeSnake();
            
            expect(scene.snake.length).toBe(4);
            expect(scene.snake[0]).toEqual({ x: 10, y: 10 }); // center of 20x20 grid
            expect(scene.snake[1]).toEqual({ x: 9, y: 10 });
            expect(scene.snake[2]).toEqual({ x: 8, y: 10 });
            expect(scene.snake[3]).toEqual({ x: 7, y: 10 });
        });
    });

    describe('movement', () => {
        beforeEach(() => {
            scene.snake = [
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ];
            scene.snakeGraphics = [
                scene.add.graphics(),
                scene.add.graphics(),
                scene.add.graphics()
            ];
        });

        test('should move right correctly', () => {
            scene.direction = 'right';
            scene.moveSnake();
            
            expect(scene.snake[0]).toEqual({ x: 11, y: 10 });
        });

        test('should move left correctly', () => {
            scene.direction = 'left';
            scene.moveSnake();
            
            expect(scene.snake[0]).toEqual({ x: 9, y: 10 });
        });

        test('should move up correctly', () => {
            scene.direction = 'up';
            scene.moveSnake();
            
            expect(scene.snake[0]).toEqual({ x: 10, y: 9 });
        });

        test('should move down correctly', () => {
            scene.direction = 'down';
            scene.moveSnake();
            
            expect(scene.snake[0]).toEqual({ x: 10, y: 11 });
        });

        test('should not allow opposite direction changes', () => {
            scene.direction = 'right';
            scene.handleDirectionChange('ArrowLeft');
            expect(scene.nextDirection).toBe('right');
            
            scene.direction = 'up';
            scene.handleDirectionChange('ArrowDown');
            expect(scene.nextDirection).toBe('up');
        });

        test('should allow perpendicular direction changes', () => {
            scene.direction = 'right';
            scene.handleDirectionChange('ArrowUp');
            expect(scene.nextDirection).toBe('up');
            
            scene.direction = 'up';
            scene.handleDirectionChange('ArrowLeft');
            expect(scene.nextDirection).toBe('left');
        });
    });

    describe('collisions', () => {
        beforeEach(() => {
            scene.snake = [
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ];
        });

        test('should detect wall collision - left wall', () => {
            expect(scene.checkWallCollision({ x: -1, y: 10 })).toBe(true);
        });

        test('should detect wall collision - right wall', () => {
            expect(scene.checkWallCollision({ x: 20, y: 10 })).toBe(true);
        });

        test('should detect wall collision - top wall', () => {
            expect(scene.checkWallCollision({ x: 10, y: -1 })).toBe(true);
        });

        test('should detect wall collision - bottom wall', () => {
            expect(scene.checkWallCollision({ x: 10, y: 20 })).toBe(true);
        });

        test('should not detect wall collision for valid positions', () => {
            expect(scene.checkWallCollision({ x: 0, y: 0 })).toBe(false);
            expect(scene.checkWallCollision({ x: 19, y: 19 })).toBe(false);
        });

        test('should detect self collision correctly', () => {
            const head = { x: 9, y: 10 }; // Collides with second segment
            expect(scene.checkSelfCollision(head)).toBe(true);
        });

        test('should not detect self collision with current head position', () => {
            const head = { x: 10, y: 10 }; // Same as current head
            expect(scene.checkSelfCollision(head)).toBe(false);
        });

        test('should detect laser collision - horizontal', () => {
            scene.lasers = [{
                getData: jest.fn((key) => {
                    const data = { gridX: 5, gridY: 5, type: 'horizontal', length: 5 };
                    return data[key];
                })
            }];
            
            expect(scene.checkLaserCollision({ x: 5, y: 5 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 7, y: 5 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 9, y: 5 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 10, y: 5 })).toBe(false);
            expect(scene.checkLaserCollision({ x: 5, y: 6 })).toBe(false);
        });

        test('should detect laser collision - vertical', () => {
            scene.lasers = [{
                getData: jest.fn((key) => {
                    const data = { gridX: 10, gridY: 5, type: 'vertical', length: 4 };
                    return data[key];
                })
            }];
            
            expect(scene.checkLaserCollision({ x: 10, y: 5 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 10, y: 7 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 10, y: 8 })).toBe(true);
            expect(scene.checkLaserCollision({ x: 10, y: 9 })).toBe(false);
            expect(scene.checkLaserCollision({ x: 11, y: 5 })).toBe(false);
        });
    });

    describe('food mechanics', () => {
        beforeEach(() => {
            scene.snake = [{ x: 10, y: 10 }];
            scene.food = {
                getData: jest.fn((key) => {
                    const data = { gridX: 15, gridY: 15 };
                    return data[key];
                }),
                destroy: jest.fn()
            };
        });

        test('should detect food collision', () => {
            expect(scene.checkFoodCollision({ x: 15, y: 15 })).toBe(true);
            expect(scene.checkFoodCollision({ x: 10, y: 10 })).toBe(false);
        });

        test('should increase score when eating food', () => {
            scene.eatFood();
            
            expect(scene.score).toBe(10);
            expect(scene.events.emit).toHaveBeenCalledWith('scoreChanged', 10);
        });

        test('should speed up game when eating food', () => {
            scene.speed = 100;
            scene.eatFood();
            
            expect(scene.speed).toBe(98);
        });

        test('should not speed up below minimum speed', () => {
            scene.speed = 41;
            scene.eatFood();
            
            expect(scene.speed).toBe(40); // MIN_SPEED
        });

        test('should find valid position for food', () => {
            scene.snake = [{ x: 10, y: 10 }];
            scene.lasers = [];
            scene.food = null;
            
            const position = scene.findValidPosition();
            
            expect(position).toBeTruthy();
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(20);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeLessThan(20);
            expect(position.x !== 10 || position.y !== 10).toBe(true); // Not on snake
        });
    });

    describe('power-ups', () => {
        beforeEach(() => {
            scene.snake = [{ x: 10, y: 10 }];
            scene.powerUps = [];
        });

        test('should activate shield power-up', () => {
            scene.activateShield();
            
            expect(scene.invulnerable).toBe(true);
            expect(scene.time.delayedCall).toHaveBeenCalledWith(
                5000,
                expect.any(Function)
            );
            expect(scene.cameras.main.flash).toHaveBeenCalledWith(500, 0, 255, 255);
        });

        test('should activate speed boost power-up', () => {
            scene.activateSpeedBoost();
            
            expect(scene.speedBoost).toBe(true);
            expect(scene.time.delayedCall).toHaveBeenCalledWith(
                5000,
                expect.any(Function)
            );
            expect(scene.cameras.main.flash).toHaveBeenCalledWith(500, 255, 0, 255);
        });

        test('should collect power-up and increase score', () => {
            const powerUp = {
                getData: jest.fn(() => 'shield'),
                x: 100,
                y: 100,
                destroy: jest.fn()
            };
            scene.powerUps = [powerUp];
            
            scene.collectPowerUp(powerUp);
            
            expect(scene.score).toBe(50);
            expect(scene.invulnerable).toBe(true);
            expect(powerUp.destroy).toHaveBeenCalled();
        });

        test('should not create more than max power-ups', () => {
            scene.powerUps = [
                { getData: jest.fn() },
                { getData: jest.fn() }
            ];
            
            scene.createPowerUp();
            
            expect(scene.add.graphics).not.toHaveBeenCalled();
        });
    });

    describe('game over', () => {
        test('should end game correctly', () => {
            scene.endGame();
            
            expect(scene.gameOver).toBe(true);
            expect(scene.events.emit).toHaveBeenCalledWith('gameOverChanged', true);
            expect(scene.cameras.main.shake).toHaveBeenCalled();
            expect(scene.cameras.main.flash).toHaveBeenCalled();
        });

        test('should reset game correctly', () => {
            scene.gameOver = true;
            scene.score = 100;
            scene.speed = 50;
            scene.invulnerable = true;
            
            scene.resetGame();
            
            expect(scene.gameOver).toBe(false);
            expect(scene.score).toBe(0);
            expect(scene.speed).toBe(100);
            expect(scene.invulnerable).toBe(false);
            expect(scene.events.emit).toHaveBeenCalledWith('scoreChanged', 0);
            expect(scene.events.emit).toHaveBeenCalledWith('gameOverChanged', false);
        });
    });

    describe('position validation', () => {
        test('should validate position correctly', () => {
            scene.snake = [{ x: 10, y: 10 }];
            scene.lasers = [];
            scene.food = null;
            
            expect(scene.isPositionValid(10, 10)).toBe(false); // Snake position
            expect(scene.isPositionValid(5, 5)).toBe(true); // Empty position
        });

        test('should handle excluded positions', () => {
            scene.snake = [];
            scene.lasers = [];
            scene.food = null;
            
            const excludePositions = [{ x: 5, y: 5 }, { x: 6, y: 6 }];
            
            expect(scene.isPositionValid(5, 5, excludePositions)).toBe(false);
            expect(scene.isPositionValid(6, 6, excludePositions)).toBe(false);
            expect(scene.isPositionValid(7, 7, excludePositions)).toBe(true);
        });
    });
});