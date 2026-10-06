/** L'Usine à patrons : quel poste de l'usine pour quel item. */
import type { Item } from '@/content/schemas';
import { est } from '../_geometrie-commun/grille';
import { lirePatron } from '../_geometrie-commun/patron';
import { modeleSolide } from '../_geometrie-commun/solides';

export type ModeUsine = 'solide' | 'compter' | 'patron' | 'completer';

export function quoiCompter(prompt: string): 'faces' | 'arêtes' | 'sommets' | null {
  const m = prompt.match(/\b(faces|arêtes|sommets)\b/);
  return m ? (m[1] as 'faces' | 'arêtes' | 'sommets') : null;
}

export function modeUsine(it: Item): ModeUsine | null {
  if (!est(it)) return null;
  if (it.task === 'patron') {
    const p = lirePatron(it);
    return p ? (p.type === 'completer' ? 'completer' : 'patron') : null;
  }
  const choixOk = !!it.choices && it.choices.length >= 2 && it.choices.includes(it.answer);
  if (!choixOk || !modeleSolide(it.shape)) return null;
  if (it.task === 'solide') return 'solide';
  if (it.task === 'proprietes' && quoiCompter(it.prompt) && !modeleSolide(it.shape)!.boule) return 'compter';
  return null;
}

export const estPourUsine = (it: Item): it is Item => modeUsine(it) !== null;
