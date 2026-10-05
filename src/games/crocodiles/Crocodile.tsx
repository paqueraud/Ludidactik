/** Le crocodile glouton (SVG original). `sens` : vers où s'ouvre la gueule ; `croque` : mâchoires fermées. */
import { motion, useReducedMotion } from 'framer-motion';

export type Sens = 'gauche' | 'droite' | 'egal' | 'attend';

export function Crocodile({ sens, croque }: { sens: Sens; croque: boolean }) {
  const reduce = useReducedMotion();
  // Dessiné gueule vers la DROITE ; on retourne horizontalement pour la gauche.
  const flip = sens === 'gauche' ? -1 : 1;
  const ouverture = sens === 'egal' || sens === 'attend' ? 6 : croque ? 2 : 30;
  return (
    <motion.svg
      className="h-auto w-full"
      viewBox="0 0 200 150"
      aria-hidden
      animate={sens === 'attend' && !reduce ? { scaleX: [1, 1, -1, -1, 1] } : { scaleX: flip }}
      transition={
        sens === 'attend' && !reduce
          ? { duration: 3.2, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }
          : { type: 'spring', stiffness: 260, damping: 18 }
      }
    >
      {/* queue */}
      <path d="M58 104 C 30 110 14 96 6 80 C 22 92 36 92 56 86 Z" fill="#3E9B45" />
      {/* corps */}
      <ellipse cx="80" cy="96" rx="40" ry="28" fill="#4CB050" />
      <ellipse cx="80" cy="106" rx="30" ry="14" fill="#BDE7A8" />
      {[60, 76, 92].map((x) => (
        <path key={x} d={`M${x} 70 l 6 -9 l 6 9 z`} fill="#3E9B45" />
      ))}
      {/* pattes */}
      <rect x="56" y="114" width="14" height="18" rx="7" fill="#3E9B45" />
      <rect x="92" y="114" width="14" height="18" rx="7" fill="#3E9B45" />
      {/* mâchoire du bas */}
      <motion.g
        style={{ originX: '110px', originY: '96px' }}
        animate={{ rotate: reduce ? ouverture / 3 : ouverture / 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      >
        <path d="M106 92 L 190 98 C 192 108 184 114 176 114 L 108 112 Z" fill="#4CB050" />
        <path d="M112 100 L 182 104 L 178 110 L 112 108 Z" fill="#E86F7E" />
        {[124, 140, 156, 170].map((x) => (
          <path key={x} d={`M${x} 101 l 5 -8 l 5 8 z`} fill="#fff" />
        ))}
      </motion.g>
      {/* mâchoire du haut + tête */}
      <motion.g
        style={{ originX: '110px', originY: '92px' }}
        animate={{ rotate: -(reduce ? ouverture / 3 : ouverture / 2) }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      >
        <path d="M100 92 C 100 66 126 58 150 66 L 192 82 C 198 86 196 94 188 94 L 104 96 Z" fill="#5BC160" />
        <path d="M112 92 L 184 88 L 180 94 L 112 96 Z" fill="#E86F7E" />
        {[124, 140, 156, 170].map((x) => (
          <path key={x} d={`M${x} 91 l 5 8 l 5 -8 z`} fill="#fff" />
        ))}
        <circle cx="186" cy="80" r="2.5" fill="#2B7A33" />
        {/* œil */}
        <circle cx="128" cy="62" r="13" fill="#fff" stroke="#3E9B45" strokeWidth="3" />
        <circle cx={sens === 'attend' ? 128 : 132} cy="62" r="6" fill="#24304A" />
        <circle cx={sens === 'attend' ? 126 : 134} cy="59" r="2" fill="#fff" />
      </motion.g>
    </motion.svg>
  );
}
