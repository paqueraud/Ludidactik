/**
 * CE1 — Nombres entiers (BO n°41 du 31/10/2024, cycle 2, « Les nombres entiers ») :
 * lire/écrire (dictée, lettres), décompositions, comparer/ranger/encadrer, demi-droite graduée,
 * parité, ordinaux et suites. Champ numérique : ≤ 100 (facile), ≤ 1 000 (normal = attendu BO),
 * ≤ 10 000 (pour aller plus loin, quand la leçon le prévoit).
 */
import { graphiesNombre, nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, distinctInts, fmt, make, mcq, numeric, parNiv } from './util';

/* ------------------------------------------------------------------ */
/* Tirage de nombres « intéressants »                                  */
/* ------------------------------------------------------------------ */

/** Nombre à lire/écrire : on sur-représente les pièges (70-99, zéros, cent(s), mille). */
function nombrePiege(level: Level, rng: Rng): number {
  if (level === 'facile') {
    const r = rng.next();
    if (r < 0.4) return rng.int(60, 99);
    if (r < 0.5) return rng.pick([20, 30, 40, 50, 60, 70, 80, 90, 100]);
    return rng.int(11, 100);
  }
  if (level === 'normal') {
    const c = rng.int(1, 9);
    const r = rng.next();
    if (r < 0.3) return c * 100 + rng.int(70, 99);
    if (r < 0.45) return c * 100 + rng.int(1, 9); // 405 : zéro des dizaines
    if (r < 0.55) return c * 100 + rng.pick([0, 80, 20, 60]);
    if (r < 0.58) return 1000;
    return rng.int(101, 999);
  }
  const m = rng.int(1, 9);
  const r = rng.next();
  if (r < 0.3) return m * 1000 + rng.int(1, 9) * 100 + rng.int(70, 99);
  if (r < 0.5) return m * 1000 + rng.int(0, 99);
  return rng.int(1001, 9999);
}

const chiffres = (n: number) => String(n).split('').map(Number);

/** Nombres qu'un enfant confond avec n (chiffres échangés, 70 ↔ 60, 90 ↔ 80…). */
function voisinsConfusion(n: number, rng: Rng, max: number): number[] {
  const out = new Set<number>();
  const s = String(n);
  const add = (x: number) => {
    if (x !== n && x > 0 && x <= max) out.add(x);
  };
  if (s.length >= 2) {
    const a = s.split('');
    [a[a.length - 1], a[a.length - 2]] = [a[a.length - 2]!, a[a.length - 1]!];
    add(Number(a.join('')));
  }
  add(Number(s.split('').reverse().join('')));
  const d = Math.floor(n / 10) % 10;
  if (d === 7 || d === 9) add(n - 10);
  if (d === 6 || d === 8) add(n + 10);
  add(n + 10);
  add(n - 1);
  add(n + 100);
  if (n >= 1000) add(Number(s.replace(/0/g, '')) || n + 1);
  return rng.shuffle([...out]);
}

/** Graphies fautives plausibles (s de cents / vingts, « milles »…) : jamais une graphie acceptée. */
function lettresFautives(n: number): string[] {
  const r = nombreEnLettres(n);
  const out: string[] = [];
  if (/cents$/.test(r)) out.push(r.replace(/cents$/, 'cent'));
  if (/quatre-vingts$/.test(r)) out.push(r.replace(/vingts$/, 'vingt'));
  if (/-cent-/.test(r)) out.push(r.replace('-cent-', '-cents-'));
  if (/mille/.test(r) && n >= 2000) out.push(r.replace('mille', 'milles'));
  if (/^cent/.test(r)) out.push(`un-${r}`);
  const ok = graphiesNombre(n);
  return out.filter((x) => !ok.includes(x));
}

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.ECRIRE — dictée, chiffres ↔ lettres, lecture à voix haute */
/* ------------------------------------------------------------------ */

const difEcrire = (n: number, level: Level) => {
  const d = Math.floor(n / 10) % 10;
  let x = 0.3;
  if (d === 7 || d === 9 || d === 8) x += 0.3;
  if (/0/.test(String(n))) x += 0.15;
  if (level !== 'facile' && n % 100 === 0) x += 0.1;
  return clamp01(x + (String(n).length - 2) * 0.05);
};

const maxNiv = (level: Level) => parNiv(level, { facile: 100, normal: 1000, plus_loin: 9999 });

const ecrireDictee: ItemGen = (level, rng, ctx) => {
  const n = nombrePiege(level, rng);
  return numeric(ctx, `dictee-${n}`, {
    prompt: 'Écris le nombre que tu entends.',
    spoken: String(n),
    answer: n,
    explication: `On entend « ${nombreEnLettres(n)} » : on écrit ${fmt(n)}.`,
    difficulty: difEcrire(n, level),
    meta: { dictee: true },
  });
};

const ecrireLettresQcm: ItemGen = (level, rng, ctx) => {
  const n = nombrePiege(level, rng);
  const lettres = nombreEnLettres(n);
  const pieges = [
    ...lettresFautives(n),
    ...voisinsConfusion(n, rng, maxNiv(level)).map((x) => nombreEnLettres(x)),
  ];
  if (rng.chance(0.5)) {
    return mcq(ctx, rng, `lettres-${n}`, {
      question: `Comment s’écrit ${fmt(n)} en lettres ?`,
      spoken: `Comment s’écrit ${n} en lettres ?`,
      good: lettres,
      wrong: pieges.slice(0, 3),
      explication: `${fmt(n)} s’écrit « ${lettres} » (on met des traits d’union entre les mots).`,
      difficulty: difEcrire(n, level),
      meta: { lettres: true },
      max: level === 'facile' ? 3 : 4,
    });
  }
  const voisins = voisinsConfusion(n, rng, maxNiv(level)).map(fmt);
  return mcq(ctx, rng, `chiffres-${n}`, {
    question: `Quel nombre s’écrit « ${lettres} » ?`,
    good: fmt(n),
    wrong: voisins,
    explication: `« ${lettres} », c’est ${fmt(n)}.`,
    difficulty: difEcrire(n, level),
    max: level === 'facile' ? 3 : 4,
  });
};

const ecrireLettresTrou: ItemGen = (level, rng, ctx) => {
  const n = nombrePiege(level, rng);
  const lettres = nombreEnLettres(n);
  const avecChoix = level === 'facile' || (level === 'normal' && rng.chance(0.6));
  const choices = avecChoix
    ? rng.shuffle([
        lettres,
        ...rng
          .shuffle([
            ...lettresFautives(n),
            ...voisinsConfusion(n, rng, maxNiv(level)).map((x) => nombreEnLettres(x)),
          ])
          .filter((x, i, a) => a.indexOf(x) === i && x !== lettres)
          .slice(0, 2),
      ])
    : undefined;
  return make(ctx, 'fill_blank', `trou-${n}-${avecChoix ? 'c' : 'l'}`, {
    sentence: `${fmt(n)} s’écrit en lettres : ___`,
    spoken: `Écris ${n} en lettres.`,
    answer: lettres,
    accepted: graphiesNombre(n).filter((g) => g !== lettres),
    choices,
    explication: `${fmt(n)} s’écrit « ${lettres} ».`,
    difficulty: clamp01(difEcrire(n, level) + (avecChoix ? 0 : 0.2)),
    meta: { lettres: true },
  });
};

const ecrireOral: ItemGen = (level, rng, ctx) => {
  const n = nombrePiege(level, rng);
  const lettres = nombreEnLettres(n);
  return make(ctx, 'oral_answer', `oral-${n}`, {
    prompt: `Lis ce nombre à voix haute : ${fmt(n)}`,
    spoken: 'Lis ce nombre à voix haute.',
    answer: `${lettres} (${fmt(n)})`,
    accepted: [
      ...new Set([
        String(n),
        fmt(n),
        fmt(n).replace(/ /g, ' '),
        ...graphiesNombre(n),
        lettres.replace(/-/g, ' '),
      ]),
    ],
    explication: `${fmt(n)} se lit « ${lettres} ».`,
    difficulty: difEcrire(n, level),
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.DECOMP — unités de numération                            */
/* ------------------------------------------------------------------ */

const pl = (k: number, sg: string, plu: string) => `${k} ${k > 1 ? plu : sg}`;
const cent = (k: number) => pl(k, 'centaine', 'centaines');
const diz = (k: number) => pl(k, 'dizaine', 'dizaines');
const uni = (k: number) => pl(k, 'unité', 'unités');

/** Une écriture d'un nombre, avec l'explication qui la suit pas à pas. */
type Ecriture = { texte: string; court: string; expl: string };

const valeurs = (c: number, d: number, u: number) =>
  `${cent(c)} = ${c * 100}, ${diz(d)} = ${d * 10} et ${uni(u)} = ${u} : ${c * 100} + ${d * 10} + ${u} = ${fmt(c * 100 + d * 10 + u)}.`;

/** Différentes écritures d'un nombre (BO : 635 = 6 c 3 d 5 u = 63 d 5 u = 600 + 30 + 5 = (6 × 100) + (3 × 10) + 5). */
function ecritures(n: number, level: Level, rng: Rng): Ecriture[] {
  const c = Math.floor(n / 100);
  const d = Math.floor(n / 10) % 10;
  const u = n % 10;
  const out: Ecriture[] = [
    { texte: `${cent(c)}, ${diz(d)} et ${uni(u)}`, court: `${c} c ${d} d ${u} u`, expl: valeurs(c, d, u) },
  ];
  if (level === 'facile') return out;
  const add = [c * 100, d * 10, u].filter((x) => x).join(' + ') || '0';
  out.push({
    texte: add,
    court: add,
    expl: `On ajoute les centaines, les dizaines et les unités : ${add} = ${fmt(n)}.`,
  });
  const termes = [c ? `(${c} × 100)` : '', d ? `(${d} × 10)` : '', u ? String(u) : ''].filter(Boolean);
  const mult = termes.length === 1 ? termes[0]!.replace(/^\((.*)\)$/, '$1') : termes.join(' + ');
  out.push({
    texte: mult,
    court: mult,
    expl: `${[c ? `${c} × 100 = ${c * 100}` : '', d ? `${d} × 10 = ${d * 10}` : ''].filter(Boolean).join(' et ')}, donc ${add} = ${fmt(n)}.`,
  });
  if (c > 0)
    out.push({
      texte: `${diz(c * 10 + d)} et ${uni(u)}`,
      court: `${c * 10 + d} d ${u} u`,
      expl: `${diz(c * 10 + d)} = ${(c * 10 + d) * 10}, et ${(c * 10 + d) * 10} + ${u} = ${fmt(n)}.`,
    });
  out.push({
    texte: `${uni(u)}, ${cent(c)} et ${diz(d)}`,
    court: `${u} u ${c} c ${d} d`,
    expl: `L’ordre ne compte pas : ${valeurs(c, d, u)}`,
  });
  if (level === 'plus_loin') {
    // Groupements non canoniques (BO : 2 centaines, 27 dizaines et 14 unités)
    let cc = c;
    let dd = d;
    let uu = u;
    if (cc > 0 && rng.chance(0.7)) {
      const k = rng.int(1, cc);
      cc -= k;
      dd += 10 * k;
    }
    if (dd > 0) {
      dd -= 1;
      uu += 10;
    }
    if (cc !== c || dd !== d) {
      const parts = rng.shuffle([cent(cc), diz(dd), uni(uu)].filter((p) => !p.startsWith('0 ')));
      out.push({
        texte: parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1],
        court: `${cc} c ${dd} d ${uu} u`,
        expl: `On regroupe : ${valeurs(cc, dd, uu)} (10 unités font 1 dizaine, 10 dizaines font 1 centaine).`,
      });
    }
  }
  return out;
}

const nombreDecomp = (level: Level, rng: Rng) =>
  parNiv(level, {
    facile: rng.int(100, 199),
    normal: rng.chance(0.25) ? rng.int(1, 9) * 100 + rng.int(0, 9) : rng.int(101, 999),
    plus_loin: rng.int(210, 999),
  });

const decompNumeric: ItemGen = (level, rng, ctx) => {
  const n = nombreDecomp(level, rng);
  const c = Math.floor(n / 100);
  const d = Math.floor(n / 10) % 10;
  const u = n % 10;
  const r = rng.next();
  if (r < 0.65) {
    const all = ecritures(n, level, rng);
    const e = level === 'plus_loin' && all.length > 5 ? all[all.length - 1]! : rng.pick(all);
    return numeric(ctx, `construire-${e.court}`, {
      prompt: `${e.texte} = …`,
      spoken: `${e.texte}, ça fait combien ?`,
      answer: n,
      explication: e.expl,
      difficulty: clamp01(0.3 + all.indexOf(e) * 0.1 + (level === 'plus_loin' ? 0.3 : 0)),
      meta: { construire: true },
    });
  }
  if ((r < 0.85 && level !== 'plus_loin') || level === 'facile') {
    const rang = rng.pick(['centaines', 'dizaines', 'unités'] as const);
    const val = rang === 'centaines' ? c : rang === 'dizaines' ? d : u;
    return numeric(ctx, `chiffre-${rang}-${n}`, {
      prompt: `Quel est le chiffre des ${rang} de ${fmt(n)} ?`,
      answer: val,
      explication: `Dans ${fmt(n)}, ${c} est le chiffre des centaines, ${d} celui des dizaines et ${u} celui des unités.`,
      difficulty: 0.2,
    });
  }
  return numeric(ctx, `nbdiz-${n}`, {
    prompt: `Combien y a-t-il de dizaines en tout dans ${fmt(n)} ?`,
    answer: Math.floor(n / 10),
    explication: `${fmt(n)}, c’est ${cent(c)}, ${diz(d)} et ${uni(u)} ; ${cent(c)} = ${c * 10} dizaines, donc ${c * 10} + ${d} = ${Math.floor(n / 10)} dizaines.`,
    difficulty: 0.7,
  });
};

const decompTrou: ItemGen = (level, rng, ctx) => {
  const n = nombreDecomp(level, rng);
  const c = Math.floor(n / 100);
  const d = Math.floor(n / 10) % 10;
  const u = n % 10;
  let forme = level === 'facile' ? 0 : rng.int(0, 2);
  if (forme === 1 && [c, d, u].filter((x) => x > 0).length < 2) forme = 0;
  let sentence: string;
  let answer: number;
  if (forme === 0) {
    const k = rng.int(0, 2);
    const parts = [`${c} c`, `${d} d`, `${u} u`];
    answer = [c, d, u][k]!;
    parts[k] = `___ ${['c', 'd', 'u'][k]}`;
    sentence = `${fmt(n)} = ${parts.join(' ')}`;
  } else if (forme === 1) {
    const terms = [c * 100, d * 10, u].filter((t) => t > 0);
    const k = rng.int(0, terms.length - 1);
    answer = terms[k]!;
    sentence = `${fmt(n)} = ${terms.map((t, i) => (i === k ? '___' : String(t))).join(' + ')}`;
  } else {
    answer = Math.floor(n / 10);
    sentence = `${fmt(n)} = ___ dizaines et ${uni(u)}`;
  }
  const choices =
    level === 'facile'
      ? rng.shuffle([...new Set([String(answer), String(answer + 1), String(Math.max(0, answer - 1))])])
      : undefined;
  return make(ctx, 'fill_blank', `trou-${forme}-${sentence}`, {
    sentence,
    answer: String(answer),
    choices,
    explication: `${fmt(n)}, c’est ${cent(c)}, ${diz(d)} et ${uni(u)} : ${c * 100} + ${d * 10} + ${u}.`,
    difficulty: clamp01(0.25 + forme * 0.25),
  });
};

/** Permutations distinctes de 3 chiffres (sans zéro en tête). */
function permutations(n: number): number[] {
  const [a, b, c] = chiffres(n) as [number, number, number];
  const p = [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ]
    .filter((x) => x[0] !== 0)
    .map((x) => x[0]! * 100 + x[1]! * 10 + x[2]!);
  return [...new Set(p)];
}

const decompPaires: ItemGen = (level, rng, ctx) => {
  const nb = level === 'facile' ? 3 : 4;
  let nombres: number[];
  if (level === 'facile') nombres = distinctInts(rng, nb, 100, 199);
  else {
    let base = rng.int(123, 987);
    while (new Set(String(base)).size < 3 || String(base).includes('0')) base = rng.int(123, 987);
    nombres = rng.shuffle(permutations(base)).slice(0, nb);
  }
  const pairs = nombres.map((n) => {
    const e = rng.pick(ecritures(n, level, rng));
    return { left: e.court, right: fmt(n) };
  });
  return make(ctx, 'pairing', `paires-${pairs.map((p) => p.left).join('|')}`, {
    prompt: 'Associe chaque écriture au bon nombre.',
    pairs,
    relation: 'écriture → nombre',
    explication: 'Regarde bien le rang de chaque chiffre : c = centaines, d = dizaines, u = unités.',
    difficulty: level === 'facile' ? 0.3 : 0.6,
  });
};

const decompQcm: ItemGen = (level, rng, ctx) => {
  let n = nombreDecomp(level, rng);
  if (level !== 'facile')
    while (new Set(String(n)).size < 3 || String(n).includes('0')) n = rng.int(123, 987);
  const all = ecritures(n, level, rng);
  const k = rng.int(0, all.length - 1);
  const good = all[k]!.texte;
  const wrong =
    level === 'facile'
      ? [n + 10, n - 10, n + 1].map((x) => ecritures(x, level, rng)[0]!.texte)
      : permutations(n)
          .filter((x) => x !== n)
          .map((x) => (ecritures(x, level, rng)[k] ?? ecritures(x, level, rng)[0]!).texte);
  return mcq(ctx, rng, `qcm-${n}-${k}`, {
    question: `Quelle écriture est égale à ${fmt(n)} ?`,
    good,
    wrong,
    explication: `${fmt(n)} = ${all[0]!.texte} = ${all[1]?.texte ?? all[0]!.court}.`,
    difficulty: clamp01(0.3 + k * 0.1),
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.COMPARER                                                 */
/* ------------------------------------------------------------------ */

const RANGS = ['unités', 'dizaines', 'centaines', 'milliers'];

/** Phrase d'enfant qui justifie la comparaison de deux entiers. */
function expliqueComparaison(a: number, b: number): string {
  const sa = String(a);
  const sb = String(b);
  const sym = a < b ? '<' : a > b ? '>' : '=';
  if (a === b) return `${fmt(a)} = ${fmt(b)} : c’est le même nombre.`;
  if (sa.length !== sb.length)
    return `${fmt(a)} ${sym} ${fmt(b)} : le nombre qui a le plus de chiffres est le plus grand.`;
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) {
      const rang = RANGS[sa.length - 1 - i]!;
      const avant = i > 0 ? 'On regarde d’abord le chiffre de gauche, puis le suivant : ' : '';
      return `${avant}${sa[i]} ${rang} ${a < b ? 'c’est moins que' : 'c’est plus que'} ${sb[i]} ${rang}, donc ${fmt(a)} ${sym} ${fmt(b)}.`;
    }
  }
  return `${fmt(a)} ${sym} ${fmt(b)}.`;
}

const bornesCmp = (level: Level) =>
  parNiv(level, { facile: [1, 100], normal: [100, 1000], plus_loin: [1000, 9999] } as const);

/** Deux nombres proches (mêmes chiffres échangés, un seul rang différent, nombre de chiffres différent). */
function paireProche(level: Level, rng: Rng): [number, number] {
  const [min, max] = bornesCmp(level);
  const a = rng.int(min, max);
  const r = rng.next();
  let b: number;
  if (r < 0.3) b = voisinsConfusion(a, rng, max)[0] ?? a + 1;
  else if (r < 0.6) {
    const pas = rng.pick(level === 'facile' ? [1, 10] : level === 'normal' ? [1, 10, 100] : [10, 100, 1000]);
    b = a + (rng.chance(0.5) ? pas : -pas);
  } else if (r < 0.75 && level !== 'facile') b = rng.int(Math.floor(min / 10), min - 1);
  else b = rng.int(min, max);
  if (b < 1 || b > max || b === a) b = a === max ? a - 1 : a + 1;
  return rng.chance(0.5) ? [a, b] : [b, a];
}

const comparerQcm: ItemGen = (level, rng, ctx) => {
  // Parfois « = » avec deux écritures différentes du même nombre (niveau normal et plus)
  if (level !== 'facile' && rng.chance(0.15)) {
    const n = rng.int(101, 999);
    const e = rng.pick(ecritures(n, 'normal', rng).slice(1));
    const gauche = rng.chance(0.5) ? e.court : fmt(n);
    const droite = gauche === e.court ? fmt(n) : e.court;
    return mcq(ctx, rng, `cmp-eq-${gauche}-${droite}`, {
      question: `Compare : ${gauche} … ${droite}`,
      spoken: `Compare ${gauche} et ${droite}.`,
      good: '=',
      wrong: ['<', '>'],
      fixedOrder: ['<', '=', '>'],
      explication: `${e.court} = ${fmt(n)} : ce sont deux écritures du même nombre.`,
      difficulty: 0.7,
      meta: { gauche, droite },
    });
  }
  const [a, b] = paireProche(level, rng);
  const sym = a < b ? '<' : '>';
  return mcq(ctx, rng, `cmp-${a}-${b}`, {
    question: `Compare : ${fmt(a)} … ${fmt(b)}`,
    spoken: `Compare ${a} et ${b}.`,
    good: sym,
    wrong: ['<', '=', '>'].filter((s) => s !== sym),
    fixedOrder: ['<', '=', '>'],
    explication: expliqueComparaison(a, b),
    difficulty: clamp01(Math.abs(a - b) < 20 ? 0.6 : 0.35),
    meta: { gauche: fmt(a), droite: fmt(b) },
  });
};

const comparerRanger: ItemGen = (level, rng, ctx) => {
  const nb = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
  const [min, max] = bornesCmp(level);
  // Nombres proches, comme dans l'exemple BO : 234, 243, 239, 300, 229
  const centre = rng.int(min, max);
  const ecart = parNiv(level, { facile: 30, normal: 80, plus_loin: 800 });
  const ns = distinctInts(rng, nb, Math.max(min, centre - ecart), Math.min(max, centre + ecart));
  const croissant = level === 'facile' || rng.chance(0.6);
  const sorted = [...ns].sort((x, y) => (croissant ? x - y : y - x));
  return make(ctx, 'ordering', `ranger-${croissant ? 'c' : 'd'}-${sorted.join('-')}`, {
    prompt: croissant
      ? 'Range ces nombres du plus petit au plus grand.'
      : 'Range ces nombres du plus grand au plus petit.',
    elements: sorted.map(fmt),
    mode: croissant ? 'croissant' : 'decroissant',
    explication:
      'Compare d’abord le chiffre de gauche (le plus grand rang), puis le suivant si c’est le même.',
    difficulty: clamp01(0.2 + nb * 0.1),
  });
};

const comparerVraiFaux: ItemGen = (level, rng, ctx) => {
  const [a, b] = paireProche(level, rng);
  const forme = rng.int(0, 2);
  if (forme === 2) {
    const [min, max] = bornesCmp(level);
    const pas = parNiv(level, { facile: 10, normal: 100, plus_loin: 1000 });
    let x = rng.int(min, max - 1);
    if (x % pas === 0) x += 1;
    let lo = Math.floor(x / pas) * pas + (rng.chance(0.3) ? pas : 0);
    if (lo + pas > max) lo = Math.floor(x / pas) * pas;
    const hi = lo + pas;
    const vrai = x > lo && x < hi;
    return make(ctx, 'true_false', `entre-${x}-${lo}`, {
      statement: `${fmt(x)} est compris entre ${fmt(lo)} et ${fmt(hi)}.`,
      answer: vrai,
      explication: vrai
        ? `${fmt(lo)} < ${fmt(x)} < ${fmt(hi)} : ${fmt(x)} est bien entre les deux.`
        : `${fmt(x)} n’est pas entre ${fmt(lo)} et ${fmt(hi)} : ${expliqueComparaison(x, lo)}`,
      difficulty: 0.5,
    });
  }
  const montre = rng.chance(0.5) ? '<' : '>';
  const vrai = montre === '<' ? a < b : a > b;
  const mots = montre === '<' ? 'est plus petit que' : 'est plus grand que';
  return make(ctx, 'true_false', `vf-${a}-${montre}-${b}-${forme}`, {
    statement: forme === 0 ? `${fmt(a)} ${montre} ${fmt(b)}` : `${fmt(a)} ${mots} ${fmt(b)}.`,
    spoken: `${a} ${mots} ${b}.`,
    answer: vrai,
    explication: expliqueComparaison(a, b),
    difficulty: Math.abs(a - b) < 20 ? 0.6 : 0.35,
  });
};

const comparerNumeric: ItemGen = (level, rng, ctx) => {
  const [min, max] = bornesCmp(level);
  const forme = rng.int(0, 2);
  const pas = parNiv(level, { facile: 10, normal: 100, plus_loin: 1000 });
  if (forme === 0) {
    const x = rng.int(min + 1, max - 1);
    return numeric(ctx, `entre-${x}`, {
      prompt: `Quel nombre est compris entre ${fmt(x - 1)} et ${fmt(x + 1)} ?`,
      answer: x,
      explication: `${fmt(x - 1)} < ${fmt(x)} < ${fmt(x + 1)}.`,
      difficulty: 0.3,
    });
  }
  // Juste avant / juste après un passage de dizaine ou de centaine
  const k = rng.int(Math.max(1, Math.ceil(min / pas)), Math.floor(max / pas));
  const rond = k * pas;
  if (forme === 1 && rond - 1 >= 1)
    return numeric(ctx, `avant-${rond}`, {
      prompt: `Quel nombre vient juste avant ${fmt(rond)} ?`,
      answer: rond - 1,
      explication: `Juste avant ${fmt(rond)}, on enlève 1 : ${fmt(rond - 1)}.`,
      difficulty: 0.6,
    });
  const x = rond - 1;
  return numeric(ctx, `apres-${x}`, {
    prompt: `Quel nombre vient juste après ${fmt(x)} ?`,
    answer: x + 1,
    explication: `${fmt(x)} + 1 = ${fmt(x + 1)} : on change de ${pas === 10 ? 'dizaine' : pas === 100 ? 'centaine' : 'millier'}.`,
    difficulty: 0.55,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.DROITE — demi-droite graduée                             */
/* ------------------------------------------------------------------ */

const droiteLigne: ItemGen = (level, rng, ctx) => {
  type Cfg = { min: number; max: number; step: number; sub?: number; target: number; tol: number; d: number };
  let cfg: Cfg;
  if (level === 'facile') {
    const m = rng.int(0, 9) * 10;
    cfg = { min: m, max: m + 10, step: 1, target: m + rng.int(1, 10), tol: 0.4, d: 0.2 };
  } else if (level === 'normal') {
    const forme = rng.int(0, 3);
    if (forme === 0) {
      const m = rng.int(0, 9) * 100;
      cfg = { min: m, max: m + 100, step: 10, target: m + rng.int(1, 10) * 10, tol: 3, d: 0.4 };
    } else if (forme === 1) {
      cfg = { min: 0, max: 1000, step: 100, target: rng.int(1, 10) * 100, tol: 30, d: 0.35 };
    } else if (forme === 2) {
      cfg = { min: 0, max: 1000, step: 100, sub: 10, target: rng.int(1, 99) * 10, tol: 8, d: 0.7 };
    } else {
      const m = rng.int(10, 99) * 10;
      cfg = { min: m, max: m + 10, step: 1, target: m + rng.int(1, 10), tol: 0.4, d: 0.45 };
    }
  } else {
    const forme = rng.int(0, 3);
    if (forme === 0) {
      const m = rng.int(0, 18) * 50;
      cfg = { min: m, max: m + 50, step: 5, target: m + rng.int(1, 10) * 5, tol: 1.5, d: 0.6 };
    } else if (forme === 1) {
      cfg = { min: 0, max: 250, step: 25, target: rng.int(1, 10) * 25, tol: 8, d: 0.7 };
    } else if (forme === 2) {
      cfg = { min: 0, max: 500, step: 50, target: rng.int(1, 19) * 25, tol: 8, d: 0.8 };
    } else {
      cfg = { min: 0, max: 10000, step: 1000, sub: 10, target: rng.int(1, 99) * 100, tol: 80, d: 0.85 };
    }
  }
  const { min, max, step, sub, target, tol, d } = cfg;
  const bas = Math.floor(target / step) * step;
  return make(ctx, 'number_line', `droite-${min}-${max}-${step}-${target}`, {
    prompt: `Place ${fmt(target)} sur la droite graduée.`,
    spoken: `Place ${target} sur la droite graduée.`,
    min,
    max,
    step,
    subdivisions: sub,
    target,
    display: fmt(target),
    tolerance: tol,
    explication:
      target === bas
        ? `Les graduations vont de ${fmt(step)} en ${fmt(step)} : ${fmt(target)} est sur une graduation.`
        : `Les graduations vont de ${fmt(step)} en ${fmt(step)} : ${fmt(target)} est entre ${fmt(bas)} et ${fmt(bas + step)}.`,
    difficulty: d,
  });
};

const droiteNumeric: ItemGen = (level, rng, ctx) => {
  const pas = parNiv(level, {
    facile: rng.pick([1, 1, 10]),
    normal: rng.pick([1, 10, 100]),
    plus_loin: rng.pick([5, 25, 50]),
  });
  const maxi = parNiv(level, { facile: 100, normal: 1000, plus_loin: 1000 });
  const forme = rng.int(0, level === 'facile' ? 1 : 2);
  if (forme === 2) {
    // Milieu entre deux graduations
    const p = pas === 1 ? 10 : pas === 10 ? 100 : pas === 100 ? 100 : pas * 2;
    const a = rng.int(0, Math.floor((maxi - p) / p)) * p;
    return numeric(ctx, `milieu-${a}-${p}`, {
      prompt: `Quel nombre est au milieu entre ${fmt(a)} et ${fmt(a + p)} sur la droite graduée ?`,
      answer: a + p / 2,
      explication: `De ${fmt(a)} à ${fmt(a + p)}, il y a ${p} ; la moitié de ${p} est ${p / 2}, donc le milieu est ${fmt(a + p / 2)}.`,
      difficulty: 0.75,
    });
  }
  const depart = rng.int(0, Math.floor((maxi - 4 * pas) / pas)) * pas;
  const suite = [0, 1, 2, 3].map((k) => depart + k * pas);
  const trou = forme === 0 ? 3 : rng.int(1, 2);
  const montre = suite.map((x, i) => (i === trou ? '…' : fmt(x))).join(', ');
  return numeric(ctx, `grad-${pas}-${depart}-${trou}`, {
    prompt: `Graduations de ${pas} en ${pas} : ${montre}`,
    spoken: `Sur la droite graduée de ${pas} en ${pas}, quel nombre manque ?`,
    answer: suite[trou]!,
    explication: `On avance de ${pas} à chaque graduation : ${suite.map(fmt).join(', ')}.`,
    difficulty: clamp01(0.25 + (pas >= 25 ? 0.3 : pas === 10 ? 0.1 : 0) + (trou < 3 ? 0.1 : 0)),
  });
};

const droiteEncadrer: ItemGen = (level, rng, ctx) => {
  const pas = parNiv(level, { facile: 10, normal: rng.pick([10, 100]), plus_loin: rng.pick([100, 1000]) });
  const maxi = parNiv(level, { facile: 100, normal: 1000, plus_loin: 10000 });
  let x = rng.int(pas + 1, maxi - 1);
  if (x % pas === 0) x += 1;
  const lo = Math.floor(x / pas) * pas;
  const opt = (a: number) => `${fmt(a)} et ${fmt(a + pas)}`;
  return mcq(ctx, rng, `encadrer-${x}-${pas}`, {
    question: `Sur une droite graduée de ${fmt(pas)} en ${fmt(pas)}, entre quelles graduations se trouve ${fmt(x)} ?`,
    good: opt(lo),
    wrong: [lo - pas, lo + pas, lo + 2 * pas, lo - 2 * pas].filter((a) => a >= 0 && a + pas <= maxi).map(opt),
    explication: `${fmt(lo)} < ${fmt(x)} < ${fmt(lo + pas)}.`,
    difficulty: 0.4,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.PARITE                                                   */
/* ------------------------------------------------------------------ */

const estPair = (n: number) => n % 2 === 0;
const regleParite = (n: number) =>
  `${fmt(n)} se termine par ${n % 10} : ${estPair(n) ? 'il est pair (0, 2, 4, 6 ou 8 à la fin)' : 'il est impair (1, 3, 5, 7 ou 9 à la fin)'}.`;
const maxParite = (level: Level) => parNiv(level, { facile: 20, normal: 1000, plus_loin: 1000 });

const pariteClasser: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin') {
    // Règles de somme : on classe le résultat sans forcément le calculer
    const elements = Array.from({ length: 6 }, () => {
      const a = rng.int(11, 99);
      const b = rng.int(11, 99);
      return { label: `${a} + ${b}`, category: estPair(a + b) ? 0 : 1 };
    });
    elements[0]!.category = 0;
    elements[0]!.label = `${2 * rng.int(6, 49)} + ${2 * rng.int(6, 49)}`;
    elements[1]!.category = 1;
    elements[1]!.label = `${2 * rng.int(6, 49)} + ${2 * rng.int(6, 49) + 1}`;
    const uniq = [...new Map(elements.map((e) => [e.label, e])).values()];
    return make(ctx, 'classification', `somme-${uniq.map((e) => e.label).join('|')}`, {
      prompt: 'Le résultat est-il pair ou impair ?',
      categories: ['pair', 'impair'],
      elements: uniq,
      explication: 'Pair + pair = pair, impair + impair = pair, pair + impair = impair.',
      difficulty: 0.7,
    });
  }
  const nb = level === 'facile' ? 6 : 8;
  const ns = distinctInts(rng, nb, 1, maxParite(level));
  ns[0] = ns[0]! % 2 === 0 ? ns[0]! : ns[0]! + 1 > maxParite(level) ? ns[0]! - 1 : ns[0]! + 1;
  const uniq = [...new Set(ns)];
  if (!uniq.some((n) => !estPair(n))) uniq.push(uniq.includes(1) ? 3 : 1);
  return make(ctx, 'classification', `parite-${uniq.join('|')}`, {
    prompt: 'Range chaque nombre : pair ou impair ?',
    categories: ['pair', 'impair'],
    elements: uniq.map((n) => ({ label: fmt(n), category: estPair(n) ? 0 : 1 })),
    explication: 'Un nombre pair se termine par 0, 2, 4, 6 ou 8 ; un nombre impair par 1, 3, 5, 7 ou 9.',
    difficulty: level === 'facile' ? 0.2 : 0.4,
  });
};

const REGLES_SOMME: [string, boolean, string][] = [
  ['La somme de deux nombres pairs est toujours paire.', true, 'Pair + pair = pair (ex. 4 + 6 = 10).'],
  [
    'La somme de deux nombres impairs est toujours impaire.',
    false,
    'Impair + impair = pair (ex. 3 + 5 = 8).',
  ],
  [
    'La somme d’un nombre pair et d’un nombre impair est impaire.',
    true,
    'Pair + impair = impair (ex. 4 + 3 = 7).',
  ],
  [
    'Le double d’un nombre est toujours pair.',
    true,
    'Le double, c’est 2 fois le nombre : il est toujours pair.',
  ],
  [
    'Un nombre qui se termine par 0 est impair.',
    false,
    'Un nombre qui se termine par 0 est pair (10, 20, 100…).',
  ],
];

const pariteVraiFaux: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    const a = rng.int(11, 99);
    const b = rng.int(11, 99);
    const ditPair = rng.chance(0.5);
    return make(ctx, 'true_false', `somme-${a}-${b}-${ditPair}`, {
      statement: `${a} + ${b} est un nombre ${ditPair ? 'pair' : 'impair'}.`,
      answer: ditPair === estPair(a + b),
      explication: `${a} est ${estPair(a) ? 'pair' : 'impair'} et ${b} est ${estPair(b) ? 'pair' : 'impair'} : la somme est ${estPair(a + b) ? 'paire' : 'impaire'} (${a + b}).`,
      difficulty: 0.7,
    });
  }
  if (level === 'plus_loin') {
    const [s, v, e] = rng.pick(REGLES_SOMME);
    return make(ctx, 'true_false', `regle-${s}`, {
      statement: s,
      answer: v,
      explication: e,
      difficulty: 0.7,
    });
  }
  const n = rng.int(1, maxParite(level));
  const ditPair = rng.chance(0.5);
  return make(ctx, 'true_false', `vf-${n}-${ditPair}`, {
    statement: `${fmt(n)} est un nombre ${ditPair ? 'pair' : 'impair'}.`,
    answer: ditPair === estPair(n),
    explication: regleParite(n),
    difficulty: n > 100 ? 0.4 : 0.2,
  });
};

const pariteNumeric: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const n = rng.int(1, 18);
    const cherchePair = rng.chance(0.5);
    const rep = n + (estPair(n + 1) === cherchePair ? 1 : 2);
    return numeric(ctx, `suivant-${n}-${cherchePair}`, {
      prompt: `Quel est le premier nombre ${cherchePair ? 'pair' : 'impair'} après ${n} ?`,
      answer: rep,
      explication: regleParite(rep),
      difficulty: 0.2,
    });
  }
  // BO : « donner tous les nombres pairs compris entre 767 et 778 » — bornes choisies pour éviter
  // toute ambiguïté (aucune borne n'est elle-même du type cherché).
  const cherchePair = rng.chance(0.5);
  const largeur = parNiv(level, { facile: 8, normal: rng.int(5, 8) * 2, plus_loin: rng.int(10, 20) * 2 });
  let a = rng.int(11, 999 - largeur);
  if (estPair(a) === cherchePair) a += 1;
  const b = a + largeur;
  let count = 0;
  for (let x = a + 1; x < b; x++) if (estPair(x) === cherchePair) count++;
  const type = cherchePair ? 'pairs' : 'impairs';
  return numeric(ctx, `compte-${a}-${b}-${type}`, {
    prompt: `Combien y a-t-il de nombres ${type} compris entre ${fmt(a)} et ${fmt(b)} ?`,
    answer: count,
    explication: `Les nombres ${type} entre ${fmt(a)} et ${fmt(b)} sont : ${Array.from({ length: count }, (_, i) => fmt(a + 1 + 2 * i)).join(', ')}.`,
    difficulty: clamp01(0.4 + largeur / 60),
  });
};

const pariteQcm: ItemGen = (level, rng, ctx) => {
  const cherchePair = rng.chance(0.5);
  const max = maxParite(level);
  if (level === 'plus_loin') {
    const somme = () => {
      const a = rng.int(11, 99);
      const b = rng.int(11, 99);
      return { t: `${a} + ${b}`, p: estPair(a + b) };
    };
    const opts = Array.from({ length: 12 }, somme);
    const good = opts.find((o) => o.p === cherchePair);
    const wrong = opts.filter((o) => o.p !== cherchePair).map((o) => o.t);
    if (good && wrong.length >= 2)
      return mcq(ctx, rng, `somme-${good.t}`, {
        question: `Quelle somme est ${cherchePair ? 'paire' : 'impaire'} ?`,
        good: good.t,
        wrong,
        explication: 'Pair + pair = pair, impair + impair = pair, pair + impair = impair.',
        difficulty: 0.7,
      });
  }
  const ns = distinctInts(rng, 12, 1, max);
  const good = ns.find((n) => estPair(n) === cherchePair) ?? (cherchePair ? 2 : 1);
  return mcq(ctx, rng, `qcm-${good}-${cherchePair}`, {
    question: `Lequel de ces nombres est ${cherchePair ? 'pair' : 'impair'} ?`,
    good: fmt(good),
    wrong: ns.filter((n) => estPair(n) !== cherchePair).map(fmt),
    explication: regleParite(good),
    difficulty: level === 'facile' ? 0.2 : 0.4,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.NUM.ORDINAUX — rangs et suites                               */
/* ------------------------------------------------------------------ */

/** Ordinal en lettres : 1 → premier, 21 → vingt-et-unième, 80 → quatre-vingtième. */
export function ordinalEnLettres(n: number): string {
  if (n === 1) return 'premier';
  const c = nombreEnLettres(n);
  if (/cinq$/.test(c)) return c + 'uième';
  if (/neuf$/.test(c)) return c.replace(/neuf$/, 'neuvième');
  if (/vingts$/.test(c)) return c.replace(/vingts$/, 'vingtième');
  if (/cents$/.test(c)) return c.replace(/cents$/, 'centième');
  if (/e$/.test(c)) return c.slice(0, -1) + 'ième';
  return c + 'ième';
}
/** Abréviation : 1er, 2e, 48e. */
export const ordinalCourt = (n: number) => (n === 1 ? '1er' : `${n}e`);

const FILLES = new Set(['Lucie', 'Inès', 'Jade', 'Zoé', 'Lina', 'Maya']);
const lui = (qui: string) => (FILLES.has(qui) ? 'elle' : 'lui');
const PRENOMS = [
  'Léo',
  'Lucie',
  'Inès',
  'Malo',
  'Sami',
  'Jade',
  'Noé',
  'Zoé',
  'Hugo',
  'Lina',
  'Enzo',
  'Maya',
];

const ordinauxNumeric: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin') {
    // Suites évolutives (BO) : 1, 2, 4, 7, 11, 16… ; 1, 2, 4, 8, 16…
    const forme = rng.int(0, 1);
    const rang = forme === 0 ? rng.int(8, 15) : rng.int(6, 10);
    const terme = (k: number) => (forme === 0 ? 1 + ((k - 1) * k) / 2 : 2 ** (k - 1));
    const debut = [1, 2, 3, 4, 5, 6].map(terme);
    return numeric(ctx, `evol-${forme}-${rang}`, {
      prompt: `Dans la suite ${debut.join(', ')}…, quel est le ${ordinalCourt(rang)} nombre ?`,
      spoken: `Dans la suite ${debut.join(', ')}, et ainsi de suite, quel est le ${ordinalEnLettres(rang)} nombre ?`,
      answer: terme(rang),
      explication:
        forme === 0
          ? 'On ajoute 1, puis 2, puis 3, puis 4… : on continue la suite jusqu’au rang demandé.'
          : 'Chaque nombre est le double du précédent : on continue jusqu’au rang demandé.',
      difficulty: 0.85,
    });
  }
  const max = parNiv(level, { facile: 20, normal: 100, plus_loin: 100 });
  const forme = rng.int(0, level === 'facile' ? 1 : 3);
  const qui = rng.pick(PRENOMS);
  if (forme === 0) {
    const r = rng.int(2, max);
    return numeric(ctx, `devant-${r}`, {
      prompt: `${qui} est ${ordinalCourt(r)} dans la file. Combien de personnes sont devant ${qui} ?`,
      spoken: `${qui} est ${ordinalEnLettres(r)} dans la file. Combien de personnes sont devant ${qui} ?`,
      answer: r - 1,
      explication: `${qui} est ${ordinalCourt(r)} : il y a ${r - 1} personne${r > 2 ? 's' : ''} devant ${lui(qui)}, on ne se compte pas soi-même.`,
      difficulty: 0.3,
    });
  }
  if (forme === 1) {
    const total = rng.int(5, max);
    const r = rng.int(1, total - 1);
    return numeric(ctx, `derriere-${total}-${r}`, {
      prompt: `${total} enfants font la course. ${qui} arrive ${ordinalCourt(r)}. Combien d’enfants arrivent après ${qui} ?`,
      spoken: `${total} enfants font la course. ${qui} arrive ${ordinalEnLettres(r)}. Combien d’enfants arrivent après ${qui} ?`,
      answer: total - r,
      explication:
        r === 1
          ? `${qui} est arrivé en premier : tous les autres arrivent après, ${total} − 1 = ${total - 1}.`
          : `${qui} et les ${r - 1} enfant${r > 2 ? 's' : ''} arrivé${r > 2 ? 's' : ''} avant, ça fait ${r} enfants ; ${total} − ${r} = ${total - r}.`,
      difficulty: 0.55,
    });
  }
  if (forme === 2) {
    // BO : Tour de France, 167 cyclistes, combien avant le 48e ?
    const total = rng.int(120, 190);
    const r = rng.int(20, 99);
    return numeric(ctx, `tour-${total}-${r}`, {
      prompt: `Dans une étape du Tour de France, ${total} cyclistes arrivent. Combien sont arrivés avant le ${ordinalCourt(r)} ?`,
      spoken: `Dans une étape du Tour de France, ${total} cyclistes arrivent. Combien sont arrivés avant le ${ordinalEnLettres(r)} ?`,
      answer: r - 1,
      explication: `Avant le ${ordinalCourt(r)}, il y a les coureurs du 1er au ${ordinalCourt(r - 1)} : ${r - 1} coureurs.`,
      difficulty: 0.6,
    });
  }
  // Suite répétitive de nombres impairs (BO : 1, 3, 5, 7, 9… quel est le 17e nombre ?)
  const r = rng.int(8, 30);
  return numeric(ctx, `impairs-${r}`, {
    prompt: `Dans la suite 1, 3, 5, 7, 9…, quel est le ${ordinalCourt(r)} nombre ?`,
    spoken: `Dans la suite 1, 3, 5, 7, 9, et ainsi de suite, quel est le ${ordinalEnLettres(r)} nombre ?`,
    answer: 2 * r - 1,
    explication: `On avance de 2 à chaque rang : le ${ordinalCourt(r)} nombre est ${2 * r - 1}.`,
    difficulty: 0.75,
  });
};

const MOTIFS = [
  ['A', 'B'],
  ['△', '▢', '○'],
  ['A', 'B', 'G', 'F'],
  ['△', '✕', '▢', '○'],
  ['🔴', '🔵'],
  ['🍎', '🍐', '🍌'],
];

const ordinauxQcm: ItemGen = (level, rng, ctx) => {
  const forme = rng.int(0, 2);
  if (forme === 2) {
    // Lire un ordinal écrit en abrégé
    const r = level === 'facile' ? rng.int(1, 20) : rng.int(2, 100);
    const good = ordinalEnLettres(r);
    const wrong = [nombreEnLettres(r), ordinalEnLettres(r + 1), ordinalEnLettres(Math.max(2, r - 1))];
    return mcq(ctx, rng, `lire-${r}`, {
      question: `Comment lit-on « ${ordinalCourt(r)} » ?`,
      good,
      wrong,
      explication: `« ${ordinalCourt(r)} » se lit « ${good} » : c’est un rang, pas une quantité.`,
      difficulty: r > 20 ? 0.5 : 0.25,
    });
  }
  if (level === 'plus_loin') {
    // Suite évolutive de symboles (BO) : △ ✕ △ ✕✕ △ ✕✕✕ …
    const seq: string[] = [];
    for (let k = 1; seq.length < 120; k++) seq.push('△', ...Array<string>(k).fill('✕'));
    const r = rng.int(12, 40);
    return mcq(ctx, rng, `evol-sym-${r}`, {
      question: `Dans la suite △ ✕ △ ✕ ✕ △ ✕ ✕ ✕ △ …, quel est le ${ordinalCourt(r)} symbole ?`,
      good: seq[r - 1]!,
      wrong: ['△', '✕'],
      fixedOrder: ['△', '✕'],
      explication: `On écrit la suite jusqu’au ${ordinalCourt(r)} rang : à chaque fois, il y a une croix de plus.`,
      difficulty: 0.85,
    });
  }
  const motif = rng.pick(level === 'facile' ? MOTIFS.filter((m) => m.length <= 3) : MOTIFS);
  const r = level === 'facile' ? rng.int(6, 20) : rng.int(21, 100);
  const good = motif[(r - 1) % motif.length]!;
  const affiche = Array.from(
    { length: Math.max(6, motif.length * 2) },
    (_, i) => motif[i % motif.length],
  ).join(' ');
  return mcq(ctx, rng, `motif-${motif.join('')}-${r}`, {
    question: `Dans la suite ${affiche} …, quel est le ${ordinalCourt(r)} élément ?`,
    spoken: `Dans cette suite qui se répète, quel est le ${ordinalEnLettres(r)} élément ?`,
    good,
    wrong: motif.filter((m) => m !== good),
    fixedOrder: motif,
    explication:
      r % motif.length === 0
        ? `Le motif ${motif.join(' ')} a ${motif.length} éléments : le ${ordinalCourt(r)} élément termine un motif, c’est donc ${good}.`
        : `Le motif ${motif.join(' ')} a ${motif.length} éléments : le ${ordinalCourt(r - (r % motif.length))} élément termine un motif, donc le ${ordinalCourt(r)} est ${good}.`,
    difficulty: clamp01(0.4 + r / 250 + motif.length * 0.05),
  });
};

const ordinauxVraiFaux: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin') {
    const rang = rng.int(6, 10);
    const vrai = 2 ** (rang - 1);
    const dit = rng.chance(0.5) ? vrai : rng.pick([vrai / 2, vrai * 2, vrai + 2]);
    return make(ctx, 'true_false', `evol-${rang}-${dit}`, {
      statement: `Dans la suite 1, 2, 4, 8, 16…, le ${ordinalCourt(rang)} nombre est ${fmt(dit)}.`,
      spoken: `Dans la suite 1, 2, 4, 8, 16, et ainsi de suite, le ${ordinalEnLettres(rang)} nombre est ${dit}.`,
      answer: dit === vrai,
      explication: `Chaque nombre est le double du précédent : 1, 2, 4, 8, 16, 32, 64… le ${ordinalCourt(rang)} est ${fmt(vrai)}.`,
      difficulty: 0.85,
    });
  }
  const max = level === 'facile' ? 20 : 100;
  const r = rng.int(2, max);
  const qui = rng.pick(PRENOMS);
  const dit = rng.chance(0.5) ? r - 1 : r;
  return make(ctx, 'true_false', `devant-${r}-${dit}`, {
    statement: `${qui} est ${ordinalCourt(r)} dans la file : il y a ${dit} personne${dit > 1 ? 's' : ''} devant ${qui}.`,
    spoken: `${qui} est ${ordinalEnLettres(r)} dans la file : il y a ${dit} personnes devant ${qui}.`,
    answer: dit === r - 1,
    explication: `${qui} est ${ordinalCourt(r)} : il y a ${r - 1} personne${r > 2 ? 's' : ''} devant ${lui(qui)}.`,
    difficulty: 0.4,
  });
};

/* ------------------------------------------------------------------ */

export const NOMBRES: Record<string, LessonContent> = {
  'CE1.MA.NUM.ECRIRE': {
    gens: {
      numeric_answer: ecrireDictee,
      mcq: ecrireLettresQcm,
      fill_blank: ecrireLettresTrou,
      oral_answer: ecrireOral,
    },
  },
  'CE1.MA.NUM.DECOMP': {
    gens: { numeric_answer: decompNumeric, fill_blank: decompTrou, pairing: decompPaires, mcq: decompQcm },
  },
  'CE1.MA.NUM.COMPARER': {
    gens: {
      mcq: comparerQcm,
      ordering: comparerRanger,
      true_false: comparerVraiFaux,
      numeric_answer: comparerNumeric,
    },
  },
  'CE1.MA.NUM.DROITE': {
    gens: { number_line: droiteLigne, numeric_answer: droiteNumeric, mcq: droiteEncadrer },
  },
  'CE1.MA.NUM.PARITE': {
    gens: {
      classification: pariteClasser,
      true_false: pariteVraiFaux,
      numeric_answer: pariteNumeric,
      mcq: pariteQcm,
    },
  },
  'CE1.MA.NUM.ORDINAUX': {
    gens: { numeric_answer: ordinauxNumeric, mcq: ordinauxQcm, true_false: ordinauxVraiFaux },
  },
};
