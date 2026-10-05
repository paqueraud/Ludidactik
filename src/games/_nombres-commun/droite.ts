/** Calculs d'une demi-droite graduée (Funambule, Bataille navale) : graduations, positions, écritures. */
import type { Level, NumberLineItem } from '@/content/schemas';
import { formatNumber, roundTo } from '@/engine/answer';
import type { Rng } from '@/engine/rng';

/** Marges et largeur utile dans un viewBox de 1000 de large. */
export const X0 = 50;
export const X1 = 950;

export const versX = (it: NumberLineItem, v: number) => X0 + ((v - it.min) / (it.max - it.min)) * (X1 - X0);
export const depuisX = (it: NumberLineItem, x: number) => it.min + ((x - X0) / (X1 - X0)) * (it.max - it.min);

/** Valeur d'une petite graduation. */
export const sousPas = (it: NumberLineItem) => it.step / (it.subdivisions ?? 1);

/** Arrondi au multiple de `pas` le plus proche (depuis `min`), borné à la droite. */
export function aimanter(it: NumberLineItem, v: number, pas: number): number {
  const k = Math.round((v - it.min) / pas);
  return roundTo(Math.max(it.min, Math.min(it.max, it.min + k * pas)), 6);
}

/** Pas de déplacement du curseur selon le niveau (Plus loin : demi-graduation, il faut estimer). */
export const pasCurseur = (it: NumberLineItem, level: Level) =>
  level === 'plus_loin' && (it.subdivisions ?? 1) > 1 ? sousPas(it) / 2 : sousPas(it);

/** Graduations principales et secondaires (valeurs). Les secondaires sont omises si trop nombreuses. */
export function graduations(it: NumberLineItem): { principales: number[]; secondaires: number[] } {
  const principales: number[] = [];
  const n = Math.round((it.max - it.min) / it.step);
  for (let i = 0; i <= n && i <= 200; i++) principales.push(roundTo(it.min + i * it.step, 6));
  const secondaires: number[] = [];
  const sub = it.subdivisions ?? 1;
  if (sub > 1 && n * sub <= 300) {
    for (let i = 0; i < n; i++)
      for (let j = 1; j < sub; j++) secondaires.push(roundTo(it.min + i * it.step + (j * it.step) / sub, 6));
  }
  return { principales, secondaires };
}

/** Graduations principales étiquetées selon le niveau : toutes, une sur deux, ou seulement les bornes. */
export function etiquetees(it: NumberLineItem, level: Level): Set<number> {
  const { principales } = graduations(it);
  const dernier = principales.length - 1;
  // au-delà de 12 étiquettes, on n'en garde qu'une sur deux pour la lisibilité
  const saut = principales.length > 12 ? 2 : 1;
  return new Set(
    principales.filter((_, i) => {
      if (i === 0 || i === dernier) return true;
      if (level === 'plus_loin') return false;
      if (level === 'normal') return principales.length <= 5 || i % (2 * saut) === 0;
      return i % saut === 0;
    }),
  );
}

/** Est-ce que la droite parle de fractions (« 3/4 ») ? Le dénominateur sert à écrire les positions. */
export function denominateur(it: NumberLineItem): number | null {
  const m = /^\s*\d+\s*\/\s*(\d+)\s*$/.exec(it.display);
  return m ? Number(m[1]) : null;
}

/** Écriture d'une position dans le même format que la cible (fraction ou nombre décimal). */
export function ecrire(it: NumberLineItem, v: number): string {
  const d = denominateur(it);
  if (d) {
    const n = Math.round(v * d);
    if (Math.abs(n / d - v) < 1e-6) return `${n}/${d}`;
  }
  return formatNumber(roundTo(v, 3));
}

/** Lecture à voix haute (« 3 sur 4 », « 2 virgule 5 »). */
export const lireValeur = (s: string) =>
  s
    .replace(/[\s  ]/g, '')
    .replace(/(\d+)\/(\d+)/, '$1 sur $2')
    .replace(',', ' virgule ');

/** Est-ce dans la tolérance ? */
export const atteint = (it: NumberLineItem, v: number) => Math.abs(v - it.target) <= it.tolerance + 1e-9;

/** Positions-pièges pour une lecture de graduation (erreurs de comptage plausibles). */
export function piegesPosition(it: NumberLineItem, rng: Rng, n: number): number[] {
  const sp = sousPas(it);
  const cands = [
    it.target + sp,
    it.target - sp,
    it.target + it.step,
    it.target - it.step,
    it.target + 2 * sp,
    it.target - 2 * sp,
    // confusion classique : compter les graduations comme des unités
    it.min + Math.round((it.target - it.min) / sp),
  ]
    .map((v) => roundTo(v, 6))
    .filter((v) => v >= it.min && v <= it.max && Math.abs(v - it.target) > it.tolerance);
  const uniques = [...new Map(cands.map((v) => [ecrire(it, v), v])).values()].filter(
    (v) => ecrire(it, v) !== ecrire(it, it.target),
  );
  return rng.shuffle(uniques).slice(0, n);
}
