/**
 * Monnaie (La Petite Épicerie) : valeurs en CENTIMES, écriture en euros, décomposition optimale.
 * Fonctions pures.
 */
import type { MoneyItem } from '@/content/schemas';

/** Pièces et billets en euros (centimes). */
export const VALEURS_EURO = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000] as const;

export const estBillet = (c: number) => c >= 500;

/** « 3,50 € », « 5 € », « 0,20 € ». */
export function formatEuros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const ent = e >= 10000 ? String(e).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(e);
  return c === 0 ? `${ent} €` : `${ent},${String(c).padStart(2, '0')} €`;
}

/** Ce qui est écrit sur une pièce ou un billet : « 50 c », « 2 € ». */
export const libelleValeur = (c: number) => (c < 100 ? `${c} c` : `${c / 100} €`);

/** À dire : « 3 euros 50 », « 50 centimes ». */
export function eurosADire(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  if (e === 0) return `${c} centime${c > 1 ? 's' : ''}`;
  const euros = `${e} euro${e > 1 ? 's' : ''}`;
  return c === 0 ? euros : `${euros} ${c}`;
}

export const somme = (l: readonly number[]) => l.reduce((a, b) => a + b, 0);

/**
 * Décomposition d'un montant avec le moins de pièces et billets possible (programmation dynamique :
 * fonctionne même avec un jeu de valeurs incomplet). Résultat trié du plus grand au plus petit ; null si impossible.
 */
export function decompositionOptimale(montant: number, valeurs: readonly number[]): number[] | null {
  if (montant === 0) return [];
  if (montant < 0) return null;
  const vs = [...new Set(valeurs)].filter((v) => v > 0).sort((a, b) => a - b);
  const INF = Number.MAX_SAFE_INTEGER;
  const nb = new Array<number>(montant + 1).fill(INF);
  const dernier = new Array<number>(montant + 1).fill(0);
  nb[0] = 0;
  for (let m = 1; m <= montant; m++) {
    for (const v of vs) {
      if (v > m) break;
      const p = nb[m - v]!;
      if (p !== INF && p + 1 < nb[m]!) {
        nb[m] = p + 1;
        dernier[m] = v;
      }
    }
  }
  if (nb[montant] === INF) return null;
  const out: number[] = [];
  for (let m = montant; m > 0; m -= dernier[m]!) out.push(dernier[m]!);
  return out.sort((a, b) => b - a);
}

/** Montant à réunir : le prix (payer) ou la monnaie à rendre (rendre). */
export function montantCible(item: MoneyItem): number {
  return item.task === 'rendre' ? (item.givenCents ?? 0) - item.priceCents : item.priceCents;
}

/** Item exploitable : montant atteignable avec les valeurs proposées. */
export function itemMonnaieValide(item: MoneyItem): boolean {
  const m = montantCible(item);
  if (m <= 0 || m > 100000) return false;
  return decompositionOptimale(m, item.denominations) !== null;
}

/** Valeurs proposées, du plus petit au plus grand, limitées aux euros connus. */
export function valeursProposees(item: MoneyItem): number[] {
  return [...new Set(item.denominations)]
    .filter((v) => (VALEURS_EURO as readonly number[]).includes(v))
    .sort((a, b) => a - b);
}

/**
 * Stratégie du marchand pour rendre la monnaie : on « complète » le prix jusqu'à la somme donnée,
 * en commençant par les petites pièces (3,20 € → 3,30 € → 3,50 € → 4 € → 5 €).
 * Renvoie les étapes [montant atteint, valeur ajoutée].
 */
export function etapesCompleter(
  prix: number,
  donne: number,
  valeurs: readonly number[],
): [number, number][] {
  const deco = decompositionOptimale(donne - prix, valeurs);
  if (!deco) return [];
  let x = prix;
  return [...deco].reverse().map((v) => {
    x += v;
    return [x, v];
  });
}
