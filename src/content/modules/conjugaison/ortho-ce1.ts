/**
 * CE1 — Orthographe lexicale (BO n°41 du 31/10/2024, cycle 2, CE1, « Mémoriser l'orthographe des mots ») :
 * - lettre muette finale par un mot de la même famille : « blanc/blanche, sang/sanguin » ; « chant/chanter,
 *   surpris/surprise » (CE1.FR.ORTH.MUETTE) ;
 * - « Tenir compte des accents » (CE1.FR.ORTH.ACCENTS) ;
 * - mots invariables en listes analogiques : « tôt/aussitôt/plutôt » ; « ici/là-bas/loin/près »
 *   (CE1.FR.ORTH.INVARIABLES, en complément des listes de dictée de data/dictees/ce1_mots.json).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { distinctsPar, distracteurs, make, mcq, trou, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Lettre muette finale                                                */
/* ------------------------------------------------------------------ */

interface Muette {
  mot: string;
  lettre: string;
  famille: string;
  /** Phrase avec {} à la place du mot. */
  phrase: string;
}

const m = (mot: string, famille: string, phrase: string): Muette => ({
  mot,
  lettre: mot.slice(-1),
  famille,
  phrase,
});

const MUETTES: Record<Level, Muette[]> = {
  facile: [
    m('chat', 'chaton', 'Le {} dort au soleil.'),
    m('petit', 'petite', 'Mon {} frère fait la sieste.'),
    m('grand', 'grande', 'Le {} arbre perd ses feuilles.'),
    m('rond', 'ronde', 'Le ballon est {}.'),
    m('gros', 'grosse', 'Un {} nuage cache le soleil.'),
    m('lait', 'laitier', 'Je bois un verre de {}.'),
    m('dent', 'dentiste', 'Léa a perdu une {} de lait.'),
    m('saut', 'sauter', 'Le kangourou fait un grand {}.'),
    m('froid', 'froide', 'Le vent est {} ce matin.'),
    m('chaud', 'chaude', 'Le chocolat est très {}.'),
    m('gris', 'grise', 'Le ciel est tout {}.'),
    m('haut', 'hauteur', 'Le mur est très {}.'),
    m('bavard', 'bavarder', 'Mon voisin de table est {}.'),
    m('sport', 'sportif', 'Le judo est mon {} préféré.'),
    m('fruit', 'fruitier', 'Je mange un {} au goûter.'),
  ],
  normal: [
    m('chant', 'chanter', 'J’écoute le {} des oiseaux.'),
    m('blanc', 'blanche', 'Mon chat est tout {}.'),
    m('sang', 'sanguin', 'Le cœur fait circuler le {}.'),
    m('surpris', 'surprise', 'Tom est {} par le cadeau.'),
    m('long', 'longue', 'Ce serpent est très {}.'),
    m('tricot', 'tricoter', 'Mamie porte un {} rouge.'),
    m('galop', 'galoper', 'Le cheval part au {}.'),
    m('lourd', 'lourde', 'Ce sac est trop {}.'),
    m('tapis', 'tapisser', 'Le chat dort sur le {}.'),
    m('bord', 'border', 'Nous marchons au {} de la mer.'),
    m('toit', 'toiture', 'Un oiseau s’est posé sur le {}.'),
    m('bruit', 'bruitage', 'Le moteur fait trop de {}.'),
    m('camp', 'camper', 'Les scouts installent le {} près du lac.'),
    m('marchand', 'marchande', 'Le {} vend des fruits.'),
    m('gourmand', 'gourmandise', 'Mon chien est très {}.'),
    m('regard', 'regarder', 'Le hibou a un {} perçant.'),
    m('retard', 'retarder', 'Le train a du {}.'),
    m('enfant', 'enfantin', 'Un {} joue dans le parc.'),
    m('tard', 'tarder', 'Il est {} : au lit !'),
    m('petit', 'petite', 'Le {} chien aboie.'),
  ],
  plus_loin: [
    m('plomb', 'plombier', 'Ce sac est lourd comme du {}.'),
    m('début', 'débuter', 'Le film est au {}.'),
    m('accord', 'accorder', 'Mes parents sont d’{}.'),
    m('art', 'artiste', 'Le dessin est un {}.'),
    m('sirop', 'sirupeux', 'Je bois un {} de fraise.'),
    m('dos', 'dossier', 'J’ai mal au {}.'),
    m('repos', 'reposer', 'Après la course, c’est l’heure du {}.'),
    m('permis', 'permission', 'Ma tante a passé son {} de conduire.'),
    m('hasard', 'hasardeux', 'J’ai trouvé ce trésor par {}.'),
    m('éclat', 'éclater', 'Un {} de rire résonne dans la classe.'),
    m('bond', 'bondir', 'Le chat fait un {} sur la table.'),
    m('climat', 'climatique', 'Le {} de la montagne est froid.'),
    m('chocolat', 'chocolaterie', 'J’adore le {} chaud.'),
    m('drap', 'draperie', 'Le {} du lit est tout blanc.'),
    m('nord', 'nordique', 'Le vent du {} est glacé.'),
  ],
};

const LETTRES = ['t', 'd', 's', 'x', 'p', 'c', 'g', 'b'];

function muetteTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const x = rng.pick(MUETTES[level]);
  const prefixe = x.mot.slice(0, x.mot.length - x.lettre.length);
  const sentence = x.phrase.replace('{}', `${prefixe}___`);
  const proches: Record<string, string[]> = {
    t: ['d', 's'],
    d: ['t', 's'],
    s: ['x', 't'],
    p: ['b', 't'],
    c: ['g', 't'],
    g: ['c', 'd'],
    b: ['p', 'd'],
  };
  return trou(ctx, rng, 'muette', {
    sentence,
    answer: x.lettre,
    wrong: [...(proches[x.lettre] ?? []), ...LETTRES],
    nbChoix: level === 'facile' ? 3 : 4,
    explication: `Dans « ${x.famille} », on entend le « ${x.lettre} » : on écrit « ${x.mot} » avec un ${x.lettre} muet à la fin.`,
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
    meta: { famille: x.famille },
  });
}

/** QCM : quel mot de la même famille fait entendre la lettre muette ? */
function muetteQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const x = rng.pick(MUETTES[level]);
  const autres = MUETTES[level].filter((y) => y.mot.slice(0, 3) !== x.mot.slice(0, 3)).map((y) => y.famille);
  return mcq(ctx, rng, 'famille', {
    question: `Quel mot de la même famille t’aide à trouver la lettre muette de « ${x.mot} » ?`,
    good: x.famille,
    wrong: autres,
    explication: `« ${x.famille} » est de la même famille que « ${x.mot} » et fait entendre le « ${x.lettre} » : ${x.mot}.`,
    difficulty: { facile: 0.3, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

/* ------------------------------------------------------------------ */
/* Accents                                                             */
/* ------------------------------------------------------------------ */

interface MotAccent {
  mot: string;
  /** Lettre accentuée visée (si le mot en a plusieurs). */
  cible: string;
  phrase: string;
}

const ac = (mot: string, phrase: string, cible?: string): MotAccent => ({
  mot,
  cible: cible ?? [...mot].find((c) => /[éèêëïîçâô]/.test(c))!,
  phrase,
});

const ACCENTS: Record<Level, MotAccent[]> = {
  facile: [
    ac('été', 'En {}, il fait chaud.'),
    ac('école', 'Je vais à l’{} à pied.'),
    ac('bébé', 'Le {} dort dans son berceau.'),
    ac('vélo', 'Tom fait du {} dans la rue.'),
    ac('café', 'Papa boit un {}.'),
    ac('étoile', 'Une {} brille dans le ciel.'),
    ac('fée', 'La {} a une baguette magique.'),
    ac('mère', 'Ma {} lit une histoire.'),
    ac('père', 'Mon {} répare le vélo.'),
    ac('frère', 'Mon {} a sept ans.'),
    ac('zèbre', 'Le {} a des rayures.'),
    ac('chèvre', 'La {} mange de l’herbe.'),
    ac('rivière', 'Les canards nagent sur la {}.'),
    ac('crème', 'J’aime la {} au chocolat.'),
  ],
  normal: [
    ac('éléphant', 'L’{} a une longue trompe.'),
    ac('téléphone', 'Le {} sonne.'),
    ac('écureuil', 'L’{} grimpe dans l’arbre.'),
    ac('élève', 'Chaque {} a un cahier.', 'è'),
    ac('très', 'Il fait {} froid.'),
    ac('après', 'Je joue {} le goûter.'),
    ac('lumière', 'Éteins la {}, s’il te plaît.'),
    ac('sorcière', 'La {} prépare une potion.'),
    ac('fête', 'Nous préparons la {} de l’école.'),
    ac('tête', 'J’ai un bonnet sur la {}.'),
    ac('forêt', 'Le loup vit dans la {}.'),
    ac('fenêtre', 'Le chat regarde par la {}.'),
    ac('crêpe', 'Je mange une {} au sucre.'),
    ac('rêve', 'Cette nuit, j’ai fait un beau {}.'),
    ac('pêche', 'La {} est un fruit très doux.'),
    ac('guêpe', 'Une {} vole près du gâteau.'),
    ac('tempête', 'La {} a fait tomber un arbre.'),
    ac('même', 'Nous avons le {} sac.'),
  ],
  plus_loin: [
    ac('Noël', 'À {}, nous décorons le sapin.'),
    ac('maïs', 'Les poules mangent du {}.'),
    ac('canoë', 'Nous descendons la rivière en {}.'),
    ac('garçon', 'Le {} joue au ballon.'),
    ac('leçon', 'J’apprends ma {}.'),
    ac('glaçon', 'Je mets un {} dans mon verre.'),
    ac('maçon', 'Le {} construit un mur.'),
    ac('reçu', 'J’ai {} une lettre.'),
    ac('château', 'Le roi habite dans un {}.'),
    ac('gâteau', 'Mamie prépare un {}.'),
    ac('hôpital', 'Le docteur travaille à l’{}.'),
    ac('âne', 'L’{} mange du foin.'),
    ac('bâton', 'Le chien rapporte le {}.'),
    ac('fenêtre', 'Ouvre la {}, il fait chaud.'),
  ],
};

const VARIANTES: Record<string, string[]> = {
  é: ['è', 'ê', 'e'],
  è: ['é', 'ê', 'e'],
  ê: ['è', 'é', 'e'],
  ë: ['e', 'é', 'è'],
  ï: ['i', 'î'],
  î: ['i', 'ï'],
  ç: ['c', 'ss'],
  â: ['a', 'à'],
  ô: ['o', 'au'],
};

function fautesAccent(x: MotAccent, level: Level): string[] {
  const i = x.mot.indexOf(x.cible);
  const vs = (VARIANTES[x.cible] ?? []).filter((v) => level !== 'facile' || !['ê'].includes(v));
  return vs.map((v) => x.mot.slice(0, i) + v + x.mot.slice(i + x.cible.length));
}

const regleAccent = (x: MotAccent): string => {
  switch (x.cible) {
    case 'é':
      return `On entend « é » (comme dans été) : on écrit é → ${x.mot}.`;
    case 'è':
      return `On entend « è » (comme dans mère) : ici, on écrit è → ${x.mot}.`;
    case 'ê':
      return `On entend « è », mais ce mot s’écrit avec un accent circonflexe : ${x.mot}. Je l’apprends par cœur.`;
    case 'ë':
    case 'ï':
      return `Le tréma ( ¨ ) montre qu’on prononce les deux voyelles séparément : ${x.mot}.`;
    case 'ç':
      return `Devant a, o, u, la cédille fait chanter le c comme un s : ${x.mot}.`;
    default:
      return `Ce mot s’écrit avec un accent circonflexe : ${x.mot}. Je l’apprends par cœur.`;
  }
};

const ASTUCE_ACCENT: Record<string, string> = {
  é: 'Écoute bien le son : « é » s’écrit é ; « è » s’écrit è ou ê.',
  è: 'Écoute bien le son : « é » s’écrit é ; « è » s’écrit è ou ê.',
  ê: 'Écoute bien le son : « é » s’écrit é ; « è » s’écrit è ou ê.',
  ë: 'Le tréma ( ¨ ) sépare deux voyelles qu’on prononce l’une après l’autre.',
  ï: 'Le tréma ( ¨ ) sépare deux voyelles qu’on prononce l’une après l’autre.',
  ç: 'Devant a, o, u, il faut une cédille pour que le c chante « s ».',
  â: 'Certains mots prennent un accent circonflexe : souviens-toi de ce mot.',
  ô: 'Certains mots prennent un accent circonflexe : souviens-toi de ce mot.',
};

function accentTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const x = rng.pick(ACCENTS[level]);
  return trou(ctx, rng, 'accent', {
    sentence: x.phrase.replace('{}', '___'),
    answer: x.mot,
    wrong: fautesAccent(x, level),
    nbChoix: 3,
    hint: ASTUCE_ACCENT[x.cible] ?? 'Regarde bien les accents : ce mot s’apprend par cœur.',
    explication: regleAccent(x),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

function accentQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const x = rng.pick(ACCENTS[level]);
  return mcq(ctx, rng, 'accent', {
    question: 'Quel mot est bien écrit ?',
    spoken: `Quel mot est bien écrit ? ${x.mot}.`,
    good: x.mot,
    wrong: fautesAccent(x, level),
    explication: regleAccent(x),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

function accentMot(level: Level, rng: Rng, ctx: GenContext): ItemOf<'spelling_word'> {
  const x = rng.pick(ACCENTS[level]);
  return make(ctx, 'spelling_word', 'accent', {
    word: x.mot,
    sentence: x.phrase.replace('{}', x.mot),
    isSentence: false,
    source: 'programme',
    explication: regleAccent(x),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

/* ------------------------------------------------------------------ */
/* Mots invariables                                                    */
/* ------------------------------------------------------------------ */

interface Invariable {
  mot: string;
  fautes: string[];
  phrase: string;
  /** Astuce d'analogie (liste analogique du BO). */
  astuce?: string;
}

const TOT = 'Comme « tôt » : aussitôt, plutôt, bientôt s’écrivent avec ô et un t muet.';
const inv = (mot: string, fautes: string[], phrase: string, astuce?: string): Invariable => ({
  mot,
  fautes,
  phrase,
  astuce,
});

const INVARIABLES: Record<Level, Invariable[]> = {
  facile: [
    inv('avec', ['avek', 'avecque'], 'Je joue {} mon frère.'),
    inv('dans', ['dant', 'dents'], 'Le chat dort {} son panier.'),
    inv('sur', ['sure', 'sûr'], 'Le livre est {} la table.'),
    inv('sous', ['sou', 'souts'], 'Le chien dort {} la table.'),
    inv('pour', ['pourt', 'pours'], 'Ce cadeau est {} toi.'),
    inv('très', ['trè', 'tré'], 'Il fait {} chaud.'),
    inv('ici', ['issi', 'icit'], 'Viens {}, s’il te plaît.'),
    inv(
      'loin',
      ['loins', 'louin'],
      'La mer est {} de chez moi.',
      'Comme « loin » et « près », les mots qui disent où ne changent jamais.',
    ),
    inv(
      'près',
      ['prè', 'prés'],
      'J’habite {} de l’école.',
      'Comme « loin » et « près », les mots qui disent où ne changent jamais.',
    ),
    inv('hier', ['hiers', 'hièr'], '{}, il a plu toute la journée.'),
  ],
  normal: [
    inv('toujours', ['toujour', 'toujourt'], 'Mon chat dort {} sur mon lit.'),
    inv('jamais', ['jamai', 'jamé'], 'Je ne mange {} de piment.'),
    inv('souvent', ['souvant', 'souven'], 'Nous allons {} au parc.'),
    inv('beaucoup', ['beaucou', 'bocoup'], 'Il y a {} de monde.'),
    inv('tôt', ['tot', 'tôs'], 'Je me lève {} le matin.', TOT),
    inv('aussitôt', ['aussitot', 'ausitôt'], 'Le chat est parti {}.', TOT),
    inv('plutôt', ['plutot', 'plustôt'], 'Je préfère {} la mer.', TOT),
    inv('bientôt', ['bientot', 'bientôs'], 'Ce sera {} les vacances.', TOT),
    inv(
      'là-bas',
      ['la-bas', 'là-ba'],
      'Regarde le bateau, {} !',
      'Comme « ici », « là-bas » dit où : il ne change jamais (là-bas prend un accent sur le à).',
    ),
    inv('demain', ['demin', 'deumain'], '{}, nous irons au cirque.'),
    inv('maintenant', ['maintenan', 'maintenent'], 'Range ta chambre {} !'),
    inv('encore', ['encor', 'enquore'], 'Je veux {} du gâteau.'),
    inv('ensuite', ['ansuite', 'ensuitte'], 'Je me lave, {} je déjeune.'),
    inv('enfin', ['enfain', 'anfin'], 'Le bus arrive {}.'),
    inv('depuis', ['depui', 'deupuis'], 'Il pleut {} ce matin.'),
    inv('pendant', ['pendent', 'pandant'], 'J’ai dormi {} le voyage.'),
    inv('devant', ['devent', 'devan'], 'Le chien attend {} la porte.'),
    inv('derrière', ['derière', 'derrièr'], 'Le chat se cache {} le rideau.'),
    inv('après', ['aprés', 'aprè'], 'On jouera {} le repas.'),
    inv('avant', ['avent', 'avan'], 'Lave-toi les mains {} de manger.'),
    inv('aussi', ['ausi', 'aussit'], 'Moi {}, j’aime les crêpes.'),
    inv('chez', ['chés', 'chèz'], 'Je vais {} ma grand-mère.'),
    inv('mais', ['mai', 'mès'], 'Il fait beau {} il fait froid.'),
  ],
  plus_loin: [
    inv('aujourd’hui', ['aujourdui', 'aujourd’ui'], '{}, c’est mercredi.'),
    inv('longtemps', ['longtemp', 'lontemps'], 'J’ai attendu {} le bus.'),
    inv('autrefois', ['autrefoi', 'autrefoit'], '{}, on s’éclairait à la bougie.'),
    inv('quelquefois', ['quelque fois', 'quelquesfois'], 'Je vais {} à la piscine.'),
    inv('parce que', ['parceque', 'par ce que'], 'Je mets un bonnet {} il fait froid.'),
    inv('peut-être', ['peut être', 'peutêtre'], 'Il viendra {} demain.'),
    inv('ensemble', ['ensemblent', 'ansemble'], 'Nous jouons {} dans la cour.'),
    inv('dehors', ['dehor', 'deors'], 'Les enfants jouent {}.'),
    inv('déjà', ['déja', 'deja'], 'Tu as {} fini ?'),
    inv('assez', ['asser', 'assé'], 'J’ai {} mangé.'),
    inv('trop', ['trot', 'tro'], 'Cette soupe est {} chaude.'),
    inv('vraiment', ['vraimant', 'vrèment'], 'Ce film est {} drôle.'),
    inv('plutôt', ['plutot', 'plustôt'], 'Il est {} timide.', TOT),
  ],
};

/** Plus loin : aussi les mots du niveau normal. */
const invPool = (level: Level) =>
  level === 'plus_loin' ? [...INVARIABLES.plus_loin, ...INVARIABLES.normal] : INVARIABLES[level];

const regleInv = (x: Invariable) =>
  `${x.astuce ?? 'C’est un mot invariable : il ne change jamais, je l’apprends par cœur.'} On écrit « ${x.mot} ».`;

/** La phrase commence par le trou : majuscule. */
const avecMot = (phrase: string, mot: string) =>
  phrase.startsWith('{}')
    ? mot[0]!.toUpperCase() + mot.slice(1) + phrase.slice(2)
    : phrase.replace('{}', mot);

function invTrou(level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> {
  const x = rng.pick(invPool(level));
  const tete = x.phrase.startsWith('{}');
  const capi = (s: string) => (tete ? s[0]!.toUpperCase() + s.slice(1) : s);
  return trou(ctx, rng, 'invariable', {
    sentence: x.phrase.replace('{}', '___'),
    answer: capi(x.mot),
    wrong: x.fautes.map(capi),
    nbChoix: 3,
    // l'astuce ne doit pas donner la réponse (« Comme loin et près… » pour « près »)
    hint:
      x.astuce && !x.astuce.includes(`« ${x.mot} »`)
        ? x.astuce
        : 'Un mot invariable ne change jamais : souviens-toi de son orthographe.',
    explication: regleInv(x),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

function invVraiFaux(level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> {
  const x = rng.pick(invPool(level));
  const vrai = rng.chance(0.5);
  const montre = vrai ? x.mot : rng.pick(distracteurs(rng, x.fautes, [x.mot], 2));
  return vraiFaux(ctx, 'invariable', {
    statement: `Le mot invariable est bien écrit : « ${avecMot(x.phrase, montre)} »`,
    answer: montre === x.mot,
    explication: regleInv(x),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

function muettePaires(level: Level, rng: Rng, ctx: GenContext): ItemOf<'pairing'> {
  const mots = distinctsPar(rng, MUETTES[level], 5, (x) => x.mot);
  return make(ctx, 'pairing', 'famille', {
    prompt: 'Associe chaque mot au mot de sa famille qui fait entendre la lettre muette.',
    pairs: mots.map((x) => ({ left: x.mot, right: x.famille })),
    relation: 'mot → mot de la même famille',
    explication: 'Pour trouver la lettre muette, je cherche un mot de la même famille : chant → chanter.',
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

function accentPaires(level: Level, rng: Rng, ctx: GenContext): ItemOf<'pairing'> {
  const mots = distinctsPar(rng, ACCENTS[level], 4, (x) => x.mot);
  return make(ctx, 'pairing', 'accent', {
    prompt: 'Associe chaque phrase au mot bien écrit qui la complète.',
    pairs: mots.map((x) => ({ left: x.phrase.replace('{}', '___'), right: x.mot })),
    relation: 'phrase → mot',
    explication: 'Regarde bien les accents : é (été), è (mère), ê (fête).',
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level],
  });
}

export const ORTHO_CE1: Record<string, LessonContent> = {
  'CE1.FR.ORTH.MUETTE': { gens: { fill_blank: muetteTrou, mcq: muetteQcm, pairing: muettePaires } },
  'CE1.FR.ORTH.ACCENTS': {
    gens: { fill_blank: accentTrou, mcq: accentQcm, spelling_word: accentMot, pairing: accentPaires },
  },
  'CE1.FR.ORTH.INVARIABLES': { gens: { fill_blank: invTrou, true_false: invVraiFaux } },
};

/** Pour les tests. */
export const LEXIQUES_ORTHO = { MUETTES, ACCENTS, INVARIABLES };
