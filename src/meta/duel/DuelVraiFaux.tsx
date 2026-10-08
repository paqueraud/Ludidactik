/**
 * Vrai ou Faux express en duel : la même carte pour les deux joueurs ; le premier qui répond juste
 * marque le point. Une mauvaise réponse ne fait rien perdre : on attend simplement la carte suivante.
 * Après chaque carte, la bonne réponse et l'explication s'affichent des deux côtés.
 */
import { useEffect, useRef, useState } from 'react';
import type { TrueFalseItem } from '@/content/items';
import type { ItemStream } from '@/content/provider';
import { sfx } from '@/services/sfx';
import { DuelEcran, type Joueur } from './DuelEcran';

export const NB_CARTES = 10;

type Reponse = 'juste' | 'faux' | null;

export function DuelVraiFaux({
  joueurs,
  stream,
  onFin,
  centre,
}: {
  joueurs: [Joueur, Joueur];
  stream: ItemStream;
  onFin(gagnant: 0 | 1 | null, scores: [number, number]): void;
  centre: React.ReactNode;
}) {
  const tirer = () => {
    const it = stream.next(0.5);
    return it.kind === 'true_false' ? it : null;
  };
  const [carte, setCarte] = useState<TrueFalseItem | null>(tirer);
  const [numero, setNumero] = useState(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [reponses, setReponses] = useState<[Reponse, Reponse]>([null, null]);
  const [revele, setRevele] = useState<0 | 1 | 'personne' | null>(null);
  const timer = useRef<number>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const suite = (sc: [number, number]) => {
    timer.current = window.setTimeout(() => {
      if (numero >= NB_CARTES) {
        sfx.play('fanfare');
        onFin(sc[0] === sc[1] ? null : sc[0] > sc[1] ? 0 : 1, sc);
        return;
      }
      setNumero((n) => n + 1);
      setCarte(tirer());
      setReponses([null, null]);
      setRevele(null);
    }, 2200);
  };

  const repondre = (i: 0 | 1, v: boolean) => {
    if (!carte || revele !== null || reponses[i]) return;
    if (v === carte.answer) {
      sfx.play('juste');
      const sc: [number, number] = [...scores];
      sc[i]++;
      setScores(sc);
      setReponses((r) => {
        const n: [Reponse, Reponse] = [...r];
        n[i] = 'juste';
        return n;
      });
      setRevele(i);
      suite(sc);
    } else {
      sfx.play('faux');
      const n: [Reponse, Reponse] = [...reponses];
      n[i] = 'faux';
      setReponses(n);
      if (n[0] === 'faux' && n[1] === 'faux') {
        setRevele('personne');
        suite(scores);
      }
    }
  };

  return (
    <DuelEcran
      joueurs={joueurs}
      centre={
        <>
          <span className="px-2 font-titre text-lg font-extrabold" aria-live="polite">
            {scores[0]} – {scores[1]} · carte {numero}/{NB_CARTES}
          </span>
          {centre}
        </>
      }
      rendu={(i) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="carte flex min-h-[5.5rem] w-full max-w-md items-center justify-center p-3">
            {carte?.image && (
              <span className="mr-2 text-4xl" aria-hidden>
                {carte.image}
              </span>
            )}
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl">{carte?.statement}</p>
          </div>
          {revele !== null && carte ? (
            <p className="max-w-md font-bold" role="status">
              {revele === i ? '🎉 Point pour toi ! ' : revele === 'personne' ? 'Personne cette fois ! ' : ''}
              C’est {carte.answer ? 'VRAI' : 'FAUX'}. {carte.explication}
            </p>
          ) : reponses[i] === 'faux' ? (
            <p className="font-bold">Oups ! Attends la carte suivante…</p>
          ) : (
            <div className="flex w-full max-w-md gap-3">
              <button
                type="button"
                className="btn-3d min-h-[64px] flex-1 bg-grass-dark text-2xl text-white"
                onClick={() => repondre(i, true)}
                aria-label={`Vrai (${joueurs[i].nom})`}
              >
                ✔ VRAI
              </button>
              <button
                type="button"
                className="btn-3d min-h-[64px] flex-1 bg-coral text-2xl text-white"
                onClick={() => repondre(i, false)}
                aria-label={`Faux (${joueurs[i].nom})`}
              >
                ✘ FAUX
              </button>
            </div>
          )}
        </div>
      )}
    />
  );
}
