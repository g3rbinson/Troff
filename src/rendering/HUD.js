import { ARENA, FOOT_SPEED, PLAYER_CLR, DISC_COOLDOWN } from '../constants.js';
import { state } from '../state.js';
import { minimapCanvas, minimapCtx } from '../canvas.js';
import { drawObstaclesMinimap } from './Obstacles.js';

export function updateHUD() {
    const { player } = state;
    const speed = document.getElementById('hud-speed');
    const hp = document.getElementById('hud-hp');
    const sc = document.getElementById('hud-score');
    const mode = document.getElementById('hud-mode');
    const dismountHint = document.getElementById('hud-dismount');
    const mountHint = document.getElementById('hud-mount');
    const boostFill = document.getElementById('boost-bar-fill');
    const discFill = document.getElementById('disc-bar-fill');

    if (player.onBike && player.bike) {
        speed.textContent = player.bike.boosting ? 'BOOST' : (player.bike.speed * 20 | 0);
        hp.textContent = player.bike.hp | 0;
        hp.className = player.bike.hp < 30 ? 'warning' : 'value';
        mode.textContent = 'RIDING';
        mode.className = 'value';
        dismountHint.style.display = player.bike.hp < 50 ? 'block' : 'none';
        mountHint.style.display = 'none';
        boostFill.style.width = player.bike.boostFuel + '%';
        if (discFill) {
            const cd = player.bike.discCooldown;
            discFill.style.width = ((DISC_COOLDOWN - cd) / DISC_COOLDOWN * 100) + '%';
        }
    } else {
        speed.textContent = (FOOT_SPEED * 20 | 0);
        hp.textContent = '-';
        hp.className = 'value';
        mode.textContent = 'ON FOOT';
        mode.className = 'warning';
        dismountHint.style.display = 'none';
        mountHint.style.display = 'block';
        boostFill.style.width = '0%';
        if (discFill) discFill.style.width = '0%';
    }
    sc.textContent = state.score;

    // Floor indicator (only if level has multiple floors)
    let floorEl = document.getElementById('hud-floor');
    if (state.levelFloors > 1) {
        if (!floorEl) {
            floorEl = document.createElement('div');
            floorEl.id = 'hud-floor';
            floorEl.style.cssText = 'color:#00ff88;font-size:14px;font-family:"Courier New",monospace;text-shadow:0 0 8px #00ff88;';
            const hud = document.getElementById('hud');
            if (hud) hud.appendChild(floorEl);
        }
        const pFloor = (player.floor || 1);
        floorEl.textContent = `FLOOR ${pFloor} / ${state.levelFloors}`;
        floorEl.style.display = '';
    } else if (floorEl) {
        floorEl.style.display = 'none';
    }
}

export function drawMinimap() {
    const { allBikes, player, projectiles } = state;
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

    // Obstacles on minimap
    drawObstaclesMinimap(m, s);

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
        m.beginPath();
        m.arc(b.x * s, b.y * s, b === player.bike ? 3 : 2, 0, Math.PI * 2);
        m.fill();
    }

    // Player on foot
    if (!player.onBike && player.alive) {
        m.fillStyle = PLAYER_CLR;
        m.strokeStyle = '#fff';
        m.lineWidth = 1;
        m.beginPath();
        m.arc(player.x * s, player.y * s, 3, 0, Math.PI * 2);
        m.fill(); m.stroke();
    }

    // Free bikes blink
    m.globalAlpha = 0.5 + 0.5 * Math.sin(state.frame * 0.08);
    for (const b of allBikes) {
        if (b.ridden || !b.alive) continue;
        m.fillStyle = '#aaaaff';
        m.fillRect(b.x * s - 1, b.y * s - 1, 3, 3);
    }
    m.globalAlpha = 1;

    // Projectiles
    m.globalAlpha = 0.9;
    for (const p of projectiles) {
        if (!p.alive) continue;
        m.fillStyle = p.color;
        m.beginPath();
        m.arc(p.x * s, p.y * s, 2, 0, Math.PI * 2);
        m.fill();
    }
    m.globalAlpha = 1;

    // AI on foot
    const { aiDrivers } = state;
    if (aiDrivers) {
        for (const ai of aiDrivers) {
            if (!ai.onFoot || !ai.alive) continue;
            m.fillStyle = '#ff4444';
            m.globalAlpha = 0.5 + 0.5 * Math.sin(state.frame * 0.1);
            m.fillRect(ai.footX * s - 1, ai.footY * s - 1, 3, 3);
        }
        m.globalAlpha = 1;
    }
}
