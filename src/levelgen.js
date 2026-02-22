// ============================================================
// LEVELGEN.JS - Procedural Spelunky 1-style level generation
// Uses room template system like the original game
// ============================================================

const LevelGen = {
  TILE: 40,
  COLS: 42,  // tile columns
  ROWS: 28,  // tile rows

  // Tile types
  T: {
    EMPTY: 0,
    SOLID: 1,
    DIRT:  2,
    LADDER:3,
    ROPE:  4,
    SPIKE: 5,
    GOLD:  6,  // gold vein in wall
    CHEST: 7,
    DOOR:  8,
    TORCH: 9,
    COBWEB:10,
    PUSH:  11, // pushable block
    ENTRY: 12, // player start
    ENEMY_SNAKE:  20,
    ENEMY_BAT:    21,
    ENEMY_SPIDER: 22,
    ENEMY_CAVEMAN:23,
  },

  // 4x4 room templates (each room is 10x8 tiles)
  // '.' = empty, '#' = solid, 'L' = ladder, 'S' = spike, 'E' = enemy, 'G' = gold, 'C' = chest
  roomTemplates: {
    // Normal traversable rooms
    normal: [
      [
        '##########',
        '#........#',
        '#........#',
        '#...##...#',
        '#...##...#',
        '##########',
      ],
      [
        '##########',
        '#........#',
        '#..####..#',
        '#........#',
        '#...LL...#',
        '##########',
      ],
      [
        '##########',
        '#........#',
        '#.##..##.#',
        '#........#',
        '#........#',
        '##########',
      ],
      [
        '##########',
        '#....#...#',
        '#....#...#',
        '#....L...#',
        '#...#L...#',
        '##########',
      ],
      [
        '##########',
        '#........#',
        '##.....###',
        '#........#',
        '#...##...#',
        '##########',
      ],
    ],
    // Rooms with enemies
    enemy: [
      [
        '##########',
        '#...E....#',
        '#........#',
        '#..####..#',
        '#........#',
        '##########',
      ],
      [
        '##########',
        '#........#',
        '#.E..E...#',
        '#..####..#',
        '#........#',
        '##########',
      ],
      [
        '##########',
        '#...E....#',
        '#..####..#',
        '#........#',
        '#.E......#',
        '##########',
      ],
    ],
    // Treasure rooms
    treasure: [
      [
        '##########',
        '#........#',
        '#.G..C...#',
        '#########.#',
        '#........#',
        '##########',
      ],
      [
        '##########',
        '#..CCC...#',
        '#........#',
        '#..####..#',
        '#...G....#',
        '##########',
      ],
      [
        '##########',
        '#..G.G...#',
        '#........#',
        '#...C....#',
        '#........#',
        '##########',
      ],
    ],
    // Corridor rooms (left/right connections)
    corridor: [
      [
        '##########',
        '##########',
        '........##',
        '........##',
        '##########',
        '##########',
      ],
      [
        '##########',
        '##########',
        '##........',
        '##........',
        '##########',
        '##########',
      ],
    ],
    // Top/bottom connection rooms
    vertical: [
      [
        '####LL####',
        '#...LL...#',
        '#...LL...#',
        '#...LL...#',
        '#...LL...#',
        '####LL####',
      ],
    ],
    // Start room
    start: [
      [
        '##########',
        '#...P....#',
        '#........#',
        '#..####..#',
        '#........#',
        '##########',
      ],
    ],
    // End room with door
    end: [
      [
        '##########',
        '#..D.....#',
        '#........#',
        '#...####.#',
        '#........#',
        '##########',
      ],
    ],
    // Spike trap room
    trap: [
      [
        '##########',
        '#........#',
        '#........#',
        '#SSSSSSSS#',
        '##########',
        '##########',
      ],
    ],
  },

  // Generate a full level
  generate(levelNum) {
    // Map is COLS x ROWS tiles
    const map = [];
    for(let r=0; r<this.ROWS; r++){
      map.push(new Array(this.COLS).fill(this.T.SOLID));
    }

    const roomW = 10, roomH = 6;
    const gridCols = Math.floor(this.COLS / roomW);
    const gridRows = Math.floor(this.ROWS / roomH);

    // Create path from top to bottom
    let pathCol = Math.floor(Math.random() * (gridCols - 1)) + 1;
    const path = [];
    for(let gr=0; gr<gridRows; gr++){
      path.push(pathCol);
      // Decide direction to next row
      const r = Math.random();
      if (r < 0.33 && pathCol > 1) pathCol--;
      else if (r < 0.66 && pathCol < gridCols - 2) pathCol++;
    }

    // Place rooms
    for(let gr=0; gr<gridRows; gr++){
      for(let gc=0; gc<gridCols; gc++){
        const isPath = path[gr] === gc;
        const isPrevPath = gr > 0 && path[gr-1] === gc;
        const isNextPath = gr < gridRows-1 && path[gr+1] === gc;
        const isStart = gr === 0 && isPath;
        const isEnd = gr === gridRows-1 && isPath;

        let template;
        if (isStart) {
          template = this._pickRandom(this.roomTemplates.start);
        } else if (isEnd) {
          template = this._pickRandom(this.roomTemplates.end);
        } else if (isPath) {
          // Path rooms - mostly normal with some enemies
          const r2 = Math.random();
          if (r2 < 0.5) template = this._pickRandom(this.roomTemplates.normal);
          else if (r2 < 0.75) template = this._pickRandom(this.roomTemplates.enemy);
          else template = this._pickRandom(this.roomTemplates.trap);
        } else {
          // Off-path rooms
          const r2 = Math.random();
          if (r2 < 0.4) template = this._pickRandom(this.roomTemplates.normal);
          else if (r2 < 0.65) template = this._pickRandom(this.roomTemplates.enemy);
          else template = this._pickRandom(this.roomTemplates.treasure);
        }

        // Carve the room into the map
        const ox = gc * roomW;
        const oy = gr * roomH;
        this._carveRoom(map, template, ox, oy);

        // Add vertical connections along path
        if (isPath && gr < gridRows-1 && path[gr+1] === gc) {
          // vertical corridor down
          const midX = ox + Math.floor(roomW/2) - 1;
          for(let rr=oy + roomH - 2; rr < oy + roomH + 2; rr++){
            if(rr >= 0 && rr < this.ROWS){
              map[rr][midX] = this.T.EMPTY;
              map[rr][midX+1] = this.T.EMPTY;
            }
          }
          // Add ladder
          for(let rr=oy+1; rr < oy+roomH-1; rr++){
            if(map[rr][midX] === this.T.EMPTY) map[rr][midX] = this.T.LADDER;
            if(map[rr][midX+1] === this.T.EMPTY) map[rr][midX+1] = this.T.LADDER;
          }
        }

        // Horizontal connections along path
        if (gc > 0 && path[gr] === gc && path[gr] !== gc-1) {
          // Check if left room is also path
        }
        if (isPath && gc < gridCols-1 && path[gr] !== gc && path[gr] === gc+1) {
          // side passage
        }
      }
    }

    // Carve horizontal passages between consecutive path rooms at same level
    for(let gr=0; gr<gridRows; gr++){
      const startGc = Math.min(path[gr], path[gr] || path[gr]);
      // Connect path column to adjacent path columns
      if (gr > 0) {
        const from = path[gr-1];
        const to = path[gr];
        if (from !== to) {
          const minC = Math.min(from, to);
          const maxC = Math.max(from, to);
          const passRow = gr * roomH;
          for(let c = minC * roomW + roomW/2; c <= maxC * roomW + roomW/2; c++){
            if(c >= 0 && c < this.COLS && passRow >= 0 && passRow < this.ROWS){
              map[passRow][Math.floor(c)] = this.T.EMPTY;
              if(passRow+1 < this.ROWS) map[passRow+1][Math.floor(c)] = this.T.EMPTY;
            }
          }
        }
      }
    }

    // Add border walls
    for(let c=0; c<this.COLS; c++){
      map[0][c] = this.T.SOLID;
      map[this.ROWS-1][c] = this.T.SOLID;
    }
    for(let r=0; r<this.ROWS; r++){
      map[r][0] = this.T.SOLID;
      map[r][this.COLS-1] = this.T.SOLID;
    }

    // Scatter gold veins in walls
    const goldCount = 8 + Math.floor(Math.random() * 12);
    for(let i=0; i<goldCount; i++){
      const gc2 = 1 + Math.floor(Math.random()*(this.COLS-2));
      const gr2 = 1 + Math.floor(Math.random()*(this.ROWS-2));
      if(map[gr2][gc2] === this.T.SOLID){
        // Only gold vein if surrounded by solid on at least 3 sides
        let adj = 0;
        if(map[gr2-1][gc2] === this.T.SOLID) adj++;
        if(map[gr2+1][gc2] === this.T.SOLID) adj++;
        if(map[gr2][gc2-1] === this.T.SOLID) adj++;
        if(map[gr2][gc2+1] === this.T.SOLID) adj++;
        if(adj >= 3) map[gr2][gc2] = this.T.GOLD;
      }
    }

    // Add cobwebs in corners of empty areas
    for(let r=1; r<this.ROWS-1; r++){
      for(let c=1; c<this.COLS-1; c++){
        if(map[r][c] === this.T.EMPTY && Math.random() < 0.04){
          if(map[r-1][c] === this.T.SOLID || map[r][c-1] === this.T.SOLID ||
             map[r+1][c] === this.T.SOLID || map[r][c+1] === this.T.SOLID){
            // mark as cobweb (drawn on top but not blocking)
          }
        }
      }
    }

    // Add torches on walls
    const torchPositions = [];
    for(let r=2; r<this.ROWS-2; r++){
      for(let c=2; c<this.COLS-2; c++){
        if(map[r][c] === this.T.SOLID &&
           map[r][c+1] === this.T.EMPTY &&
           map[r-1][c] === this.T.SOLID &&
           map[r+1][c] === this.T.SOLID &&
           Math.random() < 0.015){
          torchPositions.push({r,c});
          map[r][c] = this.T.TORCH;
        }
      }
    }

    // Parse entities from map
    const entities = [];
    let playerStart = {x: this.TILE * 3, y: this.TILE * 3};
    let exitDoor = {x: this.TILE * (this.COLS-4), y: this.TILE * (this.ROWS-4)};

    for(let r=0; r<this.ROWS; r++){
      for(let c=0; c<this.COLS; c++){
        const tile = map[r][c];
        const px = c * this.TILE;
        const py = r * this.TILE;
        if(tile === this.T.ENEMY_SNAKE){
          entities.push({type:'snake', x:px, y:py, facingRight: Math.random()<0.5});
          map[r][c] = this.T.EMPTY;
        } else if(tile === this.T.ENEMY_BAT){
          entities.push({type:'bat', x:px, y:py});
          map[r][c] = this.T.EMPTY;
        } else if(tile === this.T.ENEMY_SPIDER){
          entities.push({type:'spider', x:px, y:py, ropeY:py});
          map[r][c] = this.T.EMPTY;
        } else if(tile === this.T.ENEMY_CAVEMAN){
          entities.push({type:'caveman', x:px, y:py, facingRight:Math.random()<0.5});
          map[r][c] = this.T.EMPTY;
        }
      }
    }

    // Parse start position (look for 'P' in templates which we set to ENTRY)
    outerLoop: for(let r=0; r<this.ROWS; r++){
      for(let c=0; c<this.COLS; c++){
        if(map[r][c] === this.T.ENTRY){
          playerStart = {x: c*this.TILE, y: r*this.TILE};
          map[r][c] = this.T.EMPTY;
          break outerLoop;
        }
      }
    }

    // Parse door
    outerLoop2: for(let r=0; r<this.ROWS; r++){
      for(let c=0; c<this.COLS; c++){
        if(map[r][c] === this.T.DOOR){
          exitDoor = {x: c*this.TILE, y: r*this.TILE};
          break outerLoop2;
        }
      }
    }

    return {map, entities, playerStart, exitDoor, levelNum};
  },

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  _carveRoom(map, template, ox, oy) {
    const charMap = {
      '#': this.T.SOLID,
      '.': this.T.EMPTY,
      'L': this.T.LADDER,
      'S': this.T.SPIKE,
      'G': this.T.GOLD,
      'C': this.T.CHEST,
      'D': this.T.DOOR,
      'T': this.T.TORCH,
      'P': this.T.ENTRY,
      'E': this.T.EMPTY, // enemies placed separately
    };

    const enemyTypes = [
      this.T.ENEMY_SNAKE, this.T.ENEMY_BAT, this.T.ENEMY_SPIDER, this.T.ENEMY_CAVEMAN
    ];

    for(let r=0; r<template.length; r++){
      for(let c=0; c<template[r].length; c++){
        const tr = oy + r;
        const tc = ox + c;
        if(tr < 0 || tr >= this.ROWS || tc < 0 || tc >= this.COLS) continue;
        const ch = template[r][c];
        if(ch === 'E'){
          // Place random enemy
          map[tr][tc] = enemyTypes[Math.floor(Math.random()*4)];
        } else {
          const tileType = charMap[ch];
          if(tileType !== undefined) map[tr][tc] = tileType;
        }
      }
    }
  },

  // Check if tile at grid pos is solid
  isSolid(map, c, r) {
    if(c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) return true;
    const t = map[r][c];
    return t === this.T.SOLID || t === this.T.SPIKE || t === this.T.GOLD || t === this.T.TORCH;
  },

  // Get tile at pixel position
  getTileAt(map, px, py) {
    const c = Math.floor(px / this.TILE);
    const r = Math.floor(py / this.TILE);
    if(c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) return this.T.SOLID;
    return map[r][c];
  },

  getTileCoord(px, py) {
    return {
      c: Math.floor(px / this.TILE),
      r: Math.floor(py / this.TILE)
    };
  },
};
