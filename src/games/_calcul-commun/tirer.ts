/**
 * Outils communs aux jeux de calcul (n° 11 à 20) : tirage d'items dans un flux.
 * Le Labo ne filtre pas les flux : un jeu doit ignorer proprement les items qui n'ont pas la forme
 * attendue (pas le bon `meta`, pas le bon type…).
 */
import type { ItemStream } from '@/content/provider';
import type { Item } from '@/content/schemas';
import { itemSuivant } from '../_kit/session';

/**
 * Tire le prochain item qui convient (en évitant si possible ceux déjà vus récemment).
 * Renvoie null si aucun item du flux ne convient.
 */
export function tirerItem<T>(
  stream: ItemStream,
  convertir: (it: Item) => T | null,
  dejaVus?: Set<string>,
  cible?: number,
): { item: Item; valeur: T } | null {
  const essais = Math.max(12, Math.min(80, (stream.size ?? 20) * 3));
  let secours: { item: Item; valeur: T } | null = null;
  for (let i = 0; i < essais; i++) {
    const it = itemSuivant(stream, cible);
    if (!it) break;
    const v = convertir(it);
    if (v === null) continue;
    if (!dejaVus || !dejaVus.has(it.id)) {
      dejaVus?.add(it.id);
      return { item: it, valeur: v };
    }
    secours ??= { item: it, valeur: v };
  }
  return secours;
}

/** Nombres lus à voix haute : « 3,5 » → « 3 virgule 5 », « − » → « moins ». */
export function aDire(texte: string): string {
  return texte
    .replace(/(\d),(\d)/g, '$1 virgule $2')
    .replace(/ ?− ?/g, ' moins ')
    .replace(/ ?× ?/g, ' fois ')
    .replace(/ ?÷ ?/g, ' divisé par ')
    .replace(/(\d+)\/(\d+)/g, '$1 sur $2');
}
