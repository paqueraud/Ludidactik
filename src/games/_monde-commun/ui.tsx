/** Petits composants communs aux jeux n° 50 à 56. */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export { EtatVide } from '../_calcul-commun/ui';

/** Barre de temps qui se vide (couleur qui passe au corail à la fin). */
export function BarreTemps({ fraction, label }: { fraction: number; label: string }) {
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-ink/10"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(f * 100)}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${f < 0.25 ? 'bg-coral' : 'bg-sky'}`}
        style={{ width: `${f * 100}%` }}
      />
    </div>
  );
}

/** Bulle de texte (dialogue d'un personnage). */
export function Bulle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl bg-card px-4 py-3 shadow-soft ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Petit compteur rond (numéro de carte pour le clavier). */
export function Pastille({ n, className = '' }: { n: number | string; className?: string }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-titre text-sm font-bold text-white ${className}`}
      aria-hidden
    >
      {n}
    </span>
  );
}
