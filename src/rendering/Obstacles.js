// ============================================================
// Obstacle Rendering — Draws walls, pillars, traps, ramps
// ============================================================
import { state } from '../state.js';
import { canvas, ctx } from '../canvas.js';

const TWO_PI = Math.PI * 2;

export function drawObstacles(camX, camY) {
    const playerFloor = (state.player && state.player.floor) || 1;

    // ---- Walls ----
    for (const obs of state.obstacles) {
        if (obs.type === 'wall') {
            drawWall(obs, camX, camY, playerFloor);
        } else if (obs.type === 'pillar') {
            drawPillar(obs, camX, camY, playerFloor);
        }
    }

    // ---- Traps ----
    for (const trap of state.traps) {
        if (trap.type === 'spikes') {
            drawSpikeTrap(trap, camX, camY, playerFloor);
        } else if (trap.type === 'emp') {
            drawEMPZone(trap, camX, camY, playerFloor);
        } else if (trap.type === 'turret') {
            drawTurret(trap, camX, camY, playerFloor);
        }
    }

    // ---- Ramps ----
    for (const ramp of state.ramps) {
        drawRamp(ramp, camX, camY, playerFloor);
    }

    // ---- Turret projectiles ----
    for (const p of state.turretProjectiles) {
        if (p.alive) p.draw(ctx, camX, camY);
    }
}

// === WALL ===
function drawWall(wall, camX, camY, playerFloor) {
    const sx = wall.x - camX, sy = wall.y - camY;
    // Cull off-screen
    if (sx + wall.w < -50 || sx > canvas.width + 50 ||
        sy + wall.h < -50 || sy > canvas.height + 50) return;

    // Walls are on floor 1 — dim if player is on upper floor
    const onSameFloor = playerFloor === 1;
    const alpha = onSameFloor ? 1.0 : 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = onSameFloor ? 15 : 5;
    ctx.fillStyle = '#003344';
    ctx.fillRect(sx, sy, wall.w, wall.h);

    // Neon border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, wall.w, wall.h);

    // Inner highlight line (top edge)
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + 2);
    ctx.lineTo(sx + wall.w - 2, sy + 2);
    ctx.stroke();

    ctx.restore();
    ctx.shadowBlur = 0;
}

// === PILLAR ===
function drawPillar(pillar, camX, camY, playerFloor) {
    const sx = pillar.x - camX, sy = pillar.y - camY;
    const r = pillar.radius;
    if (sx + r < -50 || sx - r > canvas.width + 50 ||
        sy + r < -50 || sy - r > canvas.height + 50) return;

    const onSameFloor = playerFloor === 1;
    const alpha = onSameFloor ? 1.0 : 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Base
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = onSameFloor ? 20 : 5;
    ctx.fillStyle = '#220033';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, TWO_PI);
    ctx.fill();

    // Neon ring
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, TWO_PI);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.6, 0, TWO_PI);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, TWO_PI);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
}

// === SPIKE TRAP ===
function drawSpikeTrap(trap, camX, camY, playerFloor) {
    const sx = trap.x - camX, sy = trap.y - camY;
    if (sx + trap.w < -50 || sx > canvas.width + 50 ||
        sy + trap.h < -50 || sy > canvas.height + 50) return;

    if (playerFloor !== 1) {
        // Just a faint outline when on upper floor
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, trap.w, trap.h);
        ctx.globalAlpha = 1;
        return;
    }

    const active = trap._active;
    const pulse = 0.5 + 0.5 * Math.sin(state.frame * 0.15);

    ctx.save();

    // Warning zone background
    ctx.fillStyle = active ? `rgba(255,0,0,${0.15 + pulse * 0.15})` : 'rgba(255,60,0,0.06)';
    ctx.fillRect(sx, sy, trap.w, trap.h);

    // Border
    ctx.strokeStyle = active ? '#ff0000' : '#ff4400';
    ctx.lineWidth = active ? 2 : 1;
    ctx.shadowColor = active ? '#ff0000' : '#ff4400';
    ctx.shadowBlur = active ? 15 : 5;
    ctx.strokeRect(sx, sy, trap.w, trap.h);

    // Spike pattern when active
    if (active) {
        ctx.fillStyle = '#ff0000';
        const step = 15;
        for (let x = sx + 5; x < sx + trap.w - 5; x += step) {
            for (let y = sy + 5; y < sy + trap.h - 5; y += step) {
                ctx.beginPath();
                ctx.moveTo(x, y - 4);
                ctx.lineTo(x - 3, y + 3);
                ctx.lineTo(x + 3, y + 3);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // "SPIKES" label
    ctx.fillStyle = active ? 'rgba(255,100,100,0.8)' : 'rgba(255,100,100,0.3)';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SPIKES', sx + trap.w / 2, sy + trap.h / 2 + 3);

    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// === EMP ZONE ===
function drawEMPZone(emp, camX, camY, playerFloor) {
    const sx = emp.x - camX, sy = emp.y - camY;
    if (sx + emp.w < -50 || sx > canvas.width + 50 ||
        sy + emp.h < -50 || sy > canvas.height + 50) return;

    if (playerFloor !== 1) {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#4444ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, emp.w, emp.h);
        ctx.globalAlpha = 1;
        return;
    }

    const pulse = 0.3 + 0.2 * Math.sin(state.frame * 0.06);
    ctx.save();

    // Electromagnetic field effect
    ctx.fillStyle = `rgba(40,40,180,${pulse * 0.15})`;
    ctx.fillRect(sx, sy, emp.w, emp.h);

    // Flickering border
    ctx.strokeStyle = `rgba(80,80,255,${pulse})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#4444ff';
    ctx.shadowBlur = 10;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(sx, sy, emp.w, emp.h);
    ctx.setLineDash([]);

    // Interference lines
    ctx.strokeStyle = `rgba(80,80,255,${pulse * 0.3})`;
    ctx.lineWidth = 0.5;
    for (let y = sy + 10; y < sy + emp.h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        for (let x = sx; x < sx + emp.w; x += 8) {
            ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
        }
        ctx.stroke();
    }

    // Label
    ctx.fillStyle = `rgba(100,100,255,${0.4 + pulse * 0.2})`;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EMP ZONE', sx + emp.w / 2, sy + emp.h / 2 + 3);
    ctx.fillText('NO BOOST', sx + emp.w / 2, sy + emp.h / 2 + 15);

    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// === TURRET ===
function drawTurret(turret, camX, camY, playerFloor) {
    const sx = turret.x - camX, sy = turret.y - camY;
    if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return;

    const onSameFloor = playerFloor === 1;
    const alpha = onSameFloor ? 1.0 : 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx, sy);

    // Base
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = onSameFloor ? 12 : 4;
    ctx.fillStyle = '#331111';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TWO_PI);
    ctx.fill();

    // Ring
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TWO_PI);
    ctx.stroke();

    // Barrel direction
    const dirMap = { north: -Math.PI / 2, south: Math.PI / 2, east: 0, west: Math.PI };
    const angle = dirMap[turret.direction] ?? 0;
    ctx.rotate(angle);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(0, -3, 18, 6);

    // Firing indicator pulse
    const interval = turret.interval || 120;
    const timeToFire = interval - (turret._timer % interval);
    if (timeToFire < 20 && onSameFloor) {
        const warn = 1 - timeToFire / 20;
        ctx.fillStyle = `rgba(255,0,0,${warn * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, 18, -0.3, 0.3);
        ctx.fill();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

// === RAMP ===
function drawRamp(ramp, camX, camY, playerFloor) {
    const sx = ramp.x - camX, sy = ramp.y - camY;
    if (sx + ramp.w < -50 || sx > canvas.width + 50 ||
        sy + ramp.h < -50 || sy > canvas.height + 50) return;

    // Ramps are visible on both connected floors
    const canUse = playerFloor === ramp.fromFloor || playerFloor === ramp.toFloor;
    const alpha = canUse ? 0.9 : 0.15;
    const pulse = 0.5 + 0.5 * Math.sin(state.frame * 0.1);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Ramp surface
    const grad = ctx.createLinearGradient(sx, sy, sx + ramp.w, sy + ramp.h);
    grad.addColorStop(0, `rgba(0,255,128,${0.1 + pulse * 0.1})`);
    grad.addColorStop(1, `rgba(0,255,255,${0.1 + pulse * 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, ramp.w, ramp.h);

    // Border
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = canUse ? 12 : 3;
    ctx.strokeRect(sx, sy, ramp.w, ramp.h);

    // Direction arrows
    ctx.fillStyle = `rgba(0,255,128,${0.4 + pulse * 0.3})`;
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    const cx = sx + ramp.w / 2, cy = sy + ramp.h / 2;
    const arrows = { north: '▲', south: '▼', east: '►', west: '◄' };
    ctx.fillText(arrows[ramp.direction] || '▲', cx, cy - 4);

    // Floor label
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(0,255,128,0.6)';
    ctx.fillText(`F${ramp.fromFloor}→F${ramp.toFloor}`, cx, cy + 12);

    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// Draw obstacle markers on the minimap
export function drawObstaclesMinimap(mCtx, scale) {
    // Walls
    mCtx.fillStyle = 'rgba(0,255,255,0.35)';
    for (const obs of state.obstacles) {
        if (obs.type === 'wall') {
            mCtx.fillRect(obs.x * scale, obs.y * scale,
                Math.max(1, obs.w * scale), Math.max(1, obs.h * scale));
        } else if (obs.type === 'pillar') {
            mCtx.beginPath();
            mCtx.arc(obs.x * scale, obs.y * scale, Math.max(1, obs.radius * scale), 0, TWO_PI);
            mCtx.fill();
        }
    }

    // Traps (spikes = red, EMP = blue, turret = orange)
    for (const trap of state.traps) {
        if (trap.type === 'spikes') {
            mCtx.fillStyle = trap._active ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.2)';
            mCtx.fillRect(trap.x * scale, trap.y * scale,
                Math.max(1, trap.w * scale), Math.max(1, trap.h * scale));
        } else if (trap.type === 'emp') {
            mCtx.fillStyle = 'rgba(80,80,255,0.2)';
            mCtx.fillRect(trap.x * scale, trap.y * scale,
                Math.max(1, trap.w * scale), Math.max(1, trap.h * scale));
        } else if (trap.type === 'turret') {
            mCtx.fillStyle = '#ff6600';
            mCtx.beginPath();
            mCtx.arc(trap.x * scale, trap.y * scale, 2, 0, TWO_PI);
            mCtx.fill();
        }
    }

    // Ramps
    mCtx.fillStyle = 'rgba(0,255,128,0.35)';
    for (const ramp of state.ramps) {
        mCtx.fillRect(ramp.x * scale, ramp.y * scale,
            Math.max(1, ramp.w * scale), Math.max(1, ramp.h * scale));
    }
}
