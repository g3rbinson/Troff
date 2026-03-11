// ============================================================
// Obstacle System — Runtime management for level obstacles,
// traps, turrets, and ramps
// ============================================================
import { state } from '../state.js';
import { dist } from '../utils.js';
import { Projectile } from '../entities/Projectile.js';
import { explode } from '../entities/Particle.js';

// ---- Load level data into runtime state ----
export function loadLevelObstacles(levelData) {
    state.obstacles = (levelData.obstacles || []).map(o => ({ ...o }));
    state.ramps = (levelData.ramps || []).map(r => ({ ...r }));
    state.levelFloors = levelData.floors || 1;
    state.turretProjectiles = [];

    // Initialize traps with runtime state
    state.traps = (levelData.traps || []).map(t => ({
        ...t,
        _timer: 0,
        _active: false, // spikes: toggling on/off
    }));
}

// ---- Update traps each frame ----
export function updateTraps() {
    for (const trap of state.traps) {
        trap._timer++;

        if (trap.type === 'spikes') {
            // Spikes toggle: active for 40 frames, off for (interval - 40)
            const cycle = trap.interval || 100;
            const phase = trap._timer % cycle;
            trap._active = phase < 40;
        }

        if (trap.type === 'turret') {
            const interval = trap.interval || 120;
            if (trap._timer % interval === 0) {
                fireTurret(trap);
            }
        }
    }

    // Update turret projectiles
    for (let i = state.turretProjectiles.length - 1; i >= 0; i--) {
        const p = state.turretProjectiles[i];
        p.update();
        if (!p.alive) state.turretProjectiles.splice(i, 1);
    }
}

function fireTurret(turret) {
    const dirMap = {
        north: -Math.PI / 2,
        south: Math.PI / 2,
        east: 0,
        west: Math.PI,
    };
    let angle = dirMap[turret.direction] ?? 0;
    // Add slight spread for variety
    angle += (Math.random() - 0.5) * 0.3;

    const p = new Projectile(turret.x, turret.y, angle, '#ff4444', null);
    p.speed = 5;
    p.maxDist = 800;
    p.maxBounces = 1;
    p.isTurretDisc = true;
    state.turretProjectiles.push(p);
    if (state.audio) state.audio.playDiscFire();
}

// ---- Collision helpers for obstacles ----

// Check if point is inside a wall rectangle
export function pointInWall(px, py, wall) {
    return px >= wall.x && px <= wall.x + wall.w &&
           py >= wall.y && py <= wall.y + wall.h;
}

// Check if point is inside a pillar circle
export function pointInPillar(px, py, pillar) {
    return dist(px, py, pillar.x, pillar.y) < pillar.radius;
}

// Check if point is inside a rectangular zone (trap, ramp, emp)
export function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
}

// Push entity out of a wall and return bounce normal (or null)
export function resolveWallCollision(entity, wall) {
    const ex = entity.x, ey = entity.y;
    if (!pointInWall(ex, ey, wall)) return null;

    // Find closest edge to push out
    const dLeft = ex - wall.x;
    const dRight = (wall.x + wall.w) - ex;
    const dTop = ey - wall.y;
    const dBottom = (wall.y + wall.h) - ey;
    const minD = Math.min(dLeft, dRight, dTop, dBottom);

    if (minD === dLeft) { entity.x = wall.x - 1; return 'left'; }
    if (minD === dRight) { entity.x = wall.x + wall.w + 1; return 'right'; }
    if (minD === dTop) { entity.y = wall.y - 1; return 'top'; }
    entity.y = wall.y + wall.h + 1;
    return 'bottom';
}

// Push entity out of a pillar and return true if collision happened
export function resolvePillarCollision(entity, pillar) {
    const d = dist(entity.x, entity.y, pillar.x, pillar.y);
    if (d >= pillar.radius) return false;

    // Push out along the radius
    const angle = Math.atan2(entity.y - pillar.y, entity.x - pillar.x);
    entity.x = pillar.x + Math.cos(angle) * (pillar.radius + 1);
    entity.y = pillar.y + Math.sin(angle) * (pillar.radius + 1);
    return true;
}

// Check if entity is on a ramp and should change floor
export function checkRamp(entity) {
    const floor = entity.floor || 1;
    for (const ramp of state.ramps) {
        if (!pointInRect(entity.x, entity.y, ramp)) continue;
        // Can go up or down
        if (floor === ramp.fromFloor) {
            entity.floor = ramp.toFloor;
            return true;
        }
        if (floor === ramp.toFloor) {
            entity.floor = ramp.fromFloor;
            return true;
        }
    }
    return false;
}

// Check traps vs an entity (bike or on-foot) — returns damage amount
export function checkTraps(entity) {
    let totalDamage = 0;
    const floor = entity.floor || 1;

    for (const trap of state.traps) {
        if (trap.type === 'spikes' && trap._active) {
            if (pointInRect(entity.x, entity.y, trap)) {
                // Only damage on floor 1 (spikes are ground-level)
                if (floor === 1) {
                    totalDamage += trap.damage || 15;
                }
            }
        }
        // EMP doesn't do damage — handled separately
    }
    return totalDamage;
}

// Check if entity is in an EMP zone (disables boost)
export function isInEMP(entity) {
    const floor = entity.floor || 1;
    if (floor !== 1) return false; // EMP is ground floor only
    for (const trap of state.traps) {
        if (trap.type === 'emp' && pointInRect(entity.x, entity.y, trap)) {
            return true;
        }
    }
    return false;
}

// Check all solid obstacles (walls + pillars) for a bike/entity collision
// Returns true if any collision happened
export function resolveObstacleCollisions(entity) {
    let hit = false;
    for (const obs of state.obstacles) {
        if (obs.type === 'wall') {
            if (resolveWallCollision(entity, obs)) hit = true;
        } else if (obs.type === 'pillar') {
            if (resolvePillarCollision(entity, obs)) hit = true;
        }
    }
    return hit;
}

// Bounce a projectile off obstacles. Returns true if bounced.
export function bounceProjectileOffObstacles(proj) {
    for (const obs of state.obstacles) {
        if (obs.type === 'wall' && pointInWall(proj.x, proj.y, obs)) {
            const side = resolveWallCollision(proj, obs);
            if (side === 'left' || side === 'right') {
                proj.angle = Math.PI - proj.angle;
            } else {
                proj.angle = -proj.angle;
            }
            proj.bounces++;
            proj.justBounced = true;
            return true;
        }
        if (obs.type === 'pillar' && pointInPillar(proj.x, proj.y, obs)) {
            // Reflect off pillar surface
            const angle = Math.atan2(proj.y - obs.y, proj.x - obs.x);
            proj.angle = 2 * angle - proj.angle + Math.PI;
            proj.x = obs.x + Math.cos(angle) * (obs.radius + 2);
            proj.y = obs.y + Math.sin(angle) * (obs.radius + 2);
            proj.bounces++;
            proj.justBounced = true;
            return true;
        }
    }
    return false;
}

// Same-floor check: returns true if two entities can interact
export function sameFloor(a, b) {
    return (a.floor || 1) === (b.floor || 1);
}

// Clear all level data
export function clearLevelObstacles() {
    state.obstacles = [];
    state.traps = [];
    state.ramps = [];
    state.turretProjectiles = [];
    state.levelFloors = 1;
}
