/**
 * Module de contenu « maths-cm2 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Toutes les leçons de mathématiques du CM2 hors calcul mental (déjà couvert par `calcul-mental.ts`) :
 * nombres entiers, fractions, décimaux, opérations, problèmes, algèbre, grandeurs et mesures,
 * géométrie, données et probabilités.
 * Programme : BO n°16 du 17/04/2025 (cycle 3), vérifié sur le PDF officiel
 * (`docs/programmes/VERIFICATION_PDF.md`).
 */
import type { ContentModule } from '../../registry';
import { ALGEBRE } from './algebre';
import { DECIMAUX } from './decimaux';
import { DONNEES } from './donnees';
import { FRACTIONS } from './fractions';
import { GEOMETRIE } from './geometrie';
import { GRANDEURS } from './grandeurs';
import { NOMBRES } from './nombres';
import { OPERATIONS } from './operations';
import { PROBLEMES } from './problemes';

export const contenu: ContentModule = {
  ...NOMBRES,
  ...FRACTIONS,
  ...DECIMAUX,
  ...OPERATIONS,
  ...PROBLEMES,
  ...ALGEBRE,
  ...GRANDEURS,
  ...GEOMETRIE,
  ...DONNEES,
};
