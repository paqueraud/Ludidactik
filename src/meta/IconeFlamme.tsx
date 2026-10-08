/** Flamme de série : icône dessinée (vive si un défi est réussi aujourd'hui, douce sinon). */
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useFlamme } from '@/services/meta';

export function IconeFlamme({
  size = 28,
  vive = true,
  gelee = false,
}: {
  size?: number;
  vive?: boolean;
  gelee?: boolean;
}) {
  const reduce = useReducedMotion();
  const ext = gelee ? '#9AD8F5' : vive ? '#FF7A3D' : '#FFB98F';
  const int = gelee ? '#E3F6FF' : vive ? '#FFD45C' : '#FFE7B0';
  return (
    <motion.svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      animate={vive && !reduce ? { scaleY: [1, 1.08, 1], rotate: [0, -2, 2, 0] } : undefined}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ originY: 1 }}
    >
      <path
        d="M16 2 C18 9 26 12 26 20 C26 26.5 21.5 30 16 30 C10.5 30 6 26.5 6 20 C6 15 9 12 11 9 C11.5 13 13 14.5 14.5 15 C14 10 15 6 16 2 Z"
        fill={ext}
      />
      <path
        d="M16 14 C17.5 18 21 19.5 21 23.5 C21 26.5 18.8 28.5 16 28.5 C13.2 28.5 11 26.5 11 23.5 C11 20.5 13.5 18.5 16 14 Z"
        fill={int}
      />
      {gelee && (
        <path
          d="M16 18 L16 27 M12 22.5 L20 22.5 M13 19.5 L19 25.5 M19 19.5 L13 25.5"
          stroke="#4FC3F7"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </motion.svg>
  );
}

/** Pastille de la barre du haut : 🔥 n jours (lien vers les défis du jour). */
export function PastilleFlamme({ profileId }: { profileId: string }) {
  const f = useFlamme(profileId);
  if (!f) return null;
  const label =
    f.jours === 0
      ? 'Flamme : réussis un défi du jour pour l’allumer'
      : `Flamme : ${f.jours} jour${f.jours > 1 ? 's' : ''} de défis${f.aujourdhui ? '' : ', pas encore de défi aujourd’hui'}`;
  return (
    <Link
      to="/defis"
      className="flex h-12 shrink-0 items-center gap-0.5 rounded-full bg-cream pl-1.5 pr-3 font-titre text-lg font-extrabold hover:bg-cream-deep"
      aria-label={label}
      title={label}
    >
      <IconeFlamme size={30} vive={f.aujourdhui} />
      {f.jours}
    </Link>
  );
}
