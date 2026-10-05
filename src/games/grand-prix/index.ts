import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'grand-prix',
  numero: 1,
  titre: 'Le Grand Prix',
  description: 'Une course de chevaux : plus tu calcules vite et juste, plus ton cheval galope !',
  consigne:
    'Bienvenue au Grand Prix ! Calcule le plus vite possible. Chaque bonne réponse fait avancer ton cheval. Bats les autres chevaux et ton record !',
  icone: '🏇',
  couleur: 'from-sun to-coral',
  modalites: ['ecrire', 'regarder'],
  accepts: ['numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  supportsDuel: true,
  minItems: 1,
  signature: true,
  component: lazy(() => import('./GrandPrix')),
};

export default jeu;
