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

export class LudidactikDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  progress!: EntityTable<ProgressRow, 'key'>;
  records!: EntityTable<RecordRow, 'key'>;
  attempts!: EntityTable<AttemptRow, 'id'>;
  leitner!: EntityTable<LeitnerRow, 'key'>;
  wordLists!: EntityTable<ParentWordList, 'id'>;
  audio!: EntityTable<AudioRow, 'key'>;
  settings!: EntityTable<SettingRow, 'key'>;

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
  }
}

export const db = new LudidactikDB();

export const progressKey = (profileId: string, lessonId: string, gameId: string, level: Level) =>
  `${profileId}|${lessonId}|${gameId}|${level}`;
