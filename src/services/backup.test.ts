// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { exportBackup, importBackup } from './backup';
import { LudidactikDB } from './storage/db';

describe('sauvegarde', () => {
  it('exporte puis réimporte profils, progression et audio', async () => {
    const a = new LudidactikDB('test-export');
    await a.profiles.add({
      id: 'p1',
      prenom: 'Lina',
      avatar: DEFAULT_AVATAR,
      classe: 'CE1',
      auth: { type: 'texte', hash: 'h', salt: 's' },
      xp: 120,
      ludis: 40,
      enCours: ['CE1.MA.CM.PLUS9'],
      creeLe: 1,
      derniereConnexion: 2,
    });
    await a.progress.put({
      key: 'p1|L|g|normal',
      profileId: 'p1',
      lessonId: 'L',
      gameId: 'g',
      level: 'normal',
      stars: 2,
      bestAccuracy: 0.85,
      plays: 3,
      lastPlayed: 5,
    });
    await a.audio.put({
      key: 'son1',
      mime: 'audio/webm',
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }),
    });

    const backup = JSON.parse(JSON.stringify(await exportBackup(a)));
    const b = new LudidactikDB('test-import');
    await importBackup(backup, { remplacer: true }, b);

    expect((await b.profiles.get('p1'))?.prenom).toBe('Lina');
    expect((await b.progress.get('p1|L|g|normal'))?.stars).toBe(2);
    const audio = await b.audio.get('son1');
    expect(audio?.mime).toBe('audio/webm');
    expect(audio?.blob.size).toBe(3);
  });

  it('refuse un fichier qui n’est pas une sauvegarde', async () => {
    await expect(
      importBackup({ foo: 1 }, { remplacer: false }, new LudidactikDB('test-bad')),
    ).rejects.toThrow();
  });
});
