/**
 * Original synthesized sound effects and background music (Web Audio API).
 * No audio files: every sound is generated, so there is nothing to license.
 * Nothing plays until the user has interacted with the page (unlock()).
 */

export type Sfx =
  | "click"
  | "join"
  | "tick"
  | "go"
  | "reveal"
  | "flip"
  | "correct"
  | "wrong"
  | "score"
  | "win"
  | "whoosh"
  | "copy";

export type MusicMood = "calm" | "suspense";

export interface AudioSettings {
  sound: boolean;
  music: boolean;
  volume: number; // 0..1
}

const STORAGE_KEY = "chorpolice:audio";
const DEFAULTS: AudioSettings = { sound: true, music: false, volume: 0.7 };

// Bhairav-flavoured scale on D (Sa = D3), as frequencies.
const SA = 146.83;
const SCALE = [0, 1, 4, 5, 7, 8, 11, 12, 13, 16].map((s) => SA * 2 ** (s / 12));

type Wave = OscillatorType;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;
  private listeners = new Set<() => void>();
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beat = 0;
  private melodyIndex = 4;
  mood: MusicMood = "calm";
  settings: AudioSettings = DEFAULTS;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) this.settings = { ...DEFAULTS, ...saved };
    } catch {
      /* ignore corrupt settings */
    }
  }

  get unlocked() {
    return this.ctx !== null;
  }

  /** Call from a user gesture. Creates the AudioContext the first time. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
    this.applySettings();
    this.emit();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSettings = () => this.settings;

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  update(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.applySettings();
    this.emit();
  }

  private applySettings() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.volume, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.settings.sound ? 0.9 : 0, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.settings.music ? 0.32 : 0, t, 0.4);
    if (this.settings.music) this.startMusic();
    else if (this.musicTimer) setTimeout(() => !this.settings.music && this.stopMusic(), 1500);
  }

  setMood(mood: MusicMood) {
    this.mood = mood;
  }

  // --- primitives ----------------------------------------------------------

  private tone(
    freq: number,
    start: number,
    dur: number,
    {
      type = "sine" as Wave,
      gain = 0.3,
      attack = 0.005,
      slideTo,
      vibrato = 0,
      filter,
      bus,
    }: {
      type?: Wave;
      gain?: number;
      attack?: number;
      slideTo?: number;
      vibrato?: number;
      filter?: number;
      bus?: AudioNode;
    } = {},
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 6;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(start);
      lfo.stop(start + dur + 0.05);
    }
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    let node: AudioNode = osc.connect(env);
    if (filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = filter;
      node = node.connect(lp);
    }
    node.connect(bus ?? this.sfxBus);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private noise(start: number, dur: number, { gain = 0.2, from = 800, to = 4000, q = 1, bus }: { gain?: number; from?: number; to?: number; q?: number; bus?: AudioNode } = {}) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = q;
    bp.frequency.setValueAtTime(from, start);
    bp.frequency.exponentialRampToValueAtTime(to, start + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + dur * 0.3);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bp).connect(env).connect(bus ?? this.sfxBus);
    src.start(start);
    src.stop(start + dur + 0.05);
  }

  // --- sound effects ---------------------------------------------------------

  play(name: Sfx) {
    if (!this.ctx || !this.settings.sound) return;
    const t = this.ctx.currentTime + 0.01;
    const n = (semi: number) => 523.25 * 2 ** (semi / 12); // relative to C5

    switch (name) {
      case "click":
        this.tone(900, t, 0.06, { type: "triangle", gain: 0.12, slideTo: 600 });
        break;
      case "copy":
        this.tone(n(7), t, 0.08, { type: "triangle", gain: 0.15 });
        this.tone(n(12), t + 0.07, 0.14, { type: "triangle", gain: 0.15 });
        break;
      case "join":
        [0, 4, 7, 12].forEach((s, i) =>
          this.tone(n(s), t + i * 0.07, 0.25, { type: "triangle", gain: 0.16 }),
        );
        break;
      case "tick":
        this.tone(220, t, 0.18, { type: "sine", gain: 0.5, slideTo: 90 });
        this.tone(1320, t, 0.05, { type: "square", gain: 0.05, filter: 3000 });
        break;
      case "go":
        [0, 4, 7, 12, 16].forEach((s) =>
          this.tone(n(s - 12), t, 1.4, { type: "sawtooth", gain: 0.07, attack: 0.04, filter: 2400, vibrato: 3 }),
        );
        this.tone(80, t, 0.6, { type: "sine", gain: 0.6, slideTo: 40 });
        this.noise(t, 1.2, { gain: 0.15, from: 6000, to: 9000 });
        break;
      case "flip":
        this.noise(t, 0.25, { gain: 0.25, from: 600, to: 3500, q: 2 });
        break;
      case "whoosh":
        this.noise(t, 0.5, { gain: 0.2, from: 300, to: 2500, q: 1.5 });
        break;
      case "reveal":
        this.noise(t, 0.6, { gain: 0.15, from: 500, to: 6000 });
        [0, 7, 12, 16, 19, 24].forEach((s, i) =>
          this.tone(n(s), t + 0.25 + i * 0.05, 0.9, { type: "triangle", gain: 0.1 }),
        );
        this.tone(60, t + 0.25, 0.7, { type: "sine", gain: 0.5, slideTo: 35 });
        break;
      case "correct":
        [0, 4, 7, 12, 16].forEach((s, i) =>
          this.tone(n(s), t + i * 0.09, 0.45, { type: "square", gain: 0.07, filter: 3500 }),
        );
        this.tone(n(24), t + 0.5, 0.8, { type: "triangle", gain: 0.12, vibrato: 6 });
        break;
      case "wrong":
        // Sad trombone: "wah wah wah waaah"
        [-5, -6, -7].forEach((s, i) =>
          this.tone(n(s - 12), t + i * 0.42, 0.38, { type: "sawtooth", gain: 0.12, attack: 0.04, filter: 1200 }),
        );
        this.tone(n(-8 - 12), t + 1.26, 1.2, { type: "sawtooth", gain: 0.12, attack: 0.04, filter: 1100, vibrato: 8 });
        break;
      case "score":
        this.tone(n(19), t, 0.07, { type: "square", gain: 0.05, filter: 4000 });
        break;
      case "win":
        [
          [0, 0.0, 0.18],
          [4, 0.18, 0.18],
          [7, 0.36, 0.18],
          [12, 0.54, 0.5],
          [7, 1.04, 0.18],
          [12, 1.22, 1.1],
        ].forEach(([s, at, d]) => {
          this.tone(n(s), t + at, d, { type: "sawtooth", gain: 0.08, filter: 3000, attack: 0.02 });
          this.tone(n(s - 12), t + at, d, { type: "triangle", gain: 0.1 });
        });
        this.noise(t + 1.2, 1.4, { gain: 0.1, from: 5000, to: 9000 });
        break;
    }
  }

  // --- background music ----------------------------------------------------

  private startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
  }

  private stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private pluck(freq: number, at: number, gain: number) {
    this.tone(freq, at, 1.6, { type: "sawtooth", gain, attack: 0.01, filter: 1400, bus: this.musicBus });
    this.tone(freq * 2, at, 0.9, { type: "sine", gain: gain * 0.5, bus: this.musicBus });
  }

  private scheduleMusic() {
    const ctx = this.ctx!;
    const suspense = this.mood === "suspense";
    const step = suspense ? 0.32 : 0.5;
    while (this.nextBeat < ctx.currentTime + 0.4) {
      const at = this.nextBeat;
      const b = this.beat % 16;
      // Tanpura-style drone pattern: Pa Sa' Sa' Sa
      if (b % 4 === 0) {
        const drone = [SA * 1.5, SA * 2, SA * 2, SA][(b / 4) % 4];
        this.tone(drone, at, step * 4.2, { type: "sawtooth", gain: 0.05, attack: 0.08, filter: 900, bus: this.musicBus });
      }
      // Soft melodic wander through the scale
      if (b % (suspense ? 3 : 2) === 0 && Math.random() < 0.7) {
        this.melodyIndex = Math.max(0, Math.min(SCALE.length - 1, this.melodyIndex + [-2, -1, 1, 2, 0][Math.floor(Math.random() * 5)]));
        this.pluck(SCALE[this.melodyIndex] * 2, at, 0.035);
      }
      // Low tabla-ish pulse; faster and heavier in suspense
      if (suspense ? b % 2 === 0 : b % 8 === 0) {
        this.tone(suspense ? 95 : 80, at, 0.25, { type: "sine", gain: suspense ? 0.3 : 0.2, slideTo: 45, bus: this.musicBus });
      }
      if (suspense && b % 8 === 6) {
        this.noise(at, 0.08, { gain: 0.06, from: 2500, to: 3000, q: 4, bus: this.musicBus });
      }
      this.nextBeat += step;
      this.beat++;
    }
  }
}

export const audio = new AudioEngine();
