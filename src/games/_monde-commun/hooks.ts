/** Hooks communs aux jeux n° 50 à 56. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Rng, createRng } from '@/engine/rng';
import { melangeDesordonne } from './outils';

/** Générateur aléatoire stable pour la durée du composant. */
export function useRng(): Rng {
  return useMemo(() => createRng(Date.now() ^ Math.floor(Math.random() * 1e9)), []);
}

/**
 * Remettre des éléments dans l'ordre, « toucher puis toucher » :
 * on touche les cartes dans l'ordre voulu, elles remplissent les cases de gauche à droite ;
 * toucher une case pleine renvoie sa carte dans la réserve. Les cases `verrouillees` (indice,
 * cartes déjà bien placées en Facile) ne bougent plus.
 * Clavier : chiffres 1-9 = carte n° k de la réserve, Retour arrière = retirer la dernière carte.
 * Monter le composant avec `key={item.id}` pour repartir de zéro à chaque item.
 */
export function useOrdre({ n, rng, actif }: { n: number; rng: Rng; actif: boolean }) {
  const [reserve] = useState<number[]>(() => melangeDesordonne(n, rng));
  /** cases[pos] = indice d'origine de l'élément posé (null = vide). */
  const [cases, setCases] = useState<(number | null)[]>(() => Array(n).fill(null));
  const [verrous, setVerrous] = useState<boolean[]>(() => Array(n).fill(false));
  const poses = useMemo(() => new Set(cases.filter((c): c is number => c !== null)), [cases]);
  const plein = cases.every((c) => c !== null);

  const placer = useCallback(
    (orig: number) => {
      if (!actif) return;
      setCases((cs) => {
        if (cs.includes(orig)) return cs;
        const libre = cs.findIndex((c) => c === null);
        if (libre < 0) return cs;
        const out = [...cs];
        out[libre] = orig;
        return out;
      });
    },
    [actif],
  );

  const retirer = useCallback(
    (pos: number) => {
      if (!actif || verrous[pos]) return;
      setCases((cs) => {
        if (cs[pos] === null) return cs;
        const out = [...cs];
        out[pos] = null;
        return out;
      });
    },
    [actif, verrous],
  );

  const retirerDernier = useCallback(() => {
    if (!actif) return;
    setCases((cs) => {
      for (let p = cs.length - 1; p >= 0; p--) {
        if (cs[p] !== null && !verrous[p]) {
          const out = [...cs];
          out[p] = null;
          return out;
        }
      }
      return cs;
    });
  }, [actif, verrous]);

  /** Vide les cases non verrouillées. */
  const effacer = useCallback(() => {
    setCases((cs) => cs.map((c, p) => (verrous[p] ? c : null)));
  }, [verrous]);

  /** Verrouille les cases bien placées et renvoie les autres dans la réserve (Facile, 2e essai). */
  const garderBienPlaces = useCallback(() => {
    setCases((cs) => {
      const v = cs.map((c, p) => c === p);
      setVerrous(v);
      return cs.map((c, p) => (v[p] ? c : null));
    });
  }, []);

  /** Indice : pose et verrouille l'élément attendu dans la première case non verrouillée. */
  const indice = useCallback(() => {
    setCases((cs) => {
      const pos = cs.findIndex((c, p) => c !== p);
      if (pos < 0) return cs;
      const out = cs.map((c) => (c === pos ? null : c));
      out[pos] = pos;
      setVerrous((v) => v.map((x, p) => x || p === pos));
      return out;
    });
  }, []);

  // Clavier : chiffres et retour arrière
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
      if (/^[1-9]$/.test(e.key)) {
        const k = Number(e.key) - 1;
        const libres = reserve.filter((o) => !poses.has(o));
        const orig = libres[k];
        if (orig !== undefined) {
          e.preventDefault();
          placer(orig);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        retirerDernier();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, reserve, poses, placer, retirerDernier]);

  /** Cartes encore dans la réserve, dans l'ordre d'affichage. */
  const libres = reserve.filter((o) => !poses.has(o));

  return {
    reserve,
    libres,
    cases,
    verrous,
    plein,
    placer,
    retirer,
    effacer,
    garderBienPlaces,
    indice,
    propose: cases.map((c) => c ?? -1),
  };
}

/**
 * Chronomètre global (secondes restantes) qui se fige en pause ou quand `actif` est faux.
 * `onFin` est appelé une fois à 0. `ajouter` donne du temps.
 */
export function useChronometre({
  dureeS,
  actif,
  paused,
  onFin,
}: {
  dureeS: number;
  actif: boolean;
  paused: boolean;
  onFin: () => void;
}) {
  const [restantMs, setRestantMs] = useState(dureeS * 1000);
  const fin = useRef(onFin);
  fin.current = onFin;
  const termine = useRef(false);

  useEffect(() => {
    if (!actif || paused || termine.current || !Number.isFinite(dureeS)) return;
    let t0 = performance.now();
    const id = setInterval(() => {
      const t = performance.now();
      const d = t - t0;
      t0 = t;
      setRestantMs((r) => {
        const n = Math.max(0, r - d);
        if (n === 0 && !termine.current) {
          termine.current = true;
          setTimeout(() => fin.current(), 0);
        }
        return n;
      });
    }, 100);
    return () => clearInterval(id);
  }, [actif, paused, dureeS]);

  return { restantMs, fraction: Number.isFinite(dureeS) ? restantMs / (dureeS * 1000) : 1 };
}
