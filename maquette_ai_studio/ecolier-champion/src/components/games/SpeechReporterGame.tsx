import React, { useState, useEffect } from 'react';
import { Lesson, DifficultyLevel } from '../../types';
import { sound } from '../../services/sound';
import { frenchSpeech } from '../../services/speech';
import confetti from 'canvas-confetti';
import { ArrowLeft, Mic, MicOff, Radio, Sparkles, CheckCircle2, RotateCcw, Volume2 } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

interface OralQuestion {
  question: string;
  expectedSpokenKeywords: string[];
  options: string[];
  context: string;
}

const ORAL_QUESTIONS_CE1: OralQuestion[] = [
  {
    question: 'Avec quoi écrivaient les élèves à l\'école autrefois ?',
    expectedSpokenKeywords: ['plume', 'encrier', 'encre'],
    options: ['Une plume et un encrier', 'Un feutre fluo', 'Un ordinateur portable'],
    context: 'Les élèves trempaient la plume métallique dans l\'encrier rempli d\'encre violette !'
  },
  {
    question: 'Quand l\'eau liquide gèle à moins de 0 degré, quel état devient-elle ?',
    expectedSpokenKeywords: ['glace', 'solide', 'glaçon'],
    options: ['De la glace (état solide)', 'De la vapeur (état gazeux)', 'De l\'huile'],
    context: 'L\'eau durcit et devient solide en dessous de 0°C : c\'est la solidification !'
  }
];

const ORAL_QUESTIONS_CM2: OralQuestion[] = [
  {
    question: 'En quelle année a eu lieu la prise de la Bastille à Paris ?',
    expectedSpokenKeywords: ['1789', 'mille sept cent quatre-vingt-neuf', 'quatre-vingt-neuf'],
    options: ['1789', '1804', '1918'],
    context: 'Le 14 juillet 1789, les Parisiens en révolte prennent la forteresse de la Bastille !'
  },
  {
    question: 'Quelle est la planète la plus gigantesque du système solaire ?',
    expectedSpokenKeywords: ['jupiter'],
    options: ['Jupiter', 'Mars', 'La Terre'],
    context: 'Jupiter est une géante gazeuse qui pourrait contenir plus de 1300 fois la Terre !'
  },
  {
    question: 'Qui est l\'empereur des Français couronné en 1804 ?',
    expectedSpokenKeywords: ['napoléon', 'bonaparte', 'napoleon'],
    options: ['Napoléon Bonaparte', 'Louis XVI', 'Robespierre'],
    context: 'Napoléon Ier s\'est fait sacrer empereur à Notre-Dame de Paris en 1804.'
  }
];

export const SpeechReporterGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const questions = lesson.grade === 'CE1' ? ORAL_QUESTIONS_CE1 : ORAL_QUESTIONS_CM2;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'retry'>('idle');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentQ = questions[currentIndex % questions.length];

  // Speech Recognition setup (Web Speech API)
  const startSpeechRecognition = () => {
    const win = window as unknown as Record<string, any>;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Fallback message if browser has no mic API
      setSpokenTranscript('Micro non disponible sur ce navigateur. Clique sur la réponse !');
      return;
    }

    try {
      sound.playPop();
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenTranscript('Écoute en cours... Parle maintenant !');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setSpokenTranscript(text);
        validateSpoken(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpokenTranscript('Je n\'ai pas bien entendu. Réessaie ou clique sur l\'option !');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const validateSpoken = (text: string) => {
    const isMatch = currentQ.expectedSpokenKeywords.some(kw =>
      text.toLowerCase().includes(kw.toLowerCase())
    );

    if (isMatch) {
      sound.playSuccess();
      sound.playTurbo();
      setStatus('success');
      setScore(s => s + 100);

      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          setIsGameOver(true);
          sound.playFanfare();
          try {
            confetti({ particleCount: 110, spread: 90, origin: { y: 0.5 } });
          } catch {
            // ignore
          }
          const starsEarned = difficulty === 'expert' ? 3 : 2;
          const coinsEarned = 30;
          onFinish(starsEarned, coinsEarned, difficulty);
        } else {
          setCurrentIndex(i => i + 1);
          setStatus('idle');
          setSpokenTranscript('');
        }
      }, 1800);
    } else {
      sound.playError();
      setStatus('retry');
    }
  };

  const speakQuestionAloud = () => {
    frenchSpeech.speak(currentQ.question, 0.85);
  };

  useEffect(() => {
    speakQuestionAloud();
    setStatus('idle');
    setSpokenTranscript('');
  }, [currentIndex, difficulty]);

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
          <h2 className="text-xl md:text-2xl font-black text-rose-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>🎙️</span> Le Micro Magique du Reporter d'Histoire
          </h2>
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
            <Radio size={14} className="text-rose-600" />
            Canal Oral & Parler : Réponds à voix haute dans le micro en direct à la radio !
          </p>
        </div>

        <div className="bg-rose-100 text-rose-900 px-3 py-1 rounded-xl text-xs font-black">
          Question {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {!isGameOver ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Question Banner with audio repeat */}
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-6 rounded-3xl border-2 border-rose-200 flex flex-col items-center text-center space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-0.5 rounded-full">
              Le Reporter en direct
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 font-['Fredoka']">
              "{currentQ.question}"
            </h3>

            <button
              onClick={speakQuestionAloud}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
            >
              <Volume2 size={16} />
              Réécouter la question du présentateur
            </button>
          </div>

          {/* Big Microphone Push-to-Talk Button */}
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <button
              onClick={startSpeechRecognition}
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 border-white text-white animate-pulse ring-8 ring-rose-200'
                  : 'bg-gradient-to-tr from-rose-500 to-rose-600 border-rose-300 text-white hover:scale-105'
              }`}
            >
              <Mic size={40} />
              <span className="text-[10px] font-black uppercase mt-1">
                {isListening ? 'Parle !' : 'Micro'}
              </span>
            </button>

            <span className="text-xs font-bold text-slate-500">
              {isListening ? '🎙️ Enregistrement de ta voix en cours...' : 'Clique sur le micro et dis ta réponse à voix haute !'}
            </span>

            {/* Live voice transcription */}
            {spokenTranscript && (
              <div className="bg-slate-100 border border-slate-300 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 italic">
                Voix entendue : "{spokenTranscript}"
              </div>
            )}
          </div>

          {/* Alternative direct tap buttons (inclusive for all audio conditions) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-black uppercase text-slate-400 block text-center">
              Ou clique sur ta réponse si tu n'as pas de micro :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => validateSpoken(opt)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-300 text-slate-800 font-bold text-xs md:text-sm transition-all text-center"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {status === 'success' && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center justify-center gap-2 text-emerald-950 font-black animate-fadeIn">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
              <span>Excellente réponse à l'antenne ! Bravo reporter.</span>
            </div>
          )}

          {status === 'retry' && (
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-center space-y-1 animate-shake">
              <h4 className="font-black text-amber-900 text-sm">
                Pas tout à fait ! Réessaie à voix haute ou sélectionne la bonne option.
              </h4>
              <p className="text-xs text-amber-800 font-semibold">{currentQ.context}</p>
            </div>
          )}
        </div>
      ) : (
        /* Winner Broadcast Screen */
        <div className="bg-white p-8 rounded-3xl border-2 border-rose-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-rose-50 rounded-full text-5xl">
            📻
          </div>

          <div>
            <h3 className="text-3xl font-black text-rose-950 font-['Fredoka']">
              CHRONIQUE RADIO TERMINÉE AVEC SUCCÈS !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Tes explications orales étaient claires, passionnantes et précises. Félicitations pour ton éloquence !
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-rose-700">⭐ +3</div>
              <span className="text-xs font-bold text-slate-600">Étoiles d'éloquence</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700">🪙 +30</div>
              <span className="text-xs font-bold text-slate-600">Écus gagnés</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsGameOver(false);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <RotateCcw size={18} />
              Nouvelle chronique
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
