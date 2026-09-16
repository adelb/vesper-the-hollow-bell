import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { freshSave, DEFAULT_SETTINGS } from '../src/storage.js';
import { CHAPTERS, PROLOGUE, ENEMY_CAST, NPCS } from '../src/content.js';
import { SCORES, AudioEngine } from '../src/audio.js';

function setup(overrides = {}) {
  const events = [];
  const game = new Game({ ...freshSave(), prologueSeen: true, ...overrides }, { ...DEFAULT_SETTINGS }, event => events.push(event));
  game.start();
  game.player.invulnerable = 0;
  return { game, events };
}
function controls(held = [], pressed = []) {
  const queue = new Set(pressed);
  return { down: action => held.includes(action), take: action => { const exists = queue.has(action); queue.delete(action); return exists; } };
}
function advance(game, seconds, input = controls()) {
  for (let i = 0; i < Math.round(seconds * 60); i++) game.update(1 / 60, input);
}

test('five complete chapters contain original story, notes, distinct guardians and palettes', () => {
  assert.equal(CHAPTERS.length, 5);
  assert.equal(new Set(CHAPTERS.map(c => c.boss.kind)).size, 5);
  assert.equal(new Set(CHAPTERS.map(c => c.palette.sky)).size, 5);
  for (const chapter of CHAPTERS) {
    assert.ok(chapter.intro.length > 100);
    assert.ok(chapter.bossAfter.length > 100);
    assert.ok(chapter.note.text.length > 100);
    assert.ok(chapter.platforms.length >= 10);
    assert.ok(chapter.enemies.length >= 6);
    assert.ok(chapter.checkpoint > 1000 && chapter.checkpoint < chapter.arena);
  }
});

test('movement accelerates and stops, bounded within the world', () => {
  const { game } = setup();
  advance(game, 0.5, controls(['right']));
  assert.ok(game.player.x > 230);
  advance(game, 0.4);
  assert.ok(Math.abs(game.player.vx) < 1);
  game.player.x = 0;
  advance(game, 0.2, controls(['left']));
  assert.equal(game.player.x, 0);
});

test('jump reaches upper platforms and prevents airborne double jumps', () => {
  const { game } = setup();
  game.player.x = 380;
  advance(game, 0.25, controls(['jump'], ['jump']));
  assert.ok(game.player.y < 300, `jump apex should exceed a 104px rise, got ${game.player.y}`);
  const velocity = game.player.vy;
  game.update(1 / 60, controls(['jump'], ['jump']));
  assert.ok(game.player.vy > velocity);
  advance(game, 0.6);
  assert.equal(game.player.y + game.player.h, 354);
  assert.equal(game.player.grounded, true);
});

test('releasing jump early gives a shorter jump', () => {
  const { game: held } = setup();
  const { game: tapped } = setup();
  held.update(1 / 60, controls(['jump'], ['jump']));
  tapped.update(1 / 60, controls(['jump'], ['jump']));
  advance(held, 0.2, controls(['jump']));
  advance(tapped, 0.2);
  assert.ok(held.player.y < tapped.player.y - 20);
});

test('every required gap is traversable using jump and air dodge', () => {
  for (let index = 0; index < CHAPTERS.length; index++) {
    const chapter = CHAPTERS[index], floors = chapter.platforms.filter(p => p[1] >= 390);
    for (let i = 0; i < floors.length - 1; i++) {
      const left = floors[i], right = floors[i + 1];
      const { game } = setup({ chapter: index, unlocked: 4 });
      game.enemies = []; game.boss.hp = 0; game.level = { ...game.level, hazards: [] };
      game.player.x = left[0] + left[2] - 36;
      game.player.y = left[1] - game.player.h;
      game.player.safeX = game.player.x;
      game.player.vx = 220;
      game.update(1 / 60, controls(['right', 'jump'], ['jump']));
      advance(game, 0.18, controls(['right', 'jump']));
      game.update(1 / 60, controls(['right', 'jump'], ['dash']));
      advance(game, 0.65, controls(['right', 'jump']));
      assert.ok(game.player.x > right[0], `chapter ${index + 1}, gap ${i + 1} failed: ${game.player.x} < ${right[0]}`);
      assert.equal(game.player.hp, 100, `chapter ${index + 1}, gap ${i + 1} caused falling damage`);
    }
  }
});

test('dodge costs stamina and prevents damage during its initial frames', () => {
  const { game } = setup();
  game.update(1 / 60, controls(['right'], ['dash']));
  assert.ok(game.player.dash > 0);
  assert.equal(game.player.stamina, 77);
  assert.equal(game.hurtPlayer(30, null, false), false);
  assert.equal(game.player.hp, 100);
  advance(game, 0.3);
  assert.equal(game.hurtPlayer(30, null, false), true);
  assert.equal(game.player.hp, 70);
});

test('out of stamina blocks actions and recovers after a delay', () => {
  const { game, events } = setup();
  game.player.stamina = 5;
  game.update(1 / 60, controls([], ['dash', 'attack']));
  assert.equal(game.player.dash, 0);
  assert.equal(game.player.attack, 0);
  assert.ok(events.some(e => e.type === 'hint'));
  advance(game, 1);
  assert.ok(game.player.stamina > 40);
});

test('timed parry staggers the attacker, grants a riposte and consumes no health', () => {
  const { game } = setup();
  const enemy = game.enemies[0];
  enemy.x = game.player.x + 44;
  game.player.parry = 0.18;
  assert.equal(game.hurtPlayer(20, enemy, true), false);
  assert.equal(game.player.hp, 100);
  assert.ok(enemy.stagger >= 2);
  const hp = enemy.hp;
  game.strike();
  assert.ok(hp - enemy.hp >= game.damage * 2);
});

test('early parries and violet attacks cannot prevent damage', () => {
  for (const [timer, parryable] of [[0.33, true], [0.03, true], [0.18, false]]) {
    const { game } = setup();
    game.player.parry = timer;
    assert.equal(game.hurtPlayer(20, game.enemies[0], parryable), true);
    assert.equal(game.player.hp, 80);
  }
});

test('a swing hits each enemy once, respects facing, and heavy strikes deal more damage', () => {
  const { game } = setup();
  const enemy = game.enemies[0];
  enemy.hp = enemy.maxHp = 200;
  enemy.x = game.player.x + 44;
  game.player.facing = -1;
  game.strike();
  assert.equal(enemy.hp, 200);
  game.player.facing = 1;
  game.strike();
  assert.equal(enemy.hp, 173);
  game.strike();
  assert.equal(enemy.hp, 173);
  game.player.hit.clear();
  game.player.attackKind = 'heavy';
  game.strike();
  assert.equal(enemy.hp, 123);
});

test('three light attacks chain with input buffering', () => {
  const { game } = setup();
  game.update(1 / 60, controls([], ['attack']));
  assert.equal(game.player.combo, 1);
  advance(game, 0.2);
  game.update(1 / 60, controls([], ['attack']));
  advance(game, 0.2);
  assert.equal(game.player.combo, 2);
  advance(game, 0.14);
  game.update(1 / 60, controls([], ['attack']));
  advance(game, 0.25);
  assert.equal(game.player.combo, 3);
});

test('striking quickly reclaims only recoverable health', () => {
  const { game } = setup();
  game.hurtPlayer(30, null, false);
  assert.equal(game.player.hp, 70);
  const enemy = game.enemies[0]; enemy.x = game.player.x + 44;
  game.strike();
  assert.ok(game.player.hp > 70 && game.player.hp <= 92.5);
  game.player.rallyTimer = 0;
  advance(game, 2);
  assert.equal(game.player.rally, 0);
});

test('healing uses a limited tincture and can be interrupted', () => {
  const { game } = setup();
  game.player.hp = 20;
  game.update(1 / 60, controls([], ['heal']));
  assert.equal(game.player.flasks, 2);
  advance(game, 0.8);
  assert.equal(game.player.hp, 78);
  game.update(1 / 60, controls([], ['heal']));
  game.hurtPlayer(10, null, false);
  advance(game, 0.8);
  assert.equal(game.player.hp, 68);
  assert.equal(game.player.flasks, 1);
});

test('death drops echoes without immediately reclaiming them; respawn restores the lamp', () => {
  const { game } = setup({ echoes: 150 });
  game.player.safeX = 380;
  game.player.x = 380;
  game.player.hp = 1;
  game.hurtPlayer(20, null, false);
  game.recoverEchoes();
  assert.equal(game.save.echoes, 0);
  assert.equal(game.save.bloodstain.amount, 150);
  assert.equal(game.save.deaths, 1);
  advance(game, 1.6);
  assert.equal(game.mode, 'dead');
  game.respawn();
  assert.equal(game.player.hp, 100);
  assert.equal(game.player.x, 155);
  game.player.x = 380;
  game.recoverEchoes();
  assert.equal(game.save.echoes, 150);
  assert.equal(game.save.bloodstain, null);
});

test('dying twice replaces the previous lost echoes', () => {
  const { game } = setup({ echoes: 100 });
  game.die(); game.respawn();
  game.save.echoes = 30; game.die();
  assert.equal(game.save.bloodstain.amount, 30);
  game.respawn(); game.die();
  assert.equal(game.save.bloodstain, null);
});

test('continuing from the title after death revives the player without losing the echo marker', () => {
  const { game } = setup({ echoes: 100, checkpoint: 1 });
  game.player.invulnerable = 0;
  game.hurtPlayer(1000, null, false);
  game.mode = 'menu';
  game.start();
  assert.equal(game.player.hp, game.maxHp);
  assert.equal(game.player.x, game.level.checkpoint);
  assert.equal(game.mode, 'playing');
  assert.equal(game.save.bloodstain.amount, 100);
});

test('falling returns to safe ground and deals damage instead of soft-locking', () => {
  const { game } = setup();
  game.player.x = 700; game.player.y = 650; game.player.safeX = 600;
  game.fall();
  assert.equal(game.player.x, 600);
  assert.equal(game.player.hp, 60);
  assert.equal(game.mode, 'playing');
});

test('resting saves a checkpoint, revives enemies and restores resources', () => {
  const { game, events } = setup();
  game.player.x = game.level.checkpoint;
  game.player.hp = 30;
  game.player.flasks = 0;
  game.enemies[0].hp = 0;
  assert.equal(game.interaction.kind, 'checkpoint');
  game.interact();
  assert.equal(game.mode, 'rest');
  assert.equal(game.save.checkpoint, 1);
  assert.equal(game.player.hp, 100);
  assert.equal(game.player.flasks, 3);
  assert.ok(game.enemies[0].hp > 0);
  assert.ok(events.some(e => e.type === 'save'));
  game.mode = 'playing'; game.die(); game.respawn();
  assert.equal(game.player.x, game.level.checkpoint);
});

test('upgrades require a lamp and sufficient echoes, have escalating costs and a cap', () => {
  const { game } = setup({ echoes: 5000 });
  assert.equal(game.upgrade('blade'), false);
  game.interact();
  assert.equal(game.upgrade('unknown'), false);
  assert.equal(game.upgrade('vitality'), true);
  assert.equal(game.save.echoes, 4920);
  assert.equal(game.maxHp, 120);
  assert.equal(game.player.hp, 120);
  for (let i = 0; i < 5; i++) assert.equal(game.upgrade('blade'), true);
  assert.equal(game.damage, 62);
  assert.equal(game.upgrade('blade'), false);
  game.save.echoes = 0;
  assert.equal(game.upgrade('vitality'), false);
});

test('Pilgrim reduces incoming damage exactly and adds one tincture at rest', () => {
  const { game } = setup();
  game.settings.difficulty = 'pilgrim';
  game.hurtPlayer(50, null, false);
  assert.equal(game.player.hp, 69);
  game.player.grounded = true;
  game.interact();
  assert.equal(game.player.flasks, 4);
});

test('letters are collected once and do not block progression', () => {
  const { game, events } = setup();
  game.player.x = game.level.noteX;
  game.interact();
  assert.deepEqual(game.save.notes, [0]);
  assert.equal(game.mode, 'lore');
  assert.ok(events.some(e => e.type === 'lore'));
  game.mode = 'playing';
  assert.equal(game.interaction, null);
});

test('all bosses telegraph, physically mutate through a protected cinematic, and gain new attack sets', () => {
  for (let i = 0; i < 5; i++) {
    const { game } = setup({ chapter: i, unlocked: 4 });
    const boss = game.boss;
    game.player.x = boss.x - 95;
    game.player.invulnerable = 100;
    boss.active = true;
    boss.timer = 0;
    advance(game, 0.15);
    assert.equal(boss.state, 'windup', `chapter ${i} windup`);
    assert.ok(boss.timer > 0.4);
    boss.hp = boss.maxHp * 0.49;
    game.update(1 / 60);
    assert.equal(game.mode, 'cinematic');
    assert.equal(game.cinematic.kind, 'mutation');
    const height = boss.h;
    advance(game, 2.2);
    assert.equal(boss.phase, 2);
    assert.ok(boss.h > height);
    game.advanceCinematic(true);
    assert.equal(game.mode, 'playing');
    const patterns = new Set();
    for (let n = 1; n <= 12; n++) { boss.attackCount = n; patterns.add(game.patternFor(boss)); }
    for (const pattern of boss.drama.patterns) assert.ok(patterns.has(pattern), `chapter ${i} missing ${pattern}`);
  }
});

test('projectiles and astral telegraphs damage the player and expire', () => {
  const { game } = setup();
  game.projectiles.push({ x: game.player.x, y: game.player.y + 20, w: 10, h: 10, vx: 0, vy: 0, life: 2, damage: 15, owner: game.enemies[0] });
  game.updateProjectiles(1 / 60);
  assert.equal(game.player.hp, 85);
  assert.equal(game.projectiles.length, 0);
  game.player.invulnerable = 0;
  game.zones.push({ x: game.player.x + 12, y: 452, radius: 40, timer: 0.01, life: 0.4, fired: false, owner: game.boss });
  game.updateProjectiles(0.02);
  assert.equal(game.player.hp, 55);
  game.updateProjectiles(0.5);
  assert.equal(game.zones.length, 0);
});

test('violet nova bolts are not parryable, matching their visual warning', () => {
  const { game } = setup();
  game.boss.pattern = 'nova';
  game.shoot(game.boss, 0, 0);
  const bolt = game.projectiles[0];
  bolt.x = game.player.x; bolt.y = game.player.y + 20;
  game.player.parry = 0.18;
  game.updateProjectiles(1 / 60);
  assert.equal(game.player.hp, 78);
  assert.equal(game.boss.stagger, 0);
});

test('complete campaign: all five guardians unlock the next gate, persist and reach both endings', () => {
  const { game, events } = setup();
  assert.equal(game.enterChapter(1), false);
  for (let i = 0; i < 5; i++) {
    assert.equal(game.save.chapter, i);
    game.player.x = game.level.width - 170;
    assert.equal(game.interaction, null);
    const boss = game.boss;
    boss.active = true;
    game.player.x = boss.x - 45;
    game.player.y = boss.y + boss.h - game.player.h;
    game.player.facing = 1;
    game.player.attackKind = 'heavy';
    let hits = 0;
    while (boss.hp > 0 && hits++ < 50) {
      game.player.hit.clear(); game.strike();
      if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) { game.updateEnemy(boss, 1 / 60); game.advanceCinematic(true); }
    }
    assert.equal(boss.hp, 0);
    assert.ok(game.save.defeated.includes(i));
    assert.equal(game.save.unlocked, Math.min(4, i + 1));
    game.player.x = game.level.width - 170;
    game.player.grounded = true;
    assert.equal(game.interaction.kind, 'gate');
    game.interact();
  }
  assert.equal(game.mode, 'ending');
  assert.equal(game.save.defeated.length, 5);
  assert.equal(game.finish('invalid'), false);
  assert.equal(game.finish('dawn'), true);
  assert.equal(game.save.ending, 'dawn');
  assert.equal(game.finish('keeper'), true);
  assert.equal(game.save.ending, 'keeper');
  assert.ok(events.some(e => e.type === 'ending-choice'));
  assert.ok(events.filter(e => e.type === 'victory').length === 5);
  const restored = new Game(game.save, game.settings);
  assert.equal(restored.boss.hp, 0);
});

test('opening prologue tells five memories, freezes gameplay and persists completion', () => {
  const events = [];
  const game = new Game(freshSave(), { ...DEFAULT_SETTINGS }, e => events.push(e));
  game.start();
  assert.equal(game.mode, 'cinematic');
  assert.equal(game.cinematic.kind, 'prologue');
  const x = game.player.x;
  advance(game, 1, controls(['right'], ['attack']));
  assert.equal(game.player.x, x);
  for (let i = 0; i < PROLOGUE.length; i++) {
    assert.equal(game.cinematic.index, i);
    game.advanceCinematic();
  }
  assert.equal(game.mode, 'playing');
  assert.equal(game.save.prologueSeen, true);
  assert.ok(events.some(e => e.type === 'chapter'));
  game.mode = 'menu';
  game.beginPrologue(true);
  game.advanceCinematic(true);
  assert.equal(game.mode, 'menu');
  assert.equal(game.save.chapter, 0);
});

test('cinematics pause when suspended and skipping a mutation still applies its new form', () => {
  const { game } = setup();
  game.boss.active = true;
  game.beginBossCinematic('mutation');
  game.cinematic.suspended = true;
  advance(game, 6);
  assert.equal(game.cinematic.elapsed, 0);
  assert.equal(game.boss.phase, 1);
  game.advanceCinematic(true);
  assert.equal(game.boss.phase, 2);
  assert.deepEqual([game.boss.w, game.boss.h], game.boss.drama.size);
  assert.equal(game.mode, 'playing');
});

test('boss entrances freeze danger and shorten on later attempts', () => {
  const { game } = setup();
  game.player.x = game.level.arena;
  game.update(1 / 60);
  assert.equal(game.cinematic.kind, 'boss-intro');
  assert.equal(game.cinematic.duration, 6.2);
  assert.deepEqual(game.save.introduced, [0]);
  game.player.invulnerable = 0;
  assert.equal(game.hurtPlayer(50, game.boss, false), false);
  game.advanceCinematic(true);
  game.die(); game.respawn();
  game.player.x = game.level.arena;
  game.update(1 / 60);
  assert.equal(game.cinematic.duration, 3.2);
});

test('massive first-phase strikes cannot skip a guardian’s transformation', () => {
  const { game } = setup({ blade: 5 });
  game.boss.active = true; game.boss.hp = game.boss.maxHp * 0.55; game.boss.stagger = 2;
  game.player.x = game.boss.x - 35; game.player.attackKind = 'heavy';
  game.strike();
  assert.equal(game.boss.hp, game.boss.maxHp * 0.5);
  assert.equal(game.save.defeated.length, 0);
  game.updateEnemy(game.boss, 1 / 60);
  assert.equal(game.cinematic.kind, 'mutation');
});

test('directional air steps aim diagonally, are normalized and recharge only on landing', () => {
  const { game } = setup();
  game.enemies = [];
  game.player.y = 240; game.player.grounded = false; game.player.coyote = 0;
  game.update(1 / 60, controls(['right', 'up'], ['dash']));
  assert.ok(game.player.vx > 350 && game.player.vx < 450);
  assert.ok(game.player.vy < -350 && game.player.vy > -450);
  assert.equal(game.player.airDash, false);
  assert.ok(Math.abs(Math.hypot(game.player.dashX, game.player.dashY) - 1) < 0.001);
  game.player.dash = 0; game.player.dashCooldown = 0;
  game.update(1 / 60, controls(['right'], ['dash']));
  assert.equal(game.player.dash, 0);
  game.player.x = 155;
  advance(game, 1.5);
  assert.equal(game.player.airDash, true);
});

test('controller and touch upward aim do not jump before dashing', () => {
  for (const lastDevice of ['gamepad', 'touch']) {
    const { game } = setup();
    const input = { ...controls(['up'], ['up']), lastDevice };
    game.update(1 / 60, input);
    assert.equal(game.player.grounded, true);
    assert.equal(game.player.y, 404);
    game.update(1 / 60, { ...controls(['up'], ['dash']), lastDevice });
    assert.equal(game.player.dashY, -1);
    assert.equal(game.player.grounded, false);
    assert.equal(game.player.airDash, false);
  }
});

test('jump cancels a ground dash while preserving forward momentum', () => {
  const { game } = setup();
  game.update(1 / 60, controls(['right'], ['dash']));
  game.update(1 / 60, controls(['right', 'jump'], ['jump']));
  assert.equal(game.player.dash, 0);
  assert.equal(game.player.grounded, false);
  assert.ok(game.player.vy < -600);
  assert.ok(game.player.vx > 220);
});

test('Wakecut cancels into a long-reaching dash attack with its own visual effects', () => {
  const { game } = setup();
  const e = game.enemies[0]; e.x = game.player.x + 100;
  game.update(1 / 60, controls(['right'], ['dash']));
  game.update(1 / 60, controls(['right'], ['attack']));
  assert.equal(game.player.attackKind, 'wakecut');
  assert.ok(game.player.dashStrike > 0);
  advance(game, 0.14, controls(['right']));
  assert.ok(e.hp < e.maxHp);
  assert.ok(game.rings.length > 0);
});

test('Bellfall commits to an aerial plunge and strikes enemies on both sides of landing', () => {
  const { game } = setup();
  game.player.x = 155; game.player.y = 240; game.player.grounded = false; game.player.coyote = 0;
  const e = game.enemies[0];
  e.x = 220; e.patrolMin = 220; e.patrolMax = 220; e.stagger = 3;
  game.update(1 / 60, controls([], ['heavy']));
  assert.equal(game.player.plunge, true);
  advance(game, 0.6);
  assert.equal(game.player.plunge, false);
  assert.ok(e.hp < e.maxHp);
  assert.ok(game.rings.length > 0);
});

test('five unique survivors offer branching dialogue and persistent one-time gifts', () => {
  assert.equal(new Set(NPCS.map(n => n.id)).size, 5);
  for (let chapter = 0; chapter < 5; chapter++) {
    const { game } = setup({ chapter, unlocked: 4 });
    game.player.x = game.npc.x; game.player.y = game.npc.y - game.player.h;
    assert.equal(game.interaction.kind, 'npc');
    game.interact();
    assert.equal(game.mode, 'dialogue');
    assert.ok(Math.abs(game.player.x - game.npc.x) >= 60, 'Conversation should frame both actors separately');
    assert.equal(game.player.y + game.player.h, game.npc.y);
    const x = game.player.x;
    advance(game, 1, controls(['right'], ['attack']));
    assert.equal(game.player.x, x);
    while (game.dialogue.stage !== 'choices') game.advanceDialogue();
    assert.equal(game.save.echoes, game.npc.gift);
    assert.deepEqual(game.save.talked, [chapter]);
    for (const choice of [0, 1]) {
      assert.equal(game.advanceDialogue(choice), true);
      assert.equal(game.dialogue.stage, 'answer');
      while (game.dialogue.stage !== 'choices') game.advanceDialogue();
    }
    game.advanceDialogue('leave');
    assert.equal(game.mode, 'playing');
    game.beginDialogue();
    while (game.dialogue.stage !== 'choices') game.advanceDialogue();
    assert.equal(game.save.echoes, game.npc.gift);
    game.advanceDialogue('leave');
    game.save.defeated.push(chapter); game.beginDialogue();
    assert.deepEqual(game.dialogue.lines, game.npc.after);
  }
});

test('districts have fifteen named enemy designs with distinct encounter patterns', () => {
  const species = ENEMY_CAST.flatMap(cast => Object.values(cast));
  assert.equal(species.length, 15);
  assert.equal(new Set(species.map(s => s.id)).size, 15);
  assert.ok(new Set(species.map(s => s.patterns.join(','))).size >= 10);
  for (let i = 0; i < 5; i++) {
    const { game } = setup({ chapter: i, unlocked: 4 });
    for (const enemy of game.enemies) {
      assert.equal(enemy.species, ENEMY_CAST[i][enemy.kind]);
      enemy.attackCount = 1;
      assert.equal(game.patternFor(enemy), enemy.species.patterns[0]);
    }
  }
});

test('each location has a unique score, instrumentation, meter, melody and boss arrangements', () => {
  for (const key of ['title', 'instrument', 'meter']) assert.equal(new Set(SCORES.map(s => s[key])).size, 5);
  assert.equal(new Set(SCORES.map(s => s.melody.join(','))).size, 5);
  const audio = new AudioEngine({ ...DEFAULT_SETTINGS }, () => {});
  for (let i = 0; i < 5; i++) {
    audio.theme(i); assert.equal(audio.trackTitle, SCORES[i].title);
    audio.theme(i, true); assert.equal(audio.trackTitle, SCORES[i].boss);
    audio.theme(i, true, 2); assert.equal(audio.trackTitle, SCORES[i].mutation);
  }
});

test('paused and menu states do not advance enemies or player physics', () => {
  const { game } = setup();
  for (const mode of ['paused', 'menu', 'rest', 'lore', 'ending']) {
    game.mode = mode;
    const x = game.player.x, enemyX = game.enemies[0].x;
    advance(game, 2, controls(['right'], ['jump']));
    assert.equal(game.player.x, x);
    assert.equal(game.enemies[0].x, enemyX);
  }
});
