/** Accès aux profils et à la progression (Dexie). */
import { useLiveQuery } from 'dexie-react-hooks';
import type { AvatarConfig } from '@/avatar/parts';
import type { Classe, Level } from '@/content/schemas';
import { useSession } from '@/stores/session';
import { createAuth } from './auth';
import {
  LIMITE_PAR_DEFAUT,
  type LudidactikDB,
  type Profile,
  type ProgressRow,
  type RecordRow,
  db,
  progressKey,
} from './storage/db';

export async function createProfile(input: {
  prenom: string;
  avatar: AvatarConfig;
  classe: Classe;
  authType: 'texte' | 'image';
  secret: string;
}): Promise<Profile> {
  const now = Date.now();
  const profile: Profile = {
    id: crypto.randomUUID(),
    prenom: input.prenom.trim(),
    avatar: input.avatar,
    classe: input.classe,
    auth: await createAuth(input.authType, input.secret),
    xp: 0,
    ludis: 0,
    enCours: [],
    limiteMinutes: LIMITE_PAR_DEFAUT,
    creeLe: now,
    derniereConnexion: now,
  };
  await db.profiles.add(profile);
  return profile;
}

export const updateProfile = (id: string, patch: Partial<Profile>) => db.profiles.update(id, patch);

export async function toggleEnCours(profile: Profile, lessonId: string) {
  const enCours = profile.enCours.includes(lessonId)
    ? profile.enCours.filter((l) => l !== lessonId)
    : [...profile.enCours, lessonId];
  await db.profiles.update(profile.id, { enCours });
}

/** Espace parents : nouveau mot de passe (texte ou image) pour un enfant qui l'a oublié. */
export async function resetPassword(id: string, type: 'texte' | 'image', secret: string) {
  await db.profiles.update(id, { auth: await createAuth(type, secret) });
}

/**
 * Supprime un profil et toutes ses données (progression, records, journal, révisions, temps d'écran).
 * Une liste de mots destinée à ce seul enfant est supprimée aussi (sinon elle deviendrait « pour tous »).
 */
export async function deleteProfile(id: string, base: LudidactikDB = db): Promise<void> {
  await base.transaction(
    'rw',
    [
      base.profiles,
      base.progress,
      base.records,
      base.attempts,
      base.leitner,
      base.screenTime,
      base.wordLists,
      base.audio,
      base.dailyChallenges,
      base.inventory,
      base.badges,
      base.gems,
    ],
    async () => {
      await base.progress.where('profileId').equals(id).delete();
      await base.records.where('profileId').equals(id).delete();
      await base.attempts.where('profileId').equals(id).delete();
      await base.leitner.where('profileId').equals(id).delete();
      await base.screenTime.where('profileId').equals(id).delete();
      for (const t of [base.dailyChallenges, base.inventory, base.badges, base.gems])
        await t.where('profileId').equals(id).delete();
      for (const l of await base.wordLists.toArray()) {
        if (!l.profileIds.includes(id)) continue;
        const reste = l.profileIds.filter((p) => p !== id);
        if (reste.length) await base.wordLists.update(l.id, { profileIds: reste });
        else {
          const keys = l.mots.map((m) => m.audioKey).filter((k): k is string => !!k);
          if (keys.length) await base.audio.bulkDelete(keys);
          await base.wordLists.delete(l.id);
        }
      }
      await base.profiles.delete(id);
    },
  );
}

/** Profil connecté (null pendant le chargement ou si personne n'est connecté). */
export function useCurrentProfile(): Profile | null | undefined {
  const id = useSession((s) => s.profileId);
  return useLiveQuery(async () => (id ? ((await db.profiles.get(id)) ?? null) : null), [id]);
}

export function useProfiles(): Profile[] | undefined {
  return useLiveQuery(() => db.profiles.orderBy('derniereConnexion').reverse().toArray(), []);
}

/** Progression d'un profil, indexée par leçon. */
export function useProgress(profileId: string | undefined): Map<string, ProgressRow[]> | undefined {
  return useLiveQuery(async () => {
    const map = new Map<string, ProgressRow[]>();
    if (!profileId) return map;
    const rows = await db.progress.where('profileId').equals(profileId).toArray();
    for (const r of rows) map.set(r.lessonId, [...(map.get(r.lessonId) ?? []), r]);
    return map;
  }, [profileId]);
}

/** Meilleures étoiles par niveau d'une leçon (tous jeux confondus) et meilleure justesse par niveau. */
export function lessonSummary(rows: ProgressRow[] | undefined) {
  const stars: Record<Level, number> = { facile: 0, normal: 0, plus_loin: 0 };
  const best: Partial<Record<Level, number>> = {};
  for (const r of rows ?? []) {
    stars[r.level] = Math.max(stars[r.level], r.stars);
    best[r.level] = Math.max(best[r.level] ?? 0, r.bestAccuracy);
  }
  return { stars, best };
}

export const getRecord = (profileId: string, lessonId: string, gameId: string, level: Level) =>
  db.records.get(progressKey(profileId, lessonId, gameId, level));

export type { Profile, ProgressRow, RecordRow };
