/**
 * Phrases à trou (fill_blank, et QCM « à trou ») : forme commune utilisée par la Chasse aux
 * lettres muettes, la Pêche aux homophones et le Train des accords. Fonctions pures.
 * Conventions `meta` (GUIDE §6) : `meta.famille` (lettre muette), `meta.groupe` (accords).
 */
import type { Item } from '@/content/schemas';
import { checkSpelling, normalizeText } from '@/engine/answer';
import { melanger } from './lettres';

export interface Trou {
  item: Item;
  /** Texte avant et après le trou. */
  avant: string;
  apres: string;
  reponse: string;
  /** Toutes les réponses acceptées (réponse + variantes). */
  acceptees: string[];
  /** Choix proposés (null = saisie libre). */
  choix: string[] | null;
  /** Astuce de substitution. */
  astuce?: string;
  /** Mot de la même famille qui fait entendre la lettre muette. */
  famille?: string;
  /** Mots du groupe à accorder (wagons). */
  groupe?: string[];
  explication: string;
}

const BLANC = '___';

function decouper(texte: string): [string, string] {
  const i = texte.indexOf(BLANC);
  if (i < 0) return [texte, ''];
  // « ____ » (plus de 3 tirets) : on absorbe les tirets en trop
  let j = i + BLANC.length;
  while (texte[j] === '_') j++;
  return [texte.slice(0, i), texte.slice(j)];
}

/** Convertit un item en phrase à trou, ou null s'il ne s'y prête pas. */
export function versTrou(item: Item): Trou | null {
  const meta = item.meta ?? {};
  const famille = typeof meta.famille === 'string' && meta.famille.trim() ? meta.famille.trim() : undefined;
  const groupeBrut = meta.groupe;
  const groupe = Array.isArray(groupeBrut)
    ? groupeBrut.filter((g): g is string => typeof g === 'string' && !!g.trim())
    : typeof groupeBrut === 'string' && groupeBrut.trim()
      ? groupeBrut.trim().split(/\s+/)
      : undefined;
  if (item.kind === 'fill_blank') {
    const [avant, apres] = decouper(item.sentence);
    return {
      item,
      avant,
      apres,
      reponse: item.answer,
      acceptees: [item.answer, ...(item.accepted ?? [])],
      choix: item.choices && item.choices.length >= 2 ? item.choices : null,
      astuce: item.hint,
      famille,
      groupe: groupe?.length ? groupe : undefined,
      explication: item.explication,
    };
  }
  if (item.kind === 'mcq') {
    const reponse = item.choices[item.answerIndex];
    if (!reponse) return null;
    const [avant, apres] = decouper(item.question);
    return {
      item,
      avant,
      apres,
      reponse,
      acceptees: [reponse, ...(item.typedAnswer ? [item.typedAnswer] : [])],
      choix: item.choices,
      astuce: item.hints?.[item.hints.length - 1],
      famille,
      groupe: groupe?.length ? groupe : undefined,
      explication: item.explication,
    };
  }
  return null;
}

/** La réponse donnée est-elle juste ? (rectifications 1990 acceptées via checkSpelling) */
export function trouJuste(t: Trou, donne: string): boolean {
  const d = normalizeText(donne);
  if (!d) return false;
  return t.acceptees.some((a) => normalizeText(a) === d || checkSpelling(d, a).correct);
}

/** Garde `n` choix dont la bonne réponse, mélangés. */
export function reduireChoix(choix: string[], reponse: string, n: number, aleat: () => number = Math.random) {
  const autres = melanger(
    choix.filter((c) => c !== reponse),
    aleat,
  ).slice(0, Math.max(1, n - 1));
  return melanger([reponse, ...autres], aleat);
}

/** Phrase complète (trou rempli). */
export const phraseComplete = (t: Trou, mot = t.reponse) => `${t.avant}${mot}${t.apres}`;

/** Phrase lue à voix haute : le trou devient « … » (une petite pause). */
export const phraseALire = (t: Trou) => `${t.avant} … ${t.apres}`.replace(/\s+/g, ' ').trim();
