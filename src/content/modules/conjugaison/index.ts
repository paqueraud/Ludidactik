/**
 * Module de contenu « conjugaison » — conjugaison et orthographe grammaticale, CE1 et CM2.
 * Voir docs/GUIDE_DEV_JEUX_CONTENU.md. Moteur de conjugaison : ./moteur.ts.
 */
import type { ContentModule } from '../../registry';
import { CONJ_CE1 } from './conj-ce1';
import { CONJ_CM2 } from './conj-cm2';

export const contenu: ContentModule = {
  ...CONJ_CE1,
  ...CONJ_CM2,
};
