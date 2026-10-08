/**
 * Module de contenu « monde-ce1 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Questionner le monde (programme 2020, en vigueur au CE1 en 2026-2027), EMC et anglais du CE1.
 * Les banques rédigées sont étiquetées par niveau ; `outils.ts` les transforme en items typés.
 */
import type { ContentModule } from '../../registry';
import { ANGLAIS } from './anglais';
import { EMC } from './emc';
import { ESPACE } from './espace';
import { MATIERE } from './matiere';
import { TEMPS } from './temps';
import { VIVANT } from './vivant';

export const contenu: ContentModule = {
  ...TEMPS,
  ...ESPACE,
  ...VIVANT,
  ...MATIERE,
  ...EMC,
  ...ANGLAIS,
};
