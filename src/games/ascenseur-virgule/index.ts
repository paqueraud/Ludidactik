import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { lireGlisse } from '../_calcul-commun/glisse';

const jeu: GameModule = {
  id: 'ascenseur-virgule',
  numero: 15,
  titre: 'L’Ascenseur de la virgule',
  description: '× 10, × 100, ÷ 1 000 : fais monter et descendre les chiffres dans l’immeuble des nombres !',
  consigne:
    'Voici l’immeuble des nombres : chaque tour est un rang, et la virgule ne bouge jamais. Quand on multiplie par 10, chaque chiffre monte d’un rang vers la gauche. Quand on divise par 10, il descend d’un rang vers la droite. Fais glisser les chiffres, puis écris le nombre obtenu sans oublier les zéros !',
  icone: '🛗',
  couleur: 'from-sky to-grass',
  modalites: ['manipuler', 'regarder', 'ecrire'],
  accepts: ['numeric_answer'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 1,
  // Convention partagée (GUIDE §6) : meta.glisse = { nombre, operation, facteur }
  filterItem: (item) => lireGlisse(item) !== null,
  lessons: (l) => /X10|GLISSE/.test(l.id),
  component: lazy(() => import('./Ascenseur')),
};

export default jeu;
