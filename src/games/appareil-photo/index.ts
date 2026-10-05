import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'appareil-photo',
  numero: 30,
  titre: 'L’Appareil photo',
  description: 'Clic ! Le mot apparaît quelques secondes : photographie-le dans ta tête, puis écris-le.',
  consigne:
    'Bienvenue au studio photo ! Appuie sur le déclencheur : le mot s’affiche quelques secondes. Regarde-le bien, photographie-le dans ta tête, puis écris-le quand il disparaît.',
  icone: '📸',
  couleur: 'from-grape to-sky',
  modalites: ['regarder', 'ecrire'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 210,
  minItems: 4,
  component: lazy(() => import('./AppareilPhoto')),
};

export default jeu;
