/** Décimaux CM2 : réponses recalculées indépendamment (en millièmes entiers). */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../schemas';
import { num, symb, tiragesDe } from './testkit';

/** Valeur en millièmes d'une écriture « 3 + 2/10 + 5/1000 », « 4107/1000 », « 3,45 ». */
function evalM(expr: string): number {
  return expr
    .split(' + ')
    .map((t) => {
      const f = t
        .trim()
        .replace(/\u00a0/g, '')
        .match(/^(\d+)\/(\d+)$/);
      if (f) {
        const v = (Number(f[1]) * 1000) / Number(f[2]);
        expect(Number.isInteger(v), t).toBe(true);
        return v;
      }
      return Math.round(num(t) * 1000);
    })
    .reduce((a, b) => a + b, 0);
}
const M = (x: number) => Math.round(x * 1000);
const RANG: Record<string, number> = {
  millième: 0,
  centième: 1,
  dixième: 2,
  unité: 3,
  dizaine: 4,
  centaine: 5,
};
const rangDe = (mot: string) => RANG[mot.replace(/s$/, '')]!;
const chiffreM = (m: number, r: number) => Math.floor(m / 10 ** r) % 10;
const VAUT: Record<string, number> = {
  unité: 1000,
  dixième: 100,
  centième: 10,
  millième: 1,
  dizaine: 10000,
  centaine: 100000,
};

describe('CM2.MA.DEC.FRAC_DEC', () => {
  const id = 'CM2.MA.DEC.FRAC_DEC';
  it('numérique : chaque écriture est égale', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'numeric_answer', level)) {
        const p = it.prompt.replace('Écris avec une virgule : ', '');
        let m: RegExpMatchArray | null;
        if ((m = p.match(/^Combien de (\p{L}+) y a-t-il dans (\d) (\p{L}+?)s? \?$/u))) {
          expect(it.answer * VAUT[m[1]!.replace(/s$/, '')]!).toBe(Number(m[2]) * VAUT[m[3]!]!);
        } else if ((m = p.match(/^(.+) = (.+) \+ …\/(\d+)$/))) {
          expect(it.answer * 1000).toBe((evalM(m[1]!) - evalM(m[2]!)) * Number(m[3]));
        } else if ((m = p.match(/^(.+) = …\/(\d+)$/))) {
          expect(it.answer * 1000).toBe(evalM(m[1]!) * Number(m[2]));
        } else if ((m = p.match(/^(.+) = …$/))) {
          expect(M(it.answer), p).toBe(evalM(m[1]!));
        } else throw new Error(`forme inconnue : ${p}`);
        if (level === 'facile') expect(p).not.toMatch(/\/100\b|\/1000/);
      }
  });

  it('paires, droite, QCM, schéma : valeurs justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(id, 'pairing', level))
        for (const p of it.pairs) expect(evalM(p.left), p.left).toBe(evalM(p.right));
      for (const it of tiragesDe(id, 'number_line', level)) expect(evalM(it.display)).toBe(M(it.target));
      for (const it of tiragesDe(id, 'visual_fraction', level)) {
        expect(it.denominator).toBe(10);
        const dec = it.prompt.match(/Colorie (\d+,\d)/);
        if (dec) expect(M(num(dec[1]!))).toBe(it.numerator * 100);
      }
      for (const it of tiragesDe(id, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        let m: RegExpMatchArray | null;
        if ((m = it.question.match(/^Dans (.+), que vaut le chiffre (\d) \?$/))) {
          const [c, mot] = good.split(' ');
          expect(Number(c)).toBe(Number(m[2]));
          expect(chiffreM(evalM(m[1]!), rangDe(mot!))).toBe(Number(m[2]));
          // le chiffre n'apparaît qu'une fois
          expect(m[1]!.split('').filter((x) => x === m![2]).length, it.question).toBe(1);
        } else if ((m = it.question.match(/^Combien de (\p{L}+) y a-t-il dans (\d) (\p{L}+?)s? \?$/u))) {
          expect(num(good) * VAUT[m[1]!.replace(/s$/, '')]!).toBe(Number(m[2]) * VAUT[m[3]!]!);
          if (level === 'plus_loin') expect(`${m[2]} ${m[3]}`).not.toBe('1 unité');
        } else if ((m = it.question.match(/^Combien y a-t-il de (\p{L}+) en tout dans (.+) \?$/u))) {
          expect(num(good)).toBe(Math.floor(evalM(m[2]!) / VAUT[m[1]!.replace(/s$/, '')]!));
        } else if ((m = it.question.match(/^Quelle écriture à virgule est égale à (.+) \?$/))) {
          expect(evalM(good)).toBe(evalM(m[1]!));
          for (const c of it.choices) if (c !== good) expect(evalM(c)).not.toBe(evalM(good));
        } else if ((m = it.question.match(/^Quel est le chiffre des (\p{L}+) dans (.+) \?$/u))) {
          expect(chiffreM(evalM(m[2]!), rangDe(m[1]!))).toBe(Number(good));
        } else throw new Error(`forme inconnue : ${it.question}`);
      }
    }
  });
});

describe('CM2.MA.DEC.COMPARER', () => {
  const id = 'CM2.MA.DEC.COMPARER';
  it('comparaisons, rangements, droite', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(id, 'mcq', level)) {
        const g = it.meta!.gauche as string;
        const d = it.meta!.droite as string;
        expect(it.choices[it.answerIndex]).toBe(symb(num(g), num(d)));
        if (level === 'facile') expect(`${g} ${d}`).not.toMatch(/,\d\d/);
      }
      for (const it of tiragesDe(id, 'true_false', level)) {
        const [a, s, b] = it.statement.split(' ');
        expect(it.answer).toBe(symb(num(a!), num(b!)) === s);
      }
      for (const it of tiragesDe(id, 'ordering', level)) {
        const v = it.elements.map(num);
        expect(v).toEqual([...v].sort((x, y) => (it.mode === 'croissant' ? x - y : y - x)));
      }
      for (const it of tiragesDe(id, 'number_line', level)) expect(num(it.display)).toBe(it.target);
    }
  });

  it('partie entière, arrondis, encadrements, intercalation', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'numeric_answer', level)) {
        const p = it.prompt;
        let m: RegExpMatchArray | null;
        const a = it.answer;
        if ((m = p.match(/partie entière de (.+) \?/))) expect(a).toBe(Math.floor(num(m[1]!)));
        else if ((m = p.match(/^Arrondis (.+) à l’unité/))) {
          const x = M(num(m[1]!));
          expect(x % 1000).not.toBe(500);
          expect(a).toBe(Math.round(x / 1000));
        } else if ((m = p.match(/^Arrondis (.+) au (dixième|centième)/))) {
          const u = m[2] === 'dixième' ? 100 : 10;
          const x = M(num(m[1]!));
          expect(x % u).not.toBe(u / 2);
          expect(M(a)).toBe(Math.round(x / u) * u);
        } else if ((m = p.match(/milieu de (.+) et (.+) \?/))) {
          expect(M(a) * 2).toBe(M(num(m[1]!)) + M(num(m[2]!)));
        } else if ((m = p.match(/(?:: )?(.+) < (.+) < (.+)$/))) {
          const [b, x, h] = [m[1]!, m[2]!, m[3]!].map((s) => s.replace('Encadre au dixième : ', ''));
          const u = /dixième/.test(p) ? 100 : 1000;
          const lo = b === '…' ? M(a) : M(num(b));
          const hi = h === '…' ? M(a) : M(num(h));
          expect(lo).toBeLessThan(M(num(x)));
          expect(hi).toBeGreaterThan(M(num(x)));
          expect(hi - lo).toBe(u);
          expect(lo % u).toBe(0);
        } else throw new Error(`forme inconnue : ${p}`);
      }
  });
});

describe('CM2.MA.DEC.USUELLES', () => {
  const id = 'CM2.MA.DEC.USUELLES';
  it('équivalences fractions usuelles ↔ décimaux', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(id, 'numeric_answer', level)) {
        let m: RegExpMatchArray | null;
        if ((m = it.prompt.match(/^(\d+)\/(\d+) = …$/)))
          expect(M(it.answer)).toBe((Number(m[1]) * 1000) / Number(m[2]));
        else if ((m = it.prompt.match(/^(.+) = …\/(\d+)$/)))
          expect(it.answer * 1000).toBe(M(num(m[1]!)) * Number(m[2]));
        else throw new Error(it.prompt);
      }
      for (const it of tiragesDe(id, 'pairing', level))
        for (const p of it.pairs) expect(evalM(p.left)).toBe(evalM(p.right));
      for (const it of tiragesDe(id, 'true_false', level)) {
        const [f, d] = it.statement.split(' = ');
        expect(it.answer).toBe(evalM(f!) === evalM(d!));
      }
      for (const it of tiragesDe(id, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        const m = it.question.match(/égale à (.+) \?$/)!;
        expect(evalM(good)).toBe(evalM(m[1]!));
        for (const c of it.choices) if (c !== good) expect(evalM(c)).not.toBe(evalM(good));
      }
    }
  });
});
