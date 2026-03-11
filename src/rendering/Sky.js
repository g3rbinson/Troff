import { ARENA } from '../constants.js';
import { state } from '../state.js';
import { canvas, ctx } from '../canvas.js';

export function generateStars() {
    state.stars = [];
    for (let i = 0; i < 300; i++) {
        state.stars.push({
            x: Math.random() * ARENA,
            y: Math.random() * ARENA,
            size: Math.random() * 2 + 0.5,
            bright: Math.random(),
            twinkle: 0.01 + Math.random() * 0.05
        });
    }
}

export function drawSky() {
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
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun stripes
    ctx.fillStyle = '#0a0015';
    for (let i = 0; i < 6; i++) {
        const y = sy - sr + i * (sr * 2 / 7) + sr * 0.5;
        ctx.fillRect(sx - sr, y, sr * 2, 3 + i * 1.5);
    }
}

export function drawStars(camX, camY) {
    for (const s of state.stars) {
        const wx = ((s.x - camX * 0.3) % canvas.width + canvas.width) % canvas.width;
        const wy = ((s.y - camY * 0.3) % canvas.height + canvas.height) % canvas.height;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(state.frame * s.twinkle));
        ctx.fillStyle = `rgba(255,255,255,${s.bright * tw})`;
        ctx.beginPath();
        ctx.arc(wx, wy, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
