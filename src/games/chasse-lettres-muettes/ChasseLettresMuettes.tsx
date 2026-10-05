/**
 * La Chasse aux lettres muettes (CATALOGUE n° 35) — BO CE1 : « chan_ » → t grâce à « chanter ».
 * La nuit, la lampe de poche éclaire un mot dont la dernière lettre dort (elle est muette).
 * Le mot de la même famille (`meta.famille`) la « réveille » : on l'entend.
 * Facile : 2 choix, le mot de la famille est montré tout de suite avec la lettre surlignée.
 * Normal : tous les choix, la lampe (mot de la famille) sur demande.
 * Plus loin : il faut écrire la lettre au clavier, sans la lampe (montrée après la réponse).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Flashlight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import { decouperFamille } from './famille';
import {
  type Trou,
  phraseALire,
  phraseComplete,
  reduireChoix,
  trouJuste,
  versTrou,
} from '../_orthographe-commun/trou';
import { TOUCHES_LETTRES } from '../_orthographe-commun/voix';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };

function MotFamille({ t, surligne }: { t: Trou; surligne: boolean }) {
  const d = decouperFamille(t);
  return (
    <span className="font-titre text-2xl font-extrabold">
      {d && surligne ? (
        <>
          {d.avant}
          <motion.span
            className="rounded-md bg-sun px-1 text-ink"
            initial={{ scale: 0.6 }}
            animate={{ scale: [1.3, 1] }}
            transition={{ duration: 0.5 }}
          >
            {d.lettre}
          </motion.span>
          {d.apres}
        </>
      ) : (
        t.famille
      )}
    </span>
  );
}

/** Le décor de nuit : la lampe de poche éclaire le mot. */
function Nuit({ lanternes, total, paused }: { lanternes: number; total: number; paused: boolean }) {
  const reduce = useReducedMotion() || paused;
  return (
    <svg viewBox="0 0 400 90" className="block w-full" aria-hidden>
      <rect width="400" height="90" fill="#1F2840" />
      {[
        [30, 18],
        [80, 40],
        [140, 14],
        [200, 30],
        [260, 12],
        [320, 36],
        [370, 20],
      ].map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="1.8"
          fill="#fff"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity }}
        />
      ))}
      <circle cx="350" cy="22" r="12" fill="#FFF1C9" />
      <circle cx="356" cy="18" r="11" fill="#1F2840" />
      {/* lanternes : une par lettre trouvée */}
      {Array.from({ length: total }, (_, i) => {
        const x = 20 + (i * 360) / Math.max(1, total - 1);
        const allumee = i < lanternes;
        return (
          <g key={i} transform={`translate(${x} 62)`}>
            <line x1="0" y1="-14" x2="0" y2="-6" stroke="#8A93A8" strokeWidth="1.5" />
            {allumee && <circle r="13" fill="#FFD45C" opacity="0.3" />}
            <rect
              x="-6"
              y="-6"
              width="12"
              height="16"
              rx="4"
              fill={allumee ? '#FFD45C' : '#3A4766'}
              stroke="#8A93A8"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function ChasseLettresMuettes({
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
  useVoixEnPause(paused, speech);

  const tirer = useCallback((): Trou | null => {
    const avecFamille = tirerItem(stream, (it: Item) => !!versTrou(it)?.famille);
    const it = avecFamille ?? tirerItem(stream, (x: Item) => !!versTrou(x));
    return it ? versTrou(it) : null;
  }, [stream]);

  const [trou, setTrou] = useState<Trou | null>(tirer);
  const [manche, setManche] = useState(1);
  const [lampe, setLampe] = useState(level === 'facile');
  const [saisie, setSaisie] = useState('');
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [trouvees, setTrouvees] = useState(0);
  const [fini, setFini] = useState(false);

  const ecrit = level === 'plus_loin' || !trou?.choix;
  const choix = useMemo(() => {
    if (!trou?.choix) return [];
    return level === 'facile'
      ? reduireChoix(trou.choix, trou.reponse, 2)
      : reduireChoix(trou.choix, trou.reponse, 6);
  }, [trou, level]);

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && trou) void speech.speak(phraseALire(trou));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trou]);

  const repondre = (donne: string, index: number | null) => {
    if (!trou || etat || paused || !donne.trim()) return;
    const juste = trouJuste(trou, donne);
    session.answer(trou.item, juste, donne, trou.reponse);
    setChoisi(index);
    setEtat(juste ? 'juste' : 'faux');
    setLampe(true);
    if (juste) {
      sfx.play('etoile');
      setTrouvees((n) => n + 1);
    } else {
      sfx.play('faux');
      vibrate(40);
    }
  };

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: trouvees >= Math.ceil(total / 2),
        headline: `${trouvees} lanterne${trouvees > 1 ? 's' : ''} allumée${trouvees > 1 ? 's' : ''} sur ${total} !`,
        delayMs: 900,
      });
      return;
    }
    setTrou(tirer());
    setManche((m) => m + 1);
    setLampe(level === 'facile');
    setSaisie('');
    setEtat(null);
    setChoisi(null);
  }, [manche, total, trouvees, session, sfx, tirer, level]);

  // Juste : on enchaîne tout seul après avoir vu le mot de la famille
  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, trou?.famille ? 1800 : 1100);
    return () => clearTimeout(t);
  }, [etat, paused, suivant, trou]);

  usePhysicalKeyboard(
    {
      onKey: (k) => ecrit && !etat && setSaisie((v) => (v.length < 6 ? v + k : v)),
      onDelete: () => ecrit && !etat && setSaisie((v) => v.slice(0, -1)),
      onSubmit: () => ecrit && !etat && repondre(saisie, null),
      disabled: paused || fini || !ecrit,
    },
    TOUCHES_LETTRES,
  );

  if (!trou) {
    return (
      <div className="carte mx-auto max-w-md p-6 text-center">
        <p className="text-lg">Il n’y a pas encore de mots à lettre muette dans cette leçon.</p>
      </div>
    );
  }

  const remplie = etat
    ? etat === 'juste'
      ? choisi !== null
        ? choix[choisi]!
        : saisie
      : trou.reponse
    : ecrit
      ? saisie
      : '';

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          Mot {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🏮</span> {trouvees}
        </Hud>
      </div>

      <section
        className="w-full overflow-hidden rounded-card border-4 border-white shadow-soft"
        aria-label={`${trouvees} lanternes allumées`}
      >
        <Nuit lanternes={trouvees} total={total} paused={paused} />
        <div
          className="relative flex flex-col items-center gap-3 px-4 pb-6 pt-4"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #FFF6D6 0%, #F7E7B0 35%, #2B3550 75%)' }}
        >
          <div className="flex items-center gap-3">
            <SpeakButton text={phraseALire(trou)} label="Écouter le mot" />
            <p
              className="text-center font-titre text-4xl font-extrabold text-ink sm:text-5xl"
              aria-live="polite"
            >
              {trou.avant}
              <span
                className={`mx-0.5 inline-flex min-w-[2.2ch] items-center justify-center rounded-lg border-4 border-dashed px-1 ${
                  etat === 'juste'
                    ? 'border-grass bg-grass/30 text-grass-dark'
                    : etat === 'faux'
                      ? 'border-coral bg-coral/15 text-coral-dark'
                      : 'border-grape bg-white/70 text-grape'
                }`}
                aria-label={remplie ? `lettre ${remplie}` : 'lettre cachée'}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={remplie || 'cachee'}
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    {remplie || <span aria-hidden>?</span>}
                  </motion.span>
                </AnimatePresence>
              </span>
              {trou.apres}
            </p>
          </div>
          <p className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold">
            {trou.famille ? 'Quelle lettre dort à la fin du mot ?' : 'Complète le mot.'}
          </p>

          {/* La lampe : le mot de la même famille */}
          {trou.famille && (
            <div className="flex min-h-[3.5rem] items-center gap-2">
              {lampe || etat ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-2 shadow-pop-sm"
                >
                  <Flashlight className="text-grape" aria-hidden />
                  <span>Pense à</span>
                  <MotFamille t={trou} surligne={!!etat} />
                  <SpeakButton text={trou.famille} size={36} label={`Écouter : ${trou.famille}`} />
                </motion.div>
              ) : (
                level === 'normal' && (
                  <Button
                    variant="sun"
                    icon={<Flashlight aria-hidden />}
                    onClick={() => setLampe(true)}
                    disabled={paused}
                  >
                    Allumer la lampe (mot de la famille)
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="carte flex w-full flex-col items-center gap-3 p-4">
        {!ecrit && (
          <ChoiceGrid
            choices={choix}
            onPick={(i) => repondre(choix[i]!, i)}
            reveal={etat ? { correct: choix.indexOf(trou.reponse), chosen: choisi } : null}
            disabled={paused || fini}
          />
        )}
        {ecrit && !etat && (
          <>
            <div
              className="flex min-h-[4rem] w-full max-w-xs items-center justify-center rounded-2xl border-4 border-grape bg-cream font-titre text-4xl font-extrabold"
              aria-label={`Ta lettre : ${saisie || 'rien pour l’instant'}`}
            >
              {saisie}
              <span className="ml-0.5 inline-block h-9 w-1 animate-pulse bg-ink/40" aria-hidden />
            </div>
            <LetterKeyboard
              onKey={(k) => setSaisie((v) => (v.length < 6 ? v + k : v))}
              onDelete={() => setSaisie((v) => v.slice(0, -1))}
              onSubmit={() => repondre(saisie, null)}
              disabled={paused || fini}
            />
          </>
        )}
        <Feedback
          state={etat}
          expected={phraseComplete(trou)}
          explication={`${
            trou.famille
              ? decouperFamille(trou)
                ? `On entend « ${decouperFamille(trou)!.lettre} » dans « ${trou.famille} ». `
                : `Pense à « ${trou.famille} », un mot de la même famille. `
              : ''
          }${trou.explication}`}
          onContinue={suivant}
          message={
            etat === 'juste'
              ? `Bravo ! On écrit « ${phraseComplete(trou)} ».`
              : trou.famille
                ? `Presque ! La lettre muette est « ${trou.reponse} ».`
                : 'Presque !'
          }
        />
      </section>
    </div>
  );
}
