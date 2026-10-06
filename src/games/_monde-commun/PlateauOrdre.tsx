/**
 * Plateau « remettre dans l'ordre » commun à la Machine à remonter le temps (frise) et au
 * Laboratoire (cycle de vie, étapes) : des cases numérotées et une réserve de cartes.
 * Toucher une carte la pose dans la première case libre ; toucher une case la vide.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { OrderingItem } from '@/content/schemas';
import type { useOrdre } from './hooks';
import { estCycle } from './outils';
import { Pastille } from './ui';

type Ordre = ReturnType<typeof useOrdre>;

const STYLE = {
  frise: {
    carte: 'border-[#E0A458] bg-[#FFF4DC] text-ink',
    caseVide: 'border-dashed border-[#C99A62] bg-white/60',
    fleche: 'text-[#B07A50]',
  },
  labo: {
    carte: 'border-sciences/60 bg-[#E9FBF8] text-ink',
    caseVide: 'border-dashed border-sciences/60 bg-white/60',
    fleche: 'text-sciences',
  },
} as const;

export function PlateauOrdre({
  item,
  ordre,
  bienPlaces,
  reveler,
  theme,
  actif,
}: {
  item: OrderingItem;
  ordre: Ordre;
  /** Après vérification : case par case, juste ou non. */
  bienPlaces: boolean[] | null;
  /** Révèle les étiquettes (dates) sous les cases. */
  reveler: boolean;
  theme: 'frise' | 'labo';
  actif: boolean;
}) {
  const reduce = useReducedMotion();
  const st = STYLE[theme];
  const cycle = estCycle(item);
  const n = item.elements.length;
  const debut = item.mode === 'chrono' ? 'Avant' : 'Début';
  const finTxt = item.mode === 'chrono' ? 'Après' : cycle ? 'Et le cycle recommence ↺' : 'Fin';

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Les cases */}
      <div>
        <div
          className="mb-1 flex items-center justify-between px-1 text-sm font-bold text-ink-soft"
          aria-hidden
        >
          <span>{debut}</span>
          <span className={`mx-2 h-1 flex-1 rounded-full bg-current opacity-30 ${st.fleche}`} />
          <span>{finTxt} ➜</span>
        </div>
        <ol
          className={`grid gap-2 ${n <= 3 ? 'sm:grid-cols-3' : n === 4 ? 'sm:grid-cols-4' : n <= 6 ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-4 lg:grid-cols-5'}`}
          aria-label="Les cases, dans l’ordre"
        >
          {ordre.cases.map((orig, pos) => {
            const verrou = ordre.verrous[pos];
            const ok = bienPlaces?.[pos];
            const etat =
              bienPlaces === null
                ? verrou
                  ? 'ring-4 ring-grass'
                  : ''
                : ok
                  ? 'ring-4 ring-grass bg-grass/20'
                  : 'ring-4 ring-coral bg-coral/15';
            const label = item.labels?.[pos];
            return (
              <li key={pos} className="flex min-w-0 flex-col gap-1">
                <AnimatePresence>
                  {reveler && label && (
                    <motion.span
                      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: reduce ? 0 : pos * 0.12 }}
                      className="self-center rounded-full bg-sun px-3 py-0.5 font-titre text-sm font-extrabold text-ink shadow-pop-sm"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => ordre.retirer(pos)}
                  disabled={!actif || orig === null || verrou}
                  aria-label={
                    orig === null
                      ? `Case ${pos + 1} : vide`
                      : `Case ${pos + 1} : ${item.elements[orig]}${verrou ? ' (bloquée)' : actif ? ', toucher pour la retirer' : ''}`
                  }
                  className={`relative flex min-h-[4rem] w-full items-center gap-2 rounded-2xl border-2 p-2 text-left font-bold leading-tight transition-colors ${
                    orig === null ? st.caseVide : `${st.carte} shadow-pop-sm`
                  } ${etat}`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-titre text-sm font-extrabold text-ink-soft ring-2 ring-ink/10"
                    aria-hidden
                  >
                    {pos + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    {orig === null ? <span className="text-ink/30">?</span> : item.elements[orig]}
                  </span>
                  {verrou && <Lock size={16} className="shrink-0 text-grass-dark" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* La réserve */}
      {ordre.libres.length > 0 && (
        <div>
          <p className="mb-2 text-center text-sm font-bold text-ink-soft">
            Touche les cartes dans l’ordre (ou tape leur numéro).
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Cartes à placer">
            <AnimatePresence initial={false}>
              {ordre.libres.map((orig, k) => (
                <motion.li
                  key={orig}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.8 }}
                >
                  <button
                    type="button"
                    onClick={() => ordre.placer(orig)}
                    disabled={!actif}
                    aria-label={`Carte ${k + 1} : ${item.elements[orig]}`}
                    className={`btn-3d flex min-h-[3.5rem] max-w-[17rem] items-center gap-2 border-2 px-3 py-2 text-left text-base font-bold sm:text-lg ${st.carte}`}
                  >
                    <Pastille n={k + 1} />
                    <span className="break-words">{item.elements[orig]}</span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
