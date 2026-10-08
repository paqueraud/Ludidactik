/** Petits composants de l'espace parents (sobres, lisibles, cibles tactiles ≥ 48 px). */
import type { ReactNode } from 'react';
import { Avatar } from '@/avatar/Avatar';
import type { Profile } from '@/services/storage/db';

export function Section({
  titre,
  intro,
  children,
  actions,
}: {
  titre: string;
  intro?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="carte mb-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-2xl">{titre}</h2>
          {intro && <div className="mt-1 text-ink-soft">{intro}</div>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Interrupteur accessible (role="switch"). */
export function Interrupteur({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange(v: boolean): void;
  label: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-12 w-[76px] shrink-0 rounded-full transition-colors ${checked ? 'bg-grass-dark' : 'bg-ink/25'}`}
      >
        <span
          aria-hidden
          className={`absolute top-1.5 h-9 w-9 rounded-full bg-white shadow transition-[left] ${checked ? 'left-[34px]' : 'left-1.5'}`}
        />
      </button>
      <div className="min-w-0">
        <div className="font-bold">{label}</div>
        {description && <div className="text-sm text-ink-soft">{description}</div>}
      </div>
    </div>
  );
}

/** Choix du profil enfant (onglets avec avatar). */
export function ChoixProfil({
  profiles,
  value,
  onChange,
}: {
  profiles: Profile[];
  value: string | null;
  onChange(id: string): void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Enfant">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={value === p.id}
          onClick={() => onChange(p.id)}
          className={`flex min-h-btn items-center gap-2 rounded-full py-1 pl-1 pr-4 font-bold ${value === p.id ? 'bg-ink text-cream' : 'bg-card shadow-soft'}`}
        >
          <Avatar config={p.avatar} size={44} compagnon={false} fond="rgb(var(--c-sky) / 0.35)" />
          {p.prenom}
          <span className="text-sm opacity-80">({p.classe})</span>
        </button>
      ))}
    </div>
  );
}

export function AucunProfil() {
  return (
    <p className="carte p-5">
      Aucun profil enfant n’existe encore. Les enfants créent leur profil depuis le bouton « Jouer » de
      l’accueil ; vous pourrez ensuite tout régler ici.
    </p>
  );
}

export const champ =
  'min-h-touch w-full rounded-2xl border-2 border-ink/20 bg-cream px-3 py-2 text-lg outline-none focus:border-grape';
