/**
 * Robot codeur : lecture de `meta.robot`, programmes (avec boucles « répéter n fois [ … ] ») et
 * simulation pas à pas. Plusieurs programmes conviennent : on SIMULE celui de l'enfant.
 */
import type { GeometryItem, Item } from '@/content/schemas';
import { type Cell, cle, est, estCase } from './grille';

export type Dir = 0 | 1 | 2 | 3; // 0 haut, 1 droite, 2 bas, 3 gauche
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;
export const FLECHES = ['↑', '→', '↓', '←'] as const;
const NOMS_DIR = ['haut', 'droite', 'bas', 'gauche'];
export const VERS_DIR = ['vers le haut', 'vers la droite', 'vers le bas', 'vers la gauche'];

export type Instr = 'A' | 'G' | 'D' | '↑' | '→' | '↓' | '←';
export const INSTRS: Instr[] = ['A', 'G', 'D', '↑', '→', '↓', '←'];
export type Bloc = { type: 'instr'; i: Instr } | { type: 'boucle'; n: number; corps: Instr[] };

export interface PlanRobot {
  cols: number;
  rows: number;
  depart: Cell;
  cible: Cell;
  obstacles: Cell[];
  relatif: boolean;
  orientation: Dir;
  /** Item qui attend une boucle « répéter » (CM2, pour aller plus loin). */
  boucles: boolean;
  /** Longueur du plus court programme (si connue). */
  longueurMini: number | null;
  /** Programme donné en exemple par le contenu. */
  exemple: string;
}

export function lireRobot(it: Item): PlanRobot | null {
  if (!est(it) || it.shape !== 'robot') return null;
  const r = it.meta?.robot as Record<string, unknown> | undefined;
  if (!r) return null;
  const { cols, rows, depart, cible, obstacles = [], relatif, orientation } = r;
  if (typeof cols !== 'number' || typeof rows !== 'number' || cols < 2 || rows < 2) return null;
  if (cols > 14 || rows > 14) return null;
  if (!estCase(depart) || !estCase(cible) || !Array.isArray(obstacles) || !obstacles.every(estCase))
    return null;
  const dedans = ([x, y]: Cell) => x >= 0 && y >= 0 && x < cols && y < rows;
  if (!dedans(depart) || !dedans(cible) || cle(depart) === cle(cible)) return null;
  const obs = (obstacles as Cell[]).filter(dedans);
  if (obs.some((o) => cle(o) === cle(cible) || cle(o) === cle(depart))) return null;
  const d = typeof orientation === 'string' ? NOMS_DIR.indexOf(orientation) : 0;
  const lm = it.meta?.longueurMini;
  return {
    cols,
    rows,
    depart: [depart[0], depart[1]],
    cible: [cible[0], cible[1]],
    obstacles: obs,
    relatif: relatif === true,
    orientation: (d >= 0 ? d : 0) as Dir,
    boucles: !!it.meta?.boucles,
    longueurMini: typeof lm === 'number' ? lm : null,
    exemple: it.answer,
  };
}

export const estRobot = (it: Item): it is GeometryItem => lireRobot(it) !== null;

/** Déplie les boucles : « répéter 3 fois [ A D ] » → A D A D A D. */
export function deplier(blocs: Bloc[]): Instr[] {
  return blocs.flatMap((b) =>
    b.type === 'instr' ? [b.i] : Array.from({ length: b.n }, () => b.corps).flat(),
  );
}

/** Lit un programme écrit (« → → ↓ », « A D A », « répéter 3 fois [ A G A D ] A »). */
export function lireProgramme(texte: string): Bloc[] {
  const out: Bloc[] = [];
  const re = /répéter\s+(\d+)\s+fois\s*\[([^\]]*)\]|(\S+)/g;
  for (const m of texte.matchAll(re)) {
    if (m[1]) {
      const corps = m[2]!.split(/\s+/).filter((s): s is Instr => (INSTRS as string[]).includes(s));
      if (corps.length) out.push({ type: 'boucle', n: Number(m[1]), corps });
    } else if ((INSTRS as string[]).includes(m[3]!)) out.push({ type: 'instr', i: m[3] as Instr });
  }
  return out;
}

export const ecrireProgramme = (blocs: Bloc[]) =>
  blocs.map((b) => (b.type === 'instr' ? b.i : `répéter ${b.n} fois [ ${b.corps.join(' ')} ]`)).join(' ');

/** Nombre d'instructions écrites (une boucle compte pour 1 + son corps). */
export const tailleProgramme = (blocs: Bloc[]) =>
  blocs.reduce((s, b) => s + (b.type === 'instr' ? 1 : 1 + b.corps.length), 0);

export interface Pas {
  x: number;
  y: number;
  d: Dir;
  /** Instruction qui a mené à cet état (absente pour l'état initial). */
  instr?: Instr;
}

export type Issue = 'cible' | 'obstacle' | 'sortie' | 'pas-arrive' | 'depasse';

export interface Simulation {
  pas: Pas[];
  issue: Issue;
  /** Case que le robot a voulu atteindre quand il a été bloqué. */
  bloqueSur?: Cell;
}

/**
 * Exécute un programme. Le robot s'arrête devant un rocher ou au bord du quadrillage.
 * Réussite : le programme se termine sur la case du trésor.
 */
export function simuler(plan: PlanRobot, prog: Instr[]): Simulation {
  const obst = new Set(plan.obstacles.map(cle));
  let x = plan.depart[0];
  let y = plan.depart[1];
  let d: Dir = plan.orientation;
  const pas: Pas[] = [{ x, y, d }];
  let passeSurCible = false;
  for (const i of prog) {
    if (i === 'D') d = ((d + 1) % 4) as Dir;
    else if (i === 'G') d = ((d + 3) % 4) as Dir;
    else {
      const k = i === 'A' ? d : (FLECHES.indexOf(i) as Dir);
      if (i !== 'A') d = k;
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx < 0 || ny < 0 || nx >= plan.cols || ny >= plan.rows)
        return { pas, issue: 'sortie', bloqueSur: [nx, ny] };
      if (obst.has(`${nx},${ny}`)) return { pas, issue: 'obstacle', bloqueSur: [nx, ny] };
      x = nx;
      y = ny;
      if (x === plan.cible[0] && y === plan.cible[1]) passeSurCible = true;
    }
    pas.push({ x, y, d, instr: i });
  }
  const arrive = x === plan.cible[0] && y === plan.cible[1];
  return { pas, issue: arrive ? 'cible' : passeSurCible ? 'depasse' : 'pas-arrive' };
}

/** Le programme contient-il une boucle ? */
export const aUneBoucle = (blocs: Bloc[]) => blocs.some((b) => b.type === 'boucle');
