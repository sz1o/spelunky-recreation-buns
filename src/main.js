// ============================================================
// MAIN.JS - Boot sequence: loading -> splashes -> controls -> game
// ============================================================

(async function() {
  // Initialize systems
  Audio.init();
  Game.init();

  const loadBar = document.getElementById('loading-bar-inner');
  const loadStatus = document.getElementById('loading-status');

  // Asset loading steps (procedural, but we animate real progress)
  const assetSteps = [
    {name: 'Loading engine...', pct: 5},
    {name: 'Generating cave tiles...', pct: 10},
    {name: 'Loading player sprites...', pct: 18},
    {name: 'Loading enemy sprites...', pct: 26},
    {name: 'Loading item sprites...', pct: 34},
    {name: 'Compiling shaders...', pct: 41},
    {name: 'Loading audio engine...', pct: 49},
    {name: 'Generating sound banks...', pct: 57},
    {name: 'Loading cave music...', pct: 65},
    {name: 'Generating level templates...', pct: 73},
    {name: 'Loading HUD elements...', pct: 80},
    {name: 'Initializing physics...', pct: 86},
    {name: 'Loading UI assets...', pct: 91},
    {name: 'Warming up renderer...', pct: 96},
    {name: 'Ready!', pct: 100},
  ];

  // Animate loading bar
  async function setProgress(pct, status) {
    loadStatus.textContent = status;
    loadBar.style.width = pct + '%';
    await delay(80 + Math.random() * 180);
  }

  async function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // Draw animated loading background
  const bgCanvas = document.getElementById('loading-bg-canvas');
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const bgCtx = bgCanvas.getContext('2d');
  let bgFrame = 0;
  const bgAnim = setInterval(() => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const w = bgCanvas.width, h = bgCanvas.height;
    // Dark cave background
    bgCtx.fillStyle = '#0a0805';
    bgCtx.fillRect(0, 0, w, h);
    // Animated cave walls
    for(let i=0; i<8; i++){
      const x = (i/8)*w + Math.sin(bgFrame*0.02+i)*20;
      const y = h * 0.15;
      bgCtx.fillStyle = `rgba(139,90,40,${0.1+i*0.01})`;
      bgCtx.fillRect(x - 30, 0, 60, h);
    }
    // Particle sparkles
    for(let i=0; i<15; i++){
      const sx = (Math.sin(bgFrame*0.03+i*2.1)*0.5+0.5)*w;
      const sy = (Math.cos(bgFrame*0.02+i*1.7)*0.5+0.5)*h;
      const a = (Math.sin(bgFrame*0.08+i)*0.5+0.5)*0.6;
      const colors = ['#ff4466','#4488ff','#44ff88','#ffee44','#ff8800'];
      bgCtx.fillStyle = colors[i%5].replace(')', `,${a})`).replace('rgb','rgba').replace('#','rgba(').replace(/([0-9a-f]{2})/gi,(m)=>parseInt(m,16)+',');
      // simpler:
      bgCtx.globalAlpha = a;
      bgCtx.fillStyle = colors[i%5];
      bgCtx.fillRect(sx-2, sy-2, 4, 4);
      bgCtx.globalAlpha = 1;
    }
    bgFrame++;
  }, 1000/30);

  // Run loading steps
  for(const step of assetSteps){
    await setProgress(step.pct, step.name);
  }
  clearInterval(bgAnim);

  await delay(400);

  // Fade out loading screen
  const loadScreen = document.getElementById('loading-screen');
  loadScreen.style.opacity = '0';
  await delay(600);
  loadScreen.style.display = 'none';

  // ---- SPLASH 1: @sage.stock ----
  await showSplash('splash-sage', 1200);

  // ---- SPLASH 2: freaks-shop.site ----
  await showSplash('splash-freaks', 1200);

  // ---- SPLASH 3: Mossmouth ----
  await showSplash('splash-mossmouth', 1600);

  // ---- CONTROLS SCREEN ----
  await showControls();

  // ---- START GAME ----
  Game.start();

  // Button handlers
  document.getElementById('lc-continue-btn').addEventListener('click', () => {
    Game.nextLevel();
  });
  document.getElementById('death-retry-btn').addEventListener('click', () => {
    Audio.resume();
    Game.restart();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && document.getElementById('level-complete-screen').classList.contains('visible')) {
      Game.nextLevel();
    }
  });

  // ========================
  async function showSplash(id, duration) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    await delay(50);
    el.classList.add('visible');
    await delay(duration);
    el.classList.remove('visible');
    await delay(500);
    el.classList.add('hidden');
    await delay(100);
  }

  async function showControls() {
    return new Promise(res => {
      const screen = document.getElementById('controls-screen');
      const btn = document.getElementById('controls-continue-btn');
      screen.classList.remove('hidden');
      setTimeout(() => screen.classList.add('visible'), 50);

      // Draw cave background on controls canvas
      const ctrl_canvas = document.getElementById('controls-bg');
      ctrl_canvas.width = window.innerWidth;
      ctrl_canvas.height = window.innerHeight;
      const ctrl_ctx = ctrl_canvas.getContext('2d');

      // Draw stone border/background
      ctrl_ctx.fillStyle = '#0a0805';
      ctrl_ctx.fillRect(0, 0, ctrl_canvas.width, ctrl_canvas.height);
      // Stone tiles along edges
      const T = 40;
      for(let c=0; c<Math.ceil(ctrl_canvas.width/T); c++){
        Sprites.drawCaveTile(ctrl_ctx, c*T, 0, c%4);
        Sprites.drawCaveTile(ctrl_ctx, c*T, ctrl_canvas.height - T, c%4);
      }
      for(let r=0; r<Math.ceil(ctrl_canvas.height/T); r++){
        Sprites.drawCaveTile(ctrl_ctx, 0, r*T, r%4);
        Sprites.drawCaveTile(ctrl_ctx, ctrl_canvas.width-T, r*T, r%4);
      }

      const handler = () => {
        btn.removeEventListener('click', handler);
        screen.classList.remove('visible');
        setTimeout(() => {
          screen.classList.add('hidden');
          res();
        }, 500);
      };
      btn.addEventListener('click', handler);
      window.addEventListener('keydown', function onKey(e){
        if(e.code === 'Enter' || e.code === 'Space'){
          window.removeEventListener('keydown', onKey);
          handler();
        }
      });
    });
  }
})();
