export type GradeLevel = 'CE1' | 'CM2';

export type SubjectId = 'maths' | 'francais' | 'histoire' | 'sciences';

export type DifficultyLevel = 'facile' | 'normal' | 'expert'; // expert = "pour aller plus loin"

export type SchoolPeriod = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // Périodes 1 à 5 de l'année scolaire

export type LearningModality = 'ecrire' | 'ecouter' | 'parler' | 'regarder' | 'reflexe';

export type GameType =
  | 'horse-race'        // Calcul mental au galop (Kinétique/Clavier)
  | 'mountain-climb'     // Ascension orthographique (Dictée)
  | 'guillotine-history' // Défi de la Révolution (Sauve ta tête)
  | 'lab-quiz'           // Laboratoire des Savoirs
  | 'bubble-catch'       // REGARDER / VISUEL : Attrape-Bulles Spatiales (réflexe visuel)
  | 'sound-train'        // ÉCOUTER : Le Train des Sons & Aiguillages
  | 'gutenberg-press'    // ÉCRIRE : La Presse de Gutenberg (tampons de lettres)
  | 'speech-reporter';   // PARLER : Le Micro Magique du Reporter d'Histoire

export interface Lesson {
  id: string;
  grade: GradeLevel;
  subject: SubjectId;
  period: SchoolPeriod;
  periodLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  badgeName: string;
  gameType: GameType;
  modality: LearningModality; // Canal d'apprentissage préférentiel
  officialBulletinRef: string;
  boObjectives: string[];
  memo: {
    ruleTitle: string;
    keyPoints: string[];
    example: string;
    proTip: string;
  };
}

export interface HorseQuestion {
  question: string;
  answer: number;
  hint: string;
}

export interface MountainWord {
  word: string;
  sentenceExample: string;
  syllables?: string;
  ruleExplanation: string;
  difficultyBadge: string;
}

export interface HistoryQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  historicalContext: string;
  anecdote: string;
}

export interface ScienceItem {
  id: string;
  prompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category?: string;
}

export interface ParentWord {
  id: string;
  word: string;
  sentence?: string;
  hint?: string;
}

export interface CustomDictationList {
  id: string;
  title: string; // Ex: "Mots de la semaine du 12 octobre"
  words: ParentWord[];
  createdAt: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  lessonId: string;
  gameType: GameType;
  difficulty: DifficultyLevel;
  targetScore: number;
  rewardStars: number;
  rewardCoins: number;
  completed: boolean;
}

export interface HighScoreRecord {
  id: string;
  pupilName: string;
  pupilAvatar: string;
  gameType: GameType;
  gameTitle: string;
  score: number;
  extraInfo: string; // Ex: "Temps: 11.2s (Turbo)" ou "Altitude: 4807m"
  date: string;
  grade: GradeLevel;
}

export interface UserProgress {
  stars: number;
  coins: number;
  completedLessons: Record<string, {
    facile?: boolean;
    normal?: boolean;
    expert?: boolean;
    highScore?: number;
    lastPlayed?: string;
  }>;
  avatar: {
    character: string;
    hat: string;
    accessory: string;
    horseColor: string;
  };
  unlockedItems: string[];
  historyRecord: {
    gamesPlayed: number;
    correctAnswers: number;
  };
  dailyChallengesCompleted: string[]; // List of challenge IDs completed today
  lastChallengeDate?: string;
}

export interface UserProfile {
  id: string;
  name: string; // Prénom de l'élève
  password: string; // Mot de passe ou code secret
  grade: GradeLevel;
  progress: UserProgress;
  customDictations: CustomDictationList[]; // Listes de mots ajoutées par les parents
  createdAt: string;
  lastLogin: string;
}
