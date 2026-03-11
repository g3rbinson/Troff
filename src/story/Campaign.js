// ============================================================
// Campaign — Loads modular level definitions
// ============================================================
// Each level lives in its own file under levels/.
// To add/edit a level, just edit the file in levels/ — no other
// code changes needed. Each level file exports:
//   name, enemies, freeBikes, managerBefore[], managerAfter[],
//   obstacles[], traps[], ramps[], floors
// ============================================================

import level1 from './levels/level1.js';
import level2 from './levels/level2.js';
import level3 from './levels/level3.js';
import level4 from './levels/level4.js';
import level5 from './levels/level5.js';
import level6 from './levels/level6.js';

export const fights = [level1, level2, level3, level4, level5, level6];

export function getFight(index) {
    if (index >= fights.length) return null;
    return fights[index];
}
