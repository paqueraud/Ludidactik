/**
 * Outils communs du module « maths-cm2 » : identifiants stables, écriture des nombres à la française
 * (entiers jusqu'à 999 999 999, décimaux jusqu'aux millièmes), fractions en mots (dénominateurs ≤ 60,
 * 100 et 1 000), construction d'items, prénoms. Fonctions pures.
 *
 * Les décimaux sont calculés en ENTIERS (millièmes) pour éviter les erreurs d'arrondi : `r3(x)` arrondit
 * au millième, `fmt(x)` écrit « 3,45 » ou « 12 500 ».
 */
import { nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type { GenContext } from '../../registry';
import type { ItemKind, ItemOf, Level } from '../../schemas';

/** Espace insécable (séparateur des milliers). */
export const NBSP = ' ';

/** Arrondi au millième (artefacts flottants : 0,1 + 0,2). */
export const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** Nombre de chiffres après la virgule (0 à 3). */
export const nbDecimales = (x: number) => {
  const s = String(r3(Math.abs(x)));
  return s.includes('.') ? s.split('.')[1]!.length : 0;
};

/**
 * Écrit un nombre à la française : espace insécable dès 1 000 (« 1 000 », « 45 300 000 »), virgule
 * décimale (« 3,45 »). `decimales` force un nombre de chiffres après la virgule (« 2,50 » pour un prix).
 */
export function fmt(n: number, decimales?: number): string {
  const neg = n < 0;
  const abs = Math.abs(r3(n));
  const s = decimales === undefined ? String(abs) : abs.toFixed(decimales);
  const [ent = '0', dec] = s.split('.');
  const groupe = ent.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${neg ? '−' : ''}${groupe}${dec ? `,${dec}` : ''}`;
}

/** Version orale d'un nombre : « 3,45 » → « 3 virgule 45 », « 3,05 » → « 3 virgule zéro 5 ». */
export function dit(n: number): string {
  const s = String(r3(n));
  if (!s.includes('.')) return s;
  const [e, d] = s.split('.') as [string, string];
  const zeros = d.match(/^0+/)?.[0].length ?? 0;
  return `${e} virgule ${'zéro '.repeat(zeros)}${d.slice(zeros)}`;
}

/** Montant en centimes → « 3 € », « 2,05 € », « 12,45 € ». */
export function euros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  return c === 0 ? `${fmt(e)} €` : `${fmt(e)},${String(c).padStart(2, '0')} €`;
}

/** Montant en centimes « sans zéro final » : vrai si l'écriture usuelle n'a pas de zéro inutile (2,90 € exclu). */
export const centimesSansZeroFinal = (cents: number) => cents % 100 === 0 || cents % 10 !== 0;

/** Version orale d'un montant : « 2 euros 5 centimes ». */
export function eurosDits(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const pe = e ? `${e} euro${e > 1 ? 's' : ''}` : '';
  const pc = c ? `${c} centime${c > 1 ? 's' : ''}` : '';
  return [pe, pc].filter(Boolean).join(' et ') || '0 euro';
}

/** « de images » → « d’images ». */
export const de = (mot: string) => (/^[aeiouyéèêh]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
/** « que un quart » → « qu’un quart ». */
export const que = (mot: string) => (/^[aeiouyéèê]/i.test(mot) ? `qu’${mot}` : `que ${mot}`);
/** Majuscule initiale. */
export const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
/** Accord simple : `pl(3, 'bille')` → « 3 billes », `pl(1, 'cheval', 'chevaux')` → « 1 cheval ». */
export const pl = (k: number, sg: string, plu = `${sg}s`) => `${fmt(k)} ${Math.abs(k) >= 2 ? plu : sg}`;

const UNITES_DITES: Record<string, string> = {
  km: 'kilomètres',
  hm: 'hectomètres',
  dam: 'décamètres',
  m: 'mètres',
  dm: 'décimètres',
  cm: 'centimètres',
  mm: 'millimètres',
  t: 'tonnes',
  kg: 'kilogrammes',
  g: 'grammes',
  mg: 'milligrammes',
  hL: 'hectolitres',
  L: 'litres',
  dL: 'décilitres',
  cL: 'centilitres',
  mL: 'millilitres',
  'cm²': 'centimètres carrés',
  'dm²': 'décimètres carrés',
  'm²': 'mètres carrés',
  h: 'heures',
  min: 'minutes',
  s: 'secondes',
  '€': 'euros',
};
const U = 'm²|cm²|dm²|km|hm|dam|dm|cm|mm|kg|mg|hL|dL|cL|mL|min|m|g|t|L|h|s|€';

/**
 * Version orale d'un énoncé court : « 3,5 m = … cm » → « 3 virgule 5 mètres égale combien de centimètres ».
 * Les fractions « 3/4 » sont lues « 3 sur 4 » (préférer `fractionEnMots` quand c'est possible).
 */
export function dire(texte: string): string {
  return texte
    .replace(new RegExp(`… ?(${U})(?![\\p{L}²])`, 'gu'), (_, u: string) => `combien ${de(UNITES_DITES[u]!)}`)
    .replace(/(\d)[  ](?=\d{3}(?!\d))/g, '$1')
    .replace(/(\d+),(\d+)/g, (_, e: string, d: string) => dit(Number(`${e}.${d}`)))
    .replace(
      new RegExp(`(\\d) (${U})(?![\\p{L}²])`, 'gu'),
      (_, d: string, u: string) => `${d} ${UNITES_DITES[u]}`,
    )
    .replace(/(^|[^\d,])1 (\p{L}+)s(?![\p{L}])/gu, (_, avant: string, mot: string) => `${avant}1 ${mot}`)
    .replace(/(\d+)\/(\d+)/g, '$1 sur $2')
    .replace(/ = /g, ' égale ')
    .replace(/ \+ /g, ' plus ')
    .replace(/ − /g, ' moins ')
    .replace(/ × /g, ' fois ')
    .replace(/ ÷ /g, ' divisé par ')
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
  if (Array.isArray(f.elements) && f.elements.some((e) => typeof e === 'object'))
    f.elements = (f.elements as { label: string; category: number }[])
      .map((e) => `${e.label}:${e.category}`)
      .sort();
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
  const f = fields as Record<string, unknown>;
  if (typeof f.spoken === 'string' && f.spoken) f.spoken = cap(f.spoken);
  if (typeof f.difficulty === 'number') f.difficulty = clamp01(f.difficulty);
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
    hints?: string[];
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
    hints: f.hints,
    guillotine: true,
    meta: f.meta,
  });
}

/** Comparaison « < = > » (convention Crocodiles : `meta.gauche` / `meta.droite`). */
export function comparaison(
  ctx: GenContext,
  sig: string | number,
  f: {
    gauche: string;
    droite: string;
    /** Signe juste : '<', '=' ou '>'. */
    signe: '<' | '=' | '>';
    explication: string;
    difficulty: number;
    spokenGauche?: string;
    spokenDroite?: string;
  },
): ItemOf<'mcq'> {
  const choices = ['<', '=', '>'];
  return make(ctx, 'mcq', sig, {
    question: `${f.gauche} … ${f.droite}`,
    spoken: `Compare ${f.spokenGauche ?? dire(f.gauche)} et ${f.spokenDroite ?? dire(f.droite)}.`,
    choices,
    answerIndex: choices.indexOf(f.signe),
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    guillotine: true,
    meta: { gauche: f.gauche, droite: f.droite },
  });
}

/** Signe de comparaison de deux nombres. */
export const signe = (a: number, b: number): '<' | '=' | '>' =>
  Math.abs(a - b) < 1e-9 ? '=' : a < b ? '<' : '>';

/** Item numérique entier ou décimal (réponse arrondie au millième). */
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
  const a = r3(f.answer);
  return make(ctx, 'numeric_answer', sig, {
    prompt: f.prompt,
    spoken: f.spoken ?? dire(f.prompt),
    answer: a,
    decimals: nbDecimales(a),
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    unit: f.unit,
    meta: f.meta,
  });
}

/** Vrai / faux. */
export function vraiFaux(
  ctx: GenContext,
  sig: string | number,
  f: {
    statement: string;
    answer: boolean;
    explication: string;
    difficulty: number;
    spoken?: string;
    image?: string;
    meta?: Record<string, unknown>;
  },
): ItemOf<'true_false'> {
  return make(ctx, 'true_false', sig, {
    statement: f.statement,
    spoken: f.spoken,
    answer: f.answer,
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
    image: f.image,
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
  while (out.size < n && guard++ < 2000) {
    const x = rng.int(min, max);
    if (!accept || accept(x)) out.add(x);
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Fractions                                                           */
/* ------------------------------------------------------------------ */

export const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : Math.abs(a));
export const ppcm = (a: number, b: number): number => (a / pgcd(a, b)) * b;
export const frac = (n: number, d: number) => `${n}/${d}`;

/** Dénominateur autorisé au CM2 : ≤ 60, ou fraction décimale /100, /1 000 (BO n°16-2025). */
export const denominateurOk = (d: number) => (d >= 1 && d <= 60) || d === 100 || d === 1000;

const ORDINAUX_SPECIAUX: Record<number, [string, string]> = {
  2: ['demi', 'demis'],
  3: ['tiers', 'tiers'],
  4: ['quart', 'quarts'],
};

/** Nom du dénominateur : 5 → « cinquième », 21 → « vingt-et-unième », 100 → « centième ». */
export function nomDenominateur(d: number, pluriel = false): string {
  const sp = ORDINAUX_SPECIAUX[d];
  if (sp) return pluriel ? sp[1] : sp[0];
  let base = nombreEnLettres(d);
  if (base.endsWith('cinq')) base += 'u';
  else if (base.endsWith('neuf')) base = `${base.slice(0, -1)}v`;
  else if (base.endsWith('e')) base = base.slice(0, -1);
  const nom = `${base}ième`;
  return pluriel ? `${nom}s` : nom;
}

/** « 3/8 » → « trois huitièmes » ; « 1/2 » → « un demi » ; « 7/100 » → « sept centièmes ». */
export function fractionEnMots(n: number, d: number): string {
  return `${nombreEnLettres(n)} ${nomDenominateur(d, n >= 2)}`;
}

/* ------------------------------------------------------------------ */
/* Personnages (énoncés)                                               */
/* ------------------------------------------------------------------ */

export type Perso = { nom: string; il: 'il' | 'elle' };
export const PERSOS: Perso[] = [
  { nom: 'Léo', il: 'il' },
  { nom: 'Lucie', il: 'elle' },
  { nom: 'Inès', il: 'elle' },
  { nom: 'Malo', il: 'il' },
  { nom: 'Sami', il: 'il' },
  { nom: 'Jade', il: 'elle' },
  { nom: 'Noé', il: 'il' },
  { nom: 'Zoé', il: 'elle' },
  { nom: 'Hugo', il: 'il' },
  { nom: 'Lina', il: 'elle' },
  { nom: 'Adam', il: 'il' },
  { nom: 'Maya', il: 'elle' },
  { nom: 'Yanis', il: 'il' },
  { nom: 'Chloé', il: 'elle' },
  { nom: 'Ibrahim', il: 'il' },
  { nom: 'Louise', il: 'elle' },
];

/** Deux personnages différents. */
export const deuxPersos = (rng: Rng): [Perso, Perso] => {
  const [a, b] = rng.shuffle(PERSOS);
  return [a!, b!];
};
