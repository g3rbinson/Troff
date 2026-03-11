// ============================================================
// Level 2 — RISING HEAT
// Walls create lanes, a few barriers to dodge around
// ============================================================
export default {
    name: 'RISING HEAT',
    enemies: 3,
    freeBikes: 4,

    managerBefore: [
        "Alright champ, word's getting around about you.",
        "Tonight you've got three riders — they're not rookies either.",
        "Watch for the yellow one. Heard he likes to cut people off.",
        "They added walls to the arena. Creates bottlenecks.",
        "Stay sharp and use your disc. You got this."
    ],

    managerAfter: [
        "Three down! The sponsors are calling!",
        "You're moving up the ranks fast, kid.",
        "Next one's gonna be tougher though. Rest up."
    ],

    obstacles: [
        // Horizontal wall barriers creating lanes
        { type: 'wall', x: 1500, y: 1800, w: 600, h: 20 },
        { type: 'wall', x: 2900, y: 1800, w: 600, h: 20 },
        { type: 'wall', x: 1500, y: 3200, w: 600, h: 20 },
        { type: 'wall', x: 2900, y: 3200, w: 600, h: 20 },
        // Vertical dividers
        { type: 'wall', x: 2490, y: 1200, w: 20, h: 500 },
        { type: 'wall', x: 2490, y: 3300, w: 20, h: 500 },
        // Corner pillars
        { type: 'pillar', x: 1200, y: 1200, radius: 50 },
        { type: 'pillar', x: 3800, y: 1200, radius: 50 },
        { type: 'pillar', x: 1200, y: 3800, radius: 50 },
        { type: 'pillar', x: 3800, y: 3800, radius: 50 },
    ],

    traps: [],
    ramps: [],
    floors: 1,
};
