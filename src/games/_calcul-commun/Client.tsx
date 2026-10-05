/** Un client (ou une cliente) stylisé en SVG, pour les jeux de marchands (épicerie, pizzeria, pâtisserie). */
import { motion, useReducedMotion } from 'framer-motion';

const PEAUX = ['#F6D2B5', '#E0AC83', '#B9784F', '#8A5536', '#F1C9A5'];
const CHEVEUX = ['#2B1D14', '#6B3E1F', '#D9A441', '#A0522D', '#1F1F2E'];
const HAUTS = ['#4FC3F7', '#FF7A6B', '#8E7CFF', '#7BD389', '#FFD45C'];

/** `graine` choisit l'apparence (même client pour toute la manche). */
export function Client({ graine, humeur = 'neutre', taille = 120 }: { graine: number; humeur?: 'neutre' | 'content' | 'pense'; taille?: number }) {
  const reduce = useReducedMotion();
  const peau = PEAUX[graine % PEAUX.length]!;
  const cheveux = CHEVEUX[(graine * 3 + 1) % CHEVEUX.length]!;
  const haut = HAUTS[(graine * 7 + 2) % HAUTS.length]!;
  const longs = graine % 2 === 0;
  return (
    <motion.svg
      width={taille}
      height={taille}
      viewBox="0 0 120 120"
      aria-hidden
      animate={reduce ? undefined : humeur === 'content' ? { y: [0, -8, 0] } : { y: [0, -2, 0] }}
      transition={{ duration: humeur === 'content' ? 0.5 : 2.4, repeat: humeur === 'content' ? 1 : Infinity }}
    >
      {/* corps */}
      <path d="M22 120 Q24 84 60 82 Q96 84 98 120 Z" fill={haut} />
      <path d="M48 84 L60 98 L72 84" fill="#fff" opacity="0.6" />
      {/* cheveux longs derrière */}
      {longs && <path d="M30 52 Q28 92 44 96 L76 96 Q92 92 90 52 Z" fill={cheveux} />}
      {/* tête */}
      <circle cx="60" cy="50" r="28" fill={peau} />
      <path
        d={longs ? 'M32 48 Q34 18 60 18 Q88 18 88 48 Q76 34 58 32 Q42 34 32 48 Z' : 'M33 44 Q36 20 60 20 Q86 20 87 44 Q74 30 60 32 Q44 30 33 44 Z'}
        fill={cheveux}
      />
      {/* yeux */}
      <circle cx="50" cy="52" r="3.6" fill="#24304A" />
      <circle cx="70" cy="52" r="3.6" fill="#24304A" />
      <circle cx="51.2" cy="50.8" r="1.2" fill="#fff" />
      <circle cx="71.2" cy="50.8" r="1.2" fill="#fff" />
      {/* joues */}
      <circle cx="43" cy="61" r="4.5" fill="#FF7A6B" opacity="0.35" />
      <circle cx="77" cy="61" r="4.5" fill="#FF7A6B" opacity="0.35" />
      {/* bouche */}
      {humeur === 'content' ? (
        <path d="M50 62 Q60 74 70 62 Z" fill="#B9483A" />
      ) : humeur === 'pense' ? (
        <ellipse cx="60" cy="65" rx="4" ry="5" fill="#B9483A" />
      ) : (
        <path d="M52 64 Q60 70 68 64" stroke="#24304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </motion.svg>
  );
}
