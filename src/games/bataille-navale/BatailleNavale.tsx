/**
 * Bataille navale graduée (CATALOGUE n°8) — repérer une position sur une demi-droite graduée.
 * Mode « tir » : le bateau pirate est caché dans le brouillard à la position annoncée ; on place le
 * viseur sur la ligne graduée et on tire une bombe de peinture. Mode « lecture » : le bateau est visible,
 * on choisit l'écriture de sa position.
 * Facile : tir seulement, toutes les étiquettes, 2e tir avec indice. Normal : tir et lecture alternés,
 * 2e tir avec indice. Plus loin : bornes seules, pas de petites graduations, un seul tir.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, NumberLineItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { DroiteSvg } from '../_nombres-commun/DroiteSvg';
import { useSaisieDroite } from '../_nombres-commun/useSaisieDroite';
import {
  aimanter,
  atteint,
  ecrire,
  lireValeur,
  pasCurseur,
  piegesPosition,
  sousPas,
  versX,
} from '../_nombres-commun/droite';
import { bravo, dansUnChamp, tirer, useBoucle, useRng } from '../_nombres-commun/outils';
import { Bandeau, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { BateauPirate, Canon, Gerbe } from './Bateaux';

const FLOTTE: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const TIRS: Record<Level, number> = { facile: 2, normal: 2, plus_loin: 1 };
const LIGNE = 335;
const CANON = { x: 80, y: 128 };
const PEINTURES = ['#FF7A6B', '#8E7CFF', '#FFD45C', '#7BD389', '#4FC3F7'];

type Mode = 'tir' | 'lecture';
type Etat =
  | { type: 'vise' }
  | { type: 'vol'; p: number }
  | { type: 'rate'; tirs: number } // tir à côté, on peut retirer
  | { type: 'touche' }
  | { type: 'perdu' } // correction
  | { type: 'fin' };

const estDroite = (x: { kind: string }): x is NumberLineItem => x.kind === 'number_line';

export default function BatailleNavale({
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
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = FLOTTE[level];

  const [item, setItem] = useState<NumberLineItem | null>(() => tirer(stream, target(), estDroite));
  const [manche, setManche] = useState(1);
  const modeDe = useCallback(
    (m: number): Mode => (level === 'facile' ? 'tir' : m % 2 === 0 ? 'lecture' : 'tir'),
    [level],
  );
  const mode = modeDe(manche);
  const [vise, setVise] = useState<number | null>(null);
  const [impacts, setImpacts] = useState<number[]>([]);
  const [etat, setEtat] = useState<Etat>({ type: 'vise' });
  const [indice, setIndice] = useState('');
  const [message, setMessage] = useState('');
  const [lecture, setLecture] = useState<{ choix: string[]; bonne: number } | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const tirs = useRef(0);
  const verrou = useRef(false);
  const score = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  const peinture = PEINTURES[manche % PEINTURES.length]!;

  const pas = item ? pasCurseur(item, level) : 1;
  const peutViser = mode === 'tir' && (etat.type === 'vise' || etat.type === 'rate') && !paused && !!item;
  const saisie = useSaisieDroite(svg, item ?? ({} as NumberLineItem), pas, peutViser, (v) => {
    setVise(v);
    sfx.play('tic');
  });

  // Nouvelle manche : consigne, choix de lecture
  useEffect(() => {
    if (!item) return;
    startQuestion();
    if (modeDe(manche) === 'lecture') {
      const pieges = piegesPosition(item, rng, 3);
      const choix = rng.shuffle([ecrire(item, item.target), ...pieges.map((v) => ecrire(item, v))]);
      setLecture({ choix, bonne: choix.indexOf(ecrire(item, item.target)) });
    } else setLecture(null);
    if (lectureAuto && !paused)
      void speech.speak(
        modeDe(manche) === 'lecture'
          ? 'À quelle position se trouve le bateau pirate ?'
          : `Le bateau pirate se cache à ${lireValeur(item.display)}. Vise et tire !`,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const resoudre = useCallback(
    (v: number) => {
      if (!item) return;
      const juste = atteint(item, v);
      tirs.current++;
      if (juste) {
        verrou.current = true;
        answer(item, true, ecrire(item, v), item.display);
        score.current += tirs.current === 1 ? 150 : 80;
        sfx.play('etoile');
        setMessage(`${bravo(rng)} Touché ! Le bateau rentre au port.`);
        setEtat({ type: 'touche' });
        return;
      }
      sfx.play('glisse');
      vibrate(50);
      setImpacts((l) => [...l, v]);
      if (tirs.current < TIRS[level]) {
        setIndice(v < item.target ? 'Plus loin vers la droite ! ➡️' : '⬅️ Moins loin, vers la gauche !');
        setEtat({ type: 'rate', tirs: tirs.current });
      } else {
        verrou.current = true;
        answer(item, false, ecrire(item, v), item.display);
        setEtat({ type: 'perdu' });
      }
    },
    [item, answer, sfx, rng, level],
  );

  const feu = useCallback(() => {
    if (!peutViser || vise === null || verrou.current) return;
    sfx.play('pop');
    setIndice('');
    setEtat({ type: 'vol', p: 0 });
  }, [peutViser, vise, sfx]);

  // Trajectoire du boulet (figée pendant la pause)
  useBoucle(etat.type === 'vol' && !paused, (dt) => {
    if (etat.type !== 'vol') return;
    const p = etat.p + dt / 0.9;
    if (p >= 1) resoudre(vise!);
    else setEtat({ type: 'vol', p });
  });

  const lire = useCallback(
    (i: number) => {
      if (!item || !lecture || verrou.current || paused) return;
      verrou.current = true;
      setChoisi(i);
      const juste = i === lecture.bonne;
      answer(item, juste, lecture.choix[i]!, lecture.choix[lecture.bonne]!);
      if (juste) {
        score.current += 120;
        sfx.play('juste');
        setMessage(`${bravo(rng)} Bien repéré !`);
        setEtat({ type: 'touche' });
      } else {
        sfx.play('faux');
        vibrate(50);
        setEtat({ type: 'perdu' });
      }
    },
    [item, lecture, paused, answer, sfx, rng],
  );

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat({ type: 'fin' });
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? `Victoire, amiral ! ${stats.correct} bateaux repeints ! 🏴‍☠️`
          : `${stats.correct} bateaux repérés sur ${N} !`,
        score: score.current,
        delayMs: 1000,
      });
      return;
    }
    setItem(tirer(stream, target(), estDroite));
    setManche((m) => m + 1);
    setVise(null);
    setImpacts([]);
    setIndice('');
    setMessage('');
    setChoisi(null);
    tirs.current = 0;
    verrou.current = false;
    setEtat({ type: 'vise' });
  }, [manche, N, stats.correct, sfx, end, stream, target]);

  useEffect(() => {
    if (etat.type !== 'touche') return;
    const t = setTimeout(suivant, 1600);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Clavier : flèches pour viser (Maj = grand pas), Entrée ou Espace = feu
  useEffect(() => {
    if (!peutViser || !item) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const s = e.key === 'ArrowLeft' ? -1 : 1;
        setVise((v) =>
          aimanter(
            item,
            (v ?? (item.min + item.max) / 2) + (v === null ? 0 : s * (e.shiftKey ? item.step : pas)),
            pas,
          ),
        );
        sfx.play('tic');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        feu();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [peutViser, item, pas, feu, sfx]);

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de droite graduée pour la bataille navale."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const xBateau = versX(item, item.target);
  const bateauVisible = mode === 'lecture' || etat.type === 'touche' || etat.type === 'perdu';
  const xVise = vise !== null ? versX(item, vise) : null;
  const boulet =
    etat.type === 'vol' && xVise !== null
      ? (() => {
          const t = etat.p;
          const ex = xVise;
          const ey = LIGNE - 40;
          const cx = (CANON.x + ex) / 2;
          const cy = -60;
          return {
            x: (1 - t) * (1 - t) * CANON.x + 2 * (1 - t) * t * cx + t * t * ex,
            y: (1 - t) * (1 - t) * CANON.y + 2 * (1 - t) * t * cy + t * t * ey,
          };
        })()
      : null;
  const consigne =
    mode === 'lecture'
      ? 'À quelle position se trouve le bateau pirate ?'
      : `Le bateau pirate se cache à ${item.display}.`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🏴‍☠️ {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>🎯 {stats.correct}</Hud>
        {mode === 'tir' && (
          <Hud>
            {Array.from({ length: TIRS[level] }, (_, i) => (
              <span
                key={i}
                className={i < TIRS[level] - tirs.current ? '' : 'opacity-25 grayscale'}
                aria-hidden
              >
                🎨
              </span>
            ))}
            <span className="sr-only">{TIRS[level] - tirs.current} tirs restants</span>
          </Hud>
        )}
      </Bandeau>

      <div className="carte flex items-center justify-center gap-3 p-3">
        <SpeakButton
          text={consigne.replace(item.display, lireValeur(item.display))}
          label="Écouter la consigne"
        />
        <p className="text-center font-titre text-2xl font-extrabold sm:text-3xl" aria-live="polite">
          {consigne}
        </p>
      </div>

      <section className="overflow-hidden rounded-card border-4 border-white shadow-soft" aria-label="La mer">
        <svg
          ref={svg}
          viewBox="0 0 1000 460"
          className={`block h-auto w-full touch-none select-none ${peutViser ? 'cursor-crosshair' : ''}`}
          role="img"
          aria-label={`Ligne graduée de ${ecrire(item, item.min)} à ${ecrire(item, item.max)}`}
          {...saisie}
        >
          <defs>
            <linearGradient id="bn-mer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5CC8F0" />
              <stop offset="1" stopColor="#1F78B8" />
            </linearGradient>
            <linearGradient id="bn-ciel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BDEBFF" />
              <stop offset="1" stopColor="#FFF4DA" />
            </linearGradient>
          </defs>
          <rect width="1000" height="200" fill="url(#bn-ciel)" />
          <circle cx="880" cy="70" r="40" fill="#FFD45C" />
          <rect y="180" width="1000" height="280" fill="url(#bn-mer)" />
          {[230, 280, 430].map((y, i) => (
            <path
              key={y}
              d={`M0 ${y} q 40 -10 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0`}
              stroke="#fff"
              strokeWidth="3"
              fill="none"
              opacity={0.25 - i * 0.05}
            />
          ))}
          {/* île du canon */}
          <ellipse cx={CANON.x} cy={CANON.y + 52} rx="80" ry="22" fill="#F4D99B" />
          <path d={`M${CANON.x - 40} ${CANON.y + 40} q 40 -60 90 0 z`} fill="#7BC96F" />
          <g transform={`translate(${CANON.x} ${CANON.y + 30})`}>
            <Canon />
          </g>

          {/* ligne de bouées graduée */}
          <DroiteSvg
            item={item}
            level={level}
            y={LIGNE}
            couleur="#FFFFFF"
            sousGraduations={level !== 'plus_loin'}
          />

          {/* bateau pirate */}
          <AnimatePresence>
            {bateauVisible && (
              <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <g transform={`translate(${xBateau} ${LIGNE - 24})`}>
                  <BateauPirate peint={etat.type === 'touche' && mode === 'tir'} couleur={peinture} />
                </g>
              </motion.g>
            )}
          </AnimatePresence>
          {/* brouillard qui cache le bateau */}
          {!bateauVisible && (
            <g opacity="0.92">
              {Array.from({ length: 9 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={60 + i * 112}
                  cy={LIGNE - 90 + (i % 2) * 18}
                  rx="90"
                  ry="44"
                  fill="#EEF4FA"
                />
              ))}
              <text
                x="500"
                y={LIGNE - 84}
                textAnchor="middle"
                fontSize="30"
                fontWeight="800"
                fill="#8BA0B8"
                fontFamily="Baloo 2, sans-serif"
              >
                ~ brouillard ~
              </text>
            </g>
          )}

          {/* impacts dans l'eau */}
          {impacts.map((v, i) => (
            <g key={i} transform={`translate(${versX(item, v)} ${LIGNE - 22})`}>
              <Gerbe />
            </g>
          ))}

          {/* viseur */}
          {mode === 'tir' && xVise !== null && etat.type !== 'touche' && etat.type !== 'perdu' && (
            <g transform={`translate(${xVise} ${LIGNE})`}>
              <line x1="0" y1="-150" x2="0" y2="-24" stroke="#FF7A6B" strokeWidth="3" strokeDasharray="8 6" />
              <circle cx="0" cy="0" r="20" fill="none" stroke="#FF7A6B" strokeWidth="5" />
              <circle cx="0" cy="0" r="5" fill="#FF7A6B" />
            </g>
          )}
          {/* boulet de peinture */}
          {boulet && (
            <circle cx={boulet.x} cy={boulet.y} r="14" fill={peinture} stroke="#fff" strokeWidth="4" />
          )}
        </svg>
      </section>

      <div className="carte flex flex-col items-center gap-3 p-4">
        {mode === 'tir' && (etat.type === 'vise' || etat.type === 'rate' || etat.type === 'vol') && (
          <>
            {indice && (
              <p className="font-titre text-xl font-extrabold text-coral-dark" role="status">
                Raté de peu ! {indice}
              </p>
            )}
            {level === 'facile' && (
              <p className="text-center font-bold text-ink-soft">
                {vise !== null && (
                  <>
                    Ton viseur : <span className="font-titre text-xl text-ink">{ecrire(item, vise)}</span>{' '}
                    ·{' '}
                  </>
                )}
                Chaque petit trait vaut {ecrire({ ...item, display: '' }, sousPas(item))}.
              </p>
            )}
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche la ligne pour viser, ou utilise les flèches ← → (Maj pour aller plus vite).
            </p>
            <Button
              variant="coral"
              size="lg"
              onClick={feu}
              disabled={vise === null || etat.type === 'vol' || paused}
            >
              🎨 Feu !
            </Button>
          </>
        )}
        {mode === 'lecture' && lecture && etat.type !== 'touche' && (
          <ChoiceGrid
            choices={lecture.choix}
            onPick={lire}
            reveal={etat.type === 'perdu' ? { correct: lecture.bonne, chosen: choisi } : null}
            disabled={paused || verrou.current}
          />
        )}
        {etat.type === 'touche' && (
          <p className="text-center font-titre text-2xl font-extrabold text-grass-dark" role="status">
            {message}
          </p>
        )}
        <Correction
          ouvert={etat.type === 'perdu'}
          titre={mode === 'tir' ? 'Plouf, à côté ! Presque !' : 'Presque !'}
          bonne={item.display}
          aDire={`Le bateau était à ${lireValeur(item.display)}. ${item.explication}`}
          explication={item.explication}
          onContinuer={suivant}
        />
      </div>
    </div>
  );
}
