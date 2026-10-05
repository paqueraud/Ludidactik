/**
 * Le Mesureur : lecture des `meta` de grandeurs et mesures (règle, balance, quadrillage, figures,
 * angles) et des conversions écrites « 3 m = … cm ».
 */
import type { ClassificationItem, Item, McqItem, NumericItem } from '@/content/schemas';
import { type Cell, estCase } from './grille';

export interface PlanRegle {
  objet: string;
  longueur: number;
  unite: 'cm' | 'mm';
}
export interface PlanBalance {
  masses: number[];
  unite: string;
  objet: string;
}
export interface PlanQuadrillage {
  cols: number;
  rows: number;
  cells: Cell[];
  demis: [number, number, 'hg' | 'hd' | 'bg' | 'bd'][];
}
export interface PlanFigure {
  type: 'carre' | 'rectangle' | 'triangle' | 'polygone' | 'cercle';
  cotes: (number | null)[];
  unite: string;
  rayon?: number;
  diametre?: number;
  /** Carré découpé dans un coin (aire de la figure qui reste). */
  decoupe?: number;
  angleDroit?: boolean;
}
export interface PlanConversion {
  /** Partie gauche telle qu'écrite (« 3 m 5 cm »). */
  gauche: string;
  /** Unités présentes à gauche et unité demandée. */
  unites: string[];
  vers: string;
}

export type PlanMesure =
  | { type: 'regle'; regle: PlanRegle }
  | { type: 'balance'; balance: PlanBalance }
  | { type: 'quadrillage'; quadrillage: PlanQuadrillage }
  | { type: 'rectangles'; rectangles: [number, number][]; unite: string }
  | { type: 'figure'; figure: PlanFigure }
  | { type: 'conversion'; conversion: PlanConversion };

export const UNITES = [
  'km',
  'hm',
  'dam',
  'm',
  'dm',
  'cm',
  'mm',
  't',
  'kg',
  'g',
  'mg',
  'hL',
  'L',
  'dL',
  'cL',
  'mL',
  'm²',
  'dm²',
  'cm²',
  'mm²',
] as const;
const estUnite = (u: string) => (UNITES as readonly string[]).includes(u);

/** Relations entre unités voisines, pour l'aide du niveau Facile (« 1 m = 100 cm »). */
const FACTEURS: Record<string, number> = {
  km: 1e6,
  hm: 1e5,
  dam: 1e4,
  m: 1e3,
  dm: 100,
  cm: 10,
  mm: 1,
  t: 1e9,
  kg: 1e6,
  g: 1e3,
  mg: 1,
  hL: 1e5,
  L: 1e3,
  dL: 100,
  cL: 10,
  mL: 1,
  'm²': 1e6,
  'dm²': 1e4,
  'cm²': 100,
  'mm²': 1,
};
const famille = (u: string) =>
  u.endsWith('²') ? 'aire' : /L$/.test(u) ? 'contenance' : /g$|^t$/.test(u) ? 'masse' : 'longueur';

/** « 1 m = 100 cm » pour deux unités d'une même grandeur (la plus grande d'abord). */
export function relation(a: string, b: string): string | null {
  if (!estUnite(a) || !estUnite(b) || a === b || famille(a) !== famille(b)) return null;
  const [g, p] = FACTEURS[a]! > FACTEURS[b]! ? [a, b] : [b, a];
  const r = FACTEURS[g]! / FACTEURS[p]!;
  return `1 ${g} = ${String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${p}`;
}

/** « 3,5 m = … cm », « 2 kg 300 g = … g », « 1 m − 40 cm = … cm » (formes de conversion). */
export function lireConversion(prompt: string, unit?: string): PlanConversion | null {
  const m = prompt.match(/^(.+?)\s*=\s*…\s*([a-zA-Z²]+)\s*$/);
  if (!m) return null;
  const gauche = m[1]!.trim();
  const vers = m[2]!;
  if (!estUnite(vers) || (unit && unit !== vers)) return null;
  const unites = [...gauche.matchAll(/\d\s*([a-zA-Z²]+)/g)].map((x) => x[1]!).filter(estUnite);
  if (!unites.length || !/^[\d\s,.+−\-a-zA-Z²]+$/.test(gauche)) return null;
  return { gauche, unites: [...new Set(unites)], vers };
}

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function lireMesure(it: Item): PlanMesure | null {
  if (it.kind !== 'numeric_answer') return null;
  const meta = it.meta ?? {};
  const r = meta.mesure as Record<string, unknown> | undefined;
  if (r && typeof r.objet === 'string' && nombre(r.longueur) && (r.unite === 'cm' || r.unite === 'mm')) {
    const max = r.unite === 'cm' ? 20 : 200;
    if (r.longueur > 0 && r.longueur <= max && Math.abs(r.longueur - it.answer) < 1e-9)
      return { type: 'regle', regle: { objet: r.objet, longueur: r.longueur, unite: r.unite } };
  }
  const b = meta.balance as Record<string, unknown> | undefined;
  if (b && Array.isArray(b.masses) && b.masses.length && b.masses.every(nombre) && b.masses.length <= 10)
    return {
      type: 'balance',
      balance: {
        masses: b.masses,
        unite: typeof b.unite === 'string' ? b.unite : 'g',
        objet: typeof b.objet === 'string' ? b.objet : '📦',
      },
    };
  const q = meta.quadrillage as Record<string, unknown> | undefined;
  if (q && nombre(q.cols) && nombre(q.rows) && Array.isArray(q.cells) && q.cells.every(estCase)) {
    const demis = Array.isArray(q.demis)
      ? (q.demis as unknown[]).filter(
          (d): d is PlanQuadrillage['demis'][number] =>
            Array.isArray(d) && d.length === 3 && ['hg', 'hd', 'bg', 'bd'].includes(String(d[2])),
        )
      : [];
    if (q.cols <= 16 && q.rows <= 16)
      return { type: 'quadrillage', quadrillage: { cols: q.cols, rows: q.rows, cells: q.cells, demis } };
  }
  const rs = meta.rectangles;
  if (
    Array.isArray(rs) &&
    rs.length >= 2 &&
    rs.every((x) => Array.isArray(x) && x.length === 2 && x.every(nombre))
  )
    return {
      type: 'rectangles',
      rectangles: rs as [number, number][],
      unite: typeof meta.unite === 'string' ? meta.unite : '',
    };
  const f = meta.figure as Record<string, unknown> | undefined;
  if (
    f &&
    ['carre', 'rectangle', 'triangle', 'polygone', 'cercle'].includes(String(f.type)) &&
    Array.isArray(f.cotes) &&
    f.cotes.every((c) => c === null || nombre(c)) &&
    f.cotes.length <= 8
  ) {
    const type = f.type as PlanFigure['type'];
    if (type !== 'cercle' && f.cotes.length < 3) return null;
    if (type === 'cercle' && !nombre(f.rayon) && !nombre(f.diametre)) return null;
    return {
      type: 'figure',
      figure: {
        type,
        cotes: f.cotes as (number | null)[],
        unite: typeof f.unite === 'string' ? f.unite : '',
        rayon: nombre(f.rayon) ? f.rayon : undefined,
        diametre: nombre(f.diametre) ? f.diametre : undefined,
        decoupe: nombre(meta.decoupe) ? meta.decoupe : undefined,
        angleDroit: meta.angleDroit === true,
      },
    };
  }
  const c = lireConversion(it.prompt, it.unit);
  if (c) return { type: 'conversion', conversion: c };
  return null;
}

/** Angles à classer (aigu, droit, obtus, plat) dessinés d'après `meta.angles`. */
export function lireAngles(it: Item): number[] | null {
  if (it.kind !== 'classification') return null;
  const a = it.meta?.angles;
  if (!Array.isArray(a) || a.length !== it.elements.length || !a.every((x) => nombre(x) && x > 0 && x <= 180))
    return null;
  return a as number[];
}

/** QCM d'estimation d'une mesure (pas les comparaisons « Crocodiles » qui ont `meta.gauche`). */
export function estEstimation(it: Item): it is McqItem {
  if (it.kind !== 'mcq' || it.meta?.gauche !== undefined) return false;
  if (it.meta?.grandeur !== undefined) return true;
  return /plutôt…|environ…|pèse…|plus vraisemblable|Quelle unité choisir/.test(it.question);
}

export const estMesureNumerique = (it: Item): it is NumericItem => lireMesure(it) !== null;
export const estAngles = (it: Item): it is ClassificationItem => lireAngles(it) !== null;

/** Emoji en tête d'une question (« 🚗 Quelle est la mesure… » → 🚗). */
export function emojiDe(texte: string): string | null {
  const m = texte.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/u);
  return m ? m[1]! : null;
}
