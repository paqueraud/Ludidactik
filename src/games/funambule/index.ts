import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'funambule',
  numero: 7,
  titre: 'Le Funambule',
  description:
    'Place le nombre sur le fil : le funambule marche jusque-là… s’il se trompe, plouf dans le filet !',
  consigne:
    'Le funambule doit s’arrêter pile sur le nombre demandé. Touche le fil à l’endroit du nombre, ou déplace le drapeau avec les flèches, puis appuie sur Marche !',
  icone: '🤸',
  couleur: 'from-coral to-sun',
  modalites: ['regarder', 'manipuler'],
  accepts: ['number_line'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 3,
  component: lazy(() => import('./Funambule')),
};

export default jeu;
