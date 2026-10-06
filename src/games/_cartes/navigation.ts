/** Navigation au clavier sur une carte : d'une zone à sa voisine dans une direction. */
import type { ZoneCarte } from './types';

/** Zone voisine dans une direction (cône de ±60°), la plus proche. */
export function zoneVoisine(
  zones: Pick<ZoneCarte, 'id' | 'centre'>[],
  depuis: string,
  dir: 'gauche' | 'droite' | 'haut' | 'bas',
): string | null {
  const z0 = zones.find((z) => z.id === depuis);
  if (!z0) return zones[0]?.id ?? null;
  const [vx, vy] = { gauche: [-1, 0], droite: [1, 0], haut: [0, -1], bas: [0, 1] }[dir];
  let best: string | null = null;
  let bestScore = Infinity;
  for (const z of zones) {
    if (z.id === z0.id) continue;
    const dx = z.centre[0] - z0.centre[0];
    const dy = z.centre[1] - z0.centre[1];
    const dist = Math.hypot(dx, dy);
    if (dist === 0) continue;
    const cos = (dx * vx! + dy * vy!) / dist;
    if (cos < 0.5) continue;
    const score = dist * (2 - cos);
    if (score < bestScore) {
      bestScore = score;
      best = z.id;
    }
  }
  return best;
}
