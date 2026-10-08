/**
 * Phrases : ponctuation finale (Feu tricolore), étiquettes-mots à remettre dans l'ordre (Puzzle).
 * Fonctions pures : aucun contenu pédagogique, seulement la forme des items (GUIDE §6).
 */
import type { Item, McqItem, OrderingItem } from '@/content/schemas';
import { normalizeText } from '@/engine/answer';

export type Signe = '.' | '?' | '!';
export const SIGNES: Signe[] = ['.', '?', '!'];
const estSigne = (s: string): s is Signe => (SIGNES as string[]).includes(s);

/** Phrase écrite avec sa ponctuation finale, à la française (espace insécable avant ? et !). */
export function avecSigne(phrase: string, signe: Signe | null): string {
  const p = phrase.trim();
  if (!signe) return p;
  return signe === '.' ? `${p}.` : `${p} ${signe}`;
}

/** Retire la ponctuation finale d'une phrase. */
export const sansPonctuationFinale = (s: string) =>
  normalizeText(s)
    .replace(/\s*[.!?…]+\s*$/, '')
    .trim();

/* ------------------------------------------------------------------ */
/* Feu tricolore                                                       */
/* ------------------------------------------------------------------ */

export interface QuestionFeu {
  item: McqItem;
  /** Phrase affichée, sans ponctuation finale. */
  phrase: string;
  /** Phrase lue à voix haute, AVEC sa ponctuation (pour l'intonation). */
  aDire: string;
  reponse: Signe;
  /** Signes proposés (dans l'ordre du feu : . ? !). */
  choix: Signe[];
}

/**
 * Item de ponctuation : `mcq` dont les choix sont des signes . ? ! et qui porte la phrase dans
 * `meta.phrase` (convention) — ou, à défaut, entre guillemets « » dans la question.
 */
export function versFeu(item: Item): QuestionFeu | null {
  if (item.kind !== 'mcq') return null;
  const choix = item.choices.map((c) => c.trim());
  if (choix.length < 2 || !choix.every(estSigne)) return null;
  const reponse = choix[item.answerIndex];
  if (!reponse || !estSigne(reponse)) return null;
  const meta = item.meta?.phrase;
  let phrase = typeof meta === 'string' ? meta : null;
  if (!phrase) {
    const m = /«\s*([^»]+?)\s*»/.exec(item.question);
    phrase = m?.[1] ?? null;
  }
  if (!phrase) return null;
  phrase = sansPonctuationFinale(phrase);
  if (!phrase) return null;
  const spoken = item.spoken && /[.!?]\s*$/.test(item.spoken) ? item.spoken : null;
  return {
    item,
    phrase,
    aDire: spoken ?? avecSigne(phrase, reponse),
    reponse,
    choix: SIGNES.filter((s) => choix.includes(s)),
  };
}

/* ------------------------------------------------------------------ */
/* Puzzle de phrases                                                   */
/* ------------------------------------------------------------------ */

export interface Puzzle {
  item: OrderingItem;
  /** Étiquettes dans le bon ordre (sans la ponctuation finale). */
  etiquettes: string[];
  /** Ponctuation finale à choisir (mode phrase), ou null. */
  ponctuation: Signe | null;
  /** Signes acceptés (la ponctuation attendue + `meta.ponctuationsAcceptees`). */
  ponctuationsOk: Signe[];
  /** rang = ranger des nombres ou des mots (modes `croissant` / `decroissant` de l'item). */
  mode: 'phrase' | 'etapes' | 'rang';
  /** Mode rang : séparateur affiché entre deux étiquettes (« < », « > », ou « → » pour des mots). */
  separateur: string;
}

/** Les étiquettes sont-elles toutes des nombres (« 3,5 », « 1 250 », « 3/4 ») ? */
const estNombre = (s: string) => /^[−-]?\d[\d\s\u00a0\u202f]*(?:[,.]\d+)?(?:\/\d+)?$/.test(s.trim());

/** Écriture d'une suite rangée : « 98 < 305 < 350 » (nombres) ou « âne → chat → zèbre » (mots). */
export function suiteRangee(etiquettes: string[], separateur: string): string {
  return etiquettes.join(` ${separateur} `);
}

/** Item `ordering` en mode `phrase` (mots) ou `etapes` (procédure, cycle…). null sinon. */
export function versPuzzle(item: Item): Puzzle | null {
  if (item.kind !== 'ordering' || item.mode === 'chrono') return null;
  const etiquettes = [...item.elements];
  if (item.mode === 'croissant' || item.mode === 'decroissant') {
    if (etiquettes.length < 2 || new Set(etiquettes).size !== etiquettes.length) return null;
    const nombres = etiquettes.every(estNombre);
    const separateur = !nombres ? '→' : item.mode === 'croissant' ? '<' : '>';
    return { item, etiquettes, ponctuation: null, ponctuationsOk: [], mode: 'rang', separateur };
  }
  let ponctuation: Signe | null = null;
  if (item.mode === 'phrase') {
    const dernier = normalizeText(etiquettes[etiquettes.length - 1] ?? '');
    if (estSigne(dernier)) {
      ponctuation = dernier;
      etiquettes.pop();
    } else {
      const m = /^(.*\S)\s*([.?!])$/.exec(dernier);
      if (m && !/[.?!]$/.test(m[1]!)) {
        ponctuation = m[2] as Signe;
        etiquettes[etiquettes.length - 1] = m[1]!;
      }
    }
  }
  if (etiquettes.length < 2 || new Set(etiquettes).size !== etiquettes.length) return null;
  // Plusieurs signes possibles (« Ne cours pas dans le couloir. » ou « … ! ») : meta.ponctuationsAcceptees
  const meta = item.meta?.ponctuationsAcceptees;
  const autres = Array.isArray(meta)
    ? meta.filter((s): s is Signe => typeof s === 'string' && estSigne(s))
    : [];
  const ponctuationsOk = ponctuation ? [...new Set<Signe>([ponctuation, ...autres])] : [];
  return { item, etiquettes, ponctuation, ponctuationsOk, mode: item.mode, separateur: '' };
}

/** Assemble des étiquettes-mots en phrase (pas d'espace après une apostrophe). */
export function assembler(mots: string[], signe: Signe | null = null): string {
  let s = '';
  for (const m of mots) {
    if (!s) s = m;
    else if (/['’]$/.test(s) || /^[,.]/.test(m)) s += m;
    else s += ` ${m}`;
  }
  return avecSigne(s, signe);
}

/** Index de la première étiquette mal placée (-1 si tout est juste). */
export function premiereErreur(propose: string[], attendu: string[]): number {
  for (let i = 0; i < attendu.length; i++) if (propose[i] !== attendu[i]) return i;
  return propose.length === attendu.length ? -1 : attendu.length;
}
