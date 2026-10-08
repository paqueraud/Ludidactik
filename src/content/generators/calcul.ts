/**
 * Générateurs de calcul mental CE1 (BO n°41 du 31/10/2024) et CM2 (BO n°16 du 17/04/2025).
 * Fonctions pures, paramétrées par (niveau, rng). Les décimaux sont calculés en entiers
 * (dixièmes, centièmes) pour éviter les erreurs d'arrondi.
 */
import type { Level, NumericItem } from '@/content/schemas';
import { formatNumber, roundTo } from '@/engine/answer';
import type { Rng } from '@/engine/rng';

export type CalcSpec = Omit<NumericItem, 'id' | 'lessonId' | 'kind'>;
export type CalcGenerator = (level: Level, rng: Rng) => CalcSpec;

const f = (n: number) => formatNumber(n);
/** « 1 dizaine », « 3 dizaines ». */
const pl = (n: number, mot: string) => `${n} ${mot}${Math.abs(n) >= 2 ? 's' : ''}`;
/** Version orale : « 3,5 » se lit « 3 virgule 5 ». */
const say = (n: number) => formatNumber(n).replace(/ /g, ' ').replace(',', ' virgule ');
const decimalsOf = (n: number) => {
  const s = String(roundTo(n, 3));
  return s.includes('.') ? s.split('.')[1]!.length : 0;
};

function spec(
  prompt: string,
  spoken: string,
  answer: number,
  explication: string,
  difficulty: number,
): CalcSpec {
  const a = roundTo(answer, 3);
  return {
    prompt,
    spoken,
    answer: a,
    decimals: decimalsOf(a),
    explication,
    difficulty: Math.min(1, Math.max(0, difficulty)),
  };
}

const plus = (a: number, b: number, d: number, why: string) =>
  spec(`${f(a)} + ${f(b)}`, `${say(a)} plus ${say(b)}`, a + b, why, d);
const minus = (a: number, b: number, d: number, why: string) =>
  spec(`${f(a)} − ${f(b)}`, `${say(a)} moins ${say(b)}`, a - b, why, d);
const times = (a: number, b: number, d: number, why: string) =>
  spec(`${f(a)} × ${f(b)}`, `${say(a)} fois ${say(b)}`, a * b, why, d);

/* ================================================================== */
/* CE1 — nombres jusqu'à 1 000                                         */
/* ================================================================== */

const ce1TablesAdd: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const a = rng.int(1, 9);
    const b = rng.int(1, 10 - a);
    return plus(a, b, (a + b) / 10, `${a} + ${b} = ${a + b}.`);
  }
  if (level === 'plus_loin' && rng.chance(0.25)) {
    // trois termes, somme ≤ 20 : je cherche d'abord le 10
    const x = rng.int(2, 8);
    const y = 10 - x;
    const z = rng.int(2, 9);
    const [p, q, r] = rng.shuffle([x, y, z]);
    return spec(
      `${p} + ${q} + ${r}`,
      `${p} plus ${q} plus ${r}`,
      x + y + z,
      `Je cherche les deux nombres qui font 10 : ${x} + ${y} = 10, puis 10 + ${z} = ${10 + z}.`,
      0.9,
    );
  }
  // Plus loin : toujours avec passage de la dizaine (résultats de 11 à 18), sans la forme directe
  const a = level === 'plus_loin' ? rng.int(4, 9) : rng.int(2, 9);
  const b = level === 'plus_loin' ? rng.int(Math.max(2, 11 - a), 9) : rng.int(2, 9);
  const c = a + b;
  const form = level === 'normal' ? rng.int(0, 2) : rng.int(1, 3);
  const d = c / 18;
  if (form === 0) return plus(a, b, d, `${a} + ${b} = ${c}.`);
  if (form === 1)
    return spec(
      `${a} + … = ${c}`,
      `${a} plus combien égale ${c} ?`,
      b,
      `Il faut ajouter ${b}, car ${a} + ${b} = ${c}.`,
      d + 0.1,
    );
  if (form === 2) return minus(c, a, d + 0.1, `${c} − ${a} = ${b}, car ${a} + ${b} = ${c}.`);
  return spec(
    `… − ${a} = ${b}`,
    `combien moins ${a} égale ${b} ?`,
    c,
    `${b} + ${a} = ${c}, donc ${c} − ${a} = ${b}.`,
    d + 0.2,
  );
};

const ce1Complements: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const a = rng.int(1, 9);
    return spec(`${a} + … = 10`, `${a} plus combien égale 10 ?`, 10 - a, `${a} + ${10 - a} = 10.`, 0.2);
  }
  if (level === 'normal') {
    const form = rng.int(0, 3);
    if (form === 0) {
      const a = rng.int(1, 9) * 10;
      return spec(
        `${a} + … = 100`,
        `${a} plus combien égale 100 ?`,
        100 - a,
        `${pl(a / 10, 'dizaine')} + ${pl((100 - a) / 10, 'dizaine')} = 10 dizaines = 100.`,
        0.3,
      );
    }
    if (form === 1) {
      const a = rng.int(11, 89);
      const r = 100 - a;
      return spec(
        `${a} + … = 100`,
        `${a} plus combien égale 100 ?`,
        r,
        `${a} + ${r} = 100 (je vais à la dizaine puis à 100).`,
        0.7,
      );
    }
    if (form === 2) {
      const a = rng.int(1, 9) * 100;
      return spec(
        `${f(a)} + … = 1 000`,
        `${a} plus combien égale 1000 ?`,
        1000 - a,
        `${pl(a / 100, 'centaine')} + ${pl((1000 - a) / 100, 'centaine')} = 10 centaines = 1 000.`,
        0.5,
      );
    }
    let a = rng.int(12, 98);
    if (a % 10 === 0) a += 3;
    const up = Math.ceil(a / 10) * 10;
    return spec(
      `${a} + … = ${up}`,
      `${a} plus combien égale ${up} ?`,
      up - a,
      `Pour aller à la dizaine suivante : ${a} + ${up - a} = ${up}.`,
      0.4,
    );
  }
  let a = rng.int(101, 989);
  if (a % 10 === 0) a += 7;
  return spec(
    `${f(a)} + … = 1 000`,
    `${a} plus combien égale 1000 ?`,
    1000 - a,
    `${a} + ${1000 - a} = 1 000 (dizaine, puis centaine, puis 1 000).`,
    0.8,
  );
};

/** Liste BO CE1 : doubles de 1 à 15, de 20, 25…50, de 100, 150, 200, 250, 300, 500. */
const CE1_DOUBLES = [
  ...Array.from({ length: 15 }, (_, i) => i + 1),
  20,
  25,
  30,
  35,
  40,
  45,
  50,
  100,
  150,
  200,
  250,
  300,
  500,
];
/** Moitiés BO : pairs de 2 à 30, dizaines de 40 à 100, centaines de 200 à 600, et 1 000. */
const CE1_MOITIES = [
  ...Array.from({ length: 15 }, (_, i) => (i + 1) * 2),
  40,
  50,
  60,
  70,
  80,
  90,
  100,
  200,
  300,
  400,
  500,
  600,
  1000,
];

const ce1DoublesMoities: CalcGenerator = (level, rng) => {
  const double = (n: number, d: number) =>
    spec(
      `Le double de ${f(n)}`,
      `le double de ${n}`,
      2 * n,
      `Le double de ${n}, c’est ${n} + ${n} = ${f(2 * n)}.`,
      d,
    );
  const moitie = (n: number, d: number) =>
    spec(
      `La moitié de ${f(n)}`,
      `la moitié de ${n}`,
      n / 2,
      `La moitié de ${n}, c’est ${f(n / 2)}, car ${f(n / 2)} + ${f(n / 2)} = ${f(n)}.`,
      d,
    );
  if (level === 'facile')
    return rng.chance(0.5) ? double(rng.int(1, 10), 0.2) : moitie(rng.int(1, 10) * 2, 0.3);
  /** Moitié par décomposition : moitié de 470 = moitié de 400 + moitié de 70 (attendu CE1). */
  const moitieDecomp = (n: number, d: number) => {
    const c = Math.floor(n / 100) * 100;
    return spec(
      `La moitié de ${n}`,
      `la moitié de ${n}`,
      n / 2,
      `Je décompose : moitié de ${c} = ${c / 2}, moitié de ${n - c} = ${(n - c) / 2}, donc ${n / 2}.`,
      d,
    );
  };
  if (level === 'normal') {
    const form = rng.int(0, 5);
    if (form <= 1) return double(rng.pick(CE1_DOUBLES), 0.5);
    if (form <= 3) return moitie(rng.pick(CE1_MOITIES), 0.6);
    if (form === 4) {
      let n = rng.int(11, 49) * 10;
      if (n % 100 === 0) n += 20;
      return moitieDecomp(n, 0.8);
    }
    const k = rng.int(1, 4);
    const sum = Array<string>(k).fill('25').join(' + ');
    return spec(
      `${k} × 25`,
      `${k} fois 25`,
      k * 25,
      k === 1 ? '1 × 25 = 25.' : `${k} × 25, c’est ${sum} = ${k * 25}.`,
      0.5,
    );
  }
  // Plus loin : moitié d'un nombre pair à 3 chiffres (974), double d'un nombre à 2 chiffres
  if (rng.chance(0.5)) {
    let n = rng.int(51, 499) * 2;
    if (n % 100 === 0) n += 2;
    return moitieDecomp(n, 0.9);
  }
  let n = rng.int(16, 49);
  if (n % 10 === 0) n += 3;
  const dz = Math.floor(n / 10) * 10;
  return spec(
    `Le double de ${n}`,
    `le double de ${n}`,
    2 * n,
    `Je décompose : double de ${dz} = ${2 * dz}, double de ${n - dz} = ${2 * (n - dz)}, donc ${2 * n}.`,
    0.8,
  );
};

const ce1TablesMult: CalcGenerator = (level, rng) => {
  const tables = level === 'facile' ? [2, 5, 10] : level === 'normal' ? [2, 3, 4, 5, 10] : [6, 7, 8, 9];
  const t = rng.pick(tables);
  const n = rng.int(1, 10);
  const why = `${n} × ${t} = ${n * t}. Astuce : ${t} × ${n} donne le même résultat.`;
  if (level === 'plus_loin' && rng.chance(0.4))
    return spec(
      `… × ${t} = ${n * t}`,
      `combien fois ${t} égale ${n * t} ?`,
      n,
      `${n} × ${t} = ${n * t}.`,
      0.9,
    );
  const d = (n * t) / 100;
  return rng.chance(0.5) ? times(n, t, d, why) : times(t, n, d, why);
};

const ce1DizCent: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    // sans retenue
    const c = rng.int(1, 8);
    const d = rng.int(0, 5);
    const u = rng.int(0, 9);
    const n = c * 100 + d * 10 + u;
    if (rng.chance(0.5)) {
      const k = rng.int(1, 9 - d);
      return plus(
        n,
        k * 10,
        0.3,
        `J’ajoute ${pl(k, 'dizaine')} : ${d} + ${k} = ${pl(d + k, 'dizaine')}, donc ${n + k * 10}.`,
      );
    }
    const k = rng.int(1, 9 - c);
    return plus(
      n,
      k * 100,
      0.3,
      `J’ajoute ${pl(k, 'centaine')} : ${c} + ${k} = ${pl(c + k, 'centaine')}, donc ${n + k * 100}.`,
    );
  }
  if (level === 'normal') {
    // avec passage de la centaine : 746 + 80 ; 765 − 200 ; 523 − 60
    const form = rng.int(0, 2);
    if (form === 0) {
      const d = rng.int(3, 9);
      const n = rng.int(1, 8) * 100 + d * 10 + rng.int(0, 9);
      const k = rng.int(10 - d, 9);
      return plus(
        n,
        k * 10,
        0.6,
        `${n} + ${k * 10} : ${pl(k, 'dizaine')} de plus, je passe la centaine → ${n + k * 10}.`,
      );
    }
    if (form === 1) {
      const n = rng.int(300, 999);
      const k = rng.int(1, Math.floor(n / 100) - 1);
      return minus(n, k * 100, 0.5, `J’enlève ${pl(k, 'centaine')} : ${n} − ${k * 100} = ${n - k * 100}.`);
    }
    const d = rng.int(0, 5);
    const n = rng.int(2, 9) * 100 + d * 10 + rng.int(0, 9);
    const k = rng.int(d + 1, 9);
    return minus(
      n,
      k * 10,
      0.7,
      `J’enlève ${pl(k, 'dizaine')}, je descends sous la centaine : ${n} − ${k * 10} = ${n - k * 10}.`,
    );
  }
  // Plus loin : deux étapes
  const n = rng.int(100, 500);
  const a = rng.int(1, 3) * 100;
  const b = rng.int(1, 9) * 10;
  return spec(
    `${n} + ${a} + ${b}`,
    `${n} plus ${a} plus ${b}`,
    n + a + b,
    `D’abord + ${a} = ${n + a}, puis + ${b} = ${n + a + b}.`,
    0.9,
  );
};

const ce1X10: CalcGenerator = (level, rng) => {
  if (level === 'plus_loin') {
    if (rng.chance(0.5)) {
      const n = rng.int(1, 9);
      return times(
        n,
        100,
        0.8,
        `${n} × 100 = ${n * 100} : ${n === 1 ? '1 unité devient 1 centaine' : `${n} unités deviennent ${n} centaines`}.`,
      );
    }
    const n = rng.int(10, 99);
    return spec(`… × 10 = ${n * 10}`, `combien fois 10 égale ${n * 10} ?`, n, `${n} × 10 = ${n * 10}.`, 0.9);
  }
  const n = level === 'facile' ? rng.int(1, 10) : rng.int(11, 99);
  return times(
    n,
    10,
    level === 'facile' ? 0.2 : 0.5,
    `${n} × 10 = ${n * 10} : chaque unité devient une dizaine.`,
  );
};

const ce1Plus9: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const n = rng.int(11, 89);
    return plus(n, 9, 0.3, `+ 9, c’est + 10 puis − 1 : ${n + 10} − 1 = ${n + 9}.`);
  }
  if (level === 'normal') {
    const k = rng.pick([9, 19, 29, -9]);
    if (k < 0) {
      const n = rng.int(20, 999);
      return minus(n, 9, 0.5, `− 9, c’est − 10 puis + 1 : ${n - 10} + 1 = ${n - 9}.`);
    }
    const n = rng.int(10, 999 - k);
    const r = k + 1;
    return plus(n, k, 0.4 + k / 60, `+ ${k}, c’est + ${r} puis − 1 : ${n + r} − 1 = ${n + k}.`);
  }
  if (rng.chance(0.5)) {
    const n = rng.int(100, 900);
    return plus(n, 99, 0.8, `+ 99, c’est + 100 puis − 1 : ${n + 100} − 1 = ${n + 99}.`);
  }
  const k = rng.pick([19, 29]);
  const n = rng.int(k + 20, 999);
  return minus(n, k, 0.9, `− ${k}, c’est − ${k + 1} puis + 1 : ${n - k - 1} + 1 = ${n - k}.`);
};

const ce1MoinsPetit: CalcGenerator = (level, rng) => {
  const base = rng.int(2, 99) * 10;
  if (level === 'facile') {
    const u = rng.int(3, 9);
    const k = rng.int(1, u);
    const n = base + u;
    return minus(n, k, 0.3, `Je n’enlève que des unités : ${u} − ${k} = ${u - k}, donc ${n - k}.`);
  }
  if (level === 'normal') {
    const u = rng.int(1, 7);
    const k = rng.int(u + 1, 9);
    const n = base + u;
    return minus(n, k, 0.6, `${n} − ${u} = ${base}, puis ${base} − ${k - u} = ${n - k}.`);
  }
  const k = rng.pick([11, 12, 13]);
  const n = base + rng.int(0, 2);
  return minus(n, k, 0.9, `− ${k}, c’est − 10 puis − ${k - 10} : ${n - 10} − ${k - 10} = ${n - k}.`);
};

const ce1Distrib: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const n = rng.int(11, 19);
    return times(n, 2, 0.3, `${n} × 2 = 10 × 2 + ${n - 10} × 2 = 20 + ${2 * (n - 10)} = ${2 * n}.`);
  }
  const n = level === 'normal' ? rng.int(11, 19) : rng.int(21, 29);
  const k = rng.int(2, 9);
  const dz = Math.floor(n / 10) * 10;
  return times(
    n,
    k,
    level === 'normal' ? 0.6 : 0.9,
    `${n} × ${k} = ${dz} × ${k} + ${n - dz} × ${k} = ${dz * k} + ${(n - dz) * k} = ${n * k}.`,
  );
};

/* ================================================================== */
/* CM2 — BO 2025                                                       */
/* ================================================================== */

const cm2Faits: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    return rng.chance(0.5)
      ? times(a, b, 0.3, `${a} × ${b} = ${a * b}.`)
      : plus(a, b, 0.1, `${a} + ${b} = ${a + b}.`);
  }
  if (level === 'normal') {
    const form = rng.int(0, 3);
    if (form === 0) {
      const a = rng.int(6, 9);
      const b = rng.int(6, 9);
      return times(a, b, 0.4, `${a} × ${b} = ${a * b}.`);
    }
    if (form === 1) {
      const n = rng.pick([1, 3, 5, 7, 9, 11, 13, 15]);
      return spec(
        `La moitié de ${n}`,
        `la moitié de ${n}`,
        n / 2,
        `${f(n / 2)} + ${f(n / 2)} = ${n}, donc la moitié de ${n} est ${f(n / 2)}.`,
        0.6,
      );
    }
    if (form === 2) {
      const c = rng.pick([
        ['Combien de quarts dans un demi ?', 'combien de quarts dans un demi ?', 2, '1/2 = 2/4.'],
        ['Combien de dixièmes dans une unité ?', 'combien de dixièmes dans une unité ?', 10, '1 = 10/10.'],
        [
          'Combien de centièmes dans un dixième ?',
          'combien de centièmes dans un dixième ?',
          10,
          '1/10 = 10/100.',
        ],
        ['Combien de quarts dans une unité ?', 'combien de quarts dans une unité ?', 4, '1 = 4/4.'],
        ['Combien de demis dans 3 unités ?', 'combien de demis dans 3 unités ?', 6, '3 = 6/2.'],
        [
          'Combien de millièmes dans un centième ?',
          'combien de millièmes dans un centième ?',
          10,
          '1/100 = 10/1000.',
        ],
      ] as const);
      return spec(c[0], c[1], c[2], c[3], 0.6);
    }
    const a = rng.int(3, 9);
    const b = rng.int(3, 9);
    return spec(
      `${a * b} ÷ ${a}`,
      `${a * b} divisé par ${a}`,
      b,
      `${a} × ${b} = ${a * b}, donc ${a * b} ÷ ${a} = ${b}.`,
      0.5,
    );
  }
  const n = rng.int(11, 12);
  if (rng.chance(0.5)) return times(n, n, 0.8, `${n} × ${n} = ${n * n}.`);
  const m = rng.int(2, 12);
  return times(m, m, 0.6, `${m} × ${m} = ${m * m} (c’est le carré de ${m}).`);
};

const cm2DecEntier: CalcGenerator = (level, rng) => {
  if (level === 'plus_loin') {
    if (rng.chance(0.5)) {
      // décimal − entier avec retenue : 32,4 − 7
      const e = rng.int(2, 9) * 10 + rng.int(0, 5);
      const k = rng.int((e % 10) + 1, 9);
      const y = e + rng.int(1, 9) / 10;
      return minus(
        y,
        k,
        0.8,
        `${e} − ${k} = ${e - k} (je passe la dizaine), et je garde les dixièmes : ${f(y - k)}.`,
      );
    }
    let a: number;
    let b: number;
    do {
      a = rng.int(11, 99);
      b = rng.int(11, 99);
    } while (a % 10 === 0 || b % 10 === 0);
    return plus(
      a / 10,
      b / 10,
      0.8,
      `J’ajoute les dixièmes : ${a} + ${b} = ${a + b} dixièmes, donc ${f((a + b) / 10)}.`,
    );
  }
  const ent = rng.int(1, 30);
  const dix = rng.int(1, 9);
  const x = ent + dix / 10;
  if (level === 'facile') {
    // sans retenue sur les unités
    const u = ent % 10;
    if (u === 9 || (u >= 2 && rng.chance(0.5))) {
      const k = rng.int(1, u);
      return minus(
        x,
        k,
        0.3,
        `La partie entière : ${ent} − ${k} = ${ent - k}. Les dixièmes ne bougent pas : ${f(x - k)}.`,
      );
    }
    const k = rng.int(1, 9 - u);
    return plus(
      x,
      k,
      0.3,
      `La partie entière : ${ent} + ${k} = ${ent + k}. Les dixièmes ne bougent pas : ${f(x + k)}.`,
    );
  }
  // Normal : soustraction sans retenue, ou addition avec retenue sur les unités
  const keep = `je garde les ${dix} dixièmes`;
  const u = ent % 10;
  if (u >= 2 && rng.chance(0.4)) {
    const k = rng.int(1, u) + 10 * rng.int(0, Math.floor(ent / 10));
    return minus(x, k, 0.5, `${ent} − ${k} = ${ent - k}, et ${keep} : ${f(x - k)}.`);
  }
  const k = rng.int(5, 19);
  return plus(x, k, 0.6, `${ent} + ${k} = ${ent + k}, et ${keep} : ${f(x + k)}.`);
};

const cm2X10Dec: CalcGenerator = (level, rng) => {
  const p = rng.pick([10, 100, 1000]);
  const rangs = String(p).length - 1;
  const why = (op: string, calcul: string) =>
    `${op} par ${f(p)}, c’est décaler chaque chiffre de ${rangs} rang${rangs > 1 ? 's' : ''} vers la ${op === 'Multiplier' ? 'gauche' : 'droite'} : ${calcul}.`;
  if (level === 'facile') {
    const n = rng.int(2, 99);
    if (rng.chance(0.6)) return times(n, p, 0.3, why('Multiplier', `${f(n)} × ${f(p)} = ${f(n * p)}`));
    return spec(
      `${f(n * p)} ÷ ${f(p)}`,
      `${n * p} divisé par ${p}`,
      n,
      why('Diviser', `${f(n * p)} ÷ ${f(p)} = ${f(n)}`),
      0.3,
    );
  }
  if (level === 'normal') {
    const x = rng.int(11, 999) / 100;
    if (rng.chance(0.5))
      return times(x, p, 0.6, why('Multiplier', `${f(x)} × ${f(p)} = ${f(roundTo(x * p, 3))}`));
    const n = rng.int(3, 999);
    return spec(
      `${f(n)} ÷ ${f(p)}`,
      `${n} divisé par ${p}`,
      n / p,
      why('Diviser', `${f(n)} ÷ ${f(p)} = ${f(roundTo(n / p, 3))}`),
      0.7,
    );
  }
  const q = rng.pick([0.1, 0.01]);
  const n = rng.int(12, 999);
  return times(
    n,
    q,
    0.9,
    `Multiplier par ${f(q)}, c’est diviser par ${f(Math.round(1 / q))} : ${f(n)} × ${f(q)} = ${f(roundTo(n * q, 3))} (notion de 6e).`,
  );
};

const cm2AddDec: CalcGenerator = (level, rng) => {
  if (level === 'plus_loin') {
    const a = rng.int(101, 899);
    const b = rng.int(10, 99) * 10;
    return plus(
      a / 100,
      b / 100,
      0.9,
      `J’aligne les centièmes : ${a} + ${b} = ${a + b} centièmes, donc ${f((a + b) / 100)}.`,
    );
  }
  let a: number;
  let b: number;
  do {
    a = rng.int(11, 89);
    b = rng.int(11, 89);
  } while (
    a % 10 === 0 ||
    b % 10 === 0 ||
    a + b >= 100 ||
    (level === 'facile' ? (a % 10) + (b % 10) >= 10 : (a % 10) + (b % 10) < 10)
  );
  const carry =
    level === 'facile' ? '' : ` ${(a % 10) + (b % 10)} dixièmes = 1 unité et ${(a + b) % 10} dixièmes.`;
  return plus(
    a / 10,
    b / 10,
    level === 'facile' ? 0.3 : 0.6,
    `Unités : ${Math.floor(a / 10)} + ${Math.floor(b / 10)} ; dixièmes : ${a % 10} + ${b % 10}.${carry} Total : ${f((a + b) / 10)}.`,
  );
};

const cm2Plus99: CalcGenerator = (level, rng) => {
  const ks =
    level === 'facile'
      ? [9]
      : level === 'normal'
        ? [8, 9, 18, 19, 28, 29, 38, 39, 48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]
        : [998, 999];
  const k = rng.pick(ks);
  const up = k < 100 ? Math.ceil(k / 10) * 10 : 1000;
  const r = up - k;
  if (rng.chance(0.5)) {
    const n = rng.int(100, k > 100 ? 9000 : 900);
    return plus(n, k, k / 100, `+ ${k}, c’est + ${up} puis − ${r} : ${f(n + up)} − ${r} = ${f(n + k)}.`);
  }
  const n = rng.int(k + 100, k > 100 ? 9999 : 999);
  return minus(n, k, k / 100 + 0.1, `− ${k}, c’est − ${up} puis + ${r} : ${f(n - up)} + ${r} = ${f(n - k)}.`);
};

const zeros = (n: number) => String(n).match(/0*$/)![0].length;

const cm2MultRonds: CalcGenerator = (level, rng) => {
  const pow = level === 'facile' ? [10] : level === 'normal' ? [10, 100, 1000] : [1000];
  const a = rng.int(2, 9) * rng.pick(pow);
  const b = level === 'facile' ? rng.int(2, 9) : rng.int(2, 9) * rng.pick(pow);
  const da = a / 10 ** zeros(a);
  const db = b / 10 ** zeros(b);
  const z = zeros(a) + zeros(b);
  return times(
    a,
    b,
    level === 'facile' ? 0.3 : level === 'normal' ? 0.6 : 0.9,
    `${da} × ${db} = ${da * db} et ${f(10 ** zeros(a))} × ${f(10 ** zeros(b))} = ${f(10 ** z)}, donc ${f(a)} × ${f(b)} = ${da * db} × ${f(10 ** z)} = ${f(a * b)}.`,
  );
};

const cm2Distrib: CalcGenerator = (level, rng) => {
  if (level === 'facile') {
    const n = rng.int(12, 45);
    return times(n, 11, 0.3, `${n} × 11 = ${n} × 10 + ${n} = ${n * 10} + ${n} = ${n * 11}.`);
  }
  if (level === 'normal') {
    const c = rng.pick([
      [rng.int(21, 49), rng.int(3, 6)],
      [12, rng.int(12, 19)],
      [25, rng.int(11, 16)],
    ] as const);
    const [n, k] = c;
    const dz = Math.floor(n / 10) * 10;
    return times(
      n,
      k,
      0.6,
      `${n} × ${k} = ${dz} × ${k} + ${n - dz} × ${k} = ${dz * k} + ${(n - dz) * k} = ${n * k}.`,
    );
  }
  const n = rng.int(12, 89);
  if (rng.chance(0.5))
    return times(n, 99, 0.9, `${n} × 99 = ${n} × 100 − ${n} = ${f(n * 100)} − ${n} = ${f(n * 99)}.`);
  return times(n, 101, 0.9, `${n} × 101 = ${n} × 100 + ${n} = ${f(n * 100)} + ${n} = ${f(n * 101)}.`);
};

const cm2DoubleMoitieDec: CalcGenerator = (level, rng) => {
  const pickTenths = () => {
    if (level === 'facile') return rng.pick([12, 14, 22, 24, 32, 34, 42, 44, 26, 36]);
    if (level === 'normal') return rng.int(11, 99);
    return rng.int(101, 199);
  };
  const t = pickTenths();
  const x = t / 10;
  if (rng.chance(0.5) || (level !== 'plus_loin' && t % 2 === 1)) {
    return spec(
      `Le double de ${f(x)}`,
      `le double de ${say(x)}`,
      2 * x,
      `Double des unités et double des dixièmes : ${f(x)} + ${f(x)} = ${f(2 * x)}.`,
      level === 'facile' ? 0.3 : 0.6,
    );
  }
  return spec(
    `La moitié de ${f(x)}`,
    `la moitié de ${say(x)}`,
    x / 2,
    `${f(x / 2)} + ${f(x / 2)} = ${f(x)}.`,
    level === 'plus_loin' ? 0.9 : 0.6,
  );
};

const cm2Div48: CalcGenerator = (level, rng) => {
  const d = level === 'facile' ? 2 : level === 'normal' ? rng.pick([4, 8]) : 16;
  const q = level === 'facile' ? rng.int(12, 99) : rng.int(6, 125);
  const n = q * d;
  const steps = Math.log2(d);
  return spec(
    `${f(n)} ÷ ${d}`,
    `${n} divisé par ${d}`,
    q,
    d === 2
      ? `La moitié de ${n} est ${q}.`
      : `Diviser par ${d}, c’est prendre ${steps} fois la moitié : ${Array.from({ length: steps + 1 }, (_, i) => f(n / 2 ** i)).join(' → ')}.`,
    level === 'facile' ? 0.3 : 0.6 + d / 40,
  );
};

const cm2X5X50: CalcGenerator = (level, rng) => {
  if (level === 'plus_loin') {
    const n = rng.int(4, 48);
    return times(n, 25, 0.9, `× 25, c’est × 100 puis ÷ 4 : ${n * 100} ÷ 4 = ${n * 25}.`);
  }
  const k = rng.pick([5, 50]);
  const x = level === 'facile' ? rng.int(4, 48) : rng.int(11, 99) / 10;
  const by = k === 5 ? 10 : 100;
  return times(
    x,
    k,
    level === 'facile' ? 0.3 : 0.6,
    `× ${k}, c’est × ${by} puis ÷ 2 : ${f(x * by)} ÷ 2 = ${f(x * k)}.`,
  );
};

/** Registre : nom de générateur (id de leçon en minuscules) → fonction. */
export const CALC_GENERATORS: Record<string, CalcGenerator> = {
  'ce1.ma.cm.tables_add': ce1TablesAdd,
  'ce1.ma.cm.complements': ce1Complements,
  'ce1.ma.cm.doubles_moities': ce1DoublesMoities,
  'ce1.ma.cm.tables_mult': ce1TablesMult,
  'ce1.ma.cm.diz_cent': ce1DizCent,
  'ce1.ma.cm.x10': ce1X10,
  'ce1.ma.cm.plus9': ce1Plus9,
  'ce1.ma.cm.moins_petit': ce1MoinsPetit,
  'ce1.ma.cm.distrib': ce1Distrib,
  'cm2.ma.cm.faits': cm2Faits,
  'cm2.ma.cm.dec_entier': cm2DecEntier,
  'cm2.ma.cm.x10_dec': cm2X10Dec,
  'cm2.ma.cm.add_dec': cm2AddDec,
  'cm2.ma.cm.plus99': cm2Plus99,
  'cm2.ma.cm.mult_ronds': cm2MultRonds,
  'cm2.ma.cm.distrib': cm2Distrib,
  'cm2.ma.cm.double_moitie_dec': cm2DoubleMoitieDec,
  'cm2.ma.cm.div4_8': cm2Div48,
  'cm2.ma.cm.x5_x50': cm2X5X50,
};
