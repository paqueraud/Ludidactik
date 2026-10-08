/**
 * Base locale IndexedDB (Dexie) — ARCHITECTURE §6.
 * Rien ne quitte l'appareil : export/import JSON pour changer d'appareil.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { AvatarConfig } from '@/avatar/parts';
import type { Classe, Level } from '@/content/schemas';

export interface ProfileAuth {
  type: 'texte' | 'image';
  /** PBKDF2-SHA256 en base64. */
  hash: string;
  salt: string;
}

export interface Profile {
  id: string;
  prenom: string;
  avatar: AvatarConfig;
  classe: Classe;
  auth: ProfileAuth;
  xp: number;
  ludis: number;
  /** Leçons « en cours » (choisies par l'enfant ou le parent). */
  enCours: string[];
  /** Limite de temps de jeu quotidienne en minutes (null = illimité ; absent = 30 min par défaut). */
  limiteMinutes?: number | null;
  creeLe: number;
  derniereConnexion: number;
}

/** Meilleur résultat par (profil, leçon, jeu, niveau). */
export interface ProgressRow {
  key: string; // `${profileId}|${lessonId}|${gameId}|${level}`
  profileId: string;
  lessonId: string;
  gameId: string;
  level: Level;
  stars: number; // 0..3
  bestAccuracy: number; // 0..1
  plays: number;
  lastPlayed: number;
}

/** Record (score) + fantôme rejouable. */
export interface RecordRow {
  key: string; // même clé que ProgressRow
  profileId: string;
  lessonId: string;
  gameId: string;
  level: Level;
  score: number;
  durationMs: number;
  /** Instants (ms depuis le départ) de chaque bonne réponse : le « fantôme » du Grand Prix. */
  ghost?: number[];
  date: number;
}

export interface AttemptRow {
  id?: number;
  profileId: string;
  lessonId: string;
  gameId: string;
  level: Level;
  date: number;
  correct: number;
  total: number;
  durationMs: number;
}

/** Répétition espacée (Leitner, 5 boîtes). */
export interface LeitnerRow {
  key: string; // `${profileId}|${itemKey}`
  profileId: string;
  itemKey: string; // « mot:chocolat », « calc:7×8 »
  box: number; // 1..5
  due: number;
}

export interface ParentWord {
  mot: string;
  phrase?: string;
  /** Clé de l'enregistrement audio (table `audio`). */
  audioKey?: string;
}

export interface ParentWordList {
  id: string;
  titre: string;
  semaine?: string;
  /** Profils concernés (vide = tous). */
  profileIds: string[];
  mots: ParentWord[];
  creeLe: number;
  /** Dernière modification (badge « Nouveaux mots ! » côté enfant). */
  modifieLe?: number;
}

/** Temps de jeu réel (parties) par profil et par jour (GAMIFICATION §8). */
export interface ScreenTimeRow {
  key: string; // `${profileId}|${AAAA-MM-JJ}`
  profileId: string;
  day: string; // AAAA-MM-JJ (heure locale)
  ms: number;
  /** Temps supplémentaire accordé par un parent ce jour-là (ms). */
  bonusMs: number;
}

export interface AudioRow {
  key: string;
  blob: Blob;
  mime: string;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

/** Limite quotidienne par défaut (minutes). */
export const LIMITE_PAR_DEFAUT = 30;

export class LudidactikDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  progress!: EntityTable<ProgressRow, 'key'>;
  records!: EntityTable<RecordRow, 'key'>;
  attempts!: EntityTable<AttemptRow, 'id'>;
  leitner!: EntityTable<LeitnerRow, 'key'>;
  wordLists!: EntityTable<ParentWordList, 'id'>;
  audio!: EntityTable<AudioRow, 'key'>;
  settings!: EntityTable<SettingRow, 'key'>;
  screenTime!: EntityTable<ScreenTimeRow, 'key'>;

  constructor(name = 'ludidactik') {
    super(name);
    this.version(1).stores({
      profiles: 'id, prenom, derniereConnexion',
      progress: 'key, profileId, [profileId+lessonId], lessonId',
      records: 'key, profileId, [lessonId+gameId+level]',
      attempts: '++id, profileId, date',
      leitner: 'key, profileId, [profileId+due]',
      wordLists: 'id, creeLe',
      audio: 'key',
      settings: 'key',
    });
    // v2 (Phase 6, espace parents) : temps d'écran quotidien, limite par profil, date de modification des listes.
    this.version(2)
      .stores({ screenTime: 'key, profileId, [profileId+day]' })
      .upgrade(async (tx) => {
        await tx
          .table('profiles')
          .toCollection()
          .modify((p: Profile) => {
            if (p.limiteMinutes === undefined) p.limiteMinutes = LIMITE_PAR_DEFAUT;
          });
        await tx
          .table('wordLists')
          .toCollection()
          .modify((l: ParentWordList) => {
            l.modifieLe ??= l.creeLe;
          });
      });
  }
}

export const db = new LudidactikDB();

export const progressKey = (profileId: string, lessonId: string, gameId: string, level: Level) =>
  `${profileId}|${lessonId}|${gameId}|${level}`;
