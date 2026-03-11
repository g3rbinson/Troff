// ============================================================
// Level 1 — QUALIFIER
// Easy introduction: open arena, a few pillars to learn dodging
// ============================================================
export default {
    name: 'QUALIFIER',
    enemies: 2,
    freeBikes: 3,
    arenaSize: 5000, // can override per-level later

    managerBefore: [
        "Hey kid, welcome to the big leagues.",
        "I got you a warm-up match tonight. Two rookies on the grid.",
        "Nothing fancy — just get in there and derezz 'em.",
        "Watch out for the pillars in the arena — they're solid.",
        "Show 'em what you're made of. I'll be watching from up here."
    ],

    managerAfter: [
        "Not bad, not bad at all!",
        "The crowd loved it. You're gonna be a star, kid.",
        "I already got calls coming in for your next match."
    ],

    // Obstacles: type, position, size, properties
    obstacles: [
        // A few pillars scattered around center to teach obstacle awareness
        { type: 'pillar', x: 2500, y: 2200, radius: 40 },
        { type: 'pillar', x: 2200, y: 2800, radius: 40 },
        { type: 'pillar', x: 2800, y: 2600, radius: 40 },
    ],

    traps: [],
    ramps: [],
    floors: 1,
};
