import { describe, expect, it } from 'vitest';
import { ITEM_KINDS, checkItem } from '@/content/schemas';
import { GAMES } from '@/games/registry';
import { FIXTURES } from './fixtures';

describe('items d’exemple', () => {
  it.each(ITEM_KINDS)('%s : items valides', (k) => {
    expect(FIXTURES[k].length).toBeGreaterThan(0);
    for (const it of FIXTURES[k]) {
      expect(it.kind).toBe(k);
      expect(checkItem(it), it.id).toEqual([]);
    }
  });

  it('identifiants uniques', () => {
    const ids = Object.values(FIXTURES).flatMap((v) => v.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Labo : chaque jeu a au moins un exemple adapté (type préféré)', () => {
  it.each(GAMES.map((g) => [g.id, g] as const))('%s', (_id, g) => {
    const kind = g.accepts[0]!;
    const adaptes = FIXTURES[kind].filter((i) => !g.filterItem || g.filterItem(i));
    expect(adaptes.length).toBeGreaterThan(0);
  });
});
