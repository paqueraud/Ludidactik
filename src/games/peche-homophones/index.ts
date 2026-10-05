import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'peche-homophones',
  numero: 36,
  titre: 'La Pêche aux homophones',
  description:
    '« a » ou « à » ? « et » ou « est » ? Pêche le poisson qui porte le bon mot pour compléter la phrase !',
  consigne:
    'Lis la phrase : il manque un petit mot. Tous les poissons portent des mots qui se prononcent de la même façon. Pêche le bon ! Pour t’aider, utilise l’astuce : remplace le mot par un autre pour vérifier.',
  icone: '🎣',
  couleur: 'from-sky to-grass',
  modalites: ['regarder', 'manipuler'],
  accepts: ['fill_blank'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 4,
  // Convention partagée (GUIDE §6) : homophones = choix + astuce de substitution
  filterItem: (item) =>
    item.kind === 'fill_blank' &&
    !!item.choices &&
    item.choices.length >= 2 &&
    !!item.hint &&
    !item.conjugaison &&
    item.meta?.groupe === undefined &&
    item.meta?.famille === undefined,
  component: lazy(() => import('./PecheHomophones')),
};

export default jeu;
