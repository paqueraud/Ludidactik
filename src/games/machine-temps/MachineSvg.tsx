/**
 * Décor de la Machine à remonter le temps : un ruban d'époques (du passé sépia au présent coloré),
 * des repères d'étapes et la machine — une capsule à hublot avec cadran d'horloge et engrenages.
 */
import { motion } from 'framer-motion';

export function MachineSvg({
  position,
  etapes,
  voyage,
  panne,
  reduce,
}: {
  /** Avancée de 0 (passé) à 1 (présent). */
  position: number;
  etapes: number;
  /** Animation de voyage (ordre juste). */
  voyage: boolean;
  /** Petite secousse (ordre à corriger) — jamais punitive. */
  panne: boolean;
  reduce: boolean;
}) {
  const x0 = 46;
  const x1 = 354;
  const x = x0 + (x1 - x0) * Math.max(0, Math.min(1, position));
  return (
    <svg viewBox="0 0 400 130" className="block h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="mt-epoques" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E7CFA6" />
          <stop offset="0.5" stopColor="#F6E3B4" />
          <stop offset="1" stopColor="#BFE6F7" />
        </linearGradient>
        <radialGradient id="mt-hublot" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9FD8F5" />
        </radialGradient>
      </defs>
      <rect width="400" height="130" fill="url(#mt-epoques)" />
      {/* silhouettes d'époques : château, moulin, usine, immeubles */}
      <g fill="#24304A" opacity="0.13">
        <path d="M18 92 V62 h8 v-8 h6 v8 h8 v-8 h6 v8 h8 v30 Z" />
        <path d="M120 92 V66 l10 -8 l10 8 V92 Z M130 58 l-14 -12 M130 58 l14 -12 M130 58 l-12 14 M130 58 l12 14" stroke="#24304A" strokeWidth="3" />
        <path d="M205 92 V70 l14 -8 v8 l14 -8 v8 l14 -8 V92 Z M240 62 V40 h7 v22" />
        <path d="M300 92 V52 h18 V92 Z M322 92 V40 h20 V92 Z M346 92 V60 h16 V92 Z" />
      </g>
      {/* rails */}
      <line x1="20" y1="104" x2="380" y2="104" stroke="#8D5A3B" strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: 19 }, (_, i) => (
        <line key={i} x1={24 + i * 20} y1="100" x2={24 + i * 20} y2="110" stroke="#B07A50" strokeWidth="3" />
      ))}
      {/* repères des étapes */}
      {Array.from({ length: etapes + 1 }, (_, i) => {
        const xi = x0 + ((x1 - x0) * i) / Math.max(1, etapes);
        const passe = xi <= x + 0.5;
        return (
          <circle
            key={`r${i}`}
            cx={xi}
            cy="120"
            r="5"
            fill={passe ? '#FFD45C' : '#FFFFFF'}
            stroke="#8D5A3B"
            strokeWidth="2"
          />
        );
      })}
      <text x="20" y="24" fontSize="13" fontWeight="700" fill="#7A5A2E" fontFamily="Andika, system-ui">
        Passé
      </text>
      <text x="380" y="24" fontSize="13" fontWeight="700" fill="#1F6FA8" textAnchor="end" fontFamily="Andika, system-ui">
        Présent
      </text>

      {/* la machine */}
      <motion.g
        initial={false}
        animate={{ x, y: voyage && !reduce ? [0, -14, 0] : 0, rotate: panne && !reduce ? [0, -4, 4, -2, 0] : 0 }}
        transition={{
          x: { duration: reduce ? 0 : 1.6, ease: 'easeInOut' },
          y: { duration: 0.8, repeat: voyage && !reduce ? 1 : 0 },
          rotate: { duration: 0.5 },
        }}
      >
        {/* traînée d'étincelles pendant le voyage */}
        {voyage && !reduce && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx={-34 - i * 12}
                cy={80 - (i % 2) * 10}
                r={4 - i * 0.6}
                fill="#FFD45C"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: i * 0.12, repeat: 2 }}
              />
            ))}
            <motion.ellipse
              cx="0"
              cy="76"
              rx="40"
              ry="30"
              fill="none"
              stroke="#8E7CFF"
              strokeWidth="3"
              strokeDasharray="6 8"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.3, 1.6] }}
              transition={{ duration: 0.9, repeat: 1 }}
            />
          </g>
        )}
        {/* roues */}
        <circle cx="-16" cy="98" r="7" fill="#24304A" />
        <circle cx="16" cy="98" r="7" fill="#24304A" />
        <circle cx="-16" cy="98" r="2.5" fill="#FFD45C" />
        <circle cx="16" cy="98" r="2.5" fill="#FFD45C" />
        {/* corps */}
        <path d="M-30 92 Q-34 58 -6 50 L10 50 Q34 56 30 92 Z" fill="#8E7CFF" stroke="#5E48C8" strokeWidth="2.5" />
        <path d="M-24 90 Q-26 70 -10 62" stroke="#B9AEFF" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* hublot */}
        <circle cx="4" cy="70" r="11" fill="url(#mt-hublot)" stroke="#FFD45C" strokeWidth="3" />
        <circle cx="1" cy="67" r="3" fill="#FFFFFF" opacity="0.9" />
        {/* cadran d'horloge */}
        <circle cx="-17" cy="76" r="7" fill="#FFF8EC" stroke="#5E48C8" strokeWidth="1.5" />
        <motion.g
          animate={voyage && !reduce ? { rotate: -720 } : { rotate: 0 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        >
          {/* cercle invisible : le centre de rotation est celui du cadran */}
          <circle cx="-17" cy="76" r="6" fill="none" />
          <line x1="-17" y1="76" x2="-17" y2="71" stroke="#24304A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-17" y1="76" x2="-13.5" y2="77" stroke="#24304A" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
        {/* engrenage */}
        <motion.g
          animate={!reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: voyage ? 0.8 : 6, repeat: reduce ? 0 : Infinity, ease: 'linear' }}
        >
          <circle cx="22" cy="62" r="6" fill="#FFD45C" stroke="#D69600" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x="20.5"
              y="53"
              width="3"
              height="4"
              fill="#D69600"
              transform={`rotate(${a} 22 62)`}
            />
          ))}
        </motion.g>
        {/* antenne */}
        <line x1="2" y1="50" x2="2" y2="36" stroke="#5E48C8" strokeWidth="2.5" />
        <motion.circle
          cx="2"
          cy="34"
          r="4"
          fill="#FF7A6B"
          animate={!reduce ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
          transition={{ duration: voyage ? 0.3 : 1.4, repeat: reduce ? 0 : Infinity }}
        />
      </motion.g>
    </svg>
  );
}
