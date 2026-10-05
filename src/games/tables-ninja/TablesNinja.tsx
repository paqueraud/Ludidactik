/**
 * Tables Ninja (CATALOGUE n°2).
 * Un calcul s'affiche ; des fruits portant des nombres sont lancés en l'air. On tranche (glisser) ou on
 * touche le fruit qui porte le bon résultat. Les autres sont des fruits piégés (erreurs plausibles) :
 * ils font « pouf » et la correction s'affiche. Bonnes réponses rapides enchaînées → combo ×2 puis ×3.
 * Facile : 3 fruits lents qui reviennent tant qu'on n'a pas trouvé. Normal : 4 fruits, 2 lancers.
 * Plus loin : 5 fruits rapides, un seul lancer.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import { formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import type { Rng } from '@/engine/rng';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import {
  LETTRES,
  bravo,
  choixNumeriques,
  dansUnChamp,
  direNombre,
  estNumerique,
  indexTouche,
  tirer,
  useBoucle,
  useRng,
} from '../_nombres-commun/outils';
import { Bandeau, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { DemiFruit, FruitSvg, Pouf } from './Fruits';
import { FRUITS, type Fruit, JUS } from './fruits-data';

const MANCHES: Record<Level, number> = { facile: 8, normal: 12, plus_loin: 15 };
const NB_FRUITS: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };
/** Durée de vol d'un fruit (s). */
const VOL: Record<Level, number> = { facile: 6, normal: 4.4, plus_loin: 3.2 };
const LANCERS: Record<Level, number> = { facile: Infinity, normal: 2, plus_loin: 1 };
/** Réponse « rapide » pour le combo (ms). */
const RAPIDE: Record<Level, number> = { facile: 7000, normal: 5000, plus_loin: 3500 };

interface Projectile {
  id: number;
  choix: number;
  fruit: Fruit;
  x0: number;
  vx: number;
  vy: number;
  g: number;
  t: number; // temps écoulé depuis le lancer (négatif = en attente)
  rot: number;
  etat: 'vole' | 'tranche' | 'pouf';
}

type Etat = { type: 'jeu' } | { type: 'juste' } | { type: 'faux'; choix: number | null } | { type: 'fin' };

/** Position (x en %, y en fraction de hauteur depuis le bas) d'un projectile. */
const pos = (p: Projectile) => {
  const t = Math.max(0, p.t);
  return { x: p.x0 + p.vx * t, y: -0.18 + p.vy * t - (p.g * t * t) / 2 };
};

function lancer(n: number, rng: Rng, level: Level, idBase: number): Projectile[] {
  const T = VOL[level];
  const couloirs = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  return couloirs.map((c, i) => {
    const H = 0.62 + rng.next() * 0.22 + 0.18; // hauteur du sommet depuis le point de départ
    const up = (T / 2) * (0.9 + rng.next() * 0.2);
    const g = (2 * H) / (up * up);
    const x0 = ((c + 0.5) / n) * 80 + 10;
    const x1 = Math.max(8, Math.min(92, x0 + (rng.next() - 0.5) * 24));
    return {
      id: idBase + i,
      choix: i,
      fruit: rng.pick(FRUITS),
      x0,
      vx: (x1 - x0) / (2 * up),
      vy: g * up,
      g,
      t: -i * 0.45 - rng.next() * 0.2,
      rot: (rng.next() - 0.5) * 180,
      etat: 'vole',
    };
  });
}

export default function TablesNinja({
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
  const { stats, answer, startQuestion, end, elapsed } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];
  const taille = level === 'plus_loin' ? 84 : 96;

  const nouvelle = useCallback(() => {
    const it = tirer(stream, target(), estNumerique);
    if (!it) return null;
    return { item: it, ...choixNumeriques(it, rng, NB_FRUITS[level]) };
  }, [stream, target, rng, level]);

  const [q, setQ] = useState(() => nouvelle());
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<Etat>({ type: 'jeu' });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [message, setMessage] = useState('');
  const projRef = useRef<Projectile[]>(q ? lancer(q.choix.length, rng, level, 0) : []);
  const [, setImage] = useState(0);
  const verrou = useRef(false);
  const lancers = useRef(1);
  const idSuivant = useRef(10);
  const debut = useRef(0);
  const arene = useRef<HTMLDivElement>(null);
  const trace = useRef<{ x: number; y: number; t: number }[]>([]);
  const appuye = useRef(false);

  const setProj = useCallback((p: Projectile[]) => {
    projRef.current = p;
    setImage((f) => (f + 1) % 1_000_000);
  }, []);

  useEffect(() => {
    if (!q) return;
    startQuestion();
    debut.current = elapsed();
    if (lectureAuto && !paused) void speech.speak(q.item.spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const trancher = useCallback(
    (p: Projectile) => {
      if (!q || etat.type !== 'jeu' || paused || p.etat !== 'vole' || p.t < 0 || verrou.current) return;
      verrou.current = true;
      const juste = p.choix === q.bonne;
      answer(q.item, juste, q.choix[p.choix]!, q.choix[q.bonne]!);
      setProj(projRef.current.map((x) => (x.id === p.id ? { ...x, etat: juste ? 'tranche' : 'pouf' } : x)));
      if (juste) {
        const rapide = elapsed() - debut.current < RAPIDE[level];
        const mult = combo;
        const gain = 10 * mult;
        setScore((s) => s + gain);
        setCombo(rapide ? Math.min(3, combo + 1) : 1);
        sfx.play(mult >= 2 ? 'etoile' : 'juste');
        setMessage(mult >= 2 ? `Combo ×${mult} ! +${gain}` : `${bravo(rng)} +${gain}`);
        setEtat({ type: 'juste' });
      } else {
        sfx.play('faux');
        vibrate(80);
        setCombo(1);
        setEtat({ type: 'faux', choix: p.choix });
      }
    },
    [q, etat, paused, answer, setProj, elapsed, level, combo, sfx, rng],
  );

  useBoucle(!paused && etat.type === 'jeu' && !!q, (dt) => {
    if (!q || verrou.current) return;
    const vitesse = reduce ? 0.75 : 1;
    let tousTombes = true;
    const out = projRef.current.map((p) => {
      if (p.etat !== 'vole') return { ...p, t: p.t + dt };
      const np = { ...p, t: p.t + dt * vitesse };
      if (np.t < 0 || pos(np).y > -0.25) tousTombes = false;
      return np;
    });
    // la traînée de la lame s'efface
    const now = performance.now();
    trace.current = trace.current.filter((pt) => now - pt.t < 180);
    if (tousTombes) {
      if (lancers.current < LANCERS[level]) {
        lancers.current++;
        setMessage(level === 'facile' ? 'Ils reviennent ! Prends ton temps.' : 'Dernier lancer !');
        setProj(lancer(q.choix.length, rng, level, (idSuivant.current += 10)));
      } else {
        verrou.current = true;
        setProj(out);
        answer(q.item, false, '(fruit tombé)', q.choix[q.bonne]!);
        sfx.play('faux');
        setCombo(1);
        setEtat({ type: 'faux', choix: null });
      }
      return;
    }
    setProj(out);
  });

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat({ type: 'fin' });
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? `Ceinture noire ! ${stats.correct} / ${N}`
          : `${stats.correct} fruits tranchés sur ${N} !`,
        score,
        delayMs: 1200,
      });
      return;
    }
    const nq = nouvelle();
    setQ(nq);
    setManche((m) => m + 1);
    lancers.current = 1;
    verrou.current = false;
    setMessage('');
    if (nq) setProj(lancer(nq.choix.length, rng, level, (idSuivant.current += 10)));
    setEtat({ type: 'jeu' });
  }, [manche, N, stats.correct, sfx, end, score, nouvelle, setProj, rng, level]);

  useEffect(() => {
    if (etat.type !== 'juste') return;
    const t = setTimeout(suivant, 950);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Clavier : A-E (ou 1-5) tranche le fruit correspondant
  useEffect(() => {
    if (etat.type !== 'jeu' || paused || !q) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const k = indexTouche(e.key, q.choix.length);
      if (k < 0) return;
      const p = projRef.current.find((x) => x.choix === k && x.etat === 'vole' && x.t >= 0);
      if (p) trancher(p);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, q, trancher]);

  /** Lame : on teste les fruits sous le doigt (toucher ou glisser). */
  const toucher = (e: React.PointerEvent) => {
    const r = arene.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    trace.current.push({ x, y, t: performance.now() });
    if (trace.current.length > 14) trace.current.shift();
    for (const p of projRef.current) {
      if (p.etat !== 'vole' || p.t < 0) continue;
      const c = pos(p);
      const cx = (c.x / 100) * r.width;
      const cy = r.height - c.y * r.height;
      if (Math.hypot(cx - x, cy - y) < taille * 0.55) {
        trancher(p);
        break;
      }
    }
  };

  if (!q) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de calculs pour Tables Ninja."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const lame = trace.current;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🍉 {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>⭐ {score}</Hud>
        <Hud className={combo > 1 ? 'bg-sun' : ''}>🔥 ×{combo}</Hud>
      </Bandeau>

      <section
        ref={arene}
        className="relative h-[380px] touch-none select-none overflow-hidden rounded-card border-4 border-white shadow-soft sm:h-[440px]"
        aria-label="Dojo des fruits"
        style={{ background: 'linear-gradient(180deg,#FFE9C7 0%,#FFD29A 55%,#E9A86A 100%)' }}
        onPointerDown={(e) => {
          appuye.current = true;
          trace.current = [];
          toucher(e);
        }}
        onPointerMove={(e) => appuye.current && toucher(e)}
        onPointerUp={() => (appuye.current = false)}
        onPointerLeave={() => (appuye.current = false)}
      >
        {/* Décor : dojo, soleil couchant, bambous */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden
        >
          <circle cx="300" cy="90" r="46" fill="#FFB86B" opacity="0.7" />
          <path
            d="M0 210 L60 170 L120 205 L190 160 L260 200 L330 165 L400 200 L400 300 L0 300 Z"
            fill="#E7A066"
            opacity="0.6"
          />
          {[20, 34, 368, 382].map((x, i) => (
            <g key={i}>
              <rect x={x} y={60 + i * 8} width="8" height="260" rx="3" fill="#7BB35A" />
              {[100, 150, 200, 250].map((y) => (
                <rect key={y} x={x - 1} y={y + i * 8} width="10" height="3" fill="#5E9441" />
              ))}
            </g>
          ))}
          <rect x="0" y="268" width="400" height="32" fill="#B9773F" />
          <rect x="0" y="268" width="400" height="5" fill="#D08D50" />
        </svg>

        {/* Calcul */}
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-5 shadow-pop">
            <SpeakButton text={q.item.spoken} label="Écouter le calcul" size={44} />
            <p
              className="whitespace-nowrap font-titre text-3xl font-extrabold sm:text-4xl"
              aria-live="polite"
            >
              {q.item.prompt}
              {/[=?…]/.test(q.item.prompt) ? '' : ' = ?'}
            </p>
          </div>
        </div>
        <p
          className="pointer-events-none absolute left-1/2 top-[74px] z-20 -translate-x-1/2 whitespace-nowrap font-titre text-xl font-extrabold text-grape-dark"
          aria-live="polite"
        >
          {etat.type !== 'faux' ? message : ''}
        </p>

        {projRef.current.map((p) => {
          if (p.t < 0) return null;
          const c = pos(p);
          if (c.y < -0.3) return null;
          const rot = reduce ? 0 : p.rot * p.t;
          const style = {
            left: `calc(${c.x}% - ${taille / 2}px)`,
            bottom: `calc(${c.y * 100}% - ${taille / 2}px)`,
            width: taille,
            height: taille,
          };
          if (p.etat === 'tranche') {
            return (
              <div key={p.id} className="pointer-events-none absolute" style={style}>
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: 0, y: 0, rotate: 0 }}
                  animate={{ x: -40, y: 60, rotate: -40, opacity: 0 }}
                  transition={{ duration: 0.9 }}
                >
                  <DemiFruit fruit={p.fruit} size={taille} cote="g" />
                </motion.div>
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: 0, y: 0, rotate: 0 }}
                  animate={{ x: 40, y: 60, rotate: 40, opacity: 0 }}
                  transition={{ duration: 0.9 }}
                >
                  <DemiFruit fruit={p.fruit} size={taille} cote="d" />
                </motion.div>
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: JUS[p.fruit] }}
                  initial={{ scale: 0.2, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            );
          }
          if (p.etat === 'pouf') {
            return (
              <motion.div
                key={p.id}
                className="pointer-events-none absolute"
                style={style}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1.25 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <Pouf size={taille} />
              </motion.div>
            );
          }
          const texte = q.choix[p.choix]!;
          return (
            <button
              key={p.id}
              type="button"
              className="absolute flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-dark"
              style={{ ...style, touchAction: 'none' }}
              onClick={() => trancher(p)}
              disabled={etat.type !== 'jeu' || paused}
              aria-label={`Fruit ${LETTRES[p.choix]} : ${texte}`}
            >
              <span className="absolute inset-0" style={{ transform: `rotate(${rot}deg)` }}>
                <FruitSvg fruit={p.fruit} size={taille} />
              </span>
              <span
                className={`relative rounded-xl bg-white/95 px-2 font-titre font-extrabold text-ink shadow-pop-sm ${
                  texte.length > 5 ? 'text-lg' : 'text-2xl'
                }`}
              >
                {texte}
              </span>
              <span
                className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
                aria-hidden
              >
                {LETTRES[p.choix]}
              </span>
            </button>
          );
        })}

        {/* Traînée de la lame */}
        {lame.length > 1 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <polyline
              points={lame.map((pt) => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#fff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        )}

        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-ink/30 font-titre text-3xl font-bold text-white"
            >
              Pause
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <p className="text-center text-sm font-bold text-ink-soft">
        Glisse ton doigt sur le bon fruit, touche-le, ou appuie sur sa lettre au clavier.
      </p>

      <Correction
        ouvert={etat.type === 'faux'}
        titre={
          etat.type === 'faux' && etat.choix === null
            ? 'Oh, le bon fruit est tombé !'
            : 'Presque ! C’était un fruit piégé.'
        }
        bonne={`${q.item.prompt}${/[=?…]/.test(q.item.prompt) ? ' →' : ' ='} ${formatNumber(q.item.answer)}`}
        aDire={`La bonne réponse est ${direNombre(q.item.answer)}. ${q.item.explication}`}
        explication={q.item.explication}
        onContinuer={suivant}
      />
    </div>
  );
}
