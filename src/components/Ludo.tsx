import { motion, useReducedMotion } from 'framer-motion';

type Pose = 'salut' | 'joie' | 'pense' | 'calme';

/** Ludo, le hibou-explorateur avec son sac à dos : mascotte originale de Ludidactik. */
export function Ludo({
  size = 160,
  pose = 'calme',
  className,
}: {
  size?: number;
  pose?: Pose;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const wing =
    pose === 'salut'
      ? { rotate: [0, -35, 0, -35, 0], transition: { duration: 1.6, repeat: Infinity, repeatDelay: 1.5 } }
      : pose === 'joie'
        ? { rotate: [0, -50, 0], transition: { duration: 0.5, repeat: Infinity } }
        : {};
  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={className}
      role="img"
      aria-label="Ludo le hibou"
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* ombre */}
      <ellipse cx="100" cy="212" rx="52" ry="7" fill="rgba(36,48,74,0.15)" />
      {/* sac à dos */}
      <rect x="30" y="102" width="40" height="62" rx="14" fill="#E0A458" />
      <rect x="36" y="118" width="28" height="18" rx="6" fill="#C8873A" />
      {/* corps */}
      <path d="M44 120 C44 70 156 70 156 120 L156 160 C156 200 44 200 44 160 Z" fill="#8E7CFF" />
      <path d="M66 128 C66 104 134 104 134 128 L134 160 C134 186 66 186 66 160 Z" fill="#E9E4FF" />
      {/* plumes du ventre */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <path
            key={`${r}-${c}`}
            d={`M${80 + c * 14 + (r % 2) * 7} ${134 + r * 14} q6 7 12 0`}
            stroke="#B9AEFF"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )),
      )}
      {/* bretelles */}
      <path
        d="M58 100 C64 120 66 140 66 150"
        stroke="#C8873A"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M142 100 C136 120 134 140 134 150"
        stroke="#C8873A"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      {/* ailes */}
      <motion.path
        d="M150 118 C176 120 182 150 168 170 C160 160 154 140 150 118 Z"
        fill="#7563E6"
        style={{ originX: '150px', originY: '120px' }}
        animate={reduce ? undefined : wing}
      />
      <path d="M50 118 C24 120 18 150 32 170 C40 160 46 140 50 118 Z" fill="#7563E6" />
      {/* tête */}
      <path d="M40 70 C40 22 160 22 160 70 C160 104 40 104 40 70 Z" fill="#8E7CFF" />
      <path d="M46 34 L40 6 L70 26 Z" fill="#8E7CFF" />
      <path d="M154 34 L160 6 L130 26 Z" fill="#8E7CFF" />
      {/* yeux */}
      <circle cx="74" cy="64" r="24" fill="#fff" />
      <circle cx="126" cy="64" r="24" fill="#fff" />
      {pose === 'joie' ? (
        <>
          <path d="M60 66 Q74 50 88 66" stroke="#24304A" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path
            d="M112 66 Q126 50 140 66"
            stroke="#24304A"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx={pose === 'pense' ? 80 : 76} cy={pose === 'pense' ? 58 : 66} r="11" fill="#24304A" />
          <circle cx={pose === 'pense' ? 132 : 128} cy={pose === 'pense' ? 58 : 66} r="11" fill="#24304A" />
          <circle cx={pose === 'pense' ? 84 : 80} cy={pose === 'pense' ? 54 : 62} r="4" fill="#fff" />
          <circle cx={pose === 'pense' ? 136 : 132} cy={pose === 'pense' ? 54 : 62} r="4" fill="#fff" />
        </>
      )}
      {/* lunettes d'aviateur sur le front */}
      <path d="M58 30 Q100 18 142 30" stroke="#E0A458" strokeWidth="6" fill="none" />
      <circle cx="84" cy="30" r="9" fill="#9BE3FF" stroke="#E0A458" strokeWidth="4" />
      <circle cx="116" cy="30" r="9" fill="#9BE3FF" stroke="#E0A458" strokeWidth="4" />
      {/* bec */}
      <path d="M92 80 L108 80 L100 96 Z" fill="#FFB547" />
      {/* pattes */}
      <path
        d="M78 196 l-6 10 M84 198 l0 10 M90 196 l6 10"
        stroke="#FFB547"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M110 196 l-6 10 M116 198 l0 10 M122 196 l6 10"
        stroke="#FFB547"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
