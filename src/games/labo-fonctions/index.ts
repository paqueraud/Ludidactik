import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { versLabo } from '../_langue-commun/fonctions';

const jeu: GameModule = {
  id: 'labo-fonctions',
  numero: 41,
  titre: 'Le Labo des fonctions',
  description:
    'Fais des expériences sur la phrase : supprime, déplace, encadre un groupe… puis trouve sa fonction !',
  consigne:
    'Le groupe en couleur est à analyser. Fais des expériences : supprime-le, déplace-le, encadre-le par « c’est… qui ». Regarde si la phrase reste correcte. Puis verse-le dans la bonne fiole : celle de sa fonction.',
  icone: '🧪',
  couleur: 'from-sciences to-grape',
  modalites: ['manipuler', 'regarder'],
  accepts: ['classification'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 2,
  // Convention GUIDE §6 : meta.phrase + elements = groupes de la phrase, categories = fonctions
  filterItem: (item) => versLabo(item) !== null,
  lessons: (l) => l.matiere === 'francais',
  component: lazy(() => import('./LaboFonctions')),
};

export default jeu;
