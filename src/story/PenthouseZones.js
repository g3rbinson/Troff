// ============================================================
// Penthouse Interactive Zones — zone definitions & overlap detection
// ============================================================

export const ZONES = [
    { id: 'window',   label: 'WINDOW',   xMin: 0.03, xMax: 0.22, prompt: 'LOOK OUT' },
    { id: 'stereo',   label: 'STEREO',   xMin: 0.25, xMax: 0.35, prompt: 'CHANGE MUSIC' },
    { id: 'couch',    label: 'MANAGER',  xMin: 0.38, xMax: 0.52, prompt: 'TALK TO MANAGER' },
    { id: 'computer', label: 'COMPUTER', xMin: 0.55, xMax: 0.68, prompt: 'UPGRADES' },
    { id: 'wardrobe', label: 'WARDROBE', xMin: 0.71, xMax: 0.82, prompt: 'CUSTOMIZE' },
    { id: 'elevator', label: 'ELEVATOR', xMin: 0.86, xMax: 0.97, prompt: 'DESCEND' },
];

/**
 * Returns the zone the player currently overlaps, or null.
 * @param {number} playerX — normalized 0–1 position
 */
export function getActiveZone(playerX) {
    for (const z of ZONES) {
        if (playerX >= z.xMin && playerX <= z.xMax) return z;
    }
    return null;
}
