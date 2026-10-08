/**
 * Items qui n'ont de sens qu'avec un support dessiné ou affiché à côté de l'énoncé (règle graduée,
 * graphique, balance, figure, quadrillage, terrain du robot, plaques et barres à construire, texte de
 * compréhension, dictée de nombres…). Les jeux génériques (Grand Prix, Tables Ninja, Attrape-bulles,
 * Robot calculateur, Compte est bon, Vrai/Faux, Memory, Dobble…) ne savent pas afficher ce support :
 * ils les écartent avec `sansDessin` dans leur `filterItem`.
 * (`meta.glisse`, `meta.posee`, `meta.complement`… restent jouables : l'énoncé écrit « 3,45 × 100 »
 * se suffit à lui-même.)
 */
import type { Item } from '@/content/schemas';

export const CLES_DESSIN = [
  'mesure',
  'graphique',
  'balance',
  'figure',
  'quadrillage',
  'rectangles',
  'robot',
  'construire',
  'enquete',
  'texte',
  'dictee',
  'circuit',
] as const;

export function besoinDessin(item: Item): boolean {
  const meta = item.meta;
  return !!meta && CLES_DESSIN.some((k) => meta[k] !== undefined && meta[k] !== false);
}

/** Filtre à combiner dans le `filterItem` d'un jeu générique. */
export const sansDessin = (item: Item): boolean => !besoinDessin(item);
