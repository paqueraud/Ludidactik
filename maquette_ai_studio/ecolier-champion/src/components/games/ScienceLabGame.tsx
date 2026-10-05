import React, { useState } from 'react';
import { Lesson, DifficultyLevel, ScienceItem } from '../../types';
import { SCIENCE_LAB_DATA } from '../../data/curriculum';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Beaker, CheckCircle2, RotateCcw, Sparkles, HelpCircle, XCircle } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

export const ScienceLabGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const questionsList: ScienceItem[] =
    SCIENCE_LAB_DATA[lesson.id]?.[difficulty] ||
    SCIENCE_LAB_DATA['ce1-sciences-etats-eau'].normal;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questionsList[currentIndex % questionsList.length];

  const handleSelect = (idx: number) => {
    if (hasAnswered || isCompleted) return;

    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      sound.playSuccess();
      setScore(prev => prev + 1);
    } else {
      sound.playError();
    }
  };

  const handleNext = () => {
    sound.playPop();
    if (currentIndex + 1 >= questionsList.length) {
      setIsCompleted(true);
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
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    }
  };

  const handleRestart = (newDiff?: DifficultyLevel) => {
    if (newDiff) setDifficulty(newDiff);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <button
          onClick={() => { sound.playPop(); onBack(); }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-black text-emerald-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>🔬</span> Le Laboratoire des Savoirs
          </h2>
          <p className="text-xs text-slate-500 font-semibold">{lesson.title}</p>
        </div>

        {/* 3 Difficulty selector */}
        <div className="flex items-center gap-1 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-200">
          {(['facile', 'normal', 'expert'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playPop();
                handleRestart(lvl);
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {!isCompleted ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Progress badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Beaker size={14} /> Expérience {currentIndex + 1} / {questionsList.length}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Score : {score} point(s)
            </span>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <span className="text-xs font-black tracking-wider uppercase text-emerald-700">
              {currentQ.prompt}
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let style = 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 text-slate-800';

              if (hasAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300';
                } else if (isSelected) {
                  style = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                } else {
                  style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={hasAnswered}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between font-semibold ${style}`}
                >
                  <span>{opt}</span>
                  {hasAnswered && isCorrect && (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0 ml-2" />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle size={20} className="text-rose-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {hasAnswered && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase">
                <HelpCircle size={15} />
                Explication Scientifique
              </div>
              <p className="text-xs md:text-sm text-slate-700 font-medium">
                {currentQ.explanation}
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition-colors text-sm"
                >
                  {currentIndex + 1 >= questionsList.length ? 'Terminer le laboratoire' : 'Expérience suivante ➔'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Final Lab Report */
        <div className="bg-white p-8 rounded-3xl border-2 border-emerald-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-emerald-100 rounded-full text-5xl">
            🧪
          </div>

          <div>
            <h3 className="text-3xl font-black text-emerald-950 font-['Fredoka']">
              EXPÉRIENCE SCIENTIFIQUE RÉUSSIE !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Tu as exploré les merveilles de la science avec curiosité et rigueur.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-emerald-700 flex items-center justify-center gap-1">
                ⭐ {difficulty === 'expert' ? '+3' : difficulty === 'normal' ? '+2' : '+1'}
              </div>
              <span className="text-xs font-bold text-slate-600">Étoiles gagnées</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700 flex items-center justify-center gap-1">
                🪙 {difficulty === 'expert' ? '+25' : difficulty === 'normal' ? '+15' : '+10'}
              </div>
              <span className="text-xs font-bold text-slate-600">Écus de chercheur</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleRestart()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              <RotateCcw size={18} />
              Refaire les expériences
            </button>

            {difficulty !== 'expert' && (
              <button
                onClick={() => handleRestart('expert')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
              >
                <Sparkles size={18} />
                Niveau "Pour aller plus loin" !
              </button>
            )}

            <button
              onClick={onBack}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              Retour aux leçons
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
