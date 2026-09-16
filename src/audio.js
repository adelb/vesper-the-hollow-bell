const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
export const SCORES = [
  { title: 'Gaslight, in Three', instrument: 'felt', root: 38, tempo: 72, meter: 6, chords: [0, -2, 3, -5], melody: [19, null, 15, 14, null, 12, 10, null, 14, 15, 7, null, 19, 22, 19, 15, null, 14, 12, null, 7, 10, 12, null], bass: [0, 7, 12], boss: 'The Warden’s Oath', mutation: 'A Cage of Burning Wings' },
  { title: 'Seeds for a Tomorrow', instrument: 'harp', root: 41, tempo: 60, meter: 12, chords: [0, 5, 3, -2], melody: [12, 7, 15, null, 19, 15, 20, null, 19, 15, 12, null, 7, 12, 15, 19, null, 20, 24, null, 20, 19, 15, 12], bass: [0, 3, 7, 12], boss: 'A Cradle of Thorns', mutation: 'Mother, Let Us Go' },
  { title: 'A Hymn Below the Water', instrument: 'choir', root: 36, tempo: 52, meter: 8, chords: [0, -5, -2, 3], melody: [19, null, null, null, 17, null, null, null, 15, null, 14, null, 12, null, null, null, 7, null, null, null, 10, null, 14, null, 12, null, null, null, 7, null, null, null], bass: [0, 7, 10], boss: 'The Last Congregation', mutation: 'One Hundred Open Mouths' },
  { title: 'The Seventh Unmoving Star', instrument: 'glass', root: 42, tempo: 86, meter: 7, chords: [0, 1, -5, 3], melody: [24, 19, 13, 17, null, 20, 19, 12, 17, 19, 25, 24, null, 20, 19, null, 17, 13, 12, 7, null], bass: [0, 1, 7, 8], boss: 'The Shape of the Witness', mutation: 'Heaven Looking Inward' },
  { title: 'Everything We Could Not Keep', instrument: 'strings', root: 38, tempo: 64, meter: 10, chords: [0, 1, -2, -5], melody: [12, null, 13, null, 15, 19, null, 20, 19, null, 15, null, 13, 12, null, 7, null, 10, 12, null], bass: [0, 7, 8], boss: 'The Heart Learns Fear', mutation: 'A City’s Last Goodbye' },
];

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
    } else {
      const c = this.context, filter = c.createBiquadFilter(), gain = c.createGain();
      const choir = name === 'choir';
      filter.type = choir ? 'bandpass' : 'lowpass'; filter.frequency.value = choir ? 720 : this.boss ? 1600 : 900;
      filter.Q.value = choir ? 0.8 : 0.45;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + Math.min(0.55, duration * 0.23));
      gain.gain.setValueAtTime(volume * 0.72, time + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      filter.connect(gain); gain.connect(this.score);
      let remaining = 3;
      for (const [interval, detune] of [[0, -5], [0, 5], [12, 0]]) {
        const osc = c.createOscillator();
        osc.type = choir ? 'sawtooth' : 'triangle';
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
      const beat = this.beat, t = this.nextBeat;
      const bar = Math.floor(beat / theme.meter), within = beat % theme.meter;
      const chord = theme.chords[bar % theme.chords.length];
      if (within === 0) {
        this.instrument('strings', theme.root + chord, t, step * (theme.meter + 2), 0.07);
        this.instrument(this.chapter === 2 ? 'choir' : 'strings', theme.root + chord + 7, t, step * (theme.meter + 2), 0.025);
        if (this.chapter === 2) this.instrument('choir', theme.root + chord + 15, t, step * (theme.meter + 1), 0.04);
      }
      const note = theme.melody[beat % theme.melody.length];
      if (note !== null) {
        this.instrument(theme.instrument, theme.root + note + (this.chapter === 1 ? 12 : 0), t, step * (this.chapter === 2 ? 6 : this.chapter === 4 ? 4 : 3.5), this.boss ? 0.045 : 0.07);
        if (this.phase === 2 && this.boss && beat % 2 === 0) this.instrument('glass', theme.root + note + 12, t + step * 0.5, step * 2, 0.02);
      }
      if (this.boss) {
        const bass = theme.bass[beat % theme.bass.length] + (this.phase === 2 && within === theme.meter - 1 ? 1 : 0);
        this.instrument('strings', theme.root + chord + bass, t, step * 1.1, 0.055);
        if (within === 0 || within === Math.floor(theme.meter / 2)) this.drum(t, 0.18, this.score);
        if (this.phase === 2 && beat % 2) this.noise(t, 0.13, 0.035, 2600, this.score);
        if (within === theme.meter - 1) this.drum(t, 0.08, this.score);
      } else if (this.chapter === 0) {
        if (within === 0) this.instrument('felt', theme.root + chord, t, step * 3, 0.07);
        if (within === 2 || within === 4) { this.instrument('felt', theme.root + chord + 15, t, step * 2, 0.025); this.noise(t, 0.04, 0.009, 1800, this.score); }
      } else if (this.chapter === 1) {
        if (beat % 3 === 0) this.instrument('harp', theme.root + chord + theme.bass[Math.floor(beat / 3) % 4] + 12, t + step * 0.25, step * 4, 0.035);
        if (within === 0) this.noise(t, step * 4, 0.009, 3700, this.score);
      } else if (this.chapter === 2) {
        if (within === 4) this.tone(theme.root - 12, t, step * 6, 0.09, 'sine');
        if (within === 7) this.tone(theme.root + 24, t, 0.5, 0.018, 'sine', this.score, -14);
      } else if (this.chapter === 3) {
        if (within === 0 || within === 3 || within === 5) this.instrument('glass', theme.root + theme.bass[within % 4] + 24, t + step * 0.5, step * 2, 0.025);
        if (within === 0) this.noise(t, 0.35, 0.008, 5200, this.score);
      } else {
        if (within === 0 || within === 1 || within === 5 || within === 6) this.drum(t, within % 5 === 0 ? 0.085 : 0.038, this.score);
        if (within === 0) this.instrument('choir', theme.root + chord + 12, t, step * 11, 0.022);
      }
      this.beat++; this.nextBeat += step;
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
    } else if (name === 'boss-intro') {
      const root = SCORES[this.chapter].root;
      for (const [i, n] of [0, 7, 13, 12].entries()) tone(root + n, i * 0.19, 3.7, 0.065);
      this.drum(t + 0.15, 0.18);
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
