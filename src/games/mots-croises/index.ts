import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estMot, motSimple } from '../_orthographe-commun/lettres';

const jeu: GameModule = {
  id: 'mots-croises',
  numero: 34,
  titre: 'Les Mots croisés',
  description: 'Une grille de mots croisés fabriquée avec les mots de ta liste : remplis-la sans faute !',
  consigne:
    'Voici une grille de mots croisés faite avec les mots de ta liste. Touche une case ou un indice, puis écris le mot. Pour chaque mot, tu as une définition, ou bien tu peux l’écouter, et tu connais son nombre de lettres.',
  icone: '✏️',
  couleur: 'from-sky to-grass',
  modalites: ['regarder', 'ecrire', 'ecouter'],
  accepts: ['spelling_word'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 270,
  minItems: 4,
  filterItem: (item) =>
    estMot(item) && motSimple(item.word) && [...item.word].length >= 2 && [...item.word].length <= 12,
  component: lazy(() => import('./MotsCroises')),
};

export default jeu;
