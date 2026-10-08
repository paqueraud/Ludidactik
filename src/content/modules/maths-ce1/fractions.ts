/**
 * CE1 — Fractions d'un tout (BO n°41 du 31/10/2024) : dénominateurs 2, 3, 4, 5, 6, 8 et 10 ;
 * fractions ≤ 1 (fractions > 1 = « Pour aller plus loin (CE2) ») ; unitaires dès P2, comparaison dès P4 ;
 * addition / soustraction de même dénominateur, complément à 1.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemGen, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { DENOMS_CE1, clamp01, de, frac, fractionEnMots, make, mcq, numeric, parNiv, que } from './util';

type Shape = ItemOf<'visual_fraction'>['shape'];
const SHAPES: Shape[] = ['pizza', 'barre', 'tablette'];
/** Dénominateurs du BO au CE1 (2, 3, 4, 5, 6, 8, 10) : distracteurs choisis parmi eux. */
const DENOMS_BO = [2, 3, 4, 5, 6, 8, 10];
/** Dénominateur voisin dans la liste du BO (sens +1 ou −1, en rebondissant aux extrémités). */
function denomVoisin(d: number, sens: 1 | -1): number {
  const i = DENOMS_BO.indexOf(d);
  const j = i + sens < 0 || i + sens >= DENOMS_BO.length ? i - sens : i + sens;
  return DENOMS_BO[j] ?? (d === 2 ? 3 : 2);
}
const DE_LA: Record<Shape, string> = {
  pizza: 'de la pizza',
  barre: 'de la bande',
  tablette: 'de la tablette',
};

const denoms = (level: Level) =>
  parNiv<readonly number[]>(level, { facile: [2, 4], normal: DENOMS_CE1, plus_loin: DENOMS_CE1 });
const denomsNonUnit = (level: Level) =>
  parNiv<readonly number[]>(level, { facile: [2, 3, 4], normal: DENOMS_CE1, plus_loin: DENOMS_CE1 });

const partage = (n: number, d: number) =>
  `On partage le tout en ${d} parts égales et on en prend ${n} : ${fractionEnMots(n, d)}.`;

function visuel(
  ctx: GenContext,
  rng: Rng,
  n: number,
  d: number,
  task: 'colorier' | 'lire',
  difficulty: number,
  shape: Shape = rng.pick(SHAPES),
): ItemOf<'visual_fraction'> {
  return make(ctx, 'visual_fraction', `${task}-${shape}-${n}-${d}`, {
    prompt:
      n > d
        ? task === 'colorier'
          ? `Colorie ${frac(n, d)} (une pizza entière, c’est ${frac(d, d)}).`
          : `Quelle fraction est coloriée ? (une pizza entière, c’est ${frac(d, d)})`
        : task === 'colorier'
          ? `Colorie ${frac(n, d)} ${DE_LA[shape]}.`
          : `Quelle fraction ${DE_LA[shape]} est coloriée ?`,
    spoken:
      task === 'colorier'
        ? `Colorie ${fractionEnMots(n, d)}${n > d ? '' : ` ${DE_LA[shape]}`}.`
        : `Quelle fraction ${n > d ? '' : `${DE_LA[shape]} `}est coloriée ?`,
    numerator: n,
    denominator: d,
    shape,
    task,
    explication:
      n > d
        ? `${frac(n, d)} = ${frac(d, d)} + ${frac(n - d, d)} : une pizza entière et encore ${n - d} part${n - d > 1 ? 's' : ''} de la deuxième.`
        : partage(n, d),
    difficulty: clamp01(difficulty),
  });
}

function ligne(
  ctx: GenContext,
  n: number,
  d: number,
  difficulty: number,
  display = frac(n, d),
  explication = `On partage l’unité (de 0 à 1) en ${d} parts égales et on avance de ${n} part${n > 1 ? 's' : ''}.`,
): ItemOf<'number_line'> {
  const max = n > d ? Math.ceil(n / d) : 1;
  return make(ctx, 'number_line', `ligne-${display}`, {
    prompt: `Place ${display} sur la droite graduée.`,
    spoken: `Place ${display
      .replace(/(\d+)\/(\d+)/g, (_, a: string, b: string) => fractionEnMots(Number(a), Number(b)))
      .replace(/ \+ /g, ' plus ')
      .replace(/ − /g, ' moins ')} sur la droite graduée.`,
    min: 0,
    max,
    step: 1,
    subdivisions: d,
    target: n / d,
    display,
    tolerance: Math.round((0.4 / d) * 1000) / 1000,
    explication,
    difficulty: clamp01(difficulty),
  });
}

function paires(ctx: GenContext, rng: Rng, fr: [number, number][], difficulty: number): ItemOf<'pairing'> {
  const pairs = fr.map(([n, d]) => ({ left: frac(n, d), right: fractionEnMots(n, d) }));
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque fraction à son nom.',
    pairs: rng.shuffle(pairs),
    relation: 'fraction → écriture en mots',
    explication:
      'Le nombre du bas dit en combien de parts on partage (demis, tiers, quarts…), celui du haut combien on en prend.',
    difficulty: clamp01(difficulty),
  });
}

/* ------------------------------------------------------------------ */
/* CE1.MA.FRAC.UNITAIRE                                                */
/* ------------------------------------------------------------------ */

const unitVisuel: ItemGen = (level, rng, ctx) =>
  visuel(
    ctx,
    rng,
    1,
    rng.pick(denoms(level)),
    rng.chance(0.5) ? 'colorier' : 'lire',
    level === 'facile' ? 0.15 : 0.35,
  );

const unitLigne: ItemGen = (level, rng, ctx) => {
  const d = rng.pick(denoms(level));
  return ligne(ctx, 1, d, 0.3 + d / 20);
};

const unitQcm: ItemGen = (level, rng, ctx) => {
  const ds = denoms(level);
  const d = rng.pick(ds);
  const forme = rng.int(0, 2);
  const autres = DENOMS_CE1.filter((x) => x !== d);
  if (forme === 0)
    return mcq(ctx, rng, `lire-${d}`, {
      question: `Comment lit-on ${frac(1, d)} ?`,
      good: fractionEnMots(1, d),
      wrong: [
        ...rng
          .shuffle(autres)
          .slice(0, 2)
          .map((x) => fractionEnMots(1, x)),
        fractionEnMots(2, d),
      ],
      explication: `${frac(1, d)} se lit « ${fractionEnMots(1, d)} » : une part quand on partage en ${d}.`,
      difficulty: 0.25,
    });
  if (forme === 1) {
    const objet = rng.pick([
      'une pizza',
      'une tablette de chocolat',
      'une bande de papier',
      'une tarte',
      'une ficelle',
    ]);
    return mcq(ctx, rng, `part-${d}-${objet}`, {
      question: `On partage ${objet} en ${d} parts égales. Quelle fraction représente une part ?`,
      good: frac(1, d),
      wrong: [frac(d, 1), frac(1, denomVoisin(d, 1)), frac(1, denomVoisin(d, -1)), String(d)],
      explication: `Une part sur ${d} parts égales, c’est ${frac(1, d)} (${fractionEnMots(1, d)}).`,
      difficulty: 0.3,
    });
  }
  // Vocabulaire BO : moitié, demi, quart
  const [mot, f] = rng.pick([
    ['la moitié', [1, 2]],
    ['un demi', [1, 2]],
    ['un quart', [1, 4]],
    ['un tiers', [1, 3]],
  ] as const);
  return mcq(ctx, rng, `mot-${mot}`, {
    question: `Quelle fraction est ${mot} ?`,
    good: frac(f[0], f[1]),
    wrong: [frac(1, 2), frac(1, 3), frac(1, 4), frac(2, 1), frac(1, 5)],
    explication: `${mot[0]!.toUpperCase()}${mot.slice(1)}, c’est ${frac(f[0], f[1])} : une part quand on partage en ${f[1]} parts égales.`,
    difficulty: 0.2,
  });
};

const unitPaires: ItemGen = (level, rng, ctx) => {
  const ds = rng.shuffle(level === 'facile' ? [2, 3, 4, 8] : DENOMS_CE1).slice(0, level === 'facile' ? 3 : 4);
  return paires(
    ctx,
    rng,
    ds.map((d) => [1, d] as [number, number]),
    level === 'facile' ? 0.2 : 0.4,
  );
};

const unitNumeric: ItemGen = (level, rng, ctx) => {
  const d = rng.pick(denoms(level));
  if (level === 'plus_loin') {
    // Fraction d'une collection (au-delà du CE1)
    const k = rng.int(2, 6);
    const objets = rng.pick(['billes', 'bonbons', 'images', 'perles', 'crayons']);
    return numeric(ctx, `collection-${d}-${k}-${objets}`, {
      prompt: `${d === 2 ? 'La moitié' : frac(1, d)} de ${d * k} ${objets}, c’est combien ${de(objets)} ?`,
      spoken: `${d === 2 ? 'La moitié' : fractionEnMots(1, d)} de ${d * k} ${objets}, c’est combien ${de(objets)} ?`,
      answer: k,
      explication: `On partage les ${d * k} ${objets} en ${d} paquets égaux : ${d * k} = ${d} × ${k}, donc chaque paquet a ${k} ${objets}.`,
      difficulty: 0.75,
      unit: objets,
    });
  }
  return numeric(ctx, `tout-${d}`, {
    prompt: `Combien de ${fractionEnMots(2, d).split(' ')[1]} faut-il pour faire le tout ?`,
    answer: d,
    explication: `Il faut ${d} parts de ${frac(1, d)} pour faire le tout : ${frac(d, d)} = 1.`,
    difficulty: 0.3,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.FRAC.NONUNIT                                                 */
/* ------------------------------------------------------------------ */

/** Fraction n/d : ≤ 1 (facile, normal) ; jusqu'à 2 (plus loin, CE2). */
function fracNonUnit(level: Level, rng: Rng): [number, number] {
  const d = rng.pick(denomsNonUnit(level));
  if (level === 'plus_loin') return [rng.int(d + 1, 2 * d - 1), d];
  return [rng.int(2, d), d];
}

const nonUnitVisuel: ItemGen = (level, rng, ctx) => {
  const [n, d] = fracNonUnit(level, rng);
  return visuel(
    ctx,
    rng,
    n,
    d,
    rng.chance(0.5) ? 'colorier' : 'lire',
    0.25 + d / 25 + (n > d ? 0.3 : 0),
    n > d ? 'pizza' : rng.pick(SHAPES),
  );
};

const nonUnitLigne: ItemGen = (level, rng, ctx) => {
  const [n, d] = fracNonUnit(level, rng);
  return ligne(ctx, n, d, 0.35 + d / 25 + (n > d ? 0.25 : 0));
};

const nonUnitTrou: ItemGen = (level, rng, ctx) => {
  const [n0, d] = fracNonUnit(level, rng);
  let n = n0;
  const forme = rng.int(0, 4);
  if (level === 'plus_loin' && forme === 4)
    return make(ctx, 'fill_blank', `plus1-${n}-${d}`, {
      sentence: `${frac(n, d)} = 1 + ___`,
      answer: frac(n - d, d),
      accepted: [frac(n - d, d).replace('/', ' / ')],
      explication: `${frac(d, d)} = 1, donc ${frac(n, d)} = ${frac(d, d)} + ${frac(n - d, d)} = 1 + ${frac(n - d, d)}.`,
      difficulty: 0.8,
    });
  const unite = frac(1, d);
  if (forme === 0 && n >= 2 && n <= 5) {
    const termes = Array<string>(n).fill(unite);
    return make(ctx, 'fill_blank', `somme-${n}-${d}`, {
      sentence: `${frac(n, d)} = ${termes.slice(0, -1).join(' + ')} + ___`,
      answer: unite,
      accepted: [unite.replace('/', ' / ')],
      choices:
        level === 'facile'
          ? [unite, frac(n, d), frac(1, n)].filter((x, i, a) => a.indexOf(x) === i)
          : undefined,
      explication: `${fractionEnMots(n, d)}, c’est ${n} fois ${fractionEnMots(1, d)} : ${termes.join(' + ')}.`,
      difficulty: 0.4,
    });
  }
  if (forme === 1)
    return make(ctx, 'fill_blank', `fois-${n}-${d}`, {
      sentence: `${frac(n, d)}, c’est ___ fois ${unite}.`,
      answer: String(n),
      explication: `${fractionEnMots(n, d)}, c’est ${n} fois ${fractionEnMots(1, d)}.`,
      difficulty: 0.35,
    });
  if (forme === 2 || forme === 3) {
    if (n === d) n = d - 1 || 1;
    const quoi = forme === 2 ? 'dénominateur' : 'numérateur';
    const rep = forme === 2 ? d : n;
    return make(ctx, 'fill_blank', `${quoi}-${n}-${d}`, {
      sentence: `Dans la fraction ${frac(n, d)}, le ${quoi} est ___.`,
      answer: String(rep),
      choices: n !== d ? [String(n), String(d)] : undefined,
      explication: `Le dénominateur (en bas) dit en combien de parts égales on partage ; le numérateur (en haut) dit combien de parts on prend.`,
      difficulty: 0.45,
    });
  }
  return make(ctx, 'fill_blank', `entier-${d}`, {
    sentence: `${frac(d, d)} = ___`,
    answer: '1',
    explication: `${frac(d, d)} (${fractionEnMots(d, d)}), ce sont toutes les parts : c’est le tout, donc ${frac(d, d)} = 1.`,
    difficulty: 0.5,
  });
};

const nonUnitQcm: ItemGen = (level, rng, ctx) => {
  const [n0, d] = fracNonUnit(level, rng);
  let n = n0;
  const forme = rng.int(0, 2);
  if (forme === 0)
    return mcq(ctx, rng, `lire-${n}-${d}`, {
      question: `Comment lit-on ${frac(n, d)} ?`,
      good: fractionEnMots(n, d),
      wrong: [
        fractionEnMots(n, rng.pick(DENOMS_CE1.filter((x) => x !== d))),
        fractionEnMots(n === 1 ? 2 : n - 1, d),
        (DENOMS_CE1 as readonly number[]).includes(n) && n !== d
          ? fractionEnMots(d, n)
          : fractionEnMots(n + 1, d),
      ],
      explication: `${frac(n, d)} se lit « ${fractionEnMots(n, d)} » : ${n} parts quand on partage en ${d}.`,
      difficulty: 0.3,
    });
  if (n > d) n = d - 1;
  if (n < 1) n = 1;
  if (forme === 1)
    return mcq(ctx, rng, `sens-${n}-${d}`, {
      question: `Dans ${frac(n, d)}, que veut dire le ${d} (le dénominateur) ?`,
      spoken: `Dans ${fractionEnMots(n, d)}, que veut dire le ${d}, le dénominateur ?`,
      good: `le tout est partagé en ${d} parts égales`,
      wrong: [`on a colorié ${d} parts`, `il y a ${d} pizzas`, `chaque part vaut ${d}`],
      explication: `Le dénominateur (en bas) dit en combien de parts égales on partage le tout.`,
      difficulty: 0.45,
    });
  const d2 = rng.pick(denomsNonUnit(level));
  return mcq(ctx, rng, `egal1-${d2}`, {
    question: 'Quelle fraction est égale à 1 (le tout) ?',
    good: frac(d2, d2),
    wrong: [frac(1, d2), frac(d2 - 1, d2), frac(2, d2)].filter((x) => x !== frac(d2, d2)),
    explication: `${frac(d2, d2)} : on prend les ${d2} parts sur ${d2}, c’est le tout entier.`,
    difficulty: 0.4,
  });
};

const nonUnitPaires: ItemGen = (level, rng, ctx) => {
  const vus = new Set<string>();
  const fr: [number, number][] = [];
  let guard = 0;
  while (fr.length < (level === 'facile' ? 3 : 4) && guard++ < 50) {
    const [n, d] = fracNonUnit(level, rng);
    const k = frac(n, d);
    if (vus.has(k)) continue;
    vus.add(k);
    fr.push([n, d]);
  }
  return paires(ctx, rng, fr, level === 'facile' ? 0.3 : 0.5);
};

/* ------------------------------------------------------------------ */
/* CE1.MA.FRAC.COMPARER                                                */
/* ------------------------------------------------------------------ */

type Fr = [number, number];
const val = ([n, d]: Fr) => n / d;
const cmp = (a: Fr, b: Fr) => a[0] * b[1] - b[0] * a[1];
const symb = (a: Fr, b: Fr) => (cmp(a, b) < 0 ? '<' : cmp(a, b) > 0 ? '>' : '=');

/** Paire à comparer : même dénominateur, numérateur 1, ou (plus loin) dénominateurs multiples. */
function paireFractions(level: Level, rng: Rng, egalOk = false): [Fr, Fr] {
  const forme = level === 'plus_loin' ? 2 : rng.int(0, 1);
  if (forme === 0) {
    const d = rng.pick(level === 'facile' ? [3, 4, 5, 6] : DENOMS_CE1.filter((x) => x > 2));
    const [a, b] = rng.shuffle(Array.from({ length: d }, (_, i) => i + 1)).slice(0, 2) as [number, number];
    return [
      [a, d],
      [b, d],
    ];
  }
  if (forme === 1) {
    const [a, b] = rng.shuffle(level === 'facile' ? [2, 3, 4] : DENOMS_CE1).slice(0, 2) as [number, number];
    return [
      [1, a],
      [1, b],
    ];
  }
  const couples: [Fr, Fr][] = [
    [
      [1, 2],
      [3, 4],
    ],
    [
      [1, 2],
      [3, 8],
    ],
    [
      [2, 3],
      [5, 6],
    ],
    [
      [3, 5],
      [7, 10],
    ],
    [
      [1, 4],
      [3, 8],
    ],
    [
      [1, 2],
      [2, 6],
    ],
    [
      [4, 5],
      [7, 10],
    ],
  ];
  if (egalOk)
    couples.push(
      [
        [1, 2],
        [2, 4],
      ],
      [
        [1, 2],
        [5, 10],
      ],
      [
        [3, 4],
        [6, 8],
      ],
      [
        [1, 3],
        [2, 6],
      ],
    );
  const [a, b] = rng.pick(couples);
  return rng.chance(0.5) ? [a, b] : [b, a];
}

function expliqueFractions(a: Fr, b: Fr): string {
  const s = symb(a, b);
  const fa = frac(...a);
  const fb = frac(...b);
  if (a[1] === b[1])
    return `Les parts sont de la même taille (des ${fractionEnMots(2, a[1]).split(' ')[1]}) : ${a[0]} part${a[0] > 1 ? 's' : ''} ${s === '<' ? 'c’est moins que' : 'c’est plus que'} ${b[0]}, donc ${fa} ${s} ${fb}.`;
  if (a[0] === 1 && b[0] === 1)
    return `Plus on partage le tout, plus les parts sont petites : ${fa} ${s} ${fb}.`;
  const grand = Math.max(a[1], b[1]);
  const conv = a[1] === grand ? b : a;
  const ec = frac((conv[0] * grand) / conv[1], grand);
  return `${frac(...conv)} = ${ec} : on compare des parts de même taille, donc ${fa} ${s} ${fb}.`;
}

const comparerVisuel: ItemGen = (level, rng, ctx) => {
  const [a, b] = paireFractions(level, rng);
  const shape = rng.pick(SHAPES);
  return make(ctx, 'visual_fraction', `comparer-${shape}-${frac(...a)}-${frac(...b)}`, {
    prompt: 'Quelle fraction est la plus grande ?',
    spoken: `Laquelle est la plus grande : ${fractionEnMots(...a)} ou ${fractionEnMots(...b)} ?`,
    numerator: a[0],
    denominator: a[1],
    shape,
    task: 'comparer',
    other: { numerator: b[0], denominator: b[1] },
    explication: expliqueFractions(a, b),
    difficulty: Math.abs(val(a) - val(b)) < 0.2 ? 0.6 : 0.35,
  });
};

const comparerQcm: ItemGen = (level, rng, ctx) => {
  if (level !== 'facile' && rng.chance(0.15)) {
    // Comparer à 1 : 5/5 = 1 ; 3/4 < 1
    const d = rng.pick(DENOMS_CE1);
    const n = rng.chance(0.5) ? d : rng.int(1, d - 1);
    const s = n === d ? '=' : '<';
    const gauche = frac(n, d);
    return mcq(ctx, rng, `un-${gauche}`, {
      question: `Compare : ${gauche} … 1`,
      spoken: `Compare ${fractionEnMots(n, d)} et 1.`,
      good: s,
      wrong: [],
      fixedOrder: ['<', '=', '>'],
      explication:
        n === d
          ? `${gauche} : on prend toutes les parts, c’est le tout, donc ${gauche} = 1.`
          : `${gauche} : il manque ${d - n} part${d - n > 1 ? 's' : ''} pour faire le tout, donc ${gauche} < 1.`,
      difficulty: 0.5,
      meta: { gauche, droite: '1' },
    });
  }
  const [a, b] = paireFractions(level, rng, true);
  const gauche = frac(...a);
  const droite = frac(...b);
  return mcq(ctx, rng, `cmp-${gauche}-${droite}`, {
    question: `Compare : ${gauche} … ${droite}`,
    spoken: `Compare ${fractionEnMots(...a)} et ${fractionEnMots(...b)}.`,
    good: symb(a, b),
    wrong: [],
    fixedOrder: ['<', '=', '>'],
    explication:
      symb(a, b) === '='
        ? `${gauche} et ${droite} représentent la même part du tout : ${gauche} = ${droite}.`
        : expliqueFractions(a, b),
    difficulty: a[1] === b[1] ? 0.35 : a[0] === 1 && b[0] === 1 ? 0.55 : 0.8,
    meta: { gauche, droite },
  });
};

const comparerRanger: ItemGen = (level, rng, ctx) => {
  let fr: Fr[];
  const forme = level === 'plus_loin' ? 2 : level === 'facile' ? 0 : rng.int(0, 1);
  if (forme === 0) {
    const d = rng.pick(level === 'facile' ? [4, 5, 6] : [5, 6, 8, 10]);
    const ns = rng.shuffle(Array.from({ length: d }, (_, i) => i + 1)).slice(0, level === 'facile' ? 3 : 4);
    fr = ns.map((n) => [n, d] as Fr);
  } else if (forme === 1) {
    fr = rng
      .shuffle(DENOMS_CE1)
      .slice(0, 4)
      .map((d) => [1, d] as Fr);
  } else {
    fr = rng.pick<Fr[]>([
      [
        [1, 2],
        [3, 4],
        [3, 8],
        [1, 8],
      ],
      [
        [1, 2],
        [1, 4],
        [5, 8],
        [7, 8],
      ],
      [
        [1, 5],
        [3, 10],
        [7, 10],
        [1, 2],
      ],
      [
        [1, 3],
        [5, 6],
        [1, 6],
        [2, 3],
      ],
    ]);
  }
  const sorted = [...fr].sort((x, y) => cmp(x, y));
  return make(ctx, 'ordering', `ranger-${sorted.map((f) => frac(...f)).join('-')}`, {
    prompt: 'Range ces fractions de la plus petite à la plus grande.',
    elements: sorted.map((f) => frac(...f)),
    mode: 'croissant',
    explication:
      forme === 0
        ? 'Avec le même dénominateur, les parts ont la même taille : celle qui a le plus de parts est la plus grande.'
        : forme === 1
          ? 'Avec un numérateur 1, plus le dénominateur est grand, plus la part est petite.'
          : 'On écrit toutes les fractions avec des parts de même taille, puis on compare les numérateurs.',
    difficulty: forme === 0 ? 0.35 : forme === 1 ? 0.6 : 0.85,
  });
};

const comparerVraiFaux: ItemGen = (level, rng, ctx) => {
  const [a, b] = paireFractions(level, rng);
  const montre = rng.chance(0.5) ? '<' : '>';
  const vrai = symb(a, b) === montre;
  const mots = montre === '<' ? 'est plus petit que' : 'est plus grand que';
  return make(ctx, 'true_false', `vf-${frac(...a)}-${montre}-${frac(...b)}`, {
    statement: rng.chance(0.5)
      ? `${frac(...a)} ${montre} ${frac(...b)}`
      : `${frac(...a)} ${mots} ${frac(...b)}.`,
    spoken: `${fractionEnMots(...a)} ${mots.replace(/ que$/, '')} ${que(fractionEnMots(...b))}.`,
    answer: vrai,
    explication: expliqueFractions(a, b),
    difficulty: a[1] === b[1] ? 0.35 : 0.6,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.FRAC.ADD — même dénominateur, compléter à 1                  */
/* ------------------------------------------------------------------ */

type Op = { termes: number[]; signes: ('+' | '−')[]; d: number; res: number; complement: boolean };

function operationFractions(level: Level, rng: Rng): Op {
  const d = rng.pick(level === 'facile' ? [3, 4, 5, 6] : DENOMS_CE1.filter((x) => x > 2));
  const forme = level === 'plus_loin' ? 3 : rng.int(0, 2);
  if (forme === 0) {
    const a = rng.int(1, d - 1);
    const b = rng.int(1, d - a);
    return { termes: [a, b], signes: ['+'], d, res: a + b, complement: false };
  }
  if (forme === 1) {
    const a = rng.int(2, d);
    const b = rng.int(1, a - 1);
    return { termes: [a, b], signes: ['−'], d, res: a - b, complement: false };
  }
  if (forme === 2) {
    const a = rng.int(1, d - 1);
    return { termes: [a], signes: [], d, res: d - a, complement: true };
  }
  // Plus loin : 3 termes
  const a = rng.int(1, d - 2);
  const b = rng.int(1, d - a - 1);
  const c = rng.int(1, d - a - b);
  return { termes: [a, b, c], signes: ['+', '+'], d, res: a + b + c, complement: false };
}

const ecrireOp = (o: Op, trou = '…') =>
  o.complement
    ? `${frac(o.termes[0]!, o.d)} + ${trou} = 1`
    : o.termes.map((t, i) => (i === 0 ? '' : ` ${o.signes[i - 1]} `) + frac(t, o.d)).join('') + ` = ${trou}`;

const motsOp = (o: Op) =>
  o.complement
    ? `${fractionEnMots(o.termes[0]!, o.d)} plus combien égale 1 ?`
    : o.termes
        .map(
          (t, i) => (i === 0 ? '' : o.signes[i - 1] === '+' ? ' plus ' : ' moins ') + fractionEnMots(t, o.d),
        )
        .join('') + ' égale combien ?';

function expliqueOp(o: Op): string {
  const nom = fractionEnMots(2, o.d).split(' ')[1]!;
  if (o.complement)
    return `Le tout, c’est ${frac(o.d, o.d)} : il manque ${o.d} − ${o.termes[0]} = ${o.res} ${nom}, donc ${frac(o.res, o.d)}.`;
  const calc = o.termes.map((t, i) => (i === 0 ? '' : ` ${o.signes[i - 1]} `) + t).join('');
  return `On compte les ${nom} : ${calc} = ${o.res}, donc ${frac(o.res, o.d)} (le dénominateur ne change pas).`;
}

const addNumeric: ItemGen = (level, rng, ctx) => {
  const o = operationFractions(level, rng);
  const prompt = o.complement ? `${frac(o.termes[0]!, o.d)} + …/${o.d} = 1` : ecrireOp(o, `…/${o.d}`);
  return numeric(ctx, `num-${prompt}`, {
    prompt,
    spoken: motsOp(o),
    answer: o.res,
    explication: expliqueOp(o),
    difficulty: o.complement ? 0.5 : o.termes.length > 2 ? 0.75 : o.signes[0] === '−' ? 0.45 : 0.3,
  });
};

const addVisuel: ItemGen = (level, rng, ctx) => {
  const o = operationFractions(level, rng);
  const shape = rng.pick(SHAPES);
  const prompt = o.complement
    ? `On a déjà pris ${frac(o.termes[0]!, o.d)} ${DE_LA[shape]}. Colorie la part qui reste.`
    : `Colorie ${ecrireOp(o, '').replace(/ = $/, '')} ${DE_LA[shape]}.`;
  return make(ctx, 'visual_fraction', `vis-${shape}-${prompt}`, {
    prompt,
    spoken: o.complement
      ? prompt.replace(frac(o.termes[0]!, o.d), fractionEnMots(o.termes[0]!, o.d))
      : `Colorie ${motsOp(o).replace(' égale combien ?', '')} ${DE_LA[shape]}.`,
    numerator: o.res,
    denominator: o.d,
    shape,
    task: 'colorier',
    explication: expliqueOp(o),
    difficulty: 0.3,
  });
};

const addQcm: ItemGen = (level, rng, ctx) => {
  const o = operationFractions(level, rng);
  if (o.complement) {
    const a = o.termes[0]!;
    const qui = rng.pick(['Lucie', 'Léo', 'Inès', 'Malo']);
    return mcq(ctx, rng, `compl-${a}-${o.d}`, {
      question: `${qui} a colorié ${frac(a, o.d)} d’une figure en bleu et le reste en rouge. Quelle fraction de la figure est en rouge ?`,
      good: frac(o.res, o.d),
      wrong: [
        frac(a, o.d),
        frac(o.res, 2 * o.d),
        frac(Math.max(1, o.res - 1), o.d),
        frac(Math.min(o.d, o.res + 1), o.d),
      ],
      explication: expliqueOp(o),
      difficulty: 0.55,
    });
  }
  const wrong = [
    frac(o.res, o.termes.length * o.d), // erreur classique : on ajoute aussi les dénominateurs
    frac(Math.max(1, o.res + 1), o.d),
    frac(Math.max(1, o.res - 1), o.d),
  ];
  if (o.signes[0] === '−') wrong.push(frac(o.termes[0]! + o.termes[1]!, o.d));
  return mcq(ctx, rng, `op-${ecrireOp(o)}`, {
    question: ecrireOp(o, '?'),
    spoken: motsOp(o),
    good: frac(o.res, o.d),
    wrong,
    explication: expliqueOp(o),
    difficulty: o.termes.length > 2 ? 0.75 : 0.45,
  });
};

const addTrou: ItemGen = (level, rng, ctx) => {
  const o = operationFractions(level, rng);
  const rep = o.res === o.d && !o.complement ? '1' : frac(o.res, o.d);
  const accepted = [frac(o.res, o.d), frac(o.res, o.d).replace('/', ' / ')].filter((x) => x !== rep);
  if (rep === '1') accepted.push(frac(o.d, o.d));
  const choices =
    level === 'facile'
      ? rng.shuffle(
          [
            ...new Set([rep, frac(o.res, 2 * o.d), frac(o.res + 1 > o.d ? o.res - 1 : o.res + 1, o.d)]),
          ].filter(Boolean),
        )
      : undefined;
  return make(ctx, 'fill_blank', `trou-${ecrireOp(o)}`, {
    sentence: ecrireOp(o, '___'),
    spoken: motsOp(o),
    answer: rep,
    accepted: accepted.length ? accepted : undefined,
    choices: choices && choices.includes(rep) ? choices : undefined,
    explication: expliqueOp(o) + (rep === '1' ? ` Et ${frac(o.d, o.d)} = 1.` : ''),
    difficulty: o.complement ? 0.55 : 0.4,
  });
};

const addLigne: ItemGen = (level, rng, ctx) => {
  let o = operationFractions(level, rng);
  while (o.complement || o.res === 0) o = operationFractions(level, rng);
  const display = ecrireOp(o, '').replace(/ = $/, '');
  return ligne(ctx, o.res, o.d, 0.5, display, expliqueOp(o));
};

export const FRACTIONS: Record<string, LessonContent> = {
  'CE1.MA.FRAC.UNITAIRE': {
    gens: {
      visual_fraction: unitVisuel,
      number_line: unitLigne,
      mcq: unitQcm,
      pairing: unitPaires,
      numeric_answer: unitNumeric,
    },
  },
  'CE1.MA.FRAC.NONUNIT': {
    gens: {
      visual_fraction: nonUnitVisuel,
      number_line: nonUnitLigne,
      fill_blank: nonUnitTrou,
      mcq: nonUnitQcm,
      pairing: nonUnitPaires,
    },
  },
  'CE1.MA.FRAC.COMPARER': {
    gens: {
      visual_fraction: comparerVisuel,
      mcq: comparerQcm,
      ordering: comparerRanger,
      true_false: comparerVraiFaux,
    },
  },
  'CE1.MA.FRAC.ADD': {
    gens: {
      numeric_answer: addNumeric,
      visual_fraction: addVisuel,
      mcq: addQcm,
      fill_blank: addTrou,
      number_line: addLigne,
    },
  },
};
