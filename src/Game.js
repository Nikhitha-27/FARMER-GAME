import { Farmer } from './Farmer.js';
import { AIFarmer } from './AIFarmer.js';
import { Crop, CROP_POINTS } from './Crop.js';
import { Scarecrow } from './Obstacle.js';

const WIDTH = 900, HEIGHT = 540;
const TILE = 30;
const GAME_LEN_DEFAULT = 60;
const GOAL_DEFAULT = 15;

const State = Object.freeze({
  MENU:'MENU', PLAYING:'PLAYING', PAUSED:'PAUSED',
  GAME_OVER:'GAME_OVER', WIN:'WIN', LEVEL_UP:'LEVEL_UP'
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb  = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

class Input {
  constructor(game){
    this.game = game; this.keys = new Set();
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp   = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }
  onKeyDown(e){ if (e.key==='p'||e.key==='P') this.game.togglePause(); this.keys.add(e.key); }
  onKeyUp(e){ this.keys.delete(e.key); }
  dispose(){ window.removeEventListener('keydown',this._onKeyDown); window.removeEventListener('keyup',this._onKeyUp); }
}

export class Game {
  constructor(canvas){
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.state = State.MENU;

    // world
    this.player = new Farmer(WIDTH/2 - 17, HEIGHT - 80);
    this.ai     = new AIFarmer(WIDTH/2 - 17, 100);
    this.crops = []; this.obstacles = [];

    // timing
    this.lastTime = 0; this.timeLeft = GAME_LEN_DEFAULT;

    // spawn difficulty (Q2)
    this.spawnEvery = 0.9; this._accumSpawn = 0; this._elapsed = 0;

    // growth (time-based)
    this.growthEvery  = 10; // seconds
    this.growthAmount = 2;  // px
    this._growthTimer = 0;

    // scores
    this.score = 0; this.aiScore = 0;
    this.highScore = Number(localStorage.getItem('farmer_highscore')) || 0;

    // levels (G1/G3)
    this.goal = GOAL_DEFAULT; this.levels = []; this.levelIndex = 0; this.configLoaded = false;

    // input & UI
    this.input = new Input(this);
    const $ = (id) => document.getElementById(id);
    this.ui = { score:$('score'), high:$('highscore'), ai:$('aiscore'), time:$('time'),
                goal:$('goal'), status:$('status'), start:$('btnStart'), reset:$('btnReset'), level:$('level') };
    this.ui.start?.addEventListener('click', () => this.start());
    this.ui.reset?.addEventListener('click', () => this.reset());

    // RAF with arrow to preserve this
    this.tick = (ts) => {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.033);
      this.lastTime = ts; this.update(dt); this.render(); requestAnimationFrame(this.tick);
    };
  }

  async initConfig(){
    try {
      // NOTE: levels.json at PROJECT ROOT
      const res = await fetch('./levels.json', { cache:'no-store' });
      const cfg = await res.json();
      this.levels = Array.isArray(cfg.levels) ? cfg.levels : [];
      if (cfg.crops && typeof cfg.crops === 'object') Object.assign(CROP_POINTS, cfg.crops);
      if (!this.levels.length) {
        this.levels = [
          { goal:15, time:60, spawnEvery:0.9,  obstacles:2, aiSpeed:200, growthEvery:10, growthAmount:2 },
          { goal:30, time:55, spawnEvery:0.7,  obstacles:3, aiSpeed:210, growthEvery:9,  growthAmount:2 },
          { goal:45, time:50, spawnEvery:0.55, obstacles:4, aiSpeed:220, growthEvery:8,  growthAmount:2 }
        ];
      }
      this.applyLevel(0);
      this.configLoaded = true;
      this.syncUI();
    } catch {
      console.warn('levels.json not loaded; using defaults');
      this.levels = [
        { goal:15, time:60, spawnEvery:0.9,  obstacles:2, aiSpeed:200, growthEvery:10, growthAmount:2 },
        { goal:30, time:55, spawnEvery:0.7,  obstacles:3, aiSpeed:210, growthEvery:9,  growthAmount:2 },
        { goal:45, time:50, spawnEvery:0.55, obstacles:4, aiSpeed:220, growthEvery:8,  growthAmount:2 }
      ];
      this.applyLevel(0); this.configLoaded = true; this.syncUI();
    }
  }

  applyLevel(idx){
    this.levelIndex = idx;
    const L = this.levels[idx] || {};
    this.goal = L.goal ?? this.goal;
    this.timeLeft = L.time ?? this.timeLeft;
    this.spawnEvery = L.spawnEvery ?? this.spawnEvery;

    // growth & AI speed from JSON if provided
    this.growthEvery  = (L.growthEvery  ?? this.growthEvery);
    this.growthAmount = (L.growthAmount ?? this.growthAmount);
    if (this.ai && L.aiSpeed) this.ai.speed = L.aiSpeed;

    this._accumSpawn = 0; this._elapsed = 0; this._growthTimer = 0;

    // obstacles
    this.obstacles.length = 0;
    const count = Math.max(0, Math.min(8, L.obstacles ?? 2));
    for (let i=0;i<count;i++){
      const x = 120 + i * ((WIDTH - 240) / Math.max(1, count - 1));
      const y = 120 + ((i % 2) ? 40 : -20) + Math.random() * 40;
      this.obstacles.push(new Scarecrow(x, y));
    }

    if (this.ai) { this.ai.x = WIDTH/2 - this.ai.w/2; this.ai.y = 80; }
    this.ui.level && (this.ui.level.textContent = String(idx + 1));
    this.ui.goal  && (this.ui.goal.textContent  = String(this.goal));
  }

  start(){
    if (this.state===State.MENU || this.state===State.GAME_OVER || this.state===State.WIN){
      this.reset(); this.state = State.PLAYING; this.ui.status && (this.ui.status.textContent = 'Playing…');
      requestAnimationFrame(this.tick);
    } else if (this.state===State.PAUSED){
      this.state = State.PLAYING; this.ui.status && (this.ui.status.textContent = 'Playing…');
    }
  }

  reset(){
    this.state = State.MENU;
    this.player = new Farmer(WIDTH/2 - 17, HEIGHT - 80);
    this.ai     = new AIFarmer(WIDTH/2 - 17, 100);
    this.crops.length = 0; this.score = 0; this.aiScore = 0;

    if (this.levels.length) this.applyLevel(0);
    else {
      this.timeLeft = GAME_LEN_DEFAULT; this.spawnEvery = 0.9;
      this._accumSpawn = 0; this._elapsed = 0; this._growthTimer = 0;
      this.obstacles.length = 0; this.obstacles.push(new Scarecrow(200,220), new Scarecrow(650,160));
      this.goal = GOAL_DEFAULT; this.ui.level && (this.ui.level.textContent = '1'); this.ui.goal && (this.ui.goal.textContent = String(this.goal));
    }

    this.lastTime = performance.now(); this.syncUI();
    this.ui.status && (this.ui.status.textContent = 'Menu');
  }

  togglePause(){
    if (this.state===State.PLAYING){ this.state = State.PAUSED; this.ui.status && (this.ui.status.textContent = 'Paused'); }
    else if (this.state===State.PAUSED){ this.state = State.PLAYING; this.ui.status && (this.ui.status.textContent = 'Playing…'); }
  }

  syncUI(){
    this.ui.score && (this.ui.score.textContent = String(this.score));
    this.ui.ai    && (this.ui.ai.textContent    = String(this.aiScore));
    this.ui.high  && (this.ui.high.textContent  = String(this.highScore));
    this.ui.time  && (this.ui.time.textContent  = Math.ceil(this.timeLeft));
    this.ui.goal  && (this.ui.goal.textContent  = String(this.goal));
    this.ui.level && (this.ui.level.textContent = String(this.levelIndex + 1));
  }

  spawnCrop(){
    const gx = Math.floor(Math.random() * ((WIDTH - 2*TILE) / TILE)) * TILE + TILE;
    const gy = Math.floor(Math.random() * ((HEIGHT - 2*TILE) / TILE)) * TILE + TILE;
    const types = ['wheat','pumpkin','goldenApple'];
    const type = types[Math.floor(Math.random()*types.length)];
    this.crops.push(new Crop(gx, gy, type));
  }

  advanceLevel(){
    const next = this.levelIndex + 1;
    if (next < this.levels.length){
      this.state = State.LEVEL_UP; this.ui.status && (this.ui.status.textContent = `Level ${next + 1}…`);
      setTimeout(() => { this.applyLevel(next); this.state = State.PLAYING; this.ui.status && (this.ui.status.textContent = 'Playing…'); }, 900);
    } else {
      this.state = State.WIN; this.ui.status && (this.ui.status.textContent = 'You cleared all levels! 🎉');
    }
  }

  update(dt){
    if (this.state !== State.PLAYING) return;

    // timer
    this.timeLeft = clamp(this.timeLeft - dt, 0, 999);
    if (this.timeLeft <= 0){
      if (this.score > this.aiScore){ this.state = State.WIN; this.ui.status && (this.ui.status.textContent = 'Time! You win on points! 🏆'); }
      else if (this.score < this.aiScore){ this.state = State.GAME_OVER; this.ui.status && (this.ui.status.textContent = 'Time! AI wins on points.'); }
      else { this.state = State.GAME_OVER; this.ui.status && (this.ui.status.textContent = 'Time! It’s a tie.'); }
      this.syncUI(); return;
    }

    // difficulty curve (spawns speed up slowly)
    this._elapsed += dt;
    this.spawnEvery = Math.max(0.35, (this.levels[this.levelIndex]?.spawnEvery ?? 0.9) - 0.03 * this._elapsed);

    // movement
    this.player.handleInput(this.input);
    this.player.update(dt, this);
    this.ai.update(dt, this);

    // spawn crops
    this._accumSpawn += dt;
    while (this._accumSpawn >= this.spawnEvery){
      this._accumSpawn -= this.spawnEvery;
      this.spawnCrop();
    }

    // time-based growth
    this._growthTimer += dt;
    while (this._growthTimer >= this.growthEvery){
      this._growthTimer -= this.growthEvery;
      this.player.growBy(this.growthAmount);
      if (this.ai && typeof this.ai.growBy === 'function'){
        this.ai.growBy(Math.max(1, Math.floor(this.growthAmount * 0.8))); // AI grows slightly less
      }
    }

    // collect & scoring
    const playerHit = this.crops.filter(c => aabb(this.player, c));
    const aiHit     = this.crops.filter(c => aabb(this.ai, c));
    const taken = new Set(); let pGain = 0, aGain = 0;

    const center = (e) => ({ x:e.x + e.w/2, y:e.y + e.h/2 });
    for (const c of this.crops){
      const p = playerHit.includes(c), a = aiHit.includes(c);
      if (!p && !a) continue;
      let owner = 'P';
      if (p && a){
        const pc=center(this.player), ac=center(this.ai), cc=center(c);
        const pd2=(pc.x-cc.x)**2+(pc.y-cc.y)**2, ad2=(ac.x-cc.x)**2+(ac.y-cc.y)**2;
        owner = (pd2 <= ad2) ? 'P' : 'A';
      } else if (a) owner = 'A';

      if (!taken.has(c)){
        taken.add(c); c.dead = true;
        const pts = (CROP_POINTS[c.type] || 1);
        if (owner==='P') pGain += pts; else aGain += pts;
      }
    }

    if (pGain){
      this.score += pGain;
      if (this.score > this.highScore){
        this.highScore = this.score; localStorage.setItem('farmer_highscore', String(this.highScore));
      }
    }
    if (aGain) this.aiScore += aGain;

    if (this.score >= this.goal) this.advanceLevel();
    else if (this.aiScore >= this.goal){ this.state = State.GAME_OVER; this.ui.status && (this.ui.status.textContent = 'AI beat you to the harvest! 😅'); }

    this.crops = this.crops.filter(c => !c.dead);
    this.crops.forEach(c => c.update(dt, this));
    this.syncUI();
  }

  render(){
    const ctx = this.ctx; if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // background grid
    ctx.fillStyle = '#dff0d5'; ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle = '#c7e0bd'; ctx.lineWidth = 1;
    for (let y = TILE; y < HEIGHT; y += TILE){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WIDTH,y); ctx.stroke(); }
    for (let x = TILE; x < WIDTH; x += TILE){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,HEIGHT); ctx.stroke(); }

    this.crops.forEach(c => c.draw(ctx));
    this.obstacles.forEach(o => o.draw(ctx));
    this.ai.draw(ctx);
    this.player.draw(ctx);

    ctx.fillStyle = '#333'; ctx.font = '16px system-ui, sans-serif';
    if (this.state===State.MENU) ctx.fillText('Press Start to play', 20, 28);
    else if (this.state===State.PAUSED) ctx.fillText('Paused (press P to resume)', 20, 28);
    else if (this.state===State.GAME_OVER) ctx.fillText('Time up or AI won — press Reset', 20, 28);
    else if (this.state===State.WIN) ctx.fillText('You win! Press Reset for another run', 20, 28);
    else if (this.state===State.LEVEL_UP) ctx.fillText(`Level ${this.levelIndex} → ${this.levelIndex + 1}`, 20, 28);
  }
}
