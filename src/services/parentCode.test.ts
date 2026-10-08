// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import {
  adultQuestion,
  hasParentCode,
  isValidParentCode,
  setParentCode,
  verifyParentCode,
} from './parentCode';
import { LudidactikDB } from './storage/db';

describe('code parent', () => {
  it('valide 4 à 6 chiffres seulement', () => {
    expect(isValidParentCode('1234')).toBe(true);
    expect(isValidParentCode('123456')).toBe(true);
    expect(isValidParentCode('123')).toBe(false);
    expect(isValidParentCode('1234567')).toBe(false);
    expect(isValidParentCode('12a4')).toBe(false);
    expect(isValidParentCode('')).toBe(false);
  });

  it('crée puis vérifie le code (haché, jamais en clair)', async () => {
    const db = new LudidactikDB('test-code-parent');
    expect(await hasParentCode(db)).toBe(false);
    await setParentCode('2468', db);
    expect(await hasParentCode(db)).toBe(true);
    const row = await db.settings.get('parent');
    expect(JSON.stringify(row)).not.toContain('2468');
    expect(await verifyParentCode('2468', db)).toBe(true);
    expect(await verifyParentCode(' 2468 ', db)).toBe(true);
    expect(await verifyParentCode('2469', db)).toBe(false);
    expect(await verifyParentCode('abcd', db)).toBe(false);
    await setParentCode('135790', db);
    expect(await verifyParentCode('2468', db)).toBe(false);
    expect(await verifyParentCode('135790', db)).toBe(true);
    await expect(setParentCode('12', db)).rejects.toThrow();
    db.close();
  });

  it('refuse tout code tant qu’aucun n’est créé', async () => {
    const db = new LudidactikDB('test-code-parent-vide');
    expect(await verifyParentCode('0000', db)).toBe(false);
    db.close();
  });

  it('pose une question de calcul « adulte » cohérente', () => {
    const rng = createRng(42);
    for (let i = 0; i < 200; i++) {
      const q = adultQuestion(rng);
      const m = q.texte.match(/^(\d) × (\d) ([+−]) (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b, op, c] = m!;
      const attendu = Number(a) * Number(b) + (op === '+' ? 1 : -1) * Number(c);
      expect(q.reponse).toBe(attendu);
      expect(Number(a)).toBeGreaterThanOrEqual(6);
      expect(Number(c)).toBeGreaterThanOrEqual(11);
    }
  });
});
