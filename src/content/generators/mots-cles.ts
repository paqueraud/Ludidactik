/**
 * Mots-clés d'une leçon (vocabulaire de l'histoire, de la géographie, des sciences, de l'EMC ou de la
 * grammaire) → items `spelling_word` avec définition. Ils rendent jouables les jeux où l'on **écrit**
 * (Ascension, Appareil photo, Wordle, Mots croisés, Lettres en vrac, Bonhomme de neige, Dictée-duel).
 *
 * Niveaux (`n`) : `f` = mot essentiel, court et courant ; `n` = vocabulaire attendu du BO ;
 * `p` = mot plus long ou plus rare (Plus loin). Sélection : Facile = f (complété par n s'il y en a
 * moins de 6), Normal = f + n, Plus loin = n + p. Fonction pure : aucun hasard.
 */
import type { ItemOf, Level } from '../schemas';
import type { ItemPool } from '../registry';

export type NivMot = 'f' | 'n' | 'p';

export interface MotCle {
  /** Mot à écrire, sans article (nom propre : avec sa majuscule). */
  mot: string;
  /** Définition d'enfant, sans le mot lui-même (indice des mots croisés). */
  def: string;
  n: NivMot;
  /** Phrase-contexte lue entre deux lectures du mot (indispensable pour un homophone). */
  phrase?: string;
}

/** Écriture compacte : [mot, définition, niveau, phrase-contexte facultative]. */
export type M = readonly [string, string, NivMot, string?];
export const motsDe = (liste: readonly M[]): MotCle[] =>
  liste.map(([mot, def, n, phrase]) => ({ mot, def, n, ...(phrase ? { phrase } : {}) }));

const NIVEAUX: Record<Level, NivMot[]> = { facile: ['f'], normal: ['f', 'n'], plus_loin: ['n', 'p'] };
/** Nombre minimal de mots à un niveau (les jeux d'écriture en demandent 4). */
export const MIN_MOTS = 6;

/** Mots d'un niveau, complétés par le niveau voisin s'il y en a moins de `MIN_MOTS`. */
export function motsDuNiveau(mots: readonly MotCle[], level: Level): MotCle[] {
  let out = mots.filter((m) => NIVEAUX[level].includes(m.n));
  if (out.length < MIN_MOTS) {
    const voisin: NivMot = level === 'plus_loin' ? 'f' : level === 'facile' ? 'n' : 'p';
    out = [...out, ...mots.filter((m) => m.n === voisin)];
  }
  return out;
}

const DIFF: Record<NivMot, number> = { f: 0.2, n: 0.5, p: 0.8 };

/** Majuscule initiale (pour l'explication). */
const maj = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);

/** Item « mot à écrire » d'une leçon. */
export function itemMotCle(m: MotCle, lessonId: string): ItemOf<'spelling_word'> {
  return {
    kind: 'spelling_word',
    id: `${lessonId}:mot:${m.mot}`,
    lessonId,
    word: m.mot,
    ...(m.phrase ? { sentence: m.phrase } : {}),
    isSentence: false,
    definition: maj(m.def),
    source: 'programme',
    difficulty: DIFF[m.n],
    explication: `« ${m.mot} » : ${m.def.replace('___', m.mot)}.`,
  };
}

/** Banque `spelling_word` d'une leçon. */
export function poolMotsCles(mots: readonly MotCle[]): ItemPool {
  return (level, _rng, ctx) => motsDuNiveau(mots, level).map((m) => itemMotCle(m, ctx.lesson.id));
}
