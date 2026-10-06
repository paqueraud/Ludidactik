/**
 * CM2 — Conjugaison (BO n°16 du 17/04/2025, cycle 3). CM2 : « Conjugaisons à mémoriser et à maîtriser :
 * passé simple, plus-que-parfait des verbes être et avoir, des verbes des premier et deuxième groupes,
 * des verbes irréguliers du troisième groupe : faire, aller, dire, venir, pouvoir, voir, vouloir,
 * prendre » ; temps composés (auxiliaire + participe passé) ; forme négative des temps composés ;
 * marque de temps et marque de personne ; variations du radical. Présent, imparfait, futur, passé
 * composé : consolidation du CM1. Conditionnel présent et impératif présent : programme de 6e
 * (leçons étiquetées « Pour aller plus loin (6e) »).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import {
  type Plan,
  type PlanParNiveau,
  formeAvecPronom,
  formesDe,
  gensConjugaison,
  itemTrou,
  phraseAvec,
  regle,
  tirer,
} from './conj';
import {
  AUTRES_TROISIEME,
  DEUXIEME,
  ETRE_AVOIR,
  IRREGULIERS_BO,
  PREMIER_CER_GER,
  PREMIER_ETRE,
  PREMIER_IER,
  PREMIER_RADICAL,
  PREMIER_SIMPLES,
  type VerbeLex,
  lex,
} from './lexique';
import {
  AU_TEMPS,
  NOM_TEMPS,
  PERSONNES,
  type Personne,
  type Temps,
  avecPronom,
  conjuguer,
  decomposer,
  formes,
  groupe,
} from './moteur';
import { clamp01, make, mcq, trou, vraiFaux } from './util';

const fois = <T>(n: number, x: T[]): T[] => Array.from({ length: n }, () => x).flat();

const EA = [ETRE_AVOIR.être, ETRE_AVOIR.avoir];
const FACILE: VerbeLex[] = [...fois(4, EA), ...PREMIER_SIMPLES];
const NORMAL: VerbeLex[] = [
  ...fois(6, EA),
  ...PREMIER_SIMPLES,
  ...PREMIER_CER_GER,
  ...PREMIER_IER,
  ...DEUXIEME,
  ...fois(3, IRREGULIERS_BO),
];
const PLUS_LOIN: VerbeLex[] = [...NORMAL, ...fois(2, PREMIER_RADICAL), ...fois(3, AUTRES_TROISIEME)];
const VERBES_ETRE: VerbeLex[] = [...PREMIER_ETRE, lex('aller'), lex('venir'), lex('revenir')];

const TOUTES: readonly Personne[] = PERSONNES;
const VOISINS: Temps[] = [
  'present',
  'imparfait',
  'futur',
  'passe_simple',
  'passe_compose',
  'plus_que_parfait',
];

const plan = (
  temps: Temps[],
  verbes: VerbeLex[],
  personnes: readonly Personne[] = TOUTES,
  extra: Partial<Plan> = {},
): Plan => ({ temps, verbes, personnes, sujets: 'varies', indicateur: 0.7, voisins: VOISINS, ...extra });

const parTemps = (t: Temps, extra: Partial<Plan> = {}): PlanParNiveau => ({
  facile: plan([t], FACILE, TOUTES, extra),
  normal: plan([t], NORMAL, TOUTES, extra),
  plus_loin: plan([t], PLUS_LOIN, TOUTES, extra),
});

const PRESENT = parTemps('present');
const IMPARFAIT = parTemps('imparfait');
const FUTUR = parTemps('futur');

const PASSE_SIMPLE: PlanParNiveau = {
  facile: plan(['passe_simple'], PREMIER_SIMPLES, [2]),
  normal: plan(['passe_simple'], NORMAL, [2, 5]),
  plus_loin: plan(['passe_simple'], NORMAL, TOUTES),
};

const VOISINS_COND: Temps[] = ['present', 'imparfait', 'futur', 'conditionnel'];
const CONDITIONNEL: PlanParNiveau = {
  facile: plan(['conditionnel'], PREMIER_SIMPLES, TOUTES, { voisins: VOISINS_COND }),
  normal: plan(['conditionnel'], NORMAL, TOUTES, { voisins: VOISINS_COND }),
  plus_loin: plan(['conditionnel'], PLUS_LOIN, TOUTES, { voisins: VOISINS_COND }),
};

const PC: PlanParNiveau = {
  facile: plan(['passe_compose'], [...PREMIER_SIMPLES, ...DEUXIEME]),
  normal: plan(['passe_compose'], [...NORMAL, ...fois(3, VERBES_ETRE)], TOUTES, { negation: 0.25 }),
  plus_loin: plan(['passe_compose'], [...PLUS_LOIN, ...fois(3, VERBES_ETRE)], TOUTES, { negation: 0.4 }),
};

const PQP: PlanParNiveau = {
  facile: plan(['plus_que_parfait'], [...PREMIER_SIMPLES, ...DEUXIEME, ...fois(2, EA)]),
  normal: plan(['plus_que_parfait'], [...NORMAL, ...fois(3, VERBES_ETRE)], TOUTES, { negation: 0.2 }),
  plus_loin: plan(['plus_que_parfait'], [...PLUS_LOIN, ...fois(3, VERBES_ETRE)], TOUTES, { negation: 0.4 }),
};

const IMP_PERSONNES: readonly Personne[] = [1, 3, 4];
const IMPERATIF: PlanParNiveau = {
  facile: plan(['imperatif'], [...PREMIER_SIMPLES, ...PREMIER_CER_GER], IMP_PERSONNES),
  normal: plan(
    ['imperatif'],
    [...PREMIER_SIMPLES, ...fois(2, EA), ...DEUXIEME, ...fois(3, IRREGULIERS_BO)],
    IMP_PERSONNES,
  ),
  plus_loin: plan(
    ['imperatif'],
    [...PREMIER_SIMPLES, ...fois(2, EA), ...DEUXIEME, ...fois(3, IRREGULIERS_BO), ...AUTRES_TROISIEME],
    IMP_PERSONNES,
  ),
};

/* ------------------------------------------------------------------ */
/* Conditionnel : emplois (plus loin)                                   */
/* ------------------------------------------------------------------ */

const EMPLOIS_COND: { phrase: string; emploi: string; pourquoi: string }[] = [
  {
    phrase: 'Je voudrais un verre d’eau, s’il vous plaît.',
    emploi: 'la politesse',
    pourquoi: 'on demande gentiment',
  },
  {
    phrase: 'Pourriez-vous m’aider à porter ce sac ?',
    emploi: 'la politesse',
    pourquoi: 'on demande gentiment',
  },
  {
    phrase: 'Nous aimerions visiter le musée.',
    emploi: 'la politesse',
    pourquoi: 'on exprime un souhait poliment',
  },
  {
    phrase: 'Si j’avais des ailes, je volerais jusqu’aux nuages.',
    emploi: 'une supposition',
    pourquoi: 'c’est imaginé, avec « si »',
  },
  {
    phrase: 'Si nous gagnions, nous ferions la fête.',
    emploi: 'une supposition',
    pourquoi: 'c’est imaginé, avec « si »',
  },
  {
    phrase: 'S’il neigeait, les enfants feraient un bonhomme de neige.',
    emploi: 'une supposition',
    pourquoi: 'c’est imaginé, avec « si »',
  },
  {
    phrase: 'Tu pourrais fermer la fenêtre, s’il te plaît ?',
    emploi: 'la politesse',
    pourquoi: 'on demande gentiment',
  },
  {
    phrase: 'Si le chat parlait, il raconterait ses aventures.',
    emploi: 'une supposition',
    pourquoi: 'c’est imaginé, avec « si »',
  },
];
const EMPLOIS = ['la politesse', 'une supposition', 'un ordre'];

function condTrouPlusLoin(rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const t = tirer({ ...CONDITIONNEL.plus_loin, sujets: 'pronoms', indicateur: 0 }, rng);
  if (rng.chance(0.3)) {
    // politesse : « Je voudrais… », « Nous aimerions… »
    const inf = rng.pick(['vouloir', 'aimer']);
    const p = rng.pick<Personne>([0, 3]);
    const forme = conjuguer(inf, 'conditionnel', p);
    const compl =
      inf === 'vouloir'
        ? rng.pick(['un verre d’eau', 'une part de gâteau', 'un renseignement'])
        : rng.pick(['visiter le musée', 'parler à la directrice', 'goûter ce gâteau']);
    const suj = p === 0 ? (/^[aeiou]/.test(forme) ? 'J’' : 'Je ') : 'Nous ';
    return trou(ctx, rng, 'politesse', {
      sentence: `${suj}___ (${inf}, conditionnel présent) ${compl}, s’il vous plaît.`,
      answer: forme,
      wrong: [
        conjuguer(inf, 'futur', p),
        conjuguer(inf, 'imparfait', p),
        conjuguer(inf, 'present', p),
        ...PERSONNES.filter((q) => q !== p).map((q) => conjuguer(inf, 'conditionnel', q)),
      ],
      explication: `Pour demander poliment, on emploie le conditionnel présent : radical du futur + -ais, -ais, -ait, -ions, -iez, -aient. → ${suj}${forme} ${compl}, s’il vous plaît.`,
      difficulty: 0.6,
      conjugaison: { sujet: p === 0 ? 'je' : 'nous', verbe: inf, temps: NOM_TEMPS.conditionnel },
    });
  }
  // supposition : « Si tu avais le temps, tu… »
  const pr = t.sujet!.texte;
  const avait = avecPronom(t.p, conjuguer('avoir', 'imparfait', t.p), pr === 'on' ? 'on' : pr);
  const base = itemTrou(ctx, rng, { ...t, indicateur: undefined });
  const corps = base.sentence.replace(/^./, (c) => c.toLowerCase());
  return trou(ctx, rng, 'supposition', {
    sentence: `Si ${avait} le temps, ${corps}`,
    answer: base.answer,
    accepted: base.accepted,
    wrong: base.choices?.filter((c) => c !== base.answer),
    explication: `Avec « si » + imparfait, on imagine : le verbe principal est au conditionnel présent. ${base.explication}`,
    difficulty: 0.7,
    conjugaison: base.conjugaison,
  });
}

function condQcmPlusLoin(rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const e = rng.pick(EMPLOIS_COND);
  return mcq(ctx, rng, 'emploi', {
    question: `Dans « ${e.phrase} », que permet d’exprimer le conditionnel ?`,
    good: e.emploi,
    wrong: EMPLOIS,
    fixedOrder: EMPLOIS,
    explication: `Ici, le conditionnel exprime ${e.emploi} : ${e.pourquoi}.`,
    difficulty: 0.75,
  });
}

/* ------------------------------------------------------------------ */
/* Impératif + pronom (plus loin) : « range-la », « vas-y »              */
/* ------------------------------------------------------------------ */

const IMP_PRONOMS: { inf: string; phrase: string; pron: 'le' | 'la' | 'les' | 'y'; nom: string }[] = [
  { inf: 'ranger', phrase: 'La classe est en désordre : ___ !', pron: 'la', nom: 'la classe' },
  { inf: 'finir', phrase: 'Le puzzle n’est pas terminé : ___ !', pron: 'le', nom: 'le puzzle' },
  { inf: 'prendre', phrase: 'Il pleut et le parapluie est là : ___ !', pron: 'le', nom: 'le parapluie' },
  { inf: 'faire', phrase: 'Le gâteau n’est pas encore prêt : ___ !', pron: 'le', nom: 'le gâteau' },
  { inf: 'dire', phrase: 'La bonne réponse ? ___ à voix haute !', pron: 'la', nom: 'la réponse' },
  { inf: 'écouter', phrase: 'Cette chanson est très belle : ___ !', pron: 'la', nom: 'la chanson' },
  { inf: 'regarder', phrase: 'Les étoiles brillent : ___ !', pron: 'les', nom: 'les étoiles' },
  { inf: 'manger', phrase: 'Les fraises sont mûres : ___ !', pron: 'les', nom: 'les fraises' },
  { inf: 'appeler', phrase: 'Le chien s’est sauvé : ___ !', pron: 'le', nom: 'le chien' },
  { inf: 'aller', phrase: 'Le parc est ouvert : ___ !', pron: 'y', nom: 'au parc' },
  { inf: 'arroser', phrase: 'Les fleurs ont soif : ___ !', pron: 'les', nom: 'les fleurs' },
  { inf: 'fermer', phrase: 'La porte est ouverte : ___ !', pron: 'la', nom: 'la porte' },
  { inf: 'apprendre', phrase: 'La poésie est belle : ___ par cœur !', pron: 'la', nom: 'la poésie' },
  { inf: 'choisir', phrase: 'Ce livre a l’air passionnant : ___ !', pron: 'le', nom: 'le livre' },
  { inf: 'nettoyer', phrase: 'La table est sale : ___ !', pron: 'la', nom: 'la table' },
];

function impPronom(inf: string, p: Personne, pron: string): string {
  let f = conjuguer(inf, 'imperatif', p);
  // devant « y » ou « en », la 2e personne du singulier reprend un s (vas-y, manges-en)
  if (pron === 'y' && p === 1 && !f.endsWith('s')) f += 's';
  return `${f}-${pron}`;
}

function impTrouPlusLoin(rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const x = rng.pick(IMP_PRONOMS);
  const p = rng.pick<Personne>([1, 3, 4]);
  const bonne = impPronom(x.inf, p, x.pron);
  const base = conjuguer(x.inf, 'imperatif', p);
  const autresPron = ['le', 'la', 'les'].filter((q) => q !== x.pron);
  const wrong = [
    ...autresPron.map((q) => `${base}-${q}`),
    `${base} ${x.pron}`,
    ...(p === 1 && groupe(x.inf) === 1 && x.pron !== 'y' ? [`${base}s-${x.pron}`] : []),
    ...(x.pron === 'y' && p === 1 ? [`${base}-y`] : []),
  ];
  const qui = ['', 'tu', '', 'nous', 'vous', ''][p]!;
  return trou(ctx, rng, 'imp-pronom', {
    sentence: x.phrase,
    answer: bonne,
    wrong,
    explication:
      x.pron === 'y'
        ? `À l’impératif, le pronom se place après le verbe avec un trait d’union : ${bonne} ! (« y » remplace « ${x.nom} »)${p === 1 ? ' ; devant « y », va prend un s : vas-y !' : '.'}`
        : `À l’impératif, le pronom complément se place après le verbe, avec un trait d’union : ${bonne} ! (« ${x.pron} » remplace « ${x.nom} »).`,
    difficulty: 0.75,
    conjugaison: { sujet: qui, verbe: x.inf, temps: NOM_TEMPS.imperatif },
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.CONJ.MARQUES — radical, marque du temps, marque de la personne */
/* ------------------------------------------------------------------ */

const TEMPS_MARQUES: Temps[] = ['present', 'imparfait', 'futur'];
const MARQUES_PLAN: Record<Level, Plan> = {
  facile: plan(TEMPS_MARQUES, PREMIER_SIMPLES, TOUTES, { sujets: 'pronoms', indicateur: 0.5 }),
  normal: plan(TEMPS_MARQUES, [...PREMIER_SIMPLES, ...DEUXIEME, ...fois(2, EA), ...IRREGULIERS_BO], TOUTES, {
    sujets: 'pronoms',
    indicateur: 0.5,
  }),
  plus_loin: plan(TEMPS_MARQUES, [...PREMIER_SIMPLES, ...fois(3, PREMIER_RADICAL), ...DEUXIEME], TOUTES, {
    sujets: 'pronoms',
    indicateur: 0.5,
  }),
};

/** Un tirage dont la forme se découpe (radical + marques). */
function tirageMarques(level: Level, rng: Rng) {
  for (let i = 0; i < 100; i++) {
    const t = tirer(MARQUES_PLAN[level], rng);
    const d = decomposer(t.verbe.inf, t.temps, t.p);
    if (!d || d.radical.length < 1) continue;
    const forme = formesDe(t)[0]!;
    return { t, d, forme, avecPr: avecPronom(t.p, forme, t.sujet!.texte) };
  }
  throw new Error('Pas de forme décomposable');
}

const RAPPEL_MARQUES =
  'Une forme verbale = radical + marque du temps (-ai- ou -i- à l’imparfait, -r- au futur, rien au présent) + marque de la personne (-s, -t, -ons, -ez, -ent…).';

function marquesQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const { t, d, avecPr } = tirageMarques(level, rng);
  const tiret = (x: string) => `-${x}-`;
  const fin = (x: string) => `-${x}`;
  const rad = (x: string) => `${x}-`;
  const quoi =
    level === 'facile'
      ? rng.pick(['terminaison', 'personne'])
      : level === 'plus_loin' && t.temps !== 'futur' && rng.chance(0.5)
        ? 'radical'
        : d.temps
          ? rng.pick(['temps', 'personne'])
          : 'personne';
  const autresPers = PERSONNES.map((q) => decomposer(t.verbe.inf, t.temps, q)?.personne).filter(
    (x): x is string => !!x && x !== d.personne,
  );
  const explication = `${RAPPEL_MARQUES} « ${avecPr} » = ${d.radical} + ${d.temps ? `${d.temps} (marque ${t.temps === 'futur' ? 'du futur' : 'de l’imparfait'}) + ` : ''}${d.personne} (marque de la personne).`;
  if (quoi === 'terminaison') {
    const term = d.temps + d.personne;
    return mcq(ctx, rng, 'terminaison', {
      question: `Quelle est la terminaison de « ${avecPr} » ?`,
      good: fin(term),
      wrong: [fin(d.personne), ...autresPers.map((x) => fin(d.temps + x)), fin(d.radical.slice(-1) + term)],
      explication: `La terminaison est la fin du verbe qui change selon la personne et le temps : « ${avecPr} » → ${d.radical}-${term}.`,
      difficulty: 0.3,
    });
  }
  if (quoi === 'radical') {
    const radicaux = PERSONNES.map((q) => decomposer(t.verbe.inf, t.temps, q)?.radical).filter(
      (x): x is string => !!x,
    );
    const pieges = [
      d.radical + d.temps,
      d.radical.slice(0, -1),
      t.verbe.inf.slice(0, -2),
      `${t.verbe.inf.slice(0, -2)}e`,
    ];
    return mcq(ctx, rng, 'radical', {
      question: `Quel est le radical de « ${avecPr} » ?`,
      good: rad(d.radical),
      wrong: [...radicaux, ...pieges].filter((x) => x.length > 1).map(rad),
      explication: `${explication} Attention : le radical de certains verbes change selon la personne (j’appelle, nous appelons).`,
      difficulty: 0.75,
    });
  }
  if (quoi === 'temps') {
    return mcq(ctx, rng, 'marque-temps', {
      question: `Dans « ${avecPr} », quelle est la marque du temps ?`,
      good: tiret(d.temps),
      wrong: [fin(d.personne), rad(d.radical), ...['ai', 'i', 'r'].filter((x) => x !== d.temps).map(tiret)],
      explication,
      difficulty: 0.55,
    });
  }
  return mcq(ctx, rng, 'marque-personne', {
    question: `Dans « ${avecPr} », quelle est la marque de la personne ?`,
    good: fin(d.personne),
    wrong: [...(d.temps ? [tiret(d.temps)] : []), rad(d.radical), ...autresPers.map(fin)],
    explication,
    difficulty: 0.5,
  });
}

function marquesVraiFaux(level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> {
  const { t, d, avecPr } = tirageMarques(level, rng);
  const vrai = rng.chance(0.5);
  const explication = `${RAPPEL_MARQUES} « ${avecPr} » = ${d.radical} + ${d.temps ? `${d.temps} + ` : ''}${d.personne}.`;
  if (d.temps && rng.chance(0.5)) {
    const dit = vrai ? d.temps : rng.pick(['ai', 'i', 'r'].filter((x) => x !== d.temps));
    return vraiFaux(ctx, 'marque-temps', {
      statement: `Dans « ${avecPr} », la marque du temps est « -${dit}- ».`,
      answer: vrai,
      explication,
      difficulty: 0.5,
    });
  }
  const autres = PERSONNES.map((q) => decomposer(t.verbe.inf, t.temps, q)?.personne).filter(
    (x): x is string => !!x && x !== d.personne,
  );
  const dit = vrai || !autres.length ? d.personne : rng.pick(autres);
  return vraiFaux(ctx, 'marque-personne', {
    statement: `Dans « ${avecPr} », la marque de la personne est « -${dit} ».`,
    answer: dit === d.personne,
    explication,
    difficulty: 0.45,
  });
}

/** Classement : par temps (marque du temps) ou, plus loin, par radical (j'appelle / nous appelons). */
function marquesClassement(level: Level, rng: Rng, ctx: GenContext): ItemOf<'classification'> {
  if (level === 'plus_loin' && rng.chance(0.6)) {
    for (let essai = 0; essai < 40; essai++) {
      const verbe = rng.pick([
        ...PREMIER_RADICAL.filter((v) => !['payer', 'préférer'].includes(v.inf)),
        lex('venir'),
      ]);
      const temps: Temps = 'present';
      const formesP = PERSONNES.map((p) => ({ p, f: formes(verbe.inf, temps, p)[0]! }));
      const rads = formesP.map(({ p, f }) => {
        const d = decomposer(verbe.inf, temps, p);
        if (d) return d.radical;
        // 3e groupe au présent : radical = forme sans la marque de personne
        const m = f.match(/^(.*?)(s|t|ons|ez|ent|d)$/);
        return m ? m[1]! : f;
      });
      const cats = [...new Set(rads)];
      if (cats.length < 2 || cats.length > 3) continue;
      const elements = formesP.map(({ p, f }, i) => ({
        label: avecPronom(p, f),
        category: cats.indexOf(rads[i]!),
      }));
      return make(ctx, 'classification', 'radicaux', {
        prompt: `Range les formes de « ${verbe.inf} » ${AU_TEMPS[temps]} selon leur radical.`,
        categories: cats.map((c) => `${c}-`),
        elements: rng.shuffle(elements),
        explication: `Le radical de « ${verbe.inf} » change selon la personne : ${elements.map((e) => e.label).join(', ')}.`,
        difficulty: 0.8,
      });
    }
  }
  const cats = ['présent (pas de marque)', 'imparfait (-ai- / -i-)', 'futur (-r-)'];
  const vus = new Set<string>();
  const elements: { label: string; category: number }[] = [];
  const nb = [0, 0, 0];
  for (let i = 0; i < 300 && elements.length < 6; i++) {
    const { t, avecPr } = tirageMarques(level === 'plus_loin' ? 'normal' : level, rng);
    const c = TEMPS_MARQUES.indexOf(t.temps);
    if (nb[c]! >= 2 || vus.has(avecPr) || avecPr.length > 32) continue;
    vus.add(avecPr);
    nb[c]!++;
    elements.push({ label: avecPr, category: c });
  }
  return make(ctx, 'classification', 'marques', {
    prompt: 'Range chaque verbe selon sa marque du temps.',
    categories: cats,
    elements: rng.shuffle(elements),
    explication: RAPPEL_MARQUES,
    difficulty: level === 'facile' ? 0.35 : 0.55,
  });
}

/** Forge : les formes sont colorées (radical, marque du temps, marque de la personne). */
function marquesTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const { t } = tirageMarques(level, rng);
  return itemTrou(ctx, rng, { ...t, voisins: TEMPS_MARQUES });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.CONJ.CONCORD — reconnaître le temps (et le mode)              */
/* ------------------------------------------------------------------ */

const TEMPS_CONCORD: Record<Level, Temps[]> = {
  facile: ['present', 'imparfait', 'futur'],
  normal: ['present', 'imparfait', 'futur', 'passe_simple', 'passe_compose', 'plus_que_parfait'],
  plus_loin: [
    'present',
    'imparfait',
    'futur',
    'passe_simple',
    'passe_compose',
    'plus_que_parfait',
    'conditionnel',
    'imperatif',
  ],
};
const NOM_COURT: Record<Temps, string> = { ...NOM_TEMPS, imperatif: 'impératif présent' };

function concordPlan(level: Level): Plan {
  return plan(TEMPS_CONCORD[level], level === 'facile' ? FACILE : NORMAL, TOUTES, {
    indicateur: 0,
    sujets: 'pronoms',
  });
}

/** Temps (parmi `candidats`) où la forme est juste pour cette personne : pour éviter les ambiguïtés (il finit). */
function tempsPossibles(inf: string, p: Personne, forme: string, candidats: Temps[]): Temps[] {
  return candidats.filter((tt) => formes(inf, tt, p).includes(forme));
}

/** Formes qui ressemblent à un autre verbe (il vit : voir ou vivre ?) : évitées quand l'infinitif n'est pas donné. */
const HOMOGRAPHES = /^(vis|vit|vîmes|vîtes|virent|dis|dit)$/;

function tirageConcord(level: Level, rng: Rng, sansInfinitif = false) {
  for (let i = 0; i < 100; i++) {
    const t = tirer(concordPlan(level), rng);
    const forme = formesDe(t)[0]!;
    if (sansInfinitif && t.temps === 'passe_simple' && HOMOGRAPHES.test(forme)) continue;
    if (t.temps !== 'imperatif' && tempsPossibles(t.verbe.inf, t.p, forme, TEMPS_CONCORD[level]).length > 1)
      continue;
    return { t, forme, phrase: phraseAvec(t, forme) };
  }
  throw new Error('Tirage impossible');
}

const indiceTemps = (t: Temps, inf: string): string => {
  switch (t) {
    case 'present':
      return 'l’action se passe maintenant';
    case 'imparfait':
      return 'on reconnaît les terminaisons -ais, -ait, -ions, -iez, -aient';
    case 'futur':
      return 'on reconnaît la marque -r- du futur (-rai, -ras, -ra…)';
    case 'passe_simple':
      return `c’est un temps simple du récit : ${regle(inf, 'passe_simple')
        .replace(/^Au passé simple, /, '')
        .replace(/\.$/, '')}`;
    case 'passe_compose':
      return 'auxiliaire au présent + participe passé';
    case 'plus_que_parfait':
      return 'auxiliaire à l’imparfait + participe passé';
    case 'conditionnel':
      return 'radical du futur + terminaisons de l’imparfait (-rais, -rait…), mode conditionnel';
    case 'imperatif':
      return 'il n’y a pas de sujet : c’est un ordre ou un conseil, mode impératif';
  }
};

function concordQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  if (level === 'plus_loin' && rng.chance(0.35)) return recitQcm(rng, ctx);
  const { t, forme, phrase } = tirageConcord(level, rng);
  const noms = TEMPS_CONCORD[level].map((x) => NOM_COURT[x]);
  return mcq(ctx, rng, 'temps', {
    question: `À quel temps est conjugué le verbe ${t.verbe.inf} ? « ${phrase} »`,
    good: NOM_COURT[t.temps],
    wrong: noms,
    explication: `« ${forme} » est ${AU_TEMPS[t.temps]} : ${indiceTemps(t.temps, t.verbe.inf)}.`,
    difficulty: clamp01(0.3 + TEMPS_CONCORD[level].indexOf(t.temps) * 0.08),
  });
}

function concordVraiFaux(level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> {
  const { t, forme, phrase } = tirageConcord(level, rng);
  const vrai = rng.chance(0.5);
  const autres = TEMPS_CONCORD[level].filter((x) => x !== t.temps);
  const dit = vrai ? t.temps : rng.pick(autres);
  return vraiFaux(ctx, 'temps', {
    statement: `« ${phrase} » : le verbe est ${AU_TEMPS[dit]}.`,
    answer: vrai,
    explication: `« ${forme} » est ${AU_TEMPS[t.temps]} : ${indiceTemps(t.temps, t.verbe.inf)}.`,
    difficulty: 0.45,
  });
}

function concordPaires(level: Level, rng: Rng, ctx: GenContext): ItemOf<'pairing'> {
  const pairs: { left: string; right: string }[] = [];
  const base = concordPlan(level);
  for (const temps of rng.shuffle(TEMPS_CONCORD[level]).slice(0, 5)) {
    for (let i = 0; i < 50; i++) {
      const t = tirer({ ...base, temps: [temps] }, rng);
      const f = formesDe(t)[0]!;
      if (temps !== 'imperatif' && tempsPossibles(t.verbe.inf, t.p, f, TEMPS_CONCORD[level]).length > 1)
        continue;
      if (temps === 'passe_simple' && HOMOGRAPHES.test(f)) continue;
      const left = temps === 'imperatif' ? `${f} !` : formeAvecPronom(t, f);
      if (left.length > 24 || pairs.some((x) => x.left === left)) continue;
      pairs.push({ left, right: NOM_COURT[temps] });
      break;
    }
  }
  return make(ctx, 'pairing', 'temps', {
    prompt: 'Associe chaque verbe conjugué à son temps.',
    pairs,
    relation: 'forme conjuguée → temps',
    explication:
      'Je regarde la terminaison (-ais, -rai, -a, -èrent…) et je cherche s’il y a un auxiliaire (temps composé).',
    difficulty: 0.6,
  });
}

function concordClassement(level: Level, rng: Rng, ctx: GenContext): ItemOf<'classification'> {
  const simplesComposes = level !== 'facile' && rng.chance(0.4);
  const cats = simplesComposes
    ? ['temps simple', 'temps composé']
    : TEMPS_CONCORD[level].slice(0, level === 'facile' ? 3 : 4).map((x) => NOM_COURT[x]);
  const tempsOk = simplesComposes
    ? TEMPS_CONCORD[level].filter((x) => x !== 'imperatif')
    : TEMPS_CONCORD[level].slice(0, cats.length);
  const vus = new Set<string>();
  const elements: { label: string; category: number }[] = [];
  for (let i = 0; i < 400 && elements.length < 7; i++) {
    const { t, forme } = tirageConcord(level, rng, true);
    if (!tempsOk.includes(t.temps)) continue;
    const label = formeAvecPronom(t, forme);
    if (vus.has(label) || label.length > 32) continue;
    const category = simplesComposes
      ? ['passe_compose', 'plus_que_parfait'].includes(t.temps)
        ? 1
        : 0
      : tempsOk.indexOf(t.temps);
    if (elements.filter((e) => e.category === category).length >= (simplesComposes ? 4 : 2)) continue;
    vus.add(label);
    elements.push({ label, category });
  }
  return make(ctx, 'classification', simplesComposes ? 'simples' : 'temps', {
    prompt: simplesComposes
      ? 'Range chaque verbe : temps simple ou temps composé ?'
      : 'Range chaque verbe selon son temps.',
    categories: cats,
    elements: rng.shuffle(elements),
    explication: simplesComposes
      ? 'Un temps composé s’écrit en deux mots : l’auxiliaire (avoir ou être) + le participe passé.'
      : 'Je regarde la terminaison du verbe : -ais/-ait à l’imparfait, -rai/-ra au futur, -a/-it/-ut au passé simple.',
    difficulty: level === 'facile' ? 0.35 : 0.6,
  });
}

/** Choisir le temps dans un récit (plus loin). */
const RECITS: { phrase: string; bonne: string; fausses: string[]; pourquoi: string }[] = [
  {
    phrase: 'Léa lisait tranquillement quand, soudain, le téléphone ___ (sonner).',
    bonne: 'sonna',
    fausses: ['sonnait', 'sonnera'],
    pourquoi: 'une action soudaine et courte dans un récit au passé se met au passé simple',
  },
  {
    phrase: 'Chaque matin, le vieux pêcheur ___ (partir) en mer avant l’aube.',
    bonne: 'partait',
    fausses: ['partit', 'partira'],
    pourquoi: 'une habitude dans le passé se met à l’imparfait',
  },
  {
    phrase: 'Il faisait nuit et la pluie ___ (tomber) sans arrêt.',
    bonne: 'tombait',
    fausses: ['tomba', 'tombera'],
    pourquoi: 'une description dans le passé se met à l’imparfait',
  },
  {
    phrase: 'Les enfants jouaient dans la clairière ; tout à coup, un renard ___ (sortir) du bois.',
    bonne: 'sortit',
    fausses: ['sortait', 'sortira'],
    pourquoi: 'une action soudaine (tout à coup) se met au passé simple',
  },
  {
    phrase: 'Quand nous sommes arrivés à la gare, le train ___ (partir) depuis longtemps.',
    bonne: 'était parti',
    fausses: ['partira', 'partirait'],
    pourquoi: 'une action passée qui a eu lieu avant une autre action passée se met au plus-que-parfait',
  },
  {
    phrase: 'Le prince ouvrit la porte, ___ (entrer) et salua la reine.',
    bonne: 'entra',
    fausses: ['entrait', 'entrera'],
    pourquoi: 'une suite d’actions dans un récit au passé se met au passé simple',
  },
  {
    phrase: 'Autrefois, les enfants ___ (aller) à l’école à pied.',
    bonne: 'allaient',
    fausses: ['allèrent', 'iront'],
    pourquoi: 'une habitude du passé (autrefois) se met à l’imparfait',
  },
  {
    phrase: 'Nora se promenait dans le parc quand elle ___ (faire) une découverte extraordinaire.',
    bonne: 'fit',
    fausses: ['fera', 'faisait'],
    pourquoi: 'l’action qui surgit pendant une autre action se met au passé simple',
  },
  {
    phrase: 'Tom était fatigué, car il ___ (marcher) toute la journée.',
    bonne: 'avait marché',
    fausses: ['marchera', 'marcherait'],
    pourquoi: 'l’action qui s’est passée avant (il était fatigué à cause d’elle) se met au plus-que-parfait',
  },
];

function recitQcm(rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const r = rng.pick(RECITS);
  return mcq(ctx, rng, 'recit', {
    question: `Quelle forme convient dans ce récit ? « ${r.phrase} »`,
    good: r.bonne,
    wrong: r.fausses,
    explication: `On écrit « ${r.bonne} » : ${r.pourquoi}.`,
    difficulty: 0.8,
  });
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

const condGens = gensConjugaison(CONDITIONNEL);
const impGens = gensConjugaison(IMPERATIF);

export const CONJ_CM2: Record<string, LessonContent> = {
  'CM2.FR.CONJ.PRESENT': { gens: gensConjugaison(PRESENT) },
  'CM2.FR.CONJ.IMPARFAIT': { gens: gensConjugaison(IMPARFAIT) },
  'CM2.FR.CONJ.FUTUR': { gens: gensConjugaison(FUTUR) },
  'CM2.FR.CONJ.PASSE_SIMPLE': { gens: gensConjugaison(PASSE_SIMPLE) },
  'CM2.FR.CONJ.PC': { gens: gensConjugaison(PC) },
  'CM2.FR.CONJ.PQP': { gens: gensConjugaison(PQP) },
  'CM2.FR.CONJ.CONDITIONNEL': {
    gens: {
      ...condGens,
      fill_blank: (level, rng, ctx) =>
        level === 'plus_loin' && rng.chance(0.6)
          ? condTrouPlusLoin(rng, ctx)
          : condGens.fill_blank(level, rng, ctx),
      mcq: (level, rng, ctx) =>
        level === 'plus_loin' && rng.chance(0.5) ? condQcmPlusLoin(rng, ctx) : condGens.mcq(level, rng, ctx),
    },
  },
  'CM2.FR.CONJ.IMPERATIF': {
    gens: {
      ...impGens,
      fill_blank: (level, rng, ctx) =>
        level === 'plus_loin' && rng.chance(0.5)
          ? impTrouPlusLoin(rng, ctx)
          : impGens.fill_blank(level, rng, ctx),
    },
  },
  'CM2.FR.CONJ.MARQUES': {
    gens: {
      mcq: marquesQcm,
      true_false: marquesVraiFaux,
      classification: marquesClassement,
      fill_blank: marquesTrou,
    },
  },
  'CM2.FR.CONJ.CONCORD': {
    gens: {
      mcq: concordQcm,
      true_false: concordVraiFaux,
      pairing: concordPaires,
      classification: concordClassement,
    },
  },
};
