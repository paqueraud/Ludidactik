import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estProba } from './logique';

const jeu: GameModule = {
  id: 'roue-probabilites',
  numero: 27,
  titre: 'La Roue des probabilités',
  description:
    'Lance les dés, tire les cartes, fais tourner la roue… puis range chaque évènement : impossible, peu probable, probable ou certain ?',
  consigne:
    'Lis l’expérience. Tu peux la tester autant que tu veux avec le bouton « Tester ». Puis range chaque évènement sur l’échelle des probabilités, ou choisis la bonne réponse.',
  icone: '🎡',
  couleur: 'from-grape to-coral',
  modalites: ['regarder', 'manipuler'],
  accepts: ['classification', 'mcq'],
  classes: ['CM1', 'CM2'],
  dureeCible: 200,
  minItems: 1,
  filterItem: estProba,
  lessons: (l) => /\.PROBA\b/.test(l.id),
  component: lazy(() => import('./RoueProbabilites')),
};

export default jeu;
