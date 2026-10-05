/**
 * Rendu SVG accessible des graphiques de la Station météo : diagramme en barres, courbe, diagramme
 * circulaire, tableau. Chaque graphique a une description (aria-label) et un tableau de données caché
 * pour les lecteurs d'écran. Un « fil de lecture » (pointillés jusqu'à l'axe) aide à lire une valeur.
 */
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  type Echelle,
  type Graphique,
  type TableauDouble,
  echelle,
  lisible,
  nombreFr,
  parts,
} from '../_geometrie-commun/graphique';

export const COULEURS = [
  '#4FC3F7',
  '#FF7A6B',
  '#7BD389',
  '#FFD45C',
  '#8E7CFF',
  '#E0A458',
  '#1AB1AA',
  '#F28FB8',
];
const W = 640;
const H = 380;
const G = 64; // marge gauche (axe)
const D = 18;
const HAUT = 34;
const BAS = 74;

/** Coupe une étiquette longue en deux lignes. */
function lignes(t: string): string[] {
  if (t.length <= 11) return [t];
  const mots = t.split(' ');
  let a = '';
  while (mots.length && (a + ' ' + mots[0]).trim().length <= Math.max(11, t.length / 2))
    a = `${a} ${mots.shift()}`.trim();
  return mots.length ? [a, mots.join(' ')] : [a];
}

function DonneesCachees({ g }: { g: Graphique }) {
  return (
    <table className="sr-only">
      <caption>{g.titre}</caption>
      <tbody>
        {g.etiquettes.map((e, i) => (
          <tr key={e}>
            <th scope="row">{e}</th>
            <td>
              {nombreFr(g.valeurs[i]!)} {g.unite}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Axe({ e, y, unite }: { e: Echelle; y: (v: number) => number; unite: string }) {
  const sous: number[] = [];
  for (let v = e.min; v <= e.max + 1e-9; v += e.sousPas) sous.push(Math.round(v * 1000) / 1000);
  const majeures = sous.filter((v) => Math.abs((v - e.min) / e.pas - Math.round((v - e.min) / e.pas)) < 1e-6);
  return (
    <g>
      {sous.map((v) => (
        <line key={`s${v}`} x1={G} x2={W - D} y1={y(v)} y2={y(v)} stroke="#D5DCEB" strokeWidth="1" />
      ))}
      {majeures.map((v) => (
        <g key={`m${v}`}>
          <line x1={G - 6} x2={W - D} y1={y(v)} y2={y(v)} stroke="#AEB9D2" strokeWidth="1.6" />
          <text x={G - 10} y={y(v) + 6} textAnchor="end" fontSize="17" fontWeight="700" fill="#24304A">
            {nombreFr(v)}
          </text>
        </g>
      ))}
      <line x1={G} x2={G} y1={HAUT - 10} y2={H - BAS} stroke="#24304A" strokeWidth="2.5" />
      <line x1={G} x2={W - D} y1={H - BAS} y2={H - BAS} stroke="#24304A" strokeWidth="2.5" />
      <text x={G - 4} y={HAUT - 16} fontSize="15" fontWeight="700" fill="#586480" textAnchor="middle">
        {unite}
      </text>
    </g>
  );
}

export function GraphiqueSvg({
  g,
  guide,
  onGuide,
  valeurs = 'illisibles',
  partsNommees = false,
  barreFausse,
}: {
  g: Graphique;
  /** Index montré par le fil de lecture. */
  guide: number | null;
  /** null = pas de fil de lecture (Plus loin). */
  onGuide: ((i: number) => void) | null;
  /** Valeurs écrites : 'illisibles' (seulement celles qu'on ne peut pas lire au quadrillage), 'toutes', 'aucune'. */
  valeurs?: 'illisibles' | 'toutes' | 'aucune';
  /** Diagramme circulaire : nom des parts (« la moitié »). */
  partsNommees?: boolean;
  barreFausse?: number;
}) {
  const reduce = useReducedMotion();
  if (g.type === 'tableau') return <TableauSimple g={g} />;
  if (g.type === 'circulaire') return <Camembert g={g} valeurs={valeurs} partsNommees={partsNommees} />;
  const e = echelle(g.valeurs, g.type !== 'courbe');
  const y = (v: number) => H - BAS - ((v - e.min) / (e.max - e.min)) * (H - BAS - HAUT);
  const n = g.etiquettes.length;
  const pasX = (W - G - D) / n;
  const x = (i: number) => G + pasX * (i + 0.5);
  const ecrire = (i: number) =>
    valeurs === 'toutes' || (valeurs === 'illisibles' && !lisible(g.valeurs[i]!, e));
  const desc = `${g.type === 'barres' ? 'Diagramme en barres' : 'Courbe'} : ${g.titre}. Axe gradué de ${nombreFr(e.min)} à ${nombreFr(e.max)} ${g.unite}.`;

  let trace: ReactNode = null;
  if (g.type === 'barres') {
    const l = Math.min(70, pasX * 0.62);
    trace = g.valeurs.map((v, i) => (
      <g key={i} onClick={onGuide ? () => onGuide(i) : undefined} className={onGuide ? 'cursor-pointer' : ''}>
        <rect x={x(i) - pasX / 2} y={HAUT} width={pasX} height={H - BAS - HAUT} fill="transparent" />
        <motion.rect
          x={x(i) - l / 2}
          width={l}
          rx="6"
          fill={COULEURS[i % COULEURS.length]}
          stroke={barreFausse === i ? '#CD3E30' : '#24304A'}
          strokeWidth={barreFausse === i ? 5 : 2}
          initial={reduce ? false : { attrY: H - BAS, height: 0 }}
          animate={{ attrY: y(v), height: Math.max(0, H - BAS - y(v)) }}
          transition={{ duration: 0.6, delay: i * 0.08 }}
        />
        {ecrire(i) && (
          <text x={x(i)} y={y(v) - 8} textAnchor="middle" fontSize="17" fontWeight="800" fill="#24304A">
            {nombreFr(v)}
          </text>
        )}
      </g>
    ));
  } else {
    const pts = g.valeurs.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    trace = (
      <g>
        <polygon points={`${x(0)},${H - BAS} ${pts} ${x(n - 1)},${H - BAS}`} fill="#4FC3F7" opacity="0.15" />
        <motion.polyline
          points={pts}
          fill="none"
          stroke="#1976D2"
          strokeWidth="4"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9 }}
        />
        {g.valeurs.map((v, i) => (
          <g
            key={i}
            onClick={onGuide ? () => onGuide(i) : undefined}
            className={onGuide ? 'cursor-pointer' : ''}
          >
            <rect x={x(i) - pasX / 2} y={HAUT} width={pasX} height={H - BAS - HAUT} fill="transparent" />
            <circle cx={x(i)} cy={y(v)} r="8" fill="#FFFFFF" stroke="#1976D2" strokeWidth="4" />
            {ecrire(i) && (
              <text x={x(i)} y={y(v) - 14} textAnchor="middle" fontSize="16" fontWeight="800" fill="#24304A">
                {nombreFr(v)}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  }

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label={desc}>
        <Axe e={e} y={y} unite={g.unite} />
        {trace}
        {guide !== null && guide < n && (
          <g pointerEvents="none">
            <line
              x1={G}
              x2={x(guide)}
              y1={y(g.valeurs[guide]!)}
              y2={y(g.valeurs[guide]!)}
              stroke="#8E7CFF"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
            <circle cx={G} cy={y(g.valeurs[guide]!)} r="6" fill="#8E7CFF" />
          </g>
        )}
        {g.etiquettes.map((t, i) => (
          <text
            key={t}
            x={x(i)}
            y={H - BAS + 24}
            textAnchor="middle"
            fontSize={n > 7 ? 13 : 16}
            fontWeight="700"
            fill="#24304A"
          >
            {lignes(t).map((l, k) => (
              <tspan key={k} x={x(i)} dy={k ? 18 : 0}>
                {l}
              </tspan>
            ))}
          </text>
        ))}
      </svg>
      <DonneesCachees g={g} />
    </figure>
  );
}

const NOMS_PARTS: [number, string][] = [
  [1 / 2, 'la moitié'],
  [1 / 4, 'le quart'],
  [3 / 4, 'les trois quarts'],
  [1 / 3, 'le tiers'],
  [1 / 6, 'le sixième'],
  [1 / 8, 'le huitième'],
];
export const nomPart = (f: number) => NOMS_PARTS.find(([v]) => Math.abs(v - f) < 1e-6)?.[1] ?? null;

function Camembert({
  g,
  valeurs,
  partsNommees,
}: {
  g: Graphique;
  valeurs: 'illisibles' | 'toutes' | 'aucune';
  partsNommees: boolean;
}) {
  const reduce = useReducedMotion();
  const total = g.valeurs.reduce((s, v) => s + v, 0) || 1;
  const ps = parts(g.valeurs);
  const R = 140;
  const [cx, cy] = [170, 170];
  const pt = (deg: number, r = R): [number, number] => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const montrer = valeurs === 'toutes';
  return (
    <figure className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <svg
        viewBox="0 0 340 340"
        className="block h-auto w-full max-w-[300px]"
        role="img"
        aria-label={`Diagramme circulaire : ${g.titre}.`}
      >
        {ps.map((p, i) => {
          const [x1, y1] = pt(p.debut);
          const [x2, y2] = pt(p.fin);
          const grand = p.fin - p.debut > 180 ? 1 : 0;
          const d =
            p.fin - p.debut >= 359.99
              ? `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} Z`
              : `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${grand} 1 ${x2} ${y2} Z`;
          return (
            <motion.path
              key={i}
              d={d}
              fill={COULEURS[i % COULEURS.length]}
              stroke="#FFFFFF"
              strokeWidth="4"
              initial={reduce ? false : { scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
        {/* repères des quarts */}
        {[0, 90, 180, 270].map((a) => {
          const [x, y] = pt(a, R + 8);
          return <circle key={a} cx={x} cy={y} r="3.5" fill="#24304A" />;
        })}
        {ps.map((p, i) => {
          const [x, y] = pt((p.debut + p.fin) / 2, R * 0.6);
          const nom = partsNommees ? nomPart(g.valeurs[i]! / total) : null;
          const texte = montrer ? `${nombreFr(g.valeurs[i]!)}` : nom;
          return texte ? (
            <text
              key={i}
              x={x}
              y={y + 6}
              textAnchor="middle"
              fontSize="17"
              fontWeight="800"
              fill="#24304A"
              stroke="#FFFFFF"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {texte}
            </text>
          ) : null;
        })}
      </svg>
      <ul className="flex flex-col gap-1.5">
        {g.etiquettes.map((e, i) => (
          <li key={e} className="flex items-center gap-2 font-bold">
            <span
              className="h-5 w-5 shrink-0 rounded-md border-2 border-ink"
              style={{ background: COULEURS[i % COULEURS.length] }}
              aria-hidden
            />
            {e}
            {montrer && (
              <span className="text-ink-soft">
                : {nombreFr(g.valeurs[i]!)} {g.unite}
              </span>
            )}
          </li>
        ))}
      </ul>
      <DonneesCachees g={g} />
    </figure>
  );
}

export function TableauSimple({ g, titre, valeurs }: { g: Graphique; titre?: string; valeurs?: number[] }) {
  const vs = valeurs ?? g.valeurs;
  return (
    <table className="w-full max-w-md self-center overflow-hidden rounded-2xl border-2 border-ink/30 text-lg">
      <caption className="pb-1 font-titre font-bold">{titre ?? g.titre}</caption>
      <thead>
        <tr className="bg-sky/25">
          <th scope="col" className="border border-ink/20 px-3 py-2 text-left">
            &nbsp;
          </th>
          <th scope="col" className="border border-ink/20 px-3 py-2">
            {g.unite || 'nombre'}
          </th>
        </tr>
      </thead>
      <tbody>
        {g.etiquettes.map((e, i) => (
          <tr key={e} className={i % 2 ? 'bg-cream' : 'bg-card'}>
            <th scope="row" className="border border-ink/20 px-3 py-1.5 text-left">
              {e}
            </th>
            <td className="border border-ink/20 px-3 py-1.5 text-center font-titre text-xl font-bold">
              {nombreFr(vs[i]!)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TableauDoubleVue({ t, titre }: { t: TableauDouble; titre: string }) {
  return (
    <table className="w-full max-w-md self-center rounded-2xl border-2 border-ink/30 text-lg">
      <caption className="pb-1 font-titre font-bold">{titre}</caption>
      <thead>
        <tr className="bg-sky/25">
          <td className="border border-ink/20 px-3 py-2" />
          {t.colonnes.map((c) => (
            <th key={c} scope="col" className="border border-ink/20 px-3 py-2">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {t.lignes.map((l, i) => (
          <tr key={l} className={i % 2 ? 'bg-cream' : 'bg-card'}>
            <th scope="row" className="border border-ink/20 px-3 py-1.5 text-left">
              {l}
            </th>
            {t.valeurs[i]!.map((v, j) => (
              <td
                key={j}
                className="border border-ink/20 px-3 py-1.5 text-center font-titre text-xl font-bold"
              >
                {nombreFr(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Une barre à construire en la tirant (souris, doigt) ou au clavier (↑ ↓). */
export function BarreAConstruire({
  max,
  valeur,
  onChange,
  etiquette,
  couleur,
  actif,
  attendu,
}: {
  max: number;
  valeur: number;
  onChange: (v: number) => void;
  etiquette: string;
  couleur: string;
  actif: boolean;
  /** Après la réponse : hauteur juste (contour vert). */
  attendu?: number;
}) {
  const C = 26; // hauteur d'un carreau
  const Wb = 260;
  const Hb = max * C;
  const y0 = Hb + 10;
  const fixer = (clientY: number, svg: SVGSVGElement) => {
    const r = svg.getBoundingClientRect();
    const yv = ((clientY - r.top) / r.height) * (Hb + 60);
    onChange(Math.max(0, Math.min(max, Math.round((y0 - yv) / C))));
  };
  return (
    <svg
      viewBox={`0 0 ${Wb} ${Hb + 60}`}
      className={`block h-auto max-h-[52vh] w-full max-w-[260px] touch-none select-none ${actif ? 'cursor-ns-resize' : ''}`}
      role="slider"
      aria-label={`Hauteur de la barre « ${etiquette} »`}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={valeur}
      aria-valuetext={`${valeur} carreau${valeur > 1 ? 'x' : ''}`}
      tabIndex={actif ? 0 : -1}
      onPointerDown={(e) => {
        if (!actif) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        fixer(e.clientY, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (!actif || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        fixer(e.clientY, e.currentTarget);
      }}
      onKeyDown={(e) => {
        if (!actif) return;
        if (e.key === 'ArrowUp') onChange(Math.min(max, valeur + 1));
        else if (e.key === 'ArrowDown') onChange(Math.max(0, valeur - 1));
        else return;
        e.preventDefault();
      }}
    >
      {Array.from({ length: max + 1 }, (_, k) => (
        <g key={k}>
          <line
            x1={46}
            x2={Wb - 10}
            y1={y0 - k * C}
            y2={y0 - k * C}
            stroke={k % 5 ? '#D5DCEB' : '#AEB9D2'}
            strokeWidth={k % 5 ? 1 : 2}
          />
          {(k % 5 === 0 || max <= 12) && (
            <text x={38} y={y0 - k * C + 5} textAnchor="end" fontSize="15" fontWeight="700" fill="#24304A">
              {k}
            </text>
          )}
        </g>
      ))}
      <line x1={46} x2={46} y1={0} y2={y0} stroke="#24304A" strokeWidth="2.5" />
      <rect
        x={100}
        y={y0 - valeur * C}
        width={90}
        height={valeur * C}
        rx="6"
        fill={couleur}
        stroke="#24304A"
        strokeWidth="2.5"
      />
      {attendu !== undefined && attendu !== valeur && (
        <rect
          x={96}
          y={y0 - attendu * C}
          width={98}
          height={attendu * C}
          rx="6"
          fill="none"
          stroke="#2E8C48"
          strokeWidth="4"
          strokeDasharray="10 6"
        />
      )}
      <rect
        x={112}
        y={y0 - valeur * C - 9}
        width={66}
        height={14}
        rx="7"
        fill="#24304A"
        opacity={actif ? 0.8 : 0.3}
      />
      <text x={145} y={y0 + 28} textAnchor="middle" fontSize="17" fontWeight="800" fill="#24304A">
        {etiquette}
      </text>
    </svg>
  );
}
