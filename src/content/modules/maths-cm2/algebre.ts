/**
 * CM2 — Algèbre (BO n°16 du 17/04/2025, cycle 3, « Algèbre » et « Initiation à la pensée informatique ») :
 * égalités à trous (« 178 − … = 6 × 8 » : le signe = relie deux expressions égales), problèmes algébriques
 * (« 2 classeurs et 3 stylos coûtent 20 € »), programmes de calcul (jusqu'à trois instructions : exécuter,
 * remonter), suites de nombres et suites de motifs évolutives (« 7 ; 15 ; 31 ; 63 ; 127 », étape n).
 *
 * Conventions `meta` :
 * - `programme = { etapes: ['+ 2', '× 4', '− 3'], entree, sortie }` (null = inconnue à trouver) ;
 * - `suite = { termes, etape }` : termes affichés et rang (à partir de 1) du terme demandé ;
 *   `regle = { premier, m, k }` : u1 = premier, u(n+1) = m × u(n) + k ;
 *   `motif = { description, premier, ajout }` pour une suite de motifs évolutive ;
 * - `egalites = { equations, valeurs, inconnue }` : égalités (« … » ou symboles ■ ▲ ●), valeurs des
 *   inconnues et symbole demandé.
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, de, dire, fmt, make, mcq, nbDecimales, numeric, PERSOS, r3, vraiFaux } from './util';

type Op = '+' | '−' | '×' | '÷';
const appliquer = (a: number, op: Op, b: number) =>
  r3(op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);
const inverse: Record<Op, Op> = { '+': '−', '−': '+', '×': '÷', '÷': '×' };

/* ================================================================== */
/* CM2.MA.ALG.TROUS                                                    */
/* ================================================================== */

interface Trou {
  /** Égalités, avec « … » ou des symboles pour les inconnues. */
  equations: string[];
  valeurs: Record<string, number>;
  inconnue: string;
  prompt: string;
  spoken: string;
  expl: string;
  /** Erreurs plausibles. */
  pieges: number[];
  difficulty: number;
}

function trou(level: Level, rng: Rng): Trou {
  const i = (a: number, b: number) => rng.int(a, b);
  const simple = (eq: string, x: number, expl: string, pieges: number[], d: number): Trou => ({
    equations: [eq],
    valeurs: { '…': x },
    inconnue: '…',
    prompt: eq,
    spoken: `${dire(eq)} ?`,
    expl,
    pieges,
    difficulty: d,
  });
  if (level === 'facile') {
    const t = rng.int(0, 5);
    if (t === 0) {
      const x = i(10, 90);
      const b = i(5, 60);
      return simple(
        `… + ${b} = ${x + b}`,
        x,
        `On cherche ce qu’il faut ajouter à ${b} pour obtenir ${x + b} : ${x + b} − ${b} = ${x}.`,
        [x + 2 * b, x + 10, x - 1],
        0.2,
      );
    }
    if (t === 1) {
      const x = i(10, 60);
      const c = i(5, 60);
      return simple(
        `${x + c} − … = ${c}`,
        x,
        `On enlève ${x} à ${x + c} pour obtenir ${c}, car ${x + c} − ${c} = ${x}.`,
        [x + 2 * c, x + 10, x + 1],
        0.3,
      );
    }
    if (t === 2) {
      const x = i(2, 10);
      const b = i(2, 9);
      return simple(
        `… × ${b} = ${x * b}`,
        x,
        `On cherche dans la table de ${b} : ${x} × ${b} = ${x * b}.`,
        [x * b - b, x + 1, x - 1],
        0.25,
      );
    }
    if (t === 3) {
      const x = i(2, 10);
      const a = i(2, 9);
      return simple(
        `${a} × … = ${a * x}`,
        x,
        `${a} × ${x} = ${a * x}, donc le nombre manquant est ${x}.`,
        [a * x - a, x + 1, x + 2],
        0.25,
      );
    }
    if (t === 4) {
      const c = i(10, 60);
      const b = i(5, 40);
      return simple(
        `… − ${b} = ${c}`,
        b + c,
        `Si on enlève ${b} et qu’il reste ${c}, au départ il y avait ${c} + ${b} = ${b + c}.`,
        [c - b, b + c + 10, b + c - 1].filter((x) => x > 0),
        0.35,
      );
    }
    const b = i(2, 9);
    const c = i(2, 10);
    return simple(
      `… ÷ ${b} = ${c}`,
      b * c,
      `Le nombre cherché contient ${c} fois ${b} : ${c} × ${b} = ${b * c}.`,
      [b + c, b * c + b, c],
      0.4,
    );
  }
  if (level === 'normal') {
    const t = rng.int(0, 5);
    if (t === 0) {
      // BO : 178 − … = 6 × 8
      const b = i(3, 9);
      const c = i(3, 9);
      const x = i(10, 150);
      const a = b * c + x;
      return simple(
        `${a} − … = ${b} × ${c}`,
        x,
        `On calcule d’abord ${b} × ${c} = ${b * c}. Il faut ${a} − … = ${b * c}, donc le nombre manquant est ${a} − ${b * c} = ${x}.`,
        [b * c, a + b * c, x + 10],
        0.5,
      );
    }
    if (t === 1) {
      const b = i(3, 9);
      const c = i(4, 12);
      const a = i(2, b * c - 2);
      const x = b * c - a;
      return simple(
        `… + ${a} = ${b} × ${c}`,
        x,
        `${b} × ${c} = ${b * c}. On cherche ce qu’il faut ajouter à ${a} pour obtenir ${b * c} : ${b * c} − ${a} = ${x}.`,
        [b * c, b * c + a, x + 1],
        0.5,
      );
    }
    if (t === 2) {
      const a = i(3, 9);
      const x = i(3, 12);
      const s = a * x;
      const b = i(1, s - 1);
      return simple(
        `${a} × … = ${b} + ${s - b}`,
        x,
        `${b} + ${s - b} = ${s}. On cherche dans la table de ${a} : ${a} × ${x} = ${s}.`,
        [s, s - a, x + 1],
        0.5,
      );
    }
    if (t === 3) {
      const a = i(3, 9);
      const x = i(3, 12);
      const s = a * x;
      const c = i(2, 40);
      return simple(
        `… × ${a} = ${s + c} − ${c}`,
        x,
        `${s + c} − ${c} = ${s}, et ${x} × ${a} = ${s} : le nombre manquant est ${x}.`,
        [s, s + c, x - 1],
        0.55,
      );
    }
    if (t === 4) {
      const a = i(10, 60);
      const b = i(10, 60);
      const c = i(5, a + b - 5);
      const x = a + b - c;
      return simple(
        `${c} + … = ${a} + ${b}`,
        x,
        `${a} + ${b} = ${a + b}. On cherche ce qu’il faut ajouter à ${c} pour obtenir ${a + b} : ${a + b} − ${c} = ${x}.`,
        [a + b, a + b + c, x + 10],
        0.45,
      );
    }
    const b = i(3, 9);
    const c = i(3, 9);
    const a = i(5, 50);
    return simple(
      `… − ${a} = ${b} × ${c}`,
      b * c + a,
      `${b} × ${c} = ${b * c}. Si on enlève ${a} et qu’il reste ${b * c}, au départ il y avait ${b * c} + ${a} = ${b * c + a}.`,
      [b * c, b * c - a, b * c + a + 1].filter((x) => x > 0),
      0.55,
    );
  }
  const t = rng.int(0, 2);
  if (t === 0) {
    const x = i(3, 30);
    const a = i(2, 20);
    const eq = `■ + ■ + ${a} = ${2 * x + a}`;
    return {
      equations: [eq],
      valeurs: { '■': x },
      inconnue: '■',
      prompt: `${eq}. Combien vaut ■ ?`,
      spoken: `Carré plus carré plus ${a} égale ${2 * x + a}. Combien vaut le carré ?`,
      expl: `Deux carrés valent ${2 * x + a} − ${a} = ${2 * x}, donc un carré vaut ${2 * x} ÷ 2 = ${x}.`,
      pieges: [2 * x, 2 * x + a, x + a],
      difficulty: 0.6,
    };
  }
  if (t === 1) {
    const x = i(2, 20);
    const k = i(3, 5);
    const a = i(2, 20);
    const eq = `${k} × ■ + ${a} = ${k * x + a}`;
    return {
      equations: [eq],
      valeurs: { '■': x },
      inconnue: '■',
      prompt: `${eq}. Combien vaut ■ ?`,
      spoken: `${k} fois carré plus ${a} égale ${k * x + a}. Combien vaut le carré ?`,
      expl: `${k} carrés valent ${k * x + a} − ${a} = ${k * x}, donc un carré vaut ${k * x} ÷ ${k} = ${x}.`,
      pieges: [k * x, k * x + a, x + 1],
      difficulty: 0.65,
    };
  }
  // Deux inconnues : ▲ + ● = s et ▲ − ● = d
  const y = i(2, 30);
  const x = y + i(1, 30);
  const eq1 = `▲ + ● = ${x + y}`;
  const eq2 = `▲ − ● = ${x - y}`;
  return {
    equations: [eq1, eq2],
    valeurs: { '▲': x, '●': y },
    inconnue: '▲',
    prompt: `${eq1} et ${eq2}. Combien vaut ▲ ?`,
    spoken: `Triangle plus rond égale ${x + y}, et triangle moins rond égale ${x - y}. Combien vaut le triangle ?`,
    expl: `Le triangle a ${x - y} de plus que le rond. Sans cet écart, il reste ${x + y} − ${x - y} = ${2 * y} pour deux ronds, donc le rond vaut ${y} et le triangle vaut ${y} + ${x - y} = ${x}.`,
    pieges: [y, x + y, x - y],
    difficulty: 0.8,
  };
}

const metaTrou = (t: Trou) => ({
  egalites: { equations: t.equations, valeurs: t.valeurs, inconnue: t.inconnue },
});

const trousNumeric: ItemGen = (level, rng, ctx) => {
  const t = trou(level, rng);
  return numeric(ctx, `trou-${t.prompt}`, {
    prompt: t.prompt,
    spoken: t.spoken,
    answer: t.valeurs[t.inconnue]!,
    explication: t.expl,
    difficulty: t.difficulty,
    meta: metaTrou(t),
  });
};

const trousQcm: ItemGen = (level, rng, ctx) => {
  const t = trou(level, rng);
  const x = t.valeurs[t.inconnue]!;
  const autres = [x + 1, x + 10, x - 1, x * 2].filter((v) => v > 0);
  return mcq(ctx, rng, `trou-${t.prompt}`, {
    question: t.inconnue === '…' ? `Quel nombre manque ? ${t.prompt}` : t.prompt,
    spoken: t.inconnue === '…' ? `Quel nombre manque ? ${t.spoken}` : t.spoken,
    good: fmt(x),
    wrong: [...new Set([...t.pieges, ...autres])]
      .filter((v) => v !== x && v > 0)
      .slice(0, 5)
      .map((v) => fmt(v)),
    explication: t.expl,
    difficulty: t.difficulty,
    meta: metaTrou(t),
    max: level === 'facile' ? 3 : 4,
  });
};

/** Le signe = entre deux expressions : vrai ou faux ? */
const trousVraiFaux: ItemGen = (level, rng, ctx) => {
  const i = (a: number, b: number) => rng.int(a, b);
  const juste = rng.chance(0.5);
  if (level === 'plus_loin') {
    const x = i(2, 15);
    const k = i(2, 5);
    const a = i(2, 20);
    const v = k * x + a;
    const montre = juste ? v : v + rng.pick([k, x, 1, -1]);
    return vraiFaux(ctx, `si-${x}-${k}-${a}-${montre}`, {
      statement: `Si ■ = ${x}, alors ${k} × ■ + ${a} = ${montre}.`,
      spoken: `Si le carré vaut ${x}, alors ${k} fois carré plus ${a} égale ${montre}. Vrai ou faux ?`,
      answer: juste,
      explication: `On remplace ■ par ${x} : ${k} × ${x} + ${a} = ${k * x} + ${a} = ${v}.`,
      difficulty: 0.6,
    });
  }
  const a = i(10, 60);
  const b = i(10, 60);
  const s = a + b;
  if (level === 'facile') {
    const montre = juste ? s : s + rng.pick([1, -1, 10, -10]);
    const inverseSens = rng.chance(0.5);
    const statement = inverseSens ? `${montre} = ${a} + ${b}` : `${a} + ${b} = ${montre}`;
    return vraiFaux(ctx, `eg-${statement}`, {
      statement,
      spoken: `${dire(statement)}. Vrai ou faux ?`,
      answer: juste,
      explication: `${a} + ${b} = ${s}. Le signe = veut dire « a la même valeur que », on peut l’écrire dans les deux sens.`,
      difficulty: inverseSens ? 0.35 : 0.2,
    });
  }
  // Normal : deux expressions de part et d'autre du signe =
  const forme = rng.int(0, 2);
  let statement: string;
  let droite: number;
  if (forme === 0) {
    // 25 + 17 = 40 + 2 ; erreur : 25 + 17 = 42 + 3 (le = vu comme « ça donne »)
    const c = juste ? i(1, s - 1) : i(1, 9);
    statement = juste ? `${a} + ${b} = ${s - c} + ${c}` : `${a} + ${b} = ${s} + ${c}`;
    droite = juste ? s : s + c;
  } else if (forme === 1) {
    const k = i(3, 9);
    const m = i(3, 9);
    const p = k * m;
    const d = juste ? p : p + rng.pick([1, -1, k]);
    const e = i(2, 40);
    statement = `${k} × ${m} = ${d + e} − ${e}`;
    droite = d;
    return vraiFaux(ctx, `eg-${statement}`, {
      statement,
      spoken: `${dire(statement)}. Vrai ou faux ?`,
      answer: d === p,
      explication: `${k} × ${m} = ${p} et ${d + e} − ${e} = ${d} : ${d === p ? 'les deux côtés ont la même valeur, l’égalité est vraie' : 'les deux côtés n’ont pas la même valeur, l’égalité est fausse'}.`,
      difficulty: 0.5,
    });
  } else {
    const c = i(1, 9);
    statement = juste ? `${a} + ${b} = ${a + c} + ${b - c}` : `${a} + ${b} = ${a + c} + ${b + c}`;
    droite = juste ? s : s + 2 * c;
  }
  return vraiFaux(ctx, `eg-${statement}`, {
    statement,
    spoken: `${dire(statement)}. Vrai ou faux ?`,
    answer: droite === s,
    explication: `À gauche, ${a} + ${b} = ${s} ; à droite, on trouve ${droite}. Le signe = veut dire que les deux côtés ont la même valeur : ${droite === s ? 'c’est vrai' : 'ici, c’est faux'}.`,
    difficulty: 0.5,
  });
};

/* Problèmes algébriques (schéma en barre) */

const ARTICLES: [string, string][] = [
  ['classeur', 'classeurs'],
  ['cahier', 'cahiers'],
  ['stylo', 'stylos'],
  ['feutre', 'feutres'],
  ['carnet', 'carnets'],
  ['compas', 'compas'],
];

const trousProbleme: ItemGen = (level, rng, ctx) => {
  const qui = rng.pick(PERSOS);
  const [[o1, o1s], [o2, o2s]] = rng.shuffle(ARTICLES) as [[string, string], [string, string]];
  if (level === 'facile') {
    const n = rng.int(2, 4);
    const p = rng.int(2, 9);
    const g = rng.int(1, 5);
    const total = n * p + g;
    return make(ctx, 'bar_model', `pb1-${n}-${p}-${g}-${o1}`, {
      statement: `${qui.nom} achète ${n} ${o1s} identiques et une gomme à ${g} €. ${qui.il === 'il' ? 'Il' : 'Elle'} paie ${total} € en tout.`,
      structure: 'deux-etapes',
      bars: [
        {
          label: 'prix payé',
          segments: [
            ...Array.from({ length: n }, () => ({ value: null, label: o1 })),
            { value: g, label: 'gomme' },
          ],
        },
      ],
      total,
      question: `Combien coûte un ${o1} ?`,
      answer: p,
      unit: '€',
      answerSentence: `Un ${o1} coûte ___ €.`,
      reformulations: [
        `${n} ${o1s} et une gomme coûtent ${total} € ; on cherche le prix d’un seul ${o1}.`,
        `On cherche le prix de la gomme.`,
        `On cherche combien ${qui.nom} a payé en tout.`,
      ],
      operation: `(${total} − ${g}) ÷ ${n} = ${p}`,
      explication: `On enlève la gomme : ${total} − ${g} = ${total - g} € pour les ${n} ${o1s}, puis on partage : ${total - g} ÷ ${n} = ${p} €.`,
      difficulty: 0.3,
    });
  }
  const n1 = rng.int(2, 4);
  const n2 = rng.int(2, 4);
  const p1 = rng.int(2, 9);
  const p2 = rng.int(1, 6);
  if (level === 'normal') {
    const total = n1 * p1 + n2 * p2;
    return make(ctx, 'bar_model', `pb2-${n1}-${p1}-${n2}-${p2}-${o1}-${o2}`, {
      statement: `${n1} ${o1s} et ${n2} ${o2s} coûtent ${total} €. Un ${o2} coûte ${p2} €.`,
      structure: 'deux-etapes',
      bars: [
        {
          label: 'prix total',
          segments: [
            ...Array.from({ length: n1 }, () => ({ value: null, label: o1 })),
            ...Array.from({ length: n2 }, () => ({ value: p2, label: o2 })),
          ],
        },
      ],
      total,
      question: `Combien coûte un ${o1} ?`,
      answer: p1,
      unit: '€',
      answerSentence: `Un ${o1} coûte ___ €.`,
      reformulations: [
        `On connait le prix total et le prix d’un ${o2} ; on cherche le prix d’un ${o1}.`,
        `On connait le prix d’un ${o1} ; on cherche le prix total.`,
        `On cherche combien de ${o2s} on peut acheter avec ${total} €.`,
      ],
      operation: `(${total} − ${n2 * p2}) ÷ ${n1} = ${p1}`,
      explication: `Les ${n2} ${o2s} coûtent ${n2} × ${p2} = ${n2 * p2} €. Il reste ${total} − ${n2 * p2} = ${total - n2 * p2} € pour les ${n1} ${o1s}, donc un ${o1} coûte ${total - n2 * p2} ÷ ${n1} = ${p1} €.`,
      difficulty: 0.55,
    });
  }
  // Plus loin : deux égalités, la différence donne le prix d'un objet (BO : 2 ciseaux + 3 stylos = 20 €)
  const t1 = 2 * p1 + n2 * p2;
  const t2 = p1 + n2 * p2;
  return make(ctx, 'bar_model', `pb3-${p1}-${n2}-${p2}-${o1}-${o2}`, {
    statement: `2 ${o1s} et ${n2} ${o2s} coûtent ${t1} €. 1 ${o1} et ${n2} ${o2s} coûtent ${t2} €.`,
    structure: 'deux-etapes',
    bars: [
      {
        label: `2 ${o1s} et ${n2} ${o2s}`,
        segments: [
          { value: null, label: o1 },
          { value: null, label: o1 },
          { value: null, label: `${n2} ${o2s}` },
        ],
      },
      {
        label: `1 ${o1} et ${n2} ${o2s}`,
        segments: [
          { value: null, label: o1 },
          { value: null, label: `${n2} ${o2s}` },
        ],
      },
    ],
    total: null,
    question: `Combien coûte un ${o1} ?`,
    answer: p1,
    unit: '€',
    answerSentence: `Un ${o1} coûte ___ €.`,
    reformulations: [
      `Les deux achats ont les mêmes ${o2s} ; la différence de prix vient d’un seul ${o1}.`,
      `Les deux achats coûtent le même prix.`,
      `On cherche le prix de tous les ${o2s} ensemble.`,
    ],
    operation: `${t1} − ${t2} = ${p1}`,
    explication: `Le premier achat a juste un ${o1} de plus que le second : un ${o1} coûte donc ${t1} − ${t2} = ${p1} €.`,
    difficulty: 0.75,
  });
};

/* ================================================================== */
/* CM2.MA.ALG.PROGRAMMES                                               */
/* ================================================================== */

type Etape = { op: Op; k: number };
const etapeCode = (e: Etape) => `${e.op} ${fmt(e.k)}`;
const etapeMots = (e: Etape) =>
  e.op === '+'
    ? `ajouter ${fmt(e.k)}`
    : e.op === '−'
      ? `retirer ${fmt(e.k)}`
      : e.op === '×'
        ? `multiplier par ${fmt(e.k)}`
        : `diviser par ${fmt(e.k)}`;

function executer(x: number, etapes: Etape[]): number[] {
  const out = [x];
  for (const e of etapes) out.push(appliquer(out[out.length - 1]!, e.op, e.k));
  return out;
}

const valeurOk = (v: number) =>
  v >= 0 && v <= 5000 && nbDecimales(v) <= 3 && Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6;

interface Programme {
  etapes: Etape[];
  entree: number;
  sortie: number;
}

function programme(level: Level, rng: Rng, n = level === 'facile' ? 2 : 3): Programme {
  for (let essai = 0; essai < 500; essai++) {
    const entree =
      level === 'plus_loin' && rng.chance(0.4)
        ? r3(rng.int(11, 99) / 10)
        : rng.int(1, level === 'facile' ? 15 : level === 'normal' ? 30 : 50);
    const etapes: Etape[] = [];
    let v = entree;
    let ok = true;
    for (let j = 0; j < n; j++) {
      // On alterne étapes additives (+, −) et multiplicatives (×, ÷), comme dans l’exemple du BO
      const prec = etapes[j - 1]?.op;
      const ops: Op[] =
        prec === undefined ? ['+', '−', '×', '÷'] : prec === '+' || prec === '−' ? ['×', '÷'] : ['+', '−'];
      const op = rng.pick(ops);
      const k =
        op === '×' || op === '÷'
          ? rng.int(2, level === 'facile' ? 5 : 9)
          : rng.int(1, level === 'facile' ? 10 : 20);
      const nv = appliquer(v, op, k);
      if (!valeurOk(nv) || (op === '÷' && !Number.isInteger(nv)) || nv === 0) {
        ok = false;
        break;
      }
      etapes.push({ op, k });
      v = nv;
    }
    if (ok) return { etapes, entree, sortie: v };
  }
  const secours: Etape[] = [
    { op: '+', k: 2 },
    { op: '×', k: 4 },
    { op: '−', k: 3 },
  ].slice(0, n) as Etape[];
  return { etapes: secours, entree: 5, sortie: executer(5, secours).at(-1)! };
}

const texteProg = (p: Programme) =>
  `choisir un nombre ; ${p.etapes.map(etapeMots).join(' ; ')} ; écrire le résultat`;

function explExec(p: Programme): string {
  const v = executer(p.entree, p.etapes);
  return `On applique les étapes dans l’ordre : ${p.etapes
    .map((e, j) => `${fmt(v[j]!)} ${e.op} ${fmt(e.k)} = ${fmt(v[j + 1]!)}`)
    .join(' ; ')}.`;
}

function explInverse(p: Programme): string {
  const v = executer(p.entree, p.etapes);
  const pas: string[] = [];
  for (let j = p.etapes.length - 1; j >= 0; j--) {
    const e = p.etapes[j]!;
    pas.push(`${fmt(v[j + 1]!)} ${inverse[e.op]} ${fmt(e.k)} = ${fmt(v[j]!)}`);
  }
  return `On remonte le programme en partant de la fin et en faisant l’opération contraire à chaque étape : ${pas.join(' ; ')}.`;
}

const metaProg = (p: Programme, inconnue: 'entree' | 'sortie') => ({
  programme: {
    etapes: p.etapes.map(etapeCode),
    entree: inconnue === 'entree' ? null : p.entree,
    sortie: inconnue === 'sortie' ? null : p.sortie,
  },
});

const difProg = (level: Level, inv: boolean) =>
  clamp01({ facile: 0.25, normal: 0.45, plus_loin: 0.65 }[level] + (inv ? 0.2 : 0));

const programmesNumeric: ItemGen = (level, rng, ctx) => {
  const p = programme(level, rng);
  const inv = level !== 'facile' && rng.chance(0.5);
  const sig = `${p.etapes.map(etapeCode).join('|')}`;
  if (inv)
    return numeric(ctx, `inv-${sig}-${p.sortie}`, {
      prompt: `Programme de calcul : ${texteProg(p)}. On obtient ${fmt(p.sortie)}. Quel nombre avait-on choisi ?`,
      answer: p.entree,
      explication: explInverse(p),
      difficulty: difProg(level, true),
      meta: metaProg(p, 'entree'),
    });
  return numeric(ctx, `exec-${sig}-${p.entree}`, {
    prompt: `Programme de calcul : ${texteProg(p)}. On choisit ${fmt(p.entree)}. Quel nombre obtient-on ?`,
    answer: p.sortie,
    explication: explExec(p),
    difficulty: difProg(level, false),
    meta: metaProg(p, 'sortie'),
  });
};

/** Résultats obtenus en se trompant d'ordre ou en oubliant une étape. */
function erreursProg(p: Programme): number[] {
  const out = [
    executer(p.entree, [...p.etapes].reverse()).at(-1)!,
    executer(p.entree, p.etapes.slice(0, -1)).at(-1)!,
    p.sortie + 1,
    p.sortie + 10,
  ];
  return [...new Set(out.filter((x) => valeurOk(x) && x !== p.sortie))];
}

const programmesQcm: ItemGen = (level, rng, ctx) => {
  if (level === 'plus_loin' && rng.chance(0.5)) {
    // Choisir le programme qui transforme un nombre en un autre (2 étapes)
    for (let g = 0; g < 50; g++) {
      const p = programme('normal', rng, 2);
      const vrai = p.etapes.map(etapeMots).join(', puis ');
      const variantes: Etape[][] = [
        [...p.etapes].reverse(),
        [p.etapes[0]!, { ...p.etapes[1]!, k: p.etapes[1]!.k + 1 }],
        [{ ...p.etapes[0]!, op: inverse[p.etapes[0]!.op] }, p.etapes[1]!],
      ];
      const faux = variantes
        .filter((v) => {
          const r = executer(p.entree, v).at(-1)!;
          return Number.isFinite(r) && r !== p.sortie;
        })
        .map((v) => v.map(etapeMots).join(', puis '))
        .filter((t) => t !== vrai);
      if (faux.length < 2) continue;
      return mcq(ctx, rng, `choisir-${p.entree}-${p.etapes.map(etapeCode).join('|')}`, {
        question: `Quel programme transforme ${fmt(p.entree)} en ${fmt(p.sortie)} ?`,
        good: vrai,
        wrong: faux,
        explication: explExec(p),
        difficulty: 0.7,
        meta: { programme: { etapes: p.etapes.map(etapeCode), entree: p.entree, sortie: p.sortie } },
      });
    }
  }
  const p = programme(level, rng);
  return mcq(ctx, rng, `exec-${p.entree}-${p.etapes.map(etapeCode).join('|')}`, {
    question: `Programme de calcul : ${texteProg(p)}. On choisit ${fmt(p.entree)}. Quel nombre obtient-on ?`,
    spoken: dire(
      `Programme de calcul : ${texteProg(p)}. On choisit ${fmt(p.entree)}. Quel nombre obtient-on ?`,
    ),
    good: fmt(p.sortie),
    wrong: erreursProg(p).map((x) => fmt(x)),
    explication: explExec(p),
    difficulty: difProg(level, false),
    meta: metaProg(p, 'sortie'),
    max: level === 'facile' ? 3 : 4,
  });
};

/** Toutes les permutations d'une liste. */
function permutations<T>(l: T[]): T[][] {
  if (l.length <= 1) return [l];
  return l.flatMap((x, i) => permutations([...l.slice(0, i), ...l.slice(i + 1)]).map((p) => [x, ...p]));
}

const programmesOrdre: ItemGen = (level, rng, ctx) => {
  for (let g = 0; g < 100; g++) {
    const p = programme(level, rng);
    const mots = p.etapes.map(etapeMots);
    if (new Set(mots).size !== mots.length) continue;
    const memeResultat = permutations(p.etapes).filter((perm) => {
      const v = executer(p.entree, perm);
      return v.every(valeurOk) && v.at(-1) === p.sortie;
    });
    if (memeResultat.length !== 1) continue;
    return make(ctx, 'ordering', `ordre-${p.entree}-${p.etapes.map(etapeCode).join('|')}`, {
      prompt: `Remets les étapes du programme dans l’ordre pour qu’en choisissant ${fmt(p.entree)} on obtienne ${fmt(p.sortie)}.`,
      spoken: dire(
        `Remets les étapes du programme dans l’ordre pour qu’en choisissant ${fmt(p.entree)} on obtienne ${fmt(p.sortie)}.`,
      ),
      elements: mots,
      mode: 'etapes',
      explication: explExec(p),
      difficulty: difProg(level, false) + 0.1,
      meta: metaProg(p, 'sortie'),
    });
  }
  return make(ctx, 'ordering', 'ordre-secours', {
    prompt: 'Remets les étapes du programme dans l’ordre pour qu’en choisissant 5 on obtienne 25.',
    elements: ['ajouter 2', 'multiplier par 4', 'retirer 3'],
    mode: 'etapes',
    explication: 'On applique les étapes dans l’ordre : 5 + 2 = 7 ; 7 × 4 = 28 ; 28 − 3 = 25.',
    difficulty: 0.5,
    meta: { programme: { etapes: ['+ 2', '× 4', '− 3'], entree: 5, sortie: 25 } },
  });
};

const programmesVraiFaux: ItemGen = (level, rng, ctx) => {
  const p = programme(level, rng);
  const juste = rng.chance(0.5);
  const errs = erreursProg(p);
  const montre = juste || !errs.length ? p.sortie : rng.pick(errs);
  return vraiFaux(ctx, `vf-${p.entree}-${p.etapes.map(etapeCode).join('|')}-${montre}`, {
    statement: `Avec le programme « ${texteProg(p)} », si on choisit ${fmt(p.entree)}, on obtient ${fmt(montre)}.`,
    spoken: dire(
      `Avec le programme : ${texteProg(p)}. Si on choisit ${fmt(p.entree)}, on obtient ${fmt(montre)}. Vrai ou faux ?`,
    ),
    answer: montre === p.sortie,
    explication: explExec(p),
    difficulty: difProg(level, false),
    meta: metaProg(p, 'sortie'),
  });
};

/* ================================================================== */
/* CM2.MA.ALG.SUITES                                                   */
/* ================================================================== */

/** u1 = premier ; u(n+1) = m × u(n) + k. */
type Regle = { premier: number; m: number; k: number };
type Motif = { description: string; premier: number; ajout: number; objets: string };

const terme = (r: Regle, n: number) => {
  let u = r.premier;
  for (let j = 1; j < n; j++) u = r3(r.m * u + r.k);
  return u;
};
const termes = (r: Regle, n: number) => Array.from({ length: n }, (_, j) => terme(r, j + 1));
const regleTexte = (r: Regle) =>
  r.m === 1
    ? r.k >= 0
      ? `+ ${fmt(r.k)}`
      : `− ${fmt(-r.k)}`
    : r.k === 0
      ? `× ${r.m}`
      : `× ${r.m} puis ${r.k > 0 ? '+' : '−'} ${fmt(Math.abs(r.k))}`;
const regleMots = (r: Regle) =>
  r.m === 1
    ? r.k >= 0
      ? `on ajoute ${fmt(r.k)}`
      : `on retire ${fmt(-r.k)}`
    : r.k === 0
      ? `on multiplie par ${r.m}`
      : `on multiplie par ${r.m} puis on ajoute ${fmt(r.k)}`;
const liste = (t: number[]) => t.map((x) => fmt(x)).join(' ; ');
const rang = (n: number) => (n === 1 ? '1er' : `${n}e`);

const MOTIFS: Motif[] = [
  {
    description:
      'Avec des allumettes, on fait une rangée de carrés collés : 1 carré à l’étape 1, et un carré de plus à chaque étape.',
    premier: 4,
    ajout: 3,
    objets: 'allumettes',
  },
  {
    description:
      'Avec des allumettes, on fait une rangée de triangles collés : 1 triangle à l’étape 1, et un triangle de plus à chaque étape.',
    premier: 3,
    ajout: 2,
    objets: 'allumettes',
  },
  {
    description:
      'À la cantine, on colle des tables carrées en ligne : 1 table à l’étape 1 (4 places), et une table de plus à chaque étape.',
    premier: 4,
    ajout: 2,
    objets: 'places',
  },
  {
    description:
      'On construit une croix de jetons : 5 jetons à l’étape 1, puis on ajoute 1 jeton au bout de chacune des 4 branches à chaque étape.',
    premier: 5,
    ajout: 4,
    objets: 'jetons',
  },
  {
    description:
      'On construit un L avec des cubes : 3 cubes à l’étape 1, puis on ajoute 1 cube en haut et 1 cube à droite à chaque étape.',
    premier: 3,
    ajout: 2,
    objets: 'cubes',
  },
];

function regleSuite(level: Level, rng: Rng): Regle {
  const i = (a: number, b: number) => rng.int(a, b);
  if (level === 'facile') {
    if (rng.chance(0.25)) {
      const k = i(2, 10);
      return { premier: k * i(5, 10) + i(0, k - 1), m: 1, k: -k };
    }
    return { premier: i(0, 30), m: 1, k: i(2, 10) };
  }
  if (level === 'normal') {
    const f = rng.int(0, 4);
    if (f === 0) return { premier: i(1, 50), m: 1, k: i(11, 25) };
    if (f === 1) return { premier: r3(i(1, 20) / 2), m: 1, k: rng.pick([0.5, 0.25, 1.5, 2.5]) };
    if (f === 2) return { premier: i(1, 5), m: rng.pick([2, 3]), k: 0 };
    if (f === 3) return { premier: i(2, 7), m: 2, k: 1 };
    const k = i(3, 12);
    return { premier: k * i(8, 15), m: 1, k: -k };
  }
  const f = rng.int(0, 2);
  if (f === 0) return { premier: i(2, 9), m: 2, k: rng.pick([1, 2, 3]) };
  if (f === 1) return { premier: r3(i(1, 40) / 10), m: 1, k: rng.pick([0.2, 0.25, 0.75, 1.25]) };
  return { premier: i(1, 3), m: 3, k: rng.pick([0, 1]) };
}

const nbAffiches = (level: Level) => (level === 'facile' ? 4 : 5);

function explSuite(r: Regle): string {
  const t = termes(r, 3);
  return `Pour passer d’un nombre au suivant, ${regleMots(r)} : ${fmt(t[0]!)} donne ${fmt(t[1]!)}, puis ${fmt(t[2]!)}, et ainsi de suite.`;
}

const metaSuite = (r: Regle, t: number[], etape: number, motif?: Motif) => ({
  suite: { termes: t, etape },
  regle: r,
  ...(motif ? { motif: { description: motif.description, premier: motif.premier, ajout: motif.ajout } } : {}),
});

const suitesNumeric: ItemGen = (level, rng, ctx) => {
  const f = rng.next();
  if (f < 0.4) {
    // Suite de motifs : étape 5 (facile), 10 (normal), 100 (plus loin)
    const mo = rng.pick(MOTIFS);
    const r: Regle = { premier: mo.premier, m: 1, k: mo.ajout };
    const n =
      level === 'facile'
        ? rng.int(4, 6)
        : level === 'normal'
          ? rng.pick([10, 12, 15, 20])
          : rng.pick([50, 100]);
    const v = terme(r, n);
    return numeric(ctx, `motif-${mo.premier}-${mo.ajout}-${mo.objets}-${n}`, {
      prompt: `${mo.description} Étape 1 : ${mo.premier} ${mo.objets} ; étape 2 : ${mo.premier + mo.ajout} ${mo.objets} ; étape 3 : ${mo.premier + 2 * mo.ajout} ${mo.objets}. Combien y a-t-il ${de(mo.objets)} à l’étape ${n} ?`,
      answer: v,
      explication: `Il y a ${mo.premier} ${mo.objets} à l’étape 1, puis ${mo.ajout} de plus à chaque étape. De l’étape 1 à l’étape ${n}, on ajoute ${n - 1} fois ${mo.ajout} : ${mo.premier} + ${n - 1} × ${mo.ajout} = ${fmt(v)}.`,
      difficulty: { facile: 0.35, normal: 0.6, plus_loin: 0.8 }[level],
      meta: metaSuite(r, termes(r, 3), n, mo),
    });
  }
  const r = regleSuite(level, rng);
  const k = nbAffiches(level);
  const t = termes(r, k);
  if (level !== 'facile' && r.m === 1 && f < 0.7) {
    const n = level === 'normal' ? 10 : 100;
    const v = terme(r, n);
    if (v >= 0)
      return numeric(ctx, `rang-${liste(t)}-${n}`, {
        prompt: `Voici le début d’une suite : ${liste(t)} ; … Quel est le ${rang(n)} nombre de cette suite ?`,
        answer: v,
        explication: `${cap1(regleMots(r))} à chaque fois. Du 1er au ${rang(n)} nombre, on le fait ${n - 1} fois : ${fmt(r.premier)} ${r.k >= 0 ? '+' : '−'} ${n - 1} × ${fmt(Math.abs(r.k))} = ${fmt(v)}.`,
        difficulty: level === 'normal' ? 0.6 : 0.8,
        meta: metaSuite(r, t, n),
      });
  }
  const v = terme(r, k + 1);
  return numeric(ctx, `suivant-${liste(t)}`, {
    prompt: `Continue la suite : ${liste(t)} ; …`,
    spoken: `Continue la suite : ${dire(liste(t))}. Quel est le nombre suivant ?`,
    answer: v,
    explication: explSuite(r),
    difficulty: { facile: 0.2, normal: 0.45, plus_loin: 0.6 }[level] + (r.m > 1 ? 0.1 : 0),
    meta: metaSuite(r, t, k + 1),
  });
};

const cap1 = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** Règles proches mais fausses pour ces termes. */
function reglesFausses(r: Regle): Regle[] {
  const t = termes(r, 2);
  const ecart = r3(t[1]! - t[0]!);
  const cands: Regle[] = [
    { premier: r.premier, m: 1, k: ecart },
    { premier: r.premier, m: 1, k: r3(r.k + (r.k >= 0 ? 1 : -1)) },
    { premier: r.premier, m: 2, k: 0 },
    { premier: r.premier, m: 1, k: r3(2 * r.k || 2) },
    { premier: r.premier, m: r.m + 1, k: Math.max(0, r.k) },
    { premier: r.premier, m: 3, k: 0 },
  ];
  const ref = termes(r, 4).join('|');
  return cands.filter((c) => termes(c, 4).join('|') !== ref && regleTexte(c) !== regleTexte(r));
}

const suitesQcm: ItemGen = (level, rng, ctx) => {
  const r = regleSuite(level, rng);
  const t = termes(r, nbAffiches(level));
  const faux = [...new Set(reglesFausses(r).map(regleTexte))];
  return mcq(ctx, rng, `regle-${liste(t)}`, {
    question: `Quelle règle permet de passer d’un nombre au suivant ? ${liste(t)} ; …`,
    spoken: `Quelle règle permet de passer d’un nombre au suivant ? ${dire(liste(t))}.`,
    good: regleTexte(r),
    wrong: faux,
    explication: explSuite(r),
    difficulty: { facile: 0.25, normal: 0.5, plus_loin: 0.7 }[level],
    meta: metaSuite(r, t, 2),
    max: level === 'facile' ? 3 : 4,
  });
};

const suitesTrou: ItemGen = (level, rng, ctx) => {
  const r = regleSuite(level, rng);
  const n = nbAffiches(level);
  const t = termes(r, n);
  const pos = rng.int(1, n - 2);
  const phrase = t.map((x, j) => (j === pos ? '___' : fmt(x))).join(' ; ');
  return make(ctx, 'fill_blank', `trou-${phrase}`, {
    sentence: `Complète la suite : ${phrase}`,
    spoken: `Complète la suite : ${dire(t.map((x, j) => (j === pos ? 'combien' : fmt(x))).join(' ; '))}.`,
    answer: fmt(t[pos]!),
    accepted: [String(t[pos]!)],
    explication: explSuite(r),
    difficulty: { facile: 0.2, normal: 0.45, plus_loin: 0.65 }[level],
    meta: metaSuite(r, t, pos + 1),
  });
};

const suitesVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  for (let g = 0; g < 50; g++) {
    const r = regleSuite(level, rng);
    const n = nbAffiches(level);
    const t = termes(r, n);
    const p = rng.int(n + 2, n + 5);
    const vrai = terme(r, p);
    const ecart = Math.abs(r3(t[1]! - t[0]!));
    const faux = r3(vrai + (ecart > 1 ? 1 : ecart / 2));
    // Le nombre faux ne doit être aucun terme de la suite
    const tous = termes(r, p + 10);
    if (tous.includes(faux) || vrai < 0 || tous.some((x) => x < 0)) continue;
    const montre = juste ? vrai : faux;
    return vraiFaux(ctx, `vf-${liste(t)}-${p}-${montre}`, {
      statement: `Dans la suite ${liste(t)} ; …, le ${rang(p)} nombre est ${fmt(montre)}.`,
      spoken: `Dans la suite ${dire(liste(t))}, et ainsi de suite, le ${rang(p)} nombre est ${dire(fmt(montre))}. Vrai ou faux ?`,
      answer: juste,
      explication: `${explSuite(r)} Le ${rang(p)} nombre est ${fmt(vrai)}.`,
      difficulty: { facile: 0.3, normal: 0.5, plus_loin: 0.7 }[level],
      meta: metaSuite(r, t, p),
    });
  }
  const r: Regle = { premier: 4, m: 1, k: 3 };
  return vraiFaux(ctx, `vf-secours-${juste}`, {
    statement: `Dans la suite 4 ; 7 ; 10 ; 13 ; …, le 6e nombre est ${juste ? 19 : 20}.`,
    answer: juste,
    explication: `${explSuite(r)} Le 6e nombre est 19.`,
    difficulty: 0.3,
    meta: metaSuite(r, termes(r, 4), 6),
  });
};

/* ================================================================== */

export const ALGEBRE: Record<string, LessonContent> = {
  'CM2.MA.ALG.TROUS': {
    gens: {
      numeric_answer: trousNumeric,
      mcq: trousQcm,
      true_false: trousVraiFaux,
      bar_model: trousProbleme,
    },
  },
  'CM2.MA.ALG.PROGRAMMES': {
    gens: {
      numeric_answer: programmesNumeric,
      mcq: programmesQcm,
      ordering: programmesOrdre,
      true_false: programmesVraiFaux,
    },
  },
  'CM2.MA.ALG.SUITES': {
    gens: {
      numeric_answer: suitesNumeric,
      mcq: suitesQcm,
      fill_blank: suitesTrou,
      true_false: suitesVraiFaux,
    },
  },
};
