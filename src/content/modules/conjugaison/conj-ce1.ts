/**
 * CE1 — Conjugaison (BO n°41 du 31/10/2024, cycle 2, CE1) : « Apprendre à conjuguer au présent, à
 * l'imparfait, au futur puis au passé composé de l'indicatif être et avoir et les verbes du premier
 * groupe » ; « Identifier le radical et la terminaison d'un verbe du premier groupe conjugué et trouver
 * son infinitif » (ils plieront, tu as plié, vous pliez, elles plièrent → plier).
 * Pour aller plus loin : aller, faire, dire, venir (programme du CE2), -cer/-ger, accord avec être.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { type Plan, type PlanParNiveau, formesDe, gensConjugaison, itemTrou, phraseAvec, pronomDe, tirer } from './conj';
import {
  DEUXIEME,
  ETRE_AVOIR,
  PREMIER_CER_GER,
  PREMIER_ETRE,
  PREMIER_IER,
  PREMIER_SIMPLES,
  type VerbeLex,
  lex,
} from './lexique';
import { AU_TEMPS, PERSONNES, type Personne, type Temps, avecPronom, formes, groupe } from './moteur';
import { clamp01, distinctsPar, make, mcq, trou, vraiFaux } from './util';

const fois = <T>(n: number, x: T[]): T[] => Array.from({ length: n }, () => x).flat();

/** être et avoir pèsent environ un quart des tirages. */
const ETRE_AVOIR_POIDS = fois(5, [ETRE_AVOIR.être, ETRE_AVOIR.avoir]);
const BASE: VerbeLex[] = [...ETRE_AVOIR_POIDS, ...PREMIER_SIMPLES];
const BASE_IER: VerbeLex[] = [...BASE, ...PREMIER_IER];
const BASE_SANS_ETRE_AVOIR: VerbeLex[] = [...PREMIER_SIMPLES, ...PREMIER_IER];
const TOUTES: readonly Personne[] = PERSONNES;
const IL_ILS: readonly Personne[] = [2, 5];
const JE_TU_IL: readonly Personne[] = [0, 1, 2];

const plan = (temps: Temps[], verbes: VerbeLex[], personnes: readonly Personne[], indicateur = 0.7): Plan => ({
  temps,
  verbes,
  personnes,
  sujets: 'varies',
  indicateur,
  voisins: ['present', 'imparfait', 'futur'],
});

const PRESENT: PlanParNiveau = {
  facile: plan(['present'], BASE_IER, JE_TU_IL),
  normal: plan(['present'], BASE_IER, TOUTES),
  plus_loin: plan(
    ['present'],
    [...BASE_IER, ...fois(3, [lex('aller'), lex('faire'), lex('dire')]), ...PREMIER_CER_GER],
    TOUTES,
  ),
};

const IMPARFAIT: PlanParNiveau = {
  facile: plan(['imparfait'], BASE, IL_ILS),
  normal: plan(['imparfait'], BASE, TOUTES),
  plus_loin: plan(['imparfait'], [...BASE, ...PREMIER_CER_GER, ...PREMIER_CER_GER, ...PREMIER_IER], TOUTES),
};

const FUTUR: PlanParNiveau = {
  facile: plan(['futur'], BASE_IER, IL_ILS),
  normal: plan(['futur'], BASE_IER, TOUTES),
  plus_loin: plan(['futur'], [...BASE_IER, ...fois(3, [lex('aller'), lex('faire'), lex('venir')])], TOUTES),
};

const PASSE_COMPOSE: PlanParNiveau = {
  facile: plan(['passe_compose'], BASE_SANS_ETRE_AVOIR, JE_TU_IL),
  normal: plan(['passe_compose'], BASE_IER, TOUTES),
  plus_loin: plan(
    ['passe_compose'],
    [...BASE_IER, ...fois(3, [...PREMIER_ETRE, lex('aller'), lex('venir')])],
    TOUTES,
  ),
};

/* ------------------------------------------------------------------ */
/* CE1.FR.CONJ.TEMPS — passé, présent ou futur ?                        */
/* ------------------------------------------------------------------ */

type Epoque = 'passé' | 'présent' | 'futur';
const EPOQUES: Epoque[] = ['passé', 'présent', 'futur'];
const EPOQUE: Partial<Record<Temps, Epoque>> = {
  present: 'présent',
  imparfait: 'passé',
  passe_compose: 'passé',
  futur: 'futur',
};
const QUAND: Record<Epoque, string> = {
  passé: 'l’action est déjà passée (avant, hier…)',
  présent: 'l’action se passe maintenant',
  futur: 'l’action se passera plus tard (demain…)',
};

const TEMPS_CE1: Temps[] = ['present', 'imparfait', 'futur', 'passe_compose'];
const TEMPS_PLAN: PlanParNiveau = {
  facile: plan(TEMPS_CE1, BASE, TOUTES, 1),
  normal: plan(TEMPS_CE1, BASE_IER, TOUTES, 0),
  plus_loin: plan(TEMPS_CE1, [...BASE_IER, lex('aller'), lex('faire')], TOUTES, 0.3),
};

function explicationEpoque(forme: string, temps: Temps): string {
  const e = EPOQUE[temps]!;
  return `« ${forme} » est ${AU_TEMPS[temps]} : ${QUAND[e]}, c’est donc du ${e}.`;
}

function tempsQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const t = tirer(TEMPS_PLAN[level], rng);
  const [f] = formesDe(t);
  const e = EPOQUE[t.temps]!;
  const phrase = phraseAvec(t, f!);
  return mcq(ctx, rng, 'epoque', {
    question: `Cette phrase parle-t-elle du passé, du présent ou du futur ? « ${phrase} »`,
    good: e,
    wrong: EPOQUES,
    fixedOrder: EPOQUES,
    explication: explicationEpoque(f!, t.temps),
    difficulty: clamp01((level === 'facile' ? 0.2 : 0.45) + (t.temps === 'imparfait' ? 0.15 : 0)),
  });
}

function tempsClassement(level: Level, rng: Rng, ctx: GenContext): ItemOf<'classification'> {
  const p = TEMPS_PLAN[level];
  const vus = new Set<string>();
  const elements: { label: string; category: number }[] = [];
  const parEpoque: Record<Epoque, number> = { passé: 0, présent: 0, futur: 0 };
  for (let i = 0; i < 200 && elements.length < 6; i++) {
    const t = tirer({ ...p, sujets: 'pronoms' }, rng);
    const e = EPOQUE[t.temps]!;
    if (parEpoque[e] >= 2) continue;
    const label = phraseAvec(t, formesDe(t)[0]!);
    if (label.length > 32 || vus.has(label)) continue;
    vus.add(label);
    parEpoque[e]++;
    elements.push({ label, category: EPOQUES.indexOf(e) });
  }
  return make(ctx, 'classification', 'epoques', {
    prompt: 'Range chaque phrase : passé, présent ou futur ?',
    categories: [...EPOQUES],
    elements: rng.shuffle(elements),
    explication: 'Je cherche le verbe et je me demande : l’action est-elle déjà passée, se passe-t-elle maintenant ou se passera-t-elle plus tard ?',
    difficulty: level === 'facile' ? 0.3 : 0.6,
  });
}

function tempsVraiFaux(level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> {
  const t = tirer(TEMPS_PLAN[level], rng);
  const [f] = formesDe(t);
  const e = EPOQUE[t.temps]!;
  const vrai = rng.chance(0.5);
  const dit = vrai ? e : rng.pick(EPOQUES.filter((x) => x !== e));
  return vraiFaux(ctx, 'epoque', {
    statement: `« ${phraseAvec(t, f!)} » : cette phrase parle du ${dit}.`,
    answer: vrai,
    explication: `« ${f} » est ${AU_TEMPS[t.temps]} : ${QUAND[e]}, c’est du ${e}.`,
    difficulty: clamp01(level === 'facile' ? 0.25 : 0.5),
  });
}

/** Phrase à transformer (plus loin) ou à compléter d'après l'indicateur de temps. */
function tempsTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  if (level !== 'plus_loin') return itemTrou(ctx, rng, tirer({ ...TEMPS_PLAN[level], indicateur: 1 }, rng));
  // Transformer : « Aujourd'hui, Léa chante. Demain, Léa ___ (chanter, futur). »
  const t = tirer({ ...TEMPS_PLAN.plus_loin, temps: ['present'], indicateur: 0 }, rng);
  const cible = rng.pick<Temps>(['imparfait', 'futur', 'passe_compose']);
  const tc = { ...t, temps: cible, indicateur: rng.pick(cible === 'futur' ? ['Demain'] : cible === 'imparfait' ? ['Autrefois'] : ['Hier']) };
  const base = phraseAvec({ ...t, indicateur: 'Aujourd’hui' }, formesDe(t)[0]!);
  const it = itemTrou(ctx, rng, tc);
  return trou(ctx, rng, 'transforme', {
    sentence: `${base} ${it.sentence}`,
    answer: it.answer,
    accepted: it.accepted,
    wrong: it.choices?.filter((c) => c !== it.answer),
    nbChoix: 4,
    explication: it.explication,
    difficulty: clamp01((it.difficulty ?? 0.5) + 0.1),
    conjugaison: it.conjugaison,
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.CONJ.INFINITIF — « il faut… »                                 */
/* ------------------------------------------------------------------ */

const pronoms = (p: Plan): Plan => ({ ...p, sujets: 'pronoms' });
const INFINITIF_PLAN: Record<Level, Plan> = {
  facile: pronoms(plan(['present'], BASE_SANS_ETRE_AVOIR, TOUTES, 0.3)),
  normal: pronoms(
    plan(TEMPS_CE1, [...BASE_SANS_ETRE_AVOIR, ...fois(2, [ETRE_AVOIR.être, ETRE_AVOIR.avoir])], TOUTES, 0.3),
  ),
  plus_loin: pronoms(
    plan([...TEMPS_CE1, 'passe_simple'], [...BASE_SANS_ETRE_AVOIR, ...DEUXIEME, ...DEUXIEME], TOUTES, 0.3),
  ),
};

const conseilInfinitif = (inf: string) => {
  const g = groupe(inf);
  const fin =
    g === 1
      ? 'C’est un verbe du 1er groupe : son infinitif se termine par -er.'
      : g === 2
        ? 'C’est un verbe du 2e groupe : son infinitif se termine par -ir (nous finissons).'
        : '';
  return `Pour trouver l’infinitif, je dis « il faut… » : il faut ${inf}. ${fin}`.trim();
};

function tirageInfinitif(level: Level, rng: Rng) {
  const p = INFINITIF_PLAN[level];
  const t = tirer({ ...p, temps: level === 'plus_loin' && rng.chance(0.25) ? ['passe_simple'] : p.temps.filter((x) => x !== 'passe_simple') }, rng);
  // passé simple : seulement les 3es personnes (« elles plièrent »)
  if (t.temps === 'passe_simple' && t.p !== 2 && t.p !== 5) return tirageInfinitif(level, rng);
  const forme = formesDe(t)[0]!;
  return { t, forme, avecPr: avecPronom(t.p, forme, pronomDe(t)) };
}

/** Formes du même verbe qui ne sont pas l'infinitif (distracteurs). */
function pasInfinitifs(inf: string, forme: string): string[] {
  const out = [formes(inf, 'present', 2)[0]!, formes(inf, 'present', 3)[0]!, formes(inf, 'futur', 2)[0]!];
  const pp = formes(inf, 'passe_compose', 2)[0]!.split(' ').pop()!;
  out.push(pp);
  // passé composé : l'infinitif n'est pas celui de l'auxiliaire (tu as plié → plier, pas avoir)
  if (/\s/.test(forme)) out.push('avoir');
  return out.filter((x) => x !== inf);
}

function infTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const { t, forme, avecPr } = tirageInfinitif(level, rng);
  const inf = t.verbe.inf;
  return trou(ctx, rng, 'inf', {
    sentence: `« ${phraseAvec(t, forme)} » L’infinitif de « ${avecPr} » est ___.`,
    answer: inf,
    wrong: pasInfinitifs(inf, forme),
    nbChoix: 4,
    explication: conseilInfinitif(inf),
    difficulty: clamp01((level === 'facile' ? 0.2 : 0.4) + (t.temps === 'passe_compose' ? 0.15 : 0)),
  });
}

function infQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const { t, forme, avecPr } = tirageInfinitif(level, rng);
  const inf = t.verbe.inf;
  return mcq(ctx, rng, 'inf', {
    question: `Quel est l’infinitif de « ${avecPr} » ?`,
    good: inf,
    wrong: pasInfinitifs(inf, forme),
    explication: conseilInfinitif(inf),
    difficulty: clamp01((level === 'facile' ? 0.2 : 0.4) + (t.temps === 'passe_compose' ? 0.15 : 0)),
  });
}

function infPaires(level: Level, rng: Rng, ctx: GenContext): ItemOf<'pairing'> {
  const tirages = distinctsPar(
    rng,
    Array.from({ length: 30 }, () => tirageInfinitif(level, rng)),
    5,
    (x) => x.t.verbe.inf,
  );
  return make(ctx, 'pairing', 'inf', {
    prompt: 'Associe chaque verbe conjugué à son infinitif.',
    pairs: tirages.map((x) => ({ left: x.avecPr, right: x.t.verbe.inf })),
    relation: 'forme conjuguée → infinitif',
    explication: 'Pour trouver l’infinitif, je dis « il faut… » : tu as plié → il faut plier.',
    difficulty: level === 'facile' ? 0.3 : 0.55,
  });
}

function infClassement(level: Level, rng: Rng, ctx: GenContext): ItemOf<'classification'> {
  for (let essai = 0; essai < 30; essai++) {
    const tirages = Array.from({ length: 40 }, () => tirageInfinitif(level, rng));
    const infs = distinctsPar(rng, tirages.map((x) => x.t.verbe.inf), 3, (x) => x);
    if (infs.length < 3) continue;
    const elements = distinctsPar(
      rng,
      tirages.filter((x) => infs.includes(x.t.verbe.inf) && x.avecPr.length <= 32),
      7,
      (x) => x.avecPr,
    ).map((x) => ({ label: x.avecPr, category: infs.indexOf(x.t.verbe.inf) }));
    if (new Set(elements.map((e) => e.category)).size < 2 || elements.length < 4) continue;
    return make(ctx, 'classification', 'inf', {
      prompt: 'Range chaque verbe conjugué sous son infinitif.',
      categories: infs,
      elements,
      explication: 'Pour trouver l’infinitif, je dis « il faut… » devant le verbe : nous chantions → il faut chanter.',
      difficulty: level === 'facile' ? 0.3 : 0.55,
    });
  }
  throw new Error('Classement impossible');
}

function infOral(level: Level, rng: Rng, ctx: GenContext): ItemOf<'oral_answer'> {
  // pas de futur : la forme contient l'infinitif (ils plieront)
  let x = tirageInfinitif(level, rng);
  while (x.t.temps === 'futur' || x.avecPr.includes(x.t.verbe.inf)) x = tirageInfinitif(level, rng);
  const inf = x.t.verbe.inf;
  return make(ctx, 'oral_answer', 'inf', {
    prompt: `Dis l’infinitif du verbe « ${x.avecPr} ».`,
    answer: inf,
    accepted: [inf],
    explication: conseilInfinitif(inf),
    difficulty: level === 'facile' ? 0.2 : 0.45,
  });
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const CONJ_CE1: Record<string, LessonContent> = {
  'CE1.FR.CONJ.PRESENT': { gens: gensConjugaison(PRESENT) },
  'CE1.FR.CONJ.IMPARFAIT': { gens: gensConjugaison(IMPARFAIT) },
  'CE1.FR.CONJ.FUTUR': { gens: gensConjugaison(FUTUR) },
  'CE1.FR.CONJ.PASSE_COMPOSE': { gens: gensConjugaison(PASSE_COMPOSE) },
  'CE1.FR.CONJ.TEMPS': {
    gens: {
      mcq: tempsQcm,
      classification: tempsClassement,
      true_false: tempsVraiFaux,
      fill_blank: tempsTrou,
    },
  },
  'CE1.FR.CONJ.INFINITIF': {
    gens: {
      fill_blank: infTrou,
      mcq: infQcm,
      pairing: infPaires,
      classification: infClassement,
      oral_answer: infOral,
    },
  },
};
