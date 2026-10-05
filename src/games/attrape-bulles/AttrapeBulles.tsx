/**
 * L'Attrape-Bulles (CATALOGUE n°57, repris de la maquette « Écolier Champion »).
 * Une question s'affiche ; des bulles portant les réponses montent dans un lagon. On touche la bonne
 * avant qu'elle ne s'échappe. Combo ×2 / ×3 pour les bonnes réponses enchaînées.
 * Facile : bulles lentes, la bonne revient tant qu'on ne l'a pas attrapée. Normal : 2 vagues.
 * Plus loin : bulles rapides, une seule vague.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import type { Rng } from '@/engine/rng';
import { parNiveau, useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import {
  LETTRES,
  bravo,
  choixNumeriques,
  dansUnChamp,
  indexTouche,
  tirer,
  useBoucle,
  useRng,
} from '../_nombres-commun/outils';
import { Bandeau, Correction, PasDeQuestion } from '../_nombres-commun/ui';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
/** Vitesse de montée (hauteur de l'arène par seconde). */
const VITESSE: Record<Level, number> = { facile: 0.085, normal: 0.12, plus_loin: 0.17 };
/** Nombre de vagues avant que la bonne bulle ne soit perdue (Infinity = elle revient toujours). */
const VAGUES: Record<Level, number> = { facile: Infinity, normal: 2, plus_loin: 1 };

const TEINTES = [
  ['#7FD8FF', '#2FA5E0'],
  ['#FFB0A6', '#F0655A'],
  ['#FFE38A', '#E8B020'],
  ['#A8EBB2', '#45B85A'],
  ['#C7BCFF', '#7A66F0'],
  ['#FFC4E6', '#E266AE'],
] as const;

interface Question {
  item: Item;
  texte: string;
  aDire: string;
  lang?: string;
  image?: string;
  choix: string[];
  bonne: number;
}

interface Bulle {
  id: number;
  choix: number;
  x: number; // centre, en % de la largeur
  y: number; // 0 = bas de l'arène, 1 = haut ; démarre sous l'arène
  vitesse: number;
  phase: number;
  etat: 'vole' | 'juste' | 'faux';
}

type Etat = { type: 'jeu' } | { type: 'juste' } | { type: 'faux'; choix: number | null } | { type: 'fin' };

function versQuestion(it: Item, rng: Rng, level: Level): Question | null {
  if (it.kind === 'mcq') {
    return {
      item: it,
      texte: it.question,
      aDire: it.spoken ?? it.question,
      lang: it.lang,
      image: it.image,
      choix: it.choices,
      bonne: it.answerIndex,
    };
  }
  if (it.kind === 'numeric_answer') {
    const { choix, bonne } = choixNumeriques(
      it,
      rng,
      parNiveau(level, { facile: 3, normal: 4, plus_loin: 5 }),
    );
    return {
      item: it,
      texte: `${it.prompt}${/[=?…]/.test(it.prompt) ? '' : ' = ?'}`,
      aDire: it.spoken,
      choix,
      bonne,
    };
  }
  return null;
}

/** Place les bulles dans des couloirs distincts, avec un départ échelonné. */
function lancerVague(q: Question, rng: Rng, level: Level, idBase: number): Bulle[] {
  const n = q.choix.length;
  const couloirs = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  return couloirs.map((c, i) => ({
    id: idBase + i,
    choix: i,
    x: ((c + 0.5) / n) * 84 + 8,
    y: -0.1 - rng.next() * 0.3 - (i % 2) * 0.1,
    vitesse: VITESSE[level] * (0.85 + rng.next() * 0.3),
    phase: rng.next() * Math.PI * 2,
    etat: 'vole',
  }));
}

export default function AttrapeBulles({
  level,
  stream,
  target,
  lectureAuto,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const rng = useRng();
  const reduce = useReducedMotion();
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];

  const tirerQuestion = useCallback((): Question | null => {
    const it = tirer(stream, target(), (x): x is Item => x.kind === 'mcq' || x.kind === 'numeric_answer');
    return it ? versQuestion(it, rng, level) : null;
  }, [stream, target, rng, level]);

  const [q, setQ] = useState<Question | null>(() => tirerQuestion());
  const [manche, setManche] = useState(1);
  const bullesRef = useRef<Bulle[]>(q ? lancerVague(q, rng, level, 0) : []);
  const [, setImage] = useState(0);
  const bulles = bullesRef.current;
  const setBulles = useCallback((b: Bulle[]) => {
    bullesRef.current = b;
    setImage((f) => (f + 1) % 1_000_000);
  }, []);
  /** Verrou synchrone : une seule réponse par manche (toucher + clic, clavier). */
  const verrou = useRef(false);
  const [etat, setEtat] = useState<Etat>({ type: 'jeu' });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [message, setMessage] = useState('');
  const vagues = useRef(1);
  const idSuivant = useRef(10);
  const temps = useRef(0);

  // Lecture de la question
  useEffect(() => {
    if (!q) return;
    startQuestion();
    if (lectureAuto && !paused) void speech.speak(q.aDire, { lang: q.lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const manquer = useCallback(() => {
    if (!q) return;
    answer(q.item, false, '(bulle envolée)', q.choix[q.bonne]!);
    sfx.play('faux');
    setCombo(1);
    setEtat({ type: 'faux', choix: null });
  }, [q, answer, sfx]);

  useBoucle(!paused && etat.type === 'jeu' && !!q, (dt) => {
    if (!q || verrou.current) return;
    temps.current += dt;
    let echappee = false;
    let toutesSorties = true;
    const out = bullesRef.current.map((b) => {
      if (b.etat !== 'vole') return b;
      const y = b.y + b.vitesse * dt;
      if (y < 1.2) toutesSorties = false;
      else if (b.choix === q.bonne) echappee = true;
      return { ...b, y };
    });
    if (echappee || toutesSorties) {
      if (vagues.current < VAGUES[level]) {
        vagues.current++;
        setMessage(level === 'facile' ? 'Elles reviennent ! Prends ton temps.' : 'Dernière vague !');
        setBulles(lancerVague(q, rng, level, (idSuivant.current += 10)));
      } else {
        verrou.current = true;
        setBulles(out);
        manquer();
      }
      return;
    }
    setBulles(out);
  });

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat({ type: 'fin' });
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: `${stats.correct} bulle${stats.correct > 1 ? 's' : ''} attrapée${stats.correct > 1 ? 's' : ''} sur ${N} !`,
        score,
        delayMs: 1200,
      });
      return;
    }
    const nq = tirerQuestion();
    setQ(nq);
    setManche((m) => m + 1);
    vagues.current = 1;
    verrou.current = false;
    setMessage('');
    if (nq) setBulles(lancerVague(nq, rng, level, (idSuivant.current += 10)));
    setEtat({ type: 'jeu' });
  }, [manche, N, stats.correct, sfx, end, score, tirerQuestion, rng, level, setBulles]);

  const eclater = useCallback(
    (b: Bulle) => {
      if (!q || etat.type !== 'jeu' || paused || b.etat !== 'vole' || verrou.current) return;
      verrou.current = true;
      const juste = b.choix === q.bonne;
      answer(q.item, juste, q.choix[b.choix]!, q.choix[q.bonne]!);
      setBulles(bullesRef.current.map((x) => (x.id === b.id ? { ...x, etat: juste ? 'juste' : 'faux' } : x)));
      if (juste) {
        const gain = 10 * combo;
        setScore((s) => s + gain);
        setCombo((c) => Math.min(3, c + 1));
        sfx.play(combo >= 2 ? 'etoile' : 'juste');
        setMessage(combo >= 2 ? `Combo ×${combo} ! +${gain}` : `${bravo(rng)} +${gain}`);
        setEtat({ type: 'juste' });
      } else {
        sfx.play('faux');
        vibrate(60);
        setCombo(1);
        setEtat({ type: 'faux', choix: b.choix });
      }
    },
    [q, etat, paused, answer, combo, sfx, rng, setBulles],
  );

  // Après une bonne réponse, on enchaîne
  useEffect(() => {
    if (etat.type !== 'juste') return;
    const t = setTimeout(suivant, 900);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Raccourcis A-F / 1-6
  useEffect(() => {
    if (etat.type !== 'jeu' || paused || !q) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const k = indexTouche(e.key, q.choix.length);
      if (k < 0) return;
      const b = bulles.find((x) => x.choix === k && x.etat === 'vole' && x.y > -0.05);
      if (b) eclater(b);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, q, bulles, eclater]);

  const bonneTexte = q ? q.choix[q.bonne]! : '';
  const decor = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: (i * 37) % 100,
        y: (i * 53) % 100,
        r: 2 + (i % 3) * 1.5,
      })),
    [],
  );

  if (!q) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de questions pour l’Attrape-Bulles."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🫧 {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>⭐ {score}</Hud>
        <Hud className={combo > 1 ? 'bg-sun' : ''}>🔥 ×{combo}</Hud>
      </Bandeau>

      <div className="carte flex flex-col items-center gap-2 p-4">
        <div className="flex items-start justify-center gap-3">
          <SpeakButton
            text={`${q.aDire}. ${q.item.kind === 'mcq' ? q.choix.join(', ') : ''}`}
            lang={q.lang}
            label="Écouter la question"
          />
          <p
            className="whitespace-pre-line text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl"
            aria-live="polite"
          >
            {q.image && <span className="mr-2">{q.image}</span>}
            {q.texte}
          </p>
        </div>
        <p className="min-h-[1.75rem] text-center font-bold text-grape-dark" aria-live="polite">
          {etat.type === 'jeu' || etat.type === 'juste' ? message : ''}
        </p>
      </div>

      {/* Lagon */}
      <section
        className="relative h-[360px] overflow-hidden rounded-card border-4 border-white shadow-soft sm:h-[420px]"
        aria-label="Lagon aux bulles"
        style={{ background: 'linear-gradient(180deg,#7EE0F5 0%,#38A9DA 45%,#1F6FB0 100%)' }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* rayons de lumière */}
          {[12, 38, 66, 88].map((x, i) => (
            <polygon
              key={i}
              points={`${x},0 ${x + 6},0 ${x + 16},100 ${x - 4},100`}
              fill="#fff"
              opacity="0.08"
            />
          ))}
          {decor.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r * 0.25} fill="#fff" opacity="0.25" />
          ))}
          {/* sable */}
          <path d="M0 92 Q 20 86 40 91 T 80 90 T 100 89 L100 100 L0 100 Z" fill="#F4D99B" />
          <path d="M0 96 Q 25 92 50 96 T 100 95 L100 100 L0 100 Z" fill="#E8C47E" />
        </svg>
        {/* algues et coquillages */}
        <svg
          className="absolute bottom-0 left-0 h-28 w-full"
          viewBox="0 0 400 110"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          {[20, 60, 330, 370].map((x, i) => (
            <motion.path
              key={i}
              d={`M${x} 110 C ${x - 14} 80 ${x + 14} 60 ${x} 20`}
              stroke={i % 2 ? '#3FAF6A' : '#2E8F57'}
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              style={{ originX: `${x}px`, originY: '110px' }}
              animate={reduce || paused ? undefined : { rotate: [-4, 4, -4] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          <path d="M180 108 q 12 -22 24 0 z" fill="#FF9C8A" />
          <path d="M240 108 q 8 -14 16 0 z" fill="#FFC36B" />
          <circle cx="292" cy="104" r="5" fill="#FFF3D6" />
        </svg>

        {bulles.map((b) => {
          const texte = q.choix[b.choix]!;
          const long = texte.length > 10;
          const taille = long ? 132 : texte.length > 5 ? 104 : 88;
          const [clair, fonce] = TEINTES[b.choix % TEINTES.length]!;
          const wobble = reduce ? 0 : Math.sin(temps.current * 2 + b.phase) * 2.2;
          return (
            <AnimatePresence key={b.id}>
              {b.etat === 'vole' ? (
                <motion.button
                  type="button"
                  className="absolute flex items-center justify-center rounded-full text-center font-titre font-extrabold text-ink focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun"
                  style={{
                    left: `calc(${b.x + wobble}% - ${taille / 2}px)`,
                    bottom: `calc(${b.y * 100}% - ${taille / 2}px)`,
                    width: taille,
                    height: long ? taille * 0.72 : taille,
                    background: `radial-gradient(circle at 32% 28%, #ffffff 0 12%, ${clair}cc 35%, ${fonce}bb 100%)`,
                    boxShadow: `0 8px 18px -6px ${fonce}, inset 0 -6px 12px ${fonce}88`,
                    border: '3px solid rgba(255,255,255,0.85)',
                    fontSize: long ? 15 : texte.length > 5 ? 20 : 26,
                    touchAction: 'manipulation',
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    eclater(b);
                  }}
                  onClick={() => eclater(b)}
                  disabled={etat.type !== 'jeu' || paused}
                  aria-label={`Bulle ${LETTRES[b.choix]} : ${texte}`}
                  exit={{ scale: 1.6, opacity: 0 }}
                >
                  <span className="whitespace-pre-line px-2 leading-tight">{texte}</span>
                  <span
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-ink shadow-pop-sm"
                    aria-hidden
                  >
                    {LETTRES[b.choix]}
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  className="pointer-events-none absolute flex items-center justify-center font-titre text-2xl font-extrabold"
                  style={{
                    left: `calc(${b.x}% - 50px)`,
                    bottom: `calc(${b.y * 100}% - 30px)`,
                    width: 100,
                    height: 60,
                  }}
                  initial={{ scale: 0.6, opacity: 1 }}
                  animate={{ scale: 1.4, opacity: 0, y: -30 }}
                  transition={{ duration: 0.9 }}
                  aria-hidden
                >
                  {b.etat === 'juste' ? '✨💥✨' : '💨'}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}

        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/30 font-titre text-3xl font-bold text-white">
            Pause
          </div>
        )}
      </section>

      <Correction
        ouvert={etat.type === 'faux'}
        titre={
          etat.type === 'faux' && etat.choix === null ? 'Oh, la bonne bulle s’est envolée !' : 'Presque !'
        }
        bonne={bonneTexte}
        explication={q.item.explication}
        onContinuer={suivant}
      />
    </div>
  );
}
