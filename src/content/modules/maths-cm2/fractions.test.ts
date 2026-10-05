/**
 * Fractions CM2 : réponses recalculées indépendamment (égalités, comparaisons, rangements, droites,
 * fractions de quantités, problèmes).
 */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../schemas';
import { num, symb, tiragesDe } from './testkit';
import { fractionEnMots } from './util';

/** Évalue une expression « 3/4 + 1/8 », « 2 + 3/5 », « 4 × 3/10 », « 3/4 de 60 € » (sans unité). */
function evalExpr(expr: string): number {
  const e = expr
    .replace(/[  ]/g, '')
    .replace(/ (€|m|kg|min|L|km)(?=$| )/g, '')
    .trim();
  const de = e.match(/^(\d+)\/(\d+) de (\d+)$/);
  if (de) return (Number(de[1]) / Number(de[2])) * Number(de[3]);
  const tokens = e.split(' ');
  const v = (t: string) => {
    const m = t.match(/^(\d+)\/(\d+)$/);
    return m ? Number(m[1]) / Number(m[2]) : num(t);
  };
  let acc = v(tokens[0]!);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const x = v(tokens[i + 1]!);
    acc = op === '+' ? acc + x : op === '−' ? acc - x : op === '×' ? acc * x : NaN;
  }
  return acc;
}

/** Remplace « …/d » ou « … » par la réponse et vérifie l'égalité. */
function egaliteJuste(prompt: string, answer: number): boolean {
  const p = prompt.replace(/…/g, String(answer));
  const [g, d] = p.split(' = ');
  return Math.abs(evalExpr(g!) - evalExpr(d!)) < 1e-9;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe('fractions CM2 — réponses justes', () => {
  it('SENS : égalités, encadrements, visuels, lecture', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.FRAC.SENS', 'numeric_answer', level)) {
        const m = it.prompt.match(/^(\d+)\/(\d+) est compris entre (…|\d+) et (…|\d+)$/);
        if (m) {
          const v = Number(m[1]) / Number(m[2]);
          const bas = m[3] === '…' ? it.answer : Number(m[3]);
          const haut = m[4] === '…' ? it.answer : Number(m[4]);
          expect(haut - bas).toBe(1);
          expect(bas < v && v < haut, it.prompt).toBe(true);
        } else expect(egaliteJuste(it.prompt, it.answer), it.prompt).toBe(true);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.SENS', 'visual_fraction', level)) {
        if (level === 'facile') expect(it.numerator).toBeLessThan(it.denominator);
        if (level === 'plus_loin') expect(it.numerator).toBeGreaterThan(it.denominator);
        expect(it.numerator % it.denominator).not.toBe(0);
        if (it.shape === 'pizza') expect(it.denominator).toBeLessThanOrEqual(12);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.SENS', 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        let m = it.question.match(/^Comment lit-on (\d+)\/(\d+) \?$/);
        if (m) expect(good).toBe(fractionEnMots(Number(m[1]), Number(m[2])));
        m = it.question.match(/^Entre quels nombres entiers se trouve (\d+)\/(\d+) \?$/);
        if (m) {
          const v = Number(m[1]) / Number(m[2]);
          const [a, b] = good.split(' et ').map(Number);
          expect(a! < v && v < b! && b! - a! === 1).toBe(true);
        }
        m = it.question.match(/^Quelle fraction est égale à (.+) \?$/);
        if (m) {
          expect(close(evalExpr(good), evalExpr(m[1]!)), it.question).toBe(true);
          for (const c of it.choices) if (c !== good) expect(close(evalExpr(c), evalExpr(m[1]!))).toBe(false);
        }
        m = it.question.match(/^Quelle fraction s’écrit « (.+) » \?$/);
        if (m) {
          const [n, d] = good.split('/').map(Number);
          expect(fractionEnMots(n!, d!)).toBe(m[1]);
        }
      }
      for (const it of tiragesDe('CM2.MA.FRAC.SENS', 'pairing', level))
        for (const p of it.pairs)
          if (/^\d+ \+ /.test(p.right)) expect(close(evalExpr(p.left), evalExpr(p.right))).toBe(true);
          else {
            const [n, d] = p.left.split('/').map(Number);
            expect(p.right).toBe(fractionEnMots(n!, d!));
          }
    }
  });

  it('DROITE : cible, repérage et encadrements justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.FRAC.DROITE', 'number_line', level)) {
        expect(close(evalExpr(it.display), it.target), it.display).toBe(true);
        // Sur une graduation, ou au milieu de deux graduations en « plus loin »
        const k = level === 'plus_loin' ? 2 : 1;
        expect(close((it.target * it.subdivisions! * k) % 1, 0)).toBe(true);
        if (level === 'facile') expect([2, 4]).toContain(it.subdivisions);
        if (level === 'normal') expect([3, 5, 6, 8, 10]).toContain(it.subdivisions);
        if (level === 'plus_loin') expect(it.subdivisions! <= 6 || it.target > 1).toBe(true);
      }
      const repere = (texte: string) => {
        const d = Number(texte.match(/partagée en (\d+) parts/)![1]);
        const apres = texte.match(/est (\d+) graduations? après le repère (\d+)/);
        if (apres) return [Number(apres[2]) * d + Number(apres[1]), d] as const;
        const avant = texte.match(/est (\d+) graduations? avant le repère (\d+)/)!;
        return [Number(avant[2]) * d - Number(avant[1]), d] as const;
      };
      for (const it of tiragesDe('CM2.MA.FRAC.DROITE', 'numeric_answer', level)) {
        const [n, d] = repere(it.prompt);
        expect(it.answer).toBe(n);
        const droite = it.meta!.droite as { subdivisions: number; point: number; max: number };
        expect(droite.subdivisions).toBe(d);
        expect(close(droite.point, n / d)).toBe(true);
        expect(droite.point).toBeLessThan(droite.max);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.DROITE', 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        if (/graduation/.test(it.question)) {
          const [n, d] = repere(it.question);
          expect(close(evalExpr(good), n / d)).toBe(true);
          for (const c of it.choices) if (c !== good) expect(close(evalExpr(c), n / d)).toBe(false);
        } else {
          const m = it.question.match(/placer (\d+)\/(\d+) \?/)!;
          const v = Number(m[1]) / Number(m[2]);
          const [a, b] = good.replace('entre ', '').split(' et ').map(Number);
          expect(a! < v && v < b!).toBe(true);
        }
      }
      for (const it of tiragesDe('CM2.MA.FRAC.DROITE', 'true_false', level)) {
        let m = it.statement.match(/(\d+\/\d+) se place entre (\d+) et (\d+)/);
        if (m) {
          const v = evalExpr(m[1]!);
          expect(it.answer).toBe(Number(m[2]) < v && v < Number(m[3]));
        }
        m = it.statement.match(/(\d+\/\d+) et (\d+\/\d+) sont placés au même point/);
        if (m) expect(it.answer).toBe(close(evalExpr(m[1]!), evalExpr(m[2]!)));
      }
    }
  });

  it('COMPARER : signes, plus grande fraction, rangements', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.FRAC.COMPARER', 'mcq', level)) {
        const g = evalExpr(it.meta!.gauche as string);
        const d = evalExpr(it.meta!.droite as string);
        expect(it.choices[it.answerIndex]).toBe(symb(g, d));
      }
      for (const it of tiragesDe('CM2.MA.FRAC.COMPARER', 'visual_fraction', level)) {
        expect(it.task).toBe('comparer');
        const o = it.other!;
        expect(it.numerator * o.denominator).not.toBe(o.numerator * it.denominator);
        expect(Math.max(it.denominator, o.denominator)).toBeLessThanOrEqual(12);
        if (level === 'facile') expect(it.denominator).toBe(o.denominator);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.COMPARER', 'ordering', level)) {
        const v = it.elements.map(evalExpr);
        expect(v).toEqual([...v].sort((a, b) => (it.mode === 'croissant' ? a - b : b - a)));
        expect(new Set(v).size).toBe(v.length);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.COMPARER', 'true_false', level)) {
        const [a, s, b] = it.statement.split(' ');
        expect(it.answer).toBe(symb(evalExpr(a!), evalExpr(b!)) === s);
      }
    }
  });

  it('OPERATIONS : calculs, coloriages, QCM et problèmes justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.FRAC.OPERATIONS', 'numeric_answer', level))
        expect(egaliteJuste(it.prompt, it.answer), it.prompt).toBe(true);
      for (const it of tiragesDe('CM2.MA.FRAC.OPERATIONS', 'visual_fraction', level)) {
        const expr = it.prompt.match(/^Colorie (.+?) (?:de la|\()/)![1]!;
        expect(close(evalExpr(expr), it.numerator / it.denominator), it.prompt).toBe(true);
        expect(it.numerator).toBeGreaterThan(0);
        if (level !== 'plus_loin') expect(it.numerator).toBeLessThanOrEqual(2 * it.denominator);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.OPERATIONS', 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        const q = it.question.match(/^Combien font (.+) \?$/);
        const expr = q ? q[1]! : it.question.replace(/ = \?$/, '');
        const v = evalExpr(expr);
        expect(close(evalExpr(good), v), it.question).toBe(true);
        for (const c of it.choices) if (c !== good) expect(close(evalExpr(c), v)).toBe(false);
      }
      for (const it of tiragesDe('CM2.MA.FRAC.OPERATIONS', 'bar_model', level)) {
        const m = it.statement.match(/(\d[\d\u00a0]*) (?:élèves|cm|km|€|minutes)/)!;
        const f = it.statement.match(/ (\d+)\/(\d+)/);
        const [n, d] = f ? [Number(f[1]), Number(f[2])] : [1, 2];
        if (!f) expect(it.statement).toMatch(/la moitié/);
        const Q = num(m[1]!);
        const part = (Q / d) * n;
        expect(Number.isInteger(part)).toBe(true);
        expect(it.answer).toBe(it.structure === 'deux-etapes' ? Q - part : part);
        expect(it.total).toBe(Q);
        expect(it.operation.replace(/[\u00a0 ]/g, '')).toContain(String(it.answer));
        expect(it.bars[0]!.segments.length).toBe(d);
        // Contextes vraisemblables : pas plus de 100 € d'économies ni de 120 km à vélo
        if (/€/.test(it.statement)) expect(Q).toBeLessThanOrEqual(100);
        if (/vélo/.test(it.statement)) expect(Q).toBeLessThanOrEqual(120);
        // Pour la moitié, aucune reformulation fausse ne doit donner le même résultat
        if (!f) for (const r of it.reformulations!.slice(1)) expect(r).not.toMatch(/reste/);
      }
    }
  });
});
