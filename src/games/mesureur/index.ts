import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { LECONS_MESUREUR, estPourMesureur } from './logique';

const jeu: GameModule = {
  id: 'mesureur',
  numero: 28,
  titre: 'Le Mesureur',
  description:
    'Mesure avec la règle, lis la balance, compte les carreaux d’une aire, fais le tour d’une figure, estime et convertis !',
  consigne:
    'Observe l’atelier de mesure. Tu peux faire glisser la règle, toucher les masses ou les carreaux pour les compter, ou envoyer la fourmi faire le tour de la figure. Puis écris ta réponse.',
  icone: '📏',
  couleur: 'from-sun to-grass',
  modalites: ['manipuler', 'regarder'],
  // Mesures, aires, périmètres, conversions ; puis angles à classer ; puis estimations.
  accepts: ['numeric_answer', 'classification', 'mcq'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 220,
  minItems: 1,
  filterItem: estPourMesureur,
  lessons: (l) => LECONS_MESUREUR.test(l.id),
  component: lazy(() => import('./Mesureur')),
};

export default jeu;
