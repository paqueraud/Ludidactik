/** Moteur de score : étoiles, XP, Ludis, maîtrise, niveau de joueur (ARCHITECTURE §5, GAMIFICATION §1). */
import type { Level } from '@/content/schemas';

/** 1★ ≥ 60 % · 2★ ≥ 80 % · 3★ ≥ 95 % ET temps ≤ cible (pas de contrainte de temps au niveau Facile). */
export function computeStars(
  correct: number,
  total: number,
  durationMs: number,
  targetMs: number,
  level: Level,
): number {
  if (total <= 0) return 0;
  const acc = correct / total;
  if (acc >= 0.95 && (level === 'facile' || durationMs <= targetMs)) return 3;
  if (acc >= 0.8) return 2;
  if (acc >= 0.6) return 1;
  return 0;
}

export const XP_PAR_BONNE_REPONSE = 10;
export const XP_BONUS_SERIE = 5;

/** XP d'une réponse : +10, ×1,5 en « Pour aller plus loin », +5 à partir de 3 bonnes réponses d'affilée. */
export function xpForAnswer(correct: boolean, streak: number, level: Level): number {
  if (!correct) return 0;
  const base = XP_PAR_BONNE_REPONSE * (level === 'plus_loin' ? 1.5 : 1);
  return Math.round(base + (streak >= 3 ? XP_BONUS_SERIE : 0));
}

/** Ludis de fin de partie : 5 par étoile, +5 objectif atteint, +10 record battu. Jamais retirés. */
export function ludisForGame(stars: number, won: boolean, newRecord: boolean): number {
  return stars * 5 + (won ? 5 : 0) + (newRecord ? 10 : 0);
}

/** Maîtrise d'une leçon (0..1) : meilleurs résultats Normal ×2, Plus loin ×1, Facile ×0,5. */
export function mastery(best: Partial<Record<Level, number>>): number {
  const w = { facile: 0.5, normal: 2, plus_loin: 1 } as const;
  const total = w.facile + w.normal + w.plus_loin;
  const sum = (Object.keys(w) as Level[]).reduce(
    (s, l) => s + w[l] * Math.min(1, Math.max(0, best[l] ?? 0)),
    0,
  );
  return sum / total;
}

const TITRES = [
  'Apprenti',
  'Curieux',
  'Explorateur',
  'Aventurier',
  'Savant',
  'Expert',
  'Champion',
  'Génie',
  'Légende',
];

/** Niveau de joueur 1→50 : il faut 100 × n XP pour passer du niveau n au niveau n+1. */
export function playerLevel(xp: number): {
  niveau: number;
  titre: string;
  xpDansNiveau: number;
  xpPourSuivant: number;
} {
  let niveau = 1;
  let rest = Math.max(0, xp);
  while (niveau < 50 && rest >= 100 * niveau) {
    rest -= 100 * niveau;
    niveau++;
  }
  const titre = TITRES[Math.min(TITRES.length - 1, Math.floor((niveau - 1) / 6))]!;
  return { niveau, titre, xpDansNiveau: rest, xpPourSuivant: 100 * niveau };
}
