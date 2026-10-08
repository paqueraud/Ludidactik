/**
 * Tests du module « monde-cm2 » : couverture du curriculum, validité de chaque item (3 graines × 3 niveaux),
 * identifiants de cartes exacts, thèmes sensibles hors Guillotine, conventions des jeux (Qui suis-je ?,
 * Jacques a dit, frises), jeux réellement jouables à chaque niveau.
 */
import cm2 from '@data/curriculum/cm2.json';
import cm2Questions from '@data/histoire/cm2_questions.json';
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { IDS_CARTES } from '@/games/_cartes/ids';
import { estPaireImage } from '@/games/_monde-commun/outils';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import { type Item, type ItemKind, LEVELS, type Lesson, type Level, checkItem } from '../../schemas';
import { FICHES, contenu } from './index';
import { anneeDe, qcmDe } from './outils';

const lessons = (cm2 as { lecons: Lesson[] }).lecons;
const MATIERES = ['histoire', 'geographie', 'sciences', 'emc', 'anglais'];
const mesLecons = lessons.filter((l) => MATIERES.includes(l.matiere));
const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
const lecon = (id: string) => mesLecons.find((l) => l.id === id)!;

function items(id: string, kind: ItemKind, level: Level, seed = 1): Item[] {
  return contenu[id]!.pools![kind]!(level, createRng(seed), ctxOf(lecon(id)));
}

/** Toutes les chaînes affichées d'un item. */
function textes(it: Item): string[] {
  const t: string[] = [it.explication];
  if (it.kind === 'mcq') t.push(it.question, ...it.choices, ...(it.hints ?? []));
  if (it.kind === 'true_false') t.push(it.statement);
  if (it.kind === 'ordering') t.push(it.prompt, ...it.elements, ...(it.labels ?? []));
  if (it.kind === 'pairing') t.push(it.prompt, ...it.pairs.flatMap((p) => [p.left, p.right]));
  if (it.kind === 'classification') t.push(it.prompt, ...it.categories, ...it.elements.map((e) => e.label));
  if (it.kind === 'map_point') t.push(it.prompt, it.targetLabel);
  if (it.kind === 'oral_answer') t.push(it.prompt, it.answer);
  return t;
}

const SENSIBLE =
  /guerre|Shoah|génocide|esclav|exécution|exécuté|nazi|Vichy|rafle|déport|colonie|colonial|travail des enfants|tranchée|armistice|résistan/i;

describe('monde CM2 — couverture du curriculum', () => {
  it('chaque leçon d’histoire, de géographie, de sciences, d’EMC et d’anglais du CM2 a une fiche', () => {
    const fiches = new Set(FICHES.map((f) => f.lecon));
    expect(fiches.size).toBe(FICHES.length);
    for (const l of mesLecons) expect(fiches.has(l.id), l.id).toBe(true);
    for (const id of fiches)
      expect(
        mesLecons.some((l) => l.id === id),
        id,
      ).toBe(true);
    expect(mesLecons.filter((l) => l.matiere === 'emc').length).toBeGreaterThanOrEqual(6);
    expect(mesLecons.filter((l) => l.matiere === 'anglais').length).toBeGreaterThanOrEqual(10);
  });

  it('itemKinds = types produits ; rappel, titre et source rédigés ; au moins 3 types par leçon', () => {
    const banque = (cm2Questions as { questions: { lessonId: string; type: string }[] }).questions;
    for (const l of mesLecons) {
      const kinds = new Set(Object.keys(contenu[l.id]?.pools ?? {}));
      for (const q of banque) if (q.lessonId === l.id) kinds.add(q.type);
      expect([...l.itemKinds].sort(), l.id).toEqual([...kinds].sort());
      expect(kinds.size, l.id).toBeGreaterThanOrEqual(3);
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
      if (l.source.kind === 'generator') expect(l.source.generator.startsWith('monde-cm2/'), l.id).toBe(true);
      expect(l.jeuxSuggeres.length, l.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('monde CM2 — validité de tous les items', () => {
  for (const f of FICHES)
    it(f.lecon, () => {
      for (const kind of Object.keys(contenu[f.lecon]!.pools!) as ItemKind[]) {
        const parId = new Map<string, string>();
        for (const level of LEVELS)
          for (const seed of [1, 2, 3]) {
            const pool = items(f.lecon, kind, level, seed);
            const ou = `${f.lecon} · ${kind} · ${level}`;
            expect(pool.length, ou).toBeGreaterThan(0);
            expect(new Set(pool.map((i) => i.id)).size, `${ou} : ids en double`).toBe(pool.length);
            for (const it of pool) {
              const json = JSON.stringify(it);
              expect(checkItem(it), `${it.id} ${json}`).toEqual([]);
              expect(it.kind).toBe(kind);
              expect(it.lessonId).toBe(f.lecon);
              expect(it.explication.length, it.id).toBeGreaterThan(8);
              expect(json, it.id).not.toMatch(/undefined|NaN|\[object|TODO/);
              for (const t of textes(it)) {
                expect(t, it.id).not.toMatch(/ {2}|\s[,.]|'/);
                expect(t.trim(), it.id).toBe(t);
              }
              // Même id ⇒ même contenu (hors ordre des choix)
              const cle =
                it.kind === 'mcq'
                  ? `${it.question}=${it.choices[it.answerIndex]}`
                  : JSON.stringify({ ...it, difficulty: 0 });
              if (parId.has(it.id)) expect(parId.get(it.id), it.id).toBe(cle);
              parId.set(it.id, cle);
              // Thèmes sensibles : jamais dans la Guillotine
              if (it.meta?.sensible) expect(it.kind !== 'mcq' || !it.guillotine, it.id).toBe(true);
              if (it.kind === 'mcq' && it.guillotine && ['histoire', 'emc'].includes(lecon(f.lecon).matiere))
                expect(textes(it).join(' '), `${it.id} : thème sensible jouable à la Guillotine`).not.toMatch(
                  SENSIBLE,
                );
              if (it.kind === 'mcq') {
                if (level === 'facile') expect(it.choices.length, it.id).toBe(2);
                else expect(it.choices.length, it.id).toBeGreaterThanOrEqual(3);
                if (it.hints) {
                  expect(it.hints.length, it.id).toBeGreaterThanOrEqual(3);
                  expect(it.hints.length, it.id).toBeLessThanOrEqual(5);
                }
                if (/^\d{4}$/.test(it.choices[it.answerIndex]!))
                  expect(it.typedAnswer, it.id).toBe(it.choices[it.answerIndex]);
                if (it.lang === 'en-GB') expect(it.spoken, `${it.id} : anglais sans « spoken »`).toBeTruthy();
              }
              if (it.kind === 'map_point') {
                const carte = IDS_CARTES[it.map];
                expect(carte, it.id).toBeDefined();
                const ok = carte!.zones.includes(it.target) || !!carte!.groupes?.[it.target];
                expect(ok, `${it.id} : cible ${it.target} inconnue sur ${it.map}`).toBe(true);
              }
              if (it.kind === 'ordering') {
                expect(['chrono', 'etapes']).toContain(it.mode);
                if (it.labels) expect(it.labels.length, it.id).toBe(it.elements.length);
              }
              if (it.kind === 'pairing' && it.meta?.consigne) expect(estPaireImage(it), it.id).toBe(true);
              if (it.kind === 'oral_answer') expect(it.accepted.length, it.id).toBeGreaterThan(0);
            }
            if (kind === 'true_false' && pool.length >= 4) {
              const vrais = pool.filter((x) => x.kind === 'true_false' && x.answer).length / pool.length;
              expect(vrais, `${ou} : part de « vrai »`).toBeGreaterThan(0.25);
              expect(vrais, `${ou} : part de « vrai »`).toBeLessThan(0.76);
            }
            if (kind === 'mcq' || kind === 'true_false')
              expect(pool.length, `${ou} : au moins 4 questions`).toBeGreaterThanOrEqual(4);
          }
      }
    });
});

describe('monde CM2 — conventions et faits', () => {
  it('frises : années cohérentes et dates différentes dans une même frise', () => {
    for (const f of FICHES)
      for (const level of LEVELS)
        for (const it of contenu[f.lecon]!.pools!.ordering?.(level, createRng(5), ctxOf(lecon(f.lecon))) ??
          [])
          if (it.kind === 'ordering' && it.mode === 'chrono' && it.labels) {
            expect(new Set(it.labels).size, it.id).toBe(it.labels.length);
            const annees = it.labels
              .map(anneeDe)
              .filter((a): a is string => !!a)
              .map(Number);
            expect(
              [...annees].sort((a, b) => a - b),
              it.id,
            ).toEqual(annees);
          }
  });

  it('chaque leçon d’histoire a des devinettes « Qui suis-je ? » ou des années à saisir', () => {
    for (const f of FICHES.filter((x) => lecon(x.lecon).matiere === 'histoire')) {
      const q = qcmDe(f);
      expect(q.some((x) => x.hints) || q.some((x) => /^\d{4}$/.test(x.r)), f.lecon).toBe(true);
    }
  });

  it('les leçons d’anglais ont des paires mot ↔ image ou des QCM anglais pour Jacques a dit', () => {
    for (const f of FICHES.filter((x) => lecon(x.lecon).matiere === 'anglais')) {
      const pool = [
        ...items(f.lecon, 'mcq', 'normal'),
        ...(contenu[f.lecon]!.pools!.pairing ? items(f.lecon, 'pairing', 'normal') : []),
      ];
      expect(
        pool.some((it) => estPaireImage(it) || (it.kind === 'mcq' && it.lang === 'en-GB')),
        f.lecon,
      ).toBe(true);
    }
  });

  it('les repères officiels sont présents (euro 2000/2002, 6 fondateurs, 18 régions)', () => {
    const tout = (id: string) =>
      (Object.keys(contenu[id]!.pools!) as ItemKind[])
        .flatMap((k) => LEVELS.flatMap((l) => items(id, k, l)))
        .flatMap(textes)
        .join(' ');
    expect(tout('CM2.HI26.T6')).toMatch(/2000/);
    expect(tout('CM2.HI26.T6')).toMatch(/2002/);
    expect(tout('CM2.GE26.T3')).toMatch(/six pays fondateurs/);
    expect(tout('CM2.GE26.T1')).toMatch(/18 régions/);
    expect(tout('CM2.HI26.T4')).toMatch(/1,4 million/);
  });
});

describe('monde CM2 — jeux jouables', () => {
  it('chaque leçon a au moins 2 jeux, et chaque jeu reçoit des items à chaque niveau', async () => {
    const { gamesForLesson } = await import('@/games/registry');
    const { content } = await import('@/content');
    const { createStream } = await import('@/content/provider');
    for (const l of mesLecons) {
      const lesson = content.lessons.get(l.id)!;
      const ctx = { parentLists: [] };
      const jeux = gamesForLesson(lesson, ctx);
      expect(jeux.length, l.id).toBeGreaterThanOrEqual(2);
      const ids = jeux.map((j) => j.game.id);
      if (l.matiere === 'histoire') expect(ids, l.id).toContain('machine-temps');
      if (l.matiere === 'anglais') expect(ids, l.id).toContain('jacques-a-dit');
      if (l.matiere === 'sciences') expect(ids, l.id).toContain('laboratoire');
      if (l.matiere === 'emc') expect(ids, l.id).toContain('conseil-classe');
      if (l.id === 'CM2.GE.REPERES') expect(ids).toContain('tour-de-france');
      if (
        lesson.itemKinds.length &&
        contenu[l.id]!.pools!.mcq?.('normal', createRng(1), ctxOf(l)).every(
          (i) => i.kind === 'mcq' && !i.guillotine,
        )
      )
        expect(ids, l.id).not.toContain('guillotine');
      // Jeux dédiés : jouables aux 3 niveaux ; et au moins 2 jeux jouables à chaque niveau.
      const DEDIES = [
        'machine-temps',
        'jacques-a-dit',
        'laboratoire',
        'conseil-classe',
        'tour-de-france',
        'guillotine',
        'qui-suis-je',
      ];
      for (const level of LEVELS) {
        let jouables = 0;
        for (const { game, kind } of jeux) {
          const st = createStream(content, lesson, kind, level, createRng(3), ctx, game.filterItem);
          if (DEDIES.includes(game.id)) expect(st, `${l.id} · ${game.id} · ${level}`).not.toBeNull();
          if (!st) continue;
          jouables++;
          for (let i = 0; i < 4; i++)
            expect(game.filterItem?.(st.next()) ?? true, `${l.id} · ${game.id} · ${level}`).toBe(true);
        }
        expect(jouables, `${l.id} · ${level}`).toBeGreaterThanOrEqual(2);
      }
    }
  }, 300_000);
});
