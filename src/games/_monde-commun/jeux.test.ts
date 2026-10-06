/** Logique pure des jeux n° 50 à 56 : filtres d'items, appels de Jacques a dit, circuit du Laboratoire. */
import { describe, expect, it } from 'vitest';
import type { ClassificationItem, Item } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { estLieuConnu } from '../_cartes/ids';
import { FIXTURES } from '../_kit/fixtures';
import conseilJeu from '../conseil-classe';
import jacquesJeu from '../jacques-a-dit';
import laboJeu from '../laboratoire';
import machineJeu from '../machine-temps';
import quiJeu from '../qui-suis-je';
import tourJeu from '../tour-de-france';
import vraiFauxJeu from '../vrai-faux';
import { appelsDe, consigneDe, estAnglais, phraseSimon } from '../jacques-a-dit/appels';
import { categorieAllumee, estExperience } from '../laboratoire/filtre';
import { estDevinette } from '../qui-suis-je/filtre';
import { MONDE_FIXTURES } from './fixtures';

const tous = (k: keyof typeof MONDE_FIXTURES): Item[] => [
  ...(MONDE_FIXTURES[k] ?? []),
  ...(FIXTURES[k] ?? []),
];
const parId = (id: string) =>
  Object.values(MONDE_FIXTURES)
    .flat()
    .find((i) => i.id === id)!;

describe('modules de jeu', () => {
  it('numéros et ids du catalogue', () => {
    expect(
      [machineJeu, tourJeu, quiJeu, laboJeu, conseilJeu, jacquesJeu, vraiFauxJeu].map((j) => [
        j.id,
        j.numero,
      ]),
    ).toEqual([
      ['machine-temps', 50],
      ['tour-de-france', 51],
      ['qui-suis-je', 52],
      ['laboratoire', 53],
      ['conseil-classe', 54],
      ['jacques-a-dit', 55],
      ['vrai-faux', 56],
    ]);
  });
  it('chaque jeu trouve des exemples jouables dans les exemples partagés (Labo)', () => {
    for (const j of [machineJeu, tourJeu, quiJeu, laboJeu, conseilJeu, jacquesJeu, vraiFauxJeu]) {
      const k = j.accepts[0]!;
      const ok = FIXTURES[k].filter((i) => !j.filterItem || j.filterItem(i));
      expect(ok.length, j.id).toBeGreaterThan(0);
    }
  });
});

describe('filtres', () => {
  it('Machine à remonter le temps : frises et étapes seulement', () => {
    const f = machineJeu.filterItem!;
    expect(
      tous('ordering')
        .filter(f)
        .map((i) => i.kind === 'ordering' && i.mode),
    ).not.toContain('croissant');
    expect(
      tous('ordering')
        .filter(f)
        .map((i) => i.kind === 'ordering' && i.mode),
    ).not.toContain('phrase');
  });
  it('Tour de France : seulement les lieux présents sur nos cartes', () => {
    expect(tous('map_point').every(estLieuConnu)).toBe(true);
    const inconnu = { ...parId('mo-carte-bretagne'), target: 'atlantide' } as Item;
    expect(estLieuConnu(inconnu)).toBe(false);
    expect(estLieuConnu({ ...parId('mo-carte-bretagne'), map: 'lune' } as Item)).toBe(false);
  });
  it('Qui suis-je : pas les QCM de comparaison, de ponctuation ni d’anglais', () => {
    const qcm = tous('mcq');
    const comparer = qcm.find((i) => i.kind === 'mcq' && i.meta?.gauche !== undefined)!;
    expect(estDevinette(comparer)).toBe(false);
    expect(estDevinette(parId('mo-en-dog'))).toBe(false);
    expect(estDevinette(parId('mo-qui-ferry'))).toBe(true);
  });
  it('Laboratoire : classements et étapes, pas les frises ni les probabilités', () => {
    expect(estExperience(parId('mo-vivant'))).toBe(true);
    expect(estExperience(parId('mo-cycle-grenouille'))).toBe(true);
    expect(estExperience(parId('mo-frise-republique'))).toBe(false);
    const proba = {
      ...(parId('mo-vivant') as ClassificationItem),
      categories: ['impossible', 'peu probable', 'probable', 'certain'],
      elements: [
        { label: 'x', category: 0 },
        { label: 'y', category: 3 },
      ],
    };
    expect(estExperience(proba)).toBe(false);
  });
  it('Conseil de la classe : situations (QCM) et vrai/faux', () => {
    const f = conseilJeu.filterItem!;
    expect(f(parId('mo-emc-seul'))).toBe(true);
    expect(f(parId('mo-vf-marianne'))).toBe(true);
    expect(f(parId('mo-en-red'))).toBe(false);
  });
  it('Jacques a dit : anglais seulement', () => {
    expect(estAnglais(parId('mo-en-animaux'))).toBe(true);
    expect(estAnglais(parId('mo-en-red'))).toBe(true);
    expect(estAnglais(parId('mo-oral-cat'))).toBe(true);
    expect(estAnglais(FIXTURES.pairing.find((p) => p.id === 'p1')!)).toBe(false); // contraires
    expect(estAnglais(FIXTURES.oral_answer.find((p) => p.id === 'or1')!)).toBe(false); // calcul oral
  });
  it('Vrai ou Faux : toutes les leçons', () => {
    expect(vraiFauxJeu.lessons).toBeUndefined();
    expect(vraiFauxJeu.accepts).toEqual(['true_false']);
  });
});

describe('Jacques a dit : les appels', () => {
  const animaux = parId('mo-en-animaux');
  it('la bonne image est toujours proposée, sans doublon', () => {
    const rng = createRng(7);
    for (const level of ['facile', 'normal', 'plus_loin'] as const) {
      for (let k = 0; k < 30; k++) {
        for (const a of appelsDe(animaux, level, rng)) {
          if (a.type !== 'image') continue;
          expect(a.options).toContain(a.cible);
          expect(new Set(a.options).size).toBe(a.options.length);
          if (level === 'facile') expect(a.options).toHaveLength(3);
        }
      }
    }
  });
  it('pas de piège en Facile, jamais au premier appel, au plus 2 par série', () => {
    const rng = createRng(11);
    for (let k = 0; k < 50; k++) {
      expect(appelsDe(animaux, 'facile', rng).every((a) => a.type === 'image' && a.simon)).toBe(true);
      const serie = appelsDe(animaux, 'plus_loin', rng);
      expect(serie[0]!.type === 'image' && serie[0]!.simon).toBe(true);
      expect(serie.filter((a) => a.type === 'image' && !a.simon).length).toBeLessThanOrEqual(2);
    }
  });
  it('phrase de Simon', () => {
    const [a] = appelsDe(parId('mo-en-corps'), 'facile', createRng(1));
    if (a?.type !== 'image') throw new Error();
    expect(phraseSimon(a)).toBe(`Simon says: ${a.mot}!`);
    expect(phraseSimon({ ...a, simon: false })).toMatch(/^Touch your \w+!$/);
  });
  it('une consigne anglaise correcte pour un nom seul', () => {
    expect(consigneDe('dog')).toBe('touch the dog');
    expect(consigneDe('red', 'point to {mot}')).toBe('point to red');
    expect(consigneDe('touch your nose', 'point to {mot}')).toBe('touch your nose');
    const [a] = appelsDe(parId('mo-en-couleurs'), 'facile', createRng(3));
    if (a?.type !== 'image') throw new Error();
    expect(phraseSimon(a)).toBe(`Simon says: point to ${a.mot}!`);
    const [b] = appelsDe(parId('mo-en-animaux'), 'facile', createRng(3));
    if (b?.type !== 'image') throw new Error();
    expect(phraseSimon(b)).toBe(`Simon says: touch the ${b.mot}!`);
  });
  it('QCM et oral : un seul appel', () => {
    const rng = createRng(2);
    const q = appelsDe(parId('mo-en-red'), 'facile', rng);
    expect(q).toHaveLength(1);
    if (q[0]!.type !== 'qcm') throw new Error();
    expect(q[0]!.choices).toHaveLength(3);
    expect(q[0]!.choices[q[0]!.answerIndex]).toBe('🔴');
    expect(appelsDe(parId('mo-oral-hello'), 'normal', rng)[0]!.type).toBe('oral');
  });
});

describe('Laboratoire : circuit électrique', () => {
  it('repère la catégorie « l’ampoule s’allume »', () => {
    expect(categorieAllumee(parId('mo-conducteurs') as ClassificationItem)).toBe(0);
    expect(categorieAllumee(parId('mo-vivant') as ClassificationItem)).toBe(-1);
    const inverse = {
      ...(parId('mo-conducteurs') as ClassificationItem),
      categories: ['isolant', 'conducteur'],
    };
    expect(categorieAllumee(inverse)).toBe(1);
  });
});
