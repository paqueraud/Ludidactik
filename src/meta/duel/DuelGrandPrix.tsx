/**
 * Grand Prix en duel : chacun son pavé, les mêmes calculs dans le même ordre (flux à graine commune) ;
 * chaque bonne réponse fait avancer son cheval ; le premier à l'arrivée gagne. Une erreur montre la
 * bonne réponse un instant, sans pénalité.
 */
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Item, NumericItem } from '@/content/items';
import type { ItemStream } from '@/content/provider';
import { checkNumeric, formatNumber } from '@/engine/answer';
import { sfx } from '@/services/sfx';
import { DuelEcran, type Joueur, PaveCompact } from './DuelEcran';

export const ARRIVEE = 10;

interface Etat {
  item: NumericItem | null;
  saisie: string;
  avance: number;
  correction: NumericItem | null;
}

const numerique = (it: Item | undefined): NumericItem | null => (it?.kind === 'numeric_answer' ? it : null);

export function DuelGrandPrix({
  joueurs,
  streams,
  onFin,
  centre,
}: {
  joueurs: [Joueur, Joueur];
  /** Deux flux identiques (même graine) : mêmes calculs pour les deux joueurs. */
  streams: [ItemStream, ItemStream];
  onFin(gagnant: 0 | 1, scores: [number, number]): void;
  centre: React.ReactNode;
}) {
  const [etats, setEtats] = useState<[Etat, Etat]>(() => [
    { item: numerique(streams[0].next(0.5)), saisie: '', avance: 0, correction: null },
    { item: numerique(streams[1].next(0.5)), saisie: '', avance: 0, correction: null },
  ]);
  const fini = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const maj = (i: 0 | 1, f: (e: Etat) => Etat) =>
    setEtats((cur) => {
      const n: [Etat, Etat] = [cur[0], cur[1]];
      n[i] = f(cur[i]);
      return n;
    });

  const valider = (i: 0 | 1) => {
    const e = etats[i];
    if (fini.current || !e.item || e.correction || !e.saisie) return;
    const ok = checkNumeric(e.saisie, e.item.answer, { tolerateZeros: true }).correct;
    if (ok) {
      sfx.play('galop');
      const avance = e.avance + 1;
      maj(i, () => ({ item: numerique(streams[i].next(0.5)), saisie: '', avance, correction: null }));
      if (avance >= ARRIVEE && !fini.current) {
        fini.current = true;
        sfx.play('fanfare');
        const autre = etats[i === 0 ? 1 : 0].avance;
        onFin(i, i === 0 ? [avance, autre] : [autre, avance]);
      }
    } else {
      sfx.play('faux');
      maj(i, (x) => ({ ...x, correction: x.item, saisie: '' }));
      timers.current.push(
        window.setTimeout(
          () => maj(i, (x) => ({ ...x, correction: null, item: numerique(streams[i].next(0.5)) })),
          1600,
        ),
      );
    }
  };

  const piste = (moi: 0 | 1) => (
    <div className="mb-1 flex flex-col gap-1" aria-hidden>
      {([moi, moi === 0 ? 1 : 0] as const).map((j) => (
        <div key={j} className={`relative h-6 rounded-full ${j === moi ? 'bg-white/80' : 'bg-white/40'}`}>
          <div className="absolute inset-y-0 right-2 w-1 bg-[repeating-linear-gradient(0deg,#24304A_0_4px,#fff_4px_8px)]" />
          <motion.span
            className="absolute top-0 text-xl leading-6"
            initial={false}
            animate={{ left: `${(etats[j].avance / ARRIVEE) * 88}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          >
            <span className="inline-block -scale-x-100">🏇</span>
          </motion.span>
        </div>
      ))}
    </div>
  );

  return (
    <DuelEcran
      joueurs={joueurs}
      centre={centre}
      rendu={(i) => {
        const e = etats[i];
        return (
          <div className="flex flex-1 flex-col justify-center gap-1">
            {piste(i)}
            <p className="sr-only" aria-live="polite">
              {joueurs[i].nom} : {e.avance} sur {ARRIVEE}
            </p>
            <div className="flex min-h-[3rem] flex-wrap items-center justify-center gap-2 text-center">
              {e.correction ? (
                <p className="font-titre text-lg font-extrabold leading-tight sm:text-2xl" role="status">
                  Presque ! {e.correction.prompt} →{' '}
                  <span className="text-grass-dark">{formatNumber(e.correction.answer)}</span>
                </p>
              ) : e.item ? (
                <>
                  <span className="font-titre text-2xl font-extrabold sm:text-3xl">{e.item.prompt}</span>
                  <output
                    className="flex h-12 min-w-[5.5rem] items-center justify-center rounded-2xl border-4 border-sky bg-card px-3 font-titre text-3xl font-extrabold"
                    aria-label={`Réponse de ${joueurs[i].nom}`}
                  >
                    {e.saisie || ' '}
                  </output>
                </>
              ) : null}
            </div>
            <PaveCompact
              nom={joueurs[i].nom}
              decimal={(e.item?.decimals ?? 0) > 0}
              disabled={!!e.correction || fini.current}
              onKey={(k) => maj(i, (x) => ({ ...x, saisie: x.saisie.length < 8 ? x.saisie + k : x.saisie }))}
              onDelete={() => maj(i, (x) => ({ ...x, saisie: x.saisie.slice(0, -1) }))}
              onSubmit={() => valider(i)}
            />
          </div>
        );
      }}
    />
  );
}
