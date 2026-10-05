import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { aUnTexte } from './dossiers';

const jeu: GameModule = {
  id: 'detective-texte',
  numero: 46,
  titre: 'Le Détective du texte',
  description: 'Lis (ou écoute) l’histoire, réponds aux questions… et prouve-le en retrouvant la phrase du texte !',
  consigne:
    'Lis le texte, ou écoute-le avec le haut-parleur. Réponds à chaque question. Un bon détective prouve ce qu’il dit : retrouve dans le texte la phrase qui donne la réponse. La loupe peut t’aider.',
  icone: '🔎',
  couleur: 'from-histoire to-coral',
  modalites: ['regarder', 'ecouter'],
  accepts: ['mcq'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 3,
  // Convention GUIDE §6 : meta.texte (+ meta.titre, meta.preuve). Les autres QCM sont ignorés.
  filterItem: aUnTexte,
  lessons: (l) => l.matiere === 'francais',
  component: lazy(() => import('./DetectiveTexte')),
};

export default jeu;
