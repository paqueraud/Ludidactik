/**
 * Session : profil connecté. Conservé pour l'onglet (sessionStorage) : fermer le navigateur
 * redemande le mot de passe, mais toutes les données restent dans IndexedDB.
 */
import { create } from 'zustand';

const KEY = 'ludidactik.session';

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

interface SessionState {
  profileId: string | null;
  login(id: string): void;
  logout(): void;
}

export const useSession = create<SessionState>((set) => ({
  profileId: read(),
  login(id) {
    try {
      sessionStorage.setItem(KEY, id);
    } catch {
      /* navigation privée */
    }
    set({ profileId: id });
  },
  logout() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* navigation privée */
    }
    set({ profileId: null });
  },
}));
