/**
 * Fournisseur d'items : transforme une leçon (générateur, listes de mots, banque de questions,
 * listes parentales) en flux d'items typés pour les jeux. C'est le découplage contenu ↔ mécanique.
 */
import type { Rng } from '@/engine/rng';
import type { ParentWordList } from '@/services/storage/db';
import { CALC_GENERATORS } from './generators/calcul';
import type { ContentIndex } from './parse';
import type { Item, ItemKind, Lesson, Level, McqItem, NumericItem, SpellingItem } from './schemas';

export interface ProviderContext {
  /** Listes de mots saisies par les parents (pour ce profil). */
  parentLists: ParentWordList[];
  /** Clés d'items à revoir en priorité (Leitner). */
  aRevoir?: Set<string>;
}

/** Flux d'items : infini (générateur) ou cyclique (liste). */
export interface ItemStream {
  /** `target` = difficulté visée dans [0, 1] (adaptativité intra-niveau). */
  next(target?: number): Item;
  /** Nombre d'items distincts (null = infini). */
  size: number | null;
}

export type ItemFilter = (item: Item) => boolean;

/** Clé stable d'un item pour la répétition espacée. */
export function itemKey(item: Item): string {
  switch (item.kind) {
    case 'spelling_word':
      return `mot:${item.word.toLowerCase()}`;
    case 'numeric_answer':
      return `calc:${item.prompt}`;
    case 'mcq':
      return `q:${item.id}`;
  }
}

/* ------------------------------------------------------------------ */
/* Résolveurs par type d'item                                          */
/* ------------------------------------------------------------------ */

function calcGenerator(lesson: Lesson) {
  return lesson.source.kind === 'generator' ? CALC_GENERATORS[lesson.source.generator] : undefined;
}

function spellingPool(
  index: ContentIndex,
  lesson: Lesson,
  level: Level,
  ctx: ProviderContext,
): SpellingItem[] {
  const make = (
    word: string,
    sentence: string | undefined,
    source: SpellingItem['source'],
    extra: Partial<SpellingItem> = {},
  ): SpellingItem => ({
    kind: 'spelling_word',
    id: `${source}:${word}`,
    lessonId: lesson.id,
    word,
    sentence,
    isSentence: false,
    source,
    explication: lesson.rappel,
    ...extra,
  });

  if (lesson.source.kind === 'parents') {
    return ctx.parentLists.flatMap((l) =>
      l.mots.map((m) =>
        make(m.mot, m.phrase, 'parents', { audioKey: m.audioKey, id: `parents:${l.id}:${m.mot}` }),
      ),
    );
  }

  const lists = index.wordLists.filter((l) => l.lessonId === lesson.id);
  if (!lists.length) return [];
  const atLevel = lists.filter((l) => l.niveau === level);
  let chosen = atLevel;
  if (level === 'facile' && !atLevel.length) chosen = lists; // repli : mots courts ci-dessous
  if (level === 'normal' && !atLevel.length) chosen = lists.filter((l) => l.niveau !== 'plus_loin');
  if (level === 'plus_loin') chosen = lists.filter((l) => l.niveau !== 'facile');
  if (!chosen.length) chosen = lists;

  let words = chosen.flatMap((l) => l.mots.map((m) => make(m.mot, m.phrase, 'programme')));
  if (level === 'facile' && !atLevel.length) {
    const short = words.filter((w) => [...w.word].length <= 6);
    if (short.length >= 6) words = short;
  }
  // Pour aller plus loin : dictée de phrases (mot de la leçon « mots fréquents »)
  if (level === 'plus_loin' && /ORTH\.MOTS/.test(lesson.id)) {
    const sentences = index.sentences
      .filter((s) => s.classe === lesson.classe && s.niveau !== 'facile')
      .map((s) =>
        make(s.phrase, undefined, 'programme', {
          id: `phrase:${s.phrase}`,
          isSentence: true,
          explication: `Attention aux accords : ${s.notions.join(', ')}.`,
        }),
      );
    words = [...words, ...sentences];
  }
  // dédoublonnage
  return [...new Map(words.map((w) => [w.id, w])).values()];
}

function mcqPool(index: ContentIndex, lesson: Lesson, level: Level, rng: Rng): McqItem[] {
  const all = index.questions.filter((q) => q.lessonId === lesson.id);
  const accepted: Record<Level, Level[]> = {
    facile: ['facile', 'normal'],
    normal: ['normal', 'facile'],
    plus_loin: ['plus_loin', 'normal'],
  };
  let qs = all.filter((q) => q.niveau === level);
  if (qs.length < 6) qs = all.filter((q) => accepted[level].includes(q.niveau));
  if (qs.length < 4) qs = all;
  return qs.map((q) => {
    const correct = q.choix[q.bonne]!;
    let choices = [...q.choix];
    if (level === 'facile' && choices.length > 2) {
      const distractors = choices.filter((_, i) => i !== q.bonne);
      choices = [correct, rng.pick(distractors)];
    }
    choices = rng.shuffle(choices);
    return {
      kind: 'mcq',
      id: q.id,
      lessonId: lesson.id,
      question: q.question,
      choices,
      answerIndex: choices.indexOf(correct),
      typedAnswer: /^\d{4}$/.test(correct) ? correct : undefined,
      explication: q.explication,
      guillotine: q.guillotine,
    };
  });
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

/** Types d'items réellement disponibles pour une leçon (contenu présent). */
export function availableKinds(index: ContentIndex, lesson: Lesson, ctx: ProviderContext): ItemKind[] {
  const kinds: ItemKind[] = [];
  if (calcGenerator(lesson)) kinds.push('numeric_answer');
  if (
    lesson.source.kind === 'parents'
      ? ctx.parentLists.some((l) => l.mots.length)
      : index.wordLists.some((l) => l.lessonId === lesson.id)
  )
    kinds.push('spelling_word');
  if (index.questions.some((q) => q.lessonId === lesson.id)) kinds.push('mcq');
  return kinds;
}

/** Nombre d'items distincts disponibles (Infinity pour un générateur). */
export function countItems(
  index: ContentIndex,
  lesson: Lesson,
  kind: ItemKind,
  level: Level,
  rng: Rng,
  ctx: ProviderContext,
  filter?: ItemFilter,
): number {
  if (kind === 'numeric_answer') return calcGenerator(lesson) ? Infinity : 0;
  const pool =
    kind === 'spelling_word'
      ? spellingPool(index, lesson, level, ctx)
      : kind === 'mcq'
        ? mcqPool(index, lesson, level, rng)
        : [];
  return filter ? pool.filter(filter).length : pool.length;
}

export function createStream(
  index: ContentIndex,
  lesson: Lesson,
  kind: ItemKind,
  level: Level,
  rng: Rng,
  ctx: ProviderContext,
  filter?: ItemFilter,
): ItemStream | null {
  if (kind === 'numeric_answer') {
    const gen = calcGenerator(lesson);
    if (!gen) return null;
    const recent: string[] = [];
    let n = 0;
    return {
      size: null,
      next(target = 0.5) {
        let best: NumericItem | null = null;
        for (let i = 0; i < 8; i++) {
          const s = gen(level, rng);
          if (recent.includes(s.prompt)) continue;
          const cand: NumericItem = {
            ...s,
            kind: 'numeric_answer',
            id: `${lesson.id}#${n}`,
            lessonId: lesson.id,
          };
          if (!best || Math.abs(cand.difficulty - target) < Math.abs(best.difficulty - target)) best = cand;
        }
        best ??= { ...gen(level, rng), kind: 'numeric_answer', id: `${lesson.id}#${n}`, lessonId: lesson.id };
        n++;
        recent.push(best.prompt);
        if (recent.length > 6) recent.shift();
        return best;
      },
    };
  }

  let pool: Item[] =
    kind === 'spelling_word'
      ? spellingPool(index, lesson, level, ctx)
      : kind === 'mcq'
        ? mcqPool(index, lesson, level, rng)
        : [];
  if (filter) pool = pool.filter(filter);
  if (!pool.length) return null;

  // Ordre : items à revoir (Leitner) d'abord, puis le reste mélangé ; on recycle en remélangeant.
  const order = () => {
    const shuffled = rng.shuffle(pool);
    if (!ctx.aRevoir?.size) return shuffled;
    const weak = shuffled.filter((i) => ctx.aRevoir!.has(itemKey(i)));
    return [...weak, ...shuffled.filter((i) => !ctx.aRevoir!.has(itemKey(i)))];
  };
  let queue = order();
  let last: Item | null = null;
  return {
    size: pool.length,
    next() {
      if (!queue.length) {
        queue = order();
        if (queue.length > 1 && last && queue[0]!.id === last.id) queue.push(queue.shift()!);
      }
      last = queue.shift()!;
      return last;
    },
  };
}
