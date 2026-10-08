import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { pasSensible } from '../_kit/sensible';

const jeu: GameModule = {
  id: 'attrape-bulles',
  numero: 57,
  titre: 'L’Attrape-Bulles',
  description: 'Des bulles portent les réponses : touche la bonne avant qu’elle ne s’envole !',
  consigne:
    'Lis la question. Des bulles montent avec des réponses. Touche la bonne bulle avant qu’elle ne s’échappe ! Enchaîne les bonnes réponses pour gagner des combos.',
  icone: '🫧',
  couleur: 'from-sky to-grape',
  modalites: ['regarder', 'manipuler'],
  accepts: ['mcq', 'numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 4,
  // Questions à choix courts : les textes très longs (compréhension de texte) ne tiennent pas dans une bulle.
  // jeu de rapidité : jamais de thème sensible (guerres, esclavage…)
  filterItem: (it) =>
    pasSensible(it) &&
    (it.kind === 'numeric_answer' ||
      (it.kind === 'mcq' && !it.meta?.texte && it.choices.every((c) => c.length <= 40))),
  component: lazy(() => import('./AttrapeBulles')),
};

export default jeu;
