import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estMot } from '../_orthographe-commun/lettres';

const jeu: GameModule = {
  id: 'bonhomme-de-neige',
  numero: 32,
  titre: 'Le Bonhomme de neige qui fond',
  description: 'Devine le mot lettre par lettre avant que le soleil ne fasse fondre le bonhomme de neige !',
  consigne:
    'Voici un bonhomme de neige tout content. Devine le mot en touchant des lettres. Chaque lettre qui n’est pas dans le mot le fait fondre un peu. Trouve le mot pour que le soleil se couche et le sauve ! Tu peux entendre le mot pour t’aider.',
  icone: '⛄',
  couleur: 'from-sky to-cream',
  modalites: ['regarder', 'manipuler', 'ecouter'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 4,
  filterItem: (item) => estMot(item) && [...item.word].length >= 3 && [...item.word].length <= 16,
  component: lazy(() => import('./BonhommeDeNeige')),
};

export default jeu;
