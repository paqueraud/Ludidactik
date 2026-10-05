import React, { useState } from 'react';
import { UserProfile, CustomDictationList, ParentWord } from '../types';
import { AuthService } from '../services/auth';
import { sound } from '../services/sound';
import { X, Plus, Trash2, Play, BookOpen, Check, Feather, PenTool } from 'lucide-react';

interface Props {
  activeProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLaunchCustomDictation: (words: ParentWord[], gameType: 'mountain-climb' | 'gutenberg-press', listTitle: string) => void;
  onClose: () => void;
}

export const ParentDictationModal: React.FC<Props> = ({
  activeProfile,
  onUpdateProfile,
  onLaunchCustomDictation,
  onClose
}) => {
  const customLists = activeProfile.customDictations || [];

  const [isCreating, setIsCreating] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [rawWordsInput, setRawWordsInput] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawWordsInput.trim()) return;

    // Parse words from commas or newlines
    const wordsArray = rawWordsInput
      .split(/[,\n]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (wordsArray.length === 0) return;

    sound.playSuccess();

    const parentWords: ParentWord[] = wordsArray.map((w, idx) => ({
      id: `pw-${Date.now()}-${idx}`,
      word: w,
      sentence: exampleSentence ? `Exemple : ${exampleSentence}` : `Écris le mot : ${w}`
    }));

    const newList: CustomDictationList = {
      id: `list-${Date.now()}`,
      title: listTitle.trim() || `Dictée de ${activeProfile.name} (${new Date().toLocaleDateString('fr-FR')})`,
      words: parentWords,
      createdAt: new Date().toISOString()
    };

    const updatedProfile: UserProfile = {
      ...activeProfile,
      customDictations: [newList, ...customLists]
    };

    AuthService.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);

    // Reset form
    setListTitle('');
    setRawWordsInput('');
    setExampleSentence('');
    setIsCreating(false);
  };

  const handleDeleteList = (id: string) => {
    sound.playPop();
    const updatedProfile: UserProfile = {
      ...activeProfile,
      customDictations: customLists.filter(l => l.id !== id)
    };
    AuthService.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-amber-300 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">👨‍👩‍👧</span>
              <span className="text-xs font-black uppercase text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                Espace Parents & Enseignants
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-['Fredoka']">
              Mes Mots de Dictée Personnalisés
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Ajoute les mots exacts donnés par l'enseignant pour les réviser en jeu !
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Existing Lists or Empty State */}
        {!isCreating ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Listes enregistrées pour {activeProfile.name} :
              </h4>
              <button
                onClick={() => { sound.playPop(); setIsCreating(true); }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-xs transition-colors"
              >
                <Plus size={16} />
                <span>Créer une nouvelle liste</span>
              </button>
            </div>

            {customLists.length > 0 ? (
              <div className="space-y-3">
                {customLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 rounded-2xl border-2 border-slate-200 bg-amber-50/30 hover:border-amber-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-black text-slate-900 text-base font-['Fredoka']">
                          {list.title}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium">
                          {list.words.length} mot(s) : {list.words.map(w => w.word).join(', ')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Supprimer cette liste"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Launch Options */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Jouer avec ces mots :</span>

                      <button
                        onClick={() => {
                          sound.playPop();
                          onLaunchCustomDictation(list.words, 'mountain-climb', list.title);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                      >
                        <span>🏔️</span>
                        <span>Ascension de la Montagne (Dictée vocale)</span>
                      </button>

                      <button
                        onClick={() => {
                          sound.playPop();
                          onLaunchCustomDictation(list.words, 'gutenberg-press', list.title);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                      >
                        <span>📜</span>
                        <span>Presse de Gutenberg (Tampons de lettres)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center space-y-2">
                <span className="text-4xl">📝</span>
                <h4 className="font-bold text-slate-700 text-base">Aucune liste personnalisée pour l'instant</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ton enfant a des mots à apprendre pour la dictée de vendredi ? Clique ci-dessus pour les ajouter en quelques secondes !
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Create Form */
          <form onSubmit={handleCreateList} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Titre de la dictée :
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex : Mots de la semaine 4 (vendredi 18)"
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 outline-none font-bold text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Mots à apprendre (séparés par une virgule ou à la ligne) :
              </label>
              <textarea
                rows={4}
                placeholder="Ex : maison, château, forêt, bientôt, toujours, papillon"
                value={rawWordsInput}
                onChange={(e) => setRawWordsInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 outline-none font-bold text-sm text-slate-800"
              />
              <span className="text-[11px] text-slate-400 font-medium">
                Conseil : Copie-colle directement le message ou le carnet de devoirs de l'école.
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={!rawWordsInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black px-6 py-2.5 rounded-xl shadow-xs text-xs md:text-sm transition-all"
              >
                Enregistrer la liste de mots
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
