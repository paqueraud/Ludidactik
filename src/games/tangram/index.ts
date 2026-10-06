import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estPourTangram } from './pieces';

const jeu: GameModule = {
  id: 'tangram',
  numero: 23,
  titre: 'Tangram & Formes',
  description:
    'Reconstruis la silhouette avec les pièces en les tournant et en les retournant… puis reconnais la figure que tu as construite !',
  consigne:
    'Choisis une pièce dans ta boîte, tourne-la ou retourne-la si besoin, puis touche l’endroit du plateau où elle va. Quand la silhouette est remplie, réponds à la question sur la figure.',
  icone: '🧩',
  couleur: 'from-grape to-sun',
  modalites: ['manipuler', 'regarder'],
  accepts: ['geometry_shape'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: estPourTangram,
  lessons: (l) => /\.GEO\.FIGURES/.test(l.id),
  component: lazy(() => import('./Tangram')),
};

export default jeu;
