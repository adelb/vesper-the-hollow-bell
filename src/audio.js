const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const THEMES = [
  { root: 38, scale: [0, 2, 3, 7, 10], motif: [7, 3, 2, 0, null, 10, 7, 3], tempo: 66 },
  { root: 41, scale: [0, 2, 3, 5, 8], motif: [8, 5, 3, null, 2, 3, 0, null], tempo: 62 },
  { root: 36, scale: [0, 2, 3, 5, 7], motif: [0, 7, null, 5, 3, 2, null, 0], tempo: 58 },
  { root: 42, scale: [0, 1, 5, 7, 8], motif: [12, 8, 7, 5, null, 1, 5, 0], tempo: 70 },
  { root: 38, scale: [0, 1, 3, 7, 8], motif: [0, null, 1, 3, 7, 8, 7, 3], tempo: 72 },
];

export class AudioEngine {
  constructor(settings, onError) {
    this.settings = settings;
    this.onError = onError;
    this.context = null;
    this.chapter = 0;
    this.boss = false;
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
    this.music.gain.setTargetAtTime(this.settings.music * (this.paused ? 0.45 : 1), t, 0.3);
    this.effects.gain.setTargetAtTime(this.settings.effects, t, 0.05);
  }

  theme(chapter, boss = false) {
    if (chapter !== this.chapter || boss !== this.boss) {
      this.chapter = chapter; this.boss = boss; this.beat = 0;
      if (this.context) this.nextBeat = this.context.currentTime + 0.1;
    }
  }

  setPaused(paused) { this.paused = paused; this.applySettings(); }
  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }

  tone(midi, start, duration, volume = 0.08, type = 'triangle', output = this.music, detune = 0) {
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
    this.tone(midi + 12, time, duration * 0.55, volume * 0.32, 'sine', this.music, 8);
    this.tone(midi + 19, time, duration * 0.25, volume * 0.18, 'sine', this.music, -13);
  }

  schedule() {
    const c = this.context;
    if (!c || c.state !== 'running' || !this.settings.sound) { if (c) this.nextBeat = c.currentTime + 0.1; return; }
    if (this.nextBeat < c.currentTime - 0.3) this.nextBeat = c.currentTime + 0.05;
    const theme = THEMES[this.chapter], tempo = this.boss ? theme.tempo * 1.48 : theme.tempo;
    const step = 60 / tempo / 2;
    while (this.nextBeat < c.currentTime + 0.3) {
      const beat = this.beat, t = this.nextBeat;
      if (beat % 16 === 0) {
        const chord = [0, -2, 3, -5][Math.floor(beat / 16) % 4];
        for (const [interval, volume] of [[0, 0.11], [7, 0.05], [12, 0.035]]) {
          this.tone(theme.root + chord + interval, t, step * 18, volume, 'triangle');
          this.tone(theme.root + chord + interval, t, step * 18, volume * 0.45, 'sine', this.music, -6);
        }
      }
      if (beat % 2 === 0) {
        const note = theme.motif[Math.floor(beat / 2) % theme.motif.length];
        if (note !== null) this.bell(theme.root + 24 + note, t, this.boss ? 0.035 : 0.065, step * 6);
      }
      if (this.boss) {
        this.tone(theme.root + (beat % 4 === 0 ? 0 : 12), t, step * 0.8, 0.085, 'triangle');
        if (beat % 4 === 0 || beat % 4 === 1) this.drum(t, beat % 4 === 0 ? 0.18 : 0.09, this.music);
        if (beat % 2) this.noise(t, 0.12, 0.025, 2400, this.music);
      } else if (beat % 8 === 0) this.drum(t, 0.045, this.music);
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
    if (name === 'step') {
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
