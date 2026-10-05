/**
 * Progrès de fluence : les scores (MCLM) de l'enfant pour chaque texte, gardés sur l'appareil
 * (localStorage, jamais envoyés en ligne), et une petite courbe de progrès.
 */
const cle = (profil: string, texte: string) => `ludidactik.karaoke.${profil}.${texte}`;

export function lireProgres(profil: string, texte: string): number[] {
  try {
    const brut = localStorage.getItem(cle(profil, texte));
    const v: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)) : [];
  } catch {
    return [];
  }
}

export function ajouterProgres(profil: string, texte: string, mclm: number): number[] {
  const liste = [...lireProgres(profil, texte), mclm].slice(-12);
  try {
    localStorage.setItem(cle(profil, texte), JSON.stringify(liste));
  } catch {
    /* stockage plein ou interdit : tant pis, la courbe reste en mémoire */
  }
  return liste;
}

/** Courbe des dernières lectures, avec la ligne d'objectif. */
export function Courbe({ scores, objectif }: { scores: number[]; objectif: number }) {
  const pts = scores.slice(-8);
  if (!pts.length) return null;
  const max = Math.max(objectif * 1.25, ...pts, 10);
  const W = 260;
  const H = 110;
  const x = (i: number) => (pts.length === 1 ? W / 2 : 20 + (i * (W - 40)) / (pts.length - 1));
  const y = (v: number) => H - 14 - (v / max) * (H - 30);
  const meilleur = Math.max(...pts);
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-xs"
        role="img"
        aria-label={`Tes dernières lectures : ${pts.join(', ')} mots par minute. Meilleur score : ${meilleur}. Objectif : ${objectif}.`}
      >
        <rect width={W} height={H} rx="14" fill="rgb(var(--c-cream))" />
        <line x1="10" x2={W - 10} y1={y(objectif)} y2={y(objectif)} stroke="#7BD389" strokeWidth="2" strokeDasharray="6 5" />
        <text x={W - 12} y={y(objectif) - 5} textAnchor="end" fontSize="11" fill="#3E9E5A" fontWeight="700">
          objectif {objectif}
        </text>
        {pts.length > 1 && (
          <polyline
            points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            fill="none"
            stroke="#8E7CFF"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {pts.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={v === meilleur ? 6 : 4.5} fill={v === meilleur ? '#FFD45C' : '#8E7CFF'} stroke="#fff" strokeWidth="2" />
            {(i === pts.length - 1 || v === meilleur) && (
              <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize="11" fontWeight="800" fill="#24304A">
                {v}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="text-sm text-ink-soft">
        Ton meilleur score sur ce texte : <strong>{meilleur}</strong> mots par minute
      </figcaption>
    </figure>
  );
}
