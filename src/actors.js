import { rect, line, shape, oval, limb, glow } from './art.js';
import { ATTACKS, attackColor } from './attacks.js';

const TAU = Math.PI * 2;
const BRASS = '#c7ab73', BONE = '#e8dfbd', INK = '#101b23';
const tick = time => Math.floor(time * 15) / 15;

function chains(c, x, y, length, color = BRASS, sway = 0) {
  for (let i = 0; i < length; i += 5) oval(c, x + Math.sin(i * 0.13) * sway, y + i, i % 10 ? 1 : 2, 3, '#263331', color);
}

function feather(c, x, y, length, angle, color) {
  const tip = [x + Math.cos(angle) * length, y + Math.sin(angle) * length];
  shape(c, [[x, y], [x - 3, y - 7], [tip[0] - 3, tip[1]], [tip[0] + 2, tip[1] - 4], [x + 3, y - 4]], color);
  line(c, x, y, tip[0], tip[1], '#b9c2ae');
  for (let n = 5; n < length; n += 5) line(c, x + Math.cos(angle) * n, y + Math.sin(angle) * n, x + Math.cos(angle) * n - 4, y + Math.sin(angle) * n - 3, INK);
}

function lantern(c, x, y, time, color = '#f1c278', scale = 1) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  oval(c, 0, -11, 3, 4, INK, BRASS);
  shape(c, [[-6, -6], [-7, 5], [-4, 9], [4, 9], [7, 5], [6, -6]], '#45554b', BRASS);
  shape(c, [[-4, -4], [4, -4], [3, 6], [-3, 6]], color, null);
  shape(c, [[-1, 5], [-3, 0], [1, -4 + Math.sin(time * 7)], [2, 3]], '#fff1c7', null);
  line(c, 0, -5, 0, 7, '#947648');
  shape(c, [[-8, -6], [0, -11], [8, -6]], '#617364', BRASS);
  line(c, -6, 8, 6, 8, BRASS);
  glow(c, 0, 1, 31, color, 0.25);
  c.restore();
}

function sabre(c, hand, angle, color = '#d5e3d7', long = 1) {
  c.save(); c.translate(...hand); c.rotate(angle);
  limb(c, [-4, 0], [7, 0], 2, 1.5, '#755a43', BRASS);
  shape(c, [[6, -4], [9, -6], [12, -2], [10, 4], [6, 5]], '#a69365');
  shape(c, [[10, -2], [39 * long, -4], [51 * long, -12], [46 * long, -1], [32 * long, 4], [10, 2]], color, '#637e7b');
  line(c, 11, -2, 39 * long, -4, '#fbefd0');
  line(c, 13, 1, 35 * long, 1, '#718d8b');
  c.restore();
}

export function drawHunter(c, p, time, alpha = 1) {
  const t = tick(time), moving = Math.abs(p.vx || 0) > 30, run = Math.sin(t * 16);
  const dash = p.dash > 0, falling = p.plunge || p.attackKind === 'bellfall' && p.attack > 0;
  const attack = p.attack > 0, progress = attack ? Math.min(1, (p.attackDuration - p.attack) / p.attackDuration) : 0;
  const bob = p.grounded && moving ? Math.abs(run) * 1.5 : Math.sin(t * 2) * 0.5;
  const crouch = (p.landing > 0 ? p.landing * 16 : 0) + (dash ? 6 : 0);
  c.save();
  c.globalAlpha *= alpha * (p.invulnerable > 0.25 && p.hurt > 0 && Math.floor(time * 22) % 2 ? 0.5 : 1);
  c.translate(Math.round(p.x + 12), Math.round(p.y + 48 - bob + crouch));
  c.scale(p.facing || 1, 1);
  if (dash) c.rotate(0.38 + (p.dashY || 0) * -0.3);
  else if (p.hurt > 0) c.rotate(-0.13);
  const cloak = (moving ? 8 : 1) + Math.sin(t * 4) * 3 + (dash ? 24 : 0);
  shape(c, [[-8, -44], [-15, -41], [-20, -30], [-20 - cloak, -12], [-13 - cloak, -17], [-15, -4], [-7, -13], [-3, -4], [2, -32]], '#20383e', '#0b1922', 2);
  shape(c, [[-12, -40], [-17, -25], [-15 - cloak, -14], [-14, -17], [-10, -8], [-5, -23]], '#416363', null);
  line(c, -14, -36, -17 - cloak, -15, '#7e9690');
  for (let i = 0; i < 5; i++) line(c, -13 - i, -30 + i * 3, -10 - cloak * 0.5 - i, -22 + i * 3, '#2e5054');
  const stride = p.grounded ? (moving ? run * 9 : 0) : falling ? 4 : 7;
  const backKnee = [-6 - stride * 0.6, -12], backFoot = [-8 - stride, -1 - (moving ? Math.max(0, run) * 4 : 0)];
  limb(c, [-5, -24], backKnee, 4, 3, '#273c41', '#75877c');
  limb(c, backKnee, backFoot, 3, 2, '#243035', '#65766b');
  shape(c, [[backFoot[0] - 3, backFoot[1] - 5], [backFoot[0] + 3, backFoot[1] - 4], [backFoot[0] + 8, backFoot[1]], [backFoot[0] + 6, backFoot[1] + 2], [backFoot[0] - 4, backFoot[1] + 1]], '#1d292e');
  const knee = [5 + stride * 0.45, -11], foot = [5 + stride, -1 - (moving ? Math.max(0, -run) * 5 : 0)];
  limb(c, [4, -24], knee, 4, 3.5, '#42504a', '#a1a38b');
  limb(c, knee, foot, 3.5, 2.5, '#34413d', '#849184');
  shape(c, [[knee[0] - 4, knee[1] - 4], [knee[0] + 4, knee[1] - 5], [knee[0] + 3, knee[1] + 2], [knee[0], knee[1] + 5]], '#8a998b');
  shape(c, [[foot[0] - 3, foot[1] - 5], [foot[0] + 3, foot[1] - 4], [foot[0] + 9, foot[1]], [foot[0] + 7, foot[1] + 2], [foot[0] - 4, foot[1] + 1]], '#263633');
  line(c, foot[0] - 2, foot[1] + 1, foot[0] + 8, foot[1], '#7a8271');
  shape(c, [[-9, -44], [-1, -48], [9, -43], [10, -34], [6, -23], [11, -14], [3, -17], [-2, -13], [-8, -17], [-10, -26]], '#637c72', INK, 1.5);
  shape(c, [[-9, -43], [-3, -41], [-5, -31], [-2, -18], [-8, -17], [-11, -26]], '#344e4f', null);
  shape(c, [[0, -43], [5, -40], [4, -26], [1, -23], [-1, -36]], '#a5b0a0', null);
  for (let i = 0; i < 4; i++) { rect(c, 2, -39 + i * 5, 2, 2, BRASS); line(c, -7, -38 + i * 5, -4, -37 + i * 5, '#81948a'); }
  limb(c, [-7, -39], [-15, -29], 4, 3, '#314c4e', '#8d9e8c');
  limb(c, [-15, -29], [-15 - (moving ? run * 3 : 0), -16], 3, 2, '#536c63', '#a9ad8a');
  lantern(c, -16 - (moving ? run * 3 : 0), -7, time);
  shape(c, [[-9, -25], [8, -25], [9, -21], [-8, -20]], '#3b3329', '#141e20');
  rect(c, 0, -25, 5, 5, BRASS); rect(c, 1, -24, 3, 3, '#413f32');
  shape(c, [[-6, -22], [-11, -21], [-12, -14], [-6, -12]], '#76614a', '#b59a70');
  chains(c, 6, -22, 14, BRASS, 1);
  // A carved half-mask, layered collar and split feather replace the original block head.
  shape(c, [[-6, -56], [-1, -60], [7, -56], [8, -48], [4, -43], [-3, -46], [-7, -50]], '#c2c1a6', INK, 1.5);
  shape(c, [[2, -55], [7, -53], [11, -50], [7, -48], [5, -45], [1, -49]], '#e3dfbf', '#6b8075');
  line(c, 3, -54, 8, -53, INK, 2); rect(c, 5, -54, 2, 1, '#f4ca88');
  shape(c, [[-9, -47], [-4, -49], [4, -46], [9, -47], [6, -41], [-5, -42]], '#a36a54', '#452e31');
  shape(c, [[-7, -47], [-16, -43], [-22 - cloak, -38 + Math.sin(t * 5) * 2], [-16 - cloak, -42], [-13, -47]], '#b7775b', '#563e37');
  line(c, -12, -45, -23 - cloak, -39, '#d49a6f');
  shape(c, [[-12, -57], [-7, -67], [0, -71], [8, -63], [13, -57], [1, -55]], '#283f46', INK, 1.5);
  shape(c, [[-6, -65], [-1, -69], [3, -66], [6, -59], [-2, -58]], '#486460', null);
  shape(c, [[-20, -58], [-12, -60], [4, -59], [16, -56], [10, -53], [-5, -54]], '#425c56', '#172b34');
  line(c, -16, -58, 10, -55, '#a6af95');
  feather(c, -7, -64, 21, -2.15, '#6e918b');
  feather(c, -6, -65, 17, -1.85, '#9cac94');
  const shoulder = [7, -41];
  let elbow = [13, -31], hand = [16, -23], angle = 0.5;
  if (p.heal > 0) { elbow = [17, -42]; hand = [9, -51]; }
  else if (p.parry > 0) { elbow = [16, -43]; hand = [24, -42]; angle = -1.45; }
  else if (falling) { elbow = [14, -28]; hand = [11, -19]; angle = 1.57; }
  else if (attack) {
    const swing = p.attackKind === 'wakecut' ? -0.15 : -2.4 + Math.min(1, progress * 1.7) * 3.3;
    elbow = [8 + Math.cos(swing) * 12, -39 + Math.sin(swing) * 9];
    hand = [elbow[0] + Math.cos(swing) * 12, elbow[1] + Math.sin(swing) * 10];
    angle = swing;
  }
  limb(c, shoulder, elbow, 4.5, 3.5, '#657e74', '#acbba5');
  oval(c, shoulder[0], shoulder[1], 7, 5, '#8c9c8b', '#2c4549');
  line(c, 4, -44, 11, -41, '#dfd6a7');
  limb(c, elbow, hand, 3.5, 2.5, '#4f6460', '#9ba98e');
  oval(c, hand[0], hand[1], 3, 3, '#beac8b', '#46524a');
  if (p.heal > 0) { shape(c, [[8, -55], [12, -56], [14, -51], [9, -50]], '#dfbc77'); glow(c, 10, -45, 30, '#ecd59f', 0.4); }
  else sabre(c, hand, angle, p.dashStrike > 0 ? '#e1fff0' : '#d5e3d7', p.attackKind === 'wakecut' ? 1.2 : 1);
  if (attack && progress > 0.13 && progress < 0.75 && !falling) {
    const points = [], inner = [], start = -1.7 + progress * 1.1, radius = p.attackKind === 'wakecut' ? 84 : 66;
    for (let i = 0; i <= 16; i++) {
      const a = start + i * 0.12;
      points.push([10 + Math.cos(a) * radius, -35 + Math.sin(a) * 38]);
      inner.unshift([10 + Math.cos(a) * (radius - 10), -35 + Math.sin(a) * 30]);
    }
    c.save(); c.globalAlpha *= 0.48; shape(c, [...points, ...inner], p.attackKind === 'wakecut' ? '#92d8c5' : '#c9d4b4', null); c.restore();
    for (let i = 2; i < points.length; i += 2) line(c, ...points[i - 1], ...points[i], '#edf4d8', 1);
  }
  c.restore();
}

function hood(c, x, y, color, trim, form = 'hood') {
  if (form === 'skull') {
    shape(c, [[x - 6, y - 8], [x + 3, y - 10], [x + 9, y - 5], [x + 7, y + 3], [x + 3, y + 7], [x - 4, y + 5], [x - 7, y]], trim);
    oval(c, x + 3, y - 2, 3, 2, '#26333b'); line(c, x + 2, y + 4, x + 7, y + 3, '#57625b');
  } else {
    shape(c, [[x - 10, y + 6], [x - 11, y - 5], [x - 3, y - 17], [x + 5, y - 13], [x + 10, y + 2], [x + 4, y + 7]], color);
    shape(c, [[x - 4, y - 8], [x + 3, y - 7], [x + 6, y], [x + 3, y + 4], [x - 5, y + 1]], '#192732', trim);
    rect(c, x, y - 2, 5, 1, '#e4d6a1');
    line(c, x - 6, y - 10, x - 8, y + 4, trim);
  }
}

function patina(c, points, light, dark, spacing = 4) {
  c.save(); c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
  c.closePath(); c.clip(); c.globalAlpha *= 0.32;
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const left = Math.floor(Math.min(...xs)), right = Math.max(...xs), top = Math.floor(Math.min(...ys)), bottom = Math.max(...ys);
  for (let y = top; y < bottom; y += spacing) for (let x = left; x < right; x += spacing) {
    const grain = ((x * 17 + y * 29) ^ (x * y * 3)) & 15;
    if (grain < 4) rect(c, x, y, grain % 2 + 1, 1, light);
    else if (grain > 11) rect(c, x, y, 1, 2, dark);
  }
  c.restore();
}

function armour(c, x, y, w, h, color, trim) {
  const outline = [[x - w, y - h * 0.35], [x - w * 0.6, y - h * 0.6], [x + w * 0.65, y - h * 0.55], [x + w, y - h * 0.3], [x + w * 0.8, y + h * 0.4], [x, y + h * 0.65], [x - w * 0.85, y + h * 0.3]];
  shape(c, outline, color, INK, 2);
  patina(c, outline, trim, '#102732', 3);
  shape(c, [[x, y - h * 0.48], [x + w * 0.8, y - h * 0.28], [x + w * 0.65, y + h * 0.3], [x, y + h * 0.51]], '#243b414f', null);
  line(c, x - w * 0.8, y - h * 0.24, x - w * 0.67, y + h * 0.22, trim, 2);
  line(c, x - w * 0.45, y - h * 0.45, x + w * 0.5, y - h * 0.42, trim);
  for (const side of [-1, 1]) for (const row of [-1, 1]) {
    oval(c, x + side * w * 0.55, y + row * h * 0.28, 1.5, 1.5, trim, '#37423c');
  }
  for (let i = 0; i < 3; i++) line(c, x - w * 0.3, y - 4 + i * 4, x + w * 0.35, y - 6 + i * 4, trim);
}

function iris(c, x, y, rx, ry, color, time) {
  shape(c, [[x - rx, y], [x - rx * 0.4, y - ry], [x + rx * 0.45, y - ry], [x + rx, y], [x + rx * 0.4, y + ry], [x - rx * 0.5, y + ry]], '#d9d1bd', '#172832', 1.5);
  oval(c, x + Math.sin(time) * 1.5, y, rx * 0.33, ry * 0.88, color, '#665378');
  rect(c, x, y - ry * 0.65, 2, ry * 1.3, '#132631'); rect(c, x - 2, y - ry * 0.5, 2, 2, '#fff3d6');
}

function embroidery(c, x, y, w, count, color) {
  for (let i = 0; i < count; i++) {
    const yy = y + i * 7;
    for (const side of [-1, 1]) {
      line(c, x, yy, x + side * w, yy - 4, color);
      line(c, x + side * w, yy - 4, x + side * (w - 3), yy - 7, color);
      rect(c, x + side * (w + 3), yy - 4, 1, 1, color);
    }
    rect(c, x - 1, yy - 2, 2, 2, '#f0d5a8');
  }
}

function attackArc(c, e, scale = 1) {
  const a = ATTACKS[e.pattern];
  if (e.state !== 'strike' || a?.kind !== 'combo' || e.attackStep < 0) return;
  const elapsed = a.duration - e.timer - a.beats[e.attackStep];
  if (elapsed < 0 || elapsed > 0.2) return;
  const radius = (a.reach + e.w / 2) / scale, y = -e.h * 0.42 / scale;
  const start = -1.5 + elapsed * 3, outer = [], inner = [];
  for (let i = 0; i <= 18; i++) {
    const angle = start + i * 0.13;
    outer.push([Math.cos(angle) * radius, y + Math.sin(angle) * e.h * 0.37 / scale]);
    inner.unshift([Math.cos(angle) * (radius - 9), y + Math.sin(angle) * e.h * 0.29 / scale]);
  }
  c.save(); c.globalAlpha *= 0.4;
  shape(c, [...outer, ...inner], attackColor(e.pattern), null);
  c.globalAlpha *= 1.8;
  for (let i = 1; i < outer.length; i++) line(c, ...outer[i - 1], ...outer[i], '#f6e7c9');
  c.restore();
}

export function drawEnemy(c, e, time) {
  if (e.hp <= 0) return;
  const t = tick(time), s = e.species, ink = '#16232b';
  const color = e.flash > 0 ? '#eee4c5' : s.color, trim = s.trim;
  const move = Math.abs(e.vx) > 5 ? Math.sin(t * 12) : 0;
  const wind = e.state === 'windup', strike = e.state === 'strike';
  const a = ATTACKS[e.pattern], beat = e.attackStep || 0;
  const slash = strike && a?.kind === 'combo' ? Math.sin(Math.min(1, (a.duration - e.timer - a.beats[beat]) / 0.2) * Math.PI) : 0;
  c.save(); c.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h)); c.scale(e.facing, 1);
  if (e.kind === 'brute') c.scale(1.22, 1.15);
  if (a?.backstep && wind) c.rotate(-0.09);
  else if (slash) c.rotate(slash * 0.1);
  if (s.id === 'thornhound') {
    const jaw = wind ? 5 : strike ? 3 + slash * 7 : 0;
    limb(c, [-20, -25], [-35, -33 + move * 2], 3, 1, '#506b55', trim);
    limb(c, [-35, -33 + move * 2], [-43, -48], 1.5, 0.5, '#78906c', trim);
    shape(c, [[-46, -45], [-44, -55], [-38, -50]], '#d0ce9b', '#5e755b');
    shape(c, [[-23, -22], [-14, -34], [4, -31], [17, -25], [12, -15], [-14, -14]], color, ink, 2);
    for (let i = 0; i < 5; i++) {
      shape(c, [[-20 + i * 7, -27], [-16 + i * 7, -33], [-11 + i * 7, -24], [-17 + i * 7, -18]], i % 2 ? '#809273' : '#4b6350', trim);
      line(c, -17 + i * 7, -28, -15 + i * 7, -22, '#b8c391');
    }
    for (const [x, phase] of [[-17, 1], [-8, -1], [9, 1], [16, -1]]) {
      limb(c, [x, -19], [x + move * 4 * phase, -9], 3, 2, '#496448', trim);
      limb(c, [x + move * 4 * phase, -9], [x + move * 7 * phase, -1], 2, 1, color, trim);
      for (let j = 0; j < 3; j++) line(c, x + move * 7 * phase, -2, x + move * 7 * phase + 3 + j * 2, 0, '#e5d7aa');
    }
    shape(c, [[16, -22], [28, -18 + jaw], [35, -23 + jaw], [20, -26]], '#4c5140', trim);
    shape(c, [[8, -30], [19, -35], [31, -27], [26, -21], [13, -20]], '#8c9b77', trim);
    iris(c, 20, -29, 4, 2, '#adb373', t);
    for (let i = 0; i < 5; i++) shape(c, [[20 + i * 2, -24], [21 + i * 2, -20 + jaw * 0.3], [22 + i * 2, -24]], '#f0deac', null);
    for (let i = 0; i < 7; i++) shape(c, [[-21 + i * 5, -28], [-25 + i * 5, -44 - i % 2 * 4], [-15 + i * 5, -30]], '#687c55', trim);
  } else if (s.id === 'marrowweaver') {
    const sway = Math.sin(t * 2) * 3;
    c.translate(0, sway - 4);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const elbow = [side * (22 + i * 5), -42 + i * 13 + Math.sin(t * 3 + i) * 3];
      const hand = [side * (wind ? 12 + i * 5 : 29 + slash * 8), -24 + i * 7];
      limb(c, [side * 9, -40 + i * 7], elbow, 2.5, 1.5, '#8d717e', '#dec1ae');
      limb(c, elbow, hand, 1.5, 0.5, '#c29b9c', '#fae0c0');
      line(c, ...hand, 0, -25, '#c398ac88');
    }
    oval(c, 0, -28, 16, 25, '#634859', '#c29a9b');
    for (let i = 0; i < 7; i++) shape(c, [[-14 + i % 2 * 2, -46 + i * 6], [0, -42 + i * 6], [14 - i % 2 * 2, -46 + i * 6], [10, -39 + i * 6], [0, -35 + i * 6], [-11, -39 + i * 6]], i % 2 ? '#a37d88' : '#c39c9b', '#594553');
    iris(c, 0, -34, 9, 6, '#c892b6', t);
    hood(c, 0, -57, '#987786', '#e5bda7', 'skull');
    for (let i = 0; i < 4; i++) limb(c, [-7 + i * 5, -10], [-17 + i * 11, 5 + Math.sin(t + i) * 3], 1.5, 0.4, '#d9b7a4', '#8f6e7a');
  } else if (s.id === 'glassgolem') {
    for (const [x, phase] of [[-8, 1], [8, -1]]) {
      limb(c, [x, -25], [x + move * phase * 5, -12], 6, 4, color, trim);
      shape(c, [[x - 6, -13], [x + 5, -13], [x + move * phase * 6 + 6, 0], [x + move * phase * 6 - 6, 1]], '#526c78', trim);
    }
    shape(c, [[-18, -47], [-4, -58], [13, -49], [21, -32], [9, -20], [-13, -24]], '#7b96a5', trim, 2);
    for (const [x, y] of [[-9, -43], [6, -40], [0, -29]]) shape(c, [[x - 6, y], [x, y - 9], [x + 7, y + 3], [x, y + 7]], '#a7bdc1', '#e5dbe8');
    for (const side of [-1, 1]) {
      const hand = [side * (strike || wind ? 33 : 26), wind ? -48 : -22];
      limb(c, [side * 18, -43], hand, 7, 4, '#597b89', trim);
      for (let i = 0; i < 3; i++) shape(c, [[hand[0] - 3 + i * 4, hand[1]], [hand[0] + i * 4, hand[1] - 13], [hand[0] + 4 + i * 4, hand[1] + 2]], '#9cbac4', trim);
      shape(c, [[side * 9, -51], [side * 18, -67], [side * 26, -47], [side * 17, -36]], '#6e8fa6', '#e6ddf3');
    }
    shape(c, [[-6, -65], [1, -76], [10, -62], [3, -51], [-9, -56]], '#c1ccdb', trim);
    shape(c, [[1, -76], [3, -51], [-9, -56]], '#687b9b', null);
    iris(c, 1, -61, 5, 3, '#bcb0da', t);
    for (let i = 0; i < 4; i++) line(c, -12 + i * 6, -43, -6 + i * 5, -29, '#d4dce3');
  } else {
    const floating = ['orbitseer', 'seedseer', 'marrowweaver', 'bellmouth'].includes(s.id);
    const y = floating ? Math.sin(t * 3) * 3 - 3 : 0;
    c.translate(0, y);
    if (s.id === 'gravebearer') {
      c.save(); c.rotate(-0.16);
      shape(c, [[-30, -10], [-36, -64], [-29, -79], [-9, -81], [-2, -63], [-7, -8]], '#394846', '#b2ab8c', 2);
      embroidery(c, -20, -58, 8, 6, '#b3a381');
      line(c, -29, -69, -11, -70, '#d0c3a1', 2);
      chains(c, -31, -54, 42, '#9da58a', 2); c.restore();
    }
    if (s.id === 'riftstalker') for (let i = 0; i < 4; i++) shape(c, [[-7, -47], [-20 - i * 4, -40 + i * 3], [-34 + Math.sin(t * 4 + i) * 5, -12 + i * 6], [-22, -16 + i * 5], [-10, -27]], i % 2 ? '#65668199' : '#aaa3c377', '#434663');
    for (const [x, phase] of floating ? [] : [[-6, -1], [6, 1]]) {
      limb(c, [x, -24], [x + move * phase * 4, -12], 4, 3, '#35494b', color);
      limb(c, [x + move * phase * 4, -12], [x + move * phase * 8, -1], 3, 2, '#293c40', trim);
      line(c, x + move * phase * 8 - 3, 0, x + move * phase * 8 + 7, 0, '#17272d', 3);
    }
    const robe = [[-11, -45], [4, -48], [13, -39], [9, -25], [18, -6], [7, -12], [0, -7], [-8, -12], [-16, -5], [-12, -29]];
    shape(c, robe, color, ink, 2);
    patina(c, robe, trim, '#223c43', 3);
    shape(c, [[-10, -42], [-3, -40], [-6, -25], [-11, -10], [-17, -5]], '#30444a', null);
    for (let i = 0; i < 5; i++) line(c, 0, -39 + i * 5, 8, -36 + i * 5, trim);
    const mask = ['drowned', 'paleorphan', 'pulseknight', 'gravebearer'].includes(s.id);
    hood(c, 0, -49, color, trim, mask ? 'skull' : 'hood');
    if (s.id === 'watchman') {
      shape(c, [[-10, -57], [-5, -65], [5, -63], [10, -54], [-14, -54]], '#394d51', trim);
      feather(c, -5, -62, 15, -2.1, color);
      armour(c, -2, -34, 9, 15, '#68817d', trim);
      shape(c, [[-6, -51], [8, -52], [9, -43], [1, -40], [-6, -44]], '#adad8d', '#334b4e');
      for (let i = 0; i < 4; i++) line(c, -3 + i * 3, -49, -3 + i * 3, -44, '#394b48');
      chains(c, -11, -41, 22, trim, 1);
    }
    if (s.id === 'censor') {
      shape(c, [[-16, -37], [-17, -55], [-10, -77], [1, -81], [15, -52], [17, -36], [0, -46]], '#67585d', '#b59d89', 2);
      shape(c, [[-1, -62], [8, -60], [21, -48], [7, -51], [-2, -51]], '#d4c4a3', '#4f4e49');
      rect(c, 6, -59, 3, 2, '#241f28');
      embroidery(c, -2, -37, 8, 4, '#b89877');
      for (let i = 0; i < 4; i++) oval(c, 16 + Math.sin(t * 2 + i) * 5, -43 - i * 7, 3 + i, 2 + i, '#a8978580');
    }
    if (s.id === 'rootknight' || s.id === 'seedseer') {
      for (const dir of [-1, 1]) { limb(c, [dir * 4, -59], [dir * 15, -72], 2, 1, '#667958', trim); limb(c, [dir * 11, -66], [dir * 19, -67], 1, 0.5, trim); }
      if (s.id === 'seedseer') for (let i = 0; i < 6; i++) oval(c, Math.cos(i) * 12, -48 + Math.sin(i) * 10, 5, 8, '#8c9273', '#c6c496');
      if (s.id === 'rootknight') {
        shape(c, [[-17, -47], [-5, -54], [15, -48], [20, -17], [9, -8], [0, -16], [-13, -10], [-21, -27]], '#6a7250', '#a8b681', 2);
        for (let i = 0; i < 7; i++) line(c, -14 + i * 5, -43 + i % 3 * 4, -18 + i * 6, -15, i % 2 ? '#b1b88a' : '#3c5142');
        iris(c, 1, -41, 8, 4, '#a8bd83', t);
        for (const side of [-1, 1]) { oval(c, side * 17, -45, 10, 4, '#a4a47a', '#d1c69c'); rect(c, side * 17, -44, 2, 7, '#c6bb94'); }
      } else {
        for (let i = 0; i < 7; i++) {
          const angle = i * TAU / 7;
          shape(c, [[Math.cos(angle) * 8, -55 + Math.sin(angle) * 8], [Math.cos(angle) * 18, -55 + Math.sin(angle) * 20], [Math.cos(angle + 0.4) * 14, -55 + Math.sin(angle + 0.4) * 20]], '#bbbd88', '#6d7f5e');
        }
        iris(c, 1, -54, 7, 4, '#9eaa79', t);
        for (let i = 0; i < 4; i++) oval(c, -9 + i * 6, -27 + i % 2 * 7, 3, 5, '#d3c18b', '#516649');
      }
    }
    if (s.id === 'bellmouth') {
      shape(c, [[-8, -61], [6, -60], [8, -48], [14, -42], [-13, -42], [-8, -48]], '#98b0a0', '#d6cd9d');
      oval(c, 1, -42, 11, 3, '#213844', trim);
      for (let i = 0; i < 3; i++) line(c, -9 - i * 2, -57 + i * 7, 9 + i * 2, -57 + i * 7, '#d7c49b', 2);
      chains(c, -13, -57, 43, trim, 2); embroidery(c, 1, -31, 8, 3, '#97b2a4');
    }
    if (s.id === 'riftstalker' || s.id === 'orbitseer') {
      for (let i = 0; i < 5; i++) {
        const a = t + i * TAU / 5;
        shape(c, [[Math.cos(a) * 22, -53 + Math.sin(a) * 15], [Math.cos(a) * 22 + 3, -58 + Math.sin(a) * 15], [Math.cos(a) * 22 + 6, -51 + Math.sin(a) * 15]], trim, '#5c587b');
      }
      if (s.id === 'riftstalker') {
        shape(c, [[-6, -62], [6, -64], [11, -52], [4, -42], [-7, -48]], '#c9cad7', '#6d638a', 2);
        shape(c, [[6, -64], [4, -42], [-1, -50]], '#686483', null);
        line(c, -3, -57, 7, -53, '#f5e4ca'); embroidery(c, -1, -36, 7, 3, '#c2acd5');
      } else {
        c.strokeStyle = '#c5b9a1'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -51, 25, 18, t * 0.2, 0, TAU); c.stroke();
        iris(c, 0, -53, 11, 7, '#a58bb5', t);
        for (let i = 0; i < 3; i++) shape(c, [[-11 + i * 8, -27], [-7 + i * 8, -14], [-18 + i * 13 + Math.sin(t + i) * 4, 1], [-10 + i * 8, -6]], '#aaa8c6', '#5a5d7b');
      }
    }
    if (s.id === 'paleorphan' || s.id === 'marrowweaver') {
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) limb(c, [side * 8, -36 + i * 7], [side * (20 + i * 2), -43 + i * 10], 1.5, 0.5, trim, '#a97c7e');
      for (let i = 0; i < 6; i++) line(c, -9, -38 + i * 5, 9, -34 + i * 5, '#ead2ba');
      shape(c, [[-9, -63], [4, -65], [9, -51], [3, -42], [-6, -46]], '#ead8bd', '#917f79');
      rect(c, 2, -56, 3, 5, '#554952'); line(c, 3, -50, 6, -44, '#947284');
    }
    if (s.id === 'drowned') {
      shape(c, [[-16, -61], [-8, -63], [-3, -72], [6, -62], [15, -60], [9, -53], [-10, -53]], '#3b606b', trim, 2);
      for (let i = 0; i < 3; i++) limb(c, [-9, -37 + i * 6], [-22 + Math.sin(t * 3 + i) * 5, -12 + i * 6], 1.5, 0.5, '#527c75', '#a1bfa5');
      sabre(c, [-12, -31], -1, '#a6c7bd', 0.45);
      for (let i = 0; i < 4; i++) rect(c, -8 + i * 5, -29 + i % 2 * 8, 2, 2, '#e0c89f');
    }
    if (s.id === 'anchorite') {
      armour(c, 0, -33, 16, 26, '#59777b', '#b4b895');
      oval(c, 0, -55, 14, 14, '#6b8883', '#c9bd94'); oval(c, 3, -55, 9, 9, '#253f49', '#a9b6a2');
      for (const x of [-1, 4, 9]) line(c, x, -61, x, -49, '#d7c6a1');
      for (let i = 0; i < 8; i++) rect(c, Math.cos(i * TAU / 8) * 12 - 1, -55 + Math.sin(i * TAU / 8) * 12 - 1, 2, 2, '#e4d2a8');
    }
    if (s.id === 'gravebearer' || s.id === 'pulseknight') {
      armour(c, 0, -32, 15, 23, color, trim);
      for (const side of [-1, 1]) armour(c, side * 15, -45, 9, 9, color, trim);
      shape(c, [[-9, -57], [-6, -68], [6, -65], [11, -55], [6, -43], [-5, -44]], '#657878', trim);
      line(c, -5, -56, 7, -55, '#172c35', 3); rect(c, 4, -56, 3, 1, '#f6d8a6');
      if (s.id === 'pulseknight') {
        oval(c, 1, -34, 7, 10, '#70525f', '#e0b59d'); oval(c, 1, -34, 3 + Math.sin(t * 5), 6, '#efb997');
        for (let i = 0; i < 4; i++) limb(c, [-12 + i * 8, -42], [-18 + i * 12, -58 - i % 2 * 5], 2, 0.5, '#b99196', trim);
      }
    }
    if (e.kind === 'acolyte') {
      const hand = [strike ? 27 : 19, wind ? -45 : -31];
      limb(c, [9, -40], hand, 4, 2, color, trim);
      if (s.id === 'censor') {
        chains(c, hand[0], hand[1], 20, trim, 2);
        oval(c, hand[0] + 1, hand[1] + 24, 7, 6, '#74654e', trim);
      } else if (s.id === 'bellmouth') {
        line(c, hand[0], hand[1] + 4, hand[0], hand[1] - 10, trim, 2);
        for (const side of [-1, 1]) { line(c, hand[0], hand[1] - 8, hand[0] + side * 5, hand[1] - 12, trim, 2); line(c, hand[0] + side * 5, hand[1] - 12, hand[0] + side * 5, hand[1] - 23, '#e5d8af', 2); }
      } else if (s.id === 'orbitseer') {
        iris(c, hand[0] + 2, hand[1] - 8, 7, 5, '#9b85b7', t);
      } else if (s.id === 'seedseer') {
        oval(c, hand[0] + 2, hand[1] - 7, 5, 8, '#c9bd88', '#64784f');
        line(c, hand[0] + 1, hand[1] - 12, hand[0] + 1, hand[1] - 2, '#f2dcb0');
      } else {
        oval(c, hand[0] + 2, hand[1] - 6, 5, 5, trim, '#e4e3c0');
        glow(c, hand[0] + 2, hand[1] - 6, wind ? 33 : 20, trim, 0.22);
      }
    } else if (e.kind === 'brute') {
      limb(c, [12, -40], [22, -26], 6, 4, color, trim);
      c.save(); c.translate(22, -27); c.rotate(wind ? -1.7 : strike ? -1.2 + slash * 1.8 + beat % 2 * 0.4 : -0.9);
      line(c, -8, 0, 29, 0, '#665647', 5);
      if (s.id === 'anchorite') {
        line(c, 28, -19, 28, 18, trim, 3);
        shape(c, [[28, 11], [17, 5], [16, 17], [28, 25], [41, 17], [42, 5]], '#627f7b', trim);
      } else if (s.id === 'rootknight') {
        limb(c, [15, 0], [43, 0], 5, 9, '#66714e', '#bdc18a');
        for (let i = 0; i < 5; i++) {
          line(c, 19 + i * 5, -5, 20 + i * 5, 6, '#394e3d', 2);
          shape(c, [[22 + i * 4, -4], [23 + i * 4, -15 + i % 2 * 5], [26 + i * 4, -3]], '#91a073', trim);
        }
      } else if (s.id === 'pulseknight') {
        shape(c, [[19, -12], [27, -17], [33, -11], [40, -15], [46, -8], [42, 5], [31, 14], [21, 6]], '#a9828a', '#edc4a7', 2);
        oval(c, 32, -3, 6, 9, '#694859', '#d5a49a'); oval(c, 32, -4, 3, 5, '#f0c29e');
        for (let i = 0; i < 4; i++) line(c, 22 + i * 6, -8, 24 + i * 5, 6, '#d6aea1');
      } else {
        const blade = [[19, -12], [39, -14], [46, -3], [40, 10], [27, 16], [22, 4]];
        shape(c, blade, '#7e9087', trim, 2);
        patina(c, blade, '#edf0ca', '#364e51', 3);
        line(c, 38, -11, 43, -3, '#f6e6ba', 2);
        embroidery(c, 31, -4, 6, 2, '#d1c8a5');
      }
      c.restore();
    } else {
      const hand = [strike ? 20 + slash * 16 : 14, wind ? -42 : -28 - beat % 2 * slash * 15];
      limb(c, [8, -42], hand, 4, 2, color, trim);
      if (s.id === 'paleorphan') for (let i = 0; i < 4; i++) limb(c, hand, [hand[0] + 21 + i * 2, hand[1] - 9 + i * 5], 1.5, 0.3, '#e5ceb3', '#a78284');
      else sabre(c, hand, wind ? -1.8 : strike ? -0.6 + slash * 0.8 : 0.7, trim, s.id === 'drowned' ? 0.85 : 0.72);
    }
  }
  attackArc(c, e, e.kind === 'brute' ? 1.2 : 1);
  c.restore();
}

function crown(c, x, y, color, antlers = false) {
  for (let i = -2; i <= 2; i++) {
    const h = 12 + (2 - Math.abs(i)) * 4;
    shape(c, [[x + i * 6 - 3, y], [x + i * 8, y - h], [x + i * 6 + 3, y]], color);
    if (antlers) line(c, x + i * 7, y - h * 0.6, x + i * 11, y - h * 0.8, color, 2);
  }
}

export function drawBoss(c, e, time, reveal = 0) {
  if (e.hp <= 0) return;
  const t = tick(time), mutated = e.phase === 2;
  const color = e.flash > 0 ? '#fff3d6' : e.color;
  const shine = mutated ? e.drama.color : '#d3cfb0';
  const wind = e.state === 'windup', strike = e.state === 'strike';
  const attack = ATTACKS[e.pattern], beat = e.attackStep || 0;
  const slash = strike && attack?.kind === 'combo' ? Math.sin(Math.min(1, Math.max(0, (attack.duration - e.timer - attack.beats[beat]) / 0.2)) * Math.PI) : 0;
  const gathering = wind ? 1 - e.timer / e.windupDuration : 0;
  const walk = Math.abs(e.vx) > 10 ? Math.sin(t * 9) * 5 : 0;
  const breath = Math.sin(t * (mutated ? 4 : 2));
  c.save(); c.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h)); c.scale(e.facing, 1);
  const scale = e.h / (mutated ? 150 : 132);
  c.scale(scale, scale);
  if (e.kind === 'warden') {
    shape(c, [[-27, -91], [-34, -56], [-38 - walk, -17], [-20, -23], [-4, -15], [17, -23], [25, -51], [18, -87]], '#293c43', '#111f2a', 2);
    for (let i = 0; i < 8; i++) line(c, -25 + i * 6, -70, -34 + i * 7, -22 + i % 2 * 4, '#54706a');
    for (const side of [-1, 1]) {
      armour(c, side * 29, -78, 9, 26, '#52605b', '#b9a378');
      line(c, side * 29, -88, side * 29, -67, '#e5bb78', 3);
      for (let i = 0; i < 4; i++) rect(c, side * 29 - 4, -85 + i * 6, 8, 2, '#334b4d');
    }
    if (mutated) {
      for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
        const bend = Math.sin(t * 3 + i * 0.4) * 5;
        shape(c, [[side * 13, -85 + i * 3], [side * (44 + i * 5), -128 + i * 8 + bend], [side * (72 + i * 3), -122 + i * 12 + bend], [side * 30, -50 + i * 2]], i % 2 ? '#9b6e43' : '#c09a5a', '#514a37');
        line(c, side * 21, -80 + i * 3, side * (70 + i * 3), -120 + i * 12 + bend, '#f5d294');
        for (let j = 1; j < 4; j++) {
          line(c, side * (24 + j * 13), -89 + i * 5 - j * 7, side * (35 + j * 12), -84 + i * 6 - j * 7, '#edc88f');
          rect(c, side * (45 + i * 4) + Math.sin(t * 4 + i + j) * 3, -107 + i * 9 - j * 4, 2, 3, '#fff1be');
        }
      }
    }
    for (const side of [-1, 1]) {
      limb(c, [side * 11, -41], [side * 16 + walk * side, -21], 7, 5, '#526763', '#a9b29b');
      limb(c, [side * 16 + walk * side, -21], [side * 17, -3], 5, 4, '#354c50', '#91a69c');
      armour(c, side * 16 + walk * side, -20, 7, 12, '#718177', '#c4b58c');
      shape(c, [[side * 17 - 7, -9], [side * 17 + 7, -8], [side * 17 + 13, 0], [side * 17 - 8, 1]], '#566d62', BRASS);
    }
    shape(c, [[-19, -82], [-7, -91], [14, -87], [23, -71], [16, -43], [22, -30], [1, -36], [-21, -29], [-16, -50]], '#354e53', '#122b36', 2);
    armour(c, 0, -65, 21, 32, '#698179', '#d6bd86');
    oval(c, 0, -66, 11, 15, '#293938', '#cfaf74');
    for (let i = 0; i < 5; i++) shape(c, [[-8 + i * 4, -55], [-9 + i * 4, -69 - Math.sin(t * 5 + i) * 4], [-5 + i * 4, -58]], i % 2 ? '#f0c77d' : '#a87e51', null);
    for (const x of [-7, -2, 3, 8]) line(c, x, -78, x, -53, '#778475', 2);
    embroidery(c, 0, -43, 12, 2, '#c9b581');
    for (const side of [-1, 1]) {
      oval(c, side * 16, -72, 4, 4, '#394c4c', '#c4b27e');
      line(c, side * 16 - 3, -72, side * 16 + 3, -72, '#f0dbae');
    }
    for (const side of [-1, 1]) {
      shape(c, [[side * 9, -87], [side * 25, -96], [side * 35, -83], [side * 27, -71], [side * 17, -72]], '#71877c', BRASS, 2);
      for (let i = 0; i < 3; i++) line(c, side * (17 + i * 5), -90, side * (22 + i * 5), -79, '#bdc2a2');
      armour(c, side * 25, -84, 9, 11, '#809386', '#e4c58b');
      chains(c, side * 28, -75, 22, '#a99773', 1);
    }
    if (mutated) {
      for (let i = 0; i < 7; i++) shape(c, [[-15 + i * 5, -98], [-19 + i * 6, -125 - Math.sin(t * 8 + i) * 9], [-8 + i * 4, -104]], i % 2 ? '#edbc75' : '#f7dfac', null);
      crown(c, 0, -110, '#dec292', true);
      glow(c, 0, -109, 62, '#efbd6b', 0.35);
    } else {
      shape(c, [[-15, -92], [-14, -112], [-7, -119], [8, -119], [15, -109], [14, -92]], '#647971', BRASS);
      for (let x = -9; x <= 9; x += 6) { rect(c, x, -110, 3, 13, '#e3bb77'); line(c, x + 2, -113, x + 2, -94, '#31453e', 2); }
      crown(c, 0, -117, '#a6ac90');
      line(c, -13, -114, 10, -114, '#e9d5a5', 2);
      for (const side of [-1, 1]) { oval(c, side * 15, -100, 5, 7, '#637a70', '#c3ad7a'); rect(c, side * 15 - 1, -102, 2, 4, '#f6dbaa'); }
    }
    chains(c, -20, -71, 39, BRASS, 2);
    lantern(c, -27, -32, time, '#f6c877', 1.6);
    const hand = [strike ? 31 + slash * 17 : 29, wind ? -102 - gathering * 5 : -63 - slash * (beat % 2 ? 28 : 0)];
    limb(c, [24, -78], hand, 8, 4, '#748b7d', '#bdc7a5');
    armour(c, hand[0], hand[1], 7, 11, '#72897d', '#e4c58c');
    c.save(); c.translate(...hand); c.rotate(wind ? -1.6 - gathering * 0.3 : strike ? -1.3 + slash * 1.9 : -0.85);
    limb(c, [-16, 0], [53, 0], 3, 2, '#83704e', BRASS);
    shape(c, [[36, -17], [57, -24], [71, -11], [63, 9], [48, 17], [56, -2], [36, -1]], '#b1c1ad', '#e2ddbb', 1.5);
    line(c, 58, -19, 66, -11, '#f8ecd0', 2);
    for (let i = 0; i < 6; i++) { rect(c, 43 + i * 3, -9 + i % 2 * 3, 2, 2, '#697e76'); line(c, 38 + i * 3, -1, 39 + i * 3, 4, '#ece2b9'); }
    c.restore();
  } else if (e.kind === 'widow') {
    oval(c, -4, -38, 28, 25, '#35473d', '#76866b');
    for (let i = 0; i < 6; i++) {
      const x = -25 + i * 9;
      shape(c, [[x, -53], [x + 6, -61], [x + 13, -42], [x + 8, -20], [x, -16], [x - 5, -35]], i % 2 ? '#74816a' : '#526c55', '#9eaa81');
      line(c, x + 3, -49, x + 5, -23, '#c7c496');
    }
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const joint = [side * (31 + i * 9 + slash * (i === beat % 3 ? 13 : 0)), -44 - i * 10 + Math.sin(t * 3 + i) * 3 - gathering * 13];
      const foot = [side * (45 + i * 12 + slash * (i === beat % 3 ? 22 : 0)), -2 + Math.sin(t * 3 + i) * 2 - (wind && i < 2 ? 15 : 0)];
      limb(c, [side * 9, -35 - i * 7], joint, 5 - i * 0.4, 3, '#5c715a', color);
      limb(c, joint, foot, 3, 0.5, '#72866a', shine);
      shape(c, [[joint[0], joint[1]], [joint[0] + side * 9, joint[1] - 15], [joint[0] + side * 3, joint[1] + 7]], color);
      oval(c, ...joint, 4, 4, '#9ca783', '#40594a');
      for (let j = 1; j <= 3; j++) {
        const x = joint[0] + (foot[0] - joint[0]) * j / 4, y = joint[1] + (foot[1] - joint[1]) * j / 4;
        line(c, x, y, x + side * 7, y - 7, '#d1cc9f', 1.5);
      }
    }
    shape(c, [[-9, -84], [7, -88], [17, -70], [12, -48], [27, -23], [10, -27], [0, -18], [-28, -24], [-15, -51]], '#34463e', '#1c3134', 2);
    for (let i = 0; i < 7; i++) line(c, -11 + i * 4, -67, -26 + i * 8, -25, '#7c8d71', 1.5);
    oval(c, 0, -87, 9, 13, '#d5d0a7', '#6b8165');
    if (!mutated) {
      shape(c, [[-12, -90], [-9, -104], [1, -110], [13, -96], [18, -57], [8, -66], [-10, -65], [-18, -55]], '#768477a0', '#c0c1a0');
      for (let i = 0; i < 8; i++) {
        line(c, -12 + i * 4, -87, -19 + i * 5, -57 + i % 2 * 3, '#bbbf9d88');
        for (let j = 0; j < 3; j++) rect(c, -13 + i * 4, -78 + j * 7, 1, 1, '#e5d9b2');
      }
      crown(c, 0, -103, '#a4b68a', true);
      line(c, -5, -88, 7, -87, '#283c3c', 2);
      oval(c, 0, -46, 12, 8, '#25372f', '#9fa27b');
      line(c, -15, -49, 12, -51, '#cec59f', 2);
      embroidery(c, 0, -42, 9, 3, '#aab18b');
      for (const side of [-1, 1]) oval(c, side * 13, -98, 5, 5, '#b2b791', '#e0d1a4');
    } else {
      for (let i = 0; i < 11; i++) {
        const a = i * TAU / 11 + Math.sin(t) * 0.08;
        shape(c, [[Math.cos(a) * 8, -91 + Math.sin(a) * 8], [Math.cos(a) * 28, -91 + Math.sin(a) * 32], [Math.cos(a + 0.23) * 35, -91 + Math.sin(a + 0.23) * 40], [Math.cos(a + 0.45) * 16, -91 + Math.sin(a + 0.45) * 18]], i % 2 ? '#acbe84' : '#d2d3a1', '#6e8763');
        line(c, Math.cos(a + 0.18) * 12, -91 + Math.sin(a + 0.18) * 14, Math.cos(a + 0.23) * 32, -91 + Math.sin(a + 0.23) * 36, '#edf0bd');
        shape(c, [[Math.cos(a) * 8, -91 + Math.sin(a) * 8], [Math.cos(a + 0.2) * 21, -91 + Math.sin(a + 0.2) * 24], [Math.cos(a + 0.4) * 12, -91 + Math.sin(a + 0.4) * 15]], '#718758', '#b3c48b');
      }
      oval(c, 0, -92, 10, 12, '#263e39', '#ecdfb5');
      for (let i = 0; i < 5; i++) rect(c, -6 + i * 3, -97 + i % 2 * 7, 2, 3, '#edd6a7');
      iris(c, 0, -93, 8, 6, '#97ac73', t);
      for (const side of [-1, 1]) {
        iris(c, side * 13, -80, 4, 3, '#bdc48b', t);
        limb(c, [side * 4, -75], [side * 20, -43], 4, 1, '#768d65', '#c8d3a3');
      }
      embroidery(c, 0, -67, 11, 4, '#b7c48c');
    }
  } else if (e.kind === 'cantor') {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const x = side * (22 + i * 5), top = -117 + i * 6;
        limb(c, [x, top], [x, -50 + i * 3], 2.5, 2, '#426b77', '#b7c4a4');
        oval(c, x, top, 2, 3, '#1c3948', '#c8c7a3');
        rect(c, x - 1, top + 7, 2, 8, '#192e3c');
      }
      shape(c, [[side * 12, -89], [side * 42, -61], [side * 45, -13], [side * 23, -28]], '#3d6672', '#7ca395');
      chains(c, side * 29, -73, 46, '#a3b899', 3);
    }
    if (mutated) {
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + i * Math.PI / 8;
        const x = Math.cos(a) * 43, y = -92 + Math.sin(a) * 43;
        oval(c, x, y, 7, 11, '#c0d4bf', '#537b7f');
        oval(c, x, y + 3, 3, 5, '#233d4a'); line(c, x - 3, y - 3, x + 3, y - 3, '#486967');
        line(c, x - 6, y - 6, x, y - 10, '#ecdfb4');
        for (let j = 0; j < 3; j++) line(c, x - 3 + j * 3, y + 7, x - 4 + j * 4, y + 13 + Math.sin(t * 2 + i) * 3, '#93b4a3');
      }
      for (let i = 0; i < 7; i++) {
        const x = -25 + i * 8, sway = Math.sin(t * 3 + i) * 12;
        limb(c, [x, -45], [x * 1.7 + sway, -18], 5, 3, '#527b7b', '#b6d4b7');
        limb(c, [x * 1.7 + sway, -18], [x * 2 + sway, 0], 3, 0.5, '#678d86', '#c1d8bb');
      }
    }
    shape(c, [[-17, -88], [-7, -101], [11, -97], [21, -75], [14, -51], [32, -10], [13, -15], [1, -7], [-29, -12], [-15, -50]], '#315565', '#173b49', 2);
    shape(c, [[-9, -90], [-3, -87], [-6, -45], [-15, -13], [-21, -18]], '#68958e', null);
    for (let i = 0; i < 4; i++) line(c, 4 + i * 4, -74, 11 + i * 5, -15, '#809e8b', 1.5);
    shape(c, [[-11, -89], [12, -90], [15, -17], [0, -9], [-16, -18]], '#768e83', '#d6c59b');
    embroidery(c, 0, -75, 9, 8, '#d4c297');
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = side * (17 + i * 7), y = -65 + i * 16;
      oval(c, x, y, 4, 5, '#759c92', '#d1caa6');
      line(c, x - 3, y + 2, x + 3, y + 2, '#233e48', 2);
    }
    hood(c, 0, -104, '#7dada1', '#d7d1a4', 'skull');
    crown(c, 0, -110, '#b9c6a5');
    for (const side of [-1, 1]) { line(c, side * 7, -107, side * 13, -87, '#d4cfac', 2); oval(c, side * 12, -84, 3, 4, '#b9c6a6', '#45656b'); }
    oval(c, 4, -101, 4, mutated ? 9 : 5, '#1a3844', '#c4d4b3');
    limb(c, [15, -82], [31, wind ? -89 : -60], 6, 3, '#679d98', '#bad2ba');
    line(c, 32, -119, 32, -12, '#aebf9d', 3);
    oval(c, 32, -125, 11, 12, '#385d65', '#c5c69d');
    for (let i = 0; i < 4; i++) line(c, 23 + i * 6, -128, 23 + i * 6, -139 + i % 2 * 7, '#ded3a5', 2);
    if (wind || strike) {
      const r = 12 + gathering * 12;
      c.strokeStyle = '#b8dad0'; c.lineWidth = 1; c.beginPath(); c.ellipse(6, -101, r, r * 0.6, 0, 0, TAU); c.stroke();
    }
  } else if (e.kind === 'astronomer') {
    c.translate(0, -5 + breath * 3);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const joint = [side * (29 + i * 5), -95 + i * 19 - gathering * 12], hand = [side * (45 + i * 5), -114 + i * 29 - gathering * 5];
      limb(c, [side * 9, -80 + i * 7], joint, 3, 2, '#706b89', '#c7b69f');
      limb(c, joint, hand, 2, 1, '#9a90aa', '#e4d8be');
      oval(c, ...joint, 3, 3, '#665f82', '#d0c0aa');
      for (const finger of [-1, 1]) line(c, ...hand, hand[0] + side * 5, hand[1] + finger * 7, '#decbaa', 1.5);
    }
    if (mutated) {
      for (let i = 0; i < 8; i++) {
        const a = t * 0.55 + i * TAU / 8;
        const x = Math.cos(a) * 53, y = -72 + Math.sin(a) * 55;
        line(c, 0, -70, x, y, '#9182b1', 1);
        iris(c, x, y, 11, 6, '#9583b8', t + i);
        oval(c, x, y - 9, 2, 2, '#d5c3a6');
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = -20 + i * 10;
      shape(c, [[x, -78], [x + 9, -72], [x + Math.sin(t * 2 + i) * 12 + 14, -11 - i % 2 * 7], [x + Math.sin(t * 2 + i) * 10, -5], [x - 7, -40]], i % 2 ? '#51456e' : '#695d83', '#2e3455');
    }
    shape(c, [[-15, -94], [0, -105], [18, -89], [10, -49], [-8, -47]], '#6f6b94', '#d0bad4');
    oval(c, 0, -72, 22, 26, '#30364f', '#c9b894');
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = i % 2 ? '#b8afd1' : '#d2bd9c'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, -72, 13 + i * 5, 22, t * 0.15 + i * 0.8, 0, TAU); c.stroke();
    }
    if (mutated) iris(c, 0, -72, 16, 12, '#ac8dc4', t);
    else { oval(c, 0, -72, 7, 8, '#b5b7cb', '#f2e4c5'); line(c, -4, -77, 3, -68, '#6c688f'); }
    for (let i = 0; i < 18; i++) rect(c, Math.sin(i * 3.8) * (9 + i), -88 + i * 4, 1 + i % 2, 1 + i % 2, '#d4c7e1');
    hood(c, 0, -106, '#625581', '#d9c1da');
    line(c, -6, -108, 7, -105, '#e8d8c7', 4);
    for (let i = 0; i < 4; i++) line(c, -7, -111 + i * 3, 8, -108 + i * 3, i % 2 ? '#80799b' : '#ded2be');
    crown(c, 0, -121, '#c4b497');
    c.save(); c.translate(0, -89); c.rotate(t * 0.3);
    for (const r of [30, 38]) {
      const points = Array.from({ length: 32 }, (_, i) => [Math.cos(i * TAU / 32) * r, Math.sin(i * TAU / 32) * r * 0.42]);
      c.strokeStyle = '#b5a78c'; c.lineWidth = 1; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke();
    }
    c.restore();
    limb(c, [13, -86], [31, wind ? -104 : -73], 5, 2, '#9386a7', '#dcceca');
    glow(c, 32, wind ? -111 : -79, 33, color, 0.3);
    oval(c, 32, wind ? -111 : -79, 7, 7, '#d9c6e0', '#8a75a5');
  } else {
    const pulse = 1 + Math.sin(t * 5) * 0.035 + gathering * 0.06;
    c.translate(0, -68); c.scale(pulse, pulse); c.translate(0, 68);
    const wings = mutated ? 6 : 3;
    for (const side of [-1, 1]) for (let i = 0; i < wings; i++) {
      const sway = Math.sin(t * 2 + i) * 7;
      const tip = [side * (55 + i * 9), -104 + i * 16 + sway];
      limb(c, [side * 12, -76 + i * 5], [side * 37, -109 + i * 17], 5, 3, '#a37978', color);
      limb(c, [side * 37, -109 + i * 17], tip, 3, 0.7, '#b78d80', '#efc5a4');
      shape(c, [[side * 14, -76 + i * 5], [side * 37, -109 + i * 17], tip, [side * 30, -52 + i * 5]], i % 2 ? '#855c6b' : '#a27579', '#cf9b87');
      line(c, side * 17, -76 + i * 5, ...tip, '#edb59c');
      for (let j = 1; j < 5; j++) {
        const x = side * (19 + j * 8 + i * 2), y = -78 + i * 10 - j * 3 + sway * 0.4;
        line(c, x, y, x + side * (6 + i), y + 8, '#dcaaa0');
        line(c, x, y, x + side * 4, y - 5, '#6f4f69');
        rect(c, x, y + 1, 1, 2, '#efc8ac');
      }
    }
    const shell = [[-24, -80], [-17, -103], [-3, -110], [7, -100], [20, -107], [32, -87], [24, -57], [2, -30], [-18, -50]];
    shape(c, shell, '#91596a', '#e0ac90', 2);
    patina(c, shell, '#efc7a4', '#51384d', 3);
    shape(c, [[-21, -84], [-12, -101], [-3, -94], [2, -74], [-3, -49], [-11, -48], [-18, -62]], '#ba8790', '#70485e');
    shape(c, [[7, -98], [19, -103], [26, -86], [17, -67], [9, -43], [0, -37], [3, -61]], '#735066', '#d69d96');
    for (let i = 0; i < 8; i++) {
      const y = -99 + i * 7;
      line(c, -10 + Math.sin(i) * 3, y, 3, y + 5, '#ebc3a5', 1.5);
      line(c, 0, y + 2, 9 + Math.sin(i) * 3, y - 2, '#c99997');
      rect(c, -6, y + 2, 2, 2, '#65475e');
    }
    shape(c, [[-16, -83], [-10, -96], [0, -92], [5, -78], [-1, -52], [-10, -64]], '#d0998a', null);
    if (mutated) {
      oval(c, 4, -78, 12, 20, '#f0c6a1', '#ab6f70');
      for (let i = 0; i < 5; i++) line(c, -4, -91 + i * 6, 12, -86 + i * 6, '#fff0c2', 2);
      for (let i = 0; i < 3; i++) {
        shape(c, [[-3 + i * 5, -69], [-3 + i * 5, -82 - i % 2 * 7], [i * 5, -87 - i % 2 * 7], [3 + i * 5, -82 - i % 2 * 7], [3 + i * 5, -69]], '#7d5f73', '#fff0c9');
        rect(c, i * 5, -78, 1, 6, '#ffe5b1');
      }
      glow(c, 3, -78, 70, '#f7b89b', 0.3);
    } else {
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
        limb(c, [side * 3, -95 + i * 9], [side * 25, -87 + i * 8], 3, 1, '#bc9d95', '#e4c6a9');
        oval(c, side * 21, -88 + i * 9, 2, 3, '#ddd0b2', '#6f556b');
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = -17 + i * 9, y = -105 - i % 2 * 8;
      limb(c, [x, -91], [x + Math.sin(t * 2 + i) * 5, y], 3, 1.5, '#a2798a', '#dcada3');
      oval(c, x + Math.sin(t * 2 + i) * 5, y, 3, 2, '#493b50', '#d2a79e');
    }
    for (const side of [-1, 1]) { limb(c, [side * 11, -42], [side * 23, -17], 5, 3, '#94717a', '#d1a69a'); limb(c, [side * 23, -17], [side * 19, -1], 3, 1, '#b4968c', '#ebc9a5'); }
    crown(c, 3, -104, '#e7b39b', true);
  }
  attackArc(c, e, scale);
  if (reveal > 0) {
    c.save(); c.globalAlpha = reveal * 0.4; glow(c, 0, -80, 130, shine, 0.6); c.restore();
  }
  c.restore();
}

export function drawNPC(c, npc, time, scale = 1, facing = 1) {
  const t = tick(time), color = npc.color;
  c.save(); c.translate(npc.x, npc.y + Math.sin(t * 1.7) * 0.7); c.scale(facing * scale, scale);
  if (npc.portrait === 'sister') {
    shape(c, [[-7, -49], [7, -50], [12, -34], [19, -4], [9, 0], [-2, -3], [-15, 0], [-9, -26]], '#bcc8b9', '#758f8c', 1.5);
    for (let i = 0; i < 5; i++) line(c, -7 + i * 4, -29, -12 + i * 7, -3, '#8faaa3');
    oval(c, 0, -55, 7, 10, '#e3c9aa', '#5d6a63');
    shape(c, [[-5, -60], [-1, -64], [1, -60], [-1, -54], [1, -48], [-4, -49]], '#b29d87', null);
    shape(c, [[3, -57], [5, -54], [8, -52], [4, -51]], '#f0d8b4', null);
    shape(c, [[-9, -52], [-8, -64], [0, -69], [9, -62], [10, -47], [5, -51], [4, -62], [-4, -62], [-5, -48]], '#5e5f52');
    line(c, 1, -58, 5, -58, '#706758');
    rect(c, 3, -56, 2, time % 4.8 < 0.15 ? 1 : 2, '#374c4b');
    line(c, 2, -49, 5, -49, '#996b5c');
    for (let i = 0; i < 3; i++) line(c, -6 + i * 3, -63, -7 + i * 3, -56 + i, '#85806b');
    line(c, -8, -49, 7, -47, '#a46e5a', 3);
    limb(c, [8, -44], [14, -29], 3, 2, '#d4d0b1', '#fff0c8');
    lantern(c, 15, -19, time, '#efcf9b', 0.8);
  } else {
    const robe = npc.portrait === 'ferrier' ? '#4e7880' : npc.portrait === 'scholar' ? '#6b6382' : npc.portrait === 'gardener' ? '#617257' : '#646d58';
    shape(c, [[-11, -48], [5, -52], [14, -39], [8, -26], [17, -2], [2, 0], [-5, -6], [-18, -2], [-11, -28]], robe, '#243840', 1.5);
    shape(c, [[-10, -42], [-3, -42], [-6, -22], [-12, -2], [-19, -1]], '#354e4b', null);
    line(c, 1, -44, 8, -7, color, 2);
    for (let i = 0; i < 4; i++) rect(c, -2, -41 + i * 6, 2, 2, BRASS);
    oval(c, 0, -54, 7, 10, '#c5b798', '#62796e');
    shape(c, [[-6, -59], [-2, -62], [-1, -55], [1, -46], [-5, -49]], '#968f79', null);
    shape(c, [[3, -57], [5, -54], [8, -52], [4, -51]], '#e5ceaa', null);
    line(c, 1, -59, 5, -58, '#5c6659');
    rect(c, 3, -56, 2, time % 5.2 < 0.15 ? 1 : 2, '#30484c');
    line(c, 1, -49, 5, -49, '#82735f');
    if (npc.portrait === 'keeper') {
      shape(c, [[-7, -49], [0, -46], [6, -48], [3, -34], [-4, -40]], '#abb0a0', '#79877a');
      shape(c, [[-14, -62], [-6, -70], [7, -66], [12, -59], [-14, -57]], '#526257', color);
      limb(c, [-9, -40], [-19, -26], 4, 2, robe, color);
      lantern(c, -20, -16, time, '#ebc781', 1);
      line(c, 20, -47, 19, 0, '#9e8a67', 3);
    } else if (npc.portrait === 'gardener') {
      for (let i = 0; i < 5; i++) oval(c, -9 + i * 4, -65 + Math.sin(i) * 2, 4, 3, i % 2 ? '#c2c28a' : '#a7b483', '#657953');
      line(c, -7, -48, 5, -44, '#d0c8a4', 2);
      oval(c, 14, -25, 7, 6, '#938064', '#c5b483');
      limb(c, [9, -41], [14, -26], 4, 3, robe, color);
      line(c, 14, -30, 15, -40, '#849e6d'); oval(c, 19, -38, 5, 2, '#b1c18c');
    } else if (npc.portrait === 'ferrier') {
      shape(c, [[-11, -49], [-11, -67], [-3, -72], [8, -66], [13, -49], [7, -45], [5, -61], [-4, -63], [-6, -46]], '#a3bcb0', '#d7d6b2');
      line(c, 24, -82, 18, -3, '#a3b29a', 3);
      shape(c, [[21, -80], [21, -96], [29, -99], [28, -83]], '#91ada9', color);
      limb(c, [10, -43], [23, -36], 4, 2, robe, color);
    } else {
      hood(c, 0, -56, '#797391', '#c6b9d3');
      shape(c, [[3, -37], [17, -42], [23, -29], [8, -26]], '#b9afa0', '#7a7668');
      for (let i = 0; i < 3; i++) line(c, 9, -35 + i * 3, 18, -36 + i * 3, '#6d7880');
      limb(c, [11, -45], [19, -30], 3, 2, robe, color);
      for (let i = 0; i < 3; i++) rect(c, -15 + i * 10, -78 + Math.sin(t + i) * 3, 2, 2, color);
    }
  }
  c.restore();
}

export function drawPortrait(c, npc, time) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  const w = c.canvas.width, h = c.canvas.height;
  const gradient = c.createRadialGradient(w * 0.5, h * 0.5, 5, w * 0.5, h * 0.5, w * 0.7);
  gradient.addColorStop(0, '#456258'); gradient.addColorStop(1, '#0e2028');
  c.fillStyle = gradient; c.fillRect(0, 0, w, h);
  glow(c, w / 2, h / 2, w / 2, npc.color, 0.22);
  c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
  drawNPC(c, { ...npc, x: w * 0.48, y: h * 1.45 }, time, w / 44, 1);
  c.restore();
}
