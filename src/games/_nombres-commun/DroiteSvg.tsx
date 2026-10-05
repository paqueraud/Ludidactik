/** Dessin d'une demi-droite graduée dans un SVG de 1000 de large + saisie au doigt / à la souris. */
import type { Level, NumberLineItem } from '@/content/schemas';
import { X0, X1, ecrire, etiquetees, graduations, versX } from './droite';

export function DroiteSvg({
  item,
  level,
  y,
  couleur = '#24304A',
  sousGraduations = true,
  epaisseur = 6,
  trait = true,
  etiquettesEn = 'bas',
}: {
  item: NumberLineItem;
  level: Level;
  y: number;
  couleur?: string;
  sousGraduations?: boolean;
  epaisseur?: number;
  /** Dessiner la ligne elle-même (sinon seulement les graduations : la corde du funambule est déjà là). */
  trait?: boolean;
  etiquettesEn?: 'haut' | 'bas';
}) {
  const { principales, secondaires } = graduations(item);
  const labels = etiquetees(item, level);
  // Beaucoup d'étiquettes : deux rangées pour qu'elles restent lisibles sur téléphone.
  const decaler = labels.size > 6;
  const contour = couleur.toUpperCase() === '#FFFFFF' ? '#24304A' : '#FFFFFF';
  const dy = etiquettesEn === 'bas' ? 1 : -1;
  return (
    <g aria-hidden>
      {trait && (
        <line
          x1={X0 - 20}
          x2={X1 + 20}
          y1={y}
          y2={y}
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
        />
      )}
      {sousGraduations &&
        secondaires.map((v) => (
          <line
            key={`s${v}`}
            x1={versX(item, v)}
            x2={versX(item, v)}
            y1={y - 9}
            y2={y + 9}
            stroke={couleur}
            strokeWidth="2.5"
            opacity="0.75"
          />
        ))}
      {principales.map((v, i) => (
        <g key={`p${v}`}>
          <line
            x1={versX(item, v)}
            x2={versX(item, v)}
            y1={y - 18}
            y2={y + 18}
            stroke={couleur}
            strokeWidth="5"
          />
          {labels.has(v) && (
            <text
              x={versX(item, v)}
              y={y + dy * (58 + (decaler && i % 2 ? 42 : 0)) + (dy > 0 ? 0 : 12)}
              textAnchor="middle"
              fontSize="44"
              fontWeight="800"
              fill={couleur}
              fontFamily="Baloo 2, sans-serif"
              stroke={contour}
              strokeWidth="8"
              paintOrder="stroke"
            >
              {ecrire({ ...item, display: '' }, v)}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
