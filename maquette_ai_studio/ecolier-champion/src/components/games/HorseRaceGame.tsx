import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, DifficultyLevel, HorseQuestion } from '../../types';
import { generateRandomHorseQuestion } from '../../services/mathGenerator';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Zap, Sparkles, CheckCircle2, RotateCcw, Award } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  playerHorseColor?: string;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

interface Rival {
  name: string;
  emoji: string;
  color: string;
  progress: number;
  baseSpeed: number;
}

export const HorseRaceGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  playerHorseColor = 'brown',
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);

  // Dynamic random questions generated on-the-fly!
  const [currentQ, setCurrentQ] = useState<HorseQuestion>(() =>
    generateRandomHorseQuestion(lesson.id, initialDifficulty)
  );

  const [currentInput, setCurrentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'turbo' | 'success' | 'wrong' | null; message: string }>({
    type: null,
    message: ''
  });

  const [playerProgress, setPlayerProgress] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [turboActive, setTurboActive] = useState(false);

  // Question timer
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rivals on tracks 2, 3, 4
  const [rivals, setRivals] = useState<Rival[]>([
    { name: 'Tornade', emoji: '🐴', color: 'bg-emerald-500', progress: 5, baseSpeed: 0.22 },
    { name: 'Éclair', emoji: '🦓', color: 'bg-blue-500', progress: 5, baseSpeed: 0.18 },
    { name: 'Galopin', emoji: '🦄', color: 'bg-purple-500', progress: 5, baseSpeed: 0.15 }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Tick for question timer
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      const sec = (Date.now() - questionStartTime) / 1000;
      setElapsedSeconds(Math.min(15, sec));
    }, 100);
    return () => clearInterval(interval);
  }, [questionStartTime, isGameOver]);

  // Rivals loop
  useEffect(() => {
    if (isGameOver) return;

    const rivalInterval = setInterval(() => {
      setRivals(prev =>
        prev.map(rival => {
          const delta = rival.baseSpeed * (0.8 + Math.random() * 0.4);
          const newProgress = Math.min(98, rival.progress + delta);
          return { ...rival, progress: newProgress };
        })
      );
    }, 300);

    return () => clearInterval(rivalInterval);
  }, [isGameOver]);

  // Check finish line
  useEffect(() => {
    if (isGameOver) return;

    if (playerProgress >= 95) {
      setIsGameOver(true);
      sound.playFanfare();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
      const starsEarned = difficulty === 'expert' ? 3 : difficulty === 'normal' ? 2 : 1;
      const coinsEarned = difficulty === 'expert' ? 25 : difficulty === 'normal' ? 15 : 10;
      onFinish(starsEarned, coinsEarned, difficulty);
    }
  }, [playerProgress, isGameOver, difficulty, onFinish]);

  const loadNextRandomQuestion = useCallback(() => {
    setCurrentQ(generateRandomHorseQuestion(lesson.id, difficulty));
    setCurrentInput('');
    setQuestionStartTime(Date.now());
    setFeedback({ type: null, message: '' });
  }, [lesson.id, difficulty]);

  const handleSubmit = useCallback((answerStr: string) => {
    if (isGameOver || !answerStr.trim()) return;

    const numericVal = parseFloat(answerStr.replace(',', '.'));
    const isCorrect = Math.abs(numericVal - currentQ.answer) < 0.001;
    const timeTaken = (Date.now() - questionStartTime) / 1000;

    if (isCorrect) {
      let leap = 14;
      if (timeTaken <= 3.0) {
        // TURBO BOOST
        leap = 24;
        sound.playTurbo();
        setTurboActive(true);
        setTimeout(() => setTurboActive(false), 900);
        setFeedback({ type: 'turbo', message: '🚀 TURBO SUPER VITESSE ! (-3s)' });
      } else if (timeTaken <= 6.0) {
        leap = 18;
        sound.playSuccess();
        sound.playGallop();
        setFeedback({ type: 'success', message: '🐎 Superbe galop !' });
      } else {
        leap = 12;
        sound.playSuccess();
        setFeedback({ type: 'success', message: '✅ Bonne réponse !' });
      }

      setPlayerProgress(prev => Math.min(96, prev + leap));

      setTimeout(() => {
        loadNextRandomQuestion();
      }, 700);
    } else {
      sound.playError();
      setFeedback({
        type: 'wrong',
        message: `Oups ! La bonne réponse était ${currentQ.answer}. Astuce : ${currentQ.hint}`
      });
      // slight stumble
      setPlayerProgress(prev => Math.max(5, prev - 3));
      setTimeout(() => {
        loadNextRandomQuestion();
      }, 2200);
    }
  }, [isGameOver, currentQ, questionStartTime, loadNextRandomQuestion]);

  const handleKeyPress = (char: string) => {
    if (isGameOver) return;
    sound.playPop();
    if (char === 'DEL') {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (char === 'OK') {
      handleSubmit(currentInput);
    } else {
      if (currentInput.length < 6) {
        setCurrentInput(prev => prev + char);
      }
    }
  };

  const restartRace = (newDiff?: DifficultyLevel) => {
    const activeDiff = newDiff || difficulty;
    if (newDiff) setDifficulty(newDiff);
    setPlayerProgress(5);
    setRivals([
      { name: 'Tornade', emoji: '🐴', color: 'bg-emerald-500', progress: 5, baseSpeed: 0.22 },
      { name: 'Éclair', emoji: '🦓', color: 'bg-blue-500', progress: 5, baseSpeed: 0.18 },
      { name: 'Galopin', emoji: '🦄', color: 'bg-purple-500', progress: 5, baseSpeed: 0.15 }
    ]);
    setIsGameOver(false);
    // Generate a fresh new random question for the new race!
    setCurrentQ(generateRandomHorseQuestion(lesson.id, activeDiff));
    setCurrentInput('');
    setQuestionStartTime(Date.now());
    setFeedback({ type: null, message: '' });
  };

  const horseEmoji = playerHorseColor === 'white' ? '🦄' : playerHorseColor === 'golden' ? '⭐🐴' : playerHorseColor === 'black' ? '🖤🐴' : '🐎';

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
          <h2 className="text-xl md:text-2xl font-black text-amber-900 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>🐎</span> La Grande Course de Calcul
          </h2>
          <p className="text-xs text-slate-500 font-semibold">{lesson.title}</p>
        </div>

        {/* 3 Difficulty selector */}
        <div className="flex items-center gap-1 bg-amber-50 p-1.5 rounded-2xl border border-amber-200">
          {(['facile', 'normal', 'expert'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playPop();
                restartRace(lvl);
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Racetrack Arena */}
      <div className="relative bg-gradient-to-b from-emerald-100 via-emerald-50 to-amber-100 p-5 rounded-3xl border-4 border-amber-300 shadow-inner overflow-hidden">
        {/* Scenery details */}
        <div className="absolute top-2 left-6 text-2xl opacity-40">🌲 🌳 🌲</div>
        <div className="absolute top-2 right-12 text-2xl opacity-40">🏟️ 🚩 🏁</div>

        {/* Finish line checkerboard flag line */}
        <div className="absolute top-0 right-10 bottom-0 w-6 flex flex-col justify-around z-0 opacity-80 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`h-4 w-full ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} />
          ))}
        </div>

        <div className="space-y-4 relative z-10 py-2">
          {/* Lane 1: Player Horse */}
          <div className="relative bg-white/90 backdrop-blur-sm p-3 rounded-2xl border-2 border-amber-400 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
              <span className="flex items-center gap-1">
                <span className="bg-amber-400 text-white px-2 py-0.5 rounded-full text-[10px]">TOI</span>
                Ton Pur-Sang Champion
              </span>
              <span>{Math.round(playerProgress)}% de la piste</span>
            </div>

            {/* Track Bar */}
            <div className="h-10 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-300 to-amber-500 rounded-xl transition-all duration-500 ease-out"
                style={{ width: `${playerProgress}%` }}
              />

              {/* Horse Avatar Figure */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl transition-all duration-500 ease-out flex items-center ${
                  turboActive ? 'scale-125 animate-bounce' : ''
                }`}
                style={{ left: `${Math.max(5, Math.min(94, playerProgress))}%` }}
              >
                <span>{horseEmoji}</span>
                {turboActive && <span className="text-xl animate-pulse">🔥</span>}
              </div>
            </div>
          </div>

          {/* Lanes 2, 3, 4: Rivals */}
          {rivals.map((rival) => (
            <div key={rival.name} className="relative bg-white/60 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">{rival.emoji}</span>
                  {rival.name}
                </span>
                <span>{Math.round(rival.progress)}%</span>
              </div>
              <div className="h-7 bg-slate-100 rounded-xl relative overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 left-0 opacity-40 rounded-xl transition-all duration-300 ${rival.color}`}
                  style={{ width: `${rival.progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-lg transition-all duration-300"
                  style={{ left: `${Math.max(4, Math.min(94, rival.progress))}%` }}
                >
                  {rival.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Interactive Action Zone */}
      {!isGameOver ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          {/* Question Banner (Left/Top) */}
          <div className="md:col-span-6 flex flex-col justify-center items-center text-center space-y-4 bg-amber-50/70 p-6 rounded-3xl border border-amber-200">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full">
              <Zap size={14} className="text-amber-600 fill-amber-600" />
              Réponds vite pour activer le TURBO !
            </div>

            <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-wider font-['Fredoka'] py-3">
              {currentQ.question}
            </div>

            {/* Answer Display Box */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-500">=</span>
              <div className="min-w-32 h-14 bg-white border-2 border-amber-400 rounded-2xl shadow-inner flex items-center justify-center text-3xl font-black text-amber-950 px-4">
                {currentInput || <span className="text-slate-300 animate-pulse">?</span>}
              </div>
            </div>

            {/* Speedometer indicator */}
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  ⚡ Turbo (&lt;3s)
                </span>
                <span className="text-slate-500">Chrono : {elapsedSeconds.toFixed(1)}s</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    elapsedSeconds < 3
                      ? 'bg-emerald-500'
                      : elapsedSeconds < 6
                      ? 'bg-amber-500'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.max(0, 100 - (elapsedSeconds / 10) * 100)}%` }}
                />
              </div>
            </div>

            {/* Real-time Feedback Toast */}
            {feedback.message && (
              <div
                className={`p-3 rounded-2xl text-xs md:text-sm font-bold transition-all ${
                  feedback.type === 'turbo'
                    ? 'bg-amber-400 text-amber-950 animate-bounce'
                    : feedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          {/* Large Keypad (Right/Bottom) */}
          <div className="md:col-span-6 flex flex-col justify-center items-center">
            {/* Native keyboard hidden input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              className="sr-only"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(currentInput);
              }}
              autoFocus
            />

            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'OK'].map((key) => {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-sm border ${
                      key === 'OK'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'
                        : key === 'DEL'
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 hover:border-amber-400'
                    }`}
                  >
                    {key === 'DEL' ? '⌫' : key === 'OK' ? 'Valider' : key}
                  </button>
                );
              })}
            </div>

            {/* Hint bar below keypad */}
            <div className="mt-3 text-center text-xs text-slate-500">
              💡 Astuce BO : {currentQ.hint}
            </div>
          </div>
        </div>
      ) : (
        /* Winner Podium Display */
        <div className="bg-white p-8 rounded-3xl border-2 border-amber-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-amber-100 rounded-full text-5xl">
            🏆
          </div>

          <div>
            <h3 className="text-3xl font-black text-amber-900 font-['Fredoka']">
              VICTOIRE SUR L'HIPPODROME !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Ton cheval franchit la ligne d'arrivée en tête ! Bravo pour tes réflexes de calcul mental.
            </p>
          </div>

          {/* Reward Badges */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                ⭐ {difficulty === 'expert' ? '+3' : difficulty === 'normal' ? '+2' : '+1'}
              </div>
              <span className="text-xs font-bold text-slate-600">Étoiles gagnées</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700 flex items-center justify-center gap-1">
                🪙 {difficulty === 'expert' ? '+25' : difficulty === 'normal' ? '+15' : '+10'}
              </div>
              <span className="text-xs font-bold text-slate-600">Écus de champion</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-xs font-bold text-slate-600">Niveau {difficulty} validé !</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => restartRace()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              <RotateCcw size={18} />
              Rejouer avec de NOUVEAUX calculs
            </button>

            {difficulty !== 'expert' && (
              <button
                onClick={() => restartRace('expert')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
              >
                <Sparkles size={18} />
                Tenter "Pour aller plus loin" !
              </button>
            )}

            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <Award size={18} />
              Choisir une autre leçon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
