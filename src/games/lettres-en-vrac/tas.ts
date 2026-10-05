/**
 * Préparation d'une manche des Lettres en vrac (fonction pure) : cases du mot (lettres à placer,
 * signes fixes comme l'apostrophe ou le trait d'union) et tas de tuiles mélangées, avec
 * éventuellement des lettres intruses « qui ressemblent » (é/è, m/n, b/d…).
 */
import { base, estLettre, lettres, melanger } from '../_orthographe-commun/lettres';

export interface Tuile {
  id: string;
  ch: string;
  intrus: boolean;
}

export type Case = { type: 'fixe'; ch: string } | { type: 'lettre'; ch: string };

/** Lettres que l'on confond souvent (sons proches, formes en miroir, accents). */
const SOSIES: Record<string, string[]> = {
  a: ['à', 'â', 'o'],
  e: ['é', 'è', 'ê'],
  é: ['è', 'e', 'ê'],
  è: ['é', 'ê', 'e'],
  ê: ['è', 'é'],
  i: ['î', 'y'],
  o: ['ô', 'a'],
  u: ['û', 'ù', 'n'],
  m: ['n'],
  n: ['m', 'u'],
  b: ['d', 'p'],
  d: ['b', 'q'],
  p: ['q', 'b'],
  q: ['p', 'g'],
  s: ['z', 'c', 'x'],
  c: ['s', 'k', 'ç'],
  ç: ['c', 's'],
  g: ['j', 'q'],
  j: ['g'],
  t: ['d'],
  f: ['v'],
  v: ['f'],
  l: ['i'],
  r: ['l'],
};
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function nbIntrus(mot: string): number {
  const n = lettres(mot).filter(estLettre).length;
  return n <= 4 ? 2 : 3;
}

export function construireTas(
  mot: string,
  opts: { intrus: number },
  aleat: () => number = Math.random,
): { cases: Case[]; tuiles: Tuile[] } {
  const ls = lettres(mot);
  const cases: Case[] = ls.map((ch) => (estLettre(ch) ? { type: 'lettre', ch } : { type: 'fixe', ch }));
  const justes = ls.filter(estLettre);
  const tuiles: Tuile[] = justes.map((ch, i) => ({ id: `l${i}`, ch, intrus: false }));

  // Lettres intruses : d'abord des sosies de lettres du mot, sinon une lettre absente du mot
  const presentes = new Set(justes.map((c) => c.toLowerCase()));
  const intrus: string[] = [];
  const candidats = melanger(
    justes.flatMap((c) => SOSIES[c.toLowerCase()] ?? []).filter((c) => !presentes.has(c)),
    aleat,
  );
  for (const c of candidats) {
    if (intrus.length >= opts.intrus) break;
    if (!intrus.includes(c)) intrus.push(c);
  }
  const absentes = melanger(
    ALPHABET.filter((c) => ![...presentes].some((p) => base(p) === c)),
    aleat,
  );
  while (intrus.length < opts.intrus && absentes.length) intrus.push(absentes.shift()!);
  intrus.forEach((ch, i) => tuiles.push({ id: `x${i}`, ch, intrus: true }));

  // Mélange : jamais dans l'ordre du mot (si c'est possible)
  let melange = melanger(tuiles, aleat);
  const dansLOrdre = (t: Tuile[]) =>
    t
      .filter((x) => !x.intrus)
      .map((x) => x.ch)
      .join('') === justes.join('');
  for (let k = 0; k < 10 && justes.length > 1 && new Set(justes).size > 1 && dansLOrdre(melange); k++)
    melange = melanger(tuiles, aleat);
  return { cases, tuiles: melange };
}
