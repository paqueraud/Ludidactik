/**
 * Tableaux de proportionnalité (Le Pâtissier proportionnel). Fonctions pures.
 * Convention (GUIDE §6) : `meta.tableau = { entetes: [string, string], lignes: [number | null, number | null][] }`,
 * une seule case vide (null) = la valeur à trouver (`answer`).
 * Aides proposées, dans l'esprit du BO (pas de « règle de trois », pas de produit en croix) :
 * linéarité multiplicative (« 2 fois plus d'invités → 2 fois plus d'œufs »), additive (somme de deux lignes),
 * passage par l'unité.
 */
import type { Item } from '@/content/schemas';
import { formatNumber, roundTo } from '@/engine/answer';

export interface Tableau {
  entetes: [string, string];
  lignes: [number | null, number | null][];
  /** Case à trouver. */
  ligne: number;
  col: 0 | 1;
}

export function lireTableau(item: Item): Tableau | null {
  if (item.kind !== 'numeric_answer') return null;
  const t = item.meta?.tableau as Record<string, unknown> | undefined;
  if (!t || typeof t !== 'object' || !Array.isArray(t.entetes) || !Array.isArray(t.lignes)) return null;
  const entetes = t.entetes as unknown[];
  if (entetes.length !== 2 || !entetes.every((e) => typeof e === 'string')) return null;
  const lignes = t.lignes as unknown[];
  if (lignes.length < 2 || lignes.length > 6) return null;
  let trou: [number, 0 | 1] | null = null;
  const ok: [number | null, number | null][] = [];
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (!Array.isArray(l) || l.length !== 2) return null;
    const v = l.map((x) => (x === null ? null : typeof x === 'number' && Number.isFinite(x) ? x : NaN));
    if (v.some((x) => Number.isNaN(x))) return null;
    v.forEach((x, c) => {
      if (x === null) trou = trou ? [-1, 0] : [i, c as 0 | 1];
    });
    ok.push([v[0] ?? null, v[1] ?? null] as [number | null, number | null]);
  }
  const tr = trou as [number, 0 | 1] | null;
  if (!tr || tr[0] < 0) return null;
  const res: Tableau = {
    entetes: [entetes[0] as string, entetes[1] as string],
    lignes: ok,
    ligne: tr[0],
    col: tr[1],
  };
  // cohérence : toutes les lignes complètes ont le même coefficient, et la réponse le respecte
  const k = coefficient(res);
  if (k === null) return null;
  const autre = ok[tr[0]]![tr[1] === 0 ? 1 : 0]!;
  const attendu = tr[1] === 1 ? autre * k : autre / k;
  if (Math.abs(attendu - item.answer) > 1e-6) return null;
  return res;
}

/** Coefficient colonne 1 → colonne 2, s'il est le même pour toutes les lignes complètes. */
export function coefficient(t: Tableau): number | null {
  const ks = t.lignes
    .filter((l): l is [number, number] => l[0] !== null && l[1] !== null && l[0] !== 0)
    .map((l) => l[1] / l[0]);
  if (!ks.length) return null;
  return ks.every((k) => Math.abs(k - ks[0]!) < 1e-9) ? ks[0]! : null;
}

/** `indice` : la stratégie, sans le résultat ; `texte` : le raisonnement complet (correction). */
export type Aide =
  | { type: 'fois'; depuis: number; k: number; texte: string; indice: string }
  | { type: 'divise'; depuis: number; k: number; texte: string; indice: string }
  | { type: 'somme'; lignes: [number, number]; texte: string; indice: string }
  | { type: 'unite'; depuis: number; unite: number; texte: string; indice: string };

const entier = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
const f = (x: number) => formatNumber(roundTo(x, 3));

/**
 * Aides possibles pour trouver la case vide, de la plus simple à la plus longue :
 * « × k » depuis une ligne, « ÷ k », somme de deux lignes, passage par l'unité.
 */
export function aides(t: Tableau): Aide[] {
  const { ligne, col } = t;
  const autreCol = col === 0 ? 1 : 0;
  const x = t.lignes[ligne]![autreCol]!;
  const completes = t.lignes
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => i !== ligne && l[0] !== null && l[1] !== null) as {
    l: [number, number];
    i: number;
  }[];
  const out: Aide[] = [];
  for (const { l, i } of completes) {
    const xi = l[autreCol];
    const yi = l[col];
    if (xi === 0) continue;
    const k = x / xi;
    if (k > 1 && entier(k))
      out.push({
        type: 'fois',
        depuis: i,
        k,
        texte: `${f(x)}, c’est ${f(k)} fois ${f(xi)} : il en faut ${f(k)} fois plus. ${f(yi)} × ${f(k)} = ${f(yi * k)}.`,
        indice: `${f(x)}, c’est ${f(k)} fois ${f(xi)} : il en faut ${f(k)} fois plus que ${f(yi)}.`,
      });
    else if (k < 1 && entier(1 / k))
      out.push({
        type: 'divise',
        depuis: i,
        k: Math.round(1 / k),
        texte: `${f(x)}, c’est ${f(xi)} divisé par ${Math.round(1 / k)} : il en faut ${Math.round(1 / k)} fois moins. ${f(yi)} ÷ ${Math.round(1 / k)} = ${f(yi / Math.round(1 / k))}.`,
        indice: `${f(x)}, c’est ${f(xi)} divisé par ${Math.round(1 / k)} : il en faut ${Math.round(1 / k)} fois moins que ${f(yi)}.`,
      });
  }
  for (let a = 0; a < completes.length; a++)
    for (let b = a + 1; b < completes.length; b++) {
      const A = completes[a]!;
      const B = completes[b]!;
      if (Math.abs(A.l[autreCol] + B.l[autreCol] - x) < 1e-9)
        out.push({
          type: 'somme',
          lignes: [A.i, B.i],
          texte: `${f(x)} = ${f(A.l[autreCol])} + ${f(B.l[autreCol])}, donc on ajoute : ${f(A.l[col])} + ${f(B.l[col])} = ${f(A.l[col] + B.l[col])}.`,
          indice: `${f(x)} = ${f(A.l[autreCol])} + ${f(B.l[autreCol])} : ajoute les quantités de ces deux lignes.`,
        });
    }
  const premiere = completes[0];
  // passage par l'unité : seulement vers la 2e colonne et si la valeur pour 1 est « simple »
  if (
    premiere &&
    col === 1 &&
    premiere.l[autreCol] !== 0 &&
    entier((premiere.l[col] / premiere.l[autreCol]) * 100)
  ) {
    const xi = premiere.l[autreCol];
    const yi = premiere.l[col];
    if (xi !== 0) {
      const u = yi / xi;
      out.push({
        type: 'unite',
        depuis: premiere.i,
        unite: u,
        texte: `Pour 1 : ${f(yi)} ÷ ${f(xi)} = ${f(u)}. Pour ${f(x)} : ${f(u)} × ${f(x)} = ${f(u * x)}.`,
        indice: `Cherche d’abord combien il en faut pour 1 : ${f(yi)} ÷ ${f(xi)}.`,
      });
    }
  }
  return out;
}
