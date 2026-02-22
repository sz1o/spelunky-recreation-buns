// spelunky.d.ts - TypeScript type definitions

declare namespace SpelunkyTypes {
  interface Vec2 {
    x: number;
    y: number;
  }

  interface Rect extends Vec2 {
    w: number;
    h: number;
  }

  interface PhysicsBody extends Rect {
    vx: number;
    vy: number;
    onGround: boolean;
    onLadder: boolean;
    onRope: Rope | null;
  }

  interface PlayerState extends PhysicsBody {
    hp: number;
    maxHp: number;
    bombs: number;
    ropes: number;
    gold: number;
    facingRight: boolean;
    isWalking: boolean;
    isJumping: boolean;
    isCrouching: boolean;
    isSprinting: boolean;
    isWhipping: boolean;
    whipFrame: number;
    whipMaxFrames: number;
    isDead: boolean;
    isInvincible: boolean;
    invincibleTimer: number;
    frameCount: number;
    stunTimer: number;
  }

  interface Entity extends PhysicsBody {
    type: 'snake' | 'bat' | 'spider' | 'caveman';
    hp: number;
    alive: boolean;
    facingRight: boolean;
    stunTimer: number;
    frameCount: number;
  }

  interface Bomb extends Rect {
    vx: number;
    vy: number;
    timer: number;
    deployed: boolean;
    exploded: boolean;
    explosionFrame: number;
    explosionMaxFrames: number;
    onGround: boolean;
  }

  interface Rope {
    x: number;
    y: number;
    length: number;
    deployed: boolean;
  }

  interface Pickup extends Vec2 {
    vx: number;
    vy: number;
    groundY: number;
    gemType: number;
    value: number;
  }

  interface Chest extends Vec2 {
    open: boolean;
    c: number;
    r: number;
  }

  interface Particle extends Vec2 {
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
  }

  type TileType =
    | 0  // EMPTY
    | 1  // SOLID
    | 2  // DIRT
    | 3  // LADDER
    | 4  // ROPE
    | 5  // SPIKE
    | 6  // GOLD
    | 7  // CHEST
    | 8  // DOOR
    | 9  // TORCH
    | 10 // COBWEB
    | 11 // PUSH
    | 12 // ENTRY
    | 20 // ENEMY_SNAKE
    | 21 // ENEMY_BAT
    | 22 // ENEMY_SPIDER
    | 23 // ENEMY_CAVEMAN
    ;

  type TileMap = TileType[][];

  interface LevelData {
    map: TileMap;
    entities: Array<{type: string; x: number; y: number}>;
    playerStart: Vec2;
    exitDoor: Vec2;
    levelNum: number;
  }

  interface InputKeys {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
    sprint: boolean;
    whip: boolean;
    rope: boolean;
    throwBomb: boolean;
    enter: boolean;
    _jumpPrev: boolean;
    _whipPrev: boolean;
    _ropePrev: boolean;
    _throwBombPrev: boolean;
  }

  type GameState = 'loading' | 'splash' | 'controls' | 'playing' | 'levelcomplete' | 'dead';
}

export = SpelunkyTypes;
