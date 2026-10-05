/**
 * La Pêche aux homophones (CATALOGUE n° 36).
 * Des poissons portent les homophones (a/à, et/est, son/sont, ces/ses…) ; on pêche celui qui
 * complète la phrase. L'astuce de substitution (`hint`, « remplace par avait ») est affichée.
 * Facile : 2 poissons lents, astuce toujours visible. Normal : tous les poissons, astuce sur demande.
 * Plus loin : poissons rapides, astuce seulement dans la correction.
 * Toucher un poisson ou taper 1-6 / A-F. Pause et « réduire les animations » : les poissons s'arrêtent.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import {
  type Trou,
  phraseALire,
  phraseComplete,
  reduireChoix,
  trouJuste,
  versTrou,
} from '../_orthographe-commun/trou';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const TRAVERSEE_S: Record<Level, number> = { facile: 10, normal: 7, plus_loin: 4.5 };
const COULEURS = ['#FF7A6B', '#FFD45C', '#8E7CFF', '#7BD389', '#4FC3F7', '#E0A458'];
const TOUCHES = ['a', 'b', 'c', 'd', 'e', 'f'];
const POISSON_L = 132;

const okItem = (it: Item) => {
  const t = versTrou(it);
  return !!t?.choix && it.kind === 'fill_blank';
};

function Poisson({ couleur, mot, sens }: { couleur: string; mot: string; sens: 1 | -1 }) {
  return (
    <div className="relative h-16" style={{ width: POISSON_L }}>
      <svg
        viewBox="0 0 132 64"
        className="absolute inset-0 h-full w-full"
        style={{ transform: `scaleX(${sens})` }}
        aria-hidden
      >
        <path d="M14 32 L-2 14 L2 32 L-2 50 Z" fill={couleur} transform="translate(4 0)" />
        <ellipse cx="68" cy="32" rx="56" ry="27" fill={couleur} />
        <path d="M60 6 Q72 -4 84 7" fill={couleur} />
        <ellipse cx="68" cy="40" rx="44" ry="12" fill="#fff" opacity="0.18" />
        <circle cx="108" cy="25" r="6" fill="#fff" />
        <circle cx="110" cy="25" r="3" fill="#24304A" />
        <path d="M118 36 Q122 38 118 40" stroke="#24304A" strokeWidth="2" fill="none" />
      </svg>
      <span className="absolute inset-y-0 left-6 right-8 flex items-center justify-center">
        <span className="rounded-full bg-white/95 px-2.5 py-0.5 font-titre text-xl font-extrabold text-ink shadow-pop-sm">
          {mot}
        </span>
      </span>
    </div>
  );
}

export default function PecheHomophones({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  const reduce = useReducedMotion();

  const tirer = useCallback((): Trou | null => {
    const it = tirerItem(stream, okItem);
    return it ? versTrou(it) : null;
  }, [stream]);

  const [trou, setTrou] = useState<Trou | null>(tirer);
  const [manche, setManche] = useState(1);
  const [astuce, setAstuce] = useState(level === 'facile');
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [seau, setSeau] = useState(0);
  const [fini, setFini] = useState(false);

  const mer = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(600);
  useLayoutEffect(() => {
    const el = mer.current;
    if (!el) return;
    const maj = () => setLargeur(el.clientWidth);
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const choix = useMemo(
    () => (trou?.choix ? reduireChoix(trou.choix, trou.reponse, level === 'facile' ? 2 : 6) : []),
    [trou, level],
  );

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && trou) void speech.speak(phraseALire(trou));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trou]);

  const pecher = useCallback(
    (i: number) => {
      if (!trou || etat || paused || fini) return;
      const mot = choix[i];
      if (mot === undefined) return;
      const juste = trouJuste(trou, mot);
      session.answer(trou.item, juste, mot, trou.reponse);
      setChoisi(i);
      setEtat(juste ? 'juste' : 'faux');
      if (juste) {
        sfx.play('juste');
        setSeau((s) => s + 1);
      } else {
        sfx.play('glisse');
        vibrate(40);
        setAstuce(true);
      }
    },
    [trou, etat, paused, fini, choix, session, sfx],
  );

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: seau >= Math.ceil(total / 2),
        headline: `${seau} poisson${seau > 1 ? 's' : ''} dans le seau !`,
        delayMs: 900,
      });
      return;
    }
    setTrou(tirer());
    setManche((m) => m + 1);
    setAstuce(level === 'facile');
    setEtat(null);
    setChoisi(null);
  }, [manche, total, seau, session, sfx, tirer, level]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1300);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  // Clavier : 1-6 ou A-F pour pêcher un poisson
  useEffect(() => {
    if (etat || paused || fini) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = TOUCHES.indexOf(e.key.toLowerCase());
      const j = Number(e.key) - 1;
      const k = i >= 0 ? i : Number.isInteger(j) && j >= 0 ? j : -1;
      if (k >= 0 && k < choix.length) {
        e.preventDefault();
        pecher(k);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, fini, choix, pecher]);

  if (!trou) {
    return (
      <div className="carte mx-auto max-w-md p-6 text-center">
        <p className="text-lg">Il n’y a pas encore de phrases à homophones dans cette leçon.</p>
      </div>
    );
  }

  const immobile = paused || !!reduce || !!etat;
  const course = Math.max(0, largeur - POISSON_L - 8);
  const hauteur = 96 + choix.length * 70;
  const motPeche = choisi !== null ? choix[choisi] : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          Phrase {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🪣</span> {seau} poisson{seau > 1 ? 's' : ''}
        </Hud>
      </div>

      {/* La phrase */}
      <section className="carte flex w-full flex-col items-center gap-3 p-4">
        <div className="flex items-center gap-3">
          <SpeakButton text={phraseALire(trou)} label="Écouter la phrase" />
          <p
            className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl"
            aria-live="polite"
          >
            {trou.avant}
            <span
              className={`mx-1 inline-flex min-w-[3ch] justify-center rounded-lg border-4 border-dashed px-2 ${
                etat === 'juste'
                  ? 'border-grass bg-grass/20 text-grass-dark'
                  : etat === 'faux'
                    ? 'border-coral bg-coral/10 text-coral-dark'
                    : 'border-sky bg-sky/10'
              }`}
              aria-label={etat === 'juste' ? (motPeche ?? '') : 'mot manquant'}
            >
              {etat === 'juste' ? motPeche : etat === 'faux' ? trou.reponse : '?'}
            </span>
            {trou.apres}
          </p>
        </div>
        {trou.astuce &&
          (astuce ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-2xl bg-sun/25 px-4 py-2 font-bold"
            >
              <Lightbulb className="shrink-0 text-sun-dark" aria-hidden />
              {trou.astuce}
              <SpeakButton text={trou.astuce} size={34} label="Écouter l’astuce" />
            </motion.p>
          ) : (
            level === 'normal' && (
              <Button
                variant="sun"
                icon={<Lightbulb aria-hidden />}
                onClick={() => setAstuce(true)}
                disabled={paused}
              >
                Astuce
              </Button>
            )
          ))}
      </section>

      {/* La mer */}
      <section
        ref={mer}
        className="relative w-full overflow-hidden rounded-card border-4 border-white shadow-soft"
        style={{
          height: hauteur,
          background: 'linear-gradient(180deg,#8FD3FF 0%,#8FD3FF 22%,#3BA7E0 23%,#1F78B4 100%)',
        }}
        aria-label="La mer : pêche le bon poisson"
      >
        {/* bateau et canne */}
        <svg
          viewBox="0 0 400 80"
          className="absolute left-0 top-0 h-20 w-full"
          preserveAspectRatio="xMidYMin meet"
          aria-hidden
        >
          <path d="M150 52 L250 52 L236 70 L164 70 Z" fill="#E0A458" />
          <rect x="196" y="20" width="4" height="34" fill="#8A5A3B" />
          <path d="M200 22 L232 46 L200 46 Z" fill="#FFF8EC" />
          <line x1="236" y1="54" x2="292" y2="10" stroke="#5A3D2B" strokeWidth="3" strokeLinecap="round" />
          <line x1="292" y1="10" x2="292" y2="80" stroke="#24304A" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
        <svg
          viewBox="0 0 400 20"
          className="absolute left-0 h-5 w-full"
          style={{ top: '19%' }}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0 Z"
            fill="#3BA7E0"
          />
        </svg>
        {/* bulles */}
        {!reduce &&
          [60, 180, 320].map((x, i) => (
            <motion.span
              key={i}
              className="absolute bottom-2 block h-3 w-3 rounded-full border-2 border-white/70"
              style={{ left: x }}
              animate={paused ? undefined : { y: [0, -hauteur * 0.6], opacity: [0.9, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}
              aria-hidden
            />
          ))}

        <div role="group" aria-label="Poissons" className="absolute inset-x-0 bottom-0" style={{ top: 92 }}>
          {choix.map((mot, i) => {
            const sens: 1 | -1 = i % 2 === 0 ? 1 : -1;
            const depart = ((i * 0.37) % 1) * course;
            const estChoisi = choisi === i;
            const estBon = etat && mot === trou.reponse;
            return (
              <motion.button
                key={`${manche}-${mot}`}
                type="button"
                onClick={() => pecher(i)}
                disabled={!!etat || paused || fini}
                aria-label={`Poisson ${i + 1} : ${mot}`}
                className={`absolute rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun ${
                  estBon && etat === 'faux' ? 'ring-4 ring-grass' : ''
                }`}
                style={{ top: i * 70, left: 0 }}
                initial={{ x: depart, opacity: 0 }}
                animate={
                  estChoisi && etat === 'juste'
                    ? { y: -i * 70 - 90, opacity: 0, rotate: -20 }
                    : estChoisi && etat === 'faux'
                      ? { y: 24, rotate: 15, opacity: 0.4 }
                      : immobile
                        ? { opacity: etat && !estBon ? 0.45 : 1 }
                        : {
                            x: sens === 1 ? [depart, course, 0, depart] : [depart, 0, course, depart],
                            opacity: 1,
                          }
                }
                transition={
                  estChoisi
                    ? { duration: 0.7 }
                    : immobile
                      ? { duration: 0.3 }
                      : { duration: TRAVERSEE_S[level] * 2, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                <span className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink font-titre text-sm font-bold text-white">
                  {i + 1}
                </span>
                <Poisson couleur={COULEURS[i % COULEURS.length]!} mot={mot} sens={sens} />
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {etat && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="carte w-full p-4">
            <Feedback
              state={etat}
              expected={phraseComplete(trou)}
              explication={[trou.astuce, trou.explication].filter(Boolean).join(' ')}
              onContinue={suivant}
              message={etat === 'juste' ? 'Belle prise ! 🐟' : 'Presque ! Ce poisson-là ne va pas.'}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
