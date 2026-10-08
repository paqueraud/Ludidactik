/**
 * Module de contenu « monde-ce1 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Questionner le monde (programme 2020, en vigueur au CE1 en 2026-2027), EMC et anglais du CE1.
 * Les banques rédigées sont étiquetées par niveau ; `outils.ts` les transforme en items typés.
 * Les mots-clés à savoir écrire (`mots-cles.ts`) rendent jouables les jeux d'écriture.
 */
import { motsDe, poolMotsCles } from '../../generators/mots-cles';
import type { ContentModule } from '../../registry';
import { ANGLAIS } from './anglais';
import { EMC } from './emc';
import { ESPACE } from './espace';
import { MATIERE } from './matiere';
import { MOTS_CE1 } from './mots-cles';
import { TEMPS } from './temps';
import { VIVANT } from './vivant';

const BASE: ContentModule = {
  ...TEMPS,
  ...ESPACE,
  ...VIVANT,
  ...MATIERE,
  ...EMC,
  ...ANGLAIS,
};

export const contenu: ContentModule = Object.fromEntries(
  Object.entries(BASE).map(([id, c]) => {
    const mots = MOTS_CE1[id];
    return [id, mots ? { ...c, pools: { ...c.pools, spelling_word: poolMotsCles(motsDe(mots)) } } : c];
  }),
);
