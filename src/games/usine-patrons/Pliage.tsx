/**
 * Pliage d'un patron en pseudo-3D (transformations CSS 3D) : chaque face est imbriquée dans la face
 * à laquelle elle est attachée et tourne d'un quart de tour autour de leur côté commun.
 * `t` va de 0 (patron à plat) à 1 (solide fermé).
 */
import type { CSSProperties } from 'react';
import { type Noeud, type Rect, arbrePliage } from '../_geometrie-commun/patron';

const COULEURS = ['#4FC3F7', '#FFD45C', '#7BD389', '#FF7A6B', '#8E7CFF', '#E0A458', '#1AB1AA', '#F28FB8'];

function Face({
  n,
  parent,
  t,
  U,
  marquees,
}: {
  n: Noeud;
  parent: Rect | null;
  t: number;
  U: number;
  marquees: Set<number>;
}) {
  const r = n.rect;
  const a = 90 * t;
  const transfo: Record<string, [string, string]> = {
    haut: ['50% 100%', `rotateX(${-a}deg)`],
    bas: ['50% 0%', `rotateX(${a}deg)`],
    gauche: ['100% 50%', `rotateY(${a}deg)`],
    droite: ['0% 50%', `rotateY(${-a}deg)`],
  };
  const [origine, rot] = n.cote ? transfo[n.cote]! : ['50% 50%', 'none'];
  const marquee = marquees.has(n.i);
  const style: CSSProperties = {
    position: 'absolute',
    left: parent ? (r.x - parent.x) * U : 0,
    top: parent ? (r.y - parent.y) * U : 0,
    width: r.w * U,
    height: r.h * U,
    transformOrigin: origine,
    transform: rot,
    transformStyle: 'preserve-3d',
    background: marquee ? '#FF7A6B' : COULEURS[n.i % COULEURS.length],
    border: `3px solid ${marquee ? '#CD3E30' : '#24304A'}`,
    borderRadius: 3,
    boxSizing: 'border-box',
    backgroundImage:
      'linear-gradient(to right, rgba(36,48,74,0.28) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(36,48,74,0.28) 1.5px, transparent 1.5px)',
    backgroundSize: `${U}px ${U}px`,
    backgroundPosition: '-3px -3px',
    // (pas d'opacité < 1 : elle aplatirait la 3D)
  };
  return (
    <div style={style}>
      {marquee && t > 0.9 && (
        <span className="absolute inset-0 flex items-center justify-center font-titre text-2xl font-extrabold text-white">
          !
        </span>
      )}
      {n.enfants.map((e) => (
        <Face key={e.i} n={e} parent={r} t={t} U={U} marquees={marquees} />
      ))}
    </div>
  );
}

export function Pliage({
  rects,
  t,
  marquees = new Set(),
  taille = 300,
  label,
}: {
  rects: Rect[];
  t: number;
  /** Faces à signaler (elles se superposent à une autre une fois pliées). */
  marquees?: Set<number>;
  taille?: number;
  label: string;
}) {
  const arbre = arbrePliage(rects);
  if (!arbre) return null;
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const U = Math.floor(taille / Math.max(maxX - minX, maxY - minY, 4));
  const W = (maxX - minX) * U;
  const H = (maxY - minY) * U;
  const tilt = Math.min(1, t * 1.6);
  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: '100%', height: taille + 40, perspective: 1000 }}
      role="img"
      aria-label={label}
    >
      <div
        style={{
          position: 'relative',
          width: W,
          height: H,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${48 * tilt}deg) rotateZ(${-28 * tilt}deg) scale(${1 - 0.15 * tilt})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: (arbre.rect.x - minX) * U,
            top: (arbre.rect.y - minY) * U,
            transformStyle: 'preserve-3d',
          }}
        >
          <Face n={arbre} parent={null} t={t} U={U} marquees={marquees} />
        </div>
      </div>
    </div>
  );
}
