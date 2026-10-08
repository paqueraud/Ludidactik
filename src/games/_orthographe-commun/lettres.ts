/**
 * Outils communs aux jeux d'orthographe (n° 30 à 38) : découpage en lettres, comparaison
 * « de base » (sans accent), tirage d'items dans un flux, constitution d'une liste de mots.
 * Fonctions pures : aucune donnée pédagogique ici.
 */
import type { ItemStream } from '@/content/provider';
import type { Item, SpellingItem } from '@/content/schemas';
import { normalizeText, stripAccents } from '@/engine/answer';
import { itemSuivant } from '../_kit/session';

/** Découpe un mot en lettres (caractères Unicode NFC, apostrophes droites). */
export function lettres(mot: string): string[] {
  return [...normalizeText(mot)];
}

/** Lettre « de base » : minuscule sans accent (é → e, ç → c). œ et æ sont conservés. */
export function base(ch: string): string {
  return stripAccents(ch.toLowerCase());
}

/** Vrai pour une lettre (avec ou sans accent). */
export const estLettre = (ch: string) => /^\p{L}$/u.test(ch);

/** Mot fait uniquement de lettres (ni espace, ni apostrophe, ni trait d'union). */
export const motSimple = (mot: string) => /^\p{L}+$/u.test(normalizeText(mot));

/** Item « mot » (pas une phrase de dictée). */
export function estMot(item: Item): item is SpellingItem {
  return item.kind === 'spelling_word' && !item.isSentence && !/\s/.test(normalizeText(item.word));
}

/**
 * Tire le prochain item qui convient. Le Labo ne filtre pas les flux : un jeu doit ignorer
 * proprement les items qui n'ont pas la forme attendue. Renvoie null si aucun ne convient.
 */
export function tirerItem<T extends Item>(stream: ItemStream, ok: (it: Item) => it is T): T | null;
export function tirerItem(stream: ItemStream, ok: (it: Item) => boolean): Item | null;
export function tirerItem(stream: ItemStream, ok: (it: Item) => boolean): Item | null {
  const essais = Math.max(12, Math.min(80, (stream.size ?? 20) * 2));
  for (let i = 0; i < essais; i++) {
    const it = itemSuivant(stream);
    if (!it) return null;
    if (ok(it)) return it;
  }
  return null;
}

/**
 * Constitue la liste de mots d'une partie (jeux qui ont besoin de plusieurs mots à la fois :
 * mots croisés, Wordle…). Dédoublonne par mot. Respecte l'ordre du flux (mots à revoir d'abord).
 */
export function collecterMots(
  stream: ItemStream,
  ok: (it: Item) => it is SpellingItem,
  max = 40,
): SpellingItem[] {
  const vus = new Map<string, SpellingItem>();
  const tirages = Math.min(120, Math.max(stream.size ?? 30, 12) * 2);
  for (let i = 0; i < tirages && vus.size < max; i++) {
    const it = itemSuivant(stream);
    if (!it) break;
    if (!ok(it)) continue;
    const cle = normalizeText(it.word).toLowerCase();
    if (!vus.has(cle)) vus.set(cle, it);
  }
  return [...vus.values()];
}

/** Mélange de Fisher-Yates (aléatoire du navigateur par défaut, injectable pour les tests). */
export function melanger<T>(liste: readonly T[], aleat: () => number = Math.random): T[] {
  const out = [...liste];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(aleat() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Plus long préfixe commun (insensible aux accents et à la casse), en nombre de lettres. */
export function prefixeCommun(a: string, b: string): number {
  const la = lettres(a);
  const lb = lettres(b);
  let n = 0;
  while (n < la.length && n < lb.length && base(la[n]!) === base(lb[n]!)) n++;
  return n;
}
