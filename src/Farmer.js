/** Lightweight base entity */
class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) {}
    draw(ctx) {}
  }
  
  /**
   * Player-controlled farmer with sprite animation + size growth over time.
   * Sprite sheet layout (4×4): rows = down,left,right,up; cols = walk frames.
   */
  export class Farmer extends Entity {
    constructor(x, y) {
      super(x, y, 34, 34);
  
      // movement
      this.speed = 260;
      this.vx = 0; this.vy = 0;
  
      // growth
      this.baseW = this.w; this.baseH = this.h;
      this.maxScale = 1.6;   // max 160%
      this.minSpeed = 200;   // don't go below
  
      // sprite
      this.sprite = new Image();
      this.spriteLoaded = false;
      this.sprite.src = './src/sprites/farmer.png';
      this.sprite.onload = () => { this.spriteLoaded = true; this._computeFrameSize(); };
  
      // animation
      this.facing = 'down'; this.moving = false;
      this.frameIndex = 0; this.frameTimer = 0; this.frameInterval = 0.12;
  
      // frame grid
      this.cols = 4; this.rows = 4;
      this.frameW = 32; this.frameH = 32;
    }
  
    _computeFrameSize() {
      this.frameW = Math.floor(this.sprite.width / this.cols);
      this.frameH = Math.floor(this.sprite.height / this.rows);
    }
  
    growBy(px) {
      const maxW = Math.floor(this.baseW * this.maxScale);
      const maxH = Math.floor(this.baseH * this.maxScale);
      this.w = Math.min(maxW, this.w + px);
      this.h = Math.min(maxH, this.h + px);
      const scale = this.w / this.baseW;
      this.speed = Math.max(this.minSpeed, 260 - (scale - 1) * 80); // gentle slowdown
    }
  
    handleInput(input) {
      const L = input.keys.has('ArrowLeft'), R = input.keys.has('ArrowRight');
      const U = input.keys.has('ArrowUp'),   D = input.keys.has('ArrowDown');
      this.vx = (R - L) * this.speed;
      this.vy = (D - U) * this.speed;
  
      if (this.vx !== 0 || this.vy !== 0) {
        if (Math.abs(this.vx) >= Math.abs(this.vy)) this.facing = (this.vx > 0) ? 'right' : 'left';
        else this.facing = (this.vy > 0) ? 'down' : 'up';
      }
    }
  
    update(dt, game) {
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
      const aabb  = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  
      const W = game.canvas.width, H = game.canvas.height;
  
      // --- move X, then resolve against obstacles ---
      const oldX = this.x;
      this.x = clamp(this.x + this.vx * dt, 0, W - this.w);
      if (game.obstacles.some(o => aabb(this, o))) {
        this.x = oldX;                 // undo X move if collision
        this.vx = 0;
      }
  
      // --- move Y, then resolve against obstacles ---
      const oldY = this.y;
      this.y = clamp(this.y + this.vy * dt, 0, H - this.h);
      if (game.obstacles.some(o => aabb(this, o))) {
        this.y = oldY;                 // undo Y move if collision
        this.vy = 0;
      }
  
      this.moving = (this.vx !== 0 || this.vy !== 0);
  
      // animation frames
      if (this.spriteLoaded && this.moving) {
        this.frameTimer += dt;
        while (this.frameTimer >= this.frameInterval) {
          this.frameTimer -= this.frameInterval;
          this.frameIndex = (this.frameIndex + 1) % this.cols;
        }
      } else {
        this.frameIndex = 0; this.frameTimer = 0;
      }
    }
  
    draw(ctx) {
      if (this.spriteLoaded) {
        const row = (this.facing === 'down') ? 0 :
                    (this.facing === 'left') ? 1 :
                    (this.facing === 'right') ? 2 : 3;
        const sx = this.frameIndex * this.frameW;
        const sy = row * this.frameH;
  
        // draw slightly scaled for nicer look
        const scale = 1.2;
        const dw = Math.floor(this.w * scale), dh = Math.floor(this.h * scale);
        const dx = Math.floor(this.x + (this.w - dw) / 2);
        const dy = Math.floor(this.y + (this.h - dh) / 2);
  
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.sprite, sx, sy, this.frameW, this.frameH, dx, dy, dw, dh);
      } else {
        // fallback blocky farmer
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#c28e0e'; ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);
      }
    }
  }
  