import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estAnglais } from './appels';

const jeu: GameModule = {
  id: 'jacques-a-dit',
  numero: 55,
  titre: 'Jacques a dit (Simon says)',
  description:
    'Écoute Simon parler anglais et touche la bonne image… mais seulement s’il a dit « Simon says » !',
  consigne:
    'Écoute bien Simon : il parle anglais. Quand il dit « Simon says », touche la bonne image. S’il ne dit pas « Simon says », ne bouge pas ! Parfois, ce sera à toi de parler en anglais.',
  icone: '🧢',
  couleur: 'from-anglais to-coral',
  modalites: ['ecouter', 'manipuler', 'parler'],
  accepts: ['pairing', 'mcq', 'oral_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 1,
  filterItem: estAnglais,
  lessons: (l) => l.matiere === 'anglais',
  component: lazy(() => import('./JacquesADit')),
};

export default jeu;
