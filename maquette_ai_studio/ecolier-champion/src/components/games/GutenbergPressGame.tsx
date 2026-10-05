import React, { useState, useEffect } from 'react';
import { Lesson, DifficultyLevel, ParentWord } from '../../types';
import { sound } from '../../services/sound';
import { frenchSpeech } from '../../services/speech';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, Sparkles, RotateCcw, PenTool, CheckCircle2, Feather } from 'lucide-react';

interface Props {
  lesson: Lesson;
  initialDifficulty: DifficultyLevel;
  customWordList?: ParentWord[];
  onFinish: (stars: number, coins: number, difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

export const GutenbergPressGame: React.FC<Props> = ({
  lesson,
  initialDifficulty,
  customWordList,
  onFinish,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);

  // Default words if no parents' custom words passed
  const defaultWords: ParentWord[] = [
    { id: '1', word: 'château', sentence: 'Le roi habite dans un grand château fort.', hint: 'Accent circonflexe sur le â et -eau à la fin.' },
    { id: '2', word: 'toujours', sentence: 'Le soleil se lève toujours à l\'est.', hint: 'N\'oublie pas le s final !' },
    { id: '3', word: 'bateau', sentence: 'Le bateau navigue sur la mer.', hint: 'Son [o] écrit -eau.' },
    { id: '4', word: 'demain', sentence: 'Demain est un autre jour.', hint: 'Son [in] écrit -ain.' }
  ];

  const wordPool: ParentWord[] = (customWordList && customWordList.length > 0) ? customWordList : defaultWords;

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [composedLetters, setComposedLetters] = useState<string[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [status, setStatus] = useState<'composing' | 'success' | 'error'>('composing');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const activeWordObj = wordPool[currentWordIndex % wordPool.length];
  const targetWord = activeWordObj.word.toLowerCase().trim();

  // Create scrambled letter tiles + 2 extra distractor letters
  const [availableTiles, setAvailableTiles] = useState<{ id: string; char: string; used: boolean }[]>([]);

  useEffect(() => {
    const letters = targetWord.split('');
    const distractors = ['s', 'e', 't', 'x', 'a', 'r'];
    const extra1 = distractors[Math.floor(Math.random() * distractors.length)];
    const extra2 = distractors[Math.floor(Math.random() * distractors.length)];

    const all = [...letters, extra1, extra2]
      .map((char, idx) => ({ id: `${char}-${idx}-${Math.random()}`, char, used: false }))
      .sort(() => Math.random() - 0.5);

    setAvailableTiles(all);
    setComposedLetters([]);
    setIsPressed(false);
    setStatus('composing');

    // Announce word audio
    frenchSpeech.speak(`Compose le mot : ${activeWordObj.word}`, 0.85);
  }, [currentWordIndex, targetWord, activeWordObj]);

  const handlePickTile = (tile: { id: string; char: string; used: boolean }) => {
    if (tile.used || isPressed) return;
    sound.playPop();

    setAvailableTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, used: true } : t))
    );
    setComposedLetters(prev => [...prev, tile.char]);
  };

  const handleRemoveLetter = (index: number) => {
    if (isPressed) return;
    sound.playPop();

    const charRemoved = composedLetters[index];
    const newLetters = composedLetters.filter((_, i) => i !== index);
    setComposedLetters(newLetters);

    // Free the corresponding tile in bench
    setAvailableTiles(prev => {
      let freed = false;
      return prev.map(t => {
        if (!freed && t.char === charRemoved && t.used) {
          freed = true;
          return { ...t, used: false };
        }
        return t;
      });
    });
  };

  const handlePullLever = () => {
    if (composedLetters.length === 0 || isPressed) return;

    sound.playTurbo();
    setIsPressed(true);

    const userWord = composedLetters.join('').toLowerCase();
    if (userWord === targetWord) {
      sound.playSuccess();
      setStatus('success');
      setScore(s => s + 50);

      setTimeout(() => {
        if (currentWordIndex + 1 >= wordPool.length) {
          setIsGameOver(true);
          sound.playFanfare();
          try {
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
          } catch {
            // ignore
          }
          const starsEarned = difficulty === 'expert' ? 3 : 2;
          const coinsEarned = 25;
          onFinish(starsEarned, coinsEarned, difficulty);
        } else {
          setCurrentWordIndex(i => i + 1);
        }
      }, 1800);
    } else {
      sound.playError();
      setStatus('error');
    }
  };

  const handleResetCurrent = () => {
    setComposedLetters([]);
    setAvailableTiles(prev => prev.map(t => ({ ...t, used: false })));
    setIsPressed(false);
    setStatus('composing');
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
          <h2 className="text-xl md:text-2xl font-black text-amber-950 flex items-center justify-center gap-2 font-['Fredoka']">
            <span>📜</span> La Presse Typographique de Gutenberg
          </h2>
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
            <PenTool size={14} className="text-amber-700" />
            Canal Kinesthésique & Écriture : Assemble les caractères en plomb pour imprimer la page !
          </p>
        </div>

        <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-xl text-xs font-black">
          Mot {currentWordIndex + 1} / {wordPool.length}
        </div>
      </div>

      {!isGameOver ? (
        <div className="space-y-6">
          {/* Target Word & Audio Prompt */}
          <div className="bg-amber-50/80 border-2 border-amber-300 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider">
                Mot à imprimer :
              </span>
              <p className="text-sm md:text-base font-semibold text-slate-700 italic">
                "{activeWordObj.sentence || `Écris le mot : ${activeWordObj.word}`}"
              </p>
              {activeWordObj.hint && (
                <p className="text-xs text-amber-800 font-bold">💡 Indice : {activeWordObj.hint}</p>
              )}
            </div>

            <button
              onClick={() => frenchSpeech.speak(activeWordObj.word, 0.85)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-2xl shadow-xs transition-colors shrink-0"
            >
              <Volume2 size={20} />
              <span>Réécouter</span>
            </button>
          </div>

          {/* The Gutenberg Composing Stick (Le Composteur en bois) */}
          <div className="bg-stone-900 text-amber-100 p-6 rounded-3xl border-4 border-amber-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-stone-800 pb-2">
              <span>Le Composteur d'Imprimerie</span>
              <span>Clique sur une lettre pour la retirer</span>
            </div>

            {/* Letter Slots */}
            <div className="min-h-18 bg-stone-950/80 border-2 border-dashed border-amber-700/60 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-2">
              {composedLetters.length === 0 ? (
                <span className="text-xs text-stone-500 font-semibold italic">
                  Pose les tampons de lettres ici pour composer le mot...
                </span>
              ) : (
                composedLetters.map((char, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRemoveLetter(idx)}
                    className="w-12 h-14 bg-gradient-to-b from-amber-200 to-amber-400 text-amber-950 font-black text-2xl rounded-xl border-2 border-amber-600 shadow-md transform hover:-translate-y-1 transition-transform flex items-center justify-center font-['Fredoka'] cursor-pointer"
                  >
                    {char}
                  </button>
                ))
              )}
            </div>

            {/* Pull Lever Action Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleResetCurrent}
                disabled={composedLetters.length === 0 || isPressed}
                className="text-xs font-bold text-stone-400 hover:text-white"
              >
                Vider le composteur
              </button>

              <button
                onClick={handlePullLever}
                disabled={composedLetters.length === 0 || isPressed}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-black text-sm md:text-base px-8 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span>⚙️ Tirer le levier de la presse !</span>
              </button>
            </div>
          </div>

          {/* Apprentice's Workbench with Movable Type Stamps */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Établi des caractères en plomb mobiles :
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {availableTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => handlePickTile(tile)}
                  disabled={tile.used || isPressed}
                  className={`w-12 h-14 rounded-2xl font-black text-2xl border-2 transition-all flex items-center justify-center font-['Fredoka'] ${
                    tile.used
                      ? 'bg-slate-100 text-slate-300 border-slate-200 opacity-40 cursor-default'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                >
                  {tile.char}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Parchment Reveal */}
          {status === 'success' && (
            <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-3xl text-center space-y-2 animate-fadeIn">
              <div className="text-3xl">📜✨</div>
              <h3 className="text-2xl font-black text-amber-950 font-['Fredoka']">
                Page imprimée avec succès !
              </h3>
              <p className="text-sm font-bold text-amber-900">
                "{composedLetters.join('')}" est parfaitement orthographié. L'encre est sèche !
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-3xl space-y-2 animate-shake text-center">
              <h4 className="font-black text-rose-900 text-base">
                Oups ! Coquille typographique sur la presse !
              </h4>
              <p className="text-xs md:text-sm text-rose-800 font-semibold">
                Tu as composé "{composedLetters.join('')}". La bonne orthographe est "{targetWord}".
              </p>
              <button
                onClick={handleResetCurrent}
                className="mt-2 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Recomposer le mot
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Winner Manuscript Display */
        <div className="bg-white p-8 rounded-3xl border-2 border-amber-300 text-center space-y-6 shadow-lg">
          <div className="inline-block p-4 bg-amber-100 rounded-full text-5xl">
            📖
          </div>

          <div>
            <h3 className="text-3xl font-black text-amber-950 font-['Fredoka']">
              MANUSCRIT ENLUMINÉ TERMINÉ !
            </h3>
            <p className="text-slate-600 font-semibold mt-1">
              Tous les mots ont été imprimés sans aucune coquille. Maître Gutenberg te décerne le sceau royal !
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-700">⭐ +3</div>
              <span className="text-xs font-bold text-slate-600">Étoiles d'imprimeur</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <div className="text-2xl font-black text-amber-800">🪙 +30</div>
              <span className="text-xs font-bold text-slate-600">Écus gagnés</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setCurrentWordIndex(0);
                setIsGameOver(false);
              }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              <RotateCcw size={18} />
              Réimprimer une page
            </button>
            <button
              onClick={onBack}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black px-6 py-3 rounded-2xl transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
