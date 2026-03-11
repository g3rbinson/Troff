// ============================================================
// Elevator — Canvas-rendered elevator transition animation
// ============================================================
import { canvas, ctx } from '../canvas.js';

const RIDE_DURATION = 180; // frames (~3 seconds at 60fps)

export class Elevator {
    constructor() {
        this.active = false;
        this.direction = 'down'; // 'down' = penthouse→arena, 'up' = arena→penthouse
        this.frame = 0;
        this.duration = RIDE_DURATION;
        this.onComplete = null;
        this.startFloor = 99;
        this.endFloor = 1;
    }

    start(direction, onComplete) {
        this.active = true;
        this.direction = direction;
        this.frame = 0;
        this.onComplete = onComplete || null;
        if (direction === 'down') {
            this.startFloor = 99;
            this.endFloor = 1;
        } else {
            this.startFloor = 1;
            this.endFloor = 99;
        }
    }

    update() {
        if (!this.active) return;
        this.frame++;
        if (this.frame >= this.duration) {
            this.active = false;
            if (this.onComplete) this.onComplete();
        }
    }

    get progress() {
        return Math.min(this.frame / this.duration, 1);
    }

    get currentFloor() {
        const p = this.progress;
        // Ease in-out
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        return Math.round(this.startFloor + (this.endFloor - this.startFloor) * ease);
    }

    draw() {
        if (!this.active) return;
        const t = this.frame;
        const p = this.progress;

        // Background — dark elevator
        ctx.fillStyle = '#06000f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Elevator walls
        const wallW = Math.min(500, canvas.width * 0.6);
        const wallH = Math.min(600, canvas.height * 0.8);
        const wallX = cx - wallW / 2;
        const wallY = cy - wallH / 2;

        // Back wall
        ctx.fillStyle = '#0a0018';
        ctx.fillRect(wallX, wallY, wallW, wallH);

        // Wall panels
        ctx.strokeStyle = 'rgba(255,0,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const px = wallX + (wallW / 3) * i;
            ctx.beginPath(); ctx.moveTo(px, wallY); ctx.lineTo(px, wallY + wallH); ctx.stroke();
        }

        // Moving floor lines (show motion)
        const scrollSpeed = this.direction === 'down' ? 1 : -1;
        const scrollOffset = (t * 8 * scrollSpeed) % 40;
        ctx.strokeStyle = 'rgba(0,255,255,0.08)';
        for (let y = wallY; y < wallY + wallH; y += 40) {
            const ly = y + scrollOffset;
            if (ly >= wallY && ly <= wallY + wallH) {
                ctx.beginPath();
                ctx.moveTo(wallX, ly);
                ctx.lineTo(wallX + wallW, ly);
                ctx.stroke();
            }
        }

        // Side wall streaks (passing floors)
        ctx.strokeStyle = 'rgba(255,0,255,0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const streakY = ((t * 6 * scrollSpeed + i * 80) % wallH + wallH) % wallH + wallY;
            if (streakY >= wallY && streakY <= wallY + wallH) {
                ctx.beginPath();
                ctx.moveTo(wallX, streakY);
                ctx.lineTo(wallX + 20, streakY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(wallX + wallW - 20, streakY);
                ctx.lineTo(wallX + wallW, streakY);
                ctx.stroke();
            }
        }

        // Elevator border
        ctx.strokeStyle = 'rgba(0,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.strokeRect(wallX, wallY, wallW, wallH);

        // Door gap (closing at start, opening at end)
        let doorGap;
        if (p < 0.08) {
            // Doors closing
            doorGap = (1 - p / 0.08) * (wallW * 0.4);
        } else if (p > 0.92) {
            // Doors opening
            doorGap = ((p - 0.92) / 0.08) * (wallW * 0.4);
        } else {
            doorGap = 0;
        }

        if (doorGap > 1) {
            // Left door opening
            ctx.fillStyle = '#0a0018';
            ctx.fillRect(wallX, wallY, wallW / 2 - doorGap / 2, wallH);
            // Right door opening
            ctx.fillRect(cx + doorGap / 2, wallY, wallW / 2 - doorGap / 2, wallH);
        }

        // Floor counter display
        const displayW = 180;
        const displayH = 60;
        const displayX = cx - displayW / 2;
        const displayY = wallY + 30;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(displayX, displayY, displayW, displayH);
        ctx.strokeStyle = 'rgba(0,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(displayX, displayY, displayW, displayH);

        // Floor number
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillText(`FL ${this.currentFloor}`, cx, displayY + 44);
        ctx.shadowBlur = 0;

        // Direction arrow
        const arrowY = displayY + displayH + 20;
        ctx.fillStyle = 'rgba(255,0,255,0.7)';
        ctx.font = '20px "Courier New", monospace';
        const arrow = this.direction === 'down' ? '▼ DESCENDING' : '▲ ASCENDING';
        ctx.fillText(arrow, cx, arrowY);

        // Destination label
        ctx.fillStyle = 'rgba(255,0,255,0.4)';
        ctx.font = '14px "Courier New", monospace';
        const dest = this.direction === 'down' ? 'DESTINATION: ARENA — FLOOR 1' : 'DESTINATION: PENTHOUSE — FLOOR 99';
        ctx.fillText(dest, cx, arrowY + 25);
        ctx.textAlign = 'left';

        // Screen edge glow
        const edgeAlpha = 0.1 + 0.05 * Math.sin(t * 0.1);
        const eg = ctx.createLinearGradient(0, 0, 20, 0);
        eg.addColorStop(0, `rgba(0,255,255,${edgeAlpha})`);
        eg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(0, 0, 20, canvas.height);
        const eg2 = ctx.createLinearGradient(canvas.width, 0, canvas.width - 20, 0);
        eg2.addColorStop(0, `rgba(0,255,255,${edgeAlpha})`);
        eg2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eg2;
        ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);

        // Scanlines overlay
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y = 0; y < canvas.height; y += 3) {
            ctx.fillRect(0, y, canvas.width, 1);
        }

        // Vignette
        const vg = ctx.createRadialGradient(cx, cy, wallW * 0.3, cx, cy, canvas.width * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
