/** Filtre léger (chargé avec le registre) : quels items se jouent au Laboratoire ? */
import type { ClassificationItem, Item } from '@/content/schemas';

/**
 * Classements (sauf ceux d'autres conventions : fonctions dans la phrase, probabilités) et suites
 * d'étapes (cycles de vie, expériences). Les frises chronologiques vont à la Machine à remonter le temps.
 */
export const estExperience = (it: Item): boolean => {
  if (it.kind === 'ordering') return it.mode === 'etapes';
  if (it.kind !== 'classification') return false;
  if (it.meta?.phrase !== undefined) return false;
  const proba = ['impossible', 'peu probable', 'probable', 'certain'];
  return !it.categories.every((c) => proba.includes(c));
};

/** Catégorie « l'ampoule s'allume » d'un tri conducteurs / isolants (−1 si ce n'est pas un circuit). */
export function categorieAllumee(item: ClassificationItem): number {
  const circuit = item.meta?.circuit === true || item.categories.some((c) => /conducteur|isolant/i.test(c));
  if (!circuit) return -1;
  return item.categories.findIndex((c) => /conducteur|s.allume/i.test(c) && !/isolant|[ée]teint/i.test(c));
}
