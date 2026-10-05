/** Le chevalier de la Forge : chaque forme juste lui ajoute une pièce d'armure (dessin original). */
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const PIECES = ['casque', 'plastron', 'bouclier', 'épée', 'jambières', 'gantelets', 'bottes', 'cape'] as const;

function Piece({ visible, reduite, children }: { visible: boolean; reduite: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          initial={reduite ? { opacity: 0 } : { opacity: 0, y: -40, scale: 1.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: reduite ? 'tween' : 'spring', stiffness: 260, damping: 16, duration: reduite ? 0.2 : undefined }}
        >
          {children}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

export function Chevalier({ pieces, reduite, content }: { pieces: number; reduite: boolean; content: boolean }) {
  const a = (i: number) => pieces > i;
  return (
    <svg viewBox="0 0 200 240" className="h-full w-auto" role="img" aria-label={`Le chevalier porte ${Math.min(pieces, 8)} pièce${pieces > 1 ? 's' : ''} d’armure`}>
      {/* cape (derrière) */}
      <Piece visible={a(7)} reduite={reduite}>
        <path d="M66 92 Q100 80 134 92 L150 200 Q100 214 50 200 Z" fill="#8E7CFF" />
        <path d="M66 92 Q100 80 134 92 L138 110 Q100 100 62 110 Z" fill="#6E5BE0" />
      </Piece>
      {/* jambes */}
      <rect x="78" y="160" width="18" height="46" rx="8" fill="#5A6B8C" />
      <rect x="104" y="160" width="18" height="46" rx="8" fill="#5A6B8C" />
      <Piece visible={a(4)} reduite={reduite}>
        <rect x="75" y="164" width="24" height="30" rx="8" fill="#C9D3E3" stroke="#8A97AE" strokeWidth="2" />
        <rect x="101" y="164" width="24" height="30" rx="8" fill="#C9D3E3" stroke="#8A97AE" strokeWidth="2" />
        <circle cx="87" cy="176" r="3" fill="#8A97AE" />
        <circle cx="113" cy="176" r="3" fill="#8A97AE" />
      </Piece>
      {/* pieds */}
      <ellipse cx="86" cy="208" rx="13" ry="7" fill="#8A5A3B" />
      <ellipse cx="114" cy="208" rx="13" ry="7" fill="#8A5A3B" />
      <Piece visible={a(6)} reduite={reduite}>
        <path d="M70 198 h30 v14 h-34 q0 -8 4 -14 Z" fill="#9AA6BC" stroke="#6F7C93" strokeWidth="2" />
        <path d="M100 198 h30 q4 6 4 14 h-34 Z" fill="#9AA6BC" stroke="#6F7C93" strokeWidth="2" />
      </Piece>
      {/* corps (tunique) */}
      <path d="M70 98 Q100 88 130 98 L136 166 Q100 174 64 166 Z" fill="#FF7A6B" />
      <rect x="66" y="150" width="68" height="10" rx="5" fill="#8A5A3B" />
      <rect x="95" y="150" width="10" height="10" rx="2" fill="#FFD45C" />
      <Piece visible={a(1)} reduite={reduite}>
        <path d="M72 100 Q100 90 128 100 L130 148 Q100 156 70 148 Z" fill="#DDE4EF" stroke="#8A97AE" strokeWidth="2.5" />
        <path d="M100 96 V150" stroke="#B5C0D2" strokeWidth="3" />
        <path d="M80 112 Q100 104 120 112" stroke="#fff" strokeWidth="3" fill="none" opacity="0.8" />
      </Piece>
      {/* bras */}
      <rect x="48" y="102" width="18" height="50" rx="9" fill="#FF7A6B" transform="rotate(12 57 102)" />
      <rect x="134" y="102" width="18" height="50" rx="9" fill="#FF7A6B" transform="rotate(-12 143 102)" />
      {/* mains */}
      <circle cx="50" cy="152" r="9" fill="#F5C9A6" />
      <circle cx="150" cy="152" r="9" fill="#F5C9A6" />
      <Piece visible={a(5)} reduite={reduite}>
        <rect x="40" y="143" width="20" height="17" rx="6" fill="#B5C0D2" stroke="#6F7C93" strokeWidth="2" />
        <rect x="140" y="143" width="20" height="17" rx="6" fill="#B5C0D2" stroke="#6F7C93" strokeWidth="2" />
      </Piece>
      {/* épée */}
      <Piece visible={a(3)} reduite={reduite}>
        <rect x="146" y="72" width="8" height="76" rx="3" fill="#E9EEF6" stroke="#8A97AE" strokeWidth="1.5" />
        <path d="M146 72 L150 60 L154 72 Z" fill="#E9EEF6" stroke="#8A97AE" strokeWidth="1.5" />
        <rect x="136" y="146" width="28" height="7" rx="3" fill="#FFD45C" />
        <rect x="147" y="153" width="6" height="14" rx="2" fill="#8A5A3B" />
      </Piece>
      {/* bouclier */}
      <Piece visible={a(2)} reduite={reduite}>
        <path d="M22 112 H70 V140 Q70 166 46 176 Q22 166 22 140 Z" fill="#4FC3F7" stroke="#2C8FBF" strokeWidth="3" />
        <circle cx="46" cy="138" r="10" fill="#FFD45C" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="45" y="120" width="2" height="6" fill="#FFD45C" transform={`rotate(${i * 45} 46 138)`} />
        ))}
      </Piece>
      {/* tête */}
      <circle cx="100" cy="66" r="28" fill="#F5C9A6" />
      <motion.g animate={content && !reduite ? { y: [0, -3, 0] } : { y: 0 }} transition={{ duration: 0.5 }}>
        <circle cx="90" cy="66" r="3.5" fill="#24304A" />
        <circle cx="110" cy="66" r="3.5" fill="#24304A" />
        <path d={content ? 'M90 78 Q100 88 110 78' : 'M92 80 Q100 84 108 80'} stroke="#24304A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="82" cy="75" r="4" fill="#FF9E8F" opacity="0.6" />
        <circle cx="118" cy="75" r="4" fill="#FF9E8F" opacity="0.6" />
      </motion.g>
      <path d="M74 56 Q78 34 100 34 Q124 34 126 56 Q112 46 100 48 Q86 46 74 56 Z" fill="#8A5A3B" />
      <Piece visible={a(0)} reduite={reduite}>
        <path d="M70 66 Q70 30 100 30 Q130 30 130 66 L124 66 Q124 44 100 42 Q76 44 76 66 Z" fill="#C9D3E3" stroke="#8A97AE" strokeWidth="2.5" />
        <rect x="97" y="40" width="6" height="30" rx="3" fill="#B5C0D2" />
        <path d="M100 30 Q112 8 128 14 Q114 18 104 32 Z" fill="#FF7A6B" />
      </Piece>
    </svg>
  );
}
