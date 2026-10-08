// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { addPlayTime, dayKey, getDay, grantBonus, lastDays, limitStatus, limiteDe } from './screenTime';
import { LudidactikDB } from './storage/db';

describe('temps d’écran', () => {
  it('dayKey : jour local AAAA-MM-JJ', () => {
    expect(dayKey(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
    expect(dayKey(new Date(2026, 0, 3))).toBe('2026-01-03');
  });

  it('limite par défaut 30 min, illimité possible', () => {
    expect(limiteDe({})).toBe(30);
    expect(limiteDe({ limiteMinutes: 45 })).toBe(45);
    expect(limiteDe({ limiteMinutes: null })).toBeNull();
  });

  it('limitStatus : restant, atteinte, bonus, illimité', () => {
    expect(limitStatus(30, 10 * 60_000)).toMatchObject({
      limitMs: 1_800_000,
      remainingMs: 1_200_000,
      reached: false,
    });
    expect(limitStatus(30, 30 * 60_000).reached).toBe(true);
    expect(limitStatus(30, 35 * 60_000)).toMatchObject({ remainingMs: 0, reached: true });
    expect(limitStatus(30, 35 * 60_000, 10 * 60_000)).toMatchObject({
      remainingMs: 5 * 60_000,
      reached: false,
    });
    expect(limitStatus(null, 999 * 60_000)).toMatchObject({
      limitMs: null,
      remainingMs: Infinity,
      reached: false,
    });
  });

  it('cumule le temps de jeu par jour et par profil, et le bonus parent', async () => {
    const db = new LudidactikDB('test-temps');
    const jour1 = new Date(2026, 9, 8, 10).getTime();
    const jour2 = new Date(2026, 9, 9, 10).getTime();
    await addPlayTime('p1', 60_000, jour1, db);
    await addPlayTime('p1', 30_000, jour1, db);
    await addPlayTime('p1', 15_000, jour2, db);
    await addPlayTime('p2', 99_000, jour1, db);
    await addPlayTime('p1', 0, jour1, db);
    await addPlayTime('p1', -5, jour1, db);
    expect((await getDay('p1', '2026-10-08', db))?.ms).toBe(90_000);
    expect((await getDay('p1', '2026-10-09', db))?.ms).toBe(15_000);
    expect((await getDay('p2', '2026-10-08', db))?.ms).toBe(99_000);
    await grantBonus('p1', 10, jour1, db);
    const row = await getDay('p1', '2026-10-08', db);
    expect(row).toMatchObject({ ms: 90_000, bonusMs: 600_000 });
    // la limite de 1 min est dépassée, mais le bonus de 10 min la repousse
    expect(limitStatus(1, row!.ms, row!.bonusMs).reached).toBe(false);
    db.close();
  });

  it('lastDays : 7 jours, du plus ancien à aujourd’hui, avec des zéros', () => {
    const rows = [
      { key: 'p|2026-10-08', profileId: 'p', day: '2026-10-08', ms: 120_000, bonusMs: 0 },
      { key: 'p|2026-10-05', profileId: 'p', day: '2026-10-05', ms: 60_000, bonusMs: 0 },
      { key: 'p|2026-09-20', profileId: 'p', day: '2026-09-20', ms: 60_000, bonusMs: 0 },
    ];
    const j = lastDays(rows, 7, new Date(2026, 9, 8, 12));
    expect(j.map((x) => x.day)).toEqual([
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ]);
    expect(j.map((x) => x.ms)).toEqual([0, 0, 0, 60_000, 0, 0, 120_000]);
  });
});
