import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'vrai-faux',
  numero: 56,
  titre: 'Le Vrai ou Faux express',
  description: 'Vrai ou faux ? Glisse les cartes le plus vite possible et enchaîne les combos !',
  consigne:
    'Lis la carte. Si c’est vrai, glisse-la vers la droite ; si c’est faux, glisse-la vers la gauche. Tu peux aussi toucher les boutons. Enchaîne les bonnes réponses pour faire grimper le combo !',
  icone: '✅',
  couleur: 'from-grass to-coral',
  modalites: ['regarder', 'manipuler'],
  accepts: ['true_false'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 150,
  minItems: 4,
  // Toutes les matières : les adaptateurs fabriquent des vrai/faux à partir des QCM, calculs et mots.
  component: lazy(() => import('./VraiFaux')),
};

export default jeu;
