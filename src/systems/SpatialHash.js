// ============================================================
// Spatial Hash — Fast spatial lookups for collision detection
// ============================================================
export class SpatialHash {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    insert(obj) {
        const key = `${Math.floor(obj.x / this.cellSize)},${Math.floor(obj.y / this.cellSize)}`;
        let cell = this.cells.get(key);
        if (!cell) {
            cell = [];
            this.cells.set(key, cell);
        }
        cell.push(obj);
    }

    query(x, y, radius) {
        const results = [];
        const cs = this.cellSize;
        const minCX = Math.floor((x - radius) / cs);
        const maxCX = Math.floor((x + radius) / cs);
        const minCY = Math.floor((y - radius) / cs);
        const maxCY = Math.floor((y + radius) / cs);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const cell = this.cells.get(`${cx},${cy}`);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        results.push(cell[i]);
                    }
                }
            }
        }
        return results;
    }
}
