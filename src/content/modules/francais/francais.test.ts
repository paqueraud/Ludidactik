import { describe, expect, it } from 'vitest';
import ce1 from '@data/curriculum/ce1.json';
import cm2 from '@data/curriculum/cm2.json';
import ce1Mots from '@data/dictees/ce1_mots.json';
import cm2Mots from '@data/dictees/cm2_mots.json';
import { createRng } from '@/engine/rng';
import { versLabo } from '@/games/_langue-commun/fonctions';
import { versFeu, versPuzzle } from '@/games/_langue-commun/phrases';
import { decouperMots, decouperPhrases, indexPreuve } from '@/games/_langue-commun/texte';
import { versLecture } from '@/games/perroquet-savant/lecture';
import { content } from '@/content';
import { gamesForLesson } from '@/games/registry';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import { type Item, type ItemKind, type Lesson, LEVELS, type Level, checkItem } from '../../schemas';
import { TEXTES } from './textes';
import { compterMots } from './util';
import { contenu } from './index';

const lessons = [...(ce1 as { lecons: Lesson[] }).lecons, ...(cm2 as { lecons: Lesson[] }).lecons];
const mesIds = Object.keys(contenu);
const mesLecons = lessons.filter((l) => mesIds.includes(l.id));
const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
const N = 200;

/** Items d'une leçon pour un type et un niveau : 200 tirages (générateur) ou toute la banque. */
const cache = new Map<string, Item[]>();
function items(lesson: Lesson, kind: ItemKind, level: Level, seed = 3): Item[] {
  const k = `${lesson.id}|${kind}|${level}|${seed}`;
  if (!cache.has(k)) cache.set(k, tirer(lesson, kind, level, seed));
  return cache.get(k)!;
}
function tirer(lesson: Lesson, kind: ItemKind, level: Level, seed: number): Item[] {
  const c = contenu[lesson.id]!;
  const rng = createRng(seed);
  const gen = c.gens?.[kind];
  if (gen) return Array.from({ length: N }, () => gen(level, rng, ctxOf(lesson)));
  return c.pools?.[kind]?.(level, rng, ctxOf(lesson)) ?? [];
}

const kindsOf = (id: string) =>
  [...Object.keys(contenu[id]?.gens ?? {}), ...Object.keys(contenu[id]?.pools ?? {})] as ItemKind[];

/** Types réellement produits (une banque vide sert à bloquer une dérivation automatique). */
function produits(lesson: Lesson): ItemKind[] {
  return kindsOf(lesson.id).filter((k) => LEVELS.some((lv) => items(lesson, k, lv).length > 0));
}

/** Ce qui définit le contenu d'un item (même id ⇒ même question et même réponse). */
function cle(item: Item): string {
  switch (item.kind) {
    case 'mcq':
      return `${item.question}=${item.choices[item.answerIndex]}|${JSON.stringify(item.meta ?? {})}`;
    case 'true_false':
      return `${item.statement}=${item.answer}`;
    case 'fill_blank':
      return `${item.sentence}=${item.answer}`;
    case 'ordering':
      return `${item.prompt}=${item.elements.join('|')}`;
    case 'classification':
      return `${item.prompt}=${item.elements
        .map((e) => `${e.label}:${item.categories[e.category]}`)
        .sort()
        .join('|')}`;
    case 'pairing':
      return item.pairs
        .map((p) => `${p.left}:${p.right}`)
        .sort()
        .join('|');
    case 'oral_answer':
      return `${item.prompt}=${item.answer}`;
    case 'read_aloud':
      return `${item.title}=${item.targetMCLM}`;
    case 'spelling_word':
      return item.word;
    default:
      return item.id;
  }
}

/** Tous les textes visibles d'un item. */
function textes(item: Item): string[] {
  const t: string[] = [item.explication, item.spoken ?? ''];
  switch (item.kind) {
    case 'mcq':
      t.push(item.question, ...item.choices, ...(item.hints ?? []));
      break;
    case 'true_false':
      t.push(item.statement);
      break;
    case 'fill_blank':
      t.push(item.sentence, item.answer, ...(item.choices ?? []), item.hint ?? '');
      break;
    case 'ordering':
      t.push(item.prompt, ...item.elements);
      break;
    case 'classification':
      t.push(item.prompt, ...item.categories, ...item.elements.map((e) => e.label));
      break;
    case 'pairing':
      t.push(item.prompt, ...item.pairs.flatMap((p) => [p.left, p.right]));
      break;
    case 'oral_answer':
      t.push(item.prompt, item.answer, ...item.accepted);
      break;
    case 'read_aloud':
      t.push(item.title, item.text);
      break;
  }
  return t;
}

describe('français — curriculum', { timeout: 60_000 }, () => {
  it('le module ne déclare que des leçons existantes', () => {
    for (const id of mesIds)
      expect(
        lessons.some((l) => l.id === id),
        id,
      ).toBe(true);
  });

  it('itemKinds = types produits (+ listes de mots), rappel rédigé, source renseignée', () => {
    const listes = [...ce1Mots.listes, ...cm2Mots.listes];
    for (const l of mesLecons) {
      const attendus = new Set<ItemKind>(produits(l));
      if (listes.some((w) => w.lessonId === l.id)) attendus.add('spelling_word');
      expect([...l.itemKinds].sort(), l.id).toEqual([...attendus].sort());
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
      if (l.source.kind === 'generator') expect(l.source.generator, l.id).toMatch(/^francais\//);
      expect(l.boRef, l.id).not.toMatch(/TODO|interne/i);
    }
  });

  it('au moins 2 types d’items par leçon et par niveau', () => {
    for (const l of mesLecons)
      for (const lv of LEVELS) {
        const n = kindsOf(l.id).filter((k) => items(l, k, lv).length > 0).length;
        expect(n, `${l.id} ${lv}`).toBeGreaterThanOrEqual(2);
      }
  });

  it('chaque leçon est jouable dans au moins 2 jeux', () => {
    for (const l of mesLecons) {
      const lesson = content.lessons.get(l.id)!;
      const jeux = gamesForLesson(lesson, { parentLists: [] }).map((p) => p.game.id);
      expect(jeux.length, `${l.id} : ${jeux.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('français — validité de tous les items', { timeout: 30_000 }, () => {
  for (const lesson of mesLecons)
    for (const kind of kindsOf(lesson.id))
      for (const level of LEVELS)
        it(`${lesson.id} · ${kind} · ${level}`, () => {
          const tous = items(lesson, kind, level);
          const vus = new Map<string, string>();
          for (const item of tous) {
            const ctx = `${item.id} ${JSON.stringify(item)}`;
            expect(checkItem(item), ctx).toEqual([]);
            expect(item.kind).toBe(kind);
            expect(item.lessonId).toBe(lesson.id);
            expect(item.explication.length, ctx).toBeGreaterThan(8);
            expect(JSON.stringify(item), ctx).not.toMatch(/undefined|NaN|\[object|TODO/);
            for (const t of textes(item)) {
              expect(t, ctx).not.toMatch(/ {2}|\s[,.](?!\.)|’ (?!»)| ’|\s$/);
              expect(t, ctx).not.toMatch(/'/);
            }
            const k = cle(item);
            if (vus.has(item.id)) expect(vus.get(item.id), item.id).toBe(k);
            vus.set(item.id, k);
            switch (item.kind) {
              case 'classification': {
                expect(new Set(item.elements.map((e) => e.label)).size, ctx).toBe(item.elements.length);
                expect(new Set(item.elements.map((e) => e.category)).size, ctx).toBeGreaterThanOrEqual(
                  item.meta?.phrase ? 1 : 2,
                );
                if (item.meta?.phrase !== undefined) {
                  const p = versLabo(item);
                  expect(p, ctx).not.toBeNull();
                  const r = item.meta.remplacements as Record<string, string> | undefined;
                  for (const cleR of Object.keys(r ?? {}))
                    expect(
                      item.elements.some((e) => e.label === cleR),
                      `${ctx} remplacement ${cleR}`,
                    ).toBe(true);
                } else for (const e of item.elements) expect(e.label.length, ctx).toBeLessThanOrEqual(32);
                const c = item.meta?.contextes as Record<string, string> | undefined;
                for (const [mot, phrase] of Object.entries(c ?? {}))
                  expect(phrase.toLowerCase(), `${ctx} contexte ${mot}`).toContain(mot.toLowerCase());
                break;
              }
              case 'mcq':
                if (item.choices.every((x) => ['.', '?', '!'].includes(x)))
                  expect(versFeu(item), ctx).not.toBeNull();
                if (typeof item.meta?.texte === 'string' && typeof item.meta.preuve === 'string')
                  expect(
                    indexPreuve(decouperPhrases(item.meta.texte), item.meta.preuve),
                    `${ctx} preuve`,
                  ).toBeGreaterThanOrEqual(0);
                if (item.hints) expect(item.hints.length).toBeGreaterThanOrEqual(3);
                break;
              case 'ordering':
                if (item.mode === 'phrase' || item.mode === 'etapes')
                  expect(versPuzzle(item), ctx).not.toBeNull();
                break;
              case 'oral_answer':
                expect(versLecture(item), ctx).not.toBeNull();
                break;
              case 'read_aloud':
                expect(item.nbMots, ctx).toBe(decouperMots(item.text).length);
                expect(item.nbMots).toBe(compterMots(item.text));
                break;
              case 'fill_blank':
                expect(item.sentence.split('___').length, ctx).toBe(2);
                if (item.choices) expect(item.hint, `${ctx} : pas d’astuce (Pêche)`).toBeTruthy();
                break;
              case 'pairing':
                expect(item.pairs.length, ctx).toBeGreaterThanOrEqual(3);
                break;
            }
          }
          if (contenu[lesson.id]!.gens?.[kind]) {
            expect(tous.length).toBe(N);
            expect(new Set(tous.map(cle)).size, 'variété').toBeGreaterThan(1);
          }
          if (kind === 'true_false' && tous.length >= 10) {
            const vrais = tous.filter((x) => x.kind === 'true_false' && x.answer).length / tous.length;
            expect(vrais).toBeGreaterThan(0.25);
            expect(vrais).toBeLessThan(0.75);
          }
        });
});

describe('français — textes de lecture', () => {
  it('nbMots exact et preuves présentes dans le texte', () => {
    for (const t of TEXTES) {
      expect(t.nbMots, t.id).toBe(decouperMots(t.texte).length);
      const phrases = decouperPhrases(t.texte);
      for (const q of t.questions)
        if (q.type === 'mcq' && q.preuve)
          expect(indexPreuve(phrases, q.preuve), `${t.id} ${q.preuve}`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('français — garde-fous de relecture', () => {
  it('connecteurs : jamais « Ensuite » et « Puis » proposés ensemble', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.FR.ORAL.DIRE')!;
    for (const lv of LEVELS)
      for (const it of items(l, 'fill_blank', lv))
        if (it.kind === 'fill_blank')
          expect(it.choices?.filter((c) => c === 'Ensuite' || c === 'Puis').length).toBeLessThanOrEqual(1);
  });

  it('paires d’affixes : pas deux sens qui se recouvrent dans une même grille', () => {
    for (const id of ['CE1.FR.VOC.AFFIXES', 'CM2.FR.VOC.MORPHO']) {
      const l = mesLecons.find((x) => x.id === id)!;
      for (const lv of LEVELS)
        for (const it of items(l, 'pairing', lv))
          if (it.kind === 'pairing') {
            const sens = it.pairs.map((p) => p.right);
            expect(sens.filter((s) => /contraire/.test(s)).length, sens.join(' | ')).toBeLessThanOrEqual(1);
            expect(sens.filter((s) => /^petit/.test(s)).length).toBeLessThanOrEqual(1);
          }
    }
  });
});
