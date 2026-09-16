import { line, oval, glow, shape } from './art.js';

const smooth = (a, b, value) => { const x = Math.max(0, Math.min(1, (value - a) / (b - a))); return x * x * (3 - 2 * x); };

export function entrancePose(kind, progress, reducedMotion = false) {
  const reveal = smooth(0.24, 0.56, progress);
  const height = { warden: -220, widow: 105, cantor: 155, astronomer: -45, heart: -30 }[kind];
  return { offsetY: reducedMotion ? 0 : height * (1 - reveal), alpha: smooth(0.17, kind === 'astronomer' ? 0.6 : 0.38, progress), reveal };
}

export function drawEntrance(c, boss, progress, front, settings) {
  const pose = entrancePose(boss.kind, progress, settings.reducedMotion), x = boss.x + boss.w / 2;
  const fade = 1 - smooth(0.76, 1, progress), color = boss.drama.color, ground = 452;
  const t = settings.reducedMotion ? 0 : progress * 9;
  c.save(); c.translate(x, ground);
  if (!front) {
    c.fillStyle = `rgba(5,15,22,${(1 - pose.reveal) * 0.4})`; c.fillRect(-600, -540, 1200, 540);
    glow(c, 0, -boss.h * 0.6, 175, color, 0.08 + pose.reveal * 0.18);
  }
  c.globalAlpha *= fade;
  if (boss.kind === 'warden') {
    if (!front) for (const side of [-1, 1]) {
      const bottom = -boss.h * 0.62 + pose.offsetY;
      line(c, side * 30, -530, side * 30, bottom, '#303e3d', 5);
      for (let y = -530; y < bottom; y += 9) oval(c, side * 30, y, 2.4, 5, '#39443c', '#b4a47d');
    } else if (progress > 0.53 && settings.particles && !settings.reducedMotion) {
      const spread = smooth(0.53, 0.76, progress);
      for (let i = 0; i < 26; i++) {
        const a = i * 2.4, radius = spread * (50 + i * 5);
        oval(c, Math.cos(a) * radius, -Math.abs(Math.sin(a)) * 24 * (1 - spread), 7 + spread * 6, 3, '#a7a38677');
      }
    }
  } else if (boss.kind === 'widow') {
    if (!front) for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
      const gap = pose.reveal * (48 + i * 12);
      c.strokeStyle = i % 2 ? '#84976a' : '#50664d'; c.lineWidth = 5 - i * 0.5; c.beginPath();
      c.moveTo(side * (18 + i * 13), 0); c.bezierCurveTo(side * (100 + gap), -82, side * gap, -175, side * (20 + gap), -260); c.stroke();
    }
    if (front && settings.particles) for (let i = 0; i < 20; i++) {
      const px = Math.sin(i * 7.13 + t * 0.3) * (45 + i * 4), py = -190 + (i * 31 + t * 23) % 190;
      oval(c, px, py, 3, 1.5, '#d4d3a0');
    }
  } else if (boss.kind === 'cantor') {
    if (!front) for (let i = 0; i < 6; i++) {
      const px = -140 + i * 56;
      c.globalAlpha = fade * 0.2;
      shape(c, [[px - 15, 0], [px - 7, -82 - pose.reveal * 38], [px + 7, -82 - pose.reveal * 38], [px + 18, 0]], '#a0c6b7');
      oval(c, px, -89 - pose.reveal * 38, 7, 11, '#bbd4c4');
    } else for (let i = 0; i < 6; i++) {
      c.globalAlpha = fade * 0.48;
      c.strokeStyle = color; c.lineWidth = 1.5; c.beginPath();
      c.ellipse(0, -2 + i * 2, 35 + i * 18 + pose.reveal * 60, 6 + i * 2, 0, 0, Math.PI * 2); c.stroke();
    }
  } else if (boss.kind === 'astronomer') {
    if (!front) for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6 + t * 0.13, r = 136 - pose.reveal * 45;
      const px = Math.cos(angle) * r, py = -94 + Math.sin(angle) * r;
      line(c, px, py, Math.cos(angle + Math.PI * 5 / 6) * r, -94 + Math.sin(angle + Math.PI * 5 / 6) * r, '#8e82a688');
      glow(c, px, py, 17, color, 0.27); oval(c, px, py, 2.5, 2.5, '#e0ccdf');
    }
  } else {
    if (!front) for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      c.strokeStyle = i % 2 ? '#bf938b' : '#826076'; c.lineWidth = 4 - i * 0.5;
      c.beginPath(); c.moveTo(side * 18, -90 + pose.offsetY);
      c.bezierCurveTo(side * 110, -110 - i * 23, side * 80, -243 - i * 27, side * (165 + i * 33), -330); c.stroke();
    }
    if (front) glow(c, 0, -82, 110, color, (0.12 + pose.reveal * 0.14) * fade);
  }
  c.restore();
}
