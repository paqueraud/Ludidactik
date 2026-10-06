import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estPourUsine } from './logique';

const jeu: GameModule = {
  id: 'usine-patrons',
  numero: 24,
  titre: 'L’Usine à patrons',
  description:
    'Fais tourner les solides pour compter leurs faces, arêtes et sommets, et plie les patrons : lequel fabrique un cube ?',
  consigne:
    'Bienvenue à l’usine ! Fais tourner le solide en le faisant glisser ou avec les flèches. Pour un patron, imagine le pliage : forme-t-il un cube ou un pavé ? Tu verras la machine le plier.',
  icone: '🏭',
  couleur: 'from-sun to-coral',
  modalites: ['regarder', 'manipuler'],
  accepts: ['geometry_shape'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 220,
  minItems: 1,
  filterItem: estPourUsine,
  lessons: (l) => /\.GEO\.SOLIDES/.test(l.id) || l.jeuxSuggeres.includes('usine-patrons'),
  component: lazy(() => import('./UsinePatrons')),
};

export default jeu;
