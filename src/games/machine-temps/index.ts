import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estFrise } from '../_monde-commun/outils';

const jeu: GameModule = {
  id: 'machine-temps',
  numero: 50,
  titre: 'La Machine à remonter le temps',
  description: 'Range les cartes sur la frise : si l’ordre est juste, la machine voyage dans le temps !',
  consigne:
    'Touche les cartes dans le bon ordre (pour une frise : de la plus ancienne à la plus récente) : elles se posent sur la frise. Quand toutes les cases sont pleines, lance la machine. Si l’ordre est juste, elle voyage et les dates apparaissent !',
  icone: '🕰️',
  couleur: 'from-histoire to-grape',
  modalites: ['regarder', 'manipuler'],
  accepts: ['ordering'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 2,
  // Frises (mode chrono) et suites d'étapes ; pas les nombres à ranger ni les mots d'une phrase.
  filterItem: estFrise,
  component: lazy(() => import('./MachineTemps')),
};

export default jeu;
