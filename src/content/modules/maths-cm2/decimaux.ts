/**
 * CM2 — Nombres décimaux (BO n°16 du 17/04/2025, cycle 3, « Les nombres décimaux » et « Le calcul mental ») :
 * fractions décimales /10, /100, /1 000 ↔ écriture à virgule, relations entre unités, dixièmes, centièmes et
 * millièmes ; comparer, encadrer, intercaler, ranger ; partie entière, arrondi à l'unité ; demi-droite graduée ;
 * écriture décimale des fractions usuelles. L'étude s'étend aux millièmes (jamais au-delà).
 *
 * Tous les calculs se font en ENTIERS de millièmes (`m`) : la valeur affichée est `m / 1 000`.
 * Les fractions sont écrites « 4107/1000 » (sans espace dans une écriture fractionnaire en ligne).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemGen, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import {
  clamp01,
  comparaison,
  fmt,
  fractionEnMots,
  make,
  mcq,
  nomDenominateur,
  numeric,
  parNiv,
  signe,
  vraiFaux,
} from './util';

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */

/** Écriture à virgule d'un nombre de millièmes (« 3,405 »). `dec` force le nombre de décimales (« 2,30 »). */
const dm = (m: number, dec?: number) => fmt(m / 1000, dec);
/** Lecture à voix haute d'une écriture affichée : « 3,05 » → « 3 virgule 05 » (les zéros sont prononcés). */
const lu = (s: string) =>
  s
    .replace(/ /g, '')
    .replace(
      /(\d+),(\d+)/g,
      (_, e: string, d: string) => `${e} virgule ${d.replace(/^0+/, (z) => 'zéro '.repeat(z.length))}`,
    )
    .replace(/(\d+)\/(\d+)/g, (_, n: string, d: string) => fractionEnMots(Number(n), Number(d)))
    .replace(/ \+ /g, ' plus ')
    .replace(/ = /g, ' égale ')
    .replace(/…/g, 'combien');
/** Nombre de décimales significatives d'un nombre de millièmes. */
const decs = (m: number) => (m % 1000 === 0 ? 0 : m % 100 === 0 ? 1 : m % 10 === 0 ? 2 : 3);
const ent = (m: number) => Math.floor(m / 1000);
const fr = (n: number, d: number) => `${n}/${d}`;
/** Lecture d'une fraction : en lettres jusqu'à 99, en chiffres au-delà (« 6206 centièmes »). */
const fracDite = (n: number, d: number) =>
  n < 100 ? fractionEnMots(n, d) : `${n} ${nomDenominateur(d, true)}`;

const RANGS = ['millièmes', 'centièmes', 'dixièmes', 'unités', 'dizaines', 'centaines'] as const;
/** « 1 dixième », « 3 dixièmes ». */
const valeurRang = (c: number, r: number) => `${c} ${c >= 2 ? RANGS[r] : RANGS[r]!.slice(0, -1)}`;
/** Chiffre de rang r (0 = millièmes, 3 = unités) d'un nombre de millièmes. */
const chiffre = (m: number, r: number) => Math.floor(m / 10 ** r) % 10;

/** Décomposition « 3 + 2/10 + 5/100 + 7/1000 » (termes nuls omis). */
function somme(m: number): string {
  const t: string[] = [];
  if (ent(m)) t.push(fmt(ent(m)));
  if (chiffre(m, 2)) t.push(fr(chiffre(m, 2), 10));
  if (chiffre(m, 1)) t.push(fr(chiffre(m, 1), 100));
  if (chiffre(m, 0)) t.push(fr(chiffre(m, 0), 1000));
  return t.join(' + ') || '0';
}

/** Fraction décimale « naturelle » d'un nombre : 3,47 → [347, 100]. */
function enFraction(m: number): [number, number] {
  const d = [1, 10, 100, 1000][decs(m)]!;
  return [(m * d) / 1000, d];
}

const pas = (n: number) => Math.round(n * 1000) / 1000;

/** Demi-droite graduée (zoom) : `min`, `max`, `step` en millièmes ; tolérance = 0,4 sous-graduation. */
function ligne(
  ctx: GenContext,
  sig: string,
  f: {
    min: number;
    max: number;
    step: number;
    target: number;
    display: string;
    explication: string;
    difficulty: number;
    spoken?: string;
  },
): ItemOf<'number_line'> {
  const sous = f.step / 10;
  return make(ctx, 'number_line', sig, {
    prompt: `Place ${f.display} sur la droite graduée.`,
    spoken: f.spoken ?? `Place ${lu(f.display)} sur la droite graduée.`,
    min: pas(f.min / 1000),
    max: pas(f.max / 1000),
    step: pas(f.step / 1000),
    subdivisions: 10,
    target: pas(f.target / 1000),
    display: f.display,
    tolerance: Math.round(((0.4 * sous) / 1000) * 1e6) / 1e6,
    explication: f.explication,
    difficulty: clamp01(f.difficulty),
  });
}

/* ------------------------------------------------------------------ */
/* CM2.MA.DEC.FRAC_DEC — fractions décimales ↔ écriture à virgule       */
/* ------------------------------------------------------------------ */

/** Nombre de millièmes « intéressant » : facile au dixième, normal jusqu'au millième avec des zéros. */
function tirerDecimal(level: Level, rng: Rng): number {
  if (level === 'facile') {
    const n = rng.int(1, 99);
    return (n % 10 === 0 ? n + rng.int(1, 9) : n) * 100;
  }
  const e = rng.int(0, level === 'normal' ? 99 : 999);
  const forme = rng.int(0, 3);
  // zéros intercalés (4,07 ; 4,007 ; 4,107) : le piège le plus fréquent
  const frac = [rng.int(1, 9) * 10, rng.int(1, 9), rng.int(11, 99) * 10, rng.int(101, 999)][forme]!;
  const m = e * 1000 + frac;
  return m % 10 === 0 && decs(m) === 3 ? m + 1 : m;
}

const fdNumeric: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 2), normal: rng.int(0, 4), plus_loin: rng.int(5, 8) });
  if (forme === 4) {
    const [a, b, f] = rng.pick([
      ['dixièmes', 'unité', 10],
      ['centièmes', 'dixième', 10],
      ['millièmes', 'centième', 10],
      ['centièmes', 'unité', 100],
      ['millièmes', 'dixième', 100],
      ['millièmes', 'unité', 1000],
    ] as const);
    const k = rng.int(1, 9);
    const rep = k * f;
    const q = `Combien de ${a} y a-t-il dans ${k} ${b}${k > 1 ? 's' : ''} ?`;
    return numeric(ctx, `rel-${a}-${b}-${k}`, {
      prompt: q,
      spoken: q,
      answer: rep,
      explication: `1 unité = 10 dixièmes = 100 centièmes = 1 000 millièmes ; donc ${k} ${b}${k > 1 ? 's' : ''} = ${fmt(rep)} ${a}.`,
      difficulty: 0.45 + (k > 1 ? 0.1 : 0),
    });
  }
  const m = tirerDecimal(level, rng);
  const [n, d] = enFraction(m);
  if (forme === 0) {
    const q = `${fr(n, d)} = …`;
    return numeric(ctx, `f2d-${n}-${d}`, {
      prompt: `Écris avec une virgule : ${q}`,
      spoken: `Écris ${fracDite(n, d)} avec une virgule.`,
      answer: m / 1000,
      explication: `${fr(n, d)}, c’est ${fmt(n)} ${nomDenominateur(d, true)} : ${fr(n, d)} = ${somme(m)} = ${dm(m)}.`,
      difficulty: 0.25 + decs(m) * 0.1 + (/0/.test(String(m % 1000)) ? 0.1 : 0),
    });
  }
  if (forme === 1) {
    return numeric(ctx, `d2f-${m}`, {
      prompt: `${dm(m)} = …/${d}`,
      spoken: `${lu(dm(m))} égale combien de ${nomDenominateur(d, true)} ?`,
      answer: n,
      explication: `${dm(m)} = ${somme(m)}, c’est ${fmt(n)} ${nomDenominateur(d, true)} : ${dm(m)} = ${fr(n, d)}.`,
      difficulty: 0.35 + decs(m) * 0.1,
    });
  }
  if (forme === 2) {
    const reste = m % 1000;
    const [rn, rd] = enFraction(reste);
    return numeric(ctx, `ent-frac-${m}`, {
      prompt: `${dm(m)} = ${fmt(ent(m))} + …/${rd}`,
      spoken: `${lu(dm(m))} égale ${ent(m)} plus combien de ${nomDenominateur(rd, true)} ?`,
      answer: rn,
      explication: `La partie entière est ${fmt(ent(m))} et la partie décimale vaut ${fr(rn, rd)} : ${dm(m)} = ${fmt(ent(m))} + ${fr(rn, rd)}.`,
      difficulty: 0.4 + decs(m) * 0.1,
    });
  }
  if (forme === 3) {
    // Somme de fractions décimales de numérateur < 10 (BO : 4 + 1/10 + 7/1000 = 4,107)
    let mm = m;
    if (decs(mm) < 3) mm = ent(mm) * 1000 + rng.int(1, 9) * 100 + rng.int(0, 9) * 10 + rng.int(1, 9);
    return numeric(ctx, `somme-${mm}`, {
      prompt: `${somme(mm)} = …`,
      spoken: `${lu(somme(mm))} égale combien ?`,
      answer: mm / 1000,
      explication: `Chaque fraction va à sa place : dixièmes, centièmes, millièmes (un 0 si une place est vide) : ${somme(mm)} = ${dm(mm)}.`,
      difficulty: 0.5 + (chiffre(mm, 1) === 0 ? 0.15 : 0),
    });
  }
  // Pour aller plus loin
  const e = rng.int(0, 99);
  if (forme === 5) {
    // termes dans le désordre, une place vide
    const c = [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)];
    c[rng.int(0, 2)] = 0;
    const termes = [fmt(e), ...c.map((x, i) => (x ? fr(x, [10, 100, 1000][i]!) : '')).filter(Boolean)];
    const t = rng.shuffle(termes).join(' + ');
    const mm = e * 1000 + c[0]! * 100 + c[1]! * 10 + c[2]!;
    return numeric(ctx, `desordre-${t}`, {
      prompt: `${t} = …`,
      spoken: `${lu(t)} égale combien ?`,
      answer: mm / 1000,
      explication: `On range chaque fraction à sa place (dixièmes, centièmes, millièmes) et on met 0 dans la place vide : ${dm(mm)}.`,
      difficulty: 0.75,
    });
  }
  if (forme === 6) {
    // numérateurs ≥ 10 : il faut regrouper (13/10 = 1 + 3/10)
    const a = rng.int(11, 39);
    const b = rng.int(1, 9);
    const mm = e * 1000 + a * 100 + b * 10;
    const t = `${fmt(e)} + ${fr(a, 10)} + ${fr(b, 100)}`;
    return numeric(ctx, `regroupe-${t}`, {
      prompt: `${t} = …`,
      spoken: `${lu(t)} égale combien ?`,
      answer: mm / 1000,
      explication: `${fr(a, 10)} = ${Math.floor(a / 10)} + ${fr(a % 10, 10)}, donc ${t} = ${dm(mm)}.`,
      difficulty: 0.85,
    });
  }
  if (forme === 7) {
    const mm = tirerDecimal('normal', rng);
    return numeric(ctx, `milliemes-${mm}`, {
      prompt: `${dm(mm)} = …/1000`,
      spoken: `${lu(dm(mm))} égale combien de millièmes ?`,
      answer: mm,
      explication: `1 unité = 1 000 millièmes, 1 dixième = 100 millièmes, 1 centième = 10 millièmes : ${dm(mm)} = ${fr(mm, 1000)}.`,
      difficulty: 0.8,
    });
  }
  const n2 = rng.int(1001, 9999);
  return numeric(ctx, `grand-num-${n2}`, {
    prompt: `${fr(n2, 1000)} = …`,
    spoken: `${fracDite(n2, 1000)}, écris-le avec une virgule.`,
    answer: n2 / 1000,
    explication: `${fr(n2, 1000)} = ${fmt(Math.floor(n2 / 1000))} + ${fr(n2 % 1000, 1000)} = ${dm(n2)}.`,
    difficulty: 0.7,
  });
};

const fdPaires: ItemGen = (level, rng, ctx) => {
  const pairs: { left: string; right: string }[] = [];
  const vus = new Set<number>();
  const add = (left: string, m: number) => {
    if (vus.has(m) || m <= 0) return;
    vus.add(m);
    pairs.push({ left, right: dm(m) });
  };
  if (level === 'facile') {
    for (const n of rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 15, 17, 23, 25, 34, 47]).slice(0, 4))
      add(fr(n, 10), n * 100);
  } else if (level === 'normal') {
    // même suite de chiffres, places différentes : 35/10, 35/100, 35/1000
    const n = rng.int(11, 99);
    add(fr(n, 10), n * 100);
    add(fr(n, 100), n * 10);
    add(fr(n, 1000), n);
    let guard = 0;
    while (pairs.length < 5 && guard++ < 50) {
      const d = rng.pick([10, 100, 1000]);
      const k = rng.int(1, 999);
      if (k % 10 === 0) continue;
      add(fr(k, d), (k * 1000) / d);
    }
  } else {
    const e = rng.int(1, 9);
    const c = rng.int(1, 9);
    add(`${e} + ${fr(c, 10)}`, e * 1000 + c * 100);
    add(`${e} + ${fr(c, 100)}`, e * 1000 + c * 10);
    add(`${e} + ${fr(c, 1000)}`, e * 1000 + c);
    add(`${fr(e * 10 + c, 100)}`, e * 100 + c * 10);
    add(`${e} + ${fr(c, 10)} + ${fr(c, 1000)}`, e * 1000 + c * 100 + c);
  }
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque fraction décimale à son écriture à virgule.',
    pairs: rng.shuffle(pairs),
    relation: 'fraction décimale → écriture à virgule',
    explication:
      'Le dénominateur dit où s’arrête le dernier chiffre : 10 → dixièmes (1 chiffre après la virgule), 100 → centièmes (2 chiffres), 1 000 → millièmes (3 chiffres).',
    difficulty: parNiv(level, { facile: 0.25, normal: 0.55, plus_loin: 0.8 }),
  });
};

/** Nombre dont les chiffres (non nuls) sont tous différents, pour que « le chiffre 6 » soit sans ambiguïté. */
function chiffresDistincts(level: Level, rng: Rng): number {
  for (let essai = 0; essai < 200; essai++) {
    const m =
      level === 'facile'
        ? rng.int(1, 9) * 1000 + rng.int(1, 9) * 100
        : rng.int(1, level === 'normal' ? 99 : 999) * 1000 + rng.int(100, 999);
    const s = String(m).replace(/0+$/, '').split('');
    if (s.includes('0') || new Set(s).size !== s.length || (level !== 'facile' && m % 10 === 0)) continue;
    return m;
  }
  return 24368;
}

const fdQcm: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 2), normal: rng.int(0, 2), plus_loin: rng.int(0, 3) });
  if (forme === 0) {
    const m = chiffresDistincts(level, rng);
    const maxR = String(m).length - 1;
    const r = level === 'facile' ? rng.int(2, 3) : rng.int(0, Math.min(maxR, level === 'normal' ? 3 : 5));
    const c = chiffre(m, r);
    const good = valeurRang(c, r);
    const wrong = RANGS.map((_, i) => i)
      .filter((i) => i !== r && i <= Math.max(maxR, 3))
      .map((i) => valeurRang(c, i));
    return mcq(ctx, rng, `valeur-${m}-${r}`, {
      question: `Dans ${dm(m)}, que vaut le chiffre ${c} ?`,
      spoken: `Dans ${lu(dm(m))}, que vaut le chiffre ${c} ?`,
      good,
      wrong,
      max: level === 'facile' ? 3 : 4,
      explication: `Avant la virgule : unités, dizaines, centaines… ; après la virgule : dixièmes, centièmes, millièmes. Dans ${dm(m)}, ${c} est le chiffre des ${RANGS[r]} : il vaut ${valeurRang(c, r)}.`,
      difficulty: 0.3 + (r < 2 ? 0.2 : 0),
    });
  }
  if (forme === 1) {
    const rel: readonly [string, string, string] = parNiv<readonly [string, string, string]>(level, {
      facile: rng.pick([
        ['dixièmes', '1 unité', '10'],
        ['centièmes', '1 dixième', '10'],
      ] as const),
      normal: rng.pick([
        ['centièmes', '1 dixième', '10'],
        ['millièmes', '1 centième', '10'],
        ['centièmes', '1 unité', '100'],
        ['millièmes', '1 unité', '1 000'],
        ['millièmes', '1 dixième', '100'],
      ] as const),
      plus_loin: rng.pick([
        ['millièmes', '1 dixième', '100'],
        ['millièmes', '1 unité', '1 000'],
        ['centièmes', '1 dizaine', '1 000'],
      ] as const),
    });
    return mcq(ctx, rng, `rel-${rel[0]}-${rel[1]}`, {
      question: `Combien de ${rel[0]} y a-t-il dans ${rel[1]} ?`,
      good: rel[2],
      wrong: ['1', '10', '100', '1 000', '10 000'],
      explication:
        'Chaque rang vaut 10 fois le rang à sa droite : 1 unité = 10 dixièmes, 1 dixième = 10 centièmes, 1 centième = 10 millièmes.',
      difficulty: 0.4,
    });
  }
  if (forme === 2) {
    const m = tirerDecimal(level, rng);
    const [n, d] = enFraction(m);
    const faux = [
      fmt(n / (d * 10)),
      fmt((n * 10) / d),
      d <= 100 ? `${fmt(n)},${d}` : fmt(n),
      d === 10 ? fmt(n / 100) : fmt(n / 10),
    ].filter((x) => x !== dm(m));
    return mcq(ctx, rng, `ecriture-${n}-${d}`, {
      question: `Quelle écriture à virgule est égale à ${fr(n, d)} ?`,
      spoken: `Quelle écriture à virgule est égale à ${fracDite(n, d)} ?`,
      good: dm(m),
      wrong: faux,
      explication: `${fr(n, d)}, ce sont des ${nomDenominateur(d, true)} : le dernier chiffre ${n % 10} doit être au rang des ${nomDenominateur(d, true)}, donc ${fr(n, d)} = ${dm(m)}.`,
      difficulty: 0.45,
    });
  }
  // Plus loin : chiffre d'un rang donné
  const m = chiffresDistincts('normal', rng);
  const r = rng.int(0, 2);
  const c = chiffre(m, r);
  return mcq(ctx, rng, `chiffre-des-${m}-${r}`, {
    question: `Quel est le chiffre des ${RANGS[r]} dans ${dm(m)} ?`,
    spoken: `Quel est le chiffre des ${RANGS[r]} dans ${lu(dm(m))} ?`,
    good: String(c),
    wrong: [0, 1, 2, 3, 4].filter((i) => i !== r).map((i) => String(chiffre(m, i))),
    explication: `Après la virgule : dixièmes, centièmes, millièmes. Dans ${dm(m)}, le chiffre des ${RANGS[r]} est ${c}.`,
    difficulty: 0.55,
  });
};

const fdDroite: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const n = rng.int(1, 29);
    const nn = n % 10 === 0 ? n + 3 : n;
    const max = Math.max(1, Math.ceil(nn / 10)) * 1000;
    return ligne(ctx, `d-${nn}-10`, {
      min: 0,
      max: Math.max(max, 2000),
      step: 1000,
      target: nn * 100,
      display: fr(nn, 10),
      explication: `L’unité est partagée en 10 : chaque petit trait vaut 1/10. ${fr(nn, 10)}, c’est ${nn} petits traits après 0, donc ${dm(nn * 100)}.`,
      difficulty: 0.25 + nn / 100,
    });
  }
  if (level === 'normal') {
    const base = rng.int(0, 98) * 100;
    const k = rng.int(1, 19);
    const kk = k === 10 ? 13 : k;
    const t = base + kk * 10;
    const [n, d] = enFraction(t);
    return ligne(ctx, `d-${t}`, {
      min: base,
      max: base + 200,
      step: 100,
      target: t,
      display: fr(n, d),
      explication: `Ici, chaque grand trait vaut 1/10 et chaque petit trait 1/100. ${fr(n, d)} = ${dm(t)}.`,
      difficulty: 0.5,
    });
  }
  const base = rng.int(0, 998) * 10;
  const kk = rng.int(1, 19);
  const t = base + (kk === 10 ? 7 : kk);
  return ligne(ctx, `d-somme-${t}`, {
    min: base,
    max: base + 20,
    step: 10,
    target: t,
    display: somme(t),
    explication: `Chaque grand trait vaut 1/100 et chaque petit trait 1/1000 : ${somme(t)} = ${dm(t)}.`,
    difficulty: 0.8,
  });
};

const fdVisuel: ItemGen = (level, rng, ctx) => {
  const shape = rng.pick(['tablette', 'barre'] as const);
  const objet = shape === 'tablette' ? 'tablette' : 'barre';
  const n = parNiv(level, { facile: rng.int(1, 9), normal: rng.int(1, 19), plus_loin: rng.int(11, 29) });
  const nn = n % 10 === 0 ? n + 1 : n;
  const task = level === 'facile' ? 'colorier' : rng.pick(['colorier', 'lire'] as const);
  const plus1 = nn > 10;
  const objets = nn >= 20 ? `${objet}s` : objet;
  const ecrit = dm(nn * 100);
  return make(ctx, 'visual_fraction', `vis-${task}-${shape}-${nn}`, {
    prompt:
      task === 'colorier'
        ? level === 'facile'
          ? `Colorie ${fr(nn, 10)} de la ${objet}.`
          : `Colorie ${ecrit} ${plus1 ? objets : `de la ${objet}`} (une ${objet} entière = 10/10).`
        : `Quelle fraction décimale est coloriée ? (une ${objet} entière = 10/10)`,
    spoken:
      task === 'colorier'
        ? level === 'facile'
          ? `Colorie ${fractionEnMots(nn, 10)} de la ${objet}.`
          : `Colorie ${lu(ecrit)} ${plus1 ? objets : `de la ${objet}`}.`
        : 'Quelle fraction décimale est coloriée ?',
    numerator: nn,
    denominator: 10,
    shape,
    task,
    explication: `Chaque ${objet} est partagée en 10 parts égales : ${nn} parts, c’est ${fr(nn, 10)} = ${ecrit}.`,
    difficulty: clamp01(
      0.2 + (task === 'lire' ? 0.15 : 0) + (plus1 ? 0.25 : 0) + (level === 'facile' ? 0 : 0.1),
    ),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.DEC.COMPARER                                                 */
/* ------------------------------------------------------------------ */

type Ecrit = { m: number; s: string };
const E = (m: number, dec?: number): Ecrit => ({ m, s: dm(m, dec) });

/** Deux nombres à comparer, avec les pièges du BO (3,5 / 3,45 ; 2,3 = 2,30 ; plus de chiffres ≠ plus grand). */
function paire(level: Level, rng: Rng): [Ecrit, Ecrit] {
  if (level === 'facile') {
    const i = rng.int(0, 20);
    const a = rng.int(1, 9);
    let b = rng.int(1, 9);
    if (b === a) b = a === 9 ? 1 : a + 1;
    if (rng.chance(0.3)) return [E(i * 1000 + a * 100), E((i + rng.int(1, 3)) * 1000 + b * 100)];
    return [E(i * 1000 + a * 100), E(i * 1000 + b * 100)];
  }
  const i = rng.int(0, level === 'normal' ? 99 : 999);
  const t = parNiv(level, { facile: 0, normal: rng.int(0, 4), plus_loin: rng.int(1, 6) });
  const d1 = rng.int(1, 8);
  if (t === 0) {
    // 3,5 / 3,45 : le nombre le plus long n'est pas le plus grand
    const x = i * 1000 + (d1 + 1) * 100;
    const y = i * 1000 + d1 * 100 + rng.int(1, 9) * 10;
    return [E(x), E(y)];
  }
  if (t === 1) {
    // 3,405 / 3,45
    const c = rng.int(1, 9);
    const x = i * 1000 + d1 * 100 + c;
    const y = i * 1000 + d1 * 100 + c * 10;
    return [E(x), E(y)];
  }
  if (t === 2) {
    // écritures égales : 2,3 = 2,30
    const x = i * 1000 + d1 * 100 + (rng.chance(0.5) ? rng.int(1, 9) * 10 : 0);
    return [E(x), E(x, decs(x) + 1)];
  }
  if (t === 3) {
    // partie entière plus petite mais plus de chiffres après la virgule
    const x = i * 1000 + rng.int(101, 999);
    const y = (i + rng.int(1, 9)) * 1000 + rng.int(1, 9) * 100;
    return [E(x), E(y)];
  }
  if (t === 4 || t === 5) {
    // au millième près
    const x = i * 1000 + rng.int(100, 989);
    return [E(x), E(x + rng.int(1, 9))];
  }
  // 0,1 / 0,099
  const x = i * 1000 + d1 * 100;
  return [E(x), E(x - 1)];
}

const explComparer = (a: Ecrit, b: Ecrit) => {
  if (a.m === b.m)
    return `${a.s} et ${b.s} sont égaux : un zéro à la fin de la partie décimale ne change pas le nombre.`;
  const [g, p] = a.m > b.m ? [a, b] : [b, a];
  if (ent(a.m) !== ent(b.m))
    return `On compare d’abord les parties entières : ${fmt(ent(g.m))} > ${fmt(ent(p.m))}, donc ${g.s} > ${p.s}.`;
  const k = Math.max(decs(a.m), decs(b.m));
  const aide = decs(a.m) !== decs(b.m) ? ` (on peut écrire ${dm(g.m, k)} et ${dm(p.m, k)})` : '';
  return `Même partie entière : on compare les dixièmes, puis les centièmes, puis les millièmes${aide} : ${g.s} > ${p.s}.`;
};

const cmpQcm: ItemGen = (level, rng, ctx) => {
  let [a, b] = paire(level, rng);
  if (rng.chance(0.5)) [a, b] = [b, a];
  return comparaison(ctx, `cmp-${a.s}-${b.s}`, {
    gauche: a.s,
    droite: b.s,
    signe: signe(a.m, b.m),
    spokenGauche: lu(a.s),
    spokenDroite: lu(b.s),
    explication: explComparer(a, b),
    difficulty:
      parNiv(level, { facile: 0.25, normal: 0.55, plus_loin: 0.75 }) + (a.s.length !== b.s.length ? 0.1 : 0),
  });
};

const cmpVraiFaux: ItemGen = (level, rng, ctx) => {
  let [a, b] = paire(level, rng);
  if (a.m === b.m) b = E(b.m + (level === 'facile' ? 100 : 10));
  if (rng.chance(0.5)) [a, b] = [b, a];
  const sens = rng.pick(['>', '<'] as const);
  const vrai = sens === '>' ? a.m > b.m : a.m < b.m;
  return vraiFaux(ctx, `vf-${a.s}-${sens}-${b.s}`, {
    statement: `${a.s} ${sens} ${b.s}`,
    spoken: `${lu(a.s)} est ${sens === '>' ? 'plus grand' : 'plus petit'} que ${lu(b.s)}.`,
    answer: vrai,
    explication: explComparer(a, b),
    difficulty: parNiv(level, { facile: 0.25, normal: 0.55, plus_loin: 0.75 }),
  });
};

const cmpRanger: ItemGen = (level, rng, ctx) => {
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 6 });
  const vus = new Set<number>();
  const els: Ecrit[] = [];
  const i = rng.int(0, level === 'facile' ? 20 : 99);
  let guard = 0;
  while (els.length < n && guard++ < 300) {
    let m: number;
    if (level === 'facile') m = (i + rng.int(0, 2)) * 1000 + rng.int(1, 9) * 100;
    else if (level === 'normal') {
      // même partie entière, longueurs différentes (3,5 ; 3,45 ; 3,405 ; 3,054)
      const f = rng.pick([rng.int(1, 9) * 100, rng.int(1, 99) * 10, rng.int(1, 999)]);
      m = (i + (rng.chance(0.2) ? 1 : 0)) * 1000 + f;
    } else
      m =
        i * 1000 +
        rng.pick([rng.int(1, 9) * 100, rng.int(1, 99) * 10, rng.int(1, 999)]) +
        (rng.chance(0.15) ? 1000 : 0);
    if (m % 1000 === 0 || vus.has(m)) continue;
    vus.add(m);
    els.push(E(m));
  }
  const croissant = rng.chance(0.5);
  els.sort((x, y) => (croissant ? x.m - y.m : y.m - x.m));
  return make(ctx, 'ordering', `ranger-${croissant}-${els.map((e) => e.s).join('|')}`, {
    prompt: `Range ces nombres du ${croissant ? 'plus petit au plus grand' : 'plus grand au plus petit'}.`,
    elements: els.map((e) => e.s),
    mode: croissant ? 'croissant' : 'decroissant',
    explication:
      'On compare d’abord les parties entières, puis les dixièmes, les centièmes et les millièmes ; un nombre avec plus de chiffres après la virgule n’est pas forcément plus grand.',
    difficulty: parNiv(level, { facile: 0.3, normal: 0.6, plus_loin: 0.8 }),
  });
};

const cmpDroite: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const k = rng.int(0, 18);
    const d = rng.int(1, 19);
    const t = k * 1000 + (d === 10 ? 7 : d) * 100;
    return ligne(ctx, `cd-${t}`, {
      min: k * 1000,
      max: k * 1000 + 2000,
      step: 1000,
      target: t,
      display: dm(t),
      explication: `Entre deux nombres entiers, il y a 10 petits traits : chacun vaut 0,1. ${dm(t)} est à ${(t - k * 1000) / 100} petits traits de ${k}.`,
      difficulty: 0.3,
    });
  }
  const unite = level === 'normal' ? 100 : 10;
  const base = rng.int(0, level === 'normal' ? 998 : 9998) * unite;
  const d = rng.int(1, 19);
  const t = base + (d === 10 ? 3 : d) * (unite / 10);
  return ligne(ctx, `cd-${t}`, {
    min: base,
    max: base + 2 * unite,
    step: unite,
    target: t,
    display: dm(t),
    explication:
      level === 'normal'
        ? `Les grands traits vont de 0,1 en 0,1 et chaque petit trait vaut 0,01 : ${dm(t)} est ${(t - base) / 10} petits traits après ${dm(base)}.`
        : `Les grands traits vont de 0,01 en 0,01 et chaque petit trait vaut 0,001 : ${dm(t)} est ${t - base} petits traits après ${dm(base)}.`,
    difficulty: level === 'normal' ? 0.55 : 0.8,
  });
};

/** Partie décimale qui ne tombe jamais pile sur la moitié (pour un arrondi sans ambiguïté). */
function pasMoitie(m: number, unite: number): number {
  return m % unite === unite / 2 ? m + (unite >= 100 ? unite / 10 : 1) : m;
}

const cmpNumeric: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 2), normal: rng.int(0, 4), plus_loin: rng.int(3, 6) });
  const i = rng.int(0, level === 'facile' ? 30 : 999);
  const m0 =
    level === 'facile'
      ? i * 1000 + rng.int(1, 9) * 100
      : i * 1000 + rng.pick([rng.int(1, 9) * 100, rng.int(1, 99) * 10, rng.int(1, 999)]);
  const m = m0 % 1000 === 0 ? m0 + 300 : m0;
  if (forme === 0) {
    return numeric(ctx, `pe-${m}`, {
      prompt: `Quelle est la partie entière de ${dm(m)} ?`,
      spoken: `Quelle est la partie entière de ${lu(dm(m))} ?`,
      answer: ent(m),
      explication: `La partie entière, c’est ce qui est avant la virgule : dans ${dm(m)}, c’est ${fmt(ent(m))}.`,
      difficulty: 0.15,
    });
  }
  if (forme === 1) {
    const mm = pasMoitie(m, 1000);
    const r = Math.round(mm / 1000);
    return numeric(ctx, `arr-u-${mm}`, {
      prompt: `Arrondis ${dm(mm)} à l’unité.`,
      spoken: `Arrondis ${lu(dm(mm))} à l’unité.`,
      answer: r,
      explication: `${dm(mm)} est entre ${fmt(ent(mm))} et ${fmt(ent(mm) + 1)} ; il est plus près de ${fmt(r)} (on regarde le chiffre des dixièmes : ${chiffre(mm, 2)}${chiffre(mm, 2) >= 5 ? ' ≥ 5' : ' < 5'}).`,
      difficulty: 0.35 + (decs(mm) > 1 ? 0.1 : 0),
    });
  }
  if (forme === 2) {
    const haut = rng.chance(0.5);
    return numeric(ctx, `enc-${m}-${haut}`, {
      prompt: haut ? `${fmt(ent(m))} < ${dm(m)} < …` : `… < ${dm(m)} < ${fmt(ent(m) + 1)}`,
      spoken: `Encadre ${lu(dm(m))} entre deux nombres entiers qui se suivent.`,
      answer: haut ? ent(m) + 1 : ent(m),
      explication: `${dm(m)} est entre les deux entiers qui se suivent ${fmt(ent(m))} et ${fmt(ent(m) + 1)}.`,
      difficulty: 0.3,
    });
  }
  if (forme === 3) {
    // intercaler : le nombre au milieu de deux dixièmes (ou centièmes) consécutifs
    const u = level === 'plus_loin' ? 10 : 100;
    const a = Math.floor(m / u) * u;
    return numeric(ctx, `milieu-${a}-${u}`, {
      prompt: `Quel nombre est exactement au milieu de ${dm(a)} et ${dm(a + u)} ?`,
      spoken: `Quel nombre est exactement au milieu de ${lu(dm(a))} et ${lu(dm(a + u))} ?`,
      answer: (a + u / 2) / 1000,
      explication: `${dm(a)} = ${dm(a, u === 100 ? 2 : 3)} et ${dm(a + u)} = ${dm(a + u, u === 100 ? 2 : 3)} : au milieu, il y a ${dm(a + u / 2)}.`,
      difficulty: 0.6,
    });
  }
  if (forme === 4) {
    // encadrer au dixième
    const mm = i * 1000 + rng.int(1, 99) * 10 + (rng.chance(0.5) ? rng.int(1, 9) : 0);
    const x = mm % 100 === 0 ? mm + 30 : mm;
    const bas = Math.floor(x / 100) * 100;
    const haut = rng.chance(0.5);
    return numeric(ctx, `enc10-${x}-${haut}`, {
      prompt: haut
        ? `Encadre au dixième : ${dm(bas)} < ${dm(x)} < …`
        : `Encadre au dixième : … < ${dm(x)} < ${dm(bas + 100)}`,
      spoken: `Encadre ${lu(dm(x))} entre deux nombres qui ont un seul chiffre après la virgule et qui se suivent.`,
      answer: (haut ? bas + 100 : bas) / 1000,
      explication: `${dm(x)} est entre ${dm(bas)} et ${dm(bas + 100)} : on regarde les dixièmes.`,
      difficulty: 0.55,
    });
  }
  // Pour aller plus loin : arrondi au dixième ou au centième (résultat jamais entier, jamais de zéro final)
  const u = forme === 5 ? 100 : 10;
  for (let essai = 0; essai < 50; essai++) {
    const x = pasMoitie(i * 1000 + rng.int(1, 999), u);
    const r = Math.round(x / u) * u;
    if (decs(x) <= (u === 100 ? 1 : 2) || decs(r) !== (u === 100 ? 1 : 2)) continue;
    return numeric(ctx, `arr-${u}-${x}`, {
      prompt: `Arrondis ${dm(x)} au ${u === 100 ? 'dixième' : 'centième'}.`,
      spoken: `Arrondis ${lu(dm(x))} au ${u === 100 ? 'dixième' : 'centième'}.`,
      answer: r / 1000,
      explication: `${dm(x)} est entre ${dm(Math.floor(x / u) * u)} et ${dm(Math.floor(x / u) * u + u)} ; il est plus près de ${dm(r)}.`,
      difficulty: 0.75,
    });
  }
  return numeric(ctx, 'arr-secours', {
    prompt: 'Arrondis 3,46 au dixième.',
    spoken: 'Arrondis 3 virgule 46 au dixième.',
    answer: 3.5,
    explication: '3,46 est entre 3,4 et 3,5 ; il est plus près de 3,5.',
    difficulty: 0.75,
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.DEC.USUELLES — écriture décimale des fractions usuelles      */
/* ------------------------------------------------------------------ */

/** [numérateur, dénominateur] par niveau. */
const USUELLES: Record<Level, [number, number][]> = {
  facile: [
    [1, 2],
    [1, 10],
    [3, 10],
    [7, 10],
    [1, 100],
    [5, 10],
  ],
  normal: [
    [1, 2],
    [1, 4],
    [3, 4],
    [1, 5],
    [1, 10],
    [1, 100],
    [1, 1000],
    [3, 2],
    [5, 2],
    [2, 5],
  ],
  plus_loin: [
    [1, 8],
    [3, 8],
    [5, 8],
    [7, 8],
    [3, 5],
    [4, 5],
    [1, 20],
    [1, 25],
    [1, 50],
    [5, 4],
    [7, 4],
    [3, 20],
  ],
};

/** Valeur en millièmes (toutes les fractions usuelles tombent juste au millième). */
const valeurM = ([n, d]: [number, number]) => (n * 1000) / d;
/** Fraction décimale égale : 1/4 → 25/100. */
function equivalente([n, d]: [number, number]): [number, number] {
  for (const p of [10, 100, 1000]) if (p % d === 0) return [(n * p) / d, p];
  return [n, d];
}
const explUsuelle = (f: [number, number]) => {
  const [n, d] = f;
  const [en, ed] = equivalente(f);
  const v = dm(valeurM(f));
  if (d === 10 || d === 100 || d === 1000)
    return `${fr(n, d)}, c’est ${fractionEnMots(n, d)} : ${fr(n, d)} = ${v}.`;
  return `${fr(n, d)} = ${fr(en, ed)} (on multiplie en haut et en bas par ${ed / d}), donc ${fr(n, d)} = ${v}.`;
};

const usuelleNumeric: ItemGen = (level, rng, ctx) => {
  const f = rng.pick(USUELLES[level]);
  const [n, d] = f;
  if (level !== 'facile' && rng.chance(0.35)) {
    return numeric(ctx, `inv-${n}-${d}`, {
      prompt: `${dm(valeurM(f))} = …/${d}`,
      spoken: `${lu(dm(valeurM(f)))} égale combien de ${nomDenominateur(d, true)} ?`,
      answer: n,
      explication: explUsuelle(f),
      difficulty: 0.55,
    });
  }
  return numeric(ctx, `u-${n}-${d}`, {
    prompt: `${fr(n, d)} = …`,
    spoken: `${fractionEnMots(n, d)}, combien ça fait en écriture à virgule ?`,
    answer: valeurM(f) / 1000,
    explication: explUsuelle(f),
    difficulty: parNiv(level, { facile: 0.2, normal: 0.45, plus_loin: 0.7 }),
  });
};

const usuellePaires: ItemGen = (level, rng, ctx) => {
  const vus = new Set<number>();
  const pairs: { left: string; right: string }[] = [];
  const pool = level === 'facile' ? USUELLES.facile : [...USUELLES[level], ...USUELLES.normal];
  for (const f of rng.shuffle(pool)) {
    const v = valeurM(f);
    if (vus.has(v)) continue;
    vus.add(v);
    pairs.push({ left: fr(...f), right: dm(v) });
    if (pairs.length >= (level === 'facile' ? 4 : 5)) break;
  }
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque fraction à son écriture à virgule.',
    pairs,
    relation: 'fraction → écriture à virgule',
    explication:
      'Je connais par cœur : 1/2 = 0,5 ; 1/4 = 0,25 ; 3/4 = 0,75 ; 1/5 = 0,2 ; 1/10 = 0,1 ; 1/100 = 0,01.',
    difficulty: parNiv(level, { facile: 0.25, normal: 0.5, plus_loin: 0.75 }),
  });
};

/** Écritures fausses classiques : 1/4 → 0,4 ou 1,4 ; 1/5 → 0,5. */
function faussesEcritures([n, d]: [number, number]): string[] {
  const v = valeurM([n, d]);
  const out = [`${n},${d}`, `0,${d}`, dm(v * 10), dm(v / 10), dm(v * 100), `0,${n}${d}`];
  const valeur = (x: string) => Number(x.replace(/ /g, '').replace(',', '.'));
  return [...new Set(out)].filter(
    (x) => Math.abs(valeur(x) * 1000 - v) > 1e-6 && x !== '0' && !/,\d*0$/.test(x) && !/,\d{4,}/.test(x),
  );
}

const usuelleVraiFaux: ItemGen = (level, rng, ctx) => {
  const f = rng.pick(USUELLES[level]);
  const juste = rng.chance(0.5);
  const v = valeurM(f);
  const montre = juste ? dm(v) : rng.pick(faussesEcritures(f));
  return vraiFaux(ctx, `vf-${f.join('-')}-${montre}`, {
    statement: `${fr(...f)} = ${montre}`,
    spoken: `${fractionEnMots(...f)} égale ${lu(montre)}.`,
    answer: juste,
    explication: explUsuelle(f),
    difficulty: parNiv(level, { facile: 0.25, normal: 0.5, plus_loin: 0.7 }),
  });
};

const usuelleQcm: ItemGen = (level, rng, ctx) => {
  const f = rng.pick(USUELLES[level]);
  const v = valeurM(f);
  if (rng.chance(0.5)) {
    return mcq(ctx, rng, `q-${f.join('-')}`, {
      question: `Quelle écriture à virgule est égale à ${fr(...f)} ?`,
      spoken: `Quelle écriture à virgule est égale à ${fractionEnMots(...f)} ?`,
      good: dm(v),
      wrong: faussesEcritures(f),
      max: level === 'facile' ? 3 : 4,
      explication: explUsuelle(f),
      difficulty: parNiv(level, { facile: 0.2, normal: 0.45, plus_loin: 0.7 }),
    });
  }
  // fraction égale à un décimal donné
  const autres = [...USUELLES.normal, ...USUELLES.plus_loin, ...USUELLES.facile].filter(
    (g) => valeurM(g) !== v,
  );
  return mcq(ctx, rng, `r-${f.join('-')}`, {
    question: `Quelle fraction est égale à ${dm(v)} ?`,
    spoken: `Quelle fraction est égale à ${lu(dm(v))} ?`,
    good: fr(...f),
    wrong: rng.shuffle(autres).map((x) => fr(...x)),
    max: level === 'facile' ? 3 : 4,
    explication: explUsuelle(f),
    difficulty: parNiv(level, { facile: 0.25, normal: 0.5, plus_loin: 0.75 }),
  });
};

export const DECIMAUX: Record<string, LessonContent> = {
  'CM2.MA.DEC.FRAC_DEC': {
    gens: {
      numeric_answer: fdNumeric,
      pairing: fdPaires,
      mcq: fdQcm,
      number_line: fdDroite,
      visual_fraction: fdVisuel,
    },
  },
  'CM2.MA.DEC.COMPARER': {
    gens: {
      mcq: cmpQcm,
      ordering: cmpRanger,
      number_line: cmpDroite,
      numeric_answer: cmpNumeric,
      true_false: cmpVraiFaux,
    },
  },
  'CM2.MA.DEC.USUELLES': {
    gens: {
      numeric_answer: usuelleNumeric,
      pairing: usuellePaires,
      true_false: usuelleVraiFaux,
      mcq: usuelleQcm,
    },
  },
};
