/** Construction des « appels » de Jacques a dit (logique pure, testée). */
import type { Item, Level, McqItem, OralItem, PairingItem } from '@/content/schemas';
import type { Rng } from '@/engine/rng';
import { estPaireImage, reduireChoix } from '../_monde-commun/outils';

export type Appel =
  | {
      type: 'image';
      item: PairingItem;
      /** Mot ou consigne en anglais (« cat », « touch your nose »). */
      mot: string;
      /** Consigne complète dite par Simon (« touch the cat », « point to red », « touch your nose »). */
      consigne: string;
      /** Image attendue (emoji). */
      cible: string;
      options: string[];
      /** false = piège : Simon n'a pas dit « Simon says », il ne faut pas bouger. */
      simon: boolean;
    }
  | { type: 'qcm'; item: McqItem; choices: string[]; answerIndex: number }
  | { type: 'oral'; item: OralItem };

/** Items jouables : paires mot ↔ image, QCM et réponses orales en anglais. */
export const estAnglais = (it: Item): boolean =>
  estPaireImage(it) ||
  (it.kind === 'mcq' && it.lang === 'en-GB') ||
  (it.kind === 'oral_answer' && it.lang === 'en-GB');

const OPTIONS: Record<Level, number> = { facile: 3, normal: 6, plus_loin: 6 };
const APPELS_PAR_PAIRE: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
/** Probabilité d'un piège (appel sans « Simon says »). */
export const PIEGES: Record<Level, number> = { facile: 0, normal: 0.2, plus_loin: 0.33 };

const VERBE =
  /^(touch|show|point|clap|jump|stand|sit|turn|raise|put|open|close|wave|nod|shake|stamp|hop|run|walk|look|smile|say)\b/i;

/**
 * Consigne anglaise pour un mot : le mot s'il commence déjà par un verbe (« touch your nose »),
 * sinon le modèle de l'item (`meta.consigne`, ex. « point to {mot} » pour les couleurs),
 * sinon « touch the {mot} ».
 */
export function consigneDe(mot: string, modele?: unknown): string {
  if (VERBE.test(mot)) return mot;
  const m = typeof modele === 'string' && modele.includes('{mot}') ? modele : 'touch the {mot}';
  return m.replace('{mot}', mot);
}

/** Phrase dite par Simon. */
export const phraseSimon = (a: Extract<Appel, { type: 'image' }>) =>
  a.simon ? `Simon says: ${a.consigne}!` : `${a.consigne.charAt(0).toUpperCase()}${a.consigne.slice(1)}!`;

/** Transforme un item en une suite d'appels. */
export function appelsDe(it: Item, level: Level, rng: Rng): Appel[] {
  if (estPaireImage(it) && it.kind === 'pairing') {
    const paires = rng.shuffle(it.pairs).slice(0, APPELS_PAR_PAIRE[level]);
    let pieges = 0;
    return paires.map((p, k) => {
      const autres = rng
        .shuffle(it.pairs.filter((q) => q.right !== p.right).map((q) => q.right))
        .slice(0, OPTIONS[level] - 1);
      // jamais de piège au premier appel, au plus 2 par série
      const piege = k > 0 && pieges < 2 && rng.chance(PIEGES[level]);
      if (piege) pieges++;
      return {
        type: 'image' as const,
        item: it,
        mot: p.left,
        consigne: consigneDe(p.left, it.meta?.consigne),
        cible: p.right,
        options: rng.shuffle([p.right, ...autres]),
        simon: !piege,
      };
    });
  }
  if (it.kind === 'mcq') {
    const n = level === 'facile' ? Math.min(3, it.choices.length) : it.choices.length;
    return [{ type: 'qcm', item: it, ...reduireChoix(it, n, rng) }];
  }
  if (it.kind === 'oral_answer') return [{ type: 'oral', item: it }];
  return [];
}
