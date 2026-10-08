/** Petits graphiques SVG accessibles (sans dépendance) : temps de jeu par jour, barres de maîtrise. */

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

function jourCourt(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${JOURS[date.getDay()]} ${d}`;
}

/** Temps de jeu des derniers jours (barres verticales), avec la limite en pointillés. */
export function BarresJours({
  jours,
  limiteMin,
}: {
  jours: { day: string; ms: number }[];
  limiteMin: number | null;
}) {
  const minutes = jours.map((j) => Math.round(j.ms / 60_000));
  const max = Math.max(10, limiteMin ?? 0, ...minutes);
  const W = 560;
  const H = 200;
  const bas = 170;
  const haut = 24;
  const pas = W / jours.length;
  const largeur = Math.min(44, pas * 0.6);
  const y = (v: number) => bas - (v / max) * (bas - haut);
  const total = minutes.reduce((a, b) => a + b, 0);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Temps de jeu des ${jours.length} derniers jours : ${jours
          .map((j, i) => `${jourCourt(j.day)}, ${minutes[i]} minutes`)
          .join(' ; ')}.`}
      >
        <line x1={0} x2={W} y1={bas} y2={bas} stroke="rgb(var(--c-ink) / 0.25)" strokeWidth={1} />
        {limiteMin !== null && (
          <g>
            <line
              x1={0}
              x2={W}
              y1={y(limiteMin)}
              y2={y(limiteMin)}
              stroke="rgb(var(--c-coral-dark))"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
            <text x={W - 4} y={y(limiteMin) - 6} textAnchor="end" fontSize={13} fill="rgb(var(--c-ink-soft))">
              limite {limiteMin} min
            </text>
          </g>
        )}
        {jours.map((j, i) => {
          const v = minutes[i]!;
          const x = i * pas + (pas - largeur) / 2;
          const top = y(v);
          const aujourdhui = i === jours.length - 1;
          return (
            <g key={j.day}>
              <title>{`${jourCourt(j.day)} : ${v} min`}</title>
              {/* zone de survol plus large que la barre */}
              <rect x={i * pas} y={haut} width={pas} height={bas - haut} fill="transparent" />
              {v > 0 && (
                <path
                  d={`M${x},${bas} V${top + 4} q0,-4 4,-4 h${largeur - 8} q4,0 4,4 V${bas} Z`}
                  fill={aujourdhui ? 'rgb(var(--c-grape))' : 'rgb(var(--c-sky-dark))'}
                />
              )}
              <text
                x={x + largeur / 2}
                y={Math.min(top, bas) - 6}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="rgb(var(--c-ink))"
              >
                {v}
              </text>
              <text
                x={x + largeur / 2}
                y={bas + 20}
                textAnchor="middle"
                fontSize={13}
                fill="rgb(var(--c-ink-soft))"
              >
                {aujourdhui ? 'auj.' : jourCourt(j.day)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-sm text-ink-soft">
        Minutes de jeu par jour (parties en cours, hors pauses) · total sur la période : {total} min
      </figcaption>
    </figure>
  );
}

/** Barre horizontale de proportion (0..1), avec libellé et valeur en texte. */
export function BarreProportion({
  label,
  valeur,
  detail,
  couleur = 'rgb(var(--c-grass-dark))',
}: {
  label: string;
  valeur: number;
  detail?: string;
  couleur?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, valeur)) * 100);
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
      <span className="truncate font-bold" title={label}>
        {label}
      </span>
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="h-4 w-full"
        role="img"
        aria-label={`${label} : ${pct} %${detail ? `, ${detail}` : ''}`}
      >
        <rect x={0} y={0} width={100} height={10} rx={5} fill="rgb(var(--c-ink) / 0.1)" />
        {pct > 0 && <rect x={0} y={0} width={Math.max(pct, 2)} height={10} rx={5} fill={couleur} />}
      </svg>
      <span className="text-right text-sm">
        <strong>{pct} %</strong>
        {detail && <span className="block text-ink-soft sm:inline sm:pl-1">{detail}</span>}
      </span>
    </div>
  );
}
