/**
 * Session parent : ouverte après le code + la question de calcul, elle expire après 10 minutes
 * d'inactivité. Gardée en mémoire seulement : recharger ou fermer l'onglet la referme.
 */
import { create } from 'zustand';

export const PARENT_SESSION_MS = 10 * 60_000;

interface ParentSessionState {
  /** Instant d'expiration (0 = verrouillé). */
  expire: number;
  unlock(now?: number): void;
  /** Prolonge la session à chaque interaction. */
  touch(now?: number): void;
  lock(): void;
  isOpen(now?: number): boolean;
}

export const useParentSession = create<ParentSessionState>((set, get) => ({
  expire: 0,
  unlock(now = Date.now()) {
    set({ expire: now + PARENT_SESSION_MS });
  },
  touch(now = Date.now()) {
    if (get().isOpen(now)) set({ expire: now + PARENT_SESSION_MS });
  },
  lock() {
    set({ expire: 0 });
  },
  isOpen(now = Date.now()) {
    return get().expire > now;
  },
}));
