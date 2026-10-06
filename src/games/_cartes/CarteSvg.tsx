/**
 * Carte SVG cliquable et accessible.
 * - Tactile / souris : toucher une zone (les petits territoires ont un cercle de touche, les fleuves
 *   une large bande invisible).
 * - Clavier : Tab parcourt les zones, les flèches sautent à la zone voisine dans la direction
 *   choisie, Entrée ou Espace valide. Chaque zone a un libellé accessible (son nom).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { type KeyboardEvent, type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { zoneVoisine } from './navigation';
import type { Carte, ZoneCarte } from './types';

export type EtatZone = 'juste' | 'faux' | 'trouve' | 'indice';

const COULEUR_ETAT: Record<EtatZone, string> = {
  juste: '#7BD389',
  faux: '#FF9A8E',
  trouve: '#A8E3B2',
  indice: '#FFD45C',
};
const FLEUVE = '#2F86D6';

export function CarteSvg({
  carte,
  etats = {},
  etiquettes,
  onChoisir,
  onFond,
  desactive = false,
  children,
  className = '',
}: {
  carte: Carte;
  etats?: Record<string, EtatZone | undefined>;
  /** Zones dont le nom est écrit sur la carte. */
  etiquettes?: ReadonlySet<string>;
  onChoisir?: (id: string) => void;
  /** Toucher en dehors de toute zone (mer, pays de décor). */
  onFond?: () => void;
  desactive?: boolean;
  /** Éléments superposés (véhicule…), en coordonnées de la carte. */
  children?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const refs = useRef(new Map<string, SVGGElement>());
  const [focus, setFocus] = useState<string | null>(null);

  const ordre = useMemo(() => {
    const dessous = new Set(carte.dessous ?? []);
    const rang = (z: ZoneCarte) => (dessous.has(z.id) ? 0 : z.forme === 'surface' ? 1 : 2);
    return [...carte.zones].sort((a, b) => rang(a) - rang(b));
  }, [carte]);

  const choisir = useCallback(
    (id: string) => {
      if (!desactive) onChoisir?.(id);
    },
    [desactive, onChoisir],
  );

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      choisir(id);
      return;
    }
    const dir = ({ ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas' } as const)[
      e.key as 'ArrowLeft'
    ];
    if (!dir) return;
    e.preventDefault();
    const v = zoneVoisine(carte.zones, id, dir);
    if (v) refs.current.get(v)?.focus();
  };

  const tailleTexte = carte.largeur / 42;
  const traitZone = carte.largeur / 700;

  return (
    <svg
      viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`}
      className={`block h-auto w-full select-none ${className}`}
      role="group"
      aria-label={carte.titre}
    >
      {carte.motif === 'montagnes' && (
        <defs>
          <pattern id={`motif-${carte.id}`} width="34" height="26" patternUnits="userSpaceOnUse">
            <path d="M2 22 L11 8 L20 22 Z M16 22 L24 11 L32 22 Z" fill="#B8865A" opacity="0.55" />
            <path d="M9 11 L11 8 L13 11 Z M22 14 L24 11 L26 14 Z" fill="#FFFFFF" opacity="0.9" />
          </pattern>
        </defs>
      )}
      <rect
        width={carte.largeur}
        height={carte.hauteur}
        fill={carte.mer}
        onClick={() => !desactive && onFond?.()}
      />
      {carte.decor
        .filter((d) => !d.dessus)
        .map((d, i) => (
          <path
            key={`d${i}`}
            d={d.d}
            fill={d.fill}
            stroke={d.stroke ?? 'none'}
            strokeWidth={d.strokeWidth ?? 0}
            strokeLinejoin="round"
            opacity={d.opacity}
            pointerEvents="none"
          />
        ))}
      {(carte.encarts?.length ?? 0) > 1 && (
        <text
          x={carte.encarts![0]!.x + 2}
          y={carte.encarts![0]!.y - 8}
          fontSize={14}
          fontWeight={700}
          fill="#24304A"
          fontFamily="Andika, system-ui, sans-serif"
          pointerEvents="none"
        >
          Outre-mer (pas à la même échelle)
        </text>
      )}
      {carte.encarts?.map((e) => (
        <g key={`e-${e.titre}`} pointerEvents="none">
          <rect
            x={e.x}
            y={e.y}
            width={e.w}
            height={e.h}
            rx={12}
            fill="#F4FBFF"
            stroke="#FFFFFF"
            strokeWidth={3}
          />
          <text
            x={e.x + 10}
            y={e.y + 18}
            fontSize={15}
            fontWeight={700}
            fill="#24304A"
            fontFamily="Andika, system-ui, sans-serif"
          >
            {e.titre}
          </text>
        </g>
      ))}

      {ordre.map((z) => {
        const etat = etats[z.id];
        const estFocus = focus === z.id;
        const ocean = carte.dessous?.includes(z.id);
        // au clavier, la zone sélectionnée s'éclaire (visible même pour un océan sous les continents)
        const fill = etat ? COULEUR_ETAT[etat] : estFocus ? '#FFE89A' : (z.couleur ?? carte.terre);
        const clignote = etat === 'indice' && !reduce && !desactive;
        return (
          <g
            key={z.id}
            ref={(el) => {
              if (el) refs.current.set(z.id, el);
              else refs.current.delete(z.id);
            }}
            role="button"
            tabIndex={desactive ? -1 : 0}
            aria-label={z.nom}
            aria-disabled={desactive || undefined}
            data-zone={z.id}
            className={`outline-none ${desactive ? '' : 'cursor-pointer hover:opacity-80'}`}
            onClick={(e) => {
              // au toucher / à la souris, pas de contour de focus (réservé au clavier)
              (e.currentTarget as SVGGElement).blur();
              choisir(z.id);
            }}
            onKeyDown={(e) => onKey(e, z.id)}
            onFocus={() => setFocus(z.id)}
            onBlur={() => setFocus((f) => (f === z.id ? null : f))}
          >
            {z.forme === 'surface' ? (
              <>
                <motion.path
                  d={z.d}
                  fill={fill}
                  stroke={estFocus ? '#24304A' : ocean ? 'rgba(255,255,255,0.7)' : '#FFFFFF'}
                  strokeWidth={estFocus ? traitZone * 4 : traitZone * (ocean ? 1 : 1.6)}
                  strokeDasharray={ocean && !estFocus ? `${traitZone * 6} ${traitZone * 5}` : undefined}
                  strokeLinejoin="round"
                  animate={clignote ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
                  transition={clignote ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                />
                {carte.motif && <path d={z.d} fill={`url(#motif-${carte.id})`} pointerEvents="none" />}
                {z.rayonTouche && (
                  <circle
                    cx={z.centre[0]}
                    cy={z.centre[1]}
                    r={z.rayonTouche}
                    fill={etat ? fill : 'rgba(255,255,255,0.01)'}
                    fillOpacity={etat ? 0.5 : 1}
                    stroke={estFocus ? '#24304A' : '#5B6B8C'}
                    strokeWidth={traitZone * (estFocus ? 3 : 1.2)}
                    strokeDasharray={`${traitZone * 3} ${traitZone * 3}`}
                  />
                )}
                {z.rayonTouche && (
                  // point bien visible pour les très petits territoires (Malte…)
                  <circle
                    cx={z.centre[0]}
                    cy={z.centre[1]}
                    r={Math.max(2.5, z.rayonTouche / 4)}
                    fill={fill}
                    stroke="#24304A"
                    strokeWidth={traitZone}
                    pointerEvents="none"
                  />
                )}
              </>
            ) : (
              <>
                {/* bande de touche invisible */}
                <path
                  d={z.d}
                  fill="none"
                  stroke="rgba(255,255,255,0.01)"
                  strokeWidth={carte.largeur / 26}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {estFocus && (
                  <path
                    d={z.d}
                    fill="none"
                    stroke="#24304A"
                    strokeWidth={traitZone * 14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.35}
                  />
                )}
                <motion.path
                  d={z.d}
                  fill="none"
                  stroke={
                    etat ? (etat === 'faux' ? '#E2574C' : etat === 'indice' ? '#E0A400' : '#2E8C48') : FLEUVE
                  }
                  strokeWidth={traitZone * (etat ? 8 : 6)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={clignote ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                  transition={clignote ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                />
              </>
            )}
          </g>
        );
      })}

      {carte.decor
        .filter((d) => d.dessus)
        .map((d, i) => (
          <path
            key={`dd${i}`}
            d={d.d}
            fill={d.fill}
            stroke={d.stroke ?? 'none'}
            strokeWidth={d.strokeWidth ?? 0}
            pointerEvents="none"
          />
        ))}

      {/* Étiquettes (zones trouvées) */}
      {carte.zones
        .filter((z) => etiquettes?.has(z.id))
        .map((z) => (
          <text
            key={`t-${z.id}`}
            x={z.centre[0]}
            y={z.centre[1]}
            fontSize={tailleTexte}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#24304A"
            stroke="#FFFFFF"
            strokeWidth={tailleTexte / 4}
            paintOrder="stroke"
            pointerEvents="none"
            fontFamily="'Baloo 2', system-ui, sans-serif"
          >
            {z.nom}
          </text>
        ))}

      {children}
    </svg>
  );
}
