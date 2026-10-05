/**
 * Horloge à aiguilles en SVG. Mode interactif : on fait glisser la grande aiguille (les minutes ; la
 * petite suit comme sur une vraie horloge) ou la petite aiguille (les heures). Toucher le cadran
 * déplace la grande aiguille à cet endroit.
 */
import { useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { type Heure, angles } from '../_calcul-commun/horloge';

const C = 100;

function pointeur(e: React.PointerEvent<SVGSVGElement>, svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 200 - C;
  const y = ((e.clientY - r.top) / r.height) * 200 - C;
  const a = (Math.atan2(x, -y) * 180) / Math.PI;
  return { angle: (a + 360) % 360, dist: Math.hypot(x, y) };
}

export function Horloge({
  heure,
  taille = 260,
  secondes = false,
  aideMinutes = false,
  interactif = false,
  pas = 5,
  onChange,
  couleur = '#4FC3F7',
  label,
}: {
  heure: Heure;
  taille?: number;
  secondes?: boolean;
  /** Affiche les minutes (5, 10, 15…) autour du cadran. */
  aideMinutes?: boolean;
  interactif?: boolean;
  /** Pas des minutes quand on fait glisser la grande aiguille. */
  pas?: number;
  /** Nouvelle heure en minutes depuis minuit (0 à 719 : une horloge ne distingue pas matin et soir). */
  onChange?: (totalMinutes: number) => void;
  couleur?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const prise = useRef<'minute' | 'heure' | null>(null);
  const a = angles(heure);
  const total = (heure.h % 12) * 60 + heure.m;

  const deplacer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svg.current || !onChange || !prise.current) return;
    const { angle } = pointeur(e, svg.current);
    if (prise.current === 'minute') {
      let m = Math.round(angle / 6 / pas) * pas;
      if (m >= 60) m = 0;
      let h = Math.floor(total / 60);
      const avant = total % 60;
      if (avant >= 45 && m < 15) h += 1;
      else if (avant < 15 && m >= 45) h -= 1;
      onChange((((h * 60 + m) % 720) + 720) % 720);
    } else {
      const m = total % 60;
      const h = Math.round((angle - m * 0.5) / 30);
      onChange(((((h % 12) + 12) % 12) * 60 + m) % 720);
    }
  };

  const debut = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactif || !svg.current) return;
    const { angle, dist } = pointeur(e, svg.current);
    // près de la petite aiguille (et pas trop loin du centre) : on prend les heures
    const ecartH = Math.abs(((angle - a.heure + 540) % 360) - 180);
    prise.current = dist < 62 && ecartH < 25 ? 'heure' : 'minute';
    svg.current.setPointerCapture(e.pointerId);
    deplacer(e);
  };

  const anime = !reduce && !interactif;
  const tourne = (deg: number) => ({
    transform: `rotate(${deg}deg)`,
    transformOrigin: '100px 100px',
    transformBox: 'view-box' as const,
    transition: anime ? 'transform 500ms cubic-bezier(.3,1.4,.6,1)' : undefined,
  });

  return (
    <svg
      ref={svg}
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      className={`max-w-full ${interactif ? 'cursor-grab touch-none' : ''}`}
      role="img"
      aria-label={label ?? 'Horloge'}
      onPointerDown={debut}
      onPointerMove={(e) => prise.current && deplacer(e)}
      onPointerUp={() => (prise.current = null)}
      onPointerCancel={() => (prise.current = null)}
    >
      <circle cx={C} cy={C + 4} r="96" fill="rgb(0 0 0 / 0.15)" />
      <circle cx={C} cy={C} r="96" fill={couleur} />
      <circle cx={C} cy={C} r="86" fill="#FFF8EC" />
      {Array.from({ length: 60 }, (_, i) => {
        const ang = (i * 6 * Math.PI) / 180;
        const long = i % 5 === 0;
        const r1 = long ? 74 : 79;
        return (
          <line
            key={i}
            x1={C + Math.sin(ang) * r1}
            y1={C - Math.cos(ang) * r1}
            x2={C + Math.sin(ang) * 83}
            y2={C - Math.cos(ang) * 83}
            stroke="#24304A"
            strokeWidth={long ? 2.5 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const ang = (n * 30 * Math.PI) / 180;
        return (
          <text
            key={n}
            x={C + Math.sin(ang) * 62}
            y={C - Math.cos(ang) * 62 + 6.5}
            textAnchor="middle"
            fontFamily="Baloo 2, sans-serif"
            fontWeight="800"
            fontSize="18"
            fill="#24304A"
          >
            {n}
          </text>
        );
      })}
      {aideMinutes &&
        Array.from({ length: 12 }, (_, i) => {
          const ang = (i * 30 * Math.PI) / 180;
          return (
            <g key={i}>
              <circle cx={C + Math.sin(ang) * 91} cy={C - Math.cos(ang) * 91} r="7.5" fill="#fff" />
              <text
                x={C + Math.sin(ang) * 91}
                y={C - Math.cos(ang) * 91 + 3.5}
                textAnchor="middle"
                fontFamily="Baloo 2, sans-serif"
                fontWeight="700"
                fontSize="9.5"
                fill="#1976D2"
              >
                {String(i * 5).padStart(2, '0')}
              </text>
            </g>
          );
        })}
      {/* petite aiguille (heures) */}
      <g style={tourne(a.heure)}>
        <path d="M100 108 L95 100 L100 52 L105 100 Z" fill="#24304A" />
        {interactif && <circle cx="100" cy="56" r="7" fill="#FF7A6B" stroke="#fff" strokeWidth="2" />}
      </g>
      {/* grande aiguille (minutes) */}
      <g style={tourne(a.minute)}>
        <path d="M100 112 L97 100 L100 24 L103 100 Z" fill="#1976D2" />
        {interactif && <circle cx="100" cy="30" r="8" fill="#4FC3F7" stroke="#fff" strokeWidth="2" />}
      </g>
      {secondes && (
        <g style={tourne(a.seconde)}>
          <line x1="100" y1="116" x2="100" y2="20" stroke="#FF7A6B" strokeWidth="1.6" />
          <circle cx="100" cy="100" r="3.5" fill="#FF7A6B" />
        </g>
      )}
      <circle cx={C} cy={C} r="5" fill="#24304A" />
    </svg>
  );
}
