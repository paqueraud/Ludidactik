import React, { useState } from 'react';
import { UserProgress } from '../types';
import { AVATAR_CHARACTERS, AVATAR_HATS, HORSE_COLORS, AvatarItem } from '../data/avatars';
import { sound } from '../services/sound';
import { X, ShoppingBag, Check, Lock, Sparkles } from 'lucide-react';

interface Props {
  progress: UserProgress;
  onUpdateAvatar: (newAvatar: UserProgress['avatar'], newCoins: number, newUnlocked: string[]) => void;
  onClose: () => void;
}

export const AvatarShopModal: React.FC<Props> = ({
  progress,
  onUpdateAvatar,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'hat' | 'horseColor'>('character');

  const handleSelectOrBuy = (item: AvatarItem) => {
    const isUnlocked = item.cost === 0 || progress.unlockedItems.includes(item.id);

    if (isUnlocked) {
      sound.playSuccess();
      const updated = { ...progress.avatar };
      if (item.category === 'character') updated.character = item.id;
      if (item.category === 'hat') updated.hat = item.id;
      if (item.category === 'horseColor') updated.horseColor = item.id;

      onUpdateAvatar(updated, progress.coins, progress.unlockedItems);
    } else {
      // Need to buy with coins
      if (progress.coins >= item.cost) {
        sound.playFanfare();
        const newCoins = progress.coins - item.cost;
        const newUnlocked = [...progress.unlockedItems, item.id];
        const updated = { ...progress.avatar };
        if (item.category === 'character') updated.character = item.id;
        if (item.category === 'hat') updated.hat = item.id;
        if (item.category === 'horseColor') updated.horseColor = item.id;

        onUpdateAvatar(updated, newCoins, newUnlocked);
      } else {
        sound.playError();
      }
    }
  };

  const getList = () => {
    if (activeTab === 'character') return AVATAR_CHARACTERS;
    if (activeTab === 'hat') return AVATAR_HATS;
    return HORSE_COLORS;
  };

  const currentSelectionId =
    activeTab === 'character'
      ? progress.avatar.character
      : activeTab === 'hat'
      ? progress.avatar.hat
      : progress.avatar.horseColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-4 border-indigo-400 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🛍️</span>
              <span className="text-xs font-black uppercase text-indigo-800 bg-indigo-100 px-3 py-0.5 rounded-full border border-indigo-200">
                L'Atelier des Champions
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 font-['Fredoka']">
              Boutique & Personnalisation
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Dépense tes écus gagnés en révisant pour personnaliser ton écolier !
            </p>
          </div>

          <button
            onClick={() => { sound.playPop(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Coins banner */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-xs font-bold text-amber-900">Solde disponible :</div>
              <div className="text-xl font-black text-amber-950 font-['Fredoka']">
                {progress.coins} Écus
              </div>
            </div>
          </div>
          <span className="text-xs text-amber-800 font-semibold">
            Gagne plus d'écus en réussissant les courses et dictées !
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => { sound.playPop(); setActiveTab('character'); }}
            className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeTab === 'character' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Héros Mascotte
          </button>
          <button
            onClick={() => { sound.playPop(); setActiveTab('hat'); }}
            className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeTab === 'hat' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chapeaux & Coiffes
          </button>
          <button
            onClick={() => { sound.playPop(); setActiveTab('horseColor'); }}
            className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeTab === 'horseColor' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cheval de Course
          </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {getList().map((item) => {
            const isSelected = currentSelectionId === item.id;
            const isUnlocked = item.cost === 0 || progress.unlockedItems.includes(item.id);
            const canAfford = progress.coins >= item.cost;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectOrBuy(item)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 text-center relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400'
                    : isUnlocked
                    ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50/70 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </span>
                )}

                <div className="text-4xl py-2">{item.icon}</div>

                <div>
                  <h4 className="font-black text-slate-900 text-xs md:text-sm">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  {isSelected ? (
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                      Équipé
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-xs font-bold text-emerald-700 hover:underline">
                      Sélectionner
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-xs font-black text-amber-900 bg-amber-100 py-1 px-2 rounded-xl">
                      <Lock size={12} />
                      <span>{item.cost} écus</span>
                    </div>
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
