# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 2D Minecraft-inspired crafting game for Japanese elementary school students. Built with vanilla JavaScript and HTML5 Canvas, featuring block breaking/placing, crafting, day/night cycles, and enemy combat.

## Architecture

### Module Load Order (Critical)
Files must load in this exact sequence in `index.html`:
1. `crafting.js` - Defines ItemType enum and recipes
2. `tools.js` - Mining system
3. `daynight.js` - Day/night cycle
4. `enemies.js` - Enemy AI
5. `chest.js` - Storage system
6. `recipebook.js` - Recipe UI
7. `game.js` - Main game loop (must be second to last)
8. `isometric.js` - 3D rendering (must be last, uses BLOCK_SIZE from game.js)

### Global State Management
Each module exposes objects via `window`:
- `window.ItemType` - All item/block IDs
- `window.recipes2x2`, `window.recipes3x3` - Crafting patterns
- `window.MiningSystem` - Mining mechanics
- `window.EnemyManager` - Enemy spawning/AI
- `window.DayNightCycle` - Time system
- `window.inventory` - Player inventory
- `window.isometricRenderer` - 2D/3D toggle

### Core Systems

#### Item/Block System
Items use numeric IDs (0-60+). Key ranges:
- 0: AIR (empty)
- 1-6: Natural blocks (dirt, grass, stone, wood, leaves, sand)
- 7-22: Crafted blocks
- 23-32: Fun/special items
- 33-36: Ores
- 37-41: Swords
- 42-49: Armor
- 50-55: Combat items

#### World Generation
- Map size: 300x100 blocks
- Terrain: Sine wave generation with amplitude 5
- Underground layers:
  - 30-40: Stone layer
  - 40-60: Deep stone with ores
  - 60-80: Bedrock layer with rare ores
  - 80-100: Deep bedrock
- Ore distribution based on depth and rarity

## Common Development Tasks

### Adding a New Block/Item
1. Add to ItemType enum in `crafting.js`:
```javascript
const ItemType = {
    // ...existing items...
    MY_NEW_ITEM: 56, // Next available ID
```

2. Add item info:
```javascript
const itemInfo = {
    [ItemType.MY_NEW_ITEM]: {
        name: '新アイテム',
        color: '#FF0000',
        drops: ItemType.MY_NEW_ITEM
    },
```

3. Add icon in `game.js` inventory display:
```javascript
const icons = {
    [BlockType.MY_NEW_ITEM]: '🆕新',
```

### Adding a Recipe
In `crafting.js`, add to appropriate recipe array:
```javascript
// 2x2 recipe (hand crafting)
recipes2x2.push({
    pattern: [ItemType.WOOD, ItemType.WOOD, 0, 0],
    result: ItemType.MY_NEW_ITEM
});

// 3x3 recipe (crafting table)
recipes3x3.push({
    pattern: [
        ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT,
        0, ItemType.STICK, 0,
        0, ItemType.STICK, 0
    ],
    result: ItemType.MY_NEW_ITEM
});
```

### Adding an Enemy Type
In `enemies.js`:
1. Add to EnemyType enum:
```javascript
const EnemyType = {
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    SPIDER: 'spider',
    MY_ENEMY: 'my_enemy'
};
```

2. Add parameters in Enemy constructor switch:
```javascript
case EnemyType.MY_ENEMY:
    this.health = 25;
    this.maxHealth = 25;
    this.speed = 2;
    this.damage = 4;
    this.color = '#FF00FF';
    this.jumpPower = -9;
    break;
```

3. Add to spawn selection:
```javascript
const types = [EnemyType.ZOMBIE, EnemyType.SKELETON, EnemyType.SPIDER, EnemyType.MY_ENEMY];
```

### Modifying Day/Night Cycle
In `daynight.js`:
- Day duration: `this.dayDuration = 600000` (10 minutes in milliseconds)
- Time phases: Modify `this.phases` object
- Sky colors: Edit gradient colors in `getSkyGradient()` switch statement

## Testing & Debugging

### Console Commands
```javascript
// Give items
inventory.addItem(ItemType.DIAMOND_SWORD, 5);

// Change time
dayNightCycle.setToNoon();
dayNightCycle.setToMidnight();

// Spawn enemies (only works at night)
enemyManager.spawnEnemy(world, player);

// Toggle 3D
isometricRenderer.toggle();

// Teleport player
player.x = 100 * BLOCK_SIZE;
player.y = 20 * BLOCK_SIZE;
```

### Common Issues
- **Blocks not appearing**: Check BlockType references match ItemType values
- **Recipe not working**: Ensure pattern array length (4 for 2x2, 9 for 3x3)
- **3D mode blank**: BLOCK_SIZE must be defined before isometric.js loads
- **Enemy spawning**: Only occurs at night when `dayNightCycle.isNight()` returns true

## Performance Considerations
- World render distance: ~20-30 blocks around player
- Enemy cap: 10 simultaneous enemies
- Inventory slots: 16 (expandable but affects UI)
- Canvas operations: Batch draw calls in game loop

## Japanese Language Support
- All user-facing text uses Japanese
- Item names in hiragana/katakana for readability by children
- Emoji icons for visual clarity
- UTF-8 encoding required

## Deployment
Static files only - no build process:
1. Upload all files maintaining folder structure
2. Serve from any static host (GitHub Pages, Netlify, etc.)
3. Mobile-responsive, touch controls enabled