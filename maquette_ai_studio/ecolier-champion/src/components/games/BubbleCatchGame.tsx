import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, DifficultyLevel } from '../../types';
import { sound } from '../../services/sound';
import { HighScoreService } from '../../services/highScores';
import confetti from 'canvas-confetti';
import { ArrowLeft, Sparkles, Zap, Award, RotateCcw, Eye } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

interface Bubble {
  id: number;
  text: string;
  isCorrect: boolean;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  popped: boolean;
}

export const BubbleCatchGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(35); // 35 seconds round
  const [isGameOver, setIsGameOver] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // Generate a random pool of items based on lesson subject
  const createBubbleItem = useCallback((): { text: string; isCorrect: boolean } => {
    if (lesson.subject === 'maths') {
      // e.g. target sum = 10 for CE1, or multiples for CM2
      if (lesson.grade === 'CE1') {
        const isTarget = Math.random() > 0.45;
        if (isTarget) {
          const a = Math.floor(Math.random() * 9) + 1;
          const b = 10 - a;
          return { text: `${a} + ${b}`, isCorrect: true };
        } else {
          const a = Math.floor(Math.random() * 9) + 1;
          const wrongB = Math.floor(Math.random() * 8) + 1;
          const sum = a + wrongB === 10 ? wrongB + 1 : wrongB;
          return { text: `${a} + ${sum}`, isCorrect: false };
        }
      } else {
        // CM2: Multiples of 5 or 10 or 25%
        const isTarget = Math.random() > 0.45;
        if (isTarget) {
          const mult = [15, 20, 25, 30, 45, 50, 60, 75, 100];
          const val = mult[Math.floor(Math.random() * mult.length)];
          return { text: `${val}`, isCorrect: true };
        } else {
          const nonMult = [13, 17, 22, 29, 33, 41, 57, 73];
          const val = nonMult[Math.floor(Math.random() * nonMult.length)];
          return { text: `${val}`, isCorrect: false };
        }
      }
    } else {
      // Français: Words spelled correctly vs with errors!
      const correctWords = ['toujours', 'beaucoup', 'jamais', 'demain', 'château', 'bateau', 'oiseau'];
      const wrongWords = ['toujour', 'beaucou', 'jammais', 'demin', 'chato', 'bato', 'oizo'];

      const isTarget = Math.random() > 0.45;
      if (isTarget) {
        const w = correctWords[Math.floor(Math.random() * correctWords.length)];
        return { text: w, isCorrect: true };
      } else {
        const w = wrongWords[Math.floor(Math.random() * wrongWords.length)];
        return { text: w, isCorrect: false };
      }
    }
  }, [lesson]);

  // Spawn bubbles periodically
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      setBubbles(prev => {
        // filter out bubbles that scrolled out
        const active = prev.filter(b => b.y > -80 && !b.popped);
        if (active.length >= 8) return active;

        const { text, isCorrect } = createBubbleItem();
        const colors = [
          'from-cyan-400 to-blue-500 border-cyan-300',
          'from-pink-400 to-rose-500 border-pink-300',
          'from-emerald-400 to-teal-500 border-emerald-300',
          'from-amber-400 to-orange-500 border-amber-300',
          'from-purple-400 to-indigo-500 border-purple-300'
        ];

        const newBubble: Bubble = {
          id: Date.now() + Math.random(),
          text,
          isCorrect,
          x: Math.floor(Math.random() * 75) + 10, // 10% to 85%
          y: 380, // starts at bottom
          speed: difficulty === 'expert' ? 2.5 : difficulty === 'normal' ? 1.8 : 1.2,
          size: Math.floor(Math.random() * 15) + 65,
          color: colors[Math.floor(Math.random() * colors.length)],
          popped: false
        };

        return [...active, newBubble];
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isGameOver, difficulty, createBubbleItem]);

  // Physics loop (move bubbles upward)
  useEffect(() => {
    if (isGameOver) return;

    const anim = setInterval(() => {
      setBubbles(prev =>
        prev.map(b => ({
          ...b,
          y: b.y - b.speed
        }))
      );
    }, 30);

    return () => clearInterval(anim);
  }, [isGameOver]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          sound.playFanfare();
          try {
            confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
          } catch {
            // ignore
          }
          const stars = score >= 200 ? 3 : score >= 100 ? 2 : 1;
          const coins = Math.floor(score / 5) + 15;
          onFinish(stars, coins, difficulty);
          HighScoreService.addRecord({
            pupilName: 'Moi',
            pupilAvatar: '🦊',
            gameType: 'bubble-catch',
            gameTitle: 'L\'Attrape-Bulles Galactique',
            score,
            extraInfo: `Score : ${score} pts (Combo x${combo}) 🫧`,
            grade: lesson.grade
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, score, combo, difficulty, lesson.grade, onFinish]);

  const handlePop = (bubble: Bubble) => {
    if (isGameOver || bubble.popped) return;

    if (bubble.isCorrect) {
      sound.playTurbo();
      sound.playSuccess();
      const points = 10 * combo;
      setScore(s => s + points);
      setCombo(c => Math.min(5, c + 1));
      setBubbles(prev =>
        prev.map(b => (b.id === bubble.id ? { ...b, popped: true } : b))
      );
    } else {
      sound.playError();
      setCombo(1);
      setScore(s => Math.max(0, s - 5));
      setBubbles(prev =>
        prev.map(b => (b.id === bubble.id ? { ...b, popped: true } : b))
      );
    }
  };

  const restartGame = (newDiff?: DifficultyLevel) => {
    if (newDiff) setDifficulty(newDiff);
    setScore(0);
    setCombo(1);
    setTimeLeft(35);
    setBubbles([]);
    setIsGameOver(false);
  };

  const instructionText =
    lesson.subject === 'maths'
      ? lesson.grade === 'CE1'
        ? 'Éclate les bulles qui font 10 ! Évite les intrus.'
        : 'Éclate les multiples de 5 ! Évite les nombres pièges.'
      : 'Éclate les mots correctement orthographiés !';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <button
          onClick={() => { sound.playPop(); onBack(); }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-black text-indigo-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>🫧</span> L'Attrape-Bulles Galactique
          </h2>
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
            <Eye size={14} className="text-indigo-600" />
            Canal Visuel & Réflexe : {instructionText}
          </p>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-1 bg-indigo-50 p-1.5 rounded-2xl border border-indigo-200">
          {(['facile', 'normal', 'expert'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => { sound.playPop(); restartGame(lvl); }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {!isGameOver ? (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                <div className="text-2xl font-black text-indigo-900 font-['Fredoka']">{score} pts</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Combo</span>
                <div className="text-base font-black text-amber-600">x{combo} 🔥</div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chrono</span>
              <div className={`text-2xl font-black font-['Fredoka'] ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                ⏱️ {timeLeft}s
              </div>
            </div>
          </div>

          {/* Interactive Floating Arena */}
          <div className="relative h-[420px] bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl border-4 border-indigo-400 overflow-hidden shadow-inner select-none">
            {/* Stars background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-8 left-12 text-sm text-yellow-200 animate-pulse">★</div>
              <div className="absolute top-20 right-24 text-sm text-yellow-200 animate-pulse">✦</div>
              <div className="absolute bottom-16 left-36 text-sm text-yellow-200 animate-pulse">★</div>
              <div className="absolute top-36 left-1/2 text-sm text-yellow-200">✦</div>
            </div>

            {/* Instruction banner in arena */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-yellow-300 text-center shadow-xs">
              👀 {instructionText}
            </div>

            {/* Bubbles */}
            {bubbles.map((b) => {
              if (b.popped) return null;
              return (
                <button
                  key={b.id}
                  onClick={() => handlePop(b)}
                  className={`absolute -translate-x-1/2 rounded-full flex items-center justify-center font-black text-white shadow-lg transition-transform active:scale-90 cursor-pointer bg-gradient-to-tr border-2 hover:scale-105 ${b.color}`}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}px`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    fontSize: b.size < 70 ? '12px' : '14px'
                  }}
                >
                  <span className="drop-shadow-md text-center px-1 font-['Fredoka']">
                    {b.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Game Over / Results */
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-indigo-50 rounded-full text-5xl">
            🫧
          </div>

          <div>
            <h3 className="text-3xl font-black text-indigo-950 font-['Fredoka']">
              CHRONO TERMINÉ !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Ton œil de lynx a repéré un score impressionnant de <strong>{score} points</strong> !
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-indigo-700">⭐ {score >= 200 ? '+3' : score >= 100 ? '+2' : '+1'}</div>
              <span className="text-xs font-bold text-slate-600">Étoiles gagnées</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700">🪙 {Math.floor(score / 5) + 15}</div>
              <span className="text-xs font-bold text-slate-600">Écus gagnés</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => restartGame()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <RotateCcw size={18} />
              Rejouer une partie
            </button>
            <button
              onClick={onBack}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              Retour aux leçons
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
