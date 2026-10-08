/** Petites illustrations vectorielles originales du méta-jeu (tuiles du tableau de bord, coffre). */
import { motion } from 'framer-motion';

type P = { size?: number; className?: string };

export function Coffre({
  size = 96,
  ouvert = false,
  className,
}: P & {
  ouvert?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 110" width={size} height={size * (110 / 120)} className={className} aria-hidden>
      <ellipse cx="60" cy="104" rx="46" ry="5" fill="rgba(36,48,74,0.18)" />
      {/* lueur */}
      {ouvert && <ellipse cx="60" cy="52" rx="44" ry="26" fill="#FFF3B0" opacity="0.9" />}
      {/* caisse */}
      <rect x="14" y="52" width="92" height="50" rx="8" fill="#B5652B" />
      <rect x="14" y="52" width="92" height="12" fill="#9A4F1C" />
      <rect x="20" y="66" width="80" height="4" rx="2" fill="#C97A3C" />
      <rect x="20" y="82" width="80" height="4" rx="2" fill="#C97A3C" />
      <rect x="12" y="50" width="10" height="54" rx="3" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
      <rect x="98" y="50" width="10" height="54" rx="3" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
      {/* couvercle */}
      <motion.g
        initial={false}
        animate={ouvert ? { rotate: -38, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 11 }}
        style={{ originX: '14px', originY: '52px' }}
      >
        <path d="M14 52 L14 34 C14 14 106 14 106 34 L106 52 Z" fill="#C97A3C" />
        <path d="M14 40 C30 30 90 30 106 40" stroke="#9A4F1C" strokeWidth="3" fill="none" />
        <rect x="12" y="30" width="10" height="24" rx="3" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
        <rect x="98" y="30" width="10" height="24" rx="3" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
      </motion.g>
      {/* serrure */}
      {!ouvert && (
        <g>
          <rect x="50" y="46" width="20" height="22" rx="5" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
          <circle cx="60" cy="55" r="3.5" fill="#7A4A10" />
          <rect x="58.5" y="56" width="3" height="7" rx="1.5" fill="#7A4A10" />
        </g>
      )}
    </svg>
  );
}

export function MiniIle({ size = 80 }: P) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} aria-hidden>
      <ellipse cx="50" cy="64" rx="46" ry="12" fill="#4FC3F7" opacity="0.5" />
      <path d="M8 56 C10 36 90 36 92 56 C80 70 20 70 8 56 Z" fill="#E8C07D" />
      <path d="M12 52 C18 38 82 38 88 52 C70 58 30 58 12 52 Z" fill="#7BD389" />
      <rect x="24" y="30" width="16" height="16" rx="2" fill="#FFF8EC" />
      <path d="M21 32 L32 20 L43 32 Z" fill="#FF7A6B" />
      <rect x="50" y="22" width="10" height="24" rx="2" fill="#FFF8EC" />
      <path d="M48 24 L55 12 L62 24 Z" fill="#8E7CFF" />
      <rect x="70" y="30" width="3" height="16" fill="#8D5A3B" />
      <circle cx="71.5" cy="27" r="9" fill="#2E8C48" />
      <path d="M86 18 L92 14 L96 18 L92 22 Z" fill="#4FC3F7" />
    </svg>
  );
}

export function Medaille({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 80 90" width={size} height={size * (90 / 80)} aria-hidden>
      <path d="M22 4 L36 40 L28 44 L12 8 Z" fill="#FF7A6B" />
      <path d="M58 4 L44 40 L52 44 L68 8 Z" fill="#4FC3F7" />
      <circle cx="40" cy="58" r="26" fill="#FFD45C" stroke="#D69600" strokeWidth="4" />
      <circle cx="40" cy="58" r="17" fill="#FFE58A" />
      <path
        d="M40 46 L43.5 53.5 L51.5 54.3 L45.5 59.6 L47.3 67.5 L40 63.4 L32.7 67.5 L34.5 59.6 L28.5 54.3 L36.5 53.5 Z"
        fill="#D69600"
      />
    </svg>
  );
}

export function Echoppe({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 90 80" width={size} height={size * (80 / 90)} aria-hidden>
      <rect x="10" y="30" width="70" height="46" rx="6" fill="#FFF8EC" />
      <rect x="18" y="42" width="24" height="34" rx="3" fill="#8E7CFF" />
      <rect x="48" y="42" width="26" height="18" rx="3" fill="#BFE3FF" />
      <path d="M4 30 L12 10 L78 10 L86 30 Z" fill="#FF7A6B" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${4 + i * 16.4} 30 Q${12.2 + i * 16.4} 40 ${20.4 + i * 16.4} 30 Z`}
          fill={i % 2 ? '#FF7A6B' : '#FFF8EC'}
        />
      ))}
      <circle cx="61" cy="51" r="6" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
    </svg>
  );
}

export function Podium({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 90 80" width={size} height={size * (80 / 90)} aria-hidden>
      <rect x="32" y="30" width="26" height="46" rx="3" fill="#FFD45C" />
      <rect x="6" y="44" width="26" height="32" rx="3" fill="#CFD8DC" />
      <rect x="58" y="54" width="26" height="22" rx="3" fill="#E0A458" />
      <text x="45" y="58" textAnchor="middle" fontSize="18" fontWeight="800" fill="#B07800">
        1
      </text>
      <text x="19" y="66" textAnchor="middle" fontSize="15" fontWeight="800" fill="#607D8B">
        2
      </text>
      <text x="71" y="70" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8D5A3B">
        3
      </text>
      <path d="M38 8 L52 8 L50 20 C48 24 42 24 40 20 Z" fill="#FFD45C" stroke="#D69600" strokeWidth="2" />
      <rect x="42" y="22" width="6" height="6" fill="#D69600" />
    </svg>
  );
}

export function Livres({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 90 80" width={size} height={size * (80 / 90)} aria-hidden>
      <rect x="10" y="20" width="16" height="56" rx="3" fill="#F06252" />
      <rect x="28" y="12" width="14" height="64" rx="3" fill="#2980E6" />
      <rect x="44" y="24" width="18" height="52" rx="3" fill="#40A85C" />
      <rect x="60" y="18" width="14" height="58" rx="3" fill="#FFD45C" transform="rotate(12 67 47)" />
      <rect x="13" y="30" width="10" height="3" fill="#fff" opacity="0.7" />
      <rect x="31" y="22" width="8" height="3" fill="#fff" opacity="0.7" />
      <rect x="47" y="34" width="12" height="3" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export function Manette({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 90 70" width={size} height={size * (70 / 90)} aria-hidden>
      <path
        d="M20 16 C34 12 56 12 70 16 C84 20 90 50 82 58 C74 66 64 52 56 48 L34 48 C26 52 16 66 8 58 C0 50 6 20 20 16 Z"
        fill="#8E7CFF"
      />
      <rect x="20" y="27" width="16" height="5" rx="2" fill="#fff" />
      <rect x="25.5" y="21.5" width="5" height="16" rx="2" fill="#fff" />
      <circle cx="62" cy="25" r="4" fill="#FFD45C" />
      <circle cx="70" cy="32" r="4" fill="#FF7A6B" />
      <circle cx="54" cy="32" r="4" fill="#7BD389" />
      <circle cx="62" cy="39" r="4" fill="#4FC3F7" />
    </svg>
  );
}

export function Duel({ size = 72 }: P) {
  return (
    <svg viewBox="0 0 90 70" width={size} height={size * (70 / 90)} aria-hidden>
      <circle cx="24" cy="30" r="16" fill="#4FC3F7" />
      <circle cx="66" cy="30" r="16" fill="#FF7A6B" />
      <circle cx="19" cy="27" r="2.5" fill="#24304A" />
      <circle cx="29" cy="27" r="2.5" fill="#24304A" />
      <circle cx="61" cy="27" r="2.5" fill="#24304A" />
      <circle cx="71" cy="27" r="2.5" fill="#24304A" />
      <path d="M18 35 Q24 40 30 35" stroke="#24304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M60 35 Q66 40 72 35" stroke="#24304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path
        d="M45 14 L40 32 L47 32 L43 50 L54 26 L47 26 L51 14 Z"
        fill="#FFD45C"
        stroke="#D69600"
        strokeWidth="1.5"
      />
      <rect x="6" y="54" width="36" height="10" rx="5" fill="#24304A" opacity="0.15" />
      <rect x="48" y="54" width="36" height="10" rx="5" fill="#24304A" opacity="0.15" />
    </svg>
  );
}

export function Dragon({ size = 160, touche = false }: P & { touche?: boolean }) {
  return (
    <svg viewBox="0 0 160 140" width={size} height={size * (140 / 160)} aria-hidden>
      <ellipse cx="80" cy="132" rx="56" ry="6" fill="rgba(36,48,74,0.15)" />
      {/* ailes */}
      <path d="M44 60 C14 34 8 62 4 80 C20 70 30 76 40 82 Z" fill="#81C784" />
      <path d="M116 60 C146 34 152 62 156 80 C140 70 130 76 120 82 Z" fill="#81C784" />
      {/* queue */}
      <path d="M110 112 C136 116 146 100 150 90 L156 96 L146 98 C140 116 124 126 108 122 Z" fill="#4CAF50" />
      {/* corps */}
      <ellipse cx="80" cy="96" rx="40" ry="32" fill={touche ? '#FF8A80' : '#4CAF50'} />
      <ellipse cx="80" cy="104" rx="24" ry="20" fill="#C5E1A5" />
      {/* tête */}
      <circle cx="80" cy="50" r="30" fill={touche ? '#FF8A80' : '#4CAF50'} />
      <path
        d="M60 26 L56 6 L70 22 Z M100 26 L104 6 L90 22 Z"
        fill="#FFD45C"
        stroke="#D69600"
        strokeWidth="2"
      />
      <ellipse cx="80" cy="62" rx="18" ry="12" fill="#81C784" />
      <circle cx="74" cy="62" r="2.5" fill="#24304A" />
      <circle cx="86" cy="62" r="2.5" fill="#24304A" />
      {touche ? (
        <g stroke="#24304A" strokeWidth="3" strokeLinecap="round">
          <path d="M64 40 L72 48 M72 40 L64 48" />
          <path d="M88 40 L96 48 M96 40 L88 48" />
        </g>
      ) : (
        <g>
          <ellipse cx="68" cy="44" rx="7" ry="8" fill="#fff" />
          <ellipse cx="92" cy="44" rx="7" ry="8" fill="#fff" />
          <circle cx="69" cy="45" r="4" fill="#24304A" />
          <circle cx="91" cy="45" r="4" fill="#24304A" />
        </g>
      )}
      <path d="M70 70 Q80 76 90 70" stroke="#24304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* écailles du dos */}
      <path d="M58 76 L62 68 L66 76 M94 76 L98 68 L102 76" fill="#FFD45C" />
    </svg>
  );
}
