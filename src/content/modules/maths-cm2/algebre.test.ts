/** Maths CM2 — algèbre : réponses recalculées indépendamment des générateurs. */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../schemas';
import { num, tiragesDe } from './testkit';

/** Évalue un calcul écrit avec les priorités usuelles (« 6 × 8 », « (20 − 12) ÷ 2 »). */
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

/** Une égalité « gauche = droite » est-elle vraie ? */
const egaliteVraie = (eq: string) => {
  const [g, d] = eq.split(' = ');
  return evaluer(g!) === evaluer(d!);
};

/** Applique « + 2 », « × 4 »… */
const appliquer = (x: number, etape: string) => {
  const [op, k] = [etape[0], num(etape.slice(2))];
  const v = op === '+' ? x + k : op === '−' ? x - k : op === '×' ? x * k : x / k;
  return Math.round(v * 1000) / 1000;
};
const MOTS: Record<string, string> = { ajouter: '+', retirer: '−', multiplier: '×', diviser: '÷' };
const motsVersCode = (m: string) => {
  const [verbe, ...rest] = m.split(' ');
  return `${MOTS[verbe!]} ${rest[rest.length - 1]}`;
};

const ID = 'CM2.MA.ALG.';

describe('maths CM2 — algèbre', () => {
  it('égalités à trous : en remplaçant les inconnues, toutes les égalités sont vraies', () => {
    for (const level of LEVELS) {
      for (const kind of ['numeric_answer', 'mcq'] as const)
        for (const it of tiragesDe(`${ID}TROUS`, kind, level)) {
          const e = it.meta!.egalites as {
            equations: string[];
            valeurs: Record<string, number>;
            inconnue: string;
          };
          const rep = it.kind === 'numeric_answer' ? it.answer : num(it.choices[it.answerIndex]!);
          expect(rep).toBe(e.valeurs[e.inconnue]);
          for (const eq of e.equations) {
            const remplie = eq.replace(/…|■|▲|●/g, (s) => String(e.valeurs[s]));
            expect(egaliteVraie(remplie), remplie).toBe(true);
          }
          if (it.kind === 'mcq')
            for (const c of it.choices)
              if (c !== it.choices[it.answerIndex])
                expect(egaliteVraie(e.equations[0]!.replace(/…|■/g, c.replace(/\s/g, '')))).toBe(false);
          if (level === 'normal') expect(e.equations[0]!.split(' = ')[1]).toMatch(/[+−×÷]/);
        }
      for (const it of tiragesDe(`${ID}TROUS`, 'true_false', level)) {
        const m = it.statement.match(/^Si ■ = (\d+), alors (.+)\.$/);
        const eq = m ? m[2]!.replace(/■/g, m[1]!) : it.statement;
        expect(it.answer, it.statement).toBe(egaliteVraie(eq));
      }
      for (const it of tiragesDe(`${ID}TROUS`, 'bar_model', level)) {
        const [calc, res] = it.operation.split(' = ');
        expect(evaluer(calc!)).toBe(num(res!));
        expect(num(res!)).toBe(it.answer);
        // Le prix trouvé est cohérent avec l'énoncé
        const nombres = (it.statement.match(/\d+/g) ?? []).map(Number);
        if (level === 'plus_loin') expect(nombres[2]! - nombres[5]!).toBe(it.answer);
      }
    }
  });

  it('programmes de calcul : exécuter et remonter donnent la bonne réponse (3 étapes au plus)', () => {
    for (const level of LEVELS) {
      for (const kind of ['numeric_answer', 'mcq', 'ordering', 'true_false'] as const)
        for (const it of tiragesDe(`${ID}PROGRAMMES`, kind, level)) {
          const p = it.meta!.programme as { etapes: string[]; entree: number | null; sortie: number | null };
          expect(p.etapes.length).toBeLessThanOrEqual(3);
          if (level === 'facile') expect(p.etapes.length).toBe(2);
          const entree = p.entree ?? (it.kind === 'numeric_answer' ? it.answer : NaN);
          const sortie = p.etapes.reduce(appliquer, entree);
          if (p.sortie !== null) expect(sortie).toBe(p.sortie);
          if (it.kind === 'numeric_answer' && p.entree !== null) expect(it.answer).toBe(sortie);
          if (it.kind === 'mcq') {
            const good = it.choices[it.answerIndex]!;
            if (/^Quel programme/.test(it.question)) {
              const [, de, vers] = it.question.match(/transforme (.+) en (.+) \?/)!;
              const run = (c: string) => c.split(', puis ').map(motsVersCode).reduce(appliquer, num(de!));
              expect(run(good)).toBe(num(vers!));
              for (const c of it.choices) if (c !== good) expect(run(c)).not.toBe(num(vers!));
            } else expect(num(good)).toBe(sortie);
          }
          if (it.kind === 'ordering') {
            expect(it.elements.map(motsVersCode)).toEqual(p.etapes);
            expect(num(it.prompt.match(/on obtienne (.+)\.$/)![1]!)).toBe(sortie);
          }
          if (it.kind === 'true_false') {
            const montre = num(it.statement.match(/on obtient (.+)\.$/)![1]!);
            expect(it.answer).toBe(montre === sortie);
          }
        }
    }
  });

  it('suites : les termes suivent la règle et la réponse est le terme demandé', () => {
    const terme = (r: { premier: number; m: number; k: number }, n: number) => {
      let u = r.premier;
      for (let j = 1; j < n; j++) u = Math.round((r.m * u + r.k) * 1000) / 1000;
      return u;
    };
    for (const level of LEVELS)
      for (const kind of ['numeric_answer', 'mcq', 'fill_blank', 'true_false'] as const)
        for (const it of tiragesDe(`${ID}SUITES`, kind, level)) {
          const s = it.meta!.suite as { termes: number[]; etape: number };
          const r = it.meta!.regle as { premier: number; m: number; k: number };
          s.termes.forEach((t, j) => expect(t).toBe(terme(r, j + 1)));
          for (const t of s.termes) expect(t).toBeGreaterThanOrEqual(0);
          if (it.kind === 'numeric_answer') expect(it.answer).toBe(terme(r, s.etape));
          if (it.kind === 'fill_blank') expect(num(it.answer)).toBe(terme(r, s.etape));
          if (it.kind === 'true_false') {
            const montre = num(it.statement.match(/nombre est (.+)\.$/)![1]!);
            expect(it.answer).toBe(montre === terme(r, s.etape));
          }
          if (it.kind === 'mcq') {
            // Chaque mauvaise règle ne redonne pas les termes affichés
            const regle = (txt: string) => {
              const m = txt.match(/^([+−×]) ([\d,]+)(?: puis ([+−]) ([\d,]+))?$/)!;
              const k = num(m[2]!);
              return m[1] === '×'
                ? { premier: r.premier, m: k, k: m[4] ? (m[3] === '+' ? 1 : -1) * num(m[4]) : 0 }
                : { premier: r.premier, m: 1, k: m[1] === '+' ? k : -k };
            };
            const affiches = s.termes.join('|');
            for (const c of it.choices) {
              const t = s.termes.map((_, j) => terme(regle(c), j + 1)).join('|');
              expect(t === affiches, c).toBe(c === it.choices[it.answerIndex]);
            }
          }
          if (level === 'plus_loin' && it.kind === 'numeric_answer' && it.meta!.motif)
            expect(s.etape).toBeGreaterThanOrEqual(50);
        }
  });
});
