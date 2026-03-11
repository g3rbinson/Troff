// ============================================================
// Shared Game State
// ============================================================
export const state = {
    // menu | penthouse | elevator | playing | paused | dead | victory
    mode: 'menu',
    score: 0,
    frame: 0,
    player: null,
    allBikes: [],
    aiDrivers: [],
    particles: [],
    projectiles: [],
    stars: [],
    gridPulse: 0,
    camX: 0,
    camY: 0,
    audio: null,

    // Campaign
    fightIndex: 0,           // current fight in campaign
    campaignComplete: false,
    penthousePhase: 'intro', // 'intro' | 'idle' | 'dialogue_before' | 'dialogue_after'

    // Obstacles & environment (loaded per-level)
    obstacles: [],      // { type, x, y, radius/w/h ... }
    traps: [],          // { type, x, y, w, h, damage, interval, _timer ... }
    ramps: [],          // { x, y, w, h, fromFloor, toFloor, direction }
    turretProjectiles: [], // discs fired by turrets
    levelFloors: 1,     // number of floors this level has
};
