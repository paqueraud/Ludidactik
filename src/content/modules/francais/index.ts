/**
 * Module de contenu « francais » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Grammaire, vocabulaire, lecture et oral du CE1 (BO n°41 du 31/10/2024) et du CM2 (BO n°16 du 17/04/2025).
 * La conjugaison, les accords et les homophones relèvent d'un autre module.
 */
import type { ContentModule } from '../../registry';
import { GRAMMAIRE_CE1 } from './grammaire-ce1';
import { GRAMMAIRE_CM2 } from './grammaire-cm2';
import { LECTURE_CE1 } from './lecture-ce1';
import { LECTURE_CM2 } from './lecture-cm2';
import { ORAL_CE1 } from './oral-ce1';
import { ORTHOGRAPHE } from './orthographe';
import { VOCABULAIRE_CE1 } from './vocabulaire-ce1';
import { VOCABULAIRE_CM2 } from './vocabulaire-cm2';

export const contenu: ContentModule = {
  ...LECTURE_CE1,
  ...GRAMMAIRE_CE1,
  ...VOCABULAIRE_CE1,
  ...ORAL_CE1,
  ...ORTHOGRAPHE,
  ...GRAMMAIRE_CM2,
  ...VOCABULAIRE_CM2,
  ...LECTURE_CM2,
};
