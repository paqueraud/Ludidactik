import { lazy } from 'react';
import type { GameModule } from '@/engine/GameModule';

const jeu: GameModule = {
  id: 'batisseur',
  numero: 6,
  titre: 'Le Bâtisseur',
  description: 'Construis le nombre avec des cubes, des barres et des plaques. 10 cubes = 1 barre !',
  consigne:
    'Construis le nombre demandé avec le matériel : les cubes valent 1, les barres 10, les plaques 100. Ajoute ou enlève des pièces, et échange 10 pièces contre une plus grosse. Puis appuie sur « C’est construit ! ».',
  icone: '🧱',
  couleur: 'from-sun to-grass',
  modalites: ['manipuler', 'regarder'],
  accepts: ['numeric_answer'],
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  dureeCible: 220,
  minItems: 1,
  filterItem: (it) =>
    it.kind === 'numeric_answer' &&
    it.answer >= 0 &&
    it.answer <= 999_999_999 &&
    (it.meta?.construire === true ||
      (/\.NUM\.(DECOMP|ECRIRE|GRANDS)/.test(it.lessonId) && Number.isInteger(it.answer))),
  lessons: (l) => /\.NUM\.(DECOMP|ECRIRE|GRANDS)/.test(l.id) || l.jeuxSuggeres.includes('batisseur'),
  component: lazy(() => import('./Batisseur')),
};

export default jeu;
