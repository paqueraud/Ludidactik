/** Filtre léger (chargé avec le registre) : quels items se jouent au Laboratoire ? */
import type { Item } from '@/content/schemas';

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
