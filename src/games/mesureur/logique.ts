/** Le Mesureur : items acceptés et leçons. */
import type { Item } from '@/content/schemas';
import { estAngles, estEstimation, lireMesure } from '../_geometrie-commun/mesure';

/** Leçons de grandeurs (hors monnaie et durées, qui ont leurs propres jeux) et tracés à la règle. */
export const LECONS_MESUREUR =
  /\.GM\.(LONGUEURS|MASSES|LONG_MASSE_CONT|PERIMETRE|AIRES|ANGLES)|\.GEO\.TRACER/;

export function estPourMesureur(it: Item): it is Item {
  if (it.kind === 'numeric_answer') {
    const p = lireMesure(it);
    if (!p) return false;
    // Une conversion seule n'a de sens que dans une leçon de mesures.
    return p.type !== 'conversion' || LECONS_MESUREUR.test(it.lessonId);
  }
  if (it.kind === 'classification') return estAngles(it);
  if (it.kind === 'mcq')
    return estEstimation(it) && (LECONS_MESUREUR.test(it.lessonId) || it.meta?.grandeur !== undefined);
  return false;
}
