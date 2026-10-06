/** Petits composants communs aux jeux de géométrie, mesures et données. */
import type { ReactNode } from 'react';
import { SpeakButton } from '@/components/ui';
import { Hud } from '@/games/_kit/ui';
import { Bandeau } from '../_nombres-commun/ui';

/** Pastilles : manche, bonnes réponses, et ce que le jeu veut ajouter. */
export function EnTete({
  icone,
  manche,
  N,
  justes,
  children,
}: {
  icone: string;
  manche: number;
  N: number;
  justes: number;
  children?: ReactNode;
}) {
  return (
    <Bandeau>
      <Hud>
        <span aria-hidden>{icone}</span> {Math.min(manche, N)} / {N}
      </Hud>
      <Hud>
        <span aria-hidden>✅</span>
        <span className="sr-only">Bonnes réponses :</span> {justes}
      </Hud>
      {children}
    </Bandeau>
  );
}

/** Consigne en gros + bouton 🔊. */
export function Consigne({
  texte,
  aDire,
  petit = false,
}: {
  texte: string;
  aDire?: string;
  petit?: boolean;
}) {
  return (
    <div className="carte flex w-full items-center gap-3 p-3">
      <SpeakButton text={aDire ?? texte} label="Écouter la consigne" />
      <p
        className={`flex-1 whitespace-pre-line font-titre font-extrabold leading-snug ${
          petit ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
        }`}
        aria-live="polite"
      >
        {texte}
      </p>
    </div>
  );
}

/** Message de réussite bref. */
export function Bravo({ texte }: { texte: string }) {
  return (
    <p className="text-center font-titre text-2xl font-extrabold text-grass-dark" role="status">
      {texte}
    </p>
  );
}

/** Petite aide (indice) affichée en Facile. */
export function Indice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-sun/25 px-3 py-2 text-center font-bold">
      <span aria-hidden>💡 </span>
      {children}
    </p>
  );
}

/** Accord du nombre : singulier pour 0 ou 1 (« 1 papillon envolé »). */
export const pl = (n: number, singulier: string, pluriel: string) => (n <= 1 ? singulier : pluriel);
