import { describe, expect, it } from 'vitest';
import { graphiesNombre } from '@/engine/nombres';
import { createRng } from '@/engine/rng';
import { propositionsLettres } from './lettres';

describe('Perroquet — propositions en lettres', () => {
  it('une seule écriture correcte parmi les choix, et c’est la bonne', () => {
    const rng = createRng(7);
    for (const n of [
      1, 21, 71, 80, 81, 99, 100, 200, 312, 480, 1000, 2000, 80_000, 345_678, 1_000_000, 200_000_080,
    ]) {
      for (let k = 0; k < 20; k++) {
        const p = propositionsLettres(n, rng);
        if (!p) continue;
        const correctes = new Set(graphiesNombre(n));
        expect(correctes.has(p.choix[p.bonne]!)).toBe(true);
        expect(p.choix.filter((c) => correctes.has(c))).toHaveLength(1);
        expect(new Set(p.choix).size).toBe(p.choix.length);
      }
    }
  });

  it('refuse les nombres hors bornes ou non entiers', () => {
    const rng = createRng(1);
    expect(propositionsLettres(3.5, rng)).toBeNull();
    expect(propositionsLettres(-2, rng)).toBeNull();
  });
});
