/** Fonctions pures sur les listes de mots des parents (sans base de données : utilisables partout). */
import type { ParentWordList } from '@/services/storage/db';

/** Une liste a-t-elle quelque chose à jouer (mots ou texte de dictée) ? */
export const listeJouable = (l: ParentWordList) => l.mots.length > 0 || !!l.dictee?.trim();

/** Découpe le texte d'une dictée en phrases (ponctuation finale conservée). */
export function phrasesDictee(texte: string | undefined): string[] {
  const propre = (texte ?? '').replace(/\s+/g, ' ').trim();
  if (!propre) return [];
  const morceaux = propre.match(/[^.!?…]+(?:[.!?…]+[»"”)]*|$)/g) ?? [propre];
  return morceaux.map((m) => m.trim()).filter((m) => /\p{L}/u.test(m));
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apostrophes = (s: string) => s.toLowerCase().replace(/[’']/g, "'");

/** Mots de la liste absents du texte de la dictée (comparaison sans tenir compte des majuscules). */
export function motsAbsents(texte: string | undefined, mots: string[]): string[] {
  const t = apostrophes(texte ?? '');
  return mots.filter((m) => {
    const mot = apostrophes(m).trim();
    return !!mot && !new RegExp(`(^|[^\\p{L}])${echapper(mot)}([^\\p{L}]|$)`, 'u').test(t);
  });
}
