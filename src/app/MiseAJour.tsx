/// <reference types="vite-plugin-pwa/react" />
/**
 * Service worker (hors-ligne) : enregistrement et bandeau « Nouvelle version : recharger ».
 * On ne recharge jamais de force (une partie peut être en cours) : c'est l'utilisateur qui décide.
 */
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function MiseAJour() {
  const {
    needRefresh: [aMettreAJour, setAMettreAJour],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // vérifie s'il existe une nouvelle version toutes les heures (application laissée ouverte)
      if (reg) setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
  if (!aMettreAJour) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-2 rounded-2xl bg-ink p-3 text-cream shadow-xl"
    >
      <p className="flex-1 font-bold">Nouvelle version de Ludidactik disponible !</p>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="flex min-h-12 items-center gap-1 rounded-xl bg-sun px-3 font-titre font-bold text-ink"
      >
        <RefreshCw size={18} aria-hidden /> Recharger
      </button>
      <button
        type="button"
        onClick={() => setAMettreAJour(false)}
        className="flex size-12 items-center justify-center rounded-xl"
        aria-label="Plus tard"
      >
        <X aria-hidden />
      </button>
    </div>
  );
}
