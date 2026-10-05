/**
 * Glisse-nombre (L'Ascenseur de la virgule) : × et ÷ par 10, 100, 1 000 = les chiffres changent de rang,
 * la virgule reste fixe. Fonctions pures.
 * Convention de contenu (GUIDE §6) : `meta.glisse = { nombre, operation: '×' | '÷', facteur }`.
 */
import type { Item, NumericItem } from '@/content/schemas';
import { parseNumber, roundTo } from '@/engine/answer';

export interface Glisse {
  nombre: number;
  operation: '×' | '÷';
  facteur: 10 | 100 | 1000;
}

const FACTEURS = [10, 100, 1000];

function valide(g: Partial<Glisse>): g is Glisse {
  return (
    typeof g.nombre === 'number' &&
    Number.isFinite(g.nombre) &&
    g.nombre >= 0 &&
    (g.operation === '×' || g.operation === '÷') &&
    FACTEURS.includes(g.facteur as number)
  );
}

/**
 * Glisse d'un item : `meta.glisse`, ou à défaut un énoncé strictement de la forme « 3,5 × 100 » /
 * « 4 200 ÷ 10 » (lecture mécanique de l'item, aucun contenu ajouté). Null sinon.
 */
export function lireGlisse(item: Item): Glisse | null {
  if (item.kind !== 'numeric_answer') return null;
  let g: Partial<Glisse> | null = null;
  const m = item.meta?.glisse;
  if (m && typeof m === 'object') {
    const o = m as Record<string, unknown>;
    g = {
      nombre: typeof o.nombre === 'number' ? o.nombre : Number(o.nombre),
      operation: o.operation === 'x' || o.operation === '*' ? '×' : (o.operation as Glisse['operation']),
      facteur: Number(o.facteur) as Glisse['facteur'],
    };
  } else {
    const r = /^([\d  ]+(?:,\d+)?) ([×÷]) (10|100|1 000|1 000|1000)$/.exec(item.prompt.trim());
    if (r) {
      const n = parseNumber(r[1]!);
      g = { nombre: n ?? NaN, operation: r[2] as Glisse['operation'], facteur: parseNumber(r[3]!) as 10 };
    }
  }
  if (!g || !valide(g)) return null;
  if (Math.abs(resultatGlisse(g) - (item as NumericItem).answer) > 1e-9) return null;
  // bornes du tableau : des millions aux millièmes
  const res = resultatGlisse(g);
  if (Math.max(g.nombre, res) >= 1e9 || decimales(g.nombre) > 3 || decimales(res) > 3) return null;
  return g;
}

export const rangs = (g: Glisse) => String(g.facteur).length - 1;

/** Décalage en rangs : + vers la gauche (× : les chiffres « montent »), − vers la droite. */
export const decalage = (g: Glisse) => (g.operation === '×' ? rangs(g) : -rangs(g));

export const resultatGlisse = (g: Glisse) =>
  roundTo(g.operation === '×' ? g.nombre * g.facteur : g.nombre / g.facteur, 6);

export function decimales(n: number): number {
  const s = String(roundTo(n, 6));
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/** Chiffres d'un nombre par rang (puissance de 10) : 30,5 → {1: 3, 0: 0, -1: 5}. */
export function chiffresParRang(n: number): Map<number, number> {
  const s = String(roundTo(n, 6));
  const [ent = '0', dec = ''] = s.split('.');
  const out = new Map<number, number>();
  const e = ent.replace(/^0+(?=\d)/, '');
  [...e].forEach((c, i) => out.set(e.length - 1 - i, Number(c)));
  [...dec].forEach((c, i) => out.set(-(i + 1), Number(c)));
  if (n < 1 && out.get(0) === 0) out.delete(0); // « 0,5 » : le 0 des unités n'est qu'un zéro d'écriture
  return out;
}

/** Rangs significatifs (du plus haut au plus bas) : ceux qui portent un chiffre du nombre. */
export function rangsSignificatifs(n: number): number[] {
  const m = chiffresParRang(n);
  return [...m.keys()].sort((a, b) => b - a);
}

/** Colonnes à afficher (du plus haut au plus bas rang), assez pour le nombre de départ et le résultat. */
export function colonnesTableau(g: Glisse): number[] {
  const avant = rangsSignificatifs(g.nombre);
  const k = decalage(g);
  const decimal = decimales(g.nombre) > 0 || decimales(resultatGlisse(g)) > 0;
  const tous = [...avant, ...avant.map((r) => r + k), 0, ...(decimal ? [-1] : [])];
  const haut = Math.min(8, Math.max(...tous, decimal ? 2 : 3));
  const bas = Math.max(-3, Math.min(...tous));
  const out: number[] = [];
  for (let r = haut; r >= bas; r--) out.push(r);
  return out;
}

/**
 * Zéros à écrire après le glissement : entre le chiffre le plus à droite et les unités (× : 12 → 1 200),
 * ou entre la virgule et le premier chiffre, plus le zéro des unités (÷ : 4 → 0,004).
 */
export function zerosAjoutes(g: Glisse): number[] {
  const apres = rangsSignificatifs(g.nombre).map((r) => r + decalage(g));
  const haut = Math.max(...apres, 0);
  const bas = Math.min(...apres, 0);
  const pris = new Set(apres);
  const out: number[] = [];
  for (let r = haut; r >= bas; r--) if (!pris.has(r)) out.push(r);
  return out;
}

const NOMS_RANG: Record<number, [string, string]> = {
  8: ['c', 'centaines de millions'],
  7: ['d', 'dizaines de millions'],
  6: ['u', 'unités de millions'],
  5: ['c', 'centaines de mille'],
  4: ['d', 'dizaines de mille'],
  3: ['u', 'unités de mille'],
  2: ['c', 'centaines'],
  1: ['d', 'dizaines'],
  0: ['u', 'unités'],
  [-1]: ['1/10', 'dixièmes'],
  [-2]: ['1/100', 'centièmes'],
  [-3]: ['1/1000', 'millièmes'],
};

/** [abréviation, nom complet] d'un rang. */
export const nomRang = (r: number): [string, string] => NOMS_RANG[r] ?? ['?', '?'];

/** Classe d'un rang (pour l'en-tête du tableau). */
export const classeRang = (r: number) =>
  r >= 6 ? 'millions' : r >= 3 ? 'mille' : r >= 0 ? 'unités' : 'partie décimale';
