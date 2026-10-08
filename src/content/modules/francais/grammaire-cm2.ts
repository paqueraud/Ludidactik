/**
 * CM2 — Grammaire. BO n°16 du 17/04/2025 (CM2) : types et formes de phrases sur des corpus plus complexes ;
 * sujet inversé (cas simples) ; groupe sujet, groupe verbal, groupe circonstanciel ; attribut du sujet /
 * complément d'objet ; COD / COI ; CC de temps, de lieu, de cause ; nature et fonction ; prépositions,
 * conjonctions de subordination, pronoms personnels sujets et compléments ; expansions du nom, complément
 * du nom, épithète / attribut ; phrase simple / complexe (repérage des verbes conjugués).
 * Les phrases à analyser suivent la convention du Labo des fonctions (`meta.phrase`, `meta.remplacements`).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { aucun, classer, diff, g, ordre, paires, parNiv, qcm, tirer, trou, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Banque de phrases analysées                                         */
/* ------------------------------------------------------------------ */

type Fonction = 'S' | 'COD' | 'COI' | 'ATT' | 'CCT' | 'CCL' | 'CCC' | 'CCM';
type Nature = 'GN' | 'GNP' | 'pronom' | 'nom propre' | 'adjectif' | 'adverbe' | 'proposition' | 'infinitif';
/** Groupe : [texte, fonction, nature]. */
type Groupe = [string, Fonction, Nature];
interface PhraseAnalysee {
  p: string;
  v: string;
  g: Groupe[];
  /** Phrases obtenues en remplaçant un groupe par un pronom (Labo : « remplacer »). */
  r?: Record<string, string>;
  /** Sujet placé après le verbe. */
  inv?: boolean;
  /** Niveau minimal. */
  n?: 'n' | 'p';
}

export const NOMS_FONCTIONS: Record<Fonction, string> = {
  S: 'sujet',
  COD: 'COD',
  COI: 'COI',
  ATT: 'attribut du sujet',
  CCT: 'CC de temps',
  CCL: 'CC de lieu',
  CCC: 'CC de cause',
  CCM: 'CC de manière',
};
const NOMS_NATURES: Record<Nature, string> = {
  GN: 'groupe nominal',
  GNP: 'groupe nominal prépositionnel',
  pronom: 'pronom personnel',
  'nom propre': 'nom propre',
  adjectif: 'adjectif',
  adverbe: 'adverbe',
  proposition: 'proposition',
  infinitif: 'verbe à l’infinitif',
};
const DEF_FONCTIONS: Record<Fonction, string> = {
  S: 'Le sujet s’encadre par « c’est… qui » : c’est de lui qu’on parle.',
  COD: 'Le COD complète le verbe sans préposition ; il ne se déplace pas et se remplace par le, la, les.',
  COI: 'Le COI complète le verbe avec une préposition (à, de) ; il se remplace par lui, leur ou en.',
  ATT: 'L’attribut suit un verbe d’état (être, sembler, devenir, paraître, rester) et dit comment est le sujet.',
  CCT: 'Le CC de temps répond à « quand ? » ; on peut le déplacer ou le supprimer.',
  CCL: 'Le CC de lieu répond à « où ? » ; on peut le déplacer ou le supprimer.',
  CCC: 'Le CC de cause répond à « pourquoi ? » ; on peut le déplacer ou le supprimer.',
  CCM: 'Le CC de manière répond à « comment ? » (notion de 6e).',
};

export const PHRASES_CM2: PhraseAnalysee[] = [
  {
    p: 'Ce matin, les enfants préparent un gâteau.',
    v: 'préparent',
    g: [
      ['Ce matin', 'CCT', 'GN'],
      ['les enfants', 'S', 'GN'],
      ['un gâteau', 'COD', 'GN'],
    ],
    r: {
      'les enfants': 'Ce matin, ils préparent un gâteau.',
      'un gâteau': 'Ce matin, les enfants le préparent.',
    },
  },
  {
    p: 'Malo obéit à sa grand-mère.',
    v: 'obéit',
    g: [
      ['Malo', 'S', 'nom propre'],
      ['à sa grand-mère', 'COI', 'GNP'],
    ],
    r: { Malo: 'Il obéit à sa grand-mère.', 'à sa grand-mère': 'Malo lui obéit.' },
  },
  {
    p: 'Pendant les vacances, Yasmine écrit une lettre à sa correspondante.',
    v: 'écrit',
    g: [
      ['Pendant les vacances', 'CCT', 'GNP'],
      ['Yasmine', 'S', 'nom propre'],
      ['une lettre', 'COD', 'GN'],
      ['à sa correspondante', 'COI', 'GNP'],
    ],
    r: {
      'à sa correspondante': 'Pendant les vacances, Yasmine lui écrit une lettre.',
      Yasmine: 'Pendant les vacances, elle écrit une lettre à sa correspondante.',
    },
  },
  {
    p: 'Les randonneurs semblent épuisés.',
    v: 'semblent',
    g: [
      ['Les randonneurs', 'S', 'GN'],
      ['épuisés', 'ATT', 'adjectif'],
    ],
    r: { 'Les randonneurs': 'Ils semblent épuisés.' },
  },
  {
    p: 'À cause de la neige, les enfants jouent dans le salon.',
    v: 'jouent',
    g: [
      ['À cause de la neige', 'CCC', 'GNP'],
      ['les enfants', 'S', 'GN'],
      ['dans le salon', 'CCL', 'GNP'],
    ],
    r: { 'dans le salon': 'À cause de la neige, les enfants jouent là.' },
  },
  {
    p: 'Le chat de la voisine dort sur le toit.',
    v: 'dort',
    g: [
      ['Le chat de la voisine', 'S', 'GN'],
      ['sur le toit', 'CCL', 'GNP'],
    ],
    r: {
      'Le chat de la voisine': 'Il dort sur le toit.',
      'sur le toit': 'Le chat de la voisine dort là-haut.',
    },
  },
  {
    p: 'Dans la forêt vivait un vieux bûcheron.',
    v: 'vivait',
    g: [
      ['Dans la forêt', 'CCL', 'GNP'],
      ['un vieux bûcheron', 'S', 'GN'],
    ],
    inv: true,
  },
  {
    p: 'Au loin brillaient les lumières du port.',
    v: 'brillaient',
    g: [
      ['Au loin', 'CCL', 'adverbe'],
      ['les lumières du port', 'S', 'GN'],
    ],
    inv: true,
  },
  {
    p: 'Sur la branche chantait un merle.',
    v: 'chantait',
    g: [
      ['Sur la branche', 'CCL', 'GNP'],
      ['un merle', 'S', 'GN'],
    ],
    inv: true,
  },
  {
    p: 'Demain arrivent nos cousins.',
    v: 'arrivent',
    g: [
      ['Demain', 'CCT', 'adverbe'],
      ['nos cousins', 'S', 'GN'],
    ],
    inv: true,
  },
  {
    p: 'Sous le pont coule une rivière tranquille.',
    v: 'coule',
    g: [
      ['Sous le pont', 'CCL', 'GNP'],
      ['une rivière tranquille', 'S', 'GN'],
    ],
    inv: true,
  },
  {
    p: 'Mon frère devient champion de judo.',
    v: 'devient',
    g: [
      ['Mon frère', 'S', 'GN'],
      ['champion de judo', 'ATT', 'GN'],
    ],
    r: { 'Mon frère': 'Il devient champion de judo.' },
  },
  {
    p: 'Mon frère regarde un champion de judo.',
    v: 'regarde',
    g: [
      ['Mon frère', 'S', 'GN'],
      ['un champion de judo', 'COD', 'GN'],
    ],
    r: { 'un champion de judo': 'Mon frère le regarde.' },
  },
  {
    p: 'Cette histoire paraît incroyable.',
    v: 'paraît',
    g: [
      ['Cette histoire', 'S', 'GN'],
      ['incroyable', 'ATT', 'adjectif'],
    ],
    r: { 'Cette histoire': 'Elle paraît incroyable.' },
  },
  {
    p: 'Lina raconte une histoire incroyable.',
    v: 'raconte',
    g: [
      ['Lina', 'S', 'nom propre'],
      ['une histoire incroyable', 'COD', 'GN'],
    ],
    r: { 'une histoire incroyable': 'Lina la raconte.' },
  },
  {
    p: 'Nathan parle de son voyage.',
    v: 'parle',
    g: [
      ['Nathan', 'S', 'nom propre'],
      ['de son voyage', 'COI', 'GNP'],
    ],
    r: { 'de son voyage': 'Nathan en parle.' },
  },
  {
    p: 'Les abeilles butinent les fleurs du jardin.',
    v: 'butinent',
    g: [
      ['Les abeilles', 'S', 'GN'],
      ['les fleurs du jardin', 'COD', 'GN'],
    ],
    r: {
      'les fleurs du jardin': 'Les abeilles les butinent.',
      'Les abeilles': 'Elles butinent les fleurs du jardin.',
    },
  },
  {
    p: 'Grâce à son entraînement, Inès a gagné la course.',
    v: 'a gagné',
    g: [
      ['Grâce à son entraînement', 'CCC', 'GNP'],
      ['Inès', 'S', 'nom propre'],
      ['la course', 'COD', 'GN'],
    ],
    r: { 'la course': 'Grâce à son entraînement, Inès l’a gagnée.' },
  },
  {
    p: 'Le soir, mon grand-père lit le journal dans son fauteuil.',
    v: 'lit',
    g: [
      ['Le soir', 'CCT', 'GN'],
      ['mon grand-père', 'S', 'GN'],
      ['le journal', 'COD', 'GN'],
      ['dans son fauteuil', 'CCL', 'GNP'],
    ],
    r: { 'le journal': 'Le soir, mon grand-père le lit dans son fauteuil.' },
  },
  {
    p: 'Le directeur reste calme.',
    v: 'reste',
    g: [
      ['Le directeur', 'S', 'GN'],
      ['calme', 'ATT', 'adjectif'],
    ],
    r: { 'Le directeur': 'Il reste calme.' },
  },
  {
    p: 'Les pompiers éteignent l’incendie rapidement.',
    v: 'éteignent',
    g: [
      ['Les pompiers', 'S', 'GN'],
      ['l’incendie', 'COD', 'GN'],
      ['rapidement', 'CCM', 'adverbe'],
    ],
    n: 'p',
  },
  {
    p: 'Comme il était malade, Hugo a dormi toute la journée.',
    v: 'a dormi',
    g: [
      ['Comme il était malade', 'CCC', 'proposition'],
      ['Hugo', 'S', 'nom propre'],
      ['toute la journée', 'CCT', 'GN'],
    ],
    n: 'p',
  },
  {
    p: 'Nous pensons à nos amis.',
    v: 'pensons',
    g: [
      ['Nous', 'S', 'pronom'],
      ['à nos amis', 'COI', 'GNP'],
    ],
    r: { 'à nos amis': 'Nous pensons à eux.' },
  },
  {
    p: 'Ma sœur ressemble à notre mère.',
    v: 'ressemble',
    g: [
      ['Ma sœur', 'S', 'GN'],
      ['à notre mère', 'COI', 'GNP'],
    ],
    r: { 'à notre mère': 'Ma sœur lui ressemble.' },
  },
  {
    p: 'Le jardinier taille les rosiers en automne.',
    v: 'taille',
    g: [
      ['Le jardinier', 'S', 'GN'],
      ['les rosiers', 'COD', 'GN'],
      ['en automne', 'CCT', 'GNP'],
    ],
    r: { 'les rosiers': 'Le jardinier les taille en automne.' },
  },
  {
    p: 'Ces fruits sont délicieux.',
    v: 'sont',
    g: [
      ['Ces fruits', 'S', 'GN'],
      ['délicieux', 'ATT', 'adjectif'],
    ],
    r: { 'Ces fruits': 'Ils sont délicieux.' },
  },
  {
    p: 'Le cuisinier goûte la sauce.',
    v: 'goûte',
    g: [
      ['Le cuisinier', 'S', 'GN'],
      ['la sauce', 'COD', 'GN'],
    ],
    r: { 'la sauce': 'Le cuisinier la goûte.' },
  },
  {
    p: 'La sauce semble trop salée.',
    v: 'semble',
    g: [
      ['La sauce', 'S', 'GN'],
      ['trop salée', 'ATT', 'adjectif'],
    ],
    r: { 'La sauce': 'Elle semble trop salée.' },
  },
  {
    p: 'Avant le spectacle, les musiciens accordent leurs instruments.',
    v: 'accordent',
    g: [
      ['Avant le spectacle', 'CCT', 'GNP'],
      ['les musiciens', 'S', 'GN'],
      ['leurs instruments', 'COD', 'GN'],
    ],
    r: { 'leurs instruments': 'Avant le spectacle, les musiciens les accordent.' },
  },
  {
    p: 'À la fin du repas, Rayan offre des chocolats à ses invités.',
    v: 'offre',
    g: [
      ['À la fin du repas', 'CCT', 'GNP'],
      ['Rayan', 'S', 'nom propre'],
      ['des chocolats', 'COD', 'GN'],
      ['à ses invités', 'COI', 'GNP'],
    ],
    r: { 'à ses invités': 'À la fin du repas, Rayan leur offre des chocolats.' },
  },
  {
    p: 'Mes parents travaillent à Lyon.',
    v: 'travaillent',
    g: [
      ['Mes parents', 'S', 'GN'],
      ['à Lyon', 'CCL', 'GNP'],
    ],
    r: { 'Mes parents': 'Ils travaillent à Lyon.', 'à Lyon': 'Mes parents y travaillent.' },
  },
  {
    p: 'En hiver, les ours dorment dans leur tanière.',
    v: 'dorment',
    g: [
      ['En hiver', 'CCT', 'GNP'],
      ['les ours', 'S', 'GN'],
      ['dans leur tanière', 'CCL', 'GNP'],
    ],
  },
  {
    p: 'Faute d’argent, le roi abandonna son projet.',
    v: 'abandonna',
    g: [
      ['Faute d’argent', 'CCC', 'GNP'],
      ['le roi', 'S', 'GN'],
      ['son projet', 'COD', 'GN'],
    ],
    r: { 'son projet': 'Faute d’argent, le roi l’abandonna.' },
  },
  {
    p: 'Nager est excellent pour la santé.',
    v: 'est',
    g: [
      ['Nager', 'S', 'infinitif'],
      ['excellent', 'ATT', 'adjectif'],
    ],
  },
  {
    p: 'Elles chantent avec joie.',
    v: 'chantent',
    g: [
      ['Elles', 'S', 'pronom'],
      ['avec joie', 'CCM', 'GNP'],
    ],
    n: 'p',
  },
  {
    p: 'Par curiosité, Zoé a ouvert la boîte.',
    v: 'a ouvert',
    g: [
      ['Par curiosité', 'CCC', 'GNP'],
      ['Zoé', 'S', 'nom propre'],
      ['la boîte', 'COD', 'GN'],
    ],
    n: 'p',
  },
];

const phrasesDispo = (level: Level) => PHRASES_CM2.filter((x) => level === 'plus_loin' || x.n !== 'p');

/** Item du Labo des fonctions : les groupes de la phrase, les fonctions proposées en catégories. */
function labo(
  ctx: GenContext,
  rng: Rng,
  level: Level,
  x: PhraseAnalysee,
  fonctions: Fonction[],
  prompt = 'Fais des expériences sur chaque groupe, puis trouve sa fonction.',
): Item {
  const groupes = x.g.filter(([, f]) => fonctions.includes(f));
  const cats = [...new Set([...fonctions])].slice(0, 6);
  const r = Object.fromEntries(Object.entries(x.r ?? {}).filter(([k]) => groupes.some(([t]) => t === k)));
  return classer(ctx, rng, `labo-${x.p}-${cats.join('|')}`, {
    prompt,
    categories: cats.map((f) => NOMS_FONCTIONS[f]),
    elements: groupes.map(([t, f]): [string, number] => [t, cats.indexOf(f)]),
    explication: [...new Set(groupes.map(([, f]) => f))].map((f) => DEF_FONCTIONS[f]).join(' '),
    difficulty: diff(level, groupes.length / 4),
    meta: { phrase: x.p, ...(Object.keys(r).length ? { remplacements: r } : {}) },
    garderOrdre: true,
  });
}

/** Choisit une phrase contenant au moins une des fonctions visées et construit l'item du Labo. */
function genLabo(
  visees: Fonction[],
  autour: (level: Level) => Fonction[],
  filtre: (x: PhraseAnalysee, level: Level) => boolean = () => true,
) {
  return (level: Level, rng: Rng, ctx: GenContext): Item => {
    const permises = [...new Set([...visees, ...autour(level)])];
    const dispo = phrasesDispo(level).filter(
      (x) =>
        x.g.some(([, f]) => visees.includes(f)) &&
        x.g.filter(([, f]) => permises.includes(f)).length >= 2 &&
        filtre(x, level),
    );
    const x = rng.pick(dispo);
    const cats = permises.filter((f) => x.g.some(([, k]) => k === f));
    // une fonction absente de la phrase en plus, pour que le choix ne soit pas automatique
    const absentes = permises.filter((f) => !cats.includes(f));
    if (absentes.length && cats.length < 6) cats.push(rng.pick(absentes));
    return labo(ctx, rng, level, x, cats);
  };
}

/** QCM « Quelle est la fonction de … ? ». */
function genFonctionQcm(
  visees: Fonction[],
  choix: (level: Level) => Fonction[],
  filtre: (x: PhraseAnalysee, level: Level) => boolean = () => true,
) {
  return (level: Level, rng: Rng, ctx: GenContext): Item => {
    const x = rng.pick(
      phrasesDispo(level).filter((y) => y.g.some(([, f]) => visees.includes(f)) && filtre(y, level)),
    );
    const [t, f] = rng.pick(x.g.filter(([, k]) => visees.includes(k)));
    return qcm(ctx, rng, `fct-${x.p}-${t}`, {
      question: `Dans la phrase ${g(x.p)}, quelle est la fonction de ${g(t)} ?`,
      good: NOMS_FONCTIONS[f],
      wrong: choix(level).map((k) => NOMS_FONCTIONS[k]),
      max: 4,
      explication: DEF_FONCTIONS[f],
      difficulty: diff(level, rng.next()),
    });
  };
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.TYPES                                                   */
/* ------------------------------------------------------------------ */

const INTERRO_CM2 = [
  'Pourquoi les feuilles changent-elles de couleur en automne',
  'As-tu déjà vu une étoile filante',
  'À quelle heure le train pour Marseille partira-t-il',
  'Qui a découvert le vaccin contre la rage',
  'Combien de temps faut-il pour traverser l’océan à la voile',
  'Est-ce que vous avez rendu vos livres à la bibliothèque',
];
const EXCLAM_CM2 = [
  'Quelle incroyable aventure nous avons vécue',
  'Comme ce paysage de montagne est magnifique',
  'Que tu as été courageux pendant la tempête',
  'Quel bonheur de retrouver tous ses amis',
];
const DECLA_CM2 = [
  'Les hirondelles reviennent au printemps après un long voyage',
  'Le musée de la ville ouvre ses portes le mercredi',
  'Nos voisins ont adopté un chiot très joueur',
  'La classe prépare un spectacle pour la fin de l’année',
];
const IMPER_CM2 = [
  'Range tes affaires avant de partir.',
  'Prenez vos cahiers et ouvrez-les à la première page.',
  'Ne touchez pas aux fils électriques.',
  'Écoutez attentivement la consigne.',
];
/** [phrase affirmative, négation attendue, forme du « ne… »]. */
const NEGATIONS: [string, string, string][] = [
  ['Lucas a mangé sa soupe.', 'Lucas n’a pas mangé sa soupe.', 'ne… pas'],
  ['Les élèves ont fini leur exposé.', 'Les élèves n’ont pas fini leur exposé.', 'ne… pas'],
  ['Mila est partie en vacances.', 'Mila n’est pas partie en vacances.', 'ne… pas'],
  ['Il reste du pain.', 'Il ne reste plus de pain.', 'ne… plus'],
  ['Quelqu’un a frappé à la porte.', 'Personne n’a frappé à la porte.', 'personne ne…'],
  ['J’ai vu quelque chose dans le grenier.', 'Je n’ai rien vu dans le grenier.', 'ne… rien'],
  ['Elle arrive toujours en retard.', 'Elle n’arrive jamais en retard.', 'ne… jamais'],
  ['Nous avons déjà visité ce château.', 'Nous n’avons jamais visité ce château.', 'ne… jamais'],
];
/** Les négations de temps composés : [affirmative, juste, erreurs]. */
function fautesNegation(aff: string, juste: string): string[] {
  const m = /^(.+?) n’(a|ont|est|avons|ai) (pas|jamais) (\S+) (.+)$/.exec(juste);
  if (!m) return [aff.replace(/\.$/, ' pas.'), juste.replace(/n’/, '')];
  const [, suj, aux, neg, pp, reste] = m;
  return [
    `${suj} n’${aux} ${pp} ${neg} ${reste}`,
    `${suj} ${aux} ${neg} ${pp} ${reste}`,
    `${suj} ne ${neg} ${aux} ${pp} ${reste}`,
  ];
}

type TypeCm2 = 'déclarative' | 'interrogative' | 'impérative';
const EXPL_TYPE_CM2: Record<TypeCm2, string> = {
  déclarative: 'La phrase déclarative donne une information ; elle se termine par un point.',
  interrogative: 'La phrase interrogative pose une question ; elle se termine par un point d’interrogation.',
  impérative:
    'La phrase impérative donne un ordre ou un conseil ; le verbe est à l’impératif, sans sujet exprimé.',
};

function genTypesCm2Qcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const d = diff(level, rng.next());
  const mode = parNiv(level, {
    facile: rng.pick(['feu', 'type']),
    normal: rng.pick(['feu', 'type', 'negation']),
    plus_loin: rng.pick(['negation', 'multiple', 'feu']),
  });
  if (mode === 'feu') {
    const k = rng.int(0, 2);
    const brute = [rng.pick(DECLA_CM2), rng.pick(INTERRO_CM2), rng.pick(EXCLAM_CM2)][k]!;
    const signe = (['.', '?', '!'] as const)[k];
    return qcm(ctx, rng, `feu-${brute}`, {
      question: `Quel signe de ponctuation faut-il à la fin de cette phrase ? ${g(brute)}`,
      good: signe,
      wrong: ['.', '?', '!'],
      fixedOrder: ['.', '?', '!'],
      spoken: signe === '.' ? `${brute}.` : `${brute} ${signe}`,
      explication: [
        'La phrase donne une information : elle se termine par un point.',
        'La phrase pose une question (inversion du sujet ou mot interrogatif) : point d’interrogation.',
        'La phrase exprime une émotion forte (quel, comme, que…) : point d’exclamation.',
      ][k]!,
      difficulty: d,
      meta: { phrase: brute },
    });
  }
  if (mode === 'type') {
    const t = rng.pick<TypeCm2>(['déclarative', 'interrogative', 'impérative']);
    const ph =
      t === 'déclarative'
        ? `${rng.pick(DECLA_CM2)}.`
        : t === 'interrogative'
          ? `${rng.pick(INTERRO_CM2)} ?`
          : rng.pick(IMPER_CM2);
    return qcm(ctx, rng, `type-${ph}`, {
      question: `De quel type est la phrase ${g(ph)} ?`,
      good: t,
      wrong: ['déclarative', 'interrogative', 'impérative'],
      fixedOrder: ['déclarative', 'interrogative', 'impérative'],
      explication: EXPL_TYPE_CM2[t],
      difficulty: d,
    });
  }
  if (mode === 'negation') {
    const [aff, juste, forme] = rng.pick(level === 'normal' ? NEGATIONS.slice(0, 3) : NEGATIONS);
    return qcm(ctx, rng, `neg-${aff}`, {
      question: `Mets cette phrase à la forme négative (${forme}) : ${g(aff)}`,
      good: juste,
      wrong: fautesNegation(aff, juste),
      max: 3,
      explication:
        'À un temps composé, la négation encadre l’auxiliaire : « n’a pas mangé ». Avec quelqu’un, quelque chose, toujours, déjà, on emploie personne, rien, jamais.',
      difficulty: d,
    });
  }
  const multiples: [string, string][] = [
    ['N’as-tu pas fini tes devoirs ?', 'interrogative et négative'],
    ['Ne cours pas dans l’escalier !', 'impérative, négative et exclamative'],
    ['Quel beau voyage nous avons fait !', 'déclarative et exclamative'],
    ['Pourquoi n’es-tu pas venu hier ?', 'interrogative et négative'],
    ['Je ne suis jamais allé à la mer.', 'déclarative et négative'],
  ];
  const [ph, bonne] = rng.pick(multiples);
  return qcm(ctx, rng, `mult-${ph}`, {
    question: `Quel est le type et la forme de la phrase ${g(ph)} ?`,
    good: bonne,
    wrong: multiples.map(([, b]) => b),
    explication:
      'Une phrase a un seul type (déclaratif, interrogatif ou impératif) et peut avoir plusieurs formes : affirmative ou négative, exclamative.',
    difficulty: d,
  });
}

function genTypesCm2Ordre(level: Level, rng: Rng, ctx: GenContext): Item {
  const k = rng.int(0, level === 'facile' ? 1 : 2);
  if (k === 2) {
    const [, juste] = rng.pick(NEGATIONS.filter(([, j]) => j.split(' ').length <= 9));
    const mots = juste.replace(/\.$/, '').split(' ');
    return ordre(ctx, `neg-${juste}`, {
      prompt: 'Remets les mots dans l’ordre pour écrire la phrase négative.',
      elements: [...mots, '.'],
      mode: 'phrase',
      explication:
        'Les deux mots de la négation encadrent le verbe conjugué (ou l’auxiliaire) : n’a pas mangé.',
      difficulty: diff(level, 0.8),
    });
  }
  const brute =
    k === 0 ? rng.pick(INTERRO_CM2.filter((x) => x.split(' ').length <= 9)) : rng.pick(EXCLAM_CM2);
  return ordre(ctx, `${k}-${brute}`, {
    prompt:
      k === 0
        ? 'Remets les mots dans l’ordre pour poser la question.'
        : 'Remets les mots dans l’ordre pour écrire la phrase exclamative.',
    elements: [...brute.split(' '), k === 0 ? '?' : '!'],
    mode: 'phrase',
    explication:
      k === 0
        ? 'Une question se termine par « ? » ; elle peut commencer par un mot interrogatif (qui, quand, pourquoi…) ou par « est-ce que », ou placer le sujet après le verbe.'
        : 'Une phrase exclamative commence souvent par quel, comme ou que et se termine par « ! ».',
    difficulty: diff(level, 0.5),
  });
}

function genTypesCm2Vf(level: Level, rng: Rng, ctx: GenContext): Item {
  const t = rng.pick<TypeCm2>(['déclarative', 'interrogative', 'impérative']);
  const ph =
    t === 'déclarative'
      ? `${rng.pick(DECLA_CM2)}.`
      : t === 'interrogative'
        ? `${rng.pick(INTERRO_CM2)} ?`
        : rng.pick(IMPER_CM2);
  const montre = rng.chance(0.5)
    ? t
    : rng.pick((['déclarative', 'interrogative', 'impérative'] as TypeCm2[]).filter((x) => x !== t));
  return vraiFaux(ctx, `vf-${ph}-${montre}`, {
    statement: `La phrase ${g(ph)} est une phrase ${montre}.`,
    answer: montre === t,
    explication: EXPL_TYPE_CM2[t],
    difficulty: diff(level, rng.next()),
  });
}

function genTypesCm2Paires(level: Level, rng: Rng, ctx: GenContext): Item {
  const courtes: Record<string, string[]> = {
    'déclarative affirmative': ['Le soleil se couche.', 'Nous partons demain.', 'Il neige sur la ville.'],
    interrogative: ['Viendras-tu ce soir ?', 'Où habite Léon ?', 'Est-ce fini ?'],
    impérative: ['Fermez la porte.', 'Viens vite ici.', 'Lisez ce texte.'],
    'déclarative négative': ['Je ne sais rien.', 'Il ne pleut plus.', 'Elle n’a pas peur.'],
  };
  if (level === 'facile') delete courtes['déclarative négative'];
  const pairs = Object.entries(courtes).map(([right, l]) => ({ left: rng.pick(l), right }));
  return paires(ctx, `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque phrase à ce qui la caractérise.',
    pairs,
    relation: 'phrase → type ou forme',
    explication:
      'Déclarative : elle informe. Interrogative : elle questionne. Impérative : elle ordonne. Forme négative : ne… pas, ne… plus, ne… rien.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.SUJET                                                   */
/* ------------------------------------------------------------------ */

/** Sujets variés : [sujet, nature, phrase]. */
const SUJETS: [string, Nature, string][] = [
  ['Le vent du nord', 'GN', 'Le vent du nord souffle fort.'],
  ['Les élèves de CM2', 'GN', 'Les élèves de CM2 partent en classe verte.'],
  ['Ils', 'pronom', 'Ils arrivent demain matin.'],
  ['Nous', 'pronom', 'Nous visitons un musée.'],
  ['Elle', 'pronom', 'Elle répare son vélo.'],
  ['Lou', 'nom propre', 'Lou adore la danse.'],
  ['Marseille', 'nom propre', 'Marseille accueille des milliers de touristes.'],
  ['Victor Hugo', 'nom propre', 'Victor Hugo a écrit Les Misérables.'],
  ['Nager', 'infinitif', 'Nager est excellent pour la santé.'],
  ['Lire', 'infinitif', 'Lire permet de voyager sans bouger.'],
  ['Courir', 'infinitif', 'Courir le matin me réveille.'],
  ['Mon petit frère', 'GN', 'Mon petit frère apprend à lire.'],
];
const NATURES_SUJET: Nature[] = ['GN', 'pronom', 'nom propre', 'infinitif'];

function genSujetClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  // Facile : le Labo aussi, avec des phrases où le sujet est devant le verbe
  if (rng.chance(level === 'facile' ? 0.4 : 0.6))
    return genLabo(
      ['S'],
      (lv) => (lv === 'plus_loin' ? ['S', 'COD', 'CCL', 'CCT'] : ['S', 'CCL', 'CCT']),
      (x, lv) => (lv === 'facile' ? !x.inv : true),
    )(level, rng, ctx);
  const natures = level === 'facile' ? NATURES_SUJET.slice(0, 3) : NATURES_SUJET;
  const choisis = natures.flatMap((n) =>
    tirer(
      rng,
      SUJETS.filter(([, k]) => k === n),
      2,
    ),
  );
  return classer(ctx, rng, `natures-${choisis.map(([s]) => s).join('|')}`, {
    prompt: 'Ces mots sont tous des sujets. Range-les selon leur nature.',
    categories: natures.map((n) => NOMS_NATURES[n]),
    elements: choisis.map(([s, n]): [string, number] => [s, natures.indexOf(n)]),
    explication:
      'Le sujet peut être un groupe nominal (le vent du nord), un pronom (ils), un nom propre (Lou) ou un verbe à l’infinitif (nager).',
    difficulty: diff(level, rng.next()),
    meta: { contextes: Object.fromEntries(choisis.map(([s, , p]) => [s, p])) },
  });
}

function genSujetQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const inv = level !== 'facile' && rng.chance(0.7);
  const x = rng.pick(phrasesDispo(level).filter((y) => !!y.inv === inv));
  const [suj] = x.g.find(([, f]) => f === 'S')!;
  const autres = x.g.filter(([, f]) => f !== 'S').map(([t]) => t);
  return qcm(ctx, rng, `sujet-${x.p}`, {
    question: `Quel est le sujet du verbe ${g(x.v)} dans ${g(x.p)} ?`,
    good: suj,
    wrong: [...autres, x.v, ...(inv ? [] : [suj.split(' ').slice(-1)[0]!])],
    explication: inv
      ? `Le sujet est placé après le verbe : c’est ${g(suj)}. On le trouve en posant la question « Qui est-ce qui… ? » devant le verbe ${g(x.v)}.`
      : `On pose la question « Qui est-ce qui… ? » devant le verbe ${g(x.v)} : c’est ${g(suj)}.`,
    difficulty: diff(level, inv ? 0.7 : 0.3),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.GROUPES                                                 */
/* ------------------------------------------------------------------ */

/** Groupe verbal : verbe + compléments d'objet ou attribut, s'ils le suivent directement. */
function decoupeGroupes(x: PhraseAnalysee): [string, number][] | null {
  const debutV = x.p.indexOf(x.v);
  if (debutV < 0) return null;
  const objets = x.g.filter(([, f]) => ['COD', 'COI', 'ATT'].includes(f));
  let finV = debutV + x.v.length;
  for (const [t] of objets) {
    const i = x.p.indexOf(t, debutV);
    if (i < 0) return null;
    finV = Math.max(finV, i + t.length);
  }
  const gv = x.p.slice(debutV, finV);
  const ccs = x.g.filter(([, f]) => f.startsWith('CC'));
  // un complément circonstanciel ne doit pas être à l'intérieur du groupe verbal
  if (ccs.some(([t]) => gv.includes(t))) return null;
  const suj = x.g.find(([, f]) => f === 'S');
  if (!suj || gv.includes(suj[0])) return null;
  return [[suj[0], 0], [gv, 1], ...ccs.map(([t]): [string, number] => [t, 2])];
}

function genGroupesClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = phrasesDispo(level)
    .map((x) => [x, decoupeGroupes(x)] as const)
    .filter(
      ([x, d]) =>
        d &&
        (level === 'facile' ? d.length === 2 || !x.g.some(([, f]) => f.startsWith('CC')) : d.length >= 3),
    );
  const [x, els] = rng.pick(
    dispo.length
      ? dispo
      : phrasesDispo(level)
          .map((y) => [y, decoupeGroupes(y)] as const)
          .filter(([, d]) => d),
  );
  const cats =
    level === 'facile'
      ? ['groupe sujet', 'groupe verbal']
      : ['groupe sujet', 'groupe verbal', 'groupe circonstanciel'];
  const elements = els!.filter(([, c]) => c < cats.length);
  return classer(ctx, rng, `groupes-${x.p}`, {
    prompt: 'Trouve le groupe sujet, le groupe verbal et les groupes circonstanciels.',
    categories: cats,
    elements,
    explication:
      'Le groupe sujet dit de qui on parle ; le groupe verbal (le verbe et ses compléments) dit ce qu’on en dit ; le groupe circonstanciel se déplace et se supprime.',
    difficulty: diff(level, elements.length / 4),
    meta: { phrase: x.p },
    garderOrdre: true,
  });
}

function genGroupesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = phrasesDispo(level)
    .map((x) => [x, decoupeGroupes(x)] as const)
    .filter(([, d]) => d && (level === 'facile' || d.length >= 3));
  const [x, els] = rng.pick(dispo);
  const quoi = level === 'facile' ? rng.int(0, 1) : rng.int(0, 2);
  const cible = els!.filter(([, c]) => c === quoi);
  const bonne = cible.map(([t]) => t).join(' / ');
  const noms = ['le groupe sujet', 'le groupe verbal', 'un groupe circonstanciel'];
  return qcm(ctx, rng, `grp-${x.p}-${quoi}`, {
    question: `Dans la phrase ${g(x.p)}, quel est ${noms[quoi]} ?`,
    good: quoi === 2 ? cible[0]![0] : bonne,
    wrong: [...els!.filter(([, c]) => c !== quoi).map(([t]) => t), x.v],
    explication: [
      'Le groupe sujet s’encadre par « c’est… qui ».',
      'Le groupe verbal, c’est le verbe et ses compléments d’objet (ou son attribut) : on ne peut pas le déplacer.',
      'Le groupe circonstanciel peut être déplacé ou supprimé : la phrase reste correcte.',
    ][quoi]!,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.COD_COI                                                 */
/* ------------------------------------------------------------------ */

const AIDE_PRONOMS =
  'COD (sans préposition) → le, la, les ; COI avec « à » → lui, leur ; COI avec « de » → en. Le pronom se place devant le verbe.';

const PRONOMS_COMPL = ['le', 'la', 'les', 'lui', 'leur', 'en'];

/** Remplacements d'un COD ou d'un COI par un pronom placé juste devant le verbe. */
function casPronoms(level: Level) {
  return phrasesDispo(level).flatMap((x) =>
    Object.entries(x.r ?? {}).flatMap(([k, v]) => {
      const f = x.g.find(([t]) => t === k)?.[1];
      if (f !== 'COD' && f !== 'COI') return [];
      const mots = v.split(' ');
      const i = mots.findIndex((m, n) => PRONOMS_COMPL.includes(m) && mots[n + 1] === x.v.split(' ')[0]);
      return i < 0
        ? []
        : [{ x, k, f, pron: mots[i]!, trou: [...mots.slice(0, i), '___', ...mots.slice(i + 1)].join(' ') }];
    }),
  );
}

function genCodCoiTrou(level: Level, rng: Rng, ctx: GenContext): Item {
  const c = rng.pick(casPronoms(level).filter((y) => level !== 'facile' || y.f === 'COD'));
  return trou(ctx, rng, `pron-${c.x.p}-${c.k}`, {
    sentence: `${c.x.p} → ${c.trou}`,
    answer: c.pron,
    choices: level === 'facile' ? ['le', 'la', 'les'] : PRONOMS_COMPL,
    hint: AIDE_PRONOMS,
    explication: `${g(c.k)} est ${c.f === 'COD' ? 'un COD' : 'un COI'} : on le remplace par ${g(c.pron)}, placé devant le verbe.`,
    difficulty: diff(level, c.f === 'COD' ? 0.4 : 0.7),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.ATTRIBUT                                                */
/* ------------------------------------------------------------------ */

const VERBES_ETAT = ['être', 'sembler', 'paraître', 'devenir', 'rester', 'demeurer', 'avoir l’air'];
const AUTRES_VERBES = ['regarder', 'manger', 'porter', 'raconter', 'trouver', 'aimer', 'construire'];
/** Facile : formes conjuguées du verbe être face à des verbes d'action conjugués. */
const FORMES_ETRE = ['est', 'sont', 'était', 'sera', 'sommes', 'êtes'];
const FORMES_ACTION = ['mange', 'regarde', 'porte', 'raconte', 'trouvent', 'aiment', 'construit'];

function genAttributClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (rng.chance(level === 'facile' ? 0.7 : 0.65)) {
    const filtre = (x: PhraseAnalysee, lv: Level) =>
      lv === 'facile' ? x.g.some(([, f]) => f === 'ATT') && /\b(est|sont)\b/.test(x.v) : true;
    return genLabo(['ATT', 'COD'], () => ['S', 'COD', 'ATT'], filtre)(level, rng, ctx);
  }
  if (level === 'facile') {
    // Facile : le verbe être (verbe d'état) face à des verbes d'action
    const els: [string, number][] = [
      ...tirer(rng, FORMES_ETRE, 4).map((v): [string, number] => [v, 0]),
      ...tirer(rng, FORMES_ACTION, 4).map((v): [string, number] => [v, 1]),
    ];
    return classer(ctx, rng, 'etre-ou-action', {
      prompt: 'Range chaque verbe : est-ce le verbe être (verbe d’état) ou un autre verbe ?',
      categories: ['verbe être', 'autre verbe'],
      elements: els,
      explication:
        'Le verbe être relie le sujet à son attribut : « Le ciel est bleu ». Les autres verbes disent une action.',
      difficulty: diff(level, rng.next()),
    });
  }
  const els: [string, number][] = [
    ...tirer(rng, VERBES_ETAT, 4).map((v): [string, number] => [v, 0]),
    ...tirer(rng, AUTRES_VERBES, 4).map((v): [string, number] => [v, 1]),
  ];
  return classer(ctx, rng, 'verbes-etat', {
    prompt: 'Range chaque verbe : est-ce un verbe d’état ?',
    categories: ['verbe d’état', 'autre verbe'],
    elements: els,
    explication:
      'Les verbes d’état (être, sembler, paraître, devenir, rester…) relient le sujet à son attribut : on peut les remplacer par « être ».',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.CC                                                      */
/* ------------------------------------------------------------------ */

/** CC : [groupe, fonction, phrase de contexte]. */
const CC_BANQUE: [string, Fonction, string][] = [
  ['hier soir', 'CCT', 'Hier soir, nous avons regardé les étoiles.'],
  ['pendant la nuit', 'CCT', 'Il a neigé pendant la nuit.'],
  ['au Moyen Âge', 'CCT', 'Au Moyen Âge, les seigneurs vivaient dans des châteaux.'],
  ['chaque été', 'CCT', 'Chaque été, nous partons en Bretagne.'],
  ['sous le pont', 'CCL', 'Les canards nagent sous le pont.'],
  ['dans la cour', 'CCL', 'Les élèves jouent dans la cour.'],
  ['au sommet', 'CCL', 'Au sommet, la vue est magnifique.'],
  ['près de la mer', 'CCL', 'Mes grands-parents se promènent près de la mer.'],
  ['à cause de la pluie', 'CCC', 'À cause de la pluie, le pique-nique est annulé.'],
  ['grâce à ton aide', 'CCC', 'Grâce à ton aide, j’ai réussi.'],
  ['parce qu’il pleut', 'CCC', 'Nous restons à l’intérieur parce qu’il pleut.'],
  ['par gourmandise', 'CCC', 'Léo a mangé tous les bonbons par gourmandise.'],
  ['avec soin', 'CCM', 'Inès recopie sa poésie avec soin.'],
  ['lentement', 'CCM', 'La tortue avance lentement.'],
];
const QUESTIONS_CC: Record<string, string> = {
  CCT: 'Quand ?',
  CCL: 'Où ?',
  CCC: 'Pourquoi ?',
  CCM: 'Comment ?',
};

function ccDuNiveau(level: Level): Fonction[] {
  return parNiv<Fonction[]>(level, {
    facile: ['CCT', 'CCL'],
    normal: ['CCT', 'CCL', 'CCC'],
    plus_loin: ['CCT', 'CCL', 'CCC', 'CCM'],
  });
}

function genCcClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (rng.chance(0.5))
    return genLabo(
      ccDuNiveau(level),
      (lv) => ['S', 'COD', ...ccDuNiveau(lv)],
      (x, lv) => x.g.filter(([, f]) => f.startsWith('CC')).every(([, f]) => ccDuNiveau(lv).includes(f)),
    )(level, rng, ctx);
  const fcts = ccDuNiveau(level);
  const choisis = fcts.flatMap((f) =>
    tirer(
      rng,
      CC_BANQUE.filter(([, k]) => k === f),
      2,
    ),
  );
  return classer(ctx, rng, `cc-${choisis.map(([t]) => t).join('|')}`, {
    prompt: 'Range chaque complément circonstanciel : temps, lieu ou cause ?',
    categories: fcts.map((f) => NOMS_FONCTIONS[f]),
    elements: choisis.map(([t, f]): [string, number] => [t, fcts.indexOf(f)]),
    explication: fcts.map((f) => DEF_FONCTIONS[f]).join(' '),
    difficulty: diff(level, rng.next()),
    meta: { contextes: Object.fromEntries(choisis.map(([t, , p]) => [t, p])) },
  });
}

function genCcQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const fcts = ccDuNiveau(level);
  const [t, f, p] = rng.pick(CC_BANQUE.filter(([, k]) => fcts.includes(k)));
  if (rng.chance(0.5))
    return qcm(ctx, rng, `q-${t}`, {
      question: `Dans ${g(p)}, à quelle question répond le groupe ${g(t)} ?`,
      good: QUESTIONS_CC[f]!,
      wrong: fcts.map((k) => QUESTIONS_CC[k]!),
      fixedOrder: fcts.map((k) => QUESTIONS_CC[k]!),
      explication: DEF_FONCTIONS[f],
      difficulty: diff(level, rng.next()),
    });
  return qcm(ctx, rng, `f-${t}`, {
    question: `Dans ${g(p)}, quelle est la fonction de ${g(t)} ?`,
    good: NOMS_FONCTIONS[f],
    wrong: fcts.map((k) => NOMS_FONCTIONS[k]),
    fixedOrder: fcts.map((k) => NOMS_FONCTIONS[k]),
    explication: DEF_FONCTIONS[f],
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.NATURE_FONCTION                                         */
/* ------------------------------------------------------------------ */

const TERMES_NATURE = [
  'nom',
  'verbe',
  'adjectif',
  'déterminant',
  'pronom',
  'préposition',
  'adverbe',
  'groupe nominal',
];
const TERMES_FONCTION = [
  'sujet',
  'COD',
  'COI',
  'attribut du sujet',
  'complément circonstanciel',
  'épithète',
  'complément du nom',
];
const REGLE_NF =
  'La nature (ou classe) dit ce qu’est un mot, comme dans le dictionnaire (nom, verbe…) ; la fonction dit le rôle qu’il joue dans la phrase (sujet, COD…).';

function genNatureFonctionClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5))
    return genLabo(['S', 'COD', 'COI', 'ATT', 'CCT', 'CCL', 'CCC'], () => [
      'S',
      'COD',
      'COI',
      'ATT',
      'CCT',
      'CCL',
    ])(level, rng, ctx);
  const n = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
  return classer(ctx, rng, 'nature-fonction', {
    prompt: 'Range chaque étiquette : est-ce une nature (classe) ou une fonction ?',
    categories: ['nature (classe)', 'fonction'],
    elements: [
      ...tirer(rng, TERMES_NATURE, n).map((t): [string, number] => [t, 0]),
      ...tirer(rng, TERMES_FONCTION, n).map((t): [string, number] => [t, 1]),
    ],
    explication: REGLE_NF,
    difficulty: diff(level, rng.next()),
  });
}

function genNatureFonctionQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const x = rng.pick(phrasesDispo(level).filter((y) => !y.g.some(([, , n]) => n === 'proposition')));
  const [t, f, nat] = rng.pick(x.g);
  const mode = parNiv(level, {
    facile: 'nature',
    normal: rng.pick(['nature', 'fonction']),
    plus_loin: 'les deux',
  });
  if (mode === 'les deux') {
    const bonne = `${NOMS_NATURES[nat]}, ${NOMS_FONCTIONS[f]}`;
    const autresF = (Object.keys(NOMS_FONCTIONS) as Fonction[]).filter((k) => k !== f && k !== 'CCM');
    const autresN = (Object.keys(NOMS_NATURES) as Nature[]).filter((k) => k !== nat && k !== 'proposition');
    return qcm(ctx, rng, `nf-${x.p}-${t}`, {
      question: `Dans ${g(x.p)}, donne la nature et la fonction de ${g(t)}.`,
      good: bonne,
      wrong: [
        `${NOMS_NATURES[nat]}, ${NOMS_FONCTIONS[rng.pick(autresF)]}`,
        `${NOMS_NATURES[rng.pick(autresN)]}, ${NOMS_FONCTIONS[f]}`,
        `${NOMS_NATURES[rng.pick(autresN)]}, ${NOMS_FONCTIONS[rng.pick(autresF)]}`,
      ],
      explication: `${g(t)} est un ${NOMS_NATURES[nat]} (sa nature) qui joue le rôle de ${NOMS_FONCTIONS[f]} (sa fonction). ${REGLE_NF}`,
      difficulty: diff(level, 0.8),
    });
  }
  if (mode === 'nature')
    return qcm(ctx, rng, `n-${x.p}-${t}`, {
      question: `Dans ${g(x.p)}, quelle est la nature de ${g(t)} ?`,
      good: NOMS_NATURES[nat],
      wrong: [NOMS_FONCTIONS[f], ...(Object.keys(NOMS_NATURES) as Nature[]).map((k) => NOMS_NATURES[k])],
      max: 4,
      explication: `${g(t)} est un ${NOMS_NATURES[nat]}. Attention : « ${NOMS_FONCTIONS[f]} » est sa fonction, pas sa nature.`,
      difficulty: diff(level, rng.next()),
    });
  return qcm(ctx, rng, `f-${x.p}-${t}`, {
    question: `Dans ${g(x.p)}, quelle est la fonction de ${g(t)} ?`,
    good: NOMS_FONCTIONS[f],
    wrong: [
      NOMS_NATURES[nat],
      ...(['S', 'COD', 'COI', 'ATT', 'CCT', 'CCL'] as Fonction[]).map((k) => NOMS_FONCTIONS[k]),
    ],
    max: 4,
    explication: `${DEF_FONCTIONS[f]} Attention : « ${NOMS_NATURES[nat]} » est sa nature, pas sa fonction.`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.CLASSES                                                 */
/* ------------------------------------------------------------------ */

type ClasseCm2 = 'prep' | 'conj' | 'pron' | 'adv' | 'rel';
const NOMS_CL: Record<ClasseCm2, string> = {
  prep: 'préposition',
  conj: 'conjonction de subordination',
  pron: 'pronom personnel',
  adv: 'adverbe',
  rel: 'pronom relatif',
};
const DEF_CL: Record<ClasseCm2, string> = {
  prep: 'La préposition (à, de, dans, avec, pour…) introduit un groupe de mots : dans la boîte.',
  conj: 'La conjonction de subordination (quand, parce que, si, comme…) introduit une proposition qui a son propre verbe.',
  pron: 'Le pronom personnel désigne une personne ou remplace un groupe : il, nous, le, lui, leur…',
  adv: 'L’adverbe est invariable et précise le sens d’un verbe, d’un adjectif ou d’un autre adverbe.',
  rel: 'Le pronom relatif (qui, que, dont, où) reprend un nom et introduit une proposition relative.',
};
/** [mot, classe, phrase de contexte]. */
const MOTS_CM2: [string, ClasseCm2, string][] = [
  ['dans', 'prep', 'Le chat dort dans le panier.'],
  ['avec', 'prep', 'Je pars avec mon cousin.'],
  ['pour', 'prep', 'Ce cadeau est pour toi.'],
  ['sans', 'prep', 'Il sort sans parapluie.'],
  ['chez', 'prep', 'Nous dînons chez Mamie.'],
  ['pendant', 'prep', 'Il a dormi pendant le film.'],
  ['malgré', 'prep', 'Ils jouent dehors malgré le froid.'],
  ['vers', 'prep', 'Le bateau avance vers le port.'],
  ['quand', 'conj', 'Quand il pleut, je lis.'],
  ['lorsque', 'conj', 'Lorsque la cloche sonne, nous rentrons.'],
  ['parce que', 'conj', 'Je reste au lit parce que je suis malade.'],
  ['puisque', 'conj', 'Puisque tu as fini, tu peux jouer.'],
  ['si', 'conj', 'Si tu veux, nous irons au parc.'],
  ['comme', 'conj', 'Comme il faisait beau, nous sommes sortis.'],
  ['pendant que', 'conj', 'Je mets la table pendant que tu cuisines.'],
  ['nous', 'pron', 'Nous partons demain.'],
  ['ils', 'pron', 'Ils construisent une cabane.'],
  ['lui', 'pron', 'Je lui prête mon livre.'],
  ['leur', 'pron', 'La maîtresse leur explique la règle.'],
  ['les', 'pron', 'Ces bonbons, je les adore.'],
  ['me', 'pron', 'Ma sœur me raconte une blague.'],
  ['eux', 'pron', 'Je pense souvent à eux.'],
  ['souvent', 'adv', 'Elle chante souvent.'],
  ['très', 'adv', 'Ce gâteau est très bon.'],
  ['hier', 'adv', 'Hier, il a neigé.'],
  ['vite', 'adv', 'Le lièvre court vite.'],
  ['qui', 'rel', 'Le chien qui aboie est à Paul.'],
  ['dont', 'rel', 'Voici le livre dont je t’ai parlé.'],
  ['où', 'rel', 'La maison où j’habite est jaune.'],
];

function classesCm2(level: Level): ClasseCm2[] {
  return parNiv<ClasseCm2[]>(level, {
    facile: ['prep', 'pron'],
    normal: ['prep', 'conj', 'pron'],
    plus_loin: ['prep', 'conj', 'pron', 'adv', 'rel'],
  });
}

/** Pronoms personnels sujets / compléments. */
const PRONOMS_SC: [string, 0 | 1, string][] = [
  ['je', 0, 'Demain, je partirai tôt.'],
  ['tu', 0, 'Tu viens avec nous ?'],
  ['elle', 0, 'Elle chante juste.'],
  ['nous', 0, 'Nous rentrons ensemble.'],
  ['ils', 0, 'Ils jouent aux échecs.'],
  ['me', 1, 'Papa me regarde.'],
  ['te', 1, 'Je te prête ma gomme.'],
  ['lui', 1, 'Je lui ai écrit.'],
  ['leur', 1, 'Nous leur avons répondu.'],
  ['la', 1, 'Cette chanson, je la connais.'],
  ['les', 1, 'Mes clés ? Je les ai trouvées.'],
];

function genClassesCm2Classer(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level !== 'facile' && rng.chance(0.35)) {
    const choisis = [0, 1].flatMap((k) =>
      tirer(
        rng,
        PRONOMS_SC.filter(([, c]) => c === k),
        3,
      ),
    );
    return classer(ctx, rng, `sc-${choisis.map(([m]) => m).join('|')}`, {
      prompt: 'Range chaque pronom personnel : est-il sujet ou complément ?',
      categories: ['pronom personnel sujet', 'pronom personnel complément'],
      elements: choisis.map(([m, c]): [string, number] => [m, c]),
      explication:
        'Le pronom personnel change de forme selon sa fonction : je, tu, il sont sujets ; me, te, le, la, lui, leur sont compléments (nous et vous peuvent être l’un ou l’autre).',
      difficulty: diff(level, rng.next()),
      meta: { contextes: Object.fromEntries(choisis.map(([m, , p]) => [m, p])) },
    });
  }
  const cls = classesCm2(level);
  const choisis = cls.flatMap((c) =>
    tirer(
      rng,
      MOTS_CM2.filter(([, k]) => k === c),
      level === 'plus_loin' ? 2 : 3,
    ),
  );
  return classer(ctx, rng, `cl-${choisis.map(([m]) => m).join('|')}`, {
    prompt: 'Range chaque mot dans sa classe. Lis la phrase pour t’aider.',
    categories: cls.map((c) => NOMS_CL[c]),
    elements: choisis.map(([m, c]): [string, number] => [m, cls.indexOf(c)]),
    explication: cls.map((c) => DEF_CL[c]).join(' '),
    difficulty: diff(level, rng.next()),
    meta: { contextes: Object.fromEntries(choisis.map(([m, , p]) => [m, p])) },
  });
}

function genClassesCm2Qcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const cls = classesCm2(level);
  const [m, c, p] = rng.pick(MOTS_CM2.filter(([, k]) => cls.includes(k)));
  return qcm(ctx, rng, `cl-${m}-${p}`, {
    question: `Dans ${g(p)}, quelle est la classe de ${g(m)} ?`,
    good: NOMS_CL[c],
    wrong: [...cls.map((k) => NOMS_CL[k]), 'déterminant', 'adverbe'],
    max: 4,
    explication: DEF_CL[c],
    difficulty: diff(level, rng.next()),
  });
}

function genClassesCm2Paires(level: Level, rng: Rng, ctx: GenContext): Item {
  const cls =
    level === 'facile'
      ? (['prep', 'pron', 'adv'] as ClasseCm2[])
      : classesCm2(level).concat(level === 'normal' ? ['adv'] : []);
  const pairs = cls.map((c) => ({
    left: rng.pick(
      MOTS_CM2.filter(
        ([m, k]) => k === c && !['si', 'comme', 'quand', 'les', 'leur', 'où', 'qui'].includes(m),
      ),
    )[0],
    right: NOMS_CL[c],
  }));
  return paires(ctx, `p-${pairs.map((x) => x.left).join('|')}`, {
    prompt: 'Associe chaque mot à sa classe.',
    pairs,
    relation: 'mot → classe',
    explication: cls.map((c) => DEF_CL[c]).join(' '),
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.GN                                                      */
/* ------------------------------------------------------------------ */

type FctGn = 'EPI' | 'CDN' | 'ATT' | 'REL';
const NOMS_GN: Record<FctGn, string> = {
  EPI: 'épithète',
  CDN: 'complément du nom',
  ATT: 'attribut du sujet',
  // une fonction (et non une nature) : la relative complète son antécédent (audit BO du 08/10/2026)
  REL: 'complément de l’antécédent (relative)',
};
const DEF_GN: Record<FctGn, string> = {
  EPI: 'L’adjectif épithète est placé à côté du nom, dans le groupe nominal ; on peut le supprimer.',
  CDN: 'Le complément du nom est relié au nom par une préposition (de, à, en…) : une tasse en porcelaine.',
  ATT: 'L’attribut du sujet est séparé du nom par un verbe d’état (être, sembler…) ; on ne peut pas le supprimer.',
  REL: 'La proposition relative commence par qui, que, dont, où et complète le nom (notion de 6e).',
};
const PHRASES_GN: { p: string; g: [string, FctGn][]; n?: 'p' }[] = [
  {
    p: 'Le vieux chêne du jardin semble malade.',
    g: [
      ['vieux', 'EPI'],
      ['du jardin', 'CDN'],
      ['malade', 'ATT'],
    ],
  },
  {
    p: 'Une petite tasse en porcelaine est tombée.',
    g: [
      ['petite', 'EPI'],
      ['en porcelaine', 'CDN'],
    ],
  },
  {
    p: 'La maison de mes grands-parents est immense.',
    g: [
      ['de mes grands-parents', 'CDN'],
      ['immense', 'ATT'],
    ],
  },
  {
    p: 'Ce gâteau au chocolat paraît délicieux.',
    g: [
      ['au chocolat', 'CDN'],
      ['délicieux', 'ATT'],
    ],
  },
  {
    p: 'Le jeune chevalier devient célèbre.',
    g: [
      ['jeune', 'EPI'],
      ['célèbre', 'ATT'],
    ],
  },
  {
    p: 'Les élèves curieux posent des questions intéressantes.',
    g: [
      ['curieux', 'EPI'],
      ['intéressantes', 'EPI'],
    ],
  },
  {
    p: 'Le train à vapeur reste immobile.',
    g: [
      ['à vapeur', 'CDN'],
      ['immobile', 'ATT'],
    ],
  },
  {
    p: 'Ma sœur porte une robe rouge à fleurs.',
    g: [
      ['rouge', 'EPI'],
      ['à fleurs', 'CDN'],
    ],
  },
  {
    p: 'Le petit chien qui aboie appartient à notre voisin.',
    g: [
      ['petit', 'EPI'],
      ['qui aboie', 'REL'],
    ],
    n: 'p',
  },
  {
    p: 'Le livre que tu m’as prêté est passionnant.',
    g: [
      ['que tu m’as prêté', 'REL'],
      ['passionnant', 'ATT'],
    ],
    n: 'p',
  },
];
/** Expansions hors phrase (Chef d'orchestre) : [expansion, fonction, contexte]. */
const EXPANSIONS: [string, FctGn, string][] = [
  ['en bois', 'CDN', 'une table en bois'],
  ['de sport', 'CDN', 'un sac de sport'],
  ['à voile', 'CDN', 'un bateau à voile'],
  ['de mon père', 'CDN', 'la voiture de mon père'],
  ['sans fin', 'CDN', 'une histoire sans fin'],
  ['rouge', 'EPI', 'une pomme rouge'],
  ['immense', 'EPI', 'un immense château'],
  ['ancien', 'EPI', 'un meuble ancien'],
  ['joyeuse', 'EPI', 'une chanson joyeuse'],
  ['minuscule', 'EPI', 'un insecte minuscule'],
  ['qui miaule', 'REL', 'le chat qui miaule'],
  ['où je suis né', 'REL', 'la ville où je suis né'],
];

function genGnClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const fcts: FctGn[] = parNiv(level, {
    facile: ['EPI', 'CDN'],
    normal: ['EPI', 'CDN', 'ATT'],
    plus_loin: ['EPI', 'CDN', 'ATT', 'REL'],
  });
  const phrasesGn = PHRASES_GN.filter(
    (y) => (level === 'plus_loin' || y.n !== 'p') && y.g.every(([, f]) => fcts.includes(f)),
  );
  // Facile : le Labo aussi, avec des phrases à épithètes et compléments du nom seulement
  if (phrasesGn.length && rng.chance(level === 'facile' ? 0.4 : 0.55)) {
    const x = rng.pick(phrasesGn);
    const cats = fcts.filter((f) => f !== 'REL' || x.g.some(([, k]) => k === 'REL'));
    return classer(ctx, rng, `gn-${x.p}`, {
      prompt: 'Trouve la fonction de chaque expansion du nom (ou de l’attribut).',
      categories: cats.map((f) => NOMS_GN[f]),
      elements: x.g.map(([t, f]): [string, number] => [t, cats.indexOf(f)]),
      explication: [...new Set(x.g.map(([, f]) => f))].map((f) => DEF_GN[f]).join(' '),
      difficulty: diff(level, x.g.length / 3),
      meta: { phrase: x.p },
      garderOrdre: true,
    });
  }
  const f2: FctGn[] = fcts.filter((f) => f !== 'ATT');
  const choisis = f2.flatMap((f) =>
    tirer(
      rng,
      EXPANSIONS.filter(([, k]) => k === f),
      level === 'plus_loin' ? 2 : 3,
    ),
  );
  return classer(ctx, rng, `exp-${choisis.map(([t]) => t).join('|')}`, {
    prompt: 'Range chaque expansion du nom : adjectif épithète ou complément du nom ?',
    categories: f2.map((f) => NOMS_GN[f]),
    elements: choisis.map(([t, f]): [string, number] => [t, f2.indexOf(f)]),
    explication: f2.map((f) => DEF_GN[f]).join(' '),
    difficulty: diff(level, rng.next()),
    meta: { contextes: Object.fromEntries(choisis.map(([t, , c]) => [t, c])) },
  });
}

function genGnQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = PHRASES_GN.filter((y) => level === 'plus_loin' || y.n !== 'p');
  const x = rng.pick(dispo);
  const [t, f] = rng.pick(x.g.filter(([, k]) => level !== 'facile' || k !== 'ATT'));
  const fcts: FctGn[] = level === 'plus_loin' ? ['EPI', 'CDN', 'ATT', 'REL'] : ['EPI', 'CDN', 'ATT'];
  return qcm(ctx, rng, `gn-${x.p}-${t}`, {
    question: `Dans ${g(x.p)}, quelle est la fonction de ${g(t)} ?`,
    good: NOMS_GN[f],
    wrong: fcts.map((k) => NOMS_GN[k]),
    fixedOrder: fcts.map((k) => NOMS_GN[k]),
    explication: DEF_GN[f],
    difficulty: diff(level, rng.next()),
  });
}

const TROUS_GN: [string, string, string[]][] = [
  ['un sac ___', 'de sport', ['de sport', 'rapidement', 'nous partons']],
  ['une tasse ___', 'en porcelaine', ['en porcelaine', 'très', 'boire']],
  ['un moulin ___', 'à vent', ['à vent', 'souffle', 'lentement']],
  ['la cour ___', 'de récréation', ['de récréation', 'jouer', 'demain']],
  ['un pull ___', 'en laine', ['en laine', 'tricoter', 'chaudement']],
  ['une boîte ___', 'à chaussures', ['à chaussures', 'ranger', 'souvent']],
];

function genGnTrou(level: Level, rng: Rng, ctx: GenContext): Item {
  const [s, rep, choix] = rng.pick(TROUS_GN);
  return trou(ctx, rng, `cdn-${s}`, {
    sentence: `Complète avec un complément du nom : ${s}`,
    answer: rep,
    choices: level === 'facile' ? choix.slice(0, 2) : choix,
    hint: 'Le complément du nom commence par une préposition (de, à, en…) et précise le nom.',
    explication: `${g(s.replace('___', rep))} : ${g(rep)} est un complément du nom, relié au nom par une préposition.`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.GRAM.COMPLEXE                                                */
/* ------------------------------------------------------------------ */

/** [phrase, nombre de verbes conjugués, liaison (plus loin)]. */
const PHRASES_VERBES: [string, number, ('juxt' | 'coord' | 'sub')?][] = [
  ['Le chat dort.', 1],
  ['Je veux jouer dehors.', 1],
  ['Elle a mangé une pomme.', 1],
  ['Nous allons visiter le musée.', 1],
  ['Il pleut, je reste.', 2, 'juxt'],
  ['Il pleut mais je sors.', 2, 'coord'],
  ['Il pleut et je reste au chaud.', 2, 'coord'],
  ['Je reste parce qu’il pleut.', 2, 'sub'],
  ['Quand il neige, je fais de la luge.', 2, 'sub'],
  ['Léa chante et Tom danse.', 2, 'coord'],
  ['Le vent souffle, les volets claquent.', 2, 'juxt'],
  ['Si tu viens, nous jouerons.', 2, 'sub'],
  ['J’ouvre la porte, je regarde et je crie.', 3],
  ['Quand le soleil se lève, les oiseaux chantent et le coq crie.', 3],
];
const REGLE_COMPLEXE =
  'Une phrase simple a un seul verbe conjugué ; une phrase complexe en a plusieurs (une proposition par verbe conjugué). Un infinitif n’est pas conjugué, et « a mangé » compte pour un seul verbe.';

function genComplexeQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const [p, n] = rng.pick(PHRASES_VERBES);
  if (level === 'facile' || rng.chance(0.5))
    return qcm(ctx, rng, `compte-${p}`, {
      question: `Combien de verbes conjugués y a-t-il dans ${g(p)} ?`,
      good: String(n),
      wrong: ['1', '2', '3'],
      fixedOrder: ['1', '2', '3'],
      explication: REGLE_COMPLEXE,
      difficulty: diff(level, rng.next()),
    });
  if (level === 'plus_loin' && rng.chance(0.6)) {
    const [p2, , l] = rng.pick(PHRASES_VERBES.filter(([, , x]) => x));
    const noms = {
      juxt: 'juxtaposées (virgule)',
      coord: 'coordonnées (et, mais, donc…)',
      sub: 'reliées par une conjonction de subordination',
    };
    return qcm(ctx, rng, `liaison-${p2}`, {
      question: `Comment sont reliées les propositions de ${g(p2)} ?`,
      good: noms[l!],
      wrong: Object.values(noms),
      fixedOrder: Object.values(noms),
      explication:
        'Juxtaposées : séparées par une virgule ; coordonnées : reliées par et, mais, ou, donc, car… ; subordonnée : introduite par quand, parce que, si… (notion de 6e).',
      difficulty: diff(level, 0.8),
    });
  }
  return qcm(ctx, rng, `type-${p}`, {
    question: `La phrase ${g(p)} est-elle simple ou complexe ?`,
    good: n > 1 ? 'complexe' : 'simple',
    wrong: ['simple', 'complexe'],
    fixedOrder: ['simple', 'complexe'],
    explication: REGLE_COMPLEXE,
    difficulty: diff(level, rng.next()),
  });
}

function genComplexeClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const types = ['juxt', 'coord', 'sub'] as const;
    const choisis = types.flatMap((t) =>
      tirer(
        rng,
        PHRASES_VERBES.filter(([p, , x]) => x === t && p.length <= 32),
        2,
      ),
    );
    return classer(ctx, rng, `liaisons-${choisis.map(([p]) => p).join('|')}`, {
      prompt: 'Comment les propositions sont-elles reliées ?',
      categories: ['juxtaposées', 'coordonnées', 'subordonnée'],
      elements: choisis.map(([p, , x]): [string, number] => [p, types.indexOf(x!)]),
      explication:
        'Juxtaposées : une virgule ; coordonnées : et, mais, donc… ; subordonnée : quand, parce que, si… (notion de 6e).',
      difficulty: diff(level, 0.8),
    });
  }
  const courtes = PHRASES_VERBES.filter(([p]) => p.length <= 32);
  const choisis = [
    ...tirer(
      rng,
      courtes.filter(([, n]) => n === 1),
      3,
    ),
    ...tirer(
      rng,
      courtes.filter(([, n]) => n > 1),
      level === 'facile' ? 2 : 3,
    ),
  ];
  return classer(ctx, rng, `sc-${choisis.map(([p]) => p).join('|')}`, {
    prompt: 'Compte les verbes conjugués, puis range chaque phrase.',
    categories: ['phrase simple', 'phrase complexe'],
    elements: choisis.map(([p, n]): [string, number] => [p, n > 1 ? 1 : 0]),
    explication: REGLE_COMPLEXE,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

const fonctionsObjets = (level: Level): Fonction[] =>
  parNiv<Fonction[]>(level, {
    facile: ['S', 'COD', 'CCL'],
    normal: ['S', 'COD', 'COI', 'CCT'],
    plus_loin: ['S', 'COD', 'COI', 'CCL', 'CCT'],
  });

export const GRAMMAIRE_CM2: ContentModule = {
  'CM2.FR.GRAM.TYPES': {
    gens: {
      mcq: genTypesCm2Qcm,
      ordering: genTypesCm2Ordre,
      true_false: genTypesCm2Vf,
      pairing: genTypesCm2Paires,
    },
  },
  'CM2.FR.GRAM.SUJET': {
    gens: { classification: genSujetClasser, mcq: genSujetQcm },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.GROUPES': {
    gens: { classification: genGroupesClasser, mcq: genGroupesQcm },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.COD_COI': {
    gens: {
      classification: (level, rng, ctx) =>
        genLabo(level === 'facile' ? ['COD'] : ['COD', 'COI'], fonctionsObjets)(level, rng, ctx),
      mcq: (level, rng, ctx) =>
        genFonctionQcm(level === 'facile' ? ['COD', 'S'] : ['COD', 'COI'], fonctionsObjets)(level, rng, ctx),
      fill_blank: genCodCoiTrou,
    },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.ATTRIBUT': {
    gens: {
      classification: genAttributClasser,
      mcq: genFonctionQcm(
        ['ATT', 'COD'],
        () => ['S', 'COD', 'ATT', 'COI'],
        (x, lv) =>
          parNiv(lv, {
            facile: /^(est|sont)$/.test(x.v),
            normal: true,
            plus_loin: x.g.some(([, f]) => f === 'COD') || !/^(est|sont)$/.test(x.v),
          }),
      ),
    },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.CC': {
    gens: { classification: genCcClasser, mcq: genCcQcm },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.NATURE_FONCTION': {
    gens: { classification: genNatureFonctionClasser, mcq: genNatureFonctionQcm },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.CLASSES': {
    gens: { classification: genClassesCm2Classer, mcq: genClassesCm2Qcm, pairing: genClassesCm2Paires },
  },
  'CM2.FR.GRAM.GN': {
    gens: { classification: genGnClasser, mcq: genGnQcm, fill_blank: genGnTrou },
    pools: { pairing: aucun },
  },
  'CM2.FR.GRAM.COMPLEXE': {
    gens: { mcq: genComplexeQcm, classification: genComplexeClasser },
    pools: { pairing: aucun },
  },
};
