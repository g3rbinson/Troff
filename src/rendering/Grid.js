import { ARENA, GRID_SP } from '../constants.js';
import { state } from '../state.js';
import { canvas, ctx } from '../canvas.js';

export function drawGrid(camX, camY) {
    state.gridPulse += 0.02;
    const p = 0.3 + 0.15 * Math.sin(state.gridPulse);
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

export function drawArena(camX, camY) {
    // Danger zone glow
    const zoneW = 80;
    const pulse = 0.15 + 0.1 * Math.sin(state.frame * 0.08);
    const lx = -camX, ly = -camY;

    ctx.fillStyle = `rgba(255,0,60,${pulse})`;
    ctx.fillRect(lx, ly, zoneW, ARENA);
    ctx.fillRect(lx + ARENA - zoneW, ly, zoneW, ARENA);
    ctx.fillRect(lx, ly, ARENA, zoneW);
    ctx.fillRect(lx, ly + ARENA - zoneW, ARENA, zoneW);

    // Outer border
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 30;
    ctx.strokeRect(-camX, -camY, ARENA, ARENA);

    // Inner border
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
