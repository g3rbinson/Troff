export class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.life = life; this.max = life;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.97; this.vy *= 0.97;
        this.life--;
    }
}

export function explode(particles, x, y, color, n) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 4;
        particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, 25 + Math.random() * 30 | 0));
    }
}
