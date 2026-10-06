/**
 * Questionner le monde CE1 — « Se situer dans l'espace » (programme 2020, en vigueur en 2026-2027) :
 * se repérer (gauche/droite, plan, maquette, photo), le globe et le planisphère (6 continents,
 * 5 océans, la France), les paysages (ville, campagne, montagne, littoral).
 * Cartes : identifiants de src/games/_cartes/IDS.md (`monde`, `europe`).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, ItemOf, Level } from '../../schemas';
import {
  type Appariement,
  type Lieu,
  type Q,
  type Tri,
  type VF,
  hash,
  lieuPool,
  paireGen,
  qcmPool,
  triGen,
  vfPool,
} from './outils';

/* ------------------------------------------------------------------ */
/* Se repérer : gauche / droite, plans                                 */
/* ------------------------------------------------------------------ */

const ANIMAUX: [string, string][] = [
  ['🐱', 'le chat'],
  ['🐶', 'le chien'],
  ['🐰', 'le lapin'],
  ['🐸', 'la grenouille'],
  ['🐻', 'l’ours'],
  ['🐷', 'le cochon'],
  ['🦊', 'le renard'],
  ['🐼', 'le panda'],
];

const TAILLE: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };

/** Une file d'animaux vue de face, lue de gauche à droite. */
function file(level: Level, rng: Rng) {
  return rng.shuffle(ANIMAUX).slice(0, TAILLE[level]);
}
const dessin = (f: [string, string][]) => f.map((a) => a[0]).join(' ');
const nom = (a: [string, string]) => a[1];
const Nom = (a: [string, string]) => a[1].charAt(0).toUpperCase() + a[1].slice(1);
/** « du chat », « de la grenouille », « de l’ours ». */
const du = (a: [string, string]) => (a[1].startsWith('le ') ? `du ${a[1].slice(3)}` : `de ${a[1]}`);

interface Question {
  q: string;
  ok: [string, string];
  ex: string;
}

/** Question de position dans une file (la bonne réponse est unique). */
function questionFile(level: Level, rng: Rng): { f: [string, string][]; qu: Question } {
  const f = file(level, rng);
  const n = f.length;
  const d = dessin(f);
  const choix: Question[] = [];
  choix.push(
    { q: 'Qui est tout à gauche ?', ok: f[0]!, ex: `Tout à gauche de la file ${d}, il y a ${nom(f[0]!)}.` },
    {
      q: 'Qui est tout à droite ?',
      ok: f[n - 1]!,
      ex: `Tout à droite de la file ${d}, il y a ${nom(f[n - 1]!)}.`,
    },
  );
  if (level !== 'facile') {
    const i = rng.int(0, n - 2);
    choix.push({
      q: `Qui est juste à droite ${du(f[i]!)} ?`,
      ok: f[i + 1]!,
      ex: `Dans la file ${d}, juste à droite ${du(f[i]!)}, il y a ${nom(f[i + 1]!)}.`,
    });
    const j = rng.int(1, n - 1);
    choix.push({
      q: `Qui est juste à gauche ${du(f[j]!)} ?`,
      ok: f[j - 1]!,
      ex: `Dans la file ${d}, juste à gauche ${du(f[j]!)}, il y a ${nom(f[j - 1]!)}.`,
    });
  }
  if (level === 'plus_loin') {
    const k = rng.int(1, n - 2);
    choix.push({
      q: `Qui est entre ${nom(f[k - 1]!)} et ${nom(f[k + 1]!)} ?`,
      ok: f[k]!,
      ex: `Dans la file ${d}, ${nom(f[k]!)} est entre ${nom(f[k - 1]!)} et ${nom(f[k + 1]!)}.`,
    });
    choix.push({
      q: 'Qui est le deuxième en partant de la droite ?',
      ok: f[n - 2]!,
      ex: `En partant de la droite de la file ${d} : ${nom(f[n - 1]!)}, puis ${nom(f[n - 2]!)}.`,
    });
  }
  // facile : les extrémités ; ensuite, plutôt les positions relatives
  const qu = level === 'facile' ? rng.pick(choix) : rng.pick(choix.slice(rng.chance(0.25) ? 0 : 2));
  return { f, qu };
}

const PLANS_QCM: Q[] = [
  {
    n: 'f',
    id: 'fleche-gauche',
    q: 'Vers où montre cette flèche : ⬅️ ?',
    ok: 'vers la gauche',
    ko: ['vers la droite', 'vers le haut', 'vers le bas'],
    ex: 'La flèche ⬅️ montre la gauche ; ➡️ montre la droite.',
  },
  {
    n: 'f',
    id: 'fleche-droite',
    q: 'Vers où montre cette flèche : ➡️ ?',
    ok: 'vers la droite',
    ko: ['vers la gauche', 'vers le haut', 'vers le bas'],
    ex: 'La flèche ➡️ montre la droite ; ⬅️ montre la gauche.',
  },
  {
    n: 'f',
    id: 'fleche-haut',
    q: 'Vers où montre cette flèche : ⬆️ ?',
    ok: 'vers le haut',
    ko: ['vers le bas', 'vers la gauche', 'vers la droite'],
    ex: 'La flèche ⬆️ montre le haut.',
  },
  {
    n: 'n',
    id: 'plan-dessus',
    q: 'Un plan, c’est un dessin d’un lieu vu…',
    ok: 'd’au-dessus',
    ko: ['de côté', 'de dessous', 'de très loin, à l’horizon'],
    img: '🗺️',
    ex: 'Sur un plan, on dessine le lieu comme si on le regardait d’en haut, comme un oiseau.',
  },
  {
    n: 'n',
    id: 'maquette',
    q: 'Qu’est-ce qu’une maquette ?',
    ok: 'un modèle en petit d’un lieu ou d’un objet, en volume',
    ko: ['une photo prise d’un avion', 'un dessin vu de côté', 'une liste de mots'],
    ex: 'Une maquette reproduit un lieu en petit, en volume : on peut tourner autour.',
  },
  {
    n: 'n',
    id: 'photo-aerienne',
    q: 'Comment appelle-t-on une photo prise d’un avion ou d’un satellite ?',
    ok: 'une photo aérienne',
    ko: ['un portrait', 'une carte postale de la plage', 'une frise'],
    img: '✈️',
    ex: 'Une photo aérienne montre un lieu vu du ciel.',
  },
  {
    n: 'n',
    id: 'plan-classe',
    q: 'Sur le plan de la classe, que représentent les petits rectangles alignés ?',
    ok: 'les tables des élèves',
    ko: ['les élèves', 'les fenêtres du couloir', 'les livres'],
    ex: 'Sur un plan vu d’au-dessus, une table ressemble à un rectangle.',
  },
  {
    n: 'n',
    id: 'plan-utile',
    q: 'À quoi sert le plan d’un quartier ?',
    ok: 'à trouver son chemin',
    ko: ['à savoir l’heure', 'à compter les habitants', 'à connaître la météo'],
    ex: 'Le plan montre les rues et les bâtiments : il aide à trouver son chemin.',
  },
  {
    n: 'p',
    id: 'legende',
    q: 'Sur un plan, à quoi sert la légende ?',
    ok: 'à expliquer ce que veulent dire les couleurs et les symboles',
    ko: ['à donner l’heure', 'à raconter une histoire', 'à dessiner les maisons'],
    ex: 'La légende explique les couleurs et les petits dessins (symboles) du plan.',
  },
  {
    n: 'p',
    id: 'nord',
    q: 'Sur la plupart des plans et des cartes, où se trouve le nord ?',
    ok: 'en haut',
    ko: ['en bas', 'à gauche', 'à droite'],
    ex: 'On place généralement le nord en haut du plan.',
  },
  {
    n: 'p',
    id: 'bleu',
    q: 'Sur un plan, que représente souvent la couleur bleue ?',
    ok: 'l’eau (rivière, lac, mer)',
    ko: ['les routes', 'les maisons', 'les champs'],
    ex: 'Le bleu représente l’eau ; le vert, souvent les parcs et les forêts.',
  },
  {
    n: 'p',
    id: 'echelle',
    q: 'Sur le plan, 1 cm représente 1 m. Une table mesure 2 cm sur le plan. Combien mesure-t-elle en vrai ?',
    ok: '2 m',
    ko: ['1 m', '2 cm', '20 m'],
    ex: 'Chaque centimètre du plan vaut 1 mètre en vrai : 2 cm sur le plan, c’est 2 m.',
  },
  {
    n: 'n',
    id: 'qui-plan',
    q: 'Qui suis-je ?',
    ok: 'le plan',
    ko: ['le portrait', 'la frise', 'le calendrier'],
    img: '🗺️',
    hints: [
      'Je suis un dessin.',
      'On me dessine vu d’au-dessus.',
      'Je montre où sont les rues, les maisons ou les tables.',
      'On me regarde pour trouver son chemin.',
    ],
    ex: 'Le plan représente un lieu vu d’au-dessus.',
  },
  {
    n: 'p',
    id: 'qui-legende',
    q: 'Qui suis-je ?',
    ok: 'la légende',
    ko: ['le titre', 'l’échelle', 'la boussole'],
    img: '📋',
    hints: [
      'Je suis souvent dans un coin de la carte ou du plan.',
      'Je ressemble à un petit tableau.',
      'J’explique les couleurs et les symboles.',
      'Sans moi, on ne comprend pas les dessins de la carte.',
    ],
    ex: 'La légende explique ce que veulent dire les couleurs et les symboles.',
  },
  {
    n: 'n',
    id: 'qui-boussole',
    q: 'Qui suis-je ?',
    ok: 'la boussole',
    ko: ['la montre', 'la loupe', 'le thermomètre'],
    img: '🧭',
    hints: [
      'Je suis un petit objet.',
      'Mon aiguille bouge.',
      'Mon aiguille montre toujours le nord.',
      'Les randonneurs m’utilisent pour s’orienter.',
    ],
    ex: 'L’aiguille de la boussole indique le nord.',
  },
  {
    n: 'n',
    id: 'qui-maquette',
    q: 'Qui suis-je ?',
    ok: 'la maquette',
    ko: ['le plan', 'la photo', 'la carte'],
    img: '🏘️',
    hints: [
      'Je représente un lieu ou un objet.',
      'Je suis beaucoup plus petite que le vrai lieu.',
      'Je ne suis pas plate : je suis en volume.',
      'On peut tourner autour de moi pour me regarder.',
    ],
    ex: 'La maquette est un modèle réduit en volume.',
  },
];

const PLANS_VF: VF[] = [
  {
    n: 'f',
    id: 'fleche',
    s: 'La flèche ➡️ montre la droite.',
    v: true,
    ex: 'La flèche ➡️ montre la droite.',
  },
  {
    n: 'f',
    id: 'fleche-bas',
    s: 'La flèche ⬆️ montre le bas.',
    v: false,
    ex: 'La flèche ⬆️ montre le haut ; ⬇️ montre le bas.',
  },
  {
    n: 'n',
    id: 'dessus',
    s: 'Un plan est un dessin vu d’au-dessus.',
    v: true,
    ex: 'On dessine le plan comme si on regardait le lieu d’en haut.',
  },
  {
    n: 'n',
    id: 'maquette-grande',
    s: 'Une maquette est plus grande que le vrai lieu.',
    v: false,
    ex: 'Une maquette est plus petite que le vrai lieu.',
  },
  {
    n: 'n',
    id: 'photo-aerienne',
    s: 'Une photo aérienne est prise depuis le ciel.',
    v: true,
    ex: 'Elle est prise d’un avion, d’un drone ou d’un satellite.',
  },
  {
    n: 'p',
    id: 'legende',
    s: 'Sur un plan, la légende explique les couleurs et les symboles.',
    v: true,
    ex: 'La légende aide à lire le plan.',
  },
  {
    n: 'p',
    id: 'nord-bas',
    s: 'Sur la plupart des cartes, le nord est en bas.',
    v: false,
    ex: 'Le nord est généralement en haut.',
  },
];

/** QCM « où est… ? » : 1 fois sur 2 une file d'animaux, sinon une question de la banque. */
function genPlansQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  if (rng.chance(0.5)) return rng.pick(qcmPool(PLANS_QCM, { guillotine: true })(level, rng, ctx));
  const { f, qu } = questionFile(level, rng);
  const choices = rng.shuffle(f.map(nom));
  const question = `Regarde la file : ${dessin(f)}. ${qu.q}`;
  const it: ItemOf<'mcq'> = {
    kind: 'mcq',
    id: `${ctx.lesson.id}:mcq:file:${hash(`${question}=${nom(qu.ok)}`)}`,
    lessonId: ctx.lesson.id,
    question,
    choices,
    answerIndex: choices.indexOf(nom(qu.ok)),
    explication: qu.ex,
    difficulty: level === 'facile' ? 0.2 : level === 'normal' ? 0.5 : 0.8,
    guillotine: true,
  };
  return it;
}

/** Vrai / faux : la moitié sur une file d'animaux (« X est à gauche de Y »), sinon la banque. */
function genPlansVf(level: Level, rng: Rng, ctx: GenContext): Item {
  if (rng.chance(0.35)) return rng.pick(vfPool(PLANS_VF)(level, rng, ctx));
  const f = file(level, rng);
  const [i, j] = rng.shuffle(f.map((_, k) => k)).slice(0, 2) as [number, number];
  const cote = rng.chance(0.5) ? 'gauche' : 'droite';
  const vrai = cote === 'gauche' ? i < j : i > j;
  const statement = `Dans la file ${dessin(f)}, ${nom(f[i]!)} est à ${cote} ${du(f[j]!)}.`;
  return {
    kind: 'true_false',
    id: `${ctx.lesson.id}:tf:file:${hash(statement)}`,
    lessonId: ctx.lesson.id,
    statement,
    answer: vrai,
    explication: `${Nom(f[i]!)} est à ${i < j ? 'gauche' : 'droite'} ${du(f[j]!)} : la file se lit de gauche à droite.`,
    difficulty: level === 'facile' ? 0.2 : level === 'normal' ? 0.5 : 0.8,
  };
}

const PLANS_PAIRES: Record<Level, Appariement[]> = {
  facile: [
    {
      id: 'fleches',
      prompt: 'Associe chaque direction à sa flèche.',
      relation: 'direction → flèche',
      duos: [
        { l: 'à gauche', r: '⬅️', n: 'f' },
        { l: 'à droite', r: '➡️', n: 'f' },
        { l: 'en haut', r: '⬆️', n: 'f' },
        { l: 'en bas', r: '⬇️', n: 'f' },
      ],
      ex: 'Chaque flèche montre une direction : gauche, droite, haut ou bas.',
      nb: 4,
    },
  ],
  normal: [
    {
      id: 'symboles',
      prompt: 'Associe chaque lieu au symbole de la légende du plan.',
      relation: 'lieu → symbole',
      duos: [
        { l: 'l’école', r: '🏫', n: 'n' },
        { l: 'la gare', r: '🚉', n: 'n' },
        { l: 'l’hôpital', r: '🏥', n: 'n' },
        { l: 'la poste', r: '🏤', n: 'n' },
        { l: 'le parc', r: '🌳', n: 'n' },
        { l: 'la piscine', r: '🏊', n: 'n' },
        { l: 'la boulangerie', r: '🥖', n: 'n' },
        { l: 'la bibliothèque', r: '📚', n: 'n' },
        { l: 'le stade', r: '🏟️', n: 'n' },
      ],
      ex: 'Sur un plan, de petits dessins (symboles) montrent les lieux ; la légende les explique.',
    },
  ],
  plus_loin: [
    {
      id: 'symboles',
      prompt: 'Associe chaque lieu au symbole de la légende du plan.',
      relation: 'lieu → symbole',
      duos: [
        { l: 'l’école', r: '🏫', n: 'p' },
        { l: 'la gare', r: '🚉', n: 'p' },
        { l: 'l’hôpital', r: '🏥', n: 'p' },
        { l: 'la poste', r: '🏤', n: 'p' },
        { l: 'le parc', r: '🌳', n: 'p' },
        { l: 'la piscine', r: '🏊', n: 'p' },
        { l: 'la bibliothèque', r: '📚', n: 'p' },
        { l: 'le stade', r: '🏟️', n: 'p' },
        { l: 'le parking', r: '🅿️', n: 'p' },
        { l: 'la rivière', r: '🌊', n: 'p' },
      ],
      ex: 'Sur un plan, de petits dessins (symboles) montrent les lieux ; la légende les explique.',
      nb: 8,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Le monde : globe, planisphère, continents, océans, la France        */
/* ------------------------------------------------------------------ */

const M = 'monde';
const E = 'europe';
const LIEUX: Lieu[] = [
  {
    n: 'f',
    map: M,
    target: 'europe',
    label: 'l’Europe',
    ex: 'L’Europe est le continent où se trouve la France, au nord de l’Afrique.',
  },
  {
    n: 'f',
    map: M,
    target: 'afrique',
    label: 'l’Afrique',
    ex: 'L’Afrique est le grand continent juste au sud de l’Europe, de l’autre côté de la mer Méditerranée.',
  },
  {
    n: 'f',
    map: M,
    target: 'amerique',
    label: 'l’Amérique',
    ex: 'L’Amérique est à l’ouest, de l’autre côté de l’océan Atlantique ; elle a deux parties, au nord et au sud.',
  },
  {
    n: 'f',
    map: M,
    target: 'ocean-atlantique',
    label: 'l’océan Atlantique',
    ex: 'L’océan Atlantique est entre l’Europe, l’Afrique et l’Amérique ; il borde la France à l’ouest.',
  },
  {
    n: 'f',
    map: M,
    target: 'ocean-pacifique',
    label: 'l’océan Pacifique',
    ex: 'Le Pacifique est le plus grand océan : il est entre l’Amérique, l’Asie et l’Océanie.',
  },
  {
    n: 'n',
    map: M,
    target: 'asie',
    label: 'l’Asie',
    ex: 'L’Asie est le plus grand continent, à l’est de l’Europe ; la Chine et l’Inde y sont.',
  },
  {
    n: 'n',
    map: M,
    target: 'oceanie',
    label: 'l’Océanie',
    ex: 'L’Océanie est le continent des îles, au sud-est de l’Asie ; l’Australie en fait partie.',
  },
  {
    n: 'n',
    map: M,
    target: 'antarctique',
    label: 'l’Antarctique',
    ex: 'L’Antarctique est le continent glacé tout en bas, autour du pôle Sud.',
  },
  {
    n: 'n',
    map: M,
    target: 'ocean-indien',
    label: 'l’océan Indien',
    ex: 'L’océan Indien est au sud de l’Asie, entre l’Afrique et l’Océanie.',
  },
  {
    n: 'n',
    map: M,
    target: 'ocean-arctique',
    label: 'l’océan Arctique',
    ex: 'L’océan Arctique est tout en haut, autour du pôle Nord ; il est souvent couvert de glace.',
  },
  {
    n: 'n',
    map: M,
    target: 'ocean-austral',
    label: 'l’océan Austral',
    ex: 'L’océan Austral entoure l’Antarctique, tout en bas de la carte.',
  },
  {
    n: 'n',
    map: E,
    target: 'france',
    label: 'la France',
    prompt: 'Sur la carte de l’Europe, touche la France.',
    ex: 'La France est à l’ouest de l’Europe ; elle a à peu près la forme d’un hexagone.',
  },
  {
    n: 'p',
    map: M,
    target: 'amerique-du-nord',
    label: 'l’Amérique du Nord',
    ex: 'L’Amérique du Nord est la partie nord de l’Amérique : le Canada et les États-Unis y sont.',
  },
  {
    n: 'p',
    map: M,
    target: 'amerique-du-sud',
    label: 'l’Amérique du Sud',
    ex: 'L’Amérique du Sud est la partie sud de l’Amérique : le Brésil y est.',
  },
  {
    n: 'p',
    map: E,
    target: 'espagne',
    label: 'l’Espagne',
    prompt: 'Touche l’Espagne, un pays voisin de la France.',
    ex: 'L’Espagne est au sud-ouest de la France, de l’autre côté des Pyrénées.',
  },
  {
    n: 'p',
    map: E,
    target: 'italie',
    label: 'l’Italie',
    prompt: 'Touche l’Italie, un pays voisin de la France.',
    ex: 'L’Italie, en forme de botte, est au sud-est de la France, de l’autre côté des Alpes.',
  },
  {
    n: 'p',
    map: E,
    target: 'allemagne',
    label: 'l’Allemagne',
    prompt: 'Touche l’Allemagne, un pays voisin de la France.',
    ex: 'L’Allemagne est au nord-est de la France ; le Rhin forme une partie de la frontière.',
  },
  {
    n: 'p',
    map: E,
    target: 'belgique',
    label: 'la Belgique',
    prompt: 'Touche la Belgique, un pays voisin de la France.',
    ex: 'La Belgique est au nord de la France ; on y parle aussi français.',
  },
  {
    n: 'p',
    map: E,
    target: 'suisse',
    label: 'la Suisse',
    prompt: 'Touche la Suisse, un pays voisin de la France.',
    ex: 'La Suisse est à l’est de la France, dans les montagnes du Jura et des Alpes.',
  },
  {
    n: 'p',
    map: E,
    target: 'luxembourg',
    label: 'le Luxembourg',
    prompt: 'Touche le Luxembourg, un petit pays voisin de la France.',
    ex: 'Le Luxembourg est un tout petit pays au nord-est de la France.',
  },
  {
    n: 'p',
    map: E,
    target: 'royaume-uni',
    label: 'le Royaume-Uni',
    prompt: 'Touche le Royaume-Uni, notre voisin de l’autre côté de la Manche.',
    ex: 'Le Royaume-Uni est au nord-ouest de la France, de l’autre côté de la Manche.',
  },
];

const MONDE_QCM: Q[] = [
  {
    n: 'f',
    id: 'globe',
    q: 'Qu’est-ce qu’un globe ?',
    ok: 'une boule qui représente la Terre',
    ko: ['un ballon de football', 'une carte du quartier', 'une lampe'],
    img: '🌍',
    ex: 'Le globe est une maquette de la Terre, qui est ronde comme une boule.',
  },
  {
    n: 'f',
    id: 'bleu',
    q: 'Sur un globe, quelle couleur montre les mers et les océans ?',
    ok: 'le bleu',
    ko: ['le vert', 'le jaune', 'le marron'],
    ex: 'Le bleu représente l’eau des mers et des océans.',
  },
  {
    n: 'f',
    id: 'eau-terre',
    q: 'Sur la Terre, y a-t-il plus d’eau ou plus de terres ?',
    ok: 'plus d’eau',
    ko: ['plus de terres', 'autant des deux'],
    ex: 'Les océans et les mers couvrent la plus grande partie de la Terre.',
  },
  {
    n: 'f',
    id: 'france-europe',
    q: 'Sur quel continent se trouve la France ?',
    ok: 'l’Europe',
    ko: ['l’Afrique', 'l’Asie', 'l’Amérique'],
    ex: 'La France est en Europe, à l’ouest du continent.',
  },
  {
    n: 'n',
    id: 'nb-continents',
    q: 'Combien de continents compte-t-on à l’école ?',
    ok: '6',
    ko: ['3', '12', '20'],
    ex: 'On compte 6 continents : l’Afrique, l’Amérique, l’Antarctique, l’Asie, l’Europe et l’Océanie.',
  },
  {
    n: 'n',
    id: 'nb-oceans',
    q: 'Combien y a-t-il d’océans ?',
    ok: '5',
    ko: ['2', '10', '7'],
    ex: 'Il y a 5 océans : Atlantique, Pacifique, Indien, Arctique et Austral.',
  },
  {
    n: 'n',
    id: 'grand-ocean',
    q: 'Quel est le plus grand océan ?',
    ok: 'l’océan Pacifique',
    ko: ['l’océan Atlantique', 'l’océan Indien', 'l’océan Arctique'],
    ex: 'Le Pacifique est le plus grand des océans.',
  },
  {
    n: 'n',
    id: 'ocean-france',
    q: 'Quel océan borde la France, à l’ouest ?',
    ok: 'l’océan Atlantique',
    ko: ['l’océan Pacifique', 'l’océan Indien', 'l’océan Arctique'],
    ex: 'La Bretagne et la côte ouest de la France sont bordées par l’océan Atlantique.',
  },
  {
    n: 'n',
    id: 'pole-sud',
    q: 'Quel continent est couvert de glace, autour du pôle Sud ?',
    ok: 'l’Antarctique',
    ko: ['l’Afrique', 'l’Europe', 'l’Océanie'],
    img: '🐧',
    ex: 'L’Antarctique est le continent glacé du pôle Sud.',
  },
  {
    n: 'n',
    id: 'planisphere',
    q: 'Qu’est-ce qu’un planisphère ?',
    ok: 'une carte de toute la Terre, à plat',
    ko: ['une boule qui tourne', 'une carte de la France', 'une photo de la Lune'],
    ex: 'Le planisphère montre toute la Terre sur une feuille plate.',
  },
  {
    n: 'n',
    id: 'grand-continent',
    q: 'Quel est le plus grand continent ?',
    ok: 'l’Asie',
    ko: ['l’Europe', 'l’Océanie', 'l’Antarctique'],
    ex: 'L’Asie est le plus grand continent ; c’est aussi là que vivent le plus de personnes.',
  },
  {
    n: 'p',
    id: 'voisin',
    q: 'Quel pays est voisin de la France ?',
    ok: 'l’Espagne',
    ko: ['le Japon', 'le Brésil', 'l’Australie'],
    ex: 'L’Espagne touche la France au sud-ouest, par les Pyrénées.',
  },
  {
    n: 'p',
    id: 'mediterranee',
    q: 'Quelle mer borde la France au sud ?',
    ok: 'la mer Méditerranée',
    ko: ['la mer Rouge', 'la mer Noire', 'la mer Caspienne'],
    ex: 'Au sud, la France est bordée par la mer Méditerranée (Marseille, Nice).',
  },
  {
    n: 'p',
    id: 'botte',
    q: 'Quel pays voisin de la France a la forme d’une botte ?',
    ok: 'l’Italie',
    ko: ['l’Espagne', 'la Belgique', 'la Suisse'],
    ex: 'L’Italie ressemble à une botte qui avance dans la mer Méditerranée.',
  },
  {
    n: 'p',
    id: 'chine',
    q: 'Sur quel continent se trouve la Chine ?',
    ok: 'l’Asie',
    ko: ['l’Afrique', 'l’Europe', 'l’Amérique'],
    ex: 'La Chine est en Asie.',
  },
  {
    n: 'p',
    id: 'kangourou',
    q: 'Sur quel continent les kangourous vivent-ils en liberté ?',
    ok: 'l’Océanie',
    ko: ['l’Afrique', 'l’Europe', 'l’Asie'],
    img: '🦘',
    ex: 'Les kangourous vivent en Australie, en Océanie.',
  },
  {
    n: 'n',
    id: 'qui-afrique',
    q: 'Qui suis-je ?',
    ok: 'l’Afrique',
    ko: ['l’Asie', 'l’Europe', 'l’Amérique'],
    img: '🦒',
    hints: [
      'Je suis un continent.',
      'Je suis au sud de l’Europe.',
      'La mer Méditerranée me sépare de la France.',
      'Les lions et les girafes vivent chez moi en liberté.',
    ],
    ex: 'L’Afrique est le continent au sud de l’Europe.',
  },
  {
    n: 'n',
    id: 'qui-antarctique',
    q: 'Qui suis-je ?',
    ok: 'l’Antarctique',
    ko: ['l’Océanie', 'l’Europe', 'l’Asie'],
    img: '🐧',
    hints: [
      'Je suis un continent.',
      'Personne n’habite chez moi toute l’année.',
      'Je suis tout en bas du globe, autour du pôle Sud.',
      'Je suis couvert de glace et les manchots vivent chez moi.',
    ],
    ex: 'L’Antarctique est le continent glacé du pôle Sud.',
  },
  {
    n: 'n',
    id: 'qui-pacifique',
    q: 'Qui suis-je ?',
    ok: 'l’océan Pacifique',
    ko: ['l’océan Atlantique', 'l’océan Indien', 'l’océan Arctique'],
    img: '🌊',
    hints: [
      'Je suis un océan.',
      'Je suis le plus grand de tous.',
      'Je suis entre l’Amérique et l’Asie.',
      'Mon nom veut dire « calme », pourtant j’ai de grosses vagues !',
    ],
    ex: 'Le Pacifique est le plus grand océan du monde.',
  },
  {
    n: 'n',
    id: 'qui-asie',
    q: 'Qui suis-je ?',
    ok: 'l’Asie',
    ko: ['l’Afrique', 'l’Europe', 'l’Océanie'],
    img: '🐼',
    hints: [
      'Je suis un continent.',
      'Je suis le plus grand continent.',
      'Je suis à l’est de l’Europe.',
      'La Chine, l’Inde et le Japon sont chez moi.',
    ],
    ex: 'L’Asie est le plus grand continent.',
  },
  {
    n: 'n',
    id: 'qui-oceanie',
    q: 'Qui suis-je ?',
    ok: 'l’Océanie',
    ko: ['l’Asie', 'l’Antarctique', 'l’Amérique'],
    img: '🦘',
    hints: [
      'Je suis un continent.',
      'Je suis fait de nombreuses îles.',
      'Je suis au sud-est de l’Asie.',
      'Les kangourous vivent chez moi, en Australie.',
    ],
    ex: 'L’Océanie est le continent des îles ; l’Australie en fait partie.',
  },
  {
    n: 'f',
    id: 'qui-europe',
    q: 'Qui suis-je ?',
    ok: 'l’Europe',
    ko: ['l’Afrique', 'l’Asie', 'l’Amérique'],
    img: '🏰',
    hints: [
      'Je suis un continent.',
      'Je suis au nord de l’Afrique.',
      'Je suis collée à l’Asie.',
      'La France se trouve chez moi.',
    ],
    ex: 'La France est en Europe.',
  },
];

const MONDE_VF: VF[] = [
  {
    n: 'f',
    id: 'afrique-ocean',
    s: 'L’Afrique est un océan.',
    v: false,
    img: '🌍',
    ex: 'L’Afrique est un continent.',
  },
  {
    n: 'f',
    id: 'france-europe',
    s: 'La France est en Europe.',
    v: true,
    ex: 'La France est à l’ouest de l’Europe.',
  },
  {
    n: 'f',
    id: 'eau',
    s: 'Il y a plus d’eau que de terres sur la Terre.',
    v: true,
    ex: 'Les océans et les mers recouvrent la plus grande partie de la Terre.',
  },
  {
    n: 'f',
    id: 'globe',
    s: 'Un globe représente la Terre en forme de boule.',
    v: true,
    ex: 'La Terre est ronde comme une boule : le globe la représente.',
  },
  {
    n: 'f',
    id: 'france-afrique',
    s: 'La France est en Afrique.',
    v: false,
    ex: 'La France est en Europe ; l’Afrique est au sud, de l’autre côté de la Méditerranée.',
  },
  {
    n: 'n',
    id: 'pacifique-petit',
    s: 'L’océan Pacifique est le plus petit océan.',
    v: false,
    ex: 'C’est le plus grand océan.',
  },
  {
    n: 'n',
    id: 'antarctique',
    s: 'L’Antarctique est un continent couvert de glace.',
    v: true,
    ex: 'Il est autour du pôle Sud.',
  },
  {
    n: 'n',
    id: 'asie-ocean',
    s: 'L’Asie est un océan.',
    v: false,
    ex: 'L’Asie est un continent, le plus grand de tous.',
  },
  {
    n: 'n',
    id: 'atlantique-ouest',
    s: 'L’océan Atlantique est à l’ouest de la France.',
    v: true,
    ex: 'La côte ouest de la France est bordée par l’Atlantique.',
  },
  {
    n: 'n',
    id: 'six',
    s: 'À l’école, on compte 6 continents.',
    v: true,
    ex: 'Afrique, Amérique, Antarctique, Asie, Europe et Océanie.',
  },
  {
    n: 'n',
    id: 'oceans-trois',
    s: 'Il y a seulement 3 océans.',
    v: false,
    ex: 'Il y a 5 océans : Atlantique, Pacifique, Indien, Arctique et Austral.',
  },
  {
    n: 'p',
    id: 'espagne',
    s: 'L’Espagne est un pays voisin de la France.',
    v: true,
    ex: 'L’Espagne est au sud-ouest de la France.',
  },
  {
    n: 'p',
    id: 'italie-nord',
    s: 'L’Italie est au nord de la France.',
    v: false,
    ex: 'L’Italie est au sud-est de la France.',
  },
  {
    n: 'p',
    id: 'manche',
    s: 'Le Royaume-Uni est séparé de la France par la Manche.',
    v: true,
    ex: 'La Manche est la mer entre la France et le Royaume-Uni.',
  },
];

const C = 'un continent';
const O = 'un océan';
const P = 'un pays';
const MONDE_TRIS: Record<Level, Tri[]> = {
  facile: [
    {
      id: 'continent-ocean',
      prompt: 'Continent ou océan ?',
      categories: [C, O],
      elements: [
        { label: 'l’Afrique', c: C, n: 'f' },
        { label: 'l’Europe', c: C, n: 'f' },
        { label: 'l’Amérique', c: C, n: 'f' },
        { label: 'l’Asie', c: C, n: 'f' },
        { label: 'l’océan Atlantique', c: O, n: 'f' },
        { label: 'l’océan Pacifique', c: O, n: 'f' },
        { label: 'l’océan Indien', c: O, n: 'f' },
      ],
      ex: 'Un continent est une immense étendue de terre ; un océan, une immense étendue d’eau salée.',
    },
  ],
  normal: [
    {
      id: 'continent-ocean-pays',
      prompt: 'Continent, océan ou pays ?',
      categories: [C, O, P],
      elements: [
        { label: 'l’Afrique', c: C, n: 'n' },
        { label: 'l’Océanie', c: C, n: 'n' },
        { label: 'l’Antarctique', c: C, n: 'n' },
        { label: 'l’Asie', c: C, n: 'n' },
        { label: 'l’Europe', c: C, n: 'n' },
        { label: 'l’Atlantique', c: O, n: 'n' },
        { label: 'le Pacifique', c: O, n: 'n' },
        { label: 'l’océan Arctique', c: O, n: 'n' },
        { label: 'l’océan Austral', c: O, n: 'n' },
        { label: 'la France', c: P, n: 'n' },
        { label: 'l’Espagne', c: P, n: 'n' },
        { label: 'l’Italie', c: P, n: 'n' },
      ],
      ex: 'Les continents et les océans sont immenses ; un pays est une partie d’un continent.',
      nb: 8,
    },
  ],
  plus_loin: [
    {
      id: 'pays-europe',
      prompt: 'Ce pays est-il en Europe ou sur un autre continent ?',
      categories: ['en Europe', 'sur un autre continent'],
      elements: [
        { label: 'la France', c: 'en Europe', n: 'p' },
        { label: 'l’Espagne', c: 'en Europe', n: 'p' },
        { label: 'l’Italie', c: 'en Europe', n: 'p' },
        { label: 'l’Allemagne', c: 'en Europe', n: 'p' },
        { label: 'la Belgique', c: 'en Europe', n: 'p' },
        { label: 'la Chine', c: 'sur un autre continent', n: 'p' },
        { label: 'le Brésil', c: 'sur un autre continent', n: 'p' },
        { label: 'l’Australie', c: 'sur un autre continent', n: 'p' },
        { label: 'le Canada', c: 'sur un autre continent', n: 'p' },
        { label: 'le Maroc', c: 'sur un autre continent', n: 'p' },
      ],
      ex: 'La France et ses voisins sont en Europe ; la Chine est en Asie, le Brésil et le Canada en Amérique, l’Australie en Océanie, le Maroc en Afrique.',
      nb: 8,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Paysages                                                            */
/* ------------------------------------------------------------------ */

const V = 'la ville';
const CA = 'la campagne';
const MO = 'la montagne';
const L = 'le littoral';
const PAYSAGES_ELEMENTS = [
  { label: 'les immeubles', c: V, img: '🏢' },
  { label: 'le métro', c: V, img: '🚇' },
  { label: 'les grands magasins', c: V, img: '🏬' },
  { label: 'les rues très animées', c: V, img: '🚦' },
  { label: 'les champs de blé', c: CA, img: '🌾' },
  { label: 'les vaches dans le pré', c: CA, img: '🐄' },
  { label: 'le tracteur', c: CA, img: '🚜' },
  { label: 'le petit village', c: CA, img: '🏡' },
  { label: 'les sommets enneigés', c: MO, img: '🏔️' },
  { label: 'les pistes de ski', c: MO, img: '⛷️' },
  { label: 'le téléphérique', c: MO, img: '🚡' },
  { label: 'la plage', c: L, img: '🏖️' },
  { label: 'le port de pêche', c: L, img: '⚓' },
  { label: 'les vagues', c: L, img: '🌊' },
  { label: 'les coquillages', c: L, img: '🐚' },
];

const PAYSAGES_TRIS: Record<Level, Tri[]> = {
  facile: [
    {
      id: 'ville-campagne',
      prompt: 'Ville ou campagne ?',
      categories: [V, CA],
      elements: PAYSAGES_ELEMENTS.filter((e) => e.c === V || e.c === CA).map((e) => ({
        ...e,
        n: 'f' as const,
      })),
      ex: 'En ville, il y a beaucoup d’immeubles et d’habitants ; à la campagne, des champs, des fermes et des villages.',
    },
  ],
  normal: [
    {
      id: 'quatre-paysages',
      prompt: 'Dans quel paysage vois-tu cela ?',
      categories: [V, CA, MO, L],
      elements: PAYSAGES_ELEMENTS.map((e) => ({ ...e, n: 'n' as const })),
      ex: 'Ville : immeubles ; campagne : champs ; montagne : sommets ; littoral : bord de mer.',
      nb: 8,
    },
  ],
  plus_loin: [
    {
      id: 'activites',
      prompt: 'Où fait-on surtout cette activité ?',
      categories: ['en ville', 'à la campagne', 'à la montagne', 'sur le littoral'],
      elements: [
        { label: 'prendre le métro', c: 'en ville', n: 'p', img: '🚇' },
        { label: 'faire ses courses au centre commercial', c: 'en ville', n: 'p', img: '🛒' },
        { label: 'moissonner le blé', c: 'à la campagne', n: 'p', img: '🌾' },
        { label: 'traire les vaches', c: 'à la campagne', n: 'p', img: '🐄' },
        { label: 'skier', c: 'à la montagne', n: 'p', img: '⛷️' },
        { label: 'grimper jusqu’au sommet', c: 'à la montagne', n: 'p', img: '🧗' },
        { label: 'pêcher en mer', c: 'sur le littoral', n: 'p', img: '🎣' },
        { label: 'construire un château de sable', c: 'sur le littoral', n: 'p', img: '🏖️' },
        { label: 'prendre le tramway', c: 'en ville', n: 'p', img: '🚋' },
        { label: 'cueillir les pommes du verger', c: 'à la campagne', n: 'p', img: '🍎' },
        { label: 'faire de la luge', c: 'à la montagne', n: 'p', img: '🛷' },
        { label: 'regarder les bateaux rentrer au port', c: 'sur le littoral', n: 'p', img: '⛵' },
      ],
      ex: 'Les activités des humains dépendent du paysage : le ski en montagne, la pêche en mer sur le littoral, l’agriculture à la campagne.',
      nb: 8,
    },
  ],
};

const PAYSAGES_QCM: Q[] = [
  {
    n: 'f',
    id: 'immeubles',
    q: 'Où trouve-t-on beaucoup d’immeubles ?',
    ok: 'en ville',
    ko: ['à la campagne', 'à la montagne'],
    img: '🏙️',
    ex: 'En ville, beaucoup de gens habitent dans des immeubles.',
  },
  {
    n: 'f',
    id: 'champs',
    q: 'Où trouve-t-on des champs et des fermes ?',
    ok: 'à la campagne',
    ko: ['en ville', 'sur la plage'],
    img: '🌾',
    ex: 'À la campagne, les agriculteurs cultivent des champs et élèvent des animaux.',
  },
  {
    n: 'n',
    id: 'plages',
    q: 'Où trouve-t-on des plages et des ports ?',
    ok: 'sur le littoral',
    ko: ['en ville', 'à la campagne', 'à la montagne'],
    img: '🏖️',
    ex: 'Le littoral, c’est le bord de mer : on y trouve des plages et des ports.',
  },
  {
    n: 'n',
    id: 'littoral',
    q: 'Qu’est-ce que le littoral ?',
    ok: 'le bord de la mer',
    ko: ['le haut d’une montagne', 'le centre-ville', 'une forêt'],
    ex: 'Le littoral est la zone où la terre touche la mer.',
  },
  {
    n: 'n',
    id: 'sommets',
    q: 'Dans quel paysage y a-t-il des sommets et des vallées ?',
    ok: 'à la montagne',
    ko: ['sur le littoral', 'en ville', 'à la campagne'],
    img: '🏔️',
    ex: 'La montagne a des sommets très hauts et des vallées entre eux.',
  },
  {
    n: 'n',
    id: 'habitants',
    q: 'Dans quel paysage les habitants sont-ils les plus nombreux ?',
    ok: 'en ville',
    ko: ['à la campagne', 'à la montagne', 'sur une île déserte'],
    ex: 'En ville, beaucoup d’habitants vivent proches les uns des autres.',
  },
  {
    n: 'p',
    id: 'ski',
    q: 'Pourquoi construit-on des stations de ski à la montagne ?',
    ok: 'parce qu’il y a de la neige en hiver et des pentes',
    ko: ['parce qu’il fait toujours chaud', 'parce qu’il y a la mer', 'parce qu’il y a des immeubles'],
    ex: 'La neige et les pentes de la montagne permettent de skier.',
  },
  {
    n: 'p',
    id: 'pecheur',
    q: 'Quel métier fait-on surtout sur le littoral ?',
    ok: 'marin-pêcheur',
    ko: ['moniteur de ski', 'conductrice de métro', 'berger en alpage'],
    ex: 'Sur le littoral, les marins-pêcheurs partent en mer depuis le port.',
  },
  {
    n: 'p',
    id: 'commerces',
    q: 'Pourquoi y a-t-il beaucoup de magasins en ville ?',
    ok: 'parce que beaucoup de gens y habitent',
    ko: ['parce qu’il y a des vaches', 'parce qu’il neige souvent', 'parce que c’est au bord de la mer'],
    ex: 'Beaucoup d’habitants, ce sont beaucoup de clients pour les magasins.',
  },
  {
    n: 'p',
    id: 'humains',
    q: 'Qui a construit les routes, les ponts et les maisons du paysage ?',
    ok: 'les humains',
    ko: ['le vent', 'la pluie', 'les animaux sauvages'],
    ex: 'Les humains transforment les paysages : ils construisent, cultivent, aménagent.',
  },
  {
    n: 'n',
    id: 'qui-montagne',
    q: 'Qui suis-je ?',
    ok: 'la montagne',
    ko: ['la ville', 'la campagne', 'le littoral'],
    img: '🏔️',
    hints: [
      'Je suis un paysage.',
      'Je suis très haute.',
      'Il fait souvent froid tout en haut.',
      'En hiver, on vient chez moi pour skier.',
    ],
    ex: 'La montagne a des sommets élevés, souvent enneigés.',
  },
  {
    n: 'n',
    id: 'qui-littoral',
    q: 'Qui suis-je ?',
    ok: 'le littoral',
    ko: ['la ville', 'la campagne', 'la montagne'],
    img: '🏖️',
    hints: [
      'Je suis un paysage.',
      'Je suis là où la terre touche la mer.',
      'On y trouve des plages, des falaises et des ports.',
      'En été, beaucoup de gens viennent s’y baigner.',
    ],
    ex: 'Le littoral est le bord de mer.',
  },
  {
    n: 'n',
    id: 'qui-ville',
    q: 'Qui suis-je ?',
    ok: 'la ville',
    ko: ['la campagne', 'la montagne', 'le littoral'],
    img: '🏙️',
    hints: [
      'Je suis un paysage.',
      'Beaucoup de gens habitent chez moi.',
      'J’ai beaucoup d’immeubles, de magasins et de rues.',
      'On y entend souvent le bruit des voitures.',
    ],
    ex: 'La ville a beaucoup d’habitants, d’immeubles et de magasins.',
  },
  {
    n: 'n',
    id: 'qui-campagne',
    q: 'Qui suis-je ?',
    ok: 'la campagne',
    ko: ['la ville', 'la montagne', 'le littoral'],
    img: '🌾',
    hints: [
      'Je suis un paysage.',
      'Il y a peu de maisons, souvent regroupées en villages.',
      'On y voit des champs, des prés et des forêts.',
      'Les agriculteurs y cultivent et y élèvent des animaux.',
    ],
    ex: 'La campagne a des champs, des prés et des villages.',
  },
];

const PAYSAGES_VF: VF[] = [
  {
    n: 'f',
    id: 'ski',
    s: 'On trouve des pistes de ski à la montagne.',
    v: true,
    ex: 'La neige des montagnes permet de skier.',
  },
  {
    n: 'f',
    id: 'immeubles-campagne',
    s: 'Il y a beaucoup d’immeubles à la campagne.',
    v: false,
    ex: 'Les immeubles sont surtout en ville ; la campagne a des champs et des villages.',
  },
  {
    n: 'f',
    id: 'tracteur',
    s: 'Les tracteurs travaillent surtout dans les champs, à la campagne.',
    v: true,
    ex: 'Les agriculteurs utilisent des tracteurs dans leurs champs.',
  },
  {
    n: 'f',
    id: 'habitants-ville',
    s: 'En ville, il y a beaucoup d’habitants.',
    v: true,
    ex: 'La ville rassemble beaucoup d’habitants.',
  },
  {
    n: 'n',
    id: 'littoral',
    s: 'Le littoral, c’est le bord de la mer.',
    v: true,
    ex: 'Le littoral est là où la terre touche la mer.',
  },
  {
    n: 'n',
    id: 'ports-sommet',
    s: 'On trouve des ports au sommet des montagnes.',
    v: false,
    ex: 'Les ports sont au bord de l’eau, sur le littoral.',
  },
  {
    n: 'n',
    id: 'plage-ville',
    s: 'La plage est un élément du paysage de montagne.',
    v: false,
    ex: 'La plage est sur le littoral.',
  },
  {
    n: 'n',
    id: 'vallees',
    s: 'À la montagne, il y a des sommets et des vallées.',
    v: true,
    ex: 'Les vallées sont les creux entre les sommets.',
  },
  {
    n: 'p',
    id: 'humains',
    s: 'Les humains transforment les paysages en construisant des routes et des maisons.',
    v: true,
    ex: 'Routes, champs, villes : les paysages portent la trace du travail des humains.',
  },
  {
    n: 'p',
    id: 'personne',
    s: 'Personne ne travaille à la campagne.',
    v: false,
    ex: 'Les agriculteurs, les artisans et bien d’autres y travaillent.',
  },
];

const PAYSAGES_PAIRES: Record<Level, Appariement[]> = (() => {
  const a = (n: 'f' | 'n' | 'p'): Appariement => ({
    id: 'paysages',
    prompt: 'Associe chaque paysage à son image.',
    relation: 'paysage → image',
    duos: [
      { l: 'la ville', r: '🏙️', n },
      { l: 'la campagne', r: '🌾', n },
      { l: 'la montagne', r: '🏔️', n },
      { l: 'le littoral', r: '🏖️', n },
    ],
    ex: 'Ville : immeubles ; campagne : champs ; montagne : sommets ; littoral : plage.',
    nb: 4,
  });
  return { facile: [a('f')], normal: [a('n')], plus_loin: [a('p')] };
})();

export const ESPACE: ContentModule = {
  'CE1.QLM.ESPACE.PLANS': {
    gens: { mcq: genPlansQcm, true_false: genPlansVf, pairing: paireGen(PLANS_PAIRES) },
  },
  'CE1.QLM.ESPACE.MONDE': {
    pools: {
      map_point: lieuPool(LIEUX),
      mcq: qcmPool(MONDE_QCM, { guillotine: true }),
      true_false: vfPool(MONDE_VF),
    },
    gens: { classification: triGen(MONDE_TRIS) },
  },
  'CE1.QLM.ESPACE.PAYSAGES': {
    pools: { mcq: qcmPool(PAYSAGES_QCM, { guillotine: true }), true_false: vfPool(PAYSAGES_VF) },
    gens: { classification: triGen(PAYSAGES_TRIS), pairing: paireGen(PAYSAGES_PAIRES) },
  },
};
