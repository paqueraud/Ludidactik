/**
 * Mode inverse du Perroquet : écritures en lettres d'un nombre (calculées par le moteur `nombreEnLettres`,
 * rectifiée et traditionnelle acceptées) et pièges orthographiques plausibles (« vingts », « milles »,
 * « et » oublié, nombre voisin).
 */
import { graphiesNombre, nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';

/** Propositions : une écriture correcte + des pièges, sans aucune autre écriture correcte. */
export function propositionsLettres(n: number, rng: Rng, nb = 3): { choix: string[]; bonne: number } | null {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return null;
  const correctes = new Set(graphiesNombre(n));
  const juste = rng.chance(0.7) ? nombreEnLettres(n, 'rectifiee') : nombreEnLettres(n, 'traditionnelle');
  const base = nombreEnLettres(n, 'rectifiee');
  const pieges = new Set<string>();
  const ajoute = (s: string) => {
    if (s && !correctes.has(s) && s !== juste) pieges.add(s);
  };
  // pièges d'accord et de liaison
  ajoute(base.replace(/vingts\b/, 'vingt'));
  ajoute(base.replace(/quatre-vingt(?!s)(?=$|\s)/, 'quatre-vingts'));
  ajoute(base.replace(/cents\b/, 'cent'));
  ajoute(base.replace(/(\w)-cent(?=-|\s|$)(?!s)/, '$1-cents'));
  ajoute(base.replace(/\bmille\b/, 'milles'));
  ajoute(base.replace(/-et-un/, '-un'));
  ajoute(base.replace(/-et-onze/, '-onze'));
  // nombres voisins (erreur de chiffre)
  for (const d of [1, 10, 100, 1000, -1, -10, -100]) {
    const m = n + d;
    if (m >= 0 && m <= 999_999_999 && String(m).length === String(n).length)
      ajoute(nombreEnLettres(m, 'rectifiee'));
  }
  const liste = rng.shuffle([...pieges]).slice(0, nb - 1);
  if (!liste.length) return null;
  const choix = rng.shuffle([juste, ...liste]);
  return { choix, bonne: choix.indexOf(juste) };
}
