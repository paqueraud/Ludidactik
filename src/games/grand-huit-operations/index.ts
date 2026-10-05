import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { lirePosee } from '../_calcul-commun/posee';

const jeu: GameModule = {
  id: 'grand-huit-operations',
  numero: 20,
  titre: 'Le Grand Huit des opérations posées',
  description:
    'Pose et calcule en colonnes, chiffre par chiffre : chaque bon chiffre fait avancer le wagonnet !',
  consigne:
    'En voiture ! L’opération est posée en colonnes. Écris les chiffres un par un, en commençant par la colonne de droite (pour la division, on commence par la gauche). Les retenues s’écrivent en violet. Chaque bon chiffre fait avancer le wagonnet sur les montagnes russes !',
  icone: '🎢',
  couleur: 'from-grape to-coral',
  modalites: ['ecrire', 'regarder'],
  accepts: ['numeric_answer'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 270,
  minItems: 1,
  // Convention partagée (GUIDE §6) : meta.posee = { a, b, op } ou meta.termes (addition de plusieurs nombres)
  filterItem: (item) => lirePosee(item) !== null,
  component: lazy(() => import('./GrandHuit')),
};

export default jeu;
