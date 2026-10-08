/**
 * Listes de mots de la semaine saisies par les parents (ARCHITECTURE §3.3) et enregistrements de voix.
 * Les listes deviennent des items `spelling_word` pour les leçons `*.FR.ORTH.LISTES_PARENTS`.
 */
import type { Classe } from '@/content/schemas';
import { type LudidactikDB, type ParentWordList, type Profile, db as defaultDb } from './storage/db';

/** Identifiant de la leçon « Mes mots de la semaine » d'une classe. */
export const lessonListesParents = (classe: Classe) => `${classe}.FR.ORTH.LISTES_PARENTS`;

/** Listes visibles par un profil (vide = tous les profils). */
export const listesDuProfil = (lists: ParentWordList[], profileId: string) =>
  lists.filter((l) => l.mots.length > 0 && (l.profileIds.length === 0 || l.profileIds.includes(profileId)));

/** Date de dernière modification d'une liste. */
export const dateListe = (l: ParentWordList) => l.modifieLe ?? l.creeLe;

/** Enregistre (création ou mise à jour) ; supprime l'audio des mots retirés. */
export async function saveWordList(list: ParentWordList, db: LudidactikDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.wordLists, db.audio, async () => {
    const before = await db.wordLists.get(list.id);
    const keep = new Set(list.mots.map((m) => m.audioKey).filter(Boolean));
    const orphelins = (before?.mots ?? [])
      .map((m) => m.audioKey)
      .filter((k): k is string => !!k && !keep.has(k));
    if (orphelins.length) await db.audio.bulkDelete(orphelins);
    await db.wordLists.put({ ...list, modifieLe: Date.now() });
  });
}

export async function deleteWordList(id: string, db: LudidactikDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.wordLists, db.audio, async () => {
    const l = await db.wordLists.get(id);
    const keys = (l?.mots ?? []).map((m) => m.audioKey).filter((k): k is string => !!k);
    if (keys.length) await db.audio.bulkDelete(keys);
    await db.wordLists.delete(id);
  });
}

export async function saveRecording(key: string, blob: Blob, db: LudidactikDB = defaultDb) {
  await db.audio.put({ key, blob, mime: blob.type || 'audio/webm' });
}

export const deleteRecording = (key: string, db: LudidactikDB = defaultDb) => db.audio.delete(key);

/** Libellé des enfants concernés par une liste. */
export function destinataires(list: ParentWordList, profiles: Profile[]): string {
  if (!list.profileIds.length) return 'Tous les enfants';
  const noms = list.profileIds
    .map((id) => profiles.find((p) => p.id === id)?.prenom)
    .filter((x): x is string => !!x);
  return noms.length ? noms.join(', ') : 'Aucun enfant';
}
