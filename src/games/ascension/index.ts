import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

export const ascension: GameModule = {
  id: 'ascension',
  titre: "L'Ascension",
  description: 'Écoute le mot, écris-le sans faute et grimpe jusqu’au sommet de la montagne !',
  consigne:
    "Bienvenue à l'Ascension ! Écoute bien le mot, puis écris-le. Chaque mot juste te fait grimper. Si tu te trompes, tu glisses un peu : courage, tu vas y arriver !",
  icone: '🏔️',
  couleur: 'from-sky to-grape',
  modalites: ['ecouter', 'ecrire'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 4,
  signature: true,
  component: lazy(() => import('./Ascension')),
};
