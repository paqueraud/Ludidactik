// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { calculerFlamme } from '@/meta/flamme';
import { ROBES, itemIdRobe, possedeRobe, prixRobe, robeParId } from '@/meta/robes';
import {
  REGLAGE_VACANCES_DEFAUT,
  estEnVacances,
  normaliserReglage,
  periodeDuJour,
  vacancesOfficielles,
} from '@/meta/vacances';
import { acheter, acheterRobe, flammeDe, porterRobe } from './meta';
import { LudidactikDB, type Profile } from './storage/db';
import { ecrireReglageVacances, lireReglageVacances } from './vacances';

async function setup(name: string, ludis = 0) {
  const db = new LudidactikDB(name);
  const profile: Profile = {
    id: 'p',
    prenom: 'Sam',
    avatar: DEFAULT_AVATAR,
    classe: 'CE1',
    auth: { type: 'texte', hash: '', salt: '' },
    xp: 0,
    ludis,
    enCours: [],
    creeLe: 0,
    derniereConnexion: 0,
  };
  await db.profiles.add(profile);
  return db;
}

describe('robes de cheval', () => {
  it('une robe de base gratuite, les autres payantes, ids uniques', () => {
    expect(ROBES.length).toBeGreaterThanOrEqual(6);
    expect(ROBES.filter((r) => r.prix === 0)).toHaveLength(1);
    expect(new Set(ROBES.map((r) => r.id)).size).toBe(ROBES.length);
    expect(prixRobe(itemIdRobe('alezan'))).toBeUndefined();
    expect(prixRobe(itemIdRobe('licorne'))).toBe(250);
    expect(robeParId('inconnue').id).toBe('alezan');
    expect(possedeRobe('alezan', [])).toBe(true);
    expect(possedeRobe('pie', [])).toBe(false);
  });

  it('achat : solde, doublon, équipement', async () => {
    const db = await setup('robes-achat', 100);
    expect(await porterRobe('p', 'bai', db)).toBe(false); // pas encore achetée
    expect(await acheterRobe('p', 'licorne', db)).toBe('solde');
    expect(await acheterRobe('p', 'bai', db)).toBe('ok');
    let p = (await db.profiles.get('p'))!;
    expect(p.ludis).toBe(60);
    expect(p.robe).toBe('bai');
    expect(await acheterRobe('p', 'bai', db)).toBe('deja');
    expect((await db.profiles.get('p'))!.ludis).toBe(60);
    expect(await acheter('p', itemIdRobe('alezan'), db)).toBe('inconnu'); // gratuite : rien à acheter
    expect(await porterRobe('p', 'alezan', db)).toBe(true);
    expect(await porterRobe('p', 'bai', db)).toBe(true);
    p = (await db.profiles.get('p'))!;
    expect(p.robe).toBe('bai');
    db.close();
  });
});

describe('vacances scolaires et flamme', () => {
  it('dates 2026-2027 par zone, bornes incluses', () => {
    const b = REGLAGE_VACANCES_DEFAUT;
    expect(b.zone).toBe('B');
    expect(periodeDuJour('2026-10-16', b)).toBeNull();
    expect(periodeDuJour('2026-10-17', b)?.nom).toMatch(/Toussaint/);
    expect(periodeDuJour('2026-11-01', b)?.nom).toMatch(/Toussaint/);
    expect(periodeDuJour('2026-11-02', b)).toBeNull();
    // hiver : B du 20/02 au 07/03, A du 13/02 au 28/02, C du 06/02 au 21/02
    expect(periodeDuJour('2027-03-07', b)?.nom).toMatch(/hiver/);
    expect(periodeDuJour('2027-03-07', { zone: 'A', perso: [] })).toBeNull();
    expect(periodeDuJour('2027-02-06', { zone: 'C', perso: [] })?.nom).toMatch(/hiver/);
    expect(periodeDuJour('2027-02-06', b)).toBeNull();
    expect(vacancesOfficielles('aucune')).toEqual([]);
  });

  it('périodes personnalisées et relecture prudente', () => {
    const r = normaliserReglage({
      zone: 'aucune',
      perso: [
        { nom: 'Voyage', debut: '2026-09-10', fin: '2026-09-12' },
        { nom: 'x', debut: 'bad', fin: '' },
      ],
    });
    expect(r.perso).toHaveLength(1);
    const vac = estEnVacances(r);
    expect([vac('2026-09-09'), vac('2026-09-10'), vac('2026-09-12'), vac('2026-09-13')]).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(vac('2026-10-20')).toBe(false); // zone « aucune »
    expect(normaliserReglage(undefined)).toEqual(REGLAGE_VACANCES_DEFAUT);
  });

  it('la flamme traverse les vacances sans s’éteindre ni user les gels', () => {
    // Actif le vendredi 16/10, puis rien pendant toute la Toussaint (zone B).
    const sans = calculerFlamme(['2026-10-15', '2026-10-16'], '2026-11-02');
    expect(sans.jours).toBe(0);
    const avec = calculerFlamme(
      ['2026-10-15', '2026-10-16', '2026-11-02'],
      '2026-11-02',
      estEnVacances(REGLAGE_VACANCES_DEFAUT),
    );
    expect(avec.jours).toBe(3);
    expect(avec.vacances).toHaveLength(16);
    expect(avec.gelsRestants).toBe(2);
    const pendant = calculerFlamme(['2026-10-16'], '2026-10-20', estEnVacances(REGLAGE_VACANCES_DEFAUT));
    expect(pendant).toMatchObject({ jours: 1, enVacances: true, gelsRestants: 2 });
  });

  it('flammeDe lit la zone choisie par le parent', async () => {
    const db = await setup('vacances-flamme');
    await db.dailyChallenges.add({
      key: 'p|2026-10-16',
      profileId: 'p',
      day: '2026-10-16',
      defis: [
        {
          lessonId: 'l',
          gameId: 'g',
          level: 'facile',
          motif: 'en_cours',
          famille: 'ecrit',
          fait: true,
          stars: 1,
        },
      ],
    });
    expect((await lireReglageVacances(db)).zone).toBe('B');
    expect((await flammeDe('p', '2026-10-30', db)).jours).toBe(1);
    await ecrireReglageVacances({ zone: 'aucune', perso: [] }, db);
    expect((await flammeDe('p', '2026-10-30', db)).jours).toBe(0);
    db.close();
  });
});
