/**
 * CE1 — Résolution de problèmes (BO n°41 du 31/10/2024) : modèle en 4 phases (Comprendre → Modéliser →
 * Calculer → Répondre, + Régulation), schémas en barre, ≥ 10 problèmes par semaine.
 * Structures : parties-tout, transformation, comparaison, deux étapes, multiplicatif, partage (avec reste),
 * mixtes. Données dans le champ numérique du CE1 (entiers ≤ 1 000 ; monnaie en euros et centimes).
 *
 * Convention des schémas (`bars`) :
 * - parties-tout / transformation : une barre, segments = parties, `total` = accolade (null = inconnue) ;
 * - comparaison : barre 0 = la plus longue, barre 1 = la plus courte + segment « écart » ;
 * - multiplicatif / partage : une barre découpée en parts égales (« … » quand les parts sont trop nombreuses).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { clamp01, de, euros, make, numeric, parNiv } from './util';

type Bar = ItemOf<'bar_model'>['bars'][number];
type Structure = ItemOf<'bar_model'>['structure'];

interface Pb {
  sig: string;
  statement: string;
  question: string;
  answer: number;
  unit?: string;
  structure: Structure;
  bars: Bar[];
  total?: number | null;
  answerSentence: string;
  reformulations: [string, string, string];
  operation: string;
  explication: string;
  difficulty: number;
}

type Perso = { nom: string; il: 'il' | 'elle' };
const PERSOS: Perso[] = [
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
  { nom: 'Enzo', il: 'il' },
  { nom: 'Maya', il: 'elle' },
];
/** Objets à collectionner : [nom, féminin ?]. */
const OBJETS_G: [string, boolean][] = [
  ['billes', true],
  ['images', true],
  ['timbres', false],
  ['cartes', true],
  ['perles', true],
  ['autocollants', false],
  ['coquillages', false],
  ['photos', true],
];
const OBJETS = OBJETS_G.map((o) => o[0]);
const FEM = new Set(OBJETS_G.filter((o) => o[1]).map((o) => o[0]));
/** Accorde un participe avec l'objet : « gagnées » / « gagnés ». */
const acc = (obj: string, mot: string) => `${mot}${FEM.has(obj) ? 'es' : 's'}`;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const deux = (rng: Rng): [Perso, Perso] => {
  const [a, b] = rng.shuffle(PERSOS);
  return [a!, b!];
};

const maxPb = (level: Level) => parNiv(level, { facile: 100, normal: 1000, plus_loin: 1000 });

/* ------------------------------------------------------------------ */
/* Conversions Pb → items                                              */
/* ------------------------------------------------------------------ */

function versBarModel(ctx: GenContext, rng: Rng, p: Pb): ItemOf<'bar_model'> {
  const [bonne, ...fausses] = p.reformulations;
  return make(ctx, 'bar_model', p.sig, {
    statement: p.statement,
    spoken: prixDits(`${p.statement} ${p.question}`),
    structure: p.structure,
    bars: p.bars,
    total: p.total,
    question: p.question,
    answer: p.answer,
    unit: p.unit,
    answerSentence: p.answerSentence,
    // la 1re reformulation est la bonne (le jeu les mélange)
    reformulations: [bonne, ...rng.shuffle(fausses)],
    operation: p.operation,
    explication: p.explication,
    difficulty: clamp01(p.difficulty),
    meta: p.unit === '€' ? { monnaie: true } : undefined,
  });
}

function versNumeric(ctx: GenContext, p: Pb): ItemOf<'numeric_answer'> {
  return numeric(ctx, p.sig, {
    prompt: `${p.statement} ${p.question}`,
    spoken: prixDits(`${p.statement} ${p.question}`),
    answer: p.answer,
    unit: p.unit,
    explication: p.explication,
    difficulty: p.difficulty,
  });
}

/** À l'oral, « 24,65 € » se lit « 24 euros 65 ». */
const prixDits = (t: string) =>
  t
    .replace(/(\d+),(\d{2}) €/g, (_, e: string, c: string) =>
      `${e} euro${e === '1' || e === '0' ? '' : 's'} ${c === '00' ? '' : c}`.trim(),
    )
    .replace(/(\d+) €/g, (_, e: string) => `${e} euro${e === '1' ? '' : 's'}`);

const deuxTypes = (gen: (level: Level, rng: Rng) => Pb): LessonContent => ({
  gens: {
    bar_model: (level, rng, ctx) => versBarModel(ctx, rng, gen(level, rng)),
    numeric_answer: (level, rng, ctx) => versNumeric(ctx, gen(level, rng)),
  },
});

/* ------------------------------------------------------------------ */
/* CE1.MA.PB.ADD_PT — parties-tout et transformations (1 étape)        */
/* ------------------------------------------------------------------ */

function pbAdditif(level: Level, rng: Rng, forme = rng.int(0, 6)): Pb {
  const max = maxPb(level);
  const [p] = deux(rng);
  const obj = rng.pick(OBJETS);
  const tout = rng.int(Math.max(20, Math.floor(max / 4)), max);
  const a = rng.int(Math.max(5, Math.floor(tout / 6)), tout - 5);
  const b = tout - a;
  const d = (x: number) => clamp01(x + (level === 'normal' ? 0.15 : 0));
  switch (forme) {
    case 0:
      return {
        sig: `pt-tout-${a}-${b}-${obj}`,
        statement: `${p.nom} a ${a} ${obj} dans sa boite rouge et ${b} ${obj} dans sa boite verte.`,
        question: `Combien ${de(obj)} ${p.nom} a-t-${p.il} en tout ?`,
        answer: tout,
        structure: 'parties-tout',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: 'boite rouge' },
              { value: b, label: 'boite verte' },
            ],
          },
        ],
        total: null,
        answerSentence: `${p.nom} a ___ ${obj} en tout.`,
        reformulations: [
          `On connait les ${obj} de chaque boite et on cherche le nombre total ${de(obj)}.`,
          `On connait le nombre total ${de(obj)} et on cherche ${FEM.has(obj) ? 'celles' : 'ceux'} de la boite verte.`,
          `On cherche combien ${de(obj)} la boite rouge a de plus que la verte.`,
        ],
        operation: `${a} + ${b} = ${tout}`,
        explication: `On cherche le tout : on ajoute les deux parties, ${a} + ${b} = ${tout}.`,
        difficulty: d(0.2),
      };
    case 1:
      // BO : « Dans mes deux coffres, j'ai 227 billes. J'en ai 113 dans mon coffre vert… »
      return {
        sig: `pt-partie-${tout}-${a}-${obj}`,
        statement: `Dans ses deux coffres, ${p.nom} a ${tout} ${obj}. ${cap(p.il)} en a ${a} dans son coffre vert.`,
        question: `Combien ${de(obj)} y a-t-il dans son coffre rouge ?`,
        answer: b,
        structure: 'parties-tout',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: 'coffre vert' },
              { value: null, label: 'coffre rouge' },
            ],
          },
        ],
        total: tout,
        answerSentence: `Il y a ___ ${obj} dans le coffre rouge.`,
        reformulations: [
          `Il y a ${tout} ${obj} en tout ; on cherche ceux du coffre rouge.`,
          `Il y a ${tout} ${obj} dans le coffre rouge ; on cherche le total.`,
          `On cherche combien ${de(obj)} il y a dans les deux coffres ensemble.`,
        ],
        operation: `${tout} − ${a} = ${b}`,
        explication: `On connait le tout et une partie : on enlève la partie connue, ${tout} − ${a} = ${b}.`,
        difficulty: d(0.45),
      };
    case 2:
      return {
        sig: `tr-gain-${a}-${b}-${obj}`,
        statement: `${p.nom} avait ${a} ${obj}. À la récréation, ${p.il} en gagne ${b}.`,
        question: `Combien ${de(obj)} ${p.nom} a-t-${p.il} maintenant ?`,
        answer: tout,
        structure: 'transformation',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: 'au début' },
              { value: b, label: acc(obj, 'gagné') },
            ],
          },
        ],
        total: null,
        answerSentence: `Maintenant, ${p.nom} a ___ ${obj}.`,
        reformulations: [
          `${p.nom} avait des ${obj}, ${p.il} en gagne : on cherche combien ${p.il} en a à la fin.`,
          `${p.nom} perd des ${obj} : on cherche combien il en reste.`,
          `On cherche combien ${de(obj)} ${p.nom} avait au début.`,
        ],
        operation: `${a} + ${b} = ${tout}`,
        explication: `${p.nom} gagne des ${obj}, ${p.il} en a plus qu’avant : ${a} + ${b} = ${tout}.`,
        difficulty: d(0.25),
      };
    case 3:
      return {
        sig: `tr-perte-${tout}-${a}-${obj}`,
        statement: `Dans la boite de la classe, il y avait ${tout} ${obj}. Les élèves en prennent ${a}.`,
        question: `Combien ${de(obj)} reste-t-il dans la boite ?`,
        answer: b,
        structure: 'transformation',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: FEM.has(obj) ? 'prises' : 'pris' },
              { value: null, label: acc(obj, 'restant') },
            ],
          },
        ],
        total: tout,
        answerSentence: `Il reste ___ ${obj} dans la boite.`,
        reformulations: [
          `Il y avait ${tout} ${obj}, on en enlève ${a} : on cherche ce qui reste.`,
          `Il y avait ${tout} ${obj}, on en ajoute ${a} : on cherche le total.`,
          `On cherche combien ${de(obj)} les élèves ont pris.`,
        ],
        operation: `${tout} − ${a} = ${b}`,
        explication: `On enlève les ${obj} pris : ${tout} − ${a} = ${b}.`,
        difficulty: d(0.3),
      };
    case 4:
      // BO : « J'en ai distribué 56 et il m'en reste encore 217. Combien y avait-il d'images au début ? »
      return {
        sig: `tr-debut-dist-${a}-${b}-${obj}`,
        statement: `${p.nom} a distribué ${a} ${obj} à ses amis. Il lui en reste encore ${b}.`,
        question: `Combien ${de(obj)} ${p.nom} avait-${p.il} avant de les distribuer ?`,
        answer: tout,
        structure: 'transformation',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: acc(obj, 'distribué') },
              { value: b, label: acc(obj, 'restant') },
            ],
          },
        ],
        total: null,
        answerSentence: `Au début, ${p.nom} avait ___ ${obj}.`,
        reformulations: [
          `On connait ce que ${p.nom} a donné et ce qui lui reste ; on cherche ce qu’${p.il} avait au début.`,
          `On cherche combien ${de(obj)} il reste à ${p.nom}.`,
          `On cherche combien ${de(obj)} ${p.nom} a ${acc(obj, 'distribué')}.`,
        ],
        operation: `${a} + ${b} = ${tout}`,
        explication: `Au début, ${p.nom} avait les ${obj} ${acc(obj, 'distribué')} et ${FEM.has(obj) ? 'celles' : 'ceux'} qui restent : ${a} + ${b} = ${tout}.`,
        difficulty: d(0.6),
      };
    case 5:
      // Piège BO : le mot « gagné » mais il faut soustraire
      return {
        sig: `tr-debut-gain-${tout}-${b}-${obj}`,
        statement: `Après avoir gagné ${b} ${obj}, ${p.nom} en a ${tout}.`,
        question: `Combien ${de(obj)} ${p.nom} avait-${p.il} avant de gagner ?`,
        answer: a,
        structure: 'transformation',
        bars: [
          {
            label: obj,
            segments: [
              { value: null, label: 'avant' },
              { value: b, label: acc(obj, 'gagné') },
            ],
          },
        ],
        total: tout,
        answerSentence: `Avant, ${p.nom} avait ___ ${obj}.`,
        reformulations: [
          `Maintenant ${p.nom} a ${tout} ${obj} ; on cherche combien ${p.il} en avait avant de gagner.`,
          `${p.nom} avait ${tout} ${obj} et en gagne ${b} ; on cherche combien ${p.il} en a maintenant.`,
          `On cherche combien ${de(obj)} ${p.nom} a ${acc(obj, 'gagné')}.`,
        ],
        operation: `${tout} − ${b} = ${a}`,
        explication: `Avant de gagner, ${p.nom} en avait moins : ${tout} − ${b} = ${a} (le mot « gagné » ne veut pas toujours dire « + »).`,
        difficulty: d(0.7),
      };
    default:
      return {
        sig: `tr-ecart-${a}-${tout}-${obj}`,
        statement: `Ce matin, ${p.nom} avait ${a} ${obj}. Ce soir, ${p.il} en a ${tout}.`,
        question: `Combien ${de(obj)} ${p.nom} a-t-${p.il} ${acc(obj, 'gagné')} dans la journée ?`,
        answer: b,
        structure: 'transformation',
        bars: [
          {
            label: obj,
            segments: [
              { value: a, label: 'ce matin' },
              { value: null, label: acc(obj, 'gagné') },
            ],
          },
        ],
        total: tout,
        answerSentence: `${p.nom} a gagné ___ ${obj}.`,
        reformulations: [
          `On connait le nombre ${de(obj)} du matin et du soir ; on cherche combien ${p.nom} en a ${acc(obj, 'gagné')}.`,
          `On cherche combien ${de(obj)} ${p.nom} a le soir.`,
          `${p.nom} perd des ${obj} ; on cherche combien il en reste.`,
        ],
        operation: `${tout} − ${a} = ${b}`,
        explication: `On cherche ce qui a été ajouté : de ${a} pour aller à ${tout}, il faut ${b} (${tout} − ${a} = ${b}).`,
        difficulty: d(0.55),
      };
  }
}

/** Deux étapes additives (BO : 83 livres, on en apporte 18, on en emprunte 27). */
function pbDeuxEtapesEntiers(level: Level, rng: Rng): Pb {
  const max = level === 'facile' ? 100 : 1000;
  const a = rng.int(Math.floor(max / 5), Math.floor(max / 2));
  const b = rng.int(5, Math.floor(max / 5));
  const c = rng.int(5, a + b - 5);
  const r = a + b - c;
  const lieu = rng.pick([
    ['la bibliothèque de la classe', 'livres', 'Le professeur en apporte', 'Les élèves en empruntent'],
    ['le car', 'passagers', 'Au premier arrêt,', 'Au deuxième arrêt,'],
  ] as const);
  const [ou, obj, ajout, retrait] = lieu;
  const st =
    obj === 'livres'
      ? `Dans ${ou}, il y a ${a} ${obj}. ${ajout} ${b} de plus. ${retrait} ${c}.`
      : `Dans ${ou}, il y a ${a} ${obj}. ${ajout} ${b} ${obj} montent. ${retrait} ${c} ${obj} descendent.`;
  return {
    sig: `2e-${obj}-${a}-${b}-${c}`,
    statement: st,
    question:
      obj === 'livres'
        ? `Combien y a-t-il de livres dans ${ou} maintenant ?`
        : `Combien y a-t-il de passagers dans le car maintenant ?`,
    answer: r,
    structure: 'deux-etapes',
    bars: [
      {
        label: 'étape 1',
        segments: [
          { value: a, label: 'au début' },
          { value: b, label: 'en plus' },
        ],
      },
      {
        label: 'étape 2',
        segments: [
          { value: c, label: 'en moins' },
          { value: null, label: 'à la fin' },
        ],
      },
    ],
    total: a + b,
    answerSentence: `Il y a maintenant ___ ${obj}.`,
    reformulations: [
      `D’abord on ajoute ${b}, ensuite on enlève ${c} : on cherche combien il y a ${de(obj)} à la fin.`,
      `On ajoute ${b} puis on ajoute ${c} : on cherche le total.`,
      `On cherche combien ${de(obj)} il y avait au début.`,
    ],
    operation: `${a} + ${b} = ${a + b} ; ${a + b} − ${c} = ${r}`,
    explication: `Étape 1 : ${a} + ${b} = ${a + b}. Étape 2 : ${a + b} − ${c} = ${r}.`,
    difficulty: level === 'facile' ? 0.5 : 0.7,
  };
}

/* ------------------------------------------------------------------ */
/* CE1.MA.PB.COMPAR — comparaison additive                             */
/* ------------------------------------------------------------------ */

function pbComparaison(level: Level, rng: Rng): Pb {
  const max = maxPb(level);
  const [p, q] = deux(rng);
  const obj = rng.pick(OBJETS);
  const grand = rng.int(Math.max(20, Math.floor(max / 3)), max);
  const petit = rng.int(Math.max(5, Math.floor(grand / 4)), grand - 5);
  const ecart = grand - petit;
  const forme = level === 'plus_loin' ? 3 : level === 'facile' ? rng.int(0, 1) : rng.int(0, 2);
  if (forme === 3) {
    // Piège : « de moins » mais il faut ajouter
    return {
      sig: `cmp-moins-${petit}-${ecart}-${obj}`,
      statement: `${q.nom} a ${petit} ${obj}. ${cap(q.il)} en a ${ecart} de moins que ${p.nom}.`,
      question: `Combien ${de(obj)} ${p.nom} a-t-${p.il} ?`,
      answer: grand,
      structure: 'comparaison',
      bars: [
        { label: p.nom, segments: [{ value: null, label: '?' }] },
        { label: q.nom, segments: [{ value: petit }, { value: ecart, label: 'de moins' }] },
      ],
      total: null,
      answerSentence: `${p.nom} a ___ ${obj}.`,
      reformulations: [
        `${p.nom} a ${ecart} ${obj} de plus que ${q.nom}.`,
        `${p.nom} a ${ecart} ${obj} de moins que ${q.nom}.`,
        `${p.nom} et ${q.nom} ont ${petit} ${obj} ensemble.`,
      ],
      operation: `${petit} + ${ecart} = ${grand}`,
      explication: `Si ${q.nom} en a ${ecart} de moins, ${p.nom} en a ${ecart} de plus : ${petit} + ${ecart} = ${grand} (le mot « moins » ne veut pas toujours dire « − »).`,
      difficulty: 0.85,
    };
  }
  if (forme === 0) {
    // BO : Léo a 188 billes, Lucie en a 75 de plus. Combien Lucie a-t-elle de billes ?
    return {
      sig: `cmp-grand-${petit}-${ecart}-${obj}`,
      statement: `${q.nom} a ${petit} ${obj}. ${p.nom} en a ${ecart} de plus que ${q.nom}.`,
      question: `Combien ${de(obj)} ${p.nom} a-t-${p.il} ?`,
      answer: grand,
      structure: 'comparaison',
      bars: [
        { label: p.nom, segments: [{ value: null, label: '?' }] },
        { label: q.nom, segments: [{ value: petit }, { value: ecart, label: 'de plus' }] },
      ],
      total: null,
      answerSentence: `${p.nom} a ___ ${obj}.`,
      reformulations: [
        `${p.nom} a autant ${de(obj)} que ${q.nom}, plus ${ecart}.`,
        `${p.nom} a ${ecart} ${obj} de moins que ${q.nom}.`,
        `${q.nom} a ${ecart} ${obj} de plus que ${p.nom}.`,
      ],
      operation: `${petit} + ${ecart} = ${grand}`,
      explication: `${p.nom} en a autant que ${q.nom} et ${ecart} de plus : ${petit} + ${ecart} = ${grand}.`,
      difficulty: level === 'facile' ? 0.3 : 0.45,
    };
  }
  if (forme === 1) {
    // BO : 111 garçons et 257 filles. Combien de filles de plus que de garçons ?
    const ecole = rng.chance(0.5);
    const [gA, gB] = ecole ? ['filles', 'garçons'] : [`${obj} de ${p.nom}`, `${obj} de ${q.nom}`];
    return {
      sig: `cmp-ecart-${grand}-${petit}-${ecole ? 'ecole' : obj}`,
      statement: ecole
        ? `Dans l’école, il y a ${petit} garçons et ${grand} filles.`
        : `${p.nom} a ${grand} ${obj}. ${q.nom} a ${petit} ${obj}.`,
      question: ecole
        ? 'Combien y a-t-il de filles de plus que de garçons ?'
        : `Combien ${de(obj)} ${p.nom} a-t-${p.il} de plus que ${q.nom} ?`,
      answer: ecart,
      structure: 'comparaison',
      bars: [
        { label: cap(gA), segments: [{ value: grand }] },
        { label: cap(gB), segments: [{ value: petit }, { value: null, label: 'écart' }] },
      ],
      total: null,
      answerSentence: ecole
        ? 'Il y a ___ filles de plus que de garçons.'
        : `${p.nom} a ___ ${obj} de plus que ${q.nom}.`,
      reformulations: ecole
        ? [
            'On compare les filles et les garçons : on cherche l’écart.',
            'On cherche le nombre total d’élèves de l’école.',
            'On cherche combien il y a de garçons.',
          ]
        : [
            `On compare les ${obj} de ${p.nom} et de ${q.nom} : on cherche l’écart.`,
            `On cherche combien ${de(obj)} ${p.il === 'elle' && q.il === 'elle' ? 'elles' : 'ils'} ont ensemble.`,
            `On cherche combien ${de(obj)} ${q.nom} a de plus que ${p.nom}.`,
          ],
      operation: `${grand} − ${petit} = ${ecart}`,
      explication: `Pour trouver l’écart, on enlève le plus petit nombre du plus grand : ${grand} − ${petit} = ${ecart}.`,
      difficulty: 0.6,
    };
  }
  // Plus loin : inconnue sur le petit (« de plus » mais il faut soustraire)
  return {
    sig: `cmp-petit-${grand}-${ecart}-${obj}`,
    statement: `${p.nom} a ${grand} ${obj}. ${cap(p.il)} en a ${ecart} de plus que ${q.nom}.`,
    question: `Combien ${de(obj)} ${q.nom} a-t-${q.il} ?`,
    answer: petit,
    structure: 'comparaison',
    bars: [
      { label: p.nom, segments: [{ value: grand }] },
      {
        label: q.nom,
        segments: [
          { value: null, label: '?' },
          { value: ecart, label: 'de moins' },
        ],
      },
    ],
    total: null,
    answerSentence: `${q.nom} a ___ ${obj}.`,
    reformulations: [
      `${q.nom} a ${ecart} ${obj} de moins que ${p.nom}.`,
      `${q.nom} a ${ecart} ${obj} de plus que ${p.nom}.`,
      `${p.nom} et ${q.nom} ont ${grand} ${obj} ensemble.`,
    ],
    operation: `${grand} − ${ecart} = ${petit}`,
    explication: `Si ${p.nom} en a ${ecart} de plus, ${q.nom} en a ${ecart} de moins : ${grand} − ${ecart} = ${petit}.`,
    difficulty: 0.8,
  };
}

/* ------------------------------------------------------------------ */
/* CE1.MA.PB.2ETAPES — deux étapes, monnaie (rendre sur 5 €, 50 €)     */
/* ------------------------------------------------------------------ */

const ACHATS: [string, number, number][] = [
  // [article, prix mini, prix maxi] en centimes
  ['une baguette', 95, 135],
  ['un croissant', 85, 125],
  ['un pain aux raisins', 95, 145],
  ['un cahier', 150, 350],
  ['une gomme', 55, 95],
  ['un stylo', 105, 195],
  ['une tarte', 1200, 1900],
  ['un gâteau', 1500, 2900],
  ['un livre', 600, 1500],
  ['un ballon', 800, 1800],
];

function pbMonnaie(level: Level, rng: Rng, nbArticles: number): Pb {
  const p = rng.pick(PERSOS);
  for (let essai = 0; essai < 100; essai++) {
    const articles = rng.shuffle(ACHATS).slice(0, nbArticles);
    const prix = articles.map(([, lo, hi]) => {
      const c = rng.int(lo, hi);
      return level === 'facile' ? Math.max(100, Math.round(c / 100) * 100) : Math.round(c / 5) * 5;
    });
    const somme = prix.reduce((a, b) => a + b, 0);
    const billet = [500, 1000, 2000, 5000].find((x) => x > somme);
    if (!billet) continue;
    const rendu = billet - somme;
    // Au niveau normal, des centimes « non ronds » : la réponse ne finit pas par un zéro après la virgule
    if (level !== 'facile' && rendu % 10 === 0 && rendu % 100 !== 0) continue;
    const liste = articles.map(([nom], i) => `${nom} à ${euros(prix[i]!)}`);
    const st = `${p.nom} achète ${liste.slice(0, -1).join(', ')} et ${liste[liste.length - 1]}. ${cap(p.il)} donne un billet de ${euros(billet)}.`;
    return {
      sig: `rendu-${prix.join('-')}-${billet}`,
      statement: st,
      question: 'Combien le vendeur va-t-il rendre ?',
      answer: rendu / 100,
      unit: '€',
      structure: 'deux-etapes',
      bars: [
        {
          label: euros(billet),
          segments: [
            ...articles.map(([nom], i) => ({ value: prix[i]! / 100, label: nom.replace(/^une? /, '') })),
            { value: null, label: 'monnaie rendue' },
          ],
        },
      ],
      total: billet / 100,
      answerSentence: `Le vendeur rend ___ €.`,
      reformulations: [
        `${p.nom} paie ses achats avec ${euros(billet)} : on cherche la monnaie rendue.`,
        `On cherche seulement le prix total des achats.`,
        `${p.nom} reçoit ${euros(billet)} : on cherche combien ${p.il} a en tout.`,
      ],
      operation: `${prix.map(euros).join(' + ')} = ${euros(somme)} ; ${euros(billet)} − ${euros(somme)} = ${euros(rendu)}`,
      explication: `Étape 1 : le prix total est ${euros(somme)}. Étape 2 : ${euros(billet)} − ${euros(somme)} = ${euros(rendu)}.`,
      difficulty: clamp01(0.5 + nbArticles * 0.1 + (level === 'facile' ? -0.2 : 0)),
    };
  }
  return pbDeuxEtapesEntiers(level, rng);
}

function pb2Etapes(level: Level, rng: Rng): Pb {
  if (level === 'plus_loin') return rng.chance(0.6) ? pbMonnaie(level, rng, 3) : pbTroisEtapes(rng);
  return rng.chance(0.5) ? pbMonnaie(level, rng, 2) : pbDeuxEtapesEntiers(level, rng);
}

function pbTroisEtapes(rng: Rng): Pb {
  const p = rng.pick(PERSOS);
  const a = rng.int(150, 400);
  const b = rng.int(20, 150);
  const c = rng.int(20, 150);
  const d = rng.int(10, a + b - c - 10);
  const r = a + b - c - d;
  return {
    sig: `3e-${a}-${b}-${c}-${d}`,
    statement: `${p.nom} a ${a} points au jeu. ${cap(p.il)} gagne ${b} points, puis en perd ${c}, puis en perd encore ${d}.`,
    question: `Combien de points ${p.nom} a-t-${p.il} à la fin ?`,
    answer: r,
    structure: 'deux-etapes',
    bars: [
      {
        label: 'gains',
        segments: [
          { value: a, label: 'au début' },
          { value: b, label: 'gagnés' },
        ],
      },
      {
        label: 'pertes',
        segments: [
          { value: c, label: 'perdus' },
          { value: d, label: 'perdus' },
          { value: null, label: 'à la fin' },
        ],
      },
    ],
    total: a + b,
    answerSentence: `À la fin, ${p.nom} a ___ points.`,
    reformulations: [
      `${p.nom} gagne une fois et perd deux fois : on cherche ses points à la fin.`,
      `${p.nom} gagne trois fois : on cherche ses points à la fin.`,
      `On cherche combien de points ${p.nom} avait au début.`,
    ],
    operation: `${a} + ${b} = ${a + b} ; ${a + b} − ${c} = ${a + b - c} ; ${a + b - c} − ${d} = ${r}`,
    explication: `On fait les étapes dans l’ordre : ${a} + ${b} = ${a + b}, puis − ${c} = ${a + b - c}, puis − ${d} = ${r}.`,
    difficulty: 0.85,
  };
}

/* ------------------------------------------------------------------ */
/* CE1.MA.PB.MULT — multiplicatifs, partage (nombre de parts, valeur d'une part, reste) */
/* ------------------------------------------------------------------ */

const CONTENANTS: [string, string, string][] = [
  // [contenant (pluriel), objet (pluriel), verbe de partage]
  ['paquets', 'biscuits', 'range'],
  ['boites', 'œufs', 'range'],
  ['sachets', 'bonbons', 'met'],
  ['équipes', 'élèves', 'forme'],
  ['pages', 'photos', 'colle'],
  ['vases', 'fleurs', 'met'],
];

const segmentsParts = (n: number, v: number | null, lab?: (i: number) => string) =>
  n <= 10
    ? Array.from({ length: n }, (_, i) => ({ value: v, label: lab?.(i) }))
    : [
        { value: v, label: lab?.(0) },
        { value: v, label: lab?.(1) },
        { value: v, label: lab?.(2) },
        { value: null, label: '…' },
      ];

function pbMult(level: Level, rng: Rng): Pb {
  const p = rng.pick(PERSOS);
  const [cont, obj] = rng.pick(CONTENANTS);
  const maxTot = parNiv(level, { facile: 30, normal: 200, plus_loin: 1000 });
  const forme = rng.int(0, level === 'facile' ? 2 : 3);
  // nombre de parts × valeur d'une part ≤ maxTot
  let n = 0;
  let v = 0;
  for (let k = 0; k < 100; k++) {
    n = rng.int(2, level === 'facile' ? 5 : 10);
    v =
      level === 'plus_loin'
        ? rng.pick([rng.int(11, 30), 25, 50, rng.int(3, 9) * 10])
        : rng.int(2, level === 'facile' ? 6 : 25);
    if (n * v <= maxTot && (level !== 'plus_loin' || n * v >= 100)) break;
  }
  const t = n * v;
  if (forme === 0)
    return {
      sig: `mult-${n}-${v}-${obj}`,
      statement: `Il y a ${n} ${cont}. Dans chaque ${cont.replace(/s$/, '')}, il y a ${v} ${obj}.`,
      question: `Combien y a-t-il ${de(obj)} en tout ?`,
      answer: t,
      structure: 'multiplicatif',
      bars: [{ label: `${n} ${cont}`, segments: segmentsParts(n, v) }],
      total: null,
      answerSentence: `Il y a ___ ${obj} en tout.`,
      reformulations: [
        `Il y a ${n} ${cont} de ${v} ${obj} : on cherche le nombre total ${de(obj)}.`,
        `Il y a ${n} ${obj} en tout : on cherche combien il y a ${de(cont)}.`,
        `On ajoute ${n} ${obj} et ${v} ${obj}.`,
      ],
      operation: `${n} × ${v} = ${t}`,
      explication: `${n} fois ${v} ${obj} : ${n} × ${v} = ${t}.`,
      difficulty: clamp01(0.3 + t / maxTot / 2),
    };
  if (forme === 1)
    // Partage : nombre de parts (BO : 60 élèves, équipes de 5)
    return {
      sig: `quot-${t}-${v}-${obj}`,
      statement: `Il y a ${t} ${obj}. On fait des ${cont} de ${v} ${obj}.`,
      question: `Combien ${de(cont)} peut-on faire ?`,
      answer: n,
      structure: 'partage',
      bars: [{ label: obj, segments: segmentsParts(n, v) }],
      total: t,
      answerSentence: `On peut faire ___ ${cont}.`,
      reformulations: [
        `On range ${t} ${obj} par groupes de ${v} : on cherche le nombre de groupes.`,
        `On cherche combien il y a ${de(obj)} dans chaque groupe.`,
        `On cherche combien il y a ${de(obj)} en tout.`,
      ],
      operation: `${n} × ${v} = ${t}`,
      explication: `On cherche combien de fois ${v} dans ${t} : ${n} × ${v} = ${t}, donc ${n} ${cont}.`,
      difficulty: clamp01(0.45 + t / maxTot / 3),
    };
  if (forme === 2) {
    // Partage : valeur d'une part (BO : 3 enfants se partagent 18 images)
    const nb = Math.min(n, 6);
    const tt = nb * v;
    const imgs = rng.pick(OBJETS);
    return {
      sig: `part-${tt}-${nb}-${imgs}`,
      statement: `${nb} enfants se partagent ${tt} ${imgs}. Chaque enfant doit avoir le même nombre ${de(imgs)}.`,
      question: `Combien ${de(imgs)} aura chaque enfant ?`,
      answer: v,
      structure: 'partage',
      bars: [{ label: imgs, segments: segmentsParts(nb, null, (i) => `enfant ${i + 1}`) }],
      total: tt,
      answerSentence: `Chaque enfant aura ___ ${imgs}.`,
      reformulations: [
        `On distribue ${tt} ${imgs} équitablement à ${nb} enfants : on cherche la part de chacun.`,
        `Chaque enfant a ${tt} ${imgs} : on cherche le total.`,
        `On cherche combien il y a d’enfants.`,
      ],
      operation: `${nb} × ${v} = ${tt}`,
      explication: `On distribue un par un : ${nb} × ${v} = ${tt}, donc chaque enfant a ${v} ${imgs}.`,
      difficulty: clamp01(0.5 + tt / maxTot / 3),
    };
  }
  // Partage avec reste (BO : 189 photos, 10 par page ; 75 œufs par boites de 6)
  const taille = level === 'plus_loin' ? rng.pick([6, 8, 10, 12, 25]) : rng.pick([2, 5, 6, 10]);
  const total = rng.int(taille * 3 + 1, Math.min(maxTot, taille * (level === 'plus_loin' ? 40 : 20)));
  const reste = total % taille;
  if (reste === 0) return pbMult(level, rng);
  const q = Math.floor(total / taille);
  const pleins =
    q <= 3 ? segmentsParts(q, taille) : [...segmentsParts(3, taille), { value: null, label: '…' }];
  const contenant = rng.chance(0.5);
  if (contenant) {
    // « Combien de pages me faut-il ? » → on compte la page incomplète
    return {
      sig: `reste-sup-${total}-${taille}`,
      statement: `${p.nom} veut ranger ses ${total} photos dans un album. ${cap(p.il)} peut mettre ${taille} photos par page.`,
      question: `Combien de pages lui faut-il pour ranger toutes ses photos ?`,
      answer: q + 1,
      structure: 'partage',
      bars: [{ label: 'photos', segments: [...pleins, { value: reste, label: 'dernière page' }] }],
      total,
      answerSentence: `Il lui faut ___ pages.`,
      reformulations: [
        `On range ${total} photos par paquets de ${taille} ; même la page pas pleine compte.`,
        `On cherche combien de photos il y a sur chaque page.`,
        `On cherche combien de photos il reste à la fin.`,
      ],
      operation: `${q} × ${taille} = ${q * taille} ; il reste ${reste} photo${reste > 1 ? 's' : ''}, donc ${q} + 1 = ${q + 1}`,
      explication: `${q} pages pleines font ${q * taille} photos ; il reste ${reste} photo${reste > 1 ? 's' : ''} : il faut une page de plus, donc ${q + 1} pages.`,
      difficulty: 0.8,
    };
  }
  return {
    sig: `reste-inf-${total}-${taille}`,
    statement: `Un fermier a ${total} œufs à vendre au marché. Il les vend par boites de ${taille} œufs.`,
    question: `Combien de boites pleines va-t-il pouvoir vendre ?`,
    answer: q,
    structure: 'partage',
    bars: [{ label: 'œufs', segments: [...pleins, { value: reste, label: 'reste' }] }],
    total,
    answerSentence: `Il va pouvoir vendre ___ boites.`,
    reformulations: [
      `On range ${total} œufs par boites de ${taille} : on cherche le nombre de boites pleines.`,
      `On cherche combien d’œufs il y a dans chaque boite.`,
      `On cherche combien d’œufs le fermier a en tout.`,
    ],
    operation: `${q} × ${taille} = ${q * taille} ; il reste ${reste} œuf${reste > 1 ? 's' : ''}`,
    explication: `${q} × ${taille} = ${q * taille} et il reste ${reste} œuf${reste > 1 ? 's' : ''}, pas assez pour une boite pleine : ${q} boites.`,
    difficulty: 0.75,
  };
}

/* ------------------------------------------------------------------ */
/* CE1.MA.PB.MIXTES — une étape additive + une étape multiplicative    */
/* ------------------------------------------------------------------ */

function pbMixte(level: Level, rng: Rng): Pb {
  const p = rng.pick(PERSOS);
  const forme = level === 'plus_loin' ? 3 : rng.int(0, 2);
  const petit = level === 'facile';
  if (forme === 0) {
    // BO : Abi achète 7 litres d'huile à 2 € le litre ; elle donne 20 €
    const [art, unite] = rng.pick([
      ['litres d’huile', 'le litre'],
      ['places de cinéma', 'la place'],
      ['cahiers', 'le cahier'],
      ['kilos de pommes', 'le kilo'],
    ] as const);
    const n = rng.int(2, petit ? 4 : 9);
    const prix = rng.int(2, petit ? 3 : 9);
    const cout = n * prix;
    const billet = [10, 20, 50, 100].find((b) => b > cout)!;
    return {
      sig: `mix-rendu-${n}-${prix}-${billet}`,
      statement: `${p.nom} achète ${n} ${art} à ${prix} € ${unite}. ${cap(p.il)} donne ${billet} € au vendeur.`,
      question: 'Combien le vendeur va-t-il lui rendre ?',
      answer: billet - cout,
      unit: '€',
      structure: 'deux-etapes',
      bars: [
        {
          label: `${billet} €`,
          segments: [
            { value: cout, label: `${n} × ${prix} €` },
            { value: null, label: 'monnaie' },
          ],
        },
      ],
      total: billet,
      answerSentence: 'Le vendeur rend ___ €.',
      reformulations: [
        `D’abord on cherche le prix des ${n} ${art}, puis la monnaie sur ${billet} €.`,
        `On cherche seulement le prix d’un seul article.`,
        `On ajoute ${n} €, ${prix} € et ${billet} €.`,
      ],
      operation: `${n} × ${prix} = ${cout} ; ${billet} − ${cout} = ${billet - cout}`,
      explication: `Étape 1 : ${n} × ${prix} € = ${cout} €. Étape 2 : ${billet} € − ${cout} € = ${billet - cout} €.`,
      difficulty: petit ? 0.5 : 0.65,
    };
  }
  if (forme === 1) {
    // BO : un cahier 4 €, un protège-cahier 2 € ; 20 cahiers et autant de protège-cahiers
    const a = rng.int(2, petit ? 3 : 6);
    const b = rng.int(1, petit ? 2 : 4);
    const n = petit ? rng.int(2, 5) : rng.pick([5, 10, 20, rng.int(3, 9)]);
    return {
      sig: `mix-facture-${a}-${b}-${n}`,
      statement: `Un cahier coute ${a} € et un protège-cahier ${b} €. ${p.nom} achète ${n} cahiers et autant de protège-cahiers.`,
      question: `Combien ${p.nom} paie-t-${p.il} en tout ?`,
      answer: (a + b) * n,
      unit: '€',
      structure: 'deux-etapes',
      bars: [{ label: `${n} lots`, segments: segmentsParts(n, a + b) }],
      total: null,
      answerSentence: `${p.nom} paie ___ € en tout.`,
      reformulations: [
        `${p.nom} achète ${n} fois un cahier et un protège-cahier : on cherche le prix total.`,
        `On cherche le prix d’un seul cahier.`,
        `${p.nom} achète ${n} cahiers seulement.`,
      ],
      operation: `${a} + ${b} = ${a + b} ; ${n} × ${a + b} = ${(a + b) * n}`,
      explication: `Un cahier et son protège-cahier coutent ${a} + ${b} = ${a + b} € ; ${n} fois : ${n} × ${a + b} = ${(a + b) * n} €.`,
      difficulty: petit ? 0.55 : 0.7,
    };
  }
  if (forme === 2) {
    const [cont, obj] = rng.pick(CONTENANTS);
    const n = rng.int(2, petit ? 4 : 8);
    const v = rng.int(petit ? 3 : 6, petit ? 6 : 12);
    const perdu = rng.int(1, n * v - 1);
    return {
      sig: `mix-perte-${n}-${v}-${perdu}-${obj}`,
      statement: `${p.nom} a ${n} ${cont} de ${v} ${obj}. ${cap(p.il)} en donne ${perdu}.`,
      question: `Combien ${de(obj)} lui reste-t-il ?`,
      answer: n * v - perdu,
      structure: 'deux-etapes',
      bars: [
        { label: `${n} ${cont}`, segments: segmentsParts(n, v) },
        {
          label: obj,
          segments: [
            { value: perdu, label: 'donnés' },
            { value: null, label: 'reste' },
          ],
        },
      ],
      total: n * v,
      answerSentence: `Il lui reste ___ ${obj}.`,
      reformulations: [
        `D’abord on cherche combien ${de(obj)} ${p.nom} a en tout, puis on enlève ceux donnés.`,
        `On cherche combien ${de(obj)} ${p.nom} a donnés.`,
        `${p.nom} reçoit ${perdu} ${obj} de plus.`,
      ],
      operation: `${n} × ${v} = ${n * v} ; ${n * v} − ${perdu} = ${n * v - perdu}`,
      explication: `Étape 1 : ${n} × ${v} = ${n * v}. Étape 2 : ${n * v} − ${perdu} = ${n * v - perdu}.`,
      difficulty: petit ? 0.55 : 0.65,
    };
  }
  // Plus loin : 3 étapes
  const n1 = rng.int(3, 8);
  const v1 = rng.int(4, 9);
  const n2 = rng.int(2, 6);
  const v2 = rng.int(5, 10);
  const mange = rng.int(5, 20);
  const r = n1 * v1 + n2 * v2 - mange;
  return {
    sig: `mix3-${n1}-${v1}-${n2}-${v2}-${mange}`,
    statement: `Pour la fête, ${p.nom} apporte ${n1} sachets de ${v1} bonbons et ${n2} sachets de ${v2} sucettes. Les enfants en mangent ${mange}.`,
    question: 'Combien de friandises reste-t-il ?',
    answer: r,
    structure: 'deux-etapes',
    bars: [
      { label: 'bonbons', segments: segmentsParts(n1, v1) },
      { label: 'sucettes', segments: segmentsParts(n2, v2) },
      { label: 'mangées', segments: [{ value: mange }, { value: null, label: 'reste' }] },
    ],
    total: null,
    answerSentence: 'Il reste ___ friandises.',
    reformulations: [
      'On calcule les bonbons, puis les sucettes, on ajoute, puis on enlève ce qui est mangé.',
      'On cherche seulement le nombre de bonbons.',
      'On cherche combien de friandises les enfants ont mangées.',
    ],
    operation: `${n1} × ${v1} = ${n1 * v1} ; ${n2} × ${v2} = ${n2 * v2} ; ${n1 * v1} + ${n2 * v2} − ${mange} = ${r}`,
    explication: `${n1} × ${v1} = ${n1 * v1} bonbons, ${n2} × ${v2} = ${n2 * v2} sucettes, ${n1 * v1 + n2 * v2} en tout, et ${n1 * v1 + n2 * v2} − ${mange} = ${r}.`,
    difficulty: 0.9,
  };
}

/* ------------------------------------------------------------------ */

export const PROBLEMES: Record<string, LessonContent> = {
  'CE1.MA.PB.ADD_PT': deuxTypes((level, rng) =>
    level === 'plus_loin'
      ? pbDeuxEtapesEntiers('normal', rng)
      : level === 'facile'
        ? pbAdditif(level, rng, rng.pick([0, 2, 3]))
        : pbAdditif(level, rng),
  ),
  'CE1.MA.PB.COMPAR': deuxTypes(pbComparaison),
  'CE1.MA.PB.2ETAPES': deuxTypes(pb2Etapes),
  'CE1.MA.PB.MULT': deuxTypes(pbMult),
  'CE1.MA.PB.MIXTES': deuxTypes(pbMixte),
};
