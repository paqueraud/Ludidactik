import React from 'react';
import { DailyChallenge, GradeLevel, Lesson, DifficultyLevel } from '../types';
import { DailyChallengeService } from '../services/dailyChallenges';
import { CURRICULUM_LESSONS } from '../data/curriculum';
import { sound } from '../services/sound';
import { X, Flame, CheckCircle2, Play, Gift, Sparkles } from 'lucide-react';

interface Props {
  grade: GradeLevel;
  completedIds: string[];
  onStartChallenge: (lesson: Lesson, difficulty: DifficultyLevel) => void;
  onClose: () => void;
}

export const DailyChallengesModal: React.FC<Props> = ({
  grade,
  completedIds,
  onStartChallenge,
  onClose
}) => {
  const challenges: DailyChallenge[] = DailyChallengeService.getChallengesForGrade(grade);
  const completedCount = challenges.filter(c => completedIds.includes(c.id)).length;
  const isChestUnlocked = completedCount >= challenges.length;

  const handleLaunch = (ch: DailyChallenge) => {
    sound.playPop();
    const lesson = CURRICULUM_LESSONS.find(l => l.id === ch.lessonId) || CURRICULUM_LESSONS[0];
    onStartChallenge(lesson, ch.difficulty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-orange-400 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <span className="text-xs font-black uppercase text-orange-800 bg-orange-100 px-3 py-0.5 rounded-full border border-orange-200">
                Missions du Jour
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-['Fredoka']">
              Défis Quotidiens ({grade})
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Réussis les 3 défis du jour pour débloquer le Coffre au Trésor !
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Daily Chest Progress Bar */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200 p-4 rounded-3xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-black text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
              <Gift size={16} className="text-orange-600" />
              Coffre Mystère du Jour
            </div>
            <div className="text-sm font-bold text-slate-700">
              {completedCount} / {challenges.length} défis accomplis
            </div>
          </div>

          <div className="text-right">
            {isChestUnlocked ? (
              <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1 animate-bounce">
                <Sparkles size={14} /> Coffre Débloqué ! (+50 🪙)
              </span>
            ) : (
              <span className="bg-white/80 text-orange-900 border border-orange-300 text-xs font-black px-3 py-1.5 rounded-full">
                En cours ⏳
              </span>
            )}
          </div>
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          {challenges.map((ch) => {
            const isDone = completedIds.includes(ch.id);

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-slate-900 text-sm font-['Fredoka']">
                      {ch.title}
                    </h5>
                    {isDone && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Accompli ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {ch.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <span>Récompenses : ⭐ +{ch.rewardStars}</span>
                    <span>🪙 +{ch.rewardCoins} écus</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleLaunch(ch)}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play size={14} />
                      <span>Relever le défi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
