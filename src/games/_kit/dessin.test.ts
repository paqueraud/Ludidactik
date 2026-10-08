/** Jeux génériques : jamais d'item qui a besoin d'un dessin qu'ils n'affichent pas. */
import { describe, expect, it } from 'vitest';
import { DERIVATIONS, numericDistractors } from '@/content/adapters';
import type { Item, McqItem, NumericItem, PairingItem } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { getGame } from '@/games/registry';
import { besoinDessin } from './dessin';

const num = (lessonId: string, answer: number, meta?: Record<string, unknown>): NumericItem => ({
  kind: 'numeric_answer',
  id: `n-${answer}`,
  lessonId,
  prompt: 'Mesure le crayon avec la règle.',
  spoken: 'Mesure le crayon',
  answer,
  decimals: 0,
  difficulty: 0.5,
  explication: 'Explication.',
  meta,
});
const qcm = (id: string, question: string, x: Partial<McqItem> = {}): McqItem => ({
  kind: 'mcq',
  id,
  lessonId: 'CE1.QLM.VIVANT.CARACT',
  question,
  choices: [`bonne ${id}`, `autre ${id}`],
  answerIndex: 0,
  explication: `Explication ${id}.`,
  guillotine: true,
  ...x,
});

const avecDessin: Item[] = [
  num('CE1.MA.GM.LONGUEURS', 12, { mesure: { objet: '✏️', longueur: 12, unite: 'cm' } }),
  num('CE1.MA.DON.LIRE', 5, { graphique: { type: 'barres' } }),
  num('CE1.MA.NUM.DECOMPOSER', 635, { construire: true }),
  qcm('g', 'Qu’a-t-on le moins compté ?', { meta: { graphique: { type: 'barres' } } }),
];

describe('items qui ont besoin d’un dessin', () => {
  it('besoinDessin les reconnaît', () => {
    for (const it of avecDessin) expect(besoinDessin(it), it.id).toBe(true);
    expect(
      besoinDessin(num('CE1.MA.CM.X10', 350, { glisse: { nombre: 35, operation: '×', facteur: 10 } })),
    ).toBe(false);
  });

  it.each([
    'grand-prix',
    'tables-ninja',
    'compte-est-bon',
    'fusee-complements',
    'attrape-bulles',
    'robot-calculateur',
    'crocodiles',
  ])('%s les écarte', (id) => {
    const g = getGame(id)!;
    for (const it of avecDessin) expect(g.filterItem!(it), `${id} ${it.id}`).toBe(false);
  });

  it('aucun QCM, vrai/faux, oral ni paire n’est dérivé d’un calcul qui a besoin d’un dessin', () => {
    const rng = createRng(1);
    const it = avecDessin[0] as NumericItem;
    for (const k of ['mcq', 'true_false', 'oral_answer'] as const)
      for (const r of DERIVATIONS[k]!.filter((r) => r.from === 'numeric_answer'))
        expect(r.one!(it, rng), k).toBeNull();
    const many = DERIVATIONS.pairing!.find((r) => r.from === 'numeric_answer')!.many!;
    expect(many([avecDessin[0]!, avecDessin[1]!, avecDessin[2]!], 'L')).toBeNull();
  });
});

describe('distracteurs numériques dans les bornes de la classe', () => {
  it('CE1 : jamais au-delà de 1 000, pas de « × 10 » hors numération', () => {
    const rng = createRng(4);
    for (const a of [100, 480, 600, 990, 1000]) {
      for (let i = 0; i < 30; i++) {
        const d = numericDistractors({ ...num('CE1.MA.CM.COMPLEMENTS', a), meta: undefined }, rng, 3);
        expect(Math.max(...d), `${a}`).toBeLessThanOrEqual(1000);
        expect(d).not.toContain(a * 10);
      }
    }
  });
  it('« × 10 » gardé pour les leçons de multiplication par 10', () => {
    const rng = createRng(5);
    const vus = new Set<number>();
    for (let i = 0; i < 50; i++)
      for (const d of numericDistractors({ ...num('CM2.MA.CM.X10_DEC', 48), meta: undefined }, rng, 3))
        vus.add(d);
    expect(vus.has(480)).toBe(true);
  });
});

describe('dérivations de QCM compréhensibles seules', () => {
  const vf = DERIVATIONS.true_false!.find((r) => r.from === 'mcq')!.one!;
  const paires = DERIVATIONS.pairing!.find((r) => r.from === 'mcq')!.many!;
  it('pas de vrai/faux quand la question renvoie aux choix ou aux indices', () => {
    const rng = createRng(2);
    expect(vf(qcm('a', 'Lequel est un mammifère ?'), rng)).toBeNull();
    expect(vf(qcm('b', 'Quel est l’intrus ?'), rng)).toBeNull();
    expect(vf(qcm('c', 'Quel animal n’est pas un oiseau ?'), rng)).toBeNull();
    expect(vf(qcm('d', 'Qui suis-je ?', { hints: ['J’ai des plumes.', 'Je vole.'] }), rng)).toBeNull();
    expect(vf(qcm('e', 'Combien de pattes a une araignée ?'), rng)).not.toBeNull();
  });
  it('paires : sans devinettes, avec les explications des questions', () => {
    const p = paires(
      [
        qcm('f', 'Qui suis-je ?', { hints: ['a', 'b'] }),
        qcm('g', 'Combien de pattes a une araignée ?'),
        qcm('h', 'Où vit le poisson ?'),
        qcm('i', 'Que mange la vache ?'),
      ],
      'L',
    ) as PairingItem;
    expect(p.pairs.map((x) => x.left)).not.toContain('Qui suis-je ?');
    expect(p.explication).toContain('Explication g.');
  });
});
