/** Véhicules du Tour : un camping-car (cartes de France et d'Europe) et un avion (planisphère). */
import { motion } from 'framer-motion';

export function Vehicule({
  x,
  y,
  taille,
  type,
  reduce,
  saute,
}: {
  x: number;
  y: number;
  taille: number;
  type: 'camping-car' | 'avion';
  reduce: boolean;
  /** Petit saut de joie à l'arrivée. */
  saute: boolean;
}) {
  const s = taille / 100;
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={{ duration: reduce ? 0 : 1.1, ease: 'easeInOut' }}
      pointerEvents="none"
      aria-hidden
    >
      <motion.g
        animate={saute && !reduce ? { y: [0, -taille * 0.25, 0] } : { y: 0 }}
        transition={{ duration: 0.5, repeat: saute && !reduce ? 1 : 0 }}
      >
        <g transform={`scale(${s}) translate(-50 -70)`}>
          {type === 'camping-car' ? <CampingCar /> : <Avion />}
        </g>
      </motion.g>
    </motion.g>
  );
}

function CampingCar() {
  return (
    <g>
      <ellipse cx="50" cy="76" rx="44" ry="6" fill="#24304A" opacity="0.18" />
      {/* cellule */}
      <path
        d="M8 28 Q8 16 20 16 H70 Q80 16 84 28 L92 42 Q96 46 96 52 V64 Q96 68 92 68 H12 Q8 68 8 64 Z"
        fill="#FFFFFF"
        stroke="#24304A"
        strokeWidth="3"
      />
      {/* capucine */}
      <path d="M20 16 Q22 6 34 6 H64 Q72 6 74 16 Z" fill="#FFD45C" stroke="#24304A" strokeWidth="3" />
      {/* bande colorée */}
      <rect x="9" y="50" width="86" height="7" fill="#FF7A6B" />
      {/* fenêtres */}
      <rect x="16" y="26" width="20" height="14" rx="3" fill="#9FD8F5" stroke="#24304A" strokeWidth="2.5" />
      <rect x="42" y="26" width="20" height="14" rx="3" fill="#9FD8F5" stroke="#24304A" strokeWidth="2.5" />
      <path d="M70 28 H80 L88 42 H70 Z" fill="#9FD8F5" stroke="#24304A" strokeWidth="2.5" />
      {/* roues */}
      <circle cx="28" cy="68" r="9" fill="#24304A" />
      <circle cx="28" cy="68" r="3.5" fill="#FFFFFF" />
      <circle cx="78" cy="68" r="9" fill="#24304A" />
      <circle cx="78" cy="68" r="3.5" fill="#FFFFFF" />
      {/* fanion */}
      <line x1="30" y1="6" x2="30" y2="-12" stroke="#24304A" strokeWidth="2.5" />
      <path d="M30 -12 L46 -6 L30 0 Z" fill="#7BD389" stroke="#24304A" strokeWidth="2" />
    </g>
  );
}

function Avion() {
  return (
    <g>
      <ellipse cx="50" cy="80" rx="34" ry="5" fill="#24304A" opacity="0.15" />
      {/* aile arrière */}
      <path d="M38 40 L22 22 H30 L52 40 Z" fill="#8E7CFF" stroke="#24304A" strokeWidth="2.5" />
      {/* fuselage */}
      <path
        d="M10 44 Q10 34 24 34 H80 Q96 36 98 46 Q96 56 80 56 H24 Q10 56 10 44 Z"
        fill="#FFFFFF"
        stroke="#24304A"
        strokeWidth="3"
      />
      {/* aile */}
      <path d="M44 48 L64 72 H74 L60 48 Z" fill="#8E7CFF" stroke="#24304A" strokeWidth="2.5" />
      {/* dérive */}
      <path d="M12 42 L4 22 H14 L26 38 Z" fill="#FF7A6B" stroke="#24304A" strokeWidth="2.5" />
      {/* hublots */}
      {[34, 46, 58, 70].map((x) => (
        <circle key={x} cx={x} cy="43" r="3.5" fill="#9FD8F5" stroke="#24304A" strokeWidth="1.5" />
      ))}
      <path d="M84 40 Q92 41 94 46 H84 Z" fill="#9FD8F5" stroke="#24304A" strokeWidth="1.5" />
    </g>
  );
}
