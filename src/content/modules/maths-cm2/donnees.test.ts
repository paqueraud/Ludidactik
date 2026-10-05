/** Données et probabilités CM2 : réponses recalculées indépendamment. */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../schemas';
import { num, tiragesDe } from './testkit';

type G = { type: string; etiquettes: string[]; valeurs: number[]; unite: string };
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const PART: Record<string, number> = {
  'la moitié': 1 / 2,
  'le quart': 1 / 4,
  'les trois quarts': 3 / 4,
  'le tiers': 1 / 3,
  'le sixième': 1 / 6,
  'le huitième': 1 / 8,
};

/** Étiquettes citées dans un texte, dans l'ordre d'apparition (« 8 h » n'est pas trouvé dans « 18 h »). */
function cites(texte: string, etiquettes: string[]): string[] {
  return etiquettes
    .map((e) => ({
      e,
      i: texte.search(
        new RegExp(`(?<![\\p{L}\\d])${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'u'),
      ),
    }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.e);
}

describe('CM2.MA.DON.LIRE', () => {
  const id = 'CM2.MA.DON.LIRE';

  it('numérique : lecture, écart, total, deux étapes, production, diagrammes circulaires', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'numeric_answer', level)) {
        const g = it.meta!.graphique as G;
        const q = it.meta!.question as string;
        const v = (e: string) => g.valeurs[g.etiquettes.indexOf(e)]!;
        const somme = r3(g.valeurs.reduce((a, b) => a + b, 0));
        const lab = cites(q, g.etiquettes);
        let m: RegExpMatchArray | null;
        if (it.meta!.echelle) {
          m = q.match(/barre « (.+) »/)!;
          expect(it.answer * (it.meta!.echelle as number)).toBe(v(m[1]!));
          expect(Number.isInteger(it.answer)).toBe(true);
        } else if ((m = q.match(/cela fait (\d+) élèves\. Combien d’élèves ont répondu en tout/))) {
          const part = q.match(/^(.+?) des élèves/)![1]!.toLowerCase();
          expect(r3(it.answer * PART[part]!)).toBe(Number(m[1]));
          expect(it.answer).toBe(somme);
        } else if (g.type === 'circulaire') {
          m = q.match(/« (.+) »/)!;
          expect(it.answer).toBe(v(m[1]!));
          const part = it.prompt.match(new RegExp(`${m[1]} : ([^,.]+)`))![1]!;
          expect(r3(somme * PART[part]!)).toBe(it.answer);
        } else if (/^On réunit/.test(q)) {
          expect(it.answer).toBe(r3(v(lab[0]!) + v(lab[1]!) - v(lab[2]!)));
          expect(it.answer).toBeGreaterThan(0);
        } else if (/de plus/.test(q)) {
          expect(it.answer).toBe(r3(v(lab[0]!) - v(lab[1]!)));
          expect(it.answer).toBeGreaterThan(0);
        } else if (/l’écart entre/.test(q)) {
          expect(it.answer).toBe(r3(Math.abs(v(lab[0]!) - v(lab[1]!))));
        } else if (/(augmenté|diminué) entre/.test(q)) {
          const d = r3(v(lab[1]!) - v(lab[0]!));
          expect(it.answer).toBe(Math.abs(d));
          expect(d > 0 ? 'augmenté' : 'diminué').toBe(q.match(/augmenté|diminué/)![0]);
        } else if (/ne viennent pas|n’ont pas choisi|ne sont pas des|autres jours/.test(q)) {
          expect(lab.length).toBe(1);
          expect(it.answer).toBe(r3(somme - v(lab[0]!)));
        } else if (/en tout|dans la semaine/.test(q)) {
          expect(it.answer).toBe(somme);
        } else {
          expect(lab.length, q).toBe(1);
          expect(it.answer).toBe(v(lab[0]!));
          expect(level).toBe('facile');
        }
        // les données sont écrites en clair dans l'énoncé
        if (g.type !== 'circulaire' && !it.meta!.echelle && !/cela fait/.test(q))
          for (const x of g.valeurs) expect(it.prompt).toContain(String(x).replace('.', ','));
      }
  });

  it('QCM : extrêmes uniques, plus forte hausse, part du disque, barre fausse', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'mcq', level)) {
        const g = it.meta!.graphique as G;
        const q = it.meta!.question as string;
        const good = it.choices[it.answerIndex]!;
        const v = (e: string) => g.valeurs[g.etiquettes.indexOf(e)]!;
        if (/le plus augmenté/.test(q)) {
          const h = g.valeurs.slice(1).map((x, i) => r3(x - g.valeurs[i]!));
          const k = h.indexOf(Math.max(...h));
          expect(h.filter((x) => x === h[k]).length).toBe(1);
          expect(cites(good, g.etiquettes)).toEqual([g.etiquettes[k], g.etiquettes[k + 1]]);
        } else if (/Quelle part/.test(q)) {
          const e = q.match(/« (.+) »/)![1]!;
          expect(r3(v(e) / g.valeurs.reduce((a, b) => a + b, 0))).toBe(r3(PART[good]!));
          expect(level).not.toBe('facile');
        } else if (/barre est fausse/.test(q)) {
          const juste = it.meta!.tableauJuste as number[];
          const diff = g.etiquettes.filter((_, i) => juste[i] !== g.valeurs[i]);
          expect(diff).toEqual([good]);
          const i = g.etiquettes.indexOf(good);
          expect(Math.abs(g.valeurs[i]! - juste[i]!)).toBeGreaterThanOrEqual(Math.max(10, juste[i]! * 0.1));
        } else {
          const plus = !/moins|basse|petite/.test(q);
          const ext = plus ? Math.max(...g.valeurs) : Math.min(...g.valeurs);
          expect(v(good)).toBe(ext);
          expect(g.valeurs.filter((x) => x === ext).length).toBe(1);
        }
      }
  });

  it('vrai/faux et classements justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(id, 'true_false', level)) {
        const g = it.meta!.graphique as G;
        const q = it.meta!.question as string;
        const v = (e: string) => g.valeurs[g.etiquettes.indexOf(e)]!;
        const tot = r3(g.valeurs.reduce((a, b) => a + b, 0));
        let m: RegExpMatchArray | null;
        if ((m = q.match(/En tout, on a compté (.+?) \p{L}/u))) expect(it.answer).toBe(num(m[1]!) === tot);
        else if ((m = q.match(/^(.+?) des élèves .+ « (.+) »/)))
          expect(it.answer).toBe(r3(v(m[2]!) / tot) === r3(PART[m[1]!.toLowerCase()]!));
        else if ((m = q.match(/de plus de ([\d,]+)/))) {
          const [a, b] = cites(q, g.etiquettes);
          expect(it.answer).toBe(Math.abs(v(b!) - v(a!)) > num(m[1]!));
          expect(level).toBe('plus_loin');
        } else {
          const [a, b] = cites(q, g.etiquettes);
          expect(it.answer, q).toBe(v(a!) > v(b!));
          expect(level).not.toBe('plus_loin');
        }
      }
      for (const it of tiragesDe(id, 'classification', level)) {
        const g = it.meta!.graphique as G;
        if (level === 'plus_loin') {
          expect(it.categories).toEqual(['en hausse', 'stable', 'en baisse']);
          for (const e of it.elements) {
            const [a, b] = cites(e.label, g.etiquettes);
            const d = v2(g, b!) - v2(g, a!);
            expect(e.category).toBe(d > 0 ? 0 : d === 0 ? 1 : 2);
          }
        } else {
          const seuil = num(it.categories[0]!.match(/^([\d  ,]+)/)![1]!);
          for (const e of it.elements)
            expect(e.category).toBe(g.valeurs[g.etiquettes.indexOf(e.label)]! >= seuil ? 0 : 1);
        }
      }
    }
  });

  it('valeurs réalistes : au moins 5 par catégorie dans les enquêtes', () => {
    for (const level of LEVELS)
      for (const kind of ['numeric_answer', 'mcq', 'true_false', 'classification'] as const)
        for (const it of tiragesDe(id, kind, level)) {
          const g = it.meta!.graphique as G;
          if (g.type === 'barres' || g.type === 'tableau')
            if (!/banquise/.test(JSON.stringify(it.meta)))
              for (const x of g.valeurs) expect(x).toBeGreaterThanOrEqual(5);
        }
  });
});
const v2 = (g: G, e: string) => g.valeurs[g.etiquettes.indexOf(e)]!;

/* ------------------------------------------------------------------ */
/* Probabilités : on reconstruit les issues à partir de l'énoncé       */
/* ------------------------------------------------------------------ */

const DE = ['1', '2', '3', '4', '5', '6'];
/** Issues équiprobables lues dans l'énoncé (indépendamment du générateur). */
function issues(texte: string): string[][] {
  if (/deux dés/.test(texte)) return DE.flatMap((a) => DE.map((b) => [a, b]));
  if (/trois pièces/.test(texte))
    return ['P', 'F'].flatMap((a) => ['P', 'F'].flatMap((b) => ['P', 'F'].map((c) => [a, b, c])));
  if (/deux pièces/.test(texte)) return ['pile', 'face'].flatMap((a) => ['pile', 'face'].map((b) => [a, b]));
  if (/une pièce de monnaie, puis un dé/.test(texte))
    return ['pile', 'face'].flatMap((a) => DE.map((b) => [a, b]));
  if (/un dé à 6 faces/.test(texte)) return DE.map((d) => [d]);
  if (/une pièce de monnaie/.test(texte)) return [['pile'], ['face']];
  if (/10 cartes/.test(texte)) return Array.from({ length: 10 }, (_, i) => [String(i + 1)]);
  const out: string[][] = [];
  for (const m of texte.matchAll(/(\d+) (?:billes?|parts?) (\p{L}+?)s?(?=[ ,.])/gu))
    if (m[2] !== 'égale') for (let k = 0; k < Number(m[1]); k++) out.push([m[2]!]);
  if (/roue est partagée en (\d+)/.test(texte))
    expect(out.length).toBe(Number(texte.match(/partagée en (\d+)/)![1]));
  expect(out.length, texte).toBeGreaterThan(0);
  return out;
}

/** Prédicat d'un évènement, écrit indépendamment à partir de son texte. */
function predicat(ev: string): (i: string[]) => boolean {
  const n = (i: string[]) => i.map(Number);
  const s = (i: string[]) => n(i).reduce((a, b) => a + b, 0);
  const piles = (i: string[]) => i.filter((x) => x === 'pile' || x === 'P').length;
  const e = ev.toLowerCase();
  let m: RegExpMatchArray | null;
  if ((m = e.match(/somme égale à (\d+)/))) return (i) => s(i) === Number(m![1]);
  if ((m = e.match(/somme plus grande que (\d+)/))) return (i) => s(i) > Number(m![1]);
  if ((m = e.match(/somme plus petite que (\d+)/))) return (i) => s(i) < Number(m![1]);
  if (/un double/.test(e)) return (i) => i[0] === i[1];
  if (/quatre fois pile|trois fois pile/.test(e)) return (i) => piles(i) === (/quatre/.test(e) ? 4 : 3);
  if (/exactement deux fois pile/.test(e)) return (i) => piles(i) === 2;
  if (/au plus un pile/.test(e)) return (i) => piles(i) <= 1;
  if (/au moins un pile/.test(e)) return (i) => piles(i) >= 1;
  if (/deux fois pile/.test(e)) return (i) => piles(i) === 2;
  if (/deux fois face/.test(e)) return (i) => piles(i) === 0 && i.length === 2;
  if (/un pile et un face/.test(e)) return (i) => piles(i) === 1 && i.length === 2;
  if (/deux résultats|pile ou face/.test(e)) return () => true;
  if (/à la fois pile et face/.test(e)) return () => false;
  if ((m = e.match(/^obtenir (pile|face) et (\d+)$/))) return (i) => i[0] === m![1] && i[1] === m![2];
  if ((m = e.match(/^obtenir (pile|face) et un nombre pair$/)))
    return (i) => i[0] === m![1] && Number(i[1]) % 2 === 0;
  if ((m = e.match(/^obtenir (pile|face) et un nombre plus petit que (\d+)$/)))
    return (i) => i[0] === m![1] && Number(i[1]) < Number(m![2]);
  if ((m = e.match(/^obtenir (pile|face)$/))) return (i) => i[0] === m![1];
  // un seul nombre (dé, cartes) ou le dé d'une expérience pièce + dé
  const x = (i: string[]) => Number(i[i.length - 1]);
  if ((m = e.match(/(?:obtenir|tirer) (?:le nombre )?(\d+)$/)))
    return (i) => x(i) === Number(m![1]) && i.length >= 1;
  if (/nombre pair/.test(e)) return (i) => x(i) % 2 === 0;
  if (/nombre impair/.test(e)) return (i) => x(i) % 2 === 1;
  if ((m = e.match(/multiple de (\d+)/))) return (i) => x(i) % Number(m![1]) === 0;
  if ((m = e.match(/plus petit que (\d+)/))) return (i) => x(i) < Number(m![1]);
  if ((m = e.match(/plus grand que (\d+)/))) return (i) => x(i) > Number(m![1]);
  if ((m = e.match(/(\d+) ou (\d+)$/))) return (i) => [Number(m![1]), Number(m![2])].includes(x(i));
  if ((m = e.match(/(?:entre|de) (\d+) (?:et|à) (\d+)/)))
    return (i) => x(i) >= Number(m![1]) && x(i) <= Number(m![2]);
  if (/deux chiffres/.test(e)) return (i) => i[0]!.length === 2;
  // couleurs (sac ou roue)
  if ((m = e.match(/qui n’est pas (\p{L}+)/u))) return (i) => i[0] !== m![1];
  if ((m = e.match(/(?:bille|part) (\p{L}+) ou (\p{L}+)$/u))) return (i) => i[0] === m![1] || i[0] === m![2];
  if ((m = e.match(/(?:bille|part) (\p{L}+)$/u))) return (i) => i[0] === m![1];
  throw new Error(`évènement inconnu : ${ev}`);
}
const compter = (texte: string, ev: string) => {
  const is = issues(texte);
  return [is.filter(predicat(ev)).length, is.length] as const;
};
const evDe = (s: string) =>
  s.match(/« (.+?) »/)?.[1] ?? s.match(/(?:d’|de )((?:obtenir|tirer|tomber).+?)(?: \?|\.|$| s’écrit)/)![1]!;

describe('CM2.MA.PROBA', () => {
  const id = 'CM2.MA.PROBA';
  it('les expériences connues sont bien dénombrées', () => {
    expect(compter('On lance deux dés à 6 faces', 'obtenir une somme égale à 7')).toEqual([6, 36]);
    expect(compter('On lance deux pièces', 'obtenir au moins un pile')).toEqual([3, 4]);
    expect(compter('On lance trois pièces', 'obtenir exactement deux fois pile')).toEqual([3, 8]);
    expect(compter('Dans un sac, il y a 5 billes rouges et 1 bille bleue.', 'tirer une bille rouge')).toEqual(
      [5, 6],
    );
  });

  it('classements : catégories justes (impossible, peu probable, probable, certain)', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'classification', level))
        for (const e of it.elements) {
          const [a, b] = compter(it.prompt, e.label);
          if (level === 'facile') expect(e.category, e.label).toBe(a === 0 ? 0 : a === b ? 2 : 1);
          else {
            expect(it.categories).toEqual(['impossible', 'peu probable', 'probable', 'certain']);
            const c = a === 0 ? 0 : a === b ? 3 : 3 * a <= b ? 1 : 3 * a >= 2 * b ? 2 : -1;
            expect(c, `${it.prompt} ${e.label}`).toBe(e.category);
          }
        }
  });

  it('« a chances sur b », comparaisons, fractions et vocabulaire justes', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe(id, 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        const q = it.question;
        let m: RegExpMatchArray | null;
        if (/c’est…$/.test(q)) {
          const [a, b] = compter(q, q.match(/« (.+) »/)![1]!);
          expect(good).toBe(a === 0 ? 'impossible' : a === b ? 'certain' : 'possible mais pas certain');
        } else if (/plus probable/.test(q)) {
          const counts = it.choices.map((c) => compter(q, c)[0]);
          expect(compter(q, good)[0]).toBe(Math.max(...counts));
          expect(counts.filter((c) => c === Math.max(...counts)).length).toBe(1);
        } else if ((m = q.match(/1 bille rouge et (\d+) billes bleues/))) {
          expect(good).toBe(`1 chance sur ${Number(m[1]) + 1}`);
        } else if (/Que peut-on dire/.test(q)) {
          expect(good).toMatch(/toujours 1 chance sur (6|2)/);
        } else if (/Quelle fraction/.test(q)) {
          const [a, b] = compter(q, evDe(q.replace(/.*probabilité /, '')));
          expect(good).toBe(`${a}/${b}`);
          for (const c of it.choices)
            if (c !== good) expect(num(c.split('/')[0]!) / num(c.split('/')[1]!)).not.toBe(a / b);
        } else {
          const [a, b] = compter(q, evDe(q.replace(/.*Combien de chances a-t-on /, '')));
          expect(good).toBe(`${a} chance${a > 1 ? 's' : ''} sur ${b}`);
          for (const c of it.choices)
            if (c !== good) {
              const x = c.match(/(\d+) chances? sur (\d+)/)!;
              expect(Number(x[1]) / Number(x[2])).not.toBe(a / b);
            }
        }
      }
  });

  it('numérique et vrai/faux : dénombrements justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe(id, 'numeric_answer', level)) {
        const p = it.prompt;
        if (/issues possibles/.test(p)) expect(it.answer).toBe(issues(p).length);
        else {
          const ev = evDe(
            p.replace(/^.*?(Combien d’issues permettent |chances? sur \d+ |La probabilité )/, ''),
          );
          const [a, b] = compter(p, ev);
          expect(it.answer, p).toBe(a);
          const den = p.match(/sur (\d+)|…\/(\d+)/);
          if (den) expect(Number(den[1] ?? den[2])).toBe(b);
        }
      }
      for (const it of tiragesDe(id, 'true_false', level)) {
        const s = it.statement;
        let m: RegExpMatchArray | null;
        if ((m = s.match(/« (.+) » est (impossible|possible mais pas certain|certain)\.$/))) {
          const [a, b] = compter(s, m[1]!);
          expect(it.answer).toBe(
            (a === 0 ? 'impossible' : a === b ? 'certain' : 'possible mais pas certain') === m[2],
          );
        } else if (/trois fois de suite/.test(s)) {
          expect(it.answer).toBe(/toujours 1 chance sur 6/.test(s));
        } else {
          m = s.match(/On a (\d+) chances? sur (\d+) (?:d’|de )(.+)\.$/)!;
          const [a, b] = compter(s, m[3]!);
          expect(Number(m[2])).toBe(b);
          expect(it.answer).toBe(Number(m[1]) === a);
        }
      }
    }
  });
});
