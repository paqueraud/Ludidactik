/**
 * Tirage d'items dans un flux. Le Labo (et certains flux générés) ne filtrent pas : chaque jeu doit
 * ignorer proprement les items qui n'ont pas la forme attendue.
 */
import type { ItemStream } from '@/content/provider';
import type { Item } from '@/content/schemas';
import { tirerItem } from '../_orthographe-commun/lettres';

export { tirerItem };

/**
 * Collecte jusqu'à `max` items distincts (par id) qui conviennent, dans l'ordre du flux
 * (les items à revoir arrivent d'abord). S'arrête quand le flux boucle.
 */
export function collecterItems<T extends Item>(
  stream: ItemStream,
  ok: (it: Item) => it is T,
  max: number,
): T[] {
  const vus = new Map<string, T>();
  const tirages = Math.min(200, Math.max(24, (stream.size ?? 40) * 2 + max));
  let dejaVus = 0;
  for (let i = 0; i < tirages && vus.size < max; i++) {
    const it = stream.next();
    if (!ok(it)) continue;
    if (vus.has(it.id)) {
      // flux fini qui recommence : inutile d'insister longtemps
      if (++dejaVus > 2 * max + 4) break;
      continue;
    }
    vus.set(it.id, it);
  }
  return [...vus.values()];
}
