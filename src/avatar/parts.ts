/** Catalogue des pièces d'avatar (SVG composable). Les pièces « boutique » se débloquent avec les Ludis (Phase 5). */

export const VISAGES = ['rond', 'ovale', 'doux'] as const;
export const YEUX = ['ronds', 'rieurs', 'etoiles', 'malins'] as const;
export const BOUCHES = ['sourire', 'grand', 'langue', 'o'] as const;
export const COIFFURES = [
  'courte',
  'herisse',
  'boucles',
  'longue',
  'couettes',
  'chignon',
  'afro',
  'rasee',
] as const;
export const ACCESSOIRES = [
  'aucun',
  'lunettes',
  'casquette',
  'noeud',
  'couronne',
  'bonnet_phrygien',
  'casque_alpi',
] as const;
export const COMPAGNONS = ['aucun', 'chat', 'renard', 'dragon', 'robot', 'lapin'] as const;

export type Visage = (typeof VISAGES)[number];
export type Yeux = (typeof YEUX)[number];
export type Bouche = (typeof BOUCHES)[number];
export type Coiffure = (typeof COIFFURES)[number];
export type Accessoire = (typeof ACCESSOIRES)[number];
export type Compagnon = (typeof COMPAGNONS)[number];

/** Palette large de teints. */
export const TEINTS = [
  '#FDE3CF',
  '#F6CBA5',
  '#E8B48A',
  '#D29A6C',
  '#B07A50',
  '#8D5A3B',
  '#6B4128',
  '#4A2C1C',
];
export const COULEURS_CHEVEUX = [
  '#2B1D14',
  '#5A3825',
  '#8B5A2B',
  '#C68642',
  '#E8C07D',
  '#F2E2B5',
  '#B5462F',
  '#7E57C2',
  '#29B6F6',
  '#EC407A',
];
export const COULEURS_HAUT = [
  '#4FC3F7',
  '#7BD389',
  '#FFD45C',
  '#FF7A6B',
  '#8E7CFF',
  '#26C6DA',
  '#F48FB1',
  '#FFA726',
  '#24304A',
  '#FFFFFF',
];

export interface AvatarConfig {
  visage: Visage;
  teint: string;
  yeux: Yeux;
  bouche: Bouche;
  coiffure: Coiffure;
  couleurCheveux: string;
  haut: string;
  accessoire: Accessoire;
  compagnon: Compagnon;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  visage: 'rond',
  teint: TEINTS[1]!,
  yeux: 'ronds',
  bouche: 'sourire',
  coiffure: 'courte',
  couleurCheveux: COULEURS_CHEVEUX[1]!,
  haut: COULEURS_HAUT[0]!,
  accessoire: 'aucun',
  compagnon: 'chat',
};

/** Pièces réservées à la boutique (achetées avec des Ludis, jamais avec de l'argent réel). */
export const BOUTIQUE: Partial<Record<Accessoire | Compagnon, number>> = {
  couronne: 120,
  bonnet_phrygien: 80,
  casque_alpi: 80,
  dragon: 150,
  robot: 100,
};

export const LIBELLES: Record<string, string> = {
  rond: 'Rond',
  ovale: 'Ovale',
  doux: 'Doux',
  ronds: 'Ronds',
  rieurs: 'Rieurs',
  etoiles: 'Étoiles',
  malins: 'Malins',
  sourire: 'Sourire',
  grand: 'Grand sourire',
  langue: 'Langue',
  o: 'Étonné',
  courte: 'Courte',
  herisse: 'Hérissée',
  boucles: 'Boucles',
  longue: 'Longue',
  couettes: 'Couettes',
  chignon: 'Chignon',
  afro: 'Afro',
  rasee: 'Rasée',
  aucun: 'Aucun',
  lunettes: 'Lunettes',
  casquette: 'Casquette',
  noeud: 'Nœud',
  couronne: 'Couronne',
  bonnet_phrygien: 'Bonnet phrygien',
  casque_alpi: "Casque d'alpiniste",
  chat: 'Chat',
  renard: 'Renard',
  dragon: 'Dragon',
  robot: 'Robot',
  lapin: 'Lapin',
};

export function randomAvatar(rand: () => number = Math.random): AvatarConfig {
  const pick = <T>(l: readonly T[]) => l[Math.floor(rand() * l.length)]!;
  const free = <T extends string>(l: readonly T[]) => l.filter((x) => !(x in BOUTIQUE));
  return {
    visage: pick(VISAGES),
    teint: pick(TEINTS),
    yeux: pick(YEUX),
    bouche: pick(BOUCHES),
    coiffure: pick(COIFFURES),
    couleurCheveux: pick(COULEURS_CHEVEUX),
    haut: pick(COULEURS_HAUT),
    accessoire: pick(free(ACCESSOIRES)),
    compagnon: pick(free(COMPAGNONS)),
  };
}
