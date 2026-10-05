import React, { useState } from 'react';
import { Lesson, DifficultyLevel, HistoryQuestion } from '../../types';
import { HISTORY_QUESTIONS_DATA } from '../../data/curriculum';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, RotateCcw, BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  playerAvatarIcon?: string;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
  onOpenMemo?: () => void;
}

export const HistoryChallengerGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  playerAvatarIcon = '🦊',
  onFinish,
  onBack,
  onOpenMemo
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const questionsList: HistoryQuestion[] =
    HISTORY_QUESTIONS_DATA[lesson.id]?.[difficulty] ||
    HISTORY_QUESTIONS_DATA['cm2-histoire-revolution-1789'].normal;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [bladeDrops, setBladeDrops] = useState(0); // 0 (up) to 3 (lost head!)
  const maxDrops = 3;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isLostHead, setIsLostHead] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  const currentQ = questionsList[currentIndex % questionsList.length];

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || isLostHead || isVictory) return;

    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      sound.playSuccess();
      const newScore = correctAnswersCount + 1;
      setCorrectAnswersCount(newScore);

      // Check for victory condition (3 good answers or finishing all questions)
      if (newScore >= 3 || currentIndex + 1 >= questionsList.length) {
        setTimeout(() => {
          setIsVictory(true);
          sound.playFanfare();
          try {
            confetti({
              particleCount: 130,
              spread: 100,
              origin: { y: 0.5 }
            });
          } catch {
            // ignore
          }
          const starsEarned = difficulty === 'expert' ? 3 : difficulty === 'normal' ? 2 : 1;
          const coinsEarned = difficulty === 'expert' ? 35 : difficulty === 'normal' ? 25 : 15;
          onFinish(starsEarned, coinsEarned, difficulty);
        }, 1800);
      }
    } else {
      // Guillotine blade drops!
      sound.playGuillotineDrop();
      const newDrops = bladeDrops + 1;
      setBladeDrops(newDrops);

      if (newDrops >= maxDrops) {
        // "VOUS AVEZ PERDU LA TÊTE !!" (Cartoon loss)
        setTimeout(() => {
          setIsLostHead(true);
        }, 1400);
      }
    }
  };

  const handleNextQuestion = () => {
    sound.playPop();
    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleRestart = (newDiff?: DifficultyLevel) => {
    if (newDiff) setDifficulty(newDiff);
    setCurrentIndex(0);
    setBladeDrops(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setCorrectAnswersCount(0);
    setIsLostHead(false);
    setIsVictory(false);
  };

  // Visual blade height calculation: 0 = top (10%), 1 = 35%, 2 = 65%, 3 = bottom (85%)
  const bladePositions = ['top-[10%]', 'top-[36%]', 'top-[60%]', 'top-[82%]'];
  const currentBladePos = bladePositions[Math.min(bladeDrops, 3)];

  const isRevolutionTheme = lesson.id.includes('revolution');

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
          <h2 className="text-xl md:text-2xl font-black text-amber-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>⚖️</span> {isRevolutionTheme ? 'Le Défi de la Révolution : Sauve ta tête !' : 'Le Grand Défi du Temps'}
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
                handleRestart(lvl);
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Challenge Stage */}
      {!isLostHead && !isVictory ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Guillotine / Mechanism Column (Left: 4 cols) */}
          <div className="md:col-span-5 bg-gradient-to-b from-amber-900 via-stone-800 to-stone-900 text-white p-5 rounded-3xl shadow-lg border-4 border-amber-800 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
            {/* Historical Header */}
            <div className="relative z-10 flex items-center justify-between text-xs font-bold text-amber-200 border-b border-amber-700/50 pb-2">
              <span className="flex items-center gap-1.5">
                <Shield size={16} className="text-amber-400" />
                {isRevolutionTheme ? 'Tribunal de 1789' : 'Chronomètre Historique'}
              </span>
              <span>Lame : Cran {bladeDrops}/{maxDrops}</span>
            </div>

            {/* Antique Guillotine Mechanical Apparatus Graphic */}
            <div className="relative z-10 flex-1 my-4 flex items-center justify-center">
              <div className="relative w-48 h-64 border-x-8 border-amber-700 bg-stone-900/60 rounded-t-lg shadow-inner">
                {/* Top Wooden Crossbeam */}
                <div className="absolute -top-3 -left-3 -right-3 h-6 bg-amber-800 border-2 border-amber-950 rounded shadow-md flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-stone-400 border border-black shadow-inner" />
                </div>

                {/* Rope pulley */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-12 border-l-2 border-dashed border-amber-300" />

                {/* THE BLADE (Moves down with each mistake) */}
                <div
                  className={`absolute left-2 right-2 transition-all duration-700 ease-in-out ${currentBladePos}`}
                >
                  <div className="relative">
                    {/* Metal triangular blade */}
                    <div className="h-10 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 border border-slate-500 shadow-md transform skew-y-6 flex items-center justify-center">
                      <span className="text-[10px] text-slate-600 font-mono font-bold tracking-widest">
                        LIBERTÉ 1789
                      </span>
                    </div>
                    {/* Weight block on top */}
                    <div className="h-3 bg-amber-950 border border-black -mt-1 rounded-xs" />
                  </div>
                </div>

                {/* Bottom Headrest Cushion (Playful & safe cartoon Lunette) */}
                <div className="absolute bottom-2 left-2 right-2 h-14 bg-amber-950 border-t-4 border-amber-800 rounded-b flex flex-col items-center justify-center text-center p-1">
                  <div className="w-12 h-10 rounded-full border-2 border-amber-700 bg-stone-800 flex items-center justify-center">
                    <span className="text-2xl animate-pulse">{playerAvatarIcon}</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-bold uppercase mt-0.5">
                    Citoyen Intact
                  </span>
                </div>
              </div>
            </div>

            {/* Blade Warning State */}
            <div className="relative z-10 text-center">
              {bladeDrops === 0 && (
                <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500 px-3 py-1 rounded-full">
                  🛡️ Lame suspendue : Ta tête est bien en sécurité !
                </span>
              )}
              {bladeDrops === 1 && (
                <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-500 px-3 py-1 rounded-full">
                  ⚠️ 1er cran franchi : Reste concentré sur la date !
                </span>
              )}
              {bladeDrops === 2 && (
                <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-500 px-3 py-1 rounded-full animate-bounce">
                  🚨 DANGER IMMINENT : Plus qu'une seule erreur !
                </span>
              )}
            </div>
          </div>

          {/* Question & Answers Column (Right: 7 cols) */}
          <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              {/* Question metadata */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Question {currentIndex + 1} / {questionsList.length}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {correctAnswersCount} bonne(s) réponse(s)
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'bg-slate-50 hover:bg-amber-50/70 border-slate-200 text-slate-800';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm md:text-base font-semibold ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {hasAnswered && isCorrect && (
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0 ml-2" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <AlertTriangle size={20} className="text-rose-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Historical Insight & Explanation (Appears after answer) */}
            {hasAnswered && (
              <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase">
                  <BookOpen size={15} />
                  Le Saviez-vous ? (Éclairage Historique)
                </div>
                <p className="text-xs md:text-sm text-slate-700 font-medium">
                  {currentQ.historicalContext}
                </p>
                <p className="text-xs text-amber-800 italic font-semibold">
                  💡 Anecdote : {currentQ.anecdote}
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition-colors text-sm"
                  >
                    Question suivante ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : isLostHead ? (
        /* SPECIAL REQUESTED SCREEN: "VOUS AVEZ PERDU LA TÊTE !!" (Cartoon / Humor, No head cut off) */
        <div className="bg-white p-8 md:p-10 rounded-3xl border-4 border-rose-300 text-center space-y-6 shadow-xl animate-shake">
          {/* Cartoon flying wig and spinning dizzy stars */}
          <div className="relative inline-block mx-auto">
            <div className="text-7xl p-4 bg-rose-50 rounded-full border-2 border-rose-200 inline-block animate-spin">
              💫
            </div>
            <div className="absolute -top-3 -right-3 text-4xl animate-bounce">
              👨‍🦳💨
            </div>
          </div>

          <div>
            <div className="inline-block bg-rose-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider mb-2">
              Décret Révolutionnaire Humoristique
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-rose-700 font-['Fredoka'] tracking-wide">
              VOUS AVEZ PERDU LA TÊTE !!
            </h3>
            <p className="text-slate-600 font-semibold max-w-lg mx-auto mt-2 text-sm md:text-base">
              Pas de panique ! Robespierre a seulement confisqué votre perruque poudrée d'aristocrate pour excès de confusion sur les dates de 1789 !
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <HelpCircle size={18} />
              Conseil du Professeur des Écoles :
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Relis bien le Mémo du Maître : le 14 juillet 1789 est la prise de la Bastille, le Tiers-État payait tous les impôts, et les Sans-Culottes portaient des pantalons rayés.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleRestart()}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <RotateCcw size={18} />
              Reprendre ses esprits et rejouer
            </button>

            {onOpenMemo && (
              <button
                onClick={onOpenMemo}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
              >
                <BookOpen size={18} />
                Réviser le Mémo du Maître
              </button>
            )}

            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-800 font-bold px-4 py-3"
            >
              Retour aux leçons
            </button>
          </div>
        </div>
      ) : (
        /* VICTORY: YOU SAVED YOUR HEAD AND DEFENDED CITIZENSHIP! */
        <div className="bg-white p-8 md:p-10 rounded-3xl border-4 border-emerald-300 text-center space-y-6 shadow-xl">
          <div className="inline-block p-4 bg-emerald-50 rounded-full text-5xl">
            🇫🇷
          </div>

          <div>
            <div className="inline-block bg-emerald-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider mb-2">
              Citoyen Exemplaire
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-emerald-900 font-['Fredoka']">
              TÊTE SAUVÉE ET COURONNE DE LAURIER !
            </h3>
            <p className="text-slate-600 font-semibold max-w-lg mx-auto mt-2 text-sm md:text-base">
              La guillotine est restée verrouillée tout en haut ! Tu as répondu avec brio à toutes les énigmes de l'Histoire de France.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-emerald-700 flex items-center justify-center gap-1">
                ⭐ {difficulty === 'expert' ? '+3' : difficulty === 'normal' ? '+2' : '+1'}
              </div>
              <span className="text-xs font-bold text-slate-600">Étoiles d'Histoire</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700 flex items-center justify-center gap-1">
                🪙 {difficulty === 'expert' ? '+35' : difficulty === 'normal' ? '+25' : '+15'}
              </div>
              <span className="text-xs font-bold text-slate-600">Écus républicains</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleRestart()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              <RotateCcw size={18} />
              Rejouer
            </button>

            {difficulty !== 'expert' && (
              <button
                onClick={() => handleRestart('expert')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
              >
                <Sparkles size={18} />
                Défier le niveau "Pour aller plus loin" !
              </button>
            )}

            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              Autre leçon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
