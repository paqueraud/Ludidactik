/**
 * Tangram & Formes : pièces (carré unité, demi-carré, demi-domino) et silhouettes à reconstituer.
 * Les silhouettes sont une MÉCANIQUE de jeu (puzzle) : la figure à construire vient de l'item
 * (`shape`), la question posée ensuite aussi.
 */
import type { Item, Level } from '@/content/schemas';
import { estFigurePlane } from '../_geometrie-commun/figures';

/** Coin de l'angle droit d'un triangle dans sa boîte : haut-gauche, haut-droite, bas-gauche, bas-droite. */
export type Coin = 'hg' | 'hd' | 'bg' | 'bd';
export interface Piece {
  forme: 'carre' | 'tri';
  w: number;
  h: number;
  coin?: Coin;
}
export interface Emplacement extends Piece {
  x: number;
  y: number;
}
type P = [number, number];

const C = (x: number, y: number): Emplacement => ({ forme: 'carre', w: 1, h: 1, x, y });
const T = (x: number, y: number, w: number, h: number, coin: Coin): Emplacement => ({
  forme: 'tri',
  w,
  h,
  coin,
  x,
  y,
});

/** Sommets d'une pièce posée en (x, y). */
export function sommets(p: Piece, x: number, y: number): P[] {
  const hg: P = [x, y];
  const hd: P = [x + p.w, y];
  const bg: P = [x, y + p.h];
  const bd: P = [x + p.w, y + p.h];
  if (p.forme === 'carre') return [hg, hd, bd, bg];
  switch (p.coin) {
    case 'hg':
      return [hg, hd, bg];
    case 'hd':
      return [hd, bd, hg];
    case 'bg':
      return [bg, hg, bd];
    default:
      return [bd, bg, hd];
  }
}

const SUIVANT: Record<Coin, Coin> = { hg: 'hd', hd: 'bd', bd: 'bg', bg: 'hg' };
const MIROIR: Record<Coin, Coin> = { hg: 'hd', hd: 'hg', bg: 'bd', bd: 'bg' };

/** Quart de tour dans le sens des aiguilles d'une montre. */
export const tourner = (p: Piece): Piece =>
  p.forme === 'carre' ? p : { ...p, w: p.h, h: p.w, coin: SUIVANT[p.coin!] };
/** Retourner (miroir gauche-droite). */
export const retourner = (p: Piece): Piece => (p.forme === 'carre' ? p : { ...p, coin: MIROIR[p.coin!] });

/** Même pièce dans la même position ? */
export const memeOrientation = (a: Piece, b: Piece) =>
  a.forme === b.forme && a.w === b.w && a.h === b.h && (a.forme === 'carre' || a.coin === b.coin);

/** Même pièce à une rotation / un retournement près (même forme de base). */
export function memeType(a: Piece, b: Piece): boolean {
  if (a.forme !== b.forme) return false;
  if (a.forme === 'carre') return true;
  return Math.min(a.w, a.h) === Math.min(b.w, b.h) && Math.max(a.w, a.h) === Math.max(b.w, b.h);
}

/** Silhouettes (variantes par niveau). Unités : carreaux. */
const SILHOUETTES: Record<string, { simple: Emplacement[]; complexe: Emplacement[] }> = {
  carre: {
    simple: [C(0, 0), C(1, 0), C(0, 1), C(1, 1)],
    complexe: [
      T(0, 0, 1, 1, 'hg'),
      T(0, 0, 1, 1, 'bd'),
      C(1, 0),
      C(0, 1),
      T(1, 1, 1, 1, 'hd'),
      T(1, 1, 1, 1, 'bg'),
    ],
  },
  rectangle: {
    simple: [C(0, 0), C(1, 0), C(2, 0), C(0, 1), C(1, 1), C(2, 1)],
    complexe: [C(0, 0), C(1, 0), C(2, 0), T(0, 1, 2, 1, 'bg'), T(0, 1, 2, 1, 'hd'), C(2, 1)],
  },
  triangle_rectangle: {
    simple: [T(0, 0, 1, 1, 'bg'), C(0, 1), T(1, 1, 1, 1, 'bg')],
    complexe: [T(0, 0, 2, 1, 'bg'), C(0, 1), C(1, 1), T(2, 1, 2, 1, 'bg')],
  },
  triangle_isocele: {
    simple: [T(0, 0, 1, 2, 'bd'), T(1, 0, 1, 2, 'bg')],
    complexe: [
      T(1, 0, 1, 2, 'bd'),
      T(2, 0, 1, 2, 'bg'),
      T(0, 2, 1, 2, 'bd'),
      C(1, 2),
      C(2, 2),
      C(1, 3),
      C(2, 3),
      T(3, 2, 1, 2, 'bg'),
    ],
  },
  losange: {
    simple: [T(0, 0, 2, 1, 'bd'), T(2, 0, 2, 1, 'bg'), T(0, 1, 2, 1, 'hd'), T(2, 1, 2, 1, 'hg')],
    complexe: [T(0, 0, 2, 1, 'bd'), T(2, 0, 2, 1, 'bg'), T(0, 1, 2, 1, 'hd'), T(2, 1, 2, 1, 'hg')],
  },
  trapeze: {
    simple: [T(0, 0, 1, 2, 'bd'), C(1, 0), C(2, 0), C(1, 1), C(2, 1), T(3, 0, 1, 2, 'bg')],
    complexe: [
      T(0, 0, 1, 2, 'bd'),
      C(1, 0),
      C(2, 0),
      T(1, 1, 2, 1, 'bg'),
      T(1, 1, 2, 1, 'hd'),
      T(3, 0, 1, 2, 'bg'),
    ],
  },
  trapeze_rectangle: {
    simple: [C(0, 0), C(1, 0), C(0, 1), C(1, 1), T(2, 0, 1, 2, 'bg')],
    complexe: [T(0, 0, 1, 1, 'hd'), T(0, 0, 1, 1, 'bg'), C(1, 0), C(0, 1), C(1, 1), T(2, 0, 1, 2, 'bg')],
  },
};

/** Identifiant de silhouette pour un item (le « triangle » quelconque du CM2 n'est pas constructible). */
function idSilhouette(it: Item): string | null {
  if (it.kind !== 'geometry_shape') return null;
  if (it.shape === 'triangle') return it.meta?.figure ? null : 'triangle_isocele';
  return it.shape in SILHOUETTES ? it.shape : null;
}

export function silhouette(it: Item, level: Level): Emplacement[] | null {
  const id = idSilhouette(it);
  if (!id) return null;
  const s = SILHOUETTES[id]!;
  return level === 'facile' ? s.simple : s.complexe;
}

/** Items de figure plane dont la silhouette se construit avec les pièces. */
export const estPourTangram = (it: Item): it is Item => estFigurePlane(it) && idSilhouette(it) !== null;

export function cadre(slots: Emplacement[]) {
  return {
    w: Math.max(...slots.map((s) => s.x + s.w)),
    h: Math.max(...slots.map((s) => s.y + s.h)),
  };
}
