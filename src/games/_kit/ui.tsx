/** Composants communs des mini-jeux (mise en page, choix, retour d'erreur bienveillant). */
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect } from 'react';
import { Button, SpeakButton } from '@/components/ui';

/** Mise en page standard : scène (illustration du jeu) + panneau de jeu. Empilés sur mobile. */
export function GameLayout({
  scene,
  children,
  sceneLabel,
}: {
  scene?: ReactNode;
  children: ReactNode;
  sceneLabel?: string;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      {scene && (
        <section
          className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[44%] lg:self-start"
          aria-label={sceneLabel}
        >
          <div className="relative">{scene}</div>
        </section>
      )}
      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        {children}
      </section>
    </div>
  );
}

/** Pastille d'information (score, vies, manche). */
export function Hud({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 font-titre font-bold shadow-pop-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Énoncé en gros + bouton 🔊. */
export function Prompt({
  text,
  spoken,
  lang,
  className = '',
}: {
  text: string;
  spoken?: string;
  lang?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-center gap-3 ${className}`}>
      <SpeakButton text={spoken ?? text} lang={lang} label="Écouter" />
      <p
        className="whitespace-pre-line text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl"
        aria-live="polite"
      >
        {text}
      </p>
    </div>
  );
}

const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];
const COULEURS = ['bg-sky', 'bg-coral', 'bg-sun', 'bg-grass', 'bg-grape', 'bg-histoire'];

/**
 * Grille de grosses réponses (touches A-F / 1-6 au clavier).
 * `reveal` : après réponse, surligne la bonne (vert) et celle choisie si fausse (corail).
 */
export function ChoiceGrid({
  choices,
  onPick,
  reveal,
  disabled = false,
}: {
  choices: string[];
  onPick(index: number): void;
  reveal?: { correct: number; chosen: number | null } | null;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (disabled || reveal) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
      const i = LETTRES.findIndex((l) => l.toLowerCase() === e.key.toLowerCase());
      const j = Number(e.key) - 1;
      const k = i >= 0 ? i : Number.isInteger(j) && j >= 0 ? j : -1;
      if (k >= 0 && k < choices.length) onPick(k);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [choices, onPick, disabled, reveal]);

  return (
    <div className={`grid w-full gap-3 ${choices.length > 2 ? 'sm:grid-cols-2' : 'grid-cols-2'}`}>
      {choices.map((c, i) => {
        const state = !reveal
          ? ''
          : i === reveal.correct
            ? 'ring-4 ring-grass bg-grass/20'
            : i === reveal.chosen
              ? 'ring-4 ring-coral bg-coral/15'
              : 'opacity-50';
        return (
          <button
            key={`${c}-${i}`}
            type="button"
            className={`btn-3d flex min-h-[4.25rem] items-center gap-3 bg-card p-3 text-left text-lg font-bold sm:text-xl ${state}`}
            onClick={() => onPick(i)}
            disabled={disabled || !!reveal}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-titre text-white ${COULEURS[i]}`}
              aria-hidden
            >
              {LETTRES[i]}
            </span>
            <span className="whitespace-pre-line">{c}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Retour après réponse. Juste : bandeau bref. Faux : bonne réponse + explication + bouton
 * « Continuer » (touche Entrée) — toujours encourageant (« Presque ! »), jamais punitif.
 */
export function Feedback({
  state,
  expected,
  explication,
  onContinue,
  message,
}: {
  state: 'juste' | 'faux' | null;
  expected?: string;
  explication?: string;
  onContinue?: () => void;
  message?: string;
}) {
  useEffect(() => {
    if (state !== 'faux' || !onContinue) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [state, onContinue]);

  return (
    <AnimatePresence mode="wait">
      {state === 'juste' && (
        <motion.p
          key="ok"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center font-titre text-2xl font-extrabold text-grass-dark"
          role="status"
        >
          {message ?? 'Bravo !'}
        </motion.p>
      )}
      {state === 'faux' && (
        <motion.div
          key="ko"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl bg-coral/10 p-4"
          role="status"
        >
          <p className="text-lg font-bold">
            {message ?? 'Presque !'}
            {expected && (
              <>
                {' '}
                La bonne réponse : <span className="whitespace-pre-line text-grass-dark">{expected}</span>
              </>
            )}
          </p>
          {explication && (
            <div className="mt-2 flex items-start gap-2">
              <SpeakButton
                text={`${expected ? `La bonne réponse est ${expected}. ` : ''}${explication}`}
                size={40}
              />
              <p>{explication}</p>
            </div>
          )}
          {onContinue && (
            <Button variant="grass" className="mt-3 w-full" onClick={onContinue} autoFocus>
              Continuer
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Rangée de cœurs / vies. */
export function Vies({ n, max }: { n: number; max: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} vies sur ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden className={i < n ? '' : 'opacity-25 grayscale'}>
          ❤️
        </span>
      ))}
    </span>
  );
}
