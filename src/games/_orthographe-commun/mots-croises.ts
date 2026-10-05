/**
 * Générateur automatique de grilles de mots croisés à partir de n'importe quelle liste de mots
 * (programme ou liste des parents). Fonction pure, paramétrée par un générateur aléatoire.
 *
 * Principe : on place le mot le plus long au centre, puis chaque mot suivant à l'endroit où il
 * croise le plus de lettres déjà posées, sans jamais coller deux mots parallèles ni prolonger un
 * mot existant. Les croisements se font sur la lettre exacte (accents compris : é ne croise que é),
 * pour que la grille reste juste en orthographe. Plusieurs essais : on garde la meilleure grille.
 */
import { lettres } from './lettres';

export type Direction = 'h' | 'v';

export interface Placement {
  /** Mot tel qu'il est écrit dans la liste. */
  mot: string;
  /** Lettres en minuscules (une case par lettre). */
  cases: string[];
  ligne: number;
  col: number;
  dir: Direction;
  /** Numéro affiché dans la grille (même numéro pour deux mots qui partent de la même case). */
  numero: number;
  /** Rang du mot dans la liste d'entrée. */
  source: number;
}

export interface Grille {
  lignes: number;
  cols: number;
  placements: Placement[];
}

export interface OptionsGrille {
  /** Nombre maximal de mots dans la grille. */
  max: number;
  /** Côté maximal de la grille (en cases). */
  taille?: number;
  /** Nombre d'essais (on garde la meilleure grille). */
  essais?: number;
}

type Cellules = Map<string, { ch: string; dirs: Set<Direction> }>;
const cle = (l: number, c: number) => `${l},${c}`;
const pas = (d: Direction) => (d === 'h' ? [0, 1] : [1, 0]);

interface Pose {
  idx: number;
  cases: string[];
  ligne: number;
  col: number;
  dir: Direction;
}

/** Nombre de croisements si la pose est valide, sinon -1. */
function evaluer(cells: Cellules, cases: string[], l0: number, c0: number, dir: Direction): number {
  const [dl, dc] = pas(dir);
  // Pas de lettre juste avant ni juste après le mot
  if (cells.has(cle(l0 - dl, c0 - dc))) return -1;
  if (cells.has(cle(l0 + dl * cases.length, c0 + dc * cases.length))) return -1;
  let croisements = 0;
  for (let k = 0; k < cases.length; k++) {
    const l = l0 + dl * k;
    const c = c0 + dc * k;
    const cell = cells.get(cle(l, c));
    if (cell) {
      if (cell.ch !== cases[k] || cell.dirs.has(dir)) return -1;
      croisements++;
    } else {
      // Case neuve : ses voisines perpendiculaires doivent être vides (pas de mot collé)
      if (cells.has(cle(l + dc, c + dl)) || cells.has(cle(l - dc, c - dl))) return -1;
    }
  }
  return croisements;
}

function poser(cells: Cellules, p: Pose) {
  const [dl, dc] = pas(p.dir);
  p.cases.forEach((ch, k) => {
    const k2 = cle(p.ligne + dl * k, p.col + dc * k);
    const cell = cells.get(k2);
    if (cell) cell.dirs.add(p.dir);
    else cells.set(k2, { ch, dirs: new Set([p.dir]) });
  });
}

function bornes(poses: Pose[]) {
  let lmin = Infinity;
  let lmax = -Infinity;
  let cmin = Infinity;
  let cmax = -Infinity;
  for (const p of poses) {
    const [dl, dc] = pas(p.dir);
    lmin = Math.min(lmin, p.ligne);
    cmin = Math.min(cmin, p.col);
    lmax = Math.max(lmax, p.ligne + dl * (p.cases.length - 1));
    cmax = Math.max(cmax, p.col + dc * (p.cases.length - 1));
  }
  return { lmin, lmax, cmin, cmax };
}

function unEssai(mots: { idx: number; cases: string[] }[], max: number, taille: number, aleat: () => number) {
  const poses: Pose[] = [];
  const cells: Cellules = new Map();
  const [premier, ...reste] = mots;
  if (!premier) return poses;
  const p0: Pose = { ...premier, ligne: 0, col: 0, dir: aleat() < 0.5 ? 'h' : 'v' };
  poser(cells, p0);
  poses.push(p0);

  let attente = reste;
  // Deux passes : un mot impossible à placer au début peut le devenir plus tard
  for (let passe = 0; passe < 2 && poses.length < max; passe++) {
    const encore: typeof attente = [];
    for (const m of attente) {
      if (poses.length >= max) break;
      let meilleur = null as { pose: Pose; score: number } | null;
      for (const [k2, cell] of cells) {
        const [l, c] = k2.split(',').map(Number) as [number, number];
        for (let i = 0; i < m.cases.length; i++) {
          if (m.cases[i] !== cell.ch) continue;
          for (const dir of ['h', 'v'] as const) {
            if (cell.dirs.has(dir)) continue;
            const [dl, dc] = pas(dir);
            const pose: Pose = { ...m, ligne: l - dl * i, col: c - dc * i, dir };
            const crois = evaluer(cells, m.cases, pose.ligne, pose.col, dir);
            if (crois <= 0) continue;
            const b = bornes([...poses, pose]);
            const h = b.lmax - b.lmin + 1;
            const w = b.cmax - b.cmin + 1;
            if (h > taille || w > taille) continue;
            // Beaucoup de croisements, grille compacte et équilibrée, un peu de hasard
            const score = crois * 12 - (h * w) / 6 - Math.abs(h - w) + aleat() * 2;
            if (!meilleur || score > meilleur.score) meilleur = { pose, score };
          }
        }
      }
      if (meilleur) {
        poser(cells, meilleur.pose);
        poses.push(meilleur.pose);
      } else encore.push(m);
    }
    attente = encore;
  }
  return poses;
}

export function genererGrille(mots: string[], aleat: () => number, opts: OptionsGrille): Grille {
  const taille = opts.taille ?? 13;
  const essais = opts.essais ?? 24;
  const entrees = mots
    .map((mot, idx) => ({ idx, cases: lettres(mot).map((c) => c.toLowerCase()) }))
    .filter((m) => m.cases.length >= 2 && m.cases.length <= taille);
  // Un mot en double ne peut pas figurer deux fois
  const uniques = [...new Map(entrees.map((m) => [m.cases.join(''), m])).values()];

  let meilleur: Pose[] = [];
  let aire = Infinity;
  for (let e = 0; e < essais; e++) {
    // Les plus longs d'abord (ils offrent plus de croisements), ordre légèrement mélangé
    const ordre = uniques
      .map((m) => ({ m, k: m.cases.length + aleat() * 3 }))
      .sort((a, b) => b.k - a.k)
      .map((x) => x.m);
    const poses = unEssai(ordre, opts.max, taille, aleat);
    const b = bornes(poses);
    const a = poses.length ? (b.lmax - b.lmin + 1) * (b.cmax - b.cmin + 1) : Infinity;
    if (poses.length > meilleur.length || (poses.length === meilleur.length && a < aire)) {
      meilleur = poses;
      aire = a;
    }
    if (meilleur.length >= Math.min(opts.max, uniques.length) && e >= 6) break;
  }

  if (!meilleur.length) return { lignes: 0, cols: 0, placements: [] };
  const b = bornes(meilleur);
  // Numérotation : de haut en bas, de gauche à droite
  const normalises = meilleur.map((p) => ({ ...p, ligne: p.ligne - b.lmin, col: p.col - b.cmin }));
  const departs = [...new Set(normalises.map((p) => cle(p.ligne, p.col)))]
    .map((k) => k.split(',').map(Number) as [number, number])
    .sort((x, y) => x[0] - y[0] || x[1] - y[1])
    .map(([l, c]) => cle(l, c));
  const placements: Placement[] = normalises
    .map((p) => ({
      mot: mots[p.idx]!,
      cases: p.cases,
      ligne: p.ligne,
      col: p.col,
      dir: p.dir,
      numero: departs.indexOf(cle(p.ligne, p.col)) + 1,
      source: p.idx,
    }))
    .sort((x, y) => x.numero - y.numero || (x.dir === 'h' ? -1 : 1));
  return { lignes: b.lmax - b.lmin + 1, cols: b.cmax - b.cmin + 1, placements };
}

/** Grille de lettres attendues (null = case noire). */
export function grilleDeLettres(g: Grille): (string | null)[][] {
  const out: (string | null)[][] = Array.from({ length: g.lignes }, () =>
    Array.from({ length: g.cols }, () => null as string | null),
  );
  for (const p of g.placements) {
    const [dl, dc] = pas(p.dir);
    p.cases.forEach((ch, k) => {
      out[p.ligne + dl * k]![p.col + dc * k] = ch;
    });
  }
  return out;
}

/** Cases (ligne, col) d'un mot placé. */
export function casesDe(p: Placement): [number, number][] {
  const [dl, dc] = pas(p.dir);
  return p.cases.map((_, k) => [p.ligne + dl * k, p.col + dc * k]);
}
