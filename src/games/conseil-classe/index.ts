import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estSituation } from './filtre';

const jeu: GameModule = {
  id: 'conseil-classe',
  numero: 54,
  titre: 'Le Conseil de la classe',
  description:
    'Des situations de la vie de la classe : choisis la réponse la plus respectueuse, puis discutons-en ensemble !',
  consigne:
    'Le conseil de la classe commence. Écoute la situation et choisis la réponse la plus respectueuse. Ensuite, on se demande ensemble : pourquoi ? Chaque bonne réponse fait pousser une feuille sur l’arbre de la classe.',
  icone: '🤝',
  couleur: 'from-emc to-sky',
  modalites: ['regarder', 'ecouter'],
  accepts: ['mcq', 'true_false'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 3,
  filterItem: estSituation,
  lessons: (l) => l.matiere === 'emc',
  component: lazy(() => import('./ConseilClasse')),
};

export default jeu;
