/**
 * Feuille quadrillée du Géomètre : on touche un nœud du quadrillage (ou on s'y déplace avec les flèches
 * puis Entrée) pour placer un point. Les coordonnées sont en carreaux, [x, y] (y vers le bas).
 */
import {
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { CASE_TACTILE, DefilementGrille } from '../_kit/ui';
import { dansUnChamp } from '../_nombres-commun/outils';

export type P = [number, number];

/** Coordonnées SVG (viewBox) d'un évènement de pointeur. */
export function pointSvg(svg: SVGSVGElement, clientX: number, clientY: number): P | null {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = svg.createSVGPoint();
  p.x = clientX;
  p.y = clientY;
  const r = p.matrixTransform(m.inverse());
  return [r.x, r.y];
}

/** Curseur clavier sur les nœuds d'un quadrillage. */
export function useCurseur(
  cols: number,
  rows: number,
  actif: boolean,
  onEntree: (p: P) => void,
  autres: Record<string, () => void> = {},
) {
  const [curseur, setCurseur] = useState<P>([Math.round(cols / 2), Math.round(rows / 2)]);
  const [visible, setVisible] = useState(false);
  const ref = useRef({ onEntree, autres, curseur });
  ref.current = { onEntree, autres, curseur };
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const d: Record<string, P> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (d[e.key]) {
        e.preventDefault();
        setVisible(true);
        setCurseur(([x, y]) => [
          Math.max(0, Math.min(cols, x + d[e.key]![0])),
          Math.max(0, Math.min(rows, y + d[e.key]![1])),
        ]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setVisible(true);
        ref.current.onEntree(ref.current.curseur);
      } else if (ref.current.autres[e.key]) {
        e.preventDefault();
        ref.current.autres[e.key]!();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, cols, rows]);
  return { curseur, setCurseur, visible, setVisible };
}

/**
 * Quadrillage SVG (U unités par carreau, marge M). `onNoeud` reçoit le nœud le plus proche du doigt.
 * Les enfants dessinent en coordonnées « carreaux × U ».
 */
export function Papier({
  cols,
  rows,
  U = 44,
  M = 30,
  onNoeud,
  curseur,
  children,
  label,
  svgRef,
  className = '',
  noeuds = true,
}: {
  cols: number;
  rows: number;
  U?: number;
  M?: number;
  onNoeud?: (p: P) => void;
  curseur?: P | null;
  children?: ReactNode;
  label: string;
  svgRef?: RefObject<SVGSVGElement>;
  className?: string;
  noeuds?: boolean;
}) {
  const interne = useRef<SVGSVGElement>(null);
  const ref = svgRef ?? interne;
  const W = cols * U;
  const H = rows * U;
  const toucher = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!onNoeud || !ref.current) return;
      const p = pointSvg(ref.current, e.clientX, e.clientY);
      if (!p) return;
      const x = Math.round(p[0] / U);
      const y = Math.round(p[1] / U);
      if (x < 0 || y < 0 || x > cols || y > rows) return;
      onNoeud([x, y]);
    },
    [onNoeud, ref, U, cols, rows],
  );
  const papier = (
    <svg
      ref={ref}
      viewBox={`${-M} ${-M} ${W + 2 * M} ${H + 2 * M}`}
      className={`block h-auto w-full select-none ${onNoeud ? 'cursor-crosshair' : ''} ${className}`}
      role="img"
      aria-label={label}
      onPointerUp={onNoeud ? toucher : undefined}
    >
      <rect x={-M} y={-M} width={W + 2 * M} height={H + 2 * M} fill="#FFFDF7" />
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * U} y1={0} x2={i * U} y2={H} stroke="#B9D4F2" strokeWidth="1.5" />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * U} x2={W} y2={i * U} stroke="#B9D4F2" strokeWidth="1.5" />
      ))}
      {noeuds &&
        onNoeud &&
        Array.from({ length: (cols + 1) * (rows + 1) }, (_, k) => {
          const x = k % (cols + 1);
          const y = Math.floor(k / (cols + 1));
          return <circle key={k} cx={x * U} cy={y * U} r="2.5" fill="#7C9CC9" />;
        })}
      {children}
      {curseur && (
        <circle
          cx={curseur[0] * U}
          cy={curseur[1] * U}
          r={U * 0.3}
          fill="none"
          stroke="#8E7CFF"
          strokeWidth="4"
          pointerEvents="none"
        />
      )}
    </svg>
  );
  // papier interactif : nœuds espacés d'au moins CASE_TACTILE px (défilement sur petit écran)
  return onNoeud ? (
    <DefilementGrille largeurMin={((W + 2 * M) / U) * CASE_TACTILE}>{papier}</DefilementGrille>
  ) : (
    papier
  );
}

/** Point nommé (petite croix + lettre). */
export function PointNomme({
  p,
  nom,
  U,
  couleur = '#24304A',
}: {
  p: P;
  nom: string;
  U: number;
  couleur?: string;
}) {
  const [x, y] = [p[0] * U, p[1] * U];
  return (
    <g pointerEvents="none">
      <line
        x1={x - 8}
        y1={y - 8}
        x2={x + 8}
        y2={y + 8}
        stroke={couleur}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={x - 8}
        y1={y + 8}
        x2={x + 8}
        y2={y - 8}
        stroke={couleur}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x={x + 10}
        y={y - 10}
        fontSize="24"
        fontWeight="800"
        fill={couleur}
        stroke="#FFFDF7"
        strokeWidth="5"
        paintOrder="stroke"
        fontFamily="Baloo 2, sans-serif"
      >
        {nom}
      </text>
    </g>
  );
}
