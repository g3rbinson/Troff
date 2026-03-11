import { ARENA, FOOT_SPEED, MAX_HP, PLAYER_CLR } from '../constants.js';
import { clamp, dist } from '../utils.js';
import { keys, mouse, consumeClick } from '../input.js';
import { state } from '../state.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.onBike = true;
        this.bike = null;
        this.alive = true;
        this.invuln = 0;
        this._ePrev = false;
        this._fPrev = false;
    }

    update() {
        if (!this.alive) return;
        if (this.invuln > 0) this.invuln--;

        if (this.onBike && this.bike) {
            let steer = 0;
            if (keys['a'] || keys['arrowleft']) steer = -1;
            if (keys['d'] || keys['arrowright']) steer = 1;
            this.bike.steer(steer);
            this.bike.boosting = !!keys[' '];
            this.bike.update();
            this.x = this.bike.x;
            this.y = this.bike.y;
            this.angle = this.bike.angle;

            // Fire disc
            let fireDisc = false;
            let aimAtMouse = false;
            if (keys['f'] && !this._fPrev) fireDisc = true;
            const clicked = consumeClick();
            if (clicked) { fireDisc = true; aimAtMouse = true; }

            if (fireDisc) {
                const disc = this.bike.fireDisc();
                if (disc) {
                    if (aimAtMouse) {
                        const worldMX = mouse.x + state.camX;
                        const worldMY = mouse.y + state.camY;
                        disc.angle = Math.atan2(worldMY - this.y, worldMX - this.x);
                    }
                    state.projectiles.push(disc);
                    if (state.audio) state.audio.playDiscFire();
                }
            }

            if (keys['e'] && !this._ePrev) this.dismount();
        } else {
            let dx = 0, dy = 0;
            if (keys['w'] || keys['arrowup']) dy = -1;
            if (keys['s'] || keys['arrowdown']) dy = 1;
            if (keys['a'] || keys['arrowleft']) dx = -1;
            if (keys['d'] || keys['arrowright']) dx = 1;
            if (dx || dy) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.x += (dx / len) * FOOT_SPEED;
                this.y += (dy / len) * FOOT_SPEED;
                this.angle = Math.atan2(dy, dx);
            }
            this.x = clamp(this.x, 5, ARENA - 5);
            this.y = clamp(this.y, 5, ARENA - 5);

            if (keys['e'] && !this._ePrev) this.tryMount();
        }
        this._ePrev = !!keys['e'];
        this._fPrev = !!keys['f'];
    }

    dismount() {
        if (!this.onBike || !this.bike) return;
        if (state.audio) state.audio.playDismount();
        this.onBike = false;
        this.bike.trail = [];
        this.bike.ridden = false;
        this.x = this.bike.x - Math.sin(this.bike.angle) * 25;
        this.y = this.bike.y + Math.cos(this.bike.angle) * 25;
        this.x = clamp(this.x, 10, ARENA - 10);
        this.y = clamp(this.y, 10, ARENA - 10);
        this.invuln = 45;
    }

    tryMount() {
        let best = null, bestD = 65;
        for (const b of state.allBikes) {
            if (!b.alive || b.ridden) continue;
            const d = dist(b.x, b.y, this.x, this.y);
            if (d < bestD) { bestD = d; best = b; }
        }
        if (best) {
            if (state.audio) state.audio.playMount();
            this.bike = best;
            best.ridden = true;
            best.hp = Math.min(MAX_HP, best.hp + 25);
            best.color = PLAYER_CLR;
            best.trailColor = '#ff44ff';
            this.onBike = true;
            this.x = best.x;
            this.y = best.y;
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive || this.onBike) return;
        if (this.invuln > 0 && (this.invuln / 3 | 0) % 2) return;
        const sx = this.x - camX, sy = this.y - camY;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle);
        ctx.shadowColor = PLAYER_CLR;
        ctx.shadowBlur = 15;
        ctx.fillStyle = PLAYER_CLR;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;

        ctx.fillStyle = PLAYER_CLR;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.frame * 0.1);
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ON FOOT', sx, sy - 16);
        ctx.globalAlpha = 1;
    }
}
