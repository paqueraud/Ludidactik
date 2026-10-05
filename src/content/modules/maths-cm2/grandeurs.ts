/**
 * CM2 — Grandeurs et mesures (BO n°16 du 17/04/2025, cycle 3, « Grandeurs et mesures ») :
 * longueurs, masses, contenances (conversions **par relations entre unités, sans tableau**),
 * périmètres (sans formule à mémoriser), aires (cm², dm², m², carré et rectangle), angles (lexique,
 * comparer, somme, multiple, moitié par pliage, angle droit = 90°, sans rapporteur, angles saillants),
 * horaires et durées (h, min, s).
 *
 * Conventions `meta` propres à ce domaine (en plus du GUIDE §6) :
 * - `meta.figure = { type: 'carre' | 'rectangle' | 'triangle' | 'polygone' | 'cercle', cotes: (number | null)[],
 *   unite, perimetre?, diametre?, rayon? }` : figure décrite par ses côtés (null = côté inconnu) ;
 * - `meta.quadrillage = { cols, rows, cells: [x, y][], demis?: [x, y, coin][] }` : figure sur quadrillage,
 *   chaque case vaut 1 unité d'aire ; `demis` = demi-carreaux (triangle dont l'angle droit est au coin
 *   'hg' | 'hd' | 'bg' | 'bd' de la case) ;
 * - `meta.rectangles = [longueur, largeur][]` : figure composée de rectangles accolés ;
 * - `meta.angles = number[]` (classification) : mesure en degrés de chaque angle à dessiner, alignée sur
 *   `elements` (jamais affichée).
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import {
  PERSOS,
  de,
  clamp01,
  comparaison,
  dire,
  fmt,
  make,
  mcq,
  nbDecimales,
  numeric,
  parNiv,
  r3,
  signe,
  vraiFaux,
} from './util';

/* ================================================================== */
/* Longueurs, masses, contenances                                      */
/* ================================================================== */

/** Valeur de chaque unité dans l'unité de base (mm, mg, mL). */
export const FACTEUR: Record<string, number> = {
  km: 1e6,
  hm: 1e5,
  dam: 1e4,
  m: 1e3,
  dm: 100,
  cm: 10,
  mm: 1,
  t: 1e9,
  kg: 1e6,
  g: 1e3,
  mg: 1,
  hL: 1e5,
  L: 1e3,
  dL: 100,
  cL: 10,
  mL: 1,
};
type Grandeur = 'longueur' | 'masse' | 'contenance';
const GRANDEUR: Record<string, Grandeur> = {
  km: 'longueur',
  hm: 'longueur',
  dam: 'longueur',
  m: 'longueur',
  dm: 'longueur',
  cm: 'longueur',
  mm: 'longueur',
  t: 'masse',
  kg: 'masse',
  g: 'masse',
  mg: 'masse',
  hL: 'contenance',
  L: 'contenance',
  dL: 'contenance',
  cL: 'contenance',
  mL: 'contenance',
};

/** Relation entre deux unités (la plus grande d'abord) : « 1 m = 100 cm ». */
const relation = (grande: string, petite: string) =>
  `1 ${grande} = ${fmt(FACTEUR[grande]! / FACTEUR[petite]!)} ${petite}`;

/** Paires d'unités [grande, petite] travaillées à chaque niveau. */
const PAIRES: Record<Level, [string, string][]> = {
  facile: [
    ['m', 'cm'],
    ['cm', 'mm'],
    ['km', 'm'],
    ['kg', 'g'],
    ['L', 'cL'],
    ['L', 'mL'],
  ],
  normal: [
    ['m', 'cm'],
    ['m', 'mm'],
    ['km', 'm'],
    ['m', 'dm'],
    ['dm', 'cm'],
    ['cm', 'mm'],
    ['kg', 'g'],
    ['g', 'mg'],
    ['t', 'kg'],
    ['L', 'cL'],
    ['L', 'mL'],
    ['L', 'dL'],
    ['cL', 'mL'],
  ],
  plus_loin: [
    ['dam', 'm'],
    ['hm', 'm'],
    ['km', 'cm'],
    ['hm', 'cm'],
    ['dam', 'dm'],
    ['hL', 'L'],
    ['hL', 'cL'],
    ['t', 'g'],
    ['kg', 'mg'],
    ['dL', 'mL'],
  ],
};

/** Une conversion juste : `val de = res vers`. */
interface Conv {
  grande: string;
  petite: string;
  ratio: number;
  de: string;
  vers: string;
  val: number;
  res: number;
}

function tirerConv(level: Level, rng: Rng): Conv {
  const [grande, petite] = rng.pick(PAIRES[level]);
  const ratio = FACTEUR[grande]! / FACTEUR[petite]!;
  const lr = Math.round(Math.log10(ratio));
  const max = level === 'facile' ? (ratio >= 1000 ? 9 : 25) : 60;
  if (rng.chance(0.5)) {
    // De la grande unité vers la petite : 3,5 m = 350 cm
    const d = parNiv(level, { facile: 0, normal: rng.int(1, 2), plus_loin: rng.int(1, 3) });
    let k = rng.int(1, max * 10 ** d);
    // Au niveau normal, une vraie écriture décimale (29 m = 2 900 cm est réservé au niveau facile)
    while (level === 'normal' && k % 10 === 0) k = rng.int(1, max * 10 ** d);
    return {
      grande,
      petite,
      ratio,
      de: grande,
      vers: petite,
      val: r3(k / 10 ** d),
      res: r3((k * ratio) / 10 ** d),
    };
  }
  // De la petite unité vers la grande : 1 250 g = 1,25 kg (au plus 3 décimales)
  const d = level === 'facile' ? 0 : rng.int(1, Math.min(lr, 3));
  let k = rng.int(level === 'facile' ? 1 : 2, max * 10 ** d);
  while (level === 'normal' && k % 10 === 0) k = rng.int(2, max * 10 ** d);
  return {
    grande,
    petite,
    ratio,
    de: petite,
    vers: grande,
    val: (k * ratio) / 10 ** d,
    res: r3(k / 10 ** d),
  };
}

const ecrit = (v: number, u: string) => `${fmt(v)} ${u}`;

function explConv(c: Conv): string {
  return c.de === c.grande
    ? `${relation(c.grande, c.petite)}, donc ${ecrit(c.val, c.de)} = ${fmt(c.val)} × ${fmt(c.ratio)} ${c.vers} = ${ecrit(c.res, c.vers)}.`
    : `${relation(c.grande, c.petite)}, donc ${ecrit(c.val, c.de)} = ${fmt(c.val)} ÷ ${fmt(c.ratio)} ${c.vers} = ${ecrit(c.res, c.vers)}.`;
}

const difConv = (c: Conv, level: Level) =>
  clamp01(
    0.2 +
      (c.de === c.petite ? 0.15 : 0) +
      nbDecimales(c.res) * 0.1 +
      nbDecimales(c.val) * 0.05 +
      (level === 'plus_loin' ? 0.15 : 0),
  );

/** Expressions complexes : 3 m 5 cm = 305 cm ; 2 km 50 m = 2,05 km. */
const COMPOSES: [string, string][] = [
  ['m', 'cm'],
  ['km', 'm'],
  ['kg', 'g'],
  ['t', 'kg'],
  ['L', 'cL'],
  ['m', 'mm'],
  ['L', 'mL'],
];

function compose(level: Level, rng: Rng) {
  const [a, b] = rng.pick(COMPOSES);
  const ratio = FACTEUR[a]! / FACTEUR[b]!;
  const x = rng.int(1, 9);
  // Piège du zéro : 3 m 5 cm = 305 cm (et non 35 cm)
  const y = rng.chance(0.4) ? rng.int(1, 9) : rng.int(10, ratio - 1);
  const versGrande = level === 'plus_loin';
  const enPetite = x * ratio + y;
  const p = `${x} ${a} ${fmt(y)} ${b} = … ${versGrande ? a : b}`;
  return versGrande
    ? {
        p,
        a: r3(x + y / ratio),
        u: a,
        e: `${relation(a, b)}, donc ${fmt(y)} ${b} = ${fmt(r3(y / ratio))} ${a} : ${x} ${a} ${fmt(y)} ${b} = ${fmt(r3(x + y / ratio))} ${a}.`,
        d: 0.8,
      }
    : {
        p,
        a: enPetite,
        u: b,
        e: `${relation(a, b)}, donc ${x} ${a} = ${fmt(x * ratio)} ${b}, et ${fmt(x * ratio)} + ${fmt(y)} = ${fmt(enPetite)} ${b}.`,
        d: y < 10 && ratio > 10 ? 0.65 : 0.5,
      };
}

const convNumeric: ItemGen = (level, rng, ctx) => {
  const pComp = parNiv(level, { facile: 0, normal: 0.2, plus_loin: 0.45 });
  if (rng.chance(pComp)) {
    const c = compose(level, rng);
    return numeric(ctx, `comp-${c.p}`, {
      prompt: c.p,
      spoken: dire(c.p),
      answer: c.a,
      unit: c.u,
      explication: c.e,
      difficulty: c.d,
    });
  }
  const c = tirerConv(level, rng);
  const p = `${ecrit(c.val, c.de)} = … ${c.vers}`;
  return numeric(ctx, `conv-${p}`, {
    prompt: p,
    spoken: dire(p),
    answer: c.res,
    unit: c.vers,
    explication: explConv(c),
    difficulty: difConv(c, level),
  });
};

/** Mesures vraisemblables (estimation, choix de l'unité). */
const ESTIMATIONS: { quoi: string; v: number; u: string; img: string; niv: Level }[] = [
  { quoi: 'la longueur d’une voiture', v: 4, u: 'm', img: '🚗', niv: 'facile' },
  { quoi: 'la hauteur d’une porte', v: 2, u: 'm', img: '🚪', niv: 'normal' },
  { quoi: 'la longueur d’un crayon neuf', v: 18, u: 'cm', img: '✏️', niv: 'facile' },
  { quoi: 'l’épaisseur d’une pièce de 1 euro', v: 2, u: 'mm', img: '🪙', niv: 'normal' },
  { quoi: 'la distance entre Paris et Lyon', v: 465, u: 'km', img: '🛣️', niv: 'normal' },
  { quoi: 'la longueur d’une fourmi', v: 5, u: 'mm', img: '🐜', niv: 'facile' },
  { quoi: 'la hauteur de la tour Eiffel', v: 330, u: 'm', img: '🗼', niv: 'normal' },
  { quoi: 'la longueur d’un terrain de football', v: 100, u: 'm', img: '⚽', niv: 'normal' },
  { quoi: 'la masse d’un éléphant', v: 5, u: 't', img: '🐘', niv: 'facile' },
  { quoi: 'la masse d’une pomme', v: 150, u: 'g', img: '🍎', niv: 'facile' },
  { quoi: 'la masse d’un vélo d’enfant', v: 10, u: 'kg', img: '🚲', niv: 'facile' },
  { quoi: 'la masse d’un cartable rempli', v: 4, u: 'kg', img: '🎒', niv: 'normal' },
  { quoi: 'la masse d’une plume', v: 50, u: 'mg', img: '🪶', niv: 'normal' },
  { quoi: 'la masse d’un camion chargé', v: 20, u: 't', img: '🚚', niv: 'normal' },
  { quoi: 'la contenance d’une baignoire', v: 150, u: 'L', img: '🛁', niv: 'facile' },
  { quoi: 'la contenance d’une cuillère à café', v: 5, u: 'mL', img: '🥄', niv: 'normal' },
  { quoi: 'la contenance d’une canette de jus de fruits', v: 33, u: 'cL', img: '🥤', niv: 'normal' },
  { quoi: 'la contenance d’un arrosoir', v: 10, u: 'L', img: '🪴', niv: 'normal' },
  { quoi: 'la contenance d’un verre d’eau', v: 20, u: 'cL', img: '🥛', niv: 'facile' },
];
const UNITES_USUELLES: Record<Grandeur, string[]> = {
  longueur: ['km', 'm', 'cm', 'mm'],
  masse: ['t', 'kg', 'g', 'mg'],
  contenance: ['L', 'cL', 'mL'],
};

/** Comparaison de deux mesures écrites dans deux unités différentes (avec pièges de virgule). */
function tirerComparaison(level: Level, rng: Rng) {
  const c = tirerConv(level, rng);
  const r = rng.next();
  let q = c.res;
  if (r < 0.3) q = c.res;
  else if (r < 0.5) q = r3(c.res * 10);
  else if (r < 0.7 && nbDecimales(c.res / 10) <= 3) q = r3(c.res / 10);
  else {
    const ordre = 10 ** Math.max(-2, Math.floor(Math.log10(c.res)) - 1);
    const delta = rng.pick([-1, 1]) * rng.int(1, 3) * ordre;
    if (c.res + delta > 0 && nbDecimales(c.res + delta) <= 3) q = r3(c.res + delta);
  }
  return { c, q, s: signe(c.res, q) };
}

const convQcm: ItemGen = (level, rng, ctx) => {
  if (level !== 'plus_loin' && rng.chance(level === 'facile' ? 0.6 : 0.4)) {
    const e = rng.pick(ESTIMATIONS.filter((x) => x.niv === level));
    const g = GRANDEUR[e.u]!;
    const good = `${fmt(e.v)} ${e.u}`;
    return mcq(ctx, rng, `estim-${e.quoi}`, {
      question: `${e.img} Quelle est la mesure la plus vraisemblable pour ${e.quoi} ?`,
      good,
      wrong: UNITES_USUELLES[g].filter((u) => u !== e.u).map((u) => `${fmt(e.v)} ${u}`),
      explication: `${e.quoi[0]!.toUpperCase()}${e.quoi.slice(1)} est d’environ ${good} : il faut choisir une unité adaptée à ce que l’on mesure.`,
      difficulty: level === 'facile' ? 0.25 : 0.35,
      max: level === 'facile' ? 3 : 4,
      meta: { grandeur: g },
    });
  }
  const { c, q, s } = tirerComparaison(level, rng);
  const gauche = ecrit(c.val, c.de);
  const droite = ecrit(q, c.vers);
  const echange = rng.chance(0.5);
  const [gV, dV] = echange ? [q, c.res] : [c.res, q];
  const sAff = signe(gV, dV);
  return comparaison(ctx, `cmp-${gauche}-${droite}-${echange}`, {
    gauche: echange ? droite : gauche,
    droite: echange ? gauche : droite,
    signe: sAff,
    explication: `${relation(c.grande, c.petite)}, donc ${gauche} = ${ecrit(c.res, c.vers)}. Dans la même unité : ${ecrit(gV, c.vers)} ${sAff} ${ecrit(dV, c.vers)}.`,
    difficulty: clamp01(difConv(c, level) + (s === '=' ? 0.1 : 0)),
  });
};

const convRanger: ItemGen = (level, rng, ctx) => {
  const [grande, petite] = rng.pick(PAIRES[level]);
  const ratio = FACTEUR[grande]! / FACTEUR[petite]!;
  const n = level === 'facile' ? 3 : 4;
  const pas = Math.max(1, ratio / (level === 'facile' ? 10 : 100));
  const centre = ratio * rng.int(1, 5);
  const lo = Math.max(1, Math.round((centre * 0.4) / pas));
  const hi = Math.round((centre * 2) / pas);
  const qs = new Set<number>();
  let guard = 0;
  while (qs.size < n && guard++ < 200) qs.add(rng.int(lo, hi) * pas);
  if (qs.size < n) for (let k = 1; qs.size < n; k++) qs.add(centre + k * pas);
  const valeurs = [...qs];
  if (level === 'facile' && !valeurs.some((q) => q % ratio === 0)) {
    // Au niveau facile, au moins une mesure entière dans la grande unité (2 L), aucune écriture décimale
    let q = ratio * rng.int(1, 4);
    while (valeurs.includes(q)) q += ratio;
    valeurs[0] = q;
  }
  const affiche = new Map<number, string>();
  // Au niveau facile, seules les mesures entières dans la grande unité y sont écrites
  const ecrivible = (q: number) => (level === 'facile' ? q % ratio === 0 : nbDecimales(q / ratio) <= 3);
  const premiere = valeurs.findIndex(ecrivible);
  const enGrandes = valeurs.map((q, i) => ecrivible(q) && (i === premiere || rng.chance(0.5)));
  // … et au moins une mesure reste dans la petite unité
  if (enGrandes.every(Boolean)) enGrandes[valeurs.length - 1] = false;
  valeurs.forEach((q, i) => affiche.set(q, enGrandes[i] ? ecrit(r3(q / ratio), grande) : ecrit(q, petite)));
  const decroissant = level !== 'facile' && rng.chance(0.3);
  const tries = [...valeurs].sort((a, b) => (decroissant ? b - a : a - b));
  const elements = tries.map((q) => affiche.get(q)!);
  return make(ctx, 'ordering', `ranger-${elements.join('|')}-${decroissant}`, {
    prompt: `Range ces mesures de la plus ${decroissant ? 'grande' : 'petite'} à la plus ${decroissant ? 'petite' : 'grande'}.`,
    elements,
    mode: decroissant ? 'decroissant' : 'croissant',
    explication: `On écrit tout dans la même unité (${relation(grande, petite)}) : ${tries
      .map((q) => ecrit(q, petite))
      .join(decroissant ? ' > ' : ' < ')}.`,
    difficulty: clamp01(0.3 + n * 0.05 + (level === 'plus_loin' ? 0.2 : 0)),
  });
};

const convVraiFaux: ItemGen = (level, rng, ctx) => {
  const c = tirerConv(level, rng);
  const juste = rng.chance(0.5);
  let montre = c.res;
  if (!juste) {
    const fausses = [r3(c.res * 10), nbDecimales(c.res / 10) <= 3 ? r3(c.res / 10) : r3(c.res * 100)].filter(
      (x) => x !== c.res,
    );
    montre = rng.pick(fausses);
  }
  const st = `${ecrit(c.val, c.de)} = ${ecrit(montre, c.vers)}`;
  return vraiFaux(ctx, `vf-${st}`, {
    statement: st,
    spoken: `${dire(st)}. Vrai ou faux ?`,
    answer: montre === c.res,
    explication: explConv(c),
    difficulty: difConv(c, level),
  });
};

/* ================================================================== */
/* Périmètres                                                          */
/* ================================================================== */

type Figure = {
  type: 'carre' | 'rectangle' | 'triangle' | 'polygone' | 'cercle';
  cotes: (number | null)[];
  unite: string;
  perimetre?: number;
  diametre?: number;
  rayon?: number;
};

/** Un problème de périmètre ou d'aire : énoncé, question, réponse, erreurs typiques. */
interface PbMesure {
  sig: string;
  debut: string;
  question: string;
  /** Début de l'affirmation (vrai/faux) : « Son périmètre mesure ». */
  quoi: string;
  answer: number;
  unit: string;
  explication: string;
  erreurs: number[];
  difficulty: number;
  meta: Record<string, unknown>;
}

const NOMS_POLY: Record<number, string> = { 3: 'triangle', 4: 'quadrilatère', 5: 'pentagone', 6: 'hexagone' };
const liste = (xs: string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}` : xs[0]!;
const somme = (xs: number[]) => r3(xs.reduce((s, x) => s + x, 0));

function pbPerimetre(level: Level, rng: Rng): PbMesure {
  const u = rng.pick(['cm', 'm']);
  const formes = parNiv(level, {
    facile: ['carre', 'rectangle'],
    normal: ['polygone', 'regulier', 'mixte', 'manque-rect', 'manque-carre', 'manque-tri'],
    plus_loin: ['cercle', 'cercle', 'manque-carre-dec', 'mixte-dec'],
  });
  const forme = rng.pick(formes);
  switch (forme) {
    case 'carre': {
      const a = rng.int(2, 15);
      return {
        sig: `carre-${a}-${u}`,
        debut: `Un carré a des côtés de ${a} ${u}.`,
        question: 'Quel est son périmètre ?',
        quoi: 'Son périmètre mesure',
        answer: 4 * a,
        unit: u,
        explication: `Le périmètre, c’est la longueur du tour : ${a} + ${a} + ${a} + ${a} = ${4 * a} ${u}, c’est 4 fois le côté.`,
        erreurs: [a * a, 2 * a, 3 * a],
        difficulty: 0.15,
        meta: { figure: { type: 'carre', cotes: [a, a, a, a], unite: u } satisfies Figure },
      };
    }
    case 'rectangle': {
      const L = rng.int(4, level === 'facile' ? 15 : 40);
      const l = rng.int(2, L - 1);
      return {
        sig: `rect-${L}-${l}-${u}`,
        debut: `Un rectangle mesure ${L} ${u} de long et ${l} ${u} de large.`,
        question: 'Quel est son périmètre ?',
        quoi: 'Son périmètre mesure',
        answer: 2 * (L + l),
        unit: u,
        explication: `On fait le tour du rectangle : ${L} + ${l} + ${L} + ${l} = ${2 * (L + l)} ${u}.`,
        erreurs: [L * l, L + l, 2 * L + l],
        difficulty: level === 'facile' ? 0.3 : 0.35,
        meta: { figure: { type: 'rectangle', cotes: [L, l, L, l], unite: u } satisfies Figure },
      };
    }
    case 'polygone': {
      const n = rng.int(3, 6);
      const cotes = Array.from({ length: n }, () => r3(rng.int(15, 95) / 10));
      const p = somme(cotes);
      return {
        sig: `poly-${cotes.join(';')}`,
        debut: `Les côtés d’un ${NOMS_POLY[n]} mesurent ${liste(cotes.map((c) => `${fmt(c)} cm`))}.`,
        question: 'Quel est son périmètre ?',
        quoi: 'Son périmètre mesure',
        answer: p,
        unit: 'cm',
        explication: `On additionne les longueurs de tous les côtés : ${cotes.map((c) => fmt(c)).join(' + ')} = ${fmt(p)} cm.`,
        erreurs: [r3(p - cotes[0]!), r3(p + cotes[1]!), r3(p + 1)],
        difficulty: 0.4 + n * 0.04,
        meta: { figure: { type: n === 3 ? 'triangle' : 'polygone', cotes, unite: 'cm' } satisfies Figure },
      };
    }
    case 'regulier': {
      const n = rng.int(5, 6);
      const c = r3(rng.int(12, 60) / 10);
      const p = r3(n * c);
      return {
        sig: `reg-${n}-${c}`,
        debut: `Un ${NOMS_POLY[n]} a ses ${n} côtés de la même longueur : ${fmt(c)} cm chacun.`,
        question: 'Quel est son périmètre ?',
        quoi: 'Son périmètre mesure',
        answer: p,
        unit: 'cm',
        explication: `Il y a ${n} côtés de ${fmt(c)} cm : ${n} × ${fmt(c)} = ${fmt(p)} cm.`,
        erreurs: [r3(4 * c), r3((n - 1) * c), r3(n + c)],
        difficulty: 0.45,
        meta: { figure: { type: 'polygone', cotes: Array<number>(n).fill(c), unite: 'cm' } satisfies Figure },
      };
    }
    case 'mixte': {
      const Lcm = rng.int(11, 35) * 10;
      const l = rng.int(15, 95);
      const p = 2 * (Lcm + l);
      const Lm = r3(Lcm / 100);
      return {
        sig: `mixte-${Lcm}-${l}`,
        debut: `Un rectangle mesure ${fmt(Lm)} m de long et ${l} cm de large.`,
        question: 'Quel est son périmètre, en centimètres ?',
        quoi: 'Son périmètre mesure',
        answer: p,
        unit: 'cm',
        explication: `On écrit tout en centimètres : ${fmt(Lm)} m = ${Lcm} cm car 1 m = 100 cm. Puis ${Lcm} + ${l} + ${Lcm} + ${l} = ${p} cm.`,
        erreurs: [r3(2 * (Lm + l)), Lcm + l, 2 * (Lcm / 10 + l)],
        difficulty: 0.6,
        meta: { figure: { type: 'rectangle', cotes: [Lcm, l, Lcm, l], unite: 'cm' } satisfies Figure },
      };
    }
    case 'mixte-dec': {
      let Lcm = rng.int(101, 399);
      while (Lcm % 10 === 0) Lcm = rng.int(101, 399);
      const lcm = rng.int(3, 9) * 10;
      const p = 2 * (Lcm + lcm);
      return {
        sig: `mixtedec-${Lcm}-${lcm}`,
        debut: `Un rectangle mesure ${fmt(Lcm / 100)} m de long et ${fmt(lcm / 100)} m de large.`,
        question: 'Quel est son périmètre, en centimètres ?',
        quoi: 'Son périmètre mesure',
        answer: p,
        unit: 'cm',
        explication: `1 m = 100 cm, donc ${fmt(Lcm / 100)} m = ${Lcm} cm et ${fmt(lcm / 100)} m = ${lcm} cm. Puis ${Lcm} + ${lcm} + ${Lcm} + ${lcm} = ${p} cm.`,
        erreurs: [r3(p / 100), Lcm + lcm, 2 * (Lcm + lcm / 10)],
        difficulty: 0.7,
        meta: { figure: { type: 'rectangle', cotes: [Lcm, lcm, Lcm, lcm], unite: 'cm' } satisfies Figure },
      };
    }
    case 'manque-rect': {
      const L = rng.int(6, 25);
      const l = rng.int(2, L - 1);
      const P = 2 * (L + l);
      return {
        sig: `mrect-${P}-${L}`,
        debut: `Le périmètre d’un rectangle est de ${P} ${u}. Sa longueur mesure ${L} ${u}.`,
        question: 'Combien mesure sa largeur ?',
        quoi: 'Sa largeur mesure',
        answer: l,
        unit: u,
        explication: `La longueur et la largeur font la moitié du tour : ${P} ÷ 2 = ${L + l} ${u}, puis ${L + l} − ${L} = ${l} ${u}.`,
        erreurs: [P - L, P / 2, P - 2 * L],
        difficulty: 0.65,
        meta: {
          figure: { type: 'rectangle', cotes: [L, null, L, null], unite: u, perimetre: P } satisfies Figure,
        },
      };
    }
    case 'manque-carre':
    case 'manque-carre-dec': {
      const a = forme === 'manque-carre' ? rng.int(3, 25) : (rng.int(5, 49) * 2 + 1) / 2;
      const P = r3(4 * a);
      return {
        sig: `mcarre-${P}`,
        debut: `Le périmètre d’un carré est de ${fmt(P)} ${u}.`,
        question: 'Combien mesure un de ses côtés ?',
        quoi: 'Un de ses côtés mesure',
        answer: a,
        unit: u,
        explication: `Les 4 côtés d’un carré ont la même longueur : ${fmt(P)} ÷ 4 = ${fmt(a)} ${u}.`,
        erreurs: [r3(P / 2), r3(P - 4), r3(a + 2)],
        difficulty: forme === 'manque-carre' ? 0.45 : 0.6,
        meta: {
          figure: { type: 'carre', cotes: [null, null, null, null], unite: u, perimetre: P } satisfies Figure,
        },
      };
    }
    case 'manque-tri': {
      let a = 0;
      let b = 0;
      let c = 0;
      do {
        a = rng.int(3, 15);
        b = rng.int(3, 15);
        c = rng.int(3, 15);
      } while (a + b <= c || a + c <= b || b + c <= a || a === b);
      const P = a + b + c;
      return {
        sig: `mtri-${P}-${a}-${b}`,
        debut: `Un triangle a un périmètre de ${P} ${u}. Deux de ses côtés mesurent ${a} ${u} et ${b} ${u}.`,
        question: 'Combien mesure le troisième côté ?',
        quoi: 'Le troisième côté mesure',
        answer: c,
        unit: u,
        explication: `Les deux côtés connus mesurent ${a} + ${b} = ${a + b} ${u} ; il reste ${P} − ${a + b} = ${c} ${u}.`,
        erreurs: [P - a, P - b, a + b].filter((x) => x > 0),
        difficulty: 0.55,
        meta: { figure: { type: 'triangle', cotes: [a, b, null], unite: u, perimetre: P } satisfies Figure },
      };
    }
    default: {
      // Cercle (6e) : périmètre ≈ 3,14 × diamètre
      const parRayon = rng.chance(0.4);
      const d = parRayon ? 2 * rng.int(1, 15) : rng.int(2, 30);
      const p = r3(3.14 * d);
      const r = d / 2;
      return {
        sig: `cercle-${parRayon ? 'r' : 'd'}-${d}-${u}`,
        debut: parRayon ? `Un cercle a un rayon de ${r} ${u}.` : `Un cercle a un diamètre de ${d} ${u}.`,
        question: 'Quelle est la longueur de son tour ? (Prends 3,14 × le diamètre.)',
        quoi: 'La longueur de son tour mesure environ',
        answer: p,
        unit: u,
        explication: parRayon
          ? `Le diamètre est le double du rayon : ${d} ${u}. Le tour d’un cercle mesure environ 3,14 fois son diamètre : 3,14 × ${d} = ${fmt(p)} ${u}.`
          : `Le tour d’un cercle mesure environ 3,14 fois son diamètre : 3,14 × ${d} = ${fmt(p)} ${u}.`,
        erreurs: [r3(3.14 * r), r3(3.14 * 2 * d), 3 * d, 4 * d],
        difficulty: parRayon ? 0.75 : 0.6,
        meta: {
          figure: {
            type: 'cercle',
            cotes: [],
            unite: u,
            ...(parRayon ? { rayon: r } : { diametre: d }),
          } satisfies Figure,
        },
      };
    }
  }
}

/** Énoncé complet (les conversions n'ont pas de « début »). */
const enonce = (p: PbMesure) => [p.debut, p.question].filter(Boolean).join(' ');

const mesureNumeric =
  (tirer: (level: Level, rng: Rng) => PbMesure): ItemGen =>
  (level, rng, ctx) => {
    const p = tirer(level, rng);
    return numeric(ctx, p.sig, {
      prompt: enonce(p),
      spoken: dire(enonce(p)),
      answer: p.answer,
      unit: p.unit,
      explication: p.explication,
      difficulty: p.difficulty,
      meta: Object.keys(p.meta).length ? p.meta : undefined,
    });
  };

const mesureQcm =
  (tirer: (level: Level, rng: Rng) => PbMesure): ItemGen =>
  (level, rng, ctx) => {
    const p = tirer(level, rng);
    const good = `${fmt(p.answer)} ${p.unit}`;
    return mcq(ctx, rng, `qcm-${p.sig}`, {
      question: enonce(p),
      spoken: dire(enonce(p)),
      good,
      wrong: p.erreurs.filter((x) => x > 0 && x !== p.answer).map((x) => `${fmt(x)} ${p.unit}`),
      explication: p.explication,
      difficulty: p.difficulty,
      max: level === 'facile' ? 3 : 4,
      meta: Object.keys(p.meta).length ? p.meta : undefined,
    });
  };

const mesureVraiFaux =
  (
    tirer: (level: Level, rng: Rng) => PbMesure,
    regles: (level: Level) => { s: string; v: boolean; e: string }[],
  ): ItemGen =>
  (level, rng, ctx) => {
    const juste = rng.chance(0.5);
    if (rng.chance(0.25)) {
      const r = rng.pick(regles(level).filter((x) => x.v === juste));
      return vraiFaux(ctx, `regle-${r.s}`, {
        statement: r.s,
        answer: r.v,
        explication: r.e,
        difficulty: 0.4,
      });
    }
    const p = tirer(level, rng);
    const fausses = p.erreurs.filter((x) => x > 0 && x !== p.answer);
    const montre = juste || !fausses.length ? p.answer : rng.pick(fausses);
    const st = `${[p.debut, p.quoi].filter(Boolean).join(' ')} ${fmt(montre)} ${p.unit}${p.debut ? '.' : ''}`;
    return vraiFaux(ctx, `vf-${p.sig}-${montre}`, {
      statement: st,
      spoken: `${dire(st)}${st.endsWith('.') ? '' : '.'} Vrai ou faux ?`,
      answer: montre === p.answer,
      explication: p.explication,
      difficulty: p.difficulty,
      meta: Object.keys(p.meta).length ? p.meta : undefined,
    });
  };

const reglesPerimetre = (level: Level) =>
  parNiv(level, {
    facile: [
      {
        s: 'Le périmètre d’un carré, c’est 4 fois la longueur de son côté.',
        v: true,
        e: 'Un carré a 4 côtés de même longueur : son tour mesure 4 fois le côté.',
      },
      {
        s: 'Le périmètre d’un rectangle, c’est sa longueur multipliée par sa largeur.',
        v: false,
        e: 'Le périmètre, c’est le tour : on additionne les 4 côtés (longueur + largeur + longueur + largeur).',
      },
    ],
    normal: [
      {
        s: 'Pour trouver le périmètre d’un polygone, on additionne les longueurs de tous ses côtés.',
        v: true,
        e: 'Le périmètre, c’est la longueur du tour de la figure.',
      },
      {
        s: 'Un rectangle de 1 m sur 50 cm a un périmètre de 1 + 50 + 1 + 50 = 102 cm.',
        v: false,
        e: 'Il faut d’abord écrire les longueurs dans la même unité : 1 m = 100 cm, donc 100 + 50 + 100 + 50 = 300 cm.',
      },
    ],
    plus_loin: [
      {
        s: 'Le tour d’un cercle mesure un peu plus de 3 fois son diamètre.',
        v: true,
        e: 'Le tour d’un cercle mesure environ 3,14 fois son diamètre, un peu plus de 3 fois.',
      },
      {
        s: 'Le tour d’un cercle mesure environ 3,14 fois son rayon.',
        v: false,
        e: 'C’est 3,14 fois le diamètre (le double du rayon).',
      },
    ],
  });

const perimetreQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'normal' && rng.chance(0.35)) {
    const L = rng.int(5, 30);
    const l = rng.int(2, L - 1);
    return mcq(ctx, rng, `calcul-${L}-${l}`, {
      question: `Quel calcul donne le périmètre d’un rectangle de ${L} cm de long et ${l} cm de large ?`,
      good: `${L} + ${l} + ${L} + ${l}`,
      wrong: [`${L} × ${l}`, `${L} + ${l}`, `4 × ${L}`, `${L} + ${L} + ${l}`],
      explication: `Le périmètre, c’est le tour : on additionne les 4 côtés, ${L} + ${l} + ${L} + ${l} = ${2 * (L + l)} cm.`,
      difficulty: 0.35,
    });
  }
  return mesureQcm(pbPerimetre)(level, rng, ctx);
};

/* ================================================================== */
/* Aires                                                               */
/* ================================================================== */

type Cell = [number, number];
const cellKey = (c: Cell) => `${c[0]},${c[1]}`;

/** Forme connexe aléatoire de k cases dans un quadrillage cols × rows. */
function formeConnexe(rng: Rng, k: number, cols: number, rows: number): Cell[] {
  const start: Cell = [rng.int(1, cols - 2), rng.int(1, rows - 2)];
  const cells: Cell[] = [start];
  const seen = new Set([cellKey(start)]);
  let guard = 0;
  while (cells.length < k && guard++ < 1000) {
    const [x, y] = rng.pick(cells);
    const [dx, dy] = rng.pick([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const);
    const c: Cell = [x + dx, y + dy];
    if (c[0] >= 0 && c[1] >= 0 && c[0] < cols && c[1] < rows && !seen.has(cellKey(c))) {
      seen.add(cellKey(c));
      cells.push(c);
    }
  }
  return cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** Périmètre (en côtés de carreau) d'une forme faite de carreaux entiers. */
export function perimetreForme(cells: Cell[]): number {
  const s = new Set(cells.map(cellKey));
  let p = 0;
  for (const [x, y] of cells)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      if (!s.has(`${x + dx},${y + dy}`)) p++;
  return p;
}

const AIRE_U: Record<string, number> = { 'm²': 1e6, 'dm²': 1e4, 'cm²': 100, 'mm²': 1 };

function pbAire(level: Level, rng: Rng): PbMesure {
  const formes = parNiv(level, {
    facile: ['quadrillage', 'quadrillage', 'rect-carreaux'],
    normal: ['rectangle', 'rectangle', 'carre', 'conversion', 'conversion', 'manque'],
    plus_loin: ['composee', 'decoupe', 'demis', 'conversion-m2', 'triangle'],
  });
  const forme = rng.pick(formes);
  const u = rng.pick(['cm', 'm']);
  switch (forme) {
    case 'quadrillage':
    case 'demis': {
      const [cols, rows] = [8, 6];
      const k = forme === 'quadrillage' ? rng.int(4, 12) : rng.int(5, 10);
      const cells = formeConnexe(rng, k, cols, rows);
      const demis: [number, number, string][] = [];
      if (forme === 'demis') {
        const occ = new Set(cells.map(cellKey));
        const voisins: Cell[] = [];
        for (const [x, y] of cells)
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            const c: Cell = [x + dx, y + dy];
            if (c[0] >= 0 && c[1] >= 0 && c[0] < cols && c[1] < rows && !occ.has(cellKey(c))) {
              occ.add(cellKey(c));
              voisins.push(c);
            }
          }
        for (const c of rng.shuffle(voisins).slice(0, rng.int(2, 4)))
          demis.push([c[0], c[1], rng.pick(['hg', 'hd', 'bg', 'bd'])]);
      }
      const aire = r3(cells.length + demis.length / 2);
      return {
        sig: `quad-${cells.map(cellKey).join(';')}-${demis.map((d) => d.join(',')).join(';')}`,
        debut: `Chaque carreau du quadrillage a une aire de 1 cm².${demis.length ? ' Deux demi-carreaux font un carreau.' : ''}`,
        question: 'Quelle est l’aire de la figure coloriée ?',
        quoi: 'L’aire de la figure coloriée est de',
        answer: aire,
        unit: 'cm²',
        explication: demis.length
          ? `On compte ${cells.length} carreaux entiers et ${demis.length} demi-carreaux (${fmt(demis.length / 2)} carreau${demis.length > 2 ? 'x' : ''}) : ${cells.length} + ${fmt(demis.length / 2)} = ${fmt(aire)} cm².`
          : `On compte les carreaux de la figure : il y en a ${cells.length}, donc l’aire est de ${cells.length} cm².`,
        erreurs: demis.length
          ? [cells.length + demis.length, cells.length, perimetreForme(cells)]
          : [perimetreForme(cells), cells.length + 1, cells.length - 1],
        difficulty: forme === 'quadrillage' ? 0.15 + k * 0.02 : 0.6,
        meta: { quadrillage: { cols, rows, cells, ...(demis.length ? { demis } : {}) } },
      };
    }
    case 'rect-carreaux': {
      const L = rng.int(3, 8);
      const l = rng.int(2, Math.min(5, L));
      const cells: Cell[] = [];
      for (let y = 0; y < l; y++) for (let x = 0; x < L; x++) cells.push([x + 1, y + 1]);
      return {
        sig: `rectq-${L}-${l}`,
        debut: `Un rectangle est dessiné sur un quadrillage : ${L} carreaux de long et ${l} carreaux de large. Chaque carreau a une aire de 1 cm².`,
        question: 'Quelle est l’aire du rectangle ?',
        quoi: 'L’aire du rectangle est de',
        answer: L * l,
        unit: 'cm²',
        explication: `Il y a ${l} rangées de ${L} carreaux : ${L} × ${l} = ${L * l} carreaux, donc ${L * l} cm².`,
        erreurs: [2 * (L + l), L + l, L * l + L],
        difficulty: 0.3,
        meta: { quadrillage: { cols: L + 2, rows: l + 2, cells } },
      };
    }
    case 'rectangle':
    case 'carre': {
      const L = rng.int(3, 25);
      const l = forme === 'carre' ? L : rng.int(2, L - 1);
      const A = L * l;
      const fig = forme === 'carre' ? 'Un carré a des côtés de' : 'Un rectangle mesure';
      return {
        sig: `${forme}-${L}-${l}-${u}`,
        debut: forme === 'carre' ? `${fig} ${L} ${u}.` : `${fig} ${L} ${u} de long et ${l} ${u} de large.`,
        question: 'Quelle est son aire ?',
        quoi: 'Son aire est de',
        answer: A,
        unit: `${u}²`,
        explication: `On peut le paver avec ${l} rangées de ${L} carrés de 1 ${u}² : ${L} × ${l} = ${A} ${u}².`,
        erreurs: [2 * (L + l), L + l, 4 * L],
        difficulty: forme === 'carre' ? 0.35 : 0.4,
        meta: { figure: { type: forme, cotes: [L, l, L, l], unite: u } satisfies Figure },
      };
    }
    case 'manque': {
      const L = rng.int(4, 12);
      const l = rng.int(2, L - 1);
      const A = L * l;
      return {
        sig: `manque-${A}-${L}-${u}`,
        debut: `Un rectangle a une aire de ${A} ${u}². Sa longueur mesure ${L} ${u}.`,
        question: 'Combien mesure sa largeur ?',
        quoi: 'Sa largeur mesure',
        answer: l,
        unit: u,
        explication: `On cherche combien de rangées de ${L} carrés de 1 ${u}² il faut pour faire ${A} ${u}² : ${L} × ${l} = ${A}, donc la largeur mesure ${l} ${u}.`,
        erreurs: [A - L, A / 2 - L, l + 1].filter((x) => x > 0 && Number.isInteger(x)),
        difficulty: 0.6,
        meta: { figure: { type: 'rectangle', cotes: [L, null, L, null], unite: u, aire: A } },
      };
    }
    case 'conversion':
    case 'conversion-m2': {
      const paires: [string, string][] =
        forme === 'conversion'
          ? [
              ['dm²', 'cm²'],
              ['m²', 'dm²'],
            ]
          : [['m²', 'cm²']];
      const [g, p] = rng.pick(paires);
      const ratio = AIRE_U[g]! / AIRE_U[p]!;
      const versPetite = rng.chance(0.5);
      const d = rng.int(0, 1);
      const k = rng.int(1, 9 * 10 ** d + (d ? 9 : 0));
      const grandeVal = r3(k / 10 ** d);
      const petiteVal = r3((k * ratio) / 10 ** d);
      const rel = `1 ${g} = ${fmt(ratio)} ${p}`;
      const pourquoi =
        g === 'dm²'
          ? ' (un carré de 1 dm de côté contient 10 × 10 carrés de 1 cm de côté)'
          : g === 'm²' && p === 'dm²'
            ? ' (un carré de 1 m de côté contient 10 × 10 carrés de 1 dm de côté)'
            : ' (un carré de 1 m de côté contient 100 × 100 carrés de 1 cm de côté)';
      const [de, val, vers, res] = versPetite ? [g, grandeVal, p, petiteVal] : [p, petiteVal, g, grandeVal];
      const fausses = versPetite ? [r3(val * 10), r3(val * 1000)] : [r3(val / 10), r3(val / 1000)];
      return {
        sig: `conv-${val}-${de}-${vers}`,
        debut: '',
        question: `${fmt(val)} ${de} = … ${vers}`,
        quoi: `${fmt(val)} ${de} =`,
        answer: res,
        unit: vers,
        explication: `${rel}${pourquoi}, donc ${fmt(val)} ${de} = ${fmt(res)} ${vers}.`,
        erreurs: fausses.filter((x) => nbDecimales(x) <= 3),
        difficulty: 0.45 + (versPetite ? 0 : 0.1) + d * 0.1 + (forme === 'conversion-m2' ? 0.15 : 0),
        meta: {},
      };
    }
    case 'composee': {
      const L1 = rng.int(4, 12);
      const l1 = rng.int(2, 6);
      const L2 = rng.int(2, 8);
      const l2 = rng.int(2, 6);
      const A = L1 * l1 + L2 * l2;
      return {
        sig: `comp-${L1}-${l1}-${L2}-${l2}-${u}`,
        debut: `Une figure est formée de deux rectangles accolés : l’un mesure ${L1} ${u} sur ${l1} ${u}, l’autre ${L2} ${u} sur ${l2} ${u}.`,
        question: 'Quelle est l’aire de la figure ?',
        quoi: 'L’aire de la figure est de',
        answer: A,
        unit: `${u}²`,
        explication: `On ajoute les aires des deux rectangles : ${L1} × ${l1} = ${L1 * l1} et ${L2} × ${l2} = ${L2 * l2}, donc ${L1 * l1} + ${L2 * l2} = ${A} ${u}².`,
        erreurs: [L1 * l1, (L1 + L2) * (l1 + l2), 2 * (L1 + l1 + L2 + l2)],
        difficulty: 0.65,
        meta: {
          rectangles: [
            [L1, l1],
            [L2, l2],
          ],
          unite: u,
        },
      };
    }
    case 'decoupe': {
      const L = rng.int(8, 15);
      const l = rng.int(5, 10);
      const c = rng.int(2, Math.min(4, l - 2));
      const A = L * l - c * c;
      return {
        sig: `decoupe-${L}-${l}-${c}-${u}`,
        debut: `Dans un rectangle de ${L} ${u} sur ${l} ${u}, on découpe un carré de ${c} ${u} de côté dans un coin.`,
        question: 'Quelle est l’aire de la figure qui reste ?',
        quoi: 'L’aire de la figure qui reste est de',
        answer: A,
        unit: `${u}²`,
        explication: `Aire du rectangle : ${L} × ${l} = ${L * l} ${u}² ; on enlève le carré : ${c} × ${c} = ${c * c} ${u}², donc ${L * l} − ${c * c} = ${A} ${u}².`,
        erreurs: [L * l, L * l - c, L * l - 4 * c],
        difficulty: 0.7,
        meta: { figure: { type: 'rectangle', cotes: [L, l, L, l], unite: u }, decoupe: c },
      };
    }
    default: {
      // Triangle rectangle = moitié d'un rectangle (6e)
      const a = rng.int(2, 12);
      const b = rng.int(2, 12);
      const A = r3((a * b) / 2);
      return {
        sig: `tri-${Math.max(a, b)}-${Math.min(a, b)}-${u}`,
        debut: `Les deux côtés de l’angle droit d’un triangle rectangle mesurent ${a} ${u} et ${b} ${u}.`,
        question: 'Quelle est son aire ?',
        quoi: 'Son aire est de',
        answer: A,
        unit: `${u}²`,
        explication: `Ce triangle est la moitié d’un rectangle de ${a} ${u} sur ${b} ${u} : ${a} × ${b} = ${a * b}, et ${a * b} ÷ 2 = ${fmt(A)} ${u}².`,
        erreurs: [a * b, a + b, 2 * (a + b)],
        difficulty: 0.75,
        meta: { figure: { type: 'triangle', cotes: [a, b, null], unite: u }, angleDroit: true },
      };
    }
  }
}

/** Mesures d'aire vraisemblables (le dm² n'est pas attendu au niveau facile). */
const AIRES_OBJETS: { quoi: string; v: number; u: string; img: string; pourquoi: string; niv: Level }[] = [
  {
    quoi: 'un timbre',
    v: 6,
    u: 'cm²',
    img: '✉️',
    pourquoi: 'Pour une petite surface comme un timbre, on utilise le cm².',
    niv: 'facile',
  },
  {
    quoi: 'le sol de la classe',
    v: 60,
    u: 'm²',
    img: '🏫',
    pourquoi: 'Pour une grande surface comme le sol de la classe, on utilise le m².',
    niv: 'facile',
  },
  {
    quoi: 'l’écran d’un téléphone',
    v: 80,
    u: 'cm²',
    img: '📱',
    pourquoi: 'Pour une petite surface comme un écran de téléphone, on utilise le cm².',
    niv: 'facile',
  },
  {
    quoi: 'un terrain de basket',
    v: 420,
    u: 'm²',
    img: '🏀',
    pourquoi: 'Pour une grande surface comme un terrain de sport, on utilise le m².',
    niv: 'facile',
  },
  {
    quoi: 'un set de table',
    v: 12,
    u: 'dm²',
    img: '🍽️',
    pourquoi:
      'Pour une surface moyenne comme un set de table, le dm² convient : 12 dm², c’est un rectangle d’environ 4 dm sur 3 dm.',
    niv: 'normal',
  },
  {
    quoi: 'une page de cahier',
    v: 4,
    u: 'dm²',
    img: '📓',
    pourquoi: 'Pour une surface moyenne comme une page de cahier, le dm² convient : environ 2 dm sur 2 dm.',
    niv: 'normal',
  },
  {
    quoi: 'une carte de bibliothèque',
    v: 46,
    u: 'cm²',
    img: '💳',
    pourquoi: 'Une carte de bibliothèque est petite : environ 8,5 cm sur 5,5 cm, soit 46 cm².',
    niv: 'normal',
  },
  {
    quoi: 'la porte de la classe',
    v: 2,
    u: 'm²',
    img: '🚪',
    pourquoi: 'Une porte mesure environ 2 m sur 1 m : son aire est d’environ 2 m².',
    niv: 'normal',
  },
];

const aireQcm: ItemGen = (level, rng, ctx) => {
  const r = rng.next();
  if (r < 0.3 && level !== 'plus_loin') {
    const o = rng.pick(AIRES_OBJETS.filter((x) => x.niv === level));
    const good = `${fmt(o.v)} ${o.u}`;
    return mcq(ctx, rng, `unite-${o.quoi}`, {
      question: `${o.img} Quelle est l’aire la plus vraisemblable pour ${o.quoi} ?`,
      good,
      wrong: (level === 'facile' ? ['cm²', 'm²'] : ['cm²', 'dm²', 'm²'])
        .filter((u) => u !== o.u)
        .map((u) => `${fmt(o.v)} ${u}`),
      explication: `L’aire ${de(o.quoi)} est d’environ ${good}. ${o.pourquoi}`,
      difficulty: level === 'facile' ? 0.3 : 0.45,
      max: 3,
    });
  }
  if (r < 0.65) {
    // Comparer les aires de deux rectangles (Crocodiles)
    if (level === 'facile') {
      const [L1, l1] = [rng.int(2, 8), rng.int(2, 6)];
      let [L2, l2] = [rng.int(2, 8), rng.int(2, 6)];
      if (rng.chance(0.3)) {
        // Même aire, formes différentes : 6 × 2 et 4 × 3
        const diviseurs = [2, 3, 4, 6, 8].filter((x) => (L1 * l1) % x === 0 && x !== L1 && x !== l1);
        if (diviseurs.length) {
          L2 = rng.pick(diviseurs);
          l2 = (L1 * l1) / L2;
        }
      }
      const g = `${L1} × ${l1} carreaux`;
      const d = `${L2} × ${l2} carreaux`;
      const s = signe(L1 * l1, L2 * l2);
      return comparaison(ctx, `cmpq-${g}-${d}`, {
        gauche: g,
        droite: d,
        signe: s,
        spokenGauche: `un rectangle de ${L1} carreaux sur ${l1}`,
        spokenDroite: `un rectangle de ${L2} carreaux sur ${l2}`,
        explication: `Le premier rectangle couvre ${L1} × ${l1} = ${L1 * l1} carreaux, le second ${L2} × ${l2} = ${L2 * l2} carreaux : ${L1 * l1} ${s} ${L2 * l2}.`,
        difficulty: s === '=' ? 0.45 : 0.3,
      });
    }
    const [g, pe] =
      level === 'normal'
        ? rng.pick([
            ['dm²', 'cm²'],
            ['m²', 'dm²'],
          ] as const)
        : (['m²', 'cm²'] as const);
    const ratio = AIRE_U[g]! / AIRE_U[pe]!;
    const k = rng.int(1, 9);
    const enPetite = k * ratio;
    const choix = rng.next();
    const q =
      choix < 0.3
        ? enPetite
        : choix < 0.6
          ? enPetite / 10
          : r3(enPetite + rng.pick([-1, 1]) * rng.int(1, 5) * (ratio / 10));
    const gauche = `${k} ${g}`;
    const droite = `${fmt(q)} ${pe}`;
    const s = signe(enPetite, q);
    return comparaison(ctx, `cmpu-${gauche}-${droite}`, {
      gauche,
      droite,
      signe: s,
      explication: `1 ${g} = ${fmt(ratio)} ${pe}, donc ${gauche} = ${fmt(enPetite)} ${pe}, et ${fmt(enPetite)} ${pe} ${s} ${droite}.`,
      difficulty: 0.5,
    });
  }
  return mesureQcm(pbAire)(level, rng, ctx);
};

const reglesAires = (level: Level) =>
  parNiv(level, {
    facile: [
      {
        s: 'Pour trouver l’aire d’une figure sur un quadrillage, on compte les carreaux qu’elle recouvre.',
        v: true,
        e: 'L’aire, c’est la place occupée par la surface : on compte les carreaux à l’intérieur.',
      },
      {
        s: 'Pour trouver l’aire d’une figure, on compte les côtés de carreaux sur son bord.',
        v: false,
        e: 'Compter le bord, c’est le périmètre ; pour l’aire, on compte les carreaux à l’intérieur.',
      },
    ],
    normal: [
      {
        s: 'Deux figures qui ont le même périmètre ont toujours la même aire.',
        v: false,
        e: 'Un rectangle de 6 cm sur 2 cm et un carré de 4 cm de côté ont le même périmètre (16 cm) mais pas la même aire (12 cm² et 16 cm²).',
      },
      {
        s: 'Deux figures de formes différentes peuvent avoir la même aire.',
        v: true,
        e: 'Un rectangle de 6 carreaux sur 2 et un rectangle de 4 carreaux sur 3 couvrent tous les deux 12 carreaux.',
      },
      {
        s: '1 dm² = 100 cm²',
        v: true,
        e: 'Un carré de 1 dm de côté contient 10 rangées de 10 carrés de 1 cm de côté : 100 cm².',
      },
      {
        s: '1 m² = 10 dm²',
        v: false,
        e: 'Un carré de 1 m de côté contient 10 × 10 = 100 carrés de 1 dm de côté : 1 m² = 100 dm².',
      },
    ],
    plus_loin: [
      {
        s: '1 m² = 10 000 cm²',
        v: true,
        e: 'Un carré de 1 m de côté contient 100 rangées de 100 carrés de 1 cm de côté : 10 000 cm².',
      },
      {
        s: '1 m² = 1 000 cm²',
        v: false,
        e: '1 m² = 100 dm² et 1 dm² = 100 cm², donc 1 m² = 10 000 cm².',
      },
      {
        s: 'Un triangle rectangle a la moitié de l’aire du rectangle qui a les mêmes côtés de l’angle droit.',
        v: true,
        e: 'En coupant un rectangle par une diagonale, on obtient deux triangles rectangles pareils.',
      },
    ],
  });

/* ================================================================== */
/* Angles                                                              */
/* ================================================================== */

const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

export const natureAngle = (x: number) => (x < 90 ? 'aigu' : x === 90 ? 'droit' : x < 180 ? 'obtus' : 'plat');

function mesureDe(nature: string, level: Level, rng: Rng): number {
  if (nature === 'droit') return 90;
  if (nature === 'plat') return 180;
  if (nature === 'aigu')
    return parNiv(level, { facile: rng.int(4, 12), normal: rng.int(3, 16), plus_loin: rng.int(3, 16) }) * 5;
  return parNiv(level, { facile: rng.int(24, 32), normal: rng.int(20, 33), plus_loin: rng.int(20, 34) }) * 5;
}

const anglesClasser: ItemGen = (level, rng, ctx) => {
  const categories = level === 'plus_loin' ? ['aigu', 'droit', 'obtus', 'plat'] : ['aigu', 'droit', 'obtus'];
  const n = parNiv(level, { facile: 4, normal: 6, plus_loin: 7 });
  const natures = [
    ...categories,
    ...Array.from({ length: n - categories.length }, () => rng.pick(categories)),
  ];
  const melange = rng.shuffle(natures);
  const lettres = rng.shuffle(LETTRES).slice(0, n);
  const mesures = melange.map((nat) => mesureDe(nat, level, rng));
  const elements = melange.map((nat, i) => ({
    label: `angle de sommet ${lettres[i]}`,
    category: categories.indexOf(nat),
  }));
  return make(ctx, 'classification', `angles-${mesures.join(';')}-${lettres.join('')}`, {
    prompt:
      level === 'plus_loin'
        ? 'Range chaque angle : est-il aigu, droit, obtus ou plat ? Vérifie les angles droits avec ton équerre.'
        : 'Range chaque angle : est-il aigu, droit ou obtus ? Vérifie les angles droits avec ton équerre.',
    categories,
    elements,
    explication:
      level === 'plus_loin'
        ? 'Plus petit qu’un angle droit : aigu ; exactement un angle droit (90°) : droit ; plus grand : obtus ; deux angles droits côte à côte (180°) : plat.'
        : 'On compare chaque angle à l’angle droit de l’équerre : plus petit, il est aigu ; plus grand, il est obtus.',
    difficulty: clamp01(
      0.25 + n * 0.04 + mesures.filter((x) => Math.abs(x - 90) <= 20 && x !== 90).length * 0.05,
    ),
    meta: { angles: mesures },
  });
};

/** Angle formé par les aiguilles d'une horloge à une heure pile (en degrés, ≤ 180). */
const angleHorloge = (h: number) => Math.min((h % 12) * 30, 360 - (h % 12) * 30);

type Q = { q: string; good: string; wrong: string[]; e: string; d: number; sig: string };

function questionsAngles(level: Level, rng: Rng): Q[] {
  if (level === 'facile') {
    const h = rng.pick([1, 2, 3, 4, 5, 7, 8, 9, 10, 11]);
    const a = angleHorloge(h);
    return [
      {
        sig: 'sommet',
        q: 'Comment s’appelle le point où se rejoignent les deux côtés d’un angle ?',
        good: 'le sommet',
        wrong: ['le centre', 'le milieu', 'le côté'],
        e: 'Un angle a un sommet et deux côtés qui partent de ce sommet.',
        d: 0.2,
      },
      {
        sig: 'petit',
        q: 'Un angle plus petit qu’un angle droit est…',
        good: 'aigu',
        wrong: ['obtus', 'droit'],
        e: 'Un angle aigu est plus petit qu’un angle droit ; un angle obtus est plus grand.',
        d: 0.2,
      },
      {
        sig: 'grand',
        q: 'Un angle plus grand qu’un angle droit (mais plus petit que deux angles droits) est…',
        good: 'obtus',
        wrong: ['aigu', 'droit'],
        e: 'Un angle obtus est plus grand qu’un angle droit ; un angle aigu est plus petit.',
        d: 0.25,
      },
      {
        sig: `horloge-${h}`,
        q: `🕐 À ${h} h pile, les deux aiguilles d’une horloge forment un angle…`,
        good: natureAngle(a),
        wrong: ['aigu', 'droit', 'obtus'],
        e:
          a === 90
            ? `À ${h} h, les aiguilles forment un angle droit, comme le coin d’une feuille.`
            : `À ${h} h, l’angle entre les aiguilles est ${a < 90 ? 'plus petit' : 'plus grand'} qu’un angle droit : il est ${natureAngle(a)}.`,
        d: 0.35,
      },
      {
        sig: 'equerre',
        q: 'Quel instrument permet de vérifier qu’un angle est droit ?',
        good: 'l’équerre',
        wrong: ['le compas', 'la règle graduée'],
        e: 'On place le coin de l’équerre sur le sommet de l’angle : s’il colle exactement, l’angle est droit.',
        d: 0.15,
      },
    ];
  }
  if (level === 'normal') {
    const x = rng.pick([20, 30, 40, 50, 60, 75, 80, 100, 110, 120, 135, 150, 160, 170]);
    const mesures: [string, number][] = [
      ['un angle droit', 90],
      ['la moitié d’un angle droit', 45],
      ...[rng.pick([30, 60, 80]), rng.pick([100, 120, 150])].map(
        (v) => [`un angle de ${v}°`, v] as [string, number],
      ),
    ];
    const trois = rng.shuffle(mesures).slice(0, 3);
    const plusGrand = trois.reduce((m, c) => (c[1] > m[1] ? c : m));
    return [
      {
        sig: 'droit90',
        q: 'Combien mesure un angle droit ?',
        good: '90°',
        wrong: ['100°', '180°', '45°', '60°'],
        e: 'Un angle droit mesure 90 degrés (90°).',
        d: 0.3,
      },
      {
        sig: 'moitie45',
        q: 'On plie un angle droit en deux, bord contre bord. Combien mesure chaque moitié ?',
        good: '45°',
        wrong: ['90°', '50°', '30°', '180°'],
        e: 'La moitié d’un angle droit mesure 90 ÷ 2 = 45°.',
        d: 0.4,
      },
      {
        sig: `nature-${x}`,
        q: `Un angle de ${x}° est…`,
        good: natureAngle(x),
        wrong: ['aigu', 'droit', 'obtus'],
        e: `${x}° est ${x < 90 ? 'moins' : 'plus'} que 90°, la mesure de l’angle droit : l’angle est ${natureAngle(x)}.`,
        d: 0.35,
      },
      {
        sig: `plusgrand-${trois.map((t) => t[0]).join('|')}`,
        q: 'Quel est le plus grand de ces angles ?',
        good: plusGrand[0],
        wrong: trois.filter((t) => t !== plusGrand).map((t) => t[0]),
        e: `Un angle droit mesure 90°, sa moitié 45° : ${plusGrand[0]}${plusGrand[0].includes('°') ? '' : ` (${plusGrand[1]}°)`} est le plus grand.`,
        d: 0.5,
      },
      {
        sig: 'deux45',
        q: 'On place côte à côte deux angles de 45°. On obtient…',
        good: 'un angle droit',
        wrong: ['un angle aigu', 'un angle obtus', 'un angle de 45°'],
        e: '45° + 45° = 90° : c’est un angle droit.',
        d: 0.45,
      },
    ];
  }
  return [
    {
      sig: 'plat',
      q: 'Deux angles droits placés côte à côte forment un angle plat. Combien mesure-t-il ?',
      good: '180°',
      wrong: ['90°', '360°', '100°', '200°'],
      e: 'Deux angles droits : 90° + 90° = 180°. On l’appelle angle plat.',
      d: 0.55,
    },
    {
      sig: 'tiers',
      q: 'On partage un angle droit en 3 angles égaux. Combien mesure chacun ?',
      good: '30°',
      wrong: ['45°', '33°', '60°', '20°'],
      e: '90 ÷ 3 = 30 : chaque angle mesure 30°.',
      d: 0.6,
    },
    {
      sig: 'equilateral',
      q: 'Au collège, on apprend que les 3 angles d’un triangle font 180° en tout. Dans un triangle équilatéral, ils sont égaux : combien mesure chacun ?',
      good: '60°',
      wrong: ['90°', '45°', '30°', '120°'],
      e: '180 ÷ 3 = 60 : chaque angle d’un triangle équilatéral mesure 60°.',
      d: 0.7,
    },
    {
      sig: '135',
      q: 'Quel angle mesure 135° ?',
      good: 'un angle droit plus sa moitié',
      wrong: [
        'deux angles droits',
        'la moitié d’un angle droit',
        'un angle droit plus un tiers d’angle droit',
      ],
      e: '90° + 45° = 135°.',
      d: 0.6,
    },
    {
      sig: 'quart-plat',
      q: 'Combien mesure le quart d’un angle plat (180°) ?',
      good: '45°',
      wrong: ['60°', '90°', '30°', '40°'],
      e: '180 ÷ 4 = 45 : le quart d’un angle plat mesure 45°, la moitié d’un angle droit.',
      d: 0.65,
    },
    {
      sig: 'trente',
      q: 'Combien d’angles de 30° faut-il placer côte à côte pour obtenir un angle droit ?',
      good: '3',
      wrong: ['2', '4', '6', '9'],
      e: '30° + 30° + 30° = 90° : il en faut 3.',
      d: 0.6,
    },
    {
      sig: 'droit-plus-30',
      q: 'Un angle droit et un angle de 30° placés côte à côte forment…',
      good: 'un angle obtus de 120°',
      wrong: ['un angle aigu de 60°', 'un angle droit', 'un angle plat de 180°'],
      e: '90° + 30° = 120°, c’est plus qu’un angle droit : l’angle est obtus.',
      d: 0.6,
    },
  ];
}

const anglesQcm: ItemGen = (level, rng, ctx) => {
  const q = rng.pick(questionsAngles(level, rng));
  return mcq(ctx, rng, q.sig, {
    question: q.q,
    spoken: q.q.replace(/(\d+)°/g, '$1 degrés').replace('🕐 ', ''),
    good: q.good,
    wrong: q.wrong,
    explication: q.e,
    difficulty: q.d,
    max: level === 'facile' ? 3 : 4,
  });
};

const anglesNumeric: ItemGen = (level, rng, ctx) => {
  type C = { p: string; a: number; u?: string; e: string; d: number };
  const formes: (() => C)[] = [];
  if (level === 'facile') {
    const [f, n] = rng.pick([
      ['un carré', 4],
      ['un rectangle', 4],
      ['un triangle rectangle', 1],
    ] as [string, number][]);
    formes.push(
      () => ({
        p: `Combien d’angles droits a ${f} ?`,
        a: n,
        e:
          n === 4
            ? `${f[0]!.toUpperCase()}${f.slice(1)} a 4 angles droits, un à chaque coin.`
            : 'Un triangle rectangle a un seul angle droit.',
        d: 0.2,
      }),
      () => {
        const [nom, k] = rng.pick([
          ['un triangle', 3],
          ['un quadrilatère', 4],
          ['un pentagone', 5],
          ['un hexagone', 6],
        ] as [string, number][]);
        return {
          p: `Combien d’angles a ${nom} ?`,
          a: k,
          e: `${nom[0]!.toUpperCase()}${nom.slice(1)} a ${k} côtés et ${k} angles, un à chaque sommet.`,
          d: 0.25,
        };
      },
      () => ({
        p: 'Un angle droit mesure … degrés.',
        a: 90,
        u: '°',
        e: 'Un angle droit mesure 90 degrés (90°).',
        d: 0.3,
      }),
    );
  } else if (level === 'normal') {
    const a1 = rng.int(3, 14) * 5;
    const a2 = rng.int(2, Math.min(14, 34 - a1 / 5)) * 5;
    const m = rng.int(2, 4);
    const base = rng.int(2, Math.floor(170 / m / 5)) * 5;
    const pair = rng.int(4, 32) * 5;
    const comp = rng.int(2, 16) * 5;
    formes.push(
      () => ({
        p: 'On plie un angle droit en deux. Chaque moitié mesure … °',
        a: 45,
        u: '°',
        e: 'La moitié de 90° : 90 ÷ 2 = 45°.',
        d: 0.35,
      }),
      () => ({
        p: `On place côte à côte un angle de ${a1}° et un angle de ${a2}°. L’angle obtenu mesure … °`,
        a: a1 + a2,
        u: '°',
        e: `On ajoute les deux angles : ${a1} + ${a2} = ${a1 + a2}°.`,
        d: 0.4,
      }),
      () => ({
        p: `Un angle mesure ${base}°. Un angle ${m} fois plus grand mesure … °`,
        a: base * m,
        u: '°',
        e: `${m} fois ${base}° : ${m} × ${base} = ${base * m}°.`,
        d: 0.45,
      }),
      () => ({
        p: `Un angle mesure ${2 * pair}°. On le plie en deux. Chaque moitié mesure … °`,
        a: pair,
        u: '°',
        e: `La moitié de ${2 * pair}° : ${2 * pair} ÷ 2 = ${pair}°.`,
        d: 0.45,
      }),
      () => ({
        p: `Un angle droit est partagé en deux angles. L’un mesure ${comp}°. L’autre mesure … °`,
        a: 90 - comp,
        u: '°',
        e: `Les deux angles font ensemble un angle droit, 90° : 90 − ${comp} = ${90 - comp}°.`,
        d: 0.55,
      }),
    );
  } else {
    const x = rng.int(4, 32) * 5;
    const y = rng.int(4, 10) * 10;
    const z = rng.int(1, 8) * 10;
    formes.push(
      () => ({
        p: 'Deux angles droits placés côte à côte forment un angle plat de … °',
        a: 180,
        u: '°',
        e: '90° + 90° = 180° : c’est un angle plat.',
        d: 0.55,
      }),
      () => ({
        p: `Un angle plat (180°) est partagé en deux angles. L’un mesure ${x}°. L’autre mesure … °`,
        a: 180 - x,
        u: '°',
        e: `Un angle plat mesure 180° : 180 − ${x} = ${180 - x}°.`,
        d: 0.65,
      }),
      () => ({
        p: 'On partage un angle droit en 3 angles égaux. Chacun mesure … °',
        a: 30,
        u: '°',
        e: '90 ÷ 3 = 30°.',
        d: 0.6,
      }),
      () => ({
        p: 'On partage un angle plat (180°) en 3 angles égaux. Chacun mesure … °',
        a: 60,
        u: '°',
        e: '180 ÷ 3 = 60°.',
        d: 0.65,
      }),
      () => ({
        p: 'On place côte à côte 3 angles de 45°. L’angle obtenu mesure … °',
        a: 135,
        u: '°',
        e: '3 × 45 = 135° : c’est un angle droit plus sa moitié.',
        d: 0.6,
      }),
      () => ({
        p: `Un angle mesure ${y}°. On place à côté de lui sa moitié. L’angle obtenu mesure … °`,
        a: y + y / 2,
        u: '°',
        e: `La moitié de ${y}° est ${y / 2}° : ${y} + ${y / 2} = ${y + y / 2}°.`,
        d: 0.7,
      }),
      () => ({
        p: `Un angle droit et un angle de ${z}° placés côte à côte forment un angle de … °`,
        a: 90 + z,
        u: '°',
        e: `Un angle droit mesure 90° : 90 + ${z} = ${90 + z}°.`,
        d: 0.55,
      }),
    );
  }
  const c = rng.pick(formes)();
  return numeric(ctx, `angle-${c.p}`, {
    prompt: c.p,
    spoken: c.p
      .replace(/(\d+)°/g, '$1 degrés')
      .replace(/… °/g, 'combien de degrés')
      .replace(/…/g, 'combien'),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

const anglesVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  if (level !== 'plus_loin' && rng.chance(level === 'facile' ? 0.5 : 0.4)) {
    // Facile : multiples de 10 (et 90°) ; normal : 15°, 25°… 175°, plus proches de l’angle droit
    const x =
      level === 'facile' ? rng.pick([rng.int(2, 8) * 10, 90, rng.int(10, 17) * 10]) : rng.int(1, 17) * 10 + 5;
    const nat = natureAngle(x);
    const dite = juste ? nat : rng.pick(['aigu', 'droit', 'obtus'].filter((n) => n !== nat));
    const st = `Un angle de ${x}° est ${dite}.`;
    return vraiFaux(ctx, `nature-${x}-${dite}`, {
      statement: st,
      spoken: st.replace('°', ' degrés'),
      answer: dite === nat,
      explication:
        x === 90
          ? `Un angle de 90° est un angle droit${dite === 'droit' ? '' : `, donc il n’est pas ${dite}`}.`
          : `Un angle droit mesure 90° : ${x}° est ${x < 90 ? 'plus petit' : 'plus grand'}, l’angle est ${nat}.`,
      difficulty: level === 'facile' ? 0.3 : 0.4,
    });
  }
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const a = rng.int(2, 8) * 10;
    const montre = juste ? 2 * a : 2 * a + rng.pick([-10, 10]);
    const st = `Un angle de ${montre}° est le double d’un angle de ${a}°.`;
    return vraiFaux(ctx, `double-${a}-${montre}`, {
      statement: st,
      spoken: st.replace(/(\d+)°/g, '$1 degrés'),
      answer: montre === 2 * a,
      explication: `Le double de ${a}°, c’est 2 × ${a} = ${2 * a}°.`,
      difficulty: 0.55,
    });
  }
  const regles = parNiv(level, {
    facile: [
      { s: 'Un angle droit mesure 90°.', v: true, e: 'Un angle droit mesure 90 degrés.' },
      { s: 'Un angle droit mesure 100°.', v: false, e: 'Un angle droit mesure 90 degrés.' },
      {
        s: 'Si on prolonge les côtés d’un angle, l’angle devient plus grand.',
        v: false,
        e: 'La taille d’un angle ne dépend pas de la longueur de ses côtés, seulement de leur écartement.',
      },
      {
        s: 'Un angle aigu est plus petit qu’un angle droit.',
        v: true,
        e: 'Aigu : plus petit qu’un angle droit ; obtus : plus grand.',
      },
    ],
    normal: [
      { s: 'La moitié d’un angle droit mesure 45°.', v: true, e: '90 ÷ 2 = 45°.' },
      { s: 'La moitié d’un angle droit mesure 50°.', v: false, e: '90 ÷ 2 = 45°.' },
      {
        s: 'Deux angles aigus placés côte à côte forment toujours un angle obtus.',
        v: false,
        e: 'Pas toujours : 20° + 30° = 50°, c’est encore un angle aigu.',
      },
      {
        s: 'Deux angles de 45° placés côte à côte forment un angle droit.',
        v: true,
        e: '45° + 45° = 90° : c’est un angle droit.',
      },
      {
        s: 'Un angle de 60° est plus grand qu’un angle droit.',
        v: false,
        e: '60° est moins que 90° : c’est un angle aigu, plus petit qu’un angle droit.',
      },
    ],
    plus_loin: [
      {
        s: 'Un angle plat mesure 180°.',
        v: true,
        e: 'Un angle plat, c’est deux angles droits : 90° + 90° = 180°.',
      },
      { s: 'Le tiers d’un angle droit mesure 45°.', v: false, e: '90 ÷ 3 = 30° ; 45° est la moitié.' },
      {
        s: 'Deux angles obtus placés côte à côte forment un angle plat.',
        v: false,
        e: 'Deux angles obtus font plus de 90° + 90° = 180° : on dépasse l’angle plat.',
      },
      {
        s: 'Le quart d’un angle plat est la moitié d’un angle droit.',
        v: true,
        e: '180 ÷ 4 = 45° et 90 ÷ 2 = 45° : ce sont bien les mêmes angles.',
      },
    ],
  });
  const r = rng.pick(regles.filter((x) => x.v === juste));
  return vraiFaux(ctx, `regle-${r.s}`, {
    statement: r.s,
    spoken: r.s.replace(/(\d+)°/g, '$1 degrés'),
    answer: r.v,
    explication: r.e,
    difficulty: parNiv(level, { facile: 0.3, normal: 0.45, plus_loin: 0.6 }),
  });
};

/* ================================================================== */
/* Horaires et durées                                                  */
/* ================================================================== */

const p2 = (x: number) => String(x).padStart(2, '0');
/** « 14 h », « 8 h 05 », « 9 h 12 min 30 s ». */
export const heure = (h: number, m: number, s?: number) =>
  s === undefined ? (m === 0 ? `${h} h` : `${h} h ${p2(m)}`) : `${h} h ${p2(m)} min ${p2(s)} s`;

/** Durée en secondes → « 1 h 5 min », « 2 min 30 s », « 45 s ». */
export function dureeTxt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [h ? `${h} h` : '', m ? `${m} min` : '', s ? `${s} s` : ''].filter(Boolean);
  return parts.join(' ') || '0 s';
}

const ACTIVITES = [
  'Le film',
  'Le match',
  'Le spectacle',
  'La séance de piscine',
  'Le dessin animé',
  'La visite du musée',
  'Le concert',
];
const finit = (activite: string) => (/^La /.test(activite) ? 'finit-elle' : 'finit-il');

/** Durées décimales en heures (6e) : [écriture, minutes]. */
const HEURES_DECIMALES: [number, number][] = [
  [0.75, 45],
  [1.25, 75],
  [1.5, 90],
  [1.75, 105],
  [2.25, 135],
  [2.5, 150],
  [2.75, 165],
];
const FRACTION_HEURE: Record<number, string> = {
  15: '0,25 h = un quart d’heure = 15 min',
  30: '0,5 h = une demi-heure = 30 min',
  45: '0,75 h = trois quarts d’heure = 45 min',
};

const dureesClock: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin') {
    const forme = rng.pick(['decimale', 'minuit', 'apres'] as const);
    if (forme === 'apres') {
      // Régler l'horloge sur l'heure qu'il sera après une durée en h, min, s
      const [h, m, s] = [rng.int(7, 15), rng.int(0, 59), rng.int(0, 59)];
      const d = rng.int(1, 3) * 3600 + rng.int(1, 59) * 60 + rng.int(1, 59);
      const t = h * 3600 + m * 60 + s + d;
      const [fh, fm, fs] = [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60];
      const txt = heure(fh, fm, fs);
      return make(ctx, 'clock', `apres-${h}-${m}-${s}-${d}`, {
        prompt: `Il est ${heure(h, m, s)}. Règle l’horloge sur l’heure qu’il sera dans ${dureeTxt(d)}.`,
        spoken: `Il est ${dire(heure(h, m, s))}. Règle l’horloge sur l’heure qu’il sera dans ${dire(dureeTxt(d))}.`,
        task: 'regler',
        hours: fh,
        minutes: fm,
        seconds: fs,
        answerText: txt,
        explication: `On ajoute les secondes, puis les minutes, puis les heures ; 60 s font 1 min et 60 min font 1 h : ${heure(h, m, s)} + ${dureeTxt(d)} = ${txt}.`,
        difficulty: 0.75,
      });
    }
    const hd = forme === 'decimale' ? rng.int(8, 19) : rng.int(21, 23);
    const m = rng.int(0, 11) * 5;
    // « minuit » : la durée fait toujours passer minuit
    const [dec, duree] =
      forme === 'decimale'
        ? rng.pick(HEURES_DECIMALES)
        : [0, rng.int(Math.max(70, 24 * 60 - (hd * 60 + m) + 5), 200)];
    const fin = hd * 60 + m + duree;
    const [fh, fm] = [Math.floor(fin / 60), fin % 60];
    const fin24 = heure(fh % 24, fm);
    const activite = rng.pick(ACTIVITES);
    const dureeEcrite = forme === 'decimale' ? `${fmt(dec)} h` : dureeTxt(duree * 60);
    const conversion =
      forme === 'decimale' ? `${fmt(dec)} h = ${dureeTxt(duree * 60)} (${FRACTION_HEURE[duree % 60]}). ` : '';
    return make(ctx, 'clock', `${forme}-${hd}-${m}-${duree}`, {
      prompt: `${activite} commence à ${heure(hd, m)} et dure ${dureeEcrite}. À quelle heure ${finit(activite)} ?`,
      task: 'duree',
      hours: hd,
      minutes: m,
      durationMinutes: duree,
      answerText: fin24,
      explication:
        fh >= 24
          ? `${conversion}${heure(hd, m)} + ${dureeTxt(duree * 60)}, cela fait ${fh} h ${p2(fm)} : après minuit, on repart de 0 h, donc il sera ${fin24}.`
          : `${conversion}${heure(hd, m)} + ${dureeTxt(duree * 60)} = ${fin24}.`,
      difficulty: forme === 'minuit' ? 0.75 : 0.65,
    });
  }
  const task = rng.pick(['lire', 'regler', 'duree'] as const);
  const avecSec = level === 'normal' && task !== 'duree';
  const apm = level === 'normal' && rng.chance(0.4);
  const h = apm ? rng.int(13, 18) : rng.int(level === 'facile' ? 1 : 7, 11);
  const m = level === 'facile' ? rng.int(0, 11) * 5 : rng.int(0, 59);
  const s = avecSec ? rng.int(0, 59) : undefined;
  if (task !== 'duree') {
    const txt = heure(h, m, s);
    const expl = avecSec
      ? `La petite aiguille indique les heures, la grande les minutes et la trotteuse (la plus fine) les secondes : ${txt}.`
      : `La petite aiguille indique les heures, la grande aiguille les minutes (chaque chiffre vaut 5 minutes) : ${txt}.`;
    return make(ctx, 'clock', `${task}-${h}-${m}-${s ?? ''}`, {
      prompt:
        task === 'lire'
          ? `${apm ? 'C’est l’après-midi. ' : ''}Quelle heure indique l’horloge ?`
          : `Règle l’horloge sur ${txt}.`,
      spoken: task === 'lire' ? undefined : `Règle l’horloge sur ${dire(txt)}.`,
      task,
      hours: h,
      minutes: m,
      seconds: s,
      answerText: txt,
      explication: apm
        ? `${expl} L’après-midi, on compte les heures après midi : ${h - 12} h de l’après-midi, c’est ${h} h.`
        : expl,
      difficulty: clamp01(0.15 + (m % 5 ? 0.2 : 0) + (apm ? 0.15 : 0) + (avecSec ? 0.25 : 0)),
    });
  }
  const duree =
    level === 'facile' ? rng.pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 70, 75, 90]) : rng.int(25, 150);
  const hd = rng.int(8, 17);
  const fin = hd * 60 + m + duree;
  const [fh, fm] = [Math.floor(fin / 60), fin % 60];
  const retenue = m + (duree % 60) >= 60;
  const activite = rng.pick(ACTIVITES);
  return make(ctx, 'clock', `duree-${hd}-${m}-${duree}`, {
    prompt: `${activite} commence à ${heure(hd, m)} et dure ${dureeTxt(duree * 60)}. À quelle heure ${finit(activite)} ?`,
    task: 'duree',
    hours: hd,
    minutes: m,
    durationMinutes: duree,
    answerText: heure(fh, fm),
    explication: retenue
      ? `${heure(hd, m)} + ${dureeTxt(duree * 60)} = ${heure(fh, fm)} : on dépasse 60 minutes, et 60 min font 1 heure de plus.`
      : `${heure(hd, m)} + ${dureeTxt(duree * 60)} = ${heure(fh, fm)} : on ajoute les heures, puis les minutes.`,
    difficulty: clamp01(0.3 + duree / 400 + (retenue ? 0.2 : 0)),
  });
};

const dureesNumeric: ItemGen = (level, rng, ctx) => {
  type C = { p: string; a: number; u: string; e: string; d: number };
  const formes: (() => C)[] = [];
  if (level === 'facile') {
    const k = rng.int(2, 6);
    const hm = rng.int(1, 3);
    const mm = rng.int(5, 55);
    formes.push(
      () => ({
        p: `${k} h = … min`,
        a: k * 60,
        u: 'min',
        e: `1 h = 60 min, donc ${k} h = ${k} × 60 = ${k * 60} min.`,
        d: 0.2,
      }),
      () => ({
        p: `${hm} h ${mm} min = … min`,
        a: hm * 60 + mm,
        u: 'min',
        e: `1 h = 60 min, donc ${hm} h = ${hm * 60} min, et ${hm * 60} + ${mm} = ${hm * 60 + mm} min.`,
        d: 0.35,
      }),
      () => {
        const d0 = rng.int(8, 16);
        const m0 = rng.int(0, 11) * 5;
        const dur = rng.pick([25, 35, 40, 45, 50, 55, 65, 70, 80, 95]);
        const f = d0 * 60 + m0 + dur;
        const activite = rng.pick(ACTIVITES);
        return {
          p: `${activite} commence à ${heure(d0, m0)} et se termine à ${heure(Math.floor(f / 60), f % 60)}. Combien de minutes dure-t-${/^La /.test(activite) ? 'elle' : 'il'} ?`,
          a: dur,
          u: 'min',
          e:
            dur < 60
              ? `De ${heure(d0, m0)} à ${heure(Math.floor(f / 60), f % 60)}, il s’écoule ${dur} min (on peut passer par l’heure pile).`
              : `De ${heure(d0, m0)} à ${heure(Math.floor(f / 60), f % 60)}, il s’écoule ${dureeTxt(dur * 60)}, soit ${dur} min (1 h = 60 min).`,
          d: 0.45,
        };
      },
      () => ({ p: '1 jour = … h', a: 24, u: 'h', e: 'Une journée entière dure 24 heures.', d: 0.15 }),
    );
  } else if (level === 'normal') {
    const k = rng.int(2, 6);
    const s1 = rng.int(1, 4);
    const s2 = rng.int(5, 59);
    const total = rng.int(70, 290);
    formes.push(
      () => ({
        p: `${k} min = … s`,
        a: k * 60,
        u: 's',
        e: `1 min = 60 s, donc ${k} min = ${k} × 60 = ${k * 60} s.`,
        d: 0.3,
      }),
      () => ({
        p: `${s1} min ${s2} s = … s`,
        a: s1 * 60 + s2,
        u: 's',
        e: `1 min = 60 s, donc ${s1} min = ${s1 * 60} s, et ${s1 * 60} + ${s2} = ${s1 * 60 + s2} s.`,
        d: 0.45,
      }),
      () => {
        const mi = Math.floor(total / 60);
        return {
          p: `${total} s = ${mi} min … s`,
          a: total - mi * 60,
          u: 's',
          e: `${mi} min = ${mi * 60} s, et ${total} − ${mi * 60} = ${total - mi * 60} : ${total} s = ${mi} min ${total - mi * 60} s.`,
          d: 0.55,
        };
      },
      () => {
        // Horaire de train (durée en minutes, on passe l'heure)
        const d0 = rng.int(6, 15);
        const m0 = rng.int(0, 59);
        const dur = rng.int(40, 200);
        const f = d0 * 60 + m0 + dur;
        return {
          p: `Un train part à ${heure(d0, m0)} et arrive à ${heure(Math.floor(f / 60), f % 60)}. Combien de minutes dure le trajet ?`,
          a: dur,
          u: 'min',
          e:
            dur < 60
              ? `De ${heure(d0, m0)} à ${heure(Math.floor(f / 60), f % 60)}, il s’écoule ${dur} min.`
              : `De ${heure(d0, m0)} à ${heure(Math.floor(f / 60), f % 60)}, il s’écoule ${dureeTxt(dur * 60)}, soit ${dur} min (1 h = 60 min).`,
          d: 0.6,
        };
      },
      () => {
        // Course : deux étapes (convertir puis comparer)
        const [a, b] = rng.shuffle(PERSOS).slice(0, 2);
        const t1 = rng.int(190, 290);
        const t2 = t1 + rng.int(5, 40);
        return {
          p: `Au 1 000 m, ${a!.nom} met ${dureeTxt(t1)} et ${b!.nom} met ${dureeTxt(t2)}. Combien de secondes ${a!.nom} a-t-${a!.il} d’avance ?`,
          a: t2 - t1,
          u: 's',
          e: `${dureeTxt(t1)} = ${t1} s et ${dureeTxt(t2)} = ${t2} s (1 min = 60 s) : ${t2} − ${t1} = ${t2 - t1} s.`,
          d: 0.65,
        };
      },
    );
  } else {
    const [dec, mins] = rng.pick(HEURES_DECIMALES);
    const h3 = rng.int(1, 3);
    const m3 = rng.int(1, 59);
    const s3 = rng.int(1, 59);
    const j = rng.int(2, 7);
    const sem = rng.int(2, 5);
    formes.push(
      () => ({
        p: `${fmt(dec)} h = … min`,
        a: mins,
        u: 'min',
        e: `1 h = 60 min, donc ${fmt(dec)} h = ${fmt(dec)} × 60 = ${mins} min (${FRACTION_HEURE[mins % 60]}).`,
        d: 0.7,
      }),
      () => ({
        p: `${mins} min = … h`,
        a: dec,
        u: 'h',
        e: `${mins} min = ${dureeTxt(mins * 60)}, et ${FRACTION_HEURE[mins % 60]} : ${mins} min = ${fmt(dec)} h.`,
        d: 0.75,
      }),
      () => ({
        p: `${h3} h ${m3} min ${s3} s = … s`,
        a: h3 * 3600 + m3 * 60 + s3,
        u: 's',
        e: `1 h = 3 600 s et 1 min = 60 s : ${fmt(h3 * 3600)} + ${fmt(m3 * 60)} + ${s3} = ${fmt(h3 * 3600 + m3 * 60 + s3)} s.`,
        d: 0.75,
      }),
      () => ({
        p: `${j} jours = … h`,
        a: 24 * j,
        u: 'h',
        e: `1 jour = 24 h, donc ${j} jours = ${j} × 24 = ${24 * j} h.`,
        d: 0.55,
      }),
      () => ({
        p: `${sem} semaines = … h`,
        a: 168 * sem,
        u: 'h',
        e: `1 semaine = 7 jours = 7 × 24 = 168 h, donc ${sem} semaines = ${sem} × 168 = ${168 * sem} h.`,
        d: 0.7,
      }),
      () => ({
        p: `${j} siècles = … ans`,
        a: 100 * j,
        u: 'ans',
        e: `1 siècle = 100 ans, donc ${j} siècles = ${100 * j} ans.`,
        d: 0.55,
      }),
    );
  }
  const c = rng.pick(formes)();
  return numeric(ctx, `duree-${c.p}`, {
    prompt: c.p,
    spoken: dire(c.p),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

const dureesQcm: ItemGen = (level, rng, ctx) => {
  let qs: Q[];
  if (level === 'facile')
    qs = [
      {
        sig: 'h-min',
        q: 'Combien y a-t-il de minutes dans une heure ?',
        good: '60',
        wrong: ['100', '24', '30', '50'],
        e: '1 h = 60 min.',
        d: 0.15,
      },
      {
        sig: 'demi',
        q: 'Une demi-heure, c’est…',
        good: '30 min',
        wrong: ['50 min', '20 min', '2 min'],
        e: 'Une heure, c’est 60 min ; une demi-heure, c’est 60 ÷ 2 = 30 min.',
        d: 0.2,
      },
      {
        sig: 'quart',
        q: 'Un quart d’heure, c’est…',
        good: '15 min',
        wrong: ['25 min', '4 min', '45 min', '30 min'],
        e: 'Une heure, c’est 60 min ; un quart d’heure, c’est 60 ÷ 4 = 15 min.',
        d: 0.25,
      },
      {
        sig: 'trois-quarts',
        q: 'Trois quarts d’heure, c’est…',
        good: '45 min',
        wrong: ['34 min', '75 min', '30 min', '15 min'],
        e: 'Un quart d’heure = 15 min, donc trois quarts d’heure = 3 × 15 = 45 min.',
        d: 0.3,
      },
    ];
  else if (level === 'normal') {
    const d0 = rng.int(13, 20);
    const m0 = rng.int(1, 11) * 5;
    const dm = rng.int(1, 11) * 5;
    const f = d0 * 60 + m0 + 60 + dm;
    const good = heure(Math.floor(f / 60), f % 60);
    const faux = [
      `${d0 + 1} h ${m0 + dm}`,
      heure(Math.floor(f / 60) - 1, f % 60),
      heure(Math.floor(f / 60) + 1, f % 60),
      heure(Math.floor(f / 60), (f % 60) + 5 >= 60 ? (f % 60) - 5 : (f % 60) + 5),
    ];
    qs = [
      {
        sig: 'min-s',
        q: 'Combien y a-t-il de secondes dans une minute ?',
        good: '60',
        wrong: ['100', '10', '30', '1 000'],
        e: '1 min = 60 s.',
        d: 0.3,
      },
      {
        sig: 'annee',
        q: 'Combien de jours compte une année qui n’est pas bissextile ?',
        good: '365',
        wrong: ['366', '360', '12', '52'],
        e: 'Une année compte 365 jours (366 les années bissextiles, comme 2028).',
        d: 0.35,
      },
      {
        sig: 'siecle',
        q: 'Un siècle, c’est…',
        good: '100 ans',
        wrong: ['10 ans', '1 000 ans', '50 ans'],
        e: 'Un siècle dure 100 ans ; un millénaire, 1 000 ans.',
        d: 0.35,
      },
      {
        sig: `film-${d0}-${m0}-${dm}`,
        q: `Le film commence à ${heure(d0, m0)} et dure 1 h ${dm} min. À quelle heure finit-il ?`,
        good,
        wrong: faux.filter((x) => x !== good),
        e: `${heure(d0, m0)} + 1 h = ${heure(d0 + 1, m0)}, puis + ${dm} min = ${good} (60 min font 1 h).`,
        d: 0.55,
      },
    ];
  } else
    qs = [
      {
        sig: '1,5h',
        q: '1,5 h, c’est…',
        good: '1 h 30 min',
        wrong: ['1 h 50 min', '1 h 5 min', '150 min'],
        e: '0,5 h, c’est une demi-heure, soit 30 min : 1,5 h = 1 h 30 min.',
        d: 0.6,
      },
      {
        sig: '0,25h',
        q: '0,25 h, c’est…',
        good: '15 min',
        wrong: ['25 min', '2 min 5 s', '4 min'],
        e: '0,25 h, c’est un quart d’heure : 60 ÷ 4 = 15 min.',
        d: 0.65,
      },
      {
        sig: 'millenaire',
        q: 'Combien d’années compte un millénaire ?',
        good: '1 000',
        wrong: ['100', '10 000', '10'],
        e: 'Un millénaire, c’est 10 siècles : 1 000 ans.',
        d: 0.55,
      },
      {
        sig: 'heure-s',
        q: 'Combien y a-t-il de secondes dans une heure ?',
        good: '3 600',
        wrong: ['60', '360', '6 000', '1 000'],
        e: '1 h = 60 min et 1 min = 60 s : 60 × 60 = 3 600 s.',
        d: 0.6,
      },
      {
        sig: 'semaine-h',
        q: 'Combien y a-t-il d’heures dans une semaine ?',
        good: '168',
        wrong: ['70', '24', '100', '144'],
        e: '1 semaine = 7 jours et 1 jour = 24 h : 7 × 24 = 168 h.',
        d: 0.65,
      },
      {
        sig: 'bissextile',
        q: 'Combien de jours compte une année bissextile, comme 2028 ?',
        good: '366',
        wrong: ['365', '364', '360'],
        e: 'Une année bissextile a un jour de plus (le 29 février) : 366 jours.',
        d: 0.55,
      },
    ];
  const q = rng.pick(qs);
  return mcq(ctx, rng, q.sig, {
    question: q.q,
    spoken: dire(q.q.replace(/…$/, ' combien ?')),
    good: q.good,
    wrong: q.wrong,
    explication: q.e,
    difficulty: q.d,
    max: level === 'facile' ? 3 : 4,
  });
};

const dureesRanger: ItemGen = (level, rng, ctx) => {
  const n = level === 'facile' ? 3 : 4;
  const vals: number[] = [];
  const textes = new Map<number, string>();
  const notes: string[] = [];
  let unite: 'min' | 's';
  if (level === 'facile') {
    unite = 'min';
    while (vals.length < n) {
      const v = rng.int(6, 30) * 5;
      if (!vals.includes(v)) vals.push(v);
    }
    // valeurs en minutes ; écritures « 1 h 10 min » ou « 70 min »
    vals.forEach((v, i) =>
      textes.set(v, v >= 60 && (i === 0 || (i !== 1 && rng.chance(0.5))) ? dureeTxt(v * 60) : `${v} min`),
    );
  } else if (level === 'normal') {
    unite = 's';
    while (vals.length < n) {
      const v = rng.int(65, 250);
      if (!vals.includes(v)) vals.push(v);
    }
    vals.forEach((v, i) => textes.set(v, i === 0 || (i !== 1 && rng.chance(0.5)) ? dureeTxt(v) : `${v} s`));
  } else {
    // Valeurs en secondes : une durée décimale en heures, une en secondes, les autres en min ou h min s
    unite = 's';
    const [dec, mins] = rng.pick(HEURES_DECIMALES);
    vals.push(mins * 60);
    textes.set(mins * 60, `${fmt(dec)} h`);
    notes.push(`${fmt(dec)} h = ${dureeTxt(mins * 60)} (${FRACTION_HEURE[mins % 60]})`);
    while (vals.length < n) {
      const i = vals.length;
      const v =
        i === 1
          ? rng.int(30, 160) * 60 + rng.int(1, 59)
          : rng.int(30, 170) * 60 + (rng.chance(0.5) ? rng.int(1, 59) : 0);
      if (vals.includes(v)) continue;
      vals.push(v);
      textes.set(v, i === 1 ? `${fmt(v)} s` : v % 60 === 0 ? `${v / 60} min` : dureeTxt(v));
    }
  }
  const decroissant = level !== 'facile' && rng.chance(0.3);
  const tries = [...vals].sort((a, b) => (decroissant ? b - a : a - b));
  const elements = tries.map((v) => textes.get(v)!);
  return make(ctx, 'ordering', `durees-${elements.join('|')}-${decroissant}`, {
    prompt: `Range ces durées de la plus ${decroissant ? 'longue' : 'courte'} à la plus ${decroissant ? 'courte' : 'longue'}.`,
    elements,
    mode: decroissant ? 'decroissant' : 'croissant',
    explication: `${notes.length ? `${notes.join(' ; ')}. ` : ''}On écrit toutes les durées dans la même unité (${
      level === 'plus_loin' ? '1 h = 3 600 s, 1 min = 60 s' : unite === 's' ? '1 min = 60 s' : '1 h = 60 min'
    }) : ${tries.map((v) => `${fmt(v)} ${unite}`).join(decroissant ? ' > ' : ' < ')}.`,
    difficulty: clamp01(0.35 + (level === 'plus_loin' ? 0.3 : level === 'normal' ? 0.15 : 0)),
  });
};

/* ================================================================== */
/* Export                                                              */
/* ================================================================== */

export const GRANDEURS: Record<string, LessonContent> = {
  'CM2.MA.GM.LONG_MASSE_CONT': {
    gens: { numeric_answer: convNumeric, mcq: convQcm, ordering: convRanger, true_false: convVraiFaux },
  },
  'CM2.MA.GM.PERIMETRE': {
    gens: {
      numeric_answer: mesureNumeric(pbPerimetre),
      mcq: perimetreQcm,
      true_false: mesureVraiFaux(pbPerimetre, reglesPerimetre),
    },
  },
  'CM2.MA.GM.AIRES': {
    gens: {
      numeric_answer: mesureNumeric(pbAire),
      mcq: aireQcm,
      true_false: mesureVraiFaux(pbAire, reglesAires),
    },
  },
  'CM2.MA.GM.ANGLES': {
    gens: {
      classification: anglesClasser,
      mcq: anglesQcm,
      numeric_answer: anglesNumeric,
      true_false: anglesVraiFaux,
    },
  },
  'CM2.MA.GM.DUREES': {
    gens: { clock: dureesClock, numeric_answer: dureesNumeric, mcq: dureesQcm, ordering: dureesRanger },
  },
};
