/**
 * CM2 — Espace et géométrie (BO n°16 du 17/04/2025, cycle 3, « La géométrie plane ») :
 * - vocabulaire : point, segment, droite, demi-droite, milieu, perpendiculaires, parallèles, cercle (centre,
 *   rayon, diamètre), sommet, côté, diagonale. Les notations [AB], (AB), [AB) ne sont PAS exigibles : les
 *   consignes nomment toujours l’objet (« le segment [AB] ») et aucun item n’évalue la notation seule ;
 * - figures : triangles (rectangle, isocèle, équilatéral), quadrilatères (carré, rectangle, losange, trapèze,
 *   trapèze rectangle), pentagone, hexagone, cercle ; propriétés (parallélisme, longueurs, angles droits) ;
 *   plus loin : classification inclusive (un carré est un rectangle et un losange) ;
 * - constructions : règle, équerre, compas ; élaborer un programme de construction (cas simples = Normal) ;
 * - symétrie axiale sur quadrillage : axe vertical, horizontal ou diagonal (BO).
 * Les solides et les déplacements sont dans `geometrie-espace.ts`.
 *
 * Conventions :
 * - quadrillage de CASES (`grid.cells`, symétrie) : [x, y], x = colonne (0 à gauche), y = ligne (0 en haut) ;
 * - quadrillage de NŒUDS (`meta.noeuds = true`) : les points sont sur les croisements des lignes, de 0 à cols
 *   et de 0 à rows ; `meta.points` donne les points nommés, `answer` = « x,y » du point à placer.
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { GEOMETRIE_ESPACE, type Cell, cellKey, cellsTxt } from './geometrie-espace';
import { cap, clamp01, make, mcq, parNiv, vraiFaux } from './util';

const NIVEAUX: Level[] = ['facile', 'normal', 'plus_loin'];
const auNiveau = <T extends { niv: Level }>(level: Level, pool: T[]) =>
  pool.filter((p) => NIVEAUX.indexOf(p.niv) <= NIVEAUX.indexOf(level));
const difNiv = (niv: Level) => (niv === 'facile' ? 0.25 : niv === 'normal' ? 0.5 : 0.75);

type QR = { q: string; g: string; w: string[]; e: string; niv: Level };
type VF = { s: string; v: boolean; e: string; niv: Level };

/** Vrai / faux équilibré tiré d’une banque d’affirmations. */
function vfDepuis(pool: VF[], level: Level, rng: Rng) {
  const v = rng.chance(0.5);
  return rng.pick(auNiveau(level, pool).filter((x) => x.v === v));
}

/* ------------------------------------------------------------------ */
/* Points sur un quadrillage (nœuds)                                    */
/* ------------------------------------------------------------------ */

type Pt = [number, number];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const dans = (p: Pt, cols: number, rows: number) => p[0] >= 0 && p[1] >= 0 && p[0] <= cols && p[1] <= rows;
const carreaux = (k: number) => `${Math.abs(k)} carreau${Math.abs(k) > 1 ? 'x' : ''}`;
/** « 3 carreaux vers la droite et 2 carreaux vers le haut ». */
function deplacementTxt([dx, dy]: Pt): string {
  const parts: string[] = [];
  if (dx) parts.push(`${carreaux(dx)} vers la ${dx > 0 ? 'droite' : 'gauche'}`);
  if (dy) parts.push(`${carreaux(dy)} vers le ${dy > 0 ? 'bas' : 'haut'}`);
  return parts.join(' et ');
}

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.VOCAB                                                    */
/* ------------------------------------------------------------------ */

const QCM_VOCAB: QR[] = [
  {
    q: 'Comment appelle-t-on une ligne droite limitée par deux points ?',
    g: 'un segment',
    w: ['une droite', 'une demi-droite', 'un cercle'],
    e: 'Un segment a deux bouts (ses extrémités) : on peut mesurer sa longueur.',
    niv: 'facile',
  },
  {
    q: 'Comment appelle-t-on une ligne droite qui ne s’arrête jamais, ni d’un côté ni de l’autre ?',
    g: 'une droite',
    w: ['un segment', 'une demi-droite', 'un côté'],
    e: 'Une droite est illimitée des deux côtés : on n’en trace qu’un morceau.',
    niv: 'facile',
  },
  {
    q: 'Le point qui partage un segment en deux parties de même longueur s’appelle…',
    g: 'le milieu',
    w: ['le sommet', 'l’extrémité', 'la diagonale'],
    e: 'Le milieu est à la même distance des deux extrémités du segment.',
    niv: 'facile',
  },
  {
    q: 'Dans un polygone, le point où deux côtés se rejoignent s’appelle…',
    g: 'un sommet',
    w: ['un milieu', 'une diagonale', 'un centre'],
    e: 'Les côtés d’un polygone se rejoignent en ses sommets.',
    niv: 'facile',
  },
  {
    q: 'Le segment [AB] va du point A au point B. Comment appelle-t-on les points A et B ?',
    g: 'les extrémités du segment',
    w: ['les milieux du segment', 'les centres du segment', 'les diagonales du segment'],
    e: 'Les deux bouts d’un segment sont ses extrémités.',
    niv: 'facile',
  },
  {
    q: 'Comment appelle-t-on une ligne droite qui a un point de départ mais pas de fin ?',
    g: 'une demi-droite',
    w: ['un segment', 'une droite', 'un rayon'],
    e: 'Une demi-droite commence en un point (son origine) et continue sans fin d’un seul côté.',
    niv: 'normal',
  },
  {
    q: 'Deux droites qui se coupent en formant un angle droit sont…',
    g: 'perpendiculaires',
    w: ['parallèles', 'égales', 'symétriques'],
    e: 'Perpendiculaires = elles se coupent en faisant un angle droit (on vérifie avec l’équerre).',
    niv: 'normal',
  },
  {
    q: 'Deux droites qui ne se coupent jamais, même si on les prolonge, sont…',
    g: 'parallèles',
    w: ['perpendiculaires', 'sécantes', 'symétriques'],
    e: 'Des droites parallèles gardent toujours le même écart, comme les rails d’un train.',
    niv: 'normal',
  },
  {
    q: 'Un segment qui relie le centre d’un cercle à un point du cercle s’appelle…',
    g: 'un rayon',
    w: ['un diamètre', 'une diagonale', 'un côté'],
    e: 'Le rayon va du centre jusqu’au cercle ; tous les rayons d’un cercle ont la même longueur.',
    niv: 'normal',
  },
  {
    q: 'Un segment qui relie deux points d’un cercle en passant par son centre s’appelle…',
    g: 'un diamètre',
    w: ['un rayon', 'une diagonale', 'un milieu'],
    e: 'Le diamètre traverse le cercle en passant par le centre : il mesure deux rayons.',
    niv: 'normal',
  },
  {
    q: 'Dans un quadrilatère, un segment qui relie deux sommets qui ne se suivent pas s’appelle…',
    g: 'une diagonale',
    w: ['un côté', 'un rayon', 'un diamètre'],
    e: 'Une diagonale relie deux sommets opposés ; un côté relie deux sommets qui se suivent.',
    niv: 'normal',
  },
  {
    q: 'Tous les points d’un cercle sont à la même distance d’un point. Comment s’appelle ce point ?',
    g: 'le centre',
    w: ['le milieu', 'le sommet', 'le diamètre'],
    e: 'Le cercle est formé de tous les points situés à la même distance de son centre.',
    niv: 'normal',
  },
  {
    q: 'Avec quel instrument vérifie-t-on que deux droites sont perpendiculaires ?',
    g: 'l’équerre',
    w: ['le compas', 'la règle non graduée', 'le crayon'],
    e: 'L’équerre a un angle droit : on la pose dans l’angle pour vérifier.',
    niv: 'normal',
  },
  {
    q: 'Deux droites sont toutes les deux perpendiculaires à une même troisième droite. Ces deux droites sont…',
    g: 'parallèles',
    w: ['perpendiculaires', 'confondues avec la troisième', 'forcément sécantes'],
    e: 'Si deux droites sont perpendiculaires à la même droite, elles sont parallèles entre elles.',
    niv: 'plus_loin',
  },
  {
    q: 'Une droite est perpendiculaire à l’une de deux droites parallèles. Par rapport à l’autre, elle est…',
    g: 'perpendiculaire',
    w: ['parallèle', 'ni parallèle ni perpendiculaire', 'impossible à savoir'],
    e: 'Si deux droites sont parallèles, toute perpendiculaire à l’une est perpendiculaire à l’autre.',
    niv: 'plus_loin',
  },
  {
    q: 'Comment s’appelle l’ensemble de tous les points situés à 3 cm ou moins du point O ?',
    g: 'le disque de centre O et de rayon 3 cm',
    w: ['le cercle de centre O et de rayon 3 cm', 'le segment de 3 cm', 'le carré de côté 3 cm'],
    e: 'Le cercle, ce sont les points à exactement 3 cm de O ; le disque, c’est le cercle et tout l’intérieur.',
    niv: 'plus_loin',
  },
];

const vocabQcm: ItemGen = (level, rng, ctx) => {
  const forme = rng.next();
  if (level !== 'facile' && forme < 0.25) {
    // Rayon ↔ diamètre
    const r = rng.int(2, 9);
    const versDiam = rng.chance(0.5);
    return mcq(ctx, rng, `rd-${versDiam}-${r}`, {
      question: versDiam
        ? `Un cercle a un rayon de ${r} cm. Combien mesure son diamètre ?`
        : `Un cercle a un diamètre de ${2 * r} cm. Combien mesure son rayon ?`,
      good: versDiam ? `${2 * r} cm` : `${r} cm`,
      wrong: versDiam
        ? [`${r} cm`, `${r + 2} cm`, `${4 * r} cm`]
        : [`${2 * r} cm`, `${4 * r} cm`, `${r + 1} cm`],
      explication: `Le diamètre mesure deux fois le rayon : ${r} × 2 = ${2 * r} cm.`,
      difficulty: 0.45,
    });
  }
  if (level === 'plus_loin' && forme < 0.5) {
    // Position d’un point par rapport à un cercle
    const r = rng.int(2, 6);
    const pos = rng.int(0, 2);
    const d = pos === 0 ? rng.int(0, r - 1) : pos === 1 ? r : rng.int(r + 1, r + 4);
    const reps = ['à l’intérieur du cercle', 'sur le cercle', 'à l’extérieur du cercle'];
    return mcq(ctx, rng, `pos-${r}-${d}`, {
      question: `Le cercle de centre O a un rayon de ${r} cm. Le point M est à ${d} cm du point O. Où est le point M ?`,
      good: reps[pos]!,
      wrong: reps,
      fixedOrder: reps,
      explication: `Les points du cercle sont exactement à ${r} cm de O : ${d} cm, c’est ${
        d < r ? 'moins' : d === r ? 'pile la bonne distance' : 'plus'
      }, donc M est ${reps[pos]}.`,
      difficulty: 0.6,
    });
  }
  const q = rng.pick(auNiveau(level, QCM_VOCAB));
  return mcq(ctx, rng, `def-${q.q}`, {
    question: q.q,
    good: q.g,
    wrong: q.w,
    explication: q.e,
    difficulty: difNiv(q.niv),
    max: level === 'facile' ? 3 : 4,
  });
};

/** Exemples de la vie courante : 0 perpendiculaires, 1 parallèles, 2 ni l’un ni l’autre. */
const EXEMPLES_DROITES: { label: string; cat: 0 | 1 | 2; niv: Level }[] = [
  { label: 'les deux rails d’une voie ferrée', cat: 1, niv: 'facile' },
  { label: 'deux lignes d’un cahier', cat: 1, niv: 'facile' },
  { label: 'les deux bords opposés d’une feuille', cat: 1, niv: 'facile' },
  { label: 'les cordes d’une guitare', cat: 1, niv: 'facile' },
  { label: 'deux barreaux d’une échelle', cat: 1, niv: 'facile' },
  { label: 'deux bords voisins d’une feuille', cat: 0, niv: 'facile' },
  { label: 'les deux traits du signe +', cat: 0, niv: 'facile' },
  { label: 'les aiguilles d’une horloge à 3 h', cat: 0, niv: 'facile' },
  { label: 'un montant et un barreau d’une échelle', cat: 0, niv: 'facile' },
  { label: 'les aiguilles d’une horloge à 9 h', cat: 0, niv: 'facile' },
  { label: 'les deux branches de la lettre V', cat: 2, niv: 'normal' },
  { label: 'les aiguilles d’une horloge à 1 h', cat: 2, niv: 'normal' },
  { label: 'les aiguilles d’une horloge à 2 h', cat: 2, niv: 'normal' },
  { label: 'les deux traits obliques de la lettre A', cat: 2, niv: 'normal' },
  { label: 'deux côtés opposés d’un rectangle', cat: 1, niv: 'normal' },
  { label: 'deux côtés voisins d’un carré', cat: 0, niv: 'normal' },
  { label: 'deux côtés voisins d’un losange qui n’est pas un carré', cat: 2, niv: 'plus_loin' },
  { label: 'deux droites perpendiculaires à une même droite', cat: 1, niv: 'plus_loin' },
  { label: 'deux droites parallèles à une même droite', cat: 1, niv: 'plus_loin' },
  { label: 'une droite parallèle à (d) et une droite perpendiculaire à (d)', cat: 0, niv: 'plus_loin' },
  { label: 'les deux diagonales d’un carré', cat: 0, niv: 'plus_loin' },
  { label: 'les deux diagonales d’un rectangle qui n’est pas un carré', cat: 2, niv: 'plus_loin' },
];
const CAT_DROITES = ['perpendiculaires', 'parallèles', 'ni l’un ni l’autre'];

/** Dessin schématique (deux segments sur un quadrillage de nœuds) pour chaque catégorie. */
function dessinDroites(cat: 0 | 1 | 2, rng: Rng) {
  const dir = rng.pick([
    [4, 0],
    [0, 4],
    [4, 2],
    [3, 3],
    [2, 4],
  ] as Pt[]);
  const o: Pt = [6, 6];
  const d1: [Pt, Pt] = [sub(o, dir), add(o, dir)];
  if (cat === 1) {
    const dec: Pt = dir[1] === 0 ? [0, 2] : [2, 0];
    return { d1, d2: [add(d1[0], dec), add(d1[1], dec)] };
  }
  const autre: Pt =
    cat === 0 ? [-dir[1], dir[0]] : dir[0] === 0 || dir[1] === 0 ? [3, 2] : [dir[0], -dir[1] - 1];
  return { d1, d2: [sub(o, autre), add(o, autre)] };
}

const vocabClasser: ItemGen = (level, rng, ctx) => {
  const nbCats = level === 'facile' ? 2 : 3;
  const parCat = 2;
  const pool = auNiveau(level, EXEMPLES_DROITES);
  const choisis = [0, 1, 2]
    .slice(0, nbCats)
    .flatMap((c) =>
      rng
        .shuffle(pool.filter((e) => e.cat === c && (level !== 'plus_loin' || rng.chance(0.8))))
        .slice(0, parCat),
    );
  const els = rng.shuffle(choisis).map((e) => ({ label: e.label, category: e.cat }));
  return make(ctx, 'classification', `droites-${els.map((e) => e.label).join('|')}`, {
    prompt: 'Range ces paires de lignes : sont-elles perpendiculaires ou parallèles ?',
    categories: CAT_DROITES.slice(0, nbCats),
    elements: els,
    explication:
      'Perpendiculaires : elles se coupent en faisant un angle droit. Parallèles : elles ne se coupent jamais et gardent le même écart.',
    difficulty: nbCats === 2 ? 0.3 : level === 'normal' ? 0.5 : 0.75,
    meta: {
      dessins: Object.fromEntries(els.map((e) => [e.label, dessinDroites(e.category as 0 | 1 | 2, rng)])),
      repere: 'noeuds',
    },
  });
};

const VF_VOCAB: VF[] = [
  {
    s: 'Un segment a deux extrémités.',
    v: true,
    e: 'Un segment est limité par deux points : ses extrémités.',
    niv: 'facile',
  },
  {
    s: 'On peut mesurer la longueur d’une droite.',
    v: false,
    e: 'Une droite ne s’arrête jamais : on ne peut mesurer que la longueur d’un segment.',
    niv: 'facile',
  },
  {
    s: 'Le milieu d’un segment est à la même distance de ses deux extrémités.',
    v: true,
    e: 'Le milieu partage le segment en deux longueurs égales.',
    niv: 'facile',
  },
  { s: 'Un triangle a 4 sommets.', v: false, e: 'Un triangle a 3 côtés et 3 sommets.', niv: 'facile' },
  {
    s: 'Deux droites perpendiculaires se coupent en formant un angle droit.',
    v: true,
    e: 'C’est la définition : elles forment un angle droit.',
    niv: 'normal',
  },
  {
    s: 'Deux droites parallèles finissent toujours par se couper si on les prolonge assez.',
    v: false,
    e: 'Des droites parallèles ne se coupent jamais, même prolongées.',
    niv: 'normal',
  },
  {
    s: 'Le diamètre d’un cercle mesure deux fois son rayon.',
    v: true,
    e: 'Le diamètre passe par le centre : il est fait de deux rayons.',
    niv: 'normal',
  },
  {
    s: 'Tous les rayons d’un même cercle ont la même longueur.',
    v: true,
    e: 'Chaque point du cercle est à la même distance du centre.',
    niv: 'normal',
  },
  {
    s: 'Une diagonale d’un quadrilatère relie deux sommets qui se suivent.',
    v: false,
    e: 'Une diagonale relie deux sommets qui ne se suivent pas ; sinon, c’est un côté.',
    niv: 'normal',
  },
  {
    s: 'Une demi-droite a deux extrémités.',
    v: false,
    e: 'Une demi-droite a un point de départ (son origine) et continue sans fin de l’autre côté.',
    niv: 'normal',
  },
  {
    s: 'Deux droites perpendiculaires à une même droite sont parallèles entre elles.',
    v: true,
    e: 'Elles font toutes les deux un angle droit avec la même droite : elles ne se coupent jamais.',
    niv: 'plus_loin',
  },
  {
    s: 'Deux droites parallèles à une même droite sont perpendiculaires entre elles.',
    v: false,
    e: 'Deux droites parallèles à une même droite sont parallèles entre elles.',
    niv: 'plus_loin',
  },
  {
    s: 'Un point situé à 5 cm du centre d’un cercle de rayon 5 cm est sur le cercle.',
    v: true,
    e: 'Le cercle est formé de tous les points à exactement 5 cm du centre.',
    niv: 'plus_loin',
  },
  {
    s: 'Un point situé à 2 cm du centre d’un cercle de rayon 3 cm est à l’extérieur du cercle.',
    v: false,
    e: '2 cm, c’est moins que le rayon : le point est à l’intérieur.',
    niv: 'plus_loin',
  },
];

const vocabVraiFaux: ItemGen = (level, rng, ctx) => {
  const q = vfDepuis(VF_VOCAB, level, rng);
  return vraiFaux(ctx, `vf-${q.s}`, {
    statement: q.s,
    answer: q.v,
    explication: q.e,
    difficulty: difNiv(q.niv),
  });
};

/** Placer un point sur un quadrillage : milieu, parallèle, perpendiculaire. */
const vocabShape: ItemGen = (level, rng, ctx) => {
  const cols = 12;
  const rows = 8;
  const tache = parNiv(level, {
    facile: 'milieu_droit' as const,
    normal: rng.pick(['milieu_oblique', 'parallele'] as const),
    plus_loin: rng.pick(['perpendiculaire', 'centre'] as const),
  });
  for (let essai = 0; essai < 200; essai++) {
    const A: Pt = [rng.int(0, cols), rng.int(0, rows)];
    let v: Pt;
    if (tache === 'milieu_droit') {
      const k = 2 * rng.int(1, 5);
      v = rng.pick([
        [k, 0],
        [0, k],
      ] as Pt[]);
    } else
      v = [2 * rng.int(1, 4) * (rng.chance(0.5) ? 1 : -1), 2 * rng.int(1, 3) * (rng.chance(0.5) ? 1 : -1)];
    if (tache === 'parallele' || tache === 'perpendiculaire') v = [Math.abs(v[0]) / 2 + 1, v[1] / 2];
    const B = add(A, v);
    if (!dans(B, cols, rows)) continue;
    if (tache === 'milieu_droit' || tache === 'milieu_oblique' || tache === 'centre') {
      const M: Pt = [A[0] + v[0] / 2, A[1] + v[1] / 2];
      const centre = tache === 'centre';
      return make(ctx, 'geometry_shape', `${tache}-${cellKey(A)}-${cellKey(B)}`, {
        prompt: centre
          ? 'Le segment [AB] est un diamètre d’un cercle. Place le centre O de ce cercle.'
          : 'Place le point M, milieu du segment [AB].',
        task: 'tracer',
        shape: 'points',
        answer: cellKey(M),
        grid: { cols, rows, cells: [] },
        explication: `${centre ? 'Le centre d’un cercle est le milieu de chacun de ses diamètres. ' : ''}De A à B, on se déplace de ${deplacementTxt(v)} ; le milieu est à mi-chemin : ${deplacementTxt([v[0] / 2, v[1] / 2])} à partir de A.`,
        difficulty: tache === 'milieu_droit' ? 0.25 : tache === 'milieu_oblique' ? 0.5 : 0.7,
        meta: { noeuds: true, points: { A, B }, segments: [['A', 'B']], solution: M },
      });
    }
    const C: Pt = [rng.int(0, cols), rng.int(0, rows)];
    if (tache === 'parallele') {
      const D = add(C, v);
      if (!dans(D, cols, rows) || cellKey(C) === cellKey(A) || cellKey(C) === cellKey(B)) continue;
      // C ne doit pas être sur la droite (AB)
      const w = sub(C, A);
      if (w[0] * v[1] - w[1] * v[0] === 0) continue;
      return make(ctx, 'geometry_shape', `parallele-${cellKey(A)}-${cellKey(B)}-${cellKey(C)}`, {
        prompt:
          'Place le point D, à droite du point C, pour que le segment [CD] soit parallèle au segment [AB] et de même longueur.',
        task: 'tracer',
        shape: 'points',
        answer: cellKey(D),
        grid: { cols, rows, cells: [] },
        explication: `De A à B, on se déplace de ${deplacementTxt(v)} ; on fait le même déplacement à partir de C pour obtenir D : [CD] est parallèle à [AB].`,
        difficulty: 0.55,
        meta: { noeuds: true, points: { A, B, C }, segments: [['A', 'B']], solution: D },
      });
    }
    // Perpendiculaire : on tourne le déplacement d’un quart de tour.
    const r1: Pt = [-v[1], v[0]];
    const r2: Pt = [v[1], -v[0]];
    const haut = r1[1] < 0 ? r1 : r2[1] < 0 ? r2 : r1[0] > 0 ? r1 : r2;
    const ou = haut[1] < 0 ? 'au-dessus' : 'à droite';
    const E = add(A, haut);
    if (!dans(E, cols, rows)) continue;
    return make(ctx, 'geometry_shape', `perp-${cellKey(A)}-${cellKey(B)}`, {
      prompt: `Place le point E, ${ou} de la droite (AB), pour que le segment [AE] soit perpendiculaire au segment [AB] et de même longueur.`,
      task: 'tracer',
      shape: 'points',
      answer: cellKey(E),
      grid: { cols, rows, cells: [] },
      explication: `De A à B, on fait ${deplacementTxt(v)}. Pour tourner d’un angle droit, on échange les deux nombres de carreaux : de A à E, ${deplacementTxt(haut)}. On vérifie l’angle droit avec l’équerre.`,
      difficulty: 0.8,
      meta: { noeuds: true, points: { A, B }, segments: [['A', 'B']], solution: E },
    });
  }
  const A: Pt = [2, 4];
  const B: Pt = [8, 4];
  return make(ctx, 'geometry_shape', 'milieu-secours', {
    prompt: 'Place le point M, milieu du segment [AB].',
    task: 'tracer',
    shape: 'points',
    answer: '5,4',
    grid: { cols, rows, cells: [] },
    explication: 'De A à B, il y a 6 carreaux ; le milieu est à 3 carreaux de A.',
    difficulty: 0.25,
    meta: { noeuds: true, points: { A, B }, segments: [['A', 'B']], solution: [5, 4] },
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.FIGURES                                                  */
/* ------------------------------------------------------------------ */

type Figure = {
  id: string;
  nom: string;
  /** « un carré », « une figure… ». */
  un: string;
  niv: Level;
  famille: 'triangle' | 'quadrilatère' | 'autre';
  cotes: number;
  anglesDroits: number;
  pairesParalleles: number;
  /** Description des côtés de même longueur. */
  longueurs: string;
  /** Sommets d’un dessin type (nœuds d’un quadrillage, valeurs approchées pour l’équilatéral et les polygones réguliers). */
  points: Pt[];
  /** Indices pour « Qui suis-je ? », du moins au plus révélateur. */
  indices: string[];
};

const FIGURES: Figure[] = [
  {
    id: 'carre',
    nom: 'carré',
    un: 'un carré',
    niv: 'facile',
    famille: 'quadrilatère',
    cotes: 4,
    anglesDroits: 4,
    pairesParalleles: 2,
    longueurs: '4 côtés de même longueur',
    points: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
    indices: [
      'Je suis un quadrilatère.',
      'Mes côtés opposés sont parallèles.',
      'J’ai 4 angles droits.',
      'Mes 4 côtés ont la même longueur.',
    ],
  },
  {
    id: 'rectangle',
    nom: 'rectangle',
    un: 'un rectangle',
    niv: 'facile',
    famille: 'quadrilatère',
    cotes: 4,
    anglesDroits: 4,
    pairesParalleles: 2,
    longueurs: 'les côtés opposés de même longueur',
    points: [
      [0, 0],
      [6, 0],
      [6, 3],
      [0, 3],
    ],
    indices: [
      'Je suis un quadrilatère.',
      'Mes côtés opposés sont parallèles et de même longueur.',
      'J’ai 4 angles droits.',
      'Mes 4 côtés n’ont pas tous la même longueur.',
    ],
  },
  {
    id: 'triangle',
    nom: 'triangle',
    un: 'un triangle',
    niv: 'facile',
    famille: 'triangle',
    cotes: 3,
    anglesDroits: 0,
    pairesParalleles: 0,
    longueurs: 'aucun côté de même longueur (triangle quelconque)',
    points: [
      [0, 4],
      [6, 4],
      [2, 0],
    ],
    indices: [
      'Je suis un polygone.',
      'Je n’ai aucun angle droit et mes côtés ont des longueurs différentes.',
      'J’ai 3 sommets.',
      'J’ai 3 côtés.',
    ],
  },
  {
    id: 'triangle_rectangle',
    nom: 'triangle rectangle',
    un: 'un triangle rectangle',
    niv: 'facile',
    famille: 'triangle',
    cotes: 3,
    anglesDroits: 1,
    pairesParalleles: 0,
    longueurs: 'pas forcément de côtés de même longueur',
    points: [
      [0, 0],
      [0, 4],
      [5, 4],
    ],
    indices: [
      'Je suis un polygone.',
      'J’ai 3 côtés.',
      'Deux de mes côtés sont perpendiculaires.',
      'J’ai un angle droit.',
    ],
  },
  {
    id: 'losange',
    nom: 'losange',
    un: 'un losange',
    niv: 'facile',
    famille: 'quadrilatère',
    cotes: 4,
    anglesDroits: 0,
    pairesParalleles: 2,
    longueurs: '4 côtés de même longueur',
    points: [
      [3, 0],
      [6, 2],
      [3, 4],
      [0, 2],
    ],
    indices: [
      'Je suis un quadrilatère.',
      'Mes côtés opposés sont parallèles.',
      'Je n’ai pas d’angle droit.',
      'Mes 4 côtés ont la même longueur.',
    ],
  },
  {
    id: 'pentagone',
    nom: 'pentagone',
    un: 'un pentagone',
    niv: 'facile',
    famille: 'autre',
    cotes: 5,
    anglesDroits: 0,
    pairesParalleles: 0,
    longueurs: '5 côtés',
    points: [
      [3, 0],
      [5.9, 2.1],
      [4.8, 5.4],
      [1.2, 5.4],
      [0.1, 2.1],
    ],
    indices: ['Je suis un polygone.', 'J’ai plus de côtés qu’un carré.', 'J’ai 5 sommets.', 'J’ai 5 côtés.'],
  },
  {
    id: 'hexagone',
    nom: 'hexagone',
    un: 'un hexagone',
    niv: 'facile',
    famille: 'autre',
    cotes: 6,
    anglesDroits: 0,
    pairesParalleles: 3,
    longueurs: '6 côtés',
    points: [
      [1.5, 0],
      [4.5, 0],
      [6, 2.6],
      [4.5, 5.2],
      [1.5, 5.2],
      [0, 2.6],
    ],
    indices: [
      'Je suis un polygone.',
      'Les alvéoles des abeilles ont ma forme.',
      'J’ai 6 sommets.',
      'J’ai 6 côtés.',
    ],
  },
  {
    id: 'cercle',
    nom: 'cercle',
    un: 'un cercle',
    niv: 'facile',
    famille: 'autre',
    cotes: 0,
    anglesDroits: 0,
    pairesParalleles: 0,
    longueurs: 'aucun côté',
    points: [],
    indices: [
      'Je ne suis pas un polygone.',
      'J’ai un rayon et un diamètre.',
      'Je n’ai ni côté ni sommet.',
      'Tous mes points sont à la même distance de mon centre.',
    ],
  },
  {
    id: 'triangle_isocele',
    nom: 'triangle isocèle',
    un: 'un triangle isocèle',
    niv: 'normal',
    famille: 'triangle',
    cotes: 3,
    anglesDroits: 0,
    pairesParalleles: 0,
    longueurs: '2 côtés de même longueur',
    points: [
      [0, 4],
      [6, 4],
      [3, 0],
    ],
    indices: [
      'Je suis un polygone.',
      'J’ai 3 côtés.',
      'J’ai un axe de symétrie.',
      'Seulement deux de mes côtés ont la même longueur.',
    ],
  },
  {
    id: 'triangle_equilateral',
    nom: 'triangle équilatéral',
    un: 'un triangle équilatéral',
    niv: 'normal',
    famille: 'triangle',
    cotes: 3,
    anglesDroits: 0,
    pairesParalleles: 0,
    longueurs: '3 côtés de même longueur',
    points: [
      [0, 5.2],
      [6, 5.2],
      [3, 0],
    ],
    indices: [
      'Je suis un polygone.',
      'J’ai 3 axes de symétrie.',
      'J’ai 3 côtés.',
      'Mes 3 côtés ont la même longueur.',
    ],
  },
  {
    id: 'trapeze',
    nom: 'trapèze',
    un: 'un trapèze',
    niv: 'normal',
    famille: 'quadrilatère',
    cotes: 4,
    anglesDroits: 0,
    pairesParalleles: 1,
    longueurs: 'pas forcément de côtés de même longueur',
    points: [
      [1, 0],
      [5, 0],
      [7, 3],
      [0, 3],
    ],
    indices: [
      'Je suis un quadrilatère.',
      'Je n’ai pas d’angle droit.',
      'Mes deux autres côtés ne sont pas parallèles.',
      'J’ai deux côtés opposés parallèles.',
    ],
  },
  {
    id: 'trapeze_rectangle',
    nom: 'trapèze rectangle',
    un: 'un trapèze rectangle',
    niv: 'normal',
    famille: 'quadrilatère',
    cotes: 4,
    anglesDroits: 2,
    pairesParalleles: 1,
    longueurs: 'pas forcément de côtés de même longueur',
    points: [
      [0, 0],
      [4, 0],
      [6, 3],
      [0, 3],
    ],
    indices: [
      'Je suis un quadrilatère.',
      'J’ai seulement deux côtés parallèles.',
      'Un de mes côtés est perpendiculaire aux deux côtés parallèles.',
      'J’ai exactement 2 angles droits.',
    ],
  },
];
/** Figures qui conviennent aussi (cas particuliers, figure plus générale) : jamais proposées comme mauvais choix. */
const PROCHES: Record<string, string[]> = {
  carre: ['rectangle', 'losange'],
  rectangle: ['carre', 'trapeze'],
  losange: ['carre'],
  triangle_rectangle: ['triangle_isocele', 'triangle'],
  triangle_isocele: ['triangle_equilateral', 'triangle'],
  triangle_equilateral: ['triangle_isocele', 'triangle'],
  trapeze: ['trapeze_rectangle'],
  trapeze_rectangle: ['trapeze'],
  triangle: [],
};

const FIG = Object.fromEntries(FIGURES.map((f) => [f.id, f])) as Record<string, Figure>;
const metaFigure = (f: Figure) => ({
  figure: {
    cotes: f.cotes,
    anglesDroits: f.anglesDroits,
    pairesParalleles: f.pairesParalleles,
    longueurs: f.longueurs,
    points: f.id === 'cercle' ? undefined : f.points,
    cercle: f.id === 'cercle' ? { centre: [3, 3], rayon: 3 } : undefined,
  },
});
const definition = (f: Figure) =>
  ({
    carre: 'un quadrilatère qui a 4 angles droits et 4 côtés de même longueur',
    rectangle: 'un quadrilatère qui a 4 angles droits',
    triangle: 'un polygone qui a 3 côtés',
    triangle_rectangle: 'un triangle qui a un angle droit',
    losange: 'un quadrilatère qui a 4 côtés de même longueur',
    pentagone: 'un polygone qui a 5 côtés',
    hexagone: 'un polygone qui a 6 côtés',
    cercle: 'l’ensemble des points situés à la même distance d’un point, son centre',
    triangle_isocele: 'un triangle qui a 2 côtés de même longueur',
    triangle_equilateral: 'un triangle qui a 3 côtés de même longueur',
    trapeze: 'un quadrilatère qui a deux côtés opposés parallèles',
    trapeze_rectangle: 'un trapèze qui a un angle droit (et donc deux)',
  })[f.id]!;

const figuresShape: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, {
    facile: 'nommer' as const,
    normal: rng.pick(['nommer', 'proprietes', 'proprietes'] as const),
    plus_loin: rng.pick(['proprietes', 'inclusion', 'inclusion'] as const),
  });
  if (forme === 'nommer') {
    const figs = auNiveau(level, FIGURES);
    const f = rng.pick(figs);
    return make(ctx, 'geometry_shape', `nommer-${f.id}`, {
      prompt: 'Comment s’appelle cette figure ?',
      task: 'nommer',
      shape: f.id,
      choices: rng.shuffle([
        f.nom,
        ...rng
          .shuffle(
            figs.filter((x) => x.id !== f.id && x.famille === f.famille && !PROCHES[f.id]?.includes(x.id)),
          )
          .map((x) => x.nom)
          .slice(0, 2),
        ...rng.shuffle(figs.filter((x) => x.famille !== f.famille).map((x) => x.nom)).slice(0, 1),
      ]),
      answer: f.nom,
      explication: `C’est ${f.un} : c’est ${definition(f)}.`,
      difficulty: f.niv === 'facile' ? 0.2 : 0.45,
      meta: metaFigure(f),
    });
  }
  if (forme === 'proprietes') {
    const f = rng.pick(auNiveau(level, FIGURES).filter((x) => x.cotes >= 3 && x.cotes <= 4));
    const quoi = rng.pick(['anglesDroits', 'pairesParalleles', 'cotes'] as const);
    const n = f[quoi];
    const txt = {
      anglesDroits: 'angles droits',
      pairesParalleles: 'paires de côtés parallèles',
      cotes: 'côtés',
    }[quoi];
    const choix =
      quoi === 'pairesParalleles'
        ? ['0', '1', '2']
        : quoi === 'cotes'
          ? ['3', '4', '5', '6']
          : ['0', '1', '2', '4'];
    return make(ctx, 'geometry_shape', `prop-${f.id}-${quoi}`, {
      prompt: `Combien ${quoi === 'anglesDroits' ? 'd’' : 'de '}${txt} ce ${f.nom} a-t-il ?`,
      task: 'proprietes',
      shape: f.id,
      choices: choix,
      answer: String(n),
      explication: `${cap(f.un)}, c’est ${definition(f)} : il a ${f.cotes} côtés, ${f.anglesDroits} angle${f.anglesDroits > 1 ? 's' : ''} droit${f.anglesDroits > 1 ? 's' : ''} et ${f.pairesParalleles} paire${f.pairesParalleles > 1 ? 's' : ''} de côtés parallèles.`,
      difficulty: 0.45 + (quoi === 'pairesParalleles' ? 0.15 : 0),
      meta: metaFigure(f),
    });
  }
  // Classification inclusive : « Ce carré est aussi… »
  const cas = rng.pick([
    {
      f: 'carre',
      good: 'un rectangle',
      e: 'Un carré a 4 angles droits : c’est donc aussi un rectangle (un rectangle particulier).',
    },
    {
      f: 'carre',
      good: 'un losange',
      e: 'Un carré a 4 côtés de même longueur : c’est donc aussi un losange.',
    },
    {
      f: 'triangle_equilateral',
      good: 'un triangle isocèle',
      e: 'Un triangle équilatéral a 3 côtés égaux, donc au moins 2 : il est aussi isocèle.',
    },
  ]);
  const f = FIG[cas.f]!;
  return make(ctx, 'geometry_shape', `inclusion-${cas.f}-${cas.good}`, {
    prompt: `Ce ${f.nom} est aussi…`,
    task: 'proprietes',
    shape: f.id,
    choices: rng.shuffle([
      cas.good,
      'un pentagone',
      'un hexagone',
      cas.f === 'triangle_equilateral' ? 'un triangle rectangle' : 'un triangle',
    ]),
    answer: cas.good,
    explication: cas.e,
    difficulty: 0.75,
    meta: metaFigure(f),
  });
};

/** Propriétés vraies / fausses pour une figure (normal). */
const PROPRIETES: Record<string, { pluriel: string; vraies: string[]; fausses: string[] }> = {
  carre: {
    pluriel: 'carrés',
    vraies: ['4 angles droits', '4 côtés de même longueur', 'côtés opposés parallèles'],
    fausses: ['3 côtés', 'un seul angle droit', 'aucun côté parallèle'],
  },
  rectangle: {
    pluriel: 'rectangles',
    vraies: ['4 angles droits', 'côtés opposés de même longueur', 'côtés opposés parallèles'],
    fausses: ['4 côtés toujours de même longueur', 'aucun angle droit', '5 sommets'],
  },
  losange: {
    pluriel: 'losanges',
    vraies: ['4 côtés de même longueur', 'côtés opposés parallèles', '4 sommets'],
    fausses: ['toujours 4 angles droits', '3 côtés', 'aucun côté parallèle'],
  },
  triangle_rectangle: {
    pluriel: 'triangles rectangles',
    vraies: ['un angle droit', '3 côtés', '2 côtés perpendiculaires'],
    fausses: ['2 angles droits', '4 sommets', '2 côtés parallèles'],
  },
  triangle_isocele: {
    pluriel: 'triangles isocèles',
    vraies: ['2 côtés de même longueur', '3 sommets', 'un axe de symétrie'],
    fausses: ['4 côtés', '2 côtés parallèles', 'toujours un angle droit'],
  },
  triangle_equilateral: {
    pluriel: 'triangles équilatéraux',
    vraies: ['3 côtés de même longueur', '3 sommets', '3 axes de symétrie'],
    fausses: ['un angle droit', '4 côtés', '2 côtés parallèles'],
  },
  trapeze_rectangle: {
    pluriel: 'trapèzes rectangles',
    vraies: ['2 côtés opposés parallèles', '2 angles droits', '4 sommets'],
    fausses: ['4 angles droits', '4 côtés toujours de même longueur', '3 côtés'],
  },
};

const figuresClasser: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const els = [
      ...rng.shuffle(FIGURES.filter((f) => f.famille === 'triangle' && f.niv === 'facile')).slice(0, 2),
      ...rng.shuffle(FIGURES.filter((f) => f.famille === 'quadrilatère' && f.niv === 'facile')).slice(0, 2),
      ...rng.shuffle(FIGURES.filter((f) => f.famille === 'autre')).slice(0, 2),
    ].map((f) => ({ label: f.nom, category: ['triangle', 'quadrilatère', 'autre'].indexOf(f.famille) }));
    return make(ctx, 'classification', `familles-${els.map((e) => e.label).join('|')}`, {
      prompt: 'Range ces figures : triangles, quadrilatères ou autres figures ?',
      categories: ['triangles (3 côtés)', 'quadrilatères (4 côtés)', 'autres figures'],
      elements: rng.shuffle(els),
      explication:
        'On compte les côtés : 3 côtés = triangle, 4 côtés = quadrilatère ; le pentagone (5), l’hexagone (6) et le cercle sont d’autres figures.',
      difficulty: 0.25,
    });
  }
  if (level === 'normal') {
    const id = rng.pick(Object.keys(PROPRIETES));
    const f = FIG[id]!;
    const p = PROPRIETES[id]!;
    const els = rng.shuffle([
      ...rng
        .shuffle(p.vraies)
        .slice(0, 2)
        .map((label) => ({ label, category: 0 })),
      ...rng
        .shuffle(p.fausses)
        .slice(0, 2)
        .map((label) => ({ label, category: 1 })),
    ]);
    return make(ctx, 'classification', `props-${id}-${els.map((e) => e.label).join('|')}`, {
      prompt: `Range ces propriétés : sont-elles vraies pour tous les ${p.pluriel} ?`,
      categories: ['toujours vrai', 'faux ou pas toujours vrai'],
      elements: els,
      explication: `${cap(f.un)}, c’est ${definition(f)}.`,
      difficulty: 0.5,
      meta: metaFigure(f),
    });
  }
  // Plus loin : classification inclusive
  const cible = rng.pick([
    {
      nom: 'rectangle',
      oui: ['un carré', 'un quadrilatère qui a 4 angles droits'],
      non: [
        'un losange qui n’a pas d’angle droit',
        'un trapèze rectangle',
        'un triangle rectangle',
        'un quadrilatère qui a un seul angle droit',
      ],
      e: 'Un rectangle, c’est un quadrilatère qui a 4 angles droits : le carré en fait partie.',
    },
    {
      nom: 'losange',
      oui: ['un carré', 'un quadrilatère qui a 4 côtés de même longueur'],
      non: [
        'un rectangle qui n’est pas un carré',
        'un triangle équilatéral',
        'un trapèze rectangle',
        'un hexagone',
      ],
      e: 'Un losange, c’est un quadrilatère qui a 4 côtés de même longueur : le carré en fait partie.',
    },
    {
      nom: 'triangle isocèle',
      oui: ['un triangle équilatéral', 'un triangle qui a 2 côtés de même longueur'],
      non: ['un triangle dont les 3 côtés ont des longueurs différentes', 'un losange', 'un carré'],
      e: 'Un triangle isocèle a (au moins) 2 côtés de même longueur : le triangle équilatéral en fait partie.',
    },
  ]);
  const els = rng.shuffle([
    ...cible.oui.map((label) => ({ label, category: 0 })),
    ...rng
      .shuffle(cible.non)
      .slice(0, 3)
      .map((label) => ({ label, category: 1 })),
  ]);
  return make(ctx, 'classification', `inclusion-${cible.nom}-${els.map((e) => e.label).join('|')}`, {
    prompt: `Range ces figures : est-ce toujours un ${cible.nom} ?`,
    categories: [`toujours un ${cible.nom}`, `pas toujours un ${cible.nom}`],
    elements: els,
    explication: cible.e,
    difficulty: 0.8,
  });
};

const figuresQcm: ItemGen = (level, rng, ctx) => {
  const figs = auNiveau(level, FIGURES);
  const f = rng.pick(figs);
  const nbIndices = parNiv(level, { facile: 4, normal: 4, plus_loin: 3 });
  const indices = f.indices.slice(f.indices.length - nbIndices);
  const exclus = new Set([f.id, ...(PROCHES[f.id] ?? [])]);
  return mcq(ctx, rng, `quisuisje-${f.id}-${nbIndices}`, {
    question: `Qui suis-je ? ${indices.join(' ')}`,
    good: f.nom,
    wrong: figs.filter((x) => !exclus.has(x.id)).map((x) => x.nom),
    explication: `C’est ${f.un} : c’est ${definition(f)}.`,
    difficulty: difNiv(f.niv) + (level === 'plus_loin' ? 0.1 : 0),
    hints: indices,
    max: level === 'facile' ? 3 : 4,
  });
};

const VF_FIGURES: VF[] = [
  {
    s: 'Un carré a 4 angles droits.',
    v: true,
    e: 'Un carré a 4 angles droits et 4 côtés de même longueur.',
    niv: 'facile',
  },
  {
    s: 'Un triangle a 4 côtés.',
    v: false,
    e: 'Un triangle a 3 côtés ; c’est le quadrilatère qui en a 4.',
    niv: 'facile',
  },
  { s: 'Un hexagone a 6 côtés.', v: true, e: 'Hexagone = 6 côtés ; pentagone = 5 côtés.', niv: 'facile' },
  { s: 'Un pentagone a 6 côtés.', v: false, e: 'Un pentagone a 5 côtés.', niv: 'facile' },
  {
    s: 'Un losange a 4 côtés de même longueur.',
    v: true,
    e: 'C’est ce qui définit le losange.',
    niv: 'facile',
  },
  {
    s: 'Un rectangle a toujours 4 côtés de même longueur.',
    v: false,
    e: 'Un rectangle a ses côtés opposés de même longueur ; s’ils sont tous égaux, c’est un carré.',
    niv: 'facile',
  },
  {
    s: 'Un triangle rectangle a un angle droit.',
    v: true,
    e: 'Triangle rectangle = triangle avec un angle droit.',
    niv: 'facile',
  },
  {
    s: 'Un triangle équilatéral a ses 3 côtés de même longueur.',
    v: true,
    e: '« Équilatéral » veut dire « côtés égaux ».',
    niv: 'normal',
  },
  {
    s: 'Un triangle isocèle a 2 côtés de même longueur.',
    v: true,
    e: 'Un triangle isocèle a deux côtés égaux.',
    niv: 'normal',
  },
  {
    s: 'Un trapèze a toujours 4 angles droits.',
    v: false,
    e: 'Un trapèze a deux côtés opposés parallèles, mais pas forcément d’angle droit.',
    niv: 'normal',
  },
  {
    s: 'Les côtés opposés d’un rectangle sont parallèles.',
    v: true,
    e: 'Dans un rectangle, les côtés opposés sont parallèles et de même longueur.',
    niv: 'normal',
  },
  {
    s: 'Un losange a toujours 4 angles droits.',
    v: false,
    e: 'Un losange a 4 côtés égaux, mais ses angles ne sont droits que si c’est un carré.',
    niv: 'normal',
  },
  {
    s: 'Un trapèze rectangle a 2 angles droits.',
    v: true,
    e: 'Son côté perpendiculaire aux deux côtés parallèles forme 2 angles droits.',
    niv: 'normal',
  },
  {
    s: 'Tous les points d’un cercle sont à la même distance de son centre.',
    v: true,
    e: 'C’est la définition du cercle.',
    niv: 'normal',
  },
  {
    s: 'Un carré est aussi un rectangle.',
    v: true,
    e: 'Le carré a 4 angles droits : c’est un rectangle particulier.',
    niv: 'plus_loin',
  },
  {
    s: 'Un carré est aussi un losange.',
    v: true,
    e: 'Le carré a 4 côtés égaux : c’est un losange particulier.',
    niv: 'plus_loin',
  },
  {
    s: 'Un rectangle est toujours un carré.',
    v: false,
    e: 'Un rectangle n’est un carré que si ses 4 côtés sont égaux.',
    niv: 'plus_loin',
  },
  {
    s: 'Un triangle équilatéral est aussi isocèle.',
    v: true,
    e: 'Il a 3 côtés égaux, donc au moins 2 : il est isocèle.',
    niv: 'plus_loin',
  },
  {
    s: 'Un triangle isocèle est toujours équilatéral.',
    v: false,
    e: 'Un triangle isocèle peut n’avoir que 2 côtés égaux.',
    niv: 'plus_loin',
  },
  {
    s: 'Un losange est toujours un carré.',
    v: false,
    e: 'Un losange n’est un carré que s’il a des angles droits.',
    niv: 'plus_loin',
  },
];

const figuresVraiFaux: ItemGen = (level, rng, ctx) => {
  const q = vfDepuis(VF_FIGURES, level, rng);
  return vraiFaux(ctx, `vf-${q.s}`, {
    statement: q.s,
    answer: q.v,
    explication: q.e,
    difficulty: difNiv(q.niv),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.CONSTRUIRE                                               */
/* ------------------------------------------------------------------ */

type Prog = { figure: string; etapes: string[] };

function programmes(level: Level, rng: Rng): Prog[] {
  const a = rng.int(4, 9);
  const b = rng.int(2, a - 1);
  const r = rng.int(2, 6);
  const m = rng.int(2, 6);
  const pair = 2 * rng.int(2, 4);
  const iso0 = rng.int(Math.ceil(a / 2) + 1, a + 2);
  const iso = iso0 === a ? a + 1 : iso0;
  const p: Record<Level, Prog[]> = {
    facile: [
      {
        figure: `un cercle de rayon ${r} cm`,
        etapes: [
          `Écarte le compas de ${r} cm sur la règle graduée.`,
          'Pique la pointe du compas sur le point O.',
          'Tourne le compas pour tracer le cercle.',
        ],
      },
      {
        figure: `le milieu d’un segment de ${2 * m} cm`,
        etapes: [
          `Trace le segment [AB] de ${2 * m} cm.`,
          `À partir de A, mesure ${m} cm sur le segment.`,
          'Marque le point M : c’est le milieu du segment [AB].',
        ],
      },
      {
        figure: 'un triangle rectangle',
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          `Avec l’équerre, trace en A le segment [AC] de ${b} cm, perpendiculaire au segment [AB].`,
          'Trace le segment [BC] pour fermer le triangle.',
        ],
      },
    ],
    normal: [
      {
        figure: `un carré de ${a} cm de côté`,
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          'Avec l’équerre, trace en A et en B deux droites perpendiculaires au segment [AB].',
          `Place C et D sur ces droites, du même côté, à ${a} cm de B et de A.`,
          'Trace le segment [CD].',
        ],
      },
      {
        figure: `un rectangle de ${a} cm sur ${b} cm`,
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          'Avec l’équerre, trace en A et en B deux droites perpendiculaires au segment [AB].',
          `Place C et D sur ces droites, du même côté, à ${b} cm de B et de A.`,
          'Trace le segment [CD].',
        ],
      },
      {
        figure: `un cercle de ${pair} cm de diamètre`,
        etapes: [
          `Trace le segment [AB] de ${pair} cm.`,
          'Place le point O, milieu du segment [AB].',
          `Écarte le compas de ${pair / 2} cm.`,
          'Pique la pointe du compas sur O et trace le cercle.',
        ],
      },
      {
        figure: 'un triangle rectangle',
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          'Avec l’équerre, trace la droite perpendiculaire au segment [AB] qui passe par A.',
          `Place le point C sur cette droite, à ${b} cm de A.`,
          'Trace le segment [BC].',
        ],
      },
    ],
    plus_loin: [
      {
        figure: 'un triangle isocèle',
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          `Écarte le compas de ${iso} cm.`,
          'Trace un arc de cercle de centre A, puis un arc de cercle de centre B, sans changer l’écartement.',
          'Appelle C un point où les deux arcs se coupent.',
          'Trace les segments [AC] et [BC].',
        ],
      },
      {
        figure: 'un rectangle et un cercle',
        etapes: [
          `Trace le segment [AB] de ${pair} cm.`,
          `Avec l’équerre, trace les segments [AD] et [BC] de ${b} cm, perpendiculaires au segment [AB], du même côté.`,
          'Trace le segment [DC] pour fermer le rectangle.',
          'Place le point M, milieu du côté [AB].',
          'Pique le compas sur A, écarte-le jusqu’à M et trace le cercle.',
        ],
      },
      {
        figure: 'un triangle équilatéral',
        etapes: [
          `Trace le segment [AB] de ${a} cm.`,
          `Écarte le compas de ${a} cm, la longueur du segment [AB].`,
          'Trace un arc de cercle de centre A, puis un arc de cercle de centre B, sans changer l’écartement.',
          'Appelle C un point où les deux arcs se coupent.',
          'Trace les segments [AC] et [BC].',
        ],
      },
    ],
  };
  return p[level];
}

const construireOrdre: ItemGen = (level, rng, ctx) => {
  const prog = rng.pick(programmes(level, rng));
  return make(ctx, 'ordering', `ordre-${prog.etapes.join('|')}`, {
    prompt: `Remets dans l’ordre les étapes du programme de construction pour tracer ${prog.figure}.`,
    elements: prog.etapes,
    mode: 'etapes',
    explication: `On commence toujours par ce qui sert de base (le premier segment ou le centre), puis on construit ce qui s’appuie dessus : ${prog.etapes.map((e, i) => `${i + 1}) ${e}`).join(' ')}`,
    difficulty: difNiv(level),
    meta: { figure: prog.figure },
  });
};

const INSTRUMENTS: QR[] = [
  {
    q: 'Quel instrument utilise-t-on pour tracer un cercle ?',
    g: 'le compas',
    w: ['l’équerre', 'la règle graduée'],
    e: 'Le compas trace des cercles : sa pointe reste au centre.',
    niv: 'facile',
  },
  {
    q: 'Quel instrument utilise-t-on pour tracer un angle droit ?',
    g: 'l’équerre',
    w: ['le compas', 'la règle graduée'],
    e: 'L’équerre possède un angle droit.',
    niv: 'facile',
  },
  {
    q: 'Quel instrument utilise-t-on pour tracer un segment de 7 cm ?',
    g: 'la règle graduée',
    w: ['le compas', 'l’équerre'],
    e: 'La règle graduée permet de mesurer et de tracer une longueur précise.',
    niv: 'facile',
  },
  {
    q: 'Quel instrument permet de reporter une longueur sans la mesurer ?',
    g: 'le compas',
    w: ['l’équerre', 'la règle non graduée'],
    e: 'On écarte le compas sur la première longueur, puis on la reporte ailleurs.',
    niv: 'normal',
  },
  {
    q: 'Pour vérifier qu’un quadrilatère est un rectangle, quel instrument utilise-t-on pour ses angles ?',
    g: 'l’équerre',
    w: ['le compas', 'la règle non graduée'],
    e: 'On vérifie avec l’équerre que les 4 angles sont droits.',
    niv: 'normal',
  },
  {
    q: 'Pour vérifier qu’un quadrilatère est un losange, que doit-on comparer ?',
    g: 'les longueurs des 4 côtés',
    w: ['les 4 angles avec l’équerre', 'les diagonales avec le compas seulement'],
    e: 'Un losange a 4 côtés de même longueur : on les compare à la règle graduée ou au compas.',
    niv: 'plus_loin',
  },
];

const construireQcm: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, {
    facile: rng.pick(['instrument', 'instrument', 'ecart'] as const),
    normal: rng.pick(['instrument', 'figure', 'ecart', 'figure'] as const),
    plus_loin: rng.pick(['manque', 'manque', 'figure', 'instrument'] as const),
  });
  if (forme === 'ecart') {
    const r = rng.int(2, 8);
    const diam = level !== 'facile' && rng.chance(0.5);
    return mcq(ctx, rng, `ecart-${diam}-${r}`, {
      question: diam
        ? `Pour tracer un cercle de ${2 * r} cm de diamètre, de combien dois-je écarter mon compas ?`
        : `Pour tracer un cercle de rayon ${r} cm, de combien dois-je écarter mon compas ?`,
      good: `${r} cm`,
      wrong: diam ? [`${2 * r} cm`, `${4 * r} cm`, `${r + 1} cm`] : [`${2 * r} cm`, `${r + 1} cm`],
      explication: diam
        ? `L’écartement du compas, c’est le rayon : la moitié du diamètre, ${2 * r} : 2 = ${r} cm.`
        : `L’écartement du compas, c’est le rayon : ${r} cm.`,
      difficulty: diam ? 0.5 : 0.3,
      max: level === 'facile' ? 3 : 4,
    });
  }
  if (forme === 'figure') {
    const progs = [
      ...programmes('normal', rng),
      ...(level === 'plus_loin' ? programmes('plus_loin', rng) : []),
    ];
    const prog = rng.pick(progs.filter((p) => !p.figure.includes(' et ')));
    const nomFig = prog.figure.replace(/ (de|sur) .*$/, '').replace(/ \d.*$/, '');
    return mcq(ctx, rng, `figure-${prog.etapes.join('|')}`, {
      question: `Quelle figure obtient-on avec ce programme ? ${prog.etapes.join(' ')}`,
      good: nomFig,
      wrong: [
        'un carré',
        'un rectangle',
        'un cercle',
        'un triangle rectangle',
        'un losange',
        'un triangle isocèle',
        'un triangle équilatéral',
      ].filter(
        (w) =>
          !(nomFig === 'un carré' && (w === 'un rectangle' || w === 'un losange')) &&
          !(nomFig === 'un triangle équilatéral' && w === 'un triangle isocèle'),
      ),
      explication: `Ce programme construit ${prog.figure}.`,
      difficulty: level === 'plus_loin' ? 0.65 : 0.5,
    });
  }
  if (forme === 'manque') {
    const tous = [...programmes('normal', rng), ...programmes('plus_loin', rng)];
    const prog = rng.pick(tous);
    const i = rng.int(1, prog.etapes.length - 1);
    const debut = (e: string) => e.split(' ').slice(0, 3).join(' ');
    const autres = tous
      .flatMap((p) => p.etapes)
      .filter((e) => !prog.etapes.includes(e) && debut(e) !== debut(prog.etapes[i]!));
    return mcq(ctx, rng, `manque-${prog.etapes.join('|')}-${i}`, {
      question: `Il manque une étape dans ce programme pour tracer ${prog.figure} : ${prog.etapes
        .map((e, k) => (k === i ? '…' : e))
        .join(' ')} Quelle étape manque ?`,
      good: prog.etapes[i]!,
      wrong: rng.shuffle(autres).slice(0, 3),
      explication: `L’étape manquante est : « ${prog.etapes[i]} » Sans elle, on ne peut pas faire l’étape suivante.`,
      difficulty: 0.75,
    });
  }
  const q = rng.pick(auNiveau(level, INSTRUMENTS));
  return mcq(ctx, rng, `instr-${q.q}`, {
    question: q.q,
    good: q.g,
    wrong: q.w,
    explication: q.e,
    difficulty: difNiv(q.niv),
  });
};

/** Compléter une figure sur un quadrillage de nœuds : placer le 4e sommet. */
const construireShape: ItemGen = (level, rng, ctx) => {
  const cols = 12;
  const rows = 9;
  for (let essai = 0; essai < 200; essai++) {
    let u: Pt;
    let v: Pt;
    let nom: string;
    if (level === 'facile') {
      u = [rng.int(2, 6), 0];
      v = [0, rng.int(2, 4) * (rng.chance(0.5) ? 1 : -1)];
      nom = u[0] === Math.abs(v[1]) ? 'carré' : 'rectangle';
    } else if (level === 'normal') {
      const p = rng.int(1, 3);
      const q = rng.int(1, 3);
      u = [p, q];
      v = [-q, p];
      nom = 'carré';
    } else if (rng.chance(0.5)) {
      const [uu, vv] = rng.pick([
        [
          [2, 1],
          [1, 2],
        ],
        [
          [3, 1],
          [1, 3],
        ],
        [
          [4, 3],
          [5, 0],
        ],
        [
          [3, 4],
          [0, 5],
        ],
        [
          [3, 2],
          [2, 3],
        ],
      ] as [Pt, Pt][]);
      u = uu;
      v = vv;
      nom = 'losange';
    } else {
      const p = rng.int(1, 2);
      const q = rng.int(1, 2);
      const k = 2;
      u = [p, q];
      v = [-q * k, p * k];
      nom = 'rectangle';
    }
    const A: Pt = [rng.int(0, cols), rng.int(0, rows)];
    const B = add(A, u);
    const C = add(B, v);
    const D = add(A, v);
    if (![B, C, D].every((p) => dans(p, cols, rows))) continue;
    return make(ctx, 'geometry_shape', `sommet-${nom}-${cellKey(A)}-${cellKey(B)}-${cellKey(C)}`, {
      prompt: `Les points A, B et C sont trois sommets ${nom === 'carré' ? 'd’un carré' : nom === 'losange' ? 'd’un losange' : 'd’un rectangle'} ABCD. Place le point D.`,
      task: 'tracer',
      shape: nom === 'carré' ? 'carre' : nom,
      answer: cellKey(D),
      grid: { cols, rows, cells: [] },
      explication: `Dans ${nom === 'carré' ? 'un carré' : nom === 'losange' ? 'un losange' : 'un rectangle'}, les côtés opposés sont parallèles et de même longueur : de B à C, on fait ${deplacementTxt(v)} ; on fait le même déplacement à partir de A pour trouver D.`,
      difficulty: level === 'facile' ? 0.25 : level === 'normal' ? 0.55 : 0.75,
      meta: {
        noeuds: true,
        points: { A, B, C },
        segments: [
          ['A', 'B'],
          ['B', 'C'],
        ],
        solution: D,
        figure: nom,
      },
    });
  }
  return make(ctx, 'geometry_shape', 'sommet-secours', {
    prompt: 'Les points A, B et C sont trois sommets d’un rectangle ABCD. Place le point D.',
    task: 'tracer',
    shape: 'rectangle',
    answer: '1,4',
    grid: { cols, rows, cells: [] },
    explication: 'De B à C, on descend de 3 carreaux ; on fait pareil à partir de A pour trouver D.',
    difficulty: 0.25,
    meta: {
      noeuds: true,
      points: { A: [1, 1], B: [5, 1], C: [5, 4] },
      segments: [
        ['A', 'B'],
        ['B', 'C'],
      ],
      solution: [1, 4],
      figure: 'rectangle',
    },
  });
};

const construireVraiFaux: ItemGen = (level, rng, ctx) => {
  if (rng.chance(0.5)) {
    const r = rng.int(2, 7);
    const juste = rng.chance(0.5);
    const diam = level !== 'facile' && rng.chance(0.5);
    const montre = juste ? r : 2 * r;
    return vraiFaux(ctx, `vf-compas-${diam}-${r}-${montre}`, {
      statement: diam
        ? `Pour tracer un cercle de ${2 * r} cm de diamètre, j’écarte mon compas de ${montre} cm.`
        : `Pour tracer un cercle de rayon ${r} cm, j’écarte mon compas de ${montre} cm.`,
      answer: montre === r,
      explication: `L’écartement du compas est égal au rayon${diam ? ', la moitié du diamètre' : ''} : ${r} cm.`,
      difficulty: diam ? 0.5 : 0.3,
    });
  }
  const pool: VF[] = [
    {
      s: 'On utilise l’équerre pour tracer un angle droit.',
      v: true,
      e: 'L’équerre a un angle droit.',
      niv: 'facile',
    },
    {
      s: 'Le compas sert à vérifier qu’un angle est droit.',
      v: false,
      e: 'C’est l’équerre qui sert à vérifier un angle droit ; le compas trace des cercles et reporte des longueurs.',
      niv: 'facile',
    },
    {
      s: 'Pour tracer un segment de 6 cm, j’utilise la règle graduée.',
      v: true,
      e: 'La règle graduée mesure les longueurs.',
      niv: 'facile',
    },
    {
      s: 'On peut tracer un cercle avec une équerre.',
      v: false,
      e: 'On trace un cercle avec un compas.',
      niv: 'facile',
    },
    {
      s: 'Un programme de construction donne, dans l’ordre, les étapes pour tracer une figure.',
      v: true,
      e: 'Chaque étape s’appuie sur les précédentes : l’ordre compte.',
      niv: 'normal',
    },
    {
      s: 'Dans un programme de construction, l’ordre des étapes n’a aucune importance.',
      v: false,
      e: 'On ne peut pas placer un point sur une droite qui n’est pas encore tracée : l’ordre compte.',
      niv: 'normal',
    },
    {
      s: 'Le compas permet de reporter une longueur sans la mesurer.',
      v: true,
      e: 'On garde l’écartement du compas et on le reporte ailleurs.',
      niv: 'normal',
    },
    {
      s: 'Pour tracer un triangle équilatéral, on peut utiliser le compas avec le même écartement que le premier côté.',
      v: true,
      e: 'Les deux arcs de même rayon donnent le 3e sommet : les 3 côtés sont égaux.',
      niv: 'plus_loin',
    },
    {
      s: 'Pour tracer un carré, il suffit de tracer 4 segments de même longueur.',
      v: false,
      e: 'Il faut aussi des angles droits : 4 côtés égaux sans angle droit donnent un losange.',
      niv: 'plus_loin',
    },
  ];
  const q = vfDepuis(pool, level, rng);
  return vraiFaux(ctx, `vf-${q.s}`, {
    statement: q.s,
    answer: q.v,
    explication: q.e,
    difficulty: difNiv(q.niv),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.SYMETRIE                                                 */
/* ------------------------------------------------------------------ */

/** Forme connexe aléatoire de k cases dans la zone autorisée. */
function formeConnexe(rng: Rng, k: number, ok: (c: Cell) => boolean, start: Cell): Cell[] {
  const cells: Cell[] = [start];
  const seen = new Set([cellKey(start)]);
  let guard = 0;
  while (cells.length < k && guard++ < 800) {
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

type Axe = 'vertical' | 'horizontal' | 'diagonale' | 'anti-diagonale';

/** Image d’une case par la symétrie (quadrillage cols × rows ; diagonales : quadrillage carré). */
export function symetrique(axe: Axe, cols: number, rows: number, [x, y]: Cell): Cell {
  if (axe === 'vertical') return [cols - 1 - x, y];
  if (axe === 'horizontal') return [x, rows - 1 - y];
  if (axe === 'diagonale') return [y, x];
  return [cols - 1 - y, cols - 1 - x];
}

const tri = (cs: Cell[]) => [...cs].sort((a, b) => a[1] - b[1] || a[0] - b[0]);

const symetrieShape: ItemGen = (level, rng, ctx) => {
  const axe: Axe = parNiv(level, {
    facile: 'vertical' as Axe,
    normal: rng.pick(['vertical', 'horizontal', 'diagonale'] as Axe[]),
    plus_loin: rng.pick(['vertical', 'horizontal', 'diagonale', 'anti-diagonale'] as Axe[]),
  });
  const cheval = level === 'plus_loin' && rng.chance(0.5);
  const k = parNiv(level, { facile: rng.int(3, 4), normal: rng.int(4, 6), plus_loin: rng.int(6, 9) });
  const diag = axe === 'diagonale' || axe === 'anti-diagonale';
  const [cols, rows] = diag
    ? parNiv(level, { facile: [6, 6], normal: [7, 7], plus_loin: [8, 8] })
    : parNiv(level, { facile: [8, 6], normal: [10, 8], plus_loin: [12, 10] });
  const dansG = ([x, y]: Cell) => x >= 0 && y >= 0 && x < cols && y < rows;
  // Côté « source » de l’axe
  const cote = ([x, y]: Cell) =>
    axe === 'vertical'
      ? x < cols / 2
      : axe === 'horizontal'
        ? y < rows / 2
        : axe === 'diagonale'
          ? x > y
          : x + y < cols - 1;
  const ok = (c: Cell) => dansG(c) && (cheval || cote(c));
  for (let essai = 0; essai < 100; essai++) {
    const start: Cell = cheval
      ? axe === 'vertical'
        ? [cols / 2 - 1, rng.int(1, rows - 2)]
        : axe === 'horizontal'
          ? [rng.int(1, cols - 2), rows / 2 - 1]
          : axe === 'diagonale'
            ? [rng.int(1, cols - 2), 0]
            : [0, rng.int(1, cols - 2)]
      : axe === 'vertical'
        ? [rng.int(1, cols / 2 - 1), rng.int(0, rows - 1)]
        : axe === 'horizontal'
          ? [rng.int(0, cols - 1), rng.int(1, rows / 2 - 1)]
          : axe === 'diagonale'
            ? [rng.int(2, cols - 1), rng.int(0, 1)]
            : [rng.int(0, 1), rng.int(0, cols - 3)];
    if (!ok(start)) continue;
    const cells = tri(formeConnexe(rng, k, ok, start));
    if (cells.length < k) continue;
    const keys = new Set(cells.map(cellKey));
    const solution = tri(
      cells.map((c) => symetrique(axe, cols, rows, c)).filter((c) => !keys.has(cellKey(c))),
    );
    if (!solution.length) continue;
    if (cheval && cells.every(cote)) continue;
    const nomAxe = {
      vertical: 'vertical',
      horizontal: 'horizontal',
      diagonale: 'qui suit la diagonale du quadrillage (du coin en haut à gauche au coin en bas à droite)',
      'anti-diagonale':
        'qui suit l’autre diagonale du quadrillage (du coin en haut à droite au coin en bas à gauche)',
    }[axe];
    return make(ctx, 'geometry_shape', `sym-${axe}-${cols}x${rows}-${cellsTxt(cells)}`, {
      prompt: cheval
        ? `Complète la figure pour qu’elle soit symétrique par rapport à l’axe ${nomAxe}.`
        : `Colorie les cases symétriques par rapport à l’axe ${nomAxe}.`,
      task: 'symetrie',
      shape: 'grille',
      answer: cellsTxt(solution),
      grid: { cols, rows, cells, axis: diag ? 'diagonale' : axe },
      explication: diag
        ? 'Avec un axe en diagonale, chaque case symétrique est de l’autre côté de l’axe, à la même distance, en traversant les carreaux en diagonale : comme si on pliait le quadrillage le long de l’axe.'
        : 'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
      difficulty: clamp01(
        0.15 + k * 0.05 + (diag ? 0.3 : axe === 'horizontal' ? 0.1 : 0) + (cheval ? 0.1 : 0),
      ),
      meta: {
        solution,
        mode: cheval ? 'completer' : 'colorier',
        axe:
          axe === 'vertical'
            ? { type: 'vertical', entreColonnes: [cols / 2 - 1, cols / 2] }
            : axe === 'horizontal'
              ? { type: 'horizontal', entreLignes: [rows / 2 - 1, rows / 2] }
              : axe === 'diagonale'
                ? { type: 'diagonale', de: 'haut-gauche', vers: 'bas-droite' }
                : // grid.axis = 'diagonale' faute de valeur dédiée : seul meta.axe distingue l’autre diagonale
                  { type: 'anti-diagonale', de: 'haut-droite', vers: 'bas-gauche' },
      },
    });
  }
  return make(ctx, 'geometry_shape', 'sym-secours', {
    prompt: 'Colorie les cases symétriques par rapport à l’axe vertical.',
    task: 'symetrie',
    shape: 'grille',
    answer: '6,1;6,2;5,2',
    grid: {
      cols: 8,
      rows: 6,
      cells: [
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      axis: 'vertical',
    },
    explication: 'Chaque case symétrique est à la même distance de l’axe, de l’autre côté.',
    difficulty: 0.3,
    meta: {
      solution: [
        [6, 1],
        [6, 2],
        [5, 2],
      ],
      mode: 'colorier',
      axe: { type: 'vertical', entreColonnes: [3, 4] },
    },
  });
};

/** Nombre d’axes de symétrie des figures usuelles. */
const AXES: { fig: string; n: string; e: string; niv: Level }[] = [
  {
    fig: 'un carré',
    n: '4',
    e: 'Le carré a 4 axes : 2 qui passent par les milieux des côtés et 2 qui suivent les diagonales.',
    niv: 'normal',
  },
  {
    fig: 'un rectangle qui n’est pas un carré',
    n: '2',
    e: 'Le rectangle a 2 axes, qui passent par les milieux des côtés opposés (pas par les diagonales !).',
    niv: 'normal',
  },
  {
    fig: 'un losange qui n’est pas un carré',
    n: '2',
    e: 'Le losange a 2 axes : ses deux diagonales.',
    niv: 'normal',
  },
  {
    fig: 'un triangle équilatéral',
    n: '3',
    e: 'Le triangle équilatéral a 3 axes : chacun passe par un sommet et le milieu du côté opposé.',
    niv: 'normal',
  },
  {
    fig: 'un triangle isocèle qui n’est pas équilatéral',
    n: '1',
    e: 'Le triangle isocèle a 1 axe, qui passe par le sommet entre les deux côtés égaux.',
    niv: 'normal',
  },
  {
    fig: 'un triangle dont les 3 côtés ont des longueurs différentes',
    n: '0',
    e: 'Aucun pliage ne superpose les deux moitiés : il n’a pas d’axe de symétrie.',
    niv: 'normal',
  },
  {
    fig: 'un cercle',
    n: 'une infinité',
    e: 'Toute droite qui passe par le centre d’un cercle est un axe de symétrie.',
    niv: 'normal',
  },
  {
    fig: 'un hexagone dont tous les côtés et tous les angles sont égaux',
    n: '6',
    e: 'L’hexagone régulier a 6 axes : 3 par les sommets opposés et 3 par les milieux des côtés opposés.',
    niv: 'plus_loin',
  },
  {
    fig: 'un pentagone dont tous les côtés et tous les angles sont égaux',
    n: '5',
    e: 'Le pentagone régulier a 5 axes : chacun passe par un sommet et le milieu du côté opposé.',
    niv: 'plus_loin',
  },
  {
    fig: 'un trapèze rectangle',
    n: '0',
    e: 'Aucun pliage ne superpose les deux moitiés d’un trapèze rectangle : il n’a pas d’axe.',
    niv: 'plus_loin',
  },
];
const CHOIX_AXES = ['0', '1', '2', '3', '4', '5', '6', 'une infinité'];

const symetrieQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'facile' || rng.chance(0.35)) {
    const k = rng.int(1, 6);
    const vertical = level === 'facile' || rng.chance(0.5);
    const [ici, la] = vertical ? ['à gauche', 'à droite'] : ['au-dessus', 'en dessous'];
    return mcq(ctx, rng, `point-${vertical}-${k}`, {
      question: `Le point A est à ${carreaux(k)} ${ici} de l’axe de symétrie ${vertical ? 'vertical' : 'horizontal'}. Où est son symétrique ?`,
      good: `à ${carreaux(k)} ${la} de l’axe`,
      wrong: [
        `à ${carreaux(k)} ${ici} de l’axe`,
        `à ${carreaux(2 * k)} ${la} de l’axe`,
        'sur l’axe',
        `à ${carreaux(k + 1)} ${la} de l’axe`,
      ],
      explication: `Le symétrique est de l’autre côté de l’axe, à la même distance : ${carreaux(k)} ${la}.`,
      difficulty: level === 'facile' ? 0.25 : 0.35,
      max: level === 'facile' ? 3 : 4,
    });
  }
  const a = rng.pick(auNiveau(level, AXES));
  return mcq(ctx, rng, `axes-${a.fig}`, {
    question: `Combien d’axes de symétrie a ${a.fig} ?`,
    good: a.n,
    wrong: CHOIX_AXES,
    explication: a.e,
    difficulty: difNiv(a.niv) + 0.05,
  });
};

/** Lettres majuscules (police bâton). */
const LETTRES: Record<string, string> = {
  A: 'vertical',
  M: 'vertical',
  T: 'vertical',
  U: 'vertical',
  V: 'vertical',
  W: 'vertical',
  Y: 'vertical',
  B: 'horizontal',
  C: 'horizontal',
  D: 'horizontal',
  E: 'horizontal',
  K: 'horizontal',
  H: 'les deux',
  I: 'les deux',
  O: 'les deux',
  X: 'les deux',
  F: 'aucun',
  G: 'aucun',
  J: 'aucun',
  L: 'aucun',
  N: 'aucun',
  P: 'aucun',
  R: 'aucun',
  S: 'aucun',
  Z: 'aucun',
};

const symetrieClasser: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin') {
    const cats = ['aucun axe', '1 axe', '2 axes', 'plus de 2 axes'];
    const cat = (n: string) => (n === '0' ? 0 : n === '1' ? 1 : n === '2' ? 2 : 3);
    const els = rng
      .shuffle(AXES)
      .slice(0, 7)
      .map((a) => ({ label: a.fig, category: cat(a.n) }));
    return make(ctx, 'classification', `axes-${els.map((e) => e.label).join('|')}`, {
      prompt: 'Range ces figures selon leur nombre d’axes de symétrie.',
      categories: cats,
      elements: els,
      explication:
        'Un axe de symétrie est un pli qui partage la figure en deux moitiés qui se superposent exactement : carré 4, rectangle 2, losange 2, triangle équilatéral 3, cercle une infinité.',
      difficulty: 0.8,
    });
  }
  const cats =
    level === 'facile'
      ? ['axe vertical', 'aucun axe']
      : ['axe vertical seulement', 'axe horizontal seulement', 'les deux axes', 'aucun axe'];
  const cle = level === 'facile' ? ['vertical', 'aucun'] : ['vertical', 'horizontal', 'les deux', 'aucun'];
  const n = level === 'facile' ? 3 : 2;
  const els = cle.flatMap((c, i) =>
    rng
      .shuffle(Object.keys(LETTRES).filter((l) => LETTRES[l] === c))
      .slice(0, n)
      .map((l) => ({ label: l, category: i })),
  );
  return make(ctx, 'classification', `lettres-${els.map((e) => e.label).join('')}`, {
    prompt:
      level === 'facile'
        ? 'Range ces lettres majuscules : ont-elles un axe de symétrie vertical ?'
        : 'Range ces lettres majuscules selon leurs axes de symétrie.',
    categories: cats,
    elements: rng.shuffle(els),
    explication:
      'Une lettre a un axe de symétrie si on peut la plier en deux moitiés qui se superposent : A a un axe vertical, B un axe horizontal, H les deux, F aucun.',
    difficulty: level === 'facile' ? 0.3 : 0.55,
  });
};

const VF_SYMETRIE: VF[] = [
  {
    s: 'Une figure et sa symétrique ont la même forme et la même taille.',
    v: true,
    e: 'La symétrie retourne la figure comme un miroir, sans la déformer.',
    niv: 'facile',
  },
  {
    s: 'Le symétrique d’une figure est toujours plus petit qu’elle.',
    v: false,
    e: 'La symétrie conserve les longueurs : la figure symétrique a la même taille.',
    niv: 'facile',
  },
  {
    s: 'Un point et son symétrique sont à la même distance de l’axe.',
    v: true,
    e: 'Ils sont de part et d’autre de l’axe, à la même distance.',
    niv: 'facile',
  },
  {
    s: 'Un rectangle qui n’est pas un carré a 4 axes de symétrie.',
    v: false,
    e: 'Il n’en a que 2 : ses diagonales ne sont pas des axes de symétrie.',
    niv: 'normal',
  },
  {
    s: 'Un carré a 4 axes de symétrie.',
    v: true,
    e: '2 axes par les milieux des côtés et 2 par les diagonales.',
    niv: 'normal',
  },
  {
    s: 'Un cercle a une infinité d’axes de symétrie.',
    v: true,
    e: 'Toute droite qui passe par son centre est un axe.',
    niv: 'normal',
  },
  {
    s: 'La lettre F a un axe de symétrie vertical.',
    v: false,
    e: 'Plié verticalement, le F ne se superpose pas : il n’a pas d’axe.',
    niv: 'normal',
  },
  {
    s: 'Un point situé sur l’axe de symétrie est son propre symétrique.',
    v: true,
    e: 'Il est à une distance nulle de l’axe : il ne bouge pas.',
    niv: 'plus_loin',
  },
  {
    s: 'La diagonale d’un rectangle qui n’est pas un carré est un axe de symétrie.',
    v: false,
    e: 'Plié selon sa diagonale, un rectangle ne se superpose pas à lui-même.',
    niv: 'plus_loin',
  },
  {
    s: 'Un triangle équilatéral a 3 axes de symétrie.',
    v: true,
    e: 'Chaque axe passe par un sommet et le milieu du côté opposé.',
    niv: 'plus_loin',
  },
];

const symetrieVraiFaux: ItemGen = (level, rng, ctx) => {
  if (rng.chance(0.4)) {
    const k = rng.int(1, 7);
    const juste = rng.chance(0.5);
    const m = juste ? k : rng.pick([k + 1, k + 2, 2 * k, Math.max(0, k - 1)].filter((x) => x !== k));
    const vertical = level === 'facile' || rng.chance(0.5);
    const [ici, la] = vertical ? ['à gauche', 'à droite'] : ['au-dessus', 'en dessous'];
    return vraiFaux(ctx, `vf-dist-${vertical}-${k}-${m}`, {
      statement: `Le point A est à ${carreaux(k)} ${ici} de l’axe. Son symétrique A’ est à ${carreaux(m)} ${la} de l’axe.`,
      answer: m === k,
      explication: `Un point et son symétrique sont à la même distance de l’axe : A’ est à ${carreaux(k)} ${la}.`,
      difficulty: 0.35,
    });
  }
  const q = vfDepuis(VF_SYMETRIE, level, rng);
  return vraiFaux(ctx, `vf-${q.s}`, {
    statement: q.s,
    answer: q.v,
    explication: q.e,
    difficulty: difNiv(q.niv),
  });
};

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const GEOMETRIE: Record<string, LessonContent> = {
  'CM2.MA.GEO.VOCAB': {
    gens: {
      geometry_shape: vocabShape,
      mcq: vocabQcm,
      classification: vocabClasser,
      true_false: vocabVraiFaux,
    },
  },
  'CM2.MA.GEO.FIGURES': {
    gens: {
      geometry_shape: figuresShape,
      mcq: figuresQcm,
      classification: figuresClasser,
      true_false: figuresVraiFaux,
    },
  },
  'CM2.MA.GEO.CONSTRUIRE': {
    gens: {
      ordering: construireOrdre,
      mcq: construireQcm,
      geometry_shape: construireShape,
      true_false: construireVraiFaux,
    },
  },
  'CM2.MA.GEO.SYMETRIE': {
    gens: {
      geometry_shape: symetrieShape,
      mcq: symetrieQcm,
      classification: symetrieClasser,
      true_false: symetrieVraiFaux,
    },
  },
  ...GEOMETRIE_ESPACE,
};
