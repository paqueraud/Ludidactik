/**
 * Les 5 cartes cliquables (ids stables : voir IDS.md) construites à partir des données géographiques.
 * france-regions · france-fleuves · france-massifs · europe · monde
 */
import { PAYS, TERRES_DECOR } from './europe-geo';
import {
  CONTOUR_CORSE,
  CONTOUR_FRANCE,
  FLEUVES,
  LEMAN,
  MARONI,
  MASSIFS,
  REGIONS_METRO,
  REGIONS_OUTRE_MER,
} from './france-geo';
import {
  type LonLat,
  type Projection,
  ajuster,
  centreLigne,
  centreSurface,
  cheminLigne,
  cheminSurface,
  equirect,
} from './geo';
import {
  AFRIQUE,
  AMERIQUE_NORD,
  AMERIQUE_SUD,
  ANTARCTIQUE,
  ASIE,
  EUROPE,
  MERS_FERMEES,
  OCEANIE,
  OCEANS,
} from './monde-geo';
import { resoudreId } from './ids';
import type { Carte, DecorCarte, EncartCarte, ZoneCarte } from './types';

const MER = '#BFE6F7';
const TERRE = '#FFF1D2';
const VOISINS = '#E7E1D3';
const PASTELS = [
  '#FFD9A8',
  '#C9E8B0',
  '#FFC9C2',
  '#CFE0FF',
  '#F6D1EE',
  '#FFF0A6',
  '#C6EDE6',
  '#E3D3FF',
  '#FFDDB8',
  '#D6F0C2',
  '#FFD0D9',
  '#D0E8FF',
  '#F3E2B8',
];

function surface(
  id: string,
  nom: string,
  anneaux: readonly (readonly LonLat[])[],
  proj: Projection,
  extra: Partial<ZoneCarte> = {},
): ZoneCarte {
  return {
    id,
    nom,
    forme: 'surface',
    d: cheminSurface(anneaux, proj),
    centre: centreSurface(anneaux, proj),
    geo: anneaux,
    ...extra,
  };
}

function decor(anneaux: readonly (readonly LonLat[])[], proj: Projection, style: Omit<DecorCarte, 'd'>) {
  return { d: cheminSurface(anneaux, proj), ...style };
}

/* ------------------------------------------------------------------ */
/* France                                                              */
/* ------------------------------------------------------------------ */

const FR_L = 1040;
const FR_H = 1020;
const projFrance = equirect({ lonMin: -5.4, latMax: 51.4, latRef: 46.5, k: 100 });

/** Pays voisins dessinés en fond des cartes de France. */
const voisinsFrance: DecorCarte[] = PAYS.filter((p) =>
  ['espagne', 'italie', 'suisse', 'allemagne', 'belgique', 'luxembourg', 'royaume-uni', 'pays-bas'].includes(
    p.id,
  ),
).map((p) => decor(p.anneaux, projFrance, { fill: VOISINS, stroke: '#FFFFFF', strokeWidth: 2 }));

/** Encarts d'outre-mer : une colonne dans l'Atlantique, à gauche. */
const ENCARTS_OM: EncartCarte[] = REGIONS_OUTRE_MER.map((r, i) => ({
  x: 8,
  y: 432 + i * 116,
  w: 182,
  h: 108,
  titre: r.nom,
}));
const boiteForme = (e: EncartCarte) => ({ x: e.x, y: e.y + 22, w: e.w, h: e.h - 24 });

const fondFrance = (fill: string, stroke = '#FFFFFF', strokeWidth = 2): DecorCarte[] =>
  REGIONS_METRO.map((r) => decor(r.anneaux, projFrance, { fill, stroke, strokeWidth }));

const franceRegions: Carte = {
  id: 'france-regions',
  titre: 'Les régions de France',
  largeur: FR_L,
  hauteur: FR_H,
  mer: MER,
  terre: TERRE,
  decor: voisinsFrance,
  encarts: ENCARTS_OM,
  zones: [
    ...REGIONS_METRO.map((r, i) =>
      surface(r.id, r.nom, r.anneaux, projFrance, { couleur: PASTELS[i % PASTELS.length] }),
    ),
    ...REGIONS_OUTRE_MER.map((r, i) => {
      const proj = ajuster(r.anneaux, boiteForme(ENCARTS_OM[i]!));
      return surface(r.id, r.nom, r.anneaux, proj, {
        couleur: PASTELS[(i + 5) % PASTELS.length],
        groupe: 'outre-mer',
      });
    }),
  ],
  groupes: {
    'outre-mer': { nom: 'Les régions d’outre-mer', zones: REGIONS_OUTRE_MER.map((r) => r.id) },
  },
};

const guyane = REGIONS_OUTRE_MER.find((r) => r.id === 'guyane')!;
const ENCART_GUYANE: EncartCarte = { x: 8, y: 740, w: 170, h: 150, titre: 'Guyane' };
const projGuyane = ajuster(guyane.anneaux, boiteForme(ENCART_GUYANE), 10);

const franceFleuves: Carte = {
  id: 'france-fleuves',
  titre: 'Les fleuves de France',
  largeur: FR_L,
  hauteur: FR_H,
  mer: MER,
  terre: TERRE,
  decor: [
    ...voisinsFrance,
    ...fondFrance('#E8F3D8', '#FFFFFF', 1.5),
    decor(guyane.anneaux, projGuyane, { fill: '#E8F3D8', stroke: '#FFFFFF', strokeWidth: 1.5 }),
    decor([LEMAN], projFrance, { fill: MER, stroke: '#7FC4E6', strokeWidth: 1.5, dessus: true }),
  ],
  encarts: [ENCART_GUYANE],
  zones: [
    ...FLEUVES.map((f) => ({
      id: f.id,
      nom: f.nom,
      forme: 'ligne' as const,
      d: cheminLigne([f.trace], projFrance),
      centre: centreLigne([f.trace], projFrance),
      geo: [f.trace],
    })),
    {
      id: 'maroni',
      nom: 'Maroni',
      forme: 'ligne' as const,
      d: cheminLigne([MARONI], projGuyane),
      centre: centreLigne([MARONI], projGuyane),
      geo: [MARONI],
    },
  ],
};

const franceMassifs: Carte = {
  id: 'france-massifs',
  titre: 'Les massifs montagneux de France',
  largeur: FR_L,
  hauteur: FR_H,
  mer: MER,
  terre: '#E9C99A',
  motif: 'montagnes',
  decor: [...voisinsFrance, ...fondFrance('#EAF4DC', '#FFFFFF', 1.5)],
  zones: MASSIFS.map((m) => surface(m.id, m.nom, m.anneaux, projFrance, { couleur: '#E3BD8A' })),
};

/* ------------------------------------------------------------------ */
/* Europe                                                              */
/* ------------------------------------------------------------------ */

const projEurope = equirect({ lonMin: -11, latMax: 71.5, latRef: 52, k: 22 });
const EU_L = Math.round(46 * Math.cos((52 * Math.PI) / 180) * 22);
const EU_H = Math.round((71.5 - 34) * 22);

const europe: Carte = {
  id: 'europe',
  titre: 'Les pays d’Europe',
  largeur: EU_L,
  hauteur: EU_H,
  mer: MER,
  terre: TERRE,
  decor: [
    decor(TERRES_DECOR, projEurope, { fill: VOISINS, stroke: VOISINS, strokeWidth: 1 }),
    // fond sous les pays : masque les petits écarts entre tracés simplifiés
    ...PAYS.map((p) => decor(p.anneaux, projEurope, { fill: VOISINS, stroke: VOISINS, strokeWidth: 3 })),
  ],
  zones: PAYS.map((p, i) =>
    surface(p.id, p.nom, p.anneaux, projEurope, {
      couleur: p.ue ? PASTELS[i % PASTELS.length] : '#E2DCCB',
      rayonTouche: p.rayonTouche,
      groupe: p.ue ? 'union-europeenne' : undefined,
    }),
  ),
  groupes: {
    'union-europeenne': {
      nom: 'L’Union européenne',
      zones: PAYS.filter((p) => p.ue).map((p) => p.id),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Monde                                                               */
/* ------------------------------------------------------------------ */

const projMonde = equirect({ lonMin: -180, latMax: 84, latRef: 0, k: 3 });

const monde: Carte = {
  id: 'monde',
  titre: 'Le monde : continents et océans',
  largeur: 1080,
  hauteur: (84 + 80) * 3,
  mer: '#A9DCF3',
  terre: TERRE,
  decor: [decor(MERS_FERMEES, projMonde, { fill: '#BFE6F7', dessus: true })],
  dessous: OCEANS.map((o) => o.id),
  zones: [
    ...OCEANS.map((o) => surface(o.id, o.nom, o.anneaux, projMonde, { couleur: '#A9DCF3' })),
    surface('amerique-du-nord', 'Amérique du Nord', AMERIQUE_NORD, projMonde, {
      couleur: '#FFC9A8',
      groupe: 'amerique',
    }),
    surface('amerique-du-sud', 'Amérique du Sud', AMERIQUE_SUD, projMonde, {
      couleur: '#FFB4A6',
      groupe: 'amerique',
    }),
    surface('europe', 'Europe', EUROPE, projMonde, { couleur: '#CFE0FF' }),
    surface('afrique', 'Afrique', AFRIQUE, projMonde, { couleur: '#FFE59A' }),
    surface('asie', 'Asie', ASIE, projMonde, { couleur: '#C9E8B0' }),
    surface('oceanie', 'Océanie', OCEANIE, projMonde, { couleur: '#F6D1EE' }),
    surface('antarctique', 'Antarctique', ANTARCTIQUE, projMonde, { couleur: '#F4F8FB' }),
  ],
  groupes: {
    amerique: { nom: 'Amérique', zones: ['amerique-du-nord', 'amerique-du-sud'] },
  },
};

// Centres plus parlants que le centroïde pour quelques océans (loin des bords de la carte)
const centresOceans: Record<string, LonLat> = {
  'ocean-atlantique': [-35, 20],
  'ocean-pacifique': [-140, 5],
  'ocean-indien': [75, -20],
  'ocean-arctique': [0, 76],
  'ocean-austral': [20, -64],
  antarctique: [20, -75],
  oceanie: [134, -25],
  'amerique-du-nord': [-100, 45],
};
for (const z of monde.zones) {
  const c = centresOceans[z.id];
  if (c) z.centre = projMonde(c);
}

/* ------------------------------------------------------------------ */
/* Registre                                                            */
/* ------------------------------------------------------------------ */

export const CARTES: Record<string, Carte> = {
  'france-regions': franceRegions,
  'france-fleuves': franceFleuves,
  'france-massifs': franceMassifs,
  europe,
  monde,
};

/** Contour de la France (décor éventuel d'autres jeux). */
export const CONTOUR_FRANCE_SVG = cheminSurface([CONTOUR_FRANCE, CONTOUR_CORSE], projFrance);

export const getCarte = (id: string): Carte | undefined => CARTES[id];

/**
 * Zones qui correspondent à la cible d'un item (`target`) : id exact, groupe (« amerique »),
 * ou variante tolérée (accents, « atlantique » pour « ocean-atlantique »). null = cible inconnue.
 */
export function resoudreCible(carte: Carte, cible: string): string[] | null {
  return resoudreId(carte.id, cible);
}
