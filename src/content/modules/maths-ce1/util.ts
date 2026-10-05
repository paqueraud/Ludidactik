/**
 * Outils communs du module « maths-ce1 » : identifiants stables, écriture des nombres à la française,
 * fractions en mots, construction d'items. Fonctions pures.
 */
import { nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type { GenContext } from '../../registry';
import type { ItemKind, ItemOf, Level } from '../../schemas';

export const NBSP = ' ';

/** Écrit un entier à la française, avec espace insécable dès 1 000 (« 1 000 », « 4 562 »). */
export function fmt(n: number): string {
  if (!Number.isInteger(n)) return String(n).replace('.', ',');
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return n < 0 ? `−${s}` : s;
}

/** Montant en centimes → « 3 € », « 2,05 € ». */
export function euros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  return c === 0 ? `${fmt(e)} €` : `${fmt(e)},${String(c).padStart(2, '0')} €`;
}

/** Version orale d'un montant : « 2 euros 5 centimes ». */
export function eurosDits(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const pe = e ? `${e} euro${e > 1 ? 's' : ''}` : '';
  const pc = c ? `${c} centime${c > 1 ? 's' : ''}` : '';
  return [pe, pc].filter(Boolean).join(' et ') || '0 euro';
}

/** « de images » → « d’images ». */
export const de = (mot: string) => (/^[aeiouyéèê]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
/** « que un quart » → « qu’un quart ». */
export const que = (mot: string) => (/^[aeiouyéèê]/i.test(mot) ? `qu’${mot}` : `que ${mot}`);

const UNITES_DITES: Record<string, string> = {
  km: 'kilomètres',
  m: 'mètres',
  dm: 'décimètres',
  cm: 'centimètres',
  mm: 'millimètres',
  kg: 'kilogrammes',
  g: 'grammes',
  h: 'heures',
  min: 'minutes',
  '€': 'euros',
  c: 'centimes',
};

/** Version orale d'un énoncé court : « 1 m = … cm » → « 1 mètre égale combien de centimètres ». */
export function dire(texte: string): string {
  return texte
    .replace(
      /… ?(km|dm|cm|mm|kg|min|m|g|h|€|c)(?![\p{L}])/gu,
      (_, u: string) => `combien ${de(UNITES_DITES[u]!)}`,
    )
    .replace(/… (\p{L}+)/gu, (_, mot: string) => `combien ${de(mot)}`)
    .replace(
      /(\d) (km|dm|cm|mm|kg|min|m|g|h|€|c)(?![\p{L}])/gu,
      (_, d: string, u: string) => `${d} ${UNITES_DITES[u]}`,
    )
    .replace(/(^|[^\d])1 (\p{L}+)s(?![\p{L}])/gu, (_, avant: string, mot: string) => `${avant}1 ${mot}`)
    .replace(/ = /g, ' égale ')
    .replace(/ \+ /g, ' plus ')
    .replace(/ − /g, ' moins ')
    .replace(/…/g, 'combien');
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, Math.round(x * 100) / 100));

/** Les 3 niveaux sous forme de table : `parNiv(level, { facile: …, normal: …, plus_loin: … })`. */
export function parNiv<T>(level: Level, t: Record<Level, T>): T {
  return t[level];
}

/** Hachage FNV-1a 32 bits (base 36), pour des identifiants courts et stables. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Contenu « essentiel » d'un item : ce qui est demandé et ce qui est attendu. L'ordre des choix, les
 * distracteurs tirés au hasard et la difficulté n'en font pas partie.
 */
function essentiel(fields: Record<string, unknown>): string {
  const f: Record<string, unknown> = { ...fields };
  delete f.difficulty;
  if (Array.isArray(f.choices) && typeof f.answerIndex === 'number') {
    f.bonne = f.choices[f.answerIndex];
    delete f.choices;
    delete f.answerIndex;
  }
  if (Array.isArray(f.pairs))
    f.pairs = (f.pairs as { left: string; right: string }[]).map((p) => `${p.left}→${p.right}`).sort();
  if (Array.isArray(f.reformulations)) f.reformulations = [...(f.reformulations as string[])].sort();
  return JSON.stringify(f);
}

/**
 * Identifiant stable : même contenu essentiel → même id (le fournisseur évite ainsi les répétitions
 * et la répétition espacée retrouve l'item). `sig` est un préfixe lisible.
 */
export function itemId(
  ctx: GenContext,
  kind: ItemKind,
  sig: string | number,
  fields: Record<string, unknown>,
): string {
  return `${ctx.lesson.id}:${kind}:${sig}:${hash(essentiel(fields))}`;
}

/** Construit un item d'un type donné en ajoutant `kind`, `id` et `lessonId`. */
export function make<K extends ItemKind>(
  ctx: GenContext,
  kind: K,
  sig: string | number,
  fields: Omit<ItemOf<K>, 'kind' | 'id' | 'lessonId'>,
): ItemOf<K> {
  return {
    kind,
    id: itemId(ctx, kind, sig, fields as Record<string, unknown>),
    lessonId: ctx.lesson.id,
    ...fields,
  } as ItemOf<K>;
}

/** QCM : mélange la bonne réponse et les distracteurs (dédoublonnés), calcule `answerIndex`. */
export function mcq(
  ctx: GenContext,
  rng: Rng,
  sig: string | number,
  f: {
    question: string;
    good: string;
    wrong: string[];
    explication: string;
    difficulty: number;
    spoken?: string;
    image?: string;
    meta?: Record<string, unknown>;
    max?: number;
    /** Garder l'ordre donné (ex. « < = > »). */
    fixedOrder?: string[];
  },
): ItemOf<'mcq'> {
  const wrong = [...new Set(f.wrong.filter((w) => w !== f.good))];
  let choices: string[];
  if (f.fixedOrder) choices = f.fixedOrder;
  else choices = rng.shuffle([f.good, ...rng.shuffle(wrong).slice(0, (f.max ?? 4) - 1)]);
  return make(ctx, 'mcq', sig, {
    question: f.question,
    spoken: f.spoken,
    choices,
    answerIndex: choices.indexOf(f.good),
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    image: f.image,
    guillotine: true,
    meta: f.meta,
  });
}

/** Item numérique entier ou décimal. */
export function numeric(
  ctx: GenContext,
  sig: string | number,
  f: {
    prompt: string;
    spoken?: string;
    answer: number;
    explication: string;
    difficulty: number;
    unit?: string;
    meta?: Record<string, unknown>;
  },
): ItemOf<'numeric_answer'> {
  const a = Math.round(f.answer * 1000) / 1000;
  const s = String(a);
  return make(ctx, 'numeric_answer', sig, {
    prompt: f.prompt,
    spoken: f.spoken ?? f.prompt.replace(/…/g, 'combien').replace(/\//g, ' sur '),
    answer: a,
    decimals: s.includes('.') ? s.split('.')[1]!.length : 0,
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    unit: f.unit,
    meta: f.meta,
  });
}

/** Tire `n` éléments distincts. */
export function sampleDistinct<T>(rng: Rng, list: readonly T[], n: number): T[] {
  return rng.shuffle(list).slice(0, n);
}

/** Tire `n` entiers distincts dans [min, max]. */
export function distinctInts(rng: Rng, n: number, min: number, max: number, accept?: (x: number) => boolean) {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < n && guard++ < 1000) {
    const x = rng.int(min, max);
    if (!accept || accept(x)) out.add(x);
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Fractions                                                           */
/* ------------------------------------------------------------------ */

/** Dénominateurs du CE1 (BO n°41-2024). */
export const DENOMS_CE1 = [2, 3, 4, 5, 6, 8, 10] as const;

const NOM_PART: Record<number, [string, string]> = {
  2: ['demi', 'demis'],
  3: ['tiers', 'tiers'],
  4: ['quart', 'quarts'],
  5: ['cinquième', 'cinquièmes'],
  6: ['sixième', 'sixièmes'],
  8: ['huitième', 'huitièmes'],
  10: ['dixième', 'dixièmes'],
};

/** « 3/8 » → « trois huitièmes » ; « 1/2 » → « un demi ». */
export function fractionEnMots(n: number, d: number): string {
  const [sg, pl] = NOM_PART[d] ?? [`${d}e`, `${d}es`];
  return `${nombreEnLettres(n)} ${n > 1 ? pl : sg}`;
}

export const frac = (n: number, d: number) => `${n}/${d}`;
export const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : a);
