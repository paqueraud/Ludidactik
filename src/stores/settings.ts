/** Réglages de l'appareil (modifiés depuis l'espace parents), persistés dans IndexedDB. */
import { create } from 'zustand';
import type { ProgrammeHG } from '@/content';
import { sfx } from '@/services/sfx';
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
}

export const DEFAULT_SETTINGS: Settings = {
  programmeHG: '2020',
  sons: true,
  police: 'normale',
  debitVoix: 0.9,
  micro: false,
  lectureAuto: 'auto',
};

interface SettingsState extends Settings {
  loaded: boolean;
  load(): Promise<void>;
  update(patch: Partial<Settings>): Promise<void>;
}

function apply(s: Settings) {
  sfx.enabled = s.sons;
  speech.rate = s.debitVoix;
  if (typeof document !== 'undefined') document.documentElement.dataset.font = s.police;
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
