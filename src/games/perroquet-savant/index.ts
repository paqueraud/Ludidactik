import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { versLecture } from './lecture';

const jeu: GameModule = {
  id: 'perroquet-savant',
  numero: 45,
  titre: 'Le Perroquet savant',
  description:
    'Lis à voix haute syllabes, mots et mots inventés, ou réponds à voix haute aux questions : si le perroquet a compris, il répète !',
  consigne:
    'Lis à voix haute ce qui est écrit sur la carte, ou dis la bonne réponse à la question. Si le micro est allumé, parle au perroquet : s’il a compris, il répète ! Sans micro, parle, touche « Je l’ai dit ! », écoute le perroquet et dis honnêtement si tu avais dit pareil.',
  icone: '🦜',
  couleur: 'from-grass to-sky',
  modalites: ['parler', 'regarder'],
  accepts: ['oral_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  needsMic: true,
  minItems: 4,
  filterItem: (item) => versLecture(item) !== null,
  // français : lecture (contenu natif) ; monde, EMC, histoire, géographie, sciences : questions à
  // réponse courte dérivées des QCM (src/content/adapters.ts, mcqToOral)
  lessons: (l) => l.matiere !== 'maths' && l.matiere !== 'anglais',
  component: lazy(() => import('./PerroquetSavant')),
};

export default jeu;
