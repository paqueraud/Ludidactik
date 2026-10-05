/** Petits composants et hooks communs aux jeux de langue (n° 39 à 48). */
import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

/**
 * État propre quand la leçon (ou le Labo) ne fournit aucun item de la forme attendue :
 * message clair, aucune erreur, bouton pour terminer.
 */
export function PasDExercice({ texte, onFin }: { texte: string; onFin: () => void }) {
  return (
    <div
      className="carte mx-3 mt-4 flex max-w-md flex-col items-center gap-4 p-6 text-center sm:mx-auto"
      role="status"
    >
      <span className="text-5xl" aria-hidden>
        🧺
      </span>
      <p className="text-lg font-bold">Pas d’exercice adapté ici.</p>
      <p>{texte}</p>
      <Button onClick={onFin}>Terminer</Button>
    </div>
  );
}

/**
 * Écoute du clavier physique (hors champs de saisie et raccourcis système).
 * `handler` renvoie true s'il a utilisé la touche (on empêche alors l'action par défaut).
 */
export function useTouches(actif: boolean, handler: (e: KeyboardEvent) => boolean | void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (ref.current(e)) e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif]);
}

/**
 * Glisser-déposer : renvoie la valeur de l'attribut `data-<attr>` de la zone sous le doigt / la souris
 * à la fin d'un glisser (Framer Motion `onDragEnd`), ou null. L'élément glissé lui-même est ignoré.
 */
export function cibleSous(e: MouseEvent | TouchEvent | PointerEvent, attr: string): string | null {
  let x: number;
  let y: number;
  if ('changedTouches' in e && e.changedTouches.length) {
    x = e.changedTouches[0]!.clientX;
    y = e.changedTouches[0]!.clientY;
  } else if ('clientX' in e) {
    x = e.clientX;
    y = e.clientY;
  } else return null;
  if (typeof document.elementsFromPoint !== 'function') return null;
  for (const el of document.elementsFromPoint(x, y)) {
    const v = (el as HTMLElement).closest?.(`[data-${attr}]`)?.getAttribute(`data-${attr}`);
    if (v != null) return v;
  }
  return null;
}

/** Pastille de raccourci clavier (1, 2, A…) posée sur un bouton. */
export function Touche({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`pointer-events-none flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1.5 font-titre text-xs font-bold text-white ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Petite étoile qui jaillit (récompense visuelle, équivalent du son « juste »). */
export function Etincelle({ visible, reduite }: { visible: boolean; reduite: boolean }) {
  if (!visible) return null;
  return (
    <motion.span
      className="pointer-events-none absolute -top-3 right-2 text-3xl"
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={reduite ? { opacity: 1 } : { opacity: [0, 1, 0], scale: [0.4, 1.3, 1], y: [10, -20, -36] }}
      transition={{ duration: 0.9 }}
      aria-hidden
    >
      ✨
    </motion.span>
  );
}
