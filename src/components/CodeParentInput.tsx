/**
 * Champ de saisie du code parent : chiffres masqués, clavier numérique sur tablette.
 * Le code n'est jamais lu à voix haute ni affiché.
 */
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange(v: string): void;
  erreur?: boolean;
  autoFocus?: boolean;
}

export function CodeParentInput({ id, label, value, onChange, erreur = false, autoFocus = false }: Props) {
  const [voir, setVoir] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <span className="flex gap-2">
        <input
          id={id}
          className={`min-h-btn w-full min-w-0 flex-1 rounded-2xl border-4 bg-cream px-4 font-titre text-2xl tracking-[0.3em] outline-none focus:border-grape ${erreur ? 'animate-shake border-coral' : 'border-sky'}`}
          type={voir ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button
          type="button"
          className="flex min-h-btn w-14 shrink-0 items-center justify-center rounded-2xl bg-cream"
          aria-label={voir ? 'Cacher le code' : 'Montrer le code'}
          onClick={() => setVoir((v) => !v)}
        >
          {voir ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      </span>
    </div>
  );
}
