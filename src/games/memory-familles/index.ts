import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { sansDessin } from '../_kit/dessin';

const jeu: GameModule = {
  id: 'memory-familles',
  numero: 48,
  titre: 'Memory des familles & affixes',
  description:
    'Retourne les cartes deux par deux et retrouve les paires : mot et mot de sa famille, préfixe et sens…',
  consigne:
    'Retourne deux cartes. Si elles vont ensemble, elles restent visibles. Sinon, mémorise-les : elles se retournent. Retrouve toutes les paires en le moins de coups possible !',
  icone: '🃏',
  couleur: 'from-grape to-sun',
  modalites: ['regarder', 'manipuler'],
  accepts: ['pairing'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: (item) => item.kind === 'pairing' && item.pairs.length >= 3 && sansDessin(item),
  component: lazy(() => import('./MemoryFamilles')),
};

export default jeu;
