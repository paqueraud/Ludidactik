import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'diviseurs-mysteres',
  numero: 19,
  titre: 'Les Diviseurs mystères',
  description: 'Chasse aux œufs : range chaque nombre dans le bon panier (divisible par 2, 5, 10, diviseurs, multiples).',
  consigne:
    'C’est la chasse aux œufs ! Chaque œuf porte un nombre. Range-le dans le bon panier : fais-le glisser, ou touche l’œuf puis le panier. Pense aux règles : un nombre divisible par 2 se termine par 0, 2, 4, 6 ou 8 ; par 5, il se termine par 0 ou 5 ; par 10, il se termine par 0.',
  icone: '🥚',
  couleur: 'from-grass to-sun',
  modalites: ['regarder', 'manipuler'],
  accepts: ['classification'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  // Des nombres à ranger (pas des mots)
  filterItem: (item) => item.kind === 'classification' && item.elements.every((e) => /^\d[\d  ]*$/.test(e.label.trim())),
  // Leçons de divisibilité, multiples, diviseurs, parité
  lessons: (l) => /DIVISIB|DIVISEUR|MULTIPLE|PARITE/.test(l.id),
  component: lazy(() => import('./Diviseurs')),
};

export default jeu;
