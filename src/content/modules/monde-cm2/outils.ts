/**
 * Outils du module « monde-cm2 » : chaque leçon est décrite par une **fiche** déclarative (faits vérifiés,
 * rangés par niveau) que ces fonctions transforment en banques d'items typés (`pools`).
 *
 * Niveaux d'une entrée (`niv`) :
 * - `f` : fait essentiel (Facile, repris en Normal) ;
 * - `n` : repère attendu du BO (Normal, repris en Plus loin) ;
 * - `p` : au-delà de l'attendu (Plus loin seulement).
 *
 * Règles communes : Facile = QCM à 2 choix ; Normal et Plus loin = 4 choix ; les années sont saisissables
 * (`typedAnswer`) ; une entrée sensible (guerres, Shoah, esclavage, Terreur, exécutions, travail des enfants,
 * colonisation) n'est jamais jouée dans la Guillotine (`guillotine: false`) et porte `meta.sensible`.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemPool, LessonContent } from '../../registry';
import type {
  ClassificationItem,
  ItemKind,
  Level,
  MapPointItem,
  McqItem,
  OralItem,
  OrderingItem,
  PairingItem,
  TrueFalseItem,
} from '../../schemas';

export type Niv = 'f' | 'n' | 'p';
export type Carte = 'france-regions' | 'france-fleuves' | 'france-massifs' | 'europe' | 'monde';

interface Commun {
  /** Identifiant local, unique dans la fiche et stable. */
  id: string;
  niv: Niv;
  /** Explication d'une phrase, pour un enfant de 10 ans. */
  e: string;
  /** Thème sensible (s'ajoute au réglage de la fiche). */
  sens?: boolean;
  meta?: Record<string, unknown>;
}

/** QCM : `r` = bonne réponse ; `f` = distracteurs (le 1er sert au niveau Facile). */
export interface Qcm extends Commun {
  q: string;
  r: string;
  f: string[];
  /** Indices de « Qui suis-je ? », du plus difficile au plus facile. */
  hints?: string[];
  img?: string;
  typed?: string;
  /** Texte entendu (anglais : le mot ou la phrase à écouter). */
  spoken?: string;
  /** `false` : jamais dans la Guillotine (situation de vie), sans être un thème sensible. */
  g?: false;
  /** Question en français dans une leçon d'anglais (pas de voix anglaise). */
  fr?: true;
}

export interface Vf extends Commun {
  s: string;
  v: boolean;
  img?: string;
  spoken?: string;
}

/** Événement daté d'une frise : `t` = clé de tri (1789.0714), `date` = étiquette affichée. */
export interface Evt {
  id: string;
  niv: Niv;
  label: string;
  date: string;
  t: number;
  sens?: boolean;
  /** Explication propre à l'événement (QCM « en quelle année ? »). */
  e?: string;
  /** Événements d'un même groupe jamais réunis (même fait à deux précisions). */
  excl?: string;
  /** Niveau du QCM « en quelle année ? » (défaut : `niv`) ; `null` = pas de question d'année. */
  nivAnnee?: Niv | null;
}

export interface Lieu extends Commun {
  map: Carte;
  target: string;
  /** Nom avec l'article (« la Bretagne », « les Alpes », « Mayotte »). */
  label: string;
  prompt?: string;
}

export interface Paires extends Commun {
  prompt: string;
  relation: string;
  pairs: [string, string][];
  /** Modèle de consigne de Jacques a dit (« point to {mot} »). */
  consigne?: string;
}

export interface Classement extends Commun {
  prompt: string;
  cats: string[];
  /** [étiquette, index de catégorie, image facultative] */
  els: [string, number, string?][];
}

export interface Etapes extends Commun {
  prompt: string;
  /** Éléments dans le bon ordre. */
  els: string[];
  /** Frise datée (mode chrono) : étiquettes révélées après réponse. */
  labels?: string[];
  cycle?: boolean;
}

export interface Oral extends Commun {
  prompt: string;
  r: string;
  ok: string[];
  spoken?: string;
}

export interface Fiche {
  lecon: string;
  /** Toute la leçon est un thème sensible. */
  sens?: boolean;
  /** Leçon d'anglais : QCM, paires et oral en `en-GB`. */
  en?: boolean;
  qcm?: Qcm[];
  vf?: Vf[];
  /** Événements datés → frises, paires date ↔ événement et QCM « en quelle année ? ». */
  evts?: Evt[];
  lieux?: Lieu[];
  paires?: Paires[];
  classements?: Classement[];
  etapes?: Etapes[];
  oral?: Oral[];
}

/* ------------------------------------------------------------------ */
/* Choix des entrées selon le niveau                                   */
/* ------------------------------------------------------------------ */

const NIVEAUX: Record<Level, Niv[]> = { facile: ['f'], normal: ['f', 'n'], plus_loin: ['n', 'p'] };
const REPLI: Record<Level, Niv[]> = { facile: ['n'], normal: ['p'], plus_loin: ['f'] };
const DIFF: Record<Niv, number> = { f: 0.2, n: 0.5, p: 0.8 };

/** Entrées du niveau ; si elles sont moins de `min`, on complète avec le niveau voisin. */
export function duNiveau<T extends { niv: Niv }>(list: readonly T[], level: Level, min = 1): T[] {
  let out = list.filter((x) => NIVEAUX[level].includes(x.niv));
  if (out.length < min) out = [...out, ...list.filter((x) => REPLI[level].includes(x.niv))];
  return out.length || min === 0 ? out : [...list];
}

/* ------------------------------------------------------------------ */
/* Construction des items                                              */
/* ------------------------------------------------------------------ */

function commun(f: Fiche, x: Commun | Evt, code: string, ctx: GenContext) {
  const sens = !!(f.sens || x.sens);
  const meta = { ...('meta' in x ? x.meta : undefined), ...(sens ? { sensible: true } : {}) };
  return {
    sens,
    base: {
      id: `${f.lecon}:${code}:${x.id}`,
      lessonId: ctx.lesson.id,
      difficulty: DIFF[x.niv],
      ...(Object.keys(meta).length ? { meta } : {}),
    },
  };
}

const lang = (f: Fiche) => (f.en ? { lang: 'en-GB' as const } : {});

function mcq(f: Fiche, q: Qcm, level: Level, rng: Rng, ctx: GenContext): McqItem {
  const { sens, base } = commun(f, q, 'qcm', ctx);
  const faux = level === 'facile' ? q.f.slice(0, 1) : rng.shuffle(q.f).slice(0, 3);
  const choices = rng.shuffle([q.r, ...faux]);
  const typed = q.typed ?? (/^\d{4}$/.test(q.r) ? q.r : undefined);
  return {
    kind: 'mcq',
    ...base,
    question: q.q,
    choices,
    answerIndex: choices.indexOf(q.r),
    ...(typed ? { typedAnswer: typed } : {}),
    ...(q.hints ? { hints: q.hints } : {}),
    ...(q.img ? { image: q.img } : {}),
    ...(q.spoken ? { spoken: q.spoken } : {}),
    ...(q.fr ? {} : lang(f)),
    guillotine: !sens && q.g !== false,
    explication: q.e,
  };
}

function trueFalse(f: Fiche, v: Vf, ctx: GenContext): TrueFalseItem {
  const { base } = commun(f, v, 'vf', ctx);
  return {
    kind: 'true_false',
    ...base,
    statement: v.s,
    answer: v.v,
    ...(v.img ? { image: v.img } : {}),
    ...(v.spoken ? { spoken: v.spoken, ...lang(f) } : {}),
    explication: v.e,
  };
}

function mapPoint(f: Fiche, l: Lieu, ctx: GenContext): MapPointItem {
  const { base } = commun(f, l, 'carte', ctx);
  return {
    kind: 'map_point',
    ...base,
    prompt: l.prompt ?? `Touche ${l.label}.`,
    map: l.map,
    target: l.target,
    targetLabel: l.label,
    explication: l.e,
  };
}

function pairing(f: Fiche, p: Paires, ctx: GenContext): PairingItem {
  const { base } = commun(f, p, 'paires', ctx);
  const item: PairingItem = {
    kind: 'pairing',
    ...base,
    prompt: p.prompt,
    pairs: p.pairs.map(([left, right]) => ({ left, right })),
    relation: p.relation,
    ...lang(f),
    explication: p.e,
  };
  if (p.consigne) item.meta = { ...item.meta, consigne: p.consigne };
  return item;
}

function classification(f: Fiche, c: Classement, ctx: GenContext): ClassificationItem {
  const { base } = commun(f, c, 'classe', ctx);
  return {
    kind: 'classification',
    ...base,
    prompt: c.prompt,
    categories: c.cats,
    elements: c.els.map(([label, category, image]) => ({ label, category, ...(image ? { image } : {}) })),
    explication: c.e,
  };
}

function ordering(f: Fiche, o: Etapes, ctx: GenContext): OrderingItem {
  const { base } = commun(f, o, 'ordre', ctx);
  const item: OrderingItem = {
    kind: 'ordering',
    ...base,
    prompt: o.prompt,
    elements: o.els,
    ...(o.labels ? { labels: o.labels } : {}),
    mode: o.labels ? 'chrono' : 'etapes',
    ...lang(f),
    explication: o.e,
  };
  if (o.cycle) item.meta = { ...item.meta, cycle: true };
  return item;
}

function oral(f: Fiche, o: Oral, ctx: GenContext): OralItem {
  const { base } = commun(f, o, 'oral', ctx);
  return {
    kind: 'oral_answer',
    ...base,
    prompt: o.prompt,
    answer: o.r,
    accepted: o.ok,
    ...(o.spoken ? { spoken: o.spoken } : {}),
    ...lang(f),
    explication: o.e,
  };
}

/* ------------------------------------------------------------------ */
/* Frises : ordres chronologiques, paires date ↔ événement, années     */
/* ------------------------------------------------------------------ */

const TAILLE_FRISE: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };
const TAILLE_PAIRES: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };

/** Tire `k` événements aux dates toutes différentes, rangés du plus ancien au plus récent. */
function tirerEvts(evts: readonly Evt[], k: number, rng: Rng): Evt[] | null {
  const out: Evt[] = [];
  for (const e of rng.shuffle(evts)) {
    if (out.some((o) => o.t === e.t || o.date === e.date || o.label === e.label || (!!e.excl && o.excl === e.excl)))
      continue;
    out.push(e);
    if (out.length === k) break;
  }
  return out.length >= Math.min(k, 3) ? out.sort((a, b) => a.t - b.t) : null;
}

const ESSAIS = 10;

function frises(f: Fiche, level: Level, rng: Rng, ctx: GenContext): OrderingItem[] {
  const evts = level === 'plus_loin' ? (f.evts ?? []) : duNiveau(f.evts ?? [], level, 4);
  const out = new Map<string, OrderingItem>();
  for (let i = 0; i < ESSAIS; i++) {
    const sel = tirerEvts(evts, TAILLE_FRISE[level], rng);
    if (!sel) break;
    const sens = sel.some((e) => e.sens);
    const o: Etapes = {
      id: sel.map((e) => e.id).join('+'),
      niv: sel.some((e) => e.niv === 'p') ? 'p' : sel.some((e) => e.niv === 'n') ? 'n' : 'f',
      prompt: 'Range ces événements du plus ancien au plus récent.',
      els: sel.map((e) => e.label),
      labels: sel.map((e) => e.date),
      sens,
      e: `Dans l’ordre : ${sel.map((e) => `${e.label} (${e.date})`).join(', puis ')}.`,
    };
    const it = ordering(f, o, ctx);
    it.id = `${f.lecon}:frise:${o.id}`;
    out.set(it.id, it);
  }
  return [...out.values()];
}

function pairesDates(f: Fiche, level: Level, rng: Rng, ctx: GenContext): PairingItem[] {
  const evts = duNiveau(f.evts ?? [], level, 4);
  const out = new Map<string, PairingItem>();
  for (let i = 0; i < ESSAIS; i++) {
    const sel = tirerEvts(evts, TAILLE_PAIRES[level], rng);
    if (!sel) break;
    const p: Paires = {
      id: sel.map((e) => e.id).join('+'),
      niv: sel.some((e) => e.niv === 'p') ? 'p' : sel.some((e) => e.niv === 'n') ? 'n' : 'f',
      prompt: 'Associe chaque date à son événement.',
      relation: 'date → événement',
      pairs: sel.map((e) => [e.date, e.label]),
      sens: sel.some((e) => e.sens),
      e: sel.map((e) => `${e.date} : ${e.label}`).join(' ; ') + '.',
    };
    const it = pairing(f, p, ctx);
    it.id = `${f.lecon}:dates:${p.id}`;
    out.set(it.id, it);
  }
  return [...out.values()];
}

/** Année unique d'un événement (« 14 juillet 1789 » → 1789 ; « 1914-1918 » → null). */
export function anneeDe(date: string): string | null {
  const m = date.match(/\b\d{4}\b/g);
  return m && m.length === 1 && !/\d{4}\s*[-–]/.test(date) ? m[0]! : null;
}

/** QCM « en quelle année ? » tirés des événements datés (distracteurs : autres années de la frise). */
export function qcmAnnees(f: Fiche): Qcm[] {
  const evts = (f.evts ?? []).filter((e) => anneeDe(e.date) && e.nivAnnee !== null);
  const annees = [...new Set(evts.map((e) => Number(anneeDe(e.date))))];
  return evts.map((e) => {
    const a = Number(anneeDe(e.date));
    const autres = annees.filter((x) => x !== a).sort((x, y) => Math.abs(x - a) - Math.abs(y - a));
    for (const d of [10, -10, 1, -1, 20, -20, 2, -2]) if (autres.length < 4) autres.push(a + d);
    const loin = [...autres].sort((x, y) => Math.abs(y - a) - Math.abs(x - a))[0]!;
    const proches = autres.filter((x) => x !== loin).slice(0, 4);
    return {
      id: `annee-${e.id}`,
      niv: e.nivAnnee ?? e.niv,
      q: `« ${e.label} » : en quelle année ?`,
      r: String(a),
      f: [loin, ...proches].map(String),
      sens: e.sens,
      e: e.e ?? `${e.label} : ${e.date}.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Fiche → contenu de leçon                                            */
/* ------------------------------------------------------------------ */

/** Toutes les entrées QCM d'une fiche (rédigées + années de la frise). */
export const qcmDe = (f: Fiche): Qcm[] => [...(f.qcm ?? []), ...qcmAnnees(f)];

/** Transforme une fiche en banques d'items par type. */
export function contenuDe(f: Fiche): LessonContent {
  const pools: Partial<Record<ItemKind, ItemPool>> = {};
  const qcm = qcmDe(f);
  if (qcm.length) pools.mcq = (level, rng, ctx) => duNiveau(qcm, level, 4).map((q) => mcq(f, q, level, rng, ctx));
  if (f.vf?.length) pools.true_false = (level, _rng, ctx) => duNiveau(f.vf!, level, 4).map((v) => trueFalse(f, v, ctx));
  if (f.lieux?.length) pools.map_point = (level, _rng, ctx) => duNiveau(f.lieux!, level, 3).map((l) => mapPoint(f, l, ctx));
  if (f.classements?.length)
    pools.classification = (level, _rng, ctx) => duNiveau(f.classements!, level).map((c) => classification(f, c, ctx));
  if (f.evts?.length || f.etapes?.length)
    pools.ordering = (level, rng, ctx) => [
      ...(f.evts?.length ? frises(f, level, rng, ctx) : []),
      ...duNiveau(f.etapes ?? [], level, f.evts?.length ? 0 : 1).map((o) => ordering(f, o, ctx)),
    ];
  if (f.evts?.length || f.paires?.length)
    pools.pairing = (level, rng, ctx) => [
      ...(f.evts?.length ? pairesDates(f, level, rng, ctx) : []),
      ...duNiveau(f.paires ?? [], level, f.evts?.length ? 0 : 1).map((p) => pairing(f, p, ctx)),
    ];
  if (f.oral?.length) pools.oral_answer = (level, _rng, ctx) => duNiveau(f.oral!, level, 3).map((o) => oral(f, o, ctx));
  return { pools };
}
