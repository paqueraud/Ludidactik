import React from 'react';
import { Lesson, DifficultyLevel } from '../types';
import { sound } from '../services/sound';
import { X, BookOpen, CheckCircle, Lightbulb, Play, ArrowRight, Award } from 'lucide-react';

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onStartGame: (lesson: Lesson, difficulty: DifficultyLevel) => void;
}

export const LessonModal: React.FC<Props> = ({ lesson, onClose, onStartGame }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-amber-300 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <span className="text-xs font-black uppercase text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                Fiche Mémo du Maître ({lesson.grade})
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-['Fredoka']">
              {lesson.title}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">{lesson.subtitle}</p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Official Bulletin Box */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wide">
            <Award size={16} />
            Programme Officiel de l'Éducation Nationale
          </div>
          <p className="text-xs text-blue-800 font-semibold italic">
            "{lesson.officialBulletinRef}"
          </p>
          <div className="pt-1">
            <div className="text-[11px] font-bold text-blue-950 mb-1">Objectifs d'apprentissage :</div>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-900">
              {lesson.boObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* The Rule / Key Knowledge */}
        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase">
            <BookOpen size={18} />
            {lesson.memo.ruleTitle}
          </div>

          <ul className="space-y-2">
            {lesson.memo.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-slate-800 font-semibold">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">●</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs md:text-sm font-bold text-amber-950">
            {lesson.memo.example}
          </div>
        </div>

        {/* Pro Tip from the Teacher */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <Lightbulb size={22} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-black text-emerald-900 uppercase">
              Astuce du Maître :
            </div>
            <p className="text-xs md:text-sm font-semibold text-emerald-800 mt-0.5">
              {lesson.memo.proTip}
            </p>
          </div>
        </div>

        {/* Choose Difficulty to Launch Game */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-center font-black text-slate-800 text-sm">
            Prêt pour l'aventure ? Choisis ton niveau de défi :
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => {
                sound.playPop();
                onStartGame(lesson, 'facile');
              }}
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-950 font-black text-xs md:text-sm text-center transition-all flex flex-col items-center justify-center space-y-1 hover:scale-102"
            >
              <span>🌱 FACILE</span>
              <span className="text-[11px] font-semibold text-emerald-700">C'est très facile</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onStartGame(lesson, 'normal');
              }}
              className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-xs md:text-sm text-center transition-all flex flex-col items-center justify-center space-y-1 shadow-sm hover:scale-102"
            >
              <span>⭐ NORMAL</span>
              <span className="text-[11px] font-semibold text-amber-800">Ce qu'il faut savoir faire (BO)</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onStartGame(lesson, 'expert');
              }}
              className="p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-400 text-purple-950 font-black text-xs md:text-sm text-center transition-all flex flex-col items-center justify-center space-y-1 hover:scale-102"
            >
              <span>🚀 PLUS LOIN</span>
              <span className="text-[11px] font-semibold text-purple-800">Défi pour les champions !</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
