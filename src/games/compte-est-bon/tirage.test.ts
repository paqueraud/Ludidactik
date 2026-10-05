import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { NB_NOMBRES, OPS_NIVEAU, calculer, tirage } from './tirage';

describe('Le Compte est bon — tirage', () => {
  it('la solution fournie utilise les nombres tirés et atteint la cible', () => {
    const rng = createRng(3);
    for (const level of LEVELS) {
      for (const cible of [1, 2, 7, 10, 24, 56, 65, 100, 365, 516, 999, 1000, 4200]) {
        const t = tirage(cible, level, rng);
        if (!t) continue;
        expect(t.nombres).toHaveLength(NB_NOMBRES[level]);
        expect(t.nombres).not.toContain(cible);
        const dispo = [...t.nombres];
        for (const e of t.solution) {
          expect(OPS_NIVEAU[level]).toContain(e.op);
          for (const x of [e.a, e.b]) {
            const i = dispo.indexOf(x);
            expect(i).toBeGreaterThanOrEqual(0);
            dispo.splice(i, 1);
          }
          expect(calculer(e.a, e.op, e.b)).toBe(e.r);
          dispo.push(e.r);
        }
        expect(dispo).toContain(cible);
      }
    }
  });

  it('trouve presque toujours un tirage pour les cibles de calcul mental', () => {
    const rng = createRng(11);
    for (const level of LEVELS) {
      let rates = 0;
      for (let c = 2; c <= 300; c++) if (!tirage(c, level, rng)) rates++;
      expect(rates).toBeLessThan(5);
    }
  });

  it('refuse les cibles non entières ou nulles', () => {
    const rng = createRng(1);
    expect(tirage(3.5, 'normal', rng)).toBeNull();
    expect(tirage(0, 'normal', rng)).toBeNull();
  });
});
