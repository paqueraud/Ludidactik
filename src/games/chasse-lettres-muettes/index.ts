import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'chasse-lettres-muettes',
  numero: 35,
  titre: 'La Chasse aux lettres muettes',
  description:
    'Une lettre se cache sans faire de bruit à la fin du mot : trouve-la grâce à un mot de sa famille !',
  consigne:
    'Chut… Des lettres muettes se cachent à la fin des mots : on les écrit mais on ne les entend pas ! Pour les trouver, pense à un mot de la même famille : dans chanter, on entend le t, alors on écrit chant avec un t.',
  icone: '🔦',
  couleur: 'from-grape to-ink',
  modalites: ['ecouter', 'regarder'],
  accepts: ['fill_blank', 'mcq'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 210,
  minItems: 4,
  // Convention partagée (GUIDE §6) : meta.famille = mot de la même famille qui fait entendre la lettre
  filterItem: (item) =>
    (item.kind === 'fill_blank' || item.kind === 'mcq') &&
    typeof item.meta?.famille === 'string' &&
    !!item.meta.famille,
  component: lazy(() => import('./ChasseLettresMuettes')),
};

export default jeu;
