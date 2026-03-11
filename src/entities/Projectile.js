import { ARENA, DISC_SPEED, DISC_RANGE, DISC_BOUNCES } from '../constants.js';

export class Projectile {
    constructor(x, y, angle, color, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = color;
        this.owner = owner;
        this.speed = DISC_SPEED;
        this.distTraveled = 0;
        this.maxDist = DISC_RANGE;
        this.bounces = 0;
        this.maxBounces = DISC_BOUNCES;
        this.alive = true;
        this.radius = 5;
        this.justBounced = false;
        this.floor = owner ? (owner.floor || 1) : 1;
    }

    update() {
        if (!this.alive) return;
        this.justBounced = false;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.distTraveled += this.speed;

        // Wall bouncing
        let bounced = false;
        if (this.x <= 5) { this.angle = Math.PI - this.angle; this.x = 6; bounced = true; }
        else if (this.x >= ARENA - 5) { this.angle = Math.PI - this.angle; this.x = ARENA - 6; bounced = true; }
        if (this.y <= 5) { this.angle = -this.angle; this.y = 6; bounced = true; }
        else if (this.y >= ARENA - 5) { this.angle = -this.angle; this.y = ARENA - 6; bounced = true; }

        if (bounced) {
            this.bounces++;
            this.justBounced = true;
        }

        if (this.distTraveled >= this.maxDist || this.bounces > this.maxBounces) {
            this.alive = false;
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        const sx = this.x - camX, sy = this.y - camY;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.distTraveled * 0.15);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // Outer ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0); ctx.lineTo(this.radius, 0);
        ctx.moveTo(0, -this.radius); ctx.lineTo(0, this.radius);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

        // Motion trail
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        const tx = this.x - Math.cos(this.angle) * 20;
        const ty = this.y - Math.sin(this.angle) * 20;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx - camX, ty - camY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}
