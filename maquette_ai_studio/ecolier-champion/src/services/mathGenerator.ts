import { DifficultyLevel, HorseQuestion } from '../types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomHorseQuestion(lessonId: string, difficulty: DifficultyLevel): HorseQuestion {
  // 1. CE1 - ADDITIONS & DOUBLES
  if (lessonId.includes('additions') || lessonId.includes('ce1-maths-p1')) {
    if (difficulty === 'facile') {
      const type = randInt(1, 2);
      if (type === 1) {
        // Complements to 10
        const a = randInt(1, 9);
        const b = 10 - a;
        return {
          question: `${a} + ${b} = ?`,
          answer: 10,
          hint: `${a} et ${b} sont les amis de 10 !`
        };
      } else {
        // Doubles up to 5
        const a = randInt(2, 5);
        return {
          question: `${a} + ${a} = ?`,
          answer: a * 2,
          hint: `C'est le double de ${a} !`
        };
      }
    } else if (difficulty === 'normal') {
      const type = randInt(1, 2);
      if (type === 1) {
        // Doubles 6 to 9
        const a = randInt(6, 9);
        return {
          question: `${a} + ${a} = ?`,
          answer: a * 2,
          hint: `Le double de ${a}.`
        };
      } else {
        // Bridging 10 (ex: 8+5, 9+7, 7+6)
        const a = randInt(7, 9);
        const b = randInt(4, 8);
        return {
          question: `${a} + ${b} = ?`,
          answer: a + b,
          hint: `Passe par 10 : ${a} + ${10 - a} = 10, puis ajoute le reste !`
        };
      }
    } else {
      // Expert (ajouter 9, doubles > 12, sommes > 20)
      const a = randInt(14, 48);
      return {
        question: `${a} + 9 = ?`,
        answer: a + 9,
        hint: `Ajoute 10 (${a + 10}) puis retire 1 !`
      };
    }
  }

  // 2. CE1 - SOUSTRACTIONS & ÉCARTS
  if (lessonId.includes('soustractions') || lessonId.includes('ce1-maths-p2')) {
    if (difficulty === 'facile') {
      const b = randInt(1, 9);
      return {
        question: `10 - ${b} = ?`,
        answer: 10 - b,
        hint: `Pense aux amis de 10 : quel nombre fait 10 avec ${b} ?`
      };
    } else if (difficulty === 'normal') {
      const a = randInt(12, 19);
      const b = randInt(3, 8);
      return {
        question: `${a} - ${b} = ?`,
        answer: a - b,
        hint: `Recule d'abord jusqu'à 10, puis enlève le reste.`
      };
    } else {
      const a = randInt(30, 90);
      const b = randInt(11, 25);
      return {
        question: `${a} - ${b} = ?`,
        answer: a - b,
        hint: `Enlève d'abord les dizaines, puis les unités !`
      };
    }
  }

  // 3. CE1 - TABLES DE 2, 5 ET 10
  if (lessonId.includes('tables-2-5') || lessonId.includes('ce1-maths-p3')) {
    if (difficulty === 'facile') {
      const table = pickRandom([2, 5, 10]);
      const n = randInt(1, 4);
      return {
        question: `${table} × ${n} = ?`,
        answer: table * n,
        hint: table === 2 ? `Le double de ${n}.` : table === 5 ? `Compte de 5 en 5.` : `Ajoute un zéro.`
      };
    } else if (difficulty === 'normal') {
      const table = pickRandom([2, 5, 10]);
      const n = randInt(5, 9);
      return {
        question: `${table} × ${n} = ?`,
        answer: table * n,
        hint: table === 5 ? `Dans la table de 5, ça finit toujours par 0 ou 5 !` : table === 2 ? `Le double de ${n}.` : `Ajoute un zéro après ${n}.`
      };
    } else {
      const table = pickRandom([2, 5, 10]);
      const n = randInt(11, 25);
      return {
        question: `${table} × ${n} = ?`,
        answer: table * n,
        hint: `Décompose : ${table} × 10 + ${table} × ${n - 10} !`
      };
    }
  }

  // 4. CE1 - TABLES DE 3, 4 ET AJOUTER 9
  if (lessonId.includes('tables-3-4') || lessonId.includes('ce1-maths-p4')) {
    if (difficulty === 'facile') {
      const table = pickRandom([3, 4]);
      const n = randInt(1, 5);
      return {
        question: `${table} × ${n} = ?`,
        answer: table * n,
        hint: table === 4 ? `C'est le double du double !` : `Trois paquets de ${n}.`
      };
    } else if (difficulty === 'normal') {
      const table = pickRandom([3, 4]);
      const n = randInt(6, 9);
      return {
        question: `${table} × ${n} = ?`,
        answer: table * n,
        hint: `Dans la table de ${table}, ajoute ${table} au résultat précédent.`
      };
    } else {
      const a = randInt(25, 75);
      return {
        question: `${a} + 19 = ?`,
        answer: a + 19,
        hint: `Astuce magique : ajoute 20 (${a + 20}) puis retire 1 !`
      };
    }
  }

  // 5. CM2 - GRANDES TABLES & MULTIPLES (6, 7, 8, 9)
  if (lessonId.includes('calcul-mental') || lessonId.includes('grandes-tables') || lessonId.includes('cm2-maths-p1')) {
    if (difficulty === 'facile') {
      const squares = [5, 6, 7, 8, 9];
      const a = pickRandom(squares);
      return {
        question: `${a} × ${a} = ?`,
        answer: a * a,
        hint: `C'est un carré parfait : ${a} au carré.`
      };
    } else if (difficulty === 'normal') {
      const pairs = [
        [7, 8, '5, 6, 7, 8 : 56 = 7 × 8 !'],
        [8, 9, '8 × 10 = 80, enlève 8.'],
        [6, 9, 'La somme des chiffres fait 9 (5+4).'],
        [6, 7, '6 × 6 = 36, ajoute encore 6 !'],
        [7, 9, '7 × 10 = 70, retire 7.'],
        [8, 8, '8 × 8 = 64.']
      ];
      const p = pickRandom(pairs);
      return {
        question: `${p[0]} × ${p[1]} = ?`,
        answer: (p[0] as number) * (p[1] as number),
        hint: p[2] as string
      };
    } else {
      // Expert: 14x5, 18x11, 25x6, etc.
      const type = randInt(1, 2);
      if (type === 1) {
        const n = randInt(12, 28);
        return {
          question: `${n} × 5 = ?`,
          answer: n * 5,
          hint: `Multiplie par 10 (${n * 10}) puis coupe en deux !`
        };
      } else {
        const n = randInt(12, 19);
        return {
          question: `${n} × 11 = ?`,
          answer: n * 11,
          hint: `${n} × 10 (${n * 10}) + ${n}.`
        };
      }
    }
  }

  // 6. CM2 - MULTIPLIER / DIVISER PAR 10, 100, 1000
  if (lessonId.includes('mult-div-10') || lessonId.includes('cm2-maths-p2')) {
    if (difficulty === 'facile') {
      const a = randInt(15, 95);
      return {
        question: `${a} × 10 = ?`,
        answer: a * 10,
        hint: `Ajoute un zéro à droite du nombre !`
      };
    } else if (difficulty === 'normal') {
      const type = randInt(1, 2);
      if (type === 1) {
        const a = (randInt(12, 85) / 10).toFixed(1);
        return {
          question: `${a} × 10 = ?`,
          answer: Math.round(parseFloat(a) * 10),
          hint: `Déplace la virgule d'un rang vers la droite.`
        };
      } else {
        const a = randInt(12, 95) * 100;
        return {
          question: `${a} ÷ 100 = ?`,
          answer: a / 100,
          hint: `Enlève deux zéros !`
        };
      }
    } else {
      const a = (randInt(12, 95) / 100).toFixed(2);
      return {
        question: `${a} × 100 = ?`,
        answer: Math.round(parseFloat(a) * 100),
        hint: `Déplace la virgule de deux rangs vers la droite.`
      };
    }
  }

  // 7. CM2 - FRACTIONS & POURCENTAGES
  if (lessonId.includes('fractions') || lessonId.includes('cm2-maths-p3') || lessonId.includes('cm2-maths-p5')) {
    if (difficulty === 'facile') {
      const n = pickRandom([20, 40, 60, 80, 100, 120]);
      return {
        question: `50% de ${n} = ?`,
        answer: n / 2,
        hint: `50% c'est la moitié (divise par 2).`
      };
    } else if (difficulty === 'normal') {
      const type = randInt(1, 2);
      if (type === 1) {
        const n = pickRandom([40, 80, 120, 160, 200]);
        return {
          question: `25% de ${n} = ?`,
          answer: n / 4,
          hint: `25% c'est le quart (divise par 4).`
        };
      } else {
        const n = randInt(12, 80) * 10;
        return {
          question: `10% de ${n} = ?`,
          answer: n / 10,
          hint: `10% c'est diviser par 10 (enlève un zéro).`
        };
      }
    } else {
      const n = pickRandom([40, 80, 120, 200]);
      return {
        question: `75% de ${n} = ?`,
        answer: (n * 3) / 4,
        hint: `Prends 25% (${n / 4}) et multiplie par 3 !`
      };
    }
  }

  // 8. CM2 - DÉCIMAUX (COMPLÉMENTS À L'UNITÉ)
  if (lessonId.includes('decimaux') || lessonId.includes('cm2-maths-p4')) {
    if (difficulty === 'facile') {
      const tenths = randInt(1, 9);
      const val = tenths / 10;
      const comp = Math.round((1 - val) * 10) / 10;
      return {
        question: `${val.toFixed(1)} + ? = 1`,
        answer: comp,
        hint: `${tenths} dixièmes + ${Math.round(comp * 10)} dixièmes = 1 unité.`
      };
    } else if (difficulty === 'normal') {
      const base = randInt(2, 8);
      const tenths = randInt(1, 9);
      const val = base + tenths / 10;
      const target = base + 1;
      const comp = Math.round((target - val) * 10) / 10;
      return {
        question: `${val.toFixed(1)} + ? = ${target}`,
        answer: comp,
        hint: `Combien de dixièmes manquent pour atteindre ${target} ?`
      };
    } else {
      const cents = pickRandom([15, 25, 35, 45, 65, 75, 85]);
      const val = cents / 100;
      const comp = Math.round((1 - val) * 100) / 100;
      return {
        question: `${val.toFixed(2)} + ? = 1`,
        answer: comp,
        hint: `Complète à 100 centièmes.`
      };
    }
  }

  // Generic fallback if any unknown id
  const a = difficulty === 'facile' ? randInt(2, 6) : difficulty === 'normal' ? randInt(5, 12) : randInt(12, 25);
  const b = difficulty === 'facile' ? randInt(1, 5) : difficulty === 'normal' ? randInt(4, 9) : randInt(9, 15);
  return {
    question: `${a} + ${b} = ?`,
    answer: a + b,
    hint: `Calcule la somme de ${a} et ${b}.`
  };
}
