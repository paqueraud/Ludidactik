import { UserProfile, GradeLevel, UserProgress } from '../types';

const STORAGE_PROFILES_KEY = 'ecolier_champion_profiles_v2';
const STORAGE_ACTIVE_ID_KEY = 'ecolier_champion_active_id_v2';

const DEFAULT_AVATAR = {
  character: 'fox',
  hat: 'none',
  accessory: 'none',
  horseColor: 'brown'
};

const SEED_PROFILES: UserProfile[] = [
  {
    id: 'demo-ce1',
    name: 'Léo',
    password: '123',
    grade: 'CE1',
    progress: {
      stars: 6,
      coins: 45,
      completedLessons: {
        'ce1-maths-additions-p1': { facile: true, normal: true }
      },
      avatar: {
        character: 'fox',
        hat: 'climb_helmet',
        accessory: 'none',
        horseColor: 'brown'
      },
      unlockedItems: ['fox', 'owl', 'none', 'climb_helmet', 'brown'],
      historyRecord: { gamesPlayed: 4, correctAnswers: 12 },
      dailyChallengesCompleted: []
    },
    customDictations: [
      {
        id: 'cust-demo-1',
        title: 'Mots de la semaine (Exemple)',
        words: [
          { id: 'w1', word: 'maison', sentence: 'La maison a des volets bleus.' },
          { id: 'w2', word: 'forêt', sentence: 'Le renard se cache dans la forêt.' },
          { id: 'w3', word: 'château', sentence: 'Nous visitons un château fort.' }
        ],
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 'demo-cm2',
    name: 'Léa',
    password: '123',
    grade: 'CM2',
    progress: {
      stars: 10,
      coins: 80,
      completedLessons: {
        'cm2-histoire-revolution-p1': { facile: true, normal: true, expert: true }
      },
      avatar: {
        character: 'owl',
        hat: 'phrygian',
        accessory: 'none',
        horseColor: 'white'
      },
      unlockedItems: ['fox', 'owl', 'none', 'phrygian', 'brown', 'white'],
      historyRecord: { gamesPlayed: 6, correctAnswers: 20 },
      dailyChallengesCompleted: []
    },
    customDictations: [],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

export class AuthService {
  public static getAllProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return SEED_PROFILES;
    try {
      const data = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(SEED_PROFILES));
        return SEED_PROFILES;
      }
      const parsed: UserProfile[] = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(SEED_PROFILES));
        return SEED_PROFILES;
      }
      return parsed;
    } catch {
      return SEED_PROFILES;
    }
  }

  public static getActiveProfile(): UserProfile {
    const profiles = this.getAllProfiles();
    const activeId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACTIVE_ID_KEY) : null;
    if (activeId) {
      const found = profiles.find(p => p.id === activeId);
      if (found) return found;
    }
    // Default to the first profile
    const def = profiles[0] || SEED_PROFILES[0];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, def.id);
    }
    return def;
  }

  public static setActiveProfileId(id: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
    }
  }

  public static saveProfile(updated: UserProfile): void {
    const profiles = this.getAllProfiles();
    const index = profiles.findIndex(p => p.id === updated.id);
    if (index >= 0) {
      profiles[index] = { ...updated, lastLogin: new Date().toISOString() };
    } else {
      profiles.push(updated);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    }
  }

  public static createProfile(
    name: string,
    password: string,
    grade: GradeLevel,
    characterId: string = 'fox'
  ): UserProfile {
    const profiles = this.getAllProfiles();
    const newProfile: UserProfile = {
      id: `pupil-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      password: password.trim(),
      grade,
      progress: {
        stars: 0,
        coins: 20, // bonus welcome gift
        completedLessons: {},
        avatar: {
          character: characterId,
          hat: 'none',
          accessory: 'none',
          horseColor: 'brown'
        },
        unlockedItems: [characterId, 'none', 'brown'],
        historyRecord: { gamesPlayed: 0, correctAnswers: 0 },
        dailyChallengesCompleted: []
      },
      customDictations: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    profiles.push(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, newProfile.id);
    }
    return newProfile;
  }

  public static updateActiveProgress(progress: UserProgress): UserProfile {
    const active = this.getActiveProfile();
    active.progress = progress;
    this.saveProfile(active);
    return active;
  }

  public static deleteProfile(profileId: string): void {
    let profiles = this.getAllProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    if (profiles.length === 0) {
      profiles = [...SEED_PROFILES];
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, profiles[0].id);
    }
  }
}
