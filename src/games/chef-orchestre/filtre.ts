import type { Item } from '@/content/schemas';

/** Classement de mots (classes de mots, catégories) : pas les phrases à analyser (Labo des fonctions). */
export const pourChef = (item: Item) =>
  item.kind === 'classification' &&
  item.meta?.phrase === undefined &&
  item.elements.every((e) => e.label.length <= 32);
