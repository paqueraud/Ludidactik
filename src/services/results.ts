/** Enregistrement d'une fin de partie et répétition espacée (Leitner 5 boîtes). */
import type { Level } from '@/content/schemas';
import type { GameSummary } from '@/engine/GameModule';
import { ludisForGame } from '@/engine/score';
import { type LudidactikDB, db as defaultDb, progressKey } from './storage/db';

export interface SavedResult {
  stars: number;
  xp: number;
  ludis: number;
  newRecord: boolean;
  previousBest: number | null;
}

export async function saveGameResult(
  args: {
    profileId: string;
    lessonId: string;
    gameId: string;
    level: Level;
    summary: GameSummary;
    stars: number;
    xp: number;
  },
  db: LudidactikDB = defaultDb,
): Promise<SavedResult> {
  const { profileId, lessonId, gameId, level, summary, stars, xp } = args;
  const key = progressKey(profileId, lessonId, gameId, level);
  const now = Date.now();
  const accuracy = summary.total ? summary.correct / summary.total : 0;
  let result: SavedResult = { stars, xp, ludis: 0, newRecord: false, previousBest: null };

  await db.transaction('rw', [db.progress, db.records, db.attempts, db.profiles], async () => {
    const prev = await db.progress.get(key);
    await db.progress.put({
      key,
      profileId,
      lessonId,
      gameId,
      level,
      stars: Math.max(prev?.stars ?? 0, stars),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
      plays: (prev?.plays ?? 0) + 1,
      lastPlayed: now,
    });

    const rec = await db.records.get(key);
    const newRecord = summary.total > 0 && (!rec || summary.score > rec.score);
    if (newRecord)
      await db.records.put({
        key,
        profileId,
        lessonId,
        gameId,
        level,
        score: summary.score,
        durationMs: summary.durationMs,
        ghost: summary.ghost,
        date: now,
      });

    await db.attempts.add({
      profileId,
      lessonId,
      gameId,
      level,
      date: now,
      correct: summary.correct,
      total: summary.total,
      durationMs: summary.durationMs,
    });

    const ludis = ludisForGame(stars, summary.won, newRecord && !!rec);
    const profile = await db.profiles.get(profileId);
    if (profile) await db.profiles.update(profileId, { xp: profile.xp + xp, ludis: profile.ludis + ludis });
    result = { stars, xp, ludis, newRecord: newRecord && !!rec, previousBest: rec?.score ?? null };
  });
  return result;
}

/** Délai avant de revoir un item, selon sa boîte (1 = à revoir tout de suite … 5 = dans 8 jours). */
const LEITNER_DELAIS_JOURS = [0, 1, 2, 4, 8];

/** Juste → boîte suivante ; faux → boîte 1 (l'item revient vite). */
export async function updateLeitner(
  profileId: string,
  itemKey: string,
  correct: boolean,
  db: LudidactikDB = defaultDb,
) {
  const key = `${profileId}|${itemKey}`;
  const row = await db.leitner.get(key);
  const box = correct ? Math.min(5, (row?.box ?? 1) + 1) : 1;
  // Un item jamais raté et juste du premier coup n'a pas besoin d'être suivi.
  if (!row && correct) return;
  await db.leitner.put({
    key,
    profileId,
    itemKey,
    box,
    due: Date.now() + LEITNER_DELAIS_JOURS[box - 1]! * 86_400_000,
  });
}

/** Items à revoir aujourd'hui pour ce profil. */
export async function dueItems(profileId: string, db: LudidactikDB = defaultDb): Promise<Set<string>> {
  const now = Date.now();
  const rows = await db.leitner
    .where('profileId')
    .equals(profileId)
    .filter((r) => r.due <= now)
    .toArray();
  return new Set(rows.map((r) => r.itemKey));
}
