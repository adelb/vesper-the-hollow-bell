import { CHAPTERS } from './content.js';

export const SAVE_KEY = 'vesper.save.v1';
export const SETTINGS_KEY = 'vesper.settings.v1';

export function freshSave() {
  return { version: 1, chapter: 0, unlocked: 0, checkpoint: 0, echoes: 0, vitality: 0, blade: 0, defeated: [], notes: [], memories: [], talked: [], introduced: [], prologueSeen: false, deaths: 0, bloodstain: null, ending: null, started: false, playtime: 0 };
}

const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
export function validateSave(value) {
  if (!value || value.version !== 1) throw new Error('This save belongs to an unsupported version.');
  for (const [key, max] of Object.entries({ chapter: 4, unlocked: 4, checkpoint: 3, echoes: 9999999, vitality: 5, blade: 5, deaths: 999999, playtime: 999999999 })) {
    if (!integer(value[key], max)) throw new Error(`The save contains an invalid ${key}.`);
  }
  if (value.chapter > value.unlocked) throw new Error('The save contains a locked chapter.');
  const normalized = { ...value, memories: value.memories === undefined ? [] : value.memories, talked: value.talked === undefined ? [] : value.talked, introduced: value.introduced === undefined ? [] : value.introduced, prologueSeen: value.prologueSeen === undefined ? false : value.prologueSeen };
  const memoryIds = new Set(CHAPTERS.flatMap(chapter => chapter.memories.map(memory => memory.id)));
  if (!Array.isArray(normalized.memories) || normalized.memories.some(id => !memoryIds.has(id))) throw new Error('The save contains invalid memories.');
  for (const key of ['defeated', 'notes', 'talked', 'introduced']) {
    if (!Array.isArray(normalized[key]) || normalized[key].some(n => !integer(n, 4))) throw new Error(`The save contains invalid ${key}.`);
  }
  if (typeof normalized.prologueSeen !== 'boolean') throw new Error('The save contains an invalid prologue state.');
  if (typeof value.started !== 'boolean' || ![null, 'dawn', 'keeper'].includes(value.ending)) throw new Error('The save is incomplete.');
  if (value.bloodstain !== null) {
    const b = value.bloodstain;
    if (!b || !integer(b.chapter, 4) || !integer(b.amount, 9999999) || !Number.isFinite(b.x) || b.x < 0 || b.x > CHAPTERS[b.chapter].width || !Number.isFinite(b.y) || b.y < 0 || b.y > 540) {
      throw new Error('The save contains an invalid echo marker.');
    }
  }
  return { ...freshSave(), ...normalized, memories: [...new Set(normalized.memories)], defeated: [...new Set(value.defeated)], notes: [...new Set(value.notes)], talked: [...new Set(normalized.talked)], introduced: [...new Set(normalized.introduced)] };
}

export function loadSave(storage) {
  const raw = storage.getItem(SAVE_KEY);
  return raw ? validateSave(JSON.parse(raw)) : freshSave();
}

export function persistSave(storage, save) {
  storage.setItem(SAVE_KEY, JSON.stringify(validateSave(save)));
}

export const DEFAULT_SETTINGS = { music: 0.45, effects: 0.7, sound: false, shake: true, particles: true, difficulty: 'standard', touch: 'auto', reducedMotion: false };
export function loadSettings(storage) {
  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Saved settings could not be read.');
  const result = { ...DEFAULT_SETTINGS };
  for (const key of ['music', 'effects']) if (Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 1) result[key] = value[key];
  for (const key of ['sound', 'shake', 'particles', 'reducedMotion']) if (typeof value[key] === 'boolean') result[key] = value[key];
  if (['standard', 'pilgrim'].includes(value.difficulty)) result.difficulty = value.difficulty;
  if (['auto', 'on', 'off'].includes(value.touch)) result.touch = value.touch;
  return result;
}
