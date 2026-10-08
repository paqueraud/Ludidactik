/**
 * Méta-jeu (Phase 5) côté données : défis du jour, coffre, boss du week-end, flamme, badges,
 * boutique d'avatar, gemmes de l'île. Les règles pures sont dans `src/meta/` (testées à part).
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { BOUTIQUE, COFFRE } from '@/avatar/parts';
import { getLesson, lessonsOf, type ProgrammeHG } from '@/content';
import type { ProviderContext } from '@/content/provider';
import type { Classe, Lesson, Level } from '@/content/schemas';
import { mastery } from '@/engine/score';
import { createRng } from '@/engine/rng';
import { GAMES, gamesForLesson } from '@/games/registry';
import { LECONS_TABLES, type StatsBadges, badgesObtenus } from '@/meta/badges';
import { addDays, dayKey, estWeekEnd, hashSeed, periodeActuelle } from '@/meta/dates';
import { LUDIS_BOSS, LUDIS_PAR_DEFI, type LeconCandidate, contenuCoffre, tirerDefis } from '@/meta/defis';
import { calculerFlamme } from '@/meta/flamme';
import { SEUIL_GEMME } from '@/meta/ile';
import { lessonSummary } from './profiles';
import {
  type CoffreContenu,
  type DailyChallengeRow,
  type LudidactikDB,
  type Profile,
  type ProgressRow,
  db as defaultDb,
} from './storage/db';
import { listesDuProfil } from './wordLists';

const JOUR_MS = 86_400_000;

export interface OptionsMeta {
  programmeHG: ProgrammeHG;
  micro: boolean;
  masquerPuberte: boolean;
}

/* ------------------------------------------------------------------ */
/* Défis du jour                                                       */
/* ------------------------------------------------------------------ */

const rowKey = (profileId: string, day: string) => `${profileId}|${day}`;

/** Niveau proposé : Facile tant que la leçon n'est ni réussie en Normal ni bien réussie en Facile. */
function niveauPropose(rows: ProgressRow[]): Level {
  const { stars } = lessonSummary(rows);
  return stars.normal >= 1 || stars.facile >= 2 ? 'normal' : 'facile';
}

async function providerContext(profile: Profile, opts: OptionsMeta, db: LudidactikDB) {
  const ctx: ProviderContext = {
    parentLists: listesDuProfil(await db.wordLists.toArray(), profile.id),
    masquerPuberte: opts.masquerPuberte,
  };
  return ctx;
}

/** Prépare les tiroirs du tirage (leçons en cours, à revoir, anciennes, de la période). */
export async function candidatsDefis(
  profile: Profile,
  day: string,
  opts: OptionsMeta,
  db: LudidactikDB = defaultDb,
) {
  const ctx = await providerContext(profile, opts, db);
  const visibles = lessonsOf(profile.classe, opts.programmeHG);
  const visibleIds = new Set(visibles.map((l) => l.id));
  const progress = await db.progress.where('profileId').equals(profile.id).toArray();
  const parLecon = new Map<string, ProgressRow[]>();
  for (const r of progress) parLecon.set(r.lessonId, [...(parLecon.get(r.lessonId) ?? []), r]);

  const memo = new Map<string, LeconCandidate>();
  const candidat = (l: Lesson): LeconCandidate => {
    let c = memo.get(l.id);
    if (!c) {
      c = {
        id: l.id,
        niveau: niveauPropose(parLecon.get(l.id) ?? []),
        jeux: gamesForLesson(l, ctx).map(({ game }) => ({
          id: game.id,
          modalites: game.modalites,
          needsMic: game.needsMic,
        })),
      };
      memo.set(l.id, c);
    }
    return c;
  };
  const lecon = (id: string) => (visibleIds.has(id) ? getLesson(id) : undefined);
  const rng = createRng(hashSeed(`${profile.id}|${day}|tiroirs`));

  const enCours = profile.enCours.map(lecon).filter((l): l is Lesson => !!l);

  const now = new Date(`${day}T12:00:00`).getTime();
  const dus = (await db.leitner.where('profileId').equals(profile.id).toArray()).filter(
    (r) => r.due <= now && r.lessonId && visibleIds.has(r.lessonId),
  );
  const compte = new Map<string, number>();
  for (const r of dus) compte.set(r.lessonId!, (compte.get(r.lessonId!) ?? 0) + 1);
  const aRevoir = [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => lecon(id))
    .filter((l): l is Lesson => !!l);

  const p = periodeActuelle(new Date(now));
  const dernierJeu = (id: string) => Math.max(0, ...(parLecon.get(id) ?? []).map((r) => r.lastPlayed));
  const jouesIlYaLongtemps = visibles
    .filter((l) => parLecon.has(l.id) && dernierJeu(l.id) <= now - 7 * JOUR_MS)
    .sort((a, b) => dernierJeu(a.id) - dernierJeu(b.id));
  const periodesPassees = rng.shuffle(
    visibles.filter((l) => !l.periodes.includes(p) && Math.min(...l.periodes) < p),
  );
  const anciennes = [...jouesIlYaLongtemps, ...periodesPassees].slice(0, 6);
  const periode = rng.shuffle(visibles.filter((l) => l.periodes.includes(p))).slice(0, 12);

  return {
    enCours: enCours.map(candidat),
    aRevoir: aRevoir.map(candidat),
    anciennes: anciennes.map(candidat),
    periode: periode.map(candidat),
  };
}

/** Défis du jour : tirés et enregistrés à la première visite de la journée, puis relus. */
export async function defisDuJour(
  profile: Profile,
  opts: OptionsMeta,
  day: string = dayKey(),
  db: LudidactikDB = defaultDb,
): Promise<DailyChallengeRow> {
  const key = rowKey(profile.id, day);
  const existant = await db.dailyChallenges.get(key);
  if (existant) return existant;
  const tiroirs = await candidatsDefis(profile, day, opts, db);
  const defis = tirerDefis({ profileId: profile.id, day, micro: opts.micro, ...tiroirs });
  const row: DailyChallengeRow = { key, profileId: profile.id, day, defis };
  // un autre onglet a pu tirer entre-temps : le premier enregistrement gagne
  await db.transaction('rw', db.dailyChallenges, async () => {
    if (!(await db.dailyChallenges.get(key))) await db.dailyChallenges.add(row);
  });
  return (await db.dailyChallenges.get(key)) ?? row;
}

export const defisFaits = (row: DailyChallengeRow | undefined) =>
  row?.defis.filter((d) => d.fait).length ?? 0;
export const coffrePret = (row: DailyChallengeRow | undefined) =>
  !!row && row.defis.length > 0 && row.defis.every((d) => d.fait) && !row.coffre;

/** Ouvre le coffre (une seule fois par jour, les 3 défis réussis) : Ludis + objet « trésor ». */
export async function ouvrirCoffre(
  profileId: string,
  day: string = dayKey(),
  db: LudidactikDB = defaultDb,
): Promise<CoffreContenu | null> {
  let contenu = null as CoffreContenu | null;
  await db.transaction('rw', [db.dailyChallenges, db.inventory, db.profiles], async () => {
    const row = await db.dailyChallenges.get(rowKey(profileId, day));
    if (!row || !row.defis.length || !row.defis.every((d) => d.fait)) return;
    if (row.coffre) {
      contenu = row.coffre;
      return;
    }
    const possedes = new Set(
      (await db.inventory.where('profileId').equals(profileId).toArray()).map((i) => i.itemId),
    );
    const c = contenuCoffre(profileId, day, COFFRE, possedes);
    await db.dailyChallenges.update(row.key, { coffre: c });
    if (c.objet)
      await db.inventory.put({
        key: `${profileId}|${c.objet}`,
        profileId,
        itemId: c.objet,
        source: 'coffre',
        date: Date.now(),
      });
    const p = await db.profiles.get(profileId);
    if (p) await db.profiles.update(profileId, { ludis: p.ludis + c.ludis });
    contenu = c;
  });
  if (contenu) await verifierBadges(profileId, db);
  return contenu;
}

/* ------------------------------------------------------------------ */
/* Boss du week-end                                                    */
/* ------------------------------------------------------------------ */

/** Leçon des tables utilisée par le Dragon des tables, selon la classe. */
export const LECON_BOSS: Partial<Record<Classe, string>> = {
  CE1: 'CE1.MA.CM.TABLES_MULT',
  CM2: 'CM2.MA.CM.FAITS',
};
export const NB_COUPS_BOSS = 30;

export const bossDisponible = (classe: Classe, day: string = dayKey()) =>
  estWeekEnd(day) && !!LECON_BOSS[classe] && !!getLesson(LECON_BOSS[classe]!);

/** Le dragon est vaincu : Ludis (une fois par jour) ; compte pour la flamme. */
export async function victoireBoss(
  profileId: string,
  day: string = dayKey(),
  db: LudidactikDB = defaultDb,
): Promise<{ ludis: number; badges: string[] }> {
  let ludis = 0;
  await db.transaction('rw', [db.dailyChallenges, db.profiles], async () => {
    const key = rowKey(profileId, day);
    const row = await db.dailyChallenges.get(key);
    if (row?.boss?.gagne) return;
    const boss = { gagne: true, date: Date.now() };
    if (row) await db.dailyChallenges.update(key, { boss });
    else await db.dailyChallenges.add({ key, profileId, day, defis: [], boss });
    const p = await db.profiles.get(profileId);
    if (p) await db.profiles.update(profileId, { ludis: p.ludis + LUDIS_BOSS });
    ludis = LUDIS_BOSS;
  });
  return { ludis, badges: await verifierBadges(profileId, db) };
}

/* ------------------------------------------------------------------ */
/* Fin de partie : défi validé, gemme, badges                          */
/* ------------------------------------------------------------------ */

export interface ApresPartie {
  /** Défi du jour validé par cette partie. */
  defi: { numero: number; faits: number; total: number; ludis: number } | null;
  /** Nouvelle gemme de maîtrise (id de leçon). */
  gemme: string | null;
  /** Badges obtenus à l'instant. */
  badges: string[];
}

export async function apresPartie(
  args: { profileId: string; lessonId: string; gameId: string; stars: number },
  day: string = dayKey(),
  db: LudidactikDB = defaultDb,
): Promise<ApresPartie> {
  const { profileId, lessonId, gameId, stars } = args;
  let defi = null as ApresPartie['defi'];
  if (stars >= 1)
    await db.transaction('rw', [db.dailyChallenges, db.profiles], async () => {
      const row = await db.dailyChallenges.get(rowKey(profileId, day));
      if (!row) return;
      const i = row.defis.findIndex((d) => !d.fait && d.lessonId === lessonId && d.gameId === gameId);
      if (i < 0) return;
      const defis = row.defis.map((d, j) => (j === i ? { ...d, fait: true, stars } : d));
      await db.dailyChallenges.update(row.key, { defis });
      const p = await db.profiles.get(profileId);
      if (p) await db.profiles.update(profileId, { ludis: p.ludis + LUDIS_PAR_DEFI });
      defi = {
        numero: i + 1,
        faits: defis.filter((d) => d.fait).length,
        total: defis.length,
        ludis: LUDIS_PAR_DEFI,
      };
    });
  const gemmes = await synchroniserGemmes(profileId, db, [lessonId]);
  const badges = await verifierBadges(profileId, db);
  return { defi, gemme: gemmes[0] ?? null, badges };
}

/* ------------------------------------------------------------------ */
/* Gemmes de l'île                                                     */
/* ------------------------------------------------------------------ */

/** Maîtrise (0..1) d'une leçon à partir de ses lignes de progression. */
export const maitriseLecon = (rows: ProgressRow[]) => mastery(lessonSummary(rows).best);

/**
 * Donne une gemme à chaque leçon maîtrisée à 80 % qui n'en a pas encore (jamais retirée ensuite).
 * `seulement` limite la vérification à quelques leçons (fin de partie).
 */
export async function synchroniserGemmes(
  profileId: string,
  db: LudidactikDB = defaultDb,
  seulement?: string[],
): Promise<string[]> {
  const nouvelles: string[] = [];
  await db.transaction('rw', [db.progress, db.gems], async () => {
    const rows = seulement
      ? (
          await Promise.all(
            seulement.map((l) => db.progress.where('[profileId+lessonId]').equals([profileId, l]).toArray()),
          )
        ).flat()
      : await db.progress.where('profileId').equals(profileId).toArray();
    const parLecon = new Map<string, ProgressRow[]>();
    for (const r of rows) parLecon.set(r.lessonId, [...(parLecon.get(r.lessonId) ?? []), r]);
    const deja = new Set(
      (await db.gems.where('profileId').equals(profileId).toArray()).map((g) => g.lessonId),
    );
    for (const [lessonId, rs] of parLecon) {
      if (deja.has(lessonId) || maitriseLecon(rs) < SEUIL_GEMME) continue;
      await db.gems.put({ key: `${profileId}|${lessonId}`, profileId, lessonId, date: Date.now() });
      nouvelles.push(lessonId);
    }
  });
  return nouvelles;
}

/* ------------------------------------------------------------------ */
/* Flamme                                                              */
/* ------------------------------------------------------------------ */

const jourActif = (r: DailyChallengeRow) => r.defis.some((d) => d.fait) || !!r.boss?.gagne;

export async function flammeDe(profileId: string, today: string = dayKey(), db: LudidactikDB = defaultDb) {
  const rows = await db.dailyChallenges.where('profileId').equals(profileId).toArray();
  return calculerFlamme(
    rows.filter(jourActif).map((r) => r.day),
    today,
  );
}

/** Jours où un défi (ou le boss) a été réussi. */
export function useJoursActifs(profileId: string | undefined): Set<string> | undefined {
  return useLiveQuery(async () => {
    if (!profileId) return new Set<string>();
    const rows = await defaultDb.dailyChallenges.where('profileId').equals(profileId).toArray();
    return new Set(rows.filter(jourActif).map((r) => r.day));
  }, [profileId]);
}

export function useFlamme(profileId: string | undefined) {
  return useLiveQuery(async () => (profileId ? flammeDe(profileId) : undefined), [profileId]);
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const ID_JEUX_DICTEE = new Set(
  GAMES.filter((g) => g.accepts.includes('spelling_word') && g.modalites.includes('ecouter')).map(
    (g) => g.id,
  ),
);
const ID_JEUX_ORAUX = new Set(GAMES.filter((g) => g.modalites.includes('parler')).map((g) => g.id));

export async function statsBadges(profileId: string, db: LudidactikDB = defaultDb): Promise<StatsBadges> {
  const [profile, attempts, progress, journees, gemmes, objets] = await Promise.all([
    db.profiles.get(profileId),
    db.attempts.where('profileId').equals(profileId).toArray(),
    db.progress.where('profileId').equals(profileId).toArray(),
    db.dailyChallenges.where('profileId').equals(profileId).toArray(),
    db.gems.where('profileId').equals(profileId).count(),
    db.inventory.where('profileId').equals(profileId).count(),
  ]);
  const partiesParJeu: Record<string, number> = {};
  const victoiresParJeu: Record<string, number> = {};
  let motsDicteeJustes = 0;
  let partiesOrales = 0;
  let troisEtoiles = 0;
  const matieres = new Set<string>();
  for (const a of attempts) {
    partiesParJeu[a.gameId] = (partiesParJeu[a.gameId] ?? 0) + 1;
    if (a.won) victoiresParJeu[a.gameId] = (victoiresParJeu[a.gameId] ?? 0) + 1;
    if (ID_JEUX_DICTEE.has(a.gameId)) motsDicteeJustes += a.correct;
    if (ID_JEUX_ORAUX.has(a.gameId)) partiesOrales++;
    if ((a.stars ?? 0) >= 3) troisEtoiles++;
    const m = getLesson(a.lessonId)?.matiere;
    if (m) matieres.add(m === 'questionner_le_monde' ? 'sciences' : m);
  }
  const tables = LECONS_TABLES[profile?.classe ?? ''] ?? [];
  const tablesTroisEtoiles = tables.filter((id) =>
    progress.some((r) => r.lessonId === id && r.level === 'normal' && r.stars >= 3),
  ).length;
  const today = dayKey();
  const flamme = calculerFlamme(
    journees.filter(jourActif).map((r) => r.day),
    today,
  ).jours;
  return {
    partiesParJeu,
    victoiresParJeu,
    motsDicteeJustes,
    partiesOrales,
    jeuxDifferents: Object.keys(partiesParJeu).length,
    troisEtoiles,
    tablesTroisEtoiles,
    tablesTotal: tables.length,
    matieres: matieres.size,
    defisReussis: journees.reduce((n, j) => n + j.defis.filter((d) => d.fait).length, 0),
    coffres: journees.filter((j) => j.coffre).length,
    bossGagnes: journees.filter((j) => j.boss?.gagne).length,
    flamme,
    gemmes,
    objets,
  };
}

/** Attribue les badges nouvellement mérités ; renvoie leurs identifiants. */
export async function verifierBadges(profileId: string, db: LudidactikDB = defaultDb): Promise<string[]> {
  const stats = await statsBadges(profileId, db);
  const merites = badgesObtenus(stats);
  const nouveaux: string[] = [];
  await db.transaction('rw', db.badges, async () => {
    const deja = new Set(
      (await db.badges.where('profileId').equals(profileId).toArray()).map((b) => b.badgeId),
    );
    for (const id of merites) {
      if (deja.has(id)) continue;
      await db.badges.put({ key: `${profileId}|${id}`, profileId, badgeId: id, date: Date.now() });
      nouveaux.push(id);
    }
  });
  return nouveaux;
}

/* ------------------------------------------------------------------ */
/* Boutique                                                            */
/* ------------------------------------------------------------------ */

export type ResultatAchat = 'ok' | 'deja' | 'solde' | 'inconnu';

/** Achat d'une pièce de la boutique avec des Ludis (aucun achat réel). */
export async function acheter(
  profileId: string,
  itemId: string,
  db: LudidactikDB = defaultDb,
): Promise<ResultatAchat> {
  const prix = BOUTIQUE[itemId as keyof typeof BOUTIQUE];
  if (prix === undefined) return 'inconnu';
  let res = 'inconnu' as ResultatAchat;
  await db.transaction('rw', [db.profiles, db.inventory], async () => {
    const key = `${profileId}|${itemId}`;
    if (await db.inventory.get(key)) {
      res = 'deja';
      return;
    }
    const p = await db.profiles.get(profileId);
    if (!p) return;
    if (p.ludis < prix) {
      res = 'solde';
      return;
    }
    await db.profiles.update(profileId, { ludis: p.ludis - prix });
    await db.inventory.put({ key, profileId, itemId, source: 'boutique', date: Date.now() });
    res = 'ok';
  });
  if (res === 'ok') await verifierBadges(profileId, db);
  return res;
}

export function useInventaire(profileId: string | undefined): string[] | undefined {
  return useLiveQuery(
    async () =>
      profileId
        ? (await defaultDb.inventory.where('profileId').equals(profileId).toArray()).map((i) => i.itemId)
        : [],
    [profileId],
  );
}

export function useBadges(profileId: string | undefined) {
  return useLiveQuery(
    async () => (profileId ? defaultDb.badges.where('profileId').equals(profileId).toArray() : []),
    [profileId],
  );
}

export function useDefisDuJourRow(profileId: string | undefined, day: string = dayKey()) {
  return useLiveQuery(
    async () => (profileId ? ((await defaultDb.dailyChallenges.get(rowKey(profileId, day))) ?? null) : null),
    [profileId, day],
  );
}

/** Jours de la semaine en cours (lundi → dimanche) pour la frise de la flamme. */
export function joursDeLaSemaine(today: string = dayKey()): string[] {
  const dow = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
}
