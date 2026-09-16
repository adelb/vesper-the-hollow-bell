import { CHAPTERS, WIDTH, HEIGHT, PROLOGUE, NPCS } from './content.js';
import { random, rect, polygon, line, glow, surface, shape, oval, limb } from './art.js';
import { drawHunter, drawEnemy, drawBoss, drawNPC } from './actors.js';
import { ATTACKS, attackColor } from './attacks.js';
import { drawHazard, drawProjectile } from './effects.js';
import { livingWorld, districtLandmark } from './world.js';
import { entrancePose, drawEntrance } from './entrance.js';

function gothicWindow(c, x, y, w, h, lit, palette, detailed = true) {
  polygon(c, [[x, y + h], [x, y + w / 2], [x + w / 2, y], [x + w, y + w / 2], [x + w, y + h]], '#0c1c20');
  if (lit) {
    polygon(c, [[x + 2, y + h - 2], [x + 2, y + w / 2 + 1], [x + w / 2, y + 3], [x + w - 2, y + w / 2 + 1], [x + w - 2, y + h - 2]], palette.light);
    rect(c, x + 3, y + h / 2, w - 6, h / 2 - 3, '#bb8a50');
    glow(c, x + w / 2, y + h / 2, w * 2.5, palette.light, 0.12);
  }
  rect(c, x + w / 2 - 1, y + 4, 2, h - 4, '#27332f');
  if (detailed) { rect(c, x, y + h * 0.57, w, 2, '#27332f'); rect(c, x - 2, y + h, w + 4, 3, palette.edge); }
}

function spire(c, x, y, w, h, color, edge) {
  rect(c, x + w * 0.2, y + h * 0.34, w * 0.6, h * 0.66, color);
  polygon(c, [[x - 4, y + h * 0.4], [x + w / 2, y], [x + w + 4, y + h * 0.4]], color);
  line(c, x + w / 2, y + 2, x + w + 2, y + h * 0.4, edge);
  rect(c, x + w / 2 - 1, y - 17, 2, 21, edge);
  rect(c, x + w / 2 - 5, y - 11, 10, 2, edge);
  rect(c, x + w * 0.16, y + h * 0.43, w * 0.68, 4, edge);
}

function house(c, x, ground, w, h, palette, rng, depth) {
  const y = ground - h;
  const color = depth === 0 ? palette.far : palette.mid;
  rect(c, x, y, w, h, color);
  const roofH = w * (0.28 + rng() * 0.5);
  polygon(c, [[x - 9, y], [x + w * 0.5, y - roofH], [x + w + 9, y]], depth === 0 ? palette.far : '#15272a');
  if (depth) {
    line(c, x - 8, y, x + w / 2, y - roofH, palette.edge);
    for (let r = 8; r < roofH; r += 8) {
      const rw = w * (r / roofH);
      line(c, x + w / 2 - rw / 2, y - roofH + r, x + w / 2 + rw / 2, y - roofH + r, '#2b4242');
    }
    rect(c, x - 4, y, w + 8, 4, '#50605a');
    rect(c, x + w - 7, y, 7, h, '#15282c');
  }
  if (rng() > 0.5) { rect(c, x + 12, y - roofH * 0.5 - 23, 10, 30, color); rect(c, x + 10, y - roofH * 0.5 - 23, 14, 4, palette.edge); }
  const cols = Math.max(1, Math.floor(w / (depth ? 24 : 20)));
  for (let row = 0; row < h / 35 - 1; row++) for (let col = 0; col < cols; col++) {
    const wx = x + 7 + col * (w - 9) / cols;
    const wy = y + 12 + row * 33;
    if (depth) gothicWindow(c, wx, wy, 9, 18, rng() > 0.68, palette, false);
    else rect(c, wx, wy + 3, 3, 7, rng() > 0.8 ? '#777d59' : '#102e33');
  }
  if (depth) {
    for (let b = 0; b < h; b += 17) {
      rect(c, x, y + b, w, 1, '#182d30');
      for (let k = 0; k < 4; k++) rect(c, x + rng() * w, y + b + 4, 2 + rng() * 8, 1, '#45514a');
    }
    for (const offset of [2, w - 5]) { rect(c, x + offset, y + 4, 3, h - 4, '#566058'); }
  }
}

function cathedral(c, x, bottom, p, rng, scale = 1) {
  c.save(); c.translate(x, bottom); c.scale(scale, scale);
  const body = '#263a3b', shade = '#182b30', edge = '#697469';
  rect(c, -118, -218, 236, 218, body);
  polygon(c, [[-133, -215], [0, -324], [133, -215]], shade);
  for (let y = -301; y < -219; y += 9) {
    const w = (y + 324) * 1.2; line(c, -w, y, w, y, '#40514d');
  }
  line(c, -134, -215, 0, -324, edge, 2); line(c, 0, -324, 134, -215, '#49615b', 2);
  rect(c, -129, -218, 258, 7, edge);
  for (const side of [-1, 1]) {
    const tx = side * 119 - 27;
    rect(c, tx, -258, 54, 258, body);
    rect(c, tx + 42, -258, 12, 258, shade);
    spire(c, tx - 6, -390 + (side === 1 ? -30 : 0), 66, 167 + (side === 1 ? 30 : 0), '#1c3236', '#61746b');
    for (let floor = 0; floor < 3; floor++) {
      rect(c, tx - 6, -241 + floor * 78, 65, 4, edge);
      gothicWindow(c, tx + 10, -231 + floor * 75, 13, 46, floor === 1, p);
      gothicWindow(c, tx + 30, -231 + floor * 75, 13, 46, floor !== 0, p);
    }
    for (const n of [0, 50]) { rect(c, tx + n, -265, 5, 265, '#4c615a'); spire(c, tx + n - 6, -285, 17, 35, body, edge); }
  }
  // The rose window uses stepped rings to retain its carved, pixel silhouette.
  for (let r = 39; r > 0; r--) {
    const col = r > 35 ? edge : r > 31 ? '#132a2e' : r > 27 ? '#8a936f' : '#404e43';
    for (let angle = 0; angle < 6.28; angle += 0.035) rect(c, Math.cos(angle) * r, -199 + Math.sin(angle) * r, 2, 2, col);
  }
  for (let a = 0; a < 8; a++) {
    const ang = a * Math.PI / 4;
    line(c, 0, -199, Math.cos(ang) * 33, -199 + Math.sin(ang) * 33, '#afa67a', 2);
  }
  glow(c, 0, -199, 60, p.light, 0.15);
  gothicWindow(c, -31, -135, 62, 135, false, p);
  gothicWindow(c, -22, -122, 44, 122, true, p);
  rect(c, -19, -73, 38, 73, '#1b2a29');
  line(c, 0, -76, 0, 0, '#8e8b6a', 2);
  for (const x1 of [-91, -59, 50, 82]) gothicWindow(c, x1, -133, 13, 57, rng() > 0.3, p);
  for (let b = 0; b < 6; b++) {
    const xx = -112 + b * 42;
    rect(c, xx, -171, 6, 171, '#53635b'); rect(c, xx - 3, -175, 12, 7, edge);
    polygon(c, [[xx - 3, 0], [xx - 3, -65], [xx - 18, -10], [xx - 18, 0]], '#4c5c52');
  }
  for (let n = 0; n < 450; n++) rect(c, -118 + rng() * 236, -180 + rng() * 178, 2 + rng() * 6, 1, rng() > 0.5 ? '#5b685c' : '#1b3133');
  rect(c, -164, 0, 328, 7, edge); rect(c, -178, 7, 356, 7, '#3d514c');
  c.restore();
}

function tree(c, x, y, height, p, rng) {
  const branch = (bx, by, length, angle, width, depth) => {
    const endX = bx + Math.cos(angle) * length, endY = by + Math.sin(angle) * length;
    line(c, bx, by, endX, endY, depth < 2 ? '#23372f' : '#384837', width);
    line(c, bx + 1, by, endX + 1, endY, '#607154', Math.max(1, width / 4));
    if (depth > 0) {
      branch(endX, endY, length * 0.69, angle - 0.3 - rng() * 0.3, width * 0.65, depth - 1);
      branch(endX, endY, length * 0.65, angle + 0.25 + rng() * 0.5, width * 0.65, depth - 1);
      if (depth === 2) for (let i = 0; i < 14; i++) rect(c, endX - 24 + rng() * 48, endY - 14 + rng() * 25, 4, 2, rng() > 0.5 ? p.edge : '#455b42');
    }
  };
  branch(x, y, height * 0.38, -Math.PI / 2 + 0.1, 14, 4);
}

export class Renderer {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.settings = settings;
    this.cache = new Map();
    this.rain = Array.from({ length: 95 }, (_, i) => ({ x: (i * 173.23) % WIDTH, y: (i * 81.31) % HEIGHT, speed: 155 + i % 5 * 22 }));
    this.stars = Array.from({ length: 100 }, (_, i) => ({ x: i * 171.731 % WIDTH, y: i * 53.217 % 330, size: i % 6 === 0 ? 2 : 1 }));
  }

  layers(index) {
    if (this.cache.has(index)) return this.cache.get(index);
    const p = CHAPTERS[index].palette, rng = random(518 + index * 783);
    const far = surface(1920, 540), mid = surface(2300, 540), architecture = surface(1600, 540);
    const fc = far.getContext('2d'), mc = mid.getContext('2d'), ac = architecture.getContext('2d');
    for (let x = -50; index < 3 && x < 1920; x += 35 + rng() * 35) {
      const h = 90 + rng() * 150;
      house(fc, x, 426, 35 + rng() * 50, h, p, rng, 0);
      if (rng() > 0.77) spire(fc, x + 5, 426 - h - 100, 30, 130, p.far, p.mid);
    }
    for (let x = -20; index < 2 && x < 2300; x += 105 + rng() * 65) {
      house(mc, x, 479, 70 + rng() * 75, 120 + rng() * 120, p, rng, 1);
    }
    if (index === 1) {
      for (const x of [180, 380, 640, 910, 1250, 1440]) tree(ac, x, 470, 290 + rng() * 80, p, rng);
      cathedral(ac, 770, 455, p, rng, 0.58);
    } else if (index === 2) {
      cathedral(ac, 650, 500, p, rng, 0.72);
      for (let x = 60; x < 1550; x += 220) {
        rect(ac, x, 40, 22, 450, '#30444a');
        rect(ac, x + 3, 40, 4, 450, '#678183');
        polygon(ac, [[x + 20, 110], [x + 110, 30], [x + 220, 110], [x + 220, 70], [x + 110, -10], [x + 20, 70]], '#324b50');
      }
    } else if (index === 3) {
      for (let x = 60; x < 1580; x += 280) {
        spire(ac, x, 250 + rng() * 80, 43, 240, '#383c4c', '#8c819a');
        for (let n = 0; n < 4; n++) gothicWindow(ac, x + 12, 365 + n * 30, 12, 23, n % 2 === 0, p);
      }
    } else if (index === 4) {
      for (let i = 0; i < 14; i++) {
        const x = i * 119;
        shape(ac, [[x, 530], [x + 9, 293], [x + 55, 164], [x + 107, 291], [x + 112, 530], [x + 100, 523], [x + 95, 299], [x + 55, 187], [x + 24, 303], [x + 20, 530]], '#553d49', '#77555e');
      }
    } else cathedral(ac, 760, 460, p, rng, 1.02);
    const result = { far, mid, architecture };
    this.cache.set(index, result);
    return result;
  }

  background(index, camera, time, menu = false) {
    const c = this.ctx, p = CHAPTERS[index].palette, layers = this.layers(index);
    if (this.settings.reducedMotion) time = 8;
    const sky = c.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#09151d'); sky.addColorStop(0.45, p.sky); sky.addColorStop(1, p.fog);
    c.fillStyle = sky; c.fillRect(0, 0, WIDTH, HEIGHT);
    const moonX = menu ? 684 : 688 - camera * 0.025, moonY = index === 4 ? 155 : 118;
    const radius = index === 4 ? 0 : menu ? 77 : index === 2 ? 45 : 65;
    glow(c, moonX, moonY, 190, p.moon, 0.12);
    for (const s of this.stars) rect(c, (s.x - camera * 0.016 + WIDTH) % WIDTH, s.y, s.size, s.size, '#617979');
    for (let y = -radius; y <= radius; y += 2) {
      const w = Math.floor(Math.sqrt(radius * radius - y * y));
      rect(c, moonX - w, moonY + y, w * 2, 2, p.moon);
    }
    const rng = random(827);
    c.save(); c.globalAlpha = 0.11;
    for (let i = 0; i < 480; i++) {
      const x = rng() * radius * 2 - radius, y = rng() * radius * 2 - radius;
      if (x * x + y * y < radius * radius * 0.9) rect(c, moonX + x, moonY + y, 2 + rng() * 9, 2 + rng() * 3, '#354c4a');
    }
    c.restore();
    polygon(c, [[moonX + 7, moonY - radius], [moonX - 9, moonY - 22], [moonX + 8, moonY - 8], [moonX - 6, moonY + 28], [moonX + 19, moonY + radius - 3], [moonX + 10, moonY + 27], [moonX + 21, moonY - 9], [moonX + 2, moonY - 24], [moonX + 15, moonY - radius]], p.sky);
    for (let i = 0; i < 7; i++) {
      const x = ((i * 231 + time * (2 + i * 0.3) - camera * 0.06) % 1280) - 180;
      c.save(); c.globalAlpha = 0.1 + i % 2 * 0.04;
      for (let n = 0; n < 9; n++) rect(c, x + n * 27, 72 + i * 33 + Math.sin(n + i) * 6, 70, 4 + i % 3, p.fog);
      c.restore();
    }
    this.tileLayer(layers.far, camera * 0.16, 0.85);
    const fog = c.createLinearGradient(0, 250, 0, 500);
    fog.addColorStop(0, 'transparent'); fog.addColorStop(1, p.fog);
    c.save(); c.globalAlpha = 0.3; c.fillStyle = fog; c.fillRect(0, 250, WIDTH, 250); c.restore();
    this.tileLayer(layers.mid, camera * 0.32 + (menu ? 270 : 0), 0.7);
    const offset = menu ? 85 : camera * 0.21 + 25;
    this.tileLayer(layers.architecture, offset, 1);
    c.save(); c.globalAlpha = 0.14; c.fillStyle = fog; c.fillRect(0, 260, WIDTH, 280); c.restore();
    if (index === 2) {
      rect(c, 0, 487, WIDTH, 53, '#163a46');
      for (let i = 0; i < 55; i++) rect(c, (i * 117 + time * 6) % WIDTH, 490 + i % 22 * 2, 6 + i % 8 * 4, 1, '#4c7d84');
    }
    if (index < 2) this.birds(time, camera);
    livingWorld(c, index, camera, time, this.settings, menu);
  }

  tileLayer(layer, offset, opacity) {
    const c = this.ctx;
    c.save(); c.globalAlpha = opacity;
    const x = -Math.round(offset % layer.width);
    c.drawImage(layer, x, 0);
    if (x + layer.width < WIDTH) c.drawImage(layer, x + layer.width, 0);
    c.restore();
  }

  birds(time, camera) {
    for (let i = 0; i < 7; i++) {
      const x = (time * 14 + i * 46 + 290 - camera * 0.1) % 1200;
      const y = 113 + Math.sin(i * 1.8) * 23 + Math.sin(time * 0.6 + i) * 10;
      const wing = Math.sin(time * 6 + i) * 4;
      line(this.ctx, x - 5, y + wing, x, y, '#0d2127', 2); line(this.ctx, x, y, x + 5, y + wing, '#0d2127', 2);
    }
  }

  platform(floor, p, index) {
    const c = this.ctx, { x, y, w, h } = floor;
    if (x + w < -30 || x > WIDTH + 30) return;
    rect(c, x, y, w, h, '#1a282c');
    rect(c, x, y, w, 5, p.edge);
    rect(c, x, y + 5, w, 6, p.stone);
    rect(c, x, y + 11, w, 3, '#14262b');
    rect(c, x + 3, y + 14, w - 6, 2, '#596155');
    const start = Math.max(0, Math.floor(-x / 24) * 24);
    for (let row = 0; row < Math.min(h, 150) / 13; row++) {
      for (let bx = start - 24; bx < Math.min(w, WIDTH - x + 24); bx += 27) {
        const xx = x + bx + (row % 2) * 13;
        if (xx < x || xx + 24 > x + w) continue;
        rect(c, xx + 1, y + 18 + row * 13, 24, 10, (bx + row * 3) % 7 === 0 ? '#334240' : p.stone);
        rect(c, xx + 2, y + 18 + row * 13, 21, 1, '#647063');
        rect(c, xx + 4, y + 23 + row * 13, 4, 1, '#293a38');
      }
    }
    if (h > 50) {
      for (let ax = x + 56; ax < x + w - 40; ax += 145) {
        if (ax < -130 || ax > WIDTH + 100) continue;
        polygon(c, [[ax - 44, y + 120], [ax - 44, y + 65], [ax - 37, y + 49], [ax - 22, y + 34], [ax, y + 28], [ax + 22, y + 34], [ax + 37, y + 49], [ax + 44, y + 65], [ax + 44, y + 120]], '#101f25');
        line(c, ax - 45, y + 66, ax - 25, y + 37, '#627264', 3);
        line(c, ax - 25, y + 37, ax, y + 30, '#627264', 3);
        line(c, ax, y + 30, ax + 25, y + 37, '#45594f', 3);
        if (index === 4) glow(c, ax, y + 80, 45, '#be766b', 0.15);
      }
    } else {
      for (let sx = x + 20; sx < x + w; sx += 56) polygon(c, [[sx, y + 17], [sx + 17, y + 17], [sx, y + 37]], p.stone);
    }
    if (index === 1) {
      for (let i = 5; i < w; i += 23) {
        if (x + i < -10 || x + i > WIDTH) continue;
        line(c, x + i, y, x + i - 4, y - 10 - i % 7, '#82906a', 2);
        line(c, x + i, y - 3, x + i + 5, y - 8, '#566f4d', 2);
      }
    }
  }

  railing(x, y, w, color = '#1a2829') {
    const c = this.ctx;
    line(c, x, y - 32, x + w, y - 32, color, 3);
    line(c, x, y - 9, x + w, y - 9, color, 2);
    for (let xx = x + 7; xx < x + w; xx += 17) {
      rect(c, xx, y - 41, 2, 42, color);
      polygon(c, [[xx - 2, y - 38], [xx + 1, y - 46], [xx + 4, y - 38]], color);
    }
  }

  lamp(x, y, time, p, checkpoint = false) {
    const c = this.ctx;
    const h = checkpoint ? 108 : 97;
    rect(c, x - 5, y - 5, 12, 5, '#566053');
    rect(c, x - 2, y - h + 16, 5, h - 20, '#17292c');
    rect(c, x, y - h + 18, 1, h - 20, '#7b8067');
    rect(c, x - 5, y - h + 19, 11, 4, '#77816b');
    polygon(c, [[x - 9, y - h + 17], [x - 11, y - h - 5], [x + 12, y - h - 5], [x + 9, y - h + 17]], '#28362f');
    rect(c, x - 7, y - h - 3, 15, 18, p.light);
    rect(c, x - 4, y - h, 4, 13, '#fff0b9');
    rect(c, x + 1, y - h - 3, 2, 19, '#6e653e');
    polygon(c, [[x - 14, y - h - 6], [x, y - h - 15], [x + 15, y - h - 6]], '#263d39');
    rect(c, x - 1, y - h - 22, 3, 9, '#828674');
    glow(c, x, y - h + 5, 100 + Math.sin(time * 4) * 4, p.light, checkpoint ? 0.38 : 0.25);
    glow(c, x, y - 3, 60, p.light, 0.12);
    if (checkpoint) {
      for (let i = 0; i < 5; i++) {
        const yy = y - 8 - (time * 19 + i * 22) % 90;
        rect(c, x + Math.sin(time + i * 2) * 17, yy, 2, 2, '#e7d49a');
      }
      rect(c, x + 17, y - 14, 20, 14, '#443d30'); rect(c, x + 15, y - 17, 24, 4, '#86734d');
      rect(c, x + 22, y - 13, 3, 9, '#b9a272');
    }
  }

  drawHunter(p, time, alpha = 1) {
    drawHunter(this.ctx, p, time, alpha);
  }

  drawEnemy(e, time) {
    if (e.hp <= 0) return;
    const c = this.ctx;
    drawEnemy(c, e, time);
    if (e.hp < e.maxHp) {
      rect(c, e.x - 5, e.y - 11, e.w + 10, 3, '#18272a');
      rect(c, e.x - 5, e.y - 11, (e.w + 10) * e.hp / e.maxHp, 2, '#a27762');
    }
    this.telegraph(e, time);
  }

  drawBoss(e, time) {
    if (e.hp <= 0) return;
    drawBoss(this.ctx, e, time);
    this.telegraph(e, time);
    if (e.phase === 2) glow(this.ctx, e.x + e.w / 2, e.y + e.h / 2, 100, e.color, 0.13);
  }

  telegraph(e, time) {
    const c = this.ctx;
    if (e.stagger > 0.6) {
      for (let i = 0; i < 3; i++) {
        const a = time * 5 + i * 2.1;
        rect(c, e.x + e.w / 2 + Math.cos(a) * 17, e.y - 10 + Math.sin(a) * 5, 3, 3, '#f3df9c');
      }
    } else if (e.state === 'windup') {
      const progress = 1 - e.timer / e.windupDuration;
      const color = attackColor(e.pattern), attack = ATTACKS[e.pattern];
      const cx = e.x + e.w / 2;
      glow(c, cx, e.y + e.h / 2, 55, color, progress * 0.4);
      polygon(c, [[cx, e.y - 26], [cx + 5, e.y - 19], [cx, e.y - 12], [cx - 5, e.y - 19]], color);
      rect(c, cx - 20, e.y - 7, 40, 2, '#223334');
      rect(c, cx - 20, e.y - 7, 40 * progress, 2, color);
      if (attack) {
        c.textAlign = 'center'; c.font = e.isBoss ? '10px Georgia' : '8px Georgia'; c.fillStyle = '#ecdfbc';
        c.fillText(e.isBoss ? attack.name : e.species.name, cx, e.y - 38);
        if (attack.beats?.length > 1) for (let i = 0; i < attack.beats.length; i++) rect(c, cx - (attack.beats.length - 1) * 5 + i * 10 - 2, e.y - 33, 4, 2, color);
      }
      if (attack?.teleport && !e.teleported) {
        const x = e.teleportX + e.w / 2, y = e.y + e.h;
        c.save(); c.globalAlpha = 0.55;
        c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - e.h / 2, 19, e.h * 0.65, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    }
  }

  decorations(game) {
    const c = this.ctx, level = game.level, p = level.palette, camera = game.camera;
    for (let i = 0; i < Math.ceil(level.arena / 233); i++) {
      const wx = 70 + i * 233, x = wx - camera, y = game.floorAt(wx);
      if (x < -150 || x > WIDTH + 150 || wx > level.arena - 90) continue;
      if (i % 2 === 0) this.railing(x, y, 102);
      if (i % 3 === 0 && level.lamps.every(lamp => Math.abs(wx - lamp) > 90) && wx > 230) this.lamp(x, y, game.time + i, p);
      if (i % 3 === 1) {
        rect(c, x, y - 20, 24, 20, '#39433a'); rect(c, x - 2, y - 22, 28, 4, '#76765d');
        line(c, x + 2, y - 18, x + 21, y - 2, '#73745b', 2);
        line(c, x + 21, y - 18, x + 2, y - 2, '#73745b', 2);
        rect(c, x + 29, y - 11, 14, 11, '#4d4b3d'); rect(c, x + 28, y - 13, 16, 3, '#8d8160');
      }
    }
    for (const x of level.lamps) this.lamp(x - camera, game.floorAt(x), game.time, p, true);
    for (const memory of level.memories) if (!game.save.memories.includes(memory.id) && Math.abs(memory.x - camera - WIDTH / 2) < WIDTH) {
      const x = memory.x - camera, y = memory.y - 20;
      glow(c, x, y, 34, p.light, 0.3);
      shape(c, [[x - 8, y - 4], [x, y - 8], [x + 8, y - 4], [x + 7, y + 7], [x, y + 3], [x - 7, y + 7]], '#dac9a2', '#7b7966');
      line(c, x, y - 6, x, y + 2, '#82745c');
    }
    if (!game.save.notes.includes(game.save.chapter)) {
      const x = level.noteX - camera, y = game.floorAt(level.noteX) - 16;
      rect(c, x - 6, y + Math.sin(game.time * 2) * 2, 12, 9, '#c9bc98');
      line(c, x - 4, y + 2, x + 4, y + 2, '#756f58');
      line(c, x - 4, y + 4, x + 2, y + 4, '#756f58');
      glow(c, x, y, 35, '#e6d4a5', 0.25);
    }
    for (const [hx, hy, w] of level.hazards) {
      for (let i = 0; i < w; i += 9) polygon(c, [[hx + i - camera, hy + 26], [hx + i + 4 - camera, hy + 5], [hx + i + 8 - camera, hy + 26]], game.save.chapter === 1 ? '#91a774' : '#9b9b82');
    }
    const gateX = level.width - 146 - camera;
    rect(c, gateX - 13, 306, 10, 146, p.stone); rect(c, gateX + 58, 306, 10, 146, p.stone);
    polygon(c, [[gateX - 15, 309], [gateX + 26, 256], [gateX + 70, 309], [gateX + 56, 311], [gateX + 26, 277], [gateX - 1, 310]], p.edge);
    if (game.boss.hp <= 0) {
      glow(c, gateX + 27, 386, 90, p.light, 0.4);
      c.save(); c.globalAlpha = 0.35;
      for (let i = 0; i < 14; i++) rect(c, gateX + i * 4, 315 + Math.sin(game.time + i) * 10, 2, 130, p.light);
      c.restore();
      if (game.save.chapter === 4) drawNPC(c, { ...NPCS[4], x: gateX + 23, y: 452 }, game.time, 1, -1);
    } else {
      for (let i = 0; i < 7; i++) rect(c, gateX + i * 9, 313, 3, 139, '#758170');
      rect(c, gateX - 3, 353, 64, 4, '#778373'); rect(c, gateX - 3, 409, 64, 4, '#778373');
    }
    if (game.boss.active) {
      const x = level.arena - 49 - camera;
      for (let i = 0; i < 15; i++) {
        c.save(); c.globalAlpha = 0.15 + Math.sin(game.time * 3 + i) * 0.09;
        rect(c, x + i % 3 * 3, 160 + i * 19, 14, 37, '#d5b890'); c.restore();
      }
    }
    const npc = game.npc;
    if (npc.x - camera > -100 && npc.x - camera < WIDTH + 100) {
      drawNPC(c, { ...npc, x: npc.x - camera }, game.time, 1, game.player.x < npc.x ? -1 : 1);
      glow(c, npc.x - camera, npc.y - 27, 52, npc.color, 0.1);
      c.textAlign = 'center'; c.font = '9px Georgia'; c.fillStyle = '#d9d4b5';
      c.fillText(npc.name, npc.x - camera, npc.y - 88);
      if (!game.save.talked.includes(game.save.chapter)) {
        const y = npc.y - 103 + Math.sin(game.time * 2) * 2;
        polygon(c, [[npc.x - camera, y - 4], [npc.x - camera + 3, y], [npc.x - camera, y + 4], [npc.x - camera - 3, y]], npc.color);
      }
    }
  }

  atmosphere(index, time, camera) {
    const c = this.ctx, p = CHAPTERS[index].palette;
    if (this.settings.particles && !this.settings.reducedMotion) {
      if (index === 0 || index === 2) {
        c.save(); c.globalAlpha = 0.2;
        for (const r of this.rain) {
          const x = (r.x - time * 65 - camera * 0.14) % (WIDTH + 100);
          const y = (r.y + time * r.speed) % HEIGHT;
          line(c, x < 0 ? x + WIDTH + 100 : x, y, (x < 0 ? x + WIDTH + 100 : x) - 3, y + 9, '#a6c7c0');
        }
        c.restore();
      } else {
        for (let i = 0; i < 40; i++) {
          c.save(); c.globalAlpha = 0.3 + Math.sin(time + i) * 0.2;
          rect(c, (i * 179.7 + Math.sin(time * 0.3 + i) * 24 - camera * 0.2 + 1920) % WIDTH, (i * 81.3 + time * (index === 4 ? -12 : 9) + 5400) % HEIGHT, 2, index === 1 ? 3 : 2, p.light);
          c.restore();
        }
      }
    }
    const vignette = c.createRadialGradient(WIDTH / 2, HEIGHT / 2, 160, WIDTH / 2, HEIGHT / 2, 550);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, '#04121899');
    c.fillStyle = vignette; c.fillRect(0, 0, WIDTH, HEIGHT);
    c.save(); c.globalAlpha = 0.035;
    for (let y = 0; y < HEIGHT; y += 3) rect(c, 0, y, WIDTH, 1, '#000');
    c.restore();
  }

  render(game, time) {
    if (game.cinematic?.kind === 'prologue') { this.prologue(game.cinematic, time); return; }
    const menu = game.mode === 'menu';
    const c = this.ctx;
    rect(c, 0, 0, WIDTH, HEIGHT, '#08151e');
    c.save();
    if (game.cinematic && !menu) {
      const shot = game.cinematic, progress = Math.min(1, shot.elapsed / shot.duration);
      const zoom = this.settings.reducedMotion ? 1.4 : shot.kind === 'mutation' ? 1.35 + Math.sin(progress * Math.PI) * 0.22 : 1.22 + Math.sin(Math.min(1, progress / 0.7) * Math.PI * 0.65) * 0.45;
      const focusX = game.boss.x + game.boss.w / 2 - game.camera, focusY = 452 - game.boss.h * 0.6;
      c.translate(WIDTH * 0.53, HEIGHT * (shot.kind === 'boss-intro' ? 0.38 : 0.43)); c.scale(zoom, zoom); c.translate(-focusX, -focusY);
    } else if (game.dialogue) {
      c.translate(WIDTH * 0.5, HEIGHT * 0.4); c.scale(1.3, 1.3); c.translate(-WIDTH * 0.5, -(game.npc.y - 43));
    }
    if (this.settings.shake && !this.settings.reducedMotion && game.shake > 0 && !menu) c.translate(Math.round(Math.sin(time * 91) * game.shake * 0.5), Math.round(Math.cos(time * 113) * game.shake * 0.3));
    if (menu) {
      this.background(0, 0, time, true);
      this.railing(0, 478, 570, '#1b2d2d'); this.railing(700, 478, 260, '#1b2d2d');
      this.lamp(561, 478, time, CHAPTERS[0].palette); this.lamp(886, 478, time, CHAPTERS[0].palette);
      this.platform({ x: 0, y: 478, w: 960, h: 120 }, CHAPTERS[0].palette, 0);
      this.drawHunter({ x: 667, y: 430, facing: 1, vx: 0, grounded: true }, time);
      rect(c, 617, 469, 18, 9, '#263a38'); rect(c, 620, 463, 12, 7, '#394940');
      this.atmosphere(0, time, 0);
    } else {
      this.background(game.save.chapter, game.camera, time);
      for (const district of game.level.districts) {
        const x = district.x + 600 - game.camera;
        if (x > -220 && x < WIDTH + 220) districtLandmark(c, { ...district, x }, 452, game.save.chapter, time, this.settings);
      }
      for (const floor of game.platforms) this.platform({ ...floor, x: Math.round(floor.x - game.camera) }, game.level.palette, game.save.chapter);
      this.decorations(game);
      c.save(); c.translate(-Math.round(game.camera), 0);
      const stain = game.save.bloodstain;
      if (stain?.chapter === game.save.chapter) {
        glow(c, stain.x + 12, stain.y, 50, '#a2d0b3', 0.35);
        polygon(c, [[stain.x + 12, stain.y - 12], [stain.x + 18, stain.y], [stain.x + 12, stain.y + 12], [stain.x + 6, stain.y]], '#a8cdb5');
      }
      for (const z of game.zones) drawHazard(c, z, time);
      for (const e of game.enemies) if (Math.abs(e.x - game.player.x) < WIDTH) this.drawEnemy(e, time);
      if (game.cinematic?.kind === 'boss-intro') {
        const progress = game.cinematic.elapsed / game.cinematic.duration;
        const pose = entrancePose(game.boss.kind, progress, this.settings.reducedMotion);
        drawEntrance(c, game.boss, progress, false, this.settings);
        c.save(); c.beginPath(); c.rect(game.camera - WIDTH, -540, WIDTH * 3, 992); c.clip();
        c.globalAlpha *= pose.alpha;
        drawBoss(c, { ...game.boss, y: game.boss.y + pose.offsetY }, this.settings.reducedMotion ? 0 : game.cinematic.elapsed);
        c.restore();
        drawEntrance(c, game.boss, progress, true, this.settings);
      } else if (game.boss.active) this.drawBoss(game.boss, time);
      for (const a of game.afterimages) this.drawHunter({ ...game.player, ...a, dash: 0.1 }, time, a.life * 1.25);
      for (const ring of game.rings) {
        c.save(); c.globalAlpha = Math.min(0.55, ring.life);
        c.strokeStyle = ring.color; c.lineWidth = 2;
        c.beginPath(); c.ellipse(ring.x, ring.y, ring.radius, ring.radius * 0.45, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
      if (game.mode !== 'dead') {
        if (game.mode === 'dying') {
          c.save(); c.globalAlpha = game.deathTimer / 1.5; this.drawHunter(game.player, time); c.restore();
        } else this.drawHunter(game.player, time);
      }
      for (const bolt of game.projectiles) drawProjectile(c, bolt, time);
      for (const p of game.particles) { c.save(); c.globalAlpha = Math.min(1, p.life * 2); rect(c, p.x, p.y, p.size, p.size, p.color); c.restore(); }
      c.textAlign = 'center'; c.font = '12px Georgia';
      for (const f of game.floaters) { c.save(); c.globalAlpha = Math.min(1, f.life * 2); c.fillStyle = '#0e1c20'; c.fillText(f.text, f.x + 1, f.y + 1); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); c.restore(); }
      c.restore();
      this.atmosphere(game.save.chapter, time, game.camera);
      if (game.bossCelebration > 0) {
        c.save(); c.globalAlpha = Math.min(1, game.bossCelebration, (5 - game.bossCelebration) * 2);
        rect(c, 0, 170, WIDTH, 115, '#09151bc9');
        c.textAlign = 'center'; c.font = '29px Georgia'; c.fillStyle = '#e1c58f';
        c.fillText('A BURDEN LAID TO REST', WIDTH / 2, 221);
        c.font = '13px Georgia'; c.fillStyle = '#b7c5b8';
        c.fillText('The way opens. Your light is restored.', WIDTH / 2, 252);
        c.restore();
      }
    }
    c.restore();
    if (game.cinematic?.kind === 'mutation') {
      const phase = game.cinematic.elapsed / game.cinematic.duration;
      const intensity = phase < 0.44 ? phase * 0.6 : (1 - phase) * 0.4;
      if (!this.settings.reducedMotion) {
        glow(c, WIDTH * 0.53, HEIGHT * 0.51, 380, game.boss.drama.color, intensity);
        c.save(); c.globalAlpha = intensity * 0.8;
        for (let i = 0; i < 17; i++) {
          const a = i * Math.PI * 2 / 17 + phase * 0.25;
          line(c, WIDTH * 0.53 + Math.cos(a) * 85, HEIGHT * 0.5 + Math.sin(a) * 85, WIDTH * 0.53 + Math.cos(a) * 500, HEIGHT * 0.5 + Math.sin(a) * 500, game.boss.drama.color, 1 + i % 3);
        }
        c.restore();
      }
    }
  }

  prologue(shot, time) {
    const c = this.ctx, plate = PROLOGUE[shot.index];
    const t = this.settings.reducedMotion ? 8 : time;
    const progress = shot.elapsed / shot.duration;
    this.background(plate.chapter, 0, t, true);
    c.save();
    const zoom = this.settings.reducedMotion ? 1 : 1 + progress * 0.06;
    c.translate(480, 270); c.scale(zoom, zoom); c.translate(-480, -270);
    if (['bell', 'fracture'].includes(plate.scene)) {
      for (const x of [575, 745]) { limb(c, [x, 0], [x, 168], 6, 5, '#323e41', '#8b8870'); for (let y = 5; y < 165; y += 13) oval(c, x, y, 7, 9, '#283b3d', '#a59879'); }
      shape(c, [[559, 331], [581, 290], [587, 219], [609, 179], [650, 163], [693, 179], [716, 224], [721, 292], [747, 331]], '#687366', '#c6b180', 3);
      for (let i = 0; i < 7; i++) line(c, 596 + i * 17, 220, 579 + i * 24, 320, '#9c9c77', 2);
      oval(c, 651, 330, 96, 17, '#293c3c', '#d0b47d');
      line(c, 650, 288, 650 + Math.sin(t * 0.7) * 16, 354, '#c0a776', 7);
      if (plate.scene === 'fracture') {
        shape(c, [[660, 166], [640, 223], [664, 246], [641, 291], [659, 331], [668, 330], [652, 293], [677, 246], [652, 221], [673, 167]], '#dfc5ad', null);
        glow(c, 655, 253, 180, '#d3b1d0', 0.22 + progress * 0.2);
      }
    } else if (plate.scene === 'siblings') {
      rect(c, 520, 377, 360, 10, '#8b9179');
      for (const x of [556, 817]) { rect(c, x, 49, 10, 330, '#405755'); rect(c, x + 2, 49, 2, 330, '#adb498'); }
      shape(c, [[550, 49], [685, -25], [832, 49], [832, 66], [685, -8], [550, 66]], '#778679');
      c.save(); c.translate(566, 314); c.scale(1.35, 1.35); drawHunter(c, { x: 0, y: 0, facing: 1, grounded: true, vx: 0 }, t); c.restore();
      drawNPC(c, { ...NPCS[4], x: 740, y: 375 }, t, 1.45, -1);
      glow(c, 700, 310, 150, '#dec08a', 0.2);
    } else if (plate.scene === 'hunter') {
      c.save(); c.translate(632, 246); c.scale(1.85, 1.85); drawHunter(c, { x: 0, y: 0, facing: 1, grounded: true, vx: 0 }, t); c.restore();
      drawNPC(c, { ...NPCS[0], x: 795, y: 348 }, t, 1.2, -1);
      line(c, 510, 348, 910, 348, '#c0b68b', 3);
    } else {
      for (let i = 0; i < 19; i++) glow(c, 475 + i * 24, 332 + Math.sin(i * 2.4) * 67, 16, '#e4be7c', 0.18);
    }
    c.restore();
    c.fillStyle = '#05131b88'; c.fillRect(0, 0, 435, HEIGHT);
    const fade = this.settings.reducedMotion ? 0 : Math.max(0, 1 - shot.elapsed * 1.8);
    if (fade > 0) { c.save(); c.globalAlpha = fade; rect(c, 0, 0, WIDTH, HEIGHT, '#07121c'); c.restore(); }
    this.atmosphere(plate.chapter, t, 0);
  }
}
