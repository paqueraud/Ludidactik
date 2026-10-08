/**
 * Temps d'écran (GAMIFICATION §8) : on compte le temps de jeu réel (parties en cours, hors pause et
 * onglet masqué), par profil et par jour. La limite quotidienne est réglée par le parent ; une fois
 * atteinte, on laisse finir la partie en cours puis on affiche une pause douce.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LIMITE_PAR_DEFAUT,
  type LudidactikDB,
  type Profile,
  type ScreenTimeRow,
  db as defaultDb,
} from './storage/db';

/** Jour local au format AAAA-MM-JJ. */
export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

const rowKey = (profileId: string, day: string) => `${profileId}|${day}`;

/** Limite effective d'un profil en minutes (null = illimité). */
export const limiteDe = (p: Pick<Profile, 'limiteMinutes'>): number | null =>
  p.limiteMinutes === undefined ? LIMITE_PAR_DEFAUT : p.limiteMinutes;

export interface LimitStatus {
  /** Limite du jour en ms, bonus compris (null = illimité). */
  limitMs: number | null;
  usedMs: number;
  /** Temps restant (Infinity si illimité). */
  remainingMs: number;
  reached: boolean;
}

/** Fonction pure : état de la limite à partir des minutes autorisées, du temps joué et du bonus. */
export function limitStatus(limiteMinutes: number | null, usedMs: number, bonusMs = 0): LimitStatus {
  if (limiteMinutes === null) return { limitMs: null, usedMs, remainingMs: Infinity, reached: false };
  const limitMs = limiteMinutes * 60_000 + bonusMs;
  const remainingMs = Math.max(0, limitMs - usedMs);
  return { limitMs, usedMs, remainingMs, reached: remainingMs <= 0 };
}

/** Ajoute du temps de jeu au jour donné (par défaut aujourd'hui). */
export async function addPlayTime(
  profileId: string,
  ms: number,
  when: number = Date.now(),
  db: LudidactikDB = defaultDb,
): Promise<void> {
  if (!(ms > 0)) return;
  const day = dayKey(when);
  const key = rowKey(profileId, day);
  await db.transaction('rw', db.screenTime, async () => {
    const row = await db.screenTime.get(key);
    await db.screenTime.put({
      key,
      profileId,
      day,
      ms: (row?.ms ?? 0) + Math.round(ms),
      bonusMs: row?.bonusMs ?? 0,
    });
  });
}

/** Le parent accorde des minutes supplémentaires pour aujourd'hui. */
export async function grantBonus(
  profileId: string,
  minutes: number,
  when: number = Date.now(),
  db: LudidactikDB = defaultDb,
): Promise<void> {
  const day = dayKey(when);
  const key = rowKey(profileId, day);
  await db.transaction('rw', db.screenTime, async () => {
    const row = await db.screenTime.get(key);
    await db.screenTime.put({
      key,
      profileId,
      day,
      ms: row?.ms ?? 0,
      bonusMs: (row?.bonusMs ?? 0) + minutes * 60_000,
    });
  });
}

export async function getDay(
  profileId: string,
  day: string = dayKey(),
  db: LudidactikDB = defaultDb,
): Promise<ScreenTimeRow | undefined> {
  return db.screenTime.get(rowKey(profileId, day));
}

/** Les `n` derniers jours (du plus ancien à aujourd'hui), avec 0 pour les jours sans jeu. */
export function lastDays(
  rows: ScreenTimeRow[],
  n = 7,
  today: Date = new Date(),
): { day: string; ms: number }[] {
  const byDay = new Map(rows.map((r) => [r.day, r.ms]));
  const out: { day: string; ms: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = dayKey(d);
    out.push({ day, ms: byDay.get(day) ?? 0 });
  }
  return out;
}

/** État de la limite du profil pour aujourd'hui (mis à jour en direct). */
export function useLimitStatus(profile: Profile | null | undefined): LimitStatus | undefined {
  const id = profile?.id;
  const limite = profile ? limiteDe(profile) : null;
  return useLiveQuery(async () => {
    if (!id) return undefined;
    const row = await getDay(id);
    return limitStatus(limite, row?.ms ?? 0, row?.bonusMs ?? 0);
  }, [id, limite]);
}

/** Durée lisible : « 12 min », « 1 h 05 ». */
export function formatDuree(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
