/**
 * Flamme de série (GAMIFICATION §4) : nombre de jours où l'enfant a réussi au moins un défi.
 * Pas de culpabilisation : chaque semaine (du lundi au dimanche), 2 jours sans défi sont
 * automatiquement « gelés » (la flamme les traverse sans s'éteindre). Aujourd'hui ne compte comme
 * manqué qu'une fois la journée finie.
 */
import { addDays, lundiDe } from './dates';

export const GELS_PAR_SEMAINE = 2;

export interface Flamme {
  /** Jours actifs dans la série en cours. */
  jours: number;
  /** Un défi a été réussi aujourd'hui. */
  aujourdhui: boolean;
  /** Jours gelés dans la série en cours (du plus récent au plus ancien). */
  gels: string[];
  /** Gels encore disponibles cette semaine. */
  gelsRestants: number;
}

export function calculerFlamme(joursActifs: Iterable<string>, today: string): Flamme {
  const actifs = new Set(joursActifs);
  const aujourdhui = actifs.has(today);
  const premier = [...actifs].sort()[0];
  const gelsParSemaine = new Map<string, number>();
  const gels: string[] = [];
  let jours = aujourdhui ? 1 : 0;
  let plusAncien = aujourdhui ? today : null;
  if (premier !== undefined) {
    for (let day = addDays(today, -1); day >= premier; day = addDays(day, -1)) {
      if (actifs.has(day)) {
        jours++;
        plusAncien = day;
        continue;
      }
      const semaine = lundiDe(day);
      const utilises = gelsParSemaine.get(semaine) ?? 0;
      if (utilises >= GELS_PAR_SEMAINE) break;
      gelsParSemaine.set(semaine, utilises + 1);
      gels.push(day);
    }
  }
  // Les gels plus anciens que le premier jour de la série n'en font pas partie.
  const gelsSerie = plusAncien === null ? [] : gels.filter((d) => d > plusAncien!);
  const gelsCetteSemaine = gelsSerie.filter((d) => lundiDe(d) === lundiDe(today)).length;
  return {
    jours,
    aujourdhui,
    gels: gelsSerie,
    gelsRestants: Math.max(0, GELS_PAR_SEMAINE - gelsCetteSemaine),
  };
}
