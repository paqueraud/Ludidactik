/**
 * Liste légère des identifiants de chaque carte (sans les tracés) : sert au filtre des items
 * (`filterItem`), chargé avec le registre des jeux, sans embarquer les données géographiques.
 * Tenue à jour avec cartes.ts (un test vérifie la concordance) et documentée dans IDS.md.
 */
export const IDS_CARTES: Record<string, { zones: string[]; groupes?: Record<string, string[]> }> = {
  'france-regions': {
    zones: [
      'hauts-de-france',
      'normandie',
      'ile-de-france',
      'grand-est',
      'bretagne',
      'pays-de-la-loire',
      'centre-val-de-loire',
      'bourgogne-franche-comte',
      'nouvelle-aquitaine',
      'auvergne-rhone-alpes',
      'occitanie',
      'provence-alpes-cote-d-azur',
      'corse',
      'guadeloupe',
      'martinique',
      'guyane',
      'la-reunion',
      'mayotte',
    ],
    groupes: { 'outre-mer': ['guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte'] },
  },
  'france-fleuves': { zones: ['seine', 'loire', 'garonne', 'rhone', 'rhin', 'maroni'] },
  'france-massifs': { zones: ['alpes', 'pyrenees', 'massif-central', 'jura', 'vosges', 'massif-corse'] },
  europe: {
    zones: [
      'allemagne',
      'autriche',
      'belgique',
      'bulgarie',
      'chypre',
      'croatie',
      'danemark',
      'espagne',
      'estonie',
      'finlande',
      'france',
      'grece',
      'hongrie',
      'irlande',
      'italie',
      'lettonie',
      'lituanie',
      'luxembourg',
      'malte',
      'pays-bas',
      'pologne',
      'portugal',
      'republique-tcheque',
      'roumanie',
      'slovaquie',
      'slovenie',
      'suede',
      'royaume-uni',
      'norvege',
      'suisse',
    ],
    groupes: {
      'union-europeenne': [
        'allemagne',
        'autriche',
        'belgique',
        'bulgarie',
        'chypre',
        'croatie',
        'danemark',
        'espagne',
        'estonie',
        'finlande',
        'france',
        'grece',
        'hongrie',
        'irlande',
        'italie',
        'lettonie',
        'lituanie',
        'luxembourg',
        'malte',
        'pays-bas',
        'pologne',
        'portugal',
        'republique-tcheque',
        'roumanie',
        'slovaquie',
        'slovenie',
        'suede',
      ],
    },
  },
  monde: {
    zones: [
      'ocean-arctique',
      'ocean-austral',
      'ocean-atlantique',
      'ocean-indien',
      'ocean-pacifique',
      'amerique-du-nord',
      'amerique-du-sud',
      'europe',
      'afrique',
      'asie',
      'oceanie',
      'antarctique',
    ],
    groupes: { amerique: ['amerique-du-nord', 'amerique-du-sud'] },
  },
};

const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'\s_]+/g, '-')
    .replace(/^(l|le|la|les)-/, '');

/**
 * Zones qui correspondent à la cible d'un item (`target`) : id exact, groupe (« amerique »),
 * ou variante tolérée (accents, article, « atlantique » pour « ocean-atlantique »). null = inconnue.
 */
export function resoudreId(map: string, cible: string): string[] | null {
  const c = IDS_CARTES[map];
  if (!c) return null;
  const ids = new Set(c.zones);
  const n = normaliser(cible);
  for (const e of [cible, n, `ocean-${n.replace(/^ocean-/, '')}`]) {
    if (ids.has(e)) return [e];
    const g = c.groupes?.[e];
    if (g) return g;
  }
  return null;
}

/** Item `map_point` jouable sur nos cartes. */
export const estLieuConnu = (it: { kind: string; map?: unknown; target?: unknown }) =>
  it.kind === 'map_point' &&
  typeof it.map === 'string' &&
  typeof it.target === 'string' &&
  resoudreId(it.map, it.target) !== null;
