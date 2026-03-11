// ============================================================
// Level 3 — NEON GAUNTLET
// Tighter layout, EMP zones that disable boost, spike traps
// ============================================================
export default {
    name: 'NEON GAUNTLET',
    enemies: 4,
    freeBikes: 5,

    managerBefore: [
        "Big night tonight. Four riders and they're hungry.",
        "This is the match that put me on the map back in my day.",
        "They added traps to the arena — glowing floor panels.",
        "Step on 'em and you'll take damage. Watch the red glow.",
        "Use the open bikes if yours gets trashed. Go get 'em."
    ],

    managerAfter: [
        "FOUR! You took down four! Unbelievable!",
        "The whole city's talking about you.",
        "I'm booking you into the invitational. This is the big time."
    ],

    obstacles: [
        // Central fortress of walls
        { type: 'wall', x: 2200, y: 2200, w: 600, h: 20 },
        { type: 'wall', x: 2200, y: 2780, w: 600, h: 20 },
        { type: 'wall', x: 2200, y: 2200, w: 20, h: 600 },
        { type: 'wall', x: 2780, y: 2200, w: 20, h: 600 },
        // Opening gaps in the fortress (no walls at midpoints)
        // Outer pillars
        { type: 'pillar', x: 1000, y: 2500, radius: 60 },
        { type: 'pillar', x: 4000, y: 2500, radius: 60 },
        { type: 'pillar', x: 2500, y: 1000, radius: 60 },
        { type: 'pillar', x: 2500, y: 4000, radius: 60 },
        // Scattered smaller pillars
        { type: 'pillar', x: 1600, y: 1600, radius: 35 },
        { type: 'pillar', x: 3400, y: 1600, radius: 35 },
        { type: 'pillar', x: 1600, y: 3400, radius: 35 },
        { type: 'pillar', x: 3400, y: 3400, radius: 35 },
    ],

    traps: [
        // Spike traps near the fortress entrances
        { type: 'spikes', x: 2450, y: 2100, w: 100, h: 80, damage: 20, interval: 120 },
        { type: 'spikes', x: 2450, y: 2820, w: 100, h: 80, damage: 20, interval: 120 },
        { type: 'spikes', x: 2100, y: 2450, w: 80, h: 100, damage: 20, interval: 120 },
        { type: 'spikes', x: 2820, y: 2450, w: 80, h: 100, damage: 20, interval: 120 },
        // EMP zones that kill boost
        { type: 'emp', x: 1800, y: 1800, w: 300, h: 300 },
        { type: 'emp', x: 2900, y: 2900, w: 300, h: 300 },
    ],

    ramps: [],
    floors: 1,
};
