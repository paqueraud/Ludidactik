import React, { useState } from 'react';
import { UserProfile, GradeLevel } from '../types';
import { AuthService } from '../services/auth';
import { AVATAR_CHARACTERS } from '../data/avatars';
import { sound } from '../services/sound';
import { X, UserPlus, LogIn, Lock, CheckCircle2, User, KeyRound, Sparkles, Trash2, ArrowLeft } from 'lucide-react';

interface Props {
  activeProfile: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({
  activeProfile,
  onSelectProfile,
  onClose
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => AuthService.getAllProfiles());
  const [view, setView] = useState<'list' | 'login' | 'create' | 'edit'>('list');
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);

  // Form states for login
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form states for creation
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>('CE1');
  const [newCharacter, setNewCharacter] = useState<string>('fox');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit current profile state
  const [editName, setEditName] = useState(activeProfile.name);
  const [editPassword, setEditPassword] = useState(activeProfile.password);
  const [editSuccess, setEditSuccess] = useState(false);

  const handleOpenLogin = (p: UserProfile) => {
    sound.playPop();
    setTargetProfile(p);
    setLoginPassword('');
    setLoginError(null);
    setView('login');
  };

  const handleVerifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile) return;

    if (loginPassword.trim() === targetProfile.password.trim()) {
      sound.playSuccess();
      AuthService.setActiveProfileId(targetProfile.id);
      onSelectProfile(targetProfile);
      onClose();
    } else {
      sound.playError();
      setLoginError('Mot de passe incorrect. Essaie à nouveau !');
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Indique ton prénom pour créer ton profil.');
      return;
    }
    if (!newPassword.trim()) {
      setCreateError('Choisis un mot de passe ou un code secret.');
      return;
    }

    sound.playFanfare();
    const created = AuthService.createProfile(newName, newPassword, newGrade, newCharacter);
    setProfiles(AuthService.getAllProfiles());
    onSelectProfile(created);
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    sound.playSuccess();
    const updated: UserProfile = {
      ...activeProfile,
      name: editName.trim(),
      password: editPassword.trim() || activeProfile.password
    };
    AuthService.saveProfile(updated);
    setProfiles(AuthService.getAllProfiles());
    onSelectProfile(updated);
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      onClose();
    }, 900);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer le profil de ${name} ? Toute sa progression sera effacée.`)) {
      sound.playPop();
      AuthService.deleteProfile(id);
      const remaining = AuthService.getAllProfiles();
      setProfiles(remaining);
      if (activeProfile.id === id) {
        onSelectProfile(remaining[0]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-amber-300 space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎒</span>
              <span className="text-xs font-black uppercase text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                Espace Multi-Écoliers
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-['Fredoka']">
              {view === 'list' && 'Qui révise aujourd\'hui ?'}
              {view === 'login' && `Connexion : ${targetProfile?.name}`}
              {view === 'create' && 'Créer un nouveau profil'}
              {view === 'edit' && 'Modifier mon profil'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Chaque écolier conserve son prénom, son mot de passe et sa progression.
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* VIEW: PROFILES LIST */}
        {view === 'list' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profiles.map((p) => {
                const char = AVATAR_CHARACTERS.find(c => c.id === p.progress.avatar.character) || AVATAR_CHARACTERS[0];
                const isActive = p.id === activeProfile.id;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between gap-3 relative ${
                      isActive
                        ? 'border-amber-400 bg-amber-50/60 shadow-sm ring-2 ring-amber-300'
                        : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      onClick={() => handleOpenLogin(p)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-xs shrink-0">
                        {char.icon}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-base font-['Fredoka']">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                            {p.grade}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <span>⭐ {p.progress.stars}</span>
                          <span>🪙 {p.progress.coins}</span>
                        </div>

                        {isActive && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                            Connecté actuellement
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={() => handleOpenLogin(p)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                      >
                        {isActive ? 'Choisir' : 'Ouvrir'}
                      </button>

                      {profiles.length > 1 && (
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Supprimer ce profil"
                          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create new profile button & Edit current */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => { sound.playPop(); setView('create'); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-2xl shadow-sm text-xs sm:text-sm transition-all"
              >
                <UserPlus size={18} />
                <span>Ajouter un nouvel écolier</span>
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  setEditName(activeProfile.name);
                  setEditPassword(activeProfile.password);
                  setView('edit');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Modifier mon prénom / code
              </button>
            </div>
          </div>
        )}

        {/* VIEW: LOGIN WITH PASSWORD */}
        {view === 'login' && targetProfile && (
          <form onSubmit={handleVerifyLogin} className="space-y-5">
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-3xl shadow-xs">
                {AVATAR_CHARACTERS.find(c => c.id === targetProfile.progress.avatar.character)?.icon || '🦊'}
              </div>
              <div>
                <h4 className="font-black text-amber-950 text-base">
                  Bonjour {targetProfile.name} !
                </h4>
                <p className="text-xs text-amber-800 font-semibold">
                  Classe de {targetProfile.grade} · {targetProfile.progress.stars} étoiles
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Lock size={15} className="text-amber-600" />
                Mot de passe ou Code secret
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Entre ton mot de passe..."
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-500 outline-none text-lg font-bold text-slate-800"
              />
              {loginError && (
                <p className="text-xs font-bold text-rose-600 animate-shake">
                  {loginError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { sound.playPop(); setView('list'); }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs px-3 py-2"
              >
                <ArrowLeft size={16} />
                Changer d'écolier
              </button>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-sm text-sm transition-all"
              >
                Se connecter et réviser
              </button>
            </div>
          </form>
        )}

        {/* VIEW: CREATE NEW PUPIL PROFILE */}
        {view === 'create' && (
          <form onSubmit={handleCreateNew} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Prénom de l'élève :
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex : Maxime, Chloé, Jules..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  Classe :
                </label>
                <div className="flex gap-2">
                  {(['CE1', 'CM2'] as GradeLevel[]).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setNewGrade(g)}
                      className={`flex-1 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                        newGrade === g
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <KeyRound size={13} /> Code secret :
                </label>
                <input
                  type="password"
                  placeholder="Code ou mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm"
                />
              </div>
            </div>

            {/* Choose Starting Mascot */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Choisis ta mascotte de départ :
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_CHARACTERS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setNewCharacter(c.id)}
                    className={`h-14 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${
                      newCharacter === c.id
                        ? 'border-emerald-500 bg-emerald-50 scale-110 shadow-xs ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    {c.icon}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p className="text-xs font-bold text-rose-600">{createError}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { sound.playPop(); setView('list'); }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-sm text-sm transition-all"
              >
                Créer mon carnet d'écolier
              </button>
            </div>
          </form>
        )}

        {/* VIEW: EDIT CURRENT PROFILE */}
        {view === 'edit' && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Prénom :
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-500 outline-none font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Nouveau mot de passe ou code secret :
              </label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-500 outline-none font-bold text-slate-800"
              />
            </div>

            {editSuccess && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> Modifications enregistrées !
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { sound.playPop(); setView('list'); }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Retour
              </button>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-sm text-sm transition-all"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
