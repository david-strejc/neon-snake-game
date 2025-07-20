// Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 100;
const SPEED_DECREMENT = 2;
const MIN_SPEED = 40;
const POWER_UP_DURATION = 5000;
const POWER_UP_SPAWN_INTERVAL = 10000;
const POWER_UP_LIFETIME = 8000;
const MAX_POWER_UPS = 2;
const SHIELD_SCORE = 50;
const FOOD_SCORE = 10;
const PARTICLE_LIFESPAN = 300;
const FOOD_PARTICLE_LIFESPAN = 500;
const MAX_CREATION_ATTEMPTS = 100;

class NeonSnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'NeonSnakeGame' });
        this.resetState();
    }

    resetState() {
        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.gameOver = false;
        this.speed = INITIAL_SPEED;
        this.lastMoveTime = 0;
        this.lasers = [];
        this.particles = null;
        this.foodParticles = null;
        this.powerUps = [];
        this.invulnerable = false;
        this.speedBoost = false;
        this.debugText = null;
        this.laserDebugTexts = [];
        this.snakeGraphics = [];
        this.cellSize = 0;
    }

    preload() {
        this.load.setBaseURL('https://labs.phaser.io');
        this.load.image('particle', 'assets/particles/blue.png');
        this.load.image('spark', 'assets/particles/white.png');
    }

    create() {
        this.cellSize = this.game.config.width / GRID_SIZE;
        
        // Debug console
        if (this.game.config.debug) {
            this.createDebugConsole();
        }
        
        this.createBackground();
        this.createParticleSystems();
        this.setupInput();
        this.createLasers();
        this.resetGame();
        
        // Timer for power-ups
        this.time.addEvent({
            delay: POWER_UP_SPAWN_INTERVAL,
            callback: this.createPowerUp,
            callbackScope: this,
            loop: true
        });
    }

    createDebugConsole() {
        this.debugText = this.add.text(10, 10, '', {
            font: '14px Courier',
            fill: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
    }

    createBackground() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ffff, 0.1);
        
        for (let i = 0; i <= GRID_SIZE; i++) {
            graphics.moveTo(i * this.cellSize, 0);
            graphics.lineTo(i * this.cellSize, this.game.config.height);
            graphics.moveTo(0, i * this.cellSize);
            graphics.lineTo(this.game.config.width, i * this.cellSize);
        }
    }

    createParticleSystems() {
        this.particles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: PARTICLE_LIFESPAN
        });
        this.particles.stop();
        
        this.foodParticles = this.add.particles(0, 0, 'spark', {
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: FOOD_PARTICLE_LIFESPAN,
            quantity: 5
        });
        this.foodParticles.stop();
    }

    setupInput() {
        this.input.keyboard.on('keydown', (event) => {
            if (this.gameOver && event.code === 'Space') {
                this.resetGame();
                return;
            }
            
            this.handleDirectionChange(event.code);
        });
    }

    handleDirectionChange(keyCode) {
        const directionMap = {
            'ArrowUp': { dir: 'up', opposite: 'down' },
            'ArrowDown': { dir: 'down', opposite: 'up' },
            'ArrowLeft': { dir: 'left', opposite: 'right' },
            'ArrowRight': { dir: 'right', opposite: 'left' }
        };

        const mapped = directionMap[keyCode];
        if (mapped && this.direction !== mapped.opposite) {
            this.nextDirection = mapped.dir;
        }
    }

    update(time, delta) {
        if (this.game.config.debug) {
            this.updateDebugInfo(time, delta);
        }
        
        if (this.gameOver) return;
        
        const effectiveSpeed = this.speedBoost ? Math.max(this.speed / 2, MIN_SPEED) : this.speed;
        
        if (time - this.lastMoveTime > effectiveSpeed) {
            this.lastMoveTime = time;
            this.direction = this.nextDirection;
            this.moveSnake();
        }
        
        this.updateLasers(time);
        this.updatePowerUps(time);
    }

    updateLasers(time) {
        this.lasers.forEach((laser, index) => {
            laser.alpha = 0.5 + Math.sin(time * 0.01 + index) * 0.5;
            
            if (laser.getData('type') === 'horizontal') {
                laser.setScale(1, 0.5 + Math.sin(time * 0.005) * 0.3);
            } else {
                laser.setScale(0.5 + Math.sin(time * 0.005) * 0.3, 1);
            }
        });
    }

    updatePowerUps(time) {
        this.powerUps.forEach(powerUp => {
            powerUp.setScale(0.8 + Math.sin(time * 0.01) * 0.2);
            powerUp.angle += 2;
        });
    }

    resetGame() {
        // Clear pending timers
        this.time.removeAllEvents();
        
        // Re-add power-up timer
        this.time.addEvent({
            delay: POWER_UP_SPAWN_INTERVAL,
            callback: this.createPowerUp,
            callbackScope: this,
            loop: true
        });
        
        // Reset state
        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameOver = false;
        this.speed = INITIAL_SPEED;
        this.invulnerable = false;
        this.speedBoost = false;
        
        // Update UI
        this.events.emit('scoreChanged', this.score);
        this.events.emit('gameOverChanged', false);
        
        // Clean up graphics
        this.cleanupGraphics();
        
        // Create new snake
        this.initializeSnake();
        this.createFood();
        this.drawSnake();
    }

    cleanupGraphics() {
        // Clean snake graphics
        if (this.snakeGraphics) {
            this.snakeGraphics.forEach(g => g.destroy());
        }
        this.snakeGraphics = [];
        
        // Clean food
        if (this.food) {
            this.food.destroy();
            this.food = null;
        }
        
        // Clean power-ups
        this.powerUps.forEach(p => p.destroy());
        this.powerUps = [];
        
        // Clean lasers
        this.lasers.forEach(l => l.destroy());
        this.lasers = [];
        
        // Clean laser debug texts
        this.laserDebugTexts.forEach(t => t.destroy());
        this.laserDebugTexts = [];
        
        // Recreate lasers
        this.createLasers();
    }

    initializeSnake() {
        const startX = Math.floor(GRID_SIZE / 2);
        const startY = Math.floor(GRID_SIZE / 2);
        
        for (let i = 0; i < 4; i++) {
            this.snake.push({ x: startX - i, y: startY });
            
            const segment = this.add.graphics();
            this.snakeGraphics.push(segment);
        }
    }

    moveSnake() {
        const head = { ...this.snake[0] };
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision
        if (this.checkWallCollision(head)) {
            this.endGame();
            return;
        }
        
        // Check self collision (skip checking against current head position)
        if (this.checkSelfCollision(head)) {
            this.endGame();
            return;
        }
        
        // Check laser collision
        if (!this.invulnerable && this.checkLaserCollision(head)) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (this.checkFoodCollision(head)) {
            this.eatFood();
        } else {
            this.removeTail();
        }
        
        // Check power-up collision
        this.checkPowerUpCollision(head);
        
        // Add new graphics segment
        const segment = this.add.graphics();
        this.snakeGraphics.unshift(segment);
        
        this.drawSnake();
        this.emitParticleTrail();
    }

    checkWallCollision(position) {
        return position.x < 0 || position.x >= GRID_SIZE || 
               position.y < 0 || position.y >= GRID_SIZE;
    }

    checkSelfCollision(head) {
        // Check collision with body segments (not including the current head)
        return this.snake.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    checkFoodCollision(head) {
        return this.food && 
               head.x === this.food.getData('gridX') && 
               head.y === this.food.getData('gridY');
    }

    eatFood() {
        this.score += FOOD_SCORE;
        this.events.emit('scoreChanged', this.score);
        
        // Particle effect
        this.foodParticles.emitParticleAt(this.food.x, this.food.y, 10);
        
        this.createFood();
        
        // Speed up game
        if (this.speed > MIN_SPEED) {
            this.speed = Math.max(this.speed - SPEED_DECREMENT, MIN_SPEED);
        }
    }

    removeTail() {
        this.snake.pop();
        const tailGraphic = this.snakeGraphics.pop();
        if (tailGraphic) {
            tailGraphic.destroy();
        }
    }

    emitParticleTrail() {
        if (this.snake.length > 1) {
            const tail = this.snake[this.snake.length - 1];
            this.particles.emitParticleAt(
                tail.x * this.cellSize + this.cellSize / 2,
                tail.y * this.cellSize + this.cellSize / 2,
                1
            );
        }
    }

    drawSnake() {
        this.snakeGraphics.forEach((graphics, index) => {
            graphics.clear();
            
            const segment = this.snake[index];
            if (!segment) return;
            
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            if (index === 0) {
                this.drawSnakeHead(graphics, x, y);
            } else {
                this.drawSnakeBody(graphics, x, y, index);
            }
        });
    }

    drawSnakeHead(graphics, x, y) {
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        
        // Glow effect
        graphics.lineStyle(2, 0xff00ff, 0.8);
        graphics.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        
        // Eyes
        this.drawSnakeEyes(graphics, x, y);
    }

    drawSnakeEyes(graphics, x, y) {
        graphics.fillStyle(0xffffff, 1);
        const eyePositions = {
            'right': [[this.cellSize - 8, 8], [this.cellSize - 8, this.cellSize - 8]],
            'left': [[8, 8], [8, this.cellSize - 8]],
            'up': [[8, 8], [this.cellSize - 8, 8]],
            'down': [[8, this.cellSize - 8], [this.cellSize - 8, this.cellSize - 8]]
        };
        
        const positions = eyePositions[this.direction];
        positions.forEach(([ex, ey]) => {
            graphics.fillCircle(x + ex, y + ey, 2);
        });
    }

    drawSnakeBody(graphics, x, y, index) {
        const alpha = 1 - (index / this.snake.length) * 0.5;
        const color = this.invulnerable ? 0xffff00 : 0x00ff00;
        
        graphics.fillStyle(color, alpha);
        graphics.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
        
        graphics.lineStyle(1, color, alpha * 0.8);
        graphics.strokeRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6);
    }

    createFood() {
        const position = this.findValidPosition([]);
        
        if (!position) {
            console.warn('Could not find valid position for food');
            return;
        }
        
        if (this.food) {
            this.food.destroy();
        }
        
        this.food = this.add.graphics();
        this.food.setData('gridX', position.x);
        this.food.setData('gridY', position.y);
        
        this.drawFood(position);
    }

    drawFood(position) {
        const pixelX = position.x * this.cellSize + this.cellSize / 2;
        const pixelY = position.y * this.cellSize + this.cellSize / 2;
        
        this.food.fillStyle(0xffff00, 1);
        this.food.fillCircle(pixelX, pixelY, this.cellSize / 3);
        
        this.food.lineStyle(2, 0xffff00, 0.8);
        for (let i = 0; i < 3; i++) {
            this.food.strokeCircle(pixelX, pixelY, this.cellSize / 3 + i * 3);
            this.food.lineStyle(2, 0xffff00, 0.8 - i * 0.3);
        }
    }

    findValidPosition(excludePositions = []) {
        let attempts = 0;
        
        while (attempts < MAX_CREATION_ATTEMPTS) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            
            if (this.isPositionValid(x, y, excludePositions)) {
                return { x, y };
            }
            attempts++;
        }
        
        // Fallback: scan grid systematically
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (this.isPositionValid(i, j, excludePositions)) {
                    return { x: i, y: j };
                }
            }
        }
        
        return null;
    }

    isPositionValid(x, y, excludePositions = []) {
        // Check snake collision
        if (this.snake.some(segment => segment.x === x && segment.y === y)) {
            return false;
        }
        
        // Check laser collision
        if (this.checkLaserCollision({ x, y })) {
            return false;
        }
        
        // Check food collision
        if (this.food && 
            this.food.getData('gridX') === x && 
            this.food.getData('gridY') === y) {
            return false;
        }
        
        // Check excluded positions
        if (excludePositions.some(pos => pos.x === x && pos.y === y)) {
            return false;
        }
        
        return true;
    }

    createLasers() {
        const laserPositions = [
            { x: 5, y: 5, type: 'horizontal', length: 5 },
            { x: 10, y: 14, type: 'vertical', length: 4 },
            { x: 14, y: 8, type: 'horizontal', length: 3 },
            { x: 3, y: 10, type: 'vertical', length: 6 }
        ];
        
        laserPositions.forEach((pos, index) => {
            const laser = this.createLaser(pos);
            this.lasers.push(laser);
            
            if (this.game.config.debug) {
                this.createLaserDebugText(pos, index + 1);
            }
        });
    }

    createLaser(config) {
        const laser = this.add.graphics();
        laser.setData('gridX', config.x);
        laser.setData('gridY', config.y);
        laser.setData('type', config.type);
        laser.setData('length', config.length);
        
        this.drawLaser(laser, config);
        laser.setBlendMode(Phaser.BlendModes.ADD);
        
        return laser;
    }

    drawLaser(laser, config) {
        laser.lineStyle(4, 0xff0000, 1);
        laser.fillStyle(0xff0000, 0.3);
        
        if (config.type === 'horizontal') {
            const startX = config.x * this.cellSize;
            const startY = config.y * this.cellSize + this.cellSize / 2;
            const endX = (config.x + config.length) * this.cellSize;
            
            laser.moveTo(startX, startY);
            laser.lineTo(endX, startY);
            laser.strokePath();
            laser.fillRect(startX, startY - 2, endX - startX, 4);
        } else {
            const startX = config.x * this.cellSize + this.cellSize / 2;
            const startY = config.y * this.cellSize;
            const endY = (config.y + config.length) * this.cellSize;
            
            laser.moveTo(startX, startY);
            laser.lineTo(startX, endY);
            laser.strokePath();
            laser.fillRect(startX - 2, startY, 4, endY - startY);
        }
    }

    createLaserDebugText(pos, index) {
        const debugLabel = this.add.text(
            pos.x * this.cellSize + 2,
            pos.y * this.cellSize + 2,
            `L${index}: ${pos.type[0].toUpperCase()} ${pos.length}`,
            {
                font: '10px Courier',
                fill: '#ff0000',
                backgroundColor: '#00000088'
            }
        );
        debugLabel.setDepth(999);
        this.laserDebugTexts.push(debugLabel);
    }

    checkLaserCollision(position) {
        return this.lasers.some(laser => {
            const laserX = laser.getData('gridX');
            const laserY = laser.getData('gridY');
            const type = laser.getData('type');
            const length = laser.getData('length');
            
            if (type === 'horizontal') {
                return position.y === laserY && 
                       position.x >= laserX && 
                       position.x < laserX + length;
            } else {
                return position.x === laserX && 
                       position.y >= laserY && 
                       position.y < laserY + length;
            }
        });
    }

    createPowerUp() {
        if (this.powerUps.length >= MAX_POWER_UPS) return;
        
        const position = this.findValidPosition(
            this.powerUps.map(p => ({ 
                x: p.getData('gridX'), 
                y: p.getData('gridY') 
            }))
        );
        
        if (!position) {
            console.warn('Could not find valid position for power-up');
            return;
        }
        
        const type = Math.random() > 0.5 ? 'shield' : 'speed';
        const powerUp = this.createPowerUpGraphics(position, type);
        
        this.powerUps.push(powerUp);
        
        // Auto-destroy after lifetime
        this.time.delayedCall(POWER_UP_LIFETIME, () => {
            this.destroyPowerUp(powerUp);
        });
    }

    createPowerUpGraphics(position, type) {
        const powerUp = this.add.graphics();
        powerUp.setData('gridX', position.x);
        powerUp.setData('gridY', position.y);
        powerUp.setData('type', type);
        
        const pixelX = position.x * this.cellSize + this.cellSize / 2;
        const pixelY = position.y * this.cellSize + this.cellSize / 2;
        
        powerUp.x = pixelX;
        powerUp.y = pixelY;
        
        this.drawPowerUp(powerUp, type);
        powerUp.setBlendMode(Phaser.BlendModes.ADD);
        
        return powerUp;
    }

    drawPowerUp(powerUp, type) {
        if (type === 'shield') {
            powerUp.lineStyle(3, 0x00ffff, 1);
            powerUp.strokeCircle(0, 0, this.cellSize / 2.5);
            powerUp.lineStyle(2, 0x00ffff, 0.5);
            powerUp.strokeCircle(0, 0, this.cellSize / 2);
        } else {
            powerUp.lineStyle(3, 0xff00ff, 1);
            powerUp.moveTo(-this.cellSize / 3, 0);
            powerUp.lineTo(this.cellSize / 3, 0);
            powerUp.moveTo(0, -this.cellSize / 3);
            powerUp.lineTo(0, this.cellSize / 3);
            powerUp.strokePath();
        }
    }

    destroyPowerUp(powerUp) {
        const index = this.powerUps.indexOf(powerUp);
        if (index > -1) {
            powerUp.destroy();
            this.powerUps.splice(index, 1);
        }
    }

    checkPowerUpCollision(head) {
        this.powerUps.forEach((powerUp, index) => {
            if (powerUp.getData('gridX') === head.x && 
                powerUp.getData('gridY') === head.y) {
                
                this.collectPowerUp(powerUp);
            }
        });
    }

    collectPowerUp(powerUp) {
        const type = powerUp.getData('type');
        
        if (type === 'shield') {
            this.activateShield();
        } else {
            this.activateSpeedBoost();
        }
        
        // Particle burst
        this.particles.emitParticleAt(powerUp.x, powerUp.y, 20);
        
        this.destroyPowerUp(powerUp);
        this.score += SHIELD_SCORE;
        this.events.emit('scoreChanged', this.score);
    }

    activateShield() {
        this.invulnerable = true;
        this.time.delayedCall(POWER_UP_DURATION, () => {
            this.invulnerable = false;
        });
        
        this.cameras.main.flash(500, 0, 255, 255);
    }

    activateSpeedBoost() {
        this.speedBoost = true;
        this.time.delayedCall(POWER_UP_DURATION, () => {
            this.speedBoost = false;
        });
        
        this.cameras.main.flash(500, 255, 0, 255);
    }

    updateDebugInfo(time, delta) {
        const fps = Math.round(this.game.loop.actualFps);
        const headPos = this.snake.length > 0 ? 
            `(${this.snake[0].x},${this.snake[0].y})` : '(-,-)';
        const foodPos = this.food ? 
            `(${this.food.getData('gridX')},${this.food.getData('gridY')})` : '(-,-)';
        
        let debugInfo = [
            `FPS: ${fps} | Delta: ${delta.toFixed(1)}ms`,
            `Snake: ${headPos} Len:${this.snake.length} Dir:${this.direction}`,
            `Food: ${foodPos}`,
            `Score: ${this.score} | Speed: ${this.speed}ms`,
            `Lasers: ${this.lasers.length} | PowerUps: ${this.powerUps.length}`,
            `Status: ${this.invulnerable ? 'INVULN' : ''} ${this.speedBoost ? 'BOOST' : ''}`
        ];
        
        // Check collision warnings
        this.addCollisionWarnings(debugInfo);
        
        this.debugText.setText(debugInfo.join('\n'));
    }

    addCollisionWarnings(debugInfo) {
        if (this.snake.length > 0) {
            const head = this.snake[0];
            this.lasers.forEach((laser, idx) => {
                if (this.checkLaserCollision(head) && !this.invulnerable) {
                    debugInfo.push(`⚠️ LASER ${idx + 1} COLLISION!`);
                }
            });
        }
    }

    endGame() {
        this.gameOver = true;
        this.events.emit('gameOverChanged', true);
        
        // Explosion effect
        this.createExplosionEffect();
        
        this.cameras.main.shake(500, 0.02);
        this.cameras.main.flash(1000, 255, 0, 0);
    }

    createExplosionEffect() {
        this.snake.forEach((segment, index) => {
            this.time.delayedCall(index * 50, () => {
                this.particles.emitParticleAt(
                    segment.x * this.cellSize + this.cellSize / 2,
                    segment.y * this.cellSize + this.cellSize / 2,
                    10
                );
            });
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    fps: {
        target: 60,
        forceSetTimeOut: false
    },
    scene: NeonSnakeGame,
    debug: true  // Set to false for production
};

// Create game instance
const game = new Phaser.Game(config);

// UI Bridge - connects game events to DOM
game.events.on('ready', () => {
    const scene = game.scene.getScene('NeonSnakeGame');
    
    scene.events.on('scoreChanged', (score) => {
        const element = document.getElementById('score-value');
        if (element) element.textContent = score;
    });
    
    scene.events.on('gameOverChanged', (isGameOver) => {
        const element = document.getElementById('game-over');
        if (element) element.style.display = isGameOver ? 'block' : 'none';
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NeonSnakeGame, config };
}