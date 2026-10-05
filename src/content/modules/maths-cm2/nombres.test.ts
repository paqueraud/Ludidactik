/**
 * Nombres entiers CM2 : réponses recalculées indépendamment des générateurs.
 */
import { describe, expect, it } from 'vitest';
import { graphiesNombre, nombreEnLettres } from '@/engine/nombres';
import { type ItemKind, LEVELS } from '../../schemas';
import { contenu } from './index';
import { cle, num, symb, tirages, tiragesDe } from './testkit';

/** Graphies acceptées d'un nombre, milliards compris (« douze milliards cinq-cents-millions »). */
function graphies(n: number): string[] {
  const g = Math.floor(n / 1e9);
  if (!g) return graphiesNombre(n);
  const reste = n % 1e9;
  return (['rectifiee', 'traditionnelle'] as const).map(
    (st) =>
      `${nombreEnLettres(g, st)} milliard${g > 1 ? 's' : ''}${reste ? ` ${nombreEnLettres(reste, st)}` : ''}`,
  );
}

const RANGS: Record<string, number> = {
  unité: 0,
  dizaine: 1,
  centaine: 2,
  millier: 3,
  mille: 3,
  'dizaine de mille': 4,
  'centaine de mille': 5,
  million: 6,
  'dizaine de millions': 7,
  'centaine de millions': 8,
  milliard: 9,
  'dizaine de milliards': 10,
  'centaine de milliards': 11,
};
/** « dizaines de mille » → 4, « centaines de millions » → 8. */
const rang = (nom: string) => {
  const sg = nom.replace(/^(\p{L}+?)s( |$)/u, '$1$2');
  const r = RANGS[sg] ?? RANGS[nom];
  if (r === undefined) throw new Error(`rang inconnu : ${nom}`);
  return r;
};

/** Valeur d'une décomposition affichée (« 4 millions, 25 milliers et 3 unités », « (4 × 1 000) + 5 »…). */
function valeurDecomposition(t: string): number {
  if (/^\d+ (milliards?|millions?|mille)( |$)/.test(t) && !/[,+]| et /.test(t)) {
    let s = 0;
    for (const m of t.matchAll(/(\d+)(?: (milliards?|millions?|mille))?/g))
      s += Number(m[1]) * 10 ** (m[2] ? rang(m[2]) : 0);
    return s;
  }
  return t
    .replace(/ et /g, ' + ')
    .replace(/, /g, ' + ')
    .split(' + ')
    .reduce((s, terme) => {
      const p = terme.match(/^\((\d+) × ([\d  ]+)\)$/);
      if (p) return s + Number(p[1]) * num(p[2]!);
      if (/^\d+$/.test(terme)) return s + Number(terme);
      const m = terme.match(/^(\d+) (.+)$/)!;
      return s + Number(m[1]) * 10 ** rang(m[2]!);
    }, 0);
}

const chiffre = (n: number, p: number) => Math.floor(n / 10 ** p) % 10;
const diviseurs = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);

describe('CM2.MA.NUM.GRANDS', () => {
  const L = 'CM2.MA.NUM.GRANDS';
  it('numérique : dictée, construction et « combien en tout » justes', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(L, 'numeric_answer', level)) {
        if (it.meta?.dictee) expect(it.spoken).toBe(String(it.answer));
        else if (it.meta?.construire)
          expect(valeurDecomposition(it.prompt.replace('Écris en chiffres : ', '')), it.prompt).toBe(
            it.answer,
          );
        else {
          const m = it.prompt.match(/^Combien y a-t-il de (.+) en tout dans (.+) \?$/)!;
          expect(it.answer, it.prompt).toBe(Math.floor(num(m[2]!) / 10 ** rang(m[1]!)));
        }
        if (level === 'facile') expect(it.answer).toBeLessThanOrEqual(999_999);
        if (level === 'normal') expect(it.answer).toBeLessThanOrEqual(999_999_999);
      }
  });

  it('les milliards n’apparaissent qu’au niveau plus loin', () => {
    const vus = tiragesDe(L, 'numeric_answer', 'plus_loin').filter((it) => it.answer >= 1e9);
    expect(vus.length).toBeGreaterThan(10);
  });

  it('lettres : graphie juste, aucun distracteur acceptable', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(L, 'fill_blank', level)) {
        const n = num(it.sentence.split(' s’écrit')[0]!);
        expect(graphies(n)[0]).toBe(it.answer);
        for (const c of it.choices ?? []) if (c !== it.answer) expect(graphies(n)).not.toContain(c);
      }
      for (const it of tiragesDe(L, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        let m = it.question.match(/^Comment s’écrit (.+) en lettres/);
        if (m) {
          const n = num(m[1]!);
          expect(good).toBe(graphies(n)[0]);
          for (const c of it.choices) if (c !== good) expect(graphies(n)).not.toContain(c);
          continue;
        }
        m = it.question.match(/^Quel nombre s’écrit « (.+) » \?/);
        if (m) {
          expect(graphies(num(good))).toContain(m[1]);
          continue;
        }
        m = it.question.match(/^Quel est le chiffre (?:des|du) (.+) dans (.+) \?$/);
        if (m) {
          expect(Number(good)).toBe(chiffre(num(m[2]!), rang(m[1]!)));
          continue;
        }
        m = it.question.match(/^Dans (.+), que vaut le chiffre (\d)(?: des (.+))? \?$/);
        if (m) {
          const n = num(m[1]!);
          const s = String(n);
          const c = m[2]!;
          const p = m[3] ? rang(m[3]) : s.length - 1 - s.indexOf(c);
          if (!m[3]) expect(s.split(c).length - 1).toBe(1);
          expect(chiffre(n, p)).toBe(Number(c));
          expect(num(good)).toBe(Number(c) * 10 ** p);
          continue;
        }
        m = it.question.match(/^Comment lit-on (.+) \?$/);
        expect(m, it.question).not.toBeNull();
        expect(valeurDecomposition(good)).toBe(num(m![1]!));
        for (const c of it.choices) if (c !== good) expect(valeurDecomposition(c)).not.toBe(num(m![1]!));
      }
    }
  });

  it('oral et vrai/faux : justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(L, 'oral_answer', level)) {
        const n = num(it.prompt.split(' : ')[1]!);
        expect(it.accepted).toContain(String(n));
        if (n < 1e9) expect(it.accepted).toContain(nombreEnLettres(n));
      }
      for (const it of tiragesDe(L, 'true_false', level)) {
        const m = it.statement.match(/^Dans (.+), le chiffre des (.+) est (\d)\.$/);
        if (m) expect(it.answer).toBe(chiffre(num(m[1]!), rang(m[2]!)) === Number(m[3]));
        else {
          const [g, d] = it.statement.split(' = ') as [string, string];
          expect(it.answer, it.statement).toBe(valeurDecomposition(d) === num(g));
        }
      }
    }
  });
});

describe('CM2.MA.NUM.COMPARER', () => {
  const L = 'CM2.MA.NUM.COMPARER';
  const valeur = (s: string) => {
    const m = s.match(/^(\d+) (millions|milliards)$/);
    return m ? Number(m[1]) * (m[2] === 'millions' ? 1e6 : 1e9) : num(s);
  };
  it('comparaisons, rangements et droites justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(L, 'mcq', level)) {
        expect(it.choices).toEqual(['<', '=', '>']);
        expect(it.choices[it.answerIndex]).toBe(
          symb(valeur(it.meta!.gauche as string), valeur(it.meta!.droite as string)),
        );
      }
      for (const it of tiragesDe(L, 'ordering', level)) {
        const v = it.elements.map(num);
        expect(v).toEqual([...v].sort((a, b) => (it.mode === 'croissant' ? a - b : b - a)));
        if (level === 'facile') expect(Math.max(...v)).toBeLessThanOrEqual(999_999);
      }
      for (const it of tiragesDe(L, 'number_line', level)) {
        expect(num(it.display)).toBe(it.target);
        if (level !== 'plus_loin') expect(((it.target - it.min) * (it.subdivisions ?? 1)) % it.step).toBe(0);
      }
    }
  });

  it('juste avant/après, encadrements, milieux et arrondis recalculés', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(L, 'numeric_answer', level)) {
        const p = it.prompt;
        let m = p.match(/^Le nombre juste (après|avant) (.+) est …$/);
        if (m) {
          expect(it.answer).toBe(num(m[2]!) + (m[1] === 'après' ? 1 : -1));
          continue;
        }
        m = p.match(/^Encadre .+ : (…|[\d ]+) < ([\d ]+) < (…|[\d ]+)$/);
        if (m) {
          const n = num(m[2]!);
          const autre = m[1] === '…' ? num(m[3]!) : num(m[1]!);
          // l'écart entre les deux bornes est une puissance de 10 et n est strictement entre elles
          const bas = m[1] === '…' ? it.answer : autre;
          const haut = m[1] === '…' ? autre : it.answer;
          expect(bas).toBeLessThan(n);
          expect(haut).toBeGreaterThan(n);
          expect(Math.log10(haut - bas) % 1).toBe(0);
          expect(bas % (haut - bas)).toBe(0);
          continue;
        }
        m = p.match(/^Quel nombre est exactement au milieu de (.+) et (.+) \?$/);
        if (m) {
          expect(it.answer).toBe((num(m[1]!) + num(m[2]!)) / 2);
          continue;
        }
        m = p.match(
          /^Arrondis (.+) (au millier|à la centaine de mille|au million|au milliard) le plus proche\.$/,
        );
        expect(m, p).not.toBeNull();
        const u = { 'au millier': 1e3, 'à la centaine de mille': 1e5, 'au million': 1e6, 'au milliard': 1e9 }[
          m![2] as 'au millier'
        ];
        const n = num(m![1]!);
        expect(n % u).not.toBe(u / 2);
        expect(it.answer).toBe(Math.round(n / u) * u);
      }
  });

  it('vrai/faux justes', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(L, 'true_false', level)) {
        const m = it.statement.match(/^(.+) est compris entre (.+) et (.+)\.$/);
        if (m) {
          const n = num(m[1]!);
          expect(it.answer).toBe(n > num(m[2]!) && n < num(m[3]!));
        } else {
          const [a, s, b] = it.statement.split(/ ([<>=]) /);
          expect(it.answer, it.statement).toBe(symb(num(a!), num(b!)) === s);
        }
      }
  });
});

describe('CM2.MA.NUM.DIVISIBILITE', () => {
  const L = 'CM2.MA.NUM.DIVISIBILITE';
  it('classements justes', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(L, 'classification', level)) {
        for (const e of it.elements) {
          const n = num(e.label);
          const cat = it.categories[e.category]!;
          let m = cat.match(/^(pas )?divisible par (\d+)$/);
          if (m && it.categories.length === 2) {
            expect(n % Number(m[2]) === 0, `${n} ${cat}`).toBe(!m[1]);
            continue;
          }
          m = cat.match(/^(pas )?(diviseur|multiple) de (\d+)$/);
          if (m) {
            const k = Number(m[3]);
            expect(m[2] === 'diviseur' ? k % n === 0 : n % k === 0, `${n} ${cat}`).toBe(!m[1]);
            continue;
          }
          if (it.categories.length === 4)
            expect(cat).toBe(
              n % 10 === 0
                ? 'par 2 et par 5'
                : n % 2 === 0
                  ? 'par 2 seulement'
                  : n % 5 === 0
                    ? 'par 5 seulement'
                    : 'ni par 2 ni par 5',
            );
          else
            expect(cat).toBe(
              n % 9 === 0 ? 'divisible par 9' : n % 3 === 0 ? 'par 3 mais pas par 9' : 'pas divisible par 3',
            );
        }
        if (level === 'facile') expect(it.categories[0]).toMatch(/par (2|5|10)$/);
      }
  });

  it('QCM, numériques, vrai/faux et rangements justes', () => {
    const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : a);
    for (const level of LEVELS) {
      for (const it of tiragesDe(L, 'mcq', level)) {
        const good = num(it.choices[it.answerIndex]!);
        const autres = it.choices.filter((_, i) => i !== it.answerIndex).map(num);
        const q = it.question;
        let m = q.match(/^Lequel de ces nombres est divisible par (\d+) \?$/);
        if (m) {
          const d = Number(m[1]);
          expect(good % d).toBe(0);
          for (const x of autres) expect(x % d).not.toBe(0);
          continue;
        }
        m = q.match(/^Lequel de ces nombres n’est pas un diviseur de (\d+) \?$/);
        if (m) {
          const n = Number(m[1]);
          expect(n % good).not.toBe(0);
          for (const x of autres) expect(n % x).toBe(0);
          continue;
        }
        m = q.match(/^Quel nombre est un (diviseur|multiple) commun à (\d+) et à (\d+) \?$/);
        if (m) {
          const [a, b] = [Number(m[2]), Number(m[3])];
          const ok = (x: number) =>
            m![1] === 'diviseur' ? a % x === 0 && b % x === 0 : x % a === 0 && x % b === 0;
          expect(ok(good)).toBe(true);
          for (const x of autres) expect(ok(x)).toBe(false);
          continue;
        }
        m = q.match(/^Quel est le plus grand diviseur commun à (\d+) et à (\d+) \?$/);
        expect(m, q).not.toBeNull();
        expect(good).toBe(pgcd(Number(m![1]), Number(m![2])));
      }
      for (const it of tiragesDe(L, 'numeric_answer', level)) {
        const p = it.prompt;
        let m = p.match(/^Quel est le multiple de (\d+) juste (après|avant) (.+) \?$/);
        if (m) {
          const d = Number(m[1]);
          const n = num(m[3]!);
          expect(it.answer % d).toBe(0);
          expect(m[2] === 'après' ? it.answer - n : n - it.answer).toBeGreaterThan(0);
          expect(Math.abs(it.answer - n)).toBeLessThan(d);
          continue;
        }
        m = p.match(/^Combien (\d+) a-t-il de diviseurs \?$/);
        if (m) {
          expect(it.answer).toBe(diviseurs(Number(m[1])).length);
          continue;
        }
        m = p.match(/^Quel est le plus petit multiple commun à (\d+) et à (\d+)/);
        if (m) {
          const [a, b] = [Number(m[1]), Number(m[2])];
          expect(it.answer).toBe((a * b) / pgcd(a, b));
          if (level === 'normal') expect(Math.max(a, b)).toBeLessThan(15);
          continue;
        }
        m = p.match(/^Combien y a-t-il de diviseurs communs à (\d+) et à (\d+) \?$/);
        if (m) {
          const [a, b] = [Number(m[1]), Number(m[2])];
          expect(Math.max(a, b)).toBeLessThanOrEqual(30);
          expect(it.answer).toBe(diviseurs(a).filter((d) => b % d === 0).length);
          continue;
        }
        m = p.match(/^Quel est le plus grand diviseur commun à (\d+) et à (\d+) \?$/);
        if (m) {
          expect(it.answer).toBe(pgcd(Number(m[1]), Number(m[2])));
          continue;
        }
        m = p.match(/^J’écris un chiffre à la fin de (\d+) pour obtenir un nombre divisible par 9/);
        expect(m, p).not.toBeNull();
        const solutions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => (Number(m![1]) * 10 + c) % 9 === 0);
        expect(solutions).toEqual([it.answer]);
      }
      for (const it of tiragesDe(L, 'true_false', level)) {
        const s = it.statement;
        let m = s.match(/^(.+) est divisible par (\d+)\.$/);
        if (m) {
          expect(it.answer).toBe(num(m[1]!) % Number(m[2]) === 0);
          continue;
        }
        m = s.match(/^(\d+) est un diviseur de (\d+)\.$/);
        if (m) {
          expect(it.answer).toBe(Number(m[2]) % Number(m[1]) === 0);
          continue;
        }
        m = s.match(/^(\d+) est un multiple de (\d+)\.$/);
        if (m) {
          expect(it.answer).toBe(Number(m[1]) % Number(m[2]) === 0);
          continue;
        }
        m = s.match(/^(\d+) est un diviseur commun à (\d+) et à (\d+)\.$/);
        expect(m, s).not.toBeNull();
        const x = Number(m![1]);
        expect(it.answer).toBe(Number(m![2]) % x === 0 && Number(m![3]) % x === 0);
      }
      for (const it of tiragesDe(L, 'pairing', level))
        for (const { left, right } of it.pairs) {
          if (level === 'facile') {
            const x = num(left);
            const k = x % 10 === 0 ? 0 : x % 5 === 0 ? 1 : x % 2 === 0 ? 2 : 3;
            expect(right).toBe(
              [
                'divisible par 10',
                'divisible par 5, pas par 10',
                'divisible par 2, pas par 10',
                'ni par 2 ni par 5',
              ][k],
            );
          } else if (level === 'normal') expect(diviseurs(Number(left))[1]).toBe(Number(right));
          else {
            const [x, y] = left.split(' et ').map(Number);
            expect(pgcd(x!, y!)).toBe(Number(right));
          }
        }
    }
  });
});

describe('niveaux disjoints', () => {
  it('un même item n’apparaît pas à deux niveaux', () => {
    for (const id of ['CM2.MA.NUM.GRANDS', 'CM2.MA.NUM.COMPARER', 'CM2.MA.NUM.DIVISIBILITE'])
      for (const k of Object.keys(contenu[id]!.gens!)) {
        const par = LEVELS.map((l) => new Set(tirages(id, k as ItemKind, l, 200, 5).map(cle)));
        for (let i = 0; i < 3; i++)
          for (let j = i + 1; j < 3; j++) {
            const communs = [...par[i]!].filter((c) => par[j]!.has(c));
            expect(communs, `${id} ${k} ${LEVELS[i]}/${LEVELS[j]}`).toEqual([]);
          }
      }
  });

  it('le niveau plus loin dépasse le milliard pour les grands nombres', () => {
    for (const k of ['numeric_answer', 'fill_blank', 'oral_answer'] as const)
      for (const it of tirages('CM2.MA.NUM.GRANDS', k, 'plus_loin', 100, 3))
        expect(JSON.stringify(it), it.id).toMatch(/milliard|\d{1,3}(?:\u00a0\d{3}){3}/);
  });
});
