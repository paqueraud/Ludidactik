import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { fractionJouable } from '../_calcul-commun/fractions';

const jeu: GameModule = {
  id: 'chocolatier',
  numero: 14,
  titre: 'Le Chocolatier',
  description: 'Prépare les commandes de chocolat : des fractions de tablette à emballer, lire et comparer.',
  consigne:
    'Bienvenue à la chocolaterie ! Une tablette est partagée en carrés égaux. Le dénominateur dit combien il y a de carrés dans la tablette, le numérateur combien on en prend. Choisis le bon moule, emballe les carrés demandés, et compare les bandes de chocolat !',
  icone: '🍫',
  couleur: 'from-coral to-grape',
  modalites: ['regarder', 'manipuler'],
  accepts: ['visual_fraction'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: (item) => item.kind === 'visual_fraction' && fractionJouable(item, 60),
  component: lazy(() => import('./Chocolatier')),
};

export default jeu;
