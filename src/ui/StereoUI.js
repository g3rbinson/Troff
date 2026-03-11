// ============================================================
// Stereo UI — Canvas-drawn synth controls overlay
// ============================================================
import { canvas, ctx } from '../canvas.js';
import { state } from '../state.js';

const WAVE_TYPES = ['sine', 'square', 'sawtooth', 'triangle'];

// Knob/slider definitions — each maps to an audio method
const CONTROLS = [
    { id: 'bpm',       label: 'BPM',          min: 60, max: 200, step: 5,   get: a => a.bpm,              set: (a, v) => a.setBPM(v),              type: 'knob' },
    { id: 'reverb',    label: 'REVERB',        min: 0,  max: 100, step: 5,  get: a => a.reverbAmount * 100, set: (a, v) => a.setReverbAmount(v),    type: 'knob' },
    { id: 'delay',     label: 'DELAY',         min: 0,  max: 100, step: 5,  get: a => a.delayAmount * 100,  set: (a, v) => a.setDelayAmount(v),     type: 'knob' },
    { id: 'bassCut',   label: 'BASS FILTER',   min: 100, max: 2000, step: 50, get: a => a.bassFilterCutoff, set: (a, v) => { a.bassFilterCutoff = v; }, type: 'knob' },
    { id: 'padCut',    label: 'PAD FILTER',    min: 200, max: 4000, step: 100, get: a => a.padFilterCutoff, set: (a, v) => { a.padFilterCutoff = v; }, type: 'knob' },
    { id: 'bassWave',  label: 'BASS WAVE',     get: a => a.bassWave,         set: (a, v) => { a.bassWave = v; },  type: 'wave' },
    { id: 'padWave',   label: 'PAD WAVE',      get: a => a.padWave,          set: (a, v) => { a.padWave = v; },   type: 'wave' },
    { id: 'arpWave',   label: 'ARP WAVE',      get: a => a.arpWave,          set: (a, v) => { a.arpWave = v; },   type: 'wave' },
];

// UI state
let selectedIndex = 0;

export function resetStereoUI() {
    selectedIndex = 0;
}

export function handleStereoInput(key) {
    const audio = state.audio;
    if (!audio) return;

    const ctrl = CONTROLS[selectedIndex];

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedIndex = (selectedIndex - 1 + CONTROLS.length) % CONTROLS.length;
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedIndex = (selectedIndex + 1) % CONTROLS.length;
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        adjustControl(ctrl, audio, -1);
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        adjustControl(ctrl, audio, 1);
    }
}

function adjustControl(ctrl, audio, dir) {
    if (ctrl.type === 'knob') {
        const cur = ctrl.get(audio);
        const next = Math.max(ctrl.min, Math.min(ctrl.max, cur + dir * ctrl.step));
        ctrl.set(audio, next);
    } else if (ctrl.type === 'wave') {
        const cur = ctrl.get(audio);
        const idx = WAVE_TYPES.indexOf(cur);
        const next = WAVE_TYPES[(idx + dir + WAVE_TYPES.length) % WAVE_TYPES.length];
        ctrl.set(audio, next);
    }
}

// ============================================================
// DRAW
// ============================================================
export function drawStereoUI(t) {
    const audio = state.audio;
    if (!audio) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const pw = 480, ph = 420;
    const px = cx - pw / 2, py = cy - ph / 2;

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel background
    ctx.fillStyle = 'rgba(8,0,20,0.97)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(255,0,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    ctx.fillText('♫  SYNTH CONTROLS  ♫', cx, py + 32);
    ctx.shadowBlur = 0;

    // Decorative line
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 30, py + 45);
    ctx.lineTo(px + pw - 30, py + 45);
    ctx.stroke();

    // Draw each control
    const startY = py + 65;
    const rowH = 40;

    for (let i = 0; i < CONTROLS.length; i++) {
        const ctrl = CONTROLS[i];
        const ry = startY + i * rowH;
        const selected = i === selectedIndex;

        // Selection highlight
        if (selected) {
            const pulse = 0.06 + 0.03 * Math.sin(t * 0.08);
            ctx.fillStyle = `rgba(255,0,255,${pulse})`;
            ctx.fillRect(px + 10, ry - 10, pw - 20, rowH - 4);
            ctx.strokeStyle = `rgba(255,0,255,${0.3 + 0.15 * Math.sin(t * 0.06)})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 10, ry - 10, pw - 20, rowH - 4);
        }

        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = selected ? '#ff00ff' : 'rgba(255,0,255,0.5)';
        ctx.font = `${selected ? 'bold ' : ''}13px "Courier New", monospace`;
        ctx.fillText(ctrl.label, px + 24, ry + 8);

        if (ctrl.type === 'knob') {
            drawKnob(ctrl, audio, px + pw - 200, ry, selected, t);
        } else if (ctrl.type === 'wave') {
            drawWaveSelector(ctrl, audio, px + pw - 220, ry, selected, t);
        }
    }

    // Controls hint
    ctx.textAlign = 'center';
    const blink = Math.sin(t * 0.06) > 0;
    if (blink) {
        ctx.fillStyle = 'rgba(0,255,255,0.5)';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('W/S: Select  •  A/D: Adjust  •  ESC: Close', cx, py + ph - 16);
    }
    ctx.textAlign = 'left';
}

// --- Draw a knob/slider control ---
function drawKnob(ctrl, audio, x, y, selected, t) {
    const val = ctrl.get(audio);
    const norm = (val - ctrl.min) / (ctrl.max - ctrl.min); // 0–1
    const barW = 140, barH = 10;
    const barX = x, barY = y - barH / 2 + 4;

    // Track
    ctx.fillStyle = 'rgba(40,0,80,0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    // Filled portion — gradient from magenta to cyan
    const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    g.addColorStop(0, 'rgba(255,0,255,0.7)');
    g.addColorStop(1, 'rgba(0,255,255,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(barX, barY, barW * norm, barH);

    // Border
    ctx.strokeStyle = selected ? 'rgba(0,255,255,0.6)' : 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Knob indicator
    const knobX = barX + barW * norm;
    ctx.fillStyle = selected ? '#00ffff' : 'rgba(0,255,255,0.5)';
    ctx.fillRect(knobX - 2, barY - 3, 4, barH + 6);

    // Value text
    ctx.textAlign = 'right';
    ctx.fillStyle = selected ? '#00ffff' : 'rgba(0,255,255,0.5)';
    ctx.font = 'bold 12px "Courier New", monospace';
    const displayVal = ctrl.id === 'bpm' ? `${Math.round(val)}` :
                       ctrl.id === 'bassCut' || ctrl.id === 'padCut' ? `${Math.round(val)}Hz` :
                       `${Math.round(val)}%`;
    ctx.fillText(displayVal, barX + barW + 40, y + 8);
    ctx.textAlign = 'left';

    // Arrows
    if (selected) {
        ctx.fillStyle = 'rgba(0,255,255,0.6)';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◄', barX - 12, y + 8);
        ctx.fillText('►', barX + barW + 52, y + 8);
        ctx.textAlign = 'left';
    }
}

// --- Draw a wave-type selector ---
function drawWaveSelector(ctrl, audio, x, y, selected, t) {
    const cur = ctrl.get(audio);

    for (let i = 0; i < WAVE_TYPES.length; i++) {
        const w = WAVE_TYPES[i];
        const bx = x + i * 55;
        const active = w === cur;

        // Box
        ctx.fillStyle = active ? 'rgba(0,255,255,0.15)' : 'rgba(20,0,40,0.5)';
        ctx.fillRect(bx, y - 8, 48, 24);
        ctx.strokeStyle = active ? 'rgba(0,255,255,0.7)' : 'rgba(0,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, y - 8, 48, 24);

        // Wave icon (mini waveform)
        drawMiniWave(bx + 4, y - 3, 40, 14, w, active, t);
    }

    // Arrows
    if (selected) {
        ctx.fillStyle = 'rgba(0,255,255,0.6)';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◄', x - 12, y + 8);
        ctx.fillText('►', x + 4 * 55 + 8, y + 8);
        ctx.textAlign = 'left';
    }
}

// --- Mini waveform icon ---
function drawMiniWave(x, y, w, h, type, active, t) {
    ctx.beginPath();
    ctx.strokeStyle = active ? '#00ffff' : 'rgba(0,255,255,0.3)';
    ctx.lineWidth = active ? 1.5 : 1;
    const mid = y + h / 2;
    const amp = h * 0.35;
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
        const px = x + (i / steps) * w;
        const phase = (i / steps) * Math.PI * 2;
        let val = 0;

        if (type === 'sine') {
            val = Math.sin(phase);
        } else if (type === 'square') {
            val = Math.sin(phase) >= 0 ? 1 : -1;
        } else if (type === 'sawtooth') {
            val = 1 - 2 * ((i / steps) % 1);
        } else if (type === 'triangle') {
            val = 2 * Math.abs(2 * ((i / steps + 0.25) % 1) - 1) - 1;
        }

        const py = mid - val * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
}
