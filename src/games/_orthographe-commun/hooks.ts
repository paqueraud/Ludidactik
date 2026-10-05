/** Petits hooks communs aux jeux d'orthographe. */
import { useEffect, useRef, useState } from 'react';

/**
 * Compte à rebours qui se fige pendant la pause. Renvoie la fraction restante (1 → 0).
 * `cle` relance le compte (nouvelle photo, nouveau mot…). `onFin` est appelé une fois à 0.
 */
export function useCompteARebours({
  actif,
  dureeMs,
  paused,
  cle,
  onFin,
}: {
  actif: boolean;
  dureeMs: number;
  paused: boolean;
  cle: unknown;
  onFin: () => void;
}) {
  const [restant, setRestant] = useState(1);
  const ecoule = useRef(0);
  const finRef = useRef(onFin);
  finRef.current = onFin;

  useEffect(() => {
    ecoule.current = 0;
    setRestant(1);
  }, [cle]);

  useEffect(() => {
    if (!actif || paused || !Number.isFinite(dureeMs)) return;
    let precedent = performance.now();
    const t = setInterval(() => {
      const maintenant = performance.now();
      ecoule.current += maintenant - precedent;
      precedent = maintenant;
      const r = Math.max(0, 1 - ecoule.current / dureeMs);
      setRestant(r);
      if (r <= 0) {
        clearInterval(t);
        finRef.current();
      }
    }, 50);
    return () => clearInterval(t);
  }, [actif, paused, dureeMs, cle]);

  return restant;
}
