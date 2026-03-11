// ============================================================
// Level 6 — SECRET CIRCUIT
// Maximum chaos: huge arena, 3 floors, every hazard type, turrets
// ============================================================
export default {
    name: 'SECRET CIRCUIT',
    enemies: 8,
    freeBikes: 10,

    managerBefore: [
        "So... the secret circuit. It's real.",
        "Eight riders. No rules. Three-story arena.",
        "Turrets on every corner, traps lining the corridors.",
        "EMP fields will kill your boost on the upper floors.",
        "Nobody's ever walked out of this one.",
        "But nobody's ever been you, either. Let's end this."
    ],

    managerAfter: [
        "It's over. You've beaten every rider in the system.",
        "There's nobody left who can touch you.",
        "You are the GRID MASTER.",
        "Take it easy up here. You've earned it."
    ],

    obstacles: [
        // Maze-like outer walls
        { type: 'wall', x: 800, y: 1200, w: 20, h: 1000 },
        { type: 'wall', x: 800, y: 2800, w: 20, h: 1000 },
        { type: 'wall', x: 4180, y: 1200, w: 20, h: 1000 },
        { type: 'wall', x: 4180, y: 2800, w: 20, h: 1000 },
        { type: 'wall', x: 1200, y: 800, w: 1000, h: 20 },
        { type: 'wall', x: 2800, y: 800, w: 1000, h: 20 },
        { type: 'wall', x: 1200, y: 4180, w: 1000, h: 20 },
        { type: 'wall', x: 2800, y: 4180, w: 1000, h: 20 },
        // Central cross of death
        { type: 'wall', x: 2200, y: 2490, w: 250, h: 20 },
        { type: 'wall', x: 2550, y: 2490, w: 250, h: 20 },
        { type: 'wall', x: 2490, y: 2200, w: 20, h: 250 },
        { type: 'wall', x: 2490, y: 2550, w: 20, h: 250 },
        // Inner fortress walls
        { type: 'wall', x: 1800, y: 1800, w: 400, h: 20 },
        { type: 'wall', x: 2800, y: 1800, w: 400, h: 20 },
        { type: 'wall', x: 1800, y: 3180, w: 400, h: 20 },
        { type: 'wall', x: 2800, y: 3180, w: 400, h: 20 },
        { type: 'wall', x: 1800, y: 1800, w: 20, h: 400 },
        { type: 'wall', x: 3180, y: 1800, w: 20, h: 400 },
        { type: 'wall', x: 1800, y: 2800, w: 20, h: 400 },
        { type: 'wall', x: 3180, y: 2800, w: 20, h: 400 },
        // Pillar maze
        { type: 'pillar', x: 1400, y: 1400, radius: 40 },
        { type: 'pillar', x: 3600, y: 1400, radius: 40 },
        { type: 'pillar', x: 1400, y: 3600, radius: 40 },
        { type: 'pillar', x: 3600, y: 3600, radius: 40 },
        { type: 'pillar', x: 2500, y: 1200, radius: 55 },
        { type: 'pillar', x: 2500, y: 3800, radius: 55 },
        { type: 'pillar', x: 1200, y: 2500, radius: 55 },
        { type: 'pillar', x: 3800, y: 2500, radius: 55 },
        { type: 'pillar', x: 2500, y: 2500, radius: 30 },
    ],

    traps: [
        // Spike corridor gauntlet
        { type: 'spikes', x: 900, y: 2400, w: 100, h: 200, damage: 30, interval: 70 },
        { type: 'spikes', x: 4050, y: 2400, w: 100, h: 200, damage: 30, interval: 70 },
        { type: 'spikes', x: 2400, y: 900, w: 200, h: 100, damage: 30, interval: 70 },
        { type: 'spikes', x: 2400, y: 4050, w: 200, h: 100, damage: 30, interval: 70 },
        // Inner spike ring
        { type: 'spikes', x: 2100, y: 2100, w: 100, h: 100, damage: 35, interval: 60 },
        { type: 'spikes', x: 2800, y: 2100, w: 100, h: 100, damage: 35, interval: 60 },
        { type: 'spikes', x: 2100, y: 2800, w: 100, h: 100, damage: 35, interval: 60 },
        { type: 'spikes', x: 2800, y: 2800, w: 100, h: 100, damage: 35, interval: 60 },
        // EMP fields on upper floors
        { type: 'emp', x: 2200, y: 2200, w: 600, h: 600 },
        { type: 'emp', x: 600, y: 600, w: 400, h: 400 },
        { type: 'emp', x: 4000, y: 4000, w: 400, h: 400 },
        // Turrets everywhere
        { type: 'turret', x: 1000, y: 2500, interval: 150, damage: 35, direction: 'east' },
        { type: 'turret', x: 4000, y: 2500, interval: 150, damage: 35, direction: 'west' },
        { type: 'turret', x: 2500, y: 1000, interval: 150, damage: 35, direction: 'south' },
        { type: 'turret', x: 2500, y: 4000, interval: 150, damage: 35, direction: 'north' },
        // Corner turrets
        { type: 'turret', x: 800, y: 800, interval: 200, damage: 30, direction: 'east' },
        { type: 'turret', x: 4200, y: 800, interval: 200, damage: 30, direction: 'west' },
        { type: 'turret', x: 800, y: 4200, interval: 200, damage: 30, direction: 'east' },
        { type: 'turret', x: 4200, y: 4200, interval: 200, damage: 30, direction: 'west' },
    ],

    ramps: [
        // Floor 1 → 2 ramps (four cardinal points)
        { x: 1500, y: 2400, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'east' },
        { x: 3300, y: 2400, w: 200, h: 120, fromFloor: 1, toFloor: 2, direction: 'west' },
        { x: 2400, y: 1500, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'north' },
        { x: 2400, y: 3300, w: 120, h: 200, fromFloor: 1, toFloor: 2, direction: 'south' },
        // Floor 2 → 3 ramps (only two — harder to reach)
        { x: 2400, y: 2200, w: 100, h: 150, fromFloor: 2, toFloor: 3, direction: 'north' },
        { x: 2400, y: 2650, w: 100, h: 150, fromFloor: 2, toFloor: 3, direction: 'south' },
    ],

    floors: 3,
};
