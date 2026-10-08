/** Perroquet savant : ce qu'il faut lire à voix haute dans un item `oral_answer` (fonctions pures). */
import type { Item, OralItem } from '@/content/schemas';
import { normalizeText, parseNumber } from '@/engine/answer';

export interface ALire {
  item: OralItem;
  /** Consigne (« Lis ce pseudo-mot »). */
  consigne: string;
  /** Ce qui est écrit en grand à lire (null si l'item est une question à laquelle on répond oralement). */
  motALire: string | null;
  reponse: string;
  acceptes: string[];
  /** Question venue d'un QCM (monde, EMC, histoire, sciences) : choix affichés, à dire à voix haute. */
  choix: string[] | null;
  /** Illustration (emoji) de la question. */
  image: string | null;
}

/** Réponse orale dérivée d'un QCM par l'adaptateur (`meta.depuisQcm`, `meta.choix`). */
const depuisQcm = (it: Item): boolean => it.kind === 'oral_answer' && it.meta?.depuisQcm === true;

/** Lecture en français (pas l'anglais : Jacques a dit ; pas les nombres : Robot calculateur). */
export const estLecture = (it: Item): it is OralItem =>
  it.kind === 'oral_answer' &&
  (!it.lang || it.lang === 'fr-FR') &&
  (parseNumber(it.answer) === null || depuisQcm(it));

export function versLecture(it: Item): ALire | null {
  if (!estLecture(it)) return null;
  if (depuisQcm(it)) {
    const choix = Array.isArray(it.meta?.choix) ? (it.meta.choix as unknown[]).map(String) : null;
    return {
      item: it,
      consigne: normalizeText(it.prompt),
      motALire: null,
      reponse: it.answer,
      acceptes: [...new Set([it.answer, ...it.accepted])],
      choix: choix && choix.length >= 2 ? choix : null,
      image: typeof it.meta?.image === 'string' ? it.meta.image : null,
    };
  }
  const prompt = normalizeText(it.prompt);
  const rep = normalizeText(it.answer);
  const contient = prompt.toLowerCase().includes(rep.toLowerCase());
  // « Lis ce pseudo-mot : choust » → consigne « Lis ce pseudo-mot », mot à lire « choust »
  let consigne = prompt;
  if (contient) {
    const i = prompt.toLowerCase().lastIndexOf(rep.toLowerCase());
    consigne =
      prompt
        .slice(0, i)
        .replace(/[\s:«»"]+$/u, '')
        .trim() || 'Lis à voix haute';
  }
  return {
    item: it,
    consigne,
    motALire: contient ? it.answer : null,
    reponse: it.answer,
    acceptes: [...new Set([it.answer, ...it.accepted])],
    choix: null,
    image: null,
  };
}
