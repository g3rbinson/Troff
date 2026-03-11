import { TRAIL_LIFE } from '../constants.js';

export class Trail {
    constructor(x, y, color, owner, idx) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = TRAIL_LIFE;
        this.owner = owner;
        this.idx = idx;
    }
}
