import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estExperience } from './filtre';

const jeu: GameModule = {
  id: 'laboratoire',
  numero: 53,
  titre: 'Le Laboratoire des sciences',
  description:
    'Range les cartes dans les bons bocaux, remets en ordre les cycles de vie et teste le circuit électrique !',
  consigne:
    'Bienvenue au laboratoire ! Choisis une carte, puis touche le bocal où il doit aller. Pour les étapes d’une expérience ou d’un cycle de vie, touche les cartes dans le bon ordre.',
  icone: '🧪',
  couleur: 'from-sciences to-grass',
  modalites: ['regarder', 'manipuler'],
  accepts: ['classification', 'ordering'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 220,
  minItems: 2,
  filterItem: estExperience,
  lessons: (l) => ['sciences', 'questionner_le_monde'].includes(l.matiere),
  component: lazy(() => import('./Laboratoire')),
};

export default jeu;
