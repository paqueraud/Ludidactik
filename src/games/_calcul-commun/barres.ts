/**
 * Schémas en barre (Le Détective des problèmes). Fonctions pures.
 * Conventions du contenu (`bar_model`) :
 * - parties-tout / transformation : une barre, segments = parties, `total` = accolade (null = inconnue) ;
 * - comparaison : barre 0 = la plus longue, barre 1 = la plus courte + segment « écart » ;
 * - multiplicatif / partage : parts égales (un segment « … » quand il y en a trop).
 */
import type { BarModelItem } from '@/content/schemas';
import { formatNumber, parseNumber } from '@/engine/answer';

export interface Emplacement {
  id: string;
  /** Barre et segment ; `segment = -1` pour l'accolade du total. */
  barre: number;
  segment: number;
  /** Étiquette attendue : un nombre écrit (« 28 ») ou « ? ». */
  attendu: string;
}

export interface Analyse {
  emplacements: Emplacement[];
  /** Le total (accolade) est-il dessiné ? */
  accolade: boolean;
  /** Valeur affichée pour l'accolade : nombre, « ? » ou null. */
  totalTexte: string | null;
  /** Barre à laquelle se rapporte l'accolade (la plus longue). */
  barreTotal: number;
  /** Valeurs (largeurs) des segments pour le dessin. */
  largeurs: number[][];
}

const POINTS = /^(…|\.\.\.)$/;
export const estPoints = (label?: string) => !!label && POINTS.test(label.trim());
/** Segment « écart / de plus / de moins » (dessiné en pointillés). */
export const estEcart = (label?: string) =>
  !!label && /écart|de plus|de moins|en plus|en moins|de trop/i.test(label);

/** Analyse du schéma : où sont les nombres connus, où est l'inconnue (« ? »). */
export function analyser(item: BarModelItem): Analyse {
  const emplacements: Emplacement[] = [];
  let aInconnueSegment = false;
  // valeur moyenne des segments connus (pour dessiner les inconnus)
  const connus = item.bars.flatMap((b) =>
    b.segments.map((s) => s.value).filter((v): v is number => v !== null),
  );
  const nbInconnus = item.bars
    .flatMap((b) => b.segments)
    .filter((s) => s.value === null && !estPoints(s.label)).length;
  const sommeConnus = connus.reduce((a, b) => a + b, 0);
  const typique = connus.length ? sommeConnus / connus.length : item.answer || 1;
  const largeurs = item.bars.map((b) =>
    b.segments.map((s) => {
      if (s.value !== null) return Math.max(s.value, typique * 0.25);
      if (estPoints(s.label)) return typique * 0.6;
      // inconnue : la réponse si c'est elle, sinon ce qui complète le total
      if (typeof item.total === 'number' && nbInconnus === 1 && b.segments.length > 1) {
        const autres = b.segments.reduce((a, x) => a + (x.value ?? 0), 0);
        const reste = item.total - autres;
        if (reste > 0) return reste;
      }
      return item.answer > 0 && nbInconnus === 1 ? item.answer : typique;
    }),
  );
  item.bars.forEach((b, i) =>
    b.segments.forEach((s, j) => {
      if (estPoints(s.label)) return;
      if (s.value === null) {
        aInconnueSegment = true;
        emplacements.push({ id: `b${i}s${j}`, barre: i, segment: j, attendu: '?' });
      } else emplacements.push({ id: `b${i}s${j}`, barre: i, segment: j, attendu: formatNumber(s.value) });
    }),
  );
  const longueurs = largeurs.map((l) => l.reduce((a, b) => a + b, 0));
  const barreTotal = longueurs.indexOf(Math.max(...longueurs));
  let accolade = false;
  let totalTexte: string | null = null;
  if (typeof item.total === 'number') {
    accolade = true;
    totalTexte = formatNumber(item.total);
    emplacements.push({ id: 'total', barre: barreTotal, segment: -1, attendu: totalTexte });
  } else if (item.total === null && !aInconnueSegment) {
    accolade = true;
    totalTexte = '?';
    emplacements.push({ id: 'total', barre: barreTotal, segment: -1, attendu: '?' });
  }
  return { emplacements, accolade, totalTexte, barreTotal, largeurs };
}

/**
 * Emplacements à remplir par l'enfant selon le niveau (les autres sont déjà écrits) :
 * Facile = l'inconnue (« ? ») et au plus une donnée ; Normal = jusqu'à 4 ; Plus loin = tous.
 * Les parts égales répétées (multiplicatif) ne sont demandées qu'une fois.
 */
export function aPlacer(a: Analyse, max: number): Emplacement[] {
  const vus = new Set<string>();
  const uniques: Emplacement[] = [];
  for (const e of a.emplacements) {
    const cle = `${e.barre}:${e.attendu}`;
    if (e.segment >= 0 && vus.has(cle)) continue;
    vus.add(cle);
    uniques.push(e);
  }
  const inconnues = uniques.filter((e) => e.attendu === '?');
  const total = uniques.filter((e) => e.segment === -1 && e.attendu !== '?');
  const autres = uniques.filter((e) => e.attendu !== '?' && e.segment !== -1);
  return [...inconnues, ...total, ...autres].slice(0, Math.max(max, inconnues.length));
}

export interface Equation {
  gauche: number;
  op: '+' | '−' | '×' | '÷';
  droite: number;
  resultat: number;
  texte: string;
}

const NB = String.raw`(\d[\d  ]*(?:,\d+)?)`;

/** Égalités contenues dans `operation` (« 28 + 15 = 43 ; 43 − 7 = 36 »). */
export function equations(operation: string): Equation[] {
  const re = new RegExp(`${NB}\\s*([+−×÷\\-x:])\\s*${NB}\\s*=\\s*${NB}`, 'g');
  const out: Equation[] = [];
  for (const m of operation.matchAll(re)) {
    const g = parseNumber(m[1]!.trim());
    const d = parseNumber(m[3]!.trim());
    const r = parseNumber(m[4]!.trim());
    const op = ({ '+': '+', '−': '−', '-': '−', '×': '×', x: '×', '÷': '÷', ':': '÷' } as const)[
      m[2] as '+' | '−' | '-' | '×' | 'x' | '÷' | ':'
    ];
    if (g === null || d === null || r === null || !op) continue;
    out.push({ gauche: g, op, droite: d, resultat: r, texte: m[0]!.trim() });
  }
  return out;
}

/** Nombres cités dans l'énoncé (pour les distracteurs de la phrase-réponse). */
export function nombresEnonce(texte: string): number[] {
  const out: number[] = [];
  for (const m of texte.matchAll(new RegExp(NB, 'g'))) {
    const v = parseNumber(m[1]!.trim());
    if (v !== null && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Erreur typique : le résultat de « l'autre » opération sur la première égalité. */
export function resultatAutreOperation(e: Equation): number | null {
  switch (e.op) {
    case '+':
      return e.gauche >= e.droite ? e.gauche - e.droite : e.droite - e.gauche;
    case '−':
      return e.gauche + e.droite;
    case '×':
      return e.gauche + e.droite;
    case '÷':
      return e.gauche * e.droite;
  }
}

/** Candidat pour la phase « Est-ce possible ? » : une réponse fausse mais plausible, différente de la bonne. */
export function candidatFaux(item: BarModelItem): number | null {
  const eqs = equations(item.operation);
  const e = eqs[eqs.length - 1];
  if (e) {
    const v = resultatAutreOperation(e);
    if (v !== null && v !== item.answer && v >= 0) return v;
  }
  const n = nombresEnonce(item.statement).find((x) => x !== item.answer);
  return n ?? null;
}
