/**
 * Tests du module « conjugaison » : couverture des leçons et cohérence avec le curriculum, validité de
 * chaque item (200 tirages par leçon × type × niveau), réponses justes et uniques, compatibilité avec
 * les jeux spécialisés (Forge, Train, Pêche, Chasse). Le moteur est testé dans moteur.test.ts.
 */
import { describe, expect, it } from 'vitest';
import ce1 from '@data/curriculum/ce1.json';
import cm2 from '@data/curriculum/cm2.json';
import ce1Mots from '@data/dictees/ce1_mots.json';
import { checkSpelling } from '@/engine/answer';
import { createRng } from '@/engine/rng';
import { versForge } from '@/games/_langue-commun/conjugaison';
import { versTrou } from '@/games/_orthographe-commun/trou';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import { type Item, type ItemKind, type Lesson, LEVELS, type Level, checkItem } from '../../schemas';
import { CONTENU } from '../index';
import { SERIES_HOMOPHONES } from './homophones';
import { contenu } from './index';
import { GN_PLURIEL, GN_SINGULIER, PRENOMS } from './lexique';
import { NOM_TEMPS, type Personne, type Temps, formes } from './moteur';
import { LEXIQUES_ORTHO } from './ortho-ce1';

const lessons = [...(ce1 as { lecons: Lesson[] }).lecons, ...(cm2 as { lecons: Lesson[] }).lecons];
const mesLecons = lessons.filter((l) => contenu[l.id]);
const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
const N = 200;

const LECONS_ATTENDUES = [
  'CE1.FR.CONJ.INFINITIF',
  'CE1.FR.CONJ.PRESENT',
  'CE1.FR.CONJ.IMPARFAIT',
  'CE1.FR.CONJ.FUTUR',
  'CE1.FR.CONJ.PASSE_COMPOSE',
  'CE1.FR.CONJ.TEMPS',
  'CE1.FR.GRAM.GN',
  'CE1.FR.GRAM.SV',
  'CE1.FR.GRAM.HOMOPHONES',
  'CE1.FR.ORTH.MUETTE',
  'CE1.FR.ORTH.ACCENTS',
  'CE1.FR.ORTH.INVARIABLES',
  'CM2.FR.CONJ.PRESENT',
  'CM2.FR.CONJ.IMPARFAIT',
  'CM2.FR.CONJ.PASSE_SIMPLE',
  'CM2.FR.CONJ.FUTUR',
  'CM2.FR.CONJ.CONDITIONNEL',
  'CM2.FR.CONJ.PC',
  'CM2.FR.CONJ.PQP',
  'CM2.FR.CONJ.IMPERATIF',
  'CM2.FR.CONJ.MARQUES',
  'CM2.FR.CONJ.CONCORD',
  'CM2.FR.ORTH.GN',
  'CM2.FR.ORTH.SV',
  'CM2.FR.ORTH.PP',
  'CM2.FR.ORTH.HOMOPHONES',
];

function tirages(lessonId: string, kind: ItemKind, level: Level, n = N, seed = 11): Item[] {
  const lesson = mesLecons.find((l) => l.id === lessonId)!;
  const gen = contenu[lessonId]!.gens![kind]!;
  const rng = createRng(seed);
  return Array.from({ length: n }, () => gen(level, rng, ctxOf(lesson)));
}

/** Ce qui définit un item (même id ⇒ même contenu). */
function cle(item: Item): string {
  switch (item.kind) {
    case 'mcq':
      return `${item.question}=${item.choices[item.answerIndex]}`;
    case 'true_false':
      return `${item.statement}=${item.answer}`;
    case 'fill_blank':
      return `${item.sentence}=${item.answer}`;
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
    case 'oral_answer':
      return `${item.prompt}=${item.answer}`;
    case 'spelling_word':
      return item.word;
    default:
      return item.id;
  }
}

/** Une réponse donnée serait-elle acceptée pour la bonne réponse attendue ? */
const accepte = (donne: string, attendue: string) => checkSpelling(donne, attendue).correct;

describe('conjugaison — couverture et curriculum', () => {
  it('toutes les leçons demandées ont du contenu (au moins 2 types d’items)', () => {
    for (const id of LECONS_ATTENDUES) {
      expect(contenu[id], id).toBeDefined();
      expect(Object.keys(contenu[id]!.gens ?? {}).length, id).toBeGreaterThanOrEqual(2);
    }
    expect(Object.keys(contenu).sort()).toEqual([...LECONS_ATTENDUES].sort());
  });

  it('le module ne déclare que des leçons existantes, toutes présentes dans le registre global', () => {
    for (const id of Object.keys(contenu)) {
      expect(
        lessons.some((l) => l.id === id),
        id,
      ).toBe(true);
      expect(CONTENU[id], id).toBeDefined();
    }
  });

  it('le curriculum déclare exactement les types produits, un rappel, un générateur et un boRef propre', () => {
    const listes = (ce1Mots as { listes: { lessonId: string }[] }).listes;
    for (const l of mesLecons) {
      const kinds = new Set(Object.keys(contenu[l.id]?.gens ?? {}));
      if (listes.some((x) => x.lessonId === l.id)) kinds.add('spelling_word');
      expect([...l.itemKinds].sort(), l.id).toEqual([...kinds].sort());
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
      expect(l.source.kind === 'generator' && l.source.generator.startsWith('conjugaison/'), l.id).toBe(true);
      expect(l.boRef, l.id).not.toMatch(/TODO|synthèse|docs\//);
      expect(l.titre, l.id).not.toMatch(/TODO/);
    }
  });

  it('écarts BO : conditionnel et impératif présent étiquetés « Pour aller plus loin (6e) » au CM2', () => {
    for (const id of ['CM2.FR.CONJ.CONDITIONNEL', 'CM2.FR.CONJ.IMPERATIF']) {
      const l = mesLecons.find((x) => x.id === id)!;
      expect(l.titre).toMatch(/^Pour aller plus loin \(6e\)/);
      for (const n of Object.values(l.niveaux)) expect(n).toMatch(/Pour aller plus loin \(6e\)/);
    }
  });
});

describe('conjugaison — validité de tous les items', () => {
  for (const lesson of mesLecons) {
    for (const kind of Object.keys(contenu[lesson.id]?.gens ?? {}) as ItemKind[]) {
      for (const level of LEVELS) {
        it(`${lesson.id} · ${kind} · ${level}`, () => {
          const vus = new Map<string, string>();
          const items = tirages(lesson.id, kind, level);
          for (const item of items) {
            const txt = JSON.stringify(item);
            expect(checkItem(item), txt).toEqual([]);
            expect(item.kind).toBe(kind);
            expect(item.lessonId).toBe(lesson.id);
            expect(item.explication.length, txt).toBeGreaterThan(15);
            expect(txt).not.toMatch(/undefined|NaN|\[object|null/);
            expect(txt, 'apostrophe droite').not.toMatch(/\w'\w/);
            if (item.difficulty !== undefined) {
              expect(item.difficulty).toBeGreaterThanOrEqual(0);
              expect(item.difficulty).toBeLessThanOrEqual(1);
            }
            // une seule bonne réponse parmi les choix
            if (item.kind === 'fill_blank') {
              expect(item.sentence.split('___').length, txt).toBe(2);
              if (item.choices) {
                expect(item.choices.filter((c) => c === item.answer).length, txt).toBe(1);
                expect(new Set(item.choices).size, txt).toBe(item.choices.length);
                for (const c of item.choices)
                  if (c !== item.answer) {
                    expect(accepte(c, item.answer), `${c} accepté pour ${item.answer}`).toBe(false);
                    for (const a of item.accepted ?? []) expect(c, txt).not.toBe(a);
                  }
              }
            }
            if (item.kind === 'mcq') {
              const bonne = item.choices[item.answerIndex]!;
              for (const c of item.choices)
                if (c !== bonne) expect(accepte(c, bonne), `${c} accepté pour ${bonne}`).toBe(false);
            }
            if (item.kind === 'classification') {
              expect(item.elements.length, txt).toBeGreaterThanOrEqual(4);
              expect(new Set(item.elements.map((e) => e.label)).size, txt).toBe(item.elements.length);
            }
            if (item.kind === 'pairing') expect(item.pairs.length, txt).toBeGreaterThanOrEqual(3);
            // même id ⇒ même contenu
            const k = cle(item);
            if (vus.has(item.id)) expect(vus.get(item.id), item.id).toBe(k);
            vus.set(item.id, k);
          }
          if (kind === 'true_false') {
            const vrais = items.filter((x) => x.kind === 'true_false' && x.answer).length / items.length;
            expect(vrais, 'part de « vrai »').toBeGreaterThan(0.3);
            expect(vrais, 'part de « vrai »').toBeLessThan(0.7);
          }
          expect(new Set(items.map(cle)).size, 'variété').toBeGreaterThan(5);
        });
      }
    }
  }
});

/* ------------------------------------------------------------------ */
/* Réponses justes                                                     */
/* ------------------------------------------------------------------ */

const TEMPS_PAR_NOM = Object.fromEntries(
  Object.entries(NOM_TEMPS).map(([k, v]) => [v, k as Temps]),
) as Record<string, Temps>;
const PRONOMS: Record<string, Personne> = {
  je: 0,
  'j’': 0,
  tu: 1,
  il: 2,
  elle: 2,
  on: 2,
  nous: 3,
  vous: 4,
  ils: 5,
  elles: 5,
};
const SUJETS_GN = new Map([...PRENOMS, ...GN_SINGULIER, ...GN_PLURIEL].map((s) => [s.texte, s]));

describe('conjugaison — réponses justes', () => {
  it('Forge : la réponse est une forme juste du verbe, au temps et à la personne indiqués', () => {
    let verifies = 0;
    for (const lesson of mesLecons) {
      if (!contenu[lesson.id]?.gens?.fill_blank) continue;
      for (const level of LEVELS)
        for (const it of tirages(lesson.id, 'fill_blank', level, 120)) {
          if (it.kind !== 'fill_blank' || !it.conjugaison) continue;
          const { sujet, verbe, temps } = it.conjugaison;
          const t = TEMPS_PAR_NOM[temps];
          expect(t, temps).toBeDefined();
          if (/-/.test(it.answer)) continue; // impératif + pronom (range-la), vérifié à part
          const g = SUJETS_GN.get(sujet);
          const p = PRONOMS[sujet] ?? g?.p;
          if (p === undefined) continue;
          const negation = /forme négative/.test(it.sentence);
          const ok = formes(verbe, t!, p, {
            negation,
            fem: g?.fem ?? (sujet === 'elle' || sujet === 'elles' ? true : undefined),
          });
          const toutes = [...ok, ...formes(verbe, t!, p, { negation, fem: !(g?.fem ?? false) })];
          expect(toutes, JSON.stringify(it)).toContain(it.answer);
          verifies++;
        }
    }
    expect(verifies).toBeGreaterThan(2000);
  });

  it('Forge : chaque item de conjugaison est lisible par la Forge du verbe', () => {
    for (const lesson of mesLecons.filter((l) => /CONJ/.test(l.id) && !/INFINITIF/.test(l.id))) {
      if (!contenu[lesson.id]?.gens?.fill_blank) continue;
      for (const level of LEVELS)
        for (const it of tirages(lesson.id, 'fill_blank', level, 50)) {
          const q = versForge(it);
          expect(q, JSON.stringify(it)).not.toBeNull();
          // la parenthèse « (verbe, temps) » est retirée de la phrase affichée par la Forge
          expect(`${q!.avant}${q!.apres}`).not.toContain(`(${q!.verbe},`);
        }
    }
  });

  it('CE1 : seulement les temps du CE1 (présent, imparfait, futur, passé composé), sauf plus loin de l’infinitif', () => {
    const ce1Temps = ['présent', 'imparfait', 'futur', 'passé composé'];
    for (const lesson of mesLecons.filter((l) => l.classe === 'CE1' && /CONJ/.test(l.id))) {
      for (const level of LEVELS) {
        for (const it of tirages(lesson.id, 'fill_blank', level, 100)) {
          if (it.kind !== 'fill_blank' || !it.conjugaison) continue;
          expect(ce1Temps, it.sentence).toContain(it.conjugaison.temps);
          // pas de distracteurs au passé simple ou au conditionnel
          const interdits = new Set(
            ([0, 1, 2, 3, 4, 5] as Personne[]).flatMap((p) => [
              ...formes(it.conjugaison!.verbe, 'passe_simple', p),
              ...formes(it.conjugaison!.verbe, 'conditionnel', p),
            ]),
          );
          for (const p of [0, 1, 2, 3, 4, 5] as Personne[])
            for (const t of ['present', 'imparfait', 'futur'] as Temps[])
              for (const f of formes(it.conjugaison.verbe, t, p)) interdits.delete(f);
          for (const c of it.choices ?? [])
            if (c !== it.answer) expect(interdits.has(c), `${it.sentence} : ${c}`).toBe(false);
        }
      }
    }
  });

  it('Train des accords : groupe et lemme présents, la réponse va dans un wagon', () => {
    for (const id of [
      'CE1.FR.GRAM.GN',
      'CE1.FR.GRAM.SV',
      'CM2.FR.ORTH.GN',
      'CM2.FR.ORTH.SV',
      'CM2.FR.ORTH.PP',
    ])
      for (const level of LEVELS)
        for (const it of tirages(id, 'fill_blank', level, 100)) {
          const t = versTrou(it)!;
          expect(t.groupe, JSON.stringify(it)).toBeDefined();
          expect(t.choix?.length).toBeGreaterThanOrEqual(2);
          expect(t.groupe!.filter((g) => g.includes('___')).length, JSON.stringify(it)).toBe(1);
          expect(typeof it.meta?.lemme).toBe('string');
          expect(it.kind === 'fill_blank' && it.hint).toBeFalsy();
        }
  });

  it('Pêche aux homophones : choix + astuce, sans conjugaison ni groupe ni famille', () => {
    for (const id of [
      'CE1.FR.GRAM.HOMOPHONES',
      'CM2.FR.ORTH.HOMOPHONES',
      'CE1.FR.ORTH.ACCENTS',
      'CE1.FR.ORTH.INVARIABLES',
    ])
      for (const level of LEVELS)
        for (const it of tirages(id, 'fill_blank', level, 100)) {
          if (it.kind !== 'fill_blank') continue;
          expect(it.hint, id).toBeTruthy();
          expect(it.choices!.length).toBeGreaterThanOrEqual(2);
          expect(it.conjugaison).toBeUndefined();
          expect(it.meta?.groupe).toBeUndefined();
          expect(it.meta?.famille).toBeUndefined();
        }
  });

  it('séries d’homophones : une seule place, la réponse fait partie de la série', () => {
    for (const s of SERIES_HOMOPHONES) {
      for (const ph of s.phrases) {
        expect(ph.p.split('___').length, ph.p).toBe(2);
        expect(s.mots, ph.p).toContain(ph.r);
        expect(s.regles[ph.r] ?? ph.note, ph.p).toBeTruthy();
      }
      for (const m of s.mots)
        expect(
          s.phrases.some((ph) => ph.r === m),
          `${s.id} : ${m}`,
        ).toBe(true);
    }
  });

  it('lettres muettes : le mot de la famille fait entendre la lettre ; la Chasse sait la surligner', () => {
    for (const level of LEVELS)
      for (const x of LEXIQUES_ORTHO.MUETTES[level]) {
        expect(x.famille, x.mot).toContain(x.lettre);
        expect(x.phrase).toContain('{}');
      }
    let surlignes = 0;
    for (const level of LEVELS)
      for (const it of tirages('CE1.FR.ORTH.MUETTE', 'fill_blank', level, 100)) {
        if (it.kind !== 'fill_blank') continue;
        expect(typeof it.meta?.famille).toBe('string');
        const t = versTrou(it)!;
        if (t.famille && (t.famille as string).startsWith(t.avant.match(/[\p{L}’'-]*$/u)![0] + it.answer))
          surlignes++;
      }
    expect(surlignes).toBeGreaterThan(200);
  });

  it('accents et mots invariables : les fautes proposées ne sont jamais des graphies acceptées', () => {
    for (const level of LEVELS) {
      for (const x of LEXIQUES_ORTHO.ACCENTS[level]) expect(x.mot, x.mot).toContain(x.cible);
      for (const x of LEXIQUES_ORTHO.INVARIABLES[level])
        for (const f of x.fautes) expect(accepte(f, x.mot), `${f} / ${x.mot}`).toBe(false);
    }
  });

  it('participe passé avec être : accord avec le sujet', () => {
    for (const level of LEVELS)
      for (const it of tirages('CM2.FR.ORTH.PP', 'fill_blank', level, 150)) {
        if (it.kind !== 'fill_blank') continue;
        const m = it.sentence.match(/^(.+?) (est|sont|était|étaient) ___/);
        if (!m) continue;
        const s = SUJETS_GN.get(m[1]!.toLowerCase()) ?? SUJETS_GN.get(m[1]!);
        if (!s) continue;
        const pl = s.p === 5;
        if (s.fem) expect(it.answer, it.sentence).toMatch(/e$|es$/);
        if (pl) expect(it.answer, it.sentence).toMatch(/s$/);
        if (!pl && !s.fem) expect(it.answer, it.sentence).not.toMatch(/e$/);
      }
  });

  it('accord sujet-verbe : pluriel en -nt (sauf futur en -ont, déjà en -nt)', () => {
    for (const level of LEVELS)
      for (const it of tirages('CE1.FR.GRAM.SV', 'fill_blank', level, 150)) {
        if (it.kind !== 'fill_blank') continue;
        const groupe = (it.meta!.groupe as string[]).join(' ').toLowerCase();
        const pluriel = /^(ils|elles|les |mes |léa et|nora et|inès et|hugo et)/.test(groupe);
        expect(it.answer.endsWith('nt'), it.sentence).toBe(pluriel);
      }
  });
});

describe('conjugaison — jeux jouables', () => {
  it('chaque leçon propose plusieurs jeux, et chaque jeu reçoit des items à chaque niveau', async () => {
    const { gamesForLesson } = await import('@/games/registry');
    const { content } = await import('@/content');
    const { createStream } = await import('@/content/provider');
    for (const lesson of mesLecons) {
      const ctx = { parentLists: [] };
      const jeux = gamesForLesson(lesson, ctx);
      expect(jeux.length, lesson.id).toBeGreaterThanOrEqual(3);
      for (const { game, kind } of jeux)
        for (const level of LEVELS) {
          const st = createStream(content, lesson, kind, level, createRng(3), ctx, game.filterItem);
          expect(st, `${lesson.id} · ${game.id} · ${level}`).not.toBeNull();
          for (let i = 0; i < 5; i++)
            expect(game.filterItem?.(st!.next()) ?? true, `${lesson.id} · ${game.id} · ${level}`).toBe(true);
        }
    }
  }, 120_000);
});
