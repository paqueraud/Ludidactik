/**
 * Le Détective du texte (CATALOGUE n° 46) — compréhension, justifier par retour au texte (BO).
 * Un « dossier » = un court texte (`meta.texte`, `meta.titre`) et ses questions (QCM). Le bouton 🔊 lit
 * tout le texte ; le mode écoute le cache (compréhension orale). La loupe surligne la phrase-preuve
 * (`meta.preuve`). Après une bonne réponse, le détective doit retrouver la preuve dans le texte.
 * Facile : 3 choix au plus, loupe illimitée, la preuve s'affiche toute seule.
 * Normal : une loupe par texte, puis « Trouve la preuve » (bonus). Plus loin : pas de loupe, preuve à trouver.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EarOff, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useAutoSpeak, useGameSession } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { reduireChoix } from '../_orthographe-commun/trou';
import { aUnTexte, planEnquete, regrouper } from './dossiers';

const QUESTIONS: Record<Level, number> = { facile: 5, normal: 7, plus_loin: 9 };
const LOUPES: Record<Level, number> = { facile: Infinity, normal: 1, plus_loin: 0 };

type Etat = 'question' | 'preuve' | 'juste' | 'faux';

/** Petite loupe de détective (décor). */
function Loupe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="26" cy="26" r="17" fill="#DDF3FF" stroke="#8A5A3B" strokeWidth="6" />
      <path d="M17 20 Q22 13 30 13" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="38" y="36" width="10" height="24" rx="5" transform="rotate(-45 43 48)" fill="#5A3D2B" />
    </svg>
  );
}

export default function DetectiveTexte({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();

  const dossiers = useMemo(() => regrouper(collecterItems(stream, aUnTexte, 40)), [stream]);
  const plan = useMemo(() => planEnquete(dossiers, parNiveau(level, QUESTIONS)), [dossiers, level]);
  const total = plan.length;

  const [n, setN] = useState(0);
  const [etat, setEtat] = useState<Etat>('question');
  const [choisi, setChoisi] = useState<number | null>(null);
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupes, setLoupes] = useState(LOUPES[level]);
  const [phraseTouchee, setPhraseTouchee] = useState<number | null>(null);
  const [ecoute, setEcoute] = useState(false);
  const [preuves, setPreuves] = useState(0);
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);
  const score = useRef(0);

  const etape = plan[n];
  const dossier = etape ? dossiers[etape.dossier]! : null;
  const q = etape && dossier ? dossier.questions[etape.question]! : null;

  // Choix affichés (Facile : 3 au plus) et index de la bonne réponse
  const choix = useMemo(() => {
    if (!q) return { liste: [] as string[], bonne: -1 };
    const bonneTexte = q.item.choices[q.item.answerIndex]!;
    const liste = level === 'facile' ? reduireChoix(q.item.choices, bonneTexte, 3, rng.next) : q.item.choices;
    return { liste, bonne: liste.indexOf(bonneTexte) };
  }, [q, level, rng]);

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  useAutoSpeak(speech, q?.item.spoken ?? q?.item.question ?? null, n, lectureAuto && !paused);

  // Nouveau texte : on recharge la loupe
  const dossierIndex = etape?.dossier ?? -1;
  useEffect(() => {
    setLoupes(LOUPES[level]);
  }, [dossierIndex, level]);

  const repondre = useCallback(
    (i: number) => {
      if (!q || etat !== 'question' || paused || fini) return;
      const juste = i === choix.bonne;
      session.answer(q.item, juste, choix.liste[i] ?? '', choix.liste[choix.bonne] ?? '');
      setChoisi(i);
      speech.stop();
      if (juste) {
        sfx.play('juste');
        setJustes((j) => j + 1);
        score.current += 100;
        // Normal et Plus loin : on justifie par le texte (si l'item donne sa preuve)
        if (level !== 'facile' && q.preuve >= 0 && !ecoute) setEtat('preuve');
        else setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(50);
        setEtat('faux');
      }
    },
    [q, etat, paused, fini, choix, session, speech, sfx, level, ecoute],
  );

  const toucherPhrase = useCallback(
    (i: number) => {
      if (!q || etat !== 'preuve' || paused) return;
      setPhraseTouchee(i);
      if (i === q.preuve) {
        sfx.play('etoile');
        setPreuves((p) => p + 1);
        score.current += 50;
      } else {
        sfx.play('glisse');
      }
      setEtat('juste');
    },
    [q, etat, paused, sfx],
  );

  const suivant = useCallback(() => {
    if (n + 1 >= total) {
      setFini(true);
      sfx.play('fanfare');
      const reussi = justes >= Math.ceil(total * 0.6);
      session.end({
        won: reussi,
        headline: reussi
          ? `Enquête résolue ! ${preuves} preuve${preuves > 1 ? 's' : ''} trouvée${preuves > 1 ? 's' : ''} 🔎`
          : `${justes} bonne${justes > 1 ? 's' : ''} réponse${justes > 1 ? 's' : ''} sur ${total}`,
        score: score.current,
        delayMs: 900,
      });
      return;
    }
    setN((x) => x + 1);
    setEtat('question');
    setChoisi(null);
    setLoupeActive(false);
    setPhraseTouchee(null);
  }, [n, total, justes, preuves, session, sfx]);

  // Bonne réponse (et preuve trouvée, ou pas de preuve demandée) : on enchaîne tout seul
  const preuveRatee = etat === 'juste' && phraseTouchee !== null && phraseTouchee !== q?.preuve;
  useEffect(() => {
    if (etat !== 'juste' || paused || preuveRatee) return;
    const t = setTimeout(suivant, 1800);
    return () => clearTimeout(t);
  }, [etat, paused, preuveRatee, suivant]);

  if (!q || !dossier || !total) {
    return (
      <PasDExercice
        texte="Il faut des textes avec leurs questions pour mener l’enquête."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const montrerPreuve =
    q.preuve >= 0 &&
    (loupeActive || etat === 'faux' || (etat === 'juste' && (level === 'facile' || phraseTouchee !== null)));
  const peutLoupe = q.preuve >= 0 && etat === 'question' && loupes > 0 && !loupeActive && !ecoute;
  const texteLu = `${dossier.titre}. ${dossier.texte}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row lg:items-start">
      {/* Le dossier : le texte */}
      <section
        className="relative rounded-card border-4 border-white bg-[#FFF3D6] p-4 shadow-soft lg:w-[48%] sm:p-5"
        aria-label={`Texte : ${dossier.titre}`}
      >
        <div className="absolute -top-3 left-6 h-6 w-20 rounded-t-xl bg-[#F2D9A6]" aria-hidden />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SpeakButton text={texteLu} label="Écouter tout le texte" />
          <h2 className="min-w-[9rem] flex-1 font-titre text-2xl font-extrabold leading-tight">{dossier.titre}</h2>
          <Button
            variant={ecoute ? 'grape' : 'blanc'}
            icon={ecoute ? <EarOff aria-hidden /> : <span aria-hidden>🎧</span>}
            onClick={() => setEcoute((e) => !e)}
            aria-pressed={ecoute}
            className="!min-h-[48px] !px-3 text-base"
          >
            {ecoute ? 'Montrer le texte' : 'Mode écoute'}
          </Button>
        </div>

        {ecoute && etat !== 'faux' && etat !== 'preuve' ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/70 p-6 text-center">
            <span className="text-5xl" aria-hidden>
              🎧
            </span>
            <p className="font-bold">Le texte est caché : écoute-le avec le haut-parleur jaune !</p>
          </div>
        ) : (
          <p className="text-lg leading-relaxed sm:text-xl" aria-live="off">
            {dossier.phrases.map((ph, i) => {
              const estPreuve = montrerPreuve && i === q.preuve;
              const touchee = phraseTouchee === i;
              const classe = estPreuve
                ? 'bg-sun/80 ring-2 ring-sun-dark'
                : touchee
                  ? 'bg-coral/20'
                  : etat === 'preuve'
                    ? 'bg-white/80 hover:bg-sky/20'
                    : '';
              const contenu = (
                <motion.span
                  className={`rounded-md px-0.5 transition-colors ${classe}`}
                  animate={estPreuve && !reduite ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {ph.texte}
                </motion.span>
              );
              return (
                <span key={i}>
                  {etat === 'preuve' ? (
                    <button
                      type="button"
                      className="inline rounded-md text-left underline decoration-sky decoration-dotted underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky"
                      onClick={() => toucherPhrase(i)}
                      aria-label={`Phrase ${i + 1} : ${ph.texte}`}
                    >
                      {contenu}
                    </button>
                  ) : (
                    contenu
                  )}{' '}
                </span>
              );
            })}
          </p>
        )}
        <Loupe className="pointer-events-none absolute -bottom-4 right-0 h-16 w-16 rotate-12 drop-shadow" />
      </section>

      {/* La question */}
      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Hud>
            🔎 Question {n + 1} / {total}
          </Hud>
          <Hud>
            🗂️ {preuves} preuve{preuves > 1 ? 's' : ''}
          </Hud>
        </div>

        <div className="flex items-start justify-center gap-3">
          <SpeakButton text={q.item.spoken ?? q.item.question} label="Écouter la question" />
          <p className="text-center font-titre text-2xl font-extrabold leading-snug" aria-live="polite">
            {q.item.question}
          </p>
        </div>

        <ChoiceGrid
          choices={choix.liste}
          onPick={repondre}
          reveal={etat === 'question' ? null : { correct: choix.bonne, chosen: choisi }}
          disabled={paused || etat !== 'question'}
        />

        {etat === 'question' && q.preuve >= 0 && LOUPES[level] > 0 && (
          <Button
            variant="sun"
            icon={<Search aria-hidden />}
            onClick={() => {
              setLoupeActive(true);
              setLoupes((l) => l - 1);
              sfx.play('pop');
            }}
            disabled={!peutLoupe || paused}
          >
            Loupe : où est la réponse ?{Number.isFinite(loupes) ? ` (${Math.max(0, loupes)})` : ''}
          </Button>
        )}

        <AnimatePresence mode="wait">
          {etat === 'preuve' && (
            <motion.div
              key="preuve"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl bg-grass/15 p-4 text-center"
              role="status"
            >
              <p className="font-titre text-xl font-extrabold text-grass-dark">Bonne réponse !</p>
              <p className="mt-1 font-bold">
                Un vrai détective le prouve : touche, dans le texte, la phrase qui donne la réponse.
              </p>
              <Button variant="blanc" className="mt-3" onClick={() => setEtat('juste')}>
                Passer
              </Button>
            </motion.div>
          )}
          {etat === 'juste' && (
            <motion.div key="juste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              {preuveRatee ? (
                <Feedback
                  state="faux"
                  message="Ta réponse est juste ! La preuve était dans la phrase en jaune."
                  explication={q.item.explication}
                  onContinue={suivant}
                />
              ) : (
                <Feedback
                  state="juste"
                  message={phraseTouchee === q.preuve && phraseTouchee !== null ? 'Preuve trouvée, bravo détective ! 🔎' : 'Bravo !'}
                />
              )}
            </motion.div>
          )}
          {etat === 'faux' && (
            <motion.div key="faux" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <Feedback
                state="faux"
                expected={choix.liste[choix.bonne]}
                explication={
                  q.preuve >= 0 ? `${q.item.explication} Relis la phrase en jaune dans le texte.` : q.item.explication
                }
                onContinue={suivant}
                message="Presque !"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
