import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, ENTRANCES } from '../src/content.js';
import { Game } from '../src/game.js';
import { freshSave, validateSave, DEFAULT_SETTINGS } from '../src/storage.js';
import { SCORES, scoreBeat } from '../src/audio.js';
import { entrancePose } from '../src/entrance.js';

const controls = (held = [], pressed = []) => {
  const queue = new Set(pressed);
  return { down: action => held.includes(action), take: action => queue.delete(action) };
};
function setup(chapter = 0, overrides = {}) {
  const events = [], game = new Game({ ...freshSave(), chapter, unlocked: 4, prologueSeen: true, ...overrides }, { ...DEFAULT_SETTINGS }, e => events.push(e));
  game.mode = 'playing';
  return { game, events };
}
function advance(game, seconds, input = controls()) {
  for (let frame = 0; frame < seconds * 60; frame++) game.update(1 / 60, input);
}

for (let chapter = 0; chapter < 5; chapter++) {
  test(`${CHAPTERS[chapter].name}: substantial populated expansion and safe lamps`, () => {
    const c = CHAPTERS[chapter], { game } = setup(chapter);
    assert.ok(c.width >= 3820 * 1.7);
    assert.ok(c.arena >= 3040 * 1.9);
    assert.ok(c.platforms.length >= 27 && c.enemies.length >= 15);
    assert.equal(c.lamps.length, 4);
    assert.equal(c.lamps[1], c.checkpoint);
    for (const [index, x] of c.lamps.entries()) {
      assert.ok(c.platforms.some(([px, py, w]) => py >= 390 && x > px + 25 && x + 24 < px + w - 25));
      assert.ok(!c.hazards.some(([hx, , w]) => x + 24 > hx && x < hx + w));
      game.loadChapter(chapter, index); game.mode = 'playing';
      assert.equal(game.player.x, x);
      assert.equal(game.interaction?.index, index);
      game.interact();
      const save = validateSave(JSON.parse(JSON.stringify(game.save)));
      assert.equal(save.checkpoint, index);
    }
    assert.ok(c.enemies.every(([x]) => c.platforms.some(([px, py, w]) => py >= 390 && x >= px && x + 34 <= px + w)));
    assert.ok(c.lamps[3] < c.arena - 50 && c.arena - c.lamps[3] <= 200);
  });

  test(`${CHAPTERS[chapter].name}: both elevated memory routes are climbable`, () => {
    const { game } = setup(chapter), c = game.level;
    game.enemies = []; game.boss.hp = 0; game.level = { ...c, hazards: [] };
    for (const memory of c.memories) {
      const steps = c.platforms.filter(([x, y]) => y < 390 && x >= memory.x - 800 && x <= memory.x).sort((a, b) => a[0] - b[0]);
      const first = steps[0];
      game.player.x = first[0] + 32; game.player.y = game.floorAt(game.player.x) - 48;
      game.player.vx = 0; game.player.vy = 0; game.player.grounded = true;
      advance(game, 0.9, controls(['jump'], ['jump']));
      assert.equal(game.player.y + 48, first[1], `${memory.id}: could not mount first ledge`);
      for (let i = 1; i < steps.length; i++) {
        const previous = steps[i - 1], next = steps[i];
        for (let n = 0; n < 180 && game.player.x < previous[0] + previous[2] - 62; n++) game.update(1 / 60, controls(['right']));
        game.update(1 / 60, controls(['right', 'jump'], ['jump']));
        for (let n = 0; n < 90 && !game.player.grounded; n++) game.update(1 / 60, controls(['right', 'jump']));
        assert.equal(game.player.y + 48, next[1], `${memory.id}: missed ledge ${i}, x=${game.player.x}`);
      }
      assert.equal(game.player.hp, game.maxHp);
    }
  });

  test(`${CHAPTERS[chapter].name}: memories reward once and persist`, () => {
    const { game, events } = setup(chapter);
    for (const memory of game.level.memories) {
      game.player.x = memory.x - 12; game.player.y = memory.y - 48; game.player.grounded = true;
      assert.equal(game.interaction.kind, 'memory');
      const before = game.save.echoes;
      game.interact();
      assert.equal(game.mode, 'lore');
      assert.equal(game.save.echoes, before + memory.reward);
      assert.equal(events.at(-2).note.id, memory.id);
      game.mode = 'playing';
      assert.equal(game.interaction, null);
    }
    const copy = validateSave(JSON.parse(JSON.stringify(game.save)));
    assert.deepEqual(copy.memories, game.level.memories.map(m => m.id));
    game.save.bloodstain = { chapter, x: 5780, y: 430, amount: 80 };
    assert.equal(validateSave(game.save).bloodstain.x, 5780);
  });

  test(`${CHAPTERS[chapter].boss.name}: staged arrival is protected, skippable and repeatable`, () => {
    const { game, events } = setup(chapter);
    game.player.x = game.level.arena - 25; game.boss.active = true;
    game.beginBossCinematic('boss-intro');
    assert.equal(game.cinematic.duration, ENTRANCES[chapter].duration);
    const hp = game.player.hp;
    advance(game, game.cinematic.duration * 0.65);
    assert.equal(game.player.hp, hp);
    assert.equal(events.filter(e => e.name === 'entrance-rise').length, 1);
    assert.equal(events.filter(e => e.name === 'entrance-reveal').length, 1);
    game.advanceCinematic(true);
    assert.equal(game.mode, 'playing'); assert.equal(game.boss.phase, 1);
    assert.equal(game.player.invulnerable, 1.15);
    game.loadChapter(chapter, 3); game.boss.active = true; game.beginBossCinematic('boss-intro');
    assert.equal(game.cinematic.duration, 4.2);
    for (const progress of [0, 0.17, 0.3, 0.55, 0.75, 1]) {
      const pose = entrancePose(game.boss.kind, progress);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.equal(entrancePose(game.boss.kind, progress, true).offsetY, 0);
    }
    assert.equal(Math.abs(entrancePose(game.boss.kind, 1).offsetY), 0);
    assert.equal(entrancePose(game.boss.kind, 1).alpha, 1);
  });
}

test('old saves migrate without moving either original lamp or losing progress', () => {
  const original = { ...freshSave(), chapter: 3, unlocked: 3, checkpoint: 1, echoes: 501, defeated: [0, 1, 2] };
  delete original.memories;
  const migrated = validateSave(original);
  assert.deepEqual(migrated.memories, []);
  assert.equal(new Game(migrated, DEFAULT_SETTINGS).player.x, 1650);
  assert.equal(migrated.echoes, 501);
  assert.throws(() => validateSave({ ...original, memories: ['not-a-memory'] }), /invalid memories/);
  assert.throws(() => validateSave({ ...original, checkpoint: 4 }), /checkpoint/);
});

test('district scores have distinct arrangements, second phrases and mutation layers', () => {
  const arrangements = [];
  for (let chapter = 0; chapter < 5; chapter++) {
    const meter = SCORES[chapter].meter;
    const phrase = (start, boss = false, phase = 1) => Array.from({ length: meter * 4 }, (_, beat) => scoreBeat(chapter, beat + start, boss, phase));
    const first = phrase(0), answer = phrase(meter * 4), battle = phrase(0, true), mutation = phrase(0, true, 2);
    assert.notDeepEqual(first, answer);
    assert.notDeepEqual(first, battle); assert.notDeepEqual(battle, mutation);
    for (const e of [...first, ...answer, ...battle, ...mutation].flat()) {
      assert.ok(e.volume > 0 && e.volume <= 0.2 && e.offset >= 0);
      if (e.kind === 'note') assert.ok(Number.isFinite(e.midi) && e.length > 0);
    }
    arrangements.push([...new Set(first.flat().filter(e => e.kind === 'note').map(e => e.voice))].sort().join(','));
  }
  assert.equal(new Set(arrangements).size, 5);
});
