import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estMot } from '../_orthographe-commun/lettres';

const jeu: GameModule = {
  id: 'lettres-en-vrac',
  numero: 31,
  titre: 'Les Lettres en vrac',
  description: 'Les lettres du mot sont tombées en désordre : remets-les dans le bon ordre !',
  consigne:
    'Oh ! Les lettres du mot sont tombées en vrac. Touche-les dans le bon ordre pour reconstruire le mot. Tu peux aussi les taper au clavier. Attention : au niveau Plus loin, des lettres intruses se sont glissées dans le tas !',
  icone: '🔤',
  couleur: 'from-sun to-coral',
  modalites: ['regarder', 'manipuler'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 4,
  // Un mot (pas une phrase), de 2 à 14 lettres
  filterItem: (item) => estMot(item) && [...item.word].length >= 2 && [...item.word].length <= 14,
  component: lazy(() => import('./LettresEnVrac')),
};

export default jeu;
