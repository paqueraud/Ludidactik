/** Kit d'interface : gros boutons tactiles (≥ 56 px), bouton 🔊, étoiles, anneau de progression. */
import { Star, Volume2 } from 'lucide-react';
import { type ButtonHTMLAttributes, type ReactNode, useState } from 'react';
import { sfx } from '@/services/sfx';
import { speech } from '@/services/speech';

type Variant = 'sky' | 'grass' | 'sun' | 'coral' | 'grape' | 'blanc' | 'fantome';

const VARIANTS: Record<Variant, string> = {
  // bleu foncé : contraste AA avec le texte blanc
  sky: 'bg-sky-dark text-white [text-shadow:0_2px_0_rgb(0_0_0/0.15)]',
  grass: 'bg-grass-dark text-white',
  sun: 'bg-sun text-ink',
  coral: 'bg-coral text-white',
  grape: 'bg-grape text-white',
  blanc: 'bg-card text-ink',
  fantome: 'bg-transparent text-ink shadow-none hover:bg-ink/5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg' | 'xl';
  icon?: ReactNode;
}

export function Button({
  variant = 'sky',
  size = 'md',
  icon,
  className = '',
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const sizes = {
    md: 'min-h-btn px-5 text-lg',
    lg: 'min-h-[64px] px-7 text-xl',
    xl: 'min-h-[76px] px-10 text-2xl',
  };
  return (
    <button
      type="button"
      className={`btn-3d inline-flex items-center justify-center gap-2 ${sizes[size]} ${VARIANTS[variant]} ${className}`}
      onClick={(e) => {
        sfx.play('pop');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** Bouton 🔊 : lit un texte à voix haute. Présent sur toute consigne. */
export function SpeakButton({
  text,
  label = 'Écouter',
  className = '',
  size = 48,
  lang,
}: {
  text: string | (() => string);
  label?: string;
  className?: string;
  size?: number;
  lang?: string;
}) {
  const [busy, setBusy] = useState(false);
  if (!speech.ttsAvailable) return null;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-sun text-ink shadow-pop-sm transition-transform active:translate-y-[3px] active:shadow-none ${busy ? 'animate-wiggle' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        await speech.speak(typeof text === 'function' ? text() : text, { lang });
        setBusy(false);
      }}
    >
      <Volume2 size={size * 0.5} aria-hidden />
    </button>
  );
}

export function Stars({
  value,
  max = 3,
  size = 22,
  className = '',
}: {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex gap-0.5 ${className}`}
      aria-label={`${value} étoile${value > 1 ? 's' : ''} sur ${max}`}
      role="img"
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          aria-hidden
          className={i < value ? 'fill-sun text-sun-dark' : 'fill-ink/10 text-ink/20'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 7,
  color = 'rgb(var(--c-grass))',
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(v * 100)} %`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgb(var(--c-ink) / 0.1)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-titre text-sm font-bold">
        {children}
      </span>
    </span>
  );
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${className}`}>
      {children}
    </span>
  );
}

/** Pièce « Ludi » (monnaie du jeu). */
export function LudiCoin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fill="#B07800"
        fontFamily="Baloo 2, sans-serif"
      >
        L
      </text>
    </svg>
  );
}
