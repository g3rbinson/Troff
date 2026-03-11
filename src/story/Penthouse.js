// ============================================================
// Penthouse — Canvas-rendered penthouse scene
// ============================================================
import { canvas, ctx } from '../canvas.js';
import { state } from '../state.js';

// --- Pixel-city skyline (generated once) ---
let buildings = null;

function generateBuildings() {
    buildings = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
        const w = 30 + Math.random() * 60;
        const h = 80 + Math.random() * 280;
        buildings.push({
            x: (i / count) * (canvas.width + 200) - 100,
            w,
            h,
            hue: Math.random() > 0.5 ? 280 : 190, // magenta or cyan family
            windows: Math.floor(h / 20),
            windowCols: Math.max(1, Math.floor(w / 15)),
            antennaHeight: Math.random() > 0.6 ? 10 + Math.random() * 30 : 0,
        });
    }
    buildings.sort((a, b) => b.h - a.h); // tallest in back
}

// --- Draw the pixel city skyline ---
function drawCitySkyline(t) {
    if (!buildings || buildings.length === 0) generateBuildings();

    const groundY = canvas.height * 0.65;

    // Dark sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, '#050010');
    g.addColorStop(0.4, '#0a0020');
    g.addColorStop(0.8, '#15003a');
    g.addColorStop(1, '#1a0045');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, groundY);

    // Stars
    for (let i = 0; i < 80; i++) {
        const sx = (i * 137.5 + 50) % canvas.width;
        const sy = (i * 97.3 + 20) % (groundY * 0.7);
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.02 + i));
        ctx.fillStyle = `rgba(255,255,255,${tw * 0.6})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Distant glow on horizon
    const hg = ctx.createRadialGradient(canvas.width / 2, groundY, 0, canvas.width / 2, groundY, canvas.width * 0.6);
    hg.addColorStop(0, 'rgba(255,0,180,0.15)');
    hg.addColorStop(0.5, 'rgba(100,0,255,0.05)');
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, canvas.width, groundY);

    // Buildings
    for (const b of buildings) {
        const bx = b.x;
        const by = groundY - b.h;

        // Building body
        ctx.fillStyle = `hsl(${b.hue}, 30%, 6%)`;
        ctx.fillRect(bx, by, b.w, b.h);

        // Outline glow
        ctx.strokeStyle = `hsla(${b.hue}, 100%, 50%, 0.15)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        // Windows
        const wp = 4, ws = 6;
        for (let row = 0; row < b.windows; row++) {
            for (let col = 0; col < b.windowCols; col++) {
                const wx = bx + wp + col * (ws + wp + 2);
                const wy = by + wp + row * (ws + wp + 6);
                if (wx + ws > bx + b.w - 2) continue;
                const lit = Math.sin(t * 0.01 + row * 3.7 + col * 7.1 + b.x) > -0.3;
                if (lit) {
                    const wClr = b.hue > 250 ? 'rgba(255,0,255,' : 'rgba(0,255,255,';
                    ctx.fillStyle = wClr + (0.3 + 0.2 * Math.sin(t * 0.03 + row + col)) + ')';
                } else {
                    ctx.fillStyle = 'rgba(20,0,40,0.8)';
                }
                ctx.fillRect(wx, wy, ws, ws);
            }
        }

        // Antenna
        if (b.antennaHeight > 0) {
            ctx.strokeStyle = 'rgba(255,0,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + b.w / 2, by);
            ctx.lineTo(bx + b.w / 2, by - b.antennaHeight);
            ctx.stroke();
            // Blinking light
            if (Math.sin(t * 0.05 + b.x) > 0.5) {
                ctx.fillStyle = 'rgba(255,0,0,0.9)';
                ctx.beginPath();
                ctx.arc(bx + b.w / 2, by - b.antennaHeight, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// --- Draw the penthouse interior ---
function drawPenthouseInterior(t) {
    const groundY = canvas.height * 0.65;

    // Floor
    const fg = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    fg.addColorStop(0, '#12002a');
    fg.addColorStop(1, '#080014');
    ctx.fillStyle = fg;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // Floor grid lines (perspective)
    ctx.strokeStyle = 'rgba(255,0,255,0.12)';
    ctx.lineWidth = 1;
    const vanishX = canvas.width / 2;
    const vanishY = groundY;
    for (let i = 0; i < 20; i++) {
        const y = groundY + i * ((canvas.height - groundY) / 15);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
        const bx = vanishX + i * 120;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(bx, canvas.height);
        ctx.stroke();
    }

    // Window frame
    const wx = canvas.width * 0.05;
    const wy = canvas.height * 0.05;
    const ww = canvas.width * 0.9;
    const wh = groundY - wy;
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, wy, ww, wh);

    // Window vertical dividers
    for (let i = 1; i < 4; i++) {
        const dx = wx + (ww / 4) * i;
        ctx.beginPath();
        ctx.moveTo(dx, wy);
        ctx.lineTo(dx, wy + wh);
        ctx.stroke();
    }

    // Penthouse label
    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('FLOOR 99 — PENTHOUSE SUITE', wx + 10, wy + wh + 20);

    // Furniture silhouettes — couch
    const couchX = canvas.width * 0.15;
    const couchY = canvas.height * 0.78;
    ctx.fillStyle = 'rgba(40,0,80,0.8)';
    ctx.fillRect(couchX, couchY, 200, 40);
    ctx.fillRect(couchX - 10, couchY - 30, 20, 70);
    ctx.fillRect(couchX + 190, couchY - 30, 20, 70);
    ctx.strokeStyle = 'rgba(255,0,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(couchX, couchY, 200, 40);

    // Table
    const tableX = canvas.width * 0.6;
    const tableY = canvas.height * 0.8;
    ctx.fillStyle = 'rgba(30,0,60,0.9)';
    ctx.fillRect(tableX, tableY, 120, 15);
    ctx.fillRect(tableX + 10, tableY + 15, 10, 30);
    ctx.fillRect(tableX + 100, tableY + 15, 10, 30);
    ctx.strokeStyle = 'rgba(0,255,255,0.15)';
    ctx.strokeRect(tableX, tableY, 120, 15);

    // Holographic display on table
    const hdAlpha = 0.3 + 0.15 * Math.sin(t * 0.04);
    ctx.fillStyle = `rgba(0,255,255,${hdAlpha})`;
    ctx.beginPath();
    ctx.moveTo(tableX + 40, tableY - 5);
    ctx.lineTo(tableX + 80, tableY - 5);
    ctx.lineTo(tableX + 70, tableY - 40);
    ctx.lineTo(tableX + 50, tableY - 40);
    ctx.closePath();
    ctx.fill();
}

// --- Draw the manager character ---
export function drawManager(t, speaking) {
    const mx = canvas.width * 0.72;
    const my = canvas.height * 0.58;

    // Body
    ctx.fillStyle = '#1a0040';
    ctx.fillRect(mx - 15, my, 30, 50);
    ctx.strokeStyle = 'rgba(255,0,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 15, my, 30, 50);

    // Head
    ctx.fillStyle = '#2a0060';
    ctx.beginPath();
    ctx.arc(mx, my - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    ctx.stroke();

    // Eyes (glow)
    const eyeGlow = speaking ? 0.9 : 0.4 + 0.3 * Math.sin(t * 0.05);
    ctx.fillStyle = `rgba(0,255,255,${eyeGlow})`;
    ctx.fillRect(mx - 6, my - 12, 4, 3);
    ctx.fillRect(mx + 2, my - 12, 4, 3);

    // Mouth (animated when speaking)
    if (speaking) {
        const mh = 2 + 2 * Math.abs(Math.sin(t * 0.15));
        ctx.fillStyle = 'rgba(255,0,255,0.7)';
        ctx.fillRect(mx - 4, my - 2, 8, mh);
    }

    // Legs
    ctx.fillStyle = '#1a0040';
    ctx.fillRect(mx - 12, my + 50, 10, 25);
    ctx.fillRect(mx + 2, my + 50, 10, 25);

    // Briefcase
    ctx.fillStyle = 'rgba(80,0,120,0.8)';
    ctx.fillRect(mx + 22, my + 30, 18, 14);
    ctx.strokeStyle = 'rgba(255,0,255,0.4)';
    ctx.strokeRect(mx + 22, my + 30, 18, 14);

    // Name label
    ctx.fillStyle = 'rgba(0,255,255,0.5)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MANAGER', mx, my + 88);
    ctx.textAlign = 'left';
}

// --- Main penthouse draw call ---
export function drawPenthouse(t, managerVisible, managerSpeaking) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCitySkyline(t);
    drawPenthouseInterior(t);
    if (managerVisible) drawManager(t, managerSpeaking);
}

// Regenerate buildings on resize
export function resetPenthouse() {
    buildings = null;
}
