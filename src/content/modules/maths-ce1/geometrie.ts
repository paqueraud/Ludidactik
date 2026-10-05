/**
 * CE1 — Espace et géométrie (BO n°41 du 31/10/2024) :
 * - figures : carré, rectangle, triangle, triangle rectangle, cercle ; côté, sommet, angle droit/aigu/obtus,
 *   centre, milieu, points alignés ; vérification à l'équerre (losange = CE2, pour aller plus loin) ;
 * - tracés à la règle graduée, à l'équerre et au compas ; reproduction sur quadrillage ;
 * - solides : cube, pavé, boule, cylindre, cône, pyramide ; faces, arêtes, sommets (patrons = CE2) ;
 * - repérage : gauche/droite, sur/sous/entre… ; déplacements codés (« avancer de », « pivoter d'un quart de tour »,
 *   au plus 15 instructions dont 4 virages).
 * La symétrie axiale n'est PAS au programme du CE1 (CE2 : axe vertical ou horizontal) : la leçon est
 * étiquetée « Pour aller plus loin (CE2) ».
 *
 * Conventions des quadrillages : coordonnées [x, y] avec x = colonne (0 à gauche) et y = ligne (0 en haut).
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, make, mcq, numeric, parNiv } from './util';

const NIVEAUX: Level[] = ['facile', 'normal', 'plus_loin'];
const auNiveau = <T extends { niv: Level }>(level: Level, pool: T[]) =>
  pool.filter((p) => NIVEAUX.indexOf(p.niv) <= NIVEAUX.indexOf(level));

type Cell = [number, number];
const cellKey = (c: Cell) => `${c[0]},${c[1]}`;
const cellsTxt = (cs: Cell[]) =>
  [...cs]
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(cellKey)
    .join(';');

/* ------------------------------------------------------------------ */
/* CE1.MA.GEO.FIGURES                                                  */
/* ------------------------------------------------------------------ */

const FIGURES: { id: string; nom: string; image: string; cotes: string; niv: Level; expl: string }[] = [
  {
    id: 'carre',
    nom: 'carré',
    image: '🟦',
    cotes: '4 côtés',
    niv: 'facile',
    expl: '4 côtés de même longueur et 4 angles droits.',
  },
  {
    id: 'rectangle',
    nom: 'rectangle',
    image: '▬',
    cotes: '4 côtés',
    niv: 'facile',
    expl: '4 angles droits et les côtés opposés de même longueur.',
  },
  {
    id: 'triangle',
    nom: 'triangle',
    image: '🔺',
    cotes: '3 côtés',
    niv: 'facile',
    expl: '3 côtés et 3 sommets.',
  },
  {
    id: 'cercle',
    nom: 'cercle',
    image: '⚪',
    cotes: 'aucun côté',
    niv: 'facile',
    expl: 'une ligne courbe dont tous les points sont à la même distance du centre.',
  },
  {
    id: 'triangle_rectangle',
    nom: 'triangle rectangle',
    image: '◺',
    cotes: '3 côtés',
    niv: 'normal',
    expl: 'un triangle qui a un angle droit.',
  },
  {
    id: 'losange',
    nom: 'losange',
    image: '🔷',
    cotes: '4 côtés',
    niv: 'plus_loin',
    expl: '4 côtés de même longueur, mais pas forcément d’angle droit (vu au CE2).',
  },
];

const figuresShape: ItemGen = (level, rng, ctx) => {
  const figs = auNiveau(level, FIGURES);
  const forme = level === 'facile' ? 0 : rng.int(0, 2);
  if (forme === 0) {
    const f = rng.pick(figs);
    const choices = rng.shuffle([
      f.nom,
      ...rng
        .shuffle(figs.filter((x) => x.id !== f.id).map((x) => x.nom))
        .slice(0, level === 'facile' ? 2 : 3),
    ]);
    return make(ctx, 'geometry_shape', `nommer-${f.id}`, {
      prompt: 'Comment s’appelle cette figure ?',
      task: 'nommer',
      shape: f.id,
      choices,
      answer: f.nom,
      explication: `C’est un ${f.nom} : ${f.expl}`,
      difficulty: f.niv === 'facile' ? 0.2 : 0.5,
    });
  }
  if (forme === 1) {
    // Propriétés d'une figure dessinée
    const q = rng.pick([
      {
        shape: 'carre',
        p: 'Combien d’angles droits a ce carré ?',
        a: '4',
        c: ['0', '1', '2', '4'],
        e: 'Un carré a 4 angles droits (on vérifie avec l’équerre).',
      },
      {
        shape: 'rectangle',
        p: 'Combien d’angles droits a ce rectangle ?',
        a: '4',
        c: ['0', '1', '2', '4'],
        e: 'Un rectangle a 4 angles droits.',
      },
      {
        shape: 'triangle_rectangle',
        p: 'Combien d’angles droits a ce triangle rectangle ?',
        a: '1',
        c: ['0', '1', '2', '3'],
        e: 'Un triangle rectangle a un seul angle droit.',
      },
      {
        shape: 'triangle',
        p: 'Combien de sommets a ce triangle ?',
        a: '3',
        c: ['2', '3', '4'],
        e: 'Un triangle a 3 sommets et 3 côtés.',
      },
      {
        shape: 'rectangle',
        p: 'Les 4 côtés de ce rectangle ont-ils tous la même longueur ?',
        a: 'non',
        c: ['oui', 'non'],
        e: 'Dans ce rectangle, seuls les côtés opposés ont la même longueur.',
      },
      {
        shape: 'carre',
        p: 'Les 4 côtés de ce carré ont-ils la même longueur ?',
        a: 'oui',
        c: ['oui', 'non'],
        e: 'Un carré a 4 côtés de même longueur.',
      },
      {
        shape: 'cercle',
        p: 'Combien de sommets a un cercle ?',
        a: '0',
        c: ['0', '1', '4'],
        e: 'Un cercle est une ligne courbe : il n’a ni côté ni sommet.',
      },
      {
        shape: 'cercle',
        p: 'Comment s’appelle le point marqué au milieu du cercle ?',
        a: 'le centre',
        c: ['le centre', 'le sommet', 'le côté'],
        e: 'Le point au milieu du cercle est son centre.',
      },
    ]);
    return make(ctx, 'geometry_shape', `prop-${q.p}`, {
      prompt: q.p,
      task: 'proprietes',
      shape: q.shape,
      choices: q.c,
      answer: q.a,
      explication: q.e,
      difficulty: 0.45,
    });
  }
  // Angles et alignement (vocabulaire BO : angle droit, aigu, obtus ; points alignés)
  const q = rng.pick([
    {
      shape: 'angle_droit',
      p: 'Cet angle est…',
      a: 'droit',
      c: ['droit', 'aigu', 'obtus'],
      e: 'Il a la forme du coin de l’équerre : c’est un angle droit.',
    },
    {
      shape: 'angle_aigu',
      p: 'Cet angle est…',
      a: 'aigu',
      c: ['droit', 'aigu', 'obtus'],
      e: 'Il est plus petit qu’un angle droit : il est aigu.',
    },
    {
      shape: 'angle_obtus',
      p: 'Cet angle est…',
      a: 'obtus',
      c: ['droit', 'aigu', 'obtus'],
      e: 'Il est plus grand qu’un angle droit : il est obtus.',
    },
    {
      shape: 'points_alignes',
      p: 'Ces trois points sont-ils alignés ?',
      a: 'oui',
      c: ['oui', 'non'],
      e: 'On peut tracer une ligne droite qui passe par les trois points (on vérifie avec la règle).',
    },
    {
      shape: 'points_non_alignes',
      p: 'Ces trois points sont-ils alignés ?',
      a: 'non',
      c: ['oui', 'non'],
      e: 'Aucune ligne droite ne passe par les trois points à la fois.',
    },
  ]);
  return make(ctx, 'geometry_shape', `angle-${q.shape}`, {
    prompt: q.p,
    task: 'proprietes',
    shape: q.shape,
    choices: q.c,
    answer: q.a,
    explication: q.e,
    difficulty: 0.55,
  });
};

const figuresClasser: ItemGen = (level, rng, ctx) => {
  const cats = ['3 côtés', '4 côtés', 'aucun côté'];
  const figs = rng.shuffle(auNiveau(level, FIGURES)).slice(0, level === 'facile' ? 3 : 4);
  if (!figs.some((f) => f.cotes === '3 côtés')) figs.push(FIGURES[2]!);
  if (!figs.some((f) => f.cotes === '4 côtés')) figs.push(FIGURES[0]!);
  return make(ctx, 'classification', `classer-${figs.map((f) => f.id).join('|')}`, {
    prompt: 'Range chaque figure selon son nombre de côtés.',
    categories: cats,
    elements: figs.map((f) => ({ label: f.nom, category: cats.indexOf(f.cotes), image: f.image })),
    explication:
      'On compte les côtés : 3 pour un triangle, 4 pour un carré, un rectangle (ou un losange), aucun pour un cercle.',
    difficulty: level === 'facile' ? 0.25 : 0.45,
  });
};

const VRAI_FAUX_FIG: { s: string; v: boolean; e: string; niv: Level }[] = [
  { s: 'Un carré a 4 côtés.', v: true, e: 'Un carré a 4 côtés de même longueur.', niv: 'facile' },
  { s: 'Un triangle a 4 sommets.', v: false, e: 'Un triangle a 3 sommets et 3 côtés.', niv: 'facile' },
  {
    s: 'Un cercle a des côtés.',
    v: false,
    e: 'Un cercle est une ligne courbe : il n’a pas de côté.',
    niv: 'facile',
  },
  {
    s: 'Un rectangle a 4 angles droits.',
    v: true,
    e: 'Les 4 angles d’un rectangle sont droits.',
    niv: 'facile',
  },
  {
    s: 'Dans un rectangle, les côtés opposés ont la même longueur.',
    v: true,
    e: 'Un rectangle a ses côtés opposés de même longueur.',
    niv: 'normal',
  },
  {
    s: 'Un triangle rectangle a 2 angles droits.',
    v: false,
    e: 'Un triangle rectangle a un seul angle droit.',
    niv: 'normal',
  },
  {
    s: 'Un angle aigu est plus grand qu’un angle droit.',
    v: false,
    e: 'Un angle aigu est plus petit qu’un angle droit ; l’angle obtus est plus grand.',
    niv: 'normal',
  },
  {
    s: 'Un angle obtus est plus grand qu’un angle droit.',
    v: true,
    e: 'Obtus = plus grand qu’un angle droit.',
    niv: 'normal',
  },
  {
    s: 'On vérifie qu’un angle est droit avec l’équerre.',
    v: true,
    e: 'L’équerre sert à vérifier et à tracer les angles droits.',
    niv: 'normal',
  },
  {
    s: 'Le milieu d’un segment est à la même distance des deux bouts.',
    v: true,
    e: 'Le milieu partage le segment en deux parties de même longueur.',
    niv: 'normal',
  },
  {
    s: 'Tous les points d’un cercle sont à la même distance du centre.',
    v: true,
    e: 'C’est ce qui fait qu’un cercle est bien rond.',
    niv: 'normal',
  },
  {
    s: 'Une figure à 4 côtés dont un angle n’est pas droit peut être un rectangle.',
    v: false,
    e: 'Ce n’est pas un rectangle, car un rectangle a 4 angles droits.',
    niv: 'normal',
  },
  {
    s: 'Un carré est aussi un rectangle.',
    v: true,
    e: 'Un carré a 4 angles droits et ses côtés opposés sont égaux : c’est un rectangle particulier.',
    niv: 'plus_loin',
  },
  {
    s: 'Un losange a 4 côtés de la même longueur.',
    v: true,
    e: 'Le losange a 4 côtés égaux (vu au CE2).',
    niv: 'plus_loin',
  },
  {
    s: 'Un losange a toujours 4 angles droits.',
    v: false,
    e: 'Un losange n’a pas forcément d’angle droit ; s’il en a, c’est un carré.',
    niv: 'plus_loin',
  },
];

const figuresVraiFaux: ItemGen = (level, rng, ctx) => {
  const f = rng.pick(auNiveau(level, VRAI_FAUX_FIG));
  return make(ctx, 'true_false', `vf-${f.s}`, {
    statement: f.s,
    answer: f.v,
    explication: f.e,
    difficulty: f.niv === 'facile' ? 0.2 : f.niv === 'normal' ? 0.5 : 0.75,
  });
};

const QCM_FIG: { q: string; a: string; w: string[]; niv: Level; e: string }[] = [
  {
    q: 'Le point au milieu d’un cercle s’appelle…',
    a: 'le centre',
    w: ['le sommet', 'le côté', 'l’angle'],
    niv: 'facile',
    e: 'Le centre est le point au milieu du cercle.',
  },
  {
    q: 'Le « coin » d’un carré s’appelle…',
    a: 'un sommet',
    w: ['un centre', 'un côté', 'un milieu'],
    niv: 'facile',
    e: 'Les coins d’une figure sont ses sommets.',
  },
  {
    q: 'Combien de côtés a un rectangle ?',
    a: '4',
    w: ['3', '5', '2'],
    niv: 'facile',
    e: 'Un rectangle a 4 côtés.',
  },
  {
    q: 'Quelle figure a 3 côtés et un angle droit ?',
    a: 'le triangle rectangle',
    w: ['le carré', 'le rectangle', 'le cercle'],
    niv: 'normal',
    e: 'Un triangle avec un angle droit est un triangle rectangle.',
  },
  {
    q: 'Quelle figure a 4 angles droits et 4 côtés de même longueur ?',
    a: 'le carré',
    w: ['le rectangle', 'le triangle', 'le cercle'],
    niv: 'normal',
    e: 'Le carré a 4 angles droits et 4 côtés égaux.',
  },
  {
    q: 'Un angle plus petit qu’un angle droit est…',
    a: 'aigu',
    w: ['obtus', 'droit', 'plat'],
    niv: 'normal',
    e: 'Aigu = plus petit qu’un angle droit.',
  },
  {
    q: 'Quel code dessine-t-on pour montrer un angle droit ?',
    a: 'un petit carré dans le coin',
    w: ['un rond', 'une croix', 'une flèche'],
    niv: 'normal',
    e: 'On code un angle droit avec un petit carré dans le coin.',
  },
  {
    q: 'Comment trouver le milieu d’un segment tracé sur une feuille ?',
    a: 'en pliant la feuille pour que les deux bouts se touchent',
    w: ['avec le compas', 'en coloriant le segment', 'en le coupant au hasard'],
    niv: 'normal',
    e: 'Par pliage, on superpose les deux bouts : le pli passe par le milieu.',
  },
  {
    q: 'Quelle figure a 4 côtés égaux mais pas forcément d’angle droit ?',
    a: 'le losange',
    w: ['le rectangle', 'le triangle', 'le cercle'],
    niv: 'plus_loin',
    e: 'C’est le losange (CE2).',
  },
];

const figuresQcm: ItemGen = (level, rng, ctx) => {
  const q = rng.pick(auNiveau(level, QCM_FIG));
  return mcq(ctx, rng, `qcm-${q.q}`, {
    question: q.q,
    good: q.a,
    wrong: q.w,
    explication: q.e,
    difficulty: q.niv === 'facile' ? 0.2 : q.niv === 'normal' ? 0.5 : 0.75,
    max: level === 'facile' ? 3 : 4,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GEO.TRACER                                                   */
/* ------------------------------------------------------------------ */

const tracerShape: ItemGen = (level, rng, ctx) => {
  if (level === 'facile' || (level === 'plus_loin' && rng.chance(0.5))) {
    // Reproduire une figure sur quadrillage (sommets aux nœuds du quadrillage)
    const cols = 12;
    const rows = 10;
    const x0 = rng.int(1, 3);
    const y0 = rng.int(1, 3);
    const a = rng.int(2, 5);
    const b = rng.int(2, 4);
    const figs: { id: string; nom: string; s: Cell[] }[] =
      level === 'facile'
        ? [
            {
              id: 'carre',
              nom: 'carré',
              s: [
                [x0, y0],
                [x0 + a, y0],
                [x0 + a, y0 + a],
                [x0, y0 + a],
              ],
            },
            {
              id: 'rectangle',
              nom: 'rectangle',
              s: [
                [x0, y0],
                [x0 + a + 2, y0],
                [x0 + a + 2, y0 + b],
                [x0, y0 + b],
              ],
            },
            {
              id: 'triangle_rectangle',
              nom: 'triangle rectangle',
              s: [
                [x0, y0],
                [x0, y0 + b],
                [x0 + a, y0 + b],
              ],
            },
          ]
        : [
            // Côtés obliques (pour aller plus loin)
            {
              id: 'carre',
              nom: 'carré',
              s: [
                [x0 + 2, y0],
                [x0 + 4, y0 + 2],
                [x0 + 2, y0 + 4],
                [x0, y0 + 2],
              ],
            },
            {
              id: 'triangle_rectangle',
              nom: 'triangle rectangle',
              s: [
                [x0, y0 + 2],
                [x0 + 2, y0],
                [x0 + 5, y0 + 3],
              ],
            },
            {
              id: 'rectangle',
              nom: 'rectangle',
              s: [
                [x0, y0 + 1],
                [x0 + 1, y0],
                [x0 + 4, y0 + 3],
                [x0 + 3, y0 + 4],
              ],
            },
          ];
    const f = rng.pick(figs);
    return make(ctx, 'geometry_shape', `reproduire-${f.id}-${cellsTxt(f.s)}`, {
      prompt: `Reproduis ce ${f.nom} sur le quadrillage.`,
      task: 'tracer',
      shape: f.id,
      answer: f.nom,
      grid: { cols, rows, cells: f.s },
      explication: 'Compte les carreaux entre les sommets, puis relie-les à la règle.',
      difficulty: level === 'facile' ? 0.3 : 0.8,
      meta: { tracer: { figure: f.id, sommets: f.s, instrument: 'regle', support: 'quadrillage' } },
    });
  }
  const forme = rng.int(0, 3);
  if (forme === 0) {
    const l = rng.int(3, 15);
    return make(ctx, 'geometry_shape', `segment-${l}`, {
      prompt: `Trace un segment de ${l} cm.`,
      task: 'tracer',
      shape: 'segment',
      answer: `${l} cm`,
      explication: `On part du 0 de la règle et on s’arrête à ${l}.`,
      difficulty: 0.4,
      meta: { tracer: { figure: 'segment', longueur: l, unite: 'cm', instrument: 'regle' } },
    });
  }
  if (forme === 1) {
    return make(ctx, 'geometry_shape', 'angle-droit', {
      prompt: 'Trace un angle droit avec l’équerre.',
      task: 'tracer',
      shape: 'angle_droit',
      answer: 'angle droit',
      explication: 'On place le coin de l’équerre sur le sommet et on trace le long des deux bords.',
      difficulty: 0.5,
      meta: { tracer: { figure: 'angle_droit', instrument: 'equerre' } },
    });
  }
  if (forme === 2) {
    const r = rng.int(2, 6);
    return make(ctx, 'geometry_shape', `cercle-${r}`, {
      prompt: `Trace un cercle de centre O qui passe par le point A (OA = ${r} cm).`,
      task: 'tracer',
      shape: 'cercle',
      answer: `rayon ${r} cm`,
      explication: `On pique la pointe du compas sur O, on écarte jusqu’à A (${r} cm), puis on tourne.`,
      difficulty: 0.55,
      meta: { tracer: { figure: 'cercle', rayon: r, unite: 'cm', instrument: 'compas' } },
    });
  }
  const L = rng.int(4, 9);
  const lg = rng.int(2, L - 1);
  return make(ctx, 'geometry_shape', `rectangle-${L}-${lg}`, {
    prompt: `Trace un rectangle de ${L} cm sur ${lg} cm avec la règle et l’équerre.`,
    task: 'tracer',
    shape: 'rectangle',
    answer: `rectangle ${L} cm × ${lg} cm`,
    explication:
      'On trace un côté à la règle, puis les angles droits à l’équerre, et on reporte les longueurs.',
    difficulty: 0.7,
    meta: { tracer: { figure: 'rectangle', longueur: L, largeur: lg, unite: 'cm', instrument: 'equerre' } },
  });
};

const OUTILS: { q: string; a: string; e: string }[] = [
  {
    q: 'Pour tracer un angle droit, j’utilise…',
    a: 'l’équerre',
    e: 'L’équerre a un angle droit : elle sert à le tracer et à le vérifier.',
  },
  {
    q: 'Pour tracer un cercle, j’utilise…',
    a: 'le compas',
    e: 'Le compas trace des cercles : sa pointe se pique sur le centre.',
  },
  {
    q: 'Pour tracer un segment de 7 cm, j’utilise…',
    a: 'la règle graduée',
    e: 'La règle graduée permet de mesurer et de tracer une longueur précise.',
  },
  {
    q: 'Pour vérifier que trois points sont alignés, j’utilise…',
    a: 'la règle',
    e: 'On pose la règle : si elle passe par les trois points, ils sont alignés.',
  },
];

const tracerQcm: ItemGen = (level, rng, ctx) => {
  const o = rng.pick(OUTILS);
  return mcq(ctx, rng, `outil-${o.q}`, {
    question: o.q,
    good: o.a,
    wrong: ['l’équerre', 'le compas', 'la règle graduée', 'la règle', 'la gomme'].filter(
      (x) => x !== o.a && !(o.a.includes('règle') && x.includes('règle')),
    ),
    explication: o.e,
    difficulty: level === 'facile' ? 0.2 : 0.35,
    max: level === 'facile' ? 3 : 4,
  });
};

const ETAPES: { titre: string; etapes: string[]; niv: Level }[] = [
  {
    titre: 'Remets dans l’ordre les étapes pour reproduire une figure sur le quadrillage.',
    etapes: [
      'Je repère les sommets de la figure.',
      'Je compte les carreaux entre les sommets.',
      'Je place les points sur mon quadrillage.',
      'Je relie les points avec la règle.',
    ],
    niv: 'facile',
  },
  {
    titre: 'Remets dans l’ordre les étapes pour tracer un segment de 6 cm.',
    etapes: [
      'Je pose la règle sur la feuille.',
      'Je fais un point en face du 0.',
      'Je fais un point en face du 6.',
      'Je relie les deux points le long de la règle.',
    ],
    niv: 'facile',
  },
  {
    titre: 'Remets dans l’ordre les étapes pour tracer un cercle.',
    etapes: [
      'Je marque le centre.',
      'J’écarte le compas de la bonne longueur.',
      'Je pique la pointe sur le centre.',
      'Je tourne le compas sans appuyer trop fort.',
    ],
    niv: 'normal',
  },
  {
    titre: 'Remets dans l’ordre les étapes pour tracer un angle droit.',
    etapes: [
      'Je trace un premier trait à la règle.',
      'Je place le coin de l’équerre sur le bout du trait.',
      'Je colle un bord de l’équerre contre le trait.',
      'Je trace le long de l’autre bord.',
    ],
    niv: 'normal',
  },
  {
    titre: 'Remets dans l’ordre les étapes pour trouver le milieu d’un segment.',
    etapes: [
      'Je trace le segment.',
      'Je plie la feuille pour que les deux bouts se touchent.',
      'Je marque le point où le pli coupe le segment.',
    ],
    niv: 'normal',
  },
  {
    titre: 'Remets dans l’ordre les étapes pour tracer un rectangle.',
    etapes: [
      'Je trace un premier côté à la règle.',
      'Je trace un angle droit à chaque bout avec l’équerre.',
      'Je reporte la longueur des deux autres côtés.',
      'Je relie les deux derniers sommets.',
    ],
    niv: 'plus_loin',
  },
];

const tracerOrdre: ItemGen = (level, rng, ctx) => {
  const e = rng.pick(auNiveau(level, ETAPES));
  return make(ctx, 'ordering', `etapes-${e.titre}`, {
    prompt: e.titre,
    elements: e.etapes,
    mode: 'etapes',
    explication: e.etapes.join(' '),
    difficulty: e.niv === 'facile' ? 0.3 : 0.55,
  });
};

const tracerNumeric: ItemGen = (level, rng, ctx) => {
  if (rng.chance(0.5)) {
    const l = parNiv(level, {
      facile: rng.int(1, 5) * 2,
      normal: rng.int(2, 10) * 2,
      plus_loin: rng.int(3, 15) * 2 + (rng.chance(0.5) ? 1 : 0),
    });
    const demi = l / 2;
    return numeric(ctx, `milieu-${l}`, {
      prompt: `Un segment mesure ${l} cm. À combien de centimètres de chaque bout se trouve son milieu ?`,
      answer: demi,
      unit: 'cm',
      explication: `Le milieu partage le segment en deux parties égales : la moitié de ${l} cm, c’est ${String(demi).replace('.', ',')} cm.`,
      difficulty: Number.isInteger(demi) ? 0.4 : 0.8,
    });
  }
  const [objet, nom] = rng.pick([
    ['✏️', 'le crayon'],
    ['📎', 'le trombone'],
    ['🖍️', 'la craie'],
  ] as const);
  const cm = rng.int(3, level === 'facile' ? 10 : 15);
  return numeric(ctx, `mesure-${objet}-${cm}`, {
    prompt: `Mesure ${nom} avec la règle graduée.`,
    answer: cm,
    unit: 'cm',
    explication: `On place bien le 0 de la règle au bout de l’objet : il mesure ${cm} cm.`,
    difficulty: 0.3,
    meta: { mesure: { objet, longueur: cm, unite: 'cm' } },
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GEO.SYMETRIE — pour aller plus loin (CE2)                    */
/* ------------------------------------------------------------------ */

/** Forme connexe aléatoire de k cases dans la zone autorisée. */
function formeConnexe(rng: Rng, k: number, ok: (c: Cell) => boolean, start: Cell): Cell[] {
  const cells: Cell[] = [start];
  const seen = new Set([cellKey(start)]);
  let guard = 0;
  while (cells.length < k && guard++ < 500) {
    const [x, y] = rng.pick(cells);
    const [dx, dy] = rng.pick([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const);
    const c: Cell = [x + dx, y + dy];
    if (ok(c) && !seen.has(cellKey(c))) {
      seen.add(cellKey(c));
      cells.push(c);
    }
  }
  return cells;
}

const symetrieShape: ItemGen = (level, rng, ctx) => {
  const axis = parNiv(level, {
    facile: 'vertical' as const,
    normal: rng.pick(['vertical', 'horizontal'] as const),
    plus_loin: rng.pick(['vertical', 'horizontal', 'diagonale', 'diagonale'] as const),
  });
  const k = parNiv(level, { facile: rng.int(3, 4), normal: rng.int(4, 6), plus_loin: rng.int(5, 7) });
  let cols: number;
  let rows: number;
  let ok: (c: Cell) => boolean;
  let miroir: (c: Cell) => Cell;
  let start: Cell;
  if (axis === 'vertical') {
    cols = 8;
    rows = 6;
    ok = ([x, y]) => x >= 0 && x < cols / 2 && y >= 0 && y < rows;
    miroir = ([x, y]) => [cols - 1 - x, y];
    start = [rng.int(1, cols / 2 - 1), rng.int(0, rows - 1)];
  } else if (axis === 'horizontal') {
    cols = 8;
    rows = 6;
    ok = ([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows / 2;
    miroir = ([x, y]) => [x, rows - 1 - y];
    start = [rng.int(0, cols - 1), rng.int(1, rows / 2 - 1)];
  } else {
    // Axe = diagonale qui va du coin en haut à gauche au coin en bas à droite
    cols = 6;
    rows = 6;
    ok = ([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows && x > y;
    miroir = ([x, y]) => [y, x];
    start = [rng.int(2, cols - 1), rng.int(0, 1)];
  }
  const cells = formeConnexe(rng, k, ok, start).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const solution = cells.map(miroir).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const nomAxe = axis === 'vertical' ? 'vertical' : axis === 'horizontal' ? 'horizontal' : 'en diagonale';
  return make(ctx, 'geometry_shape', `sym-${axis}-${cellsTxt(cells)}`, {
    prompt: `Colorie les cases symétriques par rapport à l’axe ${nomAxe}.`,
    task: 'symetrie',
    shape: 'grille',
    answer: cellsTxt(solution),
    grid: { cols, rows, cells, axis },
    explication:
      'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
    difficulty: clamp01(0.2 + k * 0.06 + (axis === 'diagonale' ? 0.3 : axis === 'horizontal' ? 0.1 : 0)),
    meta: {
      solution,
      axe:
        axis === 'vertical'
          ? { entreColonnes: [cols / 2 - 1, cols / 2] }
          : axis === 'horizontal'
            ? { entreLignes: [rows / 2 - 1, rows / 2] }
            : { diagonale: 'haut-gauche → bas-droite' },
    },
  });
};

const AXE_VERTICAL = ['A', 'H', 'I', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y'];
const SANS_AXE = ['F', 'G', 'J', 'L', 'N', 'P', 'R', 'S', 'Z'];

const symetrieQcm: ItemGen = (_level, rng, ctx) => {
  const avec = rng.chance(0.6);
  const good = rng.pick(avec ? AXE_VERTICAL : SANS_AXE);
  return mcq(ctx, rng, `lettre-${avec}-${good}`, {
    question: avec
      ? 'Quelle lettre a un axe de symétrie vertical (on peut la plier en deux moitiés pareilles) ?'
      : 'Quelle lettre n’a aucun axe de symétrie ?',
    good,
    wrong: avec ? SANS_AXE : AXE_VERTICAL,
    explication: avec
      ? `Si on plie ${good} au milieu (de haut en bas), les deux moitiés se superposent.`
      : `${good} n’a aucun pli qui donne deux moitiés qui se superposent.`,
    difficulty: 0.5,
  });
};

const symetrieClasser: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : 4;
  const els = [
    ...rng
      .shuffle(AXE_VERTICAL)
      .slice(0, n)
      .map((l) => ({ label: l, category: 0 })),
    ...rng
      .shuffle(SANS_AXE)
      .slice(0, n)
      .map((l) => ({ label: l, category: 1 })),
  ];
  return make(ctx, 'classification', `lettres-${els.map((e) => e.label).join('')}`, {
    prompt: 'Range ces lettres majuscules : ont-elles un axe de symétrie vertical ?',
    categories: ['axe de symétrie vertical', 'pas d’axe de symétrie'],
    elements: rng.shuffle(els),
    explication:
      'Une lettre a un axe de symétrie si on peut la plier en deux moitiés qui se superposent exactement.',
    difficulty: 0.5,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GEO.SOLIDES                                                  */
/* ------------------------------------------------------------------ */

const SOLIDES: {
  id: string;
  nom: string;
  faces: number;
  aretes: number;
  sommets: number;
  formeFaces: string;
  roule: boolean;
}[] = [
  { id: 'cube', nom: 'cube', faces: 6, aretes: 12, sommets: 8, formeFaces: 'des carrés', roule: false },
  { id: 'pave', nom: 'pavé', faces: 6, aretes: 12, sommets: 8, formeFaces: 'des rectangles', roule: false },
  {
    id: 'pyramide',
    nom: 'pyramide',
    faces: 5,
    aretes: 8,
    sommets: 5,
    formeFaces: 'des triangles et un carré',
    roule: false,
  },
  { id: 'boule', nom: 'boule', faces: 0, aretes: 0, sommets: 0, formeFaces: '', roule: true },
  { id: 'cylindre', nom: 'cylindre', faces: 2, aretes: 2, sommets: 0, formeFaces: '', roule: true },
  { id: 'cone', nom: 'cône', faces: 1, aretes: 1, sommets: 1, formeFaces: '', roule: true },
];
const POLYEDRES = SOLIDES.slice(0, 3);

/**
 * Un assemblage de 6 carrés est-il un patron de cube ? On fait « rouler » un cube sur l'assemblage :
 * c'est un patron si chaque carré est touché par une face différente du cube.
 */
export function estPatronDeCube(cells: Cell[]): boolean {
  if (cells.length !== 6) return false;
  // Faces du cube (0 à 5) tournées vers : dessous, dessus, nord (haut de l'écran), sud, est, ouest.
  type O = { bas: number; haut: number; n: number; s: number; e: number; o: number };
  const keys = new Set(cells.map(cellKey));
  const rouler: [number, number, (q: O) => O][] = [
    [1, 0, (q) => ({ ...q, bas: q.e, o: q.bas, e: q.haut, haut: q.o })],
    [-1, 0, (q) => ({ ...q, bas: q.o, e: q.bas, o: q.haut, haut: q.e })],
    [0, 1, (q) => ({ ...q, bas: q.s, n: q.bas, s: q.haut, haut: q.n })],
    [0, -1, (q) => ({ ...q, bas: q.n, s: q.bas, n: q.haut, haut: q.s })],
  ];
  const start = cells[0]!;
  const etat = new Map<string, O>([[cellKey(start), { bas: 0, haut: 1, n: 2, s: 3, e: 4, o: 5 }]]);
  const file: Cell[] = [start];
  while (file.length) {
    const c = file.shift()!;
    const q = etat.get(cellKey(c))!;
    for (const [dx, dy, f] of rouler) {
      const v: Cell = [c[0] + dx, c[1] + dy];
      const k = cellKey(v);
      if (!keys.has(k) || etat.has(k)) continue;
      etat.set(k, f(q));
      file.push(v);
    }
  }
  return etat.size === 6 && new Set([...etat.values()].map((q) => q.bas)).size === 6;
}

/** Les 11 patrons du cube + quelques assemblages de 6 carrés qui n'en sont pas. */
const PATRONS: Cell[][] = [
  // 1-4-1
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [3, 2],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 2],
  ],
  // 2-3-1
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [3, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ],
  // 2-2-2 et 3-3
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 1],
    [4, 1],
  ],
  // Assemblages qui ne sont pas des patrons (la réponse est de toute façon recalculée par estPatronDeCube)
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [3, 0],
  ],
];

const OBJETS_SOLIDES: { o: string; img: string; s: string }[] = [
  { o: 'un dé', img: '🎲', s: 'cube' },
  { o: 'un glaçon', img: '🧊', s: 'cube' },
  { o: 'une boite à chaussures', img: '📦', s: 'pavé' },
  { o: 'une brique', img: '🧱', s: 'pavé' },
  { o: 'une boite de conserve', img: '🥫', s: 'cylindre' },
  { o: 'une bougie', img: '🕯️', s: 'cylindre' },
  { o: 'une balle de tennis', img: '🎾', s: 'boule' },
  { o: 'une orange', img: '🍊', s: 'boule' },
  { o: 'un ballon de football', img: '⚽', s: 'boule' },
  { o: 'un cornet de glace', img: '🍦', s: 'cône' },
  { o: 'un chapeau pointu de fête', img: '🥳', s: 'cône' },
];

const solidesShape: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: 0, normal: rng.int(0, 1), plus_loin: rng.int(0, 2) });
  if (forme === 0) {
    const s = rng.pick(SOLIDES);
    return make(ctx, 'geometry_shape', `nommer-${s.id}`, {
      prompt: 'Quel est ce solide ?',
      task: 'solide',
      shape: s.id,
      choices: rng.shuffle([
        s.nom,
        ...rng.shuffle(SOLIDES.filter((x) => x.id !== s.id).map((x) => x.nom)).slice(0, 3),
      ]),
      answer: s.nom,
      explication:
        s.faces && s.formeFaces
          ? `C’est ${s.nom === 'pyramide' ? 'une' : 'un'} ${s.nom} : ses faces sont ${s.formeFaces}.`
          : `C’est ${s.nom === 'boule' ? 'une boule : elle est toute ronde' : s.nom === 'cône' ? 'un cône : il a une pointe et un disque' : 'un cylindre : il a deux disques et roule'}.`,
      difficulty: 0.25,
    });
  }
  if (forme === 1) {
    const s = rng.pick(POLYEDRES);
    const quoi = rng.pick(['faces', 'arêtes', 'sommets'] as const);
    const n = quoi === 'faces' ? s.faces : quoi === 'arêtes' ? s.aretes : s.sommets;
    const choix = [...new Set([n, 4, 5, 6, 8, 12])].sort((a, b) => a - b).map(String);
    return make(ctx, 'geometry_shape', `compter-${s.id}-${quoi}`, {
      prompt: `Combien ${s.nom === 'pyramide' ? 'cette pyramide à base carrée' : `ce ${s.nom}`} a-t-${s.nom === 'pyramide' ? 'elle' : 'il'} de ${quoi} ?`,
      task: 'proprietes',
      shape: s.id,
      choices: choix,
      answer: String(n),
      explication: `${s.nom === 'pyramide' ? 'La pyramide à base carrée' : `Le ${s.nom}`} a ${s.faces} faces (${s.formeFaces}), ${s.aretes} arêtes et ${s.sommets} sommets.`,
      difficulty: 0.55,
    });
  }
  // Patron du cube (CE2)
  const cells = rng.pick(PATRONS);
  const oui = estPatronDeCube(cells);
  return make(ctx, 'geometry_shape', `patron-${cellsTxt(cells)}`, {
    prompt: 'Ce patron permet-il de fabriquer un cube ?',
    task: 'patron',
    shape: 'patron_cube',
    choices: ['oui', 'non'],
    answer: oui ? 'oui' : 'non',
    grid: { cols: 6, rows: 4, cells },
    explication: oui
      ? 'En pliant, chacune des 6 faces trouve sa place : on obtient un cube.'
      : 'En pliant, deux carrés se retrouvent l’un sur l’autre et une face manque : ce n’est pas un patron de cube.',
    difficulty: 0.8,
  });
};

const solidesQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'facile' || rng.chance(0.5)) {
    const o = rng.pick(OBJETS_SOLIDES);
    return mcq(ctx, rng, `objet-${o.o}`, {
      question: `${o.img} ${o.o[0]!.toUpperCase()}${o.o.slice(1)} a la forme…`,
      good: o.s === 'boule' ? 'd’une boule' : `d’un ${o.s}`,
      wrong: ['d’un cube', 'd’un pavé', 'd’un cylindre', 'd’une boule', 'd’un cône', 'd’une pyramide'],
      explication: `${o.o[0]!.toUpperCase()}${o.o.slice(1)} a la forme d’${o.s === 'boule' ? 'une' : 'un'} ${o.s}.`,
      difficulty: 0.25,
      max: level === 'facile' ? 3 : 4,
    });
  }
  const s = rng.pick(POLYEDRES);
  if (rng.chance(0.5))
    return mcq(ctx, rng, `faces-${s.id}`, {
      question: `Quelle est la forme des faces d’${s.nom === 'pyramide' ? 'une pyramide à base carrée' : `un ${s.nom}`} ?`,
      good: s.formeFaces,
      wrong: POLYEDRES.map((x) => x.formeFaces).concat(['des cercles']),
      explication: `Les faces d’${s.nom === 'pyramide' ? 'une pyramide à base carrée' : `un ${s.nom}`} sont ${s.formeFaces}.`,
      difficulty: 0.5,
    });
  const roule = rng.pick(SOLIDES.filter((x) => x.roule)).nom;
  return mcq(ctx, rng, `roule-${roule}`, {
    question: 'Quel solide peut rouler ?',
    good: roule,
    wrong: SOLIDES.filter((x) => !x.roule).map((x) => x.nom),
    explication: 'Les solides qui ont une partie arrondie (boule, cylindre, cône) peuvent rouler.',
    difficulty: 0.35,
  });
};

const solidesClasser: ItemGen = (level, rng, ctx) => {
  const cats = rng
    .shuffle(['cube', 'pavé', 'cylindre', 'boule', 'cône'])
    .slice(0, level === 'facile' ? 2 : 3);
  const els = rng
    .shuffle(OBJETS_SOLIDES.filter((o) => cats.includes(o.s)))
    .map((o) => ({ label: o.o, category: cats.indexOf(o.s), image: o.img }));
  return make(ctx, 'classification', `objets-${els.map((e) => e.label).join('|')}`, {
    prompt: 'Range chaque objet selon sa forme.',
    categories: cats,
    elements: els,
    explication:
      'Regarde les faces : carrées pour le cube, rectangles pour le pavé ; ronde pour la boule ; deux disques pour le cylindre ; une pointe pour le cône.',
    difficulty: level === 'facile' ? 0.25 : 0.45,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GEO.REPERAGE                                                 */
/* ------------------------------------------------------------------ */

type Dir = 0 | 1 | 2 | 3; // 0 haut, 1 droite, 2 bas, 3 gauche
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const FLECHES = ['↑', '→', '↓', '←'];
const NOM_DIR = ['haut', 'droite', 'bas', 'gauche'];
const VERS_DIR = ['vers le haut', 'vers la droite', 'vers le bas', 'vers la gauche'];

/** Plus court programme : absolu (flèches) ou relatif (A = avancer d'une case, D/G = quart de tour). */
function programme(
  cols: number,
  rows: number,
  obst: Set<string>,
  dep: Cell,
  cible: Cell,
  relatif: boolean,
  dir0: Dir,
): string[] | null {
  type S = { x: number; y: number; d: Dir; prog: string[] };
  const key = (s: S) => (relatif ? `${s.x},${s.y},${s.d}` : `${s.x},${s.y}`);
  const q: S[] = [{ x: dep[0], y: dep[1], d: dir0, prog: [] }];
  const vu = new Set([key(q[0]!)]);
  while (q.length) {
    const s = q.shift()!;
    if (s.x === cible[0] && s.y === cible[1]) return s.prog;
    const next: S[] = relatif
      ? [
          { x: s.x + DX[s.d]!, y: s.y + DY[s.d]!, d: s.d, prog: [...s.prog, 'A'] },
          { x: s.x, y: s.y, d: ((s.d + 1) % 4) as Dir, prog: [...s.prog, 'D'] },
          { x: s.x, y: s.y, d: ((s.d + 3) % 4) as Dir, prog: [...s.prog, 'G'] },
        ]
      : ([0, 1, 2, 3] as Dir[]).map((d) => ({
          x: s.x + DX[d]!,
          y: s.y + DY[d]!,
          d,
          prog: [...s.prog, FLECHES[d]!],
        }));
    for (const n of next) {
      if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows || obst.has(`${n.x},${n.y}`)) continue;
      if (vu.has(key(n))) continue;
      vu.add(key(n));
      q.push(n);
    }
  }
  return null;
}

const reperageRobot: ItemGen = (level, rng, ctx) => {
  const relatif = level !== 'facile';
  const [cols, rows] = parNiv(level, { facile: [5, 5], normal: [6, 6], plus_loin: [7, 6] });
  const nbObst = parNiv(level, { facile: rng.int(0, 2), normal: rng.int(2, 5), plus_loin: rng.int(5, 8) });
  for (let essai = 0; essai < 200; essai++) {
    const dep: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
    const cible: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
    const dist = Math.abs(dep[0] - cible[0]) + Math.abs(dep[1] - cible[1]);
    if (dist < parNiv(level, { facile: 2, normal: 3, plus_loin: 5 })) continue;
    if (level === 'facile' && dist > 5) continue;
    const obstacles: Cell[] = [];
    while (obstacles.length < nbObst) {
      const o: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
      const k = cellKey(o);
      if (k === cellKey(dep) || k === cellKey(cible) || obstacles.some((c) => cellKey(c) === k)) continue;
      obstacles.push(o);
    }
    const dir0 = (relatif ? rng.int(0, 3) : 0) as Dir;
    const prog = programme(cols, rows, new Set(obstacles.map(cellKey)), dep, cible, relatif, dir0);
    if (!prog) continue;
    const virages = prog.filter((p) => p === 'D' || p === 'G').length;
    // BO : au plus 15 instructions dont 4 virages (au niveau normal)
    if (level === 'normal' && (prog.length > 15 || virages > 4)) continue;
    if (level === 'plus_loin' && (prog.length < 8 || prog.length > 20)) continue;
    return make(
      ctx,
      'geometry_shape',
      `robot-${cellKey(dep)}-${cellKey(cible)}-${dir0}-${obstacles.map(cellKey).join(';')}`,
      {
        prompt: relatif
          ? `Programme le robot (il regarde ${VERS_DIR[dir0]}) pour qu’il atteigne le trésor. A = avancer d’une case, D = pivoter d’un quart de tour à droite, G = pivoter d’un quart de tour à gauche.`
          : 'Programme le robot avec les flèches pour qu’il atteigne le trésor.',
        task: 'tracer',
        shape: 'robot',
        answer: prog.join(' '),
        explication: relatif
          ? `Un programme possible (${prog.length} instructions) : ${prog.join(' ')}. Pivoter ne fait pas changer de case, seulement de direction.`
          : `Un chemin possible : ${prog.join(' ')} (${prog.length} cases).`,
        difficulty: clamp01(0.15 + prog.length * 0.04 + (relatif ? 0.2 : 0)),
        meta: {
          robot: { cols, rows, depart: dep, cible, obstacles, relatif, orientation: NOM_DIR[dir0] },
          codes: relatif
            ? { A: 'avancer d’une case', D: 'quart de tour à droite', G: 'quart de tour à gauche' }
            : { '↑': 'haut', '→': 'droite', '↓': 'bas', '←': 'gauche' },
          longueurMini: prog.length,
        },
      },
    );
  }
  return make(ctx, 'geometry_shape', 'robot-secours', {
    prompt: 'Programme le robot avec les flèches pour qu’il atteigne le trésor.',
    task: 'tracer',
    shape: 'robot',
    answer: '→ → ↓',
    explication: 'Un chemin possible : → → ↓.',
    difficulty: 0.2,
    meta: {
      robot: {
        cols: 4,
        rows: 4,
        depart: [0, 0],
        cible: [2, 1],
        obstacles: [],
        relatif: false,
        orientation: 'haut',
      },
    },
  });
};

const ANIMAUX = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵'];
const NOMS_ANIMAUX: Record<string, string> = {
  '🐶': 'le chien',
  '🐱': 'le chat',
  '🐰': 'le lapin',
  '🦊': 'le renard',
  '🐻': 'l’ours',
  '🐼': 'le panda',
  '🐸': 'la grenouille',
  '🐵': 'le singe',
};

const reperageQcm: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : level === 'normal' ? 4 : 5;
  const file = rng.shuffle(ANIMAUX).slice(0, n);
  const vertical = level !== 'facile' && rng.chance(0.4);
  const [avant, apres] = vertical ? ['au-dessus de', 'en dessous de'] : ['à gauche de', 'à droite de'];
  const intro = vertical
    ? `Sur l’étagère, de haut en bas : ${file.join(' ')}.`
    : `Dans la file (de gauche à droite, comme tu la vois) : ${file.join(' ')}.`;
  const forme = n >= 3 && rng.chance(0.35) ? 'entre' : rng.chance(0.5) ? 'avant' : 'apres';
  let good: string;
  let question: string;
  if (forme === 'entre') {
    const i = rng.int(1, n - 2);
    good = file[i]!;
    question = `${intro} Qui est entre ${file[i - 1]} et ${file[i + 1]} ?`;
  } else if (forme === 'avant') {
    const i = rng.int(1, n - 1);
    good = file[i - 1]!;
    question = `${intro} Qui est juste ${avant} ${file[i]} ?`;
  } else {
    const i = rng.int(0, n - 2);
    good = file[i + 1]!;
    question = `${intro} Qui est juste ${apres} ${file[i]} ?`;
  }
  return mcq(ctx, rng, `pos-${question}`, {
    question,
    good,
    wrong: file.filter((a) => a !== good),
    explication: `C’est ${NOMS_ANIMAUX[good]} ${good}.`,
    difficulty: clamp01(0.2 + n * 0.05 + (vertical ? 0.1 : 0)),
  });
};

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
/** « le chat » → « du chat », « l’ours » → « de l’ours ». */
const du = (gn: string) => (gn.startsWith('le ') ? `du ${gn.slice(3)}` : `de ${gn}`);

const reperageVraiFaux: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : 4;
  const file = rng.shuffle(ANIMAUX).slice(0, n);
  const [i, j] = rng.shuffle(Array.from({ length: n }, (_, k) => k)).slice(0, 2) as [number, number];
  const ditGauche = rng.chance(0.5);
  const vrai = ditGauche ? i < j : i > j;
  const a = NOMS_ANIMAUX[file[i]!]!;
  const b = NOMS_ANIMAUX[file[j]!]!;
  return make(ctx, 'true_false', `vf-${file.join('')}-${i}-${j}-${ditGauche}`, {
    statement: `Dans la file (de gauche à droite) : ${file.join(' ')}. ${cap(a)} est à ${ditGauche ? 'gauche' : 'droite'} ${du(b)}.`,
    answer: vrai,
    explication: `${cap(a)} est à ${i < j ? 'gauche' : 'droite'} ${du(b)}.`,
    difficulty: 0.3,
  });
};

export const GEOMETRIE: Record<string, LessonContent> = {
  'CE1.MA.GEO.FIGURES': {
    gens: {
      geometry_shape: figuresShape,
      classification: figuresClasser,
      true_false: figuresVraiFaux,
      mcq: figuresQcm,
    },
  },
  'CE1.MA.GEO.TRACER': {
    gens: {
      geometry_shape: tracerShape,
      mcq: tracerQcm,
      ordering: tracerOrdre,
      numeric_answer: tracerNumeric,
    },
  },
  'CE1.MA.GEO.SYMETRIE': {
    gens: { geometry_shape: symetrieShape, mcq: symetrieQcm, classification: symetrieClasser },
  },
  'CE1.MA.GEO.SOLIDES': {
    gens: { geometry_shape: solidesShape, mcq: solidesQcm, classification: solidesClasser },
  },
  'CE1.MA.GEO.REPERAGE': {
    gens: { geometry_shape: reperageRobot, mcq: reperageQcm, true_false: reperageVraiFaux },
  },
};
