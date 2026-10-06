import { describe, expect, it } from 'vitest';
import ce1 from '@data/curriculum/ce1.json';
import banque from '@data/questions/ce1_questions.json';
import { createRng } from '@/engine/rng';
import { IDS_CARTES, resoudreId } from '@/games/_cartes/ids';
import { estPaireImage } from '@/games/_monde-commun/outils';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import { type Item, type ItemKind, type Lesson, LEVELS, type Level, checkItem } from '../../schemas';
import { CONTENU } from '../index';
import { contenu } from './index';

const lessons = (ce1 as { lecons: Lesson[] }).lecons;
const MATIERES = ['questionner_le_monde', 'emc', 'anglais'];
const mesLecons = lessons.filter((l) => MATIERES.includes(l.matiere));
const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
const N = 150;
const questionsBanque = (banque as { questions: { lessonId: string; type: string }[] }).questions;

/** Tous les items d'une leçon pour un type et un niveau (générateur : N tirages ; banque : la liste). */
function items(lesson: Lesson, kind: ItemKind, level: Level, seed = 7, n = N): Item[] {
  const c = contenu[lesson.id]!;
  const rng = createRng(seed);
  const gen = c.gens?.[kind];
  if (gen) return Array.from({ length: n }, () => gen(level, rng, ctxOf(lesson)));
  return c.pools![kind]!(level, rng, ctxOf(lesson));
}

const kindsDe = (id: string) =>
  [...Object.keys(contenu[id]?.gens ?? {}), ...Object.keys(contenu[id]?.pools ?? {})] as ItemKind[];

/** Ce qui définit le contenu d'un item (même id ⇒ même question et même réponse). */
function cle(item: Item): string {
  switch (item.kind) {
    case 'mcq':
      return `${item.question}|${item.spoken ?? ''}=${item.choices[item.answerIndex]}`;
    case 'true_false':
      return `${item.statement}=${item.answer}`;
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
    case 'map_point':
      return `${item.map}:${item.target}`;
    case 'oral_answer':
      return `${item.prompt}=${item.answer}`;
    default:
      return item.id;
  }
}

describe('monde CE1 — couverture des leçons', () => {
  it('25 leçons (QLM, EMC, anglais), chacune avec au moins 3 types d’items natifs', () => {
    expect(mesLecons.length).toBe(25);
    for (const l of mesLecons) {
      expect(CONTENU[l.id], l.id).toBeDefined();
      expect(kindsDe(l.id).length, l.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('le curriculum déclare exactement les types produits, un rappel, un titre et un générateur', () => {
    for (const l of mesLecons) {
      const kinds = new Set<string>(kindsDe(l.id));
      for (const q of questionsBanque) if (q.lessonId === l.id) kinds.add(q.type);
      expect([...l.itemKinds].sort(), l.id).toEqual([...kinds].sort());
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
      expect(l.source.kind === 'generator' && l.source.generator.startsWith('monde-ce1/'), l.id).toBe(true);
      expect(l.boRef.length, l.id).toBeGreaterThan(20);
    }
  });

  it('le module ne déclare que des leçons existantes de ses matières', () => {
    for (const id of Object.keys(contenu))
      expect(
        mesLecons.some((l) => l.id === id),
        id,
      ).toBe(true);
  });
});

describe('monde CE1 — validité de tous les items', () => {
  for (const lesson of mesLecons) {
    for (const kind of kindsDe(lesson.id)) {
      for (const level of LEVELS) {
        it(`${lesson.id} · ${kind} · ${level}`, () => {
          const tous = items(lesson, kind, level);
          const estGen = !!contenu[lesson.id]!.gens?.[kind];
          expect(tous.length, 'items').toBeGreaterThanOrEqual(kind === 'map_point' ? 3 : 2);
          const vus = new Map<string, string>();
          for (const item of tous) {
            expect(checkItem(item), `${item.id} ${JSON.stringify(item)}`).toEqual([]);
            expect(item.kind).toBe(kind);
            expect(item.lessonId).toBe(lesson.id);
            expect(item.explication.length).toBeGreaterThan(8);
            expect(JSON.stringify(item)).not.toMatch(/undefined|NaN|\[object|TODO/);
            // Typographie : pas d'apostrophe droite dans les textes français affichés
            if (lesson.matiere !== 'anglais') expect(JSON.stringify(item), item.id).not.toMatch(/\w'\w/);
            const k = cle(item);
            if (vus.has(item.id)) expect(vus.get(item.id), item.id).toBe(k);
            vus.set(item.id, k);

            if (item.kind === 'mcq') {
              if (item.hints) {
                expect(item.hints.length, item.id).toBeGreaterThanOrEqual(3);
                expect(item.hints.length, item.id).toBeLessThanOrEqual(5);
              }
              if (lesson.matiere === 'anglais') expect(item.lang, item.id).toBe('en-GB');
              // Guillotine : seulement le temps, les symboles (et l'anglais, hors du jeu)
              if (lesson.matiere === 'emc' && lesson.id !== 'CE1.EMC.SYMBOLES')
                expect(item.guillotine, item.id).toBe(false);
              if (level === 'facile' && !item.hints) expect(item.choices.length).toBeLessThanOrEqual(3);
            }
            if (item.kind === 'oral_answer') {
              expect(item.lang).toBe('en-GB');
              expect(item.accepted.length).toBeGreaterThanOrEqual(1);
            }
            if (item.kind === 'map_point') {
              expect(IDS_CARTES[item.map], item.map).toBeDefined();
              expect(resoudreId(item.map, item.target), `${item.map}:${item.target}`).not.toBeNull();
              const carte = IDS_CARTES[item.map]!;
              expect(carte.zones.includes(item.target) || !!carte.groupes?.[item.target], 'id exact').toBe(
                true,
              );
            }
            if (item.kind === 'pairing') {
              expect(item.pairs.length, item.id).toBeGreaterThanOrEqual(3);
              if (lesson.matiere === 'anglais' && estPaireImage(item)) expect(item.lang).toBe('en-GB');
            }
            if (item.kind === 'classification') {
              const cats = new Set(item.elements.map((e) => e.category));
              expect(cats.size, `${item.id} : catégories représentées`).toBeGreaterThanOrEqual(2);
              expect(new Set(item.elements.map((e) => e.label)).size).toBe(item.elements.length);
            }
            if (item.kind === 'ordering' && item.labels)
              expect(item.labels.length).toBe(item.elements.length);
          }
          if (!estGen) expect(new Set(tous.map((x) => x.id)).size, 'ids uniques').toBe(tous.length);
          if (kind === 'true_false') {
            const vrais = tous.filter((x) => x.kind === 'true_false' && x.answer).length / tous.length;
            expect(vrais, 'part de « vrai »').toBeGreaterThan(estGen ? 0.25 : 0.2);
            expect(vrais, 'part de « vrai »').toBeLessThan(estGen ? 0.75 : 0.85);
          }
          if (estGen && kind !== 'pairing') expect(new Set(tous.map(cle)).size, 'variété').toBeGreaterThan(1);
        });
      }
    }
  }
});

describe('monde CE1 — conventions des jeux', () => {
  it('cycles de vie : meta.cycle sur les cycles, mode étapes', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.QLM.VIVANT.CYCLES')!;
    for (const level of LEVELS) {
      const ordres = items(l, 'ordering', level);
      expect(ordres.filter((o) => o.meta?.cycle === true).length).toBeGreaterThanOrEqual(3);
      for (const o of ordres) if (o.kind === 'ordering') expect(o.mode).toBe('etapes');
    }
  });

  it('électricité : au moins un circuit (meta.circuit) au normal et au plus loin', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.QLM.OBJETS.ELEC')!;
    for (const level of ['normal', 'plus_loin'] as Level[])
      expect(
        items(l, 'classification', level).some((c) => c.meta?.circuit === true),
        level,
      ).toBe(true);
  });

  it('frises du temps : ordres chronologiques (Machine à remonter le temps)', () => {
    for (const id of ['CE1.QLM.TEMPS.CALENDRIER', 'CE1.QLM.TEMPS.FRISE', 'CE1.QLM.TEMPS.AUTREFOIS']) {
      const l = mesLecons.find((x) => x.id === id)!;
      for (const level of LEVELS)
        for (const o of items(l, 'ordering', level)) if (o.kind === 'ordering') expect(o.mode).toBe('chrono');
    }
  });

  it('monde : les 6 continents et les 5 océans sont proposés au niveau normal', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.QLM.ESPACE.MONDE')!;
    const cibles = items(l, 'map_point', 'normal').map((x) => (x.kind === 'map_point' ? x.target : ''));
    for (const c of ['afrique', 'amerique', 'antarctique', 'asie', 'europe', 'oceanie'])
      expect(cibles, c).toContain(c);
    for (const o of ['atlantique', 'pacifique', 'indien', 'arctique', 'austral'])
      expect(cibles).toContain(`ocean-${o}`);
  });

  it('anglais : des paires mot ↔ image pour Jacques a dit dans chaque leçon', () => {
    for (const l of mesLecons.filter((x) => x.matiere === 'anglais')) {
      const tous = LEVELS.flatMap((lv) => items(l, 'pairing', lv, 3, 60));
      expect(tous.some(estPaireImage), l.id).toBe(true);
    }
  });

  it('devinettes : au moins 4 « Qui suis-je ? » à indices par leçon de QLM et d’EMC (niveau normal)', () => {
    for (const l of mesLecons.filter((x) => x.matiere !== 'anglais')) {
      const qcm = items(l, 'mcq', 'normal', 5, 300);
      const ids = new Set(qcm.filter((q) => q.kind === 'mcq' && q.hints?.length).map((q) => q.id));
      expect(ids.size, l.id).toBeGreaterThanOrEqual(l.id === 'CE1.QLM.ESPACE.PLANS' ? 3 : 4);
    }
  });
});

describe('monde CE1 — réponses justes', () => {
  it('gauche / droite : la réponse correspond à la file dessinée', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.QLM.ESPACE.PLANS')!;
    const noms: Record<string, string> = {
      '🐱': 'le chat',
      '🐶': 'le chien',
      '🐰': 'le lapin',
      '🐸': 'la grenouille',
      '🐻': 'l’ours',
      '🐷': 'le cochon',
      '🦊': 'le renard',
      '🐼': 'le panda',
    };
    for (const level of LEVELS)
      for (const it of items(l, 'mcq', level, 11, 300)) {
        if (it.kind !== 'mcq') continue;
        const m = it.question.match(/^Regarde la file : (.+?)\. (.+)$/u);
        if (!m) continue;
        const file = m[1]!.split(' ').map((e) => noms[e]!);
        const q = m[2]!;
        const bonne = it.choices[it.answerIndex]!;
        const i = file.indexOf(bonne);
        if (q === 'Qui est tout à gauche ?') expect(i).toBe(0);
        else if (q === 'Qui est tout à droite ?') expect(i).toBe(file.length - 1);
        else if (q === 'Qui est le deuxième en partant de la droite ?') expect(i).toBe(file.length - 2);
        else {
          const ref = (s: string) => file.findIndex((n) => s.endsWith(n.replace(/^le /, '')));
          const r = q.match(/juste à (droite|gauche) (?:du |de )(.+) \?$/);
          if (r) expect(i).toBe(ref(r[2]!) + (r[1] === 'droite' ? 1 : -1));
          const e = q.match(/^Qui est entre (.+) et (.+) \?$/);
          if (e) expect(i).toBe(file.indexOf(e[1]!) + 1);
          expect(r || e, q).toBeTruthy();
        }
      }
  });

  it('anglais : les nombres entendus correspondent aux chiffres', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.EN.NUMBERS')!;
    const val: Record<string, number> = {};
    [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
      'twelve',
      'thirteen',
      'fourteen',
      'fifteen',
      'sixteen',
      'seventeen',
      'eighteen',
      'nineteen',
      'twenty',
    ].forEach((w, i) => (val[w] = i + 1));
    Object.assign(val, {
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
      'one hundred': 100,
    });
    for (const level of LEVELS)
      for (const it of items(l, 'mcq', level, 13, 300)) {
        if (it.kind !== 'mcq' || !it.spoken || it.question.includes('image')) continue;
        expect(Number(it.choices[it.answerIndex]), it.spoken).toBe(val[it.spoken]);
      }
  });

  it('anglais : la date entendue correspond à la date choisie', () => {
    const l = mesLecons.find((x) => x.id === 'CE1.EN.DAYS')!;
    const jours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const fr = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    for (const it of items(l, 'mcq', 'plus_loin', 17, 300)) {
      if (it.kind !== 'mcq' || !it.spoken?.startsWith('Today is')) continue;
      const bonne = it.choices[it.answerIndex]!;
      const j = jours.findIndex((d) => it.spoken!.includes(d));
      expect(bonne.startsWith(fr[j]!), it.spoken).toBe(true);
      if (it.spoken.includes('the first of')) expect(bonne).toMatch(/ 1er /);
      if (it.spoken.includes('the third of')) expect(bonne).toMatch(/ 3 /);
      if (it.spoken.includes('the thirteenth of')) expect(bonne).toMatch(/ 13 /);
    }
  });
});

describe('monde CE1 — jeux jouables', () => {
  it('chaque leçon propose au moins 3 jeux, chacun reçoit des items à chaque niveau, et les jeux suggérés sont jouables', async () => {
    const { gamesForLesson } = await import('@/games/registry');
    const { content } = await import('@/content');
    const { createStream } = await import('@/content/provider');
    for (const l of mesLecons) {
      const lesson = content.lessons.get(l.id)!;
      const ctx = { parentLists: [] };
      const jeux = gamesForLesson(lesson, ctx);
      expect(jeux.length, `${l.id} : ${jeux.map((j) => j.game.id).join(', ')}`).toBeGreaterThanOrEqual(3);
      for (const s of lesson.jeuxSuggeres)
        expect(
          jeux.map((j) => j.game.id),
          `${l.id} : jeu suggéré ${s}`,
        ).toContain(s);
      for (const { game, kind } of jeux)
        for (const level of LEVELS) {
          const st = createStream(content, lesson, kind, level, createRng(3), ctx, game.filterItem);
          expect(st, `${l.id} · ${game.id} · ${level}`).not.toBeNull();
          for (let i = 0; i < 5; i++)
            expect(game.filterItem?.(st!.next()) ?? true, `${l.id} · ${game.id} · ${level}`).toBe(true);
        }
    }
  }, 180_000);
});
