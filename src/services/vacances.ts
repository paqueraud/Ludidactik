/** Réglage parent « vacances scolaires » (table `settings`, clé `vacances`) : gèle la flamme. */
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CLE_REGLAGE_VACANCES,
  REGLAGE_VACANCES_DEFAUT,
  type ReglageVacances,
  normaliserReglage,
} from '@/meta/vacances';
import { type LudidactikDB, db as defaultDb } from './storage/db';

export async function lireReglageVacances(db: LudidactikDB = defaultDb): Promise<ReglageVacances> {
  const row = await db.settings.get(CLE_REGLAGE_VACANCES);
  return row ? normaliserReglage(row.value) : REGLAGE_VACANCES_DEFAUT;
}

export async function ecrireReglageVacances(
  reglage: ReglageVacances,
  db: LudidactikDB = defaultDb,
): Promise<void> {
  await db.settings.put({ key: CLE_REGLAGE_VACANCES, value: normaliserReglage(reglage) });
}

export function useReglageVacances(): ReglageVacances | undefined {
  return useLiveQuery(() => lireReglageVacances(), []);
}
