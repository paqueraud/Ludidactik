/**
 * Partie en manches commune aux jeux de géométrie, mesures et données : tirage d'un item exploitable
 * (les autres sont ignorés), réponse enregistrée une seule fois par manche, score (bonus de rapidité en
 * Normal et Plus loin, × 1,5 en Plus loin), fin de partie. Les pauses figent le temps de réponse.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { tirer } from '../_nombres-commun/outils';

export type Phase = 'jeu' | 'juste' | 'faux' | 'fin';

export interface OptionsManches {
  manches: Record<Level, number>;
  /** Phrase de fin selon le résultat. */
  fin: (gagne: boolean, justes: number, total: number) => string;
  /** Passage automatique à la manche suivante après une bonne réponse (ms), false = bouton. */
  autoSuivant?: number | false;
}

export function bonusRapidite(level: Level, ms: number): number {
  const s = ms / 1000;
  if (level === 'plus_loin') return Math.max(0, Math.round(60 - s * 3));
  if (level === 'normal') return Math.max(0, Math.round(30 - s * 1.5));
  return 0;
}

export function useManches<T extends Item>(
  props: Pick<
    GameProps,
    'stream' | 'target' | 'level' | 'paused' | 'onAnswer' | 'onEnd' | 'sfx' | 'speech' | 'lectureAuto'
  >,
  ok: (it: Item) => it is T,
  opts: OptionsManches,
) {
  const { stream, target, level, paused, onAnswer, onEnd, sfx } = props;
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = opts.manches[level];
  const dernier = useRef<string | null>(null);

  const tirerItem = useCallback((): T | null => {
    let it: T | null = null;
    for (let k = 0; k < 6; k++) {
      it = tirer(stream, target(), ok, 40);
      if (!it || it.id !== dernier.current) break;
    }
    dernier.current = it?.id ?? null;
    return it;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, target]);

  const [item, setItem] = useState<T | null>(() => tirerItem());
  const [manche, setManche] = useState(1);
  const [phase, setPhase] = useState<Phase>('jeu');
  const score = useRef(0);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    if (item) startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, manche]);

  /** Enregistre la réponse de la manche (une seule fois). `points` : 0 à 1 (réussite partielle). */
  const valider = useCallback(
    (correct: boolean, donne: string, attendu: string, points = 1) => {
      if (!item || phase !== 'jeu') return;
      const ms = answer(item, correct, donne, attendu);
      if (correct) {
        const base = Math.round(100 * points) + bonusRapidite(level, ms);
        score.current += Math.round(base * (level === 'plus_loin' ? 1.5 : 1));
        sfx.play('juste');
      } else sfx.play('faux');
      setPhase(correct ? 'juste' : 'faux');
    },
    [item, phase, answer, level, sfx],
  );

  const suivant = useCallback(() => {
    if (phase === 'fin') return;
    if (manche >= N) {
      setPhase('fin');
      const s = statsRef.current;
      const gagne = s.correct >= Math.ceil(N * 0.6);
      sfx.play(gagne ? 'fanfare' : 'etoile');
      end({ won: gagne, headline: opts.fin(gagne, s.correct, N), score: score.current, delayMs: 900 });
      return;
    }
    setItem(tirerItem());
    setManche((m) => m + 1);
    setPhase('jeu');
  }, [phase, manche, N, sfx, end, opts, tirerItem]);

  // Bonne réponse : on enchaîne tout seul (sauf pendant la pause).
  const auto = opts.autoSuivant ?? 1400;
  useEffect(() => {
    if (phase !== 'juste' || auto === false || paused) return;
    const t = setTimeout(suivant, auto);
    return () => clearTimeout(t);
  }, [phase, auto, paused, suivant]);

  const abandonner = useCallback(() => end({ won: false, headline: 'À bientôt !', delayMs: 0 }), [end]);

  return { item, manche, N, phase, valider, suivant, stats, score: score.current, abandonner };
}
