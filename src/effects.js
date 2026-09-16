import { rect, line, shape, oval, glow } from './art.js';

export function drawHazard(c, z, time) {
  const color = z.color || '#c2a4ec';
  c.save();
  if (z.kind === 'beam') {
    const dx = z.endX - z.x, dy = z.endY - z.y;
    if (z.fired) {
      c.globalAlpha = Math.min(1, z.life * 8);
      line(c, z.x, z.y, z.endX, z.endY, '#342641', z.width + 7);
      line(c, z.x, z.y, z.endX, z.endY, color, z.width);
      line(c, z.x, z.y, z.endX, z.endY, z.visual === 'heart' ? '#ffdec1' : '#f2f4df', z.width * 0.3);
    } else {
      c.globalAlpha = 0.18; line(c, z.x, z.y, z.endX, z.endY, color, z.width + 6);
      c.globalAlpha = 0.7; c.setLineDash([7, 7]);
      line(c, z.x, z.y, z.endX, z.endY, color, 1); c.setLineDash([]);
    }
    for (let i = 1; i <= 6; i++) {
      const x = z.x + dx * i / 7, y = z.y + dy * i / 7;
      oval(c, x, y, z.fired ? 5 : 3, z.fired ? 5 : 3, '#241f3a', color);
      rect(c, x - 1, y - 1, 2, 2, '#fff0d2');
    }
    glow(c, z.x, z.y, 24, color, z.fired ? 0.65 : 0.22);
  } else {
    const height = z.height || 100, radius = z.radius;
    if (!z.fired) {
      c.globalAlpha = 0.12;
      rect(c, z.x - radius, z.y - height, radius * 2, height, color);
      c.globalAlpha = 0.65;
      line(c, z.x - radius, z.y, z.x + radius, z.y, color, 3);
      c.setLineDash([3, 6]);
      line(c, z.x - radius, z.y - height, z.x - radius, z.y, color);
      line(c, z.x + radius, z.y - height, z.x + radius, z.y, color);
      c.setLineDash([]);
      const r = 7 + Math.min(1, Math.max(0, z.timer)) * 12;
      c.strokeStyle = color; c.lineWidth = 1;
      c.beginPath(); c.ellipse(z.x, z.y - 3, r, r * 0.3, 0, 0, Math.PI * 2); c.stroke();
      shape(c, [[z.x - 4, z.y - 14], [z.x, z.y - 21], [z.x + 4, z.y - 14], [z.x, z.y - 7]], color);
    } else {
      c.globalAlpha = Math.min(1, z.life * 5);
      glow(c, z.x, z.y - height * 0.45, height * 0.75, color, 0.3);
      for (let i = 0; i < 5; i++) {
        const x = z.x - radius + i * radius * 0.5, h = height * (i % 2 ? 0.72 : 1);
        const tone = z.kind === 'roots' ? '#9aad7b' : z.kind === 'cinder' ? '#e9b57e' : z.kind === 'heart' ? '#d69a9f' : z.kind === 'stone' ? '#8d9b91' : '#c9c8eb';
        if (z.kind === 'stone') {
          shape(c, [[x - 6, z.y], [x - 7, z.y - h + 9], [x, z.y - h], [x + 8, z.y - h + 8], [x + 7, z.y]], '#4c5e5b', tone);
          line(c, x, z.y - h + 15, x, z.y - 20, tone);
        } else {
          const bend = Math.sin(time * 4 + i) * 6;
          shape(c, [[x - 6, z.y], [x - 8, z.y - h * 0.55], [x + bend, z.y - h], [x + 5, z.y - h * 0.5], [x + 7, z.y]], tone, color);
          line(c, x, z.y - 5, x + bend, z.y - h + 7, '#f6e7c7');
          if (z.kind === 'roots') for (let j = 1; j <= 3; j++) line(c, x, z.y - h * j / 4, x + (j % 2 ? 12 : -12), z.y - h * j / 4 - 9, '#c7d5a8', 2);
        }
      }
    }
  }
  c.restore();
}

export function drawProjectile(c, b, time) {
  const color = b.color || '#c2a4ec', x = b.x + b.w / 2, y = b.y + b.h / 2;
  glow(c, x, y, b.orbit ? 19 : 25, color, b.orbit ? 0.18 : 0.35);
  if (b.returning && b.owner.hp > 0) {
    c.save(); c.globalAlpha = 0.45;
    const ox = b.owner.x + b.owner.w / 2, oy = b.owner.y + b.owner.h * 0.4;
    line(c, ox, oy, x, y, '#7b867a');
    for (let i = 0; i < 14; i++) oval(c, ox + (x - ox) * i / 14, oy + (y - oy) * i / 14, 2, 1, '#243b3d', '#c3b38a');
    c.restore();
  }
  c.save(); c.translate(x, y);
  if (b.wave) {
    c.scale(b.vx < 0 ? -1 : 1, 1);
    shape(c, [[-13, 9], [-8, -4], [2, -11], [10, -8], [3, -4], [0, 3], [14, 9]], b.visual === 'pulse' ? '#d0a6a8' : '#a8d0d3', color, 2);
    line(c, -8, 7, 9, 7, '#f7e9c6');
  } else if (['anchor', 'cleaver', 'censer'].includes(b.visual)) {
    c.rotate((b.age || 0) * 6);
    line(c, -16, 0, 14, 0, '#d2b582', 3);
    if (b.visual === 'anchor') shape(c, [[10, -17], [15, -17], [14, -7], [22, 0], [14, 9], [15, 18], [8, 17], [5, 8], [14, 0], [5, -7]], '#819e9f', color);
    else if (b.visual === 'cleaver') shape(c, [[3, -15], [19, -18], [25, -7], [18, 12], [7, 16], [12, 3], [3, 3]], '#d2d9bf', color, 2);
    else { oval(c, 7, 0, 10, 10, '#795e48', color); for (let i = -5; i <= 5; i += 5) line(c, i + 7, -7, i + 7, 7, '#fff0ba'); }
  } else if (b.visual === 'eye') {
    shape(c, [[-12, 0], [0, -7], [12, 0], [0, 7]], '#ddd2e4', color);
    oval(c, 0, 0, 4, 6, '#5f547d'); rect(c, -1, -3, 2, 6, '#fcf2cc');
  } else if (b.visual === 'seed') {
    c.rotate(Math.atan2(b.vy, b.vx));
    shape(c, [[-9, 0], [-3, -7], [9, -2], [11, 3], [-3, 7]], '#aaba86', color);
    line(c, -5, 0, 6, 0, '#ecdfab'); line(c, -1, 0, 3, -4, '#5a7558');
  } else if (b.visual === 'note') {
    for (let i = 0; i < 3; i++) { c.strokeStyle = i === 1 ? '#e2efdd' : color; c.lineWidth = 1.5; c.beginPath(); c.ellipse(-i * 5, 0, 4 + i * 2, 8 + i * 3, 0, 0, Math.PI * 2); c.stroke(); }
  } else if (b.visual === 'heart') {
    oval(c, 0, 0, 8, 10, '#b8828d', color); oval(c, 1, -2, 3, 5, '#ffe0bd');
    for (const side of [-1, 1]) line(c, side * 6, -4, side * 13, -8, color, 2);
  } else {
    c.rotate(Math.atan2(b.vy, b.vx));
    shape(c, [[-11, 0], [-2, -5], [10, 0], [-2, 5]], color, '#f1e4c6');
    line(c, -18, 0, -4, 0, color, 2);
  }
  if (b.split && b.age > 0.35) {
    c.strokeStyle = color; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 11 + (b.age - 0.35) * 14, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
}
