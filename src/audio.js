// ============================================================
// AUDIO.JS - Web Audio API sound generation
// All sounds procedurally generated to match Spelunky 1
// ============================================================

const Audio = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  currentMusic: null,
  musicNodes: [],
  muted: false,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);
    } catch(e) {
      console.warn('Web Audio not available');
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Generic oscillator helper
  playTone(freq, type, duration, gainVal, delay=0, freqEnd=null, detune=0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(detune, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  },

  // ---- SFX ----
  playJump() {
    this.playTone(180, 'square', 0.12, 0.3, 0, 320);
    this.playTone(90, 'triangle', 0.08, 0.15, 0, 140);
  },

  playLand() {
    this.playTone(80, 'square', 0.08, 0.4, 0, 40);
    this.playNoise(0.06, 0.3, 0);
  },

  playWhip() {
    // Swoosh sound
    this.playNoise(0.15, 0.6, 0);
    this.playTone(440, 'sawtooth', 0.08, 0.15, 0, 200);
  },

  playHit() {
    this.playTone(150, 'square', 0.1, 0.5, 0, 60);
    this.playNoise(0.1, 0.8, 0);
  },

  playDeath() {
    this.playTone(440, 'sawtooth', 0.1, 0.4, 0, 80);
    this.playTone(300, 'sawtooth', 0.15, 0.4, 0.05, 60);
    this.playTone(200, 'sawtooth', 0.2, 0.4, 0.1, 40);
    this.playNoise(0.3, 0.6, 0);
  },

  playBomb() {
    // Big boom
    this.playTone(60, 'sawtooth', 0.4, 0.8, 0, 20);
    this.playTone(120, 'square', 0.3, 0.6, 0, 30);
    this.playNoise(0.5, 1.0, 0);
    this.playNoise(0.3, 0.7, 0.1);
  },

  playPickup() {
    this.playTone(440, 'triangle', 0.08, 0.3, 0);
    this.playTone(660, 'triangle', 0.08, 0.3, 0.06);
    this.playTone(880, 'triangle', 0.1, 0.3, 0.12);
  },

  playGemPickup() {
    this.playTone(880, 'triangle', 0.06, 0.35, 0);
    this.playTone(1100, 'triangle', 0.06, 0.35, 0.05);
    this.playTone(1320, 'sine', 0.1, 0.3, 0.1);
  },

  playRopeThrow() {
    this.playTone(300, 'square', 0.05, 0.2, 0, 500);
    this.playNoise(0.08, 0.25, 0);
  },

  playChestOpen() {
    this.playTone(330, 'triangle', 0.08, 0.3, 0);
    this.playTone(440, 'triangle', 0.08, 0.3, 0.05);
    this.playTone(550, 'triangle', 0.08, 0.3, 0.1);
    this.playTone(660, 'triangle', 0.1, 0.3, 0.15);
  },

  playLevelComplete() {
    const melody = [523,659,784,1047];
    melody.forEach((f,i) => {
      this.playTone(f, 'triangle', 0.15, 0.4, i*0.12);
    });
  },

  playEnemyHit() {
    this.playTone(200, 'square', 0.08, 0.4, 0, 100);
    this.playNoise(0.05, 0.5, 0);
  },

  playStep() {
    if (Math.random() < 0.5) return;
    this.playNoise(0.03, 0.2, 0);
    this.playTone(60, 'triangle', 0.03, 0.15, 0, 50);
  },

  playDoor() {
    this.playTone(220, 'sine', 0.2, 0.3, 0, 440);
    this.playTone(330, 'triangle', 0.2, 0.2, 0.1, 660);
  },

  // White noise generator
  playNoise(duration, gainVal, delay=0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++) data[i] = (Math.random()*2-1);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    // Low pass for thud sounds
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
  },

  // ---- CAVE MUSIC - Procedurally generated Spelunky-style cave theme ----
  stopMusic() {
    this.musicNodes.forEach(n => {
      try { n.stop(); n.disconnect(); } catch(e){}
    });
    this.musicNodes = [];
  },

  playMusic(theme = 'caves') {
    if (!this.ctx || this.muted) return;
    this.stopMusic();

    if (theme === 'caves') {
      this._playCavesTheme();
    }
  },

  _playCavesTheme() {
    // Spelunky caves theme - a bouncy, adventurous tune
    // Using a repeating pattern similar to the original
    const bpm = 140;
    const beat = 60 / bpm;
    const startTime = this.ctx.currentTime + 0.1;

    // Cave music note sequence (Spelunky-inspired)
    const melody = [
      // Bar 1
      {n: 'E4', d: 0.5}, {n: 'E4', d: 0.25}, {n: 'G4', d: 0.25},
      {n: 'A4', d: 0.5}, {n: 'A4', d: 0.5},
      // Bar 2
      {n: 'G4', d: 0.25}, {n: 'F4', d: 0.25}, {n: 'E4', d: 0.5},
      {n: 'D4', d: 0.5}, {n: 'C4', d: 0.5},
      // Bar 3
      {n: 'E4', d: 0.5}, {n: 'G4', d: 0.25}, {n: 'A4', d: 0.25},
      {n: 'B4', d: 0.5}, {n: 'A4', d: 0.5},
      // Bar 4
      {n: 'G4', d: 0.25}, {n: 'F4', d: 0.25}, {n: 'E4', d: 0.25},
      {n: 'D4', d: 0.25}, {n: 'C4', d: 1.0},
      // Bar 5
      {n: 'C4', d: 0.25}, {n: 'D4', d: 0.25}, {n: 'E4', d: 0.5},
      {n: 'G4', d: 0.5}, {n: 'A4', d: 0.5},
      // Bar 6
      {n: 'G4', d: 0.5}, {n: 'E4', d: 0.5},
      {n: 'D4', d: 0.5}, {n: 'C4', d: 0.5},
      // Bar 7
      {n: 'G4', d: 0.25}, {n: 'A4', d: 0.25}, {n: 'B4', d: 0.5},
      {n: 'C5', d: 0.5}, {n: 'B4', d: 0.5},
      // Bar 8
      {n: 'A4', d: 0.25}, {n: 'G4', d: 0.25}, {n: 'F4', d: 0.5},
      {n: 'E4', d: 1.0},
    ];

    const noteFreqs = {
      'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,
      'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
      'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
    };

    const bassPattern = [
      {n:'C3',d:0.5},{n:'G3',d:0.5},{n:'A3',d:0.5},{n:'E3',d:0.5},
      {n:'F3',d:0.5},{n:'C3',d:0.5},{n:'G3',d:1.0},
      {n:'C3',d:0.5},{n:'G3',d:0.5},{n:'F3',d:0.5},{n:'E3',d:0.5},
      {n:'D3',d:0.5},{n:'G3',d:0.5},{n:'C3',d:1.0},
    ];

    const playSequence = (notes, type, gainVal, loop = true) => {
      let time = startTime;
      const allOscs = [];

      const playLoop = (startT) => {
        let t = startT;
        notes.forEach(note => {
          const freq = noteFreqs[note.n];
          if (!freq) { t += note.d * beat; return; }
          const osc = this.ctx.createOscillator();
          const env = this.ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(gainVal, t + 0.01);
          env.gain.setValueAtTime(gainVal, t + note.d * beat - 0.05);
          env.gain.exponentialRampToValueAtTime(0.001, t + note.d * beat);
          osc.connect(env);
          env.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + note.d * beat + 0.01);
          allOscs.push(osc);
          t += note.d * beat;
        });
        return t;
      };

      // Play 4 loops
      let nextStart = startTime;
      for(let i=0;i<4;i++) {
        nextStart = playLoop(nextStart);
      }
      allOscs.forEach(o => this.musicNodes.push(o));
    };

    playSequence(melody, 'square', 0.08);
    // Harmony
    setTimeout(() => {
      if (this.ctx.state !== 'closed') {
        playSequence(melody.map(n => {
          const noteUp = {
            'E4':'G4','G4':'B4','A4':'C5','F4':'A4',
            'D4':'F4','C4':'E4','B4':'D5','C5':'E5',
          };
          return {...n, n: noteUp[n.n] || n.n};
        }), 'triangle', 0.04);
      }
    }, 100);
    playSequence(bassPattern, 'sawtooth', 0.06);

    // Percussion - kick and hihat
    const kickPattern  = [0, 2, 4, 6, 8, 10, 12, 14];
    const hihatPattern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const snarePattern = [2, 6, 10, 14];

    const playDrums = (startT) => {
      for (let bar=0; bar<16; bar++) {
        kickPattern.forEach(beat16 => {
          const t = startT + bar * beat * 16 / 4; // simplify
          // kick
          const kickT = startT + beat * 0.5 * Math.floor(bar*2);
          if(bar % 2 === 0){
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t2 = startT + bar * beat * 4;
            osc.frequency.setValueAtTime(80, t2);
            osc.frequency.exponentialRampToValueAtTime(30, t2+0.1);
            gain.gain.setValueAtTime(0.3, t2);
            gain.gain.exponentialRampToValueAtTime(0.001, t2+0.15);
            osc.connect(gain); gain.connect(this.musicGain);
            osc.start(t2); osc.stop(t2+0.2);
            this.musicNodes.push(osc);
          }
        });
      }
    };
    // Simple ticking hihat using noise bursts
    for(let b=0; b<64; b++){
      const t = startTime + b * beat * 0.5;
      const bufSize = Math.ceil(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<bufSize; i++) data[i] = (Math.random()*2-1);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      const hiFreq = this.ctx.createBiquadFilter();
      hiFreq.type = 'highpass'; hiFreq.frequency.value = 8000;
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t+0.03);
      src.connect(hiFreq); hiFreq.connect(gain); gain.connect(this.musicGain);
      src.start(t);
      this.musicNodes.push(src);
    }
  },
};
