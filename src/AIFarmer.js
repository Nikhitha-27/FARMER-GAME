import { Farmer } from './Farmer.js';

/** AI-controlled farmer that chases the nearest crop. */
export class AIFarmer extends Farmer {
  constructor(x, y) {
    super(x, y);
    this.speed = 360; // was 240 — quicker base; still fair vs player 260
    this.isAI = true;
  }

  update(dt, game) {
    // find nearest crop center
    if (game.crops.length) {
      let best = null, bestD2 = Infinity;
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      for (const c of game.crops) {
        const tx = c.x + c.w / 2, ty = c.y + c.h / 2;
        const dx = tx - cx, dy = ty - cy;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; best = { dx, dy }; }
      }
      if (best) {
        const len = Math.hypot(best.dx, best.dy) || 1;
        const ux = best.dx / len, uy = best.dy / len;
        this.vx = ux * this.speed;
        this.vy = uy * this.speed;

        if (Math.abs(this.vx) >= Math.abs(this.vy)) this.facing = (this.vx > 0) ? 'right' : 'left';
        else this.facing = (this.vy > 0) ? 'down' : 'up';
      }
    } else {
      this.vx = this.vy = 0;
    }

    super.update(dt, game);
  }

  draw(ctx) {
    super.draw(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(this.x + this.w/2 - 10, this.y - 24, 20, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI', this.x + this.w/2, this.y - 18);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
}
