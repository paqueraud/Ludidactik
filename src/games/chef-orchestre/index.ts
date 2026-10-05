import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { pourChef } from './filtre';

const jeu: GameModule = {
  id: 'chef-orchestre',
  numero: 40,
  titre: 'Le Chef d’orchestre des classes de mots',
  description: 'Les mots-notes tombent du ciel : range chacun sur le bon pupitre pour que l’orchestre joue juste !',
  consigne:
    'Chaque note porte un mot. Avant qu’elle touche le sol, envoie-la sur le bon pupitre : touche le pupitre, ou fais glisser la note dessus. Quand tout est bien rangé, l’orchestre joue !',
  icone: '🎼',
  couleur: 'from-grape to-coral',
  modalites: ['regarder', 'manipuler'],
  accepts: ['classification'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 1,
  filterItem: pourChef,
  lessons: (l) => l.matiere === 'francais',
  component: lazy(() => import('./ChefOrchestre')),
};

export default jeu;
