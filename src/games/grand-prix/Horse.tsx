import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode, useId } from 'react';
import type { MotifRobe } from '@/meta/robes';

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
  /** Motif de la robe (boutique) : pommelé, pie, balzanes, licorne arc-en-ciel. */
  motif?: MotifRobe;
  motifCouleur?: string;
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
  motif = 'aucun',
  motifCouleur = '#fff',
}: Props) {
  const reduce = useReducedMotion();
  const gradId = `arc-${useId().replace(/:/g, '')}`;
  const crin = motif === 'licorne' ? `url(#${gradId})` : criniere;
  const d = DURATION[gait];
  const moving = gait !== 'arret' && !reduce;

  const leg = (x: number, phase: 0 | 1, key: string) => {
    const cx = x + 2.5;
    const a = phase ? 28 : -28;
    return (
      <g key={`${key}-${gait}`}>
        {moving && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`${a} ${cx} 48; ${-a} ${cx} 48; ${a} ${cx} 48`}
            dur={`${d}s`}
            repeatCount="indefinite"
          />
        )}
        <rect x={x} y={46} width={5} height={26} rx={2.5} fill={robe} />
        {motif === 'balzanes' && <rect x={x} y={64} width={5} height={8} rx={2.5} fill={motifCouleur} />}
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
      {motif === 'licorne' && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5C7A" />
            <stop offset="25%" stopColor="#FFB547" />
            <stop offset="50%" stopColor="#FFE15C" />
            <stop offset="70%" stopColor="#6FD08C" />
            <stop offset="85%" stopColor="#5DB7F5" />
            <stop offset="100%" stopColor="#A57CF0" />
          </linearGradient>
        </defs>
      )}
      {/* ombre */}
      <ellipse cx="58" cy="80" rx="34" ry="3.5" fill="rgba(0,0,0,0.18)" />
      {/* queue */}
      <path d="M26 36 C12 34 6 46 8 60 C14 52 18 46 26 42 Z" fill={crin}>
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
      {motif === 'pommele' && (
        <g fill={motifCouleur} opacity={0.55}>
          {[
            [40, 36, 3],
            [50, 44, 3.5],
            [60, 34, 2.5],
            [68, 44, 3],
            [46, 30, 2],
            [76, 38, 2.5],
            [34, 44, 2.5],
            [56, 50, 2],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      )}
      {motif === 'pie' && (
        <g fill={motifCouleur}>
          <path d="M30 34 C34 26 46 26 48 34 C50 42 40 48 32 46 C26 44 26 38 30 34 Z" />
          <path d="M64 40 C68 32 80 34 82 42 C82 50 70 54 64 50 Z" />
        </g>
      )}
      {/* encolure + tête */}
      <path
        d="M74 34 C80 20 86 10 96 8 L106 12 C112 16 116 22 114 26 C110 28 104 26 100 24 C96 30 92 40 86 46 Z"
        fill={robe}
      />
      <path d="M96 8 L94 0 L101 6 Z" fill={robe} />
      {motif === 'pie' && <path d="M84 30 C88 20 94 14 98 16 C96 24 92 32 86 40 Z" fill={motifCouleur} />}
      <circle cx="103" cy="15" r="2" fill="#24304A" />
      {motif === 'licorne' && (
        <path d="M101 9 L110 -6 L104 11 Z" fill={motifCouleur} stroke="#E0A800" strokeWidth="0.8" />
      )}
      {/* crinière */}
      <path d="M76 32 C80 18 88 8 96 6 C92 14 86 24 82 36 Z" fill={crin} />
      {leg(42, 1, 'bd')}
      {leg(86, 0, 'fd')}
      {/* tapis de selle */}
      {!ghost && <path d="M44 27 L70 27 L68 46 L46 46 Z" fill={tapis} stroke="white" strokeWidth="1.5" />}
      {rider && <g transform="translate(36 -30)">{rider}</g>}
    </motion.svg>
  );
}
