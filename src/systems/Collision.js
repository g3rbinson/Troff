// ============================================================
// Collision Detection — Uses Spatial Hash for performance
// ============================================================
import { state } from '../state.js';
import { ARENA, HIT_DMG, DISC_DMG } from '../constants.js';
import { dist } from '../utils.js';
import { explode } from '../entities/Particle.js';
import { SpatialHash } from './SpatialHash.js';
import {
    resolveObstacleCollisions, checkTraps, isInEMP,
    checkRamp, bounceProjectileOffObstacles, sameFloor
} from './Obstacles.js';

const trailHash = new SpatialHash(100);

function hitTrail(px, py, ownBike, skipCount, entityFloor) {
    const floor = entityFloor || 1;
    const nearby = trailHash.query(px, py, 15);
    for (const t of nearby) {
        // Skip own bike's recent trail points
        if (t.owner === ownBike && t.idx >= ownBike.trailCounter - (skipCount || 0)) continue;
        // Trails are on floor 1 only — skip if entity is on upper floor
        if (floor > 1) continue;
        if (dist(px, py, t.x, t.y) < 12) return true;
    }
    return false;
}

// Spike damage throttle - only apply every 30 frames per entity
const spikeCooldowns = new WeakMap();
function canTakeSpikeHit(entity) {
    const last = spikeCooldowns.get(entity) || 0;
    if (state.frame - last < 30) return false;
    spikeCooldowns.set(entity, state.frame);
    return true;
}

export function checkCollisions() {
    const { player, allBikes, aiDrivers, particles, projectiles } = state;
    const audio = state.audio;

    // Build spatial hash from all trail points
    trailHash.clear();
    for (const bike of allBikes) {
        for (const t of bike.trail) {
            trailHash.insert(t);
        }
    }

    // --- Player on bike ---
    if (player.onBike && player.bike && player.bike.alive) {
        const pb = player.bike;

        // Obstacle collisions (walls/pillars)
        if (resolveObstacleCollisions(pb)) {
            pb.takeDamage(HIT_DMG / 2);
            if (audio) audio.playCollision();
            explode(particles, pb.x, pb.y, '#ff00ff', 12);
        }

        // EMP - disable boost
        if (isInEMP(pb)) {
            pb.boosting = false;
            pb.boostFuel = Math.max(0, pb.boostFuel - 1);
        }

        // Spike traps
        const spikeDmg = checkTraps(pb);
        if (spikeDmg > 0 && canTakeSpikeHit(pb)) {
            pb.takeDamage(spikeDmg);
            if (audio) audio.playCollision();
            explode(particles, pb.x, pb.y, '#ff4444', 8);
        }

        // Ramp check
        checkRamp(pb);
        player.floor = pb.floor || 1;

        // vs all trails (skip own last 20)
        if (hitTrail(pb.x, pb.y, pb, 20, pb.floor)) {
            pb.takeDamage(HIT_DMG);
            if (audio) audio.playCollision();
            explode(particles, pb.x, pb.y, '#ff00ff', 15);
            state.score = Math.max(0, state.score - 50);
        }

        // vs other bike bodies (same floor only)
        for (const b of allBikes) {
            if (b === pb || !b.alive) continue;
            if (!sameFloor(pb, b)) continue;
            if (dist(pb.x, pb.y, b.x, b.y) < 20) {
                pb.takeDamage(HIT_DMG / 2);
                b.takeDamage(HIT_DMG / 2);
                if (audio) audio.playCollision();
                explode(particles, (pb.x + b.x) / 2, (pb.y + b.y) / 2, '#ffffff', 20);
            }
        }

        // vs arena walls
        if (pb.x <= 6 || pb.x >= ARENA - 6 || pb.y <= 6 || pb.y >= ARENA - 6) {
            pb.takeDamage(HIT_DMG);
            if (audio) audio.playCollision();
            explode(particles, pb.x, pb.y, '#ff00ff', 15);
        }

        if (!pb.alive) {
            explode(particles, pb.x, pb.y, '#ff00ff', 40);
            player.dismount();
        }
    }

    // --- Player on foot vs trails ---
    if (!player.onBike && player.alive && player.invuln <= 0) {
        // Obstacle push-out on foot
        resolveObstacleCollisions(player);

        // Trail hit (floor-aware)
        if (hitTrail(player.x, player.y, null, 0, player.floor)) {
            player.alive = false;
            if (audio) audio.playDeath();
            explode(particles, player.x, player.y, '#ff00ff', 50);
        }

        // Spikes on foot = instant death
        const spikeDmg = checkTraps(player);
        if (spikeDmg > 0) {
            player.alive = false;
            if (audio) audio.playDeath();
            explode(particles, player.x, player.y, '#ff4444', 40);
        }

        // Ramp check on foot
        checkRamp(player);
    }

    // --- AI bikes vs trails, walls & obstacles ---
    for (const ai of aiDrivers) {
        if (ai.onFoot) continue;
        const ab = ai.bike;
        if (!ab || !ab.alive) continue;

        // Obstacle collisions
        if (resolveObstacleCollisions(ab)) {
            ab.takeDamage(HIT_DMG / 2);
            explode(particles, ab.x, ab.y, ab.color, 10);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); continue; }
        }

        // EMP
        if (isInEMP(ab)) {
            ab.boosting = false;
            ab.boostFuel = Math.max(0, ab.boostFuel - 1);
        }

        // Spike traps
        const spikeDmg = checkTraps(ab);
        if (spikeDmg > 0 && canTakeSpikeHit(ab)) {
            ab.takeDamage(spikeDmg);
            explode(particles, ab.x, ab.y, '#ff4444', 8);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); continue; }
        }

        // Ramp
        checkRamp(ab);
        ai.floor = ab.floor || 1;

        // Arena walls
        if (ab.x <= 6 || ab.x >= ARENA - 6 || ab.y <= 6 || ab.y >= ARENA - 6) {
            ab.takeDamage(HIT_DMG);
            explode(particles, ab.x, ab.y, ab.color, 15);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); }
            continue;
        }

        // Trails (floor-aware)
        if (hitTrail(ab.x, ab.y, ab, 20, ab.floor)) {
            ab.takeDamage(HIT_DMG);
            explode(particles, ab.x, ab.y, ab.color, 15);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); }
        }
    }

    // --- AI on foot vs trails ---
    for (const ai of aiDrivers) {
        if (!ai.onFoot || !ai.alive) continue;

        // Push out of obstacles
        const foot = { x: ai.footX, y: ai.footY, floor: ai.floor || 1 };
        resolveObstacleCollisions(foot);
        ai.footX = foot.x; ai.footY = foot.y;

        // Trail hit
        if (hitTrail(ai.footX, ai.footY, null, 0, ai.floor)) {
            ai.alive = false;
            ai.onFoot = false;
            explode(particles, ai.footX, ai.footY, '#ff4444', 30);
            state.score += 150;
            if (audio) audio.playScore();
        }
    }

    // --- Projectiles vs bikes, obstacles ---
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p.alive) continue;

        // Bounce off obstacles
        bounceProjectileOffObstacles(p);

        for (const b of allBikes) {
            if (!b.alive || b === p.owner) continue;
            if (!sameFloor(p, b)) continue;
            if (dist(p.x, p.y, b.x, b.y) < 18) {
                b.takeDamage(DISC_DMG);
                p.alive = false;
                if (audio) audio.playDiscHit();
                explode(particles, p.x, p.y, p.color, 20);
                if (!b.alive) {
                    state.score += b.ridden ? 300 : 100;
                    if (audio) audio.playScore();
                }
                break;
            }
        }

        // Projectile vs player on foot
        if (!player.onBike && player.alive && p.alive && player.invuln <= 0) {
            if (sameFloor(p, player) && dist(p.x, p.y, player.x, player.y) < 12) {
                player.alive = false;
                p.alive = false;
                if (audio) audio.playDeath();
                explode(particles, player.x, player.y, '#ff00ff', 50);
            }
        }

        // Projectile vs AI on foot
        if (p.alive) {
            for (const ai of aiDrivers) {
                if (!ai.onFoot || !ai.alive) continue;
                if (!sameFloor(p, { floor: ai.floor || 1 })) continue;
                if (dist(p.x, p.y, ai.footX, ai.footY) < 12) {
                    ai.alive = false;
                    ai.onFoot = false;
                    p.alive = false;
                    if (audio) audio.playDiscHit();
                    explode(particles, ai.footX, ai.footY, '#ff4444', 25);
                    state.score += 200;
                    break;
                }
            }
        }
    }

    // --- Turret projectiles vs bikes/player ---
    for (let i = state.turretProjectiles.length - 1; i >= 0; i--) {
        const p = state.turretProjectiles[i];
        if (!p.alive) continue;

        // Bounce off obstacles
        bounceProjectileOffObstacles(p);

        // vs player bike
        if (player.onBike && player.bike && player.bike.alive) {
            if (sameFloor(p, player.bike) && dist(p.x, p.y, player.bike.x, player.bike.y) < 18) {
                player.bike.takeDamage(DISC_DMG / 2);
                p.alive = false;
                if (audio) audio.playDiscHit();
                explode(particles, p.x, p.y, '#ff4444', 15);
                if (!player.bike.alive) {
                    explode(particles, player.bike.x, player.bike.y, '#ff00ff', 40);
                    player.dismount();
                }
                continue;
            }
        }

        // vs player on foot
        if (!player.onBike && player.alive && player.invuln <= 0) {
            if (sameFloor(p, player) && dist(p.x, p.y, player.x, player.y) < 12) {
                player.alive = false;
                p.alive = false;
                if (audio) audio.playDeath();
                explode(particles, player.x, player.y, '#ff00ff', 50);
                continue;
            }
        }

        // vs AI bikes
        for (const ai of aiDrivers) {
            if (ai.onFoot || !ai.bike || !ai.bike.alive) continue;
            if (!sameFloor(p, ai.bike)) continue;
            if (dist(p.x, p.y, ai.bike.x, ai.bike.y) < 18) {
                ai.bike.takeDamage(DISC_DMG / 2);
                p.alive = false;
                if (audio) audio.playDiscHit();
                explode(particles, p.x, p.y, '#ff4444', 15);
                if (!ai.bike.alive) { state.score += 200; if (audio) audio.playScore(); }
                break;
            }
        }
    }
}
