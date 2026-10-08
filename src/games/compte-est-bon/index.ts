import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { sansDessin } from '../_kit/dessin';

const jeu: GameModule = {
  id: 'compte-est-bon',
  numero: 10,
  titre: 'Le Compte est bon',
  description: 'Trouve la cible, puis atteins-la en combinant les nombres tirés avec + − × ÷ !',
  consigne:
    'D’abord, calcule la cible. Ensuite, combine les nombres tirés avec les opérations pour retomber pile sur la cible. Touche un nombre, une opération, puis un autre nombre. Bonus si tu utilises toutes les opérations !',
  icone: '🎯',
  couleur: 'from-grape to-coral',
  modalites: ['ecrire', 'manipuler'],
  accepts: ['numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  lessons: (l) => l.matiere === 'maths',
  // jeu générique : pas d'item qui a besoin d'un dessin (règle, graphique…)
  filterItem: sansDessin,
  component: lazy(() => import('./CompteEstBon')),
};

export default jeu;
