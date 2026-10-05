import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'karaoke-lecture',
  numero: 44,
  titre: 'Le Karaoké de lecture',
  description: 'Lis le texte à voix haute pendant que les mots s’illuminent : combien de mots lis-tu en une minute ?',
  consigne:
    'Lis le texte à voix haute, bien fort et en respectant les points. Avec le micro, les mots s’allument quand tu les lis. Sans micro, suis le métronome : lis chaque mot quand il s’allume. À la fin, tu découvres ton nombre de mots lus par minute !',
  icone: '🎤',
  couleur: 'from-coral to-grape',
  modalites: ['parler', 'regarder'],
  accepts: ['read_aloud'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  needsMic: true,
  minItems: 1,
  component: lazy(() => import('./Karaoke')),
};

export default jeu;
