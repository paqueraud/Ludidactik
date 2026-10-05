// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { dueItems, saveGameResult, updateLeitner } from './results';
import { LudidactikDB } from './storage/db';

async function setup(name: string) {
  const db = new LudidactikDB(name);
  await db.profiles.add({
    id: 'p',
    prenom: 'Sam',
    avatar: DEFAULT_AVATAR,
    classe: 'CM2',
    auth: { type: 'texte', hash: '', salt: '' },
    xp: 0,
    ludis: 0,
    enCours: [],
    creeLe: 0,
    derniereConnexion: 0,
  });
  return db;
}

const summary = (score: number, correct = 10) => ({
  correct,
  total: 12,
  durationMs: 60_000,
  score,
  won: true,
  headline: '',
});

describe('enregistrement des parties', () => {
  it('garde le meilleur résultat, cumule XP et Ludis, détecte le record', async () => {
    const db = await setup('res-1');
    const base = { profileId: 'p', lessonId: 'L', gameId: 'grand-prix', level: 'normal' as const };
    const r1 = await saveGameResult({ ...base, summary: summary(500), stars: 2, xp: 100 }, db);
    expect(r1.newRecord).toBe(false); // première partie : pas de « record battu »
    const r2 = await saveGameResult({ ...base, summary: summary(800, 12), stars: 3, xp: 120 }, db);
    expect(r2.newRecord).toBe(true);
    const r3 = await saveGameResult({ ...base, summary: summary(100, 2), stars: 0, xp: 20 }, db);
    expect(r3.newRecord).toBe(false);

    const prog = await db.progress.get('p|L|grand-prix|normal');
    expect(prog).toMatchObject({ stars: 3, plays: 3, bestAccuracy: 1 });
    expect((await db.records.get('p|L|grand-prix|normal'))?.score).toBe(800);
    const p = await db.profiles.get('p');
    expect(p?.xp).toBe(240);
    expect(p?.ludis).toBe(r1.ludis + r2.ludis + r3.ludis);
    expect(await db.attempts.count()).toBe(3);
  });

  it('Leitner : une erreur rend l’item « à revoir »', async () => {
    const db = await setup('res-2');
    await updateLeitner('p', 'mot:chocolat', false, db);
    expect((await dueItems('p', db)).has('mot:chocolat')).toBe(true);
    await updateLeitner('p', 'mot:chocolat', true, db);
    expect((await db.leitner.get('p|mot:chocolat'))?.box).toBe(2);
    expect((await dueItems('p', db)).has('mot:chocolat')).toBe(false);
  });
});
