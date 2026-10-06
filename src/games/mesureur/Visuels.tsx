/**
 * Visuels du Mesureur : objet posé sur une règle qu'on peut faire glisser, balance de Roberval, figure
 * sur quadrillage (on touche les carreaux pour les compter), figures cotées (avec la fourmi qui fait le
 * tour), rectangles accolés, angles avec l'équerre.
 */
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import type { PlanBalance, PlanFigure, PlanQuadrillage, PlanRegle } from '../_geometrie-commun/mesure';
import { nombreFr } from '../_geometrie-commun/graphique';
import { dansUnChamp, useBoucle } from '../_nombres-commun/outils';
import { pointSvg } from '../geometre/Papier';

/* ------------------------------------------------------------------ */
/* Règle                                                               */
/* ------------------------------------------------------------------ */

/** Objet à mesurer, dessiné à la bonne longueur (px) à partir de x = 0, centré sur y = 0. */
function Objet({ emoji, L }: { emoji: string; L: number }) {
  switch (emoji) {
    case '✏️':
      return (
        <g>
          <path
            d={`M0 0 L 18 -11 L ${L - 14} -11 L ${L - 14} 11 L 18 11 Z`}
            fill="#FFD45C"
            stroke="#24304A"
            strokeWidth="2.5"
          />
          <path d="M0 0 L 18 -11 L 18 11 Z" fill="#F2C29B" stroke="#24304A" strokeWidth="2" />
          <path d="M0 0 L 6 -3.7 L 6 3.7 Z" fill="#24304A" />
          <line x1="18" y1="-4" x2={L - 14} y2="-4" stroke="#E0A458" strokeWidth="2" />
          <line x1="18" y1="4" x2={L - 14} y2="4" stroke="#E0A458" strokeWidth="2" />
          <rect
            x={L - 14}
            y={-11}
            width={14}
            height={22}
            rx="4"
            fill="#FF7A6B"
            stroke="#24304A"
            strokeWidth="2.5"
          />
        </g>
      );
    case '🥕':
      return (
        <g>
          <path
            d={`M0 0 Q ${L * 0.4} -14 ${L - 14} -13 Q ${L - 8} 0 ${L - 14} 13 Q ${L * 0.4} 14 0 0 Z`}
            fill="#FF9A3C"
            stroke="#B85C10"
            strokeWidth="2.5"
          />
          {[0.3, 0.5, 0.7].map((k) => (
            <line key={k} x1={L * k} y1={-6} x2={L * k + 8} y2={-3} stroke="#B85C10" strokeWidth="2" />
          ))}
          <path
            d={`M${L - 12} -6 l 14 -12 M${L - 12} 0 l 16 0 M${L - 12} 6 l 14 12`}
            stroke="#3E9B4F"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      );
    case '🐛': {
      const n = Math.max(3, Math.round(L / 22));
      const r = L / n / 2;
      return (
        <g>
          {Array.from({ length: n }, (_, i) => (
            <circle
              key={i}
              cx={r + i * 2 * r}
              cy={i % 2 ? 2 : -2}
              r={r * 1.05}
              fill={i === n - 1 ? '#5CC97A' : '#7BD389'}
              stroke="#2E8C48"
              strokeWidth="2"
            />
          ))}
          <circle cx={L - r * 0.6} cy={-5} r="2.5" fill="#24304A" />
        </g>
      );
    }
    case '🥖':
      return (
        <g>
          <rect
            x="0"
            y="-13"
            width={L}
            height="26"
            rx="13"
            fill="#E0A458"
            stroke="#8D5A3B"
            strokeWidth="2.5"
          />
          {Array.from({ length: Math.max(2, Math.floor(L / 40)) }, (_, i) => (
            <path
              key={i}
              d={`M ${20 + i * 40} -8 q 12 8 22 0`}
              stroke="#8D5A3B"
              strokeWidth="2.5"
              fill="none"
            />
          ))}
        </g>
      );
    case '📎':
      return (
        <path
          d={`M ${L} -6 L 10 -6 Q 0 -6 0 0 Q 0 6 10 6 L ${L - 10} 6 Q ${L - 4} 6 ${L - 4} 1 Q ${L - 4} -2 ${L - 10} -2 L 16 -2`}
          fill="none"
          stroke="#7C9CC9"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <g>
          <rect
            x="0"
            y="-11"
            width={L}
            height="22"
            rx="11"
            fill="#8E7CFF"
            stroke="#24304A"
            strokeWidth="2.5"
          />
          <text x={L / 2} y={8} textAnchor="middle" fontSize="20">
            {emoji}
          </text>
        </g>
      );
  }
}

export function RegleVirtuelle({
  plan,
  decalage,
  actif,
  corrige,
}: {
  plan: PlanRegle;
  /** Position de départ de l'objet par rapport au 0 de la règle (cm). */
  decalage: number;
  actif: boolean;
  corrige: boolean;
}) {
  const cm = plan.unite === 'mm' ? plan.longueur / 10 : plan.longueur;
  const max = Math.min(30, Math.ceil((cm + Math.abs(decalage) + 3) / 5) * 5);
  const CM = Math.min(46, 640 / max);
  const X0 = 30;
  const [regle, setRegle] = useState(0); // position du 0 de la règle (cm, par rapport au départ de la feuille)
  const drag = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bouger = useCallback(
    (d: number) => setRegle((r) => Math.round(Math.max(-2, Math.min(max - cm - 0.5, r + d)) * 10) / 10),
    [max, cm],
  );

  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        bouger((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 0.1));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, bouger]);

  const xObj = X0 + (decalage + 0) * CM;
  const W = X0 * 2 + (max + 2.5) * CM;
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} 190`}
        className="block h-auto w-full touch-none select-none"
        role="img"
        aria-label={`Un objet posé au-dessus d’une règle graduée. Le 0 de la règle est ${regle === decalage ? 'au bout de l’objet' : 'décalé'}.`}
        onPointerDown={(e) => {
          if (!actif || !svgRef.current) return;
          const p = pointSvg(svgRef.current, e.clientX, e.clientY);
          if (p && p[1] > 80) {
            drag.current = p[0];
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          if (drag.current === null || !svgRef.current) return;
          const p = pointSvg(svgRef.current, e.clientX, e.clientY);
          if (!p) return;
          const d = (p[0] - drag.current) / CM;
          if (Math.abs(d) >= 0.1) {
            bouger(Math.round(d * 10) / 10);
            drag.current = p[0];
          }
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <rect width={W} height="190" fill="#FFFDF7" />
        <g transform={`translate(${xObj} 50)`}>
          <Objet emoji={plan.objet} L={cm * CM} />
        </g>
        {corrige && (
          <g>
            <line
              x1={xObj}
              y1={20}
              x2={xObj}
              y2={170}
              stroke="#2E8C48"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />
            <line
              x1={xObj + cm * CM}
              y1={20}
              x2={xObj + cm * CM}
              y2={170}
              stroke="#2E8C48"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />
          </g>
        )}
        <g transform={`translate(${X0 + regle * CM} 0)`} className={actif ? 'cursor-grab' : ''}>
          <rect
            x={-18}
            y={86}
            width={max * CM + 36}
            height={84}
            rx="8"
            fill="#FFE9A8"
            stroke="#D69600"
            strokeWidth="2.5"
            opacity="0.95"
          />
          {Array.from({ length: max * 10 + 1 }, (_, k) => (
            <line
              key={k}
              x1={(k * CM) / 10}
              x2={(k * CM) / 10}
              y1={86}
              y2={86 + (k % 10 === 0 ? 30 : k % 5 === 0 ? 20 : 11)}
              stroke="#6B4A00"
              strokeWidth={k % 10 === 0 ? 2.2 : 1}
            />
          ))}
          {Array.from({ length: max + 1 }, (_, k) => (
            <text
              key={k}
              x={k * CM}
              y={140}
              textAnchor="middle"
              fontSize={max > 20 ? 14 : 17}
              fontWeight="800"
              fill="#6B4A00"
            >
              {k}
            </text>
          ))}
          <text x={max * CM + 10} y={162} textAnchor="end" fontSize="13" fill="#6B4A00">
            cm
          </text>
        </g>
      </svg>
      {actif && (
        <div className="flex items-center gap-2">
          <Button variant="blanc" aria-label="Glisser la règle vers la gauche" onClick={() => bouger(-0.5)}>
            ◀
          </Button>
          <span className="text-center text-sm font-bold text-ink-soft">Fais glisser la règle (ou ← →)</span>
          <Button variant="blanc" aria-label="Glisser la règle vers la droite" onClick={() => bouger(0.5)}>
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Balance                                                             */
/* ------------------------------------------------------------------ */

export function Balance({
  plan,
  coches,
  onCocher,
}: {
  plan: PlanBalance;
  coches: Set<number>;
  onCocher?: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? 1 : 0);
  // Le fléau oscille un peu puis s'immobilise à l'équilibre.
  useBoucle(t < 1, (dt) => setT((v) => Math.min(1, v + dt / 1.6)));
  const angle = t >= 1 ? 0 : -7 * Math.exp(-3.2 * t) * Math.cos(11 * t);
  const masses = plan.masses;
  const larg = (m: number) => 18 + Math.log10(m + 1) * 14;
  const total = masses.reduce((s, m) => s + larg(m) + 6, 0);
  const echelle = Math.min(1, 210 / total);
  let x = 0;
  return (
    <svg
      viewBox="0 0 520 300"
      className="block h-auto max-h-[46vh] w-full select-none"
      role="img"
      aria-label={`Balance en équilibre : l’objet d’un côté, ${masses.length} masses marquées de l’autre.`}
    >
      <rect width="520" height="300" fill="#FFFDF7" />
      <path d="M 200 280 L 320 280 L 280 250 L 240 250 Z" fill="#8D5A3B" />
      <rect x="252" y="120" width="16" height="132" fill="#C9A06A" />
      <g transform={`rotate(${angle} 260 118)`}>
        <rect x="60" y="112" width="400" height="12" rx="6" fill="#586480" />
        <polygon points="260,96 252,112 268,112" fill="#FF7A6B" />
        {/* plateau gauche */}
        <line x1="70" y1="118" x2="40" y2="200" stroke="#586480" strokeWidth="3" />
        <line x1="150" y1="118" x2="180" y2="200" stroke="#586480" strokeWidth="3" />
        <path d="M 30 200 Q 110 228 190 200 Z" fill="#AEB9D2" stroke="#586480" strokeWidth="3" />
        <text x="110" y="196" textAnchor="middle" fontSize="64">
          {plan.objet}
        </text>
        {/* plateau droit */}
        <line x1="370" y1="118" x2="340" y2="200" stroke="#586480" strokeWidth="3" />
        <line x1="450" y1="118" x2="480" y2="200" stroke="#586480" strokeWidth="3" />
        <path d="M 330 200 Q 410 228 490 200 Z" fill="#AEB9D2" stroke="#586480" strokeWidth="3" />
        <g transform={`translate(${410 - (total * echelle) / 2} 0) scale(${echelle} 1)`}>
          {masses.map((m, i) => {
            const w = larg(m);
            const h = 18 + Math.log10(m + 1) * 16;
            const x0 = x;
            x += w + 6;
            return (
              <g
                key={i}
                onClick={onCocher ? () => onCocher(i) : undefined}
                className={onCocher ? 'cursor-pointer' : ''}
              >
                <rect
                  x={x0}
                  y={200 - h}
                  width={w}
                  height={h}
                  rx="5"
                  fill={coches.has(i) ? '#7BD389' : '#E0B44A'}
                  stroke="#8D5A3B"
                  strokeWidth="2.5"
                />
                <rect
                  x={x0 + w * 0.3}
                  y={200 - h - 6}
                  width={w * 0.4}
                  height={7}
                  rx="3"
                  fill="#C9962B"
                  stroke="#8D5A3B"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </g>
      </g>
      {/* étiquettes des masses (non déformées) */}
      <g>
        {(() => {
          let xx = 0;
          return masses.map((m, i) => {
            const w = larg(m);
            const cx = 410 - (total * echelle) / 2 + (xx + w / 2) * echelle;
            xx += w + 6;
            return (
              <text
                key={i}
                x={cx}
                y={i % 2 ? 252 : 236}
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#24304A"
                stroke="#FFFDF7"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {nombreFr(m)} {plan.unite}
              </text>
            );
          });
        })()}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Aire sur quadrillage                                                */
/* ------------------------------------------------------------------ */

const DEMI: Record<string, (x: number, y: number, C: number) => string> = {
  hg: (x, y, C) => `${x},${y} ${x + C},${y} ${x},${y + C}`,
  hd: (x, y, C) => `${x},${y} ${x + C},${y} ${x + C},${y + C}`,
  bg: (x, y, C) => `${x},${y} ${x},${y + C} ${x + C},${y + C}`,
  bd: (x, y, C) => `${x + C},${y} ${x + C},${y + C} ${x},${y + C}`,
};

export function QuadrillageAire({
  plan,
  marques,
  onMarquer,
}: {
  plan: PlanQuadrillage;
  marques: string[];
  onMarquer?: (k: string) => void;
}) {
  const C = 52;
  const numero = (k: string) => marques.indexOf(k) + 1;
  return (
    <svg
      viewBox={`-6 -6 ${plan.cols * C + 12} ${plan.rows * C + 12}`}
      className="block h-auto max-h-[50vh] w-full select-none"
      role="img"
      aria-label={`Figure coloriée sur un quadrillage : ${plan.cells.length} carreaux entiers${plan.demis.length ? ` et ${plan.demis.length} demi-carreaux` : ''}.`}
    >
      <rect x="-6" y="-6" width={plan.cols * C + 12} height={plan.rows * C + 12} fill="#FFFDF7" />
      {plan.cells.map(([x, y]) => {
        const k = `${x},${y}`;
        const n = numero(k);
        return (
          <g
            key={k}
            onClick={onMarquer ? () => onMarquer(k) : undefined}
            className={onMarquer ? 'cursor-pointer' : ''}
          >
            <rect x={x * C} y={y * C} width={C} height={C} fill={n ? '#B4A8FF' : '#8FD3FF'} />
            {n > 0 && (
              <text
                x={x * C + C / 2}
                y={y * C + C / 2 + 7}
                textAnchor="middle"
                fontSize="20"
                fontWeight="800"
                fill="#24304A"
              >
                {n}
              </text>
            )}
          </g>
        );
      })}
      {plan.demis.map(([x, y, coin]) => {
        const k = `d${x},${y}`;
        const n = numero(k);
        return (
          <g
            key={k}
            onClick={onMarquer ? () => onMarquer(k) : undefined}
            className={onMarquer ? 'cursor-pointer' : ''}
          >
            <polygon points={DEMI[coin]!(x * C, y * C, C)} fill={n ? '#FFD45C' : '#FFB4AA'} />
            {n > 0 && (
              <text
                x={x * C + C / 2}
                y={y * C + C / 2 + 7}
                textAnchor="middle"
                fontSize="15"
                fontWeight="800"
                fill="#24304A"
              >
                ½
              </text>
            )}
          </g>
        );
      })}
      {Array.from({ length: plan.cols + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * C}
          y1={0}
          x2={i * C}
          y2={plan.rows * C}
          stroke="#7C9CC9"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      ))}
      {Array.from({ length: plan.rows + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * C}
          x2={plan.cols * C}
          y2={i * C}
          stroke="#7C9CC9"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Figures cotées                                                      */
/* ------------------------------------------------------------------ */

type P = [number, number];

/** Sommets d'un dessin type pour une figure décrite par ses côtés (proportions approchées). */
function sommetsDe(f: PlanFigure): P[] {
  const c = f.cotes;
  if (f.type === 'carre')
    return [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
  if (f.type === 'rectangle') {
    const L = c[0] ?? 2;
    const l = c[1] ?? (f.cotes[0] ? L / 2 : 1);
    const r = Math.max(0.35, Math.min(0.8, (l ?? 1) / (L || 1)));
    return [
      [0, 0],
      [1, 0],
      [1, r],
      [0, r],
    ];
  }
  if (f.type === 'triangle') {
    if (f.angleDroit)
      return [
        [0, 0],
        [0, 0.8],
        [1, 0.8],
      ];
    return [
      [0, 0.8],
      [1, 0.8],
      [0.35, 0],
    ];
  }
  const n = c.length;
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
    return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)] as P;
  });
}

export function FigureCotee({
  plan,
  tour,
  onTourFini,
}: {
  plan: PlanFigure;
  tour: boolean;
  onTourFini?: () => void;
}) {
  const reduce = useReducedMotion();
  const S = 300;
  const [t, setT] = useState(0);
  useBoucle(tour && t < 1, (dt) => setT((v) => Math.min(1, v + dt / (reduce ? 0.2 : 3))));
  useEffect(() => {
    if (t >= 1) onTourFini?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t >= 1]);
  const etiquette = (v: number | null) => (v === null ? '?' : `${nombreFr(v)} ${plan.unite}`);

  if (plan.type === 'cercle') {
    const r = 110;
    return (
      <svg
        viewBox="0 0 340 300"
        className="block h-auto max-h-[44vh] w-full"
        role="img"
        aria-label="Un cercle avec son centre."
      >
        <rect width="340" height="300" fill="#FFFDF7" />
        <circle cx="170" cy="150" r={r} fill="#8FD3FF" fillOpacity="0.4" stroke="#24304A" strokeWidth="4" />
        <circle cx="170" cy="150" r="5" fill="#24304A" />
        {plan.diametre !== undefined ? (
          <>
            <line x1={170 - r} y1="150" x2={170 + r} y2="150" stroke="#CD3E30" strokeWidth="4" />
            <text x="170" y="140" textAnchor="middle" fontSize="20" fontWeight="800" fill="#CD3E30">
              diamètre {nombreFr(plan.diametre)} {plan.unite}
            </text>
          </>
        ) : (
          <>
            <line x1="170" y1="150" x2={170 + r} y2="150" stroke="#CD3E30" strokeWidth="4" />
            <text x={170 + r / 2} y="140" textAnchor="middle" fontSize="20" fontWeight="800" fill="#CD3E30">
              rayon {nombreFr(plan.rayon ?? 0)} {plan.unite}
            </text>
          </>
        )}
        {tour && (
          <circle
            cx="170"
            cy="150"
            r={r}
            fill="none"
            stroke="#FFD45C"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * r * t} ${2 * Math.PI * r}`}
            transform="rotate(-90 170 150)"
          />
        )}
      </svg>
    );
  }

  const pts = sommetsDe(plan).map(([x, y]) => [30 + x * S * 0.86, 40 + y * S * 0.86] as P);
  const n = pts.length;
  const longueurs = pts.map((p, i) => Math.hypot(pts[(i + 1) % n]![0] - p[0], pts[(i + 1) % n]![1] - p[1]));
  const total = longueurs.reduce((s, l) => s + l, 0);
  // Position de la fourmi
  let reste = t * total;
  let fourmi: P = pts[0]!;
  for (let i = 0; i < n; i++) {
    if (reste <= longueurs[i]!) {
      const a = pts[i]!;
      const b = pts[(i + 1) % n]!;
      const k = reste / longueurs[i]!;
      fourmi = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      break;
    }
    reste -= longueurs[i]!;
  }
  const H = Math.max(...pts.map((p) => p[1])) + 50;
  const d = plan.decoupe;
  return (
    <svg
      viewBox={`0 0 ${S + 40} ${H}`}
      className="block h-auto max-h-[44vh] w-full"
      role="img"
      aria-label={`Figure à ${n} côtés dont les longueurs sont écrites.`}
    >
      <rect width={S + 40} height={H} fill="#FFFDF7" />
      <polygon
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="#8FD3FF"
        fillOpacity="0.4"
        stroke="#24304A"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {d !== undefined && plan.type === 'rectangle' && plan.cotes[0] && (
        <rect
          x={pts[1]![0] - ((pts[1]![0] - pts[0]![0]) * d) / plan.cotes[0]}
          y={pts[1]![1]}
          width={((pts[1]![0] - pts[0]![0]) * d) / plan.cotes[0]}
          height={((pts[1]![0] - pts[0]![0]) * d) / plan.cotes[0]}
          fill="#FFFDF7"
          stroke="#24304A"
          strokeWidth="3"
          strokeDasharray="8 6"
        />
      )}
      {tour && (
        <polyline
          points={[...pts.slice(0, 1), ...pts.slice(1), pts[0]!].map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="#FFD45C"
          strokeWidth="8"
          strokeDasharray={`${t * total} ${total}`}
        />
      )}
      {pts.map((p, i) => {
        const q = pts[(i + 1) % n]!;
        const m: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const cx = pts.reduce((s, v) => s + v[0] / n, 0);
        const cy = pts.reduce((s, v) => s + v[1] / n, 0);
        const dx = m[0] - cx;
        const dy = m[1] - cy;
        const l = Math.hypot(dx, dy) || 1;
        const v = plan.cotes[i];
        if (v === undefined) return null;
        return (
          <text
            key={i}
            x={m[0] + (dx / l) * 22}
            y={m[1] + (dy / l) * 22 + 6}
            textAnchor="middle"
            fontSize="19"
            fontWeight="800"
            fill={v === null ? '#CD3E30' : '#24304A'}
            stroke="#FFFDF7"
            strokeWidth="4"
            paintOrder="stroke"
          >
            {etiquette(v)}
          </text>
        );
      })}
      {plan.angleDroit && plan.type === 'triangle' && (
        <polyline
          points={`${pts[1]![0] + 16},${pts[1]![1]} ${pts[1]![0] + 16},${pts[1]![1] - 16} ${pts[1]![0]},${pts[1]![1] - 16}`}
          fill="none"
          stroke="#CD3E30"
          strokeWidth="3"
        />
      )}
      {tour && t < 1 && (
        <text x={fourmi[0]} y={fourmi[1] + 8} textAnchor="middle" fontSize="26">
          🐜
        </text>
      )}
    </svg>
  );
}

/** Deux rectangles accolés (figure composée), cotés. */
export function Rectangles({ rects, unite }: { rects: [number, number][]; unite: string }) {
  const max = Math.max(...rects.map((r) => r[0]), 1);
  const k =
    260 /
    Math.max(
      max,
      rects.reduce((s, r) => s + r[1], 0),
    );
  let y = 20;
  return (
    <svg
      viewBox={`0 0 340 ${rects.reduce((s, r) => s + r[1] * k, 0) + 50}`}
      className="block h-auto max-h-[44vh] w-full"
      role="img"
      aria-label="Figure formée de rectangles accolés."
    >
      {rects.map(([L, l], i) => {
        const y0 = y;
        y += l * k;
        return (
          <g key={i}>
            <rect
              x="40"
              y={y0}
              width={L * k}
              height={l * k}
              fill={i ? '#FFD45C' : '#8FD3FF'}
              fillOpacity="0.6"
              stroke="#24304A"
              strokeWidth="3"
            />
            <text
              x={40 + (L * k) / 2}
              y={y0 + (l * k) / 2 + 6}
              textAnchor="middle"
              fontSize="17"
              fontWeight="800"
              fill="#24304A"
            >
              {nombreFr(L)} {unite} × {nombreFr(l)} {unite}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Angles                                                              */
/* ------------------------------------------------------------------ */

export function AngleVue({ mesure, equerre, rot = 0 }: { mesure: number; equerre: boolean; rot?: number }) {
  const a = ((mesure + rot) * Math.PI) / 180;
  const b = (rot * Math.PI) / 180;
  const O: P = [55, 55];
  const R = 46;
  const A: P = [O[0] + R * Math.cos(b), O[1] - R * Math.sin(b)];
  const B: P = [O[0] + R * Math.cos(a), O[1] - R * Math.sin(a)];
  const arc = `M ${O[0] + 14 * Math.cos(b)} ${O[1] - 14 * Math.sin(b)} A 14 14 0 0 0 ${O[0] + 14 * Math.cos(a)} ${O[1] - 14 * Math.sin(a)}`;
  const c = (90 * Math.PI) / 180 + b;
  return (
    <svg viewBox="0 0 110 110" className="h-16 w-16 shrink-0" aria-hidden>
      {equerre && (
        <polygon
          points={`${O[0]},${O[1]} ${O[0] + 34 * Math.cos(b)},${O[1] - 34 * Math.sin(b)} ${O[0] + 26 * Math.cos(c)},${O[1] - 26 * Math.sin(c)}`}
          fill="#FFD45C"
          fillOpacity="0.6"
          stroke="#D69600"
          strokeWidth="1.5"
        />
      )}
      <line
        x1={O[0]}
        y1={O[1]}
        x2={A[0]}
        y2={A[1]}
        stroke="#24304A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1={O[0]}
        y1={O[1]}
        x2={B[0]}
        y2={B[1]}
        stroke="#24304A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d={arc} fill="none" stroke="#8E7CFF" strokeWidth="2" />
      <circle cx={O[0]} cy={O[1]} r="3" fill="#24304A" />
    </svg>
  );
}

/** Repères de la vie courante pour estimer une mesure. */
export function Reperes({ famille }: { famille: 'longueur' | 'masse' | 'contenance' | 'aire' }) {
  const r = useMemo(
    () =>
      ({
        longueur: [
          '📏 une règle d’écolier : 20 cm',
          '🚪 une porte : 2 m',
          '🐜 une fourmi : quelques mm',
          '🚶 15 min de marche : 1 km',
        ],
        masse: [
          '🍬 un bonbon : quelques g',
          '🧈 une plaquette de beurre : 250 g',
          '🍚 un paquet de sucre : 1 kg',
          '🐘 un éléphant : quelques t',
        ],
        contenance: [
          '🥄 une cuillère : 5 mL',
          '🥛 un verre : 20 cL',
          '🍾 une grande bouteille : 1 L',
          '🛁 une baignoire : 150 L',
        ],
        aire: [
          '💳 une carte : environ 46 cm²',
          '📓 une page de cahier : environ 4 dm²',
          '🚪 une porte : environ 2 m²',
        ],
      })[famille],
    [famille],
  );
  return (
    <ul className="grid w-full gap-1 rounded-2xl bg-sun/15 p-2 text-sm font-bold sm:grid-cols-2">
      {r.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}
