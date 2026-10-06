import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estDonnees } from '../_geometrie-commun/graphique';

const jeu: GameModule = {
  id: 'station-meteo',
  numero: 26,
  titre: 'La Station météo',
  description:
    'Lis les tableaux, les diagrammes en barres, les courbes et les diagrammes circulaires de la station… et construis tes propres barres !',
  consigne:
    'Observe bien le graphique de la station météo, puis réponds à la question. Touche une barre ou un point pour faire apparaître le fil de lecture jusqu’à l’axe. Quand il faut construire une barre, tire-la vers le haut ou utilise les flèches.',
  icone: '🌦️',
  couleur: 'from-sky to-sun',
  modalites: ['regarder', 'manipuler'],
  // Les questions à réponse numérique en premier : lecture, écarts, totaux, et barres à construire.
  accepts: ['numeric_answer', 'mcq', 'true_false', 'classification'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 220,
  minItems: 1,
  filterItem: estDonnees,
  lessons: (l) => /\.DON\./.test(l.id) || l.jeuxSuggeres.includes('station-meteo'),
  component: lazy(() => import('./StationMeteo')),
};

export default jeu;
