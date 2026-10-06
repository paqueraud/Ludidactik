/**
 * Figures planes à dessiner (Géomètre) : sommets d'un dessin type pour chaque identifiant de figure des
 * contenus, ou `meta.figure.points` quand le contenu les fournit. Outils virtuels : angle droit à
 * l'équerre, longueur d'un côté à la règle (en carreaux).
 */
import type { GeometryItem, Item } from '@/content/schemas';
import { est } from './grille';

export type P = [number, number];

export type Dessin =
  | { type: 'polygone'; points: P[] }
  | { type: 'cercle'; centre: P; rayon: number }
  | { type: 'angle'; sommet: P; a: P; b: P }
  | { type: 'points'; points: P[] };

/** Dessins types (unités = carreaux), utilisés quand le contenu ne fournit pas de points. */
const TYPES: Record<string, Dessin> = {
  carre: {
    type: 'polygone',
    points: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
  },
  rectangle: {
    type: 'polygone',
    points: [
      [0, 0],
      [6, 0],
      [6, 3],
      [0, 3],
    ],
  },
  triangle: {
    type: 'polygone',
    points: [
      [0, 4],
      [6, 4],
      [2, 0],
    ],
  },
  triangle_rectangle: {
    type: 'polygone',
    points: [
      [0, 0],
      [0, 4],
      [5, 4],
    ],
  },
  losange: {
    type: 'polygone',
    points: [
      [3, 0],
      [6, 2],
      [3, 4],
      [0, 2],
    ],
  },
  cercle: { type: 'cercle', centre: [3, 3], rayon: 3 },
  angle_droit: { type: 'angle', sommet: [1, 5], a: [7, 5], b: [1, 0] },
  angle_aigu: { type: 'angle', sommet: [1, 5], a: [7, 5], b: [5, 0.5] },
  angle_obtus: { type: 'angle', sommet: [4, 5], a: [8, 5], b: [0.5, 1] },
  points_alignes: {
    type: 'points',
    points: [
      [0.5, 4.5],
      [3, 3],
      [6.5, 0.9],
    ],
  },
  points_non_alignes: {
    type: 'points',
    points: [
      [0.5, 4.5],
      [3.5, 1.2],
      [6.5, 3.4],
    ],
  },
};

const poly = (...points: P[]): Dessin => ({ type: 'polygone', points });
Object.assign(TYPES, {
  triangle_isocele: poly([0, 4], [6, 4], [3, 0]),
  triangle_equilateral: poly([0, 5.2], [6, 5.2], [3, 0]),
  trapeze: poly([1, 0], [5, 0], [7, 3], [0, 3]),
  trapeze_rectangle: poly([0, 0], [4, 0], [6, 3], [0, 3]),
  pentagone: poly([3, 0], [5.9, 2.1], [4.8, 5.4], [1.2, 5.4], [0.1, 2.1]),
  hexagone: poly([1.5, 0], [4.5, 0], [6, 2.6], [4.5, 5.2], [1.5, 5.2], [0, 2.6]),
});

/** Nom d'une figure (« triangle rectangle ») → dessin type, pour les étiquettes à classer. */
export function dessinDuNom(nom: string): Dessin | null {
  const id = nom
    .toLowerCase()
    .replace(/^(un|une|le|la|l’|l')\s*/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return TYPES[id] ?? null;
}

const estPoint = (v: unknown): v is P =>
  Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Dessin d'un item « nommer » / « propriétés » (null si la figure n'est pas dessinable). */
export function dessinDe(it: Item): Dessin | null {
  if (!est(it)) return null;
  const f = it.meta?.figure as
    { points?: unknown; cercle?: { centre?: unknown; rayon?: unknown } } | undefined;
  if (f?.cercle && estPoint(f.cercle.centre) && typeof f.cercle.rayon === 'number')
    return { type: 'cercle', centre: f.cercle.centre, rayon: f.cercle.rayon };
  if (f && Array.isArray(f.points) && f.points.length >= 3 && f.points.every(estPoint))
    return { type: 'polygone', points: f.points as P[] };
  return TYPES[it.shape] ?? null;
}

/** Item de figure plane à reconnaître (nommer, propriétés). */
export function estFigurePlane(it: Item): it is GeometryItem {
  if (!est(it) || (it.task !== 'nommer' && it.task !== 'proprietes')) return false;
  if (!it.choices || it.choices.length < 2 || !it.choices.includes(it.answer)) return false;
  return dessinDe(it) !== null;
}

/** Cadre englobant d'un dessin. */
export function cadre(d: Dessin): { x: number; y: number; w: number; h: number } {
  const pts =
    d.type === 'cercle'
      ? [
          [d.centre[0] - d.rayon, d.centre[1] - d.rayon],
          [d.centre[0] + d.rayon, d.centre[1] + d.rayon],
        ]
      : d.type === 'angle'
        ? [d.sommet, d.a, d.b]
        : d.points;
  const xs = pts.map((p) => p[0]!);
  const ys = pts.map((p) => p[1]!);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** L'angle au sommet `i` d'un polygone est-il droit ? */
export function angleDroit(points: P[], i: number): boolean {
  const n = points.length;
  const s = points[i]!;
  const a = points[(i + n - 1) % n]!;
  const b = points[(i + 1) % n]!;
  const u = [a[0] - s[0], a[1] - s[1]];
  const v = [b[0] - s[0], b[1] - s[1]];
  const cos = (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!));
  return Math.abs(cos) < 0.02;
}

/** Mesure d'un angle (en degrés) entre deux demi-droites issues de `s`. */
export function mesureAngle(s: P, a: P, b: P): number {
  const u = Math.atan2(a[1] - s[1], a[0] - s[0]);
  const v = Math.atan2(b[1] - s[1], b[0] - s[0]);
  let d = Math.abs(u - v) * (180 / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}

export const longueur = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Côtés de même longueur (pour le codage du niveau Facile) : groupe de chaque côté, -1 si unique. */
export function groupesCotes(points: P[]): number[] {
  const n = points.length;
  const ls = points.map((p, i) => longueur(p, points[(i + 1) % n]!));
  const groupes: number[] = Array<number>(n).fill(-1);
  let g = 0;
  for (let i = 0; i < n; i++) {
    if (groupes[i] !== -1) continue;
    const memes = ls.map((l, j) => (Math.abs(l - ls[i]!) < 0.05 ? j : -1)).filter((j) => j >= 0);
    if (memes.length > 1) {
      memes.forEach((j) => (groupes[j] = g));
      g++;
    }
  }
  return groupes;
}

/** Rotation d'un point autour d'un centre (degrés). */
export function pivoter([x, y]: P, [cx, cy]: P, deg: number): P {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}
