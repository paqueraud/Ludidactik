/**
 * CM2 — Nombres entiers (BO n°16 du 17/04/2025, cycle 3, « Les nombres entiers ») :
 * lire, écrire et décomposer les nombres jusqu'à 999 999 999 (classes des unités, des mille, des millions),
 * comparer, encadrer, intercaler, ranger, demi-droite graduée, diviseurs et multiples.
 *
 * Champ numérique : ≤ 999 999 (facile : nombres du CM1, attendus en périodes 1-2), ≤ 999 999 999
 * (normal = attendu de fin de CM2), milliards au niveau « plus loin » (introduits en 6e).
 * Divisibilité : seuls les critères par 2, 5 et 10 sont au programme ; les critères par 3 et 9 relèvent
 * du « plus loin » (6e). Ailleurs, on s'appuie sur les tables de multiplication.
 */
import { graphiesNombre, nombreEnLettres } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, comparaison, fmt, make, mcq, numeric, parNiv, signe, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Rangs et classes                                                    */
/* ------------------------------------------------------------------ */

/** Nom des rangs (puissance de 10) au singulier et au pluriel. */
const RANG_SG = [
  'unité',
  'dizaine',
  'centaine',
  'millier',
  'dizaine de mille',
  'centaine de mille',
  'million',
  'dizaine de millions',
  'centaine de millions',
  'milliard',
  'dizaine de milliards',
  'centaine de milliards',
];
const RANG_PL = [
  'unités',
  'dizaines',
  'centaines',
  'milliers',
  'dizaines de mille',
  'centaines de mille',
  'millions',
  'dizaines de millions',
  'centaines de millions',
  'milliards',
  'dizaines de milliards',
  'centaines de milliards',
];

/** « 3 centaines de mille », « 1 million ». */
const rangs = (k: number, p: number) => `${k} ${k > 1 ? RANG_PL[p] : RANG_SG[p]}`;
const chiffre = (n: number, p: number) => Math.floor(n / 10 ** p) % 10;
const nbChiffres = (n: number) => String(n).length;
/** « des dizaines de mille » / « des unités ». */
const desRang = (p: number) => `des ${RANG_PL[p]}`;

/** Chiffres non nuls avec leur rang, du plus grand rang au plus petit. */
function chiffresNonNuls(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let p = nbChiffres(n) - 1; p >= 0; p--) {
    const c = chiffre(n, p);
    if (c) out.push([c, p]);
  }
  return out;
}

/** Classes : [milliards, millions, mille, unités]. */
const classes = (n: number) => [
  Math.floor(n / 1e9),
  Math.floor(n / 1e6) % 1000,
  Math.floor(n / 1e3) % 1000,
  n % 1000,
];

/** Lecture « en mots-nombres + chiffres » : 12 500 000 000 → « 12 milliards 500 millions ». */
function lectureClasses(n: number): string {
  const [g, m, k, u] = classes(n) as [number, number, number, number];
  const parts: string[] = [];
  if (g) parts.push(`${g} milliard${g > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} million${m > 1 ? 's' : ''}`);
  if (k) parts.push(`${k} mille`);
  if (u) parts.push(String(u));
  return parts.join(' ') || '0';
}

/** Écriture en lettres d'un nombre, milliards compris (6e) : « douze milliards cinq-cents-millions ». */
function lettresMilliards(n: number, style: 'rectifiee' | 'traditionnelle' = 'rectifiee'): string {
  const g = Math.floor(n / 1e9);
  const reste = n % 1e9;
  if (!g) return nombreEnLettres(n, style);
  const tete = `${nombreEnLettres(g, style)} milliard${g > 1 ? 's' : ''}`;
  return reste ? `${tete} ${nombreEnLettres(reste, style)}` : tete;
}

/* ------------------------------------------------------------------ */
/* Tirage de nombres « intéressants »                                  */
/* ------------------------------------------------------------------ */

/** Valeurs de classe qui piègent à l'écrit (zéros, 70-99, cent(s), vingt(s)). */
const CLASSES_PIEGES = [80, 200, 300, 280, 71, 91, 100, 1, 21, 600, 480, 5, 40, 90, 900, 8, 70, 99, 180];

/** Nombre à lire/écrire/décomposer selon le niveau. */
function grandNombre(level: Level, rng: Rng): number {
  const r = rng.next();
  if (level === 'facile') {
    if (r < 0.3) return rng.int(1, 999) * 1000 + rng.pick([0, rng.int(1, 9), rng.int(10, 99)]);
    if (r < 0.5) return rng.pick(CLASSES_PIEGES) * 1000 + rng.pick(CLASSES_PIEGES);
    return rng.int(10_000, 999_999);
  }
  if (level === 'normal') {
    const m = rng.int(1, 999);
    if (r < 0.25) return m * 1e6 + rng.int(0, 99) * 1000 + rng.int(0, 99) * rng.pick([0, 1, 10]);
    if (r < 0.4) return m * 1e6 + rng.int(1, 999);
    if (r < 0.5) return m * 1e6 + rng.int(1, 999) * 1000;
    if (r < 0.65)
      return rng.pick(CLASSES_PIEGES) * 1e6 + rng.pick(CLASSES_PIEGES) * 1000 + rng.pick(CLASSES_PIEGES);
    return rng.int(1_000_000, 999_999_999);
  }
  // Plus loin : les milliards (6e)
  const g = rng.int(1, 999);
  if (r < 0.4) return g * 1e9 + rng.int(0, 999) * 1e6;
  if (r < 0.6) return g * 1e9 + rng.int(0, 99) * 1e3;
  return g * 1e9 + rng.int(0, 999_999_999);
}

/** Nombre ≤ 999 999 999 (écriture en lettres possible) ; au niveau « plus loin », que des pièges. */
function nombreLettres(level: Level, rng: Rng): number {
  if (level !== 'plus_loin') return grandNombre(level, rng);
  const c = () => rng.pick(CLASSES_PIEGES);
  return c() * 1e6 + (rng.chance(0.7) ? c() * 1000 : 0) + (rng.chance(0.8) ? c() : 0);
}

const maxNiv = (level: Level) =>
  parNiv(level, { facile: 999_999, normal: 999_999_999, plus_loin: 999_999_999_999 });

/** Difficulté d'écriture : zéros intercalés, longueur, pièges de lettres. */
function difNombre(n: number, level: Level): number {
  let x = 0.15 + (nbChiffres(n) - 4) * 0.05;
  if (/0/.test(String(n))) x += 0.15;
  if (/000/.test(String(n).slice(0, -3))) x += 0.1;
  if (classes(n).some((c) => c % 100 >= 70 || c % 100 === 0)) x += 0.1;
  if (level === 'plus_loin') x += 0.1;
  return clamp01(x);
}

/* ------------------------------------------------------------------ */
/* CM2.MA.NUM.GRANDS — lire, écrire, décomposer                        */
/* ------------------------------------------------------------------ */

/** Graphies fautives plausibles : jamais une graphie acceptée. */
function lettresFautives(n: number): string[] {
  const r = nombreEnLettres(n);
  const [, m, k] = classes(n) as [number, number, number, number];
  const out: string[] = [];
  if (m > 1) out.push(r.replace('millions', 'million'));
  if (m === 1) out.push(r.replace('un million', 'un millions'));
  if (k > 1) out.push(r.replace('mille', 'milles'));
  if (k === 1) out.push(r.replace(/^mille/, 'un-mille').replace(' mille', ' un-mille'));
  if (/-cent-mille/.test(r)) out.push(r.replace('-cent-mille', '-cents-mille'));
  if (/-cents( |$)/.test(r)) out.push(r.replace(/-cents( |$)/, '-cent$1'));
  if (/-cents-millions/.test(r)) out.push(r.replace('-cents-millions', '-cent-millions'));
  if (/cents millions/.test(r)) out.push(r.replace('cents millions', 'cent millions'));
  if (/quatre-vingt-mille/.test(r)) out.push(r.replace('quatre-vingt-mille', 'quatre-vingts-mille'));
  if (/quatre-vingts$/.test(r)) out.push(r.replace(/quatre-vingts$/, 'quatre-vingt'));
  const ok = graphiesNombre(n);
  return [...new Set(out)].filter((x) => x !== r && !ok.includes(x));
}

/** Nombres qu'un enfant confond avec n (zéro oublié ou ajouté, classes décalées). */
function voisinsConfusion(n: number, rng: Rng, max: number): number[] {
  const s = String(n);
  const out = new Set<number>();
  const add = (x: number) => {
    if (x !== n && x > 0 && x <= max && Number.isInteger(x)) out.add(x);
  };
  const [g, m, k, u] = classes(n) as [number, number, number, number];
  // Classe écrite sans ses zéros (« 4 millions 25 mille » → 4 025 000 lu 425 000)
  if (m && k < 100) add(Number(`${g || ''}${m}${k}${String(u).padStart(3, '0')}`));
  if (k && u < 100) add(Number(`${g || ''}${m ? m : ''}${m ? String(k).padStart(3, '0') : k}${u}`));
  add(n * 10);
  add(Math.floor(n / 10));
  const i = s.search(/[1-9]0/);
  if (i >= 0) add(Number(s.slice(0, i + 1) + s.slice(i + 2) + '0'));
  if (s.length >= 2) {
    const a = s.split('');
    const j = rng.int(1, a.length - 1);
    [a[j - 1], a[j]] = [a[j]!, a[j - 1]!];
    if (a[0] !== '0') add(Number(a.join('')));
  }
  add(n + 10 ** rng.int(3, Math.max(3, s.length - 2)));
  return rng.shuffle([...out]);
}

const explLettres = (n: number) => {
  const [, m, k] = classes(n) as [number, number, number, number];
  const regles: string[] = [];
  if (m) regles.push('« million » prend un s au pluriel et reste séparé par une espace');
  if (k) regles.push('« mille » ne prend jamais de s');
  const l = nombreEnLettres(n);
  if (/cents|vingts/.test(l))
    regles.push(
      '« cent » et « vingt » prennent un s quand ils sont multipliés et qu’aucun nombre ne les suit',
    );
  else if (/-(cent|vingt)-mille/.test(l))
    regles.push('« cent » et « vingt » ne prennent pas de s devant « mille »');
  return `${fmt(n)} s’écrit « ${nombreEnLettres(n)} »${regles.length ? ` : ${regles.join(', ')}` : ''}.`;
};

/** Décomposition affichée et sa forme « lisible » pour l'explication. */
function decomposition(n: number, level: Level, rng: Rng): { texte: string; forme: string } {
  const nn = chiffresNonNuls(n);
  const forme = level === 'facile' ? rng.int(0, 1) : level === 'normal' ? rng.int(0, 2) : rng.int(1, 3);
  if (forme === 0) {
    // Par classes : « 45 milliers et 302 unités »
    const [, m, k, u] = classes(n) as [number, number, number, number];
    const parts: string[] = [];
    if (m) parts.push(rangs(m, 6));
    if (k) parts.push(rangs(k, 3));
    if (u) parts.push(rangs(u, 0));
    const texte = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0]!;
    return { texte, forme: 'classes' };
  }
  if (forme === 1) {
    const parts = nn.map(([c, p]) => rangs(c, p));
    const texte = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0]!;
    return { texte, forme: 'rangs' };
  }
  if (forme === 2) {
    const texte = nn.map(([c, p]) => (p === 0 ? String(c) : `(${c} × ${fmt(10 ** p)})`)).join(' + ');
    return { texte, forme: 'produits' };
  }
  // Plus loin : rangs dans le désordre
  const parts = rng.shuffle(nn).map(([c, p]) => rangs(c, p));
  return { texte: parts.join(' + '), forme: 'desordre' };
}

const grandsNumeric: ItemGen = (level, rng, ctx) => {
  const forme = rng.next();
  // 1. Dictée
  if (forme < 0.4) {
    const n = grandNombre(level, rng);
    return numeric(ctx, `dictee-${n}`, {
      prompt: 'Écris en chiffres le nombre que tu entends.',
      spoken: String(n),
      answer: n,
      explication: `On entend « ${n < 1e9 ? nombreEnLettres(n) : lectureClasses(n)} » : on écrit ${fmt(n)}, en séparant les classes par des espaces et en n’oubliant pas les zéros.`,
      difficulty: difNombre(n, level),
      meta: { dictee: true },
    });
  }
  // 2. Construire à partir d'une décomposition
  if (forme < 0.75) {
    let n = level === 'plus_loin' && rng.chance(0.5) ? grandNombre('normal', rng) : grandNombre(level, rng);
    if (level === 'plus_loin' && n >= 1e9 && rng.chance(0.5)) n = Math.floor(n / 1e6) * 1e6;
    if (n >= 1e9) {
      const texte = lectureClasses(n);
      return numeric(ctx, `construire-milliards-${n}`, {
        prompt: `Écris en chiffres : ${texte}`,
        spoken: `Écris en chiffres : ${texte}`,
        answer: n,
        explication: `1 milliard = 1 000 millions : la classe des milliards s’écrit devant celle des millions, donc ${texte} = ${fmt(n)}.`,
        difficulty: clamp01(difNombre(n, level) + 0.1),
        meta: { construire: true },
      });
    }
    const d = decomposition(n, level, rng);
    return numeric(ctx, `construire-${d.forme}-${n}`, {
      prompt: `Écris en chiffres : ${d.texte}`,
      spoken: `Écris en chiffres : ${d.texte.replace(/ × /g, ' fois ').replace(/ \+ /g, ' plus ').replace(/[()]/g, '')}`,
      answer: n,
      explication: `On place chaque chiffre à son rang et on met des zéros dans les rangs vides : ${d.texte} = ${fmt(n)}.`,
      difficulty: clamp01(
        difNombre(n, level) + (d.forme === 'desordre' ? 0.2 : d.forme === 'classes' ? 0 : 0.1),
      ),
      meta: { construire: true },
    });
  }
  // 3. Nombre de milliers / centaines / millions « en tout »
  const n = level === 'plus_loin' ? grandNombre('normal', rng) : grandNombre(level, rng);
  const choix = parNiv(level, {
    facile: [1, 2, 3],
    normal: [2, 3, 4, 6],
    plus_loin: [3, 4, 5, 6],
  }).filter((p) => n >= 10 ** (p + 1));
  const p = choix.length ? rng.pick(choix) : 2;
  const q = Math.floor(n / 10 ** p);
  return numeric(ctx, `combien-${p}-${n}`, {
    prompt: `Combien y a-t-il de ${RANG_PL[p]} en tout dans ${fmt(n)} ?`,
    answer: q,
    explication: `Le chiffre ${desRang(p)} est ${chiffre(n, p)}, mais le nombre de ${RANG_PL[p]} en tout est ${fmt(q)} : on garde tous les chiffres jusqu’à celui ${desRang(p)}.`,
    difficulty: clamp01(0.45 + p * 0.04 + (level === 'plus_loin' ? 0.15 : 0)),
  });
};

const grandsLettresTrou: ItemGen = (level, rng, ctx) => {
  const n = nombreLettres(level, rng);
  const lettres = nombreEnLettres(n);
  const avecChoix = level === 'facile' || (level === 'normal' && rng.chance(0.5));
  const choices = avecChoix
    ? rng.shuffle([
        lettres,
        ...rng
          .shuffle([
            ...lettresFautives(n),
            ...voisinsConfusion(n, rng, 999_999_999).map((x) => nombreEnLettres(x)),
          ])
          .filter((x, i, a) => a.indexOf(x) === i && x !== lettres && !graphiesNombre(n).includes(x))
          .slice(0, 2),
      ])
    : undefined;
  return make(ctx, 'fill_blank', `trou-${n}-${avecChoix ? 'c' : 'l'}`, {
    sentence: `${fmt(n)} s’écrit en lettres : ___`,
    spoken: `Écris ${n} en lettres.`,
    answer: lettres,
    accepted: graphiesNombre(n).filter((g) => g !== lettres),
    choices,
    explication: explLettres(n),
    difficulty: clamp01(difNombre(n, level) + (avecChoix ? 0 : 0.25)),
    meta: { lettres: true },
  });
};

const grandsQcm: ItemGen = (level, rng, ctx) => {
  const forme = rng.int(0, 3);
  // Plus loin : lire un nombre en milliards
  if (level === 'plus_loin' && forme === 0) {
    const g = rng.int(1, 99);
    const m = rng.pick([0, rng.int(1, 9) * 100, rng.int(1, 99) * 10, rng.int(101, 999)]);
    const n = g * 1e9 + m * 1e6;
    const good = lectureClasses(n);
    const wrong = [
      lectureClasses(g * 1e6 + m * 1e3),
      lectureClasses(g * 1e10 + m * 1e7),
      m ? lectureClasses(g * 1e9 + m * 1e3) : lectureClasses(g * 1e8),
      lectureClasses(Math.floor(g / 10) * 1e9 + ((g % 10) * 100 + Math.floor(m / 10)) * 1e6),
    ].filter((w) => w !== good);
    return mcq(ctx, rng, `lire-milliards-${n}`, {
      question: `Comment lit-on ${fmt(n)} ?`,
      good,
      wrong,
      explication: `Je découpe en classes de 3 chiffres à partir de la droite : ${fmt(n)} se lit « ${good} » (1 milliard = 1 000 millions).`,
      difficulty: 0.7,
    });
  }
  // Lettres → chiffres ou chiffres → lettres
  if (forme === 0 || forme === 1) {
    const n = nombreLettres(level, rng);
    const lettres = nombreEnLettres(n);
    if (forme === 0) {
      const pieges = [
        ...lettresFautives(n),
        ...voisinsConfusion(n, rng, 999_999_999).map((x) => nombreEnLettres(x)),
      ];
      return mcq(ctx, rng, `lettres-${n}`, {
        question: `Comment s’écrit ${fmt(n)} en lettres ?`,
        spoken: `Comment s’écrit ${n} en lettres ?`,
        good: lettres,
        wrong: pieges.filter((x) => !graphiesNombre(n).includes(x)),
        explication: explLettres(n),
        difficulty: difNombre(n, level),
        meta: { lettres: true },
        max: level === 'facile' ? 3 : 4,
      });
    }
    return mcq(ctx, rng, `chiffres-${n}`, {
      question: `Quel nombre s’écrit « ${lettres} » ?`,
      good: fmt(n),
      wrong: voisinsConfusion(n, rng, 999_999_999).map((x) => fmt(x)),
      explication: `« ${lettres} », c’est ${fmt(n)} : chaque classe (millions, mille, unités) s’écrit avec 3 chiffres, zéros compris.`,
      difficulty: difNombre(n, level),
      max: level === 'facile' ? 3 : 4,
    });
  }
  const n =
    level === 'plus_loin'
      ? grandNombre(rng.chance(0.5) ? 'plus_loin' : 'normal', rng)
      : grandNombre(level, rng);
  const nn = chiffresNonNuls(n);
  // Chiffre d'un rang donné
  if (forme === 2) {
    const p = rng.int(0, nbChiffres(n) - 1);
    const c = chiffre(n, p);
    const autres = [
      ...new Set(
        [p - 1, p + 1, p - 2, p + 3, p - 3]
          .filter((q) => q >= 0 && q < nbChiffres(n))
          .map((q) => chiffre(n, q)),
      ),
    ];
    const wrong = autres.filter((x) => x !== c).map(String);
    if (wrong.length < 2) wrong.push(String((c + 1) % 10), String((c + 5) % 10));
    return mcq(ctx, rng, `chiffre-${p}-${n}`, {
      question: `Quel est le chiffre ${desRang(p)} dans ${fmt(n)} ?`,
      good: String(c),
      wrong,
      explication: `Je repère les classes de droite à gauche (unités, mille, millions${n >= 1e9 ? ', milliards' : ''}) : le chiffre ${desRang(p)} de ${fmt(n)} est ${c}.`,
      difficulty: clamp01(0.3 + p * 0.04),
      max: level === 'facile' ? 3 : 4,
    });
  }
  // Valeur d'un chiffre
  const uniques = nn.filter(
    ([c]) =>
      String(n)
        .split('')
        .filter((x) => x === String(c)).length === 1,
  );
  const [c, p] = uniques.length ? rng.pick(uniques) : nn[0]!;
  const val = c * 10 ** p;
  const wrong = [p + 1, p - 1, p + 2, p - 2, p + 3]
    .filter((q) => q >= 0 && q <= 11 && c * 10 ** q <= maxNiv(level))
    .map((q) => fmt(c * 10 ** q));
  return mcq(ctx, rng, `valeur-${c}-${p}-${n}`, {
    question: `Dans ${fmt(n)}, que vaut le chiffre ${c}${uniques.length ? '' : ` ${desRang(p)}`} ?`,
    good: fmt(val),
    wrong,
    explication: `Le chiffre ${c} est au rang ${desRang(p)} : il vaut ${rangs(c, p)}, c’est-à-dire ${fmt(val)}.`,
    difficulty: clamp01(0.35 + p * 0.04),
    max: level === 'facile' ? 3 : 4,
  });
};

const grandsOral: ItemGen = (level, rng, ctx) => {
  const n = grandNombre(level, rng);
  const lettres = lettresMilliards(n);
  const accepted = [
    String(n),
    fmt(n),
    fmt(n).replace(/ /g, ' '),
    lettres,
    lettresMilliards(n, 'traditionnelle'),
    lettres.replace(/-/g, ' '),
    ...(n < 1e9 ? graphiesNombre(n) : []),
  ];
  return make(ctx, 'oral_answer', `oral-${n}`, {
    prompt: `Lis ce nombre à voix haute : ${fmt(n)}`,
    spoken: 'Lis ce nombre à voix haute.',
    answer: `${lettres} (${fmt(n)})`,
    accepted: [...new Set(accepted)],
    explication: `Je lis classe par classe : ${fmt(n)} se lit « ${lettres} ».`,
    difficulty: difNombre(n, level),
  });
};

const grandsVraiFaux: ItemGen = (level, rng, ctx) => {
  const n = level === 'plus_loin' && rng.chance(0.5) ? grandNombre('normal', rng) : grandNombre(level, rng);
  const juste = rng.chance(0.5);
  if (rng.chance(0.5)) {
    // Chiffre d'un rang
    const p = rng.int(1, nbChiffres(n) - 1);
    const c = chiffre(n, p);
    const autres = [p - 1, p + 1].filter((q) => q >= 0 && q < nbChiffres(n) && chiffre(n, q) !== c);
    const montre = juste || !autres.length ? c : chiffre(n, rng.pick(autres));
    return vraiFaux(ctx, `vf-chiffre-${p}-${n}-${montre}`, {
      statement: `Dans ${fmt(n)}, le chiffre ${desRang(p)} est ${montre}.`,
      answer: montre === c,
      explication: `Dans ${fmt(n)}, le chiffre ${desRang(p)} est ${c}.`,
      difficulty: clamp01(0.3 + p * 0.04),
    });
  }
  // Décomposition
  const nn = chiffresNonNuls(n);
  let decal = nn;
  if (!juste) {
    const i = rng.int(0, nn.length - 1);
    const [c, p] = nn[i]!;
    const libres = [p + 1, p - 1].filter((q) => q >= 0 && q < nbChiffres(n) && !nn.some(([, r]) => r === q));
    if (libres.length) decal = nn.map((x, j) => (j === i ? ([c, rng.pick(libres)] as [number, number]) : x));
  }
  const valeur = decal.reduce((s, [c, p]) => s + c * 10 ** p, 0);
  const texte = decal.map(([c, p]) => rangs(c, p)).join(' + ');
  return vraiFaux(ctx, `vf-decomp-${n}-${texte}`, {
    statement: `${fmt(n)} = ${texte}`,
    answer: valeur === n,
    explication:
      valeur === n
        ? `Oui : chaque chiffre de ${fmt(n)} est à son rang, ${texte} = ${fmt(n)}.`
        : `Non : ${texte} = ${fmt(valeur)}. Pour ${fmt(n)}, il faut ${nn.map(([c, p]) => rangs(c, p)).join(' + ')}.`,
    difficulty: clamp01(0.4 + nn.length * 0.04),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.NUM.COMPARER — comparer, encadrer, intercaler, ranger         */
/* ------------------------------------------------------------------ */

/** Explication d'une comparaison (nombre de chiffres, puis premier chiffre différent). */
function explComparer(a: number, b: number): string {
  const s = signe(a, b);
  if (s === '=') return `${fmt(a)} et ${fmt(b)} sont le même nombre.`;
  const [petit, grand] = a < b ? [a, b] : [b, a];
  const rel = `${fmt(a)} ${s} ${fmt(b)}`;
  if (nbChiffres(a) !== nbChiffres(b))
    return `${fmt(petit)} a ${nbChiffres(petit)} chiffres et ${fmt(grand)} en a ${nbChiffres(grand)} : celui qui a le plus de chiffres est le plus grand, donc ${rel}.`;
  let p = nbChiffres(a) - 1;
  while (p > 0 && chiffre(a, p) === chiffre(b, p)) p--;
  return `Même nombre de chiffres : je compare de gauche à droite. Le premier chiffre différent est celui ${desRang(p)} (${chiffre(petit, p)} < ${chiffre(grand, p)}), donc ${rel}.`;
}

/** Nombre au hasard ayant exactement k chiffres. */
const avecChiffres = (rng: Rng, k: number) => rng.int(10 ** (k - 1), 10 ** k - 1);

/** Change le chiffre de rang p (≠ chiffre de tête si on veut garder la longueur). */
function changeChiffre(n: number, p: number, rng: Rng): number {
  const c = chiffre(n, p);
  const lead = p === nbChiffres(n) - 1;
  let d = c;
  while (d === c) d = rng.int(lead ? 1 : 0, 9);
  return n + (d - c) * 10 ** p;
}

const chiffresNiv = (level: Level, rng: Rng) =>
  parNiv(level, { facile: rng.int(4, 6), normal: rng.int(6, 9), plus_loin: rng.int(9, 12) });

function paireComparer(level: Level, rng: Rng): [number, number] {
  const k = chiffresNiv(level, rng);
  const r = rng.next();
  const a = avecChiffres(rng, k);
  if (r < 0.1) return [a, a];
  if (r < 0.35) {
    // Moins de chiffres mais de « gros » chiffres en tête : 98 765 / 123 456
    const kk = Math.max(4, k - 1);
    const court = Number(`9${String(avecChiffres(rng, kk)).slice(1)}`);
    const long = Number(`1${String(avecChiffres(rng, kk + 1)).slice(1)}`);
    return rng.chance(0.5) ? [court, long] : [long, court];
  }
  // Même longueur, même début : le piège est au milieu
  const p = rng.int(Math.max(0, k - 6), k - 2);
  return [a, changeChiffre(a, p, rng)];
}

const comparerCroco: ItemGen = (level, rng, ctx) => {
  // Plus loin : écriture en chiffres contre écriture « 45 millions »
  if (level === 'plus_loin' && rng.chance(0.3)) {
    const m = rng.int(2, 99);
    const unite = rng.pick([1e6, 1e9]);
    const nom = unite === 1e6 ? 'millions' : 'milliards';
    const v = m * unite;
    const n = rng.pick([v, v / 10, v * 10, v + rng.int(1, 9) * (unite / 10)]);
    const [g, d, vg, vd] = rng.chance(0.5) ? [`${m} ${nom}`, fmt(n), v, n] : [fmt(n), `${m} ${nom}`, n, v];
    return comparaison(ctx, `mots-${g}-${d}`, {
      gauche: g,
      droite: d,
      signe: signe(vg, vd),
      explication: `${m} ${nom} = ${fmt(v)}, puis je compare comme d’habitude : ${explComparer(vg, vd)}`,
      difficulty: 0.75,
    });
  }
  const [a, b] = paireComparer(level, rng);
  return comparaison(ctx, `cmp-${a}-${b}`, {
    gauche: fmt(a),
    droite: fmt(b),
    signe: signe(a, b),
    spokenGauche: String(a),
    spokenDroite: String(b),
    explication: explComparer(a, b),
    difficulty: clamp01(
      0.2 + nbChiffres(Math.max(a, b)) * 0.05 + (nbChiffres(a) === nbChiffres(b) ? 0.1 : 0),
    ),
  });
};

const comparerRanger: ItemGen = (level, rng, ctx) => {
  const k = chiffresNiv(level, rng);
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 5 });
  const base = avecChiffres(rng, k);
  const set = new Set<number>([base]);
  let guard = 0;
  while (set.size < n && guard++ < 200) {
    const r = rng.next();
    let x: number;
    if (r < 0.2 && k > 4) x = Number(`9${String(avecChiffres(rng, k - 1)).slice(1)}`);
    else x = changeChiffre(base, rng.int(Math.max(0, k - 6), k - 2), rng);
    if (x > 0 && x <= maxNiv(level)) set.add(x);
  }
  const croissant = rng.chance(0.5);
  const vals = [...set].sort((x, y) => (croissant ? x - y : y - x));
  return make(ctx, 'ordering', `ranger-${croissant ? 'c' : 'd'}-${vals.join('|')}`, {
    prompt: croissant
      ? 'Range ces nombres du plus petit au plus grand.'
      : 'Range ces nombres du plus grand au plus petit.',
    elements: vals.map((v) => fmt(v)),
    mode: croissant ? 'croissant' : 'decroissant',
    explication:
      'Je compare d’abord le nombre de chiffres, puis les chiffres de gauche à droite, classe par classe, jusqu’au premier chiffre différent.',
    difficulty: clamp01(0.3 + k * 0.04),
  });
};

const comparerDroite: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const S = 100_000;
    const min = rng.int(0, 4) * S;
    const target = min + rng.int(1, 9) * (S / 2);
    return make(ctx, 'number_line', `droite-f-${min}-${target}`, {
      prompt: `Place ${fmt(target)} sur la droite graduée.`,
      spoken: `Place ${target} sur la droite graduée.`,
      min,
      max: min + 5 * S,
      step: S,
      subdivisions: 2,
      target,
      display: fmt(target),
      tolerance: (S / 2) * 0.4,
      explication: `Les grands traits vont de 100 000 en 100 000 et chaque petit trait vaut 50 000 : ${fmt(target)} est sur le trait de ${fmt(target)}.`,
      difficulty: 0.25,
    });
  }
  const S = parNiv(level, {
    facile: 1e5,
    normal: rng.pick([1e5, 1e6, 1e7]),
    plus_loin: rng.pick([1e6, 1e7, 1e9]),
  });
  const a = rng.int(S === 1e9 ? 0 : 1, S >= 1e7 && S < 1e9 ? 7 : 50);
  const min = a * S;
  const max = min + 2 * S;
  const sub = S / 10;
  // Normal : sur une graduation ; plus loin : parfois entre deux graduations (placer « environ »)
  const entre = level === 'plus_loin' && rng.chance(0.5);
  let j = rng.int(1, 19);
  if (j === 10) j = 11;
  const target = min + j * sub + (entre ? sub / 2 : 0);
  return make(ctx, 'number_line', `droite-${min}-${S}-${target}`, {
    prompt: entre
      ? `Place ${fmt(target)} le plus précisément possible sur la droite graduée.`
      : `Place ${fmt(target)} sur la droite graduée.`,
    spoken: `Place ${target} sur la droite graduée.`,
    min,
    max,
    step: S,
    subdivisions: 10,
    target,
    display: fmt(target),
    tolerance: Math.round(sub * (entre ? 0.45 : 0.4)),
    explication: entre
      ? `Chaque petit trait vaut ${fmt(sub)} : ${fmt(target)} est juste au milieu entre ${fmt(target - sub / 2)} et ${fmt(target + sub / 2)}.`
      : `Entre deux grands traits il y a ${fmt(S)}, partagé en 10 : chaque petit trait vaut ${fmt(sub)}. ${fmt(target)} = ${fmt(min)} + ${j} × ${fmt(sub)}.`,
    difficulty: clamp01(0.45 + (entre ? 0.25 : 0) + (S >= 1e7 ? 0.1 : 0)),
  });
};

/** Arrondi au plus proche multiple de u (n jamais exactement au milieu). */
/** « au millier près », « à la dizaine de mille près »… */
const NOM_PRES: Record<number, string> = {
  3: 'au millier près',
  4: 'à la dizaine de mille près',
  5: 'à la centaine de mille près',
  6: 'au million près',
  7: 'à la dizaine de millions près',
  8: 'à la centaine de millions près',
  9: 'au milliard près',
};

const arrondi = (n: number, u: number) => Math.round(n / u) * u;

const comparerNumeric: ItemGen = (level, rng, ctx) => {
  const formes = parNiv(level, {
    facile: ['apres', 'avant', 'encadrer', 'milieu'],
    normal: ['apres', 'avant', 'encadrer', 'encadrer', 'milieu'],
    plus_loin: ['arrondi', 'arrondi', 'encadrer', 'avant', 'milieu'],
  });
  const forme = rng.pick(formes);
  const k = chiffresNiv(level, rng);
  if (forme === 'apres' || forme === 'avant') {
    // Passage de classe : 3 999 999 + 1, 5 000 000 − 1
    const p = rng.int(3, k - 1);
    const haut = rng.int(1, 9) * 10 ** p + (k - 1 > p ? avecChiffres(rng, k - p - 1) * 10 ** (p + 1) : 0);
    const n = forme === 'apres' ? haut - 1 : haut;
    const rep = forme === 'apres' ? n + 1 : n - 1;
    return numeric(ctx, `${forme}-${n}`, {
      prompt:
        forme === 'apres' ? `Le nombre juste après ${fmt(n)} est …` : `Le nombre juste avant ${fmt(n)} est …`,
      spoken:
        forme === 'apres' ? `Quel est le nombre juste après ${n} ?` : `Quel est le nombre juste avant ${n} ?`,
      answer: rep,
      explication:
        forme === 'apres'
          ? `${fmt(n)} + 1 = ${fmt(rep)} : quand les 9 deviennent des 0, on ajoute 1 au rang suivant.`
          : `${fmt(n)} − 1 = ${fmt(rep)} : les 0 deviennent des 9 et le rang au-dessus perd 1.`,
      difficulty: clamp01(0.3 + p * 0.03),
    });
  }
  if (forme === 'encadrer') {
    const p = parNiv(level, {
      facile: rng.pick([3, 4]),
      normal: rng.pick([5, 6, 7]),
      plus_loin: rng.pick([6, 8, 9]),
    });
    const u = 10 ** p;
    let n = avecChiffres(rng, Math.max(k, p + 2));
    if (n % u === 0) n += rng.int(1, u - 1);
    const lo = Math.floor(n / u) * u;
    const hi = lo + u;
    const demandeBas = rng.chance(0.5);
    const pres = NOM_PRES[p]!;
    return numeric(ctx, `encadrer-${p}-${n}-${demandeBas}`, {
      prompt: demandeBas
        ? `Encadre ${pres} : … < ${fmt(n)} < ${fmt(hi)}`
        : `Encadre ${pres} : ${fmt(lo)} < ${fmt(n)} < …`,
      spoken: demandeBas
        ? `Encadre ${n} ${pres}. Le nombre de droite est ${hi}. Quel est celui de gauche ?`
        : `Encadre ${n} ${pres}. Le nombre de gauche est ${lo}. Quel est celui de droite ?`,
      answer: demandeBas ? lo : hi,
      explication: `Les multiples de ${fmt(u)} qui entourent ${fmt(n)} sont ${fmt(lo)} et ${fmt(hi)} : ${fmt(lo)} < ${fmt(n)} < ${fmt(hi)}.`,
      difficulty: clamp01(0.4 + p * 0.03),
    });
  }
  if (forme === 'milieu') {
    const p = parNiv(level, {
      facile: rng.pick([3, 4]),
      normal: rng.pick([5, 6, 7]),
      plus_loin: rng.pick([7, 8, 9]),
    });
    const u = 10 ** p;
    const a = rng.int(1, 8) * u + (level === 'facile' ? 0 : rng.int(0, 9) * u * 10);
    const b = a + u;
    return numeric(ctx, `milieu-${a}-${b}`, {
      prompt: `Quel nombre est exactement au milieu de ${fmt(a)} et ${fmt(b)} ?`,
      spoken: `Quel nombre est exactement au milieu de ${a} et ${b} ?`,
      answer: a + u / 2,
      explication: `L’écart entre ${fmt(a)} et ${fmt(b)} est ${fmt(u)} ; la moitié de ${fmt(u)} est ${fmt(u / 2)}, donc le milieu est ${fmt(a)} + ${fmt(u / 2)} = ${fmt(a + u / 2)}.`,
      difficulty: clamp01(0.4 + p * 0.03),
    });
  }
  // Arrondi (plus loin)
  const p = rng.pick([3, 5, 6, 9].filter((q) => q < k));
  const u = 10 ** p;
  let n = avecChiffres(rng, k);
  if ((n % u) * 2 === u || n % u === 0) n += rng.int(1, 9) * 10 ** Math.max(0, p - 2) + 1;
  const ar = arrondi(n, u);
  const nomArr =
    { 3: 'au millier', 5: 'à la centaine de mille', 6: 'au million', 9: 'au milliard' }[p] ?? 'au millier';
  return numeric(ctx, `arrondi-${p}-${n}`, {
    prompt: `Arrondis ${fmt(n)} ${nomArr} le plus proche.`,
    spoken: `Arrondis ${n} ${nomArr} le plus proche.`,
    answer: ar,
    explication: `${fmt(n)} est entre ${fmt(Math.floor(n / u) * u)} et ${fmt(Math.floor(n / u) * u + u)}, plus près de ${fmt(ar)} (je regarde le chiffre juste à droite : ${chiffre(n, p - 1)}${chiffre(n, p - 1) >= 5 ? ' ≥ 5, j’arrondis au-dessus' : ' < 5, j’arrondis au-dessous'}).`,
    difficulty: clamp01(0.55 + p * 0.03),
  });
};

const comparerVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  if (rng.chance(0.5)) {
    const [a, b] = paireComparer(level, rng);
    const s = signe(a, b);
    const faux = s === '<' ? '>' : s === '>' ? '<' : rng.pick(['<', '>']);
    const montre = juste ? s : faux;
    return vraiFaux(ctx, `vf-cmp-${a}-${b}-${montre}`, {
      statement: `${fmt(a)} ${montre} ${fmt(b)}`,
      spoken: `${a} est ${montre === '<' ? 'plus petit que' : montre === '>' ? 'plus grand que' : 'égal à'} ${b}.`,
      answer: montre === s,
      explication: explComparer(a, b),
      difficulty: clamp01(0.25 + nbChiffres(a) * 0.04),
    });
  }
  // Compris entre
  const k = chiffresNiv(level, rng);
  const p = Math.max(3, k - 2);
  const u = 10 ** p;
  const n = avecChiffres(rng, k);
  const lo = Math.floor(n / u) * u;
  const decalage = juste ? 0 : rng.pick([-1, 1]) * u;
  const a = Math.max(0, lo + decalage);
  const b = a + u;
  const vrai = n > a && n < b;
  return vraiFaux(ctx, `vf-entre-${n}-${a}`, {
    statement: `${fmt(n)} est compris entre ${fmt(a)} et ${fmt(b)}.`,
    spoken: `${n} est compris entre ${a} et ${b}.`,
    answer: vrai,
    explication: `${fmt(lo)} < ${fmt(n)} < ${fmt(lo + u)} : ${vrai ? 'c’est bien entre les deux' : `${fmt(n)} n’est pas entre ${fmt(a)} et ${fmt(b)}`}.`,
    difficulty: clamp01(0.35 + k * 0.03),
  });
};

/* ------------------------------------------------------------------ */
/* CM2.MA.NUM.DIVISIBILITE — critères 2/5/10, diviseurs, multiples      */
/* ------------------------------------------------------------------ */

const diviseurs = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const sommeChiffres = (n: number) =>
  String(n)
    .split('')
    .reduce((s, c) => s + Number(c), 0);
const pgcdLocal = (a: number, b: number): number => (b ? pgcdLocal(b, a % b) : a);

const CRITERE: Record<number, string> = {
  2: 'son chiffre des unités est 0, 2, 4, 6 ou 8',
  5: 'son chiffre des unités est 0 ou 5',
  10: 'son chiffre des unités est 0',
};

/** Explication « n est-il divisible par d ? » (critère pour 2, 5, 10 ; somme des chiffres pour 3, 9 ; tables sinon). */
function explDiv(n: number, d: number): string {
  const oui = n % d === 0;
  if (CRITERE[d])
    return `Un nombre est divisible par ${d} quand ${CRITERE[d]} : ${fmt(n)} se termine par ${n % 10}, donc il ${oui ? 'est' : 'n’est pas'} divisible par ${d}.`;
  if (d === 3 || d === 9) {
    const s = sommeChiffres(n);
    return `Un nombre est divisible par ${d} quand la somme de ses chiffres l’est : ${String(n).split('').join(' + ')} = ${s}, ${s % d === 0 ? `qui est dans la table de ${d}` : `qui n’est pas dans la table de ${d}`} (règle vue en 6e).`;
  }
  const q = Math.floor(n / d);
  return oui
    ? `${d} × ${q} = ${fmt(n)} : ${fmt(n)} est un multiple de ${d}, et ${d} est un diviseur de ${fmt(n)}.`
    : `${d} × ${q} = ${fmt(d * q)} et ${d} × ${q + 1} = ${fmt(d * (q + 1))} : ${fmt(n)} n’est pas dans la table de ${d}, donc ${d} n’est pas un diviseur de ${fmt(n)}.`;
}

/** Nombre au hasard divisible (ou non) par d. */
function tireNombre(rng: Rng, min: number, max: number, d: number, divisible: boolean): number {
  for (let i = 0; i < 200; i++) {
    const x = rng.int(min, max);
    if ((x % d === 0) === divisible) return x;
  }
  return divisible ? Math.ceil(min / d) * d : Math.ceil(min / d) * d + 1;
}

const divClasser: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: 0, normal: rng.int(1, 3), plus_loin: rng.chance(0.7) ? 4 : 2 });
  if (forme === 0) {
    const d = rng.pick([2, 5, 10]);
    const vals = new Set<number>();
    const n = rng.int(6, 8);
    while (vals.size < n)
      vals.add(tireNombre(rng, 10, rng.chance(0.5) ? 999 : 99_999, d, vals.size % 2 === 0));
    const elements = rng.shuffle([...vals]).map((x) => ({ label: fmt(x), category: x % d === 0 ? 0 : 1 }));
    return make(ctx, 'classification', `crit-${d}-${[...vals].join('|')}`, {
      prompt: `Range ces nombres : sont-ils divisibles par ${d} ?`,
      categories: [`divisible par ${d}`, `pas divisible par ${d}`],
      elements,
      explication: `Un nombre est divisible par ${d} quand ${CRITERE[d]}.`,
      difficulty: d === 10 ? 0.15 : d === 5 ? 0.2 : 0.25,
    });
  }
  if (forme === 1) {
    // Par 2 et par 5 : 4 catégories exclusives
    const cats = ['par 2 et par 5', 'par 2 seulement', 'par 5 seulement', 'ni par 2 ni par 5'];
    const cat = (x: number) => (x % 10 === 0 ? 0 : x % 2 === 0 ? 1 : x % 5 === 0 ? 2 : 3);
    const vals = new Set<number>();
    let g = 0;
    while (vals.size < 8 && g++ < 500) {
      const x = rng.int(100, 99_999);
      if ([...vals].filter((v) => cat(v) === cat(x)).length < 2) vals.add(x);
    }
    return make(ctx, 'classification', `crit25-${[...vals].join('|')}`, {
      prompt: 'Range ces nombres selon qu’ils sont divisibles par 2, par 5, par les deux ou par aucun.',
      categories: cats,
      elements: rng.shuffle([...vals]).map((x) => ({ label: fmt(x), category: cat(x) })),
      explication:
        'Je regarde le chiffre des unités : 0, 2, 4, 6, 8 → divisible par 2 ; 0 ou 5 → divisible par 5 ; 0 → divisible par 2 et par 5 (donc par 10).',
      difficulty: 0.45,
    });
  }
  if (forme === 2) {
    // Diviseurs d'un nombre ≤ 100
    const n = rng.pick([
      12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 80, 84, 90, 96, 100,
    ]);
    const divs = diviseurs(n).filter((d) => d > 1 && d < n);
    const non = Array.from({ length: Math.min(12, n - 1) }, (_, i) => i + 2).filter((d) => n % d !== 0);
    const pris = [...rng.shuffle(divs).slice(0, 4), ...rng.shuffle(non).slice(0, 3)];
    return make(ctx, 'classification', `divs-${n}-${pris.join('|')}`, {
      prompt: `Range ces nombres : sont-ils des diviseurs de ${n} ?`,
      categories: [`diviseur de ${n}`, `pas diviseur de ${n}`],
      elements: rng.shuffle(pris).map((d) => ({ label: String(d), category: n % d === 0 ? 0 : 1 })),
      explication: `Un diviseur de ${n} est un nombre dont ${n} est dans la table : les diviseurs de ${n} sont ${diviseurs(n).join(', ')}.`,
      difficulty: n > 60 ? 0.6 : 0.5,
    });
  }
  if (forme === 3) {
    // Multiples d'un nombre ≤ 10 (tables)
    const d = rng.int(3, 9);
    const vals = new Set<number>();
    while (vals.size < 7) vals.add(tireNombre(rng, d * 3, 100, d, vals.size % 2 === 0));
    return make(ctx, 'classification', `mult-${d}-${[...vals].join('|')}`, {
      prompt: `Range ces nombres : sont-ils des multiples de ${d} ?`,
      categories: [`multiple de ${d}`, `pas multiple de ${d}`],
      elements: rng.shuffle([...vals]).map((x) => ({ label: String(x), category: x % d === 0 ? 0 : 1 })),
      explication: `Un multiple de ${d} est un résultat de la table de ${d} : ${Array.from(
        { length: Math.floor(100 / d) },
        (_, i) => d * (i + 1),
      )
        .slice(0, 12)
        .join(', ')}…`,
      difficulty: 0.45,
    });
  }
  // Plus loin : par 3 et par 9 (6e)
  const cat = (x: number) => (x % 9 === 0 ? 0 : x % 3 === 0 ? 1 : 2);
  const vals = new Set<number>();
  let g = 0;
  while (vals.size < 7 && g++ < 500) {
    const x = rng.int(100, 9_999);
    if ([...vals].filter((v) => cat(v) === cat(x)).length < 3) vals.add(x);
  }
  return make(ctx, 'classification', `crit39-${[...vals].join('|')}`, {
    prompt:
      'Range ces nombres (pour aller plus loin, règle de 6e) : sont-ils divisibles par 9, par 3 seulement, ou pas par 3 ?',
    categories: ['divisible par 9', 'par 3 mais pas par 9', 'pas divisible par 3'],
    elements: rng.shuffle([...vals]).map((x) => ({ label: fmt(x), category: cat(x) })),
    explication:
      'J’additionne les chiffres : si la somme est dans la table de 9, le nombre est divisible par 9 (donc par 3) ; si elle est seulement dans la table de 3, il est divisible par 3.',
    difficulty: 0.75,
  });
};

const divQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const d = rng.pick([2, 5, 10]);
    const good = tireNombre(rng, 100, 99_999, d, true);
    const wrong = [1, 2, 3].map(() => tireNombre(rng, 100, 99_999, d, false));
    return mcq(ctx, rng, `facile-${d}-${good}`, {
      question: `Lequel de ces nombres est divisible par ${d} ?`,
      good: fmt(good),
      wrong: wrong.map((x) => fmt(x)),
      explication: explDiv(good, d),
      difficulty: 0.2,
      max: 3,
    });
  }
  const forme = level === 'normal' ? rng.int(0, 3) : rng.int(3, 5);
  if (forme === 0) {
    const n = rng.pick([12, 16, 18, 20, 24, 28, 30]);
    const non = Array.from({ length: n - 2 }, (_, i) => i + 2).filter((d) => n % d !== 0 && d <= 12);
    const good = rng.pick(non);
    return mcq(ctx, rng, `pasdiv-${n}-${good}`, {
      question: `Lequel de ces nombres n’est pas un diviseur de ${n} ?`,
      good: String(good),
      wrong: diviseurs(n)
        .filter((d) => d > 1)
        .map(String),
      explication: `Les diviseurs de ${n} sont ${diviseurs(n).join(', ')}. ${good} n’en fait pas partie : ${n} n’est pas dans la table de ${good}.`,
      difficulty: 0.45,
    });
  }
  if (forme === 1) {
    // Diviseur commun (≤ 30)
    for (let i = 0; i < 100; i++) {
      const a = rng.int(8, 30);
      const b = rng.int(8, 30);
      const communs = diviseurs(pgcdLocal(a, b)).filter((d) => d > 1);
      if (a === b || !communs.length) continue;
      const good = rng.pick(communs);
      const seuls = [...diviseurs(a), ...diviseurs(b)].filter((d) => d > 1 && (a % d !== 0 || b % d !== 0));
      if (seuls.length < 2) continue;
      return mcq(ctx, rng, `commun-${a}-${b}-${good}`, {
        question: `Quel nombre est un diviseur commun à ${a} et à ${b} ?`,
        good: String(good),
        wrong: seuls.map(String),
        explication: `Diviseurs de ${a} : ${diviseurs(a).join(', ')}. Diviseurs de ${b} : ${diviseurs(b).join(', ')}. ${good} est dans les deux listes.`,
        difficulty: 0.55,
      });
    }
  }
  if (forme === 2 || forme === 1) {
    // Multiple commun de deux nombres < 15
    for (let i = 0; i < 100; i++) {
      const a = rng.int(2, 14);
      const b = rng.int(2, 14);
      if (a === b || a % b === 0 || b % a === 0) continue;
      const l = (a * b) / pgcdLocal(a, b);
      if (l > 100) continue;
      const good = l * (l <= 30 && rng.chance(0.4) ? 2 : 1);
      const wrong = [a * b + a, l + a, l + b, l - a, (good / a) * a + b].filter(
        (x) => x > 0 && (x % a !== 0 || x % b !== 0),
      );
      return mcq(ctx, rng, `multcommun-${a}-${b}-${good}`, {
        question: `Quel nombre est un multiple commun à ${a} et à ${b} ?`,
        good: String(good),
        wrong: wrong.map(String),
        explication: `${good} = ${a} × ${good / a} = ${b} × ${good / b} : il est dans la table de ${a} et dans celle de ${b}.`,
        difficulty: 0.55,
      });
    }
  }
  if (forme === 3) {
    // Divisible par un nombre ≤ 10 (tables)
    const d = level === 'plus_loin' ? rng.pick([3, 9]) : rng.pick([3, 4, 6, 7, 8, 9]);
    const max = level === 'plus_loin' ? 9_999 : 100;
    const good = tireNombre(rng, 20, max, d, true);
    const wrong = [1, 2, 3, 4].map(() => tireNombre(rng, 20, max, d, false));
    return mcq(ctx, rng, `table-${d}-${good}`, {
      question: `Lequel de ces nombres est divisible par ${d} ?`,
      good: fmt(good),
      wrong: wrong.map((x) => fmt(x)),
      explication: explDiv(good, d),
      difficulty: level === 'plus_loin' ? 0.7 : 0.5,
    });
  }
  if (forme === 4) {
    // Plus grand diviseur commun (au-delà du CM2)
    for (let i = 0; i < 100; i++) {
      const g = rng.int(2, 15);
      const a = g * rng.int(2, 6);
      const b = g * rng.int(2, 6);
      if (a === b || pgcdLocal(a, b) !== g || a > 60 || b > 60) continue;
      const autres = diviseurs(g).filter((d) => d !== g);
      const wrong = [
        ...autres,
        Math.abs(a - b) === g ? a + b : Math.abs(a - b),
        Math.min(a, b),
        g * 2,
      ].filter((x) => x !== g);
      return mcq(ctx, rng, `pgcd-${a}-${b}`, {
        question: `Quel est le plus grand diviseur commun à ${a} et à ${b} ?`,
        good: String(g),
        wrong: wrong.map(String),
        explication: `Diviseurs de ${a} : ${diviseurs(a).join(', ')}. Diviseurs de ${b} : ${diviseurs(b).join(', ')}. Le plus grand qui est dans les deux listes est ${g}.`,
        difficulty: 0.75,
      });
    }
  }
  // Plus loin : divisible par 9 parmi de grands nombres (pièges : divisibles par 3 seulement)
  const good = tireNombre(rng, 1000, 99_999, 9, true);
  const wrong: number[] = [];
  while (wrong.length < 3) {
    const x = tireNombre(rng, 1000, 99_999, 3, true);
    if (x % 9 !== 0) wrong.push(x);
  }
  return mcq(ctx, rng, `div9-${good}`, {
    question: 'Lequel de ces nombres est divisible par 9 ?',
    good: fmt(good),
    wrong: wrong.map((x) => fmt(x)),
    explication: explDiv(good, 9),
    difficulty: 0.75,
  });
};

const divNumeric: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    const d = rng.pick([2, 5, 10]);
    const apres = rng.chance(0.5);
    const n = tireNombre(rng, 100, 99_999, d, false);
    const rep = apres ? Math.ceil(n / d) * d : Math.floor(n / d) * d;
    return numeric(ctx, `voisin-${d}-${apres}-${n}`, {
      prompt: `Quel est le multiple de ${d} juste ${apres ? 'après' : 'avant'} ${fmt(n)} ?`,
      spoken: `Quel est le multiple de ${d} juste ${apres ? 'après' : 'avant'} ${n} ?`,
      answer: rep,
      explication: `Un multiple de ${d}, c’est un nombre divisible par ${d} : ${CRITERE[d]}. Juste ${apres ? 'après' : 'avant'} ${fmt(n)}, c’est ${fmt(rep)}.`,
      difficulty: d === 2 ? 0.2 : 0.3,
    });
  }
  const forme = level === 'normal' ? rng.int(0, 2) : rng.int(1, 4);
  if (forme === 0) {
    const n = rng.int(6, 30);
    const divs = diviseurs(n);
    return numeric(ctx, `nbdiv-${n}`, {
      prompt: `Combien ${n} a-t-il de diviseurs ?`,
      answer: divs.length,
      explication: `Les diviseurs de ${n} sont ${divs.join(', ')} : il y en a ${divs.length} (sans oublier 1 et ${n}).`,
      difficulty: clamp01(0.4 + divs.length * 0.04),
    });
  }
  if (forme === 1) {
    for (let i = 0; i < 100; i++) {
      const lim = level === 'normal' ? 14 : 20;
      const a = rng.int(2, lim);
      const b = rng.int(2, lim);
      if (a === b || a % b === 0 || b % a === 0) continue;
      const l = (a * b) / pgcdLocal(a, b);
      return numeric(ctx, `ppcm-${Math.min(a, b)}-${Math.max(a, b)}`, {
        prompt: `Quel est le plus petit multiple commun à ${a} et à ${b} (autre que 0) ?`,
        answer: l,
        explication: `Je récite la table de ${Math.max(a, b)} jusqu’à trouver un nombre aussi dans la table de ${Math.min(a, b)} : ${l} = ${a} × ${l / a} = ${b} × ${l / b}.`,
        difficulty: clamp01(0.5 + l / 300),
      });
    }
  }
  if (forme === 2) {
    for (let i = 0; i < 100; i++) {
      const a = rng.int(6, 30);
      const b = rng.int(6, 30);
      if (a === b) continue;
      const communs = diviseurs(pgcdLocal(a, b));
      if (communs.length < 2) continue;
      return numeric(ctx, `nbcommuns-${Math.min(a, b)}-${Math.max(a, b)}`, {
        prompt: `Combien y a-t-il de diviseurs communs à ${a} et à ${b} ?`,
        answer: communs.length,
        explication: `Diviseurs de ${a} : ${diviseurs(a).join(', ')}. Diviseurs de ${b} : ${diviseurs(b).join(', ')}. Ceux qui sont dans les deux listes : ${communs.join(', ')}.`,
        difficulty: 0.6,
      });
    }
  }
  if (forme === 3) {
    // Plus grand diviseur commun (≤ 60)
    for (let i = 0; i < 100; i++) {
      const g = rng.int(2, 15);
      const a = g * rng.int(2, 6);
      const b = g * rng.int(2, 6);
      if (a === b || pgcdLocal(a, b) !== g || a > 60 || b > 60) continue;
      return numeric(ctx, `pgcd-${Math.min(a, b)}-${Math.max(a, b)}`, {
        prompt: `Quel est le plus grand diviseur commun à ${a} et à ${b} ?`,
        answer: g,
        explication: `${a} = ${g} × ${a / g} et ${b} = ${g} × ${b / g} : ${g} divise les deux, et aucun nombre plus grand ne les divise tous les deux.`,
        difficulty: 0.7,
      });
    }
  }
  // Chiffre manquant pour être divisible par 9 (6e) : une seule solution (somme non multiple de 9)
  for (let i = 0; i < 100; i++) {
    const base = rng.int(100, 9_999);
    const s = sommeChiffres(base);
    if (s % 9 === 0) continue;
    const c = (9 - (s % 9)) % 9;
    return numeric(ctx, `chiffre9-${base}`, {
      prompt: `J’écris un chiffre à la fin de ${base} pour obtenir un nombre divisible par 9. Quel chiffre ?`,
      spoken: `Quel chiffre faut-il écrire à la fin de ${base} pour obtenir un nombre divisible par 9 ?`,
      answer: c,
      explication: `La somme des chiffres de ${base} est ${s} ; pour arriver à ${s + c}, qui est dans la table de 9, il faut ajouter ${c} (règle de 6e).`,
      difficulty: 0.8,
    });
  }
  return numeric(ctx, 'nbdiv-12', {
    prompt: 'Combien 12 a-t-il de diviseurs ?',
    answer: 6,
    explication: 'Les diviseurs de 12 sont 1, 2, 3, 4, 6, 12 : il y en a 6.',
    difficulty: 0.5,
  });
};

const divVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  if (level === 'facile') {
    const d = rng.pick([2, 5, 10]);
    const n = tireNombre(rng, 100, 999_999, d, juste);
    return vraiFaux(ctx, `vf-${d}-${n}`, {
      statement: `${fmt(n)} est divisible par ${d}.`,
      spoken: `${n} est divisible par ${d}.`,
      answer: n % d === 0,
      explication: explDiv(n, d),
      difficulty: 0.2,
    });
  }
  if (level === 'plus_loin' && rng.chance(0.6)) {
    const d = rng.pick([3, 9]);
    const n = tireNombre(rng, 1000, 99_999, d, juste);
    return vraiFaux(ctx, `vf39-${d}-${n}`, {
      statement: `${fmt(n)} est divisible par ${d}.`,
      spoken: `${n} est divisible par ${d}.`,
      answer: n % d === 0,
      explication: explDiv(n, d),
      difficulty: 0.7,
    });
  }
  const forme = rng.int(0, 2);
  const d = rng.int(3, 9);
  const n = tireNombre(rng, 20, 100, d, juste);
  if (forme === 0)
    return vraiFaux(ctx, `vf-diviseur-${d}-${n}`, {
      statement: `${d} est un diviseur de ${n}.`,
      answer: n % d === 0,
      explication: explDiv(n, d),
      difficulty: 0.45,
    });
  if (forme === 1)
    return vraiFaux(ctx, `vf-multiple-${d}-${n}`, {
      statement: `${n} est un multiple de ${d}.`,
      answer: n % d === 0,
      explication: explDiv(n, d),
      difficulty: 0.45,
    });
  // Diviseur commun
  for (let i = 0; i < 100; i++) {
    const a = rng.int(8, 30);
    const b = rng.int(8, 30);
    const x = rng.int(2, 10);
    if (a === b || (a % x === 0 && b % x === 0) !== juste) continue;
    if (!juste && a % x !== 0 && b % x !== 0) continue; // piège : diviseur d'un seul des deux
    return vraiFaux(ctx, `vf-commun-${a}-${b}-${x}`, {
      statement: `${x} est un diviseur commun à ${a} et à ${b}.`,
      answer: a % x === 0 && b % x === 0,
      explication: `Diviseurs de ${a} : ${diviseurs(a).join(', ')}. Diviseurs de ${b} : ${diviseurs(b).join(', ')}. ${x} ${a % x === 0 && b % x === 0 ? 'est dans les deux listes' : 'n’est pas dans les deux listes'}.`,
      difficulty: 0.55,
    });
  }
  return vraiFaux(ctx, `vf-multiple-${d}-${n}`, {
    statement: `${n} est un multiple de ${d}.`,
    answer: n % d === 0,
    explication: explDiv(n, d),
    difficulty: 0.45,
  });
};

const divRanger: ItemGen = (level, rng, ctx) => {
  const n = parNiv(level, {
    facile: rng.pick([6, 8, 10, 14, 15]),
    normal: rng.pick([12, 16, 18, 20, 24, 28, 30]),
    plus_loin: rng.pick([36, 40, 42, 45, 48, 50, 54, 56, 63, 64, 66, 70, 75, 80, 81, 88, 98, 100]),
  });
  const divs = diviseurs(n);
  return make(ctx, 'ordering', `rangerdivs-${n}`, {
    prompt: `Voici tous les diviseurs de ${n}. Range-les du plus petit au plus grand.`,
    elements: divs.map(String),
    mode: 'croissant',
    explication: `Je cherche les diviseurs par paires de produits égaux à ${n} (${divs
      .filter((d) => d * d <= n)
      .map((d) => `${d} × ${n / d}`)
      .join(', ')}), puis je les range : ${divs.join(', ')}.`,
    difficulty: clamp01(0.3 + divs.length * 0.05),
  });
};

export const NOMBRES: Record<string, LessonContent> = {
  'CM2.MA.NUM.GRANDS': {
    gens: {
      numeric_answer: grandsNumeric,
      fill_blank: grandsLettresTrou,
      mcq: grandsQcm,
      oral_answer: grandsOral,
      true_false: grandsVraiFaux,
    },
  },
  'CM2.MA.NUM.COMPARER': {
    gens: {
      mcq: comparerCroco,
      ordering: comparerRanger,
      number_line: comparerDroite,
      numeric_answer: comparerNumeric,
      true_false: comparerVraiFaux,
    },
  },
  'CM2.MA.NUM.DIVISIBILITE': {
    gens: {
      classification: divClasser,
      mcq: divQcm,
      numeric_answer: divNumeric,
      true_false: divVraiFaux,
      ordering: divRanger,
    },
  },
};
