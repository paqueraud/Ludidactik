import React, { useState } from 'react';
import {
  GradeLevel,
  SubjectId,
  SchoolPeriod,
  LearningModality,
  Lesson,
  DifficultyLevel,
  UserProfile,
  ParentWord
} from './types';
import { CURRICULUM_LESSONS } from './data/curriculum';
import { AVATAR_CHARACTERS, AVATAR_HATS } from './data/avatars';
import { AuthService } from './services/auth';
import { HighScoreService } from './services/highScores';
import { DailyChallengeService } from './services/dailyChallenges';
import { Navbar } from './components/Navbar';
import { LessonCard } from './components/LessonCard';
import { LessonModal } from './components/LessonModal';
import { MasteryReportModal } from './components/MasteryReportModal';
import { AvatarShopModal } from './components/AvatarShopModal';
import { AuthModal } from './components/AuthModal';
import { DailyChallengesModal } from './components/DailyChallengesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ParentDictationModal } from './components/ParentDictationModal';

// Games
import { HorseRaceGame } from './components/games/HorseRaceGame';
import { MountainClimberGame } from './components/games/MountainClimberGame';
import { HistoryChallengerGame } from './components/games/HistoryChallengerGame';
import { ScienceLabGame } from './components/games/ScienceLabGame';
import { BubbleCatchGame } from './components/games/BubbleCatchGame';
import { SoundTrainGame } from './components/games/SoundTrainGame';
import { GutenbergPressGame } from './components/games/GutenbergPressGame';
import { SpeechReporterGame } from './components/games/SpeechReporterGame';

import { sound } from './services/sound';
import { Sparkles, Trophy, Calculator, Feather, Shield, Compass, Search, Calendar, Eye, Headphones, Mic, PenTool, Flame, HeartHandshake } from 'lucide-react';

export default function App() {
  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => AuthService.getActiveProfile());
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(activeProfile.grade);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<SchoolPeriod | 'all'>('all');
  const [selectedModality, setSelectedModality] = useState<LearningModality | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [memoLesson, setMemoLesson] = useState<Lesson | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isParentDictationOpen, setIsParentDictationOpen] = useState(false);

  // Active Game State
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel>('normal');
  const [customWordsForGame, setCustomWordsForGame] = useState<ParentWord[] | undefined>(undefined);

  // Handle Game Launch
  const handleStartGame = (lesson: Lesson, difficulty: DifficultyLevel) => {
    setMemoLesson(null);
    setCustomWordsForGame(undefined);
    setActiveLesson(lesson);
    setActiveDifficulty(difficulty);
  };

  // Launch custom parent dictation
  const handleLaunchCustomDictation = (words: ParentWord[], gameType: 'mountain-climb' | 'gutenberg-press', listTitle: string) => {
    const parentLesson: Lesson = {
      id: `custom-${Date.now()}`,
      grade: selectedGrade,
      subject: 'francais',
      period: 'P1',
      periodLabel: 'Dictée des Parents',
      title: listTitle,
      subtitle: `Entraînement sur ${words.length} mot(s) de classe`,
      icon: 'Feather',
      badgeName: 'Champion de la Dictée',
      gameType,
      modality: gameType === 'mountain-climb' ? 'ecouter' : 'ecrire',
      officialBulletinRef: 'Mots donnés par l\'enseignant(e) de la classe',
      boObjectives: ['Maîtriser les mots de la dictée hebdomadaire de la classe'],
      memo: {
        ruleTitle: 'Mes mots de classe à réviser',
        keyPoints: words.map(w => w.word),
        example: words.map(w => w.word).join(', '),
        proTip: 'Réécris bien chaque mot dans ta tête avant de valider !'
      }
    };

    setCustomWordsForGame(words);
    setActiveLesson(parentLesson);
    setActiveDifficulty('normal');
  };

  // Handle Game Victory & Rewards
  const handleGameFinish = (starsWon: number, coinsWon: number, difficulty: DifficultyLevel) => {
    if (!activeLesson) return;

    const prevProg = activeProfile.progress;
    const lessonRecord = prevProg.completedLessons[activeLesson.id] || {};
    const wasAlreadyDone = lessonRecord[difficulty];

    const newStars = wasAlreadyDone ? prevProg.stars : prevProg.stars + starsWon;
    const newCoins = prevProg.coins + coinsWon;

    // Check daily challenge progress
    const todayChallenges = DailyChallengeService.getChallengesForGrade(selectedGrade);
    const matchedChallenge = todayChallenges.find(c => c.lessonId === activeLesson.id);
    let updatedDailyCompleted = prevProg.dailyChallengesCompleted || [];
    if (matchedChallenge && !updatedDailyCompleted.includes(matchedChallenge.id)) {
      updatedDailyCompleted = [...updatedDailyCompleted, matchedChallenge.id];
    }

    const updatedProfile: UserProfile = {
      ...activeProfile,
      progress: {
        ...prevProg,
        stars: newStars,
        coins: newCoins,
        dailyChallengesCompleted: updatedDailyCompleted,
        completedLessons: {
          ...prevProg.completedLessons,
          [activeLesson.id]: {
            ...lessonRecord,
            [difficulty]: true,
            lastPlayed: new Date().toISOString()
          }
        },
        historyRecord: {
          ...prevProg.historyRecord,
          gamesPlayed: prevProg.historyRecord.gamesPlayed + 1,
          correctAnswers: prevProg.historyRecord.correctAnswers + 3
        }
      }
    };

    AuthService.saveProfile(updatedProfile);
    setActiveProfile(updatedProfile);
  };

  // Filter lessons
  const filteredLessons = CURRICULUM_LESSONS.filter(l => {
    if (l.grade !== selectedGrade) return false;
    if (selectedSubject !== 'all' && l.subject !== selectedSubject) return false;
    if (selectedPeriod !== 'all' && l.period !== selectedPeriod) return false;
    if (selectedModality !== 'all' && l.modality !== selectedModality) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q) ||
        l.officialBulletinRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentChar = AVATAR_CHARACTERS.find(c => c.id === activeProfile.progress.avatar.character) || AVATAR_CHARACTERS[0];
  const currentHat = AVATAR_HATS.find(h => h.id === activeProfile.progress.avatar.hat);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Nunito',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        activeProfile={activeProfile}
        selectedGrade={selectedGrade}
        onSelectGrade={(g) => {
          setSelectedGrade(g);
          setActiveLesson(null);
        }}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenParentDictation={() => setIsParentDictationOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* If Active Game is running */}
        {activeLesson ? (
          <div>
            {activeLesson.gameType === 'horse-race' && (
              <HorseRaceGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                playerHorseColor={activeProfile.progress.avatar.horseColor}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'mountain-climb' && (
              <MountainClimberGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                playerAvatarIcon={currentChar.icon}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'guillotine-history' && (
              <HistoryChallengerGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                playerAvatarIcon={currentChar.icon}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
                onOpenMemo={() => setMemoLesson(activeLesson)}
              />
            )}

            {activeLesson.gameType === 'lab-quiz' && (
              <ScienceLabGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'bubble-catch' && (
              <BubbleCatchGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'sound-train' && (
              <SoundTrainGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'gutenberg-press' && (
              <GutenbergPressGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                customWordList={customWordsForGame}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}

            {activeLesson.gameType === 'speech-reporter' && (
              <SpeechReporterGame
                lesson={activeLesson}
                initialDifficulty={activeDifficulty}
                onFinish={handleGameFinish}
                onBack={() => setActiveLesson(null)}
              />
            )}
          </div>
        ) : (
          /* Normal Dashboard & Explorer */
          <div className="space-y-7">
            {/* Friendly Hero Banner */}
            <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-md overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-9xl opacity-20 select-none pointer-events-none">
                🏆
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-6 text-left">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/60 flex items-center justify-center text-5xl shadow-inner">
                      {currentChar.icon}
                    </div>
                    {currentHat && currentHat.id !== 'none' && (
                      <span className="absolute -top-3 -right-2 text-2xl drop-shadow">
                        {currentHat.icon}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/25 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Classe de {selectedGrade} · {selectedGrade === 'CE1' ? 'Cycle 2' : 'Cycle 3'}
                      </span>
                      <button
                        onClick={() => setIsAuthOpen(true)}
                        className="bg-amber-900/30 hover:bg-amber-900/50 text-[10px] font-bold text-amber-100 px-2 py-0.5 rounded-full underline transition-colors"
                      >
                        Changer d'écolier 👥
                      </button>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black font-['Fredoka'] tracking-tight">
                      Bonjour {activeProfile.name} !
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-amber-100 max-w-xl">
                      Prêt pour tes révisions ? Choisis comment tu préfères apprendre : en <strong>regardant</strong>, en <strong>écoutant</strong>, en <strong>parlant</strong> ou en <strong>écrivant</strong> !
                    </p>
                  </div>
                </div>

                {/* Quick actions in hero */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => { sound.playPop(); setIsDailyOpen(true); }}
                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black px-4 py-2.5 rounded-2xl shadow-sm text-xs sm:text-sm transition-all"
                  >
                    <Flame size={16} />
                    <span>Défis du Jour</span>
                  </button>

                  <button
                    onClick={() => { sound.playPop(); setIsParentDictationOpen(true); }}
                    className="flex items-center gap-1.5 bg-white text-amber-950 hover:bg-amber-50 font-black px-4 py-2.5 rounded-2xl shadow-sm text-xs sm:text-sm transition-all"
                  >
                    <span>👨‍👩‍👧</span>
                    <span>Mots de classe</span>
                  </button>

                  <button
                    onClick={() => { sound.playPop(); setIsLeaderboardOpen(true); }}
                    className="flex items-center gap-1.5 bg-amber-900/40 hover:bg-amber-900/60 text-white font-black px-4 py-2.5 rounded-2xl border border-white/30 text-xs sm:text-sm transition-all"
                  >
                    <Trophy size={16} />
                    <span>Records</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Learning Modality Filter (Multi-sensory learning styles) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-indigo-600" />
                  Comment aimes-tu apprendre ? (Canal Sensoriel)
                </span>
                <span className="text-[11px] font-bold text-slate-400">Variété pédagogique</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: 'all', label: 'Tous les styles', icon: '🌈' },
                  { id: 'regarder', label: 'Visuel / Regarder', icon: '👁️' },
                  { id: 'ecouter', label: 'Auditif / Écouter', icon: '👂' },
                  { id: 'parler', label: 'Oral / Parler', icon: '🎙️' },
                  { id: 'ecrire', label: 'Écrire / Tampons', icon: '✍️' },
                  { id: 'reflexe', label: 'Vitesse / Réflexe', icon: '⚡' }
                ].map((m) => {
                  const isSelected = selectedModality === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        sound.playPop();
                        setSelectedModality(m.id as LearningModality | 'all');
                      }}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-300'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-lg">{m.icon}</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{m.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Period Filter */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-amber-600" />
                  Période scolaire (de septembre à juin)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: 'all', label: 'Toute l\'année', sub: 'Septembre à Juin' },
                  { id: 'P1', label: 'Période 1', sub: 'Sept - Oct' },
                  { id: 'P2', label: 'Période 2', sub: 'Nov - Déc' },
                  { id: 'P3', label: 'Période 3', sub: 'Janv - Fév' },
                  { id: 'P4', label: 'Période 4', sub: 'Mars - Avr' },
                  { id: 'P5', label: 'Période 5', sub: 'Mai - Juin' }
                ].map((p) => {
                  const isSelected = selectedPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playPop();
                        setSelectedPeriod(p.id as SchoolPeriod | 'all');
                      }}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-300'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-900">{p.label}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{p.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Filters and Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Toutes les matières', icon: Sparkles },
                  { id: 'maths', label: 'Mathématiques', icon: Calculator },
                  { id: 'francais', label: 'Français', icon: Feather },
                  { id: 'histoire', label: 'Histoire & Temps', icon: Shield },
                  { id: 'sciences', label: 'Sciences', icon: Compass }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedSubject === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        sound.playPop();
                        setSelectedSubject(tab.id as SubjectId | 'all');
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une notion, un mot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            </div>

            {/* Mini-Games Showcase Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center">
                <div className="text-2xl">🐎</div>
                <div className="text-xs font-black text-amber-950 mt-1">Course au Galop</div>
                <p className="text-[10px] text-amber-800">Calcul mental & turbo</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-center">
                <div className="text-2xl">🫧</div>
                <div className="text-xs font-black text-indigo-950 mt-1">Attrape-Bulles</div>
                <p className="text-[10px] text-indigo-800">Réflexe visuel spatial</p>
              </div>

              <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-center">
                <div className="text-2xl">🚂</div>
                <div className="text-xs font-black text-amber-950 mt-1">Train des Sons</div>
                <p className="text-[10px] text-amber-800">Écoute & homophones</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-center">
                <div className="text-2xl">🎙️</div>
                <div className="text-xs font-black text-rose-950 mt-1">Micro du Reporter</div>
                <p className="text-[10px] text-rose-800">Parler à voix haute</p>
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 font-['Fredoka'] flex items-center gap-2">
                  <span>📚</span> Leçons disponibles ({filteredLessons.length})
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {selectedModality !== 'all' ? `Style: ${selectedModality}` : 'Tous les styles'}
                </span>
              </div>

              {filteredLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      progress={activeProfile.progress}
                      onOpenMemo={(l) => setMemoLesson(l)}
                      onStartGame={handleStartGame}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <div className="text-4xl">🔍</div>
                  <h3 className="font-black text-slate-800 text-lg">Aucune leçon ne correspond à cette sélection</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Essaie de sélectionner "Tous les styles" ou d'élargir la période.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSubject('all');
                      setSelectedPeriod('all');
                      setSelectedModality('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Réinitialiser tous les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {memoLesson && (
        <LessonModal
          lesson={memoLesson}
          onClose={() => setMemoLesson(null)}
          onStartGame={handleStartGame}
        />
      )}

      {isReportOpen && (
        <MasteryReportModal
          selectedGrade={selectedGrade}
          progress={activeProfile.progress}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {isShopOpen && (
        <AvatarShopModal
          progress={activeProfile.progress}
          onClose={() => setIsShopOpen(false)}
          onUpdateAvatar={(newAvatar, newCoins, newUnlocked) => {
            const updatedProfile: UserProfile = {
              ...activeProfile,
              progress: {
                ...activeProfile.progress,
                avatar: newAvatar,
                coins: newCoins,
                unlockedItems: newUnlocked
              }
            };
            AuthService.saveProfile(updatedProfile);
            setActiveProfile(updatedProfile);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          activeProfile={activeProfile}
          onSelectProfile={(newP) => {
            setActiveProfile(newP);
            setSelectedGrade(newP.grade);
          }}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {isDailyOpen && (
        <DailyChallengesModal
          grade={selectedGrade}
          completedIds={activeProfile.progress.dailyChallengesCompleted || []}
          onStartChallenge={handleStartGame}
          onClose={() => setIsDailyOpen(false)}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardModal
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {isParentDictationOpen && (
        <ParentDictationModal
          activeProfile={activeProfile}
          onUpdateProfile={(updated) => setActiveProfile(updated)}
          onLaunchCustomDictation={handleLaunchCustomDictation}
          onClose={() => setIsParentDictationOpen(false)}
        />
      )}

      {/* Child-Friendly Footer & Offline ZIP Download Card */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500 space-y-4">
        {/* Offline ZIP Download Banner */}
        <div className="max-w-2xl mx-auto p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="font-['Fredoka'] font-black text-emerald-950 text-base">
                Version Complète Hors-Ligne (ZIP)
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-semibold max-w-md">
              Télécharge l'archive complète avec le fichier <strong>README.md</strong> et toutes les instructions pour lancer et utiliser l'application sur ton ordinateur sans connexion internet.
            </p>
          </div>

          <a
            href="/ecolier-champion.zip"
            download="ecolier-champion.zip"
            onClick={() => sound.playSuccess()}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>💾 Télécharger le ZIP</span>
          </a>
        </div>

        <div className="space-y-1 pt-2">
          <p className="font-bold text-slate-600">
            Écolier Champion · Plateforme d'entraînement multi-sensorielle conforme au Ministère de l'Éducation Nationale
          </p>
          <p>
            Profil actif : <strong className="text-amber-800">{activeProfile.name}</strong> ({activeProfile.grade}) · Défis quotidiens · Palmarès des scores · Dictée personnalisée des parents
          </p>
        </div>
      </footer>
    </div>
  );
}
