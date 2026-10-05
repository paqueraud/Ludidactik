import { DailyChallenge, GradeLevel } from '../types';

export class DailyChallengeService {
  public static getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  public static getChallengesForGrade(grade: GradeLevel): DailyChallenge[] {
    const today = this.getTodayKey();

    if (grade === 'CE1') {
      return [
        {
          id: `ce1-daily-1-${today}`,
          title: '🐎 Sprint Éclair des Compléments à 10',
          description: 'Gagne une course de chevaux en mode Normal en moins de 30 secondes.',
          lessonId: 'ce1-maths-additions-p1',
          gameType: 'horse-race',
          difficulty: 'normal',
          targetScore: 1,
          rewardStars: 2,
          rewardCoins: 20,
          completed: false
        },
        {
          id: `ce1-daily-2-${today}`,
          title: '🏔️ L\'Ascension des Mots Sans Faute',
          description: 'Grimpe la montagne des mots jusqu\'au sommet sans commettre plus d\'une erreur.',
          lessonId: 'ce1-francais-mots-invariables-p1',
          gameType: 'mountain-climb',
          difficulty: 'normal',
          targetScore: 4807,
          rewardStars: 2,
          rewardCoins: 25,
          completed: false
        },
        {
          id: `ce1-daily-3-${today}`,
          title: '🚂 Le Train des Sons : Zéro Retard',
          description: 'Aiguille 5 trains de sons sur la bonne voie sans dérailler !',
          lessonId: 'ce1-francais-pluriel-p2',
          gameType: 'sound-train',
          difficulty: 'normal',
          targetScore: 5,
          rewardStars: 3,
          rewardCoins: 30,
          completed: false
        }
      ];
    } else {
      // CM2
      return [
        {
          id: `cm2-daily-1-${today}`,
          title: '🐎 Turbo Multiples sur l\'Hippodrome',
          description: 'Réponds en moins de 3 secondes à 3 calculs de suite pour déclencher le Super Turbo !',
          lessonId: 'cm2-maths-grandes-tables-p1',
          gameType: 'horse-race',
          difficulty: 'normal',
          targetScore: 3,
          rewardStars: 2,
          rewardCoins: 20,
          completed: false
        },
        {
          id: `cm2-daily-2-${today}`,
          title: '⚖️ Sauve Ta Tête au Tribunal de 1789',
          description: 'Réponds juste à 4 énigmes historiques sans faire bouger la lame de la guillotine.',
          lessonId: 'cm2-histoire-revolution-p1',
          gameType: 'guillotine-history',
          difficulty: 'normal',
          targetScore: 4,
          rewardStars: 3,
          rewardCoins: 30,
          completed: false
        },
        {
          id: `cm2-daily-3-${today}`,
          title: '🫧 L\'Attrape-Bulles Galactique',
          description: 'Éclate les bulles des fractions équivalentes en moins de 45 secondes sans toucher aux pièges !',
          lessonId: 'cm2-maths-fractions-pourcentages-p3',
          gameType: 'bubble-catch',
          difficulty: 'normal',
          targetScore: 100,
          rewardStars: 3,
          rewardCoins: 35,
          completed: false
        }
      ];
    }
  }
}
