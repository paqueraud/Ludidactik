import { describe, expect, it } from 'vitest';
import type { Lesson } from '@/content/schemas';
import type { AttemptRow, LeitnerRow, ProgressRow } from '@/services/storage/db';
import {
  competencesFragiles,
  derniersRates,
  etoilesParNiveau,
  leconsTravaillees,
  libelleItem,
  maitriseParMatiere,
} from './stats';

const JOUR = 86_400_000;
const NOW = new Date(2026, 9, 8).getTime();

const prog = (
  lessonId: string,
  level: ProgressRow['level'],
  stars: number,
  acc: number,
  last = NOW,
): ProgressRow => ({
  key: `p|${lessonId}|g|${level}`,
  profileId: 'p',
  lessonId,
  gameId: 'g',
  level,
  stars,
  bestAccuracy: acc,
  plays: 2,
  lastPlayed: last,
});

const att = (lessonId: string, correct: number, total: number, date = NOW): AttemptRow => ({
  profileId: 'p',
  lessonId,
  gameId: 'g',
  level: 'normal',
  date,
  correct,
  total,
  durationMs: 60_000,
});

describe('statistiques parents', () => {
  it('leçons travaillées : meilleures étoiles par niveau, tri par date', () => {
    const l = leconsTravaillees([
      prog('A', 'normal', 2, 0.8, NOW - JOUR),
      prog('A', 'facile', 3, 1, NOW - 2 * JOUR),
      prog('B', 'normal', 1, 0.6, NOW),
    ]);
    expect(l.map((x) => x.lessonId)).toEqual(['B', 'A']);
    expect(l[1]!.stars).toEqual({ facile: 3, normal: 2, plus_loin: 0 });
    expect(l[1]!.plays).toBe(4);
  });

  it('étoiles par niveau', () => {
    const e = etoilesParNiveau([
      prog('A', 'normal', 2, 0.8),
      prog('B', 'normal', 3, 1),
      prog('B', 'facile', 1, 0.6),
    ]);
    expect(e.normal).toEqual({ etoiles: 5, max: 6 });
    expect(e.facile).toEqual({ etoiles: 1, max: 6 });
    expect(e.plus_loin).toEqual({ etoiles: 0, max: 6 });
  });

  it('maîtrise par matière (sur toutes les leçons de la matière)', () => {
    const lecons = [
      { id: 'A', matiere: 'maths' },
      { id: 'B', matiere: 'maths' },
      { id: 'C', matiere: 'francais' },
    ] as Lesson[];
    const m = maitriseParMatiere([prog('A', 'normal', 3, 1)], lecons);
    const maths = m.find((x) => x.matiere === 'maths')!;
    expect(maths.travaillees).toBe(1);
    expect(maths.total).toBe(2);
    // Normal parfait = 2 / 3,5 de maîtrise sur A, 0 sur B → moyenne
    expect(maths.maitrise).toBeCloseTo(2 / 3.5 / 2);
    expect(m.find((x) => x.matiere === 'francais')!.maitrise).toBe(0);
  });

  it('compétences fragiles : taux < 70 %, assez de réponses, 30 derniers jours', () => {
    const f = competencesFragiles(
      [
        att('A', 3, 10), // 30 % → fragile
        att('A', 2, 4), // cumul A : 5/14
        att('B', 9, 10), // 90 % → solide
        att('C', 1, 3), // trop peu de réponses
        att('D', 0, 10, NOW - 40 * JOUR), // trop ancien
        att('E', 6, 10), // 60 % → fragile
        att('F', 0, 0), // partie vide
      ],
      { now: NOW },
    );
    expect(f.map((x) => x.lessonId)).toEqual(['A', 'E']);
    expect(f[0]).toMatchObject({ correct: 5, total: 14, parties: 2 });
  });

  it('libellés et derniers éléments ratés (boîte 1, du plus récent au plus ancien)', () => {
    expect(libelleItem('mot:chocolat')).toEqual({ type: 'mot', texte: 'chocolat' });
    expect(libelleItem('calc:7 × 8|sept fois huit')).toEqual({ type: 'calcul', texte: '7 × 8' });
    expect(libelleItem('mcq:q12')).toBeNull();
    const leitner: LeitnerRow[] = [
      { key: '1', profileId: 'p', itemKey: 'mot:ancien', box: 1, due: NOW - 3 * JOUR },
      { key: '2', profileId: 'p', itemKey: 'mot:récent', box: 1, due: NOW },
      { key: '3', profileId: 'p', itemKey: 'mot:appris', box: 3, due: NOW + JOUR },
      { key: '4', profileId: 'p', itemKey: 'calc:9 × 6|x', box: 1, due: NOW },
      { key: '5', profileId: 'p', itemKey: 'mcq:q1', box: 1, due: NOW },
    ];
    expect(derniersRates(leitner, 'mot')).toEqual(['récent', 'ancien']);
    expect(derniersRates(leitner, 'calcul')).toEqual(['9 × 6']);
  });
});
