/** Le gâteau du pâtissier : un étage et des décorations de plus à chaque recette réussie. */
import { motion, useReducedMotion } from 'framer-motion';

const ETAGES = ['#F8BBD0', '#FFE082', '#C5E1A5', '#B3E5FC'];

export function Gateau({
  reussites,
  total,
  taille = 180,
}: {
  reussites: number;
  total: number;
  taille?: number;
}) {
  const reduce = useReducedMotion();
  const etages = Math.min(3, 1 + Math.floor((reussites * 3) / Math.max(1, total)));
  const fraises = Math.min(8, reussites);
  const bougies = reussites >= total ? 3 : reussites >= Math.ceil(total / 2) ? 1 : 0;
  return (
    <svg
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      role="img"
      aria-label={`Gâteau : ${reussites} décoration${reussites > 1 ? 's' : ''}`}
    >
      <ellipse cx="100" cy="186" rx="86" ry="10" fill="#E0E0E0" />
      <rect x="10" y="176" width="180" height="10" rx="5" fill="#FFFFFF" stroke="#CFD8DC" />
      {Array.from({ length: etages }, (_, i) => {
        const w = 150 - i * 36;
        const y = 136 - i * 40;
        return (
          <motion.g
            key={i}
            initial={reduce ? false : { y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
          >
            <rect x={100 - w / 2} y={y} width={w} height="40" rx="10" fill={ETAGES[i % ETAGES.length]} />
            <path
              d={`M${100 - w / 2} ${y + 8} q ${w / 8} 12 ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0`}
              fill="none"
              stroke="#fff"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </motion.g>
        );
      })}
      {Array.from({ length: fraises }, (_, i) => {
        const haut = 136 - (etages - 1) * 40;
        const w = 150 - (etages - 1) * 36;
        const x = 100 - w / 2 + 10 + ((w - 20) * i) / Math.max(1, fraises - 1 || 1);
        return (
          <motion.g key={`f${i}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
            <path d={`M${x} ${haut - 2} q -7 -10 0 -14 q 7 4 0 14 Z`} fill="#E53935" />
            <path d={`M${x - 4} ${haut - 15} l4 3 l4 -3`} stroke="#43A047" strokeWidth="2.5" fill="none" />
          </motion.g>
        );
      })}
      {Array.from({ length: bougies }, (_, i) => {
        const haut = 136 - (etages - 1) * 40;
        const x = 100 + (i - (bougies - 1) / 2) * 18;
        return (
          <g key={`b${i}`}>
            <rect
              x={x - 3}
              y={haut - 34}
              width="6"
              height="22"
              rx="2"
              fill={['#8E7CFF', '#4FC3F7', '#FF7A6B'][i % 3]}
            />
            <motion.path
              d={`M${x} ${haut - 46} q 5 6 0 10 q -5 -4 0 -10 Z`}
              fill="#FFB300"
              animate={reduce ? undefined : { scaleY: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </g>
        );
      })}
    </svg>
  );
}
