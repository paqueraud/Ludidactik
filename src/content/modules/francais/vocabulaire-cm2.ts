/**
 * CM2 — Vocabulaire. BO n°16 du 17/04/2025 (CM2) : « acquérir un vocabulaire précis dans différents univers
 * de référence » ; « se servir du contexte et de la morphologie pour comprendre les mots inconnus » ;
 * « utiliser des dictionnaires » ; « approfondir la notion de polysémie dans un contexte non référentiel » ;
 * « approfondir les relations morphologiques et sémantiques ». Synonymes / antonymes : outils de réemploi
 * (objectif explicite de 6e) ; étymologie (racines latines et grecques) : Pour aller plus loin.
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { pairesDefinitions } from './orthographe';
import { classer, diff, g, ordre, paires, parNiv, qcm, tirer } from './util';

type Niv = 'f' | 'n' | 'p';
const okNiv = (level: Level, n: Niv) =>
  parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: true });

/* ------------------------------------------------------------------ */
/* CM2.FR.VOC.POLYSEMIE                                                */
/* ------------------------------------------------------------------ */

/** Mot polysémique → [sens, phrase d'exemple (32 caractères au plus)][]. */
const POLYSEMES: { mot: string; sens: [string, string][]; n: Niv }[] = [
  {
    mot: 'feuille',
    sens: [
      ['partie verte d’une plante', 'La feuille du chêne jaunit.'],
      ['morceau de papier', 'J’écris sur une feuille.'],
    ],
    n: 'f',
  },
  {
    mot: 'souris',
    sens: [
      ['petit rongeur', 'Le chat guette la souris.'],
      ['objet relié à l’ordinateur', 'Je clique avec la souris.'],
    ],
    n: 'f',
  },
  {
    mot: 'glace',
    sens: [
      ['eau gelée', 'Le lac est couvert de glace.'],
      ['dessert glacé', 'Je mange une glace à la vanille.'],
      ['miroir', 'Elle se coiffe devant la glace.'],
    ],
    n: 'f',
  },
  {
    mot: 'carte',
    sens: [
      ['dessin d’un pays ou d’une région', 'Il lit la carte de France.'],
      ['carton à jouer', 'Je tire une carte du jeu.'],
      ['liste des plats', 'Le serveur apporte la carte.'],
    ],
    n: 'n',
  },
  {
    mot: 'opération',
    sens: [
      ['calcul', 'Pose l’opération en colonnes.'],
      ['intervention du chirurgien', 'Son opération du genou a réussi.'],
    ],
    n: 'n',
  },
  {
    mot: 'racine',
    sens: [
      ['partie d’une plante sous la terre', 'Les racines boivent l’eau.'],
      ['partie commune d’une famille de mots', '« terr- » : racine de terrain.'],
    ],
    n: 'n',
  },
  {
    mot: 'pièce',
    sens: [
      ['salle d’une maison', 'La maison a cinq pièces.'],
      ['monnaie en métal', 'Il glisse une pièce de 2 €.'],
      ['spectacle de théâtre', 'La pièce commence à 20 h.'],
    ],
    n: 'n',
  },
  {
    mot: 'bureau',
    sens: [
      ['meuble pour écrire', 'Range ton bureau !'],
      ['lieu de travail', 'Maman est au bureau.'],
    ],
    n: 'n',
  },
  {
    mot: 'volume',
    sens: [
      ['place occupée par un objet', 'Ce carton a un grand volume.'],
      ['force du son', 'Baisse le volume de la radio.'],
      ['tome d’un livre', 'J’ai lu le premier volume.'],
    ],
    n: 'p',
  },
  {
    mot: 'note',
    sens: [
      ['son de musique', 'Le do est une note.'],
      ['résultat d’une évaluation', 'Il a eu une bonne note.'],
      ['court texte écrit', 'Laisse une note sur le frigo.'],
    ],
    n: 'p',
  },
  {
    mot: 'bouchon',
    sens: [
      ['objet qui ferme une bouteille', 'Il visse le bouchon.'],
      ['file de voitures arrêtées', 'Il y a un bouchon sur la route.'],
    ],
    n: 'p',
  },
  {
    mot: 'lame',
    sens: [
      ['morceau de métal qui coupe', 'La lame du couteau brille.'],
      ['grosse vague', 'Une lame a frappé le bateau.'],
    ],
    n: 'p',
  },
];
/** Homonymes (Pour aller plus loin) : [phrase, mot juste, autres homonymes]. */
const HOMONYMES: [string, string, string[]][] = [
  ['Le jardinier trouve un ___ de terre.', 'ver', ['vert', 'verre', 'vers']],
  ['Je bois un ___ d’eau.', 'verre', ['vert', 'ver', 'vers']],
  ['Le ___ de la piscine est très chaud.', 'bain', ['bin', 'bains']],
  ['La ___ monte sur la plage.', 'mer', ['mère', 'maire']],
  ['Le ___ de la ville inaugure la place.', 'maire', ['mer', 'mère']],
  ['Il a mis une ___ de pain dans son sac.', 'tranche', ['tranchent', 'tranches']],
  ['Le chat chasse une ___.', 'souris', ['sourit', 'sourie']],
  ['Au ___ de la montagne, il fait froid.', 'sommet', ['sommes', 'sommeil']],
];
const REGLE_POLY =
  'Un même mot peut avoir plusieurs sens (il est polysémique) : c’est le contexte, la phrase, qui permet de choisir le bon sens.';

function polysemes(level: Level) {
  return POLYSEMES.filter((x) => okNiv(level, x.n));
}

function genPolyQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.35)) {
    const [ph, bon, autres] = rng.pick(HOMONYMES.slice(0, 5));
    return qcm(ctx, rng, `homo-${ph}`, {
      question: `Quel homonyme complète la phrase ? ${g(ph)}`,
      good: bon,
      wrong: autres,
      max: 4,
      explication: `Des homonymes se prononcent pareil mais n’ont ni le même sens ni la même orthographe : ${g(ph.replace('___', bon))}`,
      difficulty: diff(level, 0.8),
    });
  }
  const x = rng.pick(polysemes(level));
  const [sens, phrase] = rng.pick(x.sens);
  return qcm(ctx, rng, `poly-${phrase}`, {
    question: `Dans la phrase ${g(phrase)}, que veut dire le mot ${g(x.mot)} ?`,
    good: sens,
    wrong: x.sens.map(([s]) => s),
    max: x.sens.length,
    explication: `Ici, ${g(x.mot)} veut dire « ${sens} ». ${REGLE_POLY}`,
    difficulty: diff(level, rng.next()),
  });
}

function genPolyPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const candidats = polysemes(level).filter((x) => x.sens.length >= 3);
  if (candidats.length && rng.chance(0.5)) {
    const x = rng.pick(candidats);
    return paires(ctx, `sens-${x.mot}`, {
      prompt: `Associe chaque phrase au sens du mot « ${x.mot} ».`,
      pairs: x.sens.map(([s, p]) => ({ left: p, right: s })),
      relation: 'phrase → sens',
      explication: REGLE_POLY,
      difficulty: diff(level, rng.next()),
    });
  }
  const choisis = tirer(rng, polysemes(level), parNiv(level, { facile: 3, normal: 4, plus_loin: 5 }));
  const pairs = choisis.map((x) => {
    const [s, p] = rng.pick(x.sens);
    return { left: p, right: `${x.mot} : ${s}` };
  });
  return paires(ctx, `poly-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque phrase au sens du mot qu’elle utilise.',
    pairs,
    relation: 'phrase → sens',
    explication: REGLE_POLY,
    difficulty: diff(level, rng.next()),
  });
}

function genPolyClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const x = rng.pick(polysemes(level));
  return classer(ctx, rng, `classe-${x.mot}`, {
    prompt: `Le mot « ${x.mot} » a plusieurs sens. Range chaque phrase selon le sens du mot.`,
    categories: x.sens.map(([s]) => s),
    elements: x.sens.map(([, p], i): [string, number] => [p, i]),
    explication: REGLE_POLY,
    difficulty: diff(level, x.sens.length / 3),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.VOC.MORPHO                                                   */
/* ------------------------------------------------------------------ */

/** Familles de mots (radical) avec un intrus qui ressemble. */
const FAMILLES: { radical: string; mots: string[]; intrus: string; n: Niv }[] = [
  {
    radical: 'terre',
    mots: ['terrain', 'terrasse', 'atterrir', 'souterrain', 'enterrer'],
    intrus: 'terrible',
    n: 'f',
  },
  { radical: 'dent', mots: ['dentiste', 'dentifrice', 'dentition', 'édenté'], intrus: 'identique', n: 'f' },
  { radical: 'mer', mots: ['marin', 'maritime', 'amerrir', 'marée'], intrus: 'merle', n: 'n' },
  { radical: 'lait', mots: ['laitier', 'laitage', 'allaiter', 'laiterie'], intrus: 'laid', n: 'f' },
  { radical: 'nuit', mots: ['nocturne', 'minuit', 'nuitée'], intrus: 'nuire', n: 'p' },
  { radical: 'froid', mots: ['froideur', 'refroidir', 'frigorifié'], intrus: 'frire', n: 'p' },
  { radical: 'jour', mots: ['journée', 'journal', 'aujourd’hui', 'séjour'], intrus: 'jouer', n: 'n' },
  { radical: 'fleur', mots: ['fleuriste', 'fleurir', 'floraison', 'fleuri'], intrus: 'flûte', n: 'n' },
];
/** Affixes : [affixe, sens, exemple, niveau]. */
const AFFIXES: [string, string, string, Niv][] = [
  ['re-', 'de nouveau', 'relire', 'f'],
  ['dé-', 'défaire, faire l’inverse d’une action', 'démonter', 'f'],
  ['in- / im-', 'pas (adjectif contraire)', 'impossible', 'f'],
  ['pré-', 'avant', 'prévoir', 'n'],
  ['sous-', 'en dessous', 'sous-sol', 'n'],
  ['-able', 'qu’on peut', 'lavable', 'n'],
  ['-eur', 'celui ou celle qui fait', 'nageur', 'f'],
  ['-ette', 'petit', 'fillette', 'n'],
  ['-ment', 'de façon…', 'lentement', 'n'],
  ['-age', 'l’action de', 'lavage', 'n'],
  ['hydro-', 'eau (grec)', 'hydravion', 'p'],
  ['géo-', 'terre (grec)', 'géographie', 'p'],
  ['bio-', 'vie (grec)', 'biologie', 'p'],
  ['-logie', 'étude, science (grec)', 'zoologie', 'p'],
  ['télé-', 'loin (grec)', 'téléphone', 'p'],
  ['-vore', 'qui mange (latin)', 'herbivore', 'p'],
  ['aqua-', 'eau (latin)', 'aquarium', 'p'],
  ['chrono-', 'temps (grec)', 'chronomètre', 'p'],
];
/** Formation : [mot, catégorie]. 0 = simple, 1 = dérivé, 2 = composé. */
const FORMATION: [string, 0 | 1 | 2][] = [
  ['table', 0],
  ['lune', 0],
  ['chanter', 0],
  ['maison', 0],
  ['chanteur', 1],
  ['impoli', 1],
  ['relire', 1],
  ['jardinier', 1],
  ['porte-monnaie', 2],
  ['arc-en-ciel', 2],
  ['chou-fleur', 2],
  ['pomme de terre', 2],
];
const REGLE_MORPHO =
  'Les mots d’une même famille partagent un radical (terre, terrain, atterrir) ; préfixes et suffixes s’ajoutent au radical et changent le sens.';

function affixes(level: Level) {
  return AFFIXES.filter(([, , , n]) => okNiv(level, n));
}

function genMorphoPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const choisis = tirer(rng, affixes(level), parNiv(level, { facile: 3, normal: 5, plus_loin: 6 }));
  return paires(ctx, `aff-${choisis.map(([a]) => a).join('|')}`, {
    prompt:
      level === 'plus_loin'
        ? 'Associe chaque élément (préfixe, suffixe ou racine) à son sens.'
        : 'Associe chaque préfixe ou suffixe à son sens.',
    pairs: choisis.map(([a, s]) => ({ left: a, right: s })),
    relation: 'affixe → sens',
    explication: `${REGLE_MORPHO} Exemples : ${choisis.map(([, , e]) => e).join(', ')}.`,
    difficulty: diff(level, rng.next()),
  });
}

function genMorphoQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const mode = parNiv(level, {
    facile: 'intrus',
    normal: rng.pick(['intrus', 'sens']),
    plus_loin: rng.pick(['sens', 'racine', 'intrus']),
  });
  if (mode === 'intrus') {
    const f = rng.pick(FAMILLES.filter((x) => okNiv(level, x.n)));
    const membres = tirer(rng, f.mots, 3);
    return qcm(ctx, rng, `intrus-${f.radical}`, {
      question: `Quel mot n’est pas de la famille de ${g(f.radical)} ?`,
      good: f.intrus,
      wrong: membres,
      max: 4,
      explication: `${membres.join(', ')} viennent de ${g(f.radical)} ; ${g(f.intrus)} lui ressemble mais n’a pas le même sens : ce n’est pas la même famille.`,
      difficulty: diff(level, rng.next()),
    });
  }
  const dispo = affixes(level).filter(([, , , n]) => (mode === 'racine' ? n === 'p' : n !== 'p'));
  const [a, s, e] = rng.pick(dispo);
  return qcm(ctx, rng, `affsens-${a}`, {
    question: `Dans le mot ${g(e)}, que signifie ${g(a)} ?`,
    good: s,
    wrong: affixes(level).map(([, x]) => x),
    max: 4,
    explication: `${g(a)} veut dire « ${s} » : ${e}. ${mode === 'racine' ? 'Beaucoup de mots savants viennent du grec ou du latin.' : REGLE_MORPHO}`,
    difficulty: diff(level, rng.next()),
  });
}

function genMorphoClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const choisis = [0, 1, 2].flatMap((k) =>
      tirer(
        rng,
        FORMATION.filter(([, c]) => c === k),
        3,
      ),
    );
    return classer(ctx, rng, `formation-${choisis.map(([m]) => m).join('|')}`, {
      prompt: 'Ce mot est-il simple, dérivé (avec préfixe ou suffixe) ou composé (plusieurs mots) ?',
      categories: ['mot simple', 'mot dérivé', 'mot composé'],
      elements: choisis.map(([m, c]): [string, number] => [m, c]),
      explication:
        'Un mot simple ne se décompose pas ; un mot dérivé a un préfixe ou un suffixe ; un mot composé réunit plusieurs mots (notion de 6e).',
      difficulty: diff(level, 0.8),
    });
  }
  const fams = tirer(
    rng,
    FAMILLES.filter((x) => okNiv(level, x.n)),
    level === 'facile' ? 2 : 3,
  );
  return classer(ctx, rng, `familles-${fams.map((f) => f.radical).join('|')}`, {
    prompt: 'Range chaque mot dans sa famille.',
    categories: fams.map((f) => `famille de « ${f.radical} »`),
    elements: fams.flatMap((f, i) => tirer(rng, f.mots, 3).map((m): [string, number] => [m, i])),
    explication: REGLE_MORPHO,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.VOC.UNIVERS                                                  */
/* ------------------------------------------------------------------ */

const UNIVERS: Record<string, [string, string][]> = {
  histoire: [
    ['monarchie', 'régime dirigé par un roi ou une reine'],
    ['république', 'régime où le peuple élit ses dirigeants'],
    ['citoyen', 'membre d’un pays, avec des droits et des devoirs'],
    ['armistice', 'accord qui arrête les combats'],
    ['suffrage', 'vote'],
    ['laïcité', 'séparation des religions et de l’État'],
  ],
  sciences: [
    ['écosystème', 'milieu et êtres vivants qui y vivent'],
    ['digestion', 'transformation des aliments dans le corps'],
    ['thermomètre', 'instrument qui mesure la température'],
    ['séisme', 'tremblement de terre'],
    ['mammifère', 'animal dont la femelle allaite ses petits'],
    ['satellite', 'objet qui tourne autour d’une planète'],
  ],
  mathématiques: [
    ['périmètre', 'longueur du contour d’une figure'],
    ['quadrilatère', 'figure à quatre côtés'],
    ['dénominateur', 'nombre sous la barre d’une fraction'],
    ['quotient', 'résultat d’une division'],
    ['perpendiculaire', 'qui forme un angle droit'],
    ['diamètre', 'segment qui traverse le cercle par son centre'],
  ],
  arts: [
    ['sculpture', 'œuvre en volume taillée ou modelée'],
    ['portrait', 'représentation d’une personne'],
    ['partition', 'musique écrite avec des notes'],
    ['refrain', 'partie d’une chanson qui revient'],
    ['paysage', 'tableau qui représente la nature'],
    ['chorégraphie', 'suite de pas d’une danse'],
  ],
  émotions: [
    ['enthousiasme', 'grande joie, grand entrain'],
    ['inquiétude', 'peur de ce qui pourrait arriver'],
    ['nostalgie', 'regret d’un temps passé'],
    ['soulagement', 'détente après une peur ou une douleur'],
    ['indignation', 'colère devant une injustice'],
    ['jalousie', 'envie de ce que possède un autre'],
  ],
};
/** Réemploi (Plus loin) : [phrase avec ___, mot juste, autres]. */
const REEMPLOI_UNIVERS: [string, string, string[]][] = [
  ['Pour connaître la température de l’eau, Louna utilise un ___.', 'thermomètre', ['périmètre', 'diamètre']],
  ['Après le vote, le ___ a désigné un nouveau maire.', 'suffrage', ['séisme', 'satellite']],
  [
    'Quand le chat a été retrouvé, toute la famille a ressenti un grand ___.',
    'soulagement',
    ['enthousiasme', 'portrait'],
  ],
  ['Le violoniste pose sa ___ sur le pupitre.', 'partition', ['sculpture', 'quotient']],
  ['La forêt, ses arbres et ses animaux forment un ___.', 'écosystème', ['quadrilatère', 'armistice']],
  ['Ce mur et le sol forment un angle droit : ils sont ___.', 'perpendiculaires', ['parallèles', 'égaux']],
];

function genUniversClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const cats = tirer(rng, Object.keys(UNIVERS), parNiv(level, { facile: 2, normal: 3, plus_loin: 4 }));
  return classer(ctx, rng, `univ-${cats.join('|')}`, {
    prompt: 'Dans quelle matière ou quel domaine utilise-t-on chaque mot ?',
    categories: cats,
    elements: cats.flatMap((c, i) => tirer(rng, UNIVERS[c]!, 3).map(([m]): [string, number] => [m, i])),
    explication: 'Chaque domaine a ses mots précis : on les apprend avec leur sens et leur orthographe.',
    difficulty: diff(level, rng.next()),
  });
}

function genUniversQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const [ph, bon, autres] = rng.pick(REEMPLOI_UNIVERS);
    return qcm(ctx, rng, `reemploi-${ph}`, {
      question: `Quel mot complète la phrase ? ${g(ph)}`,
      good: bon,
      wrong: autres,
      explication: `On choisit le mot précis qui convient au sens : ${g(ph.replace('___', bon))}`,
      difficulty: diff(level, 0.8),
    });
  }
  const dom = rng.pick(Object.keys(UNIVERS));
  const [mot, def] = rng.pick(UNIVERS[dom]!);
  return qcm(ctx, rng, `def-${mot}`, {
    question: `Quel mot (${dom}) correspond à cette définition : « ${def} » ?`,
    good: mot,
    wrong: UNIVERS[dom]!.map(([m]) => m),
    max: level === 'facile' ? 3 : 4,
    explication: `${mot.charAt(0).toUpperCase()}${mot.slice(1)} : ${def}.`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.VOC.DICO                                                     */
/* ------------------------------------------------------------------ */

const MOTS_DICO_CM2 = (
  'abandonner abeille abri absent accident acrobate adulte aéroport agenda aigle aimable alarme album aliment ' +
  'bagage baignoire balcon baleine bambou banquet barque bataille biscuit boussole bouteille brouillard ' +
  'cabane cadran cagoule calcul calendrier canal canard capitale caravane carnaval cascade ' +
  'parachute paradis parasol parcours parfum parole partage passage patience patrimoine paysage ' +
  'tableau tabouret talent tambour tapis tempête tentative terrain territoire tortue tourbillon trésor'
).split(' ');
const alpha = (a: string, b: string) => a.localeCompare(b, 'fr');
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const prefixeCommun = (a: string, b: string) => {
  const [x, y] = [sansAccent(a), sansAccent(b)];
  let i = 0;
  while (i < x.length && x[i] === y[i]) i++;
  return i;
};

/** Abréviations du dictionnaire. */
const ABREVIATIONS: [string, string][] = [
  ['n. m.', 'nom masculin'],
  ['n. f.', 'nom féminin'],
  ['v.', 'verbe'],
  ['adj.', 'adjectif'],
  ['adv.', 'adverbe'],
  ['syn.', 'synonyme'],
  ['contr.', 'contraire'],
  ['fig.', 'sens figuré'],
  ['prép.', 'préposition'],
];
/** Articles de dictionnaire (inventés pour l'exercice) : [mot, article, phrase, numéro du bon sens]. */
const ARTICLES: [string, string, string, number][] = [
  [
    'grue',
    'grue n. f. 1. Grand oiseau aux longues pattes. 2. Engin qui soulève de lourdes charges.',
    'Sur le chantier, la grue soulève des poutres.',
    2,
  ],
  [
    'grue',
    'grue n. f. 1. Grand oiseau aux longues pattes. 2. Engin qui soulève de lourdes charges.',
    'Les grues migrent vers le sud en automne.',
    1,
  ],
  [
    'éclair',
    'éclair n. m. 1. Lumière vive pendant un orage. 2. Gâteau long fourré de crème.',
    'Au dessert, j’ai mangé un éclair au café.',
    2,
  ],
  [
    'éclair',
    'éclair n. m. 1. Lumière vive pendant un orage. 2. Gâteau long fourré de crème.',
    'Un éclair a illuminé le ciel.',
    1,
  ],
  [
    'avocat',
    'avocat n. m. 1. Personne qui défend quelqu’un au tribunal. 2. Fruit à la chair verte.',
    'L’avocat plaide devant le juge.',
    1,
  ],
  [
    'avocat',
    'avocat n. m. 1. Personne qui défend quelqu’un au tribunal. 2. Fruit à la chair verte.',
    'Je prépare une salade d’avocat.',
    2,
  ],
  [
    'mousse',
    'mousse n. f. 1. Petite plante verte des lieux humides. 2. Bulles à la surface d’un liquide.',
    'La mousse pousse au pied des arbres.',
    1,
  ],
  [
    'mousse',
    'mousse n. f. 1. Petite plante verte des lieux humides. 2. Bulles à la surface d’un liquide.',
    'Le bain est plein de mousse.',
    2,
  ],
];
const REGLE_DICO_CM2 =
  'Dans le dictionnaire, les mots sont rangés par ordre alphabétique, lettre après lettre ; chaque article donne la nature du mot (n. m., v., adj.) et ses différents sens, numérotés.';

function genDicoCm2Ordre(level: Level, rng: Rng, ctx: GenContext): Item {
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 6 });
  const commun = parNiv(level, { facile: 0, normal: 1, plus_loin: 3 });
  for (let essai = 0; essai < 60; essai++) {
    const base = rng.pick(MOTS_DICO_CM2);
    const groupe = MOTS_DICO_CM2.filter((m) =>
      commun === 0 ? sansAccent(m)[0] !== sansAccent(base)[0] : prefixeCommun(m, base) >= commun,
    );
    const out = [base];
    for (const m of rng.shuffle(groupe)) {
      if (out.includes(m)) continue;
      if (commun === 0 ? out.every((o) => sansAccent(o)[0] !== sansAccent(m)[0]) : true) out.push(m);
      if (out.length >= n) break;
    }
    if (out.length >= Math.min(n, 4)) {
      const tries = out.sort(alpha);
      return ordre(ctx, `alpha-${tries.join('|')}`, {
        prompt: 'Range ces mots dans l’ordre du dictionnaire.',
        elements: tries,
        mode: 'etapes',
        explication: `${REGLE_DICO_CM2.split(' ;')[0]}. Ordre : ${tries.join(', ')}.`,
        difficulty: diff(level, rng.next()),
      });
    }
  }
  throw new Error('ordre alphabétique introuvable');
}

function genDicoCm2Qcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'facile' || rng.chance(0.4)) {
    const [ab, sens] = rng.pick(ABREVIATIONS);
    return qcm(ctx, rng, `abr-${ab}`, {
      question: `Dans un article de dictionnaire, que signifie l’abréviation ${g(ab)} ?`,
      good: sens,
      wrong: ABREVIATIONS.map(([, s]) => s),
      max: 4,
      explication: `${g(ab)} veut dire « ${sens} ». Chaque article ${REGLE_DICO_CM2.split(' ; chaque article ')[1]}`,
      difficulty: diff(level, rng.next()),
    });
  }
  const [mot, article, phrase, bon] = rng.pick(ARTICLES);
  return qcm(ctx, rng, `sens-${phrase}`, {
    question: `Lis l’article : ${g(article)} Dans la phrase ${g(phrase)}, quel sens du mot ${g(mot)} est employé ?`,
    good: `le sens ${bon}`,
    wrong: ['le sens 1', 'le sens 2'],
    fixedOrder: ['le sens 1', 'le sens 2'],
    explication: `On relit la phrase et on choisit le sens qui convient au contexte : ici, c’est le sens ${bon}.`,
    difficulty: diff(level, 0.7),
  });
}

function genDicoCm2Paires(level: Level, rng: Rng, ctx: GenContext): Item {
  const choisis = tirer(rng, ABREVIATIONS, parNiv(level, { facile: 4, normal: 5, plus_loin: 6 }));
  return paires(ctx, `abr-${choisis.map(([a]) => a).join('|')}`, {
    prompt: 'Associe chaque abréviation du dictionnaire à sa signification.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: 'abréviation → signification',
    explication: REGLE_DICO_CM2,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.FR.VOC.SYN_ANT                                                  */
/* ------------------------------------------------------------------ */

const SYN: [string, string][] = [
  ['rapide', 'véloce'],
  ['débuter', 'commencer'],
  ['effrayé', 'apeuré'],
  ['bâtir', 'construire'],
  ['habile', 'adroit'],
  ['dérober', 'voler'],
  ['achever', 'terminer'],
  ['joyeux', 'gai'],
  ['silencieux', 'muet'],
  ['immense', 'gigantesque'],
];
const ANT: [string, string][] = [
  ['généreux', 'avare'],
  ['courageux', 'lâche'],
  ['accepter', 'refuser'],
  ['augmenter', 'diminuer'],
  ['ancien', 'moderne'],
  ['rare', 'fréquent'],
  ['optimiste', 'pessimiste'],
  ['vrai', 'faux'],
  ['allumer', 'éteindre'],
  ['solide', 'fragile'],
];
/** Gradations : [sens, mot le plus fort, mots plus faibles]. */
const NUANCES_CM2: [string, string, string[]][] = [
  ['avoir très peur', 'être terrifié', ['être inquiet', 'être soucieux']],
  ['très content', 'ravi', ['satisfait', 'calme']],
  ['très en colère', 'furieux', ['agacé', 'mécontent']],
  ['très fatigué', 'épuisé', ['las', 'reposé']],
  ['très grand', 'gigantesque', ['moyen', 'haut']],
  ['manger avec appétit', 'dévorer', ['grignoter', 'picorer']],
];
const REGISTRES_CM2: [string, string, string][] = [
  ['une bagnole', 'une voiture', 'une automobile'],
  ['bosser', 'travailler', 'œuvrer'],
  ['un bouquin', 'un livre', 'un ouvrage'],
  ['la trouille', 'la peur', 'l’effroi'],
  ['piquer', 'voler', 'dérober'],
];
const REGLE_SYN =
  'Des synonymes ont presque le même sens et la même classe (rapide / véloce) ; des antonymes ont des sens contraires (généreux / avare).';

function genSynPaires(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const choisis = tirer(rng, REGISTRES_CM2, 4);
    return paires(ctx, `reg-${choisis.map(([, c]) => c).join('|')}`, {
      prompt: 'Associe chaque mot courant à son synonyme de registre soutenu.',
      pairs: choisis.map(([, c, s]) => ({ left: c, right: s })),
      relation: 'courant → soutenu',
      explication:
        'Ces mots ont le même sens mais pas le même registre : courant au quotidien, soutenu à l’écrit ou dans les grandes occasions.',
      difficulty: diff(level, 0.8),
    });
  }
  const ant = rng.chance(0.5);
  const choisis = tirer(rng, ant ? ANT : SYN, parNiv(level, { facile: 4, normal: 5, plus_loin: 6 }));
  return paires(ctx, `${ant ? 'ant' : 'syn'}-${choisis.map(([a]) => a).join('|')}`, {
    prompt: ant ? 'Associe chaque mot à son antonyme (son contraire).' : 'Associe chaque mot à son synonyme.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: ant ? 'antonymes' : 'synonymes',
    explication: REGLE_SYN,
    difficulty: diff(level, rng.next()),
  });
}

function genSynQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const mode = parNiv(level, {
    facile: rng.pick(['syn', 'ant']),
    normal: rng.pick(['syn', 'ant', 'nuance']),
    plus_loin: rng.pick(['nuance', 'registre', 'ant']),
  });
  if (mode === 'nuance') {
    const [sens, bon, autres] = rng.pick(NUANCES_CM2);
    return qcm(ctx, rng, `nuance-${sens}`, {
      question: `Quel mot exprime le mieux l’idée « ${sens} » ?`,
      good: bon,
      wrong: autres,
      explication: `Les synonymes ont souvent des nuances : ${g(bon)} est le plus fort.`,
      difficulty: diff(level, 0.7),
    });
  }
  if (mode === 'registre') {
    const t = rng.pick(REGISTRES_CM2);
    return qcm(ctx, rng, `reg-${t[1]}`, {
      question: `Quel est le synonyme de registre soutenu de ${g(t[1])} ?`,
      good: t[2],
      wrong: [t[0], ...REGISTRES_CM2.filter((x) => x !== t).map((x) => x[2])],
      explication: `${t[0]} est familier, ${t[1]} courant, ${t[2]} soutenu : ils ont le même sens mais pas le même registre.`,
      difficulty: diff(level, 0.8),
    });
  }
  const liste = mode === 'syn' ? SYN : ANT;
  const [a, b] = rng.pick(liste);
  const pieges = mode === 'syn' ? ANT.filter(([x]) => x !== a).map(([, y]) => y) : SYN.map(([, y]) => y);
  return qcm(ctx, rng, `${mode}-${a}`, {
    question:
      mode === 'syn'
        ? `Quel est le synonyme de ${g(a)} ?`
        : `Quel est l’antonyme (le contraire) de ${g(a)} ?`,
    good: b,
    wrong: [...pieges, ...liste.filter(([x]) => x !== a).map(([, y]) => y)],
    explication: `${g(a)} et ${g(b)} sont des ${mode === 'syn' ? 'synonymes' : 'antonymes'}. ${REGLE_SYN}`,
    difficulty: diff(level, rng.next()),
  });
}

function genSynClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const n = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
  return classer(ctx, rng, 'syn-ant', {
    prompt: 'Ces deux mots sont-ils synonymes ou antonymes ?',
    categories: ['synonymes', 'antonymes'],
    elements: [
      ...tirer(rng, SYN, n).map(([a, b]): [string, number] => [`${a} / ${b}`, 0]),
      ...tirer(rng, ANT, n).map(([a, b]): [string, number] => [`${a} / ${b}`, 1]),
    ],
    explication: REGLE_SYN,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const VOCABULAIRE_CM2: ContentModule = {
  'CM2.FR.VOC.POLYSEMIE': {
    gens: { mcq: genPolyQcm, pairing: genPolyPaires, classification: genPolyClasser },
  },
  'CM2.FR.VOC.MORPHO': {
    gens: { pairing: genMorphoPaires, mcq: genMorphoQcm, classification: genMorphoClasser },
  },
  'CM2.FR.VOC.UNIVERS': {
    gens: { classification: genUniversClasser, mcq: genUniversQcm, pairing: pairesDefinitions },
  },
  'CM2.FR.VOC.DICO': {
    gens: { ordering: genDicoCm2Ordre, mcq: genDicoCm2Qcm, pairing: genDicoCm2Paires },
  },
  'CM2.FR.VOC.SYN_ANT': {
    gens: { pairing: genSynPaires, mcq: genSynQcm, classification: genSynClasser },
  },
};
