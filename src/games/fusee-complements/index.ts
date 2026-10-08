import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { sansDessin } from '../_kit/dessin';

const jeu: GameModule = {
  id: 'fusee-complements',
  numero: 3,
  titre: 'La Fusée des compléments',
  description:
    'Fais le plein du réservoir : chaque bonne réponse ajoute un étage à ta fusée. 3, 2, 1… décollage !',
  consigne:
    'Ta fusée doit faire le plein pour décoller. Trouve combien il manque pour remplir le réservoir. Chaque bonne réponse ajoute un étage. Quand la fusée est terminée, elle décolle vers une nouvelle planète !',
  icone: '🚀',
  couleur: 'from-grape to-sky',
  modalites: ['ecrire', 'regarder'],
  accepts: ['numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 200,
  minItems: 1,
  // Leçons de compléments (et calcul mental qui suggère ce jeu) ; les items `meta.complement` ont leur réservoir gradué.
  lessons: (l) => /COMPLEMENT/.test(l.id) || l.jeuxSuggeres.includes('fusee-complements'),
  // jeu générique : pas d'item qui a besoin d'un dessin (règle, graphique…)
  filterItem: sansDessin,
  component: lazy(() => import('./FuseeComplements')),
};

export default jeu;
