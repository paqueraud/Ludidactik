/** Fractions (Pizzaïolo, Chocolatier) : comparaison, découpage d'une tablette, écriture en mots. Fonctions pures. */
import type { VisualFractionItem } from '@/content/schemas';
import { nombreEnLettres } from '@/engine/nombres';

export interface Frac {
  n: number;
  d: number;
}

/** −1 si a < b, 0 si égales, 1 si a > b. */
export function comparer(a: Frac, b: Frac): -1 | 0 | 1 {
  const x = a.n * b.d - b.n * a.d;
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}

export const formatFrac = ({ n, d }: Frac) => `${n}/${d}`;

const DENOMS: Record<number, [string, string]> = {
  2: ['demi', 'demis'],
  3: ['tiers', 'tiers'],
  4: ['quart', 'quarts'],
};
const ORDINAUX = [
  '',
  '',
  '',
  '',
  '',
  'cinquième',
  'sixième',
  'septième',
  'huitième',
  'neuvième',
  'dixième',
  'onzième',
  'douzième',
  'treizième',
  'quatorzième',
  'quinzième',
  'seizième',
  'dix-septième',
  'dix-huitième',
  'dix-neuvième',
  'vingtième',
];

/** Ordinal d'un dénominateur : 45 → « quarante-cinquième ». */
function ordinal(d: number): string {
  const l = nombreEnLettres(d);
  return `${l.replace(/e$/, '').replace(/cinq$/, 'cinqu').replace(/neuf$/, 'neuv')}ième`;
}

/** « trois huitièmes », « un demi », « sept quarante-cinquièmes ». */
export function fracEnMots({ n, d }: Frac): string {
  const nb = n === 1 ? 'un' : nombreEnLettres(n);
  if (DENOMS[d]) return `${nb} ${DENOMS[d]![n > 1 ? 1 : 0]}`;
  if (d === 100) return `${nb} centième${n > 1 ? 's' : ''}`;
  if (d === 1000) return `${nb} millième${n > 1 ? 's' : ''}`;
  const o = ORDINAUX[d] || ordinal(d);
  return `${nb} ${o}${n > 1 ? 's' : ''}`;
}

/**
 * Découpage d'une tablette de chocolat en `d` carrés : [lignes, colonnes], le plus « carré » possible
 * avec au plus `maxCol` colonnes (1 ligne si `d` est premier et petit).
 */
export function grilleTablette(d: number, maxCol = 10): [number, number] {
  let best: [number, number] = [1, d];
  for (let r = 1; r * r <= d; r++) {
    if (d % r !== 0) continue;
    const c = d / r;
    if (c <= maxCol) best = [r, c];
  }
  if (best[1] > maxCol) {
    // premier trop grand : plusieurs lignes, la dernière incomplète
    const c = Math.min(maxCol, Math.ceil(Math.sqrt(d)));
    return [Math.ceil(d / c), c];
  }
  return best;
}

/** Nombre d'unités (pizzas, tablettes) nécessaires pour montrer une fraction. */
export const unitesNecessaires = (f: Frac) => Math.max(1, Math.ceil(f.n / f.d));

/** Item exploitable : dénominateur raisonnable pour le jeu, numérateur ≤ 3 unités. */
export function fractionJouable(item: VisualFractionItem, maxDenom: number): boolean {
  const f = { n: item.numerator, d: item.denominator };
  if (f.d > maxDenom || f.n > 3 * f.d) return false;
  if (item.task === 'comparer') {
    if (!item.other) return false;
    const o = item.other;
    if (o.denominator > maxDenom || o.numerator > 3 * o.denominator) return false;
  }
  return true;
}

/** Propositions d'écriture (niveau Facile, tâche « lire ») : la bonne + erreurs typiques. */
export function propositionsFraction(f: Frac, nb = 3): string[] {
  const out = [formatFrac(f)];
  const cands: Frac[] = [
    { n: f.d - f.n, d: f.d }, // parts non coloriées
    { n: f.d, d: f.n }, // inversée
    { n: f.n, d: f.d + 1 },
    { n: f.n + 1, d: f.d },
    { n: Math.max(1, f.n - 1), d: f.d },
  ];
  for (const c of cands) {
    if (c.n <= 0 || c.d <= 0) continue;
    const t = formatFrac(c);
    if (!out.includes(t)) out.push(t);
    if (out.length >= nb) break;
  }
  return out;
}

/**
 * Adapte l'énoncé au décor du jeu (« Colorie 3/8 de la tablette. » → « Garnis 3/8 de la pizza. ») :
 * les nombres et l'opération restent ceux de l'item, seul l'objet change.
 */
export function adapterEnonce(prompt: string, decor: 'pizza' | 'tablette'): string {
  const objet = decor === 'pizza' ? 'pizza' : 'tablette';
  let s = prompt.replace(/de la (pizza|bande|barre|tablette)/g, `de la ${objet}`);
  s = s.replace(/la (bande|barre|tablette|pizza) (est|sont)/g, `la ${objet} $2`);
  if (decor === 'pizza') s = s.replace(/^Colorie /, 'Garnis ').replace(/coloriée/g, 'garnie');
  return s;
}
