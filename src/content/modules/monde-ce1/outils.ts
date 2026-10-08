/**
 * Outils du module « monde-ce1 » (Questionner le monde, EMC, anglais) : banques rédigées → items typés.
 * Les contenus sont écrits sous une forme compacte (`Q`, `VF`, `Ordre`, `Paire`…) étiquetée par niveau
 * (`f` = facile, `n` = normal, `p` = plus loin) ; ces fonctions les transforment en banques (`ItemPool`)
 * ou en générateurs (`ItemGen`) conformes à `checkItem`. Fonctions pures de `rng`.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemGen, ItemPool } from '../../registry';
import type { ItemOf, Level } from '../../schemas';

/** Niveau d'un contenu rédigé : f = facile, n = normal (attendu de fin de CE1), p = plus loin. */
export type Niv = 'f' | 'n' | 'p';

export const DIFF: Record<Niv, number> = { f: 0.2, n: 0.5, p: 0.8 };

/** Niveaux de contenu proposés à chaque niveau de jeu (le premier est le niveau « propre »). */
const ACCEPTE: Record<Level, Niv[]> = { facile: ['f'], normal: ['n', 'f'], plus_loin: ['p', 'n'] };
const SECOURS: Record<Level, Niv[]> = { facile: ['f', 'n'], normal: ['n', 'f'], plus_loin: ['p', 'n'] };

/**
 * Sélection par niveau : facile = contenus faciles (complétés par le normal s'il y en a moins de `min`),
 * normal = normal + facile (révision), plus loin = plus loin + normal.
 */
export function selon<T extends { n: Niv }>(liste: readonly T[], level: Level, min = 4): T[] {
  const a = liste.filter((x) => ACCEPTE[level].includes(x.n));
  if (a.length >= min) return a;
  const b = liste.filter((x) => SECOURS[level].includes(x.n));
  return b.length ? b : [...liste];
}

/** Hachage FNV-1a 32 bits (base 36) : identifiants courts et stables. */
export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export const idDe = (ctx: GenContext, kind: string, cle: string) => `${ctx.lesson.id}:${kind}:${cle}`;

/* ------------------------------------------------------------------ */
/* QCM                                                                 */
/* ------------------------------------------------------------------ */

export interface Q {
  n: Niv;
  /** Identifiant court, unique dans la leçon (stable). */
  id: string;
  q: string;
  /** Bonne réponse. */
  ok: string;
  /** Distracteurs (1 à 5). */
  ko: string[];
  ex: string;
  img?: string;
  /** Indices de « Qui suis-je ? » (3 à 5, du plus difficile au plus facile). */
  hints?: string[];
  /** Lecture à voix haute (anglais : ce que dit la voix en-GB). */
  spoken?: string;
  lang?: 'en-GB';
  meta?: Record<string, unknown>;
}

/** Un QCM rédigé → item (choix mélangés ; facile : 3 propositions au plus, sauf devinettes). */
export function qcmItem(x: Q, level: Level, rng: Rng, ctx: GenContext, guillotine: boolean): ItemOf<'mcq'> {
  let ko = [...x.ko];
  if (level === 'facile' && !x.hints && ko.length > 2) ko = rng.shuffle(ko).slice(0, 2);
  const choices = rng.shuffle([x.ok, ...ko]);
  const it: ItemOf<'mcq'> = {
    kind: 'mcq',
    id: idDe(ctx, 'mcq', x.id),
    lessonId: ctx.lesson.id,
    question: x.q,
    choices,
    answerIndex: choices.indexOf(x.ok),
    explication: x.ex,
    difficulty: DIFF[x.n],
    guillotine,
  };
  if (x.hints) it.hints = x.hints;
  if (x.img) it.image = x.img;
  if (x.spoken) it.spoken = x.spoken;
  if (x.lang) it.lang = x.lang;
  if (x.meta) it.meta = x.meta;
  return it;
}

/** Banque de QCM. `guillotine` : thème neutre jouable dans la Guillotine. */
export function qcmPool(liste: readonly Q[], opts: { guillotine: boolean }): ItemPool {
  return (level, rng, ctx) => selon(liste, level).map((x) => qcmItem(x, level, rng, ctx, opts.guillotine));
}

/* ------------------------------------------------------------------ */
/* Vrai / faux                                                         */
/* ------------------------------------------------------------------ */

export interface VF {
  n: Niv;
  id: string;
  s: string;
  v: boolean;
  ex: string;
  img?: string;
  /** Thème délicat (harcèlement…) : pas de sprint chronométré. */
  sensible?: boolean;
}

export function vfPool(liste: readonly VF[]): ItemPool {
  return (level, _rng, ctx) =>
    selon(liste, level).map((x) => {
      const it: ItemOf<'true_false'> = {
        kind: 'true_false',
        id: idDe(ctx, 'tf', x.id),
        lessonId: ctx.lesson.id,
        statement: x.s,
        answer: x.v,
        explication: x.ex,
        difficulty: DIFF[x.n],
      };
      if (x.img) it.image = x.img;
      if (x.sensible) it.meta = { sensible: true };
      return it;
    });
}

/* ------------------------------------------------------------------ */
/* Ordres (frises, étapes, cycles)                                     */
/* ------------------------------------------------------------------ */

export interface Ordre {
  n: Niv;
  id: string;
  prompt: string;
  /** Éléments DANS LE BON ORDRE. */
  el: string[];
  labels?: string[];
  mode: 'chrono' | 'etapes';
  /** Cycle (de vie, de l'eau) : affiché en boucle. */
  cycle?: boolean;
  ex: string;
}

export function ordrePool(liste: readonly Ordre[]): ItemPool {
  return (level, _rng, ctx) =>
    selon(liste, level, 3).map((x) => {
      const it: ItemOf<'ordering'> = {
        kind: 'ordering',
        id: idDe(ctx, 'ord', x.id),
        lessonId: ctx.lesson.id,
        prompt: x.prompt,
        elements: x.el,
        mode: x.mode,
        explication: x.ex,
        difficulty: DIFF[x.n],
      };
      if (x.labels) it.labels = x.labels;
      if (x.cycle) it.meta = { cycle: true };
      return it;
    });
}

/* ------------------------------------------------------------------ */
/* Classements                                                         */
/* ------------------------------------------------------------------ */

export interface Elem {
  label: string;
  /** Nom de la catégorie (doit figurer dans les catégories du niveau). */
  c: string;
  img?: string;
  n: Niv;
}

export interface Tri {
  /** Identifiant court du tri (stable). */
  id: string;
  prompt: string;
  categories: string[];
  elements: Elem[];
  ex: string;
  /** Nombre d'éléments tirés (6 par défaut). */
  nb?: number;
  meta?: Record<string, unknown>;
}

/**
 * Générateur de classements : pour le niveau, on choisit un des tris proposés puis `nb` éléments
 * (chaque catégorie représentée au moins une fois).
 */
export function triGen(parNiveau: Record<Level, Tri[]>): ItemGen {
  return (level, rng, ctx) => {
    const tri = rng.pick(parNiveau[level]);
    const nb = tri.nb ?? 6;
    const dispo = selon(
      tri.elements.filter((e) => tri.categories.includes(e.c)),
      level,
      nb + 2,
    );
    // une carte par catégorie d'abord, puis le reste au hasard
    const choisis: Elem[] = [];
    for (const c of rng.shuffle(tri.categories)) {
      const e = rng.shuffle(dispo.filter((x) => x.c === c && !choisis.includes(x)))[0];
      if (e) choisis.push(e);
    }
    for (const e of rng.shuffle(dispo)) {
      if (choisis.length >= nb) break;
      if (!choisis.includes(e)) choisis.push(e);
    }
    const elements = rng.shuffle(choisis).map((e) => {
      const o: { label: string; category: number; image?: string } = {
        label: e.label,
        category: tri.categories.indexOf(e.c),
      };
      if (e.img) o.image = e.img;
      return o;
    });
    const cle = elements
      .map((e) => `${e.label}:${e.category}`)
      .sort()
      .join('|');
    const it: ItemOf<'classification'> = {
      kind: 'classification',
      id: idDe(ctx, 'tri', `${tri.id}:${hash(cle)}`),
      lessonId: ctx.lesson.id,
      prompt: tri.prompt,
      categories: tri.categories,
      elements,
      explication: tri.ex,
      difficulty: level === 'facile' ? 0.2 : level === 'normal' ? 0.5 : 0.8,
    };
    if (tri.meta) it.meta = tri.meta;
    return it;
  };
}

/* ------------------------------------------------------------------ */
/* Paires                                                              */
/* ------------------------------------------------------------------ */

export interface Duo {
  l: string;
  r: string;
  n: Niv;
}

export interface Appariement {
  id: string;
  prompt: string;
  relation: string;
  duos: Duo[];
  ex: string;
  /** Nombre de paires tirées (6 par défaut). */
  nb?: number;
  lang?: 'en-GB';
  meta?: Record<string, unknown>;
}

/** Générateur de paires : un des appariements du niveau, `nb` paires distinctes tirées au hasard. */
export function paireGen(parNiveau: Record<Level, Appariement[]>): ItemGen {
  return (level, rng, ctx) => {
    const a = rng.pick(parNiveau[level]);
    const nb = a.nb ?? 6;
    const dispo = selon(a.duos, level, nb);
    const pairs: { left: string; right: string }[] = [];
    for (const d of rng.shuffle(dispo)) {
      if (pairs.length >= nb) break;
      if (pairs.some((p) => p.left === d.l || p.right === d.r)) continue;
      pairs.push({ left: d.l, right: d.r });
    }
    const cle = pairs
      .map((p) => `${p.left}→${p.right}`)
      .sort()
      .join('|');
    const it: ItemOf<'pairing'> = {
      kind: 'pairing',
      id: idDe(ctx, 'paires', `${a.id}:${hash(cle)}`),
      lessonId: ctx.lesson.id,
      prompt: a.prompt,
      pairs,
      relation: a.relation,
      explication: a.ex,
      difficulty: level === 'facile' ? 0.2 : level === 'normal' ? 0.5 : 0.8,
    };
    if (a.lang) it.lang = a.lang;
    if (a.meta) it.meta = a.meta;
    return it;
  };
}

/* ------------------------------------------------------------------ */
/* Cartes                                                              */
/* ------------------------------------------------------------------ */

export interface Lieu {
  n: Niv;
  map: string;
  target: string;
  /** Nom avec l'article (« l’Afrique », « l’océan Indien »). */
  label: string;
  ex: string;
  /** Consigne si différente de « Touche {label}. » */
  prompt?: string;
}

export function lieuPool(liste: readonly Lieu[]): ItemPool {
  return (level, _rng, ctx) =>
    selon(liste, level).map((x) => ({
      kind: 'map_point' as const,
      id: idDe(ctx, 'carte', `${x.map}:${x.target}`),
      lessonId: ctx.lesson.id,
      prompt: x.prompt ?? `Touche ${x.label}.`,
      map: x.map,
      target: x.target,
      targetLabel: x.label,
      explication: x.ex,
      difficulty: DIFF[x.n],
    }));
}
