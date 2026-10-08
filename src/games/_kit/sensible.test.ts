/** Jeux de rapidité : aucun thème sensible (guerres, Shoah, esclavage…) n'y arrive. */
import { describe, expect, it } from 'vitest';
import { DERIVATIONS } from '@/content/adapters';
import type { Item, McqItem } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { getGame } from '@/games/registry';
import { estSensible } from './sensible';

const qcm = (id: string, guillotine: boolean, x: Partial<McqItem> = {}): McqItem => ({
  kind: 'mcq',
  id,
  lessonId: 'CM2.HI20.T3.GUERRES',
  question: `Question ${id} ?`,
  choices: [`bonne ${id}`, `autre ${id}`],
  answerIndex: 0,
  explication: 'Explication.',
  guillotine,
  ...x,
});

const sensibles: Item[] = [
  qcm('a', false),
  qcm('b', true, { meta: { sensible: true } }),
  {
    kind: 'true_false',
    id: 'vf',
    lessonId: 'CM2.HI20.T3.GUERRES',
    statement: 'Affirmation.',
    answer: true,
    explication: 'Explication.',
    meta: { sensible: true },
  },
  {
    kind: 'pairing',
    id: 'p',
    lessonId: 'CM2.HI20.T3.GUERRES',
    prompt: 'Associe.',
    pairs: [
      { left: 'a', right: '1' },
      { left: 'b', right: '2' },
      { left: 'c', right: '3' },
    ],
    explication: 'Explication.',
    meta: { sensible: true },
  },
];

describe('thèmes sensibles et jeux de rapidité', () => {
  it('estSensible : meta.sensible ou QCM guillotine: false', () => {
    for (const it of sensibles) expect(estSensible(it), it.id).toBe(true);
    expect(estSensible(qcm('c', true))).toBe(false);
  });

  it.each(['attrape-bulles', 'dobble-mots', 'crocodiles', 'vrai-faux', 'guillotine'])(
    '%s refuse les items sensibles',
    (id) => {
      const g = getGame(id)!;
      expect(g.filterItem).toBeDefined();
      for (const it of sensibles) expect(g.filterItem!(it), it.id).toBe(false);
    },
  );

  it('l’Attrape-bulles garde les QCM ordinaires', () => {
    expect(getGame('attrape-bulles')!.filterItem!(qcm('d', true))).toBe(true);
  });

  it('les paires dérivées de QCM sensibles sont marquées sensibles (exclues du Dobble)', () => {
    const many = DERIVATIONS.pairing!.find((r) => r.from === 'mcq')!.many!;
    const p = many([qcm('e', true), qcm('f', false), qcm('g', true)], 'CM2.HI20.T3.GUERRES')!;
    expect(p.meta?.sensible).toBe(true);
    expect(getGame('dobble-mots')!.filterItem!(p)).toBe(false);
    const ok = many([qcm('h', true), qcm('i', true), qcm('j', true)], 'CM2.HI20.T3.GUERRES')!;
    expect(ok.meta?.sensible).toBeUndefined();
    expect(getGame('dobble-mots')!.filterItem!(ok)).toBe(true);
  });

  it('le vrai/faux dérivé d’un QCM sensible est marqué sensible', () => {
    const one = DERIVATIONS.true_false!.find((r) => r.from === 'mcq')!.one!;
    expect(one(qcm('k', false), createRng(1))!.meta?.sensible).toBe(true);
  });
});
