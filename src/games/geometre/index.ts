import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estPourGeometre } from './logique';

const jeu: GameModule = {
  id: 'geometre',
  numero: 21,
  titre: 'Le Géomètre',
  description:
    'Reconnais les figures avec ton équerre et ta règle virtuelles, place des points, reproduis des figures et trace au compas !',
  consigne:
    'Lis le défi du géomètre. Pour reconnaître une figure, tu peux poser l’équerre sur un sommet ou mesurer un côté avec la règle. Pour tracer, touche les nœuds du quadrillage ou règle tes instruments.',
  icone: '📐',
  couleur: 'from-maths to-grape',
  modalites: ['regarder', 'manipuler'],
  accepts: ['geometry_shape', 'classification'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: estPourGeometre,
  lessons: (l) => /\.GEO\.(FIGURES|TRACER|VOCAB|CONSTRUIRE)/.test(l.id),
  component: lazy(() => import('./Geometre')),
};

export default jeu;
