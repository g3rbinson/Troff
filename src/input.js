// ============================================================
// Input Handling — Keyboard + Mouse
// ============================================================
export const keys = {};
export const mouse = { x: 0, y: 0, down: false, clicked: false };

export function initInput() {
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mousedown', e => {
        if (e.button === 0) { mouse.down = true; mouse.clicked = true; }
    });
    window.addEventListener('mouseup', e => {
        if (e.button === 0) mouse.down = false;
    });
}

export function consumeClick() {
    const was = mouse.clicked;
    mouse.clicked = false;
    return was;
}
