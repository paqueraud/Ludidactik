import React, { useState, useEffect, useRef } from 'react';
import { Lesson, DifficultyLevel, MountainWord } from '../../types';
import { MOUNTAIN_WORDS_DATA } from '../../data/curriculum';
import { sound } from '../../services/sound';
import { frenchSpeech } from '../../services/speech';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, Volume1, Sparkles, Check, AlertCircle, Mountain, RotateCcw } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  playerAvatarIcon?: string;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

const ALTITUDE_STAGES = [
  { level: 0, alt: 500, label: 'Camp de Base', bg: 'bg-emerald-100 text-emerald-800' },
  { level: 1, alt: 1200, label: 'Forêt des Sapins', bg: 'bg-teal-100 text-teal-800' },
  { level: 2, alt: 2200, label: 'Refuge des Marmottes', bg: 'bg-cyan-100 text-cyan-800' },
  { level: 3, alt: 3400, label: 'Crête des Glaciers', bg: 'bg-sky-100 text-sky-800' },
  { level: 4, alt: 4807, label: 'Sommet Enneigé 🚩', bg: 'bg-indigo-100 text-indigo-900' }
];

export const MountainClimberGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  playerAvatarIcon = '🦊',
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const wordsList: MountainWord[] = MOUNTAIN_WORDS_DATA[lesson.id]?.[difficulty] || MOUNTAIN_WORDS_DATA['ce1-francais-mots-invariables'].normal;

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [climberStep, setClimberStep] = useState(0); // 0 to 4 (summit)
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'summit'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const currentWordData = wordsList[currentWordIndex % wordsList.length];
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio when word changes or begins
  const playWordAudio = (slow: boolean = false) => {
    if (!currentWordData) return;
    setIsSpeaking(true);
    const textToSay = slow
      ? `${currentWordData.word}`
      : `Écris le mot : ${currentWordData.word}. Exemple : ${currentWordData.sentenceExample}`;

    frenchSpeech.speak(textToSay, slow ? 0.65 : 0.85, () => {
      setIsSpeaking(false);
    });
  };

  useEffect(() => {
    // Speak word upon starting or moving to next
    setUserInput('');
    setStatus('idle');
    setExplanation(null);
    playWordAudio(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWordIndex, difficulty]);

  const cleanString = (str: string) =>
    str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, (m) => m);

  const handleValidate = () => {
    if (status !== 'idle' || !userInput.trim()) return;

    const userWord = userInput.trim().toLowerCase();
    const targetWord = currentWordData.word.trim().toLowerCase();

    if (userWord === targetWord) {
      // SUCCESS: CLIMB UP!
      sound.playStepClimb();
      sound.playSuccess();
      const newStep = climberStep + 1;
      setClimberStep(newStep);
      setStatus('correct');

      if (newStep >= 4) {
        // SUMMIT REACHED!
        setTimeout(() => {
          setStatus('summit');
          sound.playFanfare();
          try {
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.5 }
            });
          } catch {
            // ignore
          }
          const starsEarned = difficulty === 'expert' ? 3 : difficulty === 'normal' ? 2 : 1;
          const coinsEarned = difficulty === 'expert' ? 30 : difficulty === 'normal' ? 20 : 15;
          onFinish(starsEarned, coinsEarned, difficulty);
        }, 1200);
      } else {
        setTimeout(() => {
          setCurrentWordIndex(prev => prev + 1);
        }, 1600);
      }
    } else {
      // MISTAKE: SLIDE DOWN!
      sound.playError();
      const newStep = Math.max(0, climberStep - 1);
      setClimberStep(newStep);
      setStatus('wrong');
      setExplanation(
        `Tu as écrit "${userWord}". La bonne orthographe est "${targetWord}". ${currentWordData.ruleExplanation}`
      );
    }
  };

  const handleRetryCurrentWord = () => {
    setUserInput('');
    setStatus('idle');
    setExplanation(null);
    playWordAudio(false);
  };

  const handleSkipOrContinue = () => {
    setCurrentWordIndex(prev => prev + 1);
  };

  const addAccentedChar = (char: string) => {
    sound.playPop();
    setUserInput(prev => prev + char);
    if (inputRef.current) inputRef.current.focus();
  };

  const currentAlt = ALTITUDE_STAGES[climberStep]?.alt || 500;
  const currentStageName = ALTITUDE_STAGES[climberStep]?.label || 'Camp';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <button
          onClick={() => { sound.playPop(); frenchSpeech.stop(); onBack(); }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-black text-sky-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>🏔️</span> L'Ascension de la Montagne des Mots
          </h2>
          <p className="text-xs text-slate-500 font-semibold">{lesson.title}</p>
        </div>

        {/* 3 Difficulty selector */}
        <div className="flex items-center gap-1 bg-sky-50 p-1.5 rounded-2xl border border-sky-200">
          {(['facile', 'normal', 'expert'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playPop();
                setDifficulty(lvl);
                setClimberStep(0);
                setCurrentWordIndex(0);
                setStatus('idle');
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-800 hover:bg-sky-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Mountain Visual Climbing Wall */}
      <div className="relative bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-100 rounded-3xl p-6 border-4 border-sky-300 shadow-md min-h-[300px] overflow-hidden flex flex-col justify-between">
        {/* Sky Clouds & Sun */}
        <div className="absolute top-3 left-8 text-3xl opacity-75">☁️</div>
        <div className="absolute top-6 right-20 text-3xl opacity-80">☁️</div>
        <div className="absolute top-4 right-6 text-4xl">☀️</div>

        {/* Mountain Slope Graphic */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 320"
          preserveAspectRatio="none"
        >
          {/* Snowy Mountain Peak */}
          <polygon
            points="0,320 200,160 400,60 550,40 700,120 800,320"
            fill="#e2e8f0"
            opacity="0.8"
          />
          {/* Snow cap */}
          <polygon points="360,80 400,60 550,40 580,75 510,95 440,75" fill="#ffffff" />
          {/* Climbing Trail Path */}
          <path
            d="M 100 290 Q 240 230, 320 180 T 500 90 T 550 50"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="4"
            strokeDasharray="8 6"
          />
        </svg>

        {/* Altitude & Summit Flag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-sky-100 flex items-center gap-2">
            <Mountain size={20} className="text-sky-600" />
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Altitude actuelle</div>
              <div className="text-base font-black text-sky-900">{currentAlt} mètres ({currentStageName})</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-sky-100 text-right">
            <span className="text-xs font-bold text-slate-500">Objectif Sommet</span>
            <div className="text-base font-black text-indigo-900 flex items-center gap-1 justify-end">
              <span>🚩 4 807 m</span>
            </div>
          </div>
        </div>

        {/* Mountain Path Stations with Climber */}
        <div className="relative z-10 py-6">
          <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto">
            {ALTITUDE_STAGES.map((st, idx) => {
              const isCurrent = climberStep === idx;
              const isPassed = climberStep > idx;
              return (
                <div key={st.level} className="flex flex-col items-center text-center space-y-1">
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-white ring-4 ring-white shadow-lg scale-110'
                        : isPassed
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white/70 text-slate-400 border border-white'
                    }`}
                  >
                    {isCurrent ? (
                      <span className="text-2xl animate-bounce">{playerAvatarIcon}</span>
                    ) : isPassed ? (
                      <Check size={24} className="stroke-[3]" />
                    ) : (
                      <span className="text-xs font-bold">{st.alt}m</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-full shadow-xs">
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elevation status badge */}
        <div className="relative z-10 text-center">
          <span className="text-xs font-bold bg-white/90 text-sky-950 px-4 py-1.5 rounded-full shadow-xs">
            {climberStep === 0 && 'Camp de départ : écoute attentivement le premier mot !'}
            {climberStep === 1 && '🌲 Super ! Tu franchis la forêt des sapins sans faute.'}
            {climberStep === 2 && '🦫 Tu atteins le refuge ! L\'air se rafraîchit.'}
            {climberStep === 3 && '❄️ Presque au sommet ! Plus qu\'un mot bien orthographié.'}
            {climberStep === 4 && '🚩 VICTOIRE AU SOMMET DE LA MONTAGNE !'}
          </span>
        </div>
      </div>

      {/* Dictation & Input Area */}
      {status !== 'summit' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Audio Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 bg-sky-50/70 p-5 rounded-2xl border border-sky-100">
            <button
              onClick={() => playWordAudio(false)}
              className="flex items-center gap-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95"
            >
              <Volume2 size={22} className={isSpeaking ? 'animate-pulse' : ''} />
              <span>Écouter la dictée</span>
            </button>

            <button
              onClick={() => playWordAudio(true)}
              className="flex items-center gap-2 bg-white hover:bg-sky-100 text-sky-800 font-bold px-4 py-3 rounded-2xl border border-sky-200 transition-all active:scale-95"
              title="Prononce le mot lentement son par son"
            >
              <Volume1 size={20} />
              <span>Écouter au ralenti</span>
            </button>
          </div>

          {/* Sentence Context Hint */}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-500 italic">
              " {currentWordData.sentenceExample.replace(new RegExp(`\\b${currentWordData.word}\\b`, 'gi'), '_____')} "
            </p>
            <span className="text-xs font-bold text-sky-700 mt-1 inline-block">
              {currentWordData.difficultyBadge}
            </span>
          </div>

          {/* User Input & Virtual Accents */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleValidate();
                }}
                disabled={status === 'correct'}
                placeholder="Tape le mot ici..."
                className={`w-full text-center text-2xl font-black px-4 py-3.5 rounded-2xl border-2 outline-none transition-all ${
                  status === 'wrong'
                    ? 'border-rose-400 bg-rose-50 text-rose-900'
                    : status === 'correct'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                    : 'border-sky-300 focus:border-sky-500 bg-slate-50 focus:bg-white text-slate-800'
                }`}
              />

              <button
                onClick={handleValidate}
                disabled={!userInput.trim() || status !== 'idle'}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black px-6 py-4 rounded-2xl shadow-sm transition-all shrink-0"
              >
                Grimper !
              </button>
            </div>

            {/* Quick French accents bar (critical for kids and touchscreen tablets) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">Accents :</span>
              {['é', 'è', 'ê', 'à', 'ç', 'ô', 'î', 'û', 'ï', "'"].map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => addAccentedChar(acc)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-sky-100 border border-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback & Correction Banner */}
          {status === 'wrong' && (
            <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-2xl space-y-3 animate-shake">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-black text-rose-900 text-sm md:text-base">
                    Glissade sur la pente ! Tu redescends d'un palier.
                  </h4>
                  <p className="text-xs md:text-sm font-semibold text-rose-800 mt-1">
                    {explanation}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleRetryCurrentWord}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <RotateCcw size={15} />
                  Réécrire le mot correctement
                </button>

                <button
                  onClick={handleSkipOrContinue}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 px-3 py-2"
                >
                  Mot suivant
                </button>
              </div>
            </div>
          )}

          {status === 'correct' && (
            <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-center gap-3">
              <Check className="text-emerald-600" size={24} />
              <span className="font-black text-emerald-900">
                Parfait ! Aucune faute. L'alpiniste hisse sa corde vers le palier suivant !
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Summit Reached Celebration */
        <div className="bg-white p-8 rounded-3xl border-2 border-sky-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-sky-100 rounded-full text-5xl">
            🚩
          </div>

          <div>
            <h3 className="text-3xl font-black text-sky-950 font-['Fredoka']">
              LE DRAPEAU EST PLANTÉ AU SOMMET !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Tu as gravi la montagne des mots sans trébucher sur l'orthographe. Bravo champion !
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-sky-700 flex items-center justify-center gap-1">
                ⭐ {difficulty === 'expert' ? '+3' : difficulty === 'normal' ? '+2' : '+1'}
              </div>
              <span className="text-xs font-bold text-slate-600">Étoiles d'alpiniste</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700 flex items-center justify-center gap-1">
                🪙 {difficulty === 'expert' ? '+30' : difficulty === 'normal' ? '+20' : '+15'}
              </div>
              <span className="text-xs font-bold text-slate-600">Écus gagnés</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setClimberStep(0);
                setCurrentWordIndex(0);
                setStatus('idle');
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              <RotateCcw size={18} />
              Recommencer l'ascension
            </button>

            {difficulty !== 'expert' && (
              <button
                onClick={() => {
                  setDifficulty('expert');
                  setClimberStep(0);
                  setCurrentWordIndex(0);
                  setStatus('idle');
                }}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
              >
                <Sparkles size={18} />
                Gravir "Pour aller plus loin" !
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
