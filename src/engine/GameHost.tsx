/**
 * Cycle de vie d'une partie : consigne lue à voix haute → 3-2-1 → jeu (pause, abandon) → bilan
 * (étoiles, XP, Ludis, record) → persistance. Le jeu lui-même ne s'occupe que de sa mécanique.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Confetti } from '@/components/Confetti';
import { PauseDouce } from '@/components/PauseDouce';
import { Sky } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button, LudiCoin, SpeakButton, Stars } from '@/components/ui';
import { content, getLesson } from '@/content';
import { LEVEL_META } from '@/content/meta';
import { type ItemStream, type ProviderContext, createStream } from '@/content/provider';
import { LEVELS, type Level } from '@/content/schemas';
import { gamesForLesson, getGame } from '@/games/registry';
import { NotificationsMeta } from '@/meta/NotificationsMeta';
import { type ApresPartie, apresPartie } from '@/services/meta';
import { useCurrentProfile } from '@/services/profiles';
import { type SavedResult, dueItems, saveGameResult, updateLeitner } from '@/services/results';
import { addPlayTime, useLimitStatus } from '@/services/screenTime';
import { musique } from '@/services/musique';
import { sfx, vibrate } from '@/services/sfx';
import { speech } from '@/services/speech';
import { type ParentWordList, type RecordRow, db, progressKey } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { Adaptivity } from './adaptivity';
import type { AnswerEvent, GameSummary } from './GameModule';
import { createRng } from './rng';
import { computeStars, xpForAnswer } from './score';

type Phase = 'chargement' | 'consigne' | 'decompte' | 'jeu' | 'bilan';

export function GameHost() {
  const { lessonId = '', gameId = '', level: levelParam = 'normal' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  /** Partie lancée depuis un écran du méta-jeu (défis du jour) : on y revient à la fin. */
  const retourMeta = (location.state as { retour?: string; retourLabel?: string } | null) ?? null;
  const profile = useCurrentProfile();
  const lectureAutoSetting = useSettings((s) => s.lectureAuto);
  const afficherPuberte = useSettings((s) => s.puberte);
  const limite = useLimitStatus(profile);
  const lesson = getLesson(lessonId);
  const game = getGame(gameId);
  const level = (LEVELS as readonly string[]).includes(levelParam) ? (levelParam as Level) : 'normal';

  const [phase, setPhase] = useState<Phase>('chargement');
  const [ctx, setCtx] = useState<ProviderContext | null>(null);
  const [record, setRecord] = useState<RecordRow | null>(null);
  const [partie, setPartie] = useState(0);
  const [paused, setPaused] = useState(false);
  const [bilan, setBilan] = useState<{
    summary: GameSummary;
    saved: SavedResult;
    erreurs: AnswerEvent[];
    meta: ApresPartie | null;
  } | null>(null);

  const lectureAuto =
    lectureAutoSetting === 'oui' ||
    (lectureAutoSetting === 'auto' && (profile?.classe === 'CE1' || profile?.classe === 'CP'));
  const backUrl =
    retourMeta?.retour ??
    (lesson ? `/jouer/${lesson.classe}/${lesson.matiere}/${encodeURIComponent(lesson.id)}` : '/jouer');

  // Chargement : listes parentales, items à revoir, record
  useEffect(() => {
    if (!profile || !lesson || !game) return;
    let cancelled = false;
    (async () => {
      const lists = (await db.wordLists.toArray()).filter(
        (l: ParentWordList) => l.profileIds.length === 0 || l.profileIds.includes(profile.id),
      );
      const aRevoir = await dueItems(profile.id);
      const rec = (await db.records.get(progressKey(profile.id, lesson.id, game.id, level))) ?? null;
      if (cancelled) return;
      setCtx({ parentLists: lists, aRevoir, masquerPuberte: !afficherPuberte });
      setRecord(rec);
      setPhase((p) => (p === 'chargement' ? 'consigne' : p));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, lesson?.id, game?.id, level, partie, afficherPuberte]);

  const kind = useMemo(
    () => (lesson && ctx ? gamesForLesson(lesson, ctx).find((g) => g.game.id === gameId)?.kind : undefined),
    [lesson, ctx, gameId],
  );

  // Suivi de la partie
  const adaptivity = useRef(new Adaptivity());
  const stats = useRef({ correct: 0, total: 0, streak: 0, xp: 0, erreurs: [] as AnswerEvent[] });
  const [stream, setStream] = useState<ItemStream | null>(null);

  const startGame = useCallback(() => {
    if (!lesson || !game || !ctx || !kind) return;
    adaptivity.current = new Adaptivity(level === 'facile' ? 0.3 : 0.45);
    stats.current = { correct: 0, total: 0, streak: 0, xp: 0, erreurs: [] };
    setStream(createStream(content, lesson, kind, level, createRng(Date.now()), ctx, game.filterItem));
    setPhase('decompte');
  }, [lesson, game, ctx, kind, level]);

  // Musique de fond : s'efface pendant la partie (sauf réglage « Garder la musique pendant les parties »)
  const musiqueEnJeu = useSettings((s) => s.musiqueEnJeu);
  useEffect(() => {
    musique.silence('partie', !musiqueEnJeu);
    return () => musique.silence('partie', false);
  }, [musiqueEnJeu]);

  // Consigne lue automatiquement
  useEffect(() => {
    if (phase === 'consigne' && game && lectureAuto) void speech.speak(game.consigne);
    return () => speech.stop();
  }, [phase, game, lectureAuto]);

  // Décompte 3-2-1
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (phase !== 'decompte') return;
    setCount(3);
    sfx.play('tic');
    let n = 3;
    const t = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(t);
        sfx.play('juste');
        setPhase('jeu');
      } else {
        sfx.play('tic');
        setCount(n);
      }
    }, 800);
    return () => clearInterval(t);
  }, [phase]);

  const onAnswer = useCallback(
    (e: AnswerEvent) => {
      const s = stats.current;
      s.total++;
      if (e.correct) {
        s.correct++;
        s.streak++;
      } else {
        s.streak = 0;
        s.erreurs.push(e);
      }
      s.xp += xpForAnswer(e.correct, s.streak, level);
      adaptivity.current.record(e.correct);
      if (profile) void updateLeitner(profile.id, e.itemKey, e.correct, undefined, lesson?.id);
    },
    [level, profile, lesson?.id],
  );

  const onEnd = useCallback(
    async (summary: GameSummary) => {
      if (!profile || !lesson || !game) return;
      speech.stop();
      const stars = computeStars(
        summary.correct,
        summary.total,
        summary.durationMs,
        game.dureeCible * 1000,
        level,
      );
      const saved = await saveGameResult({
        profileId: profile.id,
        lessonId: lesson.id,
        gameId: game.id,
        level,
        summary,
        stars,
        xp: stats.current.xp,
      });
      // Méta-jeu : défi du jour validé, gemme de l'île, badges (une erreur ici ne bloque jamais le bilan)
      const meta = await apresPartie({
        profileId: profile.id,
        lessonId: lesson.id,
        gameId: game.id,
        stars,
      }).catch(() => null);
      setBilan({ summary, saved, erreurs: stats.current.erreurs.slice(-5), meta });
      setPhase('bilan');
    },
    [profile, lesson, game, level],
  );

  const target = useCallback(() => adaptivity.current.target, []);

  // Temps d'écran : on compte le temps de jeu réel (hors pause, hors onglet masqué).
  const profileId = profile?.id;
  const actif = phase === 'jeu' && !paused && !!profileId;
  useEffect(() => {
    if (!actif || !profileId) return;
    let last = document.visibilityState === 'visible' ? Date.now() : null;
    const flush = () => {
      if (last === null) return;
      const now = Date.now();
      // plafond de sécurité (veille de l'appareil entre deux relevés)
      void addPlayTime(profileId, Math.min(now - last, 60_000));
      last = now;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') last = Date.now();
      else {
        flush();
        last = null;
      }
    };
    const t = setInterval(flush, 15_000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [actif, profileId]);

  // Limite atteinte : jamais de coupure en pleine partie, la pause douce s'affiche avant la suivante.
  const limiteAtteinte = !!limite?.reached;
  if (profile && limiteAtteinte && (phase === 'chargement' || phase === 'consigne'))
    return <PauseDouce profile={profile} usedMs={limite?.usedMs ?? 0} onQuit={() => navigate('/')} />;

  if (!lesson || !game) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Sky />
        <Ludo pose="pense" size={120} />
        <p className="text-xl">Oups, ce jeu est introuvable.</p>
        <Button onClick={() => navigate('/jouer')}>Retour aux leçons</Button>
      </div>
    );
  }

  const Game = game.component;
  const levelMeta = LEVEL_META[level];

  return (
    <div className="relative min-h-dvh">
      <Sky hills={phase !== 'jeu'} />
      {phase === 'jeu' && profile && stream && kind && (
        <>
          <div className="sticky top-0 z-30 flex items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-soft"
              aria-label="Pause"
              onClick={() => {
                speech.stop();
                setPaused(true);
              }}
            >
              <Pause size={24} aria-hidden />
            </button>
            <span className="truncate rounded-full bg-card/90 px-3 py-1 font-titre font-bold shadow-soft">
              {game.icone} {game.titre}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold text-white ${levelMeta.couleur}`}>
              {levelMeta.icone} {levelMeta.court}
            </span>
          </div>
          <Suspense fallback={<div className="p-10 text-center text-xl">Chargement du jeu…</div>}>
            <Game
              key={partie}
              lesson={lesson}
              level={level}
              profile={profile}
              stream={stream}
              kind={kind}
              record={record}
              lectureAuto={lectureAuto}
              target={target}
              paused={paused}
              onAnswer={onAnswer}
              onEnd={onEnd}
              speech={speech}
              sfx={sfx}
            />
          </Suspense>
        </>
      )}

      {phase === 'chargement' && <div className="p-10 text-center text-xl">Préparation de la partie…</div>}

      {phase === 'consigne' && (
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-4 py-8 text-center">
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-[32px] bg-gradient-to-br text-6xl shadow-pop ${game.couleur}`}
            aria-hidden
          >
            {game.icone}
          </div>
          <h1 className="text-4xl sm:text-5xl">{game.titre}</h1>
          <span className={`rounded-full px-4 py-1 font-bold text-white ${levelMeta.couleur}`}>
            {levelMeta.icone} {levelMeta.label}
          </span>
          <div className="carte flex items-start gap-3 p-5 text-left text-lg">
            <SpeakButton text={game.consigne} label="Écouter la consigne" />
            <p>{game.consigne}</p>
          </div>
          <p className="text-ink-soft">{lesson.titre}</p>
          {!kind ? (
            <p className="text-coral-dark">Pas encore assez de contenu pour ce jeu dans cette leçon.</p>
          ) : (
            <Button size="xl" variant="grass" onClick={startGame} autoFocus>
              C’est parti !
            </Button>
          )}
          <Button variant="fantome" onClick={() => navigate(backUrl)}>
            Choisir un autre jeu
          </Button>
        </div>
      )}

      {phase === 'decompte' && (
        <div className="flex min-h-dvh items-center justify-center" aria-live="assertive">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={count}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="font-titre text-[10rem] font-extrabold text-ink drop-shadow-lg"
            >
              {count}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === 'bilan' && bilan && (
        <Bilan
          {...bilan}
          level={level}
          limiteAtteinte={limiteAtteinte}
          onPauseDouce={() => setPhase('consigne')}
          onReplay={() => {
            setBilan(null);
            setPartie((p) => p + 1);
            startGame();
          }}
          onNextLevel={
            level !== 'plus_loin' && bilan.saved.stars >= 2
              ? () =>
                  navigate(
                    `/partie/${encodeURIComponent(lesson.id)}/${game.id}/${LEVELS[LEVELS.indexOf(level) + 1]}`,
                    { replace: true, state: retourMeta },
                  )
              : undefined
          }
          onQuit={() => navigate(backUrl)}
          quitLabel={retourMeta?.retourLabel}
        />
      )}

      {paused && phase === 'jeu' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label="Pause"
        >
          <div className="carte flex w-full max-w-sm flex-col items-stretch gap-3 p-6 text-center">
            <Ludo pose="calme" size={90} className="mx-auto" />
            <h2 className="text-3xl">Pause</h2>
            <Button
              variant="grass"
              size="lg"
              icon={<Play aria-hidden />}
              onClick={() => setPaused(false)}
              autoFocus
            >
              Reprendre
            </Button>
            {!limiteAtteinte && (
              <Button
                variant="sun"
                icon={<RotateCcw aria-hidden />}
                onClick={() => {
                  setPaused(false);
                  setPartie((p) => p + 1);
                  startGame();
                }}
              >
                Recommencer
              </Button>
            )}
            <Button variant="blanc" icon={<X aria-hidden />} onClick={() => navigate(backUrl)}>
              Quitter la partie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Bilan({
  summary,
  saved,
  erreurs,
  meta,
  level,
  limiteAtteinte,
  onPauseDouce,
  onReplay,
  onNextLevel,
  onQuit,
  quitLabel = 'Autres jeux',
}: {
  summary: GameSummary;
  saved: SavedResult;
  erreurs: AnswerEvent[];
  meta: ApresPartie | null;
  level: Level;
  limiteAtteinte: boolean;
  onPauseDouce(): void;
  onReplay(): void;
  onNextLevel?: () => void;
  onQuit(): void;
  quitLabel?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (summary.won || saved.stars > 0) {
      sfx.play('fanfare');
      vibrate([60, 60, 120]);
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i > saved.stars) return clearInterval(t);
      setShown(i);
      sfx.play('etoile');
    }, 450);
    const phrase = `${summary.headline} Tu as ${summary.correct} bonne${summary.correct > 1 ? 's' : ''} réponse${summary.correct > 1 ? 's' : ''}.`;
    void speech.speak(phrase);
    return () => clearInterval(t);
  }, [saved.stars, summary]);

  const pct = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
  const encouragement =
    saved.stars === 3
      ? 'Parfait ! Tu es un champion !'
      : saved.stars === 2
        ? 'Très bien ! Encore un effort pour la 3e étoile.'
        : saved.stars === 1
          ? 'Bien joué ! Tu progresses.'
          : 'Courage ! Chaque partie te rend plus fort.';

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      {(summary.won || saved.stars >= 2) && <Confetti />}
      <Ludo pose={saved.stars >= 2 ? 'joie' : 'calme'} size={110} />
      <h1 className="text-4xl sm:text-5xl">{summary.headline}</h1>
      <div className="flex gap-2" aria-label={`${saved.stars} étoiles sur 3`}>
        {[1, 2, 3].map((i) =>
          i <= saved.stars ? (
            <motion.div
              key={i}
              initial={{ y: -80, opacity: 0, rotate: -40 }}
              animate={i <= shown ? { y: 0, opacity: 1, rotate: 0 } : {}}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <Stars value={1} max={1} size={64} />
            </motion.div>
          ) : (
            <Stars key={i} value={0} max={1} size={64} />
          ),
        )}
      </div>
      <p className="text-xl font-bold">{encouragement}</p>
      <div className="carte grid w-full grid-cols-3 gap-2 p-4">
        <div>
          <div className="font-titre text-3xl font-extrabold">{pct} %</div>
          <div className="text-sm text-ink-soft">
            {summary.correct} / {summary.total} justes
          </div>
        </div>
        <div>
          <div className="font-titre text-3xl font-extrabold text-grape">+{saved.xp}</div>
          <div className="text-sm text-ink-soft">XP</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 font-titre text-3xl font-extrabold">
            <LudiCoin size={28} />+{saved.ludis}
          </div>
          <div className="text-sm text-ink-soft">Ludis</div>
        </div>
      </div>
      {saved.newRecord && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          className="rounded-full bg-sun px-6 py-2 font-titre text-2xl font-extrabold shadow-pop"
        >
          🏆 Nouveau record !
        </motion.div>
      )}
      {meta && <NotificationsMeta meta={meta} />}
      {erreurs.length > 0 && (
        <div className="carte w-full p-4 text-left">
          <h2 className="mb-2 text-xl">À revoir</h2>
          <ul className="space-y-1">
            {erreurs.map((e, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span className="text-ink-soft line-through decoration-coral">{e.given || '—'}</span>
                <span aria-hidden>→</span>
                <span className="font-bold text-grass-dark">{e.expected}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {limiteAtteinte ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold">Tu as bien joué aujourd’hui : c’était la dernière partie !</p>
          <Button variant="grass" size="lg" onClick={onPauseDouce}>
            Continuer
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="grass" size="lg" icon={<RotateCcw aria-hidden />} onClick={onReplay}>
            Rejouer
          </Button>
          {onNextLevel && (
            <Button variant="grape" size="lg" onClick={onNextLevel}>
              {LEVEL_META[LEVELS[LEVELS.indexOf(level) + 1]!].icone} Niveau suivant ?
            </Button>
          )}
          <Button variant="blanc" size="lg" onClick={onQuit}>
            {quitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
