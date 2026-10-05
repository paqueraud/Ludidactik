import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { itemMachine } from '../_calcul-commun/programme';

const jeu: GameModule = {
  id: 'machine-programmes',
  numero: 18,
  titre: 'La Machine à programmes de calcul',
  description:
    'Fais tourner les engrenages : exécute un programme de calcul, remonte-le, prolonge des suites de motifs.',
  consigne:
    'Voici la machine à calculer ! Un nombre entre en haut et chaque engrenage le transforme. Calcule ce qui sort en bas. Parfois on connaît seulement la sortie : remonte alors la machine en faisant les opérations inverses. Avec les motifs, trouve la règle qui fait grandir la suite !',
  icone: '⚙️',
  couleur: 'from-sky to-grape',
  modalites: ['ecrire', 'regarder'],
  accepts: ['numeric_answer'],
  classes: ['CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  // Conventions partagées (GUIDE §6) : meta.programme ou meta.suite
  filterItem: itemMachine,
  component: lazy(() => import('./Machine')),
};

export default jeu;
