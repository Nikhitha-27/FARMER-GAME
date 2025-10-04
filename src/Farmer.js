class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) {}
    draw(ctx) {}
  }
  
  export class Farmer extends Entity {
    constructor(x, y) {
      super(x, y, 34, 34);
      this.speed = 240;           // player speed
      this.vx = 0; this.vy = 0;
  
      this.sprite = new Image();
      this.spriteLoaded = false;
      this.sprite.src = './sprites/farmer.png';
      this.sprite.onload = () => { this.spriteLoaded = true; this._computeFrameSize(); };
  
      this.facing = 'down';
      this.moving = false;
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.frameInterval = 0.12;
  
      this.cols = 4; this.rows = 4;
      this.frameW = 32; this.frameH = 32;
    }
  
    _computeFrameSize() {
      this.frameW = Math.floor(this.sprite.width / this.cols);
      this.frameH = Math.floor(this.sprite.height / this.rows);
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
  
      const oldX = this.x, oldY = this.y;
      const W = game.canvas.width, H = game.canvas.height;
  
      this.x = clamp(this.x + this.vx * dt, 0, W - this.w);
      this.y = clamp(this.y + this.vy * dt, 0, H - this.h);
  
      const hitObs = game.obstacles.some(o => aabb(this, o));
      if (hitObs) { this.x = oldX; this.y = oldY; }
  
      this.moving = (this.vx !== 0 || this.vy !== 0);
  
      if (this.spriteLoaded && this.moving) {
        this.frameTimer += dt;
        while (this.frameTimer >= this.frameInterval) {
          this.frameTimer -= this.frameInterval;
          this.frameIndex = (this.frameIndex + 1) % this.cols;
        }
      } else if (!this.moving) {
        this.frameIndex = 0;
        this.frameTimer = 0;
      }
    }
  
    draw(ctx) {
      if (this.spriteLoaded) {
        const row = (this.facing === 'down') ? 0 : (this.facing === 'left') ? 1 : (this.facing === 'right') ? 2 : 3;
        const sx = this.frameIndex * this.frameW;
        const sy = row * this.frameH;
  
        const scale = 1.2;
        const dw = Math.floor(this.w * scale);
        const dh = Math.floor(this.h * scale);
        const dx = Math.floor(this.x + (this.w - dw) / 2);
        const dy = Math.floor(this.y + (this.h - dh) / 2);
  
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.sprite, sx, sy, this.frameW, this.frameH, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#c28e0e';
        ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);
      }
    }
  }
  