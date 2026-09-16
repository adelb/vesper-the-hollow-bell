export const ATTACKS = {
  fencing: { name: 'Watchman\'s Riposte', kind: 'combo', windup: 0.8, duration: 0.85, recovery: 1.1, beats: [0, 0.48], reach: 68, speed: 125, damage: 16, parryable: true },
  censer: { name: 'Censer Pendulum', kind: 'volley', windup: 1, duration: 0.55, recovery: 1.3, beats: [0], count: 1, speed: 210, returning: 0.75, visual: 'censer', damage: 18, parryable: true },
  tombfall: { name: 'Grave Procession', kind: 'zones', windup: 1.15, duration: 0.65, recovery: 1.4, count: 3, spacing: 76, radius: 24, height: 85, interval: 0.2, visual: 'stone', damage: 23, parryable: false },
  maul: { name: 'Briar Frenzy', kind: 'combo', windup: 0.85, duration: 1, recovery: 1.2, beats: [0, 0.32, 0.7], reach: 43, speed: 170, damage: 14, parryable: true },
  seedburst: { name: 'Sleeping Seeds', kind: 'volley', windup: 1.05, duration: 0.65, recovery: 1.4, beats: [0], count: 3, spread: 0.36, speed: 180, gravity: 170, planting: true, visual: 'seed', damage: 15, parryable: false },
  rootmarch: { name: 'Rootbound Advance', kind: 'zones', windup: 1.15, duration: 0.7, recovery: 1.3, count: 3, spacing: 85, radius: 26, height: 100, interval: 0.22, visual: 'roots', damage: 22, parryable: false },
  undertowcut: { name: 'Retreating Tide', kind: 'combo', windup: 0.95, duration: 0.9, recovery: 1.15, beats: [0, 0.5], reach: 77, speed: 190, backstep: 48, damage: 17, parryable: true },
  knell: { name: 'Three Small Funerals', kind: 'volley', windup: 0.95, duration: 1.1, recovery: 1.35, beats: [0, 0.38, 0.76], count: 1, speed: 185, visual: 'note', damage: 15, parryable: true },
  anchor: { name: 'The Ferryman\'s Hook', kind: 'volley', windup: 1.1, duration: 0.65, recovery: 1.5, beats: [0], count: 1, speed: 250, returning: 0.9, visual: 'anchor', damage: 23, parryable: true },
  riftcut: { name: 'Through the Looking Glass', kind: 'combo', windup: 1.1, duration: 0.9, recovery: 1.3, beats: [0, 0.5], reach: 60, speed: 100, teleport: true, damage: 18, parryable: true },
  satellites: { name: 'Borrowed Moons', kind: 'orbit', windup: 1.1, duration: 1.3, recovery: 1.4, count: 3, speed: 175, radius: 36, interval: 0.24, visual: 'eye', damage: 17, parryable: false },
  prism: { name: 'Prismatic Refraction', kind: 'beam', windup: 1.35, duration: 0.55, recovery: 1.5, angles: [0], range: 440, width: 13, interval: 0, visual: 'glass', damage: 24, parryable: false },
  lament: { name: 'Hands That Cannot Hold', kind: 'combo', windup: 0.95, duration: 1.05, recovery: 1.25, beats: [0, 0.55], reach: 84, speed: 145, damage: 18, parryable: true },
  marrowfan: { name: 'Forked Memory', kind: 'volley', windup: 1.2, duration: 0.75, recovery: 1.45, beats: [0], count: 2, spread: 0.5, speed: 130, split: 3, visual: 'shard', damage: 17, parryable: false },
  pulsecharge: { name: 'The Borrowed Pulse', kind: 'combo', windup: 1.15, duration: 1.1, recovery: 1.4, beats: [0, 0.65], reach: 57, speed: 245, shock: true, damage: 24, parryable: true },
  execution: { name: 'The Warden\'s Judgement', kind: 'combo', windup: 1.05, duration: 1.55, recovery: 1.5, beats: [0, 0.5, 1.1], reach: 128, speed: 100, damage: 25, parryable: true },
  chainhook: { name: 'Chain of Office', kind: 'volley', windup: 1.15, duration: 0.7, recovery: 1.6, beats: [0], count: 1, speed: 335, returning: 0.95, visual: 'cleaver', damage: 26, parryable: true },
  cinderstorm: { name: 'Furnace Benediction', kind: 'zones', windup: 1.45, duration: 1.1, recovery: 1.65, count: 6, spacing: 115, radius: 31, height: 120, interval: 0.18, alternating: true, visual: 'cinder', damage: 27, parryable: false },
  thornballet: { name: 'The Widow\'s Embrace', kind: 'combo', windup: 1.05, duration: 1.5, recovery: 1.6, beats: [0, 0.55, 1.08], reach: 135, speed: 70, damage: 24, parryable: true },
  seedcrown: { name: 'A Crown of Unborn Spring', kind: 'orbit', windup: 1.3, duration: 1.55, recovery: 1.55, count: 5, speed: 180, radius: 54, interval: 0.2, visual: 'seed', damage: 21, parryable: false },
  briarweave: { name: 'The Garden Closes', kind: 'zones', windup: 1.45, duration: 1.1, recovery: 1.65, count: 6, spacing: 110, radius: 29, height: 105, interval: 0.19, alternating: true, visual: 'roots', damage: 26, parryable: false },
  antiphon: { name: 'Answer the Congregation', kind: 'volley', windup: 1.2, duration: 1.35, recovery: 1.6, beats: [0, 0.45, 0.9], count: 3, spread: 0.2, speed: 215, visual: 'note', damage: 20, parryable: true },
  procession: { name: 'The Blackwater Procession', kind: 'waves', windup: 1.25, duration: 1.45, recovery: 1.65, beats: [0, 0.5, 1], speed: 230, visual: 'tide', damage: 23, parryable: false },
  requiem: { name: 'A Requiem Without Breath', kind: 'beam', windup: 1.55, duration: 1, recovery: 1.7, angles: [-0.16, 0.16], range: 680, width: 16, interval: 0.5, visual: 'choir', damage: 25, parryable: false },
  starcross: { name: 'The Meridian Opens', kind: 'beam', windup: 1.6, duration: 1.2, recovery: 1.7, angles: [-0.25, 0, 0.25], range: 690, width: 12, interval: 0.32, visual: 'glass', damage: 24, parryable: false },
  eventhorizon: { name: 'All Eyes Turn Inward', kind: 'orbit', windup: 1.5, duration: 2, recovery: 1.7, count: 7, speed: 195, radius: 69, interval: 0.18, curve: 0.3, visual: 'eye', damage: 21, parryable: false },
  starfall: { name: 'A Heaven Out of Place', kind: 'zones', windup: 1.5, duration: 1.15, recovery: 1.7, count: 6, spacing: 115, radius: 28, height: 160, interval: 0.2, alternating: true, visual: 'glass', damage: 26, parryable: false },
  systole: { name: 'The City Takes a Breath', kind: 'waves', windup: 1.3, duration: 1.55, recovery: 1.6, beats: [0, 0.55, 1.1], speed: 245, visual: 'pulse', damage: 24, parryable: false },
  artery: { name: 'Threads of the Living City', kind: 'beam', windup: 1.55, duration: 1, recovery: 1.65, angles: [-0.19, 0.19], range: 650, width: 18, interval: 0.45, visual: 'heart', damage: 26, parryable: false },
  lastlight: { name: 'Everything We Could Not Keep', kind: 'volley', windup: 1.5, duration: 1.2, recovery: 1.7, beats: [0, 0.55], count: 3, spread: 0.38, speed: 135, split: 2, curve: -0.17, visual: 'heart', damage: 22, parryable: false },
  coronation: { name: 'Coronation of the Unmade', kind: 'zones', windup: 1.55, duration: 1.15, recovery: 1.8, count: 6, spacing: 110, radius: 32, height: 130, interval: 0.21, alternating: true, visual: 'heart', damage: 27, parryable: false },
};

const violet = new Set(['leap', 'meteor', 'nova', 'roots', 'tidal', 'eclipse', 'rapture']);
export const parryableAttack = pattern => ATTACKS[pattern] ? ATTACKS[pattern].parryable : !violet.has(pattern);
export const attackColor = pattern => parryableAttack(pattern) ? '#efbb78' : '#c2a4ec';

export function beamHits(box, beam) {
  const half = beam.width / 2;
  let near = 0, far = 1;
  for (const [start, delta, min, max] of [
    [beam.x, beam.endX - beam.x, box.x - half, box.x + box.w + half],
    [beam.y, beam.endY - beam.y, box.y - half, box.y + box.h + half],
  ]) {
    if (Math.abs(delta) < 0.00001) { if (start < min || start > max) return false; }
    else {
      const a = (min - start) / delta, b = (max - start) / delta;
      near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
      if (near > far) return false;
    }
  }
  return true;
}
