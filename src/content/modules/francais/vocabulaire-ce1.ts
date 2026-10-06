/**
 * CE1 — Vocabulaire. BO n°41 du 31/10/2024 : affixes « para (parapluie), multi (multicolore), anti (antivol),
 * eur/euse (chanteur, coiffeuse), er (boulanger, boucher) » ; contraires « visible/invisible,
 * ranger/déranger, monter/démonter » ; « aliment > laitage > fromage > gruyère » ; niveaux de langue
 * familier / courant / soutenu ; sens propre / figuré (« avoir une peur bleue », « prendre ses jambes à
 * son cou ») ; dictionnaire ; corpus thématiques (« jaloux, ambitieux »).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { aucun, classer, diff, g, ordre, paires, parNiv, qcm, tirer, trou } from './util';

type Niv = 'f' | 'n' | 'p';
const okNiv = (level: Level, n: Niv) =>
  parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: true });
/** Tire `n` entrées dont le côté `cle` est unique. */
function uniques<T>(rng: Rng, list: readonly T[], n: number, cles: ((x: T) => string)[]): T[] {
  const out: T[] = [];
  for (const x of rng.shuffle(list)) {
    if (cles.some((c) => out.some((o) => c(o) === c(x)))) continue;
    out.push(x);
    if (out.length >= n) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.AFFIXES                                                  */
/* ------------------------------------------------------------------ */

/** [mot dérivé, sens, affixe, niveau]. */
const DERIVES: [string, string, string, Niv][] = [
  ['chanteur', 'une personne qui chante', '-eur', 'f'],
  ['danseuse', 'une femme qui danse', '-euse', 'f'],
  ['nageur', 'une personne qui nage', '-eur', 'f'],
  ['coiffeuse', 'une femme qui coiffe', '-euse', 'f'],
  ['joueur', 'une personne qui joue', '-eur', 'f'],
  ['refaire', 'faire de nouveau', 're-', 'f'],
  ['relire', 'lire de nouveau', 're-', 'f'],
  ['démonter', 'défaire ce qui était monté', 'dé-', 'n'],
  ['déranger', 'mettre en désordre', 'dé-', 'n'],
  ['défaire', 'faire le contraire de faire', 'dé-', 'n'],
  ['invisible', 'qu’on ne peut pas voir', 'in-', 'n'],
  ['inconnu', 'que l’on ne connaît pas', 'in-', 'n'],
  ['impossible', 'qu’on ne peut pas faire', 'in-', 'n'],
  ['parapluie', 'un objet qui protège de la pluie', 'para-', 'n'],
  ['parasol', 'un objet qui protège du soleil', 'para-', 'n'],
  ['multicolore', 'qui a plusieurs couleurs', 'multi-', 'n'],
  ['antivol', 'un objet qui protège contre le vol', 'anti-', 'n'],
  ['antipoux', 'un produit contre les poux', 'anti-', 'n'],
  ['boulanger', 'une personne qui fait le pain', '-er', 'n'],
  ['jardinier', 'une personne qui s’occupe du jardin', '-ier', 'n'],
  ['pommier', 'un arbre qui donne des pommes', '-ier', 'n'],
  ['cerisier', 'un arbre qui donne des cerises', '-ier', 'n'],
  ['fillette', 'une petite fille', '-ette', 'p'],
  ['maisonnette', 'une petite maison', '-ette', 'p'],
  ['lavable', 'qu’on peut laver', '-able', 'p'],
  ['réchauffer', 'chauffer de nouveau', 're-', 'p'],
  ['parachute', 'un objet qui protège d’une chute', 'para-', 'p'],
  ['sous-marin', 'un bateau qui va sous la mer', 'sous-', 'p'],
  ['préhistoire', 'la période avant l’histoire', 'pré-', 'p'],
];

/** Préfixes et suffixes : [affixe, sens]. */
const AFFIXES: [string, string, Niv][] = [
  ['re-', 'de nouveau', 'f'],
  ['-eur', 'celui qui fait l’action', 'f'],
  ['dé-', 'le contraire', 'n'],
  ['in-', 'pas', 'n'],
  ['para-', 'qui protège de', 'n'],
  ['multi-', 'plusieurs', 'n'],
  ['anti-', 'contre', 'n'],
  ['-ier', 'l’arbre ou le métier', 'n'],
  ['-ette', 'petit', 'p'],
  ['-able', 'qu’on peut', 'p'],
  ['sous-', 'en dessous', 'p'],
  ['pré-', 'avant', 'p'],
];

const REGLE_AFFIXES =
  'Un préfixe se place avant le radical et change le sens du mot (re-faire) ; un suffixe se place après (chant-eur).';

function genAffixesPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'facile') {
    const verbes: [string, string][] = [
      ['chanter', 'chanteur'],
      ['danser', 'danseur'],
      ['nager', 'nageur'],
      ['jouer', 'joueur'],
      ['coiffer', 'coiffeur'],
      ['vendre', 'vendeur'],
      ['skier', 'skieur'],
    ];
    const pairs = tirer(rng, verbes, 4).map(([left, right]) => ({ left, right }));
    return paires(ctx, `eur-${pairs.map((p) => p.left).join('|')}`, {
      prompt: 'Associe chaque verbe à la personne qui fait l’action.',
      pairs,
      relation: 'verbe → nom en -eur',
      explication:
        'Avec le suffixe -eur, on fabrique le nom de la personne qui fait l’action : chanter → chanteur.',
      difficulty: diff(level, rng.next()),
    });
  }
  const dispo = AFFIXES.filter(([, , n]) => okNiv(level, n));
  const choisis = uniques(rng, dispo, level === 'normal' ? 5 : 6, [(x) => x[0], (x) => x[1]]);
  return paires(ctx, `affixes-${choisis.map(([a]) => a).join('|')}`, {
    prompt: 'Associe chaque préfixe ou suffixe à son sens.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: 'affixe → sens',
    explication: REGLE_AFFIXES,
    difficulty: diff(level, rng.next()),
  });
}

function genAffixesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = DERIVES.filter(([, , , n]) => okNiv(level, n));
  const [mot, sens, affixe] = rng.pick(dispo);
  const autres = DERIVES.filter(([m, s]) => m !== mot && s !== sens);
  if (level === 'plus_loin' && rng.chance(0.5)) {
    return qcm(ctx, rng, `creer-${mot}`, {
      question: `Quel mot veut dire « ${sens} » ?`,
      good: mot,
      wrong: autres.map(([m]) => m),
      max: 4,
      explication: `${g(mot)} est formé avec ${g(affixe)} : ${mot} = ${sens}.`,
      difficulty: diff(level, 0.8),
    });
  }
  return qcm(ctx, rng, `sens-${mot}`, {
    question: `Que veut dire le mot ${g(mot)} ?`,
    good: sens,
    wrong: autres.map(([, s]) => s),
    max: level === 'facile' ? 3 : 4,
    explication: `Dans ${g(mot)}, ${g(affixe)} donne un indice : ${mot} = ${sens}.`,
    difficulty: diff(level, rng.next()),
  });
}

function genAffixesClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = DERIVES.filter(([, , , n]) => okNiv(level, n));
  if (level === 'facile' || rng.chance(0.5)) {
    const pre = dispo.filter(([, , a]) => a.endsWith('-'));
    const suf = dispo.filter(([, , a]) => a.startsWith('-'));
    const n = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
    return classer(ctx, rng, 'pre-suf', {
      prompt: 'Range chaque mot : a-t-il un préfixe (au début) ou un suffixe (à la fin) ?',
      categories: ['préfixe', 'suffixe'],
      elements: [
        ...tirer(rng, pre, n).map(([m]): [string, number] => [m, 0]),
        ...tirer(rng, suf, n).map(([m]): [string, number] => [m, 1]),
      ],
      explication: REGLE_AFFIXES,
      difficulty: diff(level, rng.next()),
    });
  }
  const parAffixe = new Map<string, string[]>();
  for (const [m, , a] of dispo) parAffixe.set(a, [...(parAffixe.get(a) ?? []), m]);
  const affixes = tirer(
    rng,
    [...parAffixe.keys()].filter((a) => parAffixe.get(a)!.length >= 2),
    level === 'normal' ? 3 : 4,
  );
  return classer(ctx, rng, `affixes-${affixes.join('|')}`, {
    prompt: 'Range chaque mot selon son préfixe ou son suffixe.',
    categories: affixes,
    elements: affixes.flatMap((a, i) =>
      tirer(rng, parAffixe.get(a)!, 3).map((m): [string, number] => [m, i]),
    ),
    explication: REGLE_AFFIXES,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.CONTRAIRES                                               */
/* ------------------------------------------------------------------ */

const CONTRAIRES_SIMPLES: [string, string][] = [
  ['grand', 'petit'],
  ['chaud', 'froid'],
  ['jour', 'nuit'],
  ['haut', 'bas'],
  ['plein', 'vide'],
  ['gentil', 'méchant'],
  ['rapide', 'lent'],
  ['ouvrir', 'fermer'],
  ['monter', 'descendre'],
  ['avant', 'après'],
  ['dedans', 'dehors'],
  ['propre', 'sale'],
  ['lourd', 'léger'],
  ['rire', 'pleurer'],
  ['gagner', 'perdre'],
  ['entrer', 'sortir'],
  ['allumer', 'éteindre'],
  ['toujours', 'jamais'],
];
const CONTRAIRES_PREFIXES: [string, string, Niv][] = [
  ['visible', 'invisible', 'n'],
  ['possible', 'impossible', 'n'],
  ['connu', 'inconnu', 'n'],
  ['poli', 'impoli', 'n'],
  ['patient', 'impatient', 'n'],
  ['content', 'mécontent', 'n'],
  ['ranger', 'déranger', 'n'],
  ['monter', 'démonter', 'n'],
  ['faire', 'défaire', 'n'],
  ['coller', 'décoller', 'n'],
  ['plier', 'déplier', 'n'],
  ['habiller', 'déshabiller', 'n'],
  ['juste', 'injuste', 'n'],
  ['prudent', 'imprudent', 'n'],
  ['lisible', 'illisible', 'p'],
  ['régulier', 'irrégulier', 'p'],
  ['réel', 'irréel', 'p'],
  ['croyable', 'incroyable', 'p'],
];
const SYNONYMES: [string, string][] = [
  ['content', 'joyeux'],
  ['vite', 'rapidement'],
  ['beau', 'joli'],
  ['commencer', 'débuter'],
  ['finir', 'terminer'],
  ['voiture', 'automobile'],
  ['bavarder', 'discuter'],
  ['regarder', 'observer'],
  ['demander', 'questionner'],
  ['triste', 'malheureux'],
  ['peur', 'frayeur'],
  ['maison', 'habitation'],
];
/** Nuances : [sens, mot juste, mots plus faibles ou voisins]. */
const NUANCES: [string, string, string[]][] = [
  ['très chaud', 'brûlant', ['tiède', 'frais']],
  ['très froid', 'glacial', ['frais', 'tiède']],
  ['très petit', 'minuscule', ['moyen', 'énorme']],
  ['très grand', 'immense', ['moyen', 'minuscule']],
  ['très fatigué', 'épuisé', ['reposé', 'calme']],
  ['très bon (à manger)', 'délicieux', ['fade', 'mangeable']],
  ['parler très fort', 'crier', ['chuchoter', 'murmurer']],
  ['parler tout bas', 'chuchoter', ['crier', 'hurler']],
  ['avoir très peur', 'être terrifié', ['être inquiet', 'être calme']],
  ['manger très vite', 'dévorer', ['grignoter', 'goûter']],
];

const REGLE_CONTRAIRES =
  'Un contraire dit l’inverse (chaud / froid) ; on peut souvent le fabriquer avec in- ou dé- (visible / invisible, ranger / déranger). Un synonyme veut dire presque la même chose.';

function contrairesDe(level: Level): [string, string][] {
  return parNiv(level, {
    facile: CONTRAIRES_SIMPLES,
    normal: CONTRAIRES_PREFIXES.filter(([, , n]) => n === 'n').map(([a, b]): [string, string] => [a, b]),
    plus_loin: [...CONTRAIRES_SIMPLES, ...CONTRAIRES_PREFIXES.map(([a, b]): [string, string] => [a, b])],
  });
}

function genContrairesPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const syn = level !== 'facile' && rng.chance(0.3);
  const liste = syn ? SYNONYMES : contrairesDe(level);
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 6 });
  const choisis = uniques(rng, liste, n, [(x) => x[0], (x) => x[1]]);
  return paires(ctx, `${syn ? 'syn' : 'contr'}-${choisis.map(([a]) => a).join('|')}`, {
    prompt: syn
      ? 'Associe les mots qui veulent dire presque la même chose.'
      : 'Associe chaque mot à son contraire.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: syn ? 'synonymes' : 'contraires',
    explication: REGLE_CONTRAIRES,
    difficulty: diff(level, rng.next()),
  });
}

function genContrairesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const [sens, bon, faibles] = rng.pick(NUANCES);
    return qcm(ctx, rng, `nuance-${sens}`, {
      question: `Quel mot (ou groupe de mots) veut dire « ${sens} » ?`,
      good: bon,
      wrong: faibles,
      explication: `${g(bon)} est plus fort, plus précis : il veut dire « ${sens} ».`,
      difficulty: diff(level, 0.8),
    });
  }
  if (level !== 'facile' && rng.chance(0.3)) {
    const [a, b] = rng.pick(SYNONYMES);
    return qcm(ctx, rng, `syn-${a}`, {
      question: `Quel mot veut dire presque la même chose que ${g(a)} ?`,
      good: b,
      wrong: [
        ...contrairesDe(level).map(([, y]) => y),
        ...SYNONYMES.filter(([x]) => x !== a).map(([, y]) => y),
      ],
      explication: `${g(a)} et ${g(b)} sont des synonymes : ils ont presque le même sens.`,
      difficulty: diff(level, rng.next()),
    });
  }
  const liste = contrairesDe(level);
  const [a, b] = rng.pick(liste);
  const pieges = [
    ...liste.filter(([x]) => x !== a).map(([, y]) => y),
    ...SYNONYMES.filter(([x]) => x === a).map(([, y]) => y),
  ];
  return qcm(ctx, rng, `contr-${a}`, {
    question: `Quel est le contraire de ${g(a)} ?`,
    good: b,
    wrong: pieges,
    explication: `Le contraire de ${g(a)}, c’est ${g(b)}. Un contraire dit l’inverse.`,
    difficulty: diff(level, rng.next()),
  });
}

function genContrairesClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const n = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
  const contr = tirer(rng, contrairesDe(level), n);
  const syn = tirer(rng, SYNONYMES, n);
  return classer(ctx, rng, 'contr-syn', {
    prompt: 'Ces deux mots sont-ils des contraires ou des synonymes ?',
    categories: ['contraires', 'synonymes'],
    elements: [
      ...contr.map(([a, b]): [string, number] => [`${a} / ${b}`, 0]),
      ...syn.map(([a, b]): [string, number] => [`${a} / ${b}`, 1]),
    ],
    explication: REGLE_CONTRAIRES,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.GENERIQUE                                                */
/* ------------------------------------------------------------------ */

const FAMILLES: Record<string, string[]> = {
  fruits: ['pomme', 'poire', 'banane', 'cerise', 'fraise', 'abricot'],
  légumes: ['carotte', 'poireau', 'haricot', 'courgette', 'radis', 'navet'],
  oiseaux: ['moineau', 'pigeon', 'aigle', 'hibou', 'mésange', 'merle'],
  poissons: ['truite', 'saumon', 'sardine', 'thon', 'requin', 'carpe'],
  insectes: ['fourmi', 'abeille', 'coccinelle', 'mouche', 'papillon', 'criquet'],
  meubles: ['table', 'chaise', 'armoire', 'lit', 'commode', 'canapé'],
  vêtements: ['pantalon', 'chemise', 'robe', 'manteau', 'jupe', 'pull'],
  outils: ['marteau', 'scie', 'tournevis', 'pince', 'râteau', 'pelle'],
  'instruments de musique': ['piano', 'guitare', 'violon', 'flûte', 'tambour', 'trompette'],
  fleurs: ['rose', 'tulipe', 'marguerite', 'coquelicot', 'jonquille', 'violette'],
  sports: ['football', 'tennis', 'judo', 'natation', 'basket', 'rugby'],
  véhicules: ['voiture', 'camion', 'bus', 'vélo', 'moto', 'tracteur'],
};
/** Du plus général au plus particulier (BO : aliment > laitage > fromage > gruyère). */
const CHAINES: string[][] = [
  ['aliment', 'laitage', 'fromage', 'gruyère'],
  ['animal', 'oiseau', 'rapace', 'aigle'],
  ['plante', 'arbre', 'arbre fruitier', 'pommier'],
  ['aliment', 'fruit', 'agrume', 'orange'],
  ['meuble', 'siège', 'tabouret'],
  ['animal', 'insecte', 'fourmi'],
  ['véhicule', 'deux-roues', 'vélo'],
  ['boisson', 'jus de fruits', 'jus d’orange'],
  ['instrument de musique', 'instrument à cordes', 'violon'],
  ['animal', 'mammifère', 'félin', 'tigre'],
];
const REGLE_GENERIQUE =
  'Un mot générique désigne toute une catégorie (les fruits) ; les mots spécifiques en font partie (pomme, cerise).';

function genGeneriqueClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const cats = tirer(rng, Object.keys(FAMILLES), parNiv(level, { facile: 2, normal: 3, plus_loin: 4 }));
  const n = parNiv(level, { facile: 3, normal: 3, plus_loin: 3 });
  return classer(ctx, rng, `gen-${cats.join('|')}`, {
    prompt: 'Range chaque mot dans la bonne catégorie.',
    categories: cats,
    elements: cats.flatMap((c, i) => tirer(rng, FAMILLES[c]!, n).map((m): [string, number] => [m, i])),
    explication: REGLE_GENERIQUE,
    difficulty: diff(level, rng.next()),
  });
}

function genGeneriqueQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const cats = Object.keys(FAMILLES);
  const c = rng.pick(cats);
  if (level !== 'facile' && rng.chance(0.5)) {
    const autre = rng.pick(cats.filter((x) => x !== c));
    const intrus = rng.pick(FAMILLES[autre]!);
    const membres = tirer(rng, FAMILLES[c]!, 3);
    return qcm(ctx, rng, `intrus-${c}-${intrus}`, {
      question: `Quel mot n’est pas de la même famille que les autres ?`,
      good: intrus,
      wrong: membres,
      max: 4,
      explication: `${membres.join(', ')} sont des ${c} ; ${g(intrus)} fait partie des ${autre}.`,
      difficulty: diff(level, rng.next()),
    });
  }
  const membres = tirer(rng, FAMILLES[c]!, level === 'facile' ? 3 : 4);
  return qcm(ctx, rng, `gen-${c}-${membres.join('|')}`, {
    question: `Quel mot générique regroupe : ${membres.join(', ')} ?`,
    good: c,
    wrong: cats.filter((x) => x !== c),
    explication: `${membres.join(', ')} sont des ${c}. ${REGLE_GENERIQUE}`,
    difficulty: diff(level, rng.next()),
  });
}

function genGeneriquePaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const cats = tirer(rng, Object.keys(FAMILLES), parNiv(level, { facile: 4, normal: 5, plus_loin: 6 }));
  const pairs = cats.map((c) => ({ left: rng.pick(FAMILLES[c]!), right: c }));
  return paires(ctx, `gen-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque mot à sa catégorie.',
    pairs,
    relation: 'mot spécifique → mot générique',
    explication: REGLE_GENERIQUE,
    difficulty: diff(level, rng.next()),
  });
}

function genGeneriqueOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const chaine = rng.pick(CHAINES.filter((c) => (level === 'facile' ? c.length === 3 : true)));
  return ordre(ctx, `chaine-${chaine.join('>')}`, {
    prompt: 'Range ces mots du plus général au plus particulier.',
    elements: chaine,
    mode: 'etapes',
    explication: `${chaine.join(' > ')} : chaque mot fait partie de la catégorie du mot précédent.`,
    difficulty: diff(level, chaine.length / 4),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.EXPRESSIONS                                              */
/* ------------------------------------------------------------------ */

/** [expression, sens, niveau]. */
const EXPRESSIONS: [string, string, Niv][] = [
  ['avoir une faim de loup', 'avoir très faim', 'f'],
  ['avoir une peur bleue', 'avoir très peur', 'f'],
  ['il pleut des cordes', 'il pleut très fort', 'f'],
  ['dormir comme une marmotte', 'dormir longtemps et profondément', 'f'],
  ['être muet comme une carpe', 'ne rien dire du tout', 'f'],
  ['être rouge comme une tomate', 'avoir le visage tout rouge', 'f'],
  ['prendre ses jambes à son cou', 's’enfuir en courant très vite', 'n'],
  ['avoir un chat dans la gorge', 'avoir la voix enrouée', 'n'],
  ['donner sa langue au chat', 'renoncer à trouver la réponse', 'n'],
  ['tomber dans les pommes', 's’évanouir', 'n'],
  ['avoir la tête dans les nuages', 'être distrait, rêver', 'n'],
  ['coûter les yeux de la tête', 'coûter très cher', 'n'],
  ['avoir un cœur d’or', 'être très généreux', 'n'],
  ['avoir la main verte', 'savoir faire pousser les plantes', 'n'],
  ['casser les pieds', 'ennuyer quelqu’un', 'p'],
  ['poser un lapin', 'ne pas venir à un rendez-vous', 'p'],
  ['mettre son grain de sel', 'donner son avis sans qu’on le demande', 'p'],
  ['se lever du pied gauche', 'être de mauvaise humeur', 'p'],
  ['mettre la main à la pâte', 'aider à faire le travail', 'p'],
  ['en faire tout un fromage', 'exagérer l’importance d’une chose', 'p'],
];
/** Phrases au sens propre (0) ou figuré (1), 32 caractères au plus. */
const PROPRE_FIGURE: [string, 0 | 1][] = [
  ['Le chat boit du lait.', 0],
  ['J’ai un chat dans la gorge.', 1],
  ['Léo tombe de son vélo.', 0],
  ['Léo tombe dans les pommes.', 1],
  ['Il pleut des cordes !', 1],
  ['Je saute à la corde.', 0],
  ['Elle a la main verte.', 1],
  ['Il s’est cassé le pied.', 0],
  ['Tu me casses les pieds !', 1],
  ['Ma sœur a un cœur d’or.', 1],
  ['Mon cœur bat très vite.', 0],
  ['J’ai une faim de loup !', 1],
  ['Le loup a faim.', 0],
  ['Il est dans la lune.', 1],
  ['La lune brille.', 0],
  ['Le lapin mange une carotte.', 0],
  ['Elle m’a posé un lapin.', 1],
];
/** Réemploi : [phrase avec ___, mot attendu, choix]. */
const REEMPLOI: [string, string, string[]][] = [
  ['Il n’a rien mangé depuis ce matin : il a une faim de ___.', 'loup', ['loup', 'chat', 'lion']],
  ['Ne sors pas sans parapluie : il pleut des ___ !', 'cordes', ['cordes', 'ficelles', 'fils']],
  ['Mamie fait pousser de superbes tomates : elle a la main ___.', 'verte', ['verte', 'rouge', 'bleue']],
  ['Je ne trouve pas la réponse, je donne ma langue au ___.', 'chat', ['chat', 'chien', 'loup']],
  [
    'Quand on l’interroge, Tom ne dit rien : il est muet comme une ___.',
    'carpe',
    ['carpe', 'truite', 'sardine'],
  ],
  ['Ce soir, Hugo est fatigué : il va dormir comme une ___.', 'marmotte', ['marmotte', 'souris', 'tortue']],
  ['En voyant le loup, le cochon a pris ses jambes à son ___.', 'cou', ['cou', 'dos', 'bras']],
  ['Félicité par la maîtresse, Malo est rouge comme une ___.', 'tomate', ['tomate', 'carotte', 'banane']],
  ['Quand Léo a vu l’araignée, il a eu une peur ___.', 'bleue', ['bleue', 'verte', 'rose']],
  ['Ma voix est toute bizarre : j’ai un ___ dans la gorge.', 'chat', ['chat', 'chien', 'oiseau']],
  ['Ce jouet est trop cher : il coûte les yeux de la ___.', 'tête', ['tête', 'main', 'jambe']],
];
const REGLE_EXPR =
  'Une expression a souvent un sens figuré : on ne la comprend pas mot à mot (avoir une peur bleue = avoir très peur).';

function genExprPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = EXPRESSIONS.filter(([, , n]) => okNiv(level, n));
  const choisis = uniques(rng, dispo, parNiv(level, { facile: 4, normal: 5, plus_loin: 5 }), [(x) => x[1]]);
  return paires(ctx, `expr-${choisis.map(([e]) => e).join('|')}`, {
    prompt: 'Associe chaque expression à son sens.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: 'expression → sens',
    explication: REGLE_EXPR,
    difficulty: diff(level, rng.next()),
  });
}

function genExprQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = EXPRESSIONS.filter(([, , n]) => okNiv(level, n));
  const [e, sens] = rng.pick(dispo);
  return qcm(ctx, rng, `expr-${e}`, {
    question: `Que veut dire ${g(e)} ?`,
    good: sens,
    wrong: EXPRESSIONS.filter(([x]) => x !== e).map(([, s]) => s),
    explication: `${g(e)} veut dire « ${sens} ». ${REGLE_EXPR}`,
    difficulty: diff(level, rng.next()),
  });
}

function genExprClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const n = parNiv(level, { facile: 2, normal: 3, plus_loin: 4 });
  const el = [0, 1].flatMap((k) =>
    tirer(
      rng,
      PROPRE_FIGURE.filter(([, c]) => c === k),
      n,
    ),
  );
  return classer(ctx, rng, 'propre-figure', {
    prompt: 'Chaque phrase est-elle au sens propre (mot à mot) ou au sens figuré (une image) ?',
    categories: ['sens propre', 'sens figuré'],
    elements: el,
    explication: REGLE_EXPR,
    difficulty: diff(level, rng.next()),
  });
}

function genExprTrou(level: Level, rng: Rng, ctx: GenContext): Item {
  const [phrase, mot, choix] = rng.pick(REEMPLOI);
  return trou(ctx, rng, `reemploi-${phrase}`, {
    sentence: phrase,
    answer: mot,
    choices: level === 'facile' ? choix.slice(0, 2) : choix,
    hint: 'Pense à l’expression que tu connais : elle a un sens figuré.',
    explication: `L’expression est : ${g(phrase.replace('___', mot))}`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.NIVEAUX                                                  */
/* ------------------------------------------------------------------ */

/** [familier, courant, soutenu]. */
const REGISTRES: [string, string, string][] = [
  ['une bagnole', 'une voiture', 'une automobile'],
  ['un bouquin', 'un livre', 'un ouvrage'],
  ['la trouille', 'la peur', 'l’effroi'],
  ['une baraque', 'une maison', 'une demeure'],
  ['des godasses', 'des chaussures', 'des souliers'],
  ['piquer', 'voler', 'dérober'],
  ['bouffer', 'manger', 'se restaurer'],
  ['se balader', 'se promener', 'flâner'],
  ['le boulot', 'le travail', 'le labeur'],
  ['se marrer', 'rire', 's’esclaffer'],
];
const FAMILIER_COURANT: [string, string][] = [
  ['un pote', 'un ami'],
  ['la flotte', 'l’eau'],
  ['un gamin', 'un enfant'],
  ['rigoler', 'rire'],
  ['bosser', 'travailler'],
  ['ouais', 'oui'],
  ['un frangin', 'un frère'],
];
/** Situations : [situation, réponse adaptée, réponses inadaptées]. */
const SITUATIONS: [string, string, string[]][] = [
  [
    'Tu demandes l’heure à une dame que tu ne connais pas.',
    'Excusez-moi, madame, pourriez-vous me dire l’heure ?',
    ['Eh, t’as l’heure ?', 'Il est quelle heure, là ?'],
  ],
  [
    'Tu demandes un crayon à la maîtresse.',
    'Pourriez-vous me prêter un crayon, s’il vous plaît ?',
    ['File-moi un crayon !', 'T’as pas un crayon ?'],
  ],
  [
    'Tu remercies le directeur de l’école.',
    'Merci beaucoup, monsieur le directeur.',
    ['Merci, mon pote !', 'Ouais, merci.'],
  ],
  [
    'Tu proposes à ton copain de jouer.',
    'Tu viens jouer avec moi ?',
    ['Auriez-vous l’obligeance de venir jouer ?', 'Je vous prie de bien vouloir jouer.'],
  ],
];
const NOMS_REG = ['familier', 'courant', 'soutenu'];
const REGLE_NIV =
  'On ne parle pas de la même façon à un copain (langage familier), à tout le monde (langage courant) ou dans un livre ou une cérémonie (langage soutenu).';

function genNiveauxClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'facile') {
    const choisis = tirer(rng, FAMILIER_COURANT, 3);
    return classer(ctx, rng, 'fam-cour', {
      prompt: 'Range chaque mot : langage familier ou langage courant ?',
      categories: ['familier', 'courant'],
      elements: choisis.flatMap(([f, c]): [string, number][] => [
        [f, 0],
        [c, 1],
      ]),
      explication: REGLE_NIV,
      difficulty: diff(level, rng.next()),
    });
  }
  const choisis = tirer(rng, REGISTRES, level === 'normal' ? 3 : 4);
  return classer(ctx, rng, 'registres', {
    prompt: 'Range chaque mot selon son niveau de langue.',
    categories: NOMS_REG,
    elements: choisis.flatMap((t) => t.map((m, i): [string, number] => [m, i])),
    explication: REGLE_NIV,
    difficulty: diff(level, rng.next()),
  });
}

function genNiveauxPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const liste: [string, string][] =
    level === 'facile'
      ? FAMILIER_COURANT
      : level === 'normal'
        ? [...FAMILIER_COURANT, ...REGISTRES.map(([f, c]): [string, string] => [f, c])]
        : REGISTRES.map(([, c, s]): [string, string] => [c, s]);
  const choisis = uniques(rng, liste, 4, [(x) => x[0], (x) => x[1]]);
  return paires(ctx, `reg-${choisis.map(([a]) => a).join('|')}`, {
    prompt:
      level === 'plus_loin'
        ? 'Associe chaque mot courant au mot soutenu qui a le même sens.'
        : 'Associe chaque mot familier au mot courant qui a le même sens.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: level === 'plus_loin' ? 'courant → soutenu' : 'familier → courant',
    explication: REGLE_NIV,
    difficulty: diff(level, rng.next()),
  });
}

function genNiveauxQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level !== 'facile' && rng.chance(0.4)) {
    const [sit, bonne, autres] = rng.pick(SITUATIONS);
    return qcm(ctx, rng, `sit-${sit}`, {
      question: `${sit} Que dis-tu ?`,
      good: bonne,
      wrong: autres,
      explication: `On choisit les mots selon la personne à qui l’on parle. ${REGLE_NIV}`,
      difficulty: diff(level, rng.next()),
    });
  }
  if (level === 'facile') {
    const [f, c] = rng.pick(FAMILIER_COURANT);
    return qcm(ctx, rng, `fam-${f}`, {
      question: `Quel mot est familier (on le dit entre copains) ?`,
      good: f,
      wrong: [c],
      explication: `${g(f)} est familier ; en langage courant, on dit ${g(c)}.`,
      difficulty: diff(level, rng.next()),
    });
  }
  const t = rng.pick(REGISTRES);
  const k = rng.int(0, 2);
  return qcm(ctx, rng, `reg-${t[k]}`, {
    question: `De quel niveau de langue est le mot ${g(t[k]!)} ?`,
    good: NOMS_REG[k]!,
    wrong: NOMS_REG,
    fixedOrder: NOMS_REG,
    explication: `${t[0]} (familier), ${t[1]} (courant), ${t[2]} (soutenu) veulent dire la même chose.`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.DICO                                                     */
/* ------------------------------------------------------------------ */

const MOTS_DICO = (
  'abeille ananas arbre avion balle ballon banane bateau baleine biche bonbon bouche cabane camion canard carotte ' +
  'cartable castor chat cheval chien chocolat chemise chaise citron cochon crayon dauphin domino dragon école ' +
  'écureuil éléphant étoile fantôme fleur fourmi fraise gâteau girafe gomme gorille hibou igloo jardin journal judo ' +
  'kangourou koala lapin lion livre loup lune magie maison maman marteau melon mouton moto nuage orange ours pain ' +
  'panda papillon parapluie patin pirate poisson pomme pont porte poule radis raisin renard robot salade sapin ' +
  'serpent singe soleil sorcière soupe souris table tigre toit tomate tondeuse tortue train vache vélo violon voiture zèbre'
).split(' ');
const alpha = (a: string, b: string) => a.localeCompare(b, 'fr');
/** Rang de la première lettre qui diffère entre deux mots (0 = première lettre). */
const ecart = (a: string, b: string) => {
  const x = a.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const y = b.normalize('NFD').replace(/[̀-ͯ]/g, '');
  let i = 0;
  while (i < x.length && x[i] === y[i]) i++;
  return i;
};

/** Mots à ranger : facile = premières lettres différentes ; normal = même 1re lettre ; plus loin = 2 lettres communes. */
function motsARanger(level: Level, rng: Rng): string[] {
  const n = parNiv(level, { facile: 4, normal: 4, plus_loin: 5 });
  const prefixe = parNiv(level, { facile: 0, normal: 1, plus_loin: 2 });
  for (let essai = 0; essai < 50; essai++) {
    const base = rng.pick(MOTS_DICO);
    const groupe = MOTS_DICO.filter(
      (m) => m !== base && ecart(m, base) >= prefixe && (prefixe > 0 || m[0] !== base[0]),
    );
    const out = [base];
    for (const m of rng.shuffle(groupe)) {
      if (out.every((o) => (prefixe === 0 ? ecart(o, m) === 0 : ecart(o, m) >= prefixe))) out.push(m);
      if (out.length >= n) break;
    }
    if (out.length >= (level === 'plus_loin' ? 4 : n)) return out.sort(alpha);
  }
  return ['arbre', 'lune', 'soleil', 'vache'];
}

const REGLE_DICO =
  'Dans le dictionnaire, les mots sont rangés dans l’ordre alphabétique : si la première lettre est la même, je regarde la deuxième, puis la troisième.';

function genDicoOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const mots = motsARanger(level, rng);
  return ordre(ctx, `alpha-${mots.join('|')}`, {
    prompt: 'Range ces mots dans l’ordre alphabétique, comme dans le dictionnaire.',
    elements: mots,
    mode: 'etapes',
    explication: `${REGLE_DICO} Ordre : ${mots.join(', ')}.`,
    difficulty: diff(level, rng.next()),
  });
}

function genDicoQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    // mots-repères : le mot cherché est entre les deux mots en haut de la page
    const tries = [...MOTS_DICO].sort(alpha);
    const i = rng.int(0, tries.length - 6);
    const [debut, , , , fin] = [tries[i]!, tries[i + 1]!, tries[i + 2]!, tries[i + 3]!, tries[i + 4]!];
    const dedans = tries[i + rng.int(1, 3)]!;
    const dehors = tries.filter((m) => alpha(m, debut) < 0 || alpha(m, fin) > 0);
    return qcm(ctx, rng, `reperes-${debut}-${fin}-${dedans}`, {
      question: `En haut de la page du dictionnaire, les mots-repères sont ${g(debut)} et ${g(fin)}. Quel mot trouve-t-on sur cette page ?`,
      good: dedans,
      wrong: dehors,
      explication: `${g(dedans)} se range entre ${g(debut)} et ${g(fin)} dans l’ordre alphabétique.`,
      difficulty: diff(level, 0.8),
    });
  }
  const mots = motsARanger(level, rng);
  return qcm(ctx, rng, `premier-${[...mots].sort().join('|')}`, {
    question: 'Quel mot vient en premier dans le dictionnaire ?',
    good: mots[0]!,
    wrong: mots.slice(1),
    max: mots.length,
    explication: `${REGLE_DICO} Ordre : ${mots.join(', ')}.`,
    difficulty: diff(level, rng.next()),
  });
}

function genDicoClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const prefixe = parNiv(level, { facile: 0, normal: 1, plus_loin: 2 });
  const repere = rng.pick(
    MOTS_DICO.filter((r) => MOTS_DICO.filter((m) => m !== r && ecart(m, r) >= prefixe).length >= 4),
  );
  const proches = MOTS_DICO.filter((m) => m !== repere && ecart(m, repere) >= prefixe);
  const choisis = tirer(rng, proches, parNiv(level, { facile: 6, normal: 5, plus_loin: 5 }));
  const els = choisis.map((m): [string, number] => [m, alpha(m, repere) < 0 ? 0 : 1]);
  if (new Set(els.map(([, c]) => c)).size < 2) return genDicoClasser(level, rng, ctx);
  return classer(ctx, rng, `repere-${repere}`, {
    prompt: `Dans le dictionnaire, ces mots sont-ils avant ou après ${g(repere)} ?`,
    categories: [`avant « ${repere} »`, `après « ${repere} »`],
    elements: els,
    explication: REGLE_DICO,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.VOC.THEMES                                                   */
/* ------------------------------------------------------------------ */

/** Thème → [mot, définition d'enfant]. */
const THEMES: Record<string, [string, string][]> = {
  émotions: [
    ['la joie', 'ce qu’on ressent quand on est très content'],
    ['la colère', 'ce qu’on ressent quand on est très fâché'],
    ['la peur', 'ce qu’on ressent devant un danger'],
    ['la tristesse', 'ce qu’on ressent quand on a du chagrin'],
    ['la surprise', 'ce qu’on ressent devant l’inattendu'],
    ['la fierté', 'ce qu’on ressent quand on a bien réussi'],
  ],
  école: [
    ['le cartable', 'le sac où l’on range ses affaires d’école'],
    ['la trousse', 'la pochette où l’on range ses crayons'],
    ['l’ardoise', 'la planchette où l’on écrit et efface'],
    ['la récréation', 'le moment où l’on joue dans la cour'],
    ['la cantine', 'la salle où l’on déjeune à l’école'],
    ['la bibliothèque', 'le lieu où l’on emprunte des livres'],
  ],
  corps: [
    ['le coude', 'le pli au milieu du bras'],
    ['le genou', 'le pli au milieu de la jambe'],
    ['la cheville', 'ce qui relie la jambe et le pied'],
    ['le poignet', 'ce qui relie le bras et la main'],
    ['l’épaule', 'le haut du bras, près du cou'],
    ['le menton', 'le bas du visage, sous la bouche'],
  ],
  maison: [
    ['le grenier', 'la pièce sous le toit'],
    ['la cave', 'la pièce sous la maison'],
    ['la cuisine', 'la pièce où l’on prépare les repas'],
    ['le salon', 'la pièce où l’on se repose ensemble'],
    ['la chambre', 'la pièce où l’on dort'],
    ['le garage', 'l’endroit où l’on range la voiture'],
  ],
  nature: [
    ['la forêt', 'un grand espace couvert d’arbres'],
    ['la rivière', 'un cours d’eau qui coule'],
    ['la colline', 'une petite montagne aux pentes douces'],
    ['la prairie', 'un grand terrain couvert d’herbe'],
    ['l’étang', 'une étendue d’eau qui ne coule pas'],
    ['le ruisseau', 'un tout petit cours d’eau'],
  ],
  métiers: [
    ['le boulanger', 'il fabrique le pain'],
    ['le médecin', 'il soigne les malades'],
    ['la pompière', 'elle éteint les incendies'],
    ['la factrice', 'elle distribue le courrier'],
    ['la vétérinaire', 'elle soigne les animaux'],
    ['le menuisier', 'il fabrique des objets en bois'],
  ],
};
/** Traits de caractère (mots moins fréquents, BO : jaloux, ambitieux). */
const CARACTERES: [string, string, string[]][] = [
  [
    'Lina veut toujours être la première et devenir championne : elle est…',
    'ambitieuse',
    ['timide', 'paresseuse'],
  ],
  [
    'Tom n’aime pas que son frère reçoive plus de cadeaux que lui : il est…',
    'jaloux',
    ['généreux', 'patient'],
  ],
  ['Sacha ose sauter du plus haut plongeoir : il est…', 'courageux', ['peureux', 'bavard']],
  ['Inès partage toujours son goûter : elle est…', 'généreuse', ['jalouse', 'gourmande']],
  ['Nora a peur de parler devant la classe : elle est…', 'timide', ['bavarde', 'ambitieuse']],
  ['Zoé veut tout savoir et pose mille questions : elle est…', 'curieuse', ['paresseuse', 'distraite']],
  ['Rayan attend son tour sans jamais s’énerver : il est…', 'patient', ['impatient', 'jaloux']],
  ['Max oublie toujours ses affaires et rêve en classe : il est…', 'distrait', ['attentif', 'courageux']],
];
const REGLE_THEMES =
  'Je relie chaque mot à ce qu’il veut dire : je pense à une situation où je l’ai déjà entendu.';

function genThemesClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const cats = tirer(rng, Object.keys(THEMES), parNiv(level, { facile: 2, normal: 3, plus_loin: 4 }));
  return classer(ctx, rng, `themes-${cats.join('|')}`, {
    prompt: 'Range chaque mot dans son thème.',
    categories: cats,
    elements: cats.flatMap((c, i) => tirer(rng, THEMES[c]!, 3).map(([m]): [string, number] => [m, i])),
    explication: 'Les mots d’un même thème parlent du même sujet : l’école, la maison, le corps…',
    difficulty: diff(level, rng.next()),
  });
}

function genThemesPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const theme = rng.pick(Object.keys(THEMES));
  const choisis = tirer(rng, THEMES[theme]!, parNiv(level, { facile: 3, normal: 4, plus_loin: 5 }));
  return paires(ctx, `def-${theme}-${choisis.map(([m]) => m).join('|')}`, {
    prompt: `Thème « ${theme} » : associe chaque mot à sa définition.`,
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: 'mot → définition',
    explication: REGLE_THEMES,
    difficulty: diff(level, rng.next()),
  });
}

function genThemesQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.6)) {
    const [phrase, bon, autres] = rng.pick(CARACTERES);
    return qcm(ctx, rng, `carac-${bon}`, {
      question: phrase,
      good: bon,
      wrong: autres,
      explication: `On dit qu’une personne est ${g(bon)} quand elle se comporte ainsi.`,
      difficulty: diff(level, 0.8),
    });
  }
  const theme = rng.pick(Object.keys(THEMES));
  const [mot, def] = rng.pick(THEMES[theme]!);
  return qcm(ctx, rng, `def-${mot}`, {
    question: `Quel mot correspond à cette définition : « ${def} » ?`,
    good: mot,
    wrong:
      level === 'facile'
        ? Object.values(THEMES)
            .flat()
            .map(([m]) => m)
        : THEMES[theme]!.map(([m]) => m),
    explication: `${maj1(mot)} : ${def}.`,
    difficulty: diff(level, rng.next()),
  });
}
const maj1 = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const VOCABULAIRE_CE1: ContentModule = {
  'CE1.FR.VOC.AFFIXES': {
    gens: { pairing: genAffixesPaires, mcq: genAffixesQcm, classification: genAffixesClasser },
  },
  'CE1.FR.VOC.CONTRAIRES': {
    gens: { pairing: genContrairesPaires, mcq: genContrairesQcm, classification: genContrairesClasser },
  },
  'CE1.FR.VOC.GENERIQUE': {
    gens: {
      classification: genGeneriqueClasser,
      mcq: genGeneriqueQcm,
      pairing: genGeneriquePaires,
      ordering: genGeneriqueOrdre,
    },
  },
  'CE1.FR.VOC.EXPRESSIONS': {
    gens: {
      pairing: genExprPaires,
      mcq: genExprQcm,
      classification: genExprClasser,
      fill_blank: genExprTrou,
    },
  },
  'CE1.FR.VOC.NIVEAUX': {
    gens: { classification: genNiveauxClasser, pairing: genNiveauxPaires, mcq: genNiveauxQcm },
  },
  'CE1.FR.VOC.DICO': {
    gens: { ordering: genDicoOrdre, mcq: genDicoQcm, classification: genDicoClasser },
    pools: { pairing: aucun },
  },
  'CE1.FR.VOC.THEMES': {
    gens: { classification: genThemesClasser, pairing: genThemesPaires, mcq: genThemesQcm },
  },
};
