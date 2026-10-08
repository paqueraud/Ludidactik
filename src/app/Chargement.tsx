/** Écran d'attente (chargement d'un écran ou du contenu d'une classe), léger et sans animation lourde. */
import { Ludo } from '@/components/Ludo';
import { Button } from '@/components/ui';

export function Chargement({ erreur, onReessayer }: { erreur?: string; onReessayer?: () => void }) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      aria-busy={!erreur}
    >
      <Ludo size={96} />
      {erreur ? (
        <>
          <p className="max-w-sm font-titre text-xl font-bold text-ink">{erreur}</p>
          {onReessayer && <Button onClick={onReessayer}>Réessayer</Button>}
        </>
      ) : (
        <p className="animate-pulse font-titre text-xl font-bold text-ink" role="status">
          Chargement…
        </p>
      )}
    </main>
  );
}
