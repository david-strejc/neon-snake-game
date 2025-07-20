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
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let snake = [];
let direction = 'right';
let nextDirection = 'right';
let food;
let score = 0;
let gameOver = false;
let speed = 100;
let lastMoveTime = 0;
let lasers = [];
let particles;
let foodParticles;
let powerUps = [];
let invulnerable = false;
let speedBoost = false;
let debugText;
let laserDebugTexts = [];

const GRID_SIZE = 20;
const CELL_SIZE = config.width / GRID_SIZE;

const game = new Phaser.Game(config);

function preload() {
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('particle', 'assets/particles/blue.png');
    this.load.image('spark', 'assets/particles/white.png');
}

function create() {
    // Debug konzole
    debugText = this.add.text(10, 10, '', {
        font: '14px Courier',
        fill: '#00ff00',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 5 }
    });
    debugText.setScrollFactor(0);
    debugText.setDepth(1000);
    
    // Neonový efekt pro pozadí
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x00ffff, 0.1);
    
    for (let i = 0; i <= GRID_SIZE; i++) {
        graphics.moveTo(i * CELL_SIZE, 0);
        graphics.lineTo(i * CELL_SIZE, config.height);
        graphics.moveTo(0, i * CELL_SIZE);
        graphics.lineTo(config.width, i * CELL_SIZE);
    }
    
    // Particle systém pro efekty
    particles = this.add.particles(0, 0, 'particle', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 300
    });
    particles.stop();
    
    foodParticles = this.add.particles(0, 0, 'spark', {
        speed: { min: 100, max: 200 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        quantity: 5
    });
    foodParticles.stop();
    
    // Inicializace hada
    resetGame.call(this);
    
    // Ovládání
    this.input.keyboard.on('keydown', (event) => {
        if (gameOver && event.code === 'Space') {
            resetGame.call(this);
            return;
        }
        
        switch(event.code) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });
    
    // Vytvoření laserových pastí
    createLasers.call(this);
    
    // Timer pro power-upy
    this.time.addEvent({
        delay: 10000,
        callback: createPowerUp,
        callbackScope: this,
        loop: true
    });
}

function update(time, delta) {
    // Update debug info
    updateDebugInfo.call(this, time, delta);
    
    if (gameOver) return;
    
    if (time - lastMoveTime > (speedBoost ? speed / 2 : speed)) {
        lastMoveTime = time;
        direction = nextDirection;
        moveSnake.call(this);
    }
    
    // Animace laserů
    lasers.forEach((laser, index) => {
        laser.alpha = 0.5 + Math.sin(time * 0.01 + index) * 0.5;
        
        // Rotace horizontálních laserů
        if (laser.getData('type') === 'horizontal') {
            laser.setScale(1, 0.5 + Math.sin(time * 0.005) * 0.3);
        } else {
            laser.setScale(0.5 + Math.sin(time * 0.005) * 0.3, 1);
        }
    });
    
    // Animace power-upů
    powerUps.forEach(powerUp => {
        powerUp.setScale(0.8 + Math.sin(time * 0.01) * 0.2);
        powerUp.angle += 2;
    });
}

function resetGame() {
    snake = [];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameOver = false;
    speed = 100;
    invulnerable = false;
    speedBoost = false;
    
    document.getElementById('score-value').textContent = score;
    document.getElementById('game-over').style.display = 'none';
    
    // Vyčištění starých objektů
    if (this.snakeGraphics) {
        this.snakeGraphics.forEach(g => g.destroy());
    }
    if (food) food.destroy();
    powerUps.forEach(p => p.destroy());
    powerUps = [];
    
    // Clear laser debug texts
    laserDebugTexts.forEach(t => t.destroy());
    laserDebugTexts = [];
    
    this.snakeGraphics = [];
    
    // Vytvoření nového hada
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    
    for (let i = 0; i < 4; i++) {
        snake.push({ x: startX - i, y: startY });
        
        const segment = this.add.graphics();
        this.snakeGraphics.push(segment);
    }
    
    createFood.call(this);
    drawSnake.call(this);
}

function moveSnake() {
    const head = { ...snake[0] };
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Kontrola kolize se stěnami
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame.call(this);
        return;
    }
    
    // Kontrola kolize se sebou
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame.call(this);
        return;
    }
    
    // Kontrola kolize s lasery
    if (!invulnerable && checkLaserCollision(head)) {
        endGame.call(this);
        return;
    }
    
    snake.unshift(head);
    
    // Kontrola jídla
    if (head.x === food.getData('gridX') && head.y === food.getData('gridY')) {
        score += 10;
        document.getElementById('score-value').textContent = score;
        
        // Particle efekt
        foodParticles.emitParticleAt(food.x, food.y, 10);
        
        createFood.call(this);
        
        // Zrychlení hry
        if (speed > 50) speed -= 2;
    } else {
        const tail = snake.pop();
        this.snakeGraphics[this.snakeGraphics.length - 1].destroy();
        this.snakeGraphics.pop();
    }
    
    // Kontrola power-upů
    checkPowerUpCollision.call(this, head);
    
    // Přidání nového segmentu na začátek
    const segment = this.add.graphics();
    this.snakeGraphics.unshift(segment);
    
    drawSnake.call(this);
    
    // Particle trail efekt
    if (snake.length > 1) {
        const tail = snake[snake.length - 1];
        particles.emitParticleAt(
            tail.x * CELL_SIZE + CELL_SIZE / 2,
            tail.y * CELL_SIZE + CELL_SIZE / 2,
            1
        );
    }
}

function drawSnake() {
    this.snakeGraphics.forEach((graphics, index) => {
        graphics.clear();
        
        const segment = snake[index];
        if (!segment) return;
        
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        
        // Neonový efekt pro hlavu
        if (index === 0) {
            graphics.fillStyle(0xff00ff, 1);
            graphics.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            
            // Glow efekt
            graphics.lineStyle(2, 0xff00ff, 0.8);
            graphics.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            
            // Oči
            graphics.fillStyle(0xffffff, 1);
            switch(direction) {
                case 'right':
                    graphics.fillCircle(x + CELL_SIZE - 8, y + 8, 2);
                    graphics.fillCircle(x + CELL_SIZE - 8, y + CELL_SIZE - 8, 2);
                    break;
                case 'left':
                    graphics.fillCircle(x + 8, y + 8, 2);
                    graphics.fillCircle(x + 8, y + CELL_SIZE - 8, 2);
                    break;
                case 'up':
                    graphics.fillCircle(x + 8, y + 8, 2);
                    graphics.fillCircle(x + CELL_SIZE - 8, y + 8, 2);
                    break;
                case 'down':
                    graphics.fillCircle(x + 8, y + CELL_SIZE - 8, 2);
                    graphics.fillCircle(x + CELL_SIZE - 8, y + CELL_SIZE - 8, 2);
                    break;
            }
        } else {
            // Gradient efekt pro tělo
            const alpha = 1 - (index / snake.length) * 0.5;
            const color = invulnerable ? 0xffff00 : 0x00ff00;
            
            graphics.fillStyle(color, alpha);
            graphics.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            
            graphics.lineStyle(1, color, alpha * 0.8);
            graphics.strokeRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
        }
    });
}

function createFood() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!validPosition && attempts < maxAttempts) {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        
        validPosition = !snake.some(segment => segment.x === x && segment.y === y) &&
                       !checkLaserCollision({ x, y });
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        console.warn('Could not find valid position for food after', maxAttempts, 'attempts');
        // Find first available position
        for (let i = 0; i < GRID_SIZE && !validPosition; i++) {
            for (let j = 0; j < GRID_SIZE && !validPosition; j++) {
                if (!snake.some(segment => segment.x === i && segment.y === j) &&
                    !checkLaserCollision({ x: i, y: j })) {
                    x = i;
                    y = j;
                    validPosition = true;
                }
            }
        }
    }
    
    if (food) food.destroy();
    
    food = this.add.graphics();
    food.setData('gridX', x);
    food.setData('gridY', y);
    
    const pixelX = x * CELL_SIZE + CELL_SIZE / 2;
    const pixelY = y * CELL_SIZE + CELL_SIZE / 2;
    
    food.fillStyle(0xffff00, 1);
    food.fillCircle(pixelX, pixelY, CELL_SIZE / 3);
    
    food.lineStyle(2, 0xffff00, 0.8);
    for (let i = 0; i < 3; i++) {
        food.strokeCircle(pixelX, pixelY, CELL_SIZE / 3 + i * 3);
        food.lineStyle(2, 0xffff00, 0.8 - i * 0.3);
    }
}

function createLasers() {
    // Vytvoření několika laserových pastí
    const laserPositions = [
        { x: 5, y: 5, type: 'horizontal', length: 5 },
        { x: 10, y: 14, type: 'vertical', length: 4 },
        { x: 14, y: 8, type: 'horizontal', length: 3 },
        { x: 3, y: 10, type: 'vertical', length: 6 }
    ];
    
    laserPositions.forEach(pos => {
        const laser = this.add.graphics();
        laser.setData('gridX', pos.x);
        laser.setData('gridY', pos.y);
        laser.setData('type', pos.type);
        laser.setData('length', pos.length);
        
        laser.lineStyle(4, 0xff0000, 1);
        laser.fillStyle(0xff0000, 0.3);
        
        if (pos.type === 'horizontal') {
            const startX = pos.x * CELL_SIZE;
            const startY = pos.y * CELL_SIZE + CELL_SIZE / 2;
            const endX = (pos.x + pos.length) * CELL_SIZE;
            
            laser.moveTo(startX, startY);
            laser.lineTo(endX, startY);
            laser.strokePath();
            
            laser.fillRect(startX, startY - 2, endX - startX, 4);
        } else {
            const startX = pos.x * CELL_SIZE + CELL_SIZE / 2;
            const startY = pos.y * CELL_SIZE;
            const endY = (pos.y + pos.length) * CELL_SIZE;
            
            laser.moveTo(startX, startY);
            laser.lineTo(startX, endY);
            laser.strokePath();
            
            laser.fillRect(startX - 2, startY, 4, endY - startY);
        }
        
        laser.setBlendMode(Phaser.BlendModes.ADD);
        lasers.push(laser);
        
        // Debug text for each laser
        const debugLabel = this.add.text(
            pos.x * CELL_SIZE + 2,
            pos.y * CELL_SIZE + 2,
            `L${lasers.length}: ${pos.type[0].toUpperCase()} ${pos.length}`,
            {
                font: '10px Courier',
                fill: '#ff0000',
                backgroundColor: '#00000088'
            }
        );
        debugLabel.setDepth(999);
        laserDebugTexts.push(debugLabel);
    });
    
    // Visual debug grid positions for lasers
    lasers.forEach((laser, idx) => {
        const lx = laser.getData('gridX');
        const ly = laser.getData('gridY');
        const type = laser.getData('type');
        const len = laser.getData('length');
        
        console.log(`Laser ${idx + 1}: Grid(${lx},${ly}) Type:${type} Length:${len}`);
    });
}

function checkLaserCollision(position) {
    return lasers.some(laser => {
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

function createPowerUp() {
    if (powerUps.length >= 2) return;
    
    let validPosition = false;
    let x, y;
    
    while (!validPosition) {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        
        validPosition = !snake.some(segment => segment.x === x && segment.y === y) &&
                       !checkLaserCollision({ x, y }) &&
                       !(food.getData('gridX') === x && food.getData('gridY') === y);
    }
    
    const powerUp = this.add.graphics();
    powerUp.setData('gridX', x);
    powerUp.setData('gridY', y);
    powerUp.setData('type', Math.random() > 0.5 ? 'shield' : 'speed');
    
    const pixelX = x * CELL_SIZE + CELL_SIZE / 2;
    const pixelY = y * CELL_SIZE + CELL_SIZE / 2;
    
    powerUp.x = pixelX;
    powerUp.y = pixelY;
    
    if (powerUp.getData('type') === 'shield') {
        powerUp.lineStyle(3, 0x00ffff, 1);
        powerUp.strokeCircle(0, 0, CELL_SIZE / 2.5);
        powerUp.lineStyle(2, 0x00ffff, 0.5);
        powerUp.strokeCircle(0, 0, CELL_SIZE / 2);
    } else {
        powerUp.lineStyle(3, 0xff00ff, 1);
        powerUp.moveTo(-CELL_SIZE / 3, 0);
        powerUp.lineTo(CELL_SIZE / 3, 0);
        powerUp.moveTo(0, -CELL_SIZE / 3);
        powerUp.lineTo(0, CELL_SIZE / 3);
        powerUp.strokePath();
    }
    
    powerUp.setBlendMode(Phaser.BlendModes.ADD);
    powerUps.push(powerUp);
    
    // Zničení power-upu po 8 sekundách
    this.time.delayedCall(8000, () => {
        const index = powerUps.indexOf(powerUp);
        if (index > -1) {
            powerUp.destroy();
            powerUps.splice(index, 1);
        }
    });
}

function checkPowerUpCollision(head) {
    powerUps.forEach((powerUp, index) => {
        if (powerUp.getData('gridX') === head.x && 
            powerUp.getData('gridY') === head.y) {
            
            const type = powerUp.getData('type');
            
            if (type === 'shield') {
                invulnerable = true;
                this.time.delayedCall(5000, () => {
                    invulnerable = false;
                });
                
                // Vizuální efekt
                this.cameras.main.flash(500, 0, 255, 255);
            } else {
                speedBoost = true;
                this.time.delayedCall(5000, () => {
                    speedBoost = false;
                });
                
                // Vizuální efekt
                this.cameras.main.flash(500, 255, 0, 255);
            }
            
            // Particle burst
            particles.emitParticleAt(powerUp.x, powerUp.y, 20);
            
            powerUp.destroy();
            powerUps.splice(index, 1);
            score += 50;
            document.getElementById('score-value').textContent = score;
        }
    });
}

function updateDebugInfo(time, delta) {
    const fps = Math.round(this.game.loop.actualFps);
    const headPos = snake.length > 0 ? `(${snake[0].x},${snake[0].y})` : '(-,-)';
    const foodPos = food ? `(${food.getData('gridX')},${food.getData('gridY')})` : '(-,-)';
    
    let debugInfo = [
        `FPS: ${fps} | Delta: ${delta.toFixed(1)}ms`,
        `Snake: ${headPos} Len:${snake.length} Dir:${direction}`,
        `Food: ${foodPos}`,
        `Score: ${score} | Speed: ${speed}ms`,
        `Lasers: ${lasers.length} | PowerUps: ${powerUps.length}`,
        `Status: ${invulnerable ? 'INVULN' : ''} ${speedBoost ? 'BOOST' : ''}`
    ];
    
    // Check collision warnings
    if (snake.length > 0) {
        const head = snake[0];
        lasers.forEach((laser, idx) => {
            const lx = laser.getData('gridX');
            const ly = laser.getData('gridY');
            const type = laser.getData('type');
            const len = laser.getData('length');
            
            let collision = false;
            if (type === 'horizontal') {
                collision = head.y === ly && head.x >= lx && head.x < lx + len;
            } else {
                collision = head.x === lx && head.y >= ly && head.y < ly + len;
            }
            
            if (collision && !invulnerable) {
                debugInfo.push(`⚠️ LASER ${idx + 1} COLLISION!`);
            }
        });
    }
    
    debugText.setText(debugInfo.join('\n'));
}

function endGame() {
    gameOver = true;
    document.getElementById('game-over').style.display = 'block';
    
    // Výbuch efekt
    snake.forEach((segment, index) => {
        this.time.delayedCall(index * 50, () => {
            particles.emitParticleAt(
                segment.x * CELL_SIZE + CELL_SIZE / 2,
                segment.y * CELL_SIZE + CELL_SIZE / 2,
                10
            );
        });
    });
    
    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(1000, 255, 0, 0);
}