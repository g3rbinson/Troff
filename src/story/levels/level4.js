// ============================================================
// Level 4 — THE INVITATIONAL
// Ramps introduced! Two floors with bridges and hazards
// ============================================================
export default {
    name: 'THE INVITATIONAL',
    enemies: 5,
    freeBikes: 6,

    managerBefore: [
        "This is it. The Invitational. Five elite riders.",
        "Each one of them has earned their spot. Just like you.",
        "The arena has RAMPS now — ride over one and you go up a level.",
        "When you're on the upper floor, you're above everyone else.",
        "The red one — they call him 'The Virus'. Watch your back.",
        "No second chances in there. Win this and you're a legend."
    ],

    managerAfter: [
        "You absolute MONSTER! Five elites — GONE!",
        "They're already calling you 'The Anomaly'.",
        "But there's one more fight. The champion wants you personally."
    ],

    obstacles: [
        // Grand cross walls
        { type: 'wall', x: 2000, y: 2490, w: 400, h: 20 },
        { type: 'wall', x: 2600, y: 2490, w: 400, h: 20 },
        { type: 'wall', x: 2490, y: 2000, w: 20, h: 400 },
        { type: 'wall', x: 2490, y: 2600, w: 20, h: 400 },
        // Outer bastions
        { type: 'wall', x: 800, y: 800, w: 300, h: 20 },
        { type: 'wall', x: 800, y: 800, w: 20, h: 300 },
        { type: 'wall', x: 3900, y: 800, w: 300, h: 20 },
        { type: 'wall', x: 4200, y: 800, w: 20, h: 300 },
        { type: 'wall', x: 800, y: 3900, w: 20, h: 300 },
        { type: 'wall', x: 800, y: 4200, w: 300, h: 20 },
        { type: 'wall', x: 4200, y: 3900, w: 20, h: 300 },
        { type: 'wall', x: 3900, y: 4200, w: 300, h: 20 },
        // Pillars along corridors
        { type: 'pillar', x: 1500, y: 2500, radius: 45 },
        { type: 'pillar', x: 3500, y: 2500, radius: 45 },
        { type: 'pillar', x: 2500, y: 1500, radius: 45 },
        { type: 'pillar', x: 2500, y: 3500, radius: 45 },
    ],

    traps: [
        // Spike traps guarding ramp entrances
        { type: 'spikes', x: 1850, y: 1850, w: 120, h: 120, damage: 25, interval: 100 },
        { type: 'spikes', x: 3050, y: 3050, w: 120, h: 120, damage: 25, interval: 100 },
        // EMP dead zones
        { type: 'emp', x: 600, y: 2300, w: 250, h: 400 },
        { type: 'emp', x: 4150, y: 2300, w: 250, h: 400 },
    ],

    ramps: [
        // Four ramps leading to floor 2 — one on each side
        { x: 2000, y: 2000, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'north' },
        { x: 2900, y: 2800, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'south' },
        { x: 1800, y: 2800, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'east' },
        { x: 2900, y: 2000, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'west' },
    ],

    floors: 2,
};
