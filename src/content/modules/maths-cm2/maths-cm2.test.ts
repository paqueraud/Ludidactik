/**
 * Tests communs à toutes les leçons du module « maths-cm2 » : couverture, cohérence avec le curriculum,
 * validité de chaque item (≈ 200 tirages par leçon × type × niveau), bornes du CM2, identifiants stables.
 * Les réponses sont recalculées indépendamment dans les tests de chaque domaine (`<domaine>.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { type ItemKind, LEVELS, type Level, checkItem } from '../../schemas';
import { CONTENU } from '../index';
import { contenu } from './index';
import { cle, lessons, mesLecons, N, nombresAffiches, textesAffiches, tirages } from './testkit';
import { denominateurOk } from './util';

/** Champ numérique du CM2 : entiers ≤ 999 999 999 ; les milliards (6e) seulement en « plus loin » des grands nombres. */
const borne = (lessonId: string, level: Level) =>
  level === 'plus_loin' && /^CM2\.MA\.NUM\.(GRANDS|COMPARER)$/.test(lessonId) ? 999_999_999_999 : 999_999_999;

describe('maths CM2 — couverture des leçons', () => {
  it('chaque leçon CM2.MA.* a du contenu (au moins 2 types d’items natifs hors calcul mental)', () => {
    const toutes = lessons.filter((l) => l.id.startsWith('CM2.MA.'));
    expect(toutes.length).toBeGreaterThan(40);
    for (const l of toutes) {
      const c = CONTENU[l.id];
      expect(c, l.id).toBeDefined();
      if (!l.id.startsWith('CM2.MA.CM.')) {
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
      expect(l.source.kind === 'generator' && l.source.generator.startsWith('maths-cm2/'), l.id).toBe(true);
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

describe('maths CM2 — validité de tous les items', () => {
  for (const lesson of mesLecons) {
    for (const [kind] of Object.entries(contenu[lesson.id]?.gens ?? {})) {
      for (const level of LEVELS) {
        it(`${lesson.id} · ${kind} · ${level}`, () => {
          const vus = new Map<string, string>();
          const items = tirages(lesson.id, kind as ItemKind, level, N, 7);
          for (const item of items) {
            const json = JSON.stringify(item);
            expect(checkItem(item), `${item.id} ${json}`).toEqual([]);
            expect(item.kind).toBe(kind);
            expect(item.lessonId).toBe(lesson.id);
            expect(item.explication.length).toBeGreaterThan(8);
            expect(json, item.id).not.toMatch(/undefined|NaN|Infinity|\[object|TODO/);
            if (item.difficulty !== undefined) expect(item.difficulty).toBeGreaterThanOrEqual(0);
            // Bornes du CM2 : entiers ≤ 999 999 999, décimaux au plus au millième, dénominateurs ≤ 60 (ou 100, 1 000)
            for (const x of nombresAffiches(item))
              expect(x, `${item.id} : ${x}`).toBeLessThanOrEqual(borne(lesson.id, level));
            for (const t of textesAffiches(item)) {
              expect(t, `${item.id} : décimales`).not.toMatch(/\d,\d{4,}/);
              for (const m of t.matchAll(/\b(\d+)\/(\d+)\b/g))
                expect(denominateurOk(Number(m[2])), `${item.id} : ${m[0]}`).toBe(true);
            }
            if (item.kind === 'numeric_answer') {
              expect(item.answer).toBeGreaterThanOrEqual(0);
              expect(item.answer).toBeLessThanOrEqual(borne(lesson.id, level));
            }
            if (item.kind === 'number_line') {
              const pas = item.step / (item.subdivisions ?? 1);
              expect(item.tolerance, item.id).toBeLessThan(pas);
            }
            // Même id ⇒ même question et même réponse
            const k = cle(item);
            if (vus.has(item.id)) expect(vus.get(item.id), item.id).toBe(k);
            vus.set(item.id, k);
          }
          // Vrai / faux équilibrés : la réponse ne doit pas se deviner
          if (kind === 'true_false') {
            const vrais = items.filter((x) => x.kind === 'true_false' && x.answer).length / items.length;
            expect(vrais, 'part de « vrai »').toBeGreaterThan(0.25);
            expect(vrais, 'part de « vrai »').toBeLessThan(0.75);
          }
          // De la variété : pas toujours le même item
          expect(new Set(items.map(cle)).size, 'variété').toBeGreaterThan(1);
        });
      }
    }
  }
});

describe('maths CM2 — reproductibilité', () => {
  it('même graine ⇒ mêmes items', () => {
    for (const l of mesLecons)
      for (const k of Object.keys(contenu[l.id]?.gens ?? {})) {
        const a = tirages(l.id, k as ItemKind, 'normal', 3, 99);
        const b = tirages(l.id, k as ItemKind, 'normal', 3, 99);
        expect(a).toEqual(b);
      }
  });
});
