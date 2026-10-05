/**
 * CM2 — Résolution de problèmes (BO n°16 du 17/04/2025, cycle 3, « La résolution de problèmes » et
 * « La proportionnalité ») : modèle en 4 phases (Comprendre → Modéliser → Calculer → Répondre,
 * + Régulation), schémas en barre, au moins 10 problèmes par semaine.
 *
 * Structures du BO : additifs en une ou plusieurs étapes ; multiplicatifs « parties-tout » en une étape
 * (produit, partage, groupement) ; comparaison multiplicative (« 3 fois plus », « 3 fois moins ») ; mixtes
 * en plusieurs étapes ; proportionnalité (raisonnements de linéarité en langage naturel) ; dénombrement,
 * optimisation et problèmes préparant aux algorithmes.
 *
 * Chaque problème (`Pb`) devient 4 items :
 * - `bar_model` : schéma en barre, reformulations (phase « Comprendre »), phrase-réponse ;
 * - `numeric_answer` : l'énoncé et la réponse à saisir (`meta.calcul` = calcul en une ligne quand il existe) ;
 * - `mcq` : « Quel calcul permet de répondre ? » (phase « Modéliser »), ou la bonne réponse parmi des
 *   réponses issues d'erreurs de raisonnement ; `meta.reponse` = réponse au problème ;
 * - `true_false` : une réponse proposée à contrôler (phase « Régulation »).
 *
 * Proportionnalité (BO : pas de tableau de proportionnalité, ni coefficient, ni produit en croix au
 * cours moyen) : les données restent en phrases ; `meta.recette` les résume
 * (`{ grandeurs: [string, string], connus: [number, number][], cherche: number }`) et les explications
 * verbalisent la linéarité avec les unités (« 3 fois plus de crêpes, donc 3 fois plus de farine »). Le
 * tableau (`meta.tableau`, convention Pâtissier) n'apparaît que pour les pourcentages et les échelles du
 * niveau « plus loin » (6e).
 *
 * Les décimaux sont calculés en entiers (centimes, hectomètres, grammes, centilitres) ; les réponses en
 * euros n'ont jamais de zéro final (2,90 €) car la saisie ne l'accepte pas. Les nombres qui commencent
 * une phrase sont écrits en lettres.
 */
import { nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemGen, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import {
  PERSOS,
  type Perso,
  cap,
  centimesSansZeroFinal,
  clamp01,
  de,
  dire,
  euros,
  fmt,
  make,
  mcq,
  numeric,
  parNiv,
  r3,
} from './util';

type Bar = ItemOf<'bar_model'>['bars'][number];
type Structure = ItemOf<'bar_model'>['structure'];

/** Un problème, avant sa transformation en items. */
export interface Pb {
  sig: string;
  statement: string;
  question: string;
  answer: number;
  unit?: string;
  structure: Structure;
  bars: Bar[];
  total?: number | null;
  answerSentence: string;
  /** La 1re est la bonne. */
  reformulations: [string, string, string];
  /** Étapes du calcul, avec leurs résultats (affiché en correction). */
  operation: string;
  /** Calcul en une ligne (sans unité) dont le résultat est exactement la réponse. */
  calcul?: string;
  /** Calculs faux plausibles (erreurs de modélisation), de résultats différents de la réponse. */
  fauxCalculs?: string[];
  /** Réponses issues d'erreurs de raisonnement (pour la régulation et le QCM). */
  fausses: number[];
  explication: string;
  difficulty: number;
  meta?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */

/** Écrit une valeur avec son unité (« 3,45 € », « 2,5 kg », « 12 »). */
export const valeur = (x: number, unit?: string) =>
  unit === '€' ? euros(Math.round(x * 100)) : unit ? `${fmt(x)} ${unit}` : fmt(x);

/** Nombre sans unité, écrit à la française (« 3,45 »). */
const n = (x: number) => fmt(r3(x));
/** Centimes → euros (nombre). */
const eu = (c: number) => r3(c / 100);
/** Nombre en lettres avec majuscule, pour commencer une phrase (« Sept amis… »). */
const Lettres = (x: number) => cap(nombreEnLettres(x));
/** Accord simple : « 1 car », « 3 cars ». */
const accord = (k: number, sg: string, plu = `${sg}s`) => `${fmt(k)} ${k >= 2 ? plu : sg}`;

/** À l'oral, « 24,65 € » se lit « 24 euros 65 » ; « 41,05 € » « 41 euros et 5 centimes » ; « 0,45 € » « 45 centimes ». */
const ditPrix = (t: string) =>
  t
    .replace(/(\d[\d ]*),(\d{2}) €/g, (_, e: string, c: string) => {
      const ent = e.replace(/ /g, '');
      const cts = Number(c);
      const eurosDits = `${ent} euro${ent === '1' ? '' : 's'}`;
      if (ent === '0') return `${cts} centime${cts > 1 ? 's' : ''}`;
      if (cts < 10) return `${eurosDits} et ${cts} centime${cts > 1 ? 's' : ''}`;
      return `${eurosDits} ${cts}`;
    })
    .replace(/(\d[\d ]*) €/g, (_, e: string) => {
      const ent = e.replace(/ /g, '');
      return `${ent} euro${ent === '1' ? '' : 's'}`;
    });
const parle = (t: string) => dire(ditPrix(t));

/** Garde les fausses réponses utilisables : positives, distinctes, différentes de la réponse. */
const garder = (answer: number, xs: number[]) =>
  [...new Set(xs.map(r3))].filter((x) => x >= 0 && Math.abs(x - answer) > 1e-9);

/** Segments de parts égales (« … » quand il y en a trop). */
const parts = (k: number, v: number | null, lab?: (i: number) => string) =>
  k <= 10
    ? Array.from({ length: k }, (_, i) => ({ value: v, label: lab?.(i) }))
    : [
        { value: v, label: lab?.(0) },
        { value: v, label: lab?.(1) },
        { value: v, label: lab?.(2) },
        { value: null, label: '…' },
      ];

/** Tire un montant en centimes dans [lo, hi] dont l'écriture n'a pas de zéro final, multiple de `pas`. */
function prix(rng: Rng, lo: number, hi: number, pas = 5): number {
  for (let i = 0; i < 100; i++) {
    const c = Math.round(rng.int(lo, hi) / pas) * pas;
    if (c >= lo && centimesSansZeroFinal(c)) return c;
  }
  return lo;
}

const aT = (p: Perso) => `a-t-${p.il}`;

/** Prénoms commençant par une consonne : pas d'élision à gérer (« de Léo », « que Zoé »). */
const PRENOMS = PERSOS.filter((p) => !/^[AEIOUYÉÈ]/.test(p.nom));
const deuxPrenoms = (rng: Rng): [Perso, Perso] => {
  const [a, b] = rng.shuffle(PRENOMS);
  return [a!, b!];
};

/* ------------------------------------------------------------------ */
/* Conversions Pb → items                                              */
/* ------------------------------------------------------------------ */

function versBarModel(ctx: GenContext, rng: Rng, p: Pb): ItemOf<'bar_model'> {
  const [bonne, ...fausses] = p.reformulations;
  return make(ctx, 'bar_model', p.sig, {
    statement: p.statement,
    spoken: parle(`${p.statement} ${p.question}`),
    structure: p.structure,
    bars: p.bars,
    total: p.total,
    question: p.question,
    answer: r3(p.answer),
    unit: p.unit,
    answerSentence: p.answerSentence,
    // la 1re reformulation est la bonne (le jeu les mélange)
    reformulations: [bonne, ...rng.shuffle(fausses)],
    operation: p.operation,
    explication: p.explication,
    difficulty: clamp01(p.difficulty),
    meta: { ...p.meta, ...(p.unit === '€' ? { monnaie: true } : {}) },
  });
}

function versNumeric(ctx: GenContext, p: Pb): ItemOf<'numeric_answer'> {
  return numeric(ctx, p.sig, {
    prompt: `${p.statement} ${p.question}`,
    spoken: parle(`${p.statement} ${p.question}`),
    answer: p.answer,
    unit: p.unit,
    explication: p.explication,
    difficulty: p.difficulty,
    meta: { ...p.meta, ...(p.calcul ? { calcul: p.calcul } : {}) },
  });
}

function versQcm(ctx: GenContext, rng: Rng, p: Pb): ItemOf<'mcq'> {
  const fauxCalculs = p.fauxCalculs ?? [];
  if (p.calcul && fauxCalculs.length >= 2 && rng.chance(0.65))
    return mcq(ctx, rng, `calcul-${p.sig}`, {
      question: `${p.statement} ${p.question}\nQuel calcul permet de répondre ?`,
      spoken: `${parle(`${p.statement} ${p.question}`)} Quel calcul permet de répondre ?`,
      good: p.calcul,
      wrong: fauxCalculs,
      explication: p.explication,
      difficulty: p.difficulty + 0.05,
      meta: { ...p.meta, reponse: r3(p.answer), calcul: true },
    });
  const good = valeur(p.answer, p.unit);
  return mcq(ctx, rng, `reponse-${p.sig}`, {
    question: `${p.statement} ${p.question}`,
    spoken: parle(`${p.statement} ${p.question}`),
    good,
    wrong: garder(p.answer, p.fausses).map((x) => valeur(x, p.unit)),
    explication: p.explication,
    difficulty: p.difficulty,
    meta: { ...p.meta, reponse: r3(p.answer) },
  });
}

function versVraiFaux(ctx: GenContext, rng: Rng, p: Pb): ItemOf<'true_false'> {
  const fausses = garder(p.answer, p.fausses);
  const juste = !fausses.length || rng.chance(0.5);
  const montre = juste ? r3(p.answer) : rng.pick(fausses);
  const v = valeur(montre, p.unit);
  return make(ctx, 'true_false', `regul-${p.sig}-${montre}`, {
    statement: `${p.statement} ${p.question}\nRéponse proposée : ${v}. Est-ce la bonne réponse ?`,
    spoken: `${parle(`${p.statement} ${p.question}`)} Réponse proposée : ${parle(v)}. Est-ce la bonne réponse ?`,
    answer: juste,
    explication: juste
      ? `Oui ! ${p.explication}`
      : `Non, la bonne réponse est ${valeur(p.answer, p.unit)}. ${p.explication}`,
    difficulty: clamp01(p.difficulty - 0.05),
    meta: { ...p.meta, reponse: r3(p.answer), proposee: montre },
  });
}

/** Les 4 types d'items à partir d'un générateur de problèmes. */
const quatreTypes = (
  gen: (level: Level, rng: Rng) => Pb,
  extra: { mcq?: ItemGen; true_false?: ItemGen } = {},
): LessonContent => ({
  gens: {
    bar_model: (level, rng, ctx) => versBarModel(ctx, rng, gen(level, rng)),
    numeric_answer: (level, rng, ctx) => versNumeric(ctx, gen(level, rng)),
    mcq: (level, rng, ctx) =>
      extra.mcq && rng.chance(0.35) ? extra.mcq(level, rng, ctx) : versQcm(ctx, rng, gen(level, rng)),
    true_false: (level, rng, ctx) =>
      extra.true_false && rng.chance(0.4)
        ? extra.true_false(level, rng, ctx)
        : versVraiFaux(ctx, rng, gen(level, rng)),
  },
});

/* ------------------------------------------------------------------ */
/* CM2.MA.PB.ADDITIFS                                                  */
/* ------------------------------------------------------------------ */

/** Facile : entiers, une étape. */
function addFacile(rng: Rng, forme = rng.int(0, 5)): Pb {
  const p = rng.pick(PRENOMS);
  switch (forme) {
    case 0: {
      const a = rng.int(1200, 9000);
      const b = rng.int(800, 9000);
      const t = a + b;
      return {
        sig: `stade-${a}-${b}`,
        statement: `Au stade, ${fmt(a)} supporters encouragent l’équipe bleue et ${fmt(b)} supporters encouragent l’équipe rouge.`,
        question: 'Combien y a-t-il de supporters dans le stade ?',
        answer: t,
        structure: 'parties-tout',
        bars: [
          {
            label: 'supporters',
            segments: [
              { value: a, label: 'équipe bleue' },
              { value: b, label: 'équipe rouge' },
            ],
          },
        ],
        total: null,
        answerSentence: 'Il y a ___ supporters dans le stade.',
        reformulations: [
          'On connait les deux groupes de supporters ; on cherche le nombre total de supporters.',
          'On connait le nombre total de supporters ; on cherche ceux de l’équipe rouge.',
          'On cherche combien il y a de supporters bleus de plus que de rouges.',
        ],
        operation: `${fmt(a)} + ${fmt(b)} = ${fmt(t)}`,
        calcul: `${fmt(a)} + ${fmt(b)}`,
        fauxCalculs: [`${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}`, `${fmt(a)} × ${fmt(b)}`],
        fausses: [Math.abs(a - b), t + 1000, t - 100],
        explication: `On cherche le tout : on ajoute les deux parties, ${fmt(a)} + ${fmt(b)} = ${fmt(t)}.`,
        difficulty: 0.2,
      };
    }
    case 1: {
      const t = rng.int(2500, 9999);
      const a = rng.int(800, t - 600);
      const b = t - a;
      return {
        sig: `mediatheque-${t}-${a}`,
        statement: `La médiathèque possède ${fmt(t)} livres : ${fmt(a)} sont des romans, les autres sont des bandes dessinées.`,
        question: 'Combien la médiathèque possède-t-elle de bandes dessinées ?',
        answer: b,
        structure: 'parties-tout',
        bars: [
          {
            label: 'livres',
            segments: [
              { value: a, label: 'romans' },
              { value: null, label: 'bandes dessinées' },
            ],
          },
        ],
        total: t,
        answerSentence: 'La médiathèque possède ___ bandes dessinées.',
        reformulations: [
          'On connait tous les livres et les romans ; on cherche les bandes dessinées.',
          'On cherche le nombre total de livres de la médiathèque.',
          'On ajoute les romans et tous les livres.',
        ],
        operation: `${fmt(t)} − ${fmt(a)} = ${fmt(b)}`,
        calcul: `${fmt(t)} − ${fmt(a)}`,
        fauxCalculs: [`${fmt(t)} + ${fmt(a)}`, `${fmt(t)} − ${fmt(b)}`],
        fausses: [t + a, b + 100, b - 10],
        explication: `On connait le tout et une partie : on enlève la partie connue, ${fmt(t)} − ${fmt(a)} = ${fmt(b)}.`,
        difficulty: 0.35,
      };
    }
    case 2: {
      const a = rng.int(1500, 6000);
      const b = rng.int(250, 3500);
      const t = a + b;
      return {
        sig: `jeu-gain-${a}-${b}`,
        statement: `${p.nom} avait ${fmt(a)} points dans son jeu. ${cap(p.il)} réussit un niveau et gagne ${fmt(b)} points.`,
        question: `Combien de points ${p.nom} ${aT(p)} maintenant ?`,
        answer: t,
        structure: 'transformation',
        bars: [
          {
            label: 'points',
            segments: [
              { value: a, label: 'avant' },
              { value: b, label: 'gagnés' },
            ],
          },
        ],
        total: null,
        answerSentence: `${p.nom} a maintenant ___ points.`,
        reformulations: [
          `${p.nom} avait des points et en gagne : on cherche ses points maintenant.`,
          `${p.nom} perd des points : on cherche ce qui lui reste.`,
          `On cherche combien de points ${p.nom} avait avant.`,
        ],
        operation: `${fmt(a)} + ${fmt(b)} = ${fmt(t)}`,
        calcul: `${fmt(a)} + ${fmt(b)}`,
        fauxCalculs: [`${fmt(a)} − ${fmt(b)}`, `${fmt(b)} × 2`],
        fausses: [a - b, t + 100, t - 1000],
        explication: `${p.nom} gagne des points, ${p.il} en a donc plus qu’avant : ${fmt(a)} + ${fmt(b)} = ${fmt(t)}.`,
        difficulty: 0.2,
      };
    }
    case 3: {
      // Piège BO : « dépensé » mais il faut ajouter
      const a = rng.int(300, 4000);
      const b = rng.int(200, 3000);
      const t = a + b;
      return {
        sig: `jeu-avant-${a}-${b}`,
        statement: `Après avoir dépensé ${fmt(b)} pièces d’or dans la boutique du jeu, ${p.nom} a encore ${fmt(a)} pièces d’or.`,
        question: `Combien de pièces d’or ${p.nom} avait-${p.il} avant ses achats ?`,
        answer: t,
        structure: 'transformation',
        bars: [
          {
            label: 'pièces d’or',
            segments: [
              { value: b, label: 'dépensées' },
              { value: a, label: 'restantes' },
            ],
          },
        ],
        total: null,
        answerSentence: `Avant ses achats, ${p.nom} avait ___ pièces d’or.`,
        reformulations: [
          `On connait ce que ${p.nom} a dépensé et ce qui lui reste ; on cherche ce qu’${p.il} avait avant.`,
          `On cherche combien de pièces ${p.nom} a dépensées.`,
          `On cherche combien de pièces il reste à ${p.nom}.`,
        ],
        operation: `${fmt(b)} + ${fmt(a)} = ${fmt(t)}`,
        calcul: `${fmt(b)} + ${fmt(a)}`,
        fauxCalculs: [`${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}`, `${fmt(a)} − ${fmt(b)}`],
        fausses: [Math.abs(a - b), t + 100],
        explication: `Avant, ${p.nom} avait les pièces dépensées et les pièces restantes : ${fmt(b)} + ${fmt(a)} = ${fmt(t)} (« dépenser » ne veut pas toujours dire « − »).`,
        difficulty: 0.55,
      };
    }
    case 4: {
      // Hauteurs vraisemblables : tours d'une ville (40 à 320 m)
      const grand = rng.int(120, 320);
      const petit = rng.int(40, grand - 15);
      const ecart = grand - petit;
      return {
        sig: `tours-${grand}-${petit}`,
        statement: `Dans une grande ville, la tour Bleue mesure ${grand} m de haut et la tour Verte mesure ${petit} m de haut.`,
        question: 'Combien de mètres la tour Bleue mesure-t-elle de plus que la tour Verte ?',
        answer: ecart,
        unit: 'm',
        structure: 'comparaison',
        bars: [
          { label: 'tour Bleue', segments: [{ value: grand }] },
          { label: 'tour Verte', segments: [{ value: petit }, { value: null, label: 'écart' }] },
        ],
        total: null,
        answerSentence: 'La tour Bleue mesure ___ m de plus que la tour Verte.',
        reformulations: [
          'On compare les hauteurs des deux tours : on cherche l’écart.',
          'On cherche la hauteur des deux tours posées l’une sur l’autre.',
          'On cherche la hauteur de la tour Verte.',
        ],
        operation: `${grand} − ${petit} = ${ecart}`,
        calcul: `${grand} − ${petit}`,
        fauxCalculs: [`${grand} + ${petit}`, `${grand} − ${ecart + 10}`],
        fausses: [grand + petit, ecart + 10, ecart - 10],
        explication: `Pour trouver l’écart, on enlève la plus petite hauteur de la plus grande : ${grand} − ${petit} = ${ecart}.`,
        difficulty: 0.4,
      };
    }
    default: {
      // Piège BO : « de plus » mais il faut soustraire
      const petit = rng.int(40, 250);
      const ecart = rng.int(12, 180);
      const grand = petit + ecart;
      return {
        sig: `arbres-${grand}-${ecart}`,
        statement: `Le vieux chêne du parc a ${grand} ans. Il a ${ecart} ans de plus que le tilleul.`,
        question: 'Quel âge a le tilleul ?',
        answer: petit,
        unit: 'ans',
        structure: 'comparaison',
        bars: [
          { label: 'chêne', segments: [{ value: grand }] },
          {
            label: 'tilleul',
            segments: [
              { value: null, label: '?' },
              { value: ecart, label: 'de moins' },
            ],
          },
        ],
        total: null,
        answerSentence: 'Le tilleul a ___ ans.',
        reformulations: [
          `Le tilleul a ${ecart} ans de moins que le chêne.`,
          `Le tilleul a ${ecart} ans de plus que le chêne.`,
          `Le chêne et le tilleul ont ${grand} ans à eux deux.`,
        ],
        operation: `${grand} − ${ecart} = ${petit}`,
        calcul: `${grand} − ${ecart}`,
        fauxCalculs: [`${grand} + ${ecart}`, `${grand} × 2`],
        fausses: [grand + ecart, petit + 10],
        explication: `Si le chêne a ${ecart} ans de plus, le tilleul a ${ecart} ans de moins : ${grand} − ${ecart} = ${petit} (« de plus » ne veut pas toujours dire « + »).`,
        difficulty: 0.6,
      };
    }
  }
}

/** Normal : décimaux (longueurs, masses, contenances, prix) et grands nombres, une ou deux étapes. */
function addNormal(rng: Rng, forme = rng.int(0, 6)): Pb {
  const [p, q] = deuxPrenoms(rng);
  switch (forme) {
    case 0: {
      // Grands nombres
      const a = rng.int(120, 980) * 1000 + rng.int(0, 999);
      const b = rng.int(120, 980) * 1000 + rng.int(0, 999);
      const t = a + b;
      if (rng.chance(0.5))
        return {
          sig: `parc-tout-${a}-${b}`,
          statement: `Un parc d’attractions a accueilli ${fmt(a)} visiteurs en juillet et ${fmt(b)} visiteurs en août.`,
          question: 'Combien de visiteurs a-t-il accueillis pendant ces deux mois ?',
          answer: t,
          structure: 'parties-tout',
          bars: [
            {
              label: 'visiteurs',
              segments: [
                { value: a, label: 'juillet' },
                { value: b, label: 'août' },
              ],
            },
          ],
          total: null,
          answerSentence: 'Le parc a accueilli ___ visiteurs pendant ces deux mois.',
          reformulations: [
            'On connait les visiteurs de chaque mois ; on cherche le total des deux mois.',
            'On cherche combien de visiteurs de plus il y a eu en août.',
            'On connait le total ; on cherche les visiteurs de juillet.',
          ],
          operation: `${fmt(a)} + ${fmt(b)} = ${fmt(t)}`,
          calcul: `${fmt(a)} + ${fmt(b)}`,
          fauxCalculs: [`${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}`, `${fmt(a)} + ${fmt(a)}`],
          fausses: [Math.abs(a - b), t + 10000, t - 100000],
          explication: `On cherche le tout : ${fmt(a)} + ${fmt(b)} = ${fmt(t)} (attention aux retenues et aux classes des milliers).`,
          difficulty: 0.4,
        };
      return {
        sig: `parc-partie-${t}-${a}`,
        statement: `Pendant l’été, un parc d’attractions a accueilli ${fmt(t)} visiteurs : ${fmt(a)} sont venus en juillet, les autres en août.`,
        question: 'Combien de visiteurs sont venus en août ?',
        answer: b,
        structure: 'parties-tout',
        bars: [
          {
            label: 'visiteurs',
            segments: [
              { value: a, label: 'juillet' },
              { value: null, label: 'août' },
            ],
          },
        ],
        total: t,
        answerSentence: 'En août, ___ visiteurs sont venus.',
        reformulations: [
          'On connait le total de l’été et les visiteurs de juillet ; on cherche ceux d’août.',
          'On cherche le total des visiteurs de l’été.',
          'On ajoute les visiteurs de juillet et ceux de tout l’été.',
        ],
        operation: `${fmt(t)} − ${fmt(a)} = ${fmt(b)}`,
        calcul: `${fmt(t)} − ${fmt(a)}`,
        fauxCalculs: [`${fmt(t)} + ${fmt(a)}`, `${fmt(t)} − ${fmt(b + 1000)}`],
        fausses: [t + a, b + 1000, b - 10000],
        explication: `On enlève la partie connue du tout : ${fmt(t)} − ${fmt(a)} = ${fmt(b)}.`,
        difficulty: 0.5,
      };
    }
    case 1: {
      // Longueurs : deux étapes, en centimètres
      const tot = rng.pick([500, 1000, 1500, 2000]);
      const c1 = rng.int(55, Math.floor(tot / 3));
      const c2 = rng.int(55, Math.floor(tot / 3));
      const r = tot - c1 - c2;
      const m = (c: number) => r3(c / 100);
      return {
        sig: `ruban-${tot}-${c1}-${c2}`,
        statement: `Un rouleau de ruban mesure ${n(m(tot))} m. ${p.nom} en coupe ${n(m(c1))} m pour un cadeau, puis ${n(m(c2))} m pour un autre.`,
        question: 'Quelle longueur de ruban reste-t-il sur le rouleau ?',
        answer: m(r),
        unit: 'm',
        structure: 'deux-etapes',
        bars: [
          {
            label: 'ruban',
            segments: [
              { value: m(c1), label: 'cadeau 1' },
              { value: m(c2), label: 'cadeau 2' },
              { value: null, label: 'reste' },
            ],
          },
        ],
        total: m(tot),
        answerSentence: 'Il reste ___ m de ruban sur le rouleau.',
        reformulations: [
          'On enlève les deux morceaux coupés à la longueur du rouleau ; on cherche ce qui reste.',
          'On cherche la longueur totale des deux morceaux seulement.',
          'On ajoute les morceaux coupés à la longueur du rouleau.',
        ],
        operation: `${n(m(c1))} + ${n(m(c2))} = ${n(m(c1 + c2))} ; ${n(m(tot))} − ${n(m(c1 + c2))} = ${n(m(r))}`,
        calcul: `${n(m(tot))} − (${n(m(c1))} + ${n(m(c2))})`,
        fauxCalculs: [`${n(m(tot))} + ${n(m(c1))} + ${n(m(c2))}`, `${n(m(c1))} + ${n(m(c2))}`],
        fausses: [m(c1 + c2), m(tot + c1 + c2), m(r + 10)],
        explication: `Les deux morceaux mesurent ${n(m(c1))} + ${n(m(c2))} = ${n(m(c1 + c2))} m ; il reste ${n(m(tot))} − ${n(m(c1 + c2))} = ${n(m(r))} m.`,
        difficulty: 0.6,
      };
    }
    case 2: {
      // Masses : comparaison « de moins » (on soustrait)
      const g1 = rng.int(1500, 4800);
      const ecart = rng.int(150, g1 - 400);
      const g2 = g1 - ecart;
      const kg = (g: number) => r3(g / 1000);
      return {
        sig: `cartable-${g1}-${ecart}`,
        statement: `Le cartable de ${p.nom} pèse ${n(kg(g1))} kg. Celui de ${q.nom} pèse ${n(kg(ecart))} kg de moins.`,
        question: `Combien pèse le cartable de ${q.nom} ?`,
        answer: kg(g2),
        unit: 'kg',
        structure: 'comparaison',
        bars: [
          { label: p.nom, segments: [{ value: kg(g1) }] },
          {
            label: q.nom,
            segments: [
              { value: null, label: '?' },
              { value: kg(ecart), label: 'de moins' },
            ],
          },
        ],
        total: null,
        answerSentence: `Le cartable de ${q.nom} pèse ___ kg.`,
        reformulations: [
          `Le cartable de ${q.nom} est plus léger que celui de ${p.nom} de ${n(kg(ecart))} kg.`,
          `Le cartable de ${q.nom} est plus lourd que celui de ${p.nom}.`,
          'On cherche la masse des deux cartables ensemble.',
        ],
        operation: `${n(kg(g1))} − ${n(kg(ecart))} = ${n(kg(g2))}`,
        calcul: `${n(kg(g1))} − ${n(kg(ecart))}`,
        fauxCalculs: [`${n(kg(g1))} + ${n(kg(ecart))}`, `${n(kg(g1))} + ${n(kg(g2))}`],
        fausses: [kg(g1 + ecart), kg(g2 + 100), kg(g1 + g2)],
        explication: `${q.nom} a un cartable plus léger : ${n(kg(g1))} − ${n(kg(ecart))} = ${n(kg(g2))} kg.`,
        difficulty: 0.5,
      };
    }
    case 3: {
      // Prix : deux étapes, rendre la monnaie
      for (let essai = 0; essai < 50; essai++) {
        const a1 = prix(rng, 155, 1495);
        const a2 = prix(rng, 255, 2495);
        const s = a1 + a2;
        const billet = [1000, 2000, 5000].find((b) => b > s + 50);
        if (!billet) continue;
        const r = billet - s;
        if (!centimesSansZeroFinal(r)) continue;
        const [art1, art2] = rng.shuffle([
          'un livre',
          'un jeu de cartes',
          'une boite de feutres',
          'un puzzle',
          'une gourde',
        ]);
        return {
          sig: `achats-${a1}-${a2}-${billet}`,
          statement: `${p.nom} achète ${art1} à ${euros(a1)} et ${art2} à ${euros(a2)}. ${cap(p.il)} paie avec un billet de ${euros(billet)}.`,
          question: 'Combien le vendeur doit-il lui rendre ?',
          answer: eu(r),
          unit: '€',
          structure: 'deux-etapes',
          bars: [
            {
              label: euros(billet),
              segments: [
                { value: eu(a1), label: art1!.replace(/^une? /, '') },
                { value: eu(a2), label: art2!.replace(/^une? /, '') },
                { value: null, label: 'monnaie rendue' },
              ],
            },
          ],
          total: eu(billet),
          answerSentence: 'Le vendeur doit lui rendre ___ €.',
          reformulations: [
            `On calcule le prix des deux achats, puis ce qui reste sur le billet de ${euros(billet)}.`,
            'On cherche seulement le prix total des deux achats.',
            'On ajoute le billet et les deux prix.',
          ],
          operation: `${euros(a1)} + ${euros(a2)} = ${euros(s)} ; ${euros(billet)} − ${euros(s)} = ${euros(r)}`,
          calcul: `${n(eu(billet))} − (${n(eu(a1))} + ${n(eu(a2))})`,
          fauxCalculs: [`${n(eu(a1))} + ${n(eu(a2))}`, `${n(eu(billet))} − ${n(eu(a1))} + ${n(eu(a2))}`],
          fausses: [eu(s), eu(billet - a1 + a2), eu(r + 100)],
          explication: `Les achats coutent ${euros(a1)} + ${euros(a2)} = ${euros(s)} ; le vendeur rend ${euros(billet)} − ${euros(s)} = ${euros(r)}.`,
          difficulty: 0.6,
        };
      }
      return addNormal(rng, 1);
    }
    case 4: {
      // Écart entre deux décimaux (sauts en longueur, en cm)
      const c1 = rng.int(250, 420);
      const c2 = rng.int(180, c1 - 6);
      const e = c1 - c2;
      const m = (c: number) => r3(c / 100);
      return {
        sig: `saut-${c1}-${c2}`,
        statement: `Au saut en longueur, ${p.nom} a sauté ${n(m(c1))} m et ${q.nom} a sauté ${n(m(c2))} m.`,
        question: `De combien ${p.nom} a-t-${p.il} sauté plus loin que ${q.nom} ?`,
        answer: m(e),
        unit: 'm',
        structure: 'comparaison',
        bars: [
          { label: p.nom, segments: [{ value: m(c1) }] },
          { label: q.nom, segments: [{ value: m(c2) }, { value: null, label: 'écart' }] },
        ],
        total: null,
        answerSentence: `${p.nom} a sauté ___ m plus loin que ${q.nom}.`,
        reformulations: [
          'On compare les deux sauts : on cherche l’écart entre les deux longueurs.',
          'On cherche la longueur des deux sauts mis bout à bout.',
          `On cherche la longueur du saut de ${q.nom}.`,
        ],
        operation: `${n(m(c1))} − ${n(m(c2))} = ${n(m(e))}`,
        calcul: `${n(m(c1))} − ${n(m(c2))}`,
        fauxCalculs: [`${n(m(c1))} + ${n(m(c2))}`, `${n(m(c2))} + ${n(m(e + 10))}`],
        fausses: [m(c1 + c2), m(e + 10), m(e + 100)],
        explication: `L’écart, c’est la différence : ${n(m(c1))} − ${n(m(c2))} = ${n(m(e))} m (on aligne les virgules).`,
        difficulty: 0.5,
      };
    }
    case 5: {
      // Piège : « ajouté » mais on soustrait ; contenances en cL (carafe ≤ 1,5 L)
      const fin = rng.pick([100, 125, 150]);
      const ajout = rng.int(15, fin - 20);
      const avant = fin - ajout;
      const L = (c: number) => r3(c / 100);
      return {
        sig: `carafe-${fin}-${ajout}`,
        statement: `${p.nom} ajoute ${n(L(ajout))} L d’eau dans une carafe. La carafe contient maintenant ${n(L(fin))} L.`,
        question: 'Combien de litres d’eau y avait-il dans la carafe avant ?',
        answer: L(avant),
        unit: 'L',
        structure: 'transformation',
        bars: [
          {
            label: 'eau',
            segments: [
              { value: null, label: 'avant' },
              { value: L(ajout), label: 'ajoutée' },
            ],
          },
        ],
        total: L(fin),
        answerSentence: 'Il y avait ___ L d’eau dans la carafe.',
        reformulations: [
          'On connait l’eau à la fin et l’eau ajoutée ; on cherche l’eau du début.',
          'On cherche combien d’eau il y a à la fin.',
          `On cherche combien d’eau ${p.nom} a ajoutée.`,
        ],
        operation: `${n(L(fin))} − ${n(L(ajout))} = ${n(L(avant))}`,
        calcul: `${n(L(fin))} − ${n(L(ajout))}`,
        fauxCalculs: [`${n(L(fin))} + ${n(L(ajout))}`, `${n(L(ajout))} + ${n(L(ajout))}`],
        fausses: [L(fin + ajout), L(avant + 10)],
        explication: `Avant d’ajouter de l’eau, il y en avait moins : ${n(L(fin))} − ${n(L(ajout))} = ${n(L(avant))} L (« ajouter » ne veut pas toujours dire « + »).`,
        difficulty: 0.65,
      };
    }
    default: {
      // Grands nombres, deux étapes
      const h = rng.int(40, 600) * 1000 + rng.int(0, 999);
      const dep = rng.int(2000, 30000);
      const arr = rng.int(2000, 30000);
      const r = h - dep + arr;
      return {
        sig: `ville-${h}-${dep}-${arr}`,
        statement: `Une ville compte ${fmt(h)} habitants. En dix ans, ${fmt(dep)} habitants sont partis et ${fmt(arr)} nouveaux habitants sont arrivés.`,
        question: 'Combien la ville compte-t-elle d’habitants maintenant ?',
        answer: r,
        structure: 'deux-etapes',
        bars: [
          {
            label: 'étape 1',
            segments: [
              { value: dep, label: 'partis' },
              { value: h - dep, label: 'restés' },
            ],
          },
          {
            label: 'étape 2',
            segments: [
              { value: h - dep, label: 'restés' },
              { value: arr, label: 'arrivés' },
            ],
          },
        ],
        total: null,
        answerSentence: 'La ville compte maintenant ___ habitants.',
        reformulations: [
          'On enlève les habitants partis, puis on ajoute les nouveaux arrivés.',
          'On ajoute les habitants partis et les habitants arrivés.',
          'On cherche combien d’habitants sont partis.',
        ],
        operation: `${fmt(h)} − ${fmt(dep)} = ${fmt(h - dep)} ; ${fmt(h - dep)} + ${fmt(arr)} = ${fmt(r)}`,
        calcul: `${fmt(h)} − ${fmt(dep)} + ${fmt(arr)}`,
        fauxCalculs: [`${fmt(h)} + ${fmt(dep)} + ${fmt(arr)}`, `${fmt(h)} − ${fmt(dep)} − ${fmt(arr)}`],
        fausses: [h + dep + arr, h - dep - arr, h + dep - arr],
        explication: `Étape 1 : ${fmt(h)} − ${fmt(dep)} = ${fmt(h - dep)}. Étape 2 : ${fmt(h - dep)} + ${fmt(arr)} = ${fmt(r)}.`,
        difficulty: 0.6,
      };
    }
  }
}

/** Plus loin : trois étapes. */
function addPlusLoin(rng: Rng, forme = rng.int(0, 3)): Pb {
  const p = rng.pick(PRENOMS);
  if (forme === 0) {
    for (let essai = 0; essai < 50; essai++) {
      const depart = prix(rng, 2000, 6000);
      const gain = rng.pick([1000, 1500, 2000, 500]);
      const d1 = prix(rng, 355, 1895);
      const d2 = prix(rng, 255, 1295);
      const r = depart + gain - d1 - d2;
      if (r < 100 || !centimesSansZeroFinal(r)) continue;
      return {
        sig: `tirelire-${depart}-${gain}-${d1}-${d2}`,
        statement: `Dans sa tirelire, ${p.nom} a ${euros(depart)}. Pour son anniversaire, ${p.il} reçoit ${euros(gain)}. Ensuite, ${p.il} achète un livre à ${euros(d1)} et un jeu à ${euros(d2)}.`,
        question: `Combien d’argent ${p.nom} ${aT(p)} maintenant ?`,
        answer: eu(r),
        unit: '€',
        structure: 'deux-etapes',
        bars: [
          {
            label: 'argent',
            segments: [
              { value: eu(depart), label: 'tirelire' },
              { value: eu(gain), label: 'cadeau' },
            ],
          },
          {
            label: 'après les achats',
            segments: [
              { value: eu(d1), label: 'livre' },
              { value: eu(d2), label: 'jeu' },
              { value: null, label: 'reste' },
            ],
          },
        ],
        total: eu(depart + gain),
        answerSentence: `${p.nom} a maintenant ___ €.`,
        reformulations: [
          `${p.nom} reçoit de l’argent puis fait deux achats : on cherche ce qui lui reste.`,
          `${p.nom} reçoit de l’argent trois fois : on cherche son total.`,
          'On cherche seulement le prix des deux achats.',
        ],
        operation: `${euros(depart)} + ${euros(gain)} = ${euros(depart + gain)} ; ${euros(depart + gain)} − ${euros(d1)} = ${euros(depart + gain - d1)} ; ${euros(depart + gain - d1)} − ${euros(d2)} = ${euros(r)}`,
        calcul: `${n(eu(depart))} + ${n(eu(gain))} − ${n(eu(d1))} − ${n(eu(d2))}`,
        fauxCalculs: [
          `${n(eu(depart))} + ${n(eu(gain))} + ${n(eu(d1))} + ${n(eu(d2))}`,
          `${n(eu(depart))} − ${n(eu(d1))} − ${n(eu(d2))}`,
        ],
        fausses: [eu(depart - d1 - d2), eu(depart + gain - d1), eu(d1 + d2)],
        explication: `On fait les étapes dans l’ordre : ${euros(depart)} + ${euros(gain)} = ${euros(depart + gain)}, puis on enlève ${euros(d1)} et ${euros(d2)} : il reste ${euros(r)}.`,
        difficulty: 0.8,
      };
    }
  }
  if (forme === 1) {
    // Randonnée : 3 étapes avec une comparaison (5 à 10 km par jour, en hm)
    const j1 = rng.int(50, 85);
    const plus = rng.int(3, 15);
    const j2 = j1 + plus;
    const j3 = rng.int(50, 100);
    const t = j1 + j2 + j3;
    const km = (h: number) => r3(h / 10);
    return {
      sig: `rando-${j1}-${plus}-${j3}`,
      statement: `Pendant une randonnée de trois jours, la classe de ${p.nom} marche ${n(km(j1))} km le premier jour. Le deuxième jour, elle marche ${n(km(plus))} km de plus que le premier jour. Le troisième jour, elle marche ${n(km(j3))} km.`,
      question: 'Quelle distance la classe a-t-elle parcourue en tout ?',
      answer: km(t),
      unit: 'km',
      structure: 'deux-etapes',
      bars: [
        { label: 'jour 1', segments: [{ value: km(j1) }] },
        { label: 'jour 2', segments: [{ value: km(j1) }, { value: km(plus), label: 'de plus' }] },
        { label: 'jour 3', segments: [{ value: km(j3) }] },
      ],
      total: null,
      answerSentence: 'La classe a parcouru ___ km en tout.',
      reformulations: [
        'On trouve d’abord la distance du jour 2, puis on ajoute les trois jours.',
        'On ajoute seulement les nombres écrits dans l’énoncé.',
        'On cherche la distance du deuxième jour seulement.',
      ],
      operation: `${n(km(j1))} + ${n(km(plus))} = ${n(km(j2))} ; ${n(km(j1))} + ${n(km(j2))} + ${n(km(j3))} = ${n(km(t))}`,
      calcul: `${n(km(j1))} + (${n(km(j1))} + ${n(km(plus))}) + ${n(km(j3))}`,
      fauxCalculs: [`${n(km(j1))} + ${n(km(plus))} + ${n(km(j3))}`, `${n(km(j1))} + ${n(km(plus))}`],
      fausses: [km(j1 + plus + j3), km(j2), km(t + 10)],
      explication: `Le jour 2, la classe marche ${n(km(j1))} + ${n(km(plus))} = ${n(km(j2))} km ; en tout : ${n(km(j1))} + ${n(km(j2))} + ${n(km(j3))} = ${n(km(t))} km.`,
      difficulty: 0.85,
    };
  }
  if (forme === 2) {
    // Citerne : 3 étapes en litres
    const depart = rng.int(800, 2500);
    const a = rng.int(120, 400);
    const b = rng.int(150, 600);
    const c = rng.int(100, 400);
    const r = depart - a + b - c;
    return {
      sig: `citerne-${depart}-${a}-${b}-${c}`,
      statement: `Une citerne contient ${fmt(depart)} L d’eau de pluie. Lundi, le jardinier utilise ${a} L pour arroser. Mardi, un orage ajoute ${b} L. Mercredi, il utilise encore ${c} L.`,
      question: 'Combien de litres d’eau la citerne contient-elle mercredi soir ?',
      answer: r,
      unit: 'L',
      structure: 'deux-etapes',
      bars: [
        {
          label: 'eau reçue',
          segments: [
            { value: depart, label: 'au début' },
            { value: b, label: 'orage' },
          ],
        },
        {
          label: 'eau disponible',
          segments: [
            { value: a, label: 'lundi' },
            { value: c, label: 'mercredi' },
            { value: null, label: 'reste' },
          ],
        },
      ],
      total: depart + b,
      answerSentence: 'Mercredi soir, la citerne contient ___ L d’eau.',
      reformulations: [
        'De l’eau est utilisée deux fois et ajoutée une fois : on cherche ce qui reste à la fin.',
        'De l’eau est ajoutée trois fois : on cherche le total.',
        'On cherche combien de litres le jardinier a utilisés en tout.',
      ],
      operation: `${fmt(depart)} − ${a} = ${fmt(depart - a)} ; ${fmt(depart - a)} + ${b} = ${fmt(depart - a + b)} ; ${fmt(depart - a + b)} − ${c} = ${fmt(r)}`,
      calcul: `${fmt(depart)} − ${a} + ${b} − ${c}`,
      fauxCalculs: [`${fmt(depart)} + ${a} + ${b} + ${c}`, `${fmt(depart)} − ${a} − ${b} − ${c}`],
      fausses: [depart - a - b - c, depart + a + b + c, a + c],
      explication: `On suit les jours dans l’ordre : ${fmt(depart)} − ${a} = ${fmt(depart - a)}, puis + ${b} = ${fmt(depart - a + b)}, puis − ${c} = ${fmt(r)} L.`,
      difficulty: 0.8,
    };
  }
  // Grands nombres : une tournée de concerts en trois villes, avec une comparaison
  const v1 = rng.int(12, 60) * 1000 + rng.int(0, 999);
  const moins = rng.int(1500, 9000);
  const v2 = v1 - moins;
  const v3 = rng.int(8, 45) * 1000 + rng.int(0, 999);
  const t = v1 + v2 + v3;
  return {
    sig: `tournee-${v1}-${moins}-${v3}`,
    statement: `Une chanteuse donne trois concerts. À Lyon, ${fmt(v1)} spectateurs viennent l’écouter. À Lille, il y en a ${fmt(moins)} de moins qu’à Lyon. À Nantes, il y en a ${fmt(v3)}.`,
    question: 'Combien de spectateurs ont assisté aux trois concerts ?',
    answer: t,
    structure: 'deux-etapes',
    bars: [
      { label: 'Lyon', segments: [{ value: v1 }] },
      {
        label: 'Lille',
        segments: [
          { value: null, label: '?' },
          { value: moins, label: 'de moins' },
        ],
      },
      { label: 'Nantes', segments: [{ value: v3 }] },
    ],
    total: null,
    answerSentence: 'En tout, ___ spectateurs ont assisté aux trois concerts.',
    reformulations: [
      'On trouve d’abord le nombre de spectateurs de Lille, puis on ajoute les trois concerts.',
      'On ajoute les trois nombres écrits dans l’énoncé.',
      'On cherche seulement le nombre de spectateurs de Lille.',
    ],
    operation: `${fmt(v1)} − ${fmt(moins)} = ${fmt(v2)} ; ${fmt(v1)} + ${fmt(v2)} + ${fmt(v3)} = ${fmt(t)}`,
    calcul: `${fmt(v1)} + (${fmt(v1)} − ${fmt(moins)}) + ${fmt(v3)}`,
    fauxCalculs: [
      `${fmt(v1)} + ${fmt(moins)} + ${fmt(v3)}`,
      `${fmt(v1)} + (${fmt(v1)} + ${fmt(moins)}) + ${fmt(v3)}`,
    ],
    fausses: [v1 + moins + v3, t + 2 * moins, v2],
    explication: `À Lille : ${fmt(v1)} − ${fmt(moins)} = ${fmt(v2)} spectateurs ; en tout : ${fmt(v1)} + ${fmt(v2)} + ${fmt(v3)} = ${fmt(t)}.`,
    difficulty: 0.85,
  };
}

const pbAdditif = (level: Level, rng: Rng): Pb =>
  parNiv(level, {
    facile: () => addFacile(rng),
    normal: () => addNormal(rng),
    plus_loin: () => addPlusLoin(rng),
  })();

/* ------------------------------------------------------------------ */
/* CM2.MA.PB.MULTIPLICATIFS                                            */
/* ------------------------------------------------------------------ */

const RANGEMENTS: { cont: string; sg: string; obj: string; fem: boolean; tailles: number[] }[] = [
  { cont: 'boites', sg: 'boite', obj: 'œufs', fem: false, tailles: [6, 12] },
  { cont: 'cartons', sg: 'carton', obj: 'livres', fem: false, tailles: [8, 9, 12, 15] },
  { cont: 'packs', sg: 'pack', obj: 'bouteilles', fem: true, tailles: [4, 6, 8] },
  { cont: 'sachets', sg: 'sachet', obj: 'graines', fem: true, tailles: [5, 7, 25] },
  { cont: 'plateaux', sg: 'plateau', obj: 'gâteaux', fem: false, tailles: [9, 12, 16] },
];

function multEntiers(level: Level, rng: Rng, forme = rng.int(0, 4)): Pb {
  const [p, q] = deuxPrenoms(rng);
  const grand = level !== 'facile';
  switch (forme) {
    case 0: {
      const r = rng.int(grand ? 12 : 5, grand ? 35 : 15);
      const f = rng.int(grand ? 18 : 8, grand ? 42 : 20);
      const t = r * f;
      return {
        sig: `cinema-${r}-${f}`,
        statement: `Une salle de cinéma a ${r} rangées de ${f} fauteuils.`,
        question: 'Combien y a-t-il de fauteuils dans la salle ?',
        answer: t,
        structure: 'multiplicatif',
        bars: [{ label: `${r} rangées`, segments: parts(r, f) }],
        total: null,
        answerSentence: 'Il y a ___ fauteuils dans la salle.',
        reformulations: [
          `Il y a ${r} fois ${f} fauteuils : on cherche le nombre total de fauteuils.`,
          'On cherche le nombre de fauteuils dans une rangée.',
          `On ajoute ${r} fauteuils et ${f} fauteuils.`,
        ],
        operation: `${r} × ${f} = ${fmt(t)}`,
        calcul: `${r} × ${f}`,
        fauxCalculs: [`${r} + ${f}`, `${r} + ${f} + ${f}`],
        fausses: [r + f, t + f, t - r],
        explication: `${cap(accord(r, 'rangée'))} de ${f} fauteuils, c’est ${r} fois ${f} : ${r} × ${f} = ${fmt(t)}.`,
        difficulty: grand ? 0.4 : 0.2,
      };
    }
    case 1: {
      // Groupement (quotition)
      const R = rng.pick(RANGEMENTS);
      const v = rng.pick(R.tailles);
      const k = rng.int(grand ? 25 : 4, grand ? 160 : 12);
      const t = k * v;
      return {
        sig: `quot-${R.obj}-${t}-${v}`,
        statement: `On range ${fmt(t)} ${R.obj} dans des ${R.cont} de ${v} ${R.obj}. Chaque ${R.sg} est rempli${R.sg === 'boite' ? 'e' : ''}.`,
        question: `Combien ${de(R.cont)} faut-il ?`,
        answer: k,
        structure: 'partage',
        bars: [{ label: R.obj, segments: parts(k, v, () => R.sg) }],
        total: t,
        answerSentence: `Il faut ___ ${R.cont}.`,
        reformulations: [
          `On fait des paquets de ${v} avec ${fmt(t)} ${R.obj} : on cherche le nombre de paquets.`,
          `On cherche combien il y a ${de(R.obj)} dans chaque ${R.sg}.`,
          `On cherche le nombre total ${de(R.obj)}.`,
        ],
        operation: `${fmt(t)} ÷ ${v} = ${k}, car ${k} × ${v} = ${fmt(t)}`,
        calcul: `${fmt(t)} ÷ ${v}`,
        fauxCalculs: [`${fmt(t)} × ${v}`, `${fmt(t)} − ${v}`],
        fausses: [t - v, k + 1, k * 10],
        explication: `On cherche combien de fois ${v} dans ${fmt(t)} : ${k} × ${v} = ${fmt(t)}, donc il faut ${k} ${R.cont}.`,
        difficulty: grand ? 0.55 : 0.35,
      };
    }
    case 2: {
      // Partage (partition)
      const k = rng.int(3, grand ? 9 : 6);
      const v = rng.int(grand ? 25 : 6, grand ? 180 : 25);
      const t = k * v;
      const obj = rng.pick(['cartes', 'billes', 'images', 'perles']);
      return {
        sig: `part-${t}-${k}-${obj}`,
        statement: `${Lettres(k)} enfants se partagent équitablement ${fmt(t)} ${obj}.`,
        question: `Combien ${de(obj)} chaque enfant reçoit-il ?`,
        answer: v,
        structure: 'partage',
        bars: [{ label: obj, segments: parts(k, null, (i) => `enfant ${i + 1}`) }],
        total: t,
        answerSentence: `Chaque enfant reçoit ___ ${obj}.`,
        reformulations: [
          `On partage ${fmt(t)} ${obj} en ${k} parts égales : on cherche une part.`,
          `Chaque enfant a ${fmt(t)} ${obj} : on cherche le total.`,
          'On cherche combien il y a d’enfants.',
        ],
        operation: `${fmt(t)} ÷ ${k} = ${v}, car ${k} × ${v} = ${fmt(t)}`,
        calcul: `${fmt(t)} ÷ ${k}`,
        fauxCalculs: [`${fmt(t)} × ${k}`, `${fmt(t)} − ${k}`],
        fausses: [t - k, t * k, v + 10],
        explication: `Partager en ${k} parts égales, c’est diviser par ${k} : ${fmt(t)} ÷ ${k} = ${v} (vérification : ${k} × ${v} = ${fmt(t)}).`,
        difficulty: grand ? 0.5 : 0.35,
      };
    }
    case 3: {
      // Comparaison multiplicative : « k fois plus »
      const a = rng.int(grand ? 35 : 6, grand ? 250 : 40);
      const k = rng.int(2, grand ? 9 : 5);
      const t = a * k;
      return {
        sig: `foisplus-${a}-${k}`,
        statement: `${q.nom} a ${a} cartes de collection. ${p.nom} en a ${k} fois plus.`,
        question: `Combien de cartes ${p.nom} ${aT(p)} ?`,
        answer: t,
        structure: 'comparaison',
        bars: [
          { label: q.nom, segments: [{ value: a }] },
          { label: p.nom, segments: parts(k, a) },
        ],
        total: null,
        answerSentence: `${p.nom} a ___ cartes.`,
        reformulations: [
          `${p.nom} a ${k} fois le nombre de cartes de ${q.nom}.`,
          `${p.nom} a ${k} cartes de plus que ${q.nom}.`,
          `${q.nom} a ${k} fois plus de cartes que ${p.nom}.`,
        ],
        operation: `${a} × ${k} = ${fmt(t)}`,
        calcul: `${a} × ${k}`,
        fauxCalculs: [`${a} + ${k}`, `${a} + ${a}`],
        fausses: [a + k, a * (k + 1), a + a],
        explication: `« ${k} fois plus », c’est ${k} fois le nombre de cartes de ${q.nom} : ${a} × ${k} = ${fmt(t)}.`,
        difficulty: grand ? 0.45 : 0.3,
      };
    }
    default: {
      // Combien de fois plus ?
      const a = rng.pick([15, 20, 25, 30, 40, 45, 60, 75, 80, 120, 150]);
      const k = rng.int(2, grand ? 12 : 6);
      const b = a * k;
      return {
        sig: `combiendefois-${a}-${b}`,
        statement: `Une trottinette coute ${a} €. Un vélo coute ${fmt(b)} €.`,
        question: 'Combien de fois le vélo coute-t-il plus cher que la trottinette ?',
        answer: k,
        structure: 'comparaison',
        bars: [
          { label: 'trottinette', segments: [{ value: a }] },
          { label: 'vélo', segments: parts(k, a) },
        ],
        total: null,
        answerSentence: 'Le vélo coute ___ fois plus cher que la trottinette.',
        reformulations: [
          `On cherche combien de fois on peut mettre ${a} € dans ${fmt(b)} €.`,
          'On cherche combien d’euros le vélo coute de plus.',
          'On cherche le prix des deux objets ensemble.',
        ],
        operation: `${fmt(b)} ÷ ${a} = ${k}, car ${k} × ${a} = ${fmt(b)}`,
        calcul: `${fmt(b)} ÷ ${a}`,
        fauxCalculs: [`${fmt(b)} − ${a}`, `${fmt(b)} + ${a}`],
        fausses: [b - a, k + 1],
        explication: `On cherche combien de fois ${a} est contenu dans ${fmt(b)} : ${k} × ${a} = ${fmt(b)}, donc ${k} fois plus cher.`,
        difficulty: grand ? 0.55 : 0.45,
      };
    }
  }
}

const ARTICLES: [string, string, number, number][] = [
  // [article au pluriel, article au singulier, prix mini, prix maxi] en centimes
  ['places de cinéma', 'la place', 645, 995],
  ['cahiers', 'le cahier', 135, 345],
  ['croissants', 'le croissant', 95, 145],
  ['billets de train', 'le billet', 1235, 3495],
  ['entrées à la piscine', 'l’entrée', 315, 595],
];

function multDecimaux(rng: Rng, forme = rng.int(0, 3)): Pb {
  const p = rng.pick(PRENOMS);
  switch (forme) {
    case 0: {
      for (let essai = 0; essai < 50; essai++) {
        const [art, sg, lo, hi] = rng.pick(ARTICLES);
        const c = prix(rng, lo, hi);
        const k = rng.int(3, 9);
        const t = c * k;
        if (!centimesSansZeroFinal(t)) continue;
        return {
          sig: `prix-${art}-${c}-${k}`,
          statement: `${p.nom} achète ${k} ${art}. ${cap(sg)} coute ${euros(c)}.`,
          question: `Combien ${p.nom} paie-t-${p.il} ?`,
          answer: eu(t),
          unit: '€',
          structure: 'multiplicatif',
          bars: [{ label: `${k} ${art}`, segments: parts(k, eu(c)) }],
          total: null,
          answerSentence: `${p.nom} paie ___ €.`,
          reformulations: [
            `${p.nom} paie ${k} fois ${euros(c)} : on cherche le prix total.`,
            'On cherche le prix d’un seul article.',
            `On ajoute ${k} € et ${euros(c)}.`,
          ],
          operation: `${n(eu(c))} × ${k} = ${n(eu(t))}`,
          calcul: `${n(eu(c))} × ${k}`,
          fauxCalculs: [`${n(eu(c))} + ${k}`, `${n(eu(c))} × ${k + 1}`],
          fausses: [eu(c + k * 100), eu(t * 10), eu(c * (k + 1))],
          explication: `${k} fois ${euros(c)} : ${n(eu(c))} × ${k} = ${n(eu(t))}, donc ${euros(t)} (on place la virgule comme dans ${n(eu(c))}).`,
          difficulty: 0.5,
        };
      }
      return multDecimaux(rng, 1);
    }
    case 1: {
      const v = rng.pick([150, 75, 33, 125, 25, 175]);
      const k = rng.int(3, 9);
      const t = v * k;
      const L = (c: number) => r3(c / 100);
      return {
        sig: `bouteilles-${v}-${k}`,
        statement: `Pour la fête de l’école, on achète ${k} bouteilles de jus de fruits de ${n(L(v))} L chacune.`,
        question: 'Combien de litres de jus de fruits cela fait-il ?',
        answer: L(t),
        unit: 'L',
        structure: 'multiplicatif',
        bars: [{ label: `${k} bouteilles`, segments: parts(k, L(v)) }],
        total: null,
        answerSentence: 'Cela fait ___ L de jus de fruits.',
        reformulations: [
          `Il y a ${k} fois ${n(L(v))} L : on cherche la quantité totale.`,
          'On cherche combien il y a de bouteilles.',
          'On cherche la quantité dans une seule bouteille.',
        ],
        operation: `${n(L(v))} × ${k} = ${n(L(t))}`,
        calcul: `${n(L(v))} × ${k}`,
        fauxCalculs: [`${n(L(v))} + ${k}`, `${n(L(v))} + ${n(L(v))}`],
        fausses: [L(v + k * 100), L(t * 10), L(v * 2)],
        explication: `${cap(accord(k, 'bouteille'))} de ${n(L(v))} L : ${n(L(v))} × ${k} = ${n(L(t))} L.`,
        difficulty: 0.45,
      };
    }
    case 2: {
      // Division décimale, diviseur à un chiffre
      for (let essai = 0; essai < 80; essai++) {
        const k = rng.int(2, 9);
        const part = prix(rng, 235, 1895);
        const t = part * k;
        return {
          sig: `partage-euros-${t}-${k}`,
          statement: `${Lettres(k)} amis se partagent équitablement le prix d’un cadeau qui coute ${euros(t)}.`,
          question: 'Combien chacun doit-il payer ?',
          answer: eu(part),
          unit: '€',
          structure: 'partage',
          bars: [{ label: euros(t), segments: parts(k, null, (i) => `ami ${i + 1}`) }],
          total: eu(t),
          answerSentence: 'Chacun doit payer ___ €.',
          reformulations: [
            `On partage ${euros(t)} en ${k} parts égales : on cherche une part.`,
            'On cherche le prix total du cadeau.',
            'On cherche combien il y a d’amis.',
          ],
          operation: `${n(eu(t))} ÷ ${k} = ${n(eu(part))}`,
          calcul: `${n(eu(t))} ÷ ${k}`,
          fauxCalculs: [`${n(eu(t))} × ${k}`, `${n(eu(t))} − ${k}`],
          fausses: [eu(t - k * 100), eu(t * k), eu(part + 100)],
          explication: `On divise ${euros(t)} par ${k} : ${n(eu(t))} ÷ ${k} = ${n(eu(part))} (vérification : ${n(eu(part))} × ${k} = ${n(eu(t))}).`,
          difficulty: 0.65,
        };
      }
      return multDecimaux(rng, 1);
    }
    default: {
      const g = rng.int(105, 480) * 10 + rng.int(1, 9);
      const k = rng.int(3, 9);
      const kg = (x: number) => r3(x / 1000);
      return {
        sig: `chiot-${g}-${k}`,
        statement: `Un chiot pèse ${n(kg(g))} kg. Son père pèse ${k} fois plus.`,
        question: 'Combien pèse le père du chiot ?',
        answer: kg(g * k),
        unit: 'kg',
        structure: 'comparaison',
        bars: [
          { label: 'chiot', segments: [{ value: kg(g) }] },
          { label: 'père', segments: parts(k, kg(g)) },
        ],
        total: null,
        answerSentence: 'Le père du chiot pèse ___ kg.',
        reformulations: [
          `Le père pèse ${k} fois la masse du chiot.`,
          `Le père pèse ${k} kg de plus que le chiot.`,
          `Le chiot pèse ${k} fois plus que son père.`,
        ],
        operation: `${n(kg(g))} × ${k} = ${n(kg(g * k))}`,
        calcul: `${n(kg(g))} × ${k}`,
        fauxCalculs: [`${n(kg(g))} + ${k}`, `${n(kg(g))} × ${k + 1}`],
        fausses: [kg(g + k * 1000), kg(g * (k + 1)), kg(g * k * 10)],
        explication: `« ${k} fois plus », c’est ${k} fois la masse du chiot : ${n(kg(g))} × ${k} = ${n(kg(g * k))} kg.`,
        difficulty: 0.55,
      };
    }
  }
}

/** « Fois moins » et comparaisons inversées (attendus au CM2). */
function multFoisMoins(rng: Rng, forme = rng.int(0, 2)): Pb {
  const [p, q] = deuxPrenoms(rng);
  if (forme === 0) {
    // Une girafe adulte (700 à 1 300 kg) pèse k fois moins qu'un éléphant
    const k = rng.int(4, 6);
    const petit = rng.int(70, 130) * 10;
    const grand = petit * k;
    return {
      sig: `foismoins-${grand}-${k}`,
      statement: `Un éléphant d’Afrique pèse ${fmt(grand)} kg. Une girafe adulte pèse ${k} fois moins.`,
      question: 'Combien pèse la girafe ?',
      answer: petit,
      unit: 'kg',
      structure: 'comparaison',
      bars: [
        { label: 'éléphant', segments: parts(k, petit) },
        { label: 'girafe', segments: [{ value: null, label: '?' }] },
      ],
      total: null,
      answerSentence: 'La girafe pèse ___ kg.',
      reformulations: [
        `La girafe pèse ${k} fois moins : il faudrait ${k} girafes pour faire la masse de l’éléphant.`,
        `La girafe pèse ${k} kg de moins que l’éléphant.`,
        `La girafe pèse ${k} fois plus que l’éléphant.`,
      ],
      operation: `${fmt(grand)} ÷ ${k} = ${fmt(petit)}`,
      calcul: `${fmt(grand)} ÷ ${k}`,
      fauxCalculs: [`${fmt(grand)} × ${k}`, `${fmt(grand)} − ${k}`],
      fausses: [grand - k, grand * k, petit + 100],
      explication: `« ${k} fois moins », c’est diviser par ${k} : ${fmt(grand)} ÷ ${k} = ${fmt(petit)} kg.`,
      difficulty: 0.65,
    };
  }
  if (forme === 1) {
    // Comparaison inversée : « fois plus » mais on divise
    const k = rng.int(3, 9);
    const petit = rng.int(25, 140);
    const grand = petit * k;
    return {
      sig: `piege-foisplus-${grand}-${k}`,
      statement: `${p.nom} a ${k} fois plus de timbres que ${q.nom}. ${p.nom} a ${grand} timbres.`,
      question: `Combien de timbres ${q.nom} ${aT(q)} ?`,
      answer: petit,
      structure: 'comparaison',
      bars: [
        { label: p.nom, segments: parts(k, null) },
        { label: q.nom, segments: [{ value: null, label: '?' }] },
      ],
      total: grand,
      answerSentence: `${q.nom} a ___ timbres.`,
      reformulations: [
        `${q.nom} a ${k} fois moins de timbres que ${p.nom}.`,
        `${q.nom} a ${k} fois plus de timbres que ${p.nom}.`,
        `${q.nom} a ${k} timbres de moins que ${p.nom}.`,
      ],
      operation: `${grand} ÷ ${k} = ${petit}`,
      calcul: `${grand} ÷ ${k}`,
      fauxCalculs: [`${grand} × ${k}`, `${grand} − ${k}`],
      fausses: [grand * k, grand - k],
      explication: `Si ${p.nom} a ${k} fois plus de timbres, ${q.nom} en a ${k} fois moins : ${grand} ÷ ${k} = ${petit} (« fois plus » ne veut pas toujours dire « × »).`,
      difficulty: 0.75,
    };
  }
  // « fois moins » mais on multiplie
  const k = rng.int(3, 8);
  const petit = rng.int(25, 60);
  const grand = petit * k;
  return {
    sig: `piege-foismoins-${petit}-${k}`,
    statement: `Un casque de vélo coute ${k} fois moins cher qu’un vélo. Le casque coute ${petit} €.`,
    question: 'Combien coute le vélo ?',
    answer: grand,
    unit: '€',
    structure: 'comparaison',
    bars: [
      { label: 'casque', segments: [{ value: petit }] },
      { label: 'vélo', segments: parts(k, petit) },
    ],
    total: null,
    answerSentence: 'Le vélo coute ___ €.',
    reformulations: [
      `Le vélo coute ${k} fois plus cher que le casque.`,
      `Le vélo coute ${k} fois moins cher que le casque.`,
      `Le vélo coute ${k} € de plus que le casque.`,
    ],
    operation: `${petit} × ${k} = ${fmt(grand)}`,
    calcul: `${petit} × ${k}`,
    fauxCalculs: [`${petit} + ${k}`, `${petit} − ${k}`],
    fausses: [petit + k, Math.floor(petit / k)],
    explication: `Si le casque coute ${k} fois moins, le vélo coute ${k} fois plus : ${petit} × ${k} = ${fmt(grand)} €.`,
    difficulty: 0.75,
  };
}

/** Plus loin : comparaison multiplicative avec une étape de plus, ou diviseur à deux chiffres. */
function multPlusLoin(rng: Rng, forme = rng.int(0, 3)): Pb {
  const [p, q] = deuxPrenoms(rng);
  if (forme === 0) {
    // « k fois plus » puis total
    const a = rng.int(24, 180);
    const k = rng.int(3, 8);
    const b = a * k;
    const t = a + b;
    return {
      sig: `pl-foisplus-total-${a}-${k}`,
      statement: `${q.nom} a ${a} billes. ${p.nom} en a ${k} fois plus.`,
      question: `Combien de billes ${p.nom} et ${q.nom} ont-${p.il === 'elle' && q.il === 'elle' ? 'elles' : 'ils'} ensemble ?`,
      answer: t,
      structure: 'comparaison',
      bars: [
        { label: q.nom, segments: [{ value: a }] },
        { label: p.nom, segments: parts(k, a) },
      ],
      total: null,
      answerSentence: `Ensemble, ${p.nom} et ${q.nom} ont ___ billes.`,
      reformulations: [
        `On cherche d’abord les billes de ${p.nom} (${k} fois plus), puis on ajoute celles de ${q.nom}.`,
        `On cherche seulement les billes de ${p.nom}.`,
        `On ajoute ${a} et ${k}.`,
      ],
      operation: `${a} × ${k} = ${fmt(b)} ; ${a} + ${fmt(b)} = ${fmt(t)}`,
      calcul: `${a} + (${a} × ${k})`,
      fauxCalculs: [`${a} × ${k}`, `${a} + ${k}`],
      fausses: [b, a + k, t + a],
      explication: `${p.nom} a ${a} × ${k} = ${fmt(b)} billes ; ensemble : ${a} + ${fmt(b)} = ${fmt(t)} billes (c’est aussi ${k + 1} fois ${a}).`,
      difficulty: 0.75,
    };
  }
  if (forme === 1) {
    // Parts : le tout et « k fois plus » connus → la petite part
    const k = rng.int(2, 7);
    const petit = rng.int(12, 90);
    const t = petit * (k + 1);
    return {
      sig: `pl-parts-${t}-${k}`,
      statement: `Un vélo coute ${k} fois plus cher qu’un casque. Ensemble, le vélo et le casque coutent ${fmt(t)} €.`,
      question: 'Combien coute le casque ?',
      answer: petit,
      unit: '€',
      structure: 'comparaison',
      bars: [
        { label: 'casque', segments: [{ value: null, label: '?' }] },
        { label: 'vélo', segments: parts(k, null, () => 'comme le casque') },
      ],
      total: t,
      answerSentence: 'Le casque coute ___ €.',
      reformulations: [
        `Le prix total fait ${k + 1} parts égales au prix du casque : 1 pour le casque et ${k} pour le vélo.`,
        `Le prix total fait ${k} parts égales.`,
        `Le casque coute ${k} € de moins que le vélo.`,
      ],
      operation: `${k} + 1 = ${k + 1} parts ; ${fmt(t)} ÷ ${k + 1} = ${petit}`,
      calcul: `${fmt(t)} ÷ (${k} + 1)`,
      fauxCalculs: [`${fmt(t)} ÷ ${k}`, `${fmt(t)} − ${k}`],
      fausses: [t - k, Math.round(t / k), petit * k],
      explication: `Le vélo vaut ${k} casques : le total vaut ${k + 1} casques, donc ${fmt(t)} ÷ ${k + 1} = ${petit} € (vérification : ${petit} + ${petit * k} = ${fmt(t)}).`,
      difficulty: 0.9,
    };
  }
  if (forme === 2) {
    // Diviseur à deux chiffres (groupement)
    const v = rng.pick([12, 15, 16, 18, 24, 25, 28, 32]);
    const k = rng.int(12, 45);
    const t = v * k;
    return {
      sig: `pl-quot2-${t}-${v}`,
      statement: `Une école organise un tournoi pour ${fmt(t)} élèves. On fait des équipes de ${v} élèves.`,
      question: 'Combien d’équipes peut-on former ?',
      answer: k,
      structure: 'partage',
      bars: [{ label: 'élèves', segments: parts(k, v, () => 'équipe') }],
      total: t,
      answerSentence: 'On peut former ___ équipes.',
      reformulations: [
        `On fait des groupes de ${v} avec ${fmt(t)} élèves : on cherche le nombre de groupes.`,
        'On cherche combien il y a d’élèves dans une équipe.',
        'On cherche le nombre total d’élèves.',
      ],
      operation: `${fmt(t)} ÷ ${v} = ${k}, car ${k} × ${v} = ${fmt(t)}`,
      calcul: `${fmt(t)} ÷ ${v}`,
      fauxCalculs: [`${fmt(t)} × ${v}`, `${fmt(t)} − ${v}`],
      fausses: [t - v, k + 1, k * 10],
      explication: `On cherche combien de fois ${v} dans ${fmt(t)} : ${k} × ${v} = ${fmt(t)}, donc ${k} équipes.`,
      difficulty: 0.8,
    };
  }
  // « fois moins » avec un diviseur à deux chiffres
  const k = rng.pick([10, 12, 15, 20, 25]);
  const petit = rng.int(12, 60);
  const grand = petit * k;
  return {
    sig: `pl-foismoins2-${grand}-${k}`,
    statement: `Une baleine bleue peut avaler ${fmt(grand)} kg de krill par jour. Un éléphant mange ${k} fois moins de nourriture.`,
    question: 'Combien de kilogrammes de nourriture l’éléphant mange-t-il par jour ?',
    answer: petit,
    unit: 'kg',
    structure: 'comparaison',
    bars: [
      { label: 'baleine', segments: parts(k, petit) },
      { label: 'éléphant', segments: [{ value: null, label: '?' }] },
    ],
    total: null,
    answerSentence: 'L’éléphant mange ___ kg de nourriture par jour.',
    reformulations: [
      `L’éléphant mange ${k} fois moins : on partage la quantité de la baleine en ${k} parts égales.`,
      `L’éléphant mange ${k} kg de moins que la baleine.`,
      `L’éléphant mange ${k} fois plus que la baleine.`,
    ],
    operation: `${fmt(grand)} ÷ ${k} = ${petit}`,
    calcul: `${fmt(grand)} ÷ ${k}`,
    fauxCalculs: [`${fmt(grand)} × ${k}`, `${fmt(grand)} − ${k}`],
    fausses: [grand - k, grand * k],
    explication: `« ${k} fois moins », c’est diviser par ${k} : ${fmt(grand)} ÷ ${k} = ${petit} kg.`,
    difficulty: 0.8,
  };
}

const pbMultiplicatif = (level: Level, rng: Rng): Pb =>
  parNiv(level, {
    facile: () => multEntiers('facile', rng),
    normal: () => {
      const r = rng.next();
      if (r < 0.4) return multDecimaux(rng);
      if (r < 0.7) return multFoisMoins(rng);
      return multEntiers('normal', rng);
    },
    plus_loin: () => multPlusLoin(rng),
  })();

/* ------------------------------------------------------------------ */
/* CM2.MA.PB.MIXTES                                                    */
/* ------------------------------------------------------------------ */

/** Facile : deux étapes, entiers. */
function mixteFacile(rng: Rng, forme = rng.int(0, 3)): Pb {
  const p = rng.pick(PRENOMS);
  switch (forme) {
    case 0: {
      const [art, sg] = rng.pick([
        ['places de concert', 'la place'],
        ['livres', 'le livre'],
        ['ballons', 'le ballon'],
      ] as const);
      const k = rng.int(2, 6);
      const c = rng.int(4, 15);
      const cout = k * c;
      const billet = [20, 50, 100].find((b) => b > cout)!;
      return {
        sig: `mixf-rendu-${k}-${c}-${billet}`,
        statement: `${p.nom} achète ${k} ${art} à ${c} € ${sg}. ${cap(p.il)} paie avec un billet de ${billet} €.`,
        question: 'Combien le vendeur lui rend-il ?',
        answer: billet - cout,
        unit: '€',
        structure: 'deux-etapes',
        bars: [
          {
            label: `${billet} €`,
            segments: [
              { value: cout, label: `${k} × ${c} €` },
              { value: null, label: 'monnaie' },
            ],
          },
        ],
        total: billet,
        answerSentence: 'Le vendeur lui rend ___ €.',
        reformulations: [
          `D’abord on calcule le prix des ${k} ${art}, puis la monnaie sur ${billet} €.`,
          'On cherche seulement le prix d’un article.',
          `On ajoute ${k} €, ${c} € et ${billet} €.`,
        ],
        operation: `${k} × ${c} = ${cout} ; ${billet} − ${cout} = ${billet - cout}`,
        calcul: `${billet} − (${k} × ${c})`,
        fauxCalculs: [`${billet} − ${c}`, `(${billet} − ${k}) × ${c}`],
        fausses: [cout, billet - c, billet + cout],
        explication: `Étape 1 : ${k} × ${c} € = ${cout} €. Étape 2 : ${billet} € − ${cout} € = ${billet - cout} €.`,
        difficulty: 0.4,
      };
    }
    case 1: {
      const a = rng.int(4, 9);
      const b = rng.pick([1, 2, 3].filter((x) => x !== a));
      const k = rng.int(4, 12);
      const [qui, il] = rng.chance(0.5) ? ['le maitre', 'il'] : ['la maitresse', 'elle'];
      return {
        sig: `mixf-lots-${a}-${b}-${k}-${qui}`,
        statement: `Un classeur coute ${a} € et un paquet de feuilles coute ${b} €. ${cap(qui)} achète ${k} classeurs et autant de paquets de feuilles.`,
        question: `Combien ${qui} paie-t-${il} en tout ?`,
        answer: (a + b) * k,
        unit: '€',
        structure: 'deux-etapes',
        bars: [{ label: `${k} lots`, segments: parts(k, a + b) }],
        total: null,
        answerSentence: `${cap(qui)} paie ___ € en tout.`,
        reformulations: [
          `${cap(qui)} achète ${k} fois un classeur et un paquet de feuilles : on cherche le prix total.`,
          'On cherche le prix d’un seul classeur.',
          `${cap(qui)} achète ${k} classeurs seulement.`,
        ],
        operation: `${a} + ${b} = ${a + b} ; ${k} × ${a + b} = ${(a + b) * k}`,
        calcul: `${k} × (${a} + ${b})`,
        fauxCalculs: [`(${k} × ${a}) + ${b}`, `${k} + ${a} + ${b}`],
        fausses: [k * a + b, k + a + b, k * a],
        explication: `Un classeur et un paquet coutent ${a} + ${b} = ${a + b} € ; ${k} fois : ${k} × ${a + b} = ${(a + b) * k} €.`,
        difficulty: 0.45,
      };
    }
    case 2: {
      const R = rng.pick(RANGEMENTS);
      const v = rng.pick(R.tailles);
      const k = rng.int(3, 9);
      const vendu = rng.int(5, k * v - 5);
      return {
        sig: `mixf-reste-${R.obj}-${k}-${v}-${vendu}`,
        statement: `Le magasin a reçu ${k} ${R.cont} de ${v} ${R.obj}. Il en vend ${vendu}.`,
        question: `Combien ${de(R.obj)} reste-t-il au magasin ?`,
        answer: k * v - vendu,
        structure: 'deux-etapes',
        bars: [
          { label: `${k} ${R.cont}`, segments: parts(k, v) },
          {
            label: R.obj,
            segments: [
              { value: vendu, label: R.fem ? 'vendues' : 'vendus' },
              { value: null, label: 'reste' },
            ],
          },
        ],
        total: k * v,
        answerSentence: `Il reste ___ ${R.obj} au magasin.`,
        reformulations: [
          `D’abord on calcule combien ${de(R.obj)} le magasin a ${R.fem ? 'reçues' : 'reçus'}, puis on enlève ${R.fem ? 'celles' : 'ceux'} qui sont ${R.fem ? 'vendues' : 'vendus'}.`,
          `On cherche combien ${de(R.obj)} le magasin a ${R.fem ? 'vendues' : 'vendus'}.`,
          `Le magasin reçoit encore ${vendu} ${R.obj}.`,
        ],
        operation: `${k} × ${v} = ${k * v} ; ${k * v} − ${vendu} = ${k * v - vendu}`,
        calcul: `(${k} × ${v}) − ${vendu}`,
        fauxCalculs: [`(${k} × ${v}) + ${vendu}`, `${k} + ${v} − ${vendu}`],
        fausses: [k * v + vendu, k * v],
        explication: `Étape 1 : ${k} × ${v} = ${k * v}. Étape 2 : ${k * v} − ${vendu} = ${k * v - vendu}.`,
        difficulty: 0.4,
      };
    }
    default: {
      // Deux enfants mettent leurs bonbons en commun et les partagent avec un ou deux cousins
      const [c1, c2] = rng.shuffle(PRENOMS.filter((x) => x.nom !== p.nom)) as [Perso, Perso];
      const fille = p.il === 'elle';
      const k = rng.pick([3, 4]);
      const part = rng.int(8, 30);
      const t = part * k;
      const a = rng.int(5, t - 5);
      const b = t - a;
      const sibling = fille ? 'sa sœur' : 'son frère';
      const eux = fille ? 'elles deux' : 'eux deux';
      const cousins = k === 3 ? `leur cousin ${c1.nom}` : `leurs cousins ${c1.nom} et ${c2.nom}`;
      return {
        sig: `mixf-partage-${a}-${b}-${k}-${fille}`,
        statement: `${p.nom} a ${a} bonbons et ${sibling} en a ${b}. ${fille ? 'Elles' : 'Ils'} mettent leurs bonbons ensemble et les partagent équitablement entre ${eux} et ${cousins}.`,
        question: 'Combien de bonbons chaque enfant reçoit-il ?',
        answer: part,
        structure: 'deux-etapes',
        bars: [
          {
            label: 'bonbons',
            segments: [
              { value: a, label: p.nom },
              { value: b, label: sibling },
            ],
          },
          { label: `${k} parts`, segments: parts(k, null) },
        ],
        total: t,
        answerSentence: 'Chaque enfant reçoit ___ bonbons.',
        reformulations: [
          `D’abord on calcule le total des bonbons, puis on le partage en ${k} parts égales.`,
          `On partage seulement les bonbons de ${p.nom}.`,
          'On cherche le nombre total de bonbons.',
        ],
        operation: `${a} + ${b} = ${t} ; ${t} ÷ ${k} = ${part}`,
        calcul: `(${a} + ${b}) ÷ ${k}`,
        fauxCalculs: [`${a} + (${b} ÷ ${k})`, `${a} + ${b} − ${k}`],
        fausses: [t, t - k],
        explication: `Il y a ${k} enfants en tout. Étape 1 : ${a} + ${b} = ${t} bonbons. Étape 2 : ${t} ÷ ${k} = ${part} (car ${k} × ${part} = ${t}).`,
        difficulty: 0.5,
      };
    }
  }
}

/** Normal : trois étapes (décimaux). */
function mixteNormal(rng: Rng, forme = rng.int(0, 2)): Pb {
  const p = rng.pick(PRENOMS);
  if (forme === 0) {
    // Cinéma : 2 produits + somme
    for (let essai = 0; essai < 60; essai++) {
      const na = rng.int(2, 4);
      const ne = rng.int(2, 5);
      const pa = prix(rng, 845, 1195);
      const pe = prix(rng, 515, 745);
      const t = na * pa + ne * pe;
      if (!centimesSansZeroFinal(t)) continue;
      return {
        sig: `mixn-cinema-${na}-${pa}-${ne}-${pe}`,
        statement: `Au cinéma, la place adulte coute ${euros(pa)} et la place enfant ${euros(pe)}. La famille de ${p.nom} achète ${na} places adultes et ${ne} places enfants.`,
        question: 'Combien la famille paie-t-elle ?',
        answer: eu(t),
        unit: '€',
        structure: 'deux-etapes',
        bars: [
          { label: 'adultes', segments: parts(na, eu(pa)) },
          { label: 'enfants', segments: parts(ne, eu(pe)) },
        ],
        total: null,
        answerSentence: 'La famille paie ___ €.',
        reformulations: [
          'On calcule le prix des places adultes, celui des places enfants, puis on ajoute.',
          'On ajoute le prix d’une place adulte et celui d’une place enfant.',
          `On cherche seulement le prix des ${na} places adultes.`,
        ],
        operation: `${na} × ${n(eu(pa))} = ${n(eu(na * pa))} ; ${ne} × ${n(eu(pe))} = ${n(eu(ne * pe))} ; ${n(eu(na * pa))} + ${n(eu(ne * pe))} = ${n(eu(t))}`,
        calcul: `(${na} × ${n(eu(pa))}) + (${ne} × ${n(eu(pe))})`,
        fauxCalculs: [`${n(eu(pa))} + ${n(eu(pe))}`, `(${na} + ${ne}) × ${n(eu(pa))}`],
        fausses: [eu(pa + pe), eu((na + ne) * pa), eu(na * pa)],
        explication: `Adultes : ${na} × ${euros(pa)} = ${euros(na * pa)} ; enfants : ${ne} × ${euros(pe)} = ${euros(ne * pe)} ; en tout ${euros(t)}.`,
        difficulty: 0.65,
      };
    }
  }
  if (forme === 1) {
    // Sortie : cars (multiplication, addition, division avec reste)
    const cl = rng.int(3, 6);
    const el = rng.int(22, 29);
    const ad = rng.int(6, 14);
    const places = rng.pick([45, 50, 55, 60]);
    const t = cl * el + ad;
    const q = Math.floor(t / places);
    const reste = t % places;
    if (reste === 0) return mixteNormal(rng, 0);
    const cars = q + 1;
    return {
      sig: `mixn-cars-${cl}-${el}-${ad}-${places}`,
      statement: `${Lettres(cl)} classes de ${el} élèves partent en sortie avec ${ad} adultes. Chaque car a ${places} places.`,
      question: 'Combien de cars faut-il au minimum ?',
      answer: cars,
      structure: 'partage',
      bars: [
        { label: 'élèves', segments: parts(cl, el) },
        {
          label: 'cars',
          segments: [...parts(Math.min(q, 4), places), { value: reste, label: 'dernier car' }],
        },
      ],
      total: t,
      answerSentence: 'Il faut au minimum ___ cars.',
      reformulations: [
        'On compte tous les voyageurs, puis on cherche combien de cars il faut pour que tout le monde ait une place.',
        'On cherche combien d’élèves il y a dans une classe.',
        'On cherche combien de places il reste dans le dernier car.',
      ],
      operation: `${cl} × ${el} = ${cl * el} ; ${cl * el} + ${ad} = ${t} ; ${t} = ${q} × ${places} + ${reste}, donc ${q} + 1 = ${cars}`,
      fausses: [q, t, cars + 1],
      explication: `Il y a ${cl} × ${el} + ${ad} = ${t} voyageurs ; ${accord(q, 'car')} ${q >= 2 ? 'transportent' : 'transporte'} ${q * places} personnes, il en reste ${reste} : il faut un car de plus, donc ${cars} cars.`,
      difficulty: 0.75,
      meta: { donnees: { classes: cl, eleves: el, adultes: ad, places } },
    };
  }
  // Achats + rendu (3 étapes)
  for (let essai = 0; essai < 60; essai++) {
    const k = rng.int(2, 5);
    const c1 = prix(rng, 125, 495);
    const c2 = prix(rng, 315, 1295);
    const s = k * c1 + c2;
    const billet = [1000, 2000, 5000].find((b) => b > s + 50);
    if (!billet) continue;
    const r = billet - s;
    if (!centimesSansZeroFinal(r)) continue;
    return {
      sig: `mixn-rendu-${k}-${c1}-${c2}-${billet}`,
      statement: `${p.nom} achète ${k} stylos à ${euros(c1)} l’un et une trousse à ${euros(c2)}. ${cap(p.il)} paie avec un billet de ${euros(billet)}.`,
      question: 'Combien le vendeur lui rend-il ?',
      answer: eu(r),
      unit: '€',
      structure: 'deux-etapes',
      bars: [
        {
          label: euros(billet),
          segments: [
            { value: eu(k * c1), label: `${k} stylos` },
            { value: eu(c2), label: 'trousse' },
            { value: null, label: 'monnaie' },
          ],
        },
      ],
      total: eu(billet),
      answerSentence: 'Le vendeur lui rend ___ €.',
      reformulations: [
        `On calcule le prix des stylos, on ajoute la trousse, puis on cherche la monnaie sur ${euros(billet)}.`,
        'On cherche seulement le prix des achats.',
        'On enlève le prix d’un seul stylo et de la trousse au billet.',
      ],
      operation: `${k} × ${n(eu(c1))} = ${n(eu(k * c1))} ; ${n(eu(k * c1))} + ${n(eu(c2))} = ${n(eu(s))} ; ${n(eu(billet))} − ${n(eu(s))} = ${n(eu(r))}`,
      calcul: `${n(eu(billet))} − ((${k} × ${n(eu(c1))}) + ${n(eu(c2))})`,
      fauxCalculs: [
        `${n(eu(billet))} − (${n(eu(c1))} + ${n(eu(c2))})`,
        `(${k} × ${n(eu(c1))}) + ${n(eu(c2))}`,
      ],
      fausses: [eu(billet - c1 - c2), eu(s), eu(r + 100)],
      explication: `Les stylos coutent ${k} × ${euros(c1)} = ${euros(k * c1)} ; avec la trousse, ${euros(s)} ; le vendeur rend ${euros(billet)} − ${euros(s)} = ${euros(r)}.`,
      difficulty: 0.7,
    };
  }
  return mixteNormal(rng, 1);
}

/** Plus loin : quatre étapes. */
function mixtePlusLoin(rng: Rng, forme = rng.int(0, 1)): Pb {
  const p = rng.pick(PRENOMS);
  if (forme === 0) {
    for (let essai = 0; essai < 60; essai++) {
      const k1 = rng.int(2, 5);
      const k2 = rng.int(2, 4);
      const c1 = prix(rng, 115, 395);
      const c2 = prix(rng, 235, 695);
      const s = k1 * c1 + k2 * c2;
      const billet = [2000, 5000].find((b) => b > s + 50);
      if (!billet) continue;
      const r = billet - s;
      if (!centimesSansZeroFinal(r)) continue;
      return {
        sig: `mixp-rendu-${k1}-${c1}-${k2}-${c2}-${billet}`,
        statement: `Au marché, ${p.nom} achète ${k1} kg de pommes à ${euros(c1)} le kilo et ${k2} kg de cerises à ${euros(c2)} le kilo. ${cap(p.il)} paie avec un billet de ${euros(billet)}.`,
        question: 'Combien le marchand lui rend-il ?',
        answer: eu(r),
        unit: '€',
        structure: 'deux-etapes',
        bars: [
          { label: 'pommes', segments: parts(k1, eu(c1)) },
          { label: 'cerises', segments: parts(k2, eu(c2)) },
          {
            label: euros(billet),
            segments: [
              { value: eu(s), label: 'achats' },
              { value: null, label: 'monnaie' },
            ],
          },
        ],
        total: null,
        answerSentence: 'Le marchand lui rend ___ €.',
        reformulations: [
          'On calcule le prix des pommes et celui des cerises, on les ajoute, puis on cherche la monnaie.',
          'On cherche seulement le prix des fruits.',
          'On enlève au billet le prix d’un kilo de pommes et d’un kilo de cerises.',
        ],
        operation: `${k1} × ${n(eu(c1))} = ${n(eu(k1 * c1))} ; ${k2} × ${n(eu(c2))} = ${n(eu(k2 * c2))} ; ${n(eu(k1 * c1))} + ${n(eu(k2 * c2))} = ${n(eu(s))} ; ${n(eu(billet))} − ${n(eu(s))} = ${n(eu(r))}`,
        calcul: `${n(eu(billet))} − ((${k1} × ${n(eu(c1))}) + (${k2} × ${n(eu(c2))}))`,
        fauxCalculs: [
          `${n(eu(billet))} − (${n(eu(c1))} + ${n(eu(c2))})`,
          `(${k1} × ${n(eu(c1))}) + (${k2} × ${n(eu(c2))})`,
        ],
        fausses: [eu(s), eu(billet - c1 - c2), eu(r + 100)],
        explication: `Pommes : ${euros(k1 * c1)} ; cerises : ${euros(k2 * c2)} ; total : ${euros(s)} ; monnaie : ${euros(billet)} − ${euros(s)} = ${euros(r)}.`,
        difficulty: 0.85,
      };
    }
  }
  const n1 = rng.int(4, 12);
  const v1 = rng.int(12, 25);
  const n2 = rng.int(3, 9);
  const v2 = rng.int(15, 30);
  const vendu = rng.int(20, Math.floor((n1 * v1 + n2 * v2) / 2));
  const r = n1 * v1 + n2 * v2 - vendu;
  return {
    sig: `mixp-jardin-${n1}-${v1}-${n2}-${v2}-${vendu}`,
    statement: `Un maraicher plante ${n1} rangées de ${v1} salades et ${n2} rangées de ${v2} poireaux. Il vend ${vendu} légumes au marché.`,
    question: 'Combien de légumes lui reste-t-il ?',
    answer: r,
    structure: 'deux-etapes',
    bars: [
      { label: 'salades', segments: parts(n1, v1) },
      { label: 'poireaux', segments: parts(n2, v2) },
      {
        label: 'légumes',
        segments: [
          { value: vendu, label: 'vendus' },
          { value: null, label: 'reste' },
        ],
      },
    ],
    total: null,
    answerSentence: 'Il lui reste ___ légumes.',
    reformulations: [
      'On calcule les salades, puis les poireaux, on ajoute, puis on enlève les légumes vendus.',
      'On cherche seulement le nombre de salades.',
      'On cherche combien de légumes le maraicher a vendus.',
    ],
    operation: `${n1} × ${v1} = ${n1 * v1} ; ${n2} × ${v2} = ${n2 * v2} ; ${n1 * v1} + ${n2 * v2} = ${n1 * v1 + n2 * v2} ; ${n1 * v1 + n2 * v2} − ${vendu} = ${r}`,
    calcul: `(${n1} × ${v1}) + (${n2} × ${v2}) − ${vendu}`,
    fauxCalculs: [`(${n1} × ${v1}) + (${n2} × ${v2})`, `${n1} + ${v1} + ${n2} + ${v2} − ${vendu}`],
    fausses: [n1 * v1 + n2 * v2, r + 10, r + 100],
    explication: `${n1} × ${v1} = ${n1 * v1} salades, ${n2} × ${v2} = ${n2 * v2} poireaux, soit ${n1 * v1 + n2 * v2} légumes ; ${n1 * v1 + n2 * v2} − ${vendu} = ${r}.`,
    difficulty: 0.85,
  };
}

const pbMixte = (level: Level, rng: Rng): Pb =>
  parNiv(level, {
    facile: () => mixteFacile(rng),
    normal: () => mixteNormal(rng),
    plus_loin: () => mixtePlusLoin(rng),
  })();

/* ------------------------------------------------------------------ */
/* CM2.MA.PB.PROPORTION — linéarité en langage naturel                 */
/* ------------------------------------------------------------------ */

interface SituationProp {
  /** Grandeur 1 (nombre de…), grandeur 2 (avec unité). */
  g1: string;
  g2: string;
  unit: string;
  /** L'objet compté, au singulier et au pluriel. */
  sg: string;
  pl: string;
  /** Première donnée : « Quatre pains aux raisins coutent 7 €. » */
  enonce: (x: number, y: string) => string;
  /** Deuxième donnée : « Cinq de ces bouteilles contiennent 3,75 L d’eau. » */
  enonce2: (x: number, y: string) => string;
  question: (x: number) => string;
  phrase: (x: number) => string;
  /** Effet sur la seconde grandeur : « 3 fois plus cher », « 3 fois moins de farine ». */
  effet: (k: number, sens: 'plus' | 'moins') => string;
  /** Valeur pour 1 objet, en centièmes de l'unité (prix en centimes) ou en unités entières. */
  unite: [number, number];
  /** Diviseur pour passer à l'unité affichée (100 pour les euros, 1 pour les grammes). */
  echelle: number;
}

const SITUATIONS: SituationProp[] = [
  {
    g1: 'Nombre de pains aux raisins',
    g2: 'Prix (€)',
    unit: '€',
    sg: 'pain aux raisins',
    pl: 'pains aux raisins',
    enonce: (x, y) => `${Lettres(x)} pains aux raisins coutent ${y}.`,
    enonce2: (x, y) => `${Lettres(x)} pains aux raisins coutent ${y}.`,
    question: (x) => `Combien coutent ${x} pains aux raisins ?`,
    phrase: (x) => `Les ${x} pains aux raisins coutent ___ €.`,
    effet: (k, s) => `${k} fois ${s} cher`,
    unite: [115, 195],
    echelle: 100,
  },
  {
    g1: 'Nombre de crêpes',
    g2: 'Farine (g)',
    unit: 'g',
    sg: 'crêpe',
    pl: 'crêpes',
    enonce: (x, y) => `Pour faire ${x} crêpes, il faut ${y} de farine.`,
    enonce2: (x, y) => `Pour ${x} crêpes, il faut ${y} de farine.`,
    question: (x) => `Quelle masse de farine faut-il pour faire ${x} crêpes ?`,
    phrase: (x) => `Pour ${x} crêpes, il faut ___ g de farine.`,
    effet: (k, s) => `${k} fois ${s} de farine`,
    unite: [20, 35],
    echelle: 1,
  },
  {
    g1: 'Nombre de tours de piste',
    g2: 'Distance (m)',
    unit: 'm',
    sg: 'tour',
    pl: 'tours',
    enonce: (x, y) => `En faisant ${x} tours de piste, on parcourt ${y}.`,
    enonce2: (x, y) => `En faisant ${x} tours, on parcourt ${y}.`,
    question: (x) => `Quelle distance parcourt-on en faisant ${x} tours de piste ?`,
    phrase: (x) => `En ${x} tours, on parcourt ___ m.`,
    effet: (k, s) => `une distance ${k} fois ${s === 'plus' ? 'plus grande' : 'plus petite'}`,
    unite: [150, 400],
    echelle: 1,
  },
  {
    g1: 'Nombre de bouteilles',
    g2: 'Contenance (L)',
    unit: 'L',
    sg: 'bouteille',
    pl: 'bouteilles',
    enonce: (x, y) => `${Lettres(x)} bouteilles identiques contiennent ${y} d’eau.`,
    enonce2: (x, y) => `${Lettres(x)} de ces bouteilles contiennent ${y} d’eau.`,
    question: (x) => `Combien de litres d’eau contiennent ${x} de ces bouteilles ?`,
    phrase: (x) => `Les ${x} bouteilles contiennent ___ L d’eau.`,
    effet: (k, s) => `${k} fois ${s} d’eau`,
    unite: [25, 175],
    echelle: 100,
  },
];

/** Écrit une valeur de la situation (en centièmes ou en unités entières). */
const vS = (s: SituationProp, v: number) => valeur(r3(v / s.echelle), s.unit);
const nS = (s: SituationProp, v: number) => n(r3(v / s.echelle));
/** « 4 tours », « 1 crêpe ». */
const qte = (s: SituationProp, x: number) => `${x} ${x >= 2 ? s.pl : s.sg}`;

function propSituation(level: Level, rng: Rng, forme: number): Pb {
  for (let essai = 0; essai < 80; essai++) {
    const s = rng.pick(SITUATIONS);
    let u = rng.int(s.unite[0], s.unite[1]);
    if (s.unit === '€') u = prix(rng, s.unite[0], s.unite[1]);
    if (s.unit === 'm') u = Math.round(u / 10) * 10;
    if (s.unit === 'L') u = rng.pick([25, 50, 75, 150, 125]);
    /** Fiche des données en phrases (jamais de tableau de proportionnalité au cours moyen). */
    const recette = (connus: [number, number][], cherche: number) => ({
      recette: {
        grandeurs: [s.g1, s.g2],
        connus: connus.map(([x, y]) => [x, r3(y / s.echelle)]),
        cherche,
      },
    });
    const okVal = (v: number) => s.unit !== '€' || centimesSansZeroFinal(v);
    const ajoutFaux = (y: number, d: number) => r3(y / s.echelle + d);
    if (forme === 0 || forme === 1) {
      // Linéarité multiplicative : facile × 2, × 3, × 10 ; normal × 3, × 4, × 5 sans passer par l'unité
      const x = rng.int(forme === 0 ? 2 : 3, 6);
      const k = forme === 0 ? rng.pick([2, 3, 2, 10]) : rng.int(3, 5);
      const y = x * u;
      const r = y * k;
      if (!okVal(y) || !okVal(r)) continue;
      const z = x * k;
      return {
        sig: `prop-${forme === 0 ? 'fois' : 'lin'}-${s.g1}-${x}-${y}-${k}`,
        statement: s.enonce(x, vS(s, y)),
        question: s.question(z),
        answer: r3(r / s.echelle),
        unit: s.unit,
        structure: 'multiplicatif',
        bars: [
          { label: qte(s, x), segments: [{ value: r3(y / s.echelle) }] },
          { label: qte(s, z), segments: parts(k, r3(y / s.echelle), () => qte(s, x)) },
        ],
        total: null,
        answerSentence: s.phrase(z),
        reformulations: [
          `Il y a ${k} fois plus de ${s.pl} (${z} = ${k} × ${x}), donc ${s.effet(k, 'plus')}.`,
          `Il y a ${z - x} ${s.pl} de plus, donc on ajoute ${valeur(z - x, s.unit)} à ${vS(s, y)}.`,
          `On cherche ce qu’il faut pour ${qte(s, x)} seulement.`,
        ],
        operation: `${z} = ${k} × ${x}, donc ${nS(s, y)} × ${k} = ${nS(s, r)}`,
        calcul: `${nS(s, y)} × ${k}`,
        fauxCalculs: [`${nS(s, y)} + ${z - x}`, `${nS(s, y)} × ${z}`],
        fausses: [ajoutFaux(y, z - x), r3((y * z) / s.echelle), r3(y / s.echelle)],
        explication: `${cap(qte(s, z))}, c’est ${k} fois plus de ${s.pl} que ${qte(s, x)}, donc ${s.effet(k, 'plus')} : ${vS(s, y)} × ${k} = ${vS(s, r)}.`,
        difficulty: forme === 0 ? 0.3 : 0.55,
        meta: recette([[x, y]], z),
      };
    }
    if (forme === 2) {
      // Linéarité additive : pour a et pour b → pour a + b
      const a = rng.int(2, 6);
      const b = rng.int(2, 7);
      if (a === b) continue;
      const ya = a * u;
      const yb = b * u;
      const r = ya + yb;
      if (!okVal(ya) || !okVal(yb) || !okVal(r)) continue;
      return {
        sig: `prop-add-${s.g1}-${a}-${ya}-${b}-${yb}`,
        statement: `${s.enonce(a, vS(s, ya))} ${s.enonce2(b, vS(s, yb))}`,
        question: s.question(a + b),
        answer: r3(r / s.echelle),
        unit: s.unit,
        structure: 'parties-tout',
        bars: [
          {
            label: qte(s, a + b),
            segments: [
              { value: r3(ya / s.echelle), label: qte(s, a) },
              { value: r3(yb / s.echelle), label: qte(s, b) },
            ],
          },
        ],
        total: null,
        answerSentence: s.phrase(a + b),
        reformulations: [
          `${cap(qte(s, a + b))}, c’est ${qte(s, a)} et encore ${qte(s, b)} : on ajoute les deux quantités connues.`,
          `${cap(qte(s, a + b))}, c’est ${a} × ${b} : on multiplie les deux quantités.`,
          'On cherche la différence entre les deux quantités connues.',
        ],
        operation: `${a + b} = ${a} + ${b}, donc ${nS(s, ya)} + ${nS(s, yb)} = ${nS(s, r)}`,
        calcul: `${nS(s, ya)} + ${nS(s, yb)}`,
        fauxCalculs: [`${nS(s, yb)} − ${nS(s, ya)}`, `${nS(s, ya)} × ${a + b}`],
        fausses: [r3(Math.abs(yb - ya) / s.echelle), r3((ya * (a + b)) / s.echelle)],
        explication: `${cap(qte(s, a + b))}, c’est ${qte(s, a)} et encore ${qte(s, b)} : ${vS(s, ya)} + ${vS(s, yb)} = ${vS(s, r)}.`,
        difficulty: 0.6,
        meta: recette(
          [
            [a, ya],
            [b, yb],
          ],
          a + b,
        ),
      };
    }
    if (forme === 3) {
      // Passage par l'unité (2 étapes), verbalisé en linéarité
      const x = rng.int(3, 8);
      const z = rng.int(2, 9);
      if (z === x || z % x === 0 || x % z === 0) continue;
      const y = x * u;
      const r = z * u;
      if (!okVal(y) || !okVal(u) || !okVal(r)) continue;
      const d = Math.abs(z - x);
      return {
        sig: `prop-unite-${s.g1}-${x}-${y}-${z}`,
        statement: s.enonce(x, vS(s, y)),
        question: s.question(z),
        answer: r3(r / s.echelle),
        unit: s.unit,
        structure: 'deux-etapes',
        bars: [
          { label: qte(s, x), segments: parts(x, r3(u / s.echelle), () => qte(s, 1)) },
          { label: qte(s, z), segments: parts(z, null, () => qte(s, 1)) },
        ],
        total: r3(y / s.echelle),
        answerSentence: s.phrase(z),
        reformulations: [
          `On cherche d’abord ce qu’il faut pour ${qte(s, 1)}, puis on le prend ${z} fois.`,
          z > x
            ? `${z}, c’est ${x} + ${d} : on ajoute ${valeur(d, s.unit)} à ${vS(s, y)}.`
            : `${z}, c’est ${x} − ${d} : on enlève ${valeur(d, s.unit)} à ${vS(s, y)}.`,
          `On multiplie ${vS(s, y)} par ${z}.`,
        ],
        operation: `${nS(s, y)} ÷ ${x} = ${nS(s, u)} ; ${nS(s, u)} × ${z} = ${nS(s, r)}`,
        calcul: `(${nS(s, y)} ÷ ${x}) × ${z}`,
        fauxCalculs: [`${nS(s, y)} ${z > x ? '+' : '−'} ${d}`, `${nS(s, y)} × ${z}`],
        fausses: [z > x ? ajoutFaux(y, d) : ajoutFaux(y, -d), r3((y * z) / s.echelle), r3(u / s.echelle)],
        explication: `Pour ${qte(s, 1)}, c’est ${x} fois moins de ${s.pl}, donc ${s.effet(x, 'moins')} : ${vS(s, y)} ÷ ${x} = ${vS(s, u)} ; pour ${qte(s, z)}, c’est ${z} fois plus : ${vS(s, u)} × ${z} = ${vS(s, r)}.`,
        difficulty: 0.7,
        meta: recette([[x, y]], z),
      };
    }
    // Plus loin : combiner « k fois » et « la moitié » (z = k × x + x ÷ 2)
    const x = rng.pick([2, 4, 6]);
    const k = rng.int(2, 4);
    const y = x * u;
    if (y % 2 !== 0) continue;
    const z = k * x + x / 2;
    const r = y * k + y / 2;
    if (!okVal(y) || !okVal(y / 2) || !okVal(r)) continue;
    return {
      sig: `prop-moitie-${s.g1}-${x}-${y}-${k}`,
      statement: s.enonce(x, vS(s, y)),
      question: s.question(z),
      answer: r3(r / s.echelle),
      unit: s.unit,
      structure: 'deux-etapes',
      bars: [
        {
          label: qte(s, z),
          segments: [
            ...parts(k, r3(y / s.echelle), () => qte(s, x)),
            { value: r3(y / 2 / s.echelle), label: qte(s, x / 2) },
          ],
        },
      ],
      total: null,
      answerSentence: s.phrase(z),
      reformulations: [
        `${cap(qte(s, z))}, c’est ${k} fois ${qte(s, x)} et encore la moitié de ${qte(s, x)}.`,
        `${cap(qte(s, z))}, c’est ${x} + ${z - x} : on ajoute ${valeur(z - x, s.unit)} à ${vS(s, y)}.`,
        `On multiplie ${vS(s, y)} par ${z}.`,
      ],
      operation: `${nS(s, y)} × ${k} = ${nS(s, y * k)} ; ${nS(s, y)} ÷ 2 = ${nS(s, y / 2)} ; ${nS(s, y * k)} + ${nS(s, y / 2)} = ${nS(s, r)}`,
      calcul: `(${nS(s, y)} × ${k}) + (${nS(s, y)} ÷ 2)`,
      fauxCalculs: [`${nS(s, y)} + ${z - x}`, `${nS(s, y)} × ${z}`],
      fausses: [ajoutFaux(y, z - x), r3((y * z) / s.echelle), r3((y * k) / s.echelle)],
      explication: `${cap(qte(s, z))}, c’est ${k} fois ${qte(s, x)} (${s.effet(k, 'plus')} : ${vS(s, y * k)}) et la moitié de ${qte(s, x)} (${vS(s, y / 2)}) : ${vS(s, y * k)} + ${vS(s, y / 2)} = ${vS(s, r)}.`,
      difficulty: 0.85,
      meta: recette([[x, y]], z),
    };
  }
  return propSituation(level, rng, 0);
}

/** Plus loin (6e) : pourcentages simples et échelles, avec tableau autorisé. */
function propPlusLoin(rng: Rng, forme = rng.int(0, 1)): Pb {
  if (forme === 0) {
    // Pourcentage : raisonnement de linéarité (25 %, c'est 25 € pour 100 €, donc 1 € pour 4 €)
    const pc = rng.pick([10, 20, 25, 50]);
    const pas = 100 / pc;
    const base = rng.pick([20, 40, 60, 80, 120, 140, 160, 200, 240]);
    const red = base / pas;
    const art = rng.pick(['Un pull', 'Un jeu vidéo', 'Une paire de baskets', 'Un sac à dos']);
    return {
      sig: `prop-pc-${pc}-${base}`,
      statement: `${art} coute ${base} €. Pendant les soldes, son prix baisse de ${pc} %.`,
      question: 'De combien d’euros le prix baisse-t-il ?',
      answer: red,
      unit: '€',
      structure: 'multiplicatif',
      bars: [
        {
          label: `${base} €`,
          segments: [
            { value: red, label: `${pc} %` },
            { value: base - red, label: 'nouveau prix' },
          ],
        },
      ],
      total: base,
      answerSentence: 'Le prix baisse de ___ €.',
      reformulations: [
        `${pc} %, c’est ${pc} € de baisse pour 100 € : on cherche la baisse pour ${base} €.`,
        `On enlève ${pc} € au prix.`,
        'On cherche le nouveau prix.',
      ],
      operation: `${pc} € pour 100 €, donc 1 € pour ${pas} € ; ${base} € = ${red} × ${pas} €, donc ${red} € de baisse`,
      calcul: `${base} ÷ ${pas}`,
      fauxCalculs: [`${base} − ${pc}`, `${base} × ${pc}`],
      fausses: [base - pc, pc, base - red],
      explication: `${pc} %, c’est ${pc} € de baisse pour 100 €, donc 1 € pour ${pas} € ; ${base} €, c’est ${red} fois ${pas} €, donc la baisse est de ${red} €.`,
      difficulty: 0.8,
      meta: {
        tableau: {
          entetes: ['Prix (€)', 'Baisse (€)'],
          lignes: [
            [100, pc],
            [base, null],
          ],
        },
      },
    };
  }
  const cm = rng.int(2, 12) + rng.pick([0, 0.5]);
  const ech = rng.pick([10, 20, 50, 100]);
  const dist = r3(cm * ech);
  return {
    sig: `prop-echelle-${cm}-${ech}`,
    statement: `Sur le plan du parc, 1 cm représente ${ech} m en vrai. Sur le plan, l’allée principale mesure ${n(cm)} cm.`,
    question: 'Quelle est la longueur réelle de l’allée ?',
    answer: dist,
    unit: 'm',
    structure: 'multiplicatif',
    bars: [{ label: `${n(cm)} cm sur le plan`, segments: parts(Math.ceil(cm), ech, () => '1 cm') }],
    total: null,
    answerSentence: 'L’allée mesure ___ m en vrai.',
    reformulations: [
      `Chaque centimètre du plan représente ${ech} m : on prend ${n(cm)} fois ${ech} m.`,
      `On ajoute ${n(cm)} et ${ech}.`,
      'On cherche la longueur sur le plan.',
    ],
    operation: `${n(cm)} × ${ech} = ${n(dist)}`,
    calcul: `${n(cm)} × ${ech}`,
    fauxCalculs: [`${n(cm)} + ${ech}`, `${n(cm)} × ${ech * 10}`],
    fausses: [r3(cm + ech), r3(dist * 10), r3(dist / 10)],
    explication: `1 cm sur le plan, c’est ${ech} m en vrai ; ${n(cm)} cm, c’est ${n(cm)} fois plus : ${n(cm)} × ${ech} = ${n(dist)} m.`,
    difficulty: 0.75,
    meta: {
      tableau: {
        entetes: ['Longueur sur le plan (cm)', 'Longueur réelle (m)'],
        lignes: [
          [1, ech],
          [cm, null],
        ],
      },
    },
  };
}

const pbProportion = (level: Level, rng: Rng): Pb =>
  parNiv(level, {
    facile: () => propSituation('facile', rng, 0),
    normal: () => propSituation('normal', rng, rng.int(1, 3)),
    plus_loin: () => (rng.chance(0.55) ? propPlusLoin(rng) : propSituation('plus_loin', rng, 4)),
  })();

/** Situations de proportionnalité ou non (identification), des plus simples aux plus subtiles. */
const PROPORTIONNELLES = {
  simples: [
    'Le prix payé et le nombre de baguettes achetées (même prix pour chaque baguette)',
    'La masse de farine et le nombre de crêpes préparées avec la même recette',
    'Le nombre de roues et le nombre de vélos dans un garage à vélos',
  ],
  subtiles: [
    'La distance parcourue et le nombre de tours d’une même piste',
    'Le périmètre d’un carré et la longueur de son côté',
    'Le prix payé et la masse de pommes achetées au même prix le kilo',
  ],
};
const NON_PROPORTIONNELLES = {
  simples: [
    'La taille d’un enfant et son âge',
    'La masse d’un bébé et son âge',
    'La température dehors et l’heure de la journée',
  ],
  subtiles: [
    'Le nombre de buts marqués et la durée du match',
    'Le prix d’une course de taxi avec une prise en charge de 4 € et la distance parcourue',
    'L’aire d’un carré et la longueur de son côté',
  ],
};

const propIdentQcm: ItemGen = (level, rng, ctx) => {
  const listes = (l: { simples: string[]; subtiles: string[] }) =>
    parNiv(level, { facile: l.simples, normal: [...l.simples, ...l.subtiles], plus_loin: l.subtiles });
  const oui = rng.chance(0.6);
  const good = rng.pick(listes(oui ? PROPORTIONNELLES : NON_PROPORTIONNELLES));
  const question = oui
    ? 'Laquelle de ces situations est une situation de proportionnalité ?'
    : 'Laquelle de ces situations n’est pas une situation de proportionnalité ?';
  return mcq(ctx, rng, `ident-${oui}-${good}`, {
    question,
    spoken: `${question} Lis bien chaque proposition.`,
    good,
    wrong: listes(oui ? NON_PROPORTIONNELLES : PROPORTIONNELLES),
    explication: oui
      ? 'Il y a proportionnalité quand, si l’une des quantités devient 2 fois (ou 3 fois) plus grande, l’autre aussi.'
      : `« ${good} » : si l’une double, l’autre ne double pas forcément, ce n’est pas de la proportionnalité.`,
    difficulty: parNiv(level, { facile: 0.35, normal: 0.5, plus_loin: 0.7 }),
    max: level === 'facile' ? 3 : 4,
  });
};

const propIdentVraiFaux: ItemGen = (level, rng, ctx) => {
  const p = rng.pick(PRENOMS);
  if (level === 'facile' || (level === 'normal' && rng.chance(0.3))) {
    // Âge et taille : faux (tailles vraisemblables : 1,05 à 1,15 m à 5 ans, 1,30 à 1,35 m à 9 ans)
    const age = rng.int(5, 9);
    const cm = rng.int(105 + (age - 5) * 6, 112 + (age - 5) * 6);
    const k = rng.pick([2, 3]);
    const m = (c: number) => n(r3(c / 100));
    return make(ctx, 'true_false', `ident-age-${age}-${cm}-${k}`, {
      statement: `À ${age} ans, ${p.nom} mesure ${m(cm)} m. Donc à ${age * k} ans, ${p.il} mesurera ${m(cm * k)} m.`,
      spoken: `${dire(`À ${age} ans, ${p.nom} mesure ${m(cm)} m. Donc à ${age * k} ans, ${p.il} mesurera ${m(cm * k)} m.`)} Vrai ou faux ?`,
      answer: false,
      explication: `La taille n’est pas proportionnelle à l’âge : quand on a ${k} fois plus d’âge, on ne mesure pas ${k} fois plus !`,
      difficulty: 0.35,
    });
  }
  if (level === 'plus_loin' && rng.chance(0.5)) {
    // Taxi avec prise en charge : pas proportionnel
    const pec = rng.pick([3, 4, 5]);
    const parKm = rng.pick([2, 3]);
    const d = rng.int(3, 8);
    const k = 2;
    const cout = pec + parKm * d;
    const juste = rng.chance(0.4);
    const vrai = pec + parKm * d * k;
    const montre = juste ? vrai : cout * k;
    return make(ctx, 'true_false', `ident-taxi-${pec}-${parKm}-${d}-${montre}`, {
      statement: `Un taxi fait payer ${pec} € au départ, puis ${parKm} € par kilomètre. Une course de ${d} km coute ${cout} €. Donc une course de ${d * k} km coute ${montre} €.`,
      spoken: `${ditPrix(`Un taxi fait payer ${pec} € au départ, puis ${parKm} € par kilomètre. Une course de ${d} kilomètres coute ${cout} €. Donc une course de ${d * k} kilomètres coute ${montre} €.`)} Vrai ou faux ?`,
      answer: juste,
      explication: `Ce n’est pas proportionnel à cause des ${pec} € du départ : ${pec} + ${parKm} × ${d * k} = ${vrai} €, et non ${cout} × 2.`,
      difficulty: 0.8,
    });
  }
  // Situation proportionnelle (pommes) avec un résultat juste ou faux
  for (let essai = 0; essai < 50; essai++) {
    const c = prix(rng, 115, 395);
    const x = rng.int(2, 5);
    const k = parNiv(level, { facile: 2, normal: rng.int(2, 4), plus_loin: rng.int(3, 6) });
    const y = c * x;
    const juste = rng.chance(0.5);
    // Erreur fréquente : ajouter au lieu de multiplier (on ajoute la différence de masse en euros)
    const montre = juste ? y * k : y + (k - 1) * x * 100;
    if (montre === y * k && !juste) continue;
    return make(ctx, 'true_false', `ident-kg-${c}-${x}-${k}-${montre}`, {
      statement: `Pour ${x} kg de pommes, on paie ${euros(y)}. Donc pour ${x * k} kg de ces pommes, on paie ${euros(montre)}.`,
      spoken: `Pour ${x} kilogrammes de pommes, on paie ${ditPrix(euros(y))}. Donc pour ${x * k} kilogrammes de ces pommes, on paie ${ditPrix(euros(montre))}. Vrai ou faux ?`,
      answer: montre === y * k,
      explication: `${x * k} kg, c’est ${k} fois ${x} kg : on paie ${k} fois plus, ${euros(y)} × ${k} = ${euros(y * k)}.`,
      difficulty: parNiv(level, { facile: 0.35, normal: 0.45, plus_loin: 0.6 }),
    });
  }
  return propIdentQcm(level, rng, ctx) as unknown as ItemOf<'true_false'>;
};

/* ------------------------------------------------------------------ */
/* CM2.MA.PB.DENOMBRER — dénombrement, optimisation, algorithmes       */
/* ------------------------------------------------------------------ */

/** Facile : listes (deux choix). */
function denFacile(rng: Rng, forme = rng.int(0, 2)): Pb {
  const p = rng.pick(PRENOMS);
  if (forme === 0) {
    const a = rng.int(2, 3);
    const b = rng.int(2, 4);
    const t = a * b;
    return {
      sig: `tenues-${a}-${b}`,
      statement: `${p.nom} a ${a} pantalons et ${b} tee-shirts, tous différents.`,
      question: `Combien de tenues différentes (un pantalon et un tee-shirt) ${p.nom} peut-${p.il} composer ?`,
      answer: t,
      structure: 'multiplicatif',
      bars: [{ label: `${a} pantalons`, segments: parts(a, b, () => `${b} tee-shirts`) }],
      total: null,
      answerSentence: `${p.nom} peut composer ___ tenues différentes.`,
      reformulations: [
        `Avec chaque pantalon, on peut mettre chacun des ${b} tee-shirts.`,
        `On compte seulement les vêtements : ${a} + ${b}.`,
        'Chaque tee-shirt va avec un seul pantalon.',
      ],
      operation: `${a} × ${b} = ${t}`,
      calcul: `${a} × ${b}`,
      fauxCalculs: [`${a} + ${b}`, `${a} + ${b} + 1`],
      fausses: [a + b, t + 1, Math.max(a, b)],
      explication: `Pour chacun des ${a} pantalons, il y a ${b} tee-shirts possibles : ${a} × ${b} = ${t} tenues (on peut faire la liste pour vérifier).`,
      difficulty: 0.3,
      meta: { donnees: { produit: [a, b] } },
    };
  }
  if (forme === 1) {
    // Nombres de 2 chiffres différents avec 3 étiquettes
    const ch = rng
      .shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
      .slice(0, 3)
      .sort((x, y) => x - y);
    return {
      sig: `nombres2-${ch.join('')}`,
      statement: `Avec les trois étiquettes ${ch.join(', ')}, on écrit des nombres de deux chiffres différents (on n’utilise pas deux fois la même étiquette).`,
      question: 'Combien de nombres différents peut-on écrire ?',
      answer: 6,
      structure: 'multiplicatif',
      bars: [{ label: 'chiffre des dizaines', segments: parts(3, 2, (i) => `${ch[i]}…`) }],
      total: null,
      answerSentence: 'On peut écrire ___ nombres différents.',
      reformulations: [
        'Pour chaque chiffre des dizaines, il reste 2 chiffres possibles pour les unités.',
        'Il y a 3 étiquettes, donc 3 nombres.',
        'On peut utiliser deux fois la même étiquette.',
      ],
      operation: `3 × 2 = 6 (${ch[0]}${ch[1]}, ${ch[0]}${ch[2]}, ${ch[1]}${ch[0]}, ${ch[1]}${ch[2]}, ${ch[2]}${ch[0]}, ${ch[2]}${ch[1]})`,
      calcul: '3 × 2',
      fauxCalculs: ['3 × 3', '3 + 2'],
      fausses: [3, 9, 5],
      explication: `On fait la liste dans l’ordre : ${ch[0]}${ch[1]}, ${ch[0]}${ch[2]}, ${ch[1]}${ch[0]}, ${ch[1]}${ch[2]}, ${ch[2]}${ch[0]}, ${ch[2]}${ch[1]} : il y a 6 nombres.`,
      difficulty: 0.45,
      meta: { donnees: { etiquettes: 3, chiffres: 2 } },
    };
  }
  // Sandwichs : un pain parmi a, une garniture parmi b
  const a = rng.int(2, 3);
  const b = rng.int(2, 3);
  const t = a * b;
  return {
    sig: `sandwichs-${a}-${b}`,
    statement: `À la boulangerie, on choisit un pain parmi ${a} sortes et une garniture parmi ${b} sortes pour faire son sandwich.`,
    question: 'Combien de sandwichs différents peut-on faire ?',
    answer: t,
    structure: 'multiplicatif',
    bars: [{ label: `${a} pains`, segments: parts(a, b, () => `${b} garnitures`) }],
    total: null,
    answerSentence: 'On peut faire ___ sandwichs différents.',
    reformulations: [
      `Avec chaque sorte de pain, on peut mettre chacune des ${b} garnitures.`,
      `On ajoute les sortes de pain et de garniture : ${a} + ${b}.`,
      'Chaque garniture va avec un seul pain.',
    ],
    operation: `${a} × ${b} = ${t}`,
    calcul: `${a} × ${b}`,
    fauxCalculs: [`${a} + ${b}`, `${a} + ${b} + 1`],
    fausses: [a + b, t + 1, t - 1],
    explication: `On fait la liste : pour chacun des ${a} pains, ${b} garnitures, donc ${a} × ${b} = ${t} sandwichs.`,
    difficulty: 0.3,
    meta: { donnees: { produit: [a, b] } },
  };
}

/** Rendre une somme avec le moins de billets et de pièces possible (algorithme glouton). */
const VALEURS = [50, 20, 10, 5, 2, 1];
function decomposition(somme: number): number[] {
  const out: number[] = [];
  let r = somme;
  for (const v of VALEURS)
    while (r >= v) {
      out.push(v);
      r -= v;
    }
  return out;
}

/** Normal : arbres, tableaux, optimisation, préparation aux algorithmes. */
function denNormal(rng: Rng, forme = rng.int(0, 5)): Pb {
  const p = rng.pick(PRENOMS);
  if (forme === 0) {
    // Arbre : menu à 3 choix
    const e = rng.int(2, 3);
    const pl = rng.int(2, 4);
    const d = rng.int(2, 3);
    const t = e * pl * d;
    return {
      sig: `menu-${e}-${pl}-${d}`,
      statement: `À la cantine, on choisit une entrée parmi ${e}, un plat parmi ${pl} et un dessert parmi ${d}.`,
      question: 'Combien de menus différents peut-on composer ?',
      answer: t,
      structure: 'multiplicatif',
      bars: [
        { label: `${e} entrées`, segments: parts(e, pl, () => `${pl} plats`) },
        { label: `${e * pl} débuts de menu`, segments: parts(e * pl, d, () => `${d} desserts`) },
      ],
      total: null,
      answerSentence: 'On peut composer ___ menus différents.',
      reformulations: [
        'Pour chaque entrée, on choisit un plat, puis pour chacun un dessert : on fait un arbre.',
        'On ajoute le nombre d’entrées, de plats et de desserts.',
        'On choisit seulement un plat.',
      ],
      operation: `${e} × ${pl} = ${e * pl} ; ${e * pl} × ${d} = ${t}`,
      calcul: `${e} × ${pl} × ${d}`,
      fauxCalculs: [`${e} + ${pl} + ${d}`, `(${e} × ${pl}) + ${d}`],
      fausses: [e + pl + d, e * pl + d, e * pl],
      explication: `Avec un arbre : ${e} entrées, chacune avec ${pl} plats (${e * pl} branches), chacune avec ${d} desserts : ${e} × ${pl} × ${d} = ${t}.`,
      difficulty: 0.6,
      meta: { donnees: { produit: [e, pl, d] } },
    };
  }
  if (forme === 1) {
    // Tableau à double entrée : glaces
    const parf = rng.int(5, 9);
    const cont = rng.int(2, 3);
    const t = parf * cont;
    return {
      sig: `glaces-${parf}-${cont}`,
      statement: `Un glacier propose ${parf} parfums. On peut prendre sa boule de glace ${cont === 2 ? 'en cornet ou en pot' : 'en cornet, en pot ou sur une gaufre'}.`,
      question: 'Combien de choix différents (un parfum et une façon de la servir) y a-t-il ?',
      answer: t,
      structure: 'multiplicatif',
      bars: [{ label: `${cont} façons`, segments: parts(cont, parf, () => `${parf} parfums`) }],
      total: null,
      answerSentence: 'Il y a ___ choix différents.',
      reformulations: [
        `Si on fait un tableau, il a ${parf} lignes (une par parfum) et ${cont} colonnes : on compte les cases.`,
        `On ajoute ${parf} et ${cont}.`,
        'On ne compte que les parfums.',
      ],
      operation: `${parf} × ${cont} = ${t}`,
      calcul: `${parf} × ${cont}`,
      fauxCalculs: [`${parf} + ${cont}`, `${parf} × ${cont + 1}`],
      fausses: [parf + cont, parf, t + parf],
      explication: `Si on fait un tableau, il a ${parf} lignes (une par parfum) et ${cont} colonnes : ${parf} × ${cont} = ${t} cases, donc ${t} choix.`,
      difficulty: 0.45,
      meta: { donnees: { produit: [parf, cont] } },
    };
  }
  if (forme === 2) {
    // Optimisation : meilleur prix (lots)
    for (let essai = 0; essai < 50; essai++) {
      const lot = rng.pick([3, 4, 6]);
      const pu = prix(rng, 105, 185);
      const pLot = prix(rng, Math.round(pu * lot * 0.7), pu * lot - 15);
      const veut = lot * rng.int(1, 3) + rng.int(1, lot - 1);
      const nbLots = Math.floor(veut / lot);
      const reste = veut % lot;
      const optA = nbLots * pLot + reste * pu;
      const optB = (nbLots + 1) * pLot;
      const best = Math.min(optA, optB);
      if (optA === optB || !centimesSansZeroFinal(best)) continue;
      const naif = veut * pu;
      return {
        sig: `lots-${lot}-${pu}-${pLot}-${veut}`,
        statement: `Au supermarché, un yaourt coute ${euros(pu)} et un lot de ${lot} yaourts coute ${euros(pLot)}. ${p.nom} veut au moins ${veut} yaourts et dépenser le moins possible.`,
        question: `Combien ${p.nom} va-t-${p.il} payer au minimum ?`,
        answer: eu(best),
        unit: '€',
        structure: 'deux-etapes',
        bars: [
          {
            label:
              optA < optB
                ? `${accord(nbLots, 'lot')} + ${accord(reste, 'yaourt')}`
                : `${accord(nbLots + 1, 'lot')}`,
            segments:
              optA < optB
                ? [...parts(nbLots, eu(pLot), () => 'lot'), ...parts(reste, eu(pu), () => 'yaourt')]
                : parts(nbLots + 1, eu(pLot), () => 'lot'),
          },
        ],
        total: null,
        answerSentence: `${p.nom} va payer au minimum ___ €.`,
        reformulations: [
          'On compare plusieurs façons d’acheter (lots et yaourts seuls) et on garde la moins chère.',
          'On achète tous les yaourts un par un.',
          'On cherche combien de yaourts il y a dans un lot.',
        ],
        operation: `${accord(nbLots, 'lot')} + ${accord(reste, 'yaourt')} : ${euros(optA)} ; ${accord(nbLots + 1, 'lot')} : ${euros(optB)} ; le moins cher : ${euros(best)}`,
        fausses: [eu(naif), eu(Math.max(optA, optB))],
        explication: `On compare : ${accord(nbLots, 'lot')} et ${accord(reste, 'yaourt')} à l’unité coutent ${euros(optA)}, ${accord(nbLots + 1, 'lot')} coutent ${euros(optB)} ; le moins cher est ${euros(best)}.`,
        difficulty: 0.75,
      };
    }
    return denNormal(rng, 0);
  }
  if (forme === 3) {
    // Préparation aux algorithmes : payer avec le moins de billets et de pièces
    const somme = rng.pick([rng.int(13, 49), rng.int(51, 99)]);
    const dec = decomposition(somme);
    return {
      sig: `monnaie-${somme}`,
      statement: `${p.nom} doit payer exactement ${somme} € avec des billets de 50 €, 20 €, 10 €, 5 € et des pièces de 2 € et 1 €. ${cap(p.il)} veut utiliser le moins de billets et de pièces possible : ${p.il} prend toujours d’abord la plus grande valeur possible.`,
      question: `Combien de billets et de pièces va-t-${p.il} utiliser en tout ?`,
      answer: dec.length,
      structure: 'deux-etapes',
      bars: [{ label: `${somme} €`, segments: dec.map((v) => ({ value: v, label: `${v} €` })) }],
      total: null,
      answerSentence: `${cap(p.il)} va utiliser ___ billets et pièces en tout.`,
      reformulations: [
        'À chaque étape, on prend le plus grand billet ou la plus grande pièce qui ne dépasse pas ce qui reste à payer.',
        'On paie tout avec des pièces de 1 €.',
        'On prend un seul billet, le plus proche de la somme.',
      ],
      operation: `${somme} = ${dec.join(' + ')} : ${dec.length} billets et pièces`,
      fausses: [somme, dec.length + 1, dec.length - 1],
      explication: `On prend toujours la plus grande valeur possible : ${somme} = ${dec.join(' + ')}, soit ${dec.length} billets et pièces.`,
      difficulty: 0.6,
    };
  }
  if (forme === 4) {
    // Optimisation : nombre minimum de boites (division avec reste, on prend l'entier supérieur)
    const taille = rng.pick([6, 8, 10, 12]);
    let t = rng.int(taille * 3 + 1, taille * 9 - 1);
    if (t % taille === 0) t += 1;
    const q = Math.floor(t / taille);
    return {
      sig: `boites-${t}-${taille}`,
      statement: `${p.nom} range ${t} petites voitures dans des boites. Chaque boite peut contenir ${taille} voitures.`,
      question: 'Combien de boites lui faut-il au minimum pour ranger toutes ses voitures ?',
      answer: q + 1,
      structure: 'partage',
      bars: [
        {
          label: 'voitures',
          segments: [...parts(q, taille), { value: t % taille, label: 'dernière boite' }],
        },
      ],
      total: t,
      answerSentence: 'Il lui faut au minimum ___ boites.',
      reformulations: [
        `On range ${t} voitures par ${taille} ; la boite pas pleine compte aussi.`,
        'On cherche combien de voitures il y a dans chaque boite.',
        'On cherche combien de voitures il reste à la fin.',
      ],
      operation: `${q} × ${taille} = ${q * taille} ; il reste ${accord(t % taille, 'voiture')}, donc ${q} + 1 = ${q + 1}`,
      fausses: [q, q + 2, t % taille],
      explication: `${q} boites pleines rangent ${q * taille} voitures ; il en reste ${t % taille} : il faut une boite de plus, donc ${q + 1} boites.`,
      difficulty: 0.55,
      meta: { donnees: { objets: t, taille } },
    };
  }
  // Nombres de 2 chiffres différents avec 4 étiquettes
  const ch = rng
    .shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    .slice(0, 4)
    .sort((x, y) => x - y);
  return {
    sig: `nombres2x4-${ch.join('')}`,
    statement: `Avec les quatre étiquettes ${ch.join(', ')}, on écrit des nombres de deux chiffres différents (on n’utilise pas deux fois la même étiquette).`,
    question: 'Combien de nombres différents peut-on écrire ?',
    answer: 12,
    structure: 'multiplicatif',
    bars: [{ label: 'chiffre des dizaines', segments: parts(4, 3, (i) => `${ch[i]}…`) }],
    total: null,
    answerSentence: 'On peut écrire ___ nombres différents.',
    reformulations: [
      'Pour chacun des 4 chiffres des dizaines, il reste 3 chiffres possibles pour les unités : on fait un arbre.',
      'Il y a 4 étiquettes, donc 4 nombres.',
      'On peut utiliser deux fois la même étiquette.',
    ],
    operation: '4 × 3 = 12',
    calcul: '4 × 3',
    fauxCalculs: ['4 × 4', '4 + 3'],
    fausses: [4, 16, 7],
    explication: `Avec un arbre : 4 choix pour les dizaines (${ch.join(', ')}), puis 3 pour les unités : 4 × 3 = 12 nombres.`,
    difficulty: 0.55,
    meta: { donnees: { etiquettes: 4, chiffres: 2 } },
  };
}

/** Plus loin : combinatoire (trois étapes, poignées de main, championnat, cadenas). */
function denPlusLoin(rng: Rng, forme = rng.int(0, 3)): Pb {
  if (forme === 0) {
    // Poignées de main
    const k = rng.int(4, 10);
    const t = (k * (k - 1)) / 2;
    const termes = Array.from({ length: k - 1 }, (_, i) => k - 1 - i);
    return {
      sig: `poignees-${k}`,
      statement: `${Lettres(k)} amis se retrouvent. Chacun serre une fois la main de chacun des autres.`,
      question: 'Combien de poignées de main sont échangées en tout ?',
      answer: t,
      structure: 'parties-tout',
      bars: [
        { label: 'poignées de main', segments: termes.map((v, i) => ({ value: v, label: `ami ${i + 1}` })) },
      ],
      total: null,
      answerSentence: 'Il y a ___ poignées de main échangées en tout.',
      reformulations: [
        `Le 1er serre ${k - 1} mains, le 2e en serre ${k - 2} nouvelles, et ainsi de suite.`,
        `Chacun serre ${k - 1} mains, donc ${k} × ${k - 1} poignées.`,
        'Il y a autant de poignées de main que d’amis.',
      ],
      operation: `${termes.join(' + ')} = ${t}`,
      calcul: termes.join(' + '),
      fauxCalculs: [`${k} × ${k - 1}`, `${k} × ${k}`],
      fausses: [k * (k - 1), k, k * k],
      explication: `On ne compte pas deux fois la même poignée : ${termes.join(' + ')} = ${t}.`,
      difficulty: 0.85,
      meta: { donnees: { amis: k } },
    };
  }
  if (forme === 1) {
    // Nombres de 3 chiffres différents
    const nb = rng.pick([4, 5]);
    const ch = rng
      .shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
      .slice(0, nb)
      .sort((x, y) => x - y);
    const t = nb * (nb - 1) * (nb - 2);
    return {
      sig: `nombres3-${ch.join('')}`,
      statement: `Avec les ${nombreEnLettres(nb)} étiquettes ${ch.join(', ')}, on écrit des nombres de trois chiffres tous différents.`,
      question: 'Combien de nombres différents peut-on écrire ?',
      answer: t,
      structure: 'multiplicatif',
      bars: [
        { label: 'chiffre des centaines', segments: parts(nb, (nb - 1) * (nb - 2), (i) => `${ch[i]}……`) },
      ],
      total: null,
      answerSentence: 'On peut écrire ___ nombres différents.',
      reformulations: [
        `${nb} choix pour les centaines, puis ${nb - 1} pour les dizaines, puis ${nb - 2} pour les unités.`,
        `Il y a ${nb} étiquettes, donc ${nb} nombres.`,
        `${nb} choix pour chaque chiffre, même déjà utilisé.`,
      ],
      operation: `${nb} × ${nb - 1} × ${nb - 2} = ${t}`,
      calcul: `${nb} × ${nb - 1} × ${nb - 2}`,
      fauxCalculs: [`${nb} × ${nb} × ${nb}`, `${nb} + ${nb - 1} + ${nb - 2}`],
      fausses: [nb ** 3, nb, 3 * nb],
      explication: `Avec un arbre : ${nb} choix pour les centaines, ${nb - 1} pour les dizaines, ${nb - 2} pour les unités : ${nb} × ${nb - 1} × ${nb - 2} = ${t}.`,
      difficulty: 0.85,
      meta: { donnees: { etiquettes: nb, chiffres: 3 } },
    };
  }
  if (forme === 2) {
    // Championnat : chaque équipe reçoit chacune des autres
    const k = rng.int(4, 8);
    const t = k * (k - 1);
    return {
      sig: `tournoi-${k}`,
      statement: `Dans un championnat de ${k} équipes, chaque équipe reçoit une fois chacune des autres équipes sur son terrain.`,
      question: 'Combien de matchs sont joués en tout ?',
      answer: t,
      structure: 'multiplicatif',
      bars: [{ label: `${k} équipes`, segments: parts(k, k - 1, () => `${k - 1} matchs à domicile`) }],
      total: null,
      answerSentence: 'On joue ___ matchs en tout.',
      reformulations: [
        `Chaque équipe joue ${k - 1} matchs à domicile, et il y a ${k} équipes.`,
        'Chaque équipe joue un seul match.',
        `On compte ${k - 1} matchs en tout.`,
      ],
      operation: `${k} × ${k - 1} = ${t}`,
      calcul: `${k} × ${k - 1}`,
      fauxCalculs: [`${k} + ${k - 1}`, `${k} × ${k}`],
      fausses: [(k * (k - 1)) / 2, k * k, k - 1],
      explication: `Chacune des ${k} équipes reçoit les ${k - 1} autres : ${k} × ${k - 1} = ${t} matchs.`,
      difficulty: 0.8,
      meta: { donnees: { equipes: k } },
    };
  }
  // Cadenas : 3 roues, chiffres répétables
  const k = rng.int(3, 6);
  const t = k ** 3;
  return {
    sig: `cadenas-${k}`,
    statement: `Un cadenas a 3 roues. Sur chaque roue, on peut choisir un chiffre de 1 à ${k}, et un même chiffre peut revenir plusieurs fois.`,
    question: 'Combien de codes différents peut-on former ?',
    answer: t,
    structure: 'multiplicatif',
    bars: [{ label: 'roue 1', segments: parts(k, k * k, () => `${k * k} codes`) }],
    total: null,
    answerSentence: 'On peut former ___ codes différents.',
    reformulations: [
      `${k} choix pour la 1re roue, ${k} pour la 2e et ${k} pour la 3e : on fait un arbre.`,
      `${k} choix pour chaque roue, donc ${k} + ${k} + ${k} codes.`,
      'Il y a autant de codes que de roues.',
    ],
    operation: `${k} × ${k} × ${k} = ${t}`,
    calcul: `${k} × ${k} × ${k}`,
    fauxCalculs: [`${k} + ${k} + ${k}`, `${k} × ${k - 1} × ${k - 2}`],
    fausses: [3 * k, k * (k - 1) * (k - 2), k * k],
    explication: `Avec un arbre : ${k} choix pour chaque roue, donc ${k} × ${k} × ${k} = ${t} codes.`,
    difficulty: 0.8,
    meta: { donnees: { roues: 3, chiffres: k } },
  };
}

const pbDenombrer = (level: Level, rng: Rng): Pb =>
  parNiv(level, {
    facile: () => denFacile(rng),
    normal: () => denNormal(rng),
    plus_loin: () => denPlusLoin(rng),
  })();

/* ------------------------------------------------------------------ */

/** Valeur d'un calcul écrit à la française (« 20 − (3 × 4,5) »), priorités usuelles ; NaN si illisible. */
function valeurCalcul(expr: string): number {
  const s = expr.replace(/[\s  ]/g, '').replace(/−/g, '-');
  let i = 0;
  const facteur = (): number => {
    if (s[i] === '(') {
      i++;
      const v = somme();
      i++;
      return v;
    }
    const m = s.slice(i).match(/^\d+(?:,\d+)?/);
    if (!m) return NaN;
    i += m[0].length;
    return Number(m[0].replace(',', '.'));
  };
  const produit = (): number => {
    let v = facteur();
    while (s[i] === '×' || s[i] === '÷') {
      const op = s[i++];
      const w = facteur();
      v = op === '×' ? v * w : v / w;
    }
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++];
      const w = produit();
      v = op === '+' ? v + w : v - w;
    }
    return v;
  };
  const v = somme();
  return i === s.length ? r3(v) : NaN;
}

/** Retire les calculs « faux » qui donnent par hasard la bonne réponse (et les fausses réponses justes). */
const propre =
  (gen: (level: Level, rng: Rng) => Pb) =>
  (level: Level, rng: Rng): Pb => {
    const p = gen(level, rng);
    return {
      ...p,
      fauxCalculs: (p.fauxCalculs ?? []).filter((f) => {
        const v = valeurCalcul(f);
        return Number.isFinite(v) && Math.abs(v - p.answer) > 1e-9;
      }),
      fausses: garder(p.answer, p.fausses),
    };
  };

/** Les générateurs de problèmes de chaque leçon (exportés pour les tests). */
export const GENERATEURS_PB: Record<string, (level: Level, rng: Rng) => Pb> = {
  'CM2.MA.PB.ADDITIFS': propre(pbAdditif),
  'CM2.MA.PB.MULTIPLICATIFS': propre(pbMultiplicatif),
  'CM2.MA.PB.MIXTES': propre(pbMixte),
  'CM2.MA.PB.PROPORTION': propre(pbProportion),
  'CM2.MA.PB.DENOMBRER': propre(pbDenombrer),
};

export const PROBLEMES: Record<string, LessonContent> = {
  'CM2.MA.PB.ADDITIFS': quatreTypes(GENERATEURS_PB['CM2.MA.PB.ADDITIFS']!),
  'CM2.MA.PB.MULTIPLICATIFS': quatreTypes(GENERATEURS_PB['CM2.MA.PB.MULTIPLICATIFS']!),
  'CM2.MA.PB.MIXTES': quatreTypes(GENERATEURS_PB['CM2.MA.PB.MIXTES']!),
  'CM2.MA.PB.PROPORTION': quatreTypes(GENERATEURS_PB['CM2.MA.PB.PROPORTION']!, {
    mcq: propIdentQcm,
    true_false: propIdentVraiFaux,
  }),
  'CM2.MA.PB.DENOMBRER': quatreTypes(GENERATEURS_PB['CM2.MA.PB.DENOMBRER']!),
};
