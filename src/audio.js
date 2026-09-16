import { ENTRANCES } from './content.js';

const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
export const SCORES = [
  { title: 'Gaslight, in Three', instrument: 'felt', root: 38, tempo: 72, meter: 6, chords: [0, -2, 3, -5], melody: [19, null, 15, 14, null, 12, 10, null, 14, 15, 7, null, 19, 22, 19, 15, null, 14, 12, null, 7, 10, 12, null], bass: [0, 7, 12], boss: 'The Warden’s Oath', mutation: 'A Cage of Burning Wings' },
  { title: 'Seeds for a Tomorrow', instrument: 'harp', root: 41, tempo: 60, meter: 12, chords: [0, 5, 3, -2], melody: [12, 7, 15, null, 19, 15, 20, null, 19, 15, 12, null, 7, 12, 15, 19, null, 20, 24, null, 20, 19, 15, 12], bass: [0, 3, 7, 12], boss: 'A Cradle of Thorns', mutation: 'Mother, Let Us Go' },
  { title: 'A Hymn Below the Water', instrument: 'choir', root: 36, tempo: 52, meter: 8, chords: [0, -5, -2, 3], melody: [19, null, null, null, 17, null, null, null, 15, null, 14, null, 12, null, null, null, 7, null, null, null, 10, null, 14, null, 12, null, null, null, 7, null, null, null], bass: [0, 7, 10], boss: 'The Last Congregation', mutation: 'One Hundred Open Mouths' },
  { title: 'The Seventh Unmoving Star', instrument: 'glass', root: 42, tempo: 86, meter: 7, chords: [0, 1, -5, 3], melody: [24, 19, 13, 17, null, 20, 19, 12, 17, 19, 25, 24, null, 20, 19, null, 17, 13, 12, 7, null], bass: [0, 1, 7, 8], boss: 'The Shape of the Witness', mutation: 'Heaven Looking Inward' },
  { title: 'Everything We Could Not Keep', instrument: 'strings', root: 38, tempo: 64, meter: 10, chords: [0, 1, -2, -5], melody: [12, null, 13, null, 15, 19, null, 20, 19, null, 15, null, 13, 12, null, 7, null, 10, 12, null], bass: [0, 7, 8], boss: 'The Heart Learns Fear', mutation: 'A City’s Last Goodbye' },
];

const RESPONSES = [
  [22, null, 19, 17, 15, null, 14, 12, null, 10, 7, null, 15, 17, 19, null, 14, 10, 12, null, null, 7, 12, null],
  [24, 20, null, 19, 15, 12, 14, null, 19, 20, 24, null, 27, null, 24, 20, 19, null, 15, 14, 12, 7, null, null],
  [12, null, null, null, 15, null, null, null, 19, null, null, null, 22, null, 19, null, 17, null, null, null, 14, null, null, null, 12, null, null, null, null, null, 7, null],
  [25, null, 24, 20, 19, null, 13, 17, 12, null, 19, 20, 24, null, 13, 12, 7, null, 8, 13, null],
  [7, null, null, 10, 12, null, 13, null, 12, null, 19, null, 15, null, 13, 12, null, 7, null, null],
];
const MIX_GAIN = [1.12, 1, 0.85, 1.08, 0.5];

export function scoreBeat(chapter, beat, boss = false, phase = 1) {
  const score = SCORES[chapter], within = beat % score.meter, bar = Math.floor(beat / score.meter);
  const section = Math.floor(bar / 4) % 4, chord = score.chords[(bar + (section === 3 ? 2 : 0)) % score.chords.length];
  const melody = section % 2 ? RESPONSES[chapter] : score.melody, events = [];
  const note = (voice, interval, length, volume, offset = 0) => events.push({ kind: 'note', voice, midi: score.root + interval, length, volume, offset });
  const drum = (volume, offset = 0) => events.push({ kind: 'drum', volume, offset });
  const air = (length, volume, cutoff, offset = 0) => events.push({ kind: 'noise', length, volume, cutoff, offset });
  const lead = melody[beat % melody.length];
  if (lead !== null) note(score.instrument, lead + (chapter === 1 ? 12 : 0), [2.8, 3.2, 7, 2.4, 5][chapter], boss ? 0.048 : 0.075);
  if (chapter === 0) {
    if (within === 0) { note('felt', chord, 3.2, 0.1); note('felt', chord + 12, 2.5, 0.025); }
    if (within === 2 || within === 4) { note('felt', chord + 15, 1.8, 0.035); note('felt', chord + 19, 1.6, 0.025); air(0.1, 0.008, 1800); }
    if (section === 3 && within === 5) note('glass', 31, 4, 0.018);
  } else if (chapter === 1) {
    if (within % 3 === 0) note('harp', chord + [0, 7, 15, 12][within / 3], 5, 0.065, 0.12);
    if (within === 2 || within === 8) note('harp', chord + 31, 4, 0.018, 0.45);
    if (within === 0) air(6, 0.01, 3900);
    if (section >= 2 && within === 6) note('harp', chord + 19, 7, 0.035, 0.6);
  } else if (chapter === 2) {
    if (within === 0) { note('organ', chord - 12, 10, 0.085); note('choir', chord + 7, 9, 0.034); }
    if (within === 4) { note('choir', chord + 15, 7, 0.036); air(3, 0.009, 550); }
    if (within === 7 && bar % 2 === 1) note('glass', 36, 3, 0.022, 0.4);
  } else if (chapter === 3) {
    if ([0, 3, 5].includes(within)) note('glass', chord + [12, 19, 25][[0, 3, 5].indexOf(within)], 4, 0.035, 0.5);
    if (within === 0) note('organ', chord, 7, 0.032);
    if (within === 6 && section % 2) note('glass', chord + 37, 5, 0.017, 0.35);
  } else {
    if (within === 0) { note('cello', chord - 12, 11, 0.065); note('strings', chord + 7, 10, 0.022); }
    if ([0, 1, 5, 6].includes(within)) drum(within % 5 === 0 ? 0.09 : 0.033);
    if (within === 5 && section >= 2) note('choir', chord + 12, 10, 0.032);
  }
  if (boss) {
    const accents = [[0, 3, 5], [0, 4, 7, 10], [0, 3, 6], [0, 2, 5], [0, 1, 5, 6]][chapter];
    if (accents.includes(within)) drum(phase === 2 ? 0.18 : 0.135);
    if (within % 2 === 0) note(chapter === 2 ? 'organ' : chapter === 1 ? 'harp' : 'cello', chord + score.bass[beat % score.bass.length], 1.8, 0.044);
    if (phase === 2 && within % 2 === 1) {
      air(0.35, 0.018, 1800 + chapter * 400);
      if (lead !== null) note(chapter === 2 ? 'choir' : 'glass', lead + 12, 2.5, 0.018, 0.45);
    }
  }
  return events;
}

export class AudioEngine {
  constructor(settings, onError) {
    this.settings = settings;
    this.onError = onError;
    this.context = null;
    this.chapter = 0;
    this.boss = false;
    this.phase = 1;
    this.cinematic = false;
    this.beat = 0;
    this.nextBeat = 0;
    this.paused = false;
    this.lastStep = 0;
  }

  async unlock() {
    if (this.context?.state !== 'running' && navigator.userActivation && !navigator.userActivation.hasBeenActive) {
      this.onError('Select the sound icon with a click or tap to enable audio. Your pilgrimage can begin without it.');
      return false;
    }
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { this.onError('Web Audio is unavailable in this browser. The game is still playable without sound.'); return false; }
      this.context = new AudioContext();
      const c = this.context;
      this.master = c.createGain();
      this.music = c.createGain();
      this.effects = c.createGain();
      const compressor = c.createDynamicsCompressor();
      compressor.threshold.value = -18; compressor.ratio.value = 5;
      this.music.connect(this.master); this.effects.connect(this.master);
      this.score = c.createGain(); this.score.connect(this.music);
      this.master.connect(compressor); compressor.connect(c.destination);
      const reverb = c.createConvolver();
      const length = Math.floor(c.sampleRate * 2.1);
      const impulse = c.createBuffer(2, length, c.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3 * 0.28;
      }
      reverb.buffer = impulse;
      const wet = c.createGain(); wet.gain.value = 0.28;
      this.music.connect(reverb); reverb.connect(wet); wet.connect(this.master);
      this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      this.nextBeat = c.currentTime + 0.1;
      this.timer = window.setInterval(() => this.schedule(), 100);
      this.applySettings();
    }
    try { await this.context.resume(); return true; }
    catch (error) { this.onError(`Sound could not start: ${error.message}`); return false; }
  }

  applySettings() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.sound ? 0.7 : 0, t, 0.08);
    this.music.gain.setTargetAtTime(this.settings.music * (this.paused ? 0.35 : this.cinematic ? 0.5 : 1), t, 0.3);
    this.effects.gain.setTargetAtTime(this.settings.effects, t, 0.05);
  }

  get trackTitle() {
    const score = SCORES[this.chapter];
    return this.boss ? this.phase === 2 ? score.mutation : score.boss : score.title;
  }

  theme(chapter, boss = false, phase = 1) {
    if (chapter !== this.chapter || boss !== this.boss || phase !== this.phase) {
      this.chapter = chapter; this.boss = boss; this.phase = phase; this.beat = 0;
      if (this.context) {
        const c = this.context, old = this.score;
        old.gain.setTargetAtTime(0.0001, c.currentTime, 0.35);
        this.score = c.createGain(); this.score.gain.setValueAtTime(0, c.currentTime);
        this.score.gain.setTargetAtTime(1, c.currentTime, 0.3); this.score.connect(this.music);
        setTimeout(() => old.disconnect(), 12000);
        this.nextBeat = c.currentTime + 0.12;
      }
    }
  }

  setPaused(paused) { this.paused = paused; this.applySettings(); }
  setCinematic(cinematic) { this.cinematic = cinematic; this.applySettings(); }
  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }

  tone(midi, start, duration, volume = 0.08, type = 'triangle', output = this.score, detune = 0) {
    const c = this.context, oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency(midi); oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.08, duration * 0.1));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(output);
    oscillator.start(start); oscillator.stop(start + duration + 0.03);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  bell(midi, time, volume = 0.08, duration = 3) {
    this.tone(midi, time, duration, volume, 'sine');
    this.tone(midi + 12, time, duration * 0.55, volume * 0.32, 'sine', this.score, 8);
    this.tone(midi + 19, time, duration * 0.25, volume * 0.18, 'sine', this.score, -13);
  }

  instrument(name, midi, time, duration, volume) {
    if (name === 'felt') {
      this.tone(midi, time, duration, volume, 'triangle');
      this.tone(midi + 12, time, duration * 0.46, volume * 0.24, 'sine', this.score, 3);
      this.tone(midi + 19, time, duration * 0.16, volume * 0.07, 'sine');
    } else if (name === 'harp') {
      this.tone(midi, time, duration * 0.9, volume, 'sine');
      this.tone(midi + 12, time, duration * 0.5, volume * 0.38, 'triangle');
      this.noise(time, 0.045, volume * 0.07, 3400, this.score);
    } else if (name === 'glass') {
      this.bell(midi, time, volume, duration * 1.4);
      this.tone(midi + 28, time + 0.03, duration * 0.7, volume * 0.12, 'sine', this.score, 9);
    } else if (name === 'organ') {
      this.tone(midi, time, duration, volume, 'sine');
      this.tone(midi + 12, time, duration * 0.95, volume * 0.36, 'sine');
      this.tone(midi + 19, time, duration * 0.85, volume * 0.15, 'sine');
    } else {
      const c = this.context, filter = c.createBiquadFilter(), gain = c.createGain();
      const choir = name === 'choir';
      filter.type = choir ? 'bandpass' : 'lowpass'; filter.frequency.value = choir ? 720 : name === 'cello' ? 520 : this.boss ? 1600 : 900;
      filter.Q.value = choir ? 0.8 : 0.45;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + Math.min(0.55, duration * 0.23));
      gain.gain.setValueAtTime(volume * 0.72, time + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      filter.connect(gain); gain.connect(this.score);
      let remaining = 3;
      for (const [interval, detune] of [[0, -5], [0, 5], [12, 0]]) {
        const osc = c.createOscillator();
        osc.type = choir || name === 'cello' ? 'sawtooth' : 'triangle';
        osc.frequency.value = frequency(midi + interval);
        osc.detune.value = detune;
        osc.connect(filter); osc.start(time); osc.stop(time + duration + 0.05);
        osc.onended = () => { osc.disconnect(); if (--remaining === 0) { filter.disconnect(); gain.disconnect(); } };
      }
    }
  }

  schedule() {
    const c = this.context;
    if (!c || c.state !== 'running' || !this.settings.sound) { if (c) this.nextBeat = c.currentTime + 0.1; return; }
    if (this.nextBeat < c.currentTime - 0.3) this.nextBeat = c.currentTime + 0.05;
    const theme = SCORES[this.chapter], tempo = this.boss ? theme.tempo * (this.phase === 2 ? 1.72 : 1.45) : theme.tempo;
    const step = 60 / tempo / 2;
    while (this.nextBeat < c.currentTime + 0.3) {
      this.perform(scoreBeat(this.chapter, this.beat, this.boss, this.phase), this.nextBeat, step);
      this.beat++; this.nextBeat += step;
    }
  }

  perform(events, time, step) {
    for (const event of events) {
      const start = time + event.offset * step, volume = event.volume * MIX_GAIN[this.chapter];
      if (event.kind === 'note') this.instrument(event.voice, event.midi, start, event.length * step, volume);
      else if (event.kind === 'drum') this.drum(start, volume, this.score);
      else this.noise(start, event.length * step, volume, event.cutoff, this.score);
    }
  }

  noise(time, duration, volume, cutoff = 1800, output = this.effects) {
    const c = this.context, source = c.createBufferSource(), gain = c.createGain(), filter = c.createBiquadFilter();
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(output);
    source.start(time); source.stop(time + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }

  drum(time, volume, output = this.effects) {
    const c = this.context, osc = c.createOscillator(), gain = c.createGain();
    osc.frequency.setValueAtTime(105, time); osc.frequency.exponentialRampToValueAtTime(34, time + 0.18);
    gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
    osc.connect(gain); gain.connect(output); osc.start(time); osc.stop(time + 0.41);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  play(name) {
    if (!this.context || this.context.state !== 'running' || !this.settings.sound) return;
    const t = this.context.currentTime;
    const tone = (midi, delay, duration, volume = 0.08, type = 'triangle') => this.tone(midi, t + delay, duration, volume, type, this.effects);
    if (name === 'foe-beam') {
      this.noise(t, 0.3, 0.06, 4200);
      for (const [i, n] of [60, 72, 79].entries()) tone(n, i * 0.025, 0.5, 0.025, 'sine');
    } else if (name === 'foe-orbit') {
      for (const [i, n] of [79, 86, 91].entries()) tone(n, i * 0.09, 0.8, 0.025, 'sine');
    } else if (name === 'foe-waves' || name === 'foe-zones') {
      this.drum(t, 0.16); this.noise(t, 0.35, 0.065, 800); tone(43, 0, 0.5, 0.05);
    } else if (name === 'foe-combo' || name === 'foe-volley') {
      this.noise(t, 0.17, 0.09, name === 'foe-combo' ? 1500 : 2800);
      tone(name === 'foe-combo' ? 51 : 74, 0, 0.2, 0.035);
    } else if (['boss-intro', 'entrance-rise', 'entrance-reveal'].includes(name)) {
      const root = SCORES[this.chapter].root;
      const stage = name === 'boss-intro' ? 0 : name === 'entrance-rise' ? 1 : 2;
      const cue = ENTRANCES[this.chapter].cue;
      for (const [i, n] of cue.entries()) tone(root + n + (stage === 2 ? 12 : 0), i * [0.23, 0.32, 0.42, 0.17, 0.28][this.chapter], stage === 2 ? 2.8 : 2, stage === 2 ? 0.065 : 0.035, this.chapter === 0 || this.chapter === 4 ? 'triangle' : 'sine');
      if (stage === 1) this.noise(t, 1.6, 0.055, [900, 2200, 480, 4100, 650][this.chapter]);
      if (stage === 2) { this.drum(t, 0.2); this.drum(t + (this.chapter === 4 ? 0.25 : 0.7), 0.07); }
    } else if (name === 'mutation' || name === 'mutation-reveal') {
      const root = SCORES[this.chapter].root;
      for (const [i, n] of (name === 'mutation' ? [12, 11, 7, 1, 0] : [0, 12, 19, 25, 31]).entries()) tone(root + n, i * 0.13, 2.8, 0.06, 'triangle');
      this.noise(t, 1.3, 0.11, 1100);
      this.drum(t, 0.23);
    } else if (name === 'wakecut') {
      this.noise(t, 0.3, 0.13, 3300);
      for (const [i, n] of [74, 81, 86].entries()) tone(n, i * 0.035, 0.25, 0.03, 'sine');
    } else if (name === 'plunge') {
      this.noise(t, 0.5, 0.08, 1700); tone(48, 0, 0.4, 0.07);
    } else if (name === 'bellfall') {
      this.drum(t, 0.29); this.noise(t, 0.35, 0.12, 1800); tone(50, 0, 0.9, 0.08, 'sine'); tone(69, 0.03, 0.5, 0.035, 'sine');
    } else if (name === 'step') {
      if (t - this.lastStep < 0.16) return;
      this.lastStep = t; this.noise(t, 0.045, 0.025, 600);
    } else if (name === 'swing' || name === 'heavy') {
      this.noise(t, name === 'heavy' ? 0.29 : 0.16, 0.15, 1900);
      tone(name === 'heavy' ? 40 : 54, 0, 0.16, 0.05);
    } else if (name === 'hit' || name === 'boss-strike') {
      this.noise(t, 0.14, 0.19, 950); this.drum(t, 0.23);
      tone(70, 0, 0.06, 0.035, 'square');
    } else if (name === 'hurt') {
      this.noise(t, 0.22, 0.16, 650); this.drum(t, 0.22); tone(35, 0, 0.3, 0.08, 'sawtooth');
    } else if (name === 'dodge' || name === 'jump') {
      this.noise(t, 0.18, 0.08, name === 'dodge' ? 1200 : 700);
      if (name === 'dodge') { tone(81, 0, 0.22, 0.025, 'sine'); tone(69, 0.04, 0.24, 0.022, 'sine'); }
    } else if (name === 'parry' || name === 'riposte') {
      for (const n of [74, 86, 93]) tone(n, 0, 0.65, 0.07, 'sine');
      this.noise(t, 0.08, 0.11, 6000);
    } else if (name === 'parry-ready') tone(82, 0, 0.12, 0.03, 'sine');
    else if (name === 'tell') tone(65, 0, 0.16, 0.024, 'sine');
    else if (['heal', 'rest', 'recover', 'upgrade'].includes(name)) {
      for (const [i, n] of [62, 65, 69, 74].entries()) tone(n, i * 0.12, 1.1, 0.045, 'sine');
    } else if (name === 'death' || name === 'phase') {
      for (const [i, n] of [50, 49, 38].entries()) tone(n, i * 0.2, 2.8, 0.09, 'triangle');
      this.drum(t, 0.2);
    } else if (name === 'victory') {
      for (const [i, n] of [50, 57, 62, 65, 69, 74].entries()) tone(n, i * 0.25, 3.5, 0.065, 'sine');
    }
  }
}
