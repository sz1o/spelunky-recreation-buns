// ============================================================
// GAME.JS - Main game loop and state management
// ============================================================

const Game = {
  canvas: null,
  ctx: null,
  running: false,
  frameCount: 0,
  lastTime: 0,

  // Game state
  state: 'loading', // loading, splash, controls, playing, levelcomplete, dead
  levelNum: 1,
  subLevel: 1,
  totalLevels: 16,

  // Level data
  map: null,
  entities: [],
  bombs: [],
  ropes: [],
  pickups: [],
  particles: [],
  chests: [],
  torches: [],
  cobwebs: [],

  // Player
  player: null,
  exitDoor: null,

  // Camera
  camX: 0, camY: 0,
  targetCamX: 0, targetCamY: 0,

  // Timer
  levelTime: 0,
  levelStartTime: 0,

  // Input
  keys: {
    left:false, right:false, up:false, down:false,
    jump:false, sprint:false, whip:false, rope:false,
    throwBomb:false, enter:false,
    _jumpPrev:false, _whipPrev:false, _ropePrev:false, _throwBombPrev:false,
  },

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._setupInput();
  },

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  startLevel(num) {
    this.levelNum = Math.floor((num-1)/4) + 1;
    this.subLevel = ((num-1) % 4) + 1;

    const levelData = LevelGen.generate(num);
    this.map = levelData.map;

    // Parse chests, torches, cobwebs from map
    this.chests = [];
    this.torches = [];
    this.cobwebs = [];
    const T = LevelGen.TILE;
    for(let r=0; r<LevelGen.ROWS; r++){
      for(let c=0; c<LevelGen.COLS; c++){
        if(this.map[r][c] === LevelGen.T.CHEST){
          this.chests.push({x:c*T, y:r*T, open:false, c, r});
          this.map[r][c] = LevelGen.T.SOLID; // chest sits on solid
        }
      }
    }

    // Entities from level gen
    this.entities = levelData.entities.map(e => Entities.create(e));
    this.bombs = [];
    this.ropes = [];
    this.pickups = [];
    this.particles = [];

    // Player
    const prevPlayer = this.player;
    this.player = Player.create(levelData.playerStart.x, levelData.playerStart.y - T);
    if(prevPlayer){
      // Carry stats between levels
      this.player.hp = prevPlayer.hp;
      this.player.bombs = prevPlayer.bombs;
      this.player.ropes = prevPlayer.ropes;
      this.player.gold  = prevPlayer.gold;
    }

    this.exitDoor = levelData.exitDoor;
    this.levelTime = 0;
    this.levelStartTime = Date.now();

    // Camera start at player
    this.camX = this.player.x - this.canvas.width/2;
    this.camY = this.player.y - this.canvas.height/2;
    this._clampCamera();

    this.updateHUD();
    Audio.playMusic('caves');
  },

  update(dt) {
    if (!this.running || this.state !== 'playing') return;
    this.frameCount++;
    this.levelTime = (Date.now() - this.levelStartTime) / 1000;

    const player = this.player;

    // Update player
    Player.update(player, this.keys, this.map, this.ropes, this.bombs, this.entities, this.particles);

    // Check death
    if (player.isDead || player.hp <= 0) {
      player.isDead = true;
      if (this.state !== 'dead') {
        this.state = 'dead';
        setTimeout(() => this.showDeath(), 800);
      }
      return;
    }

    // Update entities
    Entities.updateAll(this.entities, player, this.map, this.particles);

    // Update bombs
    Entities.updateBombs(this.bombs, this.map, this.entities, player, this.particles);

    // Update pickups
    Entities.updatePickups(this.pickups, player);

    // Update particles
    for(let i=this.particles.length-1;i>=0;i--){
      Physics.updateParticle(this.particles[i]);
      if(this.particles[i].life <= 0) this.particles.splice(i,1);
    }

    // Check whip on chests
    if (player.isWhipping && player.whipFrame === Math.floor(player.whipMaxFrames*0.4)) {
      this._checkWhipChests();
    }

    // Check enter door
    if (this.keys.enter && !this.keys._enterPrev) {
      const door = this.exitDoor;
      if (door && Physics.rectsOverlap(
        player.x, player.y, player.w, player.h,
        door.x - 40, door.y - 80, 120, 120
      )) {
        this._levelComplete();
      }
    }
    this.keys._enterPrev = this.keys.enter;

    // Smooth camera
    this.targetCamX = player.x - this.canvas.width/2  + player.w/2;
    this.targetCamY = player.y - this.canvas.height/2 + player.h/2;
    this.camX += (this.targetCamX - this.camX) * 0.12;
    this.camY += (this.targetCamY - this.camY) * 0.12;
    this._clampCamera();

    // Update HUD
    this.updateHUD();
  },

  _clampCamera() {
    const T = LevelGen.TILE;
    const maxX = LevelGen.COLS * T - this.canvas.width;
    const maxY = LevelGen.ROWS * T - this.canvas.height;
    this.camX = Math.max(0, Math.min(this.camX, maxX));
    this.camY = Math.max(0, Math.min(this.camY, maxY));
  },

  render() {
    if (this.state !== 'playing' && this.state !== 'dead') return;
    const ctx = this.ctx;
    const T = LevelGen.TILE;
    const cx = Math.floor(this.camX), cy = Math.floor(this.camY);

    // Background
    Sprites.drawBackground(ctx, 0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-cx, -cy);

    // Calculate visible tile range
    const startC = Math.max(0, Math.floor(cx / T) - 1);
    const endC   = Math.min(LevelGen.COLS, Math.ceil((cx + this.canvas.width) / T) + 1);
    const startR = Math.max(0, Math.floor(cy / T) - 1);
    const endR   = Math.min(LevelGen.ROWS, Math.ceil((cy + this.canvas.height) / T) + 1);

    // Draw tiles
    for(let r=startR; r<endR; r++){
      for(let c=startC; c<endC; c++){
        const tile = this.map[r][c];
        const tx = c * T, ty = r * T;
        switch(tile){
          case LevelGen.T.SOLID:
            Sprites.drawCaveTile(ctx, tx, ty, (c*3+r*7)%4); break;
          case LevelGen.T.DIRT:
            Sprites.drawDirtTile(ctx, tx, ty); break;
          case LevelGen.T.LADDER:
            Sprites.drawLadder(ctx, tx, ty); break;
          case LevelGen.T.SPIKE:
            Sprites.drawSpikes(ctx, tx, ty); break;
          case LevelGen.T.GOLD:
            Sprites.drawCaveTile(ctx, tx, ty, (c*3+r*7)%4);
            Sprites.drawGoldVein(ctx, tx, ty); break;
          case LevelGen.T.TORCH:
            Sprites.drawCaveTile(ctx, tx, ty, 0);
            Sprites.drawTorch(ctx, tx, ty, this.frameCount); break;
        }
      }
    }

    // Draw cobwebs in corner tiles
    for(let r=startR; r<endR; r++){
      for(let c=startC; c<endC; c++){
        if(this.map[r][c] === LevelGen.T.EMPTY) {
          const adjSolid = (r>0&&this.map[r-1][c]===LevelGen.T.SOLID) ||
                          (c>0&&this.map[r][c-1]===LevelGen.T.SOLID);
          if(adjSolid && (c*13+r*17)%20 < 2){
            const corner = (c*13+r*7)%4;
            Sprites.drawCobweb(ctx, c*T, r*T, ['tl','tr','bl','br'][corner]);
          }
        }
      }
    }

    // Draw exit door
    if(this.exitDoor) {
      Sprites.drawDoor(ctx, this.exitDoor.x, this.exitDoor.y);
      // ENTER hint if player near
      const player = this.player;
      if (player && Physics.rectsOverlap(
        player.x, player.y, player.w, player.h,
        this.exitDoor.x - 40, this.exitDoor.y - 80, 120, 120
      )) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER', this.exitDoor.x + T/2, this.exitDoor.y - 50);
      }
    }

    // Draw chests
    this.chests.forEach(ch => {
      Sprites.drawChest(ctx, ch.x, ch.y, ch.open);
    });

    // Draw ropes
    this.ropes.forEach(rope => {
      if(rope.deployed) Sprites.drawRope(ctx, rope.x, rope.y, rope.length);
    });

    // Draw pickups
    this.pickups.forEach(p => {
      Sprites.drawSmallGem(ctx, p.x, p.y, p.gemType, 0.7);
    });

    // Draw bombs
    this.bombs.forEach(b => {
      if(b.exploded){
        Sprites.drawExplosion(ctx, b.x - T/2, b.y - T/2, b.explosionFrame, b.explosionMaxFrames);
      } else {
        Sprites.drawBomb(ctx, b.x - 7, b.y - 7, this.frameCount);
      }
    });

    // Draw entities
    this.entities.forEach(e => {
      if(!e.alive) return;
      // Invincibility flash
      if(e.stunTimer > 0 && Math.floor(e.stunTimer/4)%2===0) return;
      switch(e.type){
        case 'snake':
          Sprites.drawSnake(ctx, e.x, e.y, e.facingRight, this.frameCount); break;
        case 'bat':
          Sprites.drawBat(ctx, e.x, e.y, this.frameCount); break;
        case 'spider':
          // Draw rope line
          if(e.dropState !== 'falling'){
            ctx.strokeStyle = '#cc8833'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x + e.w/2, e.ropeY);
            ctx.lineTo(e.x + e.w/2, e.y);
            ctx.stroke();
          }
          Sprites.drawSpider(ctx, e.x, e.y, this.frameCount); break;
        case 'caveman':
          Sprites.drawCaveman(ctx, e.x, e.y, e.facingRight, this.frameCount); break;
      }
    });

    // Draw player (flicker when invincible)
    const player = this.player;
    if (player && !player.isDead) {
      const shouldDraw = !player.isInvincible || Math.floor(player.invincibleTimer/4)%2===0;
      if(shouldDraw){
        Sprites.drawPlayer(ctx,
          player.x, player.y,
          player.facingRight,
          player.isWalking,
          player.isJumping,
          player.isCrouching,
          player.onRope !== null,
          player.frameCount
        );
        // Whip
        if(player.isWhipping){
          Sprites.drawWhip(ctx, player.x, player.y,
            player.facingRight, player.whipFrame, player.whipMaxFrames);
        }
      }
    }
    if(player && player.isDead){
      Sprites.drawDeadPlayer(ctx, player.x, player.y);
    }

    // Draw particles
    this.particles.forEach(p => {
      Sprites.drawParticle(ctx, p.x, p.y, p.color, p.size);
    });

    // Draw gold nuggets in world (rare ground scatter)
    for(let r=startR; r<endR; r++){
      for(let c=startC; c<endC; c++){
        if((c*11+r*13)%100 < 2 && this.map[r][c]===LevelGen.T.EMPTY &&
           r+1<LevelGen.ROWS && LevelGen.isSolid(this.map, c, r+1)){
          Sprites.drawGold(ctx, c*T, r*T);
        }
      }
    }

    ctx.restore();

    // Screen-space vignette overlay for cave feel
    const vign = ctx.createRadialGradient(
      this.canvas.width/2, this.canvas.height/2, this.canvas.height*0.2,
      this.canvas.width/2, this.canvas.height/2, this.canvas.height*0.9
    );
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  _checkWhipChests() {
    const player = this.player;
    const reach = 60;
    const T = LevelGen.TILE;
    this.chests.forEach(ch => {
      if(ch.open) return;
      const dx = (ch.x + T/2) - (player.x + player.w/2);
      const dy = (ch.y + T/2) - (player.y + player.h/2);
      if(Math.abs(dx) < reach + T/2 && Math.abs(dy) < T) {
        if((player.facingRight && dx > 0) || (!player.facingRight && dx < 0)){
          ch.open = true;
          Audio.playChestOpen();
          // Spawn 3 gems
          for(let i=0;i<3;i++){
            const gt = Math.floor(Math.random()*4);
            const values = [100,200,300,50];
            this.pickups.push({
              x: ch.x + T/2 + (Math.random()-0.5)*20,
              y: ch.y,
              vx: (Math.random()-0.5)*6,
              vy: -5 - Math.random()*3,
              groundY: ch.y + T - 10,
              gemType: gt,
              value: values[gt],
            });
          }
        }
      }
    });
  },

  _levelComplete() {
    this.state = 'levelcomplete';
    this.running = false;
    Audio.stopMusic();
    Audio.playLevelComplete();

    const elapsed = this.levelTime;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2,'0')} / 5:15`;

    const screen = document.getElementById('level-complete-screen');
    document.getElementById('lc-title').textContent =
      `${this.levelNum}-${this.subLevel} COMPLETED!`;
    document.getElementById('lc-time').textContent = timeStr;
    document.getElementById('lc-score').textContent =
      `${this.player.gold} / 9800`;
    document.getElementById('lc-loot-val').textContent =
      `${this.player.gold}`;
    screen.classList.remove('hidden');
    setTimeout(() => screen.classList.add('visible'), 50);
  },

  nextLevel() {
    const screen = document.getElementById('level-complete-screen');
    screen.classList.remove('visible');
    setTimeout(() => {
      screen.classList.add('hidden');
      this.state = 'playing';
      this.running = true;
      const next = (this.levelNum-1)*4 + this.subLevel;
      this.startLevel(next + 1);
    }, 500);
  },

  showDeath() {
    const screen = document.getElementById('death-screen');
    document.getElementById('d-level').textContent =
      `${this.levelNum}-${this.subLevel}`;
    document.getElementById('d-gold').textContent =
      `$${this.player ? this.player.gold : 0}`;
    screen.classList.remove('hidden');
    setTimeout(() => screen.classList.add('visible'), 50);
  },

  restart() {
    const screen = document.getElementById('death-screen');
    screen.classList.remove('visible');
    setTimeout(() => {
      screen.classList.add('hidden');
      this.player = null;
      this.state = 'playing';
      this.running = true;
      this.startLevel(1);
    }, 500);
  },

  updateHUD() {
    if (!this.player) return;
    const p = this.player;
    document.getElementById('hud-hp').textContent = Math.max(0, p.hp);
    document.getElementById('hud-bombs-count').textContent = p.bombs;
    document.getElementById('hud-ropes-count').textContent = p.ropes;
    document.getElementById('hud-gold-count').textContent = p.gold;
    document.getElementById('hud-level').textContent = `${this.levelNum}-${this.subLevel}`;

    // Color heart red if low
    document.getElementById('hud-hp').style.color = p.hp <= 1 ? '#ff2222' : '#fff';
  },

  _setupInput() {
    const keyMap = {
      'KeyA': 'left', 'ArrowLeft': 'left',
      'KeyD': 'right', 'ArrowRight': 'right',
      'KeyW': 'up', 'ArrowUp': 'up',
      'KeyS': 'down', 'ArrowDown': 'down',
      'Space': 'jump',
      'ShiftRight': 'sprint',
      'KeyC': 'whip',
      'KeyG': 'rope',
      'KeyF': 'throwBomb',
      'Enter': 'enter',
    };

    window.addEventListener('keydown', e => {
      e.preventDefault();
      Audio.resume();
      const action = keyMap[e.code];
      if (action) this.keys[action] = true;
    });

    window.addEventListener('keyup', e => {
      const action = keyMap[e.code];
      if (action) this.keys[action] = false;
    });
  },

  // Main loop
  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((ts) => this.loop(ts));
  },

  start() {
    this.running = true;
    this.state = 'playing';
    document.getElementById('game-canvas').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.startLevel(1);
    this.lastTime = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  },
};
