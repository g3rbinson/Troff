import { ARENA, BIKE_SPEED, BOOST_SPEED, MAX_HP, TRAIL_LIFE, DISC_COOLDOWN } from '../constants.js';
import { clamp } from '../utils.js';
import { Trail } from './Trail.js';
import { Projectile } from './Projectile.js';

export class LightBike {
    constructor(x, y, angle, color, trailColor) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = color;
        this.trailColor = trailColor;
        this.speed = BIKE_SPEED;
        this.hp = MAX_HP;
        this.trail = [];
        this.trailTimer = 0;
        this.trailCounter = 0;
        this.alive = true;
        this.ridden = false;
        this.boosting = false;
        this.boostFuel = 100;
        this.deathX = 0;
        this.deathY = 0;
        this.deathTimer = 0;
        this.discCooldown = 0;
        this.floor = 1;
    }

    update() {
        // Age trails even when dead
        for (let i = this.trail.length - 1; i >= 0; i--) {
            if (--this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        if (this.discCooldown > 0) this.discCooldown--;

        if (!this.alive) {
            this.deathTimer++;
            return;
        }

        if (!this.ridden) return;

        const spd = (this.boosting && this.boostFuel > 0) ? BOOST_SPEED : this.speed;

        if (this.boosting && this.boostFuel > 0) {
            this.boostFuel -= 0.5;
            if (this.boostFuel <= 0) this.boosting = false;
        } else {
            this.boostFuel = Math.min(100, this.boostFuel + 0.15);
        }

        this.x += Math.cos(this.angle) * spd;
        this.y += Math.sin(this.angle) * spd;

        this.x = clamp(this.x, 5, ARENA - 5);
        this.y = clamp(this.y, 5, ARENA - 5);

        this.trailTimer++;
        if (this.trailTimer >= 3) {
            this.trailTimer = 0;
            this.trail.push(new Trail(this.x, this.y, this.trailColor, this, this.trailCounter++));
        }
    }

    steer(dir) { this.angle += dir * 0.055; }

    takeDamage(amt) {
        this.hp -= amt;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.deathX = this.x;
            this.deathY = this.y;
            this.deathTimer = 0;
            this.trail = [];
        }
    }

    fireDisc() {
        if (this.discCooldown > 0 || !this.alive) return null;
        this.discCooldown = DISC_COOLDOWN;
        return new Projectile(
            this.x + Math.cos(this.angle) * 20,
            this.y + Math.sin(this.angle) * 20,
            this.angle,
            this.color,
            this
        );
    }

    draw(ctx, camX, camY) {
        // Trail
        for (let i = 1; i < this.trail.length; i++) {
            const t = this.trail[i], p = this.trail[i - 1];
            const alpha = t.life / TRAIL_LIFE;
            ctx.strokeStyle = t.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.lineWidth = 3;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(p.x - camX, p.y - camY);
            ctx.lineTo(t.x - camX, t.y - camY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;

        if (!this.alive) {
            if (this.deathTimer < 300) {
                const dx = this.deathX - camX, dy = this.deathY - camY;
                const fade = 1 - this.deathTimer / 300;
                const flicker = 0.5 + 0.5 * Math.sin(this.deathTimer * 0.3);

                // Pulsing X marker
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = fade * flicker * 0.7;
                ctx.lineWidth = 3;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                const sz = 12;
                ctx.beginPath();
                ctx.moveTo(dx - sz, dy - sz); ctx.lineTo(dx + sz, dy + sz);
                ctx.moveTo(dx + sz, dy - sz); ctx.lineTo(dx - sz, dy + sz);
                ctx.stroke();

                // Expanding ring
                ctx.globalAlpha = fade * 0.3;
                ctx.beginPath();
                ctx.arc(dx, dy, 10 + this.deathTimer * 0.15, 0, Math.PI * 2);
                ctx.stroke();

                // Label
                ctx.fillStyle = this.color;
                ctx.globalAlpha = fade * 0.5;
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('WRECKED', dx, dy - 20);
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            return;
        }

        const sx = this.x - camX, sy = this.y - camY;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // Bike body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-12, -7);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-13, 0);
        ctx.lineTo(-15, 5);
        ctx.lineTo(-12, 7);
        ctx.closePath();
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -3);
        ctx.lineTo(-5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Boost glow
        if (this.boosting && this.boostFuel > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(-15, 0, 4 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.shadowBlur = 0;

        // HP bar
        if (this.hp < MAX_HP) {
            const bw = 30, bh = 3;
            const bx = sx - bw / 2, by = sy - 18;
            ctx.fillStyle = '#330000';
            ctx.fillRect(bx, by, bw, bh);
            const r = this.hp / MAX_HP;
            ctx.fillStyle = r > 0.5 ? '#00ff00' : r > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(bx, by, bw * r, bh);
        }

        // Disc cooldown arc
        if (this.discCooldown > 0) {
            const cd = this.discCooldown / DISC_COOLDOWN;
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 18, -Math.PI / 2, -Math.PI / 2 + (1 - cd) * Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}
