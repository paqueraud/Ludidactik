/** Le Géomètre : quel atelier pour quel item, et vérifications des tracés. */
import type { Item } from '@/content/schemas';
import { estFigurePlane } from '../_geometrie-commun/figures';
import { est, lirePoints, lireReproduire } from '../_geometrie-commun/grille';

export type Instrument =
  | { figure: 'segment'; longueur: number }
  | { figure: 'cercle'; rayon: number }
  | { figure: 'angle_droit' }
  | { figure: 'rectangle'; longueur: number; largeur: number };

export function lireInstrument(it: Item): Instrument | null {
  if (!est(it) || it.task !== 'tracer') return null;
  const t = it.meta?.tracer as Record<string, unknown> | undefined;
  if (!t || t.sommets) return null;
  const n = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null);
  if (t.figure === 'segment' && n(t.longueur) && n(t.longueur)! <= 15)
    return { figure: 'segment', longueur: n(t.longueur)! };
  if (t.figure === 'cercle' && n(t.rayon) && n(t.rayon)! <= 7)
    return { figure: 'cercle', rayon: n(t.rayon)! };
  if (t.figure === 'angle_droit') return { figure: 'angle_droit' };
  if (t.figure === 'rectangle' && n(t.longueur) && n(t.largeur) && n(t.longueur)! <= 11 && n(t.largeur)! <= 8)
    return { figure: 'rectangle', longueur: n(t.longueur)!, largeur: n(t.largeur)! };
  return null;
}

export type Mode = 'figure' | 'points' | 'reproduire' | 'instrument' | 'classer';

const LECONS_CLASSER = /\.GEO\.(FIGURES|VOCAB)/;

export function modeDe(it: Item): Mode | null {
  if (it.kind === 'classification') return LECONS_CLASSER.test(it.lessonId) ? 'classer' : null;
  if (estFigurePlane(it)) return 'figure';
  if (lirePoints(it)) return 'points';
  if (lireReproduire(it)) return 'reproduire';
  if (lireInstrument(it)) return 'instrument';
  return null;
}

export const estPourGeometre = (it: Item): it is Item => modeDe(it) !== null;

type P = [number, number];

/** Le polygone tracé est-il un rectangle de côtés L et l (dans n'importe quelle position) ? */
export function estRectangle(pts: P[], L: number, l: number): boolean {
  if (pts.length !== 4) return false;
  const cotes = pts.map((p, i) => {
    const q = pts[(i + 1) % 4]!;
    return [q[0] - p[0], q[1] - p[1]] as P;
  });
  const longueurs = cotes.map(([x, y]) => Math.hypot(x, y));
  for (let i = 0; i < 4; i++) {
    const u = cotes[i]!;
    const v = cotes[(i + 1) % 4]!;
    if (Math.abs(u[0] * v[0] + u[1] * v[1]) > 1e-9) return false;
  }
  const [a, b] = [longueurs[0]!, longueurs[1]!];
  const ok = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  return (ok(a, L) && ok(b, l)) || (ok(a, l) && ok(b, L));
}
