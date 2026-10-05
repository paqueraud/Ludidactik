/** Décors de la bataille navale (SVG originaux, ton de jeu de bain : bombes de peinture, drapeau blanc). */
import { motion } from 'framer-motion';

/** Bateau pirate de dessin animé, quille à l'origine. `peint` = touché par la peinture. */
export function BateauPirate({ peint, couleur = '#FF7A6B' }: { peint: boolean; couleur?: string }) {
  return (
    <g>
      {/* coque */}
      <path d="M-62 -30 L 62 -30 L 46 0 L -46 0 Z" fill="#8D5A3B" />
      <path d="M-62 -30 L 62 -30 L 58 -22 L -58 -22 Z" fill="#A97452" />
      {[-30, 0, 30].map((x) => (
        <circle key={x} cx={x} cy="-14" r="5" fill="#5C3A22" />
      ))}
      {/* mât et voile */}
      <rect x="-3" y="-118" width="6" height="90" fill="#6D4C2F" />
      <path d="M4 -112 Q 50 -86 4 -42 Z" fill="#FFF8EC" />
      <path d="M-4 -106 Q -44 -82 -4 -50 Z" fill="#FFF3D6" />
      {/* drapeau : rond souriant, ou drapeau blanc si touché */}
      {peint ? (
        <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: '-118px' }}>
          <rect x="3" y="-138" width="34" height="22" rx="3" fill="#fff" stroke="#24304A" strokeWidth="2" />
        </motion.g>
      ) : (
        <g>
          <rect x="3" y="-138" width="34" height="22" rx="3" fill="#24304A" />
          <circle cx="20" cy="-127" r="7" fill="#FFD45C" />
          <path d="M16 -126 Q 20 -122 24 -126" stroke="#24304A" strokeWidth="1.8" fill="none" />
        </g>
      )}
      {peint && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 9 }}
        >
          <path
            d="M-30 -40 q 10 -22 26 -10 q 16 -18 26 2 q 22 0 12 20 q 10 18 -12 18 q -8 18 -26 4 q -18 10 -24 -10 q -18 -8 -2 -24 z"
            fill={couleur}
            opacity="0.9"
          />
          {[
            [-46, -52, 6],
            [44, -56, 5],
            [52, -10, 4],
            [-52, -8, 5],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={couleur} />
          ))}
        </motion.g>
      )}
    </g>
  );
}

/** Gerbe d'eau (tir à côté). */
export function Gerbe() {
  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 1 }}
      animate={{ scaleY: [0, 1.2, 1], opacity: [1, 1, 0.8] }}
      style={{ originY: '0px' }}
    >
      <path
        d="M-26 0 Q -20 -40 -8 -60 Q -4 -30 0 -70 Q 6 -30 10 -58 Q 20 -40 26 0 Z"
        fill="#E6F7FF"
        opacity="0.95"
      />
      <circle cx="-20" cy="-66" r="5" fill="#E6F7FF" />
      <circle cx="18" cy="-74" r="4" fill="#E6F7FF" />
    </motion.g>
  );
}

/** Radeau-canon du joueur (canon à peinture). */
export function Canon() {
  return (
    <g>
      <rect x="-40" y="-8" width="80" height="14" rx="5" fill="#C9A06A" />
      <rect x="-40" y="-8" width="80" height="4" fill="#E0BB85" />
      <g transform="rotate(-35)">
        <rect x="-6" y="-46" width="20" height="44" rx="8" fill="#8E7CFF" />
        <rect x="-8" y="-50" width="24" height="10" rx="4" fill="#6A5AE0" />
      </g>
      <circle cx="0" cy="-6" r="12" fill="#6A5AE0" />
    </g>
  );
}
