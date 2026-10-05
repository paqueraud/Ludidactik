/**
 * Schéma en barre (modèle en barres du BO) : une ligne par barre, segments proportionnels, accolade du
 * total. Chaque emplacement peut recevoir un bloc (toucher le bloc puis l'emplacement, ou glisser).
 */
import { motion, useReducedMotion } from 'framer-motion';
import type { BarModelItem } from '@/content/schemas';
import { type Analyse, type Emplacement, estEcart, estPoints } from '../_calcul-commun/barres';

const COULEURS = ['#4FC3F7', '#FF7A6B', '#7BD389'];

function Case({
  e,
  children,
  className = '',
  style,
  actifs,
  remplis,
  selection,
  onPoser,
  reduce,
}: {
  e?: Emplacement;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  actifs: Set<string>;
  remplis: Record<string, string>;
  selection: boolean;
  onPoser?: (e: Emplacement) => void;
  reduce: boolean;
}) {
  const actif = !!e && actifs.has(e.id) && !remplis[e.id];
  const texte = e ? remplis[e.id] : undefined;
  return (
    <button
      type="button"
      data-emplacement={e?.id}
      disabled={!actif || !onPoser}
      onClick={() => e && actif && onPoser?.(e)}
      className={`relative flex min-h-[48px] min-w-0 items-center justify-center overflow-hidden px-0.5 font-titre text-lg font-extrabold disabled:cursor-default sm:text-xl ${className} ${
        actif ? `!border-dashed !border-ink/50 ${selection ? 'animate-pulse ring-4 ring-grape/50' : ''}` : ''
      }`}
      style={style}
      aria-label={e ? (texte ? `Case : ${texte}` : actif ? 'Case vide : pose un bloc ici' : 'Case') : undefined}
    >
      {texte !== undefined ? (
        <motion.span initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} className="truncate">
          {texte}
        </motion.span>
      ) : (
        children
      )}
    </button>
  );
}

export function Schema({
  item,
  analyse,
  remplis,
  actifs,
  onPoser,
  selection,
  etat,
}: {
  item: BarModelItem;
  analyse: Analyse;
  /** Texte affiché dans chaque emplacement (id → texte), absent = vide. */
  remplis: Record<string, string>;
  /** Emplacements où l'on peut poser un bloc. */
  actifs: Set<string>;
  onPoser?: (e: Emplacement) => void;
  selection: boolean;
  etat?: 'ok' | null;
}) {
  const reduce = useReducedMotion();
  const longueurs = analyse.largeurs.map((l) => l.reduce((a, b) => a + b, 0));
  const max = Math.max(...longueurs, 1);
  const emp = (barre: number, segment: number) => analyse.emplacements.find((e) => e.barre === barre && e.segment === segment);

  const caseProps = { actifs, remplis, selection, onPoser, reduce: !!reduce };
  return (
    <div className={`flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-2 sm:p-3 ${etat === 'ok' ? 'ring-4 ring-grass' : ''}`}>
      {item.bars.map((b, i) => {
        const largeurBarre = (longueurs[i]! / max) * 100;
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-right text-sm font-bold sm:w-20" title={b.label}>
                {b.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex" style={{ width: `${largeurBarre}%` }}>
                  {b.segments.map((s, j) => {
                    const w = analyse.largeurs[i]![j]!;
                    const e = emp(i, j);
                    const pts = estPoints(s.label);
                    const ecart = estEcart(s.label);
                    return (
                      <div key={j} className="flex min-w-0 flex-col" style={{ flexGrow: w, flexBasis: 0 }}>
                        <Case
                          {...caseProps}
                          e={pts ? undefined : e}
                          className={`rounded-lg border-[3px] ${ecart ? 'border-dashed border-ink/60 bg-white' : 'border-white/90'}`}
                          style={{
                            background: pts
                              ? 'repeating-linear-gradient(90deg, #E6EEF6 0 6px, #fff 6px 12px)'
                              : ecart
                                ? 'repeating-linear-gradient(45deg, #fff 0 6px, #FFE7A8 6px 12px)'
                                : COULEURS[i % COULEURS.length],
                          }}
                        >
                          {pts ? '…' : null}
                        </Case>
                        {s.label && !pts && (
                          <span className="truncate text-center text-[11px] font-bold text-ink-soft sm:text-xs" title={s.label}>
                            {s.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {analyse.accolade && analyse.barreTotal === i && (
                  <div className="mt-0.5 flex flex-col items-center" style={{ width: `${largeurBarre}%` }}>
                    <svg viewBox="0 0 200 16" preserveAspectRatio="none" className="h-4 w-full" aria-hidden>
                      <path d="M2 2 Q2 9 20 9 L92 9 Q100 9 100 15 Q100 9 108 9 L180 9 Q198 9 198 2" fill="none" stroke="#24304A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <Case {...caseProps} e={emp(i, -1)} className="min-w-[4.5rem] rounded-xl border-[3px] border-ink/30 bg-sun/40 px-2">
                      {null}
                    </Case>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
