/** Petits composants partagés par les jeux « nombres » : affichage de saisie, barre de temps, correction. */
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button, SpeakButton } from '@/components/ui';

/** Case de réponse géante (la saisie se fait au pavé numérique ou au clavier physique). */
export function CaseReponse({
  valeur,
  etat = null,
  unite,
  label = 'Ta réponse',
  className = '',
}: {
  valeur: string;
  etat?: 'juste' | 'faux' | null;
  unite?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div
        className={`flex h-16 min-w-[9rem] items-center justify-center rounded-2xl border-4 px-4 font-titre text-4xl font-extrabold ${
          etat === 'faux'
            ? 'border-coral bg-coral/10'
            : etat === 'juste'
              ? 'border-grass bg-grass/15'
              : 'border-sky bg-cream'
        }`}
        aria-label={`${label} : ${valeur || 'vide'}`}
        aria-live="polite"
      >
        {valeur || <span className="animate-pulse text-ink/25">?</span>}
      </div>
      {unite && <span className="font-titre text-2xl font-bold">{unite}</span>}
    </div>
  );
}

/** Barre de temps restante (0 → 1). Couleur verte → jaune → corail. */
export function BarreTemps({ reste, label = 'Temps' }: { reste: number; label?: string }) {
  const v = Math.max(0, Math.min(1, reste));
  return (
    <div className="w-full max-w-xs" role="img" aria-label={`${label} : ${Math.round(v * 100)} %`}>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full ${v > 0.5 ? 'bg-grass' : v > 0.2 ? 'bg-sun' : 'bg-coral'}`}
          style={{ width: `${v * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Correction bienveillante : « Presque ! » + bonne réponse + explication lue à voix haute + Continuer.
 * (Variante du `Feedback` du kit avec un contenu libre au-dessus de l'explication.)
 */
export function Correction({
  ouvert,
  titre = 'Presque !',
  bonne,
  explication,
  aDire,
  onContinuer,
  libelle = 'Continuer',
  children,
}: {
  ouvert: boolean;
  titre?: string;
  bonne?: string;
  explication?: string;
  /** Texte lu par le bouton 🔊 (par défaut : bonne réponse + explication). */
  aDire?: string;
  onContinuer: () => void;
  libelle?: string;
  children?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-full rounded-2xl bg-coral/10 p-4 text-left"
          role="status"
        >
          <p className="text-lg font-bold">
            {titre}
            {bonne && (
              <>
                {' '}
                La bonne réponse : <span className="whitespace-pre-line text-grass-dark">{bonne}</span>
              </>
            )}
          </p>
          {children}
          {explication && (
            <div className="mt-2 flex items-start gap-2">
              <SpeakButton
                text={aDire ?? `${bonne ? `La bonne réponse est ${bonne}. ` : ''}${explication}`}
                size={40}
                label="Écouter l’explication"
              />
              <p>{explication}</p>
            </div>
          )}
          <Button variant="grass" className="mt-3 w-full" onClick={onContinuer} autoFocus>
            {libelle}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** En-tête de jeu : pastilles d'information alignées, qui passent à la ligne sur mobile. */
export function Bandeau({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-wrap items-center justify-center gap-2">{children}</div>;
}

/** Message quand la leçon ne fournit pas le bon type de questions (ne devrait pas arriver hors Labo). */
export function PasDeQuestion({ onFin, texte }: { onFin: () => void; texte: string }) {
  return (
    <div className="carte mx-auto max-w-md p-6 text-center">
      <p className="mb-4 text-lg font-bold">{texte}</p>
      <Button onClick={onFin}>Terminer</Button>
    </div>
  );
}
