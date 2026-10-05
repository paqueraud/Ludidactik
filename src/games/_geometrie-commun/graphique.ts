/**
 * Station météo : lecture de `meta.graphique` (barres, tableau, courbe, circulaire), échelles des axes,
 * et formes particulières (tableau à double entrée, enquête à dépouiller, barre à construire).
 */
import type { Item } from '@/content/schemas';

export type TypeGraphique = 'barres' | 'tableau' | 'courbe' | 'circulaire';

export interface Graphique {
  type: TypeGraphique;
  titre: string;
  etiquettes: string[];
  valeurs: number[];
  unite: string;
}

export interface TableauDouble {
  lignes: string[];
  colonnes: string[];
  valeurs: number[][];
}

export type PlanDonnees = {
  question: string;
  graphique: Graphique | null;
  /** Tableau juste (le diagramme montré contient une erreur à trouver). */
  tableauJuste: number[] | null;
  tableauDouble: TableauDouble | null;
  /** Réponses brutes d'une enquête (emojis) et catégorie dont il faut construire la barre. */
  enquete: { reponses: string[]; cible: string } | null;
  /** Construire la barre d'une catégorie avec une échelle (1 carreau = `echelle` unités). */
  construire: { etiquette: string; echelle: number } | null;
};

const TYPES: TypeGraphique[] = ['barres', 'tableau', 'courbe', 'circulaire'];
const nombres = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length > 0 && v.every((n) => typeof n === 'number' && Number.isFinite(n));
const textes = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string');

export function lireGraphique(meta: Record<string, unknown> | undefined): Graphique | null {
  const g = meta?.graphique as Record<string, unknown> | undefined;
  if (!g || typeof g !== 'object') return null;
  const { type, titre, etiquettes, valeurs, unite } = g;
  if (typeof type !== 'string' || !(TYPES as string[]).includes(type)) return null;
  if (!textes(etiquettes) || !nombres(valeurs) || etiquettes.length !== valeurs.length) return null;
  if (etiquettes.length > 12) return null;
  if (type === 'circulaire' && valeurs.some((v) => v < 0)) return null;
  return {
    type: type as TypeGraphique,
    titre: typeof titre === 'string' ? titre : '',
    etiquettes,
    valeurs,
    unite: typeof unite === 'string' ? unite : '',
  };
}

function lireDouble(meta: Record<string, unknown> | undefined): TableauDouble | null {
  const t = meta?.tableauDouble as Record<string, unknown> | undefined;
  if (!t || !textes(t.lignes) || !textes(t.colonnes) || !Array.isArray(t.valeurs)) return null;
  const v = t.valeurs as unknown[];
  if (
    v.length !== t.lignes.length ||
    !v.every((l) => nombres(l) && l.length === (t.colonnes as string[]).length)
  )
    return null;
  return { lignes: t.lignes, colonnes: t.colonnes, valeurs: v as number[][] };
}

/** Question seule (les énoncés reprennent les données en clair pour les jeux sans graphique). */
function questionDe(it: Item): string {
  const q = it.meta?.question;
  if (typeof q === 'string' && q.trim()) return q;
  const texte =
    it.kind === 'mcq'
      ? it.question
      : it.kind === 'true_false'
        ? it.statement
        : it.kind === 'numeric_answer' || it.kind === 'classification'
          ? it.prompt
          : '';
  return texte.split('\n').at(-1) ?? texte;
}

export function lireDonnees(it: Item): PlanDonnees | null {
  if (!['mcq', 'numeric_answer', 'true_false', 'classification'].includes(it.kind)) return null;
  const meta = it.meta;
  const graphique = lireGraphique(meta);
  const tableauDouble = lireDouble(meta);
  let enquete: PlanDonnees['enquete'] = null;
  if (textes(meta?.enquete) && typeof meta?.aConstruire === 'string' && it.kind === 'numeric_answer')
    enquete = { reponses: meta.enquete, cible: meta.aConstruire };
  let construire: PlanDonnees['construire'] = null;
  if (graphique && typeof meta?.echelle === 'number' && meta.echelle > 0 && it.kind === 'numeric_answer') {
    const q = questionDe(it);
    const etiquette = graphique.etiquettes.find((e) => q.includes(`« ${e} »`));
    if (etiquette) construire = { etiquette, echelle: meta.echelle };
  }
  if (!graphique && !tableauDouble && !enquete) return null;
  if (it.kind === 'mcq' && it.choices.length < 2) return null;
  const tj = meta?.tableauJuste;
  return {
    question: questionDe(it),
    graphique,
    tableauJuste: graphique && nombres(tj) && tj.length === graphique.valeurs.length ? tj : null,
    tableauDouble,
    enquete,
    construire,
  };
}

export const estDonnees = (it: Item) => lireDonnees(it) !== null;

/* ------------------------------------------------------------------ */
/* Échelles                                                            */
/* ------------------------------------------------------------------ */

export interface Echelle {
  min: number;
  max: number;
  /** Graduations étiquetées. */
  pas: number;
  /** Petites graduations (lignes du quadrillage). */
  sousPas: number;
}

const PAS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/** Échelle « ronde » : au plus ~8 graduations étiquetées ; quadrillage de 1 en 1 tant que c'est lisible. */
export function echelle(valeurs: number[], depuisZero = true): Echelle {
  const vmax = Math.max(...valeurs, 0);
  const vmin = Math.min(...valeurs);
  const zero = depuisZero || vmin <= 0;
  const etendue = Math.max(vmax - (zero ? 0 : vmin), 1e-9);
  const pas = PAS.find((p) => etendue / p <= 8) ?? 1000;
  const min = zero ? 0 : Math.max(0, Math.floor(vmin / pas) * pas - pas);
  let max = Math.ceil(vmax / pas - 1e-9) * pas;
  if (max <= min) max = min + pas;
  // Quadrillage de 1 en 1 (lecture exacte, BO CE1) tant qu'il reste lisible.
  const sousPas =
    valeurs.every(Number.isInteger) && max - min <= 40 ? 1 : pas % 5 === 0 || pas < 1 ? pas / 5 : pas / 2;
  return { min, max, pas, sousPas };
}

/** Une valeur se lit-elle exactement sur le quadrillage ? (sinon on l'écrit à côté du point) */
export function lisible(v: number, e: Echelle): boolean {
  const k = (v - e.min) / e.sousPas;
  return Math.abs(k - Math.round(k)) < 1e-6;
}

/** Écriture française d'un nombre (virgule, espace des milliers). */
export function nombreFr(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  const [e, d] = String(Math.abs(r)).split('.');
  const ent = e!.length > 4 ? e!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : e!;
  return `${r < 0 ? '−' : ''}${ent}${d ? `,${d}` : ''}`;
}

/** Angles (en degrés, depuis midi, sens des aiguilles) des parts d'un diagramme circulaire. */
export function parts(valeurs: number[]): { debut: number; fin: number }[] {
  const total = valeurs.reduce((s, v) => s + v, 0) || 1;
  let a = 0;
  return valeurs.map((v) => {
    const debut = a;
    a += (v / total) * 360;
    return { debut, fin: a };
  });
}
