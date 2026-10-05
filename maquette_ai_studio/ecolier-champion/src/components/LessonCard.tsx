import React from 'react';
import { Lesson, DifficultyLevel, UserProgress } from '../types';
import { sound } from '../services/sound';
import { Play, BookOpen, CheckCircle2, Sparkles, Star } from 'lucide-react';

interface Props {
  lesson: Lesson;
  progress: UserProgress;
  onOpenMemo: (lesson: Lesson) => void;
  onStartGame: (lesson: Lesson, difficulty: DifficultyLevel) => void;
}

export const LessonCard: React.FC<Props> = ({
  lesson,
  progress,
  onOpenMemo,
  onStartGame
}) => {
  const lessonProgress = progress.completedLessons[lesson.id] || {};
  const isFacileDone = !!lessonProgress.facile;
  const isNormalDone = !!lessonProgress.normal;
  const isExpertDone = !!lessonProgress.expert;

  let stars = 0;
  if (isFacileDone) stars = 1;
  if (isNormalDone) stars = 2;
  if (isExpertDone) stars = 3;

  const subjectConfig = {
    maths: {
      color: 'border-amber-200 bg-amber-50/40 hover:border-amber-300',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      tag: 'Mathématiques - Calcul Mental',
      icon: '🐎'
    },
    francais: {
      color: 'border-sky-200 bg-sky-50/40 hover:border-sky-300',
      badge: 'bg-sky-100 text-sky-900 border-sky-300',
      tag: 'Français - Orthographe & Dictée',
      icon: '🏔️'
    },
    histoire: {
      color: 'border-orange-200 bg-orange-50/40 hover:border-orange-300',
      badge: 'bg-orange-100 text-orange-900 border-orange-300',
      tag: 'Histoire & Temps',
      icon: '⚖️'
    },
    sciences: {
      color: 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      tag: 'Sciences & Matière',
      icon: '🔬'
    }
  }[lesson.subject];

  return (
    <div
      className={`rounded-3xl border-2 p-5 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md bg-white ${subjectConfig.color}`}
    >
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${subjectConfig.badge}`}>
              {subjectConfig.tag}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {lesson.periodLabel}
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              {lesson.modality === 'regarder' && '👁️ Visuel'}
              {lesson.modality === 'ecouter' && '👂 Écoute'}
              {lesson.modality === 'parler' && '🎙️ Oral'}
              {lesson.modality === 'ecrire' && '✍️ Écriture'}
              {lesson.modality === 'reflexe' && '⚡ Réflexe'}
            </span>
          </div>

          {/* Stars acquired */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-sm ${
                  s <= stars ? 'text-amber-400' : 'text-slate-200'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {subjectConfig.icon}
          </div>
          <div>
            <h3 className="font-['Fredoka'] font-black text-slate-900 text-base md:text-lg leading-snug">
              {lesson.title}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {lesson.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* BO Reference snippet */}
      <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
        🎯 <strong className="text-slate-700">Attendu BO :</strong> {lesson.boObjectives[0]}
      </div>

      {/* Action buttons with 3 difficulties */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Choisis ton niveau :</span>
          <button
            onClick={() => { sound.playPop(); onOpenMemo(lesson); }}
            className="text-amber-700 hover:text-amber-900 flex items-center gap-1 font-black underline decoration-amber-300 underline-offset-2"
          >
            <BookOpen size={13} />
            Mémo de cours
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Facile */}
          <button
            onClick={() => { sound.playPop(); onStartGame(lesson, 'facile'); }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center ${
              isFacileDone
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
            }`}
          >
            <span>Facile</span>
            {isFacileDone && <span className="text-[10px] text-emerald-700">Validé ✓</span>}
          </button>

          {/* Normal (BO Target) */}
          <button
            onClick={() => { sound.playPop(); onStartGame(lesson, 'normal'); }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center ${
              isNormalDone
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
            }`}
          >
            <span>Normal (BO)</span>
            {isNormalDone && <span className="text-[10px] text-amber-700">Validé ✓</span>}
          </button>

          {/* Expert (Pour aller plus loin) */}
          <button
            onClick={() => { sound.playPop(); onStartGame(lesson, 'expert'); }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center ${
              isExpertDone
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800'
            }`}
            title="Pour aller plus loin : dépasse le niveau exigé !"
          >
            <span className="truncate max-w-full">Plus loin 🚀</span>
            {isExpertDone && <span className="text-[10px] text-purple-700">Champion ★</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
