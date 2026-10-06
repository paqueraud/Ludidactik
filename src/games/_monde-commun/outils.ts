/**
 * Logique pure commune aux jeux « Questionner le monde / histoire-géo / sciences / EMC / anglais »
 * (n° 50 à 56) : ordres à reconstituer, choix réduits, directions sur une carte, comparaison orale.
 */
import type { Item, McqItem, OrderingItem, PairingItem } from '@/content/schemas';
import type { Rng } from '@/engine/rng';

/* ------------------------------------------------------------------ */
/* Ordres (frises, cycles, étapes)                                     */
/* ------------------------------------------------------------------ */

/** Mélange des indices 0..n-1 qui n'est jamais déjà dans l'ordre (n ≥ 2). */
export function melangeDesordonne(n: number, rng: Rng): number[] {
  const base = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return base;
  for (let essai = 0; essai < 20; essai++) {
    const m = rng.shuffle(base);
    if (m.some((v, i) => v !== i)) return m;
  }
  return [...base.slice(1), 0];
}

/**
 * Vérifie un ordre proposé (`propose` = indices des éléments d'origine, dans l'ordre choisi par l'enfant).
 * Les éléments d'un item `ordering` sont donnés dans le bon ordre : la bonne réponse est 0, 1, 2…
 */
export function verifierOrdre(propose: readonly number[], n: number) {
  const bienPlaces = Array.from({ length: n }, (_, pos) => propose[pos] === pos);
  return { juste: propose.length === n && bienPlaces.every(Boolean), bienPlaces };
}

/**
 * Garde `k` éléments d'un ordre en conservant leur ordre relatif (niveau Facile : frise plus courte).
 * Les extrémités sont gardées (le plus ancien et le plus récent restent des repères).
 */
export function sousOrdre(n: number, k: number, rng: Rng): number[] {
  if (k >= n) return Array.from({ length: n }, (_, i) => i);
  if (k <= 2) return [0, n - 1].slice(0, Math.max(1, k));
  const milieu = rng.shuffle(Array.from({ length: n - 2 }, (_, i) => i + 1)).slice(0, k - 2);
  return [0, ...milieu.sort((a, b) => a - b), n - 1];
}

/** Item `ordering` réduit aux indices donnés (étiquettes alignées). */
export function restreindreOrdre(item: OrderingItem, garder: readonly number[]): OrderingItem {
  return {
    ...item,
    elements: garder.map((i) => item.elements[i]!),
    labels: item.labels ? garder.map((i) => item.labels![i] ?? '') : undefined,
  };
}

/** Formes d'ordre jouées dans la Machine à remonter le temps et le Laboratoire. */
export const estFrise = (it: Item): it is OrderingItem =>
  it.kind === 'ordering' && (it.mode === 'chrono' || it.mode === 'etapes');

/** Une suite d'étapes qui revient à son début (cycle de vie) : affichage en cercle. */
export const estCycle = (it: OrderingItem) =>
  it.mode === 'etapes' && (/cycle/i.test(it.prompt) || it.meta?.cycle === true);

/* ------------------------------------------------------------------ */
/* QCM                                                                 */
/* ------------------------------------------------------------------ */

/** Garde la bonne réponse et `n - 1` distracteurs, dans un ordre mélangé. */
export function reduireChoix(item: Pick<McqItem, 'choices' | 'answerIndex'>, n: number, rng: Rng) {
  const bonne = item.choices[item.answerIndex]!;
  const autres = rng.shuffle(item.choices.filter((_, i) => i !== item.answerIndex)).slice(0, Math.max(1, n - 1));
  const choices = rng.shuffle([bonne, ...autres]);
  return { choices, answerIndex: choices.indexOf(bonne) };
}

/* ------------------------------------------------------------------ */
/* Emoji, anglais, oral                                                */
/* ------------------------------------------------------------------ */

/** La chaîne est-elle une image (emoji seul, sans lettres ni chiffres) ? */
export function estEmoji(s: string): boolean {
  const t = s.trim();
  return /\p{Extended_Pictographic}/u.test(t) && !/[\p{L}\p{N}]/u.test(t.replace(/️|‍/g, ''));
}

/** Paires « mot anglais ↔ image » (Jacques a dit). */
export const estPaireImage = (it: Item): it is PairingItem =>
  it.kind === 'pairing' && it.pairs.length >= 2 && it.pairs.every((p) => estEmoji(p.right) && !estEmoji(p.left));

/** Normalise une transcription orale ou une saisie pour comparaison (minuscules, sans accents ni ponctuation). */
export function normaliserOral(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Une des transcriptions correspond-elle à une réponse acceptée ? (on tolère des mots en plus autour) */
export function oralCorrespond(transcriptions: readonly string[], acceptees: readonly string[]): boolean {
  const ok = acceptees.map(normaliserOral).filter(Boolean);
  return transcriptions.some((t) => {
    const n = normaliserOral(t);
    return ok.some((a) => n === a || ` ${n} `.includes(` ${a} `));
  });
}

/* ------------------------------------------------------------------ */
/* Cartes                                                              */
/* ------------------------------------------------------------------ */

/** Direction (en mots d'enfant) pour aller du point `a` au point `b` sur une carte (y vers le bas). */
export function direction(a: readonly [number, number], b: readonly [number, number]): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ns = Math.abs(dy) > Math.abs(dx) * 0.45 ? (dy < 0 ? 'nord' : 'sud') : '';
  const eo = Math.abs(dx) > Math.abs(dy) * 0.45 ? (dx > 0 ? 'est' : 'ouest') : '';
  if (ns && eo) return `${ns}-${eo}`;
  return ns || eo || 'tout près';
}

/** Phrase d'indice : « Cherche plus au nord-est ! » */
export function phraseDirection(dir: string): string {
  if (dir === 'tout près') return 'Tu es tout près !';
  return `Cherche plus ${dir.startsWith('e') || dir.startsWith('o') ? 'à l’' : 'au '}${dir} !`;
}

/* ------------------------------------------------------------------ */
/* Typographie                                                         */
/* ------------------------------------------------------------------ */

/** Espaces insécables de la typographie française (« ? », « ! », « : », guillemets) : pas de « ? » seul en début de ligne. */
export function insecable(s: string): string {
  return s.replace(/ ([?!:;»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
}
