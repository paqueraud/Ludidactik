/**
 * Le Funambule (CATALOGUE n°7) — demi-droite graduée.
 * On choisit sur le fil l'endroit du nombre demandé ; le funambule y marche. S'il s'arrête au bon
 * endroit (dans la tolérance), il salue ; sinon il perd l'équilibre et tombe dans le filet (il rebondit,
 * aucun danger) et la bonne position s'affiche.
 * Facile : toutes les graduations étiquetées, valeur visée affichée. Normal : une étiquette sur deux.
 * Plus loin : seulement les bornes, pas de petites graduations, curseur au demi-pas (il faut estimer).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, NumberLineItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { DroiteSvg } from '../_nombres-commun/DroiteSvg';
import { useSaisieDroite } from '../_nombres-commun/useSaisieDroite';
import {
  X0,
  aimanter,
  atteint,
  ecrire,
  lireValeur,
  pasCurseur,
  sousPas,
  versX,
} from '../_nombres-commun/droite';
import { bravo, dansUnChamp, tirer, useBoucle, useRng } from '../_nombres-commun/outils';
import { Bandeau, Correction, PasDeQuestion } from '../_nombres-commun/ui';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const FIL = 190; // ordonnée du fil dans le viewBox
const FILET = 392;
const DEPART = X0 - 30;

type Etat = 'choix' | 'marche' | 'reussi' | 'chute' | 'fin';

const estDroite = (x: { kind: string }): x is NumberLineItem => x.kind === 'number_line';

/** Le funambule (pieds à l'origine), avec sa perche d'équilibre. */
function Acrobate({ pas, penche }: { pas: number; penche: number }) {
  const jambe = Math.sin(pas) * 16;
  return (
    <g transform={`rotate(${penche})`}>
      {/* jambes */}
      <line
        x1="0"
        y1="-46"
        x2={-8 + jambe / 2}
        y2="0"
        stroke="#3B4C8C"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="-46"
        x2={8 - jambe / 2}
        y2="0"
        stroke="#2E3D75"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* corps : justaucorps rayé */}
      <rect x="-15" y="-96" width="30" height="54" rx="14" fill="#FF7A6B" />
      <rect x="-15" y="-84" width="30" height="8" fill="#FFD45C" />
      <rect x="-15" y="-66" width="30" height="8" fill="#FFD45C" />
      {/* perche */}
      <line x1="-95" y1="-74" x2="95" y2="-74" stroke="#8D5A3B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="-95" cy="-74" r="8" fill="#8E7CFF" />
      <circle cx="95" cy="-74" r="8" fill="#8E7CFF" />
      {/* bras */}
      <line x1="-12" y1="-86" x2="-34" y2="-74" stroke="#F2C29B" strokeWidth="7" strokeLinecap="round" />
      <line x1="12" y1="-86" x2="34" y2="-74" stroke="#F2C29B" strokeWidth="7" strokeLinecap="round" />
      {/* tête */}
      <circle cx="0" cy="-114" r="18" fill="#F2C29B" />
      <path d="M-18 -118 Q 0 -146 18 -118 Q 10 -128 0 -128 Q -10 -128 -18 -118 Z" fill="#5A3825" />
      <circle cx="-6" cy="-114" r="2.5" fill="#24304A" />
      <circle cx="6" cy="-114" r="2.5" fill="#24304A" />
      <path
        d="M-6 -106 Q 0 -101 6 -106"
        stroke="#24304A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* petit chapeau */}
      <path d="M-10 -130 L 0 -150 L 10 -130 Z" fill="#8E7CFF" />
      <circle cx="0" cy="-151" r="4" fill="#FFD45C" />
    </g>
  );
}

export default function Funambule({
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
  const nouvelle = useCallback(() => tirer(stream, target(), estDroite), [stream, target]);

  const [item, setItem] = useState<NumberLineItem | null>(() => nouvelle());
  const [manche, setManche] = useState(1);
  const [vise, setVise] = useState<number | null>(null);
  const [etat, setEtat] = useState<Etat>('choix');
  const [xW, setXW] = useState(DEPART);
  const [pasMarche, setPasMarche] = useState(0);
  const [message, setMessage] = useState('');
  const score = useRef(0);
  const svg = useRef<SVGSVGElement>(null);

  const pas = item ? pasCurseur(item, level) : 1;
  const saisie = useSaisieDroite(
    svg,
    item ?? ({} as NumberLineItem),
    pas,
    etat === 'choix' && !paused && !!item,
    (v) => {
      setVise(v);
      sfx.play('tic');
    },
  );

  useEffect(() => {
    if (!item) return;
    startQuestion();
    if (lectureAuto && !paused) void speech.speak(item.spoken ?? lireValeur(item.prompt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const marcher = useCallback(() => {
    if (!item || vise === null || etat !== 'choix' || paused) return;
    setEtat('marche');
  }, [item, vise, etat, paused]);

  // Marche image par image (figée pendant la pause)
  const xRef = useRef(DEPART);
  const verrou = useRef(false);
  useBoucle(etat === 'marche' && !paused && !!item && vise !== null, (dt) => {
    if (!item || vise === null || verrou.current) return;
    const cible = versX(item, vise);
    const vitesse = reduce ? 520 : 380; // unités de viewBox par seconde
    setPasMarche((p) => p + dt * 10);
    const nx = Math.min(cible, xRef.current + vitesse * dt);
    xRef.current = nx;
    setXW(nx);
    if (nx < cible) return;
    verrou.current = true;
    const juste = atteint(item, vise);
    answer(item, juste, ecrire(item, vise), item.display);
    if (juste) {
      const precision = 1 - Math.min(1, Math.abs(vise - item.target) / Math.max(item.tolerance, 1e-9));
      score.current += 100 + Math.round(50 * precision);
      sfx.play('juste');
      setMessage(`${bravo(rng)} Pile sur ${item.display} !`);
      setEtat('reussi');
    } else {
      sfx.play('glisse');
      vibrate([40, 40, 80]);
      setEtat('chute');
    }
  });

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat('fin');
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? 'Quel équilibre ! Le public applaudit ! 🎪'
          : `${stats.correct} traversées réussies sur ${N} !`,
        score: Math.max(0, score.current),
        delayMs: 1000,
      });
      return;
    }
    setItem(nouvelle());
    setManche((m) => m + 1);
    setVise(null);
    setXW(DEPART);
    xRef.current = DEPART;
    verrou.current = false;
    setMessage('');
    setEtat('choix');
  }, [manche, N, stats.correct, sfx, end, nouvelle]);

  useEffect(() => {
    if (etat !== 'reussi') return;
    const t = setTimeout(suivant, 1500);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Clavier : flèches (Maj = grand pas), Entrée = marcher
  useEffect(() => {
    if (etat !== 'choix' || paused || !item) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const sens = e.key === 'ArrowLeft' ? -1 : 1;
        const p = e.shiftKey ? item.step : pas;
        setVise((v) => aimanter(item, (v ?? (item.min + item.max) / 2) + (v === null ? 0 : sens * p), pas));
        sfx.play('tic');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        marcher();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, item, pas, marcher, sfx]);

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de droite graduée pour le funambule."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const xVise = vise !== null ? versX(item, vise) : null;
  const xBonne = versX(item, item.target);
  const chute = etat === 'chute';
  const aDire = item.spoken ?? lireValeur(item.prompt);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🎪 {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>✅ {stats.correct}</Hud>
      </Bandeau>

      <div className="carte flex items-center justify-center gap-3 p-3">
        <SpeakButton text={aDire} label="Écouter la consigne" />
        <p className="text-center font-titre text-2xl font-extrabold sm:text-3xl" aria-live="polite">
          {item.prompt}
        </p>
      </div>

      <section
        className="overflow-hidden rounded-card border-4 border-white shadow-soft"
        aria-label="Le chapiteau"
      >
        <svg
          ref={svg}
          viewBox="0 0 1000 460"
          className={`block h-auto w-full touch-none select-none ${etat === 'choix' ? 'cursor-pointer' : ''}`}
          role="img"
          aria-label={`Fil gradué de ${ecrire(item, item.min)} à ${ecrire(item, item.max)}${vise !== null ? `, drapeau placé` : ''}`}
          {...saisie}
        >
          <defs>
            <linearGradient id="fun-ciel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3B2A6B" />
              <stop offset="1" stopColor="#8E5FC4" />
            </linearGradient>
          </defs>
          <rect width="1000" height="460" fill="url(#fun-ciel)" />
          {/* toile du chapiteau */}
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d={`M500 -40 L ${i * 110 - 20} 460 L ${i * 110 + 35} 460 Z`}
              fill={i % 2 ? '#FF7A6B' : '#FFF3E0'}
              opacity="0.18"
            />
          ))}
          {/* projecteurs */}
          <circle cx="150" cy="40" r="90" fill="#FFE9A8" opacity="0.12" />
          <circle cx="850" cy="40" r="90" fill="#FFE9A8" opacity="0.12" />
          {/* mâts et plateformes */}
          {[X0 - 30, 1000 - X0 + 30].map((x) => (
            <g key={x}>
              <rect x={x - 7} y={FIL} width="14" height={460 - FIL} fill="#C9A06A" />
              <rect x={x - 34} y={FIL - 4} width="68" height="12" rx="4" fill="#8D5A3B" />
            </g>
          ))}
          {/* filet de sécurité */}
          <path
            d={`M30 ${FILET} Q 500 ${FILET + 40} 970 ${FILET}`}
            stroke="#FFD45C"
            strokeWidth="5"
            fill="none"
          />
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={i}
              x1={40 + i * 40}
              y1={FILET + 6}
              x2={60 + i * 40}
              y2={FILET + 26}
              stroke="#FFD45C"
              strokeWidth="2"
              opacity="0.6"
            />
          ))}
          {/* le fil + graduations */}
          <line x1={X0 - 30} x2={1000 - X0 + 30} y1={FIL} y2={FIL} stroke="#F4E1C1" strokeWidth="6" />
          <DroiteSvg
            item={item}
            level={level}
            y={FIL}
            couleur="#FFFFFF"
            trait={false}
            sousGraduations={level !== 'plus_loin'}
          />

          {/* drapeau visé */}
          {xVise !== null && (
            <g transform={`translate(${xVise} ${FIL})`}>
              <line x1="0" y1="0" x2="0" y2="-64" stroke="#FFD45C" strokeWidth="5" />
              <path d="M0 -64 L 40 -52 L 0 -40 Z" fill={chute ? '#FF7A6B' : '#FFD45C'} />
              <circle cx="0" cy="0" r="9" fill="#FFD45C" stroke="#24304A" strokeWidth="3" />
            </g>
          )}
          {/* bonne position après une chute */}
          {chute && (
            <g transform={`translate(${xBonne} ${FIL})`}>
              <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <line x1="0" y1="0" x2="0" y2="-64" stroke="#7BD389" strokeWidth="5" />
                <path d="M0 -64 L 40 -52 L 0 -40 Z" fill="#7BD389" />
                <circle cx="0" cy="0" r="10" fill="#7BD389" stroke="#fff" strokeWidth="3" />
                <text
                  x="0"
                  y="-80"
                  textAnchor="middle"
                  fontSize="34"
                  fontWeight="800"
                  fill="#7BD389"
                  stroke="#24304A"
                  strokeWidth="5"
                  paintOrder="stroke"
                  fontFamily="Baloo 2, sans-serif"
                >
                  {item.display}
                </text>
              </motion.g>
            </g>
          )}

          {/* le funambule */}
          <motion.g
            initial={false}
            animate={
              chute
                ? {
                    x: xW,
                    y: [FIL, FIL - 30, FILET + 18, FILET - 30, FILET + 10, FILET + 4],
                    rotate: [0, -25, 80, 70, 90, 90],
                  }
                : { x: xW, y: FIL, rotate: 0 }
            }
            transition={chute ? { duration: 1.3, times: [0, 0.2, 0.55, 0.72, 0.88, 1] } : { duration: 0 }}
          >
            <Acrobate
              pas={etat === 'marche' ? pasMarche : 0}
              penche={etat === 'marche' && !reduce ? Math.sin(pasMarche / 2) * 4 : 0}
            />
          </motion.g>

          <AnimatePresence>
            {etat === 'reussi' && (
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {[-60, 0, 60].map((dx, i) => (
                  <text key={i} x={xW + dx} y={FIL - 175 - (i % 2) * 20} textAnchor="middle" fontSize="40">
                    ⭐
                  </text>
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </section>

      <div className="carte flex flex-col items-center gap-3 p-4">
        {etat === 'choix' && (
          <>
            {level === 'facile' && (
              <p className="text-center font-bold text-ink-soft">
                {vise !== null ? (
                  <>
                    Tu vises : <span className="font-titre text-xl text-ink">{ecrire(item, vise)}</span>{' '}
                    ·{' '}
                  </>
                ) : null}
                Chaque petit trait vaut {ecrire({ ...item, display: '' }, sousPas(item))}.
              </p>
            )}
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche le fil, ou utilise les flèches ← → (Maj pour aller plus vite).
            </p>
            <Button variant="grass" size="lg" onClick={marcher} disabled={vise === null || paused}>
              🤸 Marche !
            </Button>
          </>
        )}
        {etat === 'reussi' && (
          <p className="font-titre text-2xl font-extrabold text-grass-dark" role="status">
            {message}
          </p>
        )}
        <Correction
          ouvert={chute}
          titre="Oups, plouf dans le filet ! Presque !"
          bonne={item.display}
          aDire={`La bonne position est ${lireValeur(item.display)}. ${item.explication}`}
          explication={item.explication}
          onContinuer={suivant}
        >
          {vise !== null && (
            <p className="mt-1">
              Tu t’es arrêté à <strong>{ecrire(item, vise)}</strong>.
            </p>
          )}
        </Correction>
      </div>
    </div>
  );
}
