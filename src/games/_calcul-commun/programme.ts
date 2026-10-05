/**
 * Programmes de calcul et suites (La Machine à programmes de calcul). Fonctions pures.
 * Conventions (GUIDE §6) :
 * - `meta.programme = { etapes: ['× 3', '+ 5'], entree: number | null, sortie: number | null }` (null = à trouver) ;
 * - `meta.suite = { termes: number[], etape: number }` : `termes[0]` est l'étape 1, on cherche la valeur à l'étape `etape`.
 */
import type { Item } from '@/content/schemas';
import { formatNumber, parseNumber, roundTo } from '@/engine/answer';

export type OpProg = '+' | '−' | '×' | '÷';
export interface EtapeProg {
  op: OpProg;
  n: number;
}

const SYMBOLES: Record<string, OpProg> = {
  '+': '+',
  '−': '−',
  '-': '−',
  '×': '×',
  x: '×',
  '*': '×',
  '÷': '÷',
  ':': '÷',
  '/': '÷',
};

/** « × 3 » → { op: '×', n: 3 } ; « + 2,5 » accepté. */
export function lireEtape(texte: string): EtapeProg | null {
  const r = /^\s*([+−\-×x*÷:/])\s*([\d  ]+(?:[,.]\d+)?)\s*$/.exec(texte);
  if (!r) return null;
  const op = SYMBOLES[r[1]!];
  const n = parseNumber(r[2]!);
  if (!op || n === null) return null;
  if ((op === '×' || op === '÷') && n === 0) return null;
  return { op, n };
}

export const texteEtape = (e: EtapeProg) => `${e.op} ${formatNumber(e.n)}`;

export function appliquer(x: number, e: EtapeProg): number {
  switch (e.op) {
    case '+':
      return roundTo(x + e.n, 6);
    case '−':
      return roundTo(x - e.n, 6);
    case '×':
      return roundTo(x * e.n, 6);
    case '÷':
      return roundTo(x / e.n, 6);
  }
}

export function inverse(e: EtapeProg): EtapeProg {
  const op: Record<OpProg, OpProg> = { '+': '−', '−': '+', '×': '÷', '÷': '×' };
  return { op: op[e.op], n: e.n };
}

/** Valeurs successives : [entrée, après étape 1, …, sortie]. */
export function executer(entree: number, etapes: EtapeProg[]): number[] {
  const out = [entree];
  for (const e of etapes) out.push(appliquer(out[out.length - 1]!, e));
  return out;
}

/** En remontant la machine depuis la sortie : [sortie, …, entrée]. */
export function remonter(sortie: number, etapes: EtapeProg[]): number[] {
  const out = [sortie];
  for (const e of [...etapes].reverse()) out.push(appliquer(out[out.length - 1]!, inverse(e)));
  return out;
}

export interface Programme {
  etapes: EtapeProg[];
  entree: number | null;
  sortie: number | null;
  /** Ce qu'il faut trouver. */
  inconnue: 'entree' | 'sortie';
  /** Toutes les valeurs (de l'entrée à la sortie). */
  valeurs: number[];
}

const estEntier = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

export function lireProgramme(item: Item): Programme | null {
  if (item.kind !== 'numeric_answer') return null;
  const p = item.meta?.programme as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object' || !Array.isArray(p.etapes)) return null;
  const etapes = (p.etapes as unknown[]).map((t) => (typeof t === 'string' ? lireEtape(t) : null));
  if (!etapes.length || etapes.length > 4 || etapes.some((e) => e === null)) return null;
  const es = etapes as EtapeProg[];
  const entree = typeof p.entree === 'number' ? p.entree : null;
  const sortie = typeof p.sortie === 'number' ? p.sortie : null;
  if ((entree === null) === (sortie === null)) return null;
  const valeurs = entree !== null ? executer(entree, es) : remonter(sortie!, es).reverse();
  const cherche = entree === null ? valeurs[0]! : valeurs[valeurs.length - 1]!;
  if (Math.abs(cherche - item.answer) > 1e-9) return null;
  // des valeurs intermédiaires « propres » (pas de division qui tombe mal)
  if (valeurs.some((v) => v < 0 || !estEntier(v * 1000))) return null;
  return { etapes: es, entree, sortie, inconnue: entree === null ? 'entree' : 'sortie', valeurs };
}

export interface Suite {
  termes: number[];
  etape: number;
  /** Écart constant entre deux termes (suite arithmétique), sinon null. */
  ecart: number | null;
}

export function lireSuite(item: Item): Suite | null {
  if (item.kind !== 'numeric_answer') return null;
  const s = item.meta?.suite as Record<string, unknown> | undefined;
  if (!s || typeof s !== 'object' || !Array.isArray(s.termes)) return null;
  const termes = (s.termes as unknown[]).filter(
    (x): x is number => typeof x === 'number' && Number.isFinite(x),
  );
  const etape = typeof s.etape === 'number' ? s.etape : NaN;
  if (termes.length < 2 || termes.length !== (s.termes as unknown[]).length) return null;
  if (!Number.isInteger(etape) || etape < 1) return null;
  const diffs = termes.slice(1).map((t, i) => roundTo(t - termes[i]!, 6));
  const ecart = diffs.every((d) => d === diffs[0]) ? diffs[0]! : null;
  // si on connaît déjà la valeur, elle doit correspondre
  if (etape <= termes.length && Math.abs(termes[etape - 1]! - item.answer) > 1e-9) return null;
  if (ecart !== null && Math.abs(termes[0]! + ecart * (etape - 1) - item.answer) > 1e-9) return null;
  return { termes, etape, ecart };
}

/** Item exploitable par la Machine (programme ou suite). */
export const itemMachine = (item: Item) => lireProgramme(item) !== null || lireSuite(item) !== null;
