/**
 * Outils de texte communs aux jeux de langue (Karaoké, Détective, Perroquet, Puzzle, Labo des fonctions).
 * Fonctions pures, sans aucun contenu pédagogique : découpage en mots et en phrases, normalisation
 * tolérante pour comparer une lecture (reconnaissance vocale) au texte, distance d'édition.
 */
import { normalizeText, stripAccents } from '@/engine/answer';

/** Un mot du texte tel qu'il s'affiche (avec sa ponctuation collée) et sa forme de comparaison. */
export interface MotTexte {
  /** Ce qui s'affiche (« Soudain, », « l'arbre », « monte ! »). */
  affiche: string;
  /** Forme normalisée pour la comparaison (« soudain », « larbre »). */
  cle: string;
  /** Ponctuation forte qui suit le mot (fin de phrase) : pause plus longue au métronome. */
  finPhrase: boolean;
  /** Virgule, deux-points, point-virgule : petite pause. */
  pause: boolean;
  /** Index de la phrase à laquelle appartient le mot. */
  phrase: number;
}

/** Forme de comparaison d'un mot : minuscules, sans accents, sans apostrophe ni trait d'union. */
export function cleMot(mot: string): string {
  return stripAccents(normalizeText(mot).toLowerCase())
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '');
}

/** Découpe un texte en mots affichables (la ponctuation isolée « ! » est rattachée au mot précédent). */
export function decouperMots(texte: string): MotTexte[] {
  // pas de normalizeText ici : il colle la ponctuation (« casse ! » → « casse! »)
  const bruts = texte
    .normalize('NFC')
    .replace(/[`´ʼ]/g, '’')
    .split(/[\s  ]+/)
    .filter(Boolean);
  const out: MotTexte[] = [];
  let phrase = 0;
  for (const brut of bruts) {
    const cle = cleMot(brut);
    if (!cle) {
      // ponctuation isolée (« ! », « : », « — ») : on la colle au mot précédent
      const prec = out[out.length - 1];
      if (prec) {
        prec.affiche += /^[!?:;»”]/.test(brut) ? ` ${brut}` : ` ${brut}`;
        if (/[.!?…]/.test(brut)) {
          prec.finPhrase = true;
          phrase++;
        } else if (/[,;:]/.test(brut)) prec.pause = true;
      }
      continue;
    }
    const fin = /[.!?…]["»”)]*$/.test(brut);
    out.push({ affiche: brut, cle, finPhrase: fin, pause: !fin && /[,;:]["»”)]*$/.test(brut), phrase });
    if (fin) phrase++;
  }
  return out;
}

export interface PhraseTexte {
  texte: string;
  index: number;
}

/** Découpe un texte en phrases (après . ! ? … suivis d'un espace et d'une majuscule, d'un tiret ou d'un guillemet). */
export function decouperPhrases(texte: string): PhraseTexte[] {
  const t = normalizeText(texte);
  const morceaux = t.split(/(?<=[.!?…]["»”)]?)\s+(?=[\p{Lu}«"—–-])/u);
  return morceaux
    .map((m) => m.trim())
    .filter(Boolean)
    .map((texte, index) => ({ texte, index }));
}

/** Clé de comparaison d'une phrase entière (mots normalisés joints par des espaces). */
const clePhrase = (s: string) =>
  normalizeText(s)
    .split(' ')
    .map(cleMot)
    .filter(Boolean)
    .join(' ');

/**
 * Index de la phrase du texte qui contient la preuve (citation exacte ou fragment).
 * À défaut de citation exacte, la phrase qui partage le plus de mots avec la preuve. -1 si rien.
 */
export function indexPreuve(phrases: PhraseTexte[], preuve: string | undefined | null): number {
  if (!preuve) return -1;
  const p = clePhrase(preuve);
  if (!p) return -1;
  const exacte = phrases.findIndex((ph) => clePhrase(ph.texte).includes(p));
  if (exacte >= 0) return exacte;
  // la preuve peut couvrir deux phrases : on cherche la phrase qui contient son début
  const motsP = new Set(p.split(' '));
  let meilleur = -1;
  let score = 0;
  phrases.forEach((ph, i) => {
    const mots = clePhrase(ph.texte).split(' ');
    const communs = mots.filter((m) => motsP.has(m)).length;
    const s = communs / Math.max(motsP.size, 1);
    if (s > score) {
      score = s;
      meilleur = i;
    }
  });
  return score >= 0.6 ? meilleur : -1;
}

/** Distance d'édition de Levenshtein (sur des chaînes courtes). */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (!la) return lb;
  if (!lb) return la;
  let prec = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    for (let j = 1; j <= lb; j++) {
      cur[j] = Math.min(prec[j]! + 1, cur[j - 1]! + 1, prec[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prec = cur;
  }
  return prec[lb]!;
}

/** Majuscule au premier caractère alphabétique. */
export function majuscule(s: string): string {
  const i = s.search(/\p{L}/u);
  if (i < 0) return s;
  return s.slice(0, i) + s[i]!.toUpperCase() + s.slice(i + 1);
}
