/**
 * Module de contenu « francais » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Grammaire, vocabulaire, lecture et oral du CE1 (BO n°41 du 31/10/2024) et du CM2 (BO n°16 du 17/04/2025).
 * La conjugaison, les accords et les homophones relèvent d'un autre module.
 * Les mots de la grammaire à savoir écrire (`mots-grammaire.ts`) rendent jouables les jeux d'écriture.
 */
import { motsDe, poolMotsCles } from '../../generators/mots-cles';
import type { ContentModule } from '../../registry';
import { CULTURE_CE1 } from './culture-ce1';
import { GRAMMAIRE_CE1 } from './grammaire-ce1';
import { GRAMMAIRE_CM2 } from './grammaire-cm2';
import { LECTURE_CE1 } from './lecture-ce1';
import { LECTURE_CM2 } from './lecture-cm2';
import { MOTS_GRAMMAIRE_CM2 } from './mots-grammaire';
import { ORAL_CE1 } from './oral-ce1';
import { ORAL_CM2 } from './oral-cm2';
import { ORTHOGRAPHE } from './orthographe';
import { VOCABULAIRE_CE1 } from './vocabulaire-ce1';
import { VOCABULAIRE_CM2 } from './vocabulaire-cm2';

const BASE: ContentModule = {
  ...LECTURE_CE1,
  ...CULTURE_CE1,
  ...GRAMMAIRE_CE1,
  ...VOCABULAIRE_CE1,
  ...ORAL_CE1,
  ...ORTHOGRAPHE,
  ...GRAMMAIRE_CM2,
  ...VOCABULAIRE_CM2,
  ...LECTURE_CM2,
  ...ORAL_CM2,
};

export const contenu: ContentModule = Object.fromEntries(
  Object.entries(BASE).map(([id, c]) => {
    const mots = MOTS_GRAMMAIRE_CM2[id];
    return [id, mots ? { ...c, pools: { ...c.pools, spelling_word: poolMotsCles(motsDe(mots)) } } : c];
  }),
);
