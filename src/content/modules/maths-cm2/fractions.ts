/**
 * CM2 — Fractions (BO n°16 du 17/04/2025, cycle 3, « Les fractions ») : les quatre sens de la fraction
 * (partage, mesure, nombre sur la demi-droite graduée, opérateur « deux tiers de 12 € »).
 * Dénominateurs ≤ 60 (les fractions décimales /100, /1 000 relèvent de la leçon sur les décimaux).
 * Objectifs : lire, écrire, représenter ; fraction > 1 = entier + fraction < 1 (et réciproquement) ;
 * encadrer entre deux entiers consécutifs ; placer et repérer sur une demi-droite graduée ; comparer ;
 * additionner et soustraire ; entier × fraction ; fraction d'une quantité ou d'une grandeur.
 *
 * Convention `meta.droite` (items qui décrivent une demi-droite graduée sans être des `number_line`) :
 * `{ min, max, subdivisions, point, lettre }` — l'unité est partagée en `subdivisions` parts égales et le
 * point `lettre` est placé à la valeur `point`. L'énoncé décrit toujours la droite en clair.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemGen, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import {
  cap,
  comparaison,
  denominateurOk,
  deuxPersos,
  dire,
  fmt,
  frac,
  fractionEnMots,
  make,
  mcq,
  nomDenominateur,
  numeric,
  parNiv,
  pgcd,
  ppcm,
  signe,
  vraiFaux,
} from './util';

type F = [number, number];
type Shape = ItemOf<'visual_fraction'>['shape'];

const DE_LA: Record<Shape, string> = {
  pizza: 'de la pizza',
  barre: 'de la bande',
  tablette: 'de la tablette',
};
const ENTIERE: Record<Shape, string> = {
  pizza: 'une pizza entière',
  barre: 'une bande entière',
  tablette: 'une tablette entière',
};

/** Forme dessinable pour un dénominateur (la pizza devient illisible au-delà de 12 parts). */
const forme = (rng: Rng, d: number): Shape =>
  d <= 12 ? rng.pick(['pizza', 'barre', 'tablette'] as const) : rng.pick(['barre', 'tablette'] as const);

const val = ([n, d]: F) => n / d;
const ecrire = ([n, d]: F) => (d === 1 ? String(n) : frac(n, d));
/** Signe de comparaison exact (produits en croix calculés en interne seulement). */
const compare = ([a, b]: F, [c, d]: F) => signe(a * d, c * b);

/** Lecture à voix haute : fractions en mots, « …/8 » → « combien de huitièmes ». */
export const lire = (t: string) =>
  dire(
    t
      .replace(/…\/(\d+)/g, (_, d: string) => `combien de ${nomDenominateur(Number(d), true)}`)
      .replace(/(\d+)\/(\d+)/g, (_, a: string, b: string) => fractionEnMots(Number(a), Number(b))),
  );

const parts = (k: number, d: number) => `${k} ${nomDenominateur(d, k >= 2)}`;
const s = (k: number) => (k >= 2 ? 's' : '');
/** « d’un quart », « de 3 quarts ». */
const deParts = (k: number, d: number) => (k === 1 ? `d’un ${nomDenominateur(d)}` : `de ${parts(k, d)}`);

/** Entier + fraction : « 3 + 2/5 ». */
const mixte = ([n, d]: F) => `${Math.floor(n / d)} + ${frac(n % d, d)}`;

/** Explication d'une décomposition n/d = q + r/d. */
const explMixte = ([n, d]: F) => {
  const q = Math.floor(n / d);
  const r = n % d;
  return `${q} unité${s(q)}, c’est ${frac(q * d, d)} (${q} × ${d} = ${q * d}) ; donc ${frac(n, d)} = ${frac(q * d, d)} + ${frac(r, d)} = ${q} + ${frac(r, d)}.`;
};

/* ------------------------------------------------------------------ */
/* Briques d'items                                                     */
/* ------------------------------------------------------------------ */

function visuel(
  ctx: GenContext,
  rng: Rng,
  n: number,
  d: number,
  task: 'colorier' | 'lire',
  difficulty: number,
): ItemOf<'visual_fraction'> {
  const shape = forme(rng, d);
  const plus = n > d;
  return make(ctx, 'visual_fraction', `${task}-${shape}-${n}-${d}`, {
    prompt: plus
      ? task === 'colorier'
        ? `Colorie ${frac(n, d)} (${ENTIERE[shape]}, c’est ${frac(d, d)}).`
        : `Quelle fraction est coloriée ? (${ENTIERE[shape]}, c’est ${frac(d, d)})`
      : task === 'colorier'
        ? `Colorie ${frac(n, d)} ${DE_LA[shape]}.`
        : `Quelle fraction ${DE_LA[shape]} est coloriée ?`,
    spoken:
      task === 'colorier'
        ? `Colorie ${fractionEnMots(n, d)}${plus ? '' : ` ${DE_LA[shape]}`}.`
        : `Quelle fraction ${plus ? '' : `${DE_LA[shape]} `}est coloriée ?`,
    numerator: n,
    denominator: d,
    shape,
    task,
    explication: plus
      ? `${frac(n, d)} = ${mixte([n, d])} : ${Math.floor(n / d)} unité${s(Math.floor(n / d))} entière${s(Math.floor(n / d))} et encore ${parts(n % d, d)}.`
      : `On partage l’unité en ${d} parts égales et on en prend ${n} : ${fractionEnMots(n, d)}.`,
    difficulty,
  });
}

function ligne(
  ctx: GenContext,
  [n, d]: F,
  difficulty: number,
  display = frac(n, d),
  minMax = 1,
): ItemOf<'number_line'> {
  const q = Math.floor(n / d);
  const max = Math.max(Math.ceil(n / d), minMax);
  return make(ctx, 'number_line', `ligne-${display}-${max}`, {
    prompt: `Place ${display} sur la demi-droite graduée.`,
    spoken: `Place ${lire(display)} sur la demi-droite graduée.`,
    min: 0,
    max,
    step: 1,
    subdivisions: d,
    target: n / d,
    display,
    tolerance: Math.round((0.4 / d) * 1000) / 1000,
    explication:
      n < d
        ? `L’unité est partagée en ${d} parts égales : on avance ${deParts(n, d)} à partir de 0.`
        : `${frac(n, d)} = ${q} + ${frac(n % d, d)} : on va jusqu’à ${q}, puis on avance encore ${deParts(n % d, d)}.`,
    difficulty,
  });
}

/* ------------------------------------------------------------------ */
/* CM2.MA.FRAC.SENS — lire, écrire, représenter, fractions > 1          */
/* ------------------------------------------------------------------ */

const DEN_F = [2, 3, 4, 5, 6, 8, 10];
const DEN_N = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20, 24, 25, 30, 40, 50, 60];
const denSens = (level: Level) => parNiv(level, { facile: DEN_F, normal: DEN_N, plus_loin: DEN_N });
const denVisuel = (level: Level) =>
  parNiv(level, {
    facile: DEN_F,
    normal: [3, 4, 5, 6, 8, 10, 12, 15, 16, 20],
    plus_loin: [3, 4, 5, 6, 8, 10, 12],
  });

/** Fraction > 1 non entière : q unités et r parts (1 ≤ q ≤ qMax). */
function fracSup1(rng: Rng, d: number, qMax: number): F {
  const q = rng.int(1, qMax);
  const r = rng.int(1, d - 1);
  return [q * d + r, d];
}

const sensVisuel: ItemGen = (level, rng, ctx) => {
  const d = rng.pick(denVisuel(level));
  const sup1 = parNiv(level, { facile: false, normal: rng.chance(0.5), plus_loin: true });
  const [n] = sup1 ? fracSup1(rng, d, level === 'plus_loin' ? 3 : 1) : [rng.int(1, d - 1)];
  return visuel(ctx, rng, n!, d, rng.chance(0.5) ? 'colorier' : 'lire', 0.15 + (sup1 ? 0.35 : 0) + d / 60);
};

const sensNumeric: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const d = rng.pick(DEN_F);
    const f = rng.int(0, 2);
    if (f === 0)
      return numeric(ctx, `unite-${d}`, {
        prompt: `1 = …/${d}`,
        spoken: lire(`1 égale …/${d}`),
        answer: d,
        explication: `Une unité partagée en ${d} parts égales, c’est ${d} ${nomDenominateur(d, true)} : 1 = ${frac(d, d)}.`,
        difficulty: 0.15,
      });
    if (f === 1) {
      const k = rng.int(2, 3);
      return numeric(ctx, `unites-${k}-${d}`, {
        prompt: `${k} = …/${d}`,
        spoken: lire(`${k} égale …/${d}`),
        answer: k * d,
        explication: `Dans 1 unité, il y a ${frac(d, d)}, donc dans ${k} unités il y a ${k} × ${d} = ${k * d} ${nomDenominateur(d, true)}.`,
        difficulty: 0.3,
      });
    }
    const fr = fracSup1(rng, d, 1);
    return numeric(ctx, `dec1-${fr[0]}-${d}`, {
      prompt: `${frac(...fr)} = 1 + …/${d}`,
      spoken: lire(`${frac(...fr)} égale 1 plus …/${d}`),
      answer: fr[0] - d,
      explication: `1 = ${frac(d, d)}, et il reste ${fr[0]} − ${d} = ${fr[0] - d} parts : ${frac(...fr)} = 1 + ${frac(fr[0] - d, d)}.`,
      difficulty: 0.4,
    });
  }
  if (level === 'normal') {
    const d = rng.pick(DEN_N);
    const fr = fracSup1(rng, d, d > 12 ? 3 : 5);
    const [n] = fr;
    const q = Math.floor(n / d);
    const r = n % d;
    const f = rng.int(0, 3);
    const dif = 0.4 + (d > 12 ? 0.15 : 0);
    if (f === 0)
      return numeric(ctx, `ent-${n}-${d}`, {
        prompt: `${frac(n, d)} = … + ${frac(r, d)}`,
        spoken: lire(`${frac(n, d)} égale combien plus ${frac(r, d)}`),
        answer: q,
        explication: explMixte(fr),
        difficulty: dif,
      });
    if (f === 1)
      return numeric(ctx, `reste-${n}-${d}`, {
        prompt: `${frac(n, d)} = ${q} + …/${d}`,
        spoken: lire(`${frac(n, d)} égale ${q} plus …/${d}`),
        answer: r,
        explication: explMixte(fr),
        difficulty: dif,
      });
    if (f === 2)
      return numeric(ctx, `unique-${n}-${d}`, {
        prompt: `${q} + ${frac(r, d)} = …/${d}`,
        spoken: lire(`${q} plus ${frac(r, d)} égale …/${d}`),
        answer: n,
        explication: `${q} = ${frac(q * d, d)} (${q} × ${d} = ${q * d}) ; ${q * d} + ${r} = ${n}, donc ${q} + ${frac(r, d)} = ${frac(n, d)}.`,
        difficulty: dif + 0.05,
      });
    const bas = rng.chance(0.5);
    return numeric(ctx, `encadre-${bas ? 'bas' : 'haut'}-${n}-${d}`, {
      prompt: bas
        ? `${frac(n, d)} est compris entre … et ${q + 1}`
        : `${frac(n, d)} est compris entre ${q} et …`,
      spoken: lire(
        bas
          ? `${frac(n, d)} est compris entre combien et ${q + 1} ?`
          : `${frac(n, d)} est compris entre ${q} et combien ?`,
      ),
      answer: bas ? q : q + 1,
      explication: `${q} = ${frac(q * d, d)} et ${q + 1} = ${frac((q + 1) * d, d)} : ${frac(n, d)} est entre les deux, donc entre ${q} et ${q + 1}.`,
      difficulty: dif,
    });
  }
  // Pour aller plus loin : fractions égales (conversions), grands entiers
  const d = rng.pick([2, 3, 4, 5, 6, 10, 12]);
  const k = rng.pick([2, 3, 4, 5].filter((x) => d * x <= 60));
  const fr = fracSup1(rng, d, 9);
  const [n] = fr;
  const q = Math.floor(n / d);
  const r = n % d;
  const f = rng.int(0, 2);
  if (f === 0)
    return numeric(ctx, `egale-${n}-${d}-${k}`, {
      prompt: `${frac(n, d)} = …/${d * k}`,
      spoken: lire(`${frac(n, d)} égale …/${d * k}`),
      answer: n * k,
      explication: `On partage chaque part en ${k} : il y a ${k} fois plus de parts, ${n} × ${k} = ${n * k}, donc ${frac(n, d)} = ${frac(n * k, d * k)}.`,
      difficulty: 0.7,
    });
  if (f === 1)
    return numeric(ctx, `mixte-egale-${q}-${r}-${d}-${k}`, {
      prompt: `${q} + ${frac(r, d)} = …/${d * k}`,
      spoken: lire(`${q} plus ${frac(r, d)} égale …/${d * k}`),
      answer: n * k,
      explication: `${q} + ${frac(r, d)} = ${frac(n, d)}, puis on partage chaque part en ${k} : ${frac(n, d)} = ${frac(n * k, d * k)}.`,
      difficulty: 0.85,
    });
  return numeric(ctx, `ent-${n}-${d}`, {
    prompt: `${frac(n, d)} = … + ${frac(r, d)}`,
    spoken: lire(`${frac(n, d)} égale combien plus ${frac(r, d)}`),
    answer: q,
    explication: explMixte(fr),
    difficulty: 0.6,
  });
};

const sensQcm: ItemGen = (level, rng, ctx) => {
  const ds = denSens(level);
  const d = rng.pick(ds);
  const formeQ = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 3), plus_loin: rng.int(2, 4) });
  if (formeQ <= 1) {
    const n = rng.int(level === 'facile' ? 1 : 2, level === 'facile' ? d - 1 : d + 5);
    const mots = fractionEnMots(n, d);
    const voisins: F[] = [
      [d, n],
      [n + 1, d],
      [n, d + 1],
      [n, d - 1],
    ].filter(([a, b]) => a >= 1 && b >= 2 && denominateurOk(b) && !(a === n && b === d)) as F[];
    if (formeQ === 0)
      return mcq(ctx, rng, `lire-${n}-${d}`, {
        question: `Comment lit-on ${frac(n, d)} ?`,
        spoken: 'Comment lit-on cette fraction ?',
        good: mots,
        wrong: voisins.map(([a, b]) => fractionEnMots(a, b)),
        explication: `Le dénominateur ${d} dit qu’on partage en ${d} (des ${nomDenominateur(d, true)}), le numérateur ${n} dit combien on en prend : « ${mots} ».`,
        difficulty: 0.2 + d / 100,
        max: level === 'facile' ? 3 : 4,
      });
    return mcq(ctx, rng, `ecrire-${n}-${d}`, {
      question: `Quelle fraction s’écrit « ${mots} » ?`,
      good: frac(n, d),
      wrong: voisins.map(ecrire),
      explication: `« ${nomDenominateur(d, true)} » donne le dénominateur ${d}, et on en prend ${n} : ${frac(n, d)}.`,
      difficulty: 0.25 + d / 100,
      max: level === 'facile' ? 3 : 4,
    });
  }
  const fr = fracSup1(rng, d, level === 'plus_loin' ? 9 : d > 12 ? 3 : 5);
  const [n] = fr;
  const q = Math.floor(n / d);
  const r = n % d;
  if (formeQ === 2)
    return mcq(ctx, rng, `entre-${n}-${d}`, {
      question: `Entre quels nombres entiers se trouve ${frac(n, d)} ?`,
      spoken: `Entre quels nombres entiers se trouve ${fractionEnMots(n, d)} ?`,
      good: `${q} et ${q + 1}`,
      wrong: [`${q - 1} et ${q}`, `${q + 1} et ${q + 2}`, `${r} et ${r + 1}`, `${d} et ${d + 1}`].filter(
        (x) => !x.startsWith('-'),
      ),
      explication: `${q} = ${frac(q * d, d)} et ${q + 1} = ${frac((q + 1) * d, d)} ; ${frac(n, d)} est entre les deux.`,
      difficulty: 0.45,
    });
  if (formeQ === 3)
    return mcq(ctx, rng, `unique-${q}-${r}-${d}`, {
      question: `Quelle fraction est égale à ${q} + ${frac(r, d)} ?`,
      spoken: `Quelle fraction est égale à ${q} plus ${fractionEnMots(r, d)} ?`,
      good: frac(n, d),
      wrong: [
        frac(q + r, d),
        frac(q * r, d),
        frac(r * d + q, d),
        ...(denominateurOk(q * d) ? [frac(n, q * d)] : []),
      ].filter((x) => x !== frac(n, d) && !x.startsWith('0/')),
      explication: `${q} = ${frac(q * d, d)}, puis ${q * d} + ${r} = ${n} : ${q} + ${frac(r, d)} = ${frac(n, d)}.`,
      difficulty: 0.5,
    });
  // Fractions égales
  const dd = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
  const k = rng.pick([2, 3, 4, 5].filter((x) => dd * x <= 60));
  const nn = rng.int(1, 2 * dd - 1);
  if (nn === dd) return sensQcm(level, rng, ctx);
  return mcq(ctx, rng, `egale-${nn}-${dd}-${k}`, {
    question: `Quelle fraction est égale à ${frac(nn, dd)} ?`,
    spoken: `Quelle fraction est égale à ${fractionEnMots(nn, dd)} ?`,
    good: frac(nn * k, dd * k),
    wrong: [frac(nn + k, dd + k), frac(nn * k, dd), frac(nn, dd * k), frac(nn + 1, dd * k)].filter((x) => {
      const [a, b] = x.split('/').map(Number);
      return a! * dd !== b! * nn && denominateurOk(b!);
    }),
    explication: `Si on partage chaque part en ${k}, il y a ${k} fois plus de parts : on multiplie le numérateur ET le dénominateur par ${k}, ${frac(nn, dd)} = ${frac(nn * k, dd * k)}.`,
    difficulty: 0.75,
  });
};

const sensPaires: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : 4;
  const vus = new Set<string>();
  const out: F[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 100) {
    const d = rng.pick(level === 'facile' ? DEN_F : [2, 3, 4, 5, 6, 8, 10, 12]);
    const fr: F =
      level === 'plus_loin' ? fracSup1(rng, d, 4) : [rng.int(1, level === 'facile' ? d - 1 : d + 3), d];
    if (fr[0] % fr[1] === 0 || vus.has(frac(...fr))) continue;
    // Les paires doivent être sans ambiguïté : pas deux décompositions identiques
    const right = level === 'plus_loin' ? mixte(fr) : fractionEnMots(...fr);
    if (vus.has(right)) continue;
    vus.add(frac(...fr));
    vus.add(right);
    out.push(fr);
  }
  const plus = level === 'plus_loin';
  const pairs = out.map((fr) => ({ left: frac(...fr), right: plus ? mixte(fr) : fractionEnMots(...fr) }));
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: plus
      ? 'Associe chaque fraction à son écriture « entier + fraction ».'
      : 'Associe chaque fraction à son nom.',
    pairs: rng.shuffle(pairs),
    relation: plus ? 'fraction → entier + fraction' : 'fraction → écriture en mots',
    explication: plus
      ? 'Cherche combien d’unités entières tient la fraction : 7/3 = 6/3 + 1/3 = 2 + 1/3.'
      : 'Le nombre du bas dit en combien de parts égales on partage, celui du haut combien on en prend.',
    difficulty: plus ? 0.65 : level === 'facile' ? 0.2 : 0.4,
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.FRAC.DROITE — placer, repérer                                */
/* ------------------------------------------------------------------ */

const denDroite = (level: Level) =>
  parNiv(level, { facile: [2, 4], normal: [2, 3, 4, 5, 6, 8, 10, 12], plus_loin: [3, 4, 5, 6, 8, 10, 12] });

/** Fraction non entière à placer. */
function fracDroite(level: Level, rng: Rng): F {
  const d = rng.pick(denDroite(level));
  if (level === 'plus_loin') return fracSup1(rng, d, 4);
  for (;;) {
    const n = rng.int(1, 2 * d - 1);
    if (n !== d) return [n, d];
  }
}

const droiteLigne: ItemGen = (level, rng, ctx) => {
  const fr = fracDroite(level, rng);
  const mix = level === 'plus_loin' && rng.chance(0.5);
  return ligne(
    ctx,
    fr,
    0.2 + (fr[0] > fr[1] ? 0.2 : 0) + fr[1] / 30 + (mix ? 0.1 : 0),
    mix ? mixte(fr) : frac(...fr),
    level === 'facile' ? 1 : 2,
  );
};

const LETTRES = ['A', 'B', 'C', 'D', 'E', 'M', 'P'];

/** Description d'un point : `k` graduations après le repère `q` (ou avant `q + 1` en plus loin). */
function pointDecrit(level: Level, rng: Rng) {
  const d = rng.pick(denDroite(level));
  const q = parNiv(level, { facile: 0, normal: rng.int(0, 2), plus_loin: rng.int(1, 4) });
  const k = rng.int(1, d - 1);
  const avant = level === 'plus_loin' && rng.chance(0.5);
  const n = avant ? (q + 1) * d - k : q * d + k;
  const lettre = rng.pick(LETTRES);
  const kk = avant ? (q + 1) * d - n : k;
  const ou = avant
    ? `${kk} graduation${s(kk)} avant le repère ${q + 1}`
    : `${kk} graduation${s(kk)} après le repère ${q}`;
  const texte = `Sur une demi-droite graduée, chaque unité est partagée en ${d} parts égales. Le point ${lettre} est ${ou}.`;
  const expl = avant
    ? `Chaque graduation vaut ${frac(1, d)} ; ${q + 1} = ${frac((q + 1) * d, d)} et on recule de ${kk} : ${(q + 1) * d} − ${kk} = ${n}, donc ${frac(n, d)}.`
    : q === 0
      ? `Chaque graduation vaut ${frac(1, d)} : on compte ${kk} graduation${s(kk)} à partir de 0, donc ${frac(n, d)}.`
      : `Chaque graduation vaut ${frac(1, d)} ; ${q} = ${frac(q * d, d)} et on avance de ${kk} : ${q * d} + ${kk} = ${n}, donc ${frac(n, d)}.`;
  return {
    d,
    n,
    q,
    lettre,
    texte,
    expl,
    meta: { droite: { min: 0, max: q + 2, subdivisions: d, point: n / d, lettre } },
  };
}

const droiteNumeric: ItemGen = (level, rng, ctx) => {
  const p = pointDecrit(level, rng);
  return numeric(ctx, `reperer-${p.n}-${p.d}-${p.lettre}`, {
    prompt: `${p.texte} Quelle fraction repère le point ${p.lettre} ? …/${p.d}`,
    spoken: lire(`${p.texte} Quelle fraction repère le point ${p.lettre} ? …/${p.d}`),
    answer: p.n,
    explication: p.expl,
    difficulty: 0.25 + p.q * 0.1 + p.d / 40,
    meta: p.meta,
  });
};

const droiteQcm: ItemGen = (level, rng, ctx) => {
  if (rng.chance(0.5)) {
    const p = pointDecrit(level, rng);
    const { n, d } = p;
    return mcq(ctx, rng, `reperer-${n}-${d}-${p.lettre}`, {
      question: `${p.texte} Quelle fraction repère le point ${p.lettre} ?`,
      spoken: lire(`${p.texte} Quelle fraction repère le point ${p.lettre} ?`),
      good: frac(n, d),
      // Erreurs typiques : compter les traits au lieu des parts, oublier les unités déjà passées
      wrong: [frac(n, d + 1), frac(n + 1, d), frac(n % d || 1, d), frac(n - 1, d), frac(d, n)].filter((x) => {
        const [a, b] = x.split('/').map(Number);
        return a! >= 1 && denominateurOk(b!) && a! * d !== b! * n;
      }),
      explication: p.expl,
      difficulty: 0.35 + p.q * 0.1,
      meta: p.meta,
    });
  }
  const fr = fracDroite(level, rng);
  const [n, d] = fr;
  const q = Math.floor(n / d);
  return mcq(ctx, rng, `entre-${n}-${d}`, {
    question: `Sur la demi-droite graduée, entre quels repères faut-il placer ${frac(n, d)} ?`,
    spoken: `Sur la demi-droite graduée, entre quels repères faut-il placer ${fractionEnMots(n, d)} ?`,
    good: `entre ${q} et ${q + 1}`,
    wrong: [`entre ${q + 1} et ${q + 2}`, `entre ${q - 1} et ${q}`, `entre ${n} et ${n + 1}`].filter(
      (x) => !x.includes('-'),
    ),
    explication: `${q} = ${frac(q * d, d)} et ${q + 1} = ${frac((q + 1) * d, d)} : ${frac(n, d)} est entre les deux.`,
    difficulty: 0.3 + (q > 0 ? 0.15 : 0),
    max: 3,
  });
};

const droiteVraiFaux: ItemGen = (level, rng, ctx) => {
  const vrai = rng.chance(0.5);
  if (level !== 'facile' && rng.chance(0.4)) {
    // Deux fractions égales se placent au même point
    const d = rng.pick([2, 3, 4, 5, 6]);
    const k = rng.pick([2, 3]);
    const n = rng.int(1, 2 * d - 1);
    if (n === d) return droiteVraiFaux(level, rng, ctx);
    const m = vrai ? n * k : n * k + rng.pick([-1, 1]);
    return vraiFaux(ctx, `meme-point-${n}-${d}-${m}-${d * k}`, {
      statement: `Sur une demi-droite graduée, ${frac(n, d)} et ${frac(m, d * k)} sont placés au même point.`,
      spoken: `Sur une demi-droite graduée, ${fractionEnMots(n, d)} et ${fractionEnMots(m, d * k)} sont placés au même point.`,
      answer: m === n * k,
      explication: `${frac(n, d)} = ${frac(n * k, d * k)} (on partage chaque part en ${k}) ; ${m === n * k ? 'c’est donc le même point' : `${frac(m, d * k)} n’est pas au même endroit`}.`,
      difficulty: 0.6,
    });
  }
  const fr = fracDroite(level, rng);
  const [n, d] = fr;
  const q = Math.floor(n / d);
  const montre = vrai ? q : q === 0 ? 1 : rng.chance(0.5) ? q - 1 : q + 1;
  return vraiFaux(ctx, `entre-${n}-${d}-${montre}`, {
    statement: `Sur une demi-droite graduée, la fraction ${frac(n, d)} se place entre ${montre} et ${montre + 1}.`,
    spoken: `Sur une demi-droite graduée, la fraction ${fractionEnMots(n, d)} se place entre ${montre} et ${montre + 1}.`,
    answer: montre === q,
    explication: `${q} = ${frac(q * d, d)} et ${q + 1} = ${frac((q + 1) * d, d)} : ${frac(n, d)} se place entre ${q} et ${q + 1}.`,
    difficulty: 0.3 + q * 0.1,
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.FRAC.COMPARER                                                */
/* ------------------------------------------------------------------ */

type Paire = { a: F; b: F; cas: 'meme-den' | 'un' | 'multiples' | 'meme-num' | 'commun' };

function paireComparer(level: Level, rng: Rng, visuelSeul = false): Paire {
  const maxD = visuelSeul ? 12 : 60;
  if (level === 'facile') {
    const d = rng.pick(DEN_F.filter((x) => x >= 3));
    if (!visuelSeul && rng.chance(0.25)) return { a: [rng.int(1, 2 * d - 1), d], b: [1, 1], cas: 'un' };
    const [x, y] = rng.shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 2);
    return { a: [x!, d], b: [y!, d], cas: 'meme-den' };
  }
  if (level === 'normal') {
    const r = rng.next();
    if (!visuelSeul && r < 0.15) {
      const d = rng.pick(DEN_N);
      return { a: [rng.int(1, 2 * d), d], b: [1, 1], cas: 'un' };
    }
    const d = rng.pick([2, 3, 4, 5, 6, 8, 10, 12].filter((x) => x * 2 <= maxD));
    const k = rng.pick([2, 3, 4, 5].filter((x) => d * x <= maxD));
    const D = d * k;
    const n1 = rng.int(1, visuelSeul ? d - 1 : 2 * d - 1);
    // Parfois deux fractions égales (1/2 = 4/8) — jamais pour le visuel, qui demande la plus grande
    const n2 =
      !visuelSeul && r < 0.3
        ? n1 * k
        : (() => {
            for (;;) {
              const x = rng.int(1, visuelSeul ? D - 1 : 2 * D - 1);
              if (x !== n1 * k) return x;
            }
          })();
    const [a, b]: [F, F] = rng.chance(0.5)
      ? [
          [n1, d],
          [n2, D],
        ]
      : [
          [n2, D],
          [n1, d],
        ];
    return { a, b, cas: 'multiples' };
  }
  // Plus loin : même numérateur ou dénominateur commun ≤ 60
  if (rng.chance(0.4)) {
    const n = rng.int(1, visuelSeul ? 4 : 9);
    const [d1, d2] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12].filter((x) => x > n || !visuelSeul));
    return { a: [n, d1!], b: [n, d2!], cas: 'meme-num' };
  }
  for (;;) {
    const d1 = rng.int(2, 12);
    const d2 = rng.int(2, 12);
    if (d1 === d2 || d1 % d2 === 0 || d2 % d1 === 0 || ppcm(d1, d2) > maxD) continue;
    const a: F = [rng.int(1, visuelSeul ? d1 - 1 : 2 * d1 - 1), d1];
    const b: F = [rng.int(1, visuelSeul ? d2 - 1 : 2 * d2 - 1), d2];
    if (compare(a, b) === '=') continue;
    return { a, b, cas: 'commun' };
  }
}

/** Explication d'une comparaison, selon la méthode attendue. */
function explComparer({ a, b, cas }: Paire): string {
  const sg = compare(a, b);
  const A = ecrire(a);
  const B = ecrire(b);
  switch (cas) {
    case 'meme-den':
      return `Les parts ont la même taille : on compare les numérateurs, ${a[0]} ${signe(a[0], b[0])} ${b[0]}, donc ${A} ${sg} ${B}.`;
    case 'un': {
      const [n, d] = a;
      return `1 = ${frac(d, d)} ; ${n} ${signe(n, d)} ${d}, donc ${A} ${sg} 1.`;
    }
    case 'meme-num':
      return `Même numérateur : plus on partage en beaucoup de parts, plus chaque part est petite. Donc ${A} ${sg} ${B}.`;
    case 'multiples':
    case 'commun': {
      const D = ppcm(a[1], b[1]);
      const conv = [a, b]
        .filter((f) => f[1] !== D)
        .map((f) => `${ecrire(f)} = ${frac(f[0] * (D / f[1]), D)}`)
        .join(' et ');
      return `On écrit les fractions avec le même dénominateur ${D} : ${conv}. On compare alors les numérateurs : ${A} ${sg} ${B}.`;
    }
  }
}

const difComparer = (p: Paire) =>
  ({ 'meme-den': 0.2, un: 0.3, multiples: 0.5, 'meme-num': 0.6, commun: 0.75 })[p.cas] +
  (Math.abs(val(p.a) - val(p.b)) < 0.15 ? 0.15 : 0);

const comparerQcm: ItemGen = (level, rng, ctx) => {
  const p = paireComparer(level, rng);
  return comparaison(ctx, `cmp-${ecrire(p.a)}-${ecrire(p.b)}`, {
    gauche: ecrire(p.a),
    droite: ecrire(p.b),
    signe: compare(p.a, p.b),
    spokenGauche: p.a[1] === 1 ? String(p.a[0]) : fractionEnMots(...p.a),
    spokenDroite: p.b[1] === 1 ? String(p.b[0]) : fractionEnMots(...p.b),
    explication: explComparer(p),
    difficulty: difComparer(p),
  });
};

const comparerVisuel: ItemGen = (level, rng, ctx) => {
  const p = paireComparer(level, rng, true);
  const shape = forme(rng, Math.max(p.a[1], p.b[1]));
  return make(ctx, 'visual_fraction', `comparer-${shape}-${ecrire(p.a)}-${ecrire(p.b)}`, {
    prompt: `Quelle fraction ${DE_LA[shape]} est la plus grande ?`,
    spoken: `Laquelle est la plus grande : ${fractionEnMots(...p.a)} ou ${fractionEnMots(...p.b)} ?`,
    numerator: p.a[0],
    denominator: p.a[1],
    shape,
    task: 'comparer',
    other: { numerator: p.b[0], denominator: p.b[1] },
    explication: explComparer(p),
    difficulty: difComparer(p),
  });
};

const comparerRanger: ItemGen = (level, rng, ctx) => {
  const nb = parNiv(level, { facile: 4, normal: 4, plus_loin: 5 });
  const vals = new Set<number>();
  const fr: F[] = [];
  const base = rng.pick([2, 3, 4, 5]);
  const dens = parNiv(level, {
    facile: [rng.pick(DEN_F.filter((d) => d >= 5))],
    normal: [base, base * 2, base * 4].filter((d) => d <= 60),
    plus_loin: [2, 3, 4, 5, 6, 8, 10, 12],
  });
  let guard = 0;
  while (fr.length < nb && guard++ < 300) {
    const d = rng.pick(dens);
    const n = rng.int(1, level === 'facile' ? d - 1 : level === 'normal' ? d * 2 - 1 : d * 3 - 1);
    const v = Math.round((n / d) * 1e6);
    if (vals.has(v) || n % d === 0) continue;
    vals.add(v);
    fr.push([n, d]);
  }
  const croissant = rng.chance(0.5);
  fr.sort((x, y) => (croissant ? val(x) - val(y) : val(y) - val(x)));
  const els = fr.map(ecrire);
  const ex =
    level === 'facile'
      ? `Même dénominateur : on range les numérateurs, ${croissant ? 'du plus petit au plus grand' : 'du plus grand au plus petit'}.`
      : `On peut écrire toutes les fractions avec le même dénominateur, ou les situer par rapport à 1 : ${els.join(croissant ? ' < ' : ' > ')}.`;
  return make(ctx, 'ordering', `ranger-${croissant ? 'c' : 'd'}-${els.join('|')}`, {
    prompt: croissant
      ? 'Range ces fractions de la plus petite à la plus grande.'
      : 'Range ces fractions de la plus grande à la plus petite.',
    elements: els,
    mode: croissant ? 'croissant' : 'decroissant',
    explication: ex,
    difficulty: parNiv(level, { facile: 0.25, normal: 0.5, plus_loin: 0.75 }),
  });
};

const comparerVraiFaux: ItemGen = (level, rng, ctx) => {
  const p = paireComparer(level, rng);
  const vrai = compare(p.a, p.b);
  const juste = rng.chance(0.5);
  const montre = juste ? vrai : vrai === '<' ? '>' : vrai === '>' ? '<' : rng.pick(['<', '>'] as const);
  const A = ecrire(p.a);
  const B = ecrire(p.b);
  const mot = { '<': 'plus petit que', '>': 'plus grand que', '=': 'égal à' } as const;
  return vraiFaux(ctx, `vf-${A}-${montre}-${B}`, {
    statement: `${A} ${montre} ${B}`,
    spoken: `${p.a[1] === 1 ? p.a[0] : fractionEnMots(...p.a)} est ${mot[montre]} ${p.b[1] === 1 ? p.b[0] : fractionEnMots(...p.b)}.`,
    answer: montre === vrai,
    explication: explComparer(p),
    difficulty: difComparer(p),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.FRAC.OPERATIONS                                              */
/* ------------------------------------------------------------------ */

/** Somme ou différence a/d ± b/D (D multiple de d) : résultat en D-ièmes. */
type Op = { a: F; b: F; op: '+' | '−'; D: number; res: number };

function operation(level: Level, rng: Rng, visuelSeul = false): Op {
  for (;;) {
    const op: '+' | '−' = rng.chance(0.5) ? '+' : '−';
    let d: number;
    let D: number;
    if (level === 'facile') {
      d = D = rng.pick(visuelSeul ? [3, 4, 5, 6, 8, 10, 12] : [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    } else {
      d = rng.pick([2, 3, 4, 5, 6].filter((x) => !visuelSeul || x <= 6));
      const k = rng.pick([2, 3, 4, 5].filter((x) => d * x <= (visuelSeul ? 12 : 60)));
      D = d * k;
    }
    const lim = level === 'plus_loin' ? 2 : 1;
    const a = rng.int(1, lim * d - 1);
    const b = rng.int(1, lim * D - 1);
    const A = a * (D / d);
    const res = op === '+' ? A + b : A - b;
    if (res <= 0 || res > parNiv(level, { facile: D, normal: 2 * D, plus_loin: 3 * D })) continue;
    if (level === 'facile' && op === '+' && res > D) continue;
    // Ordre aléatoire des deux termes pour l'addition
    const swap = op === '+' && d !== D && rng.chance(0.5);
    return swap ? { a: [b, D], b: [a, d], op, D, res } : { a: [a, d], b: [b, D], op, D, res };
  }
}

const ecrireOp = (o: Op) => `${frac(...o.a)} ${o.op} ${frac(...o.b)}`;

function explOp(o: Op): string {
  const verbe = o.op === '+' ? 'on ajoute' : 'on enlève';
  const nom = nomDenominateur(o.D, true);
  if (o.a[1] === o.b[1])
    return `Les parts ont la même taille : ${verbe} les numérateurs (${o.a[0]} ${o.op} ${o.b[0]} = ${o.res}) et le dénominateur ne change pas, ${frac(o.res, o.D)}.`;
  const [petit] = [o.a, o.b].filter((f) => f[1] !== o.D) as [F];
  const k = o.D / petit[1];
  const conv = frac(petit[0] * k, o.D);
  const [x, y] = o.a[1] === o.D ? [o.a[0], petit[0] * k] : [petit[0] * k, o.b[0]];
  return `On écrit ${frac(...petit)} en ${nom} : ${frac(...petit)} = ${conv}. Puis ${x} ${o.op} ${y} = ${o.res}, donc ${frac(o.res, o.D)}.`;
}

type Quantite = { n: number; d: number; Q: number; unite: string; res: number };

const UNITES_Q = ['€', 'm', 'kg', 'min', 'L', 'km'];

function quantite(level: Level, rng: Rng): Quantite {
  const d = parNiv(level, {
    facile: rng.pick([2, 3, 4, 5, 10]),
    normal: rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 20, 25]),
    plus_loin: rng.pick([6, 8, 12, 15, 20, 24, 25, 40, 50, 60]),
  });
  // Fraction irréductible (« 3/4 de 60 », pas « 6/8 de 60 »)
  let n = 1;
  if (level !== 'facile')
    do n = rng.int(1, d - 1);
    while (pgcd(n, d) !== 1);
  const part = parNiv(level, { facile: rng.int(2, 10), normal: rng.int(2, 40), plus_loin: rng.int(5, 160) });
  const Q = d * part;
  return { n, d, Q, unite: rng.pick(UNITES_Q), res: n * part };
}

const ecrireQ = (q: Quantite) => `${frac(q.n, q.d)} de ${fmt(q.Q)} ${q.unite}`;
const explQ = (q: Quantite) =>
  q.n === 1
    ? `${frac(1, q.d)} de ${fmt(q.Q)}, c’est une part quand on partage en ${q.d} : ${fmt(q.Q)} ÷ ${q.d} = ${fmt(q.res)}.`
    : `On partage ${fmt(q.Q)} en ${q.d} parts égales (${fmt(q.Q)} ÷ ${q.d} = ${fmt(q.Q / q.d)}), puis on prend ${q.n} parts : ${q.n} × ${fmt(q.Q / q.d)} = ${fmt(q.res)}.`;

const opNumeric: ItemGen = (level, rng, ctx) => {
  const f = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 2), plus_loin: rng.int(0, 3) });
  if (f === 0) {
    const o = operation(level, rng);
    return numeric(ctx, `op-${ecrireOp(o)}`, {
      prompt: `${ecrireOp(o)} = …/${o.D}`,
      spoken: lire(`${ecrireOp(o)} = …/${o.D}`),
      answer: o.res,
      explication: explOp(o),
      difficulty: 0.2 + (o.a[1] !== o.b[1] ? 0.3 : 0) + (o.res > o.D ? 0.15 : 0),
    });
  }
  if (f === 1 && level !== 'facile') {
    const d = rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const a = rng.int(1, d - 1);
    const m = rng.int(2, level === 'plus_loin' ? 12 : 9);
    if (level === 'plus_loin' && m * a > d && (m * a) % d !== 0)
      return numeric(ctx, `mult-ent-${m}-${a}-${d}`, {
        prompt: `${m} × ${frac(a, d)} = … + ${frac((m * a) % d, d)}`,
        spoken: lire(`${m} × ${frac(a, d)} = combien plus ${frac((m * a) % d, d)}`),
        answer: Math.floor((m * a) / d),
        explication: `${m} × ${frac(a, d)} = ${frac(m * a, d)} (${m} fois ${parts(a, d)}) ; ${explMixte([m * a, d])}`,
        difficulty: 0.75,
      });
    return numeric(ctx, `mult-${m}-${a}-${d}`, {
      prompt: `${m} × ${frac(a, d)} = …/${d}`,
      spoken: lire(`${m} × ${frac(a, d)} = …/${d}`),
      answer: m * a,
      explication: `${m} × ${frac(a, d)}, c’est ${m} fois ${parts(a, d)} : ${m} × ${a} = ${m * a}, donc ${frac(m * a, d)}.`,
      difficulty: 0.4,
    });
  }
  if (f === 1) {
    // Facile : complément à 1
    const d = rng.pick([3, 4, 5, 6, 8, 10]);
    const a = rng.int(1, d - 1);
    return numeric(ctx, `compl-${a}-${d}`, {
      prompt: `${frac(a, d)} + …/${d} = 1`,
      spoken: lire(`${frac(a, d)} plus …/${d} égale 1`),
      answer: d - a,
      explication: `1 = ${frac(d, d)} ; il manque ${d} − ${a} = ${d - a} part${s(d - a)} : ${frac(a, d)} + ${frac(d - a, d)} = 1.`,
      difficulty: 0.3,
    });
  }
  // Fraction d'une quantité (normal, plus loin)
  const q = quantite(level, rng);
  return numeric(ctx, `quantite-${ecrireQ(q)}`, {
    prompt: `${ecrireQ(q)} = …`,
    spoken: lire(`${ecrireQ(q)} = … ${q.unite}`),
    answer: q.res,
    unit: q.unite,
    explication: explQ(q),
    difficulty: 0.35 + (q.n > 1 ? 0.2 : 0) + (q.Q > 200 ? 0.15 : 0),
  });
};

const opVisuel: ItemGen = (level, rng, ctx) => {
  const o = operation(level, rng, true);
  const shape = forme(rng, o.D);
  const plus = o.res > o.D;
  return make(ctx, 'visual_fraction', `op-${shape}-${ecrireOp(o)}`, {
    prompt: plus
      ? `Colorie ${ecrireOp(o)} (${ENTIERE[shape]}, c’est ${frac(o.D, o.D)}).`
      : `Colorie ${ecrireOp(o)} ${DE_LA[shape]}.`,
    spoken: `Colorie ${fractionEnMots(...o.a)} ${o.op === '+' ? 'plus' : 'moins'} ${fractionEnMots(...o.b)}${plus ? '' : ` ${DE_LA[shape]}`}.`,
    numerator: o.res,
    denominator: o.D,
    shape,
    task: 'colorier',
    explication: explOp(o),
    difficulty: 0.25 + (o.a[1] !== o.b[1] ? 0.3 : 0) + (plus ? 0.15 : 0),
  });
};

const opQcm: ItemGen = (level, rng, ctx) => {
  if (level !== 'facile' && rng.chance(0.5)) {
    const q = quantite(level, rng);
    const part = q.Q / q.d;
    return mcq(ctx, rng, `quantite-${ecrireQ(q)}`, {
      question: `Combien font ${ecrireQ(q)} ?`,
      spoken: `Combien font ${lire(ecrireQ(q))} ?`,
      good: `${fmt(q.res)} ${q.unite}`,
      wrong: [part, q.Q * q.n, q.Q - q.res, q.res + part, q.res - 1, q.res + q.d, 2 * q.res]
        .filter((x) => Number.isInteger(x) && x > 0 && x !== q.res && x <= 999_999_999)
        .map((x) => `${fmt(x)} ${q.unite}`),
      explication: explQ(q),
      difficulty: 0.4 + (q.n > 1 ? 0.2 : 0),
    });
  }
  const o = operation(level, rng);
  const good = frac(o.res, o.D);
  const [x, y] = [o.a, o.b];
  const fauxDen = x[1] + y[1];
  const cand: string[] = [
    // Erreur classique : ajouter les numérateurs ET les dénominateurs
    ...(o.op === '+' && denominateurOk(fauxDen) ? [frac(x[0] + y[0], fauxDen)] : []),
    ...(o.op === '−' && x[1] !== y[1] ? [frac(Math.abs(x[0] - y[0]) || 1, Math.max(x[1], y[1]))] : []),
    frac(o.op === '+' ? x[0] + y[0] : Math.abs(x[0] - y[0]) || 1, o.D),
    frac(o.res + 1, o.D),
    frac(o.res + 2, o.D),
    frac(Math.max(1, o.res - 1), o.D),
  ];
  const wrong = cand.filter((c) => {
    const [a, b] = c.split('/').map(Number);
    return a! * o.D !== b! * o.res;
  });
  return mcq(ctx, rng, `op-${ecrireOp(o)}`, {
    question: `${ecrireOp(o)} = ?`,
    spoken: `${lire(ecrireOp(o))} égale combien ?`,
    good,
    wrong,
    explication: explOp(o),
    difficulty: 0.25 + (o.a[1] !== o.b[1] ? 0.3 : 0),
  });
};

type Contexte = {
  objet: string;
  unite: string;
  /** `f` = « les 3/4 » ou « 1/4 » ; `un` = numérateur 1 (accord au singulier). */
  enonce: (Q: string, f: string, un: boolean) => string;
  question: string;
  reponse: string;
  reste: { question: string; reponse: string };
};

const CONTEXTES: Contexte[] = [
  {
    objet: 'élèves',
    unite: 'élèves',
    enonce: (Q, f, un) =>
      `Dans une école de ${Q} élèves, ${f} des élèves ${un ? 'mange' : 'mangent'} à la cantine.`,
    question: 'Combien d’élèves mangent à la cantine ?',
    reponse: '___ élèves mangent à la cantine.',
    reste: {
      question: 'Combien d’élèves ne mangent pas à la cantine ?',
      reponse: '___ élèves ne mangent pas à la cantine.',
    },
  },
  {
    objet: 'ruban',
    unite: 'cm',
    enonce: (Q, f) => `Un ruban mesure ${Q} cm. On en coupe ${f}.`,
    question: 'Quelle longueur de ruban coupe-t-on ?',
    reponse: 'On coupe ___ cm de ruban.',
    reste: { question: 'Quelle longueur de ruban reste-t-il ?', reponse: 'Il reste ___ cm de ruban.' },
  },
  {
    objet: 'randonnée',
    unite: 'km',
    enonce: (Q, f) => `Une randonnée fait ${Q} km. Le premier jour, on a parcouru ${f} du trajet.`,
    question: 'Combien de kilomètres a-t-on parcourus le premier jour ?',
    reponse: 'Le premier jour, on a parcouru ___ km.',
    reste: {
      question: 'Combien de kilomètres reste-t-il à parcourir ?',
      reponse: 'Il reste ___ km à parcourir.',
    },
  },
  {
    objet: 'argent',
    unite: '€',
    enonce: (Q, f) => `PERSO a ${Q} € d’économies. PRON dépense ${f} de cette somme pour acheter un livre.`,
    question: 'Combien coûte le livre ?',
    reponse: 'Le livre coûte ___ €.',
    reste: { question: 'Combien d’argent reste-t-il à PERSO ?', reponse: 'Il reste ___ € à PERSO.' },
  },
  {
    objet: 'film',
    unite: 'min',
    enonce: (Q, f) => `Un film dure ${Q} minutes. PERSO en a déjà regardé ${f}.`,
    question: 'Combien de minutes du film PERSO a-t-PRON regardées ?',
    reponse: 'PERSO a regardé ___ minutes du film.',
    reste: {
      question: 'Combien de minutes de film reste-t-il à regarder ?',
      reponse: 'Il reste ___ minutes de film à regarder.',
    },
  },
];

const opProbleme: ItemGen = (level, rng, ctx) => {
  const c = rng.pick(CONTEXTES);
  const d = parNiv(level, {
    facile: rng.pick([2, 3, 4, 5]),
    normal: rng.pick([3, 4, 5, 6, 8, 10]),
    plus_loin: rng.pick([3, 4, 5, 6, 8, 10]),
  });
  let n = 1;
  if (level !== 'facile')
    do n = rng.int(1, d - 1);
    while (pgcd(n, d) !== 1);
  const part = parNiv(level, { facile: rng.int(2, 12), normal: rng.int(3, 30), plus_loin: rng.int(4, 60) });
  const Q = d * part;
  const res = n * part;
  const deuxEtapes = level === 'plus_loin' && rng.chance(0.7);
  const [p] = deuxPersos(rng);
  const perso = (t: string) =>
    t
      .replace(/PERSO/g, p.nom)
      .replace(/\. PRON/g, `. ${cap(p.il)}`)
      .replace(/PRON/g, p.il);
  const f = n === 1 ? frac(1, d) : `les ${frac(n, d)}`;
  const statement = perso(c.enonce(fmt(Q), f, n === 1));
  const answer = deuxEtapes ? Q - res : res;
  const question = perso(deuxEtapes ? c.reste.question : c.question);
  const operationTxt = deuxEtapes
    ? `${fmt(Q)} ÷ ${d} = ${fmt(part)} ; ${n} × ${fmt(part)} = ${fmt(res)} ; ${fmt(Q)} − ${fmt(res)} = ${fmt(answer)}`
    : n === 1
      ? `${fmt(Q)} ÷ ${d} = ${fmt(res)}`
      : `${fmt(Q)} ÷ ${d} = ${fmt(part)} ; ${n} × ${fmt(part)} = ${fmt(res)}`;
  const segs = Array.from({ length: d }, (_, i) => ({ value: null, label: i < n ? 'pris' : undefined }));
  return make(ctx, 'bar_model', `pb-${c.objet}-${n}-${d}-${Q}-${deuxEtapes}`, {
    statement,
    spoken: lire(`${statement} ${question}`),
    structure: deuxEtapes ? 'deux-etapes' : 'partage',
    bars: [{ label: c.objet, segments: segs }],
    total: Q,
    question,
    answer,
    unit: c.unite === 'élèves' ? undefined : c.unite,
    answerSentence: perso(deuxEtapes ? c.reste.reponse : c.reponse),
    reformulations: deuxEtapes
      ? [
          `On cherche ce qui reste quand on a enlevé ${f} de ${fmt(Q)}.`,
          `On cherche seulement ${f} de ${fmt(Q)}.`,
          `On cherche combien de parts il y a en tout.`,
        ]
      : [
          `On partage ${fmt(Q)} en ${d} parts égales et on en prend ${n}.`,
          `On cherche ce qui reste quand on a enlevé ${f} de ${fmt(Q)}.`,
          `On ajoute ${n} et ${d} à ${fmt(Q)}.`,
        ],
    operation: operationTxt,
    explication: deuxEtapes
      ? `${explQ({ n, d, Q, unite: c.unite, res })} Il reste ${fmt(Q)} − ${fmt(res)} = ${fmt(answer)}.`
      : explQ({ n, d, Q, unite: c.unite, res }),
    difficulty: parNiv(level, { facile: 0.25, normal: 0.5, plus_loin: 0.75 }),
  });
};

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const FRACTIONS: Record<string, LessonContent> = {
  'CM2.MA.FRAC.SENS': {
    gens: { visual_fraction: sensVisuel, numeric_answer: sensNumeric, mcq: sensQcm, pairing: sensPaires },
  },
  'CM2.MA.FRAC.DROITE': {
    gens: {
      number_line: droiteLigne,
      numeric_answer: droiteNumeric,
      mcq: droiteQcm,
      true_false: droiteVraiFaux,
    },
  },
  'CM2.MA.FRAC.COMPARER': {
    gens: {
      mcq: comparerQcm,
      visual_fraction: comparerVisuel,
      ordering: comparerRanger,
      true_false: comparerVraiFaux,
    },
  },
  'CM2.MA.FRAC.OPERATIONS': {
    gens: { numeric_answer: opNumeric, visual_fraction: opVisuel, mcq: opQcm, bar_model: opProbleme },
  },
};
