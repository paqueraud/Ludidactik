import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estRobot } from '../_geometrie-commun/robot';

const jeu: GameModule = {
  id: 'robot-codeur',
  numero: 25,
  titre: 'Le Robot codeur',
  description:
    'Écris le programme du robot avec des flèches ou des instructions, puis lance-le : atteindra-t-il le trésor sans heurter les rochers ?',
  consigne:
    'Construis le programme du robot en touchant les instructions, dans l’ordre. Quand ton programme est prêt, touche « Lancer » : le robot l’exécute pas à pas. Il doit s’arrêter sur le trésor sans toucher les rochers.',
  icone: '🤖',
  couleur: 'from-sky to-grass',
  modalites: ['manipuler', 'regarder'],
  accepts: ['geometry_shape'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: estRobot,
  component: lazy(() => import('./RobotCodeur')),
};

export default jeu;
