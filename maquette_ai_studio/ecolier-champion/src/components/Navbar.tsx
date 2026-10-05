import React from 'react';
import { GradeLevel, UserProfile } from '../types';
import { sound } from '../services/sound';
import { frenchSpeech } from '../services/speech';
import { Volume2, VolumeX, BookOpenCheck, ShoppingBag, Flame, Trophy, Users, HeartHandshake, Download } from 'lucide-react';
import { AVATAR_CHARACTERS } from '../data/avatars';

interface Props {
  activeProfile: UserProfile;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onOpenShop: () => void;
  onOpenReport: () => void;
  onOpenAuth: () => void;
  onOpenDaily: () => void;
  onOpenLeaderboard: () => void;
  onOpenParentDictation: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeProfile,
  selectedGrade,
  onSelectGrade,
  onOpenShop,
  onOpenReport,
  onOpenAuth,
  onOpenDaily,
  onOpenLeaderboard,
  onOpenParentDictation
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    frenchSpeech.enabled = next;
    if (!next) {
      frenchSpeech.stop();
    } else {
      sound.playPop();
    }
  };

  const currentChar = AVATAR_CHARACTERS.find(c => c.id === activeProfile.progress.avatar.character) || AVATAR_CHARACTERS[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-300 flex items-center justify-center text-xl shadow-sm border border-amber-200 shrink-0">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Fredoka'] font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                Écolier Champion
              </span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 uppercase tracking-wider hidden sm:inline">
                BO Primaire
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold hidden lg:block">
              Multi-modalités : Visuel · Écoute · Oral · Écriture
            </p>
          </div>
        </div>

        {/* Grade Switcher (CE1 / CM2) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          {(['CE1', 'CM2'] as GradeLevel[]).map((grade) => (
            <button
              key={grade}
              onClick={() => {
                sound.playPop();
                onSelectGrade(grade);
              }}
              className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all ${
                selectedGrade === grade
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>

        {/* Feature Buttons (Daily, Leaderboard, Parents) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Daily challenges button */}
          <button
            onClick={() => { sound.playPop(); onOpenDaily(); }}
            className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 px-2.5 py-1.5 rounded-2xl font-black text-xs transition-colors"
            title="Défis Quotidiens du jour"
          >
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span className="hidden md:inline">Défis du Jour</span>
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => { sound.playPop(); onOpenLeaderboard(); }}
            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1.5 rounded-2xl font-black text-xs transition-colors"
            title="Tableau des scores et records"
          >
            <Trophy size={16} className="text-amber-600" />
            <span className="hidden md:inline">Palmarès</span>
          </button>

          {/* Parents custom dictation */}
          <button
            onClick={() => { sound.playPop(); onOpenParentDictation(); }}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-1.5 rounded-2xl font-black text-xs transition-colors"
            title="Espace Parents : Ajouter les mots de la dictée"
          >
            <span>👨‍👩‍👧</span>
            <span className="hidden lg:inline">Mots de classe</span>
          </button>

          {/* Active Pupil Profile Switcher Button */}
          <button
            onClick={() => { sound.playPop(); onOpenAuth(); }}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 px-2.5 py-1 rounded-2xl font-black text-xs transition-all shadow-xs"
            title="Changer d'élève ou mot de passe"
          >
            <span className="text-base">{currentChar.icon}</span>
            <span className="font-['Fredoka'] font-black">{activeProfile.name}</span>
          </button>

          {/* Stars & Coins */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-2xl text-xs font-black">
            <span>⭐ {activeProfile.progress.stars}</span>
            <span>🪙 {activeProfile.progress.coins}</span>
          </div>

          {/* Avatar / Shop Button */}
          <button
            onClick={() => { sound.playPop(); onOpenShop(); }}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-xs transition-colors"
            title="Boutique des champions"
          >
            <span>🛍️</span>
          </button>

          {/* Download Offline ZIP Button */}
          <a
            href="/ecolier-champion.zip"
            download="ecolier-champion.zip"
            onClick={() => sound.playSuccess()}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1.5 rounded-2xl font-black text-xs transition-colors"
            title="Télécharger l'application hors-ligne (archive ZIP complète avec README)"
          >
            <Download size={15} className="text-emerald-700" />
            <span className="hidden xl:inline">Hors-ligne (ZIP)</span>
          </a>

          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-2xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
            title={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
