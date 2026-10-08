/**
 * Effets sonores courts et doux (type marimba), synthétisés en Web Audio :
 * aucun fichier, aucun réseau, poids nul. Chaque son a toujours un équivalent visuel dans les jeux.
 */
export type SfxName =
  | 'pop'
  | 'juste'
  | 'faux'
  | 'etoile'
  | 'fanfare'
  | 'galop'
  | 'turbo'
  | 'glisse'
  | 'monte'
  | 'lame'
  | 'piece'
  | 'tic';

class SfxService {
  enabled = true;
  private ctx: AudioContext | null = null;

  private audio(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx ??= new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Note de marimba : sinus + harmonique, attaque rapide, déclin court. */
  private note(freq: number, start: number, dur = 0.25, gain = 0.18, type: OscillatorType = 'sine') {
    const ctx = this.audio();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(ctx.destination);
    for (const [mult, amp] of [
      [1, 1],
      [4, 0.12],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq * mult, t0);
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
  }

  private noise(start: number, dur: number, gain = 0.08, freq = 800) {
    const ctx = this.audio();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  play(name: SfxName) {
    switch (name) {
      case 'pop':
        return this.note(880, 0, 0.08, 0.1);
      case 'tic':
        return this.note(1320, 0, 0.05, 0.06);
      case 'juste':
        this.note(659, 0, 0.18);
        return this.note(988, 0.09, 0.3);
      case 'faux':
        this.note(330, 0, 0.2, 0.12, 'triangle');
        return this.note(262, 0.12, 0.3, 0.12, 'triangle');
      case 'etoile':
        return [1047, 1319, 1568].forEach((f, i) => this.note(f, i * 0.07, 0.35, 0.14));
      case 'piece':
        this.note(1568, 0, 0.08, 0.1);
        return this.note(2093, 0.06, 0.25, 0.1);
      case 'fanfare':
        return [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
          this.note(f, i * 0.11, i === 5 ? 0.6 : 0.2, 0.16),
        );
      case 'galop':
        return [0, 0.09, 0.22, 0.31].forEach((t) => this.noise(t, 0.05, 0.12, 300));
      case 'turbo':
        this.noise(0, 0.35, 0.06, 1800);
        return [784, 988, 1175].forEach((f, i) => this.note(f, i * 0.05, 0.2, 0.1));
      case 'glisse':
        return [523, 466, 415, 370].forEach((f, i) => this.note(f, i * 0.06, 0.15, 0.1, 'triangle'));
      case 'monte':
        return [523, 587, 659].forEach((f, i) => this.note(f, i * 0.06, 0.15, 0.12));
      case 'lame':
        this.noise(0, 0.25, 0.1, 2500);
        return this.note(196, 0.05, 0.3, 0.1, 'triangle');
    }
  }
}

export const sfx = new SfxService();
export type { SfxService };

/** Réglage « Vibrations » (espace parents). */
export const haptique = { enabled: true };

/**
 * Vibration légère aux moments clés (mobile Android) : sans effet si le réglage est coupé,
 * si l'appareil ne sait pas vibrer (iOS, ordinateur) ou si l'utilisateur préfère moins d'animations.
 */
export function vibrate(pattern: number | number[] = 30) {
  if (!haptique.enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
    return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* sans effet */
  }
}
