/** Le robot calculateur (SVG original) : il parle (bouche LED), écoute (antenne), se réjouit (yeux). */
import { motion, useReducedMotion } from 'framer-motion';

export type Humeur = 'parle' | 'ecoute' | 'content' | 'perplexe' | 'repos';

export function Robot({ humeur, batterie }: { humeur: Humeur; batterie: number }) {
  const reduce = useReducedMotion();
  const anime = !reduce;
  const yeux =
    humeur === 'content' ? (
      <>
        <path d="M70 92 q 12 -14 24 0" stroke="#7BF5C8" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M126 92 q 12 -14 24 0" stroke="#7BF5C8" strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    ) : humeur === 'perplexe' ? (
      <>
        <circle cx="82" cy="90" r="9" fill="#7BF5C8" />
        <rect x="128" y="86" width="22" height="7" rx="3.5" fill="#7BF5C8" />
      </>
    ) : (
      <>
        <motion.circle
          cx="82"
          cy="90"
          r="10"
          fill="#7BF5C8"
          animate={anime ? { scaleY: [1, 1, 0.1, 1] } : undefined}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
          style={{ originY: '90px' }}
        />
        <motion.circle
          cx="138"
          cy="90"
          r="10"
          fill="#7BF5C8"
          animate={anime ? { scaleY: [1, 1, 0.1, 1] } : undefined}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
          style={{ originY: '90px' }}
        />
      </>
    );
  return (
    <motion.svg
      viewBox="0 0 220 300"
      className="h-full w-auto"
      aria-hidden
      animate={anime && humeur === 'content' ? { y: [0, -14, 0] } : { y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ombre */}
      <ellipse cx="110" cy="290" rx="70" ry="8" fill="#000" opacity="0.15" />
      {/* antenne */}
      <line x1="110" y1="40" x2="110" y2="14" stroke="#8D93B5" strokeWidth="5" />
      <motion.circle
        cx="110"
        cy="12"
        r="9"
        fill={humeur === 'ecoute' ? '#FF7A6B' : '#FFD45C'}
        animate={
          anime && (humeur === 'ecoute' || humeur === 'parle') ? { scale: [1, 1.35, 1] } : { scale: 1 }
        }
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      {/* tête */}
      <rect x="40" y="40" width="140" height="110" rx="34" fill="#B9C3E6" />
      <rect x="40" y="40" width="140" height="18" rx="9" fill="#D3DAF2" />
      <rect x="56" y="60" width="108" height="76" rx="22" fill="#24304A" />
      {yeux}
      {/* bouche LED */}
      {humeur === 'parle' ? (
        <motion.rect
          x="94"
          y="112"
          width="32"
          rx="5"
          fill="#7BF5C8"
          animate={
            anime ? { height: [4, 14, 6, 12, 4], y: [116, 110, 115, 111, 116] } : { height: 8, y: 114 }
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      ) : humeur === 'content' ? (
        <path d="M92 112 q 18 16 36 0" stroke="#7BF5C8" strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : humeur === 'ecoute' ? (
        <circle cx="110" cy="118" r="6" fill="#7BF5C8" />
      ) : (
        <rect x="96" y="114" width="28" height="5" rx="2.5" fill="#7BF5C8" />
      )}
      {/* oreilles */}
      <rect x="26" y="78" width="16" height="36" rx="8" fill="#8E7CFF" />
      <rect x="178" y="78" width="16" height="36" rx="8" fill="#8E7CFF" />
      {/* corps */}
      <rect x="58" y="156" width="104" height="96" rx="26" fill="#B9C3E6" />
      <rect x="76" y="172" width="68" height="48" rx="12" fill="#24304A" />
      {/* batterie */}
      <rect x="86" y="184" width="44" height="22" rx="5" fill="none" stroke="#7BF5C8" strokeWidth="3" />
      <rect x="130" y="190" width="5" height="10" rx="2" fill="#7BF5C8" />
      <motion.rect
        x="89"
        y="187"
        height="16"
        rx="3"
        fill={batterie > 0.66 ? '#7BD389' : batterie > 0.33 ? '#FFD45C' : '#FF7A6B'}
        initial={false}
        animate={{ width: Math.max(2, 38 * batterie) }}
      />
      {/* bras */}
      <motion.rect
        x="30"
        y="166"
        width="26"
        height="64"
        rx="13"
        fill="#8E7CFF"
        style={{ originX: '43px', originY: '170px' }}
        animate={anime && humeur === 'content' ? { rotate: [0, 140, 120, 140, 0] } : { rotate: 0 }}
        transition={{ duration: 1 }}
      />
      <rect x="164" y="166" width="26" height="64" rx="13" fill="#8E7CFF" />
      {/* roues */}
      <circle cx="84" cy="266" r="18" fill="#5B5F7A" />
      <circle cx="136" cy="266" r="18" fill="#5B5F7A" />
      <circle cx="84" cy="266" r="7" fill="#B9C3E6" />
      <circle cx="136" cy="266" r="7" fill="#B9C3E6" />
    </motion.svg>
  );
}
