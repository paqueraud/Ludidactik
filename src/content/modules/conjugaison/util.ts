/**
 * Outils communs du module « conjugaison » : identifiants stables (hachage du contenu essentiel),
 * construction d'items, QCM, mise en forme des phrases. Fonctions pures.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext } from '../../registry';
import type { ItemKind, ItemOf } from '../../schemas';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, Math.round(x * 100) / 100));

/** Majuscule initiale (« j’aime » → « J’aime »). */
export const majuscule = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** Hachage FNV-1a 32 bits (base 36). */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Contenu essentiel d'un item : sans l'ordre des choix, les distracteurs tirés au hasard ni la difficulté. */
function essentiel(fields: Record<string, unknown>): string {
  const f: Record<string, unknown> = { ...fields };
  delete f.difficulty;
  if (Array.isArray(f.choices) && typeof f.answerIndex === 'number') {
    f.bonne = f.choices[f.answerIndex];
    delete f.answerIndex;
  }
  delete f.choices;
  if (Array.isArray(f.pairs))
    f.pairs = (f.pairs as { left: string; right: string }[]).map((p) => `${p.left}→${p.right}`).sort();
  if (Array.isArray(f.elements))
    f.elements = (f.elements as { label: string; category: number }[])
      .map((e) => `${e.label}:${e.category}`)
      .sort();
  return JSON.stringify(f);
}

/** Construit un item (kind, id stable, lessonId). */
export function make<K extends ItemKind>(
  ctx: GenContext,
  kind: K,
  sig: string,
  fields: Omit<ItemOf<K>, 'kind' | 'id' | 'lessonId'>,
): ItemOf<K> {
  const f = fields as Record<string, unknown>;
  return {
    kind,
    id: `${ctx.lesson.id}:${kind}:${sig}:${hash(essentiel(f))}`,
    lessonId: ctx.lesson.id,
    ...fields,
  } as ItemOf<K>;
}

/** Garde au plus `n` distracteurs distincts, différents des réponses acceptées. */
export function distracteurs(rng: Rng, candidats: string[], interdits: string[], n: number): string[] {
  const bloque = new Set(interdits.map((x) => x.toLowerCase()));
  const out: string[] = [];
  for (const c of rng.shuffle([...new Set(candidats)])) {
    if (!c || bloque.has(c.toLowerCase())) continue;
    bloque.add(c.toLowerCase());
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

/** QCM : mélange la bonne réponse et les distracteurs. */
export function mcq(
  ctx: GenContext,
  rng: Rng,
  sig: string,
  f: {
    question: string;
    good: string;
    wrong: string[];
    explication: string;
    difficulty: number;
    spoken?: string;
    meta?: Record<string, unknown>;
    max?: number;
    fixedOrder?: string[];
  },
): ItemOf<'mcq'> {
  const wrong = distracteurs(rng, f.wrong, [f.good], (f.max ?? 4) - 1);
  const choices = f.fixedOrder ?? rng.shuffle([f.good, ...wrong]);
  return make(ctx, 'mcq', sig, {
    question: f.question,
    spoken: f.spoken,
    choices,
    answerIndex: choices.indexOf(f.good),
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    guillotine: true,
    meta: f.meta,
  });
}

/** Phrase à trou avec choix (la bonne réponse + distracteurs). */
export function trou(
  ctx: GenContext,
  rng: Rng,
  sig: string,
  f: {
    sentence: string;
    answer: string;
    accepted?: string[];
    wrong?: string[];
    nbChoix?: number;
    hint?: string;
    explication: string;
    difficulty: number;
    spoken?: string;
    conjugaison?: { sujet: string; verbe: string; temps: string };
    meta?: Record<string, unknown>;
  },
): ItemOf<'fill_blank'> {
  const accepted = [...new Set((f.accepted ?? []).filter((a) => a !== f.answer))];
  const choices = f.wrong
    ? rng.shuffle([f.answer, ...distracteurs(rng, f.wrong, [f.answer, ...accepted], (f.nbChoix ?? 4) - 1)])
    : undefined;
  return make(ctx, 'fill_blank', sig, {
    sentence: f.sentence,
    answer: f.answer,
    accepted: accepted.length ? accepted : undefined,
    choices: choices && choices.length >= 2 ? choices : undefined,
    hint: f.hint,
    conjugaison: f.conjugaison,
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    spoken: f.spoken,
    meta: f.meta,
  });
}

/** Vrai / faux. */
export function vraiFaux(
  ctx: GenContext,
  sig: string,
  f: { statement: string; answer: boolean; explication: string; difficulty: number; spoken?: string },
): ItemOf<'true_false'> {
  return make(ctx, 'true_false', sig, {
    statement: f.statement,
    answer: f.answer,
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    spoken: f.spoken,
  });
}

/** Tire au plus `n` éléments distincts selon une clé. */
export function distinctsPar<T>(rng: Rng, list: readonly T[], n: number, cle: (x: T) => string): T[] {
  const vus = new Set<string>();
  const out: T[] = [];
  for (const x of rng.shuffle(list)) {
    const k = cle(x);
    if (vus.has(k)) continue;
    vus.add(k);
    out.push(x);
    if (out.length >= n) break;
  }
  return out;
}

/** Choisit selon des poids : `pondere(rng, [[0.7, 'a'], [0.3, 'b']])`. */
export function pondere<T>(rng: Rng, options: readonly (readonly [number, T])[]): T {
  const total = options.reduce((s, [w]) => s + w, 0);
  let r = rng.next() * total;
  for (const [w, v] of options) {
    r -= w;
    if (r < 0) return v;
  }
  return options[options.length - 1]![1];
}
