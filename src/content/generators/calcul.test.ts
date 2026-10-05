import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/content/schemas';
import { parseNumber } from '@/engine/answer';
import { createRng } from '@/engine/rng';
import { CALC_GENERATORS } from './calcul';

/** Évalue « a op b » ou « a op b op c » écrit à la française. */
function evaluate(prompt: string): number | null {
  const m = prompt.match(/^([\d\s ,]+)\s([+−×÷])\s([\d\s ,]+?)(?:\s([+−])\s([\d\s ,]+))?$/);
  if (!m) return null;
  const n = (s: string) => parseNumber(s)!;
  const op = (a: number, o: string, b: number) =>
    o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b;
  let r = op(n(m[1]!), m[2]!, n(m[3]!));
  if (m[4]) r = op(r, m[4], n(m[5]!));
  return Math.round(r * 1000) / 1000;
}

const numbersIn = (s: string) => (s.match(/\d[\d ]*(,\d+)?/g) ?? []).map((x) => parseNumber(x)!);

describe('générateurs de calcul mental', () => {
  for (const [name, gen] of Object.entries(CALC_GENERATORS)) {
    const ce1 = name.startsWith('ce1');
    for (const level of LEVELS) {
      it(`${name} — ${level}`, () => {
        const rng = createRng(42);
        for (let i = 0; i < 400; i++) {
          const it = gen(level, rng);
          expect(Number.isFinite(it.answer)).toBe(true);
          expect(it.answer).toBeGreaterThanOrEqual(0);
          expect(it.decimals).toBeLessThanOrEqual(3);
          expect(it.explication.length).toBeGreaterThan(5);
          const v = evaluate(it.prompt);
          if (v !== null) expect(v, it.prompt).toBe(it.answer);
          if (ce1) {
            // Bornes BO CE1 : nombres entiers jusqu'à 1 000
            expect(Number.isInteger(it.answer), it.prompt).toBe(true);
            expect(it.answer, it.prompt).toBeLessThanOrEqual(1000);
            for (const x of numbersIn(it.prompt)) expect(x, it.prompt).toBeLessThanOrEqual(1000);
          } else {
            expect(it.answer).toBeLessThanOrEqual(999_999_999);
          }
        }
      });
    }
  }

  it('est reproductible avec la même graine', () => {
    const a = CALC_GENERATORS['cm2.ma.cm.plus99']!('normal', createRng(7));
    const b = CALC_GENERATORS['cm2.ma.cm.plus99']!('normal', createRng(7));
    expect(a).toEqual(b);
  });

  it('CE1 tables : le niveau facile reste dans les tables de 2, 5, 10', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const it = CALC_GENERATORS['ce1.ma.cm.tables_mult']!('facile', rng);
      const [a, b] = numbersIn(it.prompt);
      expect([a, b].some((x) => [2, 5, 10].includes(x!))).toBe(true);
    }
  });
});
