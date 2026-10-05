import { describe, expect, it } from 'vitest';
import { FIXTURES } from '@/games/_kit/fixtures';
import { zoneVoisine } from './CarteSvg';
import { CARTES, getCarte, resoudreCible } from './cartes';
import { type LonLat, dansPolygone } from './geo';
import type { Carte } from './types';

/** La zone contient-elle ce point (lon/lat) ? */
function contient(carte: Carte, id: string, pt: LonLat): boolean {
  const z = carte.zones.find((x) => x.id === id);
  if (!z?.geo) throw new Error(`zone ${id} absente`);
  return z.geo.some((a) => dansPolygone(pt, a));
}

/** Zones de surface qui contiennent le point. */
function zonesEn(carte: Carte, pt: LonLat): string[] {
  return carte.zones.filter((z) => z.forme === 'surface' && z.geo?.some((a) => dansPolygone(pt, a))).map((z) => z.id);
}

describe('cartes : structure', () => {
  for (const carte of Object.values(CARTES)) {
    it(`${carte.id} : ids uniques, tracés et centres valides`, () => {
      const ids = carte.zones.map((z) => z.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const z of carte.zones) {
        expect(z.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
        expect(z.nom.length).toBeGreaterThan(2);
        expect(z.d).toMatch(/^M[\d.]/);
        expect(z.d).not.toContain('NaN');
        const [x, y] = z.centre;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(carte.largeur);
        expect(y).toBeLessThanOrEqual(carte.hauteur);
      }
      for (const g of Object.values(carte.groupes ?? {})) {
        for (const id of g.zones) expect(ids).toContain(id);
      }
    });
  }

  it('les cartes attendues existent', () => {
    expect(Object.keys(CARTES).sort()).toEqual(
      ['europe', 'france-fleuves', 'france-massifs', 'france-regions', 'monde'].sort(),
    );
  });

  it('les cibles des exemples partagés existent', () => {
    for (const it of FIXTURES.map_point) {
      if (it.kind !== 'map_point') continue;
      const carte = getCarte(it.map);
      expect(carte, it.map).toBeDefined();
      expect(resoudreCible(carte!, it.target), it.target).not.toBeNull();
    }
  });
});

describe('france-regions', () => {
  const carte = CARTES['france-regions']!;

  it('18 régions : 13 en métropole et 5 en outre-mer', () => {
    expect(carte.zones.map((z) => z.id).sort()).toEqual(
      [
        'auvergne-rhone-alpes',
        'bourgogne-franche-comte',
        'bretagne',
        'centre-val-de-loire',
        'corse',
        'grand-est',
        'guadeloupe',
        'guyane',
        'hauts-de-france',
        'ile-de-france',
        'la-reunion',
        'martinique',
        'mayotte',
        'normandie',
        'nouvelle-aquitaine',
        'occitanie',
        'pays-de-la-loire',
        'provence-alpes-cote-d-azur',
      ].sort(),
    );
    expect(resoudreCible(carte, 'outre-mer')).toHaveLength(5);
  });

  // Chefs-lieux de région (et quelques villes) : chacun doit tomber dans SA région, et une seule.
  const villes: [string, LonLat, string][] = [
    ['Lille', [3.06, 50.63], 'hauts-de-france'],
    ['Amiens', [2.3, 49.9], 'hauts-de-france'],
    ['Rouen', [1.09, 49.44], 'normandie'],
    ['Caen', [-0.37, 49.18], 'normandie'],
    ['Paris', [2.35, 48.86], 'ile-de-france'],
    ['Strasbourg', [7.75, 48.58], 'grand-est'],
    ['Metz', [6.18, 49.12], 'grand-est'],
    ['Reims', [4.03, 49.26], 'grand-est'],
    ['Rennes', [-1.68, 48.11], 'bretagne'],
    ['Brest', [-4.49, 48.39], 'bretagne'],
    ['Nantes', [-1.55, 47.21], 'pays-de-la-loire'],
    ['Le Mans', [0.2, 48.0], 'pays-de-la-loire'],
    ['Orléans', [1.9, 47.9], 'centre-val-de-loire'],
    ['Tours', [0.69, 47.39], 'centre-val-de-loire'],
    ['Dijon', [5.04, 47.32], 'bourgogne-franche-comte'],
    ['Besançon', [6.02, 47.24], 'bourgogne-franche-comte'],
    ['Bordeaux', [-0.58, 44.84], 'nouvelle-aquitaine'],
    ['Poitiers', [0.34, 46.58], 'nouvelle-aquitaine'],
    ['Limoges', [1.26, 45.83], 'nouvelle-aquitaine'],
    ['Lyon', [4.83, 45.76], 'auvergne-rhone-alpes'],
    ['Clermont-Ferrand', [3.08, 45.78], 'auvergne-rhone-alpes'],
    ['Grenoble', [5.72, 45.19], 'auvergne-rhone-alpes'],
    ['Toulouse', [1.44, 43.6], 'occitanie'],
    ['Montpellier', [3.88, 43.61], 'occitanie'],
    ['Perpignan', [2.9, 42.7], 'occitanie'],
    ['Marseille', [5.37, 43.3], 'provence-alpes-cote-d-azur'],
    ['Avignon', [4.81, 43.95], 'provence-alpes-cote-d-azur'],
    ['Nice', [7.25, 43.72], 'provence-alpes-cote-d-azur'],
    ['Ajaccio', [8.74, 41.93], 'corse'],
    ['Bastia', [9.43, 42.69], 'corse'],
  ];
  for (const [ville, pt, region] of villes) {
    it(`${ville} est en ${region}`, () => {
      expect(zonesEn(carte, pt)).toEqual([region]);
    });
  }
});

describe('france-fleuves et france-massifs', () => {
  it('les 5 fleuves (+ le Maroni)', () => {
    const ids = CARTES['france-fleuves']!.zones.map((z) => z.id).sort();
    expect(ids).toEqual(['garonne', 'loire', 'maroni', 'rhin', 'rhone', 'seine']);
    expect(CARTES['france-fleuves']!.zones.every((z) => z.forme === 'ligne')).toBe(true);
  });
  it('les 6 massifs', () => {
    const carte = CARTES['france-massifs']!;
    expect(carte.zones.map((z) => z.id).sort()).toEqual(
      ['alpes', 'jura', 'massif-central', 'massif-corse', 'pyrenees', 'vosges'].sort(),
    );
    expect(contient(carte, 'massif-central', [2.9, 45.0])).toBe(true); // Cantal
    expect(contient(carte, 'alpes', [6.87, 45.83])).toBe(true); // Mont Blanc (versant français)
    expect(contient(carte, 'pyrenees', [0.0, 42.85])).toBe(true);
    expect(contient(carte, 'vosges', [7.0, 48.0])).toBe(true);
    expect(contient(carte, 'jura', [6.1, 46.75])).toBe(true);
  });
});

describe('europe', () => {
  const carte = CARTES.europe!;
  it('27 pays de l’Union européenne', () => {
    expect(resoudreCible(carte, 'union-europeenne')).toHaveLength(27);
  });
  const capitales: [string, LonLat, string][] = [
    ['Paris', [2.35, 48.86], 'france'],
    ['Berlin', [13.4, 52.52], 'allemagne'],
    ['Madrid', [-3.7, 40.42], 'espagne'],
    ['Lisbonne', [-9.0, 38.85], 'portugal'],
    ['Rome', [12.5, 41.9], 'italie'],
    ['Bruxelles', [4.35, 50.85], 'belgique'],
    ['Amsterdam', [4.9, 52.37], 'pays-bas'],
    ['Luxembourg', [6.13, 49.61], 'luxembourg'],
    ['Vienne', [16.37, 48.21], 'autriche'],
    ['Berne', [7.45, 46.95], 'suisse'],
    ['Prague', [14.42, 50.08], 'republique-tcheque'],
    ['Varsovie', [21.01, 52.23], 'pologne'],
    ['Budapest', [19.04, 47.5], 'hongrie'],
    ['Ljubljana', [14.5, 46.05], 'slovenie'],
    ['Zagreb', [15.98, 45.81], 'croatie'],
    ['Bucarest', [26.1, 44.43], 'roumanie'],
    ['Sofia', [23.32, 42.7], 'bulgarie'],
    ['Athènes', [23.73, 37.98], 'grece'],
    ['Copenhague', [12.4, 55.68], 'danemark'],
    ['Stockholm', [18.0, 59.3], 'suede'],
    ['Oslo', [10.75, 59.95], 'norvege'],
    ['Helsinki', [24.94, 60.25], 'finlande'],
    ['Tallinn', [24.75, 59.4], 'estonie'],
    ['Riga', [24.1, 56.95], 'lettonie'],
    ['Vilnius', [25.28, 54.69], 'lituanie'],
    ['Dublin', [-6.26, 53.35], 'irlande'],
    ['Londres', [-0.13, 51.5], 'royaume-uni'],
    ['Nicosie', [33.37, 35.17], 'chypre'],
    ['La Valette', [14.45, 35.88], 'malte'],
  ];
  for (const [ville, pt, pays] of capitales) {
    it(`${ville} est dans le pays ${pays}`, () => {
      expect(zonesEn(carte, pt)).toEqual([pays]);
    });
  }
  it('Bratislava est en Slovaquie (près de la frontière autrichienne)', () => {
    expect(zonesEn(carte, [17.3, 48.25])).toEqual(['slovaquie']);
  });
});

describe('monde', () => {
  const carte = CARTES.monde!;
  const terres = (pt: LonLat) =>
    zonesEn(carte, pt).filter((id) => !carte.dessous?.includes(id));
  const mers = (pt: LonLat) => zonesEn(carte, pt).filter((id) => carte.dessous?.includes(id));

  it('6 continents (l’Amérique en deux parties) et 5 océans', () => {
    expect(resoudreCible(carte, 'amerique')).toEqual(['amerique-du-nord', 'amerique-du-sud']);
    for (const id of ['afrique', 'asie', 'europe', 'oceanie', 'antarctique']) {
      expect(resoudreCible(carte, id)).toEqual([id]);
    }
    expect(carte.dessous).toHaveLength(5);
    expect(resoudreCible(carte, 'atlantique')).toEqual(['ocean-atlantique']);
    expect(resoudreCible(carte, 'Océan Indien')).toEqual(['ocean-indien']);
    expect(resoudreCible(carte, 'inconnu')).toBeNull();
  });

  const lieux: [string, LonLat, string][] = [
    ['Paris', [2.35, 48.86], 'europe'],
    ['Moscou', [37.6, 55.75], 'europe'],
    ['Pékin', [116.4, 39.9], 'asie'],
    ['New Delhi', [77.2, 28.6], 'asie'],
    ['Le Caire', [31.2, 30.0], 'afrique'],
    ['Nairobi', [36.8, -1.3], 'afrique'],
    ['New York', [-74.5, 40.9], 'amerique-du-nord'],
    ['Mexico', [-99.1, 19.4], 'amerique-du-nord'],
    ['Brasilia', [-47.9, -15.8], 'amerique-du-sud'],
    ['Buenos Aires', [-58.6, -34.6], 'amerique-du-sud'],
    ['Canberra', [149.1, -35.3], 'oceanie'],
    ['pôle Sud', [0, -85], 'antarctique'],
  ];
  for (const [lieu, pt, continent] of lieux) {
    it(`${lieu} : ${continent}`, () => {
      expect(terres(pt)).toEqual([continent]);
    });
  }

  const eaux: [LonLat, string][] = [
    [[-35, 30], 'ocean-atlantique'],
    [[-25, -30], 'ocean-atlantique'],
    [[-150, 0], 'ocean-pacifique'],
    [[170, 10], 'ocean-pacifique'],
    [[80, -15], 'ocean-indien'],
    [[0, 80], 'ocean-arctique'],
    [[0, -63], 'ocean-austral'],
  ];
  for (const [pt, ocean] of eaux) {
    it(`${pt.join(', ')} : ${ocean}`, () => {
      expect(terres(pt)).toEqual([]);
      expect(mers(pt)).toEqual([ocean]);
    });
  }
});

describe('navigation au clavier', () => {
  it('la flèche droite depuis la Bretagne mène vers l’est', () => {
    const carte = CARTES['france-regions']!;
    const v = zoneVoisine(carte.zones, 'bretagne', 'droite');
    expect(v).not.toBeNull();
    const a = carte.zones.find((z) => z.id === 'bretagne')!.centre;
    const b = carte.zones.find((z) => z.id === v)!.centre;
    expect(b[0]).toBeGreaterThan(a[0]);
  });
  it('chaque zone a au moins une voisine', () => {
    for (const carte of Object.values(CARTES)) {
      for (const z of carte.zones) {
        const v = (['gauche', 'droite', 'haut', 'bas'] as const).map((d) => zoneVoisine(carte.zones, z.id, d));
        expect(v.some(Boolean), `${carte.id}/${z.id}`).toBe(true);
      }
    }
  });
});
