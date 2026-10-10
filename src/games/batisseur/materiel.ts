/**
 * Logique du Bâtisseur (pure, testée) : rangs utiles d'un nombre, valeur d'une construction (calcul
 * en entiers pour éviter les erreurs d'arrondi), échanges 10 ↔ 1.
 */
import { formatNumber } from '@/engine/answer';

/** Noms des rangs (vocabulaire de numération) : [singulier, pluriel]. */
export const NOM_RANG: Record<number, [string, string]> = {
  8: ['centaine de millions', 'centaines de millions'],
  7: ['dizaine de millions', 'dizaines de millions'],
  6: ['million', 'millions'],
  5: ['centaine de mille', 'centaines de mille'],
  4: ['dizaine de mille', 'dizaines de mille'],
  3: ['millier', 'milliers'],
  2: ['centaine', 'centaines'],
  1: ['dizaine', 'dizaines'],
  0: ['unité', 'unités'],
  [-1]: ['dixième', 'dixièmes'],
  [-2]: ['centième', 'centièmes'],
  [-3]: ['millième', 'millièmes'],
};

/** « 3 centaines », « 1 dizaine ». */
export const nomRang = (r: number, n: number) => {
  const noms = NOM_RANG[r];
  return noms ? noms[n > 1 ? 1 : 0] : `× ${valeurPiece(r)}`;
};

/** Nombre de décimales réellement écrites (0,250 → 2). */
export function nbDecimales(n: number): number {
  const s = String(Math.round(n * 1000) / 1000);
  return s.includes('.') ? s.split('.')[1]!.length : 0;
}

/** Rangs affichés, du plus grand au plus petit (au moins deux, pour pouvoir échanger). */
export function rangsDe(n: number): number[] {
  const lo = -nbDecimales(n);
  const ent = Math.floor(Math.abs(n));
  const hiNombre = ent > 0 ? String(ent).length - 1 : 0;
  const hi = Math.max(hiNombre, lo + 1, 0);
  const out: number[] = [];
  for (let r = hi; r >= lo; r--) out.push(r);
  return out;
}

/** Valeur exacte en « plus petites unités » (10^lo). */
export function enUnites(comptes: Record<number, number>, lo: number): number {
  let t = 0;
  for (const [r, c] of Object.entries(comptes)) t += c * 10 ** (Number(r) - lo);
  return Math.round(t);
}

/** Valeur décimale d'une construction. */
export function valeur(comptes: Record<number, number>, lo: number): number {
  return enUnites(comptes, lo) / 10 ** -lo;
}

export const cible = (n: number, lo: number) => Math.round(n * 10 ** -lo);

/** Décomposition canonique (chiffre de chaque rang). */
export function decomposition(n: number, rangs: number[]): Record<number, number> {
  const lo = rangs[rangs.length - 1]!;
  let u = cible(n, lo);
  const out: Record<number, number> = {};
  for (const r of [...rangs].reverse()) {
    out[r] = u % 10;
    u = Math.floor(u / 10);
  }
  // reste éventuel au-delà du rang le plus haut
  if (u > 0) out[rangs[0]!] = (out[rangs[0]!] ?? 0) + u * 10;
  return out;
}

/** Valeur d'une pièce d'un rang (« 100 », « 0,1 »). */
export const valeurPiece = (r: number) => formatNumber(10 ** r);

/** Phrase de correction : « 635 = 6 centaines, 3 dizaines et 5 unités. » (calculée, jamais écrite en dur). */
export function phraseDecomposition(n: number, rangs: number[]): string {
  const d = decomposition(n, rangs);
  const morceaux = rangs.filter((r) => d[r]).map((r) => `${d[r]} ${nomRang(r, d[r]!)}`);
  if (!morceaux.length) return `${formatNumber(n)} = 0.`;
  const fin =
    morceaux.length > 1
      ? `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`
      : morceaux[0];
  return `${formatNumber(n)} = ${fin}.`;
}

/**
 * « Combien y a-t-il de dizaines en tout dans 348 ? » : on construit 348, on casse les grosses pièces,
 * puis on compte les barres (348 = 34 dizaines et 8 unités). Réservé aux réponses ≤ maxPieces.
 */
export function lireEnTout(
  prompt: string,
  reponse: number,
  maxPieces: number,
): { nombre: number; rang: number } | null {
  const m = prompt.match(
    /^Combien y a-t-il de (\p{L}+(?: de \p{L}+)?) en tout dans ([\d\s\u00A0\u202F]+) \?$/u,
  );
  if (!m) return null;
  const rang = Object.entries(NOM_RANG).find(([, [, pl]]) => pl === m[1])?.[0];
  const nombre = Number(m[2]!.replace(/[\s\u00A0\u202F]/g, ''));
  if (rang === undefined || !Number.isFinite(nombre) || reponse > maxPieces) return null;
  return { nombre, rang: Number(rang) };
}
