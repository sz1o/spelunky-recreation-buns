# 🗺️ Spelunky Web Recreation

A faithful recreation of **Spelunky 1 (Xbox 360)** built entirely for the web.
Made by **@sage.stock** | freaks-shop.site
Original game credit: **Mossmouth©**

## 🎮 Controls

| Key | Action |
|-----|--------|
| `A` / `D` | Move Left / Right |
| `SPACE` | Jump |
| `RIGHT SHIFT` | Sprint |
| `S` | Look Down / Crouch |
| `C` | Whip / Attack |
| `F` | Throw Bomb |
| `S + F` | Place Bomb (crouch + throw) |
| `G` | Throw Rope |
| `W` / `S` (on rope/ladder) | Climb Up / Down |
| `ENTER` | Enter Door / Next Level |

## 🚀 Deployment

### Vercel (Node.js)
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages (Static)
1. Push to GitHub
2. Settings → Pages → Deploy from branch `main`
3. The `.github/workflows/deploy.yml` handles auto-deploy

### Local Dev
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 📁 File Structure

```
spelunky/
├── index.html          # Main entry point
├── style.css           # All UI/game styles
├── src/
│   ├── main.js         # Boot sequence (loading → splashes → controls → game)
│   ├── game.js         # Main game loop & state management
│   ├── player.js       # Player controller (movement, whip, bombs, ropes)
│   ├── entities.js     # All enemies (snake, bat, spider, caveman) + bombs
│   ├── physics.js      # Gravity, collision, rope physics
│   ├── levelgen.js     # Procedural level generation (room templates)
│   ├── sprites.js      # All game art drawn via Canvas API
│   └── audio.js        # Web Audio API sound engine (procedural SFX + music)
├── api/
│   └── scores.js       # Vercel serverless endpoint
├── vercel.json         # Vercel config
└── package.json        # Node.js / npm config
```

## 🎨 Features

- ✅ Full loading screen with animated progress bar
- ✅ Splash screens: @sage.stock → freaks-shop.site → Mossmouth©
- ✅ Controls screen with Continue button
- ✅ Procedural cave level generation (Spelunky room-template system)
- ✅ Full player: walk, sprint, jump (coyote time + jump buffering), crouch
- ✅ Climbing: ropes (throw with G) and ladders (W/S)
- ✅ Whip attack (C) — hits enemies and opens chests
- ✅ Bombs (F to throw, S+F to place) — destroys tiles + enemies
- ✅ Chests — whip to open, spills 3 gems
- ✅ Enemies: Snake, Bat, Spider (drops on player), Caveman (3HP, chases)
- ✅ HUD: Hearts, Bombs, Ropes, Gold, Level number
- ✅ Death screen with retry
- ✅ Level complete screen with stats
- ✅ Procedural Web Audio music (cave theme)
- ✅ All SFX: jump, land, whip, hit, bomb, gem pickup, etc.
- ✅ Cave art: hand-drawn tileset with bumps, crevices, gold veins, torches
- ✅ Vignette darkness overlay for cave atmosphere
- ✅ freaks-shop.site watermark (bottom-left)
