/**
 * Voix (ARCHITECTURE §8).
 * - TTS : speechSynthesis, meilleure voix fr-FR disponible, débit réglable.
 * - STT : SpeechRecognition (opt-in parent), avec repli gracieux si indisponible.
 * - Voix du parent enregistrée : prioritaire sur le TTS pour les listes parentales.
 */
import { db } from './storage/db';

const PREFERRED = [
  /google.*fran/i,
  /denise.*natural/i,
  /henri.*natural/i,
  /natural/i,
  /amélie|amelie/i,
  /thomas/i,
  /audrey/i,
  /hortense/i,
];

export interface SpeakOptions {
  rate?: number;
  lang?: string;
  /** N'interrompt pas la phrase en cours (file d'attente). */
  queue?: boolean;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

class SpeechService {
  private voice: SpeechSynthesisVoice | null = null;
  private enVoice: SpeechSynthesisVoice | null = null;
  rate = 0.9;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (this.ttsAvailable) {
      this.pickVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.pickVoices());
    }
  }

  get ttsAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  get sttAvailable(): boolean {
    return (
      typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  private pickVoices() {
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
    const frFR = fr.filter((v) => v.lang.toLowerCase() === 'fr-fr');
    const pool = frFR.length ? frFR : fr;
    this.voice = PREFERRED.map((re) => pool.find((v) => re.test(v.name))).find(Boolean) ?? pool[0] ?? null;
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en-gb'));
    this.enVoice = en[0] ?? voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? null;
  }

  /** Lit un texte ; la promesse se résout à la fin de la lecture (ou tout de suite sans TTS). */
  speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    if (!this.ttsAvailable || !text.trim()) return Promise.resolve();
    const synth = window.speechSynthesis;
    if (!opts.queue) this.stop();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      const lang = opts.lang ?? 'fr-FR';
      u.lang = lang;
      const v = lang.startsWith('en') ? this.enVoice : this.voice;
      if (v) u.voice = v;
      u.rate = opts.rate ?? this.rate;
      u.pitch = 1.05;
      // sécurité : certains navigateurs n'émettent jamais « end »
      const timeout = setTimeout(resolve, 1500 + text.length * 120);
      const done = () => {
        clearTimeout(timeout);
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      synth.speak(u);
    });
  }

  /** Protocole de dictée de classe : mot — phrase — mot. */
  async dictate(word: string, sentence?: string, audioKey?: string): Promise<void> {
    if (audioKey && (await this.playRecording(audioKey))) return;
    await this.speak(word, { rate: this.rate * 0.85 });
    if (sentence) {
      await pause(350);
      await this.speak(sentence, { queue: true });
      await pause(350);
      await this.speak(word, { queue: true, rate: this.rate * 0.85 });
    }
  }

  /** Joue un enregistrement parent. Renvoie false s'il n'existe pas. */
  async playRecording(key: string): Promise<boolean> {
    const row = await db.audio.get(key);
    if (!row) return false;
    this.stop();
    const url = URL.createObjectURL(row.blob);
    const audio = new Audio(url);
    this.currentAudio = audio;
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
    URL.revokeObjectURL(url);
    return true;
  }

  stop() {
    if (this.ttsAvailable) window.speechSynthesis.cancel();
    this.currentAudio?.pause();
    this.currentAudio = null;
  }

  /**
   * Écoute une réponse orale. Renvoie les transcriptions possibles, ou null si la
   * reconnaissance est indisponible / refusée (le jeu bascule alors sur le repli écrit).
   */
  listen(opts: { lang?: string; timeoutMs?: number } = {}): Promise<string[] | null> {
    if (!this.sttAvailable) return Promise.resolve(null);
    const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return Promise.resolve(null);
    return new Promise((resolve) => {
      const rec = new Ctor();
      rec.lang = opts.lang ?? 'fr-FR';
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      let settled = false;
      const finish = (v: string[] | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(t);
        resolve(v);
      };
      const t = setTimeout(() => {
        rec.abort();
        finish([]);
      }, opts.timeoutMs ?? 7000);
      rec.onresult = (e) => {
        const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
        finish(alts);
      };
      rec.onerror = () => finish(null);
      rec.onend = () => finish([]);
      try {
        rec.start();
      } catch {
        finish(null);
      }
    });
  }
}

export const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const speech = new SpeechService();
export type { SpeechService };
