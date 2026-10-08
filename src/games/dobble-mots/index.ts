import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { pasSensible } from '../_kit/sensible';

const jeu: GameModule = {
  id: 'dobble-mots',
  numero: 47,
  titre: 'Le Dobble des mots',
  description:
    'Deux cartes rondes, plein de mots… un seul couple va ensemble ! Trouve-le le plus vite possible.',
  consigne:
    'Regarde les deux cartes rondes. Un mot de la première carte va avec un mot de la deuxième : contraires, synonymes, même famille… Touche ces deux mots le plus vite possible !',
  icone: '🔵',
  couleur: 'from-sky to-grape',
  modalites: ['regarder', 'manipuler'],
  accepts: ['pairing'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 1,
  // Des paires de mots courts (pas les longues questions/réponses)
  // jeu de réflexes (sablier) : jamais de thème sensible
  filterItem: (item) =>
    pasSensible(item) &&
    item.kind === 'pairing' &&
    item.pairs.length >= 3 &&
    item.pairs.every((p) => p.left.length <= 24 && p.right.length <= 24),
  component: lazy(() => import('./DobbleMots')),
};

export default jeu;
