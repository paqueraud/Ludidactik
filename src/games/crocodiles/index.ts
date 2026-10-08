import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { pasSensible } from '../_kit/sensible';
import { sansDessin } from '../_kit/dessin';

const SYMBOLES = ['<', '=', '>'];

const jeu: GameModule = {
  id: 'crocodiles',
  numero: 9,
  titre: 'Les Crocodiles gloutons',
  description: 'Le crocodile ouvre toujours la gueule vers le plus grand : tourne-le du bon côté !',
  consigne:
    'Le crocodile est très gourmand : il ouvre toujours sa gueule vers le plus grand nombre. Touche le nombre qu’il doit croquer, ou le signe égal si les deux sont pareils.',
  icone: '🐊',
  couleur: 'from-grass to-sky',
  modalites: ['regarder', 'manipuler'],
  // Comparaisons (QCM « < = > » avec meta.gauche / meta.droite) ; repli : comparer un calcul et un nombre.
  accepts: ['mcq', 'numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 150,
  minItems: 4,
  filterItem: (it) =>
    pasSensible(it) &&
    sansDessin(it) &&
    (it.kind === 'numeric_answer' ||
      (it.kind === 'mcq' &&
        typeof it.meta?.gauche === 'string' &&
        typeof it.meta?.droite === 'string' &&
        it.choices.every((c) => SYMBOLES.includes(c)))),
  lessons: (l) => /COMPARER/.test(l.id) || l.jeuxSuggeres.includes('crocodiles'),
  component: lazy(() => import('./Crocodiles')),
};

export default jeu;
