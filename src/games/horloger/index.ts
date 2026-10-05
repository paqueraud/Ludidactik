import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { itemHorlogeValide } from '../_calcul-commun/horloge';

const jeu: GameModule = {
  id: 'horloger',
  numero: 12,
  titre: 'L’Horloger',
  description: 'Lis l’heure, règle les aiguilles des horloges et calcule le temps des trajets en train.',
  consigne:
    'Bienvenue dans l’atelier de l’horloger ! La petite aiguille montre les heures, la grande aiguille montre les minutes. Lis l’heure, ou fais glisser les aiguilles pour régler l’horloge. À la gare, calcule l’heure d’arrivée du train ou la durée du trajet.',
  icone: '⏰',
  couleur: 'from-sky to-grape',
  modalites: ['manipuler', 'regarder', 'ecouter'],
  accepts: ['clock'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 240,
  minItems: 1,
  filterItem: (item) => item.kind === 'clock' && itemHorlogeValide(item),
  component: lazy(() => import('./Horloger')),
};

export default jeu;
