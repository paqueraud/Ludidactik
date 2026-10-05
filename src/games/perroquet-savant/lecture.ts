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
}

/** Lecture en français (pas l'anglais : Jacques a dit ; pas les nombres : Robot calculateur). */
export const estLecture = (it: Item): it is OralItem =>
  it.kind === 'oral_answer' && (!it.lang || it.lang === 'fr-FR') && parseNumber(it.answer) === null;

export function versLecture(it: Item): ALire | null {
  if (!estLecture(it)) return null;
  const prompt = normalizeText(it.prompt);
  const rep = normalizeText(it.answer);
  const contient = prompt.toLowerCase().includes(rep.toLowerCase());
  // « Lis ce pseudo-mot : choust » → consigne « Lis ce pseudo-mot », mot à lire « choust »
  let consigne = prompt;
  if (contient) {
    const i = prompt.toLowerCase().lastIndexOf(rep.toLowerCase());
    consigne = prompt.slice(0, i).replace(/[\s:«»"]+$/u, '').trim() || 'Lis à voix haute';
  }
  return {
    item: it,
    consigne,
    motALire: contient ? it.answer : null,
    reponse: it.answer,
    acceptes: [...new Set([it.answer, ...it.accepted])],
  };
}
