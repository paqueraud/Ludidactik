/**
 * Normalisation et comparaison des réponses (ARCHITECTURE §9).
 * - Nombres : espaces de milliers, virgule ou point, zéros non significatifs tolérés au niveau Facile.
 * - Orthographe : sensible aux accents (avec message dédié), insensible à la casse sauf noms propres,
 *   rectifications de 1990 acceptées.
 */

const NBSP = ' ';

/* ------------------------------------------------------------------ */
/* Nombres                                                             */
/* ------------------------------------------------------------------ */

/** Arrondit pour éviter les artefacts flottants (0,1 + 0,2). */
export function roundTo(n: number, decimals = 3): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Écrit un nombre à la française : « 12 000 », « 3,45 ». */
export function formatNumber(n: number, decimals?: number): string {
  const negative = n < 0;
  const abs = Math.abs(n);
  const fixed = decimals === undefined ? String(roundTo(abs, 3)) : abs.toFixed(decimals);
  const [intPart = '0', decPart] = fixed.split('.');
  const grouped = intPart.length > 4 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : intPart;
  return `${negative ? '−' : ''}${grouped}${decPart ? `,${decPart}` : ''}`;
}

export interface NumericCheck {
  correct: boolean;
  /** Valeur lue, ou null si la saisie n'est pas un nombre. */
  value: number | null;
  /** Message d'aide ciblé (zéros inutiles…). */
  hint?: string;
}

/** Lit une saisie d'enfant : « 12 500 », « 3,5 », « 3.5 ». */
export function parseNumber(input: string): number | null {
  const s = input
    .replace(/[\s  ]/g, '')
    .replace('−', '-')
    .replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function hasNonSignificantZeros(input: string): boolean {
  const s = input.replace(/[\s  ]/g, '').replace(',', '.');
  const leading = /^-?0\d/.test(s);
  const trailing = /\.\d*0$/.test(s);
  return leading || trailing;
}

export function checkNumeric(
  input: string,
  expected: number,
  opts: { tolerateZeros?: boolean } = {},
): NumericCheck {
  const value = parseNumber(input);
  if (value === null)
    return { correct: false, value, hint: 'Écris seulement des chiffres (et une virgule si besoin).' };
  const same = Math.abs(value - expected) < 1e-9;
  if (same && hasNonSignificantZeros(input) && !opts.tolerateZeros) {
    return { correct: false, value, hint: 'C’est la bonne valeur, mais on n’écrit pas les zéros inutiles !' };
  }
  return { correct: same, value };
}

/* ------------------------------------------------------------------ */
/* Orthographe                                                         */
/* ------------------------------------------------------------------ */

/** Supprime les accents (é → e, ç → c, œ conservé). */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/** Normalisation commune : NFC, apostrophes droites, espaces simples, ligatures tolérées. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[’`´ʼ]/g, "'")
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

/** Les jeunes enfants tapent « oe » sur un clavier sans œ : on accepte. */
function foldLigatures(s: string): string {
  return s.replace(/œ/g, 'oe').replace(/Œ/g, 'Oe').replace(/æ/g, 'ae');
}

/** Graphies rectifiées (1990) ↔ traditionnelles, dans les deux sens. */
const RECTIFICATIONS: ReadonlyArray<readonly [string, string]> = [
  ['oignon', 'ognon'],
  ['événement', 'évènement'],
  ['nénuphar', 'nénufar'],
  ['clef', 'clé'],
  ['relais', 'relai'],
  ['week-end', 'weekend'],
  ['porte-monnaie', 'portemonnaie'],
  ['millefeuille', 'mille-feuille'],
  ['chariot', 'charriot'],
  ['eczéma', 'exéma'],
  ['douceâtre', 'douçâtre'],
  ['assener', 'asséner'],
  ['réglementaire', 'règlementaire'],
  ['crémerie', 'crèmerie'],
  ['sécheresse', 'sècheresse'],
];

/** Mots où l'accent circonflexe sur i/u reste obligatoire (distinction de sens). */
const CIRCUMFLEX_KEPT = new Set([
  'dû',
  'mûr',
  'mûre',
  'mûrs',
  'mûres',
  'sûr',
  'sûre',
  'sûrs',
  'sûres',
  'jeûne',
  'jeûnes',
  'crû',
  'crûs',
]);

/** Toutes les graphies acceptées pour un mot ou une expression attendue. */
export function acceptedSpellings(expected: string): string[] {
  const base = normalizeText(expected);
  const out = new Set<string>([base]);
  // Circonflexe sur i et u : facultatif depuis 1990 (sauf exceptions)
  const words = base.split(' ');
  const noCirc = words.map((w) =>
    CIRCUMFLEX_KEPT.has(w.toLowerCase()) ? w : w.replace(/î/g, 'i').replace(/û/g, 'u'),
  );
  out.add(noCirc.join(' '));
  for (const [a, b] of RECTIFICATIONS) {
    for (const v of [...out]) {
      if (v.includes(a)) out.add(v.replace(a, b));
      if (v.includes(b)) out.add(v.replace(b, a));
    }
  }
  return [...out];
}

export type SpellingVerdict = 'juste' | 'accent' | 'majuscule' | 'ponctuation' | 'faux';

export interface SpellingCheck {
  correct: boolean;
  verdict: SpellingVerdict;
  /** Message encourageant et précis. */
  message: string;
}

const startsWithCapital = (s: string) => /^\p{Lu}/u.test(s);

/**
 * Compare une saisie à un mot (ou une phrase) attendu.
 * Mot isolé : insensible à la casse sauf nom propre. Phrase : majuscule initiale exigée, point final facultatif.
 */
export function checkSpelling(
  input: string,
  expected: string,
  opts: { isSentence?: boolean } = {},
): SpellingCheck {
  const given = foldLigatures(normalizeText(input));
  const accepted = acceptedSpellings(expected).map(foldLigatures);
  const stripEndPunct = (s: string) => s.replace(/[.!?]$/, '');

  if (opts.isSentence) {
    const g = stripEndPunct(given);
    for (const a of accepted) {
      const e = stripEndPunct(a);
      if (g === e) return { correct: true, verdict: 'juste', message: 'Bravo, phrase parfaite !' };
    }
    for (const a of accepted) {
      const e = stripEndPunct(a);
      if (g.toLowerCase() === e.toLowerCase())
        return { correct: false, verdict: 'majuscule', message: 'Presque ! Attention aux majuscules.' };
      if (stripAccents(g) === stripAccents(e))
        return { correct: false, verdict: 'accent', message: 'Presque ! Il y a une erreur d’accent.' };
    }
    return { correct: false, verdict: 'faux', message: 'Presque ! Regarde bien la phrase.' };
  }

  const properNoun = startsWithCapital(normalizeText(expected));
  const cmp = (s: string) => (properNoun ? s : s.toLowerCase());
  if (accepted.some((a) => cmp(a) === cmp(given)))
    return { correct: true, verdict: 'juste', message: 'Bravo !' };
  if (properNoun && accepted.some((a) => a.toLowerCase() === given.toLowerCase()))
    return {
      correct: false,
      verdict: 'majuscule',
      message: 'Presque ! C’est un nom propre : il prend une majuscule.',
    };
  if (accepted.some((a) => stripAccents(a.toLowerCase()) === stripAccents(given.toLowerCase())))
    return {
      correct: false,
      verdict: 'accent',
      message: 'Presque ! Toutes les lettres sont là, mais attention à l’accent.',
    };
  return { correct: false, verdict: 'faux', message: 'Presque ! Regarde bien le mot.' };
}

/* ------------------------------------------------------------------ */
/* Différence lettre à lettre                                          */
/* ------------------------------------------------------------------ */

export type DiffOp =
  | { type: 'ok'; char: string }
  | { type: 'sub'; char: string; given: string }
  | { type: 'missing'; char: string }
  | { type: 'extra'; given: string };

/** Alignement de Levenshtein : ce que l'enfant a écrit par rapport au mot attendu. */
export function letterDiff(given: string, expected: string): DiffOp[] {
  const g = [...normalizeText(given)];
  const e = [...normalizeText(expected)];
  const n = g.length;
  const m = e.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + (same(g[i - 1]!, e[j - 1]!) ? 0 : 1),
      );
  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i]![j] === d[i - 1]![j - 1]! + (same(g[i - 1]!, e[j - 1]!) ? 0 : 1)) {
      ops.push(
        same(g[i - 1]!, e[j - 1]!)
          ? { type: 'ok', char: e[j - 1]! }
          : { type: 'sub', char: e[j - 1]!, given: g[i - 1]! },
      );
      i--;
      j--;
    } else if (j > 0 && d[i]![j] === d[i]![j - 1]! + 1) {
      ops.push({ type: 'missing', char: e[j - 1]! });
      j--;
    } else {
      ops.push({ type: 'extra', given: g[i - 1]! });
      i--;
    }
  }
  return ops.reverse();
}
