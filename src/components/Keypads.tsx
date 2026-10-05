/** Pavé numérique géant et clavier AZERTY avec accents (touches ≥ 48 px), utilisables aussi au clavier physique. */
import { ArrowBigUp, CornerDownLeft, Delete } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sfx } from '@/services/sfx';

interface KeyHandlers {
  onKey(k: string): void;
  onDelete(): void;
  onSubmit(): void;
  disabled?: boolean;
}

/** Écoute le clavier physique (chiffres, lettres, Retour arrière, Entrée). */
export function usePhysicalKeyboard(
  { onKey, onDelete, onSubmit, disabled }: KeyHandlers,
  accept: RegExp,
  opts: { pointEnVirgule?: boolean } = {},
) {
  const { pointEnVirgule = false } = opts;
  useEffect(() => {
    if (disabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
      } else if (e.key.length === 1 && accept.test(e.key)) {
        e.preventDefault();
        onKey(pointEnVirgule && e.key === '.' ? ',' : e.key);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onKey, onDelete, onSubmit, disabled, accept, pointEnVirgule]);
}

const keyBase =
  'btn-3d flex items-center justify-center bg-card text-ink shadow-pop-sm active:translate-y-[3px] active:shadow-none font-titre';

export function Keypad({
  onKey,
  onDelete,
  onSubmit,
  disabled,
  decimal = false,
}: KeyHandlers & { decimal?: boolean }) {
  const press = (fn: () => void) => () => {
    if (disabled) return;
    sfx.play('tic');
    fn();
  };
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  return (
    <div className="grid w-full max-w-xs grid-cols-3 gap-2.5" role="group" aria-label="Pavé numérique">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          className={`${keyBase} h-14 text-3xl sm:h-16`}
          onClick={press(() => onKey(k))}
          disabled={disabled}
        >
          {k}
        </button>
      ))}
      {decimal ? (
        <button
          type="button"
          className={`${keyBase} h-14 text-3xl sm:h-16`}
          onClick={press(() => onKey(','))}
          disabled={disabled}
          aria-label="virgule"
        >
          ,
        </button>
      ) : (
        <button
          type="button"
          className={`${keyBase} h-14 bg-coral/15 sm:h-16`}
          onClick={press(onDelete)}
          disabled={disabled}
          aria-label="Effacer"
        >
          <Delete size={28} aria-hidden />
        </button>
      )}
      <button
        type="button"
        className={`${keyBase} h-14 text-3xl sm:h-16`}
        onClick={press(() => onKey('0'))}
        disabled={disabled}
      >
        0
      </button>
      <button
        type="button"
        className={`${keyBase} h-14 bg-grass-dark text-white sm:h-16`}
        onClick={press(onSubmit)}
        disabled={disabled}
        aria-label="Valider"
      >
        <CornerDownLeft size={28} aria-hidden />
      </button>
      {decimal && (
        <button
          type="button"
          className={`${keyBase} col-span-3 h-12 bg-coral/15 text-lg`}
          onClick={press(onDelete)}
          disabled={disabled}
          aria-label="Effacer"
        >
          <Delete size={24} aria-hidden /> Effacer
        </button>
      )}
    </div>
  );
}

const ROWS = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', "'", '-'],
];
const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ô', 'ë', 'ï', 'œ'];

export function LetterKeyboard({
  onKey,
  onDelete,
  onSubmit,
  disabled,
  ponctuation = false,
}: KeyHandlers & { ponctuation?: boolean }) {
  // Majuscule : s'applique à la lettre suivante seulement (comme sur une tablette)
  const [maj, setMaj] = useState(false);
  const press = (fn: () => void) => () => {
    if (disabled) return;
    sfx.play('tic');
    fn();
  };
  const k = (c: string, extra = '') => {
    const out = maj ? c.toUpperCase() : c;
    return (
      <button
        key={c}
        type="button"
        className={`${keyBase} h-12 min-w-0 flex-1 rounded-xl text-xl sm:h-14 ${extra}`}
        onClick={press(() => {
          onKey(out);
          setMaj(false);
        })}
        disabled={disabled}
        aria-label={
          c === "'"
            ? 'apostrophe'
            : c === '-'
              ? 'trait d’union'
              : c === '.'
                ? 'point'
                : c === ','
                  ? 'virgule'
                  : out
        }
      >
        {out}
      </button>
    );
  };
  return (
    <div className="flex w-full max-w-3xl flex-col gap-1.5" role="group" aria-label="Clavier">
      <div className="flex gap-1">{ACCENTS.map((c) => k(c, 'bg-sun/30'))}</div>
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((c) => k(c))}
        </div>
      ))}
      <div className="flex gap-1.5">
        <button
          type="button"
          className={`${keyBase} h-12 flex-[1.2] rounded-xl sm:h-14 ${maj ? 'bg-grape text-white' : ''}`}
          onClick={press(() => setMaj((m) => !m))}
          disabled={disabled}
          aria-label="Majuscule"
          aria-pressed={maj}
        >
          <ArrowBigUp size={26} aria-hidden />
        </button>
        {ponctuation && k('.', 'flex-[0.8]')}
        {ponctuation && k(',', 'flex-[0.8]')}
        <button
          type="button"
          className={`${keyBase} h-12 flex-[1.2] rounded-xl bg-coral/15 sm:h-14`}
          onClick={press(onDelete)}
          disabled={disabled}
          aria-label="Effacer"
        >
          <Delete size={24} aria-hidden />
        </button>
        <button
          type="button"
          className={`${keyBase} h-12 flex-[3] rounded-xl text-base sm:h-14`}
          onClick={press(() => onKey(' '))}
          disabled={disabled}
          aria-label="espace"
        >
          espace
        </button>
        <button
          type="button"
          className={`${keyBase} h-12 flex-[1.6] rounded-xl bg-grass-dark text-white sm:h-14`}
          onClick={press(onSubmit)}
          disabled={disabled}
          aria-label="Valider"
        >
          <CornerDownLeft size={24} aria-hidden /> OK
        </button>
      </div>
    </div>
  );
}
