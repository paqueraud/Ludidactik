/** Liste des fruits et couleur de leur jus. */
export const FRUITS = ['pasteque', 'orange', 'pomme', 'citron', 'prune', 'kiwi'] as const;
export type Fruit = (typeof FRUITS)[number];

/** Couleur du jus (éclaboussure quand on tranche). */
export const JUS: Record<Fruit, string> = {
  pasteque: '#FF5A6E',
  orange: '#FFA530',
  pomme: '#FFE9A8',
  citron: '#FFE45C',
  prune: '#B05AD8',
  kiwi: '#9BD64A',
};
