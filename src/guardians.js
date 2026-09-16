import { line, oval, glow, rect, surface } from './art.js';

const paths = new Map();
const INK = '#16232b', GOLD = '#d5be8a', TAU = Math.PI * 2;
let grain;

function form(c, data, fill, edge = null, width = 1.2) {
  if (!paths.has(data)) paths.set(data, new Path2D(data));
  const path = paths.get(data);
  c.fillStyle = fill; c.fill(path);
  if (edge) {
    if (!grain) {
      const tile = surface(64, 64), brush = tile.getContext('2d');
      for (let i = 0; i < 180; i++) rect(brush, i * 29 % 64, i * 47 % 61, i % 5 === 0 ? 3 : 1, 1, i % 2 ? '#e9dfb52e' : '#101b3038');
      grain = c.createPattern(tile, 'repeat');
    }
    c.save(); c.clip(path);
    const shade = c.createLinearGradient(-35, -145, 48, -15);
    shade.addColorStop(0, '#fff0c421'); shade.addColorStop(0.45, 'transparent'); shade.addColorStop(1, '#0c182e45');
    c.fillStyle = shade; c.fillRect(-180, -195, 360, 220);
    c.fillStyle = grain; c.fillRect(-180, -195, 360, 220);
    c.restore();
    c.strokeStyle = edge; c.lineWidth = width * 0.85; c.lineJoin = 'round'; c.stroke(path);
  }
}

function thread(c, a, bend, b, color, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
  c.beginPath(); c.moveTo(...a); c.quadraticCurveTo(...bend, ...b); c.stroke();
}

function sinew(c, a, bend, b, start, end, color, rim) {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(angle), ny = Math.cos(angle);
  c.beginPath(); c.moveTo(a[0] + nx * start, a[1] + ny * start);
  c.quadraticCurveTo(bend[0] + nx * start, bend[1] + ny * start, b[0] + nx * end, b[1] + ny * end);
  c.quadraticCurveTo(b[0] + Math.cos(angle) * end, b[1] + Math.sin(angle) * end, b[0] - nx * end, b[1] - ny * end);
  c.quadraticCurveTo(bend[0] - nx * start, bend[1] - ny * start, a[0] - nx * start, a[1] - ny * start);
  c.closePath(); c.fillStyle = color; c.fill();
  if (rim) thread(c, [a[0] + nx * start * 0.6, a[1] + ny * start * 0.6], bend, b, rim);
}

function eye(c, x, y, size, color, open = 1) {
  c.save(); c.translate(x, y); c.scale(size, size * open);
  form(c, 'M-1 0 Q0-1.1 1 0 Q0 1.1-1 0Z', color, '#48534e', 0.1);
  c.fillStyle = '#273239'; c.beginPath(); c.ellipse(0, 0, 0.3, 0.62, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff3d0'; c.beginPath(); c.ellipse(-0.13, -0.18, 0.12, 0.16, 0, 0, TAU); c.fill();
  c.restore();
}

function lamp(c, x, y, t) {
  c.save(); c.translate(x, y);
  form(c, 'M-7-7 Q-7-12 0-14 Q7-12 7-7 L8 7 Q0 15-8 7Z', '#5a6252', GOLD);
  form(c, 'M-4-6 Q0-10 4-6 L4 6 Q0 9-4 6Z', '#edc376');
  thread(c, [0, -5], [-4, 3], [1, 6], '#fff0bc', 2);
  glow(c, 0, 0, 38 + Math.sin(t * 4) * 2, '#edba76', 0.25);
  c.restore();
}

function warden(c, p) {
  const { t, mutated, wind, slash, walk } = p;
  if (mutated) for (const side of [-1, 1]) {
    c.save(); c.scale(side, 1); c.rotate(Math.sin(t * 2) * 0.025);
    form(c, 'M12-91 C32-108 33-143 67-152 Q52-124 58-117 Q87-140 96-139 Q76-106 84-93 Q105-99 110-90 C82-54 51-48 18-52Z', '#806546', '#bd985f');
    form(c, 'M18-83 Q42-114 61-139 Q46-108 49-86 Q67-104 85-117 Q67-85 84-81 Q54-56 19-61Z', '#d5a965');
    for (let i = 0; i < 7; i++) thread(c, [19, -68 - i * 3], [49 + i * 4, -76 - i * 6], [65 + i * 5, -142 + i * 8], i % 2 ? '#f2d493' : '#775c43', 1.5);
    c.restore();
  }
  for (const side of [-1, 1]) {
    sinew(c, [side * 13, -48], [side * 19 + walk * side, -27], [side * 19 + walk * side * 0.5, -5], 9, 6, '#455d5b', '#a1b0a1');
    c.save(); c.translate(side * 18 + walk * side * 0.5, 0);
    form(c, 'M-8-12 Q1-14 7-10 Q10-5 16-3 Q19 2 9 2 L-10 1Z', '#6d8274', '#b5b995');
    c.restore();
  }
  form(c, 'M-22-98 C-37-90-37-70-31-49 Q-31-28-42-15 Q-25-8-9-19 Q1-8 17-13 Q30-16 31-24 L24-74 Q29-96 9-101Z', '#293f43', INK, 2);
  for (const x of [-24, -13, 5, 16]) thread(c, [x, -70], [x + 5, -35], [x - 6, -19], '#516963', 2);
  form(c, 'M-26-96 Q-18-108-8-101 Q1-96 10-101 Q28-102 32-83 C31-68 23-51 16-43 Q0-36-17-45 C-27-59-34-81-26-96Z', '#718777', INK, 2);
  form(c, 'M-25-91 Q-14-99-6-94 C-16-79-16-55-7-45 Q-25-47-30-76Z', '#94a48a');
  form(c, 'M16-98 Q37-91 28-70 Q22-54 14-44 Q16-76 9-90Z', '#425e5b');
  form(c, 'M-11-88 Q0-98 12-86 C21-72 11-55 0-52 C-12-57-19-73-11-88Z', '#283b3c', '#c4a66e', 2);
  form(c, 'M-8-65 Q-11-80-3-85 Q-2-76 2-80 L7-89 Q14-77 7-63 Q0-56-8-65Z', '#e3ad64');
  for (const x of [-8, -2, 4, 10]) thread(c, [x, -87], [x + 5, -70], [x - 1, -58], '#668077', 3);
  thread(c, [-25, -91], [0, -108], [27, -88], '#e0c793', 2);
  thread(c, [-19, -50], [0, -40], [18, -50], GOLD, 2);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI / 8;
    oval(c, Math.cos(a) * 24, -74 + Math.sin(a) * 27, 1.2, 1.2, '#d2c797');
  }
  for (const side of [-1, 1]) {
    c.save(); c.scale(side, 1);
    form(c, 'M16-93 C22-107 40-103 44-90 Q49-79 32-74 Q21-76 16-93Z', '#8a9b80', '#c7bd8d');
    thread(c, [23, -97], [36, -99], [42, -86], '#e4d4a4', 2);
    c.restore();
  }
  const left = [-34, -48 + Math.sin(t * 2) * 2];
  sinew(c, [-31, -84], [-48, -66], left, 8, 5, '#61796b', '#b6c2a0');
  thread(c, left, [-39, -38], [-34, -26], GOLD, 2); lamp(c, -34, -18, t);
  form(c, 'M-14-101 C-18-113-15-128-4-133 Q7-138 16-125 L19-105 Q6-96-14-101Z', '#768a78', '#cfc497', 1.5);
  form(c, 'M-9-122 Q2-128 12-122 L11-105 Q0-101-9-107Z', '#243d40');
  for (let i = 0; i < 4; i++) thread(c, [-7 + i * 5, -122], [-5 + i * 5, -113], [-6 + i * 5, -106], mutated ? '#f6d095' : '#d8bb80', 2);
  form(c, 'M-17-121 Q-16-135-10-144 L-7-132 Q1-135 3-148 L7-133 L17-141 L15-126Z', '#a2ac8c', '#d7c28d');
  if (mutated) { glow(c, 1, -116, 42, '#eaba7b', 0.3); thread(c, [0, -130], [-14, -146], [3, -165], '#f4d8a1', 4); }
  const hand = [wind ? 35 : 40 + slash * 17, wind ? -108 : -63 - slash * 15];
  sinew(c, [32, -88], [48, -84 - slash * 10], hand, 9, 5, '#637f71', '#c5cfa9');
  for (let i = 0; i < 3; i++) thread(c, [hand[0] - 3, hand[1] - 4 + i * 3], [hand[0] + 3, hand[1] - 5 + i * 3], [hand[0] + 4, hand[1] - 1 + i * 3], '#c4ba8e');
  c.save(); c.translate(...hand); c.rotate(wind ? -1.5 : -0.75 + slash * 1.5);
  form(c, 'M-18-3 L47-3 L47 3 L-18 3 Q-23 0-18-3Z', '#90724e', GOLD);
  form(c, 'M31-20 Q51-35 68-22 C88-11 82 17 56 24 L47 14 Q63 9 60-7 L32-5Z', '#a3b7a5', '#ecddb4', 1.5);
  form(c, 'M60-23 Q81-18 79-1 Q74 17 57 22 L56 17 Q73 7 69-9Z', '#d9dfbb');
  for (let i = 0; i < 5; i++) thread(c, [40 + i * 5, -15], [43 + i * 5, -9], [39 + i * 5, -7], '#607f78');
  c.restore();
}

function widow(c, p) {
  const { t, mutated, gathering, slash, beat } = p;
  for (const side of [-1, 1]) for (let i = 3; i >= 0; i--) {
    const flex = Math.sin(t * 3 + i) * 3, hit = i === beat % 3 ? slash * 15 : 0;
    const hip = [side * 19, -43 - i * 6], knee = [side * (47 + i * 10 + hit), -85 + i * 14 - gathering * 10];
    const foot = [side * (49 + i * 14 + hit), -2 + flex];
    sinew(c, hip, [side * 34, -87 + i * 13], knee, 6, 3.5, '#526b4b', '#b3bd86');
    sinew(c, knee, [foot[0] - side * 12, -24], foot, 3.7, 0.6, '#7f9061', '#d2d4a0');
    for (let n = 1; n <= 3; n++) { const f = n / 4, x = knee[0] * (1 - f) + foot[0] * f, y = knee[1] * (1 - f) + foot[1] * f; thread(c, [x, y], [x + side * 9, y - 1], [x + side * 9, y - 9], '#b0be8a', 1.5); }
  }
  form(c, 'M-33-67 C-64-61-62-26-35-17 Q0 2 34-18 C64-37 55-68 30-72 Q0-85-33-67Z', '#4b634c', '#273d33', 2);
  form(c, 'M-31-66 C-53-57-55-32-32-25 Q-7-12 16-21 C-8-29 5-62-2-73Z', '#7a8d60');
  for (let i = -3; i <= 3; i++) thread(c, [i * 8, -69], [i * 17, -46], [i * 10, -20], i % 2 ? '#a8b181' : '#3f5d49', 1.5);
  form(c, 'M-14-93 Q-4-106 12-95 C23-81 12-68 17-52 Q20-40 31-33 C12-17-15-23-30-34 Q-13-53-18-70Z', '#81917a', '#314c3e', 1.5);
  form(c, 'M-12-88 Q-8-76-15-51 L-24-34 Q-6-31 0-46 Q5-75-4-94Z', '#b2b69a');
  for (let i = -2; i <= 2; i++) thread(c, [i * 4, -65], [i * 7 + Math.sin(t + i) * 3, -44], [i * 11, -31], '#d5d0ac');
  form(c, 'M-11-112 C-12-130 10-133 13-114 Q12-98 1-94 Q-10-98-11-112Z', '#d1c5a1', '#68785e');
  if (!mutated) {
    form(c, 'M-15-111 C-23-125-12-138 0-140 C18-139 20-119 17-105 Q13-85 31-56 C15-61 8-74 10-101 Q3-96-10-101 Q-15-83-34-70 C-26-92-21-94-15-111Z', '#8fa28eaa', '#bbc4a1');
    thread(c, [-17, -121], [-18, -96], [-29, -77], '#e1dabb', 1.5);
    thread(c, [15, -120], [11, -79], [26, -60], '#d6d8b5', 1.5);
    for (let i = 0; i < 8; i++) {
      const y = -118 + i * 6;
      oval(c, -17 - i * 1.2, y, 1, 1, '#e0ddba');
      oval(c, 14 + i * 0.7, y + 6, 1, 1, '#d0d2ac');
    }
    line(c, -6, -113, 7, -112, '#3f4d40', 2);
    for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; oval(c, Math.cos(a) * 14, -121 + Math.sin(a) * 12, 3.5, 3, '#c9c5a0'); }
  } else {
    for (let i = 0; i < 9; i++) {
      c.save(); c.translate(0, -112); c.rotate(i * TAU / 9 + Math.sin(t) * 0.04);
      form(c, 'M-6-5 C-25-16-19-43-3-51 Q5-30 14-26 Q19-9 5 2Z', i % 2 ? '#a7b680' : '#c9c99a', '#718759');
      thread(c, [0, -3], [-10, -25], [-3, -43], '#e5dfb1'); c.restore();
    }
    oval(c, 0, -112, 12, 16, '#3b5747', '#d9d3a4'); eye(c, 0, -114, 10, '#e5d9a8');
    for (const side of [-1, 1]) sinew(c, [side * 8, -98], [side * 24, -84], [side * 14, -61], 4, 0.5, '#a7b987', '#d5dbb0');
  }
  for (const side of [-1, 1]) {
    sinew(c, [side * 13, -88], [side * (29 + gathering * 10), -73], [side * (15 + slash * 22), -52], 5, 2, '#9ca986', '#d6d4ac');
  }
  form(c, 'M-15-49 Q0-59 16-49 L12-40 Q0-34-12-40Z', '#283e33', '#b6b38e');
}

function cantor(c, p) {
  const { t, mutated, gathering } = p;
  if (mutated) {
    form(c, 'M-37-76 C-82-111-48-167 0-169 C52-170 79-107 39-75 L28-94 C57-130 30-150 0-150 C-31-152-58-124-27-93Z', '#58868a', '#b9cbb0', 2);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + i * Math.PI / 8, x = Math.cos(a) * 51, y = -99 + Math.sin(a) * 58;
      oval(c, x, y, 6, 10, '#b9cdb5'); oval(c, x, y + 3, 2.5, 4 + Math.sin(t * 3 + i), '#30535e');
      thread(c, [x - 3, y - 2], [x, y - 4], [x + 3, y - 2], '#5d7f7c');
    }
  }
  form(c, 'M-17-109 C-33-124-49-118-52-95 L-44-36 L44-36 L52-95 C48-119 33-124 17-109Z', '#3c6875', '#789d91', 2);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = side * (28 + i * 6); thread(c, [x, -107 + i * 3], [x + side * 2, -86], [x - side * 5, -58], '#a0b8a0', 3);
    oval(c, x, -108 + i * 3, 2, 3, '#163c49');
  }
  form(c, 'M-17-105 C-30-108-34-89-30-64 C-26-35-42-16-43-5 Q-27 4-14-2 Q0 8 12-1 Q32 8 45-5 C43-31 28-42 30-70 C34-91 24-109 12-106Z', '#365e6b', '#173843', 2);
  form(c, 'M-16-99 Q-26-88-16-57 Q-18-25-32-8 Q-13-9-7-20 L2-101Z', '#648c85');
  form(c, 'M14-101 C34-84 15-69 20-41 Q23-17 34-6 L14-6 Q3-37 8-68Z', '#214955');
  form(c, 'M-8-104 Q0-111 9-104 L12-25 Q14-11 21-6 Q0 3-21-6 Q-12-25-11-60Z', '#91a694', '#d2c49d');
  for (let i = 0; i < 8; i++) {
    const y = -91 + i * 10;
    thread(c, [-7, y], [0, y + 9], [7, y], '#c9c29a', 1.5);
    oval(c, 0, y + 2, 1, 2, '#466967');
  }
  form(c, 'M-14-107 C-23-124-12-140 0-151 Q20-137 18-115 Q16-102 6-99 L-8-100Z', '#6e9d94', '#d4cea6');
  form(c, 'M-8-125 Q1-137 11-123 L8-107 Q1-100-6-109Z', '#b9c8ad');
  oval(c, 2, -113, 4, mutated ? 8 : 5, '#264753');
  thread(c, [-5, -124], [2, -127], [9, -123], '#4b716c', 2);
  for (const side of [-1, 1]) thread(c, [side * 12, -126], [side * 17, -108], [side * 20, -94], '#d7cda7', 2);
  sinew(c, [-23, -89], [-50, -77 - gathering * 17], [-49, -58 - gathering * 26], 10, 4, '#6b9589', '#c1ceb0');
  sinew(c, [23, -90], [44, -84], [45, -62 - gathering * 15], 10, 4, '#6b9589', '#c1ceb0');
  thread(c, [46, -3], [41, -67], [48, -134], '#c0c4a0', 3);
  c.save(); c.translate(48, -137);
  form(c, 'M-12 5 C-10-3-12-12 0-19 C12-12 10-3 12 5 Q0 13-12 5Z', '#729a90', '#dbd0a6');
  oval(c, 0, 5, 9, 3, '#2d525b'); c.restore();
  if (mutated) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) sinew(c, [side * (12 + i * 7), -24], [side * (30 + i * 6), -8], [side * (41 + i * 10) + Math.sin(t * 2 + i) * 3, -1], 4, 0.5, '#729b8e', '#c0cdb1');
}

function astronomer(c, p) {
  const { t, mutated, gathering } = p;
  c.save(); c.translate(0, Math.sin(t * 2) * 2 - 3);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const hand = [side * (48 + i * 8), -118 + i * 32 - gathering * 14];
    sinew(c, [side * 16, -93 + i * 10], [side * (47 + i * 6), -75 + i * 10], hand, 4.5, 1.8, '#827d96', '#d5c6b4');
    for (let j = 0; j < 3; j++) thread(c, hand, [hand[0] + side * (4 + j * 2), hand[1] - 7 + j * 3], [hand[0] + side * 7, hand[1] - 13 + j * 6], '#d0c0ac', 1.3);
  }
  form(c, 'M-16-112 C-43-103-35-84-29-64 C-18-43-41-28-43-5 Q-20 6 0-5 Q20 4 39-7 C15-30 33-48 27-73 Q42-105 16-112Z', '#595270', '#252f46', 2);
  form(c, 'M-15-105 Q-36-83-20-56 C-13-37-26-25-33-8 Q-12-10-7-28 Q2-65-3-100Z', '#8b8095');
  form(c, 'M15-97 C38-67 8-49 19-24 L30-9 Q8-2 2-19 Q-1-58 15-97Z', '#343953');
  for (let i = 0; i < 4; i++) thread(c, [-18 + i * 9, -50], [-21 + i * 9, -29], [-29 + i * 17, -9], '#a69aad');
  oval(c, 0, -82, 25, 28, '#343b53', '#c5b08b');
  for (let i = 0; i < 3; i++) {
    c.strokeStyle = i % 2 ? '#c5b39d' : '#a8a5bc'; c.lineWidth = 1.3;
    c.beginPath(); c.ellipse(0, -82, 23, 12 + i * 7, t * 0.2 + i, 0, TAU); c.stroke();
  }
  eye(c, 0, -82, mutated ? 17 : 9, '#d4c4dc', mutated ? 1 : 0.85);
  form(c, 'M-13-110 C-20-124-13-145 0-151 C17-141 22-125 12-106 Q0-100-13-110Z', '#777088', '#cfbbcf');
  form(c, 'M-8-132 Q2-136 11-128 L8-113 Q0-106-6-114Z', '#beb6bb');
  thread(c, [-12, -125], [0, -132], [15, -119], '#e3d4c0', 5);
  thread(c, [-12, -121], [0, -127], [14, -116], '#786f8b', 1.2);
  for (const side of [-1, 1]) thread(c, [side * 8, -140], [side * 26, -150], [side * 19, -160], '#cdb996', 2);
  if (mutated) for (let i = 0; i < 7; i++) {
    const a = t * 0.45 + i * TAU / 7, x = Math.cos(a) * 64, y = -86 + Math.sin(a) * 65;
    thread(c, [0, -82], [x * 0.4, y - 12], [x, y], '#8f83a4', 0.7);
    eye(c, x, y, 8, '#d5bfe0'); glow(c, x, y, 13, '#c3acd9', 0.13);
  }
  c.restore();
}

function heart(c, p) {
  const { t, mutated, gathering } = p;
  const pulse = 1 + Math.sin(t * 4) * 0.022 + gathering * 0.035;
  c.save(); c.translate(0, -77); c.scale(pulse, pulse); c.translate(0, 77);
  for (const side of [-1, 1]) {
    c.save(); c.scale(side, 1);
    form(c, mutated ? 'M12-100 C32-115 37-151 73-155 Q47-132 71-116 Q83-131 96-120 Q74-100 105-81 Q71-87 98-48 Q58-63 79-18 C35-36 21-54 12-68Z' : 'M14-97 Q36-122 68-130 C48-108 78-88 79-59 Q56-76 70-35 C39-44 26-64 13-68Z', '#8c6575', '#c7968c');
    form(c, 'M20-95 Q40-115 57-120 Q40-100 63-73 Q47-79 57-53 Q34-64 20-76Z', '#b58188');
    for (let i = 0; i < (mutated ? 6 : 3); i++) thread(c, [16, -85 + i * 3], [38 + i * 7, -83 - i * 6], [63 + i * 5, -135 + i * 18], '#e0b09b', 1.1);
    c.restore();
  }
  for (const side of [-1, 1]) sinew(c, [side * 12, -42], [side * 36, -14], [side * 43, 0], 7, 1.5, '#9f7d82', '#d3afa1');
  form(c, 'M0-111 C-22-143-49-117-42-89 C-38-62-10-35 5-24 C16-45 45-70 44-101 C43-130 16-135 0-111Z', '#a36679', '#e0ad9c', 1.8);
  form(c, 'M-4-108 C-20-126-40-112-35-91 Q-30-67-8-46 C-14-70 8-82-4-108Z', '#ca8d93');
  form(c, 'M10-115 C31-129 45-109 37-89 Q24-61 5-35 C4-53 24-76 18-90Z', '#724d66');
  for (let i = 0; i < 5; i++) {
    thread(c, [-5, -109 + i * 12], [-26, -99 + i * 10], [-28 + i * 4, -89 + i * 11], '#f0b8a4', 1.1);
    thread(c, [6, -109 + i * 12], [27, -102 + i * 10], [27 - i * 3, -91 + i * 10], '#ba8090', 1.5);
    thread(c, [-20 + i * 2, -96 + i * 10], [-29 + i * 3, -98 + i * 10], [-32 + i * 3, -93 + i * 10], '#965972');
    thread(c, [24 - i * 2, -95 + i * 10], [30 - i * 2, -89 + i * 10], [27 - i * 2, -85 + i * 10], '#dca79e');
  }
  sinew(c, [-15, -112], [-26, -135], [-10, -155], 7, 4, '#b68390', '#edbda7');
  sinew(c, [4, -111], [-1, -145], [18, -150], 8, 5, '#bc8c92', '#e4b9a3');
  sinew(c, [22, -113], [40, -139], [38, -145], 6, 3, '#8f687d', '#d8a79f');
  for (const [x, y] of [[-10, -155], [18, -150], [38, -145]]) oval(c, x, y, 5, 2.5, '#493b50', '#d6a99c');
  if (mutated) {
    form(c, 'M-6-111 C15-119 25-93 12-61 L2-47 C-8-66-18-93-6-111Z', '#edbd9f', '#f4d7b4', 1.5);
    form(c, 'M-7-70 L-7-88 L-3-95 L1-88 L1-76 L4-76 L4-99 L9-108 L14-99 L14-70Z', '#72556a');
    for (const x of [-3, 7, 11]) line(c, x, -84, x, -77, '#f6dab0');
    glow(c, 4, -86, 53, '#f2bc9e', 0.2);
  } else {
    thread(c, [0, -106], [-10, -82], [4, -51], '#5c465c', 2);
    for (let i = 0; i < 7; i++) thread(c, [-8, -105 + i * 7], [-3, -97 + i * 7], [5, -101 + i * 7], '#e4b7a1', 1.5);
  }
  c.restore();
}

export function drawGuardian(c, enemy, pose) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (enemy.kind === 'warden') warden(c, pose);
  else if (enemy.kind === 'widow') widow(c, pose);
  else if (enemy.kind === 'cantor') cantor(c, pose);
  else if (enemy.kind === 'astronomer') astronomer(c, pose);
  else heart(c, pose);
  if (enemy.flash > 0) {
    glow(c, 0, -85, 55, '#ffeac5', 0.16);
    for (let i = 0; i < 5; i++) rect(c, -11 + i * 5, -93 + i * 6, 2, 2, '#fff3d2');
  }
  c.restore();
}
