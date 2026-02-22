// ============================================================
// SPRITES.JS - All game art drawn procedurally via Canvas
// Authentic Spelunky 1 Xbox 360 visual style
// ============================================================

const Sprites = {
  TILE: 40,

  // ---- TILES ----
  drawCaveTile(ctx, x, y, variant = 0, highlighted = false) {
    const T = this.TILE;
    // Base rock color - warm brown/orange like spelunky
    const baseColors = ['#b8742a','#c47e2e','#aa6a24','#be7c30'];
    const base = baseColors[variant % baseColors.length];
    ctx.fillStyle = base;
    ctx.fillRect(x, y, T, T);

    // Rocky texture - multiple rounded bumps
    const bumps = [
      {bx:0.15,by:0.2,bw:0.35,bh:0.32},
      {bx:0.55,by:0.12,bw:0.3,bh:0.28},
      {bx:0.1,by:0.55,bw:0.28,bh:0.3},
      {bx:0.45,by:0.5,bw:0.38,bh:0.32},
      {bx:0.72,by:0.58,bw:0.22,bh:0.25},
    ];
    bumps.forEach(b => {
      const bumpX = x + b.bx * T;
      const bumpY = y + b.by * T;
      const bumpW = b.bw * T;
      const bumpH = b.bh * T;

      // Base of bump
      ctx.fillStyle = '#c8843a';
      ctx.beginPath();
      ctx.ellipse(bumpX + bumpW/2, bumpY + bumpH/2, bumpW/2, bumpH/2, 0, 0, Math.PI*2);
      ctx.fill();

      // Highlight on bump
      ctx.fillStyle = '#e09848';
      ctx.beginPath();
      ctx.ellipse(bumpX + bumpW/2 - bumpW*0.1, bumpY + bumpH/2 - bumpH*0.12,
        bumpW*0.28, bumpH*0.22, -0.3, 0, Math.PI*2);
      ctx.fill();

      // Shadow under bump
      ctx.fillStyle = '#7a4a18';
      ctx.beginPath();
      ctx.ellipse(bumpX + bumpW/2 + bumpW*0.05, bumpY + bumpH*0.8,
        bumpW*0.4, bumpH*0.15, 0, 0, Math.PI*2);
      ctx.fill();
    });

    // Dark crevices
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + T*0.3, y + T*0.1); ctx.lineTo(x + T*0.5, y + T*0.35);
    ctx.moveTo(x + T*0.6, y + T*0.2); ctx.lineTo(x + T*0.8, y + T*0.45);
    ctx.moveTo(x + T*0.1, y + T*0.6); ctx.lineTo(x + T*0.35, y + T*0.8);
    ctx.moveTo(x + T*0.5, y + T*0.62); ctx.lineTo(x + T*0.75, y + T*0.85);
    ctx.stroke();

    // Edge shadow (gives 3D depth)
    const grad = ctx.createLinearGradient(x, y, x+T, y+T);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, T, T);

    // Top-left light edge
    ctx.fillStyle = 'rgba(255,220,100,0.12)';
    ctx.fillRect(x, y, T, 3);
    ctx.fillRect(x, y, 3, T);

    // Bottom-right dark edge
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y + T - 3, T, 3);
    ctx.fillRect(x + T - 3, y, 3, T);

    if (highlighted) {
      ctx.fillStyle = 'rgba(255,255,100,0.15)';
      ctx.fillRect(x, y, T, T);
    }
  },

  drawDirtTile(ctx, x, y) {
    const T = this.TILE;
    ctx.fillStyle = '#6b4020';
    ctx.fillRect(x, y, T, T);
    // Dirt patches
    ctx.fillStyle = '#7a4e28';
    for(let i=0;i<6;i++){
      ctx.fillRect(x + Math.floor(i*7)%T, y + Math.floor(i*11)%T, 6, 5);
    }
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(x, y+T-2, T, 2);
    ctx.fillRect(x+T-2, y, 2, T);
  },

  drawBackground(ctx, x, y, w, h) {
    // Cave background - dark blue-grey like Spelunky
    const grad = ctx.createRadialGradient(x+w/2, y+h/2, 0, x+w/2, y+h/2, Math.max(w,h));
    grad.addColorStop(0, '#1a1e2a');
    grad.addColorStop(0.5, '#0e1018');
    grad.addColorStop(1, '#050608');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Cave wall texture patches
    ctx.fillStyle = 'rgba(30,25,15,0.4)';
    for(let i=0; i<12; i++){
      const px = x + (i * 173 % w);
      const py = y + (i * 97 % h);
      ctx.beginPath();
      ctx.ellipse(px, py, 40+i*7, 25+i*5, i*0.3, 0, Math.PI*2);
      ctx.fill();
    }
  },

  // ---- PLAYER (Spelunky Guy) ----
  drawPlayer(ctx, x, y, facingRight, isWalking, isJumping, isCrouching, isOnRope, frameCount) {
    const T = this.TILE;
    const cx = x + T/2;
    const cy = y + T/2;
    ctx.save();
    if (!facingRight) {
      ctx.translate(cx*2, 0);
      ctx.scale(-1, 1);
    }

    const frame = Math.floor(frameCount/8)%4;
    const walkOff = isWalking ? [0,-2,0,2][frame] : 0;
    const bodyY = isCrouching ? 8 : 0;
    const jumpOff = isJumping ? -4 : 0;

    // ---- SHADOW ----
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + T/2, y + T - 3, 10, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // ---- BOOTS ----
    ctx.fillStyle = '#3a2a1a';
    if (!isCrouching) {
      const bootY = y + T - 10 + walkOff + jumpOff;
      // left boot
      ctx.fillRect(x + T/2 - 10, bootY, 9, 10);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x + T/2 - 10, bootY + 7, 10, 3);
      // right boot
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x + T/2 + 1, bootY, 9, 10);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x + T/2 + 1, bootY + 7, 10, 3);
    } else {
      ctx.fillRect(x + T/2 - 12, y + T - 12, 24, 10);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x + T/2 - 12, y + T - 5, 24, 5);
    }

    // ---- PANTS (brown) ----
    ctx.fillStyle = '#7a4a1a';
    const pantsY = y + T - 20 + walkOff + bodyY + jumpOff;
    ctx.fillRect(x + T/2 - 10, pantsY, 20, 12);
    // Belt
    ctx.fillStyle = '#3a2a0a';
    ctx.fillRect(x + T/2 - 10, pantsY, 20, 3);
    ctx.fillStyle = '#886620';
    ctx.fillRect(x + T/2 - 2, pantsY, 4, 4); // belt buckle

    // ---- JACKET / BODY ----
    ctx.fillStyle = '#8b6020';
    const bodyTop = y + T - 32 + bodyY + jumpOff;
    ctx.fillRect(x + T/2 - 9, bodyTop, 18, 14);
    // jacket lapel / shirt
    ctx.fillStyle = '#d4c090';
    ctx.fillRect(x + T/2 - 4, bodyTop + 1, 8, 10);
    ctx.fillStyle = '#8b6020';
    ctx.fillRect(x + T/2 - 1, bodyTop + 1, 2, 10);
    // Backpack strap hint
    ctx.fillStyle = '#6a4818';
    ctx.fillRect(x + T/2 + 6, bodyTop + 1, 3, 12);

    // ---- ARMS ----
    ctx.fillStyle = '#8b6020';
    if (!isCrouching) {
      const armWave = isWalking ? [3,0,-3,0][frame] : 0;
      // left arm
      ctx.fillRect(x + T/2 - 14, bodyTop + armWave, 5, 12);
      // right arm with whip/hand
      ctx.fillRect(x + T/2 + 9, bodyTop - armWave, 5, 12);
      // hands
      ctx.fillStyle = '#f0c090';
      ctx.fillRect(x + T/2 - 15, bodyTop + 9 + armWave, 6, 6);
      ctx.fillRect(x + T/2 + 9, bodyTop + 9 - armWave, 6, 6);
    }

    // ---- HEAD ----
    const headY = y + T - 44 + bodyY + jumpOff;
    // Head circle
    ctx.fillStyle = '#f0c090';
    ctx.beginPath();
    ctx.ellipse(x + T/2, headY + 11, 11, 12, 0, 0, Math.PI*2);
    ctx.fill();
    // Red nose
    ctx.fillStyle = '#dd4444';
    ctx.beginPath();
    ctx.ellipse(x + T/2 + 6, headY + 12, 4, 3.5, 0, 0, Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#2a1400';
    ctx.beginPath();
    ctx.ellipse(x + T/2 + 1, headY + 8, 2.5, 2.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + T/2 + 7, headY + 8, 2.5, 2.5, 0, 0, Math.PI*2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + T/2 + 2, headY + 7, 1, 1);
    ctx.fillRect(x + T/2 + 8, headY + 7, 1, 1);

    // ---- HAT ----
    ctx.fillStyle = '#8b6020';
    ctx.fillRect(x + T/2 - 13, headY + 2, 26, 5); // brim
    ctx.fillRect(x + T/2 - 8, headY - 8, 18, 12); // crown
    ctx.fillStyle = '#6a4818';
    ctx.fillRect(x + T/2 - 8, headY + 2, 18, 3); // hat band shadow
    ctx.fillStyle = '#aa7a28';
    ctx.fillRect(x + T/2 - 8, headY - 7, 18, 2); // hat highlight
    // Headlamp
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.ellipse(x + T/2 - 4, headY - 1, 5, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.9)';
    ctx.beginPath();
    ctx.ellipse(x + T/2 - 4, headY - 1, 3, 2.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + T/2 - 4, headY - 1);
    ctx.lineTo(x + T/2 + 30, headY + 5);
    ctx.lineTo(x + T/2 + 28, headY + 12);
    ctx.lineTo(x + T/2 - 4, headY + 1);
    ctx.fill();

    ctx.restore();
  },

  // ---- ROPE ----
  drawRope(ctx, x, y, segments) {
    ctx.strokeStyle = '#cc8833';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + this.TILE/2, y);
    for(let i = 0; i < segments; i++) {
      const ropeX = x + this.TILE/2 + Math.sin(i * 0.5) * 2;
      ctx.lineTo(ropeX, y + i * this.TILE);
    }
    ctx.stroke();
    // rope texture stripes
    ctx.strokeStyle = '#aa6622';
    ctx.lineWidth = 1;
    for(let i=0; i<segments; i++){
      for(let j=0;j<4;j++){
        const ry = y + i*this.TILE + j*(this.TILE/4);
        ctx.beginPath();
        ctx.moveTo(x+this.TILE/2-1, ry);
        ctx.lineTo(x+this.TILE/2+1, ry+6);
        ctx.stroke();
      }
    }
  },

  // ---- LADDER ----
  drawLadder(ctx, x, y) {
    const T = this.TILE;
    // Rails
    ctx.fillStyle = '#7a3a10';
    ctx.fillRect(x + 6, y, 6, T);
    ctx.fillRect(x + T - 12, y, 6, T);
    ctx.fillStyle = '#5a2a08';
    ctx.fillRect(x + 7, y, 2, T);
    ctx.fillRect(x + T - 11, y, 2, T);
    // Rungs
    ctx.fillStyle = '#8b4418';
    for(let i = 0; i < 4; i++) {
      const ry = y + i * (T/3.5) + 4;
      ctx.fillRect(x + 6, ry, T - 12, 5);
      ctx.fillStyle = '#aa5522';
      ctx.fillRect(x + 6, ry, T - 12, 2);
      ctx.fillStyle = '#8b4418';
    }
  },

  // ---- CHEST ----
  drawChest(ctx, x, y, isOpen = false) {
    const T = this.TILE;
    if (!isOpen) {
      // Chest body
      ctx.fillStyle = '#6a3a10';
      ctx.fillRect(x + 4, y + 12, T - 8, T - 16);
      ctx.fillStyle = '#8b5020';
      ctx.fillRect(x + 4, y + 12, T - 8, 8); // lid
      // Chest texture
      ctx.fillStyle = '#5a2a08';
      ctx.fillRect(x + 4, y + 18, T - 8, 2); // lid seam
      // Metal bands
      ctx.fillStyle = '#c0922a';
      ctx.fillRect(x + 4, y + 12, T - 8, 3); // top band
      ctx.fillRect(x + 4, y + T - 7, T - 8, 3); // bottom band
      ctx.fillRect(x + T/2 - 3, y + 12, 6, T - 16); // center band
      // Lock
      ctx.fillStyle = '#ddaa22';
      ctx.fillRect(x + T/2 - 4, y + 18, 8, 7);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + T/2 - 2, y + 20, 4, 4);
      ctx.beginPath();
      ctx.arc(x + T/2, y + 20, 2, Math.PI, 0);
      ctx.fill();
      // Corner studs
      ctx.fillStyle = '#c0922a';
      [[5,13],[T-9,13],[5,T-9],[T-9,T-9]].forEach(([bx,by])=>{
        ctx.beginPath();
        ctx.arc(x+bx, y+by, 3, 0, Math.PI*2);
        ctx.fill();
      });
    } else {
      // Open chest - just the base
      ctx.fillStyle = '#4a2808';
      ctx.fillRect(x + 4, y + 20, T - 8, T - 24);
      ctx.fillStyle = '#6a3a10';
      ctx.fillRect(x + 4, y + 20, T - 8, 4);
      // Lid open (tilted)
      ctx.save();
      ctx.translate(x + T/2, y + 20);
      ctx.rotate(-Math.PI * 0.6);
      ctx.fillStyle = '#8b5020';
      ctx.fillRect(-16, 0, 32, 8);
      ctx.fillStyle = '#c0922a';
      ctx.fillRect(-16, 0, 32, 2);
      ctx.restore();
    }
  },

  // ---- GEM ----
  drawGem(ctx, x, y, type = 0) {
    const T = this.TILE;
    const gemColors = [
      ['#ff4466','#ff88aa','#cc1133'], // red
      ['#4488ff','#88bbff','#1144cc'], // blue
      ['#44ff88','#88ffbb','#11cc44'], // green
      ['#ffee44','#fff288','#ccbb11'], // yellow
    ];
    const [mid, hi, dark] = gemColors[type % gemColors.length];
    const gx = x + T/2, gy = y + T/2;
    const r = 8;
    // Diamond shape
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.moveTo(gx, gy - r);
    ctx.lineTo(gx + r*0.7, gy);
    ctx.lineTo(gx, gy + r);
    ctx.lineTo(gx - r*0.7, gy);
    ctx.closePath();
    ctx.fill();
    // Inner facets
    ctx.fillStyle = hi;
    ctx.beginPath();
    ctx.moveTo(gx, gy - r);
    ctx.lineTo(gx + r*0.7, gy);
    ctx.lineTo(gx, gy - r*0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(gx - r*0.7, gy);
    ctx.lineTo(gx, gy + r);
    ctx.lineTo(gx, gy);
    ctx.closePath();
    ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(gx - r*0.2, gy - r*0.8);
    ctx.lineTo(gx + r*0.1, gy - r*0.4);
    ctx.lineTo(gx - r*0.1, gy - r*0.5);
    ctx.closePath();
    ctx.fill();
  },

  // ---- GOLD NUGGET ----
  drawGold(ctx, x, y) {
    const T = this.TILE;
    ctx.fillStyle = '#ddaa22';
    ctx.beginPath();
    ctx.ellipse(x + T/2, y + T/2, 8, 6, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.ellipse(x + T/2 - 1, y + T/2 - 2, 4, 3, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#886611';
    ctx.beginPath();
    ctx.ellipse(x + T/2 + 2, y + T/2 + 2, 3, 2, 0.3, 0, Math.PI*2);
    ctx.fill();
  },

  // ---- SMALL GEM (from chest) ----
  drawSmallGem(ctx, x, y, type = 0, scale = 0.6) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    this.drawGem(ctx, x, y, type);
    ctx.restore();
  },

  // ---- DOOR / EXIT ----
  drawDoor(ctx, x, y) {
    const T = this.TILE;
    const dw = T * 1.5, dh = T * 2;
    const dx = x - dw/2 + T/2, dy = y - dh + T;
    // Frame outer
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(dx, dy, dw, dh);
    // Frame decoration (Mayan style arch)
    ctx.strokeStyle = '#4a6a8a';
    ctx.lineWidth = 3;
    ctx.strokeRect(dx + 2, dy + 2, dw - 4, dh - 4);
    // Inner dark
    ctx.fillStyle = '#000814';
    ctx.fillRect(dx + 8, dy + 8, dw - 16, dh - 12);
    // Glowing portal inside
    const portalGrad = ctx.createRadialGradient(
      dx + dw/2, dy + dh/2, 5,
      dx + dw/2, dy + dh/2, 30
    );
    portalGrad.addColorStop(0, 'rgba(180,40,40,0.9)');
    portalGrad.addColorStop(0.5, 'rgba(80,0,20,0.5)');
    portalGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = portalGrad;
    ctx.fillRect(dx + 8, dy + 8, dw - 16, dh - 12);
    // Gold orbs on sides
    ctx.fillStyle = '#ddaa22';
    ctx.beginPath(); ctx.arc(dx + 6, dy + dh*0.4, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(dx + dw - 6, dy + dh*0.4, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffee66';
    ctx.beginPath(); ctx.arc(dx + 6, dy + dh*0.4, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(dx + dw - 6, dy + dh*0.4, 2, 0, Math.PI*2); ctx.fill();
    // Decorative carvings
    ctx.strokeStyle = '#2a4a6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(dx + dw/2, dy + 20, 14, Math.PI, 0); // arch top
    ctx.stroke();
  },

  // ---- SNAKE ENEMY ----
  drawSnake(ctx, x, y, facingRight, frameCount) {
    const T = this.TILE;
    ctx.save();
    if (!facingRight) { ctx.translate(x*2+T, 0); ctx.scale(-1,1); }
    const wave = Math.sin(frameCount * 0.15) * 3;

    // Body segments
    const segs = 5;
    for(let i = 0; i < segs; i++) {
      const sw = (segs - i) * 3 + 2;
      const sx = x + T*0.1 + i * (T*0.17);
      const sy = y + T*0.5 + Math.sin((frameCount*0.15) + i*0.7) * 4;
      ctx.fillStyle = i%2===0 ? '#22aa44' : '#188833';
      ctx.beginPath();
      ctx.ellipse(sx, sy, sw, sw*0.8, 0, 0, Math.PI*2);
      ctx.fill();
    }
    // Head
    const hx = x + T*0.8;
    const hy = y + T*0.5 + wave;
    ctx.fillStyle = '#33cc55';
    ctx.beginPath();
    ctx.ellipse(hx, hy, 10, 8, 0.3, 0, Math.PI*2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath(); ctx.ellipse(hx+4, hy-2, 3, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(hx+5, hy-2, 1.5, 2, 0, 0, Math.PI*2); ctx.fill();
    // Tongue
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx+9, hy); ctx.lineTo(hx+14, hy-2); ctx.moveTo(hx+14, hy-2);
    ctx.lineTo(hx+16, hy-4); ctx.moveTo(hx+14, hy-2); ctx.lineTo(hx+16, hy);
    ctx.stroke();
    ctx.restore();
  },

  // ---- SPIDER ENEMY ----
  drawSpider(ctx, x, y, frameCount) {
    const T = this.TILE;
    const cx = x + T/2, cy = y + T/2;
    const bob = Math.sin(frameCount * 0.1) * 3;

    // Legs (8 of them)
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 2;
    for(let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      const legWave = Math.sin(frameCount * 0.2 + i) * 0.3;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + bob);
      ctx.quadraticCurveTo(cx - 16 + legWave*5, cy - 6 + i*3, cx - 20, cy + 8 + i*2);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + bob);
      ctx.quadraticCurveTo(cx + 16 - legWave*5, cy - 6 + i*3, cx + 20, cy + 8 + i*2);
      ctx.stroke();
    }
    // Body
    ctx.fillStyle = '#330000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, 12, 10, 0, 0, Math.PI*2);
    ctx.fill();
    // Red pattern
    ctx.fillStyle = '#cc0022';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob + 2, 4, 5, 0, 0, Math.PI*2);
    ctx.fill();
    // Eyes (6 eyes like real spider)
    ctx.fillStyle = '#ff4444';
    [[-4,-8],[-1,-10],[4,-8],[-6,-5],[0,-5],[6,-5]].forEach(([ex,ey])=>{
      ctx.beginPath();
      ctx.arc(cx+ex, cy+ey+bob, 1.5, 0, Math.PI*2);
      ctx.fill();
    });
  },

  // ---- BAT ENEMY ----
  drawBat(ctx, x, y, frameCount) {
    const T = this.TILE;
    const cx = x + T/2, cy = y + T/2;
    const flapAngle = Math.sin(frameCount * 0.3) * 0.6;
    const bob = Math.sin(frameCount * 0.15) * 4;

    // Wings
    ctx.fillStyle = '#440066';
    // Left wing
    ctx.save();
    ctx.translate(cx - 4, cy + bob);
    ctx.rotate(-flapAngle - 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8, -12, -20, -8, -22, 4);
    ctx.bezierCurveTo(-16, 2, -8, 6, 0, 2);
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(cx + 4, cy + bob);
    ctx.rotate(flapAngle + 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8, -12, 20, -8, 22, 4);
    ctx.bezierCurveTo(16, 2, 8, 6, 0, 2);
    ctx.fill();
    ctx.restore();
    // Body
    ctx.fillStyle = '#6600aa';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, 8, 9, 0, 0, Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 3, cy + bob - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy + bob - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffaaaa';
    ctx.beginPath(); ctx.arc(cx - 2, cy + bob - 3, 0.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy + bob - 3, 0.8, 0, Math.PI*2); ctx.fill();
    // Fangs
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + bob + 4);
    ctx.lineTo(cx, cy + bob + 8);
    ctx.lineTo(cx + 2, cy + bob + 4);
    ctx.fill();
  },

  // ---- CAVEMAN ENEMY ----
  drawCaveman(ctx, x, y, facingRight, frameCount) {
    const T = this.TILE;
    ctx.save();
    if (!facingRight) { ctx.translate(x*2+T, 0); ctx.scale(-1,1); }
    const walkBob = Math.floor(frameCount/10)%2 === 0 ? 0 : 2;

    // Body
    ctx.fillStyle = '#8b5020';
    ctx.fillRect(x + T/2 - 8, y + T - 30 + walkBob, 16, 18);
    // Head
    ctx.fillStyle = '#d4900a';
    ctx.beginPath();
    ctx.ellipse(x + T/2, y + T - 36 + walkBob, 10, 10, 0, 0, Math.PI*2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(x + T/2 - 10, y + T - 46 + walkBob, 20, 10);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + T/2 - 6, y + T - 40 + walkBob, 4, 4);
    ctx.fillRect(x + T/2 + 2, y + T - 40 + walkBob, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + T/2 - 5, y + T - 39 + walkBob, 2, 2);
    ctx.fillRect(x + T/2 + 3, y + T - 39 + walkBob, 2, 2);
    // Club
    ctx.fillStyle = '#6a3a10';
    ctx.fillRect(x + T/2 + 8, y + T - 38 + walkBob, 4, 16);
    ctx.fillStyle = '#8b5020';
    ctx.fillRect(x + T/2 + 6, y + T - 44 + walkBob, 8, 10);
    // Legs
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(x + T/2 - 8, y + T - 13 + walkBob, 7, 13);
    ctx.fillRect(x + T/2 + 1, y + T - 11 - walkBob, 7, 11);
    ctx.restore();
  },

  // ---- EXPLOSION ----
  drawExplosion(ctx, x, y, frame, maxFrames) {
    const T = this.TILE;
    const cx = x + T/2, cy = y + T/2;
    const prog = frame / maxFrames;
    const r = T * 1.5 * prog;

    // Outer fire ring
    const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    fireGrad.addColorStop(0, `rgba(255,255,200,${1-prog})`);
    fireGrad.addColorStop(0.3, `rgba(255,180,0,${0.8*(1-prog)})`);
    fireGrad.addColorStop(0.6, `rgba(255,60,0,${0.6*(1-prog)})`);
    fireGrad.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();

    // Debris particles
    for(let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI*2;
      const dist = r * 0.8;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const pSize = 3 * (1 - prog);
      ctx.fillStyle = `rgba(200,120,0,${0.8*(1-prog)})`;
      ctx.fillRect(px - pSize/2, py - pSize/2, pSize, pSize);
    }

    // Center bright flash (early frames)
    if (prog < 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${(0.3-prog)/0.3})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r*0.4, 0, Math.PI*2);
      ctx.fill();
    }
  },

  // ---- BOMB ----
  drawBomb(ctx, x, y, frameCount) {
    const T = this.TILE;
    const cx = x + T/2, cy = y + T/2;
    const pulse = 1 + Math.sin(frameCount * 0.3) * 0.05;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-cx, -cy);

    // Bomb body
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.arc(cx - 2, cy, 4, 0, Math.PI*2);
    ctx.fill();
    // Fuse
    ctx.strokeStyle = '#886622';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy - 6);
    ctx.quadraticCurveTo(cx + 8, cy - 12, cx + 5, cy - 16);
    ctx.stroke();
    // Fuse spark (flickers)
    if (frameCount % 6 < 3) {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(cx + 5, cy - 16, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(cx + 5, cy - 16, 1.5, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  },

  // ---- WHIP ATTACK ----
  drawWhip(ctx, x, y, facingRight, frame, maxFrames) {
    const T = this.TILE;
    const prog = frame / maxFrames;
    const cx = x + (facingRight ? T*1.2 : -T*0.2);
    const cy = y + T*0.5;
    const len = T * 1.2 * Math.sin(prog * Math.PI);
    const angle = (facingRight ? 1 : -1) * (0.3 + prog * 0.4);

    ctx.strokeStyle = '#cc8833';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + (facingRight ? T*0.7 : T*0.3), cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle) * len * 0.5,
      cy + Math.sin(angle) * len * 0.3,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len * 0.5
    );
    ctx.stroke();

    // Tip flash
    if (prog > 0.4 && prog < 0.7) {
      ctx.fillStyle = 'rgba(255,220,100,0.8)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle)*len, cy + Math.sin(angle)*len*0.5, 5, 0, Math.PI*2);
      ctx.fill();
    }
  },

  // ---- HUD HEART ----
  drawHeart(ctx, x, y, filled = true) {
    ctx.fillStyle = filled ? '#ff2244' : '#440011';
    ctx.beginPath();
    ctx.moveTo(x+8, y+4);
    ctx.bezierCurveTo(x+8, y+1, x+4, y, x+4, y+4);
    ctx.bezierCurveTo(x+4, y+6, x+8, y+10, x+8, y+12);
    ctx.bezierCurveTo(x+8, y+10, x+12, y+6, x+12, y+4);
    ctx.bezierCurveTo(x+12, y, x+8, y+1, x+8, y+4);
    ctx.fill();
    if (filled) {
      ctx.fillStyle = 'rgba(255,150,150,0.5)';
      ctx.beginPath();
      ctx.ellipse(x+7, y+4, 2, 2, -0.5, 0, Math.PI*2);
      ctx.fill();
    }
  },

  // ---- TORCH (wall decoration) ----
  drawTorch(ctx, x, y, frameCount) {
    const T = this.TILE;
    // Bracket
    ctx.fillStyle = '#4a3010';
    ctx.fillRect(x + T/2 - 3, y + T/2 - 4, 6, 12);
    ctx.fillStyle = '#6a4818';
    ctx.fillRect(x + T/2 - 5, y + T/2 + 4, 10, 4);
    // Fire base
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.ellipse(x + T/2, y + T/2 - 4, 5, 4, 0, 0, Math.PI*2);
    ctx.fill();
    // Flame
    const flickerSeed = frameCount * 0.2;
    const fx1 = Math.sin(flickerSeed) * 3;
    const fh = 8 + Math.sin(flickerSeed * 1.7) * 3;
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(x + T/2, y + T/2 - 4);
    ctx.bezierCurveTo(x+T/2+4+fx1, y+T/2-8, x+T/2+2, y+T/2-4-fh, x+T/2, y+T/2-6-fh);
    ctx.bezierCurveTo(x+T/2-2, y+T/2-4-fh, x+T/2-4-fx1, y+T/2-8, x+T/2, y+T/2-4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x+T/2, y+T/2-8, 2, 3, 0, 0, Math.PI*2);
    ctx.fill();
    // Glow
    const glow = ctx.createRadialGradient(x+T/2, y+T/2-6, 0, x+T/2, y+T/2-6, 20);
    glow.addColorStop(0, 'rgba(255,150,0,0.3)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x+T/2, y+T/2-6, 20, 0, Math.PI*2);
    ctx.fill();
  },

  // ---- COBWEB ----
  drawCobweb(ctx, x, y, corner = 'tl') {
    const T = this.TILE;
    ctx.strokeStyle = 'rgba(200,200,200,0.4)';
    ctx.lineWidth = 0.8;
    const ox = corner.includes('l') ? x : x + T;
    const oy = corner.includes('t') ? y : y + T;
    const dx = corner.includes('l') ? 1 : -1;
    const dy = corner.includes('t') ? 1 : -1;
    for(let r = 6; r <= 24; r += 6){
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI/2 * dx * dy);
      ctx.stroke();
    }
    for(let a = 0; a < Math.PI/2; a += Math.PI/8){
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a)*dx*24, oy + Math.sin(a)*dy*24);
      ctx.stroke();
    }
  },

  // ---- SPIKES ----
  drawSpikes(ctx, x, y) {
    const T = this.TILE;
    const numSpikes = 4;
    const sw = T / numSpikes;
    ctx.fillStyle = '#888888';
    for(let i = 0; i < numSpikes; i++) {
      const sx = x + i * sw;
      ctx.beginPath();
      ctx.moveTo(sx + sw*0.1, y + T);
      ctx.lineTo(sx + sw*0.5, y + T - 16);
      ctx.lineTo(sx + sw*0.9, y + T);
      ctx.fill();
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.moveTo(sx + sw*0.4, y + T - 2);
      ctx.lineTo(sx + sw*0.5, y + T - 16);
      ctx.lineTo(sx + sw*0.6, y + T - 2);
      ctx.fill();
      ctx.fillStyle = '#888888';
    }
  },

  // ---- GOLD IN WALL ----
  drawGoldVein(ctx, x, y) {
    const T = this.TILE;
    ctx.fillStyle = '#ddaa22';
    for(let i=0;i<4;i++){
      const vx = x + 5 + i * 8;
      const vy = y + 10 + (i%2)*12;
      ctx.beginPath();
      ctx.ellipse(vx, vy, 4+i, 3, i*0.4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffee44';
    ctx.beginPath(); ctx.ellipse(x+10, y+14, 2, 1.5, 0.3, 0, Math.PI*2); ctx.fill();
  },

  // ---- DEATH SCREEN PLAYER ----
  drawDeadPlayer(ctx, x, y) {
    const T = this.TILE;
    // Lying on back
    ctx.save();
    ctx.translate(x + T/2, y + T/2);
    ctx.rotate(Math.PI/2);
    // Body
    ctx.fillStyle = '#8b6020';
    ctx.fillRect(-8, -8, 16, 14);
    ctx.fillStyle = '#d4c090';
    ctx.fillRect(-4, -7, 8, 10);
    // Head
    ctx.fillStyle = '#f0c090';
    ctx.beginPath();
    ctx.ellipse(0, 14, 10, 11, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#dd4444';
    ctx.beginPath(); ctx.ellipse(6, 14, 4, 3.5, 0, 0, Math.PI*2); ctx.fill();
    // X eyes for death
    ctx.strokeStyle = '#2a1400'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(2, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 10); ctx.lineTo(-2, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 10); ctx.lineTo(8, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(4, 14); ctx.stroke();
    // Hat fell off
    ctx.fillStyle = '#8b6020';
    ctx.save(); ctx.translate(-5, 28); ctx.rotate(-0.5);
    ctx.fillRect(-10, -3, 20, 4);
    ctx.fillRect(-6, -8, 14, 7);
    ctx.restore();
    ctx.restore();
  },

  // ---- PARTICLE ----
  drawParticle(ctx, px, py, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(px - size/2, py - size/2, size, size);
  },
};
