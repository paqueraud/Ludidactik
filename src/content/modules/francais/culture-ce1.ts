/**
 * CE1 — Lecture : devenir lecteur, culture littéraire. BO n°41 du 31/10/2024, cycle 2, CE1 :
 * « Lire 5 à 10 œuvres complètes et variées issues du patrimoine et de la littérature de jeunesse
 * (albums, romans, contes, fables, poèmes…) » ; « Se familiariser aux différents genres et types de
 * textes » ; « L'élève reconnait, lors des lectures orales d'un adulte, les grandes caractéristiques
 * d'un texte (conte, fable, poème) ». Le programme cite les contes de Perrault, des frères Grimm,
 * d'Andersen et les fables de La Fontaine. Comptines et chansons traditionnelles (domaine public) :
 * le professeur « fait mémoriser une dizaine de poèmes par an ».
 *
 * Facile : contes très connus et comptines. Normal : plus de contes, fables, genres (conte, fable,
 * comptine). Plus loin : auteurs, contes d'Andersen, morales des fables.
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { type M, motsDe, poolMotsCles } from '../../generators/mots-cles';
import { classer, diff, g, hash, make, oral, ordre, paires, qcm } from './util';

type Niv = 'f' | 'n' | 'p';
type Auteur = 'Charles Perrault' | 'les frères Grimm' | 'Hans Christian Andersen' | 'Jean de La Fontaine';

interface Oeuvre {
  titre: string;
  niv: Niv;
  genre: 'conte' | 'fable';
  /** Auteur ; absent pour un conte traditionnel sans auteur unique. */
  auteur?: Auteur;
  /** Héros mystère et indices de « Qui suis-je ? » (du plus difficile au plus facile). */
  heros: string;
  indices: [string, string, string];
  /** Objet ou détail qui n'appartient qu'à cette histoire (paires). */
  objet: string;
  /** Étapes de l'histoire, dans l'ordre (5). */
  etapes?: string[];
}

const OEUVRES: Oeuvre[] = [
  {
    titre: 'le Petit Chaperon rouge',
    niv: 'f',
    genre: 'conte',
    auteur: 'Charles Perrault',
    heros: 'le Petit Chaperon rouge',
    indices: [
      'Je porte une galette à ma grand-mère.',
      'Je rencontre un loup dans le bois.',
      'On m’appelle ainsi à cause de mon petit chapeau rouge.',
    ],
    objet: 'la galette',
    etapes: [
      'Sa maman l’envoie chez sa grand-mère avec une galette.',
      'Dans le bois, elle rencontre le loup.',
      'Le loup court chez la grand-mère.',
      'Le Petit Chaperon rouge arrive chez sa grand-mère.',
      'Elle trouve le loup couché dans le lit.',
    ],
  },
  {
    titre: 'les Trois Petits Cochons',
    niv: 'f',
    genre: 'conte',
    heros: 'les Trois Petits Cochons',
    indices: [
      'Nous sommes trois frères.',
      'Nous construisons chacun une maison.',
      'Le loup souffle sur nos maisons de paille et de bois.',
    ],
    objet: 'la maison de briques',
    etapes: [
      'Les trois petits cochons quittent leur maman.',
      'Chacun construit sa maison : en paille, en bois, en briques.',
      'Le loup souffle sur la maison de paille, qui s’envole.',
      'Il souffle sur la maison de bois, qui tombe.',
      'Il ne peut pas abattre la maison de briques.',
    ],
  },
  {
    titre: 'Boucle d’or et les trois ours',
    niv: 'f',
    genre: 'conte',
    heros: 'Boucle d’or',
    indices: [
      'J’entre dans une maison où il n’y a personne.',
      'Je goûte la soupe et j’essaie les trois chaises.',
      'Je m’endors dans le lit du petit ours.',
    ],
    objet: 'les trois bols de soupe',
    etapes: [
      'Boucle d’or se promène dans la forêt.',
      'Elle entre dans la maison des trois ours.',
      'Elle goûte la soupe du petit ours.',
      'Elle s’endort dans le lit du petit ours.',
      'Les ours rentrent et Boucle d’or s’enfuit.',
    ],
  },
  {
    titre: 'Cendrillon',
    niv: 'f',
    genre: 'conte',
    auteur: 'Charles Perrault',
    heros: 'Cendrillon',
    indices: [
      'Mes deux demi-sœurs me font faire tout le ménage.',
      'Ma marraine la fée change une citrouille en carrosse.',
      'Je perds ma pantoufle de verre à minuit.',
    ],
    objet: 'la pantoufle de verre',
    etapes: [
      'Cendrillon travaille pour sa belle-mère et ses demi-sœurs.',
      'Sa marraine la fée lui donne une robe et un carrosse.',
      'Au bal, le prince danse avec elle.',
      'À minuit, elle s’enfuit et perd sa pantoufle.',
      'Le prince la retrouve grâce à la pantoufle.',
    ],
  },
  {
    titre: 'le Petit Poucet',
    niv: 'n',
    genre: 'conte',
    auteur: 'Charles Perrault',
    heros: 'le Petit Poucet',
    indices: [
      'Je suis le plus jeune de sept frères.',
      'Je sème des cailloux blancs pour retrouver le chemin.',
      'Je prends les bottes de sept lieues de l’ogre.',
    ],
    objet: 'les cailloux blancs',
    etapes: [
      'Les parents, trop pauvres, laissent leurs enfants dans la forêt.',
      'Le Petit Poucet retrouve le chemin grâce aux cailloux.',
      'Une autre fois, les oiseaux mangent les miettes de pain.',
      'Les enfants arrivent chez l’ogre.',
      'Le Petit Poucet prend les bottes de sept lieues.',
    ],
  },
  {
    titre: 'Blanche-Neige',
    niv: 'n',
    genre: 'conte',
    auteur: 'les frères Grimm',
    heros: 'Blanche-Neige',
    indices: [
      'Ma belle-mère parle à un miroir magique.',
      'Je vis dans la forêt avec sept nains.',
      'Je croque une pomme et je tombe endormie.',
    ],
    objet: 'le miroir magique',
    etapes: [
      'La reine demande à son miroir qui est la plus belle.',
      'Blanche-Neige s’enfuit dans la forêt.',
      'Elle vit chez les sept nains.',
      'La reine, déguisée, lui donne une pomme.',
      'Blanche-Neige se réveille enfin, et le prince l’emmène.',
    ],
  },
  {
    titre: 'le Chat botté',
    niv: 'n',
    genre: 'conte',
    auteur: 'Charles Perrault',
    heros: 'le Chat botté',
    indices: [
      'Mon maître n’a hérité que de moi.',
      'Je fais croire au roi que mon maître est le marquis de Carabas.',
      'Je suis un chat qui porte des bottes.',
    ],
    objet: 'le marquis de Carabas',
  },
  {
    titre: 'la Belle au bois dormant',
    niv: 'n',
    genre: 'conte',
    auteur: 'Charles Perrault',
    heros: 'la Belle au bois dormant',
    indices: [
      'Une fée me jette un sort à ma naissance.',
      'Je me pique le doigt avec un fuseau.',
      'Je dors pendant cent ans.',
    ],
    objet: 'le fuseau',
    etapes: [
      'Une fée jette un sort à la petite princesse.',
      'Devenue grande, la princesse se pique le doigt avec un fuseau.',
      'Elle s’endort pour cent ans, avec tout le château.',
      'Une forêt de ronces pousse autour du château.',
      'Un prince arrive et la princesse se réveille.',
    ],
  },
  {
    titre: 'Hansel et Gretel',
    niv: 'n',
    genre: 'conte',
    auteur: 'les frères Grimm',
    heros: 'Hansel et Gretel',
    indices: [
      'Nous sommes un frère et une sœur.',
      'Nous nous perdons dans la forêt.',
      'Nous trouvons une maison en pain d’épices.',
    ],
    objet: 'le pain d’épices',
    etapes: [
      'Hansel et Gretel se perdent dans la forêt.',
      'Ils trouvent une maison en pain d’épices.',
      'Une sorcière les enferme.',
      'Gretel ruse pour libérer son frère.',
      'Les enfants rentrent chez leur père.',
    ],
  },
  {
    titre: 'la Cigale et la Fourmi',
    niv: 'n',
    genre: 'fable',
    auteur: 'Jean de La Fontaine',
    heros: 'la Cigale',
    indices: [
      'J’ai chanté tout l’été.',
      'Quand l’hiver arrive, je n’ai plus rien à manger.',
      'Ma voisine la Fourmi refuse de me prêter quelques grains.',
    ],
    objet: 'tout l’été à chanter',
  },
  {
    titre: 'le Corbeau et le Renard',
    niv: 'n',
    genre: 'fable',
    auteur: 'Jean de La Fontaine',
    heros: 'le Renard',
    indices: [
      'Je sens l’odeur d’un bon fromage.',
      'Je fais des compliments à un oiseau perché sur un arbre.',
      'Le Corbeau ouvre le bec et j’attrape le fromage.',
    ],
    objet: 'le fromage',
  },
  {
    titre: 'le Lièvre et la Tortue',
    niv: 'n',
    genre: 'fable',
    auteur: 'Jean de La Fontaine',
    heros: 'la Tortue',
    indices: [
      'Je propose une course à un animal très rapide.',
      'Je pars tout de suite et j’avance lentement, sans m’arrêter.',
      'J’arrive la première, devant le Lièvre.',
    ],
    objet: 'la course',
    etapes: [
      'La Tortue propose une course au Lièvre.',
      'Le Lièvre se moque de la Tortue.',
      'La Tortue part tout de suite, lentement.',
      'Le Lièvre s’amuse et se repose.',
      'La Tortue arrive la première.',
    ],
  },
  {
    titre: 'la Petite Sirène',
    niv: 'p',
    genre: 'conte',
    auteur: 'Hans Christian Andersen',
    heros: 'la Petite Sirène',
    indices: [
      'Je vis au fond de la mer.',
      'Je sauve un prince pendant une tempête.',
      'J’échange ma voix contre des jambes.',
    ],
    objet: 'la queue de poisson',
  },
  {
    titre: 'le Vilain Petit Canard',
    niv: 'p',
    genre: 'conte',
    auteur: 'Hans Christian Andersen',
    heros: 'le Vilain Petit Canard',
    indices: [
      'Tout le monde se moque de moi dans la basse-cour.',
      'Je passe un hiver difficile, tout seul.',
      'Au printemps, je découvre que je suis un cygne.',
    ],
    objet: 'le beau cygne',
    etapes: [
      'Un drôle de caneton sort du plus gros œuf.',
      'Les animaux de la ferme se moquent de lui.',
      'Il s’enfuit et passe l’hiver tout seul.',
      'Au printemps, il voit de beaux cygnes.',
      'Il découvre qu’il est devenu un cygne.',
    ],
  },
  {
    titre: 'le Lion et le Rat',
    niv: 'p',
    genre: 'fable',
    auteur: 'Jean de La Fontaine',
    heros: 'le Rat',
    indices: [
      'Je suis tout petit, mais un roi des animaux m’a laissé partir.',
      'Ce roi se retrouve pris dans un filet.',
      'Je ronge les mailles du filet pour libérer le Lion.',
    ],
    objet: 'le filet',
  },
];

/** Comptines et chansons traditionnelles : [début, mot qui manque, suite entendue, niveau]. */
const COMPTINES: [string, string, string, Niv][] = [
  ['Une souris verte qui courait dans l’', 'herbe', 'Une souris verte qui courait dans l’herbe', 'f'],
  ['Au clair de la lune, mon ami', 'Pierrot', 'Au clair de la lune, mon ami Pierrot', 'f'],
  ['Frère Jacques, frère Jacques,', 'dormez-vous', 'Frère Jacques, frère Jacques, dormez-vous ?', 'f'],
  ['Une poule sur un mur qui picorait du', 'pain dur', 'Une poule sur un mur qui picorait du pain dur', 'f'],
  [
    'Promenons-nous dans les bois pendant que le',
    'loup n’y est pas',
    'Promenons-nous dans les bois pendant que le loup n’y est pas',
    'n',
  ],
  [
    'Il pleut, il pleut, bergère, rentre tes blancs',
    'moutons',
    'Il pleut, il pleut, bergère, rentre tes blancs moutons',
    'n',
  ],
  [
    'Ainsi font, font, font les petites',
    'marionnettes',
    'Ainsi font, font, font les petites marionnettes',
    'n',
  ],
  ['Dans la forêt lointaine, on entend le', 'coucou', 'Dans la forêt lointaine, on entend le coucou', 'n'],
  ['Sur le pont d’Avignon, on y', 'danse', 'Sur le pont d’Avignon, on y danse, on y danse', 'p'],
  ['Il était un petit homme, pirouette,', 'cacahuète', 'Il était un petit homme, pirouette, cacahuète', 'p'],
  ['À la claire fontaine, m’en allant', 'promener', 'À la claire fontaine, m’en allant promener', 'p'],
];

/** Morales de La Fontaine (domaine public). */
const MORALES: [string, string][] = [
  ['Rien ne sert de courir ; il faut partir à point.', 'le Lièvre et la Tortue'],
  ['On a souvent besoin d’un plus petit que soi.', 'le Lion et le Rat'],
  ['Tout flatteur vit aux dépens de celui qui l’écoute.', 'le Corbeau et le Renard'],
];

const GENRES = {
  conte:
    'un conte : une histoire merveilleuse, avec des fées, des ogres ou des princes, qui commence souvent par « Il était une fois »',
  fable:
    'une fable : une courte histoire, souvent en vers, où des animaux parlent et qui donne une leçon (la morale)',
  comptine: 'une comptine : un petit poème qu’on chante ou qu’on récite, avec des rimes',
};

const NIVEAUX: Record<Level, Niv[]> = { facile: ['f'], normal: ['f', 'n'], plus_loin: ['n', 'p'] };
const DIFF: Record<Niv, number> = { f: 0.2, n: 0.5, p: 0.8 };
const pour = <T extends { niv: Niv } | [unknown, unknown, unknown, Niv]>(level: Level, list: readonly T[]) =>
  list.filter((x) => NIVEAUX[level].includes(Array.isArray(x) ? x[3] : x.niv));
const maj = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);
/** Titre en début de phrase ou seul sur une étiquette. */
const titre = (o: Oeuvre) => maj(o.titre);

/* ------------------------------------------------------------------ */
/* QCM                                                                 */
/* ------------------------------------------------------------------ */

function poolQcm(level: Level, rng: Rng, ctx: GenContext): Item[] {
  const oeuvres = pour(level, OEUVRES);
  const max = level === 'facile' ? 3 : 4;
  const out: Item[] = [];
  for (const o of oeuvres) {
    // Qui suis-je ?
    out.push(
      qcm(ctx, rng, `heros-${o.heros}`, {
        question: `Qui suis-je ? ${o.indices.join(' ')}`,
        good: maj(o.heros),
        wrong: oeuvres.filter((x) => x.heros !== o.heros).map((x) => maj(x.heros)),
        max,
        hints: o.indices,
        explication: `C’est ${o.heros}, dans « ${titre(o)} ».`,
        difficulty: DIFF[o.niv],
      }),
    );
    // Genre (Normal et Plus loin)
    if (level !== 'facile')
      out.push(
        qcm(ctx, rng, `genre-${o.titre}`, {
          question: `« ${titre(o)} » : quel genre d’histoire est-ce ?`,
          good: o.genre === 'conte' ? 'un conte' : 'une fable',
          wrong: ['un conte', 'une fable', 'une comptine'],
          max: 3,
          explication: `« ${titre(o)} » est ${GENRES[o.genre]}.`,
          difficulty: DIFF[o.niv],
        }),
      );
    // Auteur (Plus loin)
    if (level === 'plus_loin' && o.auteur) {
      const autres: Auteur[] =
        o.auteur === 'Charles Perrault'
          ? ['Hans Christian Andersen', 'Jean de La Fontaine']
          : o.auteur === 'les frères Grimm'
            ? ['Hans Christian Andersen', 'Jean de La Fontaine', 'Charles Perrault']
            : o.auteur === 'Hans Christian Andersen'
              ? ['Charles Perrault', 'Jean de La Fontaine']
              : ['Charles Perrault', 'Hans Christian Andersen', 'les frères Grimm'];
      out.push(
        qcm(ctx, rng, `auteur-${o.titre}`, {
          question: `Qui a écrit « ${titre(o)} » ?`,
          good: o.auteur,
          wrong: autres,
          max: 3,
          explication:
            o.auteur === 'les frères Grimm'
              ? `« ${titre(o)} » a été recueilli et écrit par les frères Grimm.`
              : `« ${titre(o)} » a été écrit par ${o.auteur}.`,
          difficulty: 0.8,
        }),
      );
    }
  }
  // Comptines : le mot qui manque
  for (const [debut, mot, suite, n] of pour(level, COMPTINES)) {
    const autres = COMPTINES.filter(([, m]) => m !== mot).map(([, m]) => m);
    out.push(
      qcm(ctx, rng, `comptine-${hash(debut)}`, {
        question: `Complète la comptine : ${g(`${debut}…`)}`,
        good: mot,
        wrong: autres,
        max: 3,
        spoken: `${debut}… Comment continue la comptine ?`,
        explication: `On chante : ${g(suite)}.`,
        difficulty: DIFF[n],
      }),
    );
  }
  // Morales (Plus loin)
  if (level === 'plus_loin')
    for (const [morale, fable] of MORALES)
      out.push(
        qcm(ctx, rng, `morale-${hash(morale)}`, {
          question: `De quelle fable de La Fontaine vient cette morale : ${g(morale)} ?`,
          good: maj(fable),
          wrong: MORALES.map(([, f]) => maj(f)),
          max: 3,
          explication: `C’est la morale de « ${maj(fable)} » : la leçon que la fable veut nous apprendre.`,
          difficulty: 0.9,
        }),
      );
  return out;
}

/* ------------------------------------------------------------------ */
/* Vrai ou faux                                                        */
/* ------------------------------------------------------------------ */

/** [affirmation, vraie ?, explication, niveau]. */
const VF: [string, boolean, string, Niv][] = [
  [
    'Cendrillon perd sa pantoufle de verre à minuit.',
    true,
    'En s’enfuyant du bal à minuit, Cendrillon perd sa pantoufle de verre.',
    'f',
  ],
  [
    'Le Petit Chaperon rouge porte une galette à sa grand-mère.',
    true,
    'Sa maman l’envoie porter une galette et un petit pot de beurre.',
    'f',
  ],
  [
    'Le loup détruit la maison de briques des Trois Petits Cochons.',
    false,
    'Le loup souffle, souffle… mais la maison de briques résiste.',
    'f',
  ],
  [
    'Boucle d’or s’endort dans le lit du petit ours.',
    true,
    'Fatiguée, Boucle d’or s’endort dans le lit du petit ours.',
    'f',
  ],
  [
    'Un conte commence souvent par « Il était une fois ».',
    true,
    '« Il était une fois » est la formule du début des contes.',
    'f',
  ],
  [
    'Le Petit Poucet sème des cailloux blancs pour retrouver le chemin.',
    true,
    'Grâce aux cailloux blancs, il retrouve le chemin de la maison.',
    'n',
  ],
  [
    'Blanche-Neige vit dans la forêt avec trois ours.',
    false,
    'Blanche-Neige vit avec les sept nains ; les trois ours, c’est l’histoire de Boucle d’or.',
    'n',
  ],
  [
    'Dans une fable, les animaux parlent.',
    true,
    'Dans les fables, les animaux parlent et agissent comme des personnes.',
    'n',
  ],
  [
    'Dans « le Lièvre et la Tortue », c’est le Lièvre qui gagne la course.',
    false,
    'C’est la Tortue qui gagne : elle est partie tout de suite, sans s’arrêter.',
    'n',
  ],
  [
    'La Cigale a chanté tout l’été.',
    true,
    'La Cigale a chanté tout l’été et n’a rien gardé pour l’hiver.',
    'n',
  ],
  [
    'La Belle au bois dormant dort pendant cent ans.',
    true,
    'Le sort de la fée la fait dormir cent ans.',
    'n',
  ],
  [
    'Le Vilain Petit Canard devient un cygne.',
    true,
    'Au printemps, il découvre qu’il est devenu un magnifique cygne.',
    'p',
  ],
  [
    'Charles Perrault a écrit « Cendrillon ».',
    true,
    'Charles Perrault a écrit « Cendrillon », « le Petit Poucet » et « le Chat botté ».',
    'p',
  ],
  [
    'Jean de La Fontaine a écrit « la Petite Sirène ».',
    false,
    '« La Petite Sirène » est un conte d’Andersen ; La Fontaine a écrit des fables.',
    'p',
  ],
  [
    'Dans « le Lion et le Rat », le Rat libère le Lion pris dans un filet.',
    true,
    'Le petit Rat ronge les mailles du filet : on a souvent besoin d’un plus petit que soi.',
    'p',
  ],
];

function poolVraiFaux(level: Level, _rng: Rng, ctx: GenContext): Item[] {
  return pour(level, VF).map(([s, v, e, n]) =>
    make(ctx, 'true_false', `vf-${hash(s)}`, {
      statement: s,
      answer: v,
      explication: e,
      difficulty: DIFF[n],
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Paires, classements, étapes                                         */
/* ------------------------------------------------------------------ */

function poolPaires(level: Level, rng: Rng, ctx: GenContext): Item[] {
  const oeuvres = pour(level, OEUVRES).filter(
    (o) => o.genre === 'conte' && o.objet.length <= 24 && titre(o).length <= 24,
  );
  const n = level === 'facile' ? 3 : level === 'normal' ? 4 : 5;
  const out: Item[] = [];
  for (let i = 0; i < 4; i++) {
    const choix = rng.shuffle(oeuvres).slice(0, n);
    if (choix.length < 3) break;
    out.push(
      paires(ctx, `objets-${choix.map((o) => o.titre).join('|')}`, {
        prompt: 'Associe chaque objet ou personnage au conte où on le trouve.',
        pairs: choix.map((o) => ({ left: maj(o.objet), right: titre(o) })),
        relation: 'objet → conte',
        explication: choix.map((o) => `${maj(o.objet)} : « ${titre(o)} »`).join(' ; ') + '.',
        difficulty: diff(level, 0.5),
      }),
    );
  }
  if (level !== 'facile')
    out.push(
      paires(ctx, 'fables-heros', {
        prompt: 'Associe les deux héros de chaque fable de La Fontaine.',
        pairs: [
          { left: 'la Cigale', right: 'la Fourmi' },
          { left: 'le Corbeau', right: 'le Renard' },
          { left: 'le Lièvre', right: 'la Tortue' },
          ...(level === 'plus_loin' ? [{ left: 'le Lion', right: 'le Rat' }] : []),
        ],
        relation: 'héros → héros',
        explication:
          'La Cigale et la Fourmi, le Corbeau et le Renard, le Lièvre et la Tortue' +
          (level === 'plus_loin' ? ', le Lion et le Rat.' : '.'),
        difficulty: diff(level, 0.6),
      }),
    );
  return out;
}

const TITRES_COMPTINES = [
  'Une souris verte',
  'Au clair de la lune',
  'Frère Jacques',
  'Une poule sur un mur',
  'Ainsi font, font, font',
];

function poolClasser(level: Level, rng: Rng, ctx: GenContext): Item[] {
  const contes = pour(level, OEUVRES)
    .filter((o) => o.genre === 'conte')
    .map(titre);
  const fables = OEUVRES.filter(
    (o) => o.genre === 'fable' && level !== 'facile' && NIVEAUX[level].includes(o.niv),
  ).map(titre);
  const out: Item[] = [];
  for (let i = 0; i < 3; i++) {
    const cats = level === 'facile' ? ['conte', 'comptine'] : ['conte', 'fable', 'comptine'];
    const elements: [string, number][] = [
      ...rng
        .shuffle(contes)
        .slice(0, 3)
        .map((t): [string, number] => [t, 0]),
      ...(level === 'facile'
        ? []
        : rng
            .shuffle(fables)
            .slice(0, 2)
            .map((t): [string, number] => [t, 1])),
      ...rng
        .shuffle(TITRES_COMPTINES)
        .slice(0, 2)
        .map((t): [string, number] => [t, cats.indexOf('comptine')]),
    ];
    out.push(
      classer(
        ctx,
        rng,
        `genres-${elements
          .map(([t]) => t)
          .sort()
          .join('|')}`,
        {
          prompt: 'Range chaque titre selon le genre du texte.',
          categories: cats,
          elements,
          explication: cats.map((c) => GENRES[c as keyof typeof GENRES]).join(' ; ') + '.',
          difficulty: diff(level, 0.5),
        },
      ),
    );
  }
  return out;
}

function poolEtapes(level: Level, _rng: Rng, ctx: GenContext): Item[] {
  const k = level === 'facile' ? 3 : level === 'normal' ? 4 : 5;
  return pour(level, OEUVRES)
    .filter((o) => o.etapes)
    .map((o) =>
      ordre(ctx, `etapes-${o.titre}-${k}`, {
        prompt: `Remets dans l’ordre les étapes de l’histoire « ${titre(o)} ».`,
        elements: o.etapes!.slice(0, k),
        mode: 'etapes',
        explication: `Dans l’ordre : ${o.etapes!.slice(0, k).join(' ')}`,
        difficulty: DIFF[o.niv],
      }),
    );
}

/* ------------------------------------------------------------------ */
/* Oral (Perroquet savant) et mots à écrire                            */
/* ------------------------------------------------------------------ */

function poolOral(level: Level, _rng: Rng, ctx: GenContext): Item[] {
  const comptines = pour(level, COMPTINES).map(([debut, mot, suite, n]) =>
    oral(ctx, `suite-${hash(debut)}`, {
      prompt: `Dis la suite de la comptine : ${g(`${debut}…`)}`,
      spoken: suite,
      answer: mot,
      accepted: [mot, suite],
      explication: `On chante : ${g(suite)}.`,
      difficulty: DIFF[n],
    }),
  );
  const heros = pour(level, OEUVRES).map((o) =>
    oral(ctx, `heros-${hash(o.heros)}`, {
      prompt: `Qui suis-je ? ${o.indices[1]} ${o.indices[2]} Dis le nom du personnage.`,
      answer: o.heros,
      accepted: [o.heros, o.heros.replace(/^(le|la|les) /i, '')],
      explication: `C’est ${o.heros}, dans « ${titre(o)} ».`,
      difficulty: DIFF[o.niv],
    }),
  );
  return [...comptines, ...heros];
}

/** Mots des contes à savoir écrire (jeux d'écriture). */
const MOTS: M[] = [
  ['loup', 'animal sauvage qui fait peur dans beaucoup de contes', 'f'],
  ['fée', 'personnage magique qui a une baguette', 'f'],
  ['roi', 'il porte une couronne et règne sur un royaume', 'f'],
  ['reine', 'femme qui règne, ou épouse du roi', 'f'],
  ['ogre', 'géant des contes qui veut manger les enfants', 'f'],
  ['château', 'grande demeure du roi et de la reine', 'f'],
  ['prince', 'fils du roi', 'f'],
  ['princesse', 'fille du roi', 'n'],
  ['sorcière', 'personnage méchant qui fait de la magie', 'n'],
  ['galette', 'gâteau que le Petit Chaperon rouge apporte à sa grand-mère', 'n'],
  ['citrouille', 'la fée la change en carrosse pour Cendrillon', 'n'],
  ['carrosse', 'voiture tirée par des chevaux, qui emmène Cendrillon au bal', 'n'],
  ['pantoufle', 'Cendrillon perd la sienne, en verre, à minuit', 'n'],
  ['forêt', 'grand bois où se perdent souvent les héros des contes', 'n'],
  ['conte', 'histoire merveilleuse qui commence souvent par « Il était une fois »', 'n'],
  ['fable', 'courte histoire où des animaux parlent, avec une morale', 'p'],
  ['comptine', 'petite chanson ou petit poème qu’on récite en rythme', 'p'],
  ['baguette', 'la fée s’en sert pour faire de la magie', 'p'],
  ['marraine', 'la ___ de Cendrillon est une fée', 'p'],
  ['personnage', 'héros ou héroïne d’une histoire', 'p'],
];

export const CULTURE_CE1: ContentModule = {
  'CE1.FR.LEC.CULTURE': {
    pools: {
      mcq: poolQcm,
      true_false: poolVraiFaux,
      pairing: poolPaires,
      classification: poolClasser,
      ordering: poolEtapes,
      oral_answer: poolOral,
      spelling_word: poolMotsCles(motsDe(MOTS)),
    },
  },
};
