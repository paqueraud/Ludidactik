import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { itemMonnaieValide } from '../_calcul-commun/monnaie';

const jeu: GameModule = {
  id: 'epicerie',
  numero: 11,
  titre: 'La Petite Épicerie',
  description:
    'Tiens la caisse ! Paie avec les bonnes pièces et les bons billets, et rends la monnaie aux clients.',
  consigne:
    'Bienvenue dans ton épicerie ! Glisse les pièces et les billets de la caisse sur le comptoir, ou touche-les. Pour payer, réunis exactement le prix. Pour rendre la monnaie, compte ce qu’il faut rendre au client. Touche une pièce du comptoir pour la reprendre. Puis valide !',
  icone: '🛒',
  couleur: 'from-sun to-grass',
  modalites: ['manipuler', 'regarder'],
  accepts: ['money'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: (item) => item.kind === 'money' && itemMonnaieValide(item),
  component: lazy(() => import('./Epicerie')),
};

export default jeu;
