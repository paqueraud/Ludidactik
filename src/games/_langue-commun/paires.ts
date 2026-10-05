/**
 * Paires (Dobble des mots, Memory) : constitution d'un réservoir de paires sans ambiguïté,
 * génération des cartes Dobble, préparation et disposition des cartes de Memory. Fonctions pures.
 */
import type { PairingItem } from '@/content/schemas';
import { normalizeText } from '@/engine/answer';
import type { Rng } from '@/engine/rng';

export interface Paire {
  gauche: string;
  droite: string;
  item: PairingItem;
}

const cle = (s: string) => normalizeText(s).toLowerCase();

/**
 * Réservoir de paires : chaque texte n'apparaît qu'une seule fois (à gauche OU à droite), pour qu'il
 * n'y ait jamais deux bonnes réponses possibles.
 */
export function collecterPaires(items: PairingItem[], longueurMax = Infinity): Paire[] {
  const pris = new Set<string>();
  const out: Paire[] = [];
  for (const item of items) {
    for (const p of item.pairs) {
      const g = cle(p.left);
      const d = cle(p.right);
      if (g === d || pris.has(g) || pris.has(d)) continue;
      if (p.left.length > longueurMax || p.right.length > longueurMax) continue;
      pris.add(g);
      pris.add(d);
      out.push({ gauche: p.left, droite: p.right, item });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Dobble                                                              */
/* ------------------------------------------------------------------ */

export interface MancheDobble {
  /** Mots de la carte de gauche et de la carte de droite (dans l'ordre d'affichage). */
  carteA: string[];
  carteB: string[];
  /** La seule paire liée entre les deux cartes. */
  cible: Paire;
  /** Le mot de la paire qui est sur la carte A. */
  motA: string;
  motB: string;
}

/** Nombre de mots par carte possible avec ce réservoir (il faut 2k − 1 paires). */
export const motsParCartePossible = (nbPaires: number, souhaite: number) =>
  Math.max(0, Math.min(souhaite, Math.floor((nbPaires + 1) / 2)));

/**
 * Deux cartes rondes : la carte A porte k mots, la carte B aussi ; UNE seule paire du réservoir relie
 * un mot de A à un mot de B. Les autres mots viennent de paires différentes des deux côtés.
 * `precedente` : on évite de redonner la même paire deux fois de suite. null si le réservoir est trop petit.
 */
export function genererMancheDobble(
  pool: Paire[],
  k: number,
  rng: Rng,
  precedente?: Paire | null,
): MancheDobble | null {
  const n = motsParCartePossible(pool.length, k);
  if (n < 2) return null;
  const candidates = pool.length > 1 && precedente ? pool.filter((p) => p !== precedente) : pool;
  const cible = rng.pick(candidates);
  const autres = rng.shuffle(pool.filter((p) => p !== cible));
  const pourA = autres.slice(0, n - 1);
  const pourB = autres.slice(n - 1, 2 * (n - 1));
  // on mélange les côtés : la carte A peut porter des mots « de gauche » ou « de droite »
  const inverse = rng.chance(0.5);
  const motA = inverse ? cible.droite : cible.gauche;
  const motB = inverse ? cible.gauche : cible.droite;
  // chaque autre paire ne montre qu'un seul de ses deux mots : aucun autre lien possible
  const unMot = (p: Paire) => (rng.chance(0.5) ? p.gauche : p.droite);
  const carteA = rng.shuffle([motA, ...pourA.map(unMot)]);
  const carteB = rng.shuffle([motB, ...pourB.map(unMot)]);
  return { carteA, carteB, cible, motA, motB };
}

/** Le couple de mots choisi est-il la bonne paire ? (dans un sens ou dans l'autre) */
export function estLaPaire(m: MancheDobble, a: string, b: string): boolean {
  return (a === m.motA && b === m.motB) || (a === m.motB && b === m.motA);
}

/**
 * Position des mots sur une carte ronde (coordonnées en % du diamètre, rotation en degrés) :
 * un mot au centre et les autres en couronne, légèrement tournés comme au Dobble.
 */
export function dispositionCarte(n: number, rng: Rng): { x: number; y: number; rot: number; taille: number }[] {
  const out: { x: number; y: number; rot: number; taille: number }[] = [];
  if (n <= 0) return out;
  const centre = n >= 4;
  const couronne = centre ? n - 1 : n;
  const r = n <= 2 ? 22 : n <= 3 ? 25 : 30;
  const depart = rng.next() * Math.PI * 2;
  if (centre) out.push({ x: 50, y: 50, rot: rng.int(-12, 12), taille: 1 });
  for (let i = 0; i < couronne; i++) {
    const a = depart + (i / couronne) * Math.PI * 2;
    out.push({
      x: 50 + Math.cos(a) * r,
      y: 50 + Math.sin(a) * r,
      rot: rng.int(-20, 20),
      taille: 0.85 + rng.next() * 0.3,
    });
  }
  return rng.shuffle(out);
}

/* ------------------------------------------------------------------ */
/* Memory                                                              */
/* ------------------------------------------------------------------ */

export interface CarteMemory {
  id: string;
  texte: string;
  /** Index de la paire dans la grille. */
  paire: number;
  cote: 'gauche' | 'droite';
}

/** Les cartes d'une grille de Memory (2 par paire), mélangées. */
export function preparerMemory(paires: Paire[], rng: Rng): CarteMemory[] {
  const cartes = paires.flatMap((p, i) => [
    { id: `${i}g`, texte: p.gauche, paire: i, cote: 'gauche' as const },
    { id: `${i}d`, texte: p.droite, paire: i, cote: 'droite' as const },
  ]);
  return rng.shuffle(cartes);
}

/**
 * Nombre de colonnes d'une grille de Memory selon le nombre de cartes, la largeur disponible et la
 * longueur des textes (textes longs → cartes plus larges).
 */
export function colonnesMemory(nbCartes: number, largeur: number, texteMax: number): number {
  if (largeur < 640) {
    if (texteMax > 16) return nbCartes <= 6 ? 2 : 3;
    return nbCartes <= 6 ? 3 : 4;
  }
  if (texteMax > 28) return nbCartes <= 8 ? 4 : nbCartes <= 12 ? 4 : 5;
  if (nbCartes <= 8) return 4;
  if (nbCartes === 10) return 5;
  if (nbCartes <= 12) return 4;
  if (nbCartes <= 15) return 5;
  return nbCartes <= 16 ? 4 : 5;
}
