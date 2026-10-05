import { describe, expect, it } from 'vitest';
import ce1 from '@data/curriculum/ce1.json';
import { parseNumber } from '@/engine/answer';
import { graphiesNombre, nombreEnLettres } from '@/engine/nombres';
import { createRng } from '@/engine/rng';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import { type Item, type ItemKind, type Lesson, LEVELS, type Level, checkItem } from '../../schemas';
import { CONTENU } from '../index';
import { contenu } from './index';
import { estPatronDeCube } from './geometrie';

const lessons = (ce1 as { lecons: Lesson[] }).lecons;
const mesLecons = lessons.filter((l) => l.id.startsWith('CE1.MA.') && !l.id.startsWith('CE1.MA.CM.'));
const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
const N = 200;

/** Tous les nombres écrits dans les textes affichés d'un item (« 1 000 » compte pour mille). */
function nombresAffiches(item: Item): number[] {
  const textes: string[] = [item.explication];
  const add = (...s: (string | undefined)[]) => s.forEach((x) => x && textes.push(x));
  switch (item.kind) {
    case 'numeric_answer':
      add(item.prompt);
      break;
    case 'mcq':
      add(item.question, ...item.choices);
      break;
    case 'true_false':
      add(item.statement);
      break;
    case 'fill_blank':
      add(item.sentence, item.answer, ...(item.choices ?? []));
      break;
    case 'ordering':
      add(item.prompt, ...item.elements);
      break;
    case 'classification':
      add(item.prompt, ...item.elements.map((e) => e.label));
      break;
    case 'pairing':
      add(item.prompt, ...item.pairs.flatMap((p) => [p.left, p.right]));
      break;
    case 'number_line':
      add(item.prompt, item.display);
      break;
    case 'bar_model':
      add(item.statement, item.question, item.operation);
      break;
    case 'clock':
    case 'money':
    case 'geometry_shape':
    case 'visual_fraction':
    case 'oral_answer':
      add(item.prompt);
      break;
  }
  return textes.flatMap((t) => (t.match(/\d{1,3}(?: \d{3})+|\d+/g) ?? []).map((s) => parseNumber(s)!));
}

/** Ce qui définit le contenu d'un item (même id ⇒ même question et même réponse). */
function cle(item: Item): string {
  switch (item.kind) {
    case 'numeric_answer':
      return `${item.prompt}=${item.answer}`;
    case 'mcq':
      return `${item.question}=${item.choices[item.answerIndex]}`;
    case 'true_false':
      return `${item.statement}=${item.answer}`;
    case 'fill_blank':
      return `${item.sentence}=${item.answer}`;
    case 'ordering':
      return `${item.prompt}=${item.elements.join('|')}`;
    case 'classification':
      return `${item.prompt}=${item.elements
        .map((e) => `${e.label}:${e.category}`)
        .sort()
        .join('|')}`;
    case 'pairing':
      return item.pairs
        .map((p) => `${p.left}:${p.right}`)
        .sort()
        .join('|');
    case 'number_line':
      return `${item.prompt}=${item.target}[${item.min},${item.max},${item.step}]`;
    case 'visual_fraction':
      return `${item.prompt}=${item.numerator}/${item.denominator}/${item.task}/${JSON.stringify(item.other)}`;
    case 'clock':
      return `${item.prompt}=${item.task}${item.hours}:${item.minutes}:${item.answerText}`;
    case 'money':
      return `${item.prompt}=${item.priceCents}/${item.givenCents}`;
    case 'geometry_shape':
      return `${item.prompt}=${item.shape}:${item.answer}:${JSON.stringify(item.grid)}`;
    case 'oral_answer':
      return `${item.prompt}=${item.answer}`;
    case 'bar_model':
      return `${item.statement}${item.question}=${item.answer}`;
    default:
      return item.id;
  }
}

/** Tire `n` items d'une leçon pour un type et un niveau. */
function tirages(lessonId: string, kind: ItemKind, level: Level, n = N, seed = 1): Item[] {
  const lesson = mesLecons.find((l) => l.id === lessonId)!;
  const gen = contenu[lessonId]!.gens![kind]!;
  const rng = createRng(seed);
  return Array.from({ length: n }, () => gen(level, rng, ctxOf(lesson)));
}

const BORNE: Record<Level, number> = { facile: 1000, normal: 1000, plus_loin: 10000 };

describe('maths CE1 — couverture des leçons', () => {
  it('chaque leçon CE1.MA.* a du contenu (au moins 2 types d’items natifs)', () => {
    const toutes = lessons.filter((l) => l.id.startsWith('CE1.MA.'));
    expect(toutes.length).toBeGreaterThan(30);
    for (const l of toutes) {
      const c = CONTENU[l.id];
      expect(c, l.id).toBeDefined();
      if (!l.id.startsWith('CE1.MA.CM.')) {
        const kinds = [...Object.keys(c?.gens ?? {}), ...Object.keys(c?.pools ?? {})];
        expect(kinds.length, l.id).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('le curriculum déclare exactement les types produits, un rappel et un générateur', () => {
    for (const l of mesLecons) {
      const kinds = Object.keys(contenu[l.id]?.gens ?? {}).sort();
      expect([...l.itemKinds].sort(), l.id).toEqual(kinds);
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
      expect(l.source.kind === 'generator' && l.source.generator.startsWith('maths-ce1/'), l.id).toBe(true);
    }
  });

  it('le module ne déclare que des leçons existantes', () => {
    for (const id of Object.keys(contenu))
      expect(
        mesLecons.some((l) => l.id === id),
        id,
      ).toBe(true);
  });
});

describe('maths CE1 — validité de tous les items', () => {
  for (const lesson of mesLecons) {
    for (const [kind] of Object.entries(contenu[lesson.id]?.gens ?? {})) {
      for (const level of LEVELS) {
        it(`${lesson.id} · ${kind} · ${level}`, () => {
          const vus = new Map<string, string>();
          const items = tirages(lesson.id, kind as ItemKind, level, N, 7);
          for (const item of items) {
            expect(checkItem(item), `${item.id} ${JSON.stringify(item)}`).toEqual([]);
            expect(item.kind).toBe(kind);
            expect(item.lessonId).toBe(lesson.id);
            expect(item.explication.length).toBeGreaterThan(8);
            expect(item.explication).not.toMatch(/undefined|NaN/);
            expect(JSON.stringify(item)).not.toMatch(/undefined|NaN|\[object/);
            if (item.difficulty !== undefined) expect(item.difficulty).toBeGreaterThanOrEqual(0);
            // Bornes du CE1 : ≤ 1 000 (≤ 10 000 au niveau « plus loin »)
            for (const x of nombresAffiches(item))
              expect(x, `${item.id} : ${x}`).toBeLessThanOrEqual(BORNE[level]);
            if (item.kind === 'numeric_answer') {
              expect(item.answer).toBeGreaterThanOrEqual(0);
              expect(item.answer).toBeLessThanOrEqual(BORNE[level]);
            }
            // Même id ⇒ même question et même réponse
            const k = cle(item);
            if (vus.has(item.id)) expect(vus.get(item.id), item.id).toBe(k);
            vus.set(item.id, k);
          }
          // De la variété : pas toujours le même item
          expect(new Set(items.map(cle)).size, 'variété').toBeGreaterThan(1);
        });
      }
    }
  }
});

/* ------------------------------------------------------------------ */
/* Réponses recalculées indépendamment                                 */
/* ------------------------------------------------------------------ */

const num = (s: string) => parseNumber(s.trim())!;
const evalOp = (s: string): number | null => {
  const m = s.match(/^([\d\s ]+)\s([+−×])\s([\d\s ]+?)(?:\s\+\s([\d\s ]+?))?(?:\s\+\s([\d\s ]+))?$/);
  if (!m) return null;
  const a = num(m[1]!);
  const b = num(m[3]!);
  const base = m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
  return base + (m[4] ? num(m[4]) : 0) + (m[5] ? num(m[5]) : 0);
};
const symb = (a: number, b: number) => (a < b ? '<' : a > b ? '>' : '=');
const fracVal = (s: string) => {
  const [a, b] = s.split('/').map(Number);
  return a! / b!;
};

describe('maths CE1 — réponses justes', () => {
  it('calcul posé : le résultat est celui de l’opération', () => {
    for (const id of ['CE1.MA.CP.ADD', 'CE1.MA.CP.SOUS', 'CE1.MA.CP.MULT_SENS'])
      for (const level of LEVELS)
        for (const it of tirages(id, 'numeric_answer', level)) {
          if (it.kind !== 'numeric_answer') continue;
          const v = evalOp(it.prompt.replace(/ = .*$/, ''));
          if (v !== null) expect(v, it.prompt).toBe(it.answer);
          const p = it.meta?.posee as { a: number; b: number; op: string } | undefined;
          if (p) expect(p.op === '+' ? p.a + p.b : p.a - p.b).toBe(it.answer);
        }
  });

  it('soustraction posée : facile sans retenue, normal avec une retenue', () => {
    const cassages = (a: number, b: number) => {
      let c = 0;
      let e = 0;
      for (let k = 0; k < 4; k++) {
        const da = (Math.floor(a / 10 ** k) % 10) - e;
        const db = Math.floor(b / 10 ** k) % 10;
        e = da < db ? 1 : 0;
        c += e;
      }
      return c;
    };
    for (const it of tirages('CE1.MA.CP.SOUS', 'numeric_answer', 'facile')) {
      const p = it.meta!.posee as { a: number; b: number };
      expect(cassages(p.a, p.b)).toBe(0);
    }
    for (const it of tirages('CE1.MA.CP.SOUS', 'numeric_answer', 'normal')) {
      const p = it.meta!.posee as { a: number; b: number };
      expect(cassages(p.a, p.b)).toBe(1);
    }
  });

  it('nombres en lettres : graphies justes, aucun distracteur acceptable', () => {
    for (const level of LEVELS) {
      for (const it of tirages('CE1.MA.NUM.ECRIRE', 'fill_blank', level)) {
        if (it.kind !== 'fill_blank') continue;
        const n = num(it.sentence.split(' s’écrit')[0]!);
        expect(it.answer).toBe(nombreEnLettres(n));
        for (const c of it.choices ?? []) if (c !== it.answer) expect(graphiesNombre(n)).not.toContain(c);
      }
      for (const it of tirages('CE1.MA.NUM.ECRIRE', 'mcq', level)) {
        if (it.kind !== 'mcq') continue;
        const good = it.choices[it.answerIndex]!;
        const m = it.question.match(/^Comment s’écrit (.+) en lettres/);
        if (m) {
          const n = num(m[1]!);
          expect(good).toBe(nombreEnLettres(n));
          for (const c of it.choices) if (c !== good) expect(graphiesNombre(n)).not.toContain(c);
        } else {
          const l = it.question.match(/« (.+) »/)![1]!;
          expect(graphiesNombre(num(good))).toContain(l);
        }
      }
      for (const it of tirages('CE1.MA.NUM.ECRIRE', 'numeric_answer', level)) {
        if (it.kind !== 'numeric_answer') continue;
        expect(it.meta?.dictee).toBe(true);
        expect(it.spoken).toBe(String(it.answer));
      }
    }
  });

  it('comparer : le bon signe, les rangements sont triés', () => {
    for (const level of LEVELS) {
      for (const it of tirages('CE1.MA.NUM.COMPARER', 'mcq', level)) {
        if (it.kind !== 'mcq') continue;
        const g = it.meta!.gauche as string;
        const d = it.meta!.droite as string;
        if (/^[\d ]+$/.test(g) && /^[\d ]+$/.test(d))
          expect(it.choices[it.answerIndex]).toBe(symb(num(g), num(d)));
      }
      for (const it of tirages('CE1.MA.NUM.COMPARER', 'ordering', level)) {
        if (it.kind !== 'ordering') continue;
        const v = it.elements.map(num);
        const sorted = [...v].sort((a, b) => (it.mode === 'croissant' ? a - b : b - a));
        expect(v).toEqual(sorted);
      }
    }
  });

  it('parité : classement et affirmations justes', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.NUM.PARITE', 'classification', level)) {
        if (it.kind !== 'classification') continue;
        for (const e of it.elements) {
          const v = e.label.includes('+') ? (evalOp(e.label) ?? NaN) : num(e.label);
          expect(e.category, e.label).toBe(v % 2 === 0 ? 0 : 1);
        }
      }
  });

  it('droite graduée : la cible est dans la droite, sur la bonne graduation', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.NUM.DROITE', 'number_line', level)) {
        if (it.kind !== 'number_line') continue;
        expect(num(it.display)).toBe(it.target);
        const pas = it.step / (it.subdivisions ?? 1);
        expect(it.tolerance).toBeLessThan(pas);
      }
  });

  it('fractions : dénominateurs du CE1, fractions ≤ 1 sauf au niveau plus loin', () => {
    for (const id of [
      'CE1.MA.FRAC.UNITAIRE',
      'CE1.MA.FRAC.NONUNIT',
      'CE1.MA.FRAC.COMPARER',
      'CE1.MA.FRAC.ADD',
    ])
      for (const level of LEVELS)
        for (const it of tirages(id, 'visual_fraction', level)) {
          if (it.kind !== 'visual_fraction') continue;
          expect([2, 3, 4, 5, 6, 8, 10]).toContain(it.denominator);
          if (level !== 'plus_loin') expect(it.numerator).toBeLessThanOrEqual(it.denominator);
          if (it.other)
            expect(it.numerator * it.other.denominator).not.toBe(it.other.numerator * it.denominator);
        }
  });

  it('fractions : comparaisons et sommes recalculées', () => {
    for (const level of LEVELS) {
      for (const it of tirages('CE1.MA.FRAC.COMPARER', 'mcq', level)) {
        if (it.kind !== 'mcq') continue;
        const g = it.meta!.gauche as string;
        const d = it.meta!.droite as string;
        expect(it.choices[it.answerIndex]).toBe(symb(fracVal(g), d === '1' ? 1 : fracVal(d)));
      }
      for (const it of tirages('CE1.MA.FRAC.COMPARER', 'ordering', level)) {
        if (it.kind !== 'ordering') continue;
        const v = it.elements.map(fracVal);
        expect(v).toEqual([...v].sort((a, b) => a - b));
      }
      for (const it of tirages('CE1.MA.FRAC.ADD', 'numeric_answer', level)) {
        if (it.kind !== 'numeric_answer') continue;
        const termes = [...it.prompt.matchAll(/(\d+)\/(\d+)/g)].map((m) => Number(m[1]));
        const signes = [...it.prompt.matchAll(/ ([+−]) /g)].map((m) => m[1]);
        const d = Number(it.prompt.match(/…\/(\d+)/)![1]);
        if (it.prompt.endsWith('= 1')) expect(termes[0]! + it.answer).toBe(d);
        else {
          const r = termes.reduce((s, t, i) => (i === 0 ? t : signes[i - 1] === '+' ? s + t : s - t), 0);
          expect(r).toBe(it.answer);
        }
        expect(it.answer).toBeLessThanOrEqual(d);
      }
      for (const it of tirages('CE1.MA.FRAC.ADD', 'number_line', level)) {
        if (it.kind !== 'number_line') continue;
        expect(it.target).toBeLessThanOrEqual(1);
      }
    }
  });

  it('problèmes : la réponse figure dans l’opération et le schéma est cohérent', () => {
    for (const id of [
      'CE1.MA.PB.ADD_PT',
      'CE1.MA.PB.COMPAR',
      'CE1.MA.PB.2ETAPES',
      'CE1.MA.PB.MULT',
      'CE1.MA.PB.MIXTES',
    ])
      for (const level of LEVELS)
        for (const it of tirages(id, 'bar_model', level)) {
          if (it.kind !== 'bar_model') continue;
          const rep = it.unit === '€' ? String(it.answer).replace('.', ',') : String(it.answer);
          expect(it.operation.replace(/ /g, ''), it.statement).toContain(rep);
          expect(it.answer).toBeGreaterThan(0);
          // Une seule barre avec total connu : total = somme des parties connues + réponse
          if (
            it.bars.length === 1 &&
            typeof it.total === 'number' &&
            (it.structure === 'parties-tout' || it.structure === 'transformation')
          ) {
            const connus = it.bars[0]!.segments.reduce((s, x) => s + (x.value ?? 0), 0);
            expect(connus + it.answer).toBeCloseTo(it.total);
          }
          if (
            it.bars.length === 1 &&
            it.total === null &&
            (it.structure === 'parties-tout' || it.structure === 'transformation')
          ) {
            expect(it.bars[0]!.segments.reduce((s, x) => s + (x.value ?? 0), 0)).toBe(it.answer);
          }
          if (it.unit === '€')
            expect(Math.round(it.answer * 100) % 10 !== 0 || Math.round(it.answer * 100) % 100 === 0).toBe(
              true,
            );
        }
  });

  it('monnaie : on rend sur une somme plus grande, montants ≤ 100 €', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.GM.MONNAIE', 'money', level)) {
        if (it.kind !== 'money') continue;
        expect(it.priceCents).toBeLessThanOrEqual(10000);
        if (level === 'facile') expect(it.priceCents % 100).toBe(0);
        if (it.task === 'rendre') {
          expect(it.givenCents!).toBeGreaterThan(it.priceCents);
          expect(it.denominations.every((d) => d < it.givenCents!)).toBe(true);
        }
      }
  });

  it('heure : l’heure de fin est juste, les heures pile au niveau facile', () => {
    const lire = (s: string) => {
      const m = s.match(/^(\d+) h(?: (\d+))?$/)!;
      return Number(m[1]) * 60 + Number(m[2] ?? 0);
    };
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.GM.TEMPS', 'clock', level)) {
        if (it.kind !== 'clock') continue;
        if (level === 'facile') expect(it.minutes).toBe(0);
        if (level === 'normal') expect([0, 15, 30, 45]).toContain(it.minutes);
        const debut = it.hours * 60 + it.minutes;
        expect(lire(it.answerText)).toBe(it.task === 'duree' ? debut + it.durationMinutes! : debut);
        expect(lire(it.answerText)).toBeLessThan(24 * 60);
      }
  });

  it('longueurs et masses : rangements triés', () => {
    const cm = (s: string) => {
      const m = s.match(/^(?:(\d+) m)? ?(?:(\d+) cm)?$/)!;
      return Number(m[1] ?? 0) * 100 + Number(m[2] ?? 0);
    };
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.GM.LONGUEURS', 'ordering', level)) {
        if (it.kind !== 'ordering') continue;
        const v = it.elements.map(cm);
        expect(v).toEqual([...v].sort((a, b) => a - b));
      }
  });

  it('symétrie : la solution est le symétrique exact, du bon côté de l’axe', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.GEO.SYMETRIE', 'geometry_shape', level)) {
        if (it.kind !== 'geometry_shape') continue;
        const g = it.grid!;
        const miroir = ([x, y]: [number, number]): [number, number] =>
          g.axis === 'vertical'
            ? [g.cols - 1 - x, y]
            : g.axis === 'horizontal'
              ? [x, g.rows - 1 - y]
              : [y, x];
        const sol = new Set(g.cells.map(miroir).map((c) => c.join(',')));
        expect(new Set(it.answer.split(';'))).toEqual(sol);
        for (const c of g.cells) expect(sol.has(c.join(','))).toBe(false);
        if (level === 'facile') expect(g.axis).toBe('vertical');
        if (level === 'normal') expect(['vertical', 'horizontal']).toContain(g.axis);
      }
  });

  it('patrons : les 11 patrons du cube sont reconnus', () => {
    const croix: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
      [1, 3],
    ];
    const bloc: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ];
    expect(estPatronDeCube(croix)).toBe(true);
    expect(estPatronDeCube(bloc)).toBe(false);
    const vus = new Map<string, boolean>();
    for (const it of tirages('CE1.MA.GEO.SOLIDES', 'geometry_shape', 'plus_loin', 600))
      if (it.kind === 'geometry_shape' && it.task === 'patron')
        vus.set(JSON.stringify(it.grid!.cells), it.answer === 'oui');
    expect([...vus.values()].filter(Boolean).length).toBe(11);
    expect([...vus.values()].filter((x) => !x).length).toBeGreaterThanOrEqual(4);
  });

  it('robot : le programme proposé mène au trésor sans obstacle (≤ 15 instructions, ≤ 4 virages en normal)', () => {
    const DX: Record<string, [number, number]> = { '↑': [0, -1], '→': [1, 0], '↓': [0, 1], '←': [-1, 0] };
    const ORIENT = ['haut', 'droite', 'bas', 'gauche'];
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.GEO.REPERAGE', 'geometry_shape', level)) {
        if (it.kind !== 'geometry_shape') continue;
        const r = it.meta!.robot as {
          cols: number;
          rows: number;
          depart: [number, number];
          cible: [number, number];
          obstacles: [number, number][];
          relatif: boolean;
          orientation: string;
        };
        let [x, y] = r.depart;
        let d = ORIENT.indexOf(r.orientation);
        const prog = it.answer.split(' ');
        for (const p of prog) {
          if (p === 'D') d = (d + 1) % 4;
          else if (p === 'G') d = (d + 3) % 4;
          else {
            const [dx, dy] = p === 'A' ? Object.values(DX)[[0, 1, 2, 3].indexOf(d)]! : DX[p]!;
            x += dx;
            y += dy;
          }
          expect(x >= 0 && y >= 0 && x < r.cols && y < r.rows).toBe(true);
          expect(r.obstacles.some(([a, b]) => a === x && b === y)).toBe(false);
        }
        expect([x, y]).toEqual(r.cible);
        if (level === 'normal') {
          expect(prog.length).toBeLessThanOrEqual(15);
          expect(prog.filter((p) => p === 'D' || p === 'G').length).toBeLessThanOrEqual(4);
        }
      }
  });

  it('données : la réponse la plus (ou moins) choisie est unique et juste', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.MA.DON.LIRE', 'mcq', level)) {
        if (it.kind !== 'mcq') continue;
        const g = it.meta!.graphique as { etiquettes: string[]; valeurs: number[] };
        expect(new Set(g.valeurs).size).toBe(g.valeurs.length);
        const v = g.valeurs[g.etiquettes.indexOf(it.choices[it.answerIndex]!)]!;
        expect([Math.max(...g.valeurs), Math.min(...g.valeurs)]).toContain(v);
      }
  });

  it('est reproductible avec la même graine', () => {
    for (const l of mesLecons)
      for (const k of Object.keys(contenu[l.id]!.gens!)) {
        const a = tirages(l.id, k as ItemKind, 'normal', 3, 99);
        const b = tirages(l.id, k as ItemKind, 'normal', 3, 99);
        expect(a).toEqual(b);
      }
  });
});
