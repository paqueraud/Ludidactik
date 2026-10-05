import { describe, expect, it } from 'vitest';
import { ITEM_KINDS, checkItem } from '@/content/schemas';
import { FIXTURES } from './fixtures';

describe('items d’exemple', () => {
  it.each(ITEM_KINDS)('%s : items valides', (k) => {
    expect(FIXTURES[k].length).toBeGreaterThan(0);
    for (const it of FIXTURES[k]) {
      expect(it.kind).toBe(k);
      expect(checkItem(it), it.id).toEqual([]);
    }
  });
});
