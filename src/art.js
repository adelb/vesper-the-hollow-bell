export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export function polygon(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y))); c.closePath(); c.fill(); }
export function line(c, x1, y1, x2, y2, color, width = 1) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(Math.round(x1), Math.round(y1)); c.lineTo(Math.round(x2), Math.round(y2)); c.stroke(); }
export function glow(c, x, y, r, color, strength = 0.3) {
  c.save(); c.globalAlpha *= strength;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
export function surface(w, h) { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; }
export function shape(c, points, color, outline = '#101a20', width = 1) {
  polygon(c, points, color);
  if (outline) { c.strokeStyle = outline; c.lineWidth = width; c.lineJoin = 'bevel'; c.stroke(); }
}
export function oval(c, x, y, rx, ry, color, outline = null) {
  const points = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; points.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
  shape(c, points, color, outline);
}
export function limb(c, a, b, top, bottom, color, highlight = null) {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  shape(c, [[a[0] + dx * top, a[1] + dy * top], [b[0] + dx * bottom, b[1] + dy * bottom], [b[0] - dx * bottom, b[1] - dy * bottom], [a[0] - dx * top, a[1] - dy * top]], color);
  if (highlight) line(c, a[0] + dx * top, a[1] + dy * top, b[0] + dx * bottom, b[1] + dy * bottom, highlight);
}
