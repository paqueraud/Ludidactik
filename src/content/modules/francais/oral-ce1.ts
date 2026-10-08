/**
 * CE1 — Oral. BO n°41 du 31/10/2024 : « réaliser l'action demandée par un discours injonctif : consigne,
 * recette de cuisine, notice de montage, règle du jeu » ; inférence simple (« J'ai pris mon parapluie →
 * le temps est pluvieux ») ; « utiliser des termes comme d'abord, pour commencer, ensuite, enfin, pour
 * terminer ». Les consignes ne sont pas écrites : elles s'écoutent (champ `spoken`, bouton 🔊).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { aucun, diff, g, oral, ordre, parNiv, qcm, trou } from './util';

/* ------------------------------------------------------------------ */
/* CE1.FR.ORAL.ECOUTE                                                  */
/* ------------------------------------------------------------------ */

/** [consigne entendue, question, bonne réponse, mauvaises réponses]. */
type Consigne = [string, string, string, string[]];
const CONSIGNES: Record<Level, Consigne[]> = {
  facile: [
    [
      'Lève la main droite.',
      'Quelle main dois-tu lever ?',
      'la main droite',
      ['la main gauche', 'les deux mains'],
    ],
    ['Ferme la fenêtre, s’il te plaît.', 'Que dois-tu fermer ?', 'la fenêtre', ['la porte', 'ton cahier']],
    [
      'Prends ton crayon vert.',
      'Quel crayon dois-tu prendre ?',
      'le crayon vert',
      ['le crayon rouge', 'le crayon bleu'],
    ],
    [
      'Va t’asseoir près de Noé.',
      'Près de qui dois-tu t’asseoir ?',
      'près de Noé',
      ['près de Léa', 'près du tableau'],
    ],
    [
      'Range ton ardoise dans ton casier.',
      'Où dois-tu ranger ton ardoise ?',
      'dans ton casier',
      ['dans ton cartable', 'sur la table'],
    ],
    ['Dessine un soleil.', 'Que dois-tu dessiner ?', 'un soleil', ['une lune', 'une maison']],
  ],
  normal: [
    [
      'Prends ton cahier rouge, puis écris la date en haut de la page.',
      'Que dois-tu faire en premier ?',
      'prendre le cahier rouge',
      ['écrire la date', 'prendre le cahier bleu'],
    ],
    [
      'Colorie le soleil en jaune et la maison en bleu.',
      'De quelle couleur dois-tu colorier la maison ?',
      'en bleu',
      ['en jaune', 'en rouge'],
    ],
    [
      'Avant de sortir en récréation, range ta trousse dans ton cartable.',
      'Que dois-tu faire avant de sortir ?',
      'ranger ta trousse',
      ['mettre ton manteau', 'ranger ton cahier'],
    ],
    [
      'Dessine trois ronds, puis un carré sous les ronds.',
      'Où dois-tu dessiner le carré ?',
      'sous les ronds',
      ['au-dessus des ronds', 'à côté des ronds'],
    ],
    [
      'Prends deux crayons verts et un crayon noir.',
      'Combien de crayons verts dois-tu prendre ?',
      'deux',
      ['un', 'trois'],
    ],
    [
      'Souligne le titre en rouge, puis entoure le nom de l’auteur.',
      'Que dois-tu entourer ?',
      'le nom de l’auteur',
      ['le titre', 'la première phrase'],
    ],
    [
      'Mets-toi en rang derrière Léo, devant la porte.',
      'Derrière qui dois-tu te mettre ?',
      'derrière Léo',
      ['derrière la porte', 'derrière la maîtresse'],
    ],
    [
      'Ouvre ton livre à la page dix-huit et lis le premier paragraphe.',
      'À quelle page dois-tu ouvrir ton livre ?',
      'à la page 18',
      ['à la page 8', 'à la page 80'],
    ],
  ],
  plus_loin: [
    [
      'Pour faire une salade de fruits, épluche une banane, coupe-la en rondelles, ajoute une pomme coupée en morceaux, puis verse un peu de jus d’orange.',
      'Que dois-tu faire juste après avoir épluché la banane ?',
      'la couper en rondelles',
      ['verser le jus d’orange', 'couper la pomme'],
    ],
    [
      'Pour planter une graine, remplis un pot de terre, fais un petit trou avec ton doigt, pose la graine dedans, recouvre-la, puis arrose doucement.',
      'Que dois-tu faire en dernier ?',
      'arroser doucement',
      ['remplir le pot de terre', 'faire un trou avec le doigt'],
    ],
    [
      'Au jeu du béret, deux équipes se font face. Quand l’arbitre appelle ton numéro, tu cours attraper le foulard et tu le ramènes dans ton camp sans te faire toucher.',
      'Quand dois-tu courir ?',
      'quand l’arbitre appelle ton numéro',
      ['dès que le jeu commence', 'quand l’autre équipe court'],
    ],
    [
      'Pour fabriquer ton masque, découpe le carton en suivant le trait, perce deux trous pour les yeux, colle les plumes en haut, puis attache l’élastique.',
      'Que dois-tu faire avant de coller les plumes ?',
      'percer les trous des yeux',
      ['attacher l’élastique', 'peindre le masque'],
    ],
    [
      'Pour faire des crêpes, verse la farine dans un saladier, ajoute les œufs, mélange, puis verse le lait petit à petit pour éviter les grumeaux.',
      'Pourquoi faut-il verser le lait petit à petit ?',
      'pour éviter les grumeaux',
      ['pour que la pâte soit froide', 'pour aller plus vite'],
    ],
  ],
};

function genEcouteQcm(level: Level, rng: Rng, ctx: GenContext): Item {
  const [consigne, question, bonne, autres] = rng.pick(CONSIGNES[level]);
  return qcm(ctx, rng, `consigne-${consigne}`, {
    question: `🔊 Écoute la consigne (touche le haut-parleur), puis réponds : ${question.charAt(0).toLowerCase()}${question.slice(1)}`,
    spoken: `Écoute bien. ${consigne} ${question}`,
    good: bonne,
    wrong: autres,
    explication: `La consigne était : ${g(consigne)}`,
    difficulty: diff(level, rng.next()),
  });
}

/** Devinettes et inférences entendues : [ce qu'on entend, réponse, variantes acceptées, explication]. */
const DEVINETTES: [string, string, string[], string, 'f' | 'n' | 'p'][] = [
  [
    'Je suis un fruit jaune et long que les singes adorent. Qui suis-je ?',
    'la banane',
    ['banane', 'une banane'],
    'Un fruit jaune et long que les singes adorent : c’est la banane.',
    'f',
  ],
  [
    'J’ai une trompe et de grandes oreilles. Qui suis-je ?',
    'l’éléphant',
    ['éléphant', 'un éléphant', 'l’éléphant'],
    'La trompe et les grandes oreilles font penser à l’éléphant.',
    'f',
  ],
  [
    'On me met sur la tête quand il fait froid. Qui suis-je ?',
    'le bonnet',
    ['bonnet', 'un bonnet', 'chapeau', 'un chapeau'],
    'Sur la tête, quand il fait froid : un bonnet (ou un chapeau).',
    'f',
  ],
  [
    'Je brille dans le ciel la nuit et je change de forme. Qui suis-je ?',
    'la lune',
    ['lune', 'une lune'],
    'Elle brille la nuit et change de forme : c’est la lune.',
    'f',
  ],
  [
    'Lina a pris son parapluie et ses bottes. Quel temps fait-il ?',
    'il pleut',
    ['pluie', 'la pluie', 'il pleut', 'il fait de la pluie', 'il va pleuvoir'],
    'Le parapluie et les bottes, c’est pour la pluie : on le devine sans qu’on le dise.',
    'n',
  ],
  [
    'Léa met son maillot de bain et sa serviette dans son sac. Où va-t-elle ?',
    'à la piscine',
    ['piscine', 'la piscine', 'à la plage', 'plage', 'la plage'],
    'Le maillot et la serviette font penser à la piscine (ou à la plage).',
    'n',
  ],
  [
    'Tom souffle les bougies et ouvre ses cadeaux. Quelle fête est-ce ?',
    'son anniversaire',
    ['anniversaire', 'un anniversaire', 'l’anniversaire'],
    'Des bougies à souffler et des cadeaux : c’est un anniversaire.',
    'n',
  ],
  [
    'Je suis la saison où les feuilles tombent des arbres. Qui suis-je ?',
    'l’automne',
    ['automne', 'l’automne'],
    'Les feuilles tombent en automne.',
    'n',
  ],
  [
    'Mamie sort le gâteau du four : il est tout noir. Que s’est-il passé ?',
    'il a brûlé',
    ['brûlé', 'il est brûlé', 'il a brûlé', 'il a trop cuit'],
    'Un gâteau tout noir est un gâteau brûlé : on le devine.',
    'p',
  ],
  [
    'Le chien de Malik remue la queue et saute partout quand il rentre. Comment se sent le chien ?',
    'il est content',
    ['content', 'heureux', 'il est heureux', 'il est content', 'joyeux'],
    'Remuer la queue et sauter, c’est la joie du chien de retrouver Malik.',
    'p',
  ],
  [
    'Nina bâille et se frotte les yeux. Que lui arrive-t-il ?',
    'elle est fatiguée',
    ['fatiguée', 'elle a sommeil', 'sommeil', 'elle est fatiguée'],
    'Bâiller et se frotter les yeux, c’est le signe qu’on a sommeil.',
    'p',
  ],
];

function genEcouteOral(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = DEVINETTES.filter(([, , , , n]) =>
    parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: n !== 'f' }),
  );
  const [entendu, rep, acc, expl] = rng.pick(dispo);
  return oral(ctx, `devinette-${entendu}`, {
    prompt: '🔊 Écoute la devinette (touche le haut-parleur), puis réponds à voix haute.',
    spoken: entendu,
    answer: rep,
    accepted: acc,
    explication: expl,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.FR.ORAL.DIRE                                                    */
/* ------------------------------------------------------------------ */

const RECITS: Record<Level, string[][]> = {
  facile: [
    ['D’abord, je mets mes chaussettes.', 'Ensuite, j’enfile mes chaussures.', 'Enfin, je fais mes lacets.'],
    ['D’abord, je remplis l’arrosoir.', 'Ensuite, j’arrose les fleurs.', 'Enfin, je range l’arrosoir.'],
    ['D’abord, je prends un bol.', 'Ensuite, je verse les céréales.', 'Enfin, j’ajoute le lait.'],
    [
      'D’abord, la chenille mange des feuilles.',
      'Ensuite, elle s’enferme dans un cocon.',
      'Enfin, elle devient un papillon.',
    ],
  ],
  normal: [
    [
      'D’abord, je casse les œufs dans un bol.',
      'Ensuite, je les bats avec une fourchette.',
      'Puis, je verse les œufs dans la poêle.',
      'Enfin, je mange mon omelette.',
    ],
    [
      'D’abord, je remplis la baignoire.',
      'Ensuite, je me lave.',
      'Puis, je me sèche avec une serviette.',
      'Enfin, j’enfile mon pyjama.',
    ],
    [
      'D’abord, je plante une graine.',
      'Ensuite, je l’arrose chaque jour.',
      'Puis, une petite tige sort de terre.',
      'Enfin, une fleur s’ouvre.',
    ],
    [
      'D’abord, je prépare la pâte.',
      'Ensuite, je la verse dans le moule.',
      'Puis, je fais cuire le gâteau.',
      'Enfin, je le décore.',
    ],
  ],
  plus_loin: [
    [
      'Pour commencer, Inès sort son vélo du garage.',
      'Après, elle gonfle ses pneus à plat.',
      'Ensuite, elle roule jusqu’au parc.',
      'Pour finir, elle range son vélo au retour.',
    ],
    [
      'Tout d’abord, on choisit un livre.',
      'Puis, on le lit en entier.',
      'Ensuite, on prépare un petit résumé.',
      'Pour conclure, on le présente à la classe.',
    ],
    [
      'Pour commencer, Hugo découpe les murs dans le carton.',
      'Après cela, il colle les murs ensemble.',
      'Ensuite, il pose le toit sur les murs.',
      'Finalement, il peint sa maquette terminée.',
    ],
  ],
};

function genDireOrdre(level: Level, rng: Rng, ctx: GenContext): Item {
  const recit = rng.pick(RECITS[level]);
  return ordre(ctx, `recit-${recit[0]}`, {
    prompt: 'Remets les phrases du récit dans l’ordre grâce aux mots qui les relient.',
    elements: recit,
    mode: 'etapes',
    explication:
      'Les mots « d’abord, pour commencer » ouvrent le récit ; « ensuite, puis, après » le continuent ; « enfin, pour finir » le terminent.',
    difficulty: diff(level, recit.length / 4),
  });
}

const CONNECTEURS = ['D’abord', 'Ensuite', 'Enfin'];
function genDireTrou(level: Level, rng: Rng, ctx: GenContext): Item {
  const recit = rng.pick(RECITS[level === 'plus_loin' ? 'normal' : level]);
  const i = rng.int(0, recit.length - 1);
  const [connecteur, ...reste] = recit[i]!.split(', ');
  const phrase = recit.map((p, k) => (k === i ? `___, ${reste.join(', ')}` : p)).join(' ');
  // un seul connecteur « du milieu » parmi les choix : Ensuite et Puis seraient tous deux corrects
  const milieu = (c: string) => c === 'Ensuite' || c === 'Puis';
  const choix = [
    connecteur!,
    ...CONNECTEURS.filter((c) => c !== connecteur && !(milieu(c) && milieu(connecteur!))),
  ];
  return trou(ctx, rng, `connecteur-${recit[0]}-${i}`, {
    sentence: phrase,
    answer: connecteur!,
    choices: choix.slice(0, 4),
    hint: '« D’abord » pour commencer, « ensuite » ou « puis » au milieu, « enfin » pour finir.',
    explication: `Il faut ${g(connecteur!)} : ${i === 0 ? 'c’est le début du récit' : i === recit.length - 1 ? 'c’est la fin du récit' : 'on est au milieu du récit'}.`,
    difficulty: diff(level, rng.next()),
  });
}

const DIRE_ORAL: [string, string, string[], string][] = [
  [
    'Quel mot dis-tu pour commencer ton récit ?',
    'd’abord',
    ['d’abord', 'tout d’abord', 'pour commencer', 'au début', 'premièrement'],
    'Pour commencer un récit, on dit « d’abord » ou « pour commencer ».',
  ],
  [
    'Complète à voix haute : d’abord… ensuite… et pour finir ?',
    'enfin',
    ['enfin', 'pour finir', 'pour terminer', 'finalement', 'pour conclure'],
    'Pour terminer un récit, on dit « enfin » ou « pour finir ».',
  ],
  [
    'Dis un mot qui veut dire « après » pour continuer ton récit.',
    'ensuite',
    ['ensuite', 'puis', 'après', 'après cela'],
    'Au milieu d’un récit, on dit « ensuite » ou « puis ».',
  ],
  [
    'Remplace « et après » par un meilleur mot : « Je me lève et après je déjeune. »',
    'ensuite',
    ['ensuite', 'puis'],
    'Au lieu de répéter « et après », on dit « ensuite » ou « puis ».',
  ],
];

function genDireOral(level: Level, rng: Rng, ctx: GenContext): Item {
  const [q, rep, acc, expl] = rng.pick(DIRE_ORAL);
  return oral(ctx, `dire-${q}`, {
    prompt: q,
    answer: rep,
    accepted: acc,
    explication: expl,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const ORAL_CE1: ContentModule = {
  'CE1.FR.ORAL.ECOUTE': {
    gens: { mcq: genEcouteQcm, oral_answer: genEcouteOral },
    pools: { pairing: aucun },
  },
  'CE1.FR.ORAL.DIRE': {
    gens: { ordering: genDireOrdre, fill_blank: genDireTrou, oral_answer: genDireOral },
  },
};
