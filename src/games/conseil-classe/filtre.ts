/** Filtre léger (chargé avec le registre) : situations et affirmations jouables au Conseil de la classe. */
import type { Item } from '@/content/schemas';
import { estDevinette } from '../qui-suis-je/filtre';

export const estSituation = (it: Item): boolean => it.kind === 'true_false' || estDevinette(it);
