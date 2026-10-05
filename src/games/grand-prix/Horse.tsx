import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export type Gait = 'arret' | 'pas' | 'trot' | 'galop';

const DURATION: Record<Gait, number> = { arret: 0, pas: 0.8, trot: 0.45, galop: 0.26 };

interface Props {
  robe: string;
  criniere: string;
  tapis: string;
  gait: Gait;
  ghost?: boolean;
  stumble?: boolean;
  rider?: ReactNode;
  className?: string;
}

/**
 * Cheval de course vu de profil (tourné vers la droite), jambes animées selon l'allure.
 * Les rotations utilisent <animateTransform> (unités du viewBox) pour rester attachées au corps
 * quelle que soit la taille d'affichage.
 */
export function Horse({
  robe,
  criniere,
  tapis,
  gait,
  ghost = false,
  stumble = false,
  rider,
  className = 'w-16 sm:w-24',
}: Props) {
  const reduce = useReducedMotion();
  const d = DURATION[gait];
  const moving = gait !== 'arret' && !reduce;

  const leg = (x: number, phase: 0 | 1, key: string) => {
    const cx = x + 2.5;
    const a = phase ? 28 : -28;
    return (
      <g key={`${key}-${gait}`}>
        <rect x={x} y={46} width={5} height={26} rx={2.5} fill={robe}>
          {moving && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={`${a} ${cx} 48; ${-a} ${cx} 48; ${a} ${cx} 48`}
              dur={`${d}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
      </g>
    );
  };

  return (
    <motion.svg
      viewBox="0 0 120 84"
      className={`h-auto ${className}`}
      aria-hidden
      style={{ opacity: ghost ? 0.38 : 1, overflow: 'visible' }}
      animate={
        stumble
          ? { rotate: [0, -12, 8, -4, 0], y: [0, 4, 0] }
          : moving
            ? { y: [0, gait === 'galop' ? -5 : -2, 0] }
            : { y: 0, rotate: 0 }
      }
      transition={
        stumble ? { duration: 0.8 } : moving ? { duration: d, repeat: Infinity } : { duration: 0.2 }
      }
    >
      {/* ombre */}
      <ellipse cx="58" cy="80" rx="34" ry="3.5" fill="rgba(0,0,0,0.18)" />
      {/* queue */}
      <path d="M26 36 C12 34 6 46 8 60 C14 52 18 46 26 42 Z" fill={criniere}>
        {moving && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 26 38; 12 26 38; 0 26 38"
            dur={`${d * 2}s`}
            repeatCount="indefinite"
          />
        )}
      </path>
      {leg(34, 0, 'bg')}
      {leg(78, 1, 'fg')}
      {/* corps */}
      <ellipse
        cx="56"
        cy="40"
        rx="32"
        ry="15"
        fill={robe}
        stroke={ghost ? '#24304A' : 'none'}
        strokeDasharray={ghost ? '4 3' : undefined}
      />
      {/* encolure + tête */}
      <path
        d="M74 34 C80 20 86 10 96 8 L106 12 C112 16 116 22 114 26 C110 28 104 26 100 24 C96 30 92 40 86 46 Z"
        fill={robe}
      />
      <path d="M96 8 L94 0 L101 6 Z" fill={robe} />
      <circle cx="103" cy="15" r="2" fill="#24304A" />
      {/* crinière */}
      <path d="M76 32 C80 18 88 8 96 6 C92 14 86 24 82 36 Z" fill={criniere} />
      {leg(42, 1, 'bd')}
      {leg(86, 0, 'fd')}
      {/* tapis de selle */}
      {!ghost && <path d="M44 27 L70 27 L68 46 L46 46 Z" fill={tapis} stroke="white" strokeWidth="1.5" />}
      {rider && <g transform="translate(36 -30)">{rider}</g>}
    </motion.svg>
  );
}
