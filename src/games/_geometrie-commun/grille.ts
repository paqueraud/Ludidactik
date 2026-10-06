/**
 * Quadrillages : cases, symétrie axiale (Miroir magique), points sur les nœuds (Géomètre).
 * Conventions des modules de contenu : [x, y], x = colonne (0 à gauche), y = ligne (0 en haut).
 * Uniquement de la mécanique (lecture et vérification des items), aucun contenu pédagogique.
 */
import type { GeometryItem, Item } from '@/content/schemas';

export type Cell = [number, number];
export type Axe = 'vertical' | 'horizontal' | 'diagonale' | 'anti-diagonale';
const AXES: Axe[] = ['vertical', 'horizontal', 'diagonale', 'anti-diagonale'];

export const cle = (c: readonly [number, number]) => `${c[0]},${c[1]}`;

export const estCase = (v: unknown): v is Cell =>
  Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** « 3,4 » → [3, 4]. */
export function lireCase(s: unknown): Cell | null {
  if (estCase(s)) return [s[0], s[1]];
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export const trier = (cs: Cell[]) => [...cs].sort((a, b) => a[1] - b[1] || a[0] - b[0]);

/** Deux ensembles de cases identiques (ordre indifférent, doublons ignorés). */
export function memesCases(a: Cell[], b: Cell[]): boolean {
  const sa = new Set(a.map(cle));
  const sb = new Set(b.map(cle));
  return sa.size === sb.size && [...sa].every((k) => sb.has(k));
}

export const est = (it: Item): it is GeometryItem => it.kind === 'geometry_shape';

/* ------------------------------------------------------------------ */
/* Symétrie axiale                                                     */
/* ------------------------------------------------------------------ */

/** Axe d'un item de symétrie : `meta.axe.type` (CM2, distingue l'anti-diagonale) puis `grid.axis`. */
export function axeDe(item: GeometryItem): Axe | null {
  const t = (item.meta?.axe as { type?: unknown } | undefined)?.type;
  if (typeof t === 'string' && (AXES as string[]).includes(t)) return t as Axe;
  return item.grid?.axis ?? null;
}

/** Image d'une case par la symétrie d'axe `axe` (diagonales : quadrillage carré). */
export function symetrique(axe: Axe, cols: number, rows: number, [x, y]: Cell): Cell {
  if (axe === 'vertical') return [cols - 1 - x, y];
  if (axe === 'horizontal') return [x, rows - 1 - y];
  if (axe === 'diagonale') return [y, x];
  return [cols - 1 - y, cols - 1 - x];
}

const dansGrille = ([x, y]: Cell, cols: number, rows: number) => x >= 0 && y >= 0 && x < cols && y < rows;

/**
 * Cases que l'enfant doit colorier : `meta.solution` si elle est fournie et cohérente, sinon les
 * symétriques des cases données qui ne sont pas déjà coloriées (figure « à cheval » sur l'axe).
 */
export function solutionSymetrie(item: GeometryItem): Cell[] {
  const g = item.grid;
  const axe = axeDe(item);
  if (!g || !axe) return [];
  const deja = new Set(g.cells.map((c) => cle(c)));
  const calc = trier(
    g.cells
      .map((c) => symetrique(axe, g.cols, g.rows, c as Cell))
      .filter((c) => !deja.has(cle(c)) && dansGrille(c, g.cols, g.rows)),
  );
  const sol = item.meta?.solution;
  if (Array.isArray(sol) && sol.length && sol.every(estCase)) {
    const s = sol as Cell[];
    // On garde la solution du contenu si elle est bien la symétrique (sinon : recalcul).
    if (memesCases(s, calc)) return trier(s);
  }
  return calc;
}

/** Item de symétrie exploitable par le Miroir magique. */
export function estSymetrie(it: Item): it is GeometryItem {
  if (!est(it) || it.task !== 'symetrie' || !it.grid || !it.grid.cells.length) return false;
  const axe = axeDe(it);
  if (!axe) return false;
  if ((axe === 'diagonale' || axe === 'anti-diagonale') && it.grid.cols !== it.grid.rows) return false;
  if (!it.grid.cells.every((c) => dansGrille(c as Cell, it.grid!.cols, it.grid!.rows))) return false;
  return solutionSymetrie(it).length > 0;
}

/** Distance (en cases) d'une case à l'axe, pour les repères du niveau Facile. */
export function distanceAxe(axe: Axe, cols: number, rows: number, [x, y]: Cell): number {
  if (axe === 'vertical') return x < cols / 2 ? cols / 2 - x : x - cols / 2 + 1;
  if (axe === 'horizontal') return y < rows / 2 ? rows / 2 - y : y - rows / 2 + 1;
  if (axe === 'diagonale') return Math.abs(x - y);
  return Math.abs(x + y - (cols - 1));
}

/* ------------------------------------------------------------------ */
/* Points sur les nœuds d'un quadrillage (CM2 : milieu, parallèle…)    */
/* ------------------------------------------------------------------ */

export interface PlanPoints {
  cols: number;
  rows: number;
  points: Record<string, Cell>;
  segments: [string, string][];
  solution: Cell;
  /** Nom du point à placer (« M », « D », « E », « O »). */
  nom: string;
}

/** Lettre du point à placer, lue dans l'énoncé (« Place le point D »). */
function nomAPlacer(prompt: string, deja: string[]): string {
  const m = prompt.match(/[Pp]lace le (?:point|centre) ([A-Z])\b/);
  if (m && !deja.includes(m[1]!)) return m[1]!;
  return ['M', 'D', 'E', 'O', 'P'].find((l) => !deja.includes(l)) ?? '?';
}

export function lirePoints(it: Item): PlanPoints | null {
  if (!est(it) || it.task !== 'tracer' || it.meta?.noeuds !== true || !it.grid) return null;
  const pts = it.meta.points;
  if (!pts || typeof pts !== 'object') return null;
  const points: Record<string, Cell> = {};
  for (const [k, v] of Object.entries(pts as Record<string, unknown>)) {
    if (!estCase(v)) return null;
    points[k] = [v[0], v[1]];
  }
  const solution = lireCase(it.meta.solution) ?? lireCase(it.answer);
  if (!solution) return null;
  const segs = Array.isArray(it.meta.segments)
    ? (it.meta.segments as unknown[]).filter(
        (s): s is [string, string] =>
          Array.isArray(s) && s.length === 2 && s.every((n) => typeof n === 'string' && n in points),
      )
    : [];
  const { cols, rows } = it.grid;
  const tous = [...Object.values(points), solution];
  if (!tous.every(([x, y]) => x >= 0 && y >= 0 && x <= cols && y <= rows)) return null;
  return { cols, rows, points, segments: segs, solution, nom: nomAPlacer(it.prompt, Object.keys(points)) };
}

/* ------------------------------------------------------------------ */
/* Reproduction d'une figure sur quadrillage (CE1)                     */
/* ------------------------------------------------------------------ */

export interface PlanReproduire {
  cols: number;
  rows: number;
  sommets: Cell[];
  figure: string;
}

export function lireReproduire(it: Item): PlanReproduire | null {
  if (!est(it) || it.task !== 'tracer' || !it.grid) return null;
  const t = it.meta?.tracer as { sommets?: unknown; figure?: unknown } | undefined;
  if (!t || !Array.isArray(t.sommets) || t.sommets.length < 3 || !t.sommets.every(estCase)) return null;
  return {
    cols: it.grid.cols,
    rows: it.grid.rows,
    sommets: (t.sommets as Cell[]).map(([x, y]) => [x, y]),
    figure: typeof t.figure === 'string' ? t.figure : it.shape,
  };
}

/**
 * Le polygone tracé est-il la même figure que le modèle, à une translation près ?
 * (sommets dans n'importe quel ordre de parcours et à partir de n'importe quel sommet)
 */
export function memeFigureTranslatee(modele: Cell[], trace: Cell[]): boolean {
  if (modele.length !== trace.length || !trace.length) return false;
  const n = modele.length;
  const base = (cs: Cell[], i: number) => cs.map(([x, y]) => [x - cs[i]![0], y - cs[i]![1]] as Cell);
  const refs = base(modele, 0);
  for (const sens of [1, -1])
    for (let d = 0; d < n; d++) {
      const ordre = Array.from({ length: n }, (_, k) => trace[(((d + sens * k) % n) + n) % n]!);
      const t = base(ordre, 0);
      if (t.every((c, k) => c[0] === refs[k]![0] && c[1] === refs[k]![1])) return true;
    }
  return false;
}
