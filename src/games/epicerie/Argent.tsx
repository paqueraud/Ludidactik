/** Pièces et billets en euros, dessinés en SVG (stylisés, montants bien lisibles). */
import { estBillet, libelleValeur } from '../_calcul-commun/monnaie';

const BILLETS: Record<number, [string, string]> = {
  500: ['#A9B5AE', '#6E7D74'],
  1000: ['#F08D7E', '#B9483A'],
  2000: ['#7DB4E6', '#2F6FAF'],
  5000: ['#F5B26B', '#C46E1A'],
  10000: ['#7FCB98', '#2E8C48'],
  20000: ['#EBCB6A', '#A8801C'],
};

/** Taille relative des pièces (diamètre en px pour `echelle = 1`). */
const DIAMETRES: Record<number, number> = {
  1: 34,
  2: 38,
  5: 42,
  10: 40,
  20: 44,
  50: 48,
  100: 46,
  200: 52,
};

export function tailleArgent(v: number, echelle = 1): { l: number; h: number } {
  if (estBillet(v)) return { l: 96 * echelle, h: 52 * echelle };
  const d = (DIAMETRES[v] ?? 44) * echelle;
  return { l: d, h: d };
}

function Piece({ v, d }: { v: number; d: number }) {
  const cuivre = v < 10;
  const bimetal = v >= 100;
  const or = '#E9B949';
  const orFonce = '#B5831A';
  const argent = '#D7DCE2';
  const argentFonce = '#8F99A6';
  const [ext, extBord] = cuivre ? ['#D2864A', '#94511F'] : bimetal ? (v === 100 ? [or, orFonce] : [argent, argentFonce]) : [or, orFonce];
  const [int, intBord] = bimetal ? (v === 100 ? [argent, argentFonce] : [or, orFonce]) : [ext, extBord];
  const [nombre, unite] = libelleValeur(v).split(' ') as [string, string];
  return (
    <svg width={d} height={d} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="53" r="46" fill="rgb(0 0 0 / 0.18)" />
      <circle cx="50" cy="50" r="46" fill={ext} stroke={extBord} strokeWidth="4" />
      {/* cannelures */}
      <circle cx="50" cy="50" r="40" fill="none" stroke={extBord} strokeWidth="2" strokeDasharray="3 4" opacity="0.6" />
      <circle cx="50" cy="50" r={bimetal ? 31 : 36} fill={int} stroke={intBord} strokeWidth={bimetal ? 3 : 0} />
      <ellipse cx="38" cy="34" rx="16" ry="8" fill="#fff" opacity="0.35" transform="rotate(-25 38 34)" />
      <text x="50" y="58" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fill="#24304A">
        <tspan fontSize={nombre.length > 1 ? 40 : 48}>{nombre}</tspan>
      </text>
      <text x="50" y="80" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fill="#24304A" fontSize="20">
        {unite === 'c' ? 'cent' : 'euro'}
      </text>
    </svg>
  );
}

function Billet({ v, l, h }: { v: number; l: number; h: number }) {
  const [c, f] = BILLETS[v] ?? ['#ccc', '#888'];
  return (
    <svg width={l} height={h} viewBox="0 0 200 108" aria-hidden>
      <rect x="2" y="6" width="196" height="100" rx="10" fill="rgb(0 0 0 / 0.15)" />
      <rect x="2" y="2" width="196" height="100" rx="10" fill={c} stroke={f} strokeWidth="4" />
      {/* arche stylisée */}
      <path d="M118 92 V54 a26 26 0 0 1 52 0 V92" fill="none" stroke={f} strokeWidth="6" opacity="0.45" />
      <path d="M132 92 V60 a12 12 0 0 1 24 0 V92" fill="#fff" opacity="0.25" />
      {/* étoiles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={22 + i * 10} cy={20} r="3" fill="#FFD45C" />
      ))}
      <text x="18" y="78" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="46" fill="#24304A">
        {v / 100}
      </text>
      <text x={v >= 10000 ? 96 : v >= 1000 ? 74 : 50} y="78" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="34" fill="#24304A">
        €
      </text>
      <text x="178" y="30" textAnchor="end" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="16" fill="#24304A" opacity="0.7">
        EURO
      </text>
    </svg>
  );
}

/** Une pièce ou un billet. */
export function Argent({ valeur, echelle = 1 }: { valeur: number; echelle?: number }) {
  const t = tailleArgent(valeur, echelle);
  return estBillet(valeur) ? <Billet v={valeur} l={t.l} h={t.h} /> : <Piece v={valeur} d={t.l} />;
}
