/** Saisie d'une position sur une demi-droite graduée (doigt / souris). */
import { type PointerEvent, type RefObject, useRef } from 'react';
import type { NumberLineItem } from '@/content/schemas';
import { X0, X1, aimanter, depuisX } from './droite';

/**
 * Saisie d'une position au doigt / à la souris sur un SVG de viewBox 1000 de large.
 * Renvoie les gestionnaires à poser sur le <svg>.
 */
export function useSaisieDroite(
  svg: RefObject<SVGSVGElement | null>,
  item: NumberLineItem,
  pas: number,
  actif: boolean,
  onChange: (v: number) => void,
) {
  const appuye = useRef(false);
  const lire = (e: PointerEvent) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 1000;
    onChange(aimanter(item, depuisX(item, Math.max(X0, Math.min(X1, x))), pas));
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      if (!actif) return;
      appuye.current = true;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      lire(e);
    },
    onPointerMove: (e: PointerEvent) => {
      if (actif && appuye.current) lire(e);
    },
    onPointerUp: () => {
      appuye.current = false;
    },
    onPointerCancel: () => {
      appuye.current = false;
    },
  };
}
