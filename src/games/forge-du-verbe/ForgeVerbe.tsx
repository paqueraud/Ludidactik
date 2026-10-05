/**
 * La Forge du verbe (CATALOGUE n° 39) — conjugaison.
 * Une machine à sous à trois rouleaux (sujet | verbe | temps, champ `conjugaison` de l'item) tourne puis
 * s'arrête ; l'enfant forge la forme qui complète la phrase. Chaque forme juste = une pièce d'armure.
 * CM2 : la forme est décomposée en couleurs (radical, marque du temps, marque de la personne ;
 * auxiliaire + participe passé pour les temps composés).
 * Facile : choix parmi des formes (si l'item en propose) ou début de la forme donné.
 * Normal : on écrit la forme, un indice possible. Plus loin : on écrit, le métal refroidit (chrono), sans indice.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import { checkSpelling, normalizeText } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useAutoSpeak, useGameSession } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { type QuestionForge, decomposer, versForge } from '../_langue-commun/conjugaison';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { BarreTemps } from '../_nombres-commun/ui';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';
import { reduireChoix } from '../_orthographe-commun/trou';
import { CorrectionMot } from '../_orthographe-commun/ui';
import { Chevalier, PIECES } from './Chevalier';
import { FormeColoree } from './FormeColoree';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const CHRONO_MS: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 25_000 };
const SAISIE = /^[\p{L}'’\- ]$/u;
const ROULEAUX = ['Sujet', 'Verbe', 'Temps'] as const;

/** Un rouleau de la machine : fait défiler des valeurs puis s'arrête sur la bonne. */
function Rouleau({
  titre,
  valeur,
  tourne,
  pool,
  reduite,
}: {
  titre: string;
  valeur: string;
  tourne: boolean;
  pool: string[];
  reduite: boolean;
}) {
  const [affiche, setAffiche] = useState(valeur);
  useEffect(() => {
    if (!tourne || reduite || pool.length < 2) {
      setAffiche(valeur);
      return;
    }
    let k = 0;
    const t = setInterval(() => setAffiche(pool[k++ % pool.length]!), 85);
    return () => clearInterval(t);
  }, [tourne, valeur, pool, reduite]);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-sun">{titre}</span>
      <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border-4 border-[#5A3D2B] bg-gradient-to-b from-[#E9E1D2] via-white to-[#E9E1D2] shadow-inner sm:h-20">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={affiche}
            initial={reduite ? { opacity: 0 } : { y: -36, opacity: 0 }}
            animate={{ y: 0, opacity: tourne ? 0.55 : 1 }}
            exit={reduite ? { opacity: 0 } : { y: 36, opacity: 0 }}
            transition={{ duration: tourne ? 0.07 : 0.25 }}
            className={`truncate px-1 font-titre text-lg font-extrabold sm:text-2xl ${tourne ? 'blur-[1px]' : ''}`}
          >
            {affiche}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function verifier(q: QuestionForge, donne: string): { juste: boolean; message: string } {
  const d = normalizeText(donne);
  if (!d) return { juste: false, message: 'Presque !' };
  let accent = false;
  for (const a of q.acceptees) {
    const r = checkSpelling(d, a);
    if (r.correct) return { juste: true, message: 'Bravo !' };
    if (r.verdict === 'accent') accent = true;
  }
  return {
    juste: false,
    message: accent ? 'Presque ! Toutes les lettres sont là, mais attention à l’accent.' : 'Presque ! Regarde bien la forme.',
  };
}

export default function ForgeVerbe({
  level,
  lesson,
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
  const reduite = !!useReducedMotion();
  const rng = useRng();
  const couleurs = lesson.classe === 'CM2' || lesson.classe === 'CM1';

  // Les questions de la partie (et les valeurs qui défilent sur les rouleaux)
  const questions = useMemo(() => {
    const items = collecterItems(stream, (x) => versForge(x) !== null, total);
    return rng.shuffle(items).map((it) => versForge(it)!);
  }, [stream, total, rng]);
  const pools = useMemo(
    () => [
      [...new Set(questions.map((q) => q.sujet))],
      [...new Set(questions.map((q) => q.verbe))],
      [...new Set(questions.map((q) => q.temps))],
    ],
    [questions],
  );

  const [manche, setManche] = useState(1);
  const q: QuestionForge | null = questions.length ? questions[(manche - 1) % questions.length]! : null;
  const [tourne, setTourne] = useState([true, true, true]);
  const [saisie, setSaisie] = useState('');
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [donne, setDonne] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [indice, setIndice] = useState(level === 'facile');
  const [pieces, setPieces] = useState(0);
  const [fini, setFini] = useState(false);

  const choixFacile = level === 'facile' && !!q?.choix;
  const choix = useMemo(() => (q?.choix ? reduireChoix(q.choix, q.reponse, 3, rng.next) : []), [q, rng]);
  const pret = !tourne.some(Boolean);

  // Les rouleaux tournent puis s'arrêtent un par un (tout de suite si animations réduites ou pause)
  useEffect(() => {
    if (!q) return;
    if (reduite || paused) {
      setTourne([false, false, false]);
      return;
    }
    setTourne([true, true, true]);
    sfx.play('glisse');
    const timers = [0, 1, 2].map((i) =>
      setTimeout(
        () => {
          setTourne((t) => t.map((v, j) => (j === i ? false : v)));
          sfx.play('tic');
        },
        550 + i * 380,
      ),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manche, questions]);

  useEffect(() => {
    if (pret) session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, manche]);

  const aLire = q
    ? `${q.sujet ? `${q.sujet}, ` : ''}verbe ${q.verbe}, ${q.temps}. ${`${q.avant} … ${q.apres}`.replace(/\s+/g, ' ').trim()}`
    : null;
  useAutoSpeak(speech, pret ? aLire : null, `${manche}-${pret}`, lectureAuto && !paused);

  const morceaux = useMemo(() => (q ? decomposer(q.reponse, q.temps, q.sujet, q.verbe) : null), [q]);
  const debut = useMemo(() => {
    if (!q) return '';
    if (morceaux && morceaux[0]?.role === 'auxiliaire') return morceaux[0].texte;
    if (morceaux && morceaux[0]?.role === 'radical') return morceaux[0].texte;
    return q.reponse.slice(0, Math.ceil(q.reponse.length / 2));
  }, [q, morceaux]);

  const repondre = useCallback(
    (valeur: string, tempsEcoule = false) => {
      if (!q || etat !== 'jeu' || paused || fini || !pret) return;
      if (!valeur.trim() && !tempsEcoule) return;
      const v = verifier(q, valeur);
      session.answer(q.item, v.juste, valeur || '(temps écoulé)', q.reponse);
      setDonne(valeur);
      setMessage(tempsEcoule && !valeur.trim() ? 'Le métal a refroidi ! On réessaie au prochain tour.' : v.message);
      if (v.juste) {
        sfx.play('piece');
        setPieces((p) => p + 1);
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(50);
        setEtat('faux');
      }
    },
    [q, etat, paused, fini, pret, session, sfx],
  );

  const restant = useCompteARebours({
    actif: etat === 'jeu' && pret && Number.isFinite(CHRONO_MS[level]),
    dureeMs: CHRONO_MS[level],
    paused,
    cle: manche,
    onFin: () => repondre(saisie, true),
  });

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: pieces >= Math.ceil(total * 0.6),
        headline:
          pieces >= PIECES.length
            ? 'Ton chevalier a toute son armure ! ⚔️'
            : `${pieces} pièce${pieces > 1 ? 's' : ''} d’armure forgée${pieces > 1 ? 's' : ''} !`,
        delayMs: 900,
      });
      return;
    }
    setManche((m) => m + 1);
    setSaisie('');
    setEtat('jeu');
    setDonne(null);
    setIndice(level === 'facile');
  }, [manche, total, pieces, session, sfx, level]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, couleurs && morceaux ? 2400 : 1500);
    return () => clearTimeout(t);
  }, [etat, paused, suivant, couleurs, morceaux]);

  const saisieActive = etat === 'jeu' && pret && !paused && !fini && !choixFacile;
  usePhysicalKeyboard(
    {
      onKey: (k) => setSaisie((s) => (s.length < 30 ? s + k : s)),
      onDelete: () => setSaisie((s) => s.slice(0, -1)),
      onSubmit: () => repondre(saisie),
      disabled: !saisieActive,
    },
    SAISIE,
  );

  if (!q) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de verbes à conjuguer pour la forge."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const valeursRouleaux = [q.sujet || '—', q.verbe, q.temps];
  const contenuTrou = etat === 'jeu' ? saisie : etat === 'juste' ? (donne ?? q.reponse) : q.reponse;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      {/* La forge et le chevalier */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[36%] lg:self-start"
        style={{ background: 'radial-gradient(circle at 70% 85%, #FFB46B 0%, #E0A458 25%, #6B4A3A 70%, #3E2C26 100%)' }}
        aria-label="La forge du chevalier"
      >
        <div className="flex h-[200px] items-end justify-center gap-4 pb-3 pt-10 sm:h-[300px]">
          <Chevalier pieces={pieces} reduite={reduite} content={etat === 'juste'} />
        </div>
        <svg viewBox="0 0 100 40" className="absolute bottom-2 right-3 w-20" aria-hidden>
          <path d="M10 14 H90 L80 24 H60 V36 H40 V24 H20 Z" fill="#3A3F4B" />
          <path d="M14 14 H86 L84 17 H16 Z" fill="#5A6070" />
        </svg>
        <div className="absolute left-2 top-2 flex flex-wrap gap-2">
          <Hud>
            ⚒️ {Math.min(manche, total)} / {total}
          </Hud>
          <Hud>🛡️ {pieces}</Hud>
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        {/* La machine à sous */}
        <div className="relative w-full max-w-xl rounded-[1.75rem] bg-gradient-to-b from-[#8A5A3B] to-[#5A3D2B] p-3 pr-10 shadow-pop">
          <div className="flex gap-2">
            {ROULEAUX.map((t, i) => (
              <Rouleau key={t} titre={t} valeur={valeursRouleaux[i]!} tourne={tourne[i]!} pool={pools[i]!} reduite={reduite} />
            ))}
          </div>
          <motion.div
            className="absolute right-2 top-4 flex flex-col items-center"
            animate={!pret && !reduite ? { rotate: [0, 35, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformOrigin: '50% 90%' }}
            aria-hidden
          >
            <span className="h-5 w-5 rounded-full bg-coral shadow-pop-sm" />
            <span className="h-14 w-1.5 rounded bg-[#C9D3E3]" />
          </motion.div>
        </div>

        {/* La phrase */}
        <div className="flex items-start justify-center gap-3">
          {aLire && <SpeakButton text={aLire} label="Écouter la phrase" />}
          <p className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl" aria-live="polite">
            {q.avant}
            <span
              className={`mx-1 inline-block min-w-[4ch] rounded-lg border-b-4 px-1 text-center ${
                etat === 'juste'
                  ? 'border-grass bg-grass/20 text-grass-dark'
                  : etat === 'faux'
                    ? 'border-coral bg-sun/40'
                    : 'border-dashed border-coral'
              }`}
            >
              {contenuTrou || ' '}
            </span>
            {q.apres}
          </p>
        </div>

        {level === 'plus_loin' && etat === 'jeu' && pret && <BarreTemps reste={restant} label="Le métal refroidit" />}

        {etat === 'jeu' && pret && (
          <>
            {indice && !choixFacile ? (
              <p className="flex items-center gap-2 rounded-2xl bg-sun/25 px-4 py-2 font-bold">
                <Lightbulb className="shrink-0 text-sun-dark" aria-hidden />
                La forme commence par : « {debut}… »
              </p>
            ) : (
              level === 'normal' && (
                <Button variant="sun" icon={<Lightbulb aria-hidden />} onClick={() => setIndice(true)} disabled={paused}>
                  Indice
                </Button>
              )
            )}
            {choixFacile ? (
              <ChoiceGrid choices={choix} onPick={(i) => repondre(choix[i]!)} disabled={paused} />
            ) : (
              <LetterKeyboard
                onKey={(k) => setSaisie((s) => (s.length < 30 ? s + k : s))}
                onDelete={() => setSaisie((s) => s.slice(0, -1))}
                onSubmit={() => repondre(saisie)}
                disabled={!saisieActive}
              />
            )}
          </>
        )}

        <AnimatePresence>
          {etat === 'juste' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2" role="status">
              <p className="font-titre text-2xl font-extrabold text-grass-dark">
                Forgé&nbsp;! {pieces <= PIECES.length ? `Nouvelle pièce : ${PIECES[pieces - 1]} 🛡️` : 'Ton chevalier brille ! ✨'}
              </p>
              {couleurs && morceaux && <FormeColoree morceaux={morceaux} sujet={q.sujet} />}
            </motion.div>
          )}
          {etat === 'faux' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              {choixFacile ? (
                <Feedback state="faux" expected={q.reponse} explication={q.item.explication} onContinue={suivant} message={message} />
              ) : (
                <CorrectionMot
                  donne={donne}
                  attendu={q.reponse}
                  message={message}
                  explication={q.item.explication}
                  onContinue={suivant}
                >
                  {couleurs && morceaux && <FormeColoree morceaux={morceaux} sujet={q.sujet} />}
                </CorrectionMot>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
