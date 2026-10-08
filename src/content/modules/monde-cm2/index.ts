/**
 * Module de contenu « monde-cm2 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Histoire (programmes 2020 et 2026, rappel CM1), géographie (2020 et 2026), sciences et technologie (2020),
 * EMC et anglais du CM2. Chaque leçon est décrite par une fiche déclarative (`outils.ts`) transformée en
 * banques d'items (`pools`) ; les QCM simples d'histoire complètent la banque `data/histoire/cm2_questions.json`.
 */
import type { ContentModule } from '../../registry';
import { ANGLAIS } from './anglais';
import { EMC } from './emc';
import { GEOGRAPHIE } from './geographie';
import { HISTOIRE_2020 } from './histoire2020';
import { HISTOIRE_2026 } from './histoire2026';
import { type Fiche, contenuDe } from './outils';
import { SCIENCES } from './sciences';

export const FICHES: Fiche[] = [
  ...HISTOIRE_2020,
  ...HISTOIRE_2026,
  ...GEOGRAPHIE,
  ...SCIENCES,
  ...EMC,
  ...ANGLAIS,
];

export const contenu: ContentModule = Object.fromEntries(FICHES.map((f) => [f.lecon, contenuDe(f)]));
