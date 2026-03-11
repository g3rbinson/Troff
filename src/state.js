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
};
