/** Hooks communs à tous les mini-jeux : suivi de partie, lecture automatique, objectifs par niveau. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { type ItemStream, itemKey } from '@/content/provider';
import type { Item, Level } from '@/content/schemas';
import type { GameProps, GameSummary } from '@/engine/GameModule';

/**
 * Item suivant d'un flux, ou null si le flux n'en fournit plus : un flux dérivé par adaptateur peut
 * échouer (aucune dérivation possible à ce niveau). Le jeu affiche alors un état calme, sans planter.
 */
export function itemSuivant(stream: ItemStream, target?: number): Item | null {
  try {
    return stream.next(target);
  } catch {
    return null;
  }
}

/** Nombre de manches / bonnes réponses visées selon le niveau. */
export const parNiveau = <T>(level: Level, v: Record<Level, T>): T => v[level];

/**
 * Suivi d'une partie : chronomètre (pauses exclues), temps de réponse par question,
 * compteurs, série, et une fin de partie appelée une seule fois.
 */
export function useGameSession({
  paused,
  onAnswer,
  onEnd,
}: Pick<GameProps, 'paused' | 'onAnswer' | 'onEnd'>) {
  const start = useRef(performance.now());
  const pausedMs = useRef(0);
  const qStart = useRef(performance.now());
  const ended = useRef(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    if (!paused) return;
    const t0 = performance.now();
    return () => {
      const d = performance.now() - t0;
      pausedMs.current += d;
      qStart.current += d;
    };
  }, [paused]);

  /** Temps de jeu écoulé (ms), pauses exclues. */
  const elapsed = useCallback(() => performance.now() - start.current - pausedMs.current, []);

  /** À appeler quand une nouvelle question s'affiche. */
  const startQuestion = useCallback(() => {
    qStart.current = performance.now();
  }, []);

  /** Enregistre une réponse. Renvoie le temps de réponse en ms. */
  const answer = useCallback(
    (item: Item, correct: boolean, given: string, expected: string) => {
      const ms = performance.now() - qStart.current;
      onAnswer({ itemId: item.id, itemKey: itemKey(item), correct, ms, given, expected });
      setStats((s) => {
        const streak = correct ? s.streak + 1 : 0;
        return {
          correct: s.correct + (correct ? 1 : 0),
          total: s.total + 1,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
        };
      });
      return ms;
    },
    [onAnswer],
  );

  /** Termine la partie (une seule fois). `score` par défaut : bonnes réponses × 100 − secondes. */
  const end = useCallback(
    (r: {
      won: boolean;
      headline: string;
      score?: number;
      ghost?: number[];
      delayMs?: number;
      correct?: number;
      total?: number;
    }) => {
      if (ended.current) return;
      ended.current = true;
      const s = statsRef.current;
      const durationMs = Math.round(elapsed());
      const summary: GameSummary = {
        correct: r.correct ?? s.correct,
        total: r.total ?? s.total,
        durationMs,
        score: r.score ?? Math.max(0, (r.correct ?? s.correct) * 100 - Math.round(durationMs / 1000)),
        won: r.won,
        headline: r.headline,
        ghost: r.ghost,
      };
      setTimeout(() => onEnd(summary), r.delayMs ?? 900);
    },
    [elapsed, onEnd],
  );

  return { stats, answer, startQuestion, end, elapsed };
}

/** Lit un texte à voix haute quand `key` change (si la lecture automatique est active). */
export function useAutoSpeak(
  speech: GameProps['speech'],
  text: string | null,
  key: unknown,
  enabled: boolean,
  lang?: string,
) {
  useEffect(() => {
    if (enabled && text) void speech.speak(text, { lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
}

/** Exécute une fonction quand la touche Entrée est pressée (hors champs de saisie). */
export function useEnterKey(fn: (() => void) | null) {
  useEffect(() => {
    if (!fn) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fn]);
}
