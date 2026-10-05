/**
 * Module de contenu « maths-ce1 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Toutes les leçons de mathématiques du CE1 hors calcul mental (déjà couvert par `calcul-mental.ts`) :
 * nombres, fractions, calcul posé, problèmes, grandeurs et mesures, géométrie, données.
 * Programme : BO n°41 du 31/10/2024 (cycle 2), vérifié sur le PDF officiel.
 */
import type { ContentModule } from '../../registry';
import { CALCUL_POSE } from './calcul-pose';
import { DONNEES } from './donnees';
import { FRACTIONS } from './fractions';
import { GEOMETRIE } from './geometrie';
import { GRANDEURS } from './grandeurs';
import { NOMBRES } from './nombres';
import { PROBLEMES } from './problemes';

export const contenu: ContentModule = {
  ...NOMBRES,
  ...FRACTIONS,
  ...CALCUL_POSE,
  ...PROBLEMES,
  ...GRANDEURS,
  ...GEOMETRIE,
  ...DONNEES,
};
