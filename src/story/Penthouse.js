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

    // ---- Station Objects ----
    drawStereo(t);
    drawCouch(t);
    drawComputer(t);
    drawWardrobe(t);
    drawElevatorDoors(t);
}

// --- Couch + table (moved from inline) ---
function drawCouch(t) {
    const couchX = canvas.width * 0.40;
    const couchY = canvas.height * 0.78;
    ctx.fillStyle = 'rgba(40,0,80,0.8)';
    ctx.fillRect(couchX, couchY, 160, 35);
    ctx.fillRect(couchX - 8, couchY - 25, 16, 60);
    ctx.fillRect(couchX + 152, couchY - 25, 16, 60);
    ctx.strokeStyle = 'rgba(255,0,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(couchX, couchY, 160, 35);

    // Small side table
    const tableX = couchX + 170;
    const tableY = canvas.height * 0.80;
    ctx.fillStyle = 'rgba(30,0,60,0.9)';
    ctx.fillRect(tableX, tableY, 50, 12);
    ctx.fillRect(tableX + 5, tableY + 12, 8, 20);
    ctx.fillRect(tableX + 37, tableY + 12, 8, 20);
    ctx.strokeStyle = 'rgba(0,255,255,0.15)';
    ctx.strokeRect(tableX, tableY, 50, 12);

    // Holographic display on table
    const hdAlpha = 0.3 + 0.15 * Math.sin(t * 0.04);
    ctx.fillStyle = `rgba(0,255,255,${hdAlpha})`;
    ctx.beginPath();
    ctx.moveTo(tableX + 10, tableY - 3);
    ctx.lineTo(tableX + 40, tableY - 3);
    ctx.lineTo(tableX + 35, tableY - 30);
    ctx.lineTo(tableX + 15, tableY - 30);
    ctx.closePath();
    ctx.fill();
}

// --- Stereo / Boombox ---
function drawStereo(t) {
    const sx = canvas.width * 0.28;
    const sy = canvas.height * 0.76;
    const w = 80, h = 50;

    // Stand/shelf
    ctx.fillStyle = 'rgba(20,0,50,0.9)';
    ctx.fillRect(sx - 5, sy + h, w + 10, 8);
    ctx.fillRect(sx + 10, sy + h + 8, 12, 22);
    ctx.fillRect(sx + w - 22, sy + h + 8, 12, 22);

    // Body
    ctx.fillStyle = 'rgba(30,0,70,0.9)';
    ctx.fillRect(sx, sy, w, h);
    ctx.strokeStyle = 'rgba(255,0,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, w, h);

    // Speaker cones (pulsing)
    const pulse = 1 + 0.15 * Math.sin(t * 0.12);
    for (let i = 0; i < 2; i++) {
        const cx = sx + 18 + i * 44;
        const cy = sy + h / 2;
        const r = 14 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80,0,160,0.6)';
        ctx.fill();
        ctx.strokeStyle = `rgba(255,0,255,${0.4 + 0.2 * Math.sin(t * 0.1 + i)})`;
        ctx.stroke();
        // Inner cone
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,0,200,0.5)';
        ctx.fill();
    }

    // EQ bars between speakers
    const barX = sx + 32;
    for (let i = 0; i < 5; i++) {
        const bh = 5 + 15 * Math.abs(Math.sin(t * 0.08 + i * 1.3));
        const by = sy + h / 2 + 10 - bh;
        ctx.fillStyle = `rgba(0,255,255,${0.4 + 0.2 * Math.sin(t * 0.06 + i)})`;
        ctx.fillRect(barX + i * 4, by, 2, bh);
    }

    // Label
    ctx.fillStyle = 'rgba(0,255,255,0.3)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STEREO', sx + w / 2, sy + h + h * 0.8);
    ctx.textAlign = 'left';
}

// --- Computer Terminal ---
function drawComputer(t) {
    const cx = canvas.width * 0.60;
    const cy = canvas.height * 0.72;
    const mw = 90, mh = 65;

    // Desk
    ctx.fillStyle = 'rgba(20,0,50,0.9)';
    ctx.fillRect(cx - 15, cy + mh + 5, mw + 30, 10);
    ctx.fillRect(cx, cy + mh + 15, 12, 25);
    ctx.fillRect(cx + mw - 12, cy + mh + 15, 12, 25);

    // Monitor frame
    ctx.fillStyle = 'rgba(10,0,30,0.95)';
    ctx.fillRect(cx, cy, mw, mh);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, mw, mh);

    // Monitor stand
    ctx.fillStyle = 'rgba(30,0,60,0.8)';
    ctx.fillRect(cx + mw / 2 - 8, cy + mh, 16, 8);
    ctx.fillRect(cx + mw / 2 - 20, cy + mh + 5, 40, 4);

    // Screen content — scrolling code lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 3, cy + 3, mw - 6, mh - 6);
    ctx.clip();
    const scrollY = (t * 0.5) % 100;
    for (let i = 0; i < 12; i++) {
        const ly = cy + 10 + i * 8 - scrollY % 8;
        if (ly < cy + 3 || ly > cy + mh - 3) continue;
        const lineW = 15 + ((i * 37 + 11) % 40);
        ctx.fillStyle = `rgba(0,255,255,${0.15 + 0.1 * Math.sin(t * 0.03 + i)})`;
        ctx.fillRect(cx + 6, ly, lineW, 3);
    }
    // Blinking cursor
    if (Math.sin(t * 0.1) > 0) {
        ctx.fillStyle = 'rgba(0,255,255,0.8)';
        ctx.fillRect(cx + 6, cy + mh - 14, 5, 7);
    }
    ctx.restore();

    // Keyboard
    const kx = cx + 5, ky = cy + mh + 12;
    ctx.fillStyle = 'rgba(20,0,50,0.8)';
    ctx.fillRect(kx, ky, mw - 10, 16);
    ctx.strokeStyle = 'rgba(255,0,255,0.2)';
    ctx.strokeRect(kx, ky, mw - 10, 16);
    // Key rows
    for (let r = 0; r < 3; r++) {
        for (let k = 0; k < 8; k++) {
            ctx.fillStyle = 'rgba(60,0,120,0.4)';
            ctx.fillRect(kx + 3 + k * 9.5, ky + 2 + r * 5, 7, 3);
        }
    }

    // Label
    ctx.fillStyle = 'rgba(0,255,255,0.3)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINAL', cx + mw / 2, cy + mh + 38);
    ctx.textAlign = 'left';
}

// --- Wardrobe ---
function drawWardrobe(t) {
    const wx = canvas.width * 0.74;
    const wy = canvas.height * 0.64;
    const ww = 70, wh = 100;

    // Wardrobe body
    ctx.fillStyle = 'rgba(25,0,55,0.95)';
    ctx.fillRect(wx, wy, ww, wh);

    // Neon trim
    ctx.strokeStyle = `rgba(255,0,255,${0.3 + 0.15 * Math.sin(t * 0.04)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, ww, wh);

    // Door split line
    ctx.strokeStyle = 'rgba(255,0,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy + 4);
    ctx.lineTo(wx + ww / 2, wy + wh - 4);
    ctx.stroke();

    // Door handles
    ctx.fillStyle = 'rgba(0,255,255,0.5)';
    ctx.fillRect(wx + ww / 2 - 6, wy + wh / 2 - 4, 4, 8);
    ctx.fillRect(wx + ww / 2 + 2, wy + wh / 2 - 4, 4, 8);

    // Clothes outlines visible through gap at top
    ctx.strokeStyle = 'rgba(255,0,255,0.12)';
    ctx.lineWidth = 1;
    // Hangers
    for (let i = 0; i < 4; i++) {
        const hx = wx + 10 + i * 15;
        const hy = wy + 8;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 6, hy + 4);
        ctx.lineTo(hx - 6, hy + 4);
        ctx.closePath();
        ctx.stroke();
        // Shirt shape below
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy + 5);
        ctx.lineTo(hx + 5, hy + 5);
        ctx.lineTo(hx + 4, hy + 18);
        ctx.lineTo(hx - 4, hy + 18);
        ctx.closePath();
        ctx.stroke();
    }

    // Label
    ctx.fillStyle = 'rgba(255,0,255,0.3)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WARDROBE', wx + ww / 2, wy + wh + 14);
    ctx.textAlign = 'left';
}

// --- Elevator Doors ---
function drawElevatorDoors(t) {
    const ex = canvas.width * 0.89;
    const ey = canvas.height * 0.62;
    const ew = 70, eh = 110;

    // Door frame
    ctx.fillStyle = 'rgba(15,0,35,0.95)';
    ctx.fillRect(ex, ey, ew, eh);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ex, ey, ew, eh);

    // Doors (slight gap in center)
    const gap = 2 + Math.sin(t * 0.02) * 0.5;
    ctx.fillStyle = 'rgba(20,0,45,0.9)';
    ctx.fillRect(ex + 3, ey + 3, ew / 2 - gap - 3, eh - 6);
    ctx.fillRect(ex + ew / 2 + gap, ey + 3, ew / 2 - gap - 3, eh - 6);

    // Door seam glow
    ctx.strokeStyle = `rgba(0,255,255,${0.1 + 0.05 * Math.sin(t * 0.06)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex + ew / 2, ey + 3);
    ctx.lineTo(ex + ew / 2, ey + eh - 3);
    ctx.stroke();

    // Floor indicator above doors
    const diW = 40, diH = 18;
    const diX = ex + ew / 2 - diW / 2;
    const diY = ey - diH - 5;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(diX, diY, diW, diH);
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(diX, diY, diW, diH);
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FL 99', ex + ew / 2, diY + 13);
    ctx.textAlign = 'left';

    // Call button
    const bx = ex + ew + 6, by = ey + eh / 2 - 6;
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,0,255,${0.3 + 0.2 * Math.sin(t * 0.08)})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,0,255,0.4)';
    ctx.stroke();

    // Down arrow on button
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(bx, by + 3);
    ctx.lineTo(bx - 2, by - 1);
    ctx.lineTo(bx + 2, by - 1);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(0,255,255,0.3)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATOR', ex + ew / 2, ey + eh + 14);
    ctx.textAlign = 'left';
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

    // Zone highlight (draw under avatar)
    if (state.penthouseInteraction && state.penthousePhase === 'idle' && !state.penthouseUI) {
        drawZoneHighlight(t, state.penthouseInteraction);
    }

    // Player avatar (only when idle / free to walk)
    if (state.penthousePhase === 'idle' || state.penthousePhase === 'dialogue_before' || state.penthousePhase === 'dialogue_after') {
        drawPlayerAvatar(t, state.penthousePlayerX, state.penthousePlayerDir);
    }

    // Interaction prompt
    if (state.penthouseInteraction && state.penthousePhase === 'idle' && !state.penthouseUI && !state.elevatorPicker) {
        drawInteractionPrompt(t, state.penthousePlayerX, state.penthouseInteraction);
    }

    // Placeholder UI overlay
    if (state.penthouseUI) {
        drawPlaceholderUI(t, state.penthouseUI);
    }
}

// --- Player Avatar (magenta figure) ---
function drawPlayerAvatar(t, normX, dir) {
    const floorY = canvas.height * 0.82;
    const px = canvas.width * 0.03 + normX * canvas.width * 0.94; // map 0–1 to room bounds
    const bob = Math.sin(t * 0.1) * 1.5;

    // Glow under feet
    const glow = ctx.createRadialGradient(px, floorY + 2, 0, px, floorY + 2, 18);
    glow.addColorStop(0, 'rgba(255,0,255,0.15)');
    glow.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(px - 18, floorY - 8, 36, 20);

    // Body
    ctx.fillStyle = 'rgba(200,0,255,0.9)';
    ctx.fillRect(px - 6, floorY - 30 + bob, 12, 22);

    // Head
    ctx.fillStyle = 'rgba(220,0,255,0.95)';
    ctx.beginPath();
    ctx.arc(px, floorY - 36 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Visor (direction indicator)
    ctx.fillStyle = 'rgba(0,255,255,0.9)';
    ctx.fillRect(px + dir * 2 - 3, floorY - 38 + bob, 6, 2);

    // Legs
    ctx.fillStyle = 'rgba(160,0,220,0.8)';
    ctx.fillRect(px - 5, floorY - 8 + bob, 4, 10);
    ctx.fillRect(px + 1, floorY - 8 + bob, 4, 10);

    // Neon outline
    ctx.strokeStyle = 'rgba(255,0,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 6, floorY - 30 + bob, 12, 22);
}

// --- Zone highlight (subtle glow on object when player overlaps) ---
function drawZoneHighlight(t, zone) {
    const pulse = 0.15 + 0.1 * Math.sin(t * 0.08);
    const midX = canvas.width * 0.03 + ((zone.xMin + zone.xMax) / 2) * canvas.width * 0.94;
    const halfW = ((zone.xMax - zone.xMin) / 2) * canvas.width * 0.94;
    const groundY = canvas.height * 0.65;

    // Glow on floor under object
    const g = ctx.createRadialGradient(midX, groundY, 0, midX, groundY, halfW + 30);
    g.addColorStop(0, `rgba(0,255,255,${pulse})`);
    g.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(midX - halfW - 30, groundY - 20, (halfW + 30) * 2, 40);
}

// --- Interaction Prompt ---
function drawInteractionPrompt(t, normX, zone) {
    const px = canvas.width * 0.03 + normX * canvas.width * 0.94;
    const floorY = canvas.height * 0.82;
    const promptY = floorY - 55;

    const alpha = 0.6 + 0.3 * Math.sin(t * 0.08);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New", monospace';

    // Background pill
    const text = `[ E ]  ${zone.prompt}`;
    const tw = ctx.measureText(text).width + 20;
    ctx.fillStyle = `rgba(0,0,0,0.6)`;
    ctx.fillRect(px - tw / 2, promptY - 12, tw, 22);
    ctx.strokeStyle = `rgba(0,255,255,${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px - tw / 2, promptY - 12, tw, 22);

    // Text
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillText(text, px, promptY + 4);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.textAlign = 'left';
}

// --- Placeholder UI overlay for unimplemented stations ---
export function drawPlaceholderUI(t, stationId) {
    const labels = {
        computer: 'UPGRADE TERMINAL',
        wardrobe: 'WARDROBE',
        stereo: 'SYNTH CONTROLS',
        window: 'CITY VIEW',
        garage: 'GARAGE',
    };
    const label = labels[stationId] || stationId.toUpperCase();

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Panel
    const pw = 400, ph = 200;
    ctx.fillStyle = 'rgba(10,0,25,0.95)';
    ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;
    ctx.fillText(label, cx, cy - 40);
    ctx.shadowBlur = 0;

    // Coming soon
    ctx.fillStyle = 'rgba(255,0,255,0.7)';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('— COMING SOON —', cx, cy + 5);

    // Decorative line
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 20);
    ctx.lineTo(cx + 100, cy + 20);
    ctx.stroke();

    // Close hint
    const blink = Math.sin(t * 0.06) > 0;
    if (blink) {
        ctx.fillStyle = 'rgba(0,255,255,0.6)';
        ctx.font = '13px "Courier New", monospace';
        ctx.fillText('[ ESC TO CLOSE ]', cx, cy + 55);
    }

    ctx.textAlign = 'left';
}

// Regenerate buildings on resize
export function resetPenthouse() {
    buildings = null;
}
