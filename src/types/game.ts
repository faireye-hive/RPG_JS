export type Direction = 0 | 1 | 2 | 3; // 0: down, 1: right, 2: up, 3: left

export interface CharacterState {
  spriteX: number;
  spriteY: number;
  width: number;
  height: number;
  attackWidth: number;
  attackHeight: number;
  moveSpeed: number;
  positionX: number;
  positionY: number;
  moving: boolean;
  currentSprite: number;
  attackSprite: number;
  direction: Direction;
  attacking: boolean;
  attackPressed: boolean;
  alive: boolean;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  maxXp: number;
  attackPower: number;
  potions: number;
  gold: number;
  resting?: boolean;
  restingTick?: number;
  invulnerableTime?: number;
}

export interface EnemyState {
  id: string;
  positionX: number;
  positionY: number;
  speed: number;
  alive: boolean;
  health: number;
  maxHealth: number;
  level: number;
  xpReward: number;
  attackPower: number;
  lastHitTime?: number;
  lastAttackTime?: number;
  name?: string;
  isAggro?: boolean;
  wanderDirX?: number;
  wanderDirY?: number;
  wanderTimer?: number;
}

export interface ItemDropState {
  id: string;
  type: 'potion' | 'xp_gem' | 'gold' | 'attack_elixir';
  positionX: number;
  positionY: number;
  value: number;
  alive: boolean;
  spawnTime: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  life: number; // 0 to 1
}

export type MapTile = string | EnemyState | ItemDropState | undefined;

export interface GameStats {
  enemiesKilled: number;
  mapsExplored: number;
  timeElapsed: number; // in seconds
  babyRescued: boolean;
  currentCoords: [number, number];
  visitedCoords?: string[];
  level?: number;
  xp?: number;
  maxXp?: number;
  health?: number;
  maxHealth?: number;
  attackPower?: number;
  potions?: number;
  gold?: number;
  resting?: boolean;
  regionName?: string;
}

export interface KeyBindings {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  attack: string[];
  pause: string[];
  restart: string[];
}

export interface GameConfig {
  soundEnabled: boolean;
  sfxVolume: number; // 0 to 1
  musicEnabled: boolean;
  musicVolume: number; // 0 to 1
  keyBindings: KeyBindings;
  showTouchControls: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface SavedGameState {
  character: CharacterState;
  maps: Record<string, MapTile[][]>;
  currentMap: string;
  youWin: boolean;
  stats: GameStats;
  savedAt: number;
}

export type GameScreen = 'menu' | 'playing' | 'paused' | 'settings' | 'controls' | 'github_guide';
