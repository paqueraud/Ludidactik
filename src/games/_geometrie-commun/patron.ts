/**
 * Patrons de solides : arbre de pliage (charnières entre faces voisines) pour l'animation en
 * pseudo-3D, et pliage « en roulant » d'un patron de cube pour savoir quelles faces se superposent.
 */
import type { GeometryItem, Item } from '@/content/schemas';
import { type Cell, cle, est, estCase, lireCase } from './grille';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Cote = 'haut' | 'bas' | 'gauche' | 'droite';

export interface Noeud {
  /** Index de la face dans la liste d'origine. */
  i: number;
  rect: Rect;
  /** Côté du parent auquel la face est attachée (absent pour la face de base). */
  cote?: Cote;
  enfants: Noeud[];
}

/** Côté commun de deux rectangles qui se touchent (longueur de contact > 0), vu depuis `a`. */
export function coteCommun(a: Rect, b: Rect): Cote | null {
  const chevX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const chevY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (chevX > 0 && b.y + b.h === a.y) return 'haut';
  if (chevX > 0 && b.y === a.y + a.h) return 'bas';
  if (chevY > 0 && b.x + b.w === a.x) return 'gauche';
  if (chevY > 0 && b.x === a.x + a.w) return 'droite';
  return null;
}

/** Arbre de pliage (parcours en largeur depuis la face la plus entourée). */
export function arbrePliage(rects: Rect[]): Noeud | null {
  if (!rects.length) return null;
  const voisins = rects.map((a, i) => rects.map((b, j) => (i !== j ? coteCommun(a, b) : null)));
  const degre = voisins.map((v) => v.filter(Boolean).length);
  let racine = 0;
  rects.forEach((r, i) => {
    const best = rects[racine]!;
    if (degre[i]! > degre[racine]! || (degre[i] === degre[racine] && r.w * r.h > best.w * best.h)) racine = i;
  });
  const noeuds = rects.map((rect, i): Noeud => ({ i, rect, enfants: [] }));
  const vu = new Set([racine]);
  const file = [racine];
  while (file.length) {
    const i = file.shift()!;
    voisins[i]!.forEach((cote, j) => {
      if (!cote || vu.has(j)) return;
      vu.add(j);
      noeuds[j]!.cote = cote;
      noeuds[i]!.enfants.push(noeuds[j]!);
      file.push(j);
    });
  }
  return vu.size === rects.length ? noeuds[racine]! : null;
}

export const casesEnRects = (cells: Cell[]): Rect[] => cells.map(([x, y]) => ({ x, y, w: 1, h: 1 }));

/* ------------------------------------------------------------------ */
/* Cube : pliage en roulant                                            */
/* ------------------------------------------------------------------ */

export type FaceCube = 'dessous' | 'dessus' | 'avant' | 'arriere' | 'gauche' | 'droite';
type O = Record<'bas' | 'haut' | 'n' | 's' | 'e' | 'o', FaceCube>;

/**
 * On pose un cube sur une case et on le fait rouler de case en case : chaque case du patron reçoit la
 * face du cube qui la touche. C'est un patron de cube si les 6 cases reçoivent 6 faces différentes.
 */
export function plierCube(cells: Cell[]): { faces: Map<string, FaceCube>; ok: boolean; doublons: string[] } {
  const faces = new Map<string, FaceCube>();
  if (!cells.length) return { faces, ok: false, doublons: [] };
  const keys = new Set(cells.map(cle));
  const rouler: [number, number, (q: O) => O][] = [
    [1, 0, (q) => ({ ...q, bas: q.e, o: q.bas, e: q.haut, haut: q.o })],
    [-1, 0, (q) => ({ ...q, bas: q.o, e: q.bas, o: q.haut, haut: q.e })],
    [0, 1, (q) => ({ ...q, bas: q.s, n: q.bas, s: q.haut, haut: q.n })],
    [0, -1, (q) => ({ ...q, bas: q.n, s: q.bas, n: q.haut, haut: q.s })],
  ];
  const depart = cells[0]!;
  const etat = new Map<string, O>([
    [cle(depart), { bas: 'dessous', haut: 'dessus', n: 'arriere', s: 'avant', e: 'droite', o: 'gauche' }],
  ]);
  const file: Cell[] = [depart];
  while (file.length) {
    const c = file.shift()!;
    const q = etat.get(cle(c))!;
    for (const [dx, dy, f] of rouler) {
      const v: Cell = [c[0] + dx, c[1] + dy];
      const k = cle(v);
      if (!keys.has(k) || etat.has(k)) continue;
      etat.set(k, f(q));
      file.push(v);
    }
  }
  const vues = new Set<FaceCube>();
  const doublons: string[] = [];
  for (const c of cells) {
    const q = etat.get(cle(c));
    if (!q) continue;
    faces.set(cle(c), q.bas);
    if (vues.has(q.bas)) doublons.push(cle(c));
    vues.add(q.bas);
  }
  return { faces, ok: cells.length === 6 && etat.size === 6 && doublons.length === 0, doublons };
}

export const estPatronCube = (cells: Cell[]) => plierCube(cells).ok;

/* ------------------------------------------------------------------ */
/* Lecture des items                                                   */
/* ------------------------------------------------------------------ */

export type PlanPatron =
  | { type: 'cube'; cells: Cell[]; cols: number; rows: number; oui: boolean }
  | { type: 'pave'; rects: Rect[]; cols: number; rows: number; oui: boolean }
  | { type: 'completer'; cells: Cell[]; cols: number; rows: number; solutions: Cell[] };

const estRect = (r: unknown): r is Rect =>
  !!r &&
  typeof r === 'object' &&
  ['x', 'y', 'w', 'h'].every((k) => typeof (r as Record<string, unknown>)[k] === 'number');

export function lirePatron(it: Item): PlanPatron | null {
  if (!est(it) || it.task !== 'patron' || !it.grid || !it.grid.cells.length) return null;
  const { cols, rows } = it.grid;
  const cells = it.grid.cells.map(([x, y]) => [x, y] as Cell);
  if (cols > 16 || rows > 16) return null;
  const sols = it.meta?.solutions;
  if (Array.isArray(sols) || it.shape === 'patron_cube_incomplet') {
    const solutions = (Array.isArray(sols) ? sols : [it.answer])
      .map((s) => lireCase(s))
      .filter((c): c is Cell => !!c);
    if (!solutions.length || cells.length !== 5) return null;
    return { type: 'completer', cells, cols, rows, solutions };
  }
  const oui = it.answer.trim().toLowerCase() === 'oui';
  if (!oui && it.answer.trim().toLowerCase() !== 'non') return null;
  const rects = it.meta?.rectangles;
  if (Array.isArray(rects) && rects.length && rects.every(estRect)) {
    if (!arbrePliage(rects)) return null;
    return { type: 'pave', rects: rects.map((r) => ({ ...r })), cols, rows, oui };
  }
  if (cells.length !== 6 || !cells.every(estCase)) return null;
  if (!arbrePliage(casesEnRects(cells))) return null;
  return { type: 'cube', cells, cols, rows, oui };
}

export const estPatron = (it: Item): it is GeometryItem => lirePatron(it) !== null;
