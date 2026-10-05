import { memo, useId } from 'react';
import type { AvatarConfig, Compagnon } from './parts';

export type Humeur = 'normal' | 'joie' | 'inquiet';

interface Props {
  config: AvatarConfig;
  size?: number;
  /** Affiche le compagnon animal en bas à droite. */
  compagnon?: boolean;
  /** Pastille de fond colorée. */
  fond?: string | null;
  humeur?: Humeur;
  className?: string;
  title?: string;
}

const INK = '#24304A';

function hairBack(c: AvatarConfig) {
  const col = c.couleurCheveux;
  switch (c.coiffure) {
    case 'longue':
      return <path d="M42 92 C38 40 162 40 158 92 L162 170 C130 182 70 182 38 170 Z" fill={col} />;
    case 'couettes':
      return (
        <g fill={col}>
          <circle cx="40" cy="118" r="22" />
          <circle cx="160" cy="118" r="22" />
        </g>
      );
    case 'chignon':
      return <circle cx="100" cy="34" r="24" fill={col} />;
    case 'afro':
      return <circle cx="100" cy="82" r="74" fill={col} />;
    default:
      return null;
  }
}

function hairFront(c: AvatarConfig) {
  const col = c.couleurCheveux;
  switch (c.coiffure) {
    case 'courte':
    case 'longue':
    case 'couettes':
    case 'chignon':
      return <path d="M46 92 C42 38 158 38 154 92 C144 70 124 58 104 62 C86 56 62 66 46 92 Z" fill={col} />;
    case 'herisse':
      return (
        <path
          d="M46 90 L44 58 L62 66 L66 40 L82 56 L92 30 L104 52 L118 30 L124 56 L140 42 L140 66 L158 60 L154 90 C140 68 120 60 100 62 C80 60 60 68 46 90 Z"
          fill={col}
        />
      );
    case 'boucles':
      return (
        <g fill={col}>
          {[
            [52, 76],
            [62, 56],
            [80, 44],
            [100, 40],
            [120, 44],
            [138, 56],
            [148, 76],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="16" />
          ))}
        </g>
      );
    case 'afro':
      return <path d="M52 80 C60 52 140 52 148 80 C130 70 70 70 52 80 Z" fill={col} />;
    case 'rasee':
      return <path d="M48 88 C46 44 154 44 152 88 C130 70 70 70 48 88 Z" fill={col} opacity="0.45" />;
  }
}

function face(c: AvatarConfig) {
  switch (c.visage) {
    case 'ovale':
      return <ellipse cx="100" cy="96" rx="48" ry="56" fill={c.teint} />;
    case 'doux':
      return <path d="M52 80 C52 44 148 44 148 80 L146 112 C142 146 58 146 54 112 Z" fill={c.teint} />;
    default:
      return <circle cx="100" cy="96" r="52" fill={c.teint} />;
  }
}

function eyes(c: AvatarConfig, humeur: Humeur) {
  const style = humeur === 'joie' ? 'rieurs' : c.yeux;
  const pair = (render: (x: number) => JSX.Element) => (
    <g>
      {render(80)}
      {render(120)}
    </g>
  );
  switch (style) {
    case 'rieurs':
      return pair((x) => (
        <path
          key={x}
          d={`M${x - 9} 96 Q${x} 84 ${x + 9} 96`}
          stroke={INK}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      ));
    case 'etoiles':
      return pair((x) => (
        <path
          key={x}
          d={`M${x} 82 L${x + 3.5} 90 L${x + 12} 91 L${x + 5.5} 96.5 L${x + 7.5} 105 L${x} 100.5 L${x - 7.5} 105 L${x - 5.5} 96.5 L${x - 12} 91 L${x - 3.5} 90 Z`}
          fill={INK}
        />
      ));
    case 'malins':
      return pair((x) => (
        <g key={x}>
          <circle cx={x} cy="94" r="6" fill={INK} />
          <path d={`M${x - 10} 88 L${x + 10} 86`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </g>
      ));
    default:
      return pair((x) => (
        <g key={x}>
          <ellipse cx={x} cy="93" rx="9" ry="10" fill="#fff" />
          <circle cx={x + 1} cy="94" r="5.5" fill={INK} />
          <circle cx={x + 3} cy="91" r="2" fill="#fff" />
        </g>
      ));
  }
}

function mouth(c: AvatarConfig, humeur: Humeur) {
  const style = humeur === 'inquiet' ? 'o' : humeur === 'joie' ? 'grand' : c.bouche;
  switch (style) {
    case 'grand':
      return (
        <g>
          <path d="M84 116 Q100 140 116 116 Z" fill="#7A2E2E" />
          <path d="M92 128 Q100 134 108 128 Q100 122 92 128 Z" fill="#FF8FA3" />
        </g>
      );
    case 'langue':
      return (
        <g>
          <path d="M86 118 Q100 130 114 118" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M98 123 Q104 136 110 122 Z" fill="#FF8FA3" />
        </g>
      );
    case 'o':
      return <ellipse cx="100" cy="123" rx="6" ry="8" fill="#7A2E2E" />;
    default:
      return (
        <path d="M86 118 Q100 132 114 118" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      );
  }
}

function accessory(c: AvatarConfig) {
  switch (c.accessoire) {
    case 'lunettes':
      return (
        <g stroke={INK} strokeWidth="4" fill="rgba(255,255,255,0.25)">
          <circle cx="80" cy="94" r="14" />
          <circle cx="120" cy="94" r="14" />
          <path d="M94 92 Q100 88 106 92" fill="none" />
        </g>
      );
    case 'casquette':
      return (
        <g>
          <path d="M48 76 C48 34 152 34 152 76 Z" fill="#FF7A6B" />
          <path d="M120 72 C150 66 176 70 178 78 C160 80 136 80 120 78 Z" fill="#E0503F" />
          <circle cx="100" cy="40" r="5" fill="#E0503F" />
        </g>
      );
    case 'noeud':
      return (
        <g fill="#EC407A">
          <path d="M126 48 L146 36 L146 64 Z" />
          <path d="M166 48 L146 36 L146 64 Z" />
          <circle cx="146" cy="50" r="6" fill="#F48FB1" />
        </g>
      );
    case 'couronne':
      return (
        <g>
          <path
            d="M64 56 L70 22 L86 42 L100 16 L114 42 L130 22 L136 56 Z"
            fill="#FFD45C"
            stroke="#D69600"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="44" r="5" fill="#FF7A6B" />
        </g>
      );
    case 'bonnet_phrygien':
      return (
        <g>
          <path
            d="M48 78 C40 30 120 10 156 40 C170 52 168 70 150 62 C152 70 152 74 152 78 Z"
            fill="#D7372F"
          />
          <circle cx="66" cy="70" r="9" fill="#1E4FB8" />
          <circle cx="66" cy="70" r="6" fill="#fff" />
          <circle cx="66" cy="70" r="3" fill="#D7372F" />
        </g>
      );
    case 'casque_alpi':
      return (
        <g>
          <path d="M46 78 C46 30 154 30 154 78 Z" fill="#FFB300" />
          <rect x="90" y="40" width="20" height="14" rx="4" fill="#fff" stroke="#24304A" strokeWidth="2" />
          <circle cx="100" cy="47" r="4" fill="#FFF59D" />
        </g>
      );
    default:
      return null;
  }
}

/** Petit compagnon dessiné dans un carré de 50 px. */
export function CompanionSvg({
  type,
  x = 0,
  y = 0,
  s = 1,
}: {
  type: Compagnon;
  x?: number;
  y?: number;
  s?: number;
}) {
  if (type === 'aucun') return null;
  const t = `translate(${x} ${y}) scale(${s})`;
  const eyesSmall = (
    <g fill={INK}>
      <circle cx="18" cy="28" r="3" />
      <circle cx="32" cy="28" r="3" />
    </g>
  );
  switch (type) {
    case 'chat':
      return (
        <g transform={t}>
          <path d="M8 16 L12 2 L22 12 L28 12 L38 2 L42 16 Z" fill="#9E9E9E" />
          <circle cx="25" cy="28" r="18" fill="#9E9E9E" />
          {eyesSmall}
          <path d="M23 34 L27 34 L25 37 Z" fill="#FF8FA3" />
          <path d="M6 32 L16 33 M6 37 L16 35 M44 32 L34 33 M44 37 L34 35" stroke={INK} strokeWidth="1.2" />
        </g>
      );
    case 'renard':
      return (
        <g transform={t}>
          <path d="M6 10 L16 22 L34 22 L44 10 L40 30 C36 46 14 46 10 30 Z" fill="#FF8A3D" />
          <path d="M12 30 C16 44 34 44 38 30 C32 36 18 36 12 30 Z" fill="#fff" />
          {eyesSmall}
          <circle cx="25" cy="38" r="2.5" fill={INK} />
        </g>
      );
    case 'dragon':
      return (
        <g transform={t}>
          <path
            d="M12 12 L16 2 L20 12 M30 12 L34 2 L38 12"
            fill="#FFD45C"
            stroke="#D69600"
            strokeWidth="1.5"
          />
          <circle cx="25" cy="28" r="18" fill="#4CAF50" />
          <ellipse cx="25" cy="36" rx="10" ry="6" fill="#81C784" />
          {eyesSmall}
          <circle cx="21" cy="36" r="1.5" fill={INK} />
          <circle cx="29" cy="36" r="1.5" fill={INK} />
        </g>
      );
    case 'robot':
      return (
        <g transform={t}>
          <path d="M25 10 L25 2" stroke={INK} strokeWidth="2" />
          <circle cx="25" cy="2" r="3" fill="#FF7A6B" />
          <rect x="8" y="10" width="34" height="32" rx="8" fill="#B0BEC5" />
          <rect x="13" y="20" width="24" height="10" rx="5" fill="#24304A" />
          <circle cx="19" cy="25" r="3" fill="#4FC3F7" />
          <circle cx="31" cy="25" r="3" fill="#4FC3F7" />
          <path d="M18 36 L32 36" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'lapin':
      return (
        <g transform={t}>
          <ellipse cx="17" cy="8" rx="5" ry="12" fill="#F5F5F5" stroke="#E0E0E0" />
          <ellipse cx="33" cy="8" rx="5" ry="12" fill="#F5F5F5" stroke="#E0E0E0" />
          <circle cx="25" cy="30" r="16" fill="#F5F5F5" stroke="#E0E0E0" />
          {eyesSmall}
          <path d="M23 35 L27 35 L25 38 Z" fill="#FF8FA3" />
        </g>
      );
  }
}

/** Avatar composable de l'enfant (buste + compagnon). */
export const Avatar = memo(function Avatar({
  config,
  size = 96,
  compagnon = true,
  fond = null,
  humeur = 'normal',
  className,
  title,
}: Props) {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? 'Avatar'}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      {fond && <circle cx="100" cy="100" r="100" fill={fond} />}
      <g clipPath={fond ? `url(#${clipId})` : undefined}>
        {hairBack(config)}
        {/* buste */}
        <path d="M34 200 C34 160 60 146 100 146 C140 146 166 160 166 200 Z" fill={config.haut} />
        <path d="M86 146 L100 162 L114 146 Z" fill="rgba(0,0,0,0.12)" />
        <rect x="88" y="132" width="24" height="20" rx="8" fill={config.teint} />
        {/* oreilles */}
        <circle cx="50" cy="98" r="10" fill={config.teint} />
        <circle cx="150" cy="98" r="10" fill={config.teint} />
        {face(config)}
        <circle cx="70" cy="112" r="8" fill="#FF7A6B" opacity="0.28" />
        <circle cx="130" cy="112" r="8" fill="#FF7A6B" opacity="0.28" />
        {eyes(config, humeur)}
        {mouth(config, humeur)}
        {hairFront(config)}
        {accessory(config)}
        {humeur === 'inquiet' && (
          <path d="M152 70 C148 80 146 84 150 88 C156 90 160 84 152 70 Z" fill="#4FC3F7" />
        )}
      </g>
      {compagnon && <CompanionSvg type={config.compagnon} x={146} y={146} s={1} />}
    </svg>
  );
});
