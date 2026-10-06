/**
 * Le Vrai ou Faux express (CATALOGUE n° 56) — toutes matières.
 * Une pile de cartes-affirmations : on glisse la carte à droite (VRAI) ou à gauche (FAUX), ou on
 * utilise les boutons, les flèches ← → ou les touches V / F. Les bonnes réponses enchaînées font
 * grimper le combo (×2 puis ×3).
 * Facile : 10 cartes, sans chrono, l'image aide. Normal : 3 sprints de 30 secondes, combo.
 * Plus loin : 3 sprints de 25 secondes, sans image, bonus ×1,5.
 * Après une erreur, le chrono s'arrête le temps de lire la correction (jamais de points retirés).
 */
import {
  AnimatePresence,
  type PanInfo,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, TrueFalseItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { useChronometre } from '../_monde-commun/hooks';
import { BarreTemps, EtatVide } from '../_monde-commun/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import { insecable } from '../_monde-commun/outils';
import { useVoixEnPause } from '../_orthographe-commun/hooks';

const CARTES: Record<Level, number> = { facile: 10, normal: 80, plus_loin: 80 };
const SPRINTS: Record<Level, number> = { facile: 1, normal: 3, plus_loin: 3 };
const CHRONO_S: Record<Level, number> = { facile: Infinity, normal: 30, plus_loin: 25 };
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };
const SEUIL = 90;

const estVF = (it: { kind: string }): it is TrueFalseItem => it.kind === 'true_false';

/** Multiplicateur de combo selon la série en cours. */
const combo = (serie: number) => (serie >= 6 ? 3 : serie >= 3 ? 2 : 1);

export default function VraiFaux({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, CARTES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduce = !!useReducedMotion();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): TrueFalseItem | null => {
    let it = tirerItem(stream, estVF);
    if (it && it.id === dernier.current && (stream.size ?? 2) > 1) it = tirerItem(stream, estVF) ?? it;
    if (it) dernier.current = it.id;
    return it;
  }, [stream]);

  const [item, setItem] = useState<TrueFalseItem | null>(tirer);
  const [n, setN] = useState(1);
  const [serie, setSerie] = useState(0);
  const [points, setPoints] = useState(0);
  const [justes, setJustes] = useState(0);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [donne, setDonne] = useState<boolean | null>(null);
  const [fini, setFini] = useState(false);
  const [sortie, setSortie] = useState(0);
  const [sprint, setSprint] = useState(1);
  const [entracte, setEntracte] = useState<number | null>(null);
  const debutSprint = useRef(0);
  const statsRef = useRef({ points: 0, justes: 0, n: 0 });
  statsRef.current = { points, justes, n };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const opVrai = useTransform(x, [20, SEUIL], [0, 1]);
  const opFaux = useTransform(x, [-SEUIL, -20], [1, 0]);

  const terminer = useCallback(() => {
    if (fini) return;
    setFini(true);
    sfx.play('fanfare');
    const s = statsRef.current;
    const reponses = s.n - (etat ? 0 : 1);
    session.end({
      won: s.justes >= Math.max(3, Math.ceil(reponses * 0.6)),
      headline: `${s.justes} bonne${s.justes > 1 ? 's' : ''} réponse${s.justes > 1 ? 's' : ''} express !`,
      score: s.points,
    });
  }, [fini, sfx, session, etat]);

  const finSprint = useCallback(() => {
    if (sprint >= SPRINTS[level]) {
      terminer();
      return;
    }
    sfx.play('etoile');
    setEntracte(statsRef.current.justes - debutSprint.current);
  }, [sprint, level, terminer, sfx]);

  const repartir = useCallback(() => {
    debutSprint.current = statsRef.current.justes;
    setSprint((k) => k + 1);
    setEntracte(null);
  }, []);

  const chrono = useChronometre({
    dureeS: CHRONO_S[level],
    actif: !fini && entracte === null && etat !== 'faux' && !!item,
    paused,
    onFin: finSprint,
    cle: sprint,
  });

  // Entracte : Entrée pour repartir
  useEffect(() => {
    if (entracte === null || paused) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        repartir();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [entracte, paused, repartir]);

  useEffect(() => {
    session.startQuestion();
    x.set(0);
    if (lectureAuto && item) void speech.speak(item.spoken ?? item.statement, { lang: item.lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, n]);

  const repondre = useCallback(
    (v: boolean) => {
      if (!item || etat || paused || fini || entracte !== null) return;
      const ok = v === item.answer;
      session.answer(item, ok, v ? 'vrai' : 'faux', item.answer ? 'vrai' : 'faux');
      setDonne(v);
      setSortie(v ? 1 : -1);
      if (ok) {
        const s = serie + 1;
        setSerie(s);
        setJustes((j) => j + 1);
        setPoints((p) => p + Math.round(10 * combo(s) * BONUS[level]));
        sfx.play(combo(s) > 1 ? 'piece' : 'juste');
        setEtat('juste');
      } else {
        setSerie(0);
        sfx.play('faux');
        vibrate(40);
        setEtat('faux');
      }
    },
    [item, etat, paused, fini, entracte, session, serie, level, sfx],
  );

  const suivant = useCallback(() => {
    if (fini) return;
    if (n >= total) {
      terminer();
      return;
    }
    x.set(0);
    setItem(tirer());
    setN((k) => k + 1);
    setEtat(null);
    setDonne(null);
    setSortie(0);
  }, [fini, n, total, terminer, tirer, x]);

  // Bonne réponse : la carte s'envole et la suivante arrive
  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, reduce ? 350 : 550);
    return () => clearTimeout(t);
  }, [etat, paused, suivant, reduce]);

  // Clavier : ← / F = faux, → / V = vrai
  useEffect(() => {
    if (etat || paused || fini) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'v') {
        e.preventDefault();
        repondre(true);
      } else if (k === 'arrowleft' || k === 'f') {
        e.preventDefault();
        repondre(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, fini, repondre]);

  const finGlisse = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SEUIL) repondre(true);
    else if (info.offset.x < -SEUIL) repondre(false);
  };

  if (!item) {
    return <EtatVide icone="✅" jeu="Le Vrai ou Faux express" besoin="d’affirmations vraies ou fausses" />;
  }

  const mult = combo(serie);
  const montrerImage = level !== 'plus_loin' && item.image;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          {Number.isFinite(CHRONO_S[level])
            ? `Sprint ${sprint} / ${SPRINTS[level]}`
            : `Carte ${n} / ${total}`}
        </Hud>
        <Hud className={mult > 1 ? 'bg-sun' : ''}>
          <span aria-hidden>🔥</span> Combo ×{mult}
        </Hud>
        <Hud>
          <span aria-hidden>⭐</span> {points} pts
        </Hud>
      </div>
      {Number.isFinite(CHRONO_S[level]) && (
        <div className="flex w-full items-center gap-2">
          <span className="w-12 shrink-0 whitespace-nowrap font-titre font-bold tabular-nums" aria-hidden>
            {Math.ceil(chrono.restantMs / 1000)} s
          </span>
          <BarreTemps fraction={chrono.fraction} label="Temps restant" />
        </div>
      )}

      {/* La pile de cartes */}
      <div className="relative w-full max-w-md" style={{ minHeight: '17rem' }}>
        {/* cartes dessous (décor) */}
        <div
          className="absolute inset-x-4 top-4 h-60 rotate-2 rounded-card bg-white/60 shadow-soft"
          aria-hidden
        />
        <div
          className="absolute inset-x-2 top-2 h-60 -rotate-1 rounded-card bg-white/80 shadow-soft"
          aria-hidden
        />
        <AnimatePresence mode="popLayout" custom={sortie}>
          <motion.div
            key={`${n}-${item.id}`}
            className="carte absolute inset-x-0 top-0 flex min-h-[15rem] cursor-grab touch-pan-y flex-col items-center justify-center gap-3 p-5 text-center active:cursor-grabbing"
            style={{ x, rotate }}
            drag={etat || paused || fini ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={finGlisse}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={
              etat === 'juste' && !reduce
                ? { x: sortie * 420, opacity: 0, rotate: sortie * 20 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.35 }}
            aria-live="polite"
          >
            <motion.span
              className="absolute left-4 top-4 rounded-xl border-4 border-grass px-2 font-titre text-xl font-extrabold text-grass-dark"
              style={{ opacity: opVrai, rotate: -12 }}
              aria-hidden
            >
              VRAI
            </motion.span>
            <motion.span
              className="absolute right-4 top-4 rounded-xl border-4 border-coral px-2 font-titre text-xl font-extrabold text-coral-dark"
              style={{ opacity: opFaux, rotate: 12 }}
              aria-hidden
            >
              FAUX
            </motion.span>
            {montrerImage && (
              <span className="text-6xl" aria-hidden>
                {item.image}
              </span>
            )}
            <p className="font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
              {insecable(item.statement)}
            </p>
            <SpeakButton
              text={item.spoken ?? item.statement}
              lang={item.lang}
              label="Écouter l’affirmation"
              size={44}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-sm font-bold text-ink-soft">
        Glisse la carte, touche un bouton, ou utilise les flèches ← → (ou F et V).
      </p>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => repondre(false)}
          disabled={!!etat || paused || fini}
          className={`btn-3d flex min-h-[4.5rem] items-center justify-center gap-2 bg-coral text-2xl font-extrabold text-white ${
            etat && donne === false
              ? item.answer === false
                ? 'ring-4 ring-grass'
                : 'ring-4 ring-ink/40'
              : ''
          }`}
        >
          <ThumbsDown aria-hidden /> Faux
        </button>
        <button
          type="button"
          onClick={() => repondre(true)}
          disabled={!!etat || paused || fini}
          className={`btn-3d flex min-h-[4.5rem] items-center justify-center gap-2 bg-grass-dark text-2xl font-extrabold text-white ${
            etat && donne === true ? (item.answer ? 'ring-4 ring-sun' : 'ring-4 ring-ink/40') : ''
          }`}
        >
          Vrai <ThumbsUp aria-hidden />
        </button>
      </div>

      <AnimatePresence>
        {entracte !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-label={`Fin du sprint ${sprint}`}
          >
            <div className="carte flex max-w-sm flex-col items-center gap-3 p-6 text-center">
              <span className="text-5xl" aria-hidden>
                ⏱️
              </span>
              <p className="font-titre text-2xl font-extrabold">Sprint {sprint} terminé !</p>
              <p className="text-lg">
                {entracte} bonne{entracte > 1 ? 's' : ''} réponse{entracte > 1 ? 's' : ''} pendant ce sprint.
              </p>
              <Button variant="grass" size="lg" onClick={repartir} autoFocus>
                Sprint {sprint + 1}, c’est parti !
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md">
        {etat === 'juste' && (
          <Feedback state="juste" message={mult > 1 ? `Bravo ! Combo ×${mult} 🔥` : 'Bravo !'} />
        )}
        {etat === 'faux' && (
          <Feedback
            state="faux"
            message="Presque !"
            expected={item.answer ? 'C’est vrai.' : 'C’est faux.'}
            explication={item.explication}
            onContinue={suivant}
          />
        )}
      </div>
    </div>
  );
}
