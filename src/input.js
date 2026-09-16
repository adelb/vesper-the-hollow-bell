const KEYS = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyJ: 'attack', KeyK: 'heavy', ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'parry', KeyQ: 'parry', KeyF: 'heal', KeyE: 'interact', Escape: 'pause', KeyP: 'pause' };
const PAD = { 0: 'jump', 1: 'dash', 2: 'attack', 3: 'heavy', 4: 'parry', 5: 'heal', 9: 'pause', 12: 'interact', 14: 'left', 15: 'right' };
const MENU_PAD = { 0: 'uiConfirm', 1: 'uiBack', 9: 'pause', 12: 'uiPrevious', 13: 'uiNext', 14: 'uiPrevious', 15: 'uiNext' };

export class Input {
  constructor(canvas) {
    this.held = new Set();
    this.pressed = new Set();
    this.sources = new Map();
    this.padSources = new Set();
    this.padPhysical = new Set();
    this.active = false;
    this.lastDevice = 'keyboard';
    window.addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const action = KEYS[e.code];
      if (!action || !this.active) return;
      e.preventDefault();
      this.lastDevice = 'keyboard';
      this.set(e.code, action, true);
    });
    window.addEventListener('keyup', e => { if (KEYS[e.code]) this.set(e.code, KEYS[e.code], false); });
    window.addEventListener('blur', () => this.clear());
    canvas.addEventListener('pointerdown', e => {
      if (!this.active || e.pointerType === 'touch') return;
      this.set(`mouse${e.button}`, e.button === 2 ? 'heavy' : 'attack', true);
    });
    window.addEventListener('pointerup', e => this.set(`mouse${e.button}`, e.button === 2 ? 'heavy' : 'attack', false));
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', e => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.lastDevice = 'touch';
        this.set(`touch${e.pointerId}`, action, true);
        button.classList.add('held');
      });
      const release = e => { this.set(`touch${e.pointerId}`, action, false); button.classList.remove('held'); };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }

  set(source, action, on, allowPress = true) {
    if (on) {
      if (allowPress && !this.held.has(action)) this.pressed.add(action);
      this.sources.set(source, action);
    } else this.sources.delete(source);
    this.held = new Set(this.sources.values());
  }

  pollGamepad() {
    const pad = navigator.getGamepads?.().find(p => p?.connected);
    const next = new Map();
    const physical = new Set();
    if (pad) {
      const mapping = this.active ? PAD : MENU_PAD;
      pad.buttons.forEach((button, index) => {
        if (!button.pressed) return;
        const source = `pad-button-${index}`;
        physical.add(source);
        if (mapping[index]) next.set(source, mapping[index]);
      });
      if (pad.axes[0] < -0.25) physical.add('pad-left');
      if (pad.axes[0] > 0.25) physical.add('pad-right');
      if (pad.axes[1] < -0.5) physical.add('pad-up');
      if (pad.axes[1] > 0.5) physical.add('pad-down');
      if (this.active) {
        if (physical.has('pad-left')) next.set('pad-left', 'left');
        if (physical.has('pad-right')) next.set('pad-right', 'right');
      } else {
        if (physical.has('pad-up')) next.set('pad-up', 'uiPrevious');
        if (physical.has('pad-down')) next.set('pad-down', 'uiNext');
      }
      if (next.size) this.lastDevice = 'gamepad';
    }
    for (const source of this.padSources) if (!next.has(source)) this.set(source, '', false);
    for (const [source, action] of next) this.set(source, action, true, !this.padPhysical.has(source));
    this.padSources = new Set(next.keys());
    this.padPhysical = physical;
  }

  down(action) { return this.held.has(action); }
  take(action) { const value = this.pressed.has(action); this.pressed.delete(action); return value; }
  endFrame() { this.pressed.clear(); }
  // Keep physical controller edges across dialogs so a held confirm cannot skip the next screen.
  clear() { this.sources.clear(); this.held.clear(); this.pressed.clear(); }
}
