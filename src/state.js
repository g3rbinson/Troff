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

    // Penthouse hub — walkable player
    penthousePlayerX: 0.45,    // normalized 0–1 across room width
    penthouseInteraction: null, // active zone id or null
    penthouseUI: null,          // active overlay: 'computer'|'wardrobe'|'stereo'|'window'|'elevator'|null
    penthousePlayerDir: 1,      // 1 = facing right, -1 = facing left
    elevatorPicker: false,      // true when destination picker is open
    elevatorSelection: 0,       // 0 = ARENA, 1 = GARAGE

    // Obstacles & environment (loaded per-level)
    obstacles: [],      // { type, x, y, radius/w/h ... }
    traps: [],          // { type, x, y, w, h, damage, interval, _timer ... }
    ramps: [],          // { x, y, w, h, fromFloor, toFloor, direction }
    turretProjectiles: [], // discs fired by turrets
    levelFloors: 1,     // number of floors this level has
};
