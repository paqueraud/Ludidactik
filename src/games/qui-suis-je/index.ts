import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estDevinette } from './filtre';

const jeu: GameModule = {
  id: 'qui-suis-je',
  numero: 52,
  titre: 'Qui suis-je ?',
  description:
    'Un personnage mystère se dévoile indice après indice : trouve-le avec le moins d’indices possible !',
  consigne:
    'Lis le premier indice. Tu peux répondre tout de suite ou demander un autre indice. Attention : plus tu prends d’indices, moins tu gagnes de points !',
  icone: '🕵️',
  couleur: 'from-sun to-coral',
  modalites: ['ecouter', 'regarder'],
  accepts: ['mcq'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 4,
  filterItem: estDevinette,
  // Personnages historiques, animaux, monuments, symboles : histoire-géo, sciences, QLM, EMC.
  // Français : leçons dont les QCM portent des indices (personnages mystères de la culture littéraire).
  lessons: (l) =>
    ['histoire', 'geographie', 'sciences', 'questionner_le_monde', 'emc', 'francais'].includes(l.matiere),
  component: lazy(() => import('./QuiSuisJe')),
};

export default jeu;
