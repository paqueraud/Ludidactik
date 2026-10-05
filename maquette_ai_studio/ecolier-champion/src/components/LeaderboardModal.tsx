import React, { useState } from 'react';
import { HighScoreRecord, GameType } from '../types';
import { HighScoreService } from '../services/highScores';
import { sound } from '../services/sound';
import { X, Trophy, Medal, Flame, Sparkles, Filter } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ onClose }) => {
  const [filterGame, setFilterGame] = useState<GameType | 'all'>('all');
  const allRecords = HighScoreService.getAllRecords();

  const filtered = filterGame === 'all'
    ? allRecords
    : allRecords.filter(r => r.gameType === filterGame);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-amber-300 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🏆</span>
              <span className="text-xs font-black uppercase text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                Palmarès & Records Officiels
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-['Fredoka']">
              Tableau d'Honneur des Champions
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Les plus belles prouesses scolaires et records de vitesse !
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tous les records' },
            { id: 'horse-race', label: '🐎 Course de calcul' },
            { id: 'mountain-climb', label: '🏔️ Ascension mots' },
            { id: 'guillotine-history', label: '⚖️ Défi Révolution' },
            { id: 'bubble-catch', label: '🫧 Attrape-Bulles' },
            { id: 'sound-train', label: '🚂 Train des sons' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sound.playPop();
                setFilterGame(item.id as GameType | 'all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                filterGame === item.id
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Records List */}
        <div className="space-y-2.5">
          {filtered.length > 0 ? (
            filtered.map((rec, index) => {
              const isPodium = index < 3;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                    index === 0
                      ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                      : isPodium
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black min-w-8 text-center">{medal}</span>

                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                      {rec.pupilAvatar}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm font-['Fredoka']">
                          {rec.pupilName}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          {rec.grade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {rec.gameTitle} · <span className="text-amber-800 font-bold">{rec.extraInfo}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-amber-900 font-['Fredoka']">
                      {rec.score} pts
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{rec.date}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 font-semibold text-xs">
              Aucun record enregistré pour cette catégorie. Sois le premier à t'élancer !
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
