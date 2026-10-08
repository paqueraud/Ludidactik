// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { exportBackup } from './backup';
import {
  acheter,
  apresPartie,
  defisDuJour,
  flammeDe,
  ouvrirCoffre,
  synchroniserGemmes,
  verifierBadges,
  victoireBoss,
} from './meta';
import { saveGameResult } from './results';
import { LudidactikDB, type Profile } from './storage/db';

const OPTS = { programmeHG: '2020' as const, micro: false, masquerPuberte: true };

async function setup(name: string, over: Partial<Profile> = {}) {
  const db = new LudidactikDB(name);
  const profile: Profile = {
    id: 'p',
    prenom: 'Sam',
    avatar: DEFAULT_AVATAR,
    classe: 'CE1',
    auth: { type: 'texte', hash: '', salt: '' },
    xp: 0,
    ludis: 0,
    enCours: ['CE1.MA.CM.TABLES_ADD'],
    creeLe: 0,
    derniereConnexion: 0,
    ...over,
  };
  await db.profiles.add(profile);
  return { db, profile };
}

const summary = (correct: number, total = 10) => ({
  correct,
  total,
  durationMs: 60_000,
  score: correct * 100,
  won: correct === total,
  headline: '',
});

describe('défis du jour (base)', () => {
  it('tirés une fois par jour, sur la leçon en cours, puis validés en jouant', async () => {
    const { db, profile } = await setup('meta-defis');
    const day = '2026-10-08';
    const row = await defisDuJour(profile, OPTS, day, db);
    expect(row.defis).toHaveLength(3);
    expect(row.defis[0]!.lessonId).toBe('CE1.MA.CM.TABLES_ADD');
    expect(new Set(row.defis.map((d) => d.famille)).size).toBe(3);
    // relu tel quel (même si le profil change entre-temps)
    expect(await defisDuJour({ ...profile, enCours: [] }, OPTS, day, db)).toEqual(row);

    // une partie à 0 étoile ne valide pas
    const d0 = row.defis[0]!;
    expect(
      (await apresPartie({ profileId: 'p', lessonId: d0.lessonId, gameId: d0.gameId, stars: 0 }, day, db))
        .defi,
    ).toBeNull();
    const r = await apresPartie(
      { profileId: 'p', lessonId: d0.lessonId, gameId: d0.gameId, stars: 2 },
      day,
      db,
    );
    expect(r.defi).toMatchObject({ numero: 1, faits: 1, total: 3 });
    expect((await db.profiles.get('p'))!.ludis).toBe(10);
    expect((await flammeDe('p', day, db)).jours).toBe(1);

    // coffre fermé tant que les 3 défis ne sont pas réussis
    expect(await ouvrirCoffre('p', day, db)).toBeNull();
    for (const d of row.defis.slice(1))
      await apresPartie({ profileId: 'p', lessonId: d.lessonId, gameId: d.gameId, stars: 1 }, day, db);
    const coffre = await ouvrirCoffre('p', day, db);
    expect(coffre?.objet).toBeTruthy();
    expect(await db.inventory.get(`p|${coffre!.objet}`)).toMatchObject({ source: 'coffre' });
    const ludis = (await db.profiles.get('p'))!.ludis;
    expect(ludis).toBe(30 + 30);
    // un coffre ne s'ouvre qu'une fois
    expect(await ouvrirCoffre('p', day, db)).toEqual(coffre);
    expect((await db.profiles.get('p'))!.ludis).toBe(ludis);
    expect(await db.badges.get('p|chasseur_tresors')).toBeTruthy();
    db.close();
  });

  it('le boss du week-end rapporte une fois et entretient la flamme', async () => {
    const { db } = await setup('meta-boss');
    const r1 = await victoireBoss('p', '2026-10-10', db);
    expect(r1.ludis).toBe(40);
    expect(r1.badges).toContain('dompteur');
    expect((await victoireBoss('p', '2026-10-10', db)).ludis).toBe(0);
    expect((await flammeDe('p', '2026-10-10', db)).jours).toBe(1);
    db.close();
  });
});

describe('boutique', () => {
  it('achète avec les Ludis, sans doublon ni solde négatif', async () => {
    const { db } = await setup('meta-boutique', { ludis: 100 });
    expect(await acheter('p', 'licorne', db)).toBe('inconnu');
    expect(await acheter('p', 'chapeau_magicien', db)).toBe('inconnu'); // trésor du coffre : pas à vendre
    expect(await acheter('p', 'couronne', db)).toBe('solde');
    expect(await acheter('p', 'casque_jockey', db)).toBe('ok');
    expect((await db.profiles.get('p'))!.ludis).toBe(20);
    expect(await acheter('p', 'casque_jockey', db)).toBe('deja');
    expect((await db.profiles.get('p'))!.ludis).toBe(20);
    expect(await db.inventory.where('profileId').equals('p').count()).toBe(1);
    db.close();
  });
});

describe('gemmes et badges en fin de partie', () => {
  it('une leçon maîtrisée à 80 % rapporte une seule gemme', async () => {
    const { db } = await setup('meta-gemmes');
    const base = { profileId: 'p', lessonId: 'CE1.MA.CM.TABLES_ADD', gameId: 'grand-prix' };
    await saveGameResult({ ...base, level: 'normal', summary: summary(10), stars: 3, xp: 100 }, db);
    // Normal seul : maîtrise 2/3,5 ≈ 57 % → pas encore de gemme
    expect(await synchroniserGemmes('p', db)).toEqual([]);
    await saveGameResult({ ...base, level: 'plus_loin', summary: summary(9), stars: 2, xp: 100 }, db);
    const r = await apresPartie({ ...base, stars: 2 }, '2026-10-08', db);
    expect(r.gemme).toBe(base.lessonId);
    expect(r.badges).toEqual(expect.arrayContaining(['premier_galop', 'batisseur', 'triple_etoile']));
    expect((await apresPartie({ ...base, stars: 2 }, '2026-10-08', db)).gemme).toBeNull();
    expect(await verifierBadges('p', db)).toEqual([]);
    // l'XP et la victoire sont gardées dans le journal (classement hebdomadaire, badges)
    const a = await db.attempts.toArray();
    expect(a[0]).toMatchObject({ xp: 100, stars: 3, won: true });
    db.close();
  });

  it('les nouvelles tables font partie de la sauvegarde', async () => {
    const { db } = await setup('meta-backup', { ludis: 200 });
    await acheter('p', 'robot', db);
    const b = await exportBackup(db);
    expect(b.tables.inventory).toHaveLength(1);
    expect(Object.keys(b.tables)).toEqual(expect.arrayContaining(['dailyChallenges', 'badges', 'gems']));
    db.close();
  });
});
