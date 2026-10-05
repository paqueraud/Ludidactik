import React, { useState, useEffect } from 'react';
import { Lesson, DifficultyLevel } from '../../types';
import { sound } from '../../services/sound';
import { frenchSpeech } from '../../services/speech';
import { HighScoreService } from '../../services/highScores';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, Volume1, CheckCircle2, RotateCcw, Headphones, Train, Sparkles } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

interface TrainQuestion {
  sentenceAudio: string;
  missingWordDisplay: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CE1_SOUND_QUESTIONS: TrainQuestion[] = [
  {
    sentenceAudio: 'Les oiseaux chantent dans le grand chêne.',
    missingWordDisplay: 'Les ____ chantent dans le grand chêne.',
    options: ['oiseaux', 'oiseau', 'oiseaus'],
    correctIndex: 0,
    explanation: 'Au pluriel, "oiseau" prend un "x" car il se termine par -eau !'
  },
  {
    sentenceAudio: 'Il a pris son manteau pour sortir.',
    missingWordDisplay: 'Il a pris ____ manteau pour sortir.',
    options: ['son', 'sont'],
    correctIndex: 0,
    explanation: 'C\'est le sien (déterminant possessif), remplaçable par "mon" : "son" sans t.'
  },
  {
    sentenceAudio: 'Ils sont contents de jouer ensemble.',
    missingWordDisplay: 'Ils ____ contents de jouer ensemble.',
    options: ['sont', 'son'],
    correctIndex: 0,
    explanation: 'On peut dire "Ils étaient contents", c\'est le verbe être : "sont" avec -nt.'
  },
  {
    sentenceAudio: 'Tu viens avec nous à la piscine ?',
    missingWordDisplay: 'Tu viens ____ nous à la piscine ?',
    options: ['avec', 'aves', 'avecque'],
    correctIndex: 0,
    explanation: '"avec" est un mot invariable qui s\'écrit toujours a-v-e-c.'
  }
];

const CM2_SOUND_QUESTIONS: TrainQuestion[] = [
  {
    sentenceAudio: 'Léo a terminé ses devoirs à l\'heure.',
    missingWordDisplay: 'Léo ____ terminé ses devoirs à l\'heure.',
    options: ['a', 'à'],
    correctIndex: 0,
    explanation: 'On peut dire "Léo avait terminé" : verbe avoir sans accent !'
  },
  {
    sentenceAudio: 'Nous partons à la mer pour les vacances.',
    missingWordDisplay: 'Nous partons ____ la mer pour les vacances.',
    options: ['à', 'a'],
    correctIndex: 0,
    explanation: 'On ne peut pas dire "partons avait la mer" : préposition à avec accent.'
  },
  {
    sentenceAudio: 'Il aime la géographie et les mathématiques.',
    missingWordDisplay: 'Il aime la géographie ____ les mathématiques.',
    options: ['et', 'est'],
    correctIndex: 0,
    explanation: 'On peut dire "et puis", donc c\'est la conjonction de coordination "et".'
  },
  {
    sentenceAudio: 'Le soleil est éclatant aujourd\'hui.',
    missingWordDisplay: 'Le soleil ____ éclatant aujourd\'hui.',
    options: ['est', 'et'],
    correctIndex: 0,
    explanation: 'On peut dire "Le soleil ÉTAIT éclatant" : c\'est le verbe être "est".'
  },
  {
    sentenceAudio: 'Ils ont gagné la médaille d\'or.',
    missingWordDisplay: 'Ils ____ gagné la médaille d\'or.',
    options: ['ont', 'on'],
    correctIndex: 0,
    explanation: 'On peut dire "avaient gagné" : verbe avoir pluriel "ont".'
  }
];

export const SoundTrainGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const questions = lesson.grade === 'CE1' ? CE1_SOUND_QUESTIONS : CM2_SOUND_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [trainProgress, setTrainProgress] = useState(10); // % along track
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [hasResolved, setHasResolved] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const currentQ = questions[currentIndex % questions.length];

  const playSentence = (slow: boolean = false) => {
    setIsAudioPlaying(true);
    frenchSpeech.speak(currentQ.sentenceAudio, slow ? 0.65 : 0.85, () => {
      setIsAudioPlaying(false);
    });
  };

  useEffect(() => {
    setTrainProgress(10);
    setSelectedTrack(null);
    setHasResolved(false);
    playSentence(false);
  }, [currentIndex, difficulty]);

  // Train animation toward junction
  useEffect(() => {
    if (hasResolved || isGameOver) return;

    const interval = setInterval(() => {
      setTrainProgress(p => {
        if (p >= 75) {
          // Reached switch point!
          return 75;
        }
        return p + (difficulty === 'expert' ? 2.5 : difficulty === 'normal' ? 1.8 : 1.2);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [hasResolved, isGameOver, difficulty]);

  const handleSwitchTrack = (trackIndex: number) => {
    if (hasResolved || isGameOver) return;

    setSelectedTrack(trackIndex);
    setHasResolved(true);
    setTrainProgress(95);

    const isCorrect = trackIndex === currentQ.correctIndex;
    if (isCorrect) {
      sound.playTurbo();
      sound.playSuccess();
      setScore(s => s + 100);

      if (currentIndex + 1 >= questions.length) {
        setTimeout(() => {
          setIsGameOver(true);
          sound.playFanfare();
          try {
            confetti({ particleCount: 110, spread: 90, origin: { y: 0.5 } });
          } catch {
            // ignore
          }
          const starsEarned = difficulty === 'expert' ? 3 : difficulty === 'normal' ? 2 : 1;
          const coinsEarned = difficulty === 'expert' ? 30 : difficulty === 'normal' ? 20 : 15;
          onFinish(starsEarned, coinsEarned, difficulty);
          HighScoreService.addRecord({
            pupilName: 'Moi',
            pupilAvatar: '🦊',
            gameType: 'sound-train',
            gameTitle: 'Le Train des Sons & Aiguillages',
            score: score + 100,
            extraInfo: `${questions.length}/${questions.length} trains à l'heure 🚂`,
            grade: lesson.grade
          });
        }, 1500);
      }
    } else {
      sound.playError();
    }
  };

  const nextTrain = () => {
    setCurrentIndex(i => i + 1);
  };

  const restartGame = (newDiff?: DifficultyLevel) => {
    if (newDiff) setDifficulty(newDiff);
    setCurrentIndex(0);
    setScore(0);
    setIsGameOver(false);
  };

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
            <span>🚂</span> Le Train des Sons & Aiguillages
          </h2>
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
            <Headphones size={14} className="text-amber-600" />
            Canal Auditif : Écoute bien la phrase et aiguille le train sur la bonne voie !
          </p>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-1 bg-amber-50 p-1.5 rounded-2xl border border-amber-200">
          {(['facile', 'normal', 'expert'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => { sound.playPop(); restartGame(lvl); }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all capitalize ${
                difficulty === lvl
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              {lvl === 'expert' ? 'Pour aller plus loin' : lvl}
            </button>
          ))}
        </div>
      </div>

      {!isGameOver ? (
        <div className="space-y-6">
          {/* Train Railway Simulation Stage */}
          <div className="relative bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 p-6 rounded-3xl border-4 border-amber-400 overflow-hidden shadow-inner min-h-[220px]">
            {/* Scenery trees */}
            <div className="absolute top-3 left-8 text-2xl opacity-60">🌲 🌳 🌲</div>
            <div className="absolute top-4 right-12 text-2xl opacity-60">🚉 🚩 🌲</div>

            {/* Railway Tracks SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Main Line */}
              <line x1="20" y1="100" x2="450" y2="100" stroke="#78350f" strokeWidth="6" />
              <line x1="20" y1="100" x2="450" y2="100" stroke="#fef3c7" strokeWidth="2" strokeDasharray="12 10" />

              {/* Branch Track 1 (Top) */}
              <path d="M 450 100 Q 550 100, 780 40" fill="none" stroke="#78350f" strokeWidth="6" />
              <path d="M 450 100 Q 550 100, 780 40" fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="12 10" />

              {/* Branch Track 2 (Bottom) */}
              <path d="M 450 100 Q 550 100, 780 160" fill="none" stroke="#78350f" strokeWidth="6" />
              <path d="M 450 100 Q 550 100, 780 160" fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="12 10" />
            </svg>

            {/* Steam Train Icon on Track */}
            <div
              className="absolute text-4xl transition-all duration-300 transform -translate-y-1/2 flex items-center"
              style={{
                left: `${Math.min(78, trainProgress)}%`,
                top:
                  hasResolved && selectedTrack !== null
                    ? selectedTrack === 0
                      ? '30%'
                      : '70%'
                    : '50%'
              }}
            >
              <span>🚂</span>
              <span className="text-xl animate-pulse -ml-2 -mt-4">💨</span>
            </div>

            {/* Signal Light */}
            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-xl text-xs font-black text-slate-800 shadow-xs border border-slate-200">
              Train {currentIndex + 1} / {questions.length} · Score : {score} pts
            </div>
          </div>

          {/* Audio Listening Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => playSentence(false)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 text-base"
              >
                <Volume2 size={24} className={isAudioPlaying ? 'animate-pulse' : ''} />
                <span>Écouter la phrase à la radio</span>
              </button>

              <button
                onClick={() => playSentence(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3.5 rounded-2xl border border-slate-200 text-sm transition-all"
              >
                <Volume1 size={20} />
                <span>Écouter au ralenti</span>
              </button>
            </div>

            {/* Sentence context with blank */}
            <div className="text-center space-y-1">
              <div className="text-xl md:text-2xl font-black text-slate-800 font-['Fredoka']">
                {currentQ.missingWordDisplay}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Clique sur l'aiguillage correspondant au mot entendu pour faire passer le train !
              </p>
            </div>

            {/* Switch Tracks Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedTrack === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnClass = 'bg-slate-50 hover:bg-amber-50 border-slate-300 text-slate-900';
                if (hasResolved) {
                  if (isCorrect) {
                    btnClass = 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300';
                  } else if (isSelected) {
                    btnClass = 'bg-rose-500 text-white border-rose-600';
                  } else {
                    btnClass = 'bg-slate-100 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSwitchTrack(idx)}
                    disabled={hasResolved}
                    className={`p-4 rounded-2xl border-2 font-black text-lg transition-all flex flex-col items-center justify-center space-y-1 ${btnClass}`}
                  >
                    <span className="text-xs font-semibold uppercase opacity-75">Voie {idx === 0 ? 'A' : 'B'}</span>
                    <span className="text-xl font-['Fredoka']">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback & explanation */}
            {hasResolved && (
              <div className={`p-4 rounded-2xl border text-sm font-semibold space-y-2 animate-fadeIn ${
                selectedTrack === currentQ.correctIndex
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="font-black text-base flex items-center gap-2">
                  {selectedTrack === currentQ.correctIndex ? '🟢 Aiguillage réussi ! Le train file à toute vapeur.' : '🛑 Signal d\'arrêt d\'urgence !'}
                </div>
                <p className="text-xs md:text-sm">{currentQ.explanation}</p>

                {currentIndex + 1 < questions.length && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={nextTrain}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black px-5 py-2 rounded-xl text-xs shadow-xs"
                    >
                      Prochain train ➔
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Winner Summary */
        <div className="bg-white p-8 rounded-3xl border-2 border-amber-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-amber-100 rounded-full text-5xl">
            🚉
          </div>

          <div>
            <h3 className="text-3xl font-black text-amber-950 font-['Fredoka']">
              TOUS LES TRAINS SONT ARRIVÉS À BON PORT !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Ton écoute et ta maîtrise des homophones sont remarquables.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700">⭐ {difficulty === 'expert' ? '+3' : '+2'}</div>
              <span className="text-xs font-bold text-slate-600">Étoiles gagnées</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-800">🪙 {difficulty === 'expert' ? '+30' : '+20'}</div>
              <span className="text-xs font-bold text-slate-600">Écus gagnés</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => restartGame()}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <RotateCcw size={18} />
              Rejouer
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
