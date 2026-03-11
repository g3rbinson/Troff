// ============================================================
// Level 5 — GRID CHAMPIONSHIP
// Complex multi-floor arena, heavy obstacles, traps everywhere
// ============================================================
export default {
    name: 'GRID CHAMPIONSHIP',
    enemies: 6,
    freeBikes: 8,

    managerBefore: [
        "Kid... this is the Grid Championship.",
        "Six of the deadliest riders the system has ever produced.",
        "The champion's in there too. Cyan bike. Never been beaten.",
        "Three-floor arena. Ramps, traps, EMP fields — the works.",
        "Everything we've worked for comes down to this.",
        "Go out there and make history."
    ],

    managerAfter: [
        "CHAMPION! YOU ARE THE GRID CHAMPION!",
        "I can't believe it! From nobody to the top of the grid!",
        "The whole system is yours now, kid.",
        "...But between you and me, I hear there's a secret circuit.",
        "We'll talk about that later. Tonight — we celebrate!"
    ],

    obstacles: [
        // Central tower walls (three concentric rings with gaps)
        // Outer ring
        { type: 'wall', x: 1800, y: 1800, w: 1400, h: 20 },
        { type: 'wall', x: 1800, y: 3180, w: 1400, h: 20 },
        { type: 'wall', x: 1800, y: 1800, w: 20, h: 600 },
        { type: 'wall', x: 1800, y: 2600, w: 20, h: 600 },
        { type: 'wall', x: 3180, y: 1800, w: 20, h: 600 },
        { type: 'wall', x: 3180, y: 2600, w: 20, h: 600 },
        // Inner ring
        { type: 'wall', x: 2200, y: 2200, w: 200, h: 20 },
        { type: 'wall', x: 2600, y: 2200, w: 200, h: 20 },
        { type: 'wall', x: 2200, y: 2780, w: 200, h: 20 },
        { type: 'wall', x: 2600, y: 2780, w: 200, h: 20 },
        { type: 'wall', x: 2200, y: 2200, w: 20, h: 200 },
        { type: 'wall', x: 2200, y: 2600, w: 20, h: 200 },
        { type: 'wall', x: 2780, y: 2200, w: 20, h: 200 },
        { type: 'wall', x: 2780, y: 2600, w: 20, h: 200 },
        // Guard pillars
        { type: 'pillar', x: 1000, y: 1000, radius: 60 },
        { type: 'pillar', x: 4000, y: 1000, radius: 60 },
        { type: 'pillar', x: 1000, y: 4000, radius: 60 },
        { type: 'pillar', x: 4000, y: 4000, radius: 60 },
        { type: 'pillar', x: 2500, y: 500, radius: 50 },
        { type: 'pillar', x: 2500, y: 4500, radius: 50 },
        { type: 'pillar', x: 500, y: 2500, radius: 50 },
        { type: 'pillar', x: 4500, y: 2500, radius: 50 },
    ],

    traps: [
        // Spike ring around inner sanctum
        { type: 'spikes', x: 2100, y: 2100, w: 80, h: 80, damage: 30, interval: 90 },
        { type: 'spikes', x: 2820, y: 2100, w: 80, h: 80, damage: 30, interval: 90 },
        { type: 'spikes', x: 2100, y: 2820, w: 80, h: 80, damage: 30, interval: 90 },
        { type: 'spikes', x: 2820, y: 2820, w: 80, h: 80, damage: 30, interval: 90 },
        // EMP dead zones in corridors
        { type: 'emp', x: 1300, y: 2300, w: 300, h: 400 },
        { type: 'emp', x: 3400, y: 2300, w: 300, h: 400 },
        // Outer spike traps
        { type: 'spikes', x: 600, y: 2450, w: 150, h: 100, damage: 25, interval: 80 },
        { type: 'spikes', x: 4250, y: 2450, w: 150, h: 100, damage: 25, interval: 80 },
        // Turrets that fire discs periodically
        { type: 'turret', x: 1800, y: 2500, interval: 180, damage: 30, direction: 'east' },
        { type: 'turret', x: 3200, y: 2500, interval: 180, damage: 30, direction: 'west' },
    ],

    ramps: [
        // Floor 1 → 2 ramps
        { x: 2000, y: 1600, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'north' },
        { x: 2900, y: 3200, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'south' },
        { x: 1500, y: 2400, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'east' },
        { x: 3300, y: 2400, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'west' },
        // Floor 2 → 3 ramps (inside the inner ring)
        { x: 2400, y: 2200, w: 100, h: 150, fromFloor: 2, toFloor: 3, direction: 'north' },
        { x: 2400, y: 2650, w: 100, h: 150, fromFloor: 2, toFloor: 3, direction: 'south' },
    ],

    floors: 3,
};
