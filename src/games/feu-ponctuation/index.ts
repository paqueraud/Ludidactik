import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { versFeu } from '../_langue-commun/phrases';

const jeu: GameModule = {
  id: 'feu-ponctuation',
  numero: 43,
  titre: 'Le Feu tricolore de la ponctuation',
  description: 'Écoute la phrase : la voix descend, monte ou s’exclame ? Allume le bon feu : point, point d’interrogation ou point d’exclamation !',
  consigne:
    'Écoute bien la phrase. Si la voix descend, on met un point. Si elle monte pour poser une question, un point d’interrogation. Si elle s’exclame, un point d’exclamation. Touche le bon feu pour faire passer la voiture !',
  icone: '🚦',
  couleur: 'from-coral to-sun',
  modalites: ['ecouter', 'regarder'],
  accepts: ['mcq'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 4,
  // Convention GUIDE §6 : choix . ? ! et meta.phrase (ou phrase entre guillemets dans la question)
  filterItem: (item) => versFeu(item) !== null,
  lessons: (l) => l.matiere === 'francais',
  component: lazy(() => import('./FeuPonctuation')),
};

export default jeu;
