import { HighScoreRecord, GameType, GradeLevel } from '../types';

const STORAGE_KEY_HIGHSCORES = 'ecolier_champion_highscores_v1';

const INITIAL_RECORDS: HighScoreRecord[] = [
  {
    id: 'rec-1',
    pupilName: 'Léo',
    pupilAvatar: '🦊',
    gameType: 'horse-race',
    gameTitle: 'Course de Calcul Mental',
    score: 98,
    extraInfo: 'Temps record : 12.8s (Turbo Fusée 🚀)',
    date: 'Hier',
    grade: 'CE1'
  },
  {
    id: 'rec-2',
    pupilName: 'Léa',
    pupilAvatar: '🦉',
    gameType: 'mountain-climb',
    gameTitle: 'Ascension Orthographique',
    score: 4807,
    extraInfo: 'Sommet atteint à 4 807 m sans faute 🚩',
    date: 'Aujourd\'hui',
    grade: 'CM2'
  },
  {
    id: 'rec-3',
    pupilName: 'Léa',
    pupilAvatar: '🦉',
    gameType: 'guillotine-history',
    gameTitle: 'Défi de la Révolution 1789',
    score: 10,
    extraInfo: 'Lame verrouillée au sommet (10/10) ⚖️',
    date: 'Aujourd\'hui',
    grade: 'CM2'
  },
  {
    id: 'rec-4',
    pupilName: 'Maxime',
    pupilAvatar: '🦁',
    gameType: 'bubble-catch',
    gameTitle: 'L\'Attrape-Bulles Galactique',
    score: 420,
    extraInfo: 'Combo Réflexe Visuel x5 ⚡',
    date: 'Il y a 2 jours',
    grade: 'CE1'
  },
  {
    id: 'rec-5',
    pupilName: 'Chloé',
    pupilAvatar: '🐼',
    gameType: 'sound-train',
    gameTitle: 'Le Train des Sons & Aiguillages',
    score: 850,
    extraInfo: 'Oreille absolue : 8 trains à l\'heure 🚂',
    date: 'Cette semaine',
    grade: 'CM2'
  }
];

export class HighScoreService {
  public static getAllRecords(): HighScoreRecord[] {
    if (typeof window === 'undefined') return INITIAL_RECORDS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_HIGHSCORES);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_HIGHSCORES, JSON.stringify(INITIAL_RECORDS));
        return INITIAL_RECORDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RECORDS;
    }
  }

  public static addRecord(record: Omit<HighScoreRecord, 'id' | 'date'>): void {
    const list = this.getAllRecords();
    const newRecord: HighScoreRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: 'Aujourd\'hui'
    };

    // Keep highest scores per game
    list.unshift(newRecord);
    // Keep max 25 entries
    const trimmed = list.slice(0, 25);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HIGHSCORES, JSON.stringify(trimmed));
    }
  }

  public static getTopByGame(gameType: GameType): HighScoreRecord[] {
    return this.getAllRecords().filter(r => r.gameType === gameType);
  }
}
