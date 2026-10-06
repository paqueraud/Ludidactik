/**
 * Décor du Conseil de la classe : des élèves assis en cercle autour d'une table, le bâton de parole,
 * et l'arbre de la classe qui se couvre de feuilles (il ne perd jamais de feuilles).
 */
import { motion } from 'framer-motion';

const PEAUX = ['#F5C9A4', '#8D5A3B', '#E8B48A', '#C68A5E'];
const CHEVEUX = ['#3B2A1E', '#1F1A17', '#C9772E', '#6B4226'];
const PULLS = ['#FF7A6B', '#4FC3F7', '#7BD389', '#8E7CFF'];

function Eleve({ x, i, parle, humeur }: { x: number; i: number; parle: boolean; humeur: 'calme' | 'content' | 'pense' }) {
  const peau = PEAUX[i % 4]!;
  return (
    <g transform={`translate(${x} 14)`}>
      {/* corps */}
      <path d="M-22 150 Q-22 112 0 112 Q22 112 22 150 Z" fill={PULLS[i % 4]} />
      {/* tête */}
      <circle cx="0" cy="92" r="20" fill={peau} />
      {i % 2 === 0 ? (
        <path d="M-20 90 Q-20 68 0 68 Q20 68 20 90 Q12 78 0 80 Q-12 78 -20 90 Z" fill={CHEVEUX[i % 4]} />
      ) : (
        <path d="M-21 96 Q-24 66 0 68 Q24 66 21 96 Q22 80 10 78 Q0 84 -10 78 Q-22 80 -21 96 Z" fill={CHEVEUX[i % 4]} />
      )}
      {/* yeux */}
      <circle cx="-7" cy="94" r="2.4" fill="#24304A" />
      <circle cx="7" cy="94" r="2.4" fill="#24304A" />
      {/* bouche */}
      {humeur === 'content' ? (
        <path d="M-7 102 Q0 109 7 102" stroke="#24304A" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : humeur === 'pense' ? (
        <path d="M-5 104 H5" stroke="#24304A" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M-5 103 Q0 106 5 103" stroke="#24304A" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* bâton de parole */}
      {parle && (
        <g>
          <rect x="16" y="104" width="6" height="40" rx="3" fill="#E0A458" transform="rotate(-20 19 124)" />
          <circle cx="26" cy="102" r="6" fill="#FFD45C" />
        </g>
      )}
    </g>
  );
}

export function ConseilScene({
  orateur,
  humeur,
  feuilles,
  maxFeuilles,
  reduce,
}: {
  orateur: number;
  humeur: 'calme' | 'content' | 'pense';
  feuilles: number;
  maxFeuilles: number;
  reduce: boolean;
}) {
  // Positions des feuilles de l'arbre (déterministes)
  const pos = Array.from({ length: maxFeuilles }, (_, k) => {
    const a = (k * 137.5 * Math.PI) / 180;
    const r = 10 + (k % 5) * 6;
    return [338 + Math.cos(a) * r, 52 + Math.sin(a) * r * 0.8] as const;
  });
  return (
    <svg viewBox="0 0 400 170" className="block h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="cc-mur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF0FF" />
          <stop offset="1" stopColor="#DCE6FF" />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill="url(#cc-mur)" />
      {/* tableau et guirlande */}
      <rect x="20" y="8" width="150" height="56" rx="6" fill="#2F5D50" stroke="#8D5A3B" strokeWidth="5" />
      <text x="95" y="32" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF" fontFamily="Andika, system-ui">
        Conseil de classe
      </text>
      <text x="95" y="51" textAnchor="middle" fontSize="11" fill="#CFE8DD" fontFamily="Andika, system-ui">
        On s’écoute, on se respecte
      </text>
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${190 + i * 14} 10 l7 12 l7 -12 Z`} fill={['#5C78DC', '#FFFFFF', '#FF7A6B'][i % 3]} />
      ))}
      {/* arbre de la classe */}
      <rect x="333" y="70" width="10" height="44" rx="4" fill="#8D5A3B" />
      <circle cx="338" cy="54" r="34" fill="#D6F0C2" />
      {pos.map(([x, y], k) =>
        k < feuilles ? (
          <motion.circle
            key={k}
            cx={x}
            cy={y}
            r="6"
            fill={['#7BD389', '#4CAF68', '#A6E3A1'][k % 3]}
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          />
        ) : null,
      )}
      {/* table */}
      <ellipse cx="200" cy="160" rx="170" ry="22" fill="#E0A458" />
      <ellipse cx="200" cy="156" rx="170" ry="18" fill="#F0BE7C" />
      {/* élèves */}
      {[70, 150, 250, 330].map((x, i) => (
        <Eleve key={i} x={x} i={i} parle={i === orateur} humeur={i === orateur ? 'calme' : humeur} />
      ))}
    </svg>
  );
}
