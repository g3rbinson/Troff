// ============================================================
// SYNTHWAVE TRON - Main Game Logic
// ============================================================
import { SynthwaveAudio } from './audio.js';

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 180;
    minimapCanvas.height = 180;
}
window.addEventListener('resize', resize);
resize();

// --- Constants ---
const ARENA = 2000;
const GRID_SP = 50;
const BIKE_SPEED = 4;
const BOOST_SPEED = 7;
const FOOT_SPEED = 2.2;
const TRAIL_LIFE = 600;
const MAX_HP = 100;
const HIT_DMG = 35;
const NUM_AI = 4;
const PLAYER_CLR = '#ff00ff';
const PLAYER_TRAIL = '#ff44ff';
const AI_CLR = ['#00ffff', '#ffff00', '#ff4444', '#44ff44'];
const AI_TRAIL = ['#44ffff', '#ffff44', '#ff6666', '#66ff66'];

// --- Audio ---
const audio = new SynthwaveAudio();

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Enter' && (state === 'menu' || state === 'dead')) startGame();
    if (e.key === 'Escape' && state === 'playing') togglePause();
    if (e.key === 'Escape' && state === 'paused') togglePause();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// --- Game State ---
let state = 'menu'; // menu | playing | paused | dead
let score = 0;
let frame = 0;
let player, allBikes, aiDrivers, particles, stars;
let gridPulse = 0;

// --- Helpers ---
function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function wrapAngleDiff(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// --- Trail ---
class Trail {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.color = color;
        this.life = TRAIL_LIFE;
    }
}

// --- Particle ---
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.life = life; this.max = life;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.97; this.vy *= 0.97;
        this.life--;
    }
}

function explode(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 4;
        particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, 25 + Math.random() * 30 | 0));
    }
}

// --- Light Bike ---
class LightBike {
    constructor(x, y, angle, color, trailColor) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.color = color;
        this.trailColor = trailColor;
        this.speed = BIKE_SPEED;
        this.hp = MAX_HP;
        this.trail = [];
        this.trailTimer = 0;
        this.alive = true;
        this.ridden = false;
        this.boosting = false;
        this.boostFuel = 100;
        this.deathX = 0;
        this.deathY = 0;
        this.deathTimer = 0; // counts up after death
    }

    update() {
        // Always age trails, even when dead — so dead bike trails fade out
        for (let i = this.trail.length - 1; i >= 0; i--) {
            if (--this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        // Dead bikes just tick their death timer
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

        // Clamp to arena
        this.x = clamp(this.x, 5, ARENA - 5);
        this.y = clamp(this.y, 5, ARENA - 5);

        // Drop trail every 3 frames
        this.trailTimer++;
        if (this.trailTimer >= 3) {
            this.trailTimer = 0;
            this.trail.push(new Trail(this.x, this.y, this.trailColor));
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
        }
    }

    draw(camX, camY) {
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
            // Draw wreckage marker at death location
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
    }
}

// --- Player ---
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.angle = 0;
        this.onBike = true;
        this.bike = null;
        this.alive = true;
        this.invuln = 0;
        this._ePrev = false;
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
    }

    dismount() {
        if (!this.onBike || !this.bike) return;
        audio.playDismount();
        this.onBike = false;
        this.bike.ridden = false;
        this.x = this.bike.x - Math.sin(this.bike.angle) * 25;
        this.y = this.bike.y + Math.cos(this.bike.angle) * 25;
        this.x = clamp(this.x, 10, ARENA - 10);
        this.y = clamp(this.y, 10, ARENA - 10);
        this.invuln = 45;
    }

    tryMount() {
        let best = null, bestD = 65;
        for (const b of allBikes) {
            if (!b.alive || b.ridden) continue;
            const d = dist(b.x, b.y, this.x, this.y);
            if (d < bestD) { bestD = d; best = b; }
        }
        if (best) {
            audio.playMount();
            this.bike = best;
            best.ridden = true;
            best.hp = Math.min(MAX_HP, best.hp + 25);
            best.color = PLAYER_CLR;
            best.trailColor = PLAYER_TRAIL;
            this.onBike = true;
            this.x = best.x;
            this.y = best.y;
        }
    }

    draw(camX, camY) {
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
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(frame * 0.1);
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ON FOOT', sx, sy - 16);
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// AI DRIVER — Smart avoidance-based steering
// ============================================================
class AIDriver {
    constructor(bike, idx) {
        this.bike = bike;
        this.idx = idx;
        this.alive = true;
        this.wanderAngle = bike.angle;
        this.wanderTimer = 0;
    }

    update(playerPos) {
        if (!this.bike.alive) { this.alive = false; return; }
        this.bike.ridden = true;

        const b = this.bike;
        const lookDist = 80; // how far ahead to scan
        const turnRate = 0.055;

        // --- Sense dangers ahead ---
        // Cast 5 rays: hard-left, left, center, right, hard-right
        const rays = [-0.5, -0.25, 0, 0.25, 0.5];
        const dangers = rays.map(offset => {
            const a = b.angle + offset;
            return this._rayDanger(b.x, b.y, a, lookDist);
        });

        // --- Wall avoidance (highest priority) ---
        let wallSteer = 0;
        const wallMargin = 120;
        const wallUrgentMargin = 60;
        const cosA = Math.cos(b.angle);
        const sinA = Math.sin(b.angle);

        // Project position ahead
        const aheadX = b.x + cosA * lookDist;
        const aheadY = b.y + sinA * lookDist;

        // Check if heading toward any wall
        let wallUrgency = 0;
        if (aheadX < wallMargin || b.x < wallUrgentMargin) {
            // Near left wall, need to turn right (positive angle if heading left)
            const away = Math.atan2(0, 1); // point right
            wallSteer += this._steerToward(b.angle, away, 1.0);
            wallUrgency = Math.max(wallUrgency, b.x < wallUrgentMargin ? 2 : 1);
        }
        if (aheadX > ARENA - wallMargin || b.x > ARENA - wallUrgentMargin) {
            const away = Math.atan2(0, -1); // point left
            wallSteer += this._steerToward(b.angle, away, 1.0);
            wallUrgency = Math.max(wallUrgency, b.x > ARENA - wallUrgentMargin ? 2 : 1);
        }
        if (aheadY < wallMargin || b.y < wallUrgentMargin) {
            const away = Math.atan2(1, 0); // point down
            wallSteer += this._steerToward(b.angle, away, 1.0);
            wallUrgency = Math.max(wallUrgency, b.y < wallUrgentMargin ? 2 : 1);
        }
        if (aheadY > ARENA - wallMargin || b.y > ARENA - wallUrgentMargin) {
            const away = Math.atan2(-1, 0); // point up
            wallSteer += this._steerToward(b.angle, away, 1.0);
            wallUrgency = Math.max(wallUrgency, b.y > ARENA - wallUrgentMargin ? 2 : 1);
        }

        // Corner avoidance — if in a corner, steer toward center
        if (wallUrgency >= 2 ||
            (b.x < wallMargin && b.y < wallMargin) ||
            (b.x < wallMargin && b.y > ARENA - wallMargin) ||
            (b.x > ARENA - wallMargin && b.y < wallMargin) ||
            (b.x > ARENA - wallMargin && b.y > ARENA - wallMargin)) {
            const toCenter = Math.atan2(ARENA / 2 - b.y, ARENA / 2 - b.x);
            wallSteer = this._steerToward(b.angle, toCenter, 1.5);
            wallUrgency = 2;
        }

        // --- Trail avoidance ---
        let trailSteer = 0;
        // If center ray has danger, dodge to whichever side is clearer
        if (dangers[2] > 0.3) {
            const leftDanger = dangers[0] + dangers[1];
            const rightDanger = dangers[3] + dangers[4];
            trailSteer = leftDanger < rightDanger ? -1 : 1;
        } else if (dangers[1] > 0.5) {
            trailSteer = 0.6; // dodge right
        } else if (dangers[3] > 0.5) {
            trailSteer = -0.6; // dodge left
        }

        // --- Wander / Chase ---
        this.wanderTimer--;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 40 + Math.random() * 80 | 0;
            // Mix between random wander and hunting player
            if (Math.random() < 0.5) {
                this.wanderAngle = Math.atan2(playerPos.y - b.y, playerPos.x - b.x) + (Math.random() - 0.5) * 1.2;
            } else {
                this.wanderAngle = b.angle + (Math.random() - 0.5) * 1.5;
            }
        }
        const wanderSteer = this._steerToward(b.angle, this.wanderAngle, 0.3);

        // --- Combine steering (priority: wall > trail > wander) ---
        let finalSteer;
        if (wallUrgency >= 2) {
            finalSteer = wallSteer * 2.0; // emergency wall avoidance
        } else if (wallUrgency >= 1) {
            finalSteer = wallSteer * 1.2 + trailSteer * 0.5;
        } else if (Math.abs(trailSteer) > 0.1) {
            finalSteer = trailSteer * 1.0 + wanderSteer * 0.2;
        } else {
            finalSteer = wanderSteer;
        }

        // Apply turn
        finalSteer = clamp(finalSteer, -1, 1);
        b.steer(finalSteer);

        // Occasional boost
        b.boosting = Math.random() < 0.005;

        b.update();
    }

    // Returns a danger value 0..1 along a ray, checking all trails
    _rayDanger(ox, oy, angle, maxDist) {
        let danger = 0;
        const cx = Math.cos(angle);
        const cy = Math.sin(angle);

        for (const bike of allBikes) {
            for (let i = 0; i < bike.trail.length; i += 2) { // skip every other for perf
                const t = bike.trail[i];
                // Project trail point onto ray
                const dx = t.x - ox;
                const dy = t.y - oy;
                const along = dx * cx + dy * cy;
                if (along < 5 || along > maxDist) continue;

                const perp = Math.abs(-dx * cy + dy * cx);
                if (perp < 15) {
                    // Closer = more dangerous
                    const d = 1 - (along / maxDist);
                    danger = Math.max(danger, d);
                }
            }
        }
        return danger;
    }

    // Returns a steering value (-1..1) to turn from current angle toward targetAngle
    _steerToward(current, target, strength) {
        const diff = wrapAngleDiff(target - current);
        return clamp(diff * strength, -1, 1);
    }
}

// ============================================================
// STAR FIELD
// ============================================================
function generateStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * ARENA,
            y: Math.random() * ARENA,
            size: Math.random() * 2 + 0.5,
            bright: Math.random(),
            twinkle: 0.01 + Math.random() * 0.05
        });
    }
}

// ============================================================
// GAME MANAGEMENT
// ============================================================
function startGame() {
    audio.init();
    state = 'playing';
    score = 0; frame = 0;
    allBikes = []; aiDrivers = []; particles = [];
    generateStars();

    // Player bike
    const pb = new LightBike(ARENA / 2, ARENA / 2, 0, PLAYER_CLR, PLAYER_TRAIL);
    pb.ridden = true;
    allBikes.push(pb);

    player = new Player(ARENA / 2, ARENA / 2);
    player.bike = pb;

    // AI bikes (spawn away from edges)
    for (let i = 0; i < NUM_AI; i++) {
        const a = (Math.PI * 2 / NUM_AI) * i;
        const bx = clamp(ARENA / 2 + Math.cos(a) * 400, 200, ARENA - 200);
        const by = clamp(ARENA / 2 + Math.sin(a) * 400, 200, ARENA - 200);
        const bike = new LightBike(bx, by, a + Math.PI, AI_CLR[i], AI_TRAIL[i]);
        bike.ridden = true;
        allBikes.push(bike);
        aiDrivers.push(new AIDriver(bike, i));
    }

    // Scatter free bikes
    for (let i = 0; i < 5; i++) spawnFreeBike();

    overlay('none');
    pauseOverlay(false);
}

function spawnFreeBike() {
    const x = 150 + Math.random() * (ARENA - 300);
    const y = 150 + Math.random() * (ARENA - 300);
    const b = new LightBike(x, y, Math.random() * Math.PI * 2, '#aaaaff', '#8888cc');
    b.hp = 50 + Math.random() * 50 | 0;
    allBikes.push(b);
}

function togglePause() {
    if (state === 'playing') {
        state = 'paused';
        audio.pause();
        pauseOverlay(true);
    } else if (state === 'paused') {
        state = 'playing';
        audio.resume();
        pauseOverlay(false);
    }
}

// ============================================================
// COLLISION DETECTION
// ============================================================
function checkCollisions() {
    // Helper: check point against a bike's trail
    function hitTrail(px, py, bike, skip) {
        const end = bike.trail.length - (skip || 0);
        for (let i = 0; i < end; i++) {
            const t = bike.trail[i];
            if (dist(px, py, t.x, t.y) < 12) return true;
        }
        return false;
    }

    // --- Player on bike ---
    if (player.onBike && player.bike && player.bike.alive) {
        const pb = player.bike;

        for (const b of allBikes) {
            if (b === pb) continue;

            // vs trail
            if (hitTrail(pb.x, pb.y, b, 0)) {
                pb.takeDamage(HIT_DMG);
                audio.playCollision();
                explode(pb.x, pb.y, PLAYER_CLR, 15);
                score = Math.max(0, score - 50);
                break;
            }

            // vs bike body
            if (b.alive && dist(pb.x, pb.y, b.x, b.y) < 20) {
                pb.takeDamage(HIT_DMG / 2);
                b.takeDamage(HIT_DMG / 2);
                audio.playCollision();
                explode((pb.x + b.x) / 2, (pb.y + b.y) / 2, '#ffffff', 20);
            }
        }

        // vs own trail (skip last 20)
        if (hitTrail(pb.x, pb.y, pb, 20)) {
            pb.takeDamage(HIT_DMG);
            audio.playCollision();
            explode(pb.x, pb.y, PLAYER_CLR, 15);
        }

        // vs walls
        if (pb.x <= 6 || pb.x >= ARENA - 6 || pb.y <= 6 || pb.y >= ARENA - 6) {
            pb.takeDamage(HIT_DMG);
            audio.playCollision();
            explode(pb.x, pb.y, PLAYER_CLR, 15);
        }

        if (!pb.alive) {
            explode(pb.x, pb.y, PLAYER_CLR, 40);
            player.dismount();
        }
    }

    // --- Player on foot vs trails ---
    if (!player.onBike && player.alive && player.invuln <= 0) {
        for (const b of allBikes) {
            if (hitTrail(player.x, player.y, b, 0)) {
                player.alive = false;
                audio.playDeath();
                explode(player.x, player.y, PLAYER_CLR, 50);
                break;
            }
        }
    }

    // --- AI vs trails & walls ---
    for (const ai of aiDrivers) {
        const ab = ai.bike;
        if (!ab.alive) continue;

        // Walls
        if (ab.x <= 6 || ab.x >= ARENA - 6 || ab.y <= 6 || ab.y >= ARENA - 6) {
            ab.takeDamage(HIT_DMG);
            explode(ab.x, ab.y, ab.color, 15);
            if (!ab.alive) { score += 200; audio.playScore(); }
            continue;
        }

        for (const b of allBikes) {
            const skip = b === ab ? 20 : 0;
            if (hitTrail(ab.x, ab.y, b, skip)) {
                ab.takeDamage(HIT_DMG);
                explode(ab.x, ab.y, ab.color, 15);
                if (!ab.alive) { score += 200; audio.playScore(); }
                break;
            }
        }
    }
}

// ============================================================
// DRAWING
// ============================================================
function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0a0015');
    g.addColorStop(0.3, '#1a0030');
    g.addColorStop(0.6, '#2a0050');
    g.addColorStop(1, '#0a0015');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    const sx = canvas.width / 2, sy = canvas.height * 0.15, sr = 80;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2);
    sg.addColorStop(0, 'rgba(255,100,0,0.8)');
    sg.addColorStop(0.3, 'rgba(255,0,100,0.5)');
    sg.addColorStop(0.6, 'rgba(255,0,255,0.2)');
    sg.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 2, 0, Math.PI * 2); ctx.fill();

    // Sun stripes
    ctx.fillStyle = '#0a0015';
    for (let i = 0; i < 6; i++) {
        const y = sy - sr + i * (sr * 2 / 7) + sr * 0.5;
        ctx.fillRect(sx - sr, y, sr * 2, 3 + i * 1.5);
    }
}

function drawStars(camX, camY) {
    for (const s of stars) {
        const wx = ((s.x - camX * 0.3) % canvas.width + canvas.width) % canvas.width;
        const wy = ((s.y - camY * 0.3) % canvas.height + canvas.height) % canvas.height;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame * s.twinkle));
        ctx.fillStyle = `rgba(255,255,255,${s.bright * tw})`;
        ctx.beginPath(); ctx.arc(wx, wy, s.size, 0, Math.PI * 2); ctx.fill();
    }
}

function drawGrid(camX, camY) {
    gridPulse += 0.02;
    const p = 0.3 + 0.15 * Math.sin(gridPulse);
    ctx.strokeStyle = `rgba(255,0,255,${p * 0.3})`;
    ctx.lineWidth = 1;

    const ox = canvas.width / 2, oy = canvas.height / 2;
    const sx = -(camX % GRID_SP) + ox % GRID_SP;
    const sy = -(camY % GRID_SP) + oy % GRID_SP;

    for (let x = sx; x < canvas.width; x += GRID_SP) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = sy; y < canvas.height; y += GRID_SP) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function drawArena(camX, camY) {
    // Danger zone glow near edges (translucent red tint)
    const zoneW = 80; // pixels in world space
    const pulse = 0.15 + 0.1 * Math.sin(frame * 0.08);

    // Left wall
    const lx = -camX, ly = -camY;
    ctx.fillStyle = `rgba(255,0,60,${pulse})`;
    ctx.fillRect(lx, ly, zoneW, ARENA);
    // Right wall
    ctx.fillRect(lx + ARENA - zoneW, ly, zoneW, ARENA);
    // Top wall
    ctx.fillRect(lx, ly, ARENA, zoneW);
    // Bottom wall
    ctx.fillRect(lx, ly + ARENA - zoneW, ARENA, zoneW);

    // Outer border — thick bright line
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 30;
    ctx.strokeRect(-camX, -camY, ARENA, ARENA);

    // Inner bright edge line
    ctx.strokeStyle = '#ff66ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.strokeRect(-camX + 4, -camY + 4, ARENA - 8, ARENA - 8);
    ctx.shadowBlur = 0;

    // Corner markers
    const corners = [[0, 0], [ARENA, 0], [0, ARENA], [ARENA, ARENA]];
    for (const [cx, cy] of corners) {
        const sx = cx - camX, sy = cy - camY;
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawParticles(camX, camY) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const a = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x - camX, p.y - camY, 2 + (1 - a) * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawFreeBikeIndicators(camX, camY) {
    if (player.onBike) return;
    for (const b of allBikes) {
        if (b.ridden || !b.alive) continue;
        const d = dist(b.x, b.y, player.x, player.y);
        if (d > 250) continue;
        const sx = b.x - camX, sy = b.y - camY;
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.1);
        ctx.strokeStyle = `rgba(170,170,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#aaaaff';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(sx, sy, 20 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
        if (d < 65) {
            ctx.fillStyle = '#aaaaff';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('[E] MOUNT', sx, sy - 28);
            ctx.fillText(`HP: ${b.hp | 0}`, sx, sy - 40);
        }
        ctx.shadowBlur = 0;
    }
}

function drawScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < canvas.height; y += 3) ctx.fillRect(0, y, canvas.width, 1);
}

function drawVignette() {
    const g = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWallWarning() {
    // Screen-edge flash when near arena boundaries
    const warnDist = 150;
    const px = player.x, py = player.y;
    const edges = [];

    if (px < warnDist) edges.push({ side: 'left', urgency: 1 - px / warnDist });
    if (px > ARENA - warnDist) edges.push({ side: 'right', urgency: 1 - (ARENA - px) / warnDist });
    if (py < warnDist) edges.push({ side: 'top', urgency: 1 - py / warnDist });
    if (py > ARENA - warnDist) edges.push({ side: 'bottom', urgency: 1 - (ARENA - py) / warnDist });

    if (edges.length === 0) return;

    const flash = 0.5 + 0.5 * Math.sin(frame * 0.2);

    for (const e of edges) {
        const a = e.urgency * flash * 0.35;
        let grad;
        switch (e.side) {
            case 'left':
                grad = ctx.createLinearGradient(0, 0, 80, 0);
                grad.addColorStop(0, `rgba(255,0,60,${a})`);
                grad.addColorStop(1, 'rgba(255,0,60,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 80, canvas.height);
                break;
            case 'right':
                grad = ctx.createLinearGradient(canvas.width, 0, canvas.width - 80, 0);
                grad.addColorStop(0, `rgba(255,0,60,${a})`);
                grad.addColorStop(1, 'rgba(255,0,60,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(canvas.width - 80, 0, 80, canvas.height);
                break;
            case 'top':
                grad = ctx.createLinearGradient(0, 0, 0, 80);
                grad.addColorStop(0, `rgba(255,0,60,${a})`);
                grad.addColorStop(1, 'rgba(255,0,60,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, 80);
                break;
            case 'bottom':
                grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 80);
                grad.addColorStop(0, `rgba(255,0,60,${a})`);
                grad.addColorStop(1, 'rgba(255,0,60,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
                break;
        }
    }
}

function drawMinimap() {
    const m = minimapCtx, w = 180, h = 180;
    m.clearRect(0, 0, w, h);
    m.fillStyle = 'rgba(10,0,21,0.9)';
    m.fillRect(0, 0, w, h);

    // Grid
    m.strokeStyle = 'rgba(255,0,255,0.15)';
    m.lineWidth = 0.5;
    for (let i = 0; i < w; i += 18) {
        m.beginPath(); m.moveTo(i, 0); m.lineTo(i, h); m.stroke();
        m.beginPath(); m.moveTo(0, i); m.lineTo(w, i); m.stroke();
    }

    const s = w / ARENA;

    // Trails
    m.globalAlpha = 0.4;
    for (const b of allBikes) {
        m.fillStyle = b.trailColor;
        for (let i = 0; i < b.trail.length; i += 4) {
            m.fillRect(b.trail[i].x * s, b.trail[i].y * s, 1, 1);
        }
    }
    m.globalAlpha = 1;

    // Bikes
    for (const b of allBikes) {
        if (!b.alive) continue;
        m.fillStyle = b.color;
        m.beginPath(); m.arc(b.x * s, b.y * s, b === player.bike ? 3 : 2, 0, Math.PI * 2); m.fill();
    }

    // Player on foot
    if (!player.onBike && player.alive) {
        m.fillStyle = PLAYER_CLR;
        m.strokeStyle = '#fff';
        m.lineWidth = 1;
        m.beginPath(); m.arc(player.x * s, player.y * s, 3, 0, Math.PI * 2); m.fill(); m.stroke();
    }

    // Free bikes blink
    m.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 0.08);
    for (const b of allBikes) {
        if (b.ridden || !b.alive) continue;
        m.fillStyle = '#aaaaff';
        m.fillRect(b.x * s - 1, b.y * s - 1, 3, 3);
    }
    m.globalAlpha = 1;
}

function updateHUD() {
    const speed = document.getElementById('hud-speed');
    const hp = document.getElementById('hud-hp');
    const sc = document.getElementById('hud-score');
    const mode = document.getElementById('hud-mode');
    const dismountHint = document.getElementById('hud-dismount');
    const mountHint = document.getElementById('hud-mount');
    const boostFill = document.getElementById('boost-bar-fill');

    if (player.onBike && player.bike) {
        speed.textContent = player.bike.boosting ? 'BOOST' : (player.bike.speed * 20 | 0);
        hp.textContent = player.bike.hp | 0;
        hp.className = player.bike.hp < 30 ? 'warning' : 'value';
        mode.textContent = 'RIDING';
        mode.className = 'value';
        dismountHint.style.display = player.bike.hp < 50 ? 'block' : 'none';
        mountHint.style.display = 'none';
        boostFill.style.width = (player.bike.boostFuel) + '%';
    } else {
        speed.textContent = (FOOT_SPEED * 20 | 0);
        hp.textContent = '-';
        hp.className = 'value';
        mode.textContent = 'ON FOOT';
        mode.className = 'warning';
        dismountHint.style.display = 'none';
        mountHint.style.display = 'block';
        boostFill.style.width = '0%';
    }
    sc.textContent = score;
}

// ============================================================
// OVERLAY HELPERS
// ============================================================
function overlay(display) {
    document.getElementById('message-overlay').style.display = display;
}
function setOverlayText(title, sub, text, ctrl) {
    document.getElementById('msg-title').textContent = title;
    document.getElementById('msg-subtitle').textContent = sub;
    document.getElementById('msg-text').textContent = text;
    document.getElementById('msg-controls').textContent = ctrl;
}
function pauseOverlay(show) {
    document.getElementById('pause-overlay').style.display = show ? 'flex' : 'none';
}

// ============================================================
// MAIN LOOP
// ============================================================
function loop() {
    requestAnimationFrame(loop);
    frame++;

    if (state === 'menu') {
        drawSky();
        const t = frame * 0.02;
        ctx.strokeStyle = `rgba(255,0,255,${0.2 + 0.1 * Math.sin(t)})`;
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += GRID_SP) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += GRID_SP) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        drawScanlines(); drawVignette();
        overlay('block');
        setOverlayText('SYNTHWAVE TRON', 'ENTER THE GRID', 'Press ENTER to start',
            'WASD/Arrows: Steer | E: Dismount/Mount | SPACE: Boost | ESC: Pause');
        return;
    }

    if (state === 'paused') return; // freeze frame, overlay shown

    if (state === 'dead') {
        drawSky();
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ff00ff' : '#00ffff';
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height,
                Math.random() * 4, Math.random() * 4);
        }
        ctx.globalAlpha = 1;
        drawScanlines(); drawVignette();
        return;
    }

    // --- UPDATE ---
    player.update();

    for (const ai of aiDrivers) {
        if (ai.alive) ai.update({ x: player.x, y: player.y });
    }

    // Respawn AI
    if (frame % 600 === 0) {
        const alive = aiDrivers.filter(a => a.alive).length;
        if (alive < NUM_AI) {
            const a = Math.random() * Math.PI * 2;
            const bx = clamp(player.x + Math.cos(a) * 500, 200, ARENA - 200);
            const by = clamp(player.y + Math.sin(a) * 500, 200, ARENA - 200);
            const idx = aiDrivers.length % AI_CLR.length;
            const bike = new LightBike(bx, by, Math.random() * Math.PI * 2, AI_CLR[idx], AI_TRAIL[idx]);
            bike.ridden = true;
            allBikes.push(bike);
            aiDrivers.push(new AIDriver(bike, idx));
        }
    }

    // Spawn free bikes
    if (frame % 300 === 0) {
        const free = allBikes.filter(b => b.alive && !b.ridden).length;
        if (free < 8) spawnFreeBike();
    }

    // Score over time
    if (frame % 30 === 0) score += 10;

    checkCollisions();

    // Death check
    if (!player.alive) {
        state = 'dead';
        audio.playDeath();
        overlay('block');
        setOverlayText('DERESOLVED', `Final Score: ${score}`, 'Press ENTER to restart', '');
        return;
    }

    // --- DRAW ---
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSky();
    drawStars(camX, camY);
    drawGrid(camX, camY);
    drawArena(camX, camY);

    // All bikes & trails
    for (const b of allBikes) b.draw(camX, camY);

    player.draw(camX, camY);
    drawFreeBikeIndicators(camX, camY);
    drawParticles(camX, camY);

    drawScanlines();
    drawVignette();
    drawWallWarning();

    // Subtle chromatic aberration
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.03;
    ctx.drawImage(canvas, -2, 0);
    ctx.drawImage(canvas, 2, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    updateHUD();
    drawMinimap();
}

// --- Start ---
state = 'menu';
overlay('block');
setOverlayText('SYNTHWAVE TRON', 'ENTER THE GRID', 'Press ENTER to start',
    'WASD/Arrows: Steer | E: Dismount/Mount | SPACE: Boost | ESC: Pause');
loop();
