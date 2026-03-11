// ============================================================
// Math Utilities
// ============================================================
export function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

export function wrapAngleDiff(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}
