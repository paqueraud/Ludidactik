/**
 * Un solide dessiné en perspective, qu'on fait tourner (glisser, flèches, boutons). Arêtes cachées en
 * pointillés (convention du cycle 3). Mode « compter » : on touche les faces, arêtes ou sommets pour
 * les numéroter et n'en oublier aucun.
 */
import { useMemo, useRef, useState } from 'react';
import { type Modele, projeter } from '../_geometrie-commun/solides';

export type Quoi = 'faces' | 'arêtes' | 'sommets';

const TEINTES = ['#4FC3F7', '#FFD45C', '#7BD389', '#FF7A6B', '#8E7CFF', '#E0A458', '#1AB1AA', '#F28FB8'];

function teinte(hex: string, l: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (0.55 + 0.45 * l)));
  return `rgb(${c.join(',')})`;
}

export function Solide3D({
  modele,
  lacet,
  tangage,
  onTourner,
  cachees,
  compter,
  marques,
  onMarquer,
  label,
}: {
  modele: Modele;
  lacet: number;
  tangage: number;
  onTourner?: (dLacet: number, dTangage: number) => void;
  /** Dessiner les arêtes cachées en pointillés. */
  cachees: boolean;
  compter: Quoi | null;
  marques: string[];
  onMarquer?: (cle: string) => void;
  label: string;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState(false);
  const p = useMemo(() => projeter(modele, lacet, tangage), [modele, lacet, tangage]);
  const S = 95;
  const pt = (i: number) => p.points[i]!.map((v) => v * S) as [number, number];
  const num = (k: string) => marques.indexOf(k) + 1;

  if (modele.boule) {
    return (
      <svg
        viewBox="-170 -170 340 340"
        className="block h-auto max-h-[46vh] w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <radialGradient id="boule-reflet" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.25" stopColor="#8FD3FF" />
            <stop offset="1" stopColor="#1976D2" />
          </radialGradient>
        </defs>
        <circle r="140" fill="url(#boule-reflet)" stroke="#24304A" strokeWidth="4" />
        <path
          d="M -140 0 A 140 40 0 0 1 140 0"
          fill="none"
          stroke="#24304A"
          strokeWidth="2.5"
          strokeDasharray="9 7"
          opacity={cachees ? 0.8 : 0}
        />
        <path d="M -140 0 A 140 40 0 0 0 140 0" fill="none" stroke="#24304A" strokeWidth="2.5" />
      </svg>
    );
  }

  const faces = p.faces
    .filter((f) => f.visible)
    .sort((a, b) => a.profondeur - b.profondeur)
    .map((f) => {
      const poly = modele.faces[f.i]!;
      const courbe = modele.courbes?.has(f.i);
      const k = `f${f.i}`;
      const n = num(k);
      const c = poly.reduce<[number, number]>(
        (s, v) => [s[0] + pt(v)[0] / poly.length, s[1] + pt(v)[1] / poly.length],
        [0, 0],
      );
      return (
        <g key={k}>
          <polygon
            points={poly.map((v) => pt(v).join(',')).join(' ')}
            fill={teinte(TEINTES[courbe ? 0 : f.i % TEINTES.length]!, f.lumiere)}
            stroke={courbe ? 'none' : '#24304A'}
            strokeWidth="1"
            strokeLinejoin="round"
            onClick={compter === 'faces' && !courbe && onMarquer ? () => onMarquer(k) : undefined}
            className={compter === 'faces' && !courbe ? 'cursor-pointer' : ''}
          />
          {n > 0 && (
            <g pointerEvents="none">
              <circle cx={c[0]} cy={c[1]} r="15" fill="#6048DC" />
              <text x={c[0]} y={c[1] + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#FFFFFF">
                {n}
              </text>
            </g>
          )}
        </g>
      );
    });

  const sommetsReels = modele.sommetsReels ?? modele.sommets.map((_, i) => i);

  return (
    <svg
      viewBox="-200 -170 400 340"
      className={`block h-auto max-h-[46vh] w-full touch-none select-none ${onTourner ? (glisse ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        if (!onTourner) return;
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!onTourner || !drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        setGlisse(true);
        drag.current = { x: e.clientX, y: e.clientY };
        onTourner(dx * 0.012, dy * 0.008);
      }}
      onPointerUp={() => {
        drag.current = null;
        setGlisse(false);
      }}
      onPointerLeave={() => {
        drag.current = null;
        setGlisse(false);
      }}
    >
      {/* arêtes cachées d'abord (derrière) */}
      {cachees &&
        p.aretes
          .filter((a) => !a.visible)
          .map((a) => {
            const [x1, y1] = pt(a.a);
            const [x2, y2] = pt(a.b);
            return (
              <line
                key={`c${a.a}-${a.b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#24304A"
                strokeWidth="2.5"
                strokeDasharray="8 7"
                opacity="0.7"
              />
            );
          })}
      {faces}
      {p.aretes
        .filter((a) => a.visible)
        .map((a) => {
          const [x1, y1] = pt(a.a);
          const [x2, y2] = pt(a.b);
          const k = `a${Math.min(a.a, a.b)}-${Math.max(a.a, a.b)}`;
          const n = num(k);
          return (
            <g key={k}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={n ? '#6048DC' : '#24304A'}
                strokeWidth={n ? 6 : 4}
                strokeLinecap="round"
              />
              {compter === 'arêtes' && onMarquer && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="24"
                  className="cursor-pointer"
                  onClick={() => onMarquer(k)}
                />
              )}
              {n > 0 && (
                <g pointerEvents="none">
                  <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="13" fill="#6048DC" />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 + 5}
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="800"
                    fill="#FFFFFF"
                  >
                    {n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      {(compter === 'sommets' || marques.some((m) => m.startsWith('s'))) &&
        sommetsReels.map((i) => {
          const visible = p.faces.some((f) => f.visible && modele.faces[f.i]!.includes(i));
          if (!visible) return null;
          const [x, y] = pt(i);
          const k = `s${i}`;
          const n = num(k);
          return (
            <g
              key={k}
              onClick={compter === 'sommets' && onMarquer ? () => onMarquer(k) : undefined}
              className={compter === 'sommets' ? 'cursor-pointer' : ''}
            >
              <circle cx={x} cy={y} r="16" fill="transparent" />
              <circle cx={x} cy={y} r={n ? 13 : 7} fill={n ? '#6048DC' : '#24304A'} />
              {n > 0 && (
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="#FFFFFF"
                  pointerEvents="none"
                >
                  {n}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
