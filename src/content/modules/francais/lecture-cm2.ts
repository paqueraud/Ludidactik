/**
 * CM2 — Lecture. BO n°16 du 17/04/2025 (CM2) : « lire correctement en ciblant 120 mots par minute »,
 * en tenant compte « des marques de ponctuation, des liaisons et des unités syntaxiques » ; restituer
 * l'essentiel d'un texte avec des informations explicites et implicites ; reconnaître les genres ;
 * rapprocher deux documents ; au moins 3 œuvres du patrimoine (entrées : héros et héroïnes, merveilleux
 * et étrange, autres vies, morale, poésie, rapport aux autres).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { poolComprehension, poolEtapes, poolFluence } from './textes';
import { aucun, classer, diff, g, oral, ordre, paires, parNiv, qcm, tirer } from './util';

/* ------------------------------------------------------------------ */
/* Fluence : liaisons                                                  */
/* ------------------------------------------------------------------ */

/** [groupe, explication, niveau]. */
const LIAISONS: [string, string, 'f' | 'n' | 'p'][] = [
  ['les enfants', 'On fait la liaison : les‿enfants se dit « lé-z-enfants ».', 'f'],
  ['un ami', 'On fait la liaison : un‿ami se dit « un-n-ami ».', 'f'],
  ['nous avons', 'On fait la liaison : nous‿avons se dit « nou-z-avons ».', 'f'],
  ['ils arrivent', 'On fait la liaison : ils‿arrivent se dit « il-z-arrivent ».', 'f'],
  ['deux heures', 'On fait la liaison : deux‿heures se dit « deu-z-heures ».', 'n'],
  ['un grand homme', 'On fait la liaison : grand‿homme se dit « gran-t-homme ».', 'n'],
  ['c’est important', 'On fait la liaison : c’est‿important se dit « cé-t-important ».', 'n'],
  ['quand il pleut', 'On fait la liaison : quand‿il se dit « quan-t-il ».', 'n'],
  ['les petits oiseaux', 'Une liaison : les petits‿oiseaux se dit « lé peti-z-oiseaux ».', 'n'],
  ['très intéressant', 'On fait la liaison : très‿intéressant se dit « tré-z-intéressant ».', 'n'],
  ['les héros', 'Devant un h aspiré, on ne fait pas de liaison : les | héros.', 'p'],
  ['un hibou', 'Devant un h aspiré, pas de liaison : un | hibou.', 'p'],
  ['Léon et Anna', 'Jamais de liaison après « et » : Léon et | Anna.', 'p'],
  ['neuf heures', 'Le f de neuf se prononce [v] : neu-v-heures.', 'p'],
];

function genLiaisons(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = LIAISONS.filter(([, , n]) =>
    parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: n !== 'f' }),
  );
  const [grp, expl] = rng.pick(dispo);
  const pasDeLiaison = /pas de liaison|Jamais de liaison/.test(expl);
  return oral(ctx, `liaison-${grp}`, {
    prompt: pasDeLiaison
      ? `Lis sans faire de liaison interdite : ${grp}`
      : `Lis en faisant la liaison : ${grp}`,
    answer: grp,
    accepted: [],
    explication: expl,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Culture littéraire                                                  */
/* ------------------------------------------------------------------ */

/** Œuvres du patrimoine : [titre, auteur, genre, niveau]. */
const OEUVRES: [string, string, string, 'f' | 'n' | 'p'][] = [
  ['Le Corbeau et le Renard', 'Jean de La Fontaine', 'fable', 'f'],
  ['La Cigale et la Fourmi', 'Jean de La Fontaine', 'fable', 'f'],
  ['Le Lièvre et la Tortue', 'Jean de La Fontaine', 'fable', 'n'],
  ['Le Petit Chaperon rouge', 'Charles Perrault', 'conte', 'f'],
  ['Le Petit Poucet', 'Charles Perrault', 'conte', 'f'],
  ['Le Chat botté', 'Charles Perrault', 'conte', 'n'],
  ['Hansel et Gretel', 'les frères Grimm', 'conte', 'f'],
  ['Les Musiciens de Brême', 'les frères Grimm', 'conte', 'n'],
  ['Le Vilain Petit Canard', 'Hans Christian Andersen', 'conte', 'f'],
  ['La Petite Sirène', 'Hans Christian Andersen', 'conte', 'n'],
  ['La Belle et la Bête', 'Jeanne-Marie Leprince de Beaumont', 'conte', 'n'],
  ['Le Tour du monde en quatre-vingts jours', 'Jules Verne', 'roman', 'f'],
  ['Vingt Mille Lieues sous les mers', 'Jules Verne', 'roman', 'n'],
  ['Les Misérables', 'Victor Hugo', 'roman', 'f'],
  ['Alice au pays des merveilles', 'Lewis Carroll', 'roman', 'n'],
  ['Les Aventures de Pinocchio', 'Carlo Collodi', 'roman', 'n'],
  ['Robinson Crusoé', 'Daniel Defoe', 'roman', 'p'],
  ['Sans famille', 'Hector Malot', 'roman', 'p'],
  ['L’Odyssée', 'Homère', 'épopée', 'n'],
  ['Les Fourberies de Scapin', 'Molière', 'théâtre', 'p'],
  ['Le Médecin malgré lui', 'Molière', 'théâtre', 'p'],
  ['Mignonne, allons voir si la rose', 'Pierre de Ronsard', 'poème', 'p'],
  ['Il pleure dans mon cœur', 'Paul Verlaine', 'poème', 'p'],
];
/** Personnages mystères : [personnage, œuvre, indices du plus difficile au plus facile, niveau]. */
const MYSTERES: [string, string, string[], 'f' | 'n' | 'p'][] = [
  [
    'Pinocchio',
    'Les Aventures de Pinocchio',
    [
      'Je suis né d’un morceau de bois.',
      'Un menuisier nommé Geppetto m’a fabriqué.',
      'Mon nez s’allonge quand je mens.',
    ],
    'f',
  ],
  [
    'le Petit Poucet',
    'Le Petit Poucet',
    [
      'Je suis le plus jeune de sept frères.',
      'Je sème des cailloux blancs pour retrouver le chemin.',
      'Je suis à peine plus grand qu’un pouce.',
    ],
    'f',
  ],
  [
    'Cosette',
    'Les Misérables',
    [
      'Je vis chez des aubergistes, à Montfermeil.',
      'Un soir de Noël, on m’envoie chercher de l’eau dans le bois.',
      'Je suis la petite fille des Misérables de Victor Hugo.',
    ],
    'n',
  ],
  [
    'Ulysse',
    'L’Odyssée',
    [
      'Je mets dix ans à rentrer chez moi, à Ithaque.',
      'Je trompe un cyclope en lui disant que je m’appelle « Personne ».',
      'Ma femme Pénélope m’attend en tissant une toile.',
    ],
    'n',
  ],
  [
    'Phileas Fogg',
    'Le Tour du monde en quatre-vingts jours',
    [
      'Je suis un gentleman anglais très ponctuel.',
      'J’ai fait un pari avec les membres de mon club.',
      'Avec mon domestique Passepartout, je fais le tour du monde en quatre-vingts jours.',
    ],
    'n',
  ],
  [
    'Alice',
    'Alice au pays des merveilles',
    [
      'Je suis une petite fille anglaise très curieuse.',
      'Je suis un lapin blanc pressé jusque dans son terrier.',
      'Je grandis et je rapetisse au pays des merveilles.',
    ],
    'f',
  ],
  [
    'le capitaine Nemo',
    'Vingt Mille Lieues sous les mers',
    [
      'Je refuse de vivre sur la terre ferme.',
      'Je commande un sous-marin extraordinaire, le Nautilus.',
      'Jules Verne m’a inventé.',
    ],
    'p',
  ],
  [
    'Robinson Crusoé',
    'Robinson Crusoé',
    [
      'Mon bateau a fait naufrage.',
      'Je survis seul pendant des années sur une île.',
      'J’appelle mon compagnon Vendredi.',
    ],
    'p',
  ],
  [
    'le Vilain Petit Canard',
    'Le Vilain Petit Canard',
    [
      'Tout le monde se moque de moi à cause de mon apparence.',
      'Je passe un hiver difficile, tout seul.',
      'Au printemps, je découvre que je suis un magnifique cygne.',
    ],
    'f',
  ],
  [
    'la Cigale',
    'La Cigale et la Fourmi',
    [
      'J’ai chanté tout l’été.',
      'Quand l’hiver arrive, je n’ai plus rien à manger.',
      'Ma voisine la Fourmi refuse de me prêter quelques grains.',
    ],
    'f',
  ],
];
/** Morales de La Fontaine (citations, domaine public). */
const MORALES: [string, string, 'n' | 'p'][] = [
  ['Rien ne sert de courir ; il faut partir à point.', 'Le Lièvre et la Tortue', 'n'],
  ['On a souvent besoin d’un plus petit que soi.', 'Le Lion et le Rat', 'n'],
  ['Tout flatteur vit aux dépens de celui qui l’écoute.', 'Le Corbeau et le Renard', 'n'],
  ['La raison du plus fort est toujours la meilleure.', 'Le Loup et l’Agneau', 'p'],
];
const GENRES: Record<string, string> = {
  fable: 'une fable : un court récit, souvent en vers, avec des animaux et une morale',
  conte: 'un conte : un récit merveilleux qui commence souvent par « Il était une fois »',
  roman: 'un roman : un long récit découpé en chapitres',
  épopée: 'une épopée : un long poème qui raconte les exploits d’un héros',
  théâtre: 'une pièce de théâtre : un texte écrit pour être joué, avec des dialogues',
  poème: 'un poème : un texte en vers, avec des rimes et un rythme',
};
/** Étapes de contes du patrimoine. */
const ETAPES_CONTES: [string, string[]][] = [
  [
    'Le Petit Chaperon rouge',
    [
      'Sa mère l’envoie porter une galette à sa grand-mère.',
      'Elle rencontre le loup dans le bois.',
      'Le loup arrive le premier chez la grand-mère.',
      'Le Petit Chaperon rouge frappe à la porte de la maison.',
    ],
  ],
  [
    'Le Petit Poucet',
    [
      'Les parents, trop pauvres, laissent leurs enfants dans la forêt.',
      'Le Petit Poucet retrouve le chemin grâce aux cailloux.',
      'Les enfants arrivent chez l’ogre.',
      'Le Petit Poucet prend les bottes de sept lieues.',
    ],
  ],
  [
    'Cendrillon',
    [
      'Cendrillon vit avec sa belle-mère et ses demi-sœurs.',
      'Sa marraine la fée la prépare pour le bal.',
      'Elle perd une pantoufle de verre en partant à minuit.',
      'Le prince retrouve Cendrillon grâce à la pantoufle.',
    ],
  ],
  [
    'Le Lièvre et la Tortue',
    [
      'La Tortue lance un défi au Lièvre.',
      'Le Lièvre, sûr de gagner, prend son temps.',
      'La Tortue avance sans s’arrêter.',
      'La Tortue arrive la première.',
    ],
  ],
];

const okNiv = (level: Level, n: 'f' | 'n' | 'p') =>
  parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: true });

function genCultureQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const mode = parNiv(level, {
    facile: rng.pick(['mystere', 'auteur']),
    normal: rng.pick(['mystere', 'auteur', 'genre', 'morale']),
    plus_loin: rng.pick(['mystere', 'genre', 'morale', 'auteur']),
  });
  if (mode === 'mystere') {
    const [perso, oeuvre, indices] = rng.pick(MYSTERES.filter(([, , , n]) => okNiv(level, n)));
    return qcm(ctx, rng, `mystere-${perso}`, {
      question: `Qui suis-je ? ${indices.join(' ')}`,
      good: perso,
      wrong: MYSTERES.map(([p]) => p),
      max: 4,
      hints: indices,
      explication: `C’est ${perso}, personnage de l’œuvre « ${oeuvre} ».`,
      difficulty: diff(level, rng.next()),
    });
  }
  if (mode === 'morale') {
    const [m, fable] = rng.pick(MORALES.filter(([, , n]) => level === 'plus_loin' || n === 'n'));
    return qcm(ctx, rng, `morale-${fable}`, {
      question: `De quelle fable de La Fontaine vient cette morale : ${g(m)} ?`,
      good: fable,
      wrong: MORALES.map(([, f]) => f),
      max: 3,
      explication: `Cette morale se trouve dans la fable « ${fable} » de Jean de La Fontaine.`,
      difficulty: diff(level, 0.7),
    });
  }
  const [titre, auteur, genre] = rng.pick(OEUVRES.filter(([, , , n]) => okNiv(level, n)));
  if (mode === 'genre')
    return qcm(ctx, rng, `genre-${titre}`, {
      question: `À quel genre appartient « ${titre} » (${auteur}) ?`,
      good: genre,
      wrong: Object.keys(GENRES),
      max: 4,
      explication: `« ${titre} » est ${GENRES[genre]}.`,
      difficulty: diff(level, rng.next()),
    });
  return qcm(ctx, rng, `auteur-${titre}`, {
    question: `Qui a écrit « ${titre} » ?`,
    good: auteur,
    wrong: [...new Set(OEUVRES.map(([, a]) => a))],
    max: level === 'facile' ? 3 : 4,
    explication:
      auteur === 'les frères Grimm'
        ? `« ${titre} » a été recueilli par les frères Grimm.`
        : `« ${titre} » a été écrit par ${auteur}.`,
    difficulty: diff(level, rng.next()),
  });
}

function genCulturePaires(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = OEUVRES.filter(([, , , n]) => okNiv(level, n));
  const choisis: (typeof OEUVRES)[number][] = [];
  for (const o of rng.shuffle(dispo)) {
    if (choisis.some(([, a]) => a === o[1])) continue;
    choisis.push(o);
    if (choisis.length >= parNiv(level, { facile: 3, normal: 4, plus_loin: 5 })) break;
  }
  return paires(ctx, `oeuvres-${choisis.map(([t]) => t).join('|')}`, {
    prompt: 'Associe chaque œuvre à son auteur.',
    pairs: choisis.map(([t, a]) => ({ left: t, right: a })),
    relation: 'œuvre → auteur',
    explication: choisis.map(([t, a]) => `« ${t} » : ${a}`).join(' ; ') + '.',
    difficulty: diff(level, rng.next()),
  });
}

function genCultureClasser(level: Level, rng: Rng, ctx: GenContext): Item {
  const genres = parNiv(level, {
    facile: ['fable', 'conte'],
    normal: ['fable', 'conte', 'roman'],
    plus_loin: ['fable', 'conte', 'roman', 'théâtre'],
  });
  const choisis = genres.flatMap((gn) =>
    tirer(
      rng,
      OEUVRES.filter(([t, , k]) => k === gn && t.length <= 32),
      2,
    ),
  );
  return classer(ctx, rng, `genres-${choisis.map(([t]) => t).join('|')}`, {
    prompt: 'Range chaque œuvre selon son genre.',
    categories: genres,
    elements: choisis.map(([t, , k]): [string, number] => [t, genres.indexOf(k)]),
    explication: genres.map((gn) => GENRES[gn]).join(' ; ') + '.',
    difficulty: diff(level, rng.next()),
  });
}

function genCultureOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const [titre, etapes] = rng.pick(ETAPES_CONTES);
  return ordre(ctx, `etapes-${titre}`, {
    prompt: `Remets dans l’ordre les étapes de l’histoire « ${titre} ».`,
    elements: level === 'facile' ? etapes.slice(0, 3) : etapes,
    mode: 'etapes',
    explication: `On se rappelle l’histoire de « ${titre} » : chaque étape entraîne la suivante.`,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const LECTURE_CM2: ContentModule = {
  'CM2.FR.LEC.FLUENCE': {
    gens: { oral_answer: genLiaisons },
    pools: {
      read_aloud: poolFluence(
        'CM2',
        { facile: 90, normal: 120, plus_loin: 130 },
        'Je lis par groupes de sens, je respecte la ponctuation et je fais les liaisons.',
      ),
    },
  },
  'CM2.FR.LEC.COMP': {
    pools: {
      mcq: poolComprehension('CM2'),
      ordering: poolEtapes('CM2'),
      true_false: aucun,
      pairing: aucun,
    },
  },
  'CM2.FR.LEC.CULTURE': {
    gens: {
      mcq: genCultureQcm,
      pairing: genCulturePaires,
      classification: genCultureClasser,
      ordering: genCultureOrdre,
    },
  },
};
