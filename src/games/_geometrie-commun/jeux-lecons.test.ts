/** Chaque jeu 21 à 28 est proposé pour les leçons visées, avec le type d'items prévu. */
import { describe, expect, it } from 'vitest';
import { gamesForLesson } from '@/games/registry';
import { lecon } from './tirages';

const ATTENDUS: Record<string, [string, string][]> = {
  geometre: [
    ['CE1.MA.GEO.FIGURES', 'geometry_shape'],
    ['CE1.MA.GEO.TRACER', 'geometry_shape'],
    ['CM2.MA.GEO.VOCAB', 'geometry_shape'],
    ['CM2.MA.GEO.FIGURES', 'geometry_shape'],
    ['CM2.MA.GEO.CONSTRUIRE', 'geometry_shape'],
  ],
  'miroir-magique': [
    ['CE1.MA.GEO.SYMETRIE', 'geometry_shape'],
    ['CM2.MA.GEO.SYMETRIE', 'geometry_shape'],
  ],
  tangram: [
    ['CE1.MA.GEO.FIGURES', 'geometry_shape'],
    ['CM2.MA.GEO.FIGURES', 'geometry_shape'],
  ],
  'usine-patrons': [
    ['CE1.MA.GEO.SOLIDES', 'geometry_shape'],
    ['CM2.MA.GEO.SOLIDES', 'geometry_shape'],
  ],
  'robot-codeur': [
    ['CE1.MA.GEO.REPERAGE', 'geometry_shape'],
    ['CM2.MA.GEO.DEPLACEMENTS', 'geometry_shape'],
  ],
  'station-meteo': [
    ['CE1.MA.DON.LIRE', 'numeric_answer'],
    ['CM2.MA.DON.LIRE', 'numeric_answer'],
  ],
  'roue-probabilites': [['CM2.MA.PROBA', 'classification']],
  mesureur: [
    ['CE1.MA.GM.LONGUEURS', 'numeric_answer'],
    ['CE1.MA.GM.MASSES', 'numeric_answer'],
    ['CM2.MA.GM.LONG_MASSE_CONT', 'numeric_answer'],
    ['CM2.MA.GM.PERIMETRE', 'numeric_answer'],
    ['CM2.MA.GM.AIRES', 'numeric_answer'],
    ['CM2.MA.GM.ANGLES', 'classification'],
  ],
};

describe('Leçons des jeux 21 à 28', () => {
  for (const [id, lecons] of Object.entries(ATTENDUS))
    for (const [l, kind] of lecons)
      it(`${id} est proposé pour ${l} (${kind})`, () => {
        const jeux = gamesForLesson(lecon(l), { parentLists: [] });
        const j = jeux.find((g) => g.game.id === id);
        expect(j, jeux.map((g) => g.game.id).join(', ')).toBeTruthy();
        expect(j!.kind).toBe(kind);
      });

  it('les jeux ne sont pas proposés hors de leur domaine', () => {
    const ids = gamesForLesson(lecon('CE1.MA.GM.MONNAIE'), { parentLists: [] }).map((g) => g.game.id);
    for (const id of Object.keys(ATTENDUS)) expect(ids).not.toContain(id);
  });
});
