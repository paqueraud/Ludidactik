/**
 * CE1 — Calcul posé et sens de la multiplication (BO n°41 du 31/10/2024, « Les quatre opérations ») :
 * addition posée de 2 ou 3 nombres (1 à 3 chiffres), soustraction posée (introduite au plus tard en P3),
 * symbole « × » lu « fois », commutativité.
 *
 * Choix d'algorithme pour la soustraction : **par cassage** (échange d'une dizaine contre 10 unités,
 * d'une centaine contre 10 dizaines). Le BO demande un unique algorithme pour toute l'école (CE1 → CM2) ;
 * le cassage s'appuie directement sur la numération travaillée en CE1 (matériel multibase). Toutes les
 * explications de l'application utilisent ce seul algorithme.
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, fmt, make, mcq, numeric, parNiv } from './util';

export const ALGO_SOUSTRACTION = 'cassage' as const;

/** Champ numérique : ≤ 1 000 au CE1, ≤ 10 000 au niveau « plus loin ». */
const maxCP = (level: Level) => (level === 'plus_loin' ? 10000 : 1000);

const chiffre = (n: number, rang: number) => Math.floor(n / 10 ** rang) % 10;
const nbChiffres = (n: number) => String(n).length;

/** Nombre de retenues d'une addition de plusieurs termes. */
function retenues(termes: number[]): number {
  let r = 0;
  let count = 0;
  for (let k = 0; k < 4; k++) {
    const s = termes.reduce((acc, t) => acc + chiffre(t, k), 0) + r;
    r = Math.floor(s / 10);
    if (r > 0) count++;
  }
  return count;
}

/** Résultat obtenu en oubliant les retenues (erreur fréquente). */
function sansRetenue(termes: number[]): number {
  let out = 0;
  for (let k = 0; k < 4; k++) out += (termes.reduce((acc, t) => acc + chiffre(t, k), 0) % 10) * 10 ** k;
  return out;
}

/* ------------------------------------------------------------------ */
/* CE1.MA.CP.ADD                                                       */
/* ------------------------------------------------------------------ */

function termesAddition(level: Level, rng: Rng): number[] {
  for (let essai = 0; essai < 200; essai++) {
    let t: number[];
    if (level === 'facile') {
      t = [rng.int(10, 899), rng.int(10, 99)];
      if (rng.chance(0.5)) t[1] = rng.int(100, 899);
      if (retenues(t) === 0 && t[0]! + t[1]! <= 999 && t[0]! + t[1]! >= 20) return rng.shuffle(t);
      continue;
    }
    if (level === 'normal') {
      // BO : 245 + 437 ; 218 + 48 ; 76 + 7 + 568
      const trois = rng.chance(0.35);
      t = trois
        ? [rng.int(10, 99), rng.int(2, 9), rng.int(100, 699)]
        : [rng.int(100, 699), rng.chance(0.4) ? rng.int(11, 99) : rng.int(100, 499)];
      const s = t.reduce((a, b) => a + b, 0);
      if (retenues(t) >= 1 && s <= 1000) return rng.shuffle(t);
      continue;
    }
    t = [rng.int(100, 999), rng.int(10, 999), rng.int(10, 999), rng.int(2, 99)];
    const s = t.reduce((a, b) => a + b, 0);
    if (retenues(t) >= 2 && s <= 9999) return rng.shuffle(t);
  }
  return [245, 437];
}

const ecrire = (t: number[], op: string) => t.map(fmt).join(` ${op} `);

const explAdd = (t: number[]) => {
  const s = t.reduce((a, b) => a + b, 0);
  return retenues(t) === 0
    ? `On aligne les unités sous les unités, les dizaines sous les dizaines, puis on additionne chaque colonne : ${ecrire(t, '+')} = ${fmt(s)}.`
    : `On aligne les chiffres, on commence par les unités et on n’oublie pas les retenues (10 unités = 1 dizaine) : ${ecrire(t, '+')} = ${fmt(s)}.`;
};

const addNumeric: ItemGen = (level, rng, ctx) => {
  const t = termesAddition(level, rng);
  const s = t.reduce((a, b) => a + b, 0);
  return numeric(ctx, `add-${t.join('+')}`, {
    prompt: ecrire(t, '+'),
    spoken: t.join(' plus '),
    answer: s,
    explication: explAdd(t),
    difficulty: clamp01(0.2 + retenues(t) * 0.2 + (t.length - 2) * 0.15),
    meta: { ...(t.length === 2 ? { posee: { a: t[0], b: t[1], op: '+' } } : {}), termes: t },
  });
};

/** Erreurs typiques d'addition posée. */
function erreursAddition(t: number[], rng: Rng, max: number): number[] {
  const s = t.reduce((a, b) => a + b, 0);
  const out = [sansRetenue(t), s + 10, s - 10, s + 100];
  // Mauvais alignement : le plus petit nombre décalé d'un rang vers la gauche
  const petit = Math.min(...t);
  if (t.some((x) => nbChiffres(x) !== nbChiffres(petit))) out.push(s - petit + petit * 10);
  return rng.shuffle([...new Set(out.filter((x) => x !== s && x > 0 && x <= max))]);
}

const addQcm: ItemGen = (level, rng, ctx) => {
  const t = termesAddition(level, rng);
  const s = t.reduce((a, b) => a + b, 0);
  return mcq(ctx, rng, `add-${t.join('+')}`, {
    question: `Pose et calcule : ${ecrire(t, '+')}`,
    spoken: `Pose et calcule ${t.join(' plus ')}.`,
    good: fmt(s),
    wrong: erreursAddition(t, rng, maxCP(level)).map(fmt),
    explication: explAdd(t),
    difficulty: clamp01(0.25 + retenues(t) * 0.2),
  });
};

const addVraiFaux: ItemGen = (level, rng, ctx) => {
  const t = termesAddition(level, rng);
  const s = t.reduce((a, b) => a + b, 0);
  const juste = rng.chance(0.5);
  const montre = juste ? s : (erreursAddition(t, rng, maxCP(level))[0] ?? s - 10);
  const qui = rng.pick(['Léo', 'Lucie', 'Inès', 'Malo', 'Jade', 'Sami']);
  return make(ctx, 'true_false', `add-${t.join('+')}-${montre}`, {
    statement: `${qui} a posé ${ecrire(t, '+')} et a trouvé ${fmt(montre)}. C’est juste ?`,
    spoken: `${qui} a posé ${t.join(' plus ')} et a trouvé ${montre}. C’est juste ?`,
    answer: montre === s,
    explication: explAdd(t),
    difficulty: clamp01(0.3 + retenues(t) * 0.15),
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.CP.SOUS — algorithme par cassage                              */
/* ------------------------------------------------------------------ */

/** Nombre d'échanges (cassages) nécessaires pour a − b. */
function cassages(a: number, b: number): number {
  let count = 0;
  let emprunt = 0;
  for (let k = 0; k < 4; k++) {
    const da = chiffre(a, k) - emprunt;
    const db = chiffre(b, k);
    if (da < db) {
      count++;
      emprunt = 1;
    } else emprunt = 0;
  }
  return count;
}

function termesSoustraction(level: Level, rng: Rng): [number, number] {
  for (let essai = 0; essai < 300; essai++) {
    if (level === 'facile') {
      const a = rng.int(25, 999);
      const b = rng.int(11, a - 1);
      if (cassages(a, b) === 0 && a - b >= 1) return [a, b];
      continue;
    }
    if (level === 'normal') {
      const a = rng.int(40, 999);
      const b = rng.chance(0.4) ? rng.int(11, 99) : rng.int(100, a - 1);
      if (b < a && cassages(a, b) === 1) return [a, b];
      continue;
    }
    // Plus loin : deux cassages ou zéros au milieu (403 − 167, 1 000 − 365)
    const a = rng.chance(0.4)
      ? rng.pick([1000, rng.int(1, 9) * 100, rng.int(1, 9) * 100 + rng.int(1, 9)])
      : rng.int(200, 999);
    const b = rng.int(101, a - 1);
    if (b < a && cassages(a, b) >= 2) return [a, b];
  }
  return [403, 167];
}

/** Erreur fréquente : dans chaque colonne, on retire le petit chiffre du grand. */
function petitDuGrand(a: number, b: number): number {
  let out = 0;
  for (let k = 0; k < 4; k++) out += Math.abs(chiffre(a, k) - chiffre(b, k)) * 10 ** k;
  return out;
}

function explSous(a: number, b: number): string {
  const n = cassages(a, b);
  if (n === 0)
    return `On aligne les chiffres et on soustrait colonne par colonne, en commençant par les unités : ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`;
  const besoinU = chiffre(a, 0) < chiffre(b, 0);
  const debut = besoinU
    ? `Il n’y a pas assez d’unités : on casse une dizaine en 10 unités`
    : `Il n’y a pas assez de dizaines : on casse une centaine en 10 dizaines`;
  return `${debut}${n > 1 ? ' (et on recommence au rang suivant si besoin)' : ''}, puis on soustrait colonne par colonne : ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`;
}

const sousNumeric: ItemGen = (level, rng, ctx) => {
  const [a, b] = termesSoustraction(level, rng);
  return numeric(ctx, `sous-${a}-${b}`, {
    prompt: `${fmt(a)} − ${fmt(b)}`,
    spoken: `${a} moins ${b}`,
    answer: a - b,
    explication: explSous(a, b),
    difficulty: clamp01(0.25 + cassages(a, b) * 0.25),
    meta: { posee: { a, b, op: '−' }, algorithme: ALGO_SOUSTRACTION },
  });
};

function erreursSoustraction(a: number, b: number, rng: Rng, max: number): number[] {
  const d = a - b;
  const out = [petitDuGrand(a, b), d + 10, d - 10, d + 100, a + b];
  return rng.shuffle([...new Set(out.filter((x) => x !== d && x >= 0 && x <= max))]);
}

const sousQcm: ItemGen = (level, rng, ctx) => {
  const [a, b] = termesSoustraction(level, rng);
  return mcq(ctx, rng, `sous-${a}-${b}`, {
    question: `Pose et calcule : ${fmt(a)} − ${fmt(b)}`,
    spoken: `Pose et calcule ${a} moins ${b}.`,
    good: fmt(a - b),
    wrong: erreursSoustraction(a, b, rng, maxCP(level)).map(fmt),
    explication: explSous(a, b),
    difficulty: clamp01(0.3 + cassages(a, b) * 0.2),
  });
};

const sousVraiFaux: ItemGen = (level, rng, ctx) => {
  const [a, b] = termesSoustraction(level, rng);
  const d = a - b;
  const forme = rng.int(0, 1);
  const juste = rng.chance(0.5);
  const montre = juste ? d : (erreursSoustraction(a, b, rng, maxCP(level))[0] ?? d + 1);
  if (forme === 0) {
    const qui = rng.pick(['Léo', 'Lucie', 'Inès', 'Malo', 'Jade', 'Sami']);
    return make(ctx, 'true_false', `sous-${a}-${b}-${montre}`, {
      statement: `${qui} a posé ${fmt(a)} − ${fmt(b)} et a trouvé ${fmt(montre)}. C’est juste ?`,
      spoken: `${qui} a posé ${a} moins ${b} et a trouvé ${montre}. C’est juste ?`,
      answer: montre === d,
      explication: explSous(a, b),
      difficulty: clamp01(0.3 + cassages(a, b) * 0.15),
    });
  }
  // Vérifier une soustraction avec une addition
  return make(ctx, 'true_false', `verif-${a}-${b}-${montre}`, {
    statement: `${fmt(a)} − ${fmt(b)} = ${fmt(montre)}, car ${fmt(montre)} + ${fmt(b)} = ${fmt(a)}.`,
    spoken: `${a} moins ${b} égale ${montre}, car ${montre} plus ${b} égale ${a}.`,
    answer: montre === d,
    explication: `Pour vérifier une soustraction, on fait l’addition : ${fmt(d)} + ${fmt(b)} = ${fmt(a)}, donc ${fmt(a)} − ${fmt(b)} = ${fmt(d)}.`,
    difficulty: 0.5,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.CP.MULT_SENS — « × » se lit « fois », commutativité          */
/* ------------------------------------------------------------------ */

function facteurs(level: Level, rng: Rng): [number, number] {
  return parNiv(level, {
    facile: [rng.int(2, 5), rng.int(2, 5)] as [number, number],
    normal: rng.chance(0.5)
      ? ([rng.int(2, 9), rng.int(2, 10)] as [number, number])
      : ([rng.int(2, 9), rng.pick([10, 20, 25, 30, 50])] as [number, number]),
    plus_loin: [rng.int(2, 9), rng.int(2, 9) * 10] as [number, number],
  });
}

const iteree = (n: number, b: number) => Array<string>(n).fill(fmt(b)).join(' + ');

const multNumeric: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteurs(level, rng);
  if (level === 'facile')
    return numeric(ctx, `iter-${a}-${b}`, {
      prompt: `${a} × ${b} = ${iteree(a, b)} = …`,
      spoken: `${a} fois ${b}, c’est ${Array<number>(a).fill(b).join(' plus ')}, égale combien ?`,
      answer: a * b,
      explication: `${a} × ${b}, c’est ${a} fois ${b} : ${iteree(a, b)} = ${a * b}.`,
      difficulty: clamp01((a * b) / 30),
    });
  const [x, y] = rng.chance(0.5) ? [a, b] : [b, a];
  return numeric(ctx, `mult-${x}-${y}`, {
    prompt: `${fmt(x)} × ${fmt(y)}`,
    spoken: `${x} fois ${y}`,
    answer: x * y,
    explication:
      b % 10 === 0 && b > 10
        ? `${a} fois ${b}, c’est ${a} fois ${b / 10} dizaines = ${a * (b / 10)} dizaines = ${fmt(a * b)}.`
        : `${a} fois ${b}, c’est ${iteree(a, b)} = ${fmt(a * b)} (et ${b} × ${a} donne le même résultat).`,
    difficulty: clamp01(0.3 + (a * b) / 600),
  });
};

const multTrou: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteurs(level, rng);
  if (rng.chance(0.5) && a <= 6) {
    return make(ctx, 'fill_blank', `iter-${a}-${b}`, {
      sentence: `${iteree(a, b)} = ___ × ${fmt(b)}`,
      answer: String(a),
      explication: `On ajoute ${a} fois le nombre ${b} : c’est ${a} × ${b}.`,
      difficulty: 0.3,
    });
  }
  return make(ctx, 'fill_blank', `commu-${a}-${b}`, {
    sentence: `${fmt(a)} × ${fmt(b)} = ${fmt(b)} × ___`,
    answer: String(a),
    explication: `Dans une multiplication, on peut changer l’ordre des nombres : ${a} × ${b} = ${b} × ${a}.`,
    difficulty: 0.35,
  });
};

const multPaires: ItemGen = (level, rng, ctx) => {
  const vus = new Set<string>();
  const pairs: { left: string; right: string }[] = [];
  let guard = 0;
  while (pairs.length < (level === 'facile' ? 3 : 4) && guard++ < 60) {
    let [a, b] = facteurs(level, rng);
    if (a > 5) a = rng.int(2, 5);
    const k = `${a}×${b}`;
    if (vus.has(k) || vus.has(`${b}×${a}`)) continue;
    vus.add(k);
    pairs.push({ left: iteree(a, b), right: `${a} × ${fmt(b)}` });
  }
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.right).join('|')}`, {
    prompt: 'Associe chaque addition à la multiplication qui lui correspond.',
    pairs,
    relation: 'addition répétée → multiplication',
    explication: 'On compte combien de fois on ajoute le même nombre : 20 + 20 + 20 = 3 × 20.',
    difficulty: level === 'facile' ? 0.3 : 0.5,
  });
};

const OBJETS: [string, string][] = [
  ['paquets', 'biscuits'],
  ['boites', 'crayons'],
  ['sachets', 'bonbons'],
  ['rangées', 'salades'],
  ['équipes', 'joueurs'],
  ['boites', 'œufs'],
];

const multQcm: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteurs(level, rng);
  if (rng.chance(0.5)) {
    const qui = rng.pick(['Jan', 'Lucie', 'Paul', 'Inès', 'Noé']);
    const [cont, obj] = rng.pick(OBJETS);
    return mcq(ctx, rng, `sens-${a}-${b}-${obj}`, {
      question: `${qui} a ${a} ${cont} de ${b} ${obj}. Quelle écriture permet de trouver le nombre de ${obj} ?`,
      good: `${a} × ${fmt(b)}`,
      wrong: [`${a} + ${fmt(b)}`, `${fmt(b)} − ${a}`, `${a} × ${a}`, `${fmt(b)} + ${fmt(b)}`],
      explication: `${qui} a ${a} fois ${b} ${obj} : on écrit ${a} × ${b} ${obj}.`,
      difficulty: 0.4,
    });
  }
  return mcq(ctx, rng, `egal-${a}-${b}`, {
    question: `Quelle écriture est égale à ${a} × ${fmt(b)} ?`,
    good: `${fmt(b)} × ${a}`,
    wrong: [
      `${a} + ${fmt(b)}`,
      `${a} × ${a}`,
      `${fmt(b)} + ${a}`,
      a === b ? `${a} + ${a}` : `${fmt(b)} × ${fmt(b)}`,
    ],
    explication: `On peut changer l’ordre dans une multiplication : ${a} × ${b} = ${b} × ${a}.`,
    difficulty: 0.35,
  });
};

export const CALCUL_POSE: Record<string, LessonContent> = {
  'CE1.MA.CP.ADD': { gens: { numeric_answer: addNumeric, mcq: addQcm, true_false: addVraiFaux } },
  'CE1.MA.CP.SOUS': { gens: { numeric_answer: sousNumeric, mcq: sousQcm, true_false: sousVraiFaux } },
  'CE1.MA.CP.MULT_SENS': {
    gens: { numeric_answer: multNumeric, fill_blank: multTrou, pairing: multPaires, mcq: multQcm },
  },
};
