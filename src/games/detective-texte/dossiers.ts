/** Détective du texte : regroupe les questions par texte (« dossiers d'enquête »). Fonctions pures. */
import type { Item, McqItem } from '@/content/schemas';
import { type PhraseTexte, decouperPhrases, indexPreuve } from '../_langue-commun/texte';

export const aUnTexte = (it: Item): it is McqItem =>
  it.kind === 'mcq' && typeof it.meta?.texte === 'string' && it.meta.texte.trim().length > 10;

export interface Dossier {
  titre: string;
  texte: string;
  phrases: PhraseTexte[];
  questions: { item: McqItem; preuve: number }[];
}

/** Regroupe des QCM par texte, dans l'ordre d'arrivée ; chaque question connaît sa phrase-preuve (-1 si aucune). */
export function regrouper(items: McqItem[]): Dossier[] {
  const parTexte = new Map<string, Dossier>();
  for (const item of items) {
    const texte = String(item.meta?.texte ?? '').trim();
    if (!texte) continue;
    let d = parTexte.get(texte);
    if (!d) {
      const titre = typeof item.meta?.titre === 'string' && item.meta.titre.trim() ? item.meta.titre.trim() : 'Le texte';
      d = { titre, texte, phrases: decouperPhrases(texte), questions: [] };
      parTexte.set(texte, d);
    }
    const preuve = typeof item.meta?.preuve === 'string' ? indexPreuve(d.phrases, item.meta.preuve) : -1;
    d.questions.push({ item, preuve });
  }
  return [...parTexte.values()];
}

/** Questions de la partie (au plus `n`), texte par texte. */
export function planEnquete(dossiers: Dossier[], n: number): { dossier: number; question: number }[] {
  const out: { dossier: number; question: number }[] = [];
  dossiers.forEach((d, i) =>
    d.questions.forEach((_, j) => {
      if (out.length < n) out.push({ dossier: i, question: j });
    }),
  );
  return out;
}
