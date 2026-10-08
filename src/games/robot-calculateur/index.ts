import { lazy } from 'react';
import { parseNumber } from '@/engine/answer';
import type { GameModule } from '@/engine/GameModule';
import { sansDessin } from '../_kit/dessin';

const jeu: GameModule = {
  id: 'robot-calculateur',
  numero: 4,
  titre: 'Le Robot calculateur',
  description: 'Le robot te dit un calcul à l’oral : réponds-lui à voix haute (ou tape ta réponse) !',
  consigne:
    'Écoute bien le robot : il te dit un calcul. Réponds-lui à voix haute avec le bouton micro, ou tape ta réponse. Chaque bonne réponse recharge sa batterie !',
  icone: '🤖',
  couleur: 'from-sky to-grape',
  modalites: ['ecouter', 'parler'],
  // Les calculs deviennent des réponses orales grâce aux adaptateurs ; on garde le numérique en repli.
  accepts: ['oral_answer', 'numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  needsMic: true,
  minItems: 1,
  // Seulement les réponses orales qui sont des nombres (pas la lecture de pseudo-mots ou l'anglais).
  filterItem: (it) =>
    sansDessin(it) &&
    (it.kind === 'numeric_answer' ||
      (it.kind === 'oral_answer' && parseNumber(it.answer) !== null && !it.lang)),
  lessons: (l) => l.matiere === 'maths',
  component: lazy(() => import('./RobotCalculateur')),
};

export default jeu;
