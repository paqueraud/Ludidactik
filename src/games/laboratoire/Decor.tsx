/** Décor du Laboratoire : bocal en verre (une catégorie) et petit circuit électrique pile-ampoule. */
import { motion } from 'framer-motion';

const COULEURS_BOCAL = ['#7BD389', '#4FC3F7', '#FFD45C', '#FF7A6B', '#8E7CFF', '#E0A458'];

/** Bocal en verre : couvercle coloré, liquide qui monte avec le nombre d'éléments rangés. */
export function BocalSvg({
  index,
  remplissage,
  brille,
}: {
  index: number;
  remplissage: number;
  brille: boolean;
}) {
  const c = COULEURS_BOCAL[index % COULEURS_BOCAL.length]!;
  const h = 18 + Math.min(1, remplissage) * 52;
  return (
    <svg viewBox="0 0 100 110" className="block h-auto w-full" aria-hidden>
      {brille && <ellipse cx="50" cy="62" rx="48" ry="50" fill="#FFD45C" opacity="0.45" />}
      {/* couvercle */}
      <rect x="22" y="6" width="56" height="12" rx="4" fill={c} stroke="#24304A" strokeWidth="2.5" />
      {/* verre */}
      <path
        d="M26 18 H74 Q80 18 80 26 V96 Q80 106 70 106 H30 Q20 106 20 96 V26 Q20 18 26 18 Z"
        fill="#EAF7FF"
        stroke="#24304A"
        strokeWidth="2.5"
      />
      {/* liquide */}
      <motion.path
        initial={false}
        animate={{ d: `M22 ${104 - h} Q50 ${98 - h} 78 ${104 - h} V96 Q78 104 70 104 H30 Q22 104 22 96 Z` }}
        transition={{ duration: 0.5 }}
        fill={c}
        opacity="0.45"
      />
      {/* reflet */}
      <path d="M30 30 V80" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/**
 * Circuit pile + ampoule ; l'objet testé ferme le circuit. `allume` = l'ampoule brille
 * (montré seulement APRÈS la réponse de l'enfant, comme résultat de l'expérience).
 */
export function CircuitSvg({
  objet,
  allume,
  reduce,
}: {
  objet: string | null;
  allume: boolean | null;
  reduce: boolean;
}) {
  const fil = allume ? '#D69600' : '#24304A';
  return (
    <svg
      viewBox="0 0 220 150"
      className="block h-auto w-full"
      role="img"
      aria-label={
        allume === null
          ? 'Circuit : pile, fils et ampoule'
          : allume
            ? 'L’ampoule s’allume'
            : 'L’ampoule reste éteinte'
      }
    >
      {/* fils */}
      <path d="M40 110 V40 H100" fill="none" stroke={fil} strokeWidth="4" strokeLinejoin="round" />
      <path d="M140 40 H180 V110 H150" fill="none" stroke={fil} strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 110 H40" fill="none" stroke={fil} strokeWidth="4" />
      {/* pile */}
      <rect x="70" y="96" width="62" height="28" rx="6" fill="#FFD45C" stroke="#24304A" strokeWidth="2.5" />
      <rect x="132" y="104" width="8" height="12" rx="2" fill="#24304A" />
      <text x="101" y="115" textAnchor="middle" fontSize="12" fontWeight="800" fill="#24304A">
        PILE
      </text>
      <path d="M140 110 H150" stroke={fil} strokeWidth="4" />
      {/* ampoule */}
      {allume && !reduce && (
        <motion.circle
          cx="120"
          cy="34"
          r="30"
          fill="#FFE97A"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.8, 0.5] }}
          transition={{ duration: 0.8 }}
        />
      )}
      {allume && reduce && <circle cx="120" cy="34" r="30" fill="#FFE97A" opacity="0.5" />}
      <circle
        cx="120"
        cy="30"
        r="16"
        fill={allume ? '#FFE14D' : '#F2F5FA'}
        stroke="#24304A"
        strokeWidth="2.5"
      />
      <path d="M113 30 Q120 20 127 30" fill="none" stroke={allume ? '#D96B00' : '#9AA6B8'} strokeWidth="2" />
      <rect x="112" y="44" width="16" height="10" rx="2" fill="#9AA6B8" stroke="#24304A" strokeWidth="2" />
      <path d="M100 40 H112 M128 40 H140" stroke={fil} strokeWidth="4" />
      {/* l'objet testé, entre les deux pinces */}
      <rect
        x="20"
        y="58"
        width="40"
        height="34"
        rx="8"
        fill="#FFFFFF"
        stroke="#24304A"
        strokeWidth="2"
        strokeDasharray={objet ? undefined : '4 4'}
      />
      <text
        x="40"
        y="80"
        textAnchor="middle"
        fontSize={objet && [...objet].length <= 2 ? 20 : 9}
        fontWeight="700"
        fill="#24304A"
      >
        {objet ?? '?'}
      </text>
    </svg>
  );
}
