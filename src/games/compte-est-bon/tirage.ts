/**
 * Le Compte est bon — tirage des nombres (mécanique pure, testée) : à partir d'une cible, on construit à
 * rebours une expression qui l'atteint, puis on mélange ses nombres. Il existe donc toujours au moins
 * une solution (renvoyée pour le bouton « Solution »).
 */
import type { Level } from '@/content/schemas';
import type { Rng } from '@/engine/rng';

export type Op = '+' | '−' | '×' | '÷';
export const OPS_NIVEAU: Record<Level, Op[]> = {
  facile: ['+', '−'],
  normal: ['+', '−', '×'],
  plus_loin: ['+', '−', '×', '÷'],
};
export const NB_NOMBRES: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };
export const MAX_INTERMEDIAIRE = 9999;

export interface Etape {
  a: number;
  op: Op;
  b: number;
  r: number;
}

/** Applique une opération ; null si elle n'est pas permise (résultat négatif, nul, ou division pas juste). */
export function calculer(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b > 0 ? a - b : null;
    case '×':
      return a * b <= MAX_INTERMEDIAIRE ? a * b : null;
    case '÷':
      return b > 0 && a % b === 0 ? a / b : null;
  }
}

/** Tirage de nombres permettant d'atteindre `cible` (entier ≥ 1). */
export function tirage(
  cible: number,
  level: Level,
  rng: Rng,
): { nombres: number[]; solution: Etape[] } | null {
  if (!Number.isInteger(cible) || cible < 1 || cible > MAX_INTERMEDIAIRE) return null;
  const k = NB_NOMBRES[level];
  const ops = OPS_NIVEAU[level];
  for (let essai = 0; essai < 80; essai++) {
    let feuilles = [cible];
    const decoupes: Etape[] = []; // chaque découpe : r = a op b (ordre inverse de l'évaluation)
    let ok = true;
    while (feuilles.length < k) {
      // on découpe la plus grande feuille
      const L = Math.max(...feuilles);
      const possibles = rng.shuffle(ops).flatMap((op): Etape[] => {
        switch (op) {
          case '+': {
            if (L < 2) return [];
            const a = rng.int(1, Math.max(1, Math.min(L - 1, L > 30 ? Math.floor(L / 2) : 9)));
            return [{ a: L - a, op, b: a, r: L }];
          }
          case '−': {
            const a = rng.int(1, level === 'facile' ? 9 : 20);
            return L + a <= 999 ? [{ a: L + a, op, b: a, r: L }] : [];
          }
          case '×': {
            const ds = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => L % d === 0 && L / d >= 2);
            if (!ds.length) return [];
            const d = rng.pick(ds);
            return [{ a: L / d, op, b: d, r: L }];
          }
          case '÷': {
            const d = rng.int(2, 5);
            return L * d <= 999 ? [{ a: L * d, op, b: d, r: L }] : [];
          }
        }
      });
      const e = possibles[0];
      if (!e) {
        ok = false;
        break;
      }
      const i = feuilles.indexOf(L);
      feuilles = [...feuilles.slice(0, i), ...feuilles.slice(i + 1), e.a, e.b];
      decoupes.push(e);
    }
    if (!ok) continue;
    // pas de nombre égal à la cible (trop facile), pas de doublon de 1 inutile
    if (feuilles.includes(cible)) continue;
    // Plus loin : on veut si possible au moins 3 opérations différentes dans la solution
    if (level === 'plus_loin' && new Set(decoupes.map((d) => d.op)).size < 3 && essai < 60) continue;
    return { nombres: rng.shuffle(feuilles), solution: [...decoupes].reverse() };
  }
  return null;
}
