/** Matériel multibase dessiné (cube, barre, plaque, gros cube, jeton) selon la taille relative du rang. */

const TEINTES = [
  '#FFD45C',
  '#7BD389',
  '#4FC3F7',
  '#FF7A6B',
  '#8E7CFF',
  '#FF9DD2',
  '#E0A458',
  '#5BC8C0',
  '#B0BEC5',
];

/** `k` = rang relatif au plus petit rang affiché (0 = cube, 1 = barre, 2 = plaque, 3 = gros cube, ≥ 4 = jeton). */
export function Piece({ k, etiquette, taille = 1 }: { k: number; etiquette: string; taille?: number }) {
  const c = TEINTES[k % TEINTES.length]!;
  const s = taille;
  if (k === 0)
    return (
      <svg width={18 * s} height={18 * s} viewBox="0 0 18 18" aria-hidden>
        <rect x="1" y="1" width="16" height="16" rx="3" fill={c} stroke="#24304A" strokeWidth="1.5" />
        <rect x="3" y="3" width="6" height="4" rx="1.5" fill="#fff" opacity="0.5" />
      </svg>
    );
  if (k === 1)
    return (
      <svg width={14 * s} height={60 * s} viewBox="0 0 14 60" aria-hidden>
        <rect x="1" y="1" width="12" height="58" rx="3" fill={c} stroke="#24304A" strokeWidth="1.5" />
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1="1"
            x2="13"
            y1={1 + (i + 1) * 5.8}
            y2={1 + (i + 1) * 5.8}
            stroke="#24304A"
            strokeWidth="0.8"
            opacity="0.5"
          />
        ))}
      </svg>
    );
  if (k === 2)
    return (
      <svg width={52 * s} height={52 * s} viewBox="0 0 52 52" aria-hidden>
        <rect x="1" y="1" width="50" height="50" rx="4" fill={c} stroke="#24304A" strokeWidth="1.5" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} opacity="0.45">
            <line
              x1="1"
              x2="51"
              y1={1 + (i + 1) * 5}
              y2={1 + (i + 1) * 5}
              stroke="#24304A"
              strokeWidth="0.7"
            />
            <line
              y1="1"
              y2="51"
              x1={1 + (i + 1) * 5}
              x2={1 + (i + 1) * 5}
              stroke="#24304A"
              strokeWidth="0.7"
            />
          </g>
        ))}
      </svg>
    );
  if (k === 3)
    return (
      <svg width={58 * s} height={58 * s} viewBox="0 0 58 58" aria-hidden>
        <path
          d="M6 16 L 22 4 L 56 4 L 40 16 Z"
          fill="#fff"
          opacity="0.6"
          stroke="#24304A"
          strokeWidth="1.5"
        />
        <path
          d="M40 16 L 56 4 L 56 40 L 40 54 Z"
          fill={c}
          opacity="0.75"
          stroke="#24304A"
          strokeWidth="1.5"
        />
        <rect x="4" y="16" width="36" height="38" fill={c} stroke="#24304A" strokeWidth="1.5" />
      </svg>
    );
  return (
    <svg width={40 * s} height={40 * s} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill={c} stroke="#24304A" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontSize={etiquette.length > 6 ? 6.5 : etiquette.length > 4 ? 8 : 10}
        fontWeight="800"
        fill="#24304A"
        fontFamily="Baloo 2, sans-serif"
      >
        {etiquette}
      </text>
    </svg>
  );
}
