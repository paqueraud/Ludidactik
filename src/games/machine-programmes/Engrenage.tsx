/** Un engrenage en SVG (dents arrondies), qui tourne quand la machine travaille. */
import { useReducedMotion } from 'framer-motion';

function cheminDents(n: number, rExt: number, rInt: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.25) / n) * Math.PI * 2;
    const a2 = ((i + 0.5) / n) * Math.PI * 2;
    const a3 = ((i + 0.75) / n) * Math.PI * 2;
    const p = (a: number, r: number) => `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
    pts.push(`${i === 0 ? 'M' : 'L'} ${p(a0, rInt)} L ${p(a1, rExt)} L ${p(a2, rExt)} L ${p(a3, rInt)}`);
  }
  return `${pts.join(' ')} Z`;
}

export function Engrenage({
  texte,
  couleur,
  tourne,
  sens = 1,
  taille = 92,
  actif = false,
}: {
  texte: string;
  couleur: string;
  tourne: boolean;
  sens?: 1 | -1;
  taille?: number;
  actif?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg
        viewBox="0 0 100 100"
        width={taille}
        height={taille}
        aria-hidden
        className={tourne && !reduce ? (sens > 0 ? 'animate-[spin_2.4s_linear_infinite]' : 'animate-[spin_2.4s_linear_infinite_reverse]') : ''}
      >
        <path d={cheminDents(10, 48, 39)} fill={couleur} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
        <circle cx="50" cy="50" r="30" fill="#fff" opacity="0.9" />
        <circle cx="50" cy="50" r="30" fill="none" stroke={actif ? '#8E7CFF' : 'rgb(0 0 0 / 0.15)'} strokeWidth={actif ? 5 : 2} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-titre text-xl font-extrabold text-ink sm:text-2xl">
        {texte}
      </span>
    </div>
  );
}
