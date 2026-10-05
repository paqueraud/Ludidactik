/**
 * Forge du verbe : lecture d'un item `fill_blank` de conjugaison (champ `conjugaison` = rouleaux
 * sujet | verbe | temps) et décomposition d'une forme conjuguée en radical / marque de temps /
 * marque de personne (CM2, BO 2025), ou auxiliaire / participe passé pour les temps composés.
 * La décomposition est mécanique (terminaisons régulières) ; si elle n'est pas sûre, on ne colore pas.
 */
import type { FillBlankItem, Item } from '@/content/schemas';
import { normalizeText, stripAccents } from '@/engine/answer';

export interface QuestionForge {
  item: FillBlankItem;
  sujet: string;
  verbe: string;
  temps: string;
  /** Phrase avant / après le trou (l'indication « (chanter, présent) » est retirée : les rouleaux la donnent). */
  avant: string;
  apres: string;
  reponse: string;
  acceptees: string[];
  choix: string[] | null;
}

export function versForge(item: Item): QuestionForge | null {
  if (item.kind !== 'fill_blank' || !item.conjugaison) return null;
  const { sujet, verbe, temps } = item.conjugaison;
  if (!verbe.trim() || !temps.trim()) return null;
  const i = item.sentence.indexOf('___');
  if (i < 0) return null;
  let j = i + 3;
  while (item.sentence[j] === '_') j++;
  const nettoie = (s: string) =>
    s.replace(/\s*\(([^)]*)\)/g, (m, dedans: string) =>
      normalizeText(dedans).toLowerCase().includes(normalizeText(verbe).toLowerCase()) ? '' : m,
    );
  return {
    item,
    sujet: sujet.trim(),
    verbe: verbe.trim(),
    temps: temps.trim(),
    avant: nettoie(item.sentence.slice(0, i)),
    apres: nettoie(item.sentence.slice(j)),
    reponse: item.answer,
    acceptees: [item.answer, ...(item.accepted ?? [])],
    choix: item.choices && item.choices.length >= 2 ? item.choices : null,
  };
}

export type Role = 'radical' | 'temps' | 'personne' | 'terminaison' | 'auxiliaire' | 'participe';

export interface Morceau {
  texte: string;
  role: Role;
}

type Personne = '1s' | '2s' | '3s' | '1p' | '2p' | '3p';

const cle = (s: string) => stripAccents(normalizeText(s).toLowerCase());

/** Personne grammaticale d'un sujet pronom (null pour un groupe nominal : on essaie 3s et 3p). */
export function personneDe(sujet: string): Personne | null {
  const s = cle(sujet).replace(/['’]$/, '');
  if (s === 'je' || s === 'j') return '1s';
  if (s === 'tu') return '2s';
  if (['il', 'elle', 'on'].includes(s)) return '3s';
  if (s === 'nous') return '1p';
  if (s === 'vous') return '2p';
  if (['ils', 'elles'].includes(s)) return '3p';
  return null;
}

/** Terminaisons : [marque de temps, marque de personne] par personne. */
const TERMINAISONS: Record<string, Record<Personne, [string, string][]>> = {
  imparfait: {
    '1s': [['ai', 's']],
    '2s': [['ai', 's']],
    '3s': [['ai', 't']],
    '1p': [['i', 'ons']],
    '2p': [['i', 'ez']],
    '3p': [['ai', 'ent']],
  },
  futur: {
    '1s': [['r', 'ai']],
    '2s': [['r', 'as']],
    '3s': [['r', 'a']],
    '1p': [['r', 'ons']],
    '2p': [['r', 'ez']],
    '3p': [['r', 'ont']],
  },
  conditionnel: {
    '1s': [['rai', 's']],
    '2s': [['rai', 's']],
    '3s': [['rai', 't']],
    '1p': [['ri', 'ons']],
    '2p': [['ri', 'ez']],
    '3p': [['rai', 'ent']],
  },
  present: {
    '1s': [
      ['', 'e'],
      ['', 's'],
      ['', 'x'],
    ],
    '2s': [
      ['', 'es'],
      ['', 's'],
      ['', 'x'],
    ],
    '3s': [
      ['', 'e'],
      ['', 't'],
      ['', 'd'],
    ],
    '1p': [['', 'ons']],
    '2p': [['', 'ez']],
    '3p': [
      ['', 'ent'],
      ['', 'ont'],
    ],
  },
};

function familleTemps(temps: string): string | null {
  const t = cle(temps);
  if (/imparfait/.test(t)) return 'imparfait';
  if (/conditionnel/.test(t)) return 'conditionnel';
  if (/futur/.test(t) && !/anterieur/.test(t)) return 'futur';
  if (/^present( de l['’]indicatif)?$/.test(t)) return 'present';
  if (/passe compose|plus-que-parfait|plus que parfait|anterieur/.test(t)) return 'compose';
  return null;
}

/**
 * Décompose une forme conjuguée. Renvoie null si la forme ne suit pas un modèle régulier sûr
 * (le jeu affiche alors la forme sans couleurs).
 */
export function decomposer(forme: string, temps: string, sujet: string, verbe = ''): Morceau[] | null {
  const f = normalizeText(forme);
  const famille = familleTemps(temps);
  if (!famille || !f) return null;
  // au présent, être, avoir et aller sont trop irréguliers pour un découpage simple
  if (famille === 'present' && ['etre', 'avoir', 'aller'].includes(cle(verbe))) return null;
  if (famille === 'compose') {
    const mots = f.split(' ');
    if (mots.length !== 2) return null;
    return [
      { texte: mots[0]!, role: 'auxiliaire' },
      { texte: ' ', role: 'radical' },
      { texte: mots[1]!, role: 'participe' },
    ];
  }
  if (/\s/.test(f)) return null;
  const table = TERMINAISONS[famille]!;
  const p = personneDe(sujet);
  // sujet GN : 3e personne, singulier ou pluriel ; les terminaisons les plus longues d'abord
  // (« Les enfants chantent » → chant|ent et non chanten|t)
  const personnes: Personne[] = p ? [p] : ['3p', '3s'];
  const fl = f.toLowerCase();
  const options = personnes
    .flatMap((pers) => table[pers])
    .sort((a, b) => b[0].length + b[1].length - (a[0].length + a[1].length));
  {
    for (const [mt, mp] of options) {
      const fin = mt + mp;
      if (!fl.endsWith(fin)) continue;
      const radical = f.slice(0, f.length - fin.length);
      // radical trop court (« ont », « est ») : verbe irrégulier, on ne colore pas
      if (radical.length < (famille === 'present' ? 2 : 1)) continue;
      const out: Morceau[] = [{ texte: radical, role: 'radical' }];
      if (mt) out.push({ texte: f.slice(radical.length, radical.length + mt.length), role: 'temps' });
      out.push({ texte: f.slice(f.length - mp.length), role: 'personne' });
      return out;
    }
  }
  return null;
}

/** Libellés lisibles des rôles (légende de la correction). */
export const LIBELLE_ROLE: Record<Role, string> = {
  radical: 'radical',
  temps: 'marque du temps',
  personne: 'marque de la personne',
  terminaison: 'terminaison',
  auxiliaire: 'auxiliaire',
  participe: 'participe passé',
};
