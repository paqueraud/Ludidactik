/** Contrat d'un mini-jeu (ARCHITECTURE §4). Un jeu ne contient jamais de contenu pédagogique en dur. */
import type { FC, LazyExoticComponent } from 'react';
import type { ItemFilter, ItemStream } from '@/content/provider';
import type { Classe, ItemKind, Lesson, Level, Modality } from '@/content/schemas';
import type { SfxService } from '@/services/sfx';
import type { SpeechService } from '@/services/speech';
import type { Profile, RecordRow } from '@/services/storage/db';

export interface AnswerEvent {
  itemId: string;
  itemKey: string;
  correct: boolean;
  /** Temps de réponse en ms. */
  ms: number;
  given: string;
  expected: string;
}

export interface GameSummary {
  /** Bonnes réponses / réponses données. */
  correct: number;
  total: number;
  durationMs: number;
  /** Score propre au jeu (comparé au record). Plus grand = meilleur. */
  score: number;
  /** Objectif du jeu atteint (ligne d'arrivée, sommet, acquittement). */
  won: boolean;
  /** Phrase de fin propre au jeu (« 2e place ! », « Sommet atteint ! »). */
  headline: string;
  /** Fantôme à enregistrer si record battu. */
  ghost?: number[];
}

export interface GameProps {
  lesson: Lesson;
  level: Level;
  profile: Profile;
  stream: ItemStream;
  kind: ItemKind;
  /** Record personnel (fantôme) sur ce jeu / leçon / niveau. */
  record: RecordRow | null;
  /** Lecture automatique des consignes et questions (enfants lecteurs débutants). */
  lectureAuto: boolean;
  /** Difficulté visée [0,1] — mise à jour par l'adaptativité du GameHost. */
  target: () => number;
  /** Partie en pause : le jeu doit figer ses chronomètres et animations. */
  paused: boolean;
  onAnswer(e: AnswerEvent): void;
  onEnd(s: GameSummary): void;
  speech: SpeechService;
  sfx: SfxService;
}

export interface GameModule {
  id: string;
  titre: string;
  description: string;
  /** Consigne lue à voix haute avant la partie. */
  consigne: string;
  icone: string;
  /** Dégradé Tailwind de la carte du jeu. */
  couleur: string;
  modalites: Modality[];
  accepts: ItemKind[];
  classes: Classe[];
  /** Durée visée d'une partie, en secondes. */
  dureeCible: number;
  supportsDuel?: boolean;
  needsMic?: boolean;
  /** Nombre minimal d'items distincts pour proposer le jeu. */
  minItems: number;
  filterItem?: ItemFilter;
  signature?: boolean;
  component: LazyExoticComponent<FC<GameProps>>;
}
