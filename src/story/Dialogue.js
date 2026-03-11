// ============================================================
// Dialogue — Typewriter-style dialogue box for manager
// ============================================================
import { canvas, ctx } from '../canvas.js';

const CHARS_PER_FRAME = 1.5; // typing speed
const LINE_PAUSE = 30;       // pause frames between lines

export class Dialogue {
    constructor() {
        this.lines = [];
        this.currentLine = 0;
        this.charIndex = 0;
        this.frameAcc = 0;
        this.linePause = 0;
        this.done = false;
        this.active = false;
        this.speakerName = '';
        this.onComplete = null;
    }

    start(lines, speaker, onComplete) {
        this.lines = lines;
        this.speakerName = speaker || 'MANAGER';
        this.currentLine = 0;
        this.charIndex = 0;
        this.frameAcc = 0;
        this.linePause = 0;
        this.done = false;
        this.active = true;
        this.onComplete = onComplete || null;
    }

    /** Advance: skip to end of line, or next line, or finish */
    advance() {
        if (!this.active) return;
        if (this.charIndex < this.lines[this.currentLine].length) {
            // Reveal full line instantly
            this.charIndex = this.lines[this.currentLine].length;
            this.linePause = 0;
        } else if (this.currentLine < this.lines.length - 1) {
            // Next line
            this.currentLine++;
            this.charIndex = 0;
            this.frameAcc = 0;
        } else {
            // All done
            this.done = true;
            this.active = false;
            if (this.onComplete) this.onComplete();
        }
    }

    update() {
        if (!this.active || this.done) return;

        // Pause between lines
        if (this.linePause > 0) {
            this.linePause--;
            return;
        }

        this.frameAcc += CHARS_PER_FRAME;
        while (this.frameAcc >= 1) {
            this.frameAcc -= 1;
            if (this.charIndex < this.lines[this.currentLine].length) {
                this.charIndex++;
            } else if (this.currentLine < this.lines.length - 1) {
                this.linePause = LINE_PAUSE;
                this.currentLine++;
                this.charIndex = 0;
                this.frameAcc = 0;
                break;
            } else {
                // Reached end naturally — wait for player input
                break;
            }
        }
    }

    get isSpeaking() {
        return this.active && !this.done &&
            this.charIndex < this.lines[this.currentLine].length;
    }

    draw() {
        if (!this.active && !this.done) return;

        const boxH = 140;
        const boxY = canvas.height - boxH - 20;
        const boxX = 40;
        const boxW = canvas.width - 80;

        // Box background
        ctx.fillStyle = 'rgba(10, 0, 30, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Box border
        ctx.strokeStyle = 'rgba(0,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner accents
        const cornerLen = 12;
        ctx.strokeStyle = 'rgba(255,0,255,0.8)';
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath(); ctx.moveTo(boxX, boxY + cornerLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cornerLen, boxY); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cornerLen); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - cornerLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cornerLen, boxY + boxH); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen); ctx.stroke();

        // Speaker name
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.fillText(this.speakerName, boxX + 16, boxY + 24);
        ctx.shadowBlur = 0;

        // Dialogue text (show all revealed lines + current typing line)
        ctx.fillStyle = '#ff88ff';
        ctx.font = '15px "Courier New", monospace';
        let textY = boxY + 50;
        const lineHeight = 22;

        for (let i = 0; i <= this.currentLine && i < this.lines.length; i++) {
            const text = i < this.currentLine
                ? this.lines[i]
                : this.lines[i].substring(0, this.charIndex);
            ctx.fillText(text, boxX + 16, textY);
            textY += lineHeight;
        }

        // "Press ENTER / Click" prompt
        if (this.charIndex >= this.lines[this.currentLine].length) {
            const blink = Math.sin(Date.now() * 0.005) > 0;
            if (blink) {
                ctx.fillStyle = 'rgba(0,255,255,0.6)';
                ctx.font = '12px "Courier New", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('[ ENTER / CLICK ]', boxX + boxW - 16, boxY + boxH - 14);
                ctx.textAlign = 'left';
            }
        }
    }
}
