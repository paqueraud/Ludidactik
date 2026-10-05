import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'bataille-navale',
  numero: 8,
  titre: 'Bataille navale graduée',
  description:
    'Des bateaux pirates se cachent sur la ligne graduée : vise la bonne position et envoie ta bombe de peinture !',
  consigne:
    'Les bateaux pirates se cachent dans le brouillard. Lis leur position, place ton viseur sur la ligne graduée et tire ta bombe de peinture. Parfois, il faudra lire la position d’un bateau que tu vois.',
  icone: '🚢',
  couleur: 'from-sky to-grass',
  modalites: ['regarder', 'manipuler'],
  accepts: ['number_line'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 3,
  component: lazy(() => import('./BatailleNavale')),
};

export default jeu;
