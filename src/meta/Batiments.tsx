/**
 * Bâtiments de « Mon île » (SVG originaux, vue de face douce). Chaque bâtiment se dessine dans une
 * boîte de 40 × 40 dont le bas-centre est (x, y). Niveau 0 : terrain libre ; 1 : construit ;
 * 2 : agrandi (un étage de plus) ; 3 : drapeau doré. `chantier` : échafaudage.
 */
import { useReducedMotion } from 'framer-motion';
import type { TypeBatiment } from './ile';

const MUR = '#FFF8EC';
const TRAIT = '#24304A';

function Corps({ type, toit, anime }: { type: TypeBatiment; toit: string; anime: boolean }) {
  switch (type) {
    case 'moulin':
      return (
        <g>
          <path d="M-9 0 L-7 -24 L7 -24 L9 0 Z" fill={MUR} />
          <path d="M-9 -24 L0 -32 L9 -24 Z" fill={toit} />
          <rect x="-3" y="-8" width="6" height="8" rx="2" fill={TRAIT} opacity="0.7" />
          <g>
            {anime && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 -26"
                to="360 0 -26"
                dur="9s"
                repeatCount="indefinite"
              />
            )}
            {[0, 90, 180, 270].map((a) => (
              <rect
                key={a}
                x="-2"
                y="-44"
                width="4"
                height="18"
                rx="1"
                fill="#C8873A"
                transform={`rotate(${a} 0 -26)`}
              />
            ))}
          </g>
          <circle cx="0" cy="-26" r="2.5" fill={TRAIT} />
        </g>
      );
    case 'tour':
      return (
        <g>
          <rect x="-7" y="-32" width="14" height="32" rx="2" fill={MUR} />
          <path d="M-9 -32 L0 -44 L9 -32 Z" fill={toit} />
          <circle cx="0" cy="-23" r="4" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
          <path d="M0 -23 L0 -26 M0 -23 L2 -22" stroke={TRAIT} strokeWidth="1.2" />
          <rect x="-2.5" y="-8" width="5" height="8" rx="2" fill={TRAIT} opacity="0.7" />
        </g>
      );
    case 'dome':
      return (
        <g>
          <rect x="-14" y="-14" width="28" height="14" rx="2" fill={MUR} />
          <path d="M-12 -14 A12 12 0 0 1 12 -14 Z" fill={toit} />
          <rect x="1" y="-29" width="4" height="10" rx="1" fill={TRAIT} transform="rotate(30 3 -24)" />
          <rect x="-3" y="-8" width="6" height="8" rx="2" fill={TRAIT} opacity="0.7" />
        </g>
      );
    case 'phare':
      return (
        <g>
          <path d="M-6 0 L-4 -30 L4 -30 L6 0 Z" fill="#fff" />
          <rect x="-5" y="-22" width="10" height="4" fill="#FF7A6B" />
          <rect x="-5" y="-12" width="10" height="4" fill="#FF7A6B" />
          <rect x="-5" y="-36" width="10" height="6" rx="1" fill="#FFD45C" />
          <path d="M-6 -36 L0 -42 L6 -36 Z" fill={toit} />
        </g>
      );
    case 'chateau':
      return (
        <g>
          <rect x="-15" y="-18" width="30" height="18" fill="#E0D2BE" />
          <rect x="-17" y="-28" width="9" height="28" fill="#D2C2A8" />
          <rect x="8" y="-28" width="9" height="28" fill="#D2C2A8" />
          <path d="M-18 -28 L-12.5 -36 L-7 -28 Z M7 -28 L12.5 -36 L18 -28 Z" fill={toit} />
          <path d="M-15 -18 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h1" fill="#E0D2BE" />
          <path d="M-4 0 L-4 -8 A4 4 0 0 1 4 -8 L4 0 Z" fill={TRAIT} opacity="0.7" />
        </g>
      );
    case 'cabane':
      return (
        <g>
          <rect x="-2" y="-14" width="4" height="14" fill="#8D5A3B" />
          <circle cx="0" cy="-30" r="14" fill="#4CAF50" />
          <rect x="-8" y="-24" width="16" height="11" rx="1" fill="#C8873A" />
          <path d="M-10 -24 L0 -31 L10 -24 Z" fill={toit} />
          <rect x="-2" y="-21" width="4" height="5" fill={TRAIT} opacity="0.6" />
        </g>
      );
    case 'temple':
      return (
        <g>
          <path d="M-16 -22 L0 -32 L16 -22 Z" fill={toit} />
          <rect x="-15" y="-22" width="30" height="3" fill={MUR} />
          {[-11, -4, 3, 10].map((x) => (
            <rect key={x} x={x} y="-19" width="3" height="16" fill={MUR} />
          ))}
          <rect x="-16" y="-3" width="32" height="3" fill="#E8DCC8" />
        </g>
      );
    case 'serre':
      return (
        <g>
          <path
            d="M-15 0 L-15 -12 A15 12 0 0 1 15 -12 L15 0 Z"
            fill="#BFF0E6"
            stroke="#1AB1AA"
            strokeWidth="1.5"
          />
          <path d="M-7 0 L-7 -21 M0 0 L0 -24 M7 0 L7 -21 M-15 -12 L15 -12" stroke="#1AB1AA" strokeWidth="1" />
          <circle cx="-10" cy="-4" r="3" fill="#4CAF50" />
          <circle cx="4" cy="-5" r="3.5" fill="#66BB6A" />
          <circle cx="11" cy="-3" r="2" fill="#FF7A6B" />
        </g>
      );
    case 'bateau':
      return (
        <g>
          <path d="M-16 -8 L16 -8 L11 0 L-11 0 Z" fill="#8D5A3B" />
          <rect x="-1" y="-34" width="2" height="26" fill={TRAIT} />
          <path d="M1 -32 L14 -12 L1 -12 Z" fill="#fff" />
          <path d="M-1 -28 L-11 -12 L-1 -12 Z" fill={toit} />
        </g>
      );
    case 'kiosque':
      return (
        <g>
          <path d="M-15 -20 Q0 -34 15 -20 Z" fill={toit} />
          <rect x="-13" y="-20" width="2.5" height="18" fill={MUR} />
          <rect x="10.5" y="-20" width="2.5" height="18" fill={MUR} />
          <rect x="-1.2" y="-20" width="2.5" height="18" fill={MUR} />
          <ellipse cx="0" cy="-1.5" rx="16" ry="3" fill="#E8DCC8" />
        </g>
      );
    case 'bibliotheque':
      return (
        <g>
          <rect x="-15" y="-22" width="30" height="22" rx="2" fill={MUR} />
          <path d="M-17 -22 L0 -30 L17 -22 Z" fill={toit} />
          {[-11, -5, 1, 7].map((x, i) => (
            <rect
              key={x}
              x={x}
              y="-17"
              width="4"
              height="9"
              fill={['#F06252', '#2980E6', '#40A85C', '#FFD45C'][i]}
            />
          ))}
          <rect x="-3" y="-7" width="6" height="7" rx="1.5" fill={TRAIT} opacity="0.7" />
        </g>
      );
    case 'maison':
    default:
      return (
        <g>
          <rect x="-12" y="-18" width="24" height="18" rx="2" fill={MUR} />
          <path d="M-15 -17 L0 -30 L15 -17 Z" fill={toit} />
          <rect x="-3" y="-9" width="6" height="9" rx="2" fill={TRAIT} opacity="0.7" />
          <rect x="-9" y="-14" width="4" height="4" fill="#BFE3FF" />
          <rect x="5" y="-14" width="4" height="4" fill="#BFE3FF" />
        </g>
      );
  }
}

export function Batiment({
  type,
  niveau,
  chantier,
  x,
  y,
  s = 1,
  toit,
}: {
  type: TypeBatiment;
  niveau: number;
  chantier: boolean;
  x: number;
  y: number;
  s?: number;
  toit: string;
}) {
  if (niveau === 0) {
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {chantier ? (
          <g>
            <rect x="-12" y="-20" width="24" height="20" fill="none" stroke="#C8873A" strokeWidth="2" />
            <path d="M-12 -10 L12 -10 M-12 -20 L12 0 M12 -20 L-12 0" stroke="#C8873A" strokeWidth="1.5" />
            <rect x="-14" y="-3" width="9" height="3" fill="#FFD45C" />
            <path d="M8 -3 L11 -9 L14 -3 Z" fill="#FFA726" />
          </g>
        ) : (
          <g opacity="0.55">
            <ellipse cx="0" cy="-1" rx="12" ry="3" fill="#24304A" opacity="0.12" />
            <path
              d="M-6 -1 L-5 -5 M-4 -1 L-2 -6 M5 -1 L6 -5"
              stroke="#2E8C48"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    );
  }
  return <BatimentConstruit type={type} niveau={niveau} x={x} y={y} s={s} toit={toit} />;
}

function BatimentConstruit({
  type,
  niveau,
  x,
  y,
  s,
  toit,
}: {
  type: TypeBatiment;
  niveau: number;
  x: number;
  y: number;
  s: number;
  toit: string;
}) {
  const reduce = useReducedMotion();
  const echelle = niveau >= 2 ? 1.22 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="16" ry="3" fill="#24304A" opacity="0.15" />
      <g transform={`scale(${echelle})`}>
        <Corps type={type} toit={toit} anime={!reduce} />
      </g>
      {niveau >= 3 && (
        <g transform={`translate(10 ${-34 * echelle})`}>
          <rect x="0" y="0" width="1.6" height="14" fill={TRAIT} />
          <path d="M1.6 0 L11 3 L1.6 6 Z" fill="#FFD45C" stroke="#D69600" strokeWidth="0.8" />
        </g>
      )}
    </g>
  );
}
