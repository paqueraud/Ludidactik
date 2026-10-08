/**
 * Écran partagé du duel sur le même appareil : sur tablette ou téléphone, deux moitiés face à face
 * (celle du haut retournée pour le joueur assis en face) ; sur grand écran, côte à côte.
 */
import type { ReactNode } from 'react';
import type { AvatarConfig } from '@/avatar/parts';
import { Avatar } from '@/avatar/Avatar';

export interface Joueur {
  nom: string;
  avatar: AvatarConfig | null;
  couleur: string; // classe Tailwind de fond
}

export function DuelEcran({
  joueurs,
  rendu,
  centre,
}: {
  joueurs: [Joueur, Joueur];
  /** Contenu de la moitié du joueur `i` (0 = joueur 1, en bas ; 1 = joueur 2, en haut). */
  rendu: (i: 0 | 1) => ReactNode;
  centre: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 grid grid-rows-2 bg-cream lg:grid-cols-2 lg:grid-rows-1">
      <section
        className={`relative flex rotate-180 flex-col overflow-hidden p-2 lg:order-2 lg:rotate-0 lg:p-6 ${joueurs[1].couleur}`}
        aria-label={`Moitié de ${joueurs[1].nom}`}
      >
        <EnTete j={joueurs[1]} />
        {rendu(1)}
      </section>
      <section
        className={`relative flex flex-col overflow-hidden p-2 lg:order-1 lg:p-6 ${joueurs[0].couleur}`}
        aria-label={`Moitié de ${joueurs[0].nom}`}
      >
        <EnTete j={joueurs[0]} />
        {rendu(0)}
      </section>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center lg:inset-x-auto lg:left-1/2 lg:top-4 lg:-translate-x-1/2 lg:translate-y-0">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card px-2 py-1 shadow-soft">
          {centre}
        </div>
      </div>
    </div>
  );
}

function EnTete({ j }: { j: Joueur }) {
  return (
    <div className="flex items-center gap-2">
      {j.avatar ? (
        <Avatar config={j.avatar} size={36} compagnon={false} fond="rgb(255 255 255 / 0.6)" />
      ) : (
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-xl"
          aria-hidden
        >
          🙂
        </span>
      )}
      <span className="font-titre text-lg font-extrabold">{j.nom}</span>
    </div>
  );
}

/** Pavé numérique compact (touches de 48 px) pour tenir dans une demi-page. */
export function PaveCompact({
  onKey,
  onDelete,
  onSubmit,
  disabled,
  decimal,
  nom,
}: {
  onKey(k: string): void;
  onDelete(): void;
  onSubmit(): void;
  disabled?: boolean;
  decimal?: boolean;
  nom: string;
}) {
  const touches = ['7', '8', '9', '4', '5', '6', '1', '2', '3', decimal ? ',' : '⌫', '0', 'OK'];
  return (
    <div
      className="mx-auto grid w-full max-w-[17rem] grid-cols-3 gap-1.5"
      role="group"
      aria-label={`Pavé de ${nom}`}
    >
      {touches.map((t) => (
        <button
          key={t}
          type="button"
          disabled={disabled}
          aria-label={t === '⌫' ? 'Effacer' : t === 'OK' ? 'Valider' : t === ',' ? 'virgule' : t}
          onClick={() => (t === 'OK' ? onSubmit() : t === '⌫' ? onDelete() : onKey(t))}
          className={`btn-3d h-12 text-2xl shadow-pop-sm ${t === 'OK' ? 'bg-grass-dark text-white' : t === '⌫' ? 'bg-coral/20' : 'bg-card'}`}
        >
          {t}
        </button>
      ))}
      {decimal && (
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="btn-3d col-span-3 h-12 bg-coral/20 text-lg shadow-pop-sm"
        >
          Effacer
        </button>
      )}
    </div>
  );
}
