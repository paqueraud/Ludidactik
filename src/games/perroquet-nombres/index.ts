import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'perroquet-nombres',
  numero: 5,
  titre: 'Le Perroquet des nombres',
  description:
    'Le perroquet dit un nombre : écris-le en chiffres ! Et parfois, retrouve comment il s’écrit en lettres.',
  consigne:
    'Écoute bien le perroquet : il te dit un nombre. Écris-le en chiffres. Tu peux lui demander de répéter. Parfois, il te montre un nombre et tu dois trouver comment il s’écrit en lettres.',
  icone: '🦜',
  couleur: 'from-grass to-coral',
  modalites: ['ecouter', 'ecrire'],
  accepts: ['numeric_answer', 'fill_blank', 'mcq'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 1,
  filterItem: (it) =>
    (it.kind === 'numeric_answer' &&
      (it.meta?.dictee === true || /\.NUM\.(ECRIRE|GRANDS)/.test(it.lessonId))) ||
    ((it.kind === 'fill_blank' || it.kind === 'mcq') && it.meta?.lettres === true),
  lessons: (l) => /\.NUM\.(ECRIRE|GRANDS)/.test(l.id) || l.jeuxSuggeres.includes('perroquet-nombres'),
  component: lazy(() => import('./Perroquet')),
};

export default jeu;
