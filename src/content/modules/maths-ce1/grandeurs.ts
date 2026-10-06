/**
 * CE1 — Grandeurs et mesures (BO n°41 du 31/10/2024) :
 * - longueurs : m, cm, km ; 1 m = 100 cm et 1 km = 1 000 m (attendu) ; mm et dm = CE2 (pour aller plus loin) ;
 *   pas d'écriture à virgule ; mesurer à la règle, estimer, comparer ;
 * - masses : g, kg ; 1 kg = 1 000 g ; balance, masses de référence, ordonner ;
 * - monnaie : 100 centimes = 1 € ; écriture à virgule dès P3 (2,05 € ≠ 2,50 €) ; payer, rendre la monnaie ;
 *   pièces de 1 c à 2 € et billets de 5 € à 100 € (choix de l'application, liste non citée par le BO) ;
 * - temps courts : heures (y compris > 12), demi-heure, quarts d'heure, 1 h = 60 min, durées d'une même journée.
 *   (Jours, mois, années relèvent de « Questionner le monde ».)
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, dire, distinctInts, euros, eurosDits, fmt, make, mcq, numeric, parNiv } from './util';

/* ------------------------------------------------------------------ */
/* CE1.MA.GM.LONGUEURS                                                 */
/* ------------------------------------------------------------------ */

const A_MESURER: [string, string][] = [
  ['✏️', 'le crayon'],
  ['🖍️', 'la craie grasse'],
  ['🔑', 'la clé'],
  ['🥕', 'la carotte'],
  ['🐛', 'la chenille'],
  ['📎', 'le trombone'],
  ['🥖', 'la baguette miniature'],
  ['🪥', 'la brosse à dents'],
];

/** Écrit une longueur en cm sous la forme « 1 m 46 cm » ou « 146 cm ». */
const enMcm = (cm: number) =>
  cm >= 100 ? `${Math.floor(cm / 100)} m${cm % 100 ? ` ${cm % 100} cm` : ''}` : `${cm} cm`;

const longMesure: ItemGen = (level, rng, ctx) => {
  const [objet, nom] = rng.pick(A_MESURER);
  if (level === 'plus_loin') {
    const mm = rng.int(20, 150);
    return numeric(ctx, `mesure-mm-${objet}-${mm}`, {
      prompt: `Mesure ${nom} avec la règle (en millimètres).`,
      answer: mm,
      unit: 'mm',
      explication: `On place le 0 de la règle au bout de l’objet ; chaque petit trait vaut 1 mm (1 cm = 10 mm) : ${mm} mm.`,
      difficulty: 0.7,
      meta: { mesure: { objet, longueur: mm, unite: 'mm' } },
    });
  }
  const cm = rng.int(2, level === 'facile' ? 12 : 20);
  return numeric(ctx, `mesure-${objet}-${cm}`, {
    prompt: `Mesure ${nom} avec la règle.`,
    answer: cm,
    unit: 'cm',
    explication: `On place le 0 de la règle au bout de l’objet et on lit le nombre à l’autre bout : ${cm} cm.`,
    difficulty: level === 'facile' ? 0.2 : 0.35,
    meta: { mesure: { objet, longueur: cm, unite: 'cm' } },
  });
};

const longConvertir: ItemGen = (level, rng, ctx) => {
  // mesurer avec la règle : surtout en facile, mais aussi en normal (cm) et en plus loin (mm)
  if (rng.chance(level === 'facile' ? 0.6 : 0.3)) return longMesure(level, rng, ctx);
  type C = { p: string; a: number; u: string; e: string; d: number };
  const formes: (() => C)[] = [
    () => ({ p: '1 m = … cm', a: 100, u: 'cm', e: '1 mètre, c’est 100 centimètres.', d: 0.2 }),
    () => {
      const m = rng.int(2, 9);
      return {
        p: `${m} m = … cm`,
        a: m * 100,
        u: 'cm',
        e: `1 m = 100 cm, donc ${m} m = ${m} × 100 cm = ${m * 100} cm.`,
        d: 0.35,
      };
    },
    () => {
      const m = rng.int(1, 9);
      const c = rng.int(1, 99);
      return {
        p: `${m} m ${c} cm = … cm`,
        a: m * 100 + c,
        u: 'cm',
        e: `${m} m = ${m * 100} cm, et ${m * 100} cm + ${c} cm = ${m * 100 + c} cm.`,
        d: 0.55,
      };
    },
    () => {
      const m = rng.int(2, 9);
      return {
        p: `${m * 100} cm = … m`,
        a: m,
        u: 'm',
        e: `100 cm = 1 m, donc ${m * 100} cm = ${m} m.`,
        d: 0.45,
      };
    },
    () => ({ p: '1 km = … m', a: 1000, u: 'm', e: '1 kilomètre, c’est 1 000 mètres.', d: 0.3 }),
    () => {
      const m = rng.int(1, 9) * 100;
      return {
        p: `${m} m + … m = 1 km`,
        a: 1000 - m,
        u: 'm',
        e: `1 km = 1 000 m et ${m} + ${1000 - m} = 1 000.`,
        d: 0.55,
      };
    },
    () => {
      const c = rng.int(1, 9) * 10;
      return {
        p: `1 m − ${c} cm = … cm`,
        a: 100 - c,
        u: 'cm',
        e: `1 m = 100 cm et 100 − ${c} = ${100 - c}.`,
        d: 0.6,
      };
    },
  ];
  const loin: (() => C)[] = [
    () => ({ p: '1 cm = … mm', a: 10, u: 'mm', e: '1 centimètre, c’est 10 millimètres.', d: 0.5 }),
    () => {
      const c = rng.int(2, 9);
      const m = rng.int(1, 9);
      return {
        p: `${c} cm ${m} mm = … mm`,
        a: c * 10 + m,
        u: 'mm',
        e: `${c} cm = ${c * 10} mm, plus ${m} mm : ${c * 10 + m} mm.`,
        d: 0.7,
      };
    },
    () => {
      const k = rng.int(2, 9);
      return {
        p: `${k} km = … m`,
        a: k * 1000,
        u: 'm',
        e: `1 km = 1 000 m, donc ${k} km = ${fmt(k * 1000)} m.`,
        d: 0.6,
      };
    },
    () => {
      const k = rng.int(1, 9);
      const m = rng.int(1, 9) * 100;
      return {
        p: `${k} km ${m} m = … m`,
        a: k * 1000 + m,
        u: 'm',
        e: `${k} km = ${fmt(k * 1000)} m, plus ${m} m : ${fmt(k * 1000 + m)} m.`,
        d: 0.8,
      };
    },
    () => ({ p: '1 m = … dm', a: 10, u: 'dm', e: '1 mètre, c’est 10 décimètres (1 dm = 10 cm).', d: 0.6 }),
  ];
  const liste = level === 'facile' ? formes.slice(0, 2) : level === 'normal' ? formes : loin;
  const c = rng.pick(liste)();
  return numeric(ctx, `conv-${c.p}`, {
    prompt: c.p,
    spoken: dire(c.p),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

/** [objet, bonne longueur, mauvaises longueurs, niveau minimal] — longueurs de référence (BO : trousse 2 cm, 20 cm ou 2 m ?). */
const ESTIMATIONS: [string, string, string[], Level][] = [
  ['Une trousse mesure plutôt…', '20 cm', ['2 cm', '2 m'], 'facile'],
  ['Une voiture mesure plutôt…', '4 m', ['40 m', '40 cm'], 'facile'],
  ['Un crayon neuf mesure plutôt…', '15 cm', ['15 m', '1 cm'], 'facile'],
  ['Une porte mesure plutôt…', '2 m', ['20 m', '20 cm'], 'facile'],
  ['Un timbre mesure plutôt…', '3 cm', ['3 m', '30 cm'], 'normal'],
  ['La table de la classe mesure plutôt…', '1 m', ['1 km', '10 cm'], 'normal'],
  ['Un bus mesure plutôt…', '12 m', ['12 cm', '120 m'], 'normal'],
  ['Un terrain de football mesure plutôt…', '100 m', ['100 cm', '10 km'], 'normal'],
  ['Le chemin de l’école à la piscine du village mesure plutôt…', '1 km', ['1 m', '1 cm'], 'normal'],
  ['Une fourmi mesure plutôt…', '5 mm', ['5 cm', '5 m'], 'plus_loin'],
  ['La tour Eiffel mesure plutôt…', '300 m', ['30 m', '3 km'], 'plus_loin'],
  ['Un marathon (une très longue course) mesure plutôt…', '42 km', ['42 m', '420 m'], 'plus_loin'],
];

const UNITES_LONG: [string, string, Level][] = [
  ['la longueur d’un cahier', 'cm', 'facile'],
  ['la hauteur d’un immeuble', 'm', 'facile'],
  ['la distance entre deux villes', 'km', 'normal'],
  ['la longueur d’une gomme', 'cm', 'facile'],
  ['la longueur de la cour', 'm', 'normal'],
  ['l’épaisseur d’une pièce de monnaie', 'mm', 'plus_loin'],
];
const niveauOk = (lv: Level, min: Level) =>
  ['facile', 'normal', 'plus_loin'].indexOf(lv) >= ['facile', 'normal', 'plus_loin'].indexOf(min);

const longQcm: ItemGen = (level, rng, ctx) => {
  const forme = rng.int(0, 2);
  if (forme === 0) {
    const [q, good, wrong] = rng.pick(ESTIMATIONS.filter((e) => niveauOk(level, e[3])));
    return mcq(ctx, rng, `estim-${q}`, {
      question: q,
      good,
      wrong,
      explication: `${q.replace(' plutôt…', '')} environ ${good} : compare avec des longueurs que tu connais (une règle mesure 20 cm, une porte 2 m).`,
      difficulty: 0.35,
    });
  }
  if (forme === 1) {
    const [quoi, u] = rng.pick(UNITES_LONG.filter((e) => niveauOk(level, e[2])));
    const unites = level === 'plus_loin' ? ['mm', 'cm', 'm', 'km'] : ['cm', 'm', 'km'];
    return mcq(ctx, rng, `unite-${quoi}`, {
      question: `Quelle unité choisir pour mesurer ${quoi} ?`,
      good: u,
      wrong: unites.filter((x) => x !== u),
      fixedOrder: unites,
      explication: `Pour ${quoi}, on utilise le ${{ mm: 'millimètre', cm: 'centimètre', m: 'mètre', km: 'kilomètre' }[u]}.`,
      difficulty: 0.3,
    });
  }
  // Comparer deux longueurs (crocodiles)
  let a: number;
  let b: number;
  if (level === 'facile') [a, b] = distinctInts(rng, 2, 5, 95) as [number, number];
  else {
    a = rng.int(100, 900);
    b = rng.chance(0.2) ? a : rng.chance(0.5) ? a + rng.pick([-20, 20, -18, 18, 80, -80]) : rng.int(100, 900);
    if (b < 1) b = a + 10;
  }
  const gauche = level === 'facile' ? `${a} cm` : enMcm(a);
  const droite = level === 'facile' || rng.chance(0.5) ? `${b} cm` : enMcm(b);
  const s = a < b ? '<' : a > b ? '>' : '=';
  return mcq(ctx, rng, `cmp-${gauche}-${droite}`, {
    question: `Compare : ${gauche} … ${droite}`,
    good: s,
    wrong: [],
    fixedOrder: ['<', '=', '>'],
    explication:
      gauche.includes(' m') || droite.includes(' m')
        ? `On écrit tout en centimètres : ${a} cm ${s} ${b} cm (1 m = 100 cm).`
        : `On compare les nombres de centimètres : ${a} cm ${s} ${b} cm.`,
    difficulty: level === 'facile' ? 0.25 : 0.6,
    meta: { gauche, droite },
  });
};

const longRanger: ItemGen = (level, rng, ctx) => {
  const nb = level === 'facile' ? 3 : 4;
  const vals =
    level === 'facile'
      ? distinctInts(rng, nb, 3, 99)
      : distinctInts(rng, nb, 60, level === 'normal' ? 900 : 990);
  const sorted = [...vals].sort((x, y) => x - y);
  const ecrit = sorted.map((v) => (level === 'facile' || v < 100 || rng.chance(0.4) ? `${v} cm` : enMcm(v)));
  return make(ctx, 'ordering', `ranger-${ecrit.join('|')}`, {
    prompt: 'Range ces longueurs de la plus courte à la plus longue.',
    elements: ecrit,
    mode: 'croissant',
    explication: 'On écrit toutes les longueurs dans la même unité (1 m = 100 cm), puis on compare.',
    difficulty: level === 'facile' ? 0.25 : 0.6,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GM.MASSES                                                    */
/* ------------------------------------------------------------------ */

/** Boite de masses marquées d'une balance de type Roberval (en grammes). */
const MASSES_MARQUEES = [500, 200, 200, 100, 50, 20, 20, 10, 5, 2, 2, 1];
/** [emoji, nom, masse mini, masse maxi] : objets légers (facile) et plus lourds, masses réalistes. */
const LEGERS: [string, string, number, number][] = [
  ['✏️', 'le crayon', 4, 9],
  ['🔑', 'la clé', 10, 30],
  ['🍬', 'le bonbon', 3, 8],
  ['🥚', 'l’œuf', 30, 39],
  ['🍓', 'la fraise', 11, 25],
];
const LOURDS: [string, string, number, number][] = [
  ['🍎', 'la pomme', 120, 250],
  ['🍈', 'le melon', 600, 999],
  ['📕', 'le livre', 300, 900],
  ['🧸', 'l’ours en peluche', 200, 600],
  ['🧀', 'le fromage', 150, 500],
  ['🍌', 'la banane', 100, 200],
];

/** Masses marquées qui équilibrent `m` grammes (on prend toujours la plus grande possible). */
function massesPour(m: number, dispo: number[]): number[] {
  const out: number[] = [];
  let r = m;
  for (const v of [...dispo].sort((x, y) => y - x))
    if (v <= r) {
      out.push(v);
      r -= v;
    }
  return r === 0 ? out : [];
}

const massesBalance: ItemGen = (level, rng, ctx) => {
  const forme = level === 'facile' ? 0 : rng.int(0, 3);
  if (forme === 0) {
    // Balance de type Roberval : l'objet pèse autant que les masses marquées
    const dispo = level === 'facile' ? [20, 10, 5, 2, 2, 1] : MASSES_MARQUEES;
    const liste = level === 'facile' ? LEGERS : LOURDS;
    let objet = rng.pick(liste);
    let masses: number[] = [];
    for (let essai = 0; essai < 50 && !masses.length; essai++) {
      objet = rng.pick(liste);
      masses = massesPour(rng.int(objet[2], objet[3]), dispo);
    }
    if (!masses.length) masses = [20, 5];
    const total = masses.reduce((x, y) => x + y, 0);
    const [emoji, nom] = objet;
    return numeric(ctx, `balance-${nom}-${masses.join('+')}`, {
      prompt: `La balance est en équilibre : ${nom} est sur un plateau, et sur l’autre il y a ${masses.map((m) => `${m} g`).join(' + ')}. Combien pèse ${nom} ?`,
      spoken: `La balance est en équilibre : ${nom} est sur un plateau, et sur l’autre il y a ${masses.map((m) => `${m} gramme${m > 1 ? 's' : ''}`).join(' plus ')}. Combien pèse ${nom} ?`,
      answer: total,
      unit: 'g',
      explication:
        masses.length > 1
          ? `La balance est en équilibre, donc ${nom} pèse autant que les masses : ${masses.join(' + ')} = ${total} g.`
          : `La balance est en équilibre, donc ${nom} pèse autant que la masse : ${total} g.`,
      difficulty: clamp01(0.15 + masses.length * 0.08),
      meta: { balance: { masses, unite: 'g', objet: emoji } },
    });
  }
  type C = { p: string; a: number; u: string; e: string; d: number };
  const normal: (() => C)[] = [
    () => ({ p: '1 kg = … g', a: 1000, u: 'g', e: '1 kilogramme, c’est 1 000 grammes.', d: 0.3 }),
    () => {
      const g = rng.int(1, 9) * 100;
      return {
        p: `${g} g + … g = 1 kg`,
        a: 1000 - g,
        u: 'g',
        e: `1 kg = 1 000 g et ${g} + ${1000 - g} = 1 000.`,
        d: 0.55,
      };
    },
    () => {
      const g = rng.pick([250, 500, 200, 100]);
      return {
        p: `Combien de paquets de ${g} g faut-il pour faire 1 kg ?`,
        a: 1000 / g,
        u: 'paquets',
        e: `1 kg = 1 000 g et ${1000 / g} × ${g} g = 1 000 g.`,
        d: 0.65,
      };
    },
  ];
  const loin: (() => C)[] = [
    () => {
      const k = rng.int(1, 5);
      const g = rng.int(1, 9) * 100;
      return {
        p: `${k} kg ${g} g = … g`,
        a: k * 1000 + g,
        u: 'g',
        e: `${k} kg = ${fmt(k * 1000)} g, plus ${g} g : ${fmt(k * 1000 + g)} g.`,
        d: 0.7,
      };
    },
    () => {
      const k = rng.int(2, 9);
      return {
        p: `${fmt(k * 1000)} g = … kg`,
        a: k,
        u: 'kg',
        e: `1 000 g = 1 kg, donc ${fmt(k * 1000)} g = ${k} kg.`,
        d: 0.6,
      };
    },
    () => {
      const k = rng.int(1, 3);
      const g = rng.int(2, 9) * 100;
      return {
        p: `Un sac de ${k} kg de pommes et un melon de ${g} g sont dans le panier. Quelle est la masse totale en grammes ?`,
        a: k * 1000 + g,
        u: 'g',
        e: `${k} kg = ${fmt(k * 1000)} g ; ${fmt(k * 1000)} + ${g} = ${fmt(k * 1000 + g)} g.`,
        d: 0.8,
      };
    },
  ];
  const c = rng.pick(level === 'plus_loin' ? loin : normal)();
  return numeric(ctx, `conv-${c.p}`, {
    prompt: c.p,
    spoken: dire(c.p),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

const ESTIM_MASSES: [string, string, string[], Level][] = [
  ['Un paquet de sucre pèse…', '1 kg', ['1 g', '100 kg'], 'facile'],
  ['Un sachet de levure pèse environ…', '10 g', ['10 kg', '1 kg'], 'normal'],
  ['Une pomme pèse environ…', '150 g', ['150 kg', '15 kg'], 'facile'],
  ['Un cartable rempli pèse environ…', '3 kg', ['3 g', '300 kg'], 'facile'],
  ['Un trombone pèse environ…', '1 g', ['1 kg', '100 g'], 'normal'],
  ['Un chien de taille moyenne pèse environ…', '20 kg', ['20 g', '200 kg'], 'normal'],
  ['Un vélo pèse environ…', '12 kg', ['12 g', '120 kg'], 'normal'],
  ['Une voiture pèse environ…', '1 000 kg', ['1 000 g', '10 kg'], 'plus_loin'],
];

const massesQcm: ItemGen = (level, rng, ctx) => {
  const forme = rng.int(0, 1);
  if (forme === 0) {
    const [q, good, wrong] = rng.pick(ESTIM_MASSES.filter((e) => niveauOk(level, e[3])));
    return mcq(ctx, rng, `estim-${q}`, {
      question: q,
      good,
      wrong,
      explication: /sucre/.test(q)
        ? 'Un paquet de sucre pèse 1 kg : c’est une masse de référence à retenir.'
        : `${q.replace(/ (environ)?…$/, '')} environ ${good} ; compare avec un paquet de sucre, qui pèse 1 kg.`,
      difficulty: 0.35,
    });
  }
  const paires: [string, number][] = [
    ['1 kg', 1000],
    ['900 g', 900],
    ['1 000 g', 1000],
    ['800 g', 800],
    ['500 g', 500],
    ['2 kg', 2000],
    ['1 kg 300 g', 1300],
    ['950 g', 950],
  ];
  const facile: [string, number][] = [
    ['10 g', 10],
    ['50 g', 50],
    ['200 g', 200],
    ['500 g', 500],
    ['1 kg', 1000],
    ['2 kg', 2000],
  ];
  const [[gauche, a], [droite, b]] = rng.shuffle(level === 'facile' ? facile : paires) as [
    [string, number],
    [string, number],
  ];
  const s = a < b ? '<' : a > b ? '>' : '=';
  return mcq(ctx, rng, `cmp-${gauche}-${droite}`, {
    question: `Compare : ${gauche} … ${droite}`,
    good: s,
    wrong: [],
    fixedOrder: ['<', '=', '>'],
    explication: `On compare dans la même unité (1 kg = 1 000 g) : ${gauche} ${s} ${droite}.`,
    difficulty: level === 'facile' ? 0.3 : 0.6,
    meta: { gauche, droite },
  });
};

const massesRanger: ItemGen = (level, rng, ctx) => {
  // BO : ordonner 1 kg et 300 g ; 1 000 g ; 50 kg ; 2 kg et 100 g
  const pool: [string, number][] =
    level === 'facile'
      ? [
          ['5 g', 5],
          ['20 g', 20],
          ['100 g', 100],
          ['500 g', 500],
          ['1 kg', 1000],
          ['3 kg', 3000],
        ]
      : [
          ['1 kg et 300 g', 1300],
          ['1 000 g', 1000],
          ['50 kg', 50000],
          ['2 kg et 100 g', 2100],
          ['900 g', 900],
          ['3 kg', 3000],
          ['2 kg', 2000],
          ['1 kg et 50 g', 1050],
          ['600 g', 600],
        ];
  let choix = rng.shuffle(pool).slice(0, level === 'facile' ? 3 : 4);
  // éviter deux masses égales (1 kg et 1 000 g)
  while (new Set(choix.map((c) => c[1])).size < choix.length)
    choix = rng.shuffle(pool).slice(0, choix.length);
  const sorted = [...choix].sort((x, y) => x[1] - y[1]);
  return make(ctx, 'ordering', `ranger-${sorted.map((c) => c[0]).join('|')}`, {
    prompt: 'Range ces masses de la plus légère à la plus lourde.',
    elements: sorted.map((c) => c[0]),
    mode: 'croissant',
    explication: 'On compare dans la même unité : 1 kg = 1 000 g.',
    difficulty: level === 'facile' ? 0.3 : 0.65,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GM.MONNAIE                                                   */
/* ------------------------------------------------------------------ */

export const PIECES_BILLETS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const nomValeur = (c: number) => (c >= 100 ? `${c / 100} €` : `${c} c`);

/** Décomposition gloutonne (la plus courte) d'un montant. */
function decompose(cents: number, dispo = PIECES_BILLETS): number[] {
  const out: number[] = [];
  let r = cents;
  for (const v of [...dispo].sort((a, b) => b - a))
    while (r >= v) {
      out.push(v);
      r -= v;
    }
  return out;
}

const prixMonnaie = (level: Level, rng: Rng) =>
  parNiv(level, {
    facile: rng.int(1, 10) * 100,
    normal: rng.chance(0.3) ? rng.int(1, 99) * 100 : rng.int(5, 9999),
    plus_loin: rng.int(5, 9999),
  });

const monnaieMoney: ItemGen = (level, rng, ctx) => {
  const prix = prixMonnaie(level, rng);
  const dispo = level === 'facile' ? [100, 200, 500, 1000] : PIECES_BILLETS;
  const rendre = level === 'plus_loin' || (level === 'normal' && rng.chance(0.5));
  if (!rendre)
    return make(ctx, 'money', `payer-${prix}`, {
      prompt: `Paie exactement ${euros(prix)}.`,
      spoken: `Paie exactement ${eurosDits(prix)}.`,
      task: 'payer',
      priceCents: prix,
      denominations: dispo,
      explication: `Par exemple : ${decompose(prix, dispo).map(nomValeur).join(' + ')} = ${euros(prix)}.`,
      difficulty: clamp01(0.15 + decompose(prix, dispo).length * 0.06),
    });
  const donne = [100, 200, 500, 1000, 2000, 5000, 10000].find((x) => x > prix) ?? 10000;
  const rendu = donne - prix;
  const optimal = level === 'plus_loin';
  return make(ctx, 'money', `rendre-${prix}-${donne}`, {
    prompt: `Le client achète pour ${euros(prix)} et donne ${euros(donne)}. Rends la monnaie${optimal ? ' avec le moins de pièces et de billets possible' : ''}.`,
    spoken: `Le client achète pour ${eurosDits(prix)} et donne ${eurosDits(donne)}. Rends la monnaie${optimal ? ' avec le moins de pièces et de billets possible' : ''}.`,
    task: 'rendre',
    priceCents: prix,
    givenCents: donne,
    denominations: dispo.filter((d) => d < donne),
    explication: `${euros(donne)} − ${euros(prix)} = ${euros(rendu)}, par exemple ${decompose(rendu).map(nomValeur).join(' + ')}.`,
    difficulty: clamp01(0.4 + decompose(rendu).length * 0.05),
    meta: optimal ? { optimal: true, nbMini: decompose(rendu).length } : undefined,
  });
};

const monnaieNumeric: ItemGen = (level, rng, ctx) => {
  type C = { p: string; a: number; u?: string; e: string; d: number };
  const formes: (() => C)[] = [
    () => ({
      p: '1 € = … centimes',
      a: 100,
      u: 'c',
      e: 'Une pièce de 1 € vaut autant que 100 pièces de 1 centime.',
      d: 0.2,
    }),
    () => {
      const v = rng.pick([10, 20, 50]);
      return {
        p: `Combien de pièces de ${v} centimes faut-il pour faire 1 € ?`,
        a: 100 / v,
        e: `${100 / v} × ${v} c = 100 c = 1 €.`,
        d: 0.4,
      };
    },
    () => {
      const n2 = rng.int(1, 4);
      const b = rng.pick([5, 10, 20]);
      return {
        p: `${n2} pièce${n2 > 1 ? 's' : ''} de 2 € et 1 billet de ${b} €, ça fait … €`,
        a: 2 * n2 + b,
        u: '€',
        e: `${n2} × 2 € = ${2 * n2} € et ${2 * n2} + ${b} = ${2 * n2 + b} €.`,
        d: 0.35,
      };
    },
  ];
  const normal: (() => C)[] = [
    () => {
      const e = rng.int(1, 9);
      const c = rng.int(11, 99);
      return {
        p: `${e * 100 + c} centimes = … € et ${c} centimes`,
        a: e,
        u: '€',
        e: `${e * 100 + c} c = ${e * 100} c + ${c} c = ${e} € et ${c} c.`,
        d: 0.5,
      };
    },
    () => {
      const e = rng.int(1, 9);
      const c = rng.int(1, 9);
      return {
        p: `${e} € et ${c} centimes = … €`,
        a: e + c / 100,
        u: '€',
        e: `${e} € et ${c} centimes s’écrit ${euros(e * 100 + c)} (et pas ${e},${c} €).`,
        d: 0.7,
      };
    },
    () => {
      const e = rng.int(1, 5);
      const c = rng.int(1, 9) * 10 + 100;
      return {
        p: `${e} € et ${c} centimes = … centimes`,
        a: e * 100 + c,
        u: 'c',
        e: `${e} € = ${e * 100} c, et ${e * 100} + ${c} = ${e * 100 + c} c.`,
        d: 0.6,
      };
    },
  ];
  const loin: (() => C)[] = [
    () => {
      const b = rng.int(1, 4);
      const k = rng.int(0, 4) * 2 + 1;
      return {
        p: `${b} billet${b > 1 ? 's' : ''} de 10 € et ${k} pièce${k > 1 ? 's' : ''} de 5 centimes, ça fait … €`,
        a: b * 10 + (k * 5) / 100,
        u: '€',
        e: `${b} × 10 € = ${b * 10} € et ${k} × 5 c = ${k * 5} c, donc ${euros(b * 1000 + k * 5)}.`,
        d: 0.8,
      };
    },
    () => {
      const c = rng.int(2, 9) * 100 + rng.int(1, 9);
      return {
        p: `${c} centimes = … €`,
        a: c / 100,
        u: '€',
        e: `${c} c = ${Math.floor(c / 100)} € et ${c % 100} c = ${euros(c)}.`,
        d: 0.8,
      };
    },
  ];
  const liste = parNiv(level, {
    facile: formes,
    normal: [...formes, ...normal],
    plus_loin: [...normal, ...loin],
  });
  const c = rng.pick(liste)();
  return numeric(ctx, `conv-${c.p}`, {
    prompt: c.p,
    spoken: dire(c.p),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

const monnaieQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'facile' || rng.chance(0.4)) {
    // Comparer des sommes (BO : 3 pièces de 2 € valent plus que 50 pièces de 10 c ; 12 € > 60 c)
    const cas: [string, number, string, number][] = [
      ['12 €', 1200, '60 c', 60],
      ['3 pièces de 2 €', 600, '50 pièces de 10 c', 500],
      ['1 €', 100, '100 c', 100],
      ['2 billets de 5 €', 1000, '10 pièces de 1 €', 1000],
      ['5 pièces de 20 c', 100, '1 pièce de 2 €', 200],
      ['8 €', 800, '90 c', 90],
      ['1 billet de 10 €', 1000, '4 pièces de 2 €', 800],
      ['10 pièces de 10 c', 100, '1 pièce de 50 c', 50],
    ];
    const [gauche, a, droite, b] = rng.pick(cas);
    const s = a < b ? '<' : a > b ? '>' : '=';
    return mcq(ctx, rng, `cmp-${gauche}-${droite}`, {
      question: `Compare : ${gauche} … ${droite}`,
      good: s,
      wrong: [],
      fixedOrder: ['<', '=', '>'],
      explication: `${gauche} = ${euros(a)} et ${droite} = ${euros(b)} : on compare les valeurs, pas le nombre de pièces.`,
      difficulty: 0.45,
      meta: { gauche, droite },
    });
  }
  // Écriture à virgule (BO : 2 € et 5 centimes s'écrit 2,05 € ; 2 € et 50 centimes s'écrit 2,50 €)
  const e = rng.int(1, 9);
  const c = rng.chance(0.5) ? rng.int(1, 9) : rng.pick([50, 20, rng.int(11, 99)]);
  const good = euros(e * 100 + c);
  const wrong =
    c < 10
      ? [`${e},${c} €`, euros(e * 100 + c * 10), `${e}${c} €`, euros(c * 100 + e)]
      : [
          euros(e * 100 + (c % 10) * 10 + Math.floor(c / 10)),
          `${e * 100 + c} €`,
          euros(c * 100 + e),
          euros(e * 100 + c + 100),
        ];
  return mcq(ctx, rng, `virgule-${e}-${c}`, {
    question: `Comment écrit-on ${e} € et ${c} centime${c > 1 ? 's' : ''} ?`,
    good,
    wrong: wrong.filter((w) => w !== good && !(c % 10 === 0 && w === `${e},${c / 10} €`)),
    explication: `Après la virgule, on écrit toujours 2 chiffres pour les centimes : ${e} € et ${c} c = ${good}.`,
    difficulty: c < 10 ? 0.7 : 0.5,
  });
};

const monnaieRanger: ItemGen = (level, rng, ctx) => {
  const nb = level === 'facile' ? 3 : 4;
  const vals = distinctInts(rng, nb, level === 'facile' ? 1 : 5, level === 'facile' ? 20 : 999).map((v) =>
    level === 'facile' ? v * 100 : v,
  );
  const ecrire = (c: number) => {
    if (level === 'facile') return euros(c);
    const r = rng.int(0, 2);
    if (r === 0 || c < 100) return euros(c);
    if (r === 1) return `${c} c`;
    return `${Math.floor(c / 100)} € ${c % 100 ? `${c % 100} c` : ''}`.trim();
  };
  const sorted = [...vals].sort((a, b) => a - b);
  const elements = sorted.map(ecrire);
  return make(ctx, 'ordering', `ranger-${elements.join('|')}`, {
    prompt: 'Range ces prix du moins cher au plus cher.',
    elements,
    mode: 'croissant',
    explication: 'On écrit tous les prix de la même façon (100 c = 1 €), puis on compare.',
    difficulty: level === 'facile' ? 0.25 : 0.6,
  });
};

/* ------------------------------------------------------------------ */
/* CE1.MA.GM.TEMPS — temps courts                                      */
/* ------------------------------------------------------------------ */

const heure = (h: number, m: number) => (m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`);
const dureeTxt = (min: number) =>
  min < 60 ? `${min} min` : min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60)} h ${min % 60} min`;
const AIGUILLE: Record<number, string> = { 0: 'sur le 12', 15: 'sur le 3', 30: 'sur le 6', 45: 'sur le 9' };

function tirerHeure(level: Level, rng: Rng): [number, number, boolean] {
  const apresMidi = level !== 'facile' && rng.chance(0.4);
  // « L'après-midi » : de 13 h à 18 h (après, c'est le soir)
  const h = apresMidi ? rng.int(13, 18) : rng.int(1, 11);
  const m = parNiv(level, { facile: 0, normal: rng.pick([0, 15, 30, 45]), plus_loin: rng.int(0, 11) * 5 });
  return [h, m, apresMidi];
}

const tempsClock: ItemGen = (level, rng, ctx) => {
  const r = rng.next();
  const task =
    level === 'facile' ? (r < 0.5 ? 'lire' : 'regler') : r < 0.35 ? 'lire' : r < 0.7 ? 'regler' : 'duree';
  const [h, m, apm] = tirerHeure(level, rng);
  const expl =
    m === 0
      ? `La grande aiguille est sur le 12 et la petite sur le ${h % 12 || 12} : il est ${heure(h, m)}.`
      : `La petite aiguille indique les heures, la grande les minutes (${AIGUILLE[m] ?? `sur le ${m / 5}`} : ${m} min) : ${heure(h, m)}.`;
  if (task === 'lire')
    return make(ctx, 'clock', `lire-${h}-${m}`, {
      prompt: apm ? 'C’est l’après-midi. Quelle heure est-il ?' : 'Quelle heure est-il ?',
      task: 'lire',
      hours: h,
      minutes: m,
      answerText: heure(h, m),
      explication: apm ? `${expl} L’après-midi, on ajoute 12 : ${h - 12} h de l’après-midi = ${h} h.` : expl,
      difficulty: clamp01(0.15 + (m ? 0.25 : 0) + (apm ? 0.2 : 0) + (m % 15 ? 0.2 : 0)),
    });
  if (task === 'regler')
    return make(ctx, 'clock', `regler-${h}-${m}`, {
      prompt: `Règle l’horloge sur ${heure(h, m)}.`,
      task: 'regler',
      hours: h,
      minutes: m,
      answerText: heure(h, m),
      explication: expl,
      difficulty: clamp01(0.2 + (m ? 0.25 : 0) + (m % 15 ? 0.2 : 0)),
    });
  // Durée : heure de départ + durée → heure de fin, dans la même journée
  const duree =
    level === 'plus_loin' ? rng.pick([25, 40, 50, 70, 80, 95, 110]) : rng.pick([15, 30, 45, 60, 90, 120]);
  const hd = Math.min(h, 21);
  const fin = hd * 60 + m + duree;
  const [fh, fm] = [Math.floor(fin / 60), fin % 60];
  const activite = rng.pick([
    'Le film',
    'La séance de piscine',
    'Le match',
    'Le goûter d’anniversaire',
    'La balade',
  ]);
  return make(ctx, 'clock', `duree-${hd}-${m}-${duree}`, {
    prompt:
      `${activite} commence à ${heure(hd, m)} et dure ${dureeTxt(duree)}. À quelle heure finit-il ?`.replace(
        /finit-il/,
        /^La /.test(activite) ? 'finit-elle' : 'finit-il',
      ),
    task: 'duree',
    hours: hd,
    minutes: m,
    durationMinutes: duree,
    answerText: heure(fh, fm),
    explication: `${heure(hd, m)} + ${dureeTxt(duree)} = ${heure(fh, fm)} (1 h = 60 min).`,
    difficulty: clamp01(0.5 + (duree % 15 ? 0.25 : 0)),
  });
};

const tempsNumeric: ItemGen = (level, rng, ctx) => {
  type C = { p: string; a: number; u: string; e: string; d: number };
  const facile: (() => C)[] = [
    () => {
      const h = rng.int(1, 8);
      const k = rng.int(1, 3);
      return {
        p: `Il est ${h} h. Quelle heure sera-t-il dans ${k} heure${k > 1 ? 's' : ''} ?`,
        a: h + k,
        u: 'h',
        e: `${h} h + ${k} h = ${h + k} h.`,
        d: 0.2,
      };
    },
    () => {
      const h = rng.int(3, 11);
      const k = rng.int(1, 2);
      return {
        p: `Il est ${h} h. Quelle heure était-il il y a ${k} heure${k > 1 ? 's' : ''} ?`,
        a: h - k,
        u: 'h',
        e: `${h} h − ${k} h = ${h - k} h.`,
        d: 0.3,
      };
    },
  ];
  const normal: (() => C)[] = [
    () => ({ p: '1 heure = … minutes', a: 60, u: 'min', e: 'Une heure, c’est 60 minutes.', d: 0.25 }),
    () => ({
      p: 'Une demi-heure = … minutes',
      a: 30,
      u: 'min',
      e: 'Une demi-heure, c’est la moitié de 60 minutes : 30 minutes.',
      d: 0.3,
    }),
    () => ({
      p: 'Un quart d’heure = … minutes',
      a: 15,
      u: 'min',
      e: 'Un quart d’heure, c’est 15 minutes (4 quarts d’heure = 1 heure).',
      d: 0.35,
    }),
    () => ({
      p: 'Trois quarts d’heure = … minutes',
      a: 45,
      u: 'min',
      e: 'Trois quarts d’heure = 15 + 15 + 15 = 45 minutes.',
      d: 0.5,
    }),
    () => {
      // BO : durée entre 8 h 30 et 8 h 45 ; entre 15 h 45 et 16 h 15
      const h = rng.int(7, 17);
      const m = rng.pick([0, 15, 30, 45]);
      const d = rng.pick([15, 30, 45]);
      const fin = h * 60 + m + d;
      return {
        p: `Combien de minutes s’écoulent entre ${heure(h, m)} et ${heure(Math.floor(fin / 60), fin % 60)} ?`,
        a: d,
        u: 'min',
        e: `De ${heure(h, m)} à ${heure(Math.floor(fin / 60), fin % 60)}, on avance de ${d} minutes${d === 15 ? ' (un quart d’heure)' : d === 30 ? ' (une demi-heure)' : ' (trois quarts d’heure)'}.`,
        d: 0.55,
      };
    },
    () => {
      // BO : 8 heures s'écoulent entre midi et 20 h
      const fin = rng.int(13, 22);
      return {
        p: `Combien d’heures s’écoulent entre midi et ${fin} h ?`,
        a: fin - 12,
        u: 'h',
        e: `Midi, c’est 12 h : de 12 h à ${fin} h, il y a ${fin - 12} heure${fin - 12 > 1 ? 's' : ''}.`,
        d: 0.5,
      };
    },
    () => {
      // BO : un quart d'heure à tailler les rosiers et une demi-heure à bêcher
      return {
        p: 'Mamie taille ses rosiers pendant un quart d’heure puis bêche son potager pendant une demi-heure. Combien de minutes reste-t-elle au jardin ?',
        a: 45,
        u: 'min',
        e: '15 min + 30 min = 45 min, c’est trois quarts d’heure.',
        d: 0.6,
      };
    },
  ];
  const loin: (() => C)[] = [
    () => {
      const h = rng.int(2, 3);
      return {
        p: `${h} heures = … minutes`,
        a: h * 60,
        u: 'min',
        e: `1 h = 60 min, donc ${h} h = ${h} × 60 = ${h * 60} min.`,
        d: 0.65,
      };
    },
    () => {
      const m = rng.int(1, 5) * 5;
      return {
        p: `1 h ${m} min = … min`,
        a: 60 + m,
        u: 'min',
        e: `1 h = 60 min, et 60 + ${m} = ${60 + m} min.`,
        d: 0.6,
      };
    },
    () => {
      const h = rng.int(8, 16);
      const m = rng.int(0, 11) * 5;
      const d = rng.int(4, 11) * 5;
      const fin = h * 60 + m + d;
      return {
        p: `Combien de minutes s’écoulent entre ${heure(h, m)} et ${heure(Math.floor(fin / 60), fin % 60)} ?`,
        a: d,
        u: 'min',
        e: `On compte de 5 en 5 sur l’horloge : il s’écoule ${d} minutes.`,
        d: 0.8,
      };
    },
  ];
  const liste = parNiv(level, { facile, normal, plus_loin: [...normal.slice(4), ...loin] });
  const c = rng.pick(liste)();
  return numeric(ctx, `temps-${c.p}`, {
    prompt: c.p,
    spoken: dire(c.p),
    answer: c.a,
    unit: c.u,
    explication: c.e,
    difficulty: c.d,
  });
};

const tempsQcm: ItemGen = (level, rng, ctx) => {
  const forme = level === 'facile' ? 0 : rng.int(0, 1);
  if (forme === 0) {
    const h = rng.int(1, 11);
    const apm = level !== 'facile' && rng.chance(0.6);
    const good = apm ? `${h + 12} h` : `${h} h`;
    const moment = apm ? 'de l’après-midi' : 'du matin';
    return mcq(ctx, rng, `moment-${h}-${apm}`, {
      question: `${h} heure${h > 1 ? 's' : ''} ${moment}, c’est…`,
      good,
      wrong: apm
        ? [`${h} h`, `${h + 10} h`, `${(h + 13) % 24} h`]
        : [`${h + 12} h`, `${h + 1} h`, `${h + 10} h`],
      explication: apm
        ? `L’après-midi, on ajoute 12 heures : ${h} + 12 = ${h + 12}, donc ${h + 12} h.`
        : `Le matin, l’heure ne change pas : ${h} h.`,
      difficulty: apm ? 0.5 : 0.2,
    });
  }
  // Comparer des durées (BO : 2 heures et 130 minutes)
  const cas: [string, number, string, number][] = [
    ['2 h', 120, '130 min', 130],
    ['1 h', 60, '50 min', 50],
    ['une demi-heure', 30, '20 min', 20],
    ['un quart d’heure', 15, '20 min', 20],
    ['3 quarts d’heure', 45, '1 h', 60],
    ['1 h 30 min', 90, '100 min', 100],
    ['2 demi-heures', 60, '1 h', 60],
  ];
  const casLoin: [string, number, string, number][] = [
    ['1 h 15 min', 75, '80 min', 80],
    ['100 min', 100, '1 h 30 min', 90],
    ['3 h', 180, '170 min', 170],
    ['1 h 45 min', 105, '110 min', 110],
    ['4 quarts d’heure', 60, '65 min', 65],
  ];
  const [a, va, b, vb] = rng.pick(level === 'plus_loin' ? casLoin : cas);
  const good = va === vb ? 'C’est pareil' : va > vb ? a : b;
  return mcq(ctx, rng, `duree-${a}-${b}`, {
    question: `Qu’est-ce qui dure le plus longtemps : ${a} ou ${b} ?`,
    good,
    wrong: [a, b, 'C’est pareil'].filter((x) => x !== good),
    fixedOrder: [a, b, 'C’est pareil'],
    explication: `En minutes : ${[
      [a, va],
      [b, vb],
    ]
      .map(([t, v]) => (t === `${v} min` ? t : `${t} = ${v} min`))
      .join(' et ')} (1 h = 60 min).`,
    difficulty: 0.6,
  });
};

const tempsRanger: ItemGen = (level, rng, ctx) => {
  if (level === 'facile' || rng.chance(0.5)) {
    // Moments d'une même journée, du plus tôt au plus tard
    const nb = level === 'facile' ? 3 : 4;
    const mins = distinctInts(rng, nb, 7 * 4, 21 * 4).map((q) => q * 15);
    const sorted = [...mins]
      .sort((a, b) => a - b)
      .map((x) => (level === 'facile' ? Math.round(x / 60) * 60 : x));
    const uniq = [...new Set(sorted)];
    if (uniq.length < 2) uniq.push(uniq[0]! + 60);
    return make(ctx, 'ordering', `heures-${uniq.join('-')}`, {
      prompt: 'Range ces heures de la journée, de la plus tôt à la plus tard.',
      elements: uniq.map((x) => heure(Math.floor(x / 60), x % 60)),
      mode: 'croissant',
      explication: 'On compare d’abord les heures, puis les minutes ; 14 h, c’est 2 h de l’après-midi.',
      difficulty: 0.35,
    });
  }
  const pool: [string, number][] = [
    ['un quart d’heure', 15],
    ['une demi-heure', 30],
    ['45 min', 45],
    ['1 h', 60],
    ['70 min', 70],
    ['1 h 30 min', 90],
    ['2 h', 120],
    ['130 min', 130],
  ];
  const choix = rng
    .shuffle(pool)
    .slice(0, 4)
    .sort((a, b) => a[1] - b[1]);
  return make(ctx, 'ordering', `durees-${choix.map((c) => c[0]).join('|')}`, {
    prompt: 'Range ces durées de la plus courte à la plus longue.',
    elements: choix.map((c) => c[0]),
    mode: 'croissant',
    explication:
      'On écrit toutes les durées en minutes : 1 h = 60 min, une demi-heure = 30 min, un quart d’heure = 15 min.',
    difficulty: 0.65,
  });
};

export const GRANDEURS: Record<string, LessonContent> = {
  'CE1.MA.GM.LONGUEURS': { gens: { numeric_answer: longConvertir, mcq: longQcm, ordering: longRanger } },
  'CE1.MA.GM.MASSES': { gens: { numeric_answer: massesBalance, mcq: massesQcm, ordering: massesRanger } },
  'CE1.MA.GM.MONNAIE': {
    gens: { money: monnaieMoney, numeric_answer: monnaieNumeric, mcq: monnaieQcm, ordering: monnaieRanger },
  },
  'CE1.MA.GM.TEMPS': {
    gens: { clock: tempsClock, numeric_answer: tempsNumeric, mcq: tempsQcm, ordering: tempsRanger },
  },
};
