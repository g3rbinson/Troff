// ============================================================
// SYNTHWAVE TRON — Main Entry Point
// ============================================================
import { canvas, ctx, resize } from './canvas.js';
import * as C from './constants.js';
import { state } from './state.js';
import { keys, mouse, consumeClick, initInput } from './input.js';
import { clamp } from './utils.js';
import { SynthwaveAudio } from './audio.js';
import { LightBike } from './entities/LightBike.js';
import { Player } from './entities/Player.js';
import { AIDriver } from './ai/AIDriver.js';
import { checkCollisions } from './systems/Collision.js';
import { generateStars, drawSky, drawStars } from './rendering/Sky.js';
import { drawGrid, drawArena } from './rendering/Grid.js';
import {
    drawScanlines, drawVignette, drawWallWarning,
    drawChromaticAberration, drawParticles, drawFreeBikeIndicators
} from './rendering/Effects.js';
import { updateHUD, drawMinimap } from './rendering/HUD.js';

// Story imports
import { fights, getFight } from './story/Campaign.js';
import { drawPenthouse, resetPenthouse } from './story/Penthouse.js';
import { Dialogue } from './story/Dialogue.js';
import { Elevator } from './story/Elevator.js';

// Obstacle system
import { loadLevelObstacles, updateTraps } from './systems/Obstacles.js';
import { drawObstacles } from './rendering/Obstacles.js';

// --- Audio ---
const audio = new SynthwaveAudio();
state.audio = audio;

// --- Input ---
initInput();

// --- Story objects ---
const dialogue = new Dialogue();
const elevator = new Elevator();
let penthouseFrame = 0;
let victoryFrame = 0;
let readyToDescend = false; // player pressed enter in penthouse idle

// --- Canvas ---
resize();
window.addEventListener('resize', () => { resize(); resetPenthouse(); });

// ============================================================
// INPUT HANDLERS
// ============================================================
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Enter') {
        if (state.mode === 'menu') {
            enterPenthouse('intro');
        } else if (state.mode === 'dead') {
            // Restart fight — go back to penthouse
            enterPenthouse('dialogue_before');
        } else if (state.mode === 'penthouse') {
            handlePenthouseInput();
        } else if (state.mode === 'victory') {
            // Skip to elevator up
            goUpTopenthouse();
        }
    }
    if (e.key === 'Escape' && (state.mode === 'playing' || state.mode === 'paused')) togglePause();
});

window.addEventListener('click', () => {
    if (state.mode === 'penthouse') {
        handlePenthouseInput();
    } else if (state.mode === 'victory') {
        goUpTopenthouse();
    }
});

function handlePenthouseInput() {
    if (dialogue.active) {
        dialogue.advance();
    } else if (state.penthousePhase === 'idle') {
        readyToDescend = true;
    }
}

// ============================================================
// PENTHOUSE FLOW
// ============================================================
function enterPenthouse(phase) {
    audio.init();
    state.mode = 'penthouse';
    state.penthousePhase = phase || 'intro';
    penthouseFrame = 0;
    readyToDescend = false;
    overlay('none');
    pauseOverlay(false);
    hideGameHUD(true);

    if (phase === 'intro') {
        // First time — small intro then manager dialogue
        dialogue.start(
            getFight(state.fightIndex).managerBefore,
            'MANAGER',
            () => { state.penthousePhase = 'idle'; }
        );
        state.penthousePhase = 'dialogue_before';
    } else if (phase === 'dialogue_before') {
        const fight = getFight(state.fightIndex);
        if (fight) {
            dialogue.start(fight.managerBefore, 'MANAGER', () => {
                state.penthousePhase = 'idle';
            });
        }
    } else if (phase === 'dialogue_after') {
        const fight = getFight(state.fightIndex - 1); // just finished fight
        if (fight) {
            dialogue.start(fight.managerAfter, 'MANAGER', () => {
                // If campaign complete
                if (state.fightIndex >= fights.length) {
                    state.campaignComplete = true;
                    state.penthousePhase = 'idle';
                } else {
                    // Show next fight intro
                    const nextFight = getFight(state.fightIndex);
                    if (nextFight) {
                        setTimeout(() => {
                            dialogue.start(nextFight.managerBefore, 'MANAGER', () => {
                                state.penthousePhase = 'idle';
                            });
                            state.penthousePhase = 'dialogue_before';
                        }, 500);
                    } else {
                        state.penthousePhase = 'idle';
                    }
                }
            });
        }
    }
}

// ============================================================
// ELEVATOR TRANSITIONS
// ============================================================
function goDownToArena() {
    state.mode = 'elevator';
    hideGameHUD(true);
    elevator.start('down', () => {
        startFight();
    });
}

function goUpTopenthouse() {
    state.mode = 'elevator';
    hideGameHUD(true);
    elevator.start('up', () => {
        state.fightIndex++;
        enterPenthouse('dialogue_after');
    });
}

// ============================================================
// ARENA FIGHT
// ============================================================

// Spawn positions: corners and edge midpoints for up to 9 spawn slots
const SPAWN_POINTS = [
    { x: 300,           y: 300 },            // top-left
    { x: C.ARENA - 300, y: 300 },            // top-right
    { x: 300,           y: C.ARENA - 300 },  // bottom-left
    { x: C.ARENA - 300, y: C.ARENA - 300 },  // bottom-right
    { x: C.ARENA / 2,   y: 300 },            // top-mid
    { x: C.ARENA / 2,   y: C.ARENA - 300 },  // bottom-mid
    { x: 300,           y: C.ARENA / 2 },    // left-mid
    { x: C.ARENA - 300, y: C.ARENA / 2 },    // right-mid
    { x: C.ARENA / 2,   y: C.ARENA / 2 },    // center (overflow)
];

function startFight() {
    const fight = getFight(state.fightIndex);
    if (!fight) return;

    state.mode = 'playing';
    state.score = 0;
    state.frame = 0;
    state.allBikes = [];
    state.aiDrivers = [];
    state.particles = [];
    state.projectiles = [];
    generateStars();
    hideGameHUD(false);

    // Load level obstacles, traps, ramps
    loadLevelObstacles(fight);

    // Shuffle spawn points for variety
    const spawns = [...SPAWN_POINTS];
    for (let i = spawns.length - 1; i > 0; i--) {
        const j = Math.random() * (i + 1) | 0;
        [spawns[i], spawns[j]] = [spawns[j], spawns[i]];
    }

    // Player starts ON FOOT at first spawn point
    const ps = spawns[0];
    state.player = new Player(ps.x, ps.y);
    state.player.onBike = false;
    state.player.bike = null;
    state.player.invuln = 90; // brief spawn protection
    state.player.floor = 1;

    // Drop a player-colored bike near the player
    const playerBike = new LightBike(
        ps.x + 40 + Math.random() * 60,
        ps.y + 40 + Math.random() * 60,
        Math.random() * Math.PI * 2, C.PLAYER_CLR, C.PLAYER_TRAIL
    );
    playerBike.ridden = false;
    playerBike.floor = 1;
    state.allBikes.push(playerBike);

    // Enemy AI — each at a different spawn, ON FOOT
    const numEnemies = fight.enemies;
    for (let i = 0; i < numEnemies; i++) {
        const sp = spawns[(i + 1) % spawns.length]; // offset by 1 (player took slot 0)
        const idx = i % C.AI_CLR.length;

        // Drop a bike near each AI spawn
        const aiBike = new LightBike(
            sp.x + 40 + Math.random() * 60,
            sp.y + 40 + Math.random() * 60,
            Math.random() * Math.PI * 2, C.AI_CLR[idx], C.AI_TRAIL[idx]
        );
        aiBike.ridden = false;
        aiBike.floor = 1;
        state.allBikes.push(aiBike);

        // AI driver starts on foot at spawn
        const ai = new AIDriver(null, idx, sp.x, sp.y);
        ai.floor = 1;
        state.aiDrivers.push(ai);
    }

    // Scatter extra free bikes around the arena (avoid obstacles)
    const numFree = fight.freeBikes || 4;
    for (let i = 0; i < numFree; i++) spawnFreeBike();

    overlay('none');
    pauseOverlay(false);

    // Show fight name briefly
    showFightBanner(fight.name, numEnemies);
}

function spawnFreeBike() {
    // Try to spawn in a clear spot (not inside obstacles)
    for (let attempt = 0; attempt < 20; attempt++) {
        const x = 200 + Math.random() * (C.ARENA - 400);
        const y = 200 + Math.random() * (C.ARENA - 400);
        let blocked = false;
        for (const obs of state.obstacles) {
            if (obs.type === 'wall' && x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) { blocked = true; break; }
            if (obs.type === 'pillar' && Math.hypot(x - obs.x, y - obs.y) < obs.radius + 20) { blocked = true; break; }
        }
        if (blocked) continue;
        const b = new LightBike(x, y, Math.random() * Math.PI * 2, '#aaaaff', '#8888cc');
        b.hp = 50 + Math.random() * 50 | 0;
        b.floor = 1;
        state.allBikes.push(b);
        return;
    }
    // Fallback: spawn anyway
    const x = 200 + Math.random() * (C.ARENA - 400);
    const y = 200 + Math.random() * (C.ARENA - 400);
    const b = new LightBike(x, y, Math.random() * Math.PI * 2, '#aaaaff', '#8888cc');
    b.hp = 50 + Math.random() * 50 | 0;
    b.floor = 1;
    state.allBikes.push(b);
}

// ============================================================
// VICTORY CHECK
// ============================================================
function checkVictory() {
    // An AI counts as alive while alive=true (covers both on-foot and bike-riding states)
    const aliveEnemies = state.aiDrivers.filter(a => a.alive).length;
    if (aliveEnemies === 0 && state.frame > 60) {
        state.mode = 'victory';
        victoryFrame = 0;
    }
}

// ============================================================
// PAUSE
// ============================================================
function togglePause() {
    if (state.mode === 'playing') {
        state.mode = 'paused';
        audio.pause();
        pauseOverlay(true);
    } else if (state.mode === 'paused') {
        state.mode = 'playing';
        audio.resume();
        pauseOverlay(false);
    }
}

function quitToMenu() {
    state.mode = 'menu';
    audio.pause();
    pauseOverlay(false);
    hideGameHUD(true);
    overlay('block');
    setOverlayText('SYNTHWAVE TRON', 'ENTER THE GRID', 'Press ENTER to start', controls);
}

// --- Pause button handlers ---
document.getElementById('btn-resume').addEventListener('click', () => {
    if (state.mode === 'paused') togglePause();
});
document.getElementById('btn-quit').addEventListener('click', () => {
    if (state.mode === 'paused') quitToMenu();
});

// --- Volume slider handlers ---
function initVolumeControls() {
    const sliders = [
        { id: 'vol-master', valId: 'vol-master-val', fn: v => { if (state.audio) state.audio.setMasterVolume(v); } },
        { id: 'vol-music',  valId: 'vol-music-val',  fn: v => { if (state.audio) state.audio.setMusicVolume(v); } },
        { id: 'vol-sfx',    valId: 'vol-sfx-val',    fn: v => { if (state.audio) state.audio.setSFXVolume(v); } },
    ];
    for (const s of sliders) {
        const el = document.getElementById(s.id);
        const valEl = document.getElementById(s.valId);
        if (!el) continue;
        el.addEventListener('input', () => {
            const v = parseInt(el.value, 10);
            if (valEl) valEl.textContent = v;
            s.fn(v);
        });
    }
}
initVolumeControls();

// ============================================================
// OVERLAY / HUD HELPERS
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

function hideGameHUD(hide) {
    const els = ['hud', 'boost-bar-container', 'boost-label', 'disc-bar-container', 'disc-label', 'minimap', 'controls-help'];
    for (const id of els) {
        const el = document.getElementById(id);
        if (el) el.style.display = hide ? 'none' : '';
    }
}

// Fight banner (canvas-drawn, fades after a few seconds)
let bannerText = '';
let bannerSub = '';
let bannerFrame = 0;
const BANNER_DURATION = 180;

function showFightBanner(name, enemies) {
    bannerText = name;
    bannerSub = `${enemies} OPPONENT${enemies > 1 ? 'S' : ''} — ELIMINATE ALL`;
    bannerFrame = BANNER_DURATION;
}

function drawBanner() {
    if (bannerFrame <= 0) return;
    bannerFrame--;
    const alpha = bannerFrame > 30 ? 1 : bannerFrame / 30;
    const cx = canvas.width / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.fillText(bannerText, cx, canvas.height * 0.3);

    ctx.fillStyle = '#00ffff';
    ctx.font = '20px "Courier New", monospace';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillText(bannerSub, cx, canvas.height * 0.3 + 40);

    ctx.restore();
    ctx.textAlign = 'left';
}

// ============================================================
// MAIN GAME LOOP
// ============================================================
const controls = 'WASD/Arrows: Steer  |  F/Click: Fire Disc  |  E: Dismount  |  SPACE: Boost  |  ESC: Pause';

function loop() {
    requestAnimationFrame(loop);
    state.frame++;

    // --- MENU ---
    if (state.mode === 'menu') {
        drawSky();
        const t = state.frame * 0.02;
        ctx.strokeStyle = `rgba(255,0,255,${0.2 + 0.1 * Math.sin(t)})`;
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += C.GRID_SP) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += C.GRID_SP) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        drawScanlines(); drawVignette();
        overlay('block');
        setOverlayText('SYNTHWAVE TRON', 'ENTER THE GRID', 'Press ENTER to start', controls);
        return;
    }

    // --- PENTHOUSE ---
    if (state.mode === 'penthouse') {
        penthouseFrame++;
        dialogue.update();
        const speaking = dialogue.isSpeaking;
        const managerVisible = state.penthousePhase !== 'idle' || dialogue.active || true; // always show manager
        drawPenthouse(penthouseFrame, managerVisible, speaking);

        // Dialogue box
        if (dialogue.active || state.penthousePhase === 'dialogue_before' || state.penthousePhase === 'dialogue_after') {
            dialogue.draw();
        }

        // Idle prompt — "Press ENTER to go to arena"
        if (state.penthousePhase === 'idle' && !dialogue.active) {
            drawPenthousePrompt();
        }

        // If player chose to descend
        if (readyToDescend && !dialogue.active) {
            readyToDescend = false;
            if (state.campaignComplete) {
                // Back to menu or free roam
                overlay('block');
                setOverlayText('GRID MASTER', 'You conquered the grid.', 'Press ENTER to play again', '');
                state.mode = 'menu';
                state.fightIndex = 0;
                state.campaignComplete = false;
                hideGameHUD(true);
            } else {
                goDownToArena();
            }
        }

        drawScanlines();
        drawVignette();
        return;
    }

    // --- ELEVATOR ---
    if (state.mode === 'elevator') {
        elevator.update();
        elevator.draw();
        return;
    }

    // --- PAUSED ---
    if (state.mode === 'paused') return;

    // --- VICTORY ---
    if (state.mode === 'victory') {
        victoryFrame++;
        drawVictoryScreen();
        return;
    }

    // --- DEAD ---
    if (state.mode === 'dead') {
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

    // ============================================================
    // UPDATE (playing mode)
    // ============================================================
    const { player } = state;

    // Player update (includes player's bike)
    player.update();

    // AI updates
    for (const ai of state.aiDrivers) {
        if (ai.alive) ai.update({ x: player.x, y: player.y, angle: player.angle });
    }

    // Update dead / free bikes (trail aging, death timers)
    for (const b of state.allBikes) {
        if (!b.alive || !b.ridden) b.update();
    }

    // Update projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.update();
        if (p.justBounced && p.alive) audio.playDiscBounce();
        if (!p.alive) state.projectiles.splice(i, 1);
    }

    // Update traps (spikes, turrets)
    updateTraps();

    // NO AI RESPAWN — enemies don't come back in campaign mode
    // (free bikes also limited — only initial set)

    // Score over time
    if (state.frame % 30 === 0) state.score += 10;

    // Collision detection
    checkCollisions();

    // Death check
    if (!player.alive) {
        state.mode = 'dead';
        audio.playDeath();
        overlay('block');
        setOverlayText('DERESOLVED', `Score: ${state.score}`, 'Press ENTER to return to penthouse', '');
        return;
    }

    // Victory check — all enemies eliminated
    checkVictory();

    // ============================================================
    // DRAW
    // ============================================================
    state.camX = player.x - canvas.width / 2;
    state.camY = player.y - canvas.height / 2;
    const { camX, camY } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSky();
    drawStars(camX, camY);
    drawGrid(camX, camY);
    drawArena(camX, camY);

    // Level obstacles (walls, pillars, traps, ramps)
    drawObstacles(camX, camY);

    // All bikes & trails
    for (const b of state.allBikes) b.draw(ctx, camX, camY);

    // Projectiles
    for (const p of state.projectiles) p.draw(ctx, camX, camY);

    // AI on foot
    for (const ai of state.aiDrivers) ai.drawOnFoot(ctx, camX, camY);

    // Player (on foot)
    player.draw(ctx, camX, camY);
    drawFreeBikeIndicators(camX, camY);
    drawParticles(camX, camY);

    // Post-processing
    drawScanlines();
    drawVignette();
    drawWallWarning();
    drawChromaticAberration();

    // Fight banner
    drawBanner();

    // Enemies remaining count
    drawEnemyCount();

    // HUD
    updateHUD();
    drawMinimap();
}

// ============================================================
// VICTORY SCREEN
// ============================================================
function drawVictoryScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSky();
    drawScanlines();

    const cx = canvas.width / 2;
    const t = victoryFrame;

    // Flashing background particles
    if (t % 3 === 0) {
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,0,255,0.3)' : 'rgba(0,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 2 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Title
    const scale = Math.min(1, t / 30);
    ctx.save();
    ctx.globalAlpha = scale;
    ctx.fillStyle = '#00ffff';
    ctx.font = `bold ${48 * scale}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 25;
    ctx.fillText('VICTORY', cx, canvas.height * 0.35);
    ctx.shadowBlur = 0;

    // Fight name
    const fight = getFight(state.fightIndex);
    if (fight) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = '24px "Courier New", monospace';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.fillText(fight.name + ' — CLEARED', cx, canvas.height * 0.35 + 50);
        ctx.shadowBlur = 0;
    }

    // Score
    ctx.fillStyle = '#ff88ff';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(`SCORE: ${state.score}`, cx, canvas.height * 0.5);

    // Prompt
    if (t > 90) {
        const blink = Math.sin(t * 0.08) > 0;
        if (blink) {
            ctx.fillStyle = 'rgba(0,255,255,0.7)';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText('[ ENTER / CLICK TO CONTINUE ]', cx, canvas.height * 0.6);
        }
    }

    ctx.restore();
    ctx.textAlign = 'left';
    drawVignette();
}

// ============================================================
// PENTHOUSE IDLE PROMPT
// ============================================================
function drawPenthousePrompt() {
    const cx = canvas.width / 2;
    const fight = getFight(state.fightIndex);
    const blink = Math.sin(penthouseFrame * 0.06) > 0;

    // Fight info
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;

    if (state.campaignComplete) {
        ctx.fillText('YOU ARE THE GRID MASTER', cx, canvas.height * 0.4);
        if (blink) {
            ctx.fillStyle = 'rgba(255,0,255,0.7)';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText('[ ENTER TO PLAY AGAIN ]', cx, canvas.height * 0.4 + 30);
        }
    } else if (fight) {
        ctx.fillText(`NEXT FIGHT: ${fight.name}`, cx, canvas.height * 0.4);
        ctx.fillStyle = 'rgba(255,0,255,0.5)';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText(`${fight.enemies} OPPONENTS`, cx, canvas.height * 0.4 + 25);

        if (blink) {
            ctx.fillStyle = 'rgba(255,0,255,0.8)';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText('[ ENTER / CLICK TO DESCEND TO ARENA ]', cx, canvas.height * 0.4 + 60);
        }
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// ============================================================
// ENEMY COUNT HUD (during fight)
// ============================================================
function drawEnemyCount() {
    const alive = state.aiDrivers.filter(a => a.alive).length;
    const total = state.aiDrivers.length;

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    ctx.fillText(`ENEMIES: ${alive} / ${total}`, canvas.width - 20, 30);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// ============================================================
// START
// ============================================================
state.mode = 'menu';
state.fightIndex = 0;
state.campaignComplete = false;
overlay('block');
hideGameHUD(true);
setOverlayText('SYNTHWAVE TRON', 'ENTER THE GRID', 'Press ENTER to start', controls);
loop();
