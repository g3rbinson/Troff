// ============================================================
// AI Driver — On-foot mounting + behavior-priority steering + disc combat
// ============================================================
import { ARENA, FOOT_SPEED } from '../constants.js';
import { clamp, wrapAngleDiff, dist } from '../utils.js';
import { state } from '../state.js';
import { pointInWall, pointInPillar, pointInRect } from '../systems/Obstacles.js';

export class AIDriver {
    constructor(bike, idx, startX, startY) {
        this.bike = bike;
        this.idx = idx;
        this.alive = true;
        this.wanderAngle = bike ? bike.angle : 0;
        this.wanderTimer = 0;
        // personality: 0 = defensive, 1 = aggressive
        this.personality = 0.3 + Math.random() * 0.7;

        // On-foot state (used when bike is null)
        this.onFoot = !bike;
        this.footX = startX || (bike ? bike.x : ARENA / 2);
        this.footY = startY || (bike ? bike.y : ARENA / 2);
        this.footAngle = 0;
        this.mountDelay = 30 + Math.random() * 60 | 0; // stagger so they don't all run at once
        this.floor = 1;
    }

    update(playerPos) {
        // --- On foot: walk toward nearest free bike and mount it ---
        if (this.onFoot) {
            this._updateOnFoot();
            return;
        }

        if (!this.bike || !this.bike.alive) { this.alive = false; return; }
        this.bike.ridden = true;

        const b = this.bike;
        const lookDist = 100;

        // --- 1. Ray-cast danger sensing ---
        const rays = [-0.5, -0.25, 0, 0.25, 0.5];
        const dangers = rays.map(offset => {
            return this._rayDanger(b.x, b.y, b.angle + offset, lookDist);
        });

        // --- 2. Wall avoidance (highest priority) ---
        let wallSteer = 0;
        const wallMargin = 150;
        const wallUrgentMargin = 80;

        const aheadX = b.x + Math.cos(b.angle) * lookDist;
        const aheadY = b.y + Math.sin(b.angle) * lookDist;

        let wallUrgency = 0;
        if (aheadX < wallMargin || b.x < wallUrgentMargin) {
            wallSteer += this._steerToward(b.angle, 0, 1.0);
            wallUrgency = Math.max(wallUrgency, b.x < wallUrgentMargin ? 2 : 1);
        }
        if (aheadX > ARENA - wallMargin || b.x > ARENA - wallUrgentMargin) {
            wallSteer += this._steerToward(b.angle, Math.PI, 1.0);
            wallUrgency = Math.max(wallUrgency, b.x > ARENA - wallUrgentMargin ? 2 : 1);
        }
        if (aheadY < wallMargin || b.y < wallUrgentMargin) {
            wallSteer += this._steerToward(b.angle, Math.PI / 2, 1.0);
            wallUrgency = Math.max(wallUrgency, b.y < wallUrgentMargin ? 2 : 1);
        }
        if (aheadY > ARENA - wallMargin || b.y > ARENA - wallUrgentMargin) {
            wallSteer += this._steerToward(b.angle, -Math.PI / 2, 1.0);
            wallUrgency = Math.max(wallUrgency, b.y > ARENA - wallUrgentMargin ? 2 : 1);
        }

        // Corner: steer toward center
        if (wallUrgency >= 2 ||
            (b.x < wallMargin && b.y < wallMargin) ||
            (b.x < wallMargin && b.y > ARENA - wallMargin) ||
            (b.x > ARENA - wallMargin && b.y < wallMargin) ||
            (b.x > ARENA - wallMargin && b.y > ARENA - wallMargin)) {
            const toCenter = Math.atan2(ARENA / 2 - b.y, ARENA / 2 - b.x);
            wallSteer = this._steerToward(b.angle, toCenter, 1.5);
            wallUrgency = 2;
        }

        // --- 3. Trail avoidance ---
        let trailSteer = 0;
        if (dangers[2] > 0.3) {
            const leftDanger = dangers[0] + dangers[1];
            const rightDanger = dangers[3] + dangers[4];
            trailSteer = leftDanger < rightDanger ? -1 : 1;
        } else if (dangers[1] > 0.5) {
            trailSteer = 0.6;
        } else if (dangers[3] > 0.5) {
            trailSteer = -0.6;
        }

        // --- 4. Attack: fire disc at player ---
        const dToPlayer = dist(b.x, b.y, playerPos.x, playerPos.y);
        const angleToPlayer = Math.atan2(playerPos.y - b.y, playerPos.x - b.x);
        const angleDiff = Math.abs(wrapAngleDiff(angleToPlayer - b.angle));

        if (dToPlayer < 500 && angleDiff < 0.4 && b.discCooldown <= 0 && this.personality > 0.4) {
            const disc = b.fireDisc();
            if (disc) {
                // Lead target based on distance
                const leadTime = dToPlayer / 8; // disc speed
                const leadAngle = Math.atan2(
                    playerPos.y + Math.sin(playerPos.angle || 0) * leadTime * 2 - b.y,
                    playerPos.x + Math.cos(playerPos.angle || 0) * leadTime * 2 - b.x
                );
                disc.angle = leadAngle;
                state.projectiles.push(disc);
                if (state.audio) state.audio.playDiscFire();
            }
        }

        // --- 5. Chase / Flank / Wander ---
        this.wanderTimer--;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 40 + Math.random() * 80 | 0;

            if (dToPlayer < 800 && this.personality > 0.5) {
                // Aggressive: cut off player
                const ahead = {
                    x: playerPos.x + Math.cos(playerPos.angle || 0) * 150,
                    y: playerPos.y + Math.sin(playerPos.angle || 0) * 150
                };
                this.wanderAngle = Math.atan2(ahead.y - b.y, ahead.x - b.x) + (Math.random() - 0.5) * 0.8;
            } else if (dToPlayer < 1500 && Math.random() < 0.5) {
                // Chase player
                this.wanderAngle = angleToPlayer + (Math.random() - 0.5) * 1.2;
            } else {
                // Wander
                this.wanderAngle = b.angle + (Math.random() - 0.5) * 1.5;
            }
        }
        const wanderSteer = this._steerToward(b.angle, this.wanderAngle, 0.3);

        // --- 6. Combine steering (priority: wall > trail > wander) ---
        let finalSteer;
        if (wallUrgency >= 2) {
            finalSteer = wallSteer * 2.0;
        } else if (wallUrgency >= 1) {
            finalSteer = wallSteer * 1.2 + trailSteer * 0.5;
        } else if (Math.abs(trailSteer) > 0.1) {
            finalSteer = trailSteer * 1.0 + wanderSteer * 0.2;
        } else {
            finalSteer = wanderSteer;
        }

        finalSteer = clamp(finalSteer, -1, 1);
        b.steer(finalSteer);

        // Boost when chasing
        b.boosting = (dToPlayer < 600 && this.personality > 0.5 && Math.random() < 0.02)
                   || Math.random() < 0.003;

        b.update();
    }

    // Danger along a ray (0..1), checks all trails + obstacles
    _rayDanger(ox, oy, angle, maxDist) {
        let danger = 0;
        const cx = Math.cos(angle);
        const cy = Math.sin(angle);

        // Check trails
        for (const bike of state.allBikes) {
            for (let i = 0; i < bike.trail.length; i += 2) {
                const t = bike.trail[i];
                const dx = t.x - ox;
                const dy = t.y - oy;
                const along = dx * cx + dy * cy;
                if (along < 5 || along > maxDist) continue;
                const perp = Math.abs(-dx * cy + dy * cx);
                if (perp < 15) {
                    const d = 1 - (along / maxDist);
                    danger = Math.max(danger, d);
                }
            }
        }

        // Check obstacles (walls and pillars) along ray
        const steps = 4;
        for (let s = 1; s <= steps; s++) {
            const d = (s / steps) * maxDist;
            const px = ox + cx * d;
            const py = oy + cy * d;
            for (const obs of state.obstacles) {
                if (obs.type === 'wall' && pointInWall(px, py, obs)) {
                    danger = Math.max(danger, 1 - (d / maxDist));
                }
                if (obs.type === 'pillar' && pointInPillar(px, py, obs)) {
                    danger = Math.max(danger, 1 - (d / maxDist));
                }
            }
            // Detect traps (spikes, EMP) — mild avoidance
            for (const trap of state.traps) {
                if ((trap.type === 'spikes' || trap.type === 'emp') && pointInRect(px, py, trap)) {
                    danger = Math.max(danger, (1 - (d / maxDist)) * 0.5);
                }
            }
        }

        return danger;
    }

    _steerToward(current, target, strength) {
        const diff = wrapAngleDiff(target - current);
        return clamp(diff * strength, -1, 1);
    }

    // ================================================================
    // ON-FOOT BEHAVIOR: walk to nearest free bike and mount
    // ================================================================
    _updateOnFoot() {
        if (this.mountDelay > 0) { this.mountDelay--; return; }

        // Find nearest free (unmounted, alive) bike
        let best = null, bestD = Infinity;
        for (const b of state.allBikes) {
            if (!b.alive || b.ridden) continue;
            const d = dist(b.x, b.y, this.footX, this.footY);
            if (d < bestD) { bestD = d; best = b; }
        }

        if (!best) return; // no bikes available

        // Walk toward it
        const angle = Math.atan2(best.y - this.footY, best.x - this.footX);
        this.footAngle = angle;
        this.footX += Math.cos(angle) * FOOT_SPEED;
        this.footY += Math.sin(angle) * FOOT_SPEED;
        this.footX = clamp(this.footX, 10, ARENA - 10);
        this.footY = clamp(this.footY, 10, ARENA - 10);

        // Mount when close enough
        if (bestD < 50) {
            best.ridden = true;
            this.bike = best;
            this.onFoot = false;
            this.wanderAngle = best.angle;
            if (state.audio) state.audio.playMount();
        }
    }

    // Draw the AI when on foot
    drawOnFoot(ctx, camX, camY) {
        if (!this.onFoot || !this.alive) return;
        const sx = this.footX - camX;
        const sy = this.footY - camY;

        // Don't draw if off screen
        if (sx < -50 || sx > ctx.canvas.width + 50 || sy < -50 || sy > ctx.canvas.height + 50) return;

        const clr = state.allBikes.length > 0 ? '#ff4444' : '#aaaaaa';

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.footAngle);
        ctx.shadowColor = clr;
        ctx.shadowBlur = 10;
        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        // Direction line
        ctx.strokeStyle = clr;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}
