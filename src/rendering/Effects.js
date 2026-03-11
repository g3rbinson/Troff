import { ARENA } from '../constants.js';
import { state } from '../state.js';
import { canvas, ctx } from '../canvas.js';

export function drawScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < canvas.height; y += 3) ctx.fillRect(0, y, canvas.width, 1);
}

export function drawVignette() {
    const g = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawWallWarning() {
    const warnDist = 200;
    const px = state.player.x, py = state.player.y;
    const edges = [];

    if (px < warnDist) edges.push({ side: 'left', urgency: 1 - px / warnDist });
    if (px > ARENA - warnDist) edges.push({ side: 'right', urgency: 1 - (ARENA - px) / warnDist });
    if (py < warnDist) edges.push({ side: 'top', urgency: 1 - py / warnDist });
    if (py > ARENA - warnDist) edges.push({ side: 'bottom', urgency: 1 - (ARENA - py) / warnDist });

    if (edges.length === 0) return;

    const flash = 0.5 + 0.5 * Math.sin(state.frame * 0.2);

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

export function drawChromaticAberration() {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.03;
    ctx.drawImage(canvas, -2, 0);
    ctx.drawImage(canvas, 2, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

export function drawParticles(camX, camY) {
    const particles = state.particles;
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

export function drawFreeBikeIndicators(camX, camY) {
    const { player, allBikes } = state;
    if (player.onBike) return;
    for (const b of allBikes) {
        if (b.ridden || !b.alive) continue;
        const dx = b.x - player.x, dy = b.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 250) continue;
        const sx = b.x - camX, sy = b.y - camY;
        const pulse = 0.5 + 0.5 * Math.sin(state.frame * 0.1);
        ctx.strokeStyle = `rgba(170,170,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#aaaaff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 20 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
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
