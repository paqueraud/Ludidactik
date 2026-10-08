/**
 * Thèmes sensibles (guerres, Shoah, esclavage, exécutions…) : jamais dans un jeu de rapidité ou de
 * réflexes (Attrape-bulles, Dobble, Vrai/Faux express, Crocodiles…). Un item est sensible s'il porte
 * `meta.sensible` (posé par les banques et les adaptateurs) ou si c'est un QCM marqué `guillotine: false`.
 */
import type { Item } from '@/content/schemas';

export function estSensible(item: Item): boolean {
  if (item.meta?.sensible === true) return true;
  return item.kind === 'mcq' && item.guillotine === false;
}

/** Filtre à combiner dans le `filterItem` d'un jeu de rapidité. */
export const pasSensible = (item: Item): boolean => !estSensible(item);
