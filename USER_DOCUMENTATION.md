# Neon Snake Game - User Manual

## Welcome to Neon Snake: Cyberpunk Edition!

Experience the classic snake game reimagined with stunning neon visuals, particle effects, and challenging laser obstacles. Navigate through a cyberpunk grid, collect power-ups, and achieve the highest score while avoiding deadly laser traps!

## Table of Contents
1. [Getting Started](#getting-started)
2. [How to Play](#how-to-play)
3. [Game Controls](#game-controls)
4. [Game Elements](#game-elements)
5. [Power-Ups](#power-ups)
6. [Scoring System](#scoring-system)
7. [Tips & Strategies](#tips--strategies)
8. [Debug Mode](#debug-mode)
9. [Troubleshooting](#troubleshooting)
10. [System Requirements](#system-requirements)

## Getting Started

### Quick Start
1. Open the game in a modern web browser
2. The game loads automatically - no installation required!
3. Use arrow keys to control the snake
4. Press any arrow key to begin moving

### First Time Players
- Start by moving slowly and getting familiar with the controls
- Watch out for the red laser barriers - they're instant death!
- Collect yellow food orbs to grow and increase your score
- Look for special power-ups that appear periodically

## How to Play

### Objective
Guide your neon snake through the cyberpunk grid, eating food to grow longer while avoiding obstacles. The game gets progressively faster as you eat more food. Survive as long as possible and achieve the highest score!

### Game Rules
1. **Movement**: The snake moves continuously in the direction you choose
2. **Growth**: Eating food makes your snake grow longer
3. **Death Conditions**:
   - Hitting the walls (grid boundaries)
   - Colliding with your own body
   - Running into laser barriers (without shield)
4. **Speed**: The game speeds up as your score increases

### Game Flow
```
Start Game → Control Snake → Eat Food → Avoid Obstacles → Game Over → Press SPACE to Restart
```

## Game Controls

### Keyboard Controls
| Key | Action |
|-----|--------|
| ↑ Arrow Up | Move snake upward |
| ↓ Arrow Down | Move snake downward |
| ← Arrow Left | Move snake left |
| → Arrow Right | Move snake right |
| SPACE | Restart game (when game over) |

### Control Tips
- **Direction Buffer**: You can press the next direction before the snake completes its current move
- **Invalid Moves**: The game prevents you from moving directly backward into yourself
- **Smooth Turning**: Plan your moves ahead for smooth navigation

## Game Elements

### Visual Guide

#### 1. **Snake**
- **Head**: Bright magenta square with glowing outline
- **Body**: Green segments that fade toward the tail
- **Eyes**: White dots indicating current direction
- **Trail**: Blue particle effects follow the snake

#### 2. **Food**
- **Appearance**: Yellow glowing orb with pulsing rings
- **Effect**: Grows snake by one segment, adds 10 points
- **Particles**: Sparkle burst effect when collected

#### 3. **Laser Barriers**
- **Color**: Bright red with animated glow
- **Types**: 
  - Horizontal beams (block rows)
  - Vertical beams (block columns)
- **Danger**: Instant death on contact (unless shielded)
- **Animation**: Pulsing intensity and width

#### 4. **Grid**
- **Size**: 20x20 cells
- **Appearance**: Subtle cyan grid lines
- **Purpose**: Visual reference for movement

## Power-Ups

### Shield Power-Up (Cyan)
- **Icon**: Glowing cyan circle
- **Duration**: 5 seconds
- **Effect**: Complete invulnerability to laser barriers
- **Visual**: Snake turns yellow while active
- **Screen Effect**: Blue flash on collection
- **Score**: +50 points

### Speed Boost Power-Up (Magenta)
- **Icon**: Glowing magenta cross
- **Duration**: 5 seconds
- **Effect**: Doubles movement speed
- **Visual**: Enhanced particle trails
- **Screen Effect**: Purple flash on collection
- **Score**: +50 points

### Power-Up Mechanics
- Spawn every 10 seconds (maximum 2 active)
- Auto-disappear after 8 seconds if not collected
- Cannot spawn on snakes, lasers, or food
- Rotating animation for easy identification

## Scoring System

### Point Values
| Action | Points |
|--------|--------|
| Eat Food | +10 |
| Collect Shield | +50 |
| Collect Speed Boost | +50 |

### Score Display
- Located in the top-left corner
- Green neon text with glow effect
- Updates in real-time

### High Score Tips
1. Prioritize power-ups (5x more points than food)
2. Use shields to safely navigate through laser fields
3. Chain food collection during speed boosts
4. Plan routes to minimize backtracking

## Tips & Strategies

### Beginner Strategies
1. **Start Slow**: Focus on avoiding walls and lasers before chasing high scores
2. **Learn Laser Patterns**: Memorize laser positions early in the game
3. **Use the Corners**: Corners are safe spots to plan your next move
4. **Short Snake Advantage**: Keep your snake manageable in early game

### Advanced Techniques
1. **Power-Up Routing**: Plan paths that include power-up locations
2. **Shield Timing**: Save shields for risky laser crossings
3. **Speed Boost Efficiency**: Use speed boosts in open areas for maximum food collection
4. **Coiling Strategy**: Create coils to maximize space usage
5. **Predictive Movement**: Anticipate food spawns based on available spaces

### Survival Tips
- **Never Chase the Tail**: Avoid following your own body too closely
- **Laser Gaps**: Some laser configurations have safe gaps between them
- **Emergency Turns**: Practice quick 90-degree turns for tight situations
- **Power-Up Priority**: Shields > Speed > Food (based on situation)

## Debug Mode

### Debug Console Features
The game includes a real-time debug overlay showing:

```
FPS: 60 | Delta: 16.7ms          - Frame rate and timing
Snake: (10,10) Len:8 Dir:right   - Snake position and stats
Food: (15,5)                     - Food location
Score: 80 | Speed: 86ms          - Current score and game speed
Lasers: 4 | PowerUps: 1          - Active game objects
Status: INVULN BOOST             - Active power-up effects
⚠️ LASER 2 COLLISION!            - Collision warnings
```

### Debug Information
- **FPS**: Frames per second (target: 60)
- **Delta**: Time between frames in milliseconds
- **Snake Position**: Grid coordinates (X,Y) of snake head
- **Direction**: Current movement direction
- **Length**: Total snake segments
- **Speed**: Movement delay in milliseconds (lower = faster)

## Troubleshooting

### Common Issues

#### Game Won't Start
- **Solution**: Refresh the browser page (F5)
- **Check**: JavaScript is enabled in your browser
- **Try**: Different browser (Chrome, Firefox, Edge recommended)

#### Low Frame Rate
- **Close** other browser tabs
- **Disable** browser extensions
- **Check** system resources (CPU/Memory usage)
- **Try** switching to a different browser

#### Controls Not Responding
- **Click** on the game window to focus
- **Check** keyboard language/layout
- **Disable** browser keyboard shortcuts

#### Visual Glitches
- **Update** your graphics drivers
- **Enable** hardware acceleration in browser
- **Clear** browser cache and cookies

### Performance Tips
1. Close unnecessary applications
2. Use a modern browser (updated within last year)
3. Disable browser extensions that might interfere
4. Play in fullscreen mode for best performance
5. Ensure stable internet connection (for asset loading)

## System Requirements

### Minimum Requirements
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: Must be enabled
- **Screen Resolution**: 1024x768 or higher
- **Internet**: Required for initial load
- **RAM**: 2GB recommended
- **Graphics**: WebGL support required

### Recommended Setup
- **Browser**: Latest version of Chrome or Firefox
- **Screen**: 1920x1080 resolution
- **RAM**: 4GB or more
- **Graphics**: Dedicated GPU for best effects
- **Connection**: Broadband for fast asset loading

### Mobile Support
Currently optimized for desktop play. Mobile support with touch controls is planned for future updates.

## Game Statistics

### Session Tracking
The game tracks various statistics during play:
- Total score achieved
- Maximum snake length
- Power-ups collected
- Game duration
- Number of food items eaten

### Performance Metrics
- Average FPS during session
- Input latency measurements
- Render time per frame

---

## Quick Reference Card

### Essential Info
- **Arrow Keys**: Move snake
- **SPACE**: Restart when game over
- **Yellow Orbs**: Food (+10 points)
- **Red Beams**: Deadly lasers
- **Cyan Circles**: Shield power-ups
- **Magenta Crosses**: Speed power-ups

### Survival Priority
1. Avoid walls and self-collision
2. Navigate around laser barriers
3. Collect power-ups when safe
4. Eat food to grow and score

### Pro Tips
- Plan 2-3 moves ahead
- Use shields aggressively
- Create space before growing long
- Master quick direction changes

---

## Updates & Version History

### Current Version: 1.0.0
- Initial release with core gameplay
- 4 laser obstacles
- 2 power-up types
- Particle effects system
- Debug console
- 60 FPS optimization

### Planned Features
- Difficulty levels
- Local high score storage
- Sound effects and music
- Additional power-up types
- Mobile touch controls
- Multiplayer mode

---

Enjoy playing Neon Snake: Cyberpunk Edition! Master the grid, collect power-ups, and become the ultimate neon serpent!