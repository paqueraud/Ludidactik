import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { versPuzzle } from '../_langue-commun/phrases';

const jeu: GameModule = {
  id: 'puzzle-phrases',
  numero: 42,
  titre: 'Le Puzzle de phrases',
  description:
    'Remets les étiquettes-mots dans l’ordre et choisis la ponctuation : chaque phrase juste dévoile un morceau du tableau !',
  consigne:
    'Touche les étiquettes dans l’ordre pour construire la phrase. Pour enlever un mot, touche-le dans la phrase. N’oublie pas la ponctuation à la fin, puis vérifie !',
  icone: '🧩',
  couleur: 'from-grape to-sky',
  modalites: ['manipuler', 'regarder'],
  accepts: ['ordering'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 3,
  // Mots d'une phrase (mode « phrase »), étapes d'une procédure (« etapes »), nombres ou mots à ranger
  // (« croissant », « decroissant ») ; pas les frises (Machine à remonter le temps)
  filterItem: (item) => versPuzzle(item) !== null,
  component: lazy(() => import('./PuzzlePhrases')),
};

export default jeu;
