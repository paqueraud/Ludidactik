/** Saisie d'un nombre au pavé numérique géant ET au clavier physique (chiffres, virgule, Retour, Entrée). */
import { useCallback, useMemo, useState } from 'react';
import { usePhysicalKeyboard } from '@/components/Keypads';

export function useSaisieNumerique({
  actif,
  onValider,
  onContinuer,
  longueurMax = 12,
}: {
  /** Saisie possible (question en cours, pas en pause). */
  actif: boolean;
  onValider: (valeur: string) => void;
  /** Entrée quand la saisie est inactive (ex. après une correction). */
  onContinuer?: () => void;
  longueurMax?: number;
}) {
  const [valeur, setValeur] = useState('');
  const onKey = useCallback(
    (k: string) => {
      if (!actif) return;
      setValeur((v) => {
        if (k === ',' && (v.includes(',') || v === '')) return v;
        return v.length < longueurMax ? v + k : v;
      });
    },
    [actif, longueurMax],
  );
  const onDelete = useCallback(() => actif && setValeur((v) => v.slice(0, -1)), [actif]);
  const onSubmit = useCallback(() => {
    if (actif) {
      if (valeur.trim()) onValider(valeur);
    } else onContinuer?.();
  }, [actif, valeur, onValider, onContinuer]);
  const handlers = useMemo(
    // Inactif et sans « continuer » : on laisse la touche Entrée au bouton qui a le focus.
    () => ({ onKey, onDelete, onSubmit, disabled: !actif && !onContinuer }),
    [onKey, onDelete, onSubmit, actif, onContinuer],
  );
  usePhysicalKeyboard(handlers, /[0-9,.]/, { pointEnVirgule: true });
  return { valeur, setValeur, handlers };
}
