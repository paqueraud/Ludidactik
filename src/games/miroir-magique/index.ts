import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estSymetrie } from '../_geometrie-commun/grille';

const jeu: GameModule = {
  id: 'miroir-magique',
  numero: 22,
  titre: 'Le Miroir magique',
  description:
    'Colorie les cases symétriques de l’autre côté du miroir : si le dessin est juste, le papillon s’envole !',
  consigne:
    'Le miroir magique est l’axe de symétrie. Colorie les cases qui sont le reflet des cases coloriées : même distance du miroir, de l’autre côté. Touche les cases, ou déplace-toi avec les flèches et appuie sur Entrée. Puis touche « Vérifier ».',
  icone: '🦋',
  couleur: 'from-grape to-sky',
  modalites: ['manipuler', 'regarder'],
  accepts: ['geometry_shape'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 1,
  filterItem: estSymetrie,
  lessons: (l) => /\.GEO\.SYMETRIE/.test(l.id) || l.jeuxSuggeres.includes('miroir-magique'),
  component: lazy(() => import('./MiroirMagique')),
};

export default jeu;
