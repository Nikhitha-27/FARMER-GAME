import { Farmer } from './Farmer.js';
import { AIFarmer } from './AIFarmer.js';
import { Crop, CROP_POINTS } from './Crop.js';
import { Scarecrow } from './Obstacle.js';

const WIDTH = 900, HEIGHT = 540;
const TILE = 30;
const GAME_LEN_DEFAULT = 60;
const GOAL_DEFAULT = 30;

const State = Object.freeze({
  MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER', WIN: 'WIN', LEVEL_UP: 'LEVEL_UP'
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

class Entity {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
  update(_dt, _game) {}
  draw(_ctx) {}
}

class Input {
  constructor(game) {
    this.game = game;
    this.keys = new Set();
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp   = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }
  onKeyDown(e) { if (e.key === 'p' || e.key === 'P') this.game.togglePause(); this.keys.add(e.key); }
  onKeyUp(e) { this.keys.delete(e.key); }
  dispose() { window.removeEventListener('keydown', this._onKeyDown); window.removeEventListener('keyup', this._onKeyUp); }
}

export class Game {
  constructor(canvas) {
    if (!canvas) { console.error('Canvas #game not found.'); return; }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = State.MENU;

    this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
    this.ai = new AIFarmer(WIDTH / 2 - 17, 100);
    this.crops = [];
    this.obstacles = [];

    this.lastTime = 0;
    this.timeLeft = GAME_LEN_DEFAULT;

    this.spawnEvery = 0.9;
    this._accumSpawn = 0;
    this._elapsed = 0;

    this.score = 0;
    this.aiScore = 0;
    this.highScore = Number(localStorage.getItem('farmer_highscore')) || 0;

    this.goal = GOAL_DEFAULT;
    this.levels = [];
    this.levelIndex = 0;
    this.configLoaded = false;

    this.input = new Input(this);
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    const get = id => document.getElementById(id) || null;
    this.ui = {
      score:  get('score'),
      high:   get('highscore'),
      ai:     get('aiscore'),
      time:   get('time'),
      goal:   get('goal'),
      status: get('status'),
      start:  get('btnStart'),
      reset:  get('btnReset'),
      level:  get('level'),
    };
    if (this.ui.start) this.ui.start.addEventListener('click', () => this.start());
    if (this.ui.reset) this.ui.reset.addEventListener('click', () => this.reset());

    this.tick = (ts) => {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.033);
      this.lastTime = ts;
      this.update(dt);
      this.render();
      requestAnimationFrame(this.tick);
    };
  }

  updateBodyState(){
    const b = document.body;
    b.className = b.className.replace(/\b(playing|paused|over|win)\b/g,'').trim();
    if (this.state === State.PLAYING) b.classList.add('playing');
    else if (this.state === State.PAUSED) b.classList.add('paused');
    else if (this.state === State.GAME_OVER) b.classList.add('over');
    else if (this.state === State.WIN) b.classList.add('win');
  }

  async initConfig() {
    try {
      const res = await fetch('./src/levels.json', { cache: 'no-store' });
      const cfg = await res.json();

      this.levels = Array.isArray(cfg.levels) ? cfg.levels : [];
      if (cfg.crops && typeof cfg.crops === 'object') Object.assign(CROP_POINTS, cfg.crops);

      if (!this.levels.length) {
        this.levels = [
          { goal: 30, time: 60, spawnEvery: 0.6,  obstacles: 2, aiSpeed: 280 },
          { goal: 45, time: 55, spawnEvery: 0.3,  obstacles: 3, aiSpeed: 300 },
          { goal: 60, time: 50, spawnEvery: 0.25, obstacles: 4, aiSpeed: 340 }
        ];
      }
      this.configLoaded = true;
      this.applyLevel(0);
      this.syncUI();
    } catch (err) {
      console.warn('Failed to load levels.json; using defaults.', err);
      this.levels = [
        { goal: 30, time: 60, spawnEvery: 0.6,  obstacles: 2, aiSpeed: 320 },
        { goal: 45, time: 55, spawnEvery: 0.4,  obstacles: 3, aiSpeed: 340 },
        { goal: 60, time: 50, spawnEvery: 0.25, obstacles: 4, aiSpeed: 360 }
      ];
      this.configLoaded = true;
      this.applyLevel(0);
      this.syncUI();
    }
  }

  onResize() {}

  applyLevel(idx) {
    this.levelIndex = idx;
    const L = this.levels[idx] || { goal: this.goal, time: this.timeLeft, spawnEvery: this.spawnEvery, obstacles: 2, aiSpeed: this.ai?.speed || 340 };

    this.goal = L.goal ?? this.goal;
    this.timeLeft = L.time ?? this.timeLeft;
    this.spawnEvery = L.spawnEvery ?? this.spawnEvery;

    // apply per-level AI speed (cleaner approach)
    if (this.ai && L.aiSpeed) this.ai.speed = L.aiSpeed;

    this._accumSpawn = 0;
    this._elapsed = 0;

    this.obstacles.length = 0;
    const count = Math.max(0, Math.min(8, L.obstacles ?? 2));
    for (let i = 0; i < count; i++) {
      const x = 120 + i * ((WIDTH - 240) / Math.max(1, count - 1));
      const y = 120 + ((i % 2) ? 40 : -20) + Math.random() * 40;
      this.obstacles.push(new Scarecrow(x, y));
    }

    if (this.ai) { this.ai.x = WIDTH/2 - this.ai.w/2; this.ai.y = 80; }

    if (this.ui.level) this.ui.level.textContent = String(idx + 1);
    if (this.ui.goal)  this.ui.goal.textContent = String(this.goal);
  }

  start() {
    if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
      this.reset();
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = 'Playing…';
      this.syncUI();
      requestAnimationFrame(this.tick);
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = 'Playing…';
      this.syncUI();
    }
  }

  reset() {
    this.state = State.MENU;
    this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
    this.crops.length = 0;
    this.score = 0;
    this.aiScore = 0;
    this.ai = new AIFarmer(WIDTH / 2 - 17, 100);

    if (this.configLoaded) {
      this.applyLevel(0);
    } else {
      this.timeLeft = GAME_LEN_DEFAULT;
      this.spawnEvery = 0.9;
      this._accumSpawn = 0;
      this._elapsed = 0;
      this.obstacles.length = 0;
      this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
      this.goal = GOAL_DEFAULT;
      if (this.ui.level) this.ui.level.textContent = '1';
      if (this.ui.goal)  this.ui.goal.textContent = String(this.goal);
    }

    this.lastTime = performance.now();
    this.syncUI();
    if (this.ui.status) this.ui.status.textContent = 'Menu';
  }

  togglePause() {
    if (this.state === State.PLAYING) {
      this.state = State.PAUSED;
      if (this.ui.status) this.ui.status.textContent = 'Paused';
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = 'Playing…';
    }
    this.syncUI();
  }

  syncUI() {
    if (this.ui.score) this.ui.score.textContent = String(this.score);
    if (this.ui.high)  this.ui.high.textContent = String(this.highScore);
    if (this.ui.ai)    this.ui.ai.textContent = String(this.aiScore);
    if (this.ui.time)  this.ui.time.textContent = Math.ceil(this.timeLeft);
    if (this.ui.goal)  this.ui.goal.textContent = String(this.goal);
    if (this.ui.level) this.ui.level.textContent = String(this.levelIndex + 1);
    this.updateBodyState();
  }

  spawnCrop() {
    const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
    const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
    const types = ['wheat', 'pumpkin', 'goldenApple'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.crops.push(new Crop(gx, gy, type));
  }

  advanceLevel() {
    const next = this.levelIndex + 1;
    if (next < this.levels.length) {
      this.state = State.LEVEL_UP;
      if (this.ui.status) this.ui.status.textContent = `Level ${next + 1}…`;
      this.syncUI();
      setTimeout(() => {
        this.applyLevel(next);
        this.state = State.PLAYING;
        if (this.ui.status) this.ui.status.textContent = 'Playing…';
        this.syncUI();
      }, 1000);
    } else {
      this.state = State.WIN;
      if (this.ui.status) this.ui.status.textContent = 'You cleared all levels! 🎉';
      this.syncUI();
    }
  }

  update(dt) {
    if (this.state !== State.PLAYING) return;

    this.timeLeft = clamp(this.timeLeft - dt, 0, 999);
    if (this.timeLeft <= 0) {
      if (this.score > this.aiScore) {
        this.state = State.WIN;
        if (this.ui.status) this.ui.status.textContent = 'Time! You win on points! 🏆';
      } else if (this.score < this.aiScore) {
        this.state = State.GAME_OVER;
        if (this.ui.status) this.ui.status.textContent = 'Time! AI wins on points.';
      } else {
        this.state = State.GAME_OVER;
        if (this.ui.status) this.ui.status.textContent = 'Time! It’s a tie.';
      }
      this.syncUI();
      return;
    }

    // difficulty curve (spawn speed-up)
    this._elapsed += dt;
    this.spawnEvery = Math.max(0.35, (this.levels[this.levelIndex]?.spawnEvery ?? 0.9) - 0.03 * this._elapsed);

    // OPTIONAL: gradual AI speed-up within the level (capped to +60 over base)
    if (this.ai) {
      const base = this.levels[this.levelIndex]?.aiSpeed || this.ai.speed;
      this.ai.speed = Math.min(base + this._elapsed * 10, base + 60);
    }

    // update actors
    this.player.handleInput(this.input);
    this.player.update(dt, this);
    this.ai.update(dt, this);

    // spawns
    this._accumSpawn += dt;
    while (this._accumSpawn >= this.spawnEvery) {
      this._accumSpawn -= this.spawnEvery;
      this.spawnCrop();
    }

    // collect & score (both player and AI)
    const playerCollected = this.crops.filter(c => aabb(this.player, c));
    const aiCollected     = this.crops.filter(c => aabb(this.ai, c));

    const taken = new Set();
    let pGain = 0, aGain = 0;
    const center = (e) => ({ x: e.x + e.w/2, y: e.y + e.h/2 });

    for (const c of this.crops) {
      const pHit = playerCollected.includes(c);
      const aHit = aiCollected.includes(c);
      if (!pHit && !aHit) continue;

      let owner = null;
      if (pHit && !aHit) owner = 'P';
      else if (!pHit && aHit) owner = 'A';
      else {
        const pc = center(this.player), ac = center(this.ai), cc = center(c);
        const pd2 = (pc.x-cc.x)**2 + (pc.y-cc.y)**2;
        const ad2 = (ac.x-cc.x)**2 + (ac.y-cc.y)**2;
        owner = (pd2 <= ad2) ? 'P' : 'A';
      }

      if (!taken.has(c)) {
        taken.add(c);
        const pts = (CROP_POINTS[c.type] || 1);
        if (owner === 'P') pGain += pts; else aGain += pts;
        c.dead = true;
      }
    }

    if (pGain) {
      this.score += pGain;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('farmer_highscore', String(this.highScore));
      }
    }
    if (aGain) this.aiScore += aGain;

    if (this.score >= this.goal) {
      this.advanceLevel();
    } else if (this.aiScore >= this.goal) {
      this.state = State.GAME_OVER;
      if (this.ui.status) this.ui.status.textContent = 'AI beat you to the harvest! 😅';
      this.syncUI();
    }

    this.crops = this.crops.filter(c => !c.dead);
    this.crops.forEach(c => c.update(dt, this));
    this.syncUI();
  }

  render() {
    const ctx = this.ctx; if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#dff0d5';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#c7e0bd';
    ctx.lineWidth = 1;
    for (let y = TILE; y < HEIGHT; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }
    for (let x = TILE; x < WIDTH; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }

    this.crops.forEach(c => c.draw(ctx));
    this.obstacles.forEach(o => o.draw(ctx));
    this.ai.draw(ctx);
    this.player.draw(ctx);

    ctx.fillStyle = '#333';
    ctx.font = '16px system-ui, sans-serif';
    if (this.state === State.MENU) ctx.fillText('Press Start to play', 20, 28);
    else if (this.state === State.PAUSED) ctx.fillText('Paused (press P to resume)', 20, 28);
    else if (this.state === State.GAME_OVER) ctx.fillText('Time up or AI won! Press Reset', 20, 28);
    else if (this.state === State.WIN) ctx.fillText('All levels cleared! Press Reset for another run', 20, 28);
    else if (this.state === State.LEVEL_UP) ctx.fillText(`Level ${this.levelIndex} → ${this.levelIndex + 1}`, 20, 28);
  }

  dispose() {
    this.input.dispose();
    window.removeEventListener('resize', this._onResize);
  }
}

export { State };
