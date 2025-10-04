import { Farmer } from './Farmer.js';

/**
 * AI farmer: chase nearest crop with light smoothing and basic avoidance.
 */
export class AIFarmer extends Farmer {
  constructor(x, y) {
    super(x, y);
    this.speed = 200;       // slower than player
    this.isAI = true;

    // smoothing / avoidance
    this.reactionEvery = 0.25;  // seconds between target updates
    this._reactTimer = 0;

    this._lastX = x;
    this._lastY = y;
    this._stuckTime = 0;        // time spent not moving while intending to
    this._avoidTimer = 0;       // time to keep sidestepping
    this._avoidDir = 0;         // -1 or +1 for perpendicular step
  }

  update(dt, game) {
    // Decide direction less frequently to reduce jitter.
    this._reactTimer -= dt;
    this._avoidTimer = Math.max(0, this._avoidTimer - dt);

    if (this._reactTimer <= 0) {
      this._reactTimer = this.reactionEvery;

      if (this._avoidTimer > 0) {
        // keep sidestepping perpendicular to current facing
        // convert facing to a vector
        let fx = 0, fy = 1; // default down
        if (this.facing === 'left') { fx = -1; fy = 0; }
        else if (this.facing === 'right') { fx = 1; fy = 0; }
        else if (this.facing === 'up') { fx = 0; fy = -1; }

        // perpendicular (rotate by 90°)
        const px = -fy * this._avoidDir;
        const py =  fx * this._avoidDir;
        this.vx = px * this.speed;
        this.vy = py * this.speed;
      } else {
        // normal chase behavior
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
      }
    }

    // Remember where we were before moving
    const px = this.x, py = this.y;

    // Do movement/collision/animation via Farmer
    super.update(dt, game);

    // Detect "stuck": tried to move (vx/vy non-zero) but position barely changed
    const movedDist = Math.hypot(this.x - px, this.y - py);
    const tryingToMove = (Math.abs(this.vx) + Math.abs(this.vy)) > 0.1;

    if (tryingToMove && movedDist < 0.5) {
      this._stuckTime += dt;
      if (this._stuckTime > 0.25 && this._avoidTimer <= 0) {
        // Start a short sidestep
        this._avoidTimer = 0.35;
        this._stuckTime = 0;
        this._avoidDir = Math.random() < 0.5 ? -1 : 1;
      }
    } else {
      this._stuckTime = 0;
    }
  }

  draw(ctx) {
    super.draw(ctx);
    // tiny AI badge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(this.x + this.w/2 - 10, this.y - 24, 20, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('AI', this.x + this.w/2, this.y - 18);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }
}
