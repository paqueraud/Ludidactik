import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estMot, motSimple } from '../_orthographe-commun/lettres';

const jeu: GameModule = {
  id: 'wordle-mots',
  numero: 33,
  titre: 'Le Wordle des mots de la semaine',
  description: 'Retrouve le mot de la liste en 6 essais grâce aux couleurs : vert, jaune ou gris !',
  consigne:
    'Un mot de ta liste se cache. Écris un mot qui a le bon nombre de lettres. Une case verte : la lettre est à la bonne place. Jaune : la lettre est dans le mot, mais ailleurs. Grise : elle n’y est pas. Tu as 6 essais !',
  icone: '🟩',
  couleur: 'from-grass to-sun',
  modalites: ['regarder', 'ecrire'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 3,
  // Mots de la liste faits uniquement de lettres, de 3 à 10 lettres
  filterItem: (item) =>
    estMot(item) && motSimple(item.word) && [...item.word].length >= 3 && [...item.word].length <= 10,
  component: lazy(() => import('./Wordle')),
};

export default jeu;
