/**
 * Code parent (ARCHITECTURE §7) : 4 à 6 chiffres, haché en PBKDF2 comme les mots de passe des profils,
 * stocké dans la table `settings` (clé « parent »). Il s'accompagne d'une question de calcul « adulte ».
 * C'est un verrou familial, pas une sécurité forte : les données restent lisibles sur l'appareil.
 */
import type { Rng } from '@/engine/rng';
import { createAuth, verifyAuth } from './auth';
import { type LudidactikDB, type ProfileAuth, db as defaultDb } from './storage/db';

const KEY = 'parent';

export const isValidParentCode = (code: string) => /^\d{4,6}$/.test(code);

export async function hasParentCode(db: LudidactikDB = defaultDb): Promise<boolean> {
  return !!(await db.settings.get(KEY));
}

export async function setParentCode(code: string, db: LudidactikDB = defaultDb): Promise<void> {
  if (!isValidParentCode(code)) throw new Error('Le code parent doit compter 4 à 6 chiffres.');
  await db.settings.put({ key: KEY, value: await createAuth('texte', code) });
}

export async function verifyParentCode(code: string, db: LudidactikDB = defaultDb): Promise<boolean> {
  const row = await db.settings.get(KEY);
  if (!row || !isValidParentCode(code.trim())) return false;
  return verifyAuth(row.value as ProfileAuth, code.trim());
}

export interface AdultQuestion {
  texte: string;
  reponse: number;
}

/** Question de calcul hors de portée d'un jeune enfant : « 7 × 8 + 13 », « 9 × 6 − 17 ». */
export function adultQuestion(rng: Rng): AdultQuestion {
  const a = rng.int(6, 9);
  const b = rng.int(6, 9);
  const c = rng.int(11, 29);
  if (rng.chance(0.5)) return { texte: `${a} × ${b} + ${c}`, reponse: a * b + c };
  return { texte: `${a} × ${b} − ${c}`, reponse: a * b - c };
}
