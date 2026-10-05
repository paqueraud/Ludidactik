/** Mot de passe image : l'enfant touche 4 images dans l'ordre (12 au choix). */
import { Delete } from 'lucide-react';
import { PICTOS, PICTO_LENGTH } from '@/services/auth';
import { sfx } from '@/services/sfx';
import { speech } from '@/services/speech';

interface Props {
  value: string[];
  onChange(v: string[]): void;
  erreur?: boolean;
}

export function PicturePassword({ value, onChange, erreur = false }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex gap-2 ${erreur ? 'animate-shake' : ''}`}
        aria-live="polite"
        aria-label={`${value.length} images choisies sur ${PICTO_LENGTH}`}
      >
        {Array.from({ length: PICTO_LENGTH }, (_, i) => {
          const p = PICTOS.find((x) => x.id === value[i]);
          return (
            <div
              key={i}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-4xl ${
                erreur
                  ? 'border-coral bg-coral/10'
                  : p
                    ? 'border-grape bg-grape/10'
                    : 'border-dashed border-ink/20 bg-card'
              }`}
            >
              {p ? <span aria-hidden>{p.emoji}</span> : null}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Images du mot de passe">
        {PICTOS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn-3d flex h-[72px] w-[72px] items-center justify-center bg-card text-4xl"
            aria-label={p.label}
            disabled={value.length >= PICTO_LENGTH}
            onClick={() => {
              sfx.play('pop');
              void speech.speak(p.label);
              onChange([...value, p.id]);
            }}
          >
            <span aria-hidden>{p.emoji}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="flex min-h-touch items-center gap-2 rounded-full bg-coral/15 px-4 font-bold"
        onClick={() => onChange(value.slice(0, -1))}
        disabled={!value.length}
      >
        <Delete aria-hidden /> Effacer
      </button>
    </div>
  );
}
