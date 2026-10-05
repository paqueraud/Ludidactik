/** Libellés, icônes et couleurs d'affichage (DESIGN_UI). */
import type { Level, Matiere, Modality } from './schemas';

export const MATIERE_META: Record<Matiere, { label: string; icone: string; couleur: string; texte: string }> =
  {
    francais: { label: 'Français', icone: '📚', couleur: 'bg-francais', texte: 'text-francais' },
    maths: { label: 'Mathématiques', icone: '🔢', couleur: 'bg-maths', texte: 'text-maths' },
    questionner_le_monde: {
      label: 'Questionner le monde',
      icone: '🌍',
      couleur: 'bg-sciences',
      texte: 'text-sciences',
    },
    histoire: { label: 'Histoire', icone: '🏰', couleur: 'bg-histoire', texte: 'text-histoire' },
    geographie: { label: 'Géographie', icone: '🗺️', couleur: 'bg-geographie', texte: 'text-geographie' },
    sciences: { label: 'Sciences', icone: '🔬', couleur: 'bg-sciences', texte: 'text-sciences' },
    emc: { label: 'Vivre ensemble (EMC)', icone: '🤝', couleur: 'bg-emc', texte: 'text-emc' },
    anglais: { label: 'Anglais', icone: '💬', couleur: 'bg-anglais', texte: 'text-anglais' },
  };

export const LEVEL_META: Record<
  Level,
  { label: string; court: string; icone: string; couleur: string; regle: string }
> = {
  facile: {
    label: 'Facile',
    court: 'Facile',
    icone: '🌱',
    couleur: 'bg-facile',
    regle: 'Pas de chrono, des indices et des vies en plus. Pour prendre confiance !',
  },
  normal: {
    label: 'Normal',
    court: 'Normal',
    icone: '⭐',
    couleur: 'bg-normal',
    regle: 'Ce qu’on attend en fin d’année. Un indice possible.',
  },
  plus_loin: {
    label: 'Pour aller plus loin',
    court: 'Plus loin',
    icone: '🚀',
    couleur: 'bg-plusloin',
    regle: 'Au-delà du programme : plus rapide, sans indice, bonus ×1,5 !',
  },
};

export const MODALITY_META: Record<Modality, { label: string; icone: string }> = {
  ecrire: { label: 'J’écris', icone: '✏️' },
  ecouter: { label: 'J’écoute', icone: '👂' },
  parler: { label: 'Je parle', icone: '🗣️' },
  regarder: { label: 'Je regarde', icone: '👀' },
  manipuler: { label: 'Je manipule', icone: '✋' },
};
