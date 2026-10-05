import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'train-accords',
  numero: 37,
  titre: 'Le Train des accords',
  description:
    'Accroche le bon wagon pour que tous les mots du groupe soient bien accordés : le train peut partir !',
  consigne:
    'Tchou tchou ! Dans un groupe de mots, tous les mots se mettent d’accord : tous au singulier ou tous au pluriel, tous au masculin ou tous au féminin. C’est le nom qui commande, comme la locomotive ! Choisis le wagon qui porte le mot bien accordé. Si c’est le bon, le train démarre !',
  icone: '🚂',
  couleur: 'from-coral to-sun',
  modalites: ['manipuler', 'regarder', 'ecrire'],
  accepts: ['fill_blank'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 210,
  minItems: 4,
  // Convention partagée (GUIDE §6) : accords = choix (formes accordées) + meta.groupe (mots du groupe)
  filterItem: (item) =>
    item.kind === 'fill_blank' &&
    !!item.choices &&
    item.choices.length >= 2 &&
    item.meta?.groupe !== undefined,
  component: lazy(() => import('./TrainAccords')),
};

export default jeu;
