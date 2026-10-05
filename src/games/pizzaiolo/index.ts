import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { fractionJouable } from '../_calcul-commun/fractions';

const jeu: GameModule = {
  id: 'pizzaiolo',
  numero: 13,
  titre: 'Le Pizzaïolo des fractions',
  description: 'Les clients commandent des fractions de pizza : coupe en parts égales, garnis, sers !',
  consigne:
    'Bienvenue à la pizzeria ! Lis la commande du client. Le dénominateur dit en combien de parts égales on coupe la pizza. Le numérateur dit combien de parts on garnit. Touche les parts pour les garnir, puis sers la pizza !',
  icone: '🍕',
  couleur: 'from-coral to-sun',
  modalites: ['regarder', 'manipuler'],
  accepts: ['visual_fraction'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: (item) => item.kind === 'visual_fraction' && fractionJouable(item, 12),
  component: lazy(() => import('./Pizzaiolo')),
};

export default jeu;
