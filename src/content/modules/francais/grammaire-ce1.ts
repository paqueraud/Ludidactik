/**
 * CE1 — Grammaire : la phrase et ses groupes, types et formes de phrases, classes de mots,
 * substitution par un pronom. BO n°41 du 31/10/2024 : « groupe sujet (GS), verbe et compléments sans
 * distinguer ces derniers » ; manipulations (déplacement, suppression, ajout, substitution) ;
 * « La maitresse raconte une histoire aux enfants → Elle la raconte aux enfants → Elle leur raconte » ;
 * classes : déterminant, nom commun, nom propre, adjectif, verbe, pronom personnel sujet.
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { aucun, classer, diff, g, maj, ordre, paires, parNiv, qcm, tirer, trou, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Banque de phrases simples                                           */
/* ------------------------------------------------------------------ */

type Pron = 'il' | 'elle' | 'ils' | 'elles';
/** Complément : [texte, nature, pronom de remplacement]. cc = complément qui se déplace / se supprime. */
type Compl = [string, 'cod' | 'coi' | 'cc', string?];
export interface PhraseSimple {
  gs: string;
  v: string;
  c: Compl[];
  p: Pron;
}

export const PHRASES: PhraseSimple[] = [
  { gs: 'Le chat', v: 'dort', c: [['sur le canapé', 'cc']], p: 'il' },
  { gs: 'Ma petite sœur', v: 'dessine', c: [['un grand soleil', 'cod', 'le']], p: 'elle' },
  { gs: 'Les élèves', v: 'chantent', c: [['dans la cour', 'cc']], p: 'ils' },
  {
    gs: 'Nour',
    v: 'mange',
    c: [
      ['à la cantine', 'cc'],
      ['tous les jours', 'cc'],
    ],
    p: 'elle',
  },
  {
    gs: 'Le boulanger',
    v: 'prépare',
    c: [
      ['les croissants', 'cod', 'les'],
      ['chaque matin', 'cc'],
    ],
    p: 'il',
  },
  {
    gs: 'Un oiseau',
    v: 'construit',
    c: [
      ['son nid', 'cod', 'le'],
      ['dans le cerisier', 'cc'],
    ],
    p: 'il',
  },
  {
    gs: 'La maîtresse',
    v: 'raconte',
    c: [
      ['une histoire', 'cod', 'la'],
      ['aux enfants', 'coi', 'leur'],
    ],
    p: 'elle',
  },
  {
    gs: 'Mon grand-père',
    v: 'arrose',
    c: [
      ['les tomates', 'cod', 'les'],
      ['le soir', 'cc'],
    ],
    p: 'il',
  },
  { gs: 'Les canards', v: 'nagent', c: [['sur l’étang', 'cc']], p: 'ils' },
  {
    gs: 'Le facteur',
    v: 'donne',
    c: [
      ['une lettre', 'cod', 'la'],
      ['à Mamie', 'coi', 'lui'],
    ],
    p: 'il',
  },
  {
    gs: 'Lucie',
    v: 'promène',
    c: [
      ['son chien', 'cod', 'le'],
      ['au parc', 'cc'],
    ],
    p: 'elle',
  },
  { gs: 'Les feuilles', v: 'tombent', c: [['en automne', 'cc']], p: 'elles' },
  {
    gs: 'Mamadou',
    v: 'range',
    c: [
      ['ses crayons', 'cod', 'les'],
      ['dans sa trousse', 'cc'],
    ],
    p: 'il',
  },
  { gs: 'Les filles', v: 'regardent', c: [['les étoiles', 'cod', 'les']], p: 'elles' },
  { gs: 'Le petit lapin', v: 'grignote', c: [['une carotte', 'cod', 'la']], p: 'il' },
  {
    gs: 'Papa',
    v: 'prépare',
    c: [
      ['une tarte', 'cod', 'la'],
      ['pour le goûter', 'cc'],
    ],
    p: 'il',
  },
  { gs: 'Les pompiers', v: 'arrivent', c: [['très vite', 'cc']], p: 'ils' },
  {
    gs: 'Mon frère',
    v: 'donne',
    c: [
      ['un os', 'cod', 'le'],
      ['au chien', 'coi', 'lui'],
    ],
    p: 'il',
  },
  {
    gs: 'Les enfants',
    v: 'préparent',
    c: [
      ['une surprise', 'cod', 'la'],
      ['pour leur maman', 'cc'],
    ],
    p: 'ils',
  },
  {
    gs: 'Mes cousines',
    v: 'cherchent',
    c: [
      ['des coquillages', 'cod'],
      ['sur la plage', 'cc'],
    ],
    p: 'elles',
  },
  { gs: 'Le train', v: 'arrive', c: [['en gare', 'cc']], p: 'il' },
  { gs: 'La girafe', v: 'mange', c: [['les feuilles', 'cod', 'les']], p: 'elle' },
  {
    gs: 'Yanis',
    v: 'lance',
    c: [
      ['le ballon', 'cod', 'le'],
      ['à son frère', 'coi', 'lui'],
    ],
    p: 'il',
  },
  {
    gs: 'Ma tante',
    v: 'joue',
    c: [
      ['du violon', 'coi'],
      ['le dimanche', 'cc'],
    ],
    p: 'elle',
  },
];

const phraseDe = (p: PhraseSimple) => `${[p.gs, p.v, ...p.c.map(([t]) => t)].join(' ')}.`;
const mots = (s: string) => s.replace(/\.$/, '').split(' ');
/** « ne » + verbe, élidé devant une voyelle. */
const ne = (v: string) => (/^[aeiouyéèêh]/i.test(v) ? `n’${v}` : `ne ${v}`);
const bas = (s: string) => s[0]!.toLowerCase() + s.slice(1);
const minus = (s: string) =>
  /^(Le|La|Les|Un|Une|Mon|Ma|Mes|Ses|Son|Sa)\b/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s;

/** Item du Labo des fonctions (groupe sujet / verbe / complément), avec les remplacements par un pronom. */
function labo(ctx: GenContext, rng: Rng, level: Level, p: PhraseSimple, prompt: string): Item {
  const remplacements: Record<string, string> = {
    [p.gs]: `${maj(p.p)} ${p.v} ${p.c.map(([t]) => t).join(' ')}.`.replace(/ \./, '.'),
  };
  for (const [t, , pr] of p.c)
    if (pr) {
      const reste = p.c.filter(([x]) => x !== t).map(([x]) => x);
      remplacements[t] = `${[p.gs, pr, p.v, ...reste].join(' ')}.`;
    }
  return classer(ctx, rng, `labo-${p.gs}-${p.v}`, {
    prompt,
    categories: ['groupe sujet', 'verbe', 'complément'],
    elements: [[p.gs, 0], [p.v, 1], ...p.c.map(([t]): [string, number] => [t, 2])],
    explication:
      'Le groupe sujet dit de qui on parle (on peut l’encadrer par « c’est… qui ») ; le verbe dit ce qu’il fait ; les compléments apportent des précisions.',
    difficulty: diff(level, p.c.length / 2),
    meta: { phrase: phraseDe(p), remplacements },
    garderOrdre: true,
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.GRAM.PHRASE                                                  */
/* ------------------------------------------------------------------ */

function genPhraseOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const candidats = PHRASES.filter((p) => {
    const n = mots(phraseDe(p)).length;
    if (n > 9) return false;
    const unCc = p.c.filter(([, k]) => k === 'cc').length;
    return parNiv(level, {
      facile: n <= 5 && unCc <= 1,
      normal: n >= 5 && unCc <= 1,
      plus_loin: unCc >= 1,
    });
  });
  const p = rng.pick(candidats);
  if (level === 'plus_loin') {
    // un complément déplaçable placé en tête, suivi d'une virgule : l'ordre reste unique
    const cc = rng.pick(p.c.filter(([, k]) => k === 'cc'));
    const reste = p.c.filter((c) => c !== cc).map(([t]) => t);
    const elements = [`${maj(cc[0])},`, minus(p.gs), p.v, ...reste, '.'];
    return ordre(ctx, `deplace-${p.gs}-${cc[0]}`, {
      prompt: `Remets les groupes de mots dans l’ordre : la phrase commence par ${g(maj(cc[0]))}.`,
      elements,
      mode: 'phrase',
      explication: `Le groupe ${g(cc[0])} peut se déplacer en tête de phrase : on met alors une virgule après lui.`,
      difficulty: diff(level, 0.6),
    });
  }
  const m = mots(phraseDe(p));
  return ordre(ctx, `ordre-${p.gs}-${p.v}`, {
    prompt: 'Remets les mots dans l’ordre pour écrire une phrase.',
    elements: [...m, '.'],
    mode: 'phrase',
    explication: 'Une phrase commence par une majuscule, se termine par un point et a du sens.',
    difficulty: diff(level, m.length / 8),
  });
}

function genPhraseQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const p = rng.pick(PHRASES);
  const ph = phraseDe(p);
  const type = parNiv(level, {
    facile: rng.pick(['ecrite', 'compter']),
    normal: rng.pick(['sujet', 'verbe', 'deplacer', 'supprimer']),
    plus_loin: rng.pick(['deplacer', 'supprimer', 'sujet']),
  });
  const d = diff(level, rng.next());
  if (type === 'ecrite') {
    const sans = ph.slice(0, -1);
    return qcm(ctx, rng, `ecrite-${ph}`, {
      question: 'Quelle phrase est bien écrite ?',
      good: ph,
      wrong: [sans, bas(ph), bas(sans)],
      max: 4,
      explication: 'Une phrase commence par une majuscule et se termine par un point.',
      difficulty: d,
    });
  }
  if (type === 'compter') {
    const n = rng.int(2, 4);
    const texte = tirer(rng, PHRASES, n).map(phraseDe).join(' ');
    return qcm(ctx, rng, `compter-${texte}`, {
      question: `Combien y a-t-il de phrases dans ce texte ? ${g(texte)}`,
      good: String(n),
      wrong: ['1', '2', '3', '4', '5'],
      fixedOrder: ['1', '2', '3', '4', '5'],
      explication: 'Pour compter les phrases, je compte les majuscules du début et les points de la fin.',
      difficulty: d,
    });
  }
  if (type === 'sujet' || type === 'verbe') {
    const tete = p.gs.split(' ').slice(-1)[0]!;
    const wrong =
      type === 'sujet'
        ? [p.v, ...p.c.map(([t]) => t), tete !== p.gs ? tete : `${p.gs} ${p.v}`]
        : [p.gs, ...p.c.map(([t]) => t)];
    return qcm(ctx, rng, `${type}-${ph}`, {
      question:
        type === 'sujet'
          ? `Quel est le groupe sujet de la phrase ${g(ph)} ?`
          : `Quel est le verbe de la phrase ${g(ph)} ?`,
      good: type === 'sujet' ? p.gs : p.v,
      wrong,
      explication:
        type === 'sujet'
          ? `Le groupe sujet dit de qui on parle : c’est ${g(p.gs)} qui ${p.v}.`
          : `Le verbe change si on dit la phrase hier ou demain : ${g(p.v)} est le verbe.`,
      difficulty: d,
    });
  }
  const ccs = p.c.filter(([, k]) => k === 'cc');
  if (!ccs.length) return genPhraseQcm(level, rng, ctx);
  const cc = rng.pick(ccs)[0];
  const reste = p.c.filter(([t]) => t !== cc).map(([t]) => t);
  if (type === 'supprimer') {
    return qcm(ctx, rng, `suppr-${ph}-${cc}`, {
      question: `Quel groupe peut-on supprimer sans que la phrase devienne fausse ? ${g(ph)}`,
      good: cc,
      wrong: [p.gs, p.v],
      explication: `Sans ${g(cc)}, la phrase reste correcte : ${g(`${[p.gs, p.v, ...reste].join(' ')}.`)} On ne peut pas supprimer le groupe sujet ni le verbe.`,
      difficulty: d,
    });
  }
  const bonne = `${maj(cc)}, ${[minus(p.gs), p.v, ...reste].join(' ')}.`;
  return qcm(ctx, rng, `depl-${ph}-${cc}`, {
    question: `On déplace le groupe ${g(cc)} au début de la phrase ${g(ph)}. Quelle phrase obtient-on ?`,
    good: bonne,
    wrong: [
      `${maj(cc)} ${[minus(p.gs), p.v, ...reste].join(' ')}.`,
      `${[p.gs, cc, p.v, ...reste].join(' ')}.`,
      `${maj(cc)}, ${[p.v, minus(p.gs), ...reste].join(' ')}.`,
    ],
    max: 3,
    explication: `On peut déplacer ${g(cc)} en tête de phrase ; on met alors une virgule après ce groupe.`,
    difficulty: d,
  });
}

function genPhraseLabo(level: Level, rng: Rng, ctx: GenContext): Item {
  const p = rng.pick(
    PHRASES.filter((x) =>
      parNiv(level, { facile: x.c.length === 1, normal: true, plus_loin: x.c.length === 2 }),
    ),
  );
  return labo(ctx, rng, level, p, 'Trouve le groupe sujet, le verbe et les compléments.');
}

/* ------------------------------------------------------------------ */
/* CE1.FR.GRAM.TYPES                                                   */
/* ------------------------------------------------------------------ */

const INTERROGATIVES = [
  'Est-ce que tu viens jouer avec nous',
  'Où as-tu rangé ton cahier',
  'Pourquoi le ciel est-il bleu',
  'Quand partons-nous en vacances',
  'Qui a mangé la dernière part de gâteau',
  'Combien de billes as-tu',
  'Aimes-tu les épinards',
  'Est-ce qu’il pleut dehors',
  'Comment s’appelle ton chat',
];
const EXCLAMATIVES = [
  'Quel magnifique arc-en-ciel',
  'Comme ce gâteau est bon',
  'Que la mer est belle aujourd’hui',
  'Quelle belle surprise',
  'Comme tu as grandi',
  'Quel beau château de sable',
];
const IMPERATIVES = [
  'Ferme la porte, s’il te plaît.',
  'Range ta chambre avant le dîner.',
  'Lavez-vous les mains.',
  'Prends ton parapluie.',
  'Écoute bien la consigne.',
  'Ne cours pas dans le couloir.',
  'Mettez vos manteaux.',
];
const DECLARATIVES = PHRASES.map(phraseDe);

type TypePhrase = 'déclarative' | 'interrogative' | 'impérative';
const EXPL_TYPE: Record<TypePhrase, string> = {
  déclarative: 'Une phrase déclarative donne une information ; elle se termine par un point.',
  interrogative: 'Une phrase interrogative pose une question ; elle se termine par un point d’interrogation.',
  impérative: 'Une phrase impérative donne un ordre ou un conseil ; il n’y a pas de sujet devant le verbe.',
};

function phraseAuHasard(rng: Rng): [string, TypePhrase] {
  const t = rng.pick<TypePhrase>(['déclarative', 'interrogative', 'impérative']);
  if (t === 'déclarative') return [rng.pick(DECLARATIVES), t];
  if (t === 'interrogative') return [`${rng.pick(INTERROGATIVES)} ?`, t];
  return [rng.pick(IMPERATIVES), t];
}

/**
 * Phrases dont la négation reste simple : pas de complément avec « un, une, des, du » (qui deviendrait
 * « de » à la forme négative), un seul complément déplaçable (ordre unique), mots tous différents.
 */
const negationSimple = (x: PhraseSimple) =>
  x.c.every(([t]) => !/^(un|une|des|du) /.test(t)) &&
  x.c.filter(([, k]) => k === 'cc').length <= 1 &&
  new Set(mots(phraseDe(x))).size === mots(phraseDe(x)).length;

/** Négation : affirmatif → négatif (ne… pas, ne… plus, ne… jamais). */
function negative(p: PhraseSimple, mot: 'pas' | 'plus' | 'jamais'): string {
  return `${[p.gs, ne(p.v), mot, ...p.c.map(([t]) => t)].join(' ')}.`;
}

/** Inversion du sujet (pronom) : « Tu viens. » → « Viens-tu ? » ; « Il joue » → « Joue-t-il ? ». */
const INVERSIONS: [string, string, string][] = [
  ['Tu viens avec nous.', 'Viens-tu avec nous ?', 'Tu viens-tu avec nous ?'],
  ['Vous aimez la musique.', 'Aimez-vous la musique ?', 'Aimez vous la musique ?'],
  ['Il joue au football.', 'Joue-t-il au football ?', 'Joue-il au football ?'],
  ['Elle chante à la chorale.', 'Chante-t-elle à la chorale ?', 'Chante-elle à la chorale ?'],
  ['Nous partons demain.', 'Partons-nous demain ?', 'Nous partons-nous demain ?'],
  ['Tu as faim.', 'As-tu faim ?', 'Tu as-tu faim ?'],
];

function genTypesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const d = diff(level, rng.next());
  const mode = parNiv(level, {
    facile: rng.pick(['feu', 'feu', 'type']),
    normal: rng.pick(['feu', 'type', 'negation']),
    plus_loin: rng.pick(['feu', 'negation', 'inversion']),
  });
  if (mode === 'feu') {
    const k = rng.int(0, 2);
    const brute =
      k === 0
        ? rng.pick(DECLARATIVES).slice(0, -1)
        : k === 1
          ? rng.pick(INTERROGATIVES)
          : rng.pick(EXCLAMATIVES);
    const signe = (['.', '?', '!'] as const)[k];
    return qcm(ctx, rng, `feu-${brute}`, {
      question: `Quel signe de ponctuation faut-il à la fin de cette phrase ? ${g(brute)}`,
      good: signe,
      wrong: ['.', '?', '!'],
      fixedOrder: ['.', '?', '!'],
      spoken: signe === '.' ? `${brute}.` : `${brute} ${signe}`,
      explication: [
        'La phrase donne une information et la voix descend : on met un point.',
        'La phrase pose une question : on met un point d’interrogation.',
        'La phrase montre une émotion (surprise, joie) : on met un point d’exclamation.',
      ][k]!,
      difficulty: d,
      meta: { phrase: brute },
    });
  }
  if (mode === 'type') {
    const [ph, t] = phraseAuHasard(rng);
    return qcm(ctx, rng, `type-${ph}`, {
      question: `De quel type est la phrase ${g(ph)} ?`,
      good: t,
      wrong: ['déclarative', 'interrogative', 'impérative'],
      fixedOrder: ['déclarative', 'interrogative', 'impérative'],
      explication: EXPL_TYPE[t],
      difficulty: d,
    });
  }
  if (mode === 'negation') {
    const p = rng.pick(PHRASES.filter(negationSimple));
    const motNeg = level === 'plus_loin' ? rng.pick(['plus', 'jamais'] as const) : 'pas';
    const bonne = negative(p, motNeg);
    const sansNe = `${[p.gs, p.v, motNeg, ...p.c.map(([t]) => t)].join(' ')}.`;
    const malPlace = `${[p.gs, 'ne', motNeg, p.v, ...p.c.map(([t]) => t)].join(' ')}.`;
    const auBout = `${[p.gs, ne(p.v), ...p.c.map(([t]) => t), motNeg].join(' ')}.`;
    return qcm(ctx, rng, `neg-${phraseDe(p)}-${motNeg}`, {
      question: `Quelle est la forme négative (avec « ne… ${motNeg} ») de la phrase ${g(phraseDe(p))} ?`,
      good: bonne,
      wrong: [sansNe, malPlace, auBout],
      max: 3,
      explication: `À la forme négative, « ne » et « ${motNeg} » encadrent le verbe : ${bonne}`,
      difficulty: d,
    });
  }
  const [aff, bonne, faux] = rng.pick(INVERSIONS);
  return qcm(ctx, rng, `inv-${aff}`, {
    question: `Transforme en question en inversant le sujet : ${g(aff)}`,
    good: bonne,
    wrong: [faux, aff.replace(/\.$/, ' ?'), bonne.replace(' ?', '.')],
    explication:
      'Pour poser une question, on peut mettre le pronom sujet après le verbe, avec un trait d’union (et un « -t- » entre deux voyelles).',
    difficulty: d,
  });
}

function genTypesOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const k = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 2), plus_loin: rng.int(1, 3) });
  if (k === 0) {
    const brute = rng.pick(INTERROGATIVES);
    return ordre(ctx, `q-${brute}`, {
      prompt: 'Remets les mots dans l’ordre pour poser une question.',
      elements: [...brute.split(' '), '?'],
      mode: 'phrase',
      explication:
        'Une phrase interrogative pose une question ; elle se termine par un point d’interrogation.',
      difficulty: diff(level, 0.4),
    });
  }
  if (k === 1) {
    const brute = rng.pick(EXCLAMATIVES);
    return ordre(ctx, `e-${brute}`, {
      prompt: 'Remets les mots dans l’ordre pour faire une phrase exclamative.',
      elements: [...brute.split(' '), '!'],
      mode: 'phrase',
      explication: 'Une phrase exclamative exprime une émotion ; elle se termine par un point d’exclamation.',
      difficulty: diff(level, 0.5),
    });
  }
  const p = rng.pick(PHRASES.filter((x) => negationSimple(x) && mots(phraseDe(x)).length <= 7));
  const motNeg = k === 3 ? rng.pick(['plus', 'jamais'] as const) : 'pas';
  const neg = negative(p, motNeg).slice(0, -1);
  return ordre(ctx, `n-${neg}`, {
    prompt: `Remets les mots dans l’ordre pour écrire une phrase négative (avec « ne… ${motNeg} »).`,
    elements: [...neg.split(' '), '.'],
    mode: 'phrase',
    explication: `À la forme négative, « ne » et « ${motNeg} » encadrent le verbe.`,
    difficulty: diff(level, 0.7),
  });
}

function genTypesVf(level: Level, rng: Rng, ctx: GenContext): Item {
  const [ph, t] =
    level === 'facile' || rng.chance(0.6)
      ? phraseAuHasard(rng)
      : ([`${rng.pick(EXCLAMATIVES)} !`, 'exclamative'] as const);
  const vrai = rng.chance(0.5);
  const tous = ['déclarative', 'interrogative', 'impérative'];
  if (t === 'exclamative') {
    return vraiFaux(ctx, `vf-${ph}-${vrai}`, {
      statement: vrai
        ? `La phrase ${g(ph)} est à la forme exclamative.`
        : `La phrase ${g(ph)} est une phrase interrogative.`,
      answer: vrai,
      explication: 'Une phrase exclamative exprime une émotion ; elle se termine par un point d’exclamation.',
      difficulty: diff(level, 0.6),
    });
  }
  const montre = vrai ? t : rng.pick(tous.filter((x) => x !== t));
  return vraiFaux(ctx, `vf-${ph}-${montre}`, {
    statement: `La phrase ${g(ph)} est une phrase ${montre}.`,
    answer: montre === t,
    explication: EXPL_TYPE[t],
    difficulty: diff(level, rng.next()),
  });
}

/** Phrases courtes (Dobble : 24 caractères au plus). */
const COURTES: Record<TypePhrase, string[]> = {
  déclarative: [
    'Il pleut.',
    'Le chat dort.',
    'Léa lit un livre.',
    'J’ai faim.',
    'Le bus arrive.',
    'Nous jouons.',
  ],
  interrogative: ['Où vas-tu ?', 'As-tu faim ?', 'Qui est là ?', 'Quel âge as-tu ?', 'Viens-tu jouer ?'],
  impérative: ['Ferme la porte.', 'Viens ici.', 'Range ta chambre.', 'Lave-toi les mains.', 'Écoute bien.'],
};

function genTypesPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const pairs = (['déclarative', 'interrogative', 'impérative'] as const).map((t) => ({
    left: rng.pick(COURTES[t]),
    right: t,
  }));
  return paires(ctx, `types-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque phrase à son type.',
    pairs,
    relation: 'phrase → type',
    explication:
      'Déclarative : elle donne une information. Interrogative : elle pose une question. Impérative : elle donne un ordre.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.GRAM.CLASSES                                                 */
/* ------------------------------------------------------------------ */

type Classe = 'D' | 'N' | 'P' | 'A' | 'V' | 'R' | 'B' | 'E';
const NOMS_CLASSES: Record<Classe, string> = {
  D: 'déterminant',
  N: 'nom commun',
  P: 'nom propre',
  A: 'adjectif',
  V: 'verbe',
  R: 'pronom personnel',
  B: 'adverbe',
  E: 'préposition',
};
const DEF_CLASSES: Record<Classe, string> = {
  D: 'Le déterminant est un petit mot placé devant le nom : le, une, mon, des…',
  N: 'Le nom commun désigne une personne, un animal, une chose ou une idée ; on peut mettre un déterminant devant.',
  P: 'Le nom propre commence par une majuscule : il désigne une personne ou un lieu précis.',
  A: 'L’adjectif précise le nom : il dit comment il est.',
  V: 'Le verbe change quand on dit la phrase hier ou demain.',
  R: 'Le pronom personnel (je, tu, il, elle, on, nous, vous, ils, elles) désigne une personne ou remplace un nom.',
  B: 'L’adverbe est un mot invariable qui précise un verbe ou un adjectif (très, bien, demain…).',
  E: 'La préposition est un mot invariable qui introduit un groupe (dans, sur, à, de…).',
};

/** Phrases étiquetées mot/classe ; « x » = mot non étudié (conjonction…). */
export const PHRASES_CLASSES = [
  'Le/D petit/A chat/N noir/A dort/V sur/E le/D canapé/N',
  'Léa/P dessine/V une/D maison/N bleue/A',
  'Ils/R jouent/V dans/E le/D grand/A jardin/N',
  'Mon/D frère/N mange/V une/D pomme/N rouge/A',
  'Nous/R partons/V à/E Marseille/P demain/B',
  'La/D vieille/A dame/N promène/V son/D chien/N',
  'Tu/R portes/V un/D joli/A pull/N',
  'Paul/P et/x Inès/P regardent/V les/D étoiles/N',
  'Elle/R chante/V très/B bien/B',
  'Le/D boulanger/N prépare/V des/D croissants/N chauds/A',
  'Vous/R aimez/V la/D musique/N',
  'Les/D enfants/N traversent/V la/D rue/N calmement/B',
  'Je/R range/V mes/D jouets/N',
  'Une/D grosse/A araignée/N grimpe/V sur/E le/D mur/N',
  'Zoé/P adore/V les/D fraises/N',
  'On/R mange/V une/D délicieuse/A tarte/N',
  'Il/R porte/V un/D sac/N lourd/A',
  'La/D petite/A porte/N grince/V',
  'Amir/P lave/V sa/D voiture/N rouge/A',
  'Elles/R écoutent/V une/D belle/A chanson/N',
].map((s) =>
  s.split(' ').map((w) => {
    const [mot, c] = w.split('/');
    return [mot!, c as Classe | 'x'] as const;
  }),
);
const texteClasses = (ph: readonly (readonly [string, Classe | 'x'])[]) => `${ph.map(([m]) => m).join(' ')}.`;

function genClassesClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const facile = level === 'facile';
  const permises: Classe[] = parNiv(level, {
    facile: ['N', 'P', 'V'],
    normal: ['D', 'N', 'P', 'A', 'V', 'R'],
    plus_loin: ['N', 'A', 'V', 'B', 'E', rng.pick<Classe>(['D', 'R'])],
  });
  // en facile, noms communs et noms propres vont dans la même boîte « nom »
  const cat = (c: Classe) => (facile && c === 'P' ? 'N' : c);
  const phrases = tirer(rng, PHRASES_CLASSES, parNiv(level, { facile: 2, normal: 2, plus_loin: 3 }));
  const vus = new Set<string>();
  const choisis: [string, Classe, string][] = [];
  for (const ph of phrases)
    for (const [mot, c] of ph) {
      if (c === 'x' || !permises.includes(c) || vus.has(mot.toLowerCase())) continue;
      vus.add(mot.toLowerCase());
      choisis.push([mot, cat(c), texteClasses(ph)]);
    }
  const max = parNiv(level, { facile: 6, normal: 10, plus_loin: 12 });
  const garde = tirer(rng, choisis, max);
  const cats = [...new Set(garde.map(([, c]) => c))].sort(
    (a, b) => permises.indexOf(a) - permises.indexOf(b),
  );
  if (cats.length < 2) return genClassesClasser(level, rng, ctx);
  const noms = cats.map((c) => (facile && c === 'N' ? 'nom' : NOMS_CLASSES[c]));
  return classer(ctx, rng, `classes-${garde.map(([m]) => m).join('-')}`, {
    prompt: 'Range chaque mot dans sa classe. Regarde la phrase si tu hésites.',
    categories: noms,
    elements: garde.map(([m, c]): [string, number] => [m, cats.indexOf(c)]),
    explication: facile
      ? 'Le nom désigne une personne, un animal ou une chose (Zoé, frère, pomme) ; le verbe change quand on dit la phrase hier ou demain.'
      : cats.map((c) => DEF_CLASSES[c]).join(' '),
    difficulty: diff(level, cats.length / 7),
    meta: { contextes: Object.fromEntries(garde.map(([m, , p]) => [m, p])) },
  });
}

function genClassesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const permises: Classe[] = parNiv(level, {
    facile: ['N', 'V'],
    normal: ['D', 'N', 'P', 'A', 'V', 'R'],
    plus_loin: ['D', 'N', 'A', 'V', 'R', 'B', 'E'],
  });
  const ph = rng.pick(PHRASES_CLASSES.filter((p) => p.some(([, c]) => c !== 'x' && permises.includes(c))));
  const compte = new Map<string, number>();
  for (const [m] of ph) compte.set(m.toLowerCase(), (compte.get(m.toLowerCase()) ?? 0) + 1);
  const [mot, c] = rng.pick(
    ph.filter(([m, k]) => k !== 'x' && permises.includes(k) && compte.get(m.toLowerCase()) === 1),
  ) as readonly [string, Classe];
  const choix = permises.map((k) => NOMS_CLASSES[k]);
  return qcm(ctx, rng, `classe-${texteClasses(ph)}-${mot}`, {
    question: `Dans la phrase ${g(texteClasses(ph))}, quelle est la classe du mot ${g(mot)} ?`,
    good: NOMS_CLASSES[c],
    wrong: choix,
    max: level === 'facile' ? 2 : 4,
    explication: DEF_CLASSES[c],
    difficulty: diff(level, rng.next()),
  });
}

/** Mots sans ambiguïté de classe, même hors phrase. */
const MOTS_SURS: Record<Classe, string[]> = {
  D: ['une', 'mon', 'ces', 'des', 'notre', 'chaque'],
  N: ['maison', 'école', 'fleur', 'cheval', 'gâteau', 'arbre'],
  P: ['Paris', 'Léa', 'Malik', 'Marseille', 'Lyon', 'Inès'],
  A: ['joli', 'grand', 'rouge', 'gentille', 'rapide', 'heureux'],
  V: ['dormons', 'chantent', 'courez', 'lisons', 'sautez', 'mangeons'],
  R: ['je', 'tu', 'nous', 'vous', 'ils', 'elles'],
  B: ['très', 'souvent', 'hier', 'bientôt', 'toujours', 'vite'],
  E: ['dans', 'sous', 'avec', 'pour', 'chez', 'vers'],
};

function genClassesPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const classes: Classe[] = parNiv(level, {
    facile: ['N', 'V', 'D'],
    normal: tirer(rng, ['D', 'N', 'P', 'A', 'V', 'R'] as Classe[], 4),
    plus_loin: tirer(rng, ['D', 'N', 'A', 'V', 'R', 'B', 'E'] as Classe[], 5),
  });
  const pairs = classes.map((c) => ({ left: rng.pick(MOTS_SURS[c]), right: NOMS_CLASSES[c] }));
  return paires(ctx, `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque mot à sa classe.',
    pairs,
    relation: 'mot → classe',
    explication: classes.map((c) => DEF_CLASSES[c]).join(' '),
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.GRAM.SUBST                                                   */
/* ------------------------------------------------------------------ */

const AIDE_SUJET =
  'Un seul (masculin) : il ; une seule (féminin) : elle ; plusieurs : ils, ou elles si ce ne sont que des noms féminins.';
const AIDE_COMPL =
  'Le pronom se place devant le verbe : « le, la, les » remplacent un groupe sans « à » ; « lui, leur » remplacent un groupe avec « à ».';

/** Groupes nominaux à remplacer par il / elle / ils / elles. */
const GN_PRONOMS: [string, Pron][] = [
  ['le chat', 'il'],
  ['ma petite sœur', 'elle'],
  ['les élèves', 'ils'],
  ['Nour', 'elle'],
  ['les feuilles', 'elles'],
  ['mes cousines', 'elles'],
  ['Mamadou', 'il'],
  ['la girafe', 'elle'],
  ['les pompiers', 'ils'],
  ['Lucie et Zoé', 'elles'],
  ['Tom et Léa', 'ils'],
  ['le soleil', 'il'],
  ['la lune', 'elle'],
  ['les fourmis', 'elles'],
  ['les nuages', 'ils'],
  ['mon grand-père', 'il'],
  ['la maîtresse', 'elle'],
  ['les canards', 'ils'],
  ['Inès et sa maman', 'elles'],
  ['Papa et Maman', 'ils'],
];

function genSubstTrou(level: Level, rng: Rng, ctx: GenContext): Item {
  const p = rng.pick(PHRASES);
  const ph = phraseDe(p);
  const objets = p.c.filter(([, , pr]) => pr);
  if (level === 'facile' || !objets.length || rng.chance(0.25)) {
    const suite = `${[p.v, ...p.c.map(([t]) => t)].join(' ')}.`;
    return trou(ctx, rng, `sujet-${ph}`, {
      sentence: `${ph} → ___ ${suite}`,
      answer: maj(p.p),
      choices: ['Il', 'Elle', 'Ils', 'Elles'],
      hint: AIDE_SUJET,
      explication: `${g(p.gs)} est remplacé par ${g(maj(p.p))}. ${AIDE_SUJET}`,
      difficulty: diff(level, 0.2),
    });
  }
  const [t, nat, pr] = rng.pick(objets);
  const reste = p.c.filter(([x]) => x !== t).map(([x]) => x);
  const suite = `${[p.v, ...reste].join(' ')}.`;
  return trou(ctx, rng, `compl-${ph}-${t}`, {
    sentence: `${ph} → ${maj(p.p)} ___ ${suite}`,
    answer: pr!,
    choices: ['le', 'la', 'les', 'lui', 'leur'],
    hint: AIDE_COMPL,
    explication: `${g(t)} est remplacé par ${g(pr!)}, placé devant le verbe : ${maj(p.p)} ${pr} ${suite} ${
      nat === 'coi' ? 'Le groupe commence par « à » : on utilise lui ou leur.' : ''
    }`.trim(),
    difficulty: diff(level, 0.6),
  });
}

function genSubstQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const d = diff(level, rng.next());
  if (level === 'plus_loin' && rng.chance(0.6)) {
    const p = rng.pick(
      PHRASES.filter((x) => x.c.some(([, k]) => k === 'coi') && x.c.some(([, k, pr]) => k === 'cod' && pr)),
    );
    const [cod, , pCod] = p.c.find(([, k]) => k === 'cod')!;
    const [coi, , pCoi] = p.c.find(([, k]) => k === 'coi')!;
    const bonne = `${maj(p.p)} ${pCod} ${pCoi} ${p.v}.`;
    return qcm(ctx, rng, `double-${phraseDe(p)}`, {
      question: `Remplace ${g(cod)} ET ${g(coi)} par des pronoms : ${g(phraseDe(p))}`,
      good: bonne,
      wrong: [
        `${maj(p.p)} ${pCoi} ${pCod} ${p.v}.`,
        `${maj(p.p)} ${pCod} ${pCoi === 'lui' ? 'leur' : 'lui'} ${p.v}.`,
        `${maj(p.p)} ${p.v} ${pCod} ${pCoi}.`,
      ],
      explication: `Les deux pronoms se placent devant le verbe, dans cet ordre : ${bonne}`,
      difficulty: d,
    });
  }
  if (level === 'facile' || rng.chance(0.4)) {
    const [gn, pr] = rng.pick(GN_PRONOMS);
    return qcm(ctx, rng, `pron-${gn}`, {
      question: `Par quel pronom peut-on remplacer ${g(gn)} quand c’est le sujet ?`,
      good: pr,
      wrong: ['il', 'elle', 'ils', 'elles'],
      fixedOrder: ['il', 'elle', 'ils', 'elles'],
      explication: AIDE_SUJET,
      difficulty: d,
    });
  }
  const p = rng.pick(PHRASES.filter((x) => x.c.some(([, , pr]) => pr)));
  const [t, , pr] = rng.pick(p.c.filter(([, , x]) => x));
  return qcm(ctx, rng, `qcm-${phraseDe(p)}-${t}`, {
    question: `Par quel pronom peut-on remplacer ${g(t)} dans ${g(phraseDe(p))} ?`,
    good: pr!,
    wrong: ['le', 'la', 'les', 'lui', 'leur'],
    max: 4,
    explication: AIDE_COMPL,
    difficulty: d,
  });
}

function genSubstClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level !== 'facile' && rng.chance(0.5)) {
    const p = rng.pick(PHRASES.filter((x) => x.c.some(([, , pr]) => pr)));
    return labo(ctx, rng, level, p, 'Trouve la place de chaque groupe, puis remplace-le par un pronom.');
  }
  const n = parNiv(level, { facile: 1, normal: 2, plus_loin: 2 });
  const pr: Pron[] = ['il', 'elle', 'ils', 'elles'];
  const choisis = pr.flatMap((p) =>
    tirer(
      rng,
      GN_PRONOMS.filter(([, x]) => x === p),
      n + (level === 'plus_loin' && rng.chance(0.5) ? 1 : 0),
    ),
  );
  return classer(ctx, rng, `gn-${choisis.map(([x]) => x).join('|')}`, {
    prompt: 'Range chaque groupe selon le pronom qui peut le remplacer.',
    categories: pr,
    elements: choisis.map(([x, p]): [string, number] => [x, pr.indexOf(p)]),
    explication: AIDE_SUJET,
    difficulty: diff(level, rng.next()),
  });
}

function genSubstPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const pr: Pron[] = ['il', 'elle', 'ils', 'elles'];
  const pairs = pr.map((p) => ({
    left: rng.pick(GN_PRONOMS.filter(([, x]) => x === p))[0],
    right: p,
  }));
  return paires(ctx, `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque groupe au pronom qui peut le remplacer.',
    pairs,
    relation: 'groupe nominal → pronom',
    explication: AIDE_SUJET,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const GRAMMAIRE_CE1: ContentModule = {
  'CE1.FR.GRAM.PHRASE': {
    gens: { ordering: genPhraseOrdre, mcq: genPhraseQcm, classification: genPhraseLabo },
    pools: { pairing: aucun },
  },
  'CE1.FR.GRAM.TYPES': {
    gens: { mcq: genTypesQcm, ordering: genTypesOrdre, true_false: genTypesVf, pairing: genTypesPaires },
  },
  'CE1.FR.GRAM.CLASSES': {
    gens: { classification: genClassesClasser, mcq: genClassesQcm, pairing: genClassesPaires },
  },
  'CE1.FR.GRAM.SUBST': {
    gens: {
      fill_blank: genSubstTrou,
      mcq: genSubstQcm,
      classification: genSubstClasser,
      pairing: genSubstPaires,
    },
  },
};
