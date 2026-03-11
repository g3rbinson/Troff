// ============================================================
// Canvas Setup
// ============================================================
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const minimapCanvas = document.getElementById('minimap');
export const minimapCtx = minimapCanvas.getContext('2d');

export function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 180;
    minimapCanvas.height = 180;
}
