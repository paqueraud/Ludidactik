/** Maths CM2 — opérations : réponses recalculées indépendamment des générateurs. */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../schemas';
import { num, tiragesDe } from './testkit';

/** Évalue un calcul écrit (« (12 + 8) × 3 », « 4 + 3 × 5 ») avec les priorités usuelles. */
function evaluer(texte: string): number {
  const toks = texte.match(/\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?|[()+−×÷]/g)!;
  let i = 0;
  const prim = (): number => {
    const t = toks[i++]!;
    if (t === '(') {
      const v = somme();
      i++;
      return v;
    }
    return num(t);
  };
  const produit = (): number => {
    let v = prim();
    while (toks[i] === '×' || toks[i] === '÷') {
      const op = toks[i++];
      const w = prim();
      v = op === '×' ? v * w : v / w;
    }
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (toks[i] === '+' || toks[i] === '−') {
      const op = toks[i++];
      const w = produit();
      v = op === '+' ? v + w : v - w;
    }
    return v;
  };
  const v = somme();
  expect(i, texte).toBe(toks.length);
  return Math.round(v * 1000) / 1000;
}

const ID = 'CM2.MA.OP.';

describe('maths CM2 — opérations', () => {
  it('évaluateur de contrôle', () => {
    expect(evaluer('(12 + 8) × 3')).toBe(60);
    expect(evaluer('4 + 3 × 5')).toBe(19);
    expect(evaluer('((2 + 3) × 4) − 1')).toBe(19);
    expect(evaluer('1 000 − 2,5 × 2')).toBe(995);
  });

  it('estimer : l’ordre de grandeur vient des nombres arrondis', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(`${ID}ESTIMER`, 'numeric_answer', level)) {
        const e = it.meta!.estimation as { a: number; b: number; op: string; ra: number; rb: number };
        expect(evaluer(`${String(e.ra).replace('.', ',')} ${e.op} ${e.rb}`)).toBe(it.answer);
        if (e.op !== '÷') {
          const u = Math.max(1, 10 ** (String(Math.round(e.ra)).length - 1));
          expect(Math.abs(e.a - e.ra), it.prompt).toBeLessThanOrEqual(u / 2);
        } else expect(e.ra % e.b).toBe(0);
        expect(Math.abs(e.ra - e.a) / e.a).toBeLessThan(0.5);
      }
      for (const it of tiragesDe(`${ID}ESTIMER`, 'mcq', level)) {
        const e = it.meta!.estimation as { ra: number; rb: number; op: string };
        expect(num(it.choices[it.answerIndex]!)).toBe(
          evaluer(`${String(e.ra).replace('.', ',')} ${e.op} ${e.rb}`),
        );
      }
      for (const it of tiragesDe(`${ID}ESTIMER`, 'true_false', level)) {
        const m = it.statement.match(/a posé (.+) et a trouvé (.+)\. Sans/);
        if (!m) continue;
        const exact = evaluer(m[1]!);
        expect(it.answer, it.statement).toBe(num(m[2]!) === exact);
      }
      for (const it of tiragesDe(`${ID}ESTIMER`, 'classification', level)) {
        expect(new Set(it.elements.map((e) => e.category)).size).toBe(2);
      }
    }
  });

  it('parenthèses : le résultat est celui du calcul, sans nombre négatif', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(`${ID}PARENTHESES`, 'numeric_answer', level)) {
        expect(evaluer(it.prompt), it.prompt).toBe(it.answer);
        const paires = (it.prompt.match(/\(/g) ?? []).length;
        if (level === 'facile') expect(paires).toBe(1);
        if (level === 'normal') expect(paires).toBe(2);
      }
      for (const it of tiragesDe(`${ID}PARENTHESES`, 'true_false', level)) {
        const [g, d] = it.statement.split(' = ');
        expect(it.answer, it.statement).toBe(evaluer(g!) === num(d!));
      }
      for (const it of tiragesDe(`${ID}PARENTHESES`, 'pairing', level))
        for (const p of it.pairs) expect(evaluer(p.left), p.left).toBe(num(p.right));
      for (const it of tiragesDe(`${ID}PARENTHESES`, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        const m = it.question.match(/^Quel calcul donne (.+) \?$/);
        if (m) {
          const cible = num(m[1]!);
          expect(evaluer(good)).toBe(cible);
          for (const c of it.choices) if (c !== good) expect(evaluer(c)).not.toBe(cible);
        } else expect(num(good)).toBe(evaluer(it.question.replace(/^Combien vaut /, '').replace(/ \?$/, '')));
      }
    }
  });

  it('décimal × entier : produit juste, virgule bien placée', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(`${ID}MULT_DEC`, 'numeric_answer', level)) {
        const p = it.meta!.posee as { a: number; b: number; op: string };
        expect(p.op).toBe('×');
        expect(Math.round(p.a * p.b * 1000) / 1000).toBe(it.answer);
        expect(evaluer(it.prompt)).toBe(it.answer);
        if (level !== 'plus_loin') expect(Number.isInteger(p.b)).toBe(true);
        if (level === 'facile') expect(p.b).toBeLessThan(10);
        if (level === 'normal') expect(p.b).toBeGreaterThan(10);
        expect(Number.isInteger(p.a)).toBe(false);
      }
      for (const it of tiragesDe(`${ID}MULT_DEC`, 'mcq', level))
        expect(num(it.choices[it.answerIndex]!)).toBe(evaluer(it.question.replace('Pose et calcule : ', '')));
      for (const it of tiragesDe(`${ID}MULT_DEC`, 'fill_blank', level)) {
        const calc = it.sentence.split(', donc ')[1]!.replace(' = ___', '');
        expect(num(it.answer)).toBe(evaluer(calc));
        expect(it.choices).toContain(it.answer);
      }
      for (const it of tiragesDe(`${ID}MULT_DEC`, 'true_false', level)) {
        const m = it.statement.match(/a posé (.+) et a trouvé (.+)\. C’est/)!;
        expect(it.answer).toBe(evaluer(m[1]!) === num(m[2]!));
      }
    }
  });

  it('division : a = b × q + r avec r < b, quotients décimaux exacts', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(`${ID}DIV`, 'numeric_answer', level)) {
        const p = it.meta!.posee as { a: number; b: number } | undefined;
        const d = it.meta!.division as { a: number; b: number; quotient: number; reste: number } | undefined;
        if (p && it.meta!.decimale) {
          expect(Math.round(it.answer * p.b * 1000) / 1000).toBe(p.a);
          if (level !== 'plus_loin') expect(p.b).toBeLessThan(10);
        } else if (p) {
          const r = it.meta!.reste as number;
          expect(p.b * it.answer + r).toBe(p.a);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThan(p.b);
        } else {
          expect(d!.b * d!.quotient + it.answer).toBe(d!.a);
          expect(it.answer).toBeLessThan(d!.b);
        }
        if (level === 'facile') expect(it.meta!.decimale).toBeUndefined();
      }
      for (const it of tiragesDe(`${ID}DIV`, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        const m = it.question.match(/division euclidienne de (.+) par (.+) \?/);
        if (m) {
          const [a, b] = [num(m[1]!), num(m[2]!)];
          const g = good.match(/^(.+) = \((.+) × (.+)\) \+ (.+)$/)!;
          expect(num(g[1]!)).toBe(a);
          expect(num(g[3]!) * b + num(g[4]!)).toBe(a);
          expect(num(g[4]!)).toBeLessThan(b);
        } else expect(num(good)).toBe(evaluer(it.question.replace('Pose et calcule : ', '')));
      }
      for (const it of tiragesDe(`${ID}DIV`, 'true_false', level)) {
        const m = it.statement.match(/^Pour (.+) ÷ (.+), .+ un quotient de (.+) et un reste de (.+)\. C’est/);
        if (m) {
          const [a, b, q, r] = [m[1]!, m[2]!, m[3]!, m[4]!].map(num) as [number, number, number, number];
          expect(it.answer).toBe(b * q + r === a && r < b);
        } else {
          const [g, d] = it.statement.split(' = ');
          expect(it.answer).toBe(evaluer(g!) === num(d!));
        }
      }
      for (const it of tiragesDe(`${ID}DIV`, 'fill_blank', level)) {
        const e = it.sentence.match(/^(.+) = \((.+) × ___\) \+ (.+)$/);
        if (e) {
          const [a, b, r] = [num(e[1]!), num(e[2]!), num(e[3]!)];
          expect(b * num(it.answer) + r).toBe(a);
          expect(r).toBeLessThan(b);
        } else {
          const m = it.sentence.match(/^(.+) × ___ = (.+)$/)!;
          expect(Math.round(num(m[1]!) * num(it.answer) * 1000) / 1000).toBe(num(m[2]!));
        }
      }
    }
  });
});
