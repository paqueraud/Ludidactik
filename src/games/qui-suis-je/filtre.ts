/** Filtre léger (chargé avec le registre) : quels QCM se jouent en devinette ? */
import type { Item } from '@/content/schemas';

/**
 * Un QCM « ordinaire » : on écarte les QCM qui suivent une autre convention de jeu (comparaison <, =, >,
 * ponctuation, compréhension de texte, graphiques, nombres en lettres) et l'anglais (Jacques a dit).
 */
export const estDevinette = (it: Item): boolean =>
  it.kind === 'mcq' &&
  it.lang !== 'en-GB' &&
  it.meta?.gauche === undefined &&
  it.meta?.phrase === undefined &&
  it.meta?.texte === undefined &&
  it.meta?.graphique === undefined &&
  it.meta?.lettres === undefined;
