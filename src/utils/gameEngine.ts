import { CharacterState, EnemyState, MapTile, GameStats, GameConfig, SavedGameState, ItemDropState, FloatingText } from '../types/game';
import { audioEngine } from './audio';

export class RpgGameEngine {
  public static MAP_COLS = 64;
  public static MAP_ROWS = 64;
  public static TILE_WIDTH = 192;
  public static TILE_HEIGHT = 108;

  public get mapWidth(): number {
    return RpgGameEngine.MAP_COLS * RpgGameEngine.TILE_WIDTH; // 12288 px
  }

  public get mapHeight(): number {
    return RpgGameEngine.MAP_ROWS * RpgGameEngine.TILE_HEIGHT; // 6912 px
  }

  public getRegionName(mapX: number = 0, mapY: number = 0): string {
    if (mapX === 0 && mapY === 0) return "Vila Inicial - Vale Verde 🏡";
    if (mapX === 1 && mapY === 0) return "Cidade de Eldoria 🏰";
    if (mapX === -1 && mapY === 0) return "Porto dos Piratas ⚓";
    if (mapX === 0 && mapY === 1) return "Cidade das Montanhas 🏔️";
    if (mapX === 0 && mapY === -1) return "Reino de Solaria ☀️";
    if (mapX === 1 && mapY === 1) return "Floresta dos Dragões 🐉";
    if (mapX === -1 && mapY === -1) return "Santuário dos Druidas 🌿";
    if (mapX === 2 && mapY === 0) return "Ruínas Antigas 🏛️";
    if (mapX === -2 && mapY === 0) return "Pico Vulcânico 🌋";
    return `Cidade / Região (${mapX}, ${mapY})`;
  }

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  public config: GameConfig;
  public character: CharacterState;
  public maps: Record<string, MapTile[][]> = {};
  public itemDrops: Record<string, ItemDropState[]> = {};
  public floatingTexts: FloatingText[] = [];
  public currentMap: string = "0,0";
  public mapChanged: boolean = false;
  public youWin: boolean = false;
  public saved: boolean = false;
  public isPaused: boolean = false;
  public isRunning: boolean = false;

  public stats: GameStats = {
    enemiesKilled: 0,
    mapsExplored: 1,
    timeElapsed: 0,
    babyRescued: false,
    currentCoords: [0, 0],
    visitedCoords: ["0,0"],
    level: 1,
    xp: 0,
    maxXp: 100,
    health: 100,
    maxHealth: 100,
    attackPower: 35,
    potions: 2,
    gold: 0
  };

  private keys: Record<string, boolean> = {};
  private sprites: Record<string, HTMLImageElement> = {};
  private spritesLoaded: boolean = false;

  private framesByImage: number = 5;
  private attackFramesByImage: number = 3;
  private animationFrameId: number | null = null;
  private timerInterval: number | null = null;

  // Callbacks for UI updates
  public onStateChange?: () => void;
  public onPauseToggle?: (isPaused: boolean) => void;
  public onGameOver?: () => void;
  public onVictory?: () => void;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this.config = config;

    // Set logical dimensions
    this.canvas.width = 1920;
    this.canvas.height = 1080;

    // Default character state centered on large map (12288 x 6912)
    this.character = {
      spriteX: 0,
      spriteY: 0,
      width: 100,
      height: 200,
      attackWidth: 200,
      attackHeight: 200,
      moveSpeed: 7,
      positionX: 6144 - 50,
      positionY: 3456 - 100,
      moving: false,
      currentSprite: 0,
      attackSprite: 0,
      direction: 0,
      attacking: false,
      attackPressed: false,
      alive: true,
      health: 100,
      maxHealth: 100,
      level: 1,
      xp: 0,
      maxXp: 100,
      attackPower: 35,
      potions: 2,
      gold: 0,
      invulnerableTime: 0
    };

    this.loadSprites();
    this.bindEvents();
    this.syncStats();
  }

  public syncStats() {
    const coords = (this.currentMap || "0,0").split(',').map(Number);
    const mx = coords[0] || 0;
    const my = coords[1] || 0;
    this.stats.regionName = this.getRegionName(mx, my);
    this.stats.level = this.character.level;
    this.stats.xp = this.character.xp;
    this.stats.maxXp = this.character.maxXp;
    this.stats.health = this.character.health;
    this.stats.maxHealth = this.character.maxHealth;
    this.stats.attackPower = this.character.attackPower;
    this.stats.potions = this.character.potions;
    this.stats.gold = this.character.gold;
    this.stats.resting = this.character.resting;
    if (this.onStateChange) this.onStateChange();
  }

  public toggleRest() {
    if (!this.character.alive || this.youWin || this.character.attacking) return;
    this.character.resting = !this.character.resting;
    if (this.character.resting) {
      this.character.moving = false;
      audioEngine.playResting();
      this.addFloatingText('Sentou para descansar... 💤', this.character.positionX + 50, this.character.positionY - 20, '#38bdf8');
    } else {
      this.addFloatingText('Levantou! ⚔️', this.character.positionX + 50, this.character.positionY - 20, '#facc15');
    }
    this.syncStats();
  }

  public buyPotion() {
    if (!this.character.alive || this.youWin) return;
    const cost = 20;
    if (this.character.gold >= cost) {
      this.character.gold -= cost;
      this.character.potions += 1;
      audioEngine.playBuy();
      this.addFloatingText('+1 Poção 🧪 (-20 🪙)', this.character.positionX + 50, this.character.positionY - 20, '#4ade80');
      this.syncStats();
    } else {
      this.addFloatingText(`Ouro insuficiente! Precisa de 20 🪙`, this.character.positionX + 50, this.character.positionY - 20, '#f87171');
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#fef08a') {
    this.floatingTexts.push({
      id: `text_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      opacity: 1,
      life: 1.0
    });
  }

  public usePotion() {
    if (!this.character.alive || this.youWin) return;
    if (this.character.potions > 0 && this.character.health < this.character.maxHealth) {
      this.character.potions--;
      const healAmount = Math.min(50, this.character.maxHealth - this.character.health);
      this.character.health += healAmount;
      audioEngine.playPotion();
      this.addFloatingText(`+${healAmount} HP 🧪`, this.character.positionX + 50, this.character.positionY, '#4ade80');
      this.syncStats();
    }
  }

  public addXp(amount: number) {
    this.character.xp += amount;
    this.addFloatingText(`+${amount} XP 💎`, this.character.positionX + 50, this.character.positionY - 20, '#38bdf8');

    while (this.character.xp >= this.character.maxXp) {
      this.character.xp -= this.character.maxXp;
      this.character.level++;
      this.character.maxXp = this.character.level * 100;
      this.character.maxHealth += 25;
      this.character.health = this.character.maxHealth; // Full heal on level up
      this.character.attackPower += 10;
      this.character.potions += 1; // Reward 1 potion on level up

      audioEngine.playLevelUp();
      this.addFloatingText(`LEVEL UP! Lv.${this.character.level} 🎉`, this.character.positionX + 50, this.character.positionY - 80, '#facc15');
    }
    this.syncStats();
  }

  private spawnItemDrop(x: number, y: number) {
    const rand = Math.random();
    if (rand < 0.80) { // 80% drop rate
      let dropType: 'potion' | 'gold' | 'xp_gem' | 'attack_elixir' = 'gold';
      let value = 15;

      if (rand < 0.60) { // 60% Gold drop
        dropType = 'gold';
        value = 15 + Math.floor(Math.random() * 20);
      } else if (rand < 0.80) { // 20% XP Gem drop
        dropType = 'xp_gem';
        value = 35 + Math.floor(Math.random() * 25);
      } else if (rand < 0.92) { // 12% Attack Elixir
        dropType = 'attack_elixir';
        value = 3;
      } else { // 8% Rare Potion drop
        dropType = 'potion';
        value = 1;
      }

      if (!this.itemDrops[this.currentMap]) this.itemDrops[this.currentMap] = [];
      this.itemDrops[this.currentMap].push({
        id: `item_${Date.now()}_${Math.random()}`,
        type: dropType,
        positionX: x + 20,
        positionY: y + 40,
        value,
        alive: true,
        spawnTime: Date.now()
      });
    }
  }

  private loadSprites() {
    const spriteNames = [
      'characterMovement', 'characterAttack', 'babyDown', 'skull',
      'rock2', 'flowers2', 'flowers', 'rock', 'groundLog', 'grass',
      'enemy', 'deadEnemy', 'deadCharacter', 'gameOver', 'youWin'
    ];

    let loadedCount = 0;
    spriteNames.forEach(name => {
      const img = new Image();
      img.src = `sprites/${name}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === spriteNames.length) {
          this.spritesLoaded = true;
          this.draw();
        }
      };
      this.sprites[name] = img;
    });
  }

  private bindEvents = () => {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  };

  public unbindEvents = () => {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stopLoop();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();

    // Prevent default scroll for game controls
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code)) {
      e.preventDefault();
    }

    // Toggle Pause
    if (this.config.keyBindings.pause.map(k => k.toLowerCase()).includes(key) ||
        this.config.keyBindings.pause.map(k => k.toLowerCase()).includes(code)) {
      this.togglePause();
      return;
    }

    // Drink Potion with 'H' or 'E'
    if (key === 'h' || key === 'e') {
      this.usePotion();
      return;
    }

    // Toggle Sit / Rest with 'C' or 'Z'
    if (key === 'c' || key === 'z') {
      this.toggleRest();
      return;
    }

    // Buy Potion with 'B'
    if (key === 'b') {
      this.buyPotion();
      return;
    }

    // Restart game with R if dead or won
    if ((this.config.keyBindings.restart.map(k => k.toLowerCase()).includes(key) || key === 'r') && (!this.character.alive || this.youWin)) {
      this.restart();
      return;
    }

    this.keys[key] = true;
    this.keys[code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();
    this.keys[key] = false;
    this.keys[code] = false;
  };

  // Virtual controller support for Touch/D-Pad
  public setVirtualKey(key: string, isPressed: boolean) {
    this.keys[key.toLowerCase()] = isPressed;
  }

  public triggerVirtualAttack() {
    this.keys['space'] = true;
    setTimeout(() => {
      this.keys['space'] = false;
    }, 150);
  }

  public startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    // Timer tracker
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      if (!this.isPaused && this.character.alive && !this.youWin) {
        this.stats.timeElapsed++;
        if (this.onStateChange) this.onStateChange();
      }
    }, 1000);

    const loop = () => {
      if (this.isRunning) {
        if (!this.isPaused) {
          this.update();
        }
        this.draw();
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (this.onPauseToggle) this.onPauseToggle(this.isPaused);
  }

  public respawnInTown() {
    this.character.alive = true;
    this.character.health = this.character.maxHealth;
    this.character.positionX = 6144 - 50;
    this.character.positionY = 3456 - 100;
    this.character.resting = false;
    this.character.attacking = false;
    this.currentMap = "0,0";
    this.mapChanged = true;
    if (!this.maps["0,0"]) {
      this.mapGenerate();
    }
    this.syncStats();
    this.addFloatingText('🏛️ Ressuscitou no Centro da Vila!', this.character.positionX + 50, this.character.positionY - 50, '#38bdf8');
  }

  public restart() {
    this.mapChanged = false;
    this.youWin = false;
    this.maps = { "0,0": [] };
    this.itemDrops = {};
    this.floatingTexts = [];
    this.currentMap = "0,0";
    
    this.character = {
      spriteX: 0,
      spriteY: 0,
      width: 100,
      height: 200,
      attackWidth: 200,
      attackHeight: 200,
      moveSpeed: 7,
      positionX: 6144 - 50,
      positionY: 3456 - 100,
      moving: false,
      currentSprite: 0,
      attackSprite: 0,
      direction: 0,
      attacking: false,
      attackPressed: false,
      alive: true,
      health: 100,
      maxHealth: 100,
      level: 1,
      xp: 0,
      maxXp: 100,
      attackPower: 35,
      potions: 2,
      gold: 0,
      invulnerableTime: 0
    };

    this.stats = {
      enemiesKilled: 0,
      mapsExplored: 1,
      timeElapsed: 0,
      babyRescued: false,
      currentCoords: [0, 0],
      visitedCoords: ["0,0"],
      level: 1,
      xp: 0,
      maxXp: 100,
      health: 100,
      maxHealth: 100,
      attackPower: 35,
      potions: 2,
      gold: 0,
      regionName: this.getRegionName(0, 0)
    };

    this.mapGenerate();
    this.saveToStorage();
    this.syncStats();
  }

  public loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem('gameState');
      if (!raw) return false;
      const data: SavedGameState = JSON.parse(raw);
      if (data && data.character && data.maps) {
        this.character = {
          ...this.character,
          ...data.character,
          health: data.character.health ?? 100,
          maxHealth: data.character.maxHealth ?? 100,
          level: data.character.level ?? 1,
          xp: data.character.xp ?? 0,
          maxXp: data.character.maxXp ?? 100,
          attackPower: data.character.attackPower ?? 35,
          potions: data.character.potions ?? 2,
          gold: data.character.gold ?? 0
        };
        this.maps = data.maps;
        this.currentMap = data.currentMap || "0,0";
        this.youWin = !!data.youWin;
        if (data.stats) this.stats = data.stats;
        this.stats.visitedCoords = Object.keys(this.maps);
        this.stats.mapsExplored = this.stats.visitedCoords.length;

        const coords = this.currentMap.split(',').map(Number);
        this.stats.currentCoords = [coords[0] || 0, coords[1] || 0];

        if (!this.maps[this.currentMap]) {
          this.mapGenerate();
        }
        this.syncStats();
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  public saveToStorage() {
    const gameState: SavedGameState = {
      character: this.character,
      maps: this.maps,
      currentMap: this.currentMap,
      youWin: this.youWin,
      stats: this.stats,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem('gameState', JSON.stringify(gameState));
      this.saved = true;
    } catch {
      // storage quota or error
    }
  }

  private mapGenerate() {
    const map: MapTile[][] = [];
    const cols = RpgGameEngine.MAP_COLS;
    const rows = RpgGameEngine.MAP_ROWS;

    for (let x = 0; x < cols; x++) {
      map[x] = [];
      for (let y = 0; y < rows; y++) {
        // Town Center safe area (cols 26..38, rows 26..38)
        const isCenterArea = x >= 26 && x <= 38 && y >= 26 && y <= 38;

        if (isCenterArea) {
          if ((x === 28 || x === 36) && y === 32) {
            map[x][y] = "flowers2";
          } else if (x === 32 && (y === 28 || y === 36)) {
            map[x][y] = "flowers";
          } else {
            map[x][y] = undefined;
          }
          continue;
        }

        const rand = Math.floor(Math.random() * 10000);
        if (rand > 9940) {
          map[x][y] = "skull";
        } else if (rand > 9850) {
          map[x][y] = "rock2";
        } else if (rand > 9750) {
          map[x][y] = "flowers2";
        } else if (rand > 9300) {
          map[x][y] = "flowers";
        } else if (rand > 9000) {
          map[x][y] = "rock";
        } else if (rand > 8700) {
          map[x][y] = "groundLog";
        } else {
          map[x][y] = undefined;
        }
      }
    }

    this.generateEnemies(map);
    this.maps[this.currentMap] = map;
    this.stats.visitedCoords = Object.keys(this.maps);
    this.stats.mapsExplored = this.stats.visitedCoords.length;
    this.mapChanged = false;
  }

  private generateEnemies(map: MapTile[][]) {
    const thisMap = this.currentMap.split(',').map(n => parseInt(n) || 0);
    const mapX = thisMap[0] === 0 ? 1 : thisMap[0];
    const mapY = thisMap[1] === 0 ? 1 : thisMap[1];

    let distanceFromCenter = Math.abs(mapX) + Math.abs(mapY);
    if (distanceFromCenter > 50) distanceFromCenter = 50;

    const cols = RpgGameEngine.MAP_COLS;
    const rows = RpgGameEngine.MAP_ROWS;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Safe Zone in town center (cols 22..42, rows 22..42) - no enemies spawn here
        if (x >= 22 && x <= 42 && y >= 22 && y <= 42) continue;

        const randomNumber = Math.floor(Math.random() * 1000);
        // ~2% chance outside safe zone (~60-80 enemies across 64x64 grid)
        if (randomNumber > 980) {
          const enemyLevel = Math.max(1, Math.floor(distanceFromCenter / 2) + Math.floor(Math.random() * 2));
          const maxHp = 60 + enemyLevel * 25;

          map[x][y] = {
            id: `enemy_${x}_${y}_${Date.now()}_${Math.random()}`,
            positionX: x * RpgGameEngine.TILE_WIDTH,
            positionY: y * RpgGameEngine.TILE_HEIGHT,
            speed: Math.floor(Math.random() * 2) + (this.config.difficulty === 'hard' ? 2 : 1),
            alive: true,
            health: maxHp,
            maxHealth: maxHp,
            level: enemyLevel,
            xpReward: 30 + enemyLevel * 15,
            attackPower: 10 + enemyLevel * 4,
            name: enemyLevel > 3 ? 'Orc Warrior' : enemyLevel > 1 ? 'Goblin Brute' : 'Forest Goblin'
          };
        }
      }
    }
  }

  public isTileSolid(item: MapTile | undefined): boolean {
    if (!item || typeof item !== 'string') return false;
    return item === "rock" || item === "rock2" || item === "groundLog" || item === "skull";
  }

  public isPositionBlocked(x: number, y: number, w: number, h: number): boolean {
    const currentMapGrid = this.maps[this.currentMap];
    if (!currentMapGrid) return false;

    const minCol = Math.max(0, Math.floor(x / RpgGameEngine.TILE_WIDTH));
    const maxCol = Math.min(RpgGameEngine.MAP_COLS - 1, Math.floor((x + w - 1) / RpgGameEngine.TILE_WIDTH));
    const minRow = Math.max(0, Math.floor(y / RpgGameEngine.TILE_HEIGHT));
    const maxRow = Math.min(RpgGameEngine.MAP_ROWS - 1, Math.floor((y + h - 1) / RpgGameEngine.TILE_HEIGHT));

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const tile = currentMapGrid[col]?.[row];
        if (this.isTileSolid(tile)) {
          return true;
        }
      }
    }
    return false;
  }

  private characterAttack() {
    const isAttackPressed = this.config.keyBindings.attack.some(k => this.keys[k.toLowerCase()]);
    if (isAttackPressed) {
      if (this.character.resting) {
        this.character.resting = false;
        this.syncStats();
      }
      if (!this.character.attacking) {
        audioEngine.playAttack();
      }
      this.character.attacking = true;
      this.character.attackPressed = true;
    } else if (this.character.attackSprite === 0 && !this.character.attackPressed) {
      this.character.attacking = false;
    }
  }

  private characterControls() {
    let directionX = 0;
    let directionY = 0;

    const isLeft = this.config.keyBindings.left.some(k => this.keys[k.toLowerCase()]);
    const isRight = this.config.keyBindings.right.some(k => this.keys[k.toLowerCase()]);
    const isUp = this.config.keyBindings.up.some(k => this.keys[k.toLowerCase()]);
    const isDown = this.config.keyBindings.down.some(k => this.keys[k.toLowerCase()]);

    if (isLeft) {
      directionX -= this.character.moveSpeed;
      this.character.direction = 3; // left
    }
    if (isRight) {
      directionX += this.character.moveSpeed;
      this.character.direction = 1; // right
    }
    if (isUp) {
      directionY -= this.character.moveSpeed;
      this.character.direction = 2; // up
    }
    if (isDown) {
      directionY += this.character.moveSpeed;
      this.character.direction = 0; // down
    }

    if (directionX === 0 && directionY === 0) {
      this.character.moving = false;
    } else {
      this.character.moving = true;
      if (this.character.resting) {
        this.character.resting = false;
        this.syncStats();
      }
    }

    // Apply movement with obstacle collision check (feet bounding box: x+25, y+150, w:50, h:40)
    if (directionX !== 0) {
      const targetX = this.character.positionX + directionX;
      if (!this.isPositionBlocked(targetX + 25, this.character.positionY + 150, 50, 40)) {
        this.character.positionX = targetX;
      }
    }

    if (directionY !== 0) {
      const targetY = this.character.positionY + directionY;
      if (!this.isPositionBlocked(this.character.positionX + 25, targetY + 150, 50, 40)) {
        this.character.positionY = targetY;
      }
    }
  }

  private characterMoveMapCheck() {
    const parts = this.currentMap.split(',').map(Number);
    let mapX = parts[0] || 0;
    let mapY = parts[1] || 0;

    const totalWidth = this.mapWidth;
    const totalHeight = this.mapHeight;

    if (this.character.positionX < 0) {
      this.character.positionX = totalWidth - this.character.width - 50;
      mapX -= 1;
      this.mapChanged = true;
    } else if (this.character.positionX > totalWidth - this.character.width) {
      this.character.positionX = 50;
      mapX += 1;
      this.mapChanged = true;
    } else if (this.character.positionY < 0) {
      this.character.positionY = totalHeight - this.character.height - 50;
      mapY -= 1;
      this.mapChanged = true;
    } else if (this.character.positionY > totalHeight - this.character.height) {
      this.character.positionY = 50;
      mapY += 1;
      this.mapChanged = true;
    }

    if (this.mapChanged) {
      this.currentMap = `${mapX},${mapY}`;
      this.stats.currentCoords = [mapX, mapY];
      this.stats.mapsExplored++;
      audioEngine.playMapChange();
      if (!this.maps[this.currentMap]) {
        this.mapGenerate();
      }
      const regName = this.getRegionName(mapX, mapY);
      this.addFloatingText(`📍 Viagem: Entrou em ${regName}`, this.character.positionX + 50, this.character.positionY - 80, '#38bdf8');
      this.syncStats();
    }
  }

  private update() {
    if (this.character.alive && !this.youWin) {
      this.characterAttack();
      if (!this.character.attacking) {
        this.characterControls();
      }
      this.characterMoveMapCheck();

      // Handle Resting Regeneration Tick
      if (this.character.resting) {
        if (!this.character.restingTick) this.character.restingTick = 0;
        this.character.restingTick++;
        if (this.character.restingTick >= 25) { // every ~0.4s
          this.character.restingTick = 0;
          if (this.character.health < this.character.maxHealth) {
            const heal = Math.min(5, this.character.maxHealth - this.character.health);
            this.character.health += heal;
            audioEngine.playResting();
            this.addFloatingText(`+${heal} HP 💤`, this.character.positionX + 50, this.character.positionY, '#4ade80');
            this.syncStats();
          }
        }
      }

      // Item pickup check
      const currentItems = this.itemDrops[this.currentMap];
      if (currentItems) {
        currentItems.forEach(item => {
          if (item.alive) {
            const dx = (this.character.positionX + 50) - item.positionX;
            const dy = (this.character.positionY + 100) - item.positionY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 75) {
              item.alive = false;
              audioEngine.playItemPickup();
              if (item.type === 'potion') {
                this.character.potions += item.value;
                this.addFloatingText(`+${item.value} Potion 🧪`, item.positionX, item.positionY - 20, '#4ade80');
              } else if (item.type === 'gold') {
                this.character.gold += item.value;
                this.addFloatingText(`+${item.value} Gold 🪙`, item.positionX, item.positionY - 20, '#facc15');
              } else if (item.type === 'xp_gem') {
                this.addXp(item.value);
              } else if (item.type === 'attack_elixir') {
                this.character.attackPower += item.value;
                this.addFloatingText(`+${item.value} ATK ⚔️`, item.positionX, item.positionY - 20, '#f43f5e');
              }
              this.syncStats();
            }
          }
        });
      }
    }

    // Update floating texts
    this.floatingTexts.forEach(ft => {
      ft.y -= 1.2;
      ft.life -= 0.02;
      ft.opacity = Math.max(0, ft.life);
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    // Auto save check on input pause
    const pressingAnyKey = Object.values(this.keys).some(Boolean);
    if (!pressingAnyKey && !this.saved) {
      this.saveToStorage();
    } else if (pressingAnyKey) {
      this.saved = false;
    }
  }

  private drawCityGate(x: number, y: number, label: string) {
    this.ctx.save();
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(x, y, 160, 100);
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(x, y, 160, 100);

    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillStyle = '#7dd3fc';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PORTÃO DA CIDADE', x + 80, y + 42);
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(label, x + 80, y + 68);
    this.ctx.restore();
  }

  private drawContent(cameraX: number = 0, cameraY: number = 0) {
    this.ctx.textAlign = 'center';
    
    const totalW = this.mapWidth;
    const totalH = this.mapHeight;

    // Grass background pattern spanning entire large map
    if (this.sprites.grass && this.sprites.grass.complete) {
      const pattern = this.ctx.createPattern(this.sprites.grass, 'repeat');
      if (pattern) {
        this.ctx.fillStyle = pattern;
        this.ctx.fillRect(-2000, -2000, totalW + 4000, totalH + 4000);
      }
    } else {
      this.ctx.fillStyle = '#1e3a1e';
      this.ctx.fillRect(-2000, -2000, totalW + 4000, totalH + 4000);
    }

    // Cobblestone Roads & Town Square
    const midX = totalW / 2;
    const midY = totalH / 2;

    this.ctx.fillStyle = '#64533b'; // Main Road Color
    this.ctx.fillRect(0, midY - 60, totalW, 120); // Horizontal Main Road
    this.ctx.fillRect(midX - 60, 0, 120, totalH); // Vertical Main Road

    // Central Plaza Circle
    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 260, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#64748b';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 260, 0, Math.PI * 2);
    this.ctx.stroke();

    // Central Monument Text
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillStyle = '#fef08a';
    const coords = (this.currentMap || "0,0").split(',').map(Number);
    const regionTitle = this.getRegionName(coords[0] || 0, coords[1] || 0);
    this.ctx.fillText(`🏛️ Centro de ${regionTitle}`, midX, midY - 20);

    // City Gates at the 4 exits
    const parts = this.currentMap.split(',').map(Number);
    const mx = parts[0] || 0;
    const my = parts[1] || 0;

    this.drawCityGate(0, midY - 50, `⬅️ ${this.getRegionName(mx - 1, my)}`);
    this.drawCityGate(totalW - 160, midY - 50, `➡️ ${this.getRegionName(mx + 1, my)}`);
    this.drawCityGate(midX - 80, 0, `⬆️ ${this.getRegionName(mx, my - 1)}`);
    this.drawCityGate(midX - 80, totalH - 100, `⬇️ ${this.getRegionName(mx, my + 1)}`);

    const currentMapGrid = this.maps[this.currentMap];
    if (currentMapGrid) {
      currentMapGrid.forEach((col, indexX) => {
        col.forEach((item, indexY) => {
          const tileX = indexX * RpgGameEngine.TILE_WIDTH;
          const tileY = indexY * RpgGameEngine.TILE_HEIGHT;

          if (item === "babyDown") {
            const diffX = this.character.positionX - tileX;
            const diffY = this.character.positionY - tileY;
            if (diffX < 110 && diffX > -90 && diffY < 50 && diffY > -150) {
              // Rescue quest reward
              currentMapGrid[indexX][indexY] = undefined;
              this.character.gold += 300;
              this.stats.babyRescued = true;
              audioEngine.playVictory();
              this.addFloatingText('🎉 MISSÃO: Habitante Resgatado! (+500 XP, +300 Ouro)', this.character.positionX + 50, this.character.positionY - 60, '#facc15');
              this.addXp(500);
              this.syncStats();
            }
          }

          if (item !== undefined && typeof item === "string") {
            const spr = this.sprites[item];
            if (spr && spr.complete) {
              this.ctx.drawImage(
                spr, 0, 0, spr.width, spr.height,
                tileX, tileY, spr.width, spr.height
              );
            }
          }
        });
      });
    }

    if (!this.character.alive) {
      const deadSpr = this.sprites.deadCharacter;
      if (deadSpr && deadSpr.complete) {
        this.ctx.drawImage(
          deadSpr, 0, 0, this.character.width, this.character.height,
          this.character.positionX, this.character.positionY,
          this.character.width, this.character.height
        );
      }
    }
  }

  private drawItemDrops() {
    const currentItems = this.itemDrops[this.currentMap];
    if (!currentItems) return;

    const now = Date.now();
    currentItems.forEach(item => {
      if (item.alive) {
        // Floating bounce offset
        const bounce = Math.sin((now - item.spawnTime) / 200) * 4;
        const iy = item.positionY + bounce;

        this.ctx.save();
        // Item glow aura
        this.ctx.shadowBlur = 12;
        if (item.type === 'potion') this.ctx.shadowColor = '#4ade80';
        else if (item.type === 'gold') this.ctx.shadowColor = '#facc15';
        else if (item.type === 'xp_gem') this.ctx.shadowColor = '#38bdf8';
        else if (item.type === 'attack_elixir') this.ctx.shadowColor = '#f43f5e';

        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';

        if (item.type === 'potion') this.ctx.fillText('🧪', item.positionX, iy);
        else if (item.type === 'gold') this.ctx.fillText('🪙', item.positionX, iy);
        else if (item.type === 'xp_gem') this.ctx.fillText('💎', item.positionX, iy);
        else if (item.type === 'attack_elixir') this.ctx.fillText('⚔️', item.positionX, iy);

        this.ctx.restore();
      }
    });
  }

  private drawEnemies() {
    const currentMapGrid = this.maps[this.currentMap];
    if (!currentMapGrid) return;

    const now = Date.now();

    currentMapGrid.forEach((col) => {
      col.forEach((item) => {
        if (item && typeof item === "object" && 'health' in item) {
          const enemy = item as EnemyState;
          const diffX = this.character.positionX - (enemy.positionX - 20);
          const diffY = this.character.positionY - (enemy.positionY + 60);

          let printImage = this.sprites["enemy"];

          // Player hits monster
          if (this.character.attacking && enemy.alive) {
            let hit = false;
            if (this.character.direction === 3 && diffX < 170 && diffX > 0 && diffY < 0 && diffY > -140) hit = true;
            else if (this.character.direction === 1 && diffX > -120 && diffX < 0 && diffY < 0 && diffY > -140) hit = true;
            else if (this.character.direction === 2 && diffX < 90 && diffX > -90 && diffY < 90 && diffY > -60) hit = true;
            else if (this.character.direction === 0 && diffX < 90 && diffX > -90 && diffY < -60 && diffY > -200) hit = true;

            if (hit && (!enemy.lastHitTime || now - enemy.lastHitTime > 350)) {
              enemy.lastHitTime = now;
              const dmg = this.character.attackPower;
              enemy.health -= dmg;
              audioEngine.playHitMonster();
              this.addFloatingText(`-${dmg}`, enemy.positionX + 20, enemy.positionY + 40, '#f87171');

              if (enemy.health <= 0) {
                enemy.health = 0;
                enemy.alive = false;
                this.stats.enemiesKilled++;
                audioEngine.playEnemyKill();
                this.addXp(enemy.xpReward);
                this.spawnItemDrop(enemy.positionX, enemy.positionY);
                this.syncStats();
              }
            }
          }

          if (enemy.alive && this.character.alive && !this.youWin) {
            // Check character hit by monster
            if (diffX < 110 && diffX > -90 && diffY < 0 && diffY > -150) {
              if (!this.character.invulnerableTime || now - this.character.invulnerableTime > 600) {
                this.character.invulnerableTime = now;
                if (this.character.resting) {
                  this.character.resting = false;
                  this.addFloatingText('Acordou com o ataque! 💥', this.character.positionX + 50, this.character.positionY - 20, '#f87171');
                }
                const dmg = enemy.attackPower;
                this.character.health -= dmg;
                audioEngine.playPlayerHit();
                this.addFloatingText(`-${dmg} HP`, this.character.positionX + 50, this.character.positionY + 50, '#ef4444');

                if (this.character.health <= 0) {
                  this.character.health = 0;
                  this.character.alive = false;
                  if (this.onGameOver) this.onGameOver();
                }
                this.syncStats();
              }
            }

            // Monster Field of View (FOV) & Movement AI
            const charCenterX = this.character.positionX + 50;
            const charCenterY = this.character.positionY + 100;
            const enemyCenterX = enemy.positionX + 20;
            const enemyCenterY = enemy.positionY + 60;
            const distToPlayer = Math.hypot(charCenterX - enemyCenterX, charCenterY - enemyCenterY);
            const DETECTION_RADIUS = 600; // ~3.5 tiles vision range

            if (distToPlayer <= DETECTION_RADIUS) {
              // Player detected! Monster enters AGGRO chase state
              enemy.isAggro = true;
              const stepX = (charCenterX > enemyCenterX ? 1 : charCenterX < enemyCenterX ? -1 : 0) * enemy.speed;
              const stepY = (charCenterY > enemyCenterY ? 1 : charCenterY < enemyCenterY ? -1 : 0) * enemy.speed;

              if (stepX !== 0) {
                const nextX = enemy.positionX + stepX;
                if (!this.isPositionBlocked(nextX - 10, enemy.positionY + 50, 50, 50)) {
                  enemy.positionX = Math.max(50, Math.min(this.mapWidth - 100, nextX));
                }
              }

              if (stepY !== 0) {
                const nextY = enemy.positionY + stepY;
                if (!this.isPositionBlocked(enemy.positionX - 10, nextY + 50, 50, 50)) {
                  enemy.positionY = Math.max(50, Math.min(this.mapHeight - 100, nextY));
                }
              }
            } else {
              // Out of detection range -> Idle / Wander Patrol AI
              enemy.isAggro = false;

              if (enemy.wanderTimer === undefined || enemy.wanderTimer <= 0) {
                enemy.wanderTimer = Math.floor(Math.random() * 90) + 30; // 0.5s to 2s
                if (Math.random() < 0.6) {
                  enemy.wanderDirX = 0;
                  enemy.wanderDirY = 0;
                } else {
                  enemy.wanderDirX = Math.random() < 0.5 ? -1 : 1;
                  enemy.wanderDirY = Math.random() < 0.5 ? -1 : 1;
                }
              } else {
                enemy.wanderTimer--;
              }

              const wanderSpeed = Math.max(1, Math.floor(enemy.speed * 0.5));
              if (enemy.wanderDirX) {
                const nextX = enemy.positionX + enemy.wanderDirX * wanderSpeed;
                if (!this.isPositionBlocked(nextX - 10, enemy.positionY + 50, 50, 50)) {
                  enemy.positionX = Math.max(50, Math.min(this.mapWidth - 100, nextX));
                } else {
                  enemy.wanderDirX *= -1; // Reverse on obstacle collision
                }
              }

              if (enemy.wanderDirY) {
                const nextY = enemy.positionY + enemy.wanderDirY * wanderSpeed;
                if (!this.isPositionBlocked(enemy.positionX - 10, nextY + 50, 50, 50)) {
                  enemy.positionY = Math.max(50, Math.min(this.mapHeight - 100, nextY));
                } else {
                  enemy.wanderDirY *= -1; // Reverse on obstacle collision
                }
              }
            }

            printImage = this.sprites["enemy"];
          } else if (!enemy.alive) {
            printImage = this.sprites["deadEnemy"];
          } else if (enemy.alive) {
            // Player is dead/won -> Monster stays in wander/idle
            enemy.isAggro = false;
            printImage = this.sprites["enemy"];
          }

          if (printImage && printImage.complete) {
            this.ctx.drawImage(
              printImage, 0, 0, this.sprites["enemy"].width, this.sprites["enemy"].height,
              enemy.positionX - 20, enemy.positionY + 60,
              this.sprites["enemy"].width, this.sprites["enemy"].height
            );
          }

          // Draw Monster Health Bar & Name if alive
          if (enemy.alive) {
            const barW = 70;
            const barH = 7;
            const bx = enemy.positionX + 15;
            const by = enemy.positionY + 45;

            // Aggro visual alert
            if (enemy.isAggro) {
              this.ctx.font = 'bold 11px sans-serif';
              this.ctx.fillStyle = '#ef4444';
              this.ctx.textAlign = 'center';
              this.ctx.fillText('❗ CHASE', bx + barW / 2, by - 16);
            }

            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

            this.ctx.fillStyle = '#7f1d1d';
            this.ctx.fillRect(bx, by, barW, barH);

            const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
            this.ctx.fillStyle = hpRatio > 0.4 ? '#22c55e' : '#eab308';
            this.ctx.fillRect(bx, by, barW * hpRatio, barH);

            // Level text
            this.ctx.font = 'bold 12px monospace';
            this.ctx.fillStyle = '#fecdd3';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Lv.${enemy.level} ${enemy.name || 'Goblin'}`, bx + barW / 2, by - 4);
          }
        }
      });
    });
  }

  private drawCharacter() {
    const now = Date.now();
    const isInvuln = this.character.invulnerableTime && (now - this.character.invulnerableTime < 600);

    if (this.character.alive && !this.youWin) {
      this.ctx.save();
      if (isInvuln) {
        // Red hit flash or alpha pulse
        this.ctx.globalAlpha = Math.floor(now / 100) % 2 === 0 ? 0.4 : 0.9;
      }

      if (this.character.attacking) {
        this.character.spriteX = this.character.attackSprite * this.character.height;
        this.character.spriteY = this.character.direction * this.character.height;
        const spr = this.sprites.characterAttack;
        if (spr && spr.complete) {
          this.ctx.drawImage(
            spr, this.character.spriteX, this.character.spriteY,
            this.character.attackWidth, this.character.attackHeight,
            this.character.positionX - 50, this.character.positionY,
            this.character.attackWidth, this.character.attackHeight
          );
        }
      } else {
        this.character.spriteX = this.character.currentSprite * this.character.width;
        this.character.spriteY = this.character.direction * this.character.height;
        const spr = this.sprites.characterMovement;
        if (spr && spr.complete) {
          this.ctx.drawImage(
            spr, this.character.spriteX, this.character.spriteY,
            this.character.width, this.character.height,
            this.character.positionX, this.character.positionY,
            this.character.width, this.character.height
          );
        }
      }
      this.ctx.restore();

      // Draw Player Health Bar & Level Above Head
      const barW = 80;
      const barH = 9;
      const bx = this.character.positionX + 10;
      const by = this.character.positionY - 15;

      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);

      this.ctx.fillStyle = '#991b1b';
      this.ctx.fillRect(bx, by, barW, barH);

      const hpRatio = Math.max(0, this.character.health / this.character.maxHealth);
      this.ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
      this.ctx.fillRect(bx, by, barW * hpRatio, barH);

      // Level Badge & HP numbers
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Lv.${this.character.level} Hero`, bx + barW / 2, by - 6);

      if (this.character.resting) {
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillText('💤 Descansando (+HP)...', bx + barW / 2, by - 22);
      }

      // Movement animation frame counter
      if (this.character.moving) {
        if (this.framesByImage === 0) {
          this.character.currentSprite++;
          this.framesByImage = 5;
        } else {
          this.framesByImage--;
        }
        if (this.character.currentSprite >= 3 && this.framesByImage === 0) {
          this.character.currentSprite = 0;
          this.framesByImage = 5;
        }
      } else {
        this.character.currentSprite = 0;
      }

      // Attack animation frame counter
      if (this.character.attacking) {
        if (this.attackFramesByImage === 0) {
          this.character.attackSprite++;
          this.attackFramesByImage = 3;
        } else {
          this.attackFramesByImage--;
        }
        if (this.character.attackSprite >= 3 && this.attackFramesByImage === 0) {
          this.character.attackSprite = 0;
          this.attackFramesByImage = 3;
          this.character.attackPressed = false;
        }
      } else {
        this.character.attackSprite = 0;
      }
    } else if (!this.character.alive) {
      const spr = this.sprites.gameOver;
      if (spr && spr.complete) {
        this.ctx.drawImage(
          spr, 0, 0, spr.width, spr.height,
          this.canvas.width / 2 - spr.width / 2,
          this.canvas.height / 2 - spr.height / 2,
          spr.width, spr.height
        );
      }
    }

    if (this.youWin) {
      const spr = this.sprites.youWin;
      if (spr && spr.complete) {
        this.ctx.drawImage(
          spr, 0, 0, spr.width, spr.height,
          this.canvas.width / 2 - spr.width / 2,
          this.canvas.height / 2 - spr.height / 2,
          spr.width, spr.height
        );
      }
    }
  }

  private drawFloatingTexts() {
    this.ctx.save();
    this.ctx.font = 'bold 22px monospace';
    this.ctx.textAlign = 'center';

    this.floatingTexts.forEach(ft => {
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = ft.opacity;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = '#000000';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });

    this.ctx.restore();
  }

  private drawScreenOverlays() {
    if (!this.character.alive) {
      const spr = this.sprites.gameOver;
      if (spr && spr.complete) {
        this.ctx.drawImage(
          spr, 0, 0, spr.width, spr.height,
          this.canvas.width / 2 - spr.width / 2,
          this.canvas.height / 2 - spr.height / 2,
          spr.width, spr.height
        );
      }
    }

    if (this.youWin) {
      const spr = this.sprites.youWin;
      if (spr && spr.complete) {
        this.ctx.drawImage(
          spr, 0, 0, spr.width, spr.height,
          this.canvas.width / 2 - spr.width / 2,
          this.canvas.height / 2 - spr.height / 2,
          spr.width, spr.height
        );
      }
    }
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate camera position centered on player character
    const playerCenterX = this.character.positionX + this.character.width / 2;
    const playerCenterY = this.character.positionY + this.character.height / 2;
    const cameraX = playerCenterX - this.canvas.width / 2;
    const cameraY = playerCenterY - this.canvas.height / 2;

    this.ctx.save();
    this.ctx.translate(-cameraX, -cameraY);

    this.drawContent(cameraX, cameraY);
    this.drawItemDrops();
    this.drawEnemies();
    this.drawCharacter();
    this.drawFloatingTexts();

    this.ctx.restore();

    this.drawScreenOverlays();
  }
}
