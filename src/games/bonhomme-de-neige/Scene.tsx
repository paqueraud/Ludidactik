/**
 * Scène du bonhomme de neige (SVG original). `fonte` ∈ [0, 1] : 0 = bonhomme tout neuf,
 * 1 = flaque d'eau avec le chapeau et l'écharpe (jamais de « mort » : il reviendra avec la neige).
 * `sauve` : le soleil se couche, le ciel rosit, le bonhomme sourit.
 */
import { motion, useReducedMotion } from 'framer-motion';

export function SceneBonhomme({
  fonte,
  sauve,
  paused = false,
}: {
  fonte: number;
  sauve: boolean;
  paused?: boolean;
}) {
  const reduce = useReducedMotion() || paused;
  const f = Math.max(0, Math.min(1, fonte));
  const fondu = f >= 1;
  const tr = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 70, damping: 14 };

  // Ciel : bleu d'hiver → plus chaud quand le soleil tape → coucher rose si sauvé
  const ciel = sauve ? ['#FF9F7A', '#FFD3A8'] : f > 0.5 ? ['#7FC8F8', '#FFF1C9'] : ['#8FD3FF', '#E6F7FF'];
  const soleil = sauve ? { cy: 262, r: 34 } : { cy: 62 - f * 8, r: 26 + f * 18 };
  const ecrase = 1 - f * 0.72;

  return (
    <svg viewBox="0 0 400 300" className="block w-full" aria-hidden>
      <defs>
        <linearGradient id="bdn-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ciel[0]} style={{ transition: 'stop-color 1s' }} />
          <stop offset="1" stopColor={ciel[1]} style={{ transition: 'stop-color 1s' }} />
        </linearGradient>
        <radialGradient id="bdn-neige" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D8E8F5" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bdn-ciel)" />

      {/* Soleil (grossit à chaque erreur, se couche si le mot est trouvé) */}
      <motion.g
        animate={{ y: soleil.cy - 62 }}
        transition={{ duration: reduce ? 0 : 1.6, ease: 'easeInOut' }}
      >
        <motion.circle
          cx="330"
          cy="62"
          animate={{ r: soleil.r + 14 }}
          fill="#FFD45C"
          opacity="0.35"
          transition={tr}
        />
        <motion.circle cx="330" cy="62" animate={{ r: soleil.r }} fill="#FFC531" transition={tr} />
      </motion.g>
      {sauve && (
        <g fill="#fff">
          {[
            [40, 40],
            [90, 70],
            [150, 30],
            [210, 60],
            [260, 25],
          ].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6] }}
              transition={{ delay: 0.8 + i * 0.2, duration: 1.2 }}
            />
          ))}
        </g>
      )}

      {/* Collines enneigées */}
      <path d="M0 230 Q100 190 200 222 T400 214 L400 300 L0 300 Z" fill="#EAF4FB" />
      <path d="M0 252 Q120 228 230 250 T400 246 L400 300 L0 300 Z" fill="#FFFFFF" />
      {/* Sapins */}
      {[
        [40, 232],
        [362, 226],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-4" y="0" width="8" height="12" fill="#8A5A3B" />
          <path d="M-22 4 L0 -40 L22 4 Z" fill="#3CA36B" />
          <path d="M-16 -16 L0 -52 L16 -16 Z" fill="#4CB97C" />
          <path d="M-8 -36 L0 -58 L8 -36 Z" fill="#fff" opacity="0.8" />
        </g>
      ))}

      {/* Flaque qui grandit */}
      <motion.ellipse
        cx="200"
        cy="268"
        animate={{ rx: 36 + f * 70, ry: 6 + f * 9 }}
        fill="#9ED8F5"
        opacity="0.85"
        transition={tr}
      />

      {/* Le bonhomme : il s'affaisse depuis le sol */}
      <motion.g
        style={{ originX: '200px', originY: '268px' }}
        animate={{ scaleY: fondu ? 0.02 : ecrase, scaleX: 1 + f * 0.25, opacity: fondu ? 0 : 1 }}
        transition={tr}
      >
        <circle cx="200" cy="232" r="40" fill="url(#bdn-neige)" />
        <circle cx="200" cy="172" r="30" fill="url(#bdn-neige)" />
        <circle cx="200" cy="124" r="24" fill="url(#bdn-neige)" />
        {/* boutons */}
        <circle cx="200" cy="162" r="3.5" fill="#3A4766" />
        <circle cx="200" cy="178" r="3.5" fill="#3A4766" />
        <circle cx="200" cy="222" r="3.5" fill="#3A4766" />
        {/* bras (tombent en fondant) */}
        <motion.path
          d="M172 168 L138 150 M150 157 L140 140"
          stroke="#8A5A3B"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: f * -35 }}
          style={{ originX: '172px', originY: '168px' }}
          transition={tr}
        />
        <motion.path
          d="M228 168 L262 148 M250 155 L262 138"
          stroke="#8A5A3B"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: sauve ? -18 : f * 35 }}
          style={{ originX: '228px', originY: '168px' }}
          transition={tr}
        />
        {/* visage */}
        <circle cx="191" cy="118" r="3.2" fill="#24304A" />
        <circle cx="209" cy="118" r="3.2" fill="#24304A" />
        <path d="M200 125 L222 130 L200 131 Z" fill="#FF8A3D" />
        {f > 0.5 && !sauve ? (
          <ellipse cx="200" cy="138" rx="4" ry="3" fill="#24304A" />
        ) : (
          <path
            d="M190 136 Q200 144 210 136"
            stroke="#24304A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* joues */}
        <circle cx="186" cy="130" r="4" fill="#FFB3B3" opacity="0.7" />
        <circle cx="214" cy="130" r="4" fill="#FFB3B3" opacity="0.7" />
        {/* écharpe */}
        <path d="M176 146 Q200 156 224 146 L224 152 Q200 162 176 152 Z" fill="#FF7A6B" />
        <path d="M214 152 L222 176 L212 178 L206 154 Z" fill="#FF7A6B" />
        {/* chapeau */}
        <rect x="180" y="98" width="40" height="6" rx="3" fill="#3A4766" />
        <rect x="186" y="72" width="28" height="28" rx="4" fill="#3A4766" />
        <rect x="186" y="92" width="28" height="5" fill="#8E7CFF" />
        {/* gouttes */}
        {f > 0 &&
          !fondu &&
          [180, 222, 196]
            .slice(0, Math.ceil(f * 3))
            .map((x, i) => (
              <motion.path
                key={i}
                d={`M${x} ${200 + i * 18} q3 6 0 9 q-3 -3 0 -9 Z`}
                fill="#7CC7F0"
                animate={reduce ? undefined : { y: [0, 22], opacity: [1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
      </motion.g>

      {/* Quand il a tout fondu : chapeau, carotte et écharpe flottent dans la flaque */}
      {fondu && (
        <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <path d="M150 262 Q175 270 200 262 L200 268 Q175 276 150 268 Z" fill="#FF7A6B" />
          <path d="M215 262 L238 266 L215 268 Z" fill="#FF8A3D" />
          <g transform="rotate(-12 250 258)">
            <rect x="236" y="262" width="34" height="5" rx="2.5" fill="#3A4766" />
            <rect x="241" y="242" width="24" height="21" rx="3" fill="#3A4766" />
          </g>
        </motion.g>
      )}
    </svg>
  );
}
