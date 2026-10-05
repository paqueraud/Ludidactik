/**
 * Lecture à voix haute (Karaoké) : alignement d'une transcription sur le texte, mots correctement lus
 * par minute (MCLM), rythme du métronome. Fonctions pures, testées.
 */
import { normalizeText } from '@/engine/answer';
import type { Level } from '@/content/schemas';
import { motsProches } from './oral';
import { type MotTexte, cleMot } from './texte';

export type EtatMot = 'attente' | 'lu' | 'saute';

export interface Alignement {
  etats: EtatMot[];
  /** Index du prochain mot à lire (= nombre de mots déjà dépassés). */
  position: number;
  /** Mots correctement lus. */
  corrects: number;
}

/** Nombre de mots que l'on peut sauter d'un coup (au-delà, on pense à un mot parasite entendu). */
const FENETRE = 4;

/**
 * Aligne ce que la reconnaissance vocale a entendu sur les mots du texte, dans l'ordre.
 * Un mot entendu qui correspond à un mot un peu plus loin fait « sauter » les mots intermédiaires
 * (non lus ou mal lus). Les mots entendus qui ne correspondent à rien sont ignorés (hésitations).
 */
export function alignerLecture(mots: Pick<MotTexte, 'affiche'>[], transcription: string): Alignement {
  const n = mots.length;
  const etats: EtatMot[] = Array.from({ length: n }, () => 'attente');
  const entendus = normalizeText(transcription)
    .split(' ')
    .filter((m) => cleMot(m));
  let i = 0;
  for (let k = 0; k < entendus.length && i < n; k++) {
    const w = entendus[k]!;
    const w2 = entendus[k + 1] ? `${w}${entendus[k + 1]}` : null;
    for (let j = i; j < Math.min(n, i + FENETRE); j++) {
      const attendu = mots[j]!.affiche;
      let pris = 0;
      if (motsProches(attendu, w)) pris = 1;
      else if (w2 && cleMot(attendu).length >= 5 && motsProches(attendu, w2)) pris = 2;
      if (!pris) continue;
      for (let s = i; s < j; s++) etats[s] = 'saute';
      etats[j] = 'lu';
      i = j + 1;
      k += pris - 1;
      break;
    }
  }
  return { etats, position: i, corrects: etats.filter((e) => e === 'lu').length };
}

/** Mots correctement lus par minute. */
export function calculerMCLM(corrects: number, dureeMs: number): number {
  if (dureeMs <= 0 || corrects <= 0) return 0;
  return Math.round(corrects / (dureeMs / 60_000));
}

/** Rythme du métronome selon le niveau, à partir de l'objectif du texte (attendu de la classe). */
export const RATIO_RYTHME: Record<Level, number> = { facile: 0.6, normal: 1, plus_loin: 1.2 };

export function rythmeCible(targetMCLM: number, level: Level): number {
  return Math.max(20, Math.round(targetMCLM * RATIO_RYTHME[level]));
}

/**
 * Instants (ms depuis le départ) où chaque mot s'allume au métronome : un « temps » par mot,
 * un temps et demi après une virgule, deux temps après une fin de phrase (on respire au point).
 * Le rythme moyen reste celui demandé : la durée totale vaut `mots / rythme` minutes.
 */
export function horaireMetronome(mots: Pick<MotTexte, 'finPhrase' | 'pause'>[], motsParMinute: number) {
  const poids = mots.map((m) => (m.finPhrase ? 2 : m.pause ? 1.5 : 1));
  const total = poids.reduce((a, b) => a + b, 0) || 1;
  const dureeTotale = (mots.length / motsParMinute) * 60_000;
  const unite = dureeTotale / total;
  const debuts: number[] = [];
  let t = 0;
  for (const p of poids) {
    debuts.push(t);
    t += p * unite;
  }
  return { debuts, dureeTotale };
}

/** Index du mot allumé au temps `t` (ms). -1 avant le départ ; mots.length après la fin. */
export function motAuTemps(debuts: number[], dureeTotale: number, t: number): number {
  if (t < 0) return -1;
  if (t >= dureeTotale) return debuts.length;
  let lo = 0;
  let hi = debuts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (debuts[mid]! <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * MCLM approximatif en mode métronome (auto-évaluation) : mots atteints au métronome moins les mots
 * que l'enfant signale comme ratés, rapportés à la durée réelle de lecture.
 */
export function mclmMetronome(motsAtteints: number, erreurs: number, dureeMs: number): number {
  return calculerMCLM(Math.max(0, motsAtteints - erreurs), dureeMs);
}

/** Étoiles de fluence : 3 = objectif atteint, 2 = au moins 80 %, 1 = au moins 50 %. */
export function etoilesFluence(mclm: number, objectif: number): number {
  if (mclm >= objectif) return 3;
  if (mclm >= objectif * 0.8) return 2;
  if (mclm >= objectif * 0.5) return 1;
  return 0;
}
