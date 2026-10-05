/** Mot de la même famille : repérer la lettre qu'on y entend (fonction pure, testée). */
import { base, lettres, prefixeCommun } from '../_orthographe-commun/lettres';
import type { Trou } from '../_orthographe-commun/trou';

/** Découpe le mot de la famille pour surligner la lettre qu'on y entend. */
export function decouperFamille(t: Trou): { avant: string; lettre: string; apres: string } | null {
  if (!t.famille) return null;
  const prefixe = t.avant.match(/[\p{L}'’-]*$/u)?.[0] ?? '';
  const lf = lettres(t.famille);
  const lr = lettres(t.reponse);
  const lp = lettres(prefixe);
  if (!lp.length) return null;
  const pos = prefixeCommun(prefixe, t.famille);
  if (pos !== lp.length) return null;
  const segment = lf.slice(pos, pos + lr.length);
  if (segment.map(base).join('') !== lr.map(base).join('')) return null;
  return {
    avant: lf.slice(0, pos).join(''),
    lettre: segment.join(''),
    apres: lf.slice(pos + lr.length).join(''),
  };
}
