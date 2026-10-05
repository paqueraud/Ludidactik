import React from 'react';
import { UserProgress, GradeLevel } from '../types';
import { CURRICULUM_LESSONS } from '../data/curriculum';
import { sound } from '../services/sound';
import { X, Award, CheckCircle2, Star, Sparkles, BookCheck } from 'lucide-react';

interface Props {
  selectedGrade: GradeLevel;
  progress: UserProgress;
  onClose: () => void;
}

export const MasteryReportModal: React.FC<Props> = ({
  selectedGrade,
  progress,
  onClose
}) => {
  const gradeLessons = CURRICULUM_LESSONS.filter(l => l.grade === selectedGrade);

  let totalValidatedNormal = 0;
  let totalValidatedExpert = 0;

  gradeLessons.forEach(l => {
    const p = progress.completedLessons[l.id];
    if (p?.normal) totalValidatedNormal++;
    if (p?.expert) totalValidatedExpert++;
  });

  const percentMastered = Math.round((totalValidatedNormal / Math.max(1, gradeLessons.length)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-emerald-400 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📜</span>
              <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-200">
                Bulletin Officiel Éducation Nationale
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 font-['Fredoka']">
              Livret de Compétences - Classe de {selectedGrade}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Suivi officiel des attendus de fin d'année du cycle primaire
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Progress Indicator */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Taux de Maîtrise du Socle Commun BO
            </div>
            <div className="text-3xl font-black text-emerald-800 font-['Fredoka']">
              {percentMastered}% des attendus validés
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              {totalValidatedNormal} leçon(s) au niveau attendu · {totalValidatedExpert} mention(s) "Pour aller plus loin"
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 text-center shadow-xs">
              <div className="text-lg font-black text-amber-500">⭐ {progress.stars}</div>
              <div className="text-[10px] font-bold text-slate-500">Étoiles totales</div>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 text-center shadow-xs">
              <div className="text-lg font-black text-amber-700">🪙 {progress.coins}</div>
              <div className="text-[10px] font-bold text-slate-500">Écus gagnés</div>
            </div>
          </div>
        </div>

        {/* Competencies Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <BookCheck size={18} className="text-emerald-600" />
            Détail par domaine d'enseignement :
          </h4>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {gradeLessons.map((l) => {
              const p = progress.completedLessons[l.id];
              const isFacile = !!p?.facile;
              const isNormal = !!p?.normal;
              const isExpert = !!p?.expert;

              return (
                <div key={l.id} className="p-4 bg-white hover:bg-slate-50 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-400">
                          {l.subject}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {l.periodLabel}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm">
                          {l.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {l.boObjectives[0]}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isExpert ? (
                        <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles size={13} />
                          Dépassé ("Plus loin") ★
                        </span>
                      ) : isNormal ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-amber-700" />
                          Attendu BO Validé ✓
                        </span>
                      ) : isFacile ? (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-3 py-1 rounded-full">
                          En cours (Facile acquis)
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                          À réviser
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher Note */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">👩‍🏫</span>
          <div className="text-xs font-medium text-amber-950">
            <strong>Appréciation du Professeur des Écoles :</strong>
            <p className="mt-0.5 text-amber-900">
              "L'entraînement régulier et la répétition espacée sont la clé des réussites au cycle 2 et cycle 3. N'hésite pas à retenter les courses et ascensions pour décrocher toutes les mentions Dépassé !"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
