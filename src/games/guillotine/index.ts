import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'guillotine',
  numero: 49,
  titre: 'La Guillotine',
  description: 'Réponds juste pour garder la lame en haut… et la tête sur les épaules !',
  consigne:
    'Bienvenue dans la Guillotine ! Chaque bonne réponse retient la lame. Chaque erreur la fait descendre d’un cran. Réponds bien pour être acquitté !',
  icone: '⚖️',
  couleur: 'from-coral to-grape',
  modalites: ['regarder', 'ecouter'],
  accepts: ['mcq'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 4,
  // Les thèmes sensibles (guerres, esclavage, exécutions…) ne sont jamais joués ici.
  filterItem: (item) => item.kind === 'mcq' && item.guillotine,
  // Quiz d'histoire et du temps (catalogue n°49) ; EMC en CE1 (symboles de la République)
  lessons: (l) => ['histoire', 'emc'].includes(l.matiere) || l.id.startsWith('CE1.QLM.TEMPS'),
  signature: true,
  component: lazy(() => import('./Guillotine')),
};

export default jeu;
