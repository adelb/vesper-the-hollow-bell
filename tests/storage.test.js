import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, loadSave, validateSave, persistSave, loadSettings, DEFAULT_SETTINGS, SAVE_KEY, SETTINGS_KEY } from '../src/storage.js';

const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('new browser gets an independent fresh save', () => {
  const first = loadSave(memory()), second = freshSave();
  first.defeated.push(0);
  assert.equal(second.defeated.length, 0);
  assert.equal(first.chapter, 0);
  assert.equal(first.echoes, 0);
});

test('full progression and lost echoes round-trip through storage', () => {
  const storage = memory();
  const save = { ...freshSave(), started: true, chapter: 3, unlocked: 3, checkpoint: 1, blade: 2, vitality: 1, echoes: 147, defeated: [0, 1, 2], notes: [1, 2], deaths: 4, bloodstain: { chapter: 3, x: 1300, y: 430, amount: 40 }, playtime: 840 };
  persistSave(storage, save);
  assert.deepEqual(loadSave(storage), save);
});

test('malformed saves are rejected rather than overwritten or silently accepted', () => {
  const storage = memory();
  storage.setItem(SAVE_KEY, '{bad');
  assert.throws(() => loadSave(storage));
  assert.equal(storage.getItem(SAVE_KEY), '{bad');
  for (const mutation of [{ chapter: 9 }, { echoes: -1 }, { blade: 6 }, { playtime: NaN }, { defeated: [6] }, { version: 99 }, { chapter: 2, unlocked: 0 }, { ending: 'unknown' }, { notes: 'not-an-array' }, { started: 1 }, { bloodstain: { chapter: 0, x: Infinity, y: 0, amount: 2 } }]) {
    assert.throws(() => validateSave({ ...freshSave(), ...mutation }), JSON.stringify(mutation));
  }
});

test('blocked storage propagates errors for visible UI notification', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.throws(() => loadSave(storage), /blocked/);
  assert.throws(() => persistSave(storage, freshSave()), /quota/);
});

test('settings constrain volumes and option values', () => {
  const storage = memory();
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
  storage.setItem(SETTINGS_KEY, JSON.stringify({ music: 99, effects: 0.2, difficulty: 'other', touch: 'on', shake: false }));
  const settings = loadSettings(storage);
  assert.equal(settings.music, DEFAULT_SETTINGS.music);
  assert.equal(settings.effects, 0.2);
  assert.equal(settings.difficulty, 'standard');
  assert.equal(settings.touch, 'on');
  assert.equal(settings.shake, false);
});

test('original release saves migrate without resetting campaign progress', () => {
  const old = { ...freshSave(), started: true, chapter: 3, unlocked: 3, defeated: [0, 1, 2], vitality: 2, blade: 3, echoes: 422 };
  delete old.talked; delete old.introduced; delete old.prologueSeen;
  const migrated = validateSave(old);
  assert.equal(migrated.chapter, 3);
  assert.equal(migrated.echoes, 422);
  assert.equal(migrated.blade, 3);
  assert.deepEqual(migrated.talked, []);
  assert.deepEqual(migrated.introduced, []);
  assert.equal(migrated.prologueSeen, false);
});

test('new narrative state rejects corrupt flags and invalid character references', () => {
  for (const bad of [{ talked: [7] }, { talked: null }, { introduced: 'all' }, { prologueSeen: 'yes' }, { prologueSeen: null }]) assert.throws(() => validateSave({ ...freshSave(), ...bad }));
});
