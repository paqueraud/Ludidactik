/**
 * Roue des probabilités : reconnaître l'expérience décrite dans l'énoncé (dé, pièce, cartes, sac de billes,
 * roue…) pour l'afficher et la « tester » en vrai (tirages animés). Les items de probabilités n'ont pas de
 * `meta` : on lit le texte. Si l'expérience n'est pas reconnue, le jeu affiche seulement la question.
 */
import type { Rng } from '@/engine/rng';

export interface Couleur {
  nom: string;
  n: number;
}

export type Experience =
  | { type: 'de' }
  | { type: 'piece' }
  | { type: 'cartes'; n: number }
  | { type: 'sac'; couleurs: Couleur[] }
  | { type: 'roue'; couleurs: Couleur[] }
  | { type: 'deux-pieces' }
  | { type: 'piece-de' }
  | { type: 'deux-des' }
  | { type: 'trois-pieces' };

const MOTS_NOMBRES: Record<string, number> = { une: 1, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
const nombre = (s: string) => (/^\d+$/.test(s) ? Number(s) : (MOTS_NOMBRES[s.toLowerCase()] ?? NaN));

/** Couleur au singulier (« rouges » → « rouge », « bleues » → « bleue »). */
const singulier = (c: string) => c.replace(/s$/, '');

function couleurs(texte: string, objet: 'bille' | 'part'): Couleur[] {
  // Seule la phrase qui décrit le contenu compte (pas « tirer une bille rouge » dans la question).
  const phrase =
    texte
      .split(/(?<=\.)\s+/)
      .find((p) => (objet === 'bille' ? /il y a/.test(p) && /bille/.test(p) : /partagée en/.test(p))) ?? '';
  const re = new RegExp(`(\\d+|une?|deux|trois|quatre|cinq|six)\\s+${objet}s?\\s+([a-zéèêàç]+)`, 'gi');
  const out: Couleur[] = [];
  for (const m of phrase.matchAll(re)) {
    const n = nombre(m[1]!);
    const nom = singulier(m[2]!.toLowerCase());
    if (!Number.isFinite(n) || n <= 0 || ['au', 'qui', 'de', 'en', 'égale'].includes(nom)) continue;
    const deja = out.find((c) => c.nom === nom);
    if (deja) deja.n += n;
    else out.push({ nom, n });
  }
  return out;
}

export function lireExperience(texte: string): Experience | null {
  const t = texte.toLowerCase();
  if (/trois pièces/.test(t)) return { type: 'trois-pieces' };
  if (/deux dés/.test(t)) return { type: 'deux-des' };
  if (/deux pièces/.test(t)) return { type: 'deux-pieces' };
  if (/pièce de monnaie, puis un dé|une pièce .* puis un dé/.test(t)) return { type: 'piece-de' };
  const roue = t.match(/roue est partagée en (\d+) parts/);
  if (roue) {
    const cs = couleurs(t, 'part');
    const total = cs.reduce((s, c) => s + c.n, 0);
    if (cs.length >= 2 && total === Number(roue[1]) && total <= 12) return { type: 'roue', couleurs: cs };
  }
  if (/\bsac\b/.test(t) && /bille/.test(t)) {
    const cs = couleurs(t, 'bille');
    const total = cs.reduce((s, c) => s + c.n, 0);
    if (cs.length >= 1 && total >= 2 && total <= 16) return { type: 'sac', couleurs: cs };
  }
  const cartes = t.match(/parmi (\d+) cartes/);
  if (cartes && Number(cartes[1]) <= 12) return { type: 'cartes', n: Number(cartes[1]) };
  if (/\bdé\b/.test(t)) return { type: 'de' };
  if (/\bpièce\b/.test(t)) return { type: 'piece' };
  return null;
}

/** Teinte d'affichage d'une couleur nommée. */
export const TEINTES: Record<string, string> = {
  rouge: '#FF6B5E',
  bleue: '#4FA3F7',
  bleu: '#4FA3F7',
  verte: '#5CC97A',
  vert: '#5CC97A',
  jaune: '#FFD45C',
  noire: '#3A3F55',
  noir: '#3A3F55',
  blanche: '#F4F4F4',
  violette: '#8E7CFF',
  orange: '#FFA94D',
  rose: '#FF8FC7',
};
export const teinte = (nom: string) => TEINTES[nom] ?? '#B0B8CC';

/** Résultat d'un tirage, prêt à afficher. */
export type Tirage =
  | { type: 'de'; faces: number[] }
  | { type: 'piece'; cotes: ('pile' | 'face')[] }
  | { type: 'mixte'; cote: 'pile' | 'face'; face: number }
  | { type: 'carte'; n: number }
  | { type: 'couleur'; nom: string; index: number };

export function tirer(x: Experience, rng: Rng): Tirage {
  const de = () => rng.int(1, 6);
  const pf = (): 'pile' | 'face' => (rng.chance(0.5) ? 'pile' : 'face');
  switch (x.type) {
    case 'de':
      return { type: 'de', faces: [de()] };
    case 'deux-des':
      return { type: 'de', faces: [de(), de()] };
    case 'piece':
      return { type: 'piece', cotes: [pf()] };
    case 'deux-pieces':
      return { type: 'piece', cotes: [pf(), pf()] };
    case 'trois-pieces':
      return { type: 'piece', cotes: [pf(), pf(), pf()] };
    case 'piece-de':
      return { type: 'mixte', cote: pf(), face: de() };
    case 'cartes':
      return { type: 'carte', n: rng.int(1, x.n) };
    case 'sac':
    case 'roue': {
      const total = x.couleurs.reduce((s, c) => s + c.n, 0);
      let k = rng.int(0, total - 1);
      for (const c of x.couleurs) {
        if (k < c.n) return { type: 'couleur', nom: c.nom, index: k };
        k -= c.n;
      }
      return { type: 'couleur', nom: x.couleurs[0]!.nom, index: 0 };
    }
  }
}

/** Texte court d'un résultat (historique des tirages, lecture à voix haute). */
export function decrire(t: Tirage): string {
  switch (t.type) {
    case 'de':
      return t.faces.length > 1
        ? `${t.faces.join(' et ')} (somme ${t.faces[0]! + t.faces[1]!})`
        : `${t.faces[0]}`;
    case 'piece':
      return t.cotes.join(', ');
    case 'mixte':
      return `${t.cote} et ${t.face}`;
    case 'carte':
      return `la carte ${t.n}`;
    case 'couleur':
      return t.nom;
  }
}

/** Clé de regroupement des résultats pour le tableau des fréquences. */
export function cleResultat(t: Tirage): string {
  switch (t.type) {
    case 'de':
      return t.faces.length > 1 ? `somme ${t.faces[0]! + t.faces[1]!}` : `${t.faces[0]}`;
    case 'piece':
      return t.cotes.length > 1 ? `${t.cotes.filter((c) => c === 'pile').length} pile` : t.cotes[0]!;
    case 'mixte':
      return `${t.cote} ${t.face}`;
    case 'carte':
      return `${t.n}`;
    case 'couleur':
      return t.nom;
  }
}
