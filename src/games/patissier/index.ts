import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { lireTableau } from '../_calcul-commun/tableau';

const jeu: GameModule = {
  id: 'patissier',
  numero: 17,
  titre: 'Le Pâtissier proportionnel',
  description: 'Adapte les recettes au nombre d’invités et décore un gâteau géant !',
  consigne:
    'Bienvenue dans la pâtisserie ! La recette est écrite dans un tableau. S’il y a deux fois plus d’invités, il faut deux fois plus de chaque ingrédient. Tu peux aussi ajouter deux lignes du tableau, ou chercher d’abord la quantité pour une seule personne. Trouve le nombre qui manque !',
  icone: '🎂',
  couleur: 'from-coral to-grape',
  modalites: ['regarder', 'ecrire'],
  accepts: ['numeric_answer'],
  classes: ['CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  // Convention partagée (GUIDE §6) : meta.tableau = { entetes, lignes } avec une case vide
  filterItem: (item) => lireTableau(item) !== null,
  component: lazy(() => import('./Patissier')),
};

export default jeu;
