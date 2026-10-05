import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

export const guillotine: GameModule = {
  id: 'guillotine',
  titre: 'La Guillotine',
  description: 'Réponds juste pour garder la lame en haut… et la tête sur les épaules !',
  consigne:
    'Bienvenue dans la Guillotine ! Chaque bonne réponse retient la lame. Chaque erreur la fait descendre d’un cran. Réponds bien pour être acquitté !',
  icone: '⚖️',
  couleur: 'from-coral to-grape',
  modalites: ['regarder', 'ecouter'],
  accepts: ['mcq'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 4,
  // Les thèmes sensibles (guerres, esclavage, exécutions…) ne sont jamais joués ici.
  filterItem: (item) => item.kind === 'mcq' && item.guillotine,
  signature: true,
  component: lazy(() => import('./Guillotine')),
};
