/** La Roue des probabilités : items acceptés. */
import type { Item } from '@/content/schemas';
import { lireExperience } from '../_geometrie-commun/proba';

/** Classer des évènements d'impossible à certain, ou QCM de la leçon de probabilités. */
export function estProba(it: Item): it is Item {
  if (it.kind === 'classification')
    return it.categories.includes('impossible') && it.categories.includes('certain');
  if (it.kind === 'mcq')
    return (
      /\.PROBA\b/.test(it.lessonId) || (/hasard|chances?/.test(it.question) && !!lireExperience(it.question))
    );
  return false;
}
