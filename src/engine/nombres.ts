/**
 * Écriture des nombres en lettres (jusqu'à 999 999 999).
 * - `rectifiee` : orthographe rectifiée de 1990 (traits d'union entre tous les numéraux), utilisée par le BO 2024.
 * - `traditionnelle` : traits d'union seulement sous 100, « et un ».
 * Les deux sont acceptées dans les réponses.
 */
const UNITES = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];
const DIZAINES: Record<number, string> = {
  2: 'vingt',
  3: 'trente',
  4: 'quarante',
  5: 'cinquante',
  6: 'soixante',
};

type Style = 'rectifiee' | 'traditionnelle';

function sous100(n: number, style: Style): string {
  const sep = '-';
  if (n < 17) return UNITES[n]!;
  if (n < 20) return `dix${sep}${UNITES[n - 10]}`;
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DIZAINES[t]!;
    if (u === 1) return style === 'rectifiee' ? `${DIZAINES[t]}-et-un` : `${DIZAINES[t]} et un`;
    return `${DIZAINES[t]}${sep}${UNITES[u]}`;
  }
  if (n < 80) {
    if (n === 71) return style === 'rectifiee' ? 'soixante-et-onze' : 'soixante et onze';
    return `soixante-${sous100(n - 60, style)}`;
  }
  if (n === 80) return 'quatre-vingts';
  return `quatre-vingt-${sous100(n - 80, style)}`;
}

/** `finale` = le groupe termine le nombre (vingts/cents ne prennent un s qu'en fin de nombre). */
function sous1000(n: number, style: Style, finale: boolean): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  const j = style === 'rectifiee' ? '-' : ' ';
  let s: string;
  if (c === 0) s = sous100(r, style);
  else {
    const cent = c === 1 ? 'cent' : `${UNITES[c]}${j}cent${r === 0 && finale ? 's' : ''}`;
    s = r ? `${cent}${j}${sous100(r, style)}` : cent;
  }
  if (!finale) s = s.replace(/quatre-vingts$/, 'quatre-vingt');
  return s;
}

export function nombreEnLettres(n: number, style: Style = 'rectifiee'): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) throw new Error(`nombre non pris en charge : ${n}`);
  if (n === 0) return 'zéro';
  const j = style === 'rectifiee' ? '-' : ' ';
  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(`${sous1000(millions, style, true)} million${millions > 1 ? 's' : ''}`);
  if (milliers) parts.push(milliers === 1 ? 'mille' : `${sous1000(milliers, style, false)}${j}mille`);
  if (reste) parts.push(sous1000(reste, style, true));
  // En rectifiée, « mille » se lie au reste par un trait d'union ; « million » reste un nom (espace).
  if (style === 'rectifiee' && milliers && reste) {
    const r = parts.pop()!;
    parts.push(`${parts.pop()}-${r}`);
  }
  return parts.join(' ');
}

/** Toutes les graphies acceptées d'un nombre en lettres. */
export function graphiesNombre(n: number): string[] {
  return [...new Set([nombreEnLettres(n, 'rectifiee'), nombreEnLettres(n, 'traditionnelle')])];
}
