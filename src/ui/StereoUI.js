// ============================================================
// Stereo UI — Canvas-drawn synth controls overlay
// Three sections: VIBE / DRUMS / SYNTH
// ============================================================
import { canvas, ctx } from '../canvas.js';
import { state } from '../state.js';

const WAVE_TYPES = ['sine', 'square', 'sawtooth', 'triangle'];

// ---- Section definitions ----
// Items are rendered per-section; the UI flattens them into one navigable list.

const DRUM_NAMES = ['kick', 'snare', 'hihat', 'clap', 'tom', 'rim'];

const SYNTH_CONTROLS = [
    { id: 'bpm',       label: 'BPM',          min: 60, max: 200, step: 5,   get: a => a.bpm,              set: (a, v) => a.setBPM(v),              type: 'knob' },
    { id: 'reverb',    label: 'REVERB',        min: 0,  max: 100, step: 5,  get: a => a.reverbAmount * 100, set: (a, v) => a.setReverbAmount(v),    type: 'knob' },
    { id: 'delay',     label: 'DELAY',         min: 0,  max: 100, step: 5,  get: a => a.delayAmount * 100,  set: (a, v) => a.setDelayAmount(v),     type: 'knob' },
    { id: 'bassCut',   label: 'BASS FILTER',   min: 100, max: 2000, step: 50, get: a => a.bassFilterCutoff, set: (a, v) => { a.bassFilterCutoff = v; }, type: 'knob' },
    { id: 'padCut',    label: 'PAD FILTER',    min: 200, max: 4000, step: 100, get: a => a.padFilterCutoff, set: (a, v) => { a.padFilterCutoff = v; }, type: 'knob' },
    { id: 'bassWave',  label: 'BASS WAVE',     get: a => a.bassWave,         set: (a, v) => { a.bassWave = v; },  type: 'wave' },
    { id: 'padWave',   label: 'PAD WAVE',      get: a => a.padWave,          set: (a, v) => { a.padWave = v; },   type: 'wave' },
    { id: 'arpWave',   label: 'ARP WAVE',      get: a => a.arpWave,          set: (a, v) => { a.arpWave = v; },   type: 'wave' },
];

// Flat navigable row list: vibe, intensity, drums header, 6 drum toggles, synth header, N synth controls
// Headers are not selectable—they are skipped during navigation.
function buildRows() {
    const rows = [];
    // -- VIBE section --
    rows.push({ section: 'vibe', type: 'slider', id: 'vibe',      label: 'VIBE',      min: 0, max: 100, step: 5, get: a => a.vibe, set: (a, v) => a.setVibe(v) });
    rows.push({ section: 'vibe', type: 'slider', id: 'intensity',  label: 'INTENSITY',  min: 0, max: 100, step: 5, get: a => a.intensity, set: (a, v) => a.setIntensity(v) });
    // -- DRUMS section --
    rows.push({ section: 'drums', type: 'header', label: 'DRUM RACK' });
    for (const name of DRUM_NAMES) {
        rows.push({ section: 'drums', type: 'toggle', id: name, label: name.toUpperCase() });
    }
    // -- SYNTH section --
    rows.push({ section: 'synth', type: 'header', label: 'SYNTH' });
    for (const ctrl of SYNTH_CONTROLS) {
        rows.push({ section: 'synth', ...ctrl });
    }
    return rows;
}

const ROWS = buildRows();

// UI state
let selectedIndex = 0;

// Skip headers when navigating
function nextSelectable(from, dir) {
    let i = from;
    do {
        i = (i + dir + ROWS.length) % ROWS.length;
    } while (ROWS[i].type === 'header' && i !== from);
    return i;
}

export function resetStereoUI() {
    selectedIndex = 0;
}

export function handleStereoInput(key) {
    const audio = state.audio;
    if (!audio) return;

    const row = ROWS[selectedIndex];

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedIndex = nextSelectable(selectedIndex, -1);
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedIndex = nextSelectable(selectedIndex, 1);
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        adjustRow(row, audio, -1);
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        adjustRow(row, audio, 1);
    } else if (key === 'Enter' || key === 'e' || key === 'E') {
        // Toggle drums with Enter/E too
        if (row.type === 'toggle') audio.toggleDrum(row.id);
    }
}

function adjustRow(row, audio, dir) {
    if (row.type === 'slider' || row.type === 'knob') {
        const cur = row.get(audio);
        const next = Math.max(row.min, Math.min(row.max, cur + dir * row.step));
        row.set(audio, next);
    } else if (row.type === 'wave') {
        const cur = row.get(audio);
        const idx = WAVE_TYPES.indexOf(cur);
        const next = WAVE_TYPES[(idx + dir + WAVE_TYPES.length) % WAVE_TYPES.length];
        row.set(audio, next);
    } else if (row.type === 'toggle') {
        // A/D also toggles
        audio.toggleDrum(row.id);
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
    const pw = 520, ph = 560;
    const px = cx - pw / 2, py = cy - ph / 2;

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
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
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    ctx.fillText('♫  SYNTH STATION  ♫', cx, py + 28);
    ctx.shadowBlur = 0;

    // Decorative line
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 40);
    ctx.lineTo(px + pw - 20, py + 40);
    ctx.stroke();

    // Draw rows
    const startY = py + 52;
    const rowH = 28;

    for (let i = 0; i < ROWS.length; i++) {
        const row = ROWS[i];
        const ry = startY + i * rowH;
        const selected = i === selectedIndex;

        if (row.type === 'header') {
            drawSectionHeader(row.label, px, ry, pw, t);
            continue;
        }

        // Selection highlight
        if (selected) {
            const pulse = 0.06 + 0.03 * Math.sin(t * 0.08);
            ctx.fillStyle = `rgba(255,0,255,${pulse})`;
            ctx.fillRect(px + 8, ry - 4, pw - 16, rowH - 2);
            ctx.strokeStyle = `rgba(255,0,255,${0.25 + 0.12 * Math.sin(t * 0.06)})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 8, ry - 4, pw - 16, rowH - 2);
        }

        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = selected ? '#ff00ff' : 'rgba(255,0,255,0.45)';
        ctx.font = `${selected ? 'bold ' : ''}12px "Courier New", monospace`;
        ctx.fillText(row.label, px + 20, ry + 12);

        if (row.type === 'slider' || row.type === 'knob') {
            drawSlider(row, audio, px + pw - 220, ry, selected, t);
        } else if (row.type === 'wave') {
            drawWaveSelector(row, audio, px + pw - 240, ry, selected, t);
        } else if (row.type === 'toggle') {
            drawToggle(row, audio, px + pw - 120, ry, selected, t);
        }
    }

    // Controls hint
    ctx.textAlign = 'center';
    const blink = Math.sin(t * 0.06) > 0;
    if (blink) {
        ctx.fillStyle = 'rgba(0,255,255,0.5)';
        ctx.font = '10px "Courier New", monospace';
        ctx.fillText('W/S: Navigate  •  A/D: Adjust  •  E: Toggle  •  ESC: Close', cx, py + ph - 12);
    }
    ctx.textAlign = 'left';
}

// ---- Section header ----
function drawSectionHeader(label, px, ry, pw, t) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('── ' + label + ' ──', px + 16, ry + 12);
    ctx.strokeStyle = 'rgba(0,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 16, ry + 18);
    ctx.lineTo(px + pw - 16, ry + 18);
    ctx.stroke();
}

// ---- Slider / knob control ----
function drawSlider(ctrl, audio, x, y, selected, t) {
    const val = ctrl.get(audio);
    const norm = (val - ctrl.min) / (ctrl.max - ctrl.min);
    const barW = 150, barH = 8;
    const barX = x, barY = y + 2;

    // Track
    ctx.fillStyle = 'rgba(40,0,80,0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    // Gradient fill — vibe slider gets a special gradient
    const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (ctrl.id === 'vibe') {
        g.addColorStop(0, 'rgba(100,150,255,0.7)');   // lo-fi blue
        g.addColorStop(0.5, 'rgba(255,0,255,0.7)');    // mid magenta
        g.addColorStop(1, 'rgba(255,60,0,0.8)');        // heavy orange-red
    } else {
        g.addColorStop(0, 'rgba(255,0,255,0.7)');
        g.addColorStop(1, 'rgba(0,255,255,0.7)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(barX, barY, barW * norm, barH);

    // Border
    ctx.strokeStyle = selected ? 'rgba(0,255,255,0.6)' : 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Knob indicator
    const knobX = barX + barW * norm;
    ctx.fillStyle = selected ? '#00ffff' : 'rgba(0,255,255,0.5)';
    ctx.fillRect(knobX - 2, barY - 2, 4, barH + 4);

    // Value text
    ctx.textAlign = 'right';
    ctx.fillStyle = selected ? '#00ffff' : 'rgba(0,255,255,0.5)';
    ctx.font = 'bold 11px "Courier New", monospace';
    let displayVal;
    if (ctrl.id === 'vibe') {
        displayVal = val < 35 ? 'LO-FI' : val < 70 ? 'MIXED' : 'HEAVY';
    } else if (ctrl.id === 'bpm') {
        displayVal = `${Math.round(val)}`;
    } else if (ctrl.id === 'bassCut' || ctrl.id === 'padCut') {
        displayVal = `${Math.round(val)}Hz`;
    } else {
        displayVal = `${Math.round(val)}%`;
    }
    ctx.fillText(displayVal, barX + barW + 50, y + 12);
    ctx.textAlign = 'left';

    // Arrows
    if (selected) {
        ctx.fillStyle = 'rgba(0,255,255,0.6)';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◄', barX - 10, y + 12);
        ctx.fillText('►', barX + barW + 60, y + 12);
        ctx.textAlign = 'left';
    }
}

// ---- Drum toggle ----
function drawToggle(row, audio, x, y, selected, t) {
    const on = audio.drums[row.id];
    const boxSize = 14;
    const bx = x, by = y + 1;

    // Box
    ctx.fillStyle = on ? 'rgba(0,255,255,0.2)' : 'rgba(40,0,80,0.5)';
    ctx.fillRect(bx, by, boxSize, boxSize);
    ctx.strokeStyle = selected ? 'rgba(0,255,255,0.8)' : 'rgba(0,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxSize, boxSize);

    // Check mark
    if (on) {
        ctx.fillStyle = selected ? '#00ffff' : 'rgba(0,255,255,0.7)';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', bx + boxSize / 2, by + 12);
        ctx.textAlign = 'left';
    }

    // ON/OFF label
    ctx.fillStyle = on
        ? (selected ? '#00ffff' : 'rgba(0,255,255,0.6)')
        : (selected ? 'rgba(255,0,255,0.6)' : 'rgba(255,0,255,0.25)');
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText(on ? 'ON' : 'OFF', bx + boxSize + 8, y + 12);
}

// ---- Wave-type selector ----
function drawWaveSelector(ctrl, audio, x, y, selected, t) {
    const cur = ctrl.get(audio);

    for (let i = 0; i < WAVE_TYPES.length; i++) {
        const w = WAVE_TYPES[i];
        const bx = x + i * 52;
        const active = w === cur;

        ctx.fillStyle = active ? 'rgba(0,255,255,0.15)' : 'rgba(20,0,40,0.5)';
        ctx.fillRect(bx, y - 2, 46, 20);
        ctx.strokeStyle = active ? 'rgba(0,255,255,0.7)' : 'rgba(0,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, y - 2, 46, 20);

        drawMiniWave(bx + 3, y, 40, 14, w, active, t);
    }

    if (selected) {
        ctx.fillStyle = 'rgba(0,255,255,0.6)';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◄', x - 10, y + 12);
        ctx.fillText('►', x + 4 * 52 + 6, y + 12);
        ctx.textAlign = 'left';
    }
}

// ---- Mini waveform icon ----
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
