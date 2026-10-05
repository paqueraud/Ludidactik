/**
 * Fournisseur d'items : transforme une leçon en flux d'items typés pour les jeux.
 * Sources, par priorité : modules de contenu (générateurs/banques, `modules/`), listes de mots
 * (data/dictees + parents), banques de questions (data/histoire, data/questions), puis
 * adaptateurs (`adapters.ts`) qui dérivent les types manquants. C'est le découplage contenu ↔ mécanique.
 */
import type { Rng } from '@/engine/rng';
import type { ParentWordList } from '@/services/storage/db';
import { DERIVATIONS } from './adapters';
import type { Item, McqItem, SpellingItem, TrueFalseItem } from './items';
import { CONTENU } from './modules';
import type { ContentIndex } from './parse';
import type { GenContext } from './registry';
import type { ItemKind, Lesson, Level } from './schemas';

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
    default:
      return `${item.kind}:${item.id}`;
  }
}

/* ------------------------------------------------------------------ */
/* Sources natives                                                     */
/* ------------------------------------------------------------------ */

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
    explication: lesson.rappel.startsWith('TODO') ? 'Regarde bien chaque lettre du mot.' : lesson.rappel,
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
  if (level === 'facile' && !atLevel.length) chosen = lists;
  if (level === 'normal' && !atLevel.length) chosen = lists.filter((l) => l.niveau !== 'plus_loin');
  if (level === 'plus_loin') chosen = lists.filter((l) => l.niveau !== 'facile');
  if (!chosen.length) chosen = lists;

  let words = chosen.flatMap((l) => l.mots.map((m) => make(m.mot, m.phrase, 'programme')));
  if (level === 'facile' && !atLevel.length) {
    const short = words.filter((w) => [...w.word].length <= 6);
    if (short.length >= 6) words = short;
  }
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
  return [...new Map(words.map((w) => [w.id, w])).values()];
}

function bankQuestions(index: ContentIndex, lesson: Lesson, level: Level, type: 'mcq' | 'true_false') {
  const all = index.questions.filter((q) => q.lessonId === lesson.id && q.type === type);
  const accepted: Record<Level, Level[]> = {
    facile: ['facile', 'normal'],
    normal: ['normal', 'facile'],
    plus_loin: ['plus_loin', 'normal'],
  };
  let qs = all.filter((q) => q.niveau === level);
  if (qs.length < 6) qs = all.filter((q) => accepted[level].includes(q.niveau));
  if (qs.length < 4) qs = all;
  return qs;
}

function mcqPool(index: ContentIndex, lesson: Lesson, level: Level, rng: Rng): McqItem[] {
  return bankQuestions(index, lesson, level, 'mcq').map((q) => {
    const correct = q.choix[q.bonne]!;
    let choices = [...q.choix];
    if (level === 'facile' && choices.length > 2)
      choices = [correct, rng.pick(choices.filter((_, i) => i !== q.bonne))];
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

function trueFalsePool(index: ContentIndex, lesson: Lesson, level: Level): TrueFalseItem[] {
  return bankQuestions(index, lesson, level, 'true_false').map((q) => ({
    kind: 'true_false',
    id: q.id,
    lessonId: lesson.id,
    statement: q.question,
    answer: /^vrai$/i.test(q.choix[q.bonne]!),
    explication: q.explication,
  }));
}

type Native = { gen: (target: number) => Item } | { pool: Item[] };

function nativeSource(
  index: ContentIndex,
  lesson: Lesson,
  kind: ItemKind,
  level: Level,
  rng: Rng,
  ctx: ProviderContext,
): Native | null {
  const mod = CONTENU[lesson.id];
  const gctx: GenContext = { index, lesson, parentLists: ctx.parentLists };
  const gen = mod?.gens?.[kind];
  if (gen) {
    const recent: string[] = [];
    return {
      gen: (target) => {
        let best: Item | null = null;
        for (let i = 0; i < 8; i++) {
          const cand = gen(level, rng, gctx);
          const key = itemKey(cand);
          if (recent.includes(key)) continue;
          const d = (c: Item) => Math.abs((c.difficulty ?? 0.5) - target);
          if (!best || d(cand) < d(best)) best = cand;
        }
        best ??= gen(level, rng, gctx);
        recent.push(itemKey(best));
        if (recent.length > 6) recent.shift();
        return best;
      },
    };
  }
  const pool: Item[] = [...(mod?.pools?.[kind]?.(level, rng, gctx) ?? [])];
  if (kind === 'spelling_word') pool.push(...spellingPool(index, lesson, level, ctx));
  if (kind === 'mcq') pool.push(...mcqPool(index, lesson, level, rng));
  if (kind === 'true_false') pool.push(...trueFalsePool(index, lesson, level));
  return pool.length ? { pool: [...new Map(pool.map((p) => [p.id, p])).values()] } : null;
}

/** Types natifs présents pour une leçon (sans adaptateur). */
function nativeKinds(index: ContentIndex, lesson: Lesson, ctx: ProviderContext): ItemKind[] {
  const kinds = new Set<ItemKind>();
  const mod = CONTENU[lesson.id];
  for (const k of Object.keys(mod?.gens ?? {})) kinds.add(k as ItemKind);
  for (const k of Object.keys(mod?.pools ?? {})) kinds.add(k as ItemKind);
  if (
    lesson.source.kind === 'parents'
      ? ctx.parentLists.some((l) => l.mots.length)
      : index.wordLists.some((l) => l.lessonId === lesson.id)
  )
    kinds.add('spelling_word');
  if (index.questions.some((q) => q.lessonId === lesson.id && q.type === 'mcq')) kinds.add('mcq');
  if (index.questions.some((q) => q.lessonId === lesson.id && q.type === 'true_false'))
    kinds.add('true_false');
  return [...kinds];
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

/** Types d'items disponibles pour une leçon : natifs + dérivés par adaptateur. */
export function availableKinds(index: ContentIndex, lesson: Lesson, ctx: ProviderContext): ItemKind[] {
  const native = nativeKinds(index, lesson, ctx);
  const out = new Set<ItemKind>(native);
  for (const [target, rules] of Object.entries(DERIVATIONS))
    if (rules?.some((r) => native.includes(r.from))) out.add(target as ItemKind);
  return [...out];
}

/** Échantillonne une source native (n items). */
function sample(src: Native, rng: Rng, n: number, target: number): Item[] {
  if ('gen' in src) return Array.from({ length: n }, () => src.gen(target));
  return rng.shuffle(src.pool).slice(0, n);
}

/** Construit les items dérivés d'un pool fini (pour compter et pour les flux finis). */
function derivedPool(
  kind: ItemKind,
  index: ContentIndex,
  lesson: Lesson,
  level: Level,
  rng: Rng,
  ctx: ProviderContext,
): Item[] | 'infini' | null {
  const native = nativeKinds(index, lesson, ctx);
  if (native.includes(kind)) return null;
  for (const rule of DERIVATIONS[kind] ?? []) {
    if (!native.includes(rule.from)) continue;
    const src = nativeSource(index, lesson, rule.from, level, rng, ctx);
    if (!src) continue;
    if ('gen' in src) return 'infini';
    if (rule.one) {
      const items = src.pool.map((it) => rule.one!(it, rng)).filter((x): x is Item => !!x);
      if (items.length) return items;
    } else if (rule.many) {
      const out: Item[] = [];
      for (let i = 0; i < Math.max(1, Math.floor(src.pool.length / 3)); i++) {
        const d = rule.many(rng.shuffle(src.pool), lesson.id);
        if (d) out.push(d);
      }
      if (out.length) return out;
    }
  }
  return null;
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
  const native = nativeKinds(index, lesson, ctx).includes(kind)
    ? nativeSource(index, lesson, kind, level, rng, ctx)
    : null;
  if (native) {
    if ('gen' in native) return Infinity;
    return filter ? native.pool.filter(filter).length : native.pool.length;
  }
  const d = derivedPool(kind, index, lesson, level, rng, ctx);
  if (d === 'infini') return Infinity;
  if (!d) return 0;
  return filter ? d.filter(filter).length : d.length;
}

/** Flux cyclique sur une liste : items à revoir (Leitner) d'abord, puis mélange ; on recycle en remélangeant. */
function cyclic(pool: Item[], rng: Rng, ctx: ProviderContext): ItemStream {
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

export function createStream(
  index: ContentIndex,
  lesson: Lesson,
  kind: ItemKind,
  level: Level,
  rng: Rng,
  ctx: ProviderContext,
  filter?: ItemFilter,
): ItemStream | null {
  const ok = (it: Item | null): it is Item => !!it && (!filter || filter(it));

  // 1. Source native
  if (nativeKinds(index, lesson, ctx).includes(kind)) {
    const src = nativeSource(index, lesson, kind, level, rng, ctx);
    if (!src) return null;
    if ('gen' in src) {
      return {
        size: null,
        next(target = 0.5) {
          for (let i = 0; i < 20; i++) {
            const it = src.gen(target);
            if (ok(it)) return it;
          }
          return src.gen(target);
        },
      };
    }
    const pool = src.pool.filter((it) => ok(it));
    return pool.length ? cyclic(pool, rng, ctx) : null;
  }

  // 2. Dérivation depuis un autre type
  for (const rule of DERIVATIONS[kind] ?? []) {
    if (!nativeKinds(index, lesson, ctx).includes(rule.from)) continue;
    const src = nativeSource(index, lesson, rule.from, level, rng, ctx);
    if (!src) continue;
    if ('gen' in src) {
      return {
        size: null,
        next(target = 0.5) {
          for (let i = 0; i < 30; i++) {
            const d = rule.one
              ? rule.one(src.gen(target), rng)
              : rule.many!(sample(src, rng, 10, target), lesson.id);
            if (ok(d)) return d;
          }
          throw new Error(`Impossible de dériver un item ${kind} pour ${lesson.id}`);
        },
      };
    }
    const d = derivedPool(kind, index, lesson, level, rng, ctx);
    if (Array.isArray(d)) {
      const pool = d.filter((it) => ok(it));
      if (pool.length) return cyclic(pool, rng, ctx);
    }
  }
  return null;
}
