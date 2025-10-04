export const CROP_POINTS = { wheat: 1, pumpkin: 3, goldenApple: 5 };
export const CROP_COLORS = { wheat: '#d9a441', pumpkin: '#ff8c00', goldenApple: '#ffd700' };

class Entity {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
  update(dt, game) {}
  draw(ctx) {}
}

export class Crop extends Entity {
  constructor(x, y, type = 'wheat') {
    super(x, y, 20, 26);
    this.type = type;
    this.sway = Math.random() * Math.PI * 2;
  }
  update(dt) { this.sway += dt * 2; }
  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.strokeStyle = '#2f7d32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h);
    ctx.quadraticCurveTo(x + w / 2 + Math.sin(this.sway) * 3, y + h / 2, x + w / 2, y);
    ctx.stroke();

    ctx.fillStyle = CROP_COLORS[this.type] || '#d9a441';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
