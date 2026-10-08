import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { sansDessin } from '../_kit/dessin';

const jeu: GameModule = {
  id: 'tables-ninja',
  numero: 2,
  titre: 'Tables Ninja',
  description: 'Des fruits volent avec des nombres : tranche le bon résultat, évite les fruits piégés !',
  consigne:
    'Lis le calcul en haut. Des fruits volent avec des nombres : tranche celui qui porte le bon résultat en glissant ton doigt, ou touche-le. Attention aux fruits piégés ! Enchaîne pour faire des combos.',
  icone: '🥷',
  couleur: 'from-grass to-sun',
  modalites: ['regarder', 'manipuler'],
  accepts: ['numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 1,
  lessons: (l) => l.matiere === 'maths',
  // jeu générique : pas d'item qui a besoin d'un dessin (règle, graphique…)
  filterItem: sansDessin,
  component: lazy(() => import('./TablesNinja')),
};

export default jeu;
