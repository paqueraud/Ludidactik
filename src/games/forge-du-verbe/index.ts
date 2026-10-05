import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { versForge } from '../_langue-commun/conjugaison';

const jeu: GameModule = {
  id: 'forge-du-verbe',
  numero: 39,
  titre: 'La Forge du verbe',
  description: 'Les rouleaux tournent : un sujet, un verbe, un temps… Forge la bonne forme et gagne une pièce d’armure pour ton chevalier !',
  consigne:
    'Tire le levier : les trois rouleaux te donnent un sujet, un verbe et un temps. Écris le verbe conjugué qui complète la phrase. Chaque forme juste forge une pièce d’armure pour le chevalier !',
  icone: '⚒️',
  couleur: 'from-coral to-histoire',
  modalites: ['regarder', 'ecrire'],
  accepts: ['fill_blank'],
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 4,
  // Convention GUIDE §6 : champ `conjugaison = { sujet, verbe, temps }`
  filterItem: (item) => versForge(item) !== null,
  component: lazy(() => import('./ForgeVerbe')),
};

export default jeu;
