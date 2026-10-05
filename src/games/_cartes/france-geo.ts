/**
 * Géographie simplifiée de la France (lon/lat, degrés) : frontières, côtes, limites des 13 régions
 * métropolitaines (découpage de 2016), 5 régions d'outre-mer, fleuves et massifs.
 * Chaque limite entre deux régions est écrite UNE fois (chaîne) et réutilisée par les deux régions :
 * pas de trou ni de chevauchement. Les tracés sont volontairement simplifiés (quelques dizaines de
 * points par région) mais restent géographiquement fidèles.
 */
import { type LonLat, anneau, rev } from './geo';

/* ------------------------------------------------------------------ */
/* Côtes et frontières extérieures                                     */
/* ------------------------------------------------------------------ */

/** Côte des Hauts-de-France : du Tréport à la frontière belge. */
export const C_HDF_COTE: LonLat[] = [
  [1.38, 50.06],
  [1.55, 50.2],
  [1.6, 50.4],
  [1.6, 50.73],
  [1.85, 50.95],
  [2.2, 51.02],
  [2.55, 51.08],
];
/** Frontière belge : de la mer du Nord au point triple Hauts-de-France / Grand Est / Belgique. */
export const C_BELGIQUE: LonLat[] = [
  [2.55, 51.08],
  [2.65, 50.82],
  [2.9, 50.7],
  [3.15, 50.78],
  [3.28, 50.53],
  [3.67, 50.45],
  [4.03, 50.35],
  [4.23, 50.07],
  [4.15, 49.98],
];
/** Frontière nord-est du Grand Est : Belgique (pointe de Givet), Luxembourg, Allemagne (jusqu'au Rhin). */
export const C_GE_NORD: LonLat[] = [
  [4.15, 49.98],
  [4.45, 49.94],
  [4.82, 50.15],
  [4.87, 49.8],
  [5.4, 49.62],
  [5.82, 49.55],
  [6.36, 49.47],
  [6.73, 49.17],
  [7.05, 49.12],
  [7.35, 49.17],
  [7.6, 49.08],
  [8.0, 49.05],
  [8.23, 48.97],
];
/** Le Rhin, frontière avec l'Allemagne, de Lauterbourg à Bâle. */
export const C_RHIN: LonLat[] = [
  [8.23, 48.97],
  [7.95, 48.75],
  [7.8, 48.58],
  [7.7, 48.3],
  [7.58, 48.1],
  [7.55, 47.85],
  [7.58, 47.58],
];
/** Suisse (Sundgau). */
export const C_SUISSE_1: LonLat[] = [
  [7.58, 47.58],
  [7.4, 47.43],
  [7.1, 47.48],
];
/** Suisse (arc jurassien). */
export const C_SUISSE_2: LonLat[] = [
  [7.1, 47.48],
  [6.88, 47.33],
  [6.68, 47.08],
  [6.43, 46.92],
  [6.13, 46.6],
  [6.1, 46.45],
];
/** Suisse (pays de Gex, Léman, Mont-Blanc) puis Italie jusqu'aux Hautes-Alpes. */
export const C_SUISSE_3: LonLat[] = [
  [6.1, 46.45],
  [5.98, 46.22],
  [6.15, 46.18],
  [6.5, 46.4],
  [6.82, 46.4],
  [6.78, 46.15],
  [7.04, 45.92],
  [6.8, 45.7],
  [7.1, 45.48],
  [7.05, 45.22],
  [6.63, 45.1],
];
/** Italie : des Hautes-Alpes à Menton. */
export const C_ITALIE: LonLat[] = [
  [6.63, 45.1],
  [6.75, 44.9],
  [7.0, 44.7],
  [6.87, 44.45],
  [7.25, 44.15],
  [7.68, 44.13],
  [7.53, 43.88],
  [7.5, 43.78],
];
/** Côte méditerranéenne de Provence-Alpes-Côte d'Azur, de Menton au Petit-Rhône. */
export const C_PACA_COTE: LonLat[] = [
  [7.5, 43.78],
  [7.27, 43.69],
  [7.0, 43.55],
  [6.9, 43.43],
  [6.68, 43.27],
  [6.6, 43.18],
  [6.38, 43.12],
  [6.15, 43.03],
  [5.93, 43.1],
  [5.7, 43.17],
  [5.35, 43.25],
  [5.25, 43.33],
  [5.0, 43.4],
  [4.85, 43.33],
  [4.6, 43.37],
  [4.35, 43.45],
];
/** Côte de l'Occitanie, du Petit-Rhône à Cerbère. */
export const C_OCC_COTE: LonLat[] = [
  [4.35, 43.45],
  [4.1, 43.53],
  [3.85, 43.47],
  [3.65, 43.38],
  [3.45, 43.27],
  [3.2, 43.15],
  [3.05, 42.93],
  [3.03, 42.75],
  [3.05, 42.55],
  [3.17, 42.44],
];
/** Pyrénées (frontière espagnole et andorrane) : de Cerbère au point triple Occitanie / Nouvelle-Aquitaine. */
export const C_ESPAGNE_OCC: LonLat[] = [
  [3.17, 42.44],
  [2.75, 42.4],
  [2.3, 42.42],
  [1.95, 42.45],
  [1.72, 42.5],
  [1.45, 42.6],
  [0.7, 42.85],
  [0.3, 42.7],
  [-0.32, 42.83],
];
/** Pyrénées atlantiques jusqu'à Hendaye. */
export const C_ESPAGNE_NA: LonLat[] = [
  [-0.32, 42.83],
  [-0.75, 42.95],
  [-1.4, 43.05],
  [-1.45, 43.27],
  [-1.78, 43.37],
];
/** Côte atlantique de la Nouvelle-Aquitaine, d'Hendaye à la Sèvre niortaise. */
export const C_NA_COTE: LonLat[] = [
  [-1.78, 43.37],
  [-1.56, 43.48],
  [-1.45, 43.65],
  [-1.33, 44.1],
  [-1.25, 44.4],
  [-1.25, 44.65],
  [-1.2, 45.0],
  [-1.15, 45.4],
  [-1.07, 45.57],
  [-1.2, 45.75],
  [-1.05, 45.95],
  [-1.15, 46.15],
  [-1.15, 46.31],
];
/** Côte des Pays de la Loire, de la Sèvre niortaise à la Vilaine. */
export const C_PDL_COTE: LonLat[] = [
  [-1.15, 46.31],
  [-1.45, 46.38],
  [-1.8, 46.5],
  [-1.95, 46.7],
  [-2.15, 46.88],
  [-2.0, 47.05],
  [-2.15, 47.13],
  [-2.25, 47.25],
  [-2.5, 47.28],
  [-2.45, 47.43],
];
/** Côte bretonne, de la Vilaine au Couesnon (Mont-Saint-Michel). */
export const C_BRE_COTE: LonLat[] = [
  [-2.45, 47.43],
  [-2.75, 47.5],
  [-3.12, 47.48],
  [-3.15, 47.6],
  [-3.4, 47.7],
  [-3.9, 47.85],
  [-4.37, 47.8],
  [-4.4, 47.95],
  [-4.73, 48.04],
  [-4.35, 48.1],
  [-4.55, 48.25],
  [-4.78, 48.33],
  [-4.75, 48.52],
  [-4.4, 48.65],
  [-3.98, 48.72],
  [-3.5, 48.83],
  [-3.05, 48.8],
  [-2.75, 48.53],
  [-2.3, 48.65],
  [-2.0, 48.65],
  [-1.51, 48.63],
];
/** Côte normande, du Couesnon au Tréport (Cotentin, baie de Seine, pays de Caux). */
export const C_NORM_COTE: LonLat[] = [
  [-1.51, 48.63],
  [-1.58, 48.85],
  [-1.6, 49.1],
  [-1.8, 49.37],
  [-1.85, 49.7],
  [-1.62, 49.65],
  [-1.27, 49.7],
  [-1.25, 49.48],
  [-1.1, 49.38],
  [-0.75, 49.35],
  [-0.25, 49.3],
  [0.1, 49.4],
  [0.1, 49.5],
  [0.2, 49.7],
  [0.6, 49.85],
  [1.1, 49.93],
  [1.38, 50.06],
];

/* ------------------------------------------------------------------ */
/* Limites intérieures entre régions                                   */
/* ------------------------------------------------------------------ */

const L_HDF_NOR: LonLat[] = [
  [1.38, 50.06],
  [1.75, 49.7],
  [1.72, 49.45],
  [1.7, 49.25],
];
const L_HDF_IDF: LonLat[] = [
  [1.7, 49.25],
  [2.3, 49.17],
  [2.85, 49.08],
  [3.3, 49.05],
];
const L_HDF_GE: LonLat[] = [
  [3.3, 49.05],
  [3.65, 49.3],
  [4.05, 49.45],
  [4.1, 49.75],
  [4.15, 49.98],
];
const L_NOR_IDF: LonLat[] = [
  [1.7, 49.25],
  [1.6, 49.05],
  [1.5, 48.85],
];
const L_IDF_CVL: LonLat[] = [
  [1.5, 48.85],
  [1.62, 48.55],
  [1.95, 48.3],
  [2.4, 48.13],
  [3.0, 48.15],
];
const L_IDF_BFC: LonLat[] = [
  [3.0, 48.15],
  [3.4, 48.37],
];
const L_IDF_GE: LonLat[] = [
  [3.4, 48.37],
  [3.62, 48.65],
  [3.5, 48.9],
  [3.3, 49.05],
];
const L_GE_BFC: LonLat[] = [
  [3.4, 48.37],
  [3.9, 48.0],
  [4.35, 47.95],
  [4.8, 47.82],
  [5.4, 47.65],
  [5.85, 47.88],
  [6.5, 47.92],
  [6.85, 47.82],
  [7.1, 47.48],
];
const L_NOR_CVL: LonLat[] = [
  [1.5, 48.85],
  [1.1, 48.75],
  [0.8, 48.5],
];
const L_NOR_PDL: LonLat[] = [
  [0.8, 48.5],
  [0.35, 48.45],
  [-0.05, 48.38],
  [-0.5, 48.5],
  [-0.85, 48.5],
  [-1.07, 48.52],
];
const L_NOR_BRE: LonLat[] = [
  [-1.07, 48.52],
  [-1.3, 48.55],
  [-1.51, 48.63],
];
const L_BRE_PDL: LonLat[] = [
  [-1.07, 48.52],
  [-1.05, 48.1],
  [-1.25, 47.8],
  [-1.75, 47.7],
  [-2.1, 47.62],
  [-2.45, 47.43],
];
const L_PDL_CVL: LonLat[] = [
  [0.8, 48.5],
  [0.9, 48.1],
  [0.6, 47.7],
  [0.2, 47.3],
  [0.05, 47.05],
];
const L_PDL_NA: LonLat[] = [
  [0.05, 47.05],
  [-0.6, 46.98],
  [-0.82, 46.65],
  [-0.62, 46.35],
  [-1.15, 46.31],
];
const L_CVL_NA: LonLat[] = [
  [0.05, 47.05],
  [0.6, 46.95],
  [0.9, 46.6],
  [1.2, 46.42],
  [1.75, 46.42],
  [2.28, 46.42],
];
const L_CVL_ARA: LonLat[] = [
  [2.28, 46.42],
  [2.6, 46.55],
  [3.0, 46.75],
];
const L_CVL_BFC: LonLat[] = [
  [3.0, 46.75],
  [2.88, 47.1],
  [2.95, 47.45],
  [2.85, 47.65],
  [3.1, 47.9],
  [3.0, 48.15],
];
const L_BFC_ARA: LonLat[] = [
  [3.0, 46.75],
  [3.65, 46.55],
  [4.0, 46.2],
  [4.4, 46.3],
  [4.9, 46.4],
  [5.4, 46.28],
  [5.75, 46.28],
  [6.1, 46.45],
];
const L_NA_ARA: LonLat[] = [
  [2.28, 46.42],
  [2.55, 46.0],
  [2.5, 45.65],
  [2.35, 45.4],
  [2.2, 45.15],
  [2.06, 44.9],
];
const L_NA_OCC: LonLat[] = [
  [2.06, 44.9],
  [1.45, 44.88],
  [1.0, 44.5],
  [0.65, 44.15],
  [0.1, 44.0],
  [-0.1, 43.6],
  [-0.05, 43.3],
  [-0.2, 43.0],
  [-0.32, 42.83],
];
const L_ARA_OCC: LonLat[] = [
  [2.06, 44.9],
  [2.65, 44.82],
  [3.15, 44.9],
  [3.45, 44.75],
  [4.0, 44.5],
  [4.25, 44.4],
  [4.65, 44.25],
];
const L_OCC_PACA: LonLat[] = [
  [4.65, 44.25],
  [4.75, 43.95],
  [4.62, 43.68],
  [4.45, 43.55],
  [4.35, 43.45],
];
const L_ARA_PACA: LonLat[] = [
  [4.65, 44.25],
  [5.1, 44.35],
  [5.6, 44.3],
  [5.8, 44.65],
  [6.3, 44.85],
  [6.63, 45.1],
];

/* ------------------------------------------------------------------ */
/* Régions                                                             */
/* ------------------------------------------------------------------ */

export interface RegionGeo {
  id: string;
  nom: string;
  anneaux: LonLat[][];
}

const CORSE: LonLat[] = [
  [9.4, 43.0],
  [9.45, 42.7],
  [9.55, 42.3],
  [9.45, 41.95],
  [9.3, 41.6],
  [9.15, 41.38],
  [8.8, 41.55],
  [8.85, 41.7],
  [8.7, 41.92],
  [8.6, 42.1],
  [8.65, 42.27],
  [8.75, 42.57],
  [8.95, 42.65],
  [9.3, 42.68],
  [9.35, 42.95],
];

/** Les 13 régions métropolitaines. */
export const REGIONS_METRO: RegionGeo[] = [
  {
    id: 'hauts-de-france',
    nom: 'Hauts-de-France',
    anneaux: [anneau(C_HDF_COTE, C_BELGIQUE, rev(L_HDF_GE), rev(L_HDF_IDF), rev(L_HDF_NOR))],
  },
  {
    id: 'normandie',
    nom: 'Normandie',
    anneaux: [anneau(C_NORM_COTE, L_HDF_NOR, L_NOR_IDF, L_NOR_CVL, L_NOR_PDL, L_NOR_BRE)],
  },
  {
    id: 'ile-de-france',
    nom: 'Île-de-France',
    anneaux: [anneau(L_HDF_IDF, rev(L_IDF_GE), rev(L_IDF_BFC), rev(L_IDF_CVL), rev(L_NOR_IDF))],
  },
  {
    id: 'grand-est',
    nom: 'Grand Est',
    anneaux: [anneau(C_GE_NORD, C_RHIN, C_SUISSE_1, rev(L_GE_BFC), L_IDF_GE, L_HDF_GE)],
  },
  {
    id: 'bretagne',
    nom: 'Bretagne',
    anneaux: [anneau(C_BRE_COTE, rev(L_NOR_BRE), L_BRE_PDL)],
  },
  {
    id: 'pays-de-la-loire',
    nom: 'Pays de la Loire',
    anneaux: [anneau(C_PDL_COTE, rev(L_BRE_PDL), rev(L_NOR_PDL), L_PDL_CVL, L_PDL_NA)],
  },
  {
    id: 'centre-val-de-loire',
    nom: 'Centre-Val de Loire',
    anneaux: [
      anneau(L_IDF_CVL, rev(L_CVL_BFC), rev(L_CVL_ARA), rev(L_CVL_NA), rev(L_PDL_CVL), rev(L_NOR_CVL)),
    ],
  },
  {
    id: 'bourgogne-franche-comte',
    nom: 'Bourgogne-Franche-Comté',
    anneaux: [anneau(L_IDF_BFC, L_GE_BFC, C_SUISSE_2, rev(L_BFC_ARA), L_CVL_BFC)],
  },
  {
    id: 'nouvelle-aquitaine',
    nom: 'Nouvelle-Aquitaine',
    anneaux: [anneau(C_NA_COTE, rev(L_PDL_NA), L_CVL_NA, L_NA_ARA, L_NA_OCC, C_ESPAGNE_NA)],
  },
  {
    id: 'auvergne-rhone-alpes',
    nom: 'Auvergne-Rhône-Alpes',
    anneaux: [anneau(L_BFC_ARA, C_SUISSE_3, rev(L_ARA_PACA), rev(L_ARA_OCC), rev(L_NA_ARA), L_CVL_ARA)],
  },
  {
    id: 'occitanie',
    nom: 'Occitanie',
    anneaux: [anneau(L_ARA_OCC, L_OCC_PACA, C_OCC_COTE, C_ESPAGNE_OCC, rev(L_NA_OCC))],
  },
  {
    id: 'provence-alpes-cote-d-azur',
    nom: 'Provence-Alpes-Côte d’Azur',
    anneaux: [anneau(L_ARA_PACA, C_ITALIE, C_PACA_COTE, rev(L_OCC_PACA))],
  },
  { id: 'corse', nom: 'Corse', anneaux: [CORSE] },
];

/** Contour de la France métropolitaine continentale (sans la Corse). */
export const CONTOUR_FRANCE: LonLat[] = anneau(
  C_HDF_COTE,
  C_BELGIQUE,
  C_GE_NORD,
  C_RHIN,
  C_SUISSE_1,
  C_SUISSE_2,
  C_SUISSE_3,
  C_ITALIE,
  C_PACA_COTE,
  C_OCC_COTE,
  C_ESPAGNE_OCC,
  C_ESPAGNE_NA,
  C_NA_COTE,
  C_PDL_COTE,
  C_BRE_COTE,
  C_NORM_COTE,
);
export const CONTOUR_CORSE = CORSE;
/** Frontière pyrénéenne complète (de Cerbère à Hendaye), réutilisée par la carte d'Europe. */
export const PYRENEES_FRONTIERE: LonLat[] = anneau(C_ESPAGNE_OCC, C_ESPAGNE_NA);

/* ------------------------------------------------------------------ */
/* Outre-mer (encarts)                                                 */
/* ------------------------------------------------------------------ */

export const REGIONS_OUTRE_MER: RegionGeo[] = [
  {
    id: 'guadeloupe',
    nom: 'Guadeloupe',
    anneaux: [
      // Basse-Terre
      [
        [-61.78, 16.33],
        [-61.6, 16.27],
        [-61.55, 16.05],
        [-61.6, 15.95],
        [-61.7, 15.95],
        [-61.8, 16.1],
      ],
      // Grande-Terre
      [
        [-61.55, 16.3],
        [-61.5, 16.5],
        [-61.4, 16.48],
        [-61.2, 16.3],
        [-61.3, 16.25],
        [-61.5, 16.22],
      ],
      // Marie-Galante
      [
        [-61.33, 15.98],
        [-61.2, 15.93],
        [-61.25, 15.87],
        [-61.33, 15.9],
      ],
    ],
  },
  {
    id: 'martinique',
    nom: 'Martinique',
    anneaux: [
      [
        [-61.23, 14.87],
        [-61.0, 14.85],
        [-60.82, 14.75],
        [-60.95, 14.55],
        [-60.83, 14.4],
        [-61.05, 14.43],
        [-61.18, 14.55],
        [-61.08, 14.62],
        [-61.23, 14.75],
      ],
    ],
  },
  {
    id: 'guyane',
    nom: 'Guyane',
    anneaux: [
      [
        [-54.0, 5.75],
        [-53.0, 5.5],
        [-52.3, 4.95],
        [-51.65, 4.2],
        [-51.9, 3.6],
        [-52.35, 2.6],
        [-52.9, 2.2],
        [-53.8, 2.3],
        [-54.5, 2.4],
        [-54.2, 3.2],
        [-54.0, 3.8],
        [-54.45, 4.5],
      ],
    ],
  },
  {
    id: 'la-reunion',
    nom: 'La Réunion',
    anneaux: [
      [
        [55.22, -20.9],
        [55.45, -20.87],
        [55.7, -21.0],
        [55.82, -21.2],
        [55.75, -21.35],
        [55.55, -21.38],
        [55.35, -21.28],
        [55.25, -21.1],
      ],
    ],
  },
  {
    id: 'mayotte',
    nom: 'Mayotte',
    anneaux: [
      [
        [45.05, -12.65],
        [45.2, -12.7],
        [45.22, -12.85],
        [45.15, -12.98],
        [45.1, -12.85],
        [45.05, -12.8],
      ],
      [
        [45.26, -12.76],
        [45.3, -12.79],
        [45.27, -12.82],
      ],
    ],
  },
];

/** Le Maroni (frontière ouest de la Guyane). */
export const MARONI: LonLat[] = [
  [-54.0, 5.75],
  [-54.45, 4.5],
  [-54.0, 3.8],
  [-54.2, 3.2],
  [-54.5, 2.4],
];

/* ------------------------------------------------------------------ */
/* Fleuves                                                             */
/* ------------------------------------------------------------------ */

export const FLEUVES: { id: string; nom: string; trace: LonLat[] }[] = [
  {
    id: 'seine',
    nom: 'Seine',
    trace: [
      [4.72, 47.48],
      [4.57, 47.86],
      [4.07, 48.3],
      [3.73, 48.52],
      [3.5, 48.49],
      [2.95, 48.38],
      [2.66, 48.54],
      [2.35, 48.86],
      [2.2, 48.95],
      [1.95, 48.98],
      [1.72, 48.99],
      [1.48, 49.09],
      [1.4, 49.24],
      [1.09, 49.44],
      [0.85, 49.42],
      [0.73, 49.53],
      [0.47, 49.47],
      [0.15, 49.45],
    ],
  },
  {
    id: 'loire',
    nom: 'Loire',
    trace: [
      [4.22, 44.84],
      [3.95, 45.1],
      [4.1, 45.4],
      [4.2, 45.6],
      [4.07, 46.03],
      [3.98, 46.48],
      [3.46, 46.83],
      [3.16, 46.99],
      [3.05, 47.2],
      [2.93, 47.41],
      [2.63, 47.69],
      [1.9, 47.9],
      [1.33, 47.59],
      [0.98, 47.41],
      [0.69, 47.39],
      [-0.08, 47.26],
      [-0.55, 47.4],
      [-1.18, 47.37],
      [-1.55, 47.21],
      [-2.2, 47.27],
    ],
  },
  {
    id: 'garonne',
    nom: 'Garonne',
    trace: [
      [0.7, 42.85],
      [0.72, 43.1],
      [1.0, 43.2],
      [1.33, 43.46],
      [1.44, 43.6],
      [1.3, 43.85],
      [0.62, 44.2],
      [0.17, 44.5],
      [-0.25, 44.55],
      [-0.55, 44.85],
      [-0.7, 45.05],
      [-0.85, 45.3],
      [-1.07, 45.57],
    ],
  },
  {
    id: 'rhone',
    nom: 'Rhône',
    trace: [
      [6.15, 46.2],
      [5.85, 46.1],
      [5.83, 45.95],
      [5.65, 45.75],
      [5.35, 45.85],
      [5.1, 45.8],
      [4.83, 45.75],
      [4.87, 45.52],
      [4.89, 44.93],
      [4.73, 44.55],
      [4.65, 44.25],
      [4.8, 43.95],
      [4.63, 43.68],
      [4.75, 43.45],
      [4.85, 43.33],
    ],
  },
  {
    id: 'rhin',
    nom: 'Rhin',
    trace: [
      [7.58, 47.58],
      [7.55, 47.85],
      [7.58, 48.1],
      [7.7, 48.3],
      [7.8, 48.58],
      [7.95, 48.75],
      [8.23, 48.97],
      [8.45, 49.3],
    ],
  },
];

/** Le lac Léman (décor ; le Rhône le traverse). */
export const LEMAN: LonLat[] = [
  [6.15, 46.2],
  [6.35, 46.35],
  [6.6, 46.45],
  [6.9, 46.42],
  [6.82, 46.36],
  [6.55, 46.38],
  [6.3, 46.28],
];

/* ------------------------------------------------------------------ */
/* Massifs                                                             */
/* ------------------------------------------------------------------ */

export const MASSIFS: { id: string; nom: string; anneaux: LonLat[][] }[] = [
  {
    id: 'alpes',
    nom: 'Alpes',
    anneaux: [
      [
        [6.25, 46.3],
        [6.75, 46.3],
        [6.98, 45.92],
        [6.95, 45.5],
        [6.98, 45.2],
        [6.6, 45.05],
        [6.85, 44.75],
        [6.8, 44.45],
        [7.15, 44.15],
        [7.4, 43.95],
        [7.05, 43.8],
        [6.6, 43.85],
        [6.15, 44.0],
        [5.75, 44.2],
        [5.45, 44.5],
        [5.55, 44.85],
        [5.7, 45.2],
        [5.8, 45.55],
        [5.95, 45.9],
      ],
    ],
  },
  {
    id: 'pyrenees',
    nom: 'Pyrénées',
    anneaux: [
      // La chaîne s'étend des deux côtés de la frontière franco-espagnole.
      [
        [-1.5, 43.25],
        [-0.8, 43.15],
        [-0.1, 43.08],
        [0.6, 43.02],
        [1.4, 42.95],
        [2.2, 42.78],
        [2.95, 42.6],
        [3.15, 42.43],
        [2.6, 42.15],
        [1.8, 42.15],
        [1.0, 42.25],
        [0.2, 42.4],
        [-0.6, 42.55],
        [-1.3, 42.75],
        [-1.75, 43.1],
      ],
    ],
  },
  {
    id: 'massif-central',
    nom: 'Massif central',
    anneaux: [
      [
        [2.1, 46.05],
        [2.9, 46.15],
        [3.7, 46.0],
        [4.3, 45.75],
        [4.55, 45.25],
        [4.55, 44.7],
        [4.1, 44.1],
        [3.45, 43.7],
        [2.6, 43.55],
        [2.05, 43.95],
        [1.6, 44.65],
        [1.55, 45.3],
        [1.75, 45.8],
      ],
    ],
  },
  {
    id: 'jura',
    nom: 'Jura',
    anneaux: [
      [
        [5.45, 46.15],
        [5.95, 46.25],
        [6.2, 46.55],
        [6.6, 46.95],
        [6.95, 47.35],
        [6.75, 47.42],
        [6.3, 47.2],
        [5.85, 46.85],
        [5.5, 46.5],
      ],
    ],
  },
  {
    id: 'vosges',
    nom: 'Vosges',
    anneaux: [
      [
        [6.85, 48.62],
        [7.15, 48.72],
        [7.38, 48.35],
        [7.28, 47.9],
        [6.95, 47.72],
        [6.65, 47.95],
        [6.62, 48.3],
      ],
    ],
  },
  {
    id: 'massif-corse',
    nom: 'Massif corse',
    anneaux: [
      [
        [8.9, 42.6],
        [9.22, 42.52],
        [9.35, 42.2],
        [9.25, 41.78],
        [9.05, 41.72],
        [8.88, 41.98],
        [8.75, 42.3],
      ],
    ],
  },
];
