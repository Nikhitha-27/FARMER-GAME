class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) {}
    draw(ctx) {}
  }
  
  export class Scarecrow extends Entity {
    constructor(x, y) { super(x, y, 26, 46); }
    draw(ctx) {
      const { x, y, w, h } = this;
      ctx.fillStyle = '#9b7653';
      ctx.fillRect(x + w / 2 - 3, y, 6, h);
      ctx.fillStyle = '#c28e0e';
      ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke();
    }
  }
  