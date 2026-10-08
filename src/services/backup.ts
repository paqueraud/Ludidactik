/**
 * Export / import d'une sauvegarde JSON (ARCHITECTURE §6) : `ludidactik-sauvegarde-<date>.json`.
 * Sert à changer d'appareil (tablette → PC) puisque rien n'est stocké en ligne.
 */
import { z } from 'zod';
import { type LudidactikDB, db as defaultDb } from './storage/db';

const FORMAT = 'ludidactik-sauvegarde';
const VERSION = 1;

const TABLES = [
  'profiles',
  'progress',
  'records',
  'attempts',
  'leitner',
  'wordLists',
  'settings',
  'screenTime',
] as const;

const BackupSchema = z.object({
  format: z.literal(FORMAT),
  version: z.number().int().max(VERSION),
  exporteLe: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  audio: z.array(z.object({ key: z.string(), mime: z.string(), base64: z.string() })),
});
export type Backup = z.infer<typeof BackupSchema>;

async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof blob.arrayBuffer === 'function') {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const base64ToBlob = (b64: string, mime: string) =>
  new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: mime });

export async function exportBackup(db: LudidactikDB = defaultDb): Promise<Backup> {
  const tables: Backup['tables'] = {};
  for (const t of TABLES) tables[t] = (await db.table(t).toArray()) as Record<string, unknown>[];
  const audio = await Promise.all(
    (await db.audio.toArray()).map(async (a) => ({
      key: a.key,
      mime: a.mime,
      base64: await blobToBase64(a.blob),
    })),
  );
  return { format: FORMAT, version: VERSION, exporteLe: new Date().toISOString(), tables, audio };
}

/** Importe une sauvegarde. `remplacer` = efface d'abord tout ; sinon fusionne (les mêmes clés sont remplacées). */
export async function importBackup(
  json: unknown,
  opts: { remplacer: boolean },
  db: LudidactikDB = defaultDb,
) {
  const data = BackupSchema.parse(json);
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.audio], async () => {
    if (opts.remplacer) for (const t of [...TABLES, 'audio'] as const) await db.table(t).clear();
    for (const t of TABLES) {
      const rows = data.tables[t];
      if (rows?.length) await db.table(t).bulkPut(rows);
    }
    if (data.audio.length)
      await db.audio.bulkPut(
        data.audio.map((a) => ({ key: a.key, mime: a.mime, blob: base64ToBlob(a.base64, a.mime) })),
      );
  });
  return { profils: data.tables.profiles?.length ?? 0 };
}

export function downloadBackup(backup: Backup) {
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `ludidactik-sauvegarde-${date}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
