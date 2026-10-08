/**
 * Outils communs du module « francais » : identifiants stables, constructeurs d'items, tirages.
 * Fonctions pures (le hasard passe toujours par `rng`).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext } from '../../registry';
import type { Item, ItemKind, ItemOf, Level } from '../../schemas';

/** Valeur selon le niveau : `parNiv(level, { facile: …, normal: …, plus_loin: … })`. */
export function parNiv<T>(level: Level, t: Record<Level, T>): T {
  return t[level];
}

/** Difficulté de base d'un niveau, modulée par `x` ∈ [0, 1] (adaptativité intra-niveau). */
export function diff(level: Level, x = 0.5): number {
  const base = parNiv(level, { facile: 0.1, normal: 0.4, plus_loin: 0.7 });
  return Math.round(Math.min(1, Math.max(0, base + 0.3 * x)) * 100) / 100;
}

/** Hachage FNV-1a 32 bits (base 36), pour des identifiants courts et stables. */
export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Contenu « essentiel » d'un item : ce qui est demandé et attendu (pas l'ordre des choix ni la difficulté). */
function essentiel(fields: Record<string, unknown>): string {
  const f: Record<string, unknown> = { ...fields };
  delete f.difficulty;
  if (Array.isArray(f.choices) && typeof f.answerIndex === 'number') {
    f.bonne = f.choices[f.answerIndex];
    f.choices = [...(f.choices as string[])].sort();
    delete f.answerIndex;
  } else if (Array.isArray(f.choices)) f.choices = [...(f.choices as string[])].sort();
  if (Array.isArray(f.pairs))
    f.pairs = (f.pairs as { left: string; right: string }[]).map((p) => `${p.left}→${p.right}`).sort();
  if (f.kind !== 'ordering' && Array.isArray(f.elements))
    f.elements = (f.elements as { label: string; category: number }[])
      .map((e) => `${e.label}:${e.category}`)
      .sort();
  return JSON.stringify(f);
}

/** Construit un item d'un type donné (ajoute `kind`, `id` stable et `lessonId`). */
export function make<K extends ItemKind>(
  ctx: GenContext,
  kind: K,
  sig: string,
  fields: Omit<ItemOf<K>, 'kind' | 'id' | 'lessonId'>,
): ItemOf<K> {
  const propres = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  return {
    kind,
    id: `${ctx.lesson.id}:${kind}:${sig}:${hash(essentiel({ kind, ...propres }))}`,
    lessonId: ctx.lesson.id,
    ...propres,
  } as ItemOf<K>;
}

/** Tire `n` éléments distincts (ordre aléatoire). */
export function tirer<T>(rng: Rng, list: readonly T[], n: number): T[] {
  return rng.shuffle(list).slice(0, n);
}

/** QCM : mélange la bonne réponse et des distracteurs distincts, calcule `answerIndex`. */
export function qcm(
  ctx: GenContext,
  rng: Rng,
  sig: string,
  f: {
    question: string;
    good: string;
    wrong: readonly string[];
    explication: string;
    difficulty: number;
    spoken?: string;
    meta?: Record<string, unknown>;
    hints?: string[];
    image?: string;
    /** Nombre total de choix (défaut 3). */
    max?: number;
    /** Ordre imposé des choix (ex. « . ? ! »). */
    fixedOrder?: readonly string[];
  },
): ItemOf<'mcq'> {
  const wrong = [...new Set(f.wrong.filter((w) => w !== f.good))];
  const choices = f.fixedOrder
    ? [...f.fixedOrder]
    : rng.shuffle([f.good, ...tirer(rng, wrong, (f.max ?? 3) - 1)]);
  return make(ctx, 'mcq', sig, {
    question: f.question,
    spoken: f.spoken,
    choices,
    answerIndex: choices.indexOf(f.good),
    explication: f.explication,
    difficulty: f.difficulty,
    hints: f.hints,
    image: f.image,
    guillotine: true,
    meta: f.meta,
  });
}

/** Vrai ou faux. */
export function vraiFaux(
  ctx: GenContext,
  sig: string,
  f: { statement: string; answer: boolean; explication: string; difficulty: number; spoken?: string },
): ItemOf<'true_false'> {
  return make(ctx, 'true_false', sig, f);
}

/** Paires à associer. */
export function paires(
  ctx: GenContext,
  sig: string,
  f: {
    prompt: string;
    pairs: { left: string; right: string }[];
    relation: string;
    explication: string;
    difficulty: number;
  },
): ItemOf<'pairing'> {
  return make(ctx, 'pairing', sig, f);
}

/** Classement : `elements` = [étiquette, index de catégorie] (mélangés). */
export function classer(
  ctx: GenContext,
  rng: Rng,
  sig: string,
  f: {
    prompt: string;
    categories: string[];
    elements: [string, number][];
    explication: string;
    difficulty: number;
    meta?: Record<string, unknown>;
    /** Garder l'ordre des groupes (phrase du Labo des fonctions). */
    garderOrdre?: boolean;
  },
): ItemOf<'classification'> {
  const els = f.elements.map(([label, category]) => ({ label, category }));
  return make(ctx, 'classification', sig, {
    prompt: f.prompt,
    categories: f.categories,
    elements: f.garderOrdre ? els : rng.shuffle(els),
    explication: f.explication,
    difficulty: f.difficulty,
    meta: f.meta,
  });
}

/** Éléments à remettre dans l'ordre (donnés dans le bon ordre). */
export function ordre(
  ctx: GenContext,
  sig: string,
  f: {
    prompt: string;
    elements: string[];
    mode: ItemOf<'ordering'>['mode'];
    explication: string;
    difficulty: number;
    meta?: Record<string, unknown>;
  },
): ItemOf<'ordering'> {
  return make(ctx, 'ordering', sig, f);
}

/** Phrase à trou (« ___ ») ; les choix sont mélangés. */
export function trou(
  ctx: GenContext,
  rng: Rng,
  sig: string,
  f: {
    sentence: string;
    answer: string;
    choices?: readonly string[];
    accepted?: string[];
    hint?: string;
    explication: string;
    difficulty: number;
    spoken?: string;
    meta?: Record<string, unknown>;
  },
): ItemOf<'fill_blank'> {
  return make(ctx, 'fill_blank', sig, {
    ...f,
    choices: f.choices ? rng.shuffle([...new Set(f.choices)]) : undefined,
  });
}

/** Réponse orale (lecture à voix haute ou réponse à une question entendue). */
export function oral(
  ctx: GenContext,
  sig: string,
  f: {
    prompt: string;
    answer: string;
    accepted: string[];
    explication: string;
    difficulty: number;
    spoken?: string;
  },
): ItemOf<'oral_answer'> {
  return make(ctx, 'oral_answer', sig, { ...f, accepted: [...new Set([f.answer, ...f.accepted])] });
}

/**
 * Nombre de mots d'un texte, comptés comme le Karaoké les affiche : un mot = un bloc entre deux
 * espaces qui contient au moins une lettre ou un chiffre (« cerf-volant », « l'arbre » = 1 mot ;
 * « ! » isolé = 0).
 */
export function compterMots(texte: string): number {
  return texte
    .normalize('NFC')
    .split(/[\s  ]+/)
    .filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
}

/**
 * Banque vide : bloque une dérivation automatique inadaptée (ex. un QCM de compréhension transformé
 * en vrai/faux ou en paires perdrait son texte ; des questions longues ne font pas de bonnes paires).
 */
export const aucun = (): Item[] => [];

/** Première lettre en majuscule. */
export const maj = (s: string) => (s ? s[0]!.toLocaleUpperCase('fr') + s.slice(1) : s);

/** Guillemets français avec espaces insécables. */
export const g = (s: string) => `« ${s} »`;

/** Phrase de dictionnaire : « de + voyelle » → « d’ ». */
export const de = (mot: string) => (/^[aeiouyéèêâîôûh]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
