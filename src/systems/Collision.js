// ============================================================
// Collision Detection — Uses Spatial Hash for performance
// ============================================================
import { state } from '../state.js';
import { ARENA, HIT_DMG, DISC_DMG } from '../constants.js';
import { dist } from '../utils.js';
import { explode } from '../entities/Particle.js';
import { SpatialHash } from './SpatialHash.js';

const trailHash = new SpatialHash(100);

function hitTrail(px, py, ownBike, skipCount) {
    const nearby = trailHash.query(px, py, 15);
    for (const t of nearby) {
        // Skip own bike's recent trail points
        if (t.owner === ownBike && t.idx >= ownBike.trailCounter - (skipCount || 0)) continue;
        if (dist(px, py, t.x, t.y) < 12) return true;
    }
    return false;
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

        // vs all trails (skip own last 20)
        if (hitTrail(pb.x, pb.y, pb, 20)) {
            pb.takeDamage(HIT_DMG);
            if (audio) audio.playCollision();
            explode(particles, pb.x, pb.y, '#ff00ff', 15);
            state.score = Math.max(0, state.score - 50);
        }

        // vs other bike bodies
        for (const b of allBikes) {
            if (b === pb || !b.alive) continue;
            if (dist(pb.x, pb.y, b.x, b.y) < 20) {
                pb.takeDamage(HIT_DMG / 2);
                b.takeDamage(HIT_DMG / 2);
                if (audio) audio.playCollision();
                explode(particles, (pb.x + b.x) / 2, (pb.y + b.y) / 2, '#ffffff', 20);
            }
        }

        // vs walls
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
        if (hitTrail(player.x, player.y, null, 0)) {
            player.alive = false;
            if (audio) audio.playDeath();
            explode(particles, player.x, player.y, '#ff00ff', 50);
        }
    }

    // --- AI bikes vs trails & walls ---
    for (const ai of aiDrivers) {
        const ab = ai.bike;
        if (!ab.alive) continue;

        if (ab.x <= 6 || ab.x >= ARENA - 6 || ab.y <= 6 || ab.y >= ARENA - 6) {
            ab.takeDamage(HIT_DMG);
            explode(particles, ab.x, ab.y, ab.color, 15);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); }
            continue;
        }

        if (hitTrail(ab.x, ab.y, ab, 20)) {
            ab.takeDamage(HIT_DMG);
            explode(particles, ab.x, ab.y, ab.color, 15);
            if (!ab.alive) { state.score += 200; if (audio) audio.playScore(); }
        }
    }

    // --- Projectiles vs bikes ---
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p.alive) continue;

        for (const b of allBikes) {
            if (!b.alive || b === p.owner) continue;
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
            if (dist(p.x, p.y, player.x, player.y) < 12) {
                player.alive = false;
                p.alive = false;
                if (audio) audio.playDeath();
                explode(particles, player.x, player.y, '#ff00ff', 50);
            }
        }
    }
}
