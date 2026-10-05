/**
 * Une pizza en SVG coupée en `parts` parts égales ; les parts `garnies` portent la garniture.
 * Interactive : toucher une part la garnit (ou l'enlève), glisser le doigt garnit plusieurs parts,
 * Tab + Entrée/Espace au clavier.
 */
import { useRef } from 'react';

export type Garniture = 'tomate' | 'champignon' | 'olive' | 'basilic' | 'ananas';
export const GARNITURES: { id: Garniture; nom: string; emoji: string }[] = [
  { id: 'tomate', nom: 'aux tomates', emoji: '🍅' },
  { id: 'champignon', nom: 'aux champignons', emoji: '🍄' },
  { id: 'olive', nom: 'aux olives', emoji: '🫒' },
  { id: 'basilic', nom: 'au basilic', emoji: '🌿' },
  { id: 'ananas', nom: 'à l’ananas', emoji: '🍍' },
];

const R = 88;
const C = 100;

function point(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function part(i: number, n: number): string {
  if (n === 1) return `M ${C - R} ${C} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  const a0 = (i * 360) / n;
  const a1 = ((i + 1) * 360) / n;
  const [x0, y0] = point(a0, R);
  const [x1, y1] = point(a1, R);
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
}

function Topping({ g, x, y, s }: { g: Garniture; x: number; y: number; s: number }) {
  switch (g) {
    case 'tomate':
      return (
        <g>
          <circle cx={x} cy={y} r={6 * s} fill="#E53935" />
          <circle cx={x} cy={y} r={3.6 * s} fill="#FF7A6B" />
        </g>
      );
    case 'champignon':
      return (
        <g>
          <path d={`M${x - 6 * s} ${y} a${6 * s} ${5 * s} 0 0 1 ${12 * s} 0 Z`} fill="#A1887F" />
          <rect x={x - 2 * s} y={y} width={4 * s} height={5 * s} rx={1.5 * s} fill="#D7CCC8" />
        </g>
      );
    case 'olive':
      return <circle cx={x} cy={y} r={4.5 * s} fill="none" stroke="#2E2E2E" strokeWidth={2.6 * s} />;
    case 'basilic':
      return (
        <ellipse cx={x} cy={y} rx={6.5 * s} ry={3.4 * s} fill="#43A047" transform={`rotate(-30 ${x} ${y})`} />
      );
    case 'ananas':
      return (
        <rect
          x={x - 4 * s}
          y={y - 4 * s}
          width={8 * s}
          height={8 * s}
          rx={1.5 * s}
          fill="#FFCA28"
          stroke="#F9A825"
          strokeWidth={s}
        />
      );
  }
}

export function Pizza({
  parts,
  garnies,
  garniture,
  taille = 220,
  apercuCoupe,
  interactif = false,
  onChange,
  label,
  etat,
}: {
  parts: number;
  garnies: boolean[];
  garniture: Garniture;
  taille?: number;
  /** Avant la découpe : traits de couteau en pointillés pour ce nombre de parts. */
  apercuCoupe?: number;
  interactif?: boolean;
  onChange?: (garnies: boolean[]) => void;
  label: string;
  etat?: 'juste' | 'faux' | null;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const peinture = useRef<boolean | null>(null);
  const ref = useRef(garnies);
  ref.current = garnies;

  const indexSous = (e: React.PointerEvent): number | null => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return null;
    const x = ((e.clientX - r.left) / r.width) * 200 - C;
    const y = ((e.clientY - r.top) / r.height) * 200 - C;
    if (Math.hypot(x, y) > R + 4) return null;
    const a = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    return Math.min(parts - 1, Math.floor(a / (360 / parts)));
  };

  const poser = (i: number, v: boolean) => {
    if (ref.current[i] === v) return;
    const g = [...ref.current];
    g[i] = v;
    ref.current = g;
    onChange?.(g);
  };

  const bord = etat === 'juste' ? '#2E8C48' : etat === 'faux' ? '#CD3E30' : '#C98B3C';
  const s = parts > 12 ? 0.6 : parts > 8 ? 0.8 : 1;

  return (
    <svg
      ref={svg}
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      className={`max-w-full ${interactif ? 'cursor-pointer touch-none' : ''}`}
      role="group"
      aria-label={label}
      onPointerDown={(e) => {
        if (!interactif) return;
        const i = indexSous(e);
        if (i === null) return;
        peinture.current = !ref.current[i];
        poser(i, peinture.current);
        svg.current?.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (peinture.current === null) return;
        const i = indexSous(e);
        if (i !== null) poser(i, peinture.current);
      }}
      onPointerUp={() => (peinture.current = null)}
      onPointerCancel={() => (peinture.current = null)}
    >
      <circle cx={C} cy={C + 5} r={R + 8} fill="rgb(0 0 0 / 0.15)" />
      {/* pâte */}
      <circle cx={C} cy={C} r={R + 8} fill="#E8B05F" stroke={bord} strokeWidth="4" />
      {Array.from({ length: parts }, (_, i) => {
        const on = garnies[i] ?? false;
        const milieu = ((i + 0.5) * 360) / parts;
        const ouverture = 360 / parts;
        const nb = parts === 1 ? 7 : parts <= 4 ? 3 : parts <= 8 ? 2 : 1;
        const pos: [number, number][] =
          parts === 1
            ? [
                [0, 0],
                ...Array.from({ length: 6 }, (_, k) => point(k * 60 + 20, 52)).map(
                  ([x, y]) => [x - C, y - C] as [number, number],
                ),
              ]
            : Array.from({ length: nb }, (_, k) => {
                const ang = milieu + (nb > 1 ? (k / (nb - 1) - 0.5) * ouverture * 0.45 : 0);
                const rr = nb === 1 ? 58 : k % 2 ? 66 : 44;
                const [x, y] = point(ang, rr);
                return [x - C, y - C];
              });
        return (
          <g
            key={i}
            role={interactif ? 'checkbox' : undefined}
            aria-checked={interactif ? on : undefined}
            aria-label={interactif ? `Part ${i + 1}${on ? ', garnie' : ''}` : undefined}
            tabIndex={interactif ? 0 : undefined}
            onKeyDown={(e) => {
              if (!interactif) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                poser(i, !ref.current[i]);
              }
            }}
            className="outline-none focus-visible:[&>path]:stroke-grape focus-visible:[&>path]:[stroke-width:5]"
          >
            <path d={part(i, parts)} fill={on ? '#E85D3F' : '#F6D27A'} stroke="#C98B3C" strokeWidth="1" />
            {/* fromage */}
            <path d={part(i, parts)} fill={on ? 'url(#fromage)' : 'none'} opacity="0.9" />
            {on && pos.map(([x, y], k) => <Topping key={k} g={garniture} x={C + x} y={C + y} s={s} />)}
          </g>
        );
      })}
      <defs>
        <radialGradient id="fromage">
          <stop offset="0%" stopColor="#FFE082" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFCA28" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {/* traits de coupe */}
      {parts > 1 &&
        Array.from({ length: parts }, (_, i) => {
          const [x, y] = point((i * 360) / parts, R + 6);
          return (
            <line
              key={i}
              x1={C}
              y1={C}
              x2={x}
              y2={y}
              stroke="#7A4A1C"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
      {apercuCoupe !== undefined &&
        apercuCoupe > 1 &&
        Array.from({ length: apercuCoupe }, (_, i) => {
          const [x, y] = point((i * 360) / apercuCoupe, R + 6);
          return (
            <line
              key={i}
              x1={C}
              y1={C}
              x2={x}
              y2={y}
              stroke="#24304A"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
}
