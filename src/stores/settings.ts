/** Réglages de l'appareil (modifiés depuis l'espace parents), persistés dans IndexedDB. */
import { create } from 'zustand';
import type { ProgrammeHG } from '@/content';
import { musique } from '@/services/musique';
import { haptique, sfx } from '@/services/sfx';
import { speech } from '@/services/speech';
import { db } from '@/services/storage/db';

export interface Settings {
  /** Programme d'histoire-géographie / sciences : 2020 (en vigueur en 2026-2027) ou 2026 (rentrée 2027). */
  programmeHG: ProgrammeHG;
  sons: boolean;
  police: 'normale' | 'dyslexie';
  debitVoix: number;
  /** Reconnaissance vocale du navigateur (opt-in parent : l'audio peut être traité en ligne par le navigateur). */
  micro: boolean;
  /** Lecture automatique des questions : « auto » = activée pour le CP-CE1. */
  lectureAuto: 'auto' | 'oui' | 'non';
  /** Département de l'élève (code « 75 », « 2A », « 971 »…), pour la géographie de proximité. */
  departement: string | null;
  /** Afficher les questions de sciences sur la puberté (items `meta.puberte`) — masquées par défaut. */
  puberte: boolean;
  /** Musique de fond douce (désactivée par défaut). */
  musique: boolean;
  /** Garder la musique pendant les parties (sinon elle s'efface pendant le jeu). */
  musiqueEnJeu: boolean;
  /** Vibrations aux moments clés (appareils compatibles). */
  vibrations: boolean;
  /** Apparence : automatique (réglage de l'appareil), claire ou sombre. */
  theme: 'auto' | 'clair' | 'sombre';
  /** Classements entre les profils de l'appareil (sinon : chacun contre ses propres records). */
  competition: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  programmeHG: '2020',
  sons: true,
  police: 'normale',
  debitVoix: 0.9,
  micro: false,
  lectureAuto: 'auto',
  departement: null,
  puberte: false,
  competition: true,
  musique: false,
  musiqueEnJeu: false,
  vibrations: true,
  theme: 'auto',
};

/** Couleur de la barre du navigateur selon le thème effectif. */
const THEME_COLOR = { clair: '#4FC3F7', sombre: '#16243A' };

interface SettingsState extends Settings {
  loaded: boolean;
  load(): Promise<void>;
  update(patch: Partial<Settings>): Promise<void>;
}

export function apply(s: Settings) {
  sfx.enabled = s.sons;
  speech.rate = s.debitVoix;
  haptique.enabled = s.vibrations;
  musique.enabled = s.musique;
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.font = s.police;
  if (s.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  // barre du navigateur : on fixe la couleur si le thème est forcé, sinon les balises media d'index.html
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    m.dataset.media ??= m.getAttribute('media') ?? '';
    const media = m.dataset.media;
    if (s.theme === 'auto') {
      if (media) m.setAttribute('media', media);
      m.content = media.includes('dark') ? THEME_COLOR.sombre : THEME_COLOR.clair;
    } else {
      m.removeAttribute('media');
      m.content = THEME_COLOR[s.theme];
    }
  }
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  async load() {
    const row = await db.settings.get('app');
    const s = { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
    apply(s);
    set({ ...s, loaded: true });
  },
  async update(patch) {
    const { loaded: _l, load: _a, update: _b, ...current } = get();
    const next = { ...current, ...patch };
    apply(next);
    set(patch);
    await db.settings.put({ key: 'app', value: next });
  },
}));
