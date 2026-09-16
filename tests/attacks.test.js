import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { freshSave, DEFAULT_SETTINGS } from '../src/storage.js';
import { BOSS_DRAMA, ENEMY_CAST } from '../src/content.js';
import { ATTACKS, attackColor, parryableAttack, beamHits } from '../src/attacks.js';

function encounter(pattern) {
  let chapter = ENEMY_CAST.findIndex(cast => Object.values(cast).some(s => s.patterns.includes(pattern)));
  const ordinary = chapter >= 0;
  if (!ordinary) chapter = BOSS_DRAMA.findIndex(b => [...b.opening, ...b.patterns].includes(pattern));
  assert.ok(chapter >= 0, `${pattern} is not assigned to an encounter`);
  const events = [], game = new Game({ ...freshSave(), chapter, unlocked: 4, prologueSeen: true }, { ...DEFAULT_SETTINGS }, e => events.push(e));
  game.start();
  const enemy = ordinary ? game.enemies.find(e => e.species.patterns.includes(pattern)) : game.boss;
  if (!ordinary) { enemy.active = true; if (!enemy.drama.opening.includes(pattern)) game.mutateBoss(); }
  game.player.x = enemy.x - 135; game.player.invulnerable = 100;
  enemy.facing = -1; enemy.pattern = pattern; enemy.state = 'windup';
  enemy.timer = game.windupFor(enemy); enemy.windupDuration = enemy.timer;
  enemy.targetX = game.player.x; enemy.targetY = game.player.y + 24;
  game.prepareSignature(enemy);
  return { game, enemy, events, attack: ATTACKS[pattern] };
}

function tick(game, enemy, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) {
    game.updateEnemy(enemy, 1 / 60);
    game.updateProjectiles(1 / 60);
  }
}

test('all fifteen enemy species have an exclusive signature and at least two attacks', () => {
  const species = ENEMY_CAST.flatMap(c => Object.values(c));
  assert.equal(new Set(species.map(s => s.patterns[0])).size, 15);
  for (const s of species) { assert.ok(s.patterns.length >= 2); assert.ok(ATTACKS[s.patterns[0]]); }
  for (let chapter = 0; chapter < 5; chapter++) {
    const game = new Game({ ...freshSave(), chapter, unlocked: 4 }, { ...DEFAULT_SETTINGS });
    for (const s of Object.values(ENEMY_CAST[chapter])) assert.ok(game.enemies.some(e => e.species.id === s.id), `${s.name} must actually appear in the campaign`);
  }
  for (const boss of BOSS_DRAMA) {
    assert.ok(new Set([...boss.opening, ...boss.patterns]).size >= 6);
    assert.ok(boss.patterns.some(p => !boss.opening.includes(p) && ATTACKS[p]));
    assert.ok(boss.size[0] > boss.body[0] && boss.size[1] > boss.body[1]);
  }
});

for (const [pattern, profile] of Object.entries(ATTACKS)) {
  test(`${pattern}: telegraph, attack sequence and punishable recovery execute without invalid geometry`, () => {
    assert.ok(profile.windup >= 0.8 && profile.recovery >= 1);
    assert.equal(parryableAttack(pattern), profile.parryable);
    assert.equal(attackColor(pattern), profile.parryable ? '#efbb78' : '#c2a4ec');
    const { game, enemy, events } = encounter(pattern);
    game.player.x = Math.max(10, enemy.x - 500); game.player.y = 25;
    let strike = false, recovery = false, emitted = false;
    for (let i = 0; i < Math.ceil((profile.windup + profile.duration + 0.2) * 60); i++) {
      tick(game, enemy, 1 / 60);
      strike ||= enemy.state === 'strike'; recovery ||= enemy.state === 'recover';
      emitted ||= game.projectiles.length > 0 || game.zones.length > 0;
      for (const entity of [enemy, ...game.projectiles, ...game.zones]) for (const key of ['x', 'y', 'vx', 'vy', 'life', 'timer', 'endX', 'endY']) {
        if (entity[key] !== undefined) assert.ok(Number.isFinite(entity[key]), `${pattern}: invalid ${key}`);
      }
    }
    assert.ok(strike && recovery);
    if (profile.kind !== 'combo') assert.ok(emitted);
    assert.equal(events.filter(e => e.type === 'sound' && e.name === `foe-${profile.kind}`).length, (profile.beats?.length || 1) + (profile.kind === 'beam' ? profile.angles.length : 0));
  });
}

test('three-hit execution can be parried, cancelling the remaining sequence', () => {
  const { game, enemy, attack } = encounter('execution');
  game.player.x = enemy.x - 35; game.player.invulnerable = 0; game.player.parry = 0.18;
  tick(game, enemy, attack.windup + 0.05);
  assert.equal(game.player.hp, 100);
  assert.ok(enemy.stagger > 1.8);
  assert.equal(enemy.state, 'recover');
  assert.equal(enemy.attackStep, 0);
});

test('returning weapons reverse direction and come back to their owner', () => {
  const { game, enemy, attack } = encounter('chainhook');
  tick(game, enemy, attack.windup + 0.03);
  const bolt = game.projectiles[0]; assert.ok(bolt);
  game.player.y = 0;
  assert.ok(bolt.vx < 0);
  game.updateProjectiles(0.6);
  game.updateProjectiles(0.4);
  assert.ok(bolt.vx > 0);
  for (let i = 0; i < 180; i++) game.updateProjectiles(1 / 60);
  assert.equal(game.projectiles.length, 0);
});

test('orbiting eyes are harmless while forming, then launch sequentially', () => {
  const { game, enemy, attack } = encounter('satellites');
  tick(game, enemy, attack.windup + 0.02);
  assert.equal(game.projectiles.length, 3);
  const bolt = game.projectiles[0];
  game.player.x = bolt.x; game.player.y = bolt.y; game.player.invulnerable = 0;
  game.updateProjectiles(0.1);
  assert.equal(game.player.hp, 100);
  assert.ok(game.projectiles.every(p => p.orbit));
  game.player.y = 0;
  game.updateProjectiles(0.5);
  assert.ok(game.projectiles.some(p => p.orbit) && game.projectiles.some(p => !p.orbit));
});

test('splitting projectiles fork only once and their fragments expire', () => {
  const { game, enemy, attack } = encounter('marrowfan');
  tick(game, enemy, attack.windup + 0.02);
  assert.equal(game.projectiles.length, 2);
  game.player.y = 0;
  game.updateProjectiles(0.8);
  assert.equal(game.projectiles.length, 6);
  assert.ok(game.projectiles.every(p => p.split === 0));
  for (let i = 0; i < 250; i++) game.updateProjectiles(1 / 60);
  assert.equal(game.projectiles.length, 0);
});

test('seeds plant a warned root hazard instead of dealing immediate ground damage', () => {
  const { game, enemy, attack } = encounter('seedburst');
  const seed = game.signatureBullet(enemy, 0, attack);
  seed.x = enemy.home; seed.y = game.floorAt(seed.x) - 1; seed.vy = 150;
  game.projectiles = [seed];
  game.updateProjectiles(1 / 60);
  assert.equal(game.projectiles.length, 0);
  assert.equal(game.zones.length, 1);
  assert.equal(game.zones[0].fired, false);
  assert.ok(game.zones[0].timer > 0.8);
});

test('beams hit their drawn segment, not its entire bounding rectangle or an infinite ray', () => {
  const beam = { x: 0, y: 0, endX: 100, endY: 100, width: 8 };
  assert.equal(beamHits({ x: 44, y: 44, w: 12, h: 12 }, beam), true);
  assert.equal(beamHits({ x: 70, y: 10, w: 12, h: 12 }, beam), false);
  assert.equal(beamHits({ x: 130, y: 130, w: 12, h: 12 }, beam), false);
  assert.equal(beamHits({ x: -30, y: -30, w: 12, h: 12 }, beam), false);
  assert.equal(beamHits({ x: 40, y: 15, w: 10, h: 10 }, { x: 50, y: 0, endX: 50, endY: 100, width: 8 }), true);
});

test('beam aim locks before firing, telegraphs are harmless, and a dash avoids the shot', () => {
  for (const dodging of [false, true]) {
    const { game, enemy, attack } = encounter('prism');
    const zone = game.zones[0], endX = zone.endX;
    game.player.x = (zone.x + zone.endX) / 2 - 12; game.player.y = (zone.y + zone.endY) / 2 - 24;
    game.player.invulnerable = 0;
    game.updateProjectiles(attack.windup - 0.1);
    assert.equal(game.player.hp, 100); assert.equal(zone.endX, endX);
    if (dodging) game.player.invulnerable = 0.21;
    game.updateProjectiles(0.2);
    assert.equal(game.player.hp, dodging ? 100 : 100 - attack.damage);
    assert.equal(zone.owner, enemy);
  }
});

test('interrupting the caster cancels warned beams and unlaunched satellites', () => {
  for (const pattern of ['prism', 'satellites']) {
    const { game, enemy, attack } = encounter(pattern);
    if (pattern === 'satellites') tick(game, enemy, attack.windup + 0.02);
    enemy.stagger = 1;
    game.updateProjectiles(1 / 60);
    assert.equal(game.projectiles.length, 0); assert.equal(game.zones.length, 0);
  }
});

test('leaving a caster behind cancels its pending attack rather than freezing an armed telegraph', () => {
  const { game, enemy } = encounter('prism');
  assert.ok(game.zones.length > 0);
  game.player.x = enemy.x - 800;
  game.updateEnemy(enemy, 1 / 60);
  assert.equal(game.zones.length, 0);
  assert.equal(enemy.state, 'idle');
});

test('alternating eruptions preserve traversable safe lanes and stagger their impacts', () => {
  const { game } = encounter('briarweave');
  const zones = game.zones.slice().sort((a, b) => a.x - b.x);
  assert.equal(zones.length, 6);
  for (let i = 1; i < zones.length; i++) assert.ok(zones[i].x - zones[i - 1].x - zones[i].radius - zones[i - 1].radius > game.player.w);
  assert.ok(zones[0].timer < zones[2].timer && zones[2].timer < zones[1].timer);
});

test('rift attacks mark their destination before teleporting and leave a reaction window', () => {
  const { game, enemy, attack } = encounter('riftcut'), start = enemy.x, destination = enemy.teleportX;
  tick(game, enemy, attack.windup * 0.2);
  assert.equal(enemy.x, start);
  tick(game, enemy, attack.windup * 0.2);
  assert.equal(enemy.x, destination);
  assert.equal(enemy.state, 'windup'); assert.ok(enemy.timer > 0.5);
});
