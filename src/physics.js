// ============================================================
// PHYSICS.JS - Spelunky 1-accurate physics engine
// ============================================================

const Physics = {
  TILE: 40,
  GRAVITY: 0.55,
  MAX_FALL: 14,
  WALK_SPEED: 3.2,
  SPRINT_SPEED: 5.8,
  JUMP_POWER: -12.5,
  CLIMB_SPEED: 2.5,

  // Apply gravity to a body
  applyGravity(body) {
    if (!body.onRope && !body.onLadder) {
      body.vy += this.GRAVITY;
      if (body.vy > this.MAX_FALL) body.vy = this.MAX_FALL;
    }
  },

  // Resolve collisions between body rect and tile map
  // body: {x, y, w, h, vx, vy, onGround, onLadder, onRope}
  resolveCollisions(body, map) {
    const T = this.TILE;
    const M = LevelGen;

    // Move X first
    body.x += body.vx;
    const colX = this._checkBodyCollision(body, map, 'x');
    if (colX) {
      if (body.vx > 0) {
        body.x = colX.tileX * T - body.w;
      } else if (body.vx < 0) {
        body.x = (colX.tileX + 1) * T;
      }
      body.vx = 0;
    }

    // Then move Y
    body.y += body.vy;
    body.onGround = false;
    const colY = this._checkBodyCollision(body, map, 'y');
    if (colY) {
      if (body.vy > 0) {
        body.y = colY.tileY * T - body.h;
        body.onGround = true;
        body.vy = 0;
      } else if (body.vy < 0) {
        body.y = (colY.tileY + 1) * T;
        body.vy = 0;
      }
    }

    // Clamp to map bounds
    if (body.x < 0) { body.x = 0; body.vx = 0; }
    if (body.x + body.w > M.COLS * T) { body.x = M.COLS * T - body.w; body.vx = 0; }
    if (body.y < 0) { body.y = 0; body.vy = 0; }
  },

  _checkBodyCollision(body, map, axis) {
    const T = this.TILE;
    const M = LevelGen;

    // Get corners of bounding box
    const left  = body.x + 2;
    const right = body.x + body.w - 2;
    const top   = body.y + 2;
    const bot   = body.y + body.h - 1;

    const points = axis === 'x'
      ? (body.vx > 0
          ? [{x:right, y:top+4},{x:right, y:bot-4}]
          : [{x:left,  y:top+4},{x:left,  y:bot-4}])
      : (body.vy > 0
          ? [{x:left+4, y:bot},{x:right-4, y:bot}]
          : [{x:left+4, y:top},{x:right-4, y:top}]);

    for (const pt of points) {
      const tc = Math.floor(pt.x / T);
      const tr = Math.floor(pt.y / T);
      if (M.isSolid(map, tc, tr)) {
        return {tileX: tc, tileY: tr};
      }
    }
    return null;
  },

  // Check if body is on a ladder
  checkLadder(body, map) {
    const T = this.TILE;
    const cx = body.x + body.w/2;
    const cr = Math.floor((body.y + body.h/2) / T);
    const cc = Math.floor(cx / T);
    if (cr < 0 || cr >= LevelGen.ROWS) return false;
    return map[cr][cc] === LevelGen.T.LADDER;
  },

  // Check if body is touching a rope entity
  touchingRope(body, ropes) {
    for (const rope of ropes) {
      if (!rope.deployed) continue;
      const cx = rope.x + LevelGen.TILE/2;
      if (Math.abs(body.x + body.w/2 - cx) < 15) {
        if (body.y < rope.y + rope.length * LevelGen.TILE &&
            body.y + body.h > rope.y) {
          return rope;
        }
      }
    }
    return null;
  },

  // Particle physics update
  updateParticle(p) {
    p.vx *= 0.95;
    p.vy += 0.4;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.size = Math.max(0, p.size * 0.94);
  },

  // Check if two rects overlap
  rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  },

  // Create a new physics body
  createBody(x, y, w, h) {
    return {x, y, w, h, vx:0, vy:0, onGround:false, onLadder:false, onRope:false};
  },

  // Simple AABB for picking up items
  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx+rw && py >= ry && py <= ry+rh;
  },
};
