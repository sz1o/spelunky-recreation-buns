// ============================================================
// PLAYER.JS - Full Spelunky 1 player controller
// ============================================================

const Player = {
  TILE: 40,
  W: 32, H: 38,

  create(x, y) {
    return {
      x, y,
      w: 32, h: 38,
      vx: 0, vy: 0,
      onGround: false,
      onLadder: false,
      onRope: null,
      facingRight: true,
      isWalking: false,
      isJumping: false,
      isCrouching: false,
      isSprinting: false,
      // Stats
      hp: 4, maxHp: 4,
      bombs: 4,
      ropes: 4,
      gold: 0,
      // Action states
      isWhipping: false,
      whipFrame: 0,
      whipMaxFrames: 12,
      isDead: false,
      isInvincible: false,
      invincibleTimer: 0,
      // Climbing
      climbLock: 0,
      // Jump buffer
      jumpBufferTimer: 0,
      coyoteTimer: 0,
      // Animation
      frameCount: 0,
      walkFrame: 0,
      // Stun
      stunTimer: 0,
      // Throwing
      holdingBomb: false,
      throwPower: 0,
    };
  },

  update(player, keys, map, ropes, bombs, entities, particles) {
    if (player.isDead) return;
    player.frameCount++;

    // Invincibility frames
    if (player.isInvincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) player.isInvincible = false;
    }

    // Stun
    if (player.stunTimer > 0) {
      player.stunTimer--;
      Physics.applyGravity(player);
      Physics.resolveCollisions(player, map);
      return;
    }

    // Coyote time
    if (player.onGround) player.coyoteTimer = 8;
    else if (player.coyoteTimer > 0) player.coyoteTimer--;

    // Jump buffer
    if (keys.jump && !keys._jumpPrev) player.jumpBufferTimer = 10;
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;

    // ---- ROPE CLIMBING ----
    const nearRope = Physics.touchingRope(player, ropes);
    if (nearRope && (keys.up || keys.down) && !player.onGround) {
      player.onRope = nearRope;
    }
    if (!nearRope) player.onRope = null;

    if (player.onRope) {
      player.vx = 0; player.vy = 0;
      player.x = player.onRope.x + this.TILE/2 - player.w/2;
      if (keys.up) player.y -= Physics.CLIMB_SPEED;
      if (keys.down) player.y += Physics.CLIMB_SPEED;
      if (keys.jump && !keys._jumpPrev) {
        player.onRope = null;
        player.vy = Physics.JUMP_POWER;
        player.vx = (keys.right ? 1 : keys.left ? -1 : (player.facingRight ? 1 : -1)) * 3;
      }
      player.isWalking = (keys.up || keys.down);
      keys._jumpPrev = keys.jump;
      return;
    }

    // ---- LADDER CLIMBING ----
    const onLadder = Physics.checkLadder(player, map);
    if (onLadder && (keys.up || keys.down)) {
      player.onLadder = true;
    }
    if (!onLadder) player.onLadder = false;

    if (player.onLadder) {
      player.vx = 0; player.vy = 0;
      const ladderX = Math.floor((player.x + player.w/2) / this.TILE) * this.TILE;
      player.x += (ladderX - player.x - player.w/2 + this.TILE/2) * 0.3;
      if (keys.up) player.y -= Physics.CLIMB_SPEED;
      if (keys.down) player.y += Physics.CLIMB_SPEED;
      if (keys.jump && !keys._jumpPrev) {
        player.onLadder = false;
        player.vy = Physics.JUMP_POWER * 0.85;
        player.vx = (keys.right ? 1 : keys.left ? -1 : 0) * 2;
      }
      player.isWalking = (keys.up || keys.down);
      keys._jumpPrev = keys.jump;
      return;
    }

    // ---- CROUCH ----
    player.isCrouching = keys.down && player.onGround;

    // ---- HORIZONTAL MOVEMENT ----
    player.isSprinting = keys.sprint;
    const speed = player.isSprinting ? Physics.SPRINT_SPEED : Physics.WALK_SPEED;

    if (!player.isCrouching) {
      if (keys.left) {
        player.vx = -speed;
        player.facingRight = false;
        player.isWalking = true;
      } else if (keys.right) {
        player.vx = speed;
        player.facingRight = true;
        player.isWalking = true;
      } else {
        player.vx *= 0.6; // friction
        if (Math.abs(player.vx) < 0.2) player.vx = 0;
        player.isWalking = false;
      }
    } else {
      player.vx *= 0.5;
      player.isWalking = false;
    }

    // ---- JUMP ----
    if (player.jumpBufferTimer > 0 && (player.coyoteTimer > 0)) {
      player.vy = Physics.JUMP_POWER;
      player.isJumping = true;
      player.jumpBufferTimer = 0;
      player.coyoteTimer = 0;
      Audio.playJump();
    }
    if (player.vy < 0) player.isJumping = true;
    else player.isJumping = false;

    // Variable jump height - release jump to cut height
    if (!keys.jump && player.vy < -6) {
      player.vy = Math.max(player.vy + 1.5, -6);
    }

    // ---- WHIP ATTACK ----
    if (keys.whip && !keys._whipPrev && !player.isWhipping) {
      player.isWhipping = true;
      player.whipFrame = 0;
      Audio.playWhip();
      // Check whip hit
      this._doWhipHit(player, entities, particles, map);
    }
    if (player.isWhipping) {
      player.whipFrame++;
      if (player.whipFrame >= player.whipMaxFrames) {
        player.isWhipping = false;
        player.whipFrame = 0;
      }
    }

    // ---- THROW BOMB ----
    if (keys.throwBomb && !keys._throwBombPrev && player.bombs > 0) {
      if (!player.isCrouching) {
        // Throw bomb
        player.bombs--;
        const bx = player.x + (player.facingRight ? player.w : 0);
        const by = player.y + player.h/2 - 10;
        const bvx = (player.facingRight ? 1 : -1) * 7;
        const bvy = -7;
        bombs.push({
          x: bx, y: by, vx: bvx, vy: bvy,
          w: 14, h: 14,
          timer: 180, // 3 second fuse at 60fps
          deployed: false,
          exploded: false,
          explosionFrame: 0,
          explosionMaxFrames: 24,
          onGround: false,
        });
        Audio.playRopeThrow();
      } else {
        // Place bomb (S+F)
        player.bombs--;
        bombs.push({
          x: player.x + 8, y: player.y + player.h - 18,
          vx: 0, vy: 0,
          w: 14, h: 14,
          timer: 180,
          deployed: true,
          exploded: false,
          explosionFrame: 0,
          explosionMaxFrames: 24,
          onGround: true,
        });
      }
    }

    // ---- THROW ROPE ----
    if (keys.rope && !keys._ropePrev && player.ropes > 0) {
      player.ropes--;
      const rc = Math.floor((player.x + player.w/2) / this.TILE);
      const rr = Math.floor(player.y / this.TILE);
      // Find ceiling above
      let ropeTopR = rr;
      while(ropeTopR > 0 && !LevelGen.isSolid(map, rc, ropeTopR-1)) {
        ropeTopR--;
      }
      const ropeY = ropeTopR * this.TILE;
      const ropeLen = rr - ropeTopR + 1;
      if(ropeLen > 0) {
        ropes.push({
          x: rc * this.TILE,
          y: ropeY,
          length: ropeLen,
          deployed: true,
        });
        Audio.playRopeThrow();
      } else {
        player.ropes++; // refund
      }
    }

    // ---- GRAVITY & PHYSICS ----
    Physics.applyGravity(player);
    Physics.resolveCollisions(player, map);

    // Walk animation
    if (player.isWalking && player.onGround) {
      if (player.frameCount % 6 === 0) Audio.playStep();
      player.walkFrame = player.frameCount;
    }

    // Land sound
    if (player.onGround && player.vy === 0 && !player._wasOnGround) {
      Audio.playLand();
    }
    player._wasOnGround = player.onGround;

    // Kill if fell off bottom
    if (player.y > LevelGen.ROWS * this.TILE + 200) {
      player.hp = 0;
    }

    // Update prev key states
    keys._jumpPrev = keys.jump;
    keys._whipPrev = keys.whip;
    keys._ropePrev = keys.rope;
    keys._throwBombPrev = keys.throwBomb;
  },

  _doWhipHit(player, entities, particles, map) {
    const reach = 58;
    const T = this.TILE;
    const whipX = player.x + (player.facingRight ? player.w + reach : -reach);
    const whipY = player.y + player.h/2;

    entities.forEach(e => {
      if (!e.alive) return;
      const ex = e.x + T/2, ey = e.y + T/2;
      const dist = Math.abs(ex - whipX) < reach + 20 && Math.abs(ey - whipY) < T*0.8;
      if (dist) {
        e.hp--;
        e.stunTimer = 30;
        e.vx = (player.facingRight ? 6 : -6);
        e.vy = -5;
        Audio.playEnemyHit();
        // Spawn hit particles
        for(let i=0; i<8; i++){
          particles.push({
            x: ex, y: ey,
            vx: (Math.random()-0.5)*6,
            vy: -Math.random()*5,
            color: '#ff4422',
            size: 4 + Math.random()*4,
            life: 18,
          });
        }
      }
    });

    // Smash chest
    // (handled in game.js)
  },

  takeDamage(player, amount, particles) {
    if (player.isInvincible || player.isDead) return;
    player.hp -= amount;
    player.isInvincible = true;
    player.invincibleTimer = 90; // 1.5s at 60fps
    Audio.playHit();
    // Knockback
    player.vy = -6;
    if (particles) {
      for(let i=0; i<12; i++){
        particles.push({
          x: player.x + player.w/2,
          y: player.y + player.h/2,
          vx: (Math.random()-0.5)*8,
          vy: -Math.random()*7,
          color: '#ff2222',
          size: 5 + Math.random()*4,
          life: 25,
        });
      }
    }
    if (player.hp <= 0) {
      player.isDead = true;
      Audio.playDeath();
    }
  },
};
