import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'dictee-duel',
  numero: 38,
  titre: 'La Dictée-duel',
  description:
    'À deux sur le même écran : le même mot est dicté, le premier qui l’écrit sans faute marque le point !',
  consigne:
    'Dictée-duel ! Installez-vous face à face. Chaque joueur a son clavier. Écoutez bien le mot, écrivez-le, puis appuyez sur OK. Le premier qui l’écrit sans faute marque le point. Tu n’as que quelques essais : relis-toi bien avant d’appuyer sur OK !',
  icone: '✍️',
  couleur: 'from-sky to-coral',
  modalites: ['ecouter', 'ecrire'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 4,
  supportsDuel: true,
  // Mots (pas de phrases entières) : une dictée de phrase serait trop longue en duel
  filterItem: (item) => item.kind === 'spelling_word' && !item.isSentence,
  component: lazy(() => import('./DicteeDuel')),
};

export default jeu;
