// ============================================================
// ENTITIES.JS - All enemy entities with Spelunky 1 AI
// ============================================================

const Entities = {
  TILE: 40,

  // Create an entity from level data
  create(data) {
    const base = {
      x: data.x, y: data.y,
      w: 36, h: 36,
      vx: 0, vy: 0,
      onGround: false,
      alive: true,
      hp: 1,
      stunTimer: 0,
      type: data.type,
      frameCount: 0,
      facingRight: data.facingRight !== undefined ? data.facingRight : true,
    };

    switch(data.type) {
      case 'snake':
        return {...base, hp:1, w:36, h:24, moveDir:base.facingRight?1:-1, moveTimer:0};
      case 'bat':
        return {...base, hp:1, w:28, h:22, startX:data.x, startY:data.y,
                sleeping:true, wakeRadius:240};
      case 'spider':
        return {...base, hp:1, w:28, h:28, ropeY:data.ropeY || data.y,
                dropState:'hanging', dropTimer:0, dropSpeed:0};
      case 'caveman':
        return {...base, hp:3, w:32, h:40, moveDir:base.facingRight?1:-1,
                moveTimer:0, attackTimer:0, aggroed:false};
      default:
        return base;
    }
  },

  // Update all entities
  updateAll(entities, player, map, particles) {
    entities.forEach(e => {
      if (!e.alive) return;
      e.frameCount++;

      if (e.stunTimer > 0) {
        e.stunTimer--;
        Physics.applyGravity(e);
        Physics.resolveCollisions(e, map);
        if (e.hp <= 0) this._die(e, particles);
        return;
      }

      switch(e.type) {
        case 'snake':   this._updateSnake(e, player, map, particles); break;
        case 'bat':     this._updateBat(e, player, map, particles); break;
        case 'spider':  this._updateSpider(e, player, map, particles); break;
        case 'caveman': this._updateCaveman(e, player, map, particles); break;
      }

      // Check player contact damage
      if (e.alive && this._touchesPlayer(e, player)) {
        Player.takeDamage(player, 1, particles);
      }
    });

    // Remove dead entities after a delay
  },

  _touchesPlayer(e, player) {
    return Physics.rectsOverlap(
      e.x + 4, e.y + 4, e.w - 8, e.h - 8,
      player.x + 4, player.y + 4, player.w - 8, player.h - 8
    );
  },

  // ---- SNAKE AI ----
  _updateSnake(e, player, map, particles) {
    const T = this.TILE;
    // Patrol back and forth, turn at walls/edges
    e.vx = e.moveDir * 1.8;

    Physics.applyGravity(e);
    const px = e.x + e.w/2;
    Physics.resolveCollisions(e, map);
    e.facingRight = e.moveDir > 0;

    // Check wall ahead
    const aheadC = Math.floor((e.x + (e.moveDir > 0 ? e.w + 2 : -2)) / T);
    const midR   = Math.floor((e.y + e.h - 2) / T);
    const footR  = Math.floor((e.y + e.h + T*0.4) / T);

    const wallAhead = LevelGen.isSolid(map, aheadC, midR);
    const edgeAhead = e.onGround && !LevelGen.isSolid(map, aheadC, footR);

    if (wallAhead || edgeAhead) {
      e.moveDir *= -1;
      e.vx = e.moveDir * 1.8;
    }

    if (e.hp <= 0) this._die(e, particles);
  },

  // ---- BAT AI ----
  _updateBat(e, player, map, particles) {
    if (e.sleeping) {
      const dx = player.x - e.x, dy = player.y - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < e.wakeRadius) {
        e.sleeping = false;
        // Swoop toward player
        e.vx = dx > 0 ? 3.5 : -3.5;
        e.vy = dy > 0 ? 2 : -2;
      }
      return;
    }

    // Fly toward player erratically
    const dx = player.x + player.w/2 - (e.x + e.w/2);
    const dy = player.y + player.h/2 - (e.y + e.h/2);
    const dist = Math.sqrt(dx*dx+dy*dy);

    if (dist > 10) {
      const spd = 2.8;
      e.vx += (dx/dist * spd - e.vx) * 0.08;
      e.vy += (dy/dist * spd - e.vy) * 0.08;
    }

    // Bounce off walls
    e.x += e.vx;
    e.y += e.vy;
    e.facingRight = e.vx > 0;

    const T = this.TILE;
    const cc = Math.floor((e.x + e.w/2) / T);
    const cr = Math.floor((e.y + e.h/2) / T);
    if (LevelGen.isSolid(map, cc, cr)) {
      e.vx *= -1; e.vy *= -1;
      e.x += e.vx * 2; e.y += e.vy * 2;
    }

    // Keep in bounds
    if (e.x < T) e.vx = Math.abs(e.vx);
    if (e.x > (LevelGen.COLS-2)*T) e.vx = -Math.abs(e.vx);
    if (e.y < T) e.vy = Math.abs(e.vy);
    if (e.y > (LevelGen.ROWS-2)*T) e.vy = -Math.abs(e.vy);

    if (e.hp <= 0) this._die(e, particles);
  },

  // ---- SPIDER AI ----
  _updateSpider(e, player, map, particles) {
    const T = this.TILE;
    switch(e.dropState) {
      case 'hanging':
        // Check if player is below
        const dx = player.x + player.w/2 - (e.x + e.w/2);
        const dy = player.y - e.y;
        if (Math.abs(dx) < T * 1.5 && dy > 0 && dy < T * 6) {
          e.dropState = 'dropping';
          e.dropTimer = 30;
        }
        break;
      case 'dropping':
        e.dropTimer--;
        if (e.dropTimer <= 0) {
          e.dropState = 'falling';
          e.vy = 4;
        }
        break;
      case 'falling':
        e.vy += 0.4;
        e.y += e.vy;
        Physics.resolveCollisions(e, map);
        if (e.onGround) {
          e.dropState = 'returning';
          e.vy = 0;
        }
        break;
      case 'returning':
        // Climb back up
        if (e.y > e.ropeY) {
          e.y -= 2;
        } else {
          e.y = e.ropeY;
          e.dropState = 'hanging';
          e.vy = 0;
        }
        break;
    }

    if (e.hp <= 0) this._die(e, particles);
  },

  // ---- CAVEMAN AI ----
  _updateCaveman(e, player, map, particles) {
    const T = this.TILE;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx*dx+dy*dy);

    if (dist < T * 6) e.aggroed = true;
    if (dist > T * 12) e.aggroed = false;

    if (e.aggroed) {
      // Chase player
      const dir = dx > 0 ? 1 : -1;
      e.moveDir = dir;
      e.vx = dir * 2.5;
      e.facingRight = dir > 0;

      // Jump to reach player
      if (e.onGround && dy < -T * 1.5 && Math.abs(dx) < T * 3) {
        e.vy = Physics.JUMP_POWER * 0.85;
      }
    } else {
      // Patrol
      e.vx = e.moveDir * 1.5;
      e.moveTimer++;
      if (e.moveTimer > 120) {
        e.moveTimer = 0;
        e.moveDir *= -1;
      }
    }

    // Turn at edges/walls
    const aheadC = Math.floor((e.x + (e.moveDir > 0 ? e.w+2 : -2)) / T);
    const footR = Math.floor((e.y + e.h + T*0.5) / T);
    const wallAhead = LevelGen.isSolid(map, aheadC, Math.floor((e.y + e.h/2)/T));
    const edgeAhead = e.onGround && !LevelGen.isSolid(map, aheadC, footR);

    if ((wallAhead || edgeAhead) && !e.aggroed) {
      e.moveDir *= -1;
    }

    Physics.applyGravity(e);
    Physics.resolveCollisions(e, map);
    e.facingRight = e.vx >= 0;

    if (e.hp <= 0) this._die(e, particles);
  },

  _die(e, particles) {
    e.alive = false;
    Audio.playEnemyHit();
    // Death particles
    for(let i=0; i<16; i++){
      particles.push({
        x: e.x + e.w/2,
        y: e.y + e.h/2,
        vx: (Math.random()-0.5)*10,
        vy: -Math.random()*8 - 2,
        color: ['#ff4422','#ff8822','#ffcc44','#fff'][Math.floor(Math.random()*4)],
        size: 5 + Math.random()*5,
        life: 30,
      });
    }
    // Drop a small gem
    return {type:'gem', x:e.x+e.w/2, y:e.y, gemType: Math.floor(Math.random()*4)};
  },

  // Update bombs
  updateBombs(bombs, map, entities, player, particles) {
    bombs.forEach(b => {
      if (b.exploded) {
        b.explosionFrame++;
        return;
      }

      if (!b.deployed) {
        // Flying through air
        Physics.applyGravity(b);
        Physics.resolveCollisions(b, map);
        b.deployed = b.onGround;
      }

      b.timer--;
      if (b.timer <= 0) {
        // BOOM!
        b.exploded = true;
        b.explosionFrame = 0;
        Audio.playBomb();

        const bx = b.x + b.w/2;
        const by = b.y + b.h/2;
        const radius = 70;

        // Destroy tiles in radius
        const T = LevelGen.TILE;
        for(let r=-3; r<=3; r++){
          for(let c=-3; c<=3; c++){
            const tc = Math.floor(bx/T) + c;
            const tr = Math.floor(by/T) + r;
            const dist = Math.sqrt(c*c + r*r);
            if(dist < 2.2 && tc>=0 && tc<LevelGen.COLS && tr>=0 && tr<LevelGen.ROWS){
              const tile = map[tr][tc];
              if(tile === LevelGen.T.SOLID || tile === LevelGen.T.DIRT ||
                 tile === LevelGen.T.GOLD) {
                map[tr][tc] = LevelGen.T.EMPTY;
                // Debris particles
                for(let i=0;i<3;i++){
                  particles.push({
                    x:tc*T+T/2, y:tr*T+T/2,
                    vx:(Math.random()-0.5)*12,
                    vy:-Math.random()*10,
                    color:'#8b5020', size:6+Math.random()*6, life:35
                  });
                }
              }
            }
          }
        }

        // Damage entities in range
        entities.forEach(e => {
          if(!e.alive) return;
          const ex = e.x+e.w/2, ey = e.y+e.h/2;
          const dist = Math.sqrt((ex-bx)**2+(ey-by)**2);
          if(dist < radius) {
            e.hp = 0;
            e.vx = (ex-bx)*0.2;
            e.vy = -8;
            this._die(e, particles);
          }
        });

        // Damage player
        const pdist = Math.sqrt((player.x+player.w/2-bx)**2+(player.y+player.h/2-by)**2);
        if(pdist < radius) {
          Player.takeDamage(player, 2, particles);
          player.vx = (player.x-bx)*0.15;
          player.vy = -10;
        }

        // Big explosion particles
        for(let i=0;i<40;i++){
          const angle = Math.random()*Math.PI*2;
          const spd = 3+Math.random()*8;
          particles.push({
            x:bx, y:by,
            vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd-3,
            color:['#ff8800','#ffcc00','#ff4400','#ffee88'][Math.floor(Math.random()*4)],
            size:8+Math.random()*8, life:40
          });
        }
      }
    });

    // Remove fully exploded bombs
    for(let i=bombs.length-1;i>=0;i--){
      if(bombs[i].exploded && bombs[i].explosionFrame >= bombs[i].explosionMaxFrames){
        bombs.splice(i,1);
      }
    }
  },

  // Update floating gems/pickups
  updatePickups(pickups, player) {
    const collected = [];
    for(let i=pickups.length-1;i>=0;i--){
      const p = pickups[i];
      p.vy += 0.5;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      if(p.y > p.groundY) { p.y = p.groundY; p.vy = 0; p.vx *= 0.7; }

      // Player pickup
      if(Physics.rectsOverlap(
        p.x-10, p.y-10, 20, 20,
        player.x, player.y, player.w, player.h
      )){
        player.gold += p.value;
        Audio.playGemPickup();
        pickups.splice(i,1);
        collected.push(p);
      }
    }
    return collected;
  },
};
