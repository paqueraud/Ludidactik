/**
 * Tablette (ou barre) de chocolat en SVG : `d` carrés en `lignes` × `colonnes`, les carrés `pris` sont
 * emballés dans du papier doré. Interactive : toucher un carré le prend (ou le repose), glisser le doigt
 * en prend plusieurs.
 */
import { useRef } from 'react';

const CASE = 40;
const JEU = 4;

export function Tablette({
  d,
  lignes,
  colonnes,
  pris,
  interactif = false,
  onChange,
  largeurMax = 340,
  largeurFixe,
  label,
  couleur = '#FFD45C',
  etat,
}: {
  d: number;
  lignes: number;
  colonnes: number;
  pris: boolean[];
  interactif?: boolean;
  onChange?: (pris: boolean[]) => void;
  largeurMax?: number;
  /** Largeur imposée (deux bandes comparées ont la même longueur). */
  largeurFixe?: number;
  label: string;
  couleur?: string;
  etat?: 'juste' | 'faux' | null;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const peinture = useRef<boolean | null>(null);
  const ref = useRef(pris);
  ref.current = pris;
  const W = colonnes * CASE + 2 * JEU + 8;
  const H = lignes * CASE + 2 * JEU + 8;
  const largeur = largeurFixe ?? Math.min(largeurMax, colonnes * 60 + 20);

  const index = (e: React.PointerEvent): number | null => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return null;
    const x = ((e.clientX - r.left) / r.width) * W - JEU - 4;
    const y = ((e.clientY - r.top) / r.height) * H - JEU - 4;
    const c = Math.floor(x / CASE);
    const l = Math.floor(y / CASE);
    if (c < 0 || l < 0 || c >= colonnes || l >= lignes) return null;
    const i = l * colonnes + c;
    return i < d ? i : null;
  };
  const poser = (i: number, v: boolean) => {
    if (ref.current[i] === v) return;
    const p = [...ref.current];
    p[i] = v;
    ref.current = p;
    onChange?.(p);
  };
  const cadre = etat === 'juste' ? '#2E8C48' : etat === 'faux' ? '#CD3E30' : '#3E2417';

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      width={largeur}
      style={{ maxWidth: '100%', height: 'auto' }}
      className={interactif ? 'cursor-pointer touch-none' : ''}
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        if (!interactif) return;
        const i = index(e);
        if (i === null) return;
        peinture.current = !ref.current[i];
        poser(i, peinture.current);
        svg.current?.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (peinture.current === null) return;
        const i = index(e);
        if (i !== null) poser(i, peinture.current);
      }}
      onPointerUp={() => (peinture.current = null)}
      onPointerCancel={() => (peinture.current = null)}
    >
      <rect x="2" y="6" width={W - 4} height={H - 6} rx="10" fill="rgb(0 0 0 / 0.2)" />
      <rect x="2" y="2" width={W - 4} height={H - 6} rx="10" fill="#5D3420" stroke={cadre} strokeWidth="3" />
      {Array.from({ length: d }, (_, i) => {
        const l = Math.floor(i / colonnes);
        const c = i % colonnes;
        const x = JEU + 4 + c * CASE;
        const y = JEU + 2 + l * CASE;
        const on = pris[i] ?? false;
        return (
          <g key={i}>
            <rect x={x + 2} y={y + 2} width={CASE - 4} height={CASE - 4} rx="5" fill={on ? couleur : '#7B4A2E'} />
            {/* biseau */}
            <path
              d={`M${x + 2} ${y + CASE - 2} L${x + 8} ${y + CASE - 8} L${x + CASE - 8} ${y + CASE - 8} L${x + CASE - 2} ${y + CASE - 2} Z`}
              fill="rgb(0 0 0 / 0.25)"
            />
            <path d={`M${x + 2} ${y + 2} L${x + 8} ${y + 8} L${x + CASE - 8} ${y + 8} L${x + CASE - 2} ${y + 2} Z`} fill="rgb(255 255 255 / 0.18)" />
            {on && <path d={`M${x + 10} ${y + 12} l6 -3 l4 4`} stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />}
          </g>
        );
      })}
    </svg>
  );
}
