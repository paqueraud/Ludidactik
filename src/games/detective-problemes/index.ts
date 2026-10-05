import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'detective-problemes',
  numero: 16,
  titre: 'Le Détective des problèmes',
  description: 'Mène l’enquête : comprends l’histoire, fais le schéma en barre, calcule et rédige la réponse.',
  consigne:
    'Bienvenue, détective ! Pour résoudre un problème, on mène l’enquête en quatre étapes. Comprendre : lis bien l’histoire. Modéliser : complète le schéma en barre. Calculer : trouve le bon calcul. Répondre : écris la phrase-réponse. Et un bon détective vérifie toujours si c’est possible !',
  icone: '🕵️',
  couleur: 'from-grape to-sky',
  modalites: ['regarder', 'ecrire', 'manipuler'],
  accepts: ['bar_model'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 300,
  minItems: 1,
  component: lazy(() => import('./Detective')),
};

export default jeu;
