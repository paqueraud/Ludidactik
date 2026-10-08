/**
 * Musique de fond douce, générée en Web Audio (aucun fichier) : nappe (pads) + marimba pentatonique,
 * boucle de 4 accords. Désactivée par défaut (réglage parent + bouton 🎵 de l'enfant).
 * Elle s'efface pendant la lecture vocale et, sauf réglage contraire, pendant les parties.
 */

/** Accords (fréquences en Hz) : Do – La m – Fa – Sol, voix graves pour la nappe. */
const ACCORDS = [
  [130.81, 164.81, 196.0],
  [110.0, 130.81, 164.81],
  [87.31, 110.0, 130.81],
  [98.0, 123.47, 146.83],
];
/** Gamme pentatonique de Do (marimba). */
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
const TEMPS = 0.6; // secondes par temps
const MESURE = 8 * TEMPS; // un accord toutes les 8 croches
const VOLUME = 0.05;

type Raison = 'voix' | 'partie';

class MusiqueService {
  /** Réglage : musique activée. */
  private actif = false;
  private muets = new Set<Raison>();
  private ctx: AudioContext | null = null;
  private maitre: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private prochaine = 0;
  private mesure = 0;
  private graine = 7;

  get enabled() {
    return this.actif;
  }

  set enabled(v: boolean) {
    this.actif = v;
    this.mettreAJour();
  }

  /** Coupe (ou rétablit) la musique pour une raison donnée (lecture vocale, partie en cours). */
  silence(raison: Raison, oui: boolean) {
    if (oui) this.muets.add(raison);
    else this.muets.delete(raison);
    this.mettreAJour();
  }

  /** Joue-t-elle en ce moment (pour les tests et l'interface) ? */
  get joue() {
    return this.timer !== null && this.muets.size === 0;
  }

  private audio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) {
      this.ctx = new Ctor();
      this.maitre = this.ctx.createGain();
      this.maitre.gain.value = 0;
      const filtre = this.ctx.createBiquadFilter();
      filtre.type = 'lowpass';
      filtre.frequency.value = 2400;
      this.maitre.connect(filtre).connect(this.ctx.destination);
      // politique d'autoplay : le contexte démarre au premier geste de l'enfant
      const reprendre = () => void this.ctx?.resume().catch(() => {});
      window.addEventListener('pointerdown', reprendre, { once: true });
      window.addEventListener('keydown', reprendre, { once: true });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private mettreAJour() {
    if (!this.actif) {
      this.fondu(0);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      return;
    }
    const ctx = this.audio();
    if (!ctx) return;
    if (!this.timer) {
      this.prochaine = ctx.currentTime + 0.1;
      this.timer = setInterval(() => this.planifier(), 250);
      this.planifier();
    }
    this.fondu(this.muets.size ? 0 : VOLUME);
  }

  private fondu(cible: number) {
    if (!this.ctx || !this.maitre) return;
    const t = this.ctx.currentTime;
    this.maitre.gain.cancelScheduledValues(t);
    this.maitre.gain.setValueAtTime(this.maitre.gain.value, t);
    this.maitre.gain.linearRampToValueAtTime(cible, t + 0.6);
  }

  /** Pseudo-hasard déterministe (mélodie variée mais douce). */
  private hasard() {
    this.graine = (this.graine * 16807) % 2147483647;
    return this.graine / 2147483647;
  }

  /** Planifie les mesures des 2 prochaines secondes (ordonnanceur « look-ahead »). */
  private planifier() {
    const ctx = this.ctx;
    if (!ctx || !this.maitre) return;
    // onglet en arrière-plan : on ne rattrape pas le retard
    if (this.prochaine < ctx.currentTime) this.prochaine = ctx.currentTime + 0.05;
    while (this.prochaine < ctx.currentTime + 2) {
      const accord = ACCORDS[this.mesure % ACCORDS.length]!;
      for (const f of accord) this.pad(f, this.prochaine, MESURE);
      for (let i = 0; i < 8; i++) {
        if (this.hasard() < (i % 2 === 0 ? 0.55 : 0.25)) {
          const f = PENTA[Math.floor(this.hasard() * PENTA.length)]!;
          this.marimba(f, this.prochaine + i * TEMPS);
        }
      }
      this.prochaine += MESURE;
      this.mesure++;
    }
  }

  private pad(freq: number, t0: number, dur: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.25, t0 + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.6);
    g.connect(this.maitre!);
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(g);
      o.start(t0);
      o.stop(t0 + dur + 0.7);
    }
  }

  private marimba(freq: number, t0: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    g.connect(this.maitre!);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + 0.75);
  }
}

export const musique = new MusiqueService();
export type { MusiqueService };
