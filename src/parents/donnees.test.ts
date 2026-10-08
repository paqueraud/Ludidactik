// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { content, getLesson } from '@/content';
import { countItems, createStream } from '@/content/provider';
import { createRng } from '@/engine/rng';
import { deleteProfile } from '@/services/profiles';
import { LudidactikDB } from '@/services/storage/db';
import { saveWordList } from '@/services/wordLists';
import { DEPARTEMENTS } from './departements';

const profil = (id: string) => ({
  id,
  prenom: id,
  avatar: DEFAULT_AVATAR,
  classe: 'CE1' as const,
  auth: { type: 'texte' as const, hash: 'h', salt: 's' },
  xp: 0,
  ludis: 0,
  enCours: [],
  creeLe: 1,
  derniereConnexion: 1,
});

describe('suppression d’un profil', () => {
  it('efface ses données et les listes qui ne concernaient que lui', async () => {
    const db = new LudidactikDB('test-suppression');
    await db.profiles.bulkAdd([profil('a'), profil('b')]);
    await db.attempts.add({
      profileId: 'a',
      lessonId: 'L',
      gameId: 'g',
      level: 'normal',
      date: 1,
      correct: 1,
      total: 1,
      durationMs: 1,
    });
    await db.screenTime.put({ key: 'a|2026-10-08', profileId: 'a', day: '2026-10-08', ms: 5, bonusMs: 0 });
    await db.audio.put({ key: 'parent:seule:1', blob: new Blob(['x']), mime: 'audio/webm' });
    const liste = (id: string, profileIds: string[], mot: string, audioKey?: string) => ({
      id,
      titre: id,
      profileIds,
      mots: [{ mot, audioKey }],
      creeLe: 1,
    });
    await saveWordList(liste('seule', ['a'], 'chat', 'parent:seule:1'), db);
    await saveWordList(liste('deux', ['a', 'b'], 'chien'), db);
    await saveWordList(liste('tous', [], 'lapin'), db);
    await deleteProfile('a', db);
    expect(await db.profiles.count()).toBe(1);
    expect(await db.attempts.count()).toBe(0);
    expect(await db.screenTime.count()).toBe(0);
    expect(await db.wordLists.get('seule')).toBeUndefined();
    expect(await db.audio.count()).toBe(0);
    expect((await db.wordLists.get('deux'))?.profileIds).toEqual(['b']);
    expect((await db.wordLists.get('tous'))?.profileIds).toEqual([]);
    db.close();
  });

  it('enregistrer une liste supprime l’audio des mots retirés', async () => {
    const db = new LudidactikDB('test-liste-audio');
    await db.audio.bulkPut([
      { key: 'k1', blob: new Blob(['1']), mime: 'audio/webm' },
      { key: 'k2', blob: new Blob(['2']), mime: 'audio/webm' },
    ]);
    const l = {
      id: 'l',
      titre: 'T',
      profileIds: [],
      creeLe: 1,
      mots: [
        { mot: 'un', audioKey: 'k1' },
        { mot: 'deux', audioKey: 'k2' },
      ],
    };
    await saveWordList(l, db);
    await saveWordList({ ...l, mots: [{ mot: 'un', audioKey: 'k1' }] }, db);
    expect((await db.audio.toArray()).map((a) => a.key)).toEqual(['k1']);
    expect((await db.wordLists.get('l'))?.modifieLe).toBeGreaterThan(0);
    db.close();
  });
});

describe('filtre « puberté » du fournisseur d’items', () => {
  it('masque les items meta.puberte quand le réglage parent le demande', () => {
    const lecons = [...content.lessons.values()].filter(
      (l) => l.classe === 'CM2' && l.matiere === 'sciences',
    );
    let trouve = false;
    for (const l of lecons) {
      for (const kind of ['mcq', 'true_false'] as const) {
        for (const level of ['facile', 'normal', 'plus_loin'] as const) {
          const avec = createStream(content, l, kind, level, createRng(1), { parentLists: [] });
          if (!avec?.size) continue;
          const items = Array.from({ length: avec.size }, () => avec.next());
          if (!items.some((i) => i.meta?.puberte === true)) continue;
          trouve = true;
          const ctx = { parentLists: [], masquerPuberte: true };
          const sans = createStream(content, l, kind, level, createRng(1), ctx);
          const n = sans?.size ?? 0;
          expect(n).toBeLessThan(avec.size);
          const items2 = Array.from({ length: n * 2 }, () => sans!.next());
          expect(items2.some((i) => i.meta?.puberte === true)).toBe(false);
          expect(countItems(content, l, kind, level, createRng(1), ctx)).toBe(n);
        }
      }
    }
    expect(trouve).toBe(true);
  });

  it('la leçon « Mes mots de la semaine » reçoit les listes parentales', () => {
    const l = getLesson('CE1.FR.ORTH.LISTES_PARENTS')!;
    const mots = ['maison', 'chocolat', 'école', 'jardin', 'Paris'].map((mot) => ({ mot }));
    const ctx = { parentLists: [{ id: 'x', titre: 'T', profileIds: [], creeLe: 1, mots }] };
    expect(countItems(content, l, 'spelling_word', 'normal', createRng(1), ctx)).toBe(5);
  });
});

describe('départements', () => {
  it('101 départements, codes uniques', () => {
    expect(DEPARTEMENTS).toHaveLength(101);
    expect(new Set(DEPARTEMENTS.map(([c]) => c)).size).toBe(101);
  });
});
