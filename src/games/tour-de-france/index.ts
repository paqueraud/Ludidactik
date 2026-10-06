import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';
import { estLieuConnu } from '../_cartes/ids';

const jeu: GameModule = {
  id: 'tour-de-france',
  numero: 51,
  titre: 'Le Tour de France',
  description:
    'Régions, fleuves, montagnes, pays d’Europe, continents et océans : touche le bon lieu pour faire avancer le camping-car !',
  consigne:
    'Lis ou écoute le nom du lieu, puis touche-le sur la carte. À chaque lieu trouvé, le camping-car roule jusqu’à cette étape. Si tu te trompes, je te dis dans quelle direction chercher !',
  icone: '🚐',
  couleur: 'from-geographie to-sky',
  modalites: ['regarder', 'manipuler'],
  accepts: ['map_point'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 180,
  minItems: 3,
  filterItem: estLieuConnu,
  component: lazy(() => import('./TourDeFrance')),
};

export default jeu;
