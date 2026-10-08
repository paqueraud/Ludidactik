/**
 * Tableau des scores (GAMIFICATION §6) : top 10 des profils de l'appareil par jeu × niveau × leçon,
 * classement hebdomadaire d'XP remis à zéro le lundi (si le parent autorise la compétition),
 * sinon « contre soi-même » : cette semaine comparée à la précédente.
 */
import type { AttemptRow, RecordRow } from '@/services/storage/db';
import { debutSemaine } from './dates';

const SEMAINE_MS = 7 * 86_400_000;

/** XP d'une partie (estimée à 10 par bonne réponse pour les parties d'avant la v3). */
export const xpDe = (a: Pick<AttemptRow, 'xp' | 'correct'>) => a.xp ?? a.correct * 10;

/** XP de chaque profil depuis le lundi (0 h) de la semaine de `now`. */
export function xpSemaine(attempts: AttemptRow[], now: number = Date.now()): Map<string, number> {
  const debut = debutSemaine(now);
  const out = new Map<string, number>();
  for (const a of attempts)
    if (a.date >= debut && a.date <= now) out.set(a.profileId, (out.get(a.profileId) ?? 0) + xpDe(a));
  return out;
}

export interface LigneClassement {
  profileId: string;
  xp: number;
  rang: number;
}

/** Classement hebdomadaire : tous les profils (0 XP compris), ex æquo au même rang. */
export function classementHebdo(
  profileIds: string[],
  attempts: AttemptRow[],
  now: number = Date.now(),
): LigneClassement[] {
  const xp = xpSemaine(attempts, now);
  const lignes = profileIds
    .map((profileId) => ({ profileId, xp: xp.get(profileId) ?? 0 }))
    .sort((a, b) => b.xp - a.xp);
  return lignes.map((l) => ({ ...l, rang: lignes.findIndex((x) => x.xp === l.xp) + 1 }));
}

export type Ligue = 'bronze' | 'argent' | 'or';

export interface ContreSoi {
  cetteSemaine: number;
  semaineDerniere: number;
  /** Ligue « contre soi-même » : Or si l'on fait au moins autant que la semaine dernière. */
  ligue: Ligue;
}

export function contreSoiMeme(
  profileId: string,
  attempts: AttemptRow[],
  now: number = Date.now(),
): ContreSoi {
  const debut = debutSemaine(now);
  // lundi précédent (calculé en heure locale pour traverser les changements d'heure)
  const debutPrec = debutSemaine(debut - SEMAINE_MS / 2);
  let cetteSemaine = 0;
  let semaineDerniere = 0;
  for (const a of attempts) {
    if (a.profileId !== profileId) continue;
    if (a.date >= debut && a.date <= now) cetteSemaine += xpDe(a);
    else if (a.date >= debutPrec && a.date < debut) semaineDerniere += xpDe(a);
  }
  const ratio = semaineDerniere === 0 ? (cetteSemaine > 0 ? 1 : 0) : cetteSemaine / semaineDerniere;
  const ligue: Ligue = ratio >= 1 ? 'or' : ratio >= 0.5 ? 'argent' : 'bronze';
  return { cetteSemaine, semaineDerniere, ligue };
}

export interface CleScore {
  lessonId: string;
  gameId: string;
  level: RecordRow['level'];
}

export const cleScore = (r: CleScore) => `${r.lessonId}|${r.gameId}|${r.level}`;

/** Top 10 des records des profils de l'appareil pour un jeu × niveau × leçon. */
export function top10(records: RecordRow[], cle: CleScore): RecordRow[] {
  const k = cleScore(cle);
  return records
    .filter((r) => cleScore(r) === k)
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, 10);
}

/** Tableaux (jeu × niveau × leçon) ayant au moins un record, du plus récent au plus ancien. */
export function tableauxDisponibles(records: RecordRow[]): CleScore[] {
  const vus = new Map<string, { cle: CleScore; date: number }>();
  for (const r of records) {
    const k = cleScore(r);
    const cur = vus.get(k);
    if (!cur || r.date > cur.date)
      vus.set(k, { cle: { lessonId: r.lessonId, gameId: r.gameId, level: r.level }, date: r.date });
  }
  return [...vus.values()].sort((a, b) => b.date - a.date).map((v) => v.cle);
}
