/**
 * CM2 — Les quatre opérations (BO n°16 du 17/04/2025, cycle 3, « Les quatre opérations ») :
 * estimer le résultat d'une opération, calculs avec une ou deux paires de parenthèses, multiplication
 * posée d'un décimal par un entier, divisions décimales (dividende entier ou décimal, diviseur à un chiffre)
 * et division euclidienne posée (CM1, entretenue). Pas de calculatrice personnelle au cours moyen.
 *
 * Conventions `meta` :
 * - `posee = { a, b, op: '×' | '÷' }` : opération à poser (Grand Huit) ; pour la division euclidienne,
 *   la réponse est le quotient et `reste` donne le reste ;
 * - `division = { a, b, quotient, reste, demande: 'reste' }` : item qui demande le reste (pas de `posee`,
 *   car la réponse n'est pas le résultat de l'opération) ;
 * - `estimation = { a, b, op, ra, rb }` : opération et nombres arrondis utilisés pour l'ordre de grandeur.
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, dire, fmt, make, mcq, nbDecimales, numeric, PERSOS, r3, vraiFaux } from './util';

type Op = '+' | '−' | '×' | '÷';

const appliquer = (a: number, op: Op, b: number) =>
  r3(op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);

const estEntier = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

/** Lecture orale d'un calcul avec parenthèses. */
function direCalcul(t: string): string {
  const MOTS: Record<string, string> = {
    '(': 'parenthèse ouvrante',
    ')': 'parenthèse fermante',
    '+': 'plus',
    '−': 'moins',
    '×': 'fois',
    '÷': 'divisé par',
  };
  const toks = t.match(/\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?|[()+−×÷]/g) ?? [];
  const par = (x?: string) => x === '(' || x === ')';
  // Une pause (virgule) autour de chaque parenthèse
  return toks
    .map((x) => MOTS[x] ?? dire(x))
    .reduce((acc, m, j) => (j === 0 ? m : `${acc}${par(toks[j]) || par(toks[j - 1]) ? ', ' : ' '}${m}`), '');
}

/* ================================================================== */
/* CM2.MA.OP.ESTIMER                                                   */
/* ================================================================== */

const NOM_UNITE: Record<number, string> = {
  1: 'à l’unité',
  10: 'à la dizaine',
  100: 'à la centaine',
  1000: 'au millier',
};

const arrondi = (x: number, u: number) => r3(Math.round(x / u) * u);

/** Tire un nombre dont l'arrondi à `u` n'est ni ambigu (pas de « …50 ») ni nul. */
function tirerLoin(rng: Rng, min: number, max: number, u: number, pas = 1): number {
  for (let i = 0; i < 200; i++) {
    const x = rng.int(min, max) * pas;
    const reste = r3(x % u);
    if (Math.abs(reste - u / 2) > u * 0.12 && reste !== 0 && arrondi(x, u) > 0) return r3(x);
  }
  return r3(min * pas + u * 0.2);
}

interface Estim {
  a: number;
  b: number;
  op: Op;
  ra: number;
  rb: number;
  /** Unités d'arrondi (0 = « nombre facile à diviser »). */
  ua: number;
  ub: number;
  exact: number;
  approx: number;
}

function estimation(level: Level, rng: Rng): Estim {
  const fin = (a: number, op: Op, b: number, ua: number, ub: number, ra?: number): Estim => {
    const rA = ra ?? arrondi(a, ua);
    const rB = arrondi(b, ub);
    return { a, b, op, ra: rA, rb: rB, ua, ub, exact: appliquer(a, op, b), approx: appliquer(rA, op, rB) };
  };
  for (let essai = 0; essai < 200; essai++) {
    const e = estimationBrute(level, rng, fin);
    // Les arrondis ne doivent pas trop s'accumuler (398 − 333 ≈ 400 − 300 = 100 : trop loin de 65)
    if (e && Math.abs(e.approx - e.exact) <= 0.25 * e.exact) return e;
  }
  return fin(487, '+', 312, 100, 100);
}

function estimationBrute(
  level: Level,
  rng: Rng,
  fin: (a: number, op: Op, b: number, ua: number, ub: number, ra?: number) => Estim,
): Estim | null {
  {
    if (level === 'facile') {
      const a = tirerLoin(rng, 120, 980, 100);
      const b = tirerLoin(rng, 110, 890, 100);
      if (rng.chance(0.5)) return fin(a, '+', b, 100, 100);
      if (arrondi(a, 100) > arrondi(b, 100) && a > b) return fin(a, '−', b, 100, 100);
      return null;
    }
    if (level === 'normal') {
      if (rng.chance(0.6)) {
        const a = tirerLoin(rng, 110, 990, 100);
        const b = tirerLoin(rng, 11, 94, 10);
        return fin(a, '×', b, 100, 10);
      }
      const a = tirerLoin(rng, 1100, 49000, 1000);
      const b = tirerLoin(rng, 1100, 49000, 1000);
      if (rng.chance(0.5)) return fin(a, '+', b, 1000, 1000);
      if (a > b && arrondi(a, 1000) > arrondi(b, 1000)) return fin(a, '−', b, 1000, 1000);
      return null;
    }
    const forme = rng.int(0, 2);
    if (forme === 0) {
      // Décimal × entier : 4,9 × 21 ≈ 5 × 20
      const a = tirerLoin(rng, 12, 98, 1, 0.1);
      const b = tirerLoin(rng, 11, 94, 10);
      return fin(a, '×', b, 1, 10);
    }
    if (forme === 1) {
      // Division : 2 412 ÷ 6 ≈ 2 400 ÷ 6 = 400
      const b = rng.int(3, 9);
      const q = rng.int(2, 9);
      const cible = q * b * 100;
      let off = rng.int(-40, 40);
      if (off === 0) off = 13;
      return fin(cible + off, '÷', b, 0, 1, cible);
    }
    const a = tirerLoin(rng, 1100, 9900, 1000);
    const b = tirerLoin(rng, 11, 94, 10);
    return fin(a, '×', b, 1000, 10);
  }
}

const exprEstim = (e: Estim) => `${fmt(e.a)} ${e.op} ${fmt(e.b)}`;

const explEstim = (e: Estim) =>
  e.op === '÷'
    ? `${fmt(e.a)} est proche de ${fmt(e.ra)}, et ${fmt(e.ra)} ÷ ${e.b} = ${fmt(e.approx)} : le résultat est proche de ${fmt(e.approx)}.`
    : `${fmt(e.a)} est proche de ${fmt(e.ra)} et ${fmt(e.b)} est proche de ${fmt(e.rb)}, donc le résultat est proche de ${fmt(e.ra)} ${e.op} ${fmt(e.rb)} = ${fmt(e.approx)}.`;

const metaEstim = (e: Estim) => ({ estimation: { a: e.a, b: e.b, op: e.op, ra: e.ra, rb: e.rb } });

const difEstim = (e: Estim, level: Level) =>
  clamp01(
    { facile: 0.2, normal: 0.45, plus_loin: 0.65 }[level] +
      (e.op === '×' ? 0.1 : 0) +
      (e.op === '÷' ? 0.15 : 0) +
      (nbDecimales(e.a) ? 0.1 : 0),
  );

const estimerQcm: ItemGen = (level, rng, ctx) => {
  const e = estimation(level, rng);
  const wrong = [e.approx * 10, e.approx / 10, e.approx * 100, e.approx / 100]
    .map(r3)
    .filter((x) => x >= Math.min(10, e.approx) && Number.isInteger(x) && x <= 999_999_999);
  return mcq(ctx, rng, `qcm-${exprEstim(e)}`, {
    question: `Sans poser l’opération, ${exprEstim(e)} est proche de…`,
    spoken: `Sans poser l’opération, ${dire(exprEstim(e))} est proche de combien ?`,
    good: fmt(e.approx),
    wrong: wrong.map((x) => fmt(x)),
    explication: explEstim(e),
    difficulty: difEstim(e, level),
    meta: metaEstim(e),
    max: level === 'facile' ? 3 : 4,
  });
};

const estimerNumeric: ItemGen = (level, rng, ctx) => {
  const e = estimation(level, rng);
  const prompt =
    e.op === '÷'
      ? `Remplace ${fmt(e.a)} par ${fmt(e.ra)}, puis calcule un ordre de grandeur de ${exprEstim(e)}.`
      : e.ua === e.ub
        ? `Arrondis ${fmt(e.a)} et ${fmt(e.b)} ${NOM_UNITE[e.ua]}, puis calcule un ordre de grandeur de ${exprEstim(e)}.`
        : `Arrondis ${fmt(e.a)} ${NOM_UNITE[e.ua]} et ${fmt(e.b)} ${NOM_UNITE[e.ub]}, puis calcule un ordre de grandeur de ${exprEstim(e)}.`;
  return numeric(ctx, `arrondi-${exprEstim(e)}`, {
    prompt,
    answer: e.approx,
    explication: explEstim(e),
    difficulty: difEstim(e, level),
    meta: metaEstim(e),
  });
};

/**
 * Affirmations de vraisemblance : [plausible, pas plausible, explication « environ »].
 * Facile : écarts énormes ; normal : erreurs d'un facteur 10 ; plus loin : erreurs d'unité.
 */
type Vrais = [string, string, string];
const VRAIS_FACILE: Vrais[] = [
  ['Une voiture mesure 4 m de long.', 'Une voiture mesure 400 m de long.', 'une voiture mesure environ 4 m'],
  [
    'Une porte mesure 2 m de haut.',
    'Une porte mesure 20 cm de haut.',
    'une porte mesure environ 2 m de haut',
  ],
  ['Une pomme pèse 150 g.', 'Une pomme pèse 15 kg.', 'une pomme pèse environ 150 g'],
  ['Un crayon mesure 15 cm.', 'Un crayon mesure 15 m.', 'un crayon mesure environ 15 cm'],
  ['Une récréation dure 15 min.', 'Une récréation dure 15 s.', 'une récréation dure environ 15 min'],
  [
    'Une nuit de sommeil dure 10 h.',
    'Une nuit de sommeil dure 10 min.',
    'une nuit de sommeil dure environ 10 h',
  ],
  [
    'Une salle de classe mesure 9 m de long.',
    'Une salle de classe mesure 9 km de long.',
    'une salle de classe mesure environ 9 m',
  ],
  ['Un timbre mesure 3 cm de large.', 'Un timbre mesure 3 m de large.', 'un timbre mesure environ 3 cm'],
];
const VRAIS_NORMAL: Vrais[] = [
  [
    'Une voiture mesure 4,5 m de long.',
    'Une voiture mesure 45 m de long.',
    'une voiture mesure environ 4,5 m',
  ],
  [
    'Une bouteille d’eau contient 1,5 L.',
    'Une bouteille d’eau contient 15 L.',
    'une bouteille d’eau contient environ 1,5 L',
  ],
  ['Un film dure 1 h 30 min.', 'Un film dure 15 h.', 'un film dure environ 1 h 30 min'],
  [
    'Une baignoire contient 150 L d’eau.',
    'Une baignoire contient 15 L d’eau.',
    'une baignoire contient environ 150 L',
  ],
  [
    'Paris et Marseille sont à environ 700 km.',
    'Paris et Marseille sont à environ 70 km.',
    'Paris et Marseille sont à environ 700 km',
  ],
  [
    'Une girafe mesure environ 5 m de haut.',
    'Une girafe mesure environ 50 m de haut.',
    'une girafe mesure environ 5 m',
  ],
  ['Un vélo pèse environ 12 kg.', 'Un vélo pèse environ 120 kg.', 'un vélo pèse environ 12 kg'],
  ['Un livre a environ 200 pages.', 'Un livre a environ 20 000 pages.', 'un livre a environ 200 pages'],
];
const VRAIS_PLUS_LOIN: Vrais[] = [
  ['Un éléphant pèse environ 5 t.', 'Un éléphant pèse environ 5 kg.', 'un éléphant pèse environ 5 tonnes'],
  [
    'Une cuillère à café contient 5 mL.',
    'Une cuillère à café contient 5 L.',
    'une cuillère à café contient environ 5 mL',
  ],
  [
    'Un marathon mesure environ 42 km.',
    'Un marathon mesure environ 42 m.',
    'un marathon mesure environ 42 km',
  ],
  [
    'Une feuille de papier pèse environ 5 g.',
    'Une feuille de papier pèse environ 5 kg.',
    'une feuille de papier pèse environ 5 g',
  ],
  [
    'Paris et New York sont à environ 6 000 km.',
    'Paris et New York sont à environ 800 km.',
    'Paris et New York sont à environ 6 000 km',
  ],
  ['Un verre contient environ 20 cL.', 'Un verre contient environ 20 L.', 'un verre contient environ 20 cL'],
  ['Une fourmi mesure environ 5 mm.', 'Une fourmi mesure environ 5 cm.', 'une fourmi mesure environ 5 mm'],
  [
    'La tour Eiffel mesure environ 330 m.',
    'La tour Eiffel mesure environ 33 km.',
    'la tour Eiffel mesure environ 330 m',
  ],
];
const vraisemblances = (level: Level) =>
  ({ facile: VRAIS_FACILE, normal: VRAIS_NORMAL, plus_loin: VRAIS_PLUS_LOIN })[level];

const estimerVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  if (rng.chance(0.5)) {
    const [ok, ko, expl] = rng.pick(vraisemblances(level));
    const phrase = juste ? ok : ko;
    return vraiFaux(ctx, `vrai-${phrase}`, {
      statement: `${phrase} Est-ce plausible ?`,
      answer: juste,
      explication: juste ? `Oui, c’est plausible : ${expl}.` : `Non, ce n’est pas plausible : ${expl}.`,
      difficulty: level === 'facile' ? 0.2 : 0.3,
    });
  }
  let e = estimation(level, rng);
  for (let i = 0; i < 20 && e.op === '÷'; i++) e = estimation(level, rng);
  if (e.op === '÷') e = estimation('normal', rng);
  const faux = e.exact >= 100 ? r3(Math.round(e.exact) / 10) : r3(e.exact * 10);
  const montre = juste ? e.exact : faux;
  const qui = rng.pick(PERSOS);
  return vraiFaux(ctx, `calc-${exprEstim(e)}-${montre}`, {
    statement: `${qui.nom} a posé ${exprEstim(e)} et a trouvé ${fmt(montre)}. Sans refaire le calcul, ce résultat est-il possible ?`,
    spoken: `${qui.nom} a posé ${dire(exprEstim(e))} et a trouvé ${dire(fmt(montre))}. Sans refaire le calcul, ce résultat est-il possible ?`,
    answer: juste,
    explication: `${explEstim(e)} ${juste ? `${fmt(montre)} est bien proche de ${fmt(e.approx)} : c’est possible.` : `${fmt(montre)} est très loin de ${fmt(e.approx)} : c’est impossible !`}`,
    difficulty: difEstim(e, level),
    meta: metaEstim(e),
  });
};

const estimerClasser: ItemGen = (level, rng, ctx) => {
  const n = { facile: 4, normal: 6, plus_loin: 8 }[level];
  const choisis = rng.shuffle(vraisemblances(level)).slice(0, n);
  const els = choisis.map(([ok, ko]) =>
    rng.chance(0.5) ? { label: ok, category: 0 } : { label: ko, category: 1 },
  );
  // Au moins un élément dans chaque catégorie
  if (els.every((e) => e.category === els[0]!.category)) {
    const [ok, ko] = choisis[0]!;
    els[0] = els[0]!.category === 0 ? { label: ko, category: 1 } : { label: ok, category: 0 };
  }
  return make(ctx, 'classification', `vrai-${els.map((e) => e.label).join('|')}`, {
    prompt: 'Ces mesures sont-elles plausibles ? Range chaque phrase.',
    categories: ['plausible', 'pas plausible'],
    elements: els,
    explication: `Je compare avec des mesures que je connais : ${choisis
      .slice(0, 3)
      .map((v) => v[2])
      .join(' ; ')}.`,
    difficulty: { facile: 0.25, normal: 0.4, plus_loin: 0.5 }[level],
  });
};

/* ================================================================== */
/* CM2.MA.OP.PARENTHESES                                               */
/* ================================================================== */

type E = number | { op: Op; l: E; r: E };
const N = (op: Op, l: E, r: E): E => ({ op, l, r });

const valeur = (e: E): number => (typeof e === 'number' ? e : appliquer(valeur(e.l), e.op, valeur(e.r)));
const prio = (op: Op) => (op === '+' || op === '−' ? 1 : 2);

/** Écriture : « complet » = parenthèses autour de chaque calcul intermédiaire ; « minimal » = seulement si nécessaire. */
function rendu(e: E, mode: 'complet' | 'minimal', parent?: { op: Op; droite: boolean }): string {
  if (typeof e === 'number') return fmt(e);
  const inner = `${rendu(e.l, mode, { op: e.op, droite: false })} ${e.op} ${rendu(e.r, mode, { op: e.op, droite: true })}`;
  if (!parent) return inner;
  if (mode === 'complet') return `(${inner})`;
  const besoin =
    prio(e.op) < prio(parent.op) ||
    (parent.droite && prio(e.op) === prio(parent.op) && (parent.op === '−' || parent.op === '÷'));
  return besoin ? `(${inner})` : inner;
}

/** Toutes les valeurs intermédiaires sont des entiers positifs ou nuls, raisonnables. */
function valide(e: E, max = 5000): boolean {
  if (typeof e === 'number') return true;
  const v = valeur(e);
  return valide(e.l, max) && valide(e.r, max) && v >= 0 && estEntier(v) && v <= max;
}

/** Étapes de calcul, dans l'ordre (les calculs les plus intérieurs d'abord). */
function etapes(e: E): string[] {
  if (typeof e === 'number') return [];
  return [
    ...etapes(e.l),
    ...etapes(e.r),
    `${fmt(valeur(e.l))} ${e.op} ${fmt(valeur(e.r))} = ${fmt(valeur(e))}`,
  ];
}

/** Erreur fréquente : calculer de gauche à droite sans tenir compte des parenthèses ni des priorités. */
function gaucheADroite(e: E): number | null {
  const toks: (number | Op)[] = [];
  const walk = (x: E) => {
    if (typeof x === 'number') toks.push(x);
    else {
      walk(x.l);
      toks.push(x.op);
      walk(x.r);
    }
  };
  walk(e);
  let v = toks[0] as number;
  for (let i = 1; i < toks.length; i += 2) v = appliquer(v, toks[i] as Op, toks[i + 1] as number);
  return v >= 0 && estEntier(v) ? v : null;
}

const MODE = (level: Level) => (level === 'plus_loin' ? 'minimal' : 'complet');

function expressionParentheses(level: Level, rng: Rng): E {
  const i = (a: number, b: number) => rng.int(a, b);
  for (let essai = 0; essai < 300; essai++) {
    let e: E;
    if (level === 'facile') {
      const t = rng.int(0, 5);
      if (t === 0) e = N('×', N('+', i(2, 30), i(2, 30)), i(2, 9));
      else if (t === 1) e = N('×', i(2, 9), N('+', i(2, 20), i(2, 20)));
      else if (t === 2) e = N('×', N('−', i(10, 40), i(2, 25)), i(2, 9));
      else if (t === 3) e = N('−', i(30, 99), N('+', i(2, 30), i(2, 30)));
      else if (t === 4) e = N('−', i(20, 99), N('−', i(10, 40), i(2, 9)));
      else {
        const c = i(2, 9);
        const s = c * i(2, 12);
        const a = i(1, s - 1);
        e = N('÷', N('+', a, s - a), c);
      }
    } else if (level === 'normal') {
      const t = rng.int(0, 5);
      if (t === 0) e = N('×', N('+', i(2, 40), i(2, 40)), N('−', i(5, 20), i(1, 9)));
      else if (t === 1) e = N('−', N('×', i(3, 12), i(3, 12)), N('+', i(2, 30), i(2, 30)));
      else if (t === 2) e = N('−', N('+', i(20, 90), i(10, 90)), N('−', i(20, 60), i(2, 19)));
      else if (t === 3) e = N('×', N('−', i(10, 50), i(2, 9)), N('+', i(2, 6), i(1, 5)));
      else if (t === 4) e = N('−', N('×', N('+', i(2, 20), i(2, 20)), i(2, 9)), i(2, 50));
      else {
        const c = i(2, 9);
        const s = c * i(2, 12);
        const a = i(1, s - 1);
        const d = i(2, 20);
        e = N('÷', N('+', a, s - a), N('−', c + d, d));
      }
    } else {
      const t = rng.int(0, 5);
      if (t === 0) e = N('+', i(2, 50), N('×', i(2, 12), i(2, 12)));
      else if (t === 1) e = N('+', N('×', i(2, 12), i(2, 12)), N('×', i(2, 12), i(2, 12)));
      else if (t === 2) e = N('−', i(40, 150), N('×', i(2, 9), i(2, 9)));
      else if (t === 3) e = N('−', N('+', i(2, 40), N('×', i(2, 12), i(2, 9))), i(2, 30));
      else if (t === 4) {
        const c = i(2, 9);
        e = N('+', i(2, 50), N('÷', c * i(2, 12), c));
      } else e = N('−', N('×', N('+', i(2, 15), i(2, 15)), i(2, 9)), i(2, 40));
    }
    const ltr = gaucheADroite(e);
    if (valide(e) && ltr !== valeur(e)) return e;
  }
  return N('×', N('+', 12, 8), 3);
}

function explParentheses(e: E, level: Level): string {
  const s = etapes(e);
  const fin = s.length > 1 ? `${s.slice(0, -1).join(' ; ')}, puis ${s[s.length - 1]}` : s[0]!;
  if (level !== 'plus_loin') return `On commence toujours par ce qui est entre parenthèses : ${fin}.`;
  return rendu(e, 'minimal').includes('(')
    ? `On fait d’abord les parenthèses, puis × et ÷, puis + et − : ${fin}.`
    : `On fait d’abord × et ÷, puis + et − : ${fin}.`;
}

const difPar = (level: Level) => ({ facile: 0.3, normal: 0.5, plus_loin: 0.7 })[level];

const parenthesesNumeric: ItemGen = (level, rng, ctx) => {
  const e = expressionParentheses(level, rng);
  const t = rendu(e, MODE(level));
  return numeric(ctx, `calc-${t}`, {
    prompt: t,
    spoken: `Calcule : ${direCalcul(t)}.`,
    answer: valeur(e),
    explication: explParentheses(e, level),
    difficulty: difPar(level),
  });
};

/** Toutes les façons de placer les parenthèses sur une suite nombres/opérations. */
function parenthesages(nums: number[], ops: Op[]): E[] {
  if (nums.length === 1) return [nums[0]!];
  const out: E[] = [];
  for (let k = 0; k < ops.length; k++)
    for (const l of parenthesages(nums.slice(0, k + 1), ops.slice(0, k)))
      for (const r of parenthesages(nums.slice(k + 1), ops.slice(k + 1))) out.push(N(ops[k]!, l, r));
  return out;
}

function aplatir(e: E): { nums: number[]; ops: Op[] } {
  if (typeof e === 'number') return { nums: [e], ops: [] };
  const l = aplatir(e.l);
  const r = aplatir(e.r);
  return { nums: [...l.nums, ...r.nums], ops: [...l.ops, e.op, ...r.ops] };
}

const parenthesesQcm: ItemGen = (level, rng, ctx) => {
  const e = expressionParentheses(level, rng);
  const mode = MODE(level);
  const t = rendu(e, mode);
  const v = valeur(e);
  if (rng.chance(0.5)) {
    const { nums, ops } = aplatir(e);
    const autres = parenthesages(nums, ops).filter((x) => valide(x, 100_000) && valeur(x) !== v);
    const textes = [...new Set(autres.map((x) => rendu(x, mode)))].filter((x) => x !== t);
    if (textes.length >= 1)
      return mcq(ctx, rng, `ou-${t}`, {
        question: `Quel calcul donne ${fmt(v)} ?`,
        good: t,
        wrong: textes,
        explication: explParentheses(e, level),
        difficulty: difPar(level) + 0.1,
        max: 3,
      });
  }
  const ltr = gaucheADroite(e);
  const max = level === 'facile' ? 3 : 4;
  const autres = rng.shuffle([v + 10, v + 1, v - 1, v * 2].filter((x) => x >= 0 && x !== v && x !== ltr));
  const wrong = ltr !== null && ltr !== v ? [ltr, ...autres.slice(0, max - 2)] : autres.slice(0, max - 1);
  return mcq(ctx, rng, `combien-${t}`, {
    question: `Combien vaut ${t} ?`,
    spoken: `Combien vaut ${direCalcul(t)} ?`,
    good: fmt(v),
    wrong: wrong.map((x) => fmt(x)),
    explication: explParentheses(e, level),
    difficulty: difPar(level),
    max,
  });
};

const parenthesesVraiFaux: ItemGen = (level, rng, ctx) => {
  const e = expressionParentheses(level, rng);
  const t = rendu(e, MODE(level));
  const v = valeur(e);
  const juste = rng.chance(0.5);
  const ltr = gaucheADroite(e);
  const faux = ltr !== null && ltr !== v ? ltr : v + 10;
  const montre = juste ? v : faux;
  return vraiFaux(ctx, `vf-${t}-${montre}`, {
    statement: `${t} = ${fmt(montre)}`,
    spoken: `${direCalcul(t)} égale ${dire(fmt(montre))}. Vrai ou faux ?`,
    answer: juste,
    explication: explParentheses(e, level),
    difficulty: difPar(level),
  });
};

const parenthesesPaires: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : 4;
  const pairs: { left: string; right: string }[] = [];
  for (let g = 0; pairs.length < n && g < 100; g++) {
    const e = expressionParentheses(level, rng);
    const left = rendu(e, MODE(level));
    const right = fmt(valeur(e));
    if (pairs.some((p) => p.left === left || p.right === right)) continue;
    pairs.push({ left, right });
  }
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque calcul à son résultat.',
    pairs,
    relation: 'calcul → résultat',
    explication:
      level === 'plus_loin'
        ? 'Sans parenthèses, on fait les multiplications et les divisions avant les additions et les soustractions.'
        : 'On commence toujours par calculer ce qui est entre parenthèses.',
    difficulty: difPar(level),
  });
};

/* ================================================================== */
/* CM2.MA.OP.MULT_DEC                                                  */
/* ================================================================== */

/** Facteur écrit sous forme `m / 10^d` (d = nombre de décimales), sans zéro final inutile. */
type Dec = { m: number; d: number };
const decVal = (x: Dec) => r3(x.m / 10 ** x.d);

function tirerDec(rng: Rng, d: number, min: number, max: number): Dec {
  for (let i = 0; i < 100; i++) {
    const m = rng.int(min, max);
    if (d === 0 || m % 10 !== 0) return { m, d };
  }
  return { m: min * 10 + 1, d };
}

function facteursMult(level: Level, rng: Rng): [Dec, Dec] {
  if (level === 'facile') {
    const d = rng.pick([1, 1, 2]);
    const a = d === 1 ? tirerDec(rng, 1, 11, 999) : tirerDec(rng, 2, 101, 2999);
    return [a, { m: rng.int(2, 9), d: 0 }];
  }
  if (level === 'normal') {
    const d = rng.pick([1, 2, 2, 3]);
    const a =
      d === 1
        ? tirerDec(rng, 1, 11, 999)
        : d === 2
          ? tirerDec(rng, 2, 101, 9999)
          : tirerDec(rng, 3, 1001, 9999);
    let b = rng.int(11, 99);
    if (b % 10 === 0) b += 1;
    return [a, { m: b, d: 0 }];
  }
  const [da, db] = rng.pick([
    [1, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ] as const);
  const a = da === 1 ? tirerDec(rng, 1, 11, 99) : tirerDec(rng, 2, 101, 999);
  const b = db === 1 ? tirerDec(rng, 1, 11, 59) : tirerDec(rng, 2, 101, 399);
  return [a, b];
}

const chiffresApres = (k: number) => `${k} chiffre${k > 1 ? 's' : ''} après la virgule`;

function explMult(a: Dec, b: Dec): string {
  const P = a.m * b.m;
  const k = a.d + b.d;
  const avecZeros = fmt(P / 10 ** k, k);
  const res = fmt(r3(P / 10 ** k));
  const qui = b.d
    ? `${fmt(decVal(a))} a ${chiffresApres(a.d)} et ${fmt(decVal(b))} en a ${b.d}, donc le résultat en a ${k}`
    : `${fmt(decVal(a))} a ${chiffresApres(a.d)}, donc le résultat aussi`;
  return `On multiplie sans s’occuper de la virgule : ${fmt(a.m)} × ${fmt(b.m)} = ${fmt(P)}. ${qui} : ${fmt(decVal(a))} × ${fmt(decVal(b))} = ${avecZeros}${avecZeros !== res ? ` = ${res}` : ''}.`;
}

const multTexte = (a: Dec, b: Dec) => `${fmt(decVal(a))} × ${fmt(decVal(b))}`;
const difMult = (level: Level, a: Dec, b: Dec) =>
  clamp01({ facile: 0.25, normal: 0.45, plus_loin: 0.65 }[level] + (a.d + b.d) * 0.05);

/** Résultats avec la virgule mal placée. */
function virgulesFausses(a: Dec, b: Dec): number[] {
  const P = a.m * b.m;
  const k = a.d + b.d;
  return [0, 1, 2, 3]
    .filter((j) => j !== k)
    .map((j) => r3(P / 10 ** j))
    .filter((x) => Math.abs(x * 10 ** 3 - Math.round(x * 10 ** 3)) < 1e-6 && x <= 999_999_999);
}

const multNumeric: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteursMult(level, rng);
  return numeric(ctx, `mult-${multTexte(a, b)}`, {
    prompt: multTexte(a, b),
    answer: decVal(a) * decVal(b),
    explication: explMult(a, b),
    difficulty: difMult(level, a, b),
    meta: { posee: { a: decVal(a), b: decVal(b), op: '×' } },
  });
};

const multQcm: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteursMult(level, rng);
  return mcq(ctx, rng, `mult-${multTexte(a, b)}`, {
    question: `Pose et calcule : ${multTexte(a, b)}`,
    spoken: `Pose et calcule ${dire(multTexte(a, b))}.`,
    good: fmt(r3(decVal(a) * decVal(b))),
    wrong: virgulesFausses(a, b).map((x) => fmt(x)),
    explication: explMult(a, b),
    difficulty: difMult(level, a, b),
  });
};

const multVraiFaux: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteursMult(level, rng);
  const v = r3(decVal(a) * decVal(b));
  const juste = rng.chance(0.5);
  const montre = juste ? v : rng.pick(virgulesFausses(a, b));
  const qui = rng.pick(PERSOS);
  return vraiFaux(ctx, `mult-${multTexte(a, b)}-${montre}`, {
    statement: `${qui.nom} a posé ${multTexte(a, b)} et a trouvé ${fmt(montre)}. C’est juste ?`,
    spoken: `${qui.nom} a posé ${dire(multTexte(a, b))} et a trouvé ${dire(fmt(montre))}. C’est juste ?`,
    answer: juste,
    explication: explMult(a, b),
    difficulty: difMult(level, a, b),
  });
};

const multTrou: ItemGen = (level, rng, ctx) => {
  const [a, b] = facteursMult(level, rng);
  const P = a.m * b.m;
  const v = fmt(r3(decVal(a) * decVal(b)));
  const choices = rng.shuffle([...new Set([0, 1, 2, 3].map((j) => fmt(r3(P / 10 ** j))))]);
  return make(ctx, 'fill_blank', `virgule-${multTexte(a, b)}`, {
    sentence: `${fmt(a.m)} × ${fmt(b.m)} = ${fmt(P)}, donc ${multTexte(a, b)} = ___`,
    spoken: `${dire(`${fmt(a.m)} × ${fmt(b.m)} = ${fmt(P)}`)}. Alors, combien font ${dire(multTexte(a, b))} ?`,
    answer: v,
    accepted: [String(r3(decVal(a) * decVal(b)))],
    choices: choices.includes(v) ? choices : [v, ...choices.slice(0, 3)],
    explication: explMult(a, b),
    difficulty: difMult(level, a, b),
  });
};

/* ================================================================== */
/* CM2.MA.OP.DIV                                                       */
/* ================================================================== */

type Div =
  | { type: 'euclid'; a: number; b: number; q: number; r: number }
  | { type: 'decimale'; a: number; b: number; q: number };

function euclid(a: number, b: number): Div {
  return { type: 'euclid', a, b, q: Math.floor(a / b), r: a % b };
}

/** Quotient exact au plus au millième ? */
const quotientExact = (a: number, b: number) => {
  const q = r3(a / b);
  return Math.abs(q * b - a) < 1e-6 ? q : null;
};

function division(level: Level, rng: Rng): Div {
  for (let essai = 0; essai < 300; essai++) {
    if (level === 'facile') {
      const b = rng.int(2, 9);
      const a = rng.int(20, 999);
      const d = euclid(a, b);
      if (d.type === 'euclid' && d.q >= 2 && (d.r > 0 || rng.chance(0.2))) return d;
      continue;
    }
    if (level === 'normal') {
      const f = rng.next();
      if (f < 0.25) {
        const b = rng.int(3, 9);
        const d = euclid(rng.int(1000, 9999), b);
        if (d.type === 'euclid' && d.r > 0) return d;
        continue;
      }
      if (f < 0.7) {
        // Dividende entier : 7 ÷ 4 = 1,75
        const b = rng.pick([2, 4, 5, 8]);
        const a = rng.int(5, 999);
        if (a % b === 0) continue;
        const q = quotientExact(a, b);
        if (q !== null) return { type: 'decimale', a, b, q };
        continue;
      }
      // Dividende décimal : 12,6 ÷ 3 = 4,2
      const b = rng.int(2, 9);
      const Q = rng.int(101, 4999);
      if (Q % 10 === 0 || (Q * b) % 100 === 0) continue;
      return { type: 'decimale', a: r3((Q * b) / 100), b, q: r3(Q / 100) };
    }
    if (rng.chance(0.6)) {
      let b = rng.int(11, 99);
      if (b % 10 === 0) b += 1;
      const d = euclid(rng.int(200, 9999), b);
      if (d.type === 'euclid' && d.q >= 2 && d.r > 0) return d;
      continue;
    }
    const b = rng.pick([12, 15, 16, 20, 24, 25, 40, 50]);
    const a = rng.int(30, 999);
    if (a % b === 0) continue;
    const q = quotientExact(a, b);
    if (q !== null) return { type: 'decimale', a, b, q };
  }
  return euclid(347, 6);
}

const divTexte = (d: Div) => `${fmt(d.a)} ÷ ${fmt(d.b)}`;
const egaliteEuclid = (a: number, b: number, q: number, r: number) =>
  `${fmt(a)} = (${fmt(b)} × ${fmt(q)}) + ${fmt(r)}`;

function explDiv(d: Div): string {
  if (d.type === 'euclid')
    return `On cherche combien de fois ${fmt(d.b)} dans ${fmt(d.a)} : ${fmt(d.b)} × ${fmt(d.q)} = ${fmt(d.b * d.q)} et il reste ${fmt(d.r)}, plus petit que ${fmt(d.b)}. Donc ${egaliteEuclid(d.a, d.b, d.q, d.r)}.`;
  return `Quand j’abaisse les dixièmes, j’écris la virgule au quotient ; s’il reste quelque chose, j’ajoute un 0 et je continue : ${divTexte(d)} = ${fmt(d.q)}, car ${fmt(d.b)} × ${fmt(d.q)} = ${fmt(d.a)}.`;
}

const difDiv = (d: Div, level: Level) =>
  clamp01({ facile: 0.25, normal: 0.5, plus_loin: 0.7 }[level] + (d.type === 'decimale' ? 0.1 : 0));

const divNumeric: ItemGen = (level, rng, ctx) => {
  const d = division(level, rng);
  if (d.type === 'decimale')
    return numeric(ctx, `div-${divTexte(d)}`, {
      prompt: divTexte(d),
      answer: d.q,
      explication: explDiv(d),
      difficulty: difDiv(d, level),
      meta: { posee: { a: d.a, b: d.b, op: '÷' }, decimale: true },
    });
  if (rng.chance(0.6))
    return numeric(ctx, `quotient-${divTexte(d)}`, {
      prompt: `${divTexte(d)} : quel est le quotient ?`,
      answer: d.q,
      explication: explDiv(d),
      difficulty: difDiv(d, level),
      meta: { posee: { a: d.a, b: d.b, op: '÷' }, reste: d.r },
    });
  return numeric(ctx, `reste-${divTexte(d)}`, {
    prompt: `${divTexte(d)} : quel est le reste ?`,
    answer: d.r,
    explication: explDiv(d),
    difficulty: difDiv(d, level) + 0.05,
    meta: { division: { a: d.a, b: d.b, quotient: d.q, reste: d.r, demande: 'reste' } },
  });
};

const divQcm: ItemGen = (level, rng, ctx) => {
  const d = division(level, rng);
  if (d.type === 'euclid')
    return mcq(ctx, rng, `egalite-${divTexte(d)}`, {
      question: `Quelle égalité correspond à la division euclidienne de ${fmt(d.a)} par ${fmt(d.b)} ?`,
      spoken: `Quelle égalité correspond à la division euclidienne de ${d.a} par ${d.b} ?`,
      good: egaliteEuclid(d.a, d.b, d.q, d.r),
      wrong: [
        egaliteEuclid(d.a, d.b, d.q - 1, d.r + d.b),
        egaliteEuclid(d.a, d.b, d.q, d.r + 1),
        egaliteEuclid(d.a, d.b, d.q + 1, d.r),
      ],
      explication: `${explDiv(d)} Le reste doit toujours être plus petit que le diviseur.`,
      difficulty: difDiv(d, level),
    });
  const euc = Number.isInteger(d.a) ? `${Math.floor(d.a / d.b)},${d.a % d.b}` : null;
  const wrong = [r3(d.q * 10), r3(d.q / 10), r3(d.q + 1)]
    .filter((x) => nbDecimales(x) <= 3 && Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-6)
    .map((x) => fmt(x));
  return mcq(ctx, rng, `div-${divTexte(d)}`, {
    question: `Pose et calcule : ${divTexte(d)}`,
    spoken: `Pose et calcule ${dire(divTexte(d))}.`,
    good: fmt(d.q),
    wrong: euc && euc !== fmt(d.q) ? [euc, ...rng.shuffle(wrong).slice(0, 2)] : wrong,
    explication: explDiv(d),
    difficulty: difDiv(d, level),
  });
};

const divVraiFaux: ItemGen = (level, rng, ctx) => {
  const d = division(level, rng);
  const juste = rng.chance(0.5);
  const qui = rng.pick(PERSOS);
  if (d.type === 'euclid') {
    const resteTropGrand = !juste && rng.chance(0.5);
    const [q, r] = juste ? [d.q, d.r] : resteTropGrand ? [d.q - 1, d.r + d.b] : [d.q, d.r + 1];
    const verif = `(${fmt(d.b)} × ${fmt(d.q)}) + ${fmt(d.r)} = ${fmt(d.a)}, et le reste ${fmt(d.r)} est plus petit que ${fmt(d.b)}`;
    return vraiFaux(ctx, `vf-${divTexte(d)}-${q}-${r}`, {
      statement: `Pour ${divTexte(d)}, ${qui.nom} trouve un quotient de ${fmt(q)} et un reste de ${fmt(r)}. C’est juste ?`,
      spoken: `Pour ${dire(divTexte(d))}, ${qui.nom} trouve un quotient de ${q} et un reste de ${r}. C’est juste ?`,
      answer: juste,
      explication: juste
        ? `Oui ! On vérifie : ${verif}.`
        : resteTropGrand
          ? `Presque ! (${fmt(d.b)} × ${fmt(q)}) + ${fmt(r)} fait bien ${fmt(d.a)}, mais le reste ${fmt(r)} est plus grand que ${fmt(d.b)} : on peut encore mettre ${fmt(d.b)} une fois. Quotient ${fmt(d.q)}, reste ${fmt(d.r)}.`
          : `Presque ! (${fmt(d.b)} × ${fmt(q)}) + ${fmt(r)} = ${fmt(d.b * q + r)}, pas ${fmt(d.a)}. Le bon résultat : quotient ${fmt(d.q)}, reste ${fmt(d.r)}.`,
      difficulty: difDiv(d, level),
    });
  }
  const faux = rng.pick(
    [r3(d.q / 10), r3(d.q * 10)].filter((x) => Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-6),
  );
  const montre = juste ? d.q : faux;
  return vraiFaux(ctx, `vf-${divTexte(d)}-${montre}`, {
    statement: `${divTexte(d)} = ${fmt(montre)}`,
    spoken: `${dire(divTexte(d))} égale ${dire(fmt(montre))}. Vrai ou faux ?`,
    answer: juste,
    explication: `${explDiv(d)} Pour vérifier, on multiplie le quotient par le diviseur.`,
    difficulty: difDiv(d, level),
  });
};

const divTrou: ItemGen = (level, rng, ctx) => {
  const d = division(level, rng);
  if (d.type === 'euclid')
    return make(ctx, 'fill_blank', `trou-${divTexte(d)}`, {
      sentence: `${fmt(d.a)} = (${fmt(d.b)} × ___) + ${fmt(d.r)}`,
      spoken: `${d.a} égale ${d.b} fois combien, plus ${d.r} ?`,
      answer: String(d.q),
      explication: explDiv(d),
      difficulty: difDiv(d, level),
    });
  return make(ctx, 'fill_blank', `trou-${divTexte(d)}`, {
    sentence: `${fmt(d.b)} × ___ = ${fmt(d.a)}`,
    spoken: `${dire(fmt(d.b))} fois combien égale ${dire(fmt(d.a))} ?`,
    answer: fmt(d.q),
    accepted: [String(d.q)],
    explication: `Chercher le nombre qui multiplié par ${fmt(d.b)} donne ${fmt(d.a)}, c’est calculer ${divTexte(d)} = ${fmt(d.q)}.`,
    difficulty: difDiv(d, level),
  });
};

/* ================================================================== */

export const OPERATIONS: Record<string, LessonContent> = {
  'CM2.MA.OP.ESTIMER': {
    gens: {
      mcq: estimerQcm,
      numeric_answer: estimerNumeric,
      true_false: estimerVraiFaux,
      classification: estimerClasser,
    },
  },
  'CM2.MA.OP.PARENTHESES': {
    gens: {
      numeric_answer: parenthesesNumeric,
      mcq: parenthesesQcm,
      true_false: parenthesesVraiFaux,
      pairing: parenthesesPaires,
    },
  },
  'CM2.MA.OP.MULT_DEC': {
    gens: { numeric_answer: multNumeric, mcq: multQcm, true_false: multVraiFaux, fill_blank: multTrou },
  },
  'CM2.MA.OP.DIV': {
    gens: { numeric_answer: divNumeric, mcq: divQcm, true_false: divVraiFaux, fill_blank: divTrou },
  },
};
