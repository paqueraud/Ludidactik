/** Le perroquet savant (dessin original) : il écoute, répète, hésite ou se réjouit. */
import { motion } from 'framer-motion';

export type HumeurPerroquet = 'repos' | 'ecoute' | 'parle' | 'perplexe' | 'content';

export function Perroquet({ humeur, reduite }: { humeur: HumeurPerroquet; reduite: boolean }) {
  const bec = humeur === 'parle' || humeur === 'content';
  const tete =
    humeur === 'ecoute' ? { rotate: -14 } : humeur === 'perplexe' ? { rotate: 12 } : { rotate: 0 };
  return (
    <svg viewBox="0 0 200 220" className="h-full w-auto" role="img" aria-label={`Le perroquet ${LIBELLES[humeur]}`}>
      {/* perchoir */}
      <rect x="10" y="176" width="180" height="12" rx="6" fill="#8A5A3B" />
      <path d="M150 182 q14 4 18 18" stroke="#3E9E5A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="160" cy="198" rx="10" ry="6" fill="#7BD389" transform="rotate(30 160 198)" />
      {/* queue */}
      <path d="M86 150 L70 214 L88 210 L96 156 Z" fill="#4FC3F7" />
      <path d="M96 152 L92 216 L108 212 L106 154 Z" fill="#FFD45C" />
      {/* corps */}
      <motion.g
        animate={humeur === 'content' && !reduite ? { y: [0, -10, 0] } : { y: 0 }}
        transition={{ duration: 0.45, repeat: humeur === 'content' && !reduite ? 2 : 0 }}
      >
        <ellipse cx="100" cy="128" rx="40" ry="50" fill="#FF7A6B" />
        <ellipse cx="104" cy="140" rx="24" ry="32" fill="#FFB3A8" />
        {/* aile */}
        <motion.path
          d="M66 110 Q52 150 78 176 Q96 150 90 112 Z"
          fill="#3E9E5A"
          style={{ transformOrigin: '80px 112px' }}
          animate={humeur === 'content' && !reduite ? { rotate: [0, -35, 0, -35, 0] } : { rotate: 0 }}
          transition={{ duration: 0.9 }}
        />
        <path d="M70 140 Q66 160 80 172" stroke="#4FC3F7" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* pattes */}
        <path d="M88 174 v8 M112 174 v8" stroke="#E0A458" strokeWidth="6" strokeLinecap="round" />
        {/* tête */}
        <motion.g style={{ transformOrigin: '100px 90px' }} animate={tete} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
          <circle cx="100" cy="66" r="34" fill="#FF7A6B" />
          <path d="M84 34 Q88 14 100 20 Q98 6 112 12 Q108 26 104 34 Z" fill="#FFD45C" />
          <circle cx="112" cy="60" r="14" fill="#fff" />
          <circle cx={humeur === 'ecoute' ? 108 : 115} cy="60" r="6.5" fill="#24304A" />
          <circle cx="117" cy="57" r="2" fill="#fff" />
          {/* bec */}
          <motion.path
            d="M126 64 Q150 66 140 90 Q134 78 124 76 Z"
            fill="#FFD45C"
            stroke="#E0A458"
            strokeWidth="2"
            style={{ transformOrigin: '126px 66px' }}
            animate={bec && !reduite ? { rotate: [0, -10, 0, -10, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, repeat: humeur === 'parle' && !reduite ? Infinity : 0 }}
          />
          <path d="M124 78 Q134 84 138 92 Q128 92 122 84 Z" fill="#E0A458" />
          <circle cx="92" cy="76" r="6" fill="#FF9E8F" opacity="0.7" />
        </motion.g>
      </motion.g>
      {humeur === 'perplexe' && (
        <text x="52" y="44" fontSize="40" fontWeight="800" fill="#8E7CFF" fontFamily="Baloo 2, sans-serif">
          ?
        </text>
      )}
      {humeur === 'ecoute' && (
        <g fill="none" stroke="#8E7CFF" strokeWidth="4" strokeLinecap="round" opacity="0.8">
          <path d="M160 50 q10 12 0 24" />
          <path d="M170 42 q18 20 0 40" />
        </g>
      )}
    </svg>
  );
}

const LIBELLES: Record<HumeurPerroquet, string> = {
  repos: 'attend que tu lises',
  ecoute: 't’écoute',
  parle: 'répète',
  perplexe: 'n’a pas bien compris',
  content: 'est content',
};
