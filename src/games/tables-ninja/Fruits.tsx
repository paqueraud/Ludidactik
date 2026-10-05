/** Fruits vectoriels originaux (style doux, ombres colorées) et « fruit piégé » qui fait pouf. */
import { type Fruit, JUS } from './fruits-data';

/** Fruit entier (viewBox 100×100). */
export function FruitSvg({ fruit, size }: { fruit: Fruit; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {fruit === 'pasteque' && (
        <>
          <ellipse cx="50" cy="52" rx="44" ry="38" fill="#3E9B45" />
          {[-24, -8, 8, 24].map((dx) => (
            <path
              key={dx}
              d={`M${50 + dx} 16 C ${50 + dx * 1.5} 40 ${50 + dx * 1.5} 64 ${50 + dx} 88`}
              stroke="#2B7A33"
              strokeWidth="6"
              fill="none"
            />
          ))}
          <ellipse cx="34" cy="34" rx="12" ry="7" fill="#fff" opacity="0.25" />
        </>
      )}
      {fruit === 'orange' && (
        <>
          <circle cx="50" cy="52" r="40" fill="#FF9F1C" />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={30 + ((i * 17) % 40)} cy={34 + ((i * 23) % 38)} r="1.6" fill="#E07F00" />
          ))}
          <path d="M50 12 q 10 -8 18 -2 q -8 8 -18 2" fill="#4CAF50" />
          <ellipse cx="34" cy="34" rx="11" ry="7" fill="#fff" opacity="0.3" />
        </>
      )}
      {fruit === 'pomme' && (
        <>
          <path
            d="M50 26 C 30 10 6 26 10 54 C 14 80 32 94 50 86 C 68 94 86 80 90 54 C 94 26 70 10 50 26 Z"
            fill="#F0453A"
          />
          <path
            d="M50 26 q -2 -12 4 -18"
            stroke="#6D4C2F"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M56 14 q 14 -10 22 0 q -12 8 -22 0" fill="#5DBB4A" />
          <ellipse cx="30" cy="40" rx="8" ry="12" fill="#fff" opacity="0.3" />
        </>
      )}
      {fruit === 'citron' && (
        <>
          <path
            d="M8 52 C 8 30 30 14 50 14 C 70 14 92 30 92 52 C 92 74 70 90 50 90 C 30 90 8 74 8 52 Z"
            fill="#FFE04A"
          />
          <circle cx="8" cy="52" r="5" fill="#F5C800" />
          <circle cx="92" cy="52" r="5" fill="#F5C800" />
          <ellipse cx="34" cy="34" rx="12" ry="6" fill="#fff" opacity="0.4" />
        </>
      )}
      {fruit === 'prune' && (
        <>
          <ellipse cx="50" cy="54" rx="36" ry="38" fill="#8E44C4" />
          <path d="M50 18 C 44 40 44 70 50 92" stroke="#6E2FA0" strokeWidth="3" fill="none" />
          <path
            d="M50 18 q 4 -10 12 -12"
            stroke="#6D4C2F"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="34" cy="38" rx="8" ry="12" fill="#fff" opacity="0.28" />
        </>
      )}
      {fruit === 'kiwi' && (
        <>
          <ellipse cx="50" cy="52" rx="40" ry="34" fill="#9C6B3E" />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M${20 + ((i * 13) % 60)} ${30 + ((i * 19) % 40)} l 3 2`}
              stroke="#7A5230"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <ellipse cx="34" cy="36" rx="10" ry="6" fill="#fff" opacity="0.2" />
        </>
      )}
    </svg>
  );
}

/** Moitié de fruit tranché (intérieur visible). `cote` = 'g' ou 'd'. */
export function DemiFruit({ fruit, size, cote }: { fruit: Fruit; size: number; cote: 'g' | 'd' }) {
  const chair = JUS[fruit];
  const peau: Record<Fruit, string> = {
    pasteque: '#3E9B45',
    orange: '#FF9F1C',
    pomme: '#F0453A',
    citron: '#FFE04A',
    prune: '#8E44C4',
    kiwi: '#9C6B3E',
  };
  const d = cote === 'g' ? 'M50 10 A 40 40 0 0 0 50 90 Z' : 'M50 10 A 40 40 0 0 1 50 90 Z';
  const dChair = cote === 'g' ? 'M50 16 A 34 34 0 0 0 50 84 Z' : 'M50 16 A 34 34 0 0 1 50 84 Z';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d={d} fill={peau[fruit]} />
      <path d={dChair} fill={chair} />
      {fruit === 'pasteque' &&
        [30, 50, 70].map((y) => (
          <ellipse key={y} cx={cote === 'g' ? 40 : 60} cy={y} rx="2" ry="3.5" fill="#222" />
        ))}
      {fruit === 'kiwi' && <ellipse cx="50" cy="50" rx="4" ry="12" fill="#F4F7D0" />}
    </svg>
  );
}

/** Fruit piégé : une petite bombe de dessin animé qui fait « pouf » (fumée, aucun danger). */
export function Pouf({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {[
        [30, 40, 22],
        [60, 34, 24],
        [48, 60, 26],
        [72, 62, 18],
        [24, 66, 16],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#C9D2E0" opacity="0.9" />
      ))}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="#24304A"
        fontFamily="Baloo 2, sans-serif"
      >
        Pouf !
      </text>
    </svg>
  );
}
