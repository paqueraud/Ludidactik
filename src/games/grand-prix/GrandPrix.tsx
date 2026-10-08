/**
 * ⭐ Le Grand Prix — course de chevaux en calcul mental (CATALOGUE n°1).
 * La course avance au rythme des bonnes réponses : plus l'enfant répond vite et juste, plus il
 * franchit tôt la ligne d'arrivée, face à 2 chevaux-bots et au fantôme de son record.
 * Le chrono de course est figé pendant la lecture d'une correction (on prend le temps de comprendre).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/avatar/Avatar';
import { Keypad, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import { itemKey } from '@/content/provider';
import type { Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { type MotifRobe, robeParId } from '@/meta/robes';
import { vibrate } from '@/services/sfx';
import { type Gait, Horse } from './Horse';

const TOURS: Record<Level, number> = { facile: 6, normal: 12, plus_loin: 20 };
/** Temps par bonne réponse des chevaux-bots (ms). */
const BOTS: Record<Level, [number, number]> = {
  facile: [18000, 13000],
  normal: [12000, 8000],
  plus_loin: [6500, 4500],
};
/** Seuil du « turbo » (réponse rapide). */
const TURBO: Record<Level, number> = { facile: 5000, normal: 3500, plus_loin: 2500 };

interface Runner {
  id: string;
  nom: string;
  robe: string;
  criniere: string;
  tapis: string;
  motif?: MotifRobe;
  motifCouleur?: string;
}
type Monture = Omit<Runner, 'id' | 'nom'>;
const BOT_RUNNERS: Runner[] = [
  { id: 'tonnerre', nom: 'Tonnerre', robe: '#5D4037', criniere: '#2B1D14', tapis: '#4FC3F7' },
  { id: 'comete', nom: 'Comète', robe: '#ECEFF1', criniere: '#B0BEC5', tapis: '#8E7CFF' },
];

type Feedback =
  { type: 'turbo' | 'juste' } | { type: 'faux'; item: NumericItem; given: string; hint?: string } | null;

/** Position du fantôme à l'instant t : bonnes réponses passées + interpolation vers la suivante. */
function ghostProgress(ghost: number[], t: number, n: number): number {
  let i = 0;
  while (i < ghost.length && ghost[i]! <= t) i++;
  if (i >= n || i >= ghost.length) return Math.min(1, i / n);
  const prev = i === 0 ? 0 : ghost[i - 1]!;
  const frac = (t - prev) / Math.max(1, ghost[i]! - prev);
  return Math.min(1, (i + frac) / n);
}

export default function GrandPrix({
  lesson,
  level,
  profile,
  stream,
  record,
  lectureAuto,
  target,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const N = TOURS[level];
  const [item, setItem] = useState(() => stream.next(target()) as NumericItem);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [gait, setGait] = useState<Gait>('arret');
  const [stumble, setStumble] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [commentaire, setCommentaire] = useState('Et les voilà partis !');
  const [done, setDone] = useState(false);

  const clock = useRef(0); // temps de course (ms), hors pauses et corrections
  const running = useRef(true);
  const questionStart = useRef(0);
  const times = useRef<number[]>([]);
  const total = useRef(0);
  const [, setFrame] = useState(0);

  const ghost = record?.ghost && record.ghost.length >= N ? record.ghost : null;

  // Horloge de course
  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(100, now - last));
      last = now;
      if (running.current && !paused && !done) clock.current += dt;
      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, done]);

  // Lecture de l'énoncé
  useEffect(() => {
    if (lectureAuto && !paused) void speech.speak(item.spoken);
  }, [item, lectureAuto, paused, speech]);

  const nextItem = useCallback(() => {
    setItem(stream.next(target()) as NumericItem);
    setInput('');
    questionStart.current = clock.current;
    running.current = true;
  }, [stream, target]);

  const finish = useCallback(
    (finished: boolean) => {
      setDone(true);
      running.current = false;
      const t = clock.current;
      const others = [N * BOTS[level][0], N * BOTS[level][1], ...(ghost ? [ghost[N - 1]!] : [])];
      const rank = finished ? 1 + others.filter((o) => o < t).length : others.length + 1;
      const headline = !finished
        ? 'Fin de la course !'
        : rank === 1
          ? 'Victoire ! 🥇'
          : rank === 2
            ? '2e place ! 🥈'
            : rank === 3
              ? '3e place ! 🥉'
              : 'Arrivée ! Bravo !';
      sfx.play(finished ? 'fanfare' : 'pop');
      setTimeout(
        () =>
          onEnd({
            correct: times.current.length,
            total: total.current,
            durationMs: Math.round(t),
            score: finished ? Math.max(1, 100_000 - Math.round(t / 10)) : times.current.length,
            won: finished && rank === 1,
            headline,
            ghost: finished ? times.current : undefined,
          }),
        1400,
      );
    },
    [N, level, ghost, onEnd, sfx],
  );

  const submit = useCallback(() => {
    if (done || feedback?.type === 'faux' || !input.trim()) return;
    const check = checkNumeric(input, item.answer, { tolerateZeros: level === 'facile', unit: item.unit });
    const ms = clock.current - questionStart.current;
    total.current++;
    onAnswer({
      itemId: item.id,
      itemKey: itemKey(item),
      correct: check.correct,
      ms,
      given: input,
      expected: formatNumber(item.answer),
    });
    if (check.correct) {
      times.current.push(clock.current);
      const c = correct + 1;
      setCorrect(c);
      const turbo = ms < TURBO[level];
      setGait(turbo ? 'galop' : ms < TURBO[level] * 2.2 ? 'trot' : 'pas');
      sfx.play(turbo ? 'turbo' : 'galop');
      setFeedback({ type: turbo ? 'turbo' : 'juste' });
      // Commentaire de course
      const me = c / N;
      const bots = BOT_RUNNERS.map((b, i) => ({ nom: b.nom, p: clock.current / (N * BOTS[level][i]!) }));
      const leader = bots.reduce((a, b) => (b.p > a.p ? b : a));
      setCommentaire(
        turbo
          ? 'Turbo ! Ton cheval s’envole !'
          : me >= leader.p
            ? 'Et ton cheval passe en tête !'
            : `Allez, rattrape ${leader.nom} !`,
      );
      setTimeout(() => setFeedback(null), 700);
      if (c >= N) finish(true);
      else if (total.current >= 2 * N) finish(false);
      else nextItem();
    } else {
      running.current = false; // on fige la course pendant la correction
      sfx.play('faux');
      vibrate(60);
      setStumble(true);
      setGait('arret');
      setTimeout(() => setStumble(false), 800);
      setFeedback({ type: 'faux', item, given: input, hint: check.hint });
    }
  }, [done, feedback, input, item, level, correct, N, onAnswer, sfx, finish, nextItem]);

  const continuer = useCallback(() => {
    setFeedback(null);
    if (total.current >= 2 * N) finish(false);
    else nextItem();
  }, [N, finish, nextItem]);

  const keyHandlers = {
    onKey: (k: string) => !done && feedback?.type !== 'faux' && setInput((v) => (v.length < 12 ? v + k : v)),
    onDelete: () => setInput((v) => v.slice(0, -1)),
    onSubmit: () => (feedback?.type === 'faux' ? continuer() : submit()),
    disabled: paused || done,
  };
  usePhysicalKeyboard(keyHandlers, /[0-9,.]/, { pointEnVirgule: true });

  // Retour à l'allure de base si l'enfant réfléchit longtemps
  const elapsed = clock.current - questionStart.current;
  const displayedGait: Gait = done
    ? 'arret'
    : feedback?.type === 'faux'
      ? 'arret'
      : elapsed > TURBO[level] * 3 && gait !== 'arret'
        ? 'pas'
        : gait;

  const t = clock.current;
  const lanes = [
    ...(ghost
      ? [
          {
            key: 'ghost',
            nom: 'Ton record',
            p: ghostProgress(ghost, t, N),
            runner: { robe: '#B0BEC5', criniere: '#90A4AE', tapis: '#fff' } as Monture,
            ghost: true,
          },
        ]
      : []),
    {
      key: BOT_RUNNERS[0]!.id,
      nom: BOT_RUNNERS[0]!.nom,
      p: Math.min(1, t / (N * BOTS[level][0])),
      runner: BOT_RUNNERS[0]!,
      ghost: false,
    },
    {
      key: 'moi',
      nom: profile.prenom,
      p: correct / N,
      runner: { ...robeParId(profile.robe), tapis: profile.avatar.haut } as Monture,
      ghost: false,
      moi: true,
    },
    {
      key: BOT_RUNNERS[1]!.id,
      nom: BOT_RUNNERS[1]!.nom,
      p: Math.min(1, t / (N * BOTS[level][1])),
      runner: BOT_RUNNERS[1]!,
      ghost: false,
    },
  ];

  const turboLeft = Math.max(0, 1 - elapsed / (TURBO[level] * 2.2));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      {/* Piste */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white bg-[#7BC96F] shadow-soft"
        aria-label="Course"
      >
        <div className="flex items-center justify-between bg-[#5DAE53] px-3 py-1 text-sm font-bold text-white">
          <span>
            🏁 {correct} / {N}
          </span>
          <motion.span
            key={commentaire}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
          >
            🎙️ {commentaire}
          </motion.span>
        </div>
        <div className="relative bg-[#C9965B] px-2 py-1">
          {/* ligne d'arrivée */}
          <div
            className="absolute inset-y-0 right-10 w-4 opacity-90"
            style={{
              backgroundImage: 'repeating-conic-gradient(#fff 0 25%, #24304A 0 50%)',
              backgroundSize: '8px 8px',
            }}
            aria-hidden
          />
          {lanes.map((lane) => (
            <div
              key={lane.key}
              className="relative h-[60px] border-b-2 border-dashed border-white/60 last:border-b-0 sm:h-[84px]"
            >
              <span
                className={`absolute left-1 top-0.5 z-10 rounded-full px-2 text-xs font-bold ${'moi' in lane && lane.moi ? 'bg-sun text-ink' : 'bg-white/70 text-ink'}`}
              >
                {'moi' in lane && lane.moi ? `Toi (${lane.nom})` : lane.nom}
              </span>
              <div className="absolute inset-y-0 left-0 right-[64px] sm:right-[96px]">
                <motion.div
                  className="absolute bottom-0 left-0"
                  animate={{ left: `${lane.p * 100}%` }}
                  transition={
                    'moi' in lane && lane.moi
                      ? { type: 'spring', stiffness: 60, damping: 14 }
                      : { duration: 0.1, ease: 'linear' }
                  }
                >
                  <Horse
                    robe={lane.runner.robe}
                    criniere={lane.runner.criniere}
                    tapis={lane.runner.tapis}
                    motif={lane.runner.motif}
                    motifCouleur={lane.runner.motifCouleur}
                    ghost={lane.ghost}
                    gait={
                      'moi' in lane && lane.moi
                        ? displayedGait
                        : done || paused || feedback?.type === 'faux' || lane.p >= 1
                          ? 'arret'
                          : 'galop'
                    }
                    stumble={'moi' in lane && lane.moi && stumble}
                    rider={
                      'moi' in lane && lane.moi ? (
                        <Avatar config={profile.avatar} size={44} compagnon={false} />
                      ) : undefined
                    }
                  />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {feedback?.type === 'turbo' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="rounded-full bg-sun px-6 py-2 font-titre text-3xl font-extrabold shadow-pop">
                ⚡ TURBO !
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Question + pavé */}
      <section className="grid gap-3 md:grid-cols-2">
        <div className="carte flex flex-col items-center justify-center gap-3 p-5 text-center">
          <div className="flex items-center gap-3">
            <p className="font-titre text-4xl font-extrabold sm:text-5xl" aria-live="polite">
              {item.prompt}
            </p>
            <SpeakButton text={item.spoken} label="Écouter le calcul" />
          </div>
          <div
            className={`flex h-16 min-w-[10rem] items-center justify-center rounded-2xl border-4 px-4 font-titre text-4xl font-extrabold ${
              feedback?.type === 'faux'
                ? 'border-coral bg-coral/10'
                : feedback
                  ? 'border-grass bg-grass/15'
                  : 'border-sky bg-cream'
            }`}
            aria-label={`Ta réponse : ${input || 'vide'}`}
          >
            {input || <span className="animate-pulse text-ink/25">?</span>}
          </div>
          {level !== 'facile' && !feedback && (
            <div className="w-full max-w-xs" aria-hidden>
              <div className="mb-1 flex items-center gap-1 text-xs font-bold text-ink-soft">
                <Zap size={14} className="fill-sun text-sun-dark" /> Turbo
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full rounded-full ${turboLeft > 0.55 ? 'bg-grass' : turboLeft > 0.2 ? 'bg-sun' : 'bg-coral'}`}
                  style={{ width: `${turboLeft * 100}%` }}
                />
              </div>
            </div>
          )}
          <AnimatePresence>
            {feedback?.type === 'faux' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl bg-coral/10 p-4 text-left"
                role="status"
              >
                <p className="text-lg font-bold">
                  Presque ! La bonne réponse est{' '}
                  <span className="text-grass-dark">{formatNumber(feedback.item.answer)}</span>.
                </p>
                {feedback.hint && <p className="mt-1">{feedback.hint}</p>}
                <div className="mt-2 flex items-start gap-2">
                  <SpeakButton
                    text={`La bonne réponse est ${formatNumber(feedback.item.answer).replace(',', ' virgule ')}. ${feedback.item.explication}`}
                    size={40}
                  />
                  <p>{feedback.item.explication}</p>
                </div>
                <Button variant="grass" className="mt-3 w-full" onClick={continuer} autoFocus>
                  Continuer la course
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center">
          <Keypad {...keyHandlers} decimal={item.decimals > 0 || lesson.classe === 'CM2'} />
        </div>
      </section>
    </div>
  );
}
