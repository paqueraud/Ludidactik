/**
 * Statistiques de l'espace parents (fonctions pures, testées) : leçons travaillées, étoiles par niveau,
 * maîtrise par matière, compétences fragiles (erreurs fréquentes), éléments en boîte 1 de Leitner.
 */
import type { Lesson, Level, Matiere } from '@/content/schemas';
import { mastery } from '@/engine/score';
import type { AttemptRow, LeitnerRow, ProgressRow } from '@/services/storage/db';

const JOUR = 86_400_000;

export interface LeconTravaillee {
  lessonId: string;
  stars: Record<Level, number>;
  best: Partial<Record<Level, number>>;
  plays: number;
  lastPlayed: number;
}

/** Leçons travaillées (au moins une partie), de la plus récente à la plus ancienne. */
export function leconsTravaillees(progress: ProgressRow[]): LeconTravaillee[] {
  const map = new Map<string, LeconTravaillee>();
  for (const r of progress) {
    const l = map.get(r.lessonId) ?? {
      lessonId: r.lessonId,
      stars: { facile: 0, normal: 0, plus_loin: 0 },
      best: {},
      plays: 0,
      lastPlayed: 0,
    };
    l.stars[r.level] = Math.max(l.stars[r.level], r.stars);
    l.best[r.level] = Math.max(l.best[r.level] ?? 0, r.bestAccuracy);
    l.plays += r.plays;
    l.lastPlayed = Math.max(l.lastPlayed, r.lastPlayed);
    map.set(r.lessonId, l);
  }
  return [...map.values()].sort((a, b) => b.lastPlayed - a.lastPlayed);
}

/** Total des meilleures étoiles par niveau (sur les leçons travaillées) et maximum possible. */
export function etoilesParNiveau(progress: ProgressRow[]): Record<Level, { etoiles: number; max: number }> {
  const lecons = leconsTravaillees(progress);
  const out = {} as Record<Level, { etoiles: number; max: number }>;
  for (const lv of ['facile', 'normal', 'plus_loin'] as const)
    out[lv] = { etoiles: lecons.reduce((s, l) => s + l.stars[lv], 0), max: lecons.length * 3 };
  return out;
}

export interface MaitriseMatiere {
  matiere: Matiere;
  /** Maîtrise moyenne sur toutes les leçons de la matière (0..1), comme l'anneau de l'enfant. */
  maitrise: number;
  travaillees: number;
  total: number;
}

export function maitriseParMatiere(progress: ProgressRow[], lessons: Lesson[]): MaitriseMatiere[] {
  const parLecon = new Map(leconsTravaillees(progress).map((l) => [l.lessonId, l]));
  const out = new Map<Matiere, MaitriseMatiere>();
  for (const lesson of lessons) {
    const m = out.get(lesson.matiere) ?? { matiere: lesson.matiere, maitrise: 0, travaillees: 0, total: 0 };
    const t = parLecon.get(lesson.id);
    m.total++;
    if (t) {
      m.travaillees++;
      m.maitrise += mastery(t.best);
    }
    out.set(lesson.matiere, m);
  }
  return [...out.values()].map((m) => ({ ...m, maitrise: m.total ? m.maitrise / m.total : 0 }));
}

export interface CompetenceFragile {
  lessonId: string;
  correct: number;
  total: number;
  /** Taux de réussite (0..1). */
  taux: number;
  parties: number;
}

/**
 * Compétences fragiles : leçons jouées récemment (30 jours par défaut) avec assez de réponses
 * et un taux de réussite sous le seuil. Les plus fragiles en premier.
 */
export function competencesFragiles(
  attempts: AttemptRow[],
  { now = Date.now(), jours = 30, minReponses = 5, seuil = 0.7 } = {},
): CompetenceFragile[] {
  const depuis = now - jours * JOUR;
  const map = new Map<string, CompetenceFragile>();
  for (const a of attempts) {
    if (a.date < depuis || a.total <= 0) continue;
    const c = map.get(a.lessonId) ?? { lessonId: a.lessonId, correct: 0, total: 0, taux: 0, parties: 0 };
    c.correct += a.correct;
    c.total += a.total;
    c.parties++;
    map.set(a.lessonId, c);
  }
  return [...map.values()]
    .map((c) => ({ ...c, taux: c.correct / c.total }))
    .filter((c) => c.total >= minReponses && c.taux < seuil)
    .sort((a, b) => a.taux - b.taux || b.total - a.total);
}

/** Libellé lisible d'un élément suivi en répétition espacée (null si non affichable). */
export function libelleItem(itemKey: string): { type: 'mot' | 'calcul'; texte: string } | null {
  if (itemKey.startsWith('mot:')) return { type: 'mot', texte: itemKey.slice(4) };
  if (itemKey.startsWith('calc:')) return { type: 'calcul', texte: itemKey.slice(5).split('|')[0]! };
  return null;
}

/**
 * Éléments ratés à la dernière rencontre (boîte 1 de Leitner), du plus récent au plus ancien.
 * En boîte 1, l'échéance (`due`) est l'instant même de l'erreur.
 */
export function derniersRates(leitner: LeitnerRow[], type: 'mot' | 'calcul', n = 15): string[] {
  return leitner
    .filter((r) => r.box === 1)
    .sort((a, b) => b.due - a.due)
    .map((r) => libelleItem(r.itemKey))
    .filter((x): x is { type: 'mot' | 'calcul'; texte: string } => !!x && x.type === type)
    .map((x) => x.texte)
    .filter((t, i, all) => all.indexOf(t) === i)
    .slice(0, n);
}
