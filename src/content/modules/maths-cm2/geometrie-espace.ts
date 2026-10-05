/**
 * CM2 — Espace (BO n°16 du 17/04/2025, cycle 3, « Les solides » et « Déplacements dans l’espace ») :
 * - solides : cube, pavé, boule, cône, pyramide, cylindre, prisme droit ; décrire (faces, arêtes, sommets,
 *   nature des faces) ; identifier un solide en perspective (sans en construire) ; patrons : reconnaître et
 *   construire un patron du cube, reconnaître un patron du pavé ; plus loin : assemblages de cubes ;
 * - déplacements : instructions absolues (flèches), relatives (avancer, quart de tour) ; plus loin : boucles
 *   « répéter … fois [ … ] » (initiation à la pensée informatique, 6e).
 *
 * Conventions des quadrillages : coordonnées [x, y] avec x = colonne (0 à gauche) et y = ligne (0 en haut).
 * Dans les énoncés, les cases sont désignées « colonne x, ligne y » en commençant à 1 (pas de lettre, pour ne
 * pas confondre avec l’instruction A = avancer).
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { cap, clamp01, make, mcq, numeric, parNiv, vraiFaux } from './util';

export type Cell = [number, number];
export const cellKey = (c: Cell) => `${c[0]},${c[1]}`;
export const cellsTxt = (cs: Cell[]) =>
  [...cs]
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(cellKey)
    .join(';');

const NIVEAUX: Level[] = ['facile', 'normal', 'plus_loin'];
const auNiveau = <T extends { niv: Level }>(level: Level, pool: T[]) =>
  pool.filter((p) => NIVEAUX.indexOf(p.niv) <= NIVEAUX.indexOf(level));

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.SOLIDES                                                  */
/* ------------------------------------------------------------------ */

type Solide = {
  id: string;
  nom: string;
  /** « un cube », « une pyramide à base carrée ». */
  un: string;
  /** « le cube », « la pyramide à base carrée ». */
  le: string;
  niv: Level;
  /** null = solide qui n’est pas un polyèdre (surface courbe). */
  faces: number | null;
  aretes: number | null;
  sommets: number | null;
  natureFaces: string;
};

const SOLIDES: Solide[] = [
  {
    id: 'cube',
    nom: 'cube',
    un: 'un cube',
    le: 'le cube',
    niv: 'facile',
    faces: 6,
    aretes: 12,
    sommets: 8,
    natureFaces: '6 carrés',
  },
  {
    id: 'pave',
    nom: 'pavé',
    un: 'un pavé',
    le: 'le pavé',
    niv: 'facile',
    faces: 6,
    aretes: 12,
    sommets: 8,
    natureFaces: '6 rectangles',
  },
  {
    id: 'pyramide_base_carree',
    nom: 'pyramide',
    un: 'une pyramide à base carrée',
    le: 'la pyramide à base carrée',
    niv: 'facile',
    faces: 5,
    aretes: 8,
    sommets: 5,
    natureFaces: '4 triangles et 1 carré',
  },
  {
    id: 'boule',
    nom: 'boule',
    un: 'une boule',
    le: 'la boule',
    niv: 'facile',
    faces: null,
    aretes: null,
    sommets: null,
    natureFaces: 'aucune face plane',
  },
  {
    id: 'cylindre',
    nom: 'cylindre',
    un: 'un cylindre',
    le: 'le cylindre',
    niv: 'facile',
    faces: null,
    aretes: null,
    sommets: null,
    natureFaces: '2 disques et une surface courbe',
  },
  {
    id: 'cone',
    nom: 'cône',
    un: 'un cône',
    le: 'le cône',
    niv: 'facile',
    faces: null,
    aretes: null,
    sommets: null,
    natureFaces: '1 disque et une surface courbe',
  },
  {
    id: 'prisme_base_triangulaire',
    nom: 'prisme droit',
    un: 'un prisme droit à base triangulaire',
    le: 'le prisme droit à base triangulaire',
    niv: 'normal',
    faces: 5,
    aretes: 9,
    sommets: 6,
    natureFaces: '2 triangles et 3 rectangles',
  },
  {
    id: 'pyramide_base_triangulaire',
    nom: 'pyramide',
    un: 'une pyramide à base triangulaire',
    le: 'la pyramide à base triangulaire',
    niv: 'plus_loin',
    faces: 4,
    aretes: 6,
    sommets: 4,
    natureFaces: '4 triangles',
  },
  {
    id: 'prisme_base_hexagonale',
    nom: 'prisme droit',
    un: 'un prisme droit à base hexagonale',
    le: 'le prisme droit à base hexagonale',
    niv: 'plus_loin',
    faces: 8,
    aretes: 18,
    sommets: 12,
    natureFaces: '2 hexagones et 6 rectangles',
  },
];
const POLYEDRES = SOLIDES.filter((s) => s.faces !== null);
/** Noms affichés des solides « de base » (pour les choix). */
const NOMS_SOLIDES = ['cube', 'pavé', 'pyramide', 'boule', 'cylindre', 'cône', 'prisme droit'];

const OBJETS: { o: string; img: string; s: string; niv: Level }[] = [
  { o: 'un dé', img: '🎲', s: 'cube', niv: 'facile' },
  { o: 'un glaçon', img: '🧊', s: 'cube', niv: 'facile' },
  { o: 'une boite à chaussures', img: '📦', s: 'pavé', niv: 'facile' },
  { o: 'une brique', img: '🧱', s: 'pavé', niv: 'facile' },
  { o: 'une boite de conserve', img: '🥫', s: 'cylindre', niv: 'facile' },
  { o: 'une bougie', img: '🕯️', s: 'cylindre', niv: 'facile' },
  { o: 'un rouleau de papier', img: '🧻', s: 'cylindre', niv: 'facile' },
  { o: 'une balle de tennis', img: '🎾', s: 'boule', niv: 'facile' },
  { o: 'une orange', img: '🍊', s: 'boule', niv: 'facile' },
  { o: 'un cornet de glace', img: '🍦', s: 'cône', niv: 'facile' },
  { o: 'un chapeau pointu de fête', img: '🥳', s: 'cône', niv: 'facile' },
  { o: 'un plot de chantier', img: '🚧', s: 'cône', niv: 'facile' },
  { o: 'une tente canadienne', img: '⛺', s: 'prisme droit', niv: 'normal' },
  { o: 'une part de fromage en forme de triangle', img: '🧀', s: 'prisme droit', niv: 'normal' },
  { o: 'la pyramide du Louvre', img: '🔺', s: 'pyramide', niv: 'normal' },
];

const article = (nom: string) => (['boule', 'pyramide'].includes(nom) ? 'une' : 'un');

/* --- Patrons ------------------------------------------------------- */

/** Les 11 patrons du cube. */
const PATRONS_CUBE: Cell[][] = [
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
];
/** Assemblages de 6 carrés qui ne sont PAS des patrons du cube. */
const FAUX_PATRONS_CUBE: Cell[][] = [
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
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
    [1, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 0],
    [2, 0],
  ],
];

/**
 * Un assemblage de 6 carrés est-il un patron de cube ? On fait « rouler » un cube sur l’assemblage :
 * c’est un patron si chaque carré est touché par une face différente du cube.
 */
export function estPatronDeCube(cells: Cell[]): boolean {
  if (cells.length !== 6) return false;
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

const decaler = (cs: Cell[], dx: number, dy: number): Cell[] => cs.map(([x, y]) => [x + dx, y + dy]);
const VOISINS: Cell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const connexe = (cs: Cell[]) => {
  if (!cs.length) return true;
  const keys = new Set(cs.map(cellKey));
  const vu = new Set([cellKey(cs[0]!)]);
  const file = [cs[0]!];
  while (file.length) {
    const [x, y] = file.shift()!;
    for (const [dx, dy] of VOISINS) {
      const k = `${x + dx},${y + dy}`;
      if (keys.has(k) && !vu.has(k)) {
        vu.add(k);
        file.push([x + dx, y + dy]);
      }
    }
  }
  return vu.size === cs.length;
};

/** Rectangle d’un patron de pavé, en carreaux : coin haut-gauche (x, y), largeur w, hauteur h. */
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Patron (ou faux patron) d’un pavé L × l × h en croix : bande de 4 faces + 2 couvercles.
 * Erreurs possibles : bande L, L, l, l ; deux couvercles du même côté ; couvercle de mauvaise taille.
 */
function patronPave(
  L: number,
  l: number,
  h: number,
  haut: 0 | 2,
  bas: 0 | 2,
  erreur: 'aucune' | 'bande' | 'meme_cote' | 'couvercle',
): Rect[] {
  const largeurs = erreur === 'bande' ? [L, L, l, l] : [L, l, L, l];
  const xs = [0, largeurs[0]!, largeurs[0]! + largeurs[1]!, largeurs[0]! + largeurs[1]! + largeurs[2]!];
  const bande: Rect[] = largeurs.map((w, i) => ({ x: xs[i]!, y: l, w, h }));
  const hCouv = erreur === 'couvercle' ? h : l;
  const xHaut = xs[haut]!;
  const xBas = xs[erreur === 'meme_cote' ? (haut === 0 ? 2 : 0) : bas]!;
  const couvHaut: Rect = { x: xHaut, y: l - hCouv, w: L, h: hCouv };
  const couvBas: Rect =
    erreur === 'meme_cote' ? { x: xBas, y: 0, w: L, h: l } : { x: xBas, y: l + h, w: L, h: l };
  return [couvHaut, ...bande, couvBas];
}

const cellulesDe = (rs: Rect[]): Cell[] =>
  rs.flatMap((r) => {
    const out: Cell[] = [];
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) out.push([x, y]);
    return out;
  });

/* --- Générateurs SOLIDES ------------------------------------------- */

const solidesShape: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, {
    facile: rng.pick(['nommer', 'nommer', 'patron'] as const),
    normal: rng.pick(['nommer', 'proprietes', 'patron', 'completer', 'pave'] as const),
    plus_loin: rng.pick(['proprietes', 'completer', 'pave', 'pave'] as const),
  });
  if (forme === 'nommer') {
    const s = rng.pick(auNiveau(level, SOLIDES).filter((x) => x.niv !== 'plus_loin'));
    const autres = NOMS_SOLIDES.filter((n) => n !== s.nom && (level !== 'facile' || n !== 'prisme droit'));
    return make(ctx, 'geometry_shape', `nommer-${s.id}`, {
      prompt: 'Quel est ce solide ?',
      task: 'solide',
      shape: s.id,
      choices: rng.shuffle([s.nom, ...rng.shuffle(autres).slice(0, level === 'facile' ? 2 : 3)]),
      answer: s.nom,
      explication:
        s.faces !== null
          ? `C’est ${s.un} : ses faces sont ${s.natureFaces}.`
          : `C’est ${s.un} : ${s.natureFaces}.`,
      difficulty: s.niv === 'facile' ? 0.15 : 0.4,
      meta: { solide: { faces: s.faces, aretes: s.aretes, sommets: s.sommets, natureFaces: s.natureFaces } },
    });
  }
  if (forme === 'proprietes') {
    const s = rng.pick(auNiveau(level, POLYEDRES));
    const quoi = rng.pick(['faces', 'arêtes', 'sommets'] as const);
    const n = (quoi === 'faces' ? s.faces : quoi === 'arêtes' ? s.aretes : s.sommets)!;
    const choix = [...new Set([n, 4, 5, 6, 8, 12].filter((x) => x !== n))].slice(0, 3);
    return make(ctx, 'geometry_shape', `compter-${s.id}-${quoi}`, {
      prompt: `Combien ${quoi === 'arêtes' ? 'd’arêtes' : `de ${quoi}`} ${s.le.startsWith('la') ? 'cette' : 'ce'} ${s.le.replace(/^(le|la) /, '')} a-t-${s.le.startsWith('la') ? 'elle' : 'il'} ?`,
      task: 'proprietes',
      shape: s.id,
      choices: rng.shuffle([n, ...choix].map(String)),
      answer: String(n),
      explication: `${cap(s.le)} a ${s.faces} faces (${s.natureFaces}), ${s.aretes} arêtes et ${s.sommets} sommets. Sur un dessin en perspective, n’oublie pas les arêtes cachées en pointillés !`,
      difficulty: 0.4 + (s.niv === 'plus_loin' ? 0.3 : 0) + (quoi === 'arêtes' ? 0.15 : 0),
      meta: { perspective: true, cachees: 'pointillés' },
    });
  }
  if (forme === 'patron') {
    const oui = rng.chance(0.5);
    const base = rng.pick(oui ? PATRONS_CUBE : FAUX_PATRONS_CUBE);
    const cells = decaler(base, rng.int(0, 1), rng.int(0, 1));
    return make(ctx, 'geometry_shape', `patron-${cellsTxt(cells)}`, {
      prompt: 'Cet assemblage de 6 carrés est-il un patron de cube ?',
      task: 'patron',
      shape: 'patron_cube',
      choices: ['oui', 'non'],
      answer: estPatronDeCube(cells) ? 'oui' : 'non',
      grid: { cols: 7, rows: 5, cells },
      explication: estPatronDeCube(cells)
        ? 'En pliant, chacune des 6 faces trouve sa place sans se superposer : on obtient un cube.'
        : 'En pliant, deux carrés se retrouvent l’un sur l’autre et une face reste ouverte : ce n’est pas un patron de cube.',
      difficulty: level === 'facile' ? 0.45 : 0.55,
    });
  }
  if (forme === 'completer') {
    // Construire un patron du cube : ajouter le carré qui manque.
    for (let essai = 0; essai < 50; essai++) {
      const net = decaler(rng.pick(PATRONS_CUBE), 1, 1);
      const idx = rng.int(0, 5);
      const reste = net.filter((_, i) => i !== idx);
      if (!connexe(reste)) continue;
      const cols = 7;
      const rows = 5;
      const cand = new Map<string, Cell>();
      for (const [x, y] of reste)
        for (const [dx, dy] of VOISINS) {
          const c: Cell = [x + dx, y + dy];
          if (c[0] < 0 || c[1] < 0 || c[0] >= cols || c[1] >= rows) continue;
          if (reste.some((r) => cellKey(r) === cellKey(c))) continue;
          cand.set(cellKey(c), c);
        }
      const solutions = [...cand.values()].filter((c) => estPatronDeCube([...reste, c]));
      if (level === 'plus_loin' && solutions.length > 2) continue;
      const sorted = [...reste].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      return make(ctx, 'geometry_shape', `completer-${cellsTxt(reste)}`, {
        prompt: 'Il manque un carré pour obtenir un patron de cube. Colorie la case qui convient.',
        task: 'patron',
        shape: 'patron_cube_incomplet',
        answer: cellKey(net[idx]!),
        grid: { cols, rows, cells: sorted },
        explication:
          'Un patron de cube a 6 carrés ; en pliant, chaque carré doit devenir une face différente : le carré ajouté doit fermer la seule face encore ouverte.',
        difficulty: clamp01(0.55 + (solutions.length === 1 ? 0.2 : 0)),
        meta: { solutions: solutions.map(cellKey).sort() },
      });
    }
  }
  // Reconnaître un patron de pavé
  const dims = rng.pick([
    [4, 2, 3],
    [5, 2, 3],
    [4, 3, 2],
    [5, 3, 2],
    [3, 1, 2],
    [4, 1, 2],
    [5, 2, 1],
    [4, 2, 1],
  ] as const);
  const [L, l, h] = dims;
  const ok = rng.chance(0.5);
  const erreur = ok ? 'aucune' : rng.pick(['bande', 'meme_cote', 'couvercle'] as const);
  const haut = rng.pick([0, 2] as const);
  const bas = rng.pick([0, 2] as const);
  const rects = patronPave(L, l, h, haut, bas, erreur);
  const cols = Math.max(...rects.map((r) => r.x + r.w));
  const rows = Math.max(...rects.map((r) => r.y + r.h));
  const cells = cellulesDe(rects);
  return make(ctx, 'geometry_shape', `pave-${L}-${l}-${h}-${haut}-${bas}-${erreur}`, {
    prompt: `Ce patron permet-il de fabriquer un pavé ? (Chaque rectangle est une face ; les longueurs sont en carreaux.)`,
    task: 'patron',
    shape: 'patron_pave',
    choices: ['oui', 'non'],
    answer: ok ? 'oui' : 'non',
    grid: { cols, rows, cells },
    explication: ok
      ? `Les faces vont par paires identiques (${L} × ${l}, ${L} × ${h}, ${l} × ${h}) et les bords qui se touchent ont la même longueur : en pliant, on obtient un pavé.`
      : erreur === 'bande'
        ? 'Dans un pavé, deux faces opposées sont identiques : ici, les faces qui devraient se faire face n’ont pas la même largeur, le pavé ne se ferme pas.'
        : erreur === 'meme_cote'
          ? 'Les deux couvercles sont du même côté : en pliant, ils se superposent et le pavé reste ouvert en dessous.'
          : 'Un couvercle n’a pas la bonne taille : ses bords ne tombent pas sur ceux des faces voisines, le pavé ne se ferme pas.',
    difficulty: level === 'plus_loin' ? 0.75 : 0.6,
    meta: { rectangles: rects, dimensions: { L, l, h } },
  });
};

const solidesQcm: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, {
    facile: rng.pick(['objet', 'objet', 'faces'] as const),
    normal: rng.pick(['objet', 'faces', 'perspective', 'faces'] as const),
    plus_loin: rng.pick(['devinette', 'devinette', 'perspective', 'faces'] as const),
  });
  if (forme === 'objet') {
    const o = rng.pick(auNiveau(level, OBJETS));
    return mcq(ctx, rng, `objet-${o.o}`, {
      question: `${o.img} ${cap(o.o)} a la forme…`,
      good: `d’${article(o.s)} ${o.s}`,
      wrong: NOMS_SOLIDES.filter((n) => n !== o.s && (level !== 'facile' || n !== 'prisme droit')).map(
        (n) => `d’${article(n)} ${n}`,
      ),
      explication: `${cap(o.o)} a la forme d’${article(o.s)} ${o.s}.`,
      difficulty: o.niv === 'facile' ? 0.2 : 0.45,
      image: o.img,
      max: level === 'facile' ? 3 : 4,
    });
  }
  if (forme === 'faces') {
    const s = rng.pick(auNiveau(level, SOLIDES).filter((x) => x.faces !== null || level !== 'facile'));
    return mcq(ctx, rng, `faces-${s.id}`, {
      question: `Comment sont les faces ${s.le.startsWith('la') ? 'de la' : 'du'} ${s.le.replace(/^(le|la) /, '')} ?`,
      good: s.natureFaces,
      wrong: auNiveau(level, SOLIDES).map((x) => x.natureFaces),
      explication: `${cap(s.le)} : ${s.natureFaces}.`,
      difficulty: 0.35 + (s.niv === 'facile' ? 0 : 0.2),
    });
  }
  if (forme === 'perspective') {
    const q = rng.pick([
      {
        q: 'Sur un dessin en perspective d’un cube, comment trace-t-on les arêtes cachées ?',
        g: 'en pointillés',
        w: ['on ne les trace pas du tout', 'en rouge', 'plus épaisses que les autres'],
        e: 'Les arêtes qu’on ne voit pas sont tracées en pointillés pour qu’on devine le solide en entier.',
      },
      {
        q: 'Sur un dessin en perspective d’un cube, combien de faces voit-on au maximum ?',
        g: '3',
        w: ['6', '2', '4'],
        e: 'On voit au plus 3 faces d’un cube à la fois ; les 3 autres sont cachées derrière.',
      },
      {
        q: 'Sur un dessin en perspective, une face carrée d’un cube peut avoir l’air…',
        g: 'd’un losange ou d’un parallélogramme',
        w: ['d’un cercle', 'd’un triangle', 'd’un hexagone'],
        e: 'En perspective, les faces de côté sont « écrasées » : un carré peut ressembler à un losange, mais c’est toujours un carré sur le vrai solide.',
      },
      {
        q: 'Un solide dessiné en perspective a 6 faces qui sont toutes des rectangles. Quel est ce solide ?',
        g: 'un pavé',
        w: ['un cube', 'une pyramide', 'un prisme droit'],
        e: 'Un solide à 6 faces rectangulaires est un pavé (si toutes les faces étaient des carrés, ce serait un cube).',
      },
    ]);
    return mcq(ctx, rng, `persp-${q.q}`, {
      question: q.q,
      good: q.g,
      wrong: q.w,
      explication: q.e,
      difficulty: 0.5,
    });
  }
  // Devinette : quel solide a f faces, a arêtes, s sommets ?
  const s = rng.pick(POLYEDRES);
  return mcq(ctx, rng, `devinette-${s.id}`, {
    question: `Je suis un solide qui a ${s.faces} faces, ${s.aretes} arêtes et ${s.sommets} sommets. Qui suis-je ?`,
    good: s.un,
    wrong: POLYEDRES.filter((x) => x.faces !== s.faces || x.aretes !== s.aretes).map((x) => x.un),
    explication: `${cap(s.un)} a ${s.faces} faces (${s.natureFaces}), ${s.aretes} arêtes et ${s.sommets} sommets.`,
    difficulty: 0.7,
    hints: [`J’ai ${s.sommets} sommets.`, `J’ai ${s.aretes} arêtes.`, `Mes faces : ${s.natureFaces}.`],
  });
};

const solidesClasser: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const cats = rng.shuffle(['cube', 'pavé', 'cylindre', 'boule', 'cône']).slice(0, 3);
    const els = rng
      .shuffle(OBJETS.filter((o) => cats.includes(o.s)))
      .slice(0, 6)
      .map((o) => ({ label: o.o, category: cats.indexOf(o.s), image: o.img }));
    return make(ctx, 'classification', `objets-${els.map((e) => e.label).join('|')}`, {
      prompt: 'Range chaque objet selon sa forme.',
      categories: cats,
      elements: els,
      explication:
        'Regarde les faces : carrées pour le cube, rectangles pour le pavé ; toute ronde pour la boule ; deux disques pour le cylindre ; une pointe et un disque pour le cône.',
      difficulty: 0.25,
    });
  }
  if (level === 'normal') {
    const els = rng
      .shuffle(SOLIDES.filter((s) => s.niv !== 'plus_loin'))
      .slice(0, 6)
      .map((s) => ({ label: s.un, category: s.faces !== null ? 0 : 1 }));
    return make(ctx, 'classification', `poly-${els.map((e) => e.label).join('|')}`, {
      prompt: 'Range ces solides : toutes leurs faces sont-elles planes (des polygones) ?',
      categories: ['que des faces planes (polyèdre)', 'une surface courbe'],
      elements: els,
      explication:
        'Un polyèdre n’a que des faces planes qui sont des polygones (cube, pavé, pyramide, prisme) ; la boule, le cylindre et le cône ont une surface courbe.',
      difficulty: 0.45,
    });
  }
  const cats = ['4 faces', '5 faces', '6 faces', '8 faces'];
  const els = rng
    .shuffle(POLYEDRES)
    .slice(0, 5)
    .map((s) => ({ label: s.un, category: cats.indexOf(`${s.faces} faces`) }));
  return make(ctx, 'classification', `nbfaces-${els.map((e) => e.label).join('|')}`, {
    prompt: 'Range ces solides selon leur nombre de faces.',
    categories: cats,
    elements: els,
    explication:
      'On compte toutes les faces, même celles qu’on ne voit pas : un prisme a 2 bases + autant de rectangles que de côtés de sa base ; une pyramide a 1 base + autant de triangles que de côtés de sa base.',
    difficulty: 0.75,
  });
};

/** Assemblage de cubes vu de dessus : hauteurs des piles, rangée du fond d’abord. */
function texteAssemblage(h: number[][]) {
  const noms =
    h.length === 2
      ? ['rangée du fond', 'rangée de devant']
      : ['rangée du fond', 'rangée du milieu', 'rangée de devant'];
  return h.map((r, i) => `${noms[i]} : ${r.join(', ')}`).join(' ; ');
}

const solidesNumeric: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin' && rng.chance(0.6)) {
    if (rng.chance(0.5)) {
      const rangs = rng.int(2, 3);
      const cols = rng.int(2, 3);
      const h = Array.from({ length: rangs }, () => Array.from({ length: cols }, () => rng.int(0, 3)));
      if (h.flat().every((x) => x === 0)) h[0]![0] = 2;
      const total = h.flat().reduce((a, b) => a + b, 0);
      return numeric(ctx, `assemblage-${JSON.stringify(h)}`, {
        prompt: `Vu de dessus, ce plan donne le nombre de cubes empilés sur chaque case (${texteAssemblage(h)}). Combien de cubes y a-t-il en tout ?`,
        answer: total,
        explication: `On additionne les cubes de toutes les piles : ${h.flat().join(' + ')} = ${total}.`,
        difficulty: 0.6 + total / 60,
        meta: { assemblage: { hauteurs: h } },
      });
    }
    const [a, b, c] = [rng.int(2, 4), rng.int(2, 4), rng.int(2, 3)];
    if (rng.chance(0.5))
      return numeric(ctx, `pave-cubes-${a}-${b}-${c}`, {
        prompt: `On construit un pavé avec des petits cubes : ${a} cubes de long, ${b} cubes de large et ${c} étages. Combien de petits cubes faut-il ?`,
        answer: a * b * c,
        explication: `Un étage contient ${a} × ${b} = ${a * b} cubes ; avec ${c} étages : ${a * b} × ${c} = ${a * b * c} cubes.`,
        difficulty: 0.75,
        meta: { assemblage: { pave: [a, b, c] } },
      });
    const n = rng.int(2, 3);
    const deja = rng.int(1, n ** 3 - 1);
    return numeric(ctx, `cube-complet-${n}-${deja}`, {
      prompt: `On veut construire un grand cube de ${n} petits cubes de côté. On a déjà posé ${deja} petits cubes. Combien faut-il encore en ajouter ?`,
      answer: n ** 3 - deja,
      explication: `Le grand cube contient ${n} × ${n} × ${n} = ${n ** 3} petits cubes ; il en manque ${n ** 3} − ${deja} = ${n ** 3 - deja}.`,
      difficulty: 0.8,
      meta: { assemblage: { cube: n, deja } },
    });
  }
  const s = rng.pick(
    level === 'facile'
      ? POLYEDRES.filter((x) => x.id === 'cube' || x.id === 'pave')
      : auNiveau(level, POLYEDRES),
  );
  const quoi =
    level === 'facile'
      ? rng.pick(['faces', 'sommets'] as const)
      : rng.pick(['faces', 'arêtes', 'sommets'] as const);
  const n = (quoi === 'faces' ? s.faces : quoi === 'arêtes' ? s.aretes : s.sommets)!;
  return numeric(ctx, `compter-${s.id}-${quoi}`, {
    prompt: `Combien ${quoi === 'arêtes' ? 'd’arêtes' : `de ${quoi}`} a ${s.un} ?`,
    answer: n,
    explication: `${cap(s.le)} a ${s.faces} faces (${s.natureFaces}), ${s.aretes} arêtes et ${s.sommets} sommets.`,
    difficulty: 0.25 + (s.niv === 'facile' ? 0 : 0.25) + (quoi === 'arêtes' ? 0.2 : 0),
  });
};

const VF_SOLIDES: { s: string; v: boolean; e: string; niv: Level }[] = [
  {
    s: 'Un cube a 6 faces carrées.',
    v: true,
    e: 'Le cube a 6 faces, et ce sont toutes des carrés.',
    niv: 'facile',
  },
  { s: 'Un pavé a 8 faces.', v: false, e: 'Un pavé a 6 faces (des rectangles) et 8 sommets.', niv: 'facile' },
  {
    s: 'Une boule peut rouler.',
    v: true,
    e: 'La boule n’a qu’une surface courbe : elle roule dans tous les sens.',
    niv: 'facile',
  },
  {
    s: 'Un cube a des faces triangulaires.',
    v: false,
    e: 'Toutes les faces d’un cube sont des carrés.',
    niv: 'facile',
  },
  {
    s: 'Un cylindre a 2 faces en forme de disque.',
    v: true,
    e: 'Le cylindre a 2 disques et une surface courbe.',
    niv: 'facile',
  },
  { s: 'Un cône a 2 disques.', v: false, e: 'Le cône a un seul disque et une pointe.', niv: 'facile' },
  {
    s: 'Un prisme droit à base triangulaire a 2 faces triangulaires et 3 faces rectangulaires.',
    v: true,
    e: 'Ses 2 bases sont des triangles, ses 3 autres faces des rectangles.',
    niv: 'normal',
  },
  {
    s: 'Une pyramide à base carrée a 5 sommets.',
    v: true,
    e: '4 sommets autour de la base + 1 sommet en haut = 5 sommets.',
    niv: 'normal',
  },
  {
    s: 'Un pavé a 12 arêtes.',
    v: true,
    e: 'Le pavé a 12 arêtes : 4 en haut, 4 en bas et 4 sur les côtés.',
    niv: 'normal',
  },
  {
    s: 'Un prisme droit à base triangulaire a 6 faces.',
    v: false,
    e: 'Il a 5 faces : 2 triangles et 3 rectangles.',
    niv: 'normal',
  },
  {
    s: 'Sur un dessin en perspective, les arêtes cachées sont tracées en pointillés.',
    v: true,
    e: 'Les pointillés montrent les arêtes qu’on ne voit pas.',
    niv: 'normal',
  },
  {
    s: 'Un cube est un pavé particulier.',
    v: true,
    e: 'Le cube est un pavé dont toutes les faces sont des carrés.',
    niv: 'normal',
  },
  {
    s: 'Tout assemblage de 6 carrés est un patron de cube.',
    v: false,
    e: 'Il faut que les 6 carrés, une fois pliés, forment chacun une face différente : seuls 11 assemblages marchent.',
    niv: 'normal',
  },
  {
    s: 'Une pyramide à base carrée a 8 arêtes.',
    v: true,
    e: '4 arêtes autour de la base + 4 arêtes qui montent vers le sommet = 8.',
    niv: 'normal',
  },
  {
    s: 'Un prisme droit à base hexagonale a 8 faces.',
    v: true,
    e: '2 hexagones + 6 rectangles = 8 faces.',
    niv: 'plus_loin',
  },
  {
    s: 'Une pyramide à base triangulaire a 4 sommets.',
    v: true,
    e: '3 sommets à la base + 1 en haut = 4 sommets.',
    niv: 'plus_loin',
  },
  {
    s: 'Une pyramide à base triangulaire a 5 faces.',
    v: false,
    e: 'Elle a 4 faces, toutes triangulaires.',
    niv: 'plus_loin',
  },
  {
    s: 'Un prisme droit à base hexagonale a 12 arêtes.',
    v: false,
    e: 'Il a 18 arêtes : 6 sur chaque hexagone et 6 entre les deux bases.',
    niv: 'plus_loin',
  },
];

const solidesVraiFaux: ItemGen = (level, rng, ctx) => {
  const v = rng.chance(0.5);
  const pool = auNiveau(level, VF_SOLIDES).filter((x) => x.v === v);
  const q = rng.pick(pool);
  return vraiFaux(ctx, `vf-${q.s}`, {
    statement: q.s,
    answer: q.v,
    explication: q.e,
    difficulty: q.niv === 'facile' ? 0.25 : q.niv === 'normal' ? 0.5 : 0.7,
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.GEO.DEPLACEMENTS                                             */
/* ------------------------------------------------------------------ */

type Dir = 0 | 1 | 2 | 3; // 0 haut, 1 droite, 2 bas, 3 gauche
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const FLECHES = ['↑', '→', '↓', '←'];
const NOM_DIR = ['haut', 'droite', 'bas', 'gauche'];
const VERS_DIR = ['vers le haut', 'vers la droite', 'vers le bas', 'vers la gauche'];
const CODES_RELATIFS = { A: 'avancer d’une case', D: 'quart de tour à droite', G: 'quart de tour à gauche' };
const CODES_ABSOLUS = { '↑': 'haut', '→': 'droite', '↓': 'bas', '←': 'gauche' };

/** « colonne 3, ligne 2 » (numérotées à partir de 1, colonnes de gauche à droite, lignes de haut en bas). */
export const nomCase = ([x, y]: Cell) => `colonne ${x + 1}, ligne ${y + 1}`;

/** Déplie « répéter 3 fois [ A D ] » en « A D A D A D ». */
export function deplier(prog: string): string[] {
  return prog
    .replace(/répéter (\d+) fois \[ ([^\]]+) \]/g, (_, k: string, motif: string) =>
      Array.from({ length: Number(k) }, () => motif).join(' '),
    )
    .split(' ')
    .filter(Boolean);
}

/** Exécute un programme : renvoie la case d’arrivée et toutes les cases visitées. */
function executer(dep: Cell, dir0: Dir, prog: string[]): { fin: Cell; chemin: Cell[]; dir: Dir } {
  let [x, y] = dep;
  let d = dir0;
  const chemin: Cell[] = [[x, y]];
  for (const p of prog) {
    if (p === 'D') d = ((d + 1) % 4) as Dir;
    else if (p === 'G') d = ((d + 3) % 4) as Dir;
    else {
      const k = p === 'A' ? d : FLECHES.indexOf(p);
      x += DX[k]!;
      y += DY[k]!;
      chemin.push([x, y]);
    }
  }
  return { fin: [x, y], chemin, dir: d };
}

/** Plus court programme : absolu (flèches) ou relatif (A, D, G). */
function plusCourt(
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

/** Motifs d’escaliers pour les boucles (le robot regarde vers la droite au départ). */
const MOTIFS: { motif: string[]; nom: string }[] = [
  { motif: ['A', 'G', 'A', 'D'], nom: 'monte une marche' },
  { motif: ['A', 'D', 'A', 'G'], nom: 'descend une marche' },
  { motif: ['A', 'A', 'G', 'A', 'D'], nom: 'monte une grande marche' },
  { motif: ['A', 'A', 'D', 'A', 'G'], nom: 'descend une grande marche' },
];

type ProgBoucle = { texte: string; deplie: string[]; fois: number; motif: string[]; nom: string };

function programmeBoucle(rng: Rng): ProgBoucle {
  const m = rng.pick(MOTIFS);
  const fois = rng.int(3, 4);
  return {
    texte: `répéter ${fois} fois [ ${m.motif.join(' ')} ]`,
    deplie: Array.from({ length: fois }, () => m.motif).flat(),
    fois,
    motif: m.motif,
    nom: m.nom,
  };
}

const dansGrille = (c: Cell, cols: number, rows: number) =>
  c[0] >= 0 && c[1] >= 0 && c[0] < cols && c[1] < rows;

const robotShape: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin' && rng.chance(0.6)) {
    // Boucles : le chemin est un escalier ; le programme attendu utilise « répéter … fois [ … ] ».
    for (let essai = 0; essai < 100; essai++) {
      const b = programmeBoucle(rng);
      const cols = 10;
      const rows = 8;
      const dep: Cell = [rng.int(0, 2), rng.int(0, rows - 1)];
      const { fin, chemin } = executer(dep, 1, b.deplie);
      if (!chemin.every((c) => dansGrille(c, cols, rows))) continue;
      const surChemin = new Set(chemin.map(cellKey));
      const obstacles: Cell[] = [];
      let garde = 0;
      while (obstacles.length < 5 && garde++ < 100) {
        const o: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
        if (!surChemin.has(cellKey(o)) && !obstacles.some((c) => cellKey(c) === cellKey(o)))
          obstacles.push(o);
      }
      return make(ctx, 'geometry_shape', `boucle-${cellKey(dep)}-${b.texte}-${cellsTxt(obstacles)}`, {
        prompt:
          'Le robot regarde vers la droite. Écris un programme court pour qu’il atteigne le trésor en suivant l’escalier, avec « répéter … fois [ … ] ». A = avancer d’une case, D = quart de tour à droite, G = quart de tour à gauche.',
        task: 'tracer',
        shape: 'robot',
        answer: b.texte,
        explication: `Le motif ${b.motif.join(' ')} ${b.nom} ; il y a ${b.fois} marches, donc on le répète ${b.fois} fois : ${b.texte} (au lieu de ${b.deplie.length} instructions).`,
        difficulty: 0.8,
        meta: {
          robot: { cols, rows, depart: dep, cible: fin, obstacles, relatif: true, orientation: 'droite' },
          boucles: { fois: b.fois, motif: b.motif },
          programmeDeplie: b.deplie.join(' '),
          codes: {
            ...CODES_RELATIFS,
            'répéter n fois [ … ]': 'refaire n fois les instructions entre crochets',
          },
        },
      });
    }
  }
  const relatif = level !== 'facile';
  const [cols, rows] = parNiv(level, { facile: [6, 6], normal: [7, 7], plus_loin: [8, 7] });
  const nbObst = parNiv(level, { facile: rng.int(1, 3), normal: rng.int(4, 7), plus_loin: rng.int(7, 10) });
  for (let essai = 0; essai < 300; essai++) {
    const dep: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
    const cible: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
    const dist = Math.abs(dep[0] - cible[0]) + Math.abs(dep[1] - cible[1]);
    if (dist < parNiv(level, { facile: 3, normal: 4, plus_loin: 6 })) continue;
    const obstacles: Cell[] = [];
    while (obstacles.length < nbObst) {
      const o: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
      const k = cellKey(o);
      if (k === cellKey(dep) || k === cellKey(cible) || obstacles.some((c) => cellKey(c) === k)) continue;
      obstacles.push(o);
    }
    const dir0 = (relatif ? rng.int(0, 3) : 0) as Dir;
    const prog = plusCourt(cols, rows, new Set(obstacles.map(cellKey)), dep, cible, relatif, dir0);
    if (!prog) continue;
    if (level === 'normal' && (prog.length < 8 || prog.length > 20)) continue;
    if (level === 'plus_loin' && (prog.length < 12 || prog.length > 25)) continue;
    if (level === 'facile' && prog.length > 8) continue;
    return make(
      ctx,
      'geometry_shape',
      `robot-${cellKey(dep)}-${cellKey(cible)}-${dir0}-${cellsTxt(obstacles)}`,
      {
        prompt: relatif
          ? `Programme le robot (il regarde ${VERS_DIR[dir0]}) pour qu’il atteigne le trésor sans toucher les rochers. A = avancer d’une case, D = quart de tour à droite, G = quart de tour à gauche.`
          : 'Programme le robot avec les flèches pour qu’il atteigne le trésor sans toucher les rochers.',
        task: 'tracer',
        shape: 'robot',
        answer: prog.join(' '),
        explication: relatif
          ? `Un programme possible (${prog.length} instructions) : ${prog.join(' ')}. Un quart de tour ne fait pas changer de case : il change seulement la direction du robot.`
          : `Un chemin possible : ${prog.join(' ')} (${prog.length} cases).`,
        difficulty: clamp01(0.15 + prog.length * 0.03 + (relatif ? 0.2 : 0)),
        meta: {
          robot: { cols, rows, depart: dep, cible, obstacles, relatif, orientation: NOM_DIR[dir0] },
          codes: relatif ? CODES_RELATIFS : CODES_ABSOLUS,
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
      codes: CODES_ABSOLUS,
    },
  });
};

/** Programme aléatoire qui reste dans la grille (pour « où arrive le robot ? »). */
type Trajet = {
  texte: string;
  deplie: string[];
  dep: Cell;
  dir0: Dir;
  fin: Cell;
  cols: number;
  rows: number;
};

function trajet(level: Level, rng: Rng): Trajet {
  const cols = 6;
  const rows = 6;
  for (let essai = 0; essai < 500; essai++) {
    const dep: Cell = [rng.int(0, cols - 1), rng.int(0, rows - 1)];
    if (level === 'plus_loin') {
      const m = rng.pick(MOTIFS.slice(0, 2));
      const fois = rng.int(2, 3);
      const extra = rng.pick([[], ['A'], ['D', 'A'], ['G', 'A']]);
      const deplie = [...Array.from({ length: fois }, () => m.motif).flat(), ...extra];
      const texte = [`répéter ${fois} fois [ ${m.motif.join(' ')} ]`, ...extra].join(' ');
      const r = executer(dep, 1, deplie);
      if (!r.chemin.every((c) => dansGrille(c, cols, rows))) continue;
      return { texte, deplie, dep, dir0: 1, fin: r.fin, cols, rows };
    }
    const relatif = level === 'normal';
    const n = relatif ? rng.int(5, 8) : rng.int(3, 5);
    const prog: string[] = [];
    for (let i = 0; i < n; i++) {
      if (relatif) {
        const derniere = prog[prog.length - 1];
        prog.push(derniere === 'D' || derniere === 'G' || i === 0 ? 'A' : rng.pick(['A', 'A', 'D', 'G']));
      } else {
        // Pas de demi-tour immédiat (↑ puis ↓) : ce serait un aller-retour inutile.
        const derniere = prog[prog.length - 1];
        const oppose = derniere ? FLECHES[(FLECHES.indexOf(derniere) + 2) % 4] : undefined;
        prog.push(rng.pick(FLECHES.filter((f) => f !== oppose)));
      }
    }
    if (relatif && prog.filter((p) => p !== 'A').length === 0) continue;
    const dir0 = (relatif ? rng.int(0, 3) : 0) as Dir;
    const r = executer(dep, dir0, prog);
    if (!r.chemin.every((c) => dansGrille(c, cols, rows))) continue;
    if (cellKey(r.fin) === cellKey(dep)) continue;
    return { texte: prog.join(' '), deplie: prog, dep, dir0, fin: r.fin, cols, rows };
  }
  return { texte: '→ → ↓', deplie: ['→', '→', '↓'], dep: [0, 0], dir0: 0, fin: [2, 1], cols, rows };
}

/** Arrivées fausses plausibles : D et G inversés, flèches inversées, dernière instruction oubliée… */
function arriveesFausses(t: Trajet): Cell[] {
  const inv: Record<string, string> = { D: 'G', G: 'D', '↑': '↓', '↓': '↑', '→': '←', '←': '→' };
  const essais = [
    t.deplie.map((p) => (p === 'D' || p === 'G' ? inv[p]! : p)),
    t.deplie.map((p) => (FLECHES.includes(p) && (p === '↑' || p === '↓') ? inv[p]! : p)),
    t.deplie.map((p) => (FLECHES.includes(p) && (p === '←' || p === '→') ? inv[p]! : p)),
    t.deplie.slice(0, -1),
    t.deplie.filter((p) => p !== 'D' && p !== 'G'),
    [...t.deplie, t.deplie.includes('A') ? 'A' : '→'],
  ];
  return essais
    .map((p) => executer(t.dep, t.dir0, p).fin)
    .filter((c) => cellKey(c) !== cellKey(t.fin) && dansGrille(c, t.cols, t.rows));
}

const intro = (t: Trajet) =>
  t.deplie.some((p) => p === 'A')
    ? `Le robot est sur la case ${nomCase(t.dep)} et regarde ${VERS_DIR[t.dir0]}.`
    : `Le robot est sur la case ${nomCase(t.dep)}.`;

const legende = (t: Trajet) =>
  t.deplie.some((p) => p === 'A')
    ? ' (A = avancer d’une case, D = quart de tour à droite, G = quart de tour à gauche ; les lignes sont numérotées de haut en bas.)'
    : ' (Les lignes sont numérotées de haut en bas, les colonnes de gauche à droite.)';

const robotQcm: ItemGen = (level, rng, ctx) => {
  if (rng.chance(0.25)) {
    // Vocabulaire : orientation après des quarts de tour
    const d0 = rng.int(0, 3) as Dir;
    const tours = parNiv(level, {
      facile: [rng.pick(['D', 'G'])],
      normal: rng.shuffle(['D', 'G', rng.pick(['D', 'G'])]).slice(0, 2),
      plus_loin: [rng.pick(['D', 'G']), rng.pick(['D', 'G']), rng.pick(['D', 'G'])],
    });
    const fin = tours.reduce((d, t) => (t === 'D' ? (d + 1) % 4 : (d + 3) % 4), d0 as number);
    const dits = tours.map((t) => (t === 'D' ? 'un quart de tour à droite' : 'un quart de tour à gauche'));
    return mcq(ctx, rng, `orient-${d0}-${tours.join('')}`, {
      question: `Le robot regarde ${VERS_DIR[d0]}. Il fait ${dits.join(', puis ')}. Vers où regarde-t-il maintenant ?`,
      good: VERS_DIR[fin]!,
      wrong: VERS_DIR.filter((_, i) => i !== fin),
      explication: `Un quart de tour à droite fait tourner comme les aiguilles d’une montre (haut → droite → bas → gauche) ; à gauche, dans l’autre sens. Ici, le robot finit par regarder ${VERS_DIR[fin]}.`,
      difficulty: 0.2 + tours.length * 0.15,
    });
  }
  const t = trajet(level, rng);
  const faux = arriveesFausses(t).map(nomCase);
  return mcq(ctx, rng, `arrivee-${cellKey(t.dep)}-${t.dir0}-${t.texte}`, {
    question: `${intro(t)} Il exécute : ${t.texte}. Sur quelle case arrive-t-il ?${legende(t)}`,
    good: nomCase(t.fin),
    wrong: [
      ...faux,
      nomCase([t.fin[0] + 1, t.fin[1]]),
      nomCase([t.fin[1], t.fin[0]]),
      nomCase([Math.max(0, t.fin[0] - 1), t.fin[1] + 1]),
    ],
    explication: `On suit le programme pas à pas en déplaçant le robot case par case : il arrive sur la case ${nomCase(t.fin)}.`,
    difficulty: 0.3 + t.deplie.length * 0.04 + (level === 'plus_loin' ? 0.2 : 0),
    meta: {
      robot: { cols: t.cols, rows: t.rows, depart: t.dep, orientation: NOM_DIR[t.dir0] },
      programme: t.texte,
    },
  });
};

const robotVraiFaux: ItemGen = (level, rng, ctx) => {
  const t = trajet(level, rng);
  const juste = rng.chance(0.5);
  const fausses = arriveesFausses(t);
  const montre = juste || !fausses.length ? t.fin : rng.pick(fausses);
  return vraiFaux(ctx, `vf-${cellKey(t.dep)}-${t.dir0}-${t.texte}-${cellKey(montre)}`, {
    statement: `${intro(t)} Il exécute : ${t.texte}. Il arrive sur la case ${nomCase(montre)}.${legende(t)}`,
    answer: cellKey(montre) === cellKey(t.fin),
    explication: `En suivant le programme pas à pas, le robot arrive sur la case ${nomCase(t.fin)}.`,
    difficulty: 0.35 + t.deplie.length * 0.03,
    meta: {
      robot: { cols: t.cols, rows: t.rows, depart: t.dep, orientation: NOM_DIR[t.dir0] },
      programme: t.texte,
    },
  });
};

const robotNumeric: ItemGen = (level, rng, ctx) => {
  const t = trajet(level, rng);
  const pas = t.deplie.filter((p) => p !== 'D' && p !== 'G').length;
  return numeric(ctx, `pas-${t.dir0}-${t.texte}`, {
    prompt: `Le robot exécute le programme : ${t.texte}. De combien de cases avance-t-il en tout ?${
      t.deplie.some((p) => p === 'A') ? ' (A = avancer d’une case, D et G = quarts de tour.)' : ''
    }`,
    spoken: `Le robot exécute le programme : ${t.deplie
      .map((p) =>
        p === 'A'
          ? 'avance'
          : p === 'D'
            ? 'quart de tour à droite'
            : p === 'G'
              ? 'quart de tour à gauche'
              : `${CODES_ABSOLUS[p as keyof typeof CODES_ABSOLUS]}`,
      )
      .join(', ')}. De combien de cases avance-t-il en tout ?`,
    answer: pas,
    explication: t.texte.includes('répéter')
      ? `On déplie la boucle : ${t.deplie.join(' ')}. Seuls les A font avancer : ${pas} cases (les quarts de tour ne déplacent pas le robot).`
      : t.deplie.some((p) => p === 'A')
        ? `Seuls les A font avancer le robot : il y en a ${pas}. Les quarts de tour ne le déplacent pas.`
        : `Chaque flèche fait avancer le robot d’une case : ${pas} flèches, donc ${pas} cases.`,
    difficulty: 0.2 + (level === 'normal' ? 0.2 : level === 'plus_loin' ? 0.45 : 0),
    meta: { programme: t.texte },
  });
};

export const GEOMETRIE_ESPACE: Record<string, LessonContent> = {
  'CM2.MA.GEO.SOLIDES': {
    gens: {
      geometry_shape: solidesShape,
      mcq: solidesQcm,
      classification: solidesClasser,
      numeric_answer: solidesNumeric,
      true_false: solidesVraiFaux,
    },
  },
  'CM2.MA.GEO.DEPLACEMENTS': {
    gens: {
      geometry_shape: robotShape,
      mcq: robotQcm,
      true_false: robotVraiFaux,
      numeric_answer: robotNumeric,
    },
  },
};
