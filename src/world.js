import { rect, line, shape, oval, glow, limb } from './art.js';

const wrap = (n, width) => (n % width + width) % width;
const TAU = Math.PI * 2;

export function districtLandmark(c, district, floor, chapter, time, settings) {
  const { x, kind } = district, t = settings.reducedMotion ? 0 : time;
  const colors = [['#667a70', '#c7ac77'], ['#627859', '#bccc97'], ['#487581', '#a9d1c7'], ['#6e658a', '#ccb7d8'], ['#895e71', '#e5b39d']][chapter];
  c.save(); c.translate(x, floor); c.globalAlpha = 0.78;
  if (kind === 'clock' || kind === 'belfry' || kind === 'furnace') {
    shape(c, [[-95, 0], [-88, -216], [-55, -236], [0, -293], [55, -236], [88, -216], [95, 0]], '#20343b', colors[0], 3);
    for (const side of [-1, 1]) { limb(c, [side * 76, 0], [side * 70, -213], 9, 5, '#344849', colors[0]); line(c, side * 84, -217, 0, -282, colors[1], 2); }
    if (kind === 'clock') {
      oval(c, 0, -199, 47, 47, '#192e34', colors[1]);
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; line(c, Math.cos(a) * 37, -199 + Math.sin(a) * 37, Math.cos(a) * 42, -199 + Math.sin(a) * 42, colors[1], 2); }
      line(c, 0, -199, Math.sin(t * 0.04) * 34, -199 - Math.cos(t * 0.04) * 34, colors[1], 2);
      line(c, 0, -199, -22, -216, colors[1], 3);
    } else if (kind === 'belfry') {
      line(c, 0, -270, 0, -225, colors[1], 3);
      shape(c, [[-40, -135], [-30, -196], [-16, -220], [16, -220], [30, -196], [40, -135]], colors[0], colors[1], 2);
      oval(c, 0, -135, 42, 11, '#192d35', colors[1]); line(c, 0, -172, Math.sin(t) * 9, -124, colors[1], 4);
    } else {
      for (let i = 0; i < 3; i++) {
        const bx = -51 + i * 51;
        shape(c, [[bx - 16, -27], [bx - 16, -145], [bx, -174], [bx + 16, -145], [bx + 16, -27]], '#be8859', colors[1]);
        for (let k = 0; k < 5; k++) line(c, bx - 14, -124 + k * 20, bx + 14, -124 + k * 20, '#354039', 4);
        glow(c, bx, -80, 60, '#dbac69', 0.19 + Math.sin(t * 3 + i) * 0.04);
      }
    }
  } else if (kind === 'glasshouse' || kind === 'cradle') {
    for (const side of [-1, 1]) {
      c.strokeStyle = colors[0]; c.lineWidth = 15; c.beginPath(); c.moveTo(side * 112, 0); c.bezierCurveTo(side * 90, -65, side * 170, -164, 0, -260); c.stroke();
      c.strokeStyle = colors[1]; c.lineWidth = 2; c.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const x = -90 + i * 30;
      if (kind === 'glasshouse') line(c, x, -15, x * 0.4, -205 - (3 - Math.abs(3 - i)) * 15, colors[0], 2);
      else { line(c, x, -182 - Math.sin(i) * 35, x * 0.6, -104, colors[0], 3); oval(c, x * 0.6, -107, 14, 24, '#3e5946', colors[1]); }
    }
    if (kind === 'glasshouse') for (let i = 0; i < 4; i++) line(c, -100, -48 - i * 40, 100, -48 - i * 40, colors[0], 2);
    else { oval(c, 0, -51, 64, 18, '#344537', colors[1]); line(c, -52, -55, -67, -21, colors[0], 4); line(c, 52, -55, 67, -21, colors[0], 4); }
  } else if (kind === 'ferry') {
    shape(c, [[-140, -17], [-111, -48], [-88, -27], [82, -27], [123, -58], [140, -22], [92, -1], [-91, -1]], '#314e54', colors[1], 2);
    line(c, -50, -9, 65, -172, colors[0], 5);
    for (const side of [-1, 1]) line(c, side * 91, -4, side * 103, -106, colors[0], 4);
    for (let i = 0; i < 3; i++) ring(c, 0, 10 + i * 6, 143 + Math.sin(t + i) * 9, 0.09, 0, colors[0]);
  } else if (kind === 'orrery' || kind === 'telescope') {
    limb(c, [-88, 0], [0, -129], 11, 6, '#36374d', colors[0]); limb(c, [88, 0], [0, -129], 11, 6, '#36374d', colors[0]);
    if (kind === 'orrery') {
      for (let i = 0; i < 4; i++) ring(c, 0, -166, 61 + i * 15, 0.4 + i * 0.13, t * 0.05 + i * 0.7, colors[i % 2], 2);
      oval(c, 0, -166, 22, 22, '#332c49', colors[1]);
    } else {
      limb(c, [-70, -122], [104, -237], 23, 34, '#444357', colors[1]);
      limb(c, [-45, -143], [80, -225], 18, 27, '#76738a', colors[1]);
      oval(c, 107, -239, 15, 34, '#202b3d', colors[1]);
      glow(c, 107, -239, 53, colors[1], 0.17);
    }
  } else {
    for (const side of [-1, 1]) {
      c.strokeStyle = colors[0]; c.lineWidth = 18; c.beginPath(); c.moveTo(side * 112, 0); c.bezierCurveTo(side * 18, -74, side * 170, -191, side * 30, -271); c.stroke();
      c.strokeStyle = colors[1]; c.lineWidth = 2; c.stroke();
    }
    if (kind === 'memory') {
      shape(c, [[-53, -30], [-53, -138], [0, -190], [53, -138], [53, -30]], '#543843', colors[1], 2);
      for (const x of [-24, 24]) { shape(c, [[x - 10, -81], [x - 10, -128], [x, -140], [x + 10, -128], [x + 10, -81]], '#d9b195'); glow(c, x, -107, 40, colors[1], 0.17); }
    } else {
      for (let i = 0; i < 6; i++) { const y = -40 - i * 33; ring(c, 0, y, 38 + Math.sin(t * 2.5 + i) * 4, 0.4, i * 0.17, colors[0], 5); }
      glow(c, 0, -135, 90, colors[1], 0.1 + Math.sin(t * 2.5) * 0.035);
    }
  }
  c.restore();
}

function ring(c, x, y, radius, squash, angle, color, width = 1) {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.strokeStyle = color; c.lineWidth = width; c.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = i * TAU / 64, px = Math.round(Math.cos(a) * radius), py = Math.round(Math.sin(a) * radius * squash);
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.stroke(); c.restore();
}

export function livingWorld(c, chapter, camera, time, settings, menu = false) {
  const t = settings.reducedMotion ? 8 : time;
  c.save();
  if (chapter === 0) {
    const center = 760 - (menu ? 85 : camera * 0.21 + 25);
    line(c, center, 257, center + Math.cos(t * 0.018 - 1.2) * 30, 257 + Math.sin(t * 0.018 - 1.2) * 30, '#a5a47f', 2);
    line(c, center, 257, center + Math.cos(t * 0.08) * 22, 257 + Math.sin(t * 0.08) * 22, '#cfb57b', 2);
    if (settings.particles) for (let i = 0; i < 6; i++) {
      const x = wrap(i * 229 - camera * 0.32, 1330) - 160, y = 284 + i % 3 * 32;
      for (let n = 0; n < 10; n++) {
        const age = wrap(t * 12 + n * 12 + i * 11, 130);
        c.globalAlpha = (1 - age / 130) * 0.045;
        oval(c, x - age * 0.6 + Math.sin(age * 0.04 + i) * 8, y - age, 7 + age * 0.18, 6 + age * 0.1, '#9ab3a1');
      }
    }
    c.globalAlpha = 0.65;
    for (let i = 0; i < 3; i++) {
      const x = wrap(i * 421 + 111 - camera * 0.36, 1380) - 170;
      c.save(); c.translate(x, 20); c.rotate(Math.sin(t * 0.8 + i) * 0.09);
      line(c, 0, 0, 0, 73, '#8e9477', 1);
      shape(c, [[-11, 93], [-8, 81], [-7, 73], [0, 68], [8, 75], [9, 83], [13, 93]], '#556250', '#919378');
      oval(c, 1, 93, 13, 3, '#162a2d', '#a4a07a'); line(c, 0, 87, Math.sin(t + i) * 5, 99, '#b8a87b', 2);
      c.restore();
    }
  } else if (chapter === 1) {
    for (let i = 0; i < 10; i++) {
      const x = wrap(i * 144 - camera * 0.28, 1340) - 150;
      const len = 92 + i % 4 * 43;
      let last = [x, -15];
      for (let s = 1; s < 9; s++) {
        const pos = [x + Math.sin(t * 0.55 + s * 0.35 + i) * s * 2.4, s * len / 8];
        limb(c, last, pos, 3 - s * 0.18, 2 - s * 0.12, '#344d36', '#70815b');
        if (s % 2) {
          const side = s % 4 === 1 ? -1 : 1;
          shape(c, [pos, [pos[0] + side * 16, pos[1] - 10], [pos[0] + side * 24, pos[1] - 6], [pos[0] + side * 14, pos[1] + 3]], '#617c50', '#93a575');
        }
        last = pos;
      }
      glow(c, last[0], last[1], 24, '#d0d59a', 0.08);
    }
    if (settings.particles) for (let i = 0; i < 30; i++) {
      const x = wrap(i * 111 + t * 11 + Math.sin(t + i) * 17 - camera * 0.18, 1060) - 50;
      const y = wrap(i * 78 + t * 9, 460), a = Math.sin(t * 1.5 + i);
      shape(c, [[x - 3, y], [x + a * 4, y - 3], [x + 4, y + 1], [x, y + 3]], i % 3 ? '#adbb7b' : '#d7bd95', null);
    }
  } else if (chapter === 2) {
    c.globalAlpha = 0.05;
    for (let i = 0; i < 6; i++) {
      const x = wrap(i * 224 - camera * 0.12, 1300) - 100, sway = Math.sin(t * 0.4 + i) * 55;
      shape(c, [[x, 30], [x + 19, 30], [x + 220 + sway, 490], [x + 75 + sway, 490]], '#b4e2d5', null);
    }
    c.globalAlpha = 0.36;
    for (let i = 0; i < 3; i++) {
      const x = wrap(i * 449 + 201 - camera * 0.35, 1340) - 80;
      rect(c, x, 174, 17, 315, '#497d80');
      for (let n = 0; n < 14; n++) rect(c, x + n % 4 * 4, 180 + wrap(t * 99 + n * 27, 290), 2, 13 + n % 3 * 5, '#9ec8bc');
    }
    c.globalAlpha = 0.7;
    for (let i = 0; i < 28; i++) {
      const x = wrap(i * 91 - camera * 0.1 + Math.sin(t + i) * 8, 960);
      line(c, x, 480 + i % 11 * 5, x + 15 + Math.sin(t * 2 + i) * 7, 480 + i % 11 * 5, '#689697', 1);
    }
    if (settings.particles) for (let i = 0; i < 15; i++) {
      const x = wrap(i * 163 + Math.sin(t * 0.5 + i) * 15 - camera * 0.2, 960);
      const y = 480 - wrap(t * 15 + i * 71, 420);
      c.globalAlpha = 0.17; ring(c, x, y, 2 + i % 3, 1, 0, '#b5d6c5');
    }
  } else if (chapter === 3) {
    const cx = 710 - camera * 0.07, cy = 225;
    glow(c, cx, cy, 155, '#b8a2d4', 0.18);
    for (let i = 0; i < 5; i++) {
      ring(c, cx, cy, 62 + i * 19, 0.5 + i * 0.08, t * (i % 2 ? -0.04 : 0.05) + i * 0.75, i % 2 ? '#887f98' : '#b0a087', i % 2 ? 1 : 2);
      const a = t * (0.12 + i * 0.015) + i * 1.8;
      const x = cx + Math.cos(a) * (62 + i * 19), y = cy + Math.sin(a) * (45 + i * 10);
      oval(c, x, y, 4 + i % 2 * 3, 4 + i % 2 * 3, '#cfc3c9', '#7a7190');
    }
    oval(c, cx, cy, 23, 23, '#32304e', '#baabc2');
    shape(c, [[cx - 13, cy], [cx, cy - 8], [cx + 13, cy], [cx, cy + 8]], '#cfc2d8', '#847591');
    oval(c, cx, cy, 4, 8, '#725a8c');
    for (let i = 0; i < 9; i++) {
      const x = wrap(i * 151 - camera * 0.36, 1300) - 130, y = 320 + i % 3 * 34 + Math.sin(t * 0.6 + i) * 9;
      shape(c, [[x - 25, y], [x + 25, y - 5], [x + 17, y + 12], [x + 3, y + 35], [x - 13, y + 13]], '#42415b', '#828292');
      line(c, x - 21, y, x + 20, y - 4, '#a09c9f', 2);
      for (let j = 0; j < 3; j++) rect(c, x + j * 8 - 8, y + j * 5, 3, 2, '#8c819a');
    }
    if (settings.particles) {
      const phase = wrap(t, 12);
      if (phase < 1.8) { const x = 950 - phase * 310, y = 50 + phase * 100; line(c, x, y, x + 65, y - 23, '#bdacc5', 2); glow(c, x, y, 15, '#e0cfea', 0.3); }
    }
  } else {
    const beat = 0.5 + Math.sin(t * 2.8) * 0.5;
    glow(c, 630 - camera * 0.03, 275, 255, '#bd7a7b', 0.16 + beat * 0.09);
    for (let i = 0; i < 7; i++) {
      const x = wrap(i * 234 - camera * 0.3, 1460) - 230, stretch = Math.sin(t * 2.8 + i * 0.3) * 5;
      for (const side of [-1, 1]) {
        shape(c, [[x + 90, 510], [x + 90 + side * 22, 330], [x + 90 + side * (79 + stretch), 170], [x + 90 + side * 51, 52], [x + 90 + side * 19, -15], [x + 90 + side * 73, 49], [x + 90 + side * (107 + stretch), 169], [x + 90 + side * 41, 338], [x + 104, 510]], '#503942', '#95726d', 2);
        for (let n = 0; n < 7; n++) {
          const y = 118 + n * 42;
          line(c, x + 90 + side * (82 - n * 7), y, x + 90 + side * (107 - n * 10), y - 9, '#765454', 2);
        }
      }
      const pulseY = 440 - wrap(t * 52 + i * 40, 380);
      glow(c, x + 86, pulseY, 18, '#e4a191', 0.28);
    }
    for (let i = 0; i < 7; i++) {
      const x = 530 + Math.sin(i * 2.4) * 127 - camera * 0.06, y = 270 + Math.cos(i * 1.9) * 100;
      line(c, 570 - camera * 0.06, 300, x + beat * 5, y, '#7e555f', 3);
      oval(c, x + beat * 5, y, 7 + beat, 11 + beat, '#8e636e', '#b4837d');
    }
  }
  c.globalAlpha = 0.06;
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * 329 + t * (6 + i) - camera * 0.1, 1350) - 200;
    oval(c, x, 350 + i * 31, 160, 14 + i * 3, ['#a7b9a7', '#bec593', '#a1d4d5', '#b3a4c3', '#c69a98'][chapter]);
  }
  c.restore();
}
